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
> **持握姿态已按实测确定，见下一节。**

## 2b. viewmodel 实测朝向（2026-09-27，`tools/measure_viewmodels.gd`）

实跑反馈「有的枪械横在屏幕上」的根因：**每把投稿模型的枪管轴向都不一样**，
统一按 -Z 摆必然有枪是横的。实测结果（包围盒 + 质心符号 → 所需 yaw）：

| 枪 | 实测包围盒 (m) | 枪管所在轴 | 质心符号 | 所需 yaw | 采用缩放 |
|---|---|---|---|---|---|
| `assault_rifle` | 0.11 × 0.52 × 1.64 | **Z** | + | **180°** | 0.379 |
| `shotgun` | 0.77 × 0.21 × 0.16 | **X** | + | **90°** | 0.806 |
| `dmr_sniper` | 2.26 × 0.54 × 0.09 | **X** | + | **90°** | 0.274 |

- 目标枪管长度统一 0.62 m（第一人称不按真实尺寸画，太长会糊住准星）。
- **枪口点不再手填**：`WeaponController._compute_muzzle()` 在装配时把 viewmodel 的
  全部网格包围盒折算到相机局部空间，取「最靠前（-Z 最小）」那点作为枪口，
  曳光与枪口焰都从它发出。改姿态或换模型都会自动跟着，不会再出现
  「射线不是从枪口出发」。
- 上表数值直接写在 `scripts/weapon_controller.gd` 的 `VIEWMODELS` 常量里，
  改之前先重跑测量脚本，别凭眼睛调。

## 2c. 关卡装饰模块（Kenney Space Kit，2026-09-27 实测）

工程内副本：`assets/models/environment/space-kit/`（28 个 GLB，共 384 KB）。
这套是 **1 模块 = 1 米** 的网格化 kit，且**全部零碰撞体**——所以可以安全地当装饰层用，
不会造出空气墙（冒烟测试有一条断言专门守这个：`Arena/Props` 下碰撞体数量必须为 0）。

| 模块 | 实测尺寸 (m) | 在关卡里的用途 |
|---|---|---|
| `structure_detailed` | 1.00 × 1.00 × 1.00 | 四面墙壁板（缩放 3） |
| `pipe_supportHigh` | 0.40 × 1.00 × 0.40 | 墙间立柱（缩放 3） |
| `pipe_straight` | 0.69 × 0.60 × 1.00 | 墙上中段管线 |
| `gate_simple` | 1.00 × 1.08 × 0.50 | 四面墙中央的地标门 |
| `rail` / `rail_corner` | 0.80 × 0.25 × 0.05 / 0.90³ | 高台外沿栏杆 |
| `desk_computer` | 0.53 × 0.38 × 0.22 | 高台控制台 |
| `machine_barrelLarge` | 0.75 × 0.60 × 0.75 | 高台储桶 |
| `turret_single` | 0.60 × 0.90 × 0.72 | 高台角炮塔 |
| `machine_generatorLarge` | 1.00 × 0.68 × 1.30 | 墙脚大机器（缩放 3） |
| `satelliteDish` | 0.69 × 0.62 × 0.57 | 墙脚天线（缩放 3） |
| `platform_large` | 2.00 × 0.10 × 2.00 | 中央地面嵌板（无碰撞，纯平面） |

摆放规则（写在 `tools/build_arena.gd` 的 `_add_props()`）：**只贴墙、只上高台、
中央通路不放任何装饰**——无寻路的敌人被装饰物卡住等于死局（练习期教训）。
当前 142 件，每件一次 draw call；真实 draw call 与帧数只能在游戏内看（headless 测不到）。

## 2d. 射击模式分工（`WeaponTable.fire_mode`）

| 枪 | 模式 | 按住扳机的行为 |
|---|---|---|
| 突击步枪 | `auto` | 持续开火（1 秒约 10 发） |
| 霰弹枪 | `pump` | 一次按压一发 |
| 精确射手 | `semi` | 一次按压一发 |

三把都能连发的话，单发伤害高的那把就没有存在理由，生态位会塌成一把——
所以这条分工有专门的断言（`test_fire_mode_roles`：自动武器数量必须恰好为 1）。

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

## 5. 准星与 UI

| 资源 | 来源 | 用法 |
|---|---|---|
| `addons/.../PlayerCharacter/HUD/crosshair.png` | Jeh3no 模板内置 | 直接复用模板 HUD 的准星，**不再引入 Kenney Crosshair Pack**（2013 张留在 lab 库备用）。自制的 hitmarker 用 Label `✛`，避免两套准星叠在一起 |

> 模板 HUD 还带一个速度/状态调试面板（`HUD/PlayerCharacterProperties`）。
> `scripts/hud.gd` 的 `show_template_debug` 默认 **false** 会把它隐藏；
> 调手感时打开它很有用（能看见 coyote time / jump buffer / desired move speed）。

## 6. 音乐（lab 根 `assets/audio/music/`，CC-BY 4.0 · bogart-vgm）

| 工程内文件名 | 用途 | 来源 |
|---|---|---|
| `main_theme.mp3` | 主菜单 / 开场简报 | OpenGameArt「Scifi Main Theme: Menu」 |
| `combat_loop.mp3` | 战斗 | OpenGameArt「Scifi Action」 |
| `tension_loop.mp3` | 波次间歇 / 潜行铺垫 | OpenGameArt「Scifi Concentration (looped)」 |

授权与署名要求见 lab 根 `assets/SOURCES.md` §4（**发布前必须加署名**）。
MP3 在 Godot 4 走 `AudioStreamMP3`，`loop = true` 才可循环；未循环的曲目在战斗间歇会突然静音。

## 7. 待补

- **环境模块**：Kenney Space Kit（1694 文件，CC0）已入库但尚未接入 06 场景 —— 即「美术 pass」，
  在灰盒验证通过后替换。
- **近战处决的动画与音效**：目前只有音效（`thruster.ogg` 顶替），需要像样的处决演出。
- **charger / heavy 的分件 pivot**：当前只做了 bob + 前倾的程序化近似，四肢还没挂 pivot。
