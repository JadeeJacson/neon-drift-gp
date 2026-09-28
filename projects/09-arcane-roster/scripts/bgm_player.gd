extends Node
class_name BgmPlayer
## 三条 BGM 按阶段状态交叉淡入淡出：备战 / 战斗 / Boss 战。
##
## 交叉淡化时长是猜的（0.8s），**属于人验待调项**（docs/09-立项 §7 第 6 项）：
## 转场太突兀会打断节奏，太慢会显得卡。
##
## 音量分层：BGM 0.55、jingle 0.8、战斗音效 1.0。jingle 一定要压过 BGM，
## 否则胜负提示音会被音乐吃掉（这是 06 实跑反馈过的同类问题）。

const FADE := 0.8
const BGM_DB := -5.0
const JINGLE_DB := -2.0

const TRACKS := {
	"planning": "res://assets/audio/music/oga_fantasy_town.mp3",
	"battle": "res://assets/audio/music/oga_medieval_battle.mp3",
	"boss": "res://assets/audio/music/oga_jrpg_battle_loop.mp3",
}

const JINGLES := {
	"buy": "res://assets/audio/music/jingles_STEEL00.ogg",
	"win": "res://assets/audio/music/jingles_NES00.ogg",
	"lose": "res://assets/audio/music/jingles_NES12.ogg",
	"click": "res://assets/audio/sfx/ui_pepSound1.ogg",
	"error": "res://assets/audio/sfx/ui_pepSound3.ogg",
}

var _players: Dictionary = {}     # key -> AudioStreamPlayer
var _current: String = ""
var _enabled: bool = true


func _ready() -> void:
	# 预载并常驻，避免第一次切歌时解码卡顿
	for key in TRACKS:
		_players[key] = _make_player(String(TRACKS[key]), BGM_DB, true)
	for j in JINGLES:
		_players[j] = _make_player(String(JINGLES[j]), JINGLE_DB, false)


func _make_player(path: String, db: float, loop: bool) -> AudioStreamPlayer:
	var p := AudioStreamPlayer.new()
	p.bus = "Master"
	p.volume_db = db
	if ResourceLoader.exists(path):
		var s: AudioStream = load(path)
		if s != null:
			if loop and s is AudioStreamOggVorbis:
				(s as AudioStreamOggVorbis).loop = true
			elif loop and s is AudioStreamMP3:
				(s as AudioStreamMP3).loop = true
			p.stream = s
	add_child(p)
	return p


## 切到某条 BGM。同 key 调用是 no-op——每帧调也不会重复启动
func play_state(key: String) -> void:
	if not _enabled or key == _current:
		return
	if not _players.has(key):
		return
	_current = key
	for k in _players:
		var p: AudioStreamPlayer = _players[k]
		if not TRACKS.has(k):
			continue
		if String(k) == key:
			if not p.playing:
				p.play()
			_fade(p, BGM_DB, FADE)
		else:
			_fade(p, -40.0, FADE)


func stop_all() -> void:
	_current = ""
	for k in _players:
		var p: AudioStreamPlayer = _players[k]
		_fade(p, -40.0, 0.4)


func jingle(key: String) -> void:
	if not _enabled or not _players.has(key):
		return
	var p: AudioStreamPlayer = _players[key]
	p.stop()
	p.play()


func _fade(p: AudioStreamPlayer, to_db: float, time_s: float) -> void:
	if p.volume_db == to_db:
		return
	var tw := create_tween()
	tw.tween_property(p, "volume_db", to_db, time_s)
	if to_db <= -39.0:
		tw.tween_callback(p.stop)
