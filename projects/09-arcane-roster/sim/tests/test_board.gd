extends GutTest
## 棋盘几何：坐标、射程、移动。**这些是「玩家能不能算清楚」的地基**，
## 错一位就会表现为「明明只差一格却打不到」这种无法解释的观感。


func test_grid_shape() -> void:
	assert_eq(Board.COLS, 8)
	assert_eq(Board.ROWS, 8)
	assert_eq(Board.ALLY_ROWS.size() + Board.ENEMY_ROWS.size(), Board.ROWS, "两方行数之和必须等于总行数")
	assert_eq(Board.ALLY_ROWS, [4, 5, 6, 7])
	assert_eq(Board.ENEMY_ROWS, [0, 1, 2, 3])


func test_sides_never_overlap() -> void:
	for r in Board.ALLY_ROWS:
		assert_false(Board.ENEMY_ROWS.has(r), "行 %d 不能同时属于双方" % r)


func test_forward_rows_face_each_other() -> void:
	# 我方前线行号必须大于敌方前线行号（数值上），否则 move_toward 会往回走
	assert_gt(Board.front_row(Board.ALLY), Board.front_row(Board.ENEMY),
		"我方前线行号必须大于敌方前线行号")
	assert_eq(Board.forward_dir(Board.ALLY), -1, "我方向 -y 推进")
	assert_eq(Board.forward_dir(Board.ENEMY), 1, "敌方�� +y 推进")


func test_in_bounds() -> void:
	assert_true(Board.in_bounds(0, 0))
	assert_true(Board.in_bounds(7, 7))
	assert_false(Board.in_bounds(-1, 0))
	assert_false(Board.in_bounds(0, 8))
	assert_false(Board.in_bounds(8, 0))
	assert_false(Board.cell_in_bounds(Vector2i(3, 12)))


func test_distances() -> void:
	assert_eq(Board.chebyshev(Vector2i(0, 0), Vector2i(3, 1)), 3)
	assert_eq(Board.chebyshev(Vector2i(2, 2), Vector2i(4, 5)), 3)
	assert_eq(Board.manhattan(Vector2i(0, 0), Vector2i(3, 1)), 4)
	assert_eq(Board.chebyshev(Vector2i(1, 1), Vector2i(1, 1)), 0)


func test_melee_range_is_eight_directions() -> void:
	# 斜向相邻必须算「够得着」——这是刻意的：曼哈顿距离会制造「差一格却打不到」
	assert_true(Board.in_range(Vector2i(4, 4), Vector2i(5, 5), 1), "斜向相邻应可攻击")
	assert_true(Board.in_range(Vector2i(4, 4), Vector2i(4, 5), 1), "正前方应可攻击")
	assert_false(Board.in_range(Vector2i(4, 4), Vector2i(6, 4), 1), "隔 2 格不可攻击")


func test_ranged_range_is_square() -> void:
	assert_true(Board.in_range(Vector2i(4, 4), Vector2i(7, 7), 3), "3 格范围是 7×7 方块")
	assert_false(Board.in_range(Vector2i(4, 4), Vector2i(8, 8), 3), "超出 3 格不可攻击")


func test_range_is_symmetric() -> void:
	for a in [Vector2i(0, 0), Vector2i(3, 5), Vector2i(7, 7)]:
		for b in [Vector2i(1, 1), Vector2i(6, 2)]:
			assert_eq(Board.in_range(a, b, 2), Board.in_range(b, a, 2), "射程判定必须对称 %s/%s" % [a, b])


func test_step_toward_never_increases_distance() -> void:
	# 这是修过的 bug：曾经把「反向」也放进候选，导致被挡住的单位无限抖动
	var occ := {}
	var cases := [
		[Vector2i(4, 7), Vector2i(4, 0)],
		[Vector2i(0, 6), Vector2i(7, 1)],
		[Vector2i(4, 4), Vector2i(5, 3)],
		[Vector2i(7, 7), Vector2i(0, 0)],
	]
	for c in cases:
		var from_cell: Vector2i = c[0]
		var to_cell: Vector2i = c[1]
		var nxt := Board.step_toward(from_cell, to_cell, occ, Board.ALLY)
		var d0 := Board.chebyshev(from_cell, to_cell)
		var d1 := Board.chebyshev(nxt, to_cell)
		assert_lte(d1, d0, "%s → %s 距离不能变大（%d → %d）" % [from_cell, nxt, d0, d1])


func test_step_toward_crosses_halves_in_battle() -> void:
	# **战斗中的移动不设半场边界**（2026-09-28 设计变更）：
	# 分层布阵后敌方远程缩在 row 2，若近战被锁死在 row 4，距离 2 > 射程 1，
	# 永远够不到 → 残局被远程白嫖到超时（实测单场从 13 秒拖到 78 秒）。
	# 半场隔离只属于**摆位**（auto_place_cell / place_unit 各自有行断言）。
	var nxt := Board.step_toward(Vector2i(4, 4), Vector2i(4, 0), {}, Board.ALLY)
	assert_eq(nxt, Vector2i(4, 3), "战斗中我方单位应能越过中线追击（落到 %s）" % str(nxt))
	var nxt2 := Board.step_toward(Vector2i(4, 3), Vector2i(4, 7), {}, Board.ENEMY)
	assert_eq(nxt2, Vector2i(4, 4), "战斗中敌方单位同样能越过中线（落到 %s）" % str(nxt2))


func test_place_rules_still_respect_halves() -> void:
	# 半场隔离在**摆位**侧必须保持：自动布阵与手动落位都不许跨中线
	var ally_cell := Board.auto_place_cell(Board.ALLY, {})
	assert_true(Board.ALLY_ROWS.has(ally_cell.y), "我方自动布阵必须落在我方半场（%s）" % str(ally_cell))
	var enemy_cell := Board.auto_place_cell(Board.ENEMY, {})
	assert_true(Board.ENEMY_ROWS.has(enemy_cell.y), "敌方自动布阵必须落在敌方半场（%s）" % str(enemy_cell))


func test_step_toward_blocked_returns_self() -> void:
	var here := Vector2i(4, 6)
	var occ := {Vector2i(4, 5): 1, Vector2i(5, 6): 2, Vector2i(3, 6): 3}
	# 上下左右全被占（3,6)/(5,6) 是横向，(4,5) 是前方
	var nxt := Board.step_toward(here, Vector2i(4, 0), occ, Board.ALLY)
	assert_eq(nxt, here, "四面被堵时应原地不动，而不是抖动")


func test_step_toward_moves_when_free() -> void:
	var nxt := Board.step_toward(Vector2i(4, 6), Vector2i(4, 0), {}, Board.ALLY)
	assert_eq(nxt, Vector2i(4, 5), "空旷时应直接朝目标走一格")


func test_step_toward_is_deterministic() -> void:
	var a := Board.step_toward(Vector2i(2, 6), Vector2i(5, 0), {}, Board.ALLY)
	var b := Board.step_toward(Vector2i(2, 6), Vector2i(5, 0), {}, Board.ALLY)
	assert_eq(a, b, "同样输入必须给出同样结果")


func test_auto_place_covers_every_cell() -> void:
	var occ := {}
	var seen := []
	for _i in range(Board.ALLY_ROWS.size() * Board.COLS):
		var c := Board.auto_place_cell(Board.ALLY, occ)
		assert_false(occ.has(c), "自动布阵不能重复占位")
		occ[c] = _i
		seen.append(c)
	assert_eq(seen.size(), Board.ALLY_ROWS.size() * Board.COLS, "应能填满我方全部 %d 格" % (Board.ALLY_ROWS.size() * Board.COLS))
	for c2 in seen:
		assert_true(Board.ALLY_ROWS.has(c2.y), "布阵只能落在我方行")


func test_auto_place_front_first() -> void:
	var first := Board.auto_place_cell(Board.ALLY, {})
	assert_eq(first.y, Board.front_row(Board.ALLY), "第一个单位应落在前线行")
	var first_e := Board.auto_place_cell(Board.ENEMY, {})
	assert_eq(first_e.y, Board.front_row(Board.ENEMY), "敌方第一个单位应落在他们的前线行")


func test_cell_world_roundtrip() -> void:
	for cell in [Vector2i(0, 0), Vector2i(4, 5), Vector2i(7, 7)]:
		var w := Board.cell_to_world(cell)
		var back := Board.world_to_cell(w)
		assert_eq(back, cell, "格子 → 世界坐标 → 格子 必须能往返")


func test_cell_to_world_is_symmetric() -> void:
	# 8×8 棋盘没有正中的格子（中心在 4 格之间），所以不能断言「某格在原点」。
	# 正确的不变量是**中心对称**：(3,3) 与 (4,4) 互为相反数。
	assert_eq(Board.cell_to_world(Vector2i(3, 3)), -Board.cell_to_world(Vector2i(4, 4)),
		"棋盘中心必须对称")
	assert_eq(Board.cell_to_world(Vector2i(0, 0)), -Board.cell_to_world(Vector2i(7, 7)))
	assert_lt(Board.cell_to_world(Vector2i(0, 0)).z, 0.0, "第 0 行在 -Z 一侧")
	assert_gt(Board.cell_to_world(Vector2i(0, 7)).z, 0.0, "第 7 行在 +Z 一侧")


func test_cell_spacing() -> void:
	var d := Board.cell_to_world(Vector2i(1, 4)) - Board.cell_to_world(Vector2i(0, 4))
	assert_almost_eq(absf(d.x), Board.CELL, 0.001, "相邻格间距必须等于 CELL")
	assert_gt(Board.CELL, 1.94, "格子边长必须大于角色宽度 1.94 m，否则相邻单位穿插")
