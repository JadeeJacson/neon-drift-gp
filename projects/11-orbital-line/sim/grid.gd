class_name Grid
extends RefCounted

# 网格：离散格子，塔占格即障碍。纯逻辑，不碰场景树。

enum Cell { EMPTY = 0, TOWER = 1, SPAWN = 2, CORE = 3, BLOCKED = 4 }

var width: int = 0
var height: int = 0
var cells: Array = []
var spawn: Vector2i = Vector2i.ZERO
var core: Vector2i = Vector2i.ZERO


func _init(w: int, h: int) -> void:
	width = w
	height = h
	cells = []
	cells.resize(w * h)
	for i in range(w * h):
		cells[i] = Cell.EMPTY


func idx(x: int, y: int) -> int:
	return y * width + x


func in_bounds(x: int, y: int) -> bool:
	return x >= 0 and y >= 0 and x < width and y < height


func at(x: int, y: int) -> int:
	if not in_bounds(x, y):
		return Cell.BLOCKED
	var v: int = cells[idx(x, y)]
	return v


func set_at(x: int, y: int, v: int) -> void:
	if in_bounds(x, y):
		cells[idx(x, y)] = v


# 敌人可通行：塔与固定障碍不可通行，空地/入口/核心可通行
func is_walkable(x: int, y: int) -> bool:
	var c: int = at(x, y)
	return c != Cell.TOWER and c != Cell.BLOCKED


func can_place(x: int, y: int) -> bool:
	return at(x, y) == Cell.EMPTY


func place_tower(x: int, y: int) -> bool:
	if not can_place(x, y):
		return false
	set_at(x, y, Cell.TOWER)
	return true


func remove_tower(x: int, y: int) -> bool:
	if at(x, y) != Cell.TOWER:
		return false
	set_at(x, y, Cell.EMPTY)
	return true


func clone() -> Grid:
	var g: Grid = Grid.new(width, height)
	g.cells = cells.duplicate()
	g.spawn = spawn
	g.core = core
	return g


# 空格列表（按索引升序，保证确定性）
func free_cells() -> Array:
	var out: Array = []
	for i in range(cells.size()):
		var v: int = cells[i]
		if v == Cell.EMPTY:
			out.append(Vector2i(i % width, i / width))
	return out
