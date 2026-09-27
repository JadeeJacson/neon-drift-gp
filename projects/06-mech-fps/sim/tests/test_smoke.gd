extends GutTest

# 冒烟测试：证明 GUT 9.7.1 在 Godot 4.7.2 --headless 下可用。
# 由 tools/verify.mjs 以 gut_cmdln.gd -gexit 驱动。

func test_engine_version_is_47x() -> void:
	var info := Engine.get_version_info()
	var major: int = info.major
	var minor: int = info.minor
	assert_eq(major, 4, "引擎主版本应为 4")
	assert_eq(minor, 7, "引擎次版本应为 7（版本固定红线，见 docs/versions.md）")


func test_assertion_plumbing_works() -> void:
	var waves := [1, 3, 5, 8, 12]
	assert_eq(waves.size(), 5, "数组断言应生效")
	assert_gt(waves[-1], waves[0], "波次表应递增")


## GUT 对**解析失败**的测试文件是静默忽略的：只打一条 `[GUT WARNING] Ignoring script`，
## 然后照样报 "All tests passed"。也就是说「新增了一个测试文件」和「那个文件根本没跑」
## 在输出上长得一模一样（本轮就撞上过：断言写成 assertFalse 而不是 assert_false，
## 整个文件被跳过，计数纹丝不动）。这条守卫把目录里每个 test_*.gd 真的 load 一遍。
func test_every_test_script_actually_parses() -> void:
	var dir := DirAccess.open("res://sim/tests")
	assert_not_null(dir, "测试目录不存在")
	if dir == null:
		return
	var checked := 0
	for f in dir.get_files():
		var name := String(f)
		if not name.begins_with("test_") or not name.ends_with(".gd"):
			continue
		var path := "res://sim/tests/" + name
		var script := load(path) as GDScript
		assert_true(script != null and script.can_instantiate(),
			"%s 解析不过会被 GUT 静默跳过" % name)
		checked += 1
	assert_gt(checked, 5, "至少应有 6 个测试文件在跑")
