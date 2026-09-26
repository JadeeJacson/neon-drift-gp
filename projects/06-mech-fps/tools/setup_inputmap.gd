@tool
extends SceneTree
## 一次性设置脚本：把 Jeh3no FPS 控制器所需的输入动作正式写入 project.godot。
## 用途：消除模板 _ready() 里「missing in InputMap」的运行期警告，并让按键可在编辑器内改。
##
## 用法（lab 根目录的相对路径）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/setup_inputmap.gd

# 模板 player_character_script.gd 第 142 行把 move_left 拼成了 "...ation"（作者 typo）。
# 模板内部三处引用自洽（export 默认值 / default_input_actions 字典 / input_actions_list），
# 所以这里必须照抄错名，否则左移键仍会走运行期兜底分支。
const ACTIONS := {
	"play_char_move_forward_action": [KEY_W, KEY_UP],
	"play_char_move_backward_action": [KEY_S, KEY_DOWN],
	"play_char_move_left_ation": [KEY_A, KEY_LEFT],
	"play_char_move_right_action": [KEY_D, KEY_RIGHT],
	"play_char_run_action": [KEY_SHIFT],
	"play_char_crouch_action": [KEY_C],
	"play_char_jump_action": [KEY_SPACE],
	"play_char_slide_action": [KEY_C],
	"play_char_dash_action": [KEY_CTRL],
	"play_char_fly_action": [KEY_F],
	"play_char_zoom_action": [KEY_Z],
	"play_char_mouse_mode_action": [KEY_ESCAPE],
}

## 06 战斗层动作（不属于模板，跟着 sim/weapon_table 的 3 把首发武器走）。
const COMBAT_ACTIONS := {
	"reload": [KEY_R],
	"weapon_1": [KEY_1],
	"weapon_2": [KEY_2],
	"weapon_3": [KEY_3],
	"melee_execute": [KEY_V],
}

const MOUSE_ACTIONS := {
	"fire_primary": [MOUSE_BUTTON_LEFT],
	"fire_alt": [MOUSE_BUTTON_RIGHT],
}


func _initialize() -> void:
	var table := {}
	for action_name in ACTIONS:
		table[action_name] = ACTIONS[action_name].map(_key_event)
	for action_name in COMBAT_ACTIONS:
		table[action_name] = COMBAT_ACTIONS[action_name].map(_key_event)
	for action_name in MOUSE_ACTIONS:
		table[action_name] = MOUSE_ACTIONS[action_name].map(_mouse_event)

	for action_name in table:
		# 关键：Godot 4 的 InputMap.add_action() 只改内存，不回写 ProjectSettings。
		# 要持久化必须直接写 "input/<name>" 设置项，格式与 project.godot 的 [input] 段一致。
		ProjectSettings.set_setting("input/" + action_name, {
			"deadzone": 0.2,
			"events": table[action_name],
		})

	var err := ProjectSettings.save()
	if err != OK:
		push_error("ProjectSettings.save() 失败，错误码 %d" % err)
		quit(1)
		return

	print("InputMap 写入完成：%d 个动作，已保存 project.godot（务必 grep 复核，save 返回 OK 不代表内容变了）"
		% table.size())
	quit(0)


func _key_event(keycode: int) -> InputEventKey:
	var ev := InputEventKey.new()
	ev.physical_keycode = keycode
	ev.device = -1  # 脚本模式默认会序列化出 device:16，必须改回 -1（任意设备）
	return ev


func _mouse_event(button: int) -> InputEventMouseButton:
	var ev := InputEventMouseButton.new()
	ev.button_index = button
	ev.device = -1
	return ev
