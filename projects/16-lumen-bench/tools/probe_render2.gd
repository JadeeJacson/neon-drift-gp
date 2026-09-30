# 第二轮定向探针：4.7 里被改名/搬走的渲染类与能力开关
#
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_render2.gd
# 关注三件事：① 哪些 GI/后处理类还存在 ② 相机景深到底在哪 ③ 渲染相关 ProjectSetting 真名
extends SceneTree

# 关键词命中即列出类名（用来发现 4.7 的新类/改名）
const KEYWORDS := ["Compositor", "World", "Voxel", "Lightmap", "GI", "Sdf", "Depth", "Dof", "Motion", "Occluder", "Multi", "Clustered", "Ray", "Decal", "Ssao", "Glow", "Adjustment", "Fog", "Sky", "Taa", "Scale"]

# 需要「全量属性（不过滤 usage）」的类
const FULL := [
	"CameraAttributesPhysical",
	"CameraAttributesPractical",
	"Compositor",
	"CompositorEffect",
	"Environment",
]

# 候选 ProjectSetting 真名（含 4.x 正确前缀 rendering/renderer/…）
const SETTINGS := [
	"rendering/renderer/rendering_method",
	"rendering/renderer/rendering_method.mobile",
	"rendering/rendering_quality/shadow_atlas_sorting",
	"rendering/rendering_quality/cubemap/shadow_atlas",
	"rendering/rendering_quality/directional_shadow/blend_splits",
	"rendering/lights_and_shadows/use_physical_light_units",
	"rendering/lights_and_shadows/directional_shadow/size.mobile",
	"rendering/lights_and_shadows/max_directional_splits",
	"rendering/lights_and_shadows/shadow_mesh_size",
	"rendering/global_illumination/tutorials/show_gi",
	"rendering/global_illumination/sdfgi/probe_subdivision",
	"rendering/global_illumination/sdfgi/max_cell_energy",
	"rendering/global_illumination/sdfgi/injection_cell_size",
	"rendering/global_illumination/sdfgi/cell_cardinal_max_distances",
	"rendering/global_illumination/ray_tracing/...",
	"rendering/environment/defaults/default_env",
	"rendering/environment/defaults/default_sky",
	"rendering/environment/defaults/default_clear_color",
	"rendering/environment/defaults/default_scaling_3d_mode",
	"rendering/scaling/3d/scale_3d",
	"rendering/anti_aliasing/quality/screen_space_aa",
	"rendering/anti_aliasing/quality/use_taa",
	"rendering/anti_aliasing/auto/msaa_3d",
	"rendering/textures/DEFAULT_TEXTURE_FILTER",
	"rendering/2d/sampler_clip",
	"rendering/vram_compression/import_etc2_astc",
	"rendering/device/driver",
	"rendering/rendering_device/driver.windows",
	"rendering/rendering_device/enable_build_into",
	"rendering/shading/overrides/force_shaded",
	"rendering/mobile/rendering_scale_mode",
	"rendering/pipelines/forward_plus/msaa/3d",
	"rendering/3d/scale_3d_mode",
	"display/window/size/mode",
	"display/window/vsync/vsync_mode",
	"interactive_music/...",
	"physics/3d/engine",
	"audio/driver/enable_output",
	"debug/shapes/3d/show_colored",
]


func _initialize() -> void:
	print("PROBE2-BEGIN")
	var all: PackedStringArray = ClassDB.get_class_list()
	print("CLASS_COUNT=" + str(all.size()))
	for kw in KEYWORDS:
		var hits := []
		for c in all:
			var s := String(c)
			if s.contains(kw):
				hits.append(s)
		hits.sort()
		print("KW %s = %s" % [kw, ", ".join(hits)])
	print("-- 是否存在的重点类 --")
	for c in ["WorldSettings", "World3D", "VoxelGI", "VoxelGIData", "LightmapGIData", "LightmapProbe", "OccluderInstance3D", "CompositorEffect", "Compositor", "CameraAttributesPhysical", "PhysicsMaterial", "ProximityGroup3D", "AnimatedPhysicalMaterial3D?"]:
		print("   %s exists=%s" % [c, str(ClassDB.class_exists(c))])
	print("-- 全量属性 --")
	for cls in FULL:
		if not ClassDB.class_exists(cls):
			print("MISSING CLASS " + cls)
			continue
		var plist: Array = ClassDB.class_get_property_list(cls, true)
		var names := []
		for p in plist:
			names.append(String(p.get("name", "")))
		names.sort()
		print("== " + cls + " FULLPROPS ==")
		print("   " + ", ".join(names))
	print("-- METHODS(相机属性/合成器) --")
	for cls in ["CameraAttributes", "CameraAttributesPhysical", "Compositor", "CompositorEffect"]:
		if not ClassDB.class_exists(cls):
			continue
		var ml: Array = ClassDB.class_get_method_list(cls, false)
		var mn := []
		for m in ml:
			mn.append(String(m.get("name", "")))
		mn.sort()
		print("== " + cls + " METHODS ==\n   " + ", ".join(mn))
	print("-- SETTINGS --")
	for s in SETTINGS:
		print("   %s has=%s val=%s" % [s, str(ProjectSettings.has_setting(s)), str(ProjectSettings.get_setting(s)) if ProjectSettings.has_setting(s) else "-"])
	print("PERF MONITORS:")
	var pm: Array = ClassDB.class_get_integer_constant_list("Performance", false)
	var pl := []
	for c in pm:
		var s := String(c)
		if s.begins_with("TIME_") or s.begins_with("RENDER_"):
			pl.append(s)
	pl.sort()
	print("   " + ", ".join(pl))
	print("PROBE2-END")
	quit(0)
