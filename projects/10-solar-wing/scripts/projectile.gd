extends Area3D
class_name EnemyBolt
## 敌方投射物：可闪避（这是「走位有意义」的前提）。撞上玩家/小行星即结算。

const LIFE := 5.0

var velocity: Vector3 = Vector3.ZERO
var damage: float = 0.0
var root: GameRoot
var _life: float = LIFE


func setup(pos: Vector3, dir: Vector3, speed: float, dmg: float) -> void:
	global_position = pos
	velocity = dir.normalized() * speed
	damage = dmg


func _ready() -> void:
	root = get_tree().get_first_node_in_group("game_root") as GameRoot
	collision_layer = 8      # projectile
	collision_mask = 2 | 1   # 检测 player + world
	monitoring = true
	monitorable = false

	var shape := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 0.8
	shape.shape = sphere
	add_child(shape)

	var mi := MeshInstance3D.new()
	mi.name = "Visual"
	var box := BoxMesh.new()
	box.size = Vector3(0.35, 0.35, 2.2)
	mi.mesh = box
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(1.0, 0.55, 0.2)
	mat.emission_enabled = true
	mat.emission = Color(1.0, 0.45, 0.1)
	mat.emission_energy_multiplier = 8.0
	mi.material_override = mat
	add_child(mi)

	body_entered.connect(_on_body_entered)


func _physics_process(delta: float) -> void:
	if root != null and root.state != GameRoot.State.PLAYING:
		return
	global_position += velocity * delta
	if velocity.length_squared() > 0.01:
		look_at(global_position + velocity)
	_life -= delta
	if _life <= 0.0:
		queue_free()


func _on_body_entered(body: Node3D) -> void:
	var player := body as PlayerShip
	if player != null:
		player.vitals.take_damage(damage)
		var root := get_tree().get_first_node_in_group("game_root") as GameRoot
		if root != null:
			root.on_player_bolt_hit()
		queue_free()
		return
	# 撞上世界（小行星）：小火花就地消散
	var parent := get_parent()
	if parent != null:
		Fx.burst(parent, global_position, 1.6, Color(1.0, 0.6, 0.2), 0.18)
	queue_free()
