# 06 · 选定资产清单（Asset Manifest）

> 从 lab 根 `assets/` 的素材库中为 06 挑选的「实际使用」副本，以及**必须施加的缩放**。
> 尺寸由 `tools/verify_assets.gd` 实测（Godot 单位 = 米），脚本模式：
> `engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --headless --path projects/06-mech-fps -s res://tools/verify_assets.gd`

## 为什么必须有这张表

Poly Pizza 是多人投稿站，**每个模型的尺度、朝向、原点都不同**。实测落差极大：
同为「机兵」，高的 19.31 m、矮的 0.59 m，相差 30 倍。不记录缩放就直接拖进场景，
结果必然是「敌人比楼还大」或「枪比人还长」。

## 1. 敌人

### 1·统一骨架：Kenney Blocky Characters（2026-09-27 第四轮）

四种敌型全部换成 **Kenney Blocky Characters**（CC0，lab 根 `assets/models/characters/kenney_blocky-characters/`）：
工程内 `assets/models/enemies/blocky/blocky_{a,f,k,r}.glb`（4 个角色 + 贴图共 780 KB）。

| 事实 | 实测值 | 为什么关键 |
|---|---|---|
| 节点结构 | 8 个刚性节点：`root / torso / head / arm-left / arm-right / leg-left / leg-right`，**18 个角色完全一致** | 这就是「统一骨架」：一份动画映射与一份队伍配色覆盖全部敌型 |
| 蒙皮 | `skins: 0` —— **零蒙皮**，部件是独立节点 | 所以 `get_aabb()` 与部件位置可信，但也意味着「量骨骼」的度量对它是 0（见下） |
| clip | 每个角色 **27 段，名字一致**：`idle / walk / sprint / holding-both / holding-both-shoot / die / pick-up / emote-*` … | 射击游戏要的状态全都有，不用 Mixamo、不用登录 |
| 命名坑 | clip 名**保留连字符**（`holding-both-shoot`），且**全小写** | 循环策略原来按 `Idle/Run/Walk` 大写前缀匹配，对这批一条都不命中 → 已改成大小写不敏感并补 `sprint`/`holding-` |
| 身高 | 模型 2.70 m（Kenney 按大单位做的）→ 缩放 `drone 0.47 / charger 0.60 / trooper 0.667 / heavy 0.95` 得到 1.27 / 1.62 / 1.80 / 2.57 m | 碰撞胶囊与 `smoke_battle.COLLIDER_CENTER` 都按这个重算（0.65 / 0.81 / 0.90 / 1.28） |
| 队伍配色 | 实例级 `material_override`（我方蓝 0.55,0.72,1.0 / 敌方红 1.0,0.52,0.45）乘在原贴图上 | **不能用逐面覆盖** `set_surface_override_material`：`--headless` 的 dummy 渲染器会走到 `material_get_instance_shader_parameters(null)`，实测刷 72 条 ERROR，污染零 ERROR 基线 |

**更正上一轮的调研结论**：`_scratch/viewmodel_research_20.md` 记的是「kenney_blocky-characters 只有 FBX、无动画」——**错的**。
包里 `Models/GLB format/` 有 18 个 GLB，每个带 27 段动画；当时只看了 FBX 目录。这条已经影响到决策，所以两处都要留痕。

**度量上的坑**：刚性部件是**绕自身枢轴旋转**的，所以「部件位置包围盒对角线」几乎不变（实测 0.00224），
挥臂这种大动作在数值上像没动。`EnemyController.motion_signature_for_test()` 改成
「各部件到本体原点的距离平方之和」，任何部件一动它就变（实测跑动 4 秒跨度 0.064，阈值 0.02）。

### 1b. 旧模型（保留但不挂在敌型上）

`swat_trooper.glb`（Quaternius，CC0，24 段，蒙皮人形）与四台机型号仍在工程里：
高保真路线随时可以切回去，但**它没有跨角色统一的骨架**，做不了「四种敌型共用一份动画映射」。


| ID | 源文件 | 授权 | 实测尺寸 (m) | 缩放 | 目标高度 | 动画 |
|---|---|---|---|---|---|---|
| `trooper` | `swat_trooper.glb`（原候选名 `swat-Btfn3G5Xv4.glb`） | **CC0** (Quaternius)，poly.pizza/m/Btfn3G5Xv4 | 头骨 y=1.556、`Head_end` y=1.809 → **模型自己就是 1.8 m 人形** | 1.00（不用缩放） | 1.8 | **24** |
| `swarm_drone` | `robot-enemy-flying-lF3jeRJwiH.glb` | CC0 (Quaternius) | 2.27 × 0.76 × 0.48 | **1.30** | ~0.99 | **6** |
| `charger` | `mechquadruped-5x1hRpbmdfo.glb` | CC-BY (3Donimus) | 2.06 × 0.59 × 0.49 | **1.50** | ~0.89 | 0（程序化） |
| `heavy` | `mech-assault-walker-6s3_n8xzzvo.glb` | CC-BY (Alimayo Arango) | 16.43 × 19.31 × 15.54 | **0.26** | ~5.02 | 0（程序化） |

### trooper 换成真人形（2026-09-27 素材升级）

原来是 `trooper_mech.glb`（Quaternius 机甲，0.7 缩放凑 2.14 m，17 段动画）。
制作人要的是「人型敌人」，所以换成 SWAT 人形：`scenes/enemies/trooper_soldier.tscn`
（旧场景 `trooper_mech.tscn` 已 `git mv` 过来），碰撞体从 radius 0.45 / height 2.0 改成
**0.35 / 1.8**，胶囊中心 y 从 1.07 改成 **0.9**（`smoke_battle.gd` 的 `COLLIDER_CENTER` 跟着改，
否则水平射线会从脚底掠过——这个坑第一轮就踩过）。`enemy_table.gd` 的 display 从「机兵射手」改成「武装士兵」。

24 段里战斗可用：`Idle_Gun`（持枪待机）/ `Walk` / `Run` / `Run_Shoot` / `Gun_Shoot`（开火）/
`HitRecieve`（受击）/ `Death`（死亡），另有 Roll / Kick / Punch / Interact 等备用。

**clip 名带骨架前缀**（`CharacterArmature|Run`），裸名一条都匹配不上，症状是「模型滑步」——
`EnemyController._detect_anim_prefix()` 在装配时从 clip 列表里推出前缀，`_play_anim()` 先试裸名
再试带前缀的。Quaternius / KayKit 这批角色全是这个口径，所以这一处改动对后面所有敌人通用。

### 待接入的第二个 / 第三个人形（已在 `_candidates/`）

| 文件 | 授权 | 动画 | 用途设想 |
|---|---|---|---|
| `character-enemy-mdGe4IN31v.glb` | CC0 (Quaternius) | **34 段**（含 `Run_Shoot`/`Walk_Shoot`/`Death`/`Duck`/`HitReact`） | 换 `heavy` 的程序化机甲？还是做精英怪，下一轮定 |
| KayKit Character Pack Adventures（lab 根 `assets/_downloads/KayKit-Character-Pack-Adventures-1.0.zip`） | CC0 | 5 个角色 × **各 76 段**，共享同一骨架 | 一份 AnimationTree 复用五种怪；`1H_Ranged_Reload`/`1H_Ranged_Shoot`/`Death_A` 都在 |

### 旧 mech 模型的动画清单（`trooper_mech.glb`，已不挂在任何敌型上，留着备用）

`Dance` `Death` `Hello` `HitRecieve_1` `HitRecieve_2` `Idle` `Jump` `Jump_Landing`
`Jump_NoHeight` `Kick` `No` `Pickup` `Run` `Shoot_Big` `Shoot_Small` `Walk` `Yes`

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

## 2e. 带手的第一人称枪（**已接入**，2026-09-27 第二轮）

| 项 | 内容 |
|---|---|
| 文件 | `assets/models/weapons/deagle_viewmodel_hands.glb`（865,016 B） |
| 来源 | Majikay Games / SimpleFPSController，CC0，https://github.com/majikayogames/SimpleFPSController |
| 实测内容 | 6 网格、188 节点、1 皮肤、51 关节、**89 个 hand/finger 关节**；动画 4 段：`Idle / Reload / Shoot / Unholster` |
| 导入后的名字坑 | GLB 源文件里叫 `Idle-loop`，**Godot 导入器改成 `Idle`**。按源文件名去播会静默不播（已在 `_play_vm_anim` 加缺 clip 警告） |
| 接在哪把枪 | `dmr_sniper`（精确射手）。它是 .44 手枪，角色不完全对得上，先用它把「带手 + 真换弹」这条链路跑通 |

**上一轮的结论要修正**：当时判断「它是整套 Rigify 身体骨架、按静态枪摆必然错位」是对的，
但「量包围盒 → 按目标尺寸缩放 → 把中心平移到目标点」这个解法是**错的**——
带手臂的模型包围盒最长轴是肩膀跨度（实测 1.51 × 1.47 × 1.70 m），不是枪管，
按盒子中心对齐只会把手臂怼到镜头上。

**实际用的解法：两点锚定（`tools/fit_viewmodel.gd`）**。模型里有两个天然锚点：
握把（`hand_ik_R` 这个 BoneAttachment3D，枪挂在它下面）与枪口（作者留的 `Muzzle` 空网格）。
量出模型自己的「握把 → 枪口」向量，解一个相似变换（缩放 + 旋转 + 平移）把它映射到
相机局部空间的目标两点，六个数（rot/scale/pos）就出来了，且脚本会**把解代回场景再量一次**，
偏差 > 0.02 m 就报 FAIL 不写配置（本轮实测偏差 0.000 m）。

```bash
./engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe --headless --path projects/06-mech-fps \
  -s res://tools/fit_viewmodel.gd -- --model=res://assets/models/weapons/deagle_viewmodel_hands.glb \
  --clip=Idle --target-grip=0.23,-0.26,-0.34 --target-muzzle=0.16,-0.18,-0.60
```

三个只有量出来才知道的事实（省下一轮猜）：
1. **量必须在动画姿态下量**：`player.seek()` 之前不 `play()` 的话骨骼姿态根本不更新，
   四段动画量出来一模一样，会误判成「模型没绑定」。
2. **两点定不出绕枪管轴的自旋**（枪正着拿还是侧着拿），所以留了 `--roll=` 旋钮，靠截图挑；
   绕锚点轴旋转不改变两个锚点，复验仍然 PASS。
3. **握把不能离相机太近**：第一版把握把定在 z=-0.08，结果半只手糊满右下角。
   手要放在 z≈-0.34 才正常。当前值 `roll=0 / scale=0.488 / pos=(0.5572, -0.5116, -0.1338)`
   是这么试出来的。

运行时配套（`scripts/weapon_controller.gd`）：`VIEWMODELS` 支持 `muzzle`（fit 的目标枪口点，
静态回退）、`muzzle_node`（模型自带的枪口标记节点，装配时自动隐藏那块标记面片）、
`anim`（idle/shoot/reload/unholster → AnimationPlayer 片段名）。
切枪先播 `Unholster`（实测其末帧 = Idle 姿态），换弹播 `Reload` 并**不再**跑 tween；
曳光与枪口焰取 `Muzzle` 节点的**实时**世界坐标，所以枪抬起来打出的曳光起点也跟着抬。
`tools/inspect_rig.gd` 是配套的解剖工具（节点树 / clip 列表 / 各姿态锚点），
接新绑定模型先跑它，别靠猜。

冒烟断言（`smoke_battle.gd` §5d）锁住这条链：枪口标记节点存在且隐藏、
待机姿态下它落在 fit 解出的点上（偏差 < 0.06 m）、换弹时 `current_animation == "Reload"`、
且枪口在 0.5 秒内真的位移 > 0.02 m（实测 0.078 m）。

## 2f. 截图调参工具（新增能力）

`tools/capture_view.gd`：**有窗口**跑游戏到第 N 帧并存 PNG（`--headless` 走 dummy 渲染不出图，
见 docs/00 §4.4）。用法：

```bash
./engines/godot/4.7.2/Godot_v4.7.2-stable_win64.exe --path projects/06-mech-fps \
  -s res://tools/capture_view.gd -- --weapon=dmr_sniper --pose=reload --frames=45 \
  --out=_scratch/shots/reload.png
```

意义：viewmodel 姿态、HUD 排版、光照氛围这些原本「只能你眼睛判」的东西，
我现在可以自己看、自己对比迭代。本轮就是靠它发现 HUD 的 `PanelContainer`
会强制布局子节点、导致弹匣数字与备弹重叠（已改为 Control + ColorRect）。

## 2g. 射击模式分工（`WeaponTable.fire_mode`）

| 枪 | 模式 | 按住扳机的行为 |
|---|---|---|
| 突击步枪 | `auto` | 持续开火（1 秒约 10 发） |
| 霰弹枪 | `pump` | 一次按压一发 |
| 精确射手 | `semi` | 一次按压一发 |

三把都能连发的话，单发伤害高的那把就没有存在理由，生态位会塌成一把——
所以这条分工有专门的断言（`test_fire_mode_roles`：自动武器数量必须恰好为 1）。

## 2h. 素材升级调研结论（2026-09-27，学习自用口径）

完整过程记录在 `_scratch/viewmodel_research_20.md`（428 个候选逐个校验，全 PASS）。
这里只留「已经用上的、下一步要用的、我拿不到的」三类。

### 已接入

| 角色 | 文件 | 作者 / 授权 | 为什么是它 |
|---|---|---|---|
| 突击步枪 | `assets/models/weapons/akm_viewmodel_hands.glb`（870,400 B） | J-Toastie，**CC-BY 3.0**，https://poly.pizza/m/U6l6wjxFhC | Poly Pizza 上唯二「第一人称 + 有手 + 自带真 Reload 剪辑」的素材之一：`Armature\|Idle 2.63s / Reload 2.58s / Shoot 0.17s`，双臂 + 逐指 28 骨，`Magazine`/`Bolt`/`Trigger` 都是真骨骼 |
| 精确射手 | `assets/models/weapons/deagle_viewmodel_hands.glb`（865,016 B） | Majikay，CC0，https://github.com/majikayogames/SimpleFPSController | 带 `Muzzle` 标记节点，曳光起点能跟着手动（见 §2e） |

**CC-BY 3.0 署名要求**（将来若要发布必须带上；lab 自用暂不显示，但这里必须记着）：
Portions of artwork are based on "FPS Rig AKM" by J-Toastie (poly.pizza/m/U6l6wjxFhC), CC-BY 3.0.

### 下一步要用（已下载到 `assets/models/weapons/_candidates/`，尚未接入）

候选池的完整清单与「为什么留这几个」见 `assets/models/weapons/_candidates/README.md`。
首次调研下了 428 个 GLB（140 MB），逐个校验后只留 12 个（7.4 MB），其余删掉——
留一堆没人用的模型在仓库里只会让人误判「素材已经齐了」。

| 用途 | 文件 | 授权 | 备注 |
|---|---|---|---|
| 霰弹（pump） | `shotgun-pump-west-NfQETBKOiw.glb` | CC0（Pichuliru） | 无剪辑，但 `Pump`/`Shell`/`Lifter` 是真骨骼 → 推护木与抛壳可以只打两个关键帧，比 tween 整块网格像样 |
| 精确射手（换掉 .44） | `sniper-rifle-west-kwJawENuvA.glb` | CC0（Pichuliru） | `Bolt` + `Magazine` 骨 + `Attach_Muzzle`/`Attach_Scope` 挂点 |
| 通用持枪手 | `wrad_fps_viewmodel_arms.glb` + 两张 albedo PNG | CC0-1.0（wwwriks，GitHub codeload） | 唯一 CC0 且带 `wrist_ik`/`arm_target` IK 目标的手，可以贴到任意枪的握把上 |
| 人形敌人 | `swat-Btfn3G5Xv4.glb`（24 段）/ `character-enemy-mdGe4IN31v.glb`（34 段） | CC0（Quaternius） | 都有 `Run_Shoot` / `Gun_Shoot` / `Death`，正好对上 06 的敌型状态机 |

### 两条负面事实（别再重新踩）

1. **这批 Poly Pizza 素材的 GLB 里 0 张内嵌贴图**，材质只有 `baseColorFactor` 纯色
   （`fps-rig-akm` 是 12 个纯色材质）。想要贴图质感得自己叠 ambientCG 或换素材源。
2. **J-Toastie 的 Fps Rig 没有枪口标记节点**，`--muzzle-bone=Hand.L --muzzle-forward=3.6`
   是拿「前手沿两手连线外推」当枪口的近似。要精确枪口得自己在 Blender 里挂一个 `Marker3D`。

### 拿不到的（需制作人本人操作）

| 素材 | 位置 | 为什么拿不到 |
|---|---|---|
| SGA Gun Pack、Quaternius 动画枪械包 | itch.io | **DNS 污染**，本机直连全部失败（`gethostbyname_ex('itch.io')` 解析到错地址） |
| `AK74U \| FREE ANIMATION`(7 段)、`Shotgun animation set`(6 段)、`SNIPER FPS ANIMATION`、`M4 - FPS Weapon Animations Pack`(5 段) | Sketchfab | 下载要登录。它的**公开目录 API 免 token 可用**，已逐个确认 `isDownloadable=true` + CC Attribution，但取文件必须人肉登录 |
| 任意枪的骨骼动画 | Mixamo | Adobe 账号，且只出 FBX |

## 3. 场景物件

| ID | 源文件 | 授权 | 实测尺寸 (m) | 缩放 |
|---|---|---|---|---|
| `turret` | `turret-mXKbcMPLSS.glb` | CC0 (Kenney) | 2.30 × 0.90 × 1.85 | 1.00 |
| `turret_cannon` | `turret-cannon-mNJ6poH7Cp.glb` | CC0 (Quaternius) | 1.16 × 0.65 × 1.11 | 1.00 |

## 3b. blockout 表面材质（ambientCG PBR，CC0，2026-09-27）

工程内只拷渲染要用的那几张（Color / NormalGL / Roughness / Metalness），
完整原件与授权说明见 `assets/textures/ambientcg/SOURCE.md`。

| 表面 | 套图 | 每张贴图覆盖 | 色调 | metallic | 用在哪 |
|---|---|---|---|---|---|
| 金属甲板 | MetalPlates001 | 4 m | (0.66,0.71,0.78) | 1.0（带 Metalness 图） | 地面、高台、墙跑墙段、掩体 |
| 混凝土 | Concrete002 | 6 m | (0.52,0.55,0.60) | 0.0（该套无 Metalness，非金属本就不需要） | 四面外墙、斜坡 |

三个只有做过才知道的点：
1. **必须三平面投影**（`uv1_triplanar`）。BoxMesh 的 UV 是整盒 0..1，直接贴会把 60 米的地面
   拉成一条条纹；三平面按局部坐标平铺，`uv1_scale` 的语义随之变成「每米重复几次」，取 `1/每张贴图米数`。
2. **NormalGL 不是 NormalDX**。ambientCG 两种都发，Godot 用 OpenGL 约定，接反了凹凸方向会颠倒。
3. **4.x 的属性名和 3.x 不一样**：`roughness_enabled` 在 StandardMaterial3D 里根本不存在
   （挂上 `roughness_texture` 即生效），`normal_depth` 改名成了 `normal_scale`。
   写错的后果是**运行期错误只中断当前函数**，材质退回原型网格图，画面看着还是灰盒却不报错
   ——所以 `smoke_battle.gd` §0c 加了「所有 blockout 盒子都必须带三平面 + 法线 + 粗糙度贴图」的断言。

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

| `reload_mag_release.ogg` | 换弹·取弹匣 / 弹夹脱出 | `metalClick.ogg`（Kenney RPG Audio） |
| `reload_bolt_back.ogg` | 换弹·拉机柄 / 开栓 | `beltHandle1.ogg` |
| `reload_bolt_forward.ogg` | 换弹·拉泵 / 关栓 | `beltHandle2.ogg` |
| `reload_mag_seat.ogg` | 换弹·弹匣（弹夹）归位 | `bookPlace1.ogg` |
| `reload_shell.ogg` | 换弹·逐发压弹（霰弹） | `bookPlace2.ogg` |
| `reload_latch.ogg` | 换弹·上膛到位 | `metalLatch.ogg` |

> 这 6 个是**分段音效**，由 `sim/weapon_presentation.gd` 的 `RELOAD_STAGES` 按换弹时间轴触发，
> 不再是一进换弹响一次性音效。Kenney RPG Audio 里没有枪械专用音，这 6 个是从「皮带抽拉 / 金属卡扣 /
> 书本放置」这类**同形状的机械声**里挑的——学习用途下够用，真要发布得换专门的枪械音效包。
> 文件缺失只在运行期刷 WARNING（听感=那段没声），所以 `verify_assets.gd` 把它们列进资产契约查。

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
