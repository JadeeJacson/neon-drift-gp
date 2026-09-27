extends Node
class_name TeamDirector
## 团队歼灭（5v5）的装配层：生成两队、击杀计分、死亡重生、判胜负。
##
## 分工线（docs/00 §4.2）：**规则数字一律在 sim/team_table.gd**（纯数据、可断言），
## 这里只做「场景里有没有真的发生」。谁赢、比多少、多久重生，改数值只改那张表。
##
## 与 WaveDirector 的关系：互斥，由 GameRoot 按 `--mode=team` 只启用一个。
## 波次模式那套（威胁预算/存活上限/清波奖励）在这里完全用不到——
## 两队互打没有「刷怪节奏」这个概念，硬套会把两套平衡逻辑搅在一起。

signal score_changed(score_a: int, score_b: int)
signal match_ended(winner: int, score_a: int, score_b: int)

const BOT_SCENE := "res://scenes/enemies/trooper_soldier.tscn"

## bot 的索敌半径。40 米 ≈ 当前竞技场对角线的 2/3，逼 bot 往前走而不是隔图对枪；
## 换成运输船（狭长两层）后这个数要按船体重量。
@export var acquire_range := 55.0
## 分批生成，避免 10 个角色同帧实例化造成一次明显掉帧。
@export var spawn_gap := 0.2

var score_a := 0
var score_b := 0
var elapsed := 0.0
var _player: Node3D
var _vitals: PlayerVitals
var _points_a: Array[Vector3] = []
var _points_b: Array[Vector3] = []
var _queue: Array = []
var _finished := false
var _queue_timer := 0.0
var _rng := RandomNumberGenerator.new()


func setup(spawn_points: Node3D, player: Node3D, vitals: PlayerVitals) -> void:
	add_to_group("team_director")
	_player = player
	_vitals = vitals
	_rng.seed = 20260927   # 固定种子：同一局的重排结果可复现，冒烟断言才不会飘
	_split_spawns(spawn_points)
	if _points_a.is_empty() or _points_b.is_empty():
		push_error("SpawnPoints 里两端的出怪点不全，团队模式无法开局")
		return
	for i in range(TeamTable.TEAM_SIZE - 1):
		_queue.append({"team": TeamTable.TEAM_A, "index": i})
	for i in range(TeamTable.TEAM_SIZE):
		_queue.append({"team": TeamTable.TEAM_B, "index": i})
	_vitals.died.connect(_on_player_died)


func _process(delta: float) -> void:
	if _finished:
		return
	elapsed += delta
	if not _queue.is_empty():
		if _queue_timer <= 0.0:
			_spawn_from_queue()
			_queue_timer = spawn_gap
		else:
			_queue_timer -= delta
	_check_result()



## 计分口径：**死者所在队的对方得分**。
## 这里刻意不去追「是谁开的枪」，因为在当前机制下不存在中立死亡：
## 友伤关闭（TeamTable.FRIENDLY_FIRE）、关卡几何不掉血、bot 只会对敌方目标结算
## （Targeting.acquire 已经过滤过阵营）。将来若加入爆炸自伤或环境杀，
## 这条假设会失效，必须改成记录 last_hit_by_team——所以把它写成断言而不是默认。
func _on_bot_died(bot: EnemyController) -> void:
	if _finished or bot == null:
		return
	if bot.team == TeamTable.TEAM_A:
		score_b += TeamTable.SCORE_PER_KILL
	else:
		score_a += TeamTable.SCORE_PER_KILL
	score_changed.emit(score_a, score_b)
	_schedule_respawn(bot.team)


func _schedule_respawn(team: int) -> void:
	var timer := get_tree().create_timer(TeamTable.RESPAWN_DELAY)
	timer.timeout.connect(func() -> void:
		if not _finished:
			_spawn_bot(team))


func _spawn_from_queue() -> void:
	if _queue.is_empty():
		return
	var job: Dictionary = _queue.pop_front()
	_spawn_bot(int(job.team))


func _spawn_bot(team: int) -> void:
	if not ResourceLoader.exists(BOT_SCENE):
		push_error("bot 场景缺失：%s" % BOT_SCENE)
		return
	var bot := (load(BOT_SCENE) as PackedScene).instantiate() as EnemyController
	if bot == null:
		return
	bot.team = team
	bot.acquire_range = acquire_range
	# 看不见敌人时朝对方半场推进——没有这条，两队会在各自出生点原地罚站到时间结束
	bot.push_point = _half_center(TeamTable.TEAM_B if team == TeamTable.TEAM_A else TeamTable.TEAM_A)
	get_parent().add_child(bot)
	bot.global_position = _pick_point(team)
	# died 带两个参数（enemy_type / executed），回调只关心「哪个节点死了」，
	# 所以用 lambda 捕获 bot 而不是 bind —— bind 会把两个参数一起塞进去，运行期才报签名不符
	bot.died.connect(func(_t: String, _e: bool) -> void: _on_bot_died(bot))


## 出生点：现在按「z 轴正负」把现有竞技场的 8 个地面出怪点分成两端。
## 运输船地图会改成显式的 team_a_* / team_b_* 标记（见 docs/06 §7.4）。
func _split_spawns(holder: Node3D) -> void:
	for c in holder.get_children():
		var m := c as Marker3D
		if m == null or String(m.name) == "player_spawn":
			continue
		if m.position.y > 1.0:
			continue   # 高台的出怪点留给波次模式，团队重生要在地面
		if m.position.z >= 0.0:
			_points_a.append(m.global_position)
		else:
			_points_b.append(m.global_position)


## 某一端出生点的几何中心，作为对方阵营的推进目标。
func _half_center(team: int) -> Vector3:
	var pool := _points_a if team == TeamTable.TEAM_A else _points_b
	if pool.is_empty():
		return Vector3.ZERO
	var sum := Vector3.ZERO
	for p in pool:
		sum += p
	return sum / float(pool.size())


func _pick_point(team: int) -> Vector3:
	var pool := _points_a if team == TeamTable.TEAM_A else _points_b
	if pool.is_empty():
		return Vector3.ZERO
	# 出生点分散：随机取一个，再抬 0.4 米避免出生即嵌进地面被物理弹飞
	return pool[_rng.randi_range(0, pool.size() - 1)] + Vector3(0, 0.4, 0)


func _on_player_died() -> void:
	score_b += TeamTable.SCORE_PER_KILL
	score_changed.emit(score_a, score_b)
	var timer := get_tree().create_timer(TeamTable.RESPAWN_DELAY)
	timer.timeout.connect(func() -> void:
		if _finished:
			return
		_vitals.revive(_pick_point(TeamTable.TEAM_A)))


func _check_result() -> void:
	var verdict := TeamTable.winner(score_a, score_b, elapsed)
	if verdict < 0:
		return
	_finished = true
	match_ended.emit(verdict, score_a, score_b)


func is_finished() -> bool:
	return _finished


## 冒烟/调试读数。
func alive_bots() -> int:
	var n := 0
	for node in get_tree().get_nodes_in_group("enemies"):
		var bot := node as EnemyController
		if bot != null and not bot.is_dead():
			n += 1
	return n
