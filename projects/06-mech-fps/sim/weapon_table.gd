extends RefCounted
class_name WeaponTable
## 首发 3 把武器的数值表（docs/06-立项 §2.2）。纯数据 + 纯函数，逐帧可比，归 §4.2 覆盖。
##
## 设计约束（写测试时按这些断言，不是随手填的数）：
## - 三把枪各有明确射程生态位：霰弹近距爆发 / 步枪中距持续 / 精确射手远距单发。
## - 对 drone(45HP) 的任何武器 TTK 必须 < 0.6s：蜂群贴脸前必须能秒掉，否则玩家无处可退。
## - 对 heavy(640HP, 25% 护甲) 的 TTK 必须 > 4s：重装机甲是「需要处理的目标」而非杂兵。

const WEAPONS := {
	"assault_rifle": {
		"display": "突击步枪",
		"damage": 17.0,
		"pellets": 1,
		"rpm": 620.0,
		"mag_size": 32,
		"reload_time": 2.0,
		"head_mult": 2.0,
		"full_range": 18.0,
		"max_range": 60.0,
		"min_mult": 0.55,
		"reserve": 192,
		## 射击模式：步枪全自动（按住连发），霰弹泵动、精确射手半自动（一发一按）。
		## 这是手感生态位的一部分——如果三把都能按住连发，单发伤害高的那把就没有存在理由。
		"fire_mode": "auto",
		# 反馈强度（CameraShake 消费）。设计口径：步枪靠射速堆压迫，单发反馈必须小，
		# 否则连射时画面一直微抖；霰弹是「一发的艺术」，单发反馈最重。
		"recoil": 0.05,
		"fov_kick": 1.5,
		"hitstop": 0.0,
	},
	"shotgun": {
		"display": "霰弹枪",
		"damage": 11.0,
		"pellets": 9,
		"rpm": 100.0,
		"mag_size": 7,
		"reload_time": 2.7,
		"head_mult": 1.5,
		"full_range": 6.0,
		"max_range": 25.0,
		"min_mult": 0.25,
		"reserve": 56,
		"fire_mode": "pump",
		"recoil": 0.26,
		"fov_kick": 4.0,
		"hitstop": 0.045,
	},
	"dmr_sniper": {
		"display": "精确射手步枪",
		"damage": 68.0,
		"pellets": 1,
		"rpm": 192.0,
		"mag_size": 10,
		"reload_time": 2.5,
		"head_mult": 2.4,
		"full_range": 50.0,
		"max_range": 150.0,
		"min_mult": 0.85,
		"reserve": 70,
		"fire_mode": "semi",
		"recoil": 0.16,
		"fov_kick": 3.0,
		"hitstop": 0.03,
	},
}


static func has_id(id: String) -> bool:
	return WEAPONS.has(id)


static func display(id: String) -> String:
	assert(WEAPONS.has(id), "未知武器: " + id)
	return String(WEAPONS[id]["display"])


## "auto" 按住连发 / "semi" 一发一按 / "pump" 泵动（比 semi 更长的射击间隔）
static func fire_mode(id: String) -> String:
	assert(WEAPONS.has(id), "未知武器: " + id)
	return String(WEAPONS[id]["fire_mode"])


static func is_automatic(id: String) -> bool:
	return fire_mode(id) == "auto"


static func field(id: String, key: String) -> float:
	assert(WEAPONS.has(id), "未知武器: " + id)
	# 键名写错时 Dictionary 取值会静默返回 0 并污染整条数值链，这里必须炸出来。
	assert(WEAPONS[id].has(key), "未知字段: %s.%s" % [id, key])
	return float(WEAPONS[id][key])


static func fire_interval(id: String) -> float:
	return 60.0 / field(id, "rpm")


## 距离衰减：<=full_range 全额，>=max_range 触底 min_mult，中间线性插值。
## 单调不增是硬要求——衰减曲线一旦非单调，玩家会算不出「该站哪」。
static func falloff(id: String, distance: float) -> float:
	var full := field(id, "full_range")
	var maxr := field(id, "max_range")
	var min_mult := field(id, "min_mult")
	assert(maxr > full, "max_range 必须大于 full_range")
	if distance <= full:
		return 1.0
	if distance >= maxr:
		return min_mult
	var t := (distance - full) / (maxr - full)
	return 1.0 + (min_mult - 1.0) * t


static func burst_damage(id: String, distance: float) -> float:
	return field(id, "damage") * int(field(id, "pellets")) * falloff(id, distance)


static func dps(id: String, distance: float) -> float:
	return burst_damage(id, distance) / fire_interval(id)


static func time_to_kill(id: String, enemy_type: String, distance: float, headshot: bool = false) -> float:
	var per_shot := burst_damage(id, distance)
	var shots := EnemyTable.shots_to_kill(enemy_type, per_shot, headshot, field(id, "head_mult"))
	return float(shots) * fire_interval(id)


static func ids() -> Array:
	return WEAPONS.keys()
