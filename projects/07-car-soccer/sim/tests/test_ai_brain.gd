extends GutTest
const AiBrain = preload("res://sim/ai_brain.gd")

const OWN_GOAL := Vector3(-36, 0, 0)
const TARGET_GOAL := Vector3(36, 0, 0)


func _snap(ball: Vector3, ball_vel: Vector3, me: Vector3, boost: float, extra: Dictionary = {}) -> Dictionary:
	var s: Dictionary = {
		"ball_pos": ball,
		"ball_vel": ball_vel,
		"my_pos": me,
		"my_boost": boost,
		"own_goal_pos": OWN_GOAL,
		"target_goal_pos": TARGET_GOAL,
		"params": AiBrain.default_params(),
	}
	for k in extra:
		s[k] = extra[k]
	return s


func test_defend_when_ball_deep_in_own_half_and_closer_to_goal() -> void:
	var out: Dictionary = AiBrain.decide(_snap(Vector3(-30, 0, 5), Vector3.ZERO, Vector3(-10, 0, 0), 50.0))
	assert_eq(out["mode"], AiBrain.MODE_DEFEND)
	var target: Vector3 = out["target_pos"]
	# 卡位点必须在球与自家球门之间（x 介于球与门之间）
	assert_true(target.x < -30.0 and target.x > -36.0)


func test_shoot_when_close_and_behind_ball() -> void:
	# 球在中场偏前，车在球的本方一侧（车→球 指向对方球门）
	var out: Dictionary = AiBrain.decide(_snap(Vector3(10, 0, 0), Vector3.ZERO, Vector3(3, 0, 0), 50.0))
	assert_eq(out["mode"], AiBrain.MODE_SHOOT)
	var target: Vector3 = out["target_pos"]
	# 射门瞄准点在球后方（朝自家一侧），以便把球推向对方球门
	assert_true(target.x < 10.0)


func test_chase_when_ball_far_ahead() -> void:
	var out: Dictionary = AiBrain.decide(_snap(Vector3(20, 0, 10), Vector3.ZERO, Vector3(-20, 0, -10), 50.0))
	assert_eq(out["mode"], AiBrain.MODE_CHASE)
	var target: Vector3 = out["target_pos"]
	# 预判点应比球心更靠前（朝对方半场方向）
	assert_true(target.distance_to(Vector3(20, 0, 10)) < 30.0)


func test_get_boost_when_empty_and_ball_far() -> void:
	var pad := Vector3(-30, 0, 20)
	var out: Dictionary = AiBrain.decide(
		_snap(Vector3(25, 0, 0), Vector3.ZERO, Vector3(-25, 0, 18), 5.0, {"boost_pad_pos": pad}))
	assert_eq(out["mode"], AiBrain.MODE_GET_BOOST)
	var target: Vector3 = out["target_pos"]
	assert_true(target.distance_to(pad) < 0.01)


func test_wants_boost_only_when_has_some() -> void:
	var out: Dictionary = AiBrain.decide(_snap(Vector3(20, 0, 10), Vector3.ZERO, Vector3(-20, 0, -10), 0.0))
	assert_eq(bool(out["want_boost"]), false)


func test_output_is_finite() -> void:
	var out: Dictionary = AiBrain.decide(
		_snap(Vector3(12, 0, -6), Vector3(5, 0, 2), Vector3(0, 0, 0), 40.0))
	var target: Vector3 = out["target_pos"]
	assert_true(is_finite(target.x) and is_finite(target.y) and is_finite(target.z))


func test_determinism_same_input_same_output() -> void:
	var a: Dictionary = AiBrain.decide(_snap(Vector3(8, 0, 4), Vector3(1, 0, 1), Vector3(-2, 0, 0), 30.0))
	var b: Dictionary = AiBrain.decide(_snap(Vector3(8, 0, 4), Vector3(1, 0, 1), Vector3(-2, 0, 0), 30.0))
	assert_eq(a, b)


func test_never_defends_against_ball_in_enemy_half() -> void:
	# 球在对方半场：无论我多远都不该回防
	var out: Dictionary = AiBrain.decide(_snap(Vector3(30, 0, 0), Vector3.ZERO, Vector3(-30, 0, 0), 50.0))
	assert_true(out["mode"] != AiBrain.MODE_DEFEND)
