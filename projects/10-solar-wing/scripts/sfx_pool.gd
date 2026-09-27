extends Node
class_name SfxPool
## 一次性音效池：8 个 AudioStreamPlayer 轮转，按 id 播放。
## 懒加载：菜单阶段不为音效付载入成本。

const FILES := {
	"laser": [
		"res://assets/audio/sfx/laser/laserSmall_000.ogg",
		"res://assets/audio/sfx/laser/laserSmall_001.ogg",
		"res://assets/audio/sfx/laser/laserSmall_002.ogg",
		"res://assets/audio/sfx/laser/laserSmall_003.ogg",
	],
	"laser_enemy": [
		"res://assets/audio/sfx/laser/laserRetro_000.ogg",
		"res://assets/audio/sfx/laser/laserRetro_001.ogg",
		"res://assets/audio/sfx/laser/laserRetro_002.ogg",
	],
	"impact": [
		"res://assets/audio/sfx/impact/impactMetal_000.ogg",
		"res://assets/audio/sfx/impact/impactMetal_001.ogg",
		"res://assets/audio/sfx/impact/impactMetal_002.ogg",
	],
	"shield": [
		"res://assets/audio/sfx/shield/forceField_000.ogg",
		"res://assets/audio/sfx/shield/forceField_001.ogg",
		"res://assets/audio/sfx/shield/forceField_002.ogg",
	],
	"explosion": [
		"res://assets/audio/sfx/explosion/explosionCrunch_000.ogg",
		"res://assets/audio/sfx/explosion/explosionCrunch_001.ogg",
		"res://assets/audio/sfx/explosion/explosionCrunch_002.ogg",
		"res://assets/audio/sfx/explosion/lowFrequency_explosion_000.ogg",
	],
	"click": [
		"res://assets/audio/sfx/ui/click1.ogg",
		"res://assets/audio/sfx/ui/switch1.ogg",
	],
}

var _streams: Dictionary = {}
var _players: Array = []
var _next: int = 0


func _ready() -> void:
	for i in range(8):
		var p := AudioStreamPlayer.new()
		p.name = "Pool%d" % i
		add_child(p)
		_players.append(p)


func play(id: String, vol_db: float = 0.0, pitch: float = 1.0) -> void:
	if _players.is_empty():
		return
	var streams := _streams_for(id)
	if streams.is_empty():
		return
	var stream: AudioStream = streams[_next % streams.size()]
	_next += 1
	var p: AudioStreamPlayer = _players[_next % _players.size()]
	p.stream = stream
	p.volume_db = vol_db
	p.pitch_scale = pitch
	p.play()


func _streams_for(id: String) -> Array:
	if _streams.has(id):
		return _streams[id]
	var out: Array = []
	var paths: Array = FILES.get(id, [])
	for path in paths:
		var s := load(path) as AudioStream
		if s == null:
			push_warning("音效缺失：%s" % path)
			continue
		out.append(s)
	_streams[id] = out
	return out
