extends GutTest

# 整局模拟：确定性、迷宫约束、画像梯度。
# 断言刻意写成**区间/不等式**（路线图 §4.3）：跑分看分布，不锁单值。

const W: int = 18
const H: int = 12


func _sim(seed_value: int, profile: String) -> MatchSim:
	var s: MatchSim = MatchSim.new()
	s.setup(W, H, Vector2i(0, 5), Vector2i(17, 6), seed_value, profile)
	return s


func test_same_seed_gives_identical_result() -> void:
	var a: Dictionary = _sim(12345, "optimal").run()
	var b: Dictionary = _sim(12345, "optimal").run()
	assert_eq(a["result"], b["result"], "同种子结局一致")
	assert_eq(a["wave"], b["wave"], "同种子波次一致")
	assert_eq(a["core_hp"], b["core_hp"], "同种子剩余 HP 一致")
	assert_eq(a["elapsed"], b["elapsed"], "同种子时长一致")


func test_maze_never_seals_during_play() -> void:
	var s: MatchSim = _sim(777, "optimal")
	s.run()
	assert_true(PathFinder.reachable(s.grid), "整局结束后入口→核心仍连通")
	assert_gt(int(s.stats["built"]), 0, "bot 确实建了塔")


func test_match_reaches_a_terminal_state() -> void:
	var s: MatchSim = _sim(2024, "balanced")
	var r: Dictionary = s.run()
	assert_true(
		String(r["result"]) == MatchSim.PHASE_WON or String(r["result"]) == MatchSim.PHASE_LOST,
		"整局必须有结束条件（胜或败）"
	)
	assert_gt(float(r["elapsed"]), 60.0, "一局不该在 1 分钟内结束")


func test_random_is_not_better_than_optimal() -> void:
	# 策略深度的底线：会玩的不能比乱建差
	var r: Dictionary = _sim(4242, "random").run()
	var o: Dictionary = _sim(4242, "optimal").run()
	var rw: int = int(r["wave"])
	var ow: int = int(o["wave"])
	assert_gte(ow, rw, "最优打到的波次不应低于乱建（乱建 %d 波 / 最优 %d 波）" % [rw, ow])


func test_economy_helpers() -> void:
	assert_eq(Economy.START_CREDITS, 250, "初始资金")
	assert_eq(Economy.wave_bonus(1), 45, "第 1 波结算")
	assert_eq(Economy.early_bonus(10.0), 20, "提前 10 秒开波奖励")
	assert_eq(Economy.sell_refund(100), 70, "出售返还 70%")
	assert_eq(Economy.tower_spent("vulcan", 2), 150, "机炮塔两级累计投入")
