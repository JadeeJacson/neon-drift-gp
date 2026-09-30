# 第五轮探针：噪声取样方法名 + 3D 贴图到底怎么在运行期造出来
#
# 起因：本机 Image 类**没有** create_3d/create3d（probe4 实测），
# 而 FogMaterial.density_texture 与 Environment.adjustment_color_correction 都吃 Texture3D。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_tex3d.gd
extends SceneTree

const WANT_CLASSES := ["NoiseTexture3D", "Texture3DRD", "NoiseTexture2D", "MeshTexture", "SpriteFrames?", "Image"]


func _initialize() -> void:
	print("PROBE5-BEGIN")
	var fn: FastNoiseLite = FastNoiseLite.new()
	for m in ["get_noise_1d", "get_noise_2d", "get_noise_3d", "get_noise_cubic", "sample"]:
		print("   FastNoiseLite.%s valid=%s" % [m, str(Callable(fn, m).is_valid())])
	var ml: Array = ClassDB.class_get_method_list("FastNoiseLite", false)
	var names := []
	for mm in ml:
		names.append(String(mm.get("name", "")))
	names.sort()
	print("   FastNoiseLite 自有方法=" + ", ".join(names))
	for c in WANT_CLASSES:
		var ok := ClassDB.class_exists(c)
		print("   class %s exists=%s" % [c, str(ok)])
		if ok and (c == "NoiseTexture3D" or c == "Texture3DRD"):
			var pl: Array = ClassDB.class_get_property_list(c, false)
			var pn := []
			for p in pl:
				var usage: int = int(p.get("usage", 0))
				if (usage & PROPERTY_USAGE_EDITOR) != 0:
					pn.append(String(p.get("name", "")))
			pn.sort()
			print("      props=" + ", ".join(pn))
	# 试着真的造一张 3D 贴图：优先 NoiseTexture3D
	var nt3: Variant = ClassDB.instantiate("NoiseTexture3D")
	if nt3 != null:
		var nn: FastNoiseLite = FastNoiseLite.new()
		nn.seed = 7
		nn.fractal_type = FastNoiseLite.FRACTAL_FBM
		nn.fractal_octaves = 4
		nt3.noise = nn
		nt3.set("width", 16)
		nt3.set("height", 16)
		nt3.set("depth", 16)
		print("   NoiseTexture3D 尺寸=%s 类型=%s" % [str(nt3.get("size")), nt3.get_class()])
		var as3d: Variant = nt3
		print("   是 Texture3D 子类=%s" % str(as3d is Texture3D))
	# Image 侧的 3D 出口
	for m in ["create_3d", "create3d", "create_from_data", "set_data", "get_data", "save_png"]:
		print("   Image.%s valid=%s" % [m, str(Callable(Image.new(), m).is_valid())])
	print("PROBE5-END")
	quit(0)
