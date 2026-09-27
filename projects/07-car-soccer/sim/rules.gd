extends RefCounted
## rules.gd — 比赛规则状态机（纯函数，不碰场景树/物理 → GUT 逐条断言）。
## 相位：KICKOFF（倒计时）→ PLAYING → GOAL_PAUSE（进球回位）→ KICKOFF …
## → FULL_TIME（终场封盘）。clock 只在 PLAYING 流逝。
## 状态字典字段：phase / clock / score_blue / score_orange / phase_left /
##   kickoff_count / winner。
## 设计要点：进球只在 PLAYING 相位结算一次——06 清波判定每帧重复触发导致
## 弹药暴涨的教训，在这里从规则层堵死（on_goal 对非 PLAYING 相位是幂等的）。

const MATCH_TIME := 180.0        # 一局 3 分钟（选型 §9 默认；5 球封顶提前结束）
const SCORE_CAP := 5
const KICKOFF_COUNTDOWN := 2.4   # 0.8s × 3 拍
const GOAL_PAUSE := 2.2          # 进球庆祝/回位（冒烟 90s 预算内）
const PHASE_KICKOFF := "KICKOFF"
const PHASE_PLAYING := "PLAYING"
const PHASE_GOAL := "GOAL_PAUSE"
const PHASE_FULL := "FULL_TIME"


static func initial() -> Dictionary:
	return {
		"phase": PHASE_KICKOFF,
		"clock": MATCH_TIME,
		"score_blue": 0,
		"score_orange": 0,
		"phase_left": KICKOFF_COUNTDOWN,
		"kickoff_count": 1,
		"winner": "",
	}


static func tick(st: Dictionary, dt: float) -> Dictionary:
	var s: Dictionary = st.duplicate()
	var phase: String = s["phase"]
	if phase == PHASE_FULL:
		return s
	if phase == PHASE_PLAYING:
		s["clock"] = maxf(0.0, float(s["clock"]) - dt)
		if float(s["clock"]) <= 0.0:
			s["phase"] = PHASE_FULL
			s["winner"] = _winner_of(s)
		return s
	# KICKOFF / GOAL_PAUSE：相位计时
	s["phase_left"] = maxf(0.0, float(s["phase_left"]) - dt)
	if float(s["phase_left"]) <= 0.0:
		if phase == PHASE_GOAL:
			# GOAL_PAUSE 结束：时间已尽就终场，否则回开球倒计时
			if float(s["clock"]) <= 0.0:
				s["phase"] = PHASE_FULL
				s["winner"] = _winner_of(s)
			else:
				s["phase"] = PHASE_KICKOFF
				s["phase_left"] = KICKOFF_COUNTDOWN
				s["kickoff_count"] = int(s["kickoff_count"]) + 1
		else:
			s["phase"] = PHASE_PLAYING
	return s


static func on_goal(st: Dictionary, team: String) -> Dictionary:
	# team：进球方（"blue" / "orange"）。非 PLAYING 相位原样返回。
	var phase: String = st["phase"]
	if phase != PHASE_PLAYING:
		return st.duplicate()
	var s: Dictionary = st.duplicate()
	if team == "blue":
		s["score_blue"] = int(s["score_blue"]) + 1
	else:
		s["score_orange"] = int(s["score_orange"]) + 1
	if int(s["score_blue"]) >= SCORE_CAP or int(s["score_orange"]) >= SCORE_CAP:
		s["phase"] = PHASE_FULL
		s["winner"] = _winner_of(s)
	else:
		s["phase"] = PHASE_GOAL
		s["phase_left"] = GOAL_PAUSE
	return s


static func is_live(st: Dictionary) -> bool:
	return st["phase"] == PHASE_PLAYING


static func _winner_of(s: Dictionary) -> String:
	if int(s["score_blue"]) > int(s["score_orange"]):
		return "blue"
	if int(s["score_orange"]) > int(s["score_blue"]):
		return "orange"
	return "draw"
