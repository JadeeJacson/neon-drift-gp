class_name Economy
extends RefCounted

# 资源循环：初始资金、波次结算、能量井产出、提前开波奖励、出售返还。

# 经济经过一轮跑分收紧（2026-09-27）：原数值下认真玩的两档画像都 100% 满血通关，
# 「火力增长快过压力增长」——塔防后期失控通常就是经济没闸。收紧后差距才谈得上难度曲线。
const START_CREDITS: int = 220


static func wave_bonus(wave: int) -> int:
	return 25 + wave * 3


static func early_bonus(remain_seconds: float) -> int:
	if remain_seconds <= 0.0:
		return 0
	return int(remain_seconds) * 2


static func sell_refund(spent: int) -> int:
	return int(float(spent) * 0.7)


# 一座塔累计投入（建造 + 升级），用于出售返还
static func tower_spent(id: String, level: int) -> int:
	var total: int = 0
	for lv in range(1, level + 1):
		total += Defs.tower_cost(id, lv)
	return total
