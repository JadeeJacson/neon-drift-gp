# RANGE 0.24.0

单文件 Three.js 网页靶场。本文件为可读开发构建（RANGE-0.24.0.html），可直接维护。

## 版本
- 0.24.0：双端独立设置界面（灵敏度/开镜模式/FOV/按钮大小/摇杆死区/渲染精度/音量，实时生效+本地持久化+恢复默认）；触屏转向灵敏度默认 3.5× 且可调；开镜默认点击切换（设置可改按住）；按住射击键拖动可转向；开镜键状态指示。
- 0.23.0：移动端完整触控适配（摇杆/转向区/12 功能键/武器槽、横屏守卫、安全区）。
- 0.22.0：战术实验区（ECHO/TIME/SPACE、BLACKOUT 断电任务、世界检查点、20Hz 回放）。

## 开发说明
- 原 game-lab 源码遗失，自 0.22 起格式化还原并增量开发；行为经自动化测试验证（设置与操控 32 项 / 移动端验收 35 项 / 实验区探针 8 项 / 桌面回归 8 项）。
- SECTION A/C 为 Three.js / cannon-es 打包区，勿手改；游戏逻辑在 SECTION B/D，触控适配器 F，设置界面 H，集中调参层 B0（RANGE_CONFIG），扩展接口 window.RANGE_API（config/weapons/validateCatalog/settings/adsActive）。
- URL 加 ?qa 启用 window.__RANGE__ 调试接口（自动化测试依赖）。
- 设置存 localStorage("range-m2-settings")；0.22 与 0.24 的检查点/录像因协议含版本号不互通。
