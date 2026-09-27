extends GutTest
const MatchSim = preload("res://sim/match_sim.gd")
const MatchRules = preload("res://sim/rules.gd")

const RUNS := 60


func _batch(profile: Dictionary) -> Dictionary:
	return MatchSim.run_batch(profile, RUNS, 20260927)


func test_turtle_profile_loses_to_ai() -> void:
	var b: Dictionary = _batch(MatchSim.profiles()["龟缩流"])
	assert_lt(b["win_rate"], 0.15)
	assert_gt(b["avg_score_player"], 0.2)   # 偶尔进球但撑不起胜局


func test_average_profile_is_close_match() -> void:
	var b: Dictionary = _batch(MatchSim.profiles()["普通"])
	assert_lt(b["win_rate"], 0.70)
	assert_gt(b["win_rate"], 0.30)


func test_expert_profile_beats_ai_clearly() -> void:
	var b: Dictionary = _batch(MatchSim.profiles()["高手"])
	assert_gt(b["win_rate"], 0.70)


func test_monotonic_skill_ordering() -> void:
	var p: Dictionary = MatchSim.profiles()
	var turtle: float = _batch(p["龟缩流"])["win_rate"]
	var normal: float = _batch(p["普通"])["win_rate"]
	var expert: float = _batch(p["高手"])["win_rate"]
	assert_true(turtle < normal, "龟缩流(%f) < 普通(%f)" % [turtle, normal])
	assert_true(normal < expert, "普通(%f) < 高手(%f)" % [normal, expert])


func test_match_duration_respects_rules() -> void:
	var r: Dictionary = MatchSim.play_match(42, MatchSim.profiles()["普通"], MatchSim.ai_level())
	assert_almost_eq(float(r["duration"]), MatchRules.MATCH_TIME, 0.001)


func test_stats_are_sane() -> void:
	var b: Dictionary = _batch(MatchSim.profiles()["普通"])
	assert_true(b["avg_shots_player"] > 1.0, "整局应有像样的射门数")
	assert_true(b["avg_score_ai"] > 0.5, "AI 必须有进球威胁")
	assert_true(b["avg_score_ai"] < 6.0, "AI 不能刷爆比分")
	assert_almost_eq(b["win_rate"] + b["draw_rate"] + (1.0 - b["win_rate"] - b["draw_rate"]), 1.0, 0.001)


func test_determinism_same_seed_same_result() -> void:
	var prof: Dictionary = MatchSim.profiles()["普通"]
	var a: Dictionary = MatchSim.play_match(1234, prof, MatchSim.ai_level())
	var b: Dictionary = MatchSim.play_match(1234, prof, MatchSim.ai_level())
	assert_eq(a, b)
