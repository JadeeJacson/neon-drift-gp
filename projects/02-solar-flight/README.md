# 02 · 星际航行模拟器（SOLAR FLIGHT）— 旧作归档

> **来源**：用户既往 vibecoding 作品，2026-09-23 归档入 lab，2026-09-24 重编号为 02。
> **性质**：**旧作归档**，不是本 lab 新做的形态实验。
> **形态**：太空飞行模拟（太阳系航行 + 天体浏览 + 任务）——lab 里唯一的**太空 / 天文**形态。

双击 `index.html` 运行（**需联网**，three.js 走 CDN，且带双源回退）。

---

## 形态与技术

| 项 | 内容 |
|---|---|
| 形态 | 第一人称太空飞行 + 太阳系天体浏览 |
| 世界 | 太阳系尺度：`AU = 50`、`YR = 30`（1 年 = 30 秒），天体数据表驱动 |
| 渲染 | three.js **r128**（`cdnjs` → `unpkg` → `jsdelivr` 三源回退） |
| 资产 | **100% 程序化生成**：行星条带、辉光、引擎焰、星点、土星环、大气层全部用 canvas / shader 画 |
| 代码 | 单文件 `index.html`（约 50 KB） |

飞行参数：`THRUST 26 / BRAKE 20 / STRAFE 14 / LIFT 14 / ROLL 1.6 / TURN 0.0026`。
时间档位：`SPEEDS = [1, 5, 20, 50, 200, 1000]`。

---

## 可复用设计清单（对后续项目最有价值的部分）

### 1. ★★★ 程序化纹理全家桶（零资产约束的最佳范本）
全部用 canvas 2D 现画，无任何图片文件：

| 函数 | 产出 | 手法 |
|---|---|---|
| `makeTex(id,o)` | 行星表面 | 512×256，按 `bands` 画纬向条带 + 噪声斑点（`pc/ps/pa` 控制斑点数/大小/透明度） |
| `makeGlowTex()` | 太阳辉光 | 256² `createRadialGradient` |
| `makeEngineTex()` | 引擎焰 | 128² 径向渐变 |
| `makeStarTex()` | 星点精灵 | 32² 径向渐变，配 `AdditiveBlending` |
| `makeRingTex()` | 土星环 | 512²，**逐像素 `createImageData`** 按半径算透明度（`iR=140, oR=255`） |
| `makeAtm(r,col,intensity)` | 大气层 | `SphereGeometry(r*1.18)` + **`ShaderMaterial` 菲涅尔边缘辉光** |

**→ 这套「canvas 画贴图 + shader 做大气」的组合，是任何零资产 3D 项目的直接可抄模板。**

### 2. ★★★ 大规模星点背景（12000 颗，一次 draw call）
```js
const N = 12000;
const pos = new Float32Array(N*3), col = new Float32Array(N*3);
// 球壳均匀分布：th = random*2π, ph = acos(2*random-1), r = 9000+random*18000
new THREE.Points(geo, new THREE.PointsMaterial({
  size: 1.6, map: makeStarTex(), vertexColors: true,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
}));
```
要点：**`depthWrite: false` + `AdditiveBlending`** 避免星点互相遮挡产生黑边；
球壳均匀采样用 `acos(2u-1)` 而非均匀角度（否则两极会聚集）。**这两条是通用经验。**

### 3. ★★☆ 天体数据表驱动 + 由周期反推角速度
```js
const os = p => 2 * Math.PI * 365.25 / (p * YR);  // 公转周期(天) → 角速度
const DB = { sun: {...}, ... };   // 主库
const MB = { ... };               // 卫星库
const AB = {};                    // 运行时: id -> {mesh, def, angle, spin, orbitLine, label}
```
**数据与运行时分离**：`DB/MB` 是纯数据（半径/周期/倾角/纹理参数），`AB` 只存运行时状态。
改一个天体的参数不用动渲染代码。

### 4. ★★☆ 时间加速档位 + 暂停
`SPEEDS` 数组 + 顶栏按钮切换，时间倍率直接乘进角速度与轨道推进。
**做法简单但体验提升明显**——太空尺度下没有时间加速寸步难行。

### 5. ★★☆ 3D → 屏幕的 HTML 标签层
`#lbl` 是覆盖全屏的 `pointer-events:none` DOM 层，把天体世界坐标投影到屏幕坐标，
用 `transform: translate(-50%,-150%)` 把标签摆在目标上方，配 `text-shadow` 保证可读性。
**→ DOM 做 UI、WebGL 只做 3D 的分层，比在 3D 里画文字省事得多。**

### 6. ★★☆ 任务系统 `MISSIONS`
数据表定义任务（目标天体 / 触发条件 / 提示文案），配 `#msn` 提示条 + `#toast` 完成提示。
给自由飞行加「目标感」的最小实现。

### 7. ★★☆ 多 CDN 回退加载 `loadFallback`
```js
loadFallback([
  'https://unpkg.com/three@0.128.0/build/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'
], 0, startGame, onFail);
```
带**加载等待计时提示**（"首次加载 3D 引擎，已等待 Ns…"）和最终失败兜底页。
对任何依赖 CDN 的页面都是必要礼貌。

### 8. ★☆☆ UI 细节
- `.pn` 面板：`backdrop-filter: blur(6px)` 毛玻璃 + 半透明深蓝底
- 天体导航 `#nav`：胶囊按钮组，超宽自动换行（`flex-wrap` + `max-width:60vw`）
- `#hlp` 键位说明 + `kbd` 标签样式
- 信息面板 `#info`：`.rw` 两列（label / value）数据行

---

## 局限

1. **three.js r128 太老**（2021 年）。lab 已在用 **0.186.0**，两者 API 差异大（`colorSpace`/`outputEncoding`、光照单位等），
   **不要直接把这里的渲染代码抄进新项目**，只抄思路。
2. **依赖 CDN**，离线打不开，与 lab「本地 dev server、不出网」原则不符。
3. **单文件、无分层、无类型、零自动化验证**——「能跑」不等于「验证过」。
4. 无物理/引力（飞船是 kinematic 直控，天体走固定圆轨道，不管真实轨道力学）。

---

## 在 lab 里的定位

- 是 lab 唯一覆盖「**太空 / 天文尺度**」的形态，与 01–06 的地面/网格/体素形态完全岔开。
- 其核心价值是**程序化资产生成**（§1）与**大规模点精灵背景**（§2），这两块对后续任何 3D 项目都可直接复用。
- 若要把它「工程化」，优先做：升 three 到 0.186 + 本地依赖、抽出 `data/`（天体表）与 `render/` 分层、补 CDP 验证。
