extends Node3D
class_name SpaceWorld
## 太空环境装配层：天空盒（银河）/ 恒星 / 行星轨道 / 小行星带。
## 全部程序化构建（硬约束 §0.2 允许的「程序化补缺」——贴图与模型都来自素材库）。
##
## —— 为什么背景会「跑到战场外」，以及这里怎么修的 ——
## 根因：行星原本是摆在**固定世界坐标**（1900,-260,2600 这种）上的静态球体。
## 玩家以 30~200 m/s 一路飞，十分钟能跑 40 km，必然飞出这套布景，于是看到
## 「星球孤零零挂在虚空里 / 战区外还有东西」。
## 修法：把天体改成**跟随玩家的局部坐标系**（天体节点挂在 _celestial 根下，
## 每帧把根节点摆到玩家位置再叠加轨道偏移）。于是：
##   · 玩家永远处在一套完整的太阳系中央视野里，不会飞出布景；
##   · 行星之间保持真实的相对轨道关系，视觉上仍是「太阳系」；
##   · 战区软边界（BOUND）现在表达的是「离当前天体锚点多远」，而不是「离原点多远」。

const BOUND := 600.0  # 战区软边界半径（player_ship 同用，有测试外断言）

## 行星定义。orbit = 公转轨道半径（相对恒星），radius = 球体半径，
## phase = 初始相位角，speed = 公转角速度（极慢，只为让场景「活着」）。
## 任务点用 mission = true 标记——它们是每波战斗的「卫星域」锚点。
const PLANETS := [
	{"tex": "earth_daymap", "radius": 170.0, "orbit": 2100.0, "phase": 0.4,
		"speed": 0.010, "tilt": 0.12, "mission": true, "name": "地球"},
	{"tex": "moon", "radius": 52.0, "orbit": 900.0, "phase": 2.1,
		"speed": 0.022, "tilt": 0.05, "mission": true, "name": "月球"},
	{"tex": "mars", "radius": 120.0, "orbit": 2800.0, "phase": 3.6,
		"speed": 0.008, "tilt": 0.18, "mission": true, "name": "火星"},
	{"tex": "jupiter", "radius": 520.0, "orbit": 4200.0, "phase": 1.2,
		"speed": 0.005, "tilt": 0.06, "mission": true, "name": "木星"},
	{"tex": "saturn", "radius": 380.0, "orbit": 5600.0, "phase": 4.4,
		"speed": 0.004, "tilt": 0.22, "mission": true, "name": "土星"},
	{"tex": "venus_atmosphere", "radius": 150.0, "orbit": 1500.0, "phase": 5.2,
		"speed": 0.016, "tilt": 0.09, "mission": false, "name": "金星"},
]

## 波次 → 任务行星的映射（每波在一颗行星附近作战，呼应「每颗星球附近有任务」）。
## 用 0 基索引指向 PLANETS；null 表示本波不绑定行星。
const WAVE_PLANET := [0, 1, 2, 3, 4]

const ASTEROID_MODELS := [
	"res://assets/models/environment/asteroid-YS1jpm3mNr.glb",
	"res://assets/models/environment/asteroid-2-yuCzypJ0w4.glb",
	"res://assets/models/environment/asteroids-9k18F9bT43N.glb",
	"res://assets/models/environment/kenney_meteor.glb",
]

## 当前波次的任务行星名（HUD 播报用）。没绑定时为空串。
var current_mission: String = ""

var _spinners: Array = []
var _orbits: Array = []       # {node, orbit, phase, speed, tilt}
var _celestial: Node3D        # 跟随玩家的天体根
var _anchor: Node3D          # 跟随目标（玩家）
var _orbit_t: float = 0.0


func setup() -> void:
	_anchor = get_tree().get_first_node_in_group("player")
	_build_sky()
	_celestial = Node3D.new()
	_celestial.name = "Celestial"
	add_child(_celestial)
	_build_sun()
	_build_planets()
	_build_asteroids()


## 每波开始时由 WaveDirector 调用：把任务行星的名字报给 HUD。
func set_mission(planet_index: int) -> void:
	if planet_index < 0 or planet_index >= PLANETS.size():
		current_mission = ""
		return
	current_mission = String(PLANETS[planet_index]["name"])


func _process(delta: float) -> void:
	# 缓慢自转给场景「活着」的感觉；纯视觉，暂停与否无关紧要
	for entry in _spinners:
		var node: Node3D = entry["node"]
		node.rotate_y(float(entry["speed"]) * delta)

	# 轨道推进
	_orbit_t += delta
	for entry in _orbits:
		var node: Node3D = entry["node"]
		var orbit := float(entry["orbit"])
		var ang := float(entry["phase"]) + _orbit_t * float(entry["speed"])
		# 轨道平面倾斜：绕 X 转 tilt，再在平面内转 ang
		var tilt_basis := Basis(Vector3.RIGHT, float(entry["tilt"]))
		node.position = tilt_basis * Vector3(cos(ang) * orbit, 0.0, sin(ang) * orbit)

	# 天体根跟随玩家：这是「背景不会跑到战场外」的关键。
	# 只跟随，不做刚体插值——天体都在几千米外，跟随延迟看不出来，
	# 而插值会让玩家高速时天体相对滑动，反而更假。
	if _anchor != null and is_instance_valid(_anchor):
		_celestial.global_position = _anchor.global_position


func _build_sky() -> void:
	var sky := Sky.new()
	var pmat := PanoramaSkyMaterial.new()
	var stars := load("res://assets/textures/planets/8k_stars_milky_way.jpg")
	if stars != null:
		pmat.panorama = stars
	else:
		push_error("星空贴图缺失：8k_stars_milky_way.jpg")
	sky.sky_material = pmat
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.5
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.glow_enabled = true
	env.glow_intensity = 0.35
	env.glow_bloom = 0.08
	var we := WorldEnvironment.new()
	we.name = "WorldEnvironment"
	we.environment = env
	add_child(we)


func _build_sun() -> void:
	var sun := Node3D.new()
	sun.name = "Sun"
	# 玩家一路朝 -Z 飞，整局十分钟后太阳必然进视野。半径/自发光/泛光都压低一档，
	# 免得长时间飞行后恒星泛光占满画面（这是预防性调整，尚未实测到具体的糊屏程度）。
	# 位置在「跟随玩家的天体根」的局部坐标里 —— 相对玩家恒定，于是玩家永远飞不出
	# 这套布景，也不会出现「背景跑到战场外」。
	sun.position = Vector3(-2600, 1200, -2800)
	_celestial.add_child(sun)

	var light := DirectionalLight3D.new()
	light.name = "KeyLight"
	light.light_energy = 1.2
	light.light_color = Color(1.0, 0.96, 0.9)
	light.shadow_enabled = true
	light.rotation_degrees = Vector3(-28.0, 42.0, 0.0)
	sun.add_child(light)

	var body := MeshInstance3D.new()
	body.name = "SunBody"
	var sphere := SphereMesh.new()
	sphere.radius = 300.0
	sphere.height = 600.0
	body.mesh = sphere
	var mat := StandardMaterial3D.new()
	var tex := load("res://assets/textures/planets/2k_sun.jpg")
	if tex != null:
		mat.albedo_texture = tex
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.emission_enabled = true
	mat.emission = Color(1.0, 0.92, 0.75)
	mat.emission_energy_multiplier = 1.4
	body.material_override = mat
	sun.add_child(body)
	_spinners.append({"node": body, "speed": 0.01})


func _build_planets() -> void:
	var holder := Node3D.new()
	holder.name = "Planets"
	_celestial.add_child(holder)
	for i in range(PLANETS.size()):
		var entry: Dictionary = PLANETS[i]
		var tex_name := String(entry["tex"])
		var radius := float(entry["radius"])
		var mesh := SphereMesh.new()
		mesh.radius = radius
		mesh.height = radius * 2.0
		mesh.radial_segments = 64
		mesh.rings = 32
		var mi := MeshInstance3D.new()
		# 名字带序号：冒烟要断言「第 N 波的任务行星存在」，得能按索引取
		mi.name = "%02d_%s" % [i, tex_name]
		mi.mesh = mesh
		var mat := StandardMaterial3D.new()
		var tex := load("res://assets/textures/planets/2k_%s.jpg" % tex_name)
		if tex != null:
			mat.albedo_texture = tex
		else:
			push_error("行星贴图缺失：2k_%s.jpg" % tex_name)
		mat.roughness = 1.0
		mi.material_override = mat
		holder.add_child(mi)
		_spinners.append({"node": mi, "speed": float(entry["speed"]) * 3.0})
		# 轨道位置由 _process 每帧算（_orbit_t 推进）
		_orbits.append({
			"node": mi,
			"orbit": float(entry["orbit"]),
			"phase": float(entry["phase"]),
			"speed": float(entry["speed"]),
			"tilt": float(entry["tilt"]),
		})


func _build_asteroids() -> void:
	var holder := Node3D.new()
	holder.name = "Asteroids"
	add_child(holder)
	var rng := SimRng.new(1010)  # 固定种子：布局确定性，冒烟可断言
	var packed_scenes: Array = []
	for path in ASTEROID_MODELS:
		var ps := load(path) as PackedScene
		if ps == null:
			push_error("小行星模型缺失：%s" % path)
			continue
		packed_scenes.append(ps)
	if packed_scenes.is_empty():
		return
	for i in range(20):
		# 球壳分布，但**推到交战走廊之外**：原本 260~540 m 正好是敌机交战区，
		# 玩家反馈「敌机不好找到」有一半是这些黑黢黢的石头在挡视线/混淆目标。
		# 现在放在 700~1100 m——仍能看出身处小行星带，但不再挡枪线。
		var dir := Vector3(rng.rangef(-1.0, 1.0), rng.rangef(-0.5, 0.5), rng.rangef(-1.0, 1.0)).normalized()
		var dist := rng.rangef(700.0, 1100.0)
		var scale := rng.rangef(0.8, 3.2)
		var ps: PackedScene = packed_scenes[rng.next_int() % packed_scenes.size()]
		var rock := ps.instantiate() as Node3D
		rock.name = "Asteroid_%d" % i
		rock.position = dir * dist
		rock.scale = Vector3.ONE * scale
		rock.rotation = Vector3(rng.rangef(0.0, TAU), rng.rangef(0.0, TAU), rng.rangef(0.0, TAU))
		var body := StaticBody3D.new()
		body.name = "Body"
		body.collision_layer = 1  # world
		body.collision_mask = 0
		var shape := CollisionShape3D.new()
		var sphere := SphereShape3D.new()
		sphere.radius = 1.6  # 单位半径 × 外层缩放（模型按 ~1.6 半径估）
		shape.shape = sphere
		body.add_child(shape)
		rock.add_child(body)
		holder.add_child(rock)
		_spinners.append({"node": rock, "speed": rng.rangef(-0.05, 0.05)})
