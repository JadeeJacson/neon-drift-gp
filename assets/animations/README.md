# animations/ — 本目录为空，且**这是结论，不是缺口**

（2026-09-26 校正。留这个 README 是为了防止下一个会话又把空目录当成素材缺口去抓 Quaternius。）

## 为什么不需要外部动画库

正式期启动时曾判定「06 缺角色动画，需要抓 Quaternius Universal Animation Library」，
这个判定是**错的**——根因是没解析 glTF 的 `animations` 字段就下了结论。
用 `projects/06-mech-fps/tools/verify_assets.gd` 实测后确认：

| 模型 | 内置骨骼动画 | 用途 |
|---|---|---|
| `trooper_mech.glb` | **17 套**：Idle / Walk / Run / Shoot_Big / Shoot_Small / HitRecieve_1/2 / Death / Jump / Kick / Pickup / Yes / No / Hello / Dance … | 中距射击型，动画最全，够做完整敌人 AI |
| `swarm_drone.glb` | **6 套**：Idle / Walk / Run / Shoot / Attack / Dead | 蜂群 |
| `charger_mechquadruped.glb` | 0 | **程序化**：分件 pivot 摆动 |
| `heavy_assault_walker.glb` | 0 | **程序化**：分件 pivot 摆动 |

刚性机械体本来更适合程序化驱动，不追求有机感——这套做法沿用练习期 04 已验证的
分件 pivot 方法论（摆动相位由**真实位移**驱动，站定不摆、跑起来摆幅大）。

## 若将来真的要补动画

优先级顺序（不要直接抓库）：

1. `mixamo.com` 的 FBX → Godot 需转换器，尽量避免；
2. Quaternius Universal Animation Library：整站 JS 渲染 + itch 分发，`curl` 拿不到直链，
   需无头浏览器或手动下载（见 docs/00 §3.1 状态表）；
3. KayKit Animated Models（GitHub 直链可用，CC0，但题材偏奇幻）。

细节见 `projects/06-mech-fps/assets/ASSET_MANIFEST.md` 第 1 节。
