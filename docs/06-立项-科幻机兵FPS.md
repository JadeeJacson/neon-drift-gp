# 06 · 立项：科幻机兵 FPS（正式期第一作）

> 状态：**第一轮人验后的修复轮已完工**（`node tools/verify.mjs 06` 七步 PASS：
> import/load 零报错、52 测试 699 断言、28 条冒烟断言、三画像跑分 0%/88%/100%、整局 11.8 分钟）
> 本轮已修：步枪连发、枪口/曳光起点、viewmodel 朝向（实测包围盒）、换弹动作、
> 敌人死亡表现、受击闪白与命中反馈、HUD 重排、Kenney Space Kit 装饰层、清波重复触发 bug
> 待办：**制作人复验上述改动**（§7.2 表）、战斗 BGM 无声（#18，你让先放着）、寻路方案（§2.5）
> 已通过人验：移动手感（DoD 第 1 条）、敌人可读性
> 方向：3D movement FPS · 科幻机兵题材 · 单机 · Godot 4.7.2 + GDScript
> 延续 04 火线的题材积累，但目标是从「技术练习」升级为「完整、有趣、精美的正式作品」。

---

## 1. 标杆参考（泰坦陨落2 式手感，及同赛道范例）

| 游戏 | 年份 | 学什么 | 为什么适合我们 |
|---|---|---|---|
| **Titanfall 2** | 2016 | 移动系统：滑铲保持动量、二段跳、墙跑、兔子跳；枪械反馈的「脆」感 | 用户指定标杆。移动即玩法的教科书 |
| **Severed Steel** | 2021 | **小团队**做出的 movement shooter：滑铲+墙跑+子弹时间+可破坏场景 | 证明小体量也能把移动手感做扎实，体量最接近我们 |
| **ULTRAKILL** | 2020 | 风格化低模也能「精美」；进攻回血的风险回报循环；移动即生存 | 证明不追求写实也能出品质，美术压力小 |
| **DOOM Eternal** | 2020 | 战斗资源循环：处决回血/链锯回弹/喷火回甲——逼玩家保持进攻节奏 | 战斗循环设计的天花板，提炼其循环结构而非体量 |
| **Roboquest** | 2023 | roguelite FPS：随机关卡 + meta 成长；机动射击手感 | 小团队（2 人核心）作品，机兵题材直接对口 |
| **Bright Memory: Infinite** | 2021 | **单人开发者**做出的 3A 观感 | 证明「AI/极小团队做出精美画面」的可行性上限 |
| **Ghostrunner** | 2020 | 一击必杀 + 墙跑 + 慢动作的节奏张力 | 备选机制库（高难度路线时参考） |

**结论**：对标组合 = Titanfall 2 的移动 + DOOM Eternal 的战斗循环 + ULTRAKILL 的美术策略
（风格化低模 + 强光照氛围，不追写实）+ Roboquest 的机兵题材与体量感。

---

## 2. 核心机制清单（第一版）

### 2.1 移动（手感之源，最高优先级）

- 滑铲（下坡加速、铲入战斗）· 二段跳 · 墙跑/墙跳 · dash（可选）· 兔子跳（进阶技巧）
- 基础层直接复用 **Jeh3no FPS 控制器模板**（MIT，已下载，覆盖上述全部 + coyote time + jump buffering + 相机 tilt/bob/FOV 过渡）

### 2.2 战斗

- 首发武器 3 把：突击步枪（中距）/ 霰弹（近距爆发）/ 精确射手（远距高伤）
- 反馈链：枪口火光 + 曳光 + 命中标记 + 击杀确认音 + 屏幕震动 + 短暂 hitstop
- 资源循环（DOOM Eternal 式简化版）：处决/特定击杀回资源，鼓励进攻而非龟缩

### 2.3 敌人（机兵）

- 3 种起步：近战冲锋型（小狗/蜂群）、中距射击型（人形机兵）、重装压制型（机甲）
- AI 起步用状态机（巡逻/追击/攻击/硬直），复用 04 的 bot 设计经验

### 2.4 关卡与结构

- 首发 1 张精心设计的竞技场式关卡（垂直空间 + 墙跑路径 + 滑铲下坡）
- 波次战斗（沿用 04 已验证的波次框架思路），目标：一局 10–15 分钟完整体验
- 后续迭代再考虑 roguelite 化（Roboquest 路线）

---

### 2.5 敌人寻路（练习期遗留短板，本作必须记账）

04 合并版的 AI **不会绕障碍**（直线移动 + LOS 绕行），遇到复杂地形会卡；横向对比时
运输船是唯一会用 nav-grid BFS 绕路追人的，被列为 P2 移植项。本作当前状态：

- `EnemyAI`（sim）只输出**意图**（前进/后退/搜索/占位），位移由场景层直线实现；
- 因此关卡布局必须留中央通路（`tools/build_arena.gd` 的四角分离式高台 + 绝不围死中心），
  并用 `alive_cap` 限制同屏敌人数量——**这是规避，不是解决**。

候选方案（做第 2 张关卡或敌人卡住成真问题时再定）：

| 方案 | 成本 | 备注 |
|---|---|---|
| NavigationServer3D + 预烘焙 NavRegion | 中 | Godot 原生，但要在关卡里铺 region；blockout 阶段几何还会变 |
| 自制网格 A*（移植运输船 nav-grid 思路） | 中高 | 与 sim 层最契合，可在 `--headless` 下逐帧断言路径 |
| 保持直线 + 布局规避 | 零 | 当前状态。单张竞技场够用，多关卡/立体地图会露馅 |

`project.godot` 目前只命名了 3 个物理层（world/player/enemy），**没有任何 navigation 层配置**——
选前两条路时才需要动。

---

## 3. 素材映射表

| 需求 | 来源 | 状态 |
|---|---|---|
| 移动控制器 | Jeh3no Godot 模板（GitHub, MIT） | ✅ 已接入 `projects/06-mech-fps/addons/JehenoAdvancedFirstPersonController/` |
| 机兵/机器人敌人模型 | Poly Pizza（CC0/CC-BY）mech/robot/drone 搜索批 | ✅ 21 个 GLB 入 `models/characters/polypizza/` |
| 武器模型 | Poly Pizza（sci-fi gun/blaster） | ✅ 14 个 GLB 入 `models/weapons/polypizza/` |
| 炮塔/场景机械 | Poly Pizza（turret） | ✅ 5 个 GLB 入 `models/environment/polypizza/` |
| 环境模块（空间站/科幻场景） | Kenney Space Kit（CC0） | ✅ 1694 文件入 `models/environment/kenney_space-kit/` |
| 关卡 blockout 纹理 | Kenney Prototype Textures（CC0） | ✅ 78 PNG 入 `textures/kenney_prototype-textures/` |
| 天空盒 | Kenney Skyboxes（CC0） | ✅ 12 张入 `textures/kenney_skyboxes/` |
| 射击/爆炸/命中音效 | Kenney Sci-fi Sounds（73）+ Impact Sounds（133） | ✅ 入 `audio/sfx/` |
| UI 音效 | Kenney UI Audio | ✅ 55 个入 `audio/sfx/kenney_ui-audio/` |
| 准星 | Kenney Crosshair Pack | ✅ 2013 张入 `ui/kenney_crosshair-pack/` |
| 粒子贴图（火光/烟雾/火花） | Kenney Particle Pack | ✅ 96 PNG 入 `textures/kenney_particle-pack/` |
| 角色动画库 | ~~Quaternius Universal Animation Library / Mixamo~~ | **不需要**：trooper 自带 17 套、drone 6 套；charger/heavy 走程序化（见 `assets/animations/README.md`） |
| 音乐（菜单/战斗/紧张段） | OpenGameArt · bogart-vgm（CC-BY 4.0，需署名） | ✅ 3 首 MP3 入 `audio/music/`，登记在 `assets/SOURCES.md` §4 |
| 测试框架 | bitwes/Gut 9.7.1（MIT） | ✅ 已接入 `addons/gut/`，CLI 跑 `sim/tests` |

---

## 4. 难度平衡与剧情（知识资产）

- **难度**：首版用「波次强度曲线 + 玩家资源回复率」双旋钮，沿用 03 的机器人跑分方法论
  做参数扫描（击杀时间 TTK、受击频率、资源净收益量化成表）。
- **剧情**：首版轻叙事——环境叙事（关卡内终端/标语/残骸）+ 开场一页简报。
  不做过场动画（投入产出比太低）。世界观一句话：*你是最后一代机兵驾驶员，
  在被 AI 叛军占领的轨道空间站里夺回控制权。*

### 4.1 跑分基线（2026-09-27 实测，`sim/match_sim.gd` + `tools/sim_report.gd`）

抽象整局（5 波 × 全部编成 × 三种玩家画像 × 多seed），断言的是**分布区间**（路线图 §4.3）：

| 画像 | 参数 | 通关率 | 整局时长 | 累计受击 | 弹药自给 |
|---|---|---|---|---|---|
| 龟缩流 | 进攻 0.15 / 爆头 0.10 / 处决 0 / 机动 0.20 | **0%** | 11–14 min | 236–380 | 0.49 |
| 普通 | 进攻 0.5 / 爆头 0.25 / 处决 0.35 / 机动 0.5 | **88–92%** | 11–14 min | 158–257 | 0.57 |
| 高手 | 进攻 0.8 / 爆头 0.45 / 处决 0.7 / 机动 0.85 | **100%** | 11–14 min | 81–133 | 0.67 |

要的形状是「**龟缩必败、普通险胜、高手从容**」。普通画像终局中位只剩 13 HP（上限 100），
所以是险胜而不是碾压。`sim/tests/test_match_sim.gd` 把这些区间锁成断言。

调参过程留下的教训（都写进了代码注释，防止下次改回去）：

1. **`WAVE_REPAIR=15` 时普通画像通关率 25%**，「完整可玩」会变成劝退；**30 时变 100%**，
   梯度在中段塌掉；**24** 才有上面这个形状。难度不是单调旋钮，中段最容易塌。
2. **受击模型最初漏了三样东西，直接得出「谁都活不了」的假结论**（普通画像要吃 457 伤害 vs 100 HP）：
   近战型必须先逼近才打得到、重装开火有前摇、导演出怪是排队的（`alive_cap` 意味着后排还在路上，
   不该全程开火）。补齐这三条后同一画像降到 214 中位。
   **结论：难度结论的可信度取决于建模是否覆盖「敌人不是刷新即输出」，而不是数值本身。**
3. `MANEUVER_PER_ENEMY`（走位/瞄准时间）与 `WaveTable.PER_ENEMY_TIME` 必须同值，
   有断言锁着——否则「时长模型」和「编成模型」会各说各话。

---

## 5. 工程规划

```
projects/06-mech-fps/                       ✅ 战斗循环可跑，--headless 全绿
├─ project.godot                            config_version=5, forward_plus, 19 个输入动作
├─ icon.svg
├─ scenes/
│  ├─ main.tscn                             GameRoot 装配：Arena + Player + WaveDirector + Hud
│  ├─ player.tscn                           实例化模板控制器 + Vitals + Camera 下的 Weapon
│  ├─ arena.tscn                            程序化生成：23 碰撞体 + 光照/天空/雾/glow + 15 出怪点
│  └─ enemies/                              trooper / swarm_drone / charger_melee / heavy_walker
├─ scripts/                                 场景层（表现与输入，不承担跨帧复现逻辑）
│  ├─ game_root.gd                          解析引用、把 HUD 与导演接到玩家身上
│  ├─ weapon_controller.gd                  hitscan + 3 武器切换 + 枪口焰/曳光/命中标记/音效
│  ├─ camera_shake.gd                       trauma 震屏 + 命中顿帧（挂在 Camera 下，理由见文件注释）
│  ├─ enemy_controller.gd                   位移与动画，决策每帧问 sim 的 EnemyAI
│  ├─ player_vitals.gd                      血量/受击/死亡（必须是 Player 的子节点，见文件注释）
│  ├─ wave_director.gd                      按 WaveTable 计划出怪，守 alive_cap 与出怪间隔
│  ├─ bgm_player.gd                         三条轨按波次状态切换，交叉淡入淡出
│  └─ hud.gd                                代码搭的 HUD：血条/弹药/波次/中央提示/受击闪红
├─ sim/                                     纯逻辑层，不碰场景树与物理 → 可逐帧断言
│  ├─ weapon_table.gd enemy_table.gd        武器 3 把 / 敌型 4 种（含后坐/顿帧等反馈数值）
│  ├─ wave_table.gd                         威胁预算曲线 + 精英节奏 + 时长估算
│  ├─ enemy_ai.gd                           状态机纯函数（前进/后退/交战/占位/搜索）
│  ├─ combat_loop.gd                        单目标资源循环：交战距离→TTK→回弹，处决门槛三条
│  ├─ match_sim.gd                          抽象整局跑分：三画像 × N 种子的通关率/时长/受击分布
│  ├─ sim_rng.gd                            自写确定性 LCG（不依赖引擎 RNG）
│  └─ tests/                                GUT 测试：51 个 / 695 条断言
├─ addons/
│  ├─ JehenoAdvancedFirstPersonController/  移动控制器（MIT 模板，保留原目录名）
│  └─ gut/                                  GUT 9.7.1（MIT，含 LICENSE.md），只用 CLI
├─ assets/
│  ├─ ASSET_MANIFEST.md                     选定资产 + **实测尺寸与缩放**（必读）
│  ├─ models/{enemies,weapons,props}/       从 lab 库选出的 9 个 GLB
│  ├─ audio/{sfx,music}/                    10 个音效 + 3 首 BGM（CC-BY 4.0，需署名）
│  └─ textures/prototype/                   blockout 灰盒纹理
└─ tools/
   ├─ setup_inputmap.gd                     输入动作写入 project.godot（一次性，含战斗键位）
   ├─ verify_assets.gd                      资产验证：动画列表 + 包围盒尺寸
   ├─ build_arena.gd                        程序化生成关卡 + 光照 + 出怪点（改参数重跑即生效）
   ├─ smoke_battle.gd                       战斗闭环冒烟：真出怪、真开枪、真判死（20 条断言）
   ├─ sim_report.gd                         难度跑分表：三画像通关率/时长/受击分布
   └─ preview_waves.gd                      波次预览：多种子打印时长与编成（调难度用）
```

### 5.0 资产现状（2026-09-26）

- **敌人 4 型**：trooper（17 动画）/ swarm_drone（6 动画）来自 GLB 内置骨骼动画；
  charger（四足）与 heavy（机甲）无动画 → 走**程序化动画**（复用练习期 04 的分件 pivot 方法论）。
  **结论：不再需要外部动画库**，之前判定「缺动画」是因为没解析 glTF 的 `animations` 字段。
- **模型尺度不统一**（实测）：最高 19.31 m、最矮 0.59 m，相差 30 倍。
  每个模型必须按 `assets/ASSET_MANIFEST.md` 施加缩放后才能进场景。
- **关卡**：先用灰盒 blockout（prototype 纹理），通过验证后再用 Kenney Space Kit 做美术 pass。
  布局沿用练习期教训——**四角分离式高台，绝不围死中心**（敌人无寻路时环形高台=死图）。

- 素材集中放 lab 根 `assets/`，项目内只放「已选定使用」的副本或导入产物——
  避免每个项目复制一遍素材库。
- 验证入口：`node tools/verify.mjs 06`（依次跑 §5.1 的全部步骤并汇总 ERROR/WARNING 计数）。
  当前基线：**import PASS / load PASS / 41 测试 656 断言全绿 / 资产检查 PASS / 整局 11.8 分钟**。
- 「输入回放机器人」已按路线图 §4.3 改为 **bot 统计断言**（Godot 物理不保证逐帧复现）；
  画面验收必须**有窗口**跑（`--headless` 不出图，见 §4.4）。

### 5.1 已验证的命令（lab 根执行）

```bash
# 首选：一条命令跑完整套可自动化验证
node tools/verify.mjs 06

# 手工排查时的等价单步命令
GODOT=engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe
$GODOT --headless --path projects/06-mech-fps --import    # 资源导入
$GODOT --headless --path projects/06-mech-fps --quit      # 加载主场景后立即退出
$GODOT --headless --path projects/06-mech-fps -s res://tools/setup_inputmap.gd
$GODOT --headless --path projects/06-mech-fps -s res://tools/build_arena.gd
$GODOT --headless --path projects/06-mech-fps -s res://tools/preview_waves.gd -- --seeds=8
$GODOT --headless --path projects/06-mech-fps -s addons/gut/gut_cmdln.gd \
       -gdir=res://sim/tests -gexit                       # sim 断言，失败即 EXIT=1

# 亲眼看（headless 截不出图，手感与氛围只能在这里判定）
engines/godot/4.7.2/Godot_v4.7.2-stable_win64.exe --path projects/06-mech-fps
```

必须用 `_console` 后缀的版本，Standard 版不输出脚本报错到终端。

---

## 6. 本作的 DoD（在路线图 §0 之上追加）

| # | 验收项 | 状态 | 说明 |
|---|---|---|---|
| 1 | 移动手感通过人验：滑铲→墙跑→二段跳衔接流畅 | ⬜ **待制作人本人验** | 无法自动化（路线图 §4.5 已明确接受这一点） |
| 2 | 3 武器 × 3 敌型 × 1 关卡 × ≥5 波，从打开到结算完整可玩 | 🟡 代码通路已齐 | 4 敌型场景就绪、波次导演与结算已接；需实跑一局验证「能通关」并调出怪可读性 |
| 3 | 命中/击杀反馈链齐全（火光/曳光/标记/音效/震动） | ✅ 代码齐，**待你判定够不够「脆」** | 枪口焰 + FOV 顶格 + 曳光 + 命中粒子 + 命中标记 + 开火/击杀音 + trauma 震屏已接。顿帧(hitstop) 已实现但 `hitstop_enabled` **默认关**——它会动 `Engine.time_scale`，影响第三方控制器的状态计时，必须由你实跑后再决定开不开 |
| 4 | 素材 100% 登记 `assets/SOURCES.md` | ✅ | 含 GUT 与音乐；排除 CC-BY-SA 传染性授权项 |
| 5 | `--headless` 加载零报错 + sim 断言全绿 | ✅ | `node tools/verify.mjs 06` 当前全绿（41 测试 / 656 断言 + 冒烟 14 条） |

---

## 7. 实跑验收清单（只能由制作人本人判定）

### 7.1 第一轮打分（2026-09-27，制作人实跑 5 波至胜利）

| # | 验收项 | 结论 | 具体反馈 → 待办 |
|---|---|---|---|
| 1 | 移动手感 | ✅ **通过** | 「移动手感可以」——DoD 第 1 条达成，模板控制器不用动 |
| 2 | 反馈链是否「脆」 | ❌ 不合格 | ① 步枪不能连发（只响应按下）→ 任务 #12；② 曳光不从枪口出 → #13；③ 敌人死亡只是停住后消失、难判断 → #15；④ 命中效果一般 → #16 |
| 3 | viewmodel 持握 | ❌ 不合格 | 「有的枪械横在屏幕上」——GLB 各自的前向轴不同，必须按实测包围盒定向 → #13 |
| 4 | 敌人可读性 | ✅ 通过 | 「敌人可见」，出怪点不背刺 |
| 5 | 光照氛围 / 观感 | ❌ 不合格 | 「感觉只是一个实验场地盒子」→ 需要 Space Kit 美术 pass → #19 |
| 6 | HUD 排版 | 🟡 一般 | 信息层级与位置要重做 → #17 |
| 7 | BGM | 🟡 还行 → **但战斗内没声音** | 新增缺陷：战斗场景无音乐 → #18 |
| 8 | 命中顿帧要不要开 | ⛔ **不开** | 「不用」——`hitstop_enabled` 保持默认 false，后续不再纠结这条 |

补充缺陷（制作人未点名，但截图暴露）：**清波判定每帧重复触发**，导致携弹量涨到 5430
且下一波计时器被重复排布。已改为阶段机（`SPAWNING → INTERMISSION → …`）修复。

### 7.2 第二轮修复（2026-09-27，待制作人复验）

| 反馈 | 处理 | 验证方式 |
|---|---|---|
| 步枪不能连发 | `WeaponTable.fire_mode`（auto/pump/semi）+ 按住持续开火 | `test_fire_mode_roles` + 冒烟「按住 1 秒步枪 ≥4 发、霰弹 ≤2 发」 |
| 射线不从枪口出发 | 枪口点改为**运行时从 viewmodel 实际包围盒反算**，曳光与枪口焰都从它发出 | 冒烟断言枪口在相机前下方 0.25–1.4 m、与视线夹角够小 |
| 有的枪横在屏幕上 | 实测三把枪的枪管轴向（步枪 +Z、霰弹与精确射手 +X），按 `yaw 180/90/90` + 统一 0.62 m 长定向 | `tools/measure_viewmodels.gd` 输出即配置表 |
| 没有换弹动作 | viewmodel 下沉 0.14 m + 前倾 26° + 回位，时长与 `reload_time` 对齐；开火还有后顶回位 | 冒烟断言换弹后弹匣补齐、`reload_finished` 触发 |
| 敌人死亡只是停住后消失 | 有动画的（trooper/drone）播 Death 后仍下沉缩小；无动画的（charger/heavy）先倒地 76° 再下沉缩小；另加击杀爆点粒子 + 短促亮点 | 冒烟断言死亡后模型必须发生位移/缩放/倾倒之一 |
| 命中效果一般 | 受击闪白（`material_overlay`，不动共享材质）+ 命中粒子加大加亮 + 命中标记放大且击杀变红 X 停留更久 | 冒烟 28 条覆盖 |
| HUD 一般 | 重做：顶部波次进度含「剩余 N」、左下带底板血条（低血变红）、右下弹匣大字/备弹小字/低弹提示、底部击杀数与武器名、中央提示下移让开准星 | 代码搭 UI，控件与文本可被冒烟读取 |
| 感觉是实验场地盒子 | Kenney Space Kit 装饰层：142 件（壁板/立柱/管线/地标门/栏杆/控制台/储桶/角炮塔/发电机/天线/地面嵌板），**只贴墙与上高台，中央通路留空** | 冒烟断言装饰层零碰撞体、件数 >40 |
| 顿帧要不要开 | 按你说的**不开**，`hitstop_enabled` 默认 false | — |
| 战斗内没音乐 | **未做**（你说先放着）→ 任务 #18 | — |

装饰层用 Kenney 而非自己建模，符合硬约束 §0.2；它的 1 米网格与零碰撞体是实测确认的
（见 `assets/ASSET_MANIFEST.md` §2c）。

**下一轮顺序建议**：#13（枪朝向，影响所有观感）→ #12 连发 → #14 换弹动作 →
#15/#16 死亡与命中 → #18 音乐 → #17 HUD → #19 美术 pass。

### 7.3 启动方式与键位

启动（lab 根）：

```bash
engines/godot/4.7.2/Godot_v4.7.2-stable_win64.exe --path projects/06-mech-fps
```

键位：`WASD` 移动 · `Shift` 冲刺 · `Space` 跳（可二段）· `C` 滑铲/下蹲 · `Ctrl` dash ·
`Z` 墙跑相关视角 · `鼠标左键` 开火 · `右键` 近身处决 · `R` 换弹 · `1/2/3` 切枪 · `Esc` 释放鼠标。

请按这个顺序打分，前 3 项是 DoD 第 1 条的实质内容：

| # | 验什么 | 我（AI）无法替你判断的点 |
|---|---|---|
| 1 | 滑铲→墙跑→二段跳的衔接是否跟手 | 手感是时间与体感的函数，脚本只能证明「没崩」 |
| 2 | 开火三连：枪口焰/曳光/命中粒子/命中标记/音效是否**在同一瞬间**到位 | 反馈链的「脆」感靠毫秒级配合，自动化测不出 |
| 3 | viewmodel 的持握姿态、大小、是否穿墙 | 缩放按 ASSET_MANIFEST 设了，但**持握偏移是纯主观**，大概率要调 |
| 4 | 敌人是否可读：能不能一眼分辨蜂群/射手/重装，出怪点会不会背刺 | 布局留了中央通路，但压迫感只能实跑 |
| 5 | 光照氛围：雾/glow/天空盒配色是否够「科幻空间站」，灰盒观感能否接受 | 美术 pass 前，这是唯一的画面判定 |
| 6 | HUD 排版：血条/弹药/波次提示的位置与字号 | 我用代码搭的 UI 没有视觉确认过 |
| 7 | BGM 切换（开波战斗轨 / 清波紧张轨）是否突兀 | 淡入淡出参数是猜的 |
| 8 | **命中顿帧要不要开** | `scenes/player.tscn` 里选中 `CameraHolder/Camera/Shake`，勾上 `hitstop_enabled` 即开。它会缩放全局时间，模板控制器的 coyote time / jump buffer 全靠 delta，会不会让移动变「黏」只能你判断 |

发现问题的回报方式：直接说「第 3 项，枪太大 / 穿墙」这种可定位的描述即可，我会改数值或场景并重跑验证。

