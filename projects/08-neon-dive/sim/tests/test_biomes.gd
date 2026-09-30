extends GutTest
## 关卡特异性：群系表必须「看起来不一样、玩起来也不一样」，而且参数合法。

const B := preload("res://sim/biomes.gd")


func test_table_is_self_consistent() -> void:
	var problems: Array = B.validate()
	assert_eq(problems.size(), 0, "群系表自检失败：" + str(problems))


func test_depth_maps_to_biome_deterministically() -> void:
	# 同一 depth 永远同一群系：玩家重开同一张图不该看到别的调色
	for depth in range(1, 13):
		assert_eq(str(B.for_depth(depth)["id"]), str(B.for_depth(depth)["id"]),
				"depth=%d 映射不稳定" % depth)
	assert_eq(str(B.for_depth(1)["id"]), "shelf", "第 1 层应是浅裂带")
	assert_eq(str(B.for_depth(5)["id"]), str(B.for_depth(1)["id"]), "第 5 层应循环回第 1 层的群系")


func test_lap_increases_danger() -> void:
	# 同一群系第二圈必须更凶，否则「循环」只是换色，没有难度意义
	assert_eq(B.lap(1), 1)
	assert_eq(B.lap(5), 2)
	assert_eq(B.lap(9), 3)
	assert_gte(B.spitter_chance(9), B.spitter_chance(5), "第二圈的远程配比不该更低")
	assert_gte(B.high_share(9), B.high_share(5), "第二圈的高台怪比例不该更低")
	assert_lte(B.spitter_chance(99), 65, "远程概率要有上限，否则全是喷子")


func test_each_biome_is_a_real_choice() -> void:
	# 每个群系都得在某个维度上「不同」：灯距、沟频、平台数不能四组都一样
	var lamp_spacings := {}
	var gap_chances := {}
	for b in B.BANDS:
		lamp_spacings[int(b["lamp_spacing"])] = true
		gap_chances[int(b["gap_chance"])] = true
	assert_gte(lamp_spacings.size(), 3, "四个群系的灯距几乎一样，光照就没有特异性")
	assert_gte(gap_chances.size(), 3, "四个群系的沟频几乎一样，结构就没有特异性")


func test_shelf_has_no_ranged_enemies() -> void:
	# 第一层（浅裂带）不该出远程：读招教学期同时面对近战前摇 + 飞行道具会过载
	assert_eq(B.spitter_chance(1), 0, "depth=1 不该有远程怪")
	assert_eq(B.spitter_chance(2), 0, "depth=2（无光深渊第一圈）也不该有远程怪")


func test_ambient_stays_in_the_readable_band() -> void:
	# 「太暗」是制作人实跑打回过的（上一版 0.34）。改群系色时很容易又把它压暗，
	# 所以亮度合法性钉在表上而不是靠人记住那条反馈
	for b in B.BANDS:
		var lum: float = B.ambient_luma(b["ambient"])
		assert_between(lum, B.AMBIENT_MIN, B.AMBIENT_MAX,
				"%s 压暗亮度 %0.2f 越界" % [str(b["id"]), lum])


func test_ambient_differs_between_biomes() -> void:
	# 四个群系的压暗色不能一样，否则 CanvasModulate 接了也是白接
	var seen := {}
	for b in B.BANDS:
		var a: Color = b["ambient"]
		seen["%0.2f" % a.r + "_%0.2f" % a.g + "_%0.2f" % a.b] = true
	assert_eq(seen.size(), B.BANDS.size(), "有群系用了相同的压暗色")


func test_palette_distance_is_real() -> void:
	for i in range(B.BANDS.size()):
		for j in range(i + 1, B.BANDS.size()):
			var d: float = B.palette_distance(B.BANDS[i], B.BANDS[j])
			assert_gte(d, 0.25, "群系 %s / %s 配色距离只有 %0.2f" % [
					str(B.BANDS[i]["id"]), str(B.BANDS[j]["id"]), d])
