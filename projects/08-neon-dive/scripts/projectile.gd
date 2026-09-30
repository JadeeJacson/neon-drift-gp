extends Node2D
class_name Projectile
## 投射物：玩家飞鳌与 spitter 的毒刺共用一套。
##
## 两个刻意的实现选择：
## 1. **不用 Area2D**。近战判定那轮已经证明「同帧启用形状 + 查重叠」不可靠（区缓存只在
##    物理步末尾刷新），弹丸速度快更容易漏，所以这里每帧自己做几何检测；
## 2. **阻挡查询复用 NavGrid**：网格已经知道哪些格是实心、哪些是单向台。
##    单向台不该挡住弹道（它是薄台），所以只有 SOLID 才算墙。

signal hit_something(target: Node, damage: float)
signal blocked

const TILE := 16.0

var dir: float = 1.0
var speed: float = 300.0
var damage: float = 20.0
var radius: float = 5.0
var frames_left: int = 90
var owner_kind: String = "player"     # "player" | "enemy"
var reflected := false
var grid: NavGrid = null

var _sprite: Sprite2D = null
var _host: Node = null


## 从 host（一般是 game_root 或敌人）生成一枚弹丸
static func spawn(host: Node, at: Vector2, facing: float, spec: Dictionary,
		owner_side: String, grid_ref: NavGrid) -> Projectile:
	var p := Projectile.new()
	p.name = "Proj"
	p.position = at
	p.dir = facing
	p.speed = float(spec["speed"])
	p.damage = float(spec["damage"])
	p.radius = float(spec.get("radius", 5.0))
	p.frames_left = int(spec["lifetime_frames"])
	p.owner_kind = owner_side
	p.grid = grid_ref
	p._host = host
	host.add_child(p)
	return p


func _ready() -> void:
	z_index = 8
	# 入组才能被冒烟测试找到（验证反射后归属翻转），也方便以后做弹道上限管理
	add_to_group("projectiles")
	_sprite = Sprite2D.new()
	_sprite.name = "Body"
	_sprite.texture = _dot_texture()
	_sprite.scale = Vector2(0.7, 0.7)
	_sprite.modulate = Color(0.5, 1.0, 0.9) if owner_kind == "player" else Color(1.0, 0.45, 0.75)
	var mat := ShaderMaterial.new()
	mat.shader = load("res://shaders/neon_sprite.gdshader")
	mat.set_shader_parameter("mode", 0)
	mat.set_shader_parameter("emissive", 1.1)   # 弹丸必须自发光：暗环境里看不见就等于没有
	_sprite.material = mat
	add_child(_sprite)


var _tex: Texture2D = null


func _dot_texture() -> Texture2D:
	if _tex != null:
		return _tex
	var img := Image.create(8, 8, false, Image.FORMAT_RGBA8)
	# 圆一点的小点：方形弹丸在像素画里看着像 bug
	for y in 8:
		for x in 8:
			var d := Vector2(x - 3.5, y - 3.5).length()
			img.set_pixel(x, y, Color(1, 1, 1, 1.0 if d < 3.6 else 0.0))
	_tex = ImageTexture.create_from_image(img)
	return _tex


func _physics_process(delta: float) -> void:
	frames_left -= 1
	if frames_left <= 0:
		_despawn()
		return
	position.x += dir * speed * delta
	# 拖尾：越飞越小，给速度感（不需要真粒子，省一堆节点）
	_sprite.scale = _sprite.scale * 0.985

	if _check_targets():
		return
	if _hits_wall():
		blocked.emit()
		_despawn()


## 命中检测：玩家弹丸找敌人，敌人弹丸找玩家（并且给弹反机会）
func _check_targets() -> bool:
	if owner_kind == "player":
		for n in get_tree().get_nodes_in_group("enemies"):
			var e := n as Node2D
			if e == null or not _in_range(e.global_position):
				continue
			if e.has_method("take_hit"):
				# 反射过的弹丸伤害已在弹反那一刻按表乘好了，这里不再乘一遍
				e.call("take_hit", damage, dir, 40.0)
			hit_something.emit(e, damage)
			_despawn()
			return true
		return false
	var p := get_tree().get_first_node_in_group("player") as Node2D
	if p == null or not _in_range(p.global_position):
		return false
	var combat := p.get_node_or_null("Combat")
	if combat != null and combat.has_method("try_defend_projectile") \
			and bool(combat.call("try_defend_projectile", self)):
		return false        # 被弹反：弹丸继续活着，只是换了主人
	var vitals := p.get_node_or_null("Vitals")
	if vitals != null:
		vitals.call("take_damage", damage, self)
	hit_something.emit(p, damage)
	_despawn()
	return true


func _in_range(target: Vector2) -> bool:
	return global_position.distance_to(target) <= radius + 12.0


## 单向台不挡弹道，只有实心格挡
func _hits_wall() -> bool:
	if grid == null:
		return false
	var cell := Vector2i(int(global_position.x / TILE), int(global_position.y / TILE))
	return grid.kind_at(cell) == NavGrid.SOLID


func _despawn() -> void:
	if _host == null or not is_inside_tree():
		queue_free()
		return
	queue_free()
