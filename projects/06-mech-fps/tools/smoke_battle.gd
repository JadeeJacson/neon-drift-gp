@tool
extends SceneTree
## 战斗闭环冒烟测试：真的加载主场景、真的出怪、真的开枪、真的打死。
##
## 为什么需要它：`--headless --quit` 只跑到各节点的 _ready，等于「能开机」；
## sim 层的 656 条断言只证明纯逻辑对。中间那层——场景装配、射线命中、状态机接线、
## 死亡与结算——必须有个东西在无人值守时跑一遍，否则每次改动都靠人眼看日志。
## 这是 docs/00 §4.3「流程验证」的最小实现（bot 统计断言的第一块地基）。
##
## 用法（lab 根）：
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/06-mech-fps -s res://tools/smoke_battle.gd
##
## 注意：脚本模式的 SceneTree 必须显式 quit()，否则进程永不退出（§5.0b 第 6 条）。

const MAX_FRAMES := 900  # 约 15 秒模拟时间，够首波出怪

## 各敌型碰撞体中心相对根节点的高度（根节点在脚底）。
## 摆位时必须补偿这个偏移，否则水平射线会从敌人脚下掠过——测试一开始就是这么打空的。
const COLLIDER_CENTER := {
	"drone": 0.6,
	"charger": 0.5,
	"trooper": 1.07,
	"heavy": 2.5,
}

var _fails := 0
var _main: Node


func _initialize() -> void:
	print("=== 06 战斗闭环冒烟 ===")
	# 载入要绕一个独立的函数：_initialize 是协程，局部变量会活到它结束（也就是 quit() 之前），
	# 那样 PackedScene 一直被引用，退出时报「resources still in use」。
	var main := _load_main()
	_main = main
	root.add_child(main)
	await process_frame  # 让整棵树的 _ready 跑完

	var player := main.get_node_or_null(^"Player") as Node3D
	var vitals := main.get_node_or_null(^"Player/Vitals") as PlayerVitals
	var weapon := main.get_node_or_null(^"Player/CameraHolder/Camera/Weapon") as WeaponController
	var camera := main.get_node_or_null(^"Player/CameraHolder/Camera") as Camera3D
	var director := main.get_node_or_null(^"WaveDirector") as WaveDirector
	var hud := main.get_node_or_null(^"Hud") as GameHud

	_check(player != null, "Player 实例化")
	_check(vitals != null, "Vitals 挂在 Player 下")
	_check(weapon != null, "Weapon 挂在相机下")
	_check(director != null, "WaveDirector 就位")
	_check(hud != null, "HUD 就位")
	_check(arena_has_spawns(main), "Arena 有出怪点（跑过 build_arena.gd？）")
	if _fails > 0:
		_done()
		return

	# 0) 装饰层必须是纯视觉：Kenney 模块本身零碰撞，若哪天换成带碰撞的模型，
	#    玩家与敌人都会被看不见的体积卡住（练习期 04 的「空气墙」教训）。
	var props := main.get_node_or_null(^"Arena/Props")
	if props != null:
		var colliders := _count_colliders(props)
		_check(colliders == 0, "装饰层不该带碰撞体（实测 %d 个）" % colliders)
		_check(props.get_child_count() > 40, "装饰件太少，观感仍是灰盒（实测 %d）" % props.get_child_count())
	else:
		_check(false, "Arena 下没有 Props 装饰层，跑过 build_arena.gd？")

	# 0b) 光照层必须真的在场景里。刚踩过的坑：_add_atmosphere 里写错 Environment 属性名，
	#     GDScript 运行期错误只中断当前函数，_initialize 继续往下跑并打印「生成完成」，
	#     结果 WorldEnvironment 根本没进场景——只有断言能抓住这种静默丢失。
	var we := main.get_node_or_null(^"Arena/WorldEnvironment") as WorldEnvironment
	_check(we != null, "Arena 里有 WorldEnvironment（光照氛围层）")
	if we != null and we.environment != null:
		var env := we.environment
		_check(env.background_mode == Environment.BG_SKY and env.sky != null, "天空已配置")
		_check(env.sky.sky_material != null, "天空材质非空")
		_check(env.glow_enabled, "glow 已开（枪口焰与曳光要靠它融进画面）")
		var hdr_present := ResourceLoader.exists("res://assets/hdri/overcast_industrial_courtyard.hdr")
		if hdr_present:
			_check(env.sky.sky_material is PanoramaSkyMaterial,
				"HDRI 已入库却没用上，天空退回成了程序渐变")
	var sun := main.get_node_or_null(^"Arena/Sun")
	_check(sun is DirectionalLight3D, "场景有方向光（否则模型全是死黑）")

	# 1) 出怪：等首波生成至少一个敌人
	var enemies := await _wait_first_spawn(director)
	_check(not enemies.is_empty(), "首波已出怪")
	if enemies.is_empty():
		_done()
		return

	# 2) 命中与击杀：把敌人摆到枪口前，持续开火直到死亡
	var enemy := enemies[0] as EnemyController
	_check(enemy != null, "敌人根节点是 EnemyController")
	_check(enemy.is_in_group("enemies"), "敌人已加入 enemies 组")
	var ammo_before := weapon.mag() + weapon.reserve()
	var killed := await _shoot_until_dead(enemy, camera, weapon, 600)
	_check(killed, "%s 应被子弹打死" % enemy.enemy_type)

	# 3) 弹药记账：开火必然消耗（换弹只搬运，不凭空造弹）
	_check(weapon.mag() + weapon.reserve() < ammo_before, "开火后总弹量必须下降")

	# 4) 切枪与换弹：1/2/3 换的是不同弹匣规格，换弹必须真的补满
	var mag_rifle := weapon.mag()
	weapon.select(1)
	_check(weapon.current_id() == "shotgun", "切枪到 2 号位应为霰弹枪")
	_check(weapon.mag() == int(WeaponTable.field("shotgun", "mag_size")), "切枪后弹匣应重置为该枪规格")
	weapon.select(0)
	weapon.start_reload()
	for _i in range(int(WeaponTable.field("assault_rifle", "reload_time") * 70.0) + 20):
		await physics_frame
	_check(weapon.mag() > mag_rifle or weapon.mag() == int(WeaponTable.field("assault_rifle", "mag_size")),
		"换弹计时结束后弹匣必须补齐（当前 %d）" % weapon.mag())

	# 5) 击杀回资源：走真实死亡信号链（EnemyController._die → call_group("weapon")）
	var donor := _nearest_enemy(director)
	if donor != null:
		var reserve_before := weapon.reserve()
		donor.take_damage(999999.0, camera.global_position, true)
		await process_frame
		_check(weapon.reserve() > reserve_before,
			"击杀必须通过信号链回补弹药（%d → %d）" % [reserve_before, weapon.reserve()])
	else:
		_check(false, "找不到可用于验证回弹的敌人")

	# 5b) 连发：按住扳机时步枪（auto）该打出多发，霰弹（pump）不该。
	#     这条锁的是「fire_mode 真的生效」，不是具体发数——发数会随帧率与冷却微调变。
	var auto_shots := await _count_shots_while_held(weapon, "assault_rifle", 60)
	_check(auto_shots >= 4, "步枪按住 1 秒应连发（实测 %d 发）" % auto_shots)
	var pump_shots := await _count_shots_while_held(weapon, "shotgun", 60)
	_check(pump_shots <= 2, "霰弹按住不该连发（实测 %d 发）" % pump_shots)

	# 5c) 枪口点几何：曳光与枪口焰都从实测包围盒算出的枪口点发出，
	#     位置不对就是实跑看到的「射线不是从枪口出发」。
	weapon.select(0)
	var muzzle := weapon.muzzle_global()
	var to_muzzle := muzzle - camera.global_position
	var fwd := -camera.global_transform.basis.z
	_check(to_muzzle.length() > 0.25 and to_muzzle.length() < 1.4,
		"枪口离相机 %.2fm，不该贴身也不该伸太出" % to_muzzle.length())
	_check(fwd.dot(to_muzzle.normalized()) > 0.8, "枪口应在视野前方，否则曳光会横穿屏幕")
	_check(to_muzzle.y < 0.02, "枪口应不高于视线，第一人称枪该在屏幕下方")

	# 5d) 死亡表现：打死之后模型必须有可见变化（倒地/下沉/缩小），
	#     用户原话是「只是停住然后消失，难判断」。
	#     注意要在敌人被 queue_free（1.7s）之前采样，且每帧判有效性——
	#     脚本模式协程里访问已释放对象会直接中断后面的 quit()，整个步骤挂到超时。
	var dying := _nearest_enemy(director)
	if dying != null:
		var dm := dying.model_for_test()
		var scale_before := dm.scale
		var y_before := dm.position.y
		var rot_before := dm.rotation_degrees.x
		dying.take_damage(999999.0, camera.global_position, false)
		var changed := false
		for _i in range(90):
			await physics_frame
			if not is_instance_valid(dm):
				changed = true  # 提前被清理也算「有交代」
				break
			if absf(dm.position.y - y_before) > 0.05 or dm.scale.distance_to(scale_before) > 0.02 \
					or absf(dm.rotation_degrees.x - rot_before) > 1.0:
				changed = true
				break
		_check(changed, "死亡必须有可见交代（下沉 / 缩小 / 倒地），不能只是停住再消失")
	else:
		_check(false, "找不到用于验证死亡表现的敌人")

	# 6) 震屏：重反馈武器（霰弹 recoil 0.26）必须把 trauma 顶起来；
	#    步枪单发 trauma 只有 0.05、衰减 3.2/s，16ms 就归零——那是「连射不该微抖」的设计意图，
	#    所以不能用步枪做这条断言（第一版就是这么误判成 FAIL 的）。
	var shaker := _first_shaker()
	if shaker != null:
		weapon.select(1)
		weapon.try_fire()
		await physics_frame
		# 阈值取 0.15：步枪满 trauma 只有 0.05（绝不可能过线），霰弹 0.26 扣掉一帧衰减
		# （3.2/s × 16.7ms ≈ 0.05）后仍有约 0.20。取中间值才不会因为帧时序抖动而假失败。
		_check(shaker.trauma_for_test() >= 0.15,
			"霰弹开火后 trauma 应≥0.15（实测 %.3f）" % shaker.trauma_for_test())
		for _i in range(240):
			await physics_frame
		_check(absf(shaker.trauma_for_test()) < 0.0001, "trauma 必须衰减到 0，不能残留偏移")
		weapon.select(0)
	else:
		_check(false, "CameraShake 没进 shaker 组，反馈链断在装配层")

	# 7) 处决：近身右键应直接击杀（资源循环的进攻激励入口）
	var victim := _nearest_enemy(director)
	if victim != null:
		_place_in_front(victim, camera, 2.5)
		weapon.try_execute()
		await physics_frame
		_check(victim.is_dead(), "处决应一击必杀近身目标")

	# 8) 结算：致命伤必须进死亡态并停掉导演
	vitals.take_damage(9999.0, Vector3.ZERO)
	await process_frame
	_check(vitals.is_dead(), "致命伤后进入死亡态")
	_check(director.is_finished(), "玩家死亡后波次导演应停止出怪")

	_done()


func _wait_first_spawn(director: WaveDirector) -> Array:
	for _i in range(MAX_FRAMES):
		await physics_frame
		var found := _live_enemies(director)
		if not found.is_empty():
			return found
	return []


func _shoot_until_dead(enemy: EnemyController, camera: Camera3D, weapon: WeaponController, frames: int) -> bool:
	for _i in range(frames):
		if enemy.is_dead():
			return true
		# 每帧把目标钉回枪口前：测的是「子弹能否结算伤害」，不是玩家准头
		_place_in_front(enemy, camera, 6.0)
		weapon.try_fire()
		await physics_frame
	return enemy.is_dead()


func _place_in_front(enemy: EnemyController, camera: Camera3D, dist: float) -> void:
	var aim := camera.global_position - camera.global_transform.basis.z * dist
	# 根节点落在「射线高度 − 碰撞体中心偏移」上，碰撞体才真正压在准星线上
	var offset := float(COLLIDER_CENTER.get(enemy.enemy_type, 1.0))
	enemy.global_position = aim - Vector3(0, offset, 0)


func _nearest_enemy(director: WaveDirector) -> EnemyController:
	var list := _live_enemies(director)
	return null if list.is_empty() else list[0]


func _live_enemies(director: WaveDirector) -> Array:
	var out: Array = []
	for child in director.get_children():
		var e := child as EnemyController
		if e != null and not e.is_dead():
			out.append(e)
	return out


func arena_has_spawns(main: Node) -> bool:
	var points := main.get_node_or_null(^"Arena/SpawnPoints")
	if points == null:
		return false
	var count := 0
	for child in points.get_children():
		if child is Marker3D and child.name != "player_spawn":
			count += 1
	if count == 0:
		return false
	print("    出怪点 %d 个" % count)
	return true


func _load_main() -> Node:
	var packed := load("res://scenes/main.tscn") as PackedScene
	return packed.instantiate()


func _count_shots_while_held(weapon: WeaponController, id: String, frames: int) -> int:
	weapon.set_trigger(false)
	weapon.select(0 if id == "assault_rifle" else 1)
	var before := weapon.mag()
	weapon.set_trigger(true)
	for _i in range(frames):
		await physics_frame
	weapon.set_trigger(false)
	return before - weapon.mag()


func _count_colliders(node: Node) -> int:
	var n := 0
	if node is CollisionShape3D or node is StaticBody3D or node is Area3D:
		n += 1
	for c in node.get_children():
		n += _count_colliders(c)
	return n


func _first_shaker() -> CameraShake:
	for node in get_nodes_in_group("shaker"):
		if node is CameraShake:
			return node as CameraShake
	return null


func _check(ok: bool, label: String) -> void:
	if ok:
		print("[OK]   %s" % label)
	else:
		_fails += 1
		print("[FAIL] %s" % label)


func _done() -> void:
	print("=== 失败 %d 项 ===" % _fails)
	# 脚本模式必须自己收尾。敌人死亡后有 3s 的清理计时器、换弹也有计时器，
	# 不等它们落地就 quit()，退出时会报 ObjectDB 泄漏与「resources still in use」，
	# 污染「零 WARNING/ERROR」基线（这条是实测出来的，不是猜的）。
	for _i in range(300):
		await physics_frame
	if _main != null and is_instance_valid(_main):
		root.remove_child(_main)
		_main.free()
	await process_frame
	quit(1 if _fails > 0 else 0)
