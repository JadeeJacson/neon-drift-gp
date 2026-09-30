extends GutTest
## 成就表的回归：判定是纯函数，所以「什么时候响、响几次」全部能在 headless 里钉死。

const A := preload("res://sim/achievements.gd")


func test_table_is_self_consistent() -> void:
	var problems: Array = A.validate()
	assert_eq(problems.size(), 0, "成就表自检失败：" + str(problems))


func test_unlock_happens_at_exact_threshold() -> void:
	# 9 次不该响、10 次该响：阈值边界是成就最容易写错的地方（>= 与 > 之差）
	assert_eq(A.evaluate({"parries": 9}, {}).size(), 0, "9 次弹反不该解锁")
	var fresh: Array[String] = A.evaluate({"parries": 10}, {})
	assert_true(fresh.has("parry_10"), "10 次弹反应解锁「读招者」")
	fresh = A.evaluate({"parries": 59}, {})
	# 59 次应该只解锁第一档（10），不能提前解锁第二档（60）
	assert_true(fresh.has("parry_10"), "59 次仍应解锁已达成的第一档")
	assert_false(fresh.has("parry_60"), "59 次不该解锁「刀尖舞者」")
	fresh = A.evaluate({"parries": 60}, {})
	assert_true(fresh.has("parry_60"), "60 次应解锁「刀尖舞者」")


func test_already_unlocked_never_repeats() -> void:
	# 重复弹窗比不弹窗更烦：一次通关会被同一成就刷屏
	var fresh: Array[String] = A.evaluate({"kills": 500}, {"kill_100": true})
	assert_eq(fresh.has("kill_100"), false, "已解锁的不能再返回")


func test_high_tier_implies_low_tier() -> void:
	# 同一条线必须单调：一次跳很高时，低级的也要一起达成（不能出现「只有高级没有低级」）
	var fresh: Array[String] = A.evaluate({"parries": 200}, {})
	assert_true(fresh.has("parry_10") and fresh.has("parry_60") and fresh.has("parry_200"),
			"200 次弹反应一次解锁整条线：%s" % str(fresh))


func test_progress_is_bounded_and_monotone() -> void:
	var def: Dictionary = A.by_id("kill_100")
	assert_between(A.progress(def, {"kills": 0}), 0.0, 0.001, "0 只时进度应为 0")
	assert_between(A.progress(def, {"kills": 50}), 0.49, 0.51, "50/100 应约等于 0.5")
	assert_between(A.progress(def, {"kills": 999}), 0.999, 1.0, "超量要夹在 1.0，进度条不能溢出")


func test_room_extras_only_fire_when_earned() -> void:
	# 无伤层：必须真的没受伤，而且不能是第 0 层（开局那层没有「打过」的概念）
	var extras: Dictionary = A.run_extras({"index": 3, "damage_taken": 0,
			"seconds": 31.0, "kills": 4, "shots": 2})
	assert_true(extras.has("flawless_rooms"), "无伤通过一层应记一次")
	assert_false(extras.has("fast_rooms"), "31 秒不该算快潜")
	assert_false(extras.has("melee_only_runs"), "开过远程不该算近身派")

	extras = A.run_extras({"index": 0, "damage_taken": 0, "seconds": 5.0, "kills": 0, "shots": 0})
	assert_false(extras.has("flawless_rooms"), "第 0 层不结算无伤")
	assert_true(extras.has("fast_rooms"), "5 秒过层应算快潜")

	extras = A.run_extras({"index": 2, "damage_taken": 1, "seconds": 90.0,
			"kills": 31, "shots": 0})
	assert_false(extras.has("flawless_rooms"), "受过伤就不算无伤")
	assert_true(extras.has("melee_only_runs"), "杀 31 只且零远程应算近身派")


func test_ids_are_resolvable() -> void:
	for d in A.defs():
		assert_false(A.by_id(str(d["id"])).is_empty(), "表内 id 必须能反查：" + str(d["id"]))
	assert_true(A.by_id("不存在的成就").is_empty(), "查不到的 id 应返回空字典而不是崩")
