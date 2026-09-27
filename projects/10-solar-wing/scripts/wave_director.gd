extends Node
class_name WaveDirector
## 波次导演：按 WaveTable 时刻表出怪（alive_cap 限流），清波/间歇/胜负全在这里。
## 与 06 同名组件同职责：阶段机（SPAWNING → INTERMISSION → …），杜绝清波重复触发。

signal wave_started(idx: int, total_waves: int, enemy_count: int)
signal wave_cleared(idx: int, bonus: int)
signal victory
signal defeat

enum Phase { IDLE, SPAWNING, INTERMISSION, DONE }

var phase: Phase = Phase.IDLE
var waves: Array = []
var widx: int = -1
var spawned: int = 0
var alive: int = 0

var player: PlayerShip
var root: GameRoot
var enemies_parent: Node3D
var sfx: SfxPool

var _spawn_t: float = 0.0
var _inter_t: float = 0.0
var _rng := SimRng.new(555)


func setup(plan: Array, p: PlayerShip, r: GameRoot, enemies: Node3D, s: SfxPool) -> void:
	waves = plan
	player = p
	root = r
	enemies_parent = enemies
	sfx = s


func start() -> void:
	widx = -1
	_rng = SimRng.new(555)
	_advance()


func current_wave() -> int:
	return widx + 1


func remaining_enemies() -> int:
	if widx < 0 or widx >= waves.size():
		return 0
	var total := int(waves[widx]["total"])
	return (total - spawned) + alive


func intermission_left() -> float:
	if phase == Phase.INTERMISSION:
		return maxf(0.0, _inter_t)
	return 0.0


func on_player_died() -> void:
	phase = Phase.DONE
	defeat.emit()


func _advance() -> void:
	widx += 1
	if widx >= waves.size():
		phase = Phase.DONE
		victory.emit()
		return
	_begin_wave()


func _begin_wave() -> void:
	phase = Phase.SPAWNING
	spawned = 0
	alive = 0
	_spawn_t = 1.6  # 简报落定再出第一架
	# 把本波绑定的任务行星告诉世界（HUD 会播报「XX 卫星域」）
	if root != null and root.world != null:
		if widx >= 0 and widx < SpaceWorld.WAVE_PLANET.size():
			root.world.set_mission(int(SpaceWorld.WAVE_PLANET[widx]))
		else:
			root.world.set_mission(-1)
	wave_started.emit(widx + 1, waves.size(), int(waves[widx]["total"]))


func _physics_process(delta: float) -> void:
	if root == null or root.state != GameRoot.State.PLAYING:
		return
	match phase:
		Phase.SPAWNING:
			_spawn_t -= delta
			var wave: Dictionary = waves[widx]
			var total := int(wave["total"])
			if spawned < total and _spawn_t <= 0.0 and alive < WaveTable.ALIVE_CAP:
				_spawn(wave)
				spawned += 1
				alive += 1
				_spawn_t = float(wave["spawn_interval"])
			if spawned >= total and alive == 0:
				_clear_wave()
		Phase.INTERMISSION:
			_inter_t -= delta
			if _inter_t <= 0.0:
				_advance()
		_:
			pass


func _spawn(wave: Dictionary) -> void:
	var kind: String = wave["spawns"][spawned]
	var angle := float(wave["angles"][spawned])
	var dir := Vector3(cos(angle), sin(angle * 2.7) * 0.3, sin(angle)).normalized()
	var dist := _rng.rangef(280.0, 360.0)
	var pos := player.global_position + dir * dist
	var enemy := EnemyShip.new()
	enemy.setup(kind, player, root, sfx)
	enemy.died.connect(_on_enemy_died)
	enemies_parent.add_child(enemy)
	enemy.global_position = pos


func _on_enemy_died(_enemy: EnemyShip) -> void:
	alive = maxi(0, alive - 1)


func _clear_wave() -> void:
	var wave: Dictionary = waves[widx]
	wave_cleared.emit(widx + 1, int(wave["clear_bonus"]))
	if widx >= waves.size() - 1:
		phase = Phase.DONE
		victory.emit()
	else:
		phase = Phase.INTERMISSION
		_inter_t = WaveTable.WAVE_GAP


## —— 冒烟/调试用：立刻清掉当前波全部敌人（不给分，仅推进阶段机）。
func debug_clear_wave() -> void:
	if widx < 0 or widx >= waves.size():
		return
	for child in enemies_parent.get_children():
		var enemy := child as EnemyShip
		if enemy != null:
			enemy.queue_free()
	alive = 0
	spawned = int(waves[widx]["total"])
	if phase == Phase.SPAWNING:
		# 让阶段机在下个物理帧自检清波
		_spawn_t = 0.0


## —— 冒烟用：跳过整备间歇。
func debug_skip_intermission() -> void:
	if phase == Phase.INTERMISSION:
		_inter_t = 0.0


## 停止导演回到空闲（返回菜单时调用）。
func stop() -> void:
	phase = Phase.IDLE
	widx = -1
	spawned = 0
	alive = 0
