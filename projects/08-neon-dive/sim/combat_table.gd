extends RefCounted
## 招式表、敌型表与资源收支（docs/08-立项 §3.2、§3.3）。
##
## 纯数据 + 纯函数：不碰场景树、不碰物理，所以全部能在 GUT 里逐值断言。
## 帧数一律按 60fps 基准写整数（同 MovementParams 的理由：手感是帧的函数）。
##
## 设计意图（改数值前先读这段，测试就是照它写的）：
## - 轻击三连是主输出，第三段是「位移+击退」的收尾，用来脱离贴身；
## - 蓄力重击打重装，代价是 PWR 与长后摇，不能当主输出用；
## - 弹反是**收益最高**的近身解（回电最多、还给敌人硬直 → 打开处决窗口），
##   这是「逼玩家进攻而不是龟缩」的那颗螺丝；
## - 处决只对硬直目标生效，回氧——氧是时间预算，所以「打得准 = 有更多时间」。
class_name CombatTable

const FRAME := 1.0 / 60.0

## 玩家招式。startup=挥不出判定的前摇，active=判定窗，recovery=收不回来的后摇（帧）
const ATTACKS := {
	"light_1": {
		"display": "轻击一段", "startup": 4, "active": 4, "recovery": 6,
		"damage": 18.0, "knockback": 25.0, "power_cost": 0.0, "power_gain": 4.0,
		"reach": 26.0, "chain_window": 20, "next": "light_2",
	},
	"light_2": {
		"display": "轻击二段", "startup": 3, "active": 4, "recovery": 7,
		"damage": 18.0, "knockback": 25.0, "power_cost": 0.0, "power_gain": 4.0,
		"reach": 26.0, "chain_window": 20, "next": "light_3",
	},
	"light_3": {
		"display": "轻击三段", "startup": 6, "active": 5, "recovery": 14,
		"damage": 30.0, "knockback": 220.0, "power_cost": 0.0, "power_gain": 6.0,
		"reach": 30.0, "chain_window": 0, "next": "",
	},
	"heavy": {
		"display": "蓄力重击", "startup": 6, "active": 6, "recovery": 18,
		"damage": 55.0, "damage_min": 22.0, "knockback": 300.0,
		"power_cost": 25.0, "power_gain": 9.0, "reach": 34.0,
		"charge_frames": 12, "chain_window": 0, "next": "",
	},
	"execute": {
		"display": "处决", "startup": 5, "active": 4, "recovery": 12,
		"damage": 9999.0, "knockback": 0.0, "power_cost": 0.0, "power_gain": 0.0,
		"reach": 24.0, "chain_window": 0, "next": "", "o2_reward": 18.0,
	},
	# 远程走同一套前摇/判定/后摇状态机，不然会多出一套调不动的时序
	"ranged": {
		"display": "飞鳌（远程）", "startup": 6, "active": 1, "recovery": 14,
		# 伤害 12→20：初版算下来远程 dps 只有近战的 0.275，低到「不值得带」。
		# 目标区间 0.35–0.85：比近战弱（要承担风险），但别弱到没人用
		"damage": 20.0, "knockback": 40.0, "power_cost": 14.0, "power_gain": 0.0,
		"reach": 0.0, "chain_window": 0, "next": "", "cooldown_frames": 34,
	},
}

## 轻一二段的 knockback 故意只给 25（相于「撑一下」）：
## 冒烟测试发现 60/50 会把敌人推出 26px 的射程，导致第三段空挥——
## 「连招把自己打空」在手感上是不可接受的，脱离贴身是三段（220）的职责。
const PARRY := {
	# 起手 2→1、窗口 8→12：制作人实跑反馈「弹反不好用」。
	# 8 帧（0.13s）比人类反应极限还短，那不是技巧而是赌；现在给到 0.2s
	"startup": 1, "window": 12, "recovery": 10,
	"power_cost": 12.0, "power_gain": 14.0, "stun_frames": 45,
	# 反射飞行道具时的伤害倍率。写在表里而不是硬编码在弹丸里：
	# 它是「弹反 vs 远程」的唯一奖励，必须能被断言与调参
	"reflect_mult": 1.5,
}

## 远程弹道参数（时序与伤害在 ATTACKS["ranged"]，避免两处数字漂）
const PLAYER_RANGED := {
	"projectile_speed": 300.0, "lifetime_frames": 90, "radius": 5.0,
}

## 敌型。tell_frames 是「攻击前摇」，也是玩家弹反的读条窗口
const ENEMIES := {
	"crawler": {
		"display": "裂爪 crawler", "hp": 40.0, "speed": 60.0,
		"contact_damage": 12.0,
		# 前摇 14→20 帧（0.33s）。人类反应约 0.25s，14 帧根本读不到，
		# 再上「完全没有视觉预告」就是制作人说的「看不到前摇」
		"tell_frames": 20, "active_frames": 6,
		"attack_cooldown_frames": 60, "engage_range": 22.0,
		# 击杀回氧 6→10→**2**：上一轮为了救排序把它提到 10，结果加了远程之后
		# 苟守流中位从 6 跳到 10、反超普通（跑分实测，远程占 71%）。
		# 根因是「只要打到就有氧」让零风险刷怪成了最优解。现在按 §3.3 的原意改回来：
		# **氧来自「打得准」（弹反→处决给 18），不是来自「打到」**
		"power_reward": 18.0, "o2_reward": 2.0, "threat": 1.0,
	},
	# 敌型 2：远程喷子。不贴脸，保持距离吐弹——它同时是「弹反」的新标的
	"spitter": {
		"display": "喷刺 spitter", "hp": 28.0, "speed": 42.0,
		"contact_damage": 8.0,
		"tell_frames": 26, "active_frames": 4,
		"attack_cooldown_frames": 96, "engage_range": 200.0,
		"preferred_range": 130.0,     # 靠得太近会后撤：远程怪的本职就是拉开距离
		"power_reward": 16.0, "o2_reward": 2.0, "threat": 1.2,
		"projectile": {
			"damage": 14.0, "speed": 190.0, "lifetime_frames": 150, "radius": 5.0,
		},
	},
}

const ECONOMY := {
	"hp_max": 100.0,
	"o2_max": 100.0,
	"power_max": 100.0,
	"o2_drain_per_second": 1.6,       # 每层的时间预算：满氧约 62 秒
	"o2_drown_damage_per_second": 8.0,  # 氧空后掉血，约 12 秒死
	"dash_power_cost": 10.0,
}

## 玩家受击无敌帧（横版动作的底线：没有 i-frame，被两只以上围住就是必死）
const INVULN_FRAMES := 24


static func attack(id: String) -> Dictionary:
	return ATTACKS[id]


static func enemy(id: String) -> Dictionary:
	return ENEMIES[id]


static func attack_ids() -> Array:
	return ATTACKS.keys()


static func total_frames(id: String) -> int:
	var a: Dictionary = ATTACKS[id]
	return int(a["startup"]) + int(a["active"]) + int(a["recovery"])


static func total_seconds(id: String) -> float:
	return total_frames(id) * FRAME


## 蓄力重击的实际伤害：没到 charge_frames 只给保底值，满了给满值（线性插值）
static func heavy_damage(held_frames: int) -> float:
	var a: Dictionary = ATTACKS["heavy"]  # 写了类型就不能再用 :=（两者语法冲突）
	var need: int = int(a["charge_frames"])
	var lo: float = float(a["damage_min"])
	var hi: float = float(a["damage"])
	if held_frames >= need:
		return hi
	return lerpf(lo, hi, clampf(float(held_frames) / float(need), 0.0, 1.0))


## 打死一个敌人需要几段。返回需要的命中次数
static func hits_to_kill(attack_id: String, enemy_id: String) -> int:
	var dmg: float = float(attack(attack_id)["damage"])
	var hp: float = float(enemy(enemy_id)["hp"])
	if dmg <= 0.0:
		return 999999
	return int(ceil(hp / dmg))


## 从第一次起手到击杀的总帧数（含每段的完整周期，最后一段算到判定窗中点）
static func ttk_frames(attack_id: String, enemy_id: String) -> float:
	var a: Dictionary = attack(attack_id)
	var n := hits_to_kill(attack_id, enemy_id)
	var per := float(a["startup"] + a["active"] + a["recovery"])
	var last := float(a["startup"]) + float(a["active"]) * 0.5
	return per * float(n - 1) + last


## 弹反判定：玩家在敌人 active 帧之前 press，且窗口覆盖到那一刻才算成功。
## 写成纯函数是为了能在 headless 里逐条断言「公平性」——这是手感里最难调的一项。
static func parry_success(press_frame: int, enemy_active_frame: int) -> bool:
	var open_from := press_frame + int(PARRY["startup"])
	var open_to := open_from + int(PARRY["window"])
	return enemy_active_frame >= open_from and enemy_active_frame <= open_to


## 敌人攻击的「可读窗」：前摇多少帧够不够玩家反应（人类反应约 0.25s = 15 帧）
static func parry_margin_frames(enemy_id: String) -> int:
	return int(enemy(enemy_id)["tell_frames"]) - int(PARRY["startup"])


## 命中给电、击杀给电与氧：进攻收益的总账
static func power_gain(attack_id: String) -> float:
	return float(attack(attack_id)["power_gain"])


static func kill_reward(enemy_id: String) -> Dictionary:
	var e: Dictionary = enemy(enemy_id)
	return {"power": float(e["power_reward"]), "o2": float(e["o2_reward"])}


## 弹反回电 / 轻击回电：这个比值就是「鼓励贴身读招」的力度
static func parry_power_gain_ratio() -> float:
	return float(PARRY["power_gain"]) / power_gain("light_1")


## 一次「弹反 → 处决」循环的净收支：这是本作鼓励的核心动作，必须明显优于对砍
static func parry_execute_cycle() -> Dictionary:
	var gain_power: float = float(PARRY["power_gain"]) + power_gain("light_1")
	var net_power := gain_power - float(PARRY["power_cost"])
	return {
		"net_power": net_power,
		"net_o2": float(attack("execute")["o2_reward"]),
		"cycles_to_full_power_from_half": 1,
	}


## 设计区间：docs/08 §3.2/§3.3 的意图翻译成可断言的数
static func design_bands() -> Dictionary:
	return {
		"light_1_ttk_seconds_crawler": [0.35, 1.20],
		"light_3_total_seconds": [0.30, 0.55],
		"heavy_total_seconds": [0.40, 0.75],
		"heavy_full_over_light_single": [2.5, 4.5],
		"parry_margin_frames": [14, 24],
		"parry_window_frames": [10, 16],
		"parry_power_gain_vs_light": [2.0, 5.0],
		"kill_power_vs_dash_cost": [1.4, 2.6],
		"o2_layer_seconds": [45, 90],
		"drown_death_seconds": [8, 20],
		# 远程的两条约束：比近战安全但 dps 更低，否则没人用近战（也没人承担风险）
		"ranged_dps_vs_light_chain": [0.35, 0.85],
		"ranged_total_frames": [18, 30],
		"spitter_tell_frames": [20, 34],
		"spitter_shot_interval_seconds": [1.2, 2.2],
	}


static func measured() -> Dictionary:
	var light_ttk: float = ttk_frames("light_1", "crawler") * FRAME
	var heavy: Dictionary = attack("heavy")
	var sp := enemy("spitter")
	return {
		"light_1_ttk_seconds_crawler": light_ttk,
		"light_3_total_seconds": total_seconds("light_3"),
		"heavy_total_seconds": total_seconds("heavy"),
		"heavy_full_over_light_single": float(heavy["damage"]) / float(attack("light_1")["damage"]),
		"parry_margin_frames": parry_margin_frames("crawler"),
		"parry_window_frames": int(PARRY["window"]),
		"parry_power_gain_vs_light": float(PARRY["power_gain"]) / power_gain("light_1"),
		"kill_power_vs_dash_cost": float(enemy("crawler")["power_reward"]) / float(ECONOMY["dash_power_cost"]),
		"o2_layer_seconds": float(ECONOMY["o2_max"]) / float(ECONOMY["o2_drain_per_second"]),
		"drown_death_seconds": float(ECONOMY["hp_max"]) / float(ECONOMY["o2_drown_damage_per_second"]),
		"ranged_dps_vs_light_chain": ranged_dps() / light_dps(),
		"ranged_total_frames": total_frames("ranged"),
		"spitter_tell_frames": int(sp["tell_frames"]),
		"spitter_shot_interval_seconds": float(sp["attack_cooldown_frames"]) * FRAME,
	}


## 飞鳌的单发 dps（含后摇与冷却，取两者较大值作为实际节奏）
static func ranged_dps() -> float:
	var a: Dictionary = ATTACKS["ranged"]
	var cycle: float = float(maxi(total_frames("ranged"), int(a["cooldown_frames"])))
	return float(a["damage"]) / (cycle * FRAME)


## 轻击一段的 dps，作为「远程该比近战弱多少」的参照
static func light_dps() -> float:
	return float(attack("light_1")["damage"]) / total_seconds("light_1")


static func report() -> String:
	var lines: Array[String] = []
	var m := measured()
	for key in m:
		var band: Array = design_bands()[key]
		var v: float = float(m[key])
		var ok: bool = v >= float(band[0]) and v <= float(band[1])
		lines.append("  %-34s %7.2f  区间 %.2f–%.2f  %s"
				% [key, v, float(band[0]), float(band[1]), "OK" if ok else "越界"])
	return "\n".join(lines)
