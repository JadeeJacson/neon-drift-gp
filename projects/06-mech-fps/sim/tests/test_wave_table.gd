extends GutTest

## 波次曲线断言：难度单调、精英节奏、时长落进设计区间。

const SEED := 20260926


func test_wave_count() -> void:
	var waves := WaveTable.plan(SEED)
	assert_eq(waves.size(), WaveTable.TOTAL_WAVES)
	assert_eq(waves.size(), 5, "首发 5 波（DoD：≥5 波）")


func test_budget_monotonic_increasing() -> void:
	var waves := WaveTable.plan(SEED)
	var prev := 0.0
	for w in waves:
		assert_gt(float(w.budget), prev, "第 %s 波预算未增长" % w.index)
		prev = float(w.budget)


func test_plan_is_deterministic() -> void:
	assert_eq(WaveTable.plan(11), WaveTable.plan(11), "同 seed 必须产出同一计划")
	assert_ne(WaveTable.plan(11), WaveTable.plan(22), "不同 seed 应改变编制")


func test_elite_pacing() -> void:
	for w in WaveTable.plan(SEED):
		var heavy_count := int(w.spawns.get("heavy", 0))
		assert_eq(heavy_count, int(WaveTable.ELITES[int(w.index)]),
			"第 %d 波重装数量应与 ELITES 表一致" % int(w.index))
	assert_eq(int(WaveTable.plan(SEED)[0].spawns.get("heavy", 0)), 0, "第 1 波不该有重装")


func test_totals_are_playable() -> void:
	for offset in range(6):
		for w in WaveTable.plan(SEED + offset * 977):
			var total := int(w.total)
			var wave := int(w.index)
			assert_gte(total, 6, "种子 %d 第 %d 波只有 %d 个敌人，撑不起一波" % [SEED + offset * 977, wave, total])
			assert_lte(total, 20, "种子 %d 第 %d 波 %d 个敌人，无寻路时会堵死通道" % [SEED + offset * 977, wave, total])
			assert_gte(int(w.alive_cap), 6)
			assert_lte(int(w.alive_cap), 9)
			for type in w.spawns:
				assert_lte(int(w.spawns[type]), WaveTable.PER_TYPE_CAP + 2,
					"%s 在同波堆积过多" % type)


## 编制演化：远距兵种占比逐波上升（玩家先练移动，后练打靶）
func test_composition_shifts_to_troopers() -> void:
	var waves := WaveTable.plan(SEED)
	var early := int(waves[0].spawns.get("trooper", 0))
	var late := int(waves[2].spawns.get("trooper", 0))
	assert_gt(late, early, "第 3 波的机兵射手应多于第 1 波")


## 一局时长必须落在 docs/06 §2.4 的 10–15 分钟区间。
## 跨 12 个种子断言，而不是只验一个幸运种子——难度曲线不该靠种子碰运气。
func test_session_length() -> void:
	for offset in range(12):
		var seed_value := SEED + offset * 977
		var minutes := float(WaveTable.summary(seed_value).expected_minutes)
		assert_gte(minutes, 10.0, "种子 %d 整局 %.1f 分钟，短于设计下限" % [seed_value, minutes])
		assert_lte(minutes, 15.0, "种子 %d 整局 %.1f 分钟，超出设计上限" % [seed_value, minutes])


func test_total_enemy_volume() -> void:
	for offset in range(12):
		var seed_value := SEED + offset * 977
		var s := WaveTable.summary(seed_value)
		assert_gte(int(s.total_enemies), 40, "种子 %d 整局只有 %d 个敌人" % [seed_value, int(s.total_enemies)])
		assert_lte(int(s.total_enemies), 70, "种子 %d 整局 %d 个敌人，时长会失控" % [seed_value, int(s.total_enemies)])
