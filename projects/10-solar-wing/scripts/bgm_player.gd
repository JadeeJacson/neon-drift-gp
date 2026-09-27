extends AudioStreamPlayer
class_name BgmPlayer
## 背景音乐三轨：菜单 / 战斗 / 波间整备，交叉淡入淡出（模式沿用 06）。

const TRACKS := {
	"menu": "res://assets/audio/music/main_theme.mp3",
	"combat": "res://assets/audio/music/combat_loop.mp3",
	"tension": "res://assets/audio/music/tension_loop.mp3",
}

const LEVEL := {
	"menu": -8.0,
	"combat": -11.0,
	"tension": -10.0,
}

var _current: String = ""


func _ready() -> void:
	volume_db = -40.0
	finished.connect(_on_finished)
	play_track("menu")


func play_track(id: String) -> void:
	if id == _current:
		return
	var path := String(TRACKS.get(id, ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		push_warning("BGM 缺失：%s" % path)
		return
	var track := load(path) as AudioStreamMP3
	if track == null:
		push_warning("BGM 解码失败：%s" % path)
		return
	track.loop = true
	_current = id
	stream = track
	bus = &"Master"
	play()
	var t := create_tween()
	t.tween_property(self, "volume_db", float(LEVEL[id]), 1.2)


func duck_to_silence(duration: float = 1.5) -> void:
	var t := create_tween()
	t.tween_property(self, "volume_db", -40.0, duration)


func _on_finished() -> void:
	if _current != "" and stream != null:
		play()
