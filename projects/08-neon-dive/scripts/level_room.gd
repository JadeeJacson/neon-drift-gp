extends Node2D
class_name LevelRoom
## 把 LayoutGen 的一张 plan 落成可玩的房间序列：碰撞 + tile 视觉 + 灯 + 敌人 + 拾取 + 出口。
##
## 为什么每个房间单独一张合成图：整层最宽 5×64=320 格（5120 px），
## 合成一张大图既费内存又不好按层释放；按房间切正好和「房间序列」的结构对齐。

const G := preload("res://sim/layout_gen.gd")
const CT := preload("res://sim/combat_table.gd")
const TILE := 16
const TERRAIN := "res://assets/tiles/terrain_16.png"
const TARGET_COLOR := Vector3(0.30, 0.42, 0.50)

signal exit_reached

var plan: Dictionary = {}
var pit_y: float = 0.0
var world_width: float = 0.0
var spawn_x: float = 40.0

var _lights: LightingRig = null
var _cells: Array[Vector2i] = []
var _exit_area: Area2D = null


func setup(p: Dictionary, lights: LightingRig) -> void:
	plan = p
	_lights = lights
	_cells = _pick_cells()
	pit_y = float(int(plan["pit_row"])) * TILE


## 生成器已经保证「房间首尾相接」，所以这里可以直接按 x 偏移累加
func build() -> void:
	world_width = float(int(plan["total_width_tiles"])) * TILE
	for room in plan["rooms"]:
		var ox := int(room["x"]) * TILE
		_build_room_collision(room, ox)
		_build_room_visual(room, ox)
		_build_room_lamps(room, ox)
		_build_room_enemies(room, ox)
		_build_room_pickups(room, ox)
	_build_exit()


# ---------- 碰撞 ----------

func _build_room_collision(room: Dictionary, ox: int) -> void:
	var floor_row := int(plan["floor_row"])
	var width := int(room["width"])
	# 地面按沟切成若干段：沟的位置来自生成器，这里只负责「不在沟上铺地板」
	var blocked := {}
	for g in room["gaps"]:
		for i in range(int(g["x"]), int(g["x"]) + int(g["w"])):
			blocked[i] = true
	var run_start := -1
	for x in range(0, width + 1):
		var solid := x < width and not blocked.has(x)
		if solid and run_start < 0:
			run_start = x
		elif not solid and run_start >= 0:
			_add_body(Vector2(ox + run_start * TILE, (floor_row) * TILE),
					Vector2((x - run_start) * TILE, TILE * 3))
			run_start = -1
	for p in room["platforms"]:
		# 平台不能再烤进地形贴图：塔台要能抖、能隐藏、能重生，必须是独立节点
		_add_platform(Vector2(ox + int(p["x"]) * TILE, int(p["y"]) * TILE),
				Vector2(int(p["w"]) * TILE, TILE), str(p["kind"]))


## 一块平台：solid / crumble / bounce（玩法见 NeonPlatform 顶注）
func _add_platform(top_left: Vector2, size: Vector2, kind: String) -> void:
	var body := NeonPlatform.new()
	body.name = "Plat_%d_%d" % [int(top_left.x), int(top_left.y)]
	body.kind = kind
	body.collision_layer = 2
	body.collision_mask = 0
	body.position = top_left + size * 0.5
	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = size
	col.shape = rect
	# 浮空平台用单向碰撞：能从下方穿过、能站住，但不会拦住地面跑步。
	# 上一版它是实心块，而生成器只抬 2~3 格，实际变成「1 格高的门槛」，
	# 玩家跑十几秒就撞停（拍到的 x=219 就是卡住的位置）
	col.one_way_collision = true
	body.shape = col
	body.add_child(col)
	var spr := Sprite2D.new()
	spr.centered = false
	spr.position = -size * 0.5
	spr.texture = _strip_texture(int(size.x / TILE))
	spr.material = _neon_material(2, 0.10 if kind == "bounce" else 0.06)
	spr.modulate = _kind_tint(kind)
	body.register_visual(spr)
	body.add_child(spr)
	if kind == "crumble":
		# 塌台要上报给装配层（飘第一次的提示 + 音效）。「会塌」这件事如果不说，
		# 玩家只会觉得地面无故消失——和掉坑没反馈是同一类问题
		body.crumbled.connect(_on_platform_crumbled.bind(body))
	add_child(body)


func _on_platform_crumbled(p: Node) -> void:
	var root := get_tree().get_first_node_in_group("game_root")
	if root != null and root.has_method("note_platform_crumbled"):
		root.call("note_platform_crumbled", (p as Node2D).global_position)


## 种类靠颜色与自发光区分：只看形状分不出「这块会塌」，那是不可接受的误读
func _kind_tint(kind: String) -> Color:
	match kind:
		"bounce": return Color(0.55, 1.0, 0.72)
		"crumble": return Color(1.0, 0.72, 0.45)
	return Color(1, 1, 1)


## 把 n 个表层 tile 拼成一条横向贴图（平台专用）
func _strip_texture(tiles: int) -> ImageTexture:
	var img := Image.create(maxi(tiles, 1) * TILE, TILE, false, Image.FORMAT_RGBA8)
	img.fill(Color(0, 0, 0, 0))
	var src := _terrain_image()
	for i in tiles:
		_blit(img, src, Vector2i(i * TILE, 0), _cell(0))
	return ImageTexture.create_from_image(img)


func _add_body(top_left: Vector2, size: Vector2, one_way := false) -> void:
	var body := StaticBody2D.new()
	body.collision_layer = 2
	body.collision_mask = 0
	body.position = top_left + size * 0.5
	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = size
	col.shape = rect
	# 浮空平台用单向碰撞：能从下方穿过、能站住，但不会拦住地面跑步。
	# 上一版它是实心块，而生成器只抬 2~3 格，实际变成「1 格高的门槛」，
	# 玩家跑十几秒就撞停（拍到的 x=219 就是卡住的位置）
	col.one_way_collision = one_way
	body.add_child(col)
	add_child(body)


# ---------- 视觉 ----------

func _build_room_visual(room: Dictionary, ox: int) -> void:
	var width := int(room["width"])
	var floor_row := int(plan["floor_row"])
	var h := int(plan["room_height"]) * TILE
	var canvas := Image.create(width * TILE, h, false, Image.FORMAT_RGBA8)
	canvas.fill(Color(0, 0, 0, 0))
	var src := _terrain_image()
	var bio: Dictionary = Biomes.for_depth(int(plan["depth"]))
	# 背景渐变：上亮下暗，而且颜色由群系定（关卡特异性的主要载体）
	var bg_top: Color = bio["bg_top"]
	var bg_bottom: Color = bio["bg_bottom"]
	for y in h:
		var t := float(y) / float(h)
		canvas.fill_rect(Rect2i(0, y, width * TILE, 1), bg_top.lerp(bg_bottom, t))
	for x in range(width):
		if _cell_is_gap(room, x):
			continue
		_blit(canvas, src, Vector2i(x * TILE, floor_row * TILE), _cell(0))
		_blit(canvas, src, Vector2i(x * TILE, (floor_row + 1) * TILE), _cell(1))
		_blit(canvas, src, Vector2i(x * TILE, (floor_row + 2) * TILE), _cell(1))
	var spr := Sprite2D.new()
	spr.centered = false
	spr.position = Vector2(ox, 0)
	spr.texture = ImageTexture.create_from_image(canvas)
	spr.material = _neon_material()
	spr.z_index = -10
	add_child(spr)


func _cell_is_gap(room: Dictionary, x: int) -> bool:
	for g in room["gaps"]:
		if x >= int(g["x"]) and x < int(g["x"]) + int(g["w"]):
			return true
	return false


func _cell(i: int) -> Vector2i:
	if _cells.is_empty():
		return Vector2i.ZERO
	return _cells[clampi(i, 0, _cells.size() - 1)]


func _blit(canvas: Image, src: Image, at: Vector2i, cell: Vector2i) -> void:
	if at.x < 0 or at.y < 0 or at.x + TILE > canvas.get_width() or at.y + TILE > canvas.get_height():
		return
	if cell.x * TILE + TILE > src.get_width() or cell.y * TILE + TILE > src.get_height():
		return
	canvas.blit_rect(src, Rect2i(cell.x * TILE, cell.y * TILE, TILE, TILE), at)


func _neon_material(mode: int = 2, emissive: float = 0.06) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/neon_sprite.gdshader")
	mat.set_shader_parameter("mode", mode)
	mat.set_shader_parameter("dark_gamma", 1.15)   # 比实验室的 1.45 温和：上一版整体太暗
	mat.set_shader_parameter("emissive", emissive)
	return mat


var _terrain_cache: Image = null
var _grid: NavGrid = null


## 本层的寻路网格（懒建，给敌人用）
func nav_grid() -> NavGrid:
	if _grid == null and not plan.is_empty():
		_grid = NavGrid.from_plan(plan)
	return _grid


func _terrain_image() -> Image:
	if _terrain_cache != null:
		return _terrain_cache
	var tex: Texture2D = load(TERRAIN)
	var img := tex.get_image()
	if img.get_format() != Image.FORMAT_RGBA8:
		img.convert(Image.FORMAT_RGBA8)
	_terrain_cache = img
	return img


## 全像素不透明度筛实心格，再分两类：
## 本体（body）= 颜色最均匀的那格；表层（top）= 顶边比下半部分亮的那格。
## 上一版只按「离目标色最近」取，连取两格都是「亮边暗心」的边框件，
## 铺出来地面像一排花边而不是岩石（看 08_gameplay_run 的第一版）。
func _pick_cells() -> Array[Vector2i]:
	var img := _terrain_image()
	var cols := img.get_width() / TILE
	var rows := img.get_height() / TILE
	var solid: Array = []
	for row in rows:
		for col in cols:
			var alpha_sum := 0.0
			var sums := Vector3.ZERO
			var top := Vector3.ZERO
			var bottom := Vector3.ZERO
			var var_sq := Vector3.ZERO
			for y in TILE:
				for x in TILE:
					var c := img.get_pixel(col * TILE + x, row * TILE + y)
					var rgb := Vector3(c.r, c.g, c.b)
					alpha_sum += c.a
					sums += rgb * c.a
					var_sq += rgb * rgb * c.a
					if y < 4:
						top += rgb * c.a
					elif y >= 8:
						bottom += rgb * c.a
			if alpha_sum / float(TILE * TILE) < 0.995:
				continue
			var mean := sums / alpha_sum
			var variance := (var_sq / alpha_sum - mean * mean).length()
			# 顶边亮度：表层 tile 的特征是上几行比下面明显亮（草皮/岩石受光面）
			var lip := (top / 4.0 - bottom / 8.0).length()
			solid.append({"at": Vector2i(col, row), "dist": (mean - TARGET_COLOR).length(),
					"variance": variance, "lip": lip})
	if solid.is_empty():
		return [Vector2i.ZERO, Vector2i.ZERO, Vector2i.ZERO]
	# 表层：在「足够均匀」的候选里取顶边亮暗差最大的（草皮/受光面）
	var min_var := 1e9
	for s in solid:
		min_var = minf(min_var, float(s["variance"]))
	var flat: Array = []
	for s in solid:
		if float(s["variance"]) <= min_var * 2.0 + 0.01:
			flat.append(s)
	var by_lip := flat.duplicate()
	by_lip.sort_custom(func(a, b): return float(a["lip"]) > float(b["lip"]))
	var top_cell: Vector2i = by_lip[0]["at"]
	# 本体：先要求「最均匀」（整片一个色），再按颜色距离微调。
	# 上一版把 variance 与 dist 相加且权重相当，结果挑中了「亮边暗心」的框架件，
	# 铺出来地面是一排花边。
	var by_body := flat.duplicate()
	by_body.sort_custom(func(a, b): return _body_score(a) < _body_score(b))
	var body_cell: Vector2i = by_body[0]["at"]
	print("[level] 表层 tile=%s 本体 tile=%s（实心格 %d 个）" % [top_cell, body_cell, solid.size()])
	return [top_cell, body_cell, body_cell]


func _body_score(entry: Dictionary) -> float:
	# 颜色距离只当微权重（×0.1），主目标是均匀
	return float(entry["variance"]) + float(entry["dist"]) * 0.1


# ---------- 灯（「太暗」的直接修复项） ----------

func _build_room_lamps(room: Dictionary, ox: int) -> void:
	var palette := {
		"entry": Color(0.45, 0.9, 1.0), "combat": Color(0.95, 0.45, 0.85),
		"resource": Color(0.5, 1.0, 0.75), "secret": Color(1.0, 0.8, 0.4),
		"shop": Color(0.6, 0.85, 1.0), "exit": Color(0.4, 1.0, 0.9),
	}
	# 房型给语义色（入口青、战斗品红），群系给基调：两者混一下，
	# 才能做到「同为战斗房，菌丝洞和反应堆看起来不是一张图」
	var bio: Dictionary = Biomes.for_depth(int(plan["depth"]))
	var base: Color = palette.get(str(room["type"]), Color(0.5, 0.9, 1.0))
	var color: Color = base.lerp(bio["glow_color"], 0.7)
	var energy: float = float(bio["lamp_energy"])
	for lamp in room["lamps"]:
		var at := Vector2(ox + int(lamp["x"]) * TILE + TILE * 0.5, int(lamp["y"]) * TILE)
		if _lights != null:
			_lights.add_lamp(at, color, 132.0, energy)
		# 灯本体：一颗自发光小方块，让「光源」在画面里可见而不是隐形照明
		var bead := Sprite2D.new()
		bead.position = at
		bead.scale = Vector2(0.5, 0.5)
		bead.texture = _solid_texture()
		bead.modulate = color
		var mat := _neon_material(0, 0.0)
		mat.set_shader_parameter("emissive", 1.0)
		bead.material = mat
		bead.z_index = -5
		add_child(bead)


var _solid_cache: Texture2D = null


func _solid_texture() -> Texture2D:
	if _solid_cache != null:
		return _solid_cache
	var img := Image.create(8, 8, false, Image.FORMAT_RGBA8)
	img.fill(Color.WHITE)
	_solid_cache = ImageTexture.create_from_image(img)
	return _solid_cache


# ---------- 敌人 / 拾取 / 出口 ----------

func _build_room_enemies(room: Dictionary, ox: int) -> void:
	var script: GDScript = load("res://scripts/enemy_crawler.gd")
	for e in room["enemies"]:
		var body := CharacterBody2D.new()
		body.name = "Crawler_%d_%d" % [int(room["x"]), int(e["x"])]
		body.set_script(script)
		# 必须在 add_child 之前设：敌型表是在 _ready 里按 enemy_id 读的
		body.set("enemy_id", str(e["id"]))
		body.position = Vector2(ox + int(e["x"]) * TILE, int(e["y"]) * TILE)
		add_child(body)


func _build_room_pickups(room: Dictionary, ox: int) -> void:
	for pk in room["pickups"]:
		var area := Area2D.new()
		area.collision_layer = 0
		area.collision_mask = 1          # 探玩家层
		area.position = Vector2(ox + int(pk["x"]) * TILE, int(pk["y"]) * TILE)
		var col := CollisionShape2D.new()
		var rect := RectangleShape2D.new()
		rect.size = Vector2(14, 14)
		col.shape = rect
		area.add_child(col)
		var spr := Sprite2D.new()
		spr.texture = _solid_texture()
		spr.scale = Vector2(0.6, 0.6)
		var color := Color(0.4, 0.9, 1.0) if str(pk["kind"]) == "o2" else Color(1.0, 0.85, 0.35)
		spr.modulate = color
		var mat := _neon_material(0, 0.0)
		mat.set_shader_parameter("emissive", 0.8)
		spr.material = mat
		area.add_child(spr)
		area.set_meta("kind", str(pk["kind"]))
		area.body_entered.connect(_on_pickup.bind(area))
		add_child(area)


func _on_pickup(body: Node2D, area: Area2D) -> void:
	if body == null or not body.is_in_group("player"):
		return
	var root := get_tree().get_first_node_in_group("game_root")
	if root != null and root.has_method("apply_pickup"):
		root.call("apply_pickup", str(area.get_meta("kind")))
	area.queue_free()


func _build_exit() -> void:
	var floor_row := int(plan["floor_row"])
	_exit_area = Area2D.new()
	_exit_area.name = "Exit"
	_exit_area.collision_layer = 0
	_exit_area.collision_mask = 1
	_exit_area.position = Vector2(world_width - TILE * 2, (floor_row - 2) * TILE)
	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(20, 48)
	col.shape = rect
	_exit_area.add_child(col)
	var door := Sprite2D.new()
	door.texture = _solid_texture()
	door.scale = Vector2(1.4, 3.2)
	door.modulate = Color(0.35, 1.0, 0.9)
	var mat := _neon_material(0, 0.0)
	mat.set_shader_parameter("emissive", 0.9)
	door.material = mat
	_exit_area.add_child(door)
	if _lights != null:
		_lights.add_lamp(_exit_area.position, Color(0.35, 1.0, 0.9), 150.0, 1.6)
	_exit_area.body_entered.connect(_on_exit)
	add_child(_exit_area)


func _on_exit(body: Node2D) -> void:
	if body != null and body.is_in_group("player"):
		exit_reached.emit()
