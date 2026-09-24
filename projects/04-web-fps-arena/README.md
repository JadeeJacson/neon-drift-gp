# 04 火线 FIREROUND

第一人称竞技场射击（FPS）。5 波 57 敌（步兵 / 冲锋兵 / 狙击手 / 精英），三把武器（手枪 / 步枪 / 霰弹），全程程序化资源 + 程序化音效。

## 栈

| 层 | 选型 | 版本 |
| --- | --- | --- |
| 渲染 | three.js (WebGL2) | 0.186.0 |
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
│   ├── arena.ts        静态掩体 + 出生点
│   ├── enemy.ts        敌人 AI（LOS 推进 + 切线绕行）
│   ├── game.ts         GameSim 组装、step 顺序、胜负
│   ├── player.ts       KCC 玩家（coyote time、grounded）
│   ├── rng.ts          mulberry32 决定性 RNG
│   ├── shooting.ts     castRay（Rapier 0.20 timeOfImpact）
│   ├── waves.ts        WaveDirector（分批、波间喘息、推进）
│   ├── weapons.ts      WeaponSystem（后坐力、散布、换弹）
│   └── vecmath.ts
├── render/     ← 只读 sim 的 EnemyView / GameSnapshot / 事件流
│   ├── scene.ts        SceneRig + 相机自带 PointLight（viewmodel 可见性）
│   ├── arena.ts        程序化掩体渲染 + 警戒条纹
│   ├── actors.ts       EnemyRenderer + ViewModel（Lambert + emissive）
│   └── fx.ts           曳光 + 粒子对象池
├── audio/synth.ts      AudioEngine（oscillator + noise buffer 合成）
├── ui/hud.ts           DOM HUD（准星 = 真实散布）
├── core/config.ts      全部平衡数值（唯一调参入口）
└── main.ts             组装 + 固定步长循环 + window.__fps 验证接口
```

**铁律**：`src/sim/**` 不 import three、不碰 DOM。这让 Node 可以直接驱动 sim（`tools/bot-run.ts`），平衡数值用 bot 跑分做客观判定，而不是靠肉眼看画面。

## 运行

```bash
npm install
npm run dev              # http://127.0.0.1:5181（strictPort）
npm run typecheck        # tsc --noEmit
npm run bot              # bot 跑分：perfect / human / 决定性 / 静止必死（9 项断言）
npm run verify 9222 http://127.0.0.1:5181/ F:/Dev/Projects/game-lab/_tmp
                         # CDP 端到端验证（13 项断言）
npm run build            # 生产打包
npm run preview
```

## 控制

`鼠标转视角 · 左键开火 · R 换弹 · 1/2/3 切枪 · Shift 疾跑 · Esc 释放鼠标`

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

## 验证基线（2026-09-24）

### Bot 跑分 9/9

- **A1** perfect bot 100% 通关 × 5 轮（证明地图可清）
- **A2** 全程无 NaN / 无无限循环
- **A3** 总击杀 == 57（决定性）
- **B1** human bot（jitter 0.045rad / 反应 0.28s）通关率 20%–80%
- **B2** human bot 命中率 40%–85%
- **B3** human bot 至少打到 wave 3
- **C1** clear time 100–360s
- **D1** 同种子 → 同结果（决定性 RNG）
- **E1** 静止 bot 必死于压力（证明敌人有威胁）

### CDP 端到端 13/13（RTX 4060 Direct3D11）

- R0 加载并暴露 `__fps`
- R2 WebGL2 + 真实硬件渲染器
- R3 进入 `playing` 且时间推进
- R4 敌人按波次生成
- R5 注入前进 → 位移 Δ = 4.48m
- R6 开火 → 弹药 12→11、shots 0→1
- R7 命中 → hits +2
- R8 换弹 → 弹匣补满 12/12
- R9 drawCalls=30 / triangles=3110 / programs=10
- R10 AudioContext running、事件计数 10→21、last=enemyShot
- R11 截图 470KB（>25KB 阈值）
- R1 零运行时报错

## 关键设计选择

1. **后坐力叠加到视线**：`dirFromAngles(yaw+recoilYaw, pitch+recoilPitch)`，枪口跳到哪子弹飞到哪，避免「枪口飞但子弹直」的违和。
2. **视线检测 = 真实射线**：Rapier 0.20 字段是 `timeOfImpact`（不是旧 0.11 的 `toi`）；必须排除自身 collider（眼睛在胶囊内会 t=0 自击）。`hasLineOfSight(targetHandle)` 比较 `hit.colliderHandle === targetHandle`，否则射线终点在目标内部会先击中表面。
3. **敌人导航不用 navmesh**：LOS-优先推进 + 切线绕行（`blockedTimer`/`detourTimer`：实测 <45% 期望速度 >0.25s 触发 1.3s 切线）。3m 内 `pointBlank` 豁免 LOS 避免贴脸死锁。
4. **尸体立刻移除**：`cleanup()` 在 `world.step()` 后立即 remove 死亡体的 collider/rigidbody，尸体不当掩体；渲染层用 `EnemyView.lastPos` 播消散动画。
5. **viewmodel 可见性**：MeshStandardMaterial 暗光下变纯黑剪影。改用 MeshLambertMaterial + emissive + 相机自带 PointLight，任何光照下都看得到手中武器。
6. **准星 = 真实散布**：`gap = spread / halfFov * height/2`，玩家看到的臂张角 = 子弹真实散布。手感因此可测而非「看起来像」。
7. **程序化音效为硬指标**：01/02/03 全缺音效，是 lab 最大系统性缺口。04 全部 SFX（shot 三种音色、hit、headshot、kill、reload、empty、hurt、enemyShot、waveStart、win、lose、footstep、swap）用 oscillator + noise buffer 现场合成。

## 已知限制 / 后续

- viewmodel 仍偏几何化（盒 + 圆柱），要更精致需手部 / 武器贴图（违反零资产原则）。
- 精英仅在第 5 波出现 3 只，强度未充分压力测。
- 曳光池 MAX 64、粒子池 MAX 500，极端长持续战斗可能截断（实战未观察到）。
- HUD「场上 N · 剩余 M」中 M = alive + queue + future = total − killed，语义与英语 remaining 略有偏差（截图 23:13：场上 3 剩余 56 = 57 − 1 击杀，已验证正确）。
- 音效混音全在合成层，缺独立 bus 与响度归一。
- 无 PointerLock 时只能拖拽视角（`Map.to` 拖拽 fallback），CDP 注入走 `setLook`。

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