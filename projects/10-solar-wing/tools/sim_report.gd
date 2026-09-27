@tool
extends SceneTree
## 难度画像跑分：龟缩流 / 普通 / 高手 × N 局的通关率与分布。
## 供 tools/verify.mjs 的 balance 步骤解析（标签与百分比格式是解析契约，别改）。
## 用法（lab 根）：godot --headless --path projects/10-solar-wing -s res://tools/sim_report.gd -- --runs=8

const PROFILES := {
	"龟缩流": {"aim": 0.35, "dodge": 0.15, "aggression": 0.15, "heat_manage": 0.20},
	"普通": {},
	"高手": {"aim": 0.85, "dodge": 0.80, "aggression": 0.80, "heat_manage": 0.90},
}


func _initialize() -> void:
	var runs := 8
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--runs="):
			runs = maxi(1, int(arg.get_slice("=", 1)))
	print("=== 难度跑分（每画像 %d 局） ===" % runs)
	for label in PROFILES:
		var s := MatchSim.sweep(PROFILES[label], runs)
		print("%s %d%%" % [label, roundi(float(s["clear_rate"]) * 100.0)])
		print("  时长中位 %.1f 分（%d–%d）  承伤中位 %.0f  得分中位 %d" % [
			float(s["minutes_med"]), roundi(float(s["minutes_min"])),
			roundi(float(s["minutes_max"])), float(s["damage_med"]),
			roundi(float(s["score_med"])),
		])
	print("目标形状：龟缩 <25%% / 普通 60–90%% 险胜 / 高手 >90%%")
	quit(0)
