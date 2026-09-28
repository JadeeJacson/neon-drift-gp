@tool
extends SceneTree
## 阶段曲线预览：把 18 个阶段的敌方预算 / 人数 / 精英 / 预计战斗时长打出来。
## 调难度时先看这张表，再跑 sim_report（docs/09-立项 §3）。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/09-arcane-roster -s res://tools/preview_rounds.gd -- --seeds=6
##
## 为什么不接进 tools/verify.mjs：那里的 `waves` 步骤是 06 的波次语义与正则，
## 改共享文件要等并行的 07/11 工程收工。本脚本自己打印完整表，人工看即可。

const RULE := "----------------------------------------------------------------------------------------------------------------"


func _initialize() -> void:
	var seeds := _seeds_from_args()
	print("=== 09 阶段曲线预览（%d 组编成取平均）===" % seeds)
	print("%-4s %-12s %-6s %-7s %-9s %-9s %-8s" % ["阶段", "名字", "BOSS", "预算", "平均人数", "平均战力", "精英率"])
	print(RULE)
	for stage in range(1, StageTable.STAGE_COUNT + 1):
		var count := 0.0
		var power := 0.0
		var elites := 0
		for i in range(seeds):
			var enemy := StageTable.roll_enemy(SimRng.new(4242 + i * 17), stage, 0)
			count += float(enemy.size())
			for e in enemy:
				var d: Dictionary = e
				power += EnemyTable.power(str(d["id"]), int(d["star"]))
				if int(d["star"]) >= 2:
					elites += 1
		var total := maxf(1.0, float(seeds))
		print("%-4d %-12s %-6s %-7.0f %-9.1f %-9.0f %-8.0f%%" % [
			stage, StageTable.stage_name(stage),
			"★" if StageTable.is_boss(stage) else "",
			StageTable.budget(stage, 0),
			count / total, power / total,
			100.0 * float(elites) / maxf(1.0, count),
		])
	print(RULE)
	print("注：精英率列按「2★ 及以上占人数」统计；预算是我方可用战力点数的目标。")
	_battle_preview()
	quit()


## 顺便跑几场真实战斗，看单场时长落在哪个区间
func _battle_preview() -> void:
	var lineup := [
		{"id": "knight", "star": 1}, {"id": "barbarian", "star": 1},
		{"id": "rogue", "star": 1}, {"id": "mage", "star": 1},
		{"id": "sk_warrior", "star": 1}, {"id": "sk_minion", "star": 1},
	]
	var occ := {}
	var ally: Array = []
	for u in lineup:
		var d: Dictionary = u
		var cell := Board.auto_place_cell(Board.ALLY, occ)
		occ[cell] = d
		ally.append({"id": str(d["id"]), "star": int(d["star"]), "cell": cell})
	var bonus := Traits.bonuses(lineup)
	var sum := 0.0
	var n := 0
	var wins := 0
	for stage in range(1, StageTable.STAGE_COUNT + 1):
		for i in range(4):
			var enemy := StageTable.roll_enemy(SimRng.new(777 + i * 31), stage, 0)
			var r := BattleSim.new(ally, enemy, 777 + i, bonus).run()
			sum += float(r["duration"])
			n += 1
			if int(r["winner"]) == Board.ALLY:
				wins += 1
	print("")
	print("6 个 1★ 单位打全程：平均 %.1f 秒 / 场（目标 10-18 秒），胜率 %.0f%%" % [sum / float(n), 100.0 * float(wins) / float(n)])
	print("（这个胜率是「无脑固定阵容」的胜率，不买任何东西、不升星——玩家实际会明显更高）")


func _seeds_from_args() -> int:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--seeds="):
			return int(arg.split("=")[1])
	return 8
