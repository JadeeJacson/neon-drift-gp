# RANGE 0.29.0

单文件 Three.js 网页靶场。本文件为可读开发构建（RANGE-0.24.0.html），可直接维护。

## 版本
- 0.29.0（M5）：DECK RUN 卡牌速通（10 关战役、8 卡牌手牌、武器卡切枪/位移卡弃牌换冲刺二段跳滑铲时停、铜银金钻奖牌、幽灵与本地榜、关卡解锁）+ 赛璐璐风格（色阶分离后处理）。
- 0.28.0（M4）：FORENSICS 法证瞄准训练器（gridshot/tracking/switching/precision/speed/recoil 6 科目 + 准星热力图回放 + 百分位/进度/每日挑战/报告导出）+ 1-bit 抖动风格 + 通用后处理管线（RT+shader，M7 复用）。
- 0.27.0（M3）：STATIC 时间模式（SUPERHOT 式时间随输入流动、无人机敌人慢速弹丸可躲避、8 puzzle 房、奖牌与本地最佳）+ 结晶白风格（白世界/红敌/黑枪）。
- 0.26.0（M2）：STYLE 风格条计分（12 事件加权+连击+D→SSS 评级+结算面板，独立存档）+ 反应式靶标家族（钢板倒下/凝胶伤道/西瓜碎裂/玻璃碎裂/水果）+ 通用 wing 框架（RANGE_WINGS）。
- 0.25.0：统一细边框红点瞄准镜（M4A1/P226/AK-47/MP5 全部改为细环+crisp 红点，光轴不变），瞄具参数入 RANGE_CONFIG.sights，RANGE_API.sights() 暴露元数据。
- 0.24.0：双端独立设置界面（灵敏度/开镜模式/FOV/按钮大小/摇杆死区/渲染精度/音量，实时生效+本地持久化+恢复默认）；触屏转向灵敏度默认 3.5× 且可调；开镜默认点击切换（设置可改按住）；按住射击键拖动可转向；开镜键状态指示。
- 0.23.0：移动端完整触控适配（摇杆/转向区/12 功能键/武器槽、横屏守卫、安全区）。
- 0.22.0：战术实验区（ECHO/TIME/SPACE、BLACKOUT 断电任务、世界检查点、20Hz 回放）。

## 开发说明
- 原 game-lab 源码遗失，自 0.22 起格式化还原并增量开发；行为经自动化测试验证（设置与操控 32 项 / 移动端验收 35 项 / 实验区探针 8 项 / 桌面回归 8 项）。
- SECTION A/C 为 Three.js / cannon-es 打包区，勿手改；游戏逻辑在 SECTION B/D，触控适配器 F，设置界面 H，集中调参层 B0（RANGE_CONFIG），扩展接口 window.RANGE_API（config/weapons/validateCatalog/settings/adsActive）。
- URL 加 ?qa 启用 window.__RANGE__ 调试接口（自动化测试依赖）。
- 设置存 localStorage("range-m2-settings")；0.22 与 0.24 的检查点/录像因协议含版本号不互通。
