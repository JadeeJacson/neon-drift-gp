@tool
extends SceneTree
## 难度跑分表：三种画像 × N 种子（docs/08 §6 DoD 第 4 条的执行体）。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/08-neon-dive -s res://tools/sim_report.gd -- --runs=24
##
## 脚本模式的协程必须走到 quit()，否则 --headless 进程永远不退出（路线图 §5.0b 第 6 条）。

const RS := preload("res://sim/run_sim.gd")


func _initialize() -> void:
	var runs := 24
	var base_seed := 20260927
	for arg in OS.get_cmdline_user_args():
		var s := str(arg)
		if s.begins_with("--runs="):
			runs = int(s.trim_prefix("--runs="))
		elif s.begins_with("--seed="):
			base_seed = int(s.trim_prefix("--seed="))
	print("\n=== 08 整局跑分（每画像 %d 局，种子基 %d）===" % [runs, base_seed])
	print(RS.report_table(base_seed, runs))
	# 与设计区间对照，越界的直接打出来（改数值前先看到这里）
	var problems := 0
	for id in ["turtle", "normal", "expert"]:
		var s := RS.profile_stats(id, base_seed, runs)
		var band: Array = RS.design_bands()[id + "_median_depth"]
		var med := int(s["median_depth"])
		var ok: bool = med >= int(band[0]) and med <= int(band[1])
		if not ok:
			problems += 1
		print("  %-6s 中位层数 %d 期望 %d–%d  %s" % [
			str(s["display"]), med, int(band[0]), int(band[1]), "OK" if ok else "越界"])
	print("=== 跑分完成，越界 %d 项 ===" % problems)
	quit(0)
