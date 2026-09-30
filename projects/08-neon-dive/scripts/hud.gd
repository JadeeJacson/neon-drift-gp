extends CanvasLayer
class_name NeonHud
## HUD：HP / 氧 / 电 三条 + 连段与弹反提示。
##
## 全部用代码搭（06 同路子）：M2 阶段 UI 还会反复改位置，
## 写进 .tscn 反而让 diff 变噪音。字号/间距按 640×360 基准，
## canvas_items 缩放下会跟着放大，不需要适配代码。
##
## 三条计量的视觉优先级是设计决定：氧最宽（它是时间压力），
## 电次之并且**只在有富余时**显示消耗预告，HP 最窄但颜色最刺眼。

const T := preload("res://sim/combat_table.gd")

## kind → {"fill": ColorRect, "full": float}。
## 必须把「满宽」存下来：上一版从 bar.size.x 反推满宽，
## 而 size.x 本身每次刷新都在变小，三条条会指数级塌成 0。
var _bars: Dictionary = {}

var _hp: ColorRect = null
var _o2: ColorRect = null
var _pwr: ColorRect = null
var _hint: Label = null
var _depth: Label = null
var _flash_red: ColorRect = null
var _flash_red_t: float = 0.0
var _death: Label = null
var _death_t: float = 0.0
var _debug: Label = null
var _toast: Label = null
var _toast_t: float = 0.0
var _toast_queue: Array[String] = []


func _ready() -> void:
	layer = 30
	var root := Control.new()
	root.name = "HudRoot"
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(root)

	_o2 = _bar(root, Vector2(8, 8), Vector2(96, 5), Color(0.35, 0.85, 1.0), "氧")
	_pwr = _bar(root, Vector2(8, 20), Vector2(72, 5), Color(1.0, 0.8, 0.30), "电")
	_hp = _bar(root, Vector2(8, 32), Vector2(56, 5), Color(1.0, 0.35, 0.45), "HP")
	register_bar("o2", _o2)
	register_bar("power", _pwr)
	register_bar("hp", _hp)

	_hint = Label.new()
	_hint.position = Vector2(8, 44)
	_hint.add_theme_font_size_override("font_size", 8)
	_hint.modulate = Color(0.7, 0.95, 1.0, 0.9)
	root.add_child(_hint)

	_depth = Label.new()
	_depth.position = Vector2(640 - 60, 8)
	_depth.add_theme_font_size_override("font_size", 9)
	_depth.modulate = Color(0.6, 0.9, 1.0, 0.85)
	_depth.text = "DEPTH 1F"
	root.add_child(_depth)

	# 成就提示：右上、金色、带队列。不复用 hint 那条青色小字——
	# 两者同时出现时（弹反成功那一瞬间正好解锁成就）会互相掩盖
	_toast = Label.new()
	_toast.name = "AchievementToast"
	_toast.position = Vector2(640 - 258, 22)
	_toast.size = Vector2(250, 14)
	_toast.add_theme_font_size_override("font_size", 9)
	_toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_toast.modulate = Color(1.0, 0.86, 0.42, 0.0)
	_toast.text = ""
	root.add_child(_toast)

	# 受击全屏红闪：不用 shader，一个半透明 ColorRect 衰减就够
	_flash_red = ColorRect.new()
	_flash_red.color = Color(1.0, 0.2, 0.25, 0.0)
	_flash_red.position = Vector2.ZERO
	_flash_red.size = Vector2(640, 360)
	_flash_red.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_flash_red)

	# 死亡横幅：居中、大字、背板，不依赖玩家去找提示区
	_death = Label.new()
	_death.text = ""
	_death.visible = false
	_death.position = Vector2(0, 150)
	_death.size = Vector2(640, 40)
	_death.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_death.add_theme_font_size_override("font_size", 14)
	_death.add_theme_color_override("font_outline_color", Color(0.02, 0.02, 0.08, 0.9))
	_death.add_theme_constant_override("outline_size", 4)
	_death.modulate = Color(1.0, 0.45, 0.55)
	root.add_child(_death)

	# 调试行：必须在 CanvasLayer 里。上一版挂在世界节点下，
	# 镜头一跟它就跟着滚，跑十几秒后只剩半个「敌 2」在屏幕上
	_debug = Label.new()
	_debug.name = "Debug"
	_debug.position = Vector2(6, 60)
	_debug.add_theme_font_size_override("font_size", 7)
	_debug.modulate = Color(0.6, 0.95, 1.0, 0.7)
	root.add_child(_debug)


func set_debug_text(text: String) -> void:
	if _debug != null:
		_debug.text = text


func _bar(parent: Control, pos: Vector2, size: Vector2, color: Color, label: String) -> ColorRect:
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.08, 0.16, 0.85)
	bg.position = pos
	bg.size = size
	parent.add_child(bg)
	var fill := ColorRect.new()
	fill.color = color
	fill.position = pos + Vector2(1, 1)
	fill.size = Vector2(size.x - 2, size.y - 2)
	parent.add_child(fill)
	var t := Label.new()
	t.text = label
	t.position = pos + Vector2(size.x + 4, -3)
	t.add_theme_font_size_override("font_size", 7)
	t.modulate = Color(0.75, 0.85, 1.0, 0.75)
	parent.add_child(t)
	return fill


func register_bar(kind: String, fill: ColorRect) -> void:
	_bars[kind] = {"fill": fill, "full": fill.size.x}


func on_value(kind: String, value: float, max_value: float) -> void:
	if not _bars.has(kind):
		return
	var entry: Dictionary = _bars[kind]
	var fill := entry["fill"] as ColorRect
	var ratio := clampf(value / maxf(max_value, 0.001), 0.0, 1.0)
	fill.size.x = float(entry["full"]) * ratio
	if kind == "hp":
		fill.color = Color(1.0, 0.35, 0.45).lerp(Color(1.0, 0.9, 0.3), 1.0 - ratio)


## 成就解锁提示。多条同时达成时排队播，不叠在一起看不清
func achievement(def: Dictionary) -> void:
	_toast_queue.append("成就解锁 · %s　%s" % [str(def["display"]), str(def["desc"])])


func hint(text: String) -> void:
	if _hint != null:
		_hint.text = text


func set_depth_text(text: String) -> void:
	if _depth != null:
		_depth.text = text


## 居中大字死亡提示（「掉坑里没反馈」的直接修复项）。
## 不靠小字 hint：掉下去时眼睛在屏幕中间，不在左上角。
func death_notice(text: String) -> void:
	if _death == null:
		return
	_death.text = text
	_death.visible = true
	_death_t = 1.0


func clear_death() -> void:
	if _death != null:
		_death.visible = false
		_death_t = 0.0


func player_hurt() -> void:
	_flash_red_t = 0.55


func _process(delta: float) -> void:
	if _flash_red_t > 0.0:
		_flash_red_t = maxf(_flash_red_t - delta * 2.6, 0.0)
		_flash_red.color = Color(1.0, 0.2, 0.25, _flash_red_t * 0.35)
	if _death != null and _death.visible and _death_t > 0.0:
		# 横幅轻微脉动，避免看起来像卡屏
		_death_t = maxf(_death_t - delta * 0.35, 0.25)
		_death.modulate.a = 0.7 + 0.3 * _death_t
	_tick_toast(delta)


func _tick_toast(delta: float) -> void:
	if _toast == null:
		return
	if _toast_t > 0.0:
		_toast_t = maxf(_toast_t - delta, 0.0)
		# 最后 0.6 秒淡出
		_toast.modulate.a = minf(1.0, _toast_t / 0.6)
		if _toast_t == 0.0:
			_toast.text = ""
	elif not _toast_queue.is_empty():
		_toast.text = _toast_queue.pop_front()
		_toast_t = 4.0
		_toast.modulate.a = 1.0


func snapshot() -> Dictionary:
	return {"hp_width": _hp.size.x if _hp else 0.0, "hint": _hint.text if _hint else "",
			"death_visible": _death.visible if _death else false,
			"depth_text": _depth.text if _depth else "",
			"toast": _toast.text if _toast else ""}