@tool
extends SceneTree
## 解剖一个**绑定型** viewmodel：节点树、动画片段、各姿态下的包围盒、以及「枪口标记节点」在哪。
##
## 为什么单独做这个工具：静态枪可以靠包围盒最长轴推朝向（tools/measure_viewmodels.gd），
## 但带手臂的 viewmodel 包围盒里混着整条手臂甚至整副骨架，最长轴推出来的方向毫无意义
## ——第一轮我把 Majikay 的双臂 deagle 按静态枪那样填 pos/scale，三种缩放全错。
## 绑定模型的正确摆法要问两件事：**握把在哪、枪口在哪**，这两个点动画期间会跟着手动，
## 所以必须在真实姿态下量，而不是猜。本工具就是把这两件事变成可打印的数字。
##
## 用法（lab 根，无头即可，只看变换不出图）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/inspect_rig.gd \
##     -- --model=res://assets/models/weapons/deagle_viewmodel_hands.glb

const DEFAULT_MODEL := "res://assets/models/weapons/deagle_viewmodel_hands.glb"
const SAMPLE_TIMES := [0.0, 0.25, 0.5, 1.0]

var _model := DEFAULT_MODEL


func _initialize() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--model="):
			_model = arg.trim_prefix("--model=")
	if not ResourceLoader.exists(_model):
		push_error("模型不存在：%s" % _model)
		quit(1)
		return

	var node := (load(_model) as PackedScene).instantiate()
	var holder := Node3D.new()
	holder.name = "Holder"
	root.add_child(holder)
	holder.add_child(node)
	await process_frame

	print("=== 06 绑定 viewmodel 解剖 ===")
	print("model=%s  root=%s(%s)" % [_model, node.name, node.get_class()])

	var player := node.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if player == null:
		print("[动画] 没有 AnimationPlayer（这是静态模型，用 tools/measure_viewmodels.gd）")
	else:
		var clips: Array = Array(player.get_animation_list())
		clips.sort()
		var names := ""
		for c in clips:
			var a := player.get_animation(String(c))
			names += "%s(%.2fs) " % [String(c), a.length]
		print("[动画] %d 段：%s" % [clips.size(), names])

	print("[节点树] 名称 | 类型 | 相对根的位置 | 网格包围盒尺寸")
	_dump(node, node, 0)

	var marked := _find_named(node, ["muzzle", "flash", "tip", "barrel"])
	if marked.is_empty():
		print("[标记节点] 模型里没有 muzzle/flash/tip/barrel 之类的空节点 → 只能靠包围盒 fit")
	for m in marked:
		print("    %s @ %s" % [(m as Node3D).name, str(_local(node, (m as Node3D)))])

	if player == null:
		quit(0)
		return

	print("[姿态对比] 每段动画在各采样时刻：包围盒尺寸 / 握把点 / 枪口点（都在模型根局部空间）")
	for kind in ["Idle", "Idle-loop", "Reload", "Shoot", "Unholster"]:
		if not player.has_animation(kind):
			continue
		for t in SAMPLE_TIMES:
			# 必须先 play 再 seek：只调 seek 而播放器没在播，骨骼姿态不会更新，
			# 量出来四段动画一模一样（第一版就踩了这个坑，误判成「模型没绑定」）。
			player.play(kind)
			player.seek(t, true)
			await process_frame
			var box := _box(node)
			var grip := _grip(node)
			var muz := _muzzle_point(node)
			print("  %-10s t=%.2f box=%.2f×%.2f×%.2f center=%s grip=%s muzzle=%s barrel=%s" % [
				kind, t, box.size.x, box.size.y, box.size.z, str(box.get_center()),
				str(grip), str(muz),
				"%.3f" % grip.distance_to(muz) if muz != Vector3.INF else "-"])
	_quit_with(player, node)


## 收尾前把骨骼/蒙皮的真实情况打出来：是不是 SkinnedMeshInstance3D、骨骼数、
## 蒙皮网格在动画期间的 aabb 是否会变（不变是正常：Godot 的蒙皮包围盒是绑定姿态算的）。
func _quit_with(player: AnimationPlayer, node: Node3D) -> void:
	var skel := node.find_child("Skeleton3D", true, false) as Skeleton3D
	if skel != null:
		print("[骨骼] Skeleton3D 骨骼数=%d" % skel.get_bone_count())
		# Skeleton3D 没有 has_bone()，查不到返回 -1（用 find_bone 而不是 has_bone）
		var idx: int = skel.find_bone("hand_ik.R")
		if idx >= 0:
			print("     hand_ik.R(#%d) 姿态原点=%s rest=%s" % [
				idx, str(skel.get_bone_global_pose(idx).origin),
				str(skel.get_bone_rest(idx).origin)])
	var classes := ""
	for m in _meshes(node):
		classes += "%s:%s " % [(m as Node).name, (m as MeshInstance3D).get_class()]
	print("[网格类型] %s" % classes)
	quit(0)


## 递归打印节点树；只显示会影响摆放的关键信息。
func _dump(anchor: Node3D, n: Node, depth: int) -> void:
	for c in n.get_children():
		if c is Node3D:
			var child := c as Node3D
			var info := "%s%s | %s | %s" % ["    ".repeat(depth), child.name, child.get_class(),
				str(_local(anchor, child))]
			if child is MeshInstance3D and (child as MeshInstance3D).mesh != null:
				var s := (child as MeshInstance3D).get_aabb().size
				info += " | mesh=%.2f×%.2f×%.2f" % [s.x, s.y, s.z]
			if child is BoneAttachment3D:
				info += " | bone=%s" % (child as BoneAttachment3D).bone_name
			print(info)
		_dump(anchor, c, depth + 1)


## 模型根局部空间里的点（摆放时要的就是这个，跟外部变换无关）。
func _local(anchor: Node3D, n: Node3D) -> Vector3:
	return anchor.global_transform.affine_inverse() * n.global_position


func _find_named(node: Node, keys: Array) -> Array:
	var out: Array = []
	for c in node.get_children():
		if c is Node3D:
			var lname := (c as Node3D).name.to_lower()
			for k in keys:
				if lname.contains(String(k)):
					out.append(c)
					break
		out.append_array(_find_named(c, keys))
	return out


## 握把点：优先找名字含 grip/hand 的节点；否则取可见网格里的父级（手臂跟枪的连接处）。
func _grip(node: Node3D) -> Vector3:
	var hits := _find_named(node, ["grip", "hand_ik", "weapon_root"])
	if not hits.is_empty():
		return _local(node, hits[0] as Node3D)
	return _local(node, node)


func _muzzle_point(node: Node3D) -> Vector3:
	var hits := _find_named(node, ["muzzle"])
	if hits.is_empty():
		return Vector3.INF
	return _local(node, hits[0] as Node3D)


func _box(anchor: Node3D) -> AABB:
	var box := AABB()
	var found := false
	var inv := anchor.global_transform.affine_inverse()
	for m in _meshes(anchor):
		var mi := m as MeshInstance3D
		var local := inv * (anchor.global_transform * mi.global_transform)
		var b := _xform_aabb(mi.get_aabb(), local)
		box = b if not found else box.merge(b)
		found = true
	return box


func _meshes(node: Node) -> Array:
	var out: Array = []
	for c in node.get_children():
		if c is MeshInstance3D:
			out.append(c)
		out.append_array(_meshes(c))
	return out


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
