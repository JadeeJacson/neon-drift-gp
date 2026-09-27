extends CanvasLayer
class_name GameHud
## HUD：血量 / 弹药 / 波次进度 / 击杀数 / 中央提示 / 命中与受击反馈。
## 用代码搭 UI 而不手写 Control 的 .tscn：本 lab 的验证在 --headless 下跑，
## 代码搭的层级能被冒烟测试直接读到（控件边界、文本内容），改一处也不用重排 XML。

const TEMPLATE_DEBUG_PATH := "HUD/PlayerCharacterProperties"

const ACCENT := Color(0.55, 0.85, 1.0)      # 科幻青蓝，用于常规信息
const WARN_AMMO := Color(1.0, 0.62, 0.2)    # 低弹
const WARN_HP := Color(1.0, 0.32, 0.28)     # 低血
const PANEL := Color(0.03, 0.06, 0.10, 0.55)

@export var show_template_debug: bool = false

var _hp_bar: ProgressBar
var _hp_label: Label
var _ammo_mag: Label
var _ammo_reserve: Label
var _ammo_hint: Label
var _wave_label: Label
var _kills_label: Label
var _message: Label
var _hitmarker: Label
var _damage_flash: ColorRect
var _kills := 0
var _director: WaveDirector


func _ready() -> void:
	_build()


## 由 GameRoot 调用，传入玩家节点，把三条信号链接上。
## HUD 自己不找玩家路径：主场景树会被脚本重新生成，路径写在 XML 里迟早对不上。
func bind_player(player: Node) -> void:
	_hook(player)


func announce(text: String) -> void:
	_message.modulate.a = 1.0
	_message.text = text


func _hook(player: Node) -> void:
	if not show_template_debug:
		var debug := player.get_node_or_null(NodePath(TEMPLATE_DEBUG_PATH))
		if debug != null:
			debug.visible = false  # 模板的速度/状态调试面板，正式游玩时关掉

	for vitals in get_tree().get_nodes_in_group("player_vitals"):
		vitals.hp_changed.connect(_on_hp_changed)
		vitals.damage_taken.connect(_on_damage_taken)
		vitals.died.connect(_on_died)
	for weapon in get_tree().get_nodes_in_group("weapon"):
		weapon.ammo_changed.connect(_on_ammo_changed)
		weapon.hit_confirmed.connect(_on_hit_confirmed)
		weapon.reload_started.connect(func(d: float) -> void: _show_hint("换弹中 %.1fs" % d))
	for director in get_tree().get_nodes_in_group("wave_director"):
		_director = director as WaveDirector
		director.wave_started.connect(_on_wave_started)
		director.wave_cleared.connect(_on_wave_cleared)
		director.victory.connect(_on_victory)
		director.defeat.connect(_on_defeat)
		director.alive_changed.connect(func(_a: int, _c: int) -> void: _refresh_wave_label())


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept") and _is_terminal_state():
		get_tree().reload_current_scene()


func _is_terminal_state() -> bool:
	return _message.text.contains("胜利") or _message.text.contains("阵亡")


func _refresh_wave_label() -> void:
	if _director == null:
		return
	_wave_label.text = "第 %d / %d 波 · 剩余 %d" % [
		_director.wave_number(), _director.total_waves(), _director.remaining()]


func _on_hp_changed(hp: float, max_hp: float) -> void:
	var ratio := hp / max_hp
	_hp_bar.value = 100.0 * ratio
	_hp_label.text = "%d" % int(round(hp))
	var low := ratio < 0.34
	_hp_label.add_theme_color_override("font_color", WARN_HP if low else ACCENT)
	_hp_bar.modulate = WARN_HP if low else Color.WHITE


func _on_damage_taken(_amount: float) -> void:
	_damage_flash.color = Color(0.75, 0.05, 0.05, 0.26)
	var t := create_tween()
	t.tween_property(_damage_flash, "color:a", 0.0, 0.32)


func _on_ammo_changed(mag: int, mag_size: int, reserve: int, display: String) -> void:
	var low := mag <= int(mag_size * 0.3)
	_ammo_mag.text = "%d" % mag
	_ammo_mag.add_theme_font_size_override("font_size", 40 if low else 46)
	_ammo_mag.add_theme_color_override("font_color", WARN_AMMO if low else Color(0.95, 0.97, 1.0))
	_ammo_reserve.text = "/ %d" % reserve
	_ammo_hint.text = "按 R 换弹" if (mag == 0 or (low and reserve > 0)) else ""
	_ammo_hint.add_theme_color_override("font_color", WARN_AMMO)
	_set_weapon_label(display)


func _set_weapon_label(display: String) -> void:
	_kills_label.text = "击杀 %d   %s" % [_kills, display]


func _on_hit_confirmed(killed: bool) -> void:
	if killed:
		_kills += 1
	_refresh_wave_label()
	_hitmarker.add_theme_color_override("font_color", WARN_HP if killed else Color(1, 1, 1))
	_hitmarker.text = "✕" if killed else "✛"
	_hitmarker.scale = Vector2(1.6, 1.6) if killed else Vector2.ONE
	_hitmarker.modulate = Color(1, 1, 1, 1)
	var t := create_tween()
	t.tween_property(_hitmarker, "modulate:a", 0.0, 0.26 if killed else 0.16)
	t.tween_property(_hitmarker, "scale", Vector2.ONE, 0.2)


func _on_wave_started(index: int, total: int, enemy_count: int) -> void:
	_refresh_wave_label()
	_show_hint("第 %d / %d 波 · 来 %d 个" % [index, total, enemy_count])


func _on_wave_cleared(index: int, bonus_ammo: int) -> void:
	_show_hint("第 %d 波清空 · 补给 +%d 发" % [index, bonus_ammo])


func _show_hint(text: String) -> void:
	_message.modulate.a = 1.0
	_message.text = text
	var t := create_tween()
	t.tween_interval(2.0)
	t.tween_property(_message, "modulate:a", 0.0, 0.45)


func _on_victory() -> void:
	_message.modulate.a = 1.0
	_message.text = "全部波次肃清 —— 胜利\n回车重开"


func _on_defeat() -> void:
	_message.modulate.a = 1.0
	_message.text = "驾驶员阵亡 —— 防线失守\n回车重开"


func _on_died() -> void:
	for director in get_tree().get_nodes_in_group("wave_director"):
		director.stop()
	_on_defeat()


## 供冒烟测试读取（控件边界与文本都要能被断言检查）
func panel_for_test(id: String) -> Control:
	match id:
		"hp": return _hp_bar
		"ammo": return _ammo_mag
		"wave": return _wave_label
		"message": return _message
	return null


func _build() -> void:
	var root := Control.new()
	root.name = "Root"
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_damage_flash = ColorRect.new()
	_damage_flash.color = Color(0.75, 0.05, 0.05, 0.0)
	_damage_flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	_damage_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_damage_flash)

	# 准星下方一点的命中标记，避免压住模板准星本身
	_hitmarker = Label.new()
	_hitmarker.text = "✛"
	_hitmarker.modulate.a = 0.0
	_hitmarker.position = Vector2(-16, -14)
	_hitmarker.set_anchors_preset(Control.PRESET_CENTER)
	_hitmarker.add_theme_font_size_override("font_size", 30)
	root.add_child(_hitmarker)

	# 顶部中央：波次进度
	_wave_label = _make_label("wave", Vector2(0, 22), 26, HORIZONTAL_ALIGNMENT_CENTER)
	_wave_label.set_anchors_preset(Control.PRESET_TOP_WIDE)
	root.add_child(_wave_label)

	# 中央偏下：事件提示（下移是为了不和准星/敌人抢视线）
	_message = _make_label("message", Vector2(0, 210), 34, HORIZONTAL_ALIGNMENT_CENTER)
	_message.set_anchors_preset(Control.PRESET_TOP_WIDE)
	_message.modulate.a = 0.0
	root.add_child(_message)

	# 左下：血条 + 数值
	var hp_panel := _make_panel(Vector2(30, 626), Vector2(300, 62))
	root.add_child(hp_panel)
	var hp_caption := _make_label("hp_caption", Vector2(14, 8), 18, HORIZONTAL_ALIGNMENT_LEFT)
	hp_caption.text = "装甲"
	hp_panel.add_child(hp_caption)
	_hp_label = _make_label("hp_value", Vector2(196, 4), 24, HORIZONTAL_ALIGNMENT_RIGHT)
	_hp_label.custom_minimum_size = Vector2(84, 0)
	hp_panel.add_child(_hp_label)
	_hp_bar = ProgressBar.new()
	_hp_bar.name = "HpBar"
	_hp_bar.show_percentage = false
	_hp_bar.min_value = 0.0
	_hp_bar.max_value = 100.0
	_hp_bar.value = 100.0
	_hp_bar.position = Vector2(14, 40)
	_hp_bar.custom_minimum_size = Vector2(258, 12)
	_hp_bar.size = Vector2(258, 12)
	hp_panel.add_child(_hp_bar)

	# 右下：弹药（弹匣大字 / 备弹小字 / 换弹提示）
	var ammo_panel := _make_panel(Vector2(-340, -96), Vector2(310, 76))
	ammo_panel.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	root.add_child(ammo_panel)
	_ammo_mag = _make_label("ammo_mag", Vector2(16, 6), 46, HORIZONTAL_ALIGNMENT_LEFT)
	ammo_panel.add_child(_ammo_mag)
	_ammo_reserve = _make_label("ammo_reserve", Vector2(120, 26), 24, HORIZONTAL_ALIGNMENT_LEFT)
	ammo_panel.add_child(_ammo_reserve)
	_ammo_hint = _make_label("ammo_hint", Vector2(16, 52), 17, HORIZONTAL_ALIGNMENT_LEFT)
	ammo_panel.add_child(_ammo_hint)

	# 底部中央：击杀数与当前武器
	_kills_label = _make_label("kills", Vector2(0, -34), 20, HORIZONTAL_ALIGNMENT_CENTER)
	_kills_label.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_kills_label.offset_left = -260
	_kills_label.offset_right = 260
	root.add_child(_kills_label)


func _make_panel(pos: Vector2, size: Vector2) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.position = pos
	panel.custom_minimum_size = size
	panel.size = size
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL
	style.corner_radius_top_left = 4
	style.corner_radius_top_right = 4
	style.corner_radius_bottom_left = 4
	style.corner_radius_bottom_right = 4
	style.content_margin_left = 6
	style.content_margin_right = 6
	panel.add_theme_stylebox_override("panel", style)
	return panel


func _make_label(node_name: String, pos: Vector2, font_size: int, align: int) -> Label:
	var label := Label.new()
	label.name = node_name
	label.position = pos
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color(0.95, 0.97, 1.0))
	label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.65))
	label.add_theme_constant_override("outline_size", 5)
	label.horizontal_alignment = align
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label
