extends CharacterBody3D
class_name EnemyController
## 敌型场景层：位移与表现。决策不在这里——每帧把观测交给 sim/enemy_ai.gd 的纯函数，
## 拿回「状态 + 前进/后退 + 是否开火」，这样 AI 的行为可以在 --headless 下逐帧断言（§4.2）。

const GRAVITY := 24.0
const ANIM_MAP := {
	"idle": ["Idle", "idle"],
	"walk": ["Walk", "walk"],
	"run": ["Run", "run", "Walk"],
	"shoot": ["Shoot_Big", "Shoot", "shoot", "Attack"],
	"hurt": ["HitRecieve_1", "HitReceive_1", "hit"],
	"death": ["Death", "death", "Dead"],
}

signal died(enemy_type: String, executed: bool)
signal damaged(enemy_type: String)

@export var enemy_type: String = "trooper"

var _hp: float
var _max_hp: float
var _stagger_left: float = 0.0
var _attack_ready_at: float = 0.0
var _anim: AnimationPlayer
var _model: Node3D
var _player: Node3D
var _bob_phase: float = 0.0
var _time: float = 0.0
var _dead: bool = false


func _ready() -> void:
	assert(EnemyTable.has_type(enemy_type), "未登记的敌型: " + enemy_type)
	_hp = EnemyTable.hp(enemy_type)
	_max_hp = _hp
	collision_layer = 4
	collision_mask = 1 | 2
	add_to_group("enemies")
	_model = _find_model(self)
	_anim = _find_anim_player(self)
	_player = get_tree().get_first_node_in_group("PlayerCharacter")


func _physics_process(delta: float) -> void:
	if _dead or _player == null:
		return
	var now := Time.get_ticks_msec() / 1000.0
	_stagger_left = maxf(0.0, _stagger_left - delta)

	var to_player := _player.global_position - global_position
	var flat := Vector3(to_player.x, 0.0, to_player.z)
	var distance := flat.length()
	var decision := EnemyAI.decide(enemy_type, {
		"distance": distance,
		"has_los": _has_los(_player),
		"attack_ready": now >= _attack_ready_at,
		"hp_ratio": _hp / _max_hp,
		"cover_available": _cover_available(),
		"stagger_left": _stagger_left,
	})

	_apply_movement(decision, flat.normalized(), EnemyTable.field(enemy_type, "speed"), delta)
	_apply_presentation(decision, now, delta)

	if bool(decision.fire) and now >= _attack_ready_at:
		_attack_ready_at = now + EnemyTable.field(enemy_type, "attack_interval")
		_attack(_player)


func take_damage(raw_amount: float, _from_position: Vector3, executed: bool = false) -> bool:
	if _dead:
		return false
	var eff := EnemyTable.effective_damage(enemy_type, raw_amount, false, 1.0)
	_hp -= eff
	if _hp <= 0.0:
		_die(executed)
		return true
	damaged.emit(enemy_type)
	# 一刀秒杀不该硬直（那是重武器/爆头的爽点），小口径连发才需要被打断
	if eff < _max_hp * 0.22:
		_stagger_left = 0.22
		_play_anim("hurt")
	return false


func is_dead() -> bool:
	return _dead


func _apply_movement(decision: Dictionary, dir_flat: Vector3, speed: float, delta: float) -> void:
	var move := int(decision.move)
	if move != 0 and dir_flat != Vector3.ZERO:
		velocity.x = dir_flat.x * speed * float(move)
		velocity.z = dir_flat.z * speed * float(move)
	else:
		velocity.x = move_toward(velocity.x, 0.0, speed * delta * 6.0)
		velocity.z = move_toward(velocity.z, 0.0, speed * delta * 6.0)

	if enemy_type == "drone":
		# 蜂群是飞行单位：不落地，悬浮用时间相位（位移相位在悬停时为 0，会僵住）
		velocity.y = sin(_time * 3.4) * 1.2
	else:
		velocity.y = 0.0 if is_on_floor() else velocity.y - GRAVITY * delta
	move_and_slide()


func _apply_presentation(decision: Dictionary, _now: float, delta: float) -> void:
	var state := String(decision.state)
	var planar_speed := Vector2(velocity.x, velocity.z).length()
	_time += delta
	_bob_phase += planar_speed * delta * 1.6  # 摆动相位由**真实位移**驱动（练习期 04 方法论）

	if _anim != null:
		if bool(decision.fire):
			_play_anim("shoot")
		elif state in [EnemyAI.ADVANCE, EnemyAI.SEARCH]:
			_play_anim("run" if planar_speed > EnemyTable.field(enemy_type, "speed") * 0.6 else "walk")
		elif state != EnemyAI.STAGGER:
			_play_anim("idle")
	elif _model != null:
		# 无内置动画的机型号（charger/heavy）：程序化 bob + 前倾，刚性机械体本来不吃有机感
		_model.position.y = absf(sin(_bob_phase)) * 0.06
		_model.rotation.x = clampf(planar_speed * 0.012, 0.0, 0.14)


func _attack(target: Node3D) -> void:
	_play_anim("shoot")
	var vitals := _find_vitals(target)
	if vitals != null:
		vitals.take_damage(EnemyTable.field(enemy_type, "attack_damage"), global_position)


func _die(executed: bool) -> void:
	_dead = true
	_hp = 0.0
	collision_layer = 0
	set_physics_process(false)
	_play_anim("death")
	died.emit(enemy_type, executed)
	# 通知波次管理器与武器层（各自用 group 接，避免互相持有引用形成耦合）
	get_tree().call_group("wave_director", "on_enemy_died", enemy_type, executed)
	get_tree().call_group("weapon", "on_enemy_died", enemy_type, executed)
	# 回血资格与 sim/combat_loop.gd 完全一致：近距离 + threat 达标的击杀才回血
	if executed and EnemyTable.threat(enemy_type) >= CombatLoop.EXECUTION_MIN_THREAT:
		var heal := EnemyTable.field(enemy_type, "reward_health")
		if heal > 0.0:
			get_tree().call_group("player_vitals", "heal", heal)
	var timer := get_tree().create_timer(3.0)
	timer.timeout.connect(queue_free)


func _has_los(target: Node3D) -> bool:
	var query := PhysicsRayQueryParameters3D.create(
		global_position + Vector3(0, 1.0, 0), target.global_position + Vector3(0, 1.0, 0))
	query.collision_mask = 1  # 只看关卡几何：敌人之间不互相阻挡视线
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	return hit.is_empty() or hit.collider == target


## 「有掩体」用敌人四周是否存在可遮挡体积近似——够用，且不需要 navmesh。
func _cover_available() -> bool:
	var origin := global_position + Vector3(0, 0.8, 0)
	for side in [Vector3(1, 0, 0), Vector3(-1, 0, 0), Vector3(0, 0, 1), Vector3(0, 0, -1)]:
		var query := PhysicsRayQueryParameters3D.create(origin, origin + side * 4.0)
		query.collision_mask = 1
		if not get_world_3d().direct_space_state.intersect_ray(query).is_empty():
			return true
	return false


func _find_vitals(node: Node) -> PlayerVitals:
	if node is PlayerVitals:
		return node as PlayerVitals
	var parent := node.get_parent()
	return null if parent == null else _find_vitals(parent)


func _find_anim_player(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node as AnimationPlayer
	for child in node.get_children():
		var found := _find_anim_player(child)
		if found != null:
			return found
	return null


func _find_model(node: Node) -> Node3D:
	for child in node.get_children():
		if child is Node3D:
			return child as Node3D
	return null


func _play_anim(kind: String) -> bool:
	if _anim == null:
		return false
	var names: Array = ANIM_MAP[kind]
	for name in names:
		if _anim.has_animation(String(name)):
			if _anim.current_animation != String(name):
				_anim.play(String(name))
			return true
	return false
