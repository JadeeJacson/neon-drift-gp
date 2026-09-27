extends Node3D
## arena.gd — 球场运行期接口（静态结构由 tools/build_arena.gd 生成进 arena.tscn）。
## 只暴露查询与常量，不承担规则——规则在 sim/rules.gd，执行在 match_director.gd。
## 坐标约定：蓝门 x=-36（玩家/蓝方防守），橙门 x=+36；场地 72 x 44 m。

const FIELD_HALF_X := 36.0
const FIELD_HALF_Z := 22.0
const WALL_HEIGHT := 12.0
const GOAL_HALF_WIDTH := 6.0
const GOAL_HEIGHT := 4.0
const GOAL_DEPTH := 3.5
const BLUE_GOAL_POS := Vector3(-FIELD_HALF_X, 0, 0)
const ORANGE_GOAL_POS := Vector3(FIELD_HALF_X, 0, 0)

const BALL_SPAWN := Vector3(0, 1.6, 0)
const KICKOFF_BLUE := Vector3(-18, 0.8, 0)
const KICKOFF_ORANGE := Vector3(18, 0.8, 0)

var _big_pads: Array = []


func _ready() -> void:
	# ⚠️ add_to_group 在 build 工具里调用不会被序列化进 tscn（实测坑），
	# 分组必须在运行时补：传感器给导演、本节点给查询者。
	add_to_group("arena")
	for child in get_children():
		if String(child.name).begins_with("GoalSensor"):
			child.add_to_group("goal_sensor")


func register_pad(pad: Node) -> void:
	if bool(pad.get("is_big")):
		if not _big_pads.has(pad):
			_big_pads.append(pad)


## 最近的可用大 pad；没有可用时返回 Vector3.INF（ai_brain 会绕过）。
func nearest_active_big_pad(from: Vector3) -> Vector3:
	var best := Vector3.INF
	var best_d := INF
	for pad in _big_pads:
		if not bool(pad.get("active")):
			continue
		var d: float = from.distance_to(pad.global_position)
		if d < best_d:
			best_d = d
			best = pad.global_position
	return best
