"""批量 HEAD：拿 Content-Length 与耗时，用来决定要不要下（带宽只有十几 KB/s）。

用法：python tools/head_probe.py <url> [<url> ...]
"""
import sys
import time
import urllib.request

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0'}


def head(url: str) -> None:
    req = urllib.request.Request(url, headers=UA, method='HEAD')
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            n = r.headers.get('Content-Length')
            dt = time.time() - t0
            kb = int(n) / 1024 if n else 0
            eta = kb / 13 / 60 if kb else 0  # 实测均值约 13 KB/s
            print(f'{r.status}  {kb / 1024:7.1f} MB  t={dt:.1f}s  ETA@13KB/s={eta:5.1f} min  {url.rsplit("/", 1)[-1][:60]}')
    except Exception as e:
        print(f'FAIL {e}  {url.rsplit("/", 1)[-1][:60]}')


if __name__ == '__main__':
    for u in sys.argv[1:]:
        head(u)
