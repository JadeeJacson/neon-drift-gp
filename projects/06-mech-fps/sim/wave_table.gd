extends RefCounted
class_name WaveTable
## 波次强度曲线（docs/06-立项 §2.4：一局 10–15 分钟、5 波、单张竞技场关卡）。
##
## 用「威胁预算」而非「敌人数量」做曲线：预算 = Σ 敌型 threat，
## 这样换编制（多蜂群少机甲）不会偷偷改变难度——练习期 04 波次框架的教训。
## 精英（heavy）先扣预算再填杂兵，否则贪心填充会把预算耗光、重装永远不出场。

const TOTAL_WAVES := 5
const BASE_BUDGET := 100.0
const GROWTH := 1.24
const ELITE_TYPE := "heavy"
const PER_TYPE_CAP := 8  # 同波同兵种上限，避免画面全是一种模型

## 每波杂兵权重。heavy 不在此表，见 ELITES。
const WEIGHTS := {
	1: {"drone": 6.0, "charger": 3.0, "trooper": 0.5},
	2: {"drone": 4.0, "charger": 4.0, "trooper": 3.0},
	3: {"drone": 3.0, "charger": 4.0, "trooper": 5.0},
	4: {"drone": 2.0, "charger": 4.0, "trooper": 6.0},
	5: {"drone": 2.0, "charger": 3.0, "trooper": 6.0},
}

## 重装登场节奏：第 4 波才出 1 台，第 5 波 2 台。
## 前 3 波玩家还在建立移动节奏，重装会把「练手感」变成「背板」。
const ELITES := {1: 0, 2: 0, 3: 0, 4: 1, 5: 2}

## 同时存活上限。敌人无寻路时堆在一起会堵死通道（练习期教训：环形高台=死图），
## 这一项是给关卡留出的「可退让空间」硬约束。
const ALIVE_CAP := {1: 6, 2: 7, 3: 8, 4: 9, 5: 9}

## 出怪间隔（秒），逐波收紧。
const SPAWN_INTERVAL := {1: 1.6, 2: 1.4, 3: 1.2, 4: 1.1, 5: 1.0}

## 清波奖励弹药：涨幅低于预算涨幅——难度靠敌人，不靠抠玩家补给。
const CLEAR_BONUS := {1: 20.0, 2: 24.0, 3: 28.0, 4: 32.0, 5: 36.0}

## 时长估算模型：每个敌人 10s 交战+走位 + 出怪串行时间 + 波间喘息。
const PER_ENEMY_TIME := 10.0
const WAVE_GAP := 15.0


## 返回 Array[Dictionary]，每项：
## {index, budget, spawns{type:count}, total, alive_cap, spawn_interval, clear_bonus}
## 同 seed 必须产出完全相同的计划（§4.2 逐弹/逐帧断言的前提）。
static func plan(seed_value: int = 20260926) -> Array:
	var rng := SimRng.new(seed_value)
	var waves: Array = []
	for i in range(1, TOTAL_WAVES + 1):
		var budget := BASE_BUDGET * pow(GROWTH, float(i - 1))
		var elite_count := int(ELITES[i])
		var elite_cost := float(effective_elite_threat()) * float(elite_count)
		var spawns := _fill(budget - elite_cost, WEIGHTS[i], rng)
		if elite_count > 0:
			spawns[ELITE_TYPE] = elite_count
		waves.append({
			"index": i,
			"budget": budget,
			"spawns": spawns,
			"total": _count(spawns),
			"alive_cap": ALIVE_CAP[i],
			"spawn_interval": SPAWN_INTERVAL[i],
			"clear_bonus": CLEAR_BONUS[i],
		})
	return waves


static func effective_elite_threat() -> float:
	return EnemyTable.threat(ELITE_TYPE)


static func _fill(budget: float, weights: Dictionary, rng: SimRng) -> Dictionary:
	var out := {}
	var remaining := maxf(budget, 0.0)
	while true:
		var affordable: Dictionary = {}
		for k in weights:
			if float(EnemyTable.threat(k)) <= remaining and int(out.get(k, 0)) < PER_TYPE_CAP:
				affordable[k] = weights[k]
		if affordable.is_empty():
			break
		var picked := String(rng.pick_weighted(affordable))
		out[picked] = int(out.get(picked, 0)) + 1
		remaining -= EnemyTable.threat(picked)
	return out


static func _count(spawns: Dictionary) -> int:
	var n := 0
	for k in spawns:
		n += int(spawns[k])
	return n


static func summary(seed_value: int = 20260926) -> Dictionary:
	var waves := plan(seed_value)
	var total_enemies := 0
	var total_threat := 0.0
	var seconds := 0.0
	for w in waves:
		var t := int(w.total)
		total_enemies += t
		total_threat += float(w.budget)
		seconds += float(t) * PER_ENEMY_TIME + float(t) * float(w.spawn_interval) + WAVE_GAP
	return {
		"waves": waves.size(),
		"total_enemies": total_enemies,
		"total_threat": total_threat,
		"expected_minutes": seconds / 60.0,
	}
