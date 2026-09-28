class_name Strategy
extends RefCounted

# 三种玩家画像的 bot。用途是**跑分**（路线图 §4.3 的统计断言），不是替玩家玩。
# 画像之间的差距，本质是「迷宫塔防的策略深度」是否被数值兑现出来：
# 乱建(random) / 均衡(balanced) / 最优(optimal) 应当拉开明显梯度。

# 能量井的回本周期约 6.7 波（120 成本 / 18 每波），12 波局里**必须早建**才回本。
# 第一版把它排在第 8 座，跑分直接反超：「最优」83% <「均衡」100%。
# 这条是被跑分数据打脸后改的，不是拍脑袋排的序。
const OPTIMAL_ORDER: Array = [
	"vulcan", "vulcan", "generator", "laser", "tesla", "vulcan",
	"missile", "laser", "tesla", "missile", "vulcan", "laser",
	"missile", "tesla", "missile", "laser",
]


static func act(sim, profile: String) -> void:
	var ph: String = String(sim.phase)
	if ph != MatchSim.PHASE_BUILD:
		return
	if profile == "human":
		return  # 实机模式：建造决策交给玩家，bot 不插手
	match profile:
		"random":
			_random(sim)
		"balanced":
			_graded(sim, 0.5)
		_:
			_graded(sim, 1.0)


# 乱建：随机空格 + 随机塔型（前 4 种，不含能量井）
static func _random(sim) -> void:
	var cells: Array = sim.grid.free_cells()
	if cells.size() == 0:
		sim.start_wave(true)
		return
	for _attempt in range(10):
		var c: Vector2i = cells[sim.rng.randi() % cells.size()] as Vector2i
		var id: String = String(Defs.TOWER_ORDER[sim.rng.randi() % 4])
		if sim.can_build(c.x, c.y, id):
			sim.build(c.x, c.y, id)
			return
	sim.start_wave(true)


# 评分建造：格子分 = 邻接路径的格数（塔能覆盖多少路面）。
# quality=1.0 取最优格；quality=0.5 在前 50% 里随机，模拟「大致会玩但不精算」的玩家。
static func _graded(sim, quality: float) -> void:
	if int(sim.towers.size()) >= 5 and sim.credits > 160:
		if _try_upgrade(sim):
			return
	var cands: Array = _scored_cells(sim)
	if cands.size() == 0:
		if _try_upgrade(sim):
			return
		sim.start_wave(true)
		return
	var span: int = maxi(1, int(float(cands.size()) * quality))
	var pick: int = 0
	if span > 1:
		pick = sim.rng.randi() % span
	var c: Dictionary = cands[pick] as Dictionary
	var cx: int = int(c["x"])
	var cy: int = int(c["y"])
	var id: String = _next_tower_id(sim, quality)
	if sim.can_build(cx, cy, id):
		sim.build(cx, cy, id)
		return
	for alt in Defs.TOWER_ORDER:
		var aid: String = String(alt)
		if sim.can_build(cx, cy, aid):
			sim.build(cx, cy, aid)
			return
	if _try_upgrade(sim):
		return
	sim.start_wave(true)


static func _next_tower_id(sim, quality: float) -> String:
	if quality >= 1.0:
		var idx: int = int(sim.towers.size())
		var pick: String = String(OPTIMAL_ORDER[idx % OPTIMAL_ORDER.size()])
		# 能量井只有在「火力底座够 + 现金充裕」时才值得——早期那 120 换成机炮塔
		# 能立刻换成击杀收益与更少的漏怪，跑分实测这一判断值 12 个百分点的通关率。
		if pick == "generator" and (idx < 3 or sim.credits < 320):
			pick = "vulcan"
		return pick
	var id: String = String(Defs.TOWER_ORDER[sim.rng.randi() % 4])
	return id


static func _try_upgrade(sim) -> bool:
	var best: int = -1
	var best_score: float = -1.0
	for i in range(sim.towers.size()):
		var t: Dictionary = sim.towers[i] as Dictionary
		var lv: int = int(t["level"])
		if lv >= Defs.MAX_LEVEL:
			continue
		var cost: int = Defs.tower_cost(String(t["id"]), lv + 1)
		if sim.credits < cost:
			continue
		# 优先升级击杀多的塔（简单启发：谁在输出就强化谁）
		var score: float = float(t["kills"]) + float(lv) * 0.5
		if score > best_score:
			best_score = score
			best = i
	if best < 0:
		return false
	return sim.upgrade(best)


# 候选格：按「邻接路径格数」降序，逐个做封死检查，取前 24 个合法格
static func _scored_cells(sim) -> Array:
	var on_path: Dictionary = {}
	for p in sim.path:
		var v: Vector2i = p as Vector2i
		on_path[Vector2i(v.x, v.y)] = true
	var scored: Array = []
	for c in sim.grid.free_cells():
		var cell: Vector2i = c as Vector2i
		var s: int = 0
		if on_path.has(Vector2i(cell.x + 1, cell.y)):
			s += 1
		if on_path.has(Vector2i(cell.x - 1, cell.y)):
			s += 1
		if on_path.has(Vector2i(cell.x, cell.y + 1)):
			s += 1
		if on_path.has(Vector2i(cell.x, cell.y - 1)):
			s += 1
		if s > 0:
			scored.append({"x": cell.x, "y": cell.y, "score": s})
	scored.sort_custom(func(a, b):
		return int(a["score"]) > int(b["score"])
	)
	var out: Array = []
	for item in scored:
		if out.size() >= 24:
			break
		var d: Dictionary = item as Dictionary
		var x: int = int(d["x"])
		var y: int = int(d["y"])
		if PathFinder.would_block(sim.grid, x, y):
			continue
		out.append(d)
	return out
