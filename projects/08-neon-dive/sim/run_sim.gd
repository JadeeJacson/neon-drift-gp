extends RefCounted
class_name RunSim
## 整局跑分：三种玩家画像 × 多种子，产出「能潜多深 / 怎么死的 / 花多久」的分布。
##
## 这是抽象模型，不是回放引擎（路线图 §4.3：Godot 物理不保证逐帧复现，
## 所以难度结论只能建立在统计区间上，而不是某一次的录像）。它要回答的只有一句话：
## **氧是时间预算、电靠进攻回——这套双计量真的能把玩家推向进攻吗？**
## 如果「苟着不动」也能爬很深，那 §3.3 的设计意图就是空的，这里会直接测出来。

const CT := preload("res://sim/combat_table.gd")
const MV := preload("res://sim/movement_params.gd")
const LG := preload("res://sim/layout_gen.gd")

## 玩家画像。字段都是 0..1 的行为概率，不是数值强度——
## 强度改的是表，行为改的是打法，跑分要的是后者
## snipe_share：在决定打的时候，多大比例选择远程而不是贴脸。上一版没建远程，
## 「苟守」只能理解为「不打」；有了飞鳌之后它可以「远远地耗」，不建模就会错估
const PROFILES := {
	"turtle": {"display": "苟守流", "aggression": 0.15, "parry_rate": 0.10,
			"accuracy": 0.55, "dash_use": 0.20, "snipe_share": 0.70},
	"normal": {"display": "普通", "aggression": 0.55, "parry_rate": 0.45,
			"accuracy": 0.78, "dash_use": 0.60, "snipe_share": 0.35},
	"expert": {"display": "高手", "aggression": 0.85, "parry_rate": 0.85,
			"accuracy": 0.92, "dash_use": 0.90, "snipe_share": 0.15},
}

## 下潜补给。上一版给 30，加上拾取与击杀回氧，结果 32 局里一次 drown 都没发生：
## 「氧是时间预算」完全是空的，苟守流反而因为不接战而活得更久（中位 7 > 普通 6）。
## 降到 12 后，不打的人就真的没氧源——这才是 §3.3 要的可测行为
const DESCENT_O2_BONUS := 12.0
## 失足概率模型。前两轮跑分的结果：
## ① base 0.09 时三个画像死因几乎全是 pit；② 降到 0.05 后高手仍近一半死于沟（一局要过 50 条沟）。
## 现在 base 0.03 并让 dash_use / accuracy 都强相关：会玩的人几乎不失误
const PIT_RISK_BASE := 0.03
## 脱战代价。上一版只给 1.2s，跑分直接报出洞来：纯远程刷 10 层 vs 纯贴脸 6 层，
## 因为「绕开一只怪」几乎不要钱，玩家可以只刷不拼。
## 3.5s 的含义：从一只已经发现你的捕食者身边溜过去，是要真花时间的（氧 5.6 个）
const PASS_TIME_SEC := 3.5
## 被咬中的概率。演进过程本身就是跑分给的：
## ① 无代价跳过 → 苟守中位 7 > 普通 6（不打反而更好，设计失败）；
## ② 必挨半口 → 三个画像全死于 hurt，drown 归零（氧的压力又变成 0）。
## 现在是 0.05：让不打不是「零风险」，但也不把 HP 压力顶成主因——
## 实测：对苟守流来说氧和血两条钟几乎同时到期（每层 -23 氧 / -15 血），
## 所以正确的可证伪形式不是「苟守主要死于氧」，而是「氧会杀不进攻的人，但几乎不杀进攻的人」
const DISENGAGE_HIT_CHANCE := 0.05
const DISENGAGE_DAMAGE := 0.5       # 被咬中时按接触伤害的一半结算
const INVULN_DAMAGE_FACTOR := 0.55  # 无敌帧把围杀的实际受伤率压到约一半
## 远程击杀只给四成电力奖励。不加这条限制，「安全地远远刷」会自循环：
## 刷一只返 18 电 > 一发飞鳌花 14 电，于是没人再愿意贴脸承担风险，
## §3.3 的「进攻 = 风险换资源」直接崩掉。近战才是充电的主通道
const SNIPE_POWER_REWARD_FACTOR := 0.4


class Rng:
	var s: int

	func _init(seed_value: int) -> void:
		s = (seed_value * 2654435761) & 0x7FFFFFFF

	func next_int() -> int:
		s = (s * 1664525 + 1013904223) & 0x7FFFFFFF
		return s

	func unit() -> float:
		return float(next_int()) / 2147483647.0

	func below(p: float) -> bool:
		return unit() < p


## 跑一局。返回 {depth, seconds, kills, snipes, starved, cause, o2_left, hp_left}
## overrides 可以盖画像字段（测试用：比如把苟守流的 snipe_share 置 0，
## 对比「有远程 / 没远程」两种打法谁走得更深）
static func simulate_run(profile_id: String, seed: int, max_depth := 16, overrides := {}) -> Dictionary:
	var prof: Dictionary = PROFILES[profile_id].duplicate()
	for k in overrides:
		prof[k] = overrides[k]
	var rng := Rng.new(seed + int(profile_id.hash()) % 100003)
	var hp: float = float(CT.ECONOMY["hp_max"])
	var o2: float = float(CT.ECONOMY["o2_max"])
	var power: float = float(CT.ECONOMY["power_max"])
	var seconds := 0.0
	var kills := 0
	var snipes := 0
	var engaged := 0
	var starved := 0
	var cause := "alive"
	var depth := 1
	var parry_cost: float = float(CT.PARRY["power_cost"])
	var parry_gain: float = float(CT.PARRY["power_gain"])
	var contact: float = float(CT.enemy("crawler")["contact_damage"])
	var cooldown_sec: float = float(CT.enemy("crawler")["attack_cooldown_frames"]) * CT.FRAME
	var ttk_sec: float = CT.ttk_frames("light_1", "crawler") * CT.FRAME
	var drain: float = float(CT.ECONOMY["o2_drain_per_second"])
	var drown_dps: float = float(CT.ECONOMY["o2_drown_damage_per_second"])
	var snipe_cost: float = float(CT.attack("ranged")["power_cost"])
	var snipe_damage: float = float(CT.attack("ranged")["damage"])
	# 一发飞鳌的实际占用时间：前摇+后摇 与 冷却 取大，再乘上打死一只需要的枪数
	var snipe_cycle_sec: float = float(maxi(CT.total_frames("ranged"),
			int(CT.attack("ranged")["cooldown_frames"]))) * CT.FRAME

	while depth <= max_depth:
		var plan := LG.generate(depth, seed)
		for room in plan["rooms"]:
			var travel: float = float(int(room["width"])) / (float(MV.RUN_SPEED) / float(MV.TILE))
			seconds += travel
			o2 -= drain * travel
			# 沟：dash 用得多、命中准就几乎不失足
			for _g in room["gaps"]:
				var risk: float = PIT_RISK_BASE * (1.0 - float(prof["dash_use"]) * 0.85) \
						* (1.0 - float(prof["accuracy"]) * 0.5)
				if rng.below(risk):
					cause = "pit"
					return _pack(depth, seconds, kills, starved, cause, hp, o2, power)
			for e_spec in room["enemies"]:
				var eid := str(e_spec["id"])
				var estats: Dictionary = CT.enemy(eid)
				engaged += 1
				if not rng.below(float(prof["aggression"])):
					engaged -= 1
					seconds += PASS_TIME_SEC
					o2 -= drain * PASS_TIME_SEC
					hp -= contact * DISENGAGE_DAMAGE if rng.below(DISENGAGE_HIT_CHANCE) else 0.0
					if hp <= 0.0:
						cause = "hurt"
						return _pack(depth, seconds, kills, starved, cause, hp, o2, power, snipes, engaged)
					continue
				# 选择远程：风险为零，但要花电与时间，且击杀只给四成电返奖
				if power >= snipe_cost and rng.below(float(prof.get("snipe_share", 0.0))):
					power -= snipe_cost
					var shots := int(ceil(float(estats["hp"]) / snipe_damage))
					var snipe_secs: float = float(shots) * snipe_cycle_sec
					seconds += snipe_secs
					o2 -= drain * snipe_secs
					kills += 1
					snipes += 1
					power = minf(power + float(estats["power_reward"]) * SNIPE_POWER_REWARD_FACTOR,
							float(CT.ECONOMY["power_max"]))
					o2 = minf(o2 + float(estats["o2_reward"]), float(CT.ECONOMY["o2_max"]))
					if o2 <= 0.0:
						cause = "drown"
						return _pack(depth, seconds, kills, starved, cause, hp, o2, power, snipes, engaged)
					continue
				# 打一只怪要挨几次手：先算出手次数，再逐次判弹反
				var eff_ttk: float = ttk_sec / maxf(float(prof["accuracy"]), 0.2)
				var swings: int = maxi(int(ceil(eff_ttk / cooldown_sec)), 1)
				var killed := false
				for _s in swings:
					if killed:
						break
					if power >= parry_cost and rng.below(float(prof["parry_rate"])):
						# 弹反成功：不掉血、净回电、直接处决（回氧）
						power = minf(power - parry_cost + parry_gain + float(estats["power_reward"]),
								float(CT.ECONOMY["power_max"]))
						o2 = minf(o2 + float(CT.attack("execute")["o2_reward"]), float(CT.ECONOMY["o2_max"]))
						kills += 1
						killed = true
						continue
					if power < parry_cost:
						starved += 1
					hp -= contact * INVULN_DAMAGE_FACTOR
					power = minf(power + float(CT.attack("light_1")["power_gain"]), float(CT.ECONOMY["power_max"]))
				if not killed:
					kills += 1
					power = minf(power + float(estats["power_reward"]), float(CT.ECONOMY["power_max"]))
					o2 = minf(o2 + float(estats["o2_reward"]), float(CT.ECONOMY["o2_max"]))
				if hp <= 0.0:
					cause = "hurt"
					return _pack(depth, seconds, kills, starved, cause, hp, o2, power, snipes, engaged)
			for pk in room["pickups"]:
				if str(pk["kind"]) == "o2":
					o2 = minf(o2 + 22.0, float(CT.ECONOMY["o2_max"]))
				else:
					power = minf(power + 25.0, float(CT.ECONOMY["power_max"]))
			if o2 <= 0.0:
				# 氧空了不是立刻死：每房结算一次 2 秒的掉血，给玩家抢救窗口
				hp -= drown_dps * 2.0
				if hp <= 0.0:
					cause = "drown"
					return _pack(depth, seconds, kills, starved, cause, hp, o2, power, snipes, engaged)
		depth += 1
		o2 = minf(o2 + DESCENT_O2_BONUS, float(CT.ECONOMY["o2_max"]))
	return _pack(depth, seconds, kills, starved, cause, hp, o2, power, snipes, engaged)


static func _pack(depth: int, seconds: float, kills: int, starved: int, cause: String,
		hp: float, o2: float, power: float, snipes: int = 0, engaged: int = 0) -> Dictionary:
	return {"depth": depth - 1, "seconds": seconds, "kills": kills, "snipes": snipes,
		"engaged": engaged, "starved": starved,
		"cause": cause, "hp_left": hp, "o2_left": o2, "power_left": power}


## 一个画像跑 n 局，出分布。中位数是主指标（06 的教训：均值会被极端局拖偏）
static func profile_stats(profile_id: String, base_seed: int, runs: int, overrides := {}) -> Dictionary:
	var depths: Array[int] = []
	var causes := {}
	var seconds: Array[float] = []
	var starved_total := 0
	var kills_total := 0
	var snipes_total := 0
	var engaged_total := 0
	for i in runs:
		var r := simulate_run(profile_id, base_seed + i * 977, 16, overrides)
		depths.append(int(r["depth"]))
		seconds.append(float(r["seconds"]))
		starved_total += int(r["starved"])
		kills_total += int(r["kills"])
		snipes_total += int(r["snipes"])
		engaged_total += int(r["engaged"])
		var c := str(r["cause"])
		causes[c] = int(causes.get(c, 0)) + 1
	depths.sort()
	seconds.sort()
	return {
		"profile": profile_id,
		"display": str(PROFILES[profile_id]["display"]),
		"runs": runs,
		"median_depth": depths[int(depths.size() / 2.0)],
		"min_depth": depths[0],
		"max_depth": depths[depths.size() - 1],
		"median_seconds": seconds[int(seconds.size() / 2.0)],
		"causes": causes,
		"starved_per_run": float(starved_total) / float(maxi(runs, 1)),
		"kills_per_run": float(kills_total) / float(maxi(runs, 1)),
		# 远程占比：验证「有远程可选时，打法真的变了」，也是后面那条
		# 「刷远程不该比贴脸更深」断言的输入
		"snipe_share_observed": float(snipes_total) / float(maxi(engaged_total, 1)),
		"snipes_per_run": float(snipes_total) / float(maxi(runs, 1)),
		"pit_share": float(int(causes.get("pit", 0))) / float(maxi(runs, 1)),
		"drown_share": float(int(causes.get("drown", 0))) / float(maxi(runs, 1)),
		"hurt_share": float(int(causes.get("hurt", 0))) / float(maxi(runs, 1)),
	}


## 设计区间（DoD 第 4 条）。跑分不落在这些区间里，就是数值表要回去改
static func design_bands() -> Dictionary:
	return {
		"turtle_median_depth": [1, 6],
		"normal_median_depth": [4, 10],
		"expert_median_depth": [8, 16],
		"expert_over_normal": [1.0, 4.0],
		# 氧会杀不进攻的人（哪怕不是主因），但几乎不杀进攻的人——这才是双计量的证据
		"turtle_drown_share": [0.04, 1.0],
		"expert_drown_share": [0.0, 0.10],
		"expert_pit_share": [0.0, 0.40],     # 高手不该主要死于失足
		# 远程不能把贴脸顶替掉：否则 §3.3 的「进攻 = 风险换资源」形同虚设
		"melee_power_share": [0.55, 1.0],
	}


static func report_table(base_seed: int, runs: int) -> String:
	var lines: Array[String] = []
	for id in ["turtle", "normal", "expert"]:
		var s := profile_stats(id, base_seed, runs)
		lines.append("  %-6s 中位层数 %2d（%d–%d）  用时 %5.1fs  击杀 %4.1f/局  远程占 %3.0f%%  缺电 %4.1f/局  死因 %s" % [
			s["display"], int(s["median_depth"]), int(s["min_depth"]), int(s["max_depth"]),
			float(s["median_seconds"]), float(s["kills_per_run"]),
			float(s["snipe_share_observed"]) * 100.0, float(s["starved_per_run"]),
			str(s["causes"]),
		])
	return "\n".join(lines)
