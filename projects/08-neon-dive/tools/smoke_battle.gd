@tool
extends SceneTree
## 移动冒烟测试：真的加载主场景、真的跑物理帧、真的按键，断言**结果**而不是中间帧。
##
## 为什么必须有这一步：`--headless --quit` 只能证明「场景能开机」，
## 证明不了「跳得起来、落得下去、dash 真的推得动人」。06 的三个真 bug
## （信号名写错、进树前设坐标、碰撞体偏心）全是这一类才抓到的（路线图 §4.3）。
##
## 口径按路线图 §4.3：Godot 物理不保证逐帧复现，所以断言的是**区间与方向**，
## 数值区间的依据写在 sim/movement_params.gd 的 design_bands()。
##
## 用法：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/08-neon-dive -s res://tools/smoke_movement.gd

const P := preload("res://sim/movement_params.gd")

var _fails := 0
var _root: Node
var _single_peak_rise := 0.0  # 上一项测到的单跳高度，用来证明二段跳真的更高


func _initialize() -> void:
	_run()


func _run() -> void:
	var packed: PackedScene = load("res://scenes/main.tscn")
	_root = packed.instantiate()
	# 移动/战斗断言依赖训练房的固定坐标（地面 y=328、竖井 x=533..612），
	# 所以显式要求 lab_mode；生成层另用后面几项验
	_root.set("lab_mode", true)
	root.add_child(_root)
	# 必须等一帧：game_root 是在 _ready() 里用代码造 Player 的，
	# 脚本模式下 add_child 后不保证 _ready 已经跑完，立刻 get_node 会拿到 null
	await process_frame
	await process_frame
	var player: CharacterBody2D = _root.get_node_or_null("Player")
	if player == null:
		# 不能让它静默「零失败」通过：上一版就是 Player 为 null 却打了「全部通过」
		_fail("主场景里找不到 Player，后面的断言全部无意义")
		print("=== 移动冒烟：装配失败，提前结束 ===")
		quit(1)
		return

	await _frames(30)  # 等出生与第一次落地

	await _test_grounding(player)
	await _test_run(player)
	await _test_jump_height(player)
	await _test_double_jump(player)
	await _test_dash(player)
	await _test_coyote(player)
	await _test_wall_slide(player)
	await _test_combat_wiring(player)
	await _test_light_attack_kills(player)
	await _test_parry_and_execute(player)
	await _test_player_takes_damage(player)
	await _test_power_gate(player)
	await _test_ranged_and_reflect(player)
	await _test_platform_gameplay(player)
	await _test_achievements(player)
	await _test_generated_level(player)

	print("")
	if _fails == 0:
		print("=== 移动冒烟：全部通过 ===")
	else:
		print("=== 移动冒烟：失败 %d 项 ===" % _fails)
	quit(1 if _fails > 0 else 0)


# ---------- 断言小工具 ----------

func _ok(msg: String) -> void:
	print("[OK]   " + msg)


func _fail(msg: String) -> void:
	_fails += 1
	print("[FAIL] " + msg)


func _check(cond: bool, msg: String) -> void:
	if cond:
		_ok(msg)
	else:
		_fail(msg)


func _frames(n: int) -> void:
	for _i in n:
		await physics_frame


func _respawn(player: CharacterBody2D, pos: Vector2 = Vector2(60, 300)) -> void:
	Input.action_release("move_left")
	Input.action_release("move_right")
	Input.action_release("jump")
	Input.action_release("dash")
	player.global_position = pos
	player.velocity = Vector2.ZERO
	await _frames(45)  # 重新落地稳定


# ---------- 各项检查 ----------

func _test_grounding(player: CharacterBody2D) -> void:
	# 出生点在空中，必须落到地面上（地面顶 y=328，脚底半高 13 → y≈315）
	_check(player.position.y > 300.0, "出生后会下落到地面（y=%.1f）" % player.position.y)
	_check(absf(player.velocity.y) < 5.0, "落地后竖直速度归零（vy=%.2f）" % player.velocity.y)
	_check(player.state() in ["IDLE", "RUN"], "落地后状态是 IDLE/RUN（实际 %s）" % player.state())


func _test_run(player: CharacterBody2D) -> void:
	await _respawn(player)
	Input.action_press("move_right")
	await _frames(20)
	var v: float = player.velocity.x
	_check(v > P.RUN_SPEED * 0.9, "按右 20 帧内接近巡航速（vx=%.1f / 目标 %.1f）" % [v, P.RUN_SPEED])
	var x0: float = player.position.x
	await _frames(20)
	var moved: float = player.position.x - x0
	_check(moved > 40.0, "巡航中持续前进（20 帧位移 %.1f px）" % moved)
	Input.action_release("move_right")
	await _frames(12)
	_check(absf(player.velocity.x) < P.RUN_SPEED * 0.25,
			"松键后急停（vx=%.2f，地面摩擦 %.0f）" % [player.velocity.x, P.FRICTION_GROUND])


func _test_jump_height(player: CharacterBody2D) -> void:
	# 满跳：跳键按住不放。上一版测完 4 帧就 release，正好触发了 jump cut，
	# 量到的是短跳高度（31 px）却当成「满跳不达标」——测试自己把断言口径弄错了
	await _respawn(player)
	var y0: float = player.position.y
	Input.action_press("jump")
	await _frames(4)
	var vy: float = player.velocity.y
	_check(vy < -P.JUMP_VELOCITY * 0.8, "起跳瞬间给到接近满跳初速（vy=%.1f）" % vy)
	var peak := y0
	for _i in 40:
		await physics_frame
		peak = minf(peak, player.position.y)
	Input.action_release("jump")
	var rise: float = y0 - peak
	_single_peak_rise = rise
	_check(rise > P.jump_apex_px() * 0.8,
			"满跳上升接近模型值（%.1f px ≈ %.2f 格，模型 %.1f px）"
			% [rise, rise / P.TILE, P.jump_apex_px()])
	await _frames(40)
	_check(absf(player.position.y - y0) < 6.0, "跳完回到同一高度（Δy=%.1f）" % (player.position.y - y0))
	await _test_short_hop(player)


## 可变跳高：一按就松，必须明显低于满跳，否则「轻点/长按」这个维度不存在
func _test_short_hop(player: CharacterBody2D) -> void:
	await _respawn(player)
	var y0: float = player.position.y
	Input.action_press("jump")
	await _frames(2)
	Input.action_release("jump")
	var peak := y0
	for _i in 30:
		await physics_frame
		peak = minf(peak, player.position.y)
	var rise: float = y0 - peak
	_check(rise < _single_peak_rise * 0.75,
			"短跳明显低于满跳（%.1f px vs %.1f px，跳高可变量）" % [rise, _single_peak_rise])


func _test_double_jump(player: CharacterBody2D) -> void:
	await _respawn(player)
	var y_ground: float = player.position.y  # 基准必须是地面起跳点；上一版从半空取基准，
	# 量出来 54.8 px < 单跳 67.2 px 其实是「从空中算」，不是二段跳真的更矮
	Input.action_press("jump")
	await _frames(6)
	Input.action_release("jump")  # 必须真松一次，否则第二次 press 不产生 just_pressed 边沿
	await _frames(14)  # 已经升到接近顶点
	Input.action_press("jump")
	await _frames(4)
	var vy: float = player.velocity.y
	_check(vy < -P.JUMP_VELOCITY * 0.8, "空中再按跳能接上二段（vy=%.1f）" % vy)
	var y_top := player.position.y
	for _i in 40:
		await physics_frame
		y_top = minf(y_top, player.position.y)
	Input.action_release("jump")  # 二段跳要按住到顶点再松：上一版 4 帧就松，
	# 被 jump cut 腰斩（只剩 8 px 上升），看起来像「二段跳无效」其实是测试自己剪的
	var rise_double: float = y_ground - y_top
	_check(rise_double > _single_peak_rise * 1.2,
			"二段跳比单跳明显更高（%.1f px vs 单跳 %.1f px）" % [rise_double, _single_peak_rise])


func _test_dash(player: CharacterBody2D) -> void:
	await _respawn(player)
	Input.action_press("move_right")
	await _frames(6)
	Input.action_press("dash")
	await _frames(1)
	Input.action_release("dash")
	var x0: float = player.position.x
	await _frames(P.DASH_FRAMES)
	var moved: float = player.position.x - x0
	Input.action_release("move_right")
	_check(moved > P.dash_distance_px() * 0.6,
			"dash 在 %d 帧内推出 %.1f px（模型值 %.1f）" % [P.DASH_FRAMES, moved, P.dash_distance_px()])
	_check(player.state() == "DASH" or moved > 20.0, "dash 期间状态可观测（state=%s）" % player.state())


func _test_coyote(player: CharacterBody2D) -> void:
	await _respawn(player, Vector2(250, 300))  # 在左段地面上，跑向右边的沟沿
	Input.action_press("move_right")
	var jumped := false
	var frames_since_floor := 0
	for _i in 60:
		await physics_frame
		if not player.is_on_floor():
			frames_since_floor += 1
			if not jumped and frames_since_floor <= P.COYOTE_FRAMES:
				Input.action_press("jump")
				jumped = true
				break
	Input.action_release("move_right")
	Input.action_release("jump")
	_check(jumped, "离地后 %d 帧内仍能起跳（coyote 生效）" % P.COYOTE_FRAMES)


func _test_wall_slide(player: CharacterBody2D) -> void:
	# 竖井：左墙占 x=533..557、右墙占 x=588..612，把玩家丢在中间偏右并持续右推，
	# 它会贴住右墙的左表面（法线指向 -x），墙跳应把它往左顶
	await _respawn(player, Vector2(578, 150))
	Input.action_press("move_right")  # 往墙里推
	await _frames(30)
	var vy: float = player.velocity.y
	_check(vy <= P.WALL_SLIDE_MAX_FALL + 1.0,
			"贴墙下坠被限速（vy=%.1f ≤ %.1f）" % [vy, P.WALL_SLIDE_MAX_FALL])
	Input.action_press("jump")
	await _frames(2)
	Input.action_release("jump")
	Input.action_release("move_right")
	var vx: float = player.velocity.x
	_check(vx < -P.WALL_JUMP_VELOCITY.x * 0.5,
			"墙跳被推离墙面（vx=%.1f，应为负）" % vx)


# ==================== M2 战斗与反馈链 ====================

const CT := preload("res://sim/combat_table.gd")

var _parry_events := 0
var _deny_events := 0
var _kill_events := 0
var _hit_events := 0
var _reflect_events := 0
var _ach_events := 0
var _amb_at_depth1: Color = Color(0, 0, 0)


func _vitals(player: CharacterBody2D) -> Node:
	return player.get_node_or_null("Vitals")


func _combat(player: CharacterBody2D) -> Node:
	return player.get_node_or_null("Combat")


## 在玩家右边放一只满血 crawler，返回它（不依赖初始三只的位置，测试可重复）
func _spawn_crawler_near(player: CharacterBody2D) -> Node:
	return _spawn_crawler_at(player.position + Vector2(26, 0))


func _spawn_crawler_at(pos: Vector2) -> Node:
	var e := CharacterBody2D.new()
	e.set_script(load("res://scripts/enemy_crawler.gd"))
	e.position = pos
	_root.add_child(e)
	# 动态生成的敌人也要接计数器：上一版只给开局三只接，
	# 杀掉的却是新建那只 → 计数永远 0，误报「击杀链路断了」
	e.died.connect(func(_e, _r): _kill_events += 1)
	return e


func _test_combat_wiring(player: CharacterBody2D) -> void:
	var v := _vitals(player)
	var c := _combat(player)
	_check(v != null, "玩家挂了 Vitals（计量与玩家同生命周期）")
	_check(c != null, "玩家挂了 Combat")
	if v == null or c == null:
		return
	_check(absf(float(v.hp) - float(CT.ECONOMY["hp_max"])) < 0.01, "初始 HP = 上限（%.0f）" % float(v.hp))
	_check(absf(float(v.power) - float(CT.ECONOMY["power_max"])) < 0.01, "初始 PWR = 上限")
	# 本脚本是 SceneTree 不是 Node，没有 get_tree()；组查询直接用 SceneTree 自己的方法
	_check(get_nodes_in_group("enemies").size() >= 3, "灰盒里出了至少 3 只敌人")
	# 接计数器：信号没接上就会在这里暴露（06 的「静默没跑」教训）
	c.parry_succeeded.connect(func(_a): _parry_events += 1)
	c.projectile_reflected.connect(func(_p): _reflect_events += 1)
	c.attack_denied.connect(func(_r): _deny_events += 1)
	c.hit_registered.connect(func(_t, _i, _d): _hit_events += 1)
	for e in get_nodes_in_group("enemies"):
		e.died.connect(func(_e, _r): _kill_events += 1)


func _test_light_attack_kills(player: CharacterBody2D) -> void:
	await _respawn(player, Vector2(120, 300))
	var c := _combat(player)
	var v := _vitals(player)
	if c == null or v == null:
		_fail("Combat/Vitals 缺失，无法测攻击")
		return
	var e := _spawn_crawler_near(player)
	await _frames(3)
	# 氧只有击杀才回，拿它验证「奖励真的发到了玩家身上」（而不是只发了信号）
	v.o2 = 60.0
	var o2_before: float = float(v.o2)
	var hp0: float = float(e.hp)
	var before_hits := _hit_events
	# 面向右（敌人就在右边），连打三段
	for i in 3:
		if not is_instance_valid(e):
			break
		# 每一段前把敌人拉回射程：本项要验的是「三段够不够打死一只」，
		# 而不是「击退后能不能跟上」——后者归连招手感人验
		e.global_position = player.global_position + Vector2(26, 0)
		Input.action_press("attack_light")
		await _frames(2)
		Input.action_release("attack_light")
		# 一段完整周期 + 一点余量，保证下一段在连段窗内
		await _frames(int(CT.total_frames("light_1")) + 2)
	_check(_hit_events > before_hits, "轻击能结算命中（%d 次事件）" % (_hit_events - before_hits))
	_check(is_instance_valid(e) and float(e.hp) < hp0, "敌人掉血（%.1f → %.1f）" % [hp0, float(e.hp) if is_instance_valid(e) else -1.0])
	_check(not is_instance_valid(e) or float(e.hp) <= 0.0, "三段轻击足以击杀一只 crawler")
	await _frames(30)
	_check(_kill_events > 0, "击杀信号能送达装配层（%d 次）" % _kill_events)
	# 击杀现在只回 2 点氧（氧的主通道改成「弹反→处决」），所以这里验的是电那条线
	_check(float(v.power) > 0.0, "击杀后电力计量仍可用（%.1f）" % float(v.power))


func _test_parry_and_execute(player: CharacterBody2D) -> void:
	await _respawn(player, Vector2(120, 300))
	var c := _combat(player)
	var v := _vitals(player)
	if c == null or v == null:
		return
	var e := _spawn_crawler_near(player)
	await _frames(2)
	var hp_before: float = float(v.hp)
	# 先把电抽到 50：满电时弹反的 +14 会被上限夹住，
	# 断言「回电了没有」就变成永远测不出来的假绿
	v.power = 50.0
	var pwr_before: float = float(v.power)
	# 氧现在只由处决回（击杀只给 2），所以先抽干再验证处决能打回来
	v.o2 = 60.0
	var o2_before: float = float(v.o2)
	# 把敌人推到「前摇还剩 5 帧」的状态，模拟玩家读到招并按时弹反
	e.state = 2  # S.TELL
	e.frames_left = 5
	e.cooldown = 90
	await _frames(1)
	Input.action_press("parry")
	await _frames(1)
	Input.action_release("parry")
	await _frames(8)  # 跨过 active 起始帧（伤害结算点）
	_check(_parry_events > 0, "弹反窗口能成功接住敌人攻击")
	_check(absf(float(v.hp) - hp_before) < 0.01, "弹反成功时玩家不掉血（Δhp=%.2f）" % (float(v.hp) - hp_before))
	_check(float(v.power) > pwr_before, "弹反成功回电（%.1f → %.1f）" % [pwr_before, float(v.power)])
	_check(is_instance_valid(e) and bool(e.is_stunned()), "被弹的敌人进入硬直（处决窗口打开）")
	# 处决：对硬直目标按轻击
	if is_instance_valid(e):
		e.global_position = player.global_position + Vector2(20, 0)
		Input.action_press("attack_light")
		await _frames(2)
		Input.action_release("attack_light")
		await _frames(20)
		_check(not is_instance_valid(e) or float(e.hp) <= 0.0, "处决直接击杀硬直目标")
		# 氧的主来源就是处决（§3.3）：这一条代替原来的「击杀回氧」断言
		_check(float(v.o2) > o2_before,
				"处决真的回氧（%.1f → %.1f）" % [o2_before, float(v.o2)])


func _test_player_takes_damage(player: CharacterBody2D) -> void:
	await _respawn(player, Vector2(120, 300))
	var v := _vitals(player)
	if v == null:
		return
	var e := _spawn_crawler_near(player)
	await _frames(2)
	var hp0: float = float(v.hp)
	e.state = 2
	e.frames_left = 3
	e.cooldown = 90
	await _frames(8)  # 不弹反，让这一击落实
	var hp1: float = float(v.hp)
	_check(hp1 < hp0, "不弹反会被掉血（%.0f → %.0f，设计伤害 %.0f）" % [hp0, hp1, float(CT.enemy("crawler")["contact_damage"])])
	_check(int(v.invuln_frames) > 0, "受击后进入无敌帧（剩 %d）" % int(v.invuln_frames))
	# 无敌帧内再推一次攻击，应该不吃伤害
	e.state = 2
	e.frames_left = 3
	e.cooldown = 90
	await _frames(8)
	_check(absf(float(v.hp) - hp1) < 0.01, "无敌帧内第二击作废（%.0f → %.0f）" % [hp1, float(v.hp)])


func _test_power_gate(player: CharacterBody2D) -> void:
	await _respawn(player, Vector2(120, 300))
	var c := _combat(player)
	var v := _vitals(player)
	if c == null or v == null:
		return
	v.power = 0.0
	var deny_before := _deny_events
	Input.action_press("attack_heavy")
	await _frames(6)
	Input.action_release("attack_heavy")
	await _frames(4)
	_check(_deny_events > deny_before, "电不够时重击被拒（有反馈而非静默失败）")
	_check(str(c.snapshot()["phase"]) == "IDLE", "被拒后不进入攻击状态机")


## 玩家是否在相机可见横向范围内（留 24 px 边距，贴边也算跑出去了）。
## 半屏宽用设计分辨率的 320，不去读运行时窗口尺寸：那个值会随拉伸模式漂
func _on_screen(cam: Camera2D, who: Node2D) -> bool:
	var d: float = absf(who.global_position.x - cam.global_position.x)
	return d < 320.0 - 24.0


## 远程与弹反反射（制作人 2026-09-27 要求：双方都要有远程）
func _test_ranged_and_reflect(player: CharacterBody2D) -> void:
	await _respawn(player, Vector2(60, 300))
	var v := _vitals(player)
	var c := _combat(player)
	if v == null or c == null:
		_fail("Combat/Vitals 缺失")
		return
	# 必须显式回满：上一个用例（电门测试）把 power 置了 0 没恢复，
	# 导致本用例的飞鳌被「电不够」拒掉，看起来像远程功能坏了
	v.hp = float(CT.ECONOMY["hp_max"])
	v.o2 = float(CT.ECONOMY["o2_max"])
	v.power = float(CT.ECONOMY["power_max"])
	await _frames(2)

	# ① 玩家飞鳌能在远距离命中（并且真的扣电）
	# 不断言「这一只」而是断言「全体总血量」：训练房里还有三只游荡怪，
	# 弹丸可能先打到它们——那同样是「远程命中」，拿单只断言会变成假失败
	var sum0 := _enemy_hp_sum()
	var pw0: float = float(v.power)
	Input.action_press("shoot")
	await _frames(2)
	Input.action_release("shoot")
	await _frames(45)  # 前摇 6 + 飞行 150/300 ≈ 30 帧
	var dealt: float = sum0 - _enemy_hp_sum()
	_check(dealt >= 15.0, "飞鳌在 150px 外命中（总血量下降 %.1f）" % dealt)
	# 不能写 `or true` 这种永远成立的断言：这里改成验证远程真的消耗电
	_check(float(v.power) < pw0,
			"飞鳌确实消耗电（%.1f → %.1f）" % [pw0, float(v.power)])

	# ② 敌弹能打到玩家
	var sp := _spawn_spitter_at(Vector2(player.global_position.x + 120.0, player.global_position.y))
	await _frames(2)
	var php0: float = float(v.hp)
	sp.set("state", 2)          # S.TELL
	sp.set("frames_left", 3)
	sp.set("_tell_total", 3)
	sp.set("cooldown", 0)
	await _frames(50)           # 前摇 3 + 飞行 120/190 ≈ 38 帧
	_check(float(v.hp) < php0,
			"远程怪的刺能打到玩家（hp %.0f → %.0f）" % [php0, float(v.hp)])

	# ③ 弹反能反射敌弹：这是弹反对新敌型的唯一解，也是它值得练的理由
	await _respawn(player, Vector2(60, 300))
	v = _vitals(player)
	v.power = 100.0
	var php1: float = float(v.hp)
	Input.action_press("parry")
	await _frames(2)            # 起手 1 帧后开窗
	Input.action_release("parry")
	_root.call("spawn_projectile", "enemy",
			Vector2(player.global_position.x + 18.0, player.global_position.y - 10.0), -1.0, "spitter")
	# 弹丸要飞到判定半径内才会触发结算（190px/s ≈ 3.2px/帧）
	# 拿信号而不是拿节点引用：反射后它可能又打中怪而自行释放，届时 is_instance_valid 已为 false
	await _frames(10)
	_check(_reflect_events > 0, "弹反窗口内能把敌弹反射回去（%d 次）" % _reflect_events)
	_check(absf(float(v.hp) - php1) < 0.01, "反射成功时玩家不掉血")


## 全体敌人总血量（已释放的算 0）。用来验证「有东西被打到了」而不纠结是哪一只
func _enemy_hp_sum() -> float:
	var total := 0.0
	for n in get_nodes_in_group("enemies"):
		if is_instance_valid(n):
			total += float(n.get("hp"))
	return total


func _spawn_spitter_at(pos: Vector2) -> Node:
	var e := CharacterBody2D.new()
	e.set_script(load("res://scripts/enemy_crawler.gd"))
	e.set("enemy_id", "spitter")
	e.position = pos
	_root.add_child(e)
	e.add_to_group("spitter_probe")
	return e


## 平台高度玩法：弹台与塌台（制作人 2026-09-28 第四条）
## 这里故意不用 _respawn：它内部会 await 45 帧，而塌台只需 36 帧——
## 用它的第一个断言必输（上一版就是这个原因报「秒塌」）
func _test_platform_gameplay(player: CharacterBody2D) -> void:
	# ① 弹台：落上去要被弹得比普通跳更高
	# 位置要算准：从 200 自静止落到台面 260 需要约 20 帧（½gt²，g=900），
	# 上一版只等 14 帧就断言「被弹起」，玩家当时还在空中
	var bounce := _make_platform(Vector2(200, 260), 4, "bounce")
	_place(player, Vector2(216, 200))
	await _frames(26)
	_check(player.bounce_count() >= 1,
			"弹台把玩家弹起（%d 次，y=%.0f）" % [player.bounce_count(), player.global_position.y])
	var apex: float = player.global_position.y
	for _i in 20:
		await physics_frame
		apex = minf(apex, player.global_position.y)
	# 普通跳高约 64px，弹台 1.65 倍≈ 106px；从台面 260 往上至少要过 180
	_check(apex < 260.0 - 80.0,
			"弹台弹得比普通跳高（最高点 y=%.0f，台面 260）" % apex)
	
	# ② 塌台：踩满 0.6s 要塌，塌了玩家会掉下去，2s 后重生
	# 故意放在高空（y=140）：上一版放在 y=260，下方正好有灰盒几何接着，
	# 玩家「掉不下去」，断言变成了在测地图而不是测机制
	var crumble := _make_platform(Vector2(400, 140), 4, "crumble")
	_place(player, Vector2(416, 132))
	await _frames(12)
	_check(not crumble.is_broken(), "刚踩上时不该秒塌（需要 36 帧）")
	var y_on: float = player.global_position.y
	await _frames(40)
	_check(crumble.is_broken(), "踩满 0.6s 后塌台塌了")
	await _frames(30)
	_check(player.global_position.y > y_on + 60.0,
			"塌了之后玩家掉下去（y %.0f → %.0f）" % [y_on, player.global_position.y])
	await _frames(120)
	_check(not crumble.is_broken(), "2s 后塌台重生（路会重新出现）")

	# ③ 普通实心台不该塌
	var solid := _make_platform(Vector2(560, 140), 4, "solid")
	_place(player, Vector2(576, 132))
	await _frames(80)
	_check(not solid.is_broken(), "solid 台不会塌")


## 只放位置，不等落地（帧数由调用方控制）
func _place(player: CharacterBody2D, pos: Vector2) -> void:
	Input.action_release("move_left")
	Input.action_release("move_right")
	Input.action_release("jump")
	Input.action_release("dash")
	player.global_position = pos
	player.velocity = Vector2.ZERO


func _make_platform(top_left: Vector2, tiles: int, kind: String) -> NeonPlatform:
	var body := NeonPlatform.new()
	body.name = "Probe_%s_%d" % [kind, int(top_left.x)]
	body.kind = kind
	body.collision_layer = 2
	body.collision_mask = 0
	var size := Vector2(tiles * 16.0, 16.0)
	body.position = top_left + size * 0.5
	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = size
	col.shape = rect
	col.one_way_collision = true
	body.shape = col
	body.add_child(col)
	_root.add_child(body)
	return body


## 成就：事件→判定→提示→不重复。判定本身在 sim 测试里逐条钉过，
## 这里只验「接线通了」——上一批项目里成就最常见的死法是收集端没接上
func _test_achievements(_player: CharacterBody2D) -> void:
	var ach := _root.get_node_or_null("Achievements")
	if ach == null:
		_fail("装配层没有创建 Achievements 节点")
		return
	# 计数器必须是成员变量：GDScript 的 lambda 对局部变量是**按值捕获**，
	# 写成 var n = 0 再 connect(func(_d): n += 1) 永远加在副本上（上一版就是这个错）
	_ach_events = 0
	ach.unlocked.connect(func(_def): _ach_events += 1)
	# 持久化会让这个用例不可重复跑：上一局已经解锁的成就，这一局再弹 10 次也不会再响。
	# 所以拿到引用后先清回「空档」状态再测（相当于新安装）
	ach.stats.clear()
	ach.unlocked_ids.clear()
	ach.set_stat("parries", 0)
	ach.bump("parries", 9)
	_check(_ach_events == 0, "9 次弹反不应解锁（引擎侧）")
	ach.bump("parries", 1)
	_check(_ach_events == 1, "第 10 次弹反应解锁一次（引擎侧，实际 %d）" % _ach_events)
	ach.bump("parries", 5)
	_check(_ach_events == 1, "同一成就不得重复弹窗（再弹 5 次后仍为 1，实际 %d）" % _ach_events)
	await _frames(2)
	var hud := _root.get_node_or_null("Hud")
	if hud == null:
		_fail("没有 Hud 节点，成就提示无法验证")
		return
	var snap: Dictionary = hud.call("snapshot")
	_check(str(snap["toast"]).find("成就解锁") >= 0,
			"HUD 右上角应弹出成就提示，实际文案：%s" % str(snap["toast"]))
	var stats: Dictionary = ach.snapshot()["stats"]
	_check(int(stats.get("max_depth", 0)) >= 0, "tracker 能回读累计值")
	# 存档回环：上一版 load_save() 用了不存在的 get_keys()，错误在 _ready 里抛，
	# 不测这一条就会「看起来能玩、其实永远读不到档」
	ach.save()
	ach.stats.clear()
	ach.unlocked_ids.clear()
	ach.load_save()
	_check(int(ach.stats.get("parries", 0)) >= 10,
			"存档后能读回累计值（实际 %s）" % str(ach.stats.get("parries", 0)))
	_check(bool(ach.unlocked_ids.get("parry_10", false)), "已解锁名单能读回")


# ==================== M3 生成层 ====================

## 这三项对应制作人 2026-09-27 的三条反馈：太暗、掉坑无反馈、地图只有一屏
func _test_generated_level(player: CharacterBody2D) -> void:
	var v := _vitals(player)
	var hud := _root.get_node_or_null("Hud")
	_root.call("use_generated_level", 1)
	await _frames(6)
	# 记下 depth 1 的压暗色（必须在建层之后取，否则取到的是训练房的默认值）
	_amb_at_depth1 = _root.get_node("Lighting").call("ambient_color")
	var snap: Dictionary = _root.call("snapshot")
	_check(float(snap["world_width"]) > 640.0,
			"生成层比一屏宽（%.0f px，约 %.1f 屏）" % [float(snap["world_width"]), float(snap["world_width"]) / 640.0])

	# 亮度：灯的数量是「太暗」的可量化代理（没灯就只有玩家身上一个光源）
	var lamps := 0
	var lights := _root.get_node("Lighting")
	for c in lights.get_children():
		# 用前缀而不是全名：同胞节点同名会被 Godot 自动加序号
		if c is PointLight2D and c.visible and str(c.name).begins_with("Lamp"):
			lamps += 1
	_check(lamps >= 4, "场景里至少有 4 盏常驻灯（实际 %d）" % lamps)
	# depth=1 一层至多 3 房，其时一个战斗房 → 至少 2 只
	_check(get_nodes_in_group("enemies").size() >= 2,
			"生成层至少 2 只敌人（%d 只）" % get_nodes_in_group("enemies").size())

	# 相机跟随（反馈第 1 条：「人走出去了相机不动」）。
	# 断言的是真正的需求：玩家必须在画面内，而不是「相机坐标等于玩家坐标」——
	# 靠边界时相机本来就该被 limit 顶住（上一版把这条写成了 cam≈人，必然失败）
	var cam := _root.get_node("Camera")
	_check(_on_screen(cam, player), "开局玩家在画面内（cam.x=%.0f 人 x=%.0f）" % [cam.global_position.x, player.global_position.x])
	var x_before: float = player.global_position.x
	Input.action_press("move_right")
	await _frames(200)
	Input.action_release("move_right")
	await _frames(25)  # 等平滑追上来
	# 入口房按生成规则没有沟，这段路应该是通的：上一版浮空平台是实心块，
	# 玩家跑 ~180 px 就撞在「1 格高的门槛」上，所以这个阈值同当「没有隐形墙」的把关
	var px: float = player.global_position.x
	_check(px - x_before > 300.0,
			"地面能一路跑通（%0.0f → %0.0f px，一层共 %.0f px）" % [x_before, px, float(snap["world_width"])])
	_check(cam.global_position.x > 320.0, "相机跟着往右移（cam.x=%.0f）" % cam.global_position.x)
	_check(_on_screen(cam, player), "跑动后玩家仍在画面内（这是「相机不动」的验收口径）")

	# 教程（反馈第 4 条：按键教程要在游戏里）
	var tut := _root.get_node_or_null("Tutorial")
	_check(tut != null, "有游戏内按键教程节点")
	if tut != null:
		var tshot: Dictionary = tut.call("snapshot")
		_check(bool(tshot["shown_ever"]), "开局弹过操作面板（之后淡出是设计）")
		_check(bool(tshot["strip_visible"]), "常驻按键底栏可见")

	# 寻路：网格已注入到敌人（注入顺序错了就会整层都是直线追击）。
	# 不拿「附近找现成的怪」碰运气：它们可能还在房间另一头，断言会变成调魔法数字；
	# 而是用网格自己选一个可站立点放怪，顺便把网格本身用一遍
	var grid = _root.get("_grid")
	_check(grid != null, "生成层有寻路网格")
	if grid != null:
		var cell: Vector2i = grid.call("nearest_standable",
				Vector2i(int((player.global_position.x + 220.0) / 16.0), int(player.global_position.y / 16.0)))
		_check(cell.x >= 0, "网格能找到可站立格（实测 %s）" % str(cell))
		var walker := _spawn_crawler_at(Vector2(cell.x * 16.0 + 8.0, cell.y * 16.0))
		_check(walker.get("nav_grid") != null, "新敌人拿到了寻路网格")
		var d0: float = walker.global_position.distance_to(player.global_position)
		walker.set("state", 1)      # S.CHASE
		walker.set("cooldown", 0)
		await _frames(90)
		var d1: float = walker.global_position.distance_to(player.global_position)
		_check(d1 < d0 - 20.0, "敌人沿路径接近玩家（距离 %.0f → %.0f）" % [d0, d1])
		_check(str(walker.call("state_name")) in ["CHASE", "TELL", "ACTIVE", "RECOVER", "STUNNED"],
				"追击状态正常推进（实际 %s）" % str(walker.call("state_name")))

	# 掉坑：放到 pit 以下一帧就该判死 + 弹横幅
	var pit_y: float = float(snap["pit_y"])
	player.global_position = Vector2(player.global_position.x, pit_y + 24.0)
	await _frames(4)
	_check(bool(v.dead), "掉出层会被判死（pit_y=%.0f）" % pit_y)
	# 重新取快照：上一行的 snap 是死之前拿的，拿它断言死亡计数恒为真，白测
	var dead_snap: Dictionary = _root.call("snapshot")
	_check(int(dead_snap["deaths"]) == 1, "死亡被计入本局（deaths=%d）" % int(dead_snap["deaths"]))
	_check(hud != null and bool(hud.call("snapshot")["death_visible"]),
			"死亡后屏中央有提示（不靠左上角小字）")

	# 重开：R 之后应该复活、回到坑上方、横幅消失
	_root.call("restart")
	await _frames(6)
	_check(not bool(v.dead), "按 R 能重开本层")
	_check(not bool(hud.call("snapshot")["death_visible"]), "重开后横幅收起")
	_check(float(player.global_position.y) < pit_y, "重生点在死亡线以上（y=%.0f < %.0f）" % [player.global_position.y, pit_y])
	_check(absf(float(v.hp) - float(CT.ECONOMY["hp_max"])) < 0.01, "重开后血量回满")

	# 下潜：碰电梯后 depth+1 且世界重建
	_root.call("_on_exit_reached")
	await _frames(6)
	var d2: Dictionary = _root.call("snapshot")
	_check(int(d2["depth"]) == 2, "走到出口会下潜一层（depth=%d）" % int(d2["depth"]))
	_check(float(d2["world_width"]) > 640.0, "新一层重建完成且比一屏宽")
	_check(not bool(v.dead), "下潜后玩家是活的")

	# 关卡特异性：换层必须换群系，而且平台节点要真的建出来（不只是数据里有）
	_check(str(d2["biome"]) == "trench",
			"depth=2 应为无光深渊，实际 %s" % str(d2["biome"]))
	var pkinds: Dictionary = d2["platform_kinds"]
	_check(pkinds.size() >= 1,
			"新一层建出了平台节点：%s" % str(pkinds))
	var astats: Dictionary = _root.get_node("Achievements").snapshot()["stats"]
	_check(int(astats.get("max_depth", 0)) >= 2,
			"下潜会抬升成就用的最大深度（%d）" % int(astats.get("max_depth", 0)))
	# 群系特异性必须走到渲染层：只改贴图而 CanvasModulate 不变，拍出来就是同一张图
	var rig := _root.get_node("Lighting")
	var amb: Color = rig.call("ambient_color")
	_check(amb != _amb_at_depth1,
			"换层后压暗色必须变（depth1 %s → depth2 %s），否则特异性只在数据里" % [
				str(_amb_at_depth1), str(amb)])
