extends Node2D
class_name HitFx
## 反馈链的执行体：命中粒子 + 音效 + 震屏 trauma（docs/08 §3.2 反馈链）。
##
## 为什么集中在这里而不是散在各节点：「脆」感的定义就是**同一瞬间**
## 闪白/粒子/音效/震屏一起到位。散着写一定会出现「音效比粒子晚两帧」这种毛病，
## 而这里只有一个入口 play(kind, at)。
##
## 震屏用 trauma 模型（06 已验证）：加数值、每帧平方衰减、取噪声偏移，
## 比直接改相机位置平滑，也不会因为连续命中而跳变。

const KINDS := {
	"swing": {"sfx": ["res://assets/audio/sfx/swing.ogg"], "trauma": 0.12,
			"color": Color(0.6, 0.9, 1.0, 0.9), "count": 6, "speed": 60.0},
	"hit_light": {"sfx": ["res://assets/audio/sfx/hit_medium_00.ogg",
			"res://assets/audio/sfx/hit_medium_01.ogg"], "trauma": 0.26,
			"color": Color(1.0, 0.85, 0.6, 1.0), "count": 12, "speed": 130.0},
	"hit_heavy": {"sfx": ["res://assets/audio/sfx/hit_heavy_00.ogg",
			"res://assets/audio/sfx/hit_heavy_01.ogg"], "trauma": 0.55,
			"color": Color(1.0, 0.6, 0.35, 1.0), "count": 20, "speed": 200.0},
	"parry": {"sfx": ["res://assets/audio/sfx/parry_zap.ogg"], "trauma": 0.7,
			"color": Color(0.45, 1.0, 0.95, 1.0), "count": 26, "speed": 260.0},
	# 前摇预告：不震屏、不抢色，只要一个上行音 + 小光点。
	# 它是「让玩家来得及反应」的信号，不是「打中了」的信号，两者不能混用
	"tell": {"sfx": ["res://assets/audio/sfx/warn.ogg"], "trauma": 0.04,
			"color": Color(1.0, 0.85, 0.3, 0.9), "count": 5, "speed": 40.0},
	"shoot": {"sfx": ["res://assets/audio/sfx/shoot.ogg"], "trauma": 0.1,
			"color": Color(0.5, 1.0, 0.9, 0.9), "count": 6, "speed": 90.0},
	# 弹台：向上的一小抛，不震屏（它是帮助，不是打击）
	"bounce": {"sfx": ["res://assets/audio/sfx/bounce.ogg"], "trauma": 0.12,
			"color": Color(0.55, 1.0, 0.72, 0.9), "count": 10, "speed": 130.0},
	# 成就：只响不抖，带一点金色粒子
	"achieve": {"sfx": ["res://assets/audio/sfx/achieve.ogg"], "trauma": 0.0,
			"color": Color(1.0, 0.86, 0.42, 1.0), "count": 16, "speed": 150.0},
	"kill": {"sfx": ["res://assets/audio/sfx/kill_confirm.ogg"], "trauma": 0.4,
			"color": Color(1.0, 0.4, 0.8, 1.0), "count": 22, "speed": 180.0},
	"hurt": {"sfx": ["res://assets/audio/sfx/hit_heavy_00.ogg"], "trauma": 0.65,
			"color": Color(1.0, 0.3, 0.35, 1.0), "count": 16, "speed": 150.0},
	"deny": {"sfx": ["res://assets/audio/sfx/ui_denied.ogg"], "trauma": 0.0,
			"color": Color(0.5, 0.5, 0.6, 1.0), "count": 0, "speed": 0.0},
	"step": {"sfx": ["res://assets/audio/sfx/step_00.ogg",
			"res://assets/audio/sfx/step_01.ogg"], "trauma": 0.02,
			"color": Color(0.7, 0.8, 0.9, 0.6), "count": 3, "speed": 30.0},
}

const POOL_SIZE := 8

var trauma: float = 0.0
var _pool: Array[CPUParticles2D] = []
var _audio: Array[AudioStreamPlayer] = []
var _streams: Dictionary = {}
var _audio_cursor := 0
var _fx_cursor := 0


func _ready() -> void:
	for kind in KINDS:
		var list: Array = []
		for path in KINDS[kind]["sfx"]:
			var s: AudioStream = load(path)
			if s != null:
				list.append(s)
		_streams[kind] = list
	for i in POOL_SIZE:
		var p := CPUParticles2D.new()
		p.name = "Burst%d" % i
		p.one_shot = true
		p.emitting = false
		p.amount = 24
		p.lifetime = 0.28
		p.explosiveness = 1.0
		p.direction = Vector2(0, -1)
		p.spread = 180.0
		p.gravity = Vector2(0, 420)
		p.initial_velocity_min = 40.0
		p.initial_velocity_max = 200.0
		p.scale_amount_min = 1.0
		p.scale_amount_max = 2.6
		p.z_index = 20
		add_child(p)
		_pool.append(p)
	for i in 6:
		var a := AudioStreamPlayer.new()
		a.bus = &"Master"
		add_child(a)
		_audio.append(a)


## 唯一入口。kind 见 KINDS；找不到 kind 会直接报错——宁可崩在开发期，
## 也不要「反馈没响但没人知道」
func play(kind: String, at: Vector2) -> void:
	if not KINDS.has(kind):
		push_error("HitFx 未知类型：%s" % kind)
		return
	var cfg: Dictionary = KINDS[kind]
	trauma = minf(trauma + float(cfg["trauma"]), 1.0)
	var list: Array = _streams.get(kind, [])
	if not list.is_empty():
		_audio_cursor = (_audio_cursor + 1) % _audio.size()
		var player := _audio[_audio_cursor]
		player.stream = list[randi() % list.size()]
		player.volume_db = -6.0 if kind == "step" else -2.0
		player.play()
	var count: int = int(cfg["count"])
	if count <= 0:
		return
	# 音效与粒子各自一个游标：共用会互相跳号（池子大小不同），
	# 表现为「连着两下命中只响一声」这种难查的手感 bug
	_fx_cursor = (_fx_cursor + 1) % _pool.size()
	var p := _pool[_fx_cursor]
	p.position = at
	p.amount = count
	p.color = cfg["color"]
	p.initial_velocity_min = float(cfg["speed"]) * 0.35
	p.initial_velocity_max = float(cfg["speed"])
	p.restart()


func add_trauma(v: float) -> void:
	trauma = minf(trauma + v, 1.0)


## 相机每帧取这个偏移：trauma 平方 → 小值几乎不抖，大值猛抖，符合手感直觉
func shake_offset() -> Vector2:
	if trauma <= 0.001:
		return Vector2.ZERO
	var t := trauma * trauma
	return Vector2(cos(_seed * 47.0) * t * 7.0, sin(_seed * 61.0) * t * 5.0)


var _seed: float = 0.0


func _process(delta: float) -> void:
	_seed += delta * 9.0
	trauma = maxf(trauma - delta * 1.7, 0.0)
