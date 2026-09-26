extends Node3D
class_name WeaponController
## 武器层：挂在玩家相机下的开火/换弹/切枪 + hitscan 判定 + 反馈链。
## 数值一律取自 sim/weapon_table.gd（单一事实来源，改平衡只改 sim 层并被断言约束）。
##
## 分工线（docs/00 §4.3）：本脚本只做「输入 → 射线 → 结算 → 表现」，
## 不承担需要跨帧复现的逻辑；那些都在 sim/ 里有对应断言。

const VIEWMODEL_PATHS := {
	"assault_rifle": "res://assets/models/weapons/assault_rifle.glb",
	"shotgun": "res://assets/models/weapons/shotgun.glb",
	"dmr_sniper": "res://assets/models/weapons/dmr_sniper.glb",
}

## 缩放取自 assets/ASSET_MANIFEST.md（Poly Pizza 模型尺度不统一，不看这张表必然「枪比人长」）
const VIEWMODEL_SCALES := {
	"assault_rifle": 0.55,
	"shotgun": 1.10,
	"dmr_sniper": 0.58,
}

const VIEWMODEL_OFFSET := Vector3(0.22, -0.19, -0.46)
const MUZZLE_LOCAL := Vector3(0.22, -0.17, -0.80)
const RAY_LENGTH := 200.0
const SPREAD_BASE := 0.006
const EXECUTION_RANGE := 4.0
const TRACER_ALPHA := 0.85

## 音效路径取自工程内 assets/audio/sfx（语义化命名见 ASSET_MANIFEST.md §4）
const SFX := {
	"assault_rifle": ["res://assets/audio/sfx/fire_rifle.ogg", "res://assets/audio/sfx/fire_rifle_alt.ogg"],
	"shotgun": ["res://assets/audio/sfx/fire_shotgun.ogg"],
	"dmr_sniper": ["res://assets/audio/sfx/fire_sniper.ogg"],
	"impact": "res://assets/audio/sfx/impact_metal.ogg",
	"kill": "res://assets/audio/sfx/explosion.ogg",
	"reload": "res://assets/audio/sfx/ui_click.ogg",
	"execute": "res://assets/audio/sfx/thruster.ogg",
}

signal ammo_changed(mag: int, mag_size: int, reserve: int, display: String)
signal reload_started(duration: float)
signal hit_confirmed(killed: bool)
signal weapon_switched(display: String)

@export var weapon_order: Array[String] = ["assault_rifle", "shotgun", "dmr_sniper"]

var _current: String
var _mag: int
var _reserve: int
var _next_shot_at: float = 0.0
var _reload_until: float = 0.0
var _alt_sound: bool = false
var _camera: Camera3D
var _viewmodels: Dictionary = {}
var _muzzle_light: OmniLight3D
var _tracer: MeshInstance3D
var _tracer_mat: StandardMaterial3D
var _impact: GPUParticles3D
var _audio: AudioStreamPlayer3D


func _ready() -> void:
	add_to_group("weapon")
	_camera = get_viewport().get_camera_3d()
	_audio = AudioStreamPlayer3D.new()
	add_child(_audio)
	_build_viewmodels()
	_build_fx()
	select(0)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("fire_primary"):
		try_fire()
	elif event.is_action_pressed("fire_alt"):
		try_execute()
	elif event.is_action_pressed("reload"):
		start_reload()
	elif event.is_action_pressed("weapon_1"):
		select(0)
	elif event.is_action_pressed("weapon_2"):
		select(1)
	elif event.is_action_pressed("weapon_3"):
		select(2)


## 供 HUD 与冒烟测试读取当前弹量（避免测试靠信号回溯）。
func mag() -> int:
	return _mag


func reserve() -> int:
	return _reserve


func current_id() -> String:
	return _current


func select(index: int) -> void:
	if index < 0 or index >= weapon_order.size():
		return
	var candidate := weapon_order[index]
	if not WeaponTable.has_id(candidate):
		push_warning("未登记的武器 id: " + candidate)
		return
	_current = candidate
	_mag = int(WeaponTable.field(_current, "mag_size"))
	_reserve = int(WeaponTable.field(_current, "reserve"))
	_next_shot_at = 0.0
	_reload_until = 0.0
	for id in _viewmodels:
		(_viewmodels[id] as Node3D).visible = (String(id) == _current)
	_emit_ammo()
	weapon_switched.emit(WeaponTable.display(_current))


## 清波奖励弹药（WaveDirector 用 call_group 打过来）。
func add_reserve(amount: int) -> void:
	_reserve += amount
	_emit_ammo()


## 击杀回资源（sim/combat_loop.gd 的实体化，倍率与 sim 层保持一致）。
func on_enemy_died(enemy_type: String, executed: bool) -> void:
	var reward := EnemyTable.field(enemy_type, "reward_ammo")
	if executed:
		reward *= CombatLoop.EXECUTION_AMMO_MULT
	_reserve += int(reward)
	_emit_ammo()


func try_fire() -> void:
	var now := Time.get_ticks_msec() / 1000.0
	if now < _next_shot_at or now < _reload_until:
		return
	if _mag <= 0:
		start_reload()
		return
	_mag -= 1
	_next_shot_at = now + WeaponTable.fire_interval(_current)

	var from := _camera.global_position
	var dir := -_camera.global_transform.basis.z
	dir += Vector3(randf_range(-SPREAD_BASE, SPREAD_BASE), randf_range(-SPREAD_BASE, SPREAD_BASE), 0)
	dir = dir.normalized()

	_play(_shot_sfx_path())
	_flash_muzzle()

	var hit := _raycast(from, from + dir * RAY_LENGTH)
	if hit.is_empty():
		_show_tracer(from + dir * 60.0)
		hit_confirmed.emit(false)
		return

	_show_tracer(hit.position)
	_impact.global_position = hit.position
	_impact.restart()
	_play(SFX.impact)
	if hit.has("enemy"):
		var killed: bool = (hit.enemy as EnemyController).take_damage(
			WeaponTable.burst_damage(_current, hit.distance), from, false)
		if killed:
			_play(SFX.kill)
		hit_confirmed.emit(killed)
	else:
		hit_confirmed.emit(false)
	_emit_ammo()


## 近身处决（右键）：4 米内一击必杀，是资源循环「进攻有回报」的操作入口。
func try_execute() -> void:
	var now := Time.get_ticks_msec() / 1000.0
	if now < _next_shot_at:
		return
	var from := _camera.global_position
	var fwd := -_camera.global_transform.basis.z
	for body in get_tree().get_nodes_in_group("enemies"):
		var enemy := body as EnemyController
		if enemy == null or enemy.is_dead():
			continue
		var to := enemy.global_position
		if from.distance_to(to) > EXECUTION_RANGE:
			continue
		if fwd.normalized().dot((to - from).normalized()) < 0.86:
			continue
		_next_shot_at = now + 0.55
		_play(SFX.execute)
		hit_confirmed.emit(enemy.take_damage(999999.0, from, true))
		return


func start_reload() -> void:
	var mag_size := int(WeaponTable.field(_current, "mag_size"))
	if _mag >= mag_size or _reserve <= 0:
		return
	var duration := WeaponTable.field(_current, "reload_time")
	_reload_until = Time.get_ticks_msec() / 1000.0 + duration
	reload_started.emit(duration)
	_play(SFX.reload)
	var timer := get_tree().create_timer(duration)
	timer.timeout.connect(_finish_reload)


func _finish_reload() -> void:
	var need := int(WeaponTable.field(_current, "mag_size")) - _mag
	var taken := mini(need, _reserve)
	_mag += taken
	_reserve -= taken
	_emit_ammo()


func _emit_ammo() -> void:
	ammo_changed.emit(_mag, int(WeaponTable.field(_current, "mag_size")), _reserve,
		WeaponTable.display(_current))


## 掩体射线只查 world(1) + enemy(4)，玩家自身在 layer 2，天然不会打到自己的枪口。
func _raycast(from: Vector3, to: Vector3) -> Dictionary:
	var query := PhysicsRayQueryParameters3D.create(from, to)
	query.collision_mask = 1 | 4
	var result := get_world_3d().direct_space_state.intersect_ray(query)
	if result.is_empty():
		return {}
	var out := {
		"position": result.position,
		"distance": from.distance_to(result.position),
	}
	if result.collider is EnemyController:
		out.enemy = result.collider
	return out


func _shot_sfx_path() -> String:
	var options: Array = SFX[_current]
	if options.size() > 1:
		# 同一音高连播会迅速产生机械疲劳感（练习期教训），所以双音交替
		_alt_sound = not _alt_sound
		return String(options[1] if _alt_sound else options[0])
	return String(options[0])


func _play(path: String) -> void:
	if not ResourceLoader.exists(path):
		push_warning("音效缺失：%s" % path)
		return
	_audio.stream = load(path)
	_audio.global_position = _camera.global_position
	_audio.play()


func _build_viewmodels() -> void:
	for id in VIEWMODEL_PATHS:
		var path := String(VIEWMODEL_PATHS[id])
		if not ResourceLoader.exists(path):
			push_warning("武器模型缺失，跳过 viewmodel：%s" % path)
			continue
		var inst := (load(path) as PackedScene).instantiate()
		inst.name = "VM_" + String(id)
		add_child(inst)
		inst.transform = Transform3D(Basis.IDENTITY.scaled(Vector3.ONE * float(VIEWMODEL_SCALES[id])),
			VIEWMODEL_OFFSET)
		inst.visible = false
		_viewmodels[id] = inst


func _build_fx() -> void:
	_muzzle_light = OmniLight3D.new()
	_muzzle_light.name = "MuzzleFlash"
	_muzzle_light.light_energy = 0.0
	_muzzle_light.omni_range = 6.0
	_muzzle_light.position = MUZZLE_LOCAL
	add_child(_muzzle_light)

	_tracer_mat = StandardMaterial3D.new()
	_tracer_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_tracer_mat.albedo_color = Color(1.0, 0.85, 0.45, TRACER_ALPHA)
	_tracer_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	_tracer_mat.emission_enabled = true
	_tracer_mat.emission = Color(1.0, 0.9, 0.55)
	_tracer_mat.emission_energy_multiplier = 3.0

	_tracer = MeshInstance3D.new()
	_tracer.name = "Tracer"
	_tracer.material_override = _tracer_mat
	_tracer.visible = false
	add_child(_tracer)

	var pmat := ParticleProcessMaterial.new()
	pmat.direction = Vector3(0, 0, -1)
	pmat.spread = 55.0
	pmat.initial_velocity_min = 2.0
	pmat.initial_velocity_max = 7.0
	pmat.gravity = Vector3(0, -9.0, 0)

	var sphere := SphereMesh.new()
	sphere.radius = 0.03
	sphere.height = 0.06

	_impact = GPUParticles3D.new()
	_impact.name = "ImpactBurst"
	_impact.process_material = pmat
	_impact.draw_pass_1 = sphere
	_impact.amount = 14
	_impact.lifetime = 0.28
	_impact.one_shot = true
	_impact.emitting = false
	add_child(_impact)


func _flash_muzzle() -> void:
	_muzzle_light.light_energy = 4.5
	var t := create_tween()
	t.tween_property(_muzzle_light, "light_energy", 0.0, 0.07)


## 曳光：枪口到命中点的细长盒体，靠 alpha 快速衰减。
func _show_tracer(point: Vector3) -> void:
	var start_global := global_transform.origin + MUZZLE_LOCAL
	var length := start_global.distance_to(point)
	if length < 0.1:
		return
	var bm := BoxMesh.new()
	bm.size = Vector3(0.014, 0.014, length)
	_tracer.mesh = bm
	_tracer.global_position = (start_global + point) * 0.5
	_tracer.look_at(point, Vector3.UP)
	_tracer_mat.albedo_color = Color(1.0, 0.85, 0.45, TRACER_ALPHA)
	_tracer.visible = true
	var t := create_tween()
	t.tween_property(_tracer_mat, "albedo_color:a", 0.0, 0.08)
	t.tween_callback(func() -> void: _tracer.visible = false)
