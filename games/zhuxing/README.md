# 逐星 · 量子纪元

原创微缩宇宙探索沙盒（three.js，离线单文件）。1 恒星 / 5 行星 / 6 卫星共 11 个可着陆世界；开普勒公转、黑洞白洞折叠航路、量子观测坍缩、里程碑与照片模式。桌面键鼠 + 触屏可玩。

- 键鼠：`E` 登船 · `Space` 起飞 · `WASD` 推进 · `F` 减速 · `M` 星图 · `J` 日志 · `H` 手册 · `U` 量子航标 · `C` 照片模式。
- 触屏：左侧摇杆 + 右侧动作键，滑动转向。

## 入口与版本

- `index.html`：门户入口，当前为 0.8 构建（与 `Web/逐星-折叠航路0.8.html` 逐字节一致）。
- `Web/逐星-折叠航路0.9.html`：本地最新 0.9 构建（顶层另有一份副本 `逐星-折叠航路0.9.html`），尚未切换为门户入口。
- `Web/` 内另有 0.7 / 0.8 历史构建与全部模块源码（game.js / cosmos.js / quantum.js 等）。

## 源码与测试（2026-11-15 自 练手小游戏/逐星-0.7折叠航路/ 并入）

- `Godot-core-0.3/`：Godot 核心原型（独立小工程）。
- `Tests/`：Playwright 测试套件（qa / flight / quantum / rifts / lore / offline / migration / touch 等）。
- `Docs/`：设计文档（QUANTUM_EPOCH / FOLDED_SPACE / ORBITAL_MODEL / WILDS_LIGHT 等）。
- `Previews/`、`TestOutput/`：取证截图与测试输出存档。
- `node_modules/`：Playwright 依赖（BREACH 与尘暴突围的 QA 也借用此处，NODE_PATH 指向本目录）。
- `MANIFEST-SHA256.txt`：原发布清单。