extends RefCounted
class_name Fx
## 瞬时视觉特效小工具：膨胀光球（爆炸 / 命中 / 撞角），跑完自动释放。
## 程序化补缺范畴——贴图级特效等粒子包接入后可升级，这里先保证反馈存在。


static func burst(parent: Node, pos: Vector3, radius: float, color: Color,
		life: float = 0.35, energy: float = 5.0) -> void:
	if parent == null:
		return
	var mi := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.5
	sphere.height = 1.0
	mi.mesh = sphere
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = Color(color.r, color.g, color.b, 0.9)
	mat.emission_enabled = true
	mat.emission = color
	mat.emission_energy_multiplier = energy
	mi.material_override = mat
	mi.position = pos
	mi.scale = Vector3.ONE * 0.2
	parent.add_child(mi)

	var light := OmniLight3D.new()
	light.light_color = color
	light.light_energy = 6.0
	light.omni_range = radius * 3.0
	light.position = pos
	parent.add_child(light)

	var tw := parent.create_tween()
	tw.tween_property(mi, "scale", Vector3.ONE * radius, life)
	tw.parallel().tween_property(mat, "albedo_color", Color(color.r, color.g, color.b, 0.0), life)
	tw.parallel().tween_property(light, "light_energy", 0.0, life * 0.6)
	tw.tween_callback(mi.queue_free)
	tw.tween_callback(light.queue_free)
