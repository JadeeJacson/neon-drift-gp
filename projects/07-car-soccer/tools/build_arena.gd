extends SceneTree
## build_arena.gd — 程序化生成夜景球场 arena.tscn（改参数重跑即生效，06 的路线）。
## 结构：地坪 + 四面围墙 + 两端球门（发光门框 + 内笼 + 进球传感器）+ 夜空环境 +
## 月光 + 四角泛光灯塔 + 看台/城市剪影 + boost pad（大×6 小×12）。
## 布局常量与 scripts/arena.gd 保持一致（那边是运行期接口）。
## 跑法：$GODOT --headless --path projects/07-car-soccer -s res://tools/build_arena.gd

const ArenaScript = preload("res://scripts/arena.gd")
const PadScript = preload("res://scripts/boost_pad.gd")

const HX := 36.0        # 场地半长（x）
const HZ := 22.0        # 场地半宽（z）
const WH := 12.0        # 墙高
const GW := 6.0         # 球门半宽
const GH := 4.0         # 球门高
const GD := 3.5         # 球门深

const TEX_FLOOR := "res://assets/textures/prototype/dark_01.png"
const TEX_WALL := "res://assets/textures/prototype/dark_02.png"
const NEON_BLUE := Color(0.22, 0.85, 1.0)
const NEON_ORANGE := Color(1.0, 0.55, 0.2)
const NEON_CYAN := Color(0.3, 0.95, 1.0)

var _arena: Node3D


func _init() -> void:
	_run()


func _run() -> void:
	_arena = Node3D.new()
	_arena.name = "Arena"
	_arena.set_script(ArenaScript)
	_arena.add_to_group("arena")

	_add_environment()
	_add_floor_and_walls()
	_add_goal(-1, NEON_BLUE, "blue")
	_add_goal(1, NEON_ORANGE, "orange")
	_add_field_markings()
	_add_floodlights()
	_add_seats()
	_add_city()
	_add_pads()

	_set_owner_recursive(_arena)
	var ps := PackedScene.new()
	ps.pack(_arena)
	var err := ResourceSaver.save(ps, "res://scenes/arena.tscn")
	print("[build_arena] save -> ", err, "  nodes=", _arena.get_child_count())
	quit(0 if err == OK else 1)


## ⚠️ PackedScene.pack() 只收录 owner 非空的节点，且必须逐层设置——
## 只设直接子节点会让所有孙节点（碰撞形状！）静默丢失，球场变空壳。
func _set_owner_recursive(node: Node) -> void:
	if node != _arena:
		node.owner = _arena
	for child in node.get_children():
		_set_owner_recursive(child)


func _env_mat(color: Color, energy: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(color.r * 0.25, color.g * 0.25, color.b * 0.25)
	m.emission_enabled = true
	m.emission = color
	m.emission_energy_multiplier = energy
	return m


func _tex_mat(path: String, tint: Color, uv: float) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = load(path)
	m.albedo_color = tint
	m.uv1_triplanar = true
	m.uv1_scale = Vector3.ONE * uv
	m.roughness = 0.92
	return m


func _box(parent: Node, name: String, size: Vector3, pos: Vector3, mat: Material, collide: bool, yaw_deg := 0.0) -> void:
	var body: Node3D
	if collide:
		var sb := StaticBody3D.new()
		sb.collision_layer = 1
		sb.collision_mask = 0
		body = sb
	else:
		body = Node3D.new()
	body.name = name
	body.position = pos
	body.rotation_degrees = Vector3(0, yaw_deg, 0)
	parent.add_child(body)
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	mi.mesh = bm
	mi.material_override = mat
	body.add_child(mi)
	if collide:
		var cs := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = size
		cs.shape = shape
		body.add_child(cs)


func _add_environment() -> void:
	var we := WorldEnvironment.new()
	we.name = "Environment"
	var env := Environment.new()
	var sky := Sky.new()
	var sky_mat := PanoramaSkyMaterial.new()
	sky_mat.panorama = load("res://assets/textures/skybox_night.png")
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.9
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = 1.12
	env.glow_enabled = true
	env.glow_intensity = 0.9
	env.glow_bloom = 0.05
	env.glow_hdr_threshold = 1.0
	env.fog_enabled = true
	env.fog_light_color = Color(0.05, 0.08, 0.16)
	env.fog_density = 0.006
	env.fog_sky_affect = 0.2
	we.environment = env
	_arena.add_child(we)

	var moon := DirectionalLight3D.new()
	moon.name = "Moonlight"
	moon.rotation_degrees = Vector3(-38, 32, 0)
	moon.light_color = Color(0.72, 0.82, 1.0)
	moon.light_energy = 0.42
	moon.shadow_enabled = true
	_arena.add_child(moon)


func _add_floor_and_walls() -> void:
	var floor_mat := _tex_mat(TEX_FLOOR, Color(0.5, 0.55, 0.68), 0.22)
	var wall_mat := _tex_mat(TEX_WALL, Color(0.42, 0.46, 0.58), 0.3)
	_box(_arena, "Floor", Vector3(HX * 2 + 12, 1, HZ * 2 + 12), Vector3(0, -0.5, 0), floor_mat, true)
	# 侧墙（z±）与端墙分段（给球门留口）
	_box(_arena, "WallSideN", Vector3(HX * 2 + 4, WH, 2), Vector3(0, WH / 2, -HZ - 1), wall_mat, true)
	_box(_arena, "WallSideS", Vector3(HX * 2 + 4, WH, 2), Vector3(0, WH / 2, HZ + 1), wall_mat, true)
	# 端墙分段：球门开口（GW*2 宽 × GH 高）两侧的墙段 + 门楣
	for sx in [-1, 1]:
		var ex: float = sx * (HX + 1)
		_box(_arena, "WallEnd%d_north" % sx, Vector3(2, WH, HZ - GW), Vector3(ex, WH / 2, -(GW + HZ) / 2.0), wall_mat, true)
		_box(_arena, "WallEnd%d_south" % sx, Vector3(2, WH, HZ - GW), Vector3(ex, WH / 2, (GW + HZ) / 2.0), wall_mat, true)
		_box(_arena, "WallEnd%d_lintel" % sx, Vector3(2, WH - GH, GW * 2), Vector3(ex, GH + (WH - GH) / 2.0, 0), wall_mat, true)


func _add_goal(dir: int, neon: Color, defended: String) -> void:
	var gx := dir * (HX + 1)
	var frame_mat := _env_mat(neon, 2.6)
	# 门框：两立柱 + 横梁
	_box(_arena, "GoalPost_%s_1" % defended, Vector3(0.4, GH, 0.4), Vector3(gx, GH / 2, -GW), frame_mat, false)
	_box(_arena, "GoalPost_%s_2" % defended, Vector3(0.4, GH, 0.4), Vector3(gx, GH / 2, GW), frame_mat, false)
	_box(_arena, "GoalBar_%s" % defended, Vector3(0.4, 0.4, GW * 2 + 0.4), Vector3(gx, GH, 0), frame_mat, false)
	# 门内笼（深 GD）：后墙 + 两侧 + 地面
	var cage := _tex_mat(TEX_WALL, Color(0.2, 0.22, 0.3), 0.3)
	var bx := dir * (HX + 1 + GD / 2.0)
	_box(_arena, "GoalBack_%s" % defended, Vector3(0.5, GH + 1.5, GW * 2 + 1), Vector3(dir * (HX + 1 + GD), (GH + 1.5) / 2, 0), cage, true)
	_box(_arena, "GoalSide_%s_1" % defended, Vector3(GD, GH + 1.5, 0.5), Vector3(bx, (GH + 1.5) / 2, -(GW + 0.25)), cage, true)
	_box(_arena, "GoalSide_%s_2" % defended, Vector3(GD, GH + 1.5, 0.5), Vector3(bx, (GH + 1.5) / 2, GW + 0.25), cage, true)
	# 进球传感器：门线后一点，只监控球（mask = 球层 4）
	var sensor := Area3D.new()
	sensor.name = "GoalSensor_%s" % defended
	sensor.collision_layer = 0
	sensor.collision_mask = 4
	sensor.monitorable = false
	sensor.set_meta("defended_team", defended)
	sensor.add_to_group("goal_sensor")
	sensor.position = Vector3(dir * (HX + 1.6), GH / 2, 0)
	var cs := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(GD - 0.7, GH, GW * 2)
	cs.shape = shape
	sensor.add_child(cs)
	var glow := MeshInstance3D.new()
	var gm := BoxMesh.new()
	gm.size = Vector3(GD - 0.7, 0.1, GW * 2)
	glow.mesh = gm
	glow.material_override = _env_mat(neon, 1.4)
	glow.position = Vector3(0, -GH / 2 + 0.06, 0)
	sensor.add_child(glow)
	_arena.add_child(sensor)


func _add_field_markings() -> void:
	var cyan := _env_mat(NEON_CYAN, 1.7)
	var circle := MeshInstance3D.new()
	circle.name = "CenterCircle"
	var torus := TorusMesh.new()
	torus.inner_radius = 8.6
	torus.outer_radius = 9.0
	circle.mesh = torus
	circle.material_override = cyan
	circle.position = Vector3(0, 0.03, 0)
	_arena.add_child(circle)
	_box(_arena, "HalfwayLine", Vector3(0.3, 0.04, HZ * 2 - 2), Vector3(0, 0.03, 0), cyan, false)
	# 墙顶霓虹描边（四条）
	var trim := _env_mat(NEON_CYAN, 1.3)
	_box(_arena, "TrimN", Vector3(HX * 2 + 4, 0.25, 0.25), Vector3(0, WH + 0.1, -HZ - 1), trim, false)
	_box(_arena, "TrimS", Vector3(HX * 2 + 4, 0.25, 0.25), Vector3(0, WH + 0.1, HZ + 1), trim, false)
	_box(_arena, "TrimW", Vector3(0.25, 0.25, HZ * 2 + 4), Vector3(-HX - 1, WH + 0.1, 0), trim, false)
	_box(_arena, "TrimE", Vector3(0.25, 0.25, HZ * 2 + 4), Vector3(HX + 1, WH + 0.1, 0), trim, false)


func _add_floodlights() -> void:
	var pole_mat := StandardMaterial3D.new()
	pole_mat.albedo_color = Color(0.16, 0.18, 0.24)
	var lamp_mat := _env_mat(Color(1.0, 0.93, 0.78), 3.2)
	for sx in [-1, 1]:
		for sz in [-1, 1]:
			var px: float = sx * (HX + 9)
			var pz: float = sz * (HZ + 9)
			var pole := MeshInstance3D.new()
			pole.name = "LightPole_%d_%d" % [sx, sz]
			var cm := CylinderMesh.new()
			cm.top_radius = 0.35
			cm.bottom_radius = 0.55
			cm.height = 20.0
			pole.mesh = cm
			pole.material_override = pole_mat
			pole.position = Vector3(px, 10, pz)
			_arena.add_child(pole)
			var lamp := MeshInstance3D.new()
			lamp.name = "LightLamp_%d_%d" % [sx, sz]
			var sm := SphereMesh.new()
			sm.radius = 0.9
			sm.height = 1.8
			lamp.mesh = sm
			lamp.material_override = lamp_mat
			lamp.position = Vector3(px, 20.4, pz)
			_arena.add_child(lamp)
			var spot := SpotLight3D.new()
			spot.name = "Floodlight_%d_%d" % [sx, sz]
			spot.position = Vector3(px, 20, pz)
			var to_center := (Vector3(sx * 8, 0, sz * 6) - Vector3(px, 20, pz)).normalized()
			spot.basis = Basis.looking_at(to_center, Vector3.UP)
			spot.light_color = Color(1.0, 0.94, 0.82)
			spot.light_energy = 9.0
			spot.spot_range = 62.0
			spot.spot_angle = 42.0
			_arena.add_child(spot)


func _add_seats() -> void:
	var models := [
		"res://assets/models/decor/stadium-seats-KAHX68dbXO.glb",
		"res://assets/models/decor/stadium-seats-3eKUbGjEPv.glb",
		"res://assets/models/decor/stadium-seats-wtYoArecHj.glb",
	]
	var idx := 0
	for side in [-1, 1]:
		for i in range(3):
			var mi := MeshInstance3D.new()
			var ps: PackedScene = load(models[idx % models.size()])
			idx += 1
			mi.mesh = _first_mesh(ps)
			mi.name = "Seats_%d_%d" % [side, i]
			mi.position = Vector3(-24.0 + i * 24.0, 0, side * (HZ + 7.5))
			mi.rotation_degrees = Vector3(0, 180 if side > 0 else 0, 0)
			_arena.add_child(mi)


func _add_city() -> void:
	var buildings := [
		"res://assets/models/decor/building-skyscraper-a.glb",
		"res://assets/models/decor/building-skyscraper-c.glb",
		"res://assets/models/decor/building-skyscraper-e.glb",
		"res://assets/models/decor/building-a.glb",
		"res://assets/models/decor/building-f.glb",
		"res://assets/models/decor/building-k.glb",
		"res://assets/models/decor/low-detail-building-a.glb",
		"res://assets/models/decor/low-detail-building-wide-a.glb",
	]
	# 固定座标环（不用 RNG，保证重跑产物稳定可 diff）
	var ring := [
		[64, 30, 0, 16.0], [78, 34, 1, 18.0], [60, -32, 2, 17.0], [82, -30, 3, 14.0],
		[-64, 32, 4, 15.0], [-80, 30, 5, 19.0], [-62, -34, 6, 16.0], [-84, -28, 7, 18.0],
		[30, 44, 1, 17.0], [52, 46, 3, 15.0], [-34, 46, 0, 18.0], [-56, 44, 2, 16.0],
		[32, -46, 5, 17.0], [54, -44, 7, 15.0], [-30, -46, 6, 18.0], [-58, -44, 4, 16.0],
		[95, 8, 2, 20.0], [-95, -6, 0, 20.0],
	]
	var cache: Dictionary = {}
	for i in range(ring.size()):
		var spec: Array = ring[i]
		var path: String = buildings[int(spec[2]) % buildings.size()]
		if not cache.has(path):
			cache[path] = _first_mesh(load(path))
		var mi := MeshInstance3D.new()
		mi.mesh = cache[path]
		mi.name = "City_%d" % i
		mi.position = Vector3(spec[0], 0, spec[1])
		mi.scale = Vector3.ONE * float(spec[3])
		_arena.add_child(mi)


func _first_mesh(ps: PackedScene) -> Mesh:
	var inst := ps.instantiate()
	var found: Mesh = _find_mesh(inst)
	inst.free()
	return found


func _find_mesh(node: Node) -> Mesh:
	if node is MeshInstance3D:
		var m := (node as MeshInstance3D).mesh
		if m != null:
			return m
	for child in node.get_children():
		var r := _find_mesh(child)
		if r != null:
			return r
	return null


func _add_pads() -> void:
	var big_positions := [
		Vector3(-30, 0, 0), Vector3(30, 0, 0),
		Vector3(-18, 0, 19), Vector3(18, 0, 19),
		Vector3(-18, 0, -19), Vector3(18, 0, -19),
	]
	var small_positions := [
		Vector3(0, 0, -10), Vector3(0, 0, 10),
		Vector3(10, 0, -14), Vector3(10, 0, 14), Vector3(-10, 0, -14), Vector3(-10, 0, 14),
		Vector3(22, 0, -8), Vector3(22, 0, 8), Vector3(-22, 0, -8), Vector3(-22, 0, 8),
		Vector3(0, 0, -20), Vector3(0, 0, 20),
	]
	for i in range(big_positions.size()):
		_make_pad("BigPad_%d" % i, big_positions[i], true)
	for i in range(small_positions.size()):
		_make_pad("SmallPad_%d" % i, small_positions[i], false)


func _make_pad(pad_name: String, pos: Vector3, big: bool) -> void:
	var pad := Area3D.new()
	pad.name = pad_name
	pad.set_script(PadScript)
	pad.collision_layer = 0
	pad.collision_mask = 2
	pad.position = pos
	pad.set_meta("is_big", big)
	var cs := CollisionShape3D.new()
	var shape := CylinderShape3D.new()
	shape.radius = 2.0 if big else 1.3
	shape.height = 2.4
	cs.shape = shape
	cs.position = Vector3(0, 1.2, 0)
	pad.add_child(cs)
	var glow := MeshInstance3D.new()
	glow.name = "Glow"
	if big:
		var torus := TorusMesh.new()
		torus.inner_radius = 1.15
		torus.outer_radius = 1.55
		glow.mesh = torus
		glow.material_override = _env_mat(Color(1.0, 0.72, 0.2), 2.4)
		glow.position = Vector3(0, 0.25, 0)
		var core := MeshInstance3D.new()
		var sm := SphereMesh.new()
		sm.radius = 0.42
		sm.height = 0.84
		core.mesh = sm
		core.material_override = _env_mat(Color(1.0, 0.85, 0.4), 3.0)
		core.position = Vector3(0, 0.5, 0)
		core.name = "Core"
		glow.add_child(core)
	else:
		var disc := CylinderMesh.new()
		disc.top_radius = 1.0
		disc.bottom_radius = 1.0
		disc.height = 0.12
		glow.mesh = disc
		glow.material_override = _env_mat(NEON_CYAN, 1.8)
		glow.position = Vector3(0, 0.08, 0)
	pad.add_child(glow)
	var sfx := AudioStreamPlayer3D.new()
	sfx.name = "PickupSound"
	sfx.stream = load("res://assets/audio/sfx/ui/switch2.ogg")
	sfx.unit_size = 10.0
	sfx.volume_db = -4.0
	pad.add_child(sfx)
	_arena.add_child(pad)
	pad.setup(big)
