extends RefCounted
## ai_brain.gd — 载具足球 AI 决策（纯函数）：状态快照 → 意图。
## 场景层每 react_interval 秒问一次（反应间隔是 AI 难度旋钮之一），
## 转向/油门/boost 的执行全部在场景层——沿用 06 的「sim 出意图、场景管表现」分工线。
## 坐标约定：蓝方球门在 x 负端、橙方在 x 正端；snap 里传进球门坐标，
## 本文件不写死场地尺寸（build_arena 改布局时这里零改动）。

const MODE_CHASE := "CHASE"        # 追球（带预判提前量）
const MODE_SHOOT := "SHOOT"        # 绕到球后朝对方球门打
const MODE_DEFEND := "DEFEND"      # 卡在球与自家球门之间回撤
const MODE_GET_BOOST := "GET_BOOST"


static func default_params() -> Dictionary:
	return {
		"lead_max": 0.7,           # 追球预判秒数上限
		"shoot_range": 26.0,       # 进入射门决策的车球距离
		"boost_low": 18.0,         # boost 低于此值且球远时顺路补给
		"boost_seek_range": 24.0,  # 允许绕路吃 pad 的距离
	}


## snap 必需字段：ball_pos / ball_vel / my_pos / my_boost / own_goal_pos /
##   target_goal_pos / params；可选：boost_pad_pos（Vec3，最近可用大 pad）。
static func decide(snap: Dictionary) -> Dictionary:
	var p: Dictionary = snap["params"]
	var ball_pos: Vector3 = snap["ball_pos"]
	var ball_vel: Vector3 = snap["ball_vel"]
	var my_pos: Vector3 = snap["my_pos"]
	var my_boost: float = snap["my_boost"]
	var own_goal: Vector3 = snap["own_goal_pos"]
	var target_goal: Vector3 = snap["target_goal_pos"]

	var ball_dist := my_pos.distance_to(ball_pos)

	# 1) 球深入本方半场、且球比我更靠近自家门 → 回防卡位（人挡在球与门之间）
	var ball_to_own := ball_pos.distance_to(own_goal)
	var me_to_own := my_pos.distance_to(own_goal)
	if ball_to_own < 30.0 and ball_to_own < me_to_own:
		var back: Vector3 = ball_pos.direction_to(own_goal)
		var spot: Vector3 = ball_pos + back * 6.0
		return {"mode": MODE_DEFEND, "target_pos": spot, "want_boost": my_boost > 30.0}

	# 2) boost 见底且球远 → 绕路吃最近的大 pad
	if my_boost < float(p["boost_low"]) and ball_dist > 28.0 and snap.has("boost_pad_pos"):
		var pad: Vector3 = snap["boost_pad_pos"]
		if my_pos.distance_to(pad) < float(p["boost_seek_range"]):
			return {"mode": MODE_GET_BOOST, "target_pos": pad, "want_boost": false}

	# 3) 射门：距离够近、且我已在球的本方一侧（车→球方向指向对方球门）
	var goal_dir: Vector3 = ball_pos.direction_to(target_goal)
	var to_ball: Vector3 = ball_pos - my_pos
	if ball_dist < float(p["shoot_range"]) and to_ball.dot(goal_dir) > 0.0:
		var behind: Vector3 = ball_pos - goal_dir * 3.2
		return {"mode": MODE_SHOOT, "target_pos": behind, "want_boost": ball_dist > 12.0 and my_boost > 8.0}

	# 4) 默认追球（预判提前量随距离拉满）
	var lead: float = clampf(ball_dist / 30.0, 0.0, float(p["lead_max"]))
	var chase: Vector3 = ball_pos + ball_vel * lead
	return {"mode": MODE_CHASE, "target_pos": chase, "want_boost": ball_dist > 18.0 and my_boost > 8.0}
