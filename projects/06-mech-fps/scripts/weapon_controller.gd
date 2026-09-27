extends Node3D
class_name WeaponController
## 武器层：挂在玩家相机下的开火/换弹/切枪 + hitscan 判定 + 反馈链。
## 数值一律取自 sim/weapon_table.gd（单一事实来源，改平衡只改 sim 层并被断言约束）。
##
## 分工线（docs/00 §4.3）：本脚本只做「输入 → 射线 → 结算 → 表现」，
## 不承担需要跨帧复现的逻辑；那些都在 sim/ 里有对应断言。

## 摆放参数都是**量出来的**，不是手填的（rot 单位度，pos 在相机局部空间）：
##   静态枪 → tools/measure_viewmodels.gd（包围盒最长轴 = 枪管）。
##     不量就统一按 -Z 摆，结果就是第一轮实跑看到的「有的枪横在屏幕上」。
##   绑定枪 → tools/fit_viewmodel.gd（把「握把点→枪口点」两点锚定到目标位置）。
##     带手臂的模型包围盒最长轴是肩膀跨度，套上面的办法必然摆歪。
## 两个工具都打印复验偏差，PASS 才粘。
const VIEWMODELS := {
	## J-Toastie 的「第一人称 + 两只手 + 真 Reload」AKM rig（CC-BY 3.0，署名见 ASSET_MANIFEST §2h）。
	## 模型里没有枪口标记节点，锚点用骨骼：握把 = Hand.R.001，枪口 = 前手 Hand.L 沿两手连线外推。
	"assault_rifle": {
		"path": "res://assets/models/weapons/akm_viewmodel_hands.glb",
		"rot": Vector3(-14.6412, 79.8479, 4.2348),
		"scale": 0.0534,
		"pos": Vector3(0.1295, -0.2260, -0.4313),
		"muzzle": Vector3(0.14, -0.16, -0.70),
		"anim": {"idle": "Armature|Idle", "shoot": "Armature|Shoot", "reload": "Armature|Reload"},
	},
	"shotgun": {
		"path": "res://assets/models/weapons/shotgun.glb",
		"rot": Vector3(0, 90, 0), "scale": 0.806, "pos": Vector3(0.20, -0.16, -0.30),
	},
	## Majikay 的 CC0 双臂 viewmodel：整套 Rigify 骨架（两条手臂 + 手 + 枪），
	## 自带 Idle / Reload / Shoot / Unholster 四段真动画，换弹不再是 tween 凑的。
	## 模型里留了一个 Muzzle 空网格当枪口标记，所以曳光和枪口焰跟着手动，而不是钉死在一个点。
	## 代价：它是 .44 手枪，和「精确射手步枪」的角色不完全对得上——先用来验证带手 viewmodel 这条链路。
	"dmr_sniper": {
		"path": "res://assets/models/weapons/deagle_viewmodel_hands.glb",
		"rot": Vector3(-35.5469, -146.4307, 172.2205),
		"scale": 0.4880,
		"pos": Vector3(0.5572, -0.5116, -0.1338),
		"muzzle": Vector3(0.1600, -0.1800, -0.6000),
		"muzzle_node": "Muzzle",
		"anim": {"idle": "Idle", "shoot": "Shoot", "reload": "Reload", "unholster": "Unholster"},
	},
}

const RAY_LENGTH := 200.0
const SPREAD_BASE := 0.006
const EXECUTION_RANGE := 4.0
const TRACER_ALPHA := 0.85
const RECOIL_PUSH := 0.045      # 开火时枪身后顶的距离（米）
const RELOAD_DIP := 0.14        # 换弹下沉深度
const RELOAD_TILT := 26.0       # 换弹前倾角度

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
signal reload_finished(mag: int)
signal hit_confirmed(killed: bool)
signal weapon_switched(display: String)

@export var weapon_order: Array[String] = ["assault_rifle", "shotgun", "dmr_sniper"]

var _current: String
var _mag: int
var _reserve: int
var _next_shot_at: float = 0.0
var _reload_until: float = 0.0
var _alt_sound: bool = false
var _trigger_held: bool = false
var _fired_this_press: bool = false
var _camera: Camera3D
var _viewmodels: Dictionary = {}
var _vm_anims: Dictionary = {}          # id -> AnimationPlayer（只有绑定 viewmodel 才有）
var _vm_muzzle_nodes: Dictionary = {}   # id -> 模型自带的枪口标记节点（会跟着动画动）
var _muzzles: Dictionary = {}          # id -> 相机局部空间的枪口点（实测包围盒算出）
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
		_trigger_held = true
		_fired_this_press = false
		try_fire()
	elif event.is_action_released("fire_primary"):
		_trigger_held = false
		_fired_this_press = false
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


## 连发在这里驱动：按住自动武器时，冷却一到就补一发。
## 放在 _process 而不是靠 Input 事件，是因为事件只在按下那一帧来，步枪就只能单发。
## 半自动/泵动的「一发一按」由 try_fire 里的 _fired_this_press 拦。
func _process(_delta: float) -> void:
	if _trigger_held and WeaponTable.is_automatic(_current):
		try_fire()


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
	_trigger_held = false
	# 切枪必须重新扣一次扳机：否则上一把枪留下的「这次按压已发过弹」标记
	# 会让泵动/半自动的新枪直接哑火。
	_fired_this_press = false
	for id in _viewmodels:
		(_viewmodels[id] as Node3D).visible = (String(id) == _current)
	_reset_viewmodel_pose()
	# 拔枪是一次性登场动作，播完停在最后一帧（实测最后一帧 = 待机姿态）；没有它的枪直接进待机。
	if not _play_vm_anim("unholster", true):
		_play_vm_anim("idle")
	_emit_ammo()
	weapon_switched.emit(WeaponTable.display(_current))


## 供 HUD 与冒烟测试读取当前状态。
func mag() -> int:
	return _mag


func reserve() -> int:
	return _reserve


func current_id() -> String:
	return _current


## 枪口在世界空间的当前位置。绑定 viewmodel 用模型自带的 Muzzle 节点（换弹/后座时它会跟着手动），
## 静态 viewmodel 退回装配时算出的固定点。
func muzzle_global() -> Vector3:
	var marker := _vm_muzzle_nodes.get(_current) as Node3D
	if marker != null:
		return marker.global_position
	return to_global(_muzzles.get(_current, Vector3(0, -0.1, -0.5)))


## 注入扳机状态。冒烟测试与 §4.3 的 bot 都靠它来「按住开火」，
## 而不是伪造 InputEvent——伪造事件会让输入层与逻辑层的边界糊掉。
func set_trigger(pressed: bool) -> void:
	_trigger_held = pressed
	if pressed:
		_fired_this_press = false


## 冒烟断言用的只读探针（docs/00 §4.2：表现层也要能被无头跑检查）。
## muzzle_rest_local：装配时定下的枪口点（相机局部）；用它验证模型自带的枪口节点
## 在待机姿态下确实落在 fit 解出来的位置——摆放参数被人手改坏了这条就会红。
func muzzle_rest_local() -> Vector3:
	return _muzzles.get(_current, Vector3.ZERO)


func muzzle_marker_for_test() -> Node3D:
	return _vm_muzzle_nodes.get(_current) as Node3D


func vm_animation_for_test() -> String:
	var player := _vm_anims.get(_current) as AnimationPlayer
	if player == null:
		return ""
	return player.current_animation


## 配置里 anim 点名的 clip 有没有真的存在于模型里，返回「角色→片段名」列表（空 = 全都有）。
## 静态枪没有 AnimationPlayer，返回空即视为通过（它们由 tween 兜底换弹动作）。
func vm_missing_anim_clips(id: String) -> PackedStringArray:
	var out := PackedStringArray()
	var player := _vm_anims.get(id) as AnimationPlayer
	if player == null:
		return out
	var anims: Dictionary = VIEWMODELS[id].get("anim", {})
	for kind in anims:
		var clip := String(anims[kind])
		if not player.has_animation(clip):
			out.append("%s→%s" % [String(kind), clip])
	return out


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
	if _fired_this_press and not WeaponTable.is_automatic(_current):
		return  # 半自动/泵动：一次扣扳机只发一发
	if _mag <= 0:
		start_reload()
		return
	_mag -= 1
	_fired_this_press = true
	_next_shot_at = now + WeaponTable.fire_interval(_current)

	var from := _camera.global_position
	var muzzle := muzzle_global()
	var dir := -_camera.global_transform.basis.z
	dir += Vector3(randf_range(-SPREAD_BASE, SPREAD_BASE), randf_range(-SPREAD_BASE, SPREAD_BASE), 0)
	dir = dir.normalized()

	_play(_shot_sfx_path())
	_flash_muzzle()
	_kick_viewmodel()
	_play_vm_anim("shoot", true)

	var hit := _raycast(from, from + dir * RAY_LENGTH)
	if hit.is_empty():
		_show_tracer(muzzle, from + dir * 60.0)
		hit_confirmed.emit(false)
		return

	_show_tracer(muzzle, hit.position)
	_impact.global_position = hit.position
	_impact.restart()
	_play(SFX.impact)
	if hit.has("enemy"):
		var killed: bool = (hit.enemy as EnemyController).take_damage(
			WeaponTable.burst_damage(_current, hit.distance), from, false)
		if killed:
			_play(SFX.kill)
		hit_confirmed.emit(killed)
		var stop := WeaponTable.field(_current, "hitstop")
		if stop > 0.0:
			get_tree().call_group("shaker", "hitstop", stop)
	else:
		hit_confirmed.emit(false)
	get_tree().call_group("shaker", "kick",
		WeaponTable.field(_current, "recoil"), WeaponTable.field(_current, "fov_kick"))
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
		_kick_viewmodel(1.8)
		hit_confirmed.emit(enemy.take_damage(999999.0, from, true))
		return


func start_reload(force: bool = false) -> void:
	var mag_size := int(WeaponTable.field(_current, "mag_size"))
	if not force and (_mag >= mag_size or _reserve <= 0):
		return
	var duration := WeaponTable.field(_current, "reload_time")
	_reload_until = Time.get_ticks_msec() / 1000.0 + duration
	reload_started.emit(duration)
	_play(SFX.reload)
	_play_vm_anim("reload", true)
	if not _vm_anims.has(_current):
		_animate_reload(duration)   # 没有绑定动画的静态枪才用 tween 凑换弹动作
	var timer := get_tree().create_timer(duration)
	timer.timeout.connect(_finish_reload)


## 供截图工具强制进入换弹状态（满弹时也要能看到换弹姿势）。
func force_reload_for_shot() -> void:
	start_reload(true)


## 播放 viewmodel 自带动画。只有带 anim 配置的绑定模型才会命中。
## 返回是否真的播上了，调用方用它决定要不要退回别的片段（比如切枪时的拔枪动作）。
func _play_vm_anim(kind: String, restart: bool = false) -> bool:
	var player := _vm_anims.get(_current) as AnimationPlayer
	if player == null:
		return false
	var names: Dictionary = VIEWMODELS[_current].get("anim", {})
	var clip := String(names.get(kind, ""))
	if clip.is_empty():
		return false
	if not player.has_animation(clip):
		# 静默不播会让人以为动画坏了却查不到（Idle-loop / Idle 就是这么坑过一次）
		push_warning("viewmodel 缺少动画 %s（现有：%s）" % [clip, ", ".join(player.get_animation_list())])
		return false
	if player.current_animation == clip and not restart:
		return true
	player.play(clip)
	return true


func _finish_reload() -> void:
	var need := int(WeaponTable.field(_current, "mag_size")) - _mag
	var taken := mini(need, _reserve)
	_mag += taken
	_reserve -= taken
	_emit_ammo()
	reload_finished.emit(_mag)


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


## 装配 viewmodel，并**从模型实际包围盒反算枪口点**。
## 这样曳光与枪口焰一定落在枪管前端，改姿态/换模型都不用再手填偏移。
## 供截图工具与调试输出：当前 viewmodel 的变换、动画播放器状态、枪口点。
func viewmodel_debug() -> String:
	var vm := _current_viewmodel()
	if vm == null:
		return "VM 缺失（weapon=%s）" % _current
	var player := _vm_anims.get(_current) as AnimationPlayer
	var clips := ""
	var current := "-"
	if player != null:
		current = player.current_animation
		clips = ", ".join(player.get_animation_list())
	var marker := _vm_muzzle_nodes.get(_current) as Node3D
	return "VM[%s] pos=%s rot=%s scale=%.3f player=%s current=%s clips=(%s) muzzle=%s live_muzzle=%s box=%s" % [
		_current, str(vm.position), str(vm.rotation_degrees), vm.scale.x,
		str(player != null), current, clips, str(_muzzles.get(_current, Vector3.ZERO)),
		str(marker.global_position) if marker != null else "-", str(_vm_global_box(vm))]


## viewmodel 的实际世界包围盒（动画姿态下量，比猜位置可靠）。
func _vm_global_box(vm: Node3D) -> AABB:
	var box := AABB()
	var found := false
	for m in _all_meshes(vm):
		var mi := m as MeshInstance3D
		var box_local := _xform_aabb(mi.get_aabb(), mi.global_transform)
		box = box_local if not found else box.merge(box_local)
		found = true
	return box


func _build_viewmodels() -> void:
	for id in VIEWMODELS:
		var cfg: Dictionary = VIEWMODELS[id]
		var path := String(cfg["path"])
		if not ResourceLoader.exists(path):
			push_warning("武器模型缺失，跳过 viewmodel：%s" % path)
			continue
		var inst := (load(path) as PackedScene).instantiate()
		inst.name = "VM_" + String(id)
		add_child(inst)
		var s := float(cfg["scale"])
		inst.scale = Vector3(s, s, s)
		inst.position = cfg["pos"]
		inst.rotation_degrees = cfg["rot"]
		inst.visible = false
		_viewmodels[id] = inst
		# 配置里给了 muzzle（fit 工具解出来的目标枪口点）就直接用：
		# 绑定模型的静止姿态不等于游戏内姿态，包围盒推不出枪管轴。
		if cfg.has("muzzle"):
			_muzzles[id] = cfg["muzzle"]
		else:
			_muzzles[id] = _compute_muzzle(inst)
		var player := inst.find_child("AnimationPlayer", true, false) as AnimationPlayer
		if player != null and cfg.has("anim"):
			_vm_anims[id] = player
		# 枪口标记节点（绑定模型自带的 Muzzle 空网格）：曳光与枪口焰用它，
		# 换弹时枪移走了起点跟着移——写死的那个点做不到。
		var marker := String(cfg.get("muzzle_node", ""))
		if not marker.is_empty():
			var mark_node := inst.find_child(marker, true, false) as Node3D
			if mark_node == null:
				push_warning("%s 里没有枪口标记节点 %s，退回静态 muzzle 点" % [id, marker])
			else:
				_vm_muzzle_nodes[id] = mark_node
				# 它是 Blender 里当标记用的面片，不隐藏会在枪口挂一块常驻白片
				if mark_node is MeshInstance3D:
					(mark_node as MeshInstance3D).visible = false


## 在 Weapon 局部空间里求「最靠前（-Z 最小）的那一点」，取盒中心的高度作为枪口高度。
## 只量**传进来的这把枪**：早先写成遍历 self 的整棵子树，于是把另外两把 viewmodel
## 连同曳光/粒子一起并进包围盒——接了带手臂的 rig 之后，霰弹的枪口被算到 3.3 米外、
## 0.7 米下方，曳光又变回「不从枪口出发」。
func _compute_muzzle(inst: Node3D) -> Vector3:
	var box := AABB()
	var found := false
	var inv := get_global_transform().affine_inverse()
	for m in _all_meshes(inst):
		var mi := m as MeshInstance3D
		# 网格的世界变换 → 折算到本节点（Weapon，位于相机原点）局部空间。
		# 必须显式标注：_all_meshes 返回无类型 Array，元素是 Variant，
		# 用 `:=` 推断会撞上本工程「Variant 推断即错误」的规则（§5.0b 第 2 条）。
		var to_local: Transform3D = inv * mi.global_transform
		var box_local := _xform_aabb(mi.get_aabb(), to_local)
		box = box_local if not found else box.merge(box_local)
		found = true
	if not found:
		return Vector3(0.2, -0.12, -0.55)
	var center := box.get_center()
	return Vector3(center.x, center.y, box.position.z)


func _all_meshes(node: Node) -> Array:
	var out: Array = []
	for c in node.get_children():
		if c is MeshInstance3D:
			out.append(c)
		out.append_array(_all_meshes(c))
	return out


func _xform_aabb(box: AABB, xform: Transform3D) -> AABB:
	var corners: Array[Vector3] = []
	for x in [0.0, 1.0]:
		for y in [0.0, 1.0]:
			for z in [0.0, 1.0]:
				corners.append(box.position + Vector3(box.size.x * x, box.size.y * y, box.size.z * z))
	var result := AABB(xform * corners[0], Vector3.ZERO)
	for i in range(1, corners.size()):
		result = result.expand(xform * corners[i])
	return result


func _build_fx() -> void:
	_muzzle_light = OmniLight3D.new()
	_muzzle_light.name = "MuzzleFlash"
	_muzzle_light.light_energy = 0.0
	_muzzle_light.omni_range = 7.0
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
	pmat.direction = Vector3(0, 0, 1)
	pmat.spread = 62.0
	pmat.initial_velocity_min = 3.0
	pmat.initial_velocity_max = 9.0
	pmat.gravity = Vector3(0, -7.0, 0)

	var sphere := SphereMesh.new()
	sphere.radius = 0.045
	sphere.height = 0.09

	_impact = GPUParticles3D.new()
	_impact.name = "ImpactBurst"
	_impact.process_material = pmat
	_impact.draw_pass_1 = sphere
	_impact.amount = 22
	_impact.lifetime = 0.34
	_impact.one_shot = true
	_impact.emitting = false
	add_child(_impact)


func _current_viewmodel() -> Node3D:
	return _viewmodels.get(_current) as Node3D


func _vm_pos(id: String) -> Vector3:
	return VIEWMODELS[id]["pos"]


func _vm_rot(id: String) -> Vector3:
	return VIEWMODELS[id]["rot"]


func _reset_viewmodel_pose() -> void:
	var vm := _current_viewmodel()
	if vm == null:
		return
	vm.position = _vm_pos(_current)
	vm.rotation_degrees = _vm_rot(_current)


## 开火时枪身后顶并回位（第一人称「脆」感的一半）。
func _kick_viewmodel(multiplier: float = 1.0) -> void:
	var vm := _current_viewmodel()
	if vm == null:
		return
	var base := _vm_pos(_current)
	vm.position = base + Vector3(0, 0.012, RECOIL_PUSH * multiplier)
	var t := create_tween()
	t.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	t.tween_property(vm, "position", base, 0.09)


## 换弹动作：下沉 + 前倾，回到原位的时间与 reload_time 对齐。
func _animate_reload(duration: float) -> void:
	var vm := _current_viewmodel()
	if vm == null:
		return
	var base := _vm_pos(_current)
	var rot := _vm_rot(_current)
	var dip_rot := Vector3(rot.x, rot.y, rot.z + RELOAD_TILT)
	var t := create_tween()
	t.tween_property(vm, "position", base + Vector3(0, -RELOAD_DIP, 0.03), duration * 0.28)
	t.parallel().tween_property(vm, "rotation_degrees", dip_rot, duration * 0.28)
	t.tween_interval(duration * 0.44)
	t.tween_property(vm, "position", base, duration * 0.28)
	t.parallel().tween_property(vm, "rotation_degrees", rot, duration * 0.28)


func _flash_muzzle() -> void:
	_muzzle_light.global_position = muzzle_global()
	_muzzle_light.light_energy = 5.5
	var t := create_tween()
	t.tween_property(_muzzle_light, "light_energy", 0.0, 0.07)


## 曳光：从**枪口**到命中点的细长盒体，靠 alpha 快速衰减。
func _show_tracer(from: Vector3, to: Vector3) -> void:
	var length := from.distance_to(to)
	if length < 0.1:
		return
	var bm := BoxMesh.new()
	bm.size = Vector3(0.016, 0.016, length)
	_tracer.mesh = bm
	_tracer.global_position = (from + to) * 0.5
	_tracer.look_at(to, Vector3.UP)
	_tracer_mat.albedo_color = Color(1.0, 0.85, 0.45, TRACER_ALPHA)
	_tracer.visible = true
	var t := create_tween()
	t.tween_property(_tracer_mat, "albedo_color:a", 0.0, 0.09)
	t.tween_callback(func() -> void: _tracer.visible = false)
