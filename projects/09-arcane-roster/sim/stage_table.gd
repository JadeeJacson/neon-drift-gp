extends RefCounted
class_name StageTable
## 12 个阶段的难度曲线 + 敌方编成生成。**难度曲线的唯一入口**（docs/09-立项 §2.5）。
##
## 设计原则：敌方强度只由一个公式控制（budget），编成由预算「买」出来。
## 这样调平衡只需要改一个数字，不需要重编 12 个阶段的阵容——这也是 06 波次表的教训
## （难度的中段最容易塌，见 docs/06-立项 §4.1 第 1 条）。
##
## 连胜惩罚：streak > 0 时预算上浮，模拟「你打赢了，对手也变强」的 TFT 式追压力。
## 这是自走棋的核心张力：**连胜越猛，赢得越难，但奖励也越多**。
##
## 「选谁」（吃预算）与「站哪」（吃棋盘）分成 compose 内部的两段：
## 前者是纯数值，后者是纯几何。混在一起会让预算计算被棋盘空格数污染。

const STAGE_COUNT := 18
const BOSS_STAGES := [6, 12, 18]
const STAGE_NAMES := [
	"边境哨站", "枯木林道", "断桥关", "碎石荒野", "焦土平原", "巨人之墓",
	"黑石要塞", "腐化祭坛", "寒霜峡谷", "哀嚎地窖", "断魂祭坛", "暗影之门",
	"白骨阶梯", "骸骨回廊", "深渊裂谷", "亡者王座前厅", "黑王座", "骷髅王座",
]


static func is_boss(stage: int) -> bool:
	return BOSS_STAGES.has(stage)


static func stage_name(stage: int) -> String:
	var i := clampi(stage, 1, STAGE_COUNT) - 1
	return String(STAGE_NAMES[i])


## 难度曲线的旋钮（调平衡只改这几行，跑分立刻见效）。
## 为什么集中成常数：docs/06-立项 §4.1 记过「难度不是单调旋钮，中段最容易塌」，
## 所以每个旋钮都要能单独扫，而不是散落在编成逻辑里。
##
## 为什么是**分段**而不是一条直线（实测教训）：18 阶段版本用单斜率时，
## 末期预算高到「任何阵容都打不过最终 Boss」——三种画像的通关率一起被顶在 40%，
## 画像之间的差异完全看不见（40 / 40 / 0）。改成「前 6 阶段陡、后期缓」之后，
## 玩家有足够时间把战力堆到能打穿终盘，而前期的压力一点没减。
const BUDGET_BASE := 270.0
const BUDGET_EARLY_PER_STAGE := 120.0
const BUDGET_LATE_PER_STAGE := 88.0
const BUDGET_EARLY_STAGES := 6
const BUDGET_STREAK := 25.0

## 敌方战力预算。单位是「战力点数」，与 UnitTable.power 同一口径。
## 曲线的两个端点由跑分标定（tools/sim_report.gd）：S1 预算必须让「3 个廉价 1★」的龟缩流
## 打不过，否则第一分钟就没有决策压力；S18 必须让满运营阵容险胜，否则没有后期张力。
static func budget(stage: int, streak: int) -> float:
	var s := maxi(stage, 1)
	var early: int = mini(s, BUDGET_EARLY_STAGES)
	var late: int = maxi(s - BUDGET_EARLY_STAGES, 0)
	return BUDGET_BASE \
		+ float(early) * BUDGET_EARLY_PER_STAGE \
		+ float(late) * BUDGET_LATE_PER_STAGE \
		+ float(maxi(streak, 0)) * BUDGET_STREAK


## 该阶段的敌方人数。**必须与玩家在该阶段的人口上限同量级**（3 → 6）：
## 敌方只有 2 个单位时，玩家 3 个单位就是白送，战斗 2 秒结束，没有决策空间。
## 公式与 RunState.population_cap() 的前两项一致，只差「上一场赢了 +1」那点优势——
## 也就是说玩家的先手是真实存在的，不该被抹平。
static func unit_slots(stage: int) -> int:
	return clampi(3 + int((maxi(stage, 1) - 1) / 2), 3, 6)


## 精英（2★）出现的最早阶段。前期全是 1★，让玩家的「凑三升一」有一条追赶线。
const ELITE_FROM_STAGE := 5


## 生成一整套敌方编成：[{id, star, cell}]，可直接喂给 BattleSim。
## 同 (stage, streak, seed) 必然同结果——这是整局跑分能断言的前提。
static func roll_enemy(rng: SimRng, stage: int, streak: int) -> Array:
	var budget_left := budget(stage, streak)
	var slots := unit_slots(stage)
	var picked: Array = []          # [{id, star}]

	if is_boss(stage):
		var boss_id := "b_sking" if stage != 8 else "b_lord"
		picked.append({"id": boss_id, "star": 1})
		budget_left -= EnemyTable.power(boss_id, 1)
		slots -= 1
		# Boss 阶段多给一个随从位：否则「Boss 占掉一个名额」等于让玩家在最难的三场少打一人
		slots += 1

	while picked.size() < slots and budget_left > 40.0:
		var weights: Dictionary = {}
		for id in EnemyTable.ids():
			var eid := String(id)
			if EnemyTable.is_boss(eid):
				continue
			if EnemyTable.power(eid, 1) > budget_left:
				continue
			var w := EnemyTable.roll_weight(eid)
			# 越后期越偏刺客/远程：避免 12 个阶段全是坦克推进
			if stage >= 6 and String(EnemyTable.ENEMIES[id]["role"]) == "mid":
				w += 6.0
			weights[id] = w
		if weights.is_empty():
			break
		var pick = rng.pick_weighted(weights)
		if pick == null:
			break
		var pid := String(pick)
		# 星级：难度真正爬升的地方。**只抬预算是没用的**——敌方强度被
		# 「人数上限 × 精英概率」卡住，实测把预算从 1440 抬到 1836，跑分一个数都没变。
		# 精英率必须**封顶**：不封顶时 S18 的 2★ 概率是 100%、3★ 是 76%，
		# 于是终盘敌方战力 2000+ 而玩家天花板只有 1300，通关率被死死顶在 40%，
		# 三种画像的差异完全看不见（40/40/0）。
		var star := 1
		if stage >= ELITE_FROM_STAGE and rng.chance(minf(0.78, 0.30 + 0.10 * float(stage - ELITE_FROM_STAGE))):
			star = 2
		if stage >= 8 and rng.chance(minf(0.42, 0.16 + 0.07 * float(stage - 8))):
			star = 3
		while star > 1 and EnemyTable.power(pid, star) > budget_left:
			star -= 1
		picked.append({"id": pid, "star": star})
		budget_left -= EnemyTable.power(pid, star)

	return place(picked)


## 布阵：坦克贴前线、远程压后排；Boss 无论定位都站最前排正中（要让玩家看清 boss）
static func place(picked: Array) -> Array:
	var ordered: Array = picked.duplicate()
	# Boss 必须站最前排正中：玩家要能一眼看清「这场我打的是谁」，
	# 所以排序时把 boss 的 rank 压到 -1，而不是跟着它的 role 走（暗影领主是远程）
	ordered.sort_custom(func(a, b):
		var ba := EnemyTable.is_boss(String(a["id"]))
		var bb := EnemyTable.is_boss(String(b["id"]))
		if ba != bb:
			return ba
		var ra := _role_rank(String(EnemyTable.ENEMIES[String(a["id"])]["role"]))
		var rb := _role_rank(String(EnemyTable.ENEMIES[String(b["id"])]["role"]))
		if ra != rb:
			return ra < rb
		return String(a["id"]) < String(b["id"]))   # 同职能按 id 排序，保证确定性
	var occ: Dictionary = {}
	var out: Array = []
	for p in ordered:
		var cell := Board.auto_place_cell(Board.ENEMY, occ)
		occ[cell] = String(p["id"])
		out.append({"id": String(p["id"]), "star": int(p["star"]), "cell": cell})
	return out


static func _role_rank(role: String) -> int:
	match role:
		"front":
			return 0
		"mid":
			return 1
		_:
			return 2
