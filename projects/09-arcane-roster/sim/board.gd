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


## 该方落位的**行优先级**，从最想站的那一行排到最不想站的。
## 分职能是必要的：不分的话人口上限 6 < 每行 8 列，
## 所有人都会挤在最前排一行，远程得不到任何保护。
##   front（坦克）→ 顶在最前排，替后排挡刀
##   mid（突进）  → 站第二排，既能接战也不首当其冲
##   back（远程）→ 站第二排起，往后退
##
## **back 不能站最后一排**，这是实测踩到的：远程 range=3，我方最后排 row 7 到
## 敌方前排 row 3 距离是 4，直接射程外——远程被迫一路往前挪，战斗从 12.8 秒
## 拖到 38.6 秒（单测 `battle_med < 26` 当场挂掉）。站第二排 row 5 时
## 到敌方前排距离 2、到敌方中排距离 3，全程在射程内，既有前后层次又能立刻参战。
static func row_order(side: int, role: String = "") -> Array:
	# 统一先排成「最靠近前线 → 最远离前线」
	var seq: Array = [4, 5, 6, 7] if side == ALLY else [3, 2, 1, 0]
	match role:
		"mid":
			return [seq[1], seq[0], seq[2], seq[3]]
		"back":
			return [seq[1], seq[2], seq[0], seq[3]]
	return seq


## 该方「靠近前线」的空格，用于自动布阵。同排从中间向外，
## 中间优先是为了让开火面覆盖对方后排（AI 布阵与玩家的手动摆位遵循同一套直觉）。
## role 为空时退化为「一律顶前线」（保持旧行为，工具脚本与测试仍在用）。
static func auto_place_cell(side: int, occupied: Dictionary, role: String = "") -> Vector2i:
	var order := column_order()
	for r in row_order(side, role):
		if not rows_for(side).has(r):
			continue
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
##
## **战斗中不设半场边界**（side 参数仅保留兼容签名）。半场隔离只属于**摆位**
## （auto_place_cell / place_unit）；战斗里也隔离的话会出死锁：分层布阵后敌方远程
## 缩在 row 2，我方近战被锁在 row 4，距离 2 > 射程 1，**永远够不到，只能站着被射死**
## ——实测残局从 13 秒拖到 78 秒（S2 全场 311 tick，最后是我方 3 个近战围不死
## 1 个缩后排的弓手）。TFT 的战斗单位同样可以越过中线追击。
static func step_toward(from_cell: Vector2i, to_cell: Vector2i, occupied: Dictionary, side: int = ALLY) -> Vector2i:
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
