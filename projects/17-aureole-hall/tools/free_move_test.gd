extends SceneTree
## 自由漫游验证：合成键盘/鼠标事件，断言「W 真的动、鼠标真能转头、1-5 真的瞬移」。
## 用法（lab 根，**不能 --headless**，鼠标捕获与渲染都需要真窗口）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --path projects/17-aureole-hall \
##     -s res://tools/free_move_test.gd


func _initialize() -> void:
	var main := (load("res://scenes/arena.tscn") as PackedScene).instantiate()
	root.add_child(main)
	for i in 60:
		await process_frame
	var cam := main.get("cam") as Camera3D
	if cam == null:
		print("FREE-MOVE-TEST FAIL no-camera")
		quit(1)
		return

	# 1) 键盘前进：_free_move 轮询 Input 状态，不需要事件路由
	var p0 := cam.global_position
	_send_key(KEY_W, true)
	for i in 45:
		await process_frame
	_send_key(KEY_W, false)
	var moved := (cam.global_position - p0).length()
	print("MOVE forward=%.2f m (expect>1)" % moved)

	# 2) 鼠标视角：先尝试捕获，再注入位移
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	await process_frame
	var captured := Input.mouse_mode == Input.MOUSE_MODE_CAPTURED
	print("MOUSE captured=", captured)
	var yaw_ok := true
	if captured:
		var y0 := cam.rotation.y
		var mm := InputEventMouseMotion.new()
		mm.relative = Vector2(300, 0)
		Input.parse_input_event(mm)
		for i in 5:
			await process_frame
		var dy := absf(cam.rotation.y - y0)
		yaw_ok = dy > 0.01
		print("LOOK yaw-delta=%.3f rad (expect>0.01)" % dy)
	else:
		print("LOOK SKIP (window not focused)")
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

	# 3) 机位瞬移 + 自由模式保持（不被巡游拽走）
	main.call("set_shot", "corridor")
	for i in 30:
		await process_frame
	var p2 := cam.global_position
	var shot_ok := p2.distance_to(Vector3(0, 1.7, -12.0)) < 1.5
	print("SHOT pos=%s (expect≈(0,1.7,-12)) hold_ok=%s" % [str(p2), str(shot_ok)])

	# 4) HUD 文案包含自由模式提示
	var hud := main.get("hud") as Label
	var hud_ok := hud != null and hud.text.contains("自由")
	print("HUD text-ok=", hud_ok)

	var all_ok := moved > 1.0 and yaw_ok and shot_ok and hud_ok
	print("FREE-MOVE-TEST ", "PASS" if all_ok else "FAIL")
	quit(0 if all_ok else 1)


func _send_key(code: Key, pressed: bool) -> void:
	var e := InputEventKey.new()
	e.physical_keycode = code
	e.pressed = pressed
	Input.parse_input_event(e)
