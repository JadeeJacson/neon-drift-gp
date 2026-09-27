@tool
extends SceneTree
## 量 viewmodel：报告每把枪 GLB 的包围盒、最长轴（即枪管朝向）与建议的定向旋转。
## 为什么必须量：Poly Pizza 是多人投稿站，「枪管指向哪个局部轴」每把都不同。
## 不量就统一按 -Z 摆，结果就是实跑看到的「有的枪横在屏幕上」，曳光起点也跟着错。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/measure_viewmodels.gd

const PATHS := {
	"assault_rifle": "res://assets/models/weapons/assault_rifle.glb",
	"shotgun": "res://assets/models/weapons/shotgun.glb",
	"dmr_sniper": "res://assets/models/weapons/dmr_sniper.glb",
	"deagle_hands": "res://assets/models/weapons/deagle_viewmodel_hands.glb",
}

## viewmodel 目标长度（米）。第一人称枪不按真实尺寸画，太长会糊住准星。
const TARGET_LENGTH := 0.62

var _acc := AABB()
var _acc_set := false


func _initialize() -> void:
	print("=== 06 viewmodel 实测 ===")
	for id in PATHS:
		_measure(String(id), String(PATHS[id]))
	quit()


func _measure(id: String, path: String) -> void:
	if not ResourceLoader.exists(path):
		print("[缺失] %s" % path)
		return
	var node := (load(path) as PackedScene).instantiate()
	var root := node as Node3D
	if root == null:
		push_error("%s 根节点不是 Node3D" % id)
		node.free()
		return
	var aabb := _union_aabb(root)
	var size := aabb.size
	var longest := "X"
	if size.y >= size.x and size.y >= size.z:
		longest = "Y"
	elif size.z >= size.x and size.z >= size.y:
		longest = "Z"
	# 把最长轴旋到 -Z（屏幕深处）所需的欧拉角（度）
	var fix := Vector3.ZERO
	match longest:
		"X":
			fix = Vector3(0.0, -90.0, 0.0)
		"Y":
			fix = Vector3(90.0, 0.0, 0.0)
	var barrel := _axis(size, longest)
	var scale := TARGET_LENGTH / maxf(barrel, 0.001)
	# 枪管朝向的正负号 AABB 尺寸给不出，用「质心在 barrel 轴上的符号」推断：
	# 投稿模型的原点通常握把/机匣处，枪管往前延伸会把质心推向那一侧。
	var signed_center := _axis(aabb.get_center(), longest)
	var yaw := 0.0
	match longest:
		"X":
			yaw = 90.0 if signed_center > 0.0 else -90.0
		"Z":
			yaw = 180.0 if signed_center > 0.0 else 0.0
	var c := aabb.get_center()
	print("%-14s 包围盒 %.2f × %.2f × %.2f m  质心=(%.2f, %.2f, %.2f)" % [id, size.x, size.y, size.z, c.x, c.y, c.z])
	print("    最长轴=%s 质心符号=%s → yaw=%.0f  pitch=0  缩放=%.3f" % [
		longest, ("+" if signed_center > 0 else "-"), yaw, scale])
	print("    可直接粘贴：\"%s\": {\"rot\": Vector3(0, %s, 0), \"scale\": %.3f, \"muzzle_z\": %.3f}," % [
		id, _num(yaw), scale, -barrel * scale * 0.5])
	node.free()


static func _num(v: float) -> String:
	return "%.0f" % v if absf(v - roundf(v)) < 0.001 else "%.2f" % v


static func _axis(v: Vector3, axis: String) -> float:
	# 不用 size[dict[key]] 那种写法：从 Variant 索引出来的值会让 `:=` 推断失败
	# （本工程把该警告当错误，见 docs/00 §5.0b 第 2 条）
	match axis:
		"X":
			return v.x
		"Y":
			return v.y
		_:
			return v.z


func _union_aabb(node: Node3D) -> AABB:
	_acc = AABB()
	_acc_set = false
	_collect(node, Transform3D.IDENTITY)
	return _acc


func _collect(n: Node3D, xform: Transform3D) -> void:
	for c in n.get_children():
		if not (c is Node3D):
			continue
		var child := c as Node3D
		var child_xform := xform * child.transform
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


## 变换后的 AABB：取 8 角点变换再重围，避免轴对齐盒旋转后失真
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
