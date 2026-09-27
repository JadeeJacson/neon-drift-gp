extends GutTest

## CombatModel：画像字段必须单调地影响结果（手感数值化的回归网）。

const CFG := {"aim": 0.6, "dodge": 0.5, "aggression": 0.5, "heat_manage": 0.6}


func _lineup() -> Array:
	return ["interceptor", "interceptor", "drone", "bomber"]


func test_determinism() -> void:
	var a := CombatModel.sim_wave(_lineup(), CFG, SimRng.new(11), WaveTable.SPAWN_INTERVAL)
	var b := CombatModel.sim_wave(_lineup(), CFG, SimRng.new(11), WaveTable.SPAWN_INTERVAL)
	assert_eq(a, b, "同输入同种子必须同结果")


func test_aim_shortens_clear_time() -> void:
	var prev := 1.0e9
	for step in range(6):
		var aim := float(step) / 5.0
		var cfg := CFG.duplicate()
		cfg["aim"] = aim
		var r := CombatModel.sim_wave(_lineup(), cfg, SimRng.new(3), WaveTable.SPAWN_INTERVAL)
		assert_lt(float(r["elapsed"]), prev + 0.001,
			"aim %.2f 的清波时长不该变长" % aim)
		prev = float(r["elapsed"])


func test_dodge_reduces_damage() -> void:
	var prev := 1.0e9
	for step in range(6):
		var dodge := float(step) / 5.0
		var cfg := CFG.duplicate()
		cfg["dodge"] = dodge
		var r := CombatModel.sim_wave(_lineup(), cfg, SimRng.new(3), WaveTable.SPAWN_INTERVAL)
		assert_lte(float(r["damage"]), prev + 0.001,
			"dodge %.2f 的承伤不该上升" % dodge)
		prev = float(r["damage"])
	var idle := CombatModel.sim_wave(_lineup(), CFG, SimRng.new(3), WaveTable.SPAWN_INTERVAL)
	assert_gt(float(idle["damage"]), 0.0, "承伤不为零（不许无敌）")


func test_heat_management_matters() -> void:
	var bad := CFG.duplicate()
	bad["heat_manage"] = 0.0
	var good := CFG.duplicate()
	good["heat_manage"] = 1.0
	var t_bad := float(CombatModel.sim_wave(_lineup(), bad, SimRng.new(5), WaveTable.SPAWN_INTERVAL)["elapsed"])
	var t_good := float(CombatModel.sim_wave(_lineup(), good, SimRng.new(5), WaveTable.SPAWN_INTERVAL)["elapsed"])
	assert_lt(t_good, t_bad, "热量管理好的有效 DPS 必须更高")


func test_approach_time_shields_bombers_and_drones() -> void:
	# 前摇窗抽象必须真的折减承伤：无折减的裸 DPS 模型会高估轰炸机威胁
	var r := CombatModel.sim_wave(["bomber"], {
		"aim": 1.0, "dodge": 0.0, "aggression": 1.0, "heat_manage": 1.0,
	}, SimRng.new(7), WaveTable.SPAWN_INTERVAL)
	var naive := ShipTable.abstract_dps("bomber") * float(r["elapsed"])
	assert_lt(float(r["damage"]), naive * 0.75, "轰炸机伤害必须被逼近窗折减（否则前摇抽象白做）")
	assert_lt(float(r["damage"]), 6.0, "满状态单轰炸机伤害应被压在小量（实测 %.1f）" % float(r["damage"]))


func test_hits_track_aim() -> void:
	var low := CFG.duplicate()
	low["aim"] = 0.2
	var a := CombatModel.sim_wave(_lineup(), CFG, SimRng.new(9), WaveTable.SPAWN_INTERVAL)
	var b := CombatModel.sim_wave(_lineup(), low, SimRng.new(9), WaveTable.SPAWN_INTERVAL)
	assert_gt(float(a["hits"]) / float(int(a["shots"])),
		float(b["hits"]) / float(int(b["shots"])), "命中率必须随 aim 上升")
