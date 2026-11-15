extends Node3D
const PlayerScript = preload("res://player.gd")
const ShipScript = preload("res://ship.gd")
var planets: Array[Dictionary] = [
	{"name":"苔原", "center":Vector3.ZERO, "radius":260.0, "g":8.0, "color":Color("688c72")},
	{"name":"浮砾", "center":Vector3(1100,700,-1800), "radius":95.0, "g":2.4, "color":Color("9aaab8")},
	{"name":"赤岬", "center":Vector3(-2000,-300,-2800), "radius":185.0, "g":6.0, "color":Color("b57751")}]
var player: CharacterBody3D
var ship: RigidBody3D
var hud: Label
var pause_panel: PanelContainer
var target := 1
var testing := false
var test_results: Array[Dictionary] = []

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	testing = "--test" in OS.get_cmdline_user_args()
	setup_inputs()
	setup_world()
	player = CharacterBody3D.new()
	player.set_script(PlayerScript)
	player.world = self
	add_child(player)
	ship = RigidBody3D.new()
	ship.set_script(ShipScript)
	ship.world = self
	add_child(ship)
	reset_camp()
	setup_ui()
	player.camera.make_current()
	if not testing:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	else:
		call_deferred("run_tests")
	if "--capture" in OS.get_cmdline_user_args():
		call_deferred("capture_previews")

func setup_inputs() -> void:
	var bindings := {"forward":KEY_W,"back":KEY_S,"left":KEY_A,"right":KEY_D,"up":KEY_SPACE,"down":KEY_CTRL,"sprint":KEY_SHIFT,"brake":KEY_F,"roll_left":KEY_Q,"roll_right":KEY_Z}
	for name in bindings:
		if not InputMap.has_action(name):
			InputMap.add_action(name)
		var e := InputEventKey.new()
		e.physical_keycode = bindings[name]
		InputMap.action_add_event(name, e)

func setup_world() -> void:
	var env_node := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("050e1b")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("b0c6d5")
	env.ambient_light_energy = 0.65
	env_node.environment = env
	add_child(env_node)
	var light := DirectionalLight3D.new()
	light.rotation_degrees = Vector3(-45, -35, 0)
	light.light_color = Color("ffe5bd")
	light.light_energy = 1.5
	add_child(light)
	for p in planets:
		var body := StaticBody3D.new()
		body.position = p.center
		add_child(body)
		var collider := CollisionShape3D.new()
		var sphere := SphereShape3D.new()
		sphere.radius = p.radius
		collider.shape = sphere
		body.add_child(collider)
		var visual := MeshInstance3D.new()
		var globe := SphereMesh.new()
		globe.radius = p.radius
		globe.height = p.radius * 2
		globe.radial_segments = 64
		globe.rings = 32
		visual.mesh = globe
		var material := StandardMaterial3D.new()
		material.albedo_color = p.color
		material.roughness = 1
		visual.material_override = material
		body.add_child(visual)
	# Sparse original landmarks; detailed web terrain/interiors are not ported here.
	for i in range(12):
		var n := Vector3(sin(i * 2.4) * 0.18, 1, cos(i * 2.4) * 0.18).normalized()
		var marker := MeshInstance3D.new()
		var rock := PrismMesh.new()
		rock.size = Vector3(3, 7, 3)
		marker.mesh = rock
		marker.position = n * 263.5
		marker.quaternion = Quaternion(Vector3.UP, n)
		var m := StandardMaterial3D.new()
		m.albedo_color = Color("375a4b")
		marker.material_override = m
		add_child(marker)

func nearest_planet(at: Vector3) -> Dictionary:
	var best: Dictionary = planets[0]
	var gap := INF
	for p in planets:
		var d: float = at.distance_to(p.center) - p.radius
		if d < gap:
			gap = d
			best = p
	return best

func gravity_at(at: Vector3) -> Vector3:
	var acceleration := Vector3.ZERO
	for p in planets:
		var d: Vector3 = p.center - at
		acceleration += d.normalized() * p.g * p.radius * p.radius / maxf(d.length_squared(), p.radius * p.radius * 0.9)
	return acceleration

func reset_camp() -> void:
	player.set_piloting(false)
	player.position = Vector3(0, 260.04, 0)
	player.basis = Basis.IDENTITY
	player.previous_up = Vector3.UP
	player.pitch = 0
	player.camera.rotation = Vector3.ZERO
	player.velocity = Vector3.ZERO
	ship.piloting = false
	ship.third_person = false
	ship.linear_velocity = Vector3.ZERO
	ship.angular_velocity = Vector3.ZERO
	var n := Vector3(12,260,-16).normalized()
	ship.global_transform = Transform3D(Basis(Quaternion(Vector3.UP,n)), n * 262.7)
	player.camera.make_current()

func interact() -> void:
	if ship.piloting:
		var candidate: Vector3 = ship.global_position + ship.global_basis.x * 6
		var p: Dictionary = nearest_planet(candidate)
		var n: Vector3 = (candidate - p.center).normalized()
		if candidate.distance_to(p.center) < p.radius + 0.1:
			candidate = p.center + n * (p.radius + 0.1)
		player.global_position = candidate
		player.global_basis = Basis(Quaternion(Vector3.UP,n))
		player.previous_up = n
		player.velocity = ship.linear_velocity + ship.angular_velocity.cross(candidate - ship.global_position)
		player.set_piloting(false)
		ship.piloting = false
		player.camera.make_current()
	elif player.global_position.distance_to(ship.global_position) < 9:
		player.set_piloting(true)
		ship.piloting = true
		ship.cockpit.make_current()

func setup_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var font := SystemFont.new()
	font.font_names = PackedStringArray(["Noto Sans CJK SC", "Noto Sans SC", "Microsoft YaHei", "Arial"])
	hud = Label.new()
	hud.position = Vector2(28,24)
	hud.add_theme_font_override("font",font)
	hud.add_theme_font_size_override("font_size",18)
	layer.add_child(hud)
	wrap_label(hud, layer, Vector2(16,12))
	var controls := Label.new()
	controls.position = Vector2(28,690)
	controls.text = "WASD 移动/推进 · Space/Ctrl 升降 · E 登船/出舱 · F 减速\nV 驾驶视角 · Q/Z 滚转 · T 导航目标 · R 返回营地 · Esc 暂停\nGodot 核心验证版：静态球体，无网页内容/存档系统。"
	controls.add_theme_font_override("font",font)
	controls.add_theme_font_size_override("font_size",15)
	layer.add_child(controls)
	wrap_label(controls, layer, Vector2(16,676))
	pause_panel = PanelContainer.new()
	pause_panel.position = Vector2(400,270)
	pause_panel.size = Vector2(480,170)
	var pause_text := Label.new()
	pause_text.text = "逐星 · 模拟已暂停\n按 Esc 继续探索"
	pause_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	pause_text.add_theme_font_override("font",font)
	pause_text.add_theme_font_size_override("font_size",24)
	pause_panel.add_child(pause_text)
	layer.add_child(pause_panel)
	pause_panel.hide()
	var reticle := Label.new()
	reticle.text = "·"
	reticle.position = Vector2(636,386)
	reticle.add_theme_font_size_override("font_size",24)
	layer.add_child(reticle)

func _process(_delta: float) -> void:
	if not is_instance_valid(player) or not is_instance_valid(hud):
		return
	var at: Vector3 = ship.global_position if ship.piloting else player.global_position
	var speed: float = ship.linear_velocity.length() if ship.piloting else player.velocity.length()
	var p: Dictionary = nearest_planet(at)
	var target_p: Dictionary = planets[target]
	var dist: float = maxf(0,at.distance_to(target_p.center)-target_p.radius)
	hud.text = "逐星 / GODOT CORE 0.3\n%s · %s\n地表高度 %.1f m　速度 %.1f m/s　引力 %.1f m/s²\n导航 %s / %.0f m" % [p.name,"驾驶" if ship.piloting else "徒步",maxf(0,at.distance_to(p.center)-p.radius),speed,gravity_at(at).length(),target_p.name,dist]

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		match event.physical_keycode:
			KEY_ESCAPE:
				get_tree().paused = not get_tree().paused
				pause_panel.visible = get_tree().paused
				Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if get_tree().paused else Input.MOUSE_MODE_CAPTURED
			KEY_E:
				if not get_tree().paused: interact()
			KEY_V:
				if ship.piloting and not get_tree().paused: ship.switch_view()
			KEY_T:
				target = (target + 1) % 3
			KEY_R:
				if not get_tree().paused: reset_camp()

func frames(count: int) -> void:
	for i in range(count):
		await get_tree().physics_frame

func record(name: String, passed: bool, detail: String) -> void:
	test_results.append({"name":name,"pass":passed,"detail":detail})
	print("TEST ",name," ",passed," ",detail)

func run_tests() -> void:
	await frames(240)
	record("standing", absf(player.position.length()-260) < 0.3, str(player.position))
	player.test_walk = true
	await frames(20000)
	player.test_walk = false
	var n: Vector3 = player.position.normalized()
	record("walk_across_south_pole",player.position.y < -240 and player.global_basis.y.dot(n) > 0.999 and absf(player.position.length()-260) < 0.3,str({"pos":player.position,"basis_y":player.global_basis.y,"basis_z":player.global_basis.z,"up":player.previous_up,"velocity":player.velocity,"floor":player.is_on_floor(),"height":player.position.length()-260}))
	player.test_walk = true
	await frames(20000)
	player.test_walk = false
	record("complete_spherical_loop",player.position.y>240 and player.global_basis.y.dot(player.position.normalized())>0.999 and absf(player.position.length()-260)<0.3,str(player.position))
	reset_camp()
	await frames(120)
	player.position = ship.position + Vector3(4,0,0)
	interact()
	record("enter_ship",ship.piloting,"E interaction path")
	ship.test_lift = true
	await frames(600)
	ship.test_lift = false
	var height: float = ship.position.length()-260
	record("five_second_lift",height>80,str(height))
	await frames(120)
	record("inertia",ship.linear_velocity.length()>5,str(ship.linear_velocity.length()))
	for p in planets:
		ship.global_transform = Transform3D(Basis.IDENTITY,p.center+Vector3(0,p.radius+12,0))
		ship.linear_velocity = Vector3(0,-3,0)
		ship.angular_velocity = Vector3.ZERO
		await frames(1600)
		var h: float = ship.position.distance_to(p.center)-p.radius
		record("land_"+p.name,h>2.3 and h<3.1,str(h))
	interact()
	record("exit_ship",not ship.piloting,"E exit path")
	get_tree().paused = true
	var pause_at := ship.global_position
	for i in range(30):
		await get_tree().process_frame
	record("pause_freezes_simulation",ship.global_position.distance_to(pause_at)<0.001,str(ship.global_position.distance_to(pause_at)))
	get_tree().paused = false
	var all_pass := true
	for r in test_results:
		if not r["pass"]: all_pass = false
	var out := FileAccess.open("res://test-results.json",FileAccess.WRITE)
	out.store_string(JSON.stringify({"engine":Engine.get_version_info().string,"results":test_results},"\t"))
	out.close()
	get_tree().quit(0 if all_pass else 1)

func capture_previews() -> void:
	await frames(60)
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://preview-ground.png")
	player.position = ship.position + Vector3(4,0,0)
	interact()
	await frames(30)
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://preview-cockpit.png")
	ship.switch_view()
	await frames(30)
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://preview-ship.png")
	get_tree().paused = true
	pause_panel.show()
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png("res://preview-pause.png")
	get_tree().quit()

func wrap_label(label: Label, layer: CanvasLayer, at: Vector2) -> void:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.035,0.09,0.12,0.92)
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	panel.add_theme_stylebox_override("panel",style)
	panel.position = at
	layer.add_child(panel)
	label.reparent(panel)
	label.position = Vector2.ZERO
