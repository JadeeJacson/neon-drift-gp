extends RefCounted
class_name MatchSim
## 整局跑分（docs/00 §4.3 的统计断言侧，docs/09-立项 §3 的口径）。
##
## 三种玩家画像，断言的是**分布区间**而不是单值：
##   龟缩流 —— 只买最便宜、不合、不刷、卖不掉。应该早早被打死。
##   普通   —— 留 10 金吃利息、凑三升一、按前后排配阵容。应该「险胜」。
##   高手   —— 满利息运营、追连胜、优先合星级。应该「从容」。
## 要的形状是 **「龟缩必败 / 普通反复试 / 高手从容」**。普通画像胜率如果高于 85%，
## 说明「不运营也能赢」，游戏就退化成堆数字——所以 sim/tests 里把它写成硬上界。
##
## 为什么要写「玩家画像」而不是「AI 对手」：自走棋的难度不来自敌人强度曲线，
## 而来自**玩家自己的决策质量**。敌人曲线由 StageTable 控制（已可单测），
## 画像之间的胜率差才是「这局游戏有没有决策深度」的证据。

## 三种画像的差异**必须是决策质量上的差异**，不是「高手多想一步」。
## 四轮跑分试出来的结论，全部反直觉，写在这里防止改回去：
##   1. **囤利息是陷阱**：收入是平的（每回合 10–15 块），攒钱没有复利，
##      钱放着 = 少一个人口 = 输。「留 20 块」的高手 70% < 「留 10 块」的普通 80%。
##   2. **每回合刷商店是负收益**：单阶段 8 块刷新钱够买两个单位了（42% 通关）。
##   3. **「冲主 C 只买一个单位」也不成立**：牺牲了羁绊与宽度，实测 25%–67% 波动，最差。
##   4. 真正稳定的优势是**宽度 + 专精一个阵营**：先铺满 6 人，再把 6 个人口塞进同一羁绊。
## 于是画像的差异落在三条可写进断言的纪律上：
##   龟缩流：只买最便宜、不合、不卖、不留利息 → 必败
##   普通  ：留 10 块吃利息、见三合就合、买满 5 个 → 险胜
##   高手  ：**不囤利息**、一口气买满 6 人、只买圣团、优先买便宜的凑三 → 从容
const PROFILES := {
	"龟缩流": {
		"cheapest_only": true, "combine": false, "reroll_from": 99,
		"keep_interest": false, "reserve_bonus": 0, "sell_offrole": false,
		"target_size": 3, "actions": 6, "min_gold_for_reroll": 999, "hunt_pair": false,
		"core_faction": "",
	},
	"普通": {
		"cheapest_only": false, "combine": true, "reroll_from": 4,
		"keep_interest": true, "reserve_bonus": 0, "sell_offrole": true,
		"target_size": 5, "actions": 10, "min_gold_for_reroll": 45, "hunt_pair": false,
		"core_faction": "",
	},
	"高手": {
		"cheapest_only": false, "combine": true, "reroll_from": 2,
		"keep_interest": false, "reserve_bonus": 0, "sell_offrole": true,
		"target_size": 6, "actions": 24, "min_gold_for_reroll": 50, "hunt_pair": true,
		"core_faction": "order", "star_hunt": false, "star_hunt_rerolls": 0,
		"tunnel": "", "pair_bonus": 90.0, "prefer_cheap": true,
	},
}


static func play(profile: Dictionary, seed_value: int) -> Dictionary:
	var rs := RunState.new(seed_value)
	var rng := SimRng.new(seed_value ^ 0x5EED)
	while true:
		_plan(rs, profile, rng)
		var r := rs.battle(seed_value)
		if not rs.advance():
			break
	return {
		"won": rs.won,
		"stage": rs.stage,
		"stages_played": rs.stage_log.size(),
		"hp_left": maxi(rs.hp, 0),
		"seconds": rs.total_seconds(),
		"minutes": rs.total_seconds() / 60.0,
		"damage_taken": int(rs.stats["damage_taken"]),
		"battle_seconds": float(rs.stats["battle_seconds"]),
		"battles": rs.stage_log.size(),
		"combines": int(rs.stats["combines"]),
		"interest": int(rs.stats["interest"]),
		"bought": int(rs.stats["bought"]),
		"rerolls": int(rs.stats["rerolls"]),
		"win_streak_max": int(rs.stats["win_streak_max"]),
		"traits": float(rs.stats["traits_active"]) / maxf(1.0, float(rs.stage_log.size())),
		"avg_battle": float(rs.stats["battle_seconds"]) / maxf(1.0, float(rs.stage_log.size())),
		"log": rs.stage_log,
	}


## N 个种子的分布。种子用 `seed_base + i * 131`，间隔取质数以避免序列相关。
static func sweep(profile: Dictionary, runs: int, seed_base: int = 20260927) -> Dictionary:
	var clears := 0
	var minutes: Array = []
	var stages: Array = []
	var damage: Array = []
	var battles: Array = []
	var traits: Array = []
	var combines: Array = []
	var streak: Array = []
	for i in range(runs):
		var r := play(profile, seed_base + i * 131)
		if bool(r["won"]):
			clears += 1
		minutes.append(float(r["minutes"]))
		stages.append(float(r["stages_played"]))
		damage.append(float(r["damage_taken"]))
		battles.append(float(r["avg_battle"]))
		traits.append(float(r["traits"]))
		combines.append(float(r["combines"]))
		streak.append(float(r["win_streak_max"]))
	return {
		"runs": runs,
		"clear_rate": float(clears) / float(runs),
		"minutes_min": _p(minutes, 0.0), "minutes_med": _p(minutes, 0.5), "minutes_max": _p(minutes, 1.0),
		"stages_min": _p(stages, 0.0), "stages_med": _p(stages, 0.5), "stages_max": _p(stages, 1.0),
		"damage_min": _p(damage, 0.0), "damage_med": _p(damage, 0.5), "damage_max": _p(damage, 1.0),
		"battle_med": _p(battles, 0.5),
		"traits_med": _p(traits, 0.5),
		"combines_med": _p(combines, 0.5),
		"streak_med": _p(streak, 0.5),
	}


static func sweep_all(runs: int) -> Dictionary:
	var out: Dictionary = {}
	for name in PROFILES:
		out[String(name)] = sweep(PROFILES[name], runs)
	return out


static func _p(values: Array, q: float) -> float:
	if values.is_empty():
		return 0.0
	var sorted: Array = values.duplicate()
	sorted.sort()
	var idx := int(round(clampf(q, 0.0, 1.0) * float(sorted.size() - 1)))
	return float(sorted[idx])


# ---------- 画像决策 ----------

static func _plan(rs: RunState, profile: Dictionary, rng: SimRng) -> void:
	var actions := int(profile["actions"])
	rs.stats["hunt_rerolls"] = 0     # 追第三张的刷新次数是**每阶段**限额，不是全局
	for _i in range(actions):
		if not _act(rs, profile, rng):
			return


static func _act(rs: RunState, profile: Dictionary, rng: SimRng) -> bool:
	# 0) 「冲主 C」通道（只有高手画像走）：只买一个指定单位，凑到 3★ 为止。
	#    这是自走棋真实高手的极端打法（tunnel），也是本作里**唯一**稳定跑赢的策略。
	#    两次失败尝试的记录（别再走回头路）：
	#      · 「多留 10 块吃利息」→ 70% < 普通 80%：人口上限才是瓶颈，攒钱不成战力
	#      · 「每回合刷商店追第三张」→ 42%：单阶段 8 块刷新钱，够买两个单位了
	#    结论：本作的深度收益必须**远大于**宽度收益，「3 合 1」才值得赌。
	var tunnel := String(profile.get("tunnel", ""))
	if tunnel != "":
		return _act_tunnel(rs, profile, tunnel)

	# 1) 合成优先：它是「把 3 个变成 1 个」的唯一途径，错过就落后一整轮
	if bool(profile["combine"]) and rs.can_combine():
		return rs.combine()

	# 1.5) 追第三张（只有高手画像做）：备战区/棋盘上已经有一对同名 1★ 时，
	#      专门花钱刷商店去找第三张。这是真人高手与「普通运营」最明显的差别，
	#      也是 3★ 唯一的来源——没有它，两种画像的合成次数完全相同（实测都是 7 次）。
	if bool(profile.get("star_hunt", false)) and _has_pair(rs):
		var pair_slot := _slot_matching_pair(rs)
		if pair_slot >= 0:
			return rs.buy(pair_slot)
		if int(rs.stats["hunt_rerolls"]) < int(profile.get("star_hunt_rerolls", 3)):
			if rs.gold >= RunState.REROLL_COST:
				rs.stats["hunt_rerolls"] = int(rs.stats["hunt_rerolls"]) + 1
				return rs.reroll()

	var reserve := 0
	if bool(profile["keep_interest"]):
		reserve = 10 + int(profile["reserve_bonus"])

	# 2) 买：只要还有空位且买得起（按画像的持金纪律）
	var want_size := mini(int(profile["target_size"]), rs.population_cap())
	if rs.board.size() < want_size or rs.bench.size() <= 1 or _has_pair(rs):
		var slot := _best_slot(rs, profile, reserve)
		if slot >= 0:
			return rs.buy(slot)

	# 3) 刷新商店：**只为了凑第三张才刷**。
	#    「见钱就刷」是新手行为——它把利息吃干、阵容永远合不出三星，
	#    实测让高手画像的通关率比普通还低（63% vs 75%）。
	if rs.stage >= int(profile["reroll_from"]) and rs.gold >= int(profile["min_gold_for_reroll"]):
		if not rs.can_combine() and (bool(profile["hunt_pair"]) or _has_pair(rs)):
			if rs.reroll():
				rs.stats["idle_reroll"] = int(rs.stats["idle_reroll"]) + 1
				return true

	# 4) 卖掉与目标阵容不符的单位，腾人口
	if bool(profile["sell_offrole"]) and _sell_offrole(rs, profile):
		return true

	# 5) 人口还有余且钱够 → 继续买
	if rs.board.size() < rs.population_cap() and rs.gold - reserve >= 1:
		var slot2 := _best_slot(rs, profile, reserve)
		if slot2 >= 0:
			return rs.buy(slot2)
	return false


## 冲主 C：买同一个单位直到升不动星。三个硬约束防止它变成送死流：
##   1. 手上的主 C 少于 3 个之前，不卖任何非主 C 单位（否则会 1 个单位上板＝秒败）
##   2. 刷新只在「金�� ≥ 12」时进行（留 10 块利息 + 2 块刷新费）
##   3. 买满人口后仍继续攒主 C，而不是继续买杂鱼
static func _act_tunnel(rs: RunState, profile: Dictionary, tunnel: String) -> bool:
	# 合成永远优先
	if rs.can_combine():
		return rs.combine()
	# 商店里有主 C 就买
	for i in range(rs.shop.size()):
		var s: Dictionary = rs.shop[i]
		if String(s["id"]) == tunnel and rs.gold >= int(s["cost"]):
			return rs.buy(i)
	# 位置没满 → 买任何买得起的。**这条不能省**：只上 1–2 个单位等于送死，
	# 实测「冲主 C」版本最初就是这里没处理好，中期 3 个单位被 5 个敌人围殴
	if rs.board.size() < rs.population_cap():
		var fallback := _best_slot(rs, profile, 0)
		if fallback >= 0:
			return rs.buy(fallback)
		return false
	# 满员 → 卖杂鱼腾位置，然后攒钱刷新找主 C
	if _sell_non_tunnel(rs, tunnel):
		return true
	if rs.gold >= 12:
		return rs.reroll()
	return false


static func _count_id(rs: RunState, id: String) -> int:
	var n := 0
	for u in rs.board:
		var d: Dictionary = u
		if String(d["id"]) == id:
			n += 1
	for u2 in rs.bench:
		var d2: Dictionary = u2
		if String(d2["id"]) == id:
			n += 1
	return n


## 卖掉一个非主 C 单位（场上优先，其次备战区）。只在**场上已满**时调用，
## 所以不会把玩家削成「1 个单位上板」
static func _sell_non_tunnel(rs: RunState, tunnel: String) -> bool:
	for i in range(rs.board.size()):
		var d: Dictionary = rs.board[i]
		if String(d["id"]) == tunnel:
			continue
		return rs.sell_board(i)
	for j in range(rs.bench.size()):
		var d2: Dictionary = rs.bench[j]
		if String(d2["id"]) == tunnel:
			continue
		return rs.sell_bench(j)
	return false


## 备战区/棋盘上是否存在「同 id 两张 1★」——这是唯一值得 reroll 的理由
static func _has_pair(rs: RunState) -> bool:
	return _pair_ids(rs).size() > 0


## 所有「已经两张」的 id
static func _pair_ids(rs: RunState) -> Dictionary:
	var counts: Dictionary = {}
	for u in rs.board:
		var d: Dictionary = u
		if int(d["star"]) == 1:
			counts[String(d["id"])] = int(counts.get(String(d["id"]), 0)) + 1
	for u2 in rs.bench:
		var d2: Dictionary = u2
		if int(d2["star"]) == 1:
			counts[String(d2["id"])] = int(counts.get(String(d2["id"]), 0)) + 1
	var out: Dictionary = {}
	for k in counts:
		if int(counts[k]) >= 2:
			out[k] = true
	return out


## 商店里有没有「正好能凑成第三张」的槽位
static func _slot_matching_pair(rs: RunState) -> int:
	var pairs := _pair_ids(rs)
	if pairs.is_empty():
		return -1
	for i in range(rs.shop.size()):
		var s: Dictionary = rs.shop[i]
		if pairs.has(String(s["id"])) and rs.gold >= int(s["cost"]):
			return i
	return -1


## 选一个买得起的槽位。评分 = 性价比 + 羁绊缺口 + 位置缺口
static func _best_slot(rs: RunState, profile: Dictionary, reserve: int) -> int:
	var best := -1
	var best_score := -1e9
	for i in range(rs.shop.size()):
		var s: Dictionary = rs.shop[i]
		var cost := int(s["cost"])
		if rs.gold - cost < reserve:
			continue
		var sc := _score(rs, String(s["id"]), profile)
		if sc > best_score:
			best_score = sc
			best = i
	return best


static func _score(rs: RunState, id: String, profile: Dictionary) -> float:
	var cost := float(UnitTable.cost(id))
	var sc := UnitTable.power(id, 1) / cost * 6.0
	if bool(profile["cheapest_only"]):
		# 龟缩流只认「最便宜」，所以评分与强度脱钩
		return -cost
	# 羁绊：加上这个单位后激活的羁绊条数增量。直接用 Traits 计算，避免第二套规则
	var probe: Array = []
	for u in rs.board:
		var d: Dictionary = u
		probe.append({"id": String(d["id"]), "star": int(d["star"])})
	probe.append({"id": id, "star": 1})
	var before := float(Traits.active(rs.board).size())
	var after := float(Traits.active(probe).size())
	sc += (after - before) * 30.0
	# 已有几张同名：**凑第三张最值钱**。没有这条权重，玩家永远不会升星，
	# 于是「3 合 1」这条路线在跑分里根本不存在（实测：12 阶段 0 次合成，阵容全 1★）
	var owned := 0
	for u2 in rs.board:
		var d2: Dictionary = u2
		if String(d2["id"]) == id and int(d2["star"]) == 1:
			owned += 1
	for u3 in rs.bench:
		var d3: Dictionary = u3
		if String(d3["id"]) == id and int(d3["star"]) == 1:
			owned += 1
	var pair_bonus := float(profile.get("pair_bonus", 55.0))
	if owned >= 2:
		sc += pair_bonus
	elif owned == 1:
		sc += pair_bonus * 0.25
	# 主阵营：高手画像只补一个阵营，把 6 个人口全塞进同一羁绊的加成池。
	# 这是三种画像的真正分水岭——普通画像两边都想要，结果羁绊只到 I 级。
	if bool(profile.get("prefer_cheap", false)) and cost <= 3.0:
		sc += 12.0
	var core := String(profile.get("core_faction", ""))
	if core != "" and UnitTable.faction(id) != core:
		sc -= 45.0
	# 位置缺口：前排与远程都至少要 2 个
	var fronts := 0
	var backs := 0
	for u4 in rs.board:
		var d4: Dictionary = u4
		if UnitTable.role(String(d4["id"])) == "front":
			fronts += 1
		elif UnitTable.role(String(d4["id"])) == "back":
			backs += 1
	if UnitTable.role(id) == "front" and fronts < 2:
		sc += 18.0
	if UnitTable.role(id) == "back" and backs < 2:
		sc += 18.0
	return sc


## 卖掉「既不在目标职能内、又与已有单位重复」的单位
static func _sell_offrole(rs: RunState, profile: Dictionary) -> bool:
	var have_front := 0
	for u in rs.board:
		var d: Dictionary = u
		if UnitTable.role(String(d["id"])) == "front":
			have_front += 1
	for i in range(rs.board.size()):
		var d2: Dictionary = rs.board[i]
		if UnitTable.role(String(d2["id"])) != "back":
			continue
		if have_front >= 2:
			return false   # 前排够了就不再卖远程
		return rs.sell_board(i)
	return false
