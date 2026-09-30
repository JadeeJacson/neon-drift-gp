class_name Arena
extends RefCounted
## 场景搭建器 —— 全部几何用基础网格在运行期拼装（零素材铁律）。
##
## 空间剧本（单位米，y 向上）：
##   · 中庭 24×20×12：南/东/西三面环墙，北墙开门洞接走廊
##   · 夹层 y=5.2 环三面（宽 2.5），中庭中央挑空
##   · 天窗 11×9 开在屋顶 y=12，格栅梁切出光柱条纹
##   · 北走廊 6×6×34 通到发光门 → 纵深消失点
## 细节分三层：结构层（墙/柱/梁）→ 装配层（管线/风管/桥架/栏杆）
##              → 使用层（机架/箱桶/灯具/标识/积水/尘埃）。


static func build(root: Node3D) -> void:
	var shell := _grp(root, "01_Shell")
	_build_floor(shell)
	_build_walls(shell)
	_build_roof(shell)
	_build_pilasters(shell)

	var mezz := _grp(root, "02_Mezzanine")
	_build_mezz_slabs(mezz)
	_build_railings(mezz)
	_build_stairs(mezz)

	var sky := _grp(root, "03_Skylight")
	_build_skylight(sky)

	var corr := _grp(root, "04_Corridor")
	_build_corridor(corr)

	var props := _grp(root, "05_Props")
	_build_pipes(props)
	_build_racks(props)
	_build_crates(props)
	_build_lamps(props)
	_build_signs(props)
	_build_dust(props)

	var lights := _grp(root, "09_Lights")
	_build_lights(lights)


# ════════════════════════════ 地面 ════════════════════════════

static func _build_floor(p: Node3D) -> void:
	# 承台（混凝土地坪）：顶面 y=-0.02，比砖面低 2cm → 砖区读作「镶嵌」
	_box(p, 25.4, 0.3, 21.4, Vector3(0, -0.17, 0), MatLib.concrete(Color(0.82, 0.8, 0.78), 0.4))
	# 中央抛光砖区 14.5×12.5，顶面 y=0
	_box(p, 14.5, 0.3, 12.5, Vector3(0, -0.15, 0), MatLib.polished_tile())
	# 走廊地坪（与砖区同高，z=-10 往北）
	_box(p, 6.8, 0.3, 34.4, Vector3(0, -0.15, -27.7), MatLib.concrete(Color(0.7, 0.69, 0.68), 0.45))
	# 积水：三片近镜面水洼（吃 SSR 反射霓虹与天窗）
	_puddle(p, Vector3(3.1, 0.012, -2.2), 1.7)
	_puddle(p, Vector3(-4.2, 0.012, 3.4), 1.2)
	_puddle(p, Vector3(1.2, 0.012, 5.6), 0.9)


static func _puddle(p: Node3D, pos: Vector3, radius: float) -> void:
	# 两片叠出的扁圆柱模拟不规则水洼边缘
	var m := MatLib.puddle()
	var a := _cyl(p, radius, radius * 0.92, 0.02, pos, m, 20)
	a.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var b := _cyl(p, radius * 0.7, radius * 0.6, 0.02,
		pos + Vector3(radius * 0.45, 0.001, -radius * 0.3), m, 20)
	b.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


# ════════════════════════════ 墙体 ════════════════════════════

static func _build_walls(p: Node3D) -> void:
	var wall := MatLib.concrete(Color(0.9, 0.88, 0.85), 0.3)
	var wall_dark := MatLib.concrete(Color(0.6, 0.6, 0.62), 0.35)
	# 西墙 / 东墙（内表面落在 x=∓12）
	_box(p, 0.4, 12.4, 21.4, Vector3(-12.2, 6.2, 0), wall)
	_box(p, 0.4, 12.4, 21.4, Vector3(12.2, 6.2, 0), wall)
	# 南墙（内表面 z=+10）
	_box(p, 25.4, 12.4, 0.4, Vector3(0, 6.2, 10.2), wall)
	# 北墙：留 6×6 门洞接走廊，上方过梁
	_box(p, 9.2, 12.4, 0.4, Vector3(-7.9, 6.2, -10.2), wall_dark)
	_box(p, 9.2, 12.4, 0.4, Vector3(7.9, 6.2, -10.2), wall_dark)
	_box(p, 6.4, 6.4, 0.4, Vector3(0, 9.2, -10.2), wall_dark)   # 过梁 y6~12.4

	# 墙面竖向装饰肋（结构节奏）
	for x in [-8.0, -4.0, 4.0, 8.0]:
		_box(p, 0.35, 12.0, 0.5, Vector3(x, 6.0, 9.9), wall_dark)
	# 东西墙肋
	for z in [-7.5, -2.5, 2.5, 7.5]:
		_box(p, 0.5, 12.0, 0.35, Vector3(-11.9, 6.0, z), wall_dark)
		_box(p, 0.5, 12.0, 0.35, Vector3(11.9, 6.0, z), wall_dark)

	# 门组（东墙 ×2、南墙 ×1）：门框 + 门板 + 上方发光标
	_door(p, Vector3(11.85, 0, 5.0), Vector3(0, 0, -90))
	_door(p, Vector3(11.85, 0, -5.5), Vector3(0, 0, -90))
	_door(p, Vector3(-6.5, 0, 9.85), Vector3.ZERO)

	# 踢脚霓虹缝（青）：中庭三面墙根
	var neon := MatLib.emissive(Color(0.18, 0.88, 1.0), 5.5)
	var n1 := _box(p, 0.05, 0.07, 20.6, Vector3(-11.96, 0.1, 0), neon)
	n1.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var n2 := _box(p, 0.05, 0.07, 20.6, Vector3(11.96, 0.1, 0), neon)
	n2.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var n3 := _box(p, 24.6, 0.07, 0.05, Vector3(0, 0.1, 9.96), neon)
	n3.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	# 走廊两侧踢脚霓虹（青，延伸消失点）
	var n4 := _box(p, 0.05, 0.07, 33.6, Vector3(-2.96, 0.1, -27.5), neon)
	n4.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var n5 := _box(p, 0.05, 0.07, 33.6, Vector3(2.96, 0.1, -27.5), neon)
	n5.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	# 门洞两侧琥珀竖条（冷暖对撞的第二主角）
	var amber := MatLib.emissive(Color(1.0, 0.55, 0.16), 4.5)
	for x in [-3.6, 3.6]:
		var a := _box(p, 0.09, 5.6, 0.06, Vector3(x, 3.2, -9.96), amber)
		a.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


static func _door(p: Node3D, origin: Vector3, rot: Vector3) -> void:
	# origin 贴墙面；rot 绕 y 转 90° 时门面朝 x
	var frame := MatLib.painted(Color(0.24, 0.26, 0.28), 2.0)
	var leaf := MatLib.tech_panel(2.0)
	var g := _grp(p, "Door")
	g.position = origin
	g.rotation_degrees = rot
	_box(g, 1.6, 2.35, 0.12, Vector3(0, 1.18, 0), frame)
	_box(g, 1.34, 2.1, 0.14, Vector3(0, 1.06, 0), leaf)
	var sign := _box(g, 0.5, 0.14, 0.06, Vector3(0, 2.55, 0.03),
		MatLib.emissive(Color(1.0, 0.62, 0.2), 3.5))
	sign.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


static func _build_pilasters(p: Node3D) -> void:
	# 中庭四周落地壁柱（承重节奏，也给 AO 提供凹缝）
	var m := MatLib.concrete(Color(0.72, 0.7, 0.68), 0.5)
	for z in [-8.0, -4.0, 0.0, 4.0, 8.0]:
		_box(p, 0.45, 12.2, 0.45, Vector3(-11.85, 6.1, z), m)
		_box(p, 0.45, 12.2, 0.45, Vector3(11.85, 6.1, z), m)
	for x in [-9.0, -5.0, 5.0, 9.0]:
		_box(p, 0.45, 12.2, 0.45, Vector3(x, 6.1, 9.85), m)


# ════════════════════════════ 屋顶 ════════════════════════════

static func _build_roof(p: Node3D) -> void:
	# 屋面板 y12~12.5，中央留 11×9 天窗洞
	var roof := MatLib.concrete(Color(0.66, 0.65, 0.64), 0.3)
	_box(p, 25.4, 0.5, 6.0, Vector3(0, 12.25, 7.7), roof)     # 南片 z4.7~10.7
	_box(p, 25.4, 0.5, 6.4, Vector3(0, 12.25, -7.5), roof)    # 北片 z-10.7~-4.3
	_box(p, 7.2, 0.5, 9.0, Vector3(-9.1, 12.25, 0.2), roof)   # 西片
	_box(p, 7.2, 0.5, 9.0, Vector3(9.1, 12.25, 0.2), roof)    # 东片


# ════════════════════════ 夹层 ════════════════════════

static func _build_mezz_slabs(p: Node3D) -> void:
	var slab := MatLib.concrete(Color(0.75, 0.74, 0.72), 0.45)
	# 三面走道板 y5.2~5.6
	_box(p, 2.5, 0.4, 21.4, Vector3(-10.75, 5.4, 0), slab)    # 西
	_box(p, 2.5, 0.4, 21.4, Vector3(10.75, 5.4, 0), slab)     # 东
	_box(p, 19.0, 0.4, 2.6, Vector3(0, 5.4, 9.1), slab)       # 南
	# 板底挑檐（让仰视时有厚度感）
	var trim := MatLib.painted(Color(0.3, 0.32, 0.35), 2.5)
	_box(p, 2.5, 0.1, 21.4, Vector3(-10.75, 5.15, 0), trim)
	_box(p, 2.5, 0.1, 21.4, Vector3(10.75, 5.15, 0), trim)
	_box(p, 19.0, 0.1, 2.6, Vector3(0, 5.15, 9.1), trim)
	# 落地支柱（夹层内缘）
	var col := MatLib.concrete(Color(0.62, 0.61, 0.6), 0.8)
	for z in [-8.0, -4.0, 0.0, 4.0, 8.0]:
		_box(p, 0.32, 5.2, 0.32, Vector3(-9.68, 2.6, z), col)
		_box(p, 0.32, 5.2, 0.32, Vector3(9.68, 2.6, z), col)
	for x in [-7.0, -3.5, 0.0, 3.5, 7.0]:
		_box(p, 0.32, 5.2, 0.32, Vector3(x, 2.6, 7.9), col)


static func _build_railings(p: Node3D) -> void:
	# 栏杆立柱用 MultiMesh：~120 根 1 次 draw call
	var steel := MatLib.brushed_metal(Color(0.55, 0.57, 0.6), 3.0)
	var post_mesh := CylinderMesh.new()
	post_mesh.top_radius = 0.025
	post_mesh.bottom_radius = 0.025
	post_mesh.height = 1.1
	post_mesh.radial_segments = 8
	post_mesh.material = steel

	var positions: Array[Vector3] = []
	var z := -10.4
	while z <= 10.4:
		positions.append(Vector3(-9.45, 6.15, z))
		positions.append(Vector3(9.45, 6.15, z))
		z += 0.55
	var x := -9.4
	while x <= 9.4:
		positions.append(Vector3(x, 6.15, 7.95))
		x += 0.55

	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = post_mesh
	mm.instance_count = positions.size()
	for i in positions.size():
		mm.set_instance_transform(i, Transform3D(Basis.IDENTITY, positions[i]))
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	p.add_child(mmi)

	# 上下横杆
	var rail_top := MatLib.brushed_metal(Color(0.62, 0.64, 0.66), 1.0)
	_box(p, 0.07, 0.06, 21.0, Vector3(-9.45, 6.72, 0), rail_top)
	_box(p, 0.07, 0.06, 21.0, Vector3(9.45, 6.72, 0), rail_top)
	_box(p, 19.0, 0.06, 0.07, Vector3(0, 6.72, 7.95), rail_top)
	_box(p, 0.05, 0.04, 21.0, Vector3(-9.45, 6.25, 0), rail_top)
	_box(p, 0.05, 0.04, 21.0, Vector3(9.45, 6.25, 0), rail_top)
	_box(p, 19.0, 0.04, 0.05, Vector3(0, 6.25, 7.95), rail_top)
	# 夹层内缘青色霓虹（勾边，SDFGI 弹光的主光源之一）
	var neon := MatLib.emissive(Color(0.18, 0.88, 1.0), 4.5)
	var e1 := _box(p, 0.06, 0.05, 21.2, Vector3(-9.5, 5.62, 0), neon)
	e1.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var e2 := _box(p, 0.06, 0.05, 21.2, Vector3(9.5, 5.62, 0), neon)
	e2.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var e3 := _box(p, 19.0, 0.05, 0.06, Vector3(0, 5.62, 7.9), neon)
	e3.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


static func _build_stairs(p: Node3D) -> void:
	# 悬浮踏步（28 级 × 0.2m）：西墙内侧由南向北爬升到夹层
	var step_m := MatLib.concrete(Color(0.8, 0.79, 0.77), 1.6)
	var steel := MatLib.brushed_metal(Color(0.5, 0.52, 0.55), 2.0)
	var steps := _grp(p, "Steps")
	for i in 28:
		var top := 0.2 * (i + 1)
		var zz := 6.9 - 0.3 * i
		var b := _box(steps, 2.2, 0.13, 0.34, Vector3(-8.4, top - 0.065, zz), step_m)
		b.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	# 斜梁 ×2
	for x in [-9.3, -7.5]:
		var beam := _box(p, 0.14, 0.3, 10.1, Vector3(x, 2.75, 2.85), steel)
		beam.rotation_degrees = Vector3(33.7, 0, 0)
	# 扶手（沿坡）+ 立柱
	var hr := _box(p, 0.06, 0.06, 10.3, Vector3(-7.35, 3.75, 2.85), steel)
	hr.rotation_degrees = Vector3(33.7, 0, 0)
	for i in 6:
		var zz := 6.6 - 1.55 * i
		var yy := 0.2 * ((6.9 - zz) / 0.3) * 0.985 + 0.55
		_box(p, 0.05, 0.9, 0.05, Vector3(-7.35, yy, zz), steel)


# ════════════════════════ 天窗 ════════════════════════

static func _build_skylight(p: Node3D) -> void:
	var beam := MatLib.painted(Color(0.2, 0.22, 0.24), 2.0, 0.9)
	# 纵向格栅（南北向）×10：把阳光切成条纹光柱
	for i in 10:
		var x := -4.95 + 1.1 * i
		_box(p, 0.24, 0.42, 9.2, Vector3(x, 12.1, 0.2), beam)
	# 横向主梁 ×6
	for j in 6:
		var z := -3.75 + 1.5 * j
		_box(p, 11.4, 0.3, 0.24, Vector3(0, 12.48, z), beam)
	# 洞口翻边（女儿墙）
	var curb := MatLib.concrete(Color(0.7, 0.69, 0.68), 0.6)
	_box(p, 11.6, 0.5, 0.3, Vector3(0, 12.7, -4.55), curb)
	_box(p, 11.6, 0.5, 0.3, Vector3(0, 12.7, 4.95), curb)
	_box(p, 0.3, 0.5, 9.8, Vector3(-5.75, 12.7, 0.2), curb)
	_box(p, 0.3, 0.5, 9.8, Vector3(5.75, 12.7, 0.2), curb)


# ════════════════════════ 走廊 ════════════════════════

static func _build_corridor(p: Node3D) -> void:
	var wall := MatLib.concrete(Color(0.7, 0.69, 0.68), 0.4)
	var ceil := MatLib.concrete(Color(0.5, 0.5, 0.52), 0.5)
	# 侧墙 / 顶 / 端墙
	_box(p, 0.4, 6.4, 34.4, Vector3(-3.2, 3.2, -27.7), wall)
	_box(p, 0.4, 6.4, 34.4, Vector3(3.2, 3.2, -27.7), wall)
	_box(p, 6.8, 0.4, 34.4, Vector3(0, 6.2, -27.7), ceil)
	_box(p, 6.8, 6.4, 0.4, Vector3(0, 3.2, -44.9), wall)
	# 壁柱（每 4m，透视节奏）
	var pil := MatLib.concrete(Color(0.6, 0.59, 0.58), 0.7)
	for i in 8:
		var z := -13.0 - 4.0 * i
		_box(p, 0.32, 6.0, 0.7, Vector3(-2.86, 3.0, z), pil)
		_box(p, 0.32, 6.0, 0.7, Vector3(2.86, 3.0, z), pil)
	# 顶部灯带 ×7（emissive → SDFGI 把走廊照亮）—— 分列风管两侧，避免被风管挡住出光
	var strip := MatLib.emissive(Color(1.0, 0.86, 0.62), 5.0)
	for i in 7:
		var z := -13.5 - 4.0 * i
		for x in [-1.5, 1.5]:
			var s := _box(p, 0.34, 0.07, 2.4, Vector3(x, 5.94, z), strip)
			s.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	# 电缆桥架（两侧顶角）
	var tray := MatLib.brushed_metal(Color(0.45, 0.46, 0.48), 1.5)
	_box(p, 0.34, 0.07, 33.5, Vector3(-2.5, 5.62, -27.6), tray)
	_box(p, 0.34, 0.07, 33.5, Vector3(2.5, 5.62, -27.6), tray)
	# 尽头发光门（消失点焦点）
	var door := _box(p, 2.4, 3.6, 0.1, Vector3(0, 1.8, -44.65),
		MatLib.emissive(Color(0.5, 0.9, 1.0), 2.6))
	door.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var frame := MatLib.painted(Color(0.16, 0.17, 0.19), 2.0)
	_box(p, 3.0, 0.22, 0.18, Vector3(0, 3.7, -44.6), frame)
	_box(p, 0.22, 3.9, 0.18, Vector3(-1.4, 1.9, -44.6), frame)
	_box(p, 0.22, 3.9, 0.18, Vector3(1.4, 1.9, -44.6), frame)


# ════════════════════════ 装配层：管线风管 ════════════════════════

static func _build_pipes(p: Node3D) -> void:
	var pipe := MatLib.brushed_metal(Color(0.55, 0.53, 0.5), 0.8)
	var pipe_hot := MatLib.painted(Color(0.7, 0.3, 0.14), 2.0)
	var duct := MatLib.brushed_metal(Color(0.68, 0.69, 0.7), 1.2)

	# 沿西墙的高位工艺管线（y≈8.5 / 9.1），横贯中庭
	for entry in [[8.5, 0.14, 20.0, pipe], [9.1, 0.09, 20.0, pipe_hot], [8.8, 0.07, 20.0, pipe]]:
		var y := float(entry[0])
		var r := float(entry[1])
		var len := float(entry[2])
		var m := entry[3] as Material
		var c := _cyl(p, r, r, len, Vector3(-11.6, y, 0), m, 14)
		c.rotation_degrees = Vector3(90, 0, 0)      # y 轴圆柱转成沿 z
		var c2 := _cyl(p, r, r, len, Vector3(11.6, y, 0), m, 14)
		c2.rotation_degrees = Vector3(90, 0, 0)
	# 立管（东墙两根落到地面 + 管箍）
	for z in [-6.0, 6.0]:
		_cyl(p, 0.11, 0.11, 8.6, Vector3(11.55, 4.3, z), pipe, 14)
		for y in [1.2, 4.0, 7.0]:
			_cyl(p, 0.16, 0.16, 0.1, Vector3(11.55, y, z), pipe_hot, 14)
	# 吊顶风管（东西向两条 + 法兰）
	for z in [-5.5, 5.5]:
		_box(p, 20.0, 0.5, 0.45, Vector3(0, 11.3, z), duct)
		for x in [-7.0, -2.5, 2.5, 7.0]:
			_box(p, 0.1, 0.56, 0.51, Vector3(x, 11.3, z), pipe_hot)
	# 走廊顶部风管（沿轴线，强化消失点）
	_box(p, 0.6, 0.55, 32.0, Vector3(0, 5.55, -27.5), duct)
	for i in 7:
		var z := -13.0 - 4.0 * i
		_box(p, 0.66, 0.6, 0.1, Vector3(0, 5.55, z), pipe_hot)


# ════════════════════════ 使用层：机架 / 箱桶 ════════════════════════

static func _build_racks(p: Node3D) -> void:
	# 服务器机架 ×4：tech_panel 前脸 + LED 条（emissive → bloom 微光点）
	for i in 4:
		var z := 7.0 - 4.6 * i
		var g := _grp(p, "Rack%d" % i)
		g.position = Vector3(11.35, 0, z)
		g.rotation_degrees = Vector3(0, -90, 0)
		_box(g, 0.85, 2.1, 0.7, Vector3(0, 1.05, 0), MatLib.tech_panel(2.2))
		_box(g, 0.9, 0.1, 0.75, Vector3(0, 2.16, 0), MatLib.painted(Color(0.2, 0.21, 0.23), 3.0))
		var led_c := _box(g, 0.5, 0.035, 0.03, Vector3(-0.1, 1.86, 0.37),
			MatLib.emissive(Color(0.2, 1.0, 0.45), 10.0))
		led_c.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var led_a := _box(g, 0.3, 0.035, 0.03, Vector3(0.15, 1.74, 0.37),
			MatLib.emissive(Color(1.0, 0.3, 0.2), 10.0))
		led_a.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var led_b := _box(g, 0.45, 0.03, 0.03, Vector3(-0.05, 1.62, 0.37),
			MatLib.emissive(Color(0.25, 0.7, 1.0), 10.0))
		led_b.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	# 电控柜 ×2（走廊入口旁）
	for pos in [Vector3(-11.4, 0, -8.6), Vector3(-11.4, 0, -5.2)]:
		var c := _grp(p, "Cabinet")
		c.position = pos
		_box(c, 0.55, 1.9, 1.3, Vector3(0, 0.95, 0), MatLib.painted(Color(0.5, 0.53, 0.55), 2.0))
		_box(c, 0.58, 1.5, 1.0, Vector3(0.02, 1.0, 0), MatLib.tech_panel(2.0))
		var lamp := _box(c, 0.05, 0.08, 0.08, Vector3(0.3, 1.75, 0.4),
			MatLib.emissive(Color(1.0, 0.75, 0.2), 6.0))
		lamp.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF


static func _build_crates(p: Node3D) -> void:
	# 板条箱堆（西南角）+ 托盘桶（走廊口）
	var c_olive := MatLib.painted(Color(0.5, 0.52, 0.38), 2.2)
	var c_rust := MatLib.painted(Color(0.62, 0.4, 0.2), 2.2)
	var c_gray := MatLib.painted(Color(0.42, 0.44, 0.46), 2.2)
	var spots := [
		[Vector3(-8.6, 0.55, 7.2), 1.1, c_olive, 12.0],
		[Vector3(-8.5, 1.62, 7.3), 0.9, c_gray, -8.0],
		[Vector3(-7.2, 0.5, 7.6), 1.0, c_rust, 25.0],
		[Vector3(-8.9, 0.5, 5.4), 1.0, c_gray, 4.0],
		[Vector3(8.4, 0.55, -8.6), 1.1, c_rust, -15.0],
		[Vector3(8.5, 1.6, -8.5), 0.9, c_olive, 30.0],
		[Vector3(5.6, 0.45, -8.8), 0.9, c_gray, 7.0],
	]
	for s in spots:
		var pos: Vector3 = s[0]
		var size := float(s[1])
		var m: Material = s[2]
		var yaw := float(s[3])
		var g := _grp(p, "Crate")
		g.position = pos
		g.rotation_degrees = Vector3(0, yaw, 0)
		_box(g, size, size, size, Vector3.ZERO, m)
		# 边框（深色压边，读得出「箱」而不是方块）
		var edge := MatLib.painted(Color(0.2, 0.2, 0.2), 3.0)
		_box(g, size * 1.02, 0.08, size * 1.02, Vector3(0, size * 0.5 - 0.05, 0), edge)
		_box(g, size * 1.02, 0.08, size * 1.02, Vector3(0, -size * 0.5 + 0.05, 0), edge)
	# 化工桶 ×3
	for entry in [[Vector3(-10.4, 0.45, -7.8), Color(0.75, 0.5, 0.12)],
			[Vector3(-9.6, 0.45, -8.6), Color(0.3, 0.45, 0.6)],
			[Vector3(10.3, 0.45, 8.9), Color(0.55, 0.2, 0.18)]]:
		var pos: Vector3 = entry[0]
		var col: Color = entry[1]
		var b := _cyl(p, 0.36, 0.36, 0.9, pos, MatLib.painted(col, 2.5), 18)
		b.rotation_degrees = Vector3(0, 0, 0)
		_cyl(p, 0.37, 0.37, 0.06, pos + Vector3(0, 0.22, 0), MatLib.brushed_metal(Color(0.5, 0.5, 0.5), 3.0), 18)
		_cyl(p, 0.37, 0.37, 0.06, pos + Vector3(0, -0.22, 0), MatLib.brushed_metal(Color(0.5, 0.5, 0.5), 3.0), 18)
	# 工作台（东墙下）
	var t := _grp(p, "Table")
	t.position = Vector3(10.6, 0, 1.5)
	_box(t, 2.2, 0.09, 1.0, Vector3(0, 0.92, 0), MatLib.brushed_metal(Color(0.6, 0.61, 0.62), 1.5))
	for dx in [-0.95, 0.95]:
		for dz in [-0.4, 0.4]:
			_box(t, 0.07, 0.9, 0.07, Vector3(dx, 0.45, dz), MatLib.painted(Color(0.25, 0.26, 0.28), 3.0))
	_box(t, 0.5, 0.24, 0.36, Vector3(-0.5, 1.08, 0.1), MatLib.painted(Color(0.7, 0.6, 0.2), 2.0))


# ════════════════════════ 灯具 ════════════════════════

static func _build_lamps(p: Node3D) -> void:
	# 吊灯 ×3：吊杆 + 灯罩 + 发光体 + OmniLight（中庭主暖光）
	var cable := MatLib.painted(Color(0.1, 0.1, 0.1), 4.0)
	var shade := MatLib.painted(Color(0.18, 0.19, 0.2), 2.5)
	var lens_mat := MatLib.glow_lens(Color(1.0, 0.72, 0.38), 9.0)
	var drops := [
		Vector3(-4.5, 0, 2.5),
		Vector3(3.5, 0, -1.5),
		Vector3(0.5, 0, 6.0),
	]
	for i in drops.size():
		var base: Vector3 = drops[i]
		var g := _grp(p, "Pendant%d" % i)
		g.position = base
		var hang := 3.6 - 0.6 * (i % 2)     # 灯口高度 8.4 / 9.0
		_cyl(g, 0.02, 0.02, 12.0 - hang, Vector3(0, (12.0 + hang) * 0.5, 0), cable, 8)
		var sh := _cyl(g, 0.12, 0.42, 0.4, Vector3(0, hang + 0.2, 0), shade, 20)
		sh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var lens := _cyl(g, 0.3, 0.3, 0.07, Vector3(0, hang - 0.02, 0), lens_mat, 20)
		lens.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var li := OmniLight3D.new()
		li.position = Vector3(0, hang - 0.3, 0)
		li.light_color = Color(1.0, 0.78, 0.5)
		li.light_energy = 4.5
		li.omni_range = 11.0
		li.omni_attenuation = 1.4
		li.shadow_enabled = (i == 1)          # 只留 1 盏投影，控制 shadow atlas 压力
		li.light_volumetric_fog_energy = 1.4
		g.add_child(li)

	# 走廊壁灯（发光盒 + OmniLight，前两盏投影）
	var sconce := MatLib.glow_lens(Color(1.0, 0.66, 0.3), 6.5)
	for i in 4:
		var z := -13.0 - 6.0 * i
		var side := -1.0 if i % 2 == 0 else 1.0
		var g2 := _grp(p, "Sconce%d" % i)
		g2.position = Vector3(2.72 * side, 3.6, z)
		var box := _box(g2, 0.16, 0.5, 0.34, Vector3.ZERO, sconce)
		box.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var li2 := OmniLight3D.new()
		li2.light_color = Color(1.0, 0.7, 0.36)
		li2.light_energy = 3.2
		li2.omni_range = 8.5
		li2.omni_attenuation = 1.6
		li2.shadow_enabled = (i < 2)
		li2.light_volumetric_fog_energy = 1.2
		g2.add_child(li2)

	# 东墙检修射灯：detail 机位的定向主光，同时给机架在墙上打出投影。
	# 两个坑：①位置光有平方衰减，远处 energy≈3 等于没开；②必须挂在夹层楼板**底面**，
	# 装在板上朝下照的话光束全被自己脚下的楼板吃掉（第一版就这么全黑的）。
	var arm := MatLib.painted(Color(0.16, 0.17, 0.18), 3.0)
	_box(p, 0.4, 0.1, 0.4, Vector3(10.9, 5.14, 2.0), arm)     # 板底基座
	var housing := _box(p, 0.5, 0.26, 0.32, Vector3(10.9, 4.95, 2.0), arm)
	housing.rotation_degrees = Vector3(0, 0, -20)
	var work := SpotLight3D.new()
	p.add_child(work)
	work.position = Vector3(10.9, 4.8, 2.0)
	work.look_at(Vector3(12.3, 0.9, 1.7))
	work.light_color = Color(1.0, 0.9, 0.76)
	work.light_energy = 18.0
	work.spot_range = 14.0
	work.spot_angle = 58.0
	work.spot_attenuation = 1.0
	work.shadow_enabled = true
	work.light_volumetric_fog_energy = 1.2

	# 机架前的壁洗灯条：射灯是擦射，机架正面（背光面）需要一层近距离正面补光
	var bar := _box(p, 0.07, 0.07, 2.6, Vector3(10.55, 3.0, 2.4),
		MatLib.glow_lens(Color(1.0, 0.88, 0.7), 3.5))
	bar.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var wash := OmniLight3D.new()
	p.add_child(wash)
	wash.position = Vector3(10.5, 2.9, 2.4)
	wash.light_color = Color(1.0, 0.88, 0.7)
	wash.light_energy = 6.5
	wash.omni_range = 6.0
	wash.omni_attenuation = 1.5
	wash.shadow_enabled = false
	wash.light_volumetric_fog_energy = 1.0


# ════════════════════════ 标识 / 尘埃 ════════════════════════

static func _build_signs(p: Node3D) -> void:
	# Label3D：引擎内置字体，仍属零素材
	var main := Label3D.new()
	main.text = "AUREOLE · 光晕中庭"
	main.font_size = 140
	main.pixel_size = 0.007
	main.modulate = Color(1.0, 0.88, 0.7)
	main.outline_size = 18
	main.outline_modulate = Color(0.05, 0.05, 0.06, 0.9)
	main.position = Vector3(0, 8.4, 9.72)
	main.rotation_degrees = Vector3(0, 180, 0)
	p.add_child(main)

	var sec := Label3D.new()
	sec.text = "SECTOR — C / 04"
	sec.font_size = 90
	sec.pixel_size = 0.007
	sec.modulate = Color(0.5, 0.9, 1.0)
	sec.outline_size = 14
	sec.position = Vector3(-2.5, 4.4, -13.5)
	sec.rotation_degrees = Vector3(0, 90, 0)
	p.add_child(sec)

	var num := Label3D.new()
	num.text = "DEPTH 34m"
	num.font_size = 70
	num.pixel_size = 0.007
	num.modulate = Color(1.0, 0.6, 0.25)
	num.position = Vector3(2.88, 1.6, -30.0)
	num.rotation_degrees = Vector3(0, -90, 0)
	p.add_child(num)


static func _build_dust(p: Node3D) -> void:
	# 光柱里的浮尘：体积雾之外的第二层「空气感」
	var quad := QuadMesh.new()
	quad.size = Vector2(0.024, 0.024)
	var dust_mat := MatLib.dust_particle(Color(1.0, 0.92, 0.78), 0.55)
	dust_mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	quad.material = dust_mat

	var pm := ParticleProcessMaterial.new()
	pm.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_BOX
	pm.emission_box_extents = Vector3(5.2, 5.4, 4.4)
	pm.direction = Vector3(0, 1, 0)
	pm.spread = 180.0
	pm.initial_velocity_min = 0.02
	pm.initial_velocity_max = 0.1
	pm.gravity = Vector3.ZERO
	pm.scale_min = 0.4
	pm.scale_max = 1.4
	pm.lifetime_randomness = 0.6
	var ramp := Gradient.new()
	ramp.offsets = PackedFloat32Array([0.0, 0.35, 1.0])
	ramp.colors = PackedColorArray([
		Color(1, 1, 1, 0.0),
		Color(1, 1, 1, 0.55),
		Color(1, 1, 1, 0.0),
	])
	var gr := GradientTexture1D.new()
	gr.gradient = ramp
	pm.color_ramp = gr

	var particles := GPUParticles3D.new()
	particles.amount = 240
	particles.lifetime = 26.0
	particles.preprocess = 26.0
	particles.visibility_aabb = AABB(Vector3(0, 5.5, 0), Vector3(13, 12, 11))
	particles.process_material = pm
	particles.draw_pass_1 = quad
	particles.position = Vector3(0, 5.6, 0.2)
	particles.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	p.add_child(particles)


# ════════════════════════ 灯光 ════════════════════════

static func _build_lights(p: Node3D) -> void:
	# 主光：斜射穿过天窗格栅 → 条纹光柱（SDFGI 的能量主力）
	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-40.0, 28.0, 0.0)
	sun.light_color = Color(1.0, 0.94, 0.85)
	sun.light_energy = 3.8
	sun.light_angular_distance = 0.6        # 软阴影的角直径
	sun.shadow_enabled = true
	sun.shadow_bias = 0.02
	sun.shadow_normal_bias = 1.0
	sun.directional_shadow_max_distance = 90.0
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_split_1 = 0.08
	sun.directional_shadow_split_2 = 0.22
	sun.directional_shadow_split_3 = 0.5
	sun.light_volumetric_fog_energy = 1.6    # 光柱亮度主要看它
	sun.light_indirect_energy = 1.0
	p.add_child(sun)

	# 冷补光：门洞处一盏偏青的聚光，切出冷暖过渡
	var spot := SpotLight3D.new()
	spot.position = Vector3(0, 5.5, -9.0)
	spot.rotation_degrees = Vector3(-115, 0, 0)
	spot.light_color = Color(0.55, 0.8, 1.0)
	spot.light_energy = 2.2
	spot.spot_range = 16.0
	spot.spot_angle = 55.0
	spot.shadow_enabled = false
	spot.light_volumetric_fog_energy = 1.5
	p.add_child(spot)

# ════════════════════════ 基础工具 ════════════════════════

static func _grp(parent: Node3D, node_name: String) -> Node3D:
	var n := Node3D.new()
	n.name = node_name
	parent.add_child(n)
	return n


static func _box(parent: Node3D, sx: float, sy: float, sz: float,
		pos: Vector3, mat: Material) -> MeshInstance3D:
	var mesh := BoxMesh.new()
	mesh.size = Vector3(sx, sy, sz)
	mesh.material = mat
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position = pos
	parent.add_child(mi)
	return mi


static func _cyl(parent: Node3D, top_r: float, bot_r: float, h: float,
		pos: Vector3, mat: Material, radial := 24) -> MeshInstance3D:
	var mesh := CylinderMesh.new()
	mesh.top_radius = top_r
	mesh.bottom_radius = bot_r
	mesh.height = h
	mesh.radial_segments = radial
	mesh.material = mat
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position = pos
	parent.add_child(mi)
	return mi
