class_name Waves
extends RefCounted

# 12 波强度曲线。每波是若干「批」，每批 {id, n, gap}：n 只同种敌人、间隔 gap 秒。

const TOTAL: int = 12
const BUILD_TIME: float = 20.0  # 波间建造阶段时长（秒）

# 强度（hp+盾 × (1+armor) 之和）必须单调递增，由 sim/tests/test_combat.gd 断言。
# 历史上第一版表格有 4 处回落（第 5/7/10/12 波），是被那条断言抓出来的——
# 「强度曲线单调」这种事靠肉眼扫表是看不出来的。
const WAVES: Array = [
	[{"id": "drone", "n": 10, "gap": 0.8}],                                                        # 300
	[{"id": "drone", "n": 16, "gap": 0.7}],                                                        # 480
	[{"id": "drone", "n": 12, "gap": 0.7}, {"id": "tank", "n": 1, "gap": 2.0}],                    # 750
	[{"id": "drone", "n": 14, "gap": 0.65}, {"id": "tank", "n": 2, "gap": 1.8}],                   # 1200
	[{"id": "tank", "n": 4, "gap": 1.6}, {"id": "drone", "n": 16, "gap": 0.6}],                    # 2040
	[{"id": "shield_mech", "n": 4, "gap": 1.6}, {"id": "tank", "n": 3, "gap": 1.7}],               # 2610
	[{"id": "tank", "n": 6, "gap": 1.4}, {"id": "repair", "n": 2, "gap": 2.6},
	 {"id": "bomber", "n": 4, "gap": 1.1}],                                                        # 2884
	[{"id": "shield_mech", "n": 6, "gap": 1.4}, {"id": "tank", "n": 4, "gap": 1.6}],               # 3720
	[{"id": "tank", "n": 8, "gap": 1.3}, {"id": "shield_mech", "n": 3, "gap": 1.5},
	 {"id": "repair", "n": 2, "gap": 2.4}],                                                        # 4464
	[{"id": "shield_mech", "n": 10, "gap": 1.25}, {"id": "tank", "n": 6, "gap": 1.45},
	 {"id": "bomber", "n": 8, "gap": 0.95}],                                                       # 6915
	[{"id": "tank", "n": 12, "gap": 1.15}, {"id": "shield_mech", "n": 8, "gap": 1.25},
	 {"id": "repair", "n": 4, "gap": 2.0}],                                                        # 8424
	[{"id": "walker", "n": 2, "gap": 3.0}, {"id": "tank", "n": 10, "gap": 1.25},
	 {"id": "shield_mech", "n": 6, "gap": 1.3}, {"id": "drone", "n": 24, "gap": 0.42}],            # 12236
]


# 把第 wave 波（1-based）展开成生成计划 [{t, id}]，按时间升序
static func spawn_plan(wave: int) -> Array:
	var plan: Array = []
	var w: int = clampi(wave - 1, 0, WAVES.size() - 1)
	var batches: Array = WAVES[w]
	var offset: float = 0.0
	for b in batches:
		var d: Dictionary = b as Dictionary
		var eid: String = String(d["id"])
		var n: int = int(d["n"])
		var gap: float = float(d["gap"])
		for i in range(n):
			plan.append({"t": offset + gap * float(i), "id": eid})
		# 批次之间留一点错开，让同波不同兵种有层次
		offset += 1.5
	plan.sort_custom(func(a, b):
		return float(a["t"]) < float(b["t"])
	)
	return plan


# 整波的名义强度（用于 sim 断言「强度单调」）
static func wave_power(wave: int) -> float:
	var plan: Array = spawn_plan(wave)
	var p: float = 0.0
	for e in plan:
		var d: Dictionary = e as Dictionary
		var eid: String = String(d["id"])
		var def: Dictionary = Defs.enemy(eid)
		var hp: float = float(def["hp"]) + float(def["shield"])
		p += hp * (1.0 + float(def["armor"]))
	return p
