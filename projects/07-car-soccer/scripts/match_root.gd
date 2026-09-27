extends Node3D
## match_root.gd — main.tscn 的装配层：解析引用、把导演/相机/HUD/BGM 全部接到
## 球和两辆车上（06 game_root 的分工线：装配与接线在这里，逻辑在各自节点）。
## 全局输入也归这里：Esc 释放/捕获鼠标，FULL_TIME 时 Enter 重开。

var director: Node
var camera: Camera3D
var hud: CanvasLayer
var bgm: Node
var car_blue: Node3D
var car_orange: Node3D
var ball: RigidBody3D
var arena: Node3D


func _ready() -> void:
	arena = $Arena
	ball = $Ball
	car_blue = $CarBlue
	car_orange = $CarOrange
	director = $Director
	camera = $ChaseCamera
	hud = $HUD
	bgm = $BGM

	car_blue.team = "blue"
	car_blue.is_player = true
	car_orange.team = "orange"
	car_orange.is_player = false

	director.setup(arena, ball, car_blue, car_orange)
	camera.target = car_blue
	camera.ball = ball

	director.countdown.connect(_on_countdown)
	director.goal_scored.connect(_on_goal)
	director.match_ended.connect(_on_match_ended)
	director.state_changed.connect(_on_state_changed)

	bgm.play_match()
	Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		var mode := Input.MOUSE_MODE_VISIBLE if Input.get_mouse_mode() == Input.MOUSE_MODE_CAPTURED else Input.MOUSE_MODE_CAPTURED
		Input.set_mouse_mode(mode)
	elif event.is_action_pressed("ui_accept") and String(director.state.get("phase", "")) == "FULL_TIME":
		hud.hide_result()
		director.restart()
		bgm.play_match()


func _on_countdown(n: int) -> void:
	if n > 0:
		hud.show_center(str(n), Color(1, 1, 1), 0.5)
	else:
		hud.show_center("GO!", Color(0.4, 1.0, 0.6), 0.5)


func _on_goal(team: String, blue: int, orange: int) -> void:
	hud.set_score(blue, orange)
	hud.flash_goal(team)
	hud.show_center("GOAL!", Color(0.4, 1.0, 0.6) if team == "blue" else Color(1.0, 0.55, 0.25), 1.2)
	camera.kick(0.55)
	bgm.duck_for_goal()


func _on_match_ended(winner: String) -> void:
	hud.show_center("", Color(1, 1, 1), 0.1)
	hud.show_result(winner)
	bgm.play_menu()


func _on_state_changed(state: Dictionary) -> void:
	hud.set_clock(float(state["clock"]))
