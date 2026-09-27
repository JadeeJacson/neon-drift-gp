extends GutTest
const BoostTable = preload("res://sim/boost_table.gd")


func test_pickup_small_adds_twelve() -> void:
	assert_almost_eq(BoostTable.picked_up(30.0, false), 42.0, 0.001)


func test_pickup_big_fills_to_max() -> void:
	assert_almost_eq(BoostTable.picked_up(37.0, true), 100.0, 0.001)
	assert_almost_eq(BoostTable.picked_up(100.0, true), 100.0, 0.001)


func test_pickup_never_exceeds_max() -> void:
	assert_almost_eq(BoostTable.picked_up(95.0, false), 100.0, 0.001)


func test_consume_never_negative() -> void:
	assert_almost_eq(BoostTable.consumed(10.0, 1.0), 0.0, 0.001)
	assert_almost_eq(BoostTable.consumed(100.0, 1.0), 67.0, 0.001)


func test_consume_scales_with_dt() -> void:
	assert_almost_eq(BoostTable.consumed(100.0, 0.5), 100.0 - BoostTable.CONSUME_PER_SEC * 0.5, 0.001)


func test_respawn_time_big_is_longer() -> void:
	assert_true(BoostTable.respawn_time(true) > BoostTable.respawn_time(false))
	assert_almost_eq(BoostTable.respawn_time(true), BoostTable.BIG_PAD_RESPAWN, 0.001)
