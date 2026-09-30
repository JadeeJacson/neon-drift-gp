@tool
extends SceneTree
## 一次性设置脚本：把 08 的输入动作正式写进 project.godot。
##
## 为什么不用 InputMap.add_action()：Godot 4 里它只改内存，ProjectSettings.save()
## 也不会回写 input/ 段——进程一退就全丢（路线图 §5.0 第 1 条，06 踩过）。
## 正确写法是直接 set_setting("input/<name>")，且**必须 grep project.godot 复核**，
## 别信脚本自己打印的「保存成功」（save() 返回 OK 但内容没变就是这个坑）。
##
## 用法（lab 根目录）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/08-neon-dive -s res://tools/setup_inputmap.gd

const KEY_ACTIONS := {
	"move_left": [KEY_A, KEY_LEFT],
	"move_right": [KEY_D, KEY_RIGHT],
	"jump": [KEY_SPACE, KEY_W, KEY_UP],
	"dash": [KEY_SHIFT, KEY_CTRL],
	"attack_light": [KEY_J],
	"attack_heavy": [KEY_K],
	"parry": [KEY_L],
	"shoot": [KEY_U, KEY_I],
	"restart": [KEY_R],
	"pause": [KEY_ESCAPE],
}


func _initialize() -> void:
	for action_name in KEY_ACTIONS:
		var events: Array = []
		for keycode in KEY_ACTIONS[action_name]:
			events.append(_key_event(int(keycode)))
		ProjectSettings.set_setting("input/" + action_name, {
			"deadzone": 0.2,
			"events": events,
		})
	var err := ProjectSettings.save()
	if err != OK:
		push_error("ProjectSettings.save() 失败，错误码 %d" % err)
		quit(1)
		return
	print("InputMap 写入 %d 个动作；务必 grep project.godot 复核" % KEY_ACTIONS.size())
	quit(0)


func _key_event(keycode: int) -> InputEventKey:
	var ev := InputEventKey.new()
	ev.physical_keycode = keycode
	ev.device = -1  # 脚本模式默认会序列化出 device:16，必须改回 -1（任意设备），见 §5.0 第 6 条
	return ev
