extends RefCounted
class_name TeamTable
## 团队歼灭（5v5）的规则表（纯数据层）。
## 为什么不塞进 wave_table：波次是「玩家 vs 系统刷怪」的 PvE 难度曲线，
## 团队是「两队互打」的对抗——胜负条件、资源、重生、阵营全都不一样，
## 共用一张表会让两边的调参互相牵制（改波次曲线会顺手改掉团队局的比分节奏）。

const TEAM_A := 0   ## 玩家所在队
const TEAM_B := 1

const TEAM_SIZE := 5              ## 含玩家自己
const KILLS_TO_WIN := 30          ## 先到 30 杀
const TIME_LIMIT := 300.0         ## 5 分钟没打满就按分差判
const RESPAWN_DELAY := 3.0        ## 死亡到重生的等待（秒）
const SCORE_PER_KILL := 1

## CF 团队竞技口径：**不打队友**。开了友伤，bot 互殴会退化成「谁挡了谁的线谁掉分」，
## 而我们现在没有做队友遮挡判定，只会带来误判。这条由 Targeting.can_damage 执行。
const FRIENDLY_FIRE := false


## 碰撞层口径（与 player/enemy 场景里的 collision_layer 一致）：
## 敌人 4、玩家自身 2、关卡 1。队友 bot 单独占一层 8，这样玩家武器的射线
## （mask = 1|4）**天然穿过后不会打在队友身上**，不需要在射击路径上加特判。
const LAYER_WORLD := 1
const LAYER_PLAYER := 2
const LAYER_ENEMY := 4
const LAYER_FRIENDLY := 8


static func score_for(kills: int) -> int:
	assert(kills >= 0, "击杀数不能为负")
	return kills * SCORE_PER_KILL


## 返回 0 / 1 = 该队获胜，2 = 平局，-1 = 还没结束。
## 时间到而比分相同算平局——不要随机判一方赢，那会让「平衡性」断言测到噪声。
static func winner(score_a: int, score_b: int, elapsed: float) -> int:
	assert(score_a >= 0 and score_b >= 0, "比分不能为负")
	if score_a >= KILLS_TO_WIN or score_b >= KILLS_TO_WIN:
		assert(score_a != score_b, "同时越过 KILLS_TO_WIN 不可能发生，说明结算写错了")
		return TEAM_A if score_a > score_b else TEAM_B
	if elapsed >= TIME_LIMIT:
		if score_a == score_b:
			return 2
		return TEAM_A if score_a > score_b else TEAM_B
	return -1


static func is_over(score_a: int, score_b: int, elapsed: float) -> bool:
	return winner(score_a, score_b, elapsed) >= 0
