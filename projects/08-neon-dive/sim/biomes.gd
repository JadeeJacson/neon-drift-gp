extends RefCounted
class_name Biomes
## 关卡特异性：按深度分带的生物群系（docs/08 §3.4）。
##
## 为什么做成数据表而不是在 LevelRoom 里写 if：
## 「关卡长得不一样」和「关卡玩起来不一样」必须是同一份定义，否则调色与构成会各走各路。
## 所以一个 biome 同时给出：视觉（发光色/暗部/背景渐变/灯距）+ 结构（沟频/平台密度/高台比例）
## + 敌人配比 + 平台玩法（塌台/弹台比例）。layout_gen 与 level_room 都读这里。

## 四个群系，按 depth 顺序循环；越深的循环圈危险度越高
const BANDS := [
	{
		"id": "shelf", "display": "浅裂带",
		"glow_color": Color(0.45, 0.92, 1.0), "shadow_tint": Color(0.05, 0.09, 0.18),
		"ambient": Color(0.62, 0.68, 0.82),
		"bg_top": Color(0.10, 0.18, 0.34), "bg_bottom": Color(0.02, 0.04, 0.10),
		"lamp_spacing": 18, "lamp_energy": 1.55,
		"gap_chance": 45, "platform_min": 2, "platform_max": 4,
		"high_ratio": 0.25,          # 平台上怪物的比例：浅裂带基本都在地面
		"spitter_weight": 0, "crumble_ratio": 0.0, "bounce_ratio": 0.10,
		"enemy_base": 2,
	},
	{
		"id": "trench", "display": "无光深渊",
		"glow_color": Color(0.30, 0.65, 1.0), "shadow_tint": Color(0.02, 0.04, 0.10),
		"ambient": Color(0.46, 0.56, 0.80),
		"bg_top": Color(0.05, 0.09, 0.22), "bg_bottom": Color(0.008, 0.015, 0.05),
		"lamp_spacing": 30, "lamp_energy": 1.15,   # 灯更稀更暗：特异性靠光照做
		"gap_chance": 70, "platform_min": 3, "platform_max": 5,
		"high_ratio": 0.40,
		# 第一圈的无光深渊不出远程：它的特异性是「黑 + 沟多」，
		# 再叠上飞行道具会和读招教学抢注意力（与 layout 的「depth<3 无远程」一致）
		"spitter_weight": 0, "crumble_ratio": 0.15, "bounce_ratio": 0.18,
		"enemy_base": 3,
	},
	{
		"id": "mycelium", "display": "菌丝洞",
		"glow_color": Color(0.85, 0.45, 1.0), "shadow_tint": Color(0.07, 0.03, 0.13),
		"ambient": Color(0.62, 0.50, 0.80),
		"bg_top": Color(0.16, 0.06, 0.26), "bg_bottom": Color(0.03, 0.01, 0.07),
		"lamp_spacing": 22, "lamp_energy": 1.35,
		"gap_chance": 55, "platform_min": 4, "platform_max": 6,
		"high_ratio": 0.55,           # 平台上站一半怪：逼玩家往上打
		"spitter_weight": 30, "crumble_ratio": 0.30, "bounce_ratio": 0.34,
		"enemy_base": 3,
	},
	{
		"id": "core", "display": "反应堆",
		"glow_color": Color(1.0, 0.62, 0.28), "shadow_tint": Color(0.12, 0.04, 0.02),
		"ambient": Color(0.80, 0.62, 0.52),
		"bg_top": Color(0.24, 0.09, 0.05), "bg_bottom": Color(0.05, 0.015, 0.01),
		"lamp_spacing": 16, "lamp_energy": 1.6,
		"gap_chance": 60, "platform_min": 3, "platform_max": 5,
		"high_ratio": 0.45,
		"spitter_weight": 55, "crumble_ratio": 0.22, "bounce_ratio": 0.20,
		"enemy_base": 4,
	},
]


## 压暗色的亮度合法区间。下限是制作人实跑反馈「太暗」后定的（上一版 0.34 被打回），
## 上限是「不能亮到看不出在深海」。群系改色不能越过这两条
const AMBIENT_MIN := 0.42
const AMBIENT_MAX := 0.85


static func ambient_luma(c: Color) -> float:
	return (c.r + c.g + c.b) / 3.0


## depth → biome。第 1 圈按深度顺序走完四个群系，之后每圈整体提高危险度
static func for_depth(depth: int) -> Dictionary:
	var idx := (maxi(depth, 1) - 1) % BANDS.size()
	return BANDS[idx]


## 圈数（从 1 开始）：同一群系第二次出现时比第一次更凶
static func lap(depth: int) -> int:
	return int((maxi(depth, 1) - 1) / BANDS.size()) + 1


## 该深度的敌人配比：spitter 概率 = 群系基础值 + 每圈递增，上限 65%
static func spitter_chance(depth: int) -> int:
	var b := for_depth(depth)
	return mini(int(b["spitter_weight"]) + (lap(depth) - 1) * 12, 65)


## 平台上怪的期望比例，随圈数微涨（越深越立体）
static func high_share(depth: int) -> float:
	return minf(float(for_depth(depth)["high_ratio"]) + float(lap(depth) - 1) * 0.06, 0.7)


## 一个群系是否比另一个「看起来不一样」——给测试用：
## 两个群系的发光色距离必须足够大，否则特异性只是文案
static func palette_distance(a: Dictionary, b: Dictionary) -> float:
	var ga: Color = a["glow_color"]
	var gb: Color = b["glow_color"]
	var sa: Color = a["shadow_tint"]
	var sb: Color = b["shadow_tint"]
	return Vector3(ga.r - gb.r, ga.g - gb.g, ga.b - gb.b).length() \
			+ Vector3(sa.r - sb.r, sa.g - sb.g, sa.b - sb.b).length()


static func ids() -> Array[String]:
	var out: Array[String] = []
	for b in BANDS:
		out.append(str(b["id"]))
	return out


## 自检：结构参数必须落在合法区间，否则 layout 会生成不可玩的层
static func validate() -> Array[String]:
	var problems: Array[String] = []
	for b in BANDS:
		var bid := str(b["id"])
		if int(b["lamp_spacing"]) < 10 or int(b["lamp_spacing"]) > 40:
			problems.append(bid + " 灯距越界")
		if int(b["gap_chance"]) < 0 or int(b["gap_chance"]) > 100:
			problems.append(bid + " 沟概率不是百分比")
		if int(b["platform_min"]) > int(b["platform_max"]):
			problems.append(bid + " 平台数量上下颠倒")
		if float(b["crumble_ratio"]) + float(b["bounce_ratio"]) > 0.9:
			problems.append(bid + " 特殊平台占比过高，普通落脚台不够")
		if float(b["high_ratio"]) < 0.0 or float(b["high_ratio"]) > 0.8:
			problems.append(bid + " 高台怪物比例越界")
		var lum: float = ambient_luma(b["ambient"])
		if lum < AMBIENT_MIN or lum > AMBIENT_MAX:
			problems.append("%s 压暗亮度 %0.2f 不在 %0.2f–%0.2f（会重现「太暗」那条反馈）"
					% [bid, lum, AMBIENT_MIN, AMBIENT_MAX])
	# 特异性：任意两个群系的配色必须可区分
	for i in BANDS.size():
		for j in range(i + 1, BANDS.size()):
			if palette_distance(BANDS[i], BANDS[j]) < 0.25:
				problems.append("群系 %s / %s 配色过于接近，关卡没有特异性" % [str(BANDS[i]["id"]), str(BANDS[j]["id"])])
	return problems
