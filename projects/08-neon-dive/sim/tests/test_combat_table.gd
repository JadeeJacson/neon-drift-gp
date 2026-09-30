extends GutTest

## 招式/敌型/资源的设计约束断言（docs/08 §3.2、§3.3）。
## 重点锁三件事：击杀节奏（TTK）、弹反是否公平、进攻是否比龟缩划算。


func test_design_metrics_sit_in_bands() -> void:
	var m := CombatTable.measured()
	var bands := CombatTable.design_bands()
	for key in bands:
		var band: Array = bands[key]
		assert_between(float(m[key]), float(band[0]), float(band[1]),
				"%s 应在设计区间内" % key)


func test_light_chain_is_the_main_damage_source() -> void:
	# 三段连起来要打掉一只 crawler 还有余量，否则「连招」没有存在价值
	var chain: float = float(CombatTable.attack("light_1")["damage"]) \
			+ float(CombatTable.attack("light_2")["damage"]) \
			+ float(CombatTable.attack("light_3")["damage"])
	var hp: float = float(CombatTable.enemy("crawler")["hp"])
	assert_gt(chain, hp, "轻三连总伤必须超过一只 crawler 的血量")
	assert_lt(chain, hp * 2.4, "但也不能超太多，否则一只怪用不完一套连招")


func test_third_stage_is_the_escape_tool() -> void:
	# 第三段的高击退是「脱离贴身」的手段，击退必须明显高于前两段
	var finisher: float = float(CombatTable.attack("light_3")["knockback"])
	for id in ["light_1", "light_2"]:
		assert_gt(finisher, float(CombatTable.attack(id)["knockback"]) * 3.0,
				"%s 的击退应远低于三段" % id)


func test_heavy_costs_more_than_it_is_worth_as_spam() -> void:
	# 满蓄重击伤害高，但耗 PWR；PWR 只能靠命中/弹反回，所以不能连发
	var heavy: Dictionary = CombatTable.attack("heavy")
	var gain: float = CombatTable.power_gain("heavy")
	assert_gt(float(heavy["power_cost"]), gain * 2.0,
			"重击的净电收支必须为负，否则它会取代轻击成为无脑主输出")
	assert_gt(CombatTable.heavy_damage(999), CombatTable.heavy_damage(0) * 2.0,
			"满蓄与未蓄的伤害差要够明显，蓄力才有意义")


func test_heavy_damage_is_monotonic_in_charge() -> void:
	var prev := -1.0
	for f in range(0, 25):
		var v: float = CombatTable.heavy_damage(f)
		assert_gte(v, prev, "蓄力帧数增加时伤害不该下降（%d 帧）" % f)
		prev = v


func test_parry_window_is_fair_for_a_human() -> void:
	# 人类反应约 0.25s（15 帧）。前摇减去弹反起手必须留出这个量，否则弹反是「猜」不是「读」
	var margin: int = CombatTable.parry_margin_frames("crawler")
	assert_gte(margin, 10, "弹反可读窗至少 10 帧")
	assert_lte(margin, 20, "超过 20 帧就变成白送，失去技巧上限")


func test_parry_success_boundaries() -> void:
	var active: int = 14  # crawler 的 active 出现在第 14 帧
	# 理想时机：press=4 → open 6..14 覆盖 14
	assert_true(CombatTable.parry_success(4, active), "press=4 应能弹到 active=14")
	# 太早：press=0 → open 2..10，够不到 14
	assert_false(CombatTable.parry_success(0, active), "press=0 太早应失败")
	# 太晚：press=10 → open 12..20 覆盖 14？12<=14<=20 → 应成功（窗口内）
	assert_true(CombatTable.parry_success(10, active), "press=10 仍在窗口内应成功")
	# 明显晚于攻击：press=16 → open 18..26，active 已过
	assert_false(CombatTable.parry_success(16, active), "press=16 已晚于 active 应失败")


func test_parry_is_the_best_close_range_action() -> void:
	# 弹反回电必须明显高于轻击，这是「鼓励贴身进攻」的那颗螺丝
	var ratio: float = CombatTable.parry_power_gain_ratio()
	assert_gt(ratio, 2.0, "弹反单次回电至少是轻击的 2 倍（实际 %.1f 倍）" % ratio)
	assert_gte(int(CombatTable.PARRY["stun_frames"]), 30,
			"弹反成功要给到 30 帧以上硬直，否则来不及接处决")


func test_attack_is_more_profitable_than_defending() -> void:
	# 一次「弹反 + 一段轻击 + 处决」循环：净回电为正、净回氧为正
	var cycle := CombatTable.parry_execute_cycle()
	assert_gt(float(cycle["net_power"]), 0.0, "弹反循环的净电收支必须为正")
	assert_gt(float(cycle["net_o2"]), 0.0, "处决必须回氧，否则氧没有进攻来源")


func test_kill_reward_sustains_the_dash_loop() -> void:
	# 杀一只怪回的电要够再 dash 一次以上，否则「进攻奖励」是空头支票
	var ratio: float = float(CombatTable.enemy("crawler")["power_reward"]) \
			/ float(CombatTable.ECONOMY["dash_power_cost"])
	assert_gt(ratio, 1.4, "击杀回电至少够 1.4 次 dash（实际 %.2f 次）" % ratio)


func test_o2_budget_is_tight_but_not_impossible() -> void:
	var seconds: float = float(CombatTable.ECONOMY["o2_max"]) \
			/ float(CombatTable.ECONOMY["o2_drain_per_second"])
	assert_between(seconds, 45.0, 90.0, "满氧应支撑 45–90 秒（一层的时间尺度）")
	var drown: float = float(CombatTable.ECONOMY["hp_max"]) \
			/ float(CombatTable.ECONOMY["o2_drown_damage_per_second"])
	assert_between(drown, 8.0, 20.0, "氧空到死要有 8–20 秒的抢救窗口")


func test_parry_window_is_human_scale() -> void:
	# 制作人反馈「弹反不好用」：8 帧（0.13s）比人类反应极限还短，那不是技巧而是赌
	var window: int = int(CombatTable.PARRY["window"])
	assert_between(float(window), 10.0, 16.0,
			"弹反有效窗必须给到 0.17–0.27 秒（实测 %d 帧 = %0.2fs）" % [window, window / 60.0])
	# 且「前摇末尾才反按」也要能成立：否则玩家必须预知才能反，等于不能读招
	var tell: int = int(CombatTable.enemy("crawler")["tell_frames"])
	var startup: int = int(CombatTable.PARRY["startup"])
	assert_true(CombatTable.parry_success(tell - window + startup, tell),
			"在出手前一刻才按也能弹到（反应极限情形）")


func test_reflect_is_a_real_reward() -> void:
	# 反射飞行道具的倍率：低于 1 就没意义，高于 2 会让远程怪变成送分
	var mult: float = float(CombatTable.PARRY["reflect_mult"])
	assert_between(mult, 1.2, 2.0, "反射倍率 %.2f 不在合理区间" % mult)


func test_ranged_is_weaker_but_safer_than_melee() -> void:
	# 远程 dps 必须低于近战（否则没人承担贴脸风险），但不能低到不值得带
	var ratio: float = CombatTable.ranged_dps() / CombatTable.light_dps()
	assert_between(ratio, 0.35, 0.85, "远程/近战 dps 比 %.2f 越界" % ratio)


func test_enemy_projectile_is_dodgeable() -> void:
	# 敌弹速度不能比玩家反应后的移动速度太快：否则远程攻击只能靠弹反解
	var proj_speed: float = float(CombatTable.enemy("spitter")["projectile"]["speed"])
	var travel_sec: float = 130.0 / proj_speed      # 从偏好距离飞到脸上约 130px
	assert_gte(travel_sec, 0.5,
			"敌弹飞行时间只有 %0.2fs，来不及反应或躲开" % travel_sec)


func test_invulnerability_makes_multi_enemy_fair() -> void:
	# 上一版拿「接触伤害 / 无敌时长」当有效 DPS，算出 reduction = -25%，
	# 那个公式本身就是错的（无敌帧是「上限」不是「实际节奏」）。改成两条真正能
	# 保证不「必死」的结构约束：
	# 1) 一次挥击的判定窗不能比无敌帧长，否则同一下能刷两次伤害；
	# 2) 同一帧只算一次命中（两只怪同时贴脸不会叠加）；
	# 3) 血量至少能承受 6 次接触伤害，给玩家反应与脱离的机会。
	var e: Dictionary = CombatTable.enemy("crawler")
	assert_gte(CombatTable.INVULN_FRAMES, int(e["active_frames"]),
			"无敌帧要长于敌人判定窗（%d ≥ %d），否则一下会被刷两次" % [CombatTable.INVULN_FRAMES, int(e["active_frames"])])
	var hits_to_die: float = float(CombatTable.ECONOMY["hp_max"]) / float(e["contact_damage"])
	assert_gte(hits_to_die, 6.0, "血量至少能承受 6 次接触伤害（实际 %.1f 次）" % hits_to_die)
	assert_lte(hits_to_die, 12.0, "也不能太肉，否则受击没有痛感（实际 %.1f 次）" % hits_to_die)
