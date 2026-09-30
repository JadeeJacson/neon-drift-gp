// 水面：解析波高 + 有限差分法线 + 屏幕扭曲折射 + 岸边泡沫 + 太阳碎光
//
// 不用任何贴图：波形由两组长波与两层噪声碎波叠加，法线对高度函数做中心差分
// （3 次求值），因此在稀疏网格上也稳定。透明度走 ALPHA，水下颜色用屏幕图扭曲采样，
// 这样 SDFGI / 体积雾仍把水面当普通表面参与光照统计。
// NORMAL 需要**视图空间**法线。4.7 的矩阵内置改名了（probe9 实测）：
//   CAMERA_MATRIX → INV_VIEW_MATRIX（视图→世界），INV_CAMERA_MATRIX → VIEW_MATRIX（世界→视图）
// 且 fragment 阶段没有 world_vertex / world_position 这类东西，世界坐标要在 vertex 里取好传进来。
shader_type spatial;
render_mode blend_mix, depth_draw_always, cull_back, diffuse_burley, specular_schlick_ggx;

uniform sampler2D screen_tex : hint_screen_texture, repeat_disable, filter_nearest;

// 波面构成：长波给整体起伏，短波给碎纹
uniform vec4 swell_dir_a = vec4(0.86, 0.0, 0.51, 1.0);
uniform vec4 swell_dir_b = vec4(-0.42, 0.0, 0.91, 1.0);
uniform float wave_amp = 0.035;
uniform float wave_freq = 0.85;
uniform float chop_gain = 0.55;
uniform float flow_speed = 0.34;
// 体颜色与透明度
uniform vec3 deep_color : source_color = vec3(0.016, 0.040, 0.050);
uniform vec3 shallow_color : source_color = vec3(0.10, 0.21, 0.23);
uniform float alpha_base = 0.88;
uniform float refract_strength = 0.030;
// 太阳碎光与岸边泡沫
uniform vec3 sun_dir = vec3(0.94, -0.20, 0.12);
uniform vec3 sun_color : source_color = vec3(1.0, 0.72, 0.42);
uniform float glint_gain = 2.4;
uniform float shore_radius = 12.0;
uniform float shore_width = 0.9;
uniform float foam_gain = 1.0;

// 世界坐标由 vertex 阶段算好传递（fragment 里没有现成的世界位置内置变量）
varying vec3 wpos;


void vertex() {
	wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}


// 值噪声（纯解析，无贴图），返回 -1..1
float vnoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
	float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
	float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
	float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 2.0 - 1.0;
}


// 高度场：两组 swell + 两层碎波
float h_at(vec2 xz) {
	float t = TIME * flow_speed;
	float h = 0.0;
	h += sin(dot(xz, swell_dir_a.xy * wave_freq) + t * 1.6) * 0.6;
	h += sin(dot(xz, swell_dir_b.xy * wave_freq * 1.7) - t * 2.1) * 0.35;
	h += vnoise(xz * wave_freq * 2.3 + vec2(t * 0.4, -t * 0.25)) * chop_gain;
	h += vnoise(xz * wave_freq * 5.1 - vec2(t * 0.55, t * 0.3)) * chop_gain * 0.45;
	return h * wave_amp;
}


void fragment() {
	vec3 wp = wpos;
	vec2 xz = wp.xz;
	float e = 0.05;
	float h0 = h_at(xz);
	float hx = h_at(xz + vec2(e, 0.0));
	float hz = h_at(xz + vec2(0.0, e));
	vec3 nworld = normalize(vec3(-(hx - h0) / e, 1.0, -(hz - h0) / e));

	// 岸边泡沫：到池壁距离决定带宽，噪声决定断续
	float dist_wall = shore_radius - length(xz);
	float shore = 1.0 - smoothstep(0.0, shore_width, dist_wall);
	float broken = smoothstep(-0.25, 0.55, vnoise(xz * 3.1 + vec2(TIME * 0.35, -TIME * 0.21)));
	float foam = clamp(shore * (0.35 + 0.65 * broken) + smoothstep(0.020, 0.038, h0) * 0.16, 0.0, 1.0) * foam_gain;

	// 折射：屏幕图按法线横向偏移采样，做出水下晃动
	vec2 scr = clamp(SCREEN_UV + nworld.xz * refract_strength, vec2(0.002), vec2(0.998));
	vec3 behind = texture(screen_tex, scr).rgb;
	vec3 body = mix(deep_color, shallow_color, clamp(h0 / (wave_amp * 2.0) * 0.5 + 0.5, 0.0, 1.0));
	vec3 transmitted = behind * body * 5.5;

	// 太阳碎光：反射向量与太阳方向的窄高斯 + 高频闪粒
	vec3 view_dir = normalize(wp - (INV_VIEW_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz);
	vec3 refl = reflect(view_dir, nworld);
	vec3 sdir = normalize(sun_dir);
	float glint = pow(max(dot(refl, -sdir), 0.0), 200.0) * glint_gain;
	float sparkle = pow(max(vnoise(xz * 21.0 + vec2(TIME * 0.85, -TIME * 0.66)), 0.0), 13.0) * 0.8;
	// 天光反射：朝向天空的分量给一层冷色
	float sky_ref = pow(max(dot(refl, vec3(0.0, 1.0, 0.0)), 0.0), 5.0);

	vec3 col = mix(transmitted, shallow_color * 2.2, foam);
	col += sun_color * (glint + sparkle * 0.30);
	col += vec3(0.26, 0.38, 0.50) * sky_ref * 0.12;

	// 菲涅尔：掠射角更不透明，正看更透
	float fres = pow(1.0 - max(dot(nworld, -view_dir), 0.0), 5.0);

	ALBEDO = mix(deep_color, vec3(0.9), foam * 0.75);
	EMISSION = col * (1.0 - foam * 0.35);
	ROUGHNESS = clamp(0.04 + foam * 0.22 + sparkle * 0.05, 0.02, 0.38);
	METALLIC = 0.0;
	SPECULAR = 0.62;
	ALPHA = clamp(alpha_base - (1.0 - fres) * 0.16 + foam * 0.06, 0.40, 1.0);
	NORMAL = normalize((VIEW_MATRIX * vec4(nworld, 0.0)).xyz);
}
