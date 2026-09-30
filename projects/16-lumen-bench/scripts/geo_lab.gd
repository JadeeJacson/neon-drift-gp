
# 参数化几何实验室：一个通用曲面构造器 + 由它派生的建筑构件
#
# 为什么全走参数曲面而不是堆 CSG / 引擎基本体：
#  1. 柱头、拱券、共肋穹顶、栏杆这类带旋转/扫掠的形体，CSG 拼出来面数失控且法线难保；
#  2. 一个 param() 出口能同时给出位置与解析法线（有限差分），材质、阴影、SDFGI 都吃得下；
#  3. 所有尺寸都是可调参数，改一个常数就能重排整个空间（TA 测试要的是「能改」）。
# 约定：u 绕「周长/扫掠方向」，v 绕「高度/延伸方向」，均 0..1；flip 用来把法线翻到壳体外侧。
extends RefCounted


# 通用参数曲面 → 直接写进 SurfaceTool（可多次调用把碎片合进同一张网格、共用一个材质槽）
static func param_into(st: SurfaceTool, res_u: int, res_v: int, fn: Callable, flip: bool = false) -> void:
	var eps := 1e-3
	for vi in res_v:
		var v0 := float(vi) / float(res_v)
		var v1 := float(vi + 1) / float(res_v)
		for ui in res_u:
			var u0 := float(ui) / float(res_u)
			var u1 := float(ui + 1) / float(res_u)
			var p00: Vector3 = fn.call(u0, v0)
			var p10: Vector3 = fn.call(u1, v0)
			var p01: Vector3 = fn.call(u0, v1)
			var p11: Vector3 = fn.call(u1, v1)
			# 角点法线：中心差分求切向与副切向
			var n00 := _normal_at(fn, u0, v0, eps, flip)
			var n10 := _normal_at(fn, u1, v0, eps, flip)
			var n01 := _normal_at(fn, u0, v1, eps, flip)
			var n11 := _normal_at(fn, u1, v1, eps, flip)
			_tri(st, p00, n00, p10, n10, p11, n11, u0, v0, u1, v0, u1, v1, flip)
			_tri(st, p00, n00, p11, n11, p01, n01, u0, v0, u1, v1, u0, v1, flip)


# 关键：flip 必须同时翻转**顶点绕序**，不能只翻转法线属性。
# 只改法线的话，几何正面仍按原绕序判定，背面剔除会把整面「朝内」的墙剔掉
# （本工程实测：厅内看不到环墙与柱身外表面，只有把 cull 关掉才出现）。
static func _tri(st: SurfaceTool, a: Vector3, na: Vector3, b: Vector3, nb: Vector3, c: Vector3, nc: Vector3, ua: float, va: float, ub: float, vb: float, uc: float, vc: float, flip: bool) -> void:
	if na.length_squared() <= 0.0 or nb.length_squared() <= 0.0 or nc.length_squared() <= 0.0:
		return
	if flip:
		# 反向绕：几何法线与存储法线保持一致
		st.set_normal(nc)
		st.set_uv(Vector2(uc, vc))
		st.add_vertex(c)
		st.set_normal(nb)
		st.set_uv(Vector2(ub, vb))
		st.add_vertex(b)
		st.set_normal(na)
		st.set_uv(Vector2(ua, va))
		st.add_vertex(a)
		return
	st.set_normal(na)
	st.set_uv(Vector2(ua, va))
	st.add_vertex(a)
	st.set_normal(nb)
	st.set_uv(Vector2(ub, vb))
	st.add_vertex(b)
	st.set_normal(nc)
	st.set_uv(Vector2(uc, vc))
	st.add_vertex(c)


# 法线约定（实测校准）：Godot 的正面方向是 −(∂u × v)，所这里取 tv × tu，
# 这样「存储法线」与「背面剔除用的几何正面」始终一致；flip 同时翻转绕序与法线。
static func _normal_at(fn: Callable, u: float, v: float, eps: float, flip: bool) -> Vector3:
	var pu0: Vector3 = fn.call(maxf(u - eps, 0.0), v)
	var pu1: Vector3 = fn.call(minf(u + eps, 1.0), v)
	var pv0: Vector3 = fn.call(u, maxf(v - eps, 0.0))
	var pv1: Vector3 = fn.call(u, minf(v + eps, 1.0))
	var tu := pu1 - pu0
	var tv := pv1 - pv0
	# 先把两个切向各自归一化再叉乘：否则 1×1 小面片（逐格挖洞的墙、洞口）
	# 算出的叉积长度会小到达标阈值以下，整面墙会被当成退化三角形丢掉。
	if tu.length_squared() < 1e-16 or tv.length_squared() < 1e-16:
		return Vector3.ZERO
	var n := tv.normalized().cross(tu.normalized())
	if n.length_squared() < 1e-6:
		return Vector3.ZERO # 两面几乎平行，法线无定义
	n = n.normalized()
	return -n if flip else n


static func new_surface() -> SurfaceTool:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	return st


static func commit(st: SurfaceTool) -> ArrayMesh:
	var m: ArrayMesh = st.commit()
	return m


# 统计三角面：诊断报告里的「面数」从这里来，不靠手写估值
# PrimitiveMesh（BoxMesh/TorusMesh 等）在首次渲染前 surface_get_arrays 会返回空，
# 所以这里只能拿到「已生成」的网格面数，对基本体返回 0 是预期行为。
static func count_tris(mesh: Mesh) -> int:
	if mesh == null:
		return 0
	var n := 0
	for s in mesh.get_surface_count():
		var arr: Array = mesh.surface_get_arrays(s)
		if arr.is_empty() or arr.size() <= Mesh.ARRAY_VERTEX:
			continue
		var idx: Variant = arr[Mesh.ARRAY_INDEX]
		if idx is PackedInt32Array and (idx as PackedInt32Array).size() > 0:
			n += (idx as PackedInt32Array).size() / 3
			continue
		var vert: Variant = arr[Mesh.ARRAY_VERTEX]
		if vert is PackedVector3Array:
			n += (vert as PackedVector3Array).size() / 3
	return n


# ── 旋转体（拉丁面）：profile 是 [r, y] 控制点，沿 v 方向插值 ──────────────
static func revolve_into(st: SurfaceTool, profile: PackedVector2Array, res_u: int, res_v: int, flip: bool = false, y_scale: float = 1.0) -> void:
	# profile.x = 半径，profile.y = 高度；沿弧长均匀采样，避免点数不均导致拉伸
	var lens: PackedFloat32Array = _profile_lengths(profile)
	var total: float = lens[lens.size() - 1]
	var fn := func(u: float, v: float) -> Vector3:
		var t := clampf(v, 0.0, 1.0) * total
		var pr := _profile_at(profile, lens, t)
		var a := u * TAU
		return Vector3(cos(a) * pr.x, pr.y * y_scale, sin(a) * pr.x)
	param_into(st, res_u, res_v, fn, flip)


static func _profile_lengths(profile: PackedVector2Array) -> PackedFloat32Array:
	var lens := PackedFloat32Array()
	lens.resize(profile.size())
	lens[0] = 0.0
	for i in range(1, profile.size()):
		var d: Vector2 = profile[i] - profile[i - 1]
		lens[i] = lens[i - 1] + d.length()
	return lens


static func _profile_at(profile: PackedVector2Array, lens: PackedFloat32Array, t: float) -> Vector2:
	var last := profile.size() - 1
	for i in range(1, profile.size()):
		if t <= lens[i] or i == last:
			var seg: float = lens[i] - lens[i - 1]
			var f := 0.0 if seg <= 0.0 else clampf((t - lens[i - 1]) / seg, 0.0, 1.0)
			return profile[i - 1].lerp(profile[i], f)
	return profile[last]


# ── 凹槽柱：半径按 cos(flutes·θ) 起伏，带收分（entasis）与顶底过渡 ────────
static func column_shaft(radius: float, height: float, flutes: int, seg_u: int, seg_v: int) -> ArrayMesh:
	var st := new_surface()
	var amp := radius * 0.075
	var fn := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		# 收分：往上略细 + 中段微鼓（古典柱式的 entasis）
		var taper := 1.0 - 0.085 * v + 0.030 * sin(v * PI)
		# 凹槽只在上半段真正咬合，靠近柱脚渐隐成光面
		var groove := smoothstep(0.0, 0.16, v) * (1.0 - smoothstep(0.90, 1.0, v) * 0.35)
		var r := radius * taper + amp * groove * cos(float(flutes) * a)
		return Vector3(cos(a) * r, v * height, sin(a) * r)
	param_into(st, seg_u, seg_v, fn)
	return commit(st)


# 多角星形线脚（柱头/柱基的方形过渡）：把圆按 cos 波压成外扩的方圆形
static func molding_into(st: SurfaceTool, r_bot: float, r_top: float, y0: float, y1: float, lobes: int, seg_u: int) -> void:
	var fn := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		var r := lerpf(r_bot, r_top, v)
		# 方形线脚：用 p=4 的超椭圆半径函数近似
		var se := 1.0 / pow(pow(absf(cos(a)), 4.0) + pow(absf(sin(a)), 4.0), 0.25)
		var mix := 0.55 + 0.45 * se
		return Vector3(cos(a) * r * mix, lerpf(y0, y1, v), sin(a) * r * mix)
	param_into(st, seg_u, 3, fn)


# ── 拱券：沿 XY 平面上的圆弧扫掠一个矩形截面 ─────────────────────────────
static func arch(center: Vector3, radius: float, span: float, depth: float, height: float, segs: int) -> ArrayMesh:
	var st := new_surface()
	var half := span * 0.5
	# 截面轮廓：绕拱的局部 (法向, 切向) 走一圈的矩形
	var prof := [
		Vector2(-depth * 0.5, -height * 0.5),
		Vector2(depth * 0.5, -height * 0.5),
		Vector2(depth * 0.5, height * 0.5),
		Vector2(-depth * 0.5, height * 0.5),
	]
	var n := prof.size()
	var fn := func(u: float, v: float) -> Vector3:
		var ang := -half + u * span
		var radial := Vector3(cos(ang), sin(ang), 0.0)
		var tang := Vector3(-sin(ang), cos(ang), 0.0)
		var k := v * float(n)
		var i0 := floori(k) % n
		var i1 := (i0 + 1) % n
		var f: float = k - float(floori(k))
		var pc: Vector2 = prof[i0].lerp(prof[i1], f)
		return center + radial * (radius + pc.x) + tang * pc.y
	param_into(st, segs * 3, n * 3, fn)
	return commit(st)


# ── 共肋穹顶：(θ, φ) 球面 + 径向凹凸做藻井，中心留圆眼 ────────────────────
# 壳体内外面各一片（相隔 thickness），从厅内看到共肋、从破口往外看到背面也不漏光
static func dome(radius_xz: float, rise: float, y_base: float, oculus_frac: float, ribs: int, coffers: int, thickness: float, seg_u: int, seg_v: int) -> ArrayMesh:
	var st := new_surface()
	# 内面：正面朝厅内（本参数化下 flip=false 的正面就是「向内呷下」），藻井只雕在内侧
	var fn_in := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		# φ 从圆眼边缘走到赤道：v=0 在圆眼（最高点），v=1 在鼓座顶
		var phi := lerpf(oculus_frac * PI * 0.5, PI * 0.5, v)
		var rr := radius_xz * sin(phi)
		var yy := y_base + rise * cos(phi)
		# 藻井：肋（经）与环带（纬）两组脊线取较大值 → 得到方格状凹斗而不是放射条纹
		var band := pow(absf(sin(v * float(coffers) * PI)), 0.45)
		var rib := pow(absf(cos(a * float(ribs) * 0.5)), 0.45)
		var ridge := maxf(band, rib)
		var inset := thickness * 0.62 * (1.0 - ridge) * (0.30 + 0.70 * v)
		return Vector3(cos(a) * (rr - inset), yy - inset * 0.30, sin(a) * (rr - inset))
	param_into(st, seg_u, seg_v, fn_in, false)
	# 外面：光滑隆起的壳背，给破口外的视角与阴影用
	var fn_out := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		var phi := lerpf(oculus_frac * PI * 0.5, PI * 0.5, v)
		var rr := (radius_xz + thickness) * sin(phi)
		var yy := y_base + (rise + thickness) * cos(phi)
		return Vector3(cos(a) * rr, yy, sin(a) * rr)
	param_into(st, seg_u, maxi(4, seg_v / 2), fn_out, true)
	return commit(st)


# ── 环形墙：内面 + 外面 + 顶面，三段合一（开口按角度×高度逐片挖洞）────
# openings: Array[Dictionary]，每项 {from, to, y0, y1}（弧度与米）
static func ring_wall(r_in: float, r_out: float, y0: float, y1: float, seg_u: int, openings: Array) -> ArrayMesh:
	var st := new_surface()
	# 内壁（面朝厅内）flip=true，外壁 flip=false（本参数化下 flip=false 的正面朝外）
	_shell_band(st, r_in, y0, y1, seg_u, openings, true)
	_shell_band(st, r_out, y0, y1, seg_u, openings, false)
	# 顶盖环（水平面朝上需要 flip=true）
	var cap := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		var r := lerpf(r_in, r_out, v)
		return Vector3(cos(a) * r, y1, sin(a) * r)
	param_into(st, seg_u, 1, cap, true)
	# 洞口的侧壁与过梁：把洞的四个边补上，否则从斜角度看洞是「没有厚度」的
	for o in openings:
		_opening_jambs(st, r_in, r_out, float(o["from"]), float(o["to"]), float(o["y0"]), float(o["y1"]))
	return commit(st)


# 洞口的左右 jamb（沿半径的小面）与上下过梁（沿角度的一条窄面）
static func _opening_jambs(st: SurfaceTool, r_in: float, r_out: float, a0: float, a1: float, oy0: float, oy1: float) -> void:
	for pair in [[a0, true], [a1, false]]:
		var ang: float = float(pair[0])
		var flip: bool = bool(pair[1])
		var fn := func(u: float, v: float) -> Vector3:
			var r := lerpf(r_in, r_out, u)
			return Vector3(cos(ang) * r, lerpf(oy0, oy1, v), sin(ang) * r)
		param_into(st, 1, 3, fn, flip)
	for pair2 in [[oy0, true], [oy1, false]]:
		var yy: float = float(pair2[0])
		var flip2: bool = bool(pair2[1])
		var fn2 := func(u: float, v: float) -> Vector3:
			var a := lerpf(a0, a1, u)
			var r := lerpf(r_in, r_out, v)
			return Vector3(cos(a) * r, yy, sin(a) * r)
		param_into(st, 3, 1, fn2, flip2)


static func _shell_band(st: SurfaceTool, r: float, y0: float, y1: float, seg_u: int, openings: Array, flip: bool) -> void:
	# 逐格生成，落在开口（角度×高度）里的格子直接跳过 → 洞是真真空而非透明
	var seg_v := 12
	for ui in seg_u:
		var u0 := float(ui) / float(seg_u)
		var u1 := float(ui + 1) / float(seg_u)
		for vi in seg_v:
			var v0 := float(vi) / float(seg_v)
			var v1 := float(vi + 1) / float(seg_v)
			if _quad_blocked(u0, u1, v0, v1, y0, y1, openings):
				continue
			var fn := func(du: float, dv: float) -> Vector3:
				var a := lerpf(u0, u1, du) * TAU
				var yy := lerpf(y0 + (y1 - y0) * v0, y0 + (y1 - y0) * v1, dv)
				return Vector3(cos(a) * r, yy, sin(a) * r)
			# 逐格单独提交（res 1×1）才能按格跳过开口；法线已改成先归一化再叉乘，小面片不会被丢
			param_into(st, 1, 1, fn, flip)


static func _quad_blocked(u0: float, u1: float, v0: float, v1: float, y0: float, y1: float, openings: Array) -> bool:
	var uc := (u0 + u1) * 0.5 * TAU
	var yc := y0 + (y1 - y0) * (v0 + v1) * 0.5
	for o in openings:
		if uc >= float(o["from"]) and uc <= float(o["to"]) and yc >= float(o["y0"]) and yc <= float(o["y1"]):
			return true
	return false


# 诊断用：与 ring_wall 同尺寸，但用单次 param_into 批量生成（无逐格 lambda）
# 如果它能显示而逐格版本不能，问题就在「一格一次提交」的写法上
static func test_shell_batched(r: float, y0: float, y1: float, seg_u: int, seg_v: int) -> ArrayMesh:
	var st := new_surface()
	var fn := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		return Vector3(cos(a) * r, lerpf(y0, y1, v), sin(a) * r)
	param_into(st, seg_u, seg_v, fn, false)
	return commit(st)


# ── 阶梯环：从内圈向外逐级下降的圆形台地 ─────────────────────────────────
static func steps_ring(r_in: float, r_out: float, y_top: float, y_bottom: float, steps: int, seg_u: int) -> ArrayMesh:
	var st := new_surface()
	for i in steps:
		var f0 := float(i) / float(steps)
		var f1 := float(i + 1) / float(steps)
		var r0 := lerpf(r_in, r_out, f0)
		var r1 := lerpf(r_in, r_out, f1)
		var y := lerpf(y_top, y_bottom, f1)
		var yup := lerpf(y_top, y_bottom, f0)
		# 踢面：本参数化下 flip=false 的正面就是朝外（背离轴心）
		var riser := func(u: float, v: float) -> Vector3:
			var a := u * TAU
			return Vector3(cos(a) * r1, lerpf(y, yup, v), sin(a) * r1)
		param_into(st, seg_u, 1, riser, false)
		# 踏面（水平面朝上）
		var tread := func(u: float, v: float) -> Vector3:
			var a := u * TAU
			var r := lerpf(r0, r1, v)
			return Vector3(cos(a) * r, yup, sin(a) * r)
		param_into(st, seg_u, 1, tread, true)
	return commit(st)


# ── 平面圆盘 / 环面：地面、池壁顶、回廊面这类水平面都用它 ───────────────
# 本参数化（u 绕轴、v 沿径向外）下，朝上的面需要 flip=true
static func disc(radius: float, segs: int, y: float = 0.0, n_ring: int = 1) -> ArrayMesh:
	var st := new_surface()
	var fn := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		var r := radius * (0.06 + 0.94 * v)
		return Vector3(cos(a) * r, y, sin(a) * r)
	param_into(st, segs, maxi(1, n_ring), fn, true)
	return commit(st)


static func annulus(r_in: float, r_out: float, segs: int, y: float = 0.0, n_ring: int = 3) -> ArrayMesh:
	var st := new_surface()
	var fn := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		var r := lerpf(r_in, r_out, v)
		return Vector3(cos(a) * r, y, sin(a) * r)
	param_into(st, segs, n_ring, fn, true)
	return commit(st)


# 引擎基本体包装：立方体/圆柱/圆环/球——它们是引擎内置几何，不算外部素材
static func box(size: Vector3) -> BoxMesh:
	var m := BoxMesh.new()
	m.size = size
	return m


static func cylinder(r: float, h: float, radial: int = 24, top: float = 1.0, bottom: float = 1.0) -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = r * top
	m.bottom_radius = r * bottom
	m.height = h
	m.radial_segments = radial
	m.rings = 1
	return m


# 4.7 的 TorusMesh 改名了，而且**语义也变了**（实测）：
#   旧：major_radius = 环心半径 R，minor_radius = 管半径 r
#   新：outer_radius = R + r（外沿），inner_radius = R - r（内沿）
# 直接把 R/r 当 outer/inner 传进去会得到一个「胖甜甜圈」（实测把 8.68/0.085 传进去
# 得到 R=4.38、管径 4.30 的实心环，就是画面里那颗黑球），所以这里做换算。
static func torus(rmajor: float, rminor: float, rings: int = 48, loop: int = 12) -> TorusMesh:
	var m := TorusMesh.new()
	m.outer_radius = rmajor + rminor
	m.inner_radius = maxf(rmajor - rminor, 0.0)
	m.rings = rings
	m.ring_segments = loop
	return m


static func sphere(r: float, radial: int = 24, rings: int = 14) -> SphereMesh:
	var m := SphereMesh.new()
	m.radius = r
	m.height = r * 2.0
	m.radial_segments = radial
	m.rings = rings
	return m


# 单一旋转轮廓快速成体：把 [r,y] 控制点绕 Y 轴旋转一周
static func revolve_mesh(profile: PackedVector2Array, seg_u: int, seg_v: int, y_scale: float, flip: bool = false) -> ArrayMesh:
	var st := new_surface()
	revolve_into(st, profile, seg_u, seg_v, flip, y_scale)
	return commit(st)


# ── 外部山脊：半径方向延伸 + 高度场噪声，黄昏剪影用 ───────────────────────────────
static func ridges(seed: int, ring_r: float, far_r: float, amp: float, seg_u: int, seg_v: int) -> ArrayMesh:
	var st := new_surface()
	var noise := FastNoiseLite.new()
	noise.seed = seed
	noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	noise.fractal_type = FastNoiseLite.FRACTAL_RIDGED
	noise.fractal_octaves = 5
	noise.frequency = 0.035
	var fn := func(u: float, v: float) -> Vector3:
		var a := u * TAU
		var d := lerpf(ring_r, far_r, v)
		var x := cos(a) * d
		var z := sin(a) * d
		var h := noise.get_noise_2d(x, z) * amp
		# 近处留平地，越远山越高
		var shape := pow(v, 1.6)
		return Vector3(x, h * shape - amp * 0.06 * (1.0 - shape), z)
	param_into(st, seg_u, seg_v, fn, true)
	return commit(st)


# ── 栏杆柱（小花瓶柱）：给 MultiMesh 当模板，一次定义批量复用 ─────────────
static func baluster_profile(h: float) -> PackedVector2Array:
	return PackedVector2Array([
		Vector2(0.075, 0.0),
		Vector2(0.078, 0.04),
		Vector2(0.052, 0.10),
		Vector2(0.046, 0.22),
		Vector2(0.088, 0.38),
		Vector2(0.096, 0.50),
		Vector2(0.062, 0.62),
		Vector2(0.040, 0.74),
		Vector2(0.036, 0.86),
		Vector2(0.058, 0.94),
		Vector2(0.062, 1.0),
	])


static func baluster(h: float, seg_u: int) -> ArrayMesh:
	var st := new_surface()
	var prof := baluster_profile(1.0)
	revolve_into(st, prof, seg_u, 16, false, h)
	# 底部方座
	molding_into(st, 0.10, 0.085, 0.0, 0.05, 4, seg_u)
	return commit(st)


# ── 碎石块：随机多面体（用低细分球 + 顶点抖动），给 MultiMesh 当模板 ──────
static func rubble(seed: int, count: int, size: float) -> ArrayMesh:
	var st := new_surface()
	var noise := FastNoiseLite.new()
	noise.seed = seed
	noise.noise_type = FastNoiseLite.TYPE_VALUE_CUBIC
	# 每个碎块是「抖动过的八面体」，共面但形状互不相同
	var verts := [
		Vector3(1, 0, 0), Vector3(-1, 0, 0), Vector3(0, 1, 0),
		Vector3(0, -1, 0), Vector3(0, 0, 1), Vector3(0, 0, -1),
	]
	var faces := [
		[0, 2, 4], [2, 1, 4], [1, 0, 4], [0, 1, 2],
		[2, 3, 5], [3, 1, 5], [1, 0, 5], [0, 3, 5],
		[2, 4, 3], [4, 1, 3], [1, 5, 3], [5, 0, 3],
		[4, 2, 5], [5, 2, 1], [5, 1, 0], [0, 2, 4],
	]
	for c in count:
		var ox := (noise.get_noise_2d(float(c) * 3.1, 7.7) + 1.0) * 0.5 * 2.5 - 1.25
		var oz := (noise.get_noise_2d(float(c) * 5.3, 2.2) + 1.0) * 0.5 * 2.5 - 1.25
		var oy := 0.0
		var sc := size * (0.55 + 0.9 * ((noise.get_noise_2d(float(c) * 1.7, 9.1) + 1.0) * 0.5))
		var vs: Array = []
		for i in verts.size():
			var v: Vector3 = verts[i]
			var jx := noise.get_noise_2d(float(c * 8 + i) * 0.7, 1.3) * 0.35
			var jy := noise.get_noise_2d(float(c * 8 + i) * 0.7, 4.9) * 0.35
			var jj := noise.get_noise_2d(float(c * 8 + i) * 0.7, 8.2) * 0.35
			vs.append(Vector3(ox + (v.x + jx) * sc, oy + (v.y * 0.7 + jy) * sc, oz + (v.z + jj) * sc))
		for f in faces:
			var a: Vector3 = vs[f[0]]
			var b: Vector3 = vs[f[1]]
			var d: Vector3 = vs[f[2]]
			# 法线取「离开碎块中心」的方向，不依赖顶点绕序（随机多面体的绕序不可靠）
			var cen := (a + b + d) / 3.0 - Vector3(ox, oy, oz)
			var nrm := cen.normalized()
			if nrm.length_squared() < 0.5:
				nrm = (b - a).cross(d - a).normalized()
			for p in [a, b, d]:
				st.set_normal(nrm)
				st.set_uv(Vector2.ZERO)
				st.add_vertex(p)
	return commit(st)
