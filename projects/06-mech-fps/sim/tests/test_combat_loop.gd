extends GutTest

## 资源循环断言：把「鼓励进攻而非龟缩」落成数字（docs/06-立项 §2.2）。
## 核心红线：最优进攻循环的弹药自给率也必须 <1，否则弹药系统失去意义；
## 同时自给率不能贴近 0，否则「进攻有回报」是句空话。

const MIX := ["drone", "drone", "charger", "trooper", "heavy"]
const SEED := 20260926


static func _run(weapon: String, enemies: Array, aggression: float,
		execution_rate: float, head_rate: float = 0.0) -> Dictionary:
	return CombatLoop.simulate({
		"weapon": weapon,
		"enemies": enemies,
		"aggression": aggression,
		"head_rate": head_rate,
		"execution_rate": execution_rate,
		"start_ammo": 400,
		"seed": SEED,
	})


func test_aggression_pays_off_in_time() -> void:
	var turtle := _run("assault_rifle", MIX, 0.15, 0.5)
	var rusher := _run("assault_rifle", MIX, 1.0, 0.5)
	assert_lt(float(rusher.seconds_per_kill), float(turtle.seconds_per_kill),
		"贴脸打应该更快：rusher %.3fs vs turtle %.3fs"
		% [rusher.seconds_per_kill, turtle.seconds_per_kill])


func test_aggression_pays_off_in_ammo() -> void:
	var turtle := _run("assault_rifle", MIX, 0.15, 1.0)
	var rusher := _run("assault_rifle", MIX, 1.0, 1.0)
	assert_gt(float(rusher.self_sufficiency), float(turtle.self_sufficiency),
		"贴脸打的回弹率应更高（处决门槛把回报绑在风险上）")
	assert_gt(int(rusher.executions), int(turtle.executions))


## 红线：弹药不能完全自给自足，也不能毫无回报
func test_self_sufficiency_stays_in_band() -> void:
	var best := _run("assault_rifle", MIX, 1.0, 1.0)
	var worst := _run("assault_rifle", MIX, 0.15, 0.0)
	assert_lt(float(best.self_sufficiency), 0.95,
		"最优进攻循环自给率 %.2f，接近无限弹药，需下调回弹" % best.self_sufficiency)
	assert_gt(float(worst.self_sufficiency), 0.15,
		"龟缩流自给率 %.2f 过低，击杀回弹形同虚设" % worst.self_sufficiency)


## 蜂群是杂兵：击杀它不该给回复（处决资格绑定威胁值）
func test_farming_drones_heals_nothing() -> void:
	var result := _run("assault_rifle", ["drone", "drone", "drone"], 1.0, 1.0)
	assert_eq(float(result.health_gained), 0.0, "刷蜂群不该回血")
	assert_eq(int(result.executions), 0, "蜂群 threat 低于处决门槛")


func test_health_only_from_executions() -> void:
	var no_exec := _run("assault_rifle", MIX, 1.0, 0.0)
	var exec := _run("assault_rifle", MIX, 1.0, 1.0)
	assert_eq(float(no_exec.health_gained), 0.0, "没处决就不该有回复")
	assert_gt(float(exec.health_gained), 0.0, "处决必须给回复，否则进攻无意义")


## 武器生态位的代价：霰弹秒蜂群但浪费严重
func test_shotgun_overkill_waste_is_real() -> void:
	var drones := ["drone", "drone", "drone"]
	var scatter := _run("shotgun", drones, 0.6, 0.0)
	var rifle := _run("assault_rifle", drones, 0.6, 0.0)
	assert_gt(float(scatter.overkill_ratio), float(rifle.overkill_ratio),
		"霰弹打 45HP 蜂群的浪费必须高于步枪，否则它该全面替代步枪")


func test_heavy_is_the_time_sink() -> void:
	var heavy_only := _run("assault_rifle", ["heavy"], 0.5, 0.0)
	var trooper_only := _run("assault_rifle", ["trooper"], 0.5, 0.0)
	assert_gt(float(heavy_only.seconds_per_kill), float(trooper_only.seconds_per_kill) * 3.0,
		"重装耗时应是射手的数倍量级")


func test_ample_ammo_avoids_resupply() -> void:
	var result := _run("assault_rifle", MIX, 0.5, 0.5)
	assert_eq(int(result.resupplies), 0, "400 发携弹不该打空")
	assert_gt(int(result.reloads), 0, "5 个目标内至少换弹一次，否则弹匣过大")


func test_headshot_reduces_shots() -> void:
	var body := _run("dmr_sniper", ["trooper"], 0.5, 0.0, 0.0)
	var aimed := _run("dmr_sniper", ["trooper"], 0.5, 0.0, 1.0)
	assert_lt(int(aimed.shots), int(body.shots), "瞄准头部必须省弹")
