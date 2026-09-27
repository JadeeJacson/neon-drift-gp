extends Node
class_name PlayerVitals
## 玩家状态层：护盾（可回充）/ 舰体（波间小修）/ 热量（过热锁定）。
## 只被 player_ship.tick() 驱动——暂停时天然冻结，不依赖 SceneTree.pause。

signal shield_changed(value: float)
signal hull_changed(value: float)
signal heat_changed(value: float)
signal overheated
signal recovered
signal died

var shield: float = ShipTable.SHIELD_MAX
var hull: float = ShipTable.HULL_MAX
var heat: float = 0.0
var overheat: bool = false
var since_hit: float = 999.0
var dead: bool = false


func reset() -> void:
	shield = ShipTable.SHIELD_MAX
	hull = ShipTable.HULL_MAX
	heat = 0.0
	overheat = false
	since_hit = 999.0
	dead = false
	shield_changed.emit(shield)
	hull_changed.emit(hull)
	heat_changed.emit(heat)


func tick(delta: float) -> void:
	if dead:
		return
	since_hit += delta
	# 护盾脱战回充
	if since_hit >= ShipTable.SHIELD_REGEN_DELAY and shield < ShipTable.SHIELD_MAX:
		shield = minf(ShipTable.SHIELD_MAX, shield + ShipTable.SHIELD_REGEN * delta)
		shield_changed.emit(shield)
	# 热量冷却 + 过热解锁
	if heat > 0.0:
		heat = maxf(0.0, heat - ShipTable.HEAT_COOL * delta)
		heat_changed.emit(heat)
	if overheat and heat <= ShipTable.HEAT_LOCK_UNTIL:
		overheat = false
		recovered.emit()


## 返回 true 表示死亡。
func take_damage(amount: float) -> bool:
	if dead:
		return true
	since_hit = 0.0
	var absorbed := minf(shield, amount)
	shield -= absorbed
	shield_changed.emit(shield)
	var to_hull := amount - absorbed
	if to_hull > 0.0:
		hull = maxf(0.0, hull - to_hull)
		hull_changed.emit(hull)
	if hull <= 0.0:
		dead = true
		died.emit()
		return true
	return false


## 开火前调用；过热时返回 false 并维持锁定。
func try_spend_heat() -> bool:
	if overheat:
		return false
	heat += ShipTable.HEAT_PER_SHOT
	heat_changed.emit(heat)
	if heat >= ShipTable.HEAT_LOCK_AT:
		overheat = true
		overheated.emit()
	return true


func can_fire() -> bool:
	return not overheat and not dead
