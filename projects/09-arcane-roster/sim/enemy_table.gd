extends RefCounted
class_name EnemyTable
## 敌方单位数值表。8 个常规 + 2 个 Boss。
##
## 与玩家单位的**根本区别**：敌方不花钱、不升星，靠**编成预算**堆强度
## （见 StageTable.budget）。所以敌方的设计目标不是「每个都很有趣」，
## 而是「组合起来能制造不同的压力形态」：
##   - 纯近战：逼你必须上坦克
##   - 纯远程：如果你没有近战 they'll never get touched → 用来惩罚「无脑全远程」
##   - 高护甲：惩罚「堆脆皮输出」
##   - 高闪避刺客：惩罚「无脑后排放」
## 同一个 StageTable 在不同 stage 抽到的组合不同，这四种压力就会轮流出场。
##
## 全部复用玩家那 9 个模型（这样素材库不膨胀），靠数值与技能区分。

const ENEMIES := {
	"e_bone": {
		"display": "骷髅兵", "model": "Skeleton_Warrior", "role": "front",
		"hp": 420.0, "atk": 38.0, "armor": 8.0, "interval": 1.00, "range": 1,
		"crit": 0.10, "crit_mult": 1.5, "dodge": 0.05, "thorns": 0.0, "skill": "death_burst",
		"policy": 0,
	},
	"e_archer": {
		"display": "骷髅弓手", "model": "Skeleton_Rogue", "role": "back",
		"hp": 340.0, "atk": 34.0, "armor": 6.0, "interval": 1.20, "range": 3,
		"crit": 0.10, "crit_mult": 1.5, "dodge": 0.05, "thorns": 0.0, "skill": "",
		"policy": 2,
	},
	"e_adept": {
		"display": "骷髅术士", "model": "Skeleton_Mage", "role": "back",
		"hp": 350.0, "atk": 40.0, "armor": 6.0, "interval": 1.20, "range": 3,
		"crit": 0.10, "crit_mult": 1.5, "dodge": 0.05, "thorns": 0.0, "skill": "poison_mist",
		"policy": 2,
	},
	"e_reaver": {
		"display": "掠夺者", "model": "Rogue", "role": "mid",
		"hp": 360.0, "atk": 52.0, "armor": 7.0, "interval": 0.90, "range": 1,
		"crit": 0.25, "crit_mult": 1.7, "dodge": 0.12, "thorns": 0.0, "skill": "backstab",
		"policy": 0,
	},
	"e_titan": {
		"display": "石像傀儡", "model": "Barbarian", "role": "front",
		"hp": 780.0, "atk": 30.0, "armor": 22.0, "interval": 1.10, "range": 1,
		"crit": 0.05, "crit_mult": 1.5, "dodge": 0.0, "thorns": 16.0, "skill": "shield_wall",
		"policy": 0,
	},
	"e_knight": {
		"display": "暗黑骑士", "model": "Knight", "role": "front",
		"hp": 620.0, "atk": 48.0, "armor": 16.0, "interval": 1.00, "range": 1,
		"crit": 0.15, "crit_mult": 1.6, "dodge": 0.05, "thorns": 10.0, "skill": "taunt_shield",
		"policy": 0,
	},
	"e_swarm": {
		"display": "骷髅群", "model": "Skeleton_Minion", "role": "front",
		"hp": 220.0, "atk": 20.0, "armor": 4.0, "interval": 0.70, "range": 1,
		"crit": 0.10, "crit_mult": 1.5, "dodge": 0.12, "thorns": 0.0, "skill": "",
		"policy": 0,
	},
	"e_blade": {
		"display": "影刃", "model": "Rogue_Hooded", "role": "mid",
		"hp": 390.0, "atk": 44.0, "armor": 8.0, "interval": 0.90, "range": 1,
		"crit": 0.30, "crit_mult": 1.8, "dodge": 0.15, "thorns": 0.0, "skill": "lunge",
		"policy": 0,
	},
	"b_sking": {
		"display": "骷髅王", "model": "Skeleton_Warrior", "role": "front", "boss": true,
		"hp": 2000.0, "atk": 88.0, "armor": 18.0, "interval": 1.00, "range": 1,
		"crit": 0.20, "crit_mult": 1.7, "dodge": 0.08, "thorns": 14.0, "skill": "whirlwind",
		"policy": 0,
	},
	"b_lord": {
		"display": "暗影领主", "model": "Mage", "role": "back", "boss": true,
		"hp": 1750.0, "atk": 96.0, "armor": 12.0, "interval": 0.90, "range": 3,
		"crit": 0.25, "crit_mult": 1.8, "dodge": 0.10, "thorns": 0.0, "skill": "ember_bolt",
		"policy": 2,
	},
}


static func ids() -> Array:
	return ENEMIES.keys()


static func has_id(id: String) -> bool:
	return ENEMIES.has(id)


static func display(id: String) -> String:
	assert(ENEMIES.has(id), "未知敌人: " + id)
	return String(ENEMIES[id]["display"])


static func model(id: String) -> String:
	assert(ENEMIES.has(id), "未知敌人: " + id)
	return String(ENEMIES[id]["model"])


static func is_boss(id: String) -> bool:
	assert(ENEMIES.has(id), "未知敌人: " + id)
	return bool(ENEMIES[id].get("boss", false))


static func field(id: String, key: String) -> float:
	assert(ENEMIES.has(id), "未知敌人: " + id)
	assert(ENEMIES[id].has(key), "未知字段: %s.%s" % [id, key])
	return float(ENEMIES[id][key])


static func policy(id: String) -> int:
	assert(ENEMIES.has(id), "未知敌人: " + id)
	return int(ENEMIES[id]["policy"])


## 敌方「星级」只影响血量与护甲，用来在同预算下做「少量精英 vs 多个小兵」的形态变化
static func hp(id: String, star: int) -> float:
	return field(id, "hp") * UnitTable.STAR_HP[UnitTable.clamp_star(star) - 1]


static func atk(id: String, star: int) -> float:
	return field(id, "atk") * UnitTable.STAR_ATK[UnitTable.clamp_star(star) - 1]


static func armor(id: String, star: int) -> float:
	return field(id, "armor") + UnitTable.STAR_ARMOR_FLAT[UnitTable.clamp_star(star) - 1]


static func power(id: String, star: int) -> float:
	return hp(id, star) / 20.0 + atk(id, star) * 1.15 + armor(id, star) * 1.5


## 抽编成时的权重：坦克/前排便宜可靠，刺客贵但有效
static func roll_weight(id: String) -> float:
	var r := String(ENEMIES[id]["role"])
	if r == "front":
		return 22.0
	return 14.0
