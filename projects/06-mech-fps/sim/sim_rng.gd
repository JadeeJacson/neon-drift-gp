extends RefCounted
class_name SimRng
## 自写确定性 LCG。理由：sim 层的可复现性不能依赖引擎 RNG（Godot 的 PhysicsServer 不参与
## 种子管理，见 docs/00 §4.3）。凡进入逐帧断言的随机，一律走这里。

var _state: int

const MULTIPLIER := 1664525
const INCREMENT := 1013904223
const MODULUS := 0x100000000  # 2^32


func _init(seed_value: int = 20260926) -> void:
	_state = seed_value % MODULUS


func next_int() -> int:
	_state = (_state * MULTIPLIER + INCREMENT) % MODULUS
	return _state


## [0,1) 均匀分布。
func next_float() -> float:
	return float(next_int()) / float(MODULUS)


func roll(p: float) -> bool:
	return next_float() < p


## 加权抽样：weights = {key: w}，w<=0 的项不参与。
func pick_weighted(weights: Dictionary) -> String:
	var total := 0.0
	for k in weights:
		total += maxf(0.0, float(weights[k]))
	assert(total > 0.0, "加权抽样需要正的权重总和")
	var target := next_float() * total
	var acc := 0.0
	for k in weights:
		acc += maxf(0.0, float(weights[k]))
		if target < acc:
			return String(k)
	return String(weights.keys()[weights.size() - 1])
