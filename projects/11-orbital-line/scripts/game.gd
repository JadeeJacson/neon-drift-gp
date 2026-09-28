extends Node3D

# 装配层：把 sim 接到真实渲染 / 输入 / HUD。
# 分工：sim 跑逻辑（固定 tick），这里只做「把状态画出来」和「把玩家意图喂进去」。

const CELL: float = 4.0
const W: int = 18
const H: int = 12
const FONT: String = "res://assets/ui/fonts/kenney_kenney-fonts/Fonts/Kenney Future Narrow.ttf"

var sim: MatchSim
var view: WorldView
var cam_rig: Node3D
var camera: Camera3D
var acc: float = 0.0
var speed_idx: int = 0  # 0=1x 1=2x 2=3x
var speeds: Array = [1.0, 2.0, 3.0]
var paused: bool = false
var selected: int = 0
var hover: Vector2i = Vector2i(-1, -1)
var cam_yaw: float = 0.0
var cam_dist: float = 34.0
var _font: FontFile
var _hud: CanvasLayer
var _top: Label
var _toast: Label
var _toast_t: float = 0.0
var _buttons: Array = []
var _panel: PanelContainer
var _panel_label: Label


func _ready() -> void:
	_font = load(FONT) as FontFile
	_make_lighting()
	_make_camera()
	_start_match()


func _start_match() -> void:
	sim = MatchSim.new()
	sim.setup(W, H, Vector2i(0, 5), Vector2i(17, 6), randi() % 100000, "human")
	if view == null:
		view = WorldView.new()
		add_child(view)
	else:
		_reset_view()
	view.setup(sim)
	acc = 0.0
	paused = false
	speed_idx = 0
	selected = 0
	_build_hud()
	view.refresh_ground()


func _reset_view() -> void:
	for u in view.enemy_nodes.keys():
		var rec: Dictionary = view.enemy_nodes[u] as Dictionary
		var n: Node3D = rec["root"] as Node3D
		if is_instance_valid(n):
			n.queue_free()
	view.enemy_nodes.clear()
	for k in view.tower_nodes.keys():
		var r2: Dictionary = view.tower_nodes[k] as Dictionary
		var n2: Node3D = r2["root"] as Node3D
		if is_instance_valid(n2):
			n2.queue_free()
	view.tower_nodes.clear()
	for t in view.tiles:
		var mi: MeshInstance3D = t as MeshInstance3D
		if is_instance_valid(mi):
			mi.queue_free()
	view.tiles.clear()


func _make_lighting() -> void:
	# 第一版只放了方向光 + 程序化天空，制作人反馈「画面氛围完全没有」——
	# 根因是**后处理一项没开**（无 glow、无 tonemap、雾太弱）+ 场景里没有任何装饰件。
	# 这一版补齐：ACES 色调映射 + 辉光 + SSAO + 体积感雾 + 三点光照。
	var sun: DirectionalLight3D = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48.0, 38.0, 0.0)
	sun.light_energy = 2.4
	sun.light_color = Color(1.0, 0.94, 0.86)
	sun.shadow_enabled = true
	sun.shadow_blur = 1.2
	sun.directional_shadow_max_distance = 140.0
	add_child(sun)

	# 冷色补光（来自天空方向），让背光面不是死黑
	var fill: DirectionalLight3D = DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-25.0, -150.0, 0.0)
	fill.light_energy = 0.75
	fill.light_color = Color(0.55, 0.72, 1.0)
	add_child(fill)

	# 底部反弹光，压掉阴影里的纯黑
	var bounce: DirectionalLight3D = DirectionalLight3D.new()
	bounce.rotation_degrees = Vector3(70.0, 20.0, 0.0)
	bounce.light_energy = 0.28
	bounce.light_color = Color(0.35, 0.45, 0.6)
	add_child(bounce)

	var env: WorldEnvironment = WorldEnvironment.new()
	var e: Environment = Environment.new()
	e.background_mode = Environment.BG_SKY
	var sky: Sky = Sky.new()
	var mat: ProceduralSkyMaterial = ProceduralSkyMaterial.new()
	mat.sky_top_color = Color(0.02, 0.04, 0.11)
	mat.sky_horizon_color = Color(0.22, 0.40, 0.58)
	mat.sky_curve = 0.15
	mat.ground_bottom_color = Color(0.02, 0.03, 0.05)
	mat.ground_horizon_color = Color(0.12, 0.18, 0.26)
	sky.sky_material = mat
	e.sky = sky

	e.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	e.ambient_light_sky_contribution = 1.0
	e.ambient_light_energy = 0.55

	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	e.tonemap_exposure = 1.15
	e.tonemap_white = 1.6

	e.glow_enabled = true
	e.glow_intensity = 0.75
	e.glow_hdr_threshold = 0.85
	e.glow_bloom = 0.35
	e.glow_hdr_luminance_cap = 12.0
	e.glow_blend_mode = Environment.GLOW_BLEND_MODE_SOFTLIGHT

	e.ssao_enabled = true
	e.ssao_intensity = 1.4
	e.ssao_radius = 1.2
	e.ssao_light_affect = 0.35

	e.fog_enabled = true
	e.fog_light_color = Color(0.14, 0.24, 0.38)
	e.fog_light_energy = 0.9
	e.fog_density = 0.020
	e.fog_aerial_perspective = 0.65
	e.fog_sky_affect = 0.25
	env.environment = e
	add_child(env)


func _make_camera() -> void:
	cam_rig = Node3D.new()
	cam_rig.position = Vector3(float(W) * CELL * 0.5, 0.0, float(H) * CELL * 0.5)
	add_child(cam_rig)
	camera = Camera3D.new()
	cam_rig.add_child(camera)
	_apply_camera()


func _apply_camera() -> void:
	# 相机是 rig 的子节点：rig 负责 yaw 与地图中心偏移，相机只保留俯角与距离。
	# 这里**不能**用 look_at(世界原点)——rig 已经偏移到地图中心，那样会看向场外。
	cam_rig.position = Vector3(float(W) * CELL * 0.5, 0.0, float(H) * CELL * 0.5)
	cam_rig.rotation_degrees = Vector3(0.0, cam_yaw, 0.0)
	camera.position = Vector3(0.0, cam_dist * 0.78, cam_dist * 0.62)
	camera.rotation_degrees = Vector3(-50.0, 0.0, 0.0)


func _build_hud() -> void:
	if _hud != null and is_instance_valid(_hud):
		_hud.queue_free()
	_hud = CanvasLayer.new()
	add_child(_hud)
	var root: Control = Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_hud.add_child(root)

	_top = Label.new()
	_top.position = Vector2(16, 12)
	_top.add_theme_font_override("font", _font)
	_top.add_theme_font_size_override("font_size", 22)
	_top.add_theme_color_override("font_color", Color(0.85, 0.95, 1.0))
	root.add_child(_top)

	_toast = Label.new()
	_toast.position = Vector2(16, 44)
	_toast.add_theme_font_override("font", _font)
	_toast.add_theme_font_size_override("font_size", 18)
	_toast.add_theme_color_override("font_color", Color(1.0, 0.75, 0.35))
	root.add_child(_toast)

	# 建造栏：5 个塔按钮
	var bar: HBoxContainer = HBoxContainer.new()
	bar.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	bar.position = Vector2(16, -72)
	bar.add_theme_constant_override("separation", 10)
	root.add_child(bar)
	_buttons = []
	for i in range(Defs.TOWER_ORDER.size()):
		var id: String = String(Defs.TOWER_ORDER[i])
		var b: Button = Button.new()
		b.custom_minimum_size = Vector2(150, 52)
		b.add_theme_font_override("font", _font)
		b.add_theme_font_size_override("font_size", 16)
		b.text = "%d %s ¥%d" % [i + 1, String(Defs.TOWERS[id]["name"]), Defs.tower_cost(id, 1)]
		var idx: int = i
		b.pressed.connect(func():
			selected = idx
			_update_hud()
		)
		bar.add_child(b)
		_buttons.append(b)

	_panel = PanelContainer.new()
	_panel.set_anchors_preset(Control.PRESET_CENTER)
	_panel.visible = false
	root.add_child(_panel)
	_panel_label = Label.new()
	_panel_label.add_theme_font_override("font", _font)
	_panel_label.add_theme_font_size_override("font_size", 20)
	_panel.add_child(_panel_label)


func _process(delta: float) -> void:
	if sim == null:
		return
	hover = _cell_under_mouse()
	if hover.x >= 0:
		var ok: bool = sim.grid.can_place(hover.x, hover.y) and not PathFinder.would_block(sim.grid, hover.x, hover.y)
		view.set_hover(hover, ok)

	if not paused and sim.phase != MatchSim.PHASE_WON and sim.phase != MatchSim.PHASE_LOST:
		var scale: float = float(speeds[speed_idx])
		acc += delta * scale
		var guard: int = 0
		while acc >= MatchSim.TICK and guard < 12:
			sim.step(MatchSim.TICK)
			acc -= MatchSim.TICK
			guard += 1
		for ev in sim.drain_events():
			view.fx(ev as Dictionary)
		if sim.grid.at(hover.x, hover.y) == Grid.Cell.EMPTY:
			pass

	view.sync()
	_update_hud()
	if _toast_t > 0.0:
		_toast_t -= delta
		if _toast_t <= 0.0:
			_toast.text = ""
	_apply_shake(delta)
	if view.tiles.size() > 0:
		view.refresh_ground()


func _apply_shake(delta: float) -> void:
	if view == null:
		return
	# 顺序要紧：先复位相机，再加抖动偏移。反过来写的话 _apply_camera 会把偏移覆盖掉，
	# 震屏就完全看不见（这类 bug 在 headless 里永远不会暴露，只能靠推演）。
	cam_rig.rotation_degrees.y = lerpf(cam_rig.rotation_degrees.y, cam_yaw, 1.0 - pow(0.001, delta))
	_apply_camera()
	if view.shake > 0.0:
		var s: float = view.shake
		camera.position += Vector3(
			randf_range(-s, s) * 2.0, randf_range(-s, s) * 2.0, randf_range(-s, s) * 2.0
		)


func _update_hud() -> void:
	if _top == null:
		return
	var phase_txt: String = "建造阶段 %.0fs" % maxf(sim.build_left, 0.0)
	if sim.phase == MatchSim.PHASE_COMBAT:
		phase_txt = "第 %d 波 进行中" % sim.wave
	elif sim.phase == MatchSim.PHASE_WON:
		phase_txt = "胜利"
	elif sim.phase == MatchSim.PHASE_LOST:
		phase_txt = "枢纽失守"
	_top.text = "资源 %d    核心 %d/20    波次 %d/%d    %s    速度 x%.0f%s" % [
		sim.credits, sim.core_hp, sim.wave, Waves.TOTAL, phase_txt,
		float(speeds[speed_idx]), "（暂停）" if paused else "",
	]
	for i in range(_buttons.size()):
		var b: Button = _buttons[i] as Button
		var id: String = String(Defs.TOWER_ORDER[i])
		var afford: bool = sim.credits >= Defs.tower_cost(id, 1)
		b.modulate = Color(1, 1, 1, 1) if afford else Color(0.55, 0.55, 0.6, 1)
		if i == selected:
			b.text = "▶ %d %s ¥%d" % [i + 1, String(Defs.TOWERS[id]["name"]), Defs.tower_cost(id, 1)]
		else:
			b.text = "%d %s ¥%d" % [i + 1, String(Defs.TOWERS[id]["name"]), Defs.tower_cost(id, 1)]
	if sim.phase == MatchSim.PHASE_WON or sim.phase == MatchSim.PHASE_LOST:
		if not _panel.visible:
			_panel.visible = true
			var win: bool = sim.phase == MatchSim.PHASE_WON
			_panel_label.text = ("【%s】\n坚持到第 %d 波    击杀 %d    建塔 %d    漏怪 %d\n用时 %.1f 分钟    剩余核心 %d\n\n按 R 重新开始" % [
				"防线守住" if win else "枢纽失守",
				sim.wave, sim.stats["kills"], sim.stats["built"], sim.stats["leaked"],
				sim.elapsed / 60.0, sim.core_hp,
			])


func _toast_msg(msg: String) -> void:
	if _toast == null:
		return
	_toast.text = msg
	_toast_t = 1.6


func _input(event: InputEvent) -> void:
	if sim == null:
		return
	if event.is_action_pressed("pause"):
		paused = not paused
		if view != null:
			view.play_ui("build")
	elif event.is_action_pressed("speed_toggle"):
		speed_idx = (speed_idx + 1) % speeds.size()
	elif event.is_action_pressed("start_wave"):
		if sim.phase == MatchSim.PHASE_BUILD:
			sim.start_wave(true)
			_toast_msg("提前开波，奖励 +%d" % Economy.early_bonus(sim.build_left))
	elif event.is_action_pressed("ability_orbital"):
		var c: Vector2i = _cell_under_mouse()
		if c.x >= 0 and sim.orbital_strike(float(c.x) + 0.5, float(c.y) + 0.5):
			_toast_msg("轨道炮打击！")
		else:
			_toast_msg("轨道炮冷却中 %.0fs" % sim.ability_cd)
	elif event.is_action_pressed("cam_rotate_left"):
		cam_yaw -= 15.0
	elif event.is_action_pressed("cam_rotate_right"):
		cam_yaw += 15.0
	for i in range(5):
		var action: String = "build_%d" % (i + 1)
		if event.is_action_pressed(action):
			selected = i
	if event is InputEventMouseButton and event.pressed:
		var mb: InputEventMouseButton = event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT:
			_click_primary()
		elif mb.button_index == MOUSE_BUTTON_RIGHT:
			_click_secondary()
		elif mb.button_index == MOUSE_BUTTON_WHEEL_UP:
			cam_dist = maxf(18.0, cam_dist - 3.0)
		elif mb.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			cam_dist = minf(60.0, cam_dist + 3.0)
	if event is InputEventKey and event.pressed:
		var k: InputEventKey = event as InputEventKey
		if k.keycode == KEY_R and (sim.phase == MatchSim.PHASE_WON or sim.phase == MatchSim.PHASE_LOST):
			_start_match()


func _click_primary() -> void:
	var c: Vector2i = _cell_under_mouse()
	if c.x < 0:
		return
	var idx: int = _tower_index_at(c.x, c.y)
	if idx >= 0:
		var t: Dictionary = sim.towers[idx] as Dictionary
		if int(t["level"]) >= Defs.MAX_LEVEL:
			_toast_msg("已是满级")
			view.play_ui("deny")
			return
		var cost: int = Defs.tower_cost(String(t["id"]), int(t["level"]) + 1)
		if sim.credits < cost:
			_toast_msg("升级需要 %d" % cost)
			view.play_ui("deny")
			return
		sim.upgrade(idx)
		_toast_msg("升级完成 -%d" % cost)
		view.play_ui("build")
		return
	var id: String = String(Defs.TOWER_ORDER[selected])
	if not sim.grid.can_place(c.x, c.y):
		_toast_msg("这里不能建造")
		view.play_ui("deny")
		return
	if PathFinder.would_block(sim.grid, c.x, c.y):
		_toast_msg("不能封死通路！")
		view.play_ui("deny")
		return
	if sim.credits < Defs.tower_cost(id, 1):
		_toast_msg("资源不足（需要 %d）" % Defs.tower_cost(id, 1))
		view.play_ui("deny")
		return
	sim.build(c.x, c.y, id)
	view.refresh_ground()
	view.play_ui("build")


func _click_secondary() -> void:
	var c: Vector2i = _cell_under_mouse()
	if c.x < 0:
		return
	var idx: int = _tower_index_at(c.x, c.y)
	if idx < 0:
		selected = (selected + 1) % Defs.TOWER_ORDER.size()
		return
	var t: Dictionary = sim.towers[idx] as Dictionary
	var back: int = Economy.sell_refund(int(t["spent"]))
	sim.sell(idx)
	view.refresh_ground()
	_toast_msg("出售，返还 %d" % back)
	view.play_ui("build")


func _tower_index_at(x: int, y: int) -> int:
	for i in range(sim.towers.size()):
		var t: Dictionary = sim.towers[i] as Dictionary
		if int(t["x"]) == x and int(t["y"]) == y:
			return i
	return -1


func _cell_under_mouse() -> Vector2i:
	if camera == null:
		return Vector2i(-1, -1)
	var vp: Viewport = get_viewport()
	if vp == null:
		return Vector2i(-1, -1)
	var m: Vector2 = vp.get_mouse_position()
	var from: Vector3 = camera.project_ray_origin(m)
	var dir: Vector3 = camera.project_ray_normal(m)
	if absf(dir.y) < 0.0001:
		return Vector2i(-1, -1)
	var t: float = -from.y / dir.y
	if t < 0.0:
		return Vector2i(-1, -1)
	var p: Vector3 = from + dir * t
	var gx: int = int(floor(p.x / CELL))
	var gy: int = int(floor(p.z / CELL))
	if gx < 0 or gy < 0 or gx >= W or gy >= H:
		return Vector2i(-1, -1)
	return Vector2i(gx, gy)
