extends Node
class_name GameRoot
## 主场景装配层：解析引用、把 HUD 与波次导演接到玩家身上。
## 之所以不在 .tscn 里硬写 NodePath：场景树会被 tools/build_arena.gd 重新生成，
## 路径散落在 XML 里迟早对不上；集中在这里，改结构只改一处。

@export var player_path: NodePath = ^"Player"
@export var arena_path: NodePath = ^"Arena"
@export var director_path: NodePath = ^"WaveDirector"
@export var hud_path: NodePath = ^"Hud"


func _ready() -> void:
	var player := get_node_or_null(player_path)
	var arena := get_node_or_null(arena_path)
	var director := get_node_or_null(director_path) as WaveDirector
	var hud := get_node_or_null(hud_path) as GameHud
	if player == null or arena == null or director == null or hud == null:
		push_error("主场景装配失败：Player/Arena/WaveDirector/Hud 有缺失")
		return

	var vitals := player.get_node_or_null(^"Vitals") as PlayerVitals
	if vitals == null:
		push_error("主场景装配失败：Player 下没有 Vitals（player_vitals.gd）")
		return

	var spawn_points := arena.get_node_or_null(^"SpawnPoints") as Node3D
	if spawn_points == null:
		push_error("主场景装配失败：Arena 下没有 SpawnPoints，请重跑 tools/build_arena.gd")
		return

	_place_player_at_spawn(player, spawn_points)
	hud.bind_player(player)
	director.setup(spawn_points, vitals)


func _place_player_at_spawn(player: Node3D, spawn_points: Node3D) -> void:
	var marker := spawn_points.get_node_or_null(^"player_spawn") as Marker3D
	if marker == null:
		return
	# 出生点略高于标记点：胶囊半高 1.0，留出落地余量，避免出生即嵌进地面被物理弹飞
	player.global_position = marker.global_position + Vector3(0, 0.4, 0)
