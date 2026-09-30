shader_type canvas_item;
// 玩法期角色/tile 的霓虹材质（模式 2「深海生物发光」定调，制作人 2026-09-27 拍板）
//
// 与实验室版 neon_palette.gdshader 的区别：这里只保留实际会用到的两支，
// 并且多两个运行时入口——flash（受击/命中闪白）与 emissive（自发光通道，
// 给 CanvasModulate 压暗后的画面当「光源」，配合 PointLight2D 才有霓虹感）。
//
// 语法约束（实测，见路线图 §5.0c）：4.7 不接受 `: hint_range(...)` 老式提示，
// fragment() 里也不能 return。所以参数全部裸写，范围靠代码保证。

uniform int mode = 2;                                   // 0 原图 / 2 生物发光
uniform vec4 glow_color = vec4(0.35, 0.95, 1.0, 1.0);   // 高光染色（青）
uniform vec4 shadow_tint = vec4(0.02, 0.05, 0.13, 1.0); // 暗部底色
uniform float dark_gamma = 1.45;                        // 压暗中间调
uniform float emissive_threshold = 0.60;                // 多亮算自发光
uniform float emissive_boost = 1.5;
uniform float flash = 0.0;                              // 0..1 闪白强度（代码每帧写）
uniform vec4 flash_color = vec4(1.0, 0.92, 0.85, 1.0);  // 闪白偏暖，和青色环境对打
uniform float emissive = 0.0;                           // 额外自发光（角色随身光/刃口）

void fragment() {
	vec4 base = texture(TEXTURE, UV) * COLOR;
	if (base.a > 0.001) {
		float lum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
		float shaped = pow(clamp(lum, 0.0, 1.0), dark_gamma);
		vec3 outc;
		if (mode == 0) {
			outc = base.rgb;
		} else {
			vec3 shaded = mix(shadow_tint.rgb, base.rgb, smoothstep(0.0, 0.55, shaped));
			float em = smoothstep(emissive_threshold, 1.0, shaped);
			outc = shaded + glow_color.rgb * em * emissive_boost;
		}
		// 自发光通道：不受 CanvasModulate 压暗影响的那部分亮度
		outc += glow_color.rgb * emissive;
		// 闪白：命中瞬间把整张 sprite 推向暖白，比单纯改亮度更像「被打到」
		outc = mix(outc, flash_color.rgb * (1.0 + emissive_boost), clamp(flash, 0.0, 1.0));
		COLOR = vec4(clamp(outc, 0.0, 4.0), base.a);
	} else {
		COLOR = vec4(0.0);
	}
}
