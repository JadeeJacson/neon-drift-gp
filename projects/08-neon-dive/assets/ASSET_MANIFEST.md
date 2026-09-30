# 08 取用素材清单（实测尺寸与分帧）

> 由 `tools/gen_asset_manifest.py` 读 PNG IHDR 生成，尺寸是量出来的不是抄的。
> 源库位置与授权见 lab 根 `assets/SOURCES.md` §11；这里只登记「本项目实际取用的副本」。

| 文件 | 像素尺寸 | 单帧 | 网格 |
|---|---|---|---|
| `sprites/enemies_20.png` | 630×500 | — | **非等分拼贴**，用前先在 Aseprite 里拆 |
| `sprites/mask_dude_double.png` | 192×32 | 32×32 | 6×1 = 6 帧 |
| `sprites/mask_dude_fall.png` | 32×32 | 32×32 | 1×1 = 1 帧 |
| `sprites/mask_dude_hit.png` | 224×32 | 32×32 | 7×1 = 7 帧 |
| `sprites/mask_dude_idle.png` | 352×32 | 32×32 | 11×1 = 11 帧 |
| `sprites/mask_dude_jump.png` | 32×32 | 32×32 | 1×1 = 1 帧 |
| `sprites/mask_dude_run.png` | 384×32 | 32×32 | 12×1 = 12 帧 |
| `sprites/mask_dude_wall.png` | 160×32 | 32×32 | 5×1 = 5 帧 |
| `sprites/ninja_frog_double_jump.png` | 192×32 | 32×32 | 6×1 = 6 帧 |
| `sprites/ninja_frog_fall.png` | 32×32 | 32×32 | 1×1 = 1 帧 |
| `sprites/ninja_frog_hit.png` | 224×32 | 32×32 | 7×1 = 7 帧 |
| `sprites/ninja_frog_idle.png` | 352×32 | 32×32 | 11×1 = 11 帧 |
| `sprites/ninja_frog_jump.png` | 32×32 | 32×32 | 1×1 = 1 帧 |
| `sprites/ninja_frog_run.png` | 384×32 | 32×32 | 12×1 = 12 帧 |
| `sprites/ninja_frog_wall_jump.png` | 160×32 | 32×32 | 5×1 = 5 帧 |
| `sprites/pink_man_double.png` | 192×32 | 32×32 | 6×1 = 6 帧 |
| `sprites/pink_man_fall.png` | 32×32 | 32×32 | 1×1 = 1 帧 |
| `sprites/pink_man_hit.png` | 224×32 | 32×32 | 7×1 = 7 帧 |
| `sprites/pink_man_idle.png` | 352×32 | 32×32 | 11×1 = 11 帧 |
| `sprites/pink_man_jump.png` | 32×32 | 32×32 | 1×1 = 1 帧 |
| `sprites/pink_man_run.png` | 384×32 | 32×32 | 12×1 = 12 帧 |
| `sprites/pink_man_wall.png` | 160×32 | 32×32 | 5×1 = 5 帧 |
| `sprites/retro_lines_player.png` | 112×64 | — | **非等分拼贴**，用前先在 Aseprite 里拆 |
| `sprites/virtual_guy_double.png` | 192×32 | 32×32 | 6×1 = 6 帧 |
| `sprites/virtual_guy_fall.png` | 32×32 | 32×32 | 1×1 = 1 帧 |
| `sprites/virtual_guy_hit.png` | 224×32 | 32×32 | 7×1 = 7 帧 |
| `sprites/virtual_guy_idle.png` | 352×32 | 32×32 | 11×1 = 11 帧 |
| `sprites/virtual_guy_jump.png` | 32×32 | 32×32 | 1×1 = 1 帧 |
| `sprites/virtual_guy_run.png` | 384×32 | 32×32 | 12×1 = 12 帧 |
| `sprites/virtual_guy_wall.png` | 160×32 | 32×32 | 5×1 = 5 帧 |
| `tiles/kenney_tilemap_backgrounds.png` | 192×72 | — | **非等分拼贴**，用前先在 Aseprite 里拆 |
| `tiles/kenney_tilemap_packed.png` | 360×162 | — | **非等分拼贴**，用前先在 Aseprite 里拆 |
| `tiles/retro_lines_tiles.png` | 320×384 | 16×16 | 20×24 = 480 帧 |
| `tiles/terrain_16.png` | 352×176 | — | **非等分拼贴**，用前先在 Aseprite 里拆 |
| `bg/bg_blue.png` | 64×64 | 32×32 | 2×2 = 4 帧 |
| `bg/bg_pink.png` | 64×64 | 32×32 | 2×2 = 4 帧 |

## 音效（从 Kenney CC0 包改名取用，源名在 `tools/stage08_audio.py`）

| 文件 | 体积 |
|---|---|
| `audio/sfx/hit_heavy_00.ogg` | 11 KB |
| `audio/sfx/hit_heavy_01.ogg` | 11 KB |
| `audio/sfx/hit_medium_00.ogg` | 9 KB |
| `audio/sfx/hit_medium_01.ogg` | 8 KB |
| `audio/sfx/kill_confirm.ogg` | 7 KB |
| `audio/sfx/parry_zap.ogg` | 8 KB |
| `audio/sfx/step_00.ogg` | 6 KB |
| `audio/sfx/step_01.ogg` | 6 KB |
| `audio/sfx/swing.ogg` | 9 KB |
| `audio/sfx/ui_denied.ogg` | 7 KB |

## 用的时候要注意

- `ninja_frog_*` / `mask_dude_*` / `pink_man_*` / `virtual_guy_*`：横排帧表，
  `Sprite2D.hframes = 宽/32`（属性名是 `hframes` 不是 `h_frames`，路线图 §5.0c 第 4 条）。
- `enemies_20.png` 是 630×500 的**非等分拼贴图**，不能按网格切（会切出灰色碎片，
  调色实验室第一版就翻在这）。要当敌人素材用得先在 Aseprite 里按角色拆图。
- `terrain_16.png` 22×11 格里只有左上灰石组与左下青绿科技组是冷色，其余是黄/橙/红暖色；
  霓虹场景优先用冷色组。实验室那套自动挑 tile 的判据**不要沿用到正式关卡**，
  手工选索引并写回本表（原因见 docs/08 §9）。
- `kenney_tilemap_packed.png` / `retro_lines_tiles.png` 是备选美术方向（剪影霓虹）的原料，
  尚未进正式场景。
