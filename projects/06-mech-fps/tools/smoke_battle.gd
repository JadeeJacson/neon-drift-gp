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
	"drone": 0.65,
	"charger": 0.81,
	"trooper": 0.9,
	"heavy": 1.28,
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

	# 0c) PBR 表面必须**真的挂上了**。贴图没导入时 build_arena 会退回 Kenney 原型网格图，
	#     画面看着仍是灰盒，而且不报错——只有断言能区分「重跑过生成」和「生成对了」。
	var pbr_ok := 0
	var bodies := 0
	for body in main.get_node(^"Arena").get_children():
		var box_body := body as StaticBody3D
		if box_body == null:
			continue
		bodies += 1
		for part in box_body.get_children():
			var skin := part as MeshInstance3D
			if skin == null:
				continue
			var mat := skin.material_override as StandardMaterial3D
			if mat == null or mat.albedo_texture == null or mat.normal_texture == null \
					or mat.roughness_texture == null or not mat.uv1_triplanar:
				continue
			if not String(mat.albedo_texture.resource_path).contains("ambientcg"):
				continue
			pbr_ok += 1
	_check(bodies >= 15, "blockout 盒子数量应≥15（实测 %d；两张图 19/23 个）" % bodies)
	_check(pbr_ok == bodies,
		"所有 blockout 表面都该走 ambientCG PBR（实测 %d/%d，其余是原型网格图或纯色）" % [pbr_ok, bodies])

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

	# 5c) 枪口点几何：**三把枪都要过**，不能只测第一把。
	#     接了带手臂的 rig 之后霰弹的枪口被算到 3.3 米外、0.7 米下方（包围盒把三把枪
	#     并一起了），而原来这条只 select(0)——所以它当时是绿的，问题靠截图才发现。
	var fwd := -camera.global_transform.basis.z
	for idx in range(weapon.weapon_order.size()):
		weapon.select(idx)
		# 等拔枪动作播完再量：Unholster 的头几帧枪还在腰侧，那时候的枪口方向不算数
		for _s in range(30):
			await physics_frame
		var to_muzzle := weapon.muzzle_global() - camera.global_position
		var vid := weapon.current_id()
		_check(to_muzzle.length() > 0.25 and to_muzzle.length() < 1.4,
			"%s 枪口离相机 %.2fm，不该贴身也不该伸太出" % [vid, to_muzzle.length()])
		_check(fwd.dot(to_muzzle.normalized()) > 0.8,
			"%s 枪口应在视野前方，否则曳光会横穿屏幕" % vid)
		_check(to_muzzle.y < 0.02, "%s 枪口应不高于视线，第一人称枪该在屏幕下方" % vid)
	weapon.select(0)

	# 5d) 带手 viewmodel 的动画链（用户反馈「没有换弹动作」的正解）：
	#     绑定模型必须真的用自带动画，且曳光起点跟着模型自带的枪口节点走。
	#     tween 只是静态枪的兜底，有真动画时不该再抖位置。
	for id in WeaponController.VIEWMODELS:
		var missing: PackedStringArray = weapon.vm_missing_anim_clips(String(id))
		_check(missing.is_empty(),
			"%s 的 viewmodel 动画配置应全部可播（缺：%s）" % [String(id), ", ".join(missing)])
	weapon.select(0)
	weapon.force_reload_for_shot()
	await physics_frame
	_check(weapon.vm_animation_for_test() == "Armature|Reload",
		"步枪换弹也该播模型自带的 Reload（实测 %s）" % weapon.vm_animation_for_test())
	# select() 会把 _reload_until 清零：不复位就会把换弹态带进后面的震屏断言（try_fire 被挡住）
	weapon.select(0)
	# 断言不能钉死在某个武器 id 上（素材面还在换）：先找一把「配置里声明了 anim」的枪。
	var rigged_index := -1
	var rigged_clip := ""
	var rigged_has_marker := false
	var rigged_name := ""
	for idx in range(weapon.weapon_order.size()):
		var id := weapon.weapon_order[idx]
		var cfg: Dictionary = WeaponController.VIEWMODELS.get(id, {})
		if cfg.has("anim"):
			rigged_index = idx
			rigged_name = String(id)
			rigged_clip = String((cfg["anim"] as Dictionary).get("reload", ""))
			rigged_has_marker = cfg.has("muzzle_node")
			break
	_check(rigged_index >= 0, "至少有一把枪接了带手 + 真动画的 viewmodel")
	if rigged_index >= 0:
		weapon.select(rigged_index)
		for _i in range(40):
			await physics_frame   # 等拔枪动作播完，停在待机姿态
		var marker := weapon.muzzle_marker_for_test()
		_check(marker != null or not rigged_has_marker,
			"%s 声明了 muzzle_node 就该找得到（fit 的锚点之一）" % rigged_name)
		if marker != null:
			_check(not marker.visible, "枪口标记节点必须隐藏，否则枪口挂一块常驻白片")
			var drift: float = weapon.to_local(weapon.muzzle_global()).distance_to(weapon.muzzle_rest_local())
			_check(drift < 0.06,
				"待机姿态下枪口节点应落在 fit 解出的点上（偏 %.3f m）" % drift)
		weapon.force_reload_for_shot()
		await physics_frame
		_check(weapon.vm_animation_for_test() == rigged_clip,
			"%s 换弹应播模型自带的 %s（实测 %s）" % [
				rigged_name, rigged_clip, weapon.vm_animation_for_test()])
		# 「枪口跟着手动」只有声明了标记节点的枪才成立：步枪没有 muzzle 节点，
		# muzzle_global() 退回契约静态点，本来就一动不动（这不是 bug，别误判）。
		if rigged_has_marker:
			var idle_muzzle := weapon.muzzle_global()
			for _i in range(30):
				await physics_frame
			var moved: float = idle_muzzle.distance_to(weapon.muzzle_global())
			_check(moved > 0.02, "换弹动画必须真的挪动枪口（实测 %.3f m）" % moved)
		for _i in range(int(WeaponTable.field(rigged_name, "reload_time") * 70.0) + 20):
			await physics_frame   # 让换弹计时走完，别把 reload 状态带进后面的断言
		weapon.select(0)

	# 5e) 死亡表现：打死之后模型必须有可见变化（倒地/下沉/缩小），
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

	# 5e2) 统一骨架契约：四种敌型必须共用同一套节点与同名 clip（Kenney 方块人）。
	#      这条存在的意义是防止「某一型偷偷换回旧模型」——骨架一分叉，动画映射与队伍配色
	#      就会只对部分敌型生效，而那正是制作人这轮要解决的问题。
	for scene_path in ["res://scenes/enemies/swarm_drone.tscn", "res://scenes/enemies/charger_melee.tscn",
			"res://scenes/enemies/trooper_soldier.tscn", "res://scenes/enemies/heavy_walker.tscn"]:
		var packed := load(scene_path) as PackedScene
		var probe := packed.instantiate() as EnemyController
		main.add_child(probe)
		var parts := _part_names(probe)
		var missing: Array = []
		for part in ["root", "torso", "head", "arm-left", "arm-right", "leg-left", "leg-right"]:
			if not parts.has(part):
				missing.append(part)
		_check(missing.is_empty(),
			"%s 缺统一骨架部件 %s" % [scene_path.get_file(), ", ".join(missing)])
		_check(probe.anim_clip_count_for_test() >= 20,
			"%s 应有整套 clip（实测 %d）" % [scene_path.get_file(), probe.anim_clip_count_for_test()])
		main.remove_child(probe)
		probe.free()

	# 5h) 换弹分段音效：按时间轴逐段响、顺序对、切枪能掐掉。
	#     这条锁的是「音效与动画事件对齐」这件事本身——以前是一进换弹响一次性音效，
	#     听起来像「咔」一下完事，跟手上在做什么没关系。
	weapon.select(0)
	weapon.force_reload_for_shot()
	var waited := 0
	while weapon.pending_reload_stages_for_test() > 0 and waited < 300:
		await physics_frame
		waited += 1
	var stage_log := weapon.reload_log_for_test()
	var expect: int = (WeaponPresentation.RELOAD_STAGES["assault_rifle"] as Array).size()
	_check(stage_log.size() == expect,
		"步枪换弹应响满 %d 段（实测 %d 段）" % [expect, stage_log.size()])
	_check(stage_log.size() > 1 and stage_log[0] == "reload_mag_release" 			and stage_log[stage_log.size() - 1] == "reload_latch",
		"分段顺序应是 取弹匣 → … → 上膛（实测 %s）" % ", ".join(stage_log))
	weapon.select(1)
	weapon.force_reload_for_shot()
	for _i in range(20):
		await physics_frame
	weapon.select(2)
	_check(weapon.pending_reload_stages_for_test() == 0,
		"切枪必须掐掉上一把枪没响完的分段，否则会听到步枪拉机柄响在换完弹之后")
	for _i in range(200):
		await physics_frame   # 让 2 号位那次被打断的换弹计时走完，别把状态带进后面

	# 5i) 契约几何：装配层实测的枪口必须落在契约点上（三把枪轮流，上一轮就是这么漏的）
	for idx in range(weapon.weapon_order.size()):
		weapon.select(idx)
		for _i in range(30):
			await physics_frame
		var want: Vector3 = WeaponPresentation.muzzle_of(weapon.current_id())
		var got := weapon.to_local(weapon.muzzle_global())
		_check(got.distance_to(want) <= WeaponPresentation.MUZZLE_TOLERANCE,
			"%s 枪口离契约点 %.3f m（容差 %.2f）" % [
				weapon.current_id(), got.distance_to(want), WeaponPresentation.MUZZLE_TOLERANCE])
	weapon.select(0)

	# 5f) 人形敌人的动画链：trooper 已从机械模型换成 Quaternius 的 SWAT 人形（CC0，24 段）。
	#     位移是脚本推的，光看位置变化证明不了「腿在迈」，只能读 AnimationPlayer 的当前 clip。
	#     骨架前缀（`CharacterArmature|`）没匹配上时的症状正是「模型滑步」，所以这条必须锁。
	var soldier := (load("res://scenes/enemies/trooper_soldier.tscn") as PackedScene).instantiate()
	main.add_child(soldier)
	soldier.global_position = camera.global_position + Vector3(0, -20, -40)  # 又远又低：一直停在跑动态，采样才稳定
	for _i in range(30):
		await physics_frame
	var human := soldier as EnemyController
	_check(human != null, "人形敌人根节点是 EnemyController")
	if human != null:
		_check(human.anim_clip_count_for_test() >= 20,
			"人形敌人应带完整动画库（实测 %d 段）" % human.anim_clip_count_for_test())
		_check(not human.animation_name_for_test().is_empty(),
			"人形敌人必须真的在播 clip（实测「%s」，空=前缀没匹配上，会站桩/滑步）"
			% human.animation_name_for_test())
		# 制作人实跑报「人形敌人没有动作」。查下来是这批 GLB 每段 clip 的 loop_mode 都是 0，
		# Run 只有 0.79 秒，播完就冻在最后一帧。上面那条 current_animation 断言抓不到它
		# （字符串是对的），所以这里直接断言循环策略。
		_check(human.anim_loop_mode_for_test("run") == Animation.LOOP_LINEAR,
			"位移动画必须循环（实测 loop_mode=%d，0=播完冻结）" % human.anim_loop_mode_for_test("run"))
		_check(human.anim_loop_mode_for_test("idle") == Animation.LOOP_LINEAR,
			"待机动画必须循环（实测 loop_mode=%d）" % human.anim_loop_mode_for_test("idle"))
		_check(human.anim_loop_mode_for_test("death") == Animation.LOOP_NONE,
			"死亡动画不该循环（实测 loop_mode=%d）" % human.anim_loop_mode_for_test("death"))
		# 再量一次**骨骼包围盒**随时间的变化。注意它的分工：这条抓的是「蒙皮/骨架前缀
		# 失效导致网格根本不动」，抓不到「播完冻结」——因为 _play_anim 发现 current_animation
		# 变空会再播一遍，跨度照样不为 0（实测关掉循环后仍有 0.0015）。冻结由上面那三条
		# loop_mode 断言负责（把它们关掉验证过，确实会红）。
		var spans: Array = []
		for _s in range(8):
			for _j in range(30):
				await physics_frame
			spans.append(human.motion_signature_for_test())
		var lo := INF
		var hi := 0.0
		for v in spans:
			lo = minf(lo, float(v))
			hi = maxf(hi, float(v))
		_check(hi - lo > 0.02,
			'跑动时骨骼必须持续变形（4 秒内幅度跨度 %.5f，接近 0 = 网格根本没跟着骨架动）' % (hi - lo))
	main.remove_child(soldier)
	soldier.free()

	# 5g) 阵营索敌：bot 的目标必须是「最近的敌方单位」，不是永远盯着玩家。
	#     这是团队模式（玩家 + 4 个队友 bot 对 5 个敌人）能不能成立的前提。
	#     两个 bot 放在交火线之外（z=6/8，玩家朝 -X 打），免得干扰别的断言。
	var ally := (load("res://scenes/enemies/trooper_soldier.tscn") as PackedScene).instantiate() as EnemyController
	ally.team = TeamTable.TEAM_A
	main.add_child(ally)
	ally.global_position = Vector3(-10, 0.1, 6)
	var foe := (load("res://scenes/enemies/trooper_soldier.tscn") as PackedScene).instantiate() as EnemyController
	main.add_child(foe)
	foe.global_position = Vector3(-10, 0.1, 8)
	for _i in range(30):
		await physics_frame
	_check(foe.target_for_test() == ally,
		"敌方 bot 应打最近的敌方单位（队友 bot），而不是永远盯着玩家")
	_check(ally.collision_layer == TeamTable.LAYER_FRIENDLY,
		"队友 bot 必须走独立碰撞层，玩家武器的射线才不会打中自己人")
	var before := ally.hp_for_test()
	weapon.select(0)
	for _i in range(10):
		weapon.try_fire()
		await physics_frame
	_check(ally.hp_for_test() == before, "玩家朝队友方向开枪不该掉队友血")
	main.remove_child(foe)
	foe.free()
	main.remove_child(ally)
	ally.free()

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


## 收集模型里所有节点名（用来核对统一骨架的部件是否齐备）。
func _part_names(node: Node) -> Array[String]:
	var out: Array[String] = []
	var stack: Array = [node]
	while not stack.is_empty():
		var n: Node = stack.pop_back()
		for c in n.get_children():
			stack.append(c)
			if c is Node3D:
				out.append(String((c as Node).name))
	return out


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
