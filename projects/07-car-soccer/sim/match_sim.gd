extends RefCounted
## match_sim.gd — 抽象整局跑分：不碰物理，把一场载具足球抽象成「控球桶交换」。
## 三种玩家画像 × 多 seed → 胜率/净胜球/射门数的分布，由 test_match_sim.gd
## 锁成区间断言（选型 §4）：龟缩流必败、普通五五开、高手稳定胜。
## 建模要点（06 调参教训「敌人不是刷新即输出」的足球版，改模型不改数值才有效）：
##   1. 控球有 build-up 桶：AI/玩家都做不到开球即射门；
##   2. 射门会被扑救：扑救概率挂防守方 def，被扑后可能被打反击；
##   3. boost 是弹药：射门花钱、走位补弹——进攻欲望受经济约束（ammo_f）。

const SimRng = preload("res://sim/sim_rng.gd")
const MatchRules = preload("res://sim/rules.gd")

const BUCKET := 5.0                # 每个控球桶 5 秒
const SHOT_COST := 30.0            # 一次射门 boost 开销
const SHOT_BOOST_RATE := 0.5       # 射门意愿里的「有弹药才起脚」系数


static func profiles() -> Dictionary:
	return {
		"龟缩流": {"aggr": 0.22, "acc": 0.32, "def": 0.78, "pos": 0.30, "pace": 0.40},
		"普通": {"aggr": 0.60, "acc": 0.55, "def": 0.55, "pos": 0.60, "pace": 0.60},
		"高手": {"aggr": 0.88, "acc": 0.72, "def": 0.45, "pos": 0.90, "pace": 0.90},
	}


## AI 固定参数（对局难度旋钮；调平衡改这里，区间断言会拦住过强/过弱）
static func ai_level() -> Dictionary:
	return {"aggr": 0.55, "acc": 0.54, "def": 0.55, "pace": 0.60}


static func play_match(seed_value: int, profile: Dictionary, ai: Dictionary) -> Dictionary:
	var rng = SimRng.new(seed_value)
	var clock: float = MatchRules.MATCH_TIME
	var attacker := "player"           # 开球权在玩家
	var score_p := 0
	var score_a := 0
	var shots_p := 0
	var shots_a := 0
	var saves_p := 0                   # 玩家扑救（挡下 AI 射门）次数
	var saves_a := 0
	var boost := 60.0

	while clock > 0.0:
		var dtb: float = minf(BUCKET, clock)
		clock -= dtb
		var attack: Dictionary = profile if attacker == "player" else ai
		var defend: Dictionary = ai if attacker == "player" else profile
		var is_player: bool = attacker == "player"
		# 补弹：走位/推进质量决定回弹速度
		if is_player:
			boost = minf(100.0, boost + float(profile["pos"]) * 22.0)
		else:
			boost = minf(100.0, boost + float(ai["pace"]) * 18.0)

		var ammo_f: float = 1.0 if boost >= 20.0 else 0.5
		var shot_p: float = float(attack["aggr"]) * SHOT_BOOST_RATE * ammo_f

		if rng.chance(shot_p):
			if is_player:
				shots_p += 1
			else:
				shots_a += 1
			boost = maxf(0.0, boost - SHOT_COST)
			var conv: float = float(attack["acc"]) * (1.0 - 0.72 * float(defend["def"]))
			conv = clampf(conv * (0.85 + 0.3 * rng.unit()), 0.0, 0.95)
			if rng.chance(conv):
				if is_player:
					score_p += 1
				else:
					score_a += 1
				# 进球 → 重开：pace/pos 高的一方更常拿下开球权
				var p_edge: float = 0.5 + 0.15 * (float(profile["pos"]) - float(ai["pace"]))
				attacker = "player" if rng.unit() < p_edge else "ai"
			else:
				if is_player:
					saves_a += 1
				else:
					saves_p += 1
				# 被扑 → 防守方可能打反击；控球好的进攻方更会清理反弹球
				var keep_ball: float = 1.0 - 0.5 * float(profile["pos"]) if is_player else 1.0
				var counter: float = (0.25 + 0.35 * float(defend["def"])) * keep_ball
				if rng.chance(counter):
					attacker = "ai" if is_player else "player"
				elif rng.chance(0.4 * keep_ball):
					attacker = "ai" if is_player else "player"
		else:
			# 没起脚：推进失败被断（pace 越低越容易丢球权；pos 高的更会护球）
			var hold: float = 1.0 - 0.4 * float(profile["pos"]) if is_player else 1.0
			var turnover: float = (0.12 + 0.28 * (1.0 - float(attack["pace"]))) * hold
			if rng.chance(turnover):
				attacker = "ai" if is_player else "player"

	return {
		"score_player": score_p,
		"score_ai": score_a,
		"shots_player": shots_p,
		"shots_ai": shots_a,
		"saves_player": saves_p,
		"saves_ai": saves_a,
		"win": 1 if score_p > score_a else 0,
		"draw": 1 if score_p == score_a else 0,
		"goal_diff": score_p - score_a,
		"duration": MatchRules.MATCH_TIME,
	}


static func run_batch(profile: Dictionary, runs: int, base_seed: int) -> Dictionary:
	var wins := 0
	var draws := 0
	var goals_p := 0
	var goals_a := 0
	var shots_p := 0
	for i in range(runs):
		var r: Dictionary = play_match(base_seed + i * 7919, profile, ai_level())
		wins += int(r["win"])
		draws += int(r["draw"])
		goals_p += int(r["score_player"])
		goals_a += int(r["score_ai"])
		shots_p += int(r["shots_player"])
	var n := float(runs)
	return {
		"runs": runs,
		"win_rate": float(wins) / n,
		"draw_rate": float(draws) / n,
		"avg_score_player": float(goals_p) / n,
		"avg_score_ai": float(goals_a) / n,
		"avg_shots_player": float(shots_p) / n,
	}
