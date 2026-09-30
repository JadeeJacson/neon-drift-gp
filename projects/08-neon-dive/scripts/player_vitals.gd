extends Node
class_name PlayerVitals
## 玩家的三条命计量：HP / 氧 O2 / 电 PWR（docs/08 §3.3）。
##
## 为什么必须是 Player 的子节点而不是场景里的独立节点（06 的教训）：
## 玩家被池化/重建时，计量必须跟着一起消失，否则会出现「新身体挂旧血量」。
##
## 设计意图（数值依据在 sim/combat_table.gd 的 design_bands）：
## - 氧是**时间预算**，不是血条：满氧约 62 秒，空了开始掉血，逼玩家往下潜；
## - 电只能靠命中/弹反回，所以「省电」等于「不打人」，两条计量互相咬住。

signal value_changed(kind: String, value: float, max_value: float)
signal damaged(amount: float, source: Node2D)
signal died(cause: String)

const T := preload("res://sim/combat_table.gd")

var hp: float = 0.0
var o2: float = 0.0
var power: float = 0.0
var invuln_frames: int = 0
var dead: bool = false


func _ready() -> void:
	hp = float(T.ECONOMY["hp_max"])
	o2 = float(T.ECONOMY["o2_max"])
	power = float(T.ECONOMY["power_max"])


func _physics_process(delta: float) -> void:
	if dead:
		return
	if invuln_frames > 0:
		invuln_frames -= 1
	# 氧只在「已经下潜过至少一层」之后才消耗；M2 的灰盒阶段先按一直在潜处理
	o2 = maxf(o2 - float(T.ECONOMY["o2_drain_per_second"]) * delta, 0.0)
	if o2 <= 0.0:
		hp -= float(T.ECONOMY["o2_drown_damage_per_second"]) * delta
		if hp <= 0.0:
			_die("drown")
	emit_signal("value_changed", "hp", hp, float(T.ECONOMY["hp_max"]))
	emit_signal("value_changed", "o2", o2, float(T.ECONOMY["o2_max"]))


func take_damage(amount: float, source: Node2D = null) -> bool:
	## 返回 false 表示这一击被无敌帧吃掉（不结算、不响、不掉血）
	if dead or invuln_frames > 0:
		return false
	hp = maxf(hp - amount, 0.0)
	invuln_frames = T.INVULN_FRAMES
	damaged.emit(amount, source)
	if hp <= 0.0:
		_die("hurt")
	return true


func spend_power(amount: float) -> bool:
	## 电不够就返回 false：调用方必须据此播「不允许」反馈，而不是静默失败
	if power < amount:
		return false
	power -= amount
	value_changed.emit("power", power, float(T.ECONOMY["power_max"]))
	return true


func restore_power(amount: float) -> void:
	power = minf(power + amount, float(T.ECONOMY["power_max"]))
	value_changed.emit("power", power, float(T.ECONOMY["power_max"]))


func restore_o2(amount: float) -> void:
	o2 = minf(o2 + amount, float(T.ECONOMY["o2_max"]))
	value_changed.emit("o2", o2, float(T.ECONOMY["o2_max"]))


func _die(cause: String) -> void:
	if dead:
		return
	dead = true
	hp = 0.0
	died.emit(cause)


## 外部直接判死（掉出层、后续的水位/计时器）。与 take_damage 分开：
## 掉坑不是「伤害攒够了」，而是一击即死，反馈文案也不一样
func kill(cause: String) -> void:
	_die(cause)


func reset() -> void:
	## 重开一层/重玩一局用：计量回满、无敌帧清掉，不然重生第一下是无敌的
	hp = float(T.ECONOMY["hp_max"])
	o2 = float(T.ECONOMY["o2_max"])
	power = float(T.ECONOMY["power_max"])
	invuln_frames = 0
	dead = false
	value_changed.emit("hp", hp, float(T.ECONOMY["hp_max"]))
	value_changed.emit("o2", o2, float(T.ECONOMY["o2_max"]))
	value_changed.emit("power", power, float(T.ECONOMY["power_max"]))


func snapshot() -> Dictionary:
	return {"hp": hp, "o2": o2, "power": power, "invuln_frames": invuln_frames, "dead": dead}
