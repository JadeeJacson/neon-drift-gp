# 第九轮探针：分别在 vertex / fragment 阶段确认坐标与矩阵类内置的可用性
#
# 为什么分阶段测：着色器编译器遇到第一个错误就停，一条 shader 里同时用两个阶段
# 会把「fragment 里不存在」误判成「整体不存在」（probe7/8 就是这么绕出来的）。
# 判读：日志里出现 Unknown identifier 的名字 = 该阶段不可用；
# 出现「Invalid arguments for the built-in function」= 名字存在，只是类型不匹配。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_stages.gd
extends SceneTree

const NAMES := [
	"VERTEX", "NORMAL", "TANGENT", "BINORMAL", "UV", "UV2", "COLOR", "POSITION",
	"MODEL_MATRIX", "PROJECTION_MATRIX", "INV_PROJECTION_MATRIX",
	"CAMERA_MATRIX", "INV_CAMERA_MATRIX", "VIEWPORT_CAMERA_MATRIX", "INV_VIEWPORT_CAMERA_MATRIX",
	"VIEW_MATRIX", "INV_VIEW_MATRIX", "world_vertex", "world_position", "world_coords",
	"INSTANCE", "INSTANCE_ID", "TIME", "FRAGCOORD", "SCREEN_UV", "EYEDIR",
]

var mi: MeshInstance3D
var mat: ShaderMaterial


func _initialize() -> void:
	print("PROBE9-BEGIN")
	var quad := QuadMesh.new()
	quad.size = Vector2(1, 1)
	mat = ShaderMaterial.new()
	mat.shader = Shader.new()
	mi = MeshInstance3D.new()
	mi.mesh = quad
	mi.material_override = mat
	for n in NAMES:
		var name := String(n)
		mat.shader = _mk(_code_vertex(name))
		print("PROBE9 V %s" % name)
		await process_frame
	for n in NAMES:
		var name2 := String(n)
		mat.shader = _mk(_code_fragment(name2))
		print("PROBE9 F %s" % name2)
		await process_frame
	# 工程上真正要用的写法：vertex 里拿世界坐标，fragment 里当平面坐标使
	mat.shader = _mk(_code_recipe())
	print("PROBE9 RECIPE worldpos-via-varying")
	await process_frame
	print("PROBE9-END")
	quit(0)


func _mk(code: String) -> Shader:
	var sh := Shader.new()
	sh.code = code
	return sh


static func _code_vertex(name: String) -> String:
	return "\n".join([
		"shader_type spatial;",
		"varying vec3 vv;",
		"void vertex() {",
		"\tvec4 t = vec4(%s);" % name,
		"\tvv = t.xyz;",
		"}",
		"void fragment() {",
		"\tALBEDO = vv;",
		"}",
	]) + "\n"


static func _code_fragment(name: String) -> String:
	return "\n".join([
		"shader_type spatial;",
		"varying vec3 vv;",
		"void vertex() {",
		"\tvv = vec3(0.0);",
		"}",
		"void fragment() {",
		"\tvec4 t = vec4(%s);" % name,
		"\tALBEDO = vv + t.xyz;",
		"}",
	]) + "\n"


static func _code_recipe() -> String:
	return "\n".join([
		"shader_type spatial;",
		"varying vec3 wpos;",
		"varying vec3 vviewnormal;",
		"void vertex() {",
		"\twpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;",
		"\tvviewnormal = normalize((CAMERA_MATRIX * vec4(NORMAL, 0.0)).xyz);",
		"}",
		"void fragment() {",
		"\tALBEDO = wpos * 0.1;",
		"\tNORMAL = vviewnormal;",
		"}",
	]) + "\n"
