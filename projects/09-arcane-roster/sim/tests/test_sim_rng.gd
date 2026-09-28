extends GutTest
## sim_rng 的确定性是整局跑分能断言的前提，所以它是第一个被测的对象。
##
## 断言要点：
##   1. 同种子同序列（否则跑分「同 seed 必然同结果」就是空话）
##   2. 不同种子发散（否则种子形同虚设）
##   3. 分布大致均匀（不是单调递增的假随机）
##   4. 0 是 LCG 的不动点，必须被躲开


func test_same_seed_same_sequence() -> void:
	var a := SimRng.new(12345)
	var b := SimRng.new(12345)
	for _i in range(50):
		assert_eq(a.next_int(), b.next_int(), "同种子的整数序列必须逐项相同")


func test_different_seed_diverges() -> void:
	var a := SimRng.new(1)
	var b := SimRng.new(2)
	var same := 0
	for _i in range(20):
		if a.next_int() == b.next_int():
			same += 1
	assert_lt(same, 4, "不同种子前 20 项不应高度重合（实测重合 %d 次）" % same)


func test_float_in_unit_range() -> void:
	var r := SimRng.new(777)
	for _i in range(2000):
		var v := r.next_float()
		assert_gte(v, 0.0)
		assert_lt(v, 1.0)


func test_range_i_inclusive() -> void:
	var r := SimRng.new(9)
	var seen := {}
	for _i in range(500):
		var v := r.range_i(1, 4)
		assert_gte(v, 1)
		assert_lte(v, 4)
		seen[v] = true
	assert_eq(seen.size(), 4, "1..4 四个值都必须出现过，实际 %d 个" % seen.size())


func test_range_i_degenerate() -> void:
	var r := SimRng.new(3)
	assert_eq(r.range_i(5, 5), 5, "from==to 必须直接返回该值")
	assert_eq(r.range_i(9, 2), 9, "from>to 也返回 from，不得抛错")


func test_chance_bounds() -> void:
	var r := SimRng.new(42)
	assert_false(r.chance(0.0), "p=0 恒假")
	assert_true(r.chance(1.0), "p=1 恒真")


func test_chance_frequency() -> void:
	var r := SimRng.new(2026)
	var hits := 0
	for _i in range(4000):
		if r.chance(0.25):
			hits += 1
	assert_almost_eq(float(hits) / 4000.0, 0.25, 0.02, "4000 次抽样的命中率应接近 0.25")


func test_shuffled_preserves_elements() -> void:
	var src := [1, 2, 3, 4, 5, 6, 7, 8]
	var out := SimRng.new(5).shuffled(src)
	assert_eq(out.size(), src.size())
	for v in src:
		assert_true(out.has(v), "洗牌不能丢元素 %d" % v)
	assert_eq(src.size(), 8, "shuffled 不得修改入参（数组长度）")
	assert_eq(src[0], 1, "shuffled 不得修改入参（首元素）")


func test_shuffled_actually_shuffles() -> void:
	var src := []
	for i in range(12):
		src.append(i)
	var out := SimRng.new(8).shuffled(src)
	var same := 0
	for i in range(src.size()):
		if src[i] == out[i]:
			same += 1
	assert_lt(same, 6, "洗牌后原位不变的项不该这么多（%d/12）" % same)


func test_pick_weighted_respects_zero_weight() -> void:
	var r := SimRng.new(11)
	for _i in range(200):
		var k = r.pick_weighted({"a": 0.0, "b": 1.0})
		assert_eq(str(k), "b", "权重 0 的项永远抽不到")
	assert_eq(r.pick_weighted({}), null, "空权重表返回 null 而不是崩")


func test_pick_weighted_distribution() -> void:
	var r := SimRng.new(99)
	var a := 0
	for _i in range(2000):
		if str(r.pick_weighted({"x": 1.0, "y": 3.0})) == "y":
			a += 1
	assert_almost_eq(float(a) / 2000.0, 0.75, 0.04, "权重 1:3 的抽样应接近 75%")


func test_seed_zero_is_usable() -> void:
	var r := SimRng.new(0)
	var a := r.next_int()
	var b := r.next_int()
	assert_ne(a, b, "种子 0 必须是可用种子（LCG 的不动点要被躲开）")
	var s := SimRng.new(0)
	var t := SimRng.new(0)
	assert_eq(s.next_int(), t.next_int(), "种子 0 也要可复现")
