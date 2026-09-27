extends Node
class_name WeaponController
## 双联脉冲激光：hitscan 从相机准星射出，热量管理，曳光 + 枪口闪光。
## 为什么 hitscan：玩家武器要「指哪打哪」的脆感（Star Fox 式）；
## 敌人才用投射物——可闪避，让走位有意义。

signal fired
signal hit_enemy(enemy: Node, killed: bool)

const TRACER_LIFE := 0.1
const MUZZLES: Array = [Vector3(-2.6, -0.5, -3.2), Vector3(2.6, -0.5, -3.2)]

var cd: float = 0.0
var shots_fired: int = 0
var hits_landed: int = 0

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


func tick(delta: float, firing: bool) -> void:
	cd -= delta
	_fade_tracers(delta)
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
