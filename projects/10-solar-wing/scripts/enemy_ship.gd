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
var _side_set: bool = false
var _side: float = 1.0
var _iff_ring: MeshInstance3D


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
	# 命中球半径来自 ShipTable（难度无关），与身上的 IFF 环**同源**——
	# 「看得见的圈就是能打中的范围」，玩家不用再猜模型薄面的宽度。
	sphere.radius = ShipTable.hit_radius_of(kind)
	shape.shape = sphere
	add_child(shape)

	_flash_mat = StandardMaterial3D.new()
	_flash_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_flash_mat.albedo_color = Color(1.0, 1.0, 1.0, 0.85)
	_flash_mat.emission_enabled = true
	_flash_mat.emission = Color(1.0, 1.0, 1.0)
	_flash_mat.emission_energy_multiplier = 3.0

	_build_model()
	_build_iff_ring()


## IFF 识别环：半径**等于**命中球，半透明无碰撞。
## 玩家反馈「敌机不好找到 / 不知道该往哪打」——深空背景下深色敌机几乎不可辨，
## 而判断「打不打得中」本来要求玩家在脑内做 3D 球体投影。这里把那一步直接画出来：
## 环内即必中。受击时环变红，血量越低红得越早（血量也是一眼可读，不用靠猜）。
func _build_iff_ring() -> void:
	var torus := TorusMesh.new()
	var r := ShipTable.hit_radius_of(kind)
	# 4.7 的 TorusMesh 只有 inner_radius / outer_radius（没有旧版的 ring_radius /
	# ring_thickness，实测属性列表确认）。环的粗细 = outer - inner。
	torus.inner_radius = r * 0.86
	torus.outer_radius = r * 1.0
	torus.rings = 24
	torus.ring_segments = 8
	var mi := MeshInstance3D.new()
	mi.name = "IffRing"
	mi.mesh = torus
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = _iff_color()
	mat.emission_enabled = true
	mat.emission = _iff_color()
	mat.emission_energy_multiplier = 2.4
	mat.no_depth_test = false
	mi.material_override = mat
	mi.rotate_x(PI * 0.5)  # 环面朝前，正对玩家来向
	add_child(mi)
	_iff_ring = mi


func _iff_color() -> Color:
	match kind:
		"bomber":
			return Color(1.0, 0.35, 0.25)
		"drone":
			return Color(1.0, 0.85, 0.3)
		_:
			return Color(0.45, 0.95, 1.0)


## 血量低 → 环变红，给一个「快打掉了」的直读反馈。
func _refresh_iff() -> void:
	if _iff_ring == null:
		return
	var frac := hp / maxf(max_hp, 1.0)
	var base := _iff_color()
	if frac < 0.35:
		base = base.lerp(Color(1.0, 0.15, 0.1), 0.75)
	var mat := _iff_ring.material_override as StandardMaterial3D
	if mat != null:
		mat.albedo_color = base
		mat.emission = base


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
	# —— 为什么不再「机头对准玩家」——
	# 原本用 Basis.looking_at(to_player) 让敌机永远把机头指向玩家，结果是
	# 玩家**永远只能看到敌机最薄的那一面**（截击机实测 0.68×3.81×4.28，
	# 机头对着你时投影就只有 ~0.7 m 宽的一条线），于是「明明看着在那儿却打不到」。
	# 现在改为：机身**切向掠过**（to_player 与飞行方向成 ~70°），既保留了
	# 「敌机确实在朝我来」的压迫感，又把最大可视面（翼展 3.8 m）转向玩家。
	var tofwd := fwd.rotated(up, deg_to_rad(70.0) * _side_sign())
	var want := Basis.looking_at(tofwd, up)
	var have := global_transform.basis
	var q := have.get_rotation_quaternion().slerp(want.get_rotation_quaternion(),
		1.0 - exp(-4.0 * delta))
	global_transform.basis = Basis(q)


## 每架一个稳定的左右倾向（按实例序号而非随机数），免得全场敌机同向。
func _side_sign() -> float:
	if not _side_set:
		_side_set = true
		_side = 1.0 if (get_instance_id() % 2 == 0) else -1.0
	return _side


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
			player.take_damage(ShipTable.damage_of(kind))
			if root != null:
				root.on_player_bolt_hit()
			_die(false)
		return
	if bool(intent["fire"]) and _fire_cd <= 0.0 and _has_los():
		_fire_cd = ShipTable.fire_interval_of(kind)
		if root != null:
			var speed := float(ShipTable.field(kind, "bolt_speed"))
			var lead := player.global_position + player.velocity * (dist / maxf(speed, 1.0)) * 0.7
			var dir := (lead - global_position).normalized()
			root.spawn_bolt(global_position + (-global_basis.z) * 4.0, dir, speed,
				ShipTable.damage_of(kind))
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
	_refresh_iff()
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
	# 可见性补光：深空背景纯黑，敌机原色偏暗（实测截图「找到目标了却看不清机身」）。
	# 不用 material_overlay —— 那个槽位被受击闪白占着，两边抢会互相顶掉。
	# 改用一盏跟随自己的低强度 OmniLight：保留素材涂装，只是把暗面提起来。
	var lamp := OmniLight3D.new()
	lamp.name = "FillLight"
	lamp.light_color = Color(0.62, 0.78, 0.95)
	lamp.light_energy = 1.6
	lamp.omni_range = 26.0
	lamp.shadow_enabled = false
	add_child(lamp)


func _collect_meshes(node: Node) -> void:
	for child in node.get_children():
		var mi := child as MeshInstance3D
		if mi != null:
			_meshes.append(mi)
		_collect_meshes(child)
