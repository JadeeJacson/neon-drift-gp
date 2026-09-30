# 第八轮探针：4.7 空间着色器里变换矩阵的可用阶段
#
# 背景：probe7 在 fragment() 里测 CAMERA_MATRIX / MODEL_MATRIX 等全部报 Unknown identifier，
# 但水面需要世界坐标与视图空间法线，必须知道这些矩阵到底在哪个阶段能用、叫什么。
# 判读：SHADER ERROR 会带行号，第 4 行 = vertex 段，第 8 行 = fragment 段。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_matrices.gd
extends SceneTree

const NAMES := [
	"CAMERA_MATRIX", "INV_CAMERA_MATRIX", "PROJECTION_MATRIX", "INV_PROJECTION_MATRIX",
	"MODEL_MATRIX", "INV_MODEL_MATRIX", "MODELVIEW_MATRIX", "INV_MODELVIEW_MATRIX",
	"CAMERA_MATRIX_IB", "VIEW_MATRIX", "camera_matrix", "model_matrix",
	"INSTANCE_MATRIX", "GLOBAL_MATRIX", "WORLD_MATRIX",
]

const EXTRA := [
	# 其它想在 vertex 段确认可用性的写法
	"VERTEX", "NORMAL", "TANGENT", "BINORMAL", "UV", "UV2", "POSITION", "HEIGHT",
	"MOTION", "SPECIAL", "SNAPPING", "LIGHT_DIRECTION", "OUTPUT",
]

var mi: MeshInstance3D
var mat: ShaderMaterial


func _initialize() -> void:
	print("PROBE8-BEGIN")
	var quad := QuadMesh.new()
	quad.size = Vector2(1, 1)
	mat = ShaderMaterial.new()
	mat.shader = Shader.new()
	mi = MeshInstance3D.new()
	mi.mesh = quad
	mi.material_override = mat
	root.add_child(mi)
	for n in NAMES:
		var name := String(n)
		mat.shader = _mk(_code_matrix(name))
		print("PROBE8 MATRIX %s" % name)
		await process_frame
	for n in EXTRA:
		var name2 := String(n)
		mat.shader = _mk(_code_vertex(name2))
		print("PROBE8 VTX %s" % name2)
		await process_frame
	# 最后一发：确认 varying 写法本身可用（vertex 取值 → fragment 使用）
	mat.shader = _mk(_code_varying())
	print("PROBE8 VARYING-PATH")
	await process_frame
	print("PROBE8-END")
	quit(0)


func _mk(code: String) -> Shader:
	var sh := Shader.new()
	sh.code = code
	return sh


# 行号定位：4 行是 vertex 段用法，8 行是 fragment 段用法
static func _code_matrix(name: String) -> String:
	return "\n".join([
		"shader_type spatial;",
		"varying vec4 vv;",
		"void vertex() {",
		"\tvv = vec4(0.0);",
		"\tmat4 m = %s;" % name,
		"\tvv = m[3];",
		"}",
		"void fragment() {",
		"\tmat4 m2 = %s;" % name,
		"\tALBEDO = m2[0].xyz + vv.xyz;",
		"}",
	]) + "\n"


static func _code_vertex(name: String) -> String:
	return "\n".join([
		"shader_type spatial;",
		"void vertex() {",
		"\tvec4 t = vec4(%s);" % name,
		"\tMOTION = t.xy;",
		"}",
	]) + "\n"


static func _code_varying() -> String:
	return "\n".join([
		"shader_type spatial;",
		"varying vec3 wpos;",
		"varying vec3 vnormal;",
		"void vertex() {",
		"\twpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;",
		"\tvnormal = normalize((CAMERA_MATRIX * vec4(NORMAL, 0.0)).xyz);",
		"}",
		"void fragment() {",
		"\tALBEDO = wpos;",
		"\tNORMAL = vnormal;",
		"}",
	]) + "\n"
