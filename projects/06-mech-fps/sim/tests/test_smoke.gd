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
