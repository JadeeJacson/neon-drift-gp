@tool
extends SceneTree

## 11 号闭环冒烟：真的加载主场景、真的建塔、真的出怪、真的开火击杀、真的判负结算。
##
## 为什么需要它：`--headless --quit` 只跑到 _ready，等于「能开机」；
## sim 层的断言只证明纯逻辑对。中间那层——场景装配、事件通道、渲染同步、
## 迷宫约束在真实建造流程里是否生效——必须有个东西无人值守时跑一遍。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/11-orbital-line -s res://tools/smoke_battle.gd
##
## 注意：脚本模式的 SceneTree 必须显式 quit()，否则进程永不退出（§5.0b 第 6 条）。
## 另外：手动 step(sim) 的阶段**不要 await 帧**——game.gd 的 _process 会同时推进 sim
## 并 drain 掉事件，两边抢事件会让断言随机失败。

var _fails := 0
var _main: Node


func _initialize() -> void:
	print("=== 11 轨道防线 · 闭环冒烟 ===")
	var main := _load_main()
	_main = main
	root.add_child(main)
	await process_frame

	# 1) 装配层
	var game: Node = main
	_check(game != null, "主场景实例化")
	var view: WorldView = _find_view(main)
	_check(view != null, "WorldView 已挂载（渲染层）")
	_check(_find_of_type(main, "WorldEnvironment") != null, "WorldEnvironment 就位（氛围层）")
	_check(_find_of_type(main, "DirectionalLight3D") != null, "方向光就位")
	_check(_find_of_type(main, "Camera3D") != null, "相机就位")
	_check(_find_of_type(main, "CanvasLayer") != null, "HUD 层就位")
	_check(view != null and view.tiles.size() == 18 * 12, "地面网格 216 块（实测 %d）" % (0 if view == null else view.tiles.size()))

	var sim: MatchSim = game.sim
	_check(sim != null, "sim 已建立")
	if sim == null:
		_done()
		return
	_check(sim.grid.width == 18 and sim.grid.height == 12, "网格 18x12")
	_check(PathFinder.reachable(sim.grid), "初始路径连通")

	# 2) 建造与经济
	var credits0: int = sim.credits
	_check(sim.build(4, 5, "vulcan"), "空地可建塔")
	_check(sim.credits == credits0 - Defs.tower_cost("vulcan", 1), "建塔扣费正确")
	_check(sim.grid.at(4, 5) == Grid.Cell.TOWER, "格子标记为塔")
	_check(PathFinder.reachable(sim.grid), "建塔后仍连通")
	await process_frame
	if view != null:
		_check(view.tower_nodes.size() == 1, "渲染层出现 1 座塔（实测 %d）" % view.tower_nodes.size())

	# 3) 封死约束：把 x=8 整列填满只剩一格，最后那一手必须被拒绝
	for y in range(11):
		sim.grid.place_tower(8, y)
	sim.recompute_path()
	_check(PathFinder.would_block(sim.grid, 8, 11), "最后一格会封死 → would_block=true")
	_check(not sim.can_build(8, 11, "vulcan"), "can_build 拒绝封死的一手")
	_check(PathFinder.reachable(sim.grid), "拒绝后仍然连通")
	for y in range(12):
		sim.grid.remove_tower(8, y)
	sim.recompute_path()
	_check(PathFinder.reachable(sim.grid), "还原后重新连通")

	# 4) 出怪与渲染同步
	sim.start_wave(false)
	_check(sim.phase == MatchSim.PHASE_COMBAT, "进入战斗阶段")
	var spawned: bool = false
	for _i in range(600):
		sim.step(MatchSim.TICK)
		if sim.enemies.size() > 0:
			spawned = true
			break
	_check(spawned, "波次真的出怪")
	await process_frame
	if view != null:
		_check(view.enemy_nodes.size() > 0, "渲染层同步了敌人（实测 %d）" % view.enemy_nodes.size())

	# 5) 开火与击杀（补几座塔，确保火力够）
	sim.credits += 1200
	sim.build(3, 5, "vulcan")
	sim.build(5, 5, "laser")
	sim.build(4, 4, "missile")
	var fired: bool = false
	var killed: bool = false
	for _i in range(4000):
		sim.step(MatchSim.TICK)
		for ev in sim.drain_events():
			var d: Dictionary = ev as Dictionary
			var kind: String = String(d["t"])
			if kind == "fire":
				fired = true
			elif kind == "kill":
				killed = true
		if fired and killed:
			break
	_check(fired, "塔真的开火（fire 事件）")
	_check(killed, "塔真的击杀（kill 事件）")
	_check(int(sim.stats["kills"]) > 0, "击杀计数 > 0（实测 %d）" % int(sim.stats["kills"]))

	# 6) 击杀收益
	_check(int(sim.stats["credits_earned"]) > 0, "击杀回资源（累计 %d）" % int(sim.stats["credits_earned"]))

	# 6b) 渲染层反馈路径必须真的跑一遍。
	# 上面第 5 步是手动 drain 事件，game 的 _process 因此拿不到事件、fx() 从未被调用——
	# 曳光那个 bug（look_at 在节点入树前调用）就是这么从冒烟眼皮底下溜到实跑才炸的。
	# 这里直接喂构造事件，强制走一遍特效实例化路径。
	if view != null:
		view.fx({"t": "fire", "id": "vulcan", "level": 1, "x": 4.5, "y": 5.5,
			"ex": 5.5, "ey": 6.5, "uid": -1})
		view.fx({"t": "kill", "x": 5.0, "y": 6.0, "id": "drone"})
		view.fx({"t": "leak", "x": 6.0, "y": 6.0, "dmg": 1})
		await process_frame
		_check(view._fx.size() > 0, "fx 真的产出了特效实例（实测 %d）" % view._fx.size())
		_check(view.shake > 0.0, "漏怪触发了震屏")

	# 7) 漏怪扣核心血：拆掉全部塔，让敌人走到终点
	while sim.towers.size() > 0:
		sim.sell(0)
	var hp0: int = sim.core_hp
	var leaked: bool = false
	for _i in range(6000):
		sim.step(MatchSim.TICK)
		if sim.core_hp < hp0:
			leaked = true
			break
		if sim.phase != MatchSim.PHASE_COMBAT:
			break
	_check(leaked, "漏怪会扣核心 HP（%d → %d）" % [hp0, sim.core_hp])

	# 8) 轨道炮技能与冷却
	sim.credits += 100
	var strike_ok: bool = sim.orbital_strike(6.0, 5.0)
	_check(strike_ok, "轨道炮可释放")
	_check(sim.ability_cd > 0.0, "释放后进入冷却")
	_check(not sim.orbital_strike(6.0, 5.0), "冷却中不可再释放")

	# 9) 升级与出售
	sim.credits += 500
	sim.build(6, 4, "vulcan")
	var before_up: int = int((sim.towers[sim.towers.size() - 1] as Dictionary)["level"])
	sim.upgrade(sim.towers.size() - 1)
	var after_up: int = int((sim.towers[sim.towers.size() - 1] as Dictionary)["level"])
	_check(after_up == before_up + 1, "升级生效（%d → %d）" % [before_up, after_up])
	var c_before: int = sim.credits
	sim.sell(sim.towers.size() - 1)
	_check(sim.credits > c_before, "出售返还资源")

	# 10) 结算：核心归零 → 失败终态 + 面板弹出
	sim.core_hp = 0
	for _i in range(4):
		sim.step(MatchSim.TICK)
	_check(sim.phase == MatchSim.PHASE_LOST, "核心归零即失败结算")
	await process_frame
	_check(bool(game._panel.visible), "结算面板弹出")

	_done()


func _load_main() -> Node:
	var packed = load("res://scenes/main.tscn") as PackedScene
	return packed.instantiate()


func _find_view(main: Node) -> WorldView:
	for c in main.get_children():
		var v: WorldView = c as WorldView
		if v != null:
			return v
	return null


func _find_of_type(n: Node, cls: String) -> Node:
	if n.get_class() == cls:
		return n
	for c in n.get_children():
		var r: Node = _find_of_type(c, cls)
		if r != null:
			return r
	return null


func _check(ok: bool, label: String) -> void:
	if ok:
		print("[OK]   %s" % label)
	else:
		_fails += 1
		print("[FAIL] %s" % label)


func _done() -> void:
	print("=== 失败 %d 项 ===" % _fails)
	for _i in range(120):
		await physics_frame
	if _main != null and is_instance_valid(_main):
		root.remove_child(_main)
		_main.free()
	await process_frame
	quit(1 if _fails > 0 else 0)
