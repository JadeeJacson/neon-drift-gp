@tool
extends SceneTree
## 量 Kenney Space Kit 模块的真实尺寸，供 tools/build_arena.gd 的 PROPS 装饰层使用。
## 为什么必须量：Kenney 的 kit 内部单位与 Godot 的 1 单位=1 米不一定对齐，
## 而且同 kit 里 platform 与 pipe 的体量差好几倍；不量就摆，结果就是「栏杆比人细、
## 发电机比楼高」——这条和 06 早期踩过的 Poly Pizza 尺度坑是同一类。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/measure_props.gd

const KIT_DIR := "res://assets/models/environment/space-kit/"

const CANDIDATES := [
	"platform_center.glb", "platform_large.glb", "platform_straight.glb",
	"platform_high.glb", "platform_side.glb",
	"structure.glb", "structure_closed.glb", "structure_detailed.glb",
	"machine_generator.glb", "machine_generatorLarge.glb", "machine_barrelLarge.glb",
	"pipe_straight.glb", "pipe_corner.glb", "pipe_ring.glb",
	"pipe_supportHigh.glb", "pipe_supportLow.glb",
	"rail.glb", "rail_corner.glb", "stairs.glb",
	"supports_high.glb", "supports_low.glb",
	"satelliteDish.glb", "turret_single.glb", "gate_simple.glb",
	"barrel.glb", "desk_computer.glb", "corridor_wall.glb", "corridor_window.glb",
]

var _acc := AABB()
var _acc_set := false


func _initialize() -> void:
	print("=== Space Kit 模块实测（单位：米）===")
	var missing := 0
	for f in CANDIDATES:
		var path := KIT_DIR + String(f)
		if not ResourceLoader.exists(path):
			missing += 1
			print("  [缺失] %s" % f)
			continue
		_measure(String(f), path)
	print("--- 缺失 %d 个；把需要的拷进工程 assets 后改 build_arena.gd 的 PROPS ---" % missing)
	quit()


func _measure(file: String, path: String) -> void:
	var node := (load(path) as PackedScene).instantiate()
	_acc = AABB()
	_acc_set = false
	_collect(node, Transform3D.IDENTITY)
	var size := _acc.size
	var bodies := _count_collisions(node)
	var label := file.replace(".glb", "")
	print("  %-26s %.2f × %.2f × %.2f   碰撞体 %d 个" % [label, size.x, size.y, size.z, bodies])
	node.free()


func _collect(n: Node, xform: Transform3D) -> void:
	for c in n.get_children():
		if not (c is Node3D):
			continue
		var child := c as Node3D
		var child_xform: Transform3D = xform * child.transform
		if child is MeshInstance3D:
			var mi := child as MeshInstance3D
			if mi.mesh != null:
				var box := _xform_aabb(mi.get_aabb(), child_xform)
				if _acc_set:
					_acc = _acc.merge(box)
				else:
					_acc = box
					_acc_set = true
		_collect(child, child_xform)


func _count_collisions(node: Node) -> int:
	var n := 0
	if node is CollisionShape3D or node is StaticBody3D:
		n += 1
	for c in node.get_children():
		n += _count_collisions(c)
	return n


func _xform_aabb(box: AABB, xform: Transform3D) -> AABB:
	var corners: Array[Vector3] = []
	for x in [0.0, 1.0]:
		for y in [0.0, 1.0]:
			for z in [0.0, 1.0]:
				corners.append(box.position + Vector3(box.size.x * x, box.size.y * y, box.size.z * z))
	var result := AABB(xform * corners[0], Vector3.ZERO)
	for i in range(1, corners.size()):
		result = result.expand(xform * corners[i])
	return result
