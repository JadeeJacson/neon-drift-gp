extends GutTest

## 移动常数的设计约束断言（docs/08-立项 §3.1）。
## 这些不是「跑通就行」的测试：每条断言对应一句设计意图，改数值必须先过这里。
## 手感无法自动验证的部分（跟不跟手、黏不黏）留给人验（路线图 §4.5），
## 这里锁的是「跳跃够不够上 3 格台、dash 是不是比一跳远」这类可计算的边界。


func test_every_metric_sits_in_its_design_band() -> void:
	var m := MovementParams.measured()
	var bands := MovementParams.design_bands()
	for key in bands:
		var band: Array = bands[key]
		var v: float = float(m[key])
		assert_between(v, float(band[0]), float(band[1]), "%s 应落在设计区间内" % key)


func test_variable_jump_height_is_a_real_range() -> void:
	# 短跳与满跳差得太小就没有「轻点/长按」的意义，差得太大则关卡要留很高容错
	var full := MovementParams.jump_apex_px()
	var min_hop := MovementParams.min_hop_px()
	assert_gt(full, min_hop * 2.5, "满跳至少要是短跳的 2.5 倍，可变跳高才有意义")
	assert_lt(min_hop, MovementParams.TILE * 1.6, "短跳不能高过 1.6 格，否则踩不到低平台的边")


func test_single_jump_clears_a_three_tile_step() -> void:
	# 关卡设计的地板假设：满跳必上 3 格台。这条塌了，所有按 3 格铺的平台都跳不上去
	assert_gte(MovementParams.jump_apex_tiles(), 3.6, "满跳峰值必须稳过 3 格台（含碰撞盒余量）")


func test_double_jump_extends_reach_without_becoming_fly() -> void:
	var dbl := MovementParams.double_jump_apex_px()
	var single := MovementParams.jump_apex_px()
	assert_lt(dbl, single * 2.1, "二段跳不该超过两段单跳之和太多，否则等于给飞行")
	assert_eq(MovementParams.AIR_JUMPS, 1, "首发作废三段跳：跳太高会让关卡垂直设计失去意义")


func test_dash_is_further_than_a_jump_and_shorter_than_wall_jump_chain() -> void:
	var dash_tiles := MovementParams.dash_distance_tiles()
	var jump_tiles := MovementParams.jump_distance_tiles()
	assert_gt(dash_tiles, 3.0, "dash 至少 3 格，否则不如走路")
	assert_lt(dash_tiles, jump_tiles, "dash 是「修正落点」的工具，不该比满跳还远，否则跳过沟不需要跳跃技巧")


func test_coyote_and_buffer_windows_are_frames_not_seconds() -> void:
	assert_eq(MovementParams.seconds_to_frames(MovementParams.frames_to_seconds(6)), 6,
			"帧↔秒换算必须可逆，否则高刷屏下窗口会漂")
	assert_gte(MovementParams.COYOTE_FRAMES, 5, "少于 5 帧的 coyote 玩家会觉得「我明明跳了」")
	assert_lte(MovementParams.COYOTE_FRAMES, MovementParams.JUMP_BUFFER_FRAMES,
			"buffer 窗口不该小于 coyote，否则落地前按键会白按")


func test_wall_slide_is_slower_than_fall_but_faster_than_climb() -> void:
	assert_lt(MovementParams.WALL_SLIDE_MAX_FALL, MovementParams.MAX_FALL_SPEED,
			"贴墙必须比自由落体慢，否则墙跳不可用")
	assert_gt(MovementParams.WALL_SLIDE_MAX_FALL, 20.0,
			"下坠太慢等于爬墙，会吞掉垂直节奏")


func test_air_control_keeps_momentum() -> void:
	assert_lt(MovementParams.FRICTION_AIR, MovementParams.FRICTION_GROUND,
			"空中摩擦必须低于地面，否则跳出去会像踩了刹车（格子戏手感）")


func test_gravity_asymmetry_makes_falling_heavier() -> void:
	assert_gt(MovementParams.FALL_MULTIPLIER, 1.0, "下落段必须比上升更重，跳跃才「有顶」")
	assert_lt(MovementParams.FALL_MULTIPLIER, 2.0, "重过头会变成砸地，空中无法修正")
