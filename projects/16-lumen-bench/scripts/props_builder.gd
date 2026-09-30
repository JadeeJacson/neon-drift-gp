# 陈设与氛围层：水面、天文仪、悬灯、蜡烛、碎石、水线污渍 decal、尘埃粒子
#
# 这一层负责「近景密度」与「体积感」：
#   水面＝自定义 spatial 着色器（解析波 + 屏幕扭曲折射 + 泡沫 + 太阳碎光）
#   天文仪＝旋转黄铜环 + 自发光核心，兼作画面焦点与二次光源
#   碎石 / 链条 / 栏杆＝MultiMesh 实例化；decal＝水线苔痕与湿渍
#   粒子＝光束里的浮尘与升腾火星（没有它，体积光束会显得太干净）
extends RefCounted

const Layout := preload("res://scripts/layout.gd")
const Geo := preload("res://scripts/geo_lab.gd")
const TexLab := preload("res://scripts/tex_lab.gd")
const Atmos := preload("res://scripts/atmos_lab.gd")


static func build(root: Node3D, mats: Dictionary, seed: int) -> Dictionary:
	var nodes := 0
	var tris := 0
	var P := Node3D.new()
	P.name = "Props"
	root.add_child(P)

	# ── 水面 ──────────────────────────────────────────────────────────
	var water_mesh: ArrayMesh = Geo.disc(Layout.R_IN - 0.06, 112, 0.0, 3)
	var water := MeshInstance3D.new()
	water.name = "Water"
	water.mesh = water_mesh
	water.material_override = make_water_mat()
	water.position = Vector3(0, Layout.WATER_Y, 0)
	P.add_child(water)
	nodes += 1
	tris += Geo.count_tris(water_mesh)

	# 回廊上的积水：同一种着色器但关掉泡沫，检验「掠射角湿面」
	var puddle_mat := make_water_mat()
	puddle_mat.set_shader_parameter("foam_gain", 0.08)
	puddle_mat.set_shader_parameter("alpha_base", 0.95)
	puddle_mat.set_shader_parameter("refract_strength", 0.012)
	for i in 5:
		var a := TAU * float(i) / 5.0 + 0.4
		var pm: ArrayMesh = Geo.disc(1.15 + 0.4 * float(i % 3), 40, 0.0, 1)
		var mi := MeshInstance3D.new()
		mi.name = "Puddle%d" % i
		mi.mesh = pm
		mi.material_override = puddle_mat
		mi.position = Vector3(cos(a) * (Layout.COL_R - 0.55), Layout.GALLERY_Y + 0.014, sin(a) * (Layout.COL_R - 0.55))
		P.add_child(mi)
		nodes += 1

	# ── 中央天文仪 ────────────────────────────────────────────────────
	var orrery := Node3D.new()
	orrery.name = "Orrery"
	orrery.position = Vector3(0, Layout.DAIS_Y, 0)
	P.add_child(orrery)
	nodes += 1
	var pedestal: ArrayMesh = Geo.revolve_mesh(PackedVector2Array([
		Vector2(1.30, 0.00), Vector2(1.32, 0.16), Vector2(1.06, 0.34), Vector2(0.82, 0.60),
		Vector2(0.72, 1.05), Vector2(0.92, 1.28), Vector2(1.16, 1.42), Vector2(1.18, 1.58),
	]), 48, 18, 1.0)
	tris += Geo.count_tris(pedestal)
	add_mesh(orrery, pedestal, mats["marble_dark"], Transform3D(Basis.IDENTITY, Vector3(0, 0, 0)), "OrreryPedestal")

	var ring_specs := [
		{"r": 2.30, "tube": 0.075, "tilt": Vector3(0.00, 0.00, 0.34), "speed": 0.10, "mat": "brass"},
		{"r": 1.72, "tube": 0.062, "tilt": Vector3(0.62, 0.20, 0.00), "speed": -0.17, "mat": "brass"},
		{"r": 1.20, "tube": 0.052, "tilt": Vector3(-0.34, 0.55, 0.18), "speed": 0.26, "mat": "iron"},
		{"r": 0.78, "tube": 0.044, "tilt": Vector3(1.15, -0.25, 0.42), "speed": -0.40, "mat": "brass"},
	]
	var rings: Array = []
	for i in ring_specs.size():
		var s: Dictionary = ring_specs[i]
		var rm: Mesh = Geo.torus(float(s["r"]), float(s["tube"]), 96, 12)
		tris += Geo.count_tris(rm)
		var node := Node3D.new()
		node.name = "Ring%d" % i
		node.position = Vector3(0, 2.62, 0)
		node.rotation = s["tilt"] as Vector3
		node.set_meta("speed", float(s["speed"]))
		orrery.add_child(node)
		add_mesh(node, rm, mats[s["mat"] as String], Transform3D(Basis.IDENTITY, Vector3.ZERO), "RingMesh%d" % i)
		var bead: Mesh = Geo.sphere(0.13, 16, 10)
		tris += Geo.count_tris(bead)
		var bn := MeshInstance3D.new()
		bn.name = "Bead%d" % i
		bn.mesh = bead
		bn.material_override = mats["brass"]
		bn.position = Vector3(float(s["r"]), 0, 0)
		node.add_child(bn)
		rings.append(node)
		nodes += 3

	var core: Mesh = Geo.sphere(0.52, 32, 20)
	tris += Geo.count_tris(core)
	var core_node := MeshInstance3D.new()
	core_node.name = "OrreryCore"
	core_node.mesh = core
	core_node.material_override = mats["filament"]
	core_node.position = Vector3(0, 2.62, 0)
	orrery.add_child(core_node)
	nodes += 1

	# ── 悬灯：链条（MultiMesh）+ 铁罩 + 灯芯 ──────────────────────────
	var lamp_angles := [1.05, 2.55, 4.15, 5.55]
	var chain_link: Mesh = Geo.torus(0.10, 0.028, 20, 8)
	tris += Geo.count_tris(chain_link) * 16 * lamp_angles.size()
	var lamp_shade: ArrayMesh = Geo.revolve_mesh(PackedVector2Array([
		Vector2(0.06, 0.42), Vector2(0.36, 0.40), Vector2(0.62, 0.22),
		Vector2(0.70, 0.02), Vector2(0.42, 0.00), Vector2(0.12, 0.08),
	]), 32, 12, 0.95)
	tris += Geo.count_tris(lamp_shade) * lamp_angles.size()
	var bulb: Mesh = Geo.sphere(0.20, 20, 12)
	for i in lamp_angles.size():
		var a: float = lamp_angles[i]
		var rr := 6.9
		var hang := Node3D.new()
		hang.name = "Lamp%d" % i
		hang.position = Vector3(cos(a) * rr, 0, sin(a) * rr)
		P.add_child(hang)
		nodes += 1
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		var n_links := 16
		mm.instance_count = n_links
		for k in n_links:
			var y := 9.40 - float(k) * 0.20
			var rot := PI * 0.5 if (k % 2) == 0 else 0.0
			mm.set_instance_transform(k, Transform3D(Basis.from_euler(Vector3(0, rot, 0)), Vector3(0, y, 0)))
		mm.mesh = chain_link
		var chain := MultiMeshInstance3D.new()
		chain.name = "Chain%d" % i
		chain.multimesh = mm
		chain.material_override = mats["iron"]
		hang.add_child(chain)
		nodes += 1
		add_mesh(hang, lamp_shade, mats["iron"], Transform3D(Basis.IDENTITY, Vector3(0, 5.95, 0)), "LampShade%d" % i)
		var bm := MeshInstance3D.new()
		bm.name = "LampBulb%d" % i
		bm.mesh = bulb
		bm.material_override = mats["flame"]
		bm.position = Vector3(0, 5.76, 0)
		hang.add_child(bm)
		nodes += 1

	# ── 蜡烛：18 支，柱顶与台地边各半 ────────────────────────────────
	var candle_body: Mesh = Geo.cylinder(0.075, 0.34, 12)
	var flame_mesh: Mesh = Geo.sphere(0.055, 12, 8)
	tris += (Geo.count_tris(candle_body) + Geo.count_tris(flame_mesh)) * 18
	var candles: Array = []
	for i in 18:
		var a2 := TAU * float(i) / 18.0 + 0.17
		var on_column := (i % 2) == 0
		var rr2 := 8.35 if on_column else 4.72
		var y2 := Layout.COL_PLINTH_H + Layout.COL_SHAFT_H + Layout.COL_CAP_H + 0.22 if on_column else Layout.DAIS_Y + 0.02
		var holder := Node3D.new()
		holder.name = "Candle%d" % i
		holder.position = Vector3(cos(a2) * rr2, y2, sin(a2) * rr2)
		P.add_child(holder)
		add_mesh(holder, candle_body, mats["marble"], Transform3D(Basis.IDENTITY, Vector3(0, 0.17, 0)), "Wax")
		var fm := MeshInstance3D.new()
		fm.name = "Flame"
		fm.mesh = flame_mesh
		fm.material_override = mats["flame"]
		fm.position = Vector3(0, 0.42, 0)
		holder.add_child(fm)
		candles.append({"node": holder, "phase": a2, "flame": fm})
		nodes += 3

	# ── 讲经台（倾覆状）+  velum 布 ──────────────────────────────────
	var lectern := Node3D.new()
	lectern.name = "Lectern"
	lectern.position = Vector3(5.6, Layout.WATER_Y + 0.02, -3.2)
	lectern.rotation = Vector3(0, -0.7, 0.12)
	P.add_child(lectern)
	var lbase: Mesh = Geo.box(Vector3(1.1, 1.5, 0.9))
	var ldesk: Mesh = Geo.box(Vector3(1.5, 0.12, 1.0))
	var lcloth: Mesh = Geo.box(Vector3(1.35, 0.06, 0.85))
	tris += Geo.count_tris(lbase) + Geo.count_tris(ldesk) + Geo.count_tris(lcloth)
	add_mesh(lectern, lbase, mats["oak"], Transform3D(Basis.IDENTITY, Vector3(0, 0.75, 0)), "LecternBase")
	add_mesh(lectern, ldesk, mats["oak"], Transform3D(Basis.from_euler(Vector3(-0.34, 0, 0)), Vector3(0, 1.62, 0.18)), "LecternDesk")
	add_mesh(lectern, lcloth, mats["velvet"], Transform3D(Basis.from_euler(Vector3(-0.34, 0, 0)), Vector3(0.02, 1.70, 0.20)), "LecternCloth")
	nodes += 4

	# ── 碎石：破口周围 + 回廊塌落带 ──────────────────────────────────
	var rub: ArrayMesh = Geo.rubble(seed + 400, 26, 0.5)
	var rub_count := 240
	tris += Geo.count_tris(rub) * rub_count
	scatter_multimesh(P, rub, mats["stone_dark"], seed + 11, [
		{"center": Vector3(cos(Layout.BREACH_CENTER) * 10.2, 0.20, sin(Layout.BREACH_CENTER) * 10.2), "spread": Vector3(7.0, 0.5, 7.0), "count": 150},
		{"center": Vector3(cos(2.9) * 7.2, Layout.GALLERY_Y + 0.12, sin(2.9) * 7.2), "spread": Vector3(4.5, 0.4, 4.5), "count": 90},
	])
	nodes += 1

	# ── 水线苔痕 decal：沿池壁一圈（decal 沿局部 -Y 投射，所以 +Y 朝墙外）─
	var grime := TexLab.grime_decal(256, seed + 66, TexLab.C_MOSS)
	var grime_tex := ImageTexture.create_from_image(grime["albedo"] as Image)
	var grime_norm := ImageTexture.create_from_image(grime["normal"] as Image)
	for i in 16:
		var a3 := TAU * float(i) / 16.0 + 0.11
		var outward := Vector3(cos(a3), 0, sin(a3))
		var chord := Vector3(-sin(a3), 0, cos(a3))
		var d := Decal.new()
		d.name = "WaterlineMoss%d" % i
		d.texture_albedo = grime_tex
		d.texture_normal = grime_norm
		d.size = Vector3(3.6, 1.7, 3.6)
		d.albedo_mix = 0.85
		d.normal_fade = 0.40
		d.upper_fade = 0.24
		d.lower_fade = 0.16
		d.transform = Transform3D(Basis(chord, outward, Vector3.UP), outward * (Layout.R_IN - 0.10) + Vector3(0, Layout.WATER_Y + 0.30, 0))
		P.add_child(d)
		nodes += 1

	# 破口里的湿渍：贴在石地上，检验 decal 与世界三向投影石材的叠加
	var wet := TexLab.grime_decal(256, seed + 88, Color(0.07, 0.08, 0.09))
	var wet_tex := ImageTexture.create_from_image(wet["albedo"] as Image)
	for i in 6:
		var a4 := Layout.BREACH_CENTER + (float(i) - 2.5) * 0.17
		var d2 := Decal.new()
		d2.name = "WetStain%d" % i
		d2.texture_albedo = wet_tex
		d2.size = Vector3(2.8, 0.6, 9.0)
		d2.albedo_mix = 0.72
		d2.upper_fade = 0.30
		d2.transform = Transform3D(Basis.from_euler(Vector3(0, -a4, 0)), Vector3(cos(a4) * 7.6, 0.03, sin(a4) * 7.6))
		P.add_child(d2)
		nodes += 1

	# ── 粒子 ──────────────────────────────────────────────────────────
	var dust1 := make_dust(P, mats, Layout.BREACH_CENTER, seed + 21, Vector3(9.2, 3.2, -1.6), Vector3(7.2, 4.0, 5.2), 2600)
	var dust2 := make_dust(P, mats, 0.52, seed + 22, Vector3(4.4, 5.2, 3.8), Vector3(7.8, 5.4, 5.8), 1800)
	var embers := make_embers(P, mats)
	nodes += 3

	return {
		"nodes": nodes,
		"tris": tris,
		"rings": rings,
		"candles": candles,
		"dust": [dust1, dust2],
		"embers": embers,
	}


# ── 水面材质 ──────────────────────────────────────────────────────────
static func make_water_mat() -> ShaderMaterial:
	var m := ShaderMaterial.new()
	# 无头环境不加载 shader（dummy 渲染器编译着色器只会报假错），参数照旧写进去
	if Atmos.can_render():
		var sh: Shader = load("res://shaders/water.gdshader")
		if sh == null:
			push_warning("water.gdshader 加载失败，水面将用默认材质")
		else:
			m.shader = sh
	m.set_shader_parameter("shore_radius", Layout.R_IN - 0.12)
	m.set_shader_parameter("shore_width", 1.05)
	m.set_shader_parameter("sun_dir", Layout.sun_direction())
	m.set_shader_parameter("sun_color", TexLab.srgb_to_linear(Color(1.0, 0.70, 0.40)))
	m.set_shader_parameter("wave_amp", 0.040)
	m.set_shader_parameter("glint_gain", 3.0)
	return m


# ── 粒子绘制材质：不写深度、相加混合、跟随粒子色的柔和 sprite ─────────
static func particle_mat(hot: bool) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
	m.vertex_color_use_as_albedo = true
	m.albedo_texture = ImageTexture.create_from_image(TexLab.dust_sprite(64))
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.billboard_keep_scale = true
	m.depth_draw_mode = BaseMaterial3D.DEPTH_DRAW_DISABLED
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.disable_receive_shadows = true
	var tint := Color(1.0, 0.80, 0.58, 0.30) if not hot else Color(1.0, 0.46, 0.16, 0.90)
	m.albedo_color = TexLab.srgb_to_linear(tint)
	return m


static func make_dust(parent: Node, _mats: Dictionary, ang: float, seed: int, center: Vector3, size: Vector3, amount: int) -> GPUParticles3D:
	var p := GPUParticles3D.new()
	p.name = "DustBeam%03d" % int(rad_to_deg(ang))
	p.amount = amount
	p.lifetime = 14.0
	p.preprocess = 14.0
	p.randomness = 0.6
	p.use_fixed_seed = true
	p.seed = seed
	p.local_coords = false
	p.visibility_aabb = AABB(center - size, size * 2.0)
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF

	var pm := ParticleProcessMaterial.new()
	pm.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	pm.emission_box_extents = size * 0.5
	pm.direction = Vector3(0, 1, 0)
	pm.spread = 78.0
	pm.initial_velocity_min = 0.02
	pm.initial_velocity_max = 0.14
	pm.gravity = Vector3(0, -0.006, 0)
	pm.damping_min = 0.12
	pm.damping_max = 0.40
	pm.turbulence_enabled = true
	pm.turbulence_noise_strength = 0.06
	pm.turbulence_noise_scale = 3.4
	pm.turbulence_influence_min = 0.05
	pm.turbulence_influence_max = 0.30
	pm.scale_min = 0.012
	pm.scale_max = 0.055

	pm.color = Color(1.0, 0.86, 0.68, 0.42)
	p.process_material = pm

	var quad := QuadMesh.new()
	quad.size = Vector2(1, 1)
	quad.material = particle_mat(false)
	p.draw_pass_1 = quad
	p.material_override = particle_mat(false)
	p.position = center
	parent.add_child(p)
	return p


static func make_embers(parent: Node, _mats: Dictionary) -> GPUParticles3D:
	var p := GPUParticles3D.new()
	p.name = "Embers"
	p.amount = 420
	p.lifetime = 6.0
	p.randomness = 0.9
	p.use_fixed_seed = true
	p.seed = 5501
	p.local_coords = false
	p.visibility_aabb = AABB(Vector3(-10, 0, -10), Vector3(20, 11, 20))
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var pm := ParticleProcessMaterial.new()
	pm.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE_SURFACE
	pm.emission_sphere_radius = 8.2
	pm.direction = Vector3(0, 1, 0)
	pm.spread = 26.0
	pm.initial_velocity_min = 0.12
	pm.initial_velocity_max = 0.50
	pm.gravity = Vector3(0, 0.05, 0)
	pm.damping_min = 0.0
	pm.damping_max = 0.2
	pm.scale_min = 0.010
	pm.scale_max = 0.030
	pm.color = Color(1.0, 0.52, 0.20, 0.95)
	p.process_material = pm
	var quad := QuadMesh.new()
	quad.size = Vector2(1, 1)
	quad.material = particle_mat(true)
	p.draw_pass_1 = quad
	p.material_override = particle_mat(true)
	p.position = Vector3(0, 1.2, 0)
	parent.add_child(p)
	return p


static func add_mesh(parent: Node, mesh: Mesh, mat: Material, xform: Transform3D, node_name: String) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.name = node_name
	mi.mesh = mesh
	if mat != null:
		mi.material_override = mat
	mi.transform = xform
	parent.add_child(mi)
	return mi


# 碎石散布：固定种子，保证每次截图位置一致（TA 比对需要可复现）
static func scatter_multimesh(parent: Node, mesh: ArrayMesh, mat: Material, seed: int, zones: Array) -> void:
	var noise := FastNoiseLite.new()
	noise.seed = seed
	noise.noise_type = FastNoiseLite.TYPE_VALUE_CUBIC
	var xforms: Array = []
	for z in zones:
		var zd: Dictionary = z
		var center: Vector3 = zd["center"] as Vector3
		var spread: Vector3 = zd["spread"] as Vector3
		var count: int = int(zd["count"])
		for i in count:
			var fx := noise.get_noise_2d(float(i) * 1.31, 3.7)
			var fy := noise.get_noise_2d(float(i) * 2.17, 8.1)
			var fz := noise.get_noise_2d(float(i) * 0.83, 5.3)
			var fr := noise.get_noise_2d(float(i) * 3.11, 1.9)
			var pos := center + Vector3(fx * spread.x, fy * spread.y, fz * spread.z)
			var rot := Vector3(fr * 2.0, fx * 6.0, fy * 3.0)
			var sc := 0.45 + 0.9 * (absf(fz) + 1.0) * 0.5
			xforms.append(Transform3D(Basis.from_euler(rot).scaled(Vector3(sc, sc * 0.7, sc)), pos))
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.instance_count = xforms.size()
	for i in xforms.size():
		mm.set_instance_transform(i, xforms[i] as Transform3D)
	mm.mesh = mesh
	var mi := MultiMeshInstance3D.new()
	mi.name = "Rubble"
	mi.multimesh = mm
	mi.material_override = mat
	parent.add_child(mi)
