extends GutTest

# 战斗结算：护甲、护盾、激光免疫、索敌


func test_armor_factor() -> void:
	assert_eq(Combat.armor_factor("kinetic", 0.5), 0.5, "动能吃全额护甲")
	assert_eq(Combat.armor_factor("explosive", 0.5), 0.75, "爆炸吃半额护甲")
	assert_eq(Combat.armor_factor("laser", 0.5), 1.0, "激光无视护甲")
	assert_eq(Combat.armor_factor("emp", 0.5), 1.0, "EMP 无视护甲")


func test_plain_damage_applies_armor() -> void:
	var e: Dictionary = {"hp": 100.0, "shield": 0.0, "armor": 0.5}
	Combat.apply_hit(e, 40.0, "kinetic")
	assert_eq(e["hp"], 80.0, "40 动能打 50% 护甲 → 掉 20")


func test_laser_ignores_armor_but_blocked_by_shield() -> void:
	var armored: Dictionary = {"hp": 100.0, "shield": 0.0, "armor": 0.5}
	Combat.apply_hit(armored, 40.0, "laser")
	assert_eq(armored["hp"], 60.0, "激光无视护甲 → 掉 40")
	var shielded: Dictionary = {"hp": 100.0, "shield": 50.0, "armor": 0.0}
	Combat.apply_hit(shielded, 40.0, "laser")
	assert_eq(shielded["hp"], 100.0, "有盾时激光完全无效")
	assert_eq(shielded["shield"], 50.0, "激光连盾都不掉")


func test_shield_absorbs_then_overflow() -> void:
	var e: Dictionary = {"hp": 100.0, "shield": 20.0, "armor": 0.0}
	Combat.apply_hit(e, 50.0, "kinetic")
	assert_eq(e["shield"], 0.0, "盾被打穿")
	assert_eq(e["hp"], 70.0, "溢出 30 打到血")


func test_emp_bonus_vs_shield() -> void:
	var e: Dictionary = {"hp": 100.0, "shield": 40.0, "armor": 0.0}
	Combat.apply_hit(e, 30.0, "emp")
	assert_eq(e["shield"], 0.0, "EMP 对盾 1.5 倍（45 > 40）打穿")
	assert_eq(e["hp"], 95.0, "溢出 5 打到血")


func test_pick_target_prefers_frontmost_in_range() -> void:
	var enemies: Array = [
		{"alive": true, "x": 1.0, "y": 0.0, "dist": 5.0},
		{"alive": true, "x": 0.5, "y": 0.0, "dist": 1.0},
		{"alive": true, "x": 20.0, "y": 0.0, "dist": 99.0},  # 射程外
		{"alive": false, "x": 0.6, "y": 0.0, "dist": 50.0},  # 已死
	]
	assert_eq(Combat.pick_target(enemies, 0.0, 0.0, 3.0), 0, "射程内最靠前者")
	assert_eq(Combat.pick_target(enemies, 0.0, 0.0, 0.4), -1, "射程内无目标")


func test_wave_power_is_monotonic() -> void:
	var prev: float = -1.0
	for w in range(1, Waves.TOTAL + 1):
		var p: float = Waves.wave_power(w)
		assert_gt(p, prev, "第 %d 波强度应高于前一波" % w)
		prev = p


func test_spawn_plan_sorted_and_nonempty() -> void:
	for w in range(1, Waves.TOTAL + 1):
		var plan: Array = Waves.spawn_plan(w)
		assert_gt(plan.size(), 0, "第 %d 波有敌人" % w)
		# 时间升序
		for i in range(1, plan.size()):
			var a: Dictionary = plan[i - 1] as Dictionary
			var b: Dictionary = plan[i] as Dictionary
			assert_lte(float(a["t"]), float(b["t"]), "第 %d 波生成计划按时间升序" % w)
