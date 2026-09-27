extends CharacterBody3D
class_name PlayerShip
## 玩家飞船：arcade 飞行（鼠标虚拟摇杆 + 油门 + 滚转 + 推进）。
## 积分手动做，不依赖物理重力——太空没有重力，也没有地面可站。

signal bounds_changed(inside: bool)
signal boosted(active: bool)

const MIN_SPEED := 30.0
const MAX_SPEED := 120.0
const BOOST_SPEED := 200.0
const SPEED_RESP := 2.2        # 油门响应（越大越贼）
const PITCH_SENS := 0.0026     # 弧度 / 像素
const YAW_SENS := 0.0030
const ROLL_RATE := 1.9
const BOUND := 600.0

## 各 GLB 的前向轴校正（tools/measure_ships.gd 实测后填；初始为占位零值）
const MODEL_YAW := {
	"spaceship-uCeLfsdmNP.glb": 0.0,
	"spaceship-htfBk9vPfw.glb": 0.0,
}

var root: GameRoot
var vitals: PlayerVitals
var weapon: WeaponController
var sfx: SfxPool
var camera_rig: CameraRig

var throttle: float = 0.5
var speed: float = 60.0
var boosting: bool = false
var _inside_bounds: bool = true
var _mouse_rel := Vector2.ZERO
var _model: Node3D
var _engine_sfx: AudioStreamPlayer


func _input(event: InputEvent) -> void:
	# Input 单例没有「读取并清零相对位移」的 API（4.7 实测），自己累积消费。
	var mm := event as InputEventMouseMotion
	if mm != null:
		_mouse_rel += mm.relative


func _ready() -> void:
	add_to_group("player")
	collision_layer = 2   # player
	collision_mask = 1    # 撞小行星
	var shape := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 3.0
	shape.shape = sphere
	add_child(shape)

	vitals = PlayerVitals.new()
	vitals.name = "Vitals"
	add_child(vitals)

	weapon = WeaponController.new()
	weapon.name = "Weapon"
	add_child(weapon)

	_model = _build_model()
	_model.name = "Visual"
	add_child(_model)

	_engine_sfx = AudioStreamPlayer.new()
	_engine_sfx.name = "EngineSfx"
	var loop_stream := load("res://assets/audio/sfx/engine/spaceEngine_000.ogg")
	if loop_stream != null:
		if "loop" in loop_stream:
			loop_stream.set("loop", true)
		_engine_sfx.stream = loop_stream
		_engine_sfx.volume_db = -50.0
	add_child(_engine_sfx)
	if loop_stream != null:
		_engine_sfx.play()


## 由 GameRoot 装配时调用（相机与音效池此时已存在）。
func setup(rig: CameraRig, sfx_pool: SfxPool) -> void:
	camera_rig = rig
	sfx = sfx_pool
	weapon.setup(self, rig, sfx_pool)


func reset() -> void:
	global_position = Vector3.ZERO
	basis = Basis.IDENTITY
	velocity = Vector3.ZERO
	throttle = 0.5
	speed = 60.0
	boosting = false
	_inside_bounds = true
	vitals.reset()


func _physics_process(delta: float) -> void:
	if root == null:
		root = get_tree().get_first_node_in_group("game_root") as GameRoot
		if root == null:
			return
	if root.state != GameRoot.State.PLAYING:
		_mouse_rel = Vector2.ZERO
		_engine_sfx.volume_db = move_toward(_engine_sfx.volume_db, -50.0, 60.0 * delta)
		return

	vitals.tick(delta)
	_read_stick()
	_apply_throttle(delta)
	_integrate(delta)
	_update_engine_audio()

	weapon.tick(delta, Input.is_action_pressed("fire_primary"))


## 鼠标相对位移即「虚拟摇杆」：偏离中心越多角速度越大。
func _read_stick() -> void:
	var rel := _mouse_rel
	_mouse_rel = Vector2.ZERO
	rotate_object_local(Vector3.RIGHT, -rel.y * PITCH_SENS)
	rotate_object_local(Vector3.UP, -rel.x * YAW_SENS)
	var roll := Input.get_axis("roll_left", "roll_right")
	if absf(roll) > 0.01:
		rotate_object_local(Vector3.BACK, roll * ROLL_RATE * get_physics_process_delta_time())


func _apply_throttle(delta: float) -> void:
	var axis := Input.get_axis("throttle_down", "throttle_up")
	throttle = clampf(throttle + axis * 0.8 * delta, 0.0, 1.0)
	var want_boost := Input.is_action_pressed("boost") and throttle > 0.6
	if want_boost != boosting:
		boosting = want_boost
		boosted.emit(boosting)
	var target := lerpf(MIN_SPEED, MAX_SPEED, throttle)
	if boosting:
		target = BOOST_SPEED
	speed = lerpf(speed, target, 1.0 - exp(-SPEED_RESP * delta))


func _integrate(delta: float) -> void:
	velocity = -global_basis.z * speed
	move_and_slide()

	# 球形战区软边界：越界缓慢推回，HUD 提示返航
	var dist := global_position.length()
	var inside := dist <= BOUND
	if inside != _inside_bounds:
		_inside_bounds = inside
		bounds_changed.emit(inside)
	if dist > BOUND:
		var dir := global_position / dist
		global_position -= dir * (dist - BOUND) * minf(1.0, 3.0 * delta)


func _update_engine_audio() -> void:
	var norm := (speed - MIN_SPEED) / (BOOST_SPEED - MIN_SPEED)
	_engine_sfx.volume_db = lerpf(-38.0, -6.0, clampf(norm, 0.0, 1.0))
	_engine_sfx.pitch_scale = 0.85 + 0.5 * clampf(norm, 0.0, 1.0)


func _build_model() -> Node3D:
	var holder := Node3D.new()
	var ps := load("res://assets/models/ships/spaceship-uCeLfsdmNP.glb") as PackedScene
	if ps == null:
		push_error("玩家飞船模型缺失")
		return holder
	var inst := ps.instantiate()
	holder.add_child(inst)
	holder.scale = Vector3.ONE * 0.55  # 实测原件 9.9×2.4×11.2 m（tools/measure_ships.gd）→ 约 6 m 舰长
	holder.rotation_degrees.y = float(MODEL_YAW.get("spaceship-uCeLfsdmNP.glb", 0.0))
	return holder
