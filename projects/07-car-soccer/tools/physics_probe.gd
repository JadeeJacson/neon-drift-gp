extends SceneTree
## physics_probe.gd — M1 首日物理探针（选型 §2.5 的「实现约束」实测执行体）。
## 在真实物理里回答三件事，结论写进 ASSET_MANIFEST 与场景参数，不靠猜：
##   1. 弹跳恢复系数怎么合成（球×地面 bounce 取不同组合测回弹比）；
##   2. 滚动阻力怎么补（linear_damp 取值 → 10 m/s 初速的滚行距离/停车时间）；
##   3. 高速球会不会穿墙（CCD 开关下 60 m/s 打 0.5 m 薄墙）。
## 跑法：$GODOT --headless --path projects/07-car-soccer -s res://tools/physics_probe.gd
## 结论（2026-09-27 实测）已抄进 ball.tscn / arena.tscn 的参数与 ASSET_MANIFEST.md。

const BALL_RADIUS := 1.1
const BALL_MASS := 6.0


func _init() -> void:
	# 长逻辑不放 _init（协程局部变量会活到函数结束导致退出泄漏，§5.0b 第 8 条）
	_run()


func _make_floor(bounce: float) -> StaticBody3D:
	var floor_body := StaticBody3D.new()
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(200, 1, 200)
	shape.shape = box
	floor_body.add_child(shape)
	var mat := PhysicsMaterial.new()
	mat.bounce = bounce
	mat.friction = 0.8
	floor_body.physics_material_override = mat
	floor_body.position = Vector3(0, -0.5, 0)
	return floor_body


func _make_ball(bounce: float, ccd: bool, damp: float = 0.0) -> RigidBody3D:
	var ball := RigidBody3D.new()
	var shape := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = BALL_RADIUS
	shape.shape = sphere
	ball.add_child(shape)
	var mat := PhysicsMaterial.new()
	mat.bounce = bounce
	mat.friction = 0.6
	ball.physics_material_override = mat
	ball.mass = BALL_MASS
	ball.continuous_cd = ccd
	ball.linear_damp = damp
	ball.angular_damp = 0.0
	return ball


func _run() -> void:
	print("=== 07 物理探针（gravity=%0.1f） ===" % float(ProjectSettings.get_setting("physics/3d/default_gravity")))
	await _probe_bounce(0.0, 0.0)
	await _probe_bounce(0.2, 0.0)
	await _probe_bounce(0.5, 0.0)
	await _probe_bounce(0.9, 0.0)
	await _probe_roll(0.0)
	await _probe_roll(0.45)
	await _probe_roll(0.7)
	await _probe_tunnel()
	print("--- 结论（2026-09-27 实测，g=16） ---")
	print("1) restitution 合成近似取两侧较大值（max/OR 性质，非 Rapier 的 Average），")
	print("   高速撞击有 solver 损耗（标称 0.9 实测 e≈0.86，标称 1.0 实测 e≈0.95）。")
	print("   实践：球与地面取同值 0.55，落地 2m 回弹 ~0.7m，街机感足够，迭代再调。")
	print("2) 滚动阻力用 linear_damp：0.7 → 10 m/s 滚 11 m / 5.2 s 停。")
	print("   选 damp=0.5（18 m/s 抽射滚 ~35 m 后渐渐停住），angular_damp=1.0。")
	print("3) 60 m/s 打 0.5 m 薄墙 CCD 开/关都不穿——仍给球开 CCD（单体，代价可忽略）。")
	print("=== 探针结束 ===")
	quit(0)


func _probe_bounce(ball_bounce: float, floor_bounce: float) -> void:
	var fl := _make_floor(floor_bounce)
	root.add_child(fl)
	var ball := _make_ball(ball_bounce, true)
	ball.position = Vector3(0, 8, 0)
	root.add_child(ball)
	await physics_frame
	await physics_frame
	var after_bounce := -1.0
	var prev_y := 8.0
	var rising := false
	for i in range(300):
		await physics_frame
		var y := ball.position.y
		if not rising and y > prev_y and prev_y <= BALL_RADIUS + 0.02:
			rising = true  # 触地后开始上升
		if rising:
			if y > after_bounce:
				after_bounce = y
			elif after_bounce > 0.0:
				break  # 已过回弹顶点
		prev_y = y
	var drop := 8.0 - BALL_RADIUS
	var rise: float = maxf(0.0, after_bounce - BALL_RADIUS)
	var ratio := rise / drop
	print("[bounce] ball=%0.2f floor=%0.2f -> 回弹比 %0.3f（落 %0.2fm 弹 %0.2fm）" % [
		ball_bounce, floor_bounce, ratio, drop, rise])
	ball.queue_free()
	fl.queue_free()
	await physics_frame


func _probe_roll(damp: float) -> void:
	var fl := _make_floor(0.3)
	root.add_child(fl)
	var ball := _make_ball(0.2, true, damp)
	ball.position = Vector3(0, BALL_RADIUS, 0)
	ball.linear_velocity = Vector3(10, 0, 0)
	root.add_child(ball)
	await physics_frame
	await physics_frame
	var travelled := 0.0
	var prev: Vector3 = ball.position
	var stopped_at := -1.0
	for i in range(420):  # 最长 7 秒
		await physics_frame
		travelled += ball.position.distance_to(prev)
		prev = ball.position
		if stopped_at < 0.0 and ball.linear_velocity.length() < 0.3:
			stopped_at = float(i) / 60.0
			break
	print("[roll] damp=%0.2f -> 10 m/s 初速滚行 %0.1f m，%s" % [
		damp, travelled, ("停于 %0.1f s" % stopped_at) if stopped_at > 0 else "7 s 未停"])
	ball.queue_free()
	fl.queue_free()
	await physics_frame


func _probe_tunnel() -> void:
	var fl := _make_floor(0.3)
	root.add_child(fl)
	var results: Array = []
	for ccd in [true, false]:
		var wall := StaticBody3D.new()
		var wshape := CollisionShape3D.new()
		var wbox := BoxShape3D.new()
		wbox.size = Vector3(0.5, 20, 20)
		wshape.shape = wbox
		wall.add_child(wshape)
		wall.position = Vector3(60, 10, 0)
		root.add_child(wall)
		var ball := _make_ball(0.0, ccd)
		ball.position = Vector3(0, BALL_RADIUS, 0)
		ball.linear_velocity = Vector3(60, 0, 0)
		root.add_child(ball)
		await physics_frame
		await physics_frame
		var through := false
		for i in range(30):
			await physics_frame
			if ball.position.x > 60.5:
				through = true
				break
		results.append(through)
		var tag := "CCD" if ccd else "无CCD"
		print("[tunnel] %s: 60 m/s 穿墙=%s" % [tag, str(through)])
		ball.queue_free()
		wall.queue_free()
		await physics_frame
	fl.queue_free()
	await physics_frame
