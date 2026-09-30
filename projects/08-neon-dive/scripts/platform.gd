extends StaticBody2D
class_name NeonPlatform
## 平台高度上的玩法（制作人 2026-09-28 提的第四点）。三种 kind，来自 Biomes 的比例：
##
##   solid   普通落脚台
##   crumble 踩满 0.6 秒就塌，2 秒后重生 —— 不许停留，把「高台」从安全位变成计时压力
##   bounce  落上去自动高弹 —— 让 >3 格的高差可达，生成器才敢铺真正的立体结构
##
## 为什么塌台自己计时而不是让 PlayerController 来管：
## 「哪块台子快塌了」是平台的状态，玩家只是触发者。放在玩家侧，两只怪或以后
## 多角色同时踩台就得重写；放这里，任何 body 踩它都走同一条路。

const CRUMBLE_STAND_FRAMES := 36      # 0.6s @60fps：够跳上去再走，不够站着打完一轮
const CRUMBLE_RESPAWN_FRAMES := 120   # 2s 重生：给玩家「这条路会重新出现」的预期
const CRUMBLE_WARN_FRAMES := 18       # 塌前 0.3s 开始闪，不能无声消失

signal crumbled(body: NeonPlatform)
signal respawned(body: NeonPlatform)
signal bounced(body: NeonPlatform, who: Node2D)

var kind: String = "solid"
var bounce_mult: float = 1.65
var shape: CollisionShape2D = null

var base_modulate := Color(1, 1, 1, 1)

var _stood := false
var _frames_stood := 0
var _broken_frames := 0
var _visuals: Array[Node2D] = []


## 玩家（或任何 body）落地时由 PlayerController 调一次。每帧重置，所以「踩过一下」
## 只会累积 1 帧，路过不会把台子踩塌
func player_stood() -> void:
	_stood = true


func register_visual(n: Node2D) -> void:
	if n != null:
		# 记下初始颜色：塔前的变红是在「本来的颜色」上插值，
		# 直接覆盖会把 bounce/crumble 的种类色洗掉
		base_modulate = n.modulate
		_visuals.append(n)


func is_broken() -> bool:
	return _broken_frames > 0


func _physics_process(_delta: float) -> void:
	if kind != "crumble":
		_stood = false
		return

	if _broken_frames > 0:
		_broken_frames -= 1
		if _broken_frames == 0:
			_restore()
		_stood = false
		return

	if _stood:
		_frames_stood += 1
		if _frames_stood >= CRUMBLE_STAND_FRAMES:
			_break_apart()
	else:
		# 没被踩就缓慢回血：否则玩家「跳一下试个深度」就会把台子消耗掉
		_frames_stood = maxi(_frames_stood - 2, 0)
	_stood = false
	_shake()


func _break_apart() -> void:
	_broken_frames = CRUMBLE_RESPAWN_FRAMES
	_frames_stood = 0
	collision_layer = 0
	for v in _visuals:
		if is_instance_valid(v):
			v.visible = false
	crumbled.emit(self)


func _restore() -> void:
	collision_layer = 2
	for v in _visuals:
		if is_instance_valid(v):
			v.visible = true
			v.modulate = base_modulate
	respawned.emit(self)


## 临塌前的可读反馈：抖动 + 变红。没有这一步，玩家会觉得台子「无故消失」，
## 和上一轮掉坑没反馈是同一类问题
func _shake() -> void:
	if kind != "crumble":
		return
	var left := CRUMBLE_STAND_FRAMES - _frames_stood
	var warning := left <= CRUMBLE_WARN_FRAMES
	for v in _visuals:
		if not is_instance_valid(v):
			continue
		if warning:
			var t := 1.0 - float(left) / float(CRUMBLE_WARN_FRAMES)
			v.modulate = base_modulate.lerp(Color(1.0, 0.30, 0.25), t)
			v.position.x = sin(float(_frames_stood) * 1.7) * 1.6 * t
		else:
			v.modulate = base_modulate
			v.position.x = 0.0
