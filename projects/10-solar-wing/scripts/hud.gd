extends CanvasLayer
class_name GameHud
## HUD + 菜单/暂停/结算覆盖层，全部程序化构建。
## 节点名是冒烟测试的断言锚点（tools/smoke_battle.gd），改名要同步改那边。

const CYAN := Color(0.45, 0.95, 1.0)
const ORANGE := Color(1.0, 0.62, 0.25)

var root: GameRoot
var player: PlayerShip
var director: WaveDirector

var ui: Control
var crosshair: Control
var wave_label: Label
var remain_label: Label
var score_label: Label
var shield_bar: ProgressBar
var hull_bar: ProgressBar
var heat_bar: ProgressBar
var speed_label: Label
var message_label: Label
var damage_rect: TextureRect
## 装护盾/舰体/热量/速度的两组盒容器——菜单里要整组收起，
## 只藏条形控件会留下「护盾/舰体/武器热量」几个光秃秃的标题。
var vitals_box: VBoxContainer
var systems_box: VBoxContainer
var menu_layer: Control
var pause_layer: Control
var gameover_layer: Control
var victory_layer: Control
var stat_score: Label
var stat_waves: Label
var stat_kills: Label
var stat_accuracy: Label
var victory_stat_score: Label
var victory_stat_waves: Label
var victory_stat_kills: Label
var victory_stat_accuracy: Label

var _msg_t: float = 0.0
var _damage_a: float = 0.0
var _intermission_shown: float = -1.0


func _ready() -> void:
	layer = 10
	_build()


func bind(r: GameRoot, p: PlayerShip, d: WaveDirector) -> void:
	root = r
	player = p
	director = d
	p.vitals.shield_changed.connect(func(v: float) -> void: shield_bar.value = v)
	p.vitals.hull_changed.connect(func(v: float) -> void: hull_bar.value = v)
	p.vitals.heat_changed.connect(func(v: float) -> void: heat_bar.value = v)
	p.vitals.overheated.connect(func() -> void: show_message("⚠ 武器过热", 2.0))
	p.vitals.recovered.connect(func() -> void: show_message("冷却完成", 1.2))
	p.bounds_changed.connect(_on_bounds)
	director.wave_started.connect(_on_wave_started)
	director.wave_cleared.connect(_on_wave_cleared)


func set_state(state: GameRoot.State) -> void:
	var playing := state == GameRoot.State.PLAYING
	crosshair.visible = playing
	menu_layer.visible = state == GameRoot.State.MENU
	pause_layer.visible = state == GameRoot.State.PAUSED
	gameover_layer.visible = state == GameRoot.State.GAMEOVER
	victory_layer.visible = state == GameRoot.State.VICTORY
	var hud_visible := state == GameRoot.State.PLAYING or state == GameRoot.State.PAUSED
	for node: Node in [wave_label, remain_label, score_label, vitals_box, systems_box,
			message_label]:
		(node as Control).visible = hud_visible


func show_message(text: String, seconds: float = 2.0) -> void:
	message_label.text = text
	_msg_t = seconds


func set_score(value: int) -> void:
	score_label.text = "SCORE %d" % value


func flash_damage() -> void:
	_damage_a = minf(_damage_a + 0.45, 0.5)


func show_gameover(stats: Dictionary) -> void:
	_fill_stats(stats)
	gameover_layer.visible = true


func show_victory(stats: Dictionary) -> void:
	# 注意：胜利层有自己的一套 Label，不能复用 _fill_stats（那套指向失败层）。
	# 之前误调 _fill_stats 的后果是胜利屏只有分数、Waves/Kills/Accuracy 永远停在「—」。
	victory_stat_score.text = "得分　%s" % stats.get("score_text", "0")
	victory_stat_waves.text = "清波　%d / %d" % [int(stats.get("waves", 0)), WaveTable.WAVE_COUNT]
	victory_stat_kills.text = "击落　%d" % int(stats.get("kills", 0))
	victory_stat_accuracy.text = "命中率　%s" % stats.get("accuracy_text", "0%")
	victory_layer.visible = true


func _fill_stats(stats: Dictionary) -> void:
	stat_score.text = "得分　%s" % stats.get("score_text", "0")
	stat_waves.text = "清波　%d / %d" % [int(stats.get("waves", 0)), WaveTable.WAVE_COUNT]
	stat_kills.text = "击落　%d" % int(stats.get("kills", 0))
	stat_accuracy.text = "命中率　%s" % stats.get("accuracy_text", "0%")

func _process(delta: float) -> void:
	if player != null:
		speed_label.text = "%d m/s%s" % [int(player.speed), "  BOOST" if player.boosting else ""]
	if director != null and director.phase == WaveDirector.Phase.INTERMISSION:
		var left := director.intermission_left()
		remain_label.text = "整备 %d 秒" % int(ceil(left))
		_intermission_shown = left
	elif director != null and director.phase != WaveDirector.Phase.IDLE:
		remain_label.text = "敌机 %d" % director.remaining_enemies()
	if _msg_t > 0.0:
		_msg_t -= delta
		if _msg_t <= 0.0:
			message_label.text = ""
	if _damage_a > 0.0:
		_damage_a = maxf(0.0, _damage_a - delta * 2.6)
	damage_rect.modulate.a = _damage_a * 0.6


func _on_bounds(inside: bool) -> void:
	if not inside:
		show_message("⚠ 返回战区！", 1.5)


func _on_wave_started(idx: int, _total: int, count: int) -> void:
	wave_label.text = "WAVE %d / %d" % [idx, WaveTable.WAVE_COUNT]
	remain_label.text = "敌机 %d" % count
	show_message("第 %d 波来袭 · %d 架" % [idx, count], 2.4)
	_intermission_shown = -1.0


func _on_wave_cleared(idx: int, bonus: int) -> void:
	show_message("第 %d 波肃清　+%d" % [idx, bonus], 2.4)

func _build() -> void:
	ui = Control.new()
	ui.name = "Ui"
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(ui)

	# 受损反馈：径向渐变暗角。关键是**只在画面边缘成环**——被连续击中时它是常态反馈
	# （实测整屏平铺/全屏渐变都会把星空和行星糊成红褐色，准星视野全废）。
	damage_rect = TextureRect.new()
	damage_rect.name = "DamageFlash"
	var grad := Gradient.new()
	grad.set_color(0, Color(0.9, 0.12, 0.08, 0.0))
	grad.set_color(1, Color(0.9, 0.05, 0.05, 0.0))
	grad.add_point(0.62, Color(0.9, 0.06, 0.05, 0.9))
	var gtex := GradientTexture2D.new()
	gtex.gradient = grad
	gtex.fill = GradientTexture2D.FILL_RADIAL
	gtex.fill_from = Vector2(0.5, 0.5)
	gtex.fill_to = Vector2(1.0, 0.5)
	gtex.width = 256
	gtex.height = 256
	damage_rect.texture = gtex
	damage_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	damage_rect.stretch_mode = TextureRect.STRETCH_SCALE
	damage_rect.modulate.a = 0.0
	damage_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	damage_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(damage_rect)

	_build_combat_layer()
	_build_message()
	menu_layer = _build_overlay("Menu")
	_fill_menu()
	pause_layer = _build_simple_overlay("Pause", "已暂停", "Esc / Enter 继续")
	gameover_layer = _build_result_overlay("GameOver", "任务失败")
	victory_layer = _build_result_overlay("Victory", "任务完成！")
	stat_score = gameover_layer.get_node("Center/Box/Stats/Score") as Label
	stat_waves = gameover_layer.get_node("Center/Box/Stats/Waves") as Label
	stat_kills = gameover_layer.get_node("Center/Box/Stats/Kills") as Label
	stat_accuracy = gameover_layer.get_node("Center/Box/Stats/Accuracy") as Label
	victory_stat_score = victory_layer.get_node("Center/Box/Stats/Score") as Label
	victory_stat_waves = victory_layer.get_node("Center/Box/Stats/Waves") as Label
	victory_stat_kills = victory_layer.get_node("Center/Box/Stats/Kills") as Label
	victory_stat_accuracy = victory_layer.get_node("Center/Box/Stats/Accuracy") as Label
	menu_layer.visible = true
	pause_layer.visible = false
	gameover_layer.visible = false
	victory_layer.visible = false


## 准星：程序化绘制（四段短线 + 中心点）。曾用 Kenney 贴图，但深空背景下
## 细线几乎不可见；纯几何也免掉「图对不对」依赖具体 PNG。
func _build_crosshair() -> void:
	crosshair = Control.new()
	crosshair.name = "Crosshair"
	crosshair.set_anchors_preset(Control.PRESET_CENTER)
	crosshair.offset_left = -32.0
	crosshair.offset_top = -32.0
	crosshair.offset_right = 32.0
	crosshair.offset_bottom = 32.0
	crosshair.mouse_filter = Control.MOUSE_FILTER_IGNORE
	ui.add_child(crosshair)
	var segs := [
		Rect2(30, 0, 4, 14),    # 上
		Rect2(30, 50, 4, 14),   # 下
		Rect2(0, 30, 14, 4),    # 左
		Rect2(50, 30, 14, 4),   # 右
		Rect2(30, 30, 4, 4),    # 中心点
	]
	for seg in segs:
		var r := seg as Rect2
		var rect := ColorRect.new()
		rect.color = CYAN
		rect.position = r.position
		rect.size = r.size
		rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		crosshair.add_child(rect)


func _build_combat_layer() -> void:
	_build_crosshair()

	wave_label = _label("Wave", "WAVE 1 / %d" % WaveTable.WAVE_COUNT, 30, CYAN)
	_top_center(wave_label, 320.0, 18.0)
	wave_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.add_child(wave_label)

	remain_label = _label("Remain", "", 20, Color.WHITE)
	_top_center(remain_label, 320.0, 56.0)
	remain_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ui.add_child(remain_label)

	score_label = _label("Score", "SCORE 0", 30, ORANGE)
	score_label.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	score_label.offset_left = -340.0
	score_label.offset_top = 18.0
	score_label.offset_right = -28.0
	score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	ui.add_child(score_label)

	var bl := VBoxContainer.new()
	bl.name = "VitalsBox"
	vitals_box = bl
	bl.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	bl.offset_left = 28.0
	bl.offset_right = 308.0
	bl.offset_top = -150.0
	bl.offset_bottom = -24.0
	bl.add_theme_constant_override("separation", 8)
	ui.add_child(bl)
	bl.add_child(_label("ShieldCaption", "护盾", 16, CYAN))
	shield_bar = _bar("ShieldBar", CYAN)
	bl.add_child(shield_bar)
	bl.add_child(_label("HullCaption", "舰体", 16, ORANGE))
	hull_bar = _bar("HullBar", ORANGE)
	bl.add_child(hull_bar)

	var br := VBoxContainer.new()
	br.name = "SystemsBox"
	systems_box = br
	br.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	br.offset_left = -328.0
	br.offset_top = -150.0
	br.offset_right = -28.0
	br.offset_bottom = -24.0
	br.add_theme_constant_override("separation", 8)
	ui.add_child(br)
	br.add_child(_label("HeatCaption", "武器热量", 16, Color(1.0, 0.85, 0.3)))
	heat_bar = _bar("HeatBar", Color(1.0, 0.85, 0.3))
	br.add_child(heat_bar)
	speed_label = _label("Speed", "0 m/s", 26, Color.WHITE)
	speed_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	br.add_child(speed_label)


func _build_message() -> void:
	message_label = _label("Message", "", 34, Color.WHITE)
	message_label.set_anchors_preset(Control.PRESET_CENTER)
	message_label.offset_top = 110.0
	message_label.offset_bottom = 160.0
	_center_x(message_label, 700.0)
	message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	message_label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.85))
	message_label.add_theme_constant_override("outline_size", 8)
	ui.add_child(message_label)

func _build_overlay(name: String) -> Control:
	var layer := Control.new()
	layer.name = name
	layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.add_child(layer)
	var dim := ColorRect.new()
	dim.name = "Dim"
	dim.color = Color(0.01, 0.03, 0.06, 0.72)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(dim)
	var center := CenterContainer.new()
	center.name = "Center"
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	# 菜单文案整体上移：玩家舰正好在画面正中，不抬开会和标题/提示叠在一起
	center.offset_bottom = -170.0
	layer.add_child(center)
	var box := VBoxContainer.new()
	box.name = "Box"
	box.add_theme_constant_override("separation", 16)
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	center.add_child(box)
	return layer


func _build_simple_overlay(name: String, title: String, hint: String) -> Control:
	var layer := _build_overlay(name)
	var box := layer.get_node("Center/Box") as VBoxContainer
	var t := _label("Title", title, 52, CYAN)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(t)
	var h := _label("Hint", hint, 22, Color.WHITE)
	h.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(h)
	layer.visible = false
	return layer


func _build_result_overlay(name: String, title: String) -> Control:
	var layer := _build_overlay(name)
	var box := layer.get_node("Center/Box") as VBoxContainer
	var accent := CYAN if name == "Victory" else ORANGE
	var t := _label("Title", title, 56, accent)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(t)
	var stats := VBoxContainer.new()
	stats.name = "Stats"
	stats.add_theme_constant_override("separation", 6)
	box.add_child(stats)
	for key in ["Score", "Waves", "Kills", "Accuracy"]:
		var line := _label(key, "%s　—" % key, 24, Color.WHITE)
		stats.add_child(line)
	var hint := _label("Hint", "R 再来一局 · Enter 返回基地", 20, Color(0.8, 0.8, 0.8))
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(hint)
	layer.visible = false
	return layer


func _fill_menu() -> void:
	var box := menu_layer.get_node("Center/Box") as VBoxContainer
	var title := _label("Title", "SOLAR WING　日冕突围", 64, CYAN)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(title)
	var sub := _label("Sub", "太阳系 · 波次生存作战", 24, ORANGE)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(sub)
	var controls := _label("Controls",
		"鼠标 转向 · W/S 油门 · A/D 滚转 · Shift 推进 · 左键 开火\nEsc 暂停",
		20, Color(0.85, 0.9, 0.95))
	controls.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(controls)
	var start := _label("Start", "— 按 Enter 出击 —", 30, Color.WHITE)
	start.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(start)


func _label(name: String, text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.name = name
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _bar(name: String, color: Color) -> ProgressBar:
	var b := ProgressBar.new()
	b.name = name
	b.custom_minimum_size = Vector2(260, 18)
	b.show_percentage = false
	b.max_value = 100.0
	b.value = 100.0
	b.add_theme_stylebox_override("background", _bar_style(Color(0.1, 0.12, 0.16, 0.85)))
	b.add_theme_stylebox_override("fill", _bar_style(color))
	return b


func _bar_style(color: Color) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = color
	s.set_corner_radius_all(3)
	s.content_margin_top = 2.0
	s.content_margin_bottom = 2.0
	return s


func _center_x(control: Control, width: float) -> void:
	control.offset_left = -width * 0.5
	control.offset_right = width * 0.5


## Control.LayoutPreset 没有 TOP_CENTER（4.7 实测），顶部居中用锚点手摆。
func _top_center(control: Control, width: float, top: float) -> void:
	control.anchor_left = 0.5
	control.anchor_right = 0.5
	control.anchor_top = 0.0
	control.anchor_bottom = 0.0
	control.offset_left = -width * 0.5
	control.offset_right = width * 0.5
	control.offset_top = top
	control.offset_bottom = top + 44.0



