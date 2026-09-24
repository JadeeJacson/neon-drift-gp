# engines/ — 引擎与工具

体积大，已加入 `.gitignore`。目录按 `引擎名/版本号/` 组织，与 `F:\Dev\Tools\` 的习惯一致。

```
engines/
├─ godot/    4.x/    Godot_v4.x-stable_win64.exe（含 _console 版）
├─ blender/  4.x/    blender.exe
└─ unity/    6000.x/ Editor/Unity.exe
```

## 获取方式

### Godot 4 —— 完全便携

1. 打开 `https://godotengine.org/download/windows/`
2. 下载 **Standard**（GDScript）或 **.NET**（C#）的 Windows 版 zip
3. 解压到 `engines/godot/<版本>/`

zip 内即是可直接运行的可执行文件，无需安装程序、无需注册表、无需账号。删除目录即彻底卸载。

- 无头执行：`godot --headless`（Godot 4.x 用法；3.x 为 `--no-window`）
- 带 `_console` 后缀的版本会把 stdout 输出到终端，**做自动化验证时用这个**，普通版看不到脚本报错。

### Blender —— 完全便携

1. 打开 `https://www.blender.org/download/`
2. 下载 Windows 版 **zip**（不要下 MSI 安装包）
3. 解压到 `engines/blender/<版本>/`

- 无头执行：`blender --background --python script.py`
- 用于程序化建模、批量导出 glTF/GLB、渲染静帧。删除目录即彻底卸载。

### Unity 6 —— 需要人工介入

Unity **无法**做成纯绿色解压：

1. 先安装 **Unity Hub**（官方安装程序，会落在系统盘）
2. 在 Hub 的 `设置 → 安装` 中把**编辑器安装路径**改为 `F:\Dev\Projects\game-lab\engines\unity\`
3. 通过 Hub 下载编辑器与所需模块（体积取决于勾选，通常 5–15 GB）
4. **登录 Unity 账号并激活 Personal 许可证**——这一步必须你本人完成

- 命令行：`Unity.exe -batchmode -nographics -quit -projectPath <路径> -executeMethod <方法>`
- 注意：Hub 本体仍在系统盘，只有编辑器落在本 lab。

## 待确认

下载任何引擎前，会先报出**确切版本号与体积**，确认后再执行。不擅自下载 GB 级内容。
