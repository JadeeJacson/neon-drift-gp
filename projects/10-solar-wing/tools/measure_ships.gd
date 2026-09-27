@tool
extends SceneTree
## 实测各飞船 GLB 的包围盒三轴尺寸，用于推断「哪根轴是机身长轴」。
## 为什么需要：GLB 各自前向轴不同（06 viewmodel 的教训），不实测就摆向必翻车。
## 用法（lab 根）：godot --headless --path projects/10-solar-wing -s res://tools/measure_ships.gd

const MODELS := [
	"res://assets/models/ships/spaceship-uCeLfsdmNP.glb",
	"res://assets/models/ships/eye-fighter-3ghMF4tnfq.glb",
	"res://assets/models/ships/agile-knight-7aYuk5Rdlr-.glb",
	"res://assets/models/ships/space-craft-speeder-mlQBUQRUpM.glb",
	"res://assets/models/ships/spaceship-htfBk9vPfw.glb",
	"res://assets/models/environment/asteroid-YS1jpm3mNr.glb",
	"res://assets/models/environment/comet-ffzZSJOorck.glb",
	"res://assets/models/environment/kenney_meteor.glb",
]


func _initialize() -> void:
	print("=== 飞船/天体包围盒实测 ===")
	for path in MODELS:
		var packed := _load(path)
		if packed == null:
			print("FAIL 加载失败: %s" % path)
			continue
		var holder := Node3D.new()
		root.add_child(holder)
		holder.add_child(packed.instantiate())
		# 必须等一帧：Node3D 不在树里时 global_transform 返回单位阵，测出来全是错的
		await process_frame
		var aabb := _total_aabb(holder)
		print("%s | size x=%.3f y=%.3f z=%.3f | center y=%.3f" % [
			path.get_file(), aabb.size.x, aabb.size.y, aabb.size.z,
			aabb.position.y + aabb.size.y * 0.5,
		])
		holder.queue_free()
		await process_frame
	quit(0)


func _load(path: String) -> PackedScene:
	if not ResourceLoader.exists(path):
		return null
	return load(path) as PackedScene


## 递归汇总所有 MeshInstance3D 的世界包围盒。
func _total_aabb(node: Node) -> AABB:
	var total := AABB()
	var first := true
	var stack: Array[Node] = [node]
	while not stack.is_empty():
		var n: Node = stack.pop_back()
		var mi := n as MeshInstance3D
		if mi != null and mi.mesh != null:
			var aabb := mi.mesh.get_aabb()
			var xf := mi.global_transform
			var corners := [
				Vector3(aabb.position.x, aabb.position.y, aabb.position.z),
				Vector3(aabb.end.x, aabb.position.y, aabb.position.z),
				Vector3(aabb.position.x, aabb.end.y, aabb.position.z),
				Vector3(aabb.end.x, aabb.end.y, aabb.position.z),
				Vector3(aabb.position.x, aabb.position.y, aabb.end.z),
				Vector3(aabb.end.x, aabb.position.y, aabb.end.z),
				Vector3(aabb.position.x, aabb.end.y, aabb.end.z),
				Vector3(aabb.end.x, aabb.end.y, aabb.end.z),
			]
			for c in corners:
				var w: Vector3 = xf * (c as Vector3)
				if first:
					total = AABB(w, Vector3.ZERO)
					first = false
				else:
					total = total.expand(w)
		for child in n.get_children():
			stack.push_back(child)
	return total
