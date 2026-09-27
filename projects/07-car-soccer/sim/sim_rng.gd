extends RefCounted
## sim_rng.gd — 确定性 RNG（自写 LCG，不依赖引擎 RNG）。
## sim 层「同种子必然同结果」承诺的地基（路线图 §4.3）。
## glibc 风格 LCG，31 位掩码；对跑分级抽象足够，不用于任何逐帧表现逻辑。
##
## ⚠️ 命名教训（2026-09-27 实测踩坑）：方法名不要叫 `randf` / `randf_range`——
## 会撞 Godot 全局 utility 函数名。类内**裸调用** `randf()` 被解析到全局内置
## （进程随机），显式 `r.randf()` 才走成员——确定性被静默击穿，且只有裸调用
## 的路径中招，极难排查。所以本类取 `unit()` / `frange()` 这类不冲突的名字。

var _state: int


func _init(seed_value: int = 1) -> void:
	_state = seed_value & 0x7FFFFFFF
	if _state == 0:
		_state = 1


func next_u31() -> int:
	_state = (_state * 1103515245 + 12345) & 0x7FFFFFFF
	return _state


## [0, 1) 均匀分布。刻意不叫 randf()，原因见文件头。
func unit() -> float:
	return float(next_u31()) / 2147483647.0


## [lo, hi) 均匀分布。刻意不叫 randf_range()，原因见文件头。
func frange(lo: float, hi: float) -> float:
	return lo + (hi - lo) * unit()


func chance(p: float) -> bool:
	return unit() < p
