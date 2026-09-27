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
