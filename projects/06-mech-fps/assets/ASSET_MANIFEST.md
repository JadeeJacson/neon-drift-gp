# 06 · 选定资产清单（Asset Manifest）

> 从 lab 根 `assets/` 的素材库中为 06 挑选的「实际使用」副本，以及**必须施加的缩放**。
> 尺寸由 `tools/verify_assets.gd` 实测（Godot 单位 = 米），脚本模式：
> `engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --headless --path projects/06-mech-fps -s res://tools/verify_assets.gd`

## 为什么必须有这张表

Poly Pizza 是多人投稿站，**每个模型的尺度、朝向、原点都不同**。实测落差极大：
同为「机兵」，高的 19.31 m、矮的 0.59 m，相差 30 倍。不记录缩放就直接拖进场景，
结果必然是「敌人比楼还大」或「枪比人还长」。

## 1. 敌人

| ID | 源文件 | 授权 | 实测尺寸 (m) | 缩放 | 目标高度 | 动画 |
|---|---|---|---|---|---|---|
| `trooper` | `mech-o3Ps8z8ByP.glb` | CC0 (Quaternius) | 3.38 × 3.06 × 1.99 | **0.70** | ~2.14 | **17** |
| `swarm_drone` | `robot-enemy-flying-lF3jeRJwiH.glb` | CC0 (Quaternius) | 2.27 × 0.76 × 0.48 | **1.30** | ~0.99 | **6** |
| `charger` | `mechquadruped-5x1hRpbmdfo.glb` | CC-BY (3Donimus) | 2.06 × 0.59 × 0.49 | **1.50** | ~0.89 | 0（程序化） |
| `heavy` | `mech-assault-walker-6s3_n8xzzvo.glb` | CC-BY (Alimayo Arango) | 16.43 × 19.31 × 15.54 | **0.26** | ~5.02 | 0（程序化） |

### trooper 的 17 个动画（中距射击型，动画最全）

`Dance` `Death` `Hello` `HitRecieve_1` `HitRecieve_2` `Idle` `Jump` `Jump_Landing`
`Jump_NoHeight` `Kick` `No` `Pickup` `Run` `Shoot_Big` `Shoot_Small` `Walk` `Yes`

→ 战斗可用映射：`Idle` / `Walk` / `Run` / `Shoot_Big`（开火）/ `HitRecieve_1`（受击硬直）/ `Death`（死亡）。
这套动画**已经够做完整敌人 AI**，不需要再抓外部动画库。

### swarm_drone 的 6 个动画

`Attack` `Dead` `Idle` `Run` `Shoot` `Walk`

### charger / heavy 的动画方案：程序化

两者无骨骼动画。沿用练习期 04 已验证的**分件 pivot 摆动**方法论：
四肢各挂一个 pivot（原点在肩/髋），mesh 在 pivot 内偏移半个长度，
摆动相位由**真实位移驱动**（`phase += speed * dt * k`）——站定不摆、跑起来摆幅大。
机甲/四足这类刚性机械体本来也更适合程序化驱动，不追求有机感。

## 2. 武器

| ID | 源文件 | 授权 | 实测尺寸 (m) | 缩放 | 说明 |
|---|---|---|---|---|---|
| `assault_rifle` | `rifle-KjHL5JJrxU.glb` | CC0 (Quaternius) | 0.11 × 0.52 × 1.64 | **0.55** | 原长 1.64 m 偏长 |
| `shotgun` | `sci-fi-shotgun-e1AuzGo7dL.glb` | CC-BY (burunduk) | 0.77 × 0.21 × 0.16 | **1.10** | 尺寸已接近可用 |
| `dmr_sniper` | `scifi-sniper-46615JyFm7.glb` | CC0 (Quaternius) | 2.26 × 0.54 × 0.09 | **0.58** | 原长 2.26 m，缩到 ~1.3 m |

> 武器作为第一人称 viewmodel 时还需单独调「持握姿态」偏移，缩放只是第一步。

## 3. 场景物件

| ID | 源文件 | 授权 | 实测尺寸 (m) | 缩放 |
|---|---|---|---|---|
| `turret` | `turret-mXKbcMPLSS.glb` | CC0 (Kenney) | 2.30 × 0.90 × 1.85 | 1.00 |
| `turret_cannon` | `turret-cannon-mNJ6poH7Cp.glb` | CC0 (Quaternius) | 1.16 × 0.65 × 1.11 | 1.00 |

## 4. 音效（来自 Kenney Sci-fi / Impact / UI Audio，全部 CC0）

工程内 `assets/audio/sfx/`，语义化重命名（原名保留在 lab 库）：

| 工程内文件名 | 用途 | 来源原名 |
|---|---|---|
| `fire_rifle.ogg` | 步枪开火 | `laserSmall_000.ogg` |
| `fire_rifle_alt.ogg` | 步枪开火（交替，避免连射机械感） | `laserSmall_001.ogg` |
| `fire_sniper.ogg` | 精确射手开火 | `laserLarge_000.ogg` |
| `fire_shotgun.ogg` | 霰弹开火 | `laserRetro_000.ogg` |
| `impact_metal.ogg` | 命中金属（命中标记音） | `impactMetal_000.ogg` |
| `explosion.ogg` | 爆炸 | `explosionCrunch_000.ogg` |
| `explosion_low.ogg` | 爆炸低频层（叠层用） | `lowFrequency_explosion_000.ogg` |
| `thruster.ogg` | 推进器（滑铲/dash 反馈） | `thrusterFire_000.ogg` |
| `footstep.ogg` | 脚步 | `footstep_concrete_000.ogg` |
| `ui_click.ogg` | 界面确认 | `click1.ogg` |

> 开火音配了「主音 + 交替音」两套：练习期教训是**同一音高连播会迅速产生机械疲劳感**，
> 交替播放能让连射听起来有变化。

## 5. 待补

- **音乐**：`assets/audio/music/` 仍空，待从 OpenGameArt 逐项核对授权后搜集。
- **环境模块**：Kenney Space Kit（1694 文件，CC0）已入库但尚未接入 06 场景。
