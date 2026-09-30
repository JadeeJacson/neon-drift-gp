// 自定义后期叠加：屏幕空间的晕影 + 边缘色散 + 胶片颗粒
//
// 为什么用 canvas_item + hint_screen_texture 而不是引擎内置项：
// 4.7 的 Environment 提供了 glow / AgX / adjustment（含 LUT），但没有晕影、
// 色散与颗粒这三个「镜头感」要素；TA 实践里就是加一层全屏 pass 处理。
// 注意它跑在色调映射之后的 sRGB 显示空间，所以这里的数值都是显示空间的观感量。
shader_type canvas_item;
render_mode unshaded;

uniform sampler2D screen_tex : hint_screen_texture, repeat_disable, filter_nearest;

uniform float vignette_gain = 0.42;
uniform float vignette_start = 0.16;
uniform float vignette_end = 0.82;
uniform float chromatic_gain = 0.0026;
uniform float grain_gain = 0.020;
uniform float grain_scale = 1.35;
uniform vec3 shadow_tint : source_color = vec3(0.86, 0.93, 1.06);
uniform vec3 highlight_tint : source_color = vec3(1.06, 0.98, 0.86);
uniform float tint_strength = 0.18;
uniform bool enabled = true;


float hash12(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}


void fragment() {
	vec2 uv = SCREEN_UV;
	vec2 d = uv - 0.5;
	float r2 = dot(d, d) * 4.0; // 0 中心 → ~2 四角

	if (!enabled) {
		COLOR = texture(screen_tex, uv);
	} else {
		// 色散：离开中心的距离越大，红蓝采样偏移越明显
		vec2 ca = d * chromatic_gain * r2;
		vec3 col;
		col.r = texture(screen_tex, clamp(uv + ca, vec2(0.001), vec2(0.999))).r;
		col.g = texture(screen_tex, uv).g;
		col.b = texture(screen_tex, clamp(uv - ca, vec2(0.001), vec2(0.999))).b;

		// 晕影
		float vig = 1.0 - vignette_gain * smoothstep(vignette_start, vignette_end, r2);
		col.rgb *= vig;

		// 分色染色：暗部推冷、亮部推暖（在显示空间做，符合人眼对「镜头味」的直觉）
		float l = dot(col.rgb, vec3(0.2126, 0.7152, 0.0722));
		float sh = 1.0 - smoothstep(0.02, 0.34, l);
		float hi = smoothstep(0.46, 0.98, l);
		col.rgb = mix(col.rgb, col.rgb * shadow_tint, sh * tint_strength);
		col.rgb = mix(col.rgb, col.rgb * highlight_tint, hi * tint_strength);

		// 颗粒：随时间抖动的哈希噪声，强度压得很低（>0.04 就会脏）
		vec2 gp = uv * SCREEN_PIXEL_SIZE * 900.0 * grain_scale + vec2(TIME * 37.0, TIME * 17.0);
		float g = hash12(floor(gp));
		col.rgb += (g - 0.5) * grain_gain;

		COLOR = vec4(col.rgb, 1.0);
	}
}
