@tool
extends SceneTree
## 程序化生成 scenes/board.tscn：棋盘地板、外围石墙、柱子、火把、远景、灯光与环境。
##
## 为什么关卡也要生成而不是手摆：本 lab 是纯文本工作流，`.tscn` 手写几百行坐标既不可读
## 也不可 diff。生成器是「关卡的可执行文档」——改参数重跑即生效。
##
## 五个必须记住的坑（都在本文件里踩过）：
##   1. `PackedScene.pack()` **只打包 owner 指向根的节点**。忘了设 owner，
##      脚本会打印「已生成」而文件只有 76 字节。
##   2. glTF 实例化的根是 **Node3D**，不是 MeshInstance3D。`as MeshInstance3D`
##      会把每个模型静默转成 null，于是生成出一份空场景而计数却是 0。
##   3. 退出前必须 `root.free()`，否则几百个 GLB 实例的 RID 会在退出时报泄漏。
##   4. **地面必须按棋盘中心居中**：Board.cell_to_world 把 (3,3)/(4,4) 放在原点两侧，
##      直接用 `c*step` 铺会让整个地面偏向 +X，棋盘靠 -X 的一半悬空
##      （制作人实跑反馈「场景只覆盖了一部分区域」）。
##   5. **默认镜头在 +Z 侧看向原点**（CameraRig yaw=0 时相机在 +Z），
##      所以 z>0 的方向不能放高于地面的东西，否则会挡住棋盘
##      （制作人实跑反馈「对战时有一块石头挡视野」——rock 原本摆在 z=12/13.5）。
##
## 美术实测尺寸（tools/verify_assets.gd 跑出来的，别猜）：
##   floor_tile_small = 2.00 × 0.15 × 2.00 m  → 地板步长 2.0
##   wall             = 4.00 × 4.00 × 1.00 m  → 墙步长 4.0，且它本身 4 m 高，
##                                           所以「三层墙」是错的，改成整墙 + 半墙压顶
##   wall_half        = 2.00 × 4.00 × 1.00 m
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/09-arcane-roster -s res://tools/build_arena.gd
##
## 生成的 board.tscn **要入库**（它就是关卡本体），改关卡就重跑本脚本。

const PROP_DIR := "res://assets/models/props/"
const SURROUND_DIR := "res://assets/models/surround/"

const FLOOR_PAD := 4          # 棋盘外多铺 4 圈（8 m），避免边缘露出空白
const FLOOR_STEP := 2.0
const WALL_STEP := 4.0

## 棋盘外圈的装饰物。摆放规则：**z<0 半侧或东西两侧**，绝不进默认镜头与棋盘之间
const PROP_SPOTS := [
	["barrel_small_stack.glb", Vector3(-1.7, 0.0, -3.4), 0.0],
	["crate_A_small.glb", Vector3(-1.8, 0.0, -4.6), 0.4],
	["chest.glb", Vector3(1.5, 0.0, -3.8), -0.5],
	["chest_gold.glb", Vector3(-0.4, 0.0, -4.2), 0.3],
	["rubble_large.glb", Vector3(3.1, 0.0, -3.6), 0.8],
	["banner_blue.glb", Vector3(-1.85, 1.3, -1.0), 0.25],
	["banner_blue.glb", Vector3(1.85, 1.3, -1.0), -0.25],
	["table_long.glb", Vector3(-2.6, 0.0, -1.2), 0.2],
	["column.glb", Vector3(2.6, 0.0, -2.2), 0.0],
]

## 远景同样只在 -Z 半侧与两侧
const SURROUND_SPOTS := [
	["tree_single_A.gltf", Vector3(-5.4, 0.0, -9.0), 0.0],
	["tree_single_A.gltf", Vector3(-4.0, 0.0, -11.5), 1.1],
	["tree_single_B.gltf", Vector3(5.4, 0.0, -9.6), 2.2],
	["tree_single_B.gltf", Vector3(6.6, 0.0, -12.0), 0.4],
	["tree_single_A.gltf", Vector3(-9.5, 0.0, -5.0), 0.7],
	["tree_single_B.gltf", Vector3(10.2, 0.0, -6.0), 2.9],
	["hill_single_A.gltf", Vector3(-7.5, -0.2, -14.0), 0.0],
	["hill_single_B.gltf", Vector3(7.0, -0.2, -14.5), 1.0],
	["rock_single_D.gltf", Vector3(-11.0, 0.0, -2.0), 0.5],
	["rock_single_E.gltf", Vector3(11.5, 0.0, -1.0), 2.0],
]

var _root: Node3D = null


func _initialize() -> void:
	print("=== 09 棋盘生成 ===")
	var root := Node3D.new()
	root.name = "Board"
	_root = root
	_build_environment(root)
	_build_floor(root)
	_build_walls(root)
	_build_props(root)
	_build_surroundings(root)
	_build_lights(root)

	var ps := PackedScene.new()
	var err := ps.pack(root)
	if err != OK:
		print("[build_arena] pack 失败: %d" % err)
		quit(1)
		return
	var save_err := ResourceSaver.save(ps, "res://scenes/board.tscn")
	if save_err != OK:
		print("[build_arena] 保存失败: %d" % save_err)
		quit(1)
		return
	print("[build_arena] 已生成 scenes/board.tscn：%d 个节点" % _count_nodes(root))
	_root = null
	root.free()
	quit()   # 脚本模式必须显式退出，见 docs/00 §5.0b 第 6 条


func _count_nodes(n: Node) -> int:
	var c := 1
	for ch in n.get_children():
		c += _count_nodes(ch)
	return c


## 棋盘逻辑格 → 世界坐标（与 Board.cell_to_world 同口径，但用给定步长铺地砖/墙）
func _tile_pos(c: int, r: int, step: float) -> Vector3:
	return Vector3(
		(float(c) - float(Board.COLS - 1) * 0.5) * step,
		0.0,
		(float(r) - float(Board.ROWS - 1) * 0.5) * step)


func _instance(path: String, pos: Vector3, rot_y: float = 0.0) -> Node3D:
	if not ResourceLoader.exists(path):
		return null
	var packed: PackedScene = load(path)
	if packed == null:
		return null
	var n := packed.instantiate()
	if not (n is Node3D):
		if n is Node:
			(n as Node).free()
		return null
	var nd := n as Node3D
	nd.position = pos
	nd.rotation.y = rot_y
	return nd


func _add(parent: Node, path: String, pos: Vector3, rot_y: float = 0.0) -> bool:
	var n := _instance(path, pos, rot_y)
	if n == null:
		return false
	parent.add_child(n)
	if _root != null:
		n.owner = _root
	return true


func _holder(parent: Node3D, n: String) -> Node3D:
	var h := Node3D.new()
	h.name = n
	parent.add_child(h)
	if _root != null:
		h.owner = _root
	return h


func _build_environment(root: Node3D) -> void:
	var we := WorldEnvironment.new()
	we.name = "WorldEnvironment"
	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	var mat := ProceduralSkyMaterial.new()
	mat.sky_top_color = Color(0.29, 0.42, 0.62)
	mat.sky_horizon_color = Color(0.74, 0.67, 0.58)
	mat.ground_bottom_color = Color(0.18, 0.17, 0.16)
	mat.ground_horizon_color = Color(0.55, 0.50, 0.45)
	mat.sun_angle_max = 24.0
	sky.sky_material = mat
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.8
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.tonemap_exposure = 1.05
	env.glow_enabled = true
	env.glow_intensity = 0.5
	env.glow_bloom = 0.1
	env.fog_enabled = true
	env.fog_light_color = Color(0.60, 0.56, 0.50)
	# 雾要**淡**一点：原来 0.006 在大留白下把远景糊成一片，反而看不清边界
	env.fog_density = 0.0035
	env.ssao_enabled = true
	we.environment = env
	root.add_child(we)
	we.owner = root


func _build_floor(root: Node3D) -> void:
	var holder := _holder(root, "Floor")
	var path := PROP_DIR + "floor_tile_small.glb"
	var count := 0
	for r in range(-FLOOR_PAD, Board.ROWS + FLOOR_PAD):
		for c in range(-FLOOR_PAD, Board.COLS + FLOOR_PAD):
			var jitter := float((r * 7 + c * 13) % 5) * 0.006
			if _add(holder, path, _tile_pos(c, r, FLOOR_STEP) + Vector3(0.0, 0.0, jitter), jitter):
				count += 1
	print("  地板 %d 块（%d×%d，中心对齐棋盘）" % [count, Board.COLS + FLOOR_PAD * 2, Board.ROWS + FLOOR_PAD * 2])


func _build_walls(root: Node3D) -> void:
	var holder := _holder(root, "Walls")
	var x0 := -FLOOR_PAD
	var x1 := Board.COLS + FLOOR_PAD - 1
	var z0 := -FLOOR_PAD
	var z1 := Board.ROWS + FLOOR_PAD - 1
	var n := 0
	# 整墙（4 m 高）+ 半墙压顶，做出城垛剪影
	for x in range(x0, x1 + 1):
		if _add(holder, PROP_DIR + "wall.glb", _tile_pos(x, z0, WALL_STEP)):
			n += 1
		if _add(holder, PROP_DIR + "wall_half.glb", _tile_pos(x, z0, WALL_STEP) + Vector3(0.0, 4.0, 0.0)):
			n += 1
		if _add(holder, PROP_DIR + "wall.glb", _tile_pos(x, z1 + 1, WALL_STEP)):
			n += 1
		if _add(holder, PROP_DIR + "wall_half.glb", _tile_pos(x, z1 + 1, WALL_STEP) + Vector3(0.0, 4.0, 0.0)):
			n += 1
	for z in range(z0 + 1, z1):
		if _add(holder, PROP_DIR + "wall.glb", _tile_pos(x0, z, WALL_STEP), PI * 0.5):
			n += 1
		if _add(holder, PROP_DIR + "wall_half.glb", _tile_pos(x0, z, WALL_STEP) + Vector3(0.0, 4.0, 0.0), PI * 0.5):
			n += 1
		if _add(holder, PROP_DIR + "wall.glb", _tile_pos(x1 + 1, z, WALL_STEP), PI * 0.5):
			n += 1
		if _add(holder, PROP_DIR + "wall_half.glb", _tile_pos(x1 + 1, z, WALL_STEP) + Vector3(0.0, 4.0, 0.0), PI * 0.5):
			n += 1
	for cx in [x0, x1 + 1]:
		for cz in [z0, z1 + 1]:
			if _add(holder, PROP_DIR + "wall_corner.glb", _tile_pos(cx, cz, WALL_STEP)):
				n += 1
	print("  墙体 %d 段（整墙 + 半墙压顶，步长 %.1f m，中心对齐棋盘）" % [n, WALL_STEP])


func _build_props(root: Node3D) -> void:
	var holder := _holder(root, "Props")
	var n := 0
	# 柱子：棋盘四角内侧。中央必须留出通路（06 的教训：敌人无寻路时环形高台=死图）
	for cell in [Vector2i(0, 0), Vector2i(Board.COLS - 1, 0),
			Vector2i(0, Board.ROWS - 1), Vector2i(Board.COLS - 1, Board.ROWS - 1)]:
		if _add(holder, PROP_DIR + "pillar.glb", Board.cell_to_world(cell) + Vector3(-0.5, 0.0, -0.5)):
			n += 1
	# 火把：贴着我方前线两侧，兼作暖光源的视觉解释
	for c in [1, Board.COLS - 2]:
		if _add(holder, PROP_DIR + "torch_mounted.glb",
				Board.cell_to_world(Vector2i(c, 0)) + Vector3(-0.45, 1.1, 0.0)):
			n += 1
		if _add(holder, PROP_DIR + "torch_mounted.glb",
				Board.cell_to_world(Vector2i(c, Board.ROWS - 1)) + Vector3(-0.45, 1.1, 0.0)):
			n += 1
	for spec in PROP_SPOTS:
		if _add(holder, PROP_DIR + String(spec[0]), spec[1], float(spec[2])):
			n += 1
	print("  场景道具 %d 件（棋盘外圈，避开默认镜头方向）" % n)


func _build_surroundings(root: Node3D) -> void:
	var holder := _holder(root, "Surround")
	var n := 0
	for spec in SURROUND_SPOTS:
		if _add(holder, SURROUND_DIR + String(spec[0]), spec[1], float(spec[2])):
			n += 1
	print("  远景 %d 件（全部在 -Z 半侧与两侧）" % n)


func _build_lights(root: Node3D) -> void:
	# 主光：黄昏暖色斜射
	var sun := DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-52.0, 38.0, 0.0)
	sun.light_color = Color(1.0, 0.88, 0.72)
	sun.light_energy = 1.25
	sun.shadow_enabled = true
	root.add_child(sun)
	sun.owner = root
	# 补光：冷色，从敌方一侧压一点，避免暗部死黑
	var fill := DirectionalLight3D.new()
	fill.name = "Fill"
	fill.rotation_degrees = Vector3(-24.0, -140.0, 0.0)
	fill.light_color = Color(0.55, 0.68, 0.90)
	fill.light_energy = 0.45
	fill.shadow_enabled = false
	root.add_child(fill)
	fill.owner = root
	# 火把点光：暖色，兼作「战场是户外竞技场」的视觉锚
	for i in range(2):
		var o := OmniLight3D.new()
		o.name = "Torch_%d" % i
		o.position = Board.cell_to_world(Vector2i(1 if i == 0 else Board.COLS - 2, 0)) + Vector3(0.0, 1.5, 0.0)
		o.light_color = Color(1.0, 0.68, 0.38)
		o.light_energy = 2.0
		o.omni_range = 7.0
		root.add_child(o)
		o.owner = root
	print("  灯光 4 盏")
