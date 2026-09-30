# 程序化贴图实验室：全部用代码算像素，不读任何图片文件（制作人要求零素材复用）
#
# 产物分三类：
#  1. PBR 表面图（albedo / normal / rough / metal），供 StandardMaterial3D 世界三向投影采样
#  2. 功能图（天空云层、玫瑰窗 gobo、粒子 sprite、水线污渍 decal）
#  3. 体积与调色图（FogMaterial 的 3D 密度图、Environment 的 3D LUT）
# 约定：写进 RGBA8 的颜色一律是**线性值**（srgb_to_linear 转换过）。
# 运行期生成的贴图引擎不做 sRGB 解码，直接存 sRGB 数值会让整套 PBR 发灰。
extends RefCounted

const TexGen := preload("res://scripts/noise_gen.gd")

# 黄昏色板（这里写的是 sRGB 观感值，函数内部会转线性）
const C_MARBLE := Color(0.70, 0.68, 0.64)
const C_VEIN := Color(0.16, 0.15, 0.17)
const C_STONE := Color(0.42, 0.40, 0.37)
const C_STONE_DARK := Color(0.23, 0.22, 0.21)
const C_BRASS := Color(0.72, 0.52, 0.20)
const C_BRASS_DARK := Color(0.24, 0.17, 0.09)
const C_IRON := Color(0.30, 0.29, 0.29)
const C_RUST := Color(0.26, 0.13, 0.07)
const C_MOSS := Color(0.16, 0.24, 0.12)


# GDScript 没有 fract()（那是着色器函数），取小数部分用减 floori
static func _fr(x: float) -> float:
	return x - float(floori(x))


static func srgb_to_linear(c: Color) -> Color:
	return Color(_ch(c.r), _ch(c.g), _ch(c.b), c.a)


static func _ch(v: float) -> float:
	if v < 0.04045:
		return v / 12.92
	return pow((v + 0.055) / 1.055, 2.4)


# 高度场（R 通道）→ 切线空间法线图，四周环绕取样，保证平铺无缝
static func height_to_normal(height_img: Image, strength: float) -> Image:
	var w: int = height_img.get_width()
	var h: int = height_img.get_height()
	var out := Image.create(w, h, false, Image.FORMAT_RGBA8)
	for y in h:
		for x in w:
			var l := _h(height_img, x - 1, y, w, h)
			var r := _h(height_img, x + 1, y, w, h)
			var d := _h(height_img, x, y - 1, w, h)
			var u := _h(height_img, x, y + 1, w, h)
			var nx := (l - r) * strength
			var ny := (d - u) * strength
			var inv := 1.0 / sqrt(nx * nx + ny * ny + 1.0)
			out.set_pixel(x, y, Color(
				(nx * inv) * 0.5 + 0.5,
				(ny * inv) * 0.5 + 0.5,
				(inv) * 0.5 + 0.5,
				1.0))
	return out


static func _h(img: Image, x: int, y: int, w: int, h: int) -> float:
	return img.get_pixel(posmod(x, w), posmod(y, h)).r


# ── 大理石：域扭曲 + 脊状分形噪声 → sin 条纹取幂得到细密脉络 ──────────────
static func marble_set(size: int, seed: int, base: Color, vein: Color) -> Dictionary:
	var n := TexGen.new(seed)
	n.fractal(TexGen.FRACTAL_RIDGED, 5)
	var n2 := TexGen.new(seed + 977)
	var alb := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var rough := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var lb := srgb_to_linear(base)
	var lv := srgb_to_linear(vein)
	for y in size:
		for x in size:
			var u := (float(x) + 0.5) / float(size)
			var v := (float(y) + 0.5) / float(size)
			var wu := n.warp(u * 4.0, v * 4.0, 0.60)
			var wv := n.warp(u * 4.0 + 3.1, v * 4.0 + 1.7, 0.60)
			var t := absf(sin((wu + wv * 0.65) * 3.4))
			var veins := pow(1.0 - t, 5.0)
			var grit := (n2.value(u * 48.0, v * 48.0) + 1.0) * 0.5
			var m := clampf(veins * 0.92 + (grit - 0.5) * 0.10, 0.0, 1.0)
			var c := lb.lerp(lv, m)
			alb.set_pixel(x, y, c)
			var rg := clampf(0.26 + m * 0.16 - (grit - 0.5) * 0.06, 0.0, 1.0)
			rough.set_pixel(x, y, Color(rg, rg, rg, 1.0))
			var hv := clampf(0.5 + (grit - 0.5) * 0.35 - veins * 0.12, 0.0, 1.0)
			height.set_pixel(x, y, Color(hv, hv, hv, 1.0))
	return {"albedo": alb, "rough": rough, "normal": height_to_normal(height, 2.2)}


# ── 砌石：错缝排列的方块 + 灰缝 + 崩角 + 表面风化 ────────────────────────
static func stone_set(size: int, seed: int, base: Color) -> Dictionary:
	var n := TexGen.new(seed)
	var n2 := TexGen.new(seed + 313)
	var alb := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var rough := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var lb := srgb_to_linear(base)
	var lj := srgb_to_linear(base * 0.60)
	var rows := 8
	var cols := 8
	for y in size:
		for x in size:
			var u := float(x) / float(size)
			var v := float(y) / float(size)
			var row := int(v * float(rows))
			var off := 0.5 if (row % 2) == 1 else 0.0
			var col := int((u + off) * float(cols))
			var cell := float(col * 31 + row * 17)
			var jitter := n.value(cell * 0.7, cell * 1.3) * 0.5 + 0.5
			var fu := _fr((u + off) * float(cols))
			var fv := _fr(v * float(rows))
			var edge := minf(minf(fu, 1.0 - fu), minf(fv, 1.0 - fv))
			var gap := 1.0 - clampf(edge / 0.055, 0.0, 1.0)
			var wear := (n2.fbm(u * 14.0, v * 14.0, 4) + 1.0) * 0.5
			var chip := clampf(n2.value(u * 26.0 + jitter * 4.0, v * 26.0) * 1.6 - 0.25, 0.0, 1.0)
			var shade := 0.74 + jitter * 0.40 + wear * 0.16 - chip * 0.22
			var c := lb.lerp(lj, gap) * shade
			alb.set_pixel(x, y, Color(maxf(c.r, 0.0), maxf(c.g, 0.0), maxf(c.b, 0.0), 1.0))
			var rg := clampf(0.80 - wear * 0.14 + gap * 0.10 + chip * 0.08, 0.0, 1.0)
			rough.set_pixel(x, y, Color(rg, rg, rg, 1.0))
			var hv := clampf(1.0 - gap * 0.85 - chip * 0.25 + wear * 0.08, 0.0, 1.0)
			height.set_pixel(x, y, Color(hv, hv, hv, 1.0))
	return {"albedo": alb, "rough": rough, "normal": height_to_normal(height, 3.4)}


# ── 金属：划痕（单向拉伸噪声）+ 氧化斑（FBM）决定 rough/metal ─────────────
static func metal_set(size: int, seed: int, base: Color, dark: Color, metallic: float) -> Dictionary:
	var n := TexGen.new(seed)
	var n2 := TexGen.new(seed + 71)
	var alb := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var rough := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var metal := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var lb := srgb_to_linear(base)
	var ld := srgb_to_linear(dark)
	for y in size:
		for x in size:
			var u := float(x) / float(size)
			var v := float(y) / float(size)
			var scratch := n.value(u * 90.0, v * 5.0)
			var srepo := pow(absf(scratch), 0.35)
			var patina := (n2.fbm(u * 7.0, v * 7.0, 4) + 1.0) * 0.5
			var dirt := pow(patina, 2.2)
			var m := clampf(dirt * 0.55 - srepo * 0.18 + 0.12, 0.0, 1.0)
			alb.set_pixel(x, y, lb.lerp(ld, m))
			var rg := clampf(0.16 + m * 0.42 + srepo * 0.10, 0.02, 1.0)
			rough.set_pixel(x, y, Color(rg, rg, rg, 1.0))
			var mt := clampf(metallic * (1.0 - dirt * 0.65), 0.0, 1.0)
			metal.set_pixel(x, y, Color(mt, mt, mt, 1.0))
			# 高度：划痕是凹槽，氧化堆积微微抬高
			var hv := clampf(0.5 - srepo * 0.30 + dirt * 0.22, 0.0, 1.0)
			height.set_pixel(x, y, Color(hv, hv, hv, 1.0))
	return {"albedo": alb, "rough": rough, "metal": metal, "normal": height_to_normal(height, 1.8)}


# ── 天空云层（ProceduralSkyMaterial.sky_cover）：按球面角取样，经度方向无缝 ─
static func cloud_cover(size: int, seed: int) -> Image:
	var n := TexGen.new(seed)
	n.fractal(TexGen.FRACTAL_FBM, 6)
	var w := size
	var h := maxi(16, size / 2)
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	for y in h:
		for x in w:
			var lon := (float(x) + 0.5) / float(w) * TAU
			var lat := ((float(y) + 0.5) / float(h)) * (PI * 0.5)
			var px := cos(lat) * cos(lon)
			var pz := cos(lat) * sin(lon)
			var py := sin(lat)
			var f := (n.fbm3(px * 2.4, py * 3.6, pz * 2.4, 6) + 1.0) * 0.5
			var cov := smoothstep(0.42, 0.74, f)
			# 地平线附近留一条无云带，让夕阳有出口；天顶云更厚
			var band := 1.0 - exp(-pow(maxf(float(y) / float(h) - 0.06, 0.0) * 4.0, 2.0))
			cov *= band
			img.set_pixel(x, y, Color(cov, cov, cov, 1.0))
	return img


# ── 玫瑰窗：既当 SpotLight3D 的投影 gobo，也当窗玻璃的 albedo/emission ────
static func rose_window(size: int) -> Image:
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var cc := size * 0.5
	var rmax := size * 0.48
	var lead := Color(0.018, 0.016, 0.020, 1.0)
	var petals := [
		Color(0.85, 0.16, 0.13),
		Color(0.95, 0.60, 0.16),
		Color(0.20, 0.48, 0.86),
		Color(0.70, 0.22, 0.60),
		Color(0.26, 0.72, 0.55),
		Color(0.92, 0.84, 0.55),
	]
	var seg := 12
	for y in size:
		for x in size:
			var dx := float(x) - cc
			var dy := float(y) - cc
			var r := sqrt(dx * dx + dy * dy) / rmax
			var ang := atan2(dy, dx)
			var c := lead
			if r <= 1.02:
				if r > 0.95:
					# 外圈装饰带：明暗相间的短拱
					var dash := _fr(ang / TAU * 36.0)
					c = srgb_to_linear(Color(0.90, 0.72, 0.30)) if dash < 0.42 else lead
				elif r < 0.13:
					c = srgb_to_linear(Color(0.98, 0.84, 0.46))
				elif r < 0.175:
					c = lead
				else:
					var kf := (ang / TAU + 0.5) * float(seg)
					var k := floori(kf) % seg
					var basec: Color = petals[k % petals.size()]
					var ring := 0 if r < 0.60 else 1
					var tone := basec if ring == 0 else basec.lerp(Color(0.86, 0.88, 0.94), 0.5)
					# 手工玻璃的条纹：径向高频调制
					var gn := 0.76 + 0.24 * sin(r * 52.0 + float(k) * 1.7)
					c = srgb_to_linear(tone) * gn
					var seam := _fr(kf)
					if seam < 0.045 or seam > 0.955:
						c = lead
					if r > 0.575 and r < 0.615:
						c = lead
					if r > 0.845 and r < 0.875:
						c = lead
			img.set_pixel(x, y, Color(maxf(c.r, 0.0), maxf(c.g, 0.0), maxf(c.b, 0.0), 1.0))
	return img


# ── 粒子 sprite：柔和径向衰减（画 dust / ember 用）────────────────────────
static func dust_sprite(size: int) -> Image:
	var n := TexGen.new(4211)
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var cc := size * 0.5
	for y in size:
		for x in size:
			var dx := (float(x) - cc) / cc
			var dy := (float(y) - cc) / cc
			var r := sqrt(dx * dx + dy * dy)
			var a := 1.0 - smoothstep(0.10, 1.0, r)
			a *= 0.72 + 0.28 * (n.value(float(x) * 0.3, float(y) * 0.3) + 1.0) * 0.5
			var lum := clampf(a, 0.0, 1.0)
			img.set_pixel(x, y, Color(lum, lum, lum, lum))
	return img


# ── 水线污渍 / 苔痕 decal：中心实、边缘化开，alpha 直接写在 RGBA ──────────
static func grime_decal(size: int, seed: int, tint: Color) -> Dictionary:
	var n := TexGen.new(seed)
	var n2 := TexGen.new(seed + 151)
	var alb := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var lt := srgb_to_linear(tint)
	for y in size:
		for x in size:
			var u := float(x) / float(size)
			var v := float(y) / float(size)
			var dx := u * 2.0 - 1.0
			var dy := v * 2.0 - 1.0
			var r := sqrt(dx * dx + dy * dy)
			var wob := n.fbm(u * 5.0, v * 5.0, 5) * 0.30
			var mask := 1.0 - smoothstep(0.30, 1.05, r + wob)
			var spec := pow((n2.fbm(u * 22.0, v * 22.0, 4) + 1.0) * 0.5, 1.6)
			var a := clampf(mask * (0.42 + spec * 0.78), 0.0, 1.0)
			alb.set_pixel(x, y, Color(lt.r, lt.g, lt.b, a))
			var hv := clampf(0.5 + mask * spec * 0.45, 0.0, 1.0)
			height.set_pixel(x, y, Color(hv, hv, hv, 1.0))
	return {"albedo": alb, "normal": height_to_normal(height, 1.4)}


# ── 体积雾 3D 密度图（FogMaterial.density_texture）：R8，逐层切片 ─────────
# 返回 {side, layers:[Image]}，layers 是 side 张 side×side 的切片
static func fog_density_slices(side: int, seed: int) -> Dictionary:
	var n := TexGen.new(seed)
	var layers: Array = []
	for z in side:
		var img := Image.create(side, side, false, Image.FORMAT_R8)
		var fw := float(z) / float(side)
		for y in side:
			for x in side:
				var fu := float(x) / float(side)
				var fv := float(y) / float(side)
				var f := (n.fbm3(fu * 4.0, fv * 4.0, fw * 4.0, 5) + 1.0) * 0.5
				var d := smoothstep(0.34, 0.88, f)
				var b := int(clampf(d, 0.0, 1.0) * 255.0)
				img.set_pixel(x, y, Color(b / 255.0, 0.0, 0.0, 1.0))
		layers.append(img)
	return {"side": side, "layers": layers}


# ── 3D 调色 LUT（Environment.adjustment_color_correction）─────────────────
# 黄昏电影分级：S 型反差 + 暗部推青、亮部推暖 + 轻微升饱和
static func grade_lut(side: int) -> Dictionary:
	var layers: Array = []
	for zi in side:
		var img := Image.create(side, side, false, Image.FORMAT_RGBA8)
		var b0 := float(zi) / float(side - 1)
		for yi in side:
			var g0 := float(yi) / float(side - 1)
			for xi in side:
				var r0 := float(xi) / float(side - 1)
				var c := _grade(Color(r0, g0, b0, 1.0))
				img.set_pixel(xi, yi, c)
		layers.append(img)
	return {"side": side, "layers": layers}


# ── 2D 平铺 LUT（Environment.adjustment_color_correction）──────────────────
# Godot 接受 Texture2D 作为颜色校正图，但约定是「tile 平铺」格式；
# 具体排布（tile 数、blue 轴方向）无法从 ClassDB 读到，所以这里把布局做成参数，
# 配合 --lut=swap 的红蓝互换图做一次肉眼判定，确认后再上真正的分级。
# mode: "grade" 黄昏分级 / "identity" 原样 / "swap" 红蓝互换（用于验版式）
static func grade_lut_2d(mode: String, tiles_per_row: int, tile_px: int) -> Image:
	var size := tiles_per_row * tile_px
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var denom := float(maxi(tile_px - 1, 1))
	for ty in tiles_per_row:
		for tx in tiles_per_row:
			# blue = 行优先（左上为 0），引擎约定不符时把 blue 轴反过来即可
			var b := float(ty * tiles_per_row + tx) / float(maxi(tiles_per_row - 1, 1))
			for py in tile_px:
				for px in tile_px:
					var r := float(px) / denom
					var g := 1.0 - float(py) / denom
					var c := Color(r, g, b, 1.0)
					match mode:
						"swap":
							c = Color(b, g, r, 1.0)
						"grade":
							c = _grade(c)
					img.set_pixel(tx * tile_px + px, ty * tile_px + py, c)
	return img


static func _grade(c: Color) -> Color:
	var l := c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722
	var contrast := 1.16
	c.r = clampf(pow(c.r, contrast), 0.0, 1.0)
	c.g = clampf(pow(c.g, contrast), 0.0, 1.0)
	c.b = clampf(pow(c.b, contrast), 0.0, 1.0)
	var sh := 1.0 - smoothstep(0.04, 0.40, l)
	var hi := smoothstep(0.50, 0.96, l)
	c.r += hi * 0.060 - sh * 0.018
	c.g += hi * 0.008 + sh * 0.022
	c.b += -hi * 0.050 + sh * 0.058
	var sat := 1.09
	var lum := c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722
	c.r = clampf(lum + (c.r - lum) * sat, 0.0, 1.0)
	c.g = clampf(lum + (c.g - lum) * sat, 0.0, 1.0)
	c.b = clampf(lum + (c.b - lum) * sat, 0.0, 1.0)
	return c
