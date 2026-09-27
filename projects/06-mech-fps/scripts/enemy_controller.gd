extends CharacterBody3D
class_name EnemyController
## 敌型场景层：位移与表现。决策不在这里——每帧把观测交给 sim/enemy_ai.gd 的纯函数，
## 拿回「状态 + 前进/后退 + 是否开火」，这样 AI 的行为可以在 --headless 下逐帧断言（§4.2）。

const GRAVITY := 24.0
## 每个角色列的是**候选 clip 名**，按优先级从前往后试，第一个存在的就播。
## 名字口径要兼容两种导出：裸名（老 mech 模型的 `Shoot_Big`）与带骨架前缀
## （Quaternius / KayKit 这批人形角色全是 `CharacterArmature|Run`），
## 写死一套就会静默不播——模型站桩不动，还以为是动画坏了。
const ANIM_MAP := {
	"idle": ["Idle_Gun", "Idle", "idle"],
	"walk": ["Walk", "walk"],
	"run": ["Run", "run", "Walk"],
	"shoot": ["Gun_Shoot", "Idle_Gun_Shoot", "Shoot_Big", "Shoot", "shoot", "Attack"],
	"hurt": ["HitRecieve", "HitRecieve_1", "HitReceive_1", "hit"],
	"death": ["Death", "death", "Dead"],
}
## 位移动画必须循环。这批 Poly Pizza / Quaternius 导出的 GLB **每段 clip 的
## loop_mode 都是 0（NONE，实测）**，Run 只有 0.79 秒——播完就冻在最后一帧，
## 敌人变成「滑行的雕像」，制作人实跑看到的就是「人形敌人没有动作」。
## 射击/受击/死亡是一次性的，不能循环，所以按角色区分而不是全局打开循环。
## 名字以这些开头的 clip 是位移动画/待机，装配时统一改成线性循环。
## 这批 Poly Pizza / Quaternius 导出的 GLB **每段 clip 的 loop_mode 都是 0（NONE，实测）**，
## `Run` 只有 0.79 秒——播完就冻在最后一帧，敌人变成「滑行的雕像」，
## 制作人实跑看到的就是「人形敌人没有动作」。射击/受击/死亡是一次性的，不在这里。
const LOOP_CLIP_HINTS := ["Idle", "Run", "Walk", "Move"]

signal died(enemy_type: String, executed: bool)
signal damaged(enemy_type: String)

@export var enemy_type: String = "trooper"

var _hp: float
var _max_hp: float
var _stagger_left: float = 0.0
var _attack_ready_at: float = 0.0
var _anim: AnimationPlayer
var _anim_prefix := ""          # clip 名里的骨架前缀，装配时推一次
var _skeleton: Skeleton3D
var _model: Node3D
var _meshes: Array[MeshInstance3D] = []
var _flash_mat: StandardMaterial3D
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
	_skeleton = find_child("Skeleton3D", true, false) as Skeleton3D
	_detect_anim_prefix()
	_apply_loop_policy()
	_meshes = _collect_meshes(self)
	# 受击闪白靠 material_overlay：不改模型自带材质（GLB 的材质是共享资源，
	# 改一份会让所有同模型敌人都跟着闪），overlay 是每个实例自己的覆盖层。
	_flash_mat = StandardMaterial3D.new()
	_flash_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_flash_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_flash_mat.albedo_color = Color(1, 1, 1, 0.0)
	for mi in _meshes:
		mi.material_overlay = _flash_mat
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
	_flash_hit()
	# 一刀秒杀不该硬直（那是重武器/爆头的爽点），小口径连发才需要被打断
	if eff < _max_hp * 0.22:
		_stagger_left = 0.22
		_play_anim("hurt")
	return false


func is_dead() -> bool:
	return _dead


## 供冒烟测试检查死亡表现是否真的动了（倒地/下沉/缩小都作用在 _model 上）。
func model_for_test() -> Node3D:
	return _model


## 供冒烟断言：模型自带的 clip 数与当前播放名。人形敌人「有没有在跑」
## 光看位移判断不了（位移是脚本推的），必须看动画本身有没有播起来。
func anim_clip_count_for_test() -> int:
	return 0 if _anim == null else _anim.get_animation_list().size()


## 骨骼位置包围盒的对角线长度（相对骨架自身空间）。
## 冒烟用它判断「动画有没有真的在变形骨骼」：current_animation 只是个字符串，
## 字符串对、网格却冻结的情况它测不出来——这次就是这么漏掉的。
func bone_span_for_test() -> float:
	if _skeleton == null:
		return 0.0
	var lo := Vector3(INF, INF, INF)
	var hi := Vector3(-INF, -INF, -INF)
	for i in range(_skeleton.get_bone_count()):
		var o: Vector3 = _skeleton.get_bone_global_pose(i).origin
		lo = Vector3(minf(lo.x, o.x), minf(lo.y, o.y), minf(lo.z, o.z))
		hi = Vector3(maxf(hi.x, o.x), maxf(hi.y, o.y), maxf(hi.z, o.z))
	return (hi - lo).length()


## 冒烟用：绕开 AI 直接点一段动画，验证循环策略。
func force_anim_for_test(kind: String) -> bool:
	return _play_anim(kind)


func animation_name_for_test() -> String:
	return "" if _anim == null else _anim.current_animation


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
	_spawn_kill_burst()
	_play_death_motion()
	died.emit(enemy_type, executed)
	# 通知波次管理器与武器层（各自用 group 接，避免互相持有引用形成耦合）
	get_tree().call_group("wave_director", "on_enemy_died", enemy_type, executed)
	get_tree().call_group("weapon", "on_enemy_died", enemy_type, executed)
	# 回血资格与 sim/combat_loop.gd 完全一致：近距离 + threat 达标的击杀才回血
	if executed and EnemyTable.threat(enemy_type) >= CombatLoop.EXECUTION_MIN_THREAT:
		var heal := EnemyTable.field(enemy_type, "reward_health")
		if heal > 0.0:
			get_tree().call_group("player_vitals", "heal", heal)
	var timer := get_tree().create_timer(1.7)
	timer.timeout.connect(queue_free)


## 受击闪白。用 material_overlay 而不是改模型自带材质——后者是共享资源，
## 改一份会让场上所有同型号敌人一起闪。
func _flash_hit() -> void:
	if _flash_mat == null:
		return
	_flash_mat.albedo_color = Color(1, 1, 1, 0.62)
	var t := create_tween()
	t.tween_property(_flash_mat, "albedo_color:a", 0.0, 0.11)


## 死亡交代：倒地 + 下沉 + 缩小。
## 用户反馈原话是「只是停住然后消失，难判断」——有内置 Death 动画的（trooper/drone）
## 光靠动画仍不够明确，所以动画播完照样下沉缩小；没动画的（charger/heavy）先做倒地。
func _play_death_motion() -> void:
	var had_anim := _play_anim("death")
	if _model == null:
		return
	if not had_anim:
		var tip := create_tween()
		tip.tween_property(_model, "rotation_degrees:x", 76.0, 0.4)
	var sink := create_tween()
	sink.tween_interval(0.9 if had_anim else 0.45)
	sink.tween_property(_model, "position:y", _model.position.y - 0.62, 0.55)
	sink.set_parallel(true)
	sink.tween_property(_model, "scale", Vector3.ONE * 0.5, 0.55)


## 击杀爆点：一次性粒子 + 短促亮点，让「打死了」在画面和节奏上都有明确落点。
func _spawn_kill_burst() -> void:
	var pmat := ParticleProcessMaterial.new()
	pmat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_SPHERE
	pmat.emission_sphere_radius = 0.45
	pmat.direction = Vector3(0, 1, 0)
	pmat.spread = 180.0
	pmat.initial_velocity_min = 3.5
	pmat.initial_velocity_max = 9.5
	pmat.gravity = Vector3(0, -14.0, 0)

	var chunk := SphereMesh.new()
	chunk.radius = 0.07
	chunk.height = 0.14

	var fx := GPUParticles3D.new()
	fx.process_material = pmat
	fx.draw_pass_1 = chunk
	fx.amount = 26
	fx.lifetime = 0.6
	fx.one_shot = true
	fx.explosiveness = 1.0
	# 先入树再定位：节点不在树里时写 global_position 会报 !is_inside_tree() 并丢掉位置
	get_parent().add_child(fx)
	fx.global_position = global_position + Vector3(0, 1.0, 0)
	fx.emitting = true

	var light := OmniLight3D.new()
	light.light_energy = 7.0
	light.omni_range = 6.0
	light.light_color = Color(1.0, 0.75, 0.45)
	fx.add_child(light)
	var t := fx.create_tween()
	t.tween_property(light, "light_energy", 0.0, 0.2)
	var cleanup := get_tree().create_timer(1.4)
	cleanup.timeout.connect(fx.queue_free)


func _collect_meshes(node: Node) -> Array[MeshInstance3D]:
	var out: Array[MeshInstance3D] = []
	for c in node.get_children():
		if c is MeshInstance3D:
			out.append(c as MeshInstance3D)
		out.append_array(_collect_meshes(c))
	return out


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
	for name in ANIM_MAP[kind]:
		var clip := String(name)
		for candidate in [clip, _anim_prefix + clip]:
			if not _anim.has_animation(candidate):
				continue
			if _anim.current_animation != candidate:
				_anim.play(candidate)
			return true
	return false


## 一次性把位移动画设成线性循环（原因见 LOOP_CLIP_HINTS 上方注释）。
## 放在装配时而不是播放时：同一个 Animation 资源被同模型的所有敌人共享，改一次就够，
## 也不会漏掉不走 _play_anim 的调用路径。
func _apply_loop_policy() -> void:
	if _anim == null:
		return
	for c in _anim.get_animation_list():
		var full := String(c)
		# clip 名可能是 `CharacterArmature|Run`，取最后一段再比前缀
		var bar := full.rfind("|")
		var bare := full.substr(bar + 1) if bar >= 0 else full
		for hint in LOOP_CLIP_HINTS:
			if bare.begins_with(String(hint)):
				_anim.get_animation(full).loop_mode = Animation.LOOP_LINEAR
				break


## 冒烟用：某个角色解析到的 clip 现在的循环模式（-1 = 解析不到）。
func anim_loop_mode_for_test(kind: String) -> int:
	if _anim == null:
		return -1
	for name in ANIM_MAP[kind]:
		var candidate := String(name)
		if not _anim.has_animation(candidate):
			candidate = _anim_prefix + String(name)
		if _anim.has_animation(candidate):
			return _anim.get_animation(candidate).loop_mode
	return -1


## 从 clip 名里推出骨架前缀（`CharacterArmature|Run` → `CharacterArmature|`）。
## 装配时算一次，别每帧扫。
func _detect_anim_prefix() -> void:
	if _anim == null:
		return
	for c in _anim.get_animation_list():
		var s := String(c)
		var bar := s.find("|")
		if bar >= 0:
			_anim_prefix = s.substr(0, bar + 1)
			return
