extends Node
class_name WaveDirector
## 波次导演：把 sim/wave_table.gd 的计划落成场景里的出怪节奏。
## 编成/预算/存活上限全部来自 sim 层并被断言约束，这里只负责「什么时候生成在哪」。

const ENEMY_SCENES := {
	"drone": "res://scenes/enemies/swarm_drone.tscn",
	"charger": "res://scenes/enemies/charger_melee.tscn",
	"trooper": "res://scenes/enemies/trooper_mech.tscn",
	"heavy": "res://scenes/enemies/heavy_walker.tscn",
}

signal wave_started(index: int, total: int, enemy_count: int)
signal wave_cleared(index: int, bonus_ammo: int)
signal victory
signal defeat
signal alive_changed(alive: int, cap: int)

@export var seed_value: int = 20260926
@export var intermission: float = 6.0

var _waves: Array = []
var _queue: Array[String] = []
var _wave_index: int = -1
var _spawn_points: Array[Node3D] = []
var _alive: int = 0
var _spawn_cursor: int = 0
var _next_spawn_at: float = 0.0
var _interval: float = 1.5
var _cap: int = 6
var _finished: bool = false
var _player_vitals: PlayerVitals


func _ready() -> void:
	add_to_group("wave_director")


## 由主场景调用：给出出怪点容器与玩家，然后开跑。
func setup(spawn_points: Node3D, vitals: PlayerVitals) -> void:
	_player_vitals = vitals
	for child in spawn_points.get_children():
		var m := child as Marker3D
		if m != null and m.name != "player_spawn":
			_spawn_points.append(m)
	assert(not _spawn_points.is_empty(), "没有出怪点，关卡生成脚本没跑？")
	start()


func start() -> void:
	_waves = WaveTable.plan(seed_value)
	_wave_index = -1
	_next_wave()


func _physics_process(delta: float) -> void:
	if _finished or _wave_index < 0:
		return
	var now := Time.get_ticks_msec() / 1000.0
	if _queue.is_empty():
		if _alive == 0:
			_clear_wave()
		return
	if _alive >= _cap or now < _next_spawn_at:
		return
	_spawn_next()
	_next_spawn_at = now + _interval


func on_enemy_died(_enemy_type: String, _executed: bool) -> void:
	_alive = maxi(0, _alive - 1)
	alive_changed.emit(_alive, _cap)


func stop() -> void:
	_finished = true


func is_finished() -> bool:
	return _finished


func _spawn_next() -> void:
	var type: String = _queue.pop_front()
	var path := String(ENEMY_SCENES.get(type, ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		push_warning("敌型场景缺失，跳过：%s" % type)
		return
	var scene := load(path) as PackedScene
	var enemy := scene.instantiate() as EnemyController
	enemy.enemy_type = type
	# 出怪点轮换而不是随机，保证玩家能预判节奏（练习期 04 的可读性经验）
	var point := _spawn_points[_spawn_cursor % _spawn_points.size()]
	_spawn_cursor += 1
	# 必须先 add_child 再设 global_position：节点不在树里时读父链变换会报
	# "!is_inside_tree()"，且位置会被静默丢弃，敌人从原点出生。
	add_child(enemy)
	enemy.global_position = point.global_position
	enemy.died.connect(on_enemy_died)
	_alive += 1
	alive_changed.emit(_alive, _cap)


func _next_wave() -> void:
	_wave_index += 1
	if _wave_index >= _waves.size():
		_finished = true
		victory.emit()
		return
	var wave: Dictionary = _waves[_wave_index]
	_interval = float(wave.spawn_interval)
	_cap = int(wave.alive_cap)
	_queue.clear()
	for type in wave.spawns:
		for _i in range(int(wave.spawns[type])):
			_queue.append(String(type))
	# 用 sim 层的确定性 LCG 洗牌：同一局同一顺序，可复盘
	var rng := SimRng.new(seed_value + _wave_index)
	for i in range(_queue.size() - 1, 0, -1):
		var j := int(rng.next_float() * float(i + 1))
		var tmp := _queue[i]
		_queue[i] = _queue[j]
		_queue[j] = tmp
	_next_spawn_at = Time.get_ticks_msec() / 1000.0 + 1.0
	wave_started.emit(_wave_index + 1, _waves.size(), _queue.size())


func _clear_wave() -> void:
	var wave: Dictionary = _waves[_wave_index]
	var bonus := int(wave.clear_bonus)
	get_tree().call_group("weapon", "add_reserve", bonus)
	wave_cleared.emit(_wave_index + 1, bonus)
	var timer := get_tree().create_timer(intermission)
	timer.timeout.connect(_next_wave)
