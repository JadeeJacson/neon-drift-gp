@tool
extends SceneTree
## 一次性探针：把生成器的产出量打出来（灯/敌人/平台/沟），用来定位
## 「场景里只有 1 盏灯」这类问题出在生成器还是搭建器。
##   engines/.../_console.exe --headless --path projects/08-neon-dive -s res://tools/probe_layout.gd

const LG := preload("res://sim/layout_gen.gd")


func _initialize() -> void:
	var bad := 0
	var total := 0
	var kinds := {}
	for depth in range(1, 13):
		for seed_value in [1, 42, 4242, 99991, 7, 20260927]:
			total += 1
			var plan := LG.generate(depth, seed_value)
			var problems: Array = LG.validate(plan)
			if problems.is_empty():
				continue
			bad += 1
			for p in problems:
				# 按违规类型聚合，不然日志里全是同一句（PackedStringArray 没有 back()）
				var parts: PackedStringArray = str(p).split(" ")
				var key: String = parts[parts.size() - 1]
				kinds[key] = int(kinds.get(key, 0)) + 1
	print("[probe] 扫描 %d 张图，违规 %d 张" % [total, bad])
	for k in kinds:
		print("[probe]   %s ×%d" % [k, kinds[k]])
	# 顺便打一张详细统计，看分布是不是真的在变
	for depth in [1, 2, 3, 5, 8, 12]:
		var plan := LG.generate(depth, 20260927)
		var lamps := 0
		var enemies := 0
		var spitters := 0
		var high := 0
		var plats := 0
		var special := 0
		for room in plan["rooms"]:
			lamps += int(room["lamps"].size())
			plats += int(room["platforms"].size())
			for p in room["platforms"]:
				if str(p["kind"]) != "solid":
					special += 1
			for e in room["enemies"]:
				enemies += 1
				if str(e["id"]) == "spitter":
					spitters += 1
				if int(e["y"]) < 19:
					high += 1
		print("[probe] depth=%2d 群系=%-9s 房=%d 灯=%2d 台=%2d(特殊%d) 怪=%2d(远程%d 高台%d)"
				% [depth, str(plan["biome"]), plan["rooms"].size(), lamps, plats, special,
					enemies, spitters, high])
	quit(1 if bad > 0 else 0)
