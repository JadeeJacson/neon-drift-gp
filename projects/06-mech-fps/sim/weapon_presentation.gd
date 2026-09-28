extends RefCounted
class_name WeaponPresentation
## 枪械**表现层**契约（纯数据，可在 --headless 下断言）。
##
## 为什么要有这个文件：三把枪的 viewmodel 摆位与反馈参数，是三轮修复里逐个手填进
## `weapon_controller.VIEWMODELS` 的。后果是制作人这轮点出的两件事——
##   ① 切枪时枪在屏幕上跳位（三把枪各自的 pos/muzzle 是分别试出来的，互不相干）；
##   ② 「后坐/震屏/顿帧/曳光/枪口焰」每把枪各写一套口径，没人核对过强弱关系。
## 所以这里把**共用的规则**和**每把枪允许不同的差异量**分开：
##   共用 → 握把锚点、枪管轴、枪口目标点、顿帧全局开关、换弹分段的形状；
##   差异 → 视觉枪管长与机身长、反馈强度（数值仍在 sim/weapon_table，由不等式约束）。

## 握把锚点（相机局部空间，米）。三把枪共用同一个点：切枪时手不该跳。
const GRIP := Vector3(0.22, -0.22, -0.16)

## 枪管轴：从握把指向枪口的方向。略偏左、略朝上——真实持握时枪管中心线在握把上方。
## 所有枪的枪口都落在这条线上，只是长度不同，所以切枪时枪口不会横移。
## 就是 Vector3(-0.06, 0.10, -1.0).normalized()，写成常量是因为 GDScript 的 const
## 不接受函数调用（.normalized() 会报 isn't a constant expression）。
const BARREL_AXIS := Vector3(-0.059596, 0.099307, -0.993295)

## 每把枪的两个视觉长度（米，不是真实尺寸，是「第一人称里希望它看起来多长」）：
##   barrel → 握把到枪口，决定枪口落在轴上的哪一点；
##   body   → 整枪可见长度，静态模型按它反算缩放（没有手可锚定时唯一可靠的量）。
const VIEW := {
	"assault_rifle": {"barrel": 0.55, "body": 0.62},
	"shotgun": {"barrel": 0.66, "body": 0.74},
	"dmr_sniper": {"barrel": 0.62, "body": 0.66},
}

## 枪口点的允许偏差。装配层把模型摆好后必须复量一次，超出即断言失败——
## 上一轮「霰弹枪口算到 3.3 米外」就是缺这条复量（那时只测了第一把枪）。
const MUZZLE_TOLERANCE := 0.06

## 顿帧全局关闭：制作人 2026-09-27 的判定原话是「不用」。
## 数值仍留在 `weapon_table` 的 hitstop 字段里（想开只改这一处），
## 而不是散在三个武器分支里——「关掉」和「没有这个参数」是两件事。
const HITSTOP_ENABLED := false

## 换弹分段：`at` 是**占换弹时长的比例**，不是绝对秒数——
## 因为每把枪的 reload_time 不同（步枪 2.0 / 霰弹 2.7 / 精确射手 2.5），
## 而 clip 的分段形状是按比例对齐的。绝对时刻由 reload_stages() 乘出来。
const RELOAD_STAGES := {
	## 弹匣式：取弹匣 → 拉机柄 → 装回 → 上膛
	"assault_rifle": [
		{"at": 0.12, "sfx": "reload_mag_release", "label": "取弹匣"},
		{"at": 0.38, "sfx": "reload_bolt_back", "label": "拉机柄"},
		{"at": 0.62, "sfx": "reload_mag_seat", "label": "装回弹匣"},
		{"at": 0.84, "sfx": "reload_latch", "label": "上膛"},
	],
	## 管状弹仓逐发压弹：塞弹 ×3 → 拉泵。泵动霰弹没有「拔弹匣」这个动作，
	## 硬套步枪那四段就会听到不对应的声音（这是分段的形状差异，不是音量差异）。
	"shotgun": [
		{"at": 0.18, "sfx": "reload_shell", "label": "压弹 1"},
		{"at": 0.40, "sfx": "reload_shell", "label": "压弹 2"},
		{"at": 0.60, "sfx": "reload_mag_seat", "label": "压弹 3"},
		{"at": 0.85, "sfx": "reload_bolt_forward", "label": "拉泵"},
	],
	## 栓动：开栓 → 弹夹脱出 → 新弹夹入 → 关栓上膛
	"dmr_sniper": [
		{"at": 0.14, "sfx": "reload_bolt_back", "label": "开栓"},
		{"at": 0.36, "sfx": "reload_mag_release", "label": "弹夹脱出"},
		{"at": 0.58, "sfx": "reload_mag_seat", "label": "弹夹入"},
		{"at": 0.82, "sfx": "reload_bolt_forward", "label": "关栓上膛"},
	],
}


static func has_id(id: String) -> bool:
	return VIEW.has(id)


## 声明的枪口点（相机局部空间）。装配层负责把**模型的**枪口标记摆到这里，
## 再复量一次（见 MUZZLE_TOLERANCE）。
static func muzzle_of(id: String) -> Vector3:
	assert(VIEW.has(id), "未登记视觉长度的武器: " + id)
	return GRIP + BARREL_AXIS * float(VIEW[id]["barrel"])


static func body_length(id: String) -> float:
	assert(VIEW.has(id), "未登记视觉长度的武器: " + id)
	return float(VIEW[id]["body"])


## 把比例分段换算成绝对时刻（秒），按时间升序。
static func reload_stages(id: String, duration: float) -> Array:
	assert(VIEW.has(id), "未登记视觉长度的武器: " + id)
	assert(duration > 0.0, "换弹时长必须为正")
	var out: Array = []
	for stage in RELOAD_STAGES[id]:
		out.append({
			"at": float(stage["at"]) * duration,
			"sfx": String(stage["sfx"]),
			"label": String(stage["label"]),
		})
	return out
