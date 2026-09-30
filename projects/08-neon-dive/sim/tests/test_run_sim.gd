extends GutTest

## 整局跑分的形状断言（docs/08 §6 DoD 第 4 条）。
## 这里锁的不是「某一局打了多少层」，而是**三种打法之间必须有正确的排序与死因结构**——
## 排序错了就说明双计量（氧=时间预算、电=进攻奖励）没在起作用，那本作的设计核心就是空的。

const RS := preload("res://sim/run_sim.gd")

# 24 局时排序会因样本噪声翻转（实测苟守 7 vs 普通 6）。
# 跑分是纯数学，40 局成本极低，换稳是对的
const RUNS := 40
const BASE_SEED := 20260927


func test_same_seed_same_result() -> void:
	var a := RS.simulate_run("normal", 12345)
	var b := RS.simulate_run("normal", 12345)
	assert_eq(str(a), str(b), "同画像同种子必须给同一局结果，否则跑分不可复现")


func test_death_cause_is_from_the_known_set() -> void:
	for id in ["turtle", "normal", "expert"]:
		for i in 6:
			var r := RS.simulate_run(id, 777 + i * 31)
			assert_true(str(r["cause"]) in ["pit", "hurt", "drown", "alive"],
					"%s 出现了未知死因 %s" % [id, str(r["cause"])])
			assert_gte(int(r["depth"]), 1, "%s 至少要在第 1 层，实测 %d" % [id, int(r["depth"])])


func test_median_depth_ordering_matches_skill() -> void:
	var turtle := RS.profile_stats("turtle", BASE_SEED, RUNS)
	var normal := RS.profile_stats("normal", BASE_SEED, RUNS)
	var expert := RS.profile_stats("expert", BASE_SEED, RUNS)
	# 苟守不得赢过普通（上一版无脱战代价时它就是赢了，那就是设计失败）
	assert_lte(int(turtle["median_depth"]), int(normal["median_depth"]),
			"苟守不该比普通深：%d vs %d" % [int(turtle["median_depth"]), int(normal["median_depth"])])
	assert_lt(int(normal["median_depth"]), int(expert["median_depth"]),
			"高手必须严格比普通深：%d vs %d" % [int(normal["median_depth"]), int(expert["median_depth"])])


func test_kills_increase_with_aggression() -> void:
	var turtle := RS.profile_stats("turtle", BASE_SEED, RUNS)
	var normal := RS.profile_stats("normal", BASE_SEED, RUNS)
	var expert := RS.profile_stats("expert", BASE_SEED, RUNS)
	assert_lt(float(turtle["kills_per_run"]), float(normal["kills_per_run"]), "击杀数要随进攻性上升")
	assert_lt(float(normal["kills_per_run"]), float(expert["kills_per_run"]), "同上")


func test_oxygen_kills_non_fighters_but_not_fighters() -> void:
	# 这是「氧是时间预算、战斗是氧的来源」的可证伪形式：
	# 不进攻的人必须存在被氧淹死；而进攻的人几乎不会（否则氧没在区分打法）
	var turtle := RS.profile_stats("turtle", BASE_SEED, RUNS)
	var expert := RS.profile_stats("expert", BASE_SEED, RUNS)
	var bands := RS.design_bands()
	var tb: Array = bands["turtle_drown_share"]
	assert_between(float(turtle["drown_share"]), float(tb[0]), float(tb[1]),
			"苟守流 drown 占比 %0.2f 不在 %s" % [float(turtle["drown_share"]), str(tb)])
	var eb: Array = bands["expert_drown_share"]
	assert_between(float(expert["drown_share"]), float(eb[0]), float(eb[1]),
			"高手 drown 占比 %0.2f 不在 %s（进攻的人也缺氧，说明击杀回氧不够）"
			% [float(expert["drown_share"]), str(eb)])


func test_expert_does_not_die_of_slipping() -> void:
	var expert := RS.profile_stats("expert", BASE_SEED, RUNS)
	var band: Array = RS.design_bands()["expert_pit_share"]
	assert_lte(float(expert["pit_share"]), float(band[1]),
			"高手 pit 占比 %0.2f 过高：失足模型没和打法挂钩" % float(expert["pit_share"]))


func test_all_medians_inside_bands() -> void:
	var bands := RS.design_bands()
	for id in ["turtle", "normal", "expert"]:
		var s := RS.profile_stats(id, BASE_SEED + 4242, RUNS)
		var band: Array = bands[id + "_median_depth"]
		assert_between(float(s["median_depth"]), float(band[0]), float(band[1]),
				"%s 中位层数 %d 不在 %s" % [id, int(s["median_depth"]), str(band)])


func test_sniping_does_not_beat_fighting() -> void:
	# 这条是本轮新机制的核心可证伪断言：如果「零风险地远远刷」比贴脸打得更深，
	# 那§3.3 的「进攻 = 风险换资源」就是空话，玩家会理性地选择刷远程
	var ranged_only := RS.profile_stats("normal", BASE_SEED, RUNS, {"snipe_share": 1.0})
	var melee_only := RS.profile_stats("normal", BASE_SEED, RUNS, {"snipe_share": 0.0})
	assert_lte(int(ranged_only["median_depth"]), int(melee_only["median_depth"]) + 1,
			"纯远程刷不得比纯贴脸更深：%d vs %d" % [
				int(ranged_only["median_depth"]), int(melee_only["median_depth"])])
	# 并且远程确实被选到了，否则上面那条是「因为没生效所以通过」的假绿
	assert_gte(float(ranged_only["snipe_share_observed"]), 0.5,
			"远程占比只有 %0.2f，说明 snipe_share 没生效" % float(ranged_only["snipe_share_observed"]))


func test_melee_is_still_the_main_engine_for_good_players() -> void:
	# 高手应该以贴脸为主（弹反的收益高于安全刷），否则风险机制没意义
	var expert := RS.profile_stats("expert", BASE_SEED, RUNS)
	var melee_share: float = 1.0 - float(expert["snipe_share_observed"])
	var band: Array = RS.design_bands()["melee_power_share"]
	assert_between(melee_share, float(band[0]), float(band[1]),
			"高手的贴脸占比 %0.2f 不在 %s（远程占比 %0.2f）"
			% [melee_share, str(band), float(expert["snipe_share_observed"])])


func test_run_length_is_in_a_playable_window() -> void:
	# 「一局」要短到愿意重开（Downwell 尺度）：中位用时超过 6 分钟就该改层深或氧压
	var normal := RS.profile_stats("normal", BASE_SEED, RUNS)
	assert_between(float(normal["median_seconds"]), 30.0, 360.0,
			"普通画像中位用时 %.0fs 不在可玩窗口" % float(normal["median_seconds"]))
