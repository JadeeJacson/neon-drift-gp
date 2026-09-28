extends Node
class_name GameRoot
## 主场景装配层：解析引用、把 HUD 与波次导演接到玩家身上。
## 之所以不在 .tscn 里硬写 NodePath：场景树会被 tools/build_arena.gd 重新生成，
## 路径散落在 XML 里迟早对不上；集中在这里，改结构只改一处。

@export var player_path: NodePath = ^"Player"
@export var arena_path: NodePath = ^"Arena"
@export var director_path: NodePath = ^"WaveDirector"
@export var hud_path: NodePath = ^"Hud"
@export var bgm_path: NodePath = ^"Bgm"
## 对局模式：wave（5 波生存）| team（5v5 团队歼灭）。
## 命令行 `-- --mode=team` 优先于这个导出字段，这样制作人不用改文件就能对比两种玩法。
@export var mode := "wave"


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

	# 换地图：主场景里 Arena 是实例化的子节点，运行时换掉比在 .tscn 里做两套主场景干净
	# （场景树会被 build_arena.gd 重新生成，路径写死在 XML 里迟早对不上）。
	if _map_name() == "ship":
		var ship_path := "res://scenes/arena_ship.tscn"
		if not ResourceLoader.exists(ship_path):
			push_error("缺少 %s，先跑 build_arena.gd -- --layout=ship" % ship_path)
		else:
			# 先摘掉旧的再挂新的：同名节点共存时 Godot 会给新节点改名（Arena2），
			# 后面所有按 ^"Arena/SpawnPoints" 取路径的代码就找不到运输船了。
			var slot := arena.get_index()
			remove_child(arena)
			arena.free()
			arena = (load(ship_path) as PackedScene).instantiate() as Node3D
			arena.name = "Arena"
			add_child(arena)
			move_child(arena, slot)
			spawn_points = arena.get_node_or_null(^"SpawnPoints") as Node3D
			if spawn_points == null:
				push_error("运输船场景里没有 SpawnPoints")
				return
			print("MAP 切换到运输船")

	_place_player_at_spawn(player, spawn_points)
	hud.bind_player(player)
	_hook_bgm()
	if _resolve_mode() == "team":
		_start_team_mode(director, spawn_points, player, vitals, hud)
	else:
		director.setup(spawn_points, vitals)


func _map_name() -> String:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--map="):
			return arg.trim_prefix("--map=")
	return "arena"


func _resolve_mode() -> String:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--mode="):
			return arg.trim_prefix("--mode=")
	return mode


## 团队模式的装配。TeamDirector 在代码里 new 而不是写进 main.tscn：
## 与 GameRoot 其余接线同理——场景树会被工具重新生成，路径散在 XML 里迟早对不上。
func _start_team_mode(wave: WaveDirector, spawn_points: Node3D, player: Node3D,
		vitals: PlayerVitals, hud: GameHud) -> void:
	wave.stop()
	var team := TeamDirector.new()
	team.name = "TeamDirector"
	add_child(team)
	team.setup(spawn_points, player, vitals)
	hud.show_team_mode()
	team.score_changed.connect(func(a: int, b: int) -> void:
		hud.set_team_score(a, b, TeamTable.TIME_LIMIT - team.elapsed))
	team.match_ended.connect(func(winner: int, a: int, b: int) -> void:
		match winner:
			TeamTable.TEAM_A:
				hud.announce("我方 %d : %d 胜利
回车重开" % [a, b])
			TeamTable.TEAM_B:
				hud.announce("我方 %d : %d 失利
回车重开" % [a, b])
			_:
				hud.announce("%d : %d 平局
回车重开" % [a, b])
		print("TEAM 结束 winner=%d 比分=%d:%d 用时=%.1fs" % [winner, a, b, team.elapsed]))
	print("TEAM 模式启动：每队 %d 人，先到 %d 杀或 %d 秒判" % [
		TeamTable.TEAM_SIZE, TeamTable.KILLS_TO_WIN, int(TeamTable.TIME_LIMIT)])


## BGM 跟着波次状态走：开波切战斗轨，清波切紧张轨，结算收掉。
## 用 lambda 而不是 connect(sig, method.bind(arg))：wave_started 带 3 个参数，
## bind 会把它们一起送进只接受 1 个参数的 play_track，运行期才报错。
func _hook_bgm() -> void:
	var bgm := get_node_or_null(bgm_path) as BgmPlayer
	if bgm == null:
		return
	for director in get_tree().get_nodes_in_group("wave_director"):
		director.wave_started.connect(func(_i: int, _t: int, _n: int) -> void: bgm.play_track("combat"))
		director.wave_cleared.connect(func(_i: int, _b: int) -> void: bgm.play_track("tension"))
		director.victory.connect(bgm.duck_to_silence)
		director.defeat.connect(bgm.duck_to_silence)


func _place_player_at_spawn(player: Node3D, spawn_points: Node3D) -> void:
	var marker := spawn_points.get_node_or_null(^"player_spawn") as Marker3D
	if marker == null:
		return
	# 出生点略高于标记点：胶囊半高 1.0，留出落地余量，避免出生即嵌进地面被物理弹飞
	player.global_position = marker.global_position + Vector3(0, 0.4, 0)
