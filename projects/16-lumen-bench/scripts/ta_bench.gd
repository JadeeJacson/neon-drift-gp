# 16 · LUMEN BENCH —— Godot 4.7.2 技术美术（TA）渲染上限测试场
#
# 场景「沉星观星堂」全部由代码装配：几何走参数曲面（geo_lab），
# 贴图逐像素算（tex_lab），材质与灯光/大气各自成库，本文件只做装配、
# 驱动与测量。三类运行模式：
#   缺省        自由观察（WASD/QE 移动，按住左键拖拽转视角，1–8 跳机位，Tab 换预设）
#   --shot      按机位清单逐个取景、等 SDFGI 收敛后截图，截完退出
#   --bench     固定机位空跑采样帧率与绘制统计，输出一行性能数据
# 关键日志都以 TA16 开头，便于 grep；断言口径见 README 的「验证」一节。
extends Node3D

const Layout := preload("res://scripts/layout.gd")
const Geo := preload("res://scripts/geo_lab.gd")
const TexLab := preload("res://scripts/tex_lab.gd")
const MatLab := preload("res://scripts/mat_lab.gd")
const Hall := preload("res://scripts/hall_builder.gd")
const Props := preload("res://scripts/props_builder.gd")
const Lights := preload("res://scripts/lights_lab.gd")
const Atmos := preload("res://scripts/atmos_lab.gd")
const Rig := preload("res://scripts/camera_rig.gd")

const SEED := 20260928
# 机位切换后等待收敛的物理帧数：SDFGI 要重新注入、自动曝光要适应、体积雾时域重投影要稳定
const SETTLE_PHYSICS_FRAMES := 110
const BENCH_SAMPLE_FRAMES := 180

var env: Environment
var world_env: WorldEnvironment
var cam: Camera3D
var attrs: Resource
var lights: Dictionary = {}
var props: Dictionary = {}
var rings: Array = []
var candle_lights: Array = []
var hud: Label
var post_rect: ColorRect

var preset := "cine"
# 4.7 实测：adjustment_color_correction 吃 Texture2D，但 2D tile 版式（4×4/8×8）
# 的 identity 图都不是恒等映射，说明引擎期望的排布与常见工具链不同；
# 在没把握之前默认不用 LUT，分级交给 adjustment 标量 + 后期 pass（见 README）。
var lut_mode := "off"
var cam_kind := "practical"
var mode := "look"
var max_views := 99
var debug_wall := "none"
var debug_draw := "none"
var show_hud := true
var start_view := 0
var out_dir := ""
var view_index := 0
var settle_left := 0
var captured := 0
var sample_left := 0
var sample_fps := 0.0
var sample_draw := 0.0
var sample_prim := 0.0
var sample_objs := 0.0
var phys_frame := 0
var mat_count := 0


func _ready() -> void:
	var t0 := Time.get_ticks_msec()
	_parse_args()
	var mats: Dictionary = MatLab.build(SEED)
	mat_count = mats.size()
	var hall_stats: Dictionary = Hall.build(self, mats)
	if debug_wall != "none":
		# 诊断用：把墙换成一个不带任何贴图/三向投影的纯红材质，
		# 区分「节点未被绘制」与「材质/渲染属性导致看不见」
		var w := _find_node(self, "Wall") as MeshInstance3D
		if w != null:
			var plain := StandardMaterial3D.new()
			plain.albedo_color = Color(1.0, 0.05, 0.05)
			plain.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
			if debug_wall == "nocull":
				# 最后一层隔离：关掉背面剔除。如果这样墙就出现，问题在顶点绕序/剔除方向
				plain.cull_mode = BaseMaterial3D.CULL_DISABLED
			w.material_override = plain
			w.extra_cull_margin = 100.0
			print("TA16 DEBUGWALL on visible=%s layers=%d aabb=%s tris=%d" % [
				str(w.visible), w.layers, str(w.get_aabb()), Geo.count_tris(w.mesh)])
			if debug_wall == "box":
				# 进一步隔离：换成引擎基元体，如果连它都不显示，问题在节点/实例而不在网格数据
				var box := BoxMesh.new()
				box.size = Vector3(8, 12, 0.5)
				w.mesh = box
				w.position = Vector3(0, 6, 11)
				print("TA16 DEBUGWALL 换成 BoxMesh")
			elif debug_wall == "batch":
				# 再隔离一层：同样尺寸、但用单次 param_into 批量生成（无逐格 lambda）
				w.mesh = Geo.test_shell_batched(12.0, 0.0, 12.0, 160, 12)
				w.position = Vector3.ZERO
				print("TA16 DEBUGWALL 换成批量生成的同尺寸壳面 tris=%d" % Geo.count_tris(w.mesh))
	props = Props.build(self, mats, SEED)
	lights = Lights.build(self, mats, SEED)
	var sky: Sky = Atmos.make_sky(SEED)
	env = Atmos.make_environment(sky, SEED)
	Atmos.set_lut(env, lut_mode)
	world_env = WorldEnvironment.new()
	world_env.name = "WorldEnvironment"
	world_env.environment = env
	add_child(world_env)
	Atmos.apply_preset(env, preset)
	Atmos.apply_project_settings(preset)
	_apply_viewport_settings()
	Lights.apply_preset(lights, preset)
	Atmos.make_fog_volumes(self, SEED)
	cam = Rig.make_camera(self)
	attrs = Rig.attach_attributes(cam, cam_kind)
	rings = props.get("rings", [])
	candle_lights = lights.get("candles", [])
	_setup_post()
	_setup_hud()
	_apply_debug_draw()
	print("TA16 BUILD ms=%d mats=%d nodes=%d props_nodes=%d props_tris=%d hall_tris=%d" % [
		Time.get_ticks_msec() - t0, mat_count, int(hall_stats["nodes"]), int(props["nodes"]),
		int(props["tris"]), int(hall_stats["tris"])])
	print("TA16 MODE=%s preset=%s cam=%s lut=%s out=%s" % [mode, preset, cam_kind, lut_mode, out_dir])
	_report_renderer()
	_report_env()
	if mode == "shot" or mode == "bench":
		_go_view(start_view)
	else:
		# 自由观察也得给个起始机位，否则开局卡在坐标原点（天文仪座子里）什么也看不见
		Rig.apply_view(cam, Rig.VIEWS[start_view])


# 运行期能真正生效的是 Viewport 上的这几个开关（ProjectSettings 只是默认值，
# 改了不会重建已存活的根 viewport），所以两边都要写。
func _apply_viewport_settings() -> void:
	var s: Dictionary = Atmos.preset_project_settings(preset)
	var v := get_tree().root
	if v == null:
		return
	v.msaa_3d = int(s["msaa"])
	v.use_taa = bool(s["taa"])
	v.scaling_3d_scale = float(s["scale"])


func _parse_args() -> void:
	var args: PackedStringArray = OS.get_cmdline_user_args()
	for a in args:
		var s := String(a)
		if s == "--shot":
			mode = "shot"
		elif s == "--bench":
			mode = "bench"
		elif s.begins_with("--preset="):
			preset = s.substr(9)
		elif s.begins_with("--lut="):
			lut_mode = s.substr(6)
		elif s.begins_with("--cam="):
			cam_kind = s.substr(6)
		elif s.begins_with("--out="):
			out_dir = s.substr(6)
		elif s.begins_with("--maxviews="):
			max_views = maxi(1, int(s.substr(11)))
		elif s == "--debugwall":
			debug_wall = "mat"
		elif s == "--debugwall=box":
			debug_wall = "box"
		elif s == "--debugwall=batch":
			debug_wall = "batch"
		elif s == "--debugwall=nocull":
			debug_wall = "nocull"
		elif s.begins_with("--debugdraw="):
			debug_draw = s.substr(12)
		elif s == "--nohud":
			show_hud = false
		elif s.begins_with("--view="):
			start_view = maxi(0, int(s.substr(7)))
			max_views = start_view + 1
	if out_dir == "":
		var res_root := ProjectSettings.globalize_path("res://")
		out_dir = res_root + "../../_scratch/ta16"
	DirAccess.make_dir_recursive_absolute(out_dir)


# ── 每物理帧：动画 + 截图/采样状态机（截图驱动必须在物理帧，见路线图 §5.0d）──
func _physics_process(delta: float) -> void:
	phys_frame += 1
	_animate(delta)
	match mode:
		"shot":
			_shot_machine()
		"bench":
			_bench_machine(delta)
		_:
			_free_look(delta)
			if phys_frame % 30 == 0:
				_update_hud()


func _animate(delta: float) -> void:
	for r in rings:
		var node := r as Node3D
		if node == null:
			continue
		var sp: float = float(node.get_meta("speed"))
		node.rotate_y(sp * delta)
	# 烛焰与烛光闪烁：两个不同频率的正弦叠加，避免规则的呼吸感
	var t := float(phys_frame) / 60.0
	for i in candle_lights.size():
		var c := candle_lights[i] as OmniLight3D
		if c == null:
			continue
		var ph: float = float(c.get_meta("phase"))
		c.light_energy = 0.42 + 0.14 * sin(t * 7.3 + ph * 3.1) + 0.07 * sin(t * 17.9 + ph)
	var cs: Array = props.get("candles", [])
	for j in cs.size():
		var cd: Dictionary = cs[j]
		var fl := cd["flame"] as MeshInstance3D
		if fl != null:
			var s := 1.0 + 0.12 * sin(t * 9.1 + float(cd["phase"]) * 2.7)
			fl.scale = Vector3(1.0, s, 1.0)


func _shot_machine() -> void:
	if settle_left > 0:
		settle_left -= 1
		if settle_left == 0:
			_capture_current()
			if captured >= mini(Rig.VIEWS.size(), max_views):
				_finalize()
				return
			_go_view(captured)
		return
	# 等待期间什么都不做，让 GI/曝光收敛


func _go_view(i: int) -> void:
	if i >= mini(Rig.VIEWS.size(), max_views):
		_finalize()
		return
	view_index = i
	var v: Dictionary = Rig.VIEWS[i]
	Rig.apply_view(cam, v)
	settle_left = SETTLE_PHYSICS_FRAMES
	print("TA16 VIEW idx=%d name=%s focal=%s settle=%d note=%s" % [
		i, str(v["name"]), str(v["focal"]), SETTLE_PHYSICS_FRAMES, str(v["note"])])


func _capture_current() -> void:
	var img := get_viewport().get_texture().get_image()
	if img == null or img.is_empty():
		print("TA16 FAIL capture 空图 idx=%d" % view_index)
		return
	var v: Dictionary = Rig.VIEWS[view_index]
	print("TA16 CAM pos=%s rot=%s fov=%.1f attrs=%s" % [str(cam.global_position), str(cam.global_rotation_degrees), cam.fov, cam.attributes.get_class() if cam.attributes != null else "none"])
	var fname := "%s__%s__%s__%s.png" % [str(v["name"]), preset, cam_kind, lut_mode]
	var path := out_dir + "/" + fname
	var err := img.save_png(path)
	if err != OK:
		print("TA16 FAIL save_png err=%d path=%s" % [err, path])
		return
	var st := _image_stats(img)
	var verdict := "OK"
	if float(st["mean"]) < 0.006:
		verdict = "FAIL:全黑"
	if float(st["clip"]) > 0.30:
		verdict = "FAIL:大面积过曝"
	print("TA16 SHOT idx=%d file=%s mean=%.4f p50=%.4f p95=%.4f clip=%.4f dark=%.4f sat=%.4f verdict=%s" % [
		view_index, fname, float(st["mean"]), float(st["p50"]), float(st["p95"]),
		float(st["clip"]), float(st["dark"]), float(st["sat"]), verdict])
	captured += 1


# 像素统计：判断截图是否真的「有内容」，而不是只证明文件生成了
static func _image_stats(img: Image) -> Dictionary:
	if img.get_format() != Image.FORMAT_RGBA8:
		img.convert(Image.FORMAT_RGBA8)
	var w := img.get_width()
	var h := img.get_height()
	var data := img.get_data()
	var n := w * h
	var lums := PackedFloat32Array()
	lums.resize(n)
	var sum := 0.0
	var sat_sum := 0.0
	var clip := 0
	var dark := 0
	for i in n:
		var r := float(data[i * 4]) / 255.0
		var g := float(data[i * 4 + 1]) / 255.0
		var b := float(data[i * 4 + 2]) / 255.0
		var l := 0.2126 * r + 0.7152 * g + 0.0722 * b
		lums[i] = l
		sum += l
		var mx := maxf(maxf(r, g), b)
		var mn := minf(minf(r, g), b)
		sat_sum += 0.0 if mx <= 0.0 else (mx - mn) / mx
		if r >= 0.996 and g >= 0.996 and b >= 0.996:
			clip += 1
		if l < 0.02:
			dark += 1
	lums.sort()
	return {
		"mean": sum / float(n),
		"p50": lums[int(n * 0.5)],
		"p95": lums[int(n * 0.95)],
		"clip": float(clip) / float(n),
		"dark": float(dark) / float(n),
		"sat": sat_sum / float(n),
	}


func _bench_machine(_delta: float) -> void:
	# 收敛等待走物理帧；采样计数走渲染帧（性能样本单本来就是「每秒画了几帧」的事）
	if settle_left > 0:
		settle_left -= 1
		if settle_left == 0:
			sample_left = BENCH_SAMPLE_FRAMES
			sample_fps = 0.0
			sample_draw = 0.0
			sample_prim = 0.0
			sample_objs = 0.0
		return


func _bench_sample() -> void:
	if mode != "bench" or settle_left > 0 or sample_left <= 0:
		return
	sample_left -= 1
	sample_fps += Performance.get_monitor(Performance.TIME_FPS)
	sample_draw += Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
	sample_prim += Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
	sample_objs += Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)
	if sample_left > 0:
		return
	var n := float(BENCH_SAMPLE_FRAMES)
	# Performance 的显存监控返回的是**字节**（实测 7.8e8 量级），不除就是「7 亿 MB」这种废话数字
	var vram_mb := Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED) / (1024.0 * 1024.0)
	var tex_mb := Performance.get_monitor(Performance.RENDER_TEXTURE_MEM_USED) / (1024.0 * 1024.0)
	print("TA16 PERF preset=%s cam=%s fps=%.1f draw=%.0f prim=%.0f objs=%.0f vram=%.0fMB texmem=%.0fMB" % [
		preset, cam_kind, sample_fps / n, sample_draw / n, sample_prim / n, sample_objs / n, vram_mb, tex_mb])
	_capture_current()
	_finalize()


func _free_look(delta: float) -> void:
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		var mv := Input.get_last_mouse_velocity() * delta * 0.0016
		cam.rotate_y(-mv.x)
		cam.rotate_object_local(Vector3.RIGHT, -mv.y)
	var speed := 4.2
	if Input.is_key_pressed(KEY_SHIFT):
		speed = 11.0
	if Input.is_key_pressed(KEY_ALT):
		speed = 1.2
	var mv3 := Vector3.ZERO
	if Input.is_key_pressed(KEY_W):
		mv3 += -Vector3(0, 0, 1)
	if Input.is_key_pressed(KEY_S):
		mv3 += Vector3(0, 0, 1)
	if Input.is_key_pressed(KEY_A):
		mv3 += -Vector3(1, 0, 0)
	if Input.is_key_pressed(KEY_D):
		mv3 += Vector3(1, 0, 0)
	if Input.is_key_pressed(KEY_E):
		mv3 += Vector3(0, 1, 0)
	if Input.is_key_pressed(KEY_Q):
		mv3 += Vector3(0, -1, 0)
	if mv3 != Vector3.ZERO:
		cam.global_position += cam.global_transform.basis * mv3.normalized() * speed * delta
	for i in range(1, Rig.VIEWS.size() + 1):
		if Input.is_key_pressed(KEY_1 + i - 1):
			_go_view(i - 1)
			break


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		var k := event as InputEventKey
		if k.keycode == KEY_TAB:
			_cycle_preset()
		elif k.keycode == KEY_C:
			_report_env()
		elif k.keycode == KEY_P:
			_capture_current()
		elif k.keycode == KEY_ESCAPE:
			get_tree().quit()


func _cycle_preset() -> void:
	var i := Atmos.PRESETS.find(preset)
	i = (i + 1) % Atmos.PRESETS.size()
	preset = String(Atmos.PRESETS[i])
	Atmos.apply_preset(env, preset)
	Atmos.apply_project_settings(preset)
	_apply_viewport_settings()
	Lights.apply_preset(lights, preset)
	settle_left = SETTLE_PHYSICS_FRAMES if mode != "look" else 0
	print("TA16 PRESET -> %s" % preset)
	_report_env()


func _finalize() -> void:
	print("TA16 DONE shots=%d preset=%s out=%s" % [captured, preset, out_dir])
	get_tree().quit(0)


static func _find_node(node: Node, name: String) -> Node:
	for c in node.get_children():
		if String(c.name) == name:
			return c
		var r := _find_node(c, name)
		if r != null:
			return r
	return null


func _apply_debug_draw() -> void:
	var v := get_tree().root
	match debug_draw:
		"wireframe":
			v.debug_draw = Viewport.DEBUG_DRAW_WIREFRAME
		"unshaded":
			v.debug_draw = Viewport.DEBUG_DRAW_UNSHADED
		"overdraw":
			v.debug_draw = Viewport.DEBUG_DRAW_OVERDRAW
		_:
			v.debug_draw = Viewport.DEBUG_DRAW_DISABLED
	print("TA16 DEBUGDRAW=%s" % debug_draw)


func _report_renderer() -> void:
	var driver := RenderingServer.get_current_rendering_driver_name()
	var method := RenderingServer.get_current_rendering_method()
	var rd := RenderingServer.get_rendering_device()
	var dev_name := "n/a"
	if rd != null:
		# 4.7 的 get_device_name() 不收索引参数（传 0 会直接报脚本错），故先探参数个数
		if rd.has_method("get_device_name"):
			dev_name = str(rd.call("get_device_name"))
	print("TA16 RENDERER driver=%s method=%s device=%s scale3d=%s msaa=%s taa=%s dshadow=%s" % [
		driver, method, dev_name,
		str(ProjectSettings.get_setting("rendering/scaling/3d/scale_3d")),
		str(ProjectSettings.get_setting("rendering/anti_aliasing/quality/msaa_3d")),
		str(ProjectSettings.get_setting("rendering/anti_aliasing/quality/use_taa")),
		str(ProjectSettings.get_setting("rendering/lights_and_shadows/directional_shadow/size"))])


func _report_env() -> void:
	var snap: Dictionary = Atmos.snapshot(env)
	var parts: PackedStringArray = []
	for k in snap.keys():
		parts.append("%s=%s" % [String(k), _fmt(snap[k])])
	print("TA16 ENV preset=%s %s" % [preset, " ".join(parts)])


static func _fmt(v: Variant) -> String:
	if v is float:
		return "%.3f" % float(v)
	return str(v)


func _setup_post() -> void:
	var layer := Atmos.make_post_layer()
	add_child(layer)
	var ctrl := layer.get_node_or_null("GradeRect")
	if ctrl is ColorRect:
		post_rect = ctrl as ColorRect
		var sm := post_rect.material as ShaderMaterial
		if sm != null:
			sm.set_shader_parameter("grain_gain", 0.018)
			sm.set_shader_parameter("vignette_gain", 0.40)


func _setup_hud() -> void:
	var layer := CanvasLayer.new()
	layer.name = "Hud"
	layer.layer = 10
	add_child(layer)
	hud = Label.new()
	hud.name = "Stats"
	hud.position = Vector2(14, 12)
	hud.add_theme_font_size_override("font_size", 15)
	hud.add_theme_color_override("font_color", Color(0.92, 0.90, 0.84, 0.92))
	layer.add_child(hud)
	if not show_hud:
		# 出图用的干净版本：只隐藏标签，不改层结构（保证与可玩版同一场景）
		hud.visible = false
		return
	_update_hud()


func _update_hud() -> void:
	if hud == null or not hud.visible:
		return
	var fps := Performance.get_monitor(Performance.TIME_FPS)
	var draw := Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
	var prim := Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
	hud.text = "16 LUMEN BENCH · 沉星观星堂\npreset=%s  cam=%s  lut=%s\nfps %.0f   draw %.0f   tri %.2fM\n1–9 机位 · Tab 换预设 · C 打印参数 · P 截图 · WASD/QE 移动（按住左键转向）" % [
		preset, cam_kind, lut_mode, fps, draw, prim / 1e6]


func _process(_delta: float) -> void:
	_bench_sample()
	if mode == "look" and phys_frame % 6 == 5:
		_update_hud()
