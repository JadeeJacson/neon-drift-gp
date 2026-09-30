extends Node
class_name LightingRig
## 真 2D 光：CanvasModulate 压暗 + 玩家随身光 + 命中瞬时光闪。
##
## 为什么必须有这一步（制作人 2026-09-27 拍板「模式 2 + 真 2D 光」）：
## 调色实验室的结论是「shader 染色只做到统一，发光感出不来」，
## 因为霓虹的本质是**暗环境里的高亮源**。没有 Light2D，画面永远只是「变蓝了的灰盒」——
## 这正是 06 首轮人验的失分项（「感觉只是一个实验场地盒子」）。

@export var ambient: Color = Color(0.62, 0.68, 0.82)   # 压暗程度：越低越黑。上一版 0.34 被制作人判「太暗」
@export var player_light_radius: float = 150.0
@export var flash_light_radius: float = 84.0

## 光晕贴图 128×128，半径 = 64px × texture_scale。
## 两个坑叠在一起：Light2D 在 4.x **没有可写的 range**；而 `scale` 是从 Node2D 继承的
## **Vector2**，拿 float 去赋会直接编译失败。能控大小的只有 `texture_scale`。
const TEX_HALF := 64.0

var _modulate: CanvasModulate = null
var _player_light: PointLight2D = null
var _flashes: Array[PointLight2D] = []
var _flash_idx := 0
var _light_tex: GradientTexture2D = null
var _lamp_seq := 0


func _ready() -> void:
	_light_tex = _make_radial_texture()
	_modulate = CanvasModulate.new()
	_modulate.name = "CanvasModulate"
	_modulate.color = ambient
	add_child(_modulate)
	for i in 5:
		var l := PointLight2D.new()
		l.name = "Flash%d" % i
		l.texture = _light_tex
		l.mode = Light2D.BLEND_MODE_ADD  # 4.7 里叫 BLEND_MODE_*（MODE_ADD 不存在，用探针查的）
		l.texture_scale = 1.0
		l.height = 0.6
		l.energy = 0.0
		l.visible = false
		add_child(l)
		_flashes.append(l)


func _make_radial_texture() -> GradientTexture2D:
	# 程序生成径向光晕，不依赖外部贴图：省一次素材下载，也不会因为
	# 贴图边缘非透明而在 tile 上留一圈脏边
	var grad := Gradient.new()
	grad.set_color(0, Color(1, 1, 1, 0.95))
	grad.set_color(1, Color(1, 1, 1, 0.0))
	var tex := GradientTexture2D.new()
	tex.gradient = grad
	tex.width = 128
	tex.height = 128
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5, 0.5)
	tex.fill_to = Vector2(0.5, 0.0)
	return tex


var _biome_glow: Color = Color(0.45, 0.92, 1.0)


## 换群系时调整体色调：压暗色（CanvasModulate）+ 随身光颜色。
## 不做这一步，「关卡特异性」只活在贴图里——实测拍出来四个群系是一样的蓝。
## 压暗程度走群系的 ambient（亮度合法性由 Biomes.validate 钉住，不靠直觉）
func set_biome(biome: Dictionary) -> void:
	ambient = biome["ambient"]
	_biome_glow = biome["glow_color"]
	if _modulate != null:
		_modulate.color = ambient
	if _player_light != null:
		_player_light.color = _biome_glow


func ambient_color() -> Color:
	return ambient


func biome_glow() -> Color:
	return _biome_glow


## 把随身光挂到某个节点（玩家）身上。必须在玩家入树后调用。
func attach_to(target: Node2D) -> void:
	if _player_light != null and _player_light.get_parent() != null:
		_player_light.get_parent().remove_child(_player_light)
	_player_light = PointLight2D.new()
	_player_light.name = "PlayerLight"
	_player_light.texture = _light_tex
	_player_light.mode = Light2D.BLEND_MODE_ADD
	_player_light.energy = 1.7
	_player_light.texture_scale = player_light_radius / TEX_HALF
	_player_light.height = 0.75
	_player_light.position = Vector2(0, -12)
	target.add_child(_player_light)


## 场景里的常驻光源（房间灯）。与命中光闪不同：不衰减，一直亮着。
## 「太暗」那条反馈的主因就是全场只有玩家身上一个光源，画面没有亮度锚点。
func add_lamp(at: Vector2, color: Color, radius: float, energy: float) -> PointLight2D:
	var l := PointLight2D.new()
	# 名字要带序号：Godot 要求同胞节点名字唯一，都叫 "Lamp" 会被自动改成 Lamp2/Lamp3…，
	# 按名字统计时就只能数到第一个（本轮的「只有 1 盏灯」就是这么来的）
	l.name = "Lamp%d" % _lamp_seq
	_lamp_seq += 1
	l.texture = _light_tex
	l.mode = Light2D.BLEND_MODE_ADD
	l.color = color
	l.energy = energy
	l.texture_scale = radius / TEX_HALF
	l.height = 0.5
	l.position = at
	add_child(l)
	return l


## 命中/弹反/击杀的光闪：从池里取一个，能量拉满后每帧衰减
func flash_at(world_pos: Vector2, energy: float, radius: float) -> void:
	if _flashes.is_empty():
		return
	_flash_idx = (_flash_idx + 1) % _flashes.size()
	var l := _flashes[_flash_idx]
	l.global_position = world_pos
	l.texture_scale = radius / TEX_HALF
	l.energy = energy
	l.visible = true


func _process(delta: float) -> void:
	for l in _flashes:
		if not l.visible:
			continue
		l.energy = maxf(l.energy - delta * 5.5, 0.0)
		if l.energy <= 0.0:
			l.visible = false


func snapshot() -> Dictionary:
	return {"ambient": ambient, "player_light_radius": player_light_radius,
			"active_flashes": _flashes.filter(func(l): return l.visible).size()}
