extends RefCounted
class_name DifficultyTable
## 难度档位单一源。玩家实测反馈「难度偏高」后引入：不再只有隐式的一个难度，
## 而是三档显式旋钮，且**实战与跑分读同一张表**（ShipTable.difficulty_id 写入后
## CombatModel 与渲染层同步生效），不会出现「跑分说简单、手感说难杀」的分裂。
##
## 每档四个乘数，都相对「标准档」表达（标准档全为 1.0），便于直觉比较与回归：
##   hp    —— 敌机血量倍率（决定要打多久，间接决定波次长度）
##   damage—— 敌机单发伤害倍率（决定挨多疼）
##   rate  —— 敌机射速倍率（>1 更凶）
##   hit   —— 玩家有效命中率倍率（抽象模型的第一旋钮，见 ShipTable.abstract_hit）
##   score —— 击杀分倍率（只影响结算观感，不参与难度）
##
## 注意：难度**不缩放**敌机速度与前摇时间——那是「可读性/公平性」而不是「强度」，
## 一旦随难度漂移，玩家的手感学习（预判、卡过热时机）就失效了。

const PRESETS := {
	"casual": {
		"label": "休闲",
		"hp": 0.60,
		"damage": 0.50,
		"rate": 0.70,
		"hit": 1.50,
		"score": 0.80,
	},
	"normal": {
		"label": "标准",
		"hp": 1.0,
		"damage": 1.12,
		"rate": 1.0,
		"hit": 1.0,
		"score": 1.0,
	},
	"hardcore": {
		"label": "硬核",
		"hp": 1.45,
		"damage": 1.45,
		"rate": 1.30,
		"hit": 0.70,
		"score": 1.25,
	},
}

## 菜单循环顺序（左/右切换难度用）
const ORDER := ["casual", "normal", "hardcore"]


static func preset(id: String) -> Dictionary:
	# 未知 id 一律回落到标准档，绝不返回空字典（否则下游 float() 直接崩）
	return PRESETS.get(id, PRESETS["normal"])


static func label_of(id: String) -> String:
	return String(preset(id)["label"])


static func is_valid(id: String) -> bool:
	return PRESETS.has(id)


static func next_id(id: String, step: int = 1) -> String:
	var i := ORDER.find(id)
	if i < 0:
		i = ORDER.find("normal")
	return String(ORDER[((i + step) % ORDER.size() + ORDER.size()) % ORDER.size()])