extends Node
class_name GameRoot
## 整局游戏的装配与阶段状态机：PLANNING → BATTLE → SETTLE →（下一阶段）→ RESULT。
##
## 这个文件只做三件事：把各部件接起来、把输入翻译成 RunState 的原子操作、把 sim 的
## 结算翻译成画面与音效。**它不含任何战斗规则，也不含任何经济规则**——
## 那些全在 sim/ 里，所以「跑分跑的」和「玩家玩的」是同一套。
##
## 键位（见 tools/setup_inputmap.gd 写进 project.godot）：
##   1-5 购买商店位 · R 刷新 · F 开战 · A 自动上阵 · X 卖预备 · C 合成
##   Q/E 转视角 · 滚轮缩放 · T 切倍速 · H 帮助 · Esc 退出 · Enter 重开

enum Phase { PLANNING, BATTLE, SETTLE, RESULT }

const SFX_BUY := "res://assets/audio/sfx/metalClick.ogg"
const SFX_COMBINE := "res://assets/audio/sfx/handleCoins.ogg"
const SFX_SELL := "res://assets/audio/sfx/dropLeather.ogg"
const SFX_BATTLE := "res://assets/audio/sfx/knifeSlice.ogg"
const SFX_HIT := "res://assets/audio/sfx/impactMetal_heavy_000.ogg"
const SFX_PHASE := "res://assets/audio/sfx/doorOpen_1.ogg"

var run: RunState = null
var phase: int = Phase.PLANNING
var plan_left: float = 0.0
var settle_left: float = 0.0
var speed_index: int = 0
var seed_value: int = 0

@onready var board_view: BoardView = $Board
@onready var units_root: Node3D = $Board/Units
@onready var camera_rig: CameraRig = $CameraRig
@onready var hud: Hud = $Hud
@onready var shop_ui: ShopUi = $ShopUi
@onready var director: BattleDirector = $BattleDirector
@onready var bgm: BgmPlayer = $Bgm
@onready var _sfx: AudioStreamPlayer = $Sfx

const SPEEDS := [1.0, 2.0, 4.0]


func _ready() -> void:
	seed_value = int(Time.get_ticks_usec())
	board_view.build()
	director.bind_camera(camera_rig)
	director.battle_finished.connect(_on_battle_finished)
	shop_ui.buy_pressed.connect(_on_buy)
	shop_ui.reroll_pressed.connect(_on_reroll)
	shop_ui.ready_pressed.connect(_on_ready)
	shop_ui.sell_bench_pressed.connect(_on_sell_bench)
	shop_ui.combine_pressed.connect(_on_combine)
	_start_run(seed_value)


func _start_run(seed_i: int) -> void:
	run = RunState.new(seed_i)
	phase = Phase.PLANNING
	plan_left = RunState.PLANNING_SECONDS
	director.cleanup()
	_rebuild_units()
	_refresh_ui()
	bgm.play_state("planning")
	hud.banner("阶段 1 · %s" % StageTable.stage_name(1), 1.4)


# ---------- 阶段循环 ----------

func _process(delta: float) -> void:
	match phase:
		Phase.PLANNING:
			plan_left = maxf(0.0, plan_left - delta)
			hud.set_stage_header(run.stage, StageTable.stage_name(run.stage), StageTable.is_boss(run.stage), plan_left)
			hud.set_battle_status(0, 0, 0, 0, false)
			if plan_left <= 0.0:
				_start_battle()
		Phase.BATTLE:
			hud.set_stage_header(run.stage, StageTable.stage_name(run.stage), StageTable.is_boss(run.stage), -1.0)
			# 战况条每帧刷新：这是玩家判断「这波要不要认输」的唯一实时信息
			hud.set_battle_status(director.alive_ally(), director.alive_enemy(), director.kills(), director.losses(), true)
		Phase.SETTLE:
			settle_left = maxf(0.0, settle_left - delta)
			hud.set_battle_status(0, 0, 0, 0, false)
			if settle_left <= 0.0:
				_advance()


func _start_battle() -> void:
	if run.board.is_empty():
		# 空板上场＝直接判负，这是自走棋的硬规则（也防止玩家「跳过战斗刷经济」）
		hud.log_line("场上没有单位，本阶段直接判负")
		run.hp = maxi(run.hp - 6, 0)
		run.last_win = false
		run.streak = mini(run.streak - 1, -1)
		phase = Phase.SETTLE
		settle_left = 1.0
		return
	phase = Phase.BATTLE
	var enemy := StageTable.roll_enemy(SimRng.new(seed_value + run.stage * 7919), run.stage, run.streak)
	board_view.clear_units()
	director.setup(run.board_defs(), enemy, seed_value + run.stage, Traits.bonuses(run.board), units_root)
	director.set_speed(float(SPEEDS[speed_index]))
	director.running = true
	shop_ui.refresh_buttons(false, false)
	bgm.play_state("boss" if StageTable.is_boss(run.stage) else "battle")
	_play(SFX_BATTLE)
	if StageTable.is_boss(run.stage):
		hud.banner("★ BOSS 战 · %s" % StageTable.stage_name(run.stage), 2.0)


func _on_battle_finished(_result: Dictionary) -> void:
	# 用 sim 再跑一遍拿结算数值是不可行的（表现层已经播完），所以结算走 RunState 的记账：
	# 真正权威的结果在 RunState.battle() 里已经算过一次，这里只做表现。
	phase = Phase.SETTLE
	settle_left = RunState.SETTLE_SECONDS
	bgm.play_state("planning")
	var won_battle := run.stage_log.size() > 0 and bool(run.stage_log[run.stage_log.size() - 1]["win"])
	bgm.jingle("win" if won_battle else "lose")
	hud.banner("胜利" if won_battle else "战败", 1.2)


func _advance() -> void:
	var alive := run.advance()
	_rebuild_units()
	_refresh_ui()
	if not alive:
		phase = Phase.RESULT
		var g := Hud.grade(run.won, maxi(run.hp, 0), int(run.stats["win_streak_max"]))
		hud.show_result(run.won, run.stage, g, run.total_seconds())
		bgm.stop_all()
		shop_ui.refresh_buttons(false, false)
		return
	phase = Phase.PLANNING
	plan_left = RunState.PLANNING_SECONDS
	var streak := run.streak
	if streak >= 5:
		hud.banner("连胜 ×%d！赏金 +%d" % [streak, mini(1 + streak, RunState.STREAK_BONUS_CAP)], 1.8)
	if StageTable.is_boss(run.stage):
		hud.banner("阶段 %d · %s" % [run.stage, StageTable.stage_name(run.stage)], 1.4)
	_play(SFX_PHASE)


# ---------- 输入 ----------

func _unhandled_input(event: InputEvent) -> void:
	# **鼠标拖动转镜头**：按住左键/右键拖动即可旋转视角（Q/E 保留为键盘备份）。
	# 放在 _unhandled_input 里而不是 _input：商店按钮等 UI 会先消费掉自己的点击，
	# 拖到 UI 上时不会误转镜头。
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			camera_rig.zoom(-1.0)
			return
		if mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			camera_rig.zoom(1.0)
			return
		if mb.button_index == MOUSE_BUTTON_LEFT or mb.button_index == MOUSE_BUTTON_RIGHT:
			camera_rig.set_dragging(mb.pressed)
			return
		return
	if event is InputEventMouseMotion:
		var mm := event as InputEventMouseMotion
		if camera_rig.is_dragging() and (mm.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0 \
				or (mm.button_mask & MOUSE_BUTTON_MASK_RIGHT) != 0:
			camera_rig.drag_orbit(mm.relative)
		return
	if not event.is_pressed() or event.is_echo():
		return
	if event.is_action_pressed("ui_cancel"):
		get_tree().quit()
		return
	if phase == Phase.RESULT:
		if event.is_action_pressed("restart"):
			_start_run(int(Time.get_ticks_usec()))
		return
	if event.is_action_pressed("cam_left"):
		camera_rig.orbit(-1.0)
		return
	if event.is_action_pressed("cam_right"):
		camera_rig.orbit(1.0)
		return
	if event.is_action_pressed("speed_toggle"):
		speed_index = (speed_index + 1) % SPEEDS.size()
		director.set_speed(float(SPEEDS[speed_index]))
		hud.log_line("战斗速度 ×%d" % int(SPEEDS[speed_index]))
		return
	if phase != Phase.PLANNING:
		return
	for i in range(RunState.SHOP_SLOTS):
		if event.is_action_pressed("buy_%d" % (i + 1)):
			_on_buy(i)
			return
	if event.is_action_pressed("reroll"):
		_on_reroll()
	elif event.is_action_pressed("ready"):
		_on_ready()
	elif event.is_action_pressed("combine"):
		_on_combine()
	elif event.is_action_pressed("sell_bench"):
		if run.bench.size() > 0:
			_on_sell_bench(run.bench.size() - 1)
	elif event.is_action_pressed("autoplace"):
		_on_autoplace()


# ---------- 商店操作（全部走 RunState 的原子操作） ----------

func _on_buy(slot: int) -> void:
	if not run.buy(slot):
		bgm.jingle("error")
		return
	_play(SFX_BUY)
	_after_change()


func _on_reroll() -> void:
	if not run.reroll():
		bgm.jingle("error")
		return
	_play(SFX_SELL)
	_after_change()


func _on_combine() -> void:
	if not run.combine():
		bgm.jingle("error")
		return
	_play(SFX_COMBINE)
	hud.log_line("合成成功！")
	_after_change()


func _on_sell_bench(index: int) -> void:
	if not run.sell_bench(index):
		return
	_play(SFX_SELL)
	_after_change()


func _on_autoplace() -> void:
	var moved := 0
	while run.place_next():
		moved += 1
	if moved > 0:
		_play(SFX_BUY)
	_after_change()


func _on_ready() -> void:
	if phase != Phase.PLANNING:
		return
	# 提前开战奖励：与 sim 的 income() 一致（那里默认 +1）
	run.gold += RunState.EARLY_START_BONUS
	_start_battle()


func _after_change() -> void:
	_rebuild_units()
	_refresh_ui()


# ---------- 视图与 UI 同步 ----------

func _rebuild_units() -> void:
	if board_view == null:
		return
	board_view.clear_units()
	for i in range(run.board.size()):
		var u: Dictionary = run.board[i]
		var d := {"id": String(u["id"]), "star": int(u["star"]), "cell": u["cell"], "is_ally": true}
		board_view.place_unit(i, d)


func _refresh_ui() -> void:
	if hud == null or run == null:
		return
	hud.set_resources(run.gold, maxi(run.hp, 0))
	hud.set_population(run.board.size(), run.population_cap())
	hud.set_traits(run.traits_summary())
	shop_ui.refresh_shop(run.shop, run.gold)
	shop_ui.refresh_bench(run.bench)
	shop_ui.refresh_buttons(run.can_combine(), phase == Phase.PLANNING)
	shop_ui.set_ready_label("开战 (F)  +%d金" % RunState.EARLY_START_BONUS)


func _play(path: String) -> void:
	if not ResourceLoader.exists(path):
		return
	var s: AudioStream = load(path)
	if s == null:
		return
	_sfx.stream = s
	_sfx.play()
