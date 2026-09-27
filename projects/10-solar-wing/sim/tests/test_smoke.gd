extends GutTest

## 冒烟级测试：sim 层类必须能加载、关键常量在位。


func test_sim_layer_loads() -> void:
	assert_not_null(SimRng.new())
	assert_gt(CombatModel.BASE_DPS, 0.0, "玩家基础 DPS 应为正")
	assert_eq(WaveTable.WAVE_COUNT, 5, "首版固定 5 波")
	assert_gt(WaveTable.total_enemies(), 30, "敌机总量太少，波次会空")


func test_ship_table_kinds() -> void:
	for kind in ["interceptor", "bomber", "drone"]:
		assert_gt(ShipTable.hp_of(kind), 0.0, "%s HP 应为正" % kind)
		assert_gt(ShipTable.score_of(kind), 0, "%s 击杀分应为正" % kind)
