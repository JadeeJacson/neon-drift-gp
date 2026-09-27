extends Node3D
class_name SpaceWorld
## 太空环境装配层：天空盒（银河）/ 恒星 / 行星 / 小行星带。
## 全部程序化构建（硬约束 §0.2 允许的「程序化补缺」——贴图与模型都来自素材库）。

const BOUND := 600.0  # 战区软边界半径（player_ship 同用，有测试外断言）

const PLANETS := [
	{"tex": "earth_daymap", "radius": 170.0, "pos": Vector3(1900, -260, 2600)},
	{"tex": "moon", "radius": 52.0, "pos": Vector3(1450, 130, 2150)},
	{"tex": "mars", "radius": 120.0, "pos": Vector3(-2300, 320, 1500)},
	{"tex": "jupiter", "radius": 520.0, "pos": Vector3(3100, 520, -2200)},
	{"tex": "saturn", "radius": 380.0, "pos": Vector3(-3400, -420, -2600)},
	{"tex": "venus_atmosphere", "radius": 150.0, "pos": Vector3(-1600, -520, 3100)},
]

const ASTEROID_MODELS := [
	"res://assets/models/environment/asteroid-YS1jpm3mNr.glb",
	"res://assets/models/environment/asteroid-2-yuCzypJ0w4.glb",
	"res://assets/models/environment/asteroids-9k18F9bT43N.glb",
	"res://assets/models/environment/kenney_meteor.glb",
]

var _spinners: Array = []


func setup() -> void:
	_build_sky()
	_build_sun()
	_build_planets()
	_build_asteroids()


func _process(delta: float) -> void:
	# 缓慢自转给场景「活着」的感觉；纯视觉，暂停与否无关紧要
	for entry in _spinners:
		var node: Node3D = entry["node"]
		node.rotate_y(float(entry["speed"]) * delta)


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
	sun.position = Vector3(-5200, 2400, -5600)
	add_child(sun)

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
	add_child(holder)
	for entry in PLANETS:
		var tex_name := String(entry["tex"])
		var radius := float(entry["radius"])
		var mesh := SphereMesh.new()
		mesh.radius = radius
		mesh.height = radius * 2.0
		mesh.radial_segments = 64
		mesh.rings = 32
		var mi := MeshInstance3D.new()
		mi.name = tex_name
		mi.mesh = mesh
		var mat := StandardMaterial3D.new()
		var tex := load("res://assets/textures/planets/2k_%s.jpg" % tex_name)
		if tex != null:
			mat.albedo_texture = tex
		else:
			push_error("行星贴图缺失：2k_%s.jpg" % tex_name)
		mat.roughness = 1.0
		mi.material_override = mat
		mi.position = entry["pos"]
		holder.add_child(mi)
		_spinners.append({"node": mi, "speed": 0.004})


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
		# 球壳分布：靠近战区边缘，中央空域留给狗斗（06「中央通路」教训的太空版）
		var dir := Vector3(rng.rangef(-1.0, 1.0), rng.rangef(-0.5, 0.5), rng.rangef(-1.0, 1.0)).normalized()
		var dist := rng.rangef(260.0, 540.0)
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
