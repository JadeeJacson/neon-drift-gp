extends RefCounted
class_name MatchSim
## 把 WaveTable 的编成喂给 CombatModel，让一个「玩家画像」打完全部波次，
## 产出分布层面的统计量（通关率/时长/承伤/得分），供区间断言与跑分表使用。
## 同画像同种子必然同结果——docs/00 §4.3 的执行体。

const DEFAULTS := {
	"aim": 0.60,
	"dodge": 0.50,
	"aggression": 0.50,
	"heat_manage": 0.60,
	"seed": 20260927,
}


## 单局模拟。survived 判据：5 波全部清完且舰体 > 0。
static func play(profile: Dictionary = {}) -> Dictionary:
	var cfg := DEFAULTS.duplicate()
	cfg.merge(profile, true)
	var seed_value := int(cfg.seed)
	var waves := WaveTable.plan(seed_value)

	var shield := ShipTable.SHIELD_MAX
	var hull := ShipTable.HULL_MAX
	var elapsed := 0.0
	var kills := 0
	var score := 0
	var shots := 0
	var hits := 0
	var waves_cleared := 0

	for i in range(waves.size()):
		var wave: Dictionary = waves[i]
		var lineup: Array = wave["spawns"]
		var rng := SimRng.new(seed_value + int(wave["index"]) * 7919)
		var run := CombatModel.sim_wave(lineup, cfg, rng, float(wave["spawn_interval"]))
		elapsed += float(run["elapsed"])

		# 护盾先扛，溢出伤舰体
		var dmg := float(run["damage"])
		var absorbed := minf(shield, dmg)
		shield -= absorbed
		hull -= dmg - absorbed
		if hull <= 0.0:
			return _result(cfg, false, waves_cleared, elapsed, shield, 0.0,
				kills, score, shots, hits)

		waves_cleared += 1
		kills += int(run["kills"])
		shots += int(run["shots"])
		hits += int(run["hits"])
		score += _lineup_score(lineup) + int(wave["clear_bonus"])
		# 波间整备：护盾回充 + 舰体小修
		shield = minf(ShipTable.SHIELD_MAX, shield + ShipTable.SHIELD_RESTORE_PER_WAVE)
		hull = minf(ShipTable.HULL_MAX, hull + ShipTable.HULL_REPAIR_PER_WAVE)
		if i < waves.size() - 1:
			elapsed += WaveTable.WAVE_GAP

	# 胜利加成：残余状态 ×5 + 命中率 ×1000
	var accuracy := 0.0
	if shots > 0:
		accuracy = float(hits) / float(shots)
	score += int((shield + hull) * 5.0) + int(accuracy * 1000.0)

	return _result(cfg, true, waves_cleared, elapsed, shield, hull,
		kills, score, shots, hits)


## 多种子扫描。返回 clear_rate 与各指标分布。
static func sweep(profile: Dictionary = {}, runs: int = 16) -> Dictionary:
	var clears := 0
	var minutes: Array = []
	var damage: Array = []
	var scores: Array = []
	var base_seed := int(profile.get("seed", 20260927))
	for i in range(runs):
		var p := profile.duplicate()
		p["seed"] = base_seed + i * 1013
		var r := play(p)
		if bool(r["survived"]):
			clears += 1
		minutes.append(float(r["minutes"]))
		damage.append(float(r["damage_taken"]))
		scores.append(float(r["score"]))
	return {
		"runs": runs,
		"clear_rate": float(clears) / float(maxi(runs, 1)),
		"minutes_min": _min_of(minutes),
		"minutes_med": _median(minutes),
		"minutes_max": _max_of(minutes),
		"damage_med": _median(damage),
		"score_med": _median(scores),
	}


static func _result(cfg: Dictionary, survived: bool, waves_cleared: int,
		elapsed: float, shield: float, hull: float, kills: int, score: int,
		shots: int, hits: int) -> Dictionary:
	var accuracy := 0.0
	if shots > 0:
		accuracy = float(hits) / float(shots)
	return {
		"survived": survived,
		"victory": survived and waves_cleared == WaveTable.WAVE_COUNT,
		"seed": int(cfg.seed),
		"waves_cleared": waves_cleared,
		"minutes": elapsed / 60.0,
		"shield_left": maxf(shield, 0.0),
		"hull_left": maxf(hull, 0.0),
		"damage_taken": (ShipTable.SHIELD_MAX + ShipTable.HULL_MAX) - maxf(shield, 0.0) - maxf(hull, 0.0),
		"kills": kills,
		"score": score,
		"shots": shots,
		"hits": hits,
		"accuracy": accuracy,
	}


static func _lineup_score(lineup: Array) -> int:
	var s := 0
	for kind in lineup:
		s += ShipTable.score_of(String(kind))
	return s


static func _median(values: Array) -> float:
	if values.is_empty():
		return 0.0
	var sorted := values.duplicate()
	sorted.sort()
	return float(sorted[sorted.size() / 2])


static func _min_of(values: Array) -> float:
	if values.is_empty():
		return 0.0
	var m := float(values[0])
	for v in values:
		m = minf(m, float(v))
	return m


static func _max_of(values: Array) -> float:
	if values.is_empty():
		return 0.0
	var m := float(values[0])
	for v in values:
		m = maxf(m, float(v))
	return m
