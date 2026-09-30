extends Node
class_name AchievementTracker
## 成就的引擎侧：收集事件、持久化、上报。判定逻辑一条都不在这里——
## 全在 sim/achievements.gd 的纯函数里，所以「达成条件」能被 headless 测试逐条断言。

const A := preload("res://sim/achievements.gd")
const SAVE_PATH := "user://achievements.cfg"

signal unlocked(def: Dictionary)
signal stats_changed(stats: Dictionary)

var stats: Dictionary = {}
var unlocked_ids: Dictionary = {}

# 本层计数：用来结算「无伤层 / 快潜 / 近身派」这类只有层结束才知道的成就
var _room_index := 0
var _room_damage := 0
var _room_seconds := 0.0
var _room_kills := 0
var _room_shots := 0
var _o2_emptied := false


func _ready() -> void:
	load_save()


func _physics_process(delta: float) -> void:
	_room_seconds += delta


# ---------- 事件入口 ----------

func bump(stat: String, amount: int = 1) -> void:
	if not A.EVENT_STATS.has(stat):
		# 键名写错不会「静默不响」，而是当场报出来——这是 EVENT_STATS 存在的唯一理由
		push_error("未登记的成就计数键：" + stat)
		return
	stats[stat] = int(stats.get(stat, 0)) + amount
	_evaluate()


## 只增不减的指标（最大层数）
func raise(stat: String, value: int) -> void:
	if int(stats.get(stat, 0)) < value:
		set_stat(stat, value)


func set_stat(stat: String, value: int) -> void:
	if not A.EVENT_STATS.has(stat):
		push_error("未登记的成就计数键：" + stat)
		return
	stats[stat] = value
	_evaluate()


func on_player_damaged(_amount: float, _source: Node2D) -> void:
	_room_damage += 1


func on_kill(attack_id: String) -> void:
	_room_kills += 1
	bump("kills")
	if attack_id == "light_3":
		bump("chain_kills")


func on_shot() -> void:
	_room_shots += 1
	bump("shots")


## 氧空过一次：给「抢回一口气」当前置条件
func note_o2_empty() -> void:
	_o2_emptied = true


func note_o2_recovered(value: float) -> void:
	if _o2_emptied and value >= 30.0:
		_o2_emptied = false
		bump("drown_escapes")


## 一层结束（下潜或重开都算）
func on_room_end(depth: int) -> void:
	var extras: Dictionary = A.run_extras({
		"index": _room_index, "damage_taken": _room_damage,
		"seconds": _room_seconds, "kills": _room_kills, "shots": _room_shots,
	})
	for k in extras:
		bump(str(k), int(extras[k]))
	_room_index += 1
	_room_damage = 0
	_room_seconds = 0.0
	_room_kills = 0
	_room_shots = 0
	raise("max_depth", depth)


func reset_run() -> void:
	_room_index = 0
	_room_damage = 0
	_room_seconds = 0.0
	_room_kills = 0
	_room_shots = 0
	_o2_emptied = false
	bump("runs")


func _evaluate() -> void:
	var fresh: Array[String] = A.evaluate(stats, unlocked_ids)
	if fresh.is_empty():
		stats_changed.emit(stats)
		return
	for id in fresh:
		unlocked_ids[id] = true
		unlocked.emit(A.by_id(id))
	save()
	stats_changed.emit(stats)


func snapshot() -> Dictionary:
	return {"stats": stats.duplicate(), "unlocked": unlocked_ids.size(),
			"total": A.DEFS.size(), "room_damage": _room_damage}


# ---------- 持久化（本机一次解锁即永久，重开不重置） ----------

func load_save() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		return
	# 4.7 的 API 是 get_section_keys()，没有 get_keys()。
	# 写错不会只「读不到档」：它会在 _ready 里抛错并中断后面的语句，
	# 表现为不相干的断言集体失败（上一轮重开测试就是这么坏的）
	if cfg.has_section("ach"):
		for k in cfg.get_section_keys("ach"):
			unlocked_ids[str(k)] = true
	if cfg.has_section("stat"):
		for k in cfg.get_section_keys("stat"):
			var key := str(k)
			if A.EVENT_STATS.has(key):
				stats[key] = int(cfg.get_value("stat", k, 0))


func save() -> void:
	var cfg := ConfigFile.new()
	for id in unlocked_ids:
		cfg.set_value("ach", str(id), true)
	for k in stats:
		cfg.set_value("stat", str(k), int(stats[k]))
	cfg.save(SAVE_PATH)
