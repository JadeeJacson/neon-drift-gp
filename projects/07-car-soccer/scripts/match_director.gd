extends Node
## match_director.gd — sim/rules.gd 状态机的场景执行者 + 赛事表现（开球复位/
## 进球庆祝/终场）。规则判定全部在 sim（纯函数已断言），这里只做执行与发信号。
## 物体冻结策略：KICKOFF/GOAL_PAUSE 相位冻结球与车（开球站位不漂移），
## PLAYING 解冻；进球瞬间只冻结球（车可继续滑行，更像真实赛场）。

signal state_changed(state: Dictionary)
signal countdown(n: int)   # 3/2/1 倒数；0 = GO
signal goal_scored(team: String, score_blue: int, score_orange: int)
signal match_ended(winner: String)

const MatchRules = preload("res://sim/rules.gd")

var state: Dictionary = {}
var arena: Node3D
var ball: RigidBody3D
var car_blue: RigidBody3D
var car_orange: RigidBody3D

var _prev_phase := ""
var _last_count := -1


func setup(p_arena: Node3D, p_ball: RigidBody3D, p_blue: RigidBody3D, p_orange: RigidBody3D) -> void:
	arena = p_arena
	ball = p_ball
	car_blue = p_blue
	car_orange = p_orange
	state = MatchRules.initial()
	_prev_phase = ""
	_last_count = -1
	for sensor in get_tree().get_nodes_in_group("goal_sensor"):
		# set_meta 不进 tscn，防守方从节点名（GoalSensor_blue/orange）推导
		var defended := "blue" if String(sensor.name).contains("blue") else "orange"
		sensor.body_entered.connect(_on_goal_sensor.bind(defended))
	_reset_kickoff()
	state_changed.emit(state)


func _physics_process(dt: float) -> void:
	if state.is_empty():
		return
	state = MatchRules.tick(state, dt)
	var phase: String = state["phase"]
	if phase != _prev_phase:
		_on_phase_changed(phase)
		_prev_phase = phase
	if phase == MatchRules.PHASE_KICKOFF:
		var n := clampi(ceili(float(state["phase_left"]) / 0.8), 1, 3)
		if n != _last_count:
			_last_count = n
			countdown.emit(n)
	state_changed.emit(state)


func _on_phase_changed(to: String) -> void:
	if to == MatchRules.PHASE_KICKOFF:
		_reset_kickoff()
	elif to == MatchRules.PHASE_PLAYING:
		_set_frozen(false)
		countdown.emit(0)
	elif to == MatchRules.PHASE_FULL:
		_set_frozen(true)
		match_ended.emit(String(state["winner"]))


## 进球：传感器在蓝门内触发 defended="blue" → 橙队得分
func _on_goal_sensor(body: Node3D, defended: String) -> void:
	if body != ball or not MatchRules.is_live(state):
		return  # 非 PLAYING 相位的进球一律不计（规则层幂等 + 这层再挡一次）
	var scoring := "orange" if defended == "blue" else "blue"
	state = MatchRules.on_goal(state, scoring)
	goal_scored.emit(scoring, int(state["score_blue"]), int(state["score_orange"]))
	if String(state["phase"]) == MatchRules.PHASE_GOAL:
		ball.freeze = true  # 球留在网里，车继续滑行
	elif String(state["phase"]) == MatchRules.PHASE_FULL:
		_set_frozen(true)
		match_ended.emit(String(state["winner"]))


func _reset_kickoff() -> void:
	_set_frozen(true)
	ball.reset_to(arena.BALL_SPAWN)
	# ⚠️ 实测（tools/_dbg_car.gd，2026-09-27）：Godot 4.7 VehicleBody3D 的正
	# engine_force 沿本地 +Z 推进——不是文档直觉的 -Z。蓝方要朝 +x 就给 +90°。
	_teleport(car_blue, arena.KICKOFF_BLUE, PI / 2.0)
	_teleport(car_orange, arena.KICKOFF_ORANGE, -PI / 2.0)
	_last_count = -1


func _teleport(car: RigidBody3D, pos: Vector3, yaw: float) -> void:
	car.freeze = true
	car.global_position = pos
	car.rotation = Vector3(0, yaw, 0)
	car.linear_velocity = Vector3.ZERO
	car.angular_velocity = Vector3.ZERO


func _set_frozen(frozen: bool) -> void:
	ball.freeze = frozen
	car_blue.freeze = frozen
	car_orange.freeze = frozen


## 冒烟/调试用：直接改时钟（不改规则状态机的其余部分）
func force_clock(t: float) -> void:
	state["clock"] = t


func restart() -> void:
	state = MatchRules.initial()
	_prev_phase = ""
	_reset_kickoff()
	state_changed.emit(state)
