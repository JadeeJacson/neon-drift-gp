extends GutTest

## 分层生成的约束断言（docs/08 §3.4）。
## 关键不是「图长什么样」，而是「生成器不会造出过不去的图」——
## 那种 bug 实跑时才暴露，代价是每次都要重玩一遍才能发现。

const G := preload("res://sim/layout_gen.gd")
const P := preload("res://sim/movement_params.gd")


func test_same_input_gives_identical_plan() -> void:
	var a := G.generate(3, 20260927)
	var b := G.generate(3, 20260927)
	assert_eq(str(a), str(b), "同 depth+seed 必须产出同一张图（跑分与回放的前提）")
	var c := G.generate(3, 991)
	assert_ne(str(a), str(c), "换种子应该换图")


func test_plans_are_valid_across_depths_and_seeds() -> void:
	for depth in range(1, 13):
		for seed_value in [1, 7, 42, 2026, 65535]:
			var problems: Array = G.validate(G.generate(depth, seed_value))
			# GUT 9.7.1 没有 assert_empty，用 size 断言（失败信息里带完整违规列表）
			assert_eq(problems.size(), 0, "depth=%d seed=%d 违规：%s" % [depth, seed_value, str(problems)])


func test_gaps_never_wider_than_a_full_jump() -> void:
	# 这是最重要的一条：沟宽上限必须留余量，否则玩家会掉坑（而掉坑在当前是死亡）
	var reach := P.jump_distance_tiles()
	for depth in range(1, 10):
		var plan := G.generate(depth, depth * 31 + 5)
		for room in plan["rooms"]:
			for g in room["gaps"]:
				assert_lte(float(int(g["w"])), reach - 1.0,
						"depth=%d 沟宽 %d 格，逼近满跳 %0.1f 格没有余量" % [depth, int(g["w"]), reach])


func test_platforms_are_climbable_one_by_one() -> void:
	var jump_tiles := P.jump_apex_tiles()
	for depth in range(1, 10):
		var plan := G.generate(depth, depth * 17 + 3)
		for room in plan["rooms"]:
			var prev_row := int(plan["floor_row"])
			for p in room["platforms"]:
				# 余量要求 1 格：只留 0.1 格等于要求玩家顶点刚好落在台面，那不是设计而是赌
				assert_lte(float(prev_row - int(p["y"])), jump_tiles - 1.0,
						"depth=%d 平台抬升没有留出跳达余量（%d → %d，满跳 %.2f 格）"
						% [depth, prev_row, int(p["y"]), jump_tiles])
				prev_row = int(p["y"])


func test_every_room_has_lighting() -> void:
	# 「太暗」是制作人实跑反馈，这条把亮度变成回归测试的一部分而不是凭感觉
	for depth in range(1, 8):
		var plan := G.generate(depth, depth * 7 + 11)
		var lamps := 0
		var tiles := 0
		for room in plan["rooms"]:
			assert_gte(int(room["lamps"].size()), 1, "depth=%d 房间 %d 没有灯" % [depth, int(room["index"])])
			lamps += int(room["lamps"].size())
			tiles += int(room["width"])
		var per_100 := float(lamps) / float(maxi(tiles, 1)) * 100.0
		assert_between(per_100, 3.0, 14.0, "depth=%d 每 100 格 %0.1f 盏灯，密度不合适" % [depth, per_100])


func test_room_count_and_pit_line() -> void:
	for depth in range(1, 12):
		var plan := G.generate(depth, depth + 100)
		assert_between(float(plan["rooms"].size()), float(G.MIN_ROOMS), float(G.MAX_ROOMS),
				"depth=%d 房间数越界" % depth)
		assert_gt(int(plan["pit_row"]), int(plan["floor_row"]),
				"死亡线必须在地面以下，否则一落地就判死")


func test_every_depth_has_at_least_one_gap() -> void:
	# 掉坑是本作的基础机制：不能因为 secret 房被抽中就整层没沟
	for depth in range(1, 12):
		for seed_value in [1, 42, 4242, 99991]:
			var plan := G.generate(depth, seed_value)
			var gaps := 0
			for room in plan["rooms"]:
				gaps += int(room["gaps"].size())
			assert_gte(gaps, 1, "depth=%d seed=%d 整层没有沟" % [depth, seed_value])


func test_spitter_unlocks_at_depth_three() -> void:
	# 远程型不能出现在前两局（读招教学会被打断），但也必须真的会出现在后面
	for seed_value in [1, 42, 4242, 99991, 7]:
		for depth in [1, 2]:
			var plan := G.generate(depth, seed_value)
			for room in plan["rooms"]:
				for e in room["enemies"]:
					assert_eq(str(e["id"]), "crawler",
							"depth=%d 不该出现远程怪" % depth)
	var any_spitter := false
	for seed_value in [1, 42, 4242, 99991, 7]:
		var plan := G.generate(5, seed_value)
		for room in plan["rooms"]:
			for e in room["enemies"]:
				if str(e["id"]) == "spitter":
					any_spitter = true
	assert_true(any_spitter, "depth=5 的若干种子里一个远程怪都没出，说明概率没生效")


func test_enemy_spacing_and_exit_clearance() -> void:
	# 上一版是「随机 x 撒几个」，结果两只会叠在一起、还会堵在出口门前。
	# 这两条不是美化：重叠会让一打多变成「一打一排」，堵门会让玩家无路可站
	for depth in range(1, 10):
		for seed_value in [1, 42, 4242]:
			var plan := G.generate(depth, seed_value)
			for room in plan["rooms"]:
				var right_limit: int = int(room["width"]) - G.EXIT_CLEAR_TILES
				var list: Array = room["enemies"]
				for e in list:
					assert_lt(int(e["x"]), right_limit,
							"depth=%d 有敌人堵在出口前" % depth)
				for i in range(list.size()):
					for j in range(i + 1, list.size()):
						if int(list[i]["y"]) == int(list[j]["y"]):
							assert_gte(absi(int(list[i]["x"]) - int(list[j]["x"])), G.MIN_ENEMY_SPACE,
									"depth=%d 同一行两只怪贴在一起" % depth)


func test_platform_kinds_are_valid_and_not_all_special() -> void:
	# 塌台不能多于一半，否则「落脚的地方」本身变成运气游戏
	for depth in range(1, 10):
		for seed_value in [7, 99991]:
			var plan := G.generate(depth, seed_value)
			for room in plan["rooms"]:
				var list: Array = room["platforms"]
				var crumble := 0
				for p in list:
					assert_true(G.PLATFORM_KINDS.has(str(p["kind"])),
							"未知平台种类 " + str(p["kind"]))
					if str(p["kind"]) == "crumble":
						crumble += 1
				if list.size() >= 3:
					assert_lte(crumble, int(ceil(float(list.size()) * 0.6)),
							"depth=%d 塌台占比过高" % depth)


func test_deep_levels_put_enemies_on_high_ground() -> void:
	# 「平台高度上的玩法」要真的体现在分布里：深层必须有高台怪，
	# 否则平台只是装饰，玩家永远不需要抬头打
	var any_high := false
	for seed_value in [1, 42, 4242, 99991]:
		var plan := G.generate(8, seed_value)
		for room in plan["rooms"]:
			for e in room["enemies"]:
				if int(e["y"]) < G.FLOOR_ROW - 1:
					any_high = true
	assert_true(any_high, "depth=8 没有一个高台怪，立体分布没生效")


func test_biome_actually_changes_structure() -> void:
	# 关卡特异性的可证伪形式：不同群系的灯数/平台数必须真的不一样，
	# 不是文案上不一样
	var shelf_lamps := 0
	var trench_lamps := 0
	for seed_value in [1, 42, 4242, 99991, 7]:
		for room in G.generate(1, seed_value)["rooms"]:   # depth 1 = shelf，灯距 18
			shelf_lamps += int(room["lamps"].size())
		for room in G.generate(2, seed_value)["rooms"]:   # depth 2 = trench，灯距 30
			trench_lamps += int(room["lamps"].size())
	assert_lt(trench_lamps, shelf_lamps,
			"无光深渊的灯不比浅裂带稀（%d vs %d），光照特异性失效" % [trench_lamps, shelf_lamps])


func test_widths_are_consistent() -> void:
	for depth in range(1, 8):
		var plan := G.generate(depth, depth * 13 + 2)
		var total := 0
		var cursor := 0
		for room in plan["rooms"]:
			assert_eq(int(room["x"]), cursor, "房间起点必须首尾相接，否则中间会有悬空洞")
			cursor += int(room["width"])
			total += int(room["width"])
		assert_eq(int(plan["total_width_tiles"]), total, "总宽与房间之和要一致")


func test_first_room_is_entry_and_last_has_exit_room() -> void:
	var plan := G.generate(2, 5)
	var rooms: Array = plan["rooms"]
	assert_eq(str(rooms[0]["type"]), "entry", "每层要有入口房（玩家从左边进场）")
	assert_eq(str(rooms[rooms.size() - 1]["type"]), "exit", "每层要有出口房（下潜电梯所在）")
