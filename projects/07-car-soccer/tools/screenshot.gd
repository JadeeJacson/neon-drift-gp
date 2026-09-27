extends SceneTree
## screenshot.gd — 画面自查：开窗口跑真实渲染，延迟几帧存 PNG 到 _scratch/shots/。
## headless 截不出图（路线图 §4.4），画面与氛围的机器侧检查就靠这里 + 制作人人验。
## 跑法：engines/godot/4.7.2/Godot_v4.7.2-stable_win64.exe --path projects/07-car-soccer -s res://tools/screenshot.gd

const OUT_DIR := "F:/Dev/Projects/game-lab/_scratch/shots"


func _init() -> void:
	_run()


func _shoot(file_name: String) -> void:
	await process_frame
	await RenderingServer.frame_post_draw
	var img := root.get_texture().get_image()
	img.save_png(OUT_DIR + "/" + file_name)
	print("[shot] saved ", file_name, " ", img.get_size())


func _run() -> void:
	DirAccess.make_dir_recursive_absolute(OUT_DIR)
	var main: Node = (load("res://scenes/main.tscn") as PackedScene).instantiate()
	root.add_child(main)
	# 1) 开球倒计时 + 球场全貌
	await create_timer(1.2).timeout
	await _shoot("07_kickoff.png")
	# 2) 开球后 gameplay（球在视野里）
	await create_timer(3.0).timeout
	await _shoot("07_play.png")
	# 3) 追尾相机换球追随（默认已开）：把球挪到门前制造构图
	var ball: RigidBody3D = main.get_node("Ball")
	ball.freeze = false
	ball.global_position = Vector3(20, 1.2, 6)
	await create_timer(0.8).timeout
	await _shoot("07_ballcam.png")
	main.queue_free()
	await process_frame
	quit(0)
