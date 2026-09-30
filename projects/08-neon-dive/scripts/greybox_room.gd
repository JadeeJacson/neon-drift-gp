extends Node2D
## 灰盒训练房（M2 用，不是关卡）。四件事各自可验：
## 单跳上 3 格台、跨 5 格沟、竖井墙跳上升、一段 dash 直道。
## 平台高度全按 MovementParams 的设计区间反推，改常数时这里要跟着改（不然测不出「跳不上去」）。
##
## 视觉层不再是纯色块：06 首轮人验最大的失分就是「像个实验场地盒子」，
## 所以这里从第一天就用真实 tile 铺（从 terrain 图集里自动挑中调青灰的两格：
## 顶面一格 + 本体一格），碰撞仍由 StaticBody2D 负责。

const P := preload("res://sim/movement_params.gd")
const TILE := 16
const TERRAIN := "res://assets/tiles/terrain_16.png"
const TARGET_COLOR := Vector3(0.30, 0.42, 0.50)  # 中调青灰，与调色实验室一致

## 世界坐标矩形（左上角 + 尺寸），碰撞与视觉共用同一份数据
var _rects: Array[Rect2] = []


func _ready() -> void:
	# 地面（中间 300..380 是 5 格沟，故意留空）
	_add(Rect2(0, 328, 300, 32))
	_add(Rect2(380, 328, 260, 32))
	# 台阶：2 格 / 3 格 / 4 格（4 格是满跳边界，手感判定点）
	_add(Rect2(231, 296, 48, 16))
	_add(Rect2(118, 280, 64, 16))
	_add(Rect2(438, 264, 64, 16))
	# 高台：必须用到二段跳才上得去
	_add(Rect2(48, 112, 64, 16))
	# 竖井双墙（墙滑 + 墙跳）
	_add(Rect2(533, 130, 24, 150))
	_add(Rect2(588, 110, 24, 260))
	_build_tile_visual()
	_build_labels()


func _add(r: Rect2) -> void:
	_rects.append(r)
	var body := StaticBody2D.new()
	body.collision_layer = 2
	body.collision_mask = 0
	body.position = r.position + r.size * 0.5
	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = r.size
	col.shape = shape
	body.add_child(col)
	add_child(body)


## 从图集里挑两格实心 tile：顶面一格 + 本体一格。
## 必须用**全像素**平均不透明度筛：上一版用隔点采样（step 3），
## 把「四角实、中间空」的边框件也算成 coverage 1.0，铺出来就是一片散括号。
func _pick_cells() -> Array[Vector2i]:
	var tex: Texture2D = load(TERRAIN)
	var img := tex.get_image()
	if img.get_format() != Image.FORMAT_RGBA8:
		img.convert(Image.FORMAT_RGBA8)
	var cols := img.get_width() / TILE
	var rows := img.get_height() / TILE
	var scored: Array = []
	for row in rows:
		for col in cols:
			var alpha_sum := 0.0
			var sums := Vector3.ZERO
			for y in TILE:
				for x in TILE:
					var c := img.get_pixel(col * TILE + x, row * TILE + y)
					alpha_sum += c.a
					sums += Vector3(c.r, c.g, c.b) * c.a
			var solid := alpha_sum / float(TILE * TILE)
			if solid < 0.995:
				continue
			var mean := sums / alpha_sum
			scored.append({"dist": (mean - TARGET_COLOR).length(), "at": Vector2i(col, row),
					"luma": mean.dot(Vector3(0.299, 0.587, 0.114))})
	scored.sort_custom(func(a, b): return float(a["dist"]) < float(b["dist"]))
	var out: Array[Vector2i] = []
	for i in min(scored.size(), 2):
		var s: Dictionary = scored[i]
		out.append(s["at"])
		print("[greybox] 采用实心 tile at=%s dist=%.3f luma=%.2f（全格候选 %d 个）"
				% [s["at"], float(s["dist"]), float(s["luma"]), scored.size()])
	while out.size() < 2:
		out.append(Vector2i.ZERO)
	return out


func _build_tile_visual() -> void:
	var cells := _pick_cells()
	var tex: Texture2D = load(TERRAIN)
	var src := tex.get_image()
	if src.get_format() != Image.FORMAT_RGBA8:
		src.convert(Image.FORMAT_RGBA8)
	var canvas := Image.create(640, 360, false, Image.FORMAT_RGBA8)
	canvas.fill(Color(0, 0, 0, 0))
	for r in _rects:
		var ty_top := int(r.position.y / TILE)
		var tx0 := int(r.position.x / TILE)
		var tx1 := int(ceil((r.position.x + r.size.x) / float(TILE)))
		var ty1 := int(ceil((r.position.y + r.size.y) / float(TILE)))
		for tx in range(tx0, tx1):
			for ty in range(ty_top, ty1):
				if tx < 0 or ty < 0 or tx * TILE >= src.get_width() or ty * TILE >= src.get_height():
					continue
				# 顶面用一格、本体用另一格：只铺一格会看不出「地面有表层」这个层次
				var cell := cells[0] if ty == ty_top else cells[1]
				canvas.blit_rect(src, Rect2i(cell.x * TILE, cell.y * TILE, TILE, TILE),
						Vector2i(tx * TILE, ty * TILE))
	var spr := Sprite2D.new()
	spr.name = "Tiles"
	spr.centered = false
	spr.texture = ImageTexture.create_from_image(canvas)
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/neon_sprite.gdshader")
	mat.set_shader_parameter("mode", 2)
	spr.material = mat
	add_child(spr)


func _build_labels() -> void:
	_label(Vector2(300, 336), "5 格沟")
	_label(Vector2(118, 262), "3 格台")
	_label(Vector2(438, 246), "4 格台（满跳边界）")
	_label(Vector2(48, 94), "高台：要二段")
	_label(Vector2(533, 112), "竖井")


func _label(pos: Vector2, text: String) -> void:
	var l := Label.new()
	l.position = pos
	l.text = text
	l.add_theme_font_size_override("font_size", 7)
	l.modulate = Color(0.55, 0.9, 1.0, 0.6)
	add_child(l)
