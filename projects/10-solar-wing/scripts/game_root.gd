extends Node
class_name GameRoot
## 主场景装配层 + 游戏状态机（菜单/战斗/暂停/胜负）。
## 节点全部程序化构建——结构集中在一处，改层级只改这里（06 的装配哲学）。

enum State { MENU, PLAYING, PAUSED, VICTORY, GAMEOVER }

const WAVE_SEED := 20260927
const VICTORY_BONUS := 1500

var state: State = State.MENU
var score: int = 0
var kills: int = 0

var world: SpaceWorld
var player: PlayerShip
var camera_rig: CameraRig
var enemies: Node3D
var projectiles: Node3D
var director: WaveDirector
var hud: GameHud
var bgm: BgmPlayer
var sfx: SfxPool

var _waves_cleared: int = 0


func _ready() -> void:
	add_to_group("game_root")
	_build()
	hud.bind(self, player, director)
	director.victory.connect(_on_victory)
	director.defeat.connect(_on_defeat)
	director.wave_cleared.connect(_on_wave_cleared)
	player.vitals.died.connect(_on_player_died)
	_set_state(State.MENU)


func _build() -> void:
	sfx = SfxPool.new()
	sfx.name = "Sfx"
	add_child(sfx)

	world = SpaceWorld.new()
	world.name = "World"
	add_child(world)
	world.setup()

	player = PlayerShip.new()
	player.name = "Player"
	add_child(player)

	camera_rig = CameraRig.new()
	camera_rig.name = "CameraRig"
	add_child(camera_rig)
	camera_rig.setup(player)
	player.setup(camera_rig, sfx)

	enemies = Node3D.new()
	enemies.name = "Enemies"
	add_child(enemies)

	projectiles = Node3D.new()
	projectiles.name = "Projectiles"
	add_child(projectiles)

	director = WaveDirector.new()
	director.name = "WaveDirector"
	add_child(director)
	director.setup(WaveTable.plan(WAVE_SEED), player, self, enemies, sfx)

	hud = GameHud.new()
	hud.name = "Hud"
	add_child(hud)

	bgm = BgmPlayer.new()
	bgm.name = "Bgm"
	add_child(bgm)


# ---------- 对外回调（子节点上报） ----------

func spawn_bolt(pos: Vector3, dir: Vector3, speed: float, damage: float) -> void:
	var bolt := EnemyBolt.new()
	projectiles.add_child(bolt)
	bolt.setup(pos, dir, speed, damage)


func on_enemy_died(kind: String) -> void:
	kills += 1
	score += ShipTable.score_of(kind)
	hud.set_score(score)
	camera_rig.add_trauma(0.18)


func on_player_bolt_hit() -> void:
	camera_rig.add_trauma(0.4)
	hud.flash_damage()
	sfx.play("shield", -6.0)


# ---------- 状态机 ----------

func start_game() -> void:
	score = 0
	kills = 0
	_waves_cleared = 0
	_clear_ents()
	player.reset()
	player.weapon.reset_stats()
	hud.set_score(0)
	director.start()
	_set_state(State.PLAYING)
	bgm.play_track("combat")
	_capture_mouse()


func to_menu() -> void:
	director.stop()
	_clear_ents()
	player.reset()
	_set_state(State.MENU)
	bgm.play_track("menu")
	_release_mouse()


## 清场：敌机与投射物全部离场（重开/回菜单共用）。
func _clear_ents() -> void:
	for child in enemies.get_children():
		child.queue_free()
	for child in projectiles.get_children():
		child.queue_free()


func _set_state(next: State) -> void:
	state = next
	hud.set_state(next)


func _on_player_died() -> void:
	director.on_player_died()


func _on_defeat() -> void:
	_set_state(State.GAMEOVER)
	hud.show_gameover(_stats())
	bgm.duck_to_silence()
	_release_mouse()


func _on_victory() -> void:
	score += VICTORY_BONUS
	hud.set_score(score)
	_set_state(State.VICTORY)
	hud.show_victory(_stats())
	bgm.duck_to_silence()
	_release_mouse()


func _on_wave_cleared(_idx: int, bonus: int) -> void:
	_waves_cleared += 1
	score += bonus
	hud.set_score(score)


func _stats() -> Dictionary:
	var weapon := player.weapon
	var acc := 0.0
	if weapon.shots_fired > 0:
		acc = float(weapon.hits_landed) / float(weapon.shots_fired)
	return {
		"score_text": str(score),
		"waves": _waves_cleared,
		"kills": kills,
		"accuracy_text": "%d%%" % roundi(acc * 100.0),
	}


# ---------- 输入 ----------

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("confirm"):
		match state:
			State.MENU:
				start_game()
			State.PAUSED:
				_resume()
			State.GAMEOVER, State.VICTORY:
				to_menu()
	elif event.is_action_pressed("restart"):
		if state == State.GAMEOVER or state == State.VICTORY:
			start_game()
	elif event.is_action_pressed("pause"):
		match state:
			State.PLAYING:
				_set_state(State.PAUSED)
				_release_mouse()
			State.PAUSED:
				_resume()


func _resume() -> void:
	_set_state(State.PLAYING)
	_capture_mouse()


# ---------- 鼠标 ----------

func _capture_mouse() -> void:
	if DisplayServer.get_name() == "headless":
		return
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _release_mouse() -> void:
	if DisplayServer.get_name() == "headless":
		return
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
