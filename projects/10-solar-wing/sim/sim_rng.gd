extends RefCounted
class_name SimRng
## 自写确定性 LCG（沿用 06 §4.3 教训）：sim 层的可复现性不依赖引擎 RNG。
## 凡进入逐帧断言的随机，一律走这里。

var _state: int

const MULTIPLIER := 1664525
const INCREMENT := 1013904223
const MODULUS := 0x100000000  # 2^32


func _init(seed_value: int = 20260927) -> void:
	_state = seed_value % MODULUS


func next_int() -> int:
	_state = (_state * MULTIPLIER + INCREMENT) % MODULUS
	return _state


## [0,1) 均匀分布。
func next_float() -> float:
	return float(next_int()) / float(MODULUS)


func roll(p: float) -> bool:
	return next_float() < p


## [a,b) 均匀区间。
func rangef(a: float, b: float) -> float:
	return a + next_float() * (b - a)
