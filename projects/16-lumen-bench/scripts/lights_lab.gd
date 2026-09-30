# 灯光装配：落日 + 玫瑰窗投影聚光 + 悬灯 + 蜡烛 + 冷色天光
#
# 灯光是这个测试场的「叙事主角」，配置思路：
#   1) 唯一的主光（低角度落日）负责方向性、长影与破口光束；
#   2) 玫瑰窗用 SpotLight3D + light_projector（gobo 投影）把彩色光斑投到地面，
#      这是引擎没有「阳光穿过有色介质」物理模型时的标准 TA 做法；
#   3) 暖色小灯（悬灯/蜡烛）只提供局部衰减与 glow，不参与结构照明；
#   4) 冷色补光模拟圆眼天光，与暖主光构成色温对比。
extends RefCounted

const Layout := preload("res://scripts/layout.gd")
const TexLab := preload("res://scripts/tex_lab.gd")


static func build(root: Node3D, mats: Dictionary, seed: int) -> Dictionary:
	var L := Node3D.new()
	L.name = "Lights"
	root.add_child(L)
	var out := {}

	# ── 落日：唯一主光，角度阴影 + 4 级联 ────────────────────────────
	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.light_energy = 2.4
	sun.light_color = TexLab.srgb_to_linear(Color(1.00, 0.66, 0.34))
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_max_distance = 240.0
	sun.directional_shadow_blend_splits = true
	sun.directional_shadow_fade_start = 0.10
	sun.light_angular_distance = 1.6 # 太阳视半径 → 半影软硬（真实太阳约 0.53°）
	sun.light_size = 0.35
	sun.light_volumetric_fog_energy = 3.2
	sun.light_indirect_energy = 1.0
	sun.sky_mode = DirectionalLight3D.SKY_MODE_LIGHT_AND_SKY
	sun.shadow_opacity = 0.82
	sun.shadow_normal_bias = 1.35
	sun.shadow_bias = 0.05
	L.add_child(sun)
	var sd := Layout.sun_direction()
	sun.position = sd * 120.0
	sun.look_at(Vector3.ZERO, Vector3.UP)
	out["sun"] = sun

	# ── 玫瑰窗：带 gobo 投影的聚光 ───────────────────────────────────
	var gobo := TexLab.rose_window(512)
	var gt := ImageTexture.create_from_image(gobo)
	gt.resource_name = "RoseGobo"
	var spot := SpotLight3D.new()
	spot.name = "RoseSpot"
	var rose_out := Vector3(cos(Layout.ROSE_CENTER), 0, sin(Layout.ROSE_CENTER))
	spot.position = rose_out * (Layout.R_IN + 1.35) + Vector3(0, Layout.ROSE_Y + 0.55, 0)
	spot.light_energy = 5.5
	spot.light_color = TexLab.srgb_to_linear(Color(1.0, 0.82, 0.66))
	spot.light_projector = gt
	spot.shadow_enabled = true # 投影图依赖阴影深度图，关掉就没有光斑
	spot.spot_angle = 30.0
	spot.spot_angle_attenuation = 1.35
	spot.spot_attenuation = 0.72
	spot.spot_range = 44.0
	spot.light_volumetric_fog_energy = 4.2
	spot.light_indirect_energy = 1.1
	L.add_child(spot)
	spot.look_at_from_position(spot.position, Vector3(-5.4, 0.20, -3.4), Vector3.UP)
	out["rose_spot"] = spot

	# ── 圆眼天光：自上而下的冷色聚光（把穹顶藻井雕出立体感）──────────
	var oc := SpotLight3D.new()
	oc.name = "OculusCool"
	oc.position = Vector3(0, Layout.WALL_H + Layout.DOME_RISE - 0.6, 0)
	oc.light_energy = 3.6
	oc.light_color = TexLab.srgb_to_linear(Color(0.62, 0.74, 1.00))
	oc.shadow_enabled = false
	oc.spot_angle = 68.0
	oc.spot_range = 30.0
	oc.spot_attenuation = 0.75
	oc.light_volumetric_fog_energy = 2.2
	oc.light_indirect_energy = 1.4
	L.add_child(oc)
	# 近于竖直的 look_at 会与 UP 共线（引擎报 colinear、定向失败），直接给旋转角
	oc.rotation_degrees = Vector3(-86.0, 0.0, 12.0)
	out["oculus_spot"] = oc

	# ── 穹顶洗墙光：圆眼天光照不到穹顶内壁（从圆眼往下打的聚光只能照地面），
	#    所以在穹顶内侧放一盏冷色点光源，把共肋藻井的体积感雕出来。
	#    先试聚光失败（cone 覆盖不到 45° 偏轴的穹顶），改 Omni 更可控。
	var wash := OmniLight3D.new()
	wash.name = "DomeWash"
	wash.position = Vector3(0, 15.5, 0)
	wash.light_energy = 4.2
	wash.light_color = TexLab.srgb_to_linear(Color(0.55, 0.68, 0.98))
	wash.shadow_enabled = false
	# 射程必须算过：灯在 (0,15.5,0)，穹顶肋脚在 (12,12,0)，距离≈12.5 m；
	# 上一版 range=11 直接短了一截，整顶穹因此是黑的（实测拿法线数据排除过「法线朝外」）
	wash.omni_range = 22.0
	wash.omni_attenuation = 0.85
	wash.light_size = 1.2
	wash.light_volumetric_fog_energy = 0.5
	wash.light_indirect_energy = 1.6
	L.add_child(wash)
	out["dome_wash"] = wash

	# ── 高侧窗：三束很弱的天光形状光，只给体积感不做照明 ──────────────
	var cl: Array = []
	for i in Layout.CLERESTORY.size():
		var a: float = Layout.CLERESTORY[i]
		var s := SpotLight3D.new()
		s.name = "Clerestory%d" % i
		var outward := Vector3(cos(a), 0, sin(a))
		s.position = outward * (Layout.R_IN - 0.4) + Vector3(0, 10.4, 0)
		s.light_energy = 2.1
		s.light_color = TexLab.srgb_to_linear(Color(0.78, 0.82, 0.96))
		s.shadow_enabled = false
		s.spot_angle = 26.0
		s.spot_range = 18.0
		s.spot_attenuation = 1.05
		s.light_volumetric_fog_energy = 4.5
		L.add_child(s)
		s.look_at_from_position(s.position, outward * 4.0 + Vector3(0, 0.4, 0), Vector3.UP)
		cl.append(s)
	out["clerestory"] = cl

	# ── 悬灯：4 盏，其中靠镜面的 2 盏开阴影（阴影配额有限，要挑着用）──
	var omnis: Array = []
	var lamp_angles := [1.05, 2.55, 4.15, 5.55]
	for i in lamp_angles.size():
		var a2: float = lamp_angles[i]
		var o := OmniLight3D.new()
		o.name = "LampLight%d" % i
		var rr := 6.9
		o.position = Vector3(cos(a2) * rr, 5.62, sin(a2) * rr)
		o.light_energy = 1.15
		o.light_color = TexLab.srgb_to_linear(Color(1.0, 0.70, 0.40))
		o.omni_range = 9.5
		o.omni_attenuation = 1.42
		o.light_size = 0.35
		o.light_volumetric_fog_energy = 1.8
		o.shadow_enabled = i == 0 or i == 2
		o.omni_shadow_mode = OmniLight3D.SHADOW_CUBE
		o.shadow_opacity = 0.72
		o.light_indirect_energy = 1.25
		L.add_child(o)
		omnis.append(o)
	out["lamps"] = omnis

	# ── 蜡烛：8 支带光，能量做闪烁（闪烁曲线在根脚本按物理帧驱动）────
	var candles: Array = []
	for i in 8:
		var a3 := TAU * float(i) / 8.0 + 0.33
		var on_col := (i % 2) == 0
		var rr3 := 8.35 if on_col else 4.72
		var y3 := Layout.COL_PLINTH_H + Layout.COL_SHAFT_H + Layout.COL_CAP_H + 0.62 if on_col else Layout.DAIS_Y + 0.45
		var c := OmniLight3D.new()
		c.name = "CandleLight%d" % i
		c.position = Vector3(cos(a3) * rr3, y3, sin(a3) * rr3)
		c.light_energy = 0.55
		c.light_color = TexLab.srgb_to_linear(Color(1.0, 0.58, 0.24))
		c.omni_range = 3.6
		c.omni_attenuation = 1.75
		c.light_size = 0.10
		c.shadow_enabled = false
		c.light_volumetric_fog_energy = 2.4
		c.light_indirect_energy = 1.0
		c.set_meta("phase", a3)
		L.add_child(c)
		candles.append(c)
	out["candles"] = candles

	# ── 天文仪核心光：自发光核心真的向外打光，给黄铜环与台面提供焦点照明──
	var fill := OmniLight3D.new()
	fill.name = "CenterFill"
	fill.position = Vector3(0, 3.5, 0)
	fill.light_energy = 2.6
	fill.light_color = TexLab.srgb_to_linear(Color(1.0, 0.78, 0.52))
	fill.omni_range = 13.0
	fill.omni_attenuation = 1.15
	fill.shadow_enabled = false
	fill.light_volumetric_fog_energy = 1.2
	fill.light_indirect_energy = 1.4
	L.add_child(fill)
	out["fill"] = fill

	return out


# 预设降级：关掉一部分灯/阴影，用来量化「灯光数量与阴影配额」的代价
static func apply_preset(lights: Dictionary, preset: String) -> void:
	var sun: DirectionalLight3D = lights["sun"] as DirectionalLight3D
	var spot: SpotLight3D = lights["rose_spot"] as SpotLight3D
	var fill: OmniLight3D = lights["fill"] as OmniLight3D
	match preset:
		"direct":
			# 对照档：只留太阳与玫瑰窗（体积雾关了，光束自然没有），其余灯全部关闭
			for o in (lights["lamps"] as Array):
				(o as OmniLight3D).visible = false
			for c in (lights["candles"] as Array):
				(c as OmniLight3D).visible = false
			for s in (lights["clerestory"] as Array):
				(s as SpotLight3D).visible = false
			(lights["oculus_spot"] as SpotLight3D).visible = false
			if fill != null:
				fill.visible = false
			spot.visible = true
		"base":
			sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
			spot.shadow_enabled = true
			for o in (lights["lamps"] as Array):
				(o as OmniLight3D).visible = true
				(o as OmniLight3D).shadow_enabled = false
			for c in (lights["candles"] as Array):
				(c as OmniLight3D).visible = true
		_:
			sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
			spot.shadow_enabled = true
			for o in (lights["lamps"] as Array):
				var ol := o as OmniLight3D
				ol.visible = true
				ol.shadow_enabled = false
			# 阴影配额只给最靠近镜面与光束的一盏，其余靠 SDFGI 补
			var first_lamp := (lights["lamps"] as Array)[0] as OmniLight3D
			if first_lamp != null:
				first_lamp.shadow_enabled = true
			for c in (lights["candles"] as Array):
				(c as OmniLight3D).visible = true
