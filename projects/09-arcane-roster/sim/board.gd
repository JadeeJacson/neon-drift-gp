extends RefCounted
class_name Board
## 棋盘的纯几何逻辑：坐标、占位、射程、移动。**不碰场景树**（docs/00 §4.2）。
##
## 坐标系：8 列 × 8 行。行号 0 在地图远端（敌方后排），行号 7 在近端（我方后排）。
## 敌方占 0–3 行，我方占 4–7 行，中间没有中立行——**两军相邻是刻意的**，
## 它保证后排远程在开局 1–2 秒内就进入射程，不会出现「隔空对视 10 秒」的冷场。
##
## 为什么是方形网格而不是六边形：KayKit 的 Medieval Hexagon Pack 提供了六边形地块，
## 但六边形的邻接关系（6 个邻居、两条轴）在 sim 层要额外一套距离函数与移动规则，
## 而自走棋的核心决策是「谁能打到谁」，方形网格的切比雪夫距离更容易讲清楚、
## 更容易在测试里断言。**六边形留作 v2 主题地图，不进 v1。**

const COLS := 8
const ROWS := 8
const ALLY := 0
const ENEMY := 1

## 我方可用行（4..7），敌方可用行（0..3）
const ALLY_ROWS := [4, 5, 6, 7]
const ENEMY_ROWS := [0, 1, 2, 3]

## 格子边长（米）。KayKit 角色宽 1.94 m，取 2.2 让相邻单位不穿插。
const CELL := 2.2


static func in_bounds(c: int, r: int) -> bool:
	return c >= 0 and c < COLS and r >= 0 and r < ROWS


static func cell_in_bounds(cell: Vector2i) -> bool:
	return in_bounds(cell.x, cell.y)


static func rows_for(side: int) -> Array:
	return ALLY_ROWS if side == ALLY else ENEMY_ROWS


## 该方最靠近敌方的一行（我方 = 4，敌方 = 3）
static func front_row(side: int) -> int:
	return 4 if side == ALLY else 3


## 方向 +1 表示「朝敌方推进」（我方向 -y 走，所以是 -1）
static func forward_dir(side: int) -> int:
	return -1 if side == ALLY else 1


static func chebyshev(a: Vector2i, b: Vector2i) -> int:
	return maxi(absi(a.x - b.x), absi(a.y - b.y))


static func manhattan(a: Vector2i, b: Vector2i) -> int:
	return absi(a.x - b.x) + absi(a.y - b.y)


## 攻击判定用切比雪夫距离：近战 range=1 即八方向相邻（含斜向），
## 远程 range=3 是一个 7×7 的方块。这样「斜着站位」永远是可读的，不会出现
## 「明明只差一格却打不到」的困惑（曼哈顿距离会制造这种case）。
static func in_range(from_cell: Vector2i, to_cell: Vector2i, attack_range: int) -> bool:
	return chebyshev(from_cell, to_cell) <= attack_range


## 全部合法格（按行优先，确定性顺序）
static func all_cells() -> Array:
	var out: Array = []
	for r in ROWS:
		for c in COLS:
			out.append(Vector2i(c, r))
	return out


static func cells_for(side: int) -> Array:
	var out: Array = []
	for r in rows_for(side):
		for c in COLS:
			out.append(Vector2i(c, r))
	return out


## occupied = {Vector2i: unit_index}，返回 unit_index 或 -1
static func occupant(occupied: Dictionary, cell: Vector2i) -> int:
	if occupied.has(cell):
		return int(occupied[cell])
	return -1


## 自动布阵的列优先序：从中间向两侧交替展开。
## **必须覆盖全部 COLS 列**——第一版用 `c/2` 式的奇偶推导，8 列时只产出
## [4,3,6,2,1,0] 六个列号，漏掉 5 和 7，于是棋盘铺到 24 格就开始重复占位
##（被 test_auto_place_covers_every_cell 抓到）。
static func column_order() -> Array:
	var out: Array = []
	var mid := COLS / 2
	out.append(mid)
	var k := 1
	while out.size() < COLS:
		if k % 2 == 1:
			var left := mid - (k + 1) / 2
			if left >= 0:
				out.append(left)
		else:
			var right := mid + k / 2
			if right < COLS:
				out.append(right)
		k += 1
	return out


## 该方「靠近前线」的空格，用于自动布阵。前线优先，同排从中间向外，
## 中间优先是为了让开火面覆盖对方后排（AI 布阵与玩家的手动摆位遵循同一套直觉）。
static func auto_place_cell(side: int, occupied: Dictionary) -> Vector2i:
	var rows := rows_for(side)
	var start := 0 if side == ALLY else rows.size() - 1
	var step := 1 if side == ALLY else -1
	var order := column_order()
	for ri in range(rows.size()):
		var r: int = rows[start + ri * step]
		for c in order:
			var cell := Vector2i(int(c), r)
			if not cell_in_bounds(cell):
				continue
			if not occupied.has(cell):
				return cell
	return Vector2i(COLS / 2, front_row(side))  # 棋盘满了（不该发生）


## 朝目标走一格。候选顺序固定：斜向/主轴 → 只走横轴 → 只走纵轴 → 横轴绕行。
## **所有候选都必须让切比雪夫距离不增**。这一条是硬约束：曾经把「反向」也放进候选，
## 结果被挡住的单位会「前进一格→被规则弹回一格」无限抖动，战斗直接跑到 120s 超时。
## 「不增」是靠「横轴绕行也朝目标列靠拢」实现的（lateral 取 dc 的符号）。
static func step_toward(from_cell: Vector2i, to_cell: Vector2i, occupied: Dictionary, side: int) -> Vector2i:
	if from_cell == to_cell:
		return from_cell
	var dc := to_cell.x - from_cell.x
	var dr := to_cell.y - from_cell.y
	var want_dc := signi(dc)
	var want_dr := signi(dr)
	var lateral := 0
	if dc != 0:
		lateral = 1 if dc > 0 else -1
	var candidates: Array = [
		from_cell + Vector2i(want_dc, want_dr),
		from_cell + Vector2i(want_dc, 0),
		from_cell + Vector2i(0, want_dr),
		from_cell + Vector2i(lateral, want_dr),
	]
	for cell in candidates:
		if cell == from_cell:
			continue
		if not cell_in_bounds(cell):
			continue
		if not rows_for(side).has(cell.y):
			continue  # 不越界到对方半场
		if occupied.has(cell):
			continue
		return cell
	return from_cell


## 世界坐标换算：棋盘中心在原点，我方在 +Z 一侧（相机默认从 +Z 看向 -Z）。
static func cell_to_world(cell: Vector2i) -> Vector3:
	var x := (float(cell.x) - float(COLS - 1) * 0.5) * CELL
	var z := (float(cell.y) - float(ROWS - 1) * 0.5) * CELL
	return Vector3(x, 0.0, z)


static func world_to_cell(pos: Vector3) -> Vector2i:
	var c := int(round(pos.x / CELL + float(COLS - 1) * 0.5))
	var r := int(round(pos.z / CELL + float(ROWS - 1) * 0.5))
	return Vector2i(clampi(c, 0, COLS - 1), clampi(r, 0, ROWS - 1))
