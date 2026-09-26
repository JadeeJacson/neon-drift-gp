extends GutTest

## 敌型数值表断言：编制梯度与护甲口径。

const REQUIRED := [
	"hp", "speed", "attack_range", "attack_damage", "attack_interval",
	"preferred_distance", "armor", "threat", "reward_ammo", "reward_health", "anim"
]


func test_all_types_have_full_fields() -> void:
	for type in EnemyTable.all_types():
		for key in REQUIRED:
			assert_true(EnemyTable.TYPES[type].has(String(key)), "%s 缺字段 %s" % [type, key])


func test_power_gradient() -> void:
	assert_lt(EnemyTable.hp("drone"), EnemyTable.hp("charger"), "蜂群应比四足脆")
	assert_lt(EnemyTable.hp("charger"), EnemyTable.hp("trooper"), "四足应比射手脆")
	assert_lt(EnemyTable.hp("trooper"), EnemyTable.hp("heavy"), "射手应比重装脆")
	assert_eq(EnemyTable.threat("drone"), 6.0, "蜂群威胁成本")
	assert_gt(EnemyTable.threat("heavy"), EnemyTable.threat("trooper") * 3.0, "重装必须是量级差异")
	assert_gt(EnemyTable.field("charger", "speed"), EnemyTable.field("heavy", "speed"),
		"速度梯度：冲锋型快、重装慢")


func test_armor_formula() -> void:
	# heavy 护甲 25%：100 点等效 75
	assert_almost_eq(EnemyTable.effective_damage("heavy", 100.0, false, 2.0), 75.0, 0.001)
	# 爆头在护甲之前结算：100 * 2.0 * 0.75 = 150
	assert_almost_eq(EnemyTable.effective_damage("heavy", 100.0, true, 2.0), 150.0, 0.001)


func test_shots_to_kill_monotonic() -> void:
	var weak := EnemyTable.shots_to_kill("trooper", 10.0)
	var strong := EnemyTable.shots_to_kill("trooper", 50.0)
	assert_gt(weak, strong, "单发伤害越高，所需弹数必须越少")
	assert_eq(EnemyTable.shots_to_kill("drone", 45.0), 1, "恰好等于血量应一发带走")


## 处决资格的资源侧前提：杂兵的回报必须明显低于高危目标
func test_reward_scale_follows_threat() -> void:
	assert_lt(EnemyTable.field("drone", "reward_ammo"), EnemyTable.field("trooper", "reward_ammo"))
	assert_lt(EnemyTable.field("trooper", "reward_ammo"), EnemyTable.field("heavy", "reward_ammo"))
	assert_eq(EnemyTable.field("drone", "reward_health"), 0.0, "蜂群不该回血")


func test_anim_source_matches_manifest() -> void:
	# 与 assets/ASSET_MANIFEST.md 对齐：trooper/drone 用 GLB 内置动画，charger/heavy 走程序化
	assert_eq(String(EnemyTable.TYPES["trooper"]["anim"]), "glb")
	assert_eq(String(EnemyTable.TYPES["drone"]["anim"]), "glb")
	assert_eq(String(EnemyTable.TYPES["charger"]["anim"]), "procedural")
	assert_eq(String(EnemyTable.TYPES["heavy"]["anim"]), "procedural")
