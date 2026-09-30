"""把 08 要用的 Kenney Input Prompts 图标按干净文件名复制进项目目录。

按文件名在库里搜（不硬写嵌套路径）：Kenney 包内部层级在仓库里被整理过，
路径迟早失效，而 `keyboard_d.png` 这样的文件名是稳定的。
"""
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
LIB = LAB / 'assets' / 'ui' / 'kenney_input-prompts'
DST = LAB / 'projects' / '08-neon-dive' / 'assets' / 'ui'

# 目标名 → 库里的原始文件名
PICKS = {
    'key_a.png': 'keyboard_a.png',
    'key_d.png': 'keyboard_d.png',
    'key_space.png': 'keyboard_space.png',
    'key_shift.png': 'keyboard_shift.png',
    'key_ctrl.png': 'keyboard_ctrl.png',
    'key_j.png': 'keyboard_j.png',
    'key_k.png': 'keyboard_k.png',
    'key_l.png': 'keyboard_l.png',
    'key_u.png': 'keyboard_u.png',
    'key_r.png': 'keyboard_r.png',
    'key_esc.png': 'keyboard_escape.png',
}


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    index: dict[str, Path] = {}
    for p in LIB.rglob('*.png'):
        index.setdefault(p.name.lower(), p)
    missing = []
    for out_name, src_name in PICKS.items():
        src = index.get(src_name.lower())
        if src is None:
            missing.append(src_name)
            continue
        (DST / out_name).write_bytes(src.read_bytes())
        print(f'{out_name:<16} ← {src.relative_to(LIB)}  ({src.stat().st_size} B)')
    if missing:
        print('库里找不到：', missing)
        print('可用的相近名：', sorted(n for n in index if n.startswith('keyboard_l') or 'space' in n)[:12])


if __name__ == '__main__':
    main()
