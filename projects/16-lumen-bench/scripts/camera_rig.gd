# 相机与机位：TA 测试的取景清单 + 相机属性（曝光/景深）装配
#
# 每个机位都写清「它要证明什么」，截图与报告按同一编号对应，
# 避免做完测试回看时说不清哪张图在验哪件事。
extends RefCounted

const Layout := preload("res://scripts/layout.gd")

# focal 用 35mm 等效焦距表达（比 fov 度数更贴近摄影直觉），装配时换算成 fov
const VIEWS := [
	{"name": "00_wall_test", "pos": Vector3(0, 1.75, 5.4), "target": Vector3(0.0, 6.5, 12.5), "focal": 24.0,
	"note": "诊断机位：正对完整内壁，用来分离「几何缺失」与「光照问题」"},
	{"name": "01_hall_wide", "pos": Vector3(-4.6, 1.65, 4.6), "target": Vector3(5.0, 6.0, -5.0), "focal": 22.0,
	"note": "对角全景：仍在水面上方的开放区，天文仪居中、列柱/穹顶/彩窗一侧同框"},
	{"name": "02_breach_beam", "pos": Vector3(-4.0, 1.60, -1.0), "target": Vector3(11.0, 3.0, -2.0), "focal": 28.0,
	"note": "破口光束：低角度落日 + 长投影 + 光束里的浮尘"},
	{"name": "03_colonnade_low", "pos": Vector3(7.9, 0.55, 3.1), "target": Vector3(-3.0, 9.0, -2.5), "focal": 20.0,
	"note": "贴水面仰视列柱拱券：湿面反射 + 程序柱式几何 + 三向投影石材"},
	{"name": "04_dome_up", "pos": Vector3(0.0, 1.20, 5.6), "target": Vector3(0.0, 20.5, -0.8), "focal": 18.0,
	"note": "穹顶仰视：共肋藻井 + 圆眼天光 + 曝光适应"},
	{"name": "05_gallery_over", "pos": Vector3(6.2, 9.90, 4.6), "target": Vector3(-1.5, 1.2, -2.0), "focal": 26.0,
	"note": "回廊俯瞰：多层级细节（栏杆/碎石/水面/天文仪同框）"},
	{"name": "06_rose_color", "pos": Vector3(-5.4, 2.30, -4.8), "target": Vector3(10.6, 5.9, 6.0), "focal": 30.0,
	"note": "玫瑰窗：gobo 彩色投影 + glow 溢出 + 彩窗对 GI 的染色"},
	{"name": "07_outward", "pos": Vector3(-2.0, 1.70, 0.4), "target": Vector3(14.0, 3.0, -2.4), "focal": 24.0,
	"note": "由破口向外：混合环境（室内/天空/远山）与雾的纵深衰减"},
	{"name": "08_orrery_detail", "pos": Vector3(3.4, 2.90, 3.2), "target": Vector3(0.0, 2.9, 0.0), "focal": 40.0,
	"note": "近景细节：黄铜/自发光核心/景深"},
]


static func make_camera(parent: Node) -> Camera3D:
	var cam := Camera3D.new()
	cam.name = "BenchCamera"
	# 4.7 没有 maintain_aspect_ratio（旧属性已移除），宽高比由 keep_aspect 控制，默认即可
	cam.near = 0.1
	cam.far = 600.0
	cam.cull_mask = 0xFFFFFFFF
	parent.add_child(cam)
	cam.current = true
	return cam


# 把 35mm 等效焦距换算成 Godot 的垂直/水平 fov（Godot 的 fov 是水平方向）
static func focal_to_fov(focal: float) -> float:
	return rad_to_deg(2.0 * atan(18.0 / maxf(focal, 6.0)))


# 两种相机属性：Practical 有景深，Physical 有真实曝光三要素（4.7 的 Physical 已无 DOF 属性）
static func attach_attributes(cam: Camera3D, kind: String) -> Resource:
	if kind == "physical":
		var ph := CameraAttributesPhysical.new()
		ph.frustum_focal_length = 30.0
		ph.exposure_aperture = 3.5
		ph.exposure_shutter_speed = 1.0 / 60.0
		ph.auto_exposure_enabled = true
		ph.auto_exposure_min_exposure_value = -3.0
		ph.auto_exposure_max_exposure_value = 9.0
		ph.auto_exposure_speed = 0.18
		ph.auto_exposure_scale = 0.72
		ph.frustum_focus_distance = 9.0
		cam.attributes = ph
		return ph
	var pr := CameraAttributesPractical.new()
	pr.auto_exposure_enabled = true
	pr.auto_exposure_min_sensitivity = 40.0
	pr.auto_exposure_max_sensitivity = 1600.0
	pr.auto_exposure_scale = 0.72
	pr.auto_exposure_speed = 0.16
	# 4.7 的 CameraAttributesPractical 只剩单一 dof_blur_amount（旧版 near/far 两个量已合并）
	pr.dof_blur_amount = 0.05
	pr.dof_blur_far_enabled = true
	pr.dof_blur_far_distance = 13.0
	pr.dof_blur_far_transition = 6.0
	pr.dof_blur_near_enabled = true
	pr.dof_blur_near_distance = 2.4
	pr.dof_blur_near_transition = 1.6
	cam.attributes = pr
	return pr


static func apply_view(cam: Camera3D, view: Dictionary) -> void:
	cam.position = view["pos"] as Vector3
	cam.fov = focal_to_fov(float(view["focal"]))
	cam.look_at(view["target"] as Vector3, Vector3.UP)
	# 近距机位收紧景深焦点
	if cam.attributes != null and cam.attributes is CameraAttributesPractical:
		var pr := cam.attributes as CameraAttributesPractical
		var d: float = (view["pos"] as Vector3).distance_to(view["target"] as Vector3)
		pr.dof_blur_near_distance = maxf(0.8, d * 0.55)
		pr.dof_blur_far_distance = d * 1.35
		pr.dof_blur_far_transition = maxf(3.0, d * 0.9)
