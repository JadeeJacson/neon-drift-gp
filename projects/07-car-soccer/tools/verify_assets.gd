extends SceneTree
## verify_assets.gd — 资产验证：实测每个选定 GLB 的合并包围盒 + 车模节点树。
## 07 的教训前提（继承 06）：模型尺度不统一，进场景前必须实测；每个模型的
## 「实测尺寸 + 缩放决策」登记在 assets/ASSET_MANIFEST.md，本脚本按表复核。
## 跑法：$GODOT --headless --path projects/07-car-soccer -s res://tools/verify_assets.gd
##       （加 --tree 额外打印车模节点名，查车轮是否独立节点）

const CAR_DIR := "res://assets/models/car/"
const CARS := [
	"kart-oobi.glb", "kart-oozi.glb", "kart-ooli.glb", "kart-oopi.glb", "kart-oozi.glb",
	"race-future.glb", "wheel-racing.glb", "wheel-dark.glb",
]
const DECOR := [
	"res://assets/models/ball_soccer.glb",
	"res://assets/models/decor/stadium-seats-KAHX68dbXO.glb",
	"res://assets/models/decor/stadium-seats-3eKUbGjEPv.glb",
	"res://assets/models/decor/stadium-seats-wtYoArecHj.glb",
	"res://assets/models/decor/building-a.glb",
	"res://assets/models/decor/building-f.glb",
	"res://assets/models/decor/building-k.glb",
	"res://assets/models/decor/building-skyscraper-a.glb",
	"res://assets/models/decor/building-skyscraper-c.glb",
	"res://assets/models/decor/building-skyscraper-e.glb",
	"res://assets/models/decor/low-detail-building-a.glb",
	"res://assets/models/decor/low-detail-building-wide-a.glb",
]

var show_tree := false


func _init() -> void:
	show_tree = OS.get_cmdline_user_args().has("--tree")
	_run()


func _combined_aabb(node: Node, xform: Transform3D, acc: Array) -> void:
	if node is MeshInstance3D:
		var mi := node as MeshInstance3D
		var xf := xform if node.transform == Transform3D.IDENTITY else xform
		var local_xf: Transform3D = xform
		acc.append(local_xf * mi.get_aabb())
	for child in node.get_children():
		_combined_aabb(child, xform * (child as Node3D).transform if child is Node3D else xform, acc)


func _measure(path: String) -> Dictionary:
	var ps: PackedScene = load(path)
	if ps == null:
		return {"ok": false}
	var inst := ps.instantiate() as Node3D
	if inst == null:
		return {"ok": false}
	root.add_child(inst)
	var acc: Array = []
	_combined_aabb(inst, Transform3D.IDENTITY, acc)
	if acc.is_empty():
		inst.queue_free()
		return {"ok": false}
	var total: AABB = acc[0]
	for i in range(1, acc.size()):
		total = total.merge(acc[i])
	if show_tree and path.contains("/car/"):
		var names: Array = []
		_collect_names(inst, names, 0)
		print("    nodes: ", names)
	inst.queue_free()
	return {"ok": true, "aabb": total}


func _collect_names(node: Node, out: Array, depth: int) -> void:
	out.append("%s%s(%s)" % ["  ".repeat(depth), node.name, node.get_class()])
	for child in node.get_children():
		_collect_names(child, out, depth + 1)


func _run() -> void:
	var failures := 0
	print("=== 07 资产实测 ===")
	for rel in CARS:
		var path: String = CAR_DIR + str(rel)
		var m: Dictionary = _measure(path)
		if not m["ok"]:
			print("[FAIL] %s 无法加载或无网格" % path)
			failures += 1
			continue
		var aabb: AABB = m["aabb"]
		print("[OK] %-28s size=%0.2f x %0.2f x %0.2f  center=(%0.2f, %0.2f, %0.2f)" % [
			rel, aabb.size.x, aabb.size.y, aabb.size.z,
			aabb.get_center().x, aabb.get_center().y, aabb.get_center().z])
	for path in DECOR:
		var m: Dictionary = _measure(path)
		if not m["ok"]:
			print("[FAIL] %s 无法加载或无网格" % path)
			failures += 1
			continue
		var aabb: AABB = m["aabb"]
		print("[OK] %-52s size=%0.2f x %0.2f x %0.2f  center=(%0.2f, %0.2f, %0.2f)" % [
			path.get_file(), aabb.size.x, aabb.size.y, aabb.size.z,
			aabb.get_center().x, aabb.get_center().y, aabb.get_center().z])
	print("=== 实测结束，failures=%d ===" % failures)
	quit(0 if failures == 0 else 1)
