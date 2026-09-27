extends GutTest

## CombatModel：画像字段必须单调地影响结果（手感数值化的回归网）。

const CFG := {"aim": 0.6, "dodge": 0.5, "aggression": 0.5, "heat_manage": 0.6, "shield": 0.35}


## ShipTable.difficulty_id 是 static 变量（全局共享）：改过必须复位，
## 否则会污染后续测试文件的读数。
func before_each() -> void:
	ShipTable.difficulty_id = "normal"


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


func test_active_shield_reduces_damage() -> void:
	# 主动护盾必须进模型：玩家反馈难度偏高，新增的救场资源若不算进跑分，
	# 跑分会系统性高估难度（文档 §6 的「跑分与实战必须同源」教训）。
	var none := CFG.duplicate()
	none["shield"] = 0.0
	var heavy := CFG.duplicate()
	heavy["shield"] = 1.0
	var a := CombatModel.sim_wave(_lineup(), none, SimRng.new(3), WaveTable.SPAWN_INTERVAL)
	var b := CombatModel.sim_wave(_lineup(), heavy, SimRng.new(3), WaveTable.SPAWN_INTERVAL)
	assert_lt(float(b["damage"]), float(a["damage"]), "用护盾必须真的少挨伤害")


func test_shield_reduction_is_capped() -> void:
	# 封顶 25%：护盾是救命稻草，不能变成「按住空格就无敌」
	assert_eq(CombatModel.shield_reduction(1.0), 0.25, "满使用度减免应恰好 25%")
	assert_eq(CombatModel.shield_reduction(0.0), 0.0, "不用护盾不减免")
	assert_lte(CombatModel.shield_reduction(5.0), 0.25, "超范围输入必须被夹住")


func test_difficulty_scales_incoming_damage() -> void:
	ShipTable.difficulty_id = "casual"
	var easy := CombatModel.sim_wave(_lineup(), CFG, SimRng.new(3), WaveTable.SPAWN_INTERVAL)
	ShipTable.difficulty_id = "hardcore"
	var hard := CombatModel.sim_wave(_lineup(), CFG, SimRng.new(3), WaveTable.SPAWN_INTERVAL)
	ShipTable.difficulty_id = "normal"
	assert_lt(float(easy["damage"]), float(hard["damage"]), "休闲档承伤必须低于硬核档")
