extends RefCounted
class_name ShipTable
## 数值单一源：玩家与三型敌机的全部战斗数值都在这里。
## 渲染层（scripts/）与抽象交战模型（combat_model.gd）都从本表取数，
## 任何一边改数值都必须改这里——有测试锁 cross-reference。

## ---- 玩家 ----
const SHIELD_MAX := 100.0
const HULL_MAX := 100.0
const SHIELD_REGEN := 8.0          # 脱战后每秒回充
const SHIELD_REGEN_DELAY := 4.0    # 最后一次受击后多少秒开始回充
const HULL_REPAIR_PER_WAVE := 20.0 # 波间整备修理（有上限）
const SHIELD_RESTORE_PER_WAVE := 50.0

const LASER_DAMAGE := 8.0
const LASER_INTERVAL := 0.2        # 5 发/秒
const LASER_RANGE := 900.0
const HEAT_MAX := 100.0
const HEAT_PER_SHOT := 7.0
const HEAT_COOL := 30.0            # 每秒冷却
const HEAT_LOCK_AT := 100.0        # 达到即过热
const HEAT_LOCK_UNTIL := 40.0      # 回落到这里才解锁

## ---- 敌机 ----
## hp / dps 用于抽象交战模型；bolt_* 用于渲染层投射物。
const ENEMIES := {
	"interceptor": {
		"hp": 160.0, "score": 100,
		"bolt_damage": 4.0, "fire_interval": 0.9, "bolt_speed": 120.0,
		"approach_dist": 140.0, "engage_min": 80.0, "speed": 55.0,
	},
	"bomber": {
		"hp": 540.0, "score": 250,
		"bolt_damage": 16.0, "fire_interval": 4.5, "bolt_speed": 60.0,
		"approach_dist": 260.0, "engage_min": 150.0, "speed": 28.0,
	},
	"drone": {
		"hp": 60.0, "score": 50,
		"bolt_damage": 12.0, "fire_interval": 99.0, "bolt_speed": 0.0,  # 撞角，无投射物
		"approach_dist": 999.0, "engage_min": 8.0, "speed": 70.0,
	},
}

## 抽象模型用：各型的「逼近时间」（投射物够不到人之前的时间窗）。
const APPROACH_TIME := {
	"interceptor": 3.0,
	"bomber": 6.0,
	"drone": 4.0,
}

## 抽象交战的基础命中率：低于真实值，因为模型里的 exposure 是「整段存活窗」，
## 而实际有掩体、机动、视野切换等折减。调难度时这是第一旋钮。
const ABSTRACT_HIT := 0.073


static func hp_of(kind: String) -> float:
	return float(ENEMIES[kind]["hp"])


static func score_of(kind: String) -> int:
	return int(ENEMIES[kind]["score"])


static func field(kind: String, key: String) -> Variant:
	return ENEMIES[kind][key]


## 敌机抽象 DPS：bolt 伤害 × 射速 × ABSTRACT_HIT（贴脸目标；dodge 由交战模型折减）。
static func abstract_dps(kind: String) -> float:
	if kind == "drone":
		# 无人机是「一次性」伤害，不存在 DPS，用单次撞角伤害参与模型。
		return 0.0
	return float(ENEMIES[kind]["bolt_damage"]) / float(ENEMIES[kind]["fire_interval"]) * ABSTRACT_HIT
