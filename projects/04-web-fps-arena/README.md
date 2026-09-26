# 04 火线 FIREROUND

第一人称竞技场射击（FPS）。5 波 57 敌（步兵 / 冲锋兵 / 狙击手 / 精英），**5 把武器**（手枪 / 步枪 / 霰弹 / 冲锋枪 SMG / 精确射手步枪 DMR），**5 张预设地图**（枢纽 / 十字 / 高台 / 长廊 / 工地），分件机兵 + 走路摆臂动画，全程程序化资源 + 程序化音效。**双模式**：生存（单人清 5 波）/ 据点占领（蓝队玩家 + 4 友军 bot vs 红队 5 bot 抢中央据点）。

**2026-09-25 晚 · 整合升级**（吸收 04_1 frontline-cq 与 04_2 arena-3v3 后原项目废弃）：
- **右键 ADS 开镜**（FOV 78→56 平滑过渡、散布 ×0.38、灵敏度 ×0.62、移速 ×0.62、疾跑自动解除）——移植自 04_1
- **敌人模型升级**：头盔 + 战术背心 + 步兵/精英持枪、冲锋兵近战刃——造型借鉴 04_1/04_2
- **小地图 + 击杀信息流**——移植自 04_2
- **第 5 张地图「工地」**：集装箱双排夹道 + 中央广场，布局借鉴 04_1 的工地关卡
- **AI v2（仅据点模式）**：sim 层自写轻量行为树（`sim/ai/bt.ts`）+ 掩体寻找（`sim/ai/cover.ts`，被压制时找「敌人看不见的最近掩体点」）+ 反应延迟（目标连续可见 0.28s 才起手）——借鉴 04_1 的拟人化 AI
- **渲染管线升级**：ACES tone mapping + PCFSoft 阴影（2048 shadow map）+ UnrealBloom 后处理（曳光/火光/面罩泛光）

## 栈

| 层 | 选型 | 版本 |
| --- | --- | --- |
| 渲染 | three.js (WebGL2) + EffectComposer（ACES + PCFSoft 阴影 + UnrealBloom） | 0.186.0 |
| 物理 | @dimforge/rapier3d-compat | 0.20.0 |
| 语言 | TypeScript strict + noUncheckedIndexedAccess | 7.0.2 |
| 构建 | Vite（Rolldown 打包器） | 8.3.0 |
| 音频 | WebAudio 现场合成 | 浏览器原生 |
| Node 验证 | `node --experimental-strip-types` | 22.22.x |

零外部资产：敌人几何 / 武器几何 / 天空 / 地面纹理 / 全部音效均程序化生成。

## 架构：sim / render 严格分离

```
src/
├── sim/        ← 零 three、零 DOM，Node 可直接跑（bot 跑分）
│   ├── ai/             AI v2：bt.ts（轻量行为树，勿用参数属性——strip-types 不支持）
│   │                   cover.ts（掩体点自动采样，纯函数零随机）
│   ├── arena.ts        静态掩体 + 出生点（含第 5 图「工地」）
│   ├── types.ts        Team / CombatantRef / 事件 / 快照 等共享类型
│   ├── combatant.ts    战斗员 AI（敌人 + 友军统一；v1 生存路径 + v2 据点路径）
│   ├── game.ts         GameSim 组装、step 顺序、胜负、双模式（生存 / 据点）
│   ├── player.ts       KCC 玩家（coyote time、grounded、ADS 减速）
│   ├── rng.ts          mulberry32 决定性 RNG
│   ├── shooting.ts     castRay（Rapier 0.20 timeOfImpact）
│   ├── waves.ts        WaveDirector（分批、波间喘息、推进）
│   ├── weapons.ts      WeaponSystem（后坐力、散布、换弹、ADS 散布乘区）
│   └── vecmath.ts
├── render/     ← 只读 sim 的 EnemyView / GameSnapshot / 事件流
│   ├── scene.ts        SceneRig + 相机 PointLight + ACES/阴影/bloom 后处理链
│   ├── arena.ts        程序化掩体渲染 + 警戒条纹（castShadow/receiveShadow）
│   ├── actors.ts       EnemyRenderer + ViewModel（Lambert + emissive；头盔/背心/持枪）
│   └── fx.ts           曳光 + 粒子对象池
├── audio/synth.ts      AudioEngine（oscillator + noise buffer 合成）
├── ui/hud.ts           DOM HUD（准星 = 真实散布；小地图 + 击杀信息流）
├── core/config.ts      全部平衡数值（唯一调参入口；player.ads / ai 为新增段）
└── main.ts             组装 + 固定步长循环 + ADS FOV 过渡 + window.__fps 验证接口
```

**铁律**：`src/sim/**` 不 import three、不碰 DOM。这让 Node 可以直接驱动 sim（`tools/bot-run.ts`），平衡数值用 bot 跑分做客观判定，而不是靠肉眼看画面。

## 运行

```bash
npm install
npm run dev              # http://127.0.0.1:5181（strictPort）
npm run typecheck        # tsc --noEmit
npm run bot              # 生存模式 bot 跑分：perfect / human / 决定性 / 静止必死（13 项断言）
npm run bot:dom          # 据点占领(5v5) bot 跑分：蓝队可胜 / 无 NaN / 时长 / 占点 / 决定性（5 项）
npm run verify 9222 http://127.0.0.1:5181/ F:/Dev/Projects/game-lab/_tmp
                         # CDP 端到端验证（13 项断言）
npm run build            # 生产打包
npm run preview
```

## 控制

`鼠标转视角 · 左键开火 · 右键开镜（ADS）· R 换弹 · 1/2/3 切枪 · Shift 疾跑 · Esc 释放鼠标`

无头环境下用 `window.__fps` 注入：`setInput / setLook / start / state / enemies / info / audioInfo / fxInfo / restart`。

## 调参入口（`src/core/config.ts`）

最高频动到的项：

| 维度 | 字段 | 说明 |
| --- | --- | --- |
| 节奏 | `wave.maxAlive` / `batchSize` / `batchInterval` | 同时被几个人打 / 涌入节奏 |
| 节奏 | `wave.breakTime` / `player.waveHealRatio` | 波间喘息 / 补给比例 |
| 内容 | `waves`（5 波敌人组成） | 当前 `[4,0,0,0]/[4,3,0,0]/[5,4,2,0]/[6,5,3,0]/[8,6,4,3]` = 57 |
| 输出 | `weapons[].damage / range / spread / magazine / reloadTime / pellets` | 三把武器手感 |
| 敌人 | `enemies.{grunt,rusher,sniper}.{hp,speed,fireRate,range,standoff}` | 三种敌人强度曲线 |
| 视觉 | `camera.fov / shakeDecay`、灯光强度、雾 `near/far` | 氛围 |

## 验证基线（2026-09-25，含 5 武器 / 4 地图 / 模型升级）

### Bot 跑分 13/13（Node 直跑 sim 层，零 DOM）

**A–E 原始 9 项（与 09-24 基线完全可比，未改动 bot 基础行为）**：
- A1 perfect bot 100% 通关 × 5 轮（105–123s）
- A2 无 NaN / 无无限循环
- A3 总击杀 == 57（决定性）
- B1 human bot（jitter 0.045rad / 反应 0.28s）通关率 40%
- B2 human bot 命中率 55–69%（在 40–85% 区间内）
- B3 human bot 至少打到 wave 5
- C1 clear time 100–360s（实测 105–123s）
- D1 同种子 → 同结果（决定性 RNG）
- E1 静止 bot 必死于压力

**F 地图矩阵**（新增；防"新图是死图"）：
- F1 4 张地图（枢纽 108.6s / 十字 101.7s / 高台 129.5s / 长廊 157.7s）全部可通关
- F2 全地图无 NaN
- **踩过一次坑（已修）**：高台图第一版把中央做成环形高台只留小角缺口，敌人没有寻路（只有「朝玩家推进 + 切线绕行」），永远绕不进小口，实测卡死 480s / 21 杀。改成四角分离式 + 中途掩体后正常。

**G 武器矩阵**（新增；防"新武器是装饰品"）：
- G1 5 把武器全部能击杀（≥4 杀 = 清完第 1 波）。无"完全打不动人"的废枪。
- G2 至少 2 把武器能独立通关（RIFLE、SMG）。
- ⚠️ **这个矩阵的已知混淆**：driveBot 的移动策略是「d>13 前进贴近、d<5 后撤」，与武器无关——所以 DMR（射程 120）也被迫压到 13m 打，拿霰弹反而如鱼得水。**这里的 solo 成绩是「一律贴脸时哪把枪能撑住」，不是武器强弱判决**。故意不改成「按射程保持距离」——那会改动 bot 基础行为，破坏 A–E 与历史基线可比性。

### 5v5 据点占领模式（domination，2026-09-25 加）

在生存模式之外新增第二种玩法：蓝队（玩家 bot + 4 友军 bot）vs 红队 5 个 bot，抢中央据点——占满 +100 或团灭红队胜；被红队占满 −100 或玩家阵亡负。`GameSim.create(seed, mapId, mode)` 的第三参切换模式，红队在两个模式下共用同一套 `Combatant` AI。

- D1 蓝队能获胜（占点满或团灭红队）：5/5 种子全部 won
- D2 无 NaN
- D3 单局时长 < 10 分钟（未死锁）：最长 20s
- D4 蓝队确实在推进据点（至少一局 capture 越过 +30）：峰值 64
- D5 同种子两次结果一致（决定性）

**⚠️ 架构约束（踩坑得来，必须守住）**：`Combatant` 由旧 `Enemy` 泛化，但**红队在生存模式下的行为必须与旧 `Enemy` 逐帧等价**——否则会无声破坏 A–G 生存基线（baseline 可比是硬指标）。本轮实测犯过两个回归，均已修复：

1. **侧移向量转置错**：旧 `Enemy` 侧移是「朝目标方向旋转 90°」（即 `(-gz, gx)`），泛化时误写成镜像 `(−gx, gz)`，敌人变成斜着后退而非横移，交战距离数学全乱。
2. **生存模式误启用队伍 LOS 过滤**：给所有模式都加了 `filterPredicate`（同队互不作为射线/视线遮挡），旧版生存红队是**没有**这个过滤的——结果红队能隔着队友打玩家，难度暴涨。完美 bot 在「高台」图 wave 3 暴毙，霰弹 / DMR 直接 0 杀。

**修复**：生存模式 `filterPredicate` 置 `undefined`（与旧版逐帧等价），**仅据点模式**启用队伍过滤（友军不挡视线、不互伤）。修复后生存 bot 回到 **13/13**，据点 bot 仍 5/5。

### CDP 端到端 16/16（无头 Chrome + SwiftShader）

**环境说明**：真 GPU 路径（`--use-angle=gl`）在本轮环境报 `BindToCurrentSequence failed`，改用 `--use-gl=angle --use-angle=swiftshader` 软件渲染。我们只断言 draw call / 三角面数等**计数型**指标（不依赖渲染器速度），所以对结论有效性无影响——只是不能拿来谈帧率。

- R0 加载并暴露 `__fps`
- R2 WebGL2 可用（ANGLE / Vulkan / SwiftShader）
- R3 进入 `playing` 且时间推进（**只断 `time > 0`**，不卡绝对秒数——软件渲染下墙钟与 sim 时间差一个量级）
- R4 敌人按波次生成（场上 4 个）
- R5 注入前进 → 位移 Δ = 5.76m
- R6 开火 → 弹药 12→11、shots 0→1
- R7 命中 → hits +1、特效峰值 16
- R8 换弹 → 弹匣补满 12/12
- R9 drawCalls=41 / triangles=2594 / programs=10（vs 旧版 30 / 3110：drawCall 因敌人分件模型增加）
- R10 AudioContext running、事件计数 10→12、last=shot
- R11 截图 444KB（>25KB 阈值）
- **R12** 武器槽位与 config 一致：`pistol,rifle,shotgun,smg,dmr`
- **R13** 切到 DMR 后能开火：weapon=dmr 弹药 10→9
- **R14** 敌人视图可用（模型升级后 sim 接口未变）
- R1 零运行时报错

## 整合升级验证基线（2026-09-25 晚，吸收 04_1 / 04_2 后）

### 生存 bot 跑分 13/13（零回归）

- A–G 全部通过，且关键数值与历史基线**逐项一致**（枢纽 108.6s / 十字 101.7s / 高台 129.5s / 长廊 157.7s，SMG 通关 106.4s，DMR 单枪 8 杀）——证明生存模式红队与旧版逐帧等价，AI v2 与移植件零侵入。
- **F 矩阵扩到 5 图**：新增「工地」完美 bot 通关 120.9s / 57 杀，无 NaN。

### 据点 bot 跑分 5/5（AI v2 生效）

- D1–D5 全部通过。行为树（被压制找掩体）+ 反应延迟下，bot 交火时长从 ~20s 拉长到 ~53s——反应时间与掩体让 bot 交火有来有回，不再互秒；D4 占点峰值 89，蓝队仍稳定获胜。
- ⚠️ **代价声明**：据点模式的 bot 行为不再与旧版可比（这是本次升级的目的）；生存模式保持逐帧等价。

### CDP 端到端 18/18

- 原 R0–R14 全过，新增 **R15**（ADS：注入 ads → 状态生效、散布 0.0006→0.0002）与 **R16**（小地图 + killfeed 挂载）。
- R9 渲染统计：**drawCalls=97 / triangles=5894 / programs=31**（vs 整合前 41 / 2594 / 10）——增量来自敌人新模型件、阴影 pass 与 bloom 后处理，仍远低于 04_1 实测的 100 / 3140 预算线（且那是在 RTX 4060 硬件 GPU 上）。
- R13/R8 的固定 sleep 改为轮询：无头 SwiftShader 下墙钟与 sim 时间差一个量级，固定等待会 flaky（实测复现过 R8 半程快照 10/12、R13 一发未出）。
- 环境坑：给 dev server 新增 `three/addons` 依赖后，vite 首次 dep optimize 会触发整页刷新——必须在页面稳定后再跑 verify，否则 R3 读到的是刷新后未 start 的新实例。

---

## 关键设计选择

1. **后坐力叠加到视线**：`dirFromAngles(yaw+recoilYaw, pitch+recoilPitch)`，枪口跳到哪子弹飞到哪，避免「枪口飞但子弹直」的违和。
2. **视线检测 = 真实射线**：Rapier 0.20 字段是 `timeOfImpact`（不是旧 0.11 的 `toi`）；必须排除自身 collider（眼睛在胶囊内会 t=0 自击）。`hasLineOfSight(targetHandle)` 比较 `hit.colliderHandle === targetHandle`，否则射线终点在目标内部会先击中表面。
3. **敌人导航不用 navmesh**：LOS-优先推进 + 切线绕行（`blockedTimer`/`detourTimer`：实测 <45% 期望速度 >0.25s 触发 1.3s 切线）。3m 内 `pointBlank` 豁免 LOS 避免贴脸死锁。
4. **尸体立刻移除**：`cleanup()` 在 `world.step()` 后立即 remove 死亡体的 collider/rigidbody，尸体不当掩体；渲染层用 `EnemyView.lastPos` 播消散动画。
5. **viewmodel 可见性**：MeshStandardMaterial 暗光下变纯黑剪影。改用 MeshLambertMaterial + emissive + 相机自带 PointLight，任何光照下都看得到手中武器。
6. **准星 = 真实散布**：`gap = spread / halfFov * height/2`，玩家看到的臂张角 = 子弹真实散布。手感因此可测而非「看起来像」。
7. **程序化音效为硬指标**：01/02/03 全缺音效，是 lab 最大系统性缺口。04 全部 SFX（shot 三种音色、hit、headshot、kill、reload、empty、hurt、enemyShot、waveStart、win、lose、footstep、swap）用 oscillator + noise buffer 现场合成。
8. **多地图 = 预设布局，不是随机生成**：随机布局会让 bot 跑分每次跑在不同地图上，结果不可比（验证体系直接失效）。所以 4 张地图都是手工定义的几何，预编译在 `src/sim/arena.ts` 的 `MAPS` 数组里。换图走 `GameSim.create(seed, mapId)` + `disposeArena + buildArena` 重建。**踩过的坑**：高台第一版做成环形高台只留小角缺口，敌人没有寻路 → 卡死；改成四角分离式 + 中途掩体后正常——「不能围死中心」是地图设计的硬约束。
9. **武器完全 data-driven**：`WeaponSystem.slots = CONFIG.weapons.map(...)`，加武器只改 config + actors 的几何分支 + HUD 槽位（用 `CONFIG.weapons.length` 动态生成）+ 按键 1–5（动态循环）；不动主循环。槽位按键也用 `for (let i=0; i<CONFIG.weapons.length; i++)` 而非硬编码 if/elseif。
10. **敌人模型分件 + 走路摆臂**：躯干 + 头 + 双臂 + 双腿 + 肩甲，每根四肢挂在自己的 pivot Group 上（pivot 在肩/髋，mesh 在 pivot 内部向下偏移半个长度），转 pivot 就是摆臂摆腿。**相位由真实位移驱动**（`phase += speed * dt * 2.4`），站定不摆、跑起来摆幅大——不是凭空播动画。三种敌人 + 精英做剪影差异化：冲锋兵前倾+腿长、狙击手扛长枪管、精英胸口装甲板。
11. **队伍泛化与「生存基线零回归」**：`Combatant` 把旧 `Enemy` 升级为「敌人 + 友军统一 AI」，目标从「玩家」变成「最近敌队 `CombatantRef`」，用 `filterPredicate` 做队伍过滤射击。但**生存模式的红队行为必须与旧 `Enemy` 逐帧等价**——这是验证体系可比性的硬前提。所有针对 `Combatant` 的移动 / LOS / 射线改动，都必须先在生存 bot（13/13）上验证不回归，再做据点专属行为。
12. **AI v2 按模式门控，不按开关**：行为树 / 掩体寻找 / 反应延迟全部挂在 `ctx.aiV2`（= domination）分支下，survival 的代码路径与旧版完全一致——不是「同一套代码加开关」，而是「新路径只在新模式存在」。v2 的所有新状态（seeTimer / hurtAge / coverTarget）在 v1 路径下保持初值、零读写。未来若想让生存敌人也用 v2，必须先重跑并重定 A–G 基线数值。
13. **后处理链的主渲染收口**：EffectComposer 接管 `render()` 后，tone mapping 由 OutputPass 统一执行；`info()` 仍直跑 `renderer.render` 以拿到纯净的 draw call 计数（不含 bloom pass 的中间 target 绘制）。MSAA 走 WebGLRenderTarget 的 `samples: 4`（composer 会丢弃 canvas 级 MSAA）。

## 已知限制 / 后续


- viewmodel 仍偏几何化（盒 + 圆柱），要更精致需手部 / 武器贴图（违反零资产原则）。
- 精英仅在第 5 波出现 3 只，强度未充分压力测。
- 曳光池 MAX 64、粒子池 MAX 500，极端长持续战斗可能截断（实战未观察到）。
- HUD「场上 N · 剩余 M」中 M = alive + queue + future = total − killed，语义与英语 remaining 略有偏差（截图：场上 3 剩余 56 = 57 − 1 击杀，已验证正确）。
- 音效混音全在合成层，缺独立 bus 与响度归一，多敌人同时开火有削波风险。
- 无 PointerLock 时只能拖拽视角（拖拽 fallback），CDP 注入走 `setLook`。
- **武器矩阵的已知 bot 行为混淆**：driveBot 一律 d>13 前进贴近、d<5 后撤，所以远距离武器（DMR）在矩阵里成绩被低估、近战武器（霰弹）被高估。要更公平的武器矩阵得让 bot 按武器射程保持交战距离——但那会破坏 A–E 与历史基线的可比性，故未做。
- **地图设计的硬约束**：敌人没有寻路，**任何把中心围死的布局都会卡死**——这是 bot 实测反复验证出来的，不是推断。
- **CDP 环境限制**：本轮无头下真 GPU 路径（`--use-angle=gl`）报 `BindToCurrentSequence failed`，改用 SwiftShader 软件渲染。结论只断言计数型指标，断言阈值为环境兼容（`time > 0`、位移 `>0.3m`、切枪等待加长到 2500ms）。帧率相关结论无效。

## 与已删除旧 04 的四项差异

1. M1 即包含反馈（曳光 / 受击闪白 / 面罩预警），不只是技术骨架
2. 音效为硬交付项（01/02/03 都缺）
3. M1 即有敌人威胁（首批 4 个会真打过来 → HP 测试中降到 55/100）
4. 直接做完整游戏再测，不做最小可行实验切片

## 目录约定

- `index.html` 入口（start / again 面板 + HUD 容器）
- `vite.config.ts` 端口 5181、rapier3d-compat 排除 optimizeDeps
- `tsconfig.json` strict + noUncheckedIndexedAccess + verbatimModuleSyntax
- `tools/node-ts-register.mjs` 让 `node --experimental-strip-types` 能解析 `.ts` 路径别名
- `_tmp/` 截图与日志（gitignored）

---

_本 README 与 `F:/Dev/Projects/game-lab/docs/04-选型-第一人称FPS.md` 配套阅读：选型文档讲「为什么做」，本文讲「做出来是什么」。_