@tool
extends SceneTree
## 调参探针：逐波打印画像的清波时长/承伤，用于难度旋钮定位（开发期工具）。
## 用法：godot --headless --path projects/10-solar-wing -s res://tools/tune_probe.gd -- --profile=avg

const PROFILES := {
	"turtle": {"aim": 0.35, "dodge": 0.15, "aggression": 0.15, "heat_manage": 0.20},
	"avg": {},
	"skilled": {"aim": 0.85, "dodge": 0.80, "aggression": 0.80, "heat_manage": 0.90},
}


func _initialize() -> void:
	var which := "avg"
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--profile="):
			which = arg.get_slice("=", 1)
	var cfg: Dictionary = MatchSim.DEFAULTS.duplicate()
	cfg.merge(PROFILES.get(which, {}), true)
	var seed_value := int(cfg["seed"]) if cfg.has("seed") else 20260927
	var waves := WaveTable.plan(20260927)
	print("=== tune profile=%s ===" % which)
	var shield := ShipTable.SHIELD_MAX
	var hull := ShipTable.HULL_MAX
	var elapsed_total := 0.0
	for w in waves:
		var lineup: Array = w["spawns"]
		var rng := SimRng.new(20260927 + int(w["index"]) * 7919)
		var run := CombatModel.sim_wave(lineup, cfg, rng, float(w["spawn_interval"]))
		var dmg := float(run["damage"])
		var absorbed := minf(shield, dmg)
		shield -= absorbed
		hull -= dmg - absorbed
		elapsed_total += float(run["elapsed"])
		print("W%d dmg=%6.1f elapsed=%5.1fs shield=%5.1f hull=%5.1f" % [
			int(w["index"]), dmg, float(run["elapsed"]), shield, hull,
		])
		if hull <= 0.0:
			print("阵亡于 W%d（累计 %.1f 分）" % [int(w["index"]), elapsed_total / 60.0])
			quit(1)
			return
		shield = minf(ShipTable.SHIELD_MAX, shield + ShipTable.SHIELD_RESTORE_PER_WAVE)
		hull = minf(ShipTable.HULL_MAX, hull + ShipTable.HULL_REPAIR_PER_WAVE)
	print("存活：shield=%.1f hull=%.1f 总时长 %.1f 分" % [
		shield, hull, (elapsed_total + 4.0 * WaveTable.WAVE_GAP) / 60.0,
	])
	quit(0)
