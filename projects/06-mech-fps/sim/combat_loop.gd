extends RefCounted
class_name CombatLoop
## 资源循环的抽象模型（docs/06-立项 §2.2 的「DOOM Eternal 式简化版」）。
## 存在的意义：把「鼓励进攻而非龟缩」写成可断言的数，而不是设计口号。
## 纯数学模拟，不碰位移精度，因此可逐弹比对（§4.2）。

## 处决 = 近距离内击杀**有威胁的目标**（对应「处决/特定击杀回资源」）。
## 三条门槛缺一不可，否则资源循环会退化成「刷蜂群无限弹药」：
##   1) 距离 <= EXECUTION_RANGE：玩家必须冒险贴脸；
##   2) threat >= EXECUTION_MIN_THREAT：杂兵不给处决回报；
##   3) 回弹倍率受上限约束，满最优也不自给（见 §4.2 的断言）。
const EXECUTION_RANGE := 7.0
const EXECUTION_AMMO_MULT := 1.4
const EXECUTION_MIN_THREAT := 12.0

## 补给点兜底：弹池打空时按开局的一半补满，用来统计「打光了一次携弹量」的次数。
const RESUPPLY_FRACTION := 0.5


## 进攻性(0..1)决定实际交火距离：越愿意往前压，距离越近，伤害效率越高，
## 且只有压到 EXECUTION_RANGE 内才有处决资格——这三条是同一根杠杆，也就是「进攻有回报」的机制本体。
## 2.0 米是下限——再近就站进敌人碰撞体里，物理层会抖。
static func engagement_distance(type: String, aggression: float) -> float:
	var band := EnemyAI.distance_band(type)
	var anchor := maxf(float(band[1]) * 0.75, 4.0)
	return maxf(anchor * (1.0 - 0.85 * aggression), 2.0)


## run 字段：weapon / enemies(Array[String]) / aggression / head_rate / execution_rate
##            / start_ammo / seed
static func simulate(run: Dictionary) -> Dictionary:
	for key in ["weapon", "enemies", "aggression", "head_rate", "execution_rate", "start_ammo", "seed"]:
		assert(run.has(key), "simulate 缺少字段: " + key)

	var weapon := String(run.weapon)
	var aggression := float(run.aggression)
	var head_rate := float(run.head_rate)
	var execution_rate := float(run.execution_rate)
	var rng := SimRng.new(int(run.seed))

	var mag_size := int(WeaponTable.field(weapon, "mag_size"))
	var reload_time := WeaponTable.field(weapon, "reload_time")
	var interval := WeaponTable.fire_interval(weapon)

	var pool := float(run.start_ammo)
	var mag_left := float(mag_size)
	var shots := 0
	var reloads := 0
	var resupplies := 0
	var elapsed := 0.0
	var ammo_refilled := 0.0
	var health_gained := 0.0
	var executions := 0
	var overkill := 0.0

	for raw_type in run.enemies:
		var type := String(raw_type)
		var dist := engagement_distance(type, aggression)
		var burst := WeaponTable.burst_damage(weapon, dist)
		var headshot := rng.roll(head_rate)
		var need := EnemyTable.shots_to_kill(type, burst, headshot, WeaponTable.field(weapon, "head_mult"))
		var eff := EnemyTable.effective_damage(type, burst, headshot, WeaponTable.field(weapon, "head_mult"))

		for _s in range(need):
			if mag_left <= 0.0:
				if pool <= 0.0:
					resupplies += 1
					pool = float(run.start_ammo) * RESUPPLY_FRACTION
				reloads += 1
				elapsed += reload_time
				mag_left = float(mag_size)
			mag_left -= 1.0
			pool -= 1.0
			shots += 1
			elapsed += interval

		overkill += maxf(0.0, eff * float(need) - EnemyTable.hp(type)) / EnemyTable.hp(type)

		var reward := EnemyTable.field(type, "reward_ammo")
		var heal := EnemyTable.field(type, "reward_health")
		if _can_execute(type, dist) and rng.roll(execution_rate):
			executions += 1
			reward *= EXECUTION_AMMO_MULT
		else:
			heal = 0.0
		ammo_refilled += reward
		health_gained += heal
		pool += reward

	var kills: int = run.enemies.size()
	return {
		"weapon": weapon,
		"kills": kills,
		"shots": shots,
		"reloads": reloads,
		"resupplies": resupplies,
		"elapsed": elapsed,
		"seconds_per_kill": elapsed / float(maxi(1, kills)),
		"ammo_spent": float(shots),
		"ammo_refilled": ammo_refilled,
		"self_sufficiency": ammo_refilled / maxf(float(shots), 1.0),
		"health_gained": health_gained,
		"executions": executions,
		"overkill_ratio": overkill / float(maxi(1, kills)),
		"end_pool": pool,
	}


## 是否具备处决资格（不含 execution_rate 抽样）。
static func _can_execute(type: String, dist: float) -> bool:
	return dist <= EXECUTION_RANGE and EnemyTable.threat(type) >= EXECUTION_MIN_THREAT
