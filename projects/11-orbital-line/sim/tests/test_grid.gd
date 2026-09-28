extends GutTest

# 网格：占位、可建判定、克隆、空格枚举


func test_init_all_empty() -> void:
	var g: Grid = Grid.new(6, 4)
	assert_eq(g.width, 6, "宽度")
	assert_eq(g.height, 4, "高度")
	assert_eq(g.at(0, 0), Grid.Cell.EMPTY, "初始全空")
	assert_eq(g.free_cells().size(), 24, "空格数 = w*h")


func test_out_of_bounds_is_blocked() -> void:
	var g: Grid = Grid.new(4, 4)
	assert_eq(g.at(-1, 0), Grid.Cell.BLOCKED, "越界视作障碍")
	assert_eq(g.at(0, 4), Grid.Cell.BLOCKED, "越界视作障碍")
	assert_false(g.can_place(9, 9), "越界不可建")


func test_place_and_remove() -> void:
	var g: Grid = Grid.new(5, 5)
	assert_true(g.place_tower(2, 2), "空地可建")
	assert_eq(g.at(2, 2), Grid.Cell.TOWER, "建后变塔")
	assert_false(g.place_tower(2, 2), "同格不能重复建")
	assert_false(g.is_walkable(2, 2), "塔不可通行")
	assert_true(g.remove_tower(2, 2), "可拆除")
	assert_eq(g.at(2, 2), Grid.Cell.EMPTY, "拆后恢复空地")


func test_spawn_and_core_not_placeable() -> void:
	var g: Grid = Grid.new(5, 5)
	g.spawn = Vector2i(0, 0)
	g.core = Vector2i(4, 4)
	g.set_at(0, 0, Grid.Cell.SPAWN)
	g.set_at(4, 4, Grid.Cell.CORE)
	assert_false(g.can_place(0, 0), "入口不可建")
	assert_false(g.can_place(4, 4), "核心不可建")
	assert_true(g.is_walkable(0, 0), "入口可通行")
	assert_true(g.is_walkable(4, 4), "核心可通行")


func test_clone_is_independent() -> void:
	var g: Grid = Grid.new(3, 3)
	g.place_tower(1, 1)
	var c: Grid = g.clone()
	c.remove_tower(1, 1)
	assert_eq(g.at(1, 1), Grid.Cell.TOWER, "原网格不受副本影响")
	assert_eq(c.at(1, 1), Grid.Cell.EMPTY, "副本独立")
