extends SceneTree
## sim_report.gd — 难度跑分表：三画像 × N 种子对 AI 的胜率/场均比分分布。
## verify.mjs 的 `balance` 步骤执行体（发现存在即自动启用）。
## 输出行格式与 verify.mjs 的解析正则对齐：`龟缩流 7%` / `普通 45%` / `高手 85%`。
## 纯 sim 计算不碰场景——脚本模式必须显式 quit()（路线图 §5.0b 第 6 条）。

const MatchSim = preload("res://sim/match_sim.gd")


func _init() -> void:
	var runs := 60
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--runs="):
			runs = int(arg.split("=")[1])
	print("=== 07 整局跑分：三画像 vs 中档 AI（%d seeds） ===" % runs)
	var all_p: Dictionary = MatchSim.profiles()
	for name in ["龟缩流", "普通", "高手"]:
		var b: Dictionary = MatchSim.run_batch(all_p[name], runs, 20260927)
		print("%s %d%%  (净胜球 %+0.2f, 场均射门 %0.1f, AI 场均 %0.2f, 平局 %d%%)" % [
			name, round(b["win_rate"] * 100.0),
			b["avg_score_player"] - b["avg_score_ai"],
			b["avg_shots_player"], b["avg_score_ai"],
			round(b["draw_rate"] * 100.0)])
	print("要的形状：龟缩流必败 / 普通五五开 / 高手稳定胜（docs/07-选型 §4）")
	quit(0)


