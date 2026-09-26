extends Node
class_name CameraShake
## 震屏与命中顿帧（hitstop）。挂在 Camera 的**子节点**上。
##
## 为什么必须走 Camera.position 而不是旋转或整棵相机链：
## 模板 camera_script.gd 挂在 CameraHolder 上，每帧写自己的 rotation.x/z（俯仰与 tilt）
## 并钳制 camera.rotation.x、维护 camera.fov。**唯一从不被模板触碰的是 camera.position**，
## 所以偏移只有落在这里才不会每帧被覆写——这是读源码确认的，不是试出来的。
##
## trauma 模型：位移幅度 = trauma²。平方让「小反馈」几乎不可察、而「大反馈」足够狠，
## 避免连射时画面一直在微抖（ULTRAKILL/Severed Steel 的常见做法）。

const MAX_OFFSET := Vector2(0.09, 0.07)  # 米；trauma=1 时的最大偏移
const MAX_FOV_KICK := 6.0
const HITSTOP_TIME_SCALE := 0.02
const RESIDUAL_EPSILON := 0.0001

@export var trauma_decay: float = 3.2
## hitstop 会动 Engine.time_scale，属于全局效果。默认关，等你实跑觉得值再开——
## 第三方控制器的状态计时全部依赖 delta，全局缩放是否影响手感必须人验（docs/06 §7）。
@export var hitstop_enabled: bool = false

var _trauma: float = 0.0
var _camera: Camera3D
var _base_position: Vector3
var _base_fov: float = 90.0
var _time: float = 0.0
var _hitstop_until: float = 0.0


func _ready() -> void:
	_camera = get_parent() as Camera3D
	assert(_camera != null, "CameraShake 必须直接挂在 Camera3D 下")
	_base_position = _camera.position
	_base_fov = _camera.fov
	add_to_group("shaker")


func _process(delta: float) -> void:
	_time += delta
	if _trauma <= 0.0:
		return
	_trauma = maxf(0.0, _trauma - trauma_decay * delta)
	if _trauma <= RESIDUAL_EPSILON:
		_trauma = 0.0
		_camera.position = _base_position  # 精确归零，避免残留偏移累积
		return
	var amp := _trauma * _trauma
	# 两个不同频率的正弦叠加，比纯随机更像「弹性」而不是「噪点」。
	# 注意：GDScript 不做 Vector2→Vector3 隐式升位，必须显式构造 Vector3。
	_camera.position = _base_position + Vector3(
		sin(_time * 61.3) * MAX_OFFSET.x * amp,
		sin(_time * 47.9 + 1.3) * MAX_OFFSET.y * amp,
		0.0
	)


## amount 取值 0..1（会被夹住）。fov_kick 给开火用，让镜头「往后顶一下」。
func kick(amount: float, fov_kick: float = 0.0) -> void:
	_trauma = minf(1.0, _trauma + amount)
	if fov_kick <= 0.0 or _camera == null:
		return
	# 目标值必须相对 _base_fov 计算：直接读当前 fov 会把上一次还没跑完的kick量当成基准，
	# 连射时 FOV 会一路漂高（模板自己只在 zoom 时动 fov，不会替我们复位）。
	var peak := clampf(_base_fov + fov_kick, _base_fov, _base_fov + MAX_FOV_KICK)
	var t := create_tween()
	t.tween_property(_camera, "fov", peak, 0.04)
	t.tween_property(_camera, "fov", _base_fov, 0.12)


## 命中顿帧：极短时间把全局时间压到近停，让「打到了」这件事被看见。
func hitstop(duration: float = 0.05) -> void:
	if not hitstop_enabled:
		return
	var now := Time.get_ticks_msec() / 1000.0
	if now < _hitstop_until:
		return  # 已在顿帧中，不叠加
	_hitstop_until = now + duration
	Engine.time_scale = HITSTOP_TIME_SCALE
	# 第 4 个参数 ignore_time_scale：timer 若按缩放后时间走，0.05s 会被拖成 2.5s 的停顿
	var timer := get_tree().create_timer(duration, true, false, true)
	timer.timeout.connect(_restore_time_scale)


func _restore_time_scale() -> void:
	Engine.time_scale = 1.0


## 供冒烟测试读取，不给外部改。
func trauma_for_test() -> float:
	return _trauma
