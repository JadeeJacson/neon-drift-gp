class_name MatchSim
extends RefCounted

# 整局确定性模拟：固定 tick、纯逻辑、不碰场景树与物理。
# 同种子必然同结果 → 可以精确断言（路线图 §4.3：把逐帧可比的部分下沉进 sim）。
# 装配层复用 Defs/Combat/Waves/Economy/PathFinder，保证「跑分调过的数」就是实机跑的数。

const TICK: float = 1.0 / 30.0
const STRATEGY_INTERVAL: float = 0.3  # bot 决策节流（每 tick 决策会把跑分拖慢一个量级）

const PHASE_BUILD: String = "build"
const PHASE_COMBAT: String = "combat"
const PHASE_WON: String = "won"
const PHASE_LOST: String = "lost"

var grid: Grid
var path: Array = []
var path_len: float = 0.0
var towers: Array = []
var enemies: Array = []
var credits: int = 0
var core_hp: int = 20
var wave: int = 1
var phase: String = PHASE_BUILD
var build_left: float = 0.0
var ability_cd: float = 0.0  # 轨道炮打击冷却（玩家手动技能的出口）
var queue: Array = []
var clock: float = 0.0
var elapsed: float = 0.0
var rng: RandomNumberGenerator
var profile: String = "balanced"
var stats: Dictionary = {}
var events: Array = []  # 渲染层的反馈通道：开火 / 击杀 / 漏怪 / 自爆 / 塔被毁
var _next_uid: int = 0
var _strategy_timer: float = 0.0


func setup(w: int, h: int, sp: Vector2i, co: Vector2i, seed_value: int, prof: String) -> void:
	grid = Grid.new(w, h)
	grid.spawn = sp
	grid.core = co
	grid.set_at(sp.x, sp.y, Grid.Cell.SPAWN)
	grid.set_at(co.x, co.y, Grid.Cell.CORE)
	rng = RandomNumberGenerator.new()
	rng.seed = seed_value
	profile = prof
	credits = Economy.START_CREDITS
	core_hp = 20
	wave = 1
	phase = PHASE_BUILD
	build_left = Waves.BUILD_TIME
	queue = []
	clock = 0.0
	elapsed = 0.0
	_next_uid = 0
	_strategy_timer = 0.0
	towers = []
	enemies = []
	stats = {
		"kills": 0, "built": 0, "leaked": 0, "sold": 0,
		"upgrades": 0, "towers_lost": 0, "credits_earned": 0,
	}
	events = []
	recompute_path()


# 渲染层每帧取走事件（sim 只管产出，不管表现）
func drain_events() -> Array:
	var out: Array = events
	events = []
	return out


func recompute_path() -> void:
	path = PathFinder.bfs(grid, grid.spawn, grid.core)
	path_len = float(maxi(path.size() - 1, 0))


func pos_at(d: float) -> Vector2:
	if path.size() < 2:
		return Vector2(float(grid.spawn.x) + 0.5, float(grid.spawn.y) + 0.5)
	var seg: int = clampi(int(floor(d)), 0, path.size() - 2)
	var t: float = clampf(d - float(seg), 0.0, 1.0)
	var a: Vector2i = path[seg] as Vector2i
	var b: Vector2i = path[seg + 1] as Vector2i
	return Vector2(
		lerp(float(a.x) + 0.5, float(b.x) + 0.5, t),
		lerp(float(a.y) + 0.5, float(b.y) + 0.5, t)
	)


# —— 建造 / 升级 / 出售 ——

func can_build(x: int, y: int, id: String) -> bool:
	if not grid.can_place(x, y):
		return false
	if PathFinder.would_block(grid, x, y):
		return false
	if credits < Defs.tower_cost(id, 1):
		return false
	return true


func build(x: int, y: int, id: String) -> bool:
	if not can_build(x, y, id):
		return false
	grid.place_tower(x, y)
	var cost: int = Defs.tower_cost(id, 1)
	credits -= cost
	towers.append({
		"x": x, "y": y, "id": id, "level": 1, "cd": 0.0,
		"hp": Defs.tower_max_hp(1), "spent": cost, "kills": 0,
	})
	stats["built"] = int(stats["built"]) + 1
	recompute_path()
	return true


func upgrade(i: int) -> bool:
	if i < 0 or i >= towers.size():
		return false
	var t: Dictionary = towers[i] as Dictionary
	var lv: int = int(t["level"])
	if lv >= Defs.MAX_LEVEL:
		return false
	var cost: int = Defs.tower_cost(String(t["id"]), lv + 1)
	if credits < cost:
		return false
	credits -= cost
	t["level"] = lv + 1
	t["spent"] = int(t["spent"]) + cost
	t["hp"] = Defs.tower_max_hp(lv + 1)
	stats["upgrades"] = int(stats["upgrades"]) + 1
	return true


func sell(i: int) -> bool:
	if i < 0 or i >= towers.size():
		return false
	var t: Dictionary = towers[i] as Dictionary
	credits += Economy.sell_refund(int(t["spent"]))
	grid.remove_tower(int(t["x"]), int(t["y"]))
	towers.remove_at(i)
	stats["sold"] = int(stats["sold"]) + 1
	recompute_path()
	return true


# 玩家手动技能：轨道炮打击（200 溅射，冷却 45 秒）
func orbital_strike(x: float, y: float) -> bool:
	if ability_cd > 0.0:
		return false
	ability_cd = 45.0
	events.append({"t": "strike", "x": x, "y": y})
	for i in range(enemies.size()):
		var e: Dictionary = enemies[i] as Dictionary
		var alive: bool = bool(e["alive"])
		if not alive:
			continue
		if Combat.dist2(x, y, float(e["x"]), float(e["y"])) > 6.25:  # 半径 2.5 格
			continue
		Combat.apply_hit(e, 200.0, "explosive")
		if float(e["hp"]) <= 0.0:
			e["alive"] = false
			events.append({"t": "kill", "x": float(e["x"]), "y": float(e["y"]), "id": String(e["id"])})
			credits += int(e["bounty"])
			stats["kills"] = int(stats["kills"]) + 1
	return true


func start_wave(early: bool) -> void:
	if phase != PHASE_BUILD:
		return
	if early:
		credits += Economy.early_bonus(build_left)
	queue = Waves.spawn_plan(wave)
	clock = 0.0
	phase = PHASE_COMBAT


# —— 主循环 ——

func step(dt: float) -> void:
	if phase == PHASE_WON or phase == PHASE_LOST:
		return
	elapsed += dt
	if ability_cd > 0.0:
		ability_cd = maxf(0.0, ability_cd - dt)
	if phase == PHASE_BUILD:
		build_left -= dt
		_strategy_timer += dt
		if _strategy_timer >= STRATEGY_INTERVAL:
			_strategy_timer = 0.0
			Strategy.act(self, profile)
		if build_left <= 0.0:
			start_wave(false)
		return
	clock += dt
	_spawn_due()
	_move(dt)
	_heal(dt)
	_fire(dt)
	_cleanup()
	if core_hp <= 0:
		core_hp = 0
		phase = PHASE_LOST
		return
	if queue.size() == 0 and _alive_count() == 0:
		_end_wave()


func run(max_seconds: float = 1200.0) -> Dictionary:
	var guard: int = 0
	while phase != PHASE_WON and phase != PHASE_LOST and elapsed < max_seconds:
		step(TICK)
		guard += 1
		if guard > 400000:
			break
	return result()


func result() -> Dictionary:
	return {
		"result": phase,
		"wave": wave,
		"elapsed": elapsed,
		"core_hp": core_hp,
		"kills": int(stats["kills"]),
		"built": int(stats["built"]),
		"leaked": int(stats["leaked"]),
		"upgrades": int(stats["upgrades"]),
		"credits": credits,
		"towers": towers.size(),
	}


# —— 内部 ——

func _spawn_due() -> void:
	while queue.size() > 0:
		var e: Dictionary = queue[0] as Dictionary
		var t: float = float(e["t"])
		if t > clock:
			break
		queue.remove_at(0)
		var eid: String = String(e["id"])
		_spawn(eid)


func _spawn(eid: String) -> void:
	var def: Dictionary = Defs.enemy(eid)
	var p: Vector2 = pos_at(0.0)
	enemies.append({
		"id": eid,
		"uid": _next_uid,
		"hp": float(def["hp"]),
		"max_hp": float(def["hp"]),
		"shield": float(def["shield"]),
		"armor": float(def["armor"]),
		"speed": float(def["speed"]),
		"dist": 0.0,
		"x": p.x,
		"y": p.y,
		"alive": true,
		"slow_f": 0.0,
		"slow_t": 0.0,
		"bounty": int(def["bounty"]),
		"leak": int(def["leak"]),
		"heal": float(def.get("heal", 0.0)),
		"bomb": float(def.get("bomb", 0.0)),
	})
	_next_uid += 1


func _move(dt: float) -> void:
	for i in range(enemies.size()):
		var e: Dictionary = enemies[i] as Dictionary
		var alive: bool = bool(e["alive"])
		if not alive:
			continue
		var slow: float = 0.0
		var st: float = float(e["slow_t"]) - dt
		e["slow_t"] = st
		if st > 0.0:
			slow = float(e["slow_f"])
		var d: float = float(e["dist"]) + float(e["speed"]) * (1.0 - slow) * dt
		e["dist"] = d
		var p: Vector2 = pos_at(d)
		e["x"] = p.x
		e["y"] = p.y
		if d >= path_len:
			core_hp -= int(e["leak"])
			stats["leaked"] = int(stats["leaked"]) + 1
			e["alive"] = false
			events.append({"t": "leak", "x": p.x, "y": p.y, "dmg": int(e["leak"])})
			continue
		var bomb: float = float(e["bomb"])
		if bomb > 0.0:
			var ti: int = _nearest_tower_index(p.x, p.y, 1.3)
			if ti >= 0:
				var t: Dictionary = towers[ti] as Dictionary
				t["hp"] = float(t["hp"]) - bomb
				e["alive"] = false
				events.append({"t": "boom", "x": p.x, "y": p.y})


func _heal(dt: float) -> void:
	for i in range(enemies.size()):
		var e: Dictionary = enemies[i] as Dictionary
		var alive: bool = bool(e["alive"])
		if not alive:
			continue
		var heal: float = float(e["heal"])
		if heal <= 0.0:
			continue
		for j in range(enemies.size()):
			if j == i:
				continue
			var o: Dictionary = enemies[j] as Dictionary
			var o_alive: bool = bool(o["alive"])
			if not o_alive:
				continue
			if Combat.dist2(float(e["x"]), float(e["y"]), float(o["x"]), float(o["y"])) > 2.25:
				continue
			var hp: float = float(o["hp"])
			if hp < float(o["max_hp"]):
				o["hp"] = minf(float(o["max_hp"]), hp + heal * dt)


func _fire(dt: float) -> void:
	for i in range(towers.size()):
		var t: Dictionary = towers[i] as Dictionary
		var tid: String = String(t["id"])
		var lv: int = int(t["level"])
		var def: Dictionary = Defs.tower_level(tid, lv)
		var dtype: String = String(def["type"])
		if dtype == "none":
			continue
		var cd: float = float(t["cd"]) - dt
		t["cd"] = cd
		if cd > 0.0:
			continue
		var tx: float = float(t["x"]) + 0.5
		var ty: float = float(t["y"]) + 0.5
		var rngv: float = float(def["range"])
		var target: int = Combat.pick_target(enemies, tx, ty, rngv)
		if target < 0:
			continue
		var rate: float = float(def["rate"])
		t["cd"] = 1.0 / maxf(rate, 0.01)
		var dmg: float = float(def["dmg"])
		var tgt: Dictionary = enemies[target] as Dictionary
		Combat.apply_hit(tgt, dmg, dtype)
		events.append({
			"t": "fire", "id": tid, "level": lv,
			"x": tx, "y": ty, "ex": float(tgt["x"]), "ey": float(tgt["y"]),
			"uid": int(tgt["uid"]),
		})
		var slow: float = float(def.get("slow", 0.0))
		if slow > 0.0:
			tgt["slow_f"] = slow
			tgt["slow_t"] = 1.2
		# 链式（力场塔）：对射程内其他目标造成半伤
		var chain: int = int(def.get("chain", 0))
		if chain > 1:
			var hit: int = 1
			for j in range(enemies.size()):
				if hit >= chain:
					break
				if j == target:
					continue
				var o: Dictionary = enemies[j] as Dictionary
				var o_alive: bool = bool(o["alive"])
				if not o_alive:
					continue
				if Combat.dist2(tx, ty, float(o["x"]), float(o["y"])) > rngv * rngv:
					continue
				Combat.apply_hit(o, dmg * 0.5, dtype)
				o["slow_f"] = slow
				o["slow_t"] = 1.2
				hit += 1
		# 溅射（导弹塔）
		var splash: float = float(def.get("splash", 0.0))
		if splash > 0.0:
			for j in range(enemies.size()):
				if j == target:
					continue
				var o: Dictionary = enemies[j] as Dictionary
				var o_alive: bool = bool(o["alive"])
				if not o_alive:
					continue
				if Combat.dist2(float(tgt["x"]), float(tgt["y"]), float(o["x"]), float(o["y"])) > splash * splash:
					continue
				Combat.apply_hit(o, dmg * 0.5, dtype)
		if float(tgt["hp"]) <= 0.0 and bool(tgt["alive"]):
			tgt["alive"] = false
			events.append({"t": "kill", "x": float(tgt["x"]), "y": float(tgt["y"]), "id": String(tgt["id"])})
			credits += int(tgt["bounty"])
			stats["kills"] = int(stats["kills"]) + 1
			stats["credits_earned"] = int(stats["credits_earned"]) + int(tgt["bounty"])
			t["kills"] = int(t["kills"]) + 1


func _cleanup() -> void:
	var i: int = enemies.size() - 1
	while i >= 0:
		var e: Dictionary = enemies[i] as Dictionary
		if not bool(e["alive"]):
			enemies.remove_at(i)
		i -= 1
	var j: int = towers.size() - 1
	while j >= 0:
		var t: Dictionary = towers[j] as Dictionary
		if float(t["hp"]) <= 0.0:
			events.append({"t": "tower_down", "x": float(t["x"]) + 0.5, "y": float(t["y"]) + 0.5})
			grid.remove_tower(int(t["x"]), int(t["y"]))
			towers.remove_at(j)
			stats["towers_lost"] = int(stats["towers_lost"]) + 1
			recompute_path()
		j -= 1


func _alive_count() -> int:
	var n: int = 0
	for e in enemies:
		var d: Dictionary = e as Dictionary
		var alive: bool = bool(d["alive"])
		if alive:
			n += 1
	return n


func _end_wave() -> void:
	credits += Economy.wave_bonus(wave)
	for t in towers:
		var d: Dictionary = t as Dictionary
		if String(d["id"]) == "generator":
			var inc: int = int(Defs.tower_level("generator", int(d["level"])).get("income", 0))
			credits += inc
	wave += 1
	if wave > Waves.TOTAL:
		phase = PHASE_WON
	else:
		phase = PHASE_BUILD
		build_left = Waves.BUILD_TIME
		_strategy_timer = 0.0


func _nearest_tower_index(x: float, y: float, maxd: float) -> int:
	var best: int = -1
	var best_d: float = maxd * maxd
	for i in range(towers.size()):
		var t: Dictionary = towers[i] as Dictionary
		var d: float = Combat.dist2(x, y, float(t["x"]) + 0.5, float(t["y"]) + 0.5)
		if d <= best_d:
			best_d = d
			best = i
	return best
