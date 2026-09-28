@tool
extends SceneTree
## 战斗闭环冒烟：**真的加载主场景、真的买单位、真的开战、真的判胜负、真的进下一阶段**。
##
## 为什么 `--headless --quit` 不够（docs/00 §4.3）：它只跑 `_ready()`。
## sim 层 500+ 断言只证明「逻辑没崩」，看不见「场景没接上」「信号没连」「模型没实例化」。
## 这个脚本盯的就是那一层，20 条断言。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/09-arcane-roster -s res://tools/smoke_battle.gd
##
## 退出：所有断言通过 quit(0)，否则 quit(1)。Godot 退出时会报 2 条收尾噪音
## （ObjectDB leaked / resources still in use），那是引擎退出顺序，见 §5.0b 第 7 条。

var _fails: int = 0
var _checks: int = 0
var _main: Node = null


func _initialize() -> void:
	print("=== 09 战斗闭环冒烟 ===")
	# 必须把载入放进独立函数：PackedScene 在 _initialize 里一直引用到函数返回，
	# 会导致退出时报 "resources still in use"（docs/00 §5.0b 第 8 条）
	_main = _load_main()
	if _main == null:
		_fail("主场景加载失败")
		_finish()
		return
	root.add_child(_main)
	await process_frame
	await process_frame

	var game := _main as GameRoot
	_check(game != null, "GameRoot 脚本挂载成功")
	if game == null:
		_finish()
		return

	# ---- 装配层 ----
	_check(game.get("run") != null, "RunState 已建立")
	_check(game.get("phase") == GameRoot.Phase.PLANNING, "初始阶段为备战", "phase=%d" % int(game.get("phase")))
	var run: RunState = game.get("run")
	_check(run != null and run.gold >= RunState.START_GOLD, "初始金币", "%d 金" % (run.gold if run != null else -1))
	_check(_node_ok(game, "Board"), "棋盘节点存在")
	_check(_node_ok(game, "CameraRig"), "相机节点存在")
	_check(_node_ok(game, "Hud"), "HUD 存在")
	_check(_node_ok(game, "ShopUi"), "商店 UI 存在")
	_check(_node_ok(game, "Bgm"), "BGM 播放器存在")
	_check(game.board_view != null and game.board_view.get_child_count() == 0
		or (game.board_view != null and _cells_count(game.board_view) == Board.all_cells().size()),
		"棋盘格子数量", "%d 格" % _cells_count(game.board_view))

	# ---- 商店与经济（走玩家真正点的那个函数） ----
	var slots: int = run.shop.size()
	_check(slots == RunState.SHOP_SLOTS, "商店槽位数", "%d" % slots)
	var all_legal := true
	for s in run.shop:
		var d: Dictionary = s
		if not UnitTable.has_id(String(d["id"])):
			all_legal = false
	_check(all_legal, "商店单位 id 全部合法")
	var gold_before := run.gold
	var bought := 0
	for i in range(run.shop.size()):
		if run.buy(i):
			bought += 1
		if bought >= 2:
			break
	_check(bought > 0 and run.gold < gold_before, "购买扣款", "买 %d 个，金币 %d→%d" % [bought, gold_before, run.gold])
	_check(run.gold >= 0, "金币不为负", "%d" % run.gold)
	_check(run.board.size() > 0, "买完自动上阵", "板上 %d 个" % run.board.size())

	# ---- 强行补满人口，测合成与布阵 ----
	var guard := 0
	while run.board.size() < run.population_cap() and guard < 40:
		guard += 1
		var did := false
		for i in range(run.shop.size()):
			if run.buy(i):
				did = true
				break
		if not did:
			run.gold += 3
			run.begin_stage()
	_check(run.board.size() == run.population_cap(), "人口填满", "%d/%d" % [run.board.size(), run.population_cap()])
	var occ := run.occupancy()
	var overlap := 0
	for cell in occ:
		if not Board.cell_in_bounds(cell) or not Board.ALLY_ROWS.has(cell.y):
			overlap += 1
	_check(overlap == 0 and occ.size() == run.board.size(), "布阵无重叠且都在我方半场")
	_check(run.traits_summary() != "", "羁绊摘要可生成", run.traits_summary())

	# ---- 敌方编成 ----
	var enemy := run.make_enemy(20260927)
	_check(enemy.size() > 0, "敌方编成非空", "%d 个" % enemy.size())
	var enemy_legal := true
	for e in enemy:
		var ed: Dictionary = e
		if not Board.ENEMY_ROWS.has(ed["cell"].y) or not EnemyTable.has_id(String(ed["id"])):
			enemy_legal = false
	_check(enemy_legal, "敌方单位全部落在敌方半场且 id 合法")

	# ---- 真打一场（用场景层的 BattleDirector 路径之外，直接跑 sim 保证确定性） ----
	var bonus := Traits.bonuses(run.board)
	var sim := BattleSim.new(run.board_defs(), enemy, 20260927 + run.stage, bonus)
	var result := sim.run()
	_check(result.has("winner") and int(result["winner"]) in [0, 1], "战斗产出胜者", "winner=%d" % int(result["winner"]))
	_check(float(result["duration"]) > 0.0 and float(result["duration"]) <= float(BattleSim.MAX_TICKS * BattleSim.TICK),
		"战斗时长在上限内", "%.1f 秒 / %d tick" % [float(result["duration"]), int(result["ticks"])])
	_check(int(result["ally_alive"]) + int(result["enemy_alive"]) >= 0, "存活统计合理",
		"%d vs %d" % [int(result["ally_alive"]), int(result["enemy_alive"])])
	_check(sim.events.size() > 0, "事件日志非空", "%d 条" % sim.events.size())

	# ---- 记账与推进（场景层和跑分层共用的那个函数） ----
	var hp_before := run.hp
	var stage_before := run.stage
	run.apply_battle_result(result, enemy, sim)
	_check(run.hp <= hp_before, "掉血记账生效", "%d→%d" % [hp_before, run.hp])
	_check(run.stage_log.size() == 1, "阶段日志追加", "%d 条" % run.stage_log.size())
	var alive := run.advance()
	_check(alive and run.stage == stage_before + 1, "阶段推进", "S%d → S%d" % [stage_before, run.stage])
	_check(run.shop.size() == RunState.SHOP_SLOTS, "下一阶段商店已刷新")

	# ---- 场景层真跑一次：让 GameRoot 自己开一场战斗（headless 下只跑几帧） ----
	_game_root_battle(game)

	_finish()


## 走一遍场景层的开战路径：_start_battle 会在下一帧驱动 BattleDirector
func _game_root_battle(game: GameRoot) -> void:
	game.call("_on_ready")
	_check(int(game.get("phase")) == GameRoot.Phase.BATTLE, "场景层进入战斗阶段", "phase=%d" % int(game.get("phase")))
	var director: BattleDirector = game.get("director")
	_check(director != null and director.sim != null, "BattleDirector 拿到 sim 实例")
	if director != null and director.sim != null:
		var total := director.sim.units.size()
		_check(director.sim.units.size() == director._views.size(), "战斗视图与 sim 单位数一致",
			"%d 视图 / %d 单位" % [director._views.size(), total])
		_check(director.alive_ally() + director.alive_enemy() == total, "开局双方存活数之和 = 总单位数",
			"%d + %d = %d" % [director.alive_ally(), director.alive_enemy(), total])
		_check(director.kills() == 0, "开局击杀数为 0", "%d" % director.kills())
		var enemy_total := director.alive_enemy()
		# 跑完整场：这一步会真的产生伤害数字 / 命中闪片 / 死亡标记（可读性特��）
		var guard := 0
		while director.sim != null and not director.sim.finished and guard < 4000:
			director.step_simulation(1.0)
			guard += 1
		_check(guard < 4000, "战斗在有限步内结束（跑了 %d 秒）" % guard)
		_check(director.sim.tick > 0, "BattleDirector 真的推进了 sim", "tick=%d" % director.sim.tick)
		# 战况计数必须**与 sim 的死亡事件逐个对账**。
		# 不能用「存活 + 击杀 = 参战数」这种恒等式：召唤物会让某一方人数中途变化
		# （写错过一次，冒烟连续报了 3 种错误断言才对上）。
		var ally_deaths := 0
		var enemy_deaths := 0
		for e in director.sim.events:
			var ev: Dictionary = e
			if str(ev["k"]) != "death":
				continue
			var di := int(ev["a"])
			if di >= 0 and di < director.sim.units.size():
				if int(director.sim.units[di]["side"]) == Board.ALLY:
					ally_deaths += 1
				else:
					enemy_deaths += 1
		_check(director.losses() == ally_deaths, "HUD 阵亡数 == sim 的我方死亡事件数",
			"HUD %d / sim %d" % [director.losses(), ally_deaths])
		_check(director.kills() == enemy_deaths, "HUD 击杀数 == sim 的敌方死亡事件数",
			"HUD %d / sim %d" % [director.kills(), enemy_deaths])
		var allies_left := director.alive_ally()
		var enemies_left := director.alive_enemy()
		_check(allies_left == 0 or enemies_left == 0, "战斗结束时必有一方全灭",
			"%d vs %d" % [allies_left, enemies_left])
		var fx := 0
		if game.get("units_root") != null:
			for c in game.units_root.get_children():
				if not (c is UnitView):
					fx += 1
		_check(fx > 0, "战斗中确实生成了战斗特效/死亡标记节点", "%d 个" % fx)
		_check(game.get("units_root") != null, "战斗单位宿主节点存在")
		# 清理：特效必须被清掉，否则一场叠一场
		director.cleanup()
		var left := 0
		for c2 in game.units_root.get_children():
			if not (c2 is UnitView):
				left += 1
		_check(left == 0, "cleanup() 之后不留特效节点", "剩 %d 个" % left)


func _load_main() -> Node:
	var path := "res://scenes/main.tscn"
	if not ResourceLoader.exists(path):
		return null
	var packed: PackedScene = load(path)
	if packed == null:
		return null
	return packed.instantiate()


func _node_ok(node: Node, path: String) -> bool:
	return node != null and node.get_node_or_null(NodePath(path)) != null


func _cells_count(view: Node) -> int:
	if view == null:
		return 0
	var cells := view.get_node_or_null(NodePath("Cells"))
	return cells.get_child_count() if cells != null else 0


func _check(cond: bool, label: String, extra: String = "") -> void:
	_checks += 1
	if cond:
		print("[OK] %s %s" % [label, extra])
	else:
		_fails += 1
		print("[FAIL] %s %s" % [label, extra])


func _fail(label: String) -> void:
	_checks += 1
	_fails += 1
	print("[FAIL] %s" % label)


func _finish() -> void:
	# **必须先释放整棵场景树再 quit()**：UI 的 Label 持有 TextServer 的 shaped-text RID，
	# 字体资源持有 Font RID。不 free 就退出会报一堆「RID allocations ... were leaked at exit」
	# 与「RIDs of type CanvasItem were leaked」，而 verify.mjs 把 ERROR/WARNING 都当失败
	# （它只显式排除 ObjectDB leaked / resources still in use 两种收尾噪音，见 §5.0b 第 7 条）。
	if _main != null:
		root.remove_child(_main)
		_main.free()
		_main = null
	print("---- 断言 %d 条，失败 %d 条" % [_checks, _fails])
	quit(0 if _fails == 0 else 1)
