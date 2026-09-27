@tool
extends SceneTree
## 整局时长分布：设计目标 10–15 分钟（只统计通关局——阵亡局天然更短，不构成设计承诺）。
## 供 tools/verify.mjs 的 waves 步骤解析（输出格式是解析契约，别改）。
## 用法（lab 根）：godot --headless --path projects/10-solar-wing -s res://tools/preview_waves.gd -- --seeds=4

const AVERAGE := {}


func _initialize() -> void:
	var seeds := 4
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--seeds="):
			seeds = maxi(1, int(arg.get_slice("=", 1)))
	var minutes: Array = []
	for i in range(seeds):
		var profile := AVERAGE.duplicate()
		profile["seed"] = 20260927 + i * 1013
		var r := MatchSim.play(profile)
		if bool(r["survived"]):
			minutes.append(float(r["minutes"]))
	if minutes.is_empty():
		print("整局 — 分钟 min=0 中位=0 max=0（无通关局，调低难度）")
		quit(1)
		return
	minutes.sort()
	var med := float(minutes[minutes.size() / 2])
	print("整局 %.1f 分钟 min=%.1f 中位=%.1f max=%.1f" % [
		med, float(minutes[0]), med, float(minutes[minutes.size() - 1]),
	])
	quit(0)
