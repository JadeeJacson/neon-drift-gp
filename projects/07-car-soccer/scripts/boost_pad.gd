extends Area3D
## boost_pad.gd — boost 拾取圈：车碾过 → 补量、熄灭、按 BoostTable 计时重生。
## 数值全部来自 sim/boost_table.gd（sim 层已断言）；本脚本只做执行与表现。
## 碰撞：mask 只含车（layer 2）——球不该吃 pad。

const BoostTable = preload("res://sim/boost_table.gd")

var is_big := false
var active := true
var _cooldown := 0.0

var _glow: MeshInstance3D
var _audio: AudioStreamPlayer3D


func setup(big: bool) -> void:
	is_big = big


func _ready() -> void:
	# is_big 无法用 set_meta 序列化进 tscn，从节点名推导（build 工具命名约定）
	is_big = String(name).begins_with("BigPad")
	body_entered.connect(_on_body_entered)
	var arena := get_parent()
	if arena != null and arena.has_method("register_pad"):
		arena.register_pad(self)
	_glow = get_node_or_null("Glow")
	_audio = get_node_or_null("PickupSound")
	_apply_active()


func _process(dt: float) -> void:
	if active:
		return
	_cooldown -= dt
	if _cooldown <= 0.0:
		active = true
		_apply_active()


func _on_body_entered(body: Node3D) -> void:
	if not active:
		return
	if body.has_method("add_boost"):
		var amount := BoostTable.BIG_PAD_AMOUNT if is_big else BoostTable.SMALL_PAD_AMOUNT
		body.add_boost(amount)
		active = false
		_cooldown = BoostTable.respawn_time(is_big)
		_apply_active()
		if _audio != null:
			_audio.pitch_scale = randf_range(0.95, 1.08)  # 表现层允许引擎 RNG
			_audio.play()


func _apply_active() -> void:
	if _glow != null:
		_glow.visible = active
	# body_entered 回调里直接改 monitoring 会被 Godot 拦截（in/out signal 期间封锁）
	set_deferred("monitoring", active)
