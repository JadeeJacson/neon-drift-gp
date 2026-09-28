extends RefCounted
class_name SimRng
## 09 的确定性随机源。
##
## 为什么不直接用引擎 RNG：整局跑分（docs/09-立项 §3）要求「同种子必然同结果」，
## 而 randi()/randf() 的实现细节属于引擎内部，跨版本不保证。sim 层自写 LCG 后，
## 任何一局都能在 tests 里逐帧复现；场景层拿到的也只是「已经决定好的事件序列」。
##
## 判据：凡进入 sim/ 的随机，一律从这里出；scripts/ 里不许出现 randf()。

var _state: int

const MULTIPLIER := 1664525
const INCREMENT := 1013904223
const MODULUS := 4294967296  # 2^32，用 int 模拟 32 位无符号运算


func _init(seed_value: int = 20260927) -> void:
	_state = absi(seed_value) % MODULUS
	if _state == 0:
		_state = 20260927  # 0 是 LCG 的不动点，必须躲开


func next_int() -> int:
	_state = (_state * MULTIPLIER + INCREMENT) % MODULUS
	return _state


## [0,1) 均匀分布
func next_float() -> float:
	return float(next_int()) / float(MODULUS)


## 闭区间整数
func range_i(from_i: int, to_i: int) -> int:
	if to_i <= from_i:
		return from_i
	return from_i + (next_int() % (to_i - from_i + 1))


## 概率判定，p<=0 恒假、p>=1 恒真（省掉调用点的边界判断）
func chance(p: float) -> bool:
	if p <= 0.0:
		return false
	if p >= 1.0:
		return true
	return next_float() < p


func pick(items: Array):
	return items[range_i(0, items.size() - 1)]


## Fisher-Yates。返回新数组，不改入参（sim 层处处避免意外别名）
func shuffled(items: Array) -> Array:
	var out: Array = items.duplicate()
	for i in range(out.size() - 1, 0, -1):
		var j := range_i(0, i)
		var tmp = out[i]
		out[i] = out[j]
		out[j] = tmp
	return out


## 权重表抽样：weights = {key: w}，w <= 0 的项不参与
func pick_weighted(weights: Dictionary):
	var total := 0.0
	for k in weights:
		total += maxf(0.0, float(weights[k]))
	if total <= 0.0:
		return null
	var target := next_float() * total
	var acc := 0.0
	for k in weights:
		acc += maxf(0.0, float(weights[k]))
		if target < acc:
			return k
	return weights.keys()[weights.size() - 1]
