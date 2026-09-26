extends GutTest

## 状态机断言。重点不是「有没有反应」，而是「会不会抖」——
## 练习期 04 的教训：AI 在两个状态间来回跳 = 玩家看到的鬼畜。

static func _obs(distance: float, los: bool = true, ready: bool = true,
		hp_ratio: float = 1.0, cover: bool = false, stagger: float = 0.0) -> Dictionary:
	return {
		"distance": distance,
		"has_los": los,
		"attack_ready": ready,
		"hp_ratio": hp_ratio,
		"cover_available": cover,
		"stagger_left": stagger,
	}


func test_dead_and_stagger_take_priority() -> void:
	assert_eq(EnemyAI.decide("trooper", _obs(20.0, true, true, 0.0)).state, EnemyAI.DEAD)
	assert_eq(EnemyAI.decide("drone", _obs(1.0, true, true, 1.0, false, 0.3)).state, EnemyAI.STAGGER)
	assert_false(EnemyAI.decide("drone", _obs(1.0, true, true, 1.0, false, 0.3)).fire,
		"硬直中不该开火")


func test_melee_units_charge() -> void:
	var far := EnemyAI.decide("charger", _obs(18.0))
	assert_eq(far.state, EnemyAI.ADVANCE)
	assert_eq(int(far.move), 1, "远距应前进")
	var close := EnemyAI.decide("charger", _obs(2.0))
	assert_eq(close.state, EnemyAI.ENGAGE)
	assert_true(bool(close.fire), "进入攻击距离就该出手")
	assert_eq(int(close.move), 0, "已到位不该继续前进")


## 蜂群丢了视野也要往前压（它是自杀式单位，不会搜索）
func test_drone_blind_still_pushes() -> void:
	var blind := EnemyAI.decide("drone", _obs(12.0, false))
	assert_eq(blind.state, EnemyAI.SEARCH)
	assert_eq(int(blind.move), 1)


func test_trooper_keeps_band() -> void:
	var band := EnemyAI.distance_band("trooper")
	assert_lt(float(band[0]), float(band[1]), "距离带必须 lo < hi")
	assert_eq(EnemyAI.decide("trooper", _obs(40.0)).state, EnemyAI.ADVANCE, "带外太远→逼近")
	assert_eq(EnemyAI.decide("trooper", _obs(8.0)).state, EnemyAI.BACK_OFF, "贴脸→拉开")
	assert_eq(EnemyAI.decide("trooper", _obs(20.0)).state, EnemyAI.ENGAGE, "带内→交战")
	assert_eq(int(EnemyAI.decide("trooper", _obs(8.0)).move), -1, "拉开方向应为 -1")


## 残血 + 有掩体 + 被贴脸 = 重新占位，不是站桩对射
func test_trooper_uses_cover_when_hurt() -> void:
	var hurt := EnemyAI.decide("trooper", _obs(8.0, true, true, 0.3, true))
	assert_eq(hurt.state, EnemyAI.REPOSITION)
	var hurt_no_cover := EnemyAI.decide("trooper", _obs(8.0, true, true, 0.3, false))
	assert_eq(hurt_no_cover.state, EnemyAI.BACK_OFF, "没掩体就只是拉开，不该进占位状态")


func test_trooper_blind_approaches_or_retreats() -> void:
	assert_eq(EnemyAI.decide("trooper", _obs(6.0, false)).state, EnemyAI.BACK_OFF,
		"丢视野且太近，先拉开")
	assert_eq(EnemyAI.decide("trooper", _obs(30.0, false)).state, EnemyAI.SEARCH,
		"丢视野且距离安全，朝最后已知位置逼近")


func test_heavy_pressures_but_walks_slowly() -> void:
	assert_eq(EnemyAI.decide("heavy", _obs(60.0)).state, EnemyAI.ADVANCE)
	assert_eq(EnemyAI.decide("heavy", _obs(35.0)).state, EnemyAI.ENGAGE)
	assert_false(EnemyAI.is_agggressive(EnemyAI.REPOSITION), "重装不该找掩体")


## 收敛性：从远到近积分推进，必须稳定停在交战态，不得来回跳
func test_no_state_oscillation() -> void:
	for type in ["drone", "charger", "trooper", "heavy"]:
		var distance := 60.0
		var speed := EnemyTable.field(String(type), "speed")
		var reached := false
		var stable_steps := 0
		var last := ""
		for _step in range(400):
			var decision := EnemyAI.decide(String(type), _obs(distance))
			var state := String(decision.state)
			if state == EnemyAI.ENGAGE:
				stable_steps += 1
				if stable_steps >= 10:
					reached = true
					break
			elif state != last:
				stable_steps = 0
			last = state
			# move=+1 逼近、-1 拉开、0 原地（交战时距离保持不变）
			distance -= float(decision.move) * speed * 0.1
			distance = maxf(distance, 0.5)
		assert_true(reached, "%s 未能在 400 步内稳定进入交战（末距 %.1fm）" % [type, distance])
