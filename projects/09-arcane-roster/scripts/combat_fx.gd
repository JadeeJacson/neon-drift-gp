extends Node3D
class_name CombatFx
## 战斗特效与飘字。全部用**代码搭的短命节点 + tween**，不建粒子资源。
##
## 为什么不建 GPUParticles：自走棋的战斗是「定长 tick 的数值模拟」，事件密集但短促，
## 一次命中只持续 0.1–0.3 秒。粒子系统要资源、要调曲线，而 QuadMesh + tween
## 在这个时间尺度上更可控、也更容易在 headless 下被冒烟测试跑到。
##
## 这一整套是为**可读性**服务的（制作人实跑反馈：「伤亡/攻击效果不清晰」）：
##   · 伤害数字 —— 一眼看到「谁打掉了多少」，暴击更大更黄
##   · 命中闪片 —— 白/黄的小方片，标出打击点
##   · 远程弹道 —— 一条从射手到目标的细光线，让「谁在打谁」有指向
##   · 死亡标记 —— 地上留一块逐渐变暗的方片，用来**数尸体**（伤亡统计）
##   · 中毒跳字 —— 持续伤害用绿色小字，与普攻区分开
const CRIT_COLOR := Color(1.0, 0.78, 0.22)
const NORMAL_COLOR := Color(1.0, 0.94, 0.88)
const MISS_COLOR := Color(0.72, 0.76, 0.82)
const DOT_COLOR := Color(0.55, 0.95, 0.45)
const ALLY_DEATH := Color(0.55, 0.20, 0.20, 0.75)
const ENEMY_DEATH := Color(0.75, 0.55, 0.15, 0.75)


static func damage_number(parent: Node, world_pos: Vector3, amount: float, crit: bool) -> void:
	if parent == null:
		return
	var l := Label3D.new()
	l.text = str(int(round(amount)))
	l.font_size = 96 if crit else 64
	l.pixel_size = 0.0055
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.no_depth_test = true
	l.outline_size = 14
	l.outline_modulate = Color(0, 0, 0, 0.9)
	l.modulate = CRIT_COLOR if crit else NORMAL_COLOR
	l.render_priority = 6
	l.position = world_pos + Vector3(_jitter(), 1.5, 0.0)
	parent.add_child(l)
	var tw := l.create_tween()
	tw.tween_property(l, "position", l.position + Vector3(0.0, 0.85, 0.0), 0.55)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 0.55).set_delay(0.25)
	if crit:
		tw.parallel().tween_property(l, "scale", Vector3(1.45, 1.45, 1.45), 0.12)
		tw.tween_property(l, "scale", Vector3.ONE, 0.18)
	tw.tween_callback(l.queue_free)


static func status_text(parent: Node, world_pos: Vector3, text: String, color: Color) -> void:
	if parent == null:
		return
	var l := Label3D.new()
	l.text = text
	l.font_size = 54
	l.pixel_size = 0.0042
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.no_depth_test = true
	l.outline_size = 12
	l.outline_modulate = Color(0, 0, 0, 0.85)
	l.modulate = color
	l.render_priority = 6
	l.position = world_pos + Vector3(0.0, 1.25, 0.0)
	parent.add_child(l)
	var tw := l.create_tween()
	tw.tween_property(l, "position", l.position + Vector3(0.0, 0.45, 0.0), 0.5)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 0.5).set_delay(0.15)
	tw.tween_callback(l.queue_free)


## 命中闪片：打击点冒一片方片。crit 更大更黄，并带一圈外扩
static func hit_flash(parent: Node, world_pos: Vector3, crit: bool) -> void:
	if parent == null:
		return
	var host := Node3D.new()
	host.position = world_pos + Vector3(0.0, 1.0, 0.0)
	parent.add_child(host)
	for i in range(3 if crit else 1):
		var grow := 1.0 + 0.5 * float(i)
		var q := _quad(Vector2(0.24, 0.24) * grow, CRIT_COLOR if crit else Color(1.0, 0.97, 0.9, 0.9), true)
		q.rotation.z = float(i) * 0.7 + randf() * 0.6
		host.add_child(q)
		var tw := q.create_tween()
		tw.tween_property(q, "scale", Vector3(2.2, 2.2, 1.0), 0.16)
		tw.parallel().tween_property(_mat(q), "albedo_color:a", 0.0, 0.16)
		tw.tween_callback(q.queue_free)
	if crit:
		var ring := _quad(Vector2(0.5, 0.5), Color(1.0, 0.7, 0.2, 0.7), true)
		host.add_child(ring)
		var tw2 := ring.create_tween()
		tw2.tween_property(ring, "scale", Vector3(3.0, 3.0, 1.0), 0.22)
		tw2.parallel().tween_property(_mat(ring), "albedo_color:a", 0.0, 0.22)
		tw2.tween_callback(ring.queue_free)
	var cleanup := host.create_tween()
	cleanup.tween_interval(0.5)
	cleanup.tween_callback(host.queue_free)


## 远程弹道：从射手指向目标的一条细光线（只活 0.12 秒）
static func tracer(parent: Node, from: Vector3, to: Vector3, crit: bool) -> void:
	if parent == null:
		return
	var a := from + Vector3(0.0, 1.0, 0.0)
	var b := to + Vector3(0.0, 0.9, 0.0)
	var d := b - a
	var len_m := d.length()
	if len_m < 0.05:
		return
	var q := _quad(Vector2(0.07, len_m), CRIT_COLOR if crit else Color(1.0, 0.86, 0.55, 0.85), true)
	q.position = (a + b) * 0.5
	# 让 QuadMesh 的长轴（Y）对准目标方向
	var axis := d.normalized()
	var up := Vector3.UP
	var right := axis.cross(up)
	if right.length() < 0.001:
		right = Vector3.RIGHT
	right = right.normalized()
	var fwd := right.cross(axis).normalized()
	q.basis = Basis(right, axis, fwd)
	parent.add_child(q)
	var tw := q.create_tween()
	tw.tween_property(_mat(q), "albedo_color:a", 0.0, 0.12)
	tw.tween_callback(q.queue_free)


## 死亡标记：地上留一块半透明方片，用来数尸体（编成被打残时一眼看出战况）
static func death_marker(parent: Node, world_pos: Vector3, is_ally: bool) -> void:
	if parent == null:
		return
	var q := _quad(Vector2(1.5, 1.5), ALLY_DEATH if is_ally else ENEMY_DEATH, false)
	q.rotation_degrees = Vector3(-90.0, randf() * 360.0, 0.0)
	q.position = world_pos + Vector3(0.0, 0.05, 0.0)
	parent.add_child(q)
	var tw := q.create_tween()
	# 先亮一下再沉下去：刚死时最显眼，过一会儿变成静态的「尸体标记」
	var mat := _mat(q)
	tw.tween_property(mat, "albedo_color", Color(1.0, 0.9, 0.85, 1.0), 0.18)
	tw.tween_property(mat, "albedo_color:a", 0.45, 0.5)


static func _quad(size_px: Vector2, col: Color, additive: bool) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = size_px
	mi.mesh = q
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat.no_depth_test = true
	mat.render_priority = 5
	if additive:
		mat.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	mi.material_override = mat
	return mi


## MeshInstance3D **没有 modulate**（那是 CanvasItem 的属性），淡出必须动材质的 alpha。
## 每个方片都有独立的 material_override，所以直接 tween 资源属性是安全的。
static func _mat(q: MeshInstance3D) -> StandardMaterial3D:
	return q.material_override as StandardMaterial3D


static func _jitter() -> float:
	return randf_range(-0.28, 0.28)
