extends RefCounted
class_name NavGrid
## 2D 平台跳跃用的网格寻路（docs/08 §3.4、§7 第 6 条）。
##
## 为什么自己写而不用 NavigationServer3D/2D 自动烘焙：
## 1) 练习期 04 与正式期 06 都卡在「敌人不会绕障碍」，06 至今是靠关卡布局规避；
## 2) 更重要的是**可断言性**——引擎的寻路结果要在跑起来才能观察，而纯函数网格
##    可以在 headless 里逐格断言「这条路不存在」「这个坑不该有路」，
##    这正是路线图 §4.3「逐帧可比的部分一律下沉 sim」的落点。
##
## 模型：平台跳跃的「可站立格」= 本格空 且 下方是实心或单向台。
## 边：走（同层左右）、上一格台阶（斜上）、落下（走到没支撑的边就掉到下面第一个可站格）。
## 不做完整跳轨：crawler 不会跳，它只会走和掉——所以路径质量要求低，但绝不能穿墙。

const SOLID := 1
const ONEWAY := 2         # 单向台：可从下方穿过，站得住
const MAX_DROP := 10      # 允许下落的最大格数，超过视为「掉出世界」

var width := 0
var height := 0
var _cells := {}          # Vector2i -> SOLID / ONEWAY


static func new_grid(w: int, h: int) -> NavGrid:
	var g := NavGrid.new()
	g.width = w
	g.height = h
	return g


func set_cell(x: int, y: int, kind: int) -> void:
	_cells[Vector2i(x, y)] = kind


func kind_at(cell: Vector2i) -> int:
	return int(_cells.get(cell, 0))


func in_bounds(cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < width and cell.y < height


func is_blocked(cell: Vector2i) -> bool:
	# 越界当实心处理：不让敌人顺着边界外「抄近路」走出去
	if not in_bounds(cell):
		return true
	return kind_at(cell) == SOLID


## 可站立：本格空，且脚下有支撑（实心或单向台）
func is_standable(cell: Vector2i) -> bool:
	if not in_bounds(cell) or is_blocked(cell):
		return false
	var below := cell + Vector2i(0, 1)
	var k := kind_at(below)
	return k == SOLID or k == ONEWAY


## 离给定格最近的可站立格（向下优先：敌人被击飞到空中时要落回地面再寻路）
func nearest_standable(cell: Vector2i, radius: int = 6) -> Vector2i:
	if is_standable(cell):
		return cell
	var best := Vector2i(-1, -1)
	var best_d := 1 << 30
	for dy in range(0, radius + 1):
		for dx in range(-radius, radius + 1):
			var c := cell + Vector2i(dx, dy)
			if not is_standable(c):
				continue
			var d := absi(dx) + dy * 2
			if d < best_d:
				best_d = d
				best = c
		if best_d < 1 << 30:
			break
	return best


## 邻居展开：走 / 上一格台阶 / 走到边沿后下落
func _neighbors(cell: Vector2i) -> Array:
	var out: Array = []
	for dir in [-1, 1]:
		var side := cell + Vector2i(dir, 0)
		if is_standable(side):
			out.append({"to": side, "cost": 1.0})
			# 斜上一步：需要目标格空、其脚下有支撑、且中间不被墙挡
			var up := side + Vector2i(0, -1)
			if is_standable(up) and not is_blocked(side):
				out.append({"to": up, "cost": 1.4})
			continue
		# 同层是空的但不可站 → 走到边沿然后掉下去
		if in_bounds(side) and not is_blocked(side):
			var landed := _fall_from(side)
			if landed != Vector2i(-1, -1):
				var drop: int = absi(landed.y - cell.y)
				out.append({"to": landed, "cost": 1.0 + float(drop) * 0.2})
	return out


func _fall_from(cell: Vector2i) -> Vector2i:
	var c := cell
	for _i in MAX_DROP:
		c = c + Vector2i(0, 1)
		if is_blocked(c):
			return Vector2i(-1, -1)     # 落到实心上是坑底，不给路（掉坑就是掉坑）
		if is_standable(c):
			return c
	return Vector2i(-1, -1)


static func _h(a: Vector2i, b: Vector2i) -> float:
	return float(absi(a.x - b.x)) + float(absi(a.y - b.y))


## A*。找不到路返回空数组（不返回半条路，避免敌人走一半卡住）。
func path_to(from: Vector2i, to: Vector2i, max_explore: int = 6000) -> Array[Vector2i]:
	var result: Array[Vector2i] = []
	if not is_standable(from) or not is_standable(to):
		return result
	if from == to:
		result.append(from)
		return result
	var open := {from: _h(from, to)}
	var came := {}
	var g_score := {from: 0.0}
	var explored := 0
	while not open.is_empty() and explored < max_explore:
		explored += 1
		# 取 f 最小的节点；f 相同按坐标排序取小，保证确定性（否则同一张图每次路径不同，测试没法断言）
		var current := from
		var best_f := 1e18
		for k in open:
			var f: float = float(open[k])
			if f < best_f - 0.0001 or (absf(f - best_f) <= 0.0001 and Vector2i(k) < current):
				best_f = f
				current = Vector2i(k)
		open.erase(current)
		if current == to:
			break
		for edge in _neighbors(current):
			var nxt: Vector2i = edge["to"]
			var tentative: float = float(g_score[current]) + float(edge["cost"])
			if tentative < float(g_score.get(nxt, 1e18)):
				g_score[nxt] = tentative
				came[nxt] = current
				open[nxt] = tentative + _h(nxt, to)
	if not came.has(to):
		return result
	var node := to
	while node != from:
		result.push_front(node)
		node = came[node]
	result.push_front(from)
	return result


## 从 LayoutGen 的 plan 直接建网格：地面（去掉沟）+ 单向平台
static func from_plan(plan: Dictionary) -> NavGrid:
	var w := int(plan["total_width_tiles"])
	var h := int(plan["room_height"])
	var grid := NavGrid.new_grid(w, h)
	var floor_row := int(plan["floor_row"])
	for room in plan["rooms"]:
		var rx := int(room["x"])
		var blocked := {}
		for g in room["gaps"]:
			for i in range(int(g["x"]), int(g["x"]) + int(g["w"])):
				blocked[i] = true
		for x in range(int(room["width"])):
			if blocked.has(x):
				continue
			for dy in range(0, 3):
				grid.set_cell(rx + x, floor_row + dy, SOLID)
		for p in room["platforms"]:
			for i in range(int(p["w"])):
				grid.set_cell(rx + int(p["x"]) + i, int(p["y"]), ONEWAY)
	return grid


func standable_count() -> int:
	var n := 0
	for y in height:
		for x in width:
			if is_standable(Vector2i(x, y)):
				n += 1
	return n


func snapshot() -> Dictionary:
	return {"width": width, "height": height, "solid": _cells.size(), "standable": standable_count()}
