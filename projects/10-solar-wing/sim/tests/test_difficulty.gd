extends GutTest

## DifficultyTable：三档必须单调（休闲 < 标准 < 硬核），且切换不能产生非法 id。
## 玩家反馈「难度偏高」后引入——难度是显式产品决策，必须有回归网。


func _hp_of(id: String) -> float:
	ShipTable.difficulty_id = id
	return ShipTable.hp_of("interceptor")


func _damage_of(id: String) -> float:
	ShipTable.difficulty_id = id
	return ShipTable.damage_of("interceptor")


func _interval_of(id: String) -> float:
	ShipTable.difficulty_id = id
	return ShipTable.fire_interval_of("interceptor")


## 每测复位：ShipTable.difficulty_id 是 static 变量，GUT 全局共享。
## 不复位会跨文件泄漏（test_combat_model 改过档位 → test_difficulty 读到硬核档）。
func before_each() -> void:
	ShipTable.difficulty_id = "normal"


func test_hp_is_monotonic() -> void:
	assert_lt(_hp_of("casual"), _hp_of("normal"), "休闲档敌机血量必须低于标准")
	assert_lt(_hp_of("normal"), _hp_of("hardcore"), "硬核档敌机血量必须高于标准")


func test_damage_is_monotonic() -> void:
	assert_lt(_damage_of("casual"), _damage_of("normal"), "休闲档伤害更低")
	assert_lt(_damage_of("normal"), _damage_of("hardcore"), "硬核档伤害更高")


func test_rate_is_monotonic() -> void:
	# 射速倍率 >1 → 间隔更短
	assert_gt(_interval_of("casual"), _interval_of("normal"), "休闲档射速更慢")
	assert_gt(_interval_of("normal"), _interval_of("hardcore"), "硬核档射速更快")


func test_aim_hit_rate_is_monotonic() -> void:
	ShipTable.difficulty_id = "casual"
	var easy := ShipTable.abstract_hit()
	ShipTable.difficulty_id = "hardcore"
	var hard := ShipTable.abstract_hit()
	assert_gt(easy, hard, "休闲档玩家命中率必须高于硬核档")


func test_unknown_id_falls_back_to_normal() -> void:
	assert_eq(ShipTable.score_of("interceptor"),
		(float(ShipTable.ENEMIES["interceptor"]["score"])),
		"标准档得分应等于基础值")
	ShipTable.difficulty_id = "nonexistent"
	assert_eq(DifficultyTable.label_of(ShipTable.difficulty_id), "标准",
		"未知难度必须回落到标准档而不是崩")


func test_cycle_wraps_in_both_directions() -> void:
	var start := "normal"
	var fwd := DifficultyTable.next_id(start, 1)
	var back := DifficultyTable.next_id(start, -1)
	assert_ne(fwd, start, "向前切换必须换档")
	assert_ne(back, start, "向后切换必须换档")
	assert_eq(DifficultyTable.next_id(fwd, -1), start, "前后切换必须互逆")
	assert_eq(DifficultyTable.next_id(start, DifficultyTable.ORDER.size()), start,
		"切换一整圈应回到原档")


func test_shield_has_cost() -> void:
	# 主动护盾必须有 CD 且吸收量有限，否则它会架空整个难度旋钮
	assert_gt(ShipTable.SHIELD_BURST_CD, 2.0, "护盾 CD 必须够长（否则等于常驻）")
	assert_gt(ShipTable.SHIELD_BURST_ABSORB, 0.0, "护盾应能吸收伤害")
	assert_lt(ShipTable.SHIELD_BURST_DURATION, ShipTable.SHIELD_BURST_CD * 0.5,
		"持续时间应远小于 CD（否则等于无敌常驻）")


func test_missile_is_resource_limited() -> void:
	assert_gt(ShipTable.MISSILE_AMMO_MAX, 0.0, "导弹应有弹药上限")
	assert_gt(ShipTable.MISSILE_RELOAD, 0.0, "弹尽后应有装填时间")
	assert_gt(ShipTable.MISSILE_CD, 0.0, "两发之间应有间隔")
	# 转向率刻意有限：太强就变成无脑挂机，弱了就没意义
	assert_gt(ShipTable.MISSILE_TURN, 0.5, "转向率过低会让导弹几乎打不中")
	assert_lt(ShipTable.MISSILE_TURN, 8.0, "转向率过高会让导弹变成自动命中")