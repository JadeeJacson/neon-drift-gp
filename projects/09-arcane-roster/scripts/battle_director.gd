extends Node3D
class_name BattleDirector
## 把 BattleSim 的逐 tick 结果演成画面。**表现层的单向阀门**：
## sim → events → 这里；这里不回写 sim 任何东西。
##
## 分层纪律写在文件头，是因为一旦有人在这里「顺手修正」一个看起来不对的战斗结果
## （比如让近战瞬移贴脸），跑分的结论就再也不能代表真实游戏了（docs/00 §4.3）。

const BATTACK_ANIM := 0.34      # 单次出手动画时长，超时就打断，避免动画排队
const MAX_ANIM_PER_TICK := 3
const SETTLE_DELAY := 1.1

signal battle_finished(result: Dictionary)

var sim: BattleSim = null
var speed: float = 1.0
var running: bool = false

var _views: Dictionary = {}      # 全局下标 -> UnitView
var _acc: float = 0.0
var _next_event: int = 0
var _finished_at: float = -1.0
var _done_emitted: bool = false
var _rng := RandomNumberGenerator.new()
var _camera: CameraRig = null
var _fx_parent: Node3D = null
var _kills_ally: int = 0
var _deaths_ally: int = 0
var _deaths: Dictionary = {}     # 全局下标 -> 是否已播过死亡（避免重复计数）


## 存活数：HUD 要靠它显示「伤亡情况」（制作人反馈：伤亡不清晰）
func alive_ally() -> int:
	if sim == null:
		return 0
	return sim.alive_count(Board.ALLY)


func alive_enemy() -> int:
	if sim == null:
		return 0
	return sim.alive_count(Board.ENEMY)


## 我方击杀数（敌方死亡即算我方战功）
func kills() -> int:
	return _kills_ally


## 我方阵亡数。**和击杀数一起构成「伤亡」**：只看存活数不知道刚才死了谁，
## 两个数同时给，玩家才能判断这波是「换血」还是「崩盘」。
func losses() -> int:
	return _deaths_ally


func _ready() -> void:
	_rng.randomize()


func setup(ally_defs: Array, enemy_defs: Array, seed_value: int, bonus: Dictionary, host: Node3D) -> void:
	sim = BattleSim.new(ally_defs, enemy_defs, seed_value, bonus)
	_views.clear()
	_next_event = 0
	_acc = 0.0
	_finished_at = -1.0
	_done_emitted = false
	_kills_ally = 0
	_deaths_ally = 0
	_deaths.clear()
	for i in range(sim.units.size()):
		var u: Dictionary = sim.units[i]
		var view := UnitView.new()
		view.setup(String(u["id"]), int(u["star"]), bool(u["is_ally"]))
		view.position = Board.cell_to_world(u["cell"])
		host.add_child(view)
		_views[i] = view
		view.play_idle()
	_fx_parent = host


func bind_camera(c: CameraRig) -> void:
	_camera = c


## speed: 1 / 2 / 4 倍速。加速只改 sim 的推进节奏，不改 sim 本身
func set_speed(v: float) -> void:
	speed = clampf(v, 0.5, 8.0)


func _process(delta: float) -> void:
	advance(delta)


## 推进 delta 秒的战斗。_process 与无头冒烟测试**共用这一个入口**，
## 所以「冒烟里跑过的战斗」与「玩家看到的战斗」是同一条代码路径。
func advance(delta: float) -> void:
	if sim == null:
		return
	if _finished_at >= 0.0:
		_finished_at += delta
		if _finished_at >= SETTLE_DELAY and not _done_emitted:
			_done_emitted = true
			battle_finished.emit(sim.result())
		return
	if not running:
		return
	_acc += delta * speed
	var step_s := BattleSim.TICK
	var guard := 0
	while _acc >= step_s and guard < 32:
		_acc -= step_s
		guard += 1
		var more := sim.step()
		# **必须先消费事件再 break**：`sim.step()` 在「这一 tick 打死最后一个敌人」时返回 false，
		# 而那一 tick 的 death 事件就藏在里面。原来的写法直接 break，
		# 结果最后一个击杀既不计数也不播死亡标记（被冒烟的伤亡账目断言抓到）。
		_drain_events()
		_sync_views()
		if not more:
			break
	if sim.finished:
		_finished_at = 0.0
		_sync_views()


## 冒烟测试用：直接推进指定秒数（不依赖帧循环，headless 下也能跑）
func step_simulation(seconds: float) -> void:
	advance(seconds)


func _sync_views() -> void:
	for i in range(sim.units.size()):
		var u: Dictionary = sim.units[i]
		if not _views.has(i):
			continue
		# **必须先弱类型取出再验活性**：死亡动画播完会 queue_free()，但 _views 里
		# 的引用还挂着。若直接赋给强类型 `var view: UnitView`，赋值本身就会报
		# 「Trying to assign invalid previously freed instance」——is_instance_valid
		# 根本执行不到。headless 冒烟抓不到它：tween 由真实帧循环推进，无头下
		# 同步执行永远走不到 queue_free，所以只有制作人实跑时才会刷屏。
		# （2026-09-28 实跑日志抓到，与 _view_of 的既有写法对齐）
		var raw = _views[i]
		if not is_instance_valid(raw):
			continue
		var view: UnitView = raw
		view.sync(u)
		# 只在「没有正在播的出手动作」时播移动动画
		var cell: Vector2i = u["cell"]
		if view.position.distance_to(Board.cell_to_world(cell)) > 0.01:
			var tw := create_tween()
			tw.tween_property(view, "position", Board.cell_to_world(cell), BattleSim.TICK * 0.9)


func _drain_events() -> void:
	var budget := MAX_ANIM_PER_TICK
	while _next_event < sim.events.size():
		var e: Dictionary = sim.events[_next_event]
		_next_event += 1
		if int(e["t"]) != sim.tick:
			continue    # 上一 tick 积压的动画不再补播，只处理当前 tick
		if budget <= 0:
			continue
		match String(e["k"]):
			"attack":
				_do_attack(e)
				_spawn_attack_fx(e)
				budget -= 1
			"cast":
				var v := _view_of(int(e["a"]))
				if v != null:
					v.play_cast()
				budget -= 1
			"cast_hit":
				var tpos := _pos_of(int(e["b"]))
				CombatFx.hit_flash(_fx_parent, tpos, false)
				budget -= 1
			"miss":
				CombatFx.status_text(_fx_parent, _pos_of(int(e["b"])), "闪避", CombatFx.MISS_COLOR)
			"dot":
				CombatFx.damage_number(_fx_parent, _pos_of(int(e["a"])), float(e["v"]), false)
			"thorns":
				CombatFx.damage_number(_fx_parent, _pos_of(int(e["b"])), float(e["v"]), false)
			"burst":
				CombatFx.damage_number(_fx_parent, _pos_of(int(e["b"])), float(e["v"]), false)
			"death":
				_on_death(e)
	_sync_views()


func _on_death(e: Dictionary) -> void:
	var idx := int(e["a"])
	if _deaths.has(idx):
		return
	_deaths[idx] = true
	var dv := _view_of(idx)
	if dv != null:
		dv.play_death()
	# **按 side 记账，不按 is_ally**：召唤物（骷髅术士的 raise_dead）虽然由敌方单位产出，
	# 但它的 "is_ally" 被置为 true，真正效忠的是 "side"。用 is_ally 记账会把
	# 「敌方召唤物被我方杀掉」算成我方战功，HUD 上的数字直接反了。
	var side := Board.ENEMY
	if idx >= 0 and idx < sim.units.size():
		side = int(sim.units[idx]["side"])
	var is_ally := side == Board.ALLY
	if is_ally:
		_deaths_ally += 1
	else:
		_kills_ally += 1
	CombatFx.death_marker(_fx_parent, Board.cell_to_world(e["cell"]), is_ally)
	if _camera != null:
		_camera.add_trauma(0.16)


## 攻击特效：近战 = 目标身上闪片；远程 = 弹道 + 闪片；暴击 = 更大更黄 + 额外震屏
func _spawn_attack_fx(e: Dictionary) -> void:
	var a := _view_of(int(e["a"]))
	var b := _view_of(int(e["b"]))
	if a == null or b == null:
		return
	var crit := bool(e["crit"])
	var target_pos := b.global_position
	var ranged := a.global_position.distance_to(b.global_position) > Board.CELL * 1.4
	if ranged:
		CombatFx.tracer(_fx_parent, a.global_position, target_pos, crit)
	CombatFx.hit_flash(_fx_parent, target_pos, crit)
	CombatFx.damage_number(_fx_parent, target_pos, float(e["v"]), crit)
	b.punch()


func _pos_of(index: int) -> Vector3:
	if index < 0 or index >= sim.units.size():
		return Vector3.ZERO
	var v := _view_of(index)
	if v != null:
		return v.global_position
	return Board.cell_to_world(sim.units[index]["cell"])


func _do_attack(e: Dictionary) -> void:
	var a := _view_of(int(e["a"]))
	if a == null:
		return
	var b := _view_of(int(e["b"]))
	if b != null:
		_face(a, b.global_position)
		var ranged := a.global_position.distance_to(b.global_position) > Board.CELL * 1.4
		a.play_attack(ranged)
	else:
		a.play_attack(false)
	if bool(e["crit"]):
		_shake(0.45)


func _face(view: Node3D, target: Vector3) -> void:
	var d := target - view.global_position
	if d.length() < 0.01:
		return
	view.rotation.y = atan2(d.x, d.z)


func _shake(amount: float) -> void:
	if _camera != null:
		_camera.add_trauma(amount)


func _view_of(index: int) -> UnitView:
	if not _views.has(index):
		return null
	var v = _views[index]
	if is_instance_valid(v):
		return v
	return null


## 清场：把还活着的视图淡出，并把**所有战斗特效节点清掉**。
## 死亡标记是留在地上的方片，不清就会一场叠一场（打 18 阶段就是 18 层半透明片），
## 越到后期越糊——这类「只增不减的展示物」很容易被忘掉。
func cleanup() -> void:
	if _fx_parent != null:
		for child in _fx_parent.get_children():
			if child is UnitView:
				continue
			# **必须用 free() 而不是 queue_free()**：queue_free 要等到帧末才真正移除，
			# 那样下一场战斗开始时上一场的死亡标记还挂在树上（实测 60 个节点残留）。
			# 特效节点全是短命物，内部 tween 随节点释放，不存在悬挂引用。
			child.free()
	for key in _views:
		var v = _views[key]
		if is_instance_valid(v):
			v.play_death()
	_views.clear()
	_fx_parent = null
	sim = null
	running = false
	_finished_at = -1.0
	_deaths.clear()
