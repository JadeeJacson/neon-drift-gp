extends AudioStreamPlayer
class_name BgmPlayer
## 背景音乐层：按游戏状态切轨，交叉淡入淡出。
## 放在 CanvasLayer 之外的独立节点即可（AudioStreamPlayer 是 2D 声场，不跟随相机，
## 这正是 BGM 想要的——用 AudioStreamPlayer3D 会让音乐随玩家在地图里忽大忽小）。

const TRACKS := {
	"menu": "res://assets/audio/music/main_theme.mp3",
	"combat": "res://assets/audio/music/combat_loop.mp3",
	"tension": "res://assets/audio/music/tension_loop.mp3",
}

const LEVEL := {
	"menu": -8.0,     # BGM 压低，给枪声与脚步让出动态范围
	"combat": -11.0,  # 战斗时音乐是最底层，否则玩家听不见命中反馈
	"tension": -10.0,
}

var _current: String = ""


func _ready() -> void:
	volume_db = -40.0
	self.finished.connect(_on_finished)
	play_track("menu")


## 由 WaveDirector 的信号驱动（GameRoot 负责接线）。
func play_track(id: String) -> void:
	if id == _current:
		return
	var path := String(TRACKS.get(id, ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		push_warning("BGM 缺失：%s（先跑素材拷贝，见 assets/ASSET_MANIFEST.md §6）" % path)
		return
	var track := load(path) as AudioStreamMP3
	if track == null:
		push_warning("BGM 解码失败：%s" % path)
		return
	track.loop = true  # 未循环的曲目在波次间歇会突然静音
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
	# loop 生效时不该触发；真触发了说明资源不支持循环，直接重放而不是留一段死寂
	if _current != "" and stream != null:
		play()
