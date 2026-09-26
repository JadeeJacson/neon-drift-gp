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


func _initialize() -> void:
	var added := 0
	for action_name in ACTIONS:
		var events: Array[InputEvent] = []
		for keycode in ACTIONS[action_name]:
			var ev := InputEventKey.new()
			ev.physical_keycode = keycode
			events.append(ev)

		# 关键：Godot 4 的 InputMap.add_action() 只改内存，不回写 ProjectSettings。
		# 要持久化必须直接写 "input/<name>" 设置项，格式与 project.godot 的 [input] 段一致。
		ProjectSettings.set_setting("input/" + action_name, {
			"deadzone": 0.2,
			"events": events,
		})
		added += 1

	var err := ProjectSettings.save()
	if err != OK:
		push_error("ProjectSettings.save() 失败，错误码 %d" % err)
		quit(1)
		return

	print("InputMap 写入完成：%d 个动作（新增 %d），已保存 project.godot" % [ACTIONS.size(), added])
	quit(0)
