extends Node
class_name PlayerVitals
## 玩家生命与受击。必须是 PlayerCharacter 的**子节点**（名为 Vitals）——
## 模板已占用根节点的 script，Godot 一个节点只能挂一个脚本。

signal hp_changed(hp: float, max_hp: float)
signal damage_taken(amount: float)
signal died

const DEATH_HOLD := 1.2

@export var max_hp: float = 100.0

var _hp: float
var _body: CharacterBody3D
var _dead: bool = false


func _ready() -> void:
	_hp = max_hp
	_body = get_parent() as CharacterBody3D
	add_to_group("player_vitals")
	hp_changed.emit(_hp, max_hp)


func take_damage(amount: float, _from: Vector3) -> void:
	if _dead:
		return
	_hp = maxf(0.0, _hp - amount)
	damage_taken.emit(amount)
	# 受击反馈必须比武器后坐更重：玩家可以躲开枪线，但不能不知道自己被打中了
	get_tree().call_group("shaker", "kick", 0.34, 0.0)
	hp_changed.emit(_hp, max_hp)
	if _hp <= 0.0:
		_die()


## 处决回血（资源循环的另一半，与 CombatLoop 的 reward_health 对齐）。
func heal(amount: float) -> void:
	if _dead:
		return
	_hp = minf(max_hp, _hp + amount)
	hp_changed.emit(_hp, max_hp)


func is_dead() -> bool:
	return _dead


func _die() -> void:
	_dead = true
	died.emit()
	# 冻结移动但保留相机，让玩家看见自己死在哪——练习期 04 的教训：
	# 瞬间黑屏会让人以为是崩溃，而不是「这局结束了」。
	if _body != null:
		_body.set_physics_process(false)
	var timer := get_tree().create_timer(DEATH_HOLD)
	timer.timeout.connect(func() -> void: Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE))
