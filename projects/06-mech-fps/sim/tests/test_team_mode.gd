extends GutTest

## 团队模式地基断言：阵营判定、胜负条件、索敌。
## 这三样在装配层改之前必须先立住——「队友互相开火」「比分永远打不满」
## 这类问题一旦进了场景层，就只能靠实跑肉眼发现（上一轮就是这么翻车的）。

const A := TeamTable.TEAM_A
const B := TeamTable.TEAM_B


func _unit(team: int, x: float, alive: bool = true) -> Dictionary:
	return {"team": team, "pos": Vector3(x, 0.0, 0.0), "alive": alive}


func test_match_not_over_early() -> void:
	assert_eq(TeamTable.winner(3, 2, 12.0), -1, "刚开局不该判胜负")
	assert_false(TeamTable.is_over(3, 2, 12.0))


func test_first_to_kills_to_wins() -> void:
	assert_eq(TeamTable.winner(TeamTable.KILLS_TO_WIN, 12, 100.0), A, "先到分的一方赢")
	assert_eq(TeamTable.winner(12, TeamTable.KILLS_TO_WIN, 100.0), B)


func test_time_limit_judges_by_margin() -> void:
	var t := TeamTable.TIME_LIMIT
	assert_eq(TeamTable.winner(9, 14, t), B, "时间到按分差判")
	assert_eq(TeamTable.winner(9, 9, t), 2, "时间到且同分算平局，不要随机判一方")


## 平局必须是**显式**结果而不是「谁索引小谁赢」：随机判胜会让后面的平衡性
## 断言测到噪声（同一套参数两次跑出不同胜负）。
func test_draw_is_not_a_coin_flip() -> void:
	assert_eq(TeamTable.winner(0, 0, TeamTable.TIME_LIMIT), 2)


func test_score_is_linear_in_kills() -> void:
	assert_eq(TeamTable.score_for(0), 0)
	assert_eq(TeamTable.score_for(7), 7 * TeamTable.SCORE_PER_KILL)


## 友伤默认关闭是设计口径，不是没做完：这条断言存在的意义是
## 「将来谁把它打开，必须同时给索敌与射线加队友遮挡判定」。
func test_friendly_fire_is_off_by_default() -> void:
	assert_false(TeamTable.FRIENDLY_FIRE, "开友伤前要先补队友遮挡判定")
	assert_false(Targeting.can_damage(A, A), "同队不能互相结算伤害")
	assert_true(Targeting.can_damage(A, B))
	assert_true(Targeting.hostile(A, B))
	assert_false(Targeting.hostile(B, B))


## 观察者统一站在原点朝 +X 看，所以「前方」的单位放在正 X 上。
const LOOK := Vector3(1, 0, 0)


func test_acquire_prefers_nearest_hostile() -> void:
	var units := [_unit(B, 30.0), _unit(B, 8.0), _unit(B, 15.0)]
	assert_eq(Targeting.acquire(units, A, Vector3.ZERO, LOOK), 1,
		"应打最近的那个敌人")


func test_acquire_skips_teammates_and_corpses() -> void:
	var units := [_unit(A, 5.0), _unit(B, 20.0, false)]
	assert_eq(Targeting.acquire(units, A, Vector3.ZERO, LOOK), -1,
		"队友与尸体都不能当目标")


func test_acquire_respects_range_and_cone() -> void:
	var far := [_unit(B, Targeting.ACQUIRE_RANGE + 5.0)]
	assert_eq(Targeting.acquire(far, A, Vector3.ZERO, LOOK), -1, "超出视距不算看见")
	var front := [_unit(B, 10.0)]
	assert_eq(Targeting.acquire(front, A, Vector3.ZERO, LOOK), 0, "正前方有目标")
	assert_eq(Targeting.acquire(front, A, Vector3.ZERO, -LOOK), -1,
		"背后 180° 的东西不该被「看见」")


## facing 传零向量表示关掉朝向判定——纯距离场景（比如听觉/受击唤醒）要用它。
func test_zero_facing_disables_cone_test() -> void:
	var behind := [_unit(B, -10.0)]
	assert_eq(Targeting.acquire([_unit(B, -10.0)], A, Vector3.ZERO, Vector3.ZERO), 0)


## 等距平票必须稳定落到同一个下标，否则多 seed 统计断言会飘。
func test_equal_distance_is_deterministic() -> void:
	var units := [_unit(B, 12.0), _unit(B, 12.0), _unit(B, 12.0)]
	for i in range(20):
		assert_eq(Targeting.acquire(units, A, Vector3.ZERO, LOOK), 0,
			"平票应始终取先出现的下标（第 %d 次不一致）" % i)
