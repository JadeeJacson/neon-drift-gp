extends CanvasLayer
class_name GameHud
## HUD：血量 / 弹药 / 波次 / 中央提示 / 命中与受击反馈。
## 用代码搭 UI 而不手写 Control 的 .tscn：本 lab 的验证在 --headless 下跑，
## 代码搭的层级能直接被脚本读出、改一处不用重排 XML。

const TEMPLATE_DEBUG_PATH := "HUD/PlayerCharacterProperties"

@export var show_template_debug: bool = false

var _hp_bar: ProgressBar
var _hp_label: Label
var _ammo_label: Label
var _wave_label: Label
var _message: Label
var _hitmarker: Label
var _damage_flash: ColorRect


func _ready() -> void:
	_build()


## 由 GameRoot 调用，传入玩家节点，把三条信号链接上。
## HUD 自己不找玩家路径：主场景树会被脚本重新生成，路径写在 XML 里迟早对不上。
func bind_player(player: Node) -> void:
	_hook(player)


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
	for director in get_tree().get_nodes_in_group("wave_director"):
		director.wave_started.connect(_on_wave_started)
		director.wave_cleared.connect(_on_wave_cleared)
		director.victory.connect(_on_victory)
		director.defeat.connect(_on_defeat)


func announce(text: String) -> void:
	_message.text = text


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept") and _is_terminal_state():
		get_tree().reload_current_scene()


func _is_terminal_state() -> bool:
	return _message.text.contains("胜利") or _message.text.contains("阵亡")


func _on_hp_changed(hp: float, max_hp: float) -> void:
	_hp_bar.value = 100.0 * hp / max_hp
	_hp_label.text = "HP %d" % int(round(hp))


func _on_damage_taken(_amount: float) -> void:
	_damage_flash.color = Color(0.8, 0.05, 0.05, 0.34)
	var t := create_tween()
	t.tween_property(_damage_flash, "color:a", 0.0, 0.35)


func _on_ammo_changed(mag: int, mag_size: int, reserve: int, display: String) -> void:
	var low := mag <= int(mag_size * 0.25)
	_ammo_label.text = "%s   %d / %d" % [display, mag, reserve]
	_ammo_label.add_theme_color_override("font_color",
		Color(1.0, 0.45, 0.35) if low else Color(0.92, 0.95, 1.0))


func _on_hit_confirmed(killed: bool) -> void:
	_hitmarker.add_theme_color_override("font_color",
		Color(1.0, 0.35, 0.3) if killed else Color(1, 1, 1))
	_hitmarker.modulate = Color(1, 1, 1, 1)
	var t := create_tween()
	t.tween_property(_hitmarker, "modulate:a", 0.0, 0.18)


func _on_wave_started(index: int, total: int, enemy_count: int) -> void:
	_wave_label.text = "第 %d / %d 波" % [index, total]
	_message.text = "第 %d 波 · 来 %d 个" % [index, enemy_count]
	var t := create_tween()
	t.tween_interval(2.0)
	t.tween_property(_message, "modulate:a", 0.0, 0.4)


func _on_wave_cleared(index: int, bonus_ammo: int) -> void:
	_message.modulate.a = 1.0
	_message.text = "第 %d 波清空 · 补给 +%d 发" % [index, bonus_ammo]
	var t := create_tween()
	t.tween_interval(2.0)
	t.tween_property(_message, "modulate:a", 0.0, 0.4)


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


func _build() -> void:
	var root := Control.new()
	root.name = "Root"
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_damage_flash = ColorRect.new()
	_damage_flash.color = Color(0.8, 0.05, 0.05, 0.0)
	_damage_flash.set_anchors_preset(Control.PRESET_FULL_RECT)
	_damage_flash.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(_damage_flash)

	_hitmarker = Label.new()
	_hitmarker.text = "✛"
	_hitmarker.modulate.a = 0.0
	_hitmarker.set_anchors_preset(Control.PRESET_CENTER_TOP)
	_hitmarker.position = Vector2(-14, 300)
	_hitmarker.add_theme_font_size_override("font_size", 26)
	root.add_child(_hitmarker)

	_wave_label = _make_label(Vector2(0, 18), Control.PRESET_TOP_WIDE, 22)
	_wave_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	root.add_child(_wave_label)

	_message = _make_label(Vector2(0, 120), Control.PRESET_TOP_WIDE, 34)
	_message.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_message.modulate.a = 0.0
	root.add_child(_message)

	_hp_label = _make_label(Vector2(36, 640), Control.PRESET_TOP_LEFT, 20)
	root.add_child(_hp_label)

	_hp_bar = ProgressBar.new()
	_hp_bar.show_percentage = false
	_hp_bar.min_value = 0.0
	_hp_bar.max_value = 100.0
	_hp_bar.value = 100.0
	_hp_bar.custom_minimum_size = Vector2(240, 14)
	_hp_bar.position = Vector2(36, 664)
	root.add_child(_hp_bar)

	_ammo_label = _make_label(Vector2(0, 664), Control.PRESET_TOP_RIGHT, 26)
	_ammo_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_ammo_label.offset_left = -320
	_ammo_label.offset_right = -36
	root.add_child(_ammo_label)


func _make_label(pos: Vector2, preset: int, font_size: int) -> Label:
	var label := Label.new()
	label.position = pos
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color(0.92, 0.95, 1.0))
	label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.6))
	label.add_theme_constant_override("outline_size", 4)
	if preset != Control.PRESET_TOP_LEFT:
		label.set_anchors_preset(preset)
	return label
