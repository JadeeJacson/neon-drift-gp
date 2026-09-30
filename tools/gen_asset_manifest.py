"""生成 projects/08-neon-dive/assets/ASSET_MANIFEST.md：实测像素尺寸与等分帧表的分帧数。

为什么要机器量而不是手写：06 的教训是 Poly Pizza 模型尺度差 30 倍，靠目测必翻车；
2D 同理——Pixel Adventure 文件名里写着「(32x32)」，但整张图是几帧横排必须量，
不量就会把 hframes 拍脑袋写错（本轮真的写错过一次）。

用法：python tools/gen_asset_manifest.py
"""
import struct
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
PROJ = LAB / 'projects' / '08-neon-dive' / 'assets'


def png_size(p: Path) -> tuple[int, int]:
    with open(p, 'rb') as f:
        head = f.read(24)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        return (0, 0)
    return struct.unpack('>II', head[16:24])


def rows(sub: str) -> list[str]:
    out = []
    for p in sorted((PROJ / sub).glob('*.png')):
        w, h = png_size(p)
        if w % 32 or h % 32:
            # 非 32 整除 = 不是等分帧表（Pixel Adventure 的 20 Enemies 就是这种拼贴图）
            out.append(f'| `{sub}/{p.name}` | {w}×{h} | — | **非等分拼贴**，用前先在 Aseprite 里拆 |')
            continue
        cell = 32 if h % 32 == 0 and h <= 64 else 16
        cols, rws = w // cell, h // cell
        out.append(f'| `{sub}/{p.name}` | {w}×{h} | {cell}×{cell} | {cols}×{rws} = {cols * rws} 帧 |')
    return out


def audio_rows() -> list[str]:
    """项目目录里的音效：只列文件名与体积，不猜用途（用途在 hit_fx.gd 的 KINDS 里）"""
    d = PROJ / 'audio' / 'sfx'
    if not d.exists():
        return []
    out = ['', '## 音效（从 Kenney CC0 包改名取用，源名在 `tools/stage08_audio.py`）', '',
           '| 文件 | 体积 |', '|---|---|']
    for p in sorted(d.glob('*.ogg')):
        out.append(f'| `audio/sfx/{p.name}` | {p.stat().st_size / 1024:.0f} KB |')
    return out


def main() -> None:
    lines = [
        '# 08 取用素材清单（实测尺寸与分帧）',
        '',
        '> 由 `tools/gen_asset_manifest.py` 读 PNG IHDR 生成，尺寸是量出来的不是抄的。',
        '> 源库位置与授权见 lab 根 `assets/SOURCES.md` §11；这里只登记「本项目实际取用的副本」。',
        '',
        '| 文件 | 像素尺寸 | 单帧 | 网格 |',
        '|---|---|---|---|',
    ]
    for sub in ('sprites', 'tiles', 'bg'):
        if (PROJ / sub).exists():
            lines += rows(sub)
    lines += audio_rows()
    lines += [
        '',
        '## 用的时候要注意',
        '',
        '- `ninja_frog_*` / `mask_dude_*` / `pink_man_*` / `virtual_guy_*`：横排帧表，',
        '  `Sprite2D.hframes = 宽/32`（属性名是 `hframes` 不是 `h_frames`，路线图 §5.0c 第 4 条）。',
        '- `enemies_20.png` 是 630×500 的**非等分拼贴图**，不能按网格切（会切出灰色碎片，',
        '  调色实验室第一版就翻在这）。要当敌人素材用得先在 Aseprite 里按角色拆图。',
        '- `terrain_16.png` 22×11 格里只有左上灰石组与左下青绿科技组是冷色，其余是黄/橙/红暖色；',
        '  霓虹场景优先用冷色组。实验室那套自动挑 tile 的判据**不要沿用到正式关卡**，',
        '  手工选索引并写回本表（原因见 docs/08 §9）。',
        '- `kenney_tilemap_packed.png` / `retro_lines_tiles.png` 是备选美术方向（剪影霓虹）的原料，',
        '  尚未进正式场景。',
        '',
    ]
    out = PROJ / 'ASSET_MANIFEST.md'
    out.write_text('\n'.join(lines), encoding='utf-8')
    print(f'写入 {out.relative_to(LAB)}（{len(lines)} 行）')


if __name__ == '__main__':
    main()

