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
const PROP_DIR := "res://assets/models/environment/space-kit/"

## 装饰层（Kenney Space Kit，实测 1 模块 = 1 米、**零碰撞体**，所以不会造出空气墙）。
## 只贴墙、只上高台、只铺地面嵌板——中央通路一个摆件都不放，
## 否则无寻路的敌人会被装饰物卡住（练习期教训：能看见的障碍 = 必须能绕过的障碍）。
const WALL_PANEL := "structure_detailed.glb"
const WALL_PIPE := "pipe_straight.glb"
const COLUMN := "pipe_supportHigh.glb"
const BIG_MACHINE := "machine_generatorLarge.glb"
const DISH := "satelliteDish.glb"
const TURRET := "turret_single.glb"
const GATE := "gate_simple.glb"
const RAIL := "rail.glb"
const RAIL_CORNER := "rail_corner.glb"
const DESK := "desk_computer.glb"
const BARREL := "machine_barrelLarge.glb"
const FLOOR_TILE := "platform_large.glb"
const STAIRS := "stairs.glb"

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
	var props := _add_props(root)

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

	print("关卡生成完成：%d 个碰撞体 / %d 三角面 / %d 个装饰件 → %s" % [boxes, tris, props, OUT_PATH])
	# pack() 已复制数据，释放临时节点避免退出时的 RID 泄漏警告污染验证输出
	root.free()
	quit(0)


## 装饰层。每件都是独立绘制调用，所以留了密度上限：壁板间距 8 米、栏杆每边 3 段，
## 实测落在 ~130 件。真实 draw call 只能在游戏内用编辑器 profiler 看（headless 测不到），
## 所以这条是预算而不是测量值——观感不够再往上加，加完请实跑看帧数。
func _add_props(root: Node3D) -> int:
	var holder := Node3D.new()
	holder.name = "Props"
	root.add_child(holder)
	holder.owner = root
	var n := 0

	# 1) 四面墙壁板 + 立柱 + 中段管线
	for side in [-1, 1]:
		for i in range(-24, 25, 8):
			n += _prop(holder, WALL_PANEL, Vector3(float(i), 3.0, side * 28.4),
				Vector3(0, 0 if side > 0 else 180, 0), 3.0)
			n += _prop(holder, COLUMN, Vector3(float(i) + 3.0, 1.5, side * 28.8),
				Vector3.ZERO, 3.0)
			n += _prop(holder, WALL_PIPE, Vector3(float(i), 6.5, side * 28.6),
				Vector3(0, 90, 0), 2.0)
			n += _prop(holder, WALL_PANEL, Vector3(side * 28.4, 3.0, float(i)),
				Vector3(0, 90 if side > 0 else -90, 0), 3.0)
			n += _prop(holder, COLUMN, Vector3(side * 28.8, 1.5, float(i) + 3.0),
				Vector3.ZERO, 3.0)

	# 2) 四面墙中央的门（地标，也给玩家一个「那边是出口」的方向感）
	n += _prop(holder, GATE, Vector3(0, 0, -28.2), Vector3.ZERO, 3.0)
	n += _prop(holder, GATE, Vector3(0, 0, 28.2), Vector3(0, 180, 0), 3.0)
	n += _prop(holder, GATE, Vector3(-28.2, 0, 0), Vector3(0, 90, 0), 3.0)
	n += _prop(holder, GATE, Vector3(28.2, 0, 0), Vector3(0, -90, 0), 3.0)

	# 3) 高台顶部：外沿栏杆 + 控制台 + 大桶 + 角炮塔
	for cx in [-18, 18]:
		for cz in [-18, 18]:
			var top := 6.0
			for k in range(-4, 5, 4):
				n += _prop(holder, RAIL, Vector3(float(cx) + float(k) * 1.1, top + 0.1, cz - 5.0),
					Vector3.ZERO, 3.4)
				n += _prop(holder, RAIL, Vector3(cx - 5.0, top + 0.1, float(cz) + float(k) * 1.1),
					Vector3(0, 90, 0), 3.4)
			n += _prop(holder, RAIL_CORNER, Vector3(cx - 5.0, top + 0.1, cz - 5.0),
				Vector3(0, 0 if (cx < 0 and cz < 0) else 180, 0), 2.4)
			n += _prop(holder, DESK, Vector3(cx + 2.0, top, cz + 1.0), Vector3(0, 180, 0), 2.2)
			n += _prop(holder, BARREL, Vector3(cx - 1.5, top, cz + 2.5), Vector3.ZERO, 2.0)
			n += _prop(holder, TURRET, Vector3(cx + 2.5, top, cz + 2.5), Vector3(0, 90, 0), 2.0)

	# 4) 墙脚大机器与天线（避开中央通路，也避开高台的滑铲下坡口）
	for pos in [Vector3(-26, 0, 10), Vector3(26, 0, -10), Vector3(-10, 0, 26), Vector3(10, 0, -26)]:
		n += _prop(holder, BIG_MACHINE, pos, Vector3(0, 45, 0), 3.0)
	for pos in [Vector3(26, 0, 12), Vector3(-26, 0, -12), Vector3(12, 0, 26), Vector3(-12, 0, -26)]:
		n += _prop(holder, DISH, pos, Vector3(0, 30, 0), 3.0)

	# 5) 中央地面嵌板：纯平面（无碰撞），把「一大片灰地板」切成有刻度感的甲板
	for i in range(-2, 3):
		for j in range(-2, 3):
			if absi(i) + absi(j) < 2:
				continue  # 正中心留空，玩家出生与交火的主区域保持干净
			n += _prop(holder, FLOOR_TILE, Vector3(float(i) * 4.0, 0.03, float(j) * 4.0),
				Vector3(0, 0, 0), 1.0)

	print("    装饰件 %d 个（无碰撞，不影响寻路与视线判定）" % n)
	return n


func _prop(holder: Node3D, file: String, pos: Vector3, rot: Vector3, s: float) -> int:
	var path := PROP_DIR + file
	if not ResourceLoader.exists(path):
		push_warning("装饰模块缺失：%s" % file)
		return 0
	var inst := (load(path) as PackedScene).instantiate()
	inst.position = pos
	inst.rotation_degrees = rot
	inst.scale = Vector3(s, s, s)
	holder.add_child(inst)
	# owner 必须是 root（且此时 holder 已在 root 下），否则 pack() 会静默丢掉内容——
	# 见 docs/00 §5.0 的 owner 赋值顺序教训
	inst.owner = holder.owner
	return 1


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
