extends CanvasLayer
class_name ControlsTutorial
## 游戏内按键教程（制作人 2026-09-27 反馈第 4 条：「按键教程在游戏里提示」）。
##
## 三层信息，故意不是一次性弹窗：
## 1) 开局大面板：只在每局第一次出现，几秒后淡出——第一次玩要看全，之后别挡画面；
## 2) 常驻底栏：图标 + 短文字，淡到 45% 透明度，随时能瞄一眼但不抢戏；
## 3) 情境提示：只在「第一次遇到这个情况」时飘一行字（敌人抬手→该弹反，敌人硬直→可处决）。
##    情境提示比开局面板有效得多：玩家在需要的那一刻才需要那条信息。
##
## 图标是 Kenney Input Prompts（CC0），由 tools/stage08_ui.py 按干净文件名取用。

const ICON_DIR := "res://assets/ui/"

const ROWS := [
	{"keys": ["key_a.png", "key_d.png"], "text": "移动"},
	{"keys": ["key_space.png"], "text": "跳 · 长按更高 · 空中再按二段 · 贴墙蹬"},
	{"keys": ["key_shift.png"], "text": "dash"},
	{"keys": ["key_j.png"], "text": "轻击 · 对硬直敌人是处决"},
	{"keys": ["key_k.png"], "text": "蓄力重击"},
	{"keys": ["key_l.png"], "text": "弹反（可反射飞行道具）"},
	{"keys": ["key_u.png"], "text": "飞鳌（远程）"},
	{"keys": ["key_r.png"], "text": "重开本层"},
]

## 情境提示的文案。key 用来去重：同一局里每种只飘一次
const CONTEXTS := {
	"first_enemy": "右边有敌人 · J 攻击",
	"first_tell": "敌人抬手了 · 等头顶三角胀到最大再按 L",
	"first_stun": "敌人硬直中 · J 处决（回氧）",
	"first_gap": "前面是沟 · Shift dash 或满跳过去",
	"first_low_o2": "氧不足 · 往下潜或击杀回氧",
	"first_spitter": "蓝色的是远程怪 · 它的刺可以按 L 弹反回去",
	"first_shot": "飞鳌：打不到的目标用 U 补刀",
	"first_bounce": "绿色台子弹得高 · 吃得到上面的高差",
	"first_crumble": "橙色台子会塌 · 别站在上面不动",
}

var _panel: Control = null
var _strip: Control = null
var _context: Label = null
var _context_t: float = 0.0
var _seen: Dictionary = {}
var _shown_this_run := false


func _ready() -> void:
	layer = 40
	_build_strip()
	_build_panel()
	_build_context()


func _build_strip() -> void:
	_strip = VBoxContainer.new()
	_strip.name = "Strip"
	_strip.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	_strip.position = Vector2(8, 360 - 26)
	_strip.add_theme_constant_override("separation", 2)
	_strip.modulate = Color(1, 1, 1, 0.45)
	add_child(_strip)
	for row in ROWS:
		_strip.add_child(_make_row(row, 12))


func _build_panel() -> void:
	_panel = VBoxContainer.new()
	_panel.name = "Panel"
	_panel.position = Vector2(180, 74)
	_panel.add_theme_constant_override("separation", 4)
	add_child(_panel)
	var title := Label.new()
	title.text = "操作"
	title.add_theme_font_size_override("font_size", 12)
	title.modulate = Color(0.55, 0.95, 1.0)
	_panel.add_child(title)
	for row in ROWS:
		_panel.add_child(_make_row(row, 16))


func _make_row(row: Dictionary, icon_size: int) -> Control:
	var line := HBoxContainer.new()
	line.add_theme_constant_override("separation", 4)
	for icon in row["keys"]:
		var tex := TextureRect.new()
		var res: Texture2D = load(ICON_DIR + str(icon))
		if res != null:
			tex.texture = res
		tex.custom_minimum_size = Vector2(icon_size, icon_size)
		tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		line.add_child(tex)
	var label := Label.new()
	label.text = " " + str(row["text"])
	label.add_theme_font_size_override("font_size", 7)
	label.modulate = Color(0.82, 0.92, 1.0, 0.95)
	line.add_child(label)
	return line


func _build_context() -> void:
	_context = Label.new()
	_context.name = "Context"
	_context.visible = false
	_context.position = Vector2(0, 96)
	_context.size = Vector2(640, 22)
	_context.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_context.add_theme_font_size_override("font_size", 9)
	_context.add_theme_color_override("font_outline_color", Color(0.02, 0.02, 0.08, 0.9))
	_context.add_theme_constant_override("outline_size", 3)
	_context.modulate = Color(0.6, 1.0, 0.95)
	add_child(_context)


## 每局开始（含重开）调一次：只有第一次会弹大面板
func on_run_started() -> void:
	if _shown_this_run:
		return
	_shown_this_run = true
	_panel.visible = true
	_panel.modulate = Color(1, 1, 1, 1)
	var tw := create_tween()
	tw.tween_interval(6.0)
	tw.tween_property(_panel, "modulate:a", 0.0, 1.2)
	tw.tween_callback(func(): _panel.visible = false)


## 立即收起开局面板（自动截图用：面板 6 秒才淡出，会把整张图挡住）
func hide_panel() -> void:
	if _panel != null:
		_panel.visible = false


## 情境提示：同一 key 一局只飘一次，飘字比开局面板更管用
func show_context(key: String) -> void:
	if not CONTEXTS.has(key) or _seen.has(key):
		return
	_seen[key] = true
	_context.text = str(CONTEXTS[key])
	_context.visible = true
	_context_t = 1.0


func reset_run_context() -> void:
	## 重开一局才清（重开本层不清，避免同一句提示反复飘）
	_seen.clear()


func _process(delta: float) -> void:
	if _context.visible and _context_t > 0.0:
		_context_t = maxf(_context_t - delta * 0.32, 0.0)
		_context.modulate.a = 0.55 + 0.45 * _context_t
		if _context_t <= 0.0:
			_context.visible = false


func snapshot() -> Dictionary:
	return {"panel_visible": _panel.visible, "context_visible": _context.visible,
			# shown_ever：面板靠 visible 断言会变成时间赛跑问题（6 秒后淡出本来就是设计）
			"shown_ever": _shown_this_run,
			"strip_visible": _strip.visible,
			"seen": _seen.keys()}
