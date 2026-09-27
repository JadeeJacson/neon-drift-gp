extends CharacterBody3D
class_name EnemyShip
## 敌机执行层：sim/enemy_ai 输出意图，这里只管位移、开火与死亡表现。
## 数值全部来自 ShipTable，模型朝向按实测表配置。

signal died(enemy: EnemyShip)

const MODEL_DIR := "res://assets/models/ships/"
## 实测包围盒（tools/measure_ships.gd，入树后测才准）→ 每型按「哪根轴该朝前/该展平」旋转：
##   interceptor 0.68×3.81×4.28 —— 侧躺（翼展在 Y 上）→ 绕 Z 转 90 立起来，长 4.3 翼展 3.8，×1.2 ≈ 5 m
##   bomber      1.09×4.59×2.80 —— 竖立 → 绕 X 转 -90 放平，长 4.6 高 2.8，×1.5 ≈ 7 m
##   drone       2.80×0.60×1.93 —— 长轴在 X 上 → 绕 Y 转 90，长 2.8 高 0.6，×1.0
const MODEL_CFG := {
	"interceptor": {"file": "eye-fighter-3ghMF4tnfq.glb", "rot": Vector3(0, 0, 90), "scale": 1.2},
	"bomber": {"file": "agile-knight-7aYuk5Rdlr-.glb", "rot": Vector3(-90, 0, 0), "scale": 1.5},
	"drone": {"file": "space-craft-speeder-mlQBUQRUpM.glb", "rot": Vector3(0, 90, 0), "scale": 1.0},
}

var kind: String = "interceptor"
var hp: float = 1.0
var max_hp: float = 1.0
var player: PlayerShip
var root: GameRoot
var sfx: SfxPool

var _fire_cd: float = 1.2
var _t: float = 0.0
var _flash_t: float = 0.0
var _dead: bool = false
var _meshes: Array = []
var _flash_mat: StandardMaterial3D
var _move_vel: Vector3 = Vector3.ZERO


func setup(type: String, p: PlayerShip, r: GameRoot, s: SfxPool) -> void:
	kind = type
	player = p
	root = r
	sfx = s
	max_hp = ShipTable.hp_of(type)
	hp = max_hp


func _ready() -> void:
	add_to_group("enemies")
	collision_layer = 4   # enemy
	collision_mask = 1 | 2
	var shape := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 3.0
	shape.shape = sphere
	add_child(shape)

	_flash_mat = StandardMaterial3D.new()
	_flash_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_flash_mat.albedo_color = Color(1.0, 1.0, 1.0, 0.85)
	_flash_mat.emission_enabled = true
	_flash_mat.emission = Color(1.0, 1.0, 1.0)
	_flash_mat.emission_energy_multiplier = 3.0

	_build_model()


func _physics_process(delta: float) -> void:
	if root == null or player == null:
		return
	if root.state != GameRoot.State.PLAYING or _dead:
		return
	_t += delta

	var to_player := player.global_position - global_position
	var dist := to_player.length()
	var intent := EnemyAi.decide(kind, dist, hp / max_hp, _t)

	_orient(to_player, delta)
	_move(intent, to_player, delta)
	_combat(intent, dist, delta)

	if _flash_t > 0.0:
		_flash_t -= delta
		if _flash_t <= 0.0:
			for m in _meshes:
				(m as MeshInstance3D).material_overlay = null


func _orient(to_player: Vector3, delta: float) -> void:
	if to_player.length_squared() < 0.01:
		return
	var fwd := to_player.normalized()
	var up := Vector3.UP
	if absf(fwd.dot(up)) > 0.98:
		up = Vector3.RIGHT
	var want := Basis.looking_at(fwd, up)
	var have := global_transform.basis
	var q := have.get_rotation_quaternion().slerp(want.get_rotation_quaternion(),
		1.0 - exp(-4.0 * delta))
	global_transform.basis = Basis(q)


func _move(intent: Dictionary, to_player: Vector3, delta: float) -> void:
	var fwd := to_player.normalized() if to_player.length_squared() > 0.01 else -global_basis.z
	var right := fwd.cross(Vector3.UP).normalized()
	var thrust := float(intent["thrust"])
	var strafe := float(intent["strafe"])
	var desired := (fwd * thrust + right * strafe)
	var speed := float(ShipTable.field(kind, "speed"))
	if desired.length_squared() > 0.001:
		desired = desired.normalized() * speed * clampf(absf(thrust) + absf(strafe), 0.2, 1.0)
	else:
		desired = Vector3.ZERO
	_move_vel = _move_vel.lerp(desired, 1.0 - exp(-3.0 * delta))
	velocity = _move_vel
	move_and_slide()


func _combat(intent: Dictionary, dist: float, delta: float) -> void:
	_fire_cd -= delta
	if kind == "drone":
		# 撞角：贴脸即结算，双方同时表现（敌爆 + 玩家受击）
		if dist < 9.0 and player.vitals != null:
			player.vitals.take_damage(float(ShipTable.field(kind, "bolt_damage")))
			if root != null:
				root.on_player_bolt_hit()
			_die(false)
		return
	if bool(intent["fire"]) and _fire_cd <= 0.0 and _has_los():
		_fire_cd = float(ShipTable.field(kind, "fire_interval"))
		if root != null:
			var speed := float(ShipTable.field(kind, "bolt_speed"))
			var lead := player.global_position + player.velocity * (dist / maxf(speed, 1.0)) * 0.7
			var dir := (lead - global_position).normalized()
			root.spawn_bolt(global_position + (-global_basis.z) * 4.0, dir, speed,
				float(ShipTable.field(kind, "bolt_damage")))
		if sfx != null:
			sfx.play("laser_enemy", -10.0, randf_range(0.9, 1.1))


func _has_los() -> bool:
	var space := get_world_3d().direct_space_state
	var to := player.global_position
	var query := PhysicsRayQueryParameters3D.create(global_position, to, 2 | 1)
	var exclude: Array[RID] = [get_rid()]
	query.exclude = exclude
	var hit := space.intersect_ray(query)
	if hit.is_empty():
		return false
	return (hit["collider"] as Object) == (player as Object)


## 返回 true = 致死。
func take_damage(amount: float) -> bool:
	if _dead:
		return false
	hp -= amount
	_flash_t = 0.08
	for m in _meshes:
		(m as MeshInstance3D).material_overlay = _flash_mat
	if hp <= 0.0:
		_die(true)
		return true
	return false


func _die(killed_by_player: bool) -> void:
	if _dead:
		return
	_dead = true
	var parent := get_parent()
	if parent != null:
		Fx.burst(parent, global_position, 10.0, Color(1.0, 0.6, 0.25), 0.45)
	if sfx != null:
		sfx.play("explosion", -4.0)
	if root != null and killed_by_player:
		root.on_enemy_died(kind)
	died.emit(self)
	queue_free()


func _build_model() -> void:
	var cfg: Dictionary = MODEL_CFG[kind]
	var ps := load(MODEL_DIR + String(cfg["file"])) as PackedScene
	if ps == null:
		push_error("敌机模型缺失：%s" % cfg["file"])
		return
	var holder := Node3D.new()
	holder.name = "Visual"
	holder.rotation_degrees = cfg["rot"]
	holder.scale = Vector3.ONE * float(cfg["scale"])
	var inst := ps.instantiate()
	holder.add_child(inst)
	add_child(holder)
	_collect_meshes(holder)


func _collect_meshes(node: Node) -> void:
	for child in node.get_children():
		var mi := child as MeshInstance3D
		if mi != null:
			_meshes.append(mi)
		_collect_meshes(child)
