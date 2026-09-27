extends VehicleBody3D
## car_controller.gd — 街机车：一辆脚本同时服务玩家（输入）与 AI（sim 意图）。
## 车轮装配是数据驱动的：kart GLB 里 4 个 wheel-* 节点被实测存在（verify_assets），
## _ready 时按它们的全局位置生成 VehicleWheel3D 并把轮子网格 reparent 过去——
## 换车模不用改任何硬编码坐标（06 viewmodel 朝向教训的工程化）。
## AI 决策每 react_interval 秒问一次 sim/ai_brain.gd（纯函数），本文件只执行。

const AiBrain = preload("res://sim/ai_brain.gd")
const BoostTable = preload("res://sim/boost_table.gd")

const KART_SCENE_PATHS := {
	"blue": "res://assets/models/car/kart-oobi.glb",
	"orange": "res://assets/models/car/kart-oozi.glb",
}
const KART_SCALE := 2.5            # kart 实测长 1.43 m → 3.58 m
const MASS := 220.0
const ENGINE_FORCE := 3400.0
const BOOST_FORCE := 2800.0
const BRAKE_FORCE := 60.0
const MAX_STEER := 0.55
const MAX_STEER_HIGH_SPEED := 0.20
const SPEED_CAP := 24.0
const SPEED_CAP_BOOST := 33.0
const REVERSE_CAP := 10.0         # 倒车限速（街机：倒挡比前进慢）
const GRIP := 3.2                  # wheel_friction_slip（街机高抓地）
const GRIP_HANDBRAKE := 1.05       # 手刹漂移：后轮侧向抓地骤降
const JUMP_VELOCITY := 6.5
const FLIP_IMPULSE := 5.8          # 二段跳翻滚的 Δv
## 车辆物理前进方向 = 本地 +Z（实测，见 match_director._reset_kickoff 注释），
## 模型默认朝 -Z，预转 180° 让视觉与驱动一致；截图若反了改回 0。
const MODEL_YAW_DEG := 180.0
const AI_REACT_INTERVAL := 0.15

var team := "blue"
var is_player := true
var boost := 60.0
var boosting := false

var _wheels: Array = []            # [fl, fr, rl, rr] VehicleWheel3D
var _steer := 0.0
var _jumps_left := 2
var _air_time := 0.0
var _unstick_timer := 0.0
var _stuck_time := 0.0
var _react_left := 0.0
var _intent: Dictionary = {}
var _arena: Node3D
var _engine_sfx: AudioStreamPlayer3D
var _boost_sfx: AudioStreamPlayer3D
var _engine_loops: Array = []
var _flame: GPUParticles3D


func _ready() -> void:
	mass = MASS
	collision_layer = 2
	collision_mask = 7
	center_of_mass_mode = RigidBody3D.CENTER_OF_MASS_MODE_CUSTOM
	center_of_mass = Vector3(0, -0.15, 0)
	_setup_visual_and_wheels()
	_setup_audio()
	_setup_flame()
	_setup_underglow()


func _setup_visual_and_wheels() -> void:
	var path: String = KART_SCENE_PATHS[team]
	var kart: Node3D = (load(path) as PackedScene).instantiate() as Node3D
	kart.scale = Vector3.ONE * KART_SCALE
	kart.rotation_degrees = Vector3(0, MODEL_YAW_DEG, 0)
	add_child(kart)
	var wheel_meshes: Array = []
	_collect_wheels(kart, wheel_meshes)
	# 前轮按 z 排序（Godot 车辆前向 -Z）：z 越小越靠前
	wheel_meshes.sort_custom(func(a: Node3D, b: Node3D) -> bool:
		return to_local(a.global_position).z < to_local(b.global_position).z)
	for mesh_node: Node3D in wheel_meshes:
		var center: Vector3 = to_local((mesh_node as Node3D).global_position)
		var vw := VehicleWheel3D.new()
		var radius: float = _wheel_radius(mesh_node)
		vw.wheel_radius = radius
		vw.suspension_travel = 0.28
		vw.suspension_stiffness = 58.0
		vw.suspension_max_force = 9000.0
		vw.damping_compression = 4.5
		vw.damping_relaxation = 3.2
		vw.wheel_friction_slip = GRIP
		vw.wheel_roll_influence = 0.08
		# 前轮 = +Z 端（车辆前进方向 = 本地 +Z，实测见 match_director 注释）
		vw.use_as_steering = center.z > 0.0
		vw.use_as_traction = true
		vw.position = center + Vector3(0, 0.06, 0)
		add_child(vw)
		# 轮子网格换爹：从车体网格挪到 VehicleWheel3D 下，随悬挂/转向转动
		var parent := mesh_node.get_parent()
		if parent != null:
			parent.remove_child(mesh_node)
		mesh_node.position = Vector3.ZERO
		mesh_node.rotation = Vector3.ZERO
		vw.add_child(mesh_node)
		_wheels.append(vw)


func _collect_wheels(node: Node, out: Array) -> void:
	if node is MeshInstance3D and String(node.name).to_lower().begins_with("wheel"):
		out.append(node)
		return
	for child in node.get_children():
		_collect_wheels(child, out)


func _wheel_radius(mesh_node: Node3D) -> float:
	# 注意：global_transform 已含 KART_SCALE（kart 挂在本车下），别再乘一次——
	# 重复缩放会把轮子放大 2.5 倍扎进地里，悬挂够不着地，整车失去驱动。
	var mi := mesh_node as MeshInstance3D
	if mi.mesh == null:
		return 0.34 * KART_SCALE
	var aabb := mi.get_aabb()
	var world_scale: float = mi.global_transform.basis.get_scale().y
	return maxf(0.15, aabb.size.y * world_scale * 0.5)


func _setup_audio() -> void:
	_engine_sfx = AudioStreamPlayer3D.new()
	_engine_sfx.unit_size = 8.0
	_engine_sfx.volume_db = -8.0
	add_child(_engine_sfx)
	for i in range(6):
		var stream: AudioStream = load("res://assets/audio/sfx/engine/loop_%d.wav" % i)
		if stream is AudioStreamWAV:
			var wav := stream as AudioStreamWAV
			var bytes_per_frame := 2 * (2 if wav.stereo else 1)
			wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
			wav.loop_begin = 0
			wav.loop_end = wav.data.size() / bytes_per_frame
		_engine_loops.append(stream)
	_engine_sfx.stream = _engine_loops[0]
	_engine_sfx.play()
	_boost_sfx = AudioStreamPlayer3D.new()
	_boost_sfx.unit_size = 10.0
	_boost_sfx.stream = load("res://assets/audio/sfx/boost/swish-4.wav")
	_boost_sfx.volume_db = -4.0
	add_child(_boost_sfx)


func _setup_flame() -> void:
	_flame = GPUParticles3D.new()
	_flame.amount = 40
	_flame.lifetime = 0.25
	_flame.emitting = false
	var mat := ParticleProcessMaterial.new()
	mat.direction = Vector3(0, 0, 1)
	mat.spread = 12.0
	mat.initial_velocity_min = 6.0
	mat.initial_velocity_max = 9.0
	mat.scale_min = 0.6
	mat.scale_max = 1.3
	mat.color = Color(1.0, 0.62, 0.15, 0.9)
	var mesh := QuadMesh.new()
	mesh.size = Vector2(0.55, 0.55)
	var mesh_mat := StandardMaterial3D.new()
	mesh_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mesh_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mesh_mat.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	mesh_mat.albedo_texture = load("res://assets/textures/particles/flame.png")
	mesh_mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mesh.material = mesh_mat
	_flame.process_material = mat
	_flame.draw_pass_1 = mesh
	_flame.position = Vector3(0, 0.55, 1.55)
	add_child(_flame)


## 队色底盘灯：霓虹联赛的队伍辨识（青=玩家 / 橙=AI），顺带解决夜场白车发灰
func _setup_underglow() -> void:
	var c := Color(0.2, 0.85, 1.0) if team == "blue" else Color(1.0, 0.55, 0.2)
	var lamp := OmniLight3D.new()
	lamp.light_color = c
	lamp.light_energy = 2.2
	lamp.omni_range = 4.5
	lamp.position = Vector3(0, 0.35, 0)
	lamp.shadow_enabled = false
	add_child(lamp)


func add_boost(amount: float) -> void:
	boost = BoostTable.picked_up(boost, amount >= BoostTable.BIG_PAD_AMOUNT * 0.9)


func _physics_process(dt: float) -> void:
	var throttle := 0.0
	var steer_input := 0.0
	var want_boost := false
	var want_handbrake := false
	var want_jump := false

	if is_player:
		if Input.get_action_strength("throttle_up") > 0.0:
			throttle = 1.0
		if Input.get_action_strength("throttle_down") > 0.0:
			throttle = -1.0
		steer_input = Input.get_action_strength("steer_left") - Input.get_action_strength("steer_right")
		want_boost = Input.get_action_strength("boost") > 0.0
		want_handbrake = Input.get_action_strength("handbrake") > 0.0
		want_jump = Input.is_action_just_pressed("jump")
	else:
		_react_left -= dt
		if _react_left <= 0.0:
			_react_left = AI_REACT_INTERVAL
			_intent = AiBrain.decide(_snapshot())
		var drive: Dictionary = _drive_toward(_intent)
		throttle = drive["throttle"]
		steer_input = drive["steer"]
		want_boost = bool(_intent.get("want_boost", false)) and drive["aligned"]
		want_jump = false
		# 卡死自救：1.6 s 挪不动就倒车
		var speed := linear_velocity.length()
		if speed < 0.6:
			_stuck_time += dt
		else:
			_stuck_time = 0.0
		if _stuck_time > 1.6:
			_unstick_timer = 0.7
			_stuck_time = 0.0
		if _unstick_timer > 0.0:
			_unstick_timer -= dt
			throttle = -1.0
			steer_input = -steer_input

	_apply_driving(throttle, steer_input, want_boost, want_handbrake)
	if want_jump:
		_try_jump()
	_update_feedback(dt)


func _apply_driving(throttle: float, steer_input: float, want_boost: bool, want_handbrake: bool) -> void:
	var speed := linear_velocity.length()
	var steer_cap: float = lerpf(MAX_STEER, MAX_STEER_HIGH_SPEED, clampf(speed / SPEED_CAP_BOOST, 0.0, 1.0))
	_steer = lerpf(_steer, clampf(steer_input, -1.0, 1.0) * steer_cap, 0.22)
	for w in _wheels:
		var wheel := w as VehicleWheel3D
		if wheel.use_as_steering:
			wheel.steering = _steer
		if want_handbrake and not wheel.use_as_steering:
			wheel.wheel_friction_slip = GRIP_HANDBRAKE
			wheel.brake = BRAKE_FORCE
		else:
			wheel.wheel_friction_slip = GRIP
			wheel.brake = 0.0

	boosting = false
	engine_force = 0.0
	# ⚠️ 油门判定（制作人实测踩过的两个锁死坑，别改回去）：
	# ① 油门方向与运动方向**相反**（倒行中按 W、前进中按 S）必须无条件放行——
	#    那是刹车/纠偏，若被速度帽拦掉，车会无阻力滑行到撞墙，操作像「失灵」；
	# ② 只有**同向加速**才受速度帽限制；boost 只在前进时喷。
	var flat := Vector3(linear_velocity.x, 0.0, linear_velocity.z)
	var flat_speed := flat.length()
	var signed_forward := flat.dot(transform.basis.z)  # + 前进 / - 倒行（前向 = 本地 +Z）
	if throttle != 0.0:
		var same_dir := signed_forward * signf(throttle) > 0.0
		var cap := SPEED_CAP
		if throttle < 0.0:
			cap = REVERSE_CAP
		elif want_boost:
			cap = SPEED_CAP_BOOST
		if not same_dir or flat_speed < cap:
			engine_force = ENGINE_FORCE * throttle
			if want_boost and throttle > 0.0 and boost > 0.0 and signed_forward > -0.5:
				engine_force += BOOST_FORCE
				boost = BoostTable.consumed(boost, get_physics_process_delta_time())
				boosting = true
	# 硬速度顶兜底：只削速率不削方向（正常驾驶到不了 33+，防高空坠落/碰撞奇点）
	if flat_speed > SPEED_CAP_BOOST:
		flat = flat.normalized() * SPEED_CAP_BOOST
		linear_velocity.x = flat.x
		linear_velocity.z = flat.z


func _try_jump() -> void:
	var grounded := false
	for w in _wheels:
		if (w as VehicleWheel3D).is_in_contact():
			grounded = true
			break
	if grounded:
		linear_velocity.y = maxf(linear_velocity.y, 0.0) + JUMP_VELOCITY
		_jumps_left = 1
		_air_time = 0.0
	elif _jumps_left > 0:
		_jumps_left -= 1
		# 翻滚：沿输入方向（无输入则车头方向）补一段冲量 + 视觉角速度
		var dir := transform.basis.z
		if is_player:
			var x := Input.get_action_strength("steer_right") - Input.get_action_strength("steer_left")
			var z := Input.get_action_strength("throttle_up") - Input.get_action_strength("throttle_down")
			if absf(x) > 0.1 or absf(z) > 0.1:
				dir = (transform.basis * Vector3(x, 0, -z)).normalized()
		apply_central_impulse(dir * FLIP_IMPULSE * mass)
		apply_torque_impulse(transform.basis.x * 220.0)


func _update_feedback(dt: float) -> void:
	var speed := linear_velocity.length()
	# 引擎：6 档转速循环随车速切档，档内用 pitch 微调
	if _engine_sfx != null and not _engine_loops.is_empty():
		var tier := clampi(int(speed / 5.5), 0, 5)
		var stream: AudioStream = _engine_loops[tier]
		if _engine_sfx.stream != stream:
			_engine_sfx.stream = stream
			_engine_sfx.play()
		_engine_sfx.pitch_scale = 0.85 + 0.25 * clampf((speed - tier * 5.5) / 5.5, 0.0, 1.0)
	if _flame != null:
		_flame.emitting = boosting
	if boosting and _boost_sfx != null and not _boost_sfx.playing:
		_boost_sfx.pitch_scale = randf_range(0.95, 1.1)
		_boost_sfx.play()
	if not is_player and _arena == null:
		_arena = get_tree().get_first_node_in_group("arena")


## AI：把 intent.target 转成油门/转向；返回 aligned 供 want_boost 用
func _drive_toward(intent: Dictionary) -> Dictionary:
	var target: Vector3 = intent.get("target_pos", Vector3.ZERO)
	if target == Vector3.ZERO or target == Vector3.INF:
		return {"throttle": 0.0, "steer": 0.0, "aligned": false}
	var to_target := target - global_position
	to_target.y = 0.0
	if to_target.length() < 0.5:
		return {"throttle": 0.0, "steer": 0.0, "aligned": false}
	var forward := transform.basis.z
	forward.y = 0.0
	var angle := forward.signed_angle_to(to_target.normalized(), Vector3.UP)
	# Godot 正 steering = 前轮左偏；角为正（目标在左侧）→ 正转向
	var steer := clampf(angle * 1.6, -1.0, 1.0)
	var throttle := 1.0
	var aligned := absf(angle) < 0.5
	if absf(angle) > 2.35:
		# 目标在正后方：倒车 + 反打
		throttle = -1.0
		steer = -clampf(angle, -1.0, 1.0)
	elif absf(angle) > 1.4:
		throttle = 0.45
	return {"throttle": throttle, "steer": steer, "aligned": aligned}


func _snapshot() -> Dictionary:
	var ball := _find_ball()
	var own_goal: Vector3 = Vector3(-36, 0, 0) if team == "blue" else Vector3(36, 0, 0)
	var target_goal: Vector3 = Vector3(36, 0, 0) if team == "blue" else Vector3(-36, 0, 0)
	var snap: Dictionary = {
		"ball_pos": ball.global_position if ball != null else Vector3.ZERO,
		"ball_vel": ball.linear_velocity if ball != null else Vector3.ZERO,
		"my_pos": global_position,
		"my_boost": boost,
		"own_goal_pos": own_goal,
		"target_goal_pos": target_goal,
		"params": AiBrain.default_params(),
	}
	if _arena != null:
		var pad: Vector3 = _arena.nearest_active_big_pad(global_position)
		if pad != Vector3.INF:
			snap["boost_pad_pos"] = pad
	return snap


func _find_ball() -> RigidBody3D:
	return get_tree().get_first_node_in_group("ball") as RigidBody3D
