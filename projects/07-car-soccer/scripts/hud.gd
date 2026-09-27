extends CanvasLayer
## hud.gd — 代码搭的 HUD（06 的路线：不开编辑器也能全套生成）。
## 布局：顶部比分 + 计时 / 右下 boost 条 / 中央提示（倒数/GO/GOAL）/ 进球闪屏 /
## 终场结算面板。字体 Kenney Future（CC0，登记见 SOURCES.md）。

const COLOR_BLUE := Color(0.22, 0.88, 1.0)
const COLOR_ORANGE := Color(1.0, 0.6, 0.24)
const COLOR_TEXT := Color(0.92, 0.95, 1.0)

var _font: FontFile
var _score_blue: Label
var _score_orange: Label
var _clock: Label
var _center: Label
var _boost_fill: ColorRect
var _flash: ColorRect
var _result: CenterContainer
var _result_title: Label
var _center_tween: Tween


func _ready() -> void:
	_font = load("res://assets/fonts/KenneyFuture.ttf") as FontFile
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_flash = ColorRect.new()
	_flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	_flash.color = Color(1, 1, 1, 0)
	_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_flash)

	var top := VBoxContainer.new()
	top.anchor_left = 0.5
	top.anchor_right = 0.5
	top.offset_left = -160
	top.offset_right = 160
	top.offset_top = 10
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(top)

	var score_row := HBoxContainer.new()
	score_row.alignment = BoxContainer.ALIGNMENT_CENTER
	score_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(score_row)
	_score_blue = _make_label(score_row, "0", 40, COLOR_BLUE)
	var mid := _make_label(score_row, ":", 34, COLOR_TEXT)
	mid.custom_minimum_size = Vector2(30, 0)
	mid.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_score_orange = _make_label(score_row, "0", 40, COLOR_ORANGE)

	_clock = _make_label(top, "3:00", 24, COLOR_TEXT)
	_clock.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	_center = _make_label(root, "", 92, Color(1, 1, 1))
	# 居中用显式 offsets（anchors 0.5 + position 的组合语义不可靠，实测标签会飞出屏幕）
	_center.anchor_left = 0.5
	_center.anchor_right = 0.5
	_center.anchor_top = 0.5
	_center.anchor_bottom = 0.5
	_center.offset_left = -300
	_center.offset_right = 300
	_center.offset_top = -240
	_center.offset_bottom = -40
	_center.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_center.vertical_alignment = VERTICAL_ALIGNMENT_CENTER

	var boost_box := VBoxContainer.new()
	boost_box.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	boost_box.position = Vector2(-260, -78)
	boost_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(boost_box)
	var boost_title := _make_label(boost_box, "BOOST", 16, Color(0.55, 0.95, 1.0))
	boost_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	var bar_bg := ColorRect.new()
	bar_bg.color = Color(0.08, 0.12, 0.2, 0.85)
	bar_bg.custom_minimum_size = Vector2(240, 26)
	boost_box.add_child(bar_bg)
	_boost_fill = ColorRect.new()
	_boost_fill.color = Color(1.0, 0.72, 0.2)
	_boost_fill.position = Vector2(2, 2)
	_boost_fill.size = Vector2(236, 22)
	bar_bg.add_child(_boost_fill)

	_result = CenterContainer.new()
	_result.set_anchors_preset(Control.PRESET_FULL_RECT)
	_result.visible = false
	_result.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_result)
	var result_box := VBoxContainer.new()
	result_box.alignment = BoxContainer.ALIGNMENT_CENTER
	_result.add_child(result_box)
	_result_title = _make_label(result_box, "", 64, COLOR_TEXT)
	_result_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	var hint := _make_label(result_box, "PRESS ENTER TO REMATCH", 20, Color(0.7, 0.8, 0.95))
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER


func _make_label(parent: Node, text: String, size: int, color: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if _font != null:
		l.add_theme_font_override("font", _font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.add_theme_color_override("font_outline_color", Color(0.02, 0.04, 0.1, 0.9))
	l.add_theme_constant_override("outline_size", 6)
	parent.add_child(l)
	return l


func set_score(blue: int, orange: int) -> void:
	_score_blue.text = str(blue)
	_score_orange.text = str(orange)


func set_clock(seconds_left: float) -> void:
	var s := int(ceilf(maxf(0.0, seconds_left)))
	_clock.text = "%d:%02d" % [s / 60, s % 60]


func set_boost(v: float) -> void:
	_boost_fill.size.x = 236.0 * clampf(v / 100.0, 0.0, 1.0)


func show_center(text: String, color: Color = Color(1, 1, 1), hold := 0.9) -> void:
	if _center_tween != null:
		_center_tween.kill()
	_center.text = text
	_center.add_theme_color_override("font_color", color)
	_center.modulate.a = 1.0
	_center_tween = create_tween()
	_center_tween.tween_interval(hold)
	_center_tween.tween_property(_center, "modulate:a", 0.0, 0.35)


func flash_goal(team: String) -> void:
	var c := COLOR_BLUE if team == "blue" else COLOR_ORANGE
	_flash.color = Color(c.r, c.g, c.b, 0.38)
	var tw := create_tween()
	tw.tween_property(_flash, "color:a", 0.0, 0.7)


func show_result(winner: String) -> void:
	if winner == "blue":
		_result_title.text = "YOU WIN!"
		_result_title.add_theme_color_override("font_color", COLOR_BLUE)
	elif winner == "orange":
		_result_title.text = "YOU LOSE"
		_result_title.add_theme_color_override("font_color", COLOR_ORANGE)
	else:
		_result_title.text = "DRAW"
		_result_title.add_theme_color_override("font_color", COLOR_TEXT)
	_result.visible = true


func hide_result() -> void:
	_result.visible = false
