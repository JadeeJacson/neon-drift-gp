extends GutTest

## 枪械表现层契约的断言（docs/06 §7.2f）。
## 契约要解决的是制作人这轮点的两件事：切枪时枪在屏幕上跳位、以及
## 「后坐/震屏/顿帧/曳光/枪口焰」各写一套口径没人核对。
## 所以这里锁的不是「某个数是多少」，而是**共用规则本身没被绕过**。

const IDS := ["assault_rifle", "shotgun", "dmr_sniper"]


## 每把枪都必须在契约里登记过；漏一把，装配层就会退回它自己那套手填参数（历史状态）。
func test_every_weapon_is_registered() -> void:
	for id in IDS:
		assert_true(WeaponPresentation.has_id(String(id)), "%s 未登记视觉长度" % String(id))
		assert_true(WeaponTable.has_id(String(id)), "%s 在数值表里不存在" % String(id))


## 枪口必须都落在同一条轴线上、都在视野右下方。
## 这条就是「切枪不跳位」的几何表达：三把枪的枪口到握把的连线方向必须一致。
func test_muzzles_share_one_barrel_axis() -> void:
	var grip := WeaponPresentation.GRIP
	for id in IDS:
		var muzzle := WeaponPresentation.muzzle_of(String(id))
		var offset := muzzle - grip
		assert_true(offset.length() > 0.2 and offset.length() < 1.0,
			"%s 的握把→枪口距离 %.2f m 不在合理区间" % [String(id), offset.length()])
		# 与声明轴线的夹角：用归一化点积卡，比直接比 y/x 更能发现「有人偷偷改了轴」
		var cos := offset.normalized().dot(WeaponPresentation.BARREL_AXIS)
		assert_gt(cos, 0.999, "%s 的枪口不在共用枪管轴上" % String(id))
		assert_lt(muzzle.y, 0.0, "%s 的枪口不该高过视线" % String(id))
		assert_gt(muzzle.x, 0.0, "%s 的枪口该在画面右侧（右手持枪）" % String(id))


## 视觉枪管长必须互不相同（三把枪的轮廓要有区分度），但都在一个可接受的带宽里，
## 否则「统一契约」会退化成「三把枪一样长」。
func test_barrel_lengths_differ_but_stay_in_band() -> void:
	var seen := {}
	for id in IDS:
		var len := float(WeaponPresentation.VIEW[id]["barrel"])
		assert_gt(len, 0.35, "%s 枪管太短，会看不出是哪把枪" % String(id))
		assert_lt(len, 0.75, "%s 枪管太长，会糊住准星" % String(id))
		seen[str(len)] = true
	assert_eq(seen.size(), IDS.size(), "三把枪的视觉枪管长必须两两不同")


## 顿帧按制作人的判定是**全局关闭**（原话「不用」）。
## 数值仍留在 weapon_table 里，所以这里锁的是开关而不是数值——
## 将来要只开重武器，改一处即可，不用回到三个分支里找。
func test_hitstop_is_globally_off() -> void:
	assert_false(WeaponPresentation.HITSTOP_ENABLED,
		"制作人 2026-09-27 判定：顿帧不开。要开请先确认移动手感不被时间缩放拖黏")


## 换弹分段的形状契约：3~5 段、时间严格递增、全部落在换弹过程内部。
## 为什么用比例而不是秒：三把枪 reload_time 不同（2.0 / 2.7 / 2.5），
## 而 clip 的动作阶段是按比例对齐的。
func test_reload_stage_shape() -> void:
	for id in IDS:
		var stages: Array = WeaponPresentation.RELOAD_STAGES[id]
		var n := stages.size()
		assert_gt(n, 2, "%s 的分段太少，听不出过程" % String(id))
		assert_lt(n, 6, "%s 的分段太密，会糊成一片" % String(id))
		var prev := -1.0
		for stage in stages:
			var at := float(stage["at"])
			assert_gt(at, prev, "%s 的分段时间必须递增" % String(id))
			assert_gt(at, 0.0, "%s 第一段不该在 0 秒" % String(id))
			assert_lt(at, 1.0, "%s 最后一段不该晚于换弹结束" % String(id))
			assert_false(String(stage["sfx"]).is_empty(), "%s 有分段没配音效" % String(id))
			prev = at


## 换算成绝对秒数后仍要单调，且不能超出 reload_time（乘错系数就会越界）。
func test_stage_times_scale_with_reload_time() -> void:
	for id in IDS:
		var duration := float(WeaponTable.field(String(id), "reload_time"))
		var timed: Array = WeaponPresentation.reload_stages(String(id), duration)
		var prev := -1.0
		for stage in timed:
			var at := float(stage["at"])
			assert_gt(at, prev, "%s 绝对时刻必须递增" % String(id))
			assert_lt(at, duration, "%s 分段不该晚于换弹结束" % String(id))
			prev = at


## 分段形状要真的区分枪种：弹匣式的第一段是「取弹匣」，泵动式的第一段是「压弹」。
## 三把枪若共用一份分段，契约就只是形式统一、听感仍然不对应。
func test_stage_shapes_differ_by_mechanism() -> void:
	var first := {}
	for id in IDS:
		first[String(id)] = String((WeaponPresentation.RELOAD_STAGES[id] as Array)[0]["sfx"])
	assert_ne(first["assault_rifle"], first["shotgun"],
		"泵动霰弹不该沿用弹匣式的第一段")
