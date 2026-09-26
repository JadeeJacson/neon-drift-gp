extends RefCounted
class_name MatchSim
## 抽象整局模拟：把 WaveTable 的编成喂给 CombatLoop，让一个「玩家画像」打完全部波次，
## 产出**分布层面的统计量**（时长、耗弹、受击量、存活与否），供区间断言使用。
##
## 这是 docs/00 §4.3 的落地形式：Godot 物理不保证逐帧复现，所以这里不碰引擎，
## 纯靠 sim 层算——同一画像同一种子必然同一结果，可以精确断言。
##
## 模型里最重要的一条抽象是 movement_efficiency：**机动即生存**（ULTRAKILL/泰坦陨落的立身之本）。
## 它按玩家走位水平折减受到的伤害，因此「滑铲墙跑练得好」第一次变成可量化、可回归的数字。

const PLAYER_HP := 100.0

## 走位/瞄准/重新占位的每敌人时间成本。与 WaveTable.PER_ENEMY_TIME 同值，
## 两处都必须改才不致于「时长模型」和「编成模型」各说各话（有测试锁这条）。
const MANEUVER_PER_ENEMY := 10.0

## 近战型必须先逼近才打得到人；重装开火有前摇。两者都会压缩敌人实际的输出窗口，
## 不建模这两条就会把「53 个敌人全程同时开火」当成难度，得出通关率 0% 的假结论。
const MELEE_WINDUP := 0.35
const HEAVY_WINDUP := 1.0
## 每波清场后的维修包：竞技场式关卡的补给点抽象，是难度曲线的一个旋钮。
## 取值来自跑分实测（`tools/sim_report.gd -- --runs=24`），不是拍的：
##   15 → 龟缩 0% / 普通 25%，「完整可玩」会变成劝退；
##   30 → 普通 100%，梯度在中段塌掉；
##   24 → 龟缩 0% / 普通 92%（终局中位剩 13 HP）/ 高手 100%。
## 要的形状是「龟缩必败、普通险胜、高手从容」，而不是把普通压到 50%。
const WAVE_REPAIR := 24.0

## 画像字段与缺省值：数值取自 docs/06 §2.2 的设计意图，不是随手填的。
const DEFAULTS := {
	"weapon": "assault_rifle",
	"aggression": 0.5,
	"head_rate": 0.25,
	"execution_rate": 0.35,
	"movement_efficiency": 0.5,
	"start_ammo": 400,
	"seed": 20260926,
}


## 返回单局统计。survived 的判据：全程累计受击 < PLAYER_HP（含处决回血）。
static func play(profile: Dictionary = {}) -> Dictionary:
	var cfg := _merge(profile)
	var seed_value := int(cfg.seed)
	var waves := WaveTable.plan(seed_value)
	var rng := SimRng.new(seed_value)

	var pool := float(cfg.start_ammo)
	var shots := 0
	var reloads := 0
	var resupplies := 0
	var elapsed := 0.0
	var ammo_refilled := 0.0
	var executions := 0
	var damage_taken := 0.0
	var health_gained := 0.0
	var enemy_count := 0

	for w in waves:
		var lineup := _lineup(w.spawns)
		enemy_count += lineup.size()
		var run := CombatLoop.simulate({
			"weapon": String(cfg.weapon),
			"enemies": lineup,
			"aggression": float(cfg.aggression),
			"head_rate": float(cfg.head_rate),
			"execution_rate": float(cfg.execution_rate),
			"start_ammo": int(pool),
			"seed": seed_value + int(w.index) * 7919,
		})
		shots += int(run.shots)
		reloads += int(run.reloads)
		resupplies += int(run.resupplies)
		elapsed += float(run.elapsed)
		ammo_refilled += float(run.ammo_refilled)
		executions += int(run.executions)
		health_gained += float(run.health_gained)
		pool = float(run.end_pool) + float(w.clear_bonus)

		# 挨打模型：每个敌人在「自己被打死之前」能打出的轮次，按机动水平折减
		elapsed += float(w.total) * (MANEUVER_PER_ENEMY + float(w.spawn_interval)) + WaveTable.WAVE_GAP
		health_gained += WAVE_REPAIR
		damage_taken += _incoming_damage(lineup, String(cfg.weapon), float(cfg.aggression),
			float(cfg.movement_efficiency), rng, int(w.alive_cap))

	return {
		"weapon": String(cfg.weapon),
		"seed": seed_value,
		"waves": waves.size(),
		"enemies": enemy_count,
		"minutes": elapsed / 60.0,
		"shots": shots,
		"reloads": reloads,
		"resupplies": resupplies,
		"ammo_spent": float(shots),
		"ammo_refilled": ammo_refilled,
		"self_sufficiency": ammo_refilled / maxf(float(shots), 1.0),
		"end_pool": pool,
		"damage_taken": damage_taken,
		"health_gained": health_gained,
		"hp_left": PLAYER_HP - damage_taken + health_gained,
		"survived": (PLAYER_HP - damage_taken + health_gained) > 0.0,
		"executions": executions,
	}


## 单个敌人在自己被击杀前预期能打几轮 × 每轮伤害，再按机动与同屏上限折减。
## 三个折减各有物理意义，缺一个就会得出错误的难度结论（实测缺前两个时通关率为 0%）：
##   前摇/逼近时间 —— 敌人不是刷新即输出；
##   alive_cap 曝光率 —— 导演出怪是排队的，后排还在路上，不该全程开火；
##   movement —— 走位减伤，机动即生存。
static func _incoming_damage(lineup: Array, weapon: String, aggression: float,
		movement: float, rng: SimRng, alive_cap: int) -> float:
	var total := 0.0
	var exposure := minf(1.0, float(alive_cap) / maxf(1.0, float(lineup.size())))
	for raw_type in lineup:
		var type := String(raw_type)
		var dist := CombatLoop.engagement_distance(type, aggression)
		var ttk := WeaponTable.time_to_kill(weapon, type, dist)
		var ranged := EnemyTable.field(type, "attack_range") > 8.0
		var windup := HEAVY_WINDUP if type == "heavy" else (0.0 if ranged else MELEE_WINDUP)
		var approach := 0.0 if ranged else dist / EnemyTable.field(type, "speed")
		var window := maxf(0.0, ttk - windup - approach)
		var volleys := window / EnemyTable.field(type, "attack_interval")
		var dodge := movement * (0.85 if ranged else 0.55)
		if rng.roll(0.12):
			volleys += 1.0  # 偶发的多轮惩罚：走位不是无条件免伤
		total += EnemyTable.field(type, "attack_damage") * volleys * (1.0 - dodge) * exposure
	return total


static func _lineup(spawns: Dictionary) -> Array:
	var out: Array = []
	for type in spawns:
		for _i in range(int(spawns[type])):
			out.append(String(type))
	return out


static func _merge(profile: Dictionary) -> Dictionary:
	var cfg := DEFAULTS.duplicate()
	for key in profile:
		cfg[key] = profile[key]
	return cfg


## 批量跑分：同画像 × N 个种子，返回分位数摘要。§4.3 要求看区间而不是单值。
static func sweep(profile: Dictionary, seed_count: int = 20) -> Dictionary:
	var runs: Array = []
	for i in range(seed_count):
		var p := _merge(profile)
		p.seed = 20260926 + i * 977
		runs.append(play(p))
	var minutes: Array = []
	var damage: Array = []
	var self_suff: Array = []
	var survived := 0
	for r in runs:
		minutes.append(float(r.minutes))
		damage.append(float(r.damage_taken))
		self_suff.append(float(r.self_sufficiency))
		if bool(r.survived):
			survived += 1
	minutes.sort()
	damage.sort()
	self_suff.sort()
	var mid := int(seed_count / 2.0)
	return {
		"runs": seed_count,
		"clear_rate": float(survived) / float(seed_count),
		"minutes_min": minutes[0],
		"minutes_med": minutes[mid],
		"minutes_max": minutes[seed_count - 1],
		"damage_min": damage[0],
		"damage_med": damage[mid],
		"damage_max": damage[seed_count - 1],
		"sufficiency_med": self_suff[mid],
	}
