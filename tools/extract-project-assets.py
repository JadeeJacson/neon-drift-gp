# extract-project-assets.py — 从共享 assets/ 抽取「工程自包含」素材副本
#
# 为什么需要它（2026-09-27 实测的并发教训）：
#   assets/ 是 lab 级共享库，多个项目并行制作时会同时往 assets/_downloads/ 写文件，
#   实测出现过同名 zip 被别的进程覆盖（city-kit-industrial 3.67 MB → 1.01 MB）。
#   因此每个工程在自己目录下另存一份只含「自己需要的格式」的副本，
#   共享库被他人改动不影响本工程，Godot 导入范围也可控。
#
# 用法:
#   python tools/extract-project-assets.py <编号> <src_subdir[:ext,ext]> [...]
# 例:
#   python tools/extract-project-assets.py 11 \
#       models/defense:glb,gltf,png \
#       models/environment/kenney_factory-kit:glb,png \
#       ui/kenney_ui-pack:png,svg \
#       audio/music:mp3,ogg
#
# 默认扩展名: glb gltf png svg jpg webp ttf otf ogg mp3 wav（不含 obj/fbx/dae/mtl，
# 因为 Godot 4 对 glTF 的支持最好，且这些格式会显著拖长导入时间）
#
# 产出: projects/<编号>-*/assets/<与源相同的相对路径>
# 幂等：已存在且大小相同的文件直接跳过，可重复执行（素材库更新后重跑即增量同步）。

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_EXTS = {"glb", "gltf", "png", "svg", "jpg", "webp", "ttf", "otf", "ogg", "mp3", "wav"}


def find_project(num: str) -> Path:
    base = ROOT / "projects"
    hit = next((d for d in base.iterdir() if d.is_dir() and (d.name.startswith(num + "-") or d.name == num)), None)
    if hit is None:
        sys.exit(f"projects/ 下没有编号 {num} 的项目")
    return hit


def main() -> None:
    num = sys.argv[1]
    proj = find_project(num)
    dest_root = proj / "assets"
    total = 0
    copied = 0
    for spec in sys.argv[2:]:
        if ":" in spec:
            sub, ext_str = spec.split(":", 1)
            exts = {e.strip().lstrip(".").lower() for e in ext_str.split(",") if e.strip()}
        else:
            sub, exts = spec, DEFAULT_EXTS
        src = ROOT / "assets" / sub
        if not src.exists():
            print(f"  skip (missing) {sub}")
            continue
        n = 0
        for f in src.rglob("*"):
            if not f.is_file() or f.suffix.lstrip(".").lower() not in exts:
                continue
            rel = f.relative_to(ROOT / "assets")
            dest = dest_root / rel
            total += 1
            if dest.exists() and dest.stat().st_size == f.stat().st_size:
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, dest)
            n += 1
            copied += 1
        print(f"  {sub}: +{n} 新文件（扫描 {total} 累计）")
    size_mb = sum(p.stat().st_size for p in dest_root.rglob("*") if p.is_file()) / 1048576
    print(f"[done] {proj.name}/assets: 复制 {copied} 个新文件，目录共 {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
