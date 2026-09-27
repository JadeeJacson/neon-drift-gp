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


func test_hit_radius_covers_visible_silhouette() -> void:
	# 玩家反馈「敌机太扁、几乎打不到」：命中球必须不小于该型最长可视轮廓的一半，
	# 否则玩家对准了也打不中。数值来自 tools/measure_ships.gd 的实测包围盒。
	const VISIBLE := {"interceptor": 4.3, "bomber": 4.6, "drone": 2.8}
	for kind in VISIBLE:
		var longest := float(VISIBLE[kind])
		var r := ShipTable.hit_radius_of(kind)
		assert_gte(r * 2.0, longest * 0.7,
			"%s 命中球直径（%.1f m）不该明显小于可视轮廓（%.1f m）" % [kind, r * 2.0, longest])
		assert_gt(r, 0.0, "%s 命中半径应为正" % kind)


func test_all_kinds_have_iff_ring_radius() -> void:
	# IFF 环与命中球同源：环半径由 hit_radius_of 推出，不允许出现两套数值
	for kind in ShipTable.ENEMIES:
		assert_gt(ShipTable.hit_radius_of(String(kind)), 0.5,
			"%s 的 IFF 环半径必须可见（>0.5 m）" % kind)
