extends RefCounted
class_name Traits
## 羁绊（docs/09-立项 §2.4）。纯函数：给一份上阵单位列表，算出激活了哪些羁绊、加成多少。
##
## KayKit 素材天然给了两个族群（Adventurers = 圣团，Skeletons = 亡者军团），
## 所以羁绊第一层按「阵营」分，第二层按「站位职能」分（近战/远程），
## 第三层是「同星级」这种跨阵营的隐性羁绊。
##
## 设计意图：**9 个模型要撑出 10+ 种可玩阵容，靠的就是这一层。**
## 没有羁绊，玩家最优解会收敛成「6 个最贵的 3★」，一局下来只有一种玩法；
## 有了羁绊，「5 个 1★ 凑亡者军团」和「3 个 3★ 纯战力」成为两条都成立的路线。
##
## 加成一律用**百分比**（除护甲是固定值），因为固定值加成会被高星级的基数放大，
## 导致「高星阵容滚雪球」——那是自走棋最常见的失衡来源。

const DEFS := [
	{
		"id": "order", "name": "圣团", "kind": "faction", "tag": "order",
		"tiers": [
			{"need": 2, "atk_pct": 0.10},
			{"need": 4, "atk_pct": 0.25, "hp_pct": 0.25},
			{"need": 6, "atk_pct": 0.50, "hp_pct": 0.50},
		],
		"desc": "圣团成员达到 2/4/6 人时全员属性提升（专精一族的收益高于两边都要）",
	},
	{
		"id": "undead", "name": "亡者军团", "kind": "faction", "tag": "skeleton",
		"tiers": [
			{"need": 2, "atk_pct": 0.20},
			{"need": 4, "atk_pct": 0.40, "dodge_add": 0.03},
		],
		"desc": "骷髅达到 2/4 人时全员提升，4 人时全体闪避 +3%",
	},
	{
		"id": "vanguard", "name": "近卫", "kind": "role", "tag": "front",
		"tiers": [
			{"need": 3, "armor_flat": 3.0},
			{"need": 5, "armor_flat": 6.0},
		],
		"desc": "前排近战达到 3/5 人时全体护甲提升",
	},
	{
		"id": "volley", "name": "齐射", "kind": "role", "tag": "back",
		"tiers": [
			{"need": 3, "interval_pct": -0.15},
		],
		"desc": "远程单位达到 3 人时全体攻速 +15%",
	},
	{
		"id": "constellation", "name": "星辉", "kind": "star",
		"tiers": [
			{"need": 6, "atk_pct": 0.10},
		],
		"desc": "同星级单位达到 5 个时全员攻击 +12%（奖励「不升星换羁绊」的路线）",
	},
]

## 空加成表：所有函数在无羁绊时都必须返回它，且是**新字典**（调用方会往里写）
static func empty_bonus() -> Dictionary:
	return {
		"atk_pct": 0.0, "hp_pct": 0.0, "armor_flat": 0.0,
		"interval_pct": 0.0, "dodge_add": 0.0,
	}


## units: Array[Dictionary]，每项至少有 id（单位 id）与 star
## 返回 [{id, name, kind, tier, need, tag, desc}]，按 DEFS 顺序，确定性
static func active(units: Array) -> Array:
	var out: Array = []
	for d in DEFS:
		var count := 0
		for u in units:
			if not _matches(d, u):
				continue
			count += 1
		var tiers: Array = d["tiers"]
		var hit := -1
		for ti in range(tiers.size()):
			var t: Dictionary = tiers[ti]
			if count >= int(t["need"]):
				hit = ti
		if hit < 0:
			continue
		out.append({
			"id": String(d["id"]),
			"name": String(d["name"]),
			"kind": String(d["kind"]),
			"tag": String(d["tag"]),
			"tier": hit + 1,
			"need": int(tiers[hit]["need"]),
			"count": count,
			"desc": String(d["desc"]),
		})
	return out


static func _matches(def: Dictionary, unit: Dictionary) -> bool:
	var kind := String(def["kind"])
	if kind == "faction":
		return UnitTable.faction(String(unit["id"])) == String(def["tag"])
	if kind == "role":
		return UnitTable.role(String(unit["id"])) == String(def["tag"])
	return int(unit["star"]) >= int(def["tiers"][0]["need"])


## 汇总加成。同一羁绊只取**最高档**（不叠加多档），跨羁绊才相加。
static func bonuses(units: Array) -> Dictionary:
	var total := empty_bonus()
	for a in active(units):
		for d in DEFS:
			if String(d["id"]) != String(a["id"]):
				continue
			var tiers: Array = d["tiers"]
			var t: Dictionary = tiers[int(a["tier"]) - 1]
			total["atk_pct"] = float(total["atk_pct"]) + float(t.get("atk_pct", 0.0))
			total["hp_pct"] = float(total["hp_pct"]) + float(t.get("hp_pct", 0.0))
			total["armor_flat"] = float(total["armor_flat"]) + float(t.get("armor_flat", 0.0))
			total["interval_pct"] = float(total["interval_pct"]) + float(t.get("interval_pct", 0.0))
			total["dodge_add"] = float(total["dodge_add"]) + float(t.get("dodge_add", 0.0))
	return total


## 报告与 UI 用的紧凑描述，如「圣团 II · 亡者军团 I」
static func summary(units: Array) -> String:
	var parts: PackedStringArray = []
	for a in active(units):
		parts.append("%s %s" % [String(a["name"]), roman(int(a["tier"]))])
	return ", ".join(parts)


static func roman(n: int) -> String:
	match n:
		1: return "I"
		2: return "II"
		3: return "III"
	return str(n)
