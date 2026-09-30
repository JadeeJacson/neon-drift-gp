# 列出 ProjectSettings 里所有匹配子串的键与当前值（确认键名是否存在 / 值是多少）。
# 用法：$G --headless --path projects/16-lumen-bench -s res://tools/probe_settings.gd
extends SceneTree

const HINTS := [
	"rendering_method",
	"directional_shadow",
	"positional_shadow",
	"sdfgi",
	"scaling/3d",
	"screen_space_aa",
	"taa",
	"glow",
	"occlusion",
	"msaa",
	"deband",
	"anisotropic",
	"shadow",
	"gi/",
	"volumetric",
	"ssil",
	"ssao",
	"ssr",
]


func _initialize() -> void:
	print("SETTINGS-BEGIN")
	var all := ProjectSettings.get_property_list()
	var hits := []
	for p in all:
		var n := String(p.get("name", ""))
		if not n.begins_with("rendering/") and not n.begins_with("debug/"):
			continue
		for h in HINTS:
			if n.contains(h):
				hits.append(n)
				break
	hits.sort()
	for n in hits:
		print("  %s = %s" % [n, str(ProjectSettings.get_setting(n))])
	print("SETTINGS-END")
	quit(0)
