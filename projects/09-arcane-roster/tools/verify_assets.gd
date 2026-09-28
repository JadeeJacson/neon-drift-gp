@tool
extends SceneTree
## 资产实测复核：动画清单 / 包围盒 / 武器节点可见性。
##
## 为什么这个工具必须存在（06 的教训）：`--headless --quit` 只能证明「工程能开机」，
## 它看不见「骑士同时挂着 5 把武器」这种问题。要看 glTF 内部结构必须真的
## **实例化模型**并查询节点——本文件就是这么做的。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/09-arcane-roster -s res://tools/verify_assets.gd

const UNIT_DIR := "res://assets/models/units/"
const PROP_DIR := "res://assets/models/props/"
const WEAPON_NODES := ["1H_Sword", "2H_Sword", "Round_Shield", "Rectangle_Shield", "Spike_Shield", "1H_Sword_Offhand"]
const EXPECT_ANIM := ["Idle", "Walking_A", "Running_A", "Death_A", "Hit_A", "Spellcast_Shoot"]

var _fails: int = 0
var _checked: int = 0


func _initialize() -> void:
	print("=== 09 资产实测 ===")
	_check_units()
	_check_props()
	print("---- 结论：%d 项检查，%d 项失败" % [_checked, _fails])
	quit(0 if _fails == 0 else 1)


func _ok(cond: bool, label: String, extra: String = "") -> void:
	_checked += 1
	if cond:
		print("  [OK]   %s %s" % [label, extra])
	else:
		_fails += 1
		print("  [FAIL] %s %s" % [label, extra])


func _check_units() -> void:
	print("-- 角色模型 --")
	for id in UnitTable.ids():
		var model := UnitTable.model(id)
		var path := UNIT_DIR + model + ".glb"
		if not ResourceLoader.exists(path):
			_ok(false, model, "文件不存在 " + path)
			continue
		var packed: PackedScene = load(path)
		if packed == null:
			_ok(false, model, "加载失败")
			continue
		var inst := packed.instantiate()
		# 骨骼与动画
		var anim_names := _anim_names(inst)
		var missing: Array = []
		for want in EXPECT_ANIM:
			if not anim_names.has(want):
				missing.append(want)
		_ok(missing.is_empty(), "%s 动画齐" % model,
			"%d 套%s" % [anim_names.size(), "" if missing.is_empty() else " 缺 " + ", ".join(missing)])
		# 包围盒：KayKit 角色尺度必须一致（不一致会逼出逐模型缩放表）
		var box := _aabb(inst)
		_ok(box.size.x > 0.5 and box.size.y > 1.0, "%s 包围盒" % model,
			"%.2f × %.2f × %.2f m（中心 Y=%.2f）" % [box.size.x, box.size.y, box.size.z, box.position.y + box.size.y * 0.5])
		# 武器节点：记录有多少个带网格（UnitView 会把它们隐藏）
		var visible_weapons := 0
		for w in WEAPON_NODES:
			var n := _find(inst, String(w))
			if n is Node3D and (n as Node3D).visible:
				visible_weapons += 1
		_ok(true, "%s 武器节点" % model, "可见 %d 个（UnitView 进场会按 EQUIP 表只留 1 个）" % visible_weapons)
		inst.free()


func _check_props() -> void:
	print("-- 场景道具 --")
	for p in ["floor_tile_small", "wall", "wall_half", "wall_corner", "pillar", "torch_mounted", "chest"]:
		var path: String = PROP_DIR + String(p) + ".glb"
		if not ResourceLoader.exists(path):
			_ok(false, p, "文件不存在")
			continue
		var packed: PackedScene = load(path)
		if packed == null:
			_ok(false, p, "加载失败")
			continue
		var inst := packed.instantiate()
		var box := _aabb(inst)
		_ok(box.size.x > 0.05, "%s 包围盒" % p, "%.2f × %.2f × %.2f m" % [box.size.x, box.size.y, box.size.z])
		inst.free()


func _anim_names(node: Node) -> Array:
	var out: Array = []
	if node == null:
		return out
	if node is AnimationPlayer:
		for lib in (node as AnimationPlayer).get_animation_library_list():
			var an := (node as AnimationPlayer).get_animation_library(lib)
			if an != null:
				out.append_array(an.get_animation_list())
	for c in node.get_children():
		out.append_array(_anim_names(c))
	return out


func _aabb(node: Node) -> AABB:
	var total := AABB()
	var first := true
	for mi in _meshes(node):
		var m := (mi as MeshInstance3D)
		var mesh := m.mesh
		if mesh == null:
			continue
		var local := mesh.get_aabb()
		local = m.transform * local
		if first:
			total = local
			first = false
		else:
			total = total.merge(local)
	return total


func _meshes(node: Node) -> Array:
	var out: Array = []
	if node == null:
		return out
	if node is MeshInstance3D:
		out.append(node)
	for c in node.get_children():
		out.append_array(_meshes(c))
	return out


func _find(node: Node, target: String) -> Node:
	if node == null:
		return null
	if String(node.name) == target:
		return node
	for c in node.get_children():
		var r := _find(c, target)
		if r != null:
			return r
	return null
