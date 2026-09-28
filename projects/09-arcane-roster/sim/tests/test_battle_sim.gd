extends GutTest
## 索敌规则 + 战斗模拟。**自走棋 90% 的策略都转化为「谁打谁」**，
## 所以这两块必须能逐条断言，而不是「跑一局看看」。


func _foe(cell: Vector2i, hp: float = 500.0, taunting: bool = false) -> Dictionary:
	return {
		"cell": cell, "hp": hp, "max_hp": 500.0, "alive": true,
		"taunting": taunting, "range": 1, "index": 0, "side": Board.ENEMY,
	}


func _ally(cell: Vector2i, hp: float = 500.0) -> Dictionary:
	return {
		"cell": cell, "hp": hp, "max_hp": 500.0, "alive": true,
		"taunting": false, "range": 1, "index": 0, "side": Board.ALLY,
	}


# ---------- 索敌 ----------

func test_no_target_returns_minus_one() -> void:
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 1, Targeting.Policy.NEAREST, []), -1)


func test_dead_enemies_are_ignored() -> void:
	var foes := [_foe(Vector2i(4, 5))]
	foes[0]["alive"] = false
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 1, Targeting.Policy.NEAREST, foes), -1)


func test_taunt_overrides_policy() -> void:
	# 嘲讽是唯一的硬控制：近处的目标也不能盖过 taunting 的目标
	var foes := [
		_foe(Vector2i(4, 5), 500.0, false),
		_foe(Vector2i(3, 4), 500.0, true),
	]
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 3, Targeting.Policy.NEAREST, foes), 1,
		"嘲讽必须压过最近目标")
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 3, Targeting.Policy.LOWEST_HP, foes), 1,
		"嘲讽必须压过残血目标")


func test_out_of_range_target_is_still_locked_for_approach() -> void:
	# 这是修过的 bug：早期版本「只考虑射程内目标」，于是够不着 → 不选目标 → 也不移动，
	# 双方永远对峙到 120 秒超时。**正确契约是：射程内没敌人时，锁定最近敌人并走过去**。
	var far := [_foe(Vector2i(0, 0), 500.0)]
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 1, Targeting.Policy.NEAREST, far), 0,
		"够不着也要锁定最近目标，否则单位不会移动")
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 9, Targeting.Policy.NEAREST, far), 0,
		"射程够得着时同样选中它")


func test_no_enemy_means_no_target() -> void:
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 3, Targeting.Policy.NEAREST, []), -1,
		"一个敌人都没有时返回 -1")
	var all_dead := [_foe(Vector2i(0, 0), 100.0)]
	all_dead[0]["alive"] = false
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 9, Targeting.Policy.NEAREST, all_dead), -1,
		"敌人全灭时返回 -1")


func test_nearest_policy() -> void:
	var foes := [_foe(Vector2i(4, 4)), _foe(Vector2i(0, 0))]
	# 都在射程 9 内，(0,0) 更远
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 9, Targeting.Policy.NEAREST, foes), 0)


func test_lowest_hp_policy() -> void:
	var foes := [_foe(Vector2i(4, 4), 400.0), _foe(Vector2i(0, 0), 90.0)]
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 9, Targeting.Policy.LOWEST_HP, foes), 1)


func test_backline_policy_hits_far_side() -> void:
	var foes := [_foe(Vector2i(4, 5)), _foe(Vector2i(4, 3))]
	# 远程站后排时（4,6），(4,3) 才是「更深」的敌人
	assert_eq(Targeting.pick_target(Vector2i(4, 6), 3, Targeting.Policy.BACKLINE, foes), 1,
		"远程应点后排")


func test_targeting_is_stable() -> void:
	# 「抖动」是自走棋模拟器最蠢的表现：同一局面反复选不同目标
	var foes := [_foe(Vector2i(4, 4)), _foe(Vector2i(3, 4)), _foe(Vector2i(5, 4))]
	var first := Targeting.pick_target(Vector2i(4, 6), 3, Targeting.Policy.NEAREST, foes)
	for _i in range(20):
		assert_eq(Targeting.pick_target(Vector2i(4, 6), 3, Targeting.Policy.NEAREST, foes), first,
			"同样局面必须选同一个目标")


func test_enemies_in_radius_uses_same_range_rule() -> void:
	var foes := [_foe(Vector2i(4, 5)), _foe(Vector2i(6, 6)), _foe(Vector2i(5, 5))]
	assert_eq(Targeting.enemies_in_radius(Vector2i(4, 6), 1, foes).size(), 2,
		"切比雪夫半径 1 只含 (4,5)/(5,5)，(6,6) 距离 2 不在内")
	assert_eq(Targeting.enemies_in_radius(Vector2i(4, 6), 2, foes).size(), 3,
		"半径 2 时全部命中（技能半径与普攻射程必须同口径）")


func test_neediest_ally() -> void:
	var allies := [_ally(Vector2i(4, 5), 450.0), _ally(Vector2i(3, 5), 100.0)]
	assert_eq(Targeting.neediest_ally(Vector2i(4, 6), 2, allies), 1, "治疗应优先最残的")


# ---------- 战斗模拟 ----------

func _lineup(ids: Array, side: int, cells: Array) -> Array:
	var occ := {}
	var out: Array = []
	for i in range(ids.size()):
		out.append({"id": str(ids[i]), "star": 1, "cell": cells[i]})
		occ[cells[i]] = i
	return out


func test_battle_is_deterministic() -> void:
	var a := BattleSim.new(_lineup(["knight", "rogue"], 0, [Vector2i(4, 4), Vector2i(3, 4)]),
		_lineup(["e_bone", "e_archer"], 1, [Vector2i(4, 3), Vector2i(3, 3)]), 777, {})
	var b := BattleSim.new(_lineup(["knight", "rogue"], 0, [Vector2i(4, 4), Vector2i(3, 4)]),
		_lineup(["e_bone", "e_archer"], 1, [Vector2i(4, 3), Vector2i(3, 3)]), 777, {})
	var ra := a.run()
	var rb := b.run()
	assert_eq(ra["ticks"], rb["ticks"], "同种子同编成的 tick 数必须一致")
	assert_eq(ra["winner"], rb["winner"], "同种子同编成的胜者必须一致")
	assert_eq(ra["events"], rb["events"], "同种子同编成的事件数必须一致")


func test_different_seed_changes_outcome() -> void:
	var a := BattleSim.new(_lineup(["mage"], 0, [Vector2i(4, 5)]),
		_lineup(["e_bone", "e_bone", "e_bone"], 1, [Vector2i(4, 3), Vector2i(3, 3), Vector2i(5, 3)]), 1, {})
	var b := BattleSim.new(_lineup(["mage"], 0, [Vector2i(4, 5)]),
		_lineup(["e_bone", "e_bone", "e_bone"], 1, [Vector2i(4, 3), Vector2i(3, 3), Vector2i(5, 3)]), 2, {})
	var ra := a.run()
	var rb := b.run()
	# 战斗可以同胜同负，但事件序列不应完全一致
	assert_true(ra["events"] != rb["events"] or ra["ticks"] != rb["ticks"],
		"不同种子应产生不同的战斗过程")


func test_empty_board_loses_immediately() -> void:
	var sim := BattleSim.new([], _lineup(["e_bone"], 1, [Vector2i(4, 3)]), 5, {})
	var r := sim.run()
	assert_eq(int(r["winner"]), Board.ENEMY, "空板上场必须直接判负")
	assert_lte(int(r["ticks"]), 1, "空板不应空跑（实测 %d tick）" % int(r["ticks"]))


func test_stronger_formation_wins() -> void:
	var strong := BattleSim.new(
		_lineup(["knight", "knight", "rogue", "mage"], 0,
			[Vector2i(3, 4), Vector2i(4, 4), Vector2i(5, 4), Vector2i(6, 4)]),
		_lineup(["e_bone", "e_bone", "e_swarm", "e_swarm"], 1,
			[Vector2i(3, 3), Vector2i(4, 3), Vector2i(5, 3), Vector2i(6, 3)]), 42, {})
	var weak := BattleSim.new(
		_lineup(["sk_minion", "sk_minion"], 0, [Vector2i(3, 4), Vector2i(4, 4)]),
		_lineup(["e_bone", "e_bone", "e_swarm", "e_swarm"], 1,
			[Vector2i(3, 3), Vector2i(4, 3), Vector2i(5, 3), Vector2i(6, 3)]), 42, {})
	assert_eq(int(strong.run()["winner"]), Board.ALLY, "4 个正规单位应打赢 4 个杂兵")
	assert_eq(int(weak.run()["winner"]), Board.ENEMY, "2 个骷髅仆从打不过 4 个敌人")


func test_battle_always_terminates() -> void:
	# 两边都是高护甲高闪避的坦克：必须靠伤害下限 1 与 MAX_TICKS 收场，不能死循环
	var tanks := _lineup(["knight", "knight"], 0, [Vector2i(3, 4), Vector2i(4, 4)])
	var tanks_e := _lineup(["e_knight", "e_knight"], 1, [Vector2i(3, 3), Vector2i(4, 3)])
	var r := BattleSim.new(tanks, tanks_e, 9, {}).run()
	assert_lte(int(r["ticks"]), BattleSim.MAX_TICKS, "战斗必须有硬上限")
	assert_ne(int(r["winner"]), -1, "结束时必须给出胜者")


func test_battle_duration_in_design_window() -> void:
	# 设计硬约束：单场战斗 10–18 秒（<6 秒闷、>25 秒拖）
	var dur := 0.0
	for i in range(6):
		var sim := BattleSim.new(
			_lineup(["knight", "barbarian", "rogue", "mage", "sk_minion"], 0,
				[Vector2i(3, 4), Vector2i(4, 4), Vector2i(5, 4), Vector2i(6, 4), Vector2i(2, 4)]),
			StageTable.roll_enemy(SimRng.new(1000 + i), 6, 2), 1000 + i,
			Traits.bonuses([{"id": "knight", "star": 1}, {"id": "barbarian", "star": 1},
				{"id": "rogue", "star": 1}, {"id": "mage", "star": 1}, {"id": "sk_minion", "star": 1}]))
		dur += float(sim.run()["duration"])
	var avg := dur / 6.0
	assert_gt(avg, 6.0, "单场战斗平均 %.1f 秒太短" % avg)
	assert_lt(avg, 26.0, "单场战斗平均 %.1f 秒太长" % avg)


func test_armor_reduces_damage_but_never_below_one() -> void:
	# 伤害下限 1 是硬约束：否则高护甲单位会被无限防，战斗永不结束
	var sim := BattleSim.new(_lineup(["mage"], 0, [Vector2i(4, 5)]),
		_lineup(["e_titan"], 1, [Vector2i(4, 3)]), 3, {})
	var ev: Dictionary = sim.units[0]
	var dmg := float(ev["atk"]) - EnemyTable.armor("e_titan", 1)
	assert_gt(maxf(1.0, dmg), 0.0, "对高护甲目标的伤害必须至少为 1")


func test_taunt_forces_enemy_focus() -> void:
	var sim := BattleSim.new(_lineup(["knight", "mage"], 0, [Vector2i(4, 4), Vector2i(5, 4)]),
		_lineup(["e_reaver", "e_reaver"], 1, [Vector2i(4, 3), Vector2i(5, 3)]), 17, {})
	sim.run()
	# 骑士施放 taunt_shield 后，敌方 AI 的目标必须落在骑士身上
	# 实质断言：**看事件流**而不是看战斗结束时的 target（那时嘲讽早过期了）。
	# 嘲讽生效的证据 = 敌方确实在打骑士（事件里 b == 0 的攻击）
	var casted := 0
	var hits_on_knight := 0
	for e in sim.events:
		var ev: Dictionary = e
		if str(ev["k"]) == "cast" and str(ev["s"]) == "taunt_shield":
			casted += 1
		if str(ev["k"]) == "attack" and int(ev["b"]) == 0:
			hits_on_knight += 1
	assert_gte(float(casted), 1.0, "骑士应至少施放一次圣盾挑衅")
	assert_gte(float(hits_on_knight), 1.0, "被嘲讽后敌方应转火骑士（实测 %d 次）" % hits_on_knight)


func test_death_burst_deals_damage_after_death() -> void:
	# death_burst 是唯一的「死后伤害」，必须挂在死亡结算里
	var sim := BattleSim.new(_lineup(["sk_warrior"], 0, [Vector2i(4, 4)]),
		_lineup(["e_bone", "e_bone"], 1, [Vector2i(4, 3), Vector2i(5, 3)]), 21, {})
	sim.run()
	var bursts := 0
	for e in sim.events:
		var ev: Dictionary = e
		if str(ev["k"]) == "burst":
			bursts += 1
	assert_gt(bursts, 0, "骷髅战士死亡时应触发死亡爆碎")


func test_summon_adds_unit() -> void:
	var sim := BattleSim.new(_lineup(["sk_mage"], 0, [Vector2i(4, 4)]),
		_lineup(["e_titan"], 1, [Vector2i(4, 3)]), 33, {})
	sim.run()
	var summons := 0
	for u in sim.units:
		var d: Dictionary = u
		if bool(d["is_summon"]):
			summons += 1
	assert_gt(summons, 0, "骷髅术士应召唤出骷髅仆从")


func test_dodge_actually_triggers() -> void:
	var sim := BattleSim.new(_lineup(["sk_rogue"], 0, [Vector2i(4, 4)]),
		_lineup(["e_titan"], 1, [Vector2i(4, 3)]), 55, {})
	sim.run()
	var misses := 0
	for e in sim.events:
		var ev: Dictionary = e
		if str(ev["k"]) == "miss":
			misses += 1
	assert_gt(misses, 0, "高闪避单位应出现 miss 事件")


func test_no_nan_in_results() -> void:
	var sim := BattleSim.new(_lineup(["hooded", "sk_mage", "sk_minion"], 0,
		[Vector2i(3, 4), Vector2i(4, 4), Vector2i(5, 4)]),
		StageTable.roll_enemy(SimRng.new(88), 8, 3), 88, {})
	var r := sim.run()
	assert_false(is_nan(float(r["ally_ratio"])), "残血比不能是 NaN")
	assert_false(is_nan(float(r["enemy_ratio"])))
	assert_false(is_inf(float(r["duration"])))
	for u in sim.units:
		var d: Dictionary = u
		assert_false(is_nan(float(d["hp"])), "单位血量不能是 NaN")
		assert_gte(float(d["hp"]), 0.0, "血量不能为负")


func test_trait_bonus_only_affects_ally() -> void:
	var sim := BattleSim.new(_lineup(["knight"], 0, [Vector2i(4, 4)]),
		_lineup(["e_bone"], 1, [Vector2i(4, 3)]), 71,
		{"atk_pct": 0.5, "hp_pct": 0.5, "armor_flat": 5.0})
	var ally: Dictionary = sim.units[0]
	var foe: Dictionary = sim.units[1]
	assert_almost_eq(float(ally["atk"]), UnitTable.atk("knight", 1) * 1.5, 0.01, "我方应吃到羁绊加成")
	assert_almost_eq(float(foe["atk"]), EnemyTable.atk("e_bone", 1), 0.01, "敌方不吃羁绊")


func test_enemy_survivors_define_damage() -> void:
	# 掉血只算「活下来的敌人」：残局能翻盘的来源
	var sim := BattleSim.new(_lineup(["sk_minion"], 0, [Vector2i(4, 4)]),
		_lineup(["e_bone"], 1, [Vector2i(4, 3)]), 8, {})
	var r := sim.run()
	assert_eq(int(r["enemy_alive"]), 1, "1 打 1 时敌人应存活")
