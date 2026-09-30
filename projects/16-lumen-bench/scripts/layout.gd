# 空间尺寸总表：一处改动即可重排整个观星堂
#
# 所有数值单位是米。之所以集中放这里，是因为 TA 测试要反复调尺度
# （柱距、穹顶高度、水位、开口宽度都会影响光斑与光束的观感）。
extends RefCounted

# ── 主体量 ────────────────────────────────────────────────────────────
const R_IN := 12.0          # 内壁半径
const R_OUT := 13.35        # 外壁半径
const WALL_Y0 := 0.0
const WALL_H := 12.0        # 鼓座顶 = 穹顶起坡
const WATER_Y := 0.34       # 水面高度
const FLOOR_Y := 0.0        # 厅内石地

# ── 列柱与回廊 ────────────────────────────────────────────────────────
const COL_N := 12
const COL_R := 9.7          # 柱中心所在半径
const COL_RSHAFT := 0.62    # 柱身半径
const COL_SHAFT_H := 6.30
const COL_PLINTH_H := 0.62
const COL_CAP_H := 0.78
const ENT_Y0 := 7.70        # 檐部（柱头之上的环梁）底
const ENT_Y1 := 8.55
const GALLERY_Y := 8.55     # 二层回廊地面
const BAL_H := 1.05         # 栏杆高
const ARCH_Y := 8.55        # 拱起脚
const ARCH_R := 1.62        # 拱半径（= 柱距的一半略放）

# ── 穹顶 ──────────────────────────────────────────────────────────────
const DOME_RISE := 9.2
const DOME_OCULUS := 0.17   # 圆眼占半球的比例（越大洞越大）
const DOME_RIBS := 16     # 经向 16 个凹斗列
const DOME_COFFERS := 3   # 纬向脊线参数：|sin(3πv)| → 6 圈凹斗

# ── 开口（角度用内壁参数化的 0..TAU，从 +X 向 +Z 为正）────────────────
const SUN_AZIMUTH := -0.168          # 太阳方位：atan2(sun.z, sun.x)
const SUN_ELEVATION := 0.209         # 12 度
const BREACH_CENTER := 6.115         # = SUN_AZIMUTH + TAU
const BREACH_HALF := 0.145
const BREACH_Y1 := 8.6
const ROSE_CENTER := 0.52            # 玫瑰窗所在 bay
const ROSE_HALF := 0.20
const ROSE_Y := 6.15
const ROSE_R := 2.15
const CLERESTORY := [2.30, 3.10, 3.90]   # 高侧窗角度（只进天光，做次要光束）

# ── 台地与外部 ────────────────────────────────────────────────────────
const DAIS_R := 4.30
const DAIS_Y := 0.86
const TERRAIN_R0 := 13.0
const TERRAIN_R1 := 420.0
const RIDGE_AMP := 46.0

# 太阳「指向太阳」的单位向量：光沿其反方向传播
static func sun_direction() -> Vector3:
	var e := SUN_ELEVATION
	return Vector3(cos(e) * cos(SUN_AZIMUTH), sin(e), cos(e) * sin(SUN_AZIMUTH)).normalized()


static func bay_angle(i: int) -> float:
	return TAU * float(i) / float(COL_N)
