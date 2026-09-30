# 噪声发生器薄封装：把 FastNoiseLite 包成贴图库需要的几个调用
#
# 之所以不直接到处 new FastNoiseLite：贴图生成里同一个种子要反复用
# 不同倍频/不同维度，封一层能让 tex_lab 的每个函数读起来像配方而不是 API 调用。
extends RefCounted

const FRACTAL_NONE := 0
const FRACTAL_FBM := 1
const FRACTAL_RIDGED := 2

var _n: FastNoiseLite
var _oct := 1


func _init(seed: int = 0) -> void:
	_n = FastNoiseLite.new()
	_n.seed = seed
	_n.frequency = 1.0
	_n.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH


# 设定分形叠加方式与倍频数；之后 value/fbm/warp 都走这套配置
# 用 if/elif 而不是 match：GDScript 里裸标识符当模式容易和「变量绑定模式」混起来
func fractal(kind: int, octaves: int) -> void:
	_oct = clampi(octaves, 1, 8)
	if kind == FRACTAL_NONE:
		_n.fractal_type = FastNoiseLite.FRACTAL_NONE
	elif kind == FRACTAL_FBM:
		_n.fractal_type = FastNoiseLite.FRACTAL_FBM
	else:
		_n.fractal_type = FastNoiseLite.FRACTAL_RIDGED
	_n.fractal_octaves = _oct
	_n.fractal_gain = 0.50
	_n.fractal_lacunarity = 2.05


# 单张量噪声，返回 -1..1
func value(x: float, y: float) -> float:
	return _n.get_noise_2d(x, y)


func value3(x: float, y: float, z: float) -> float:
	return _n.get_noise_3d(x, y, z)


# 多倍频叠加；fbm 走自己的八度参数，不受 fractal() 影响
func fbm(x: float, y: float, octaves: int) -> float:
	var amp := 0.5
	var freq := 1.0
	var sum := 0.0
	var norm := 0.0
	for i in clampi(octaves, 1, 8):
		sum += amp * _n.get_noise_2d(x * freq, y * freq)
		norm += amp
		amp *= 0.5
		freq *= 2.05
	if norm <= 0.0:
		return 0.0
	return sum / norm


func fbm3(x: float, y: float, z: float, octaves: int) -> float:
	var amp := 0.5
	var freq := 1.0
	var sum := 0.0
	var norm := 0.0
	for i in clampi(octaves, 1, 8):
		sum += amp * _n.get_noise_3d(x * freq, y * freq, z * freq)
		norm += amp
		amp *= 0.5
		freq *= 2.05
	if norm <= 0.0:
		return 0.0
	return sum / norm


# 域扭曲：拿噪声本身去偏移采样坐标，大理石脉络、云团边缘都靠它破掉规则感
func warp(x: float, y: float, amp: float) -> float:
	var wx := fbm(x + 5.2, y + 1.3, 3) * amp
	var wy := fbm(x - 1.7, y + 9.2, 3) * amp
	return _n.get_noise_2d(x + wx, y + wy)
