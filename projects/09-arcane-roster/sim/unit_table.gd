extends RefCounted
class_name UnitTable
## 玩家可用单位的数值表（docs/09-立项 §2.3）。纯数据 + 纯函数，不碰场景树。
##
## 9 个角色模型 × 3 星级 = 27 个可招募条目。选 9 个模型而不是更多，是因为
## KayKit 的角色包一共就这 9 个（5 冒险者 + 4 骷髅），**阵容深度靠羁绊而不是靠堆模型**
## （见 Traits）——这是 Balatro 式的组合深度路线，代价是每个模型必须撑得住 3 档星级。
##
## 数值设计的硬约束（写进 sim/tests/test_unit_table.gd 做断言，别靠感觉改）：
## 1. 1★ 前排被单点集火的死亡时间落在 10–14s：低于 8s 战斗会「秒完就没」，高于 18s 会拖。
## 2. 近战 range=1、远程 range=3，远程 DPS 必须低于近战，否则「无脑贴脸」成为最优解。
## 3. 伤害下限 1（见 BattleSim），所以 armor 增益存在边际收益递减，不能线性堆。
## 4. 升星是「省人口 + 提数值」的双重收益：3 个 1★ (3.0 HP/3.0 ATK) → 1 个 2★
##    (1.8 HP/1.6 ATK) 数值上是亏的，**回报全在腾出的 2 个人口上**。人口上限 6，
##    所以「凑 3 星」在中后期是真正的战略目标，而不是数值自动变强。

## 1★ 基础值
const UNITS := {
	"knight": {
		"display": "圣团骑士", "model": "Knight", "faction": "order", "role": "front",
		"cost": 3, "hp": 700.0, "atk": 50.0, "armor": 14.0, "interval": 0.95, "range": 1,
		"crit": 0.15, "crit_mult": 1.6, "dodge": 0.05, "thorns": 10.0, "skill": "taunt_shield",
	},
	"barbarian": {
		"display": "狂战士", "model": "Barbarian", "faction": "order", "role": "front",
		"cost": 3, "hp": 620.0, "atk": 66.0, "armor": 9.0, "interval": 0.85, "range": 1,
		"crit": 0.20, "crit_mult": 1.7, "dodge": 0.05, "thorns": 0.0, "skill": "whirlwind",
	},
	"rogue": {
		"display": "游侠", "model": "Rogue", "faction": "order", "role": "mid",
		"cost": 3, "hp": 450.0, "atk": 74.0, "armor": 7.0, "interval": 0.80, "range": 1,
		"crit": 0.35, "crit_mult": 1.8, "dodge": 0.15, "thorns": 0.0, "skill": "backstab",
	},
	"mage": {
		"display": "法师", "model": "Mage", "faction": "order", "role": "back",
		"cost": 4, "hp": 430.0, "atk": 60.0, "armor": 5.0, "interval": 1.15, "range": 3,
		"crit": 0.10, "crit_mult": 1.6, "dodge": 0.08, "thorns": 0.0, "skill": "ember_bolt",
	},
	"hooded": {
		"display": "毒刃", "model": "Rogue_Hooded", "faction": "order", "role": "back",
		"cost": 3, "hp": 470.0, "atk": 48.0, "interval": 1.00, "armor": 7.0, "range": 3,
		"crit": 0.15, "crit_mult": 1.6, "dodge": 0.10, "thorns": 0.0, "skill": "poison_mist",
	},
	"sk_warrior": {
		"display": "骷髅战士", "model": "Skeleton_Warrior", "faction": "skeleton", "role": "front",
		"cost": 2, "hp": 660.0, "atk": 44.0, "armor": 12.0, "interval": 1.00, "range": 1,
		"crit": 0.12, "crit_mult": 1.5, "dodge": 0.08, "thorns": 0.0, "skill": "death_burst",
	},
	"sk_rogue": {
		"display": "骷髅游侠", "model": "Skeleton_Rogue", "faction": "skeleton", "role": "mid",
		"cost": 2, "hp": 450.0, "atk": 58.0, "armor": 7.0, "interval": 0.85, "range": 1,
		"crit": 0.30, "crit_mult": 1.7, "dodge": 0.18, "thorns": 0.0, "skill": "lunge",
	},
	"sk_mage": {
		"display": "骷髅术士", "model": "Skeleton_Mage", "faction": "skeleton", "role": "back",
		"cost": 3, "hp": 430.0, "atk": 56.0, "armor": 5.0, "interval": 1.20, "range": 3,
		"crit": 0.12, "crit_mult": 1.6, "dodge": 0.10, "thorns": 0.0, "skill": "raise_dead",
	},
	"sk_minion": {
		"display": "骷髅仆从", "model": "Skeleton_Minion", "faction": "skeleton", "role": "front",
		"cost": 1, "hp": 300.0, "atk": 24.0, "armor": 4.0, "interval": 0.70, "range": 1,
		"crit": 0.10, "crit_mult": 1.5, "dodge": 0.12, "thorns": 0.0, "skill": "shield_wall",
	},
}

## 技能表。kind 决定 BattleSim 里的实现分支，加新 kind 必须同时改 sim/tests 的覆盖测试。
const SKILLS := {
	"taunt_shield": {
		"display": "圣盾挑衅", "kind": "taunt", "cd": 9.0,
		"value": 0.12, "duration": 6.0, "radius": 99,
		"desc": "6 秒内强制敌方攻击自己，并获得 12% 最大生命的护盾",
	},
	"whirlwind": {
		"display": "旋风斩", "kind": "aoe", "cd": 7.5,
		"value": 0.85, "duration": 0.0, "radius": 1,
		"desc": "对 1 格内所有敌人造成 85% 攻击力的伤害",
	},
	"backstab": {
		"display": "背刺", "kind": "buff_crit", "cd": 8.0,
		"value": 2.0, "duration": 3.0, "radius": 0,
		"desc": "3 秒内暴击率翻倍",
	},
	"lunge": {
		"display": "突进", "kind": "dash", "cd": 8.0,
		"value": 2, "duration": 0.0, "radius": 0,
		"desc": "立刻冲向当前目标 2 格并追加一次攻击",
	},
	"poison_mist": {
		"display": "毒雾", "kind": "dot_aoe", "cd": 9.0,
		"value": 13.0, "duration": 4.0, "radius": 2,
		"desc": "2 格内敌人每 0.5 秒受到 13 点伤害（中毒）",
	},
	"ember_bolt": {
		"display": "烬火弹", "kind": "aoe", "cd": 7.0,
		"value": 1.10, "duration": 0.0, "radius": 1,
		"desc": "对 1 格内所有敌人造成 110% 攻击力的伤害",
	},
	"death_burst": {
		"display": "死亡爆碎", "kind": "on_death_aoe", "cd": 0.0,
		"value": 0.60, "duration": 0.0, "radius": 1,
		"desc": "死亡时对 1 格内敌人造成 60% 攻击力的伤害",
	},
	"raise_dead": {
		"display": "亡者复生", "kind": "summon", "cd": 14.0,
		"value": 1, "duration": 0.0, "radius": 0,
		"desc": "召唤 1 个骷髅仆从（持续整场战斗）",
	},
	"shield_wall": {
		"display": "骨墙", "kind": "armor_buff", "cd": 10.0,
		"value": 6.0, "duration": 5.0, "radius": 0,
		"desc": "5 秒内自身护甲 +6",
	},
}

const STAR_HP := [1.0, 2.3, 5.0]
const STAR_ATK := [1.0, 1.95, 3.6]
const STAR_ARMOR_FLAT := [0.0, 2.0, 5.0]
const STAR_DODGE_ADD := [0.0, 0.02, 0.04]
const STAR_SCALE := [1.0, 1.12, 1.26]
const MAX_STAR := 3
const POP_MAX := 6

## 出售返还：3 个 1★ 换 1 个 2★，若返还低于 3 金，这条路线就永远不成立
const SELL_REFUND := [1, 3, 9]


static func ids() -> Array:
	return UNITS.keys()


static func has_id(id: String) -> bool:
	return UNITS.has(id)


static func display(id: String) -> String:
	assert(UNITS.has(id), "未知单位: " + id)
	return String(UNITS[id]["display"])


static func model(id: String) -> String:
	assert(UNITS.has(id), "未知单位: " + id)
	return String(UNITS[id]["model"])


static func faction(id: String) -> String:
	assert(UNITS.has(id), "未知单位: " + id)
	return String(UNITS[id]["faction"])


static func role(id: String) -> String:
	assert(UNITS.has(id), "未知单位: " + id)
	return String(UNITS[id]["role"])


static func cost(id: String) -> int:
	assert(UNITS.has(id), "未知单位: " + id)
	return int(UNITS[id]["cost"])


static func skill_id(id: String) -> String:
	assert(UNITS.has(id), "未知单位: " + id)
	return String(UNITS[id]["skill"])


## 索敌策略：近战贴脸、远程点后排、坦克拉嘲讽（见 sim/targeting.gd）
static func policy_for(id: String) -> int:
	var r := role(id)
	if r == "back":
		return 1  # BACKLINE
	if r == "mid":
		return 0  # NEAREST
	return 0      # NEAREST


static func base_field(id: String, key: String) -> float:
	assert(UNITS.has(id), "未知单位: " + id)
	# 键名写错时 Dictionary 取值会静默返回 0 并污染整条数值链，必须在这里炸出来
	assert(UNITS[id].has(key), "未知字段: %s.%s" % [id, key])
	return float(UNITS[id][key])


## 星级 1..3 越界直接 assert：星级算错会让「合三升一」悄悄产出 4★ 单位
static func clamp_star(star: int) -> int:
	return clampi(star, 1, MAX_STAR)


static func hp(id: String, star: int) -> float:
	return base_field(id, "hp") * STAR_HP[clamp_star(star) - 1]


static func atk(id: String, star: int) -> float:
	return base_field(id, "atk") * STAR_ATK[clamp_star(star) - 1]


static func armor(id: String, star: int) -> float:
	return base_field(id, "armor") + STAR_ARMOR_FLAT[clamp_star(star) - 1]


static func dodge(id: String, star: int) -> float:
	return minf(0.30, base_field(id, "dodge") + STAR_DODGE_ADD[clamp_star(star) - 1])


static func scale_for(star: int) -> float:
	return STAR_SCALE[clamp_star(star) - 1]


static func sell_value(star: int) -> int:
	return SELL_REFUND[clamp_star(star) - 1]


static func skill(id: String) -> Dictionary:
	var s := String(UNITS[id]["skill"])
	assert(SKILLS.has(s), "单位 %s 引用了未定义的技能 %s" % [id, s])
	return SKILLS[s]


static func skill_field(id: String, key: String) -> float:
	var d := skill(id)
	assert(d.has(key), "技能缺字段: %s.%s" % [id, key])
	return float(d[key])


## 单体 DPS（含暴击期望），战斗时长的第一手估算
static func dps(id: String, star: int) -> float:
	var a := atk(id, star)
	var c := base_field(id, "crit")
	var m := base_field(id, "crit_mult")
	return (a * (1.0 + c * (m - 1.0))) / base_field(id, "interval")


## 「战力点数」：敌方编成预算与玩家强度的统一度量（见 StageTable.budget）。
## 只用于预算，不用于战斗结算——战斗永远是逐 tick 的真实数值。
static func power(id: String, star: int) -> float:
	return hp(id, star) / 20.0 + atk(id, star) * 1.15 + armor(id, star) * 1.5


## 商店权重：贵的少见，但 1 费必须有（穷人的第一张牌）
static func shop_weight(id: String) -> float:
	var c := cost(id)
	if c <= 1:
		return 30.0
	if c == 2:
		return 26.0
	if c == 3:
		return 18.0
	return 8.0
