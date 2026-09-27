extends RefCounted
class_name EnemyAi
## 敌机意图状态机（纯函数）：输入交战几何，输出意图。
## 渲染层只负责把意图变成位移与开火——AI 本身 headless 可断言（06 §2.5 的经验）。
##
## 返回 {mode: String, thrust: float (-1..1 机头方向推力),
##        strafe: float (-1..1 侧移), fire: bool}

## t 用于绕飞相位（同一状态左右交替，避免全队同向排队）。
static func decide(kind: String, dist: float, hp_frac: float, t: float) -> Dictionary:
	if not ShipTable.ENEMIES.has(kind):
		return _hold("HOLD", 0.0, 0.0, false)
	var approach := float(ShipTable.field(kind, "approach_dist"))
	var engage_min := float(ShipTable.field(kind, "engage_min"))
	var dir := 1.0 if int(floor(t / 3.0)) % 2 == 0 else -1.0

	match kind:
		"interceptor":
			if hp_frac < 0.3:
				return _hold("RETREAT", -0.6, 0.0, false)
			if dist > approach:
				return _hold("APPROACH", 1.0, 0.0, false)
			if dist < engage_min:
				return _hold("EVADE", -0.4, dir, true)
			return _hold("ENGAGE", 0.2, dir, true)
		"bomber":
			if hp_frac < 0.3 and dist < approach:
				return _hold("RETREAT", -0.8, 0.0, true)
			if dist > approach:
				return _hold("APPROACH", 1.0, 0.0, false)
			if dist < engage_min:
				return _hold("EVADE", -0.8, dir, true)
			return _hold("BOMBARD", 0.0, dir * 0.3, true)
		"drone":
			# 无人机只有一个念头：贴脸。
			if dist > float(ShipTable.field(kind, "engage_min")):
				return _hold("CHASE", 1.0, dir * 0.2, false)
			return _hold("RAM", 1.0, 0.0, true)
	return _hold("HOLD", 0.0, 0.0, false)


static func _hold(mode: String, thrust: float, strafe: float, fire: bool) -> Dictionary:
	return {"mode": mode, "thrust": thrust, "strafe": strafe, "fire": fire}
