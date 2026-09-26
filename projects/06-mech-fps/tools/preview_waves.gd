@tool
extends SceneTree
## 波次预览：打印 WaveTable 计划表与整局时长估算，用于调难度曲线。
## 改 BASE_BUDGET / GROWTH / ELITES 后重跑即可看效果，不必先动断言。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/preview_waves.gd -- --seeds=8

const SEED_COUNT := 8
const RULE := "------------------------------------------------------------"


func _initialize() -> void:
	var seeds := _seeds_from_args()
	print("=== 06 波次预览（每个种子 = 一整局）===")
	var mins: Array = []
	var vols: Array = []
	for s in seeds:
		var summary := WaveTable.summary(int(s))
		mins.append(float(summary.expected_minutes))
		vols.append(int(summary.total_enemies))
		if s == seeds[0]:
			_print_plan(int(s))
	print(RULE)
	print("%-10s %-10s %s" % ["seed", "敌人总数", "预计分钟"])
	for i in range(seeds.size()):
		print("%-10d %-10d %.2f" % [seeds[i], vols[i], mins[i]])
	mins.sort()
	vols.sort()
	var n := mins.size()
	var mid := int(n / 2.0)
	print(RULE)
	print("分钟  min=%.2f  中位=%.2f  max=%.2f" % [mins[0], mins[mid], mins[n - 1]])
	print("敌人  min=%d  中位=%d  max=%d" % [vols[0], vols[mid], vols[n - 1]])
	print("设计区间：10–15 分钟（docs/06-立项 §2.4）")
	quit()  # 脚本模式必须显式退出，否则 --headless 进程永不结束


func _print_plan(seed_value: int) -> void:
	print("种子 %d 的波次编成：" % seed_value)
	for w in WaveTable.plan(seed_value):
		var label := ""
		var threat := 0.0
		for type in w.spawns:
			var count := int(w.spawns[type])
			label += "%s×%d " % [type, count]
			threat += EnemyTable.threat(String(type)) * float(count)
		print("  第%d波  预算%6.1f  实际威胁%6.1f  共%2d个  存活上限%d  间隔%.1fs  [%s]" % [
			int(w.index), float(w.budget), threat, int(w.total),
			int(w.alive_cap), float(w.spawn_interval), label
		])


## 尾参数格式：godot ... -s res://tools/preview_waves.gd -- --seeds=12
func _seeds_from_args() -> Array:
	var count := SEED_COUNT
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--seeds="):
			count = int(arg.split("=")[1])
	var out: Array = []
	for i in range(count):
		out.append(20260926 + i * 977)
	return out
