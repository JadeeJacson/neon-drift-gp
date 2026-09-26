# harvest-polypizza.py — Poly Pizza 低模素材批量抓取（学习用途）
# 用法: python harvest-polypizza.py <out_root> <query:category:limit> [...]
# 例:  python harvest-polypizza.py F:/Dev/Projects/game-lab/assets mech:models/characters:10
# 产出: <out_root>/<category>/polypizza/<slug>.glb + <out_root>/_downloads/polypizza-index.json
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0 (game-lab asset harvest; personal learning use)"}
BASE = "https://poly.pizza"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="ignore")


def search_ids(query: str, limit: int) -> list[str]:
    html = fetch(f"{BASE}/search/{urllib.request.quote(query)}")
    ids = re.findall(r'"/m/([a-zA-Z0-9_-]+)"', html)
    seen, out = set(), []
    for i in ids:
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out[:limit]


def parse_model(mid: str) -> dict | None:
    html = fetch(f"{BASE}/m/{mid}")
    glb = re.search(r"static\.poly\.pizza/([a-f0-9-]+\.glb)", html)
    if not glb:
        return None
    title = re.search(r'og:title" content="([^"]+?) - Free Model [Bb]y ([^"]+?)"/>', html)
    license_ = "CC-BY" if "CC-BY" in html or "Creative Commons Attribution" in html else ("CC0" if "CC0" in html else "unknown")
    return {
        "id": mid,
        "title": title.group(1) if title else mid,
        "creator": title.group(2) if title else "unknown",
        "license": license_,
        "page": f"{BASE}/m/{mid}",
        "glb_url": f"https://static.poly.pizza/{glb.group(1)}",
    }


def slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60]


def save_index(index_path: Path, index: list) -> None:
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    out_root = Path(sys.argv[1])
    index_path = out_root / "_downloads" / "polypizza-index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else []

    for spec in sys.argv[2:]:
        query, category, limit = spec.rsplit(":", 2)
        print(f"[search] {query} -> {category} (limit {limit})")
        try:
            ids = search_ids(query, int(limit))
        except Exception as e:  # noqa: BLE001
            print(f"  search-fail {query}: {e} (跳过该查询)")
            continue
        for mid in ids:
            if any(e["id"] == mid for e in index):
                print(f"  skip (have) {mid}")
                continue
            try:
                meta = parse_model(mid)
            except Exception as e:  # noqa: BLE001
                print(f"  fail {mid}: {e}")
                continue
            if not meta:
                print(f"  no-glb {mid}")
                continue
            dest_dir = out_root / category / "polypizza"
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / f"{slugify(meta['title'])}-{mid}.glb"
            try:
                if dest.exists() and dest.stat().st_size > 0:
                    print(f"  exists [{meta['license']}] {meta['title']} -> {dest.name} (仅补登记)")
                else:
                    req = urllib.request.Request(meta["glb_url"], headers=UA)
                    with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
                        f.write(r.read())
                    print(f"  ok [{meta['license']}] {meta['title']} by {meta['creator']} -> {dest.name}")
                meta["file"] = str(dest.relative_to(out_root)).replace("\\", "/")
                meta["query"] = query
                index.append(meta)
                save_index(index_path, index)  # 增量保存，中断不丢登记
            except Exception as e:  # noqa: BLE001
                print(f"  dl-fail {meta['title']}: {e}")
            time.sleep(0.4)

    save_index(index_path, index)
    print(f"[done] {len(index)} models indexed -> {index_path}")


if __name__ == "__main__":
    main()
