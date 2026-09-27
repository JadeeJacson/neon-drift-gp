extends GutTest

## SimRng：确定性是整个 sim 层的地基。


func test_determinism() -> void:
	var a := SimRng.new(42)
	var b := SimRng.new(42)
	for _i in range(20):
		assert_eq(a.next_int(), b.next_int(), "同种子必须同序列")


func test_range() -> void:
	var rng := SimRng.new(7)
	for _i in range(200):
		var v := rng.next_float()
		assert_gte(v, 0.0, "next_float 下界")
		assert_lt(v, 1.0, "next_float 上界")


func test_different_seeds_diverge() -> void:
	var a := SimRng.new(1)
	var b := SimRng.new(2)
	assert_ne(a.next_int(), b.next_int(), "不同种子应发散")


func test_roll_distribution() -> void:
	var rng := SimRng.new(20260927)
	var hits := 0
	for _i in range(1000):
		if rng.roll(0.3):
			hits += 1
	assert_gte(hits, 220, "p=0.3 命中数偏低（%d/1000）" % hits)
	assert_lte(hits, 380, "p=0.3 命中数偏高（%d/1000）" % hits)
