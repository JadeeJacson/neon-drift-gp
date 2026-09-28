extends RefCounted
class_name CombatFx
## 交火的可见反馈：曳光、枪口焰、以及给测试用的计数。
##
## 为什么单独抽出来：这些效果原来只长在 `weapon_controller` 里（玩家那一侧），
## bot 开火只有伤害结算、画面上一片安静，看起来就是「凭空掉血」。玩家和 bot
## 现在共用同一套视觉语言，颜色与衰减只在这里定义一次。
##
## 刻意不做成 .tscn 场景：这类东西是「几帧后就消失」的一次品，
## 静态函数 + tween 回调自毁最省，也不会因为忘记释放而漏在树里。

## 曳光寿命（秒）与枪口焰寿命。比玩家的略长一点点：bot 通常在 10 米开外，
## 太快看不见，太慢会糊成一片激光网。
const TRACER_TIME := 0.13
const FLASH_TIME := 0.07
const TRACER_THICK := 0.022

## 给冒烟断言用的开火计数（静态：跨场景实例累计）。
static var shots := 0


static func report_shot() -> void:
	shots += 1


static func reset_for_test() -> void:
	shots = 0


static func shots_for_test() -> int:
	return shots


static func tracer(parent: Node3D, from: Vector3, to: Vector3, color: Color) -> void:
	var length := from.distance_to(to)
	if length < 0.2:
		return
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = Vector3(TRACER_THICK, TRACER_THICK, length)
	mi.mesh = bm
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.albedo_color = color
	mat.emission_enabled = true
	mat.emission = color
	mat.emission_energy_multiplier = 2.0
	mi.material_override = mat
	parent.add_child(mi)
	mi.global_position = (from + to) * 0.5
	# 接近竖直时 look_at 的 up 参考会退化（引擎会刷 WARNING），换一个参考轴
	var dir := (to - from).normalized()
	var up := Vector3.UP if absf(dir.dot(Vector3.UP)) < 0.98 else Vector3.RIGHT
	mi.look_at(to, up)
	var t := mi.create_tween()
	t.tween_property(mat, "albedo_color:a", 0.0, TRACER_TIME)
	t.tween_callback(mi.queue_free)


static func flash(parent: Node3D, at: Vector3) -> void:
	var light := OmniLight3D.new()
	light.light_energy = 3.2
	light.omni_range = 4.5
	parent.add_child(light)
	light.global_position = at
	var t := light.create_tween()
	t.tween_property(light, "light_energy", 0.0, FLASH_TIME)
	t.tween_callback(light.queue_free)
