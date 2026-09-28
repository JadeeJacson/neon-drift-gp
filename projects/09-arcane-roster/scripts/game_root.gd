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

# ---------- 手动摆位状态（诊断 P1-1：接口早已写好，只是从来没接上） ----------
var _sel_bench: int = -1        # 选中的备战位下标（落子模式的起点）
var _sel_board: int = -1        # 选中的场上单位（board 数组下标，移动模式的起点）
var _press_pos: Vector2 = Vector2.ZERO
var _pressing_left: bool = false
var _pressing_right: bool = false
const CLICK_SLOP := 8.0         # 按下到松开位移小于这个值 → 算点击而不是拖动

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
	shop_ui.bench_selected.connect(_on_bench_clicked)
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
	_clear_selection()
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
	# **鼠标**：按住拖动 = 转视角；按住后原地点击 = 摆位交互。
	# 两者共用左键，靠「按下到松开的位移」区分（CLICK_SLOP 以内算点击）。
	# 放在 _unhandled_input 里而不是 _input：商店按钮等 UI 会先消费掉自己的点击。
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			camera_rig.zoom(-1.0)
			return
		if mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			camera_rig.zoom(1.0)
			return
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_pressing_left = true
				_press_pos = mb.position
			else:
				_pressing_left = false
				if mb.position.distance_to(_press_pos) < CLICK_SLOP:
					_on_board_click(mb.position)
			camera_rig.set_dragging(mb.pressed)
			return
		if mb.button_index == MOUSE_BUTTON_RIGHT:
			if mb.pressed:
				_pressing_right = true
				_press_pos = mb.position
			else:
				_pressing_right = false
				if mb.position.distance_to(_press_pos) < CLICK_SLOP:
					_clear_selection()   # 右键单击 = 取消选中
			camera_rig.set_dragging(mb.pressed)
			return
		return
	if event is InputEventMouseMotion:
		var mm := event as InputEventMouseMotion
		if camera_rig.is_dragging() and (mm.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0 \
				or (mm.button_mask & MOUSE_BUTTON_MASK_RIGHT) != 0:
			camera_rig.drag_orbit(mm.relative)
		# 悬停高亮：纯数学拾取（射线交 y=0 平面），开销可忽略
		if phase == Phase.PLANNING:
			board_view.set_hover(_screen_to_cell(mm.position))
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
		# X = 卖出当前选中的备战位；没有选中则卖最后一个（保留旧习惯）
		var idx := _sel_bench if _sel_bench >= 0 else run.bench.size() - 1
		if idx >= 0:
			_on_sell_bench(idx)
	elif event.is_action_pressed("autoplace"):
		_on_autoplace()


# ---------- 手动摆位（点备战位 → 点棋盘；点场上单位 → 点新格子） ----------

## 屏幕坐标 → 棋盘格。射线与 y=0 平面求交，纯数学，不依赖物理体。
## 返回 (-1,-1) 表示没点在棋盘上。
func _screen_to_cell(screen: Vector2) -> Vector2i:
	var cam := camera_rig.camera
	if cam == null:
		return Vector2i(-1, -1)
	var from := cam.project_ray_origin(screen)
	var dir := cam.project_ray_normal(screen)
	if absf(dir.y) < 0.0001:
		return Vector2i(-1, -1)
	var t := -from.y / dir.y
	if t < 0.0:
		return Vector2i(-1, -1)
	var p := from + dir * t
	# world_to_cell 会 clamp 到棋盘内，必须先排除棋盘外的点击
	var half_w := float(Board.COLS) * Board.CELL * 0.5 + Board.CELL * 0.5
	var half_d := float(Board.ROWS) * Board.CELL * 0.5 + Board.CELL * 0.5
	if absf(p.x) > half_w or absf(p.z) > half_d:
		return Vector2i(-1, -1)
	return Board.world_to_cell(p)


func _clear_selection() -> void:
	_sel_bench = -1
	_sel_board = -1
	board_view.set_selected_cell(Vector2i(-1, -1))
	board_view.set_selected_bench(-1)
	shop_ui.highlight_bench(-1)


func _select_board_at(cell: Vector2i) -> bool:
	var occ := run.occupancy()
	if not occ.has(cell):
		return false
	for i in range(run.board.size()):
		var u: Dictionary = run.board[i]
		if u["cell"] == cell:
			_sel_board = i
			_sel_bench = -1
			board_view.set_selected_cell(cell)
			board_view.set_selected_bench(-1)
			shop_ui.highlight_bench(-1)
			return true
	return false


func _on_bench_clicked(index: int) -> void:
	if phase != Phase.PLANNING:
		return
	if index < 0 or index >= run.bench.size():
		return
	# 再点同一个 = 取消
	if _sel_bench == index:
		_clear_selection()
		return
	_sel_bench = index
	_sel_board = -1
	board_view.set_selected_bench(index)
	board_view.set_selected_cell(Vector2i(-1, -1))
	shop_ui.highlight_bench(index)
	hud.log_line("已选中 %s，点击我方半场空格落位（右键取消）" % UnitTable.display(String(run.bench[index]["id"])))


func _on_board_click(screen: Vector2) -> void:
	if phase != Phase.PLANNING:
		return
	var cell := _screen_to_cell(screen)
	if cell.x < 0:
		_clear_selection()
		return
	# 点到了敌方半场 → 一律当作取消
	if not Board.ALLY_ROWS.has(cell.y):
		_clear_selection()
		return
	# 1) 落子模式：把选中的备战位放上棋盘
	if _sel_bench >= 0:
		if run.place_unit(_sel_bench, cell):
			_clear_selection()
			_after_change()
		elif not _select_board_at(cell):
			_clear_selection()
		return
	# 2) 移动模式：把选中的场上单位挪到新格子
	if _sel_board >= 0:
		var src: Vector2i = run.board[_sel_board]["cell"] if _sel_board < run.board.size() else Vector2i(-1, -1)
		if run.move_board_unit(_sel_board, cell):
			_clear_selection()
			_after_change()
		elif not _select_board_at(cell):
			_clear_selection()
		return
	# 3) 无选中：点到了谁就选谁，点空地清空
	if not _select_board_at(cell):
		_clear_selection()


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
	# 提前开战奖励走 RunState 的原子操作，与跑分画像同一条路径
	run.start_early()
	_start_battle()


func _after_change() -> void:
	# 买/卖/合成/落位都会重排 board 与 bench 的下标，选中的下标必须作废
	_clear_selection()
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
