# ASSET_MANIFEST.md — 07 工程选定资产实测记录

> 规则（继承 06）：所有模型进场景前必须实测包围盒（`tools/verify_assets.gd`），
> 缩放决策写在这里，不靠肉眼猜。Poly Pizza 模型尺度混乱（见球：百万米级 + 偏移），
> 一律在运行时自动归一化或按实测比例缩放。

## 车辆（Kenney Car Kit，CC0）

| 模型 | 实测尺寸 (x,y,z, m) | 用途 | 缩放决策 |
|---|---|---|---|
| kart-oobi.glb | 0.97 × 1.33 × 1.43 | 玩家车（蓝） | ×2.5 → 车长 3.58 m；轮子节点名 `wheel-*` 在运行时拆挂 VehicleWheel3D |
| kart-oozi.glb | 0.97 × 1.33 × 1.43 | AI 车（橙） | 同上 |
| kart-ooli / oopi / oozi | 同上 | 备用涂装 | 同上 |
| wheel-racing / wheel-dark | 0.40 × 0.60 × 0.60 | 备用轮 | 未用（轮子用 kart 自带轮节点） |
| cone / cone-flat | — | 场边道具 | 备用 |

**车辆物理关键值（实测教训写在代码注释里）**：
- 车辆前进方向 = 本地 **+Z**（Godot 4.7 VehicleBody3D 正 engine_force 沿 +Z 推进，实测）；
  kart 模型默认朝 -Z，故 `MODEL_YAW_DEG = 180`。
- 轮半径 = 轮节点世界 AABB 高的一半；`global_transform` 已含 KART_SCALE，**别再乘一次**。
- 转向轮 = 本地 +Z 端的两轮（装错端 = 后轮转向，画龙搁浅）。
- 硬速度帽 24 m/s（boost 33）：只靠引擎力限速会飘到 40+，超速部分直接削速度向量。

## 球（Poly Pizza，CC-BY，Poly by Google）

| 模型 | 实测尺寸 | 缩放决策 |
|---|---|---|
| ball_soccer.glb | **1,060,662 × 1,068,023 × 1,057,253 m，中心偏移 (375160, 452030, 291632)** | `ball_controller._normalize_visual()` 运行时自动缩放到直径 2.2 m 并回中——换球模零改动 |

**球物理参数（tools/physics_probe.gd 实测，g=16）**：质量 6 kg；restitution 0.55（Godot 4.7
弹跳合成近似取两侧较大值，与 Rapier 的 Average 不同）；linear_damp 0.5 / angular_damp 1.0
补滚动阻力；CCD 开（60 m/s 不穿 0.5 m 薄墙）。

## 场景装饰（Kenney City Kit (Commercial) / Poly Pizza 体育件）

| 模型 | 实测尺寸 (m) | 用途 | 缩放决策 |
|---|---|---|---|
| stadium-seats-KAHX68dbXO | 44.0 × 7.3 × 33.4 | 看台（边线外侧） | ×1.0 原尺寸 |
| stadium-seats-3eKUbGjEPv / wtYoArecHj | 21.8 × 7.3 × 12.1 / 21.8 × 15.2 × 16.6 | 看台变体 | ×1.0 |
| building-skyscraper-a/c/e | 1.3×2.9×1.4 ～ 1.3×4.1×1.2 | 天际线主楼 | ×15–20 → 43–82 m |
| building-a / f / k | 0.9–2.1 宽 × 1.3–1.7 高 | 中景楼 | ×14–18 |
| low-detail-building-a / wide-a | 0.5×2.0×0.5 / 1.0×1.1×0.5 | 远景填充 | ×16–20 |

## 场地常量（scripts/arena.gd 为运行期唯一权威）

场地 72 × 44 m（半长 36 / 半宽 22）· 墙高 12 · 球门宽 12 / 高 4 / 深 3.5 ·
球半径 1.1 · 蓝门 x=-36（玩家），橙门 x=+36 · 开球位 (±18, 0.8, 0) ·
大 pad ×6（+100，10 s 重生）小 pad ×12（+12，4 s 重生）。

## 音频（全部登记 `assets/SOURCES.md` §5）

引擎 6 档转速循环（WAV，代码里设 LOOP_FORWARD，档位按车速 5.5 m/s 切）·
boost 气浪 swish-4/7/11 · 撞球 impactGeneric_light ×3（冲量定音量音高）·
进球 jingle_score_a/b（Kenney Hit jingles）· 观众 crowd_score / crowd_ambience ·
BGM 比赛轨 intothenight_retroracing_mix.ogg / 结算轨 retroracing_menu.mp3。
