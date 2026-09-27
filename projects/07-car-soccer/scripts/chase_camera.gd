extends Camera3D
## chase_camera.gd — 第三人称追逐相机，双模式一键切换（选型 §0 的 M1 验收项）：
##   球追随（ball-cam，默认）：机位在车的「背球侧」，看球——火箭联盟的核心体验；
##   车追随：机位在车尾，看车前——开球对位/回防时更直观。
## 位置用指数平滑，高速/boost 抬 FOV；trauma 震屏由导演/球撞击调用 kick()。

var target: Node3D
var ball: Node3D
var ball_cam := true

var _trauma := 0.0
var _look := Vector3.ZERO
var _base_fov := 72.0


func _ready() -> void:
	fov = _base_fov
	current = true


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ballcam_toggle"):
		ball_cam = not ball_cam


func kick(amount: float) -> void:
	_trauma = minf(1.0, _trauma + amount)


func _physics_process(dt: float) -> void:
	if target == null:
		return
	var car_pos := target.global_position
	var car_forward: Vector3 = target.basis.z  # 车辆前进方向 = 本地 +Z（实测）
	car_forward.y = 0.0
	if car_forward.length() < 0.1:
		car_forward = Vector3(1, 0, 0)
	car_forward = car_forward.normalized()

	var desired: Vector3
	var look_target: Vector3
	if ball_cam and ball != null:
		var ball_pos := ball.global_position
		var away := car_pos - ball_pos
		away.y = 0.0
		if away.length() < 0.5:
			away = -car_forward
		away = away.normalized()
		desired = car_pos + away * 9.4 + Vector3(0, 4.0, 0)
		look_target = ball_pos + Vector3(0, 0.6, 0)
	else:
		desired = car_pos - car_forward * 8.2 + Vector3(0, 3.6, 0)
		look_target = car_pos + car_forward * 9.0 + Vector3(0, 1.2, 0)

	var k: float = 1.0 - exp(-9.0 * dt)
	global_position = global_position.lerp(desired, k)
	_look = _look.lerp(look_target, k)
	look_at(_look, Vector3.UP)

	# 速度感：boost/高速时拉视野
	var speed: float = target.linear_velocity.length() if target is Node3D else 0.0
	fov = lerpf(fov, _base_fov + clampf(speed - 18.0, 0.0, 14.0) * 0.7, 1.0 - exp(-4.0 * dt))

	# trauma 震屏（06 camera_shake 的简化版：位置抖动 + 快速衰减）
	if _trauma > 0.0:
		_trauma = maxf(0.0, _trauma - dt * 1.6)
		var amp := _trauma * _trauma * 0.5
		var t := Time.get_ticks_msec() / 1000.0
		var off := Vector3(
			sin(t * 57.0) * amp, sin(t * 63.0 + 1.3) * amp, sin(t * 49.0 + 2.6) * amp)
		global_position += off
