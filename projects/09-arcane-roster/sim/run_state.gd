extends RefCounted
class_name RunState
## 一局游戏的全部状态：金币、人口、棋盘、商店、连胜、HP，以及「准备/战斗/结算」循环。
##
## 分层：这里**不做任何决策**（买什么、卖不留），只提供原子操作
## （buy/sell/combine/reroll/place）供上层策略调用。上层策略有两种：
##   - 玩家操作（scripts/shop_ui.gd）
##   - 跑分画像（sim/match_sim.gd）
## 两者共用同一套原子操作，所以**跑分跑的就是玩家能玩到的那套规则**，不是另一套简化模拟。
##
## 时间模型：备战 PLANNING_SECONDS 秒（提前开战 +1 金）→ 战斗（真打，时长由 sim 决定）
## → 结算。整局时长 = Σ(35s + 战斗时长 + 2s)，12 阶段约 10–15 分钟。
## 跑分报告里的「整局分钟数」就是按这个公式算的，不是拍脑袋。

const START_GOLD := 10
const START_HP := 100
const PLANNING_SECONDS := 35.0
const SETTLE_SECONDS := 2.0
const REROLL_COST := 2
const EARLY_START_BONUS := 1
const SHOP_SLOTS := 5
const BENCH_CAP := 9
const INTEREST_PER := 10
const INTEREST_CAP := 5
const STREAK_BONUS_CAP := 6
const LOSS_RELIEF_CAP := 3
const BOSS_DAMAGE_MULT := 1.5

var stage: int = 1
var gold: int = START_GOLD
var hp: int = START_HP
var streak: int = 0            # 正=连胜，负=连败
var last_win: bool = false
var board: Array = []          # [{id, star, cell}]
var bench: Array = []          # [{id, star}]
var shop: Array = []           # [{id, cost}]
var over: bool = false
var won: bool = false
var stage_log: Array = []      # 每阶段一行摘要，报告与结算面板都用它

## 跑分指标（docs/09-立项 §3 的可测量体验指标）
var stats: Dictionary = {
	"interest": 0, "combines": 0, "bought": 0, "sold": 0, "rerolls": 0,
	"battle_seconds": 0.0, "damage_taken": 0, "units_bought_at": {},
	"traits_active": 0.0, "win_streak_max": 0, "idle_reroll": 0,
}

var _seed: int = 0
var _rng: SimRng


func _init(seed_value: int = 0) -> void:
	_seed = seed_value
	_rng = SimRng.new(seed_value)
	shop = _roll_shop()
	begin_stage()


## 每阶段开始：发收入 → 刷商店。收入先于商店，是为了让「利息」影响买什么（这是核心张力）
func begin_stage() -> void:
	var inc := income()
	gold += int(inc["total"])
	stats["interest"] = int(stats["interest"]) + int(inc["interest"])
	shop = _roll_shop()


## 本阶段的收入明细。拆成明细返回，是为了让跑分报告能解释「这局为什么穷」
func income() -> Dictionary:
	var base := 5.0 + floorf(float(stage) / 2.0)
	var interest := minf(float(gold / INTEREST_PER), float(INTEREST_CAP))
	var streak_bonus := 0.0
	if streak > 0:
		streak_bonus = minf(float(1 + streak), float(STREAK_BONUS_CAP))
	elif streak <= -2:
		streak_bonus = minf(float(-streak - 1), float(LOSS_RELIEF_CAP))
	var early := float(EARLY_START_BONUS)
	return {
		"base": base, "interest": interest, "streak": streak_bonus, "early": early,
		"total": base + interest + streak_bonus + early,
	}


func population_cap() -> int:
	var by_stage := 3 + int((maxi(stage, 1) - 1) / 2)
	var bonus := 1 if last_win else 0
	return mini(UnitTable.POP_MAX, by_stage + bonus)


func board_defs() -> Array:
	var out: Array = []
	for u in board:
		var d: Dictionary = u
		out.append({"id": String(d["id"]), "star": int(d["star"]), "cell": d["cell"]})
	return out


func board_units() -> Array:
	return board.duplicate()


func occupancy() -> Dictionary:
	var occ: Dictionary = {}
	for u in board:
		var d: Dictionary = u
		occ[d["cell"]] = d
	return occ


func gold_after_interest() -> int:
	return gold


# ---------- 商店 ----------

func _roll_shop() -> Array:
	var slots: Array = []
	for _i in range(SHOP_SLOTS):
		var weights: Dictionary = {}
		for id in UnitTable.ids():
			weights[id] = UnitTable.shop_weight(String(id))
		var pick = _rng.pick_weighted(weights)
		if pick == null:
			continue
		var pid := String(pick)
		slots.append({"id": pid, "cost": UnitTable.cost(pid)})
	return slots


func can_afford(slot: int) -> bool:
	if slot < 0 or slot >= shop.size():
		return false
	var s: Dictionary = shop[slot]
	return gold >= int(s["cost"])


func buy(slot: int) -> bool:
	if not can_afford(slot):
		return false
	var s: Dictionary = shop[slot]
	var cost := int(s["cost"])
	gold -= cost
	var unit := {"id": String(s["id"]), "star": 1}
	bench.append(unit)
	shop.remove_at(slot)
	stats["bought"] = int(stats["bought"]) + 1
	var at: Dictionary = stats["units_bought_at"]
	var key := "%d-%d" % [maxi(stage - 1, 0), cost]
	at[key] = int(at.get(key, 0)) + 1
	# 备战区满了：淘汰「凑不出三星的重复 1★」，而不是随手卖掉最后一个（那正好会毁掉合成）
	if bench.size() > BENCH_CAP:
		sell_bench(_bench_evict_index())
	# 满员直接自动上阵（玩家视角：买完就在备战区，点一下上场）
	if board.size() < population_cap():
		place_next()
	return true


## 备战区淘汰策略：优先卖掉「1★ 且已有 2 张同名」的单位（它永远合不成三），
## 其次卖掉 1★，最后才动高星。确定性遍历，不看插入顺序。
func _bench_evict_index() -> int:
	var counts: Dictionary = {}
	for u in bench:
		var d: Dictionary = u
		counts[String(d["id"])] = int(counts.get(String(d["id"]), 0)) + 1
	for i in range(bench.size()):
		var d2: Dictionary = bench[i]
		if int(d2["star"]) == 1 and int(counts[String(d2["id"])]) >= 2:
			return i
	for j in range(bench.size()):
		var d3: Dictionary = bench[j]
		if int(d3["star"]) == 1:
			return j
	return bench.size() - 1


func reroll() -> bool:
	if gold < REROLL_COST:
		return false
	gold -= REROLL_COST
	stats["rerolls"] = int(stats["rerolls"]) + 1
	shop = _roll_shop()
	return true


func sell_bench(index: int) -> bool:
	if index < 0 or index >= bench.size():
		return false
	var u: Dictionary = bench[index]
	gold += UnitTable.sell_value(int(u["star"]))
	bench.remove_at(index)
	stats["sold"] = int(stats["sold"]) + 1
	return true


func sell_board(index: int) -> bool:
	if index < 0 or index >= board.size():
		return false
	var u: Dictionary = board[index]
	gold += UnitTable.sell_value(int(u["star"]))
	board.remove_at(index)
	stats["sold"] = int(stats["sold"]) + 1
	return true


## 三个同名同星 → 合成高一星。board 与 bench 合在一起算（自走棋的标准规则：
## 待命区里的同名单位也能参与合成），返回是否成功
func can_combine() -> bool:
	for id in _combine_candidates():
		return true
	return false


func combine() -> bool:
	for c in _combine_candidates():
		var pid := String(c["id"])
		var star := int(c["star"])
		_remove_three(pid, star)
		stats["combines"] = int(stats["combines"]) + 1
		# 合成产物必须**立刻上阵**：留在备战区等于白合（它不会参战，
		# 而腾出来的 2 个人口正是这条路线存在的理由）
		if board.size() < population_cap():
			board.append({"id": pid, "star": star + 1, "cell": _free_cell()})
		else:
			bench.append({"id": pid, "star": star + 1})
		return true
	return false


func _combine_candidates() -> Array:
	var counts: Dictionary = {}
	for u in board:
		var d: Dictionary = u
		var k := "%s@%d" % [String(d["id"]), int(d["star"])]
		counts[k] = int(counts.get(k, 0)) + 1
	for u2 in bench:
		var d2: Dictionary = u2
		var k2 := "%s@%d" % [String(d2["id"]), int(d2["star"])]
		counts[k2] = int(counts.get(k2, 0)) + 1
	var out: Array = []
	for k3 in counts:
		if int(counts[k3]) < 3:
			continue
		var parts := String(k3).split("@")
		var star := int(parts[1])
		if star >= UnitTable.MAX_STAR:
			continue
		out.append({"id": String(parts[0]), "star": star})
	# 确定性：按 id 排序，避免「先合谁」随 Dictionary 顺序漂移
	out.sort_custom(func(a, b):
		if int(a["star"]) != int(b["star"]):
			return int(a["star"]) < int(b["star"])   # 先升低星，避免 1★ 卡住
		return String(a["id"]) < String(b["id"]))
	return out


func _remove_three(pid: String, star: int) -> void:
	var need := 3
	for i in range(board.size() - 1, -1, -1):
		if need <= 0:
			break
		var d: Dictionary = board[i]
		if String(d["id"]) == pid and int(d["star"]) == star:
			board.remove_at(i)
			need -= 1
	for j in range(bench.size() - 1, -1, -1):
		if need <= 0:
			break
		var d2: Dictionary = bench[j]
		if String(d2["id"]) == pid and int(d2["star"]) == star:
			bench.remove_at(j)
			need -= 1


func _free_cell() -> Vector2i:
	return Board.auto_place_cell(Board.ALLY, occupancy())


## 把备战区第一个单位放上板（自动找空格）
func place_next() -> bool:
	if bench.is_empty():
		return false
	if board.size() >= population_cap():
		return false
	var u: Dictionary = bench[0]
	bench.remove_at(0)
	board.append({"id": String(u["id"]), "star": int(u["star"]), "cell": _free_cell()})
	return true


## 玩家手动摆位。非法返回 false（不越界 / 不重叠 / 不超人口）
func place_unit(bench_index: int, cell: Vector2i) -> bool:
	if bench_index < 0 or bench_index >= bench.size():
		return false
	if board.size() >= population_cap():
		return false
	if not Board.cell_in_bounds(cell) or not Board.ALLY_ROWS.has(cell.y):
		return false
	var occ := occupancy()
	if occ.has(cell):
		return false
	var u: Dictionary = bench[bench_index]
	bench.remove_at(bench_index)
	board.append({"id": String(u["id"]), "star": int(u["star"]), "cell": cell})
	return true


func move_board_unit(index: int, cell: Vector2i) -> bool:
	if index < 0 or index >= board.size():
		return false
	if not Board.cell_in_bounds(cell) or not Board.ALLY_ROWS.has(cell.y):
		return false
	var occ := occupancy()
	var u: Dictionary = board[index]
	occ.erase(u["cell"])
	if occ.has(cell):
		return false
	u["cell"] = cell
	return true


# ---------- 战斗 ----------
## 生成本阶段的敌方编成。单独抽出来是因为**场景层与跑分层共用它**，
## 保证「玩家看到的敌人」和「跑分里的敌人」是同一套规则算出来的
func make_enemy(seed_value: int) -> Array:
	return StageTable.roll_enemy(SimRng.new(seed_value + stage * 7919), stage, streak)


## 跑分路径：自建 sim 跑完整场，然后把结果记账。
## 场景层**不调**这个函数（它有自己逐 tick 驱动的 BattleDirector），而是调 apply_battle_result()。
## 两条路径共用同一个记账函数——否则会出现「玩家掉血规则」与「跑分掉血规则」两套代码，
## 跑分结论就完全不可信了（这正是 docs/00 §4.3 说的分层纪律）。
func battle(seed_value: int) -> Dictionary:
	var enemy := make_enemy(seed_value)
	var sim := BattleSim.new(board_defs(), enemy, seed_value + stage, Traits.bonuses(board))
	var r := sim.run()
	apply_battle_result(r, enemy, sim)
	return r


## 把一场战斗的结果写回状态：掉血、连胜、阶段日志、统计
func apply_battle_result(r: Dictionary, enemy: Array, sim: BattleSim = null) -> void:
	stats["battle_seconds"] = float(stats["battle_seconds"]) + float(r["duration"])
	stats["traits_active"] = float(stats["traits_active"]) + float(Traits.active(board).size())
	var won_battle := int(r["winner"]) == Board.ALLY
	var dmg := 0
	if not won_battle:
		for e in enemy:
			var ed: Dictionary = e
			# 只算活下来的：TFT 的经典规则，也是「残局能翻盘」张力的来源
			if _survived(sim, ed):
				dmg += 2 * int(ed["star"]) + 1
		if StageTable.is_boss(stage):
			dmg = int(round(float(dmg) * BOSS_DAMAGE_MULT))
		hp -= dmg
		stats["damage_taken"] = int(stats["damage_taken"]) + dmg
		streak -= 1
	else:
		streak += 1
		stats["win_streak_max"] = maxi(int(stats["win_streak_max"]), streak)
	last_win = won_battle
	stage_log.append({
		"stage": stage, "name": StageTable.stage_name(stage), "boss": StageTable.is_boss(stage),
		"enemy": enemy.size(), "duration": float(r["duration"]), "win": won_battle,
		"damage": dmg, "hp": hp, "gold": gold, "streak": streak,
		"traits": Traits.summary(board),
		"ally_units": board.size(), "ally_power": _board_power(), "enemy_power": _enemy_power(enemy),
		"ally_hp": _board_hp(), "enemy_hp": _enemy_hp(sim),
	})


## 敌方某个编成条目是否活到结束。sim 为 null（调用方没传）时保守当作存活，
## 宁可多扣一点血，也不要让「场景层跑出来的战斗」比跑分更便宜
func _survived(sim: BattleSim, enemy_def: Dictionary) -> bool:
	if sim == null:
		return true
	for u in sim.units:
		var d: Dictionary = u
		if bool(d["is_ally"]):
			continue
		if String(d["id"]) == String(enemy_def["id"]) and d["cell"] == enemy_def["cell"]:
			return bool(d["alive"])
	return false

## 我方战力点数。用于跑分表对照预算：预算 1000 而我方 700 时，输是「设计内」的，
## 但如果我方 1200 还输，那就是结算或索敌有 bug——这两个数字是排查的第一分岔口
func _board_power() -> float:
	var p := 0.0
	for u in board:
		var d: Dictionary = u
		p += UnitTable.power(String(d["id"]), int(d["star"]))
	return p


func _board_hp() -> float:
	var h := 0.0
	for u in board:
		var d: Dictionary = u
		h += UnitTable.hp(String(d["id"]), int(d["star"]))
	return h


func _enemy_power(enemy: Array) -> float:
	var p := 0.0
	for e in enemy:
		var d: Dictionary = e
		p += EnemyTable.power(String(d["id"]), int(d["star"]))
	return p


func _enemy_hp(sim: BattleSim) -> float:
	var h := 0.0
	for u in sim.units:
		var d: Dictionary = u
		if not bool(d["is_ally"]):
			h += float(d["max_hp"])
	return h


func _enemy_survives(sim: BattleSim, enemy_def: Dictionary) -> bool:
	for u in sim.units:
		var d: Dictionary = u
		if bool(d["is_ally"]):
			continue
		if String(d["id"]) == String(enemy_def["id"]):
			# 同 id 可能有多个（不同星级），按 cell 定位更准
			if d["cell"] == enemy_def["cell"]:
				return bool(d["alive"])
	return false


## 战斗后推进。返回 false 表示整局结束
func advance() -> bool:
	if hp <= 0:
		over = true
		won = false
		return false
	if stage >= StageTable.STAGE_COUNT:
		over = true
		# 通关的定义是「打赢最后一个 Boss」，不是「活到最后一个阶段」。
		# 少了这一条，打输最终战但没掉光血的玩家会被算成通关——实测踩到过。
		won = last_win
		return false
	stage += 1
	begin_stage()
	return true


func traits_summary() -> String:
	return Traits.summary(board)


## 整局时长估算（秒）：Σ(备战 35s + 战斗实测 + 结算 2s)
func total_seconds() -> float:
	var planning := PLANNING_SECONDS + SETTLE_SECONDS
	return float(stage_log.size()) * planning + float(stats["battle_seconds"])
