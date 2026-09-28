extends GutTest

# 寻路：BFS 正确性、绕路、以及本作最关键的「落塔不许封死」


func _make(w: int, h: int, sp: Vector2i, co: Vector2i) -> Grid:
	var g: Grid = Grid.new(w, h)
	g.spawn = sp
	g.core = co
	g.set_at(sp.x, sp.y, Grid.Cell.SPAWN)
	g.set_at(co.x, co.y, Grid.Cell.CORE)
	return g


func test_straight_path_length() -> void:
	var g: Grid = _make(5, 1, Vector2i(0, 0), Vector2i(4, 0))
	var p: Array = PathFinder.bfs(g, g.spawn, g.core)
	assert_eq(p.size(), 5, "直线路径经过 5 格")
	assert_eq(p[0], Vector2i(0, 0), "起点")
	assert_eq(p[4], Vector2i(4, 0), "终点")


func test_path_detours_around_tower() -> void:
	var g: Grid = _make(3, 3, Vector2i(0, 0), Vector2i(2, 0))
	var before: int = PathFinder.bfs(g, g.spawn, g.core).size()
	g.place_tower(1, 0)
	var after: Array = PathFinder.bfs(g, g.spawn, g.core)
	assert_eq(before, 3, "绕路前 3 格")
	assert_eq(after.size(), 5, "被挡后绕行 5 格（0,0→0,1→1,1→2,1→2,0）")
	assert_true(PathFinder.reachable(g), "仍然可达")


func test_corridor_is_blocked_by_single_tower() -> void:
	# 5x1 单行走廊没有任何绕路空间，中间任意一格都会封死——这是「地形决定的」不是 bug
	var g: Grid = _make(5, 1, Vector2i(0, 0), Vector2i(4, 0))
	assert_true(PathFinder.would_block(g, 1, 0), "单行走廊放塔即封死")
	assert_false(PathFinder.would_block(g, 0, 0), "入口格本身不是封死的一手")


func test_would_block_detects_sealing() -> void:
	# 5x3 场地：x=2 整列砌满才会封死，最后一格必须被拒绝
	var g: Grid = _make(5, 3, Vector2i(0, 1), Vector2i(4, 1))
	assert_false(PathFinder.would_block(g, 2, 0), "第一格可放（还能从 y=2 绕）")
	g.place_tower(2, 0)
	assert_false(PathFinder.would_block(g, 2, 1), "第二格可放（还能绕）")
	g.place_tower(2, 1)
	assert_true(PathFinder.would_block(g, 2, 2), "第三格会封死，必须拒绝")
	# 装配层的落塔流程是「先问 would_block，再 place」，这里模拟该流程
	var accepted: bool = false
	if not PathFinder.would_block(g, 2, 2):
		accepted = g.place_tower(2, 2)
	assert_false(accepted, "封死的一手不该被接受")
	assert_eq(g.at(2, 2), Grid.Cell.EMPTY, "该格保持空")
	assert_true(PathFinder.reachable(g), "拒绝后仍然连通")


func test_unreachable_returns_empty() -> void:
	var g: Grid = _make(3, 1, Vector2i(0, 0), Vector2i(2, 0))
	g.place_tower(1, 0)
	var p: Array = PathFinder.bfs(g, g.spawn, g.core)
	assert_eq(p.size(), 0, "不可达返回空")
	assert_false(PathFinder.reachable(g), "reachable=false")


func test_would_block_on_occupied_cell_is_false() -> void:
	var g: Grid = _make(4, 1, Vector2i(0, 0), Vector2i(3, 0))
	g.place_tower(1, 0)
	assert_false(PathFinder.would_block(g, 1, 0), "已占格不是「这一手造成封死」")
	assert_false(PathFinder.would_block(g, 0, 0), "入口格不允许建")
