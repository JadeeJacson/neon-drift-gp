class_name Defs
extends RefCounted

# 数值表：塔 / 敌人。sim 与装配层共用同一份，杜绝「跑分调过的数与实机跑的数不一致」。
#
# 单位约定：射程 range 与速度 speed 都是**格**为单位（1 格 = 4 世界单位）。
# 伤害是点数，rate 是每秒开火次数，dps ≈ dmg * rate。

const TOWER_ORDER: Array = ["vulcan", "laser", "missile", "tesla", "generator"]

const TOWERS: Dictionary = {
	"vulcan": {
		"name": "机炮塔",
		"desc": "高频低伤，可对空，被装甲减免",
		"levels": [
			{"cost": 80, "dmg": 8.0, "rate": 4.0, "range": 3.0, "type": "kinetic"},
			{"cost": 70, "dmg": 13.0, "rate": 4.6, "range": 3.2, "type": "kinetic"},
			{"cost": 120, "dmg": 19.0, "rate": 5.2, "range": 3.4, "type": "kinetic"},
		],
	},
	"laser": {
		"name": "激光塔",
		"desc": "无视装甲，但被护盾完全免疫",
		"levels": [
			{"cost": 110, "dmg": 11.0, "rate": 2.0, "range": 3.5, "type": "laser"},
			{"cost": 90, "dmg": 18.0, "rate": 2.3, "range": 3.7, "type": "laser"},
			{"cost": 150, "dmg": 27.0, "rate": 2.6, "range": 3.9, "type": "laser"},
		],
	},
	"missile": {
		"name": "导弹塔",
		"desc": "慢速高伤 + 溅射，打群首选",
		"levels": [
			{"cost": 140, "dmg": 55.0, "rate": 0.5, "range": 4.2, "type": "explosive", "splash": 0.9},
			{"cost": 120, "dmg": 85.0, "rate": 0.55, "range": 4.4, "type": "explosive", "splash": 1.0},
			{"cost": 200, "dmg": 130.0, "rate": 0.6, "range": 4.6, "type": "explosive", "splash": 1.2},
		],
	},
	"tesla": {
		"name": "力场塔",
		"desc": "减速 + 链式，本身输出低，是倍率器",
		"levels": [
			{"cost": 100, "dmg": 12.0, "rate": 1.5, "range": 2.6, "type": "emp", "slow": 0.45, "chain": 3},
			{"cost": 90, "dmg": 18.0, "rate": 1.7, "range": 2.8, "type": "emp", "slow": 0.50, "chain": 3},
			{"cost": 160, "dmg": 26.0, "rate": 1.9, "range": 3.0, "type": "emp", "slow": 0.55, "chain": 4},
		],
	},
	"generator": {
		"name": "能量井",
		"desc": "不攻击，每波结算产资源",
		"levels": [
			{"cost": 120, "dmg": 0.0, "rate": 0.0, "range": 0.0, "type": "none", "income": 18},
			{"cost": 100, "dmg": 0.0, "rate": 0.0, "range": 0.0, "type": "none", "income": 30},
			{"cost": 180, "dmg": 0.0, "rate": 0.0, "range": 0.0, "type": "none", "income": 45},
		],
	},
}

# HP 经过一轮跑分上调（×1.5，2026-09-27）：原数值下「乱建」也能 75% 通关，
# 策略深度只有 25 个百分点。塔防的难度本质是「火力是否够」，抬 HP 才能把
# 「位置选得好不好」这笔账算进胜负里（跑分见 docs/11 §4 难度基线）。
const ENEMIES: Dictionary = {
	"drone": {"name": "蜂群无人机", "hp": 45.0, "speed": 1.5, "armor": 0.0, "shield": 0.0, "bounty": 6, "leak": 1, "flying": true},
	"tank": {"name": "装甲坦克", "hp": 390.0, "speed": 0.55, "armor": 0.5, "shield": 0.0, "bounty": 18, "leak": 2, "flying": false},
	"shield_mech": {"name": "护盾机兵", "hp": 270.0, "speed": 0.75, "armor": 0.2, "shield": 180.0, "bounty": 20, "leak": 2, "flying": false},
	"repair": {"name": "修理机", "hp": 180.0, "speed": 0.8, "armor": 0.1, "shield": 0.0, "bounty": 15, "leak": 2, "flying": false, "heal": 15.0},
	"bomber": {"name": "自爆虫", "hp": 105.0, "speed": 1.1, "armor": 0.0, "shield": 0.0, "bounty": 10, "leak": 1, "flying": false, "bomb": 40.0},
	"walker": {"name": "重型步行机", "hp": 3300.0, "speed": 0.4, "armor": 0.4, "shield": 0.0, "bounty": 120, "leak": 5, "flying": false, "boss": true},
}

const MAX_LEVEL: int = 3  # 等级取值 1..3
const TOWER_BASE_HP: float = 100.0
const TOWER_HP_PER_LEVEL: float = 50.0


static func tower_level(id: String, level: int) -> Dictionary:
	var t: Dictionary = TOWERS[id]
	var arr: Array = t["levels"]
	var i: int = clampi(level - 1, 0, arr.size() - 1)
	var d: Dictionary = arr[i]
	return d


# level=1 是建造价；level>1 是升到该级的费用
static func tower_cost(id: String, level: int) -> int:
	var d: Dictionary = tower_level(id, level)
	var c: int = int(d["cost"])
	return c


static func tower_max_hp(level: int) -> float:
	return TOWER_BASE_HP + TOWER_HP_PER_LEVEL * float(level - 1)


static func enemy(id: String) -> Dictionary:
	var e: Dictionary = ENEMIES[id]
	return e.duplicate(true)
