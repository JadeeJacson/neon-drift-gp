extends SceneTree
## setup_inputmap.gd — 一次性工具：把 07 的输入动作写进 project.godot。
## ⚠️ InputMap.add_action() 不持久化（内存结构，进程退出即丢），必须走
## ProjectSettings.set_setting + save()，并且写完要 grep project.godot 复核——
## save() 返回 OK 不代表内容变了（路线图 §5.0 第 1 条）。
## ⚠️ 脚本模式 new 出来的 InputEventKey 会序列化出 device:16，必须显式 -1（§5.0 第 6 条）。
## 跑法：$GODOT --headless --path projects/07-car-soccer -s res://tools/setup_inputmap.gd

const KEY_ACTIONS := {
	"throttle_up": [KEY_W, KEY_UP],
	"throttle_down": [KEY_S, KEY_DOWN],
	"steer_left": [KEY_A, KEY_LEFT],
	"steer_right": [KEY_D, KEY_RIGHT],
	"jump": [KEY_SPACE],
	"boost": [KEY_SHIFT],
	"handbrake": [KEY_CTRL],
}


func _init() -> void:
	for action in KEY_ACTIONS:
		var keys: Array = KEY_ACTIONS[action]
		var events: Array = []
		for k in keys:
			var ev := InputEventKey.new()
			ev.device = -1
			ev.physical_keycode = k
			events.append(ev)
		ProjectSettings.set_setting("input/" + action, {"deadzone": 0.2, "events": events})

	# 球追随视角切换：鼠标右键
	var mb := InputEventMouseButton.new()
	mb.device = -1
	mb.button_index = MOUSE_BUTTON_RIGHT
	ProjectSettings.set_setting("input/ballcam_toggle", {"deadzone": 0.2, "events": [mb]})

	var ok := ProjectSettings.save()
	print("[inputmap] save() -> ", ok)
	# 自证：读回文本数一遍动作（别信 save() 的返回值，§5.0 第 1 条）。
	# 注意 project.godot 的节写法：[input] 节下键名不带 "input/" 前缀。
	var text := FileAccess.get_file_as_string("res://project.godot")
	if not text.contains("[input]"):
		print("[inputmap] MISSING [input] section")
	var found := 0
	for action in KEY_ACTIONS:
		if text.contains(action + "={"):
			found += 1
		else:
			print("[inputmap] MISSING ", action)
	if text.contains("ballcam_toggle={"):
		found += 1
	else:
		print("[inputmap] MISSING ballcam_toggle")
	print("[inputmap] actions in project.godot: %d/8" % found)
	quit(0 if found == 8 else 1)
