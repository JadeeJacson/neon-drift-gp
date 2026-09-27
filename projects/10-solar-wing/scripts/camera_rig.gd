extends Node3D
class_name CameraRig
## 第三人称追尾相机：不作玩家子节点，自己做弹簧跟随（滞后感 + 抖动不污染机体姿态）。

const DIST := 11.5
const HEIGHT := 2.6
const FOLLOW_RESP := 8.0
const ROT_RESP := 6.0
const BASE_FOV := 75.0
const BOOST_FOV := 88.0

var target: Node3D
var camera: Camera3D
var trauma: float = 0.0


func _ready() -> void:
	camera = Camera3D.new()
	camera.name = "Camera"
	camera.current = true
	camera.fov = BASE_FOV
	camera.far = 20000.0
	camera.near = 0.2
	add_child(camera)


func setup(player: Node3D) -> void:
	target = player
	global_position = player.global_position


func add_trauma(amount: float) -> void:
	trauma = clampf(trauma + amount, 0.0, 1.0)


func _process(delta: float) -> void:
	if target == null:
		return
	# 朝向：把玩家姿态平滑过来（滞后一点点，狗斗时有「甩尾」感）
	var want := target.global_transform.basis.get_rotation_quaternion()
	var have := global_transform.basis.get_rotation_quaternion()
	var q := have.slerp(want, 1.0 - exp(-ROT_RESP * delta))
	var desired := target.global_position + (Basis(q) * Vector3(0.0, HEIGHT, DIST))
	global_position = global_position.lerp(desired, 1.0 - exp(-FOLLOW_RESP * delta))
	basis = Basis(q)

	# 抖动：trauma 平方衰减，纯相机局部，不动飞船
	trauma = maxf(0.0, trauma - delta * 1.6)
	if trauma > 0.001:
		var amp := trauma * trauma * 1.2
		camera.position = Vector3(
			randfn(0.0, amp),
			randfn(0.0, amp),
			0.0)
	else:
		camera.position = Vector3.ZERO

	var want_fov := BOOST_FOV if _target_boosting() else BASE_FOV
	camera.fov = lerpf(camera.fov, want_fov, 1.0 - exp(-5.0 * delta))


func _target_boosting() -> bool:
	var ship := target as PlayerShip
	return ship != null and ship.boosting
