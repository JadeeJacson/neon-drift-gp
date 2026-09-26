extends GutTest

## 难度曲线的区间断言（docs/00 §4.3 的执行体）。
## 断言的是**分布**而不是单局结果——Godot 物理不确定，逐帧复现已作废，
## 但这一层全在 sim 里，所以同种子必然同结果，区间可以放心写死。

const RUNS := 16

const TURTLE := {
	"aggression": 0.15, "head_rate": 0.10,
	"execution_rate": 0.0, "movement_efficiency": 0.20,
}
const AVERAGE := {}
const SKILLED := {
	"aggression": 0.80, "head_rate": 0.45,
	"execution_rate": 0.70, "movement_efficiency": 0.85,
}


func test_duration_band_for_all_profiles() -> void:
	for pair in [[&"龟缩", TURTLE], [&"普通", AVERAGE], [&"高手", SKILLED]]:
		var s := MatchSim.sweep(pair[1], RUNS)
		var label := String(pair[0])
		assert_gte(float(s.minutes_med), 10.0, "%s 中位时长 %.1f 分，短于设计下限" % [label, s.minutes_med])
		assert_lte(float(s.minutes_max), 15.0, "%s 最长 %.1f 分，超出设计上限" % [label, s.minutes_max])


## 核心设计主张：进攻与机动必须有回报，龟缩必须亏。
func test_aggression_and_movement_are_rewarded() -> void:
	var turtle := MatchSim.sweep(TURTLE, RUNS)
	var average := MatchSim.sweep(AVERAGE, RUNS)
	var skilled := MatchSim.sweep(SKILLED, RUNS)
	assert_lt(float(turtle.clear_rate), 0.25,
		"龟缩流通关率 %.0f%%，说明躲着打也能过，资源循环白设计了" % (float(turtle.clear_rate) * 100))
	assert_gt(float(skilled.clear_rate), float(average.clear_rate), "高手通关率必须高于普通")
	assert_gt(float(average.damage_med), float(skilled.damage_med), "整压打法受到的总伤害必须更低")
	assert_gt(float(skilled.sufficiency_med), float(turtle.sufficiency_med),
		"贴脸+处决的回弹率必须高于龟缩，否则 §2.2 的循环不成立")


## 普通画像要「险胜」而不是碾压：终局中位余量必须为正但紧张。
func test_average_profile_is_a_close_fight() -> void:
	var s := MatchSim.sweep(AVERAGE, RUNS)
	assert_gte(float(s.clear_rate), 0.60,
		"普通画像通关率只有 %.0f%%，门槛偏高会让「完整可玩」变劝退" % (float(s.clear_rate) * 100))
	var one := MatchSim.play(AVERAGE)
	assert_gt(float(one.hp_left), 0.0, "标准种子下普通画像必须能活")
	assert_lte(float(one.hp_left), 45.0,
		"普通画像终局剩 %.0f HP，余量过大说明没有压迫感" % one.hp_left)


## 弹药系统在场景层同样不能自给自足（与 test_combat_loop 的同名红线一致）。
func test_match_cannot_self_supply_ammo() -> void:
	for pair in [[&"普通", AVERAGE], [&"高手", SKILLED]]:
		var s := MatchSim.sweep(pair[1], RUNS)
		assert_lt(float(s.sufficiency_med), 0.95,
			"%s 自给率 %.2f，弹药系统会失去意义" % [pair[0], s.sufficiency_med])


## 机动单调性：走位越好挨打越少，且不是无条件免伤。
func test_movement_efficiency_is_monotonic() -> void:
	var prev := 0.0
	for step in range(6):
		var eff := float(step) / 5.0
		var one := MatchSim.play({"movement_efficiency": eff, "execution_rate": 0.0})
		var dmg := float(one.damage_taken)
		if step > 0:
			assert_lte(dmg, prev + 0.001, "机动 %.2f 的受击 %.0f 高于上一档 %.0f，减伤模型不单调"
				% [eff, dmg, prev])
		prev = dmg
	var idle := MatchSim.play({"movement_efficiency": 1.0, "execution_rate": 0.0})
	assert_gt(float(idle.damage_taken), 0.0, "满机动也不该完全免伤")


## 时长模型的「每敌人时间」必须与波次表同源，否则两个模型会各说各话。
func test_maneuver_time_matches_wave_table_source() -> void:
	assert_eq(MatchSim.MANEUVER_PER_ENEMY, WaveTable.PER_ENEMY_TIME,
		"MatchSim 与 WaveTable 的每敌人时间必须同值，改一处要同时改另一处")


func test_determinism() -> void:
	assert_eq(MatchSim.play(AVERAGE), MatchSim.play(AVERAGE), "同画像同种子必须完全一致")
	assert_ne(MatchSim.play({"seed": 1234}), MatchSim.play({"seed": 987654}), "换种子应改变结果")
