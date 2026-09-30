extends RefCounted
class_name MovementParams
## 主角移动的帧数预算与物理常数（docs/08-立项 §3.1、§5 sim/movement_params.gd）。
##
## 纯数据 + 纯函数，不碰场景树、不碰物理 API —— 所以能在 GUT 里逐帧/逐值断言。
## 场景层（scripts/player_controller.gd）只读这里，不散布魔数。
##
## 为什么全部按「帧」而不是「秒」写：手感是帧的函数。制作人说的「跟手」「不黏」
## 都对应整数帧窗口；写成秒就会被 delta 累加的浮点误差漂掉半帧。
## 换算一律走 TICK（固定 60fps 基准），高刷屏下表现层的 delta 变了但预算不变。

const TICK := 1.0 / 60.0
const TILE := 16.0  # Pixel Adventure / Kenney 都是 16px 网格，跳跃高度按「格」表达设计意图

# --- 重力与落体 ---
const GRAVITY := 900.0
const FALL_MULTIPLIER := 1.45      # 上升段原重力，下落段加重：让跳跃有「明确的顶」
const MAX_FALL_SPEED := 420.0

# --- 地面移动 ---
const RUN_SPEED := 170.0
const ACCEL := 1500.0
const FRICTION_GROUND := 1900.0    # 松键急停，Celeste 式「指哪停哪」
const FRICTION_AIR := 520.0        # 空中保留动量，别把跳跃变成格子戏

# --- 跳跃 ---
const JUMP_VELOCITY := 340.0       # 单跳峰值 ≈ 4.0 格，能上 3 格平台并留出余量
const JUMP_CUT_RATIO := 0.45       # 松键截断上升速度 → 短跳
const AIR_JUMPS := 1               # 二段跳
const COYOTE_FRAMES := 6           # 离地后仍可起跳
const JUMP_BUFFER_FRAMES := 8      # 落地前按跳，落地瞬间自动兑现

# --- 墙面 ---
const WALL_SLIDE_MAX_FALL := 45.0  # 贴墙下坠限速
const WALL_JUMP_VELOCITY := Vector2(150.0, 340.0)
const WALL_LOCK_FRAMES := 7        # 墙跳后短暂禁止水平输入，避免「贴墙原地抖」

# --- dash ---
const DASH_FRAMES := 12
const DASH_SPEED := 330.0
const DASH_COOLDOWN_FRAMES := 17
const DASH_INVULN_FRAMES := 11
const DASH_REFILL_ON_GROUND := true


static func frames_to_seconds(frames: int) -> float:
	return float(frames) * TICK


static func seconds_to_frames(seconds: float) -> int:
	return int(round(seconds / TICK))


## 单跳最高点多高（px）：v²/(2g)。抛物线只由这两个常数决定，所以能闭式算出来。
static func jump_apex_px() -> float:
	return JUMP_VELOCITY * JUMP_VELOCITY / (2.0 * GRAVITY)


static func jump_apex_tiles() -> float:
	return jump_apex_px() / TILE


## 松键就立刻跳的最小高度（px）：截断后初速变成 ratio*v
static func min_hop_px() -> float:
	var v := JUMP_VELOCITY * JUMP_CUT_RATIO
	return v * v / (2.0 * GRAVITY)


## 满跳滞空时间（秒）。下落段重力被 FALL_MULTIPLIER 放大，所以不能按对称抛物线算：
## 上升 t_up = v/g，下落同高度用 t_down = v/(g*fall)。
static func jump_airtime_seconds() -> float:
	var up := JUMP_VELOCITY / GRAVITY
	var down := JUMP_VELOCITY / (GRAVITY * FALL_MULTIPLIER)
	return up + down


## 满跳水平距离（px）：达到最高速后按滞空时间平推。关卡里「能不能跳过去这道沟」就是它。
static func jump_distance_px() -> float:
	return RUN_SPEED * jump_airtime_seconds()


static func jump_distance_tiles() -> float:
	return jump_distance_px() / TILE


## 二段跳在顶点接上时的总高度（px）：两段抛物线相加。
static func double_jump_apex_px() -> float:
	return jump_apex_px() + jump_apex_px()


## dash 位移（px）：匀速 × 帧数，不含惯性衰减（衰减归 M2 的战斗接合再定）。
static func dash_distance_px() -> float:
	return DASH_SPEED * frames_to_seconds(DASH_FRAMES)


static func dash_distance_tiles() -> float:
	return dash_distance_px() / TILE


## 设计区间：改常数前先过这里。区间本身的依据写在 docs/08 §3.1 与测试文件。
static func design_bands() -> Dictionary:
	return {
		"jump_apex_tiles": [3.7, 4.3],
		"min_hop_tiles": [0.7, 1.5],
		"jump_airtime_frames": [30, 46],
		"jump_distance_tiles": [5.0, 8.0],
		"dash_distance_tiles": [3.5, 5.0],
		"coyote_frames": [5, 8],
		"jump_buffer_frames": [6, 10],
		"run_tiles_per_second": [9.0, 12.0],
	}


static func measured() -> Dictionary:
	return {
		"jump_apex_tiles": jump_apex_tiles(),
		"min_hop_tiles": min_hop_px() / TILE,
		"jump_airtime_frames": jump_airtime_seconds() / TICK,
		"jump_distance_tiles": jump_distance_tiles(),
		"dash_distance_tiles": dash_distance_tiles(),
		"coyote_frames": COYOTE_FRAMES,
		"jump_buffer_frames": JUMP_BUFFER_FRAMES,
		"run_tiles_per_second": RUN_SPEED / TILE,
	}


## 打印对照表用（verify 的可选步骤 / 制作人手动跑）
static func report() -> String:
	var lines: Array[String] = []
	var m := measured()
	for key in m:
		var band: Array = design_bands()[key]
		var v: float = float(m[key])
		var ok: bool = v >= float(band[0]) and v <= float(band[1])
		lines.append("  %-22s %7.2f  区间 %.2f–%.2f  %s"
				% [key, v, float(band[0]), float(band[1]), "OK" if ok else "越界"])
	return "\n".join(lines)
