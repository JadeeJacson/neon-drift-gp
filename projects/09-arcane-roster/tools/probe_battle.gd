@tool
extends SceneTree
## 单场战斗探针：构造指定编成，跑一场，把事件流与结算打出来。
## 用途有两个：
##   1. 调平衡时看清「这一场为什么打成 120s 超时」——比看跑分表有用得多；
##   2. 战斗逻辑出问题时，第一现场就是这里的 tick/事件序列。
##
## 用法（lab 根）：
##   ... --headless --path projects/09-arcane-roster -s res://tools/probe_battle.gd -- \
##       --ally=knight@1,sk_minion@1,mage@1 --enemy=e_bone@1,e_archer@1 --seed=1 --events=40

const DEMOS := {
	"mirror": [
		["knight@1", "barbarian@1", "mage@1"],
		["e_knight@1", "e_bone@1", "e_archer@1"],
	],
	"tank_vs_swarm": [
		["knight@1", "sk_warrior@1", "sk_minion@1"],
		["e_swarm@1", "e_swarm@1", "e_swarm@1", "e_swarm@1"],
	],
	"glass": [
		["hooded@1", "mage@1", "rogue@1"],
		["e_titan@1", "e_knight@1", "e_titan@1"],
	],
	"empty_ally": [
		[],
		["e_bone@1", "e_archer@1"],
	],
	"boss": [
		["knight@2", "barbarian@2", "mage@1", "rogue@1"],
		["b_sking@1", "e_bone@1", "e_bone@1", "e_archer@1"],
	],
}


func _initialize() -> void:
	var args := _args()
	var seed_value := int(args.get("seed", 1))
	var event_cap := int(args.get("events", 30))
	var tag := String(args.get("demo", ""))

	print("=== 09 单场战斗探针 ===")
	if args.has("ally") or args.has("enemy"):
		print("自定义编成：")
		_run(String(args.get("ally", "")), String(args.get("enemy", "")), seed_value, event_cap)
		return
	for name in DEMOS:
		if tag != "" and tag != String(name):
			continue
		print("--- %s ---" % String(name))
		var demo: Array = DEMOS[name]
		_run(_join(demo[0]), _join(demo[1]), seed_value, event_cap)
	quit()


func _join(list: Array) -> String:
	var parts: PackedStringArray = []
	for s in list:
		parts.append(String(s))
	return ",".join(parts)


func _run(ally_str: String, enemy_str: String, seed_value: int, event_cap: int) -> void:
	var rs := RunState.new(seed_value)
	var ally: Array = []
	for i in range(rs.board_defs().size()):
		pass
	ally = _parse(ally_str, true)
	var enemy := _parse(enemy_str, false)
	var bonus := Traits.bonuses(ally)
	var sim := BattleSim.new(ally, enemy, seed_value, bonus)
	var r := sim.run()
	print("  阵容：我方 %s | 敌方 %s" % [_names(ally), _names(enemy)])
	print("  结算：%s  tick=%d(%.1fs) timeout=%s  存活 %d vs %d  残血比 %.2f vs %.2f  事件 %d" % [
		"胜" if int(r["winner"]) == 0 else "负",
		int(r["ticks"]), float(r["duration"]), "是" if bool(r["timeout"]) else "否",
		int(r["ally_alive"]), int(r["enemy_alive"]),
		float(r["ally_ratio"]), float(r["enemy_ratio"]), int(r["events"]),
	])
	var shown := 0
	for e in sim.events:
		if shown >= event_cap:
			break
		var ev: Dictionary = e
		shown += 1
		var a_name := "-"
		var b_name := "-"
		if int(ev["a"]) >= 0 and int(ev["a"]) < sim.units.size():
			a_name = String(sim.units[int(ev["a"])]["display"])
		if int(ev["b"]) >= 0 and int(ev["b"]) < sim.units.size():
			b_name = String(sim.units[int(ev["b"])]["display"])
		print("    t%-4d %-9s %s → %s  v=%.0f%s" % [
			int(ev["t"]), String(ev["k"]), a_name, b_name, float(ev["v"]),
			" 暴击" if bool(ev["crit"]) else "",
		])


func _parse(spec: String, is_ally: bool) -> Array:
	var out: Array = []
	var occ: Dictionary = {}
	if spec.strip_edges() == "":
		return out
	for token in spec.split(",", false):
		var parts := String(token).split("@")
		var id := String(parts[0])
		var star := int(parts[1]) if parts.size() > 1 else 1
		var side := Board.ALLY if is_ally else Board.ENEMY
		var cell := Board.auto_place_cell(side, occ)
		occ[cell] = id
		out.append({"id": id, "star": star, "cell": cell})
	return out


func _names(defs: Array) -> String:
	var parts: PackedStringArray = []
	for d in defs:
		var e: Dictionary = d
		parts.append("%s%s★@%s" % [
			UnitTable.display(String(e["id"])) if UnitTable.has_id(String(e["id"])) else EnemyTable.display(String(e["id"])),
			str(int(e["star"])), str(e["cell"]),
		])
	return ", ".join(parts)


func _args() -> Dictionary:
	var out: Dictionary = {}
	for a in OS.get_cmdline_user_args():
		if not a.begins_with("--"):
			continue
		var kv := a.substr(2).split("=", true, 1)
		out[String(kv[0])] = String(kv[1]) if kv.size() > 1 else "1"
	return out
