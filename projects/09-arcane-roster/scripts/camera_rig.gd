extends Node3D
class_name CameraRig
## 斜俯视相机：**鼠标拖动旋转 + 滚轮缩放**，Q/E 与拖动等效（键盘是备份，手柄/无鼠标时仍可用）。
##
## 为什么默认 yaw=0 时相机在 +Z 侧：关卡的装饰物摆放规则依赖这一点
## （z>0 一侧不放高于地面的东西，见 tools/build_arena.gd 的文件头注释）。
## 改默认朝向的话，记得同步改那条规则。
##
## 震屏用「trauma 累加 + 每帧衰减」的平方曲线，而不是随机偏移：
## 平方让小 trauma 几乎不抖、大 trauma 抖得厉害，这样「暴击」和「普通命中」
## 能在**没有音效辅助**的情况下也读得出来（06 的 DoD 第 3 条的同类要求）。
## 方法论沿用 06，代码是重写的。

const TRAUMA_DECAY := 1.8
const SHAKE_POS := 0.42
const SHAKE_ROT := 1.6
const YAW_STEP := PI / 2.0          # Q/E 一次转 90°
const DRAG_SENS := 0.006            # 鼠标每像素对应的偏航弧度
const PITCH_MIN := 0.30
const PITCH_MAX := 1.15

@onready var camera: Camera3D = $Camera3D

var _yaw: float = 0.0
var _pitch: float = 0.62
var _distance: float = 17.0
var _trauma: float = 0.0
var _rng := RandomNumberGenerator.new()
var _focus: Vector3 = Vector3.ZERO
var _dragging: bool = false


func _ready() -> void:
	_rng.randomize()
	camera.position = Vector3.ZERO
	camera.rotation_degrees = Vector3(-38.0, 0.0, 0.0)
	_apply()


## Q/E：一次 90°
func orbit(dir: float) -> void:
	_yaw = wrapf(_yaw + dir * YAW_STEP, -PI, PI)
	_apply()


## 鼠标拖动：horizontal → 偏航，vertical → 俯仰（带死区，避免手抖导致镜头漂移）
func drag_orbit(relative: Vector2) -> void:
	if relative.length() < 1.0:
		return
	_yaw = wrapf(_yaw - relative.x * DRAG_SENS, -PI, PI)
	_pitch = clampf(_pitch + relative.y * DRAG_SENS * 0.6, PITCH_MIN, PITCH_MAX)
	_apply()


func set_dragging(on: bool) -> void:
	_dragging = on


func is_dragging() -> bool:
	return _dragging


func zoom(delta: float) -> void:
	_distance = clampf(_distance + delta, 9.0, 34.0)
	_apply()


func set_focus(v: Vector3) -> void:
	_focus = v
	_apply()


## combat 阶段推近 15%，让战斗更有压迫感
func set_combat_mode(on: bool) -> void:
	_distance = 14.5 if on else 17.0
	_pitch = 0.55 if on else 0.62
	_apply()


func add_trauma(amount: float) -> void:
	_trauma = clampf(_trauma + amount, 0.0, 1.0)


func _process(delta: float) -> void:
	if _trauma > 0.0:
		_trauma = maxf(0.0, _trauma - TRAUMA_DECAY * delta)
		var s := _trauma * _trauma
		camera.h_offset = _rng.randf_range(-SHAKE_POS, SHAKE_POS) * s
		camera.v_offset = _rng.randf_range(-SHAKE_POS, SHAKE_POS) * s
		camera.rotation.z = deg_to_rad(_rng.randf_range(-SHAKE_ROT, SHAKE_ROT) * s)
	elif camera.h_offset != 0.0 or camera.v_offset != 0.0:
		camera.h_offset = 0.0
		camera.v_offset = 0.0
		camera.rotation.z = 0.0


func _apply() -> void:
	var h := sin(_pitch) * _distance
	var y := cos(_pitch) * _distance
	global_position = _focus
	camera.position = Vector3(sin(_yaw) * h, y, cos(_yaw) * h)
	camera.rotation = Vector3(-_pitch, _yaw, 0.0)
