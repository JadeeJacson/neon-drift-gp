@tool
extends SceneTree
## 跑分报告：把三种玩家画像在 N 个种子上的整局结果打印成表，用于调难度曲线。
## 这是 docs/00 §4.3「统计断言」的人工查看侧；断言本身在 sim/tests/test_match_sim.gd。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/sim_report.gd -- --runs=20

const PROFILES := {
	"龟缩流": {"aggression": 0.15, "head_rate": 0.10, "execution_rate": 0.0, "movement_efficiency": 0.20},
	"普通": {},
	"高手": {"aggression": 0.80, "head_rate": 0.45, "execution_rate": 0.70, "movement_efficiency": 0.85},
}

const RULE := "----------------------------------------------------------------"


func _initialize() -> void:
	var runs := _runs_from_args()
	print("=== 06 整局跑分（每画像 %d 局）===" % runs)
	print("%-8s %-10s %-12s %-14s %-12s" % ["画像", "通关率", "分钟(min/med/max)", "受击(min/med/max)", "自给中位"])
	print(RULE)
	for name in PROFILES:
		var s := MatchSim.sweep(PROFILES[name], runs)
		print("%-8s %-10s %.1f/%.1f/%.1f   %.0f/%.0f/%.0f      %.2f" % [
			String(name),
			"%.0f%%" % (float(s.clear_rate) * 100.0),
			float(s.minutes_min), float(s.minutes_med), float(s.minutes_max),
			float(s.damage_min), float(s.damage_med), float(s.damage_max),
			float(s.sufficiency_med),
		])
	print(RULE)
	var one := MatchSim.play({})
	print("单局明细（普通画像）：%d 波 / %d 个敌人 / 耗弹 %d / 换弹 %d / 补给 %d 次 / 处决 %d / 剩余 HP %.0f" % [
		int(one.waves), int(one.enemies), int(one.shots), int(one.reloads),
		int(one.resupplies), int(one.executions), float(one.hp_left)
	])
	print("玩家血量上限：%f，设计时长区间：10–15 分钟" % MatchSim.PLAYER_HP)
	quit()  # 脚本模式必须显式退出，见 §5.0b 第 6 条


func _runs_from_args() -> int:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--runs="):
			return int(arg.split("=")[1])
	return 20
