# TOKYO · 東京 — three.js 城市场景（12 号）

东京市 3D 场景 demo：涩谷十字路口 + 东京塔 + 晴空塔 + 程序化城市肌理，白天/夜晚一键切换
（含 110 秒昼夜循环模式）。全部程序化生成，无外部模型/贴图依赖。设计说明见
`../../docs/12-立项-东京城市.md`。

## 运行

```bash
npm install   # 首次：安装 three.js 0.180.0
npm start     # http://127.0.0.1:8177/
```

## 操作

- 鼠标：拖拽旋转 / 滚轮缩放 / 右键平移
- HUD：白天 · 夜晚 · 昼夜循环 ｜ 涩谷 · 空中 · 东京塔 · 晴空塔 视角
- 键盘：`N` 切换昼夜

## 结构

```
index.html        入口 + HUD + importmap
serve.mjs         零依赖静态服务器
src/main.js       启动、主循环、HUD（含 window.__tokyo 调试钩子）
src/env.js        昼夜中枢：天空穹顶着色器、日/月、雾、辉光、夜间点光源登记表
src/layout.js     确定性城市規劃：路网、街区、圈层分区、海岸线函数（固定种子）
src/ground.js     海洋/沙滩/河流桥/樱花岸线/路带/垫层/斑马线/树/路灯
src/buildings.js  实例化建筑 + 立面窗户着色器（onBeforeCompile）
src/houses.js     郊区独栋与农村村落（坡屋顶/暖窗/农田）
src/terrain.js    内陆山脉围合
src/bay.js        东京湾：货轮/集装箱港/桥吊/台场小岛+摩天轮
src/signs.js      canvas 日文霓虹招牌 / 广告牌 / 轮播大屏
src/landmarks.js  东京塔、晴空塔、涩谷路口四角
src/traffic.js    车流（靠左行驶）、高架环线电车、过街人流
src/fx.js         夜间自发光材质补丁、噪声纹理
```
