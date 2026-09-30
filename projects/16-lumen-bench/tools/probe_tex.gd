# 第四轮探针：程序化贴图需要的 Image / Texture3D / FastNoiseLite 真实方法名
#
# 本工程零外部素材，所有贴图/LUT/体积雾密度图都在运行期生成，
# 所以必须先确认 4.7 里这些 API 的名字（create3d 在 4.3 改名过）。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_tex.gd
extends SceneTree

const CLASSES := ["Image", "Texture3D", "ImageTexture", "FastNoiseLite", "NoiseTexture2D", "Texture2DRD", "RenderingServer"]
const FILTERS := ["create", "3d", "convert", "resize", "generate", "fill", "set_", "get_noise", "clamp", "blur", "bump", "normal", "invert", "add", "linear", "srgb", "save", "from", "texture_"]

const GETTERS := [
	"rendering/rendering_method",
	"rendering/anti_aliasing/quality/msaa_3d",
	"rendering/anti_aliasing/quality/screen_space_aa",
	"rendering/anti_aliasing/quality/use_taa",
	"rendering/scaling/3d/scale_3d",
	"rendering/lights_and_shadows/directional_shadow/size",
	"rendering/lights_and_shadows/positional_shadow/atlas_size",
	"rendering/lights_and_shadows/use_physical_light_units",
	"rendering/occlusion_culling/use_occlusion_culling",
	"display/window/vsync/vsync_mode",
	"rendering/rendering_device/driver.windows",
	"application/run/max_fps",
]


func _initialize() -> void:
	print("PROBE4-BEGIN")
	for cls in CLASSES:
		if not ClassDB.class_exists(cls):
			print("MISSING CLASS " + cls)
			continue
		var ml: Array = ClassDB.class_get_method_list(cls, true)
		var mn := []
		for m in ml:
			var s := String(m.get("name", ""))
			if s == "" or s.begins_with("_"):
				continue
			var low := s.to_lower()
			for f in FILTERS:
				if low.contains(f):
					mn.append(s)
					break
		mn.sort()
		print("== " + cls + " METHODS ==")
		print("   " + ", ".join(mn))
	print("== ENUM TextureLayered? / Image.Format 前若干 ==")
	var fmt := []
	for c in ClassDB.class_get_integer_constant_list("Image", false):
		var s := String(c)
		if s.begins_with("FORMAT_"):
			fmt.append(s)
	print("   " + ", ".join(fmt))
	print("== 运行期可读到的渲染设置 ==")
	for g in GETTERS:
		print("   %s has=%s val=%s" % [g, str(ProjectSettings.has_setting(g)), str(ProjectSettings.get_setting(g)) if ProjectSettings.has_setting(g) else "-"])
	print("PROBE4-END")
	quit(0)
