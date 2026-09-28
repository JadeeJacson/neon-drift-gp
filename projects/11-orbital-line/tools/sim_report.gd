extends SceneTree

# 跑分：三种玩家画像 × N 个种子，输出通关率/时长/剩余 HP 的**分布**。
# 用法: godot --headless -s res://tools/sim_report.gd [-- --runs=8]
# 脚本模式必须显式 quit()（路线图 §5.0b 第 6 条）。

const PROFILES: Array = ["random", "balanced", "optimal"]
const LABELS: Dictionary = {"random": "乱建", "balanced": "均衡", "optimal": "最优"}


func _init() -> void:
	var runs: int = 8
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--runs="):
			var v: String = a.substr(7)
			runs = int(v)
	var summary: Array = []
	print("")
	print("=== 11 轨道防线 · 整局跑分（%d 局/画像）===" % runs)
	print("")
	for prof in PROFILES:
		var p: String = String(prof)
		var wins: int = 0
		var waves: Array = []
		var times: Array = []
		var hps: Array = []
		for i in range(runs):
			var sim: MatchSim = MatchSim.new()
			sim.setup(18, 12, Vector2i(0, 5), Vector2i(17, 6), 1000 + i * 37, p)
			var r: Dictionary = sim.run()
			var won: bool = String(r["result"]) == MatchSim.PHASE_WON
			if won:
				wins += 1
			waves.append(mini(int(r["wave"]), Waves.TOTAL))
			times.append(float(r["elapsed"]) / 60.0)
			hps.append(int(r["core_hp"]))
		var rate: int = int(round(float(wins) * 100.0 / float(runs)))
		print("%s\t通关率 %d%%\t波次 %s\t时长 %s 分钟\t剩余HP %s" % [
			LABELS[p], rate,
			_fmt(_avg(waves), 1), _fmt(_avg(times), 1), _fmt(_avg(hps), 1),
		])
		summary.append({"profile": p, "rate": rate, "avg_wave": _avg(waves), "avg_hp": _avg(hps)})
	print("")
	# 策略深度判据：最优与乱建的通关率差距
	var rr: int = 0
	var oo: int = 0
	for s in summary:
		var d: Dictionary = s as Dictionary
		if String(d["profile"]) == "random":
			rr = int(d["rate"])
		if String(d["profile"]) == "optimal":
			oo = int(d["rate"])
	print("策略深度（最优 − 乱建）: %d 个百分点（目标 ≥ 40）" % (oo - rr))
	print("")
	quit(0)


func _avg(a: Array) -> float:
	if a.size() == 0:
		return 0.0
	var s: float = 0.0
	for v in a:
		s += float(v)
	return s / float(a.size())


func _fmt(v: float, digits: int) -> String:
	return str(snappedf(v, pow(10, -digits))).pad_decimals(digits)
