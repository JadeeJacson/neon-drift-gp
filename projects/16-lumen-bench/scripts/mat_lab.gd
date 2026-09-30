# 材质实验室：把程序化贴图接成一套 PBR 材质，并用「世界三向投影」免 UV 铺设
#
# 关键手法：石材/大理石全部走 StandardMaterial3D + uv1_world_triplanar，
# 于是柱身、拱券、穹顶这些程序生成的曲面**不需要展 UV**，也不会有拉伸与接缝，
# 这正是「零素材、纯程序」这条路能不能落地的胜负手。
# rough/metal 用独立灰度图并显式指定通道（GREEN/RED），避免 ORM 打包歧义。
extends RefCounted

const TexLab := preload("res://scripts/tex_lab.gd")

const TEX_SIZE := 512


static func build(seed: int = 20260928) -> Dictionary:
	var m := {}

	var marble := TexLab.marble_set(TEX_SIZE, seed, TexLab.C_MARBLE, TexLab.C_VEIN)
	m["marble"] = pbr(marble, Color(1, 1, 1), 0.16, 0.0, 1.0)
	m["marble_wet"] = pbr(marble, Color(0.93, 0.94, 1.0), 0.16, 0.0, 0.55)
	var dark_marble := TexLab.marble_set(TEX_SIZE, seed + 37, Color(0.44, 0.42, 0.46), Color(0.10, 0.09, 0.11))
	m["marble_dark"] = pbr(dark_marble, Color(0.98, 0.97, 1.0), 0.13, 0.0, 1.1)

	var stone := TexLab.stone_set(TEX_SIZE, seed + 11, TexLab.C_STONE)
	m["stone"] = pbr(stone, Color(1, 1, 1), 0.15, 0.0, 1.25)
	var stone_dark := TexLab.stone_set(TEX_SIZE, seed + 23, TexLab.C_STONE_DARK)
	m["stone_dark"] = pbr(stone_dark, Color(0.94, 0.93, 0.98), 0.11, 0.0, 1.4)

	# 穹顶内壁：石材 + 极弱自发光。实测补光（点光/聚光）对 12–21 m 高的内壁几乎无效，
	# 而黄昏圆眼的天光本来就不够；给 0.3 量级的自发光既能让藻井结构可读，
	# 又不会亮到被当成光源（主题上读作「镀金星图穹顶」）。
	var dome_stone := TexLab.stone_set(TEX_SIZE, seed + 91, Color(0.50, 0.46, 0.42))
	m["dome"] = pbr(dome_stone, Color(1, 0.98, 0.94), 0.10, 0.0, 1.3)
	(m["dome"] as StandardMaterial3D).emission_enabled = true
	(m["dome"] as StandardMaterial3D).emission = TexLab.srgb_to_linear(Color(0.62, 0.56, 0.48))
	(m["dome"] as StandardMaterial3D).emission_energy_multiplier = 0.30

	var brass := TexLab.metal_set(TEX_SIZE / 2, seed + 53, TexLab.C_BRASS, TexLab.C_BRASS_DARK, 1.0)
	m["brass"] = pbr(brass, Color(1.0, 0.94, 0.82), 0.0, 1.0, 1.0)
	var iron := TexLab.metal_set(TEX_SIZE / 2, seed + 61, TexLab.C_IRON, TexLab.C_RUST, 0.92)
	m["iron"] = pbr(iron, Color(0.90, 0.90, 0.95), 0.0, 0.95, 1.0)

	var oak := TexLab.marble_set(TEX_SIZE / 2, seed + 71, Color(0.28, 0.17, 0.10), Color(0.10, 0.06, 0.04))
	m["oak"] = pbr(oak, Color(1, 0.98, 0.94), 0.0, 0.0, 1.0)

	m["flame"] = emissive(Color(1.0, 0.60, 0.22), 11.0)
	m["filament"] = emissive(Color(1.0, 0.84, 0.55), 16.0)
	m["cold_emissive"] = emissive(Color(0.45, 0.62, 0.95), 3.0)
	m["rose_glass"] = rose_glass()
	m["velvet"] = velvet()
	m["mirror"] = mirror()
	print("MATLAB built: %d 个材质，单图 %d×%d" % [m.size(), TEX_SIZE, TEX_SIZE])
	return m


# 由 {albedo, rough, normal, metal?} 组一个 StandardMaterial3D
# triplanar：>0 时启用世界三向投影并以此为世界尺度（米/次平铺），0 表示用网格 UV
static func pbr(set: Dictionary, tint: Color, triplanar: float, metallic_spec: float, normal_scale: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex(set["albedo"] as Image)
	m.albedo_color = tint
	m.roughness_texture = tex(set["rough"] as Image)
	m.roughness = 1.0
	m.roughness_texture_channel = BaseMaterial3D.TEXTURE_CHANNEL_GREEN
	if set.has("normal"):
		m.normal_enabled = true
		m.normal_texture = tex(set["normal"] as Image)
		m.normal_scale = normal_scale
	if set.has("metal"):
		m.metallic = 1.0
		m.metallic_texture = tex(set["metal"] as Image)
		m.metallic_texture_channel = BaseMaterial3D.TEXTURE_CHANNEL_RED
		m.metallic_specular = metallic_spec
	else:
		m.metallic = 0.0
		m.metallic_specular = 0.6
	m.diffuse_mode = BaseMaterial3D.DIFFUSE_BURLEY
	m.specular_mode = BaseMaterial3D.SPECULAR_SCHLICK_GGX
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	if triplanar > 0.0:
		m.uv1_triplanar = true
		m.uv1_world_triplanar = true
		m.uv1_scale = Vector3(triplanar, triplanar, triplanar)
		m.uv1_triplanar_sharpness = 1.8
	return m


static func tex(img: Image) -> ImageTexture:
	var t := ImageTexture.create_from_image(img)
	t.resource_name = "proc_%dx%d" % [img.get_width(), img.get_height()]
	return t


static func emissive(c: Color, energy: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.emission_enabled = true
	m.emission = TexLab.srgb_to_linear(c)
	m.emission_energy_multiplier = energy
	m.albedo_color = Color(0, 0, 0, 1)
	return m


# 玫瑰窗：程序图当 albedo + emission，交给 glow 与 SDFGI 做彩色溢出
static func rose_glass() -> StandardMaterial3D:
	var img := TexLab.rose_window(512)
	var t := tex(img)
	var m := StandardMaterial3D.new()
	m.albedo_texture = t
	m.emission_enabled = true
	m.emission = Color(1, 1, 1)
	m.emission_texture = t
	m.emission_energy_multiplier = 5.5
	m.roughness = 0.20
	m.metallic = 0.0
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.shadow_to_opacity = true
	m.vertex_color_use_as_albedo = false
	return m


# 丝绒：rim（掠射起亮）+ 高粗糙 + 无金属，近似织物的边缘光
static func velvet() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = TexLab.srgb_to_linear(Color(0.30, 0.05, 0.09))
	m.roughness = 0.90
	m.metallic = 0.0
	m.metallic_specular = 0.2
	m.rim_enabled = true
	m.rim = 0.70
	m.rim_tint = 0.55
	m.specular_mode = BaseMaterial3D.SPECULAR_TOON
	return m


# 抛光镜面：极低粗糙 + 全金属，用来检验反射链（SSR / SDFGI 粗糙反射 / 反射探针）的成色
static func mirror() -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = TexLab.srgb_to_linear(Color(0.88, 0.90, 0.94))
	m.metallic = 1.0
	m.metallic_specular = 1.0
	m.roughness = 0.035
	return m
