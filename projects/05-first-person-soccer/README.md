# 05 方块足球 BLOCKBALL

第一人称足球（1v1 + 双方守门员）。复用 04 的 FPS 技术栈（Rapier + sim/render 严格分离 + 方块人 + 程序化音效 + Node bot 跑分），但把"战斗 AI"换成**多智能体为同一个球分工**——前锋要把球推进对方球门，守门员要守住自家球门。

先进 5 球者胜。全程零外部资产：球场 / 球门网 / 方块人 / 天空 / 全部音效均程序化生成。

## 栈

| 层 | 选型 | 版本 |
| --- | --- | --- |
| 渲染 | three.js (WebGL2) | 0.186.0 |
| 物理 | @dimforge/rapier3d-compat | 0.20.0 |
| 语言 | TypeScript strict + noUncheckedIndexedAccess | 7.0.2 |
| 构建 | Vite（Rolldown 打包器） | 8.3.0 |
| 音频 | WebAudio 现场合成 | 浏览器原生 |
| Node 验证 | `node --experimental-strip-types` | 22.22.x |

## 架构：sim / render 严格分离

```
src/
├── sim/        ← 零 three、零 DOM，Node 可直接跑（bot 跑分）
│   ├── pitch.ts        球场几何 + 球门网 + 围板 + inGoal 判定
│   ├── ball.ts         Rapier 动态球体（滚动阻力 / Magnus / 踢球锁定 / 碰撞事件）
│   ├── character.ts    KCC 角色控制器（玩家与 AI 共用）
│   ├── ai.ts           Striker（绕后/带球/射门/解卡）+ Keeper（跟球/出击/解围）
│   │                   + seekBehind（绕后寻路，AI 与 bot 共用）
│   ├── game.ts         GameSim 组装、step 顺序、进球/死球判定、事件流
│   ├── rng.ts          mulberry32 决定性 RNG
│   ├── types.ts        GameInput / ActorView / BallView / SimEvent（含 KickActor）
│   └── vecmath.ts
├── render/     ← 只读 sim 的 ActorView / BallView / 事件流
│   ├── scene.ts        SceneRig + 相机 + 光照 + 天空
│   ├── pitch.ts        球场渲染（草皮条纹 / 白线 / 球门网 / 围板）
│   ├── ball.ts         球体渲染
│   └── actors.ts       方块人渲染 + 走路摆臂 + 踢球抬腿
├── audio/synth.ts      AudioEngine（oscillator + noise buffer 合成）
├── ui/hud.ts           DOM HUD（比分 / 蓄力条 / 进球横幅）
├── core/config.ts      全部平衡数值（唯一调参入口）
└── main.ts             组装 + 固定步长循环 + window.__ball 验证接口
```

**铁律**：`src/sim/**` 不 import three、不碰 DOM。这让 Node 可以直接驱动 sim（`tools/bot-run.ts`），"AI 到底有没有威胁""比赛会不会卡死"用 bot 跑分做客观判定，而不是靠肉眼看画面。

## 运行

```bash
npm install
npm run dev              # http://127.0.0.1:5182（strictPort）
npm run typecheck        # tsc --noEmit
npm run bot              # bot 跑分 11 项断言（球物理 / 进球闭环 / AI 威胁 / 确定性 / 围板 / 端到端）
npm run trace -- bot 60  # 逐采样打印球与角色位置、bot 状态标志（调参诊断用）
npm run verify 9222 http://127.0.0.1:5182/ F:/Dev/Projects/game-lab/_tmp
                         # CDP 端到端验证（12 项断言）
npm run build            # 生产打包
npm run preview
```

## 控制

`WASD 移动 · Shift 疾跑 · 空格 跳跃 · 鼠标转视角 · 左键按住蓄力 · 松开踢球 · Esc 释放鼠标 · Enter 结算后重开`

无头环境下用 `window.__ball` 注入：`start / restart / setInput / setLook / clearInput / state / actors / ball / info / audioInfo / debugPlaceBall / debugKickBall`。

## 调参入口（`src/core/config.ts`）

最高频动到的项：

| 维度 | 字段 | 说明 |
| --- | --- | --- |
| 球感 | `ball.rollingResistance` / `magnus` / `restitution` / `friction` | 滚多远 / 弧线多弯 / 弹多高 / 地面多涩 |
| 球感 | `ball.kickLock` / `dribbleRange` / `dribbleDist` / `captureSpeed` | 射门不被吃 / 带球吸附手感 |
| 踢球 | `kick.chargeTime` / `minPower` / `maxPower` / `lift` | 蓄力时长与力量区间 |
| 前锋 | `ai.shootRange` / `holdKickTime` / `holdKickPower` | 多远起脚 / 卡住多久解卡 |
| 守门员 | `ai.keeperTrack` / `keeperDepth` / `keeperSpeed` / `keeperReach` / `keeperRush` | 门线覆盖几何（最敏感，见下） |
| 玩家 | `player.walkSpeed` / `sprintSpeed` / `kickRange` / `kickHalfAngle` | 手感与"隔空踢球"边界 |
| 场地 | `pitch.halfLength` / `halfWidth` / `goalWidth` / `goalHeight` | 场地与球门尺寸 |
| 规则 | `match.goalsToWin` / `deadBall*` | 胜负条件与三级死球兜底 |

## 验证基线（2026-09-25）

### Bot 跑分 11/11（Node 直跑 sim 层，零 DOM）

**A 球物理**
- A1 踢球立刻获得球速（20.0 m/s）
- A2 滚动阻力生效 —— 只测**纯滚动段**：踢出 20.0 → 滑行 0.7s 后 9.7 → 再 0.5s 8.7 m/s，减速 **2.05 m/s²**（配置 2.2）
- A3 无 NaN

**B 进球闭环**
- B1 球越过球门线触发进球（比分 +1）
- B2 进球后进入庆祝阶段（`phase=goal`）

**C AI 有威胁（闲置玩家）**
- C1 AI 能攻破闲置玩家的球门 —— 闲置 127s 后 **0:5**（AI 进 5 球）
- C2 比赛能终止（先到 N 球）—— `phase=lost`

**D 确定性**
- D1 同 seed 同输入 → 末态逐位一致

**E 围板有效**
- E1 球不会越过边线围板 —— 最大 `|z| = 14.49`（围板 15）

**F 端到端（会踢球的 bot 跑完整场）**
- F1 bot 至少能打进 1 球 —— seed 1/2/3 各进 5 球
- F2 每场都能终止 —— 3 场全部 `5:3 phase=won t=56s`
- `[数据]` bot 胜 3/3 场（**不作断言**：AI 强度属调参范围，不是正确性）

### CDP 端到端 12/12（无头 Chrome + SwiftShader）

**环境说明**：真 GPU 路径（`--use-angle=gl`）在无头环境不稳定，改用 `--use-gl=angle --use-angle=swiftshader` 软件渲染。我们只断言 draw call / 三角面数等**计数型**指标（不依赖渲染器速度），所以对结论有效性无影响——只是不能拿来谈帧率。

- R0 页面加载并暴露 `__ball` 接口
- R2 WebGL2 可用（ANGLE / Vulkan / SwiftShader）
- R3 开始后进入 `playing` 且时间推进
- R4 球与方块人存在（ball + 3 actors）
- R5 注入前进 → 位移 Δ = 10.26m
- R6 蓄力松开 → 球速 7.7 m/s
- R6b 音效硬指标：AudioContext running、事件计数 13→15
- R7 球进对方球门 → 比分 0→1
- R10 方块人视图（striker + keeper × 2）
- R9 drawCalls=39 / triangles=1804 / programs=9
- R11 截图 138KB（>25KB 阈值）
- R1 全程零运行时报错

## 关键设计选择

1. **Rapier 缺的三件事，全部手动补**：Rapier 0.20 不模拟（a）滚动阻力、（b）Magnus 弧线、（c）恢复系数按球与面**取平均**（不是取大）。所以 `ball.applyForces()` 手动施加常量减速度 `F = -c·v` 与 `F = K·(ω×v)`，且球与地面/墙的 restitution 都要设高弹性，否则平均下来弹不起来。

2. **"球在滚"其实是"球在滑"** —— 本项目最反直觉的一条。`kickSpin = 22` 只给了 ω=22 rad/s，而纯滚动要求 `ω = v/r ≈ 91 rad/s`（v=20、r=0.22）。所以踢出后球先**滑动**约 0.6s（滑动摩擦 `μ·g = 0.55×22 ≈ 12.1 m/s²` 主导，实测滑移量 |−ω_z·r − v_x| 从 15.11 降到 0.68），之后才进入纯滚动（只剩 `rollingResistance = 2.2 m/s²`）。
   **后果**：A2 断言最初测到 15.23 m/s²，看起来像"配置写错了"，其实是测在滑动段。正确做法是**跳过前 0.7s，只测纯滚动段**——改完测得 2.05 m/s²，与配置吻合。

3. **踢球方向在玩家与 AI 之间是不对称的**：玩家踢球方向 = **朝向 yaw**；AI 踢球方向 = 由**球→目标**算出（与站位无关）。所以**玩家必须绕到球的进攻侧后方**（"面朝目标推进"才等于"把球推向目标"，否则像踩香蕉皮一样把球踢反），而 AI 前锋不必。
   `seekBehind()` 就是给玩家 bot 用的绕后寻路；AI 前锋用它只是为了**别用自己的身体把球顶向反方向**。

4. **`kickLock = 0.3s`：射门会被自己的带球辅助吃掉**。`dribbleAssist` 每帧把球拉向脚前，它的跳过门槛是 `captureSpeed = 14`，而前锋射门力度 = `9 + 距离×0.6`（11~15）——刚好在门槛之下，于是**球刚踢出就被拉回脚前**。实测 15 次踢球里 11 次被吃（15.6→8.46、12.4→4.95、11.1→3.84），"射门"全部退化成慢速带球。修复：`kick()` 时置锁定计时，锁定窗口内整段跳过 `dribbleAssist`。

5. **绕后不能走直线**：直线奔向"球后方站位点"必然**穿过球的位置**，而 KCC 开了 `setApplyImpulsesToDynamicBodies(true)`，角色身体会把球顶走——实测前锋一边"绕后"一边把球顶进自家角旗区。
   修复用了两层：① 路径到球的**垂距** < 1.0m 时改走切向航点，沿弧线绕过；② 绕后点落在场外时进入 `fallback` 退化模式（直接逼近球 + 朝目标开出）。
   **不能用固定距离阈值**：实测阈值 3.2 时 bot 恰好在 3.27m 处走直线穿球，全场 0 次踢球。垂距才是正确判据。

6. **推进态用迟滞状态机，不用瞬时判定**。判据是"**侧别 + 距离**"（`aligned && dBall < 1.5`）而不是"到达某个点"——绕后点会随球移动，追一个会跑的点会让角色永远进不了推进态。进入推进后直到 `dBall > controlRange×1.6` 才退出，避免两状态每帧翻转导致原地振荡。

7. **守门员是纯几何问题**，五个参数互相耦合，最敏感：
   - `keeperTrack = 2.6` 必须**明显小于**球门半宽 3.5；
   - `keeperReach = 0.95` 必须**独立于** `controlRange = 1.7`（实测用 1.7 时"跟球 0.55 + 解围 1.7" = 3.57 ≥ 3.5，几何上封死整条门线，双方 240s 都进不了球）；
   - `keeperSpeed = 3.2` 必须**明显慢于**前锋 5.9 —— 这个速度差正是"挡得住带球、挡不住远角射门"的来源：慢速带球时守门员有 1s+ 横移到位；快速远角射门时球 0.5s 就到位，守门员只能横移 ~1.7m，够不到远角。
   - `keeperRush = 3.0` 必须存在：否则球滚到门线死角停下后，按门线站位 + 小解围半径永远够不到（实测球停在 (21.8, −3.3)，守门员距离 2.2 > 1.7，静止 18 秒）。

8. **死球三级兜底**（M1 规则简化，真实足球用界外球/球门球）。每一级都是被实测卡死逼出来的：
   - 一级 · 常规死球：球速 < 0.35 持续 4s **且**所有角色离球 > 3m → 中圈开球。两个条件缺一不可，只看"球静止"会把"玩家停在球前蓄力"误判成死球。**实测球滚到边线死角 (21.5, −14.5) 后双方都够不到，静止 22 秒。**
   - 二级 · 前锋解卡：推进态 + 球在脚下 + 球几乎不动，累积到 `holdKickTime = 1.4s` → 直接把球朝球门开一脚（`holdKickPower = 16`）。正常带球时球速 ≈ 5.9 m/s，条件不成立、计时归零，不会误触发。
   - 三级 · 硬死球：球速极低持续 `deadBallHardTime = 12s` → **无条件**重新开球。**实测死锁场景**：闲置玩家恰好卡在球与前锋之间，两者互相顶住，球停在 (−8.6, −0.4) 静止 150 秒（t=72.8s → 222.8s），而玩家始终在 clearRadius 内，一级判据永远不成立。

9. **球门网侧壁中心必须放在 `goalWidth + thickness`**，不是 `goalWidth`。第一版侧网中心放在 `gw` 且半厚 `t`，内壁落在 `gw − t = 3.2`，**侵入球门内部 0.3m**——球打到"看不见的墙"上，大量射门停在 `x ≈ −21.8, |z| ≈ 3.0~3.1`（门柱内侧）。修复后射门角度同时收窄到 ±2.9（球半径 0.22，贴柱射门稍有偏差就蹭网）。

10. **Rapier 碰撞事件必须显式开启**：`ColliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)`，否则 `drainCollisionEvents` 永远是空的。本轮踩到过"弹跳计数恒为 0"，就是这个原因。

11. **确定性**：固定步长 1/60 + mulberry32 种子 + AI 无随机数 → 同 seed 同输入末态逐位一致（D1 断言）。这是 bot 跑分可复现的前提。

## 已知限制 / 后续

- **规则是 M1 简化版**：无界外球 / 角球 / 球门球 / 越位 / 犯规 / 任意球。这些位置全部由三级死球兜底接管——能用，但不是足球。
- 无体力 / 换人 / 战术阵型；双方各只有 1 名场上球员 + 1 名守门员。
- 方块人无上半身动画（只有走路摆臂 + 踢球抬腿），不区分左右脚。
- **bot 胜率 3/3 不作为断言**：AI 强度属调参范围，跑分只保证"踢球闭环成立 + 比赛能终止 + 确定性"，不保证"AI 应该赢几场"。
- **CDP 环境限制**：无头下用 SwiftShader 软件渲染，结论只断言计数型指标（draw call / 三角面 / 位移 / 比分），**帧率相关结论无效**。
- 音效全在合成层，缺独立 bus 与响度归一；球撞围板连续弹跳时可能削波。
- 无 PointerLock 时只能拖拽视角，CDP 注入走 `setLook`。

## 与 04 的复用与差异

| 维度 | 04 火线 FIREROUND | 05 方块足球 BLOCKBALL |
| --- | --- | --- |
| 核心交互 | 射击命中判定（射线） | 球的多体物理（滚动/滑动/旋转/弧线） |
| AI 目标 | 最近敌队成员 | **同一个球**（前锋抢、守门员守） |
| AI 难点 | LOS 推进 + 切线绕行 | 绕后站位 + 避免身体顶球 + 守门员覆盖几何 |
| 复用 | sim/render 分离、KCC、方块人、程序化音效、bot 跑分框架、CDP 验证框架 | 同左 |
| 新增 | — | 球物理三件手动补、踢球方向不对称、kickLock、死球三级兜底 |

## 目录约定

- `index.html` 入口（start / 结算面板 + HUD 容器）
- `vite.config.ts` 端口 5182、rapier3d-compat 排除 optimizeDeps（内联 WASM，预构建会处理坏 base64）
- `tsconfig.json` strict + noUncheckedIndexedAccess + verbatimModuleSyntax
- `tools/node-ts-register.mjs` 让 `node --experimental-strip-types` 能解析 `.ts` 路径别名
- `tools/bot-policy.ts` **bot 策略单一来源**，`bot-run.ts` 与 `trace.ts` 共用，避免两边逻辑漂移
- `_tmp/` 截图与日志（gitignored）

---

_本 README 与 `F:/Dev/Projects/game-lab/docs/05-选型-第一人称足球.md` 配套阅读：选型文档讲"为什么做"，本文讲"做出来是什么"。_
