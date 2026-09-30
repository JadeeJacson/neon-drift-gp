extends SceneTree
## 多机位截图 / 渲染验收工具（**不能加 --headless**，dummy 驱动不出画面）。
##
## 为什么值得单独存在：SDFGI 收敛、TAA 收敛、体积雾时域重投影都需要「跑一段时间」
## 再取图，人手截图没法保证每次都等够帧；这个工具把「等够 → 切机位 → 存 PNG」固化。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --path projects/17-aureole-hall \
##     --resolution 1600x900 -s res://tools/capture_shots.gd -- \
##     --shots=wide,mezz,corridor,detail,up --warm=260 --frames=90 \
##     --out=_scratch/shots/17 --scale=1.25 --keep-hud
##   --shots=all（默认）= 五个机位全拍；--smoke = 只验构建不截图（可配 --headless）

const SHOT_NAMES := ["wide", "mezz", "corridor", "detail", "up"]

var _shots: Array[String] = []
var _warm := 260
var _frames := 90
var _out := "_scratch/shots/17"
var _scale := 1.0
var _keep_hud := false
var _smoke := false


func _initialize() -> void:
	_parse_args()
	var t0 := Time.get_ticks_msec()

	var main := (load("res://scenes/arena.tscn") as PackedScene).instantiate()
	root.add_child(main)

	if _smoke:
		for i in 30:
			await process_frame
		var node_count := _count_nodes(main)
		print("SMOKE-OK nodes=%d proc_tex=%s" % [node_count, ProcTex.stats()])
		quit(0)
		return

	if _scale > 1.0:
		# 超采样：3D 渲染分辨率放大再回落采，出图锐度收益明显
		if "scaling_3d_scale" in root:
			root.set("scaling_3d_scale", _scale)
			print("SCALE 3d=%.2f" % _scale)

	# 等一帧：_ready 可能在 _initialize 阶段还没跑完，hud 此时还取不到
	await process_frame
	if not _keep_hud:
		var hud := main.get("hud") as Label
		if hud != null:
			hud.visible = false
			print("HUD hidden")
		else:
			print("HUD not found (skip hide)")

	# 预热：SDFGI 级联构建 + TAA/体积雾时域收敛
	for i in _warm:
		await process_frame

	var results: Array[String] = []
	for shot in _shots:
		main.call("set_shot", shot)
		for i in _frames:
			await process_frame
		var cam := main.get("cam") as Camera3D
		if cam != null:
			print("SHOT-%s cam=%s fov=%.0f look=%s" % [
				shot, str(cam.global_position), cam.fov,
				str(-cam.global_transform.basis.z)])
		var vc := root.get_camera_3d()
		print("  viewport-cam=%s current=%s fov=%s" % [
			str(vc.global_position) if vc != null else "null",
			str(vc.current) if vc != null else "-",
			str(vc.fov) if vc != null else "-"])
		var cams: Array[Camera3D] = []
		_collect_cams(main, cams)
		print("  cameras-in-tree=%d" % cams.size())
		for c in cams:
			print("    cam %s pos=%s cur=%s" % [c.name, str(c.global_position), str(c.current)])
		var path := _save(shot)
		results.append(path)

	var total := Time.get_ticks_msec() - t0
	var frames_total := _warm + _shots.size() * _frames
	print("CAPTURE-DONE shots=%d avg_ms=%.1f total_ms=%d" % [
		results.size(), float(total) / float(frames_total), total])
	for r in results:
		print("  " + r)
	quit(0)


func _save(shot: String) -> String:
	var image := root.get_texture().get_image()
	if image == null or image.get_width() == 0:
		push_error("截图为空（headless？）")
		return "ERR"
	var path := "%s/%s.png" % [_out, shot]
	var abs_path := path
	if not path.contains(":") and not path.begins_with("/"):
		abs_path = ProjectSettings.globalize_path("res://") + "../../" + path
	DirAccess.make_dir_recursive_absolute(abs_path.get_base_dir())
	var err := image.save_png(abs_path)
	if err != OK:
		push_error("保存失败 %d: %s" % [err, abs_path])
	return "%s (%dx%d err=%d)" % [abs_path, image.get_width(), image.get_height(), err]


func _count_nodes(n: Node) -> int:
	var c := 1
	for child in n.get_children():
		c += _count_nodes(child)
	return c


func _collect_cams(n: Node, out: Array[Camera3D]) -> void:
	var c := n as Camera3D
	if c != null:
		out.append(c)
	for child in n.get_children():
		_collect_cams(child, out)


func _parse_args() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--shots="):
			var v := arg.trim_prefix("--shots=")
			if v != "all":
				_shots.clear()
				for part in v.split(",", false):
					_shots.append(String(part))
		elif arg.begins_with("--warm="):
			_warm = int(arg.trim_prefix("--warm="))
		elif arg.begins_with("--frames="):
			_frames = int(arg.trim_prefix("--frames="))
		elif arg.begins_with("--out="):
			_out = arg.trim_prefix("--out=")
		elif arg.begins_with("--scale="):
			_scale = float(arg.trim_prefix("--scale="))
		elif arg == "--keep-hud":
			_keep_hud = true
		elif arg == "--smoke":
			_smoke = true
	if _shots.is_empty():
		for s in SHOT_NAMES:
			_shots.append(String(s))
