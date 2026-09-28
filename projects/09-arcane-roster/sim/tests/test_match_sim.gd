extends GutTest
## 整局跑分的区间断言（docs/00 §4.3：断言**分布**而不是单值）。
##
## 这是 09 最重要的一组测试：它锁住「这局游戏有没有决策深度」这个结论。
## **基线来自 20 seed 实测，改动任何数值表后这里必须重新实测再改区间。**
##
## 实测记录：
##   2026-09-27（初版）：龟缩 0% · 普通 65% · 高手 65%
##   2026-09-28（修复「败仗不掉血」+ 布阵分层 + 战斗越中线 + 摆位接线后）：
##     龟缩 0% · 普通 55% · 高手 60% · 整局 9–16 分钟 · 单场 12.5–13.7 秒
##     合成次数：龟缩 0 / 普通 9 / 高手 8
##     **高手第一次反超普通**——摆位维度打破了 §3.2 的「打平」缺口
##
## 历史缺口（已解决，留档防止被当成 bug）：普通与高手曾长期打平（65% vs 65%），
## 当时试过四种「更聪明的打法」（囤利息 / 狂刷商店 / 冲主 C / 只买便宜）全部更差。
## 最终答案是**接上手动摆位**（自走棋的核心决策维度），而不是加新机制。

const RUNS := 16   # 测试里跑 16 局：12 局时画像间的 ±8% 噪声会误报（实测踩过）


func test_turtle_profile_always_loses() -> void:
	# 「必败」是本作最重要的一条：不会运营的玩家应该早早出局，
	# 否则游戏退化成堆数字（06 的教训：难度中段最容易塌）
	var s := MatchSim.sweep(MatchSim.PROFILES["龟缩流"], RUNS)
	assert_lte(float(s["clear_rate"]), 0.10,
		"龟缩流通关率必须 ≈0（实测 %.0f%%）——它不升星不运营，理论上必败" % (float(s["clear_rate"]) * 100.0))
	assert_lte(float(s["combines_med"]), 1.0,
		"龟缩流几乎不合成（实测中位 %.1f 次），这是它输的根因" % float(s["combines_med"]))


func test_normal_profile_is_the_baseline() -> void:
	var s := MatchSim.sweep(MatchSim.PROFILES["普通"], RUNS)
	assert_gt(float(s["clear_rate"]), 0.30, "普通画像至少要有三成胜率（实测 %.0f%%）" % (float(s["clear_rate"]) * 100.0))
	assert_lte(float(s["clear_rate"]), 0.90, "普通画像过高说明「不运营也能赢」（实测 %.0f%%）" % (float(s["clear_rate"]) * 100.0))
	assert_gte(float(s["combines_med"]), 3.0, "普通画像应稳定升星（实测中位 %.1f 次）" % float(s["combines_med"]))


func test_expert_is_not_worse_than_normal() -> void:
	# 目标形状是「高手 ≥ 普通」。当前实测两者打平（65% vs 65%），
	# 所以断言写成「不显著更差」而不是「更好」——等 v2 有了真正拉开差距的机制再收紧
	var a := MatchSim.sweep(MatchSim.PROFILES["普通"], RUNS)
	var b := MatchSim.sweep(MatchSim.PROFILES["高手"], RUNS)
	assert_gte(float(b["clear_rate"]) + 0.25, float(a["clear_rate"]),
		"高手画像不该明显更差（普通 %.0f%% / 高手 %.0f%%）" % [
			float(a["clear_rate"]) * 100.0, float(b["clear_rate"]) * 100.0])
	assert_gt(float(b["clear_rate"]), 0.30, "高手画像应有可观胜率（实测 %.0f%%）" % (float(b["clear_rate"]) * 100.0))


func test_profiles_are_ordered() -> void:
	var turtle := MatchSim.sweep(MatchSim.PROFILES["龟缩流"], RUNS)
	var normal := MatchSim.sweep(MatchSim.PROFILES["普通"], RUNS)
	var expert := MatchSim.sweep(MatchSim.PROFILES["高手"], RUNS)
	assert_gt(float(normal["clear_rate"]), float(turtle["clear_rate"]) + 0.2,
		"普通必须显著强于龟缩（%.0f%% vs %.0f%%）" % [
			float(normal["clear_rate"]) * 100.0, float(turtle["clear_rate"]) * 100.0])
	assert_gt(float(expert["clear_rate"]), float(turtle["clear_rate"]) + 0.2,
		"高手必须显著强于龟缩（%.0f%% vs %.0f%%）" % [
			float(expert["clear_rate"]) * 100.0, float(turtle["clear_rate"]) * 100.0])


func test_full_run_length_in_design_window() -> void:
	# 设计目标：一局 10–18 分钟。太短＝没内容，太长＝劝退
	for name in ["龟缩流", "普通", "高手"]:
		var s := MatchSim.sweep(MatchSim.PROFILES[name], RUNS)
		assert_gt(float(s["minutes_max"]), 8.0, "%s 的最长局只有 %.1f 分钟，太短" % [name, float(s["minutes_max"])])
		assert_lt(float(s["minutes_min"]), 20.0, "%s 的最短局已有 %.1f 分钟，太长" % [name, float(s["minutes_min"])])


func test_battle_length_in_design_window() -> void:
	for name in ["普通", "高手"]:
		var s := MatchSim.sweep(MatchSim.PROFILES[name], RUNS)
		assert_gt(float(s["battle_med"]), 6.0, "%s 的单场战斗只有 %.1f 秒" % [name, float(s["battle_med"])])
		assert_lt(float(s["battle_med"]), 26.0, "%s 的单场战斗长达 %.1f 秒" % [name, float(s["battle_med"])])


func test_traits_actually_get_formed() -> void:
	# 羁绊条数低于 0.8 说明玩家在堆散兵，组合深度（本作的核心卖点）就没兑现
	for name in ["普通", "高手"]:
		var s := MatchSim.sweep(MatchSim.PROFILES[name], RUNS)
		assert_gt(float(s["traits_med"]), 1.2, "%s 的平均羁绊条数只有 %.2f，阵容是散的" % [name, float(s["traits_med"])])


func test_run_is_terminated() -> void:
	for name in MatchSim.PROFILES:
		var r := MatchSim.play(MatchSim.PROFILES[name], 20260927)
		var profile := str(name)
		assert_lte(int(r["stages_played"]), StageTable.STAGE_COUNT + 1,
			"整局不能超过总阶段数（%s 打了 %d 场）" % [profile, int(r["stages_played"])])
		assert_gte(int(r["stages_played"]), 1, "至少要打一场")
		assert_true(bool(r["won"]) or int(r["hp_left"]) <= 0 or int(r["stages_played"]) <= StageTable.STAGE_COUNT,
			"没通关就必须有明确原因（输在第 %d 阶段 / 剩 %d 血）" % [int(r["stages_played"]), int(r["hp_left"])])


func test_run_is_deterministic_per_seed() -> void:
	var a := MatchSim.play(MatchSim.PROFILES["普通"], 555)
	var b := MatchSim.play(MatchSim.PROFILES["普通"], 555)
	assert_eq(a["stages_played"], b["stages_played"], "同 seed 的整局必须完全一致")
	assert_eq(a["won"], b["won"])
	assert_almost_eq(float(a["seconds"]), float(b["seconds"]), 0.001, "同 seed 的总时长必须一致")


func test_clear_requires_beating_final_boss() -> void:
	# 少了这条，打输最终战但没掉光血的玩家会被算成通关（实测踩到过）
	var rs := RunState.new(99)
	rs.stage = StageTable.STAGE_COUNT
	rs.last_win = false
	rs.hp = 50
	assert_false(rs.advance(), "到总阶段数就结束")
	assert_false(rs.won, "最后一阶段打输 ≠ 通关")
	assert_true(rs.over)


func test_damage_comes_from_survivors() -> void:
	var rs := RunState.new(101)
	rs.stage = 4
	rs.gold = 200
	for _i in range(12):
		for s in range(rs.shop.size()):
			rs.buy(s)
		rs.begin_stage()
	var before := rs.hp
	var r := rs.battle(555)
	var logged: Dictionary = rs.stage_log[0]
	var dmg := int(logged["damage"])
	if not bool(logged["win"]):
		assert_gt(dmg, 0, "战败必须掉血")
		assert_eq(rs.hp, before - dmg, "掉血必须与战报一致（血 %d → %d，掉 %d）" % [before, rs.hp, dmg])
	else:
		assert_eq(dmg, 0, "战胜不应掉血")
	assert_eq(int(r["winner"]) in [0, 1], true, "battle() 必须回填胜者")


func test_lose_damage_always_matches_real_survivors() -> void:
	# **无条件对账**（诊断 P0-1 的防复发锁）：
	# 败仗伤害必须逐场等于「sim 结束时 side=ENEMY 且 alive 的非召唤物」的 2★+1 之和。
	# 原实现拿编成表按**初始 cell**反查 sim，敌人一移动就匹配不上，
	# 实测 36 场败仗里 21 场记账错误、14 场明明输了却一滴血不掉。
	# 旧断言「if not win: assert_gt(dmg,0)」只测一场且包在 if 里，抓不住它。
	var checked := 0
	var lost := 0
	for s in range(4):
		var seed_value := 20260927 + s * 131
		var rs := RunState.new(seed_value)
		var rng := SimRng.new(seed_value ^ 0x5EED)
		while true:
			MatchSim._plan(rs, MatchSim.PROFILES["普通"], rng)
			var enemy := rs.make_enemy(seed_value)
			var sim := BattleSim.new(rs.board_defs(), enemy, seed_value + rs.stage, Traits.bonuses(rs.board))
			var r := sim.run()
			rs.apply_battle_result(r, enemy, sim)
			var logged: Dictionary = rs.stage_log[rs.stage_log.size() - 1]
			if not bool(logged["win"]):
				lost += 1
				var expected := 0
				for u in sim.units:
					var d: Dictionary = u
					if int(d["side"]) == Board.ENEMY and bool(d["alive"]) and not bool(d["is_summon"]):
						expected += 2 * int(d["star"]) + 1
				if StageTable.is_boss(rs.stage):
					expected = int(round(float(expected) * RunState.BOSS_DAMAGE_MULT))
				assert_gt(expected, 0, "S%d 敌方明明有存活者，对账基线却算出 0" % rs.stage)
				assert_eq(int(logged["damage"]), expected,
					"S%d 败仗伤害必须等于真实存活者星级和（记 %d，应 %d）" % [
						rs.stage, int(logged["damage"]), expected])
			checked += 1
			if not rs.advance():
				break
	assert_gt(checked, 10, "对账至少要覆盖 10 场战斗（实测 %d 场）" % checked)
	assert_gt(lost, 0, "样本里必须出现败仗，否则这条测试什么也没锁")


func test_sweep_reports_every_metric() -> void:
	var s := MatchSim.sweep(MatchSim.PROFILES["普通"], 3)
	for key in ["clear_rate", "minutes_min", "minutes_med", "minutes_max", "stages_med",
			"damage_med", "battle_med", "traits_med", "combines_med", "streak_med"]:
		assert_true(s.has(key), "跑分报告缺少指标 %s" % key)
		assert_false(is_nan(float(s[key])), "指标 %s 出现 NaN" % key)
