extends GutTest

## 网格寻路的断言（docs/08 §3.4）。寻路是练习期就欠下的短板，
## 所以这里不只测「能找到路」，更要测「不该找到路的地方真的找不到」——
## 穿墙、掉进虚空还继续走，都是 04/06 里出现过的实际病症。

const G := preload("res://sim/nav_grid.gd")


## 造一条 12 格宽、地面在第 5 行的走廊；skip_cols 里的列挖空（当沟）
func _corridor(skip_cols: Array = [], ledge_col := -1) -> NavGrid:
	var grid := G.new_grid(12, 8)
	for x in 12:
		if x in skip_cols:
			continue
		grid.set_cell(x, 5, G.SOLID)
		grid.set_cell(x, 6, G.SOLID)
	if ledge_col >= 0:
		grid.set_cell(ledge_col, 4, G.ONEWAY)
	return grid


func test_standable_definition() -> void:
	var grid := _corridor()
	assert_true(grid.is_standable(Vector2i(3, 4)), "地面正上方是可站立格")
	assert_false(grid.is_standable(Vector2i(3, 5)), "实心格本身不可站立")
	assert_false(grid.is_standable(Vector2i(3, 3)), "悬空且脚下没有台不算可站")
	assert_true(grid.is_standable(Vector2i(4, 3)) == false, "没有台阶时第二格空位不可站")


func test_flat_corridor_path_is_direct() -> void:
	var grid := _corridor()
	var path: Array = grid.path_to(Vector2i(1, 4), Vector2i(9, 4))
	assert_eq(path.size(), 9, "平地 8 格距离应给出 9 个格（含起点）")
	assert_eq(Vector2i(path[0]), Vector2i(1, 4), "路径从起点开始")
	assert_eq(Vector2i(path[path.size() - 1]), Vector2i(9, 4), "路径终点是目标")
	for i in range(1, path.size()):
		var step: Vector2i = Vector2i(path[i]) - Vector2i(path[i - 1])
		assert_eq(absi(step.x) + absi(step.y), 1, "相邻路径格必须只差一步，不能穿空")


func test_gap_gives_no_path_instead_of_a_half_path() -> void:
	# 沟宽 3 格：crawler 不会跳，所以正确行为是「无路」，
	# 而不是给一条掉进虚空的路径（那会让敌人在坑里抽搐）
	var grid := _corridor([5, 6, 7])
	var path: Array = grid.path_to(Vector2i(2, 4), Vector2i(10, 4))
	assert_eq(path.size(), 0, "有沟时不该找到路，实测 %s" % str(path))


func test_one_way_ledge_is_walkable_on_top() -> void:
	var grid := _corridor([], 6)
	assert_true(grid.is_standable(Vector2i(6, 3)), "单向台顶面可站立")
	assert_false(grid.is_blocked(Vector2i(6, 4)), "单向台本身不算实心（可从下方穿过）")
	var path: Array = grid.path_to(Vector2i(3, 4), Vector2i(9, 4))
	assert_gt(path.size(), 0, "同层走廊上有单向台时仍然能走通")


func test_cannot_climb_two_tiles_without_a_step() -> void:
	# 明确的模型边界：crawler 不会跳，两格高的台就不该有路。
	# 记下这条是防止以后有人「顺手」把寻路改成能穿平台
	var grid := G.new_grid(8, 8)
	for x in 8:
		grid.set_cell(x, 5, G.SOLID)
	for x in range(3, 6):
		grid.set_cell(x, 3, G.ONEWAY)     # 离地 2 格
	assert_eq(grid.path_to(Vector2i(1, 4), Vector2i(4, 2)).size(), 0,
			"两格高的单向台不该有路（crawler 不会跳）")


func test_nearest_standable_falls_downward() -> void:
	var grid := _corridor()
	var found: Vector2i = grid.nearest_standable(Vector2i(4, 1))
	assert_eq(found, Vector2i(4, 4), "空中格应就近落到下方地面格（实测 %s）" % str(found))
	assert_eq(grid.nearest_standable(Vector2i(20, 20)), Vector2i(-1, -1), "界外返回哨兵值")


func test_path_is_deterministic() -> void:
	var grid := _corridor()
	var a: Array = grid.path_to(Vector2i(1, 4), Vector2i(10, 4))
	var b: Array = grid.path_to(Vector2i(1, 4), Vector2i(10, 4))
	assert_eq(str(a), str(b), "同一张图同一端点必须给同一条路，否则测试与回放都没意义")


func test_out_of_bounds_is_treated_as_wall() -> void:
	var grid := _corridor()
	assert_true(grid.is_blocked(Vector2i(-1, 4)), "左边界外当墙")
	assert_true(grid.is_blocked(Vector2i(12, 4)), "右边界外当墙")
	# 注意用 12 而不是 11：网格宽 12 格时 x=11 仍在界内（上一版本写错这个值）
	assert_eq(grid.path_to(Vector2i(1, 4), Vector2i(12, 4)).size(), 0, "目标在界外不给路")


func test_from_plan_matches_generated_geometry() -> void:
	var LG := preload("res://sim/layout_gen.gd")
	var plan := LG.generate(2, 4242)
	var grid := G.from_plan(plan)
	var snap: Dictionary = grid.snapshot()
	assert_eq(int(snap["width"]), int(plan["total_width_tiles"]), "网格宽度要跟世界宽度一致")
	assert_gt(int(snap["standable"]), 100, "生成的层应该有大片可站立地面")
	var floor_row := int(plan["floor_row"])
	assert_true(grid.is_standable(Vector2i(2, floor_row - 1)), "入口房地面可站立")
	# 找一条沟，确认沟里不可站立（不可站立 = 敌人寻路时不会把沟当路）
	var gap_found := false
	for room in plan["rooms"]:
		for g in room["gaps"]:
			gap_found = true
			var gx := int(room["x"]) + int(g["x"]) + int(int(g["w"]) / 2)
			assert_false(grid.is_standable(Vector2i(gx, floor_row - 1)), "沟中心不该可站立")
			assert_false(grid.is_blocked(Vector2i(gx, floor_row)), "沟里不该是实心（它是空的，掉下去才算）")
	assert_true(gap_found, "这层至少该有一条沟，否则本测试没测到东西")
