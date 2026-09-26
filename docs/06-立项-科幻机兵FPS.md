# 06 · 立项：科幻机兵 FPS（正式期第一作）

> 状态：**工程已创建**（`projects/06-mech-fps/`，`--headless` 导入+加载零报错）
> 素材：8 个 Kenney 包 + 40 个 Poly Pizza 模型全部入库；FPS 控制器模板已接入
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
| 角色动画库（后续） | Quaternius Universal Animation Library / Mixamo | ⚠️ Quaternius 直链未破解；Mixamo 需用户登录 |
| 音乐 | OpenGameArt（逐项核对授权） | ⏳ 待搜集 |

---

## 4. 难度平衡与剧情（知识资产）

- **难度**：首版用「波次强度曲线 + 玩家资源回复率」双旋钮，沿用 03 的机器人跑分方法论
  做参数扫描（击杀时间 TTK、受击频率、资源净收益量化成表）。
- **剧情**：首版轻叙事——环境叙事（关卡内终端/标语/残骸）+ 开场一页简报。
  不做过场动画（投入产出比太低）。世界观一句话：*你是最后一代机兵驾驶员，
  在被 AI 叛军占领的轨道空间站里夺回控制权。*
- 参考资料（后续补充链接）：DOOM Eternal 战斗循环拆解、Titanfall 2 移动设计 GDC 分享。

---

## 5. 工程规划

```
projects/06-mech-fps/                       ✅ 已创建并验证
├─ project.godot                            config_version=5, forward_plus, 12 个输入动作
├─ icon.svg
├─ scenes/
│  └─ main.tscn                             当前只实例化模板的 map + player（骨架）
├─ addons/JehenoAdvancedFirstPersonController/   移动控制器（MIT 模板，保留原目录名）
├─ sim/                                     纯逻辑层（武器数值/波次/AI 决策），--headless 可测
├─ assets/                                  「已选定使用」的素材副本
└─ tools/
   └─ setup_inputmap.gd                     一次性脚本：把模板所需输入动作写入 project.godot
```

- 素材集中放 lab 根 `assets/`，项目内只放「已选定使用」的副本或导入产物——
  避免每个项目复制一遍素材库。
- 验证：`godot --headless --import`（资源导入）→ `--headless --quit`（加载主场景）
  → sim 层断言脚本 → 输入回放机器人 → 截图人验。
  当前基线：**导入 DONE、加载 EXIT=0、WARNING/ERROR 0 条**。

### 5.1 已验证的命令（lab 根执行）

```bash
GODOT=engines/godot/4.7.2/Godot_v4.7.2-stable_win64_console.exe
$GODOT --headless --path projects/06-mech-fps --import   # 资源导入
$GODOT --headless --path projects/06-mech-fps --quit     # 加载主场景后立即退出
$GODOT --headless --path projects/06-mech-fps -s res://tools/setup_inputmap.gd
```

必须用 `_console` 后缀的版本，Standard 版不输出脚本报错到终端。

---

## 6. 本作的 DoD（在路线图 §0 之上追加）

1. 移动手感通过人验：滑铲→墙跑→二段跳衔接流畅，无不跟手感。
2. 3 武器 × 3 敌型 × 1 关卡 × ≥5 波，从打开到结算完整可玩。
3. 命中/击杀反馈链齐全（火光/曳光/标记/音效/震动）。
4. 素材 100% 登记 `assets/SOURCES.md`。
5. `--headless` 加载零报错 + sim 断言全绿。
