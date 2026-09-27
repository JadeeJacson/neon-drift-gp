extends Node
## bgm_player.gd — 双轨 BGM：比赛进行轨（intothenight 混音，CC-BY 4.0）与
## 终场/结算轨（Retroracing Menu，CC-BY 4.0）。进球时压低再回来（duck）。
## 循环：代码里开 loop（不经编辑器 import 面板）。

var _match: AudioStreamPlayer
var _menu: AudioStreamPlayer


func _ready() -> void:
	_match = _make_player("res://assets/audio/music/intothenight_retroracing_mix.ogg", -10.0)
	_menu = _make_player("res://assets/audio/music/retroracing_menu.mp3", -8.0)


func _make_player(path: String, vol_db: float) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	var stream: AudioStream = load(path)
	if stream is AudioStreamOggVorbis:
		(stream as AudioStreamOggVorbis).loop = true
	elif stream is AudioStreamMP3:
		(stream as AudioStreamMP3).loop = true
	p.stream = stream
	p.volume_db = vol_db
	p.bus = "Master"
	add_child(p)
	return p


func play_match() -> void:
	_menu.stop()
	if not _match.playing:
		_match.play()


func play_menu() -> void:
	_match.stop()
	if not _menu.playing:
		_menu.play()


## 进球：压低 1.4 s 让欢呼/jingle 出来，再淡回
func duck_for_goal() -> void:
	var tw := create_tween()
	tw.tween_property(_match, "volume_db", -22.0, 0.15)
	tw.tween_interval(1.4)
	tw.tween_property(_match, "volume_db", -10.0, 0.8)


func stop_all() -> void:
	_match.stop()
	_menu.stop()
