# 043 运输船 TRANSPORT WEB — 第一人称竞技射击

以 **043 cf-transport-ship** 的内容资产为主体、**04-web-fps-arena** 的工程架构为底座的融合版本。
043 的经典运输船布局、5 把武器、第一人称枪械/双手建模、人物装备细节全部移植到 04 的
sim/render 分离架构上；枪械音效按 **04_1 frontline-cq** 的配方合成。

## 技术栈

| 层 | 技术 |
|---|---|
| 渲染 | three.js **0.186**（模块化，非 043 的 r149 UMD）+ ACES tone mapping + PCFSoft 阴影 + UnrealBloom + MSAA×4 |
| 物理 | Rapier 0.20（KCC 角色控制器；旋转盒碰撞体 = 043 的 OBB 世界在 Rapier 上的等价物） |
| 语言/构建 | TypeScript + vite（043 原版是无类型全局命名空间） |
| AI | 行为树 + 掩体采样（04）+ **导航网格 BFS 寻路（043 移植）** |
| 音效 | WebAudio 全程序化合成（04_1 配方：噪声爆裂 + 低频冲击 + pitch 抖动 + 远/近分层） |

## 架构

```
src/
  core/config.ts        全局参数 + 043 武器数据表（ak47/m4a1/awm/mp5/deagle）
  sim/                  ★ 零 three / 零 DOM，Node 可直跑（bot 跑分的基础）
    arena.ts            地图：运输船（043 map.js 移植，含旋转集装箱）+ 枢纽 + 工地
    ai/nav.ts           导航网格：可站立面采样 + 连边（平/跳/落）+ 连通块 + BFS（043 移植）
    ai/cover.ts         掩体点自动采样（yaw 感知）
    ai/bt.ts            行为树（BtSelector/BtSequence/BtCondition/BtAction）
    combatant.ts        战斗员 AI：交战距离数学 + 路径跟随 + 卡死软复位（043 移植）
    game.ts             GameSim：固定步长装配 + 模式调度
    player.ts           KCC 第一人称控制器（土狼时间/空中衰减/ADS 减速）
    weapons.ts          武器状态机（切枪/换弹/散布/后坐力；AWM 武器级开镜参数）
  render/               three 渲染（只读 sim 快照）
    arena.ts            甲板/集装箱涂装/吊车/管道外观（全程序化纹理）
    actors.ts           043 风格士兵（带檐头盔/头带/背心弹匣包/持枪）+ 5 枪 viewmodel + 双手
    scene.ts            光照/天空/雾/后处理
    fx.ts               曳光/火花
  audio/synth.ts        04_1 配方枪声 + 三段换弹 + 远/近分层
  ui/hud.ts             准星=真实散布 / 小地图（旋转盒）/ 击杀信息流
tools/
  bot-run.ts            生存模式 bot 基线（A–G 共 13 断言）
  bot-run-dom.ts        据点占领 bot 基线（D1–D5）
  verify-render.mjs     CDP 无头端到端验证（R0–R16 + DOM 检查）
```

## 操作

WASD 移动 · Shift 疾跑 · 空格跳 · 左键开火 · 右键开镜 · R 换弹 ·
1–6 切枪（AK-47 / M4A1 / AWM / MP5 / 沙漠之鹰 / 破片手雷）· Esc 释放鼠标

## 运行

```bash
npm install
npm run dev        # 开发
npm run build      # 生产构建
npm run typecheck  # tsc --noEmit
npm run bot        # 生存 bot 基线
npm run bot:dom    # 据点 bot 基线
npm run test:grenade  # 手雷 sim 层验证（弹跳/引信/自伤）
npm run verify     # CDP 端到端（需先起 dev server + 无头 Chrome 9222）
```

## 与三个来源的取舍记录

- **从 043 移植**：运输船完整布局（V 形箱 / 二楼箱顶 / 木箱塔 / 驾驶舱 / 出生舱门洞）；
  5 武器数值（rpm→interval、rangeFull/far→falloff 映射）；nav 网格 + BFS 寻路；
  卡死软复位（净位移判定 → 眨移最近导航节点）；人物装备细节；viewmodel 动画三段式。
- **从 04 保留**：sim/render 分离 + 确定性 RNG + 固定步长；Rapier KCC；行为树 + 掩体 AI；
  bot 跑分基线体系；ACES/Bloom/MSAA 渲染管线；HUD（准星=散布 / 小地图 / killfeed）。
- **从 04_1 移植**：枪声合成配方（噪声+低频双成分、±6% pitch 抖动、远/近分层）、三段换弹音。
- **有意舍弃**：043 的单向阀管道（需专用碰撞机制 → 改为双向管形通道）；043 的 OBB 自研物理
  （Rapier 旋转盒等价替换）；043 的免构建单全局命名空间（与工程化目标冲突）。

## 已知差异 / 限制

- 敌人跳跃是「路径上行边触发」的简化实现，不如 043 bot 的手动跳跃精细。
- 管道为双向通道，丢失了 043 单向阀的「单行道」战术价值。
- AWM 腰射散布 0.05 rad（近乎打不中），是刻意设计：狙击必须开镜。

## 调参记录（2026-09-25 首次定基线）

- 完美 bot（slot=M4A1）：5 seed 全通关，103–160s，击杀 57/57。
- 人类 bot（jitter 0.045 / react 0.28s）：通关率 40%（2/5），命中率 42–64%。
- 敌人卡死根治：nav 软复位 + 出生点「放松约束重采样」（禁止把敌人塞进实体）。

## 043 遗留 bug 修复记录（2026-09-26）

移植后针对用户点名的三类 043 自身 bug 做了系统性排查与修复：

1. **玩家出生被钉（R5）**——出生胶囊底面恰好贴地，第一步重力位移（-26·dt² ≈ 7.2mm）
   把胶囊压进地面，KCC 以 0.1mm/步慢速脱困，期间横向移动被拒（ship 图实测钉 60 步 = 1 秒）。
   修复：Player / Combatant 出生位置统一 +2cm 悬空落体，一步内干净接地。
2. **集装箱穿模**——写了 2D SAT OBB 重叠诊断（tools/diag-overlap.ts），修掉 9 处真穿模
   （最重者：孤儿横箱嵌进中央掩体 3.05m、踏板塔嵌进斜箱堆 1.46m）；驾驶舱脱离船舷墙；
   悬挂集装箱抬高避开 V 箱顶。剩余重叠全部为墙体正常搭接。
3. **空气墙**——sim/render 同源（渲染直接吃 sim.boxes）从架构上杜绝「有碰撞无视觉」；
   反向「有视觉无碰撞」修复三处：吊车立柱与悬挂集装箱升级为碰撞体（原可整个穿过去）、
   门框贴片移到墙端外侧、吊索对齐箱顶。
4. **手雷（新增）**——043 的手雷无物理反弹；本版手雷是 Rapier 动态刚体球
   （restitution 0.55 / friction 0.7 / CCD 防穿），真实抛物线 + 甲板/箱壁反弹 + 2.2s 引信，
   爆炸 6.5m 半径范围伤害（静态遮挡判定，墙后无效），玩家自伤 ×0.5，投掷/爆炸音效
   与爆炸闪光特效。sim 层验证见 tools/diag-grenade.ts（H1–H5）。

### 验证基线（修复后全绿）

- tsc --noEmit ✅ · vite build ✅
- bot 生存基线 13/13（B1 人类 bot 通关率回到 60%、C1 时长 102–149s）
- bot 据点基线 5/5
- CDP 端到端 24/24（含新 R17 手雷链路、D-D 据点推进修正为冲刺 10s）

### 标定阈值随修复同步更新

出生修复让玩家不再被钉 1 秒，人类 bot 通关率与最快通关时长随之上浮，
B1/C1 阈值在修复后重新标定（B1 20–80% 区间内回落到 60%，C1 下限 100s 恢复达标）。
