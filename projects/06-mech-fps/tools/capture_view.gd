@tool
extends SceneTree
## 有窗口截图：把游戏跑到某一帧存成 PNG，让「viewmodel 姿态、光照氛围、HUD 排版」
## 这类只能靠眼睛判定的东西变成我能自己看、能反复对比的东西。
##
## 为什么必须**有窗口**：--headless 走 dummy 渲染驱动，不出画面，
## get_viewport().get_texture().get_image() 只会拿到空图（docs/00 §4.4）。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --path projects/06-mech-fps -s res://tools/capture_view.gd -- \
##     --weapon=dmr_sniper --pose=reload --frames=120 --out=_scratch/shots/dmr_reload.png
##
## 注意：脚本模式必须显式 quit()（§5.0b 第 6 条）。

const OUT_DEFAULT := "_scratch/shots/06_view.png"

var _main: Node
var _weapon := "assault_rifle"
var _pose := "idle"
var _frames := 120
var _out := OUT_DEFAULT


func _initialize() -> void:
	_parse_args()
	_main = _load_main()
	root.add_child(_main)
	await process_frame

	var weapon := _main.get_node_or_null(^"Player/CameraHolder/Camera/Weapon") as WeaponController
	if weapon == null:
		push_error("找不到 Weapon 节点，无法摆姿势")
	else:
		match _weapon:
			"shotgun":
				weapon.select(1)
			"dmr_sniper":
				weapon.select(2)
			_:
				weapon.select(0)
		match _pose:
			"reload":
				weapon.force_reload_for_shot()
			"fire":
				weapon.try_fire()
			"execute":
				weapon.try_execute()

	for _i in range(_frames):
		await process_frame

	# 诊断：viewmodel 到底有没有动画、播的是哪个、根节点变换是多少。
	# 没有这些就只能靠猜（第一轮我把一个双臂绑定模型按静态枪摆，画面里全是举起的手）。
	if weapon != null:
		print(weapon.viewmodel_debug())
		var cam := weapon.get_parent() as Camera3D
		if cam != null:
			print("CAM pos=%s fwd=%s" % [str(cam.global_position),
				str(-cam.global_transform.basis.z)])

	var image := root.get_texture().get_image()
	if image == null or image.get_width() == 0:
		push_error("截图为空（是否用了 --headless？）")
		quit(1)
		return
	var path := _abs(_out)
	DirAccess.make_dir_recursive_absolute(path.get_base_dir())
	var err := image.save_png(path)
	if err != OK:
		push_error("保存失败 %d：%s" % [err, path])
		quit(1)
		return
	print("SHOT %s %dx%d weapon=%s pose=%s" % [path, image.get_width(), image.get_height(), _weapon, _pose])
	quit(0)


func _load_main() -> Node:
	var packed := load("res://scenes/main.tscn") as PackedScene
	return packed.instantiate()


func _parse_args() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--weapon="):
			_weapon = arg.trim_prefix("--weapon=")
		elif arg.begins_with("--pose="):
			_pose = arg.trim_prefix("--pose=")
		elif arg.begins_with("--frames="):
			_frames = int(arg.trim_prefix("--frames="))
		elif arg.begins_with("--out="):
			_out = arg.trim_prefix("--out=")


func _abs(p: String) -> String:
	if p.is_absolute_path() or p.begins_with("res://") or p.begins_with("user://"):
		return p
	# res:// = projects/06-mech-fps/ → 上两级才是 lab 根，截图要落到 lab 根的 _scratch/
	return ProjectSettings.globalize_path("res://") + "../../" + p
