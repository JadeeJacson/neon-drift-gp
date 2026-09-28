class_name Combat
extends RefCounted

# 伤害结算与索敌。sim 与装配层共用——这是「跑分调过的数」与「实机跑的数」一致的前提。

# 护甲后的伤害系数
static func armor_factor(dtype: String, armor: float) -> float:
	match dtype:
		"kinetic":
			return 1.0 - armor
		"explosive":
			return 1.0 - armor * 0.5
		"laser", "emp":
			return 1.0
	return 1.0


# 对敌人状态字典直接结算（先扣盾，溢出部分按护甲扣血）
static func apply_hit(e: Dictionary, raw: float, dtype: String) -> void:
	var shield: float = float(e["shield"])
	# 激光被护盾完全免疫：不掉盾也不掉血 —— 这是「护盾机兵克制激光塔」的机制来源
	if dtype == "laser" and shield > 0.0:
		return
	var armor: float = float(e["armor"])
	if shield > 0.0:
		var mult: float = 1.5 if dtype == "emp" else 1.0
		var incoming: float = raw * mult
		var absorb: float = minf(shield, incoming)
		e["shield"] = shield - absorb
		var rest: float = incoming - absorb
		if rest > 0.0:
			e["hp"] = float(e["hp"]) - rest * armor_factor(dtype, armor)
		return
	e["hp"] = float(e["hp"]) - raw * armor_factor(dtype, armor)


# 索敌：射程内「最靠前」（行进距离最大）的敌人，返回索引，无目标返回 -1
static func pick_target(enemies: Array, px: float, py: float, rng: float) -> int:
	var best: int = -1
	var best_dist: float = -1.0
	for i in range(enemies.size()):
		var e: Dictionary = enemies[i] as Dictionary
		var alive: bool = bool(e["alive"])
		if not alive:
			continue
		var dx: float = float(e["x"]) - px
		var dy: float = float(e["y"]) - py
		if dx * dx + dy * dy > rng * rng:
			continue
		var d: float = float(e["dist"])
		if d > best_dist:
			best_dist = d
			best = i
	return best


static func dist2(ax: float, ay: float, bx: float, by: float) -> float:
	var dx: float = ax - bx
	var dy: float = ay - by
	return dx * dx + dy * dy

