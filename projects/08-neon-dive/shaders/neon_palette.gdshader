shader_type canvas_item;
// 霓虹调色 pass（08 M0 美术定调用，四个模式跑同一场景出对比图）
//
// 为什么需要它：Pixel Adventure 是明亮卡通色板，而「霓虹深潜」要暗底高饱和。
// 直接摆进暗场景会像两个游戏（docs/08 §7 风险 1）。这里用一条 shader 覆盖四种做法，
// 制作人挑完调子再决定是否保留、以及保留哪几条参数进正式场景。
//
// 模式：0 原图直出（基准，用来判断调色到底改了多少）
//       1 霓虹渐变映射（luminance → 青紫白梯度，完全放弃原色相）
//       2 深海生物发光（保留原色相，阴影压成深蓝、高光染色，最接近「可读又统一」）
//       3 剪影霓虹（tile 压成暗剪影 + 边缘发光，只有角色保留亮色，对比最强）

// 写法说明（实测教训）：本文件**一律不用** `uniform float x = 1.0 : hint_range(...)` 这种老式提示语法。
// Godot 4.7 对它会报「SHADER ERROR: Expected expression, found: HINT_ENUM」整个 shader 编译失败，
// 而且失败不发生在 --headless --import，只在真跑场景时才暴露（所以必须有出图环节）。
// 调参数全部由 palette_lab.gd 用 set_shader_parameter() 传，不依赖编辑器面板上的滑标。
uniform int mode = 1;
uniform vec4 glow_color = vec4(0.35, 0.95, 1.0, 1.0);   // 发光染色（青）
uniform vec4 shadow_tint = vec4(0.02, 0.05, 0.13, 1.0); // 暗部底色（深蓝黑）
uniform float hue_keep = 0.35;                          // 保留多少原色相（0=纯梯度映射）
uniform float dark_gamma = 1.5;                         // >1 压暗中间调
uniform float emissive_threshold = 0.62;                // 多亮才算自发光
uniform float emissive_boost = 1.6;
uniform float rim_width = 1.0;                          // 模式 3 的边缘发光宽度（像素）
uniform float rim_power = 1.0;                          // 边缘发光强度，0 = 纯黑剪影
uniform float scanline = 0.035;                         // 极轻扫描线
uniform float chroma_bleed = 0.06;                      // 红蓝错位（霓虹管色彩散边）

vec3 neon_ramp(float l) {
	// 四段梯度：深靛 → 紫 → 青 → 近白，是「霓虹」而不是「热成像」的关键：
	// 中段偏紫蓝、上段偏青，最亮处不要纯饱和，否则发光糊成一团
	if (l < 0.35) {
		return mix(shadow_tint.rgb, vec3(0.30, 0.08, 0.55), l / 0.35);
	} else if (l < 0.68) {
		return mix(vec3(0.30, 0.08, 0.55), vec3(0.05, 0.72, 0.95), (l - 0.35) / 0.33);
	}
	return mix(vec3(0.05, 0.72, 0.95), vec3(0.85, 1.0, 1.0), clamp((l - 0.68) / 0.32, 0.0, 1.0));
}

// 注意：4.7 禁止在 fragment() 里用 return（「Using 'return' in the 'fragment'
// processor function is incorrect」），所以下面只能单出口写法，用 if/else 把四个模式网住。
void fragment() {
	vec2 uv = UV;
	// 红蓝错位：整幅只在水平方向偏一点点，霓虹灯管的色散感
	vec4 base;
	if (chroma_bleed > 0.0) {
		float off = chroma_bleed * TEXTURE_PIXEL_SIZE.x * 6.0;
		float r = texture(TEXTURE, uv + vec2(off, 0.0)).r;
		float g = texture(TEXTURE, uv).g;
		float b = texture(TEXTURE, uv - vec2(off, 0.0)).b;
		base = vec4(r, g, b, texture(TEXTURE, uv).a) * COLOR;
	} else {
		base = texture(TEXTURE, uv) * COLOR;
	}
	// 扫描线按屏幕行来（贴图 UV 行数与像素不一致时会走形）
	float scan = 1.0 - scanline * step(0.5, fract(uv.y * 180.0));

	if (base.a <= 0.001) {
		COLOR = vec4(0.0);
	} else if (mode == 0) {
		COLOR = vec4(base.rgb * scan, base.a);
	} else {
		float lum = dot(base.rgb, vec3(0.299, 0.587, 0.114));
		float shaped = pow(clamp(lum, 0.0, 1.0), dark_gamma);
		vec3 outc;
		if (mode == 1) {
			// 纯梯度映射，hue_keep 决定还留多少原色
			vec3 ramp = neon_ramp(shaped);
			outc = mix(ramp, mix(base.rgb, ramp, 0.5), hue_keep);
		} else if (mode == 2) {
			// 保色相：暗部染深蓝，高光按阈值叠加发光色
			vec3 shaded = mix(shadow_tint.rgb, base.rgb, smoothstep(0.0, 0.55, shaped));
			float emissive = smoothstep(emissive_threshold, 1.0, shaped);
			outc = shaded + glow_color.rgb * emissive * emissive_boost;
		} else {
			// 剪影 + 边缘发光：邻居 alpha 差当轮廓
			vec2 px = TEXTURE_PIXEL_SIZE * rim_width;
			float n = max(max(
				texture(TEXTURE, uv + vec2(0.0, -px.y)).a,
				texture(TEXTURE, uv + vec2(0.0, px.y)).a),
				max(
				texture(TEXTURE, uv + vec2(-px.x, 0.0)).a,
				texture(TEXTURE, uv + vec2(px.x, 0.0)).a));
			// 轮廓 = 邻居 alpha 减自己 alpha。之前多写了个 +0.25 偏置，
			// 导致「内部（n==a）」也算成边缘，整块 tile 变成一桶实心青色
			float rim = clamp((n - base.a) * 4.0, 0.0, 1.0) * rim_power;
			outc = shadow_tint.rgb * 1.2 + glow_color.rgb * emissive_boost * rim;
			// 留一点内部亮度，剪影不至于变成纸片，还能看出 tile 的起伏
			outc += vec3(0.05, 0.10, 0.16) * shaped;
		}
		COLOR = vec4(clamp(outc, 0.0, 4.0) * scan, base.a);
	}
}
