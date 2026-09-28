@tool
extends SceneTree

## 素材复核：关键模型是否真的存在、导入后有没有网格、原始尺寸是多少。
## 尺寸必须实测——不同来源的模型尺度差一个量级，渲染层靠它做归一化（WorldView._model）。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/11-orbital-line -s res://tools/verify_assets.gd

const PATHS: Array = [
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/tower-round-base.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/tower-round-bottom-a.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/tower-round-middle-a.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/tower-round-roof-a.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/weapon-turret.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/detail-crystal.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/enemy-ufo-a.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/enemy-ufo-b.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/enemy-ufo-c.glb",
	"res://assets/models/defense/kenney_tower-defense-kit/Models/glb/enemy-ufo-d.glb",
	"res://assets/models/defense/polypizza/laser-h2P7oQ8RVg.glb",
	"res://assets/models/defense/polypizza/cannon-J15vlPVvKK.glb",
	"res://assets/models/characters/polypizza/tank-FA5daiyZQq.glb",
	"res://assets/models/characters/polypizza/at-st-6jqEk8QiL0m.glb",
	"res://assets/models/environment/polypizza/generator-K58RQ63qR5.glb",
]

var _fails := 0


func _initialize() -> void:
	print("=== 11 素材复核 ===")
	for p in PATHS:
		var path: String = String(p)
		if not ResourceLoader.exists(path):
			print("[FAIL] 缺失 %s" % path)
			_fails += 1
			continue
		var packed = load(path) as PackedScene
		if packed == null:
			print("[FAIL] 无法作为场景加载 %s" % path)
			_fails += 1
			continue
		var node: Node3D = packed.instantiate() as Node3D
		if node == null:
			print("[FAIL] 实例化失败 %s" % path)
			_fails += 1
			continue
		# 脚本模式（--headless -s）下 root 尚未进入场景树，取 global_transform 会刷
		# `Condition "!is_inside_tree()"` 的 ERROR——所以这里用**累积局部变换**算包围盒。
		var acc: AABB = AABB()
		var first: bool = true
		var meshes: Array = []
		_collect(node, meshes, Transform3D.IDENTITY)
		for m in meshes:
			var pair: Array = m as Array
			var mi: MeshInstance3D = pair[0] as MeshInstance3D
			var xf: Transform3D = pair[1] as Transform3D
			var a: AABB = xf * mi.get_aabb()
			if first:
				acc = a
				first = false
			else:
				acc = acc.merge(a)
		var s: Vector3 = acc.size
		var ok: bool = meshes.size() > 0 and s.length() > 0.001
		if not ok:
			_fails += 1
		print("%s %-46s 网格 %2d  尺寸 %.2f/%.2f/%.2f  最低点 y=%.2f" % [
			"[OK]  " if ok else "[FAIL]",
			path.get_file(), meshes.size(), s.x, s.y, s.z, acc.position.y,
		])
		node.queue_free()
	print("=== 失败 %d 项 ===" % _fails)
	for _i in range(5):
		await process_frame
	quit(1 if _fails > 0 else 0)


func _collect(n: Node, out: Array, xf: Transform3D) -> void:
	if n is MeshInstance3D:
		out.append([n, xf * n.transform])
		return
	for c in n.get_children():
		var c3: Node3D = c as Node3D
		var child_xf: Transform3D = xf * (c3.transform if c3 != null else Transform3D.IDENTITY)
		_collect(c, out, child_xf)
