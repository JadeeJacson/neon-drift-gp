# 16 · LUMEN BENCH 光域实验场 —— Godot 4.7.2 技术美术（TA）渲染上限测试场

> **一句话**：一个**零外部素材**（几何、贴图、灯光、后期全部代码生成）的高标准测试场景
> 「沉星观星堂 Sunken Observatory」，用来量 Godot 4.7.2 在**美术风格表现力 / 场景搭建复杂度 /
> 灯光渲染上限**三条轴上的真实能力，并把过程中踩到的 4.7 API 变更全部记下来。
>
> 工程性质：TA 测试场，**不是游戏**（无玩法循环，因此路线图 §0.1「完整玩法循环」不适用；
> 「零素材」也是制作人明确指令，属 §0.2 的有意例外，不能作为新项目的先例引用）。

---

## 0. 怎么跑

引擎固定 `engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe`，工作目录 = 仓库根。

```powershell
$G = 'engines\godot\4.7.2\Godot_v4.7.2-stable_win64_console.exe'
$P = 'projects\16-lumen-bench'

# ① 自己进去看（自由观察：WASD/QE 移动，按住左键拖拽转视角，1–8 跳机位，Tab 换预设，C 打印参数，P 截图）
& $G --path $P

# ② 结构化出图（9 个机位 × 当前预设，自动等 SDFGI 收敛后截图，并打印像素统计）
& $G --path $P res://scenes/ta_bench.tscn --window-size=1920x1080 -- --shot --preset=cine --nohud

# ③ 性能基准（固定机位空跑 180 渲染帧，输出 fps / draw call / 图元数 / 显存）
& $G --path $P res://scenes/ta_bench.tscn --window-size=1920x1080 -- --bench --view=1 --preset=ultra --nohud

# ④ 无头装配自检（41 条断言：几何面数、程序贴图是否真接到材质、预设开关、灯与阴影配额）
node tools/verify.mjs 16
```

截图输出目录：`_scratch/ta16/`（gitignore）。已挑 8 张存进 `shots/` 随工程入库。
命令行开关：`--preset=direct|base|cine|ultra`、`--cam=practical|physical`、`--lut=off|identity|swap|grade`、
`--view=N`、`--maxviews=N`、`--nohud`、`--debugdraw=wireframe|unshaded|overdraw`、`--debugwall[=box|batch|nocull]`。
关键日志都以 `TA16 ` 开头（`BUILD / RENDERER / ENV / VIEW / CAM / SHOT / PERF / DONE`），方便 grep。

---

## 1. 场景构成（复杂度轴）

**空间**：圆形列柱厅 + 二层回廊 + 共肋穹顶（带圆眼 oculus）+ 半淹水的地面，
黄昏低角度落日从塌开的破口灌进来，另一侧是一扇程序生成的玫瑰彩窗。
混合环境（室内 → 破口外的台地、远山脊、落日与云层）在同一条视线里完成。

| 尺度 | 数值 | 说明 |
|---|---|---|
| 内壁 / 外壁半径 | 12.0 / 13.35 m | 环形墙高 12 m |
| 列柱 | 12 根，中心半径 9.7 m，柱身 6.3 m、20 道凹槽 | 含柱础、柱头、顶板 |
| 二层回廊 | 地面 8.55 m，栏杆 9.6 m，扶手为环形 torus | 栏杆柱 **132 根** MultiMesh |
| 穹顶 | 起坡 12 m、顶点 21.2 m、16 列 × 6 圈藻井 | 圆眼半径 ≈ 3.17 m，壳体厚 0.62 m |
| 水面 | 半径 11.94 m，水位 +0.34 m | 中央台地顶面 +0.86 m |
| 外部 | 台地半径 46 m + 山脊 40→420 m（起伏 ±46 m） | 破口/圆眼两条视线可见 |

**细节层级**（同一帧里可核对）：

1. **体量层**：外墙环（含 5 处开口）、穹顶内外双壳、地面/台地/山脊。
2. **构件层**：凹槽柱、柱头、檐部环梁、12 道拱券、回廊、栏杆、扶手、三层台阶。
3. **陈设层**：中央天文仪（4 层可旋转黄铜环 + 自发光核心 + 车制石座）、
   4 盏吊链悬灯（链条 16 节 MultiMesh）、18 支蜡烛、倾覆的讲经台（含丝绒布）。
4. **表面层**：`Decal` 水线苔痕 16 处 + 破口湿渍 6 处；石材走**世界三向投影**（world triplanar），
   程序曲面**不需要展 UV**也不出现接缝与拉伸。
5. **大气层**：全局体积雾 + 3 个 `FogVolume`（带 3D 噪声密度图）+ 传统深度雾 + 2 束浮尘粒子 + 火星粒子。
6. **镜头层**：自动曝光、景深、AgX 色调映射、glow、后期晕影/色散/颗粒。

**几何与贴图怎么来的（全部代码）**：

| 生成器 | 做法 |
|---|---|
| `scripts/geo_lab.gd` | 一个通用参数曲面出口 `param_into(SurfaceTool, res_u, res_v, fn(u,v)→Vector3, flip)`，法线由曲面的中心差分求得；柱式/拱券/穹顶/台阶/山脊/碎石/栏杆全部由它派生 |
| `scripts/tex_lab.gd` | 逐像素算图：大理石（域扭曲 + 脊状分形噪声的 sin 条纹）、砌石（错缝方块 + 灰缝 + 崩角）、金属（划痕 + 氧化斑）、天空云层（球面坐标 FBM）、玫瑰窗 gobo（12 瓣解析绘制）、粒子 sprite、水线污渍 decal、3D 调色 LUT |
| `scripts/noise_gen.gd` | `FastNoiseLite` 薄封装（value / fbm / fbm3 / 域扭曲 warp） |
| `scripts/mat_lab.gd` | 把上面三件套拼成 15 个 `StandardMaterial3D`（albedo/rough/normal/metal + 世界三向投影） |
| `shaders/water.gdshader` | 解析波高 + 有限差分法线 + 屏幕图扭曲折射 + 岸边泡沫 + 太阳碎光 + 菲涅尔透明度 |
| `shaders/post_grade.gdshader` | 全屏 canvas pass：色散、晕影、分色染色、胶片颗粒 |

规模实测：装配耗时 **11.6 s**（含 15 张 512² 程序贴图生成），
`ArrayMesh` 静态面数 **436k**（Hall 295k + Props 143k），
渲染图元（含 MultiMesh 实例与阴影通道）**3.61 M**，节点 202 个，绘制调用 395。

---

## 2. 关键技术参数（cine 基准档）

### 2.1 渲染路径与项目设置（`project.godot`）

| 项 | 值 | 备注 |
|---|---|---|
| `rendering/renderer/rendering_method` | `forward_plus` | SDFGI / 体积雾 / light_projector 都要求 Forward+ |
| 驱动 | Vulkan 1.4.312（实测 `driver=vulkan`） | 设备：RTX 4060 Laptop GPU |
| `anti_aliasing/quality/msaa_3d` | 2（=4×） | 运行期由预设改 `Viewport.msaa_3d` 才真正生效 |
| `anti_aliasing/quality/use_debanding` | true | 消除大面积平滑渐变的色带 |
| `lights_and_shadows/directional_shadow/size` | 4096（ultra 8192） | |
| `lights_and_shadows/directional_shadow/angle` | 0.5° | 与 `Light3D.light_angular_distance` 配合控制半影 |
| `lights_and_shadows/positional_shadow/atlas_size` | 4096 | |
| `occlusion_culling/use_occlusion_culling` | true | 未放 `OccluderInstance3D`（见 §5 缺口） |
| `scaling/3d/scale_3d` | 1.0 | 预设里保留 0.75/0.5 的下探位 |

### 2.2 全局光照 / 遮蔽 / 反射

| 参数 | 值 | 说明 |
|---|---|---|
| `sdfgi_enabled` | true | 室内彩色反弹的唯一来源（彩窗、落日把墙面染暖） |
| `sdfgi_cascades` / `cascade0_distance` | 4 / 14 m | **实测** `sdfgi_max_distance` 填 120，引擎按级联推导回 **224 m** |
| `sdfgi_min_cell_size` | 0.14 | 实测生效值被抬到 **0.219**（同上，别相信写入值，读回来） |
| `sdfgi_bounce_feedback` / `energy` | 0.62 / 1.0 | 过高会亮成塑料感 |
| `sdfgi_use_occlusion` / `read_sky_light` | true / true | 后者是圆眼天光能进屋的前提 |
| `ssao_enabled` | true | `radius 1.6`、`intensity 0.85`、`detail 0.35`、`horizon 0.15`、`sharpness 0.55`、`light_affect 0.55` |
| `ssil_enabled` | true | `radius 2.4`、`intensity 0.55` —— 4.4+ 的 SSIL 补近处角落反弹，和 SDFGI 叠加不冲突 |
| `ssr_enabled` | false（ultra 开） | 与 SDFGI 同开时收益集中在低粗糙度面（水面/黄铜），代价见 §3 |
| `reflected_light_source` | Sky | 提供粗糙反射的基线 |
| 天空 | `ProceduralSkyMaterial` + 程序 `sky_cover` 云层图 | `radiance_size = 1024`、`process_mode = QUALITY` |

### 2.3 体积 / 雾

| 参数 | 值 |
|---|---|
| `volumetric_fog_density` | 0.0045（全局薄尘幕，光束的载体） |
| `volumetric_fog_anisotropy` | +0.62（前向散射，逆光光束才明显） |
| `volumetric_fog_gi_inject` / `ambient_inject` / `sky_affect` | 1.0 / 0.15 / 0.20 |
| `volumetric_fog_detail_spread` | 2.4；`temporal_reprojection` 开（0.82） |
| 传统雾 | `FOG_MODE_EXPONENTIAL`，`density 0.0016`、`aerial_perspective 0.35`、`sun_scatter 0.42` |
| `FogVolume` ×3 | `FogMaterial`（density 0.006–0.010、height_falloff 1.35、edge_fade 0.35）+ `NoiseTexture3D` 当 `density_texture` |

⚠️ 实测坑：雾团密度给到 0.04–0.085 时，画面里会出现一个**黑球**——体积雾是「消光 + 内散射」，
周围光不够时内散射补不上消光，就变成一团吸光的黑。压到 0.01 以下才正常。

### 2.4 后期与色调

| 参数 | 值 |
|---|---|
| `tonemap_mode` | **AgX**（4.4+ 可调 `tonemap_agx_contrast 1.18`） |
| `tonemap_exposure` | 0.85（配合自动曝光，见 §2.6） |
| `glow_enabled` | true，`blend_mode = SCREEN`，`intensity 0.45`、`strength 0.85`、`bloom 0.02` |
| `glow_hdr_threshold` / `luminance_cap` | 1.0 / 12 —— 只让落日、烛焰、彩窗溢出，暗部不糊 |
| `glow_levels/2..7` | 0.30 / 1.00 / 0.72 / 0.38 / 0.18 / 0.08（`normalized=false`） |
| `adjustment_contrast` / `saturation` | 1.10 / 1.07 |
| `adjustment_color_correction` | **默认关**（2D 平铺 LUT 版式没对上，见 §4） |
| 自定义后期 | `post_grade.gdshader`：色散 0.0026、晕影 0.40、颗粒 0.018、暗部推冷/亮部推暖 |

### 2.5 灯光清单（18 盏，阴影配额 3 盏）

| 灯 | 类型 | 能量 | 关键参数 | 阴影 |
|---|---|---|---|---|
| Sun | Directional | 2.4 | 色温 1000/0.66/0.34，仰角 12°，`light_angular_distance 1.6°`，PSSM 4 级联，`max_distance 240`，`volumetric_fog_energy 3.2`，`shadow_opacity 0.82` | ✅ |
| RoseSpot | Spot | 5.5 | `light_projector` = 程序玫瑰窗 gobo，angle 30°，range 44，`vf_energy 4.2` | ✅（投影图必须开阴影） |
| OculusCool | Spot | 3.6 | 圆眼冷色天光，angle 68° | ❌ |
| DomeWash | Omni | 4.2 | 位置 (0,15.5,0)，**range 22**（11 够不到 12.5 m 外的穹顶 → 穹顶全黑，实测踩过） | ❌ |
| Clerestory0-2 | Spot | 2.1 | 高侧窗形状光，只给体积感 | ❌ |
| LampLight0-3 | Omni | 1.15 | range 9.5，`light_size 0.35`，仅 1 盏开阴影 | 1/4 ✅ |
| CandleLight0-7 | Omni | 0.24–0.58 | 双频正弦闪烁（物理帧驱动） | ❌ |
| CenterFill | Omni | 2.6 | 天文仪自发光核心的真实补光 | ❌ |

### 2.6 相机

| 项 | 值 |
|---|---|
| `CameraAttributesPractical`（默认） | 自动曝光开（ISO 40–1600，scale 0.72），`dof_blur_amount 0.05`，近/远界按机位距离自动配 |
| `CameraAttributesPhysical`（`--cam=physical`） | 焦距 30 mm、光圈 f/3.5、快门 1/60、自动曝光 EV −3…9 |
| 机位 | 9 个（含 1 个诊断机位），每个都写明「这张图在证明什么」 |
| 截图收敛 | 切机位后等 **110 物理帧**（SDFGI 重注入 + 曝光适应 + 体积雾时域稳定）再截 |

---

## 3. 四档预设：同机位（01 对角全景）实测

| 预设 | 内容 | fps | draw | 图元 | 显存 | 平均亮度 mean | 暗部占比 |
|---|---|---|---|---|---|---|---|
| `direct` | 只有直接光 + 天空背景（关 GI/AO/SSIL/体积雾/雾/glow/调色，Linear 色调映射） | **165.6** | 214 | 1.65 M | 752 MB | 0.240 | 6.6 % |
| `base` | + SDFGI + SSAO + Filmic + glow | **101.9** | 219 | 1.70 M | 1223 MB | 0.340 | 2.1 % |
| `cine`（基准） | + SSIL + 体积雾 + 深度雾 + AgX + 后期 pass | **74.0** | 395 | 3.61 M | 1400 MB | 0.330 | 0.3 % |
| `ultra` | + SSR(128 步) + SDFGI 5 级联/0.08 单元 + 雾更浓 + MSAA 8× + TAA + 8192 阴影 | **59.5** | 392 | 3.61 M | 1694 MB | 0.325 | 0.0 % |

（1920×1080，RTX 4060 Laptop，Vulkan，Forward+；`node tools/verify.mjs 16` 三步全绿。）

**读法**：`direct → base` 这一跳是**质变**——同一盏太阳，关掉 GI 时厅内有 6.6% 是死黑、
墙面完全没有彩窗与落日的反弹色；开 SDFGI 后暗部掉到 2%。这正是 SDFGI 的价值证明，
也是「为什么室内场景不能只用直接光」。`base → cine` 主要买的是体积光束与暗部层次（+ 帧率代价 27%）。
`cine → ultra` 的观感增益最小（SSR 让水面与黄铜多一点二次信息、TAA 抹掉一些锯齿），
却还要 24% 帧率——**上限的边际收益在这里开始塌**。

---

## 4. Godot 4.7 实测 API 变更（本节全部来自本机探针，不是文档转述）

探针脚本留在 `tools/probe_*.gd`，可复跑。

**着色器语言（影响最大）**

1. **相机矩阵改名**：`CAMERA_MATRIX` / `INV_CAMERA_MATRIX` / `INV_MODEL_MATRIX` / `INV_MODELVIEW_MATRIX`
   在 4.7 **不存在**；可用的是 `VIEW_MATRIX`（世界→视图）、`INV_VIEW_MATRIX`（视图→世界）、
   `MODEL_MATRIX`、`PROJECTION_MATRIX`、`INV_PROJECTION_MATRIX`。
   换算关系：`CAMERA_MATRIX(旧) = INV_VIEW_MATRIX(新)`，`INV_CAMERA_MATRIX(旧) = VIEW_MATRIX(新)`。
2. **fragment 阶段没有世界坐标内置**：`world_vertex` / `world_position` / `world_coords` 全部 Unknown identifier。
   要世界坐标就在 `vertex()` 里 `(MODEL_MATRIX * vec4(VERTEX,1.0)).xyz` 取好，用 `varying` 传进 fragment。
3. `VERTEX` 在 fragment 是 **vec3**（旧版是 vec4），`vec4(VERTEX)` 会报「Invalid arguments」。
4. `FRAGCOORD` / `SCREEN_UV` 只在 fragment 可用；`hint_screen_texture` / `hint_depth_texture` /
   `hint_normal_roughness_texture` / `source_color` / `repeat_*` / `filter_*` 全部可用；
   精度限定符 `lowp/mediump/highp` 不能当 sampler 的类型提示写。
5. 老式 `uniform float x = 1.0 : hint_range(...)`（默认值写在冒号前）依旧整段编译失败——与 4.7 无关的旧坑，仍然要躲。
6. **无头（dummy 渲染器）也会编译并报 SHADER ERROR**：不用开窗口就能批量验着色器语法，
   本轮靠这一点把内置变量清单一次性测完（`tools/probe_stages.gd`）。

**类与属性**

7. `TorusMesh`：`major_radius/minor_radius/loop_size` → `outer_radius/inner_radius/ring_segments/rings`，
   **而且语义变了**：`outer = R + r`、`inner = R − r`。按旧习惯传 (R, r) 会得到一个「胖甜甜圈」
   （本工程实测：扶手环变成管径 4.3 m 的实心环，就是画面里那颗黑球）。
8. `WorldSettings` 类**已不存在**，取而代之的是 `World3D`（Resource，带 `environment` /
   `fallback_environment` / `camera_attributes` / `compositor`）。
9. `CameraAttributesPhysical` **不再有任何景深属性**（只剩光圈/快门/焦距/对焦距离/EV 上下限）；
   景深只在 `CameraAttributesPractical` 上，且 `dof_blur_near/far_amount` 合并成了单一 `dof_blur_amount`。
10. `Light3D.light_projector`（Texture2D）可用 → 真正的 gobo 投影（彩窗花纹投到地面），**前提是开阴影**。
11. `FogMaterial.density_texture` 是 **Texture3D**；`NoiseTexture3D` 存在（width/height/depth/noise/normalize/seamless）
    → 体积雾团可以带程序 3D 噪声密度。
12. `Environment.adjustment_color_correction` 接受 **Texture2D 或 Texture3D**；
    但 `Image` **没有** `create_3d/create3d`，GDScript 侧只能走 `NoiseTexture3D` 或
    `RenderingServer.texture_3d_create` + `Texture3DRD`。
13. SDFGI 的项目设置大幅收缩：`probe_subdivision` / `max_cell_energy` / `injection_cell_size` /
    `cardinal_max_distance` 都没了，只剩 `frames_to_converge`；Environment 上也没有对应属性
    → **4.7 把 SDFGI 的注入细节自动化了**，可调面变小。
14. `SurfaceTool` 用 `set_uv()`，没有 `add_uv()`。
15. `Camera3D` 没有 `maintain_aspect_ratio`（改用 `keep_aspect`）。
16. `Viewport` 的 debug draw 枚举里没有 `DEBUG_DRAW_VISIBLE_LIGHTS`。
17. `RenderingDevice.get_device_name()` **不收参数**（传索引会直接报脚本错）。
18. `Performance.RENDER_VIDEO_MEM_USED` / `RENDER_TEXTURE_MEM_USED` 返回的是**字节**，不是 MB。
19. `Object.get_property_list()` 会按 `_validate_property` **隐藏条件属性**
    （如 `ParticleProcessMaterial.emission_box_extents` 只在 emission_shape=BOX 时出现）；
    要拿全量属性名必须用 `ClassDB.class_get_property_list()`。这条差异害我一度以为 4.7 删了这些属性。
20. `StandardMaterial3D` 的接收阴影开关叫 `disable_receive_shadows`（不是 `receive_shadows`）。

**引擎行为（不是 API，但同样会咬人）**

21. **`flip` 必须同时翻转顶点绕序**：只翻转法线属性的话，背面剔除仍按原绕序判定，
    结果是「法线朝厅内、正面朝厅外」——整面墙在厅内直接消失（本工程最贵的一次调试，
    最后靠 `--debugdraw` + 直接读网格法线与离轴方向点积才定论）。
22. 参数曲面求法线时，**先归一化两个切向再叉乘**；否则 1×1 小面片（逐格挖洞的墙）
    叉积长度会掉进退化阈值，整面墙被当成退化三角形丢掉。
23. `look_at` 的目标方向与 `UP` 接近共线（正下/正上打光）时，引擎报 collinear 且定向不可靠 → 直接写 `rotation_degrees`。
24. 点光/聚光的 `range` 必须**算过**再填：灯到被照面 12.5 m 而 range=11 时，结果不是「偏暗」而是「全黑」。
25. 运行期改 `ProjectSettings` 的 msaa/taa/scale 不会重建已存活的根 Viewport，
    要同时写 `Viewport.msaa_3d / use_taa / scaling_3d_scale` 才生效。

---

## 5. 渲染效果总结（表现力轴）与上限判断

**做到了什么**

- **一个像素的外部素材都没有**，最后成图的材质层次（大理石脉络、错缝砌石、氧化黄铜、
  湿面、水线苔痕、彩窗玻璃、波动水面）在观感上不被"素材库缺失"拖住 ——
  关键支点是 **世界三向投影 + 参数曲面**：程序生成的曲面不需要展 UV，也不出现接缝与拉伸，
  这让"零素材"从口号变成可施工路线。
- **SDFGI 在封闭穹顶空间里是决定性的**：彩窗与落日通过反弹把墙面和柱础染色，
  关掉后画面立刻"死"成直接光贴图（§3 的 direct 档）。
- **体积雾 + 前向散射 + 浮尘粒子**三件套让低角度日光成为"有厚度的实体"，
  这是这张场景里性价比最高的一档效果。
- **AgX + 自动曝光 + glow 阈值 1.0** 让"落日穿破口"这种极端亮度差不翻白：
  全图 `clip`（纯白像素占比）在 9 个机位上都是 **0.0000**。
- **light_projector 做出真正的彩窗投影**（不是靠自发光贴图糊），这是 4.7 相对早期版本很实在的 TA 能力。

**上限在哪 / 不行的地方**

1. **2D 平铺 LUT 没打通**：`adjustment_color_correction` 收 Texture2D，但按常见工具链版式
   （4×4 tiles / 256²，以及 8×8 tiles / 512²）生成的 **identity 图都不是恒等映射**
   （同一机位 mean 从 0.09 被推到 0.61），说明引擎期望的 tile 排布与通用约定不同；
   本机也没法用 `Image` 直接造 Texture3D LUT。结论：**4.7 上做分级仍应以 `adjustment_*` 标量 +
   自定义后期 pass 为主**，LUT 这条路要么按引擎私有版式产图，要么走 `RenderingDevice` 造 Texture3D。
2. **物理相机没有景深**：想要"真实曝光三要素"就得放弃 DOF（或退回 Practical）。
   两者不能同时拿，是 4.7 当前相机属性拆分留下的实际缺口。
3. **晕影 / 色散 / 颗粒 / 运动模糊**引擎本体都没有，必须自己加 canvas 全屏 pass；
   本轮用 `hint_screen_texture` 实现了一个，但它是**色调映射之后的显示空间**操作，
   拿不到 HDR 缓冲，做不了真正的镜头 bloom/胶片模拟。要拿 HDR 中间结果只能上 `CompositorEffect`
   （4.7 有该基类与 `access_resolved_color` 等开关，本轮未实现）。
4. **ultra 档的边际收益低**：SSR + TAA + 8× MSAA + 8192 阴影换来 0.3→0.0 的暗部占比与轻微锯齿改善，
   代价 24% 帧率。上限的"最后一档"在 4060 笔记本级别硬件上不划算。
5. **未覆盖的高阶能力**（本轮明确没测，属下一步）：`LightmapGI`/`LightmapperRD` 烘焙、
   `VoxelGI`、`CompositorEffect` 自定义 pass、`OccluderInstance3D` + 遮挡剔除、
   虚拟阴影贴图、`MeshTexture`/HDR 输出。

**风格判断**：本轮定的是「写实光影 + 电影级黄昏」（AgX、暖主光/冷补光、体积光束、极弱镀金穹顶自发光）。
结论是 Godot 4.7 在这条路上**能到"可当宣传图"的门槛**，但**离真正的离线级 GI 还有一档**：
SDFGI 的注入细节被自动化后可调面变窄（§4-13），薄结构（栏杆、藻井深缝）的 AO 与
小尺度反弹仍不如烘焙 GI 干净 —— 想要更高上限，正确组合是 **SDFGI 打底 + LightmapGI 补近景**，
这也是下一步该测的轴。

---

## 6. 文件地图

```
project.godot                     Forward+ 与渲染相关项目设置
scenes/ta_bench.tscn              只有一个根 Node3D + 脚本，其余全部代码生成
scripts/
  ta_bench.gd                     装配 / CLI / 截图状态机 / 像素统计 / 性能采样 / 自由观察
  layout.gd                       空间尺寸总表（改一处重排全场景）
  geo_lab.gd                      参数曲面与建筑构件生成（含法线-绕序一致性约定）
  tex_lab.gd                      程序化贴图与 LUT
  noise_gen.gd                    FastNoiseLite 薄封装
  mat_lab.gd                      15 个 PBR 材质
  hall_builder.gd                 建筑主体（墙/柱/拱/穹顶/台地/开口/外部地形）
  props_builder.gd                陈设与氛围（水面/天文仪/吊灯/蜡烛/碎石/decal/粒子）
  lights_lab.gd                   18 盏灯与阴影配额
  atmos_lab.gd                    天空 / Environment / 四档预设 / 雾团 / 后期层
  camera_rig.gd                   9 个机位与相机属性
shaders/
  water.gdshader  post_grade.gdshader
tools/
  ta_health_check.gd              无头装配自检（41 条断言，被 verify.mjs 调用）
  probe_api.gd probe_render2.gd probe_types.gd probe_tex.gd probe_tex3d.gd
  probe_meshes.gd probe_shader_builtins.gd probe_stages.gd probe_matrices.gd
  probe_wall.gd                   4.7 API 探针集（本报告 §4 的证据来源）
shots/                            8 张入库截图（5 张成片 + 3 张预设对比）
```
