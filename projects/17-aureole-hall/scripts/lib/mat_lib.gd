class_name MatLib
extends RefCounted
## 材质库 —— 用 ProcTex 的贴图装配 StandardMaterial3D。
##
## 架构面（墙/地/柱）一律走世界三平面映射（world triplanar）：
## 不同尺寸的 BoxMesh 不用手动展 UV，且全场 texel density 天然一致 —— 这是
## 「看起来像人做的场景」与「程序化糊出来的场景」的分水岭之一。


static var _cache: Dictionary = {}


# ─────────────────────────── 建筑主体 ───────────────────────────

## 清水混凝土：场景的底色（灰中带暖，暮色天光下不发青）
static func concrete(tint: Color = Color(1, 1, 1), uv_scale := 0.33) -> StandardMaterial3D:
	var key := "concrete_%s_%s" % [tint.to_html(), str(uv_scale)]
	return _memo(key, func() -> StandardMaterial3D:
		var t := ProcTex.concrete()
		var m := _base()
		m.albedo_texture = t["albedo"]
		m.albedo_color = tint
		m.albedo_texture_force_srgb = true
		m.roughness_texture = t["rough"]
		m.roughness = 1.0
		m.normal_texture = t["normal"]
		m.normal_enabled = true
		m.normal_scale = 0.8
		m.uv1_scale = Vector3(uv_scale, uv_scale, uv_scale)
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		return m)


## 抛光地砖：低粗糙 + clearcoat 湿感（反射霓虹与天光的关键面）
static func polished_tile() -> StandardMaterial3D:
	return _memo("polished_tile", func() -> StandardMaterial3D:
		var t := ProcTex.tile_floor()
		var m := _base()
		m.albedo_texture = t["albedo"]
		m.albedo_color = Color(0.9, 0.93, 1.0)
		m.albedo_texture_force_srgb = true
		m.roughness_texture = t["rough"]
		m.roughness = 1.0
		m.normal_texture = t["normal"]
		m.normal_enabled = true
		m.normal_scale = 0.55
		m.uv1_scale = Vector3(0.5, 0.5, 0.5)
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		# 清漆层：抛光砖的第二层高光，让霓虹倒影有「浮在湿面上」的层次
		m.clearcoat_enabled = true
		m.clearcoat = 0.55
		m.clearcoat_roughness = 0.25
		m.metallic_specular = 0.9
		return m)


## 湿区地砖：比抛光砖更黑更亮（积水边缘）
static func wet_tile() -> StandardMaterial3D:
	return _memo("wet_tile", func() -> StandardMaterial3D:
		var m := polished_tile().duplicate() as StandardMaterial3D
		m.albedo_color = Color(0.55, 0.6, 0.68)
		m.clearcoat = 0.95
		m.clearcoat_roughness = 0.08
		return m)


# ─────────────────────────── 金属 / 漆面 ───────────────────────────

static func brushed_metal(tint: Color = Color(1, 1, 1), uv_scale := 1.2) -> StandardMaterial3D:
	var key := "brushed_%s_%s" % [tint.to_html(), str(uv_scale)]
	return _memo(key, func() -> StandardMaterial3D:
		var t := ProcTex.metal_brushed()
		var m := _base()
		m.albedo_texture = t["albedo"]
		m.albedo_color = tint
		m.albedo_texture_force_srgb = true
		m.roughness_texture = t["rough"]
		m.roughness = 1.0
		m.normal_texture = t["normal"]
		m.normal_enabled = true
		m.normal_scale = 0.4
		m.metallic = 0.92
		m.uv1_scale = Vector3(uv_scale, uv_scale, uv_scale)
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		return m)


## 漆面钢：掉漆 + 锈蚀（箱子、机架、栏杆翻新感的来源）
static func painted(color: Color, uv_scale := 1.5, rough_mul := 1.0) -> StandardMaterial3D:
	var key := "painted_%s_%s_%s" % [color.to_html(), str(uv_scale), str(rough_mul)]
	return _memo(key, func() -> StandardMaterial3D:
		var t := ProcTex.painted_steel()
		var m := _base()
		m.albedo_texture = t["albedo"]
		m.albedo_color = color
		m.albedo_texture_force_srgb = true
		m.roughness_texture = t["rough"]
		m.roughness = rough_mul
		m.normal_texture = t["normal"]
		m.normal_enabled = true
		m.normal_scale = 0.7
		m.metallic = 0.15
		m.uv1_scale = Vector3(uv_scale, uv_scale, uv_scale)
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		return m)


## 科技面板：机架前脸 / 电控柜（自带散热缝与铭牌图案）
static func tech_panel(uv_scale := 1.0) -> StandardMaterial3D:
	var key := "tech_panel_%s" % str(uv_scale)
	return _memo(key, func() -> StandardMaterial3D:
		var t := ProcTex.tech_panel()
		var m := _base()
		m.albedo_texture = t["albedo"]
		m.albedo_texture_force_srgb = true
		m.roughness_texture = t["rough"]
		m.roughness = 1.0
		m.normal_texture = t["normal"]
		m.normal_enabled = true
		m.normal_scale = 1.0
		m.metallic = 0.4
		m.uv1_scale = Vector3(uv_scale, uv_scale, uv_scale)
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		return m)


# ─────────────────────────── 自发光 ───────────────────────────

## 霓虹缝 / 灯带：albedo 近黑 + emission。走 shaded 模式，
## 这样 emissive 才会被 SDFGI 当成面光源采样 → 青光弹到混凝土上。
static func emissive(color: Color, energy: float, albedo := Color(0.02, 0.02, 0.02)) -> StandardMaterial3D:
	var key := "emissive_%s_%s" % [color.to_html(), str(energy)]
	return _memo(key, func() -> StandardMaterial3D:
		var m := _base()
		m.albedo_color = albedo
		m.roughness = 0.6
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = energy
		return m)


static func glow_lens(color: Color, energy: float) -> StandardMaterial3D:
	# 灯罩：发光体本身（比 emissive 更亮，做 bloom 的主角）
	var key := "lens_%s_%s" % [color.to_html(), str(energy)]
	return _memo(key, func() -> StandardMaterial3D:
		var m := _base()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.albedo_color = color
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = energy
		return m)


# ─────────────────────────── 玻璃 / 水 ───────────────────────────

static func glass(tint := Color(0.75, 0.85, 0.9)) -> StandardMaterial3D:
	return _memo("glass", func() -> StandardMaterial3D:
		var m := _base()
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.albedo_color = Color(tint.r, tint.g, tint.b, 0.18)
		m.roughness = 0.05
		m.metallic = 0.0
		m.metallic_specular = 1.0
		m.cull_mode = BaseMaterial3D.CULL_DISABLED   # 单面玻璃片双面可见
		m.disable_ambient_light = false
		return m)


## 积水：近镜面 + 微波纹法线，主要吃 SSR 反射霓虹
static func puddle() -> StandardMaterial3D:
	return _memo("puddle", func() -> StandardMaterial3D:
		var m := _base()
		m.albedo_color = Color(0.035, 0.05, 0.065)
		m.roughness = 0.035
		m.metallic = 0.1
		m.metallic_specular = 1.0
		m.normal_texture = ProcTex.puddle_ripple()
		m.normal_enabled = true
		m.normal_scale = 0.25
		m.uv1_scale = Vector3(0.6, 0.6, 0.6)
		m.clearcoat_enabled = true
		m.clearcoat = 1.0
		m.clearcoat_roughness = 0.03
		return m)


static var _radial: ImageTexture = null


static func dust_particle(color: Color, alpha := 0.5) -> StandardMaterial3D:
	return _memo("dust_%s_%s" % [color.to_html(), str(alpha)], func() -> StandardMaterial3D:
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
		m.albedo_color = Color(color.r, color.g, color.b, alpha)
		# 径向衰减贴图：粒子才是「光点」而不是白方块
		m.albedo_texture = _radial_sprite()
		m.disable_fog = false
		m.vertex_color_use_as_albedo = true
		return m)


## 64×64 径向 alpha（(1-r)² 衰减），程序化生成一次全局复用
static func _radial_sprite() -> ImageTexture:
	if _radial != null:
		return _radial
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in 64:
		for x in 64:
			var dx := (float(x) - 31.5) / 31.5
			var dy := (float(y) - 31.5) / 31.5
			var r := sqrt(dx * dx + dy * dy)
			var a := clampf(1.0 - r, 0.0, 1.0)
			a = a * a
			img.set_pixel(x, y, Color(1, 1, 1, a))
	img.generate_mipmaps()
	_radial = ImageTexture.create_from_image(img)
	return _radial


# ─────────────────────────── 工具 ───────────────────────────

static func _base() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	return m


static func _memo(key: String, builder: Callable) -> StandardMaterial3D:
	if not _cache.has(key):
		_cache[key] = builder.call()
	return _cache[key]
