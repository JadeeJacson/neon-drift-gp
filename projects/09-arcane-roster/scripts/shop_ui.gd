extends CanvasLayer
class_name ShopUi
## 商店 / 备战区 / 羁绊 的操作层。**只发信号，不自己改状态**——
## 所有真正的状态变更都走 RunState 的原子操作（buy / sell / combine / reroll），
## 这样「玩家点的」和「跑分跑的」走的是同一套规则。
##
## v1 用纯键盘（1-5 买、R 刷新、F 开战、A 上阵、X 卖预备），
## 不做拖拽。理由：自走棋的拖拽在 8×8 格 + 3D 场景下要做射线拾取与落点校验，
## 而键盘方案 30 行就能覆盖全部功能，**先把玩法闭环做完整，拖拽留给 v2**。

const CARD_SIZE := Vector2(168, 128)
const CARD_GAP := 10.0
const CARD_ORIGIN := Vector2(30, 640)
const BENCH_ORIGIN := Vector2(30, 500)
const BENCH_SLOT := Vector2(168, 60)
const BENCH_MAX := 9

signal buy_pressed(slot: int)
signal reroll_pressed()
signal ready_pressed()
signal bench_selected(index: int)
signal autoplace_pressed()
signal combine_pressed()

var _cards: Array = []
var _bench_slots: Array = []
var _reroll_btn: Button
var _ready_btn: Button
var _font: Font = null
var _font_big: Font = null


func _ready() -> void:
	layer = 9
	# headless 下不加载字体，理由见 hud.gd 同处注释（RID 泄漏会污染验证基线）
	if DisplayServer.get_name() != "headless" and ResourceLoader.exists("res://assets/font/Kenney Future.ttf"):
		_font = load("res://assets/font/Kenney Future.ttf")
		_font_big = _font
	for i in range(RunState.SHOP_SLOTS):
		_cards.append(_make_card(i))
	_reroll_btn = _make_button("刷新 (R)  2 金", Vector2(902, 640), Vector2(190, 46))
	_reroll_btn.pressed.connect(func(): reroll_pressed.emit())
	_ready_btn = _make_button("开战 (F)", Vector2(1102, 640), Vector2(200, 46))
	_ready_btn.pressed.connect(func(): ready_pressed.emit())
	for j in range(BENCH_MAX):
		var b := _make_bench(j)
		_bench_slots.append(b)
	var cb := _make_button("合成 (C)", Vector2(1312, 640), Vector2(180, 46))
	cb.pressed.connect(func(): combine_pressed.emit())


func _make_card(i: int) -> Button:
	var b := Button.new()
	b.position = CARD_ORIGIN + Vector2(float(i) * (CARD_SIZE.x + CARD_GAP), 0.0)
	b.size = CARD_SIZE
	b.custom_minimum_size = CARD_SIZE
	b.text = ""
	b.pressed.connect(func(): buy_pressed.emit(i))
	add_child(b)
	return b


## 备战位按钮：点击 = **选中**（再点棋盘格子落位），卖出走 X 键。
## 原版点击即卖——一场误触就把主力卖了还没有确认，而且让「手动摆位」这个
## 自走棋核心决策完全没有入口（诊断 P1-1）。
func _make_bench(i: int) -> Button:
	var b := Button.new()
	b.position = BENCH_ORIGIN + Vector2(float(i % 3) * BENCH_SLOT.x, float(i / 3) * BENCH_SLOT.y)
	b.size = BENCH_SLOT
	b.text = ""
	b.pressed.connect(func(): bench_selected.emit(i))
	add_child(b)
	return b


func _make_button(text: String, pos: Vector2, size_px: Vector2) -> Button:
	var b := Button.new()
	b.position = pos
	b.size = size_px
	b.text = text
	if _font != null:
		b.add_theme_font_override("font", _font)
	b.add_theme_font_size_override("font_size", 20)
	return b


## 刷新商店卡面。unit = {id, cost} 或 null（已售出）
func refresh_shop(shop: Array, gold: int) -> void:
	for i in range(_cards.size()):
		var card: Button = _cards[i]
		if i >= shop.size():
			card.visible = false
			card.text = ""
			continue
		card.visible = true
		var s: Dictionary = shop[i]
		var id := String(s["id"])
		var cost := int(s["cost"])
		var afford := " " if gold >= cost else "×"
		var lines := "%s%s\n%s · %d 金" % [
			afford,
			UnitTable.display(id),
			_faction_tag(id),
			cost,
		]
		if gold < cost:
			lines = "%s%s\n%d 金（不够）" % [afford, UnitTable.display(id), cost]
		card.text = lines
		card.add_theme_font_size_override("font_size", 17)
		card.modulate = Color(1, 1, 1) if gold >= cost else Color(0.55, 0.5, 0.5)


func _faction_tag(id: String) -> String:
	return "圣团" if UnitTable.faction(id) == "order" else "亡者"


func refresh_bench(bench: Array) -> void:
	for i in range(_bench_slots.size()):
		var b: Button = _bench_slots[i]
		if i < bench.size():
			var u: Dictionary = bench[i]
			b.visible = true
			b.text = "%d★ %s" % [int(u["star"]), UnitTable.display(String(u["id"]))]
			b.add_theme_font_size_override("font_size", 15)
		else:
			b.visible = false
			b.text = ""


## 选中备战位的高亮（金色边框感靠 modulate 近似）。index = -1 表示全部取消
func highlight_bench(index: int) -> void:
	for j in range(_bench_slots.size()):
		var b: Button = _bench_slots[j]
		b.modulate = Color(1.0, 0.88, 0.45) if j == index else Color(1, 1, 1)


func refresh_buttons(can_combine: bool, planning: bool) -> void:
	for c in _cards:
		(c as Button).visible = planning
	_reroll_btn.visible = planning
	_ready_btn.visible = planning


func set_ready_label(text: String) -> void:
	_ready_btn.text = text
