extends RefCounted
class_name EnemyAI
## 敌型状态机（docs/06-立项 §2.3）。纯决策函数：给观测、出意图，不碰节点、不碰物理。
## 寻路不在这一层——本层只输出「前进/后退/搜索」意图，位移由场景层负责（§4.3 的分工线）。

const DEAD := "dead"
const STAGGER := "stagger"
const IDLE := "idle"
const ADVANCE := "advance"
const ENGAGE := "engage"
const BACK_OFF := "back_off"
const REPOSITION := "reposition"
const SEARCH := "search"

## 交战距离带 [min, max]（米）。max = attack_range；min 是「太近了要拉开」的阈值。
## 近身型（drone/charger）的 min=0，它们不该后退。
static func distance_band(type: String) -> Array:
	var range_max := EnemyTable.field(type, "attack_range")
	match type:
		"drone", "charger":
			return [0.0, range_max]
		"trooper":
			return [range_max * 0.45, range_max]
		"heavy":
			return [EnemyTable.field(type, "preferred_distance"), range_max]
		_:
			assert(false, "未知敌型: " + type)
			return []


## obs 必需字段：distance / has_los / attack_ready / hp_ratio / cover_available / stagger_left
static func decide(type: String, obs: Dictionary) -> Dictionary:
	for key in ["distance", "has_los", "attack_ready", "hp_ratio", "cover_available", "stagger_left"]:
		assert(obs.has(key), "观测缺少字段: " + key)

	if float(obs.hp_ratio) <= 0.0:
		return _out(DEAD, 0, false)
	if float(obs.stagger_left) > 0.0:
		return _out(STAGGER, 0, false)

	var distance := float(obs.distance)
	var los := bool(obs.has_los)
	var band := distance_band(type)
	var lo := float(band[0])
	var hi := float(band[1])

	match type:
		"drone", "charger":
			if los and distance <= hi:
				return _out(ENGAGE, 0, bool(obs.attack_ready))
			if los:
				return _out(ADVANCE, 1, false)
			return _out(SEARCH, 1, false)
		"trooper":
			if not los:
				# 失去视野：太近就先拉开，否则朝最后已知位置逼近
				if distance < lo:
					return _out(BACK_OFF, -1, false)
				return _out(SEARCH, 1, false)
			if distance < lo:
				if bool(obs.cover_available) and float(obs.hp_ratio) < 0.35:
					return _out(REPOSITION, -1, false)
				return _out(BACK_OFF, -1, false)
			if distance > hi:
				return _out(ADVANCE, 1, false)
			return _out(ENGAGE, 0, bool(obs.attack_ready))
		"heavy":
			# 重装是移动靶：超出压制带就推进，带内持续火力，不找掩体
			if distance > hi:
				return _out(ADVANCE, 1, false)
			return _out(ENGAGE, 0, bool(obs.attack_ready))
		_:
			assert(false, "未知敌型: " + type)
			return _out(IDLE, 0, false)


## move: +1 前进 / -1 后退 / 0 原地。场景层用它与位移向量对齐。
static func _out(state: String, move: int, fire: bool) -> Dictionary:
	return {"state": state, "move": move, "fire": fire}


static func is_agggressive(state: String) -> bool:
	return state in [ADVANCE, ENGAGE, SEARCH]
