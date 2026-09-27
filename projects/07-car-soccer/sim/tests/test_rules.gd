extends GutTest
const MatchRules = preload("res://sim/rules.gd")


func test_initial_is_kickoff_with_full_clock() -> void:
	var st: Dictionary = MatchRules.initial()
	assert_eq(st["phase"], MatchRules.PHASE_KICKOFF)
	assert_almost_eq(float(st["clock"]), MatchRules.MATCH_TIME, 0.001)
	assert_eq(int(st["score_blue"]), 0)
	assert_eq(int(st["score_orange"]), 0)


func test_countdown_then_playing() -> void:
	var st: Dictionary = MatchRules.initial()
	st = MatchRules.tick(st, 2.0)
	assert_eq(st["phase"], MatchRules.PHASE_KICKOFF)
	st = MatchRules.tick(st, 0.5)
	assert_eq(st["phase"], MatchRules.PHASE_PLAYING)


func test_goal_scores_pauses_then_rekicks() -> void:
	var st: Dictionary = MatchRules.tick(MatchRules.initial(), 3.0)
	assert_eq(st["phase"], MatchRules.PHASE_PLAYING)
	st = MatchRules.on_goal(st, "blue")
	assert_eq(st["phase"], MatchRules.PHASE_GOAL)
	assert_eq(int(st["score_blue"]), 1)
	st = MatchRules.tick(st, MatchRules.GOAL_PAUSE + 0.01)
	assert_eq(st["phase"], MatchRules.PHASE_KICKOFF)
	assert_eq(int(st["kickoff_count"]), 2)
	st = MatchRules.tick(st, MatchRules.KICKOFF_COUNTDOWN + 0.01)
	assert_eq(st["phase"], MatchRules.PHASE_PLAYING)


func test_goal_only_counts_once_per_play_phase() -> void:
	# 06 清波判定每帧重复触发的教训：规则层要求 on_goal 在 GOAL_PAUSE 内幂等
	var st: Dictionary = MatchRules.tick(MatchRules.initial(), 3.0)
	st = MatchRules.on_goal(st, "orange")
	var again: Dictionary = MatchRules.on_goal(st, "orange")
	assert_eq(int(again["score_orange"]), 1)
	assert_eq(again, st)


func test_score_cap_ends_match_immediately() -> void:
	var st: Dictionary = MatchRules.tick(MatchRules.initial(), 3.0)
	for i in range(MatchRules.SCORE_CAP):
		st = MatchRules.tick(st, 0.01)
		st = MatchRules.on_goal(st, "blue")
		if st["phase"] == MatchRules.PHASE_FULL:
			break
		st = MatchRules.tick(st, MatchRules.GOAL_PAUSE + 0.01)
		st = MatchRules.tick(st, MatchRules.KICKOFF_COUNTDOWN + 0.01)
	assert_eq(st["phase"], MatchRules.PHASE_FULL)
	assert_eq(st["winner"], "blue")


func test_clock_expiry_ends_match_as_draw_on_tie() -> void:
	var st: Dictionary = MatchRules.tick(MatchRules.initial(), MatchRules.KICKOFF_COUNTDOWN + 0.01)
	st = MatchRules.tick(st, MatchRules.MATCH_TIME + 1.0)
	assert_eq(st["phase"], MatchRules.PHASE_FULL)
	assert_eq(st["winner"], "draw")
	assert_almost_eq(float(st["clock"]), 0.0, 0.001)


func test_clock_never_negative() -> void:
	var st: Dictionary = MatchRules.tick(MatchRules.initial(), 10000.0)
	assert_true(float(st["clock"]) >= 0.0)


func test_full_time_is_absorbing() -> void:
	var st: Dictionary = MatchRules.tick(MatchRules.initial(), MatchRules.KICKOFF_COUNTDOWN + 0.01)
	st = MatchRules.tick(st, MatchRules.MATCH_TIME + 1.0)
	var after: Dictionary = MatchRules.tick(st, 10.0)
	assert_eq(after, st)
	var after_goal: Dictionary = MatchRules.on_goal(after, "blue")
	assert_eq(after_goal, after)


func test_duplicate_tick_during_playing_keeps_clock_consistent() -> void:
	var st: Dictionary = MatchRules.tick(MatchRules.initial(), MatchRules.KICKOFF_COUNTDOWN + 0.01)
	var a: Dictionary = MatchRules.tick(st, 1.0)
	var b: Dictionary = MatchRules.tick(st, 1.0)
	assert_eq(a, b)
