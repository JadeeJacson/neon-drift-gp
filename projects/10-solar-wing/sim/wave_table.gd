extends RefCounted
class_name WaveTable
## 5 波编成 + 出怪时刻表（设计单一源）。
## 编成固定（可断言），出怪顺序与角度由 SimRng 决定（换种子换体感，不换难度）。

const WAVE_COUNT := 5
const SPAWN_INTERVAL := 3.0   # 每 3 秒放一架（导演出怪节奏）
const ALIVE_CAP := 5          # 同屏上限：后排排队，不全程开火
const WAVE_GAP := 28.0        # 波间整备：简报 + 护盾回充
const CLEAR_BONUS := 500

## 每波编成（interceptor / drone / bomber）
const COMPOSITION := [
	{"interceptor": 6, "drone": 0, "bomber": 0},
	{"interceptor": 7, "drone": 3, "bomber": 0},
	{"interceptor": 8, "drone": 4, "bomber": 1},
	{"interceptor": 9, "drone": 5, "bomber": 2},
	{"interceptor": 11, "drone": 6, "bomber": 3},
]


## 生成整局计划。返回每波：
## {index(1 基), spawns: Array[String], angles: Array[float],
##  spawn_interval, clear_bonus, counts: Dictionary, total: int}
static func plan(seed_value: int = 20260927) -> Array:
	var rng := SimRng.new(seed_value)
	var waves: Array = []
	for i in range(WAVE_COUNT):
		var comp: Dictionary = COMPOSITION[i]
		var spawns: Array = []
		for kind in ["interceptor", "drone", "bomber"]:
			for _n in range(int(comp[kind])):
				spawns.append(kind)
		# 洗牌：无人机与轰炸机不许排队尾，压力要摊在整波里
		for j in range(spawns.size() - 1, 0, -1):
			var k := rng.next_int() % (j + 1)
			var tmp: String = spawns[j]
			spawns[j] = spawns[k]
			spawns[k] = tmp
		var angles: Array = []
		for _s in spawns:
			angles.append(rng.rangef(0.0, TAU))
		waves.append({
			"index": i + 1,
			"spawns": spawns,
			"angles": angles,
			"spawn_interval": SPAWN_INTERVAL,
			"clear_bonus": CLEAR_BONUS,
			"counts": comp.duplicate(),
			"total": spawns.size(),
		})
	return waves


## 全局敌机总数（跑分/文档用）。
static func total_enemies() -> int:
	var n := 0
	for comp in COMPOSITION:
		for kind in comp:
			n += int(comp[kind])
	return n
