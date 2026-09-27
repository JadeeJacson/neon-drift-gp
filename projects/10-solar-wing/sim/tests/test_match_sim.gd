extends GutTest

## 难度曲线的区间断言（docs/00 §4.3 的执行体）。
## 断言的是分布——同种子必然同结果，区间可以写死。

const RUNS := 16

const TURTLE := {"aim": 0.35, "dodge": 0.15, "aggression": 0.15, "heat_manage": 0.20, "shield": 0.15}
const AVERAGE := {}
const SKILLED := {"aim": 0.85, "dodge": 0.80, "aggression": 0.80, "heat_manage": 0.90, "shield": 0.70}


## 核心设计主张：走位与进攻必须有回报，龟缩必须亏。
func test_skill_shape() -> void:
	var turtle := MatchSim.sweep(TURTLE, RUNS)
	var average := MatchSim.sweep(AVERAGE, RUNS)
	var skilled := MatchSim.sweep(SKILLED, RUNS)
	assert_lt(float(turtle.clear_rate), 0.25,
		"龟缩流通关率 %.0f%%，说明躲着打也能过" % (float(turtle.clear_rate) * 100))
	assert_gt(float(skilled.clear_rate), float(average.clear_rate),
		"高手通关率必须高于普通")
	assert_gt(float(average["damage_med"]), float(skilled["damage_med"]),
		"整压打法受到的总伤害必须更低")


## 普通画像要「险胜」而不是碾压。
func test_average_profile_is_playable() -> void:
	var s := MatchSim.sweep(AVERAGE, RUNS)
	assert_gte(float(s["clear_rate"]), 0.60,
		"普通画像通关率只有 %.0f%%，会让「完整可玩」变劝退" % (float(s["clear_rate"]) * 100))
	var one := MatchSim.play(AVERAGE)
	assert_gt(float(one["hull_left"]), 0.0, "标准种子下普通画像必须能活")
	assert_lte(float(one["hull_left"]), 55.0,
		"普通画像终局剩 %.0f 舰体，余量过大没有压迫感" % float(one["hull_left"]))


## 整局时长带（对应 tools/preview_waves.gd 的目标区间 10–15 分钟）。
## 只断言中位数：阵亡局天然更短，那是玩家的失败不是设计违约。
func test_duration_band() -> void:
	var s := MatchSim.sweep(AVERAGE, RUNS)
	assert_gte(float(s["minutes_med"]), 10.0,
		"中位 %.1f 分，短于设计下限" % float(s["minutes_med"]))
	assert_lte(float(s["minutes_med"]), 15.0,
		"中位 %.1f 分，超出设计上限" % float(s["minutes_med"]))


func test_determinism() -> void:
	assert_eq(MatchSim.play(AVERAGE), MatchSim.play(AVERAGE), "同画像同种子必须一致")
	assert_ne(MatchSim.play({"seed": 1234}), MatchSim.play({"seed": 987654}),
		"换种子应改变结果")


## 普通画像必须真的打满 5 波（不是第 3 波就没了）。
func test_victory_requires_all_waves() -> void:
	var one := MatchSim.play(AVERAGE)
	assert_eq(int(one["waves_cleared"]), WaveTable.WAVE_COUNT, "普通画像应清满 5 波")
	assert_eq(bool(one["victory"]), true, "满波即胜利")
	var score := int(one["score"])
	assert_gt(score, 3000, "5 波全清得分 %d 过低" % score)
