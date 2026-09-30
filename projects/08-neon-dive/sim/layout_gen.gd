extends RefCounted
class_name LayoutGen
## 分层房间生成（docs/08 §3.4）。纯函数 + 自带确定性 RNG，不碰引擎随机数，
## 所以「同一 depth + seed 必然同一张图」可以在 headless 里逐字段断言（路线图 §4.3）。
##
## 三件事在这一份里一起做，因为它们互相咬住：
## ① 关卡特异性：结构参数全部来自 Biomes，不在这里写死；
## ② 敌人站位与分布：按阵型放（地面组 / 高台组 / 伏击群），有最小间距，
##    不堵出口、不掉进沟里——上一版是「随机 x 撒几个」，结果怪会叠在一起；
## ③ 平台高度玩法：平台有 kind（solid/crumble/bounce），
##    高差 >3 格的地方必须在下方放弹台，否则那是「看着能上其实上不去」。
##
## 数值来源是 MovementParams：满跳 4.01 格、满跳水平 6.4 格。

const BI := preload("res://sim/biomes.gd")

const TILE := 16
const ROOM_HEIGHT := 22          # 格；352 px，比视野 360 略小，保证上下都不出屏
const FLOOR_ROW := 20            # 地面所在行（格）
const MIN_ROOMS := 3
const MAX_ROOMS := 5
const ROOM_WIDTH_MIN := 46
const ROOM_WIDTH_MAX := 64
const MAX_STEP_TILES := 3        # 无弹台时的最大抬升；满跳 4.01 格，留 1 格余量
const BOUNCE_STEP_TILES := 7     # 有弹台垫脚时允许的高差
const MAX_ABS_RISE := 8          # 平台相对地面的最大高度：自检抓到过「逐块 +2 最后爬到 10 格」
const MIN_ENEMY_SPACE := 5       # 敌人之间的最小水平间距（格），防止叠成一座山
const EXIT_CLEAR_TILES := 7      # 出口门前留空，否则玩家无路可站
const PLATFORM_EDGE_PAD := 4     # 平台不贴房间左右边界

const ROOM_TYPES := ["combat", "resource", "combat", "secret", "combat", "shop"]
const ENEMY_IDS := ["crawler", "spitter"]
const PLATFORM_KINDS := ["solid", "crumble", "bounce"]


## 确定性 LCG（Numerical Recipes 参数）。不用引擎 RNG：它的序列不属于跨版本稳定的契约
class Rng:
	var s: int

	func _init(seed_value: int) -> void:
		s = seed_value & 0x7FFFFFFF

	func next_int() -> int:
		s = (s * 1664525 + 1013904223) & 0x7FFFFFFF
		return s

	func int_range(lo: int, hi: int) -> int:
		if hi <= lo:
			return lo
		return lo + next_int() % (hi - lo + 1)

	func chance(pct: int) -> bool:
		return next_int() % 100 < pct


static func generate(depth: int, seed: int) -> Dictionary:
	var biome: Dictionary = BI.for_depth(depth)
	var rng := Rng.new(seed * 2654435761 + depth * 40503)
	var room_count := clampi(2 + int(depth / 2.0) + (1 if rng.chance(50) else 0), MIN_ROOMS, MAX_ROOMS)
	# 「整层至少一条沟」必须在放敌人**之前**就定下来。上一版是在所有房建完之后
	# 补插一条沟，结果沟开在已放好的敌人脚下（自检报 35 次「敌人放在沟上」）
	var mid_index := int(room_count / 2.0)
	var rooms: Array = []
	var cursor := 0
	for i in room_count:
		var width := rng.int_range(ROOM_WIDTH_MIN, ROOM_WIDTH_MAX)
		var room := _make_room(depth, i, room_count, width, cursor, rng, biome, i == mid_index)
		rooms.append(room)
		cursor += width
	return {
		"depth": depth,
		"seed": seed,
		"biome": str(biome["id"]),
		"rooms": rooms,
		"total_width_tiles": cursor,
		"floor_row": FLOOR_ROW,
		"room_height": ROOM_HEIGHT,
		"pit_row": FLOOR_ROW + 4,   # 掉过这条线算掉出层（比地面再低 4 格）
	}


static func _make_room(depth: int, index: int, count: int, width: int, x0: int,
		rng: Rng, biome: Dictionary, force_gap: bool) -> Dictionary:
	var type := "entry" if index == 0 else ("exit" if index == count - 1 \
			else str(ROOM_TYPES[(depth + index) % ROOM_TYPES.size()]))
	var room := {
		"index": index, "type": type, "x": x0, "width": width,
		"platforms": [], "gaps": [], "enemies": [], "lamps": [], "pickups": [],
	}
	match type:
		"entry":
			_room_platforms(room, rng, biome, 1)
		"exit":
			_room_platforms(room, rng, biome, 1)
		_:
			# 沟的数量由群系决定（浅裂带常没有，深渊几乎每房一条）；
			# force_gap 是本层的「必有沟」保证（掉坑是基础机制，不能靠运气）
			if force_gap or rng.chance(int(biome["gap_chance"])):
				_room_gaps(room, width, rng, 1)
			_room_platforms(room, rng, biome, 0)
	_room_lamps(room, width, biome, type)
	if type == "combat" or type == "secret":
		_room_enemies(room, depth, rng, biome, type == "secret")
	if type == "resource" or type == "shop" or type == "secret":
		_room_pickups(room, width, rng)
	return room


## 沟（掉下去就是死）。宽度上限来自满跳水平 6.4 格，留 1.4 格容错
static func _room_gaps(room: Dictionary, width: int, rng: Rng, count: int) -> void:
	for _i in count:
		var gap_w := rng.int_range(2, 5)
		var gx := rng.int_range(8, maxi(width - gap_w - 8, 9))
		room["gaps"].append({"x": gx, "w": gap_w})


## 平台：逐块抬升不超过 3 格；需要更高时下面必须有弹台
static func _room_platforms(room: Dictionary, rng: Rng, biome: Dictionary, force_count: int) -> void:
	var n := force_count if force_count > 0 \
			else rng.int_range(int(biome["platform_min"]), int(biome["platform_max"]))
	var prev_row := FLOOR_ROW
	var prev_right := 6
	for _i in n:
		var w := rng.int_range(4, 9)
		var x := prev_right + rng.int_range(3, 9)
		if x + w > int(room["width"]) - PLATFORM_EDGE_PAD:
			break
		# 目标高度：允许高差，但高差 >MAX_STEP 时必须在正下方补一个弹台
		var want := FLOOR_ROW - rng.int_range(2, 5)
		want = mini(want, prev_row - 2)
		want = maxi(want, FLOOR_ROW - MAX_ABS_RISE)
		var step: int = prev_row - want
		var kind := "solid"
		if step > MAX_STEP_TILES:
			# 抬升超过能力：把这块标成需要弹台，并在它正下方放 bounce 台
			kind = "solid"
			room["platforms"].append({
				"x": x, "y": want + MAX_STEP_TILES, "w": mini(w, 4), "kind": "bounce",
			})
			want = prev_row - mini(step, BOUNCE_STEP_TILES)
			room["platforms"].append({"x": x, "y": want, "w": w, "kind": kind})
			prev_row = want
			prev_right = x + w
			continue
		kind = _pick_platform_kind(rng, biome)
		room["platforms"].append({"x": x, "y": want, "w": w, "kind": kind})
		prev_row = want
		prev_right = x + w


static func _pick_platform_kind(rng: Rng, biome: Dictionary) -> String:
	var roll := rng.next_int() % 100
	var crumble_pct := int(round(float(biome["crumble_ratio"]) * 100.0))
	var bounce_pct := int(round(float(biome["bounce_ratio"]) * 100.0))
	if roll < crumble_pct:
		return "crumble"
	if roll < crumble_pct + bounce_pct:
		return "bounce"
	return "solid"


## 灯：间距由群系决定（无光深渊最稀最暗，反应堆最密）
static func _room_lamps(room: Dictionary, width: int, biome: Dictionary, type: String) -> void:
	var spacing: int = int(biome["lamp_spacing"])
	if type == "secret":
		spacing = int(spacing * 1.4)
	var x := 8
	while x < width - 6:
		room["lamps"].append({"x": x, "y": FLOOR_ROW - 8, "type": type})
		x += spacing
	if room["lamps"].is_empty():
		room["lamps"].append({"x": int(width / 2.0), "y": FLOOR_ROW - 6, "type": type})


## 敌人站位：先决定「几个在地面、几个在高台、是否伏击群」，再按最小间距落子
static func _room_enemies(room: Dictionary, depth: int, rng: Rng, biome: Dictionary, ambush: bool) -> void:
	var total := clampi(int(biome["enemy_base"]) + int(depth / 3.0) + rng.int_range(0, 1), 2, 6)
	var high_target := int(round(float(total) * BI.high_share(depth)))
	var placed: Array = []
	var right_limit: int = int(room["width"]) - EXIT_CLEAR_TILES

	# ① 高台组：优先把远程怪放上去（它们要射界，也不该被玩家一路平推）
	var plats: Array = room["platforms"]
	var used_plats := {}
	while _count_high(placed) < high_target and _has_free_platform(plats, used_plats):
		var p: Dictionary = plats[rng.int_range(0, plats.size() - 1)]
		if used_plats.has(int(p["x"])):
			continue
		used_plats[int(p["x"])] = true
		var spot := int(p["x"]) + rng.int_range(0, maxi(int(p["w"]) - 1, 0))
		if spot >= right_limit or _too_close(placed, spot):
			continue
		# 高台怪也要过两道检查：脚下不能是沟，而且那一格真的能站
		if not _cell_is_standable(room, spot, int(p["y"]) - 1):
			continue
		placed.append({"x": spot, "y": int(p["y"]) - 1,
				"id": _pick_enemy_id(rng, depth)})

	# ② 地面组：伏击房挤到后 1/3，其它房均匀散布
	var lo := 10
	var hi := maxi(right_limit - 2, lo + 1)
	if ambush:
		lo = int(int(room["width"]) * 0.6)
	var guard := 0
	while placed.size() < total and guard < total * 12:
		guard += 1
		var ex := rng.int_range(lo, hi)
		if _too_close(placed, ex) or _inside_gap(room, ex):
			continue
		placed.append({"x": ex, "y": FLOOR_ROW - 1, "id": _pick_enemy_id(rng, depth)})

	room["enemies"] = placed


static func _pick_enemy_id(rng: Rng, depth: int) -> String:
	return "spitter" if rng.chance(BI.spitter_chance(depth)) else "crawler"


static func _count_high(placed: Array) -> int:
	var n := 0
	for e in placed:
		if int(e["y"]) < FLOOR_ROW - 1:
			n += 1
	return n


static func _has_free_platform(plats: Array, used: Dictionary) -> bool:
	for p in plats:
		if not used.has(int(p["x"])):
			return true
	return false


static func _too_close(placed: Array, x: int) -> bool:
	for e in placed:
		if absi(int(e["x"]) - x) < MIN_ENEMY_SPACE:
			return true
	return false


static func _room_pickups(room: Dictionary, width: int, rng: Rng) -> void:
	for _i in rng.int_range(1, 3):
		var px := rng.int_range(8, maxi(width - 6, 9))
		if _inside_gap(room, px):
			continue
		room["pickups"].append({"x": px, "y": FLOOR_ROW - 2,
				"kind": "o2" if rng.chance(50) else "power"})


static func _inside_gap(room: Dictionary, x: int) -> bool:
	for g in room["gaps"]:
		if x >= int(g["x"]) - 1 and x <= int(g["x"]) + int(g["w"]) + 1:
			return true
	return false


## 平台格集合，供可达性与站位校验用
static func platform_cells(plan: Dictionary) -> Dictionary:
	var cells := {}
	for room in plan["rooms"]:
		var rx := int(room["x"])
		for p in room["platforms"]:
			cells[Vector2i(rx + int(p["x"]), int(p["y"]))] = str(p["kind"])
	return cells


static func design_bands() -> Dictionary:
	return {
		"rooms_per_depth": [MIN_ROOMS, MAX_ROOMS],
		"max_gap_tiles": [2, 5],
		"max_platform_step_tiles": [1, MAX_STEP_TILES],
	}


## 自检：把一张生成的图跑一遍约束，返回违规列表（空 = 合格）。
## 生成器自己保证产物合法，比在测试里重写一遍规则可靠
static func validate(plan: Dictionary) -> Array[String]:
	var problems: Array[String] = []
	var rooms: Array = plan["rooms"]
	if rooms.size() < MIN_ROOMS or rooms.size() > MAX_ROOMS:
		problems.append("房间数 %d 不在 %d–%d" % [rooms.size(), MIN_ROOMS, MAX_ROOMS])
	if not BI.ids().has(str(plan["biome"])):
		problems.append("未知群系 %s" % str(plan["biome"]))
	var sum := 0
	var gap_total := 0
	var enemy_total := 0
	for room in rooms:
		sum += int(room["width"])
		gap_total += int(room["gaps"].size())
		enemy_total += int(room["enemies"].size())
		var rid := "房间 %d(%s)" % [int(room["index"]), str(room["type"])]
		var right_limit := int(room["width"]) - EXIT_CLEAR_TILES

		if room["lamps"].is_empty():
			problems.append(rid + " 没有灯（会太暗）")
		for g in room["gaps"]:
			if int(g["w"]) > 5:
				problems.append("%s 沟宽 %d 超过满跳能力" % [rid, int(g["w"])])
			if int(g["x"]) + int(g["w"]) > int(room["width"]) - 4:
				problems.append("%s 沟贴到右边界，出口会被吃掉" % rid)

		# 平台：数量、上下顺序、高差、种类
		var prev_row := FLOOR_ROW
		for p in room["platforms"]:
			var row := int(p["y"])
			if not PLATFORM_KINDS.has(str(p["kind"])):
				problems.append("%s 未知平台种类 %s" % [rid, str(p["kind"])])
			var step: int = prev_row - row
			if step > MAX_STEP_TILES:
				# 允许，但正下方必须有弹台垫脚
				if not _has_bounce_below(room, int(p["x"]), row, prev_row):
					problems.append("%s 平台抬升 %d 格且下方没有弹台，玩家上不去" % [rid, step])
			if FLOOR_ROW - row > BOUNCE_STEP_TILES + 1:
				problems.append("%s 平台过高 row=%d" % [rid, row])
			prev_row = row

		# 敌人站位：可站立、不重叠、不堵出口、不掉沟里
		for e in room["enemies"]:
			var ex := int(e["x"])
			var ey := int(e["y"])
			if not ENEMY_IDS.has(str(e["id"])):
				problems.append("%s 未知敌型 %s" % [rid, str(e["id"])])
			if ex >= right_limit:
				problems.append("%s 敌人 %d 堵在出口前（界限 %d）" % [rid, ex, right_limit])
			# 只有地面怪需要避开沟；站在沟上方平台上的怪是合法的（而且是个好设计：桥下是深渊）
			if ey == FLOOR_ROW - 1 and _inside_gap(room, ex):
				problems.append("%s 敌人 %d 放在沟上" % [rid, ex])
			if not _cell_is_standable(room, ex, ey):
				problems.append("%s 敌人 (%d,%d) 脚下没有支撑" % [rid, ex, ey])
			for other in room["enemies"]:
				if other == e:
					continue
				if absi(int(other["x"]) - ex) + absi(int(other["y"]) - ey) < MIN_ENEMY_SPACE \
						and int(other["y"]) == ey:
					problems.append("%s 两只怪叠在一起 (%d,%d)" % [rid, ex, ey])
	if sum != int(plan["total_width_tiles"]):
		problems.append("总宽 %d 与房间之和 %d 不符" % [int(plan["total_width_tiles"]), sum])
	if gap_total == 0:
		problems.append("整层没有沟，掉坑机制未出现（depth=%d）" % int(plan["depth"]))
	if enemy_total < 2:
		problems.append("整层只有 %d 只怪，太空" % enemy_total)
	return problems


## 敌人所在格是否可站立：地面行 = FLOOR_ROW-1 且不在沟上；高台行则要求同 x 有平台
static func _cell_is_standable(room: Dictionary, x: int, y: int) -> bool:
	if y == FLOOR_ROW - 1:
		return not _inside_gap(room, x)
	for p in room["platforms"]:
		if y == int(p["y"]) - 1 and x >= int(p["x"]) and x < int(p["x"]) + int(p["w"]):
			return true
	return false


static func _has_bounce_below(room: Dictionary, x: int, row: int, prev_row: int) -> bool:
	for p in room["platforms"]:
		if str(p["kind"]) != "bounce":
			continue
		var py := int(p["y"])
		if py < row and py >= FLOOR_ROW - (row - FLOOR_ROW) - 12 and x >= int(p["x"]) - 2 \
				and x <= int(p["x"]) + int(p["w"]) + 2:
			return true
	return false
