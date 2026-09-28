# 版本固定记录（正式期）

> **规则**：引擎版本一经选定即记录于此，不在项目间混用。混用版本会让「上次能跑」变成不可复现。
> 本表由 `node tools/check-env.mjs` 的**实测输出**核对维护，不手写猜测值。
> 最后实测核对：2026-09-26 23:40（lab 根执行 `node tools/check-env.mjs`）。

## 引擎

| 引擎 | 版本 | 位置 | 状态 |
|---|---|---|---|
| **Godot** | **4.7.2-stable**（`4.7.2.stable.official.ed1daf0bf`）Standard / GDScript | `engines/godot/4.7.2/` | ✅ 唯一主力引擎。实测 `--version` 与 `--headless --import/--quit` 均通过 |

> 必须用 `_console` 后缀的可执行文件做自动化，Standard 版不向终端输出脚本报错。
> Blender / Unity 见下方「按需工具」，**不属于路线依赖**。

## 系统工具（2026-09-26 本机实测）

| 工具 | 实测版本 | 说明 |
|---|---|---|
| Node.js | v24.13.0 | 托管运行时，跑 `tools/*.mjs` |
| npm | 11.6.2 | 本仓库当前无 npm 依赖 |
| Git | 2.55.0.windows.2 | `core.autocrlf=false`，见路线图 §5.4 |
| .NET SDK | 10.0.401 | **Godot 路线用不到**（选的是 Standard/GDScript 版），保留仅为其他项目 |
| Python | 3.13.15 | 跑 `tools/harvest-polypizza.py` |
| uv | 0.12.11 | Python 包管理，暂未使用 |

## 工程内第三方代码（版本必须逐工程登记）

| 工程 | 组件 | 版本 | 授权 | 位置 |
|---|---|---|---|---|
| 06 | Jeh3no Advanced FSM First Person Controller | Godot 4.4–4.7 兼容（main 分支，2026-09-26 取） | MIT | `projects/06-mech-fps/addons/JehenoAdvancedFirstPersonController/` |
| 06 | **GUT**（bitwes/Gut） | **9.7.1**（2026-07-10 发布） | MIT | `projects/06-mech-fps/addons/gut/` |
| 09 | **GUT**（bitwes/Gut） | **9.7.1**（从 06 原样复制，未改版本） | MIT | `projects/09-arcane-roster/addons/gut/` |
| 12 | **three.js**（WebGL 渲染库） | **0.180.0**（npm，`package.json` 钉版本） | MIT | `projects/12-tokyo-city/node_modules/`（已 gitignore） |
| 13 | **three.js**（WebGL 渲染库） | **r128**（CDN 运行时引用，本地无副本） | MIT | `projects/13-solar-flight/index.html` 第 128 行 `script src` |
| 14 | **three.js**（WebGL 渲染库） | **0.169.0**（npm **精确版本**锁定，非 `^`） | MIT | `projects/14-dead-signal/node_modules/`（已 gitignore） |
| 14 | **esbuild**（打包器） | **^0.24.0** | MIT | `projects/14-dead-signal/node_modules/`（已 gitignore） |

> **13 的 r128 与 12 的 0.180.0 不可混用**：r128 是 2021 年版本，`outputEncoding` / 光照单位
> 与新版不兼容。13 保持 r128 是制作人「游戏内容先不动」的指令；若升级需整体迁移光照与
> 色彩管理写法，见 `docs/13-立项-星际航行.md` §5。

> **14 号是第三个版本**：0.169.0（npm 精确版本 + esbuild 打包内联）。三个 Web 项目用了
> 三个互不相同的 three.js 版本与三种组织方式（12 无构建 / 13 CDN 单文件 / 14 esbuild 打包），
> 依赖各装各的，**代码与写法不可跨项目照搬**。新建项目默认走 Godot 主线。见路线图 §1b。

> 09 的 GUT 断言函数集与 06 略有差异，写测试时注意：**GUT 9.7.1 用 `assert_gte`/`assert_lte`，
> 没有 `assert_ge`/`assert_le`**；GDScript 侧也**不要用 `String(x)` 做类型转换**（x 已是 String 时
> 报 `Invalid call 'String' constructor`），用 `str(x)`。这两点各踩过一次，见 `docs/09-立项` §4.2。

> GUT 只需 CLI（`-s addons/gut/gut_cmdln.gd`），**未启用 `[editor_plugins]`**——本 lab 走纯文本工作流，
> 不开编辑器也能跑全套断言。将来若要在编辑器里看测试面板，加这一行即可：
> `[editor_plugins]\nenabled=PackedStringArray("res://addons/gut/plugin.cfg")`

## 按需工具（不是路线依赖，缺了不报错）

| 工具 | 状态 | 什么时候才装 |
|---|---|---|
| Blender | 未安装 | 需要改模、重命名骨骼、烘焙动画时（`blender --background --python`）。当前 06 不需要：素材自带动画 + 程序化补件 |
| Unity | **不再考虑** | 路线已定 Godot，Hub + 账号激活成本不值得。从待办中移除 |

## 练习期（three.js）版本记录——仅作历史对照，**不得用于新项目**

| 项目 | 渲染 | 类型 | Vite | 备注 |
|---|---|---|---|---|
| 01 界 | three.js 0.160.0（CDN ESM） | 无 | 无 | 已删除，快照 `bdfb867` |
| 02 星际航行 | three.js r128（CDN 三源回退） | 无 | 无 | 已删除；r128 的 `outputEncoding`/光照单位与后续版本不兼容 |
| 03 弯心 | three.js 0.186.0 + rapier3d-compat 0.20.0 | TS 7.0.2 | 8.3.0 | 已删除，tag `archive-before-03-04-removal` |
| 04 火线 / 043 | three.js 0.186.0 + rapier3d-compat 0.20.0 | TS 7.0.2 | 8.3.0 | 同上。方法论（sim/render 分离、确定性验证、bot 跑分、手感量化）已平移进正式期，**代码一行不带** |

## 待办

- [x] 确认 Godot 版本与发行版类型 → 4.7.2-stable Standard（GDScript），已装并实测
- [x] 选定 GDScript 测试框架 → GUT 9.7.1，已接入 06
- [ ] Blender 按需再装（当前无需求）
- [ ] ~~实测 Godot .NET 版兼容性~~ —— 不做，路线已定 GDScript
