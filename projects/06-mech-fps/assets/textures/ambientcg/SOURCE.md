# ambientCG 表面套图（PBR）

授权：**CC0 1.0**（Public Domain），可任意使用，无需署名。
下载日期：2026-09-27。取的是 `1K-JPG` 档（工程内 blockout 用不到 2K/4K，包体小一半）。

| 套图 | 来源 URL | 本地取了哪几张 | 用在哪 |
|---|---|---|---|
| MetalPlates001 | https://ambientcg.com/a/MetalPlates001 | Color / NormalGL / Roughness / Metalness | 竞技场地面、高台、墙跑墙段、掩体（`tools/build_arena.gd` 的 `PIECE_SURFACE`） |
| Concrete002 | https://ambientcg.com/a/Concrete002 | Color / NormalGL / Roughness（该套无 Metalness，非金属材质本就不需要） | 四面外墙、斜坡 |

lab 根留了一份完整原件在 `assets/textures/ambientcg/`（含 Displacement / NormalDX / .blend / .usdc，
工程只拷走渲染要用的那几张，避免把 4 MB 的 Blender 文件塞进 Godot 导入缓存）。

## 两个会再踩的坑
1. **NormalGL 不是 NormalDX**：ambientCG 两种都发，OpenGL 的 G 通道朝上、DirectX 朝下。
   Godot 用 OpenGL 约定，接错的话凹凸方向会反过来（光照下像凹的地方凸出来）。
2. **下载直链要带分辨率后缀**：`https://ambientcg.com/get?file=Concrete002_1K-JPG.zip`。
   写成 `file=Concrete002-JPG.zip` 一律 404，会误判成「这个 ID 不存在」。
