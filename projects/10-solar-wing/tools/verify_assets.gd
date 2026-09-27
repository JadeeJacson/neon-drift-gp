@tool
extends SceneTree
## 素材完整性检查：扫描 res://assets 下全部资源文件，逐个 load，任何一个失败即退出码 1。
## 供 tools/verify.mjs 的 assets 步骤调用。
## 用法（lab 根）：godot --headless --path projects/10-solar-wing -s res://tools/verify_assets.gd

const EXTS := ["glb", "jpg", "png", "ogg", "mp3"]


func _initialize() -> void:
	print("=== 素材完整性 ===")
	var files: Array[String] = []
	_scan("res://assets", files)
	var ok := 0
	var bad := 0
	for path in files:
		var res := ResourceLoader.load(path, "", ResourceLoader.CACHE_MODE_IGNORE)
		if res == null:
			print("[FAIL] 无法加载：%s" % path)
			bad += 1
		else:
			ok += 1
	print("素材 %d 个，加载成功 %d，失败 %d" % [files.size(), ok, bad])
	if files.size() < 40:
		print("[FAIL] 素材总数 %d 异常偏少（拷贝步骤没跑全？）" % files.size())
		bad += 1
	quit(1 if bad > 0 else 0)


func _scan(dir_path: String, out: Array[String]) -> void:
	var dir := DirAccess.open(dir_path)
	if dir == null:
		print("[FAIL] 目录不可读：%s" % dir_path)
		return
	dir.list_dir_begin()
	var name := dir.get_next()
	while name != "":
		var full := dir_path.path_join(name)
		if dir.current_is_dir():
			if not name.begins_with("."):
				_scan(full, out)
		else:
			var ext := name.get_extension().to_lower()
			if ext in EXTS:
				out.append(full)
		name = dir.get_next()
	dir.list_dir_end()
