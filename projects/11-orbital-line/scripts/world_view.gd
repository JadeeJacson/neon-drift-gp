class_name WorldView
extends Node3D

# 渲染层：把 sim 的纯状态翻译成看得见的东西。
# 分工纪律（路线图 §4.3）：sim 只管产出事件，view 只管表现，两者不共享随机源。

const CELL: float = 4.0

const P_TD: String = "res://assets/models/defense/kenney_tower-defense-kit/Models/glb/"
const P_PP_DEF: String = "res://assets/models/defense/polypizza/"
const P_PP_CHR: String = "res://assets/models/characters/polypizza/"
const P_PP_ENV: String = "res://assets/models/environment/polypizza/"

const TOWER_BASE: String = P_TD + "tower-round-base.glb"
const TOWER_TOP: Array = [
	P_TD + "tower-round-bottom-a.glb",
	P_TD + "tower-round-middle-a.glb",
	P_TD + "tower-round-roof-a.glb",
]
const FEATURE: Dictionary = {
	"vulcan": P_TD + "weapon-turret.glb",
	"laser": P_PP_DEF + "laser-h2P7oQ8RVg.glb",
	"missile": P_PP_DEF + "cannon-J15vlPVvKK.glb",
	"tesla": P_TD + "detail-crystal.glb",
	"generator": P_PP_ENV + "generator-K58RQ63qR5.glb",
}
const ENEMY_MODEL: Dictionary = {
	"drone": P_TD + "enemy-ufo-a.glb",
	"tank": P_PP_CHR + "tank-FA5daiyZQq.glb",
	"shield_mech": P_TD + "enemy-ufo-c.glb",
	"repair": P_TD + "enemy-ufo-b.glb",
	"bomber": P_TD + "enemy-ufo-d.glb",
	"walker": P_PP_CHR + "at-st-6jqEk8QiL0m.glb",
}
const FLYING: Array = ["drone"]

# 场景装饰：第一版只用程序化灰方块铺地，素材库里的工业套件完全没上场——
# 这是「氛围完全没有」的直接原因。外围一圈厂房/管道/储罐把基地感撑起来。
const GROUND_TEX: String = "res://assets/textures/kenney_prototype-textures/PNG/Dark/texture_04.png"
const P_FACTORY: String = "res://assets/models/environment/kenney_factory-kit/Models/GLB format/"
const P_CITY: String = "res://assets/models/environment/kenney_city-kit-industrial/Models/GLB format/"
const PROPS: Array = [
	P_FACTORY + "machine.glb",
	P_FACTORY + "machine-fortified.glb",
	P_FACTORY + "pipe-glass-large-long.glb",
	P_FACTORY + "pipe-glass-large-curve.glb",
	P_FACTORY + "machine-connection-pipe.glb",
	P_CITY + "building-a.glb",
	P_CITY + "building-c.glb",
	P_CITY + "building-e.glb",
	P_CITY + "building-g.glb",
	P_CITY + "building-i.glb",
]

const SFX_FIRE: Array = [
	"res://assets/audio/sfx/kenney_digital-audio/laser1.ogg",
	"res://assets/audio/sfx/kenney_digital-audio/laser2.ogg",
	"res://assets/audio/sfx/kenney_digital-audio/laser3.ogg",
	"res://assets/audio/sfx/kenney_digital-audio/laser4.ogg",
]
const SFX_BOOM: Array = [
	"res://assets/audio/sfx/kenney_sci-fi-sounds/explosionCrunch_000.ogg",
	"res://assets/audio/sfx/kenney_sci-fi-sounds/explosionCrunch_001.ogg",
	"res://assets/audio/sfx/kenney_sci-fi-sounds/explosionCrunch_002.ogg",
]
const SFX_BUILD: String = "res://assets/audio/sfx/kenney_digital-audio/highUp.ogg"
const SFX_DENY: String = "res://assets/audio/sfx/kenney_digital-audio/highDown.ogg"

var sim: MatchSim
var tiles: Array = []
var tower_nodes: Dictionary = {}
var enemy_nodes: Dictionary = {}
var hover_cell: Vector2i = Vector2i(-1, -1)
var hover_ok: bool = false
var shake: float = 0.0
var _scale_cache: Dictionary = {}
var _fx: Array = []
var _audio: Array = []
var _mat_empty: StandardMaterial3D
var _mat_path: StandardMaterial3D
var _mat_spawn: StandardMaterial3D
var _mat_core: StandardMaterial3D
var _mat_ok: StandardMaterial3D
var _mat_bad: StandardMaterial3D
var _sfx_cache: Dictionary = {}


func setup(s: MatchSim) -> void:
	sim = s
	_make_materials()
	_build_ground()
	_build_props()
	refresh_ground()
	# 少量音效播放器（并发开火时轮着用，避免每发一次就建一个节点）
	for i in range(6):
		var p: AudioStreamPlayer = AudioStreamPlayer.new()
		add_child(p)
		_audio.append(p)


func _make_materials() -> void:
	_mat_empty = _mat(Color(0.16, 0.19, 0.24), Color(0, 0, 0), 0.0)
	# 地面贴一层原型网格纹理，纯色方块看起来像灰盒——这条很便宜但观感提升明显
	if ResourceLoader.exists(GROUND_TEX):
		var tex = load(GROUND_TEX) as Texture2D
		if tex != null:
			_mat_empty.albedo_texture = tex
			_mat_empty.uv1_scale = Vector3(0.6, 0.6, 1.0)
			_mat_empty.albedo_color = Color(0.55, 0.62, 0.72)
	_mat_path = _mat(Color(0.18, 0.45, 0.55), Color(0.05, 0.35, 0.45), 0.35)
	_mat_spawn = _mat(Color(0.55, 0.16, 0.16), Color(0.4, 0.05, 0.05), 0.35)
	_mat_core = _mat(Color(0.75, 0.62, 0.20), Color(0.5, 0.4, 0.05), 0.5)
	_mat_ok = _mat(Color(0.20, 0.70, 0.35), Color(0.05, 0.4, 0.2), 0.45)
	_mat_bad = _mat(Color(0.75, 0.20, 0.20), Color(0.45, 0.05, 0.05), 0.45)


func _mat(c: Color, e: Color, energy: float) -> StandardMaterial3D:
	var m: StandardMaterial3D = StandardMaterial3D.new()
	m.albedo_color = c
	m.emission_enabled = energy > 0.0
	m.emission = e
	m.emission_energy_multiplier = energy
	m.roughness = 0.85
	return m


func _build_ground() -> void:
	var box: BoxMesh = BoxMesh.new()
	box.size = Vector3(CELL * 0.94, 0.35, CELL * 0.94)
	for y in range(sim.grid.height):
		for x in range(sim.grid.width):
			var mi: MeshInstance3D = MeshInstance3D.new()
			mi.mesh = box
			mi.position = Vector3((float(x) + 0.5) * CELL, -0.18, (float(y) + 0.5) * CELL)
			add_child(mi)
			tiles.append(mi)


# 外围装饰层：只摆在网格外圈，不占用可建造区域，也不会挡住玩家视线里的路径
func _build_props() -> void:
	var rng: RandomNumberGenerator = RandomNumberGenerator.new()
	rng.seed = 20260927  # 固定种子：每次启动布局一致，便于对比改动前后的观感
	var placed: int = 0
	var tries: int = 0
	while placed < 40 and tries < 160:
		tries += 1
		var gx: float = rng.randf_range(-2.4, float(sim.grid.width) + 2.4)
		var gz: float = rng.randf_range(-2.4, float(sim.grid.height) + 2.4)
		if gx > -0.8 and gx < float(sim.grid.width) + 0.8 and gz > -0.8 and gz < float(sim.grid.height) + 0.8:
			continue
		var path: String = String(PROPS[rng.randi() % PROPS.size()])
		var n: Node3D = _model(path, rng.randf_range(5.0, 12.0))
		if n == null:
			continue
		n.position = Vector3(gx * CELL, 0.0, gz * CELL)
		n.rotation_degrees.y = rng.randf_range(0.0, 360.0)
		_enhance_materials(n, 0.6, 0.62, Color(0, 0, 0), 0.0)
		add_child(n)
		placed += 1
	print("[view] 外围装饰件 %d 个" % placed)


# 统一材质手感：多来源模型（Kenney / Poly Pizza）风格差异大，
# 统一给一层金属度与粗糙度，再靠 glow 提亮——比换模型省事得多。
func _enhance_materials(root: Node3D, metallic: float, roughness: float, emis: Color, energy: float) -> void:
	var meshes: Array = []
	_collect(root, meshes)
	for m in meshes:
		var mi: MeshInstance3D = m as MeshInstance3D
		if mi.mesh == null:
			continue
		for s in range(mi.mesh.get_surface_count()):
			var src = mi.mesh.surface_get_material(s)
			if src == null or not (src is BaseMaterial3D):
				continue
			var mm: BaseMaterial3D = (src as BaseMaterial3D).duplicate() as BaseMaterial3D
			mm.metallic = metallic
			mm.roughness = roughness
			if energy > 0.0:
				mm.emission_enabled = true
				mm.emission = emis
				mm.emission_energy_multiplier = energy
			mi.set_surface_override_material(s, mm)


# 炮塔转向目标：塔是死物会显得很“摆设”，开火时转过去的动作成本极低
func _aim_tower(x: float, y: float, ex: float, ey: float) -> void:
	var key: String = "%d,%d" % [int(x - 0.5), int(y - 0.5)]
	if not tower_nodes.has(key):
		return
	var rec: Dictionary = tower_nodes[key] as Dictionary
	var feat: Node3D = rec.get("feature", null) as Node3D
	if feat == null or not is_instance_valid(feat):
		return
	var dir: Vector3 = Vector3(ex * CELL, 0.0, ey * CELL) - Vector3(x * CELL, 0.0, y * CELL)
	if dir.length() < 0.01:
		return
	feat.rotation.y = atan2(dir.x, dir.z)


# 地面状态：空地 / 路径 / 入口 / 核心 / 悬停高亮
func refresh_ground() -> void:
	var on_path: Dictionary = {}
	for p in sim.path:
		var v: Vector2i = p as Vector2i
		on_path[Vector2i(v.x, v.y)] = true
	for y in range(sim.grid.height):
		for x in range(sim.grid.width):
			var mi: MeshInstance3D = tiles[y * sim.grid.width + x] as MeshInstance3D
			var cell: int = sim.grid.at(x, y)
			var m: StandardMaterial3D = _mat_empty
			if cell == Grid.Cell.SPAWN:
				m = _mat_spawn
			elif cell == Grid.Cell.CORE:
				m = _mat_core
			elif cell == Grid.Cell.TOWER:
				m = _mat_empty
			elif on_path.has(Vector2i(x, y)):
				m = _mat_path
			if hover_cell == Vector2i(x, y):
				m = _mat_ok if hover_ok else _mat_bad
			mi.material_override = m


func set_hover(c: Vector2i, ok: bool) -> void:
	if hover_cell == c and hover_ok == ok:
		return
	hover_cell = c
	hover_ok = ok
	refresh_ground()


# —— 每帧同步 ——

func sync() -> void:
	_sync_towers()
	_sync_enemies()


func _sync_towers() -> void:
	var seen: Dictionary = {}
	for t in sim.towers:
		var d: Dictionary = t as Dictionary
		var x: int = int(d["x"])
		var y: int = int(d["y"])
		var key: String = "%d,%d" % [x, y]
		seen[key] = true
		var lv: int = int(d["level"])
		if tower_nodes.has(key):
			var rec: Dictionary = tower_nodes[key] as Dictionary
			if int(rec["level"]) != lv:
				_upgrade_look(rec, String(d["id"]), lv)
			continue
		# 新建
		var root: Node3D = Node3D.new()
		root.position = Vector3((float(x) + 0.5) * CELL, 0.0, (float(y) + 0.5) * CELL)
		add_child(root)
		var base: Node3D = _model(TOWER_BASE, CELL * 0.9)
		if base != null:
			base.position.y += 0.18
			root.add_child(base)
		var feat: Node3D = _model(String(FEATURE[String(d["id"])]), CELL * 0.55)
		if feat != null:
			feat.position.y = CELL * 0.62
			root.add_child(feat)
		var rec2: Dictionary = {"root": root, "feature": feat, "level": lv, "id": String(d["id"])}
		_upgrade_look(rec2, String(d["id"]), lv)
		_enhance_materials(root, 0.75, 0.35, Color(0.15, 0.38, 0.60), 0.14)
		tower_nodes[key] = rec2
	var keys: Array = tower_nodes.keys()
	for k in keys:
		var ks: String = String(k)
		if not seen.has(ks):
			var rec3: Dictionary = tower_nodes[ks] as Dictionary
			var n: Node3D = rec3["root"] as Node3D
			if is_instance_valid(n):
				n.queue_free()
			tower_nodes.erase(ks)


func _upgrade_look(rec: Dictionary, id: String, lv: int) -> void:
	var old: Node3D = rec.get("top", null) as Node3D
	if old != null and is_instance_valid(old):
		old.queue_free()
	var path: String = String(TOWER_TOP[clampi(lv - 1, 0, TOWER_TOP.size() - 1)])
	var top: Node3D = _model(path, CELL * 0.8)
	if top != null:
		top.position.y = 0.18
		var root: Node3D = rec["root"] as Node3D
		root.add_child(top)
	rec["top"] = top
	rec["level"] = lv


func _sync_enemies() -> void:
	var seen: Dictionary = {}
	for e in sim.enemies:
		var d: Dictionary = e as Dictionary
		var uid: int = int(d["uid"])
		seen[uid] = true
		var wx: float = float(d["x"]) * CELL
		var wz: float = float(d["y"]) * CELL
		if enemy_nodes.has(uid):
			var rec: Dictionary = enemy_nodes[uid] as Dictionary
			var n: Node3D = rec["root"] as Node3D
			var prev: Vector3 = Vector3(rec["px"], 0.0, rec["pz"])
			var cur: Vector3 = Vector3(wx, n.position.y, wz)
			# 朝向要朝「前方一段距离」的点，不能直接用当前位置——敌人停住（被减速/卡住）时
			# 目标点会与自身重合，Godot 每帧刷一条 look_at() failed 的 ERROR。
			var dirv: Vector3 = Vector3(cur.x - prev.x, 0.0, cur.z - prev.z)
			if dirv.length() > 0.02:
				n.look_at(n.position + dirv.normalized() * 5.0, Vector3.UP)
			n.position = cur
			rec["px"] = wx
			rec["pz"] = wz
			continue
		var root: Node3D = Node3D.new()
		var eid: String = String(d["id"])
		var flying: bool = FLYING.has(eid)
		var y0: float = 1.8 if flying else 0.05
		root.position = Vector3(wx, y0, wz)
		add_child(root)
		var model: Node3D = _model(String(ENEMY_MODEL[eid]), CELL * (0.75 if not flying else 0.6))
		if model != null:
			model.position.y += 0.2
			root.add_child(model)
		# 护盾机兵加一圈可视化护盾（半透明球），让「激光打不动」在画面上说得通
		if float(d["shield"]) > 0.0:
			var sph: MeshInstance3D = MeshInstance3D.new()
			var sm: SphereMesh = SphereMesh.new()
			sm.radius = CELL * 0.5
			sm.height = CELL * 1.0
			sph.mesh = sm
			sph.position.y = CELL * 0.4
			var m: StandardMaterial3D = StandardMaterial3D.new()
			m.albedo_color = Color(0.3, 0.7, 1.0, 0.35)
			m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			m.emission_enabled = true
			m.emission = Color(0.2, 0.5, 0.9)
			m.emission_energy_multiplier = 0.6
			sph.material_override = m
			root.add_child(sph)
		_enhance_materials(root, 0.5, 0.5, Color(0.40, 0.12, 0.05), 0.08)
		enemy_nodes[uid] = {"root": root, "px": wx, "pz": wz, "flying": flying}
	var uids: Array = enemy_nodes.keys()
	for u in uids:
		var uid2: int = int(u)
		if not seen.has(uid2):
			var rec2: Dictionary = enemy_nodes[uid2] as Dictionary
			var n2: Node3D = rec2["root"] as Node3D
			if is_instance_valid(n2):
				n2.queue_free()
			enemy_nodes.erase(uid2)


# —— 反馈 ——

func fx(ev: Dictionary) -> void:
	var kind: String = String(ev["t"])
	match kind:
		"fire":
			_aim_tower(float(ev["x"]), float(ev["y"]), float(ev["ex"]), float(ev["ey"]))
			_fx_tracer(float(ev["x"]) * CELL, float(ev["y"]) * CELL, float(ev["ex"]) * CELL, float(ev["ey"]) * CELL)
			_play(_pick(SFX_FIRE), 0.35, 8.0)
			_flash_enemy(int(ev.get("uid", -1)))
		"kill":
			_fx_blast(float(ev["x"]) * CELL, float(ev["y"]) * CELL, 1.0, Color(1.0, 0.75, 0.35))
			_play(_pick(SFX_BOOM), 0.7, 4.0)
		"boom", "tower_down":
			_fx_blast(float(ev["x"]) * CELL, float(ev["y"]) * CELL, 1.4, Color(1.0, 0.45, 0.2))
			_play(_pick(SFX_BOOM), 0.9, 2.0)
			shake = maxf(shake, 0.25)
		"leak":
			_fx_blast(float(ev["x"]) * CELL, float(ev["y"]) * CELL, 1.6, Color(1.0, 0.2, 0.2))
			_play(_pick(SFX_BOOM), 0.9, 2.0)
			shake = maxf(shake, 0.45)


func _flash_enemy(uid: int) -> void:
	if uid < 0 or not enemy_nodes.has(uid):
		return
	var rec: Dictionary = enemy_nodes[uid] as Dictionary
	var n: Node3D = rec["root"] as Node3D
	_fx_blast(n.position.x, n.position.z, 0.35, Color(1.0, 1.0, 1.0), 0.08)


func _fx_tracer(x1: float, z1: float, x2: float, z2: float) -> void:
	var a: Vector3 = Vector3(x1, 1.9, z1)
	var b: Vector3 = Vector3(x2, 1.2, z2)
	var mi: MeshInstance3D = MeshInstance3D.new()
	var cyl: CylinderMesh = CylinderMesh.new()
	cyl.top_radius = 0.06
	cyl.bottom_radius = 0.06
	cyl.height = 1.0
	mi.mesh = cyl
	var m: StandardMaterial3D = StandardMaterial3D.new()
	m.albedo_color = Color(1.0, 0.9, 0.5)
	m.emission_enabled = true
	m.emission = Color(1.0, 0.85, 0.4)
	m.emission_energy_multiplier = 3.0
	mi.material_override = m
	var mid: Vector3 = (a + b) * 0.5
	# 顺序必须「先入树再定向」：节点不在树里时 look_at() 会报
	# `Node not inside tree. Use look_at_from_position() instead.`，方向也没算对——
	# 这是实跑 10 分钟才暴露的（headless 冒烟里 fx 也会跑，但那时它被当成噪音没细看）。
	add_child(mi)
	mi.position = mid
	var span: float = a.distance_to(b)
	mi.scale = Vector3(1.0, span, 1.0)
	if span > 0.001:
		# 圆柱沿局部 +Y，直接把 +Y 转到 a→b 方向，比 look_at + 再转一次稳
		mi.quaternion = Quaternion(Vector3.UP, (b - a).normalized())
	_fx.append({"node": mi, "life": 0.07, "max": 0.07, "kind": "tracer"})


func _fx_blast(x: float, z: float, size: float, c: Color, life: float = 0.28) -> void:
	var mi: MeshInstance3D = MeshInstance3D.new()
	var sm: SphereMesh = SphereMesh.new()
	sm.radius = 0.5
	sm.height = 1.0
	mi.mesh = sm
	var m: StandardMaterial3D = StandardMaterial3D.new()
	m.albedo_color = c
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.emission_enabled = true
	m.emission = c
	m.emission_energy_multiplier = 2.0
	mi.material_override = m
	mi.position = Vector3(x, 1.0, z)
	add_child(mi)
	_fx.append({"node": mi, "life": life, "max": life, "kind": "blast", "size": size})


func _process(delta: float) -> void:
	var i: int = _fx.size() - 1
	while i >= 0:
		var f: Dictionary = _fx[i] as Dictionary
		var life: float = float(f["life"]) - delta
		f["life"] = life
		var node: Node3D = f["node"] as Node3D
		if is_instance_valid(node):
			var k: float = clampf(life / float(f["max"]), 0.0, 1.0)
			var kind: String = String(f["kind"])
			if kind == "blast":
				var s: float = float(f["size"]) * (1.6 - k)
				node.scale = Vector3(s, s, s)
				var mm: StandardMaterial3D = (node as MeshInstance3D).material_override as StandardMaterial3D
				if mm != null:
					mm.albedo_color = Color(mm.albedo_color.r, mm.albedo_color.g, mm.albedo_color.b, k)
		if life <= 0.0:
			if is_instance_valid(node):
				node.queue_free()
			_fx.remove_at(i)
		i -= 1
	if shake > 0.0:
		shake = maxf(0.0, shake - delta * 1.8)
	# 飞行单位的悬浮
	for u in enemy_nodes:
		var rec: Dictionary = enemy_nodes[u] as Dictionary
		var flying: bool = bool(rec["flying"])
		if not flying:
			continue
		var n: Node3D = rec["root"] as Node3D
		n.position.y = 1.8 + sin(Time.get_ticks_msec() * 0.004 + int(u)) * 0.18


func play_ui(kind: String) -> void:
	if kind == "build":
		_play(SFX_BUILD, 0.7, 1.0)
	elif kind == "deny":
		_play(SFX_DENY, 0.7, 1.0)


func _pick(list: Array) -> String:
	return String(list[randi() % list.size()])


func _play(path: String, vol: float, pitch: float = 1.0) -> void:
	if not _sfx_cache.has(path):
		if not ResourceLoader.exists(path):
			_sfx_cache[path] = null
			return
		var s = load(path)
		_sfx_cache[path] = s
	var stream = _sfx_cache[path]
	if stream == null:
		return
	for p in _audio:
		var pl: AudioStreamPlayer = p as AudioStreamPlayer
		if not pl.playing:
			pl.stream = stream
			pl.volume_db = linear_to_db(vol)
			pl.pitch_scale = pitch
			pl.play()
			return


# —— 模型实例化（带尺寸归一化）——

func _model(path: String, target: float) -> Node3D:
	if path == "" or not ResourceLoader.exists(path):
		return null
	var scene = load(path)
	if scene == null:
		return null
	var node: Node3D = scene.instantiate() as Node3D
	if node == null:
		return null
	add_child(node)  # 必须在树里才能算 global AABB
	var key: String = path + "|" + str(int(target * 100.0))
	if _scale_cache.has(key):
		var arr: Array = _scale_cache[key] as Array
		node.scale = Vector3(float(arr[0]), float(arr[0]), float(arr[0]))
		node.position.y = float(arr[1])
		remove_child(node)  # 必须摘下来：调用方会把它挂到自己的父节点下
		return node
	var acc: AABB = AABB()
	var first: bool = true
	var meshes: Array = []
	_collect(node, meshes)
	for m in meshes:
		var mi: MeshInstance3D = m as MeshInstance3D
		var a: AABB = mi.global_transform * mi.get_aabb()
		if first:
			acc = a
			first = false
		else:
			acc = acc.merge(a)
	var size: float = maxf(acc.size.x, maxf(acc.size.y, acc.size.z))
	var s: float = target / maxf(size, 0.0001)
	var yoff: float = -acc.position.y * s
	_scale_cache[key] = [s, yoff]
	node.scale = Vector3(s, s, s)
	node.position.y = yoff
	remove_child(node)  # 同上
	return node


func _collect(n: Node, out: Array) -> void:
	if n is MeshInstance3D:
		out.append(n)
	for c in n.get_children():
		_collect(c, out)
