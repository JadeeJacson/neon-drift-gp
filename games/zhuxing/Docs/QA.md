# 0.8 验证说明

以 `TestOutput/*-results.json` 为准。测试环境为 Windows Chromium（Playwright 捆绑）/ SwiftShader 软件 WebGL，不能代表所有硬件性能。测试脚本安排隔离初始位置来验证机制，不把这种布置当作玩家可用的传送或连续飞行。

## 本轮覆盖

- 量子机制（quantum.cjs）：3 碎晶与航标初始化（总站点 47）、未观测跃迁 / 观测保持坍缩、存档往返与坏数据拒绝、航标跃迁速度保留与锚点重定位、冷却防连跳、U 导航不传送、星图量子分区、日志分区。
- 遗迹（lore.cjs）：方碑与档案环入册、档案索引台三条摘录循环并写入存档、方碑注视回应一次性触发、存档往返、坏数据拒绝。
- 航行志（goals.cjs）：8 项里程碑注册、首次踏足记录、曦心近域解锁、碎晶目击写入、照片模式隐藏界面 / PNG 下载 / 退出、存档往返、坏数据拒绝、日志分区。
- 触屏（touch.cjs，390×844 · hasTouch）：移动端可开始、触屏 UI 显示、摇杆映射 WASD 行走、跳跃键离地、E 登船、M 星图、滑动转向、竖屏无溢出。
- 沿用 0.7：核心 / 飞行 / 地表 / 兼容（v3/v5 迁移）/ 离线单文件 / 折叠航路回归全部保持，站点计数更新为 47。
- 视觉检查：1440×900 黑洞 / 白洞 / 探针 / 跃迁；390×844 触屏地表与星图。

## 重跑

```sh
npm install
cd Web && python build.py && cd ..
CHROMIUM_BIN=/path/to/chromium npm test
CHROMIUM_BIN=/path/to/chromium node Tests/visual-smoke.cjs
```

默认 Chromium 路径为 `/usr/local/bin/chromium`。旧版回归脚本可用 `WEB_ROOT` 与 `QA_ROOT` 指定读写目录；新增场景测试使用相对于包内的 Web / TestOutput / Previews 目录。

当前统计见 `Docs/QA_SUMMARY.json`。测试结果只证明已覆盖场景；没有声称完成真实硬件性能基准、所有浏览器兼容测试或 Godot 原生移植。
