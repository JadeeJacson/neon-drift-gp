@tool
extends SceneTree
## 战斗闭环冒烟：真的加载主场景、真的开局、真的出怪、真的打死、真的清波到胜负结算。
## 为什么需要它：`--headless --quit` 只跑到各节点的 _ready（「能开机」）；
## sim 的 516 条断言只证明纯逻辑对。中间那层——场景装配、射线命中、状态机接线、
## 死亡与结算——必须有个东西在无人值守时跑一遍（docs/00 §4.3 流程验证的最小实现）。
##
## 用法（lab 根）：
##   godot --headless --path projects/10-solar-wing -s res://tools/smoke_battle.gd
##
## 注意：脚本模式的 SceneTree 必须显式 quit()，否则进程永不退出（06 §5.0b 第 6 条）。

const MAX_FRAMES := 1200

var _fails := 0
var _checks := 0
var _kills_before := 0


func _initialize() -> void:
	print("=== 10 战斗闭环冒烟 ===")
	var main := _load_main()
	root.add_child(main)
	await _frames(3)

	var gr := main as GameRoot
	_check(gr != null, "主场景是 GameRoot")
	if gr == null:
		_done()
		return

	# 0) 装配完整性
	_check(gr.state == GameRoot.State.MENU, "初始状态 MENU")
	_check(gr.player != null and gr.player.vitals != null, "Player/Vitals 就位")
	_check(gr.player.weapon != null, "Weapon 挂在玩家下")
	_check(gr.director != null and gr.director.waves.size() == WaveTable.WAVE_COUNT, "导演 5 波计划就位")
	_check(gr.hud != null, "HUD 就位")
	_check(gr.bgm != null and gr.bgm.stream != null, "BGM 菜单轨已开")
	_check(gr.camera_rig != null and gr.camera_rig.camera != null, "相机就位")
	_check(gr.world != null, "太空世界就位")
	var planets := gr.world.get_node_or_null(^"Planets")
	var planet_count := planets.get_child_count() if planets != null else 0
	_check(planet_count >= 6, "行星 ≥6（实测 %d）" % planet_count)
	_check(gr.world.get_node_or_null(^"Sun/KeyLight") != null, "恒星定向光在位")
	_check(gr.world.get_node_or_null(^"Asteroids") != null, "小行星带在位")
	_check(not gr.hud.crosshair.visible, "菜单阶段准星隐藏")
	_check(gr.hud.menu_layer.visible, "菜单覆盖层可见")
	if _fails > 0:
		_done()
		return

	# 1) 开局
	gr.start_game()
	_check(gr.state == GameRoot.State.PLAYING, "start_game 进入 PLAYING")
	_check(gr.hud.menu_layer.visible == false, "开局后菜单收起")
	_check(gr.bgm._current == "combat", "BGM 切战斗轨")

	# 2) 出怪
	var enemy := await _wait_first_spawn(gr)
	_check(enemy != null, "首波已出怪")
	if enemy == null:
		_done()
		return
	_check(enemy.is_in_group("enemies"), "敌机已加入 enemies 组")

	# 3) 敌机会开火（摆在 60 m 外准星上，等它反击）
	var cam := gr.camera_rig.camera
	enemy.global_position = cam.global_position + (-cam.global_basis.z) * 60.0
	var shot_back := await _wait_until(_shot_back(gr), 900)
	_check(shot_back, "敌机开火/命中（投射物 %d，护盾 %.0f）" % [
		gr.projectiles.get_child_count(), gr.player.vitals.shield])

	# 4) 玩家开火并击杀：Input 走真实通路（action → player._physics → weapon.tick）。
	# 目标每帧钉回准星轴上——敌机 AI 会侧移躲避，不钉住的话射线打不中（实测 hits=1/59）。
	_kills_before = gr.kills
	Input.action_press("fire_primary")
	var killed := await _wait_until(_pin_and_kill(gr, cam), 1800)
	Input.action_release("fire_primary")
	_check(killed, "持续开火击杀敌机（kills=%d score=%d shots=%d hits=%d live=%d hp=%s）" % [
		gr.kills, gr.score, gr.player.weapon.shots_fired, gr.player.weapon.hits_landed,
		gr.enemies.get_child_count(), _enemy_hp_text(gr)])
	_check(gr.score >= ShipTable.score_of("interceptor"), "击杀分入账")
	_check(gr.player.weapon.shots_fired > 0 and gr.player.weapon.hits_landed > 0,
		"开火与命中计数在涨")

	# 5) 热量与过热锁定
	gr.player.vitals.heat = ShipTable.HEAT_LOCK_AT - 1.0
	gr.player.vitals.overheat = false
	Input.action_press("fire_primary")
	var overheated := await _wait_until(_overheated(gr), 300)
	Input.action_release("fire_primary")
	_check(overheated, "热量打满触发过热")
	_check(not gr.player.vitals.can_fire(), "过热期间禁止开火")
	gr.player.vitals.heat = 0.0
	gr.player.vitals.overheat = false

	# 6) 承伤与 HUD 联动（承伤前后玩家可能被敌弹打过，护盾可能不足 30 → 由舰体承担）
	var shield0 := gr.player.vitals.shield
	gr.player.vitals.take_damage(30.0)
	await _frames(2)
	var expect_shield := maxf(0.0, shield0 - 30.0)
	_check(is_equal_approx(gr.player.vitals.shield, expect_shield),
		"护盾承伤 30（%.0f → %.0f）" % [shield0, gr.player.vitals.shield])
	_check(is_equal_approx(gr.hud.shield_bar.value, gr.player.vitals.shield), "HUD 护盾条同步")

	# 7) 五波清到胜利（debug 清波走的是同一台阶段机，不是旁门）
	for w in range(WaveTable.WAVE_COUNT):
		var wave_no := gr.director.current_wave()
		_check(gr.director.phase == WaveDirector.Phase.SPAWNING, "W%d 处于出怪阶段" % wave_no)
		gr.director.debug_clear_wave()
		var advanced := await _wait_until(_wave_finished(gr), 300)
		_check(advanced, "W%d 清波推进" % wave_no)
		if gr.director.phase == WaveDirector.Phase.INTERMISSION:
			gr.director.debug_skip_intermission()
			var next := await _wait_until(_next_wave(gr, wave_no + 1), 300)
			_check(next, "W%d 整备结束进入下一波" % wave_no)
		if gr.state != GameRoot.State.PLAYING:
			break

	_check(gr.state == GameRoot.State.VICTORY, "五波全清进入 VICTORY（当前 %d）" % gr.state)
	_check(gr.hud.victory_layer.visible, "胜利结算层可见")
	_check(gr.score > WaveTable.WAVE_COUNT * WaveTable.CLEAR_BONUS, "总分入账（%d）" % gr.score)
	# 四行结算明细都要有值：曾经 show_victory 误填失败层，胜利屏只剩分数、其余三行永远是「—」
	_check(String(gr.hud.victory_stat_score.text).contains(str(gr.score)),
		"结算屏显示得分（%s）" % gr.hud.victory_stat_score.text)
	_check(String(gr.hud.victory_stat_waves.text).contains("%d / %d" % [WaveTable.WAVE_COUNT, WaveTable.WAVE_COUNT]),
		"结算屏显示清波数（%s）" % gr.hud.victory_stat_waves.text)
	_check(String(gr.hud.victory_stat_kills.text).contains(str(gr.kills)),
		"结算屏显示击落数（%s）" % gr.hud.victory_stat_kills.text)
	_check(String(gr.hud.victory_stat_accuracy.text).contains("%"),
		"结算屏显示命中率（%s）" % gr.hud.victory_stat_accuracy.text)

	# 8) 重开 → 阵亡结算 → 回菜单
	gr.start_game()
	_check(gr.state == GameRoot.State.PLAYING, "结算后可重开")
	_check(gr.kills == 0 and gr.score == 0, "重开清零计数")
	gr.player.vitals.take_damage(99999.0)
	await _frames(4)
	_check(gr.state == GameRoot.State.GAMEOVER, "致死伤害进入 GAMEOVER")
	_check(gr.hud.gameover_layer.visible, "失败结算层可见")
	gr.to_menu()
	_check(gr.state == GameRoot.State.MENU, "返回菜单")
	_done()


func _load_main() -> Node:
	var ps := load("res://scenes/main.tscn") as PackedScene
	return ps.instantiate()


func _frames(n: int) -> void:
	for _i in range(n):
		await process_frame


func _wait_until(cond: Callable, max_frames: int) -> bool:
	for _i in range(max_frames):
		if cond.call():
			return true
		await process_frame
	return cond.call()


func _wait_first_spawn(gr: GameRoot) -> EnemyShip:
	for _i in range(MAX_FRAMES):
		if gr.enemies.get_child_count() > 0:
			return gr.enemies.get_child(0) as EnemyShip
		await process_frame
	return null


# —— 谓词闭包（单独函数：GDScript 不支持多行 lambda 直接当实参）——

func _shot_back(gr: GameRoot) -> Callable:
	return func() -> bool:
		return gr.projectiles.get_child_count() > 0 \
			or gr.player.vitals.shield < ShipTable.SHIELD_MAX


func _wave_finished(gr: GameRoot) -> Callable:
	return func() -> bool:
		return gr.director.phase == WaveDirector.Phase.INTERMISSION \
			or gr.director.phase == WaveDirector.Phase.DONE


func _next_wave(gr: GameRoot, expect: int) -> Callable:
	return func() -> bool:
		return gr.director.current_wave() == expect \
			and gr.director.phase == WaveDirector.Phase.SPAWNING


## 把场上敌机沿准星轴排成一条「纵队」（第 i 架在 70+i×40 m），让射线逐个击破。
## 只钉位置不钉存活——钉住的那架会被 AI 推开，伤害就分摊给多架，实测 5 架分摊 456 伤害 0 击杀。
## 不捕获敌机对象：它会被 queue_free，lambda 捕获已释放对象会在调用时报
## “Lambda capture was freed”，直接变成退出期 ERROR。
func _pin_and_kill(gr: GameRoot, cam: Camera3D) -> Callable:
	return func() -> bool:
		if gr.kills > _kills_before:
			return true
		var i := 0
		for child in gr.enemies.get_children():
			var e := child as EnemyShip
			if e != null:
				e.global_position = cam.global_position \
					+ (-cam.global_basis.z) * (70.0 + float(i) * 40.0)
				i += 1
		return false


func _overheated(gr: GameRoot) -> Callable:
	return func() -> bool: return gr.player.vitals.overheat


func _enemy_hp_text(gr: GameRoot) -> String:
	var parts: Array[String] = []
	for child in gr.enemies.get_children():
		var e := child as EnemyShip
		if e != null:
			parts.append("%s %.0f" % [e.kind, e.hp])
	return ", ".join(parts) if not parts.is_empty() else "-"


func _check(cond: bool, label: String) -> void:
	_checks += 1
	if cond:
		print("[OK] %s" % label)
	else:
		_fails += 1
		print("[FAIL] %s" % label)


func _done() -> void:
	print("冒烟断言 %d 条，失败 %d 条" % [_checks, _fails])
	quit(1 if _fails > 0 else 0)

