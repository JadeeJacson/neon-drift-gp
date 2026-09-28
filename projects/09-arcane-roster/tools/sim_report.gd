@tool
extends SceneTree
## 跑分报告：三种玩家画像 × N 个种子的整局结果，打印成分布表。
## 这是 docs/00 §4.3「统计断言」的人工查看侧；断言本身在 sim/tests/test_match_sim.gd。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/09-arcane-roster -s res://tools/sim_report.gd -- --runs=20
##
## 画像名沿用 06 的「龟缩流 / 普通 / 高手」，是为了让 tools/verify.mjs 的 balance 步骤
## 不用为 09 改正则——那是个共享文件，平行工程期间不该由我改。

const RULE := "--------------------------------------------------------------------------------------------"


func _initialize() -> void:
	var runs := _runs_from_args()
	print("=== 09 圣旗 · 整局跑分（每画像 %d 局）===" % runs)
	print("%-8s %-7s %-15s %-15s %-9s %-7s %-5s %-7s" % [
		"画像", "通关率", "分钟(min/中/max)", "阶段(min/中/max)", "均战斗秒", "羁绊条", "合成", "最大连胜",
	])
	print(RULE)
	for name in MatchSim.PROFILES:
		var s := MatchSim.sweep(MatchSim.PROFILES[name], runs)
		print("%-8s %-7s %.1f/%.1f/%.1f  %.0f/%.0f/%.0f      %5.1f   %5.2f  %5.1f  %5.1f" % [
			String(name),
			"%.0f%%" % (float(s["clear_rate"]) * 100.0),
			float(s["minutes_min"]), float(s["minutes_med"]), float(s["minutes_max"]),
			float(s["stages_min"]), float(s["stages_med"]), float(s["stages_max"]),
			float(s["battle_med"]), float(s["traits_med"]), float(s["combines_med"]), float(s["streak_med"]),
		])
	print(RULE)
	print("目标形状：龟缩 0% / 普通 55-75% / 高手 ≥ 普通；整局 10-18 分钟；单场战斗 10-18 秒")
	print("基线（2026-09-28 修复后，20 seed）：龟缩 0%% / 普通 55%% / 高手 60%% / 9-16 分钟 / 12.5-13.7 秒。")
	print("修复内容：败仗伤害按真实存活者记账（原先 39%% 的败仗一滴血不掉）、手动摆位接线、")
	print("布阵按职能分层、战斗允许越中线追击、暗影领主出场。高手 60%% > 普通 55%%，")
	print("§3.2 的「高手打平普通」缺口已由「摆位维度」打破——不再需要新机制。")

	var one := MatchSim.play(MatchSim.PROFILES["普通"], 20260927)
	print("")
	print("单局明细（普通画像 seed=20260927）：%s" % _one_line(one))
	quit()  # 脚本模式必须显式退出，见 docs/00 §5.0b 第 6 条


func _one_line(r: Dictionary) -> String:
	var parts: PackedStringArray = []
	for row in r["log"]:
		var d: Dictionary = row
		parts.append("S%-2d%s %3.0fs %s 掉血%-2d(HP%-3d) 我方 %d 个/战力%.0f vs 敌方 %d 个/战力%.0f %s" % [
			int(d["stage"]), "B" if bool(d["boss"]) else " ",
			float(d["duration"]), "胜" if bool(d["win"]) else "负",
			int(d["damage"]), int(d["hp"]),
			int(d["ally_units"]), float(d["ally_power"]), int(d["enemy"]), float(d["enemy_power"]),
			String(d["traits"]),
		])
	return "\n    ".join(parts)


func _runs_from_args() -> int:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--runs="):
			return int(arg.split("=")[1])
	return 20
