# 建筑主体：沉星观星堂（圆形列柱厅 + 二层回廊 + 共肋穹顶 + 破口与玫瑰窗）
#
# 层级细节是这样铺的：
#   L 体量：外墙环 / 穹顶 / 地面 —— 决定空间纵深
#   L 构件：12 凹槽柱 + 檐部 + 12 拱券 + 回廊 + 栏杆 —— 决定近景密度
#   L 开口：破口（日照光束通道）、玫瑰窗（彩色投影）、3 处高侧窗（次要天光）
#   L 外部：台地 + 远山脊 —— 从破口望出去的纵深
# 柱、栏杆、壁柱这类重复构件全部走 MultiMesh（一次网格、多份变换）。
extends RefCounted

const Layout := preload("res://scripts/layout.gd")
const Geo := preload("res://scripts/geo_lab.gd")


# 返回值给诊断用：节点数与三角面数
static func build(root: Node3D, mats: Dictionary) -> Dictionary:
	var tris := 0
	var nodes := 0
	var L := Node3D.new()
	L.name = "Hall"
	root.add_child(L)

	var openings := wall_openings()

	# ── 厅内石地（大理石，世界三向投影）───────────────────────────────
	var floor_mesh: ArrayMesh = Geo.disc(Layout.R_OUT + 0.4, 128, Layout.FLOOR_Y, 4)
	nodes += add(L, floor_mesh, mats["marble_dark"], Vector3.ZERO, "Floor")
	tris += tris_of(floor_mesh)

	# ── 外墙环（含全部开口）──────────────────────────────────────────
	var wall: ArrayMesh = Geo.ring_wall(Layout.R_IN, Layout.R_OUT, Layout.WALL_Y0, Layout.WALL_H, 160, openings)
	nodes += add(L, wall, mats["stone"], Vector3.ZERO, "Wall")
	tris += tris_of(wall)

	# 内壁衬裙：贴墙的一圈深色大理石基座（把大面积平墙切成两段，近看不空）
	var skirt_open := [opening_spec(Layout.BREACH_CENTER, Layout.BREACH_HALF, 0.0, 8.6)]
	var skirt: ArrayMesh = Geo.ring_wall(Layout.R_IN - 0.16, Layout.R_IN, 0.0, 1.35, 128, skirt_open)
	nodes += add(L, skirt, mats["marble_dark"], Vector3.ZERO, "Skirt")
	tris += tris_of(skirt)

	# 壁柱：内墙每 bay 一根方形附壁柱（MultiMesh）
	var pilaster: Mesh = Geo.box(Vector3(0.52, 10.2, 0.34))
	nodes += multimesh_ring(L, pilaster, mats["stone_dark"], Layout.R_IN - 0.17, 0.0, 12, 5.1, "Pilasters", openings)
	tris += tris_of(pilaster) * 12

	# ── 列柱：柱础 / 凹槽柱身 / 柱头，各自一份网格，12 份变换 ──────────
	var plinth: Mesh = Geo.box(Vector3(1.62, Layout.COL_PLINTH_H, 1.62))
	nodes += multimesh_ring(L, plinth, mats["marble"], Layout.COL_R, 0.0, Layout.COL_N, Layout.COL_PLINTH_H * 0.5, "ColumnPlinths", [])
	var shaft: ArrayMesh = Geo.column_shaft(Layout.COL_RSHAFT, Layout.COL_SHAFT_H, 20, 132, 14)
	nodes += multimesh_ring(L, shaft, mats["marble"], Layout.COL_R, Layout.COL_PLINTH_H, Layout.COL_N, 0.0, "ColumnShafts", [])
	tris += tris_of(shaft) * Layout.COL_N
	var capital: ArrayMesh = capital_mesh()
	nodes += multimesh_ring(L, capital, mats["marble"], Layout.COL_R, Layout.COL_PLINTH_H + Layout.COL_SHAFT_H, Layout.COL_N, 0.0, "ColumnCapitals", [])
	tris += tris_of(capital) * Layout.COL_N
	# 柱头顶板（abacus）
	var abacus: Mesh = Geo.box(Vector3(1.44, 0.20, 1.44))
	nodes += multimesh_ring(L, abacus, mats["marble"], Layout.COL_R, Layout.COL_PLINTH_H + Layout.COL_SHAFT_H + Layout.COL_CAP_H, Layout.COL_N, 0.0, "Abacuses", [])

	# ── 檐部环梁 + 二层回廊（都要在破口与玫瑰窗处留洞，否则挡住低角度日光）──
	var ent: ArrayMesh = Geo.ring_wall(Layout.COL_R - 1.05, Layout.COL_R + 1.05, Layout.ENT_Y0, Layout.ENT_Y1, 128, openings)
	nodes += add(L, ent, mats["stone"], Vector3.ZERO, "Entablature")
	tris += tris_of(ent)

	var gallery: ArrayMesh = Geo.annulus(Layout.COL_R - 1.30, Layout.COL_R + 1.35, 128, Layout.GALLERY_Y, 3)
	nodes += add(L, gallery, mats["marble"], Vector3.ZERO, "GalleryFloor")
	tris += tris_of(gallery)
	var fascia: ArrayMesh = Geo.ring_wall(Layout.COL_R - 1.30, Layout.COL_R + 1.35, Layout.GALLERY_Y - 0.42, Layout.GALLERY_Y, 128, openings)
	nodes += add(L, fascia, mats["stone_dark"], Vector3.ZERO, "GalleryFascia")
	tris += tris_of(fascia)

	# 栏杆：小花瓶柱 MultiMesh（数量是厅里最大的重复构件，正好压测实例化）
	var bal: ArrayMesh = Geo.baluster(Layout.BAL_H, 24)
	var bal_count := balusters_add(L, bal, mats["stone"], openings)
	tris += tris_of(bal) * bal_count
	var rail: Mesh = Geo.torus(Layout.COL_R - 1.02, 0.085, 128, 10)
	nodes += add(L, rail, mats["brass"], Vector3(0, Layout.GALLERY_Y + Layout.BAL_H, 0), "Handrail")
	tris += tris_of(rail)

	# ── 12 道拱券：跨在相邻柱头之间 ──────────────────────────────────
	var span_ang := TAU / float(Layout.COL_N)
	var arch_r := Layout.COL_R * sin(span_ang * 0.5) * 1.06
	var arch: ArrayMesh = Geo.arch(Vector3.ZERO, arch_r, PI, 0.62, 1.05, 22)
	for i in Layout.COL_N:
		var a := Layout.bay_angle(i) + span_ang * 0.5
		if in_any_opening(a, openings):
			continue
		var apos := Vector3(cos(a) * Layout.COL_R, Layout.ARCH_Y, sin(a) * Layout.COL_R)
		nodes += add_mesh(L, arch, mats["stone"], Transform3D(bay_basis(a), apos), "Arch%d" % i)
	tris += tris_of(arch) * Layout.COL_N

	# ── 鼓座檐口 + 共肋穹顶 + 圆眼环 ─────────────────────────────────
	var cornice: ArrayMesh = Geo.ring_wall(Layout.R_IN - 0.35, Layout.R_IN + 0.45, Layout.WALL_H - 0.85, Layout.WALL_H, 128, [])
	nodes += add(L, cornice, mats["stone"], Vector3.ZERO, "Cornice")
	tris += tris_of(cornice)

	var dome: ArrayMesh = Geo.dome(Layout.R_IN, Layout.DOME_RISE, Layout.WALL_H, Layout.DOME_OCULUS, Layout.DOME_RIBS, Layout.DOME_COFFERS, 0.62, 160, 34)
	nodes += add(L, dome, mats["dome"], Vector3.ZERO, "Dome")
	tris += tris_of(dome)

	var phi0 := Layout.DOME_OCULUS * PI * 0.5
	var oculus_r := Layout.R_IN * sin(phi0)
	var oculus_y := Layout.WALL_H + Layout.DOME_RISE * cos(phi0)
	var rim: Mesh = Geo.torus(oculus_r, 0.34, 96, 12)
	nodes += add(L, rim, mats["brass"], Vector3(0, oculus_y, 0), "OculusRim")
	tris += tris_of(rim)

	# ── 中央台地（三层台阶没入水中）+ 基座盘 ──────────────────────────
	var steps: ArrayMesh = Geo.steps_ring(Layout.DAIS_R, Layout.DAIS_R + 2.7, Layout.DAIS_Y, Layout.WATER_Y - 0.12, 4, 96)
	nodes += add(L, steps, mats["marble"], Vector3.ZERO, "DaisSteps")
	tris += tris_of(steps)
	var dais_top: ArrayMesh = Geo.disc(Layout.DAIS_R, 96, Layout.DAIS_Y, 2)
	nodes += add(L, dais_top, mats["marble_wet"], Vector3.ZERO, "DaisTop")
	tris += tris_of(dais_top)

	# ── 破口：塌掉的墙段 + 斜插水中的断柱 ────────────────────────────
	var fallen := Vector3(cos(Layout.BREACH_CENTER), 0, sin(Layout.BREACH_CENTER))
	var b1: Mesh = Geo.box(Vector3(3.2, 2.4, 1.1))
	var b1_t := Transform3D(Basis.from_euler(Vector3(0.0, 0.25, 0.32)), fallen * (Layout.R_IN - 0.5) + Vector3(0, 1.05, 0))
	nodes += add_mesh(L, b1, mats["stone"], b1_t, "BreachRubbleA")
	var b2: Mesh = Geo.box(Vector3(2.0, 1.6, 0.9))
	var b2_t := Transform3D(Basis.from_euler(Vector3(0.15, -0.40, -0.22)), fallen * (Layout.R_IN + 1.1) + Vector3(0, 0.55, 0))
	nodes += add_mesh(L, b2, mats["stone"], b2_t, "BreachRubbleB")
	var stump: Mesh = Geo.cylinder(0.62, 5.4, 32)
	var stump_t := Transform3D(Basis.from_euler(Vector3(0, 0.34, PI * 0.46)), fallen * (Layout.R_IN - 2.4) + Vector3(0, 0.85, 1.5))
	nodes += add_mesh(L, stump, mats["marble"], stump_t, "FallenColumn")
	tris += tris_of(b1) + tris_of(b2) + tris_of(stump)

	# ── 玫瑰窗：洞口处的彩色玻璃盘 + 石环（玻璃盘法线是局部 +Y，所以把 +Y 装到径向上）─
	var rose_a := Layout.ROSE_CENTER
	var rose_out := Vector3(cos(rose_a), 0, sin(rose_a))
	var rose_chord := Vector3(-sin(rose_a), 0, cos(rose_a))
	var win_basis := Basis(rose_chord, rose_out, Vector3.UP)
	var glass: ArrayMesh = Geo.disc(Layout.ROSE_R, 64, 0.0, 1)
	var glass_t := Transform3D(win_basis, rose_out * (Layout.R_IN - 0.05) + Vector3(0, Layout.ROSE_Y, 0))
	nodes += add_mesh(L, glass, mats["rose_glass"], glass_t, "RoseGlass")
	tris += tris_of(glass)
	var tracery: Mesh = Geo.torus(Layout.ROSE_R * 1.03, 0.13, 64, 10)
	var tracery_t := Transform3D(win_basis, rose_out * (Layout.R_IN - 0.12) + Vector3(0, Layout.ROSE_Y, 0))
	nodes += add_mesh(L, tracery, mats["iron"], tracery_t, "RoseTracery")
	tris += tris_of(tracery)

	# ── 外部：台地一圈 + 远山脊 ──────────────────────────────────────
	var terrace: ArrayMesh = Geo.disc(46.0, 128, -0.06, 6)
	nodes += add(L, terrace, mats["stone_dark"], Vector3.ZERO, "Terrace")
	tris += tris_of(terrace)
	var ridge: ArrayMesh = Geo.ridges(9001, 40.0, Layout.TERRAIN_R1, Layout.RIDGE_AMP, 200, 26)
	nodes += add(L, ridge, mats["stone_dark"], Vector3.ZERO, "Ridges")
	tris += tris_of(ridge)

	return {"nodes": nodes, "tris": tris, "oculus_r": oculus_r, "oculus_y": oculus_y}


# 内壁开口表：破口（日照通道）、玫瑰窗洞、3 处高侧窗
static func wall_openings() -> Array:
	var list: Array = []
	list.append(opening_spec(Layout.BREACH_CENTER, Layout.BREACH_HALF, 0.0, Layout.BREACH_Y1))
	list.append(opening_spec(Layout.ROSE_CENTER, Layout.ROSE_HALF, Layout.ROSE_Y - Layout.ROSE_R - 0.25, Layout.ROSE_Y + Layout.ROSE_R + 0.25))
	for a in Layout.CLERESTORY:
		list.append(opening_spec(a, 0.085, 9.3, 11.3))
	return list


static func opening_spec(center: float, half: float, y0: float, y1: float) -> Dictionary:
	return {"from": center - half, "to": center + half, "y0": y0, "y1": y1}


static func in_any_opening(ang: float, openings: Array) -> bool:
	for o in openings:
		if ang >= float(o["from"]) and ang <= float(o["to"]):
			return true
	return false


# 环上均匀摆放：跳过落在开口角度里的实例
static func multimesh_ring(parent: Node3D, mesh: Mesh, mat: Material, radius: float, y: float, count: int, y_offset: float, node_name: String, openings: Array) -> int:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	var placed := 0
	var xforms: Array = []
	for i in count:
		var a := TAU * float(i) / float(count)
		if in_any_opening(a, openings):
			continue
		var pos := Vector3(cos(a) * radius, y + y_offset, sin(a) * radius)
		var b := bay_basis(a)
		xforms.append(Transform3D(b, pos))
		placed += 1
	mm.instance_count = placed
	for i in placed:
		mm.set_instance_transform(i, xforms[i] as Transform3D)
	mm.mesh = mesh
	var mi := MultiMeshInstance3D.new()
	mi.name = node_name
	mi.multimesh = mm
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	parent.add_child(mi)
	return placed


# 栏杆柱：密度按弧长算（约每 0.26 m 一根），开口处断开
static func balusters_add(parent: Node3D, mesh: ArrayMesh, mat: Material, openings: Array) -> int:
	var radius := Layout.COL_R - 1.02
	var step := 0.27 / radius # 角度步长，使弧长间隔≈0.27 m
	var xforms: Array = []
	var a := 0.0
	while a < TAU:
		if not in_any_opening(a, openings):
			xforms.append(Transform3D(bay_basis(a), Vector3(cos(a) * radius, Layout.GALLERY_Y, sin(a) * radius)))
		a += step
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.instance_count = xforms.size()
	for i in xforms.size():
		mm.set_instance_transform(i, xforms[i] as Transform3D)
	mm.mesh = mesh
	var mi := MultiMeshInstance3D.new()
	mi.name = "Balusters"
	mi.multimesh = mm
	mi.material_override = mat
	parent.add_child(mi)
	return xforms.size()


# 某个 bay 的正交基：x 沿弦、y 朝上、z 沿半径向外
static func bay_basis(a: float) -> Basis:
	var radial := Vector3(cos(a), 0, sin(a))
	var up := Vector3.UP
	var x := up.cross(radial)
	return Basis(x, up, radial)


static func capital_mesh() -> ArrayMesh:
	var st := Geo.new_surface()
	var prof := PackedVector2Array([
		Vector2(0.60, 0.0),
		Vector2(0.63, 0.10),
		Vector2(0.55, 0.26),
		Vector2(0.49, 0.40),
		Vector2(0.62, 0.60),
		Vector2(0.78, 0.76),
	])
	Geo.revolve_into(st, prof, 40, 14, false, Layout.COL_CAP_H)
	return Geo.commit(st)


static func add(parent: Node, mesh: Mesh, mat: Material, pos: Vector3, node_name: String) -> int:
	var mi := MeshInstance3D.new()
	mi.name = node_name
	mi.mesh = mesh
	mi.material_override = mat
	mi.position = pos
	parent.add_child(mi)
	return 1


static func add_mesh(parent: Node, mesh: Mesh, mat: Material, xform: Transform3D, node_name: String) -> int:
	var mi := MeshInstance3D.new()
	mi.name = node_name
	mi.mesh = mesh
	mi.material_override = mat
	mi.transform = xform
	parent.add_child(mi)
	return 1


# 面数统计统一走 geo_lab，避免两处实现飘移
static func tris_of(mesh: Mesh) -> int:
	return Geo.count_tris(mesh)
