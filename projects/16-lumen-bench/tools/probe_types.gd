# 第三轮探针：属性「类型」与 4.7 新增/改名的渲染容器
#
# 用途：确认 adjustment_color_correction 到底吃 Texture2D 还是 Texture3D、
# World3D（替代 WorldSettings？）有哪些字段、FogMaterial/LightmapGI 的真实属性。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_types.gd
extends SceneTree

const TARGETS := {
	"Environment": ["adjustment_color_correction", "glow_map", "sky", "background_canvas", "tonemap_mode", "sdfgi_cascades", "sdfgi_y_scale", "fog_mode", "ambient_light_source", "reflected_light_source", "ssao_light_affect", "ssr_max_steps", "volumetric_fog_anisotropy"],
	"Light3D": ["light_projector", "light_energy", "light_intensity_lux", "light_bake_mode", "shadow_caster_mask", "light_temperature"],
	"DirectionalLight3D": ["directional_shadow_mode", "light_angular_distance", "sky_mode", "light_volumetric_fog_energy", "shadow_opacity"],
	"SpotLight3D": ["spot_angle", "spot_attenuation", "light_projector", "shadow_enabled"],
	"OmniLight3D": ["omni_range", "omni_attenuation", "omni_shadow_mode", "light_size"],
	"Camera3D": ["attributes", "cull_mask", "far", "fov", "projection", "environment"],
	"Sky": ["sky_material", "radiance_size", "process_mode"],
	"ProceduralSkyMaterial": ["sky_cover", "sky_cover_modulate", "sun_curve", "ground_curve", "sky_curve"],
	"FogMaterial": [],
	"World3D": [],
	"LightmapGI": [],
	"VoxelGI": [],
	"FogVolume": ["material", "shape"],
	"Decal": ["texture_albedo", "texture_normal", "texture_orm", "texture_emission", "albedo_mix"],
	"MultiMesh": ["transform_format", "instance_use_colors", "color_format"],
	"StandardMaterial3D": ["uv1_world_triplanar", "uv1_triplanar_sharpness", "roughness_texture", "heightmap_enabled", "transparency", "shader_type?"],
}


func _initialize() -> void:
	print("PROBE3-BEGIN")
	for cls in TARGETS.keys():
		if not ClassDB.class_exists(cls):
			print("MISSING CLASS " + cls)
			continue
		var plist: Array = ClassDB.class_get_property_list(cls, false)
		var wanted: Array = TARGETS[cls]
		print("== " + cls + " ==")
		for p in plist:
			var nname := String(p.get("name", ""))
			var ptype: int = int(p.get("type", 0))
			var hint: int = int(p.get("hint", 0))
			var hintstr := String(p.get("hint_string", ""))
			var cname := String(p.get("class_name", ""))
			if wanted.size() == 0:
				if ptype == 0 and cname == "":
					continue
				print("   %s type=%s class=%s hint=%s hs=%s" % [nname, str(ptype), cname, str(hint), hintstr])
			elif wanted.has(nname):
				print("   %s type=%s class=%s hint=%s hs=%s" % [nname, str(ptype), cname, str(hint), hintstr])
	print("PROBE3-END")
	quit(0)
