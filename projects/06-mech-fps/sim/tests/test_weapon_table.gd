extends GutTest

## 武器数值表的设计约束断言。这些不是「跑通就行」的测试——
## 每条断言都对应 docs/06-立项 §2.2 里一句设计意图，改数值必须先过这里。

const CLOSE := 4.0
const MID := 15.0
const FAR := 45.0


func test_falloff_is_monotonic_non_increasing() -> void:
	for id in WeaponTable.ids():
		var prev := 1.0
		for d in range(0, 160, 2):
			var f := WeaponTable.falloff(String(id), float(d))
			assert_lt(f, prev + 0.0001, "%s 在 %dm 处衰减回升" % [id, d])
			prev = f


func test_falloff_endpoints() -> void:
	for id in WeaponTable.ids():
		assert_eq(WeaponTable.falloff(String(id), 0.0), 1.0, "%s 零距应全额" % id)
		assert_almost_eq(
			WeaponTable.falloff(String(id), WeaponTable.field(String(id), "max_range")),
			WeaponTable.field(String(id), "min_mult"),
			0.0001,
			"%s 触底值应等于 min_mult" % id
		)


## 三把枪各有射程生态位：霰弹近距爆发 / 步枪中距持续 / 精确射手远距单发
func test_role_separation() -> void:
	assert_gt(WeaponTable.burst_damage("shotgun", CLOSE), WeaponTable.burst_damage("assault_rifle", CLOSE),
		"4m 处霰弹单发爆发必须最高")
	assert_gt(WeaponTable.dps("assault_rifle", MID), WeaponTable.dps("shotgun", MID),
		"15m 处步枪 DPS 必须压过霰弹")
	assert_gt(WeaponTable.dps("dmr_sniper", FAR), WeaponTable.dps("assault_rifle", FAR),
		"45m 处精确射手必须压过步枪")


## 蜂群贴脸前必须能秒掉，否则玩家无处可退（§2.2 的硬约束）
func test_drone_dies_fast() -> void:
	var pairs := [["assault_rifle", MID], ["shotgun", CLOSE], ["dmr_sniper", FAR]]
	for pair in pairs:
		var ttk := WeaponTable.time_to_kill(String(pair[0]), "drone", float(pair[1]))
		assert_lt(ttk, 0.65, "%s 打蜂群 TTK=%.3fs，必须 <0.65s" % [pair[0], ttk])


## 重装机甲是「需要处理的目标」，不是杂兵
func test_heavy_is_a_wall() -> void:
	for id in WeaponTable.ids():
		var dist := 25.0
		var ttk := WeaponTable.time_to_kill(String(id), "heavy", dist)
		assert_gt(ttk, 3.0, "%s 打重装 TTK=%.2fs 过短" % [id, ttk])
	assert_lt(WeaponTable.time_to_kill("dmr_sniper", "heavy", 60.0),
		WeaponTable.time_to_kill("assault_rifle", "heavy", 60.0),
		"60m 上精确射手必须比步枪更快解决重装，否则它没有存在理由")


func test_headshot_is_worth_aiming() -> void:
	for id in WeaponTable.ids():
		var body := WeaponTable.time_to_kill(String(id), "trooper", MID)
		var head := WeaponTable.time_to_kill(String(id), "trooper", MID, true)
		assert_lte(head, body, "%s 爆头不该更慢" % id)


func test_mag_and_reserve_sane() -> void:
	for id in WeaponTable.ids():
		var mag := int(WeaponTable.field(String(id), "mag_size"))
		var reserve := int(WeaponTable.field(String(id), "reserve"))
		assert_gt(mag, 0, "%s 弹匣必须为正" % id)
		assert_lte(mag, 40, "%s 弹匣过大，会削弱换弹节奏" % id)
		assert_gte(reserve, mag * 3, "%s 携弹量不足以撑过一波" % id)
		var per_mag := float(mag) / float(EnemyTable.shots_to_kill("trooper",
			WeaponTable.burst_damage(String(id), MID)))
		assert_gte(per_mag, 1.5, "%s 一匣打不倒 1.5 个射手，换弹会打断节奏" % id)


func test_unknown_id_is_rejected() -> void:
	assert_false(WeaponTable.has_id("laser_cannon"), "未登记的武器不该存在")
	assert_false(EnemyTable.has_type("boss"), "未登记的敌型不该存在")
