@tool
extends SceneTree
## 程序化生成 06 首张竞技场 blockout，保存为 res://scenes/arena.tscn。
##
## 为什么用脚本生成而不是手写 .tscn：关卡要反复调（滑铲下坡角度、墙跑路径、掩体密度），
## 参数化后改一个数字重跑即可，也让「敌人能否跑通」的机器人验证有稳定的单一几何来源。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/build_arena.gd

const OUT_PATH := "res://scenes/arena.tscn"
const TEX_DIR := "res://assets/textures/prototype/"

## 出怪点：贴外墙与四角高台顶，中心留空（玩家出生点周围不能有出怪口，
## 否则第一波直接刷在脸上，滑铲起手空间为 0）。y 取碰撞体顶面 +0.1 防嵌入。
const SPAWNS: Array = [
	["edge_nw", Vector3(-24, 0.1, -24)],
	["edge_ne", Vector3(24, 0.1, -24)],
	["edge_sw", Vector3(-24, 0.1, 24)],
	["edge_se", Vector3(24, 0.1, 24)],
	["edge_n", Vector3(0, 0.1, -26)],
	["edge_s", Vector3(0, 0.1, 26)],
	["edge_w", Vector3(-26, 0.1, 0)],
	["edge_e", Vector3(26, 0.1, 0)],
	["plat_nw", Vector3(-18, 6.1, -18)],
	["plat_ne", Vector3(18, 6.1, -18)],
	["plat_sw", Vector3(-18, 6.1, 18)],
	["plat_se", Vector3(18, 6.1, 18)],
	["air_w", Vector3(-20, 5.0, 0)],
	["air_e", Vector3(20, 5.0, 0)],
]

const FLOOR_HALF := 30.0
const WALL_H := 12.0

# [中心, 尺寸, 欧拉角旋转(度), 纹理编号 1-13]
const PIECES: Array = [
	# --- 地面与外墙 ---
	[Vector3(0, -0.5, 0), Vector3(60, 1, 60), Vector3.ZERO, 1],
	[Vector3(0, 6, -30), Vector3(60, 12, 1), Vector3.ZERO, 2],
	[Vector3(0, 6, 30), Vector3(60, 12, 1), Vector3.ZERO, 2],
	[Vector3(30, 6, 0), Vector3(1, 12, 60), Vector3.ZERO, 2],
	[Vector3(-30, 6, 0), Vector3(1, 12, 60), Vector3.ZERO, 2],

	# --- 四角高台（分离式，绝不围死中心）---
	# 练习期教训：环形高台 + 小角缺口 = 敌人（无寻路）卡死 480s。必须四角分离 + 中央通路。
	[Vector3(-18, 3, -18), Vector3(10, 6, 10), Vector3.ZERO, 3],
	[Vector3(18, 3, -18), Vector3(10, 6, 10), Vector3.ZERO, 3],
	[Vector3(-18, 3, 18), Vector3(10, 6, 10), Vector3.ZERO, 3],
	[Vector3(18, 3, 18), Vector3(10, 6, 10), Vector3.ZERO, 3],

	# --- 滑铲下坡斜坡（自高台通地面）---
	[Vector3(-18, 2.6, -11), Vector3(10, 0.6, 9), Vector3(-20, 0, 0), 4],
	[Vector3(18, 2.6, 11), Vector3(10, 0.6, 9), Vector3(20, 0, 0), 4],
	[Vector3(-18, 2.6, 11), Vector3(10, 0.6, 9), Vector3(20, 180, 0), 4],
	[Vector3(18, 2.6, -11), Vector3(10, 0.6, 9), Vector3(-20, 180, 0), 4],

	# --- 墙跑墙段（贴外墙内侧，留出助跑空间）---
	[Vector3(-24, 5, 0), Vector3(1, 10, 18), Vector3.ZERO, 5],
	[Vector3(24, 5, 0), Vector3(1, 10, 18), Vector3.ZERO, 5],

	# --- 中层掩体（切断开阔地，给敌人推进留掩体节奏）---
	[Vector3(0, 1, -12), Vector3(7, 2, 2), Vector3.ZERO, 6],
	[Vector3(0, 1, 12), Vector3(7, 2, 2), Vector3.ZERO, 6],
	[Vector3(-12, 1, 0), Vector3(2, 2, 7), Vector3.ZERO, 6],
	[Vector3(12, 1, 0), Vector3(2, 2, 7), Vector3.ZERO, 6],
	[Vector3(-8, 1, -8), Vector3(3, 2, 3), Vector3.ZERO, 7],
	[Vector3(8, 1, 8), Vector3(3, 2, 3), Vector3.ZERO, 7],
	[Vector3(-8, 1, 8), Vector3(3, 2, 3), Vector3.ZERO, 7],
	[Vector3(8, 1, -8), Vector3(3, 2, 3), Vector3.ZERO, 7],
]


func _initialize() -> void:
	var root := Node3D.new()
	root.name = "Arena"

	var boxes := 0
	var tris := 0
	for p in PIECES:
		var center: Vector3 = p[0]
		var size: Vector3 = p[1]
		var rot_deg: Vector3 = p[2]
		var tex_id: int = p[3]

		var body := StaticBody3D.new()
		body.position = center
		body.rotation_degrees = rot_deg
		body.collision_layer = 1   # world
		body.collision_mask = 0

		var mi := MeshInstance3D.new()
		var bm := BoxMesh.new()
		bm.size = size
		mi.mesh = bm
		mi.material_override = _make_material(size, tex_id)

		var cs := CollisionShape3D.new()
		var bs := BoxShape3D.new()
		bs.size = size
		cs.shape = bs

		body.add_child(mi)
		body.add_child(cs)

		# 顺序很关键：要先把 body 挂进 root，root 才成为 mi/cs 的祖先，
		# 之后设 owner 才合法（否则报 "Owner must be an ancestor"，子节点不会被打包进场景）。
		root.add_child(body)
		body.owner = root
		mi.owner = root
		cs.owner = root

		boxes += 1
		tris += 12  # BoxMesh = 12 三角面

	_add_atmosphere(root)
	_add_spawns(root)

	var packed := PackedScene.new()
	var err := packed.pack(root)
	if err != OK:
		push_error("pack 失败，错误码 %d" % err)
		quit(1)
		return

	err = ResourceSaver.save(packed, OUT_PATH)
	if err != OK:
		push_error("保存 %s 失败，错误码 %d" % [OUT_PATH, err])
		quit(1)
		return

	print("关卡生成完成：%d 个碰撞体 / %d 三角面 → %s" % [boxes, tris, OUT_PATH])
	# pack() 已复制数据，释放临时节点避免退出时的 RID 泄漏警告污染验证输出
	root.free()
	quit(0)


## 氛围层：光照 + 天空 + 雾 + glow。硬约束 §0.4「能看」的最小实现，
## 也是枪口火光/曳光能靠 bloom 融进画面的前提——没有 glow，特效永远是贴上去的贴图。
func _add_atmosphere(root: Node3D) -> void:
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(0.045, 0.07, 0.12)
	sky_mat.sky_horizon_color = Color(0.20, 0.28, 0.40)
	sky_mat.ground_horizon_color = Color(0.16, 0.20, 0.26)
	sky_mat.ground_bottom_color = Color(0.04, 0.05, 0.07)

	var sky := Sky.new()
	sky.sky_material = sky_mat

	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.7
	env.fog_enabled = true
	env.fog_light_color = Color(0.18, 0.25, 0.35)
	env.fog_density = 0.010
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.glow_enabled = true
	env.glow_bloom = 0.06
	env.glow_intensity = 0.9

	var we := WorldEnvironment.new()
	we.name = "WorldEnvironment"
	we.environment = env
	root.add_child(we)
	we.owner = root

	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-52.0, 34.0, -12.0)
	sun.light_energy = 1.25
	sun.light_color = Color(0.92, 0.96, 1.0)
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 120.0
	root.add_child(sun)
	sun.owner = root


## 出怪点标记。WaveDirector 只认这里的名字，不在关卡里硬编码坐标。
func _add_spawns(root: Node3D) -> void:
	var holder := Node3D.new()
	holder.name = "SpawnPoints"
	root.add_child(holder)
	holder.owner = root

	for s in SPAWNS:
		var marker := Marker3D.new()
		marker.name = String(s[0])
		marker.position = s[1]
		holder.add_child(marker)
		marker.owner = root

	var player_spawn := Marker3D.new()
	player_spawn.name = "player_spawn"
	player_spawn.position = Vector3(0, 1.0, 18)
	holder.add_child(player_spawn)
	player_spawn.owner = root


## 纹理 UV 按盒子尺寸缩放，否则大平面会把网格纹理拉成条纹。
func _make_material(size: Vector3, tex_id: int) -> StandardMaterial3D:
	var mat := StandardMaterial3D.new()
	var path := "%stexture_%02d.png" % [TEX_DIR, tex_id]
	if ResourceLoader.exists(path):
		var tex := load(path) as Texture2D
		mat.albedo_texture = tex
		# 每个面按世界尺寸 / 2m 平铺
		mat.uv1_scale = Vector3(max(size.x, size.z) / 2.0, max(size.y, 2.0) / 2.0, 1.0)
	else:
		push_warning("纹理缺失：%s，退回纯色" % path)
		mat.albedo_color = Color(0.35, 0.38, 0.42)
	return mat
