extends GutTest
## 表现层（BattleDirector）的最小回归测试。
##
## **为什么放在 sim/tests 里**：GUT 跑在真实帧循环上，能复现 headless 冒烟
## 抓不到的时序错误——冒烟是同步执行，tween 永远不会推进，于是「死亡动画
## 播完 queue_free → _views 里留下已释放引用」这条路径在无头下根本走不到，
## 只有制作人实跑时才会以「每帧 SCRIPT ERROR」的形式刷屏（2026-09-28 实跑抓到）。

func test_sync_views_tolerates_freed_view() -> void:
	var director := BattleDirector.new()
	add_child_autofree(director)
	var host := Node3D.new()
	add_child_autofree(host)
	director.setup(
		[{"id": "knight", "star": 1, "cell": Vector2i(4, 4)}],
		[{"id": "e_bone", "star": 1, "cell": Vector2i(4, 3)}],
		7, {}, host)
	var idx: int = int(director.sim.units[0]["index"])
	var raw = director._views[idx]
	assert_true(is_instance_valid(raw), "前置：视图应当有效")
	# 模拟死亡动画播完后的 queue_free：引用还在 _views 里，对象已经没了
	raw.free()
	# 修复前：`var view: UnitView = _views[i]` 对已释放实例做强类型赋值，
	# 直接报「Trying to assign invalid previously freed instance」，
	# 后面的 is_instance_valid 根本执行不到。GUT 的 Unexpected Errors 会判失败。
	director._sync_views()
	assert_true(true, "同步含已释放视图的表不应报错")
	director.cleanup()


func test_advance_after_view_freed_still_runs() -> void:
	var director := BattleDirector.new()
	add_child_autofree(director)
	var host := Node3D.new()
	add_child_autofree(host)
	director.setup(
		[{"id": "knight", "star": 1, "cell": Vector2i(4, 4)}],
		[{"id": "e_bone", "star": 1, "cell": Vector2i(4, 3)}],
		9, {}, host)
	director.running = true
	# 把所有视图提前释放（比 queue_free 更狠），战斗必须照常推进到分出胜负
	for key in director._views:
		var v = director._views[key]
		if is_instance_valid(v):
			v.free()
	var guard := 0
	while director.sim != null and not director.sim.finished and guard < 600:
		director.advance(0.25)
		guard += 1
	assert_true(director.sim.finished, "视图被释放后战斗仍应推进到底（guard=%d）" % guard)
	director.cleanup()
