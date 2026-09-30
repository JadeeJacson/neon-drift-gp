extends CharacterBody2D
class_name NeonPlayer
## 主角控制器（M1）。CharacterBody2D + move_and_slide，参数全部取自 MovementParams。
##
## 参照：assets/templates/godot-demo-projects/2d/kinematic_character（官方推荐写法），
## 但官方示例是「力 + 阻尼」的车感，横版动作要的是「急停 + 帧窗口」，所以自己写。
##
## 分工线（路线图 §4.3）：这里只做位移与判定，**任何跨帧可比的状态转移都记进 sim 侧的
## 断言口径**（本文件暴露 state()/last_* 给冒烟测试读），不在场景层做逐帧回归。

signal state_changed(state: String)
signal bounced_off(at: Vector2)

enum State { IDLE, RUN, JUMP_UP, FALL, WALL_SLIDE, DASH }

# 写成 preload 而不是 const P := MovementParams：后者在 Godot 4.7 报
# “Assigned value for constant isn't a constant expression”（类名不是常量表达式）。
const P := preload("res://sim/movement_params.gd")

@export var animate: bool = true  # 冒烟测试里关掉表现，只验物理

var _state: State = State.IDLE
var _coyote_frames: int = 0
var _jump_buffer_frames: int = 0
var _air_jumps_left: int = 0
var _dash_frames: int = 0
var _dash_cooldown_frames: int = 0
var _wall_lock_frames: int = 0
var _facing_right: bool = true
var _dash_dir: int = 0
var _sprite: Sprite2D = null

var _sheets := {
	"idle": "res://assets/sprites/ninja_frog_idle.png",
	"run": "res://assets/sprites/ninja_frog_run.png",
	"jump": "res://assets/sprites/ninja_frog_jump.png",
	"fall": "res://assets/sprites/ninja_frog_fall.png",
	"double_jump": "res://assets/sprites/ninja_frog_double_jump.png",
	"wall": "res://assets/sprites/ninja_frog_wall_jump.png",
}
var _anim_frames := {}


func _ready() -> void:
	_air_jumps_left = P.AIR_JUMPS
	collision_layer = 1
	collision_mask = 2
	add_to_group("player")  # 敌人靠这个组找玩家，不拿场景树路径
	_build_collision()
	_build_visual()


## 玩家是否已死（敌人据此停止追击）。用 or_null：冒烟测试里 Vitals 可能还没挂
func vitals_dead() -> bool:
	var v := get_node_or_null("Vitals")
	return v != null and bool(v.dead)


func _build_collision() -> void:
	# 32×32 的精灵四周是透明边，碰撞盒取 12×26：脚底对齐贴图底边往上留 3px
	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(12, 26)
	col.shape = shape
	col.position = Vector2(0, -13)
	add_child(col)


func _build_visual() -> void:
	for key in _sheets:
		var tex: Texture2D = load(_sheets[key])
		_anim_frames[key] = tex
	if _sprite == null and animate:
		_sprite = Sprite2D.new()
		_sprite.name = "Sprite"
		_sprite.texture = _anim_frames["idle"]
		_sprite.hframes = 1
		_sprite.position = Vector2(0, -8)
		_neon = ShaderMaterial.new()
		_neon.shader = load("res://shaders/neon_sprite.gdshader")
		_neon.set_shader_parameter("mode", 2)
		_neon.set_shader_parameter("emissive", 0.10)  # 随身微光：暗环里不能看不见主角
		_sprite.material = _neon
		add_child(_sprite)


var _neon: ShaderMaterial = null


## 受击/命中闪白（0→1），由 game_root 的反馈链写。
## 必须自己衰减：上一版只写不清，玩家被打了以后永久停在粉白色。
func set_flash(v: float) -> void:
	_flash = clampf(v, 0.0, 1.0)
	_write_flash()


var _flash: float = 0.0


func _write_flash() -> void:
	if _neon != null:
		_neon.set_shader_parameter("flash", _flash)


func _process(delta: float) -> void:
	if _flash > 0.0:
		_flash = maxf(_flash - delta * 5.0, 0.0)
		_write_flash()


func facing_dir() -> float:
	return 1.0 if _facing_right else -1.0


func flip_h_visual() -> bool:
	return not _facing_right


func _physics_process(delta: float) -> void:
	if vitals_dead():
		# 死了就不能再动：只剩重力，并且抹掉水平速度。
		# 不这么做的话「掉坑后」玩家还在虚空里能跑能跳，反馈完全对不上（制作人实跑反馈）
		velocity.x = move_toward(velocity.x, 0.0, P.ACCEL * delta)
		if not is_on_floor():
			velocity.y = minf(velocity.y + P.GRAVITY * delta, P.MAX_FALL_SPEED)
		move_and_slide()
		return
	var input_x := Input.get_axis("move_left", "move_right")
	_apply_gravity(delta)
	_handle_wall_state()
	if _dash_frames > 0:
		_tick_dash()
	else:
		_handle_jump(input_x)
		_handle_dash(input_x)
		_apply_horizontal(input_x, delta)
	move_and_slide()
	_handle_platform_contact()
	_advance_state(input_x)
	if _dash_cooldown_frames > 0:
		_dash_cooldown_frames -= 1
	if _wall_lock_frames > 0:
		_wall_lock_frames -= 1


# ---------- 重力 ----------

func _apply_gravity(delta: float) -> void:
	# coyote / 二段跳的重置与递减统一放在 _handle_jump（那里同时管着「落地才回收」），
	# 这里只管重力，别处再算一份就会两套计数打架
	if is_on_floor():
		return
	var g: float = P.GRAVITY
	if velocity.y > 0.0:
		g *= P.FALL_MULTIPLIER
	velocity.y = minf(velocity.y + g * delta, P.MAX_FALL_SPEED)


var _was_on_floor: bool = false
var _bounce_count := 0


## 落地后找到脚下那块平台（可能是 NeonPlatform），把「弹」与「塌」交给平台自己判。
## 不在玩家侧写 if kind == ... ：平台状态属于平台，否则以后多角色踩台要重写
func _handle_platform_contact() -> void:
	var plat := _floor_platform()
	if plat == null:
		return
	plat.player_stood()
	# 弹台：只在「刚落上」那一帧弹，否则会在上面无限弹跳
	if plat.kind == "bounce" and not _was_on_floor and velocity.y >= 0.0:
		velocity.y = -P.JUMP_VELOCITY * plat.bounce_mult
		# 弹跳后回收二段跳与 coyote：不然从弹台上起跳会少一段，高差链条直接断
		_air_jumps_left = P.AIR_JUMPS
		_coyote_frames = P.COYOTE_FRAMES
		_bounce_count += 1
		plat.bounced.emit(plat, self)
		bounced_off.emit(global_position)


## 从本轮滑碰撞里挑出地面（法线向上）那个 body，只认 NeonPlatform
func _floor_platform() -> NeonPlatform:
	if not is_on_floor():
		return null
	for i in get_slide_collision_count():
		var c := get_slide_collision(i)
		if c == null or c.get_normal().y > -0.7:
			continue
		var collider: Object = c.get_collider()
		if collider is NeonPlatform:
			return collider as NeonPlatform
	return null


## 本局被弹台弹起过几次（冒烟测试读它）
func bounce_count() -> int:
	return _bounce_count


## 上一物理帧是否在地面（冒烟测试读它确认「落地」真的发生过）
func grounded_last_frame() -> bool:
	return _was_on_floor


# ---------- 跳跃（coyote + buffer + 二段 + 墙跳） ----------

func _handle_jump(input_x: float) -> void:
	if is_on_floor():
		_coyote_frames = P.COYOTE_FRAMES
		_air_jumps_left = P.AIR_JUMPS
	elif _coyote_frames > 0:
		_coyote_frames -= 1

	if Input.is_action_just_pressed("jump"):
		_jump_buffer_frames = P.JUMP_BUFFER_FRAMES
	elif _jump_buffer_frames > 0:
		_jump_buffer_frames -= 1

	if _jump_buffer_frames <= 0:
		# 松键截断上升 → 短跳（可变跳高的全部秘密就这一行）
		if Input.is_action_just_released("jump") and velocity.y < 0.0:
			velocity.y *= P.JUMP_CUT_RATIO
		return

	var wall_dir := _wall_dir()
	if is_on_floor() or _coyote_frames > 0:
		velocity.y = -P.JUMP_VELOCITY
		_jump_buffer_frames = 0
		_coyote_frames = 0
	elif wall_dir != 0:
		# 墙跳：水平沿 wall_normal 方向（法线本来就指向玩家，即「离开墙面」）。
		# 上一版用输入方向 wall_dir，结果是往墙里顶，vx 被 move_and_slide 抹成 0
		# ——这个 bug 只有真跑物理的冒烟测试能发现。
		var push: float = get_wall_normal().x
		if push == 0.0:
			push = float(-wall_dir)  # 兼容：法线拿不到时退回「反输入方向」
		velocity = Vector2(push * P.WALL_JUMP_VELOCITY.x, -P.WALL_JUMP_VELOCITY.y)
		_wall_lock_frames = P.WALL_LOCK_FRAMES
		_jump_buffer_frames = 0
	elif _air_jumps_left > 0:
		_air_jumps_left -= 1
		velocity.y = -P.JUMP_VELOCITY
		_jump_buffer_frames = 0


# ---------- dash ----------

func _handle_dash(input_x: float) -> void:
	if not Input.is_action_just_pressed("dash") or _dash_cooldown_frames > 0:
		return
	var dir := int(signf(input_x)) if input_x != 0.0 else (1 if _facing_right else -1)
	_dash_frames = P.DASH_FRAMES
	_dash_dir = dir
	_dash_cooldown_frames = P.DASH_COOLDOWN_FRAMES
	# dash 期间把重力关掉，落地判定也交给 _tick_dash 收尾
	velocity.y = 0.0


func _tick_dash() -> void:
	velocity = Vector2(float(_dash_dir) * P.DASH_SPEED, 0.0)
	_dash_frames -= 1
	if _dash_frames <= 0:
		velocity.x *= 0.35  # 冲出结束后掉一大截速度，避免 dash 变成永久加速带


# ---------- 水平与墙面 ----------

func _apply_horizontal(input_x: float, delta: float) -> void:
	if _wall_lock_frames > 0:
		return  # 墙跳后那几帧不给水平控制，手感上表现为「蹬墙出去」而不是「贴墙抖」
	var target := input_x * P.RUN_SPEED
	var fric: float = P.FRICTION_GROUND if is_on_floor() else P.FRICTION_AIR
	if input_x == 0.0:
		var drop := fric * delta
		velocity.x = clampf(velocity.x - drop, 0.0, velocity.x) if velocity.x > 0.0 \
				else clampf(velocity.x + drop, velocity.x, 0.0)
	else:
		velocity.x = move_toward(velocity.x, target, P.ACCEL * delta)
		if input_x > 0.0:
			_facing_right = true
		elif input_x < 0.0:
			_facing_right = false


## 朝推动方向且那侧真有墙时返回 ±1，否则 0。用 wall_normal 判方向，
## 只看 is_on_wall() 会把「背对墙」也算成能蹬墙。
func _wall_dir() -> int:
	if is_on_floor() or not is_on_wall():
		return 0
	var dir := int(Input.get_axis("move_left", "move_right"))
	if dir == 0:
		return 0
	return dir if signf(get_wall_normal().x) == float(-dir) else 0


func _handle_wall_state() -> void:
	if is_on_floor() or not is_on_wall() or velocity.y <= 0.0:
		return
	velocity.y = minf(velocity.y, P.WALL_SLIDE_MAX_FALL)


# ---------- 状态与表现 ----------

func _advance_state(input_x: float) -> void:
	var next := State.IDLE
	if _dash_frames > 0:
		next = State.DASH
	elif is_on_floor():
		next = State.RUN if absf(input_x) > 0.01 else State.IDLE
	elif velocity.y < 0.0:
		next = State.JUMP_UP
	elif _wall_dir() != 0 and velocity.y > 0.0:
		next = State.WALL_SLIDE
	else:
		next = State.FALL
	if next != _state:
		_state = next
		state_changed.emit(state_name())
	_was_on_floor = is_on_floor()
	_update_visual(input_x)


func state_name() -> String:
	return State.keys()[_state]


func state() -> String:
	return state_name()


func _update_visual(input_x: float) -> void:
	if _sprite == null:
		return
	var key := "idle"
	match _state:
		State.IDLE: key = "idle"
		State.RUN: key = "run"
		State.JUMP_UP: key = "jump"
		State.FALL: key = "fall"
		State.WALL_SLIDE: key = "wall"
		State.DASH: key = "double_jump"
	var tex: Texture2D = _anim_frames[key]
	if _sprite.texture != tex:
		_sprite.texture = tex
		_sprite.hframes = maxi(int(tex.get_width() / 32.0), 1)
		_sprite.frame = 0
	_sprite.flip_h = not _facing_right
	if key == "run" or key == "idle":
		_sprite.frame = int(Time.get_ticks_msec() / (80.0 if key == "run" else 220.0)) % maxi(_sprite.hframes, 1)
