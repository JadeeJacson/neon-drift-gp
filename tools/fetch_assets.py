"""清单驱动的素材下载器（正式期通用，08 起用）。

设计约束（来自 docs/00-形态路线图.md）：
- 只允许落在 lab 根目录内（§0.6 下载边界），下载物归档到 assets/_downloads/，解压物入库 assets/<类目>/
- zip 必做完整性校验（§5.0.4：断流的半成品「看起来下完了」），不完整就重下
- 记录每项的大小/文件数，供 SOURCES.md 登记与「量级异常即怀疑断流」判据

用法：
    python tools/fetch_assets.py tools/asset-manifest-08.json            # 全部
    python tools/fetch_assets.py tools/asset-manifest-08.json --only kenney_pixel-platformer
    python tools/fetch_assets.py tools/asset-manifest-08.json --list     # 只看计划

清单字段：id / url / dest（相对 lab 根，解压目标；留空表示只下载不解压）/ note / license / source_page
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

LAB_ROOT = Path(__file__).resolve().parent.parent
DOWNLOADS = LAB_ROOT / 'assets' / '_downloads'
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0'}
MIN_RATIO = 0.9  # 与同站同类包比，小于此比例视为可疑（仅作打印提示）


def human(n: float) -> str:
    for unit in ('B', 'KB', 'MB', 'GB'):
        if n < 1024 or unit == 'GB':
            return f'{n:.1f} {unit}'
        n /= 1024
    return f'{n:.1f} GB'


def fetch(url: str, target: Path) -> int:
    """下载主路径用 curl.exe：实测比 urllib 快一个量级（141 KB/s vs 13–30 KB/s），
    且 --retry-all-errors 能跨过 OGA 偶发的连接重置（urllib 直接炸）°"""
    target.parent.mkdir(parents=True, exist_ok=True)
    if shutil.which('curl.exe') or shutil.which('curl'):
        curl = 'curl.exe' if shutil.which('curl.exe') else 'curl'
        before = target.stat().st_size if target.exists() else 0
        cmd = [curl, '-sS', '--fail', '--retry', '8', '--retry-all-errors', '--retry-delay', '3',
               '-C', '-', '-A', UA['User-Agent'], '--max-time', '3600', '-o', str(target), url]
        t0 = time.time()
        p = subprocess.run(cmd, capture_output=True, text=True)
        size = target.stat().st_size if target.exists() else 0
        if p.returncode != 0 and size and size == before:
            # 416/「range 越界」类错误：文件其实已完整，zip 校验会接住它
            print(f'    curl 退出码 {p.returncode}（已存在同名文件，按完整性继续）')
        elif p.returncode != 0:
            raise RuntimeError(f'curl {p.returncode}: {p.stderr.strip()[:200]}')
        dt = max(time.time() - t0, 0.001)
        print(f'    下载 {human(size)}（新增 {human(size - before)}），{human((size - before) / dt)}/s')
        return size
    return fetch_urllib(url, target)


def fetch_urllib(url: str, target: Path) -> int:
    """无 curl 时的兼容路径（断点续传）"""
    target.parent.mkdir(parents=True, exist_ok=True)
    have = target.stat().st_size if target.exists() else 0
    headers = dict(UA)
    if have:
        headers['Range'] = f'bytes={have}-'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            code = r.status
            if code == 206:  # 续传：追加
                mode, have = 'ab', have
            else:            # 200：整份重来
                mode, have = 'wb', 0
            tmp = target.with_suffix(target.suffix + '.part')
            if mode == 'ab' and target.exists():
                tmp = target
            t0 = time.time()
            with open(tmp, mode) as f:
                while chunk := r.read(1 << 16):
                    f.write(chunk)
                    have += len(chunk)
                    if have % (1 << 20) < (1 << 16):
                        print(f'    ... {human(have)} @ {human(have / max(time.time() - t0, 1))}/s', flush=True)
            if tmp != target:
                tmp.replace(target)
    except urllib.error.HTTPError as e:
        if e.code in (416,):  # Range 超出 → 文件已完整
            return have
        raise
    return have


def test_zip(path: Path) -> tuple[bool, str]:
    try:
        with zipfile.ZipFile(path) as z:
            bad = z.testzip()
            return (bad is None, f'{len(z.namelist())} entries' if bad is None else f'corrupt at {bad}')
    except zipfile.BadZipFile as e:
        return False, f'BadZipFile: {e}'


def extract(path: Path, dest: Path, replace: bool = False) -> int:
    """dest 必须是一个包一个目录（如 assets/tilesets/kenney_pixel-platformer）。

    两条教训：
    1. Kenney zip 内部就是 Tiles/ Spritesheet/ License.txt 这种平铺结构，多个包解到同一
       dest 会互相覆盖（License.txt 被后来者改掉），溯源信息直接作废。
    2. assets/ 是多 Agent 共享区。dest 已存在且非本工具产出时默认拒绝写入，
       否则会把别人未提交的抽取成果静默替掉（09 的 kenney_rpg-audio 就这么碰过）。
    """
    if dest.exists() and any(dest.iterdir()):
        stamp = dest / '.fetched-by-fetch-assets'
        if stamp.exists():
            shutil.rmtree(dest)  # 自己上批解的，重建不算碰撞
        elif not replace:
            print(f'    拒绝解包：{dest} 已存在他人内容（确认要覆盖加 --replace-dest）')
            return -1
    dest.mkdir(parents=True, exist_ok=True)
    (dest / '.fetched-by-fetch-assets').write_text('由 tools/fetch_assets.py 生成\n', encoding='utf-8')
    with zipfile.ZipFile(path) as z:
        names = [i for i in z.infolist() if not i.is_dir()]
        roots = {i.filename.replace('\\', '/').split('/', 1)[0] for i in names}
        single = len(roots) == 1 and next(iter(roots)).lower() in dest.name.lower().replace('_', '-').split('-')
        n = 0
        for info in names:
            name = info.filename.replace('\\', '/')
            if single:  # zip 自带一个与包名同名的顶层目录，剔掉它
                name = name.split('/', 1)[1]
            out = (dest / name).resolve()
            if not str(out).startswith(str(dest.resolve())):
                print(f'    SKIP unsafe path {name}')
                continue
            out.parent.mkdir(parents=True, exist_ok=True)
            with z.open(info) as src, open(out, 'wb') as dst:
                dst.write(src.read())
            n += 1
    return n


def run(item: dict, force: bool = False, extract_only: bool = False, replace_dest: bool = False) -> dict:
    url = item['url']
    name = re.split(r'[?#]', url.rsplit('/', 1)[-1])[0]
    target = DOWNLOADS / name
    print(f"[{item['id']}] {url}")
    print(f"    页面: {item.get('source_page', '-')}  授权: {item.get('license', '?')}")
    if extract_only:
        if not target.exists():
            return {'id': item['id'], 'error': f'缓存不在 {target}', 'size': 0}
    elif target.exists() and not force:
        ok, info = (True, 'cached') if not str(target).endswith('.zip') else test_zip(target)
        if ok:
            print(f'    已存在且校验通过（{human(target.stat().st_size)}，{info}），跳过下载')
        else:
            print(f'    已存在但校验失败（{info}）→ 删除重下')
            target.unlink()
    if not target.exists():
        DOWNLOADS.mkdir(parents=True, exist_ok=True)
        fetch(url, target)
    result = {'id': item['id'], 'zip': str(target.relative_to(LAB_ROOT)), 'size': target.stat().st_size,
              'files': 0, 'dest': item.get('dest') or '', 'note': item.get('note', ''),
              'license': item.get('license', ''), 'source_page': item.get('source_page', '')}
    if str(target).lower().endswith('.zip'):
        ok, info = test_zip(target)
        print(f'    zip 校验：{"OK" if ok else "FAIL"} — {info}')
        if not ok:
            result['error'] = info
            return result
        if item.get('dest'):
            dest = LAB_ROOT / item['dest']
            n = extract(target, dest, replace=replace_dest)
            if n < 0:
                result['error'] = f'目的地已存在他人内容：{item["dest"]}'
                return result
            result['files'] = n
            print(f'    解压 {n} 个文件 → {item["dest"]}')
    elif item.get('dest'):
        # 单文件素材（mp3/png/ttf）：原件留在 _downloads，副本入类目目录。
        # 副本名：优先用清单里的 as 字段，否则 URL 解码——带 %20/括号的名字进 Godot 很坑
        out_name = item.get('as') or urllib.parse.unquote(target.name)
        dest = LAB_ROOT / item['dest']
        dest.mkdir(parents=True, exist_ok=True)
        out = dest / out_name
        if not out.exists():
            shutil.copy2(target, out)
        result['files'] = 1
        result['dest_file'] = str(out.relative_to(LAB_ROOT))
        print(f'    入库副本 → {item["dest"]}/{out_name}')
    return result


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('manifest')
    ap.add_argument('--only', action='append', default=[], help='只跑指定 id（可重复）')
    ap.add_argument('--force', action='store_true', help='忽略缓存重下')
    ap.add_argument('--extract-only', action='store_true', help='不下载，只按新规则重新解包')
    ap.add_argument('--replace-dest', action='store_true', help='允许覆盖已存在的目的地目录（慎用）')
    ap.add_argument('--list', action='store_true')
    args = ap.parse_args()

    items = json.loads(Path(args.manifest).read_text(encoding='utf-8'))
    if args.list:
        for it in items:
            print(f"{it['id']:<28} {it.get('license',''):<22} {it.get('dest') or '(不解压)'} <- {it['url'].rsplit('/',1)[-1]}")
        return 0
    selected = [it for it in items if not args.only or it['id'] in args.only]
    if args.extract_only:
        for it in selected:
            it['url'] = it.get('url', '')
    results = []
    for it in selected:
        try:
            results.append(run(it, force=args.force, extract_only=args.extract_only,
                               replace_dest=args.replace_dest))
        except Exception as e:  # 一项失败不影响其余，最后汇总非零退出
            print(f'    ERROR {type(e).__name__}: {e}')
            results.append({'id': it['id'], 'error': str(e)})
    report = DOWNLOADS / 'fetch-report-08.json'
    if report.exists():  # 分批跑时不能把前一批的登记依据覆盖掉
        try:
            prev = {r['id']: r for r in json.loads(report.read_text(encoding='utf-8'))}
        except Exception:
            prev = {}
        prev.update({r['id']: r for r in results})
        results = [prev[k] for k in sorted(prev)]
    report.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    bad = [r['id'] for r in results if r.get('error')]
    print(f'\n汇总：{len(results) - len(bad)}/{len(results)} OK → {report.relative_to(LAB_ROOT)}')
    for r in results:
        print(f"  {r['id']:<28} {human(r.get('size', 0)):<10} {r.get('files', 0):>6} files  {r.get('error', 'ok')}")
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
