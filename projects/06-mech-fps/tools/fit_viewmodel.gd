@tool
extends SceneTree
## 自动 fit：**绑定型** viewmodel（带手臂、动画驱动）的摆放参数求解器。
##
## 为什么静态枪那套不够用：tools/measure_viewmodels.gd 靠「包围盒最长轴」推朝向，
## 前提是最长轴就是枪管。带手臂的 viewmodel 包围盒里混着两条手臂（实测 1.51×1.47×1.70 m），
## 最长轴是肩膀跨度而不是枪管，按它摆就成了第一轮实跑看到的「枪横在屏幕上」。
##
## 这里换成**两点锚定**：量出模型自己的「握把点 → 枪口点」向量，
## 求一个相似变换（缩放 + 旋转 + 平移）把它映射到相机局部空间的两个目标点。
## 这两个点取自动画里的**真实姿态**（握把挂在 hand_ik 骨骼上，枪口取 Muzzle 标记节点），
## 所以缩放比例是按枪的实际长度算的，不再依赖包围盒猜。
##
## 用法（lab 根，无头即可）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/fit_viewmodel.gd -- \
##     --model=res://assets/models/weapons/deagle_viewmodel_hands.glb \
##     --clip=Idle --time=0.0 \
##     --target-grip=0.19,-0.26,-0.12 --target-muzzle=0.14,-0.14,-0.52
##
## 输出是可以直接粘进 weapon_controller.gd VIEWMODELS 的三行；末尾有自检（PASS/FAIL），
## 没通过就不要粘。脚本模式必须显式 quit()（docs/00 §5.0b 第 6 条）。

const TOL_DEFAULT := 0.02

var _model := ""
var _clip := "Idle"
var _time := 0.0
var _grip_node := ""
var _muzzle_node := ""
var _target_grip := Vector3(0.19, -0.26, -0.12)
var _target_muzzle := Vector3(0.14, -0.14, -0.52)
var _tol := TOL_DEFAULT
var _roll := 0.0


func _initialize() -> void:
	_parse_args()
	if _model.is_empty() or not ResourceLoader.exists(_model):
		push_error("用法：--model=res://…glb（必填，且文件要存在）")
		quit(1)
		return

	var inst := (load(_model) as PackedScene).instantiate()
	var holder := Node3D.new()
	holder.name = "FitHolder"
	root.add_child(holder)
	holder.add_child(inst)
	await process_frame

	var player := inst.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if player != null and player.has_animation(_clip):
		player.play(_clip)
		player.seek(_time, true)
		await process_frame
		await process_frame
	elif player != null:
		push_warning("没有动画片段 %s（现有：%s），用绑定姿态量" % [_clip, ", ".join(player.get_animation_list())])

	var grip := _node_by_name(inst, _grip_node, ["grip", "hand_ik", "weapon"])
	var muzzle := _node_by_name(inst, _muzzle_node, ["muzzle", "tip", "flash"])
	if grip == null or muzzle == null:
		push_error("找不到锚点：grip=%s muzzle=%s（用 --grip-node / --muzzle-node 指定）" % [
			str(grip), str(muzzle)])
		quit(1)
		return

	# 都在模型根局部空间里量：inst 此刻是恒等变换，量完就是「模型自己的坐标」。
	var g := _to_local(holder, grip as Node3D)
	var m := _to_local(holder, muzzle as Node3D)
	var src := m - g
	var src_len := src.length()
	if src_len < 0.001:
		push_error("握把点与枪口点重合，解不出朝向")
		quit(1)
		return
	var dst := _target_muzzle - _target_grip
	var dst_len := dst.length()
	var s := dst_len / src_len
	var rot := Basis(Quaternion(src.normalized(), dst.normalized()))
	# 两点锚定只定了枪管轴，绕轴自旋（枪是正着还是侧着）它定不出来——
	# 投稿模型里「枪的上方向」是哪个局部轴没有约定，所以留一个 roll 旋钮，
	# 靠截图挑（绕枪管轴转不影响两个锚点，复验仍然 PASS）。
	if absf(_roll) > 0.001:
		rot = Basis(dst.normalized(), deg_to_rad(_roll)) * rot

	var pos := _target_grip - rot * (s * g)
	var e := _deg(rot.get_euler())
	print("=== fit %s（clip=%s t=%.2f roll=%.0f）===" % [_model, _clip, _time, _roll])
	print("  源：grip=%s muzzle=%s 枪长=%.3f m" % [str(g), str(m), src_len])
	print("  目标：grip=%s muzzle=%s 视觉枪长=%.3f m" % [str(_target_grip), str(_target_muzzle), dst_len])
	print("  解：scale=%.4f pos=%s rot=%s" % [s, str(pos), str(e)])

	inst.scale = Vector3(s, s, s)
	inst.rotation = rot.get_euler()
	inst.position = pos
	await process_frame
	await process_frame

	var g2 := _to_local(holder, grip as Node3D)
	var m2 := _to_local(holder, muzzle as Node3D)
	var eg: float = g2.distance_to(_target_grip)
	var em: float = m2.distance_to(_target_muzzle)
	var verdict := "PASS" if eg <= _tol and em <= _tol else "FAIL"
	print("  复验：grip 偏差=%.4f muzzle 偏差=%.4f（容差 %.2f）→ %s" % [eg, em, _tol, verdict])
	print("  fit 后包围盒 %s" % str(_box_size(holder)))

	if verdict == "PASS":
		print("  --- 可粘贴（weapon_controller.gd VIEWMODELS）---")
		print('    "path": "%s",' % _model)
		print('    "rot": %s,' % _n3(e))
		print('    "scale": %s,' % _n(s))
		print('    "pos": %s,' % _n3(pos))
		print('    "muzzle": %s,  # 静态回退值（没有 muzzle 节点时用它）' % _n3(_target_muzzle))
		print('    "muzzle_node": "Muzzle",  # 运行时用真节点的动位置，曳光跟着手动')

	# 顺带量各段动画里的枪口轨迹：换弹时枪口跑到哪，决定它会不会糊住屏幕。
	if player != null:
		print("  --- 各姿态下的枪口（fit 后，相机局部空间）---")
		var clips: Array = Array(player.get_animation_list())
		clips.sort()
		for c in clips:
			for t in [0.0, 0.35, 0.7]:
				player.play(String(c))
				player.seek(t, true)
				await process_frame
				var mm := _to_local(holder, muzzle as Node3D)
				var gg := _to_local(holder, grip as Node3D)
				print("    %-10s t=%.2f muzzle=%s grip=%s" % [String(c), t, str(mm), str(gg)])
	quit(0)


func _parse_args() -> void:	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--model="):
			_model = arg.trim_prefix("--model=")
		elif arg.begins_with("--clip="):
			_clip = arg.trim_prefix("--clip=")
		elif arg.begins_with("--time="):
			_time = float(arg.trim_prefix("--time="))
		elif arg.begins_with("--grip-node="):
			_grip_node = arg.trim_prefix("--grip-node=")
		elif arg.begins_with("--muzzle-node="):
			_muzzle_node = arg.trim_prefix("--muzzle-node=")
		elif arg.begins_with("--target-grip="):
			_target_grip = _vec3(arg.trim_prefix("--target-grip="))
		elif arg.begins_with("--target-muzzle="):
			_target_muzzle = _vec3(arg.trim_prefix("--target-muzzle="))
		elif arg.begins_with("--tol="):
			_tol = float(arg.trim_prefix("--tol="))
		elif arg.begins_with("--roll="):
			_roll = float(arg.trim_prefix("--roll="))


func _vec3(s: String) -> Vector3:
	var p := s.split_floats(",")
	if p.size() < 3:
		push_warning("向量参数格式应为 x,y,z，收到 %s" % s)
		return Vector3.ZERO
	return Vector3(p[0], p[1], p[2])


## 精确名优先（Godot 会把 glTF 节点名里的 `-`/`.` 换成 `_`），再退到关键字。
func _node_by_name(inst: Node, exact: String, keys: Array) -> Node:
	if not exact.is_empty():
		var direct := inst.find_child(exact, true, false)
		if direct != null:
			return direct
	for k in keys:
		var hit := _find_containing(inst, String(k))
		if hit != null:
			return hit
	return null


func _find_containing(node: Node, key: String) -> Node:
	for c in node.get_children():
		if c is Node3D and String(c.name).to_lower().contains(key):
			return c
		var deep := _find_containing(c, key)
		if deep != null:
			return deep
	return null


func _to_local(anchor: Node3D, n: Node3D) -> Vector3:
	return anchor.global_transform.affine_inverse() * n.global_position


func _box_size(anchor: Node3D) -> Vector3:
	var box := AABB()
	var found := false
	var inv := anchor.global_transform.affine_inverse()
	for m in _meshes(anchor):
		var mi := m as MeshInstance3D
		var local := inv * (anchor.global_transform * mi.global_transform)
		var b := _xform_aabb(mi.get_aabb(), local)
		box = b if not found else box.merge(b)
		found = true
	return box.size


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


static func _n(v: float) -> String:
	return "%.4f" % v


## Godot 4.7 的 Basis 没有 get_euler_degrees()，自己转（写进配置里可读性更好）
static func _deg(v: Vector3) -> Vector3:
	return Vector3(rad_to_deg(v.x), rad_to_deg(v.y), rad_to_deg(v.z))


static func _n3(v: Vector3) -> String:
	return "Vector3(%s, %s, %s)" % [_n(v.x), _n(v.y), _n(v.z)]
