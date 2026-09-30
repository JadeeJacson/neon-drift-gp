class_name ProcTex
extends RefCounted
## 程序化贴图库 —— 零素材铁律的底座。
##
## 全部贴图在运行期用 FastNoiseLite + 解析图案生成，不读任何外部文件。
## 关键做法：
##  1. 无缝平铺：噪声像素对四角镜像取平均（f(x,y)+f(S-x,y)+f(x,S-y)+f(S-x,S-y))/4，
##     边界处数值连续，世界三平面映射（triplanar）不会露出网格缝。
##  2. 法线图：高度场做 Sobel 差分 → 切线空间法线，与 albedo/roughness 同源，
##     凹凸和颜色对得上（比各画各的更像真材质）。
##  3. albedo 走 sRGB（材质上开 albedo_texture_force_srgb），roughness/normal 走线性。


static var _cache: Dictionary = {}

# ──────────────────────────────── 对外入口 ────────────────────────────────

static func concrete() -> Dictionary:
	return _memo("concrete", _build_concrete.bind(512, 20260928))


static func tile_floor() -> Dictionary:
	return _memo("tile_floor", _build_tile_floor.bind(512, 777001))


static func metal_brushed() -> Dictionary:
	return _memo("metal_brushed", _build_metal_brushed.bind(256, 424242))


static func painted_steel() -> Dictionary:
	return _memo("painted_steel", _build_painted_steel.bind(256, 90210))


static func tech_panel() -> Dictionary:
	return _memo("tech_panel", _build_tech_panel.bind(256, 31337))


static func puddle_ripple() -> ImageTexture:
	return _memo("puddle_ripple", _build_puddle_ripple.bind(256, 555777))["normal"]


static func stats() -> String:
	return "ProcTex 缓存 %d 组" % _cache.size()


# ──────────────────────────────── 混凝土 ────────────────────────────────

static func _build_concrete(size: int, seed_v: int) -> Dictionary:
	var stain := _new_noise(seed_v, 0.010, 4)          # 低频污渍云
	var grain := _new_noise(seed_v + 1, 0.060, 3)       # 中频骨料
	var spec := _new_noise(seed_v + 2, 0.35, 1)         # 高频砂点
	var crack := _new_noise(seed_v + 3, 0.030, 4)       # 细裂纹（ridged）
	crack.fractal_type = FastNoiseLite.FRACTAL_RIDGED

	var albedo := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var rough := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_L8)

	for y in size:
		for x in size:
			var s := _tileable(stain, x, y, size) * 0.5 + 0.5       # 0..1
			var g := _tileable(grain, x, y, size) * 0.5 + 0.5
			var p := _tileable(spec, x, y, size) * 0.5 + 0.5
			var c := _tileable(crack, x, y, size) * 0.5 + 0.5        # ridged: 0..1

			# 裂纹只在窄带里出现
			var crack_w := smoothstep(0.86, 0.97, c)

			var base := Color(0.545, 0.529, 0.498).lerp(Color(0.404, 0.392, 0.365), s)
			base = base.lerp(Color(0.612, 0.596, 0.557), clampf((g - 0.55) * 2.2, 0.0, 1.0) * 0.5)
			# 砂点：局部变深
			if p > 0.82:
				base = base.darkened(0.16 * ((p - 0.82) / 0.18))
			# 裂纹：细黑线
			base = base.darkened(crack_w * 0.55)
			albedo.set_pixel(x, y, base)

			var r := 0.80 + 0.14 * g + 0.05 * s
			r = minf(r + crack_w * 0.05, 1.0)
			rough.set_pixel(x, y, Color(r, r, r))

			# 高度：骨料凸起 - 砂点 - 裂纹下陷
			var h := 0.5 + (g - 0.5) * 0.5 + (s - 0.5) * 0.25 - crack_w * 0.8
			height.set_pixel(x, y, Color(h, h, h))

	return _pack(albedo, rough, height, 1.6)


# ──────────────────────────────── 地砖 ────────────────────────────────

static func _build_tile_floor(size: int, seed_v: int) -> Dictionary:
	var n_tint := _new_noise(seed_v, 0.05, 4)
	var n_wear := _new_noise(seed_v + 1, 0.09, 3)
	var n_pore := _new_noise(seed_v + 2, 0.5, 1)
	var cells := 4                                          # 每张 4×4 块砖
	var cs := float(size) / float(cells)

	var albedo := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var rough := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_L8)

	for y in size:
		for x in size:
			var u := float(x) / cs
			var v := float(y) / cs
			var ci := int(floor(u))
			var cj := int(floor(v))
			var fu := u - ci
			var fv := v - cj

			# 砖缝：边缘 6% 宽的沟
			var edge := minf(minf(fu, 1.0 - fu), minf(fv, 1.0 - fv))
			var grout := 1.0 - smoothstep(0.02, 0.075, edge)
			# 砖块个体差异（按格子哈希取值，同格一致 → 平铺对称也不断裂）
			var jitter := _hash2(ci, cj, seed_v)
			var wear := _tileable(n_wear, x, y, size) * 0.5 + 0.5
			var tint := _tileable(n_tint, x, y, size) * 0.5 + 0.5
			var pore := _tileable(n_pore, x, y, size) * 0.5 + 0.5

			var col := Color(0.157, 0.165, 0.176).lerp(Color(0.216, 0.231, 0.247), jitter)
			col = col.lerp(Color(0.263, 0.278, 0.294), tint * 0.5)
			# 磨损亮斑 + 微孔
			col = col.lerp(Color(0.33, 0.345, 0.36), smoothstep(0.6, 0.95, wear) * 0.45)
			if pore > 0.9:
				col = col.darkened(0.2)
			# 砖缝：更深更涩的水泥
			var grout_col := Color(0.098, 0.102, 0.106)
			col = col.lerp(grout_col, grout)
			albedo.set_pixel(x, y, col)

			# 砖面抛光（低粗糙）+ 磨损处变涩；砖缝最涩
			var r := 0.16 + wear * 0.16 + jitter * 0.05
			r = lerpf(r, 0.78, grout)
			rough.set_pixel(x, y, Color(r, r, r))

			# 砖面微拱 + 砖缝下陷
			var dome := (0.5 - absf(fu - 0.5)) * 0.12 + (0.5 - absf(fv - 0.5)) * 0.12
			var h := 0.62 + dome + (pore - 0.5) * 0.06 - grout * 0.55
			height.set_pixel(x, y, Color(h, h, h))

	return _pack(albedo, rough, height, 2.2)


# ──────────────────────────── 拉丝金属 ────────────────────────────

static func _build_metal_brushed(size: int, seed_v: int) -> Dictionary:
	var streak := _new_noise(seed_v, 0.12, 3)     # 高频
	streak.fractal_lacunarity = 3.0
	var smudge := _new_noise(seed_v + 1, 0.03, 4)  # 低频油污
	var dent := _new_noise(seed_v + 2, 0.2, 2)

	var albedo := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var rough := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_L8)

	for y in size:
		for x in size:
			# 拉丝：x 方向被压扁 8 倍 → 横向条纹
			var st := _tileable_xy(streak, float(x) * 0.12, y, size)
			var sm := _tileable(smudge, x, y, size) * 0.5 + 0.5
			var dn := _tileable(dent, x, y, size) * 0.5 + 0.5
			var s01 := st * 0.5 + 0.5

			var col := Color(0.71, 0.72, 0.73).lerp(Color(0.55, 0.56, 0.575), s01 * 0.7)
			col = col.darkened(sm * 0.18)                     # 油污暗沉
			albedo.set_pixel(x, y, col)

			var r := 0.24 + s01 * 0.14 + sm * 0.12
			rough.set_pixel(x, y, Color(r, r, r))
			height.set_pixel(x, y, Color(0.5 + (s01 - 0.5) * 0.5 + (dn - 0.5) * 0.15, 0, 0))

	return _pack(albedo, rough, height, 0.5)


# ──────────────────────────── 漆面钢 ────────────────────────────

static func _build_painted_steel(size: int, seed_v: int) -> Dictionary:
	var wear := _new_noise(seed_v, 0.04, 4)
	var chip := _new_noise(seed_v + 1, 0.25, 3)
	var rust := _new_noise(seed_v + 2, 0.02, 4)
	var roller := _new_noise(seed_v + 3, 0.6, 1)

	var albedo := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var rough := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_L8)

	for y in size:
		for x in size:
			var wr := _tileable(wear, x, y, size) * 0.5 + 0.5
			var ch := _tileable(chip, x, y, size) * 0.5 + 0.5
			var ru := _tileable(rust, x, y, size) * 0.5 + 0.5
			var rl := _tileable(roller, x, y, size) * 0.5 + 0.5

			# 底色近白（好被 albedo_color 染色），滚涂纹理轻微明暗
			var col := Color(0.93, 0.93, 0.925).lerp(Color(0.86, 0.86, 0.855), rl * 0.5)
			var r := 0.42 + rl * 0.06

			# 掉漆：露出的底材偏亮灰（金属），此处 rough 下降、metal 由材质恒定控制
			var chip_w := smoothstep(0.72, 0.84, ch) * smoothstep(0.45, 0.7, wr)
			if chip_w > 0.0:
				col = col.lerp(Color(0.44, 0.43, 0.42), chip_w)
				r = lerpf(r, 0.34, chip_w)
			# 锈：暗红棕、极涩、微微鼓起
			var rust_w := smoothstep(0.68, 0.88, ru) * smoothstep(0.4, 0.75, wr)
			if rust_w > 0.0:
				col = col.lerp(Color(0.36, 0.19, 0.10), rust_w)
				r = lerpf(r, 0.92, rust_w)
			albedo.set_pixel(x, y, col)
			rough.set_pixel(x, y, Color(r, r, r))
			var h := 0.55 + rust_w * 0.3 - chip_w * 0.2 + (rl - 0.5) * 0.1
			height.set_pixel(x, y, Color(h, h, h))

	return _pack(albedo, rough, height, 1.2)


# ──────────────────────────── 科技面板 ────────────────────────────

static func _build_tech_panel(size: int, seed_v: int) -> Dictionary:
	var grime := _new_noise(seed_v, 0.06, 4)
	var micro := _new_noise(seed_v + 1, 0.4, 2)
	var slots := 8    # 面板上 8 列散热缝

	var albedo := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var rough := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var height := Image.create(size, size, false, Image.FORMAT_L8)

	for y in size:
		for x in size:
			var gm := _tileable(grime, x, y, size) * 0.5 + 0.5
			var mi := _tileable(micro, x, y, size) * 0.5 + 0.5

			var col := Color(0.13, 0.135, 0.145).lerp(Color(0.18, 0.185, 0.195), gm)
			var r := 0.5 + gm * 0.15
			var h := 0.55 + (mi - 0.5) * 0.1

			# 上 62% 是散热缝区：横向开槽
			var fy := float(y) / float(size)
			if fy < 0.62:
				var slot := fposmod(float(x), float(size) / float(slots)) / (float(size) / float(slots))
				var groove := 1.0 - smoothstep(0.28, 0.42, minf(slot, 1.0 - slot))
				# 缝里压暗、下陷
				col = col.darkened(groove * 0.75)
				r = lerpf(r, 0.8, groove)
				h -= groove * 0.5
			else:
				# 下部一块「检修铭牌」浅框
				var lx := float(x) / float(size)
				if lx > 0.18 and lx < 0.82 and fy > 0.72:
					var border := 0.0
					border = maxf(border, 1.0 - smoothstep(0.0, 0.02, minf(lx - 0.18, 0.82 - lx)))
					border = maxf(border, 1.0 - smoothstep(0.0, 0.03, minf(fy - 0.72, 0.94 - fy)))
					col = col.lerp(Color(0.32, 0.33, 0.34), border)
					h += border * 0.2
			albedo.set_pixel(x, y, col)
			rough.set_pixel(x, y, Color(r, r, r))
			height.set_pixel(x, y, Color(h, h, h))

	return _pack(albedo, rough, height, 1.4)


# ──────────────────────────── 水洼波纹法线 ────────────────────────────

static func _build_puddle_ripple(size: int, seed_v: int) -> Dictionary:
	var wave := _new_noise(seed_v, 0.08, 3)
	var fine := _new_noise(seed_v + 1, 0.3, 2)
	var height := Image.create(size, size, false, Image.FORMAT_L8)
	for y in size:
		for x in size:
			var w := _tileable(wave, x, y, size) * 0.5 + 0.5
			var f := _tileable(fine, x, y, size) * 0.5 + 0.5
			var h := 0.5 + (w - 0.5) * 0.6 + (f - 0.5) * 0.2
			height.set_pixel(x, y, Color(h, h, h))
	return {"normal": _height_to_normal(height, 0.35)}


# ──────────────────────────────── 工具 ────────────────────────────────

static func _memo(key: String, builder: Callable) -> Dictionary:
	if not _cache.has(key):
		_cache[key] = builder.call()
	return _cache[key]


static func _new_noise(seed_v: int, freq: float, octaves: int) -> FastNoiseLite:
	var n := FastNoiseLite.new()
	n.seed = seed_v
	n.noise_type = FastNoiseLite.TYPE_SIMPLEX
	n.frequency = freq
	n.fractal_type = FastNoiseLite.FRACTAL_FBM
	n.fractal_octaves = octaves
	n.fractal_gain = 0.5
	return n


## 四角镜像平均 → 无缝（边界处函数值与导数连续）
static func _tileable(n: FastNoiseLite, x: int, y: int, s: int) -> float:
	var fx := float(x)
	var fy := float(y)
	var sx := float(s) - fx
	var sy := float(s) - fy
	return (n.get_noise_2d(fx, fy) + n.get_noise_2d(sx, fy)
		+ n.get_noise_2d(fx, sy) + n.get_noise_2d(sx, sy)) * 0.25


## 拉丝用：x 已被采样方压扁，镜像轴只剩 y（x 方向条纹本来就连续）
static func _tileable_xy(n: FastNoiseLite, x: float, y: int, s: int) -> float:
	var fy := float(y)
	var sy := float(s) - fy
	return (n.get_noise_2d(x, fy) + n.get_noise_2d(x, sy)) * 0.5


static func _hash2(i: int, j: int, seed_v: int) -> float:
	var h := i * 374761393 + j * 668265263 + seed_v * 1274126177
	h = (h ^ (h >> 13)) * 1274126177
	return float((h ^ (h >> 16)) & 0xFFFF) / 65535.0


## Sobel 差分：高度场 → 切线空间法线图（OpenGL 绿朝上约定）
static func _height_to_normal(height: Image, strength: float) -> ImageTexture:
	var w := height.get_width()
	var h := height.get_height()
	var out := Image.create(w, h, false, Image.FORMAT_RGBA8)
	for y in h:
		var ym := (y - 1 + h) % h
		var yp := (y + 1) % h
		for x in w:
			var xm := (x - 1 + w) % w
			var xp := (x + 1) % w
			var hl := height.get_pixel(xm, y).r
			var hr := height.get_pixel(xp, y).r
			var hu := height.get_pixel(x, ym).r
			var hd := height.get_pixel(x, yp).r
			var nx := (hl - hr) * strength
			var ny := (hd - hu) * strength
			var nz := 1.0
			var mag := sqrt(nx * nx + ny * ny + 1.0)
			out.set_pixel(x, y, Color(
				0.5 + 0.5 * nx / mag,
				0.5 + 0.5 * ny / mag,
				0.5 + 0.5 * nz / mag))
	out.generate_mipmaps()
	return ImageTexture.create_from_image(out)


## albedo + roughness + height → 三张纹理（height 就地转法线，不落盘）
static func _pack(albedo: Image, rough: Image, height: Image, normal_strength: float) -> Dictionary:
	albedo.generate_mipmaps()
	rough.generate_mipmaps()
	return {
		"albedo": ImageTexture.create_from_image(albedo),
		"rough": ImageTexture.create_from_image(rough),
		"normal": _height_to_normal(height, normal_strength),
	}
