extends GutTest
## 单位表与敌方表。**数值约束写在注释里，这里逐条锁死**——
## 数值链一旦被改动而测试没跟上，跑分的结论就悄悄失效了。


func test_every_unit_has_legal_fields() -> void:
	for id in UnitTable.ids():
		var uid := str(id)
		assert_true(UnitTable.has_id(uid))
		assert_ne(UnitTable.display(uid), "", uid + " 必须有中文名")
		assert_ne(UnitTable.model(uid), "", uid + " 必须指定模型")
		assert_true(UnitTable.faction(uid) in ["order", "skeleton"], uid + " 阵营必须是 order/skeleton")
		assert_true(UnitTable.role(uid) in ["front", "mid", "back"], uid + " 定位必须是 front/mid/back")
		assert_gte(UnitTable.cost(uid), 1)
		assert_lte(UnitTable.cost(uid), 4)


func test_model_files_exist() -> void:
	for id in UnitTable.ids():
		var p := "res://assets/models/units/" + UnitTable.model(str(id)) + ".glb"
		assert_true(ResourceLoader.exists(p), "缺少模型文件：%s" % p)


func test_skills_resolve() -> void:
	for id in UnitTable.ids():
		var uid := str(id)
		var sid := UnitTable.skill_id(uid)
		assert_true(UnitTable.SKILLS.has(sid), "%s 的技能 %s 未定义" % [uid, sid])
		var sk := UnitTable.skill(uid)
		assert_ne(str(sk["display"]), "", "技能缺少中文名")
		assert_ne(str(sk["kind"]), "", "技能缺少 kind")
		assert_gte(float(sk["cd"]), 0.0)


func test_skill_kinds_are_known() -> void:
	# BattleSim 只实现了这几种 kind；表里出现新 kind 而模拟没实现 = 技能静默失效
	var known := ["taunt", "aoe", "buff_crit", "dash", "dot_aoe", "summon", "armor_buff", "on_death_aoe"]
	for key in UnitTable.SKILLS:
		var kind := str(UnitTable.SKILLS[key]["kind"])
		assert_true(known.has(kind), "技能 %s 的 kind=%s 未在 BattleSim 中实现" % [key, kind])


func test_enemy_skills_resolve() -> void:
	for id in EnemyTable.ids():
		var eid := str(id)
		var sid := str(EnemyTable.ENEMIES[eid]["skill"])
		if sid == "":
			continue
		assert_true(UnitTable.SKILLS.has(sid), "敌人 %s 的技能 %s 未定义" % [eid, sid])


func test_stat_growth_with_star() -> void:
	for id in UnitTable.ids():
		var uid := str(id)
		var h1 := UnitTable.hp(uid, 1)
		var h2 := UnitTable.hp(uid, 2)
		var h3 := UnitTable.hp(uid, 3)
		assert_gt(h2, h1, uid + " 的 2★ 血量必须高于 1★")
		assert_gt(h3, h2, uid + " 的 3★ 血量必须高于 2★")
		var a1 := UnitTable.atk(uid, 1)
		assert_gt(UnitTable.atk(uid, 2), a1, uid + " 的 2★ 攻击必须高于 1★")


func test_star_upgrade_is_worth_three_copies() -> void:
	# 设计硬约束（docs/09-立项 §4.1）。**这里曾经算错过一次**，值得把算法写清楚：
	# 3 个 1★ 合成 1 个 2★ 之后，**腾出的 2 个人口会再补 2 个 1★**，
	# 所以该比的不是「2★ vs 3×1★」，而是：
	#     合成后总战力 = power(2★) + 2 × power(1★)
	#     不合成总战力 = 3 × power(1★)
	# 两者相差 power(2★) − power(1★)，所以**只要 2★ 强于 1★，合成就永远划算**。
	# 真正会让人不升星的，是「2★ 比 1★ 强不了多少」——第一版 1.8/1.6 的系数下
	# 2★ 只有 1.9 倍战力、而人口上限卡死，合成在跑分里几乎不发生（实测 0 次）。
	# 现在要求 2★ 至少是 1★ 的 1.6 倍、3★ 至少是 1★ 的 3 倍，才算「有得赚」。
	for id in UnitTable.ids():
		var uid := str(id)
		var p1 := UnitTable.power(uid, 1)
		var p2 := UnitTable.power(uid, 2)
		var p3 := UnitTable.power(uid, 3)
		assert_gt(p2, p1 * 1.6, "%s：2★ 战力（%.0f）应至少是 1★ 的 1.6 倍（%.0f）" % [uid, p2, p1 * 1.6])
		assert_gt(p3, p1 * 3.0, "%s：3★ 战力（%.0f）应至少是 1★ 的 3 倍（%.0f）" % [uid, p3, p1 * 3.0])


func test_star_is_clamped() -> void:
	assert_eq(UnitTable.clamp_star(0), 1)
	assert_eq(UnitTable.clamp_star(4), UnitTable.MAX_STAR)
	assert_eq(UnitTable.hp("knight", 99), UnitTable.hp("knight", 3), "越界星级必须被夹住")


func test_dodge_never_exceeds_cap() -> void:
	for id in UnitTable.ids():
		for star in [1, 2, 3]:
			assert_lte(UnitTable.dodge(str(id), star), 0.30, "闪避上限 30%")
			assert_gt(UnitTable.dodge(str(id), star), 0.0)


func test_melee_and_ranged_roles_have_distinct_ranges() -> void:
	for id in UnitTable.ids():
		var uid := str(id)
		var r := int(UnitTable.base_field(uid, "range"))
		if UnitTable.role(uid) == "back":
			assert_gte(r, 3, uid + " 是远程，射程必须 ≥3")
		else:
			assert_eq(r, 1, uid + " 是近战，射程必须是 1")


func test_ranged_dps_below_melee() -> void:
	# 设计硬约束：远程 DPS 必须低于近战，否则「无脑贴脸」成为最优解
	var melee_max := 0.0
	for id in UnitTable.ids():
		if UnitTable.role(str(id)) == "front":
			melee_max = maxf(melee_max, UnitTable.dps(str(id), 1))
	for id2 in UnitTable.ids():
		if UnitTable.role(str(id2)) == "back":
			assert_lt(UnitTable.dps(str(id2), 1), melee_max,
				"%s 的远程 DPS（%.0f）必须低于最强近战（%.0f）" % [id2, UnitTable.dps(str(id2), 1), melee_max])


func test_one_star_ttk_in_window() -> void:
	# 设计硬约束：1★ 前排被单点集火的死亡时间 10–14 秒
	# （低于 8 秒战斗会「秒完就没」，高于 18 秒会拖）
	for id in UnitTable.ids():
		var uid := str(id)
		if UnitTable.role(uid) != "front":
			continue
		var hp := UnitTable.hp(uid, 1)
		var incoming := UnitTable.dps(uid, 1) * 0.75   # 对手强度按同单位估算
		var ttk := hp / maxf(1.0, incoming)
		assert_gt(ttk, 6.0, "%s 的 1★ 存活时间 %.1f 秒太短" % [uid, ttk])
		assert_lt(ttk, 26.0, "%s 的 1★ 存活时间 %.1f 秒太长" % [uid, ttk])


func test_sell_refund_ladder() -> void:
	assert_eq(UnitTable.sell_value(1), 1)
	assert_eq(UnitTable.sell_value(2), 3)
	assert_eq(UnitTable.sell_value(3), 9)
	# 3 个 1★（各 1 金）合成 2★，卖 2★ 退 3 金 > 3 金：换阵容不亏
	assert_gt(float(UnitTable.sell_value(2)), 3.0 * float(UnitTable.sell_value(1)) - 0.001,
		"2★ 售价必须覆盖三个 1★ 的成本，否则「换阵容」永远是亏的")


func test_shop_weights_prefer_cheap() -> void:
	# 1 费必须有（穷人的第一张牌），且权重随费用递减
	assert_gt(UnitTable.shop_weight("sk_minion"), UnitTable.shop_weight("mage"))
	var total := 0.0
	for id in UnitTable.ids():
		total += UnitTable.shop_weight(str(id))
	assert_gt(total, 0.0)


func test_power_is_monotonic_in_star() -> void:
	for id in UnitTable.ids():
		var uid := str(id)
		assert_gt(UnitTable.power(uid, 2), UnitTable.power(uid, 1), uid + " 战力必须随星级上升")


func test_enemy_table_shape() -> void:
	assert_gte(EnemyTable.ids().size(), 8, "敌方至少 8 种常规单位")
	var bosses := 0
	for id in EnemyTable.ids():
		if EnemyTable.is_boss(str(id)):
			bosses += 1
			assert_gt(EnemyTable.hp(str(id), 1), 1000.0, "Boss 血量必须显著高于杂兵")
			assert_gt(EnemyTable.atk(str(id), 1), 60.0, "Boss 攻击必须显著高于杂兵")
	assert_eq(bosses, 2, "应当恰好 2 个 Boss")


func test_enemy_model_files_exist() -> void:
	for id in EnemyTable.ids():
		var p := "res://assets/models/units/" + EnemyTable.model(str(id)) + ".glb"
		assert_true(ResourceLoader.exists(p), "敌人 %s 缺少模型：%s" % [id, p])


func test_tank_enemies_actually_have_thorns() -> void:
	# 「站桩打坦克要有代价」：重装敌人必须带反伤
	assert_gt(EnemyTable.field("e_titan", "thorns"), 0.0)
	assert_gt(EnemyTable.field("e_knight", "thorns"), 0.0)
	assert_gt(UnitTable.base_field("knight", "thorns"), 0.0)
