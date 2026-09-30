# 第六轮探针：引擎基本体/材质/粒子的属性名（4.7 里 TorusMesh.major_radius 赋值报错）
#
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_meshes.gd
extends SceneTree


func _initialize() -> void:
	print("PROBE6-BEGIN")
	var insts: Array = [
		BoxMesh.new(), PlaneMesh.new(), QuadMesh.new(), SphereMesh.new(),
		CylinderMesh.new(), TorusMesh.new(), PrismMesh.new(), CapsuleMesh.new(),
		MultiMesh.new(), Decal.new(), GPUParticles3D.new(), ParticleProcessMaterial.new(),
		FogMaterial.new(), NoiseTexture3D.new(), CameraAttributesPractical.new(),
		ProceduralSkyMaterial.new(), StandardMaterial3D.new(), Image.new(),
	]
	for inst in insts:
		var names := []
		for p in (inst as Object).get_property_list():
			var nname := String(p.get("name", ""))
			var usage: int = int(p.get("usage", 0))
			if nname.contains("/") or nname == "":
				continue
			if (usage & PROPERTY_USAGE_EDITOR) != 0 or (usage & PROPERTY_USAGE_STORAGE) != 0:
				names.append(nname)
		names.sort()
		print("== %s ==" % (inst as Object).get_class())
		print("   " + ", ".join(names))
	print("   RD in headless = %s" % str(RenderingServer.get_rendering_device()))
	print("   DisplayServer = %s" % DisplayServer.get_name())
	print("PROBE6-END")
	quit(0)
