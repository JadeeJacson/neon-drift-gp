extends CharacterBody2D
class_name EnemyCrawler
## 敌型 1：游荡近战 crawler（docs/08 §3.4）。
##
## 关键设计：**出手前先问玩家的弹反**。tell_frames 是玩家的读条窗，
## 这个「先给前摇、再结算」的顺序是弹反能成立的前提——
## 如果敌人碰到就掉血，玩家永远没有「读招」这件事（sim 里 parry_success 就是为它服务的）。
##
## 死亡必须有可见交代（06 首轮人验的失分项：「敌人死亡只是停住后消失、难判断」）：
## 这里做「闪白 → 后仰 → 下沉 + 缩小 + 发光爆点」，而不是 queue_free 一把梭。

signal died(enemy: Node, reward: Dictionary)
signal hit_taken(enemy: Node, damage: float)
signal tell_started(enemy: Node)
signal attack_resolved(enemy: Node, parried: bool, damage: float)

const T := preload("res://sim/combat_table.gd")
const GRAVITY := 900.0
const TILE := 16
const REPATH_FRAMES := 24     # 每 0.4s 重算一次路径：全重算比维护增量路径简单，十只怪也担得起

## 寻路网格由装配层注入（训练房不注入，保持旧的直线追击，不影响移动冒烟测试）
var nav_grid: NavGrid = null
var _path: Array[Vector2i] = []
var _repath_in := 0

enum S { PATROL, CHASE, TELL, ACTIVE, RECOVER, STUNNED, DYING, DEAD }

@export var enemy_id: String = "crawler"
@export var patrol_dir: float = 1.0

var hp: float = 0.0
var state: S = S.PATROL
var frames_left: int = 0
var stun_left: int = 0
var cooldown: int = 0
var flash: float = 0.0
var is_ranged := false
var _stats: Dictionary = {}
var _sprite: Sprite2D = null
var _neon: ShaderMaterial = null
var _hurtbox: Area2D = null
var _home_x: float = 0.0
var _tell_marker: Polygon2D = null
var _tell_total := 0
var _base_glow := Color(1.0, 0.35, 0.75, 1.0)


func _ready() -> void:
	_stats = T.enemy(enemy_id)
	hp = float(_stats["hp"])
	is_ranged = _stats.has("projectile")
	collision_layer = 4
	collision_mask = 2 | 4
	add_to_group("enemies")
	_home_x = position.x
	_build_body_shape()
	_build_visual()
	_build_hurtbox()
	# 向装配层自注册：动态生成的敌人也能拿到反馈链与奖励结算
	var root := get_tree().get_first_node_in_group("game_root")
	if root != null and root.has_method("register_enemy"):
		root.call("register_enemy", self)


func _build_body_shape() -> void:
	# 上一版漏了这个形状：CharacterBody2D 没有碰撞形就「地板不存在」，
	# 三只初始敌人直接掉出世界（冒烟里看到 d.y = 5064），
	# 而近战高度差判定跟着失效——只跑 --quit 永远看不出来。
	var col := CollisionShape2D.new()
	col.name = "BodyShape"
	var rect := RectangleShape2D.new()
	rect.size = Vector2(14, 26)
	col.shape = rect
	col.position = Vector2(0, -13)
	add_child(col)


func _build_visual() -> void:
	# M2 先用现成帧表占位：近战用品红人、远程用蓝人，颜色+体型让两型能一眼分清
	# （真正的敌型美术在 M4 换，但「两型看起来一样」这个问题现在就顺手解掉）
	var tex: Texture2D = load("res://assets/sprites/virtual_guy_idle.png" if is_ranged
			else "res://assets/sprites/pink_man_idle.png")
	_sprite = Sprite2D.new()
	_sprite.name = "Sprite"
	_sprite.texture = tex
	_sprite.hframes = maxi(int(tex.get_width() / 32.0), 1)
	_sprite.position = Vector2(0, -8)
	_neon = ShaderMaterial.new()
	_neon.shader = load("res://shaders/neon_sprite.gdshader")
	_neon.set_shader_parameter("mode", 2)
	var glow := Color(0.55, 1.0, 0.85, 1.0) if is_ranged else Color(1.0, 0.35, 0.75, 1.0)
	_neon.set_shader_parameter("glow_color", glow)
	_base_glow = glow
	_neon.set_shader_parameter("emissive", 0.14)
	_sprite.material = _neon
	add_child(_sprite)


func _build_hurtbox() -> void:
	_hurtbox = Area2D.new()
	_hurtbox.name = "Hurtbox"
	_hurtbox.collision_layer = 4
	_hurtbox.collision_mask = 0
	var col := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(14, 26)
	col.shape = rect
	col.position = Vector2(0, -13)
	_hurtbox.add_child(col)
	add_child(_hurtbox)
	_build_tell_marker()


## 头顶的「我要出手了」标记：一个尖朝下的三角，前摇期间逐渐变大变红。
## 位置要高于精灵顶部（32px 精灵挂在 y=-8，顶部约 -24），否则三角会压在身体上看不出来
func _build_tell_marker() -> void:
	_tell_marker = Polygon2D.new()
	_tell_marker.name = "TellMarker"
	_tell_marker.visible = false
	_tell_marker.polygon = PackedVector2Array([Vector2(-8, -40), Vector2(8, -40), Vector2(0, -28)])
	_tell_marker.color = Color(1.0, 0.85, 0.25)
	_tell_marker.z_index = 14
	add_child(_tell_marker)


func _physics_process(delta: float) -> void:
	if state == S.DEAD:
		return
	if not is_on_floor():
		velocity.y = minf(velocity.y + GRAVITY * delta, 420.0)
	flash = maxf(flash - delta * 6.0, 0.0)
	if _neon != null:
		_neon.set_shader_parameter("flash", flash)
	match state:
		S.DYING:
			_tick_dying(delta)
			move_and_slide()
			return
		S.STUNNED:
			stun_left -= 1
			velocity.x = move_toward(velocity.x, 0.0, 1200.0 * delta)
			if stun_left <= 0:
				state = S.CHASE
		S.PATROL:
			velocity.x = patrol_dir * float(_stats["speed"]) * 0.45
			if absf(position.x - _home_x) > 60.0:
				patrol_dir = -patrol_dir
			if _player() != null and _in_sight():
				state = S.CHASE
		S.CHASE:
			_tick_chase(delta)
		S.TELL:
			velocity.x = move_toward(velocity.x, 0.0, 900.0 * delta)
			frames_left -= 1
			_update_telegraph()
			if frames_left <= 0:
				state = S.ACTIVE
				frames_left = int(_stats["active_frames"])
				# 伤害在 active 的**起始帧**结算，不是结束帧。这决定了弹反能不能成立：
				# 玩家在前摇里按弹反，窗只能覆盖到攻击判定的那一刻，
				# 如果放到 active 结束后才结算，任何合理的反应时机都会错过窗口。
				_resolve_attack()
				_snap_telegraph_end()
		S.ACTIVE:
			velocity.x = move_toward(velocity.x, 0.0, 900.0 * delta)
			frames_left -= 1
			if frames_left <= 0:
				state = S.RECOVER
		S.RECOVER:
			velocity.x = move_toward(velocity.x, 0.0, 600.0 * delta)
			cooldown -= 1
			if cooldown <= 0:
				state = S.CHASE if _in_sight() else S.PATROL
	move_and_slide()


func _tick_chase(_delta: float) -> void:
	var p := _player()
	if p == null or p.vitals_dead():
		state = S.PATROL
		return
	_update_path(p)
	var dx: float = p.global_position.x - global_position.x
	var dir := signf(dx)
	if not _path.is_empty():
		# 按路径下一个路点走，而不是直接朝玩家——这就是「绕障碍」与「顶墙」的区别
		var next_cell: Vector2i = _path[1] if _path.size() > 1 else _path[0]
		var center_x := (float(next_cell.x) + 0.5) * TILE
		dir = signf(center_x - global_position.x)
		if absf(center_x - global_position.x) < 3.0 and _path.size() > 2:
			_path.remove_at(1)
	elif nav_grid != null and _player_above_reach(p):
		# 确实没有路（玩家在跳不上的台上/沟对面）：退回巡逻，不要顶在墙上抽抽
		state = S.PATROL
		return
	velocity.x = dir * float(_stats["speed"])
	if is_ranged:
		# 远程怪的本职是拉开距离：太近就后撤，否则它会像近战一样贴脸，两型就没区别了
		var pref: float = float(_stats.get("preferred_range", 120.0))
		if absf(dx) < pref * 0.75:
			velocity.x = -dir * float(_stats["speed"])
	if _sprite != null and dir != 0.0:
		_sprite.flip_h = dir < 0.0
	if absf(dx) <= float(_stats["engage_range"]) and cooldown <= 0:
		state = S.TELL
		frames_left = int(_stats["tell_frames"])
		_tell_total = frames_left        # 预告进度条的总长，由 tell_frames 推出来
		cooldown = int(_stats["attack_cooldown_frames"])
		tell_started.emit(self)


## 玩家比自己高很多且无路径：判定为「追不到」
func _player_above_reach(p: Node2D) -> bool:
	return p.global_position.y < global_position.y - TILE * 2


func _cell_of(pos: Vector2) -> Vector2i:
	return Vector2i(int(pos.x / TILE), int(pos.y / TILE))


func _update_path(p: Node2D) -> void:
	if nav_grid == null:
		return
	_repath_in -= 1
	if _repath_in > 0:
		return
	_repath_in = REPATH_FRAMES
	var from_cell: Vector2i = nav_grid.nearest_standable(_cell_of(global_position))
	var to_cell: Vector2i = nav_grid.nearest_standable(_cell_of(p.global_position))
	_path = nav_grid.path_to(from_cell, to_cell)


## 攻击结算：先给玩家弹反的机会，再问无敌帧，最后才掉血。
## 远程型在这一步生成弹丸（而不是掉血），弹丸同样能被弹反——弹反因此有两种标的
func _resolve_attack() -> void:
	var parried := false
	var dealt := 0.0
	var p := _player()
	if p == null:
		return
	if is_ranged:
		var root := get_tree().get_first_node_in_group("game_root")
		if root != null and root.has_method("spawn_projectile"):
			var dir_to_p := signf(p.global_position.x - global_position.x)
			root.call("spawn_projectile", "enemy", global_position + Vector2(dir_to_p * 10.0, -14.0),
					dir_to_p, enemy_id)
		attack_resolved.emit(self, false, 0.0)
		return
	if _in_sight():
		var combat := p.get_node_or_null("Combat")
		if combat != null and combat.has_method("try_defend") and combat.call("try_defend", self):
			parried = true
		else:
			var vitals := p.get_node_or_null("Vitals")
			if vitals != null:
				var landed: bool = vitals.call("take_damage", float(_stats["contact_damage"]), self)
				dealt = float(_stats["contact_damage"]) if landed else 0.0
	attack_resolved.emit(self, parried, dealt)


## 前摇的视觉预告（制作人反馈：「看不到敌人的攻击前摇」）。
## 只靠「它停下来了」根本不够，需要三个同时进行的信号：
## ① 头顶一个逐渐变大的黄色三角；② 身体自发光从前摇开始时的 0.15 爬到出手前的 0.95；
## ③ 后仰蓄力，出手瞬间反向弹回。三者都是时间函数，玩家一眼就能读出「还剩多久打我」
func _update_telegraph() -> void:
	if _tell_total <= 0:
		return
	var t := 1.0 - float(frames_left) / float(_tell_total)   # 0→1，越接近出手越大
	if _tell_marker != null:
		_tell_marker.visible = true
		_tell_marker.scale = Vector2.ONE * lerpf(0.35, 1.25, t)
		_tell_marker.modulate = Color(1.0, 0.85, 0.25).lerp(Color(1.0, 0.35, 0.3), t)
	if _neon != null:
		_neon.set_shader_parameter("emissive", lerpf(0.15, 0.95, t * t))
		_neon.set_shader_parameter("glow_color", Color(1.0, 0.9, 0.35, 1.0))
	if _sprite != null:
		# 后仰：近战向后倾，远程则是「吸气拉长」
		_sprite.rotation = lerpf(0.0, -0.28 if not is_ranged else 0.0, t)
		_sprite.scale = Vector2(lerpf(1.0, 0.82, t), lerpf(1.0, 1.22, t)) if is_ranged else _sprite.scale


## 出手瞬间：闪白 + 恢复体形，让「打到了」这一帧有硬边界
func _snap_telegraph_end() -> void:
	if _tell_marker != null:
		_tell_marker.visible = false
	if _neon != null:
		_neon.set_shader_parameter("flash", 1.0)
		_neon.set_shader_parameter("glow_color", _base_glow)
	if _sprite != null:
		_sprite.rotation = 0.0
		_sprite.scale = Vector2.ONE
	if not is_ranged:
		# 近战扑一步：让前摇的结尾有位移，玩家能靠走位躲开而不只能靠弹反
		velocity.x = _facing_player_dir() * float(_stats["speed"]) * 3.2


func _facing_player_dir() -> float:
	var p := _player()
	if p == null:
		return patrol_dir
	return signf(p.global_position.x - global_position.x)


func _hide_telegraph() -> void:
	if _tell_marker != null:
		_tell_marker.visible = false


func take_hit(damage: float, dir: float, knockback: float) -> void:
	if state == S.DEAD or state == S.DYING:
		return
	hp -= damage
	flash = 1.0
	velocity.x = dir * knockback
	if not is_on_floor():
		velocity.y = minf(velocity.y, -40.0)  # 空中被打会有个小上挑，落地再算
	hit_taken.emit(self, damage)
	if hp <= 0.0:
		_begin_death()
	elif state == S.CHASE or state == S.PATROL:
		state = S.CHASE  # 被打就锁定玩家（受击不硬直，硬直只留给弹反）


func stun(frames: int) -> void:
	if state == S.DEAD or state == S.DYING:
		return
	state = S.STUNNED
	stun_left = frames
	flash = 1.0


func is_stunned() -> bool:
	return state == S.STUNNED


## 给 game_root 的反馈链用：受击瞬间拉满闪白
func set_flash(v: float = 1.0) -> void:
	flash = clampf(v, 0.0, 1.0)
	if _neon != null:
		_neon.set_shader_parameter("flash", flash)


func _begin_death() -> void:
	state = S.DYING
	frames_left = 18
	_hide_telegraph()
	# 倒向「被打飞的方向」，拿不到就用玩家所在侧的反方向
	_fall_dir = -signf(velocity.x) if absf(velocity.x) > 1.0 else (1.0 if _player_side_left() else -1.0)
	velocity.x *= 0.2
	died.emit(self, T.kill_reward(enemy_id))


var _fall_dir: float = 0.0


var _die_t: float = 0.0


func _tick_dying(_delta: float) -> void:
	frames_left -= 1
	_die_t += _delta
	velocity.x = move_toward(velocity.x, 0.0, 800.0 * _delta)
	# 可见交代：后仰 + 下沉 + 缩小，而不是「停住再消失」
	if _sprite != null:
		var t := clampf(_die_t * 3.0, 0.0, 1.0)
		var lean := 1.0 if _fall_dir == 0.0 else _fall_dir
		_sprite.rotation = 0.6 * lean * t
		_sprite.scale = Vector2.ONE * lerpf(1.0, 0.35, t)
		_sprite.position = _sprite.position.lerp(Vector2(_sprite.position.x, 4.0), t * 0.4)
	if frames_left <= 0:
		state = S.DEAD
		_hurtbox.set_deferred("monitoring", false)
		visible = false
		queue_free()


func _player() -> NeonPlayer:
	var n := get_tree().get_first_node_in_group("player")
	return n as NeonPlayer


func _in_sight() -> bool:
	var p := _player()
	if p == null:
		return false
	return absf(p.global_position.x - global_position.x) <= float(_stats["engage_range"]) * 4.0 \
			and absf(p.global_position.y - global_position.y) <= 40.0


func _player_side_left() -> bool:
	var p := _player()
	return p != null and p.global_position.x < global_position.x


func state_name() -> String:
	return S.keys()[state]


func snapshot() -> Dictionary:
	return {"state": state_name(), "hp": hp, "stun": stun_left, "flash": flash}
