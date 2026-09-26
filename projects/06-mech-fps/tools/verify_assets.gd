@tool
extends SceneTree
## 资产验证：加载 06 工程内每个模型，报告动画列表与包围盒尺寸。
## 用途：① 确认 GLB 的骨骼动画被 Godot 正确提取（不是「导入成功」就等于「有动画」）；
##       ② 拿到模型真实尺寸，用于定缩放与碰撞体大小（Poly Pizza 各家尺度不统一）。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/verify_assets.gd

const BASE := "res://assets/models/"
const TARGETS := [
	"enemies/trooper_mech.glb",
	"enemies/swarm_drone.glb",
	"enemies/charger_mechquadruped.glb",
	"enemies/heavy_assault_walker.glb",
	"weapons/assault_rifle.glb",
	"weapons/shotgun.glb",
	"weapons/dmr_sniper.glb",
	"props/turret.glb",
	"props/turret_cannon.glb",
]

var _fails := 0


func _initialize() -> void:
	print("=== 06 资产验证 ===")
	for rel in TARGETS:
		_report(rel)
	print("=== 失败 %d 项 ===" % _fails)
	quit(1 if _fails > 0 else 0)


func _report(rel: String) -> void:
	var path := BASE + rel
	if not ResourceLoader.exists(path):
		print("[缺失] %s" % rel)
		_fails += 1
		return

	var packed := load(path) as PackedScene
	if packed == null:
		print("[非场景] %s" % rel)
		_fails += 1
		return

	var inst := packed.instantiate()
	# 注意：脚本模式 _initialize() 阶段 root.add_child() 后节点仍可能未 is_inside_tree()，
	# 此时 global_transform 会报错并返回单位矩阵。改为手动沿父链累积 transform。

	var anim_names: PackedStringArray = []
	for player in inst.find_children("*", "AnimationPlayer", true):
		anim_names.append_array(player.get_animation_list())

	var box := AABB()
	var mesh_count := 0
	for mi in inst.find_children("*", "MeshInstance3D", true):
		mesh_count += 1
		var m := mi as MeshInstance3D
		if m.mesh == null:
			continue
		# 用 8 个角点变换后合并，避免只算 local AABB 导致旋转后尺寸失准
		var local := m.mesh.get_aabb()
		var xf := _accumulated_transform(m)
		for cx in [local.position.x, local.end.x]:
			for cy in [local.position.y, local.end.y]:
				for cz in [local.position.z, local.end.z]:
					box = box.expand(xf * Vector3(cx, cy, cz))

	var size := box.size
	if size.length() < 0.001:
		print("[无网格] %s" % rel)
		_fails += 1
		inst.free()
		return

	var tag := "OK  " if anim_names.size() > 0 else "无动画"
	print("%s %-34s 尺寸 %6.2f x %6.2f x %6.2f | mesh %2d | 动画 %2d %s" % [
		tag, rel, size.x, size.y, size.z, mesh_count, anim_names.size(),
		("  " + ", ".join(anim_names.slice(0, 5))) if anim_names.size() > 0 else "",
	])

	inst.free()


## 沿父链手动累积世界变换：脚本模式下节点不在树内，global_transform 会返回单位矩阵。
func _accumulated_transform(n: Node3D) -> Transform3D:
	var t := n.transform
	var p := n.get_parent()
	while p is Node3D:
		t = (p as Node3D).transform * t
		p = p.get_parent()
	return t
