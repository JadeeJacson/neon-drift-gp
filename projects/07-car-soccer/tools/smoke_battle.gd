extends SceneTree
## smoke_battle.gd — 载具足球闭环冒烟：真加载主场景、真开车、真触球、真进球、
## 真结算（verify.mjs 的 `smoke` 步骤执行体，文件名按验证器约定固定）。
## 只断言「结果状态」，不校验逐帧物理（路线图 §4.3 的统计口径）。
## 测试隔离手段：开球球先挪角（直线测试不被中圈球带偏）、射门时两车挪边线冻结
## （AI 是会追球的）。跑法：
##   $GODOT --headless --path projects/07-car-soccer -s res://tools/smoke_battle.gd

const MatchRules = preload("res://sim/rules.gd")

var _fails := 0
var _oks := 0


func _init() -> void:
	_run()


func _ok(cond: bool, label: String) -> void:
	if cond:
		_oks += 1
		print("[OK] ", label)
	else:
		_fails += 1
		print("[FAIL] ", label)


## 协程里的局部引用会活到函数结束（§5.0b 第 8 条）：主场景挪进独立函数载入
func _load_main() -> Node:
	var ps: PackedScene = load("res://scenes/main.tscn")
	return ps.instantiate()


func _wait(seconds: float) -> void:
	await create_timer(seconds).timeout


func _run() -> void:
	var main := _load_main()
	root.add_child(main)
	await process_frame
	await process_frame

	var arena: Node3D = main.get_node("Arena")
	var ball: RigidBody3D = main.get_node("Ball")
	var blue: RigidBody3D = main.get_node("CarBlue")
	var orange: RigidBody3D = main.get_node("CarOrange")
	var director: Node = main.get_node("Director")
	_ok(arena != null and ball != null and blue != null and orange != null and director != null,
		"主场景装配齐全")

	var wheels := 0
	for child in blue.get_children():
		if child is VehicleWheel3D:
			wheels += 1
	_ok(wheels == 4, "车辆 4 轮装配（实际 %d）" % wheels)
	_ok(String(director.state["phase"]) == MatchRules.PHASE_KICKOFF, "初始相位 KICKOFF")

	await _wait(3.2)
	_ok(String(director.state["phase"]) == MatchRules.PHASE_PLAYING, "倒计时后进入 PLAYING")

	# 玩家油门加速（先把开球球挪到角落——中圈那颗是真实碰撞体，会带偏直线测试）
	ball.reset_to(Vector3(-12, 1.2, -14))
	Input.action_press("throttle_up")
	await _wait(2.0)
	_ok(blue.linear_velocity.length() > 4.0, "玩家油门加速（v=%0.1f m/s）" % blue.linear_velocity.length())

	# 顶球：把球放到车前 6 m，保持油门 1.6 s
	ball.reset_to(blue.global_position + Vector3(6, 1.2, 0))
	await _wait(1.6)
	_ok(ball.linear_velocity.length() > 3.0, "车触球（球速 %0.1f m/s）" % ball.linear_velocity.length())
	Input.action_release("throttle_up")

	# 回归（制作人实测：倒行中 W 失灵、只能撞墙停）：倒车→按 W 必须刹停并恢复前进。
	# 先 restart 等进 PLAYING，再暂停导演（规则不走表，相位不会中途冻结/传送测试车），
	# 纯物理下做驾驶回归，完了恢复导演继续赛程断言。
	director.restart()
	var waited3 := 0.0
	while String(director.state["phase"]) != MatchRules.PHASE_PLAYING and waited3 < 4.0:
		await _wait(0.1)
		waited3 += 0.1
	director.set_physics_process(false)
	Input.action_press("throttle_down")
	waited3 = 0.0
	var rev_ok := false
	var rev_speed := 0.0
	while waited3 < 8.0:
		await _wait(0.2)
		waited3 += 0.2
		rev_speed = blue.linear_velocity.dot(blue.transform.basis.z)
		if rev_speed < -1.0:
			rev_ok = true
			break
	_ok(rev_ok, "倒车生效（%0.1f m/s）" % rev_speed)
	Input.action_release("throttle_down")
	Input.action_press("throttle_up")
	waited3 = 0.0
	var fwd_ok := false
	var fwd_speed := 0.0
	while waited3 < 4.0:
		await _wait(0.2)
		waited3 += 0.2
		fwd_speed = blue.linear_velocity.dot(blue.transform.basis.z)
		if fwd_speed > 3.0:
			fwd_ok = true
			break
	_ok(fwd_ok, "倒行中按 W 恢复前进（%0.1f m/s）" % fwd_speed)
	Input.action_release("throttle_up")
	director.set_physics_process(true)

	# 射入橙门：贴门快射（两辆车挪到边线冻结——路径上不能有任何车）。
	# 触球测试的球偶尔自己滚进大门=真实进球，所以比分断言用「前置比分 +1」相对量，
	# 且各相位断言全部改成轮询迁移（物理时序有抖动，固定等待不可靠）。
	var pre_score: int = int(director.state["score_blue"])
	var waited := 0.0
	while String(director.state["phase"]) != MatchRules.PHASE_PLAYING and waited < 4.0:
		await _wait(0.1)
		waited += 0.1
	var blue_was_frozen: bool = blue.freeze
	var orange_was_frozen: bool = orange.freeze
	orange.freeze = false
	orange.global_position = Vector3(0, 0.8, -17)
	orange.freeze = true
	blue.freeze = false
	blue.global_position = Vector3(0, 0.8, 17)
	blue.freeze = true
	ball.reset_to(Vector3(33, 1.3, 0))
	ball.linear_velocity = Vector3(20, 0, 0)
	waited = 0.0
	while String(director.state["phase"]) == MatchRules.PHASE_PLAYING and waited < 3.0:
		await _wait(0.1)
		waited += 0.1
	blue.freeze = blue_was_frozen
	orange.freeze = orange_was_frozen
	_ok(int(director.state["score_blue"]) == pre_score + 1, "进球判定（比分 %d:%d）" % [
		int(director.state["score_blue"]), int(director.state["score_orange"])])
	_ok(String(director.state["phase"]) == MatchRules.PHASE_GOAL, "进球后 GOAL_PAUSE")

	# 重复触发不重复计分（06 清波重复教训）
	director._on_goal_sensor(ball, "orange")
	_ok(int(director.state["score_blue"]) == pre_score + 1, "重复触发不重复计分")

	waited = 0.0
	while String(director.state["phase"]) != MatchRules.PHASE_KICKOFF and waited < 4.0:
		await _wait(0.1)
		waited += 0.1
	_ok(String(director.state["phase"]) == MatchRules.PHASE_KICKOFF, "GOAL_PAUSE 后回 KICKOFF")
	_ok(ball.global_position.distance_to(arena.BALL_SPAWN) < 2.0, "球回开球点")
	waited = 0.0
	while String(director.state["phase"]) != MatchRules.PHASE_PLAYING and waited < 3.5:
		await _wait(0.1)
		waited += 0.1
	_ok(String(director.state["phase"]) == MatchRules.PHASE_PLAYING, "再次开球进入 PLAYING")

	# AI 会主动移动
	var q0: Vector3 = orange.global_position
	await _wait(2.5)
	_ok(orange.global_position.distance_to(q0) > 2.0, "AI 车主动移动（位移 %0.1f m）" % orange.global_position.distance_to(q0))

	# boost pad 拾取：放到「最近可用」大 pad 上（AI 可能已吃掉某个 pad，冷却中）
	var pad_pos: Vector3 = arena.nearest_active_big_pad(blue.global_position)
	_ok(pad_pos != Vector3.INF, "存在可用大 pad")
	blue.freeze = false
	blue.global_position = Vector3(pad_pos.x, 0.8, pad_pos.z)
	blue.linear_velocity = Vector3.ZERO
	blue.boost = 0.0
	await _wait(0.8)
	_ok(blue.boost > 20.0, "boost pad 拾取（%0.0f）" % blue.boost)

	# 时钟流逝 + 提前终场 + 重开（触球测试的球可能在 AI 观察窗里自己进门——
	# 那是真实进球，会把相位拖回 KICKOFF，所以 force_clock 后轮询终场而不是死等）
	var c0: float = float(director.state["clock"])
	await _wait(0.5)
	var c1: float = float(director.state["clock"])
	_ok(c1 < c0 or String(director.state["phase"]) != MatchRules.PHASE_PLAYING, "比赛时钟在走或正处于赛事相位切换")
	director.force_clock(1.5)
	var waited2 := 0.0
	while String(director.state["phase"]) != MatchRules.PHASE_FULL and waited2 < 6.0:
		await _wait(0.1)
		waited2 += 0.1
	_ok(String(director.state["phase"]) == MatchRules.PHASE_FULL, "时间到终场 FULL_TIME")
	director.restart()
	await process_frame
	_ok(int(director.state["score_blue"]) == 0 and int(director.state["score_orange"]) == 0, "重开比分清零")
	_ok(String(director.state["phase"]) == MatchRules.PHASE_KICKOFF, "重开回到 KICKOFF")

	# NaN / 出界哨兵
	_ok(is_finite(ball.global_position.x) and absf(ball.global_position.x) < 46.0 and absf(ball.global_position.z) < 30.0,
		"球在场地内且坐标有限")

	print("=== smoke: %d OK / %d FAIL ===" % [_oks, _fails])
	main.queue_free()
	await process_frame
	quit(0 if _fails == 0 else 1)
