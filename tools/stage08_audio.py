"""把 08 要用的 Kenney 音效按「干净文件名」复制进项目目录。

按文件名在 lab 库里搜索而不是硬写路径：Kenney 包内部的嵌套层级在仓库里被整理过两次
（见 SOURCES.md §2 的注），硬编码相对路径迟早失效，而文件名是稳定的。
"""
from pathlib import Path

LAB = Path(__file__).resolve().parents[1]
LIB = LAB / 'assets' / 'audio' / 'sfx'
DST = LAB / 'projects' / '08-neon-dive' / 'assets' / 'audio' / 'sfx'

# 目标名 → 库里的原始文件名（带编号的一律取第 0 个变体）
PICKS = {
    'hit_heavy_00.ogg': 'impactPunch_heavy_000.ogg',
    'hit_heavy_01.ogg': 'impactPunch_heavy_001.ogg',
    'hit_medium_00.ogg': 'impactPunch_medium_000.ogg',
    'hit_medium_01.ogg': 'impactPunch_medium_001.ogg',
    'swing.ogg': 'chop.ogg',
    'parry_zap.ogg': 'zap1.ogg',
    'ui_denied.ogg': 'twoTone1.ogg',
    'kill_confirm.ogg': 'threeTone1.ogg',
    # 前摇预告音：敌人开始蓄力时要有一个上行音，否则「看得到但反不过来」
    'warn.ogg': 'zapThreeToneUp.ogg',
    'shoot.ogg': 'laser2.ogg',
    # 弹台与成就：两个都是「好事发生」，但不能和打击音混用
    'bounce.ogg': 'phaseJump1.ogg',
    'achieve.ogg': 'powerUp11.ogg',
    'step_00.ogg': 'footstep_concrete_000.ogg',
    'step_01.ogg': 'footstep_concrete_001.ogg',
}


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    index: dict[str, Path] = {}
    for p in LIB.rglob('*.ogg'):
        index.setdefault(p.name, p)
    missing = []
    for out_name, src_name in PICKS.items():
        src = index.get(src_name)
        if src is None:
            missing.append(src_name)
            continue
        (DST / out_name).write_bytes(src.read_bytes())
        print(f'{out_name:<18} ← {src.relative_to(LIB)}  ({src.stat().st_size} B)')
    if missing:
        print('库里找不到：', missing)


if __name__ == '__main__':
    main()
