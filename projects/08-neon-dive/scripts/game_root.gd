extends Node2D
## 装配根：环境光 + 真 2D 光 + 灰盒房 + 玩家(含计量与战斗) + 敌人 + 反馈链 + HUD + 相机。
##
## M2 阶段节点全部在代码里搭（灰盒没有编辑价值）。信号接线集中在 _wire()，
## 这样「反馈链有没有漏接」一眼能看完——06 就踩过「信号名写错导致装配层静默没跑」，
## 那种 bug 在 --headless --quit 里永远不会报，只有冒烟测试 + 这里能看出来。

const Combat := preload("res://sim/combat_table.gd")
const LG := preload("res://sim/layout_gen.gd")
const RS := preload("res://sim/run_sim.gd")

## 测试/展示用的训练房模式：搭 M1 的固定灰盒而不是生成层。
## 冒烟测试走这条路，这样「移动断言的坐标」与「生成层」不会互相干扣。
@export var lab_mode := false

var _player: NeonPlayer = null
var _vitals: PlayerVitals = null
var _combat: PlayerCombat = null
var _fx: HitFx = null
var _lights: LightingRig = null
var _hud: NeonHud = null
var _tutorial: ControlsTutorial = null
var _camera: Camera2D = null
var _enemies_spawned := 0
var _room: Node2D = null
var _grid: NavGrid = null
var _depth := 1
var _ach: AchievementTracker = null
var _last_hit_attack: String = ""
var _run_seed := 20260927
var _deaths := 0
var _pit_y := 99999.0
var _dead := false
var _pending_descend := false
var _pending_restart := false


func _ready() -> void:
	add_to_group("game_root")  # 敌人入树时靠这个组找到装配层并自注册
	_build_environment()
	_fx = HitFx.new()
	_fx.name = "HitFx"
	add_child(_fx)

	_lights = LightingRig.new()
	_lights.name = "Lighting"
	add_child(_lights)

	_player = NeonPlayer.new()
	_player.name = "Player"
	_player.position = Vector2(60, 300)
	add_child(_player)

	_vitals = PlayerVitals.new()
	_vitals.name = "Vitals"
	_player.add_child(_vitals)

	_combat = PlayerCombat.new()
	_combat.name = "Combat"
	_player.add_child(_combat)

	_lights.attach_to(_player)
	_build_camera()
	_hud = NeonHud.new()
	_hud.name = "Hud"
	add_child(_hud)
	_tutorial = ControlsTutorial.new()
	_tutorial.name = "Tutorial"
	add_child(_tutorial)
	# 成就：判定在 sim/achievements.gd（纯函数），这里只递事件。
	# 放在 _wire 之前，因为 _wire 里要连它的信号
	_ach = AchievementTracker.new()
	_ach.name = "Achievements"
	add_child(_ach)
	_ach.unlocked.connect(_on_achievement_unlocked)
	_wire()
	_capture = "--shot" in OS.get_cmdline_user_args()
	_biome_shot = "--biomeshot" in OS.get_cmdline_user_args()
	_build_level()
	_tutorial.on_run_started()


## 搭当前层。lab_mode 下是固定训练房（冒烟测试依赖它的坐标），否则按 depth 生成。
## 不用 await：旧房先从树上摘下来再 queue_free，碰撞体当场失效，
## 不需要等一帧，也不会让「世界就绪」的时间点变得不确定。
func _build_level() -> void:
	if _room != null and is_instance_valid(_room):
		remove_child(_room)
		_room.queue_free()
	_room = null
	for e in get_tree().get_nodes_in_group("enemies"):
		if is_instance_valid(e):
			e.get_parent().remove_child(e)
			e.queue_free()
	_pit_y = 99999.0
	_enemies_spawned = 0
	if lab_mode:
		var greybox := Node2D.new()
		greybox.name = "Greybox"
		greybox.set_script(load("res://scripts/greybox_room.gd"))
		add_child(greybox)
		_room = greybox
		_grid = null
		_player.global_position = Vector2(60, 300)
		_spawn_enemies()
		_hud.set_depth_text("训练房")
		return
	var plan := LG.generate(_depth, _run_seed)
	# 群系要接到渲染层：压暗色与随身光跟着换。只改贴图的话，
	# 「关卡特异性」在画面上看不出来（实测拍出来四个群系都是同一个蓝）
	_lights.set_biome(Biomes.for_depth(_depth))
	var problems: Array = LG.validate(plan)
	if not problems.is_empty():
		# 生成器自己发现不合法的层就当场报错，而不是让玩家去实跑「过不去的沟」
		push_error("生成器产出了不合法的层：%s" % str(problems))
		return
	var room := LevelRoom.new()
	room.name = "Level_depth%d" % _depth
	add_child(room)
	room.setup(plan, _lights)
	room.exit_reached.connect(_on_exit_reached)
	# 网格要在 build() 之前拿：build 里生成的敌人会在 _ready 自注册，
	# 那时网格还是 null 的话，它们整层都是直线追击
	_grid = room.nav_grid()
	room.build()
	_room = room
	_pit_y = room.pit_y
	_player.global_position = Vector2(room.spawn_x, float(int(plan["floor_row"]) - 1) * 16.0)
	_player.velocity = Vector2.ZERO
	_camera.limit_right = int(room.world_width)
	_camera.limit_bottom = int(plan["room_height"]) * 16
	_hud.set_depth_text("DEPTH %dF" % _depth)
	_hud.hint("走到右端电梯下潜 · 掉沟里会死 · 按 R 重开")


## 供测试/调试切换成生成层（冒烟测试默认跑训练房，因为移动断言依赖固定坐标）
func use_generated_level(depth: int = 1) -> void:
	lab_mode = false
	_dead = false
	_depth = depth
	_build_level()


func _unhandled_input(event: InputEvent) -> void:
	if not event.is_pressed():
		return
	if Input.is_action_just_pressed("restart"):
		restart()


## 重开当前层（死了才能按，活着按等于自杀式重来）
func restart() -> void:
	if not _dead:
		_hud.hint("没死不用重开")
		return
	_dead = false
	_pending_restart = true


func _on_exit_reached() -> void:
	if _dead:
		return
	_pending_descend = true


## 生成弹丸（玩家与敌人都走这里）：统一归属、统一接反馈，并且能拿到寻路网格做阻挡查询
func spawn_projectile(side: String, at: Vector2, dir: float, enemy_id: String = "crawler") -> void:
	var spec: Dictionary = {}
	if side == "player":
		var pr: Dictionary = Combat.PLAYER_RANGED
		spec = {"damage": float(Combat.attack("ranged")["damage"]),
				"speed": float(pr["projectile_speed"]),
				"lifetime_frames": int(pr["lifetime_frames"]),
				"radius": float(pr["radius"])}
	else:
		spec = (Combat.enemy(enemy_id)["projectile"] as Dictionary).duplicate()
	var p := Projectile.spawn(self, at, dir, spec, side, _grid)
	p.hit_something.connect(_on_projectile_hit)


func _on_projectile_hit(target: Node, damage: float) -> void:
	if not is_instance_valid(target):
		return
	_fx.play("hit_light", (target as Node2D).global_position + Vector2(0, -14))
	_lights.flash_at((target as Node2D).global_position + Vector2(0, -14), 1.4, 46.0)


## 拾取（由 LevelRoom 回调）
func apply_pickup(kind: String) -> void:
	match kind:
		"o2":
			_vitals.restore_o2(22.0)
			_hud.hint("氧 +22")
		"power":
			_vitals.restore_power(25.0)
			_hud.hint("电 +25")
	_lights.flash_at(_player.global_position + Vector2(0, -14), 1.8, 60.0)


const SHOTS := {
	60: "08_gameplay_idle.png",
	260: "08_gameplay_run.png",
	452: "08_gameplay_combat.png",
}

## 群系对比图：同一套代码在不同深度应该拍出明显不同的图（关卡特异性的视觉证据）
const BIOME_SHOTS := {110: 1, 300: 3, 500: 4}

var _capture := false
var _biome_shot := false
var _shot_busy := false
var _biome_done := 0
var _tick := 0
var _spitter_probe: Node = null


func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.012, 0.02, 0.055)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_energy = 0.4
	env.glow_enabled = true
	env.glow_intensity = 0.9
	env.glow_bloom = 0.25
	env.glow_normalized = true
	env.adjustment_enabled = true
	env.adjustment_contrast = 1.12
	env.adjustment_saturation = 1.15
	var we := WorldEnvironment.new()
	we.name = "WorldEnvironment"
	we.environment = env
	add_child(we)


func _build_camera() -> void:
	_camera = Camera2D.new()
	_camera.name = "Camera"
	_camera.position_smoothing_enabled = true
	# 12 而不是 9：横版动作里相机「追不上」会被当成操作不跟手（与 dash 速度同量级）
	_camera.position_smoothing_speed = 12.0
	_camera.limit_left = 0
	_camera.limit_top = 0
	_camera.limit_right = 640
	_camera.limit_bottom = 360
	# 整数像素定位（属性存在才设，不同小版本名字不一）：非整数会让像素 art 插值发虚
	# 注意是 get_property_list()，`property_list` 不是可直接访问的属性
	for prop in _camera.get_property_list():
		if StringName("position_rounding") == prop["name"]:
			_camera.set("position_rounding", true)
	add_child(_camera)
	_camera.make_current()
	_camera.position = _player.global_position


func _spawn_enemies() -> void:
	var script: GDScript = load("res://scripts/enemy_crawler.gd")
	for i in 3:
		var e := CharacterBody2D.new()
		e.name = "Crawler%d" % i
		e.set_script(script)
		e.position = Vector2(360.0 + i * 60.0, 300.0)
		add_child(e)
		_enemies_spawned += 1
	# 接线不在这里做：敌人 _ready 里会调 register_enemy()，
	# 这样 M3 程序生成新敌人时不会漏接反馈链（漏接就是「杀了没声音没奖励」）


## 每个敌人入树时自注册到这里（见 enemy_crawler.gd 的 _ready）
func register_enemy(e: Node) -> void:
	if e.died.is_connected(_on_enemy_died):
		return
	e.set("nav_grid", _grid)   # 训练房里是 null → 保持旧的直线追击
	e.died.connect(_on_enemy_died)
	e.hit_taken.connect(_on_enemy_hit)
	e.tell_started.connect(_on_enemy_tell)
	e.attack_resolved.connect(_on_enemy_attack_resolved)


func _wire() -> void:
	_vitals.value_changed.connect(_on_value)
	_vitals.damaged.connect(_on_player_damaged)
	_vitals.died.connect(_on_player_died)
	# 成就事件源：受伤/氧空/弹反/反射/处决/射击全部递给 tracker
	_vitals.damaged.connect(_ach.on_player_damaged)
	_vitals.value_changed.connect(_on_vitals_changed)
	_player.bounced_off.connect(_on_bounced_off)
	_combat.attack_started.connect(_on_attack_started)
	_combat.hit_registered.connect(_on_hit_registered)
	_combat.parry_succeeded.connect(_on_parry_succeeded)
	_combat.parry_failed.connect(_on_parry_failed)
	_combat.shot_fired.connect(_on_shot_fired)
	_combat.projectile_reflected.connect(_on_reflected)
	_combat.attack_denied.connect(_on_denied)
	_combat.execute_performed.connect(_on_executed)
	# 成就：弹反与反射用 lambda 直接计数（它们的事件就是「发生了一次」，无需额外参数）
	_combat.parry_succeeded.connect(func(_a): _ach.bump("parries"))
	_combat.projectile_reflected.connect(func(_p): _ach.bump("reflects"))


func _on_vitals_changed(kind: String, value: float, _max_value: float) -> void:
	if str(kind) != "o2":
		return
	if value <= 0.0:
		_ach.note_o2_empty()
	else:
		_ach.note_o2_recovered(value)


func _on_bounced_off(at: Vector2) -> void:
	_fx.play("bounce", at)
	_lights.flash_at(at, 1.2, 40.0)
	_tutorial.show_context("first_bounce")


## 平台塌了（由 LevelRoom 回调）：给一次提示 + 地面反馈
func note_platform_crumbled(at: Vector2) -> void:
	_fx.play("hit_heavy", at)
	_lights.flash_at(at, 1.4, 44.0)
	_tutorial.show_context("first_crumble")


func _on_achievement_unlocked(def: Dictionary) -> void:
	_hud.achievement(def)
	_fx.play("achieve", _player.global_position)


# ---------- 反馈链接线（docs/08 §3.2：闪白 + 粒子 + 音效 + 震屏 + 光闪 同一瞬间） ----------

func _on_attack_started(id: String) -> void:
	_fx.play("swing", _player.global_position + Vector2(_combat_facing() * 14.0, -14))
	_hud.hint(_attack_label(id))


func _combat_facing() -> float:
	return _player.facing_dir()


func _attack_label(id: String) -> String:
	match id:
		"light_1": return "轻击 ①"
		"light_2": return "轻击 ②"
		"light_3": return "轻击 ③（击退）"
		"heavy": return "蓄力重击"
		"execute": return "处决"
		"ranged": return "飞鳌（远程）"
	# 兼容：未登记的招式直接显示表里的 display，不要把内部 id 丢给玩家看
	return str(Combat.attack(id).get("display", id))


func _on_hit_registered(target: Node, attack_id: String, damage: float) -> void:
	_last_hit_attack = attack_id
	if not is_instance_valid(target):
		return
	var at: Vector2 = (target as Node2D).global_position + Vector2(0, -14)
	var kind := "hit_light" if attack_id != "heavy" and attack_id != "execute" else "hit_heavy"
	_fx.play(kind, at)
	_lights.flash_at(at, 2.2 if kind == "hit_heavy" else 1.3, 60.0 if kind == "hit_heavy" else 44.0)


func _on_parry_succeeded(attacker: Node) -> void:
	var at := _player.global_position + Vector2(0, -14)
	if is_instance_valid(attacker):
		at = (attacker as Node2D).global_position + Vector2(0, -14)
	_fx.play("parry", at)
	_lights.flash_at(at, 3.2, 96.0)
	_tutorial.show_context("first_stun")
	_hud.hint("弹反成功 → 按 J 处决")


func _on_executed(_target: Node) -> void:
	_lights.flash_at(_player.global_position + Vector2(0, -16), 3.6, 120.0)
	_hud.hint("处决 · 氧 +%.0f" % float(Combat.attack("execute")["o2_reward"]))
	_ach.bump("executes")
	# 「缺氧反杀」：氧 <10 时还能打出处决，是本作最难的操作之一
	if float(_vitals.o2) < 10.0:
		_ach.bump("gasping_executes")


func _on_denied(reason: String) -> void:
	_fx.play("deny", _player.global_position)
	_hud.hint("电不足（%s）" % reason)


func _on_enemy_hit(enemy: Node, damage: float) -> void:
	_hud.hint("命中 %.0f" % damage)
	if enemy.has_method("set_flash"):
		enemy.call("set_flash")


func _on_enemy_tell(enemy: Node) -> void:
	# 前摇的视觉预告：光闪一下 + 飘字，玩家靠这个读条决定要不要弹反
	if is_instance_valid(enemy):
		var at := (enemy as Node2D).global_position + Vector2(0, -20)
		_lights.flash_at(at, 1.1, 34.0)
		_fx.play("tell", at)
	# 远程怪的前摇要飘不同的提示：它的解法不是「躲开」而是「把刺弹回去」
	if bool(enemy.get("is_ranged")):
		_tutorial.show_context("first_spitter")
	_tutorial.show_context("first_tell")


func _on_shot_fired(at: Vector2, _dir: float) -> void:
	_fx.play("shoot", at)
	_ach.on_shot()
	_tutorial.show_context("first_shot")


func _on_reflected(proj: Node) -> void:
	if is_instance_valid(proj):
		_fx.play("parry", (proj as Node2D).global_position)
	_hud.hint("弹反成功 → 反射回去（伤害 ×1.5）")


func _on_parry_failed(_a: Node) -> void:
	_hud.hint("弹反落空——等头顶的三角尖到最大再按")


func _on_enemy_attack_resolved(enemy: Node, parried: bool, dealt: float) -> void:
	if parried or dealt <= 0.0 or not is_instance_valid(enemy):
		return
	_fx.play("hurt", _player.global_position + Vector2(0, -14))
	_lights.flash_at(_player.global_position + Vector2(0, -14), 1.6, 52.0)
	_player.set_flash(1.0)
	_hud.player_hurt()


func _on_enemy_died(enemy: Node, reward: Dictionary) -> void:
	# 击杀用的是哪一招只有 hit_registered 知道，所以拿上一击的 id 判「三段收尾」
	_ach.on_kill(_last_hit_attack)
	if is_instance_valid(enemy):
		_fx.play("kill", (enemy as Node2D).global_position + Vector2(0, -12))
		_lights.flash_at((enemy as Node2D).global_position, 2.6, 80.0)
	_vitals.restore_power(float(reward["power"]))
	_vitals.restore_o2(float(reward["o2"]))
	_hud.hint("击杀 · 电 +%.0f 氧 +%.0f" % [float(reward["power"]), float(reward["o2"])])


func _on_player_damaged(amount: float, _source: Node2D) -> void:
	_hud.hint("受击 -%.0f" % amount)


func _on_player_died(cause: String) -> void:
	_dead = true
	_deaths += 1
	# 文案按死因区分：掉坑与被杀的处理建议完全不同
	# （必须写显式 String：Dictionary.get() 返回 Variant，`:=` 推断在本工程里是错）
	var text: String = {
		"pit": "掉出层了",
		"hurt": "被干掉了",
		"drown": "氧用完了",
	}.get(cause, "死亡")
	_hud.death_notice("%s（%s）· 按 R 重开本层" % [text, cause])
	_fx.add_trauma(0.9)
	_hud.hint("死因：%s" % cause)


func _on_value(kind: String, value: float, max_value: float) -> void:
	_hud.on_value(kind, value, max_value)


func _physics_process(_delta: float) -> void:
	# 截图驱动放在物理帧里：上一版放在 _process 里，而本机渲染帧率约为物理帧率的 3 倍，
	# 导致「按右跑 179 帧」实际只有 ~60 物理帧（≈35 px），看起来像相机不跟、路不通。
	# 与冒烟测试（等 physics_frame）用同一个帧口径，两边结果才能对得上。
	if _capture or _biome_shot:
		_drive_capture()


func _process(_delta: float) -> void:
	_follow_camera()
	if _camera != null and _fx != null:
		# 震屏：叠加在跟随位置上，不影响玩家真实坐标
		_camera.offset = _fx.shake_offset()
	_update_debug_label()
	# 掉坑判定：这是「掉下去没反应」那条反馈的根。生成层有真沟，
	# 没有这条就是掉进虚空里游荡，玩家不知道发生了什么（马里奥会直接重开）
	if not _dead and _player != null and _player.global_position.y > _pit_y:
		_vitals.kill("pit")
	if _pending_descend:
		_pending_descend = false
		_depth += 1
		# 上一层结束了才结算「无伤层 / 快潜 / 近身派」，并把最大深度抬上去
		_ach.on_room_end(_depth)
		# 与 sim/run_sim.gd 的 DESCENT_O2_BONUS 保持一致：跑分算的是这套数值，
		# 游戏里给另一个数就会「跑分结论与实跑不一致」
		_vitals.restore_o2(RS.DESCENT_O2_BONUS)
		_build_level()
	if _pending_restart:
		_pending_restart = false
		_ach.reset_run()
		_vitals.reset()
		_combat.reset_state()
		_build_level()
		_hud.clear_death()
	# 截图驱动不在这里（已移到 _physics_process，帧口径要与冒烟一致）
	_tutorial_prompts()


## 情境式教程：在「第一次遇到这个情况」的那一刻才飘提示，而不是一上来倒一堆文字
func _tutorial_prompts() -> void:
	if _tutorial == null or _player == null:
		return
	var first := get_tree().get_first_node_in_group("enemies") as Node2D
	if first != null and first.global_position.distance_to(_player.global_position) < 200.0:
		_tutorial.show_context("first_enemy")
	if _vitals != null and float(_vitals.o2) < 35.0:
		_tutorial.show_context("first_low_o2")


## 相机跟随（制作人 2026-09-27 反馈第 1 条：「人走出去了相机不动」）。
## 灰盒时代世界正好一屏，不跟随也看不出来；一层 4 屏宽后立刻暴露。
## 前瞻偏移按面向方向给，让玩家看到要跳过去的地方而不是脸前的墙。
func _follow_camera() -> void:
	if _camera == null or _player == null:
		return
	var look := 34.0 * _player.facing_dir()
	var target := _player.global_position + Vector2(look, -10.0)
	if _camera.limit_right > _camera.limit_left:
		# 靠边界时把前瞻收回，不然镜头会被 limit 顶住而玩家还在动
		if target.x < _camera.limit_left + 320.0:
			target.x = _camera.limit_left + 320.0
		if target.x > _camera.limit_right - 320.0:
			target.x = _camera.limit_right - 320.0
	_camera.position = target


func _update_debug_label() -> void:
	if _player == null or _hud == null or _combat == null:
		return
	var v: Vector2 = _player.velocity
	var snap: Dictionary = _combat.snapshot()
	# 文本交给 HUD（CanvasLayer），自己不再往世界坐标里塞 Label
	_hud.set_debug_text("%s vx=%.0f vy=%.0f | 攻击 %s(%s) 下一段 %s 弹反窗 %s | 敌 %d" % [
		_player.state(), v.x, v.y,
		snap["current"] if str(snap["current"]) != "" else "—",
		snap["phase"], snap["chain_next"], ("开" if snap["parry_open"] else "关"),
		get_tree().get_nodes_in_group("enemies").size(),
	])


func snapshot() -> Dictionary:
	return {"player": _player.state() if _player else "", "combat": _combat.snapshot() if _combat else {},
			"vitals": _vitals.snapshot() if _vitals else {}, "enemies": _enemies_spawned,
			"trauma": _fx.trauma if _fx else 0.0,
			"depth": _depth, "deaths": _deaths, "pit_y": _pit_y, "lab_mode": lab_mode,
			"world_width": _room.world_width if _room != null and "world_width" in _room else 0.0,
			# 冒烟测试要确认「换层真的换图」，所以把群系与平台种类暴露出来
			"biome": str(_room.plan["biome"]) if _room != null and _room.plan != null else "",
			"platform_kinds": _platform_kinds()}


## 当前层已建出的平台种类（验证不是只存在于数据里）
func _platform_kinds() -> Dictionary:
	var out := {}
	if _room == null:
		return out
	for n in _room.get_children():
		if n is NeonPlatform:
			var k := str((n as NeonPlatform).kind)
			out[k] = int(out.get(k, 0)) + 1
	return out


func _drive_capture() -> void:
	_tick += 1
	# 脚本化输入：长距离跑动→回位→在敌人身边挥击。
	# 跑步段要足够长才能跨过「相机开始移动」的阈值（玩家 x > 世界左边界+半屏-前瞻），
	# 上一版只跑 39 帧（≈35 px），相机还在被 limit 顶住，看起来像「相机不跟」。
	if _tick == 61:
		Input.action_press("move_right")
	if _tick == 240:
		Input.action_release("move_right")
	if _tick == 380:
		# 放一只远程怪在身前（先不动手，等后面再推它进前摇）
		var script: GDScript = load("res://scripts/enemy_crawler.gd")
		var sp := CharacterBody2D.new()
		sp.set_script(script)
		sp.set("enemy_id", "spitter")
		sp.position = _player.global_position + Vector2(120, 0)
		add_child(sp)
		sp.set("cooldown", 9999)   # 不让它自己出手，否则拍不到前摇
		_spitter_probe = sp
	if _tick == 400:
		Input.action_press("attack_light")
	if _tick == 403:
		Input.action_release("attack_light")
	if _tick == 430:
		Input.action_press("shoot")
	if _tick == 433:
		Input.action_release("shoot")
	if _tick == 444:
		# 前摇只有 26 帧（~0.43s），必须在截图前几帧才推它进去，否则拍不到标记
		if _spitter_probe != null and is_instance_valid(_spitter_probe):
			_spitter_probe.set("state", 2)      # S.TELL
			_spitter_probe.set("_tell_total", 26)
			_spitter_probe.set("frames_left", 20)   # 留足够多帧，让 452 的截图落在前摇中段
	if _biome_shot and BIOME_SHOTS.has(_tick) and not _shot_busy:
		# 重入锁是必需的：协程在 await 期间 _physics_process 仍在推进，_tick 会往前走；
		# 上一版用「_tick == 500 就退出」判定，回来时已经不等于 500 → 永不退出（实测挂住）
		_shot_busy = true
		_depth = int(BIOME_SHOTS[_tick])
		_build_level()
		if _player != null:
			# 站到房间中段：出生点那一段永远是空场，拍不出群系的结构差异
			_player.global_position = Vector2(360, 300)
			_player.velocity = Vector2.ZERO
		if _tutorial != null:
			_tutorial.hide_panel()
		await _frames_local(8)
		await RenderingServer.frame_post_draw
		var img := get_viewport().get_texture().get_image()
		var fname := "08_biome_d%d_%s.png" % [_depth, str(snapshot()["biome"])]
		var path := "res://../../_scratch/shots/" + fname
		var err := img.save_png(path)
		print("[biome] %s (%s) 平台种类统计=%s" % [fname, "OK" if err == OK else err,
				str(snapshot()["platform_kinds"])])
		_biome_done += 1
		_shot_busy = false
		if _biome_done >= BIOME_SHOTS.size():
			get_tree().quit(0)
		return
	if _capture and SHOTS.has(_tick) and not _shot_busy:
		_shot_busy = true
		var shot_tick := _tick
		# 等一帧再取，保证拿到的是本帧的渲染结果
		await RenderingServer.frame_post_draw
		var path := ProjectSettings.globalize_path("res://../../_scratch/shots/") + str(SHOTS[_tick])
		var err := get_viewport().get_texture().get_image().save_png(path)
		print("[shot] %s → %s (%s) 人 x=%.0f cam x=%.0f"
				% [str(SHOTS[_tick]), path, "OK" if err == OK else err,
					_player.global_position.x, _camera.global_position.x])
		_shot_busy = false
		if shot_tick == int(SHOTS.keys()[SHOTS.size() - 1]):
			get_tree().quit(0)


## 只等帧不驱动输入的小辅助（群系截图用）
func _frames_local(n: int) -> void:
	for _i in n:
		await get_tree().physics_frame
