extends Area3D
class_name HomingMissile
## 玩家副武器：锁定后发射的跟踪导弹。
##
## 为什么要有它：主武器是 hitscan，「指哪打哪」很脆，但高速小体积目标的瞄准本身
## 就是挫败源。导弹给一个**兜底解法**——但刻意做成有代价的资源：
##   · 必须先锁定（不能盲射），锁定锥/距离都有限 → 仍要主动找目标；
##   · 弹药 6 发 + 装填 3.2 s → 不能当主武器平A；
##   · 转向率有限（2.6 rad/s）→ 目标绕大圈仍能甩掉它，手感上是真的在「追」；
##   · 近炸有溅射（MISSILE_BLAST），鼓励在敌群里打一发。
##
## 生命周期：锁定→发射→追踪→命中/超时→自毁。命中判定用球体重叠（Area3D），
## 不做 CCD——导弹速度 320 m/s 而每帧位移约 5 m，而最近两机间距远大于此，
##  tunneling 风险在本作尺度下不成立（真要成立就得给弹体加 swept ray）。

var velocity: Vector3 = Vector3.ZERO
var target: EnemyShip = null
var root: GameRoot
var _life: float = ShipTable.MISSILE_LIFE
var _spin: float = 0.0


func setup(pos: Vector3, dir: Vector3, tgt: EnemyShip) -> void:
	global_position = pos
	velocity = dir.normalized() * ShipTable.MISSILE_SPEED
	target = tgt


func _ready() -> void:
	root = get_tree().get_first_node_in_group("game_root") as GameRoot
	collision_layer = 0
	collision_mask = 0   # 自己不参与物理层；用距离判定，避免和主武器/敌弹抢层
	monitoring = false
	monitorable = false
	_build_visual()
	body_entered.connect(_on_body_entered)


func _physics_process(delta: float) -> void:
	if root != null and root.state != GameRoot.State.PLAYING:
		return
	_life -= delta
	if _life <= 0.0:
		# 超时自毁：给一个小的空爆，不给伤害
		Fx.burst(get_parent(), global_position, 3.0, Color(0.9, 0.7, 0.4), 0.2, 2.0)
		queue_free()
		return
	_steer(delta)
	global_position += velocity * delta
	_spin += delta * 6.0
	# 弹体锥尖朝速度方向（Y 轴圆柱转成 -Z 朝前）
	if velocity.length_squared() > 0.01:
		var mi := get_node_or_null(^"Visual") as Node3D
		if mi != null:
			mi.look_at(global_position + velocity, Vector3.UP)
			mi.rotate_object_local(Vector3.RIGHT, _spin)
	_check_proximity()


## 朝锁定目标转向；目标没了（被打爆）就沿当前方向直飞并自然超时。
func _steer(delta: float) -> void:
	if target == null or not is_instance_valid(target):
		return
	var want := (target.global_position - global_position).normalized()
	var speed := velocity.length()
	var cur := velocity.normalized()
	# 限转向率：用 slerp 近似球面插值，夹住单帧最大转角
	var max_angle := ShipTable.MISSILE_TURN * delta
	var dot := clampf(cur.dot(want), -1.0, 1.0)
	var angle := acos(dot)
	if angle > 0.0001:
		var t := minf(1.0, max_angle / angle)
		var new_dir := cur.slerp(want, t).normalized()
		velocity = new_dir * speed


func _on_body_entered(body: Node3D) -> void:
	# 自身不与任何物理体碰撞，这里只为 Area3D 保留接口；实际命中走 _check_proximity
	pass


func _check_proximity() -> void:
	var parent := get_parent()
	var hit_any := false
	for child in parent.get_children():
		var e := child as EnemyShip
		if e == null:
			continue
		var d := e.global_position.distance_to(global_position)
		if d <= ShipTable.hit_radius_of(e.kind) + 3.0:
			_detonate(e)
			hit_any = true
			break
		# 溅射：近炸范围内其他敌机吃一点
		if d <= ShipTable.MISSILE_BLAST + ShipTable.hit_radius_of(e.kind):
			e.take_damage(ShipTable.MISSILE_DAMAGE * 0.4)
	if hit_any:
		return


func _detonate(primary: EnemyShip) -> void:
	primary.take_damage(ShipTable.MISSILE_DAMAGE)
	Fx.burst(get_parent(), global_position, 9.0, Color(1.0, 0.6, 0.25), 0.35)
	if root != null:
		root.camera_rig.add_trauma(0.1)
	queue_free()


func _build_visual() -> void:
	# 弹体：一个朝向速度的小锥
	var mi := MeshInstance3D.new()
	mi.name = "Visual"
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 0.28
	cone.height = 1.2
	mi.mesh = cone
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(1.0, 0.75, 0.3)
	mat.emission_enabled = true
	mat.emission = Color(1.0, 0.6, 0.2)
	mat.emission_energy_multiplier = 5.0
	mi.material_override = mat
	mi.rotation_degrees.x = 90.0   # 锥尖朝 -Z（飞行方向）
	add_child(mi)
