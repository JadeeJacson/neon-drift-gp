# BREACH 单文件构建脚本（无第三方依赖）
# 用法：python build.py
# 读取 template.html + src/game.js，内联生成离线单文件 BREACH-0.8.2.html

import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
TEMPLATE = ROOT / "template.html"
GAME = ROOT / "src" / "game.js"
OUT = ROOT / "BREACH-0.8.2.html"


def main() -> None:
    template = TEMPLATE.read_text(encoding="utf-8")
    game = GAME.read_text(encoding="utf-8")
    # 防止游戏代码里出现 </script> 提前闭合标签
    if "</script" in game:
        raise SystemExit("game.js 含 </script>，会破坏单文件结构")
    if "{{GAME_SCRIPT}}" not in template:
        raise SystemExit("template.html 缺少 {{GAME_SCRIPT}} 占位符")
    out = template.replace("{{GAME_SCRIPT}}", game)
    OUT.write_text(out, encoding="utf-8")
    print(f"built {OUT.name}: {len(out)} bytes")


if __name__ == "__main__":
    main()
