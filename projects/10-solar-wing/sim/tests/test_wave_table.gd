extends GutTest

## WaveTable：编成固定可断言，顺序与角度随种子变化。


func test_composition_shape() -> void:
	var waves := WaveTable.plan(1)
	assert_eq(waves.size(), WaveTable.WAVE_COUNT, "必须正好 5 波")
	for i in range(waves.size()):
		var w: Dictionary = waves[i]
		assert_eq(int(w["index"]), i + 1, "波次序号 1 基")
		var comp: Dictionary = WaveTable.COMPOSITION[i]
		var expected := 0
		for kind in comp:
			expected += int(comp[kind])
		assert_eq(int(w["total"]), expected, "第 %d 波总数与编成表一致" % (i + 1))
		assert_eq((w["spawns"] as Array).size(), int(w["total"]), "spawns 展开数量正确")
		assert_eq((w["angles"] as Array).size(), int(w["total"]), "每架都有出怪角")


func test_difficulty_is_monotonic() -> void:
	var prev := 0
	for comp in WaveTable.COMPOSITION:
		var n := 0
		for kind in comp:
			n += int(comp[kind])
		assert_gt(n, prev, "波次规模必须递增（否则难度曲线断裂）")
		prev = n


func test_plan_is_deterministic_and_seed_sensitive() -> void:
	assert_eq(WaveTable.plan(9), WaveTable.plan(9), "同种子同计划")
	assert_ne(WaveTable.plan(9)[0]["angles"], WaveTable.plan(10)[0]["angles"],
		"不同种子应给出不同出怪角")
	# 编成与种子无关：难度不许随种子漂移
	for i in range(WaveTable.WAVE_COUNT):
		assert_eq(WaveTable.plan(9)[i]["total"], WaveTable.plan(10)[i]["total"],
			"编成总数与种子无关")


func test_shuffle_keeps_composition() -> void:
	var w: Dictionary = WaveTable.plan(3)[2]  # 第 3 波
	var counts := {"interceptor": 0, "drone": 0, "bomber": 0}
	for kind in w["spawns"]:
		counts[String(kind)] = int(counts[String(kind)]) + 1
	var comp: Dictionary = WaveTable.COMPOSITION[2]
	for kind in comp:
		assert_eq(int(counts[String(kind)]), int(comp[kind]),
			"洗牌后 %s 数量必须不变" % kind)


func test_every_wave_maps_to_a_real_planet() -> void:
	# 「每颗星球附近有任务」：每波都必须绑定一颗存在的行星，且不重复
	assert_eq(SpaceWorld.WAVE_PLANET.size(), WaveTable.WAVE_COUNT,
		"任务行星映射必须覆盖全部波次")
	var seen := {}
	for i in range(SpaceWorld.WAVE_PLANET.size()):
		var idx := int(SpaceWorld.WAVE_PLANET[i])
		assert_gte(idx, 0, "第 %d 波的任务行星索引非法" % (i + 1))
		assert_lt(idx, SpaceWorld.PLANETS.size(),
			"第 %d 波指向了不存在的行星" % (i + 1))
		assert_false(seen.has(idx), "第 %d 波的任务行星与前面重复" % (i + 1))
		seen[idx] = true
		assert_ne(String(SpaceWorld.PLANETS[idx]["name"]), "", "任务行星必须有名字（HUD 要播报）")


func test_planets_have_orbits_not_fixed_positions() -> void:
	# 背景「跑到战场外」的根因是行星摆在固定世界坐标。这里锁死：每颗行星
	# 必须有轨道半径（相对恒星），由 SpaceWorld 每帧按相位算位置。
	for i in range(SpaceWorld.PLANETS.size()):
		var p: Dictionary = SpaceWorld.PLANETS[i]
		assert_gt(float(p["orbit"]), 0.0, "行星 %d 缺轨道半径" % i)
		assert_gt(float(p["radius"]), 0.0, "行星 %d 缺球体半径" % i)
		assert_false(p.has("pos"), "行星 %d 不该再有固定世界坐标 pos" % i)
