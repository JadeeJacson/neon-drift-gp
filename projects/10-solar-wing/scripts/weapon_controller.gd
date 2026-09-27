extends Node
class_name WeaponController
## 双联脉冲激光：hitscan 从相机准星射出，热量管理，曳光 + 枪口闪光。
## 为什么 hitscan：玩家武器要「指哪打哪」的脆感（Star Fox 式）；
## 敌人才用投射物——可闪避，让走位有意义。

signal fired
signal hit_enemy(enemy: Node, killed: bool)
## 副武器/技能状态（HUD 订阅）
signal missile_state(ammo: int, reloading: bool)
signal shield_state(active: bool, cd_ratio: float)

const TRACER_LIFE := 0.1
const MUZZLES: Array = [Vector3(-2.6, -0.5, -3.2), Vector3(2.6, -0.5, -3.2)]

var cd: float = 0.0
var shots_fired: int = 0
var hits_landed: int = 0

## —— 副武器：导弹（右键）——
var missiles: int = ShipTable.MISSILE_AMMO_MAX
var _msl_cd: float = 0.0
var _msl_reload: float = 0.0
## 当前锁定目标（HUD 画锁定框用；null = 未锁定）
var lock_target: EnemyShip = null

## —— 主动技能：显式护盾（空格）——
var _burst_cd: float = 0.0
var _burst_t: float = 0.0
## 本次护盾还剩多少吸收量（每次开启时重置为 SHIELD_BURST_ABSORB）
var _burst_left: float = 0.0
## 上一帧的按键电平（自己做边沿检测，见 tick 注释）
var _secondary_prev: bool = false
var _burst_prev: bool = false

var _ship: PlayerShip
var _rig: CameraRig
var _sfx: SfxPool
var _muzzle_idx := 0
var _tracers: Array = []
var _flash: OmniLight3D


func setup(ship: PlayerShip, rig: CameraRig, sfx: SfxPool) -> void:
	_ship = ship
	_rig = rig
	_sfx = sfx
	_flash = OmniLight3D.new()
	_flash.name = "MuzzleFlash"
	_flash.light_color = Color(0.4, 0.9, 1.0)
	_flash.light_energy = 0.0
	_flash.omni_range = 18.0
	_flash.visible = false
	_ship.add_child(_flash)


func reset_stats() -> void:
	shots_fired = 0
	hits_landed = 0
	cd = 0.0
	missiles = ShipTable.MISSILE_AMMO_MAX
	_msl_cd = 0.0
	_msl_reload = 0.0
	lock_target = null
	_burst_cd = 0.0
	_burst_t = 0.0
	_burst_left = 0.0
	_secondary_prev = false
	_burst_prev = false
	_emit_missile_state()


func tick(delta: float, firing: bool) -> void:
	cd -= delta
	_msl_cd -= delta
	_fade_tracers(delta)
	_tick_missiles(delta)
	_tick_burst(delta)
	_pick_lock()
	# 副武器/主动技能用**电平 + 内部边沿**触发，不用 is_action_just_pressed。
	# 原因（实测）：headless 下 Input.action_press() 不产生 just_pressed 边沿
	# （is_action_just_pressed 恒 false），冒烟就永远测不到这条通路；
	# 而且真机上边缘丢失（帧率抖动/输入合并）也会漏发一次按键。
	# 自己在 tick 里比较上一帧的电平，边沿行为与引擎解耦、可测。
	var secondary := Input.is_action_pressed("fire_secondary")
	if secondary and not _secondary_prev:
		_fire_missile()
	_secondary_prev = secondary
	var burst := Input.is_action_pressed("shield_burst")
	if burst and not _burst_prev:
		_try_burst()
	_burst_prev = burst
	if firing and cd <= 0.0:
		if not _ship.vitals.can_fire():
			cd = 0.25
			if _sfx != null:
				_sfx.play("click", -6.0)
			return
		if not _ship.vitals.try_spend_heat():
			cd = 0.35
			return
		_fire()


## —— 副武器：导弹 ——
func _tick_missiles(delta: float) -> void:
	if _msl_reload > 0.0:
		_msl_reload -= delta
		if _msl_reload <= 0.0:
			missiles = ShipTable.MISSILE_AMMO_MAX
			_emit_missile_state()


func _emit_missile_state() -> void:
	missile_state.emit(missiles, _msl_reload > 0.0)


## 选锁：距离最近且**在锁定锥内**的敌机。锥用 dot(准星方向, 到目标方向) 判定，
## 刻意给 0.55（≈57°）而不是贴脸——太紧会让玩家觉得「明明指着你却锁不上」。
func _pick_lock() -> void:
	lock_target = null
	if _ship == null or _rig == null or _rig.camera == null:
		return
	var cam := _rig.camera
	var origin := cam.global_position
	var fwd := -cam.global_basis.z
	var best := ShipTable.MISSILE_LOCK_RANGE
	# 敌机在 GameRoot 的 "Enemies" 容器下，必须用 get_nodes_in_group 找——
	# 早期版本遍历 _ship.get_parent() 的直接子节点，而那里根本没有敌机，
	# 于是 lock_target 恒为 null（几何完全正确也锁不上，最难查的一类 bug）。
	for e in get_tree().get_nodes_in_group("enemies"):
		var ship := e as EnemyShip
		if ship == null or not is_instance_valid(ship):
			continue
		var to := ship.global_position - origin
		var d := to.length()
		if d > best or d < 0.01:
			continue
		if fwd.dot(to / d) < ShipTable.MISSILE_LOCK_CONE:
			continue
		best = d
		lock_target = ship


func _fire_missile() -> void:
	if _msl_reload > 0.0 or _msl_cd > 0.0:
		return
	if lock_target == null:
		# 没锁到就不发：不给「盲射」兜底，否则玩家会退化成无脑连点右键
		if _sfx != null:
			_sfx.play("click", -8.0)
		return
	if missiles <= 0:
		_msl_reload = ShipTable.MISSILE_RELOAD
		_emit_missile_state()
		return
	# 锁定的敌机可能刚好在这一帧被 AI 推出锥外（或已被击毁）。
	# 允许「本帧刚锁上」的目标通过：取最近的一架，而不是严格用上一帧的结果。
	var tgt := lock_target
	if not is_instance_valid(tgt):
		tgt = _nearest_in_cone()
	if tgt == null:
		if _sfx != null:
			_sfx.play("click", -8.0)
		return
	missiles -= 1
	_msl_cd = ShipTable.MISSILE_CD
	var cam := _rig.camera
	var dir := -cam.global_basis.z
	var m := HomingMissile.new()
	_ship.get_parent().add_child(m)
	m.setup(cam.global_position + dir * 6.0, dir, tgt)
	# 导弹也算一次发射（命中率统计里它是「打出去的弹」）
	shots_fired += 1
	if _sfx != null:
		_sfx.play("laser_enemy", -6.0, 0.7)
	_emit_missile_state()


## 锁定锥内最近的一架（发射瞬间的兜底选靶）。
func _nearest_in_cone() -> EnemyShip:
	if _ship == null or _rig == null or _rig.camera == null:
		return null
	var cam := _rig.camera
	var fwd := -cam.global_basis.z
	var best := ShipTable.MISSILE_LOCK_RANGE
	var found: EnemyShip = null
	for node in get_tree().get_nodes_in_group("enemies"):
		var e := node as EnemyShip
		if e == null or not is_instance_valid(e):
			continue
		var to := e.global_position - cam.global_position
		var d := to.length()
		if d > best or d < 0.01:
			continue
		if fwd.dot(to / d) < ShipTable.MISSILE_LOCK_CONE:
			continue
		best = d
		found = e
	return found


## —— 主动技能：显式护盾 ——
func _tick_burst(delta: float) -> void:
	if _burst_t > 0.0:
		_burst_t -= delta
		if _burst_t <= 0.0:
			_ship.set_shield_aura(false)
	if _burst_cd > 0.0:
		_burst_cd -= delta
	var ratio := 1.0 - clampf(_burst_cd / maxf(ShipTable.SHIELD_BURST_CD, 0.01), 0.0, 1.0)
	shield_state.emit(_burst_t > 0.0, ratio)


func _try_burst() -> void:
	if _burst_cd > 0.0 or _burst_t > 0.0 or _ship == null:
		return
	_burst_cd = ShipTable.SHIELD_BURST_CD
	_burst_t = ShipTable.SHIELD_BURST_DURATION
	_burst_left = ShipTable.SHIELD_BURST_ABSORB
	_ship.set_shield_aura(true)
	if _sfx != null:
		_sfx.play("shield", -2.0)


## 显式护盾期间吸收伤害：返回被护盾吃掉的量（不再往下扣）。
func absorb_burst(amount: float) -> float:
	if _burst_t <= 0.0:
		return 0.0
	var got := minf(amount, _burst_left)
	_burst_left = maxf(0.0, _burst_left - amount)
	return got


func _fire() -> void:
	cd = ShipTable.LASER_INTERVAL
	shots_fired += 1
	var cam := _rig.camera
	var from := cam.global_position
	var dir := -cam.global_basis.z
	var to := from + dir * ShipTable.LASER_RANGE

	var space := _ship.get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(from, to, 4 | 1)  # enemy | world
	var exclude: Array[RID] = [_ship.get_rid()]
	query.exclude = exclude
	var hit := space.intersect_ray(query)
	var end := to
	if not hit.is_empty():
		end = hit["position"]

	var muzzle: Vector3 = _ship.to_global(MUZZLES[_muzzle_idx] as Vector3)
	_muzzle_idx = 1 - _muzzle_idx
	_spawn_tracer(muzzle, end)
	_flash_at(muzzle)
	if _sfx != null:
		_sfx.play("laser", -4.0, randf_range(0.95, 1.05))
	fired.emit()

	if not hit.is_empty():
		var enemy := hit["collider"] as EnemyShip
		if enemy != null:
			var killed := enemy.take_damage(ShipTable.LASER_DAMAGE)
			hits_landed += 1
			Fx.burst(_ship.get_parent(), end, 2.5, Color(1.0, 0.85, 0.3), 0.22)
			if _sfx != null:
				_sfx.play("impact", -8.0)
			hit_enemy.emit(enemy, killed)


func _spawn_tracer(a: Vector3, b: Vector3) -> void:
	var mi := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(0.1, 0.1, 1.0)
	mi.mesh = box
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(0.5, 0.95, 1.0)
	mat.emission_enabled = true
	mat.emission = Color(0.4, 0.9, 1.0)
	mat.emission_energy_multiplier = 6.0
	mi.material_override = mat
	var parent := _ship.get_parent()
	parent.add_child(mi)
	var mid := (a + b) * 0.5
	mi.global_position = mid
	var length := a.distance_to(b)
	if length > 0.01:
		mi.look_at(b)
	mi.scale = Vector3(1.0, 1.0, length)
	_tracers.append({"node": mi, "t": TRACER_LIFE, "mat": mat})


func _fade_tracers(delta: float) -> void:
	for i in range(_tracers.size() - 1, -1, -1):
		var entry: Dictionary = _tracers[i]
		entry["t"] = float(entry["t"]) - delta
		var mat: StandardMaterial3D = entry["mat"]
		var alpha := clampf(float(entry["t"]) / TRACER_LIFE, 0.0, 1.0)
		mat.albedo_color = Color(0.5, 0.95, 1.0, alpha)
		if float(entry["t"]) <= 0.0:
			(entry["node"] as Node).queue_free()
			_tracers.remove_at(i)


func _flash_at(pos: Vector3) -> void:
	_flash.global_position = pos
	_flash.visible = true
	_flash.light_energy = 4.0
	var tw := _ship.create_tween()
	tw.tween_property(_flash, "light_energy", 0.0, 0.07)
	tw.tween_callback(func() -> void: _flash.visible = false)
