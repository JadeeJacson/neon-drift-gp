# SOURCES.md — 素材来源与授权登记册

> **规则（2026-09-27 放宽）**：本 lab 全部产物**仅供制作人学习自用，不发布、不商用**，
> 所以授权范围不限于可商用——CC0 / CC-BY / CC-BY-NC / 站点自定义免费条款都可取用。
> 登记字段：名称 / 作者 / 授权 / 本地位置 / 来源 URL / 下载日期。
> 登记不是为了合规审查，是为了「万一将来要公开，知道该替换哪些」。
> 两条硬线：需要账号的源由本人操作（AI 不代持账号、不绕登录墙）；不碰付费盗版与任何 DRM 绕过。

## 0. 授权速览

| 授权 | 含义 | 本库数量 |
|---|---|---|
| CC0 | 公有领域，可任意使用（含商用） | 模型 16 + KayKit 9 角色 / 206 地牢件 / 470 六边形件 + Kenney 全部 + 08 的 2D 包（tileset/角色/字体/音效）+ 音乐 1 + 模板见下 |
| CC-BY | 需署名作者 | 模型 24 + 音乐 3（bogart-vgm，CC-BY 4.0）+ 08 的 Pixel Adventure 1 与音乐 3 首（CC-BY 3.0/4.0）|
| MIT | 代码模板，需保留许可声明 | 2（Jeh3no FPS 控制器、GUT） |

> **用途声明（2026-09-27 用户明确）**：本 lab 全部产物**仅供学习自用，不涉及任何商业行为**。
> 因此 CC-BY / 署名类素材在本库可直接使用；`CC-BY-SA` 的传染性条款也不再构成障碍。
> 若将来要公开发布，仍需按本表清理非可商用项并补署名，本表就是清理清单。

---

## 1. 代码模板

| 名称 | 作者 | 授权 | 本地位置 | 来源 | 日期 |
|---|---|---|---|---|---|
| Godot Advanced State Machine First Person Controller（泰坦陨落式移动：滑铲/墙跑/二段跳/dash/兔跳/相机系统） | Jeh3no | MIT | `templates/jeh3no-fps-controller/` | https://github.com/Jeh3no/Godot-Advanced-State-Machine-First-Person-Controller | 2026-09-26 |
| GUT 9.7.1（Godot Unit Test，GDScript 单元测试框架，`gut_cmdln.gd` 支持 headless CLI） | Butch Wesley (bitwes) | MIT | `projects/06-mech-fps/addons/gut/`（含 `LICENSE.md`） | https://github.com/bitwes/Gut （tag `v9.7.1`，经 codeload 抓取） | 2026-09-26 |
| GUT 9.7.1 共享副本 | 同上 | MIT | `templates/gut-9.7.1/`（从 06 工程内副本拷出，供 08+ 新工程直接取用，免重复下载） | 同上 | 2026-09-27 |
| Godot 官方 demo 集 · 2D 子集 15 组（kinematic_character / platformer / physics_platformer / finite_state_machine / navigation_astar / sprite_shaders / glow / lights_and_shadows / light2d_as_mask / dynamic_tilemap_layers / particles / tween / skeleton / instancing） | godotengine | MIT | `templates/godot-demo-projects/2d/`（461 文件，含仓库 LICENSE.txt） | https://github.com/godotengine/godot-demo-projects | 2026-09-27 |

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
| Car Kit | 低模载具 50 GLB（kart×5 / 跑车×2 / race-future / 路锥 / 可破坏碎片件；07 载具足球用） | 50 glb | `models/vehicles/kenney_car-kit/` | https://kenney.nl/assets/car-kit |
| City Kit (Commercial) | 城市建筑模块 41 GLB + 贴图（07 夜景街景用） | 41 glb | `models/environment/kenney_city-kit-commercial/` | https://kenney.nl/assets/city-kit-commercial |

> 注：Particle Pack 原始 zip 含「透明背景」与「黑背景」两套 PNG，本库只入**透明背景**版
> （Godot 粒子材质以带 alpha 的贴图为通用输入）；黑背景版与 Unity samples 未提取，
> 需要时从 `_downloads/kenney_particle-pack.zip` 重新解压。
> 全部 8 包于 2026-09-26 完成下载并解压入库，均已 `unzip -t` 校验。
> 2026-09-27 追加 2 包（07 载具足球）：Car Kit、City Kit (Commercial)，`unzip -t` 校验通过。

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

### 3.1 追加：体育件批抓（2026-09-27，07 载具足球 · 查询词 soccer ball / soccer goal / stadium）

| 模型 | 作者 | 授权 | 文件 | 来源页 |
|---|---|---|---|---|
| Simple soccer football | Smirnoff Alexander | CC-BY | `models/sports/polypizza/simple-soccer-football-57u6P7Sr7K0.glb` | https://poly.pizza/m/57u6P7Sr7K0 |
| Soccer ball | Poly by Google | CC-BY | `models/sports/polypizza/soccer-ball-fnDmeCySRhV.glb` | https://poly.pizza/m/fnDmeCySRhV |
| Soccer ball | jeremy | CC-BY | `models/sports/polypizza/soccer-ball-9z5905buuy3.glb` | https://poly.pizza/m/9z5905buuy3 |
| Football | Zsky | CC-BY | `models/sports/polypizza/football-tDblqBpmOZ.glb` | https://poly.pizza/m/tDblqBpmOZ |
| Soccer goal | Poly by Google | CC-BY | `models/sports/polypizza/soccer-goal-7t4hmicGHV4.glb` | https://poly.pizza/m/7t4hmicGHV4 |
| Soccer Field | Mark Steelman | CC-BY | `models/sports/polypizza/soccer-field-8yoy_wgAlof.glb` | https://poly.pizza/m/8yoy_wgAlof |
| beach ball | the_ normalgamer | CC-BY | `models/sports/polypizza/beach-ball-4IwPTeOmq6c.glb` | https://poly.pizza/m/4IwPTeOmq6c |
| pokeball | Exceptional_3D | CC0 | `models/sports/polypizza/pokeball-m8zAwR6eBA.glb` | https://poly.pizza/m/m8zAwR6eBA |
| Football stadium | Poly by Google | CC-BY | `models/sports/polypizza/football-stadium-6TZCkGh76m5.glb` | https://poly.pizza/m/6TZCkGh76m5 |
| Ballpark | Poly by Google | CC-BY | `models/sports/polypizza/ballpark-45Ez39JSdz6.glb` | https://poly.pizza/m/45Ez39JSdz6 |
| Stadium Seats | Zsky | CC-BY | `models/sports/polypizza/stadium-seats-KAHX68dbXO.glb` | https://poly.pizza/m/KAHX68dbXO |
| Stadium Seats | Zsky | CC-BY | `models/sports/polypizza/stadium-seats-3eKUbGjEPv.glb` | https://poly.pizza/m/3eKUbGjEPv |
| Stadium Seats | Zsky | CC-BY | `models/sports/polypizza/stadium-seats-wtYoArecHj.glb` | https://poly.pizza/m/wtYoArecHj |
| Coliseum | Poly by Google | CC-BY | `models/sports/polypizza/coliseum-4raJTBfhAfc.glb` | https://poly.pizza/m/4raJTBfhAfc |

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

## 5. 音效与音乐（2026-09-27 追加，07 载具足球）

> OGA 条目均打开条目页核对过 `license-name`；引擎循环与 Swishes 在同页有 CC-BY 备选，
> 取了更干净的 CC0 版本。intothenight 混音曲下载曾断流（3.27 MB < 页面标注 5.7 MB），
> 已用 `curl -C -` 续传补齐并复核两次续传字节数一致（路线图 §5.0 第 4 条教训的再次应用）。

| 名称 | 作者 | 授权 | 本地位置 | 来源页 | 用途 | 日期 |
|---|---|---|---|---|---|---|
| Racing Car Engine Sound Loops（6 档转速循环 WAV） | domasx2 | CC0 | `audio/sfx/oga_racing-engine-loops/`（loop_0–5.wav） | https://opengameart.org/content/racing-car-engine-sound-loops | 引擎转速音（随车速/油门切档） | 2026-09-27 |
| Swishes Sound Pack（13 条挥击气浪 WAV） | artisticdude | CC0 | `audio/sfx/oga_swishes/` | https://opengameart.org/content/swishes-sound-pack | boost 喷射 / 挥击 | 2026-09-27 |
| Free Crowd Cheering Sounds（11 条 MP3） | Gregor Quendel | CC-BY 4.0 | `audio/sfx/oga_crowd-cheering/` | https://opengameart.org/content/free-crowd-cheering-sounds | 进球 / 终场观众欢呼 | 2026-09-27 |
| Retroracing Menu (Synthwave) | Bogart VGM | CC-BY 4.0 | `audio/music/retroracing_menu.mp3` | https://opengameart.org/content/retroracing-menu-synthwave | 主菜单 | 2026-09-27 |
| Into the Night × Retroracing Nightlife mix | cosmac + Bogart VGM（glitchart 混音发布） | CC-BY 4.0 | `audio/music/intothenight_retroracing_mix.ogg` | https://opengameart.org/content/retroracing-nightlife-into-the-night-cosmac-bogart-vgm | 比赛进行 | 2026-09-27 |
| Music Jingles · Hit jingles（jingles_HIT03/09 两支曾被 07 取用；07 已废弃，库内母本保留） | Kenney | CC0 | lab 库 `audio/music/kenney_music-jingles/` | https://kenney.nl/assets/music-jingles | （历史：07 进球音） | 2026-09-27 |
| Font package · Kenney Future（曾被 07 取用；07 已废弃，库内母本保留） | Kenney | CC0 | lab 库 `fonts/` | https://kenney.nl（Font package，免费字体包） | （历史：07 HUD 字体） | 2026-09-27 |

**署名清单（万一将来公开需保留）**：Music: Bogart VGM / cosmac / glitchart / Gregor Quendel
（OpenGameArt.org，CC-BY 4.0）；Poly Pizza 各 CC-BY 模型作者见 §3 表格。

---

## 6. 已记录但暂未下载的源

| 源 | 原因 | 后续 |
|---|---|---|
| Quaternius 整站（Sci-Fi Essentials / Animated Mech / Universal Animation Library 等） | 页面 JS 渲染 + itch 分发，curl 拿不到直链 | 用无头浏览器抓下载按钮或手动下载 |
| Mixamo | 需 Adobe 账号登录 | 用户本人操作 |
| KayKit（GitHub: KayKit-Game-Assets） | 题材偏奇幻，06 暂不需要 | 2D/奇幻项目时直接 clone |
| OpenGameArt 音乐 | 未开始搜集 | 06 需要配乐时逐项核对授权 |

---

## 7. 11 号「轨道防线」专项（2026-09-27，3D 科幻塔防）

> **授权面放宽说明（制作人 2026-09-27 声明）**：本 lab 全部产物**仅学习自用，不涉及任何商业行为**，
> 故素材授权面从「CC0 优先」放宽到 **CC 全系（含 CC-BY / CC-BY-SA / NC 条款）**，仍逐项登记。
> 若将来要公开发布，发布前必须重新清理非可商用项——届时以本文件的「授权」列为准。
>
> **并发写入警告**：本目录为 lab 级共享库，多个项目并行下载。实测出现过同名 zip 被他人进程覆盖
> （`kenney_city-kit-industrial.zip` 3.67 MB → 1.01 MB）。11 号已在
> `projects/11-orbital-line/assets/` 另存自包含副本（经 `tools/extract-project-assets.py` 抽取）。

### 7.1 Kenney 包（全部 CC0 1.0，作者 Kenney，kenney.nl，2026-09-27 下载）

经 `tools/harvest-kenney.py` 抓取，全部 `zipfile.testzip()` CRC 校验通过后解压入库。
机器可读索引：`_downloads/kenney-index.json`（含 zip 直链，可断点重下）。

| 包 | 本地位置 | 文件数 | 来源页 |
|---|---|---|---|
| Tower Defense Kit（160 GLB：路径瓦片 / 分件塔 / 武器 / UFO 敌人） | `models/defense/kenney_tower-defense-kit/` | 812 | https://kenney.nl/assets/tower-defense-kit |
| City Kit (Industrial) 2.0 | `models/environment/kenney_city-kit-industrial/` | 201 | https://kenney.nl/assets/city-kit-industrial |
| Factory Kit 3.0 | `models/environment/kenney_factory-kit/` | 727 | https://kenney.nl/assets/factory-kit |
| Prototype Kit | `models/environment/kenney_prototype-kit/` | 740 | https://kenney.nl/assets/prototype-kit |
| Blocky Characters 2.0 | `models/characters/kenney_blocky-characters/` | 158 | https://kenney.nl/assets/blocky-characters |
| UI Pack | `ui/kenney_ui-pack/` | 1343 | https://kenney.nl/assets/ui-pack |
| Game Icons | `ui/icons/kenney_game-icons/` | 443 | https://kenney.nl/assets/game-icons |
| Game Icons Expansion | `ui/icons/kenney_game-icons-expansion/` | 832 | https://kenney.nl/assets/game-icons-expansion |
| Kenney Fonts | `ui/fonts/kenney_kenney-fonts/` | 14 | https://kenney.nl/assets/kenney-fonts |
| Digital Audio | `audio/sfx/kenney_digital-audio/` | 68 | https://kenney.nl/assets/digital-audio |
| Interface Sounds | `audio/sfx/kenney_interface-sounds/` | 104 | https://kenney.nl/assets/interface-sounds |
| RPG Audio | `audio/sfx/kenney_rpg-audio/` | 56 | https://kenney.nl/assets/rpg-audio |
| Music Jingles | `audio/music/kenney_music-jingles/` | 95 | https://kenney.nl/assets/music-jingles |

> 注：下载中途 6 个包遇代理 `502 Bad Gateway`（`urllib` 隧道失败），改用**详情页直链 + curl** 补齐
> （直链格式见路线图 §5.1）。`curl` 走系统代理配置，与 `urllib` 的隧道行为不同——这条差异值得记住。

### 7.2 Poly Pizza 补抓（2026-09-27，64 个 GLB，索引累计 104 条）

经 `tools/harvest-polypizza.py` 抓取。**逐条明细（名称 / 作者 / 授权 / 页面 URL / 文件名）见
`_downloads/polypizza-index.json` 的 `query` 字段**为下列关键词的条目，此处只登记本作实际取用的：

| 模型 | 作者 | 授权 | 本地位置 | 用途 |
|---|---|---|---|---|
| Cannon ×2 | Quaternius | CC0 | `models/defense/polypizza/cannon-*.glb` | 机炮塔 / 导弹塔 |
| Laser / Laser Attachment | Pichuliru | CC0 | `models/defense/polypizza/laser-*.glb` | 激光塔 |
| Tower / Guard Tower | Quaternius | CC0 | `models/defense/polypizza/tower-*.glb` | 塔基/装饰 |
| Missile Turret | Zsky | CC-BY | `models/defense/polypizza/missile-turret-RqnAj5N9fL.glb` | 导弹塔 |
| Pew Pew | Damon Pidhajecky | CC-BY | `models/defense/polypizza/pew-pew-9qGe3grmPlK.glb` | 备用塔型 |
| Tank ×6（3 个 CC0 / 3 个 CC-BY） | Quaternius 等 | 混合 | `models/characters/polypizza/tank-*.glb` | 装甲敌人 |
| Spider ×4、Giant Spider | Quaternius 等 | 混合 | `models/characters/polypizza/*spider*.glb` |  crawler 敌人 |
| AT-ST | Tom Meyer | CC-BY | `models/characters/polypizza/at-st-6jqEk8QiL0m.glb` | Boss 步行机 |
| Radar Dish / Roof Radar / Satellite Dish | 多位 | 混合 | `models/environment/polypizza/*radar*.glb` | 场景装饰 |
| Generator / Large Electric Generator / Arc Reactor | 多位 | CC-BY | `models/environment/polypizza/*generator*.glb` | 能量井塔装饰 |
| Shipping Container ×2 / Container Red | 多位 | 混合 | `models/environment/polypizza/*container*.glb` | 掩体/场景 |
| Satellite ×2 / Antenna / Space Station | Poly by Google 等 | 混合 | `models/environment/polypizza/satellite-*.glb` | 天基装饰 |
| Missile ×2 / Rocket | 多位 | 混合 | `models/weapons/polypizza/missile-*.glb` | 弹药实体 |

> 同批还抓到少数题材不符的模型（Adventurer、Running Man、Cobweb、Bell Tower、Stone Tower、
> Cthulhu Spider Guard 等），**留在库中但未取用**，状态在索引 JSON 里可查。

### 7.3 音乐（OpenGameArt，2026-09-27）

| 曲目 | 作者 | 授权 | 本地位置 | 来源页 | 用途 |
|---|---|---|---|---|---|
| Tower Defense Theme | DST | **CC0** | `audio/music/oga_tower-defense-theme1.mp3` | https://opengameart.org/content/tower-defense-theme | 建造/备战阶段 |
| Tower Defense Theme 3 | DST | **CC0** | `audio/music/oga_tower-defense-theme3.mp3` | https://opengameart.org/content/tower-defense-theme-3 | 波次进行 |

---

## 8. KayKit 素材（2026-09-27 下载 · 09 圣旗自走棋用）

> 作者 **Kay Lousberg**，全部 **CC0 1.0**（个人与商用均可、无需署名）。
> 来源是 GitHub 仓库 zip（`codeload` 直链，稳定），不是 itch.io——**Quaternius 的 itch 分发抓不到，
> KayKit 的 GitHub 直链是同类奇幻素材里最省事的一条路**。
> 仓库结构是 Unity 包：`<repo>/addons/<pkg>/{Characters/gltf, Assets/gltf, Textures}`，
> 用 `tools/extract-pack.py --strip 3 --include .glb,.gltf,.bin,.png` 抽取，
> 丢弃同名 `.obj`（体积约为 glTF 三倍且内容重复）。原始 zip 留在 `_downloads/` 不入库。

| 包 | 内容 | 入库文件 | 本地位置 | 来源 |
|---|---|---|---|---|
| Character Pack: Adventures | 5 角色（Barbarian / Knight / Mage / Rogue / Rogue_Hooded），**各 76 套骨骼动画** + 25 件武器配件 GLB | 72 | `models/fantasy/kaykit-adventures/` | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0 |
| Character Pack: Skeletons | 4 角色（Skeleton_Warrior / Rogue / Mage / Minion），**各 95 套动画**（多跳跃攻击等）+ 骷髅专属武器 GLB | 34 | `models/fantasy/kaykit-skeletons/` | https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0 |
| Dungeon Remastered | 200+ 模块化地牢件（墙/门/楼梯/柱/箱/桶/烛台/宝箱/地面），**文件名是 `xxx.gltf.glb` 双后缀** | 206 | `models/environment/kaykit_dungeon/` | https://github.com/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0 |
| Medieval Hexagon Pack | 中世纪六边形地块（草地/水/道路/河流/山/树/城墙/栅栏 + 4 色系建筑）+ 道具 | 470 | `models/environment/kaykit_hexpack/` | https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0 |

**实测量化**（用 Python 直读 glTF JSON chunk 解析 `animations` 与 `accessors` 包围盒，不靠目测）：

- 9 个角色包围盒：高 2.17–3.44 m、宽约 1.94 m，**尺度基本一致**。
  与 06 的 Poly Pizza 素材（0.59 m～19.31 m，差 30 倍）形成对照——**09 不需要逐模型缩放表**。
- 可用动画名（自走棋直接要用的）：`Idle` / `Walk` / `Run` / 近战五种（Chop、Slice、Slice_Diagonal、
  Slice_Horizontal、Stab）/ 远程 `1H_Ranged_Aiming`·`Shoot`·`Reload` / 受击 / 死亡 / 跳跃 / 施法。

**两个不实测就会踩的坑**（06 的教训写在 `docs/00` §5.0b）：

1. **Adventurers 角色 GLB 里 `1H_Sword` / `2H_Sword` / `Round_Shield` / `Rectangle_Shield` /
   `Spike_Shield` 五个武器节点全部带网格**，导入后骑士会同时挂 5 把武器。进场必须显式隐藏
   选定槽位以外的全部武器节点。
2. **Skeletons 角色 GLB 完全不含武器**，只有骨骼（`root` / `hand.r` / `hand.l` / `handslot.*`）。
   武器是独立 GLB（`Skeleton_Blade` / `Skeleton_Axe` / `Skeleton_Staff` / `Skeleton_Shield_*` / `Skeleton_Arrow`…），
   需 `BoneAttachment3D` 挂到 `hand.r`，缩放与朝向要按包围盒实测校准。

## 9. 09 追加的 Kenney 包（全部 CC0，作者 Kenney，2026-09-27 下载）

| 包 | 内容 | 入库文件 | 本地位置 | 来源页 |
|---|---|---|---|---|
| RPG Audio | 51 个 RPG 拟音（脚步/翻书/皮革/金属/钱币/刀抽出） | 106 | `audio/sfx/kenney_rpg-audio/` | https://kenney.nl/assets/rpg-audio |
| Music Jingles | 86 个短音乐（5 风格 × 17：HIT/NES/PIZZI/SAX/STEEL） | 174 | `audio/music/kenney_music-jingles/` | https://kenney.nl/assets/music-jingles |
| Digital Audio | 63 个电子/UI 音 | 129 | `audio/sfx/kenney_digital-audio/` | https://kenney.nl/assets/digital-audio |
| Game Icons | 420 个游戏图标 PNG（技能/属性/状态图标） | 426 | `ui/kenney_game-icons/` | https://kenney.nl/assets/game-icons |
| Fantasy UI Borders | 280 个奇幻风 UI 边框/装饰 PNG | 283 | `ui/kenney_fantasy-ui-borders/` | https://kenney.nl/assets/fantasy-ui-borders |
| UI Pack | 868 个 UI 面板/按钮 PNG + 2 个字体 | 1315 | `ui/kenney_ui-pack/` | https://kenney.nl/assets/ui-pack |

> 抽包命令形如 `python tools/extract-pack.py assets/_downloads/kenney_rpg-audio.zip
> assets/audio/sfx/kenney_rpg-audio --include .ogg,.txt --flat`。

## 10. 09 的 BGM（2026-09-27 下载，OpenGameArt · 全部 **CC0 1.0**）

> OGA 是混合授权站、且**页面上的 license 过滤参数不可信**，所以每首都打开条目页 grep 了
> `creativecommons.org/...` 确认，三首均为 `publicdomain/zero/1.0`（CC0，可商用、无需署名）。
> 下载前该站曾整站 502（另一路同时段能通，判定为间歇故障），重试即成功。
> 文件头已校验：`FF FB`（MPEG 帧同步）或 `49 44 33`（ID3），不是伪装成 mp3 的错误页。

| 曲目 | 作者 | 授权 | 本地位置 | 用途 | 来源页 |
|---|---|---|---|---|---|
| Town Theme RPG（竖琴与牧笛，1.3 MB） | PixelSphere 作者 | **CC0 1.0** | `audio/music/oga_fantasy_town.mp3` | 备战 / 商店 / 招募阶段 | https://opengameart.org/content/town-theme-rpg |
| Medieval: Battle（3.2 MB） | — | **CC0 1.0** | `audio/music/oga_medieval_battle.mp3` | 战斗阶段主曲 | https://opengameart.org/content/medieval-battle |
| JRPG Epic Rock Battle Theme #1（官方 loop 单曲 2.9 MB） | — | **CC0 1.0** | `audio/music/oga_jrpg_battle_loop.mp3` | 战斗阶段备选 / Boss 战 | https://opengameart.org/content/jrpg-epic-rock-battle-theme-1 |

**备选池**（CC0，需要时再下）：Medieval: The Old Tower Inn（带 loop 版）
https://opengameart.org/content/medieval-the-old-tower-inn ·
Fantasy Orchestral Theme / Village_1（合集页）https://opengameart.org/content/cc0-music-0 ·
incompetech `pieces.json`（1442 首，CC-BY 4.0，改版后直链待重新定位）。

---

## 11. 08 霓虹深潜的 2D 像素素材（2026-09-27 下载，`tools/asset-manifest-08.json` 可重跑）

> 下载与解包全部走 `tools/fetch_assets.py`（清单驱动：curl 主路径 + zip 完整性校验 + 一包一目录），
> 结果明细在 `assets/_downloads/fetch-report-08.json`。原始 zip 留在 `_downloads/` 不入库。

### 11.1 Kenney（全部 CC0，作者 Kenney，kenney.nl）

| 包 | 内容 | 入库文件 | 本地位置 | 来源页 |
|---|---|---|---|---|
| Pixel Platformer | 200 个 16×16 平台跳跃 tile + 角色 + 背景层 | 252 | `tilesets/kenney_pixel-platformer/` | https://kenney.nl/assets/pixel-platformer |
| Roguelike RPG Pack | 1700 个 16×16 tile（墙/地/装饰/角色）图集 | 11 | `tilesets/kenney_roguelike-rpg-pack/` | https://kenney.nl/assets/roguelike-rpg-pack |
| Mini Dungeon | 8×8 迷你地牢 tile | 162 | `tilesets/kenney_mini-dungeon/` | https://kenney.nl/assets/mini-dungeon |
| Input Prompts | 1500 个键鼠/手柄提示图标（HUD 操作引导） | 4667 | `ui/kenney_input-prompts/` | https://kenney.nl/assets/input-prompts |
| Kenney Fonts | 11 个 TTF（Kenney Pixel / Future / Rocket 等） | 13 | `fonts/kenney_fonts/` | https://kenney.nl/assets/kenney-fonts |

> RPG Audio / Digital Audio 两包与 §9（09 圣旗自走棋）同源，本库只留一份（路径就是 §9 那两条）。
> 教训记录：两个包曾平铺解到同一个 `dest`，导致 `License.txt`、`Tiles/` 这类同名条目互相覆盖；
> 已改成「一包一目录」并加了目的地碰撞保护（详见 `docs/08-立项-霓虹深潜.md` §7 第 5 条）。

### 11.2 OpenGameArt（混合授权，逐条核对条目页）

| 素材 | 作者 | 授权 | 本地位置 | 来源页 |
|---|---|---|---|---|
| **Pixel Adventure 1**（主角 4 套全帧动画：idle/run/jump/fall/attack/double-jump/hang/dust + 20 敌人 + 地形/陷阱/背景/菜单，175 文件） | Pixel Frog | **CC-BY 4.0**（需署名） | `sprites/pixel-adventure-1/` | https://opengameart.org/content/pixel-adventure-1 |
| Knight Hero Platformer Animation Pack（骑士跑/跳/攻击/翻滚，17 文件） | PixiVan | CC0 | `sprites/oga_knight-hero/` | https://opengameart.org/content/knight-hero-platformer-animation-pack |
| Retro Lines 16×16 Platformer Assets（极简线条，霓虹剪影风备选） | — | CC0 | `tilesets/oga_retro-lines/` | https://opengameart.org/content/retro-lines-16x16-platformer-assets |
| Cyberpunk noir tileset（`void-tiles.png`，作霓虹调色盘参照） | — | CC-BY 4.0 | `references/neon-tileset_cyberpunk-noir.png` | https://opengameart.org/content/cyberpunk-noir-tileset |
| Sirens in Darkness（探索段 BGM，6.7 MB） | cynicinmusic | **CC0** | `audio/music/sirens-in-darkness_cynicinmusic.mp3` | https://opengameart.org/content/sirens-in-darkness |
| Perpetual Tension（战斗段 BGM，6.2 MB） | Zander Noriega | CC-BY 3.0 | `audio/music/perpetual-tension_zander-noriega.mp3` | https://opengameart.org/content/perpetual-tension |
| In Darkness（Boss 段 BGM，5.6 MB） | Of Far Different Nature | CC-BY 4.0 | `audio/music/in-darkness_of-far-different-nature.mp3` | https://opengameart.org/content/in-darkness |
| Hesitation（电子 synth 短循环，194 KB） | P02LYP0L | CC-BY 3.0 | `audio/music/hesitation-synthloop_p02lypol.mp3` | https://opengameart.org/content/hesitation-synth-electronic-loop |

**Pixel Adventure 1 为什么走 OGA 而不是 itch**：itch.io 在本机网络层不通（连不上，非 403），
而 OGA 上有完整镜像且 `/sites/default/files/` 直链可 curl。镜像体积只有 201 KB
（动画帧以 PNG 序列形式发布，附带的 Aseprite 源文件只有一个 `Royal Knight Platformer.ase`），
但主角 8 类状态帧齐全，够 08 用。

### 11.3 取源探测结论（避免下次重复踩）

| 源 | 状态 | 说明 |
|---|---|---|
| kenney.nl | ✅ 详情页弹窗直链可 curl | **hash 目录名含横杠**（`6b296f9ecf-1677589334`），正则必须放行 `-`，否则 0 命中会被误判成「站变了」 |
| opengameart.org | ✅ 条目页 + `/sites/default/files/` 直链可 curl | 搜索页 SSR，`/content/<slug>` 可解析；偶发连接重置，重试即通 |
| itch.io | ❌ 本机连不上 | 需要时另找镜像，不指望原站 |
| github.com / raw.githubusercontent.com | ❌ 连接重置 | 但 `api.github.com`（tree JSON）+ `cdn.jsdelivr.net/gh/...`（单文件）✅ 通 → `tools/fetch_gh_subset.py` |
| jsDelivr 目录列表 | ❌ 50 MB 仓库上限 | 单文件路径不受此限，所以「先列 tree 再逐文件取」可行 |
| 出口带宽 | ⚠️ 13–140 KB/s | 大件先 `python tools/head_probe.py <url>` 看 Content-Length 再决定 |

---

## 12. 游戏 10 SOLAR WING 素材（2026-09-27 新增 · 太阳系飞行射击）

> 本作随 `projects/10-solar-wing/` 并入主仓库；物理文件已随合并进入 `assets/`，
> 此处仅补齐授权登记。音乐（bogart-vgm 三首）已登记于 §4，不再重复。

### 12.1 Poly Pizza 飞船 / 小行星 / 彗星（2026-09-27，太阳系飞行射击 · 经 `harvest-polypizza.py` 抓取）

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

### 12.2 太阳系纹理（Solar System Scope，2026-09-27 下载）

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
