extends SceneTree
## 视觉快照工具（**必须不加 --headless** 才有真实渲染器）。
## 加载主场景 → 等若干帧 → 抓视口图像存 PNG，供人眼/AI 检查 UI 排版、飞船朝向、行星观感。
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --path projects/10-solar-wing \
##     --resolution 1280x720 -s res://tools/screenshot.gd -- --play --out=_scratch/shot_play.png
## 不带 --play 则拍的是主菜单。

const DEFAULT_OUT := "_scratch/shot_menu.png"


func _initialize() -> void:
	var out_path := DEFAULT_OUT
	var play := false
	var with_enemies := false
	var no_flash := false
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--out="):
			out_path = arg.get_slice("=", 1)
		elif arg == "--play":
			play = true
		elif arg == "--enemies":
			with_enemies = true
		elif arg == "--noflash":
			no_flash = true
	var main := _load_main()
	root.add_child(main)
	for _i in range(10):
		await process_frame
	if play:
		var gr := main as GameRoot
		gr.start_game()
		if with_enemies:
			# 把敌机摆到准星前方错开的位置（距离 × 横向），检查三个型号的朝向与体量。
			# 全部压在视线轴上会被玩家舰挡住（玩家舰在相机前 11.5 m，40 m 处的敌机正好藏其后）。
			Input.action_press("fire_primary")
			# 摆近一点看清型号朝向
			var spots: Array[Vector3] = [
				Vector3(-16.0, 1.5, 22.0),
				Vector3(17.0, -2.0, 34.0),
				Vector3(-4.0, 3.0, 48.0),
			]
			# 等到场上真有 3 架（出怪有间隔，固定帧数会拍到空场）再定格
			var waited := 0
			while waited < 1800 and gr.enemies.get_child_count() < 3:
				_place_foes(gr, spots)
				if no_flash:
					gr.hud.damage_rect.modulate.a = 0.0
					gr.hud._damage_a = 0.0
				await process_frame
				waited += 1
			for _i in range(30):
				_place_foes(gr, spots)
				if no_flash:
					gr.hud.damage_rect.modulate.a = 0.0
					gr.hud._damage_a = 0.0
				await process_frame
			Input.action_release("fire_primary")
		else:
			for _i in range(150):   # 2.5 秒：出怪、引擎音、曳光都有画面
				await process_frame
	for _i in range(4):
		await process_frame
	if play and with_enemies:
		var cam2 := (main as GameRoot).camera_rig.camera
		print("cam pos=", cam2.global_position, " fwd=", -cam2.global_basis.z)
		for child in (main as GameRoot).enemies.get_children():
			var e := child as EnemyShip
			if e == null:
				continue
			var vis := e.is_visible_in_tree()
			var to_e := e.global_position - cam2.global_position
			print("foe ", e.kind, " vis=", vis, " pos=", e.global_position,
				" dist=", "%.1f" % to_e.length(),
				" right=", "%.1f" % to_e.dot(cam2.global_basis.x),
				" up=", "%.1f" % to_e.dot(cam2.global_basis.y),
				" fwd=", "%.1f" % to_e.dot(-cam2.global_basis.z),
				" visual=", e.get_node_or_null("Visual"))
	var img := root.get_texture().get_image()
	var abs_path := out_path
	if not out_path.contains(":") and not out_path.begins_with("/"):
		abs_path = ProjectSettings.globalize_path("res://" + out_path)
	var err := img.save_png(abs_path)
	print("snapshot: %s (%dx%d) err=%d" % [abs_path, img.get_width(), img.get_height(), err])
	quit(0 if err == OK else 1)


func _place_foes(gr: GameRoot, spots: Array[Vector3]) -> void:
	var cam := gr.camera_rig.camera
	var fwd := -cam.global_basis.z
	var right := cam.global_basis.x
	var idx := 0
	for child in gr.enemies.get_children():
		var e := child as EnemyShip
		if e == null:
			continue
		var s: Vector3 = spots[mini(idx, spots.size() - 1)]
		e.global_position = cam.global_position + fwd * s.z + right * s.x + Vector3.UP * s.y
		idx += 1


func _load_main() -> Node:
	var ps := load("res://scenes/main.tscn") as PackedScene
	return ps.instantiate()
