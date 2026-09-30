# 第七轮探针：4.7 着色器语言的内置标识符与 uniform hint 实测清单
#
# 判读方式：日志里「PROBE7 TRY x」之后**同一帧内**出现 SHADER ERROR ⇒ x 在 4.7 不可用。
# 每换一次 shader 都 await 一帧，给 dummy 渲染器留出编译时机。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_shader_builtins.gd
extends SceneTree

const IDS := [
	"world_vertex", "world_position", "world_coords", "vertex", "VERTEX",
	"position", "normal", "tangent", "binormal", "uv", "uv2", "color",
	"front_facing", "instance", "INSTANCE_ID", "SCREEN_UV", "TIME",
	"VIEWPORT_SIZE", "SCREEN_PIXEL_SIZE", "CAMERA_MATRIX", "INV_CAMERA_MATRIX",
	"PROJECTION_MATRIX", "INV_PROJECTION_MATRIX", "MODEL_MATRIX", "INV_MODEL_MATRIX",
	"ALPHA", "ROUGHNESS", "METALLIC", "SPECULAR", "RIM", "NORMAL", "NORMAL_DEPTH",
	"REFRACTION", "REFLECTION_OFFSET", "HEIGHT", "TRANSMISSION", "CLEARCOAT",
	"ANISOTROPY", "BACKLIGHT", "IRIDESCENCE", "SNAPPING", "MOTION", "MOTION_VECTOR",
	"SPECIAL", "LIGHT_INDIRECT_FACTOR", "SHADOW_ATTENUATION", "PI", "FRAGCOORD",
	"OUTPUT", "EMISSION",
]

# uniform hint：这些决定「能不能拿屏幕图/深度图/法线图」，是水面与后期 pass 的命门
const HINTS := [
	"hint_screen_texture", "hint_depth_texture", "hint_normal_roughness_texture",
	"source_color", "repeat_enable", "repeat_disable", "filter_nearest", "filter_linear",
	"filter_nearest_mipmap", "filter_linear_with_mipmap", "mips_with_srgb",
	"hint_default_white", "hint_default_black", "hint_anisotropy_81", "hint_roughness_one",
	"group_with_textures", "group_with_3d_textures", "deterministic", "lowp", "mediump", "highp",
]

var mi: MeshInstance3D
var mat: ShaderMaterial
var idx := 0


func _initialize() -> void:
	print("PROBE7-BEGIN")
	var quad := QuadMesh.new()
	quad.size = Vector2(1, 1)
	mat = ShaderMaterial.new()
	mat.shader = Shader.new()
	mi = MeshInstance3D.new()
	mi.mesh = quad
	mi.material_override = mat
	root.add_child(mi)
	_run_ids()


func _run_ids() -> void:
	idx = 0
	while idx < IDS.size():
		var n := String(IDS[idx])
		mat.shader = _mk(_code_id(n))
		print("PROBE7 TRY id %s" % n)
		idx += 1
		await process_frame
	_run_hints()


func _run_hints() -> void:
	for h in HINTS:
		var name := String(h)
		mat.shader = _mk(_code_hint(name))
		print("PROBE7 TRY hint %s" % name)
		await process_frame
	print("PROBE7-END")
	quit(0)


func _mk(code: String) -> Shader:
	var sh := Shader.new()
	sh.code = code
	return sh


static func _code_id(ident: String) -> String:
	return "shader_type spatial;\nvoid fragment() {\n\tvec4 t = vec4(%s);\n\tALBEDO = t.xyz;\n}\n" % ident


static func _code_hint(hint: String) -> String:
	return "shader_type spatial;\nuniform sampler2D probe_tex : %s;\nvoid fragment() {\n\tALBEDO = texture(probe_tex, vec2(0.5)).xyz;\n}\n" % hint
