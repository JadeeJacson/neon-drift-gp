extends GutTest

## EnemyAi：状态转换必须由交战几何决定（headless 可断言的意图层）。


func test_interceptor_states_by_distance() -> void:
	var far := EnemyAi.decide("interceptor", 400.0, 1.0, 0.0)
	assert_eq(far["mode"], "APPROACH", "远距应接近")
	assert_eq(far["fire"], false, "接近中不该开火")
	var mid := EnemyAi.decide("interceptor", 110.0, 1.0, 0.0)
	assert_eq(mid["mode"], "ENGAGE", "中距应缠斗")
	assert_eq(mid["fire"], true, "缠斗必须开火")
	assert_ne(float(mid["strafe"]), 0.0, "缠斗必须有侧移")
	var close := EnemyAi.decide("interceptor", 50.0, 1.0, 0.0)
	assert_eq(close["mode"], "EVADE", "贴太近应拉开")
	assert_lt(float(close["thrust"]), 0.0, "拉开是负推力")


func test_interceptor_retreats_when_damaged() -> void:
	var hurt := EnemyAi.decide("interceptor", 100.0, 0.2, 0.0)
	assert_eq(hurt["mode"], "RETREAT", "低血应脱离")
	assert_eq(hurt["fire"], false, "脱离不恋战")


func test_bomber_keeps_distance() -> void:
	assert_eq(EnemyAi.decide("bomber", 400.0, 1.0, 0.0)["mode"], "APPROACH", "远距接近")
	assert_eq(EnemyAi.decide("bomber", 200.0, 1.0, 0.0)["mode"], "BOMBARD", "射程内轰炸")
	assert_eq(EnemyAi.decide("bomber", 200.0, 1.0, 0.0)["fire"], true, "轰炸要开火")
	assert_eq(EnemyAi.decide("bomber", 100.0, 1.0, 0.0)["mode"], "EVADE", "被贴脸后撤")


func test_drone_only_chases() -> void:
	assert_eq(EnemyAi.decide("drone", 300.0, 1.0, 0.0)["mode"], "CHASE", "远处只追")
	assert_eq(EnemyAi.decide("drone", 5.0, 1.0, 0.0)["mode"], "RAM", "贴脸即撞")
	assert_eq(EnemyAi.decide("drone", 5.0, 1.0, 0.0)["fire"], true, "撞角开火位")


func test_unknown_kind_holds() -> void:
	assert_eq(EnemyAi.decide("mystery", 100.0, 1.0, 0.0)["mode"], "HOLD", "未知型号不动作")


func test_strafe_alternates_over_time() -> void:
	var a := float(EnemyAi.decide("interceptor", 110.0, 1.0, 0.0)["strafe"])
	var b := float(EnemyAi.decide("interceptor", 110.0, 1.0, 4.5)["strafe"])
	assert_lt(a * b, 0.0, "绕飞方向应随时间交替，避免排队送死")
