# TA 装配自检（无头可跑）：验「场景装配是否正确」，不验画面
#
# 分工：画面必须开窗口看（路线图 §4.4），所以这一步只断言结构——
# 节点是否真的建出来、程序化贴图是否真的接到材质上、预设开关是否真的生效、
# 灯与阴影配额是否符合设计。这样即使不看图，也能第一时间抓到装配层的回归。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/ta_health_check.gd
extends SceneTree

const Rig := preload("res://scripts/camera_rig.gd")

var fails := 0
var checks := 0


func _initialize() -> void:
	print("TA-CHECK-BEGIN")
	var scene := (load("res://scenes/ta_bench.tscn") as PackedScene)
	if scene == null:
		_fail("主场景加载失败")
		quit(1)
		return
	var root_node := scene.instantiate()
	root.add_child(root_node)
	# 装配发生在 _ready 里，必须等帧
	await process_frame
	await process_frame

	var we := root_node.get_node_or_null("WorldEnvironment") as WorldEnvironment
	_check(we != null, "WorldEnvironment 存在")
	if we == null:
		quit(1)
		return
	var env := we.environment
	_check(env != null, "Environment 已创建")
	_check(env.sdfgi_enabled, "基准档启用 SDFGI")
	_check(env.ssao_enabled, "基准档启用 SSAO")
	_check(env.ssil_enabled, "基准档启用 SSIL")
	_check(env.volumetric_fog_enabled, "基准档启用体积雾")
	_check(env.glow_enabled, "基准档启用 glow")
	_check(env.tonemap_mode == Environment.TONE_MAPPER_AGX, "基准档色调映射为 AgX")
	_check(env.adjustment_enabled, "基准档启用调色")
	print("TA-CHECK lut=%s" % str(env.adjustment_color_correction != null))
	_check(env.sky != null, "天空已装配")
	if env.sky != null:
		var sm := env.sky.sky_material as ProceduralSkyMaterial
		_check(sm != null and sm.sky_cover != null, "天空云层图由代码生成")

	# 结构统计
	var hall := root_node.get_node_or_null("Hall") as Node3D
	var props := root_node.get_node_or_null("Props") as Node3D
	var lights := root_node.get_node_or_null("Lights") as Node3D
	_check(hall != null, "Hall 分组存在")
	_check(props != null, "Props 分组存在")
	_check(lights != null, "Lights 分组存在")
	if hall == null or props == null or lights == null:
		quit(1)
		return

	var mesh_nodes := _count_type(hall, "MeshInstance3D") + _count_type(props, "MeshInstance3D")
	var mm_nodes := _count_type(hall, "MultiMeshInstance3D") + _count_type(props, "MultiMeshInstance3D")
	var decals := _count_type(props, "Decal")
	var parts := _count_type(props, "GPUParticles3D")
	var fogs := _count_type(root_node, "FogVolume")
	_check(mesh_nodes >= 20, "MeshInstance3D 数量足够（实测 %d）" % mesh_nodes)
	_check(mm_nodes >= 5, "MultiMesh 实例化分组足够（实测 %d）" % mm_nodes)
	_check(decals >= 20, "Decal 细节层足够（实测 %d）" % decals)
	_check(parts == 3, "粒子发射器 3 个（实测 %d）" % parts)
	_check(fogs >= 3, "FogVolume 局部雾团足够（实测 %d）" % fogs)

	# 几何完整性：面数落在预期区间才能证明参数曲面没被「退化剔除」吃掉
	# （曾经因 _normal_at 的退化阈值把 1×1 小面片全丢，导致整面墙不可见而画面看起来「只是雾大」）
	var geo_expect := {
		"Wall": 3000, "Skirt": 200, "Entablature": 300, "GalleryFascia": 300,
		"Cornice": 300, "Dome": 8000, "Floor": 900, "DaisSteps": 1200, "Ridges": 8000,
	}
	for gname in geo_expect.keys():
		var mi := _find_mesh(hall, String(gname))
		if mi == null:
			_check(false, "几何 %s 存在" % String(gname))
			continue
		var t := _mesh_tris(mi.mesh)
		_check(t >= int(geo_expect[gname]), "几何 %s 面数 %d ≥ %d" % [String(gname), t, int(geo_expect[gname])])
		if String(gname) == "Wall":
			_sample_radius(mi)

	# 材质是否真的接到程序化贴图
	var probed := _probe_material(root_node)
	_check(probed["with_albedo"] >= 3, "至少 3 个材质带程序 albedo 贴图（实测 %d）" % int(probed["with_albedo"]))
	_check(probed["with_normal"] >= 3, "至少 3 个材质带程序 normal 贴图（实测 %d）" % int(probed["with_normal"]))
	_check(probed["triplanar"] >= 2, "世界三向投影材质 ≥2（实测 %d）" % int(probed["triplanar"]))

	# 灯光与阴影配额
	var sun := lights.get_node_or_null("Sun") as DirectionalLight3D
	_check(sun != null and sun.shadow_enabled, "太阳开阴影")
	_check(sun != null and sun.directional_shadow_mode == DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS, "太阳用 4 级联阴影")
	var rose := lights.get_node_or_null("RoseSpot") as SpotLight3D
	_check(rose != null and rose.light_projector != null, "玫瑰窗 gobo 投影已接")
	_check(rose != null and rose.shadow_enabled, "投影聚光必须开阴影才出光斑")
	var omnis := _count_type(lights, "OmniLight3D")
	var spots := _count_type(lights, "SpotLight3D")
	var shadowed := _shadowed_lights(lights)
	_check(omnis >= 10, "点光源数量足够（实测 %d）" % omnis)
	_check(spots >= 5, "聚光灯数量足够（实测 %d）" % spots)
	_check(shadowed <= 6, "开阴影的灯 ≤6，配额受控（实测 %d）" % shadowed)

	# 相机与机位
	var cam := _find_camera(root_node)
	_check(cam != null, "相机已激活")
	if cam != null:
		_check(cam.attributes != null, "挂了相机属性（曝光/景深）")
		_check(Rig.VIEWS.size() >= 8, "机位清单 ≥8")

	print("TA-CHECK tris_arraymesh=%d checks=%d fails=%d" % [int(probed["tris"]), checks, fails])
	_dump_geometry(hall)
	_dump_geometry(props)
	_dump_lights(lights)
	_check_normals(hall)
	if fails > 0:
		print("TA-CHECK RESULT=FAIL")
	else:
		print("TA-CHECK RESULT=PASS")
	quit(0 if fails == 0 else 1)


func _check(cond: bool, label: String) -> void:
	checks += 1
	if cond:
		print("[OK] " + label)
	else:
		fails += 1
		print("[FAIL] " + label)


func _fail(label: String) -> void:
	checks += 1
	fails += 1
	print("[FAIL] " + label)


static func _count_type(node: Node, type_name: String) -> int:
	var n := 0
	for c in node.get_children():
		if c.get_class() == type_name:
			n += 1
		n += _count_type(c, type_name)
	return n


static func _shadowed_lights(node: Node) -> int:
	var n := 0
	for c in node.get_children():
		if c is Light3D and (c as Light3D).shadow_enabled:
			n += 1
		n += _shadowed_lights(c)
	return n


# 抽查材质：统计带 albedo/normal 贴图与世界三向投影的材质，顺带累计 ArrayMesh 面数
static func _probe_material(node: Node) -> Dictionary:
	var out := {"with_albedo": 0, "with_normal": 0, "triplanar": 0, "tris": 0}
	for c in node.get_children():
		var mi := c as MeshInstance3D
		if mi != null and mi.mesh != null:
			var mat := mi.material_override as StandardMaterial3D
			if mat != null:
				if mat.albedo_texture != null:
					out["with_albedo"] = int(out["with_albedo"]) + 1
				if mat.normal_enabled and mat.normal_texture != null:
					out["with_normal"] = int(out["with_normal"]) + 1
				if mat.uv1_world_triplanar:
					out["triplanar"] = int(out["triplanar"]) + 1
			out["tris"] = int(out["tris"]) + _mesh_tris(mi.mesh)
		var mm := c as MultiMeshInstance3D
		if mm != null and mm.multimesh != null:
			out["tris"] = int(out["tris"]) + _mesh_tris(mm.multimesh.mesh) * mm.multimesh.instance_count
		var sub: Dictionary = _probe_material(c)
		out["with_albedo"] = int(out["with_albedo"]) + int(sub["with_albedo"])
		out["with_normal"] = int(out["with_normal"]) + int(sub["with_normal"])
		out["triplanar"] = int(out["triplanar"]) + int(sub["triplanar"])
		out["tris"] = int(out["tris"]) + int(sub["tris"])
	return out


static func _mesh_tris(mesh: Mesh) -> int:
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


static func _find_camera(node: Node) -> Camera3D:
	if node is Camera3D and (node as Camera3D).current:
		return node as Camera3D
	for c in node.get_children():
		var r := _find_camera(c)
		if r != null:
			return r
	return null


# 按名字找 MeshInstance3D
static func _find_mesh(node: Node, name: String) -> MeshInstance3D:
	for c in node.get_children():
		var mi := c as MeshInstance3D
		if mi != null and mi.name == name and mi.mesh != null:
			return mi
		var r := _find_mesh(c, name)
		if r != null:
			return r
	return null


# 抽查顶点到轴心的程度平半径与高度：确认「墙真的在 r≈12 上」而不是贴到了原点
static func _sample_radius(mi: MeshInstance3D) -> void:
	var arr: Array = mi.mesh.surface_get_arrays(0)
	var verts: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
	var n := verts.size()
	if n == 0:
		print("TA-GEO Wall 顶点为空")
		return
	var rmin := 1e9
	var rmax := -1e9
	var ymin := 1e9
	var ymax := -1e9
	var step := maxi(1, n / 400)
	for i in range(0, n, step):
		var p: Vector3 = verts[i]
		var rr := Vector2(p.x, p.z).length()
		rmin = minf(rmin, rr)
		rmax = maxf(rmax, rr)
		ymin = minf(ymin, p.y)
		ymax = maxf(ymax, p.y)
	print("TA-GEO Wall 顶点数=%d 水平半径 %.2f..%.2f 高度 %.2f..%.2f" % [n, rmin, rmax, ymin, ymax])
	# NaN / 法线缺失检查：一个 NaN 就能让整面网格在 GPU 上消失
	var norms: PackedVector3Array = arr[Mesh.ARRAY_NORMAL]
	var nan_v := 0
	var nan_n := 0
	var zero_n := 0
	for i in n:
		var p: Vector3 = verts[i]
		if not (is_finite(p.x) and is_finite(p.y) and is_finite(p.z)):
			nan_v += 1
	if norms.size() == n:
		for i in n:
			var q: Vector3 = norms[i]
			if not (is_finite(q.x) and is_finite(q.y) and is_finite(q.z)):
				nan_n += 1
			elif q.length_squared() < 0.5:
				zero_n += 1
	else:
		print("TA-GEO Wall 法线数组长度=%d（顶点 %d）" % [norms.size(), n])
	print("TA-GEO Wall NaN顶点=%d NaN法线=%d 零长法线=%d 首三角=%s %s %s" % [
		nan_v, nan_n, zero_n, str(verts[0]), str(verts[1]), str(verts[2])])
	# 索引数组完整性：SurfaceTool 交出来的网格是**无索引**的（ARRAY_INDEX 为 null），
	# 所以这里必须用 Variant 接，直接写成 PackedInt32Array 会报「assign Nil」而弄挂整个步骤
	var idxRaw: Variant = arr[Mesh.ARRAY_INDEX]
	var imax := 0
	if idxRaw is PackedInt32Array:
		var idx := idxRaw as PackedInt32Array
		for i in idx.size():
			imax = maxi(imax, idx[i])
	print("TA-GEO Wall surface=%d 索引=%s 最大索引=%d 顶点=%d aabb=%s" % [
		mi.mesh.get_surface_count(), str(idxRaw is PackedInt32Array), imax, n, str(mi.mesh.get_aabb())])


# 法线朝向实测：取最靠近某个探针点的顶点，看法线与「离轴方向」的点积符号。
# > 0 表示法线朝外（从厅内看是背面，会被剔除或变成黑面），< 0 表示朝厅内。
static func _check_normals(hall: Node3D) -> void:
	for pair in [["Wall", Vector3(12, 6, 0)], ["Dome", Vector3(8.5, 14.5, 0)], ["Floor", Vector3(6, 0, 0)]]:
		var mi := _find_mesh(hall, String(pair[0]))
		if mi == null:
			continue
		var arr: Array = mi.mesh.surface_get_arrays(0)
		var verts: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
		var norms: PackedVector3Array = arr[Mesh.ARRAY_NORMAL]
		var probe: Vector3 = pair[1] as Vector3
		var best := -1
		var bestd := 1e9
		for i in verts.size():
			var d: float = verts[i].distance_squared_to(probe)
			if d < bestd:
				bestd = d
				best = i
		if best < 0 or norms.size() <= best:
			continue
		var p := verts[best]
		var outward := Vector3(p.x, 0, p.z)
		if String(pair[0]) == "Floor":
			outward = Vector3.UP
		if outward.length_squared() < 0.01:
			continue
		var n := norms[best]
		var dot := n.dot(outward.normalized())
		print("TA-NORM %-6s 探针(%s) 法线(%s) 与朝外方向点积=%+.3f ⇒ %s" % [
			String(pair[0]), str(p), str(n), dot, "朝外" if dot > 0 else "朝内/朝上"])


# 灯光清单：报告里的「灯表」直接从这里抄，避免文档与代码脱节
static func _dump_lights(node: Node) -> void:
	for c in node.get_children():
		var l := c as Light3D
		if l != null:
			var extra := ""
			var sp := c as SpotLight3D
			if sp != null:
				extra = " angle=%.0f range=%.0f atten=%.2f proj=%s" % [
					sp.spot_angle, sp.spot_range, sp.spot_attenuation,
					"yes" if sp.light_projector != null else "no"]
			var om := c as OmniLight3D
			if om != null:
				extra = " range=%.1f atten=%.2f" % [om.omni_range, om.omni_attenuation]
			print("TA-LIGHT %-14s %s energy=%.2f vis=%s shadow=%s vf_ene=%.1f ind=%.2f%s" % [
				l.name, l.get_class().trim_prefix("Light3D"), l.light_energy, str(l.visible),
				str(l.shadow_enabled), l.light_volumetric_fog_energy, l.light_indirect_energy, extra])
			print("             pos=%s rot_deg=%s" % [str(l.global_position), str(l.global_rotation_degrees)])
		_dump_lights(c)


static func _dump_geometry(node: Node) -> void:
	for c in node.get_children():
		var mi := c as MeshInstance3D
		if mi != null and mi.mesh != null:
			var ab := mi.get_aabb()
			print("TA-GEO %-18s tris=%7d aabb=pos(%.1f,%.1f,%.1f) size=(%.1f,%.1f,%.1f) mat=%s" % [
				mi.name, _mesh_tris(mi.mesh), ab.position.x, ab.position.y, ab.position.z,
				ab.size.x, ab.size.y, ab.size.z,
				(mi.material_override.get_class() if mi.material_override != null else "none")])
		var mmn := c as MultiMeshInstance3D
		if mmn != null and mmn.multimesh != null:
			print("TA-GEO %-18s inst=%5d tris_each=%d" % [mmn.name, mmn.multimesh.instance_count, _mesh_tris(mmn.multimesh.mesh)])
		_dump_geometry(c)
