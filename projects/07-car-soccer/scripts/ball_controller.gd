extends RigidBody3D
## ball_controller.gd — 球：表现与保护逻辑。物理参数来自 tools/physics_probe.gd 实测：
## 弹跳合成近似取两侧较大值 → 球/地材质都设 0.55；滚动阻力 linear_damp=0.5；
## CCD 开（实测 60 m/s 不穿 0.5m 薄墙，双保险）。
## ⚠️ Poly Pizza 的球 GLB 是百万米尺度 + 巨大偏移（verify_assets 实测），
## 所以视觉网格在 _ready 里自动归一化到标准半径——换球模也不用改任何数值。

const RADIUS := 1.1
const MASS := 6.0
const MAX_SPEED := 55.0
const VISUAL_SCENE := "res://assets/models/ball_soccer.glb"

var _sfx: AudioStreamPlayer3D
var _hit_streams: Array = []


func _ready() -> void:
	contact_monitor = true
	max_contacts_reported = 4
	body_entered.connect(_on_body_entered)
	_normalize_visual()
	_sfx = AudioStreamPlayer3D.new()
	_sfx.unit_size = 14.0
	_sfx.max_db = 3.0
	add_child(_sfx)
	for i in range(3):
		_hit_streams.append(load("res://assets/audio/sfx/ball_hit/impactGeneric_light_00%d.ogg" % i))


## 视觉网格自适应：按最大维度缩放到直径 2R，并把偏移中心拉回原点。
func _normalize_visual() -> void:
	for child in get_children():
		if child is Node3D and not (child is CollisionShape3D):
			var holder := child as Node3D
			var aabb := _merged_aabb(holder)
			if aabb.size.length() <= 0.0:
				continue
			var s: float = (2.0 * RADIUS) / aabb.size.x  # 球是等比的，取 x 即可
			holder.scale = Vector3.ONE * s
			holder.position = -aabb.get_center() * s


func _merged_aabb(node: Node) -> AABB:
	var total := AABB()
	var has := false
	if node is MeshInstance3D:
		total = (node as MeshInstance3D).get_aabb()
		has = true
	for child in node.get_children():
		var child_aabb := _merged_aabb(child)
		if child_aabb.size.length() > 0.0:
			var xf: Transform3D = (child as Node3D).transform if child is Node3D else Transform3D.IDENTITY
			var moved := xf * child_aabb
			total = moved if not has else total.merge(moved)
			has = true
	return total


func _physics_process(_dt: float) -> void:
	var v := linear_velocity
	if not (is_finite(v.x) and is_finite(v.y) and is_finite(v.z)):
		reset_to(Vector3(0, RADIUS + 0.5, 0))  # NaN 哨兵（选型 §7 风险表）
		return
	if v.length() > MAX_SPEED:
		linear_velocity = v.normalized() * MAX_SPEED


## 传球的撞击声：冲量越大音量/音色越重
func _on_body_entered(_body: Node) -> void:
	var strength := linear_velocity.length()
	if strength < 2.0 or _sfx == null or _hit_streams.is_empty():
		return
	_sfx.stream = _hit_streams[randi() % _hit_streams.size()]
	_sfx.pitch_scale = clampf(1.25 - strength / 40.0, 0.8, 1.2)
	_sfx.volume_db = clampf(-14.0 + strength * 0.5, -14.0, 2.0)
	_sfx.play()


## 瞬移复位（开球/进球回位用）：位置、速度、角速度一起清
func reset_to(pos: Vector3) -> void:
	freeze = true
	global_position = pos
	linear_velocity = Vector3.ZERO
	angular_velocity = Vector3.ZERO
	freeze = false
