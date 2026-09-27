extends RefCounted
class_name ShipTable
## 数值单一源：玩家与三型敌机的全部战斗数值都在这里。
## 渲染层（scripts/）与抽象交战模型（combat_model.gd）都从本表取数，
## 任何一边改数值都必须改这里——有测试锁 cross-reference。
##
## 难度：difficulty_id 是全局旋钮，菜单选定后写入。抽象模型（跑分/平衡）与
## 渲染层（实战手感）读的是同一个值，因此不会出现「跑分说能过、手感打不过」。

## 当前难度档（"casual" / "normal" / "hardcore"），由 DifficultyTable 定义语义。
static var difficulty_id: String = "normal"


static func diff() -> Dictionary:
	return DifficultyTable.preset(difficulty_id)

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

## ---- 副武器：跟踪导弹 ----
## 设计意图：主武器是 hitscan「指哪打哪」，但目标高速/小体积时手感会挫败。
## 导弹给一个「兜底解法」——代价是弹药有限 + 冷却，且必须先锁定（不能盲射）。
const MISSILE_DAMAGE := 70.0
const MISSILE_SPEED := 320.0       # m/s（比玩家极速 200 快，够追上敌机）
const MISSILE_TURN := 2.6          # rad/s 转向率——刻意有限，太强就变成「无脑挂机」
const MISSILE_LIFE := 5.0          # 秒，燃料耗尽自毁
const MISSILE_CD := 0.9            # 两发之间的最小间隔
const MISSILE_AMMO_MAX := 6
const MISSILE_RELOAD := 3.2        # 弹尽后装填秒数
const MISSILE_LOCK_RANGE := 900.0  # 超出这个距离不锁
const MISSILE_LOCK_CONE := 0.55    # 锁定锥：cos 值，越小越严格（0.55 ≈ 57°）
const MISSILE_BLAST := 12.0        # 近炸半径内的其他敌机也要掉血

## ---- 显式护盾（主动技能，有 CD）----
## 为什么是「主动」而不是再加一条被动护盾条：主动才有「按键救场」的正反馈，
## 且 CD 让它成为「资源」而不是「白给的第二条命」。
const SHIELD_BURST_CD := 12.0       # 两次之间的冷却
const SHIELD_BURST_DURATION := 1.6  # 持续秒数
const SHIELD_BURST_ABSORB := 70.0   # 期间吸收的总伤害（打不穿，够扛一轮）

## ---- 敌机 ----
## hp / dps 用于抽象交战模型；bolt_* 用于渲染层投射物。
##
## hit_radius 是**命中球半径**，与敌机身上那圈可见 IFF 环共用同一个值——
## 「看得见的圈就是能打中的范围」是本项目解决「敌机太扁、几乎打不到」的核心手段：
## 玩家不必再靠肉眼猜模型的薄面到底有多宽。
## 取值原则：不小于该型最长可视轮廓的一半（保证体面），也不超过它（避免隔着两架
## 之间的距离就打空）。
const ENEMIES := {
	"interceptor": {
		"hp": 160.0, "score": 100, "hit_radius": 3.4,
		"bolt_damage": 4.0, "fire_interval": 0.9, "bolt_speed": 120.0,
		"approach_dist": 140.0, "engage_min": 80.0, "speed": 55.0,
	},
	"bomber": {
		"hp": 540.0, "score": 250, "hit_radius": 4.2,
		"bolt_damage": 16.0, "fire_interval": 4.5, "bolt_speed": 60.0,
		"approach_dist": 260.0, "engage_min": 150.0, "speed": 28.0,
	},
	"drone": {
		"hp": 60.0, "score": 50, "hit_radius": 2.6,
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

## 抽象交战的基础命中率（标准档）：低于真实值，因为模型里的 exposure 是「整段存活窗」，
## 而实际有掩体、机动、视野切换等折减。调难度时这是第一旋钮。
const ABSTRACT_HIT := 0.073


## 敌机实际 HP（已乘难度倍率）。
static func hp_of(kind: String) -> float:
	return float(ENEMIES[kind]["hp"]) * float(diff()["hp"])


## 命中球半径——与敌机身上那圈可见 IFF 环同源。
static func hit_radius_of(kind: String) -> float:
	return float(ENEMIES[kind]["hit_radius"])


static func score_of(kind: String) -> int:
	return int(round(float(ENEMIES[kind]["score"]) * float(diff()["score"])))


static func field(kind: String, key: String) -> Variant:
	return ENEMIES[kind][key]


## 敌机单发伤害（已乘难度倍率）。
static func damage_of(kind: String) -> float:
	return float(ENEMIES[kind]["bolt_damage"]) * float(diff()["damage"])


## 敌机开火间隔（已乘难度倍率：射速倍率 >1 → 间隔变短）。
static func fire_interval_of(kind: String) -> float:
	return float(ENEMIES[kind]["fire_interval"]) / maxf(0.05, float(diff()["rate"]))


## 玩家在抽象模型里的有效命中率（难度命中倍率在此生效）。
static func abstract_hit() -> float:
	return ABSTRACT_HIT * float(diff()["hit"])


## 敌机抽象 DPS：bolt 伤害 × 射速 × 有效命中率（贴脸目标；dodge 由交战模型折减）。
## 关键：这里必须走 damage_of / fire_interval_of（已乘难度），不能直接读 ENEMIES 原始值。
## 直读原始值会让跑分与实战脱节——玩家在硬核档挨更多打，跑分却看不出来
## （这正是本次调参一度「改了难度但跑分数字纹丝不动」的原因）。
static func abstract_dps(kind: String) -> float:
	if kind == "drone":
		# 无人机是「一次性」伤害，不存在 DPS，用单次撞角伤害参与模型。
		return 0.0
	return damage_of(kind) / fire_interval_of(kind) * abstract_hit()
