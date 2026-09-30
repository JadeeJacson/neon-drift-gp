"""按路径前缀从 GitHub 仓库拉子集（本机网络实测：api.github.com 通、github.com 与
raw.githubusercontent.com 不通、cdn.jsdelivr.net 单文件可取）。

lab 里已有的 harvest-polypizza.py / fetch_assets.py 管素材，这个管「代码参照」，
避免为了看一个官方示例去 clone 整个几百 MB 的仓库。

用法：
    python tools/fetch_gh_subset.py godotengine/godot-demo-projects master _scratch/gh_tree.json 2d/kinematic_character 2d/mplatformer
    （第三个参数是 tree JSON 缓存路径，脚本会在缺失时自己用 api.github.com 拉）
"""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.request
from pathlib import Path

LAB_ROOT = Path(__file__).resolve().parent.parent
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0'


def load_tree(repo: str, branch: str, cache: Path) -> list[dict]:
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        url = f'https://api.github.com/repos/{repo}/git/trees/{branch}?recursive=1'
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/vnd.github+json'})
        with urllib.request.urlopen(req, timeout=60) as r:
            cache.write_bytes(r.read())
        print(f'tree 已缓存 → {cache.relative_to(LAB_ROOT)}')
    data = json.loads(cache.read_text(encoding='utf-8'))
    if 'tree' not in data:
        raise SystemExit(f'tree JSON 异常：{str(data)[:200]}')
    return data['tree']


def main() -> int:
    if len(sys.argv) < 5:
        raise SystemExit(__doc__)
    repo, branch, cache_rel = sys.argv[1], sys.argv[2], sys.argv[3]
    prefixes = sys.argv[4:]
    dest_root = LAB_ROOT / 'assets' / 'templates' / repo.split('/')[-1]
    tree = load_tree(repo, branch, (LAB_ROOT / cache_rel).resolve())
    files = [n['path'] for n in tree
             if n['type'] == 'blob' and any(n['path'].startswith(p) for p in prefixes)]
    print(f'匹配 {len(files)} 个文件，落到 {dest_root.relative_to(LAB_ROOT)}')
    failed = []
    for i, rel in enumerate(files, 1):
        out = dest_root / rel
        if out.exists() and out.stat().st_size > 0:
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        url = f'https://cdn.jsdelivr.net/gh/{repo}@{branch}/{rel}'
        p = subprocess.run(['curl.exe', '-sS', '--fail', '--retry', '5', '--retry-all-errors',
                            '--retry-delay', '2', '-A', UA, '--max-time', '300', '-o', str(out), url],
                           capture_output=True, text=True)
        if p.returncode != 0:
            failed.append((rel, p.stderr.strip()[:120]))
            out.unlink(missing_ok=True)
        elif i % 25 == 0 or i == len(files):
            print(f'  {i}/{len(files)}')
    for rel, err in failed:
        print(f'FAIL {rel}  {err}')
    print(f'完成：{len(files) - len(failed)}/{len(files)}')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
