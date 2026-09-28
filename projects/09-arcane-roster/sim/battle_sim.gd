extends RefCounted
class_name BattleSim
## 单场战斗的**定长 tick 数值模拟**。这是全作最关键的一个文件。
##
## 为什么自己写而不用 Godot 物理：docs/00 §4.3 已经判过——PhysicsServer 不保证跨次运行
## 逐帧一致，所以「同种子必然同结果」在物理层不成立，整局跑分就没法精确断言。
## 自走棋的战斗本来也不需要真实物理：单位只做「走一格 / 打一下 / 死掉」。
## 于是把它写成纯数值的定长 tick，**确定性由构造保证**，而不是靠祈祷。
##
## 分层纪律：sim 只输出 `events`（谁在第几 tick 打了谁、暴没暴击、谁死了），
## 场景层（scripts/battle_director.gd）只负责把这些事件演成动画与音效。
## 表现层**不允许**反过来影响 sim——一旦反向依赖，跑分的结论就不可信了。
##
## 数值设计的两个硬约束（tests 里断言）：
##   1. 伤害下限 1：否则高护甲单位会被「无限防」锁死，战斗永不结束。
##   2. 索敌只考虑射程内目标：射程外的目标会让单位反复横跳（抖动），
##      这是自走棋模拟器最常见的「看起来很蠢」的行为。

const TICK := 0.25              # 每 tick 0.25 秒
const MAX_TICKS := 480          # 120 秒硬上限，超时按剩余血量比判定
const DOT_INTERVAL := 0.5
const EVENT_CAP := 6000         # 事件日志上限，防止极端局面把内存吃满

var units: Array = []           # 全局下标 = 数组下标；我方 0..a-1，敌方 a..n-1
var events: Array = []
var tick: int = 0
var finished: bool = false
var winner: int = -1            # 0=我方胜 1=敌方胜
var timed_out: bool = false

var _rng: SimRng


## ally_defs: [{id, star, cell}]（UnitTable 的 id）
## enemy_defs: [{id, star, cell}]（EnemyTable 的 id）
## bonus: Traits.bonuses() 的结果，只作用于我方（敌方不吃羁绊）
func _init(ally_defs: Array, enemy_defs: Array, seed_value: int, bonus: Dictionary) -> void:
	_rng = SimRng.new(seed_value)
	for d in ally_defs:
		var def: Dictionary = d
		units.append(_make_unit(String(def["id"]), int(def["star"]), Board.ALLY, def["cell"], true, bonus))
	for d in enemy_defs:
		var def2: Dictionary = d
		units.append(_make_unit(String(def2["id"]), int(def2["star"]), Board.ENEMY, def2["cell"], false, {}))


## from_ally_table 决定**去哪张表查数值**（UnitTable 还是 EnemyTable），
## 阵营 is_ally 一律由 side 推导。**这两个概念必须分开**：召唤物 sk_minion 只存在于
## UnitTable，但敌方术士召唤出来的它效忠的是敌方。早期版本把两者合成一个 is_ally 参数，
## 于是「敌方召唤物」被标记成 is_ally=true —— 血条染成我方绿色、战功记在我方头上
## （docs/09-接手诊断 P0-3）。现在查表与阵营各走一条路，从类型上就不可能再犯。
func _make_unit(id: String, star: int, side: int, cell: Vector2i, from_ally_table: bool, bonus: Dictionary) -> Dictionary:
	var is_ally := side == Board.ALLY
	var base_hp := 0.0
	var base_atk := 0.0
	var base_armor := 0.0
	var base_interval := 0.0
	var base_crit := 0.0
	var base_dodge := 0.0
	var base_range := 0
	var base_crit_mult := 1.5
	var base_thorns := 0.0
	var base_skill := ""
	var base_policy := 0
	var base_role := "front"
	# 查哪张表由 from_ally_table 决定，与阵营无关：敌方术士召唤的 sk_minion
	# 数值在 UnitTable 里，但效忠敌方（若这里用 is_ally 会去 EnemyTable 查 sk_minion → assert 崩）
	if from_ally_table:
		base_hp = UnitTable.hp(id, star)
		base_atk = UnitTable.atk(id, star)
		base_armor = UnitTable.armor(id, star)
		base_interval = UnitTable.base_field(id, "interval")
		base_crit = UnitTable.base_field(id, "crit")
		base_dodge = UnitTable.dodge(id, star)
		base_range = int(UnitTable.base_field(id, "range"))
		base_crit_mult = UnitTable.base_field(id, "crit_mult")
		base_thorns = UnitTable.base_field(id, "thorns")
		base_skill = UnitTable.skill_id(id)
		base_policy = UnitTable.policy_for(id)
		base_role = UnitTable.role(id)
	else:
		base_hp = EnemyTable.hp(id, star)
		base_atk = EnemyTable.atk(id, star)
		base_armor = EnemyTable.armor(id, star)
		base_interval = EnemyTable.field(id, "interval")
		base_crit = EnemyTable.field(id, "crit")
		base_dodge = EnemyTable.field(id, "dodge")
		base_range = int(EnemyTable.field(id, "range"))
		base_crit_mult = EnemyTable.field(id, "crit_mult")
		base_thorns = EnemyTable.field(id, "thorns")
		base_skill = String(EnemyTable.ENEMIES[id]["skill"])
		base_policy = EnemyTable.policy(id)
		base_role = String(EnemyTable.ENEMIES[id]["role"])

	# 羁绊加成只作用于我方；敌方不吃，否则「玩家变强 = 敌人跟着变强」
	var atk_pct := 0.0
	var hp_pct := 0.0
	var armor_flat := 0.0
	var interval_pct := 0.0
	var dodge_add := 0.0
	if is_ally:
		atk_pct = float(bonus.get("atk_pct", 0.0))
		hp_pct = float(bonus.get("hp_pct", 0.0))
		armor_flat = float(bonus.get("armor_flat", 0.0))
		interval_pct = float(bonus.get("interval_pct", 0.0))
		dodge_add = float(bonus.get("dodge_add", 0.0))

	return {
		"index": units.size(),
		"id": id,
		"is_ally": is_ally,
		"side": side,
		"star": star,
		"cell": cell,
		"display": UnitTable.display(id) if from_ally_table else EnemyTable.display(id),
		"model": UnitTable.model(id) if from_ally_table else EnemyTable.model(id),
		"role": base_role,
		"max_hp": base_hp * (1.0 + hp_pct),
		"hp": base_hp * (1.0 + hp_pct),
		"atk": base_atk * (1.0 + atk_pct),
		"armor": base_armor + armor_flat,
		"interval": maxf(0.20, base_interval * (1.0 + interval_pct)),
		"atk_timer": 0.0,          # 开局即可出手，否则第一拍有无法解释的空窗
		"range": base_range,
		"crit": minf(0.85, base_crit),
		"crit_mult": base_crit_mult,
		"dodge": minf(0.30, base_dodge + dodge_add),
		"thorns": base_thorns,
		"skill": base_skill,
		"skill_timer": 1.0,        # 首个技能晚 1 秒，避开「开局同时爆发」
		"policy": base_policy,
		"target": -1,
		"alive": true,
		"taunt": 0.0,
		"taunting": false,
		"dot": 0.0,
		"dot_ticks": 0,
		"crit_buff": 0.0,
		"crit_buff_time": 0.0,
		"armor_buff": 0.0,
		"armor_buff_time": 0.0,
		"silence": 0.0,
		"shield": 0.0,
		"is_summon": false,
	}


## 一个 tick。返回 false 表示战斗已结束。
func step() -> bool:
	if finished:
		return false
	tick += 1
	_apply_dots()
	_expire_buffs()
	for i in range(units.size()):
		var u: Dictionary = units[i]
		if not bool(u["alive"]):
			continue
		_tick_unit(i)
		# 死亡结算必须紧跟每次行动：召唤/爆碎可能在 tick 内清空一侧，
		# 放到循环末尾会让「已经死了的单位」再行动一次
		_settle(false)
		if finished:
			return false
	if tick >= MAX_TICKS:
		_settle(true)
	return not finished


func run() -> Dictionary:
	while not finished:
		if not step():
			break
	return result()


func result() -> Dictionary:
	return {
		"winner": winner,
		"ticks": tick,
		"duration": float(tick) * TICK,
		"timeout": timed_out,
		"ally_ratio": alive_ratio(Board.ALLY),
		"enemy_ratio": alive_ratio(Board.ENEMY),
		"ally_alive": alive_count(Board.ALLY),
		"enemy_alive": alive_count(Board.ENEMY),
		"events": events.size(),
	}


func alive_count(side: int) -> int:
	var n := 0
	for u in units:
		var d: Dictionary = u
		if bool(d["alive"]) and int(d["side"]) == side:
			n += 1
	return n


## 剩余血量比（护盾计入）。超时判定与报告都用它。
func alive_ratio(side: int) -> float:
	var hp := 0.0
	var max_hp := 0.0
	for u in units:
		var d: Dictionary = u
		if int(d["side"]) != side:
			continue
		max_hp += float(d["max_hp"])
		if bool(d["alive"]):
			hp += float(d["hp"]) + float(d["shield"])
	if max_hp <= 0.0:
		return 0.0
	return hp / max_hp


func _snapshot(side: int) -> Array:
	var out: Array = []
	for u in units:
		var d: Dictionary = u
		if int(d["side"]) == side:
			out.append(d)
	return out


func _occupy() -> Dictionary:
	var occ: Dictionary = {}
	for u in units:
		var d: Dictionary = u
		if bool(d["alive"]):
			occ[d["cell"]] = int(d["index"])
	return occ


func _tick_unit(i: int) -> void:
	var u: Dictionary = units[i]
	u["atk_timer"] = maxf(0.0, float(u["atk_timer"]) - TICK)
	u["skill_timer"] = maxf(0.0, float(u["skill_timer"]) - TICK)
	u["silence"] = maxf(0.0, float(u["silence"]) - TICK)
	if float(u["taunt"]) > 0.0:
		u["taunt"] = maxf(0.0, float(u["taunt"]) - TICK)
		u["taunting"] = float(u["taunt"]) > 0.0

	var my_side := int(u["side"])
	var my_cell: Vector2i = u["cell"]
	var foes := _snapshot(1 - my_side)

	# 技能：条件不满足就不消耗 cd，避免「放了半个技能」
	if String(u["skill"]) != "" and float(u["skill_timer"]) <= 0.0 and float(u["silence"]) <= 0.0:
		if _cast(i, u, foes):
			var sk: Dictionary = UnitTable.SKILLS[String(u["skill"])]
			u["skill_timer"] = float(sk["cd"])
			my_cell = u["cell"]

	# 索敌：目标失效就重选。pick_target 返回的是「传入数组里的下标」，
	# 所以要经 foes[] 换算成全局下标——这是 sim 里最容易搞混的一处索引，
	# 写错的表现是「打到自己人」或「永远打不到人」，所以这里显式换算并注释。
	var tgt := int(u["target"])
	if tgt < 0 or tgt >= units.size() or not bool(units[tgt]["alive"]) or int(units[tgt]["side"]) == my_side:
		var picked := Targeting.pick_target(my_cell, int(u["range"]), int(u["policy"]), foes)
		if picked < 0:
			u["target"] = -1
			return
		var pd: Dictionary = foes[picked]
		tgt = int(pd["index"])
		u["target"] = tgt
	if tgt < 0 or tgt >= units.size() or not bool(units[tgt]["alive"]):
		return

	var t: Dictionary = units[tgt]
	var t_cell: Vector2i = t["cell"]
	if Board.chebyshev(my_cell, t_cell) <= int(u["range"]):
		if float(u["atk_timer"]) <= 0.0:
			_attack(i, u, tgt, t)
		return

	# 不在射程 → 走一格。占位每 tick 重算（同一 tick 内别人可能已经走过）
	var occ := _occupy()
	occ.erase(my_cell)
	var next_cell := Board.step_toward(my_cell, t_cell, occ, my_side)
	if next_cell != my_cell:
		u["cell"] = next_cell
		_log("move", i, -1, 0.0, false, next_cell)


func _attack(i: int, u: Dictionary, tgt: int, t: Dictionary) -> void:
	u["atk_timer"] = float(u["interval"])
	if _rng.chance(float(t["dodge"])):
		_log("miss", i, tgt, 0.0, false, t["cell"])
		return
	var is_crit := _rng.chance(minf(0.9, float(u["crit"]) * maxf(1.0, float(u["crit_buff"]))))
	var raw := float(u["atk"])
	if is_crit:
		raw *= float(u["crit_mult"])
	var dmg := maxf(1.0, raw - float(t["armor"]) - float(t["armor_buff"]))
	_damage(tgt, dmg, i)
	_log("attack", i, tgt, dmg, is_crit, t["cell"])
	# 反伤：让「无脑站桩打坦克」有代价，是敌方 titan/knight 存在的意义
	var thorns := float(t["thorns"])
	if thorns > 0.0 and bool(t["alive"]):
		_damage(i, thorns * 0.5, tgt)
		_log("thorns", tgt, i, thorns * 0.5, false, u["cell"])


## 护盾先吸收伤害，再算本体血；致死时触发死亡技
func _damage(idx: int, amount: float, source: int) -> void:
	if idx < 0 or idx >= units.size() or amount <= 0.0:
		return
	var d: Dictionary = units[idx]
	if not bool(d["alive"]):
		return
	var remaining := amount
	var shield := float(d["shield"])
	if shield > 0.0:
		var absorbed := minf(shield, amount)
		shield -= absorbed
		remaining -= absorbed
		d["shield"] = shield
	d["hp"] = float(d["hp"]) - remaining
	if float(d["hp"]) <= 0.0:
		_kill(idx)


func _kill(idx: int) -> void:
	var d: Dictionary = units[idx]
	if not bool(d["alive"]):
		return
	d["alive"] = false
	d["hp"] = 0.0
	d["shield"] = 0.0
	_log("death", idx, -1, 0.0, false, d["cell"])
	# 死亡爆碎：唯一的「死后伤害」，所以必须挂在 _kill 里而不是普攻结算里
	if String(d["skill"]) == "death_burst":
		var foes := _snapshot(1 - int(d["side"]))
		var radius := int(UnitTable.SKILLS["death_burst"]["radius"])
		var amount := float(d["atk"]) * float(UnitTable.SKILLS["death_burst"]["value"])
		for k in Targeting.enemies_in_radius(d["cell"], radius, foes):
			var kd: Dictionary = foes[k]
			var ki := int(kd["index"])
			_damage(ki, amount, idx)
			_log("burst", idx, ki, amount, false, kd["cell"])


func _cast(i: int, u: Dictionary, foes: Array) -> bool:
	var sid := String(u["skill"])
	if sid == "" or not UnitTable.SKILLS.has(sid):
		return false
	var sk: Dictionary = UnitTable.SKILLS[sid]
	var kind := String(sk["kind"])
	var value := float(sk["value"])
	var radius := int(sk["radius"])
	var duration := float(sk["duration"])
	var my_side := int(u["side"])
	var my_cell: Vector2i = u["cell"]

	match kind:
		"taunt":
			for e in foes:
				var ed: Dictionary = e
				ed["taunt"] = duration
				ed["taunting"] = true
			u["shield"] = maxf(float(u["shield"]), float(u["max_hp"]) * value)
			_log("cast", i, -1, value, false, my_cell, sid)
			return true
		"aoe":
			var hit := Targeting.enemies_in_radius(my_cell, radius, foes)
			if hit.is_empty():
				return false
			for k in hit:
				var kd: Dictionary = foes[k]
				var ki := int(kd["index"])
				_damage(ki, value * float(u["atk"]), i)
				_log("cast_hit", i, ki, value * float(u["atk"]), false, kd["cell"], sid)
			return true
		"dot_aoe":
			var hit2 := Targeting.enemies_in_radius(my_cell, radius, foes)
			if hit2.is_empty():
				return false
			for k2 in hit2:
				var kd2: Dictionary = foes[k2]
				kd2["dot"] = value
				kd2["dot_ticks"] = int(duration / DOT_INTERVAL)
			_log("cast", i, -1, value, false, my_cell, sid)
			return true
		"buff_crit":
			u["crit_buff"] = value
			u["crit_buff_time"] = duration
			_log("cast", i, -1, value, false, my_cell, sid)
			return true
		"armor_buff":
			u["armor_buff"] = value
			u["armor_buff_time"] = duration
			_log("cast", i, -1, value, false, my_cell, sid)
			return true
		"dash":
			var tgt := int(u["target"])
			if tgt < 0 or tgt >= units.size() or not bool(units[tgt]["alive"]):
				return false
			var occ := _occupy()
			occ.erase(my_cell)          # 必须先把自己的格子让出来，否则第一步就走不动
			var dest: Vector2i = units[tgt]["cell"]
			for _s in range(int(value)):
				var nxt := Board.step_toward(my_cell, dest, occ, my_side)
				if nxt == my_cell:
					break
				occ[nxt] = i
				my_cell = nxt
			u["cell"] = my_cell
			var td: Dictionary = units[tgt]
			if bool(td["alive"]):
				_attack(i, u, tgt, td)
			_log("cast", i, tgt, 0.0, false, my_cell, sid)
			return true
		"summon":
			var occ2 := _occupy()
			occ2.erase(my_cell)
			var cell := _free_cell_near(my_side, my_cell, occ2)
			if occ2.has(cell):
				return false
			# 仆从的数值永远来自 UnitTable（第 5 参 true = 查玩家表），
			# 效忠哪一方由 my_side 决定。敌方术士召出的仆从 is_ally 会是 false。
			var nu := _make_unit("sk_minion", 1, my_side, cell, true, {})
			nu["is_summon"] = true
			nu["index"] = units.size()
			units.append(nu)
			_log("summon", i, units.size() - 1, 0.0, false, cell, sid)
			return true
		"on_death_aoe":
			return false   # 被动，见 _kill
	return false


## 从中心向外按切比雪夫距离找空格：召唤物一定落在身边，不会凭空出现在角落
func _free_cell_near(side: int, center: Vector2i, occ: Dictionary) -> Vector2i:
	for r in range(1, Board.ROWS):
		for dr in range(-r, r + 1):
			for dc in range(-r, r + 1):
				if maxi(absi(dc), absi(dr)) != r:
					continue
				var cell := center + Vector2i(dc, dr)
				if not Board.cell_in_bounds(cell):
					continue
				if not Board.rows_for(side).has(cell.y):
					continue
				if occ.has(cell):
					continue
				return cell
	return center


func _apply_dots() -> void:
	if tick % 2 != 0:      # 0.5 秒一次
		return
	for u in units:
		var d: Dictionary = u
		if not bool(d["alive"]):
			continue
		if int(d["dot_ticks"]) <= 0:
			continue
		d["dot_ticks"] = int(d["dot_ticks"]) - 1
		_damage(int(d["index"]), float(d["dot"]), -1)
		_log("dot", int(d["index"]), -1, float(d["dot"]), false, d["cell"])


func _expire_buffs() -> void:
	for u in units:
		var d: Dictionary = u
		if float(d["crit_buff_time"]) > 0.0:
			d["crit_buff_time"] = maxf(0.0, float(d["crit_buff_time"]) - TICK)
			if float(d["crit_buff_time"]) <= 0.0:
				d["crit_buff"] = 0.0
		if float(d["armor_buff_time"]) > 0.0:
			d["armor_buff_time"] = maxf(0.0, float(d["armor_buff_time"]) - TICK)
			if float(d["armor_buff_time"]) <= 0.0:
				d["armor_buff"] = 0.0


func _settle(by_timeout: bool) -> void:
	var a := alive_count(Board.ALLY)
	var e := alive_count(Board.ENEMY)
	if a > 0 and e > 0 and not by_timeout:
		return
	finished = true
	timed_out = by_timeout and a > 0 and e > 0
	if a > 0 and e > 0:
		# 超时：剩余血量比高者胜，**平手算我方胜**（守方优势，避免随机性）
		winner = 0 if alive_ratio(Board.ALLY) >= alive_ratio(Board.ENEMY) else 1
	elif e == 0 and a > 0:
		winner = 0
	else:
		winner = 1   # 全灭或同归于尽都算敌方胜：玩家永远不该靠 bug 赢


func _log(kind: String, a: int, b: int, v: float, crit: bool, cell: Vector2i, skill: String = "") -> void:
	if events.size() >= EVENT_CAP:
		return
	events.append({
		"t": tick, "k": kind, "a": a, "b": b, "v": v, "crit": crit, "cell": cell, "s": skill,
	})
