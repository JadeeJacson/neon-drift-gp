# harvest-kenney.py — Kenney 素材包批量抓取（学习自用）
# 用法: python tools/harvest-kenney.py <out_root> <slug:category> [...]
# 例:   python tools/harvest-kenney.py F:/Dev/Projects/game-lab/assets \
#           tower-defense-kit:models/defense ui-pack:ui game-icons:ui/icons
#
# 产出: <out_root>/_downloads/kenney_<slug>.zip （原始包，已 gitignore）
#       <out_root>/<category>/kenney_<slug>/   （解压入库）
#       <out_root>/_downloads/kenney-index.json（断点重下 + SOURCES.md 登记依据）
#
# 直链抓取原理（2026-09-27 实测，见 docs/00 §5.1）：
#   详情页的 Download 按钮是 lity 弹窗（#inline-download），真实 zip 直链藏在弹窗 DOM 里：
#   kenney.nl/media/pages/assets/<slug>/<hash>/kenney_<slug>.zip
#   注意同页预览图/音频是另一个 hash 目录，zip 的 hash 必须抓弹窗里的那个。
#
# 完整性：下载后先 zipfile.testzip()（等价 unzip -t），失败不解压。
#   断流会产出「看起来下完了」的半成品，文件大小本身就是完整性信号（§5.0 第 4 条）。

import json
import re
import sys
import urllib.request
import zipfile
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0 (game-lab asset harvest; personal learning use)"}
BASE = "https://kenney.nl"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def find_zip_url(slug: str) -> str | None:
    html = fetch(f"{BASE}/assets/{slug}").decode("utf-8", errors="ignore")
    m = re.search(r"/media/pages/assets/" + re.escape(slug) + r"/[^'\"]+?\.zip", html)
    if not m:
        return None
    return BASE + m.group(0)


def download(url: str, dest: Path) -> bool:
    """带 Range 续传的下载。已存在且完整（testzip 通过）则跳过。"""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 0:
        try:
            with zipfile.ZipFile(dest) as z:
                if z.testzip() is None:
                    print(f"  cached {dest.name} ({dest.stat().st_size / 1e6:.1f} MB, 校验通过)")
                    return True
        except zipfile.BadZipFile:
            print(f"  {dest.name} 校验失败，重新下载")
    total = None
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        total = int(r.headers.get("Content-Length") or 0)
    mode = "wb"
    pos = 0
    if dest.exists() and total:
        pos = dest.stat().st_size
        if pos == total:
            mode = "ab"
        elif pos < total:
            mode = "ab"
        else:
            pos = 0
    while True:
        headers = dict(UA)
        if pos:
            headers["Range"] = f"bytes={pos}-"
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120) as r:
                if pos and r.status != 206:
                    pos = 0  # 服务端不支持续传，从头下
                    continue
                with open(dest, "wb" if pos == 0 else "ab") as f:
                    if pos == 0:
                        f.truncate(0)
                    while True:
                        chunk = r.read(262144)
                        if not chunk:
                            break
                        f.write(chunk)
                        pos += len(chunk)
        except Exception as e:  # noqa: BLE001
            print(f"  dl-error @{pos}: {e}")
            return False
        if total and pos >= total:
            break
        if not total:
            break
    if total and dest.stat().st_size != total:
        print(f"  size-mismatch {dest.stat().st_size}/{total}")
        return False
    try:
        with zipfile.ZipFile(dest) as z:
            bad = z.testzip()
        if bad is not None:
            print(f"  zip-corrupt in {bad}")
            return False
    except zipfile.BadZipFile as e:
        print(f"  zip-bad {e}")
        return False
    print(f"  ok {dest.name} ({dest.stat().st_size / 1e6:.1f} MB, CRC 校验通过)")
    return True


def unzip(dest_zip: Path, out_dir: Path) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest_zip) as z:
        names = z.namelist()
        z.extractall(out_dir)
    return names


def main() -> None:
    out_root = Path(sys.argv[1])
    index_path = out_root / "_downloads" / "kenney-index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else []

    for spec in sys.argv[2:]:
        slug, category = spec.split(":", 1)
        print(f"[kenney] {slug} -> {category}")
        try:
            url = find_zip_url(slug)
        except Exception as e:  # noqa: BLE001
            print(f"  page-fail {slug}: {e}")
            continue
        if not url:
            print(f"  no-zip {slug}（详情页无 zip 直链，可能 slug 不对或页面改版）")
            continue
        zip_path = out_root / "_downloads" / Path(url).name
        if not download(url, zip_path):
            continue
        out_dir = out_root / category / f"kenney_{slug}"
        try:
            names = unzip(zip_path, out_dir)
        except Exception as e:  # noqa: BLE001
            print(f"  unzip-fail {slug}: {e}")
            continue
        entry = {
            "slug": slug,
            "page": f"{BASE}/assets/{slug}",
            "zip_url": url,
            "zip": str(zip_path.relative_to(out_root)).replace("\\", "/"),
            "category": category,
            "files": len(names),
            "license": "CC0 1.0 (Kenney)",
            "date": "2026-09-27",
        }
        index = [e for e in index if e.get("slug") != slug]
        index.append(entry)
        index_path.parent.mkdir(parents=True, exist_ok=True)
        index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  extracted {len(names)} files -> {out_dir.relative_to(out_root)}")

    print(f"[done] {len(index)} packs indexed -> {index_path}")


if __name__ == "__main__":
    main()
