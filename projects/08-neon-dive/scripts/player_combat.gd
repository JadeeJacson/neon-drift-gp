extends Node
class_name PlayerCombat
## 玩家的攻击/弹反/处决状态机（docs/08 §3.2）。挂在 NeonPlayer 子节点上，
## 数值全部来自 CombatTable，这里只做「帧推进 + 判定框开关 + 输入裁决」。
##
## 三条刻意的设计：
## 1. 判定框只在 active 帧开启，不用「按下即结算」——否则连招的前摇没有意义，
##    玩家会以为自己在打空气（06 首轮「步枪不能连发」就是这类输入裁决问题）；
## 2. 弹反的电在按下时就扣（承诺成本），成功才回，失败白给——风险回报要对齐；
## 3. 处决要求目标处于硬直，且必须走 light 输入，避免变成「无脑按死」。

signal attack_started(id: String)
signal hit_registered(target: Node, attack_id: String, damage: float)
signal parry_succeeded(attacker: Node)
signal parry_failed(attacker: Node)
signal projectile_reflected(proj: Node)
signal shot_fired(at: Vector2, dir: float)
signal attack_denied(reason: String)
signal execute_performed(target: Node)
signal state_changed(state: String)

const T := preload("res://sim/combat_table.gd")

enum Phase { IDLE, STARTUP, ACTIVE, RECOVERY }

var phase: Phase = Phase.IDLE
var current: String = ""          # 正在打的招式 id
var chain_next: String = "light_1"
var chain_expires_at: int = 0     # 第几帧之前必须接下一段
var frames_left: int = 0
var charging: bool = false
var charge_frames: int = 0
var parry_left: int = 0           # 弹反有效窗剩余帧
var parry_startup_left: int = 0
var hit_this_swing: Array = []    # 同一次挥击不重复结算同一目标

var _frame: int = 0
var _shoot_cooldown := 0
var _body: NeonPlayer = null
var _vitals: PlayerVitals = null


func _ready() -> void:
	_body = get_parent() as NeonPlayer
	_vitals = _body.get_node("Vitals") as PlayerVitals


## 近战判定用几何范围检查而不是物理区：
## 实测发现依赖 Area2D 的 area_entered / get_overlapping_areas() 会闪不稳定——
## 几何上明明重叠（玩家 111.9、敌 137.9、hitbox 覆盖 111.9..141.9）但查询返回空，
## 因为区缓存只在物理步末尾刷新，而「启用形状」与「查重叠」发生在同一帧。
## 街机近战本来只需要一个矩形范围，直接算反而更确定、更可测。
func _scan_hits() -> void:
	if phase != Phase.ACTIVE or current == "" or current == "ranged":
		return
	var a: Dictionary = T.attack(current)
	var reach: float = float(a["reach"])
	var dir := _body.facing_dir()
	for n in get_tree().get_nodes_in_group("enemies"):
		var e := n as Node2D
		if e == null or hit_this_swing.has(e):
			continue
		var d: Vector2 = e.global_position - _body.global_position
		if absf(d.y) > 22.0:
			continue                      # 高度差太大不算命中
		if d.x * dir < -6.0:
			continue                      # 背后不命中（面向就是攻击方向）
		if absf(d.x) <= reach + 8.0:
			_apply_hit(e, a)


func _apply_hit(target: Node, a: Dictionary) -> void:
	hit_this_swing.append(target)
	var dmg: float = float(a["damage"])
	if current == "heavy":
		dmg = _heavy_damage
	if current == "execute":
		# 处决只对硬直目标成立；否则退化为一段轻击，避免「空处决白给」
		if target.has_method("is_stunned") and bool(target.call("is_stunned")):
			execute_performed.emit(target)
			_vitals.restore_o2(float(a["o2_reward"]))
		else:
			dmg = float(T.attack("light_1")["damage"])   # 上一版这行没在 else 里，把 9999 无条件刷成 18
	if target.has_method("take_hit"):
		target.call("take_hit", dmg, _body.facing_dir(), float(a["knockback"]))
	_vitals.restore_power(float(a["power_gain"]))
	hit_registered.emit(target, current, dmg)


func _physics_process(_delta: float) -> void:
	_frame += 1
	if _shoot_cooldown > 0:
		_shoot_cooldown -= 1
	_read_input()
	_advance()
	_tick_parry()
	_scan_hits()


# ---------- 输入裁决 ----------

func _read_input() -> void:
	if _vitals.dead:
		return
	# 轻击 / 处决
	if Input.is_action_just_pressed("attack_light"):
		var target := _stunned_target_in_reach()
		if target != null and phase == Phase.IDLE:
			# 先定目标再起手：否则 _begin 可能因为还在前后摇而直接 return，
			# 留下一个指向空处决目标的脏引用
			_execute_target = target
			_begin("execute")
		else:
			_begin(chain_next)
	# 蓄力重击：按住累计，松开结算
	if Input.is_action_just_pressed("attack_heavy"):
		charging = true
		charge_frames = 0
	if charging:
		charge_frames += 1
	if Input.is_action_just_released("attack_heavy") and charging:
		charging = false
		_begin_heavy(charge_frames)
	# 弹反
	if Input.is_action_just_pressed("parry") and phase == Phase.IDLE and parry_left <= 0:
		_begin_parry()
	# 远程（飞鳌）：走同一套状态机，但有独立冷却
	if Input.is_action_just_pressed("shoot") and phase == Phase.IDLE and _shoot_cooldown <= 0:
		_begin("ranged")
		if current != "ranged":
			_shoot_cooldown = 0   # 被拒（电不够）时不占用冷却


var _execute_target: Node = null


func _begin(id: String) -> void:
	if phase != Phase.IDLE:
		return  # 前后摇期间不接新招；连段靠 chain_next 的窗口实现
	var a: Dictionary = T.attack(id)
	var cost: float = float(a["power_cost"])
	if cost > 0.0 and not _vitals.spend_power(cost):
		attack_denied.emit("power")
		chain_next = "light_1"
		return
	current = id
	phase = Phase.STARTUP
	frames_left = int(a["startup"])
	attack_started.emit(id)
	_emit_phase()


func _begin_heavy(held: int) -> void:
	if phase != Phase.IDLE:
		return
	# 不在这里扣电：_begin("heavy") 会按表里的 power_cost 扣，两边都扣就是双倍收费
	_heavy_damage = T.heavy_damage(held)
	_begin("heavy")


var _heavy_damage: float = 0.0


func _begin_parry() -> void:
	var cost: float = float(T.PARRY["power_cost"])
	if not _vitals.spend_power(cost):
		attack_denied.emit("power")
		return
	parry_startup_left = int(T.PARRY["startup"])
	parry_left = 0  # 起手结束后才开窗
	parry_press_frame = _frame


var parry_press_frame: int = 0


func _tick_parry() -> void:
	if parry_startup_left > 0:
		parry_startup_left -= 1
		if parry_startup_left == 0:
			parry_left = int(T.PARRY["window"])
	elif parry_left > 0:
		parry_left -= 1
		if parry_left == 0:
			# 窗口开满却没接到东西：给一个「落空」信号。没有它，玩家分不清
			# 「我按错了时机」和「敌人根本还没出手」，这正是「弹反不好用」的另一半原因
			parry_failed.emit(null)


## 弹道生成：弹丸的归属与容器都由装配层管，这里只负责「什么时候可以射」
func _fire_ranged() -> void:
	var root := get_tree().get_first_node_in_group("game_root")
	if root == null or not root.has_method("spawn_projectile"):
		push_error("找不到 game_root，飞鳌无法生成弹丸")
		return
	var at := _body.global_position + Vector2(_body.facing_dir() * 12.0, -16.0)
	root.call("spawn_projectile", "player", at, _body.facing_dir())
	shot_fired.emit(at, _body.facing_dir())


## 弹反飞来的弹丸：成功则反射回去（伤害更高），失败则正常结算伤害。
## 返回 true 表示这一发已被弹反接管，投射物不该自行消失
func try_defend_projectile(proj: Node) -> bool:
	if not parry_open():
		return false
	parry_left = 0
	_vitals.restore_power(float(T.PARRY["power_gain"]))
	proj.set("dir", -float(proj.get("dir")))
	proj.set("owner_kind", "player")
	proj.set("reflected", true)
	# 反射后的伤害倍率由表控制（不是弹丸自己的魔法数字）
	proj.set("damage", float(proj.get("damage")) * float(T.PARRY["reflect_mult"]))
	projectile_reflected.emit(proj)
	parry_succeeded.emit(proj)
	return true


func parry_open() -> bool:
	return parry_left > 0


## 敌人 active 帧到来时先问这里：正在弹反窗内则这一击被弹掉，敌人硬直。
func try_defend(attacker: Node) -> bool:
	if not parry_open():
		return false
	parry_left = 0
	_vitals.restore_power(float(T.PARRY["power_gain"]))
	if attacker.has_method("stun"):
		attacker.call("stun", int(T.PARRY["stun_frames"]))
	parry_succeeded.emit(attacker)
	return true


# ---------- 帧推进 ----------

func _advance() -> void:
	if phase == Phase.IDLE:
		return
	frames_left -= 1
	if frames_left > 0:
		return
	var a: Dictionary = T.attack(current)
	match phase:
		Phase.STARTUP:
			phase = Phase.ACTIVE
			frames_left = int(a["active"])
			if current == "ranged":
				# 远程不开近战判定框（reach=0），而是生成弹丸
				_shoot_cooldown = int(a["cooldown_frames"])
				_fire_ranged()
				hit_this_swing.clear()
			else:
				_open_hitbox_for(a)
		Phase.ACTIVE:
			phase = Phase.RECOVERY
			frames_left = int(a["recovery"])
			_after_active(a)
		Phase.RECOVERY:
			phase = Phase.IDLE
			current = ""
			_after_recovery(a)
		_:
			phase = Phase.IDLE
	_emit_phase()


func _after_active(a: Dictionary) -> void:
	# 命中过才推进连段；空挥把链子打回一段（连段不该是无风险的）
	if hit_this_swing.is_empty():
		chain_next = "light_1"
	else:
		var nxt: String = str(a["next"])
		if nxt == "":
			chain_next = "light_1"
		else:
			chain_next = nxt
			chain_expires_at = _frame + int(a["chain_window"])
	hit_this_swing.clear()
	if current == "execute" and _execute_target != null:
		_execute_target = null


func _after_recovery(_a: Dictionary) -> void:
	# 连段窗口过期就回到一段，避免「隔三秒再按还是三段」
	if chain_next != "light_1" and _frame > chain_expires_at:
		chain_next = "light_1"


func _open_hitbox_for(_a: Dictionary) -> void:
	# 保留同名入口：现在只做「本次挥击的重置」，命中由 _scan_hits() 每帧算
	hit_this_swing.clear()


## 找出射程内正在硬直的目标（处决的入口）
func _stunned_target_in_reach() -> Node:
	for n in get_tree().get_nodes_in_group("enemies"):
		var e := n as Node2D
		if e == null or not e.has_method("is_stunned") or not e.call("is_stunned"):
			continue
		if e.global_position.distance_to(_body.global_position) <= 34.0:
			return e
	return null


func _emit_phase() -> void:
	state_changed.emit(Phase.keys()[phase])


## 重开一层时把状态机洗回空转：残留的 ACTIVE 会在重生点白打一下，
## 残留的 hit_this_swing 会让重生后第一挥「打不中」
func reset_state() -> void:
	phase = Phase.IDLE
	current = ""
	chain_next = "light_1"
	frames_left = 0
	parry_left = 0
	parry_startup_left = 0
	charging = false
	charge_frames = 0
	hit_this_swing.clear()
	_emit_phase()


func snapshot() -> Dictionary:
	return {"phase": Phase.keys()[phase], "current": current, "chain_next": chain_next,
			"parry_open": parry_open(), "charge_frames": charge_frames, "frames_left": frames_left,
			"shoot_cooldown": _shoot_cooldown}
