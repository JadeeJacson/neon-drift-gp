@tool
extends SceneTree
## 一次性脚本：把输入动作**写进 project.godot**。
##
## 为什么要专门写一个脚本，而不是手改 project.godot：
## `InputMap.add_action()` 只改内存结构，**不会回写 ProjectSettings**，进程退出即丢
## （docs/00 §5.0 第 1 条，本 lab 踩过）。正确做法是
## `ProjectSettings.set_setting("input/<name>", {...})` 再 `save()`。
##
## **验证必须 grep project.godot**，别信脚本自己打的「保存成功」——save() 返回 OK
## 但内容没变的情况真的发生过。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/09-arcane-roster -s res://tools/setup_inputmap.gd

## name → [键位 keycode 或 MOUSE_BUTTON, ...]。键位用 Godot 的 Key 枚举值。
const ACTIONS := {
	"buy_1": [KEY_1], "buy_2": [KEY_2], "buy_3": [KEY_3], "buy_4": [KEY_4], "buy_5": [KEY_5],
	"reroll": [KEY_R],
	"ready": [KEY_F],
	"combine": [KEY_C],
	"sell_bench": [KEY_X],
	"autoplace": [KEY_A],
	"cam_left": [KEY_Q],
	"cam_right": [KEY_E],
	"speed_toggle": [KEY_T],
	"restart": [KEY_ENTER],
	"help": [KEY_H],
}


func _initialize() -> void:
	print("=== 09 写入 InputMap ===")
	var written := 0
	for name in ACTIONS:
		var keys: Array = ACTIONS[name]
		var events: Array = []
		for k in keys:
			var ev := InputEventKey.new()
			ev.physical_keycode = int(k)
			# device 必须显式写 -1：脚本模式新建的 InputEventKey 会序列化出 device:16，
			# 那样这个键只在 16 号设备上生效（docs/00 §5.0 第 6 条）
			ev.device = -1
			events.append(ev)
		ProjectSettings.set_setting("input/" + String(name), {
			"deadzone": 0.2,
			"events": events,
		})
		written += 1
	var err := ProjectSettings.save()
	print("[setup_inputmap] 写入 %d 个动作，save() 返回 %d" % [written, err])
	# 自检必须查 ProjectSettings，**不能查 InputMap**：
	# InputMap 是启动时从 ProjectSettings 灌进来的内存副本，脚本里改 ProjectSettings
	# 不会回填 InputMap，所以查 InputMap 必然报「缺少动作」——那是假警报。
	var missing: Array = []
	for name2 in ACTIONS:
		if not ProjectSettings.has_setting("input/" + String(name2)):
			missing.append(String(name2))
	if missing.is_empty():
		print("[setup_inputmap] ProjectSettings 自检通过（%d 个动作都在）" % written)
	else:
		print("[setup_inputmap] 警告：ProjectSettings 里缺少 %s" % ", ".join(missing))
	print("[setup_inputmap] 记得 grep project.godot 确认 [input] 段真的落盘了")
	quit()
