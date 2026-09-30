# Godot 4.7 渲染 API 探针（TA 基准场专用）
#
# 目的：把本机引擎里 Environment / 灯光 / 物理相机 等类的**真实属性名与枚举值**打出来，
# 避免凭记忆猜 API（路线图 §5.0d 第 1 条：枚举名一律 ClassDB 查询）。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_api.gd
extends SceneTree

# 需要探查的类：渲染管线相关的容器与光源
const CLASSES := [
	"Environment",
	"WorldEnvironment",
	"Sky",
	"ProceduralSkyMaterial",
	"PhysicalSkyMaterial",
	"HoseSkyMaterial",
	"DirectionalLight3D",
	"OmniLight3D",
	"SpotLight3D",
	"Light3D",
	"FogVolume",
	"ReflectionProbe",
	"Decal",
	"VolumetricFog",
	"WorldSettings",
	"Camera3D",
	"CameraAttributes",
	"CameraAttributesPractical",
	"CameraAttributesPhysical",
	"GPUParticles3D",
	"ParticleProcessMaterial",
	"StandardMaterial3D",
	"BaseMaterial3D",
	"Node",
	"RenderingDevice",
	"Texture3D",
	"FastNoiseLite",
]

# 候选 ProjectSetting 名：打印「存在 / 不存在」，用来确定 4.7 还能不能设这些项
const SETTINGS := [
	"rendering/rendering_method",
	"rendering/rendering_method.mobile",
	"rendering/rendering_method.foveated_rasterization",
	"rendering/anti_aliasing/quality/msaa_3d",
	"rendering/anti_aliasing/quality/use_debanding",
	"rendering/anti_aliasing/quality/screen_space_aa",
	"rendering/anti_aliasing/quality/use_taa",
	"rendering/scaling/3d/scale_3d",
	"rendering/scaling/3d/mode",
	"rendering/scaling/3d/integer_scale_3d",
	"rendering/lights_and_shadows/directional_shadow/size",
	"rendering/lights_and_shadows/directional_shadow/16_bits",
	"rendering/lights_and_shadows/directional_shadow/soft_filters",
	"rendering/lights_and_shadows/directional_shadow/angle",
	"rendering/lights_and_shadows/positional_shadow/atlas_size",
	"rendering/lights_and_shadows/positional_shadow/soft_shadow_filter_quality",
	"rendering/global_illumination/sdfgi/probe_subdivision",
	"rendering/global_illumination/sdfgi/cardinal_max_distance",
	"rendering/global_illumination/sdfgi/max_cell_energy",
	"rendering/global_illumination/sdfgi/frames_to_converge",
	"rendering/global_illumination/use_semifrontal_gi",
	"rendering/global_illumination/allow_signed_distance_fields_on_import",
	"rendering/global_illumination/virtual_shadow_maps_available",
	"rendering/occlusion_culling/use_occlusion_culling",
	"rendering/occlusion_culling/bvh_build_on_import",
	"rendering/rendering_device/driver",
	"rendering/rendering_device/driver.windows",
	"rendering/rendering_device/max_render_time",
	"rendering/rendering_device/staging_buffer",
	"rendering/textures/vram_compression/import_etc2_astc",
	"rendering/textures/default_filters/anisotropic_filtering",
	"rendering/textures/canvas_textures/default_texture_filter",
	"rendering/2d/snap/snap_2d_transforms_to_pixel",
	"rendering/environment/defaults/default_env",
	"rendering/environment/defaults/default_sky",
	"rendering/environment/background/legacy_clear_color",
	"rendering/driver/threads/thread_model",
	"rendering/resources/load_threaded_expiration_delay",
	"physics/3d/engine",
	"debug/gdscript/warnings/unsafe_property_access",
]


func _initialize() -> void:
	print("PROBE-BEGIN")
	var v: Dictionary = Engine.get_version_info()
	print("VERSION str=%s major=%s minor=%s patch=%s" % [str(v.get("string", "?")), str(v.get("major", "?")), str(v.get("minor", "?")), str(v.get("patch", "?"))])
	print("CLASSDB_HAS RenderingDevice=%s" % str(ClassDB.class_exists("RenderingDevice")))
	for cls in CLASSES:
		if not ClassDB.class_exists(cls):
			print("MISSING CLASS " + cls)
			continue
		print("== " + cls + " :PROPS ==")
		var plist: Array = ClassDB.class_get_property_list(cls, false)
		var names := []
		for p in plist:
			var usage: int = int(p.get("usage", 0))
			if (usage & PROPERTY_USAGE_STORAGE) == 0 and (usage & PROPERTY_USAGE_EDITOR) == 0:
				continue
			names.append(String(p.get("name", "")))
		names.sort()
		print("   " + ", ".join(names))
		var enums: PackedStringArray = ClassDB.class_get_integer_constant_list(cls, true)
		print("== " + cls + " :ENUMS ==")
		print("   " + ", ".join(enums))
		# 每个枚举类把具体常量列出来（只关心渲染相关的几个）
		for e in enums:
			var prefix: String = String(e)
			var matched := []
			for c in ClassDB.class_get_integer_constant_list(cls, false):
				var s := String(c)
				if s.begins_with(prefix + "_"):
					matched.append(s)
			if matched.size() > 0:
				matched.sort()
				print("   enum " + prefix + " = " + ", ".join(matched))
	print("== SETTINGS ==")
	for s in SETTINGS:
		print("   %s has=%s val=%s" % [s, str(ProjectSettings.has_setting(s)), str(ProjectSettings.get_setting(s)) if ProjectSettings.has_setting(s) else "-"])
	print("PROBE-END")
	quit(0)
