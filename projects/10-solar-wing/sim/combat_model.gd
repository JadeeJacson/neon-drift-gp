extends RefCounted
class_name CombatModel
## 抽象交战模型：给定一波编成与玩家画像，算出清波时长与承受伤害。
## 纯数学 + SimRng 抖动，不碰引擎——同画像同种子必然同结果（可区间断言）。
##
## 核心抽象（与 06 combat_loop 同一套教训）：
##   1. 顺序集火：玩家按出怪顺序逐个打死，后排敌人在排队期间**已经活着在开火**，
##      但受 ALIVE_CAP 曝光折减——导演出怪是排队的，不该当成「53 人同时开火」；
##   2. 前摇窗：轰炸机要先逼近、无人机要先贴脸，逼近时间不输出；
##   3. dodge 折减：机动即生存，走位水平直接改变承伤；
##   4. heat_manage 折进 DPS：热量管得差 = 强制冷却 = 有效射速低。

const BASE_DPS := ShipTable.LASER_DAMAGE / ShipTable.LASER_INTERVAL  # 40 满命中


## cfg 字段: aim / dodge / aggression / heat_manage（全部 0..1）
## 返回 {elapsed, damage, shots, hits, kills}
static func sim_wave(lineup: Array, cfg: Dictionary, rng: SimRng,
		spawn_interval: float) -> Dictionary:
	var aim := float(cfg["aim"])
	var dodge := float(cfg["dodge"])
	var aggression := float(cfg["aggression"])
	var heat := float(cfg["heat_manage"])

	var duty := 0.55 + 0.25 * heat
	var dps := BASE_DPS * (0.45 + 0.55 * aim) * (0.85 + 0.30 * aggression) * duty
	dps = maxf(dps, 1.0)

	var cap := float(WaveTable.ALIVE_CAP)
	var deaths: Array = []
	var damage := 0.0
	var shots := 0

	for k in range(lineup.size()):
		var kind: String = lineup[k]
		var hp := ShipTable.hp_of(kind)
		var spawn_t := float(k) * spawn_interval
		# 同屏上限：第 k 个进场时间不早于「第 k-cap 个死亡」腾出的槽位
		if float(k) >= cap:
			spawn_t = maxf(spawn_t, float(deaths[k - int(cap)]))
		var prev_death := 0.0
		if k > 0:
			prev_death = float(deaths[k - 1])
		var start_t := maxf(spawn_t, prev_death)
		var death_t := start_t + hp / dps
		deaths.append(death_t)

		var exposure := death_t - spawn_t
		var jitter := rng.rangef(0.9, 1.1)
		damage += _incoming(kind, exposure, dodge) * jitter
		shots += ceili(hp / ShipTable.LASER_DAMAGE)

	var elapsed := 0.0
	if deaths.size() > 0:
		elapsed = float(deaths[deaths.size() - 1])
	var hits := int(round(float(shots) * (0.35 + 0.65 * aim)))

	return {
		"elapsed": elapsed,
		"damage": damage,
		"shots": shots,
		"hits": hits,
		"kills": lineup.size(),
	}


## 单型敌人的预期承伤（已含前摇窗与 dodge 折减，未含 jitter）。
static func _incoming(kind: String, exposure: float, dodge: float) -> float:
	if kind == "drone":
		# 一次性撞角：只有活到贴脸才结算，贴脸窗口约 5 秒（更晚才够得着）。
		var reach := clampf((exposure - float(ShipTable.APPROACH_TIME[kind])) / 5.0, 0.0, 1.0)
		return float(ShipTable.ENEMIES[kind]["bolt_damage"]) * reach * (1.0 - 0.8 * dodge)
	var window := exposure - float(ShipTable.APPROACH_TIME[kind])
	if window <= 0.0:
		return 0.0
	var reduction := 0.65 if kind == "interceptor" else 0.6
	return ShipTable.abstract_dps(kind) * window * (1.0 - reduction * dodge)
