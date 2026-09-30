extends RefCounted
class_name Achievements
## 成就：定义与判定全在 sim（纯函数、不碰节点），所以「达成条件」能在 headless 里
## 逐条断言；引擎侧（achievement_tracker.gd）只负责收集事件、持久化、弹提示。
##
## 为什么全部做成「计数器 ≥ 阈值」这一种形状：
## 成就系统最容易烂掉的地方是「每条成就一段自定义逻辑」，三个月后没人记得
## 哪条在什么条件下会响。统一成 stat + need 之后，新增一条只是加一行表，
## 判定、进度条、持久化都自动成立。

## 事件计数的合法名单。tracker 只允许往这些键上加数，
## 写错键名会立刻在 validate() 里暴露，而不是「成就永远不响」
const EVENT_STATS := {
	"max_depth": true, "parries": true, "reflects": true, "kills": true,
	"chain_kills": true, "executes": true, "flawless_rooms": true,
	"gasping_executes": true, "fast_rooms": true, "melee_only_runs": true,
	"drown_escapes": true, "shots": true, "deaths": true, "runs": true,
}

const DEFS := [
	{"id": "first_dive", "display": "初次下潜", "desc": "抵达第 2 层",
	"stat": "max_depth", "need": 2, "tier": 1},
	{"id": "depth_8", "display": "深渊来客", "desc": "抵达第 8 层",
	"stat": "max_depth", "need": 8, "tier": 2},
	{"id": "depth_16", "display": "触底", "desc": "抵达第 16 层（通关）",
	"stat": "max_depth", "need": 16, "tier": 3},

	{"id": "parry_10", "display": "读招者", "desc": "累计弹反 10 次",
	"stat": "parries", "need": 10, "tier": 1},
	{"id": "parry_60", "display": "刀尖舞者", "desc": "累计弹反 60 次",
	"stat": "parries", "need": 60, "tier": 2},
	{"id": "parry_200", "display": "它出不出手我都清楚", "desc": "累计弹反 200 次",
	"stat": "parries", "need": 200, "tier": 3},

	{"id": "reflect_5", "display": "以彼之道", "desc": "把飞行道具弹反 5 次",
	"stat": "reflects", "need": 5, "tier": 1},
	{"id": "reflect_30", "display": "刺都不还给你", "desc": "把飞行道具弹反 30 次",
	"stat": "reflects", "need": 30, "tier": 2},

	{"id": "kill_100", "display": "清道夫", "desc": "累计击杀 100 只",
	"stat": "kills", "need": 100, "tier": 1},
	{"id": "chain_kill_15", "display": "三段连击", "desc": "用轻击三段击杀 15 次",
	"stat": "chain_kills", "need": 15, "tier": 2},
	{"id": "execute_25", "display": "处决者", "desc": "完成 25 次处决",
	"stat": "executes", "need": 25, "tier": 2},

	{"id": "flawless_room", "display": "片尘不染", "desc": "整层一次没被打到",
	"stat": "flawless_rooms", "need": 1, "tier": 2},
	{"id": "flawless_10", "display": "干净得像没来过", "desc": "累计 10 层无伤",
	"stat": "flawless_rooms", "need": 10, "tier": 3},
	{"id": "gasping_execute", "display": "缺氧反杀", "desc": "氧低于 10 时完成一次处决",
	"stat": "gasping_executes", "need": 1, "tier": 2},
	{"id": "fast_room", "display": "快潜", "desc": "20 秒内通过一层",
	"stat": "fast_rooms", "need": 1, "tier": 1},
	{"id": "melee_only", "display": "近身派", "desc": "一局杀 30 只且一次远程都没用",
	"stat": "melee_only_runs", "need": 1, "tier": 3},
	{"id": "drown_escape", "display": "抢回一口气", "desc": "氧空之后又补回 30",
	"stat": "drown_escapes", "need": 1, "tier": 2},
]


static func defs() -> Array:
	return DEFS


static func by_id(id: String) -> Dictionary:
	for d in DEFS:
		if str(d["id"]) == id:
			return d
	return {}


## 进度（0..1），给 HUD 画进度条用
static func progress(def: Dictionary, stats: Dictionary) -> float:
	var need: int = int(def["need"])
	if need <= 0:
		return 1.0
	var have: int = int(stats.get(str(def["stat"]), 0))
	return minf(float(have) / float(need), 1.0)


## 一次评估：返回本次新达成的 id 列表（已解锁的不再返回，避免重复弹窗）。
## 纯函数——同一份 stats + unlocked 必然同一结果，所以可以逐条断言
static func evaluate(stats: Dictionary, unlocked: Dictionary) -> Array[String]:
	var fresh: Array[String] = []
	for d in DEFS:
		var id := str(d["id"])
		if unlocked.has(id):
			continue
		if int(stats.get(str(d["stat"]), 0)) >= int(d["need"]):
			fresh.append(id)
	return fresh


## 一局（或一层）结束时才结算得出来的派生计数。
## 这些不能靠边玩边加：比如「本层无伤」必须等这层结束才知道
static func run_extras(room: Dictionary) -> Dictionary:
	var out := {}
	if int(room.get("damage_taken", 0)) == 0 and int(room.get("index", 0)) > 0:
		out["flawless_rooms"] = 1
	if float(room.get("seconds", 999.0)) <= 20.0:
		out["fast_rooms"] = 1
	if int(room.get("kills", 0)) >= 30 and int(room.get("shots", 0)) == 0:
		out["melee_only_runs"] = 1
	return out


## 自检：表本身必须站得住。ID 唯一、文案齐全、每条的 stat 都在事件名单里，
## 且同一条线上的阈值不能相同（否则会出现「同一帧同时解锁两级」）
static func validate() -> Array[String]:
	var problems: Array[String] = []
	var seen := {}
	var by_stat := {}
	for d in DEFS:
		var id := str(d["id"])
		if seen.has(id):
			problems.append("成就 id 重复：" + id)
		seen[id] = true
		if str(d["display"]) == "" or str(d["desc"]) == "":
			problems.append(id + " 缺文案")
		if int(d["need"]) <= 0:
			problems.append(id + " 阈值必须 > 0")
		if int(d["tier"]) < 1 or int(d["tier"]) > 3:
			problems.append(id + " 等级不在 1–3")
		if not EVENT_STATS.has(str(d["stat"])):
			problems.append("%s 引用了未登记的事件计数 %s" % [id, str(d["stat"])])
		var stat := str(d["stat"])
		if not by_stat.has(stat):
			by_stat[stat] = []
		(by_stat[stat] as Array).append(int(d["need"]))
	for stat in by_stat:
		var needs: Array = by_stat[stat]
		for i in range(1, needs.size()):
			if int(needs[i]) == int(needs[i - 1]):
				problems.append("成就线 %s 有两个相同阈值 %d" % [stat, int(needs[i])])
	return problems
