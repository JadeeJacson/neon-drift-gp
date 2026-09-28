extends GutTest
## 羁绊、经济、商店、阶段表。**经济不变量是自走棋的地基**：
## 金币不能负、利息要封顶、人口要单调、合成要真的省人口。


func _u(id: String, star: int = 1) -> Dictionary:
	return {"id": id, "star": star}


# ---------- 羁绊 ----------

func test_no_units_no_trait() -> void:
	assert_eq(Traits.active([]).size(), 0)
	assert_eq(Traits.bonuses([])["atk_pct"], 0.0)


func test_faction_trait_thresholds() -> void:
	var two := Traits.active([_u("knight"), _u("barbarian")])
	assert_eq(two.size(), 1, "2 个圣团应激活 1 条羁绊")
	assert_eq(str(two[0]["id"]), "order")
	assert_eq(int(two[0]["tier"]), 1)
	var four := Traits.active([_u("knight"), _u("barbarian"), _u("rogue"), _u("mage")])
	assert_eq(int(four[0]["tier"]), 2, "4 个圣团应到 II 级")
	var six := Traits.active([_u("knight"), _u("barbarian"), _u("rogue"), _u("mage"), _u("hooded"), _u("knight")])
	assert_eq(int(six[0]["tier"]), 3, "6 个圣团应到 III 级")


func test_trait_takes_highest_tier_only() -> void:
	var units := [_u("knight"), _u("barbarian"), _u("rogue"), _u("mage"), _u("hooded"), _u("knight")]
	var b := Traits.bonuses(units)
	# 只取最高档，不能把 I/II/III 叠加（叠加会让羁绊变成无脑堆人数）
	var t2 := Traits.bonuses([_u("knight"), _u("barbarian"), _u("rogue"), _u("mage")])
	assert_gt(float(b["atk_pct"]), float(t2["atk_pct"]), "6 人档应高于 4 人档")
	# 6 个圣团（其中 3 个 front）→ 圣团 III + 近卫 I + 星辉（6 个全 1★，同星凑满）。
	# 星辉是 P0-2 修复后才能激活的：修复前这条断言只数得出 2 条
	assert_eq(int(Traits.active(units).size()), 3, "圣团 III + 近卫 I + 星辉 = 3 条")


func test_constellation_trait_needs_six_same_star() -> void:
	# 星辉：**同一星级**的单位凑满 6 个才激活。修复前判定写成「单位星级 ≥ 6」，
	# 而 MAX_STAR=3 → 恒 false，这条羁绊从上线起就一次都没亮过（诊断 P0-2）
	var all_1star := [_u("knight"), _u("barbarian"), _u("rogue"), _u("mage"), _u("hooded"), _u("knight")]
	var hit := false
	for a in Traits.active(all_1star):
		if str(a["id"]) == "constellation":
			hit = true
	assert_true(hit, "6 个同 1★ 必须激活星辉")
	# 5 个 1★ + 1 个 2★：最大的同星组只有 5，不该激活
	var mixed := [_u("knight"), _u("barbarian"), _u("rogue"), _u("mage"), _u("hooded"), _u("knight", 2)]
	for a2 in Traits.active(mixed):
		assert_false(str(a2["id"]) == "constellation", "混星 5+1 不该激活星辉")
	# 2★ 阵容同样成立：6 个 2★ 也该点亮
	var all_2star := [_u("knight", 2), _u("barbarian", 2), _u("rogue", 2), _u("mage", 2), _u("hooded", 2), _u("knight", 2)]
	var hit2 := false
	for a3 in Traits.active(all_2star):
		if str(a3["id"]) == "constellation":
			hit2 = true
	assert_true(hit2, "6 个同 2★ 也必须激活星辉")


func test_trait_bonuses_are_non_negative() -> void:
	var units := [_u("knight"), _u("barbarian"), _u("rogue"), _u("mage"), _u("sk_warrior"), _u("sk_rogue")]
	var b := Traits.bonuses(units)
	for k in b:
		assert_gte(float(b[k]), 0.0, "羁绊加成 %s 不能为负" % k)


func test_role_trait_needs_enough_units() -> void:
	var one := Traits.active([_u("knight"), _u("barbarian")])
	var has_vanguard := false
	for a in one:
		if str(a["id"]) == "vanguard":
			has_vanguard = true
	assert_false(has_vanguard, "2 个前排不该激活近卫（门槛 3）")


func test_trait_summary_is_readable() -> void:
	var s := Traits.summary([_u("knight"), _u("barbarian")])
	assert_ne(s, "", "至少激活一条时应能生成摘要")
	assert_eq(Traits.summary([]), "", "无羁绊时摘要应为空串")
	assert_true(Traits.roman(2) == "II", "罗马数字")


func test_trait_bonus_applies_to_mixed_factions() -> void:
	# 门槛是 2/4，所以必须各放 2 个才激活（1+1 谁都不够）
	var b := Traits.bonuses([_u("knight"), _u("barbarian"), _u("sk_warrior"), _u("sk_rogue")])
	assert_gt(float(b["atk_pct"]), 0.0, "圣团 I + 亡者 I 都应激活（实测加成 %.2f）" % float(b["atk_pct"]))
	assert_gte(float(Traits.active([_u("knight"), _u("barbarian"), _u("sk_warrior"), _u("sk_rogue")]).size()), 2.0,
		"两个阵营各 2 人应同时激活两条羁绊")


# ---------- 经济 ----------

func test_interest_formula() -> void:
	var rs := RunState.new(1)
	rs.gold = 0
	assert_eq(rs.income()["interest"], 0.0, "没钱时没有利息")
	rs.gold = 9
	assert_eq(rs.income()["interest"], 0.0, "9 块没有利息")
	rs.gold = 10
	assert_eq(rs.income()["interest"], 1.0, "10 块 1 息")
	rs.gold = 30
	assert_eq(rs.income()["interest"], 3.0, "30 块 3 息")


func test_interest_is_capped() -> void:
	var rs := RunState.new(1)
	rs.gold = 1000
	assert_eq(rs.income()["interest"], float(RunState.INTEREST_CAP),
		"利息必须封顶 %d，否则存钱就是无脑最优解" % RunState.INTEREST_CAP)


func test_income_components_sum() -> void:
	var rs := RunState.new(1)
	rs.gold = 25
	var inc := rs.income()
	# 「提前开战 +1」已从 income() 移除（P2 修复）：它原来被无条件算进每阶段收入，
	# 等满倒计时自动开战的玩家也白拿。现在提前开战才发，走 start_early()。
	assert_false(inc.has("early"), "income() 不应再包含提前开战项（它走 start_early）")
	assert_almost_eq(float(inc["total"]),
		float(inc["base"]) + float(inc["interest"]) + float(inc["streak"]), 0.001,
		"总收入必须等于各项之和")


func test_early_start_bonus_is_real() -> void:
	# 提前开战的奖励必须**真的开战才发**：income() 不送，start_early() 才送。
	# 注意 income() 依赖当前 gold（利息），必须先取明细再 begin_stage，顺序反了会对不上
	var rs := RunState.new(1)
	rs.begin_stage()
	var expected := rs.income()
	var before := rs.gold
	rs.begin_stage()
	assert_eq(rs.gold - before, int(expected["total"]), "阶段收入不含提前开战项")
	rs.start_early()
	assert_eq(rs.gold, before + int(expected["total"]) + RunState.EARLY_START_BONUS, "start_early 补上 +1 奖励")


func test_streak_bonus_grows_and_caps() -> void:
	var rs := RunState.new(1)
	rs.streak = 1
	assert_eq(rs.income()["streak"], 2.0, "1 连胜给 2")
	rs.streak = 3
	assert_eq(rs.income()["streak"], 4.0, "3 连胜给 4")
	rs.streak = 20
	assert_eq(rs.income()["streak"], float(RunState.STREAK_BONUS_CAP), "连胜赏金必须封顶")


func test_loss_relief() -> void:
	var rs := RunState.new(1)
	rs.streak = 0
	assert_eq(rs.income()["streak"], 0.0, "1 连败不补偿")
	rs.streak = -2
	assert_eq(rs.income()["streak"], 1.0, "2 连败起补偿")
	rs.streak = -9
	assert_eq(rs.income()["streak"], float(RunState.LOSS_RELIEF_CAP), "连败补偿必须封顶")


func test_gold_never_negative() -> void:
	var rs := RunState.new(7)
	rs.gold = 0
	assert_false(rs.can_afford(0), "0 金买不了 1 金单位")
	for _i in range(30):
		for s in range(rs.shop.size()):
			rs.buy(s)
		rs.reroll()
		rs.combine()
		assert_gte(rs.gold, 0, "任何操作之后金币都不能为负")


func test_buy_removes_slot_and_pays() -> void:
	var rs := RunState.new(11)
	var cost := int(rs.shop[0]["cost"])
	var gold := rs.gold
	var id := str(rs.shop[0]["id"])
	assert_true(rs.buy(0))
	assert_eq(rs.gold, gold - cost, "买完金币应正好扣掉费用")
	assert_eq(rs.shop.size(), RunState.SHOP_SLOTS - 1, "买掉一个槽位")
	assert_true(rs.bench.size() > 0 or rs.board.size() > 0, "买到的单位应进入待命或棋盘")


func test_sell_refunds() -> void:
	var rs := RunState.new(13)
	rs.buy(0)
	var star := 1
	var unit: Dictionary = rs.board[0] if rs.board.size() > 0 else rs.bench[0]
	star = int(unit["star"])
	var gold := rs.gold
	if rs.board.size() > 0:
		rs.sell_board(0)
	else:
		rs.sell_bench(0)
	assert_eq(rs.gold, gold + UnitTable.sell_value(star), "卖价必须按星级退款")


func test_reroll_costs_and_reshuffles() -> void:
	var rs := RunState.new(17)
	rs.gold = 3
	assert_true(rs.reroll())
	assert_eq(rs.gold, 1, "刷新扣 %d 金" % RunState.REROLL_COST)
	rs.gold = 0
	assert_false(rs.reroll(), "没钱不能刷新")


# ---------- 人口与布阵 ----------

func test_population_cap_grows_and_caps() -> void:
	var rs := RunState.new(3)
	assert_eq(rs.population_cap(), 3, "开局 3 人")
	rs.stage = 5
	assert_eq(rs.population_cap(), 5, "第 5 阶段 5 人")
	rs.stage = 20
	assert_eq(rs.population_cap(), UnitTable.POP_MAX, "人口不得超过上限 %d" % UnitTable.POP_MAX)


func test_last_win_gives_bonus_population() -> void:
	var rs := RunState.new(3)
	rs.stage = 1
	rs.last_win = true
	assert_eq(rs.population_cap(), 4, "赢一场多 1 人口")


func test_board_never_exceeds_population() -> void:
	var rs := RunState.new(23)
	rs.gold = 200
	for _i in range(60):
		for s in range(rs.shop.size()):
			rs.buy(s)
		rs.begin_stage()
		assert_lte(rs.board.size(), rs.population_cap(),
			"棋盘人数 %d 超过人口上限 %d" % [rs.board.size(), rs.population_cap()])


func test_placement_is_legal() -> void:
	var rs := RunState.new(29)
	rs.gold = 120
	for _i in range(10):
		for s in range(rs.shop.size()):
			rs.buy(s)
		rs.begin_stage()
	var occ := rs.occupancy()
	assert_eq(occ.size(), rs.board.size(), "占位表与棋盘单位数必须一致")
	for cell in occ:
		assert_true(Board.ALLY_ROWS.has(cell.y), "我方棋盘上不能出现敌方行的格子：%s" % str(cell))


func test_place_unit_rejects_illegal() -> void:
	var rs := RunState.new(31)
	# **断言不能包在 if 里**：原版依赖「买到的单位没自动上阵」这个随机器件，
	# 条件不成立时整条测试零断言 → GUT 判 risky，一挂就是好几个月。
	# 直接塞备战单位，四条断言无条件执行。
	rs.bench.append({"id": "knight", "star": 1})
	rs.bench.append({"id": "barbarian", "star": 1})
	assert_false(rs.place_unit(0, Vector2i(0, 0)), "不能放到敌方半场")
	assert_false(rs.place_unit(0, Vector2i(99, 4)), "不能越界")
	assert_false(rs.place_unit(0, Vector2i(4, 0)), "不能放到我方半场之外")
	assert_false(rs.place_unit(99, Vector2i(0, 4)), "待命区下标越界")
	assert_true(rs.place_unit(0, Vector2i(4, 4)), "合法落位必须成功")
	assert_false(rs.place_unit(0, Vector2i(4, 4)), "已占的格子不能再放")
	assert_eq(rs.board.size(), 1, "两次落位只有一次成功")


# ---------- 合成 ----------

func test_combine_three_into_one() -> void:
	var rs := RunState.new(37)
	rs.gold = 500
	# 直接造 3 个同名单位
	for _i in range(3):
		rs.bench.append({"id": "knight", "star": 1})
	assert_true(rs.can_combine(), "3 个同名 1★ 应可合成")
	var before := rs.board.size() + rs.bench.size()
	assert_true(rs.combine())
	var after := rs.board.size() + rs.bench.size()
	assert_eq(before - after, 2, "3 合 1 应减少 2 个单位")
	var found := false
	for u in rs.board:
		var d: Dictionary = u
		if str(d["id"]) == "knight" and int(d["star"]) == 2:
			found = true
	for u2 in rs.bench:
		var d2: Dictionary = u2
		if str(d2["id"]) == "knight" and int(d2["star"]) == 2:
			found = true
	assert_true(found, "合成产物应是 2★ 骑士")


func test_combine_lands_on_board_when_space() -> void:
	# 合成产物必须立刻上阵：留在备战区等于白合（它不参战，而收益全在腾出的人口）
	var rs := RunState.new(41)
	rs.board = [{"id": "mage", "star": 1, "cell": Vector2i(4, 4)}]
	rs.bench = [{"id": "knight", "star": 1}, {"id": "knight", "star": 1}, {"id": "knight", "star": 1}]
	assert_true(rs.combine())
	var on_board := false
	for u in rs.board:
		var d: Dictionary = u
		if str(d["id"]) == "knight" and int(d["star"]) == 2:
			on_board = true
	assert_true(on_board, "棋盘有空位时 2★ 必须直接上阵")


func test_combine_respects_max_star() -> void:
	var rs := RunState.new(43)
	rs.bench = [{"id": "knight", "star": 3}, {"id": "knight", "star": 3}, {"id": "knight", "star": 3}]
	assert_false(rs.can_combine(), "3★ 不应再能合成（避免产出 4★）")


func test_combine_deterministic_order() -> void:
	# 两组都能合时，「先合谁」不能随 Dictionary 顺序漂移
	var rs_a := RunState.new(47)
	rs_a.bench = [
		{"id": "mage", "star": 1}, {"id": "mage", "star": 1}, {"id": "mage", "star": 1},
		{"id": "knight", "star": 1}, {"id": "knight", "star": 1}, {"id": "knight", "star": 1},
	]
	var first_a := ""
	if rs_a.combine():
		for u in rs_a.bench:
			first_a = str((u as Dictionary)["id"])
	var rs_b := RunState.new(47)
	rs_b.bench = [
		{"id": "mage", "star": 1}, {"id": "mage", "star": 1}, {"id": "mage", "star": 1},
		{"id": "knight", "star": 1}, {"id": "knight", "star": 1}, {"id": "knight", "star": 1},
	]
	if rs_b.combine():
		for u2 in rs_b.bench:
			assert_eq(str((u2 as Dictionary)["id"]), first_a, "同输入的合成顺序必须一致")


# ---------- 阶段表 ----------

func test_budget_is_monotonic() -> void:
	var prev := -1.0
	for stage in range(1, StageTable.STAGE_COUNT + 1):
		var b := StageTable.budget(stage, 0)
		assert_gt(b, prev, "第 %d 阶段预算必须高于上一阶段" % stage)
		prev = b


func test_streak_raises_budget() -> void:
	assert_gt(StageTable.budget(8, 5), StageTable.budget(8, 0), "连胜必须抬高敌方预算（追压力）")
	assert_eq(StageTable.budget(8, -3), StageTable.budget(8, 0), "连败不应降低敌方预算")


func test_unit_slots_track_population() -> void:
	for stage in range(1, StageTable.STAGE_COUNT + 1):
		var slots := StageTable.unit_slots(stage)
		var rs := RunState.new(1)
		rs.stage = stage
		assert_lte(slots, rs.population_cap() + 1,
			"第 %d 阶段敌方 %d 人不应远超玩家人口 %d" % [stage, slots, rs.population_cap()])
		assert_gte(slots, 3)


func test_boss_stages_exist_and_have_bosses() -> void:
	assert_eq(StageTable.BOSS_STAGES.size(), 3, "12/18 阶段里应有 3 个 Boss")
	for stage in StageTable.BOSS_STAGES:
		assert_true(StageTable.is_boss(stage))
		assert_lte(stage, StageTable.STAGE_COUNT, "Boss 阶段不能超过总阶段数")
		var enemy := StageTable.roll_enemy(SimRng.new(5), stage, 0)
		var has_boss := false
		for e in enemy:
			if EnemyTable.is_boss(str((e as Dictionary)["id"])):
				has_boss = true
		assert_true(has_boss, "第 %d 阶段必须真的带 Boss" % stage)


func test_roll_enemy_is_deterministic() -> void:
	var a := StageTable.roll_enemy(SimRng.new(123), 7, 2)
	var b := StageTable.roll_enemy(SimRng.new(123), 7, 2)
	assert_eq(a.size(), b.size())
	for i in range(a.size()):
		assert_eq(str((a[i] as Dictionary)["id"]), str((b[i] as Dictionary)["id"]))
		assert_eq((a[i] as Dictionary)["star"], (b[i] as Dictionary)["star"])


func test_roll_enemy_placement_is_legal() -> void:
	for stage in [1, 4, 9, StageTable.STAGE_COUNT]:
		var enemy := StageTable.roll_enemy(SimRng.new(31), stage, 1)
		assert_gt(enemy.size(), 0)
		var occ := {}
		for e in enemy:
			var d: Dictionary = e
			assert_true(Board.ENEMY_ROWS.has(d["cell"].y), "敌人只能落在敌方行")
			assert_false(occ.has(d["cell"]), "敌方不能重叠占位")
			occ[d["cell"]] = true


func test_roll_enemy_strength_scales() -> void:
	# 敌方总战力必须随阶段上升，否则后期没有压力
	var early := 0.0
	var late := 0.0
	for i in range(8):
		for e in StageTable.roll_enemy(SimRng.new(100 + i), 2, 0):
			early += EnemyTable.power(str((e as Dictionary)["id"]), int((e as Dictionary)["star"]))
		for e2 in StageTable.roll_enemy(SimRng.new(100 + i), StageTable.STAGE_COUNT, 0):
			late += EnemyTable.power(str((e2 as Dictionary)["id"]), int((e2 as Dictionary)["star"]))
	assert_gt(late, early * 2.0, "末期敌方总战力应显著高于前期（早期 %.0f / 末期 %.0f）" % [early, late])


func test_early_stage_has_no_elites() -> void:
	# 前期必须全是 1★，让玩家的「凑三升一」有一条追赶线
	for i in range(10):
		for e in StageTable.roll_enemy(SimRng.new(200 + i), 2, 0):
			assert_eq(int((e as Dictionary)["star"]), 1, "第 2 阶段不该出精英")


func test_stage_names_exist() -> void:
	for stage in range(1, StageTable.STAGE_COUNT + 1):
		assert_ne(StageTable.stage_name(stage), "", "第 %d 阶段缺名字" % stage)
	assert_eq(StageTable.stage_name(0), StageTable.stage_name(1), "越界阶段名夹到 1")
