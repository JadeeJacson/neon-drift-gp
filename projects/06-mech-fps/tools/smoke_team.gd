@tool
extends SceneTree
## 团队歼灭（5v5）冒烟：真的生成两队、真的互相打死、真的计分与重生。
##
## 为什么单独一个工具：主冒烟 smoke_battle.gd 走的是波次生存那套前提
## （玩家是唯一目标、WaveDirector 负责出怪）。团队模式把这两条都推翻了，
## 混在一个脚本里会让断言互相污染。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/smoke_team.gd
##
## 注意：脚本模式必须显式 quit()（docs/00 §5.0b 第 6 条）。

const WARMUP := 150       # 等两队生成完（spawn_gap 0.2 × 9 ≈ 1.8 秒）
const WATCH := 3600       # 观察 60 秒对局

var _fails := 0


func _initialize() -> void:
	print("=== 06 团队模式冒烟 ===")
	var main := _load_main()
	root.add_child(main)
	await process_frame
	var director := _find_director(main)
	_check(director != null, "TeamDirector 已装配（--mode=team 有没有传进来）")
	if director == null:
		_done()
		return

	var hud := main.get_node_or_null(^"Hud") as GameHud
	_check(hud != null and hud.team_score_text_for_test().contains("我方"),
		"HUD 顶栏切到了团队比分（实测「%s」）" % ("" if hud == null else hud.team_score_text_for_test()))

	for _i in range(WARMUP):
		await physics_frame
	var alive := director.alive_bots()
	_check(alive == 2 * TeamTable.TEAM_SIZE - 1,
		"两队应各占额（队友 %d + 敌人 %d，实测存活 %d）" % [
			TeamTable.TEAM_SIZE - 1, TeamTable.TEAM_SIZE, alive])
	var teams := _tally()
	_check(teams[0] == TeamTable.TEAM_SIZE - 1 and teams[1] == TeamTable.TEAM_SIZE,
		"阵营分配应为队友 %d / 敌人 %d（实测 %d / %d）" % [
			TeamTable.TEAM_SIZE - 1, TeamTable.TEAM_SIZE, teams[0], teams[1]])

	# 对局必须自己动起来：比分要涨、死人要回场
	var first := director.score_a + director.score_b
	var min_alive := alive
	for i in range(WATCH):
		await physics_frame
		min_alive = mini(min_alive, director.alive_bots())
		if i % 600 == 599:
			var t := _tally()
			print("   t=%2ds 比分 %d:%d 存活 A%d/B%d" % [
				(i + WARMUP) / 60, director.score_a, director.score_b, t[0], t[1]])
	var last := director.score_a + director.score_b
	_check(last > first,
		"bot 互打必须产生击杀（比分 %d:%d → %d:%d）" % [
			director.score_a, director.score_b, last - director.score_b, director.score_b])
	_check(director.alive_bots() >= TeamTable.TEAM_SIZE,
		"死人要重生：观察期结束时场上不该少于一个整队（实测 %d，中途最低 %d）" % [
			director.alive_bots(), min_alive])
	_check(not director.is_finished(), "60 秒不该打完一局（先到 %d 杀或 %d 秒才判）" % [
		TeamTable.KILLS_TO_WIN, int(TeamTable.TIME_LIMIT)])
	_check(hud.team_score_text_for_test().contains("剩余"), "顶栏要有倒计时")
	_done()


## 按阵营清点场上活着的 bot：[TEAM_A 数, TEAM_B 数]
func _tally() -> Array:
	var a := 0
	var b := 0
	for node in get_nodes_in_group("enemies"):
		var bot := node as EnemyController
		if bot == null or bot.is_dead():
			continue
		if bot.team == TeamTable.TEAM_A:
			a += 1
		else:
			b += 1
	return [a, b]


func _find_director(main: Node) -> TeamDirector:
	for c in main.get_children():
		var t := c as TeamDirector
		if t != null:
			return t
	return null


## 自己把模式设成 team，不依赖命令行参数：这个工具的存在意义就是
## 「团队模式独立可验证」，不该因为漏传一个 flag 而静默跑成波次模式。
func _load_main() -> Node:
	var packed := load("res://scenes/main.tscn") as PackedScene
	var scene := packed.instantiate() as GameRoot
	scene.mode = "team"
	return scene


func _check(ok: bool, label: String) -> void:
	if ok:
		print("[OK]   %s" % label)
	else:
		_fails += 1
		print("[FAIL] %s" % label)


func _done() -> void:
	print("=== 团队模式失败 %d 项 ===" % _fails)
	for _i in range(240):
		await physics_frame
	quit(1 if _fails > 0 else 0)
