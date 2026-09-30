extends Node3D
## AUREOLE 主控：环境（WorldEnvironment）、自由漫游相机、机位、HUD、输入。
##
## 渲染管线全部在这里显式配置 —— 文档《技术参数说明》的每一条都能对着这份代码核。
##
## 交互（默认 = 自由漫游，无碰撞穿墙查看器）：
##   点击画面        捕获鼠标进入视角控制
##   鼠标            转头（俯仰限制 ±85°）
##   W/A/S/D        沿视线平移 / 横移
##   Q / E（或 空格） 下降 / 上升（世界系垂直）
##   滚轮            飞行速度 1~40 m/s；Shift ×4 加速；Alt ×0.25 微调
##   1~5             瞬移到固定机位（wide/mezz/corridor/detail/up）
##   T               切换机位慢速巡游（给截图用的漂移）
##   H               显示/隐藏 HUD；Esc 先释放鼠标，再按一次退出
##
## 机位同时供截图工具使用（tools/capture_shots.gd → set_shot）。

const SHOT_NAMES := ["wide", "mezz", "corridor", "detail", "up"]

const SHOTS := {
	"wide": {"pos": Vector3(-5.4, 1.65, 8.4), "target": Vector3(3.4, 3.6, -4.0), "fov": 76.0},
	"mezz": {"pos": Vector3(-10.5, 7.6, -5.6), "target": Vector3(4.2, 0.5, 4.2), "fov": 66.0},
	"corridor": {"pos": Vector3(0.0, 1.7, -12.0), "target": Vector3(0.0, 2.4, -44.0), "fov": 66.0},
	"detail": {"pos": Vector3(9.7, 1.5, 2.4), "target": Vector3(11.9, 1.35, 2.2), "fov": 40.0},
	"up": {"pos": Vector3(2.0, 1.6, 5.8), "target": Vector3(-2.0, 12.6, -2.0), "fov": 84.0},
}

var cam: Camera3D
var hud: Label
var world_env: WorldEnvironment

var _idx := 0
var _tour := false          # 默认自由漫游；T 切巡游（截图工具依赖机位保持）
var _time := 0.0
var _hud_on := true
var _fps_accum := 0.0
var _fps_frames := 0
# 自由漫游状态
var _yaw := 0.0
var _pitch := 0.0
var _fly_speed := 6.0
const MOUSE_SENS := 0.0026
const PITCH_LIMIT := 1.48    # ≈85°


func _ready() -> void:
	_setup_environment()
	_setup_camera()
	Arena.build(self)
	_setup_hud()
	set_shot("wide")
	print("BENCH-READY shots=%s" % str(SHOT_NAMES))


# ─────────────────────── 环境：Forward+ 的全套后期与 GI ───────────────────────

func _setup_environment() -> void:
	world_env = WorldEnvironment.new()
	world_env.name = "WorldEnv"
	var env := Environment.new()
	world_env.environment = env
	add_child(world_env)

	# 背景：程序化暮色天空（同时给 SDFGI 提供天光）
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(0.035, 0.055, 0.1)
	sky_mat.sky_horizon_color = Color(0.38, 0.27, 0.19)
	sky_mat.ground_bottom_color = Color(0.04, 0.038, 0.04)
	sky_mat.ground_horizon_color = Color(0.3, 0.24, 0.19)
	sky_mat.sun_angle_max = 6.0
	sky_mat.sun_curve = 0.15
	sky_mat.energy_multiplier = 1.0
	var sky := Sky.new()
	sky.sky_material = sky_mat
	sky.radiance_size = Sky.RADIANCE_SIZE_256
	sky.process_mode = Sky.PROCESS_MODE_QUALITY
	env.sky = sky
	env.background_mode = Environment.BG_SKY
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.7
	env.ambient_light_sky_contribution = 1.0
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY

	# 色调映射：AgX（高光肩部平滑，霓虹 + 钠灯不至于糊成白块）
	env.tonemap_mode = Environment.TONE_MAPPER_AGX
	env.tonemap_exposure = 1.0

	# 泛光 Bloom：多级 glow（1~7 级全开但衰减），emissive 面光源起光晕
	env.glow_enabled = true
	env.glow_normalized = false
	env.glow_intensity = 0.9
	env.glow_strength = 0.75
	env.glow_bloom = 0.06
	env.glow_hdr_threshold = 1.0
	env.glow_hdr_scale = 2.0
	env.glow_blend_mode = Environment.GLOW_BLEND_MODE_ADDITIVE
	env.set("glow_levels/1", 0.55)
	env.set("glow_levels/2", 0.6)
	env.set("glow_levels/3", 0.8)
	env.set("glow_levels/4", 0.6)
	env.set("glow_levels/5", 0.45)
	env.set("glow_levels/6", 0.35)
	env.set("glow_levels/7", 0.3)

	# 环境光遮蔽 SSAO + 间接光缝 SSIL（Forward+ 独有）
	env.ssao_enabled = true
	env.ssao_radius = 1.6
	env.ssao_intensity = 2.4
	env.ssao_power = 1.5
	env.ssao_horizon = 0.06
	env.ssao_detail = true
	env.ssao_sharpness = 0.95
	env.ssao_light_affect = 0.35
	env.ssil_enabled = true
	env.ssil_intensity = 0.9
	env.ssil_radius = 1.6

	# 屏幕空间反射：抛光砖 / 水洼吃霓虹倒影
	env.ssr_enabled = true
	env.ssr_max_steps = 64
	env.ssr_depth_tolerance = 0.25

	# SDFGI：动态全局光照主力（emissive 霓虹 → 混凝土弹光）
	env.sdfgi_enabled = true
	env.sdfgi_cascades = 4
	env.sdfgi_min_cell_size = 0.25
	env.sdfgi_energy = 1.0
	env.sdfgi_bounce_feedback = 0.6
	env.sdfgi_read_sky_light = true
	env.sdfgi_use_occlusion = true
	env.sdfgi_y_scale = Environment.SDFGI_Y_SCALE_100_PERCENT
	env.sdfgi_normal_bias = 1.0
	env.sdfgi_probe_bias = 0.1

	# 体积雾：光柱 / 空气透视（格栅条纹光柱靠它才「看得见」）
	env.volumetric_fog_enabled = true
	env.volumetric_fog_density = 0.024
	env.volumetric_fog_length = 120.0
	env.volumetric_fog_anisotropy = 0.7
	env.volumetric_fog_albedo = Color(0.74, 0.81, 0.93)
	env.volumetric_fog_ambient_inject = 0.25
	env.volumetric_fog_gi_inject = 0.6
	env.volumetric_fog_sky_affect = 1.0
	env.volumetric_fog_temporal_reprojection_enabled = true
	env.volumetric_fog_temporal_reprojection_amount = 0.9

	# 轻微调色（AGX 之上只加一点点，克制）
	env.adjustment_enabled = true
	env.adjustment_brightness = 1.0
	env.adjustment_contrast = 1.06
	env.adjustment_saturation = 1.07

	print("ENV-OK tonemap=AGX glow=on ssao=on ssil=on ssr=on sdfgi=%d cascades fog=on" %
		env.sdfgi_cascades)


# ─────────────────────── 相机：固定机位 + 慢速巡游 ───────────────────────

func _setup_camera() -> void:
	cam = Camera3D.new()
	cam.name = "ShotCam"
	cam.near = 0.08
	cam.far = 260.0
	add_child(cam)
	# 物理相机：光圈 / 快门 / ISO 三件套（自动曝光关闭 → 截图可复现）
	var attrs := CameraAttributesPhysical.new()
	attrs.exposure_aperture = 2.8
	attrs.exposure_shutter_speed = 1.0 / 50.0
	attrs.exposure_sensitivity = 1250.0
	attrs.auto_exposure_enabled = false
	cam.attributes = attrs
	cam.current = true


func set_shot(name: String) -> void:
	if not SHOTS.has(name):
		push_warning("未知机位 " + name)
		return
	_idx = SHOT_NAMES.find(name)
	_apply_shot()


func current_shot_name() -> String:
	return SHOT_NAMES[_idx]


func _apply_shot() -> void:
	var s: Dictionary = SHOTS[SHOT_NAMES[_idx]]
	cam.fov = float(s["fov"])
	cam.look_at_from_position(s["pos"], s["target"], Vector3.UP)
	_sync_angles()
	if hud != null:
		hud.text = _hud_text()


## 把当前相机朝向写回自由漫游的 yaw/pitch，保证「瞬移机位后可无缝接管视角」
func _sync_angles() -> void:
	var e := cam.rotation        # Node3D 默认 YXZ 欧拉：x=俯仰 y=偏航
	_pitch = e.x
	_yaw = e.y


func _process(delta: float) -> void:
	_fps_accum += delta
	_fps_frames += 1
	if _fps_accum >= 0.5 and hud != null:
		hud.text = _hud_text()
		_fps_accum = 0.0
		_fps_frames = 0
	if Engine.is_editor_hint():
		return
	if _tour:
		_tour_sway(delta)
	else:
		_free_move(delta)


# ─────────────────────── 自由漫游 ───────────────────────

func _free_move(delta: float) -> void:
	# 姿态：始终由 yaw/pitch 驱动（鼠标增量只改这两个数，互不打架）
	cam.rotation = Vector3(_pitch, _yaw, 0.0)
	var dir := Vector3.ZERO
	var b := cam.transform.basis
	if Input.is_physical_key_pressed(KEY_W):
		dir -= b.z
	if Input.is_physical_key_pressed(KEY_S):
		dir += b.z
	if Input.is_physical_key_pressed(KEY_A):
		dir -= b.x
	if Input.is_physical_key_pressed(KEY_D):
		dir += b.x
	if Input.is_physical_key_pressed(KEY_E) or Input.is_physical_key_pressed(KEY_SPACE):
		dir += Vector3.UP
	if Input.is_physical_key_pressed(KEY_Q) or Input.is_physical_key_pressed(KEY_CTRL):
		dir -= Vector3.UP
	if dir == Vector3.ZERO:
		return
	var speed := _fly_speed
	if Input.is_key_pressed(KEY_SHIFT):
		speed *= 4.0
	if Input.is_key_pressed(KEY_ALT):
		speed *= 0.25
	cam.position += dir.normalized() * speed * delta


func _tour_sway(delta: float) -> void:
	_time += delta
	var s: Dictionary = SHOTS[SHOT_NAMES[_idx]]
	var base_pos: Vector3 = s["pos"]
	var base_target: Vector3 = s["target"]
	# 慢速漂移：给 SDFGI / TAA 持续的时域输入，也避免画面完全静止看不出「活着」
	var sway := Vector3(sin(_time * 0.17) * 0.22, sin(_time * 0.11) * 0.06, cos(_time * 0.14) * 0.22)
	cam.look_at_from_position(base_pos + sway, base_target + sway * 0.35, Vector3.UP)


func _unhandled_input(event: InputEvent) -> void:
	# 鼠标视角（仅捕获状态 + 自由漫游模式）
	var motion := event as InputEventMouseMotion
	if motion != null:
		if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED and not _tour:
			_yaw -= motion.relative.x * MOUSE_SENS
			_pitch = clampf(_pitch - motion.relative.y * MOUSE_SENS, -PITCH_LIMIT, PITCH_LIMIT)
		return

	var btn := event as InputEventMouseButton
	if btn != null and btn.pressed:
		if btn.button_index == MOUSE_BUTTON_WHEEL_UP and not _tour:
			_fly_speed = clampf(_fly_speed * 1.25, 1.0, 40.0)
			hud.text = _hud_text()
		elif btn.button_index == MOUSE_BUTTON_WHEEL_DOWN and not _tour:
			_fly_speed = clampf(_fly_speed / 1.25, 1.0, 40.0)
			hud.text = _hud_text()
		elif btn.button_index == MOUSE_BUTTON_LEFT and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED   # 点击画面 → 接管视角
			hud.text = _hud_text()
		return

	var key := event as InputEventKey
	if key == null or not key.pressed or key.echo:
		return
	if key.keycode >= KEY_1 and key.keycode <= KEY_5:
		_idx = int(key.keycode) - int(KEY_1)
		_apply_shot()
	elif key.keycode == KEY_T:
		_tour = not _tour
		if not _tour:
			_sync_angles()      # 巡游→自由：接管时朝向无缝
		hud.text = _hud_text()
	elif key.keycode == KEY_H:
		_hud_on = not _hud_on
		hud.visible = _hud_on
	elif key.keycode == KEY_ESCAPE:
		if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE   # 第一次：释放鼠标
			hud.text = _hud_text()
		else:
			get_tree().quit()                              # 第二次：退出


# ─────────────────────── HUD ───────────────────────

func _setup_hud() -> void:
	hud = Label.new()
	hud.name = "Hud"
	hud.position = Vector2(14, 12)
	hud.add_theme_font_size_override("font_size", 15)
	hud.add_theme_color_override("font_color", Color(0.85, 0.95, 1.0, 0.92))
	hud.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.75))
	hud.add_theme_constant_override("outline_size", 4)
	hud.text = _hud_text()
	var layer := CanvasLayer.new()
	layer.add_child(hud)
	add_child(layer)


func _hud_text() -> String:
	var fps := 0.0
	if _fps_accum > 0.0:
		fps = float(_fps_frames) / _fps_accum
	var s: Dictionary = SHOTS[SHOT_NAMES[_idx]]
	var mode := "巡游" if _tour else "自由"
	var captured := Input.mouse_mode == Input.MOUSE_MODE_CAPTURED
	var look := "视角已捕获" if captured else "点击画面捕获视角"
	if _tour:
		return "AUREOLE 光晕中庭 — [%s] shot %d/%d [%s]  |  %s · T 回自由 · H HUD  |  %.1f fps" % [
			mode, _idx + 1, SHOT_NAMES.size(), SHOT_NAMES[_idx], look, fps]
	return "AUREOLE 光晕中庭 — [%s] %s  |  WASD 移动 · Q/E 升降 · 滚轮调速 %.1f m/s · Shift×4 · 1-5 机位 · T 巡游  |  %.1f fps" % [
		mode, look, _fly_speed, fps]
