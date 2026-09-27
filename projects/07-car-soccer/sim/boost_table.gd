extends RefCounted
## boost_table.gd — boost 经济数值表（纯数据 + 纯函数，可逐条断言）。
## 结构参照 Rocket League（满 100 / 消耗 ~33/s / 大 pad 补满 / 小 pad +12），
## 具体取值按 07 的车与球场尺度调，出处 docs/07-选型-载具足球.md §2.4。

const MAX_BOOST := 100.0
const CONSUME_PER_SEC := 33.0
const SMALL_PAD_AMOUNT := 12.0
const BIG_PAD_AMOUNT := 100.0
const SMALL_PAD_RESPAWN := 4.0
const BIG_PAD_RESPAWN := 10.0


static func clamp_amount(v: float) -> float:
	return clampf(v, 0.0, MAX_BOOST)


static func consumed(current: float, dt: float) -> float:
	return clamp_amount(current - CONSUME_PER_SEC * dt)


static func picked_up(current: float, is_big: bool) -> float:
	var amount := BIG_PAD_AMOUNT if is_big else SMALL_PAD_AMOUNT
	return clamp_amount(current + amount)


static func respawn_time(is_big: bool) -> float:
	return BIG_PAD_RESPAWN if is_big else SMALL_PAD_RESPAWN
