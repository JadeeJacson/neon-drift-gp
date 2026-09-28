extends CanvasLayer
class_name Hud
## 全部用代码搭的 HUD（与 06 同样的做法：本 lab 走纯文本工作流，不开编辑器摆 UI）。
##
## 信息层级按「每一眼只需要知道一件事」排：
##   备战阶段：左上 金币/人口/回合倒计时 · 底部 商店 5 张卡 · 右侧 羁绊 · 中下 备战区
##   战斗阶段：只留 顶部 阶段名 + 右侧 双方剩余血条总览 + 左上 金币
##   结算：整屏遮罩 + 评级
## 06 的实跑反馈是「HUD 排版一般、信息层级不清」，所以这里坚持**同一时刻最多 5 个数字**。

const FONT_PATH := "res://assets/font/Kenney Future.ttf"
const COL_GOLD := Color(1.0, 0.86, 0.35)
const COL_HP := Color(0.95, 0.35, 0.32)
const COL_DIM := Color(0.78, 0.76, 0.70)
const COL_PANEL := Color(0.10, 0.09, 0.12, 0.86)

var _gold: Label
var _hp: Label
var _stage: Label
var _timer: Label
var _pop: Label
var _hint: Label
var _traits: Label
var _battle: Label
var _result: Label
var _banner: Label
var _log: Label
var _font: Font = null


func _ready() -> void:
	layer = 10
	# headless 下不加载 TTF：字体资源会在退出时留下 Font / shaped-text RID，
	# 而 verify.mjs 把 ERROR/WARNING 计入失败（它只排除两种收尾噪音）。
	# 无头验证不需要好看的字，窗口里才是。
	if DisplayServer.get_name() != "headless" and ResourceLoader.exists(FONT_PATH):
		_font = load(FONT_PATH)
	_gold = _mk_label(Vector2(28, 22), 30, COL_GOLD)
	_hp = _mk_label(Vector2(28, 58), 26, COL_HP)
	_stage = _mk_label(Vector2(28, 94), 24, Color(1, 1, 1))
	_pop = _mk_label(Vector2(28, 150), 22, COL_DIM)
	_timer = _mk_label(Vector2(28, 124), 22, COL_DIM)
	_traits = _mk_label(Vector2(1180, 22), 20, Color(0.72, 0.86, 1.0))
	# 战况条：战斗阶段的「伤亡情况」全靠它（制作人反馈：伤亡不清晰）
	_battle = _mk_label(Vector2(1180, 50), 22, Color(1.0, 0.92, 0.75))
	_battle.visible = false
	_hint = _mk_label(Vector2(28, 852), 18, COL_DIM)
	_hint.text = "1-5 购买 · R 刷新 · C 合成 · A 上阵 · X 卖预备 · F 提前开战 · 拖动鼠标/ Q,E 转视角 · 滚轮缩放 · T 倍速 · Esc 退出"
	_banner = _mk_label(Vector2(640, 120), 44, Color(1, 0.95, 0.8))
	_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_banner.size = Vector2(700, 60)
	_log = _mk_label(Vector2(640, 200), 18, COL_DIM)
	_log.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_log.size = Vector2(700, 200)
	_log.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	_result = _mk_label(Vector2(640, 380), 52, Color(1, 1, 1))
	_result.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_result.size = Vector2(900, 300)
	_result.visible = false
	_banner.modulate.a = 0.0
	_log.modulate.a = 0.0


func _mk_label(pos: Vector2, size_px: int, col: Color) -> Label:
	var l := Label.new()
	l.position = pos
	if _font != null:
		l.add_theme_font_override("font", _font)
	l.add_theme_font_size_override("font_size", size_px)
	l.add_theme_color_override("font_color", col)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.85))
	l.add_theme_constant_override("shadow_offset_x", 2)
	l.add_theme_constant_override("shadow_offset_y", 2)
	add_child(l)
	return l


## stage 阶段状态：备战倒计时 / 战斗 / 结算
func set_stage_header(stage: int, name: String, boss: bool, seconds_left: float) -> void:
	_stage.text = "阶段 %d/%d  %s%s" % [stage, StageTable.STAGE_COUNT, name, "  ★BOSS" if boss else ""]

	if seconds_left >= 0.0:
		_timer.text = "准备 %.0fs" % seconds_left
		_timer.add_theme_color_override("font_color", COL_DIM if seconds_left > 8.0 else COL_HP)
	else:
		_timer.text = "战斗中"
		_timer.add_theme_color_override("font_color", Color(1.0, 0.6, 0.3))


func set_resources(gold: int, hp: int) -> void:
	_gold.text = "金币 %d" % gold
	_hp.text = "生命 %d" % hp


## 人口必须常驻可见：买不动的时候，玩家需要立刻分清是「钱不够」（等收入就行）
## 还是「位置满了」（得先卖人换钱）。这两种情况的应对完全不同，混在一起就是「卡住」。
func set_population(pop: int, pop_max: int) -> void:
	if _pop == null:
		return
	_pop.text = "人口 %d/%d" % [pop, pop_max]
	_pop.add_theme_color_override("font_color", COL_DIM if pop < pop_max else COL_GOLD)


## 战斗阶段的战况：双方存活数 + 我方击杀数。
## 为什么必须常驻：自走棋的战斗没有玩家操作，**信息只能从画面读出来**。
## 「谁死了几个」是判断这波要不要调整站位/羁绊的唯一实时依据。
func set_battle_status(ally: int, enemy: int, kills: int, losses: int, visible_now: bool) -> void:
	if _battle == null:
		return
	_battle.visible = visible_now
	if not visible_now:
		return
	# 伤亡要同时给「还剩几个」和「已经死了几个」：只有存活数看不出这波是换血还是崩盘
	_battle.text = "我方 %d（阵亡 %d）   敌方 %d   击杀 %d" % [ally, losses, enemy, kills]
	_battle.add_theme_color_override("font_color",
		Color(0.45, 1.0, 0.5) if ally > enemy else Color(1.0, 0.45, 0.4))


func set_traits(text: String) -> void:
	_traits.text = ("羁绊  " + text) if text != "" else "羁绊  无"


## 中上横幅：Boss 登场 / 连胜里程碑 / 精英回合
func banner(text: String, seconds: float = 1.6) -> void:
	_banner.text = text
	var tw := create_tween()
	tw.tween_property(_banner, "modulate:a", 1.0, 0.18)
	tw.tween_interval(seconds)
	tw.tween_property(_banner, "modulate:a", 0.0, 0.4)


func log_line(text: String) -> void:
	_log.text = text
	var tw := create_tween()
	tw.tween_property(_log, "modulate:a", 0.95, 0.15)
	tw.tween_interval(2.4)
	tw.tween_property(_log, "modulate:a", 0.0, 0.6)


func show_result(won: bool, stage: int, grade: String, seconds: float) -> void:
	_result.visible = true
	_result.text = ("胜利 · 评级 %s\n到达阶段 %d/%d\n用时 %.1f 分钟\n\n按 Enter 再来一局，Esc 退出"
		% [grade, stage, StageTable.STAGE_COUNT, seconds / 60.0]) if won else \
		("失败 · 止步阶段 %d/%d\n用时 %.1f 分钟\n\n按 Enter 再来一局，Esc 退出"
		% [stage, StageTable.STAGE_COUNT, seconds / 60.0])


func hide_result() -> void:
	_result.visible = false


## 评级：只看三件事（通关 / 剩余生命 / 最大连胜），不搞花哨评分
static func grade(won: bool, hp_left: int, max_streak: int) -> String:
	if not won:
		return "—"
	if hp_left >= 70 and max_streak >= 8:
		return "S"
	if hp_left >= 40:
		return "A"
	if hp_left > 0:
		return "B"
	return "C"
