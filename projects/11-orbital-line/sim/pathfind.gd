class_name PathFinder
extends RefCounted

# 自制网格 BFS（4 邻接）。路线图 §1 挂账的寻路短板在本作正面解决：
# 塔防要的是「离散网格 + 频繁重算」，NavigationServer3D 的烘焙模型不合适。
# 纯逻辑 → 可进 sim/ 全量断言。

const DIRS: Array = [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]


# 返回 Array[Vector2i]（含 start 与 goal）；不可达返回空数组
static func bfs(g: Grid, start: Vector2i, goal: Vector2i) -> Array:
	if not g.is_walkable(start.x, start.y) or not g.is_walkable(goal.x, goal.y):
		return []
	var start_i: int = g.idx(start.x, start.y)
	var goal_i: int = g.idx(goal.x, goal.y)
	var prev: Array = []
	prev.resize(g.width * g.height)
	for i in range(prev.size()):
		prev[i] = -1
	var seen: Array = []
	seen.resize(g.width * g.height)
	for i in range(seen.size()):
		seen[i] = false
	var queue: Array = [start_i]
	seen[start_i] = true
	var head: int = 0
	while head < queue.size():
		var cur: int = queue[head]
		head += 1
		if cur == goal_i:
			break
		var cx: int = cur % g.width
		var cy: int = cur / g.width
		for d in DIRS:
			var dv: Vector2i = d as Vector2i
			var nx: int = cx + dv.x
			var ny: int = cy + dv.y
			if not g.in_bounds(nx, ny) or not g.is_walkable(nx, ny):
				continue
			var ni: int = g.idx(nx, ny)
			var s: bool = seen[ni]
			if s:
				continue
			seen[ni] = true
			prev[ni] = cur
			queue.append(ni)
	var s2: bool = seen[goal_i]
	if not s2:
		return []
	var path: Array = []
	var node: int = goal_i
	while node != -1:
		path.append(Vector2i(node % g.width, node / g.width))
		if node == start_i:
			break
		node = prev[node]
	path.reverse()
	return path


static func reachable(g: Grid) -> bool:
	return bfs(g, g.spawn, g.core).size() > 0


# 在 (x,y) 落塔后入口→核心是否仍然连通。返回 true 表示「这一手会封死，必须拒绝」。
static func would_block(g: Grid, x: int, y: int) -> bool:
	if not g.can_place(x, y):
		return false
	g.set_at(x, y, Grid.Cell.TOWER)
	var ok: bool = reachable(g)
	g.set_at(x, y, Grid.Cell.EMPTY)
	return not ok
