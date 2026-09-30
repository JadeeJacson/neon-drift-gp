# 大气与渲染管线装配：天空 / Environment（SDFGI·SSAO·SSIL·SSR·体积雾·glow·AgX）/ 预设
#
# 这一层是 TA 测试的主战场，所有参数都写成显式赋值并保留注释，
# 报告里的「技术参数表」就是从这里读的（snapshot() 会把当前值原样打印出来）。
extends RefCounted

const Layout := preload("res://scripts/layout.gd")
const TexLab := preload("res://scripts/tex_lab.gd")

# 预设名：direct = 只有直接光（对照组），base = GI+AO，cine = 完整电影级，ultra = 再往上顶
const PRESETS := ["direct", "base", "cine", "ultra"]

const PRESET_LABEL := {
	"direct": "直接光对照（无 GI/AO/体积雾/glowl）",
	"base": "GI + AO 基础档",
	"cine": "电影级基准档（本工程默认）",
	"ultra": "上限推档（SSR/更细 SDFGI/更高分辨率）",
}


# 无头（dummy 渲染器）下没有 RenderingDevice，编译着色器只会刷一堆 dummy 层报错。
# 画面验证本来就必须有窗口（路线图 §4.4），所以无头时直接跳过 shader 加载，
# 让 headless 那一步只验「场景装配」，日志保持干净。
static func can_render() -> bool:
	return RenderingServer.get_rendering_device() != null


# ── 天空：ProceduralSkyMaterial + 程序化云层图 ─────────────────────────
static func make_sky(seed: int) -> Sky:
	var sm := ProceduralSkyMaterial.new()
	# 黄昏：天顶靛蓝 → 地平线橙红，地面反射给一层冷灰（室内补光主要靠它 + SDFGI）
	sm.sky_top_color = TexLab.srgb_to_linear(Color(0.055, 0.098, 0.243))
	sm.sky_horizon_color = TexLab.srgb_to_linear(Color(0.843, 0.451, 0.239))
	sm.ground_horizon_color = TexLab.srgb_to_linear(Color(0.333, 0.239, 0.200))
	sm.ground_bottom_color = TexLab.srgb_to_linear(Color(0.043, 0.047, 0.063))
	sm.sky_energy_multiplier = 0.5
	sm.ground_energy_multiplier = 0.32
	# 太阳盘：角度收小变硬、衰减曲线做锐利落日
	sm.sun_angle_max = 8.0
	sm.sun_curve = 0.42
	sm.sky_curve = 0.24
	sm.ground_curve = 0.32
	# 层积云：程序生成的云层图当 sky_cover，暖色调制让云被落日染色
	var cover := TexLab.cloud_cover(1024, seed + 900)
	sm.sky_cover = ImageTexture.create_from_image(cover)
	sm.sky_cover_modulate = TexLab.srgb_to_linear(Color(1.35, 0.92, 0.72))
	var sky := Sky.new()
	sky.sky_material = sm
	sky.radiance_size = Sky.RADIANCE_SIZE_1024
	sky.process_mode = Sky.PROCESS_MODE_QUALITY
	return sky


# ── Environment 主体：先给满配，再由 apply_preset 逐项降级 ─────────────
static func make_environment(sky: Sky, seed: int) -> Environment:
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.background_energy_multiplier = 0.55
	env.sky_rotation = Vector3(0, Layout.SUN_AZIMUTH, 0)
	env.sky_custom_fov = 0.0

	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.12
	env.ambient_light_sky_contribution = 1.0
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY

	# 色调映射：AgX（4.4 起可调对比与白点），黄昏高光不翻白
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.tonemap_exposure = 0.85
	env.tonemap_white = 3.2
	env.tonemap_agx_contrast = 1.18
	env.tonemap_agx_white = 1.0

	# 全局光照：SDFGI 是室内能「看见彩色反弹」的关键
	env.sdfgi_enabled = true
	env.sdfgi_cascades = 4
	env.sdfgi_min_cell_size = 0.14
	env.sdfgi_use_occlusion = true
	env.sdfgi_bounce_feedback = 0.62
	env.sdfgi_read_sky_light = true
	env.sdfgi_energy = 1.0
	env.sdfgi_max_distance = 120.0
	env.sdfgi_cascade0_distance = 14.0
	env.sdfgi_y_scale = Environment.SDFGI_Y_SCALE_75_PERCENT
	env.sdfgi_normal_bias = 1.0
	env.sdfgi_probe_bias = 1.1

	# 环境光遮蔽：半径按空间尺度（厅跨 24 m）给 1.6 m，detail 让近处缝隙也咬得住
	env.ssao_enabled = true
	env.ssao_radius = 1.6
	env.ssao_intensity = 0.85
	env.ssao_power = 1.0
	env.ssao_detail = 0.35
	env.ssao_horizon = 0.15
	env.ssao_sharpness = 0.55
	env.ssao_light_affect = 0.55
	env.ssao_ao_channel_affect = 0.0

	# 屏幕空间间接光：给 SDFGI 补近处角落的反弹
	env.ssil_enabled = true
	env.ssil_radius = 2.4
	env.ssil_intensity = 0.55
	env.ssil_sharpness = 1.0
	env.ssil_normal_rejection = 1.0

	# 屏幕空间反射：水面与黄铜的二次信息（与 SDFGI 共存情况见 README 实测结论）
	env.ssr_enabled = false
	env.ssr_max_steps = 64
	env.ssr_fade_out = 1.25
	env.ssr_depth_tolerance = 0.25

	# 体积雾：整厅一层很薄的尘幕，光束靠它显形
	env.volumetric_fog_enabled = true
	env.volumetric_fog_density = 0.0045
	env.volumetric_fog_albedo = TexLab.srgb_to_linear(Color(0.78, 0.74, 0.70))
	env.volumetric_fog_anisotropy = 0.62
	env.volumetric_fog_emission = TexLab.srgb_to_linear(Color(0.05, 0.055, 0.075))
	env.volumetric_fog_emission_energy = 0.06
	env.volumetric_fog_gi_inject = 1.0
	env.volumetric_fog_ambient_inject = 0.15
	env.volumetric_fog_sky_affect = 0.20
	env.volumetric_fog_length = 160.0
	env.volumetric_fog_detail_spread = 2.4
	env.volumetric_fog_temporal_reprojection_enabled = true
	env.volumetric_fog_temporal_reprojection_amount = 0.82

	# 传统雾（非体积）：负责远处的纵深衰减与天光散射
	env.fog_enabled = true
	env.fog_mode = Environment.FOG_MODE_EXPONENTIAL
	env.fog_light_color = TexLab.srgb_to_linear(Color(0.52, 0.44, 0.42))
	env.fog_light_energy = 0.35
	env.fog_density = 0.0016
	env.fog_height = 0.0
	env.fog_height_density = 0.42
	env.fog_aerial_perspective = 0.35
	env.fog_sky_affect = 0.25
	env.fog_sun_scatter = 0.42

	# 泛光：只让超过 1.0 的亮度溢出（落日、烛焰、彩窗），暗部不糊
	env.glow_enabled = true
	env.glow_normalized = false
	env.glow_intensity = 0.45
	env.glow_strength = 0.85
	env.glow_bloom = 0.02
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_SCREEN
	env.glow_hdr_threshold = 1.0
	env.glow_hdr_luminance_cap = 12.0
	env.glow_hdr_scale = 1.0
	env.set("glow_levels/1", 0.0)
	env.set("glow_levels/2", 0.30)
	env.set("glow_levels/3", 1.00)
	env.set("glow_levels/4", 0.72)
	env.set("glow_levels/5", 0.38)
	env.set("glow_levels/6", 0.18)
	env.set("glow_levels/7", 0.08)

	# 调色：先把标量给上，LUT 由 set_lut() 决定开不开
	env.adjustment_enabled = true
	env.adjustment_brightness = 1.0
	env.adjustment_contrast = 1.10
	env.adjustment_saturation = 1.07
	return env


static func set_lut(env: Environment, mode: String) -> void:
	if mode == "off":
		env.adjustment_color_correction = null
		return
	# mode: grade / identity / swap；tile 版式在 4.7 上要靠肉眼判定，见 README
	# 实测 4×4 tiles / 256² 会被当成 8×8 tiles 采样→整体偏色，所以固定用 8×8 / 512²
	var img := TexLab.grade_lut_2d(mode, 8, 64)
	var tex := ImageTexture.create_from_image(img)
	tex.resource_name = "GradeLUT_" + mode
	env.adjustment_color_correction = tex


# ── 预设：每一项都写清楚「关掉什么」───────────────────────────────────
static func apply_preset(env: Environment, preset: String) -> void:
	match preset:
		"direct":
			# 对照组：只留直接光 + 天空背景，用来量化 GI/后处理各自贡献了多少画面信息
			env.sdfgi_enabled = false
			env.ssao_enabled = false
			env.ssil_enabled = false
			env.ssr_enabled = false
			env.volumetric_fog_enabled = false
			env.fog_enabled = false
			env.glow_enabled = false
			env.adjustment_enabled = false
			env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
			env.ambient_light_energy = 0.10
			env.tonemap_mode = Environment.TONE_MAPPER_LINEAR
		"base":
			env.sdfgi_enabled = true
			env.ssao_enabled = true
			env.ssil_enabled = false
			env.ssr_enabled = false
			env.volumetric_fog_enabled = false
			env.fog_enabled = true
			env.glow_enabled = true
			env.adjustment_enabled = true
			env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
			env.glow_intensity = 0.45
		"cine":
			env.sdfgi_enabled = true
			env.sdfgi_cascades = 4
			env.ssao_enabled = true
			env.ssil_enabled = true
			env.ssr_enabled = false
			env.volumetric_fog_enabled = true
			env.fog_enabled = true
			env.glow_enabled = true
			env.adjustment_enabled = true
			env.tonemap_mode = Environment.TONE_MAPPER_AGX
		"ultra":
			env.sdfgi_enabled = true
			env.sdfgi_cascades = 5
			env.sdfgi_min_cell_size = 0.08
			env.sdfgi_bounce_feedback = 0.75
			env.ssao_enabled = true
			env.ssil_enabled = true
			env.ssr_enabled = true
			env.ssr_max_steps = 128
			env.volumetric_fog_enabled = true
			env.volumetric_fog_density = 0.022
			env.glow_enabled = true
			env.adjustment_enabled = true
			env.tonemap_mode = Environment.TONE_MAPPER_AGX


# 预设附带的项目设置（分辨率缩放/MSAA/TAA/阴影尺寸），要走 ProjectSettings
static func preset_project_settings(preset: String) -> Dictionary:
	match preset:
		"direct":
			return {"scale": 1.0, "msaa": 0, "taa": false, "dshadow": 2048}
		"base":
			return {"scale": 1.0, "msaa": 1, "taa": false, "dshadow": 2048}
		"cine":
			return {"scale": 1.0, "msaa": 2, "taa": false, "dshadow": 4096}
		_:
			return {"scale": 1.0, "msaa": 3, "taa": true, "dshadow": 8192}


static func apply_project_settings(preset: String) -> void:
	var s: Dictionary = preset_project_settings(preset)
	ProjectSettings.set_setting("rendering/scaling/3d/scale_3d", float(s["scale"]))
	ProjectSettings.set_setting("rendering/anti_aliasing/quality/msaa_3d", int(s["msaa"]))
	ProjectSettings.set_setting("rendering/anti_aliasing/quality/use_taa", bool(s["taa"]))
	ProjectSettings.set_setting("rendering/lights_and_shadows/directional_shadow/size", int(s["dshadow"]))


# ── 参数快照：报告与日志都用它，避免手写表格跟代码脱节 ─────────────────
static func snapshot(env: Environment) -> Dictionary:
	var d := {}
	d["background_mode"] = env.background_mode
	d["sky_radiance"] = env.sky.radiance_size if env.sky != null else -1
	d["tonemap"] = ["Linear", "Reinhard", "Filmic", "ACES", "AgX"][env.tonemap_mode]
	d["tonemap_exposure"] = env.tonemap_exposure
	d["tonemap_white"] = env.tonemap_white
	if env.tonemap_mode == Environment.TONE_MAPPER_AGX:
		d["agx_contrast"] = env.tonemap_agx_contrast
	d["sdfgi"] = env.sdfgi_enabled
	if env.sdfgi_enabled:
		d["sdfgi_cascades"] = env.sdfgi_cascades
		d["sdfgi_min_cell"] = env.sdfgi_min_cell_size
		d["sdfgi_bounce"] = env.sdfgi_bounce_feedback
		d["sdfgi_occlusion"] = env.sdfgi_use_occlusion
		d["sdfgi_max_dist"] = env.sdfgi_max_distance
	d["ssao"] = env.ssao_enabled
	if env.ssao_enabled:
		d["ssao_radius"] = env.ssao_radius
		d["ssao_intensity"] = env.ssao_intensity
	d["ssil"] = env.ssil_enabled
	d["ssr"] = env.ssr_enabled
	d["volumetric_fog"] = env.volumetric_fog_enabled
	if env.volumetric_fog_enabled:
		d["vf_density"] = env.volumetric_fog_density
		d["vf_anisotropy"] = env.volumetric_fog_anisotropy
	d["fog"] = env.fog_enabled
	d["glow"] = env.glow_enabled
	if env.glow_enabled:
		d["glow_intensity"] = env.glow_intensity
		d["glow_hdr_threshold"] = env.glow_hdr_threshold
	d["adjustment"] = env.adjustment_enabled
	d["lut"] = env.adjustment_color_correction != null
	d["msaa_3d"] = ProjectSettings.get_setting("rendering/anti_aliasing/quality/msaa_3d")
	d["taa"] = ProjectSettings.get_setting("rendering/anti_aliasing/quality/use_taa")
	d["scale_3d"] = ProjectSettings.get_setting("rendering/scaling/3d/scale_3d")
	d["dshadow"] = ProjectSettings.get_setting("rendering/lights_and_shadows/directional_shadow/size")
	return d


# ── 局部雾团：FogMaterial + 程序化 3D 密度图（体积雾之上的第二层体积感）──
static func make_fog_volumes(parent: Node, seed: int) -> Array:
	var made: Array = []
	if not ClassDB.class_exists("NoiseTexture3D"):
		return made
	var nt := NoiseTexture3D.new()
	var fn := FastNoiseLite.new()
	fn.seed = seed
	fn.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	fn.fractal_type = FastNoiseLite.FRACTAL_FBM
	fn.fractal_octaves = 4
	fn.frequency = 0.055
	nt.noise = fn
	nt.width = 48
	nt.height = 48
	nt.depth = 48
	nt.normalize = true
	nt.seamless = false
	# 三个雾团：破口一束（被日照打亮）、玫瑰窗下一片、圆眼下垂下一柱。
	# 密度必须压低：体积雾团是「消光 + 内散射」，光照不够时内散射补不上消光，
	# 密度一高就会在画面里坌出一个**黑球**（实测中央那团 density=0.04 直接黑掉了穹顶视角）
	var specs := [
		{"pos": Vector3(8.6, 3.2, -1.8), "size": Vector3(8.5, 5.2, 6.2), "density": 0.010, "albedo": Color(0.86, 0.80, 0.70), "emis": Color(0.10, 0.07, 0.04)},
		{"pos": Vector3(5.2, 5.0, 4.4), "size": Vector3(7.5, 6.0, 6.5), "density": 0.007, "albedo": Color(0.80, 0.74, 0.84), "emis": Color(0.07, 0.05, 0.08)},
		{"pos": Vector3(0.0, 16.6, 0.0), "size": Vector3(5.2, 7.0, 5.2), "density": 0.006, "albedo": Color(0.72, 0.78, 0.90), "emis": Color(0.05, 0.06, 0.09)},
	]
	for s in specs:
		var fm := FogMaterial.new()
		fm.density = float(s["density"])
		fm.albedo = TexLab.srgb_to_linear(s["albedo"] as Color)
		fm.emission = TexLab.srgb_to_linear(s["emis"] as Color)
		fm.height_falloff = 1.35
		fm.edge_fade = 0.35
		fm.density_texture = nt
		var fv := FogVolume.new()
		fv.material = fm
		fv.shape = 0 # FogVolume.Shape 未导出枚举名，0 = 椭球（局部）
		fv.position = s["pos"] as Vector3
		fv.size = s["size"] as Vector3
		parent.add_child(fv)
		made.append(fv)
	return made

# ── 后期叠加：自定义 canvas 后处理（晕影 + 边缘色散 + 颗粒）──────────────
static func make_post_layer() -> CanvasLayer:
	var layer := CanvasLayer.new()
	layer.name = "PostGrade"
	layer.layer = 5
	if not can_render():
		return layer
	var rect := ColorRect.new()
	rect.name = "GradeRect"
	rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var sh: Shader = load("res://shaders/post_grade.gdshader")
	if sh == null:
		push_warning("post_grade.gdshader 加载失败，后期叠加跳过")
		return layer
	var sm := ShaderMaterial.new()
	sm.shader = sh
	rect.material = sm
	layer.add_child(rect)
	return layer
