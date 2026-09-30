#!/usr/bin/env python
# 只抽取需要的文件类型解包素材包，避免 obj/fbx/preview 之类冗余格式进库。
#
# 用法:
#   python tools/extract-pack.py <zip> <dest_dir> [--include .gltf,.glb] [--strip 3] [--flat]
#
# 参数:
#   --include  逗号分隔的扩展名白名单（不填=全抽）。匹配时忽略大小写。
#   --strip    从每个条目路径前端剥掉几层目录（KayKit 的 zip 是 <repo>/addons/<pkg>/... 结构）
#   --flat     所有文件拍平到 dest 根目录（重名自动加后缀），Kenney 音效包用
#
# 为什么需要它（lab 教训）:
#   1. 同站的 obj/fbx 与 gltf 内容重复，全量入库会让仓库体积翻三倍；
#   2. 06 的 SOURCES.md 明确只入 GLTF 格式，与之保持一致；
#   3. 断流会产出半成品 zip，本脚本解包时用 zipfile 校验 CRC，坏包立刻报错而不是解一半。
import argparse
import os
import sys
import zipfile


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("zip")
    ap.add_argument("dest")
    ap.add_argument("--include", default="")
    ap.add_argument("--strip", type=int, default=0)
    ap.add_argument("--flat", action="store_true")
    args = ap.parse_args()

    if not zipfile.is_zipfile(args.zip):
        print("[extract] %s 不是有效 zip（多半是断流半成品，见 docs/00 §5.0 第 4 条）" % args.zip)
        return 1

    include = {e.strip().lower() for e in args.include.split(",") if e.strip()}
    os.makedirs(args.dest, exist_ok=True)
    written = 0
    used_names = set()

    with zipfile.ZipFile(args.zip) as z:
        bad = z.testzip()
        if bad is not None:
            print("[extract] CRC 校验失败，首个坏条目: %s" % bad)
            return 1
        for info in z.infolist():
            if info.is_dir():
                continue
            ext = os.path.splitext(info.filename)[1].lower()
            if include and ext not in include:
                continue
            parts = info.filename.split("/")[args.strip:]
            if not parts:
                continue
            name = parts[-1]
            if args.flat:
                if name in used_names:
                    stem, e = os.path.splitext(name)
                    i = 1
                    while "%s_%d%s" % (stem, i, e) in used_names:
                        i += 1
                    name = "%s_%d%s" % (stem, i, e)
                used_names.add(name)
                rel = name
            else:
                rel = os.path.join(*parts)
            target = os.path.join(args.dest, rel.replace("/", os.sep))
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with z.open(info) as src, open(target, "wb") as dst:
                dst.write(src.read())
            written += 1

    print("[extract] %s -> %s : %d 个文件" % (os.path.basename(args.zip), args.dest, written))
    return 0


if __name__ == "__main__":
    sys.exit(main())
