@tool
extends SceneTree
## 探针：把原生类的常量/枚举名打出来，避免靠记忆猜（猜错就是「Cannot find member」编译失败）。
##
##   engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe \
##     --headless --path projects/08-neon-dive -s res://tools/probe_class.gd Light2D GradientTexture2D

func _initialize() -> void:
	for cls in ["Light2D", "GradientTexture2D", "CanvasItem"]:
		if not ClassDB.class_exists(cls):
			print("%s: 类不存在" % cls)
			continue
		# 枚举值在 Godot 4 里叫 integer constant，方法名是 class_get_integer_constant_list
		var consts: Array = ClassDB.class_get_integer_constant_list(cls, false)
		var names: Array[String] = []
		for c in consts:
			names.append(str(c))
		print("%s: %s" % [cls, ", ".join(names)])
	quit(0)
