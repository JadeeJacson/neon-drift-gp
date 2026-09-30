extends Node2D
## 霓虹调色实验室（M0 美术定调，不是玩法代码）
##
## 目的：同一张画面跑四种调色模式，出对比图给制作人拍板「霓虹深潜」到底长什么样。
## 为什么必须先做这件事：06 首轮人验最大的失分就是观感（「感觉只是一个实验场地盒子」），
## 而 Pixel Adventure 原色板是明亮卡通，直接塞进暗场景会像两个游戏（docs/08 §7 风险 1）。
##
## 跑法（有窗口，headless 截不出图——路线图 §4.4）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --path projects/08-neon-dive res://scenes/labs/palette_lab.tscn
## 产物：_scratch/shots/08_palette_mode0..3.png + 一张 4 格拼接总览

const OUT_DIR := "res://../../_scratch/shots"
const TILE := 16
const VIEW_W := 640
const VIEW_H := 360
const SETTLE_FRAMES := 24  # 等 glow/粒子稳定，别拿第 1 帧当结论
const TARGET_TILE_COLOR := Vector3(0.30, 0.42, 0.50)  # 中调青灰，定调图里要的平台本体色

## 四种做法。mode 对应 neon_palette.gdshader 里的分支。
const SHOTS := [
	{"mode": 0, "label": "原图直出（基准）"},
	{"mode": 1, "label": "霓虹渐变映射（放弃原色相）"},
	{"mode": 2, "label": "深海生物发光（保留色相，推荐候选）"},
	{"mode": 3, "label": "剪影霓虹（tile 暗剪影 + 角色高亮）"},
]

var _tile_source: Image
var _tile_picks: Array[Vector2i] = []  # 自动挑出的实心 tile（见 _pick_solid_tiles）


func _ready() -> void:
	_build_world_environment()
	_build_background()
	_build_tile_layer()
	_build_characters()
	_build_motes()
	_shoot_all()


# ---------- 场景搭建 ----------

func _build_world_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.012, 0.02, 0.055)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.25, 0.45, 0.7)
	env.ambient_light_energy = 0.35
	env.glow_enabled = true
	env.glow_intensity = 0.9
	env.glow_bloom = 0.35
	env.glow_normalized = true
	# glow_levels 不单独设：Environment 上这个数组属性不能直接赋值（运行期报 Invalid assignment），
	# 默认七级曲线对这次定调足够
	env.adjustment_enabled = true
	env.adjustment_contrast = 1.12
	env.adjustment_saturation = 1.18
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)


func _build_background() -> void:
	# 纵向渐变 + 顶部雾带，把「上面是深海、下面是沟底」的方向感做出来
	var img := Image.create(VIEW_W, VIEW_H, false, Image.FORMAT_RGBA8)
	for y in VIEW_H:
		var t := float(y) / float(VIEW_H)
		# 上亮下暗：「海沟」的方向感靠这个渐变建立，上一版暗到看不出渐变，定调图就失真了
		var c := Color(0.06, 0.11, 0.26).lerp(Color(0.012, 0.02, 0.06), t)
		img.fill_rect(Rect2i(0, y, VIEW_W, 1), c)
	var spr := Sprite2D.new()
	spr.centered = false
	spr.texture = ImageTexture.create_from_image(img)
	spr.z_index = -20
	add_child(spr)


func _build_tile_layer() -> void:
	var tex: Texture2D = load("res://assets/tiles/terrain_16.png")
	_tile_source = tex.get_image()
	# 格式转换：导入后的贴图可能是压缩/半精度格式，blit 前统一成 RGBA8
	if _tile_source.get_format() != Image.FORMAT_RGBA8:
		_tile_source.convert(Image.FORMAT_RGBA8)
	_pick_solid_tiles()
	var canvas := Image.create(VIEW_W, VIEW_H, false, Image.FORMAT_RGBA8)
	canvas.fill(Color(0, 0, 0, 0))
	_layout_cave(canvas)
	var spr := Sprite2D.new()
	spr.centered = false
	spr.name = "Tiles"
	spr.texture = ImageTexture.create_from_image(canvas)
	spr.z_index = -10
	add_child(spr)


## 挑「实心块」tile：不透明度高 **且** 颜色方差低。
## 上一版只看覆盖率，结果 22×11 格里挑中的是「尖刺行」——齿之间是透明背景，
## 但齿根整片不透明，覆盖率照样 1.00，铺出来一排牙（定调图质以很难看）。
## 实心岩块的特征是「整片一个色」，所以再加一个颜色方差判据。
func _pick_solid_tiles() -> void:
	var cols := _tile_source.get_width() / TILE
	var rows := _tile_source.get_height() / TILE
	var scored: Array = []
	for row in rows:
		for col in cols:
			var total := 0
			var opaque := 0
			var sums := Vector3.ZERO
			var sq := Vector3.ZERO
			for dy in range(2, TILE - 2, 3):
				for dx in range(2, TILE - 2, 3):
					var c := _tile_source.get_pixel(col * TILE + dx, row * TILE + dy)
					total += 1
					if c.a > 0.5:
						opaque += 1
						sums += Vector3(c.r, c.g, c.b)
						sq += Vector3(c.r * c.r, c.g * c.g, c.b * c.b)
			var coverage := float(opaque) / float(maxi(total, 1))
			var variance := 0.0
			var luma := 0.0
			if opaque > 2:
				var mean := sums / float(opaque)
				var m2 := sq / float(opaque)
				variance = (m2 - mean * mean).length()
				luma = mean.dot(Vector3(0.299, 0.587, 0.114))  # GDScript 没有全局 dot()，只能用 Vector3 的方法
				var dist: float = (mean - TARGET_TILE_COLOR).length()
				scored.append({"coverage": coverage, "variance": variance, "luma": luma,
						"dist": dist, "mean": mean, "at": Vector2i(col, row)})
	scored.sort_custom(func(a, b): return float(a["dist"]) < float(b["dist"]))
	# 不再用「阈值筛」而是「离目标色最近」：上一版加完冷色限制后，选中的全是图集里
	# luma=0.13 的暗色空格（平台看不见）。目标色 = 中调青灰，对应图集里左上灰石与左下青绿科技组的本体。
	var picked: Array = []
	for s in scored:
		if float(s["coverage"]) >= 0.95 and picked.size() < 8:
			picked.append(s)
	for s in picked:
		_tile_picks.append(s["at"])
	for i in min(picked.size(), 4):
		var p: Dictionary = picked[i]
		print("[tiles] 采用 #%d at=%s  luma=%.2f  dist=%.3f"
				% [i, p["at"], float(p["luma"]), float(p["dist"])])
	print("[tiles] 图集 %d×%d 格，取走 %d 个最接近中调青灰的实心格" % [cols, rows, _tile_picks.size()])


func _tile_at(i: int) -> Rect2i:
	if _tile_picks.is_empty():
		return Rect2i(0, 0, TILE, TILE)  # 一个实心格都没挑到，退回 0,0 让画面暴露问题
	var pick: Vector2i = _tile_picks[i % _tile_picks.size()]
	return Rect2i(pick.x * TILE, pick.y * TILE, TILE, TILE)


func _layout_cave(canvas: Image) -> void:
	# 一层沟底 + 两块平台 + 左右两道墙（墙是给墙跳留的，顺带验证 tile 的竖砌效果）
	var floor_y := VIEW_H - TILE * 3
	for x in range(0, VIEW_W, TILE):
		for d in TILE * 3:
			canvas.blit_rect(_tile_source, _tile_at(0), Vector2i(x, floor_y + d))
	_blit_platform(canvas, 96, floor_y - TILE * 5, 7)
	_blit_platform(canvas, 300, floor_y - TILE * 8, 6)
	_blit_platform(canvas, 470, floor_y - TILE * 5, 6)
	for y in range(floor_y - TILE * 9, floor_y):
		canvas.blit_rect(_tile_source, _tile_at(1), Vector2i(0, y))
		canvas.blit_rect(_tile_source, _tile_at(1), Vector2i(VIEW_W - TILE, y))


func _blit_platform(canvas: Image, x: int, y: int, tiles: int) -> void:
	for i in tiles:
		canvas.blit_rect(_tile_source, _tile_at(1), Vector2i(x + i * TILE, y))
		canvas.blit_rect(_tile_source, _tile_at(0), Vector2i(x + i * TILE, y + TILE))


func _build_characters() -> void:
	var frog: Texture2D = load("res://assets/sprites/ninja_frog_run.png")
	var player := Sprite2D.new()
	player.name = "Player"
	player.texture = frog
	player.hframes = int(frog.get_width() / 32.0)
	player.frame = 1
	player.position = Vector2(150, VIEW_H - TILE * 3 - 16)
	player.scale = Vector2(2, 2)
	add_child(player)
	# 另外三个主角图当「同屏其他角色」用：同一个图集风格，能直接看出调色对角色观感的影响。
	# 不用 20 Enemies.png：那张是 630×500 的非等分拼贴图，按 32px 网格切会切出一块灰色碎片。
	var mates := ["res://assets/sprites/mask_dude_run.png",
		"res://assets/sprites/pink_man_run.png",
		"res://assets/sprites/virtual_guy_run.png"]
	for i in mates.size():
		var tex: Texture2D = load(mates[i])
		var e := Sprite2D.new()
		e.name = "Mate%d" % i
		e.texture = tex
		e.hframes = maxi(int(tex.get_width() / 32.0), 1)
		e.frame = (i * 2 + 1) % e.hframes
		e.position = Vector2(360 + i * 54.0, VIEW_H - TILE * 3 - 16)
		e.scale = Vector2(2, 2)
		add_child(e)


func _build_motes() -> void:
	# 浮尘：预处理 2 秒，第 1 帧就铺满，不然截图里是空的
	var p := CPUParticles2D.new()
	p.amount = 90
	p.lifetime = 3.0
	p.preprocess = 2.0
	p.direction = Vector2(0, -1)
	p.spread = 90.0
	p.initial_velocity_min = 4.0
	p.initial_velocity_max = 16.0
	p.gravity = Vector2.ZERO
	p.scale_amount_min = 0.6
	p.scale_amount_max = 2.0
	p.emission_shape = CPUParticles2D.EMISSION_SHAPE_RECTANGLE
	p.emission_rect_extents = Vector2(VIEW_W / 2.0, VIEW_H / 2.0)
	p.position = Vector2(VIEW_W / 2.0, VIEW_H / 2.0)
	p.color = Color(0.55, 0.9, 1.0, 0.5)
	p.z_index = 5
	add_child(p)


# ---------- 调色与截图 ----------

func _apply_mode(mode: int) -> void:
	var shader: Shader = load("res://shaders/neon_palette.gdshader")
	for child in get_children():
		var spr := child as Sprite2D
		if spr == null:
			continue
		var mat := ShaderMaterial.new()
		mat.shader = shader
		# 模式 3 只给 tile 上剪影，角色另走「生物发光」，否则主角也会变成黑块而失去可读性
		var m: int = mode
		if mode == 3 and spr.name != "Tiles":
			m = 2
		mat.set_shader_parameter("mode", m)
		mat.set_shader_parameter("glow_color", Color(0.35, 0.95, 1.0, 1.0))
		mat.set_shader_parameter("shadow_tint", Color(0.02, 0.05, 0.13, 1.0))
		spr.material = mat


func _shoot_all() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR))
	for shot in SHOTS:
		var mode: int = int(shot["mode"])
		_apply_mode(mode)
		for _i in SETTLE_FRAMES:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		var img := get_viewport().get_texture().get_image()
		var path := "%s/08_palette_mode%d.png" % [ProjectSettings.globalize_path(OUT_DIR), mode]
		var err := img.save_png(path)
		print("[shot] mode=%d %s → %s (%s)" % [mode, shot["label"], path, "OK" if err == OK else err])
	print("[shot] 完成，共 %d 张" % SHOTS.size())
	get_tree().quit(0)
