extends RefCounted
class_name Targeting
## 索敌规则。**纯函数**：输入是「自己 + 敌方快照」，输出是「打谁」。
##
## 为什么要把索敌单独抽出来：自走棋的战斗里，玩家的策略 90% 转化为「谁打谁」。
## 如果索敌藏在战斗循环里，就没法在 tests 里断言「前排嘲讽一定生效」「远程一定点后排」，
## 也没法在跑分报告里解释「为什么这局输了」。抽成纯函数后，规则本身就是可测对象。
##
## 优先级（硬顺序，不可调换）：
##   1. 嘲讽：任何 taunting 的敌人都压过一切策略。这是自走棋唯一的硬控制，
##      没有它，骑士的 taunt 技能就没有存在价值。
##   2. 策略：NEAREST（近战）/ BACKLINE（远程）/ LOWEST_HP（补刀）
##
## 索敌只考虑**在自己射程内**的目标：射程外的敌人打不到，索敌它们只会让单位
## 在两个目标之间反复横跳（抖动），这是自走棋模拟器最常见的「看起来很蠢」的行为。

enum Policy { NEAREST = 0, LOWEST_HP = 1, BACKLINE = 2 }


## enemies: Array[Dictionary]，每项至少有 cell / hp / alive / taunting
## 返回敌方在 enemies 里的下标；没有敌人返回 -1
##
## **射程外也要选目标**（这是 09 修过的一个真 bug，症状是「双方对峙到 120s 超时」）：
## 早期版本只考虑射程内的目标，于是「够不着 → 不选目标 → 也不移动」，双方永远不接触。
## 正确契约是：先在射程内按策略选；射程内没人时，退化成「锁定最近的敌人并走过去」。
## 射程内优先级仍然保留，因为它负责避免「两个远程互相换目标」的抖动。
static func pick_target(self_cell: Vector2i, self_range: int, policy: int, enemies: Array) -> int:
	var in_range_idx: Array = []
	var all_idx: Array = []
	for i in range(enemies.size()):
		var e: Dictionary = enemies[i]
		if not bool(e["alive"]):
			continue
		all_idx.append(i)
		var ec: Vector2i = e["cell"]
		if not Board.in_range(self_cell, ec, self_range):
			continue
		if bool(e["taunting"]):
			return i  # 规则 1：嘲讽优先级最高，先到先得（确定性）
		in_range_idx.append(i)
	if not in_range_idx.is_empty():
		match policy:
			Policy.LOWEST_HP:
				return _lowest_hp(in_range_idx, enemies)
			Policy.BACKLINE:
				return _deepest(in_range_idx, self_cell, enemies)
			_:
				return _nearest(in_range_idx, self_cell, enemies)
	if all_idx.is_empty():
		return -1
	return _nearest(all_idx, self_cell, enemies)   # 接近：不在射程也要走


static func _nearest(idxs: Array, self_cell: Vector2i, enemies: Array) -> int:
	var best: int = int(idxs[0])
	var best_d := 9999
	for i in idxs:
		var e: Dictionary = enemies[int(i)]
		var ec: Vector2i = e["cell"]
		# 用切比雪夫距离做主序、列距离做次序：同排时优先打同列，
		# 避免两个单位为「谁更近」反复改目标
		var d := Board.chebyshev(self_cell, ec) * 10 + absi(ec.x - self_cell.x)
		if d < best_d:
			best_d = d
			best = int(i)
	return best


static func _lowest_hp(idxs: Array, enemies: Array) -> int:
	var best: int = int(idxs[0])
	var best_hp := 999999.0
	for i in idxs:
		var e: Dictionary = enemies[int(i)]
		var h := float(e["hp"])
		if h < best_hp:
			best_hp = h
			best = int(i)
	return best


## 「最深」= 离自己切比雪夫距离最远。射程 3 的远程点后排，
## 于是「谁离我远我打谁」等价于「优先点脆皮输出」
static func _deepest(idxs: Array, self_cell: Vector2i, enemies: Array) -> int:
	var best: int = int(idxs[0])
	var best_d := -1
	for i in idxs:
		var e: Dictionary = enemies[int(i)]
		var ec: Vector2i = e["cell"]
		var d := Board.chebyshev(self_cell, ec)
		if d > best_d:
			best_d = d
			best = int(i)
	return best


## 技能用的「范围内所有敌人」，与索敌用同一套射程口径，避免技能比普攻还远
static func enemies_in_radius(self_cell: Vector2i, radius: int, enemies: Array) -> Array:
	var out: Array = []
	for i in range(enemies.size()):
		var e: Dictionary = enemies[i]
		if not bool(e["alive"]):
			continue
		var ec: Vector2i = e["cell"]
		if Board.in_range(self_cell, ec, radius):
			out.append(i)
	return out


## 「范围内血量百分比最低的友军」，治疗类技能用
static func neediest_ally(self_cell: Vector2i, radius: int, allies: Array) -> int:
	var best: int = -1
	var best_ratio := 1.0001
	for i in range(allies.size()):
		var a: Dictionary = allies[i]
		if not bool(a["alive"]):
			continue
		var ac: Vector2i = a["cell"]
		if not Board.in_range(self_cell, ac, radius):
			continue
		var ratio := float(a["hp"]) / maxf(1.0, float(a["max_hp"]))
		if ratio < best_ratio:
			best_ratio = ratio
			best = i
	return best
