# SOURCES.md — 素材来源与授权登记册

> **规则**：凡进入 `assets/` 的素材，必须在此登记。学习用途不限授权，但作品不公开发布；
> 若将来要发布，先清理 CC-BY（需署名）与未知授权项，或替换为 CC0。
> 登记字段：名称 / 作者 / 授权 / 本地位置 / 来源 URL / 下载日期。

## 0. 授权速览

| 授权 | 含义 | 本库数量 |
|---|---|---|
| CC0 | 公有领域，可任意使用（含商用） | 模型 23 + Kenney 全部 + 模板见下 |
| CC-BY | 需署名作者 | 模型 44 |
| CC-BY 4.0（纹理） | 需署名作者 | 太阳系纹理 15 张 |

> **2026-09-27 授权范围放宽（用户拍板）**：本 lab 全部产物仅供个人学习自用、
> 不涉及任何商业行为，因此可接纳 CC-BY-NC 等「非商用」类授权。
> 仍须逐项登记；若将来公开发布，须逐项复核（含 NC 条款与第三方 IP 风险项）。
> 本次游戏 10 新增素材均为 CC0 / CC-BY / CC-BY 4.0，无 NC 项。
| MIT | 代码模板，需保留许可声明 | 1（Jeh3no FPS 控制器） |

---

## 1. 代码模板

| 名称 | 作者 | 授权 | 本地位置 | 来源 | 日期 |
|---|---|---|---|---|---|
| Godot Advanced State Machine First Person Controller（泰坦陨落式移动：滑铲/墙跑/二段跳/dash/兔跳/相机系统） | Jeh3no | MIT | `templates/jeh3no-fps-controller/` | https://github.com/Jeh3no/Godot-Advanced-State-Machine-First-Person-Controller | 2026-09-26 |
| GUT 9.7.1（Godot Unit Test，GDScript 单元测试框架，`gut_cmdln.gd` 支持 headless CLI） | Butch Wesley (bitwes) | MIT | `projects/06-mech-fps/addons/gut/`（含 `LICENSE.md`） | https://github.com/bitwes/Gut （tag `v9.7.1`，经 codeload 抓取） | 2026-09-26 |

## 2. Kenney 素材包（全部 CC0，作者 Kenney，kenney.nl，2026-09-26 下载）

| 包 | 内容 | 文件数 | 本地位置 | 来源页 |
|---|---|---|---|---|
| Sci-fi Sounds | 70× 科幻音效（激光/引擎/爆炸等） | 73 ogg | `audio/sfx/kenney_sci-fi-sounds/` | https://kenney.nl/assets/sci-fi-sounds |
| Impact Sounds | 命中/撞击音效 | 133 | `audio/sfx/kenney_impact-sounds/` | https://kenney.nl/assets/impact-sounds |
| UI Audio | 界面音效 | 55 | `audio/sfx/kenney_ui-audio/` | https://kenney.nl/assets/ui-audio |
| Space Kit | 太空/空间站 3D 模块（glTF 等多格式） | 1694 | `models/environment/kenney_space-kit/` | https://kenney.nl/assets/space-kit |
| Crosshair Pack | 准星贴图 | 2013 | `ui/kenney_crosshair-pack/` | https://kenney.nl/assets/crosshair-pack |
| Skyboxes | 天空盒纹理 | 12 | `textures/kenney_skyboxes/` | https://kenney.nl/assets/skyboxes |
| Particle Pack | 粒子贴图（烟/火/火花） | 96 png | `textures/kenney_particle-pack/` | https://kenney.nl/assets/particle-pack |
| Prototype Textures | 关卡 blockout 网格纹理 | 78 png | `textures/kenney_prototype-textures/` | https://kenney.nl/assets/prototype-textures |

> 注：Particle Pack 原始 zip 含「透明背景」与「黑背景」两套 PNG，本库只入**透明背景**版
> （Godot 粒子材质以带 alpha 的贴图为通用输入）；黑背景版与 Unity samples 未提取，
> 需要时从 `_downloads/kenney_particle-pack.zip` 重新解压。
> 全部 8 包于 2026-09-26 完成下载并解压入库，均已 `unzip -t` 校验。

## 3. Poly Pizza 模型（2026-09-26 经 `tools/harvest-polypizza.py` 抓取）

索引 JSON：`_downloads/polypizza-index.json`（含每条的页面/GLB 直链，可重新下载）。
| 模型 | 作者 | 授权 | 文件 | 来源页 |
|---|---|---|---|---|
| Mech Assault Walker | Alimayo Arango | CC-BY | `models/characters/polypizza/mech-assault-walker-6s3_n8xzzvo.glb` | https://poly.pizza/m/6s3_n8xzzvo |
| Mech | Quaternius | CC0 | `models/characters/polypizza/mech-o3Ps8z8ByP.glb` | https://poly.pizza/m/o3Ps8z8ByP |
| Giant Mech 🤖 | Chris Ross | CC-BY | `models/characters/polypizza/giant-mech-5l-n7PyvqOu.glb` | https://poly.pizza/m/5l-n7PyvqOu |
| Sentinel Mech | Tekano Bob | CC-BY | `models/characters/polypizza/sentinel-mech-aGSpAN8ONud.glb` | https://poly.pizza/m/aGSpAN8ONud |
| Mech | Quaternius | CC0 | `models/characters/polypizza/mech-D5wW2jDO42.glb` | https://poly.pizza/m/D5wW2jDO42 |
| Little Mech | Riley Florence | CC-BY | `models/characters/polypizza/little-mech-7ysTwVKOiMp.glb` | https://poly.pizza/m/7ysTwVKOiMp |
| Mech concept | Raul Yo | CC-BY | `models/characters/polypizza/mech-concept-51h2ELk0o6n.glb` | https://poly.pizza/m/51h2ELk0o6n |
| MechQuadruped | 3Donimus | CC-BY | `models/characters/polypizza/mechquadruped-5x1hRpbmdfo.glb` | https://poly.pizza/m/5x1hRpbmdfo |
| Animated Robot | Quaternius | CC0 | `models/characters/polypizza/animated-robot-QCm7qe9uNJ.glb` | https://poly.pizza/m/QCm7qe9uNJ |
| Carl | Matt Connors | CC-BY | `models/characters/polypizza/carl-1BQyXYZ9LPz.glb` | https://poly.pizza/m/1BQyXYZ9LPz |
| deep space robot | Tom De Wispelaere | CC-BY | `models/characters/polypizza/deep-space-robot-5jewvww0dlc.glb` | https://poly.pizza/m/5jewvww0dlc |
| Giant Robot | Dann Beeson | CC-BY | `models/characters/polypizza/giant-robot-1kbGZOnhOwf.glb` | https://poly.pizza/m/1kbGZOnhOwf |
| Butter Robot | Martin Calviello | CC-BY | `models/characters/polypizza/butter-robot-9HIzs__db3k.glb` | https://poly.pizza/m/9HIzs__db3k |
| Robot | Poly by Google | CC-BY | `models/characters/polypizza/robot-9A6cuitiB_4.glb` | https://poly.pizza/m/9A6cuitiB_4 |
| Robot | Polygonal Mind | CC0 | `models/characters/polypizza/robot-ejDr8lRglP.glb` | https://poly.pizza/m/ejDr8lRglP |
| Robot Enemy Flying | Quaternius | CC0 | `models/characters/polypizza/robot-enemy-flying-lF3jeRJwiH.glb` | https://poly.pizza/m/lF3jeRJwiH |
| Capacitor Rifle | Jordan Hang | CC-BY | `models/weapons/polypizza/capacitor-rifle-4sl07qCR4MB.glb` | https://poly.pizza/m/4sl07qCR4MB |
| Coil Gun | Vas Pupin | CC-BY | `models/weapons/polypizza/coil-gun-6uFWxPXtwYO.glb` | https://poly.pizza/m/6uFWxPXtwYO |
| Sci-Fi Shotgun | burunduk | CC-BY | `models/weapons/polypizza/sci-fi-shotgun-e1AuzGo7dL.glb` | https://poly.pizza/m/e1AuzGo7dL |
| Steampunk Rifle | Jake Sharp | CC-BY | `models/weapons/polypizza/steampunk-rifle-1aBSH8_oopt.glb` | https://poly.pizza/m/1aBSH8_oopt |
| Gun ver2 | Zhuoqun Robin Xu | CC-BY | `models/weapons/polypizza/gun-ver2-7OfsrgiJ-uN.glb` | https://poly.pizza/m/7OfsrgiJ-uN |
| Scifi Smg | Quaternius | CC0 | `models/weapons/polypizza/scifi-smg-NHYaHnTNIM.glb` | https://poly.pizza/m/NHYaHnTNIM |
| Scifi Sniper | Quaternius | CC0 | `models/weapons/polypizza/scifi-sniper-46615JyFm7.glb` | https://poly.pizza/m/46615JyFm7 |
| Pistol | Quaternius | CC0 | `models/weapons/polypizza/pistol-52kQzphmeF.glb` | https://poly.pizza/m/52kQzphmeF |
| Drone | NateGazzard | CC-BY | `models/characters/polypizza/drone-DNbUoMtG3H.glb` | https://poly.pizza/m/DNbUoMtG3H |
| Drone | Silly Fear | CC-BY | `models/characters/polypizza/drone-3Ae_y67lzvd.glb` | https://poly.pizza/m/3Ae_y67lzvd |
| Stinger Drone | Aaron Clifford | CC-BY | `models/characters/polypizza/stinger-drone-6CUQX98vha4.glb` | https://poly.pizza/m/6CUQX98vha4 |
| Bot Drone | Dave404 | CC-BY | `models/characters/polypizza/bot-drone-2iyQx2YscRq.glb` | https://poly.pizza/m/2iyQx2YscRq |
| Anti-Gravity Drone | Adam Marc Williams | CC-BY | `models/characters/polypizza/anti-gravity-drone-fiYuC73Xlwp.glb` | https://poly.pizza/m/fiYuC73Xlwp |
| Turret | Kenney | CC0 | `models/environment/polypizza/turret-mXKbcMPLSS.glb` | https://poly.pizza/m/mXKbcMPLSS |
| Gatelng Gun Turret | Zsky | CC-BY | `models/environment/polypizza/gatelng-gun-turret-T8ofhRSenf.glb` | https://poly.pizza/m/T8ofhRSenf |
| Turret Cannon | Quaternius | CC0 | `models/environment/polypizza/turret-cannon-mNJ6poH7Cp.glb` | https://poly.pizza/m/mNJ6poH7Cp |
| Double Turret | Kenney | CC0 | `models/environment/polypizza/double-turret-wMb4gh6STL.glb` | https://poly.pizza/m/wMb4gh6STL |
| Turret Gun | Quaternius | CC0 | `models/environment/polypizza/turret-gun-ekTQhbJId7.glb` | https://poly.pizza/m/ekTQhbJId7 |
| Scifi Gun | MiniPoly | CC0 | `models/weapons/polypizza/scifi-gun-kd1jjjCni7.glb` | https://poly.pizza/m/kd1jjjCni7 |
| Nintendo blaster | Alexander Brodin | CC-BY | `models/weapons/polypizza/nintendo-blaster-6mgzhAFknsj.glb` | https://poly.pizza/m/6mgzhAFknsj |
| Low Poly Blaster | Christian Hohlfeld | CC-BY | `models/weapons/polypizza/low-poly-blaster-fkaAiF8FInH.glb` | https://poly.pizza/m/fkaAiF8FInH |
| Rifle | Quaternius | CC0 | `models/weapons/polypizza/rifle-KjHL5JJrxU.glb` | https://poly.pizza/m/KjHL5JJrxU |
| Rocket Launcher | Quaternius | CC0 | `models/weapons/polypizza/rocket-launcher-GCqUvqleqN.glb` | https://poly.pizza/m/GCqUvqleqN |
| Blaster - E Type | Damon Pidhajecky | CC-BY | `models/weapons/polypizza/blaster-e-type-KgCR3STCKX.glb` | https://poly.pizza/m/KgCR3STCKX |

### 3b. 游戏 10 新增（2026-09-27，太阳系飞行射击 · 经 `harvest-polypizza.py` 抓取）

索引已扩充至 67 条（同上 `_downloads/polypizza-index.json`）。全部通过 GLB magic 校验；
抓取副产物中 6 件地面设施（火车站/加油站/铁路/电塔/摊位/沙漠岩）已剔除，不入册。

| 模型 | 作者 | 授权 | 文件 | 来源页 |
|---|---|---|---|---|
| Spaceship | Liz Reddington | CC-BY | `models/ships/polypizza/spaceship-5nWeu4IQXVX.glb` | https://poly.pizza/m/5nWeu4IQXVX |
| Spaceship | Quaternius | CC0 | `models/ships/polypizza/spaceship-uCeLfsdmNP.glb` | https://poly.pizza/m/uCeLfsdmNP |
| Spaceship | Liz Reddington | CC-BY | `models/ships/polypizza/spaceship-647DTebhyBD.glb` | https://poly.pizza/m/647DTebhyBD |
| T-65 X-Wing Starfighter | Ti Kawamoto | CC-BY | `models/ships/polypizza/t-65-x-wing-starfighter-100p3RNw-5Q.glb` | https://poly.pizza/m/100p3RNw-5Q |
| Spaceship | Liz Reddington | CC-BY | `models/ships/polypizza/spaceship-6eRDOiTxvOo.glb` | https://poly.pizza/m/6eRDOiTxvOo |
| Spaceship | Quaternius | CC0 | `models/ships/polypizza/spaceship-xNbtFQwirO.glb` | https://poly.pizza/m/xNbtFQwirO |
| Space Craft Speeder | Kenney | CC0 | `models/ships/polypizza/space-craft-speeder-mlQBUQRUpM.glb` | https://poly.pizza/m/mlQBUQRUpM |
| SpaceShip \| #1 | Danni Bittman | CC-BY | `models/ships/polypizza/spaceship-1-diV_lzJhYgF.glb` | https://poly.pizza/m/diV_lzJhYgF |
| Asteroid | Poly by Google | CC-BY | `models/environment/polypizza/asteroid-enaIlQWET9a.glb` | https://poly.pizza/m/enaIlQWET9a |
| spaceship | Faith Barnett | CC-BY | `models/ships/polypizza/spaceship-8IepyOXhyLu.glb` | https://poly.pizza/m/8IepyOXhyLu |
| Spaceship | Quaternius | CC0 | `models/ships/polypizza/spaceship-htfBk9vPfw.glb` | https://poly.pizza/m/htfBk9vPfw |
| Space Shuttle | Zoe XR | CC-BY | `models/ships/polypizza/space-shuttle-6YCLC70Z14h.glb` | https://poly.pizza/m/6YCLC70Z14h |
| Male Fighter | mastjie | CC0 | `models/ships/polypizza/male-fighter-GorWw41SFf.glb` | https://poly.pizza/m/GorWw41SFf |
| Jet | jeremy | CC-BY | `models/ships/polypizza/jet-6fyLMORhgGK.glb` | https://poly.pizza/m/6fyLMORhgGK |
| Female Fighter | mastjie | CC0 | `models/ships/polypizza/female-fighter-NfMffTkeBa.glb` | https://poly.pizza/m/NfMffTkeBa |
| Agile knight | Spiros Koutsourelis | CC-BY | `models/ships/polypizza/agile-knight-7aYuk5Rdlr-.glb` | https://poly.pizza/m/7aYuk5Rdlr- |
| Eye Fighter | Polygonal Mind | CC0 | `models/ships/polypizza/eye-fighter-3ghMF4tnfq.glb` | https://poly.pizza/m/3ghMF4tnfq |
| Low poly Fighter | Stephen Graybill | CC-BY | `models/ships/polypizza/low-poly-fighter-1fi8ZIDdFCP.glb` | https://poly.pizza/m/1fi8ZIDdFCP |
| Space Shuttle Orbiter | Zoe XR | CC-BY | `models/ships/polypizza/space-shuttle-orbiter-bIAMfx1bHVY.glb` | https://poly.pizza/m/bIAMfx1bHVY |
| Space Shuttle | Poly by Google | CC-BY | `models/ships/polypizza/space-shuttle-djxolbz_CYC.glb` | https://poly.pizza/m/djxolbz_CYC |
| Command pod | Poly by Google | CC-BY | `models/ships/polypizza/command-pod-8oI7oWBA1V8.glb` | https://poly.pizza/m/8oI7oWBA1V8 |
| Adrian's Space Shuttle | Adrian Hon | CC-BY | `models/ships/polypizza/adrian-x27-s-space-shuttle-2I_YhfMhsfT.glb` | https://poly.pizza/m/2I_YhfMhsfT |
| Base | Poly by Google | CC-BY | `models/environment/polypizza/base-dDZnz-9SYml.glb` | https://poly.pizza/m/dDZnz-9SYml |
| Asteroid | J-Toastie | CC-BY | `models/environment/polypizza/asteroid-YS1jpm3mNr.glb` | https://poly.pizza/m/YS1jpm3mNr |
| Asteroids | Jarlan Perez | CC-BY | `models/environment/polypizza/asteroids-9k18F9bT43N.glb` | https://poly.pizza/m/9k18F9bT43N |
| Asteroid 2 | J-Toastie | CC-BY | `models/environment/polypizza/asteroid-2-yuCzypJ0w4.glb` | https://poly.pizza/m/yuCzypJ0w4 |
| Comet | Poly by Google | CC-BY | `models/environment/polypizza/comet-ffzZSJOorck.glb` | https://poly.pizza/m/ffzZSJOorck |

> ⚠️ **T-65 X-Wing Starfighter 为《星球大战》同人作品**：CC-BY 只覆盖模型本身，
> 星战 IP 归迪士尼。仅供个人学习；若将来公开发布必须移除或替换。

---

## 4. 音乐（OpenGameArt，2026-09-27 下载）

> **逐项核对过授权页**（OpenGameArt 是混合授权站，搜索面板的 license 过滤参数不可信，
> 必须打开条目页读 `license-name`）。已**主动排除** CC-BY-SA 条目（dust-scifi-music 等）：
> 相同方式共享会传染到整部作品的音频，与「学习期后可能发布」冲突。

| 曲目 | 作者 | 授权 | 本地位置 | 来源页 | 用途 | 日期 |
|---|---|---|---|---|---|---|
| Scifi Main Theme: Menu | bogart-vgm | CC-BY 4.0 | `audio/music/main_theme.mp3` | https://opengameart.org/content/scifi-main-theme | 主菜单 / 开场简报 | 2026-09-27 |
| Scifi Action | bogart-vgm | CC-BY 4.0 | `audio/music/combat_loop.mp3` | https://opengameart.org/content/scifi-action | 战斗 | 2026-09-27 |
| Scifi Concentration (looped) | bogart-vgm | CC-BY 4.0 | `audio/music/tension_loop.mp3` | https://opengameart.org/content/scifi-concentration | 波次间歇 / 潜行铺垫 | 2026-09-27 |

**发布前动作**：CC-BY 4.0 允许商用但**要求署名**——若将来公开发布，需在制作人员名单加一行
「Music: bogart-vgm (OpenGameArt.org, CC-BY 4.0)」。

---

## 5. 已记录但暂未下载的源

| 源 | 原因 | 后续 |
|---|---|---|
| Quaternius 整站（Sci-Fi Essentials / Animated Mech / Universal Animation Library 等） | 页面 JS 渲染 + itch 分发，curl 拿不到直链 | 用无头浏览器抓下载按钮或手动下载 |
| Mixamo | 需 Adobe 账号登录 | 用户本人操作 |
| KayKit（GitHub: KayKit-Game-Assets） | 题材偏奇幻，06 暂不需要 | 2D/奇幻项目时直接 clone |
| OpenGameArt 音乐 | 未开始搜集 | 06 需要配乐时逐项核对授权 |

---

## 6. 太阳系纹理（Solar System Scope，2026-09-27 下载）

> **授权 CC BY 4.0**（已核对 Qt 官方 attribution 文档 `doc.qt.io/qt-6/qt3d-attribution-solar-system-scope.html`）。
> 直链格式 `https://www.solarsystemscope.com/textures/download/<文件名>`（需带浏览器 UA）。
> **发布前署名**：「Planetary textures: © Solar System Scope (solarsystemscope.com), CC BY 4.0」。
> 用途：游戏 10 太阳系飞行射击——行星/太阳用 SphereMesh + 等距柱状贴图，土星环用窄条纹理，
> 银河图作天空盒。全部经 `_scratch/verify_textures.py` 校验（magic + 真实分辨率 + 尺寸唯一）。

| 文件 | 内容 | 分辨率 | 本地位置 | 授权 | 日期 |
|---|---|---|---|---|---|
| 2k_sun.jpg | 太阳 | 2048×1024 | `textures/planets/2k_sun.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_mercury.jpg | 水星 | 2048×1024 | `textures/planets/2k_mercury.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_venus_atmosphere.jpg | 金星（大气） | 2048×1024 | `textures/planets/2k_venus_atmosphere.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_venus_surface.jpg | 金星（地表） | 2048×1024 | `textures/planets/2k_venus_surface.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_earth_daymap.jpg | 地球昼面 | 2048×1024 | `textures/planets/2k_earth_daymap.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_earth_nightmap.jpg | 地球夜面灯光 | 2048×1024 | `textures/planets/2k_earth_nightmap.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_earth_clouds.jpg | 地球云层 | 2048×1024 | `textures/planets/2k_earth_clouds.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_moon.jpg | 月球 | 2048×1024 | `textures/planets/2k_moon.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_mars.jpg | 火星 | 2048×1024 | `textures/planets/2k_mars.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_jupiter.jpg | 木星 | 2048×1024 | `textures/planets/2k_jupiter.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_saturn.jpg | 土星 | 2048×1024 | `textures/planets/2k_saturn.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_saturn_ring_alpha.png | 土星环（透明条） | 2048×125 | `textures/planets/2k_saturn_ring_alpha.png` | CC-BY 4.0 | 2026-09-27 |
| 2k_uranus.jpg | 天王星 | 2048×1024 | `textures/planets/2k_uranus.jpg` | CC-BY 4.0 | 2026-09-27 |
| 2k_neptune.jpg | 海王星 | 2048×1024 | `textures/planets/2k_neptune.jpg` | CC-BY 4.0 | 2026-09-27 |
| 8k_stars_milky_way.jpg | 银河星空（天空盒） | 8192×4096 | `textures/planets/8k_stars_milky_way.jpg` | CC-BY 4.0 | 2026-09-27 |
