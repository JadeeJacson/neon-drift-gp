extends RefCounted
class_name Targeting
## 索敌与敌我判定（纯函数）。
##
## 存在的意义：装配层原来把「玩家」当成唯一目标硬编码（EnemyController._player），
## 团队模式里 bot 的目标可能是另一个 bot。把「该打谁」抽成纯函数，就能在 --headless 下
## 逐帧断言（docs/00 §4.2），而不是等实跑才发现「队友互相开火」。
##
## 单位用 Dictionary 描述：`{"team": int, "pos": Vector3, "alive": bool}`。
## 刻意不要求是 Node——场景层只负责把真实的 EnemyController / Player 映射成这三个字段。

## 超过这个距离就当没看见。运输船是狭长图（约 20×60 m，对角线 ~63 m），
## 取 55 是「船头基本看不见船尾」，逼 bot 往前压而不是隔图对枪。
const ACQUIRE_RANGE := 55.0

## 朝向锥：`facing · to >= FOV_COS` 才算看得见。0.2 ≈ ±78°，
## 比半圆略窄——身后被打不会立刻还手，符合「要转身」的观感。
const FOV_COS := 0.2


static func hostile(team_a: int, team_b: int) -> bool:
	return team_a != team_b


## 伤害能不能落在对方身上。友伤关闭时，同队互打应当**完全不结算**（不是结算 0 点，
## 而是射线直接跳过），否则子弹会被队友身体挡住却看不出原因。
static func can_damage(attacker_team: int, victim_team: int) -> bool:
	return hostile(attacker_team, victim_team) or TeamTable.FRIENDLY_FIRE


## 返回 units 里该打的**下标**，没有目标返回 -1。
## 平票保留先出现的下标（而不是看浮点比较结果），这样多帧重跑结果一致——
## 团队模式的统计断言要求确定性，不能每次跑出不同人。
static func acquire(units: Array, team: int, from: Vector3, facing: Vector3,
		max_range: float = ACQUIRE_RANGE) -> int:
	assert(max_range > 0.0, "max_range 必须为正")
	var best := -1
	var best_dist := INF
	for i in range(units.size()):
		var u: Dictionary = units[i]
		if not bool(u.get("alive", true)):
			continue
		if not hostile(team, int(u.get("team", 0))):
			continue
		var to: Vector3 = (u.get("pos", Vector3.ZERO) as Vector3) - from
		var dist := to.length()
		if dist > max_range or dist <= 0.0001:
			continue
		# facing 传零向量 = 不做朝向判定（纯距离断言与「被背后偷袭」的场景要用）
		if facing.length_squared() > 0.0001:
			if facing.normalized().dot(to.normalized()) < FOV_COS:
				continue
		if dist < best_dist - 0.0001:
			best_dist = dist
			best = i
	return best
