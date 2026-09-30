# 17 · AUREOLE 光晕中庭 — Godot 4.7.2 技术美术（TA）渲染上限测试

> 测试目标：验证 Godot 4.7.2 Forward+ 在**美术风格表现力、场景搭建复杂度、灯光渲染上限**三个维度的能力。
> 约束：**零外部素材** —— 几何、贴图、材质、灯光、后期全部在 GDScript 运行期程序化生成，
> 工程内没有引用任何 `assets/` 文件（Label3D 使用引擎内置字体，同样不引入外部文件）。

---

## 1. 场景描述

**风格锚点**：粗野主义混凝土中庭 × 冷暖双色霓虹（参照《Control》式的混凝土体量感 +
暮色格栅光柱 + 青/琥珀双色点光）。写实 PBR 光影路线，非卡通 NPR。

**空间结构**（单位米，全程序化拼装，338 个节点）：

| 层级 | 内容 |
|---|---|
| 中庭主体 | 24×20×12 空腔；三面环墙 + 北墙 6×6 门洞接走廊 |
| 地面 | 中央 14.5×12.5 抛光地砖（clearcoat 湿感）嵌于混凝土地坪，3 片积水洼 |
| 夹层 | y=5.2 环三面走道 + 悬浮楼梯 28 级 + MultiMesh 栏杆（约 120 根立柱 1 次 draw） |
| 天窗 | 屋顶 11×9 开口，10×6 格栅梁切出条纹光柱 |
| 纵深走廊 | 6×6×34，壁柱×16、顶部灯带×14、电缆桥架、尽头发光门（消失点） |
| 装配层 | 工艺管线 / 风管 / 法兰 / 电控柜 / 门组 |
| 使用层 | 服务器机架×4（散热缝面板 + 三色 LED）/ 板条箱×7 / 化工桶×3 / 工作台 / 吊灯×3 / 壁灯×4 / Label3D 标识×3 / 浮尘粒子×240 |

**色板**：混凝土灰 `#6F6B63` 系 / 暮色天空顶 `#0E1626` / 青霓虹 `#2FE0FF` /
琥珀钠灯 `#FF9538` / 阳光暖白 `#FFF0D9`。

## 2. 渲染管线关键参数（project.godot + Environment）

### 2.1 项目级（`[rendering]`，全部经 ClassDB/ProjectSettings 探针核实键名）

| 参数 | 值 | 说明 |
|---|---|---|
| `renderer/rendering_method` | `forward_plus` | SDFGI/SSIL/体积雾全量可用的前提 |
| `anti_aliasing/quality/use_taa` | `true` | 抹平 SDFGI/体积雾时域噪声，静态画面收敛后极干净 |
| `anti_aliasing/quality/msaa_3d` | `2` | 补透明与几何边缘 |
| `anti_aliasing/quality/use_debanding` | `true` | 暗部渐变去色带 |
| `directional_shadow/size` | `4096` + `16_bits` | 光柱条纹边缘质量的关键 |
| `directional_shadow/soft_shadow_filter_quality` | `3`（最高档） | |
| `positional_shadow/atlas_size` | `4096` + `16_bits` | 承载 4 个投影位置光（四象限） |
| `environment/ssao/quality`、`ssil/quality` | `2` | 项目级质量档 |
| `volumetric_fog/volume_size × depth` | `128 × 128` | 默认 64³ → 提到 128³，光柱更细腻 |
| `sdfgi/frames_to_converge` | `10` | 默认 5 → 收敛帧数翻倍 |
| `textures/default_filters/anisotropic_filtering` | `4` | 斜视角地砖不糊 |

### 2.2 WorldEnvironment（`scripts/bench_root.gd` `_setup_environment()`）

| 模块 | 参数 | 值 |
|---|---|---|
| 色调映射 | `tonemap_mode` | **AGX**（高光肩部平滑，霓虹/钠灯不糊白） |
| | `tonemap_exposure` | 1.0 |
| 泛光 | `glow_enabled` + levels 1–7 | 全开、逐级衰减 0.55→0.30，`bloom=0.06`，`hdr_threshold=1.0` |
| AO | `ssao_enabled` | radius 1.6 / intensity 2.4 / power 1.5 / horizon 0.06 / `light_affect 0.35` |
| 间接光缝 | `ssil_enabled` | intensity 0.9 / radius 1.6（Forward+ 独有） |
| 反射 | `ssr_enabled` | max_steps 64 / depth_tolerance 0.25（地砖与积水吃霓虹倒影） |
| 动态 GI | `sdfgi_enabled` | **4 级联** / min_cell 0.25 / bounce_feedback 0.6 / read_sky / use_occlusion / y_scale 100% |
| 体积雾 | `volumetric_fog_enabled` | density 0.024 / length 120 / **anisotropy 0.7**（前向散射→光柱）/ gi_inject 0.6 / 时域重投影 0.9 |
| 环境光 | `ambient_light_source=SKY` | energy 0.7，`sky_contribution=1.0` |
| 调色 | `adjustment_enabled` | contrast 1.06 / saturation 1.07（克制） |
| 天空 | ProceduralSkyMaterial | 暮色顶色 `#0E1626`、地平暖棕，radiance 256 / quality 模式 |

### 2.3 物理相机（`CameraAttributesPhysical`，自动曝光关闭 → 截图可复现）

- 光圈 **f/2.8**、快门 **1/50s**、ISO **1250**
- 每机位 fov 40°–84°；`near 0.08 / far 260`

### 2.4 灯光清单

| 灯 | 类型 | 关键参数 | 投影 |
|---|---|---|---|
| 天光 | DirectionalLight | rot(-40°, 28°)，energy 3.8，角径 0.6°，4 级联，volumetric_fog_energy 1.6 | ✔ |
| 吊灯 ×3 | Omni | energy 4.5 / range 11 / 暖橙，挂高 8.4–9.0m | 仅中灯 |
| 走廊壁灯 ×4 | Omni | energy 3.2 / range 8.5，交替侧壁 | 前 2 盏 |
| 东墙检修射灯 | Spot | energy 18 / 58° / range 14，**挂夹层楼板底面**向下洗墙 | ✔ |
| 机架壁洗灯条 | Omni + emissive 管 | energy 6.5 / range 6，正面补光 | ✘ |
| 门洞冷聚光 | Spot | energy 2.2 / 55°，冷暖过渡 | ✘ |
| 霓虹缝/灯带/LED | StandardMaterial emissive | energy 4.5–10（shaded 模式 → 被 SDFGI 当面光源采样） | — |

位置光投影恰好 4 盏 = 阴影图集四象限各一，无争抢。

## 3. 程序化材质（`scripts/lib/proc_tex.gd` + `mat_lib.gd`）

| 材质组 | 生成方式 | 分辨率 |
|---|---|---|
| 清水混凝土 | 4 层 FastNoiseLite（污渍/骨料/砂点/ridged 裂纹）+ Sobel 法线 | 512² |
| 抛光地砖 | 4×4 格砖 + 哈希逐砖抖动 + 磨损/微孔；砖面 rough 0.16、砖缝 0.78 | 512² |
| 拉丝金属 | x 向压缩采样成横向拉丝 + 油污低频 | 256² |
| 漆面钢 | 掉漆 mask + 锈蚀 mask（albedo/roughness 同源） | 256² |
| 科技面板 | 散热缝开槽 + 检修铭牌浅框 | 256² |
| 水洼波纹 | 双层噪声法线，roughness 0.035 + clearcoat 1.0 | 256² |

- **无缝平铺**：噪声四角镜像平均 `(f(x,y)+f(S-x,y)+f(x,S-y)+f(S-x,S-y))/4`，世界三平面映射无网格缝。
- **架构面全部 world triplanar**：不同尺寸 BoxMesh 不手展 UV，全场 texel density 天然一致。
- albedo 走 `albedo_texture_force_srgb`；roughness/normal 走线性。

## 4. 操作与出图（`tools/capture_shots.gd`）

### 4.1 自由漫游（默认模式，运行游戏即玩）

无碰撞穿墙的查看器（TA 审查视角），启动后**点击画面捕获鼠标**：

| 输入 | 作用 |
|---|---|
| 鼠标 | 转头（俯仰限制 ±85°） |
| W/A/S/D | 沿视线前进/后退、左右横移 |
| Q / E（或 空格） | 下降 / 上升（世界系垂直） |
| 滚轮 | 飞行速度 1–40 m/s（HUD 实时显示） |
| Shift / Alt | ×4 加速 / ×0.25 微调 |
| 1–5 | 瞬移固定机位（wide/mezz/corridor/detail/up），朝向无缝接管 |
| T | 切换机位慢速巡游（截图工具依赖的漂移模式） |
| H | 显示/隐藏 HUD |
| Esc | 第一次释放鼠标，第二次退出 |

验证：`tools/free_move_test.gd` 合成键鼠事件断言（前进位移 / 鼠标转角 / 机位保持 / HUD 文案），实测 PASS。

### 4.2 截图工具

```powershell
# 五机位全拍（预热 300 帧等 SDFGI/TAA/体积雾收敛，每机位再等 120 帧，1.5× 超采样）
engines\godot\4.7.2\Godot_v4.7.2-stable_win64_console.exe --path projects\17-aureole-hall `
  --resolution 1600x900 -s res://tools/capture_shots.gd -- `
  --warm=300 --frames=120 --scale=1.5 --out=_scratch/shots/17_final
```

- 工具会打印**保存瞬间的视口相机位姿**，保证「所拍=所标」可审计；
- 自由模式静态保持机位（无巡游漂移），出图比早期版本更稳。

## 5. 性能实测（RTX 4060 Laptop / Vulkan 1.4.312 / 1600×900）

| 配置 | 平均帧时 | 折算 |
|---|---|---|
| 1.0× 渲染缩放 | **13.3–13.6 ms** | ≈ 73–75 fps |
| 1.5× 超采样（出图用） | **19.0–21.1 ms** | ≈ 47–53 fps |

## 6. 渲染效果总结

| 机位 | 展示的能力 | 实测观察 |
|---|---|---|
| `wide` 广角 | 全管线综合：SDFGI 弹光、格栅影、地面反射、双色霓虹 | 曝光平衡，暖主导 + 青点缀成立；吊灯在抛光砖上形成清晰高光 |
| `mezz` 俯视 | 抛光砖 + 积水 SSR 反射、夹层霓虹勾边、纵深构图 | 反射层次成立（灯影、霓虹倒影可辨）；近景霓虹 bloom 偏饱和但符合霓虹质感 |
| `corridor` 34m 轴线 | 体积雾透视、灯带消失点、SDFGI 走廊间接光 | 全场最稳的一张：雾中灯带递进 + 尽头发光门收焦点 |
| `detail` 材质特写 | 混凝土凹凸（法线）、tech_panel 开槽、三色 LED emissive+bloom、射灯投影 | 混凝土颗粒在斜射下可读；LED 翻面后青/红像素 0 → 6.2 万，emissive→SDFGI 链路成立 |
| `up` 仰视天窗 | 条纹光柱、体积雾前向散射、浮尘粒子、灯具细节 | 格栅切光成立；浮尘换径向衰减贴图后不再是硬方块 |

**结论（对照三个测试维度）**：

1. **美术风格表现力**：粗野主义 + 暮色双霓虹的定向风格可完整落地；AGX + 克制调色保证了
   高动态场景（发光灯带 vs 暗墙角）的层次，风格化与写实光影可兼得。
2. **场景搭建复杂度**：338 节点 / 五类程序化贴图 / 三平面映射 / MultiMesh 栏杆，
   在零素材前提下达到「多层级细节 + 材质变化 + 空间纵深」的要求，构建期 CPU 开销 < 4s。
3. **灯光渲染上限**：SDFGI（4 级联 + emissive 面光源弹光）、SSIL、SSR、128³ 体积雾光柱、
   4096 16bit 软阴影、TAA 收敛在 4060 笔记本 GPU 上以 13.3ms@1600p 达成 —— 管线全开仍有余量。

**诚实记录的短板**：

- SDFGI 在极暗角落（机架正面背光区）仍需人工补光（壁洗灯），纯动态 GI 的暗部细节有限。
- 霓虹条近距离会过曝成白核（emissive energy>6 时），特写机位需要按距离分档调 energy。
- 体积雾 density 与曝光耦合敏感：0.03→0.024 才消掉「奶雾感」；参数需成组标定。
- Godot 无软粒子（浮尘近景仍有硬边风险），需贴图径向衰减兜底。
