# STM32 库字典 · Library Atlas — 项目交接文档

## 1. 项目定位与核心能力

**STM32Atlas.exe** 是一个离线 Windows 桌面速查工具，把 **SPL（标准外设库）** 与 **HAL** 的常用函数、对应关系、相关调用和典型任务流程集成在同一套知识网中，并附带面向 **STM32F103C8T6** 的江协教程案例集与硬件知识库。

- **164 个函数**：SPL 85 / HAL 79，覆盖 14 个外设
- **18 条任务流程**：含流程图、分步说明、完整代码、易错点
- **77 组 SPL ↔ HAL 对照**：点击即跳转
- **14 个江协教程案例**：可交互模拟电路（引脚电压 / 导线通断 / 发光 / 按键 / 舵机角度）+ 实时读数 + 控件 + 教程原版 SPL 源码 + 原理与自检判据
- **48 个引脚定义**：LQFP48 引脚图，含类型、5V 容忍、默认复用与重定义、涉及外设、被哪些案例使用
- **7 篇硬件知识文章**：逐条标注教程页码
- **中英双语界面** + 明暗主题切换（默认亮色，窗口标题栏同为亮色）
- **圆角无边框窗口**：Win11 由 DWM 裁切，Win10 优雅退化为方角；整条标题栏可拖动
- **迷你查询窗**：置顶透明小窗，热键呼出、边打边查；可调不透明度与是否置顶（记忆到 `mini.json`）；自动避开屏幕边缘；在任意程序里划词即查（不用切回主窗口）
- **DPI 感知**：per-monitor v2，150% / 200% 缩放下按真实分辨率渲染，不发虚
- **安卓手机版 APK**：同一套界面跑进系统 WebView，离线、零权限；侧栏变抽屉、流程图支持单指平移 / 双指缩放、系统返回键按「页面 → 抽屉 → 退出」逐级后退（MuMu 模拟器实测，Android 15 / API 35）
- **资料查询**：14 个模块资料的目录索引（10049 份文件 / 440.8 MB），模块卡片 + 目录树 + 页内筛选；桌面版可直接用资源管理器打开文件或目录，网页 / 安卓版降级为复制相对路径

适用人群：嵌入式工程师、CubeMX 迁移者、中断优先级调试者、外设时序敏感场景开发者。

---

## 2. 技术栈与环境要求

### 宿主程序

| 项目 | 版本/备注 |
| --- | --- |
| .NET SDK | 6.0.410（或更高） |
| Target Framework | `net6.0-windows` |
| UI 框架 | WPF + WebView2 |
| Runtime | 本机 WebView2 Runtime 155.0+（系统通常已预装） |
| DPI 感知 | `app\app.manifest`：`permonitorv2,permonitor`（缺它时高分屏下整窗被位图放大） |

### 界面与数据

- **HTML/CSS/JS**：原生 ES module，无构建工具依赖。桌面版在 WebView2（Chromium 现代版）里跑，安卓版在系统 WebView 里跑，**两端共用 `app/ui` 这一份源码**。
- **字体**：IBM Plex Sans / JetBrains Mono（woff2 本地化），中文回退 Microsoft YaHei UI。
- **图标**：内联 SVG（`app/ui/icons.js`）。
- **数据**：JSON-like JS 文件聚合在 `data/index.js`，含完整性审计逻辑。

### 安卓版

| 项目 | 版本/备注 |
| --- | --- |
| 语言 / SDK | Java（无 Kotlin、无 androidx、无第三方依赖） |
| minSdk / targetSdk | 24 / 35（Android 7.0 起） |
| JDK | 17（`JAVA_HOME`，脚本回退 `C:\jdk17`） |
| Android SDK | `ANDROID_HOME`（回退 `D:\AndroidSdk`），需 `platforms;android-35` + `build-tools;35.0.0` |
| 构建 | **不用 Gradle / AGP**：`aapt2` → `javac` → `d8` → `zipalign` → `apksigner` |
| 权限 | 无（不申请 INTERNET，纯离线） |

### 构建产物

| 目录 | 用途 |
| --- | --- |
| `dist/STM32Atlas.exe` | 最终交付单文件 exe（win-x64、自包含）；不入库，发布在 GitHub Releases `v1.0.0` |
| `dist/STM32Atlas.apk` | 安卓安装包（API 24+，离线零权限）；不入库 |
| `%LOCALAPPDATA%\Stm32Atlas\ui\<ver>-<ts>/` | 首次运行自动解压的 UI 资源目录 |

---

## 3. 目录结构与关键文件说明

```text
.
├─ PROJECT_HANDOVER.md       # 本文档
├─ README.md                  # 用户侧快速参考
├─ build.ps1                  # 单文件发布脚本（产物 dist\STM32Atlas.exe，不入库）
├─ build-android.ps1          # 安卓 APK 脚本（aapt2 + javac + d8 + zipalign + apksigner）
├─ 模块资料\                  # 440.8 MB 原始资料（不入库，页面只读索引）
├─ tools\
│  ├─ data-selftest.mjs       # 数据自测（node，零依赖）
│  ├─ gen-pins.py             # 引脚定义 xlsx → data\pins.js
│  ├─ gen-case-src.py         # 教程工程 → data\case-src.js
│  ├─ gen-materials.py        # 模块资料 → data\materials.js
│  └─ gen-android-icon.py     # 生成安卓启动器图标（各密度 PNG）
├─ android\                   # 安卓壳（纯 Java，无 Gradle）
│  ├─ app\AndroidManifest.xml
│  ├─ app\java\com\stm32atlas\app\MainActivity.java
│  ├─ app\res\                # 图标 / 应用名 / 主题（values、values-en、mipmap-*）
│  └─ keystore\atlas.jks      # 签名用 PKCS12（首次构建自动生成，不入库）
└─ app\                       # 源码（含 Debug/Release）
   ├─ MainWindow.xaml(.cs)    # WPF 圆角窗口 + WebView2 宿主 + 消息桥 + DWM 圆角 + 热键/划词
   ├─ MiniWindow.xaml(.cs)    # 迷你查询窗（纯 WPF，不另开 WebView2）
   ├─ MaterialsRoot.cs        # 资料根目录发现 / 选择 / 越界校验 / ShellExecute 打开
   ├─ app.manifest            # DPI 感知：per-monitor v2（高分屏不发虚）
   ├─ App.xaml                # WPF 应用启动、主题与语言回退
   ├─ Stm32Atlas.csproj       # .NET 6 项目，含内嵌 UI、发布配置
   ├─ UiAssets.cs             # 内嵌 UI 资源解压逻辑
   └─ ui\                     # 静态 HTML/CSS/JS（已嵌入）
      ├─ index.html, styles.css, app.js
      ├─ i18n.js, icons.js
      ├─ compat.css           # 老 WebView 兜底（color-mix 等）+ 安卓触屏微调
      ├─ fonts/\              # woff2 字体
      ├─ sim\
      │  ├─ sch.js            # 电路图 SVG 渲染（行布局 / 分压支路 / 模块方块）
      │  ├─ models.js         # 14 个行为模型（时间推进 + 引脚/元件/读数/OLED/串口）
      │  └─ pinout.js         # LQFP48 引脚图 SVG + 占用统计
      └─ data\                # JS 数据源
         ├─ peripherals.js    # 14 个外设元数据 + 强调色
         ├─ util.js           # fn() 归一化
         ├─ fn-core.js        # GPIO/RCC/NVIC/EXTI（85）
         ├─ fn-serial.js      # USART/SPI/I2C（36）
         ├─ fn-timer.js       # TIM/ADC/DAC（40）
         ├─ fn-memory.js      # DMA/IWDG/RTC/FLASH（3）
         ├─ wf-gpio.js        # 流程模板 + GPIO
         ├─ wf-serial.js      # 通信/定时类流程
         ├─ wf-system.js      # 系统/模拟类流程 + NVIC 优先级
         ├─ kb.js             # 7 篇硬件知识文章
         ├─ pins.js           # 48 个引脚（gen-pins.py 生成）
         ├─ cases.js          # 14 个江协案例：电路/控件/读数/模型/讲解/判据
         ├─ case-src.js       # 案例源码（gen-case-src.py 抽取）
         ├─ materials.js      # 14 个模块资料索引（gen-materials.py 生成）
         ├─ material-notes.js # 14 篇阅读笔记：参数 / 引脚 / 要点 / 坑 / 出处（人工整理）
         └─ index.js          # 聚合、对照表、反查索引、搜索、审计
```

### 关键文件职责速览

| 文件 | 核心职责 |
| --- | --- |
| `MainWindow.xaml.cs` | WebView2 初始化（含 `--disable-background-timer-throttling` 等参数，主窗隐藏后 JS 不被节流）、虚拟主机 `https://stm32.local/`、窗口按钮消息桥、`FitToWorkArea()` 尺寸收缩、`ApplyWindowCorners()` DWM 圆角、`ApplyHostTheme()` 原生标题栏随主题换画刷、全局热键（退让注册）、划词监听（`WH_MOUSE_LL` + 剪贴板序号取词）、`HandleSelection`/`NavigateMain`。 |
| `MiniWindow.xaml(.cs)` | 迷你查询窗：432 宽置顶透明小窗，搜索框 + 结果列表 + 设置面板（置顶 / 不透明度，存 `mini.json`）+ 划词开关；`ApplyTheme()` 换 9 个画刷、`ApplyLanguage()` 中英、`ShowResults(json)` 解析宿主回传的条目、`PlaceNearCursor()` 按 `MonitorFromPoint` + `GetDpiForMonitor` 在物理像素空间定位并做工作区钳制。 |
| `app.manifest` | `dpiAware=true/pm` + `dpiAwareness=permonitorv2,permonitor`；缺它时进程是 DPI 非感知，150% 缩放下整窗被位图放大、界面发虚。 |
| `UiAssets.cs` | 内嵌 UI 资源解压到 `%LOCALAPPDATA%\Stm32Atlas\ui\<ver>-<ts>/`，Debug 版读磁盘 `ui`。 |
| `app.js` | 路由（`#/home`/`#/functions?lib=&p=`/`#/fn/<id>`/`#/wf/<id>`/`#/cases/<id>`/`#/chip/<pin>`/`#/kb/<id>`/`#/materials/<id>`/`#/map`/`#/search?q=`/`#/favorites`）、渲染、流程图引擎、案例模拟循环（`caseStart`/`casePaint` 局部重绘）、引脚图页、资料树（`matRow`/`matNode`/`bindMaterialsUi`）、搜索、收藏、Toast、快捷键（`Ctrl+K` / `/`）。 |
| `sim/sch.js` | 电路图 SVG：`LAYOUT` 行布局（一引脚一行）、`drawChain` 串元件（导线跨过 `partGap`）、`drawDivider` 分压支路（电位器竖接 3V3/GND，抽头接回引脚）、`drawModuleBox` 跨行模块方块、`railGlyph` 电源/地符号。`circuitSvg(item, live, lang)` 的 `live = { pins, parts }` 直接吃模型输出。 |
| `sim/models.js` | 14 个行为模型：`createModel(item, getControls)` → `{ reset, step(dt), view() }`；`view()` 给 `{ pins, parts, values, screen, log }`；`idlePins()` 给按键 / I²C 引脚补空闲电平，保证图上每个引脚都有电压。 |
| `sim/pinout.js` | LQFP48 引脚图：`pinGeometry(no)`（左 1–12 → 底 13–24 → 右 25–36 → 顶 37–48）、`chipSvg(selected, { used })`、`usedPins(cases)`。标签两行都排在封装外（`NEAR=12` / `FAR=34`），SVG 的 `rotate` 是顺时针，顶边要用 `rotate(90)+anchor:end`。 |
| `styles.css` | 设计令牌、组件样式、明暗主题、响应式布局（案例页复用 `.doc-head` / `.doc-panel` / `.case-*`，电路图用 `.sch-*`，引脚图用 `.chip-*`）。 |
| `i18n.js` | 界面中英文文案键。 |
| `data/cases.js` | 14 个江协案例：`channels`/`modules` 描述电路，`controls`/`readouts` 描述交互，`model` 指定行为模型，`explain`/`check` 讲原理与判据。 |
| `data/pins.js` | 48 个引脚（`no/name/type/level/gpio/altList/remapList/port/bit/kind/periphs`），由 `gen-pins.py` 生成，勿手改。 |
| `data/case-src.js` | 案例源码（`CASE_SOURCES` + `caseSources(folder, files)`），由 `gen-case-src.py` 从教程工程抽取，勿手改。 |
| `data/materials.js` | 14 个模块资料的索引（`MATERIAL_MODULES`/`MATERIAL_MAP`/`MATERIAL_STATS`）：模块名与摘要（中英）、标签、关联的案例/流程/知识点、工作量与体积、两层目录树。由 `gen-materials.py` 生成，勿手改；模块文案写在脚本的 `MODULES` 表里。 |
| `MaterialsRoot.cs` | 资料根目录发现（`%LOCALAPPDATA%\Stm32Atlas\materials.json` → `STM32ATLAS_MATERIALS` 环境变量 → 从 exe/当前目录向上 6 级找 `模块资料`），`Pick()` 用 WinForms `FolderBrowserDialog` 选目录，`TryResolve()` 把相对路径拼成绝对路径并挡住越界，`Open()` 用 `ShellExecute` 打开文件/文件夹。 |
| `data/material-notes.js` | 14 篇阅读笔记（`MATERIAL_NOTES[id]`）：`takeaway` 一句话结论、`specs` 关键参数、`pins` 接口定义、`steps` 使用要点、`cautions` 注意事项、`sources` 原文出处（文件名 + 说明）。内容从 `模块资料\` 的 PDF / doc / 接线图里读出来手写整理，不是生成物；模块详情页的「资料摘要」和搜索权重都吃这份数据。 |
| `data/kb.js` | 7 篇硬件知识文章：段落 / 列表 / 公式 / 警告块 + 教程页码。 |
| `data/index.js` | 聚合数据 + 完整性审计（`FUNCTION_MAP`/`WORKFLOW_MAP`/`EQUIVALENCES`/`FN_WORKFLOWS`，以及知识/案例/引脚的 dangling 引用）。 |
| `tools/data-selftest.mjs` | 零依赖数据自测：函数与流程引用、知识结构、案例电路/控件/读数/模型/源码、48 引脚自洽、14 个模块资料索引（关联 id 可解析、资源路径前缀），并渲染电路图确认无 `undefined`/`NaN`。 |
| `tools/gen-pins.py` | 用 `zipfile` + `ElementTree` 读引脚定义 xlsx，按复用/重定义文本提取 `periphs`，生成 `data/pins.js`。 |
| `tools/gen-case-src.py` | 按 `CASES[].folder/files` 从教程工程读源码（UTF-8 优先、回退 GBK），生成 `data/case-src.js`。 |
| `tools/gen-materials.py` | 扫描 `模块资料\`：一次遍历统计每个模块的文件数/体积/类别，按 `EXPAND_TO=2` 建两层目录树（每层最多 `MAX_CHILDREN=80` 项，其余记入 `more`），模块文案取自脚本内 `MODULES` 表，输出 `data/materials.js`。新增或改名模块后重跑它。 |
| `build.ps1` | 一键发布单文件 exe：清空 `dist` 里上一版 exe（保留 `STM32Atlas.apk`）→ `dotnet publish -c Release -r win-x64 --self-contained true ...`。 |
| `build-android.ps1` | 安卓构建：`-Clean` / `-Install` / `-Run` / `-DebugBuild` / `-Serial`。先把 `android\app` 与 `app\ui` 复制到 `%TEMP%\stm32-atlas-android`（**aapt2 打不开含中文的路径**），再 aapt2 compile+link → javac → d8 → 自写 `assets/ui/...` 进 zip（**`aapt2 -A` 在 Windows 上会写成 `assets\ui\...`，AssetManager 读不到**）→ zipalign → apksigner → 复制到 `dist`。 |
| `android\app\MainActivity.java` | 安卓壳：`FrameLayout` + `WebView`；`shouldInterceptRequest` 把 `https://atlas.local/*` 映射到 `assets/ui`（`file://` 下 ES module 会被 CORS 拦）；`addJavascriptInterface(..., "AtlasAndroid")` 收 `{type:"theme",value,lang}` 切状态栏图标明暗 + 窗口背景 + `SharedPreferences("atlas")`；targetSdk 35 强制 edge-to-edge，故 `setDecorFitsSystemWindows(false)` + `setOnApplyWindowInsetsListener` 补 `systemBars\|displayCutout`，`bottom` 取 `max(nav, ime)`；`onBackPressed` 先 `canGoBack()` 后退再退出；`configChanges` 覆盖旋转/密度/字号变更，避免重建 WebView 丢状态；debuggable 构建才开 `setWebContentsDebuggingEnabled(true)`。 |
| `android\app\AndroidManifest.xml` | 无 INTERNET 权限、`usesCleartextTraffic=false`、`exported=true`、`launchMode=singleTask`、`windowSoftInputMode=adjustResize`。 |
| `app\ui\compat.css` | 老引擎兜底：包在 `@supports not (background-color: color-mix(...))` 里，用逗号 RGB 变量 + `rgba()` 复刻 `color-mix()`（Chromium 111 才有，MuMu 的 WebView 是 110）；另外有 `html[data-host="android"]` 的触屏微调（去 tap 高亮、隐藏滚动条、`overscroll-behavior`、流程图 `touch-action`）。 |
| `tools/gen-android-icon.py` | 生成启动器图标：8× 超采样画 `#0B1120` 圆角方块 + `#22C55E` 字形，输出各密度 `ic_launcher.png` 与透明前景 `ic_launcher_fg.png`（配 `mipmap-anydpi-v26` 自适应图标）。 |

---

## 4. 数据模型（函数 / 流程 / 知识 / 案例）

### 函数字段约定

```js
fn({
  id: "std.gpio.init",           // 全局唯一，建议 lib.periph.action
  lib: "std" | "hal",
  p: "gpio",                     // 外设 id，需存在于 peripherals.js
  n: "GPIO_Init",                // 函数名
  sig: "void GPIO_Init(...);",
  zh: "中文说明", en: "English description",
  params: [["GPIOx", "中文", "English"]],
  ret: ["无", "None"],
  hdr: "stm32f10x_gpio.h",
  eq: "hal.gpio.init",           // 对应函数，可省略
  rel: ["std.rcc.apb2clockcmd"], // 相关函数
  tags: ["初始化", "init", "pin"] // 检索标签
})
```

### 流程字段约定

```js
wf({
  id: "wf.gpio-pwm-tim3",        // 全局唯一，建议 wf.lib.action
  p: "tim",
  level: 1,                      // 1=入门/2=进阶/3=综合
  libs: ["std","hal"],
  title: { zh:"TIM3 PWM 输出", en:"PWM output on TIM3" },
  goal: { zh:"...", en:"..." },
  steps: [ ... ],                // 含 kind("start"/"isr"/"check"/"end")、fn 数组、代码片段
  code: { std: `...`, hal: `...` }   // 完整工程级示例
  pitfalls: [{ zh:"...", en:"..." }],
  related: ["wf.usart-irq"],      // 关联流程 id
  tags: ["pwm","timer"]
})
```

### 知识文章字段约定（data/kb.js）

```js
{
  id: "gpio-modes", p: "gpio", icon: "pin",
  title: { zh, en }, summary: { zh, en },
  blocks: [
    { kind: "p", zh, en },
    { kind: "list", items: [{ zh, en }] },        // 允许 <b> / <code> 行内标签
    { kind: "formula", expr, note: { zh, en } },
    { kind: "warn", zh, en }
  ],
  refs: [{ page: 21, title: "GPIO模式" }],        // 对应 STM32入门教程.md 的页码
  related: { workflows: [], functions: [] }
}
```

### 江协案例字段约定（data/cases.js）

```js
{
  id: "servo", folder: "6-4 PWM驱动舵机", p: "tim", icon: "arrows", level: 4,
  title: T("PWM 驱动舵机", "Servo via PWM"), goal: T("…", "…"),
  files: ["User/main.c", "Hardware/PWM.c", "Hardware/Servo.c"],   // 源码标签页
  channels: [                                                     // 一引脚一条支路
    { key: "K1", pin: "PB1", to: "gnd", chain: [btn("K1", "K1")] }
  ],
  modules: [                                                      // 跨行模块方块
    { key: "M1", ref: "M1 · SG90 舵机", pins: { SIG: "PA1" }, lines: T(["橙=信号 PA1"], ["orange: SIG PA1"]) }
  ],
  controls: [{ key: "key1", kind: "button", label: T("按 K1（+30°）", "Press K1 (+30°)") }],
  readouts: [{ key: "angle", fmt: "deg", unit: "°", label: T("角度", "Angle") }],
  model: "servo", opts: {},
  explain: [{ zh, en }, …],       // 数组，3 条
  check: { zh, en },
  related: { kb: [...], workflows: [...], functions: [...] }
}
```

约束（`data-selftest.mjs` 会逐条校验）：

- `channels[].chain` 的元件由 `res / led / btn / buzzer / npn / pot / cap / servo` 助手生成；`kind: "divider"` 的支路表示电位器分压（竖接 3V3 与 GND、抽头接回引脚），行高会额外留 74。
- `modules[].pins` 的值必须是真实 GPIO 名，否则引脚图不把它算作“被案例占用”。
- `controls[].kind ∈ range | button | serial`；滑杆要有 `min < max` 且 `def` 在范围内。
- `readouts[].key` 必须出现在模型 `view().values` 里，`fmt ∈ n | v | ma | pct | deg | hex | raw | bool | dark`。
- `model` 必须是 `sim/models.js` 里已实现的键（`blink / flow / buzzer / keys / light / encoder / timer / breath / servo / adc / uart / spi / rtc / uid`）。
- `files` 里的每个路径都要能从 `caseSources(item.folder, item.files)` 取到正文。
- `related.functions` 必须写**函数 id**（如 `std.tim.ocinit`、`hal.gpio.writepin`），不是外设名；`related.kb` 与 `related.workflows` 也必须指向已存在的 id。

### 聚合与审计（data/index.js）

启动时运行完整性检查：函数 id、`eq/rel` 反查、步骤 `fn` 存在性、知识/案例的 `related` 指向等。控制台会打印缺失或不对称条目。

---

## 5. UI 设计与路由约定

### 核心路由表

| 路由 | 参数 | 说明 |
| --- | --- | --- |
| `#/home` | 无 | 首页：外设卡片 + 推荐流程 + 最近浏览。 |
| `#/functions?p=` | `lib=std\|hal, p=gpio|rcc|nvic...` | 按库/外设筛选函数列表。 |
| `#/fn/<id>` | 无 | 函数详情：原型、参数、返回值、头文件、对应函数、相关函数、出现的流程标签。 |
| `#/wf/<id>` | 无 | 流程详情页：流程图（SVG+HTML）、分步说明、完整代码、要点与关联；点击节点跳函数详情。 |
| `#/cases` | 无 | 经典案例列表：14 张卡片（按教程顺序，标难度与外设）。 |
| `#/cases/<id>` | 案例 id | 案例详情：电路与接线 + 实时读数 + 控件 + 教程原版源码（分文件标签页）+ 原理 / 动手改 / 相关条目。点电路里的引脚名跳到对应引脚页。 |
| `#/chip` | 无 | 引脚图：LQFP48 芯片图 + 选中引脚详情 + 按端口浏览（每脚标“被几个案例用到”）。 |
| `#/chip/<pin>` | `PA0` / `PB12` / `VBAT`… | 选中该引脚的引脚图页。 |
| `#/kb` | 无 | 硬件知识库列表：7 篇文章，按外设标注强调色。 |
| `#/kb/<id>` | 文章 id | 知识文章：正文卡片 + 教程页码 + 关联流程/函数。 |
| `#/materials` | 无 | 资料查询列表：14 张模块卡片 + 资料根目录条（桌面版显示真实路径与「打开目录 / 换目录」）+ 页内筛选。 |
| `#/materials/<id>` | 模块 id（`core`/`oled`/`ch340`…） | 模块资料详情：目录树（两层，可展开）+ 页内筛选 + 资料构成统计 + 关联案例/流程/知识点。 |
| `#/map` | 无 | 库对照表：按外设逐行对比 SPL/HAL 字段差异 + 对应关系。 |
| `#/search?q=` | 函数名/外设/标签/中英描述 | 全局搜索，支持中英文混合与模糊匹配；结果分组为外设 / 知识点 / 资料 / 函数 / 流程。 |
| `#/favorites` | 无 | 收藏列表（持久化）。 |

已废弃的 `#/sim` 与 `#/build` 会回落到首页，不再有对应视图。

### 设计体系（styles.css）

- **默认亮色**：浅灰底 `#F3F6FB` + 白色卡片；深色主题仍是 OLED 深蓝 `#0F172A/#0B1120`。两种主题共用同一套语义变量。
- **窗口标题栏同为亮色**（`#FFFFFF` + 1px `#DCE5F1` 下边线，写在 `MainWindow.xaml` 里），窗口按钮图标 `#475569`、悬停底 `#EDF3FB`；DWM 圆角半径 10。桌面壳里侧栏品牌块隐藏（`html[data-host="desktop"] .brand`），因为原生标题栏已经显示过品牌。网页切换深色主题时通过 `postMessage({ type: "theme", value })` 通知宿主，`MainWindow.ApplyHostTheme()` 替换 `App.xaml` 里的那组画刷（`TitleBarBg` / `ShellBg` / `TitleIconBrush` …），标题栏与窗口底色随主题一起变深。
- **SPL / HAL 强调色**：琥珀 `#F5A524` / 天蓝 `#38BDF8`；主强调色绿色 `#22C55E`。
- **字体栈**：IBM Plex Sans (woff2) + JetBrains Mono (等宽)，中文回退 Microsoft YaHei UI。
- **响应式**：1080px 让案例页与引脚图从两列变单列；1000px/900px/760px 三档继续收窄侧栏与卡片；窄窗口侧栏收起为图标或抽屉。

### 快捷键与交互

| 操作 | 说明 |
| --- | --- |
| `Ctrl+K` / `/` | 聚焦搜索框，`↑/↓` 移动、`Enter` 打开。 |
| `Esc` | 清空并退出搜索；迷你窗中则收起窗口。 |
| `Ctrl+Alt+M`（退让链 `Ctrl+Alt+M` → `Ctrl+Shift+M` → `Ctrl+Alt+K`） | 呼出 / 收起迷你查询窗；实际生效的组合键写在迷你按钮 ToolTip 与迷你窗底部提示里。 |
| 拖拽标题栏任意处（含空白背景） | 整条 44px 标题栏都能拖动窗口；`Grid x:Name="TitleBar"` 必须保留 `Background="Transparent"`，`null` 只在文字/图标上命中。 |
| `Tab` + 滚轮 | 在流程图中上下平移。 |
| `Ctrl` + 滚轮 | 缩放流程图。 |
| 右侧滚动条 + 适应窗口按钮 | 缩放到整图可见。 |

### 迷你查询窗（MiniWindow）

设计取舍：**不在迷你窗里再开一个 WebView2**。`AllowsTransparency=True` 的 WPF 窗口里放 WebView2 会撞上 airspace 限制（子 HWND 无法真透明），并且多一个浏览器进程约 100MB。所以迷你窗是纯 WPF 控件，数据由主窗口里的 WebView 提供，两者用 `postMessage` 通信。

消息协议（全部是 JSON）：

| 方向 | `type` | 字段 | 用途 |
| --- | --- | --- | --- |
| WPF → Web | `mini-query` | `id`, `q`, `lang` | 请求检索；`id` 单调递增，用于丢弃过期结果。 |
| Web → WPF | `mini-result` | `id`, `items[{kind,title,sub,href}]` | 最多 8 条：函数 5 → 流程 3 → 知识 3 → 案例标题匹配。 |
| WPF → Web | `mini-open` | `href` | 打开条目（主窗恢复后 `location.hash = href`）。 |
| Web → WPF | `selection` | `text` | 应用内划词（`getSelection()`，2–80 字，去重）。 |
| Web → WPF | `theme` | `value`, `lang` | 主题 / 语言变化，宿主同时刷新原生标题栏与迷你窗。 |
| Web → WPF | `materials-probe` | 无 | 进入资料页时探测一次根目录；宿主回 `materials-info`。 |
| WPF → Web | `materials-info` | `ok`, `root` | `ok=false` 时页面显示「未找到资料目录」，`ok=true` 显示真实路径 + 打开/换目录按钮。 |
| Web → WPF | `open-root` | `pick` | `pick=false` 打开已定位的根目录；`true` 先弹目录选择框（选中后写 `materials.json`）。 |
| Web → WPF | `open-path` | `path`, `kind` | `path` 是相对 `模块资料\` 的路径；宿主 `TryResolve()` 校验后 `ShellExecute` 打开。 |
| WPF → Web | `open-result` | `ok` | 打开失败时回 `ok=false`，页面弹「打不开这个路径」。 |

划词取词链路：迷你窗点「眼睛」→ `SetSelectionWatcher(true)` → 装 `WH_MOUSE_LL` 全局鼠标钩子；`LBUTTONDOWN` 记起点与时刻，`LBUTTONUP` 时位移 ≥8px、间隔 ≥90ms、且前台不是本进程才动手；随后 `CaptureSelection()` 先取 `GetClipboardSequenceNumber()`，发一次 `Ctrl+C`，420ms 内每 30ms 轮询序号变化再读剪贴板（**不能用内容比对**：选中词恰好等于剪贴板旧内容时会误判成「没复制」），取 trim 后 2–80 字。取到就 `ToggleMini(text, nearCursor:true)`。

关闭语义：迷你窗隐藏时主窗自动恢复；划词监听**不随隐藏卸载**（否则关掉小窗后就再也取不到词），只有再点眼睛或退出程序才 `UnhookSelectionWatcher()`。

定位（屏幕钳制）：`PlaceNearCursor()` 全程在**物理像素**空间算——`GetCursorPos` 拿物理坐标 → `MonitorFromPoint(pt, MONITOR_DEFAULTTONEAREST)` 找光标所在显示器 → `GetMonitorInfo().rcWork` 拿该屏工作区 → `GetDpiForMonitor(MDT_EFFECTIVE_DPI)` 得 `scale = dpiX/96`；先尝试光标右下 `pt + (16,20)*scale`，右侧或下方放不下就翻到光标另一侧（`pt - gap - size`），最后用 `Clamp(v, work.Left+12*scale, work.Right-12*scale-w)` 兜底。落位用 `SetWindowPos(hwnd, 0, left, top, 0, 0, SWP_NOSIZE|SWP_NOZORDER|SWP_NOACTIVATE)` 直接写物理坐标，**绕开 WPF 的 DIP 换算**（多显示器混合 DPI 下也不会偏）；HWND 未建立时退回 DIP 赋值。另有 `PlaceTopRight()` 处理「不跟随光标」的情形（主窗所在显示器右上角），以及 `ClampToWorkArea()` 挂在 `SizeChanged` 上——结果条数变化把窗口撑高后重新收进工作区。

设置面板（header 的滑杆按钮）：`TopToggle`（`MiniSwitch` 样式，开=置顶 / 关=普通窗口，切 `Topmost`）与 `OpacitySlider`（40–100，直接写 `Window.Opacity`）。两项存在 `%LOCALAPPDATA%\Stm32Atlas\mini.json`（`MiniSettings { Opacity, Topmost }`，`System.Text.Json`），`LoadSettings()` 在 `InitializeComponent()` 之后调用并用 `_loadingSettings` 挡住首次 `ValueChanged`，任何读写异常都吞掉（坏 JSON / 只读目录不影响使用）。三个迷你窗样式（`MiniIconButton` / `MiniSwitch` / `MiniSlider`）都设了 `FocusVisualStyle="{x:Null}"`，否则键盘或 UI Automation 操作后会留一圈虚线框。

---

## 6. 江协案例与硬件知识库

### 案例（data/cases.js + data/case-src.js）

- 14 个案例对应教程工程目录：LED 闪烁（3-1）→ 流水灯（3-2）→ 蜂鸣器（3-3）→ 按键控制 LED（3-4）→ 光敏传感器（3-5）→ 旋转编码器（5-2）→ 定时器中断（6-1）→ PWM 呼吸灯（6-3）→ PWM 驱动舵机（6-4）→ ADC 电位器（7-1）→ 串口收发（9-2）→ SPI 读写 W25Q64（11-1）→ RTC 实时时钟（12-2）→ 芯片 ID（15-2）。
- 每个案例给 **四层**：可交互电路（`channels` + `modules`，由 `sim/sch.js` 渲染）、行为模型（`model` + `sim/models.js`，给出引脚电压 / 元件状态 / 读数 / OLED 行 / 串口日志）、教程原版源码（`caseSources(folder, files)`，分文件标签页）、讲解与判据（`explain` 3 条 + `check` 1 条）。
- 电路与模拟的运行循环在 `app.js`：`caseStart()` 用 `requestAnimationFrame` 推进 `model.step(dt)`（dt 上限 0.12s），每 90ms 调一次 `casePaint()`，只重绘 `#caseCircuit` / `#caseReadouts` / `#caseScreen` / `#caseLog` 四个容器，不整页重渲染；离开路由时 `render()` 第一句 `caseStop()` 收尾。
- 详情页复用知识页的面板样式（`.doc-panel` / `.case-*` / `.sch-*`），右侧「相关条目」链到函数与流程详情。

### 引脚图（data/pins.js + sim/pinout.js）

- 48 个引脚来自 `STM32F103C8T6引脚定义.xlsx`（`tools/gen-pins.py` 生成），字段：`no / name / type / level(FT) / gpio / altList / remapList / port / bit / kind / periphs`。
- 芯片图按 LQFP48 逆时针编号：左 1–12、底 13–24、右 25–36、顶 37–48。引脚号与引脚名**都排在封装外**（12 脚/边、25px 间距，放封装内会和邻边压字）；SVG 的 `rotate()` 是顺时针，顶边必须 `rotate(90) + anchor:"end"`，写 `-90` 会得到倒序字母。
- 被案例占用的引脚取自 `usedPins(CASES)`（`channels[].pin` + `modules[].pins`），在图外侧画绿点，并在「按端口浏览」里标出案例数。
- 详情面板给类型、5V 容忍、端口位、默认复用、重定义、涉及外设（跳到函数字典筛选）、用到它的案例；点电路图里的引脚名可跳到 `#/chip/<pin>`。

### 知识库（data/kb.js）

- 7 篇短文：芯片与最小系统、引脚复用、GPIO 八种模式、LED 与三极管、定时器与 PWM、ADC、USART 帧格式。
- `blocks` 支持 `p`、`list`、`formula`、`warn`；行内只放行 `<b>` / `<em>` / `<code>` / `<br>`（先转义再白名单还原，避免注入）。
- 每条结论带 `refs[].page`，对应仓库根的 `STM32入门教程.md`。

### 模块资料（data/materials.js + tools/gen-materials.py + MaterialsRoot.cs）

- 数据源是仓库根的 `模块资料\`：14 个 `N-模块名` 目录，共 440.8 MB / 10049 份文件，**不入库**（`.gitignore` 已忽略）。界面只读索引，不打包原始文件：`app/ui/data/materials.js` 约 55 KB。
- 生成：`python tools\gen-materials.py`。脚本用 `walk()` 得到每个模块的文件数/字节数/类别计数（`pdf / img / doc / pcb / prog / tool / pack / other`），再按 `EXPAND_TO = 2` 建两层目录树（模块 → 顶层资源 → 资源下一层），每层最多 `MAX_CHILDREN = 80` 个子项，超出的只记 `more` 计数；`path` 一律相对 `模块资料\`。
- 模块文案（`name`/`summary` 中英、`code`、`tags`、`p`、`icon`、`cases`/`workflows`/`kb`）写在脚本内 `MODULES` 表里，按目录名索引。加新模块 = 加一张表项 + 重跑脚本；`data/index.js` 的审计会校验 `p`/`cases`/`workflows`/`kb` 引用是否存在。
- 页面：`#/materials` 列表（`matCard`），`#/materials/<id>` 详情（`matNode` 渲染树、`bindMaterialsUi` 做页内筛选，`[data-mt]` 存小写检索串，`[data-mbranch]` 无可见子项时整枝隐藏）。
- 打开文件：桌面版页面发 `open-path`，`MaterialsRoot.TryResolve()` 拼绝对路径后经 `Path.GetFullPath` 前缀校验确保仍在根内（挡住 `..` 越界），再 `Process.Start(UseShellExecute)`；网页 / 安卓没有宿主，按钮降级为复制相对路径。

#### 阅读笔记（data/material-notes.js）

索引只能说“这个模块有什么文件”，所以每个模块另配一篇**读原文后整理的笔记**，在详情页顶部渲染成「资料摘要」面板：

- `takeaway`：一句话结论（接线极性、通信参数这类最要紧的事），排在面板最上面；
- `specs` / `pins`：关键参数与接口定义，两张两列表；参数一律写资料的额定值（电压、电流、量程、槽宽、分辨率……），资料里没有的数字不写；
- `steps` / `cautions`：使用步骤与容易踩的坑（例如“有源蜂鸣器是低电平触发”“对射式无遮挡输出低、反射式相反”“W25Q 跨页写会回卷”）；
- `sources`：每条结论对应的原文件名 + 一句说明，自测会核对文件确实在 `模块资料\` 里。

笔记同时参与全局搜索（`data/index.js` 的 `matFields` 把笔记正文按权重 4 计入），所以搜 `0x78`、`STBY`、`TCRT5000` 都能落到对应模块。新增模块时要同时补索引与笔记。

### 验证

- `node tools\data-selftest.mjs`：**5144 项断言**，覆盖函数/流程引用、7 篇知识的块结构与页码、14 个案例的电路/控件/读数/模型/源码、48 个引脚的自洽性、14 个模块资料索引（id 唯一、序号单调、资源路径前缀、类别取值、关联 id 可解析，`模块资料` 存在时还检查目录真的在盘上）、14 篇阅读笔记（结论/参数/引脚/要点/坑/出处齐全，出处文件能在盘上找到），并渲染一遍电路图与 48 个引脚图确认没有 `undefined` / `NaN`，以及「案例不再残留旧功能字段」的回归检查。
- 浏览器端（Edge + CDP）28 项端到端断言：导航 8 项（含引脚图）、案例 14 张卡、案例页电路 SVG / 引脚热点 / 读数 / 源码标签 / 运行与按住按钮、按键改变读数、滑杆改变 ADC 读数、串口表单收发、引脚图 48 个热点与占用高亮、`#/chip/PA9` 详情、点引脚切详情、`#/sim` 与 `#/build` 回落、主题切换、控制台无报错。

---

## 7. 构建与发布流程

### Debug 开发模式（热刷新）

```powershell
dotnet run --project app -c Debug
```

- 优先读取 `app/ui` 目录，HTML/CSS/JS 修改后直接刷新生效。
- 无需重新打包 exe。

### 本地自测（改数据后）

```powershell
node tools\data-selftest.mjs
```

### Release 单文件发布

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

等价命令：

```powershell
dotnet publish app\Stm32Atlas.csproj `
  -c Release -r win-x64 --self-contained true `
  -o dist `
  -p:PublishSingleFile=true `
  -p:IncludeNativeLibrariesForSelfExtract=true `
  -p:EnableCompressionInSingleFile=true `
  -p:DebugType=none
```

产物：`dist\STM32Atlas.exe`（win-x64、自包含、单文件，约 62 MB）。

### 安卓 APK 构建

```powershell
.\build-android.ps1                    # 只构建，产物 dist\STM32Atlas.apk
.\build-android.ps1 -Install           # 顺带 adb install -r
.\build-android.ps1 -Run               # 顺带启动（无设备时自动 adb connect 127.0.0.1:16384）
.\build-android.ps1 -Clean -Run        # 清中间产物后重建并启动
.\build-android.ps1 -DebugBuild -Run   # debuggable 构建，可用 chrome://inspect 调 WebView
```

要点：

- `-DebugBuild` 不能写成 `-Debug`：`[CmdletBinding()]` 自带 `-Debug` 通用参数，重复定义会报错。
- 脚本是 **UTF-8 with BOM**；Windows PowerShell 5.1 读无 BOM 文件会按 GBK 解析而无法报错，改动后要保住 BOM。
- native 工具在 stage 目录跑（`%TEMP%\stm32-atlas-android`）；用 `$LASTEXITCODE` 判失败，因为 javac 会往 stderr 写 `Note:`，在 `$ErrorActionPreference='Stop'` 下会被误判为终止错误。
- 签名：`android\keystore\atlas.jks`（PKCS12，storepass=keypass=`android`，alias=`atlas`，首次自动生成，不入库）。换机器重建后覆盖安装会签名不符，先 `adb uninstall com.stm32atlas.app`。
- MuMu 上调 WebView：`adb forward tcp:9333 localabstract:webview_devtools_remote_<pid>`，再开 `http://127.0.0.1:9333/json/list` 取 ws 地址。

### 首次运行行为

- WebView2 自动解压内嵌 UI 到 `%LOCALAPPDATA%\Stm32Atlas\ui\<ver>-<ts>\`。
- 后续启动使用新目录；替换 exe 后会自动换路径，不会读到旧缓存。
- 首次进「资料查询」页会探测 `模块资料\` 的位置：找不到时页面给「选择资料目录」按钮，选中后写入 `%LOCALAPPDATA%\Stm32Atlas\materials.json`，之后直接复用。

---

## 8. 快速启动指南（交接人速用）

### 验证安装

1. **双击 exe**：应弹出圆角窗口并加载亮色首页，标题栏同为亮色（白底、下边线 1px）。
2. **检查统计**：首页底部显示 `164 / 18 / 14 / 77`（函数/流程/外设/对照）。
3. **切换主题**：右上角按钮可快速切明/暗；刷新不丢数据。
4. **搜索测试**：`#/search?q=PWM` → 应出现「外设 / 知识点 / 函数 / 流程」四组结果。
5. **案例测试**：左侧「经典案例」→ LED 闪烁；详情应显示电路图、实时读数、运行/暂停、源码标签页、原理与相关函数。按「PWM 驱动舵机」的按键三次，角度应到 90°、CCR 1500、脉宽 1500 µs。
6. **引脚测试**：左侧「引脚图」→ 点 `PA9`，右侧应显示 USART/TIM 相关复用功能与「用这个引脚的案例」。
7. **知识库测试**：`#/kb/timer-pwm` 应显示教程页码与关联流程、函数。
8. **资料查询测试**：`#/materials` 应显示 14 张模块卡片与真实资料根路径（`14 个模块 / 10049 份文件 / 440.8 MB`）；筛选 `OLED` 只剩 1 张卡；进 `#/materials/oled` 能看到目录树，点「打开目录」应在资源管理器里打开 `模块资料\8-OLED显示屏`。
9. **安卓版测试**：`.\build-android.ps1 -Install -Run` → 首页正常、无可滚动溢出；左上角汉堡打开抽屉（含外设列表与底部统计）；搜索 `PWM` 有高亮；流程图单指平移、双指缩放；返回键先逐级后退，最后才退出。

### 日常开发

- 修改 `app/ui/data/*.js`、`app/ui/styles.css` 或 `app/ui/app.js` 后，Debug 模式直接 `dotnet run`；Release 版本需重新运行 `build.ps1`；安卓版共用同一套 `app/ui`，改动后要重跑 `build-android.ps1` 才会进 APK。
- 新增函数/流程前，先确保 id 符合约定（建议 `lib.periph.action` / `wf.lib.action`）并补充 `tags`。
- `模块资料\` 里增删文件或重命名模块后，重跑 `python tools\gen-materials.py` 更新索引（`data/materials.js` 是生成物，不要手改）。

### 扩展数据

函数示例：

```js
fn({
  id: "hal.gpio.init",
  lib: "hal", p: "gpio", n: "HAL_GPIO_Init",
  sig: "void HAL_GPIO_Init(...);",
  zh: "...", en: "...",
  params: [["GPIOx", "句柄"]], ret: ["无"],
  hdr: "stm32f4xx_gpio.h", eq: "std.gpio.init",
  rel: [], tags: ["init","gpio"]
})
```

案例示例：

```js
{
  id: "led-blink", folder: "3-1 LED闪烁", p: "gpio", icon: "spark", level: 1,
  title: T("LED 闪烁", "Blinking LED"),
  goal: T("…", "…"),
  files: ["User/main.c", "Hardware/LED.c"],
  channels: [{ key: "R1", pin: "PA0", to: "vcc", chain: [res("R1", 330), led("D1", "D1", "rev")] }],
  modules: [],
  controls: [],
  readouts: [{ key: "current", fmt: "ma", unit: "mA", label: T("LED 电流", "LED current") }],
  model: "blink",
  explain: [{ zh: "…", en: "…" }, …],
  check: { zh: "…", en: "…" },
  related: { kb: ["gpio-modes"], functions: ["std.gpio.init"] }
}
```

改引脚或案例源码后重跑生成器（不要手改生成物）：

```powershell
python tools\gen-pins.py        # 引脚定义 xlsx → app\ui\data\pins.js
python tools\gen-case-src.py    # 教程工程 → app\ui\data\case-src.js
python tools\gen-materials.py   # 模块资料\ → app\ui\data\materials.js
node tools\data-selftest.mjs    # 5144 项断言
```

---

## 9. 后续扩展方向（可选）

1. **外设流程补全**：NVIC 中断向量映射、DMA 通道绑定表、FLASH 页/字对齐示例。
2. **低功耗专题流程**：STOP / STANDBY / IWDG 喂狗时序 + 唤醒源配置。
3. **CubeMX 对比视图**：从 `.ioc` 导出关键代码块，自动映射到 SPL/HAL 条目。
4. **宏与位域速查**：将 `__HAL_RCC_GPIOA_CLK_ENABLE` 等宏单独列项（类似函数）。
5. **案例扩展**：补 WS2812、I²C OLED、DMA 采样等视频后续内容；支持按难度/外设筛选。
6. **知识库扩展**：加入时钟树、低功耗模式、EMC 布线要点等专题。
7. **资料页增强**：文件预览（PDF / 图片内嵌）、按类别筛选目录树、把资料条目与函数条目互链、安卓版改为手动指定资料根后读取本地文件。

---

## 10. 已知边界与约定

- SPL 示例以 **STM32F1 标准外设库**（`stm32f10x_*.h`）为准；HAL 覆盖 F1/F4。
- HAL 工程通常还需 `HAL_Init()`、`SystemClock_Config()` 和中断优先级配置，流程代码片段侧重“调用顺序 + 参数”。
- 宏与函数一样作条目收录，界面用“宏”标记；寄存器位范围以 ST 手册为准。
- 控制台审计告警：缺失 `eq/rel/related`、空步骤数组、字段非空检查等；知识与案例的 dangling 引用也会告警。
- 案例的源码是从教程工程**原文抽取**的（`case-src.js`，只做截断保护），讲解以 `explain` 为准，两者措辞不完全一致。
- 案例的「模拟」是教学级：`sim/models.js` 用显式公式推进时间（LED 电流 `(3.3−VF−0.1)/(R+Ron)`、舵机 `CCR = Angle/180*2000+500`、ADC `Code/4095*3.3`），不是 SPICE；总线（I²C/SPI/UART）只按「传了几帧、内容是什么」表示，不做时序级仿真。
- 电路图是接线示意：一引脚一行、元件串在行上、末端接 3V3/GND，不追求走线美观，也不是 PCB；交叉不代表电气连接。
- 引脚图的数据来自 `STM32F103C8T6引脚定义.xlsx`；`PA13/PA14/PA15/PB3/PB4` 在表里只写了功能名（`JTMS/SWDIO` 等），工具把它们归到 GPIO 并保留功能名，所以「涉及外设」可能只显示 GPIO。
- 生成物（`data/pins.js`、`data/case-src.js`）不要手改，改源头数据后重跑 `tools/gen-pins.py` / `tools/gen-case-src.py`。
- 目标芯片是 **STM32F103C8T6**（LQFP48、72MHz、3.3V）；电气参数取数据手册 / RM0008 的典型值并标注「典型值」。
- 窗口圆角依赖 DWM：Win11（build 22000+）生效，Win10 上自动保持方角，不影响使用。
- 迷你窗与划词取词只在桌面版有效；网页预览版没有宿主桥（`window.chrome.webview` 不存在），相关代码全部空转。
- 划词取词依赖目标程序允许 `Ctrl+C`：自绘控件、只读控件、图片里的文字取不到；取词会覆盖剪贴板内容。
- 全局热键是独占资源：`Ctrl+Alt+M` 常被输入法占用（本机就是这种情况，`RegisterHotKey` 返回 1409），程序按顺序退让，因此不同机器上的实际组合键可能不同。
- 划词监听用 `WH_MOUSE_LL` 低级鼠标钩子，只做「按下/抬起位移判断 + 一次复制」，不记录鼠标轨迹；不开启时不装钩子。
- 迷你窗刻意不嵌 WebView2：`AllowsTransparency` 窗口里的 WebView2 子 HWND 无法真透明，且会多一个浏览器进程；因此迷你窗只能用 WPF 控件渲染检索结果（没有富文本）。
- 迷你窗的不透明度作用于整窗（含文字与阴影），最低 40%；置顶关掉后它可能被主窗或其他窗口遮住，此时热键仍能开 / 关。设置写在 `%LOCALAPPDATA%\Stm32Atlas\mini.json`，删掉这个文件即恢复默认（100% / 置顶）。
- 安卓版共用同一套界面文件（`app/ui`），改动后要 exe 和 APK 各自重新构建。它跑在系统 WebView 里：老引擎（Chromium ≤110）不支持 `color-mix()`，`app/ui/compat.css` 在检测到缺支持时接管配色与半透明层；新增依赖 `color-mix()` 的样式时顺手补一条兜底，否则老手机上那条声明会被整条丢弃。主题与状态栏图标明暗通过 `AtlasAndroid` 接口回传，`html[data-host="android"]` 用于触屏微调。
- APK 不申请任何权限、不联网。页面由 `WebViewClient.shouldInterceptRequest` 从 `assets\ui` 以 `https://atlas.local` 这个虚拟 origin 流式返回，不能用 `file://`：`file://` 下 `type="module"` 的脚本会被 CORS 拦掉。
- 资料查询只读索引：`data/materials.js` 是 `tools/gen-materials.py` 的生成物，原始文件不入库；`模块资料\` 缺失时页面显示「未找到资料目录」，可用按钮重新指定并记忆到 `%LOCALAPPDATA%\Stm32Atlas\materials.json`。网页 / 安卓版没有宿主桥，只能复制相对路径。
- 阅读笔记（`data/material-notes.js`）是**人工整理**的，不是从 PDF 自动抽取：数值取自资料里的额定值，资料没写的参数不补；资料改版后要人工核对一遍，标注的出处文件名也跟着改。

---

## 11. 交付清单（当前版本）

| 文件 | 说明 |
| --- | --- |
| `PROJECT_HANDOVER.md` | 本文档 |
| `README.md` | 用户侧快速参考 |
| `dist/STM32Atlas.exe` | 最终交付单文件 exe（win-x64、自包含） |
| `dist/STM32Atlas.apk` | 安卓安装包（API 24+，离线零权限） |
| `build.ps1` | 一键重新发布 exe 的脚本 |
| `build-android.ps1` | 一键重新打 APK 的脚本（支持 `-Install` / `-Run` / `-DebugBuild`） |
| `android\` | 安卓壳源码：manifest、`MainActivity.java`、res（图标 / 应用名 / 主题） |
| `tools/gen-android-icon.py` | 生成安卓启动器图标 |
| `app\ui\compat.css` | 老 WebView 的 `color-mix()` 兜底 + 安卓触屏微调 |
| `tools/data-selftest.mjs` | 函数/流程/知识/案例/引脚/资料索引/阅读笔记数据自测（5144 项断言） |
| `tools/gen-pins.py` | 从引脚定义 xlsx 生成 `app/ui/data/pins.js` |
| `tools/gen-case-src.py` | 从教程工程抽取源码，生成 `app/ui/data/case-src.js` |
| `tools/gen-materials.py` | 从 `模块资料\` 生成 `app/ui/data/materials.js` |
| `app\ui\data\material-notes.js` | 14 篇人工整理的模块阅读笔记（参数/引脚/要点/坑/出处） |
| `app\` | Debug 源码 + UI 资源（含 woff2 字体） |

---

## 附：常用命令速查

```powershell
# Debug 开发
dotnet run --project app -c Debug

# Release 单文件
powershell -ExecutionPolicy Bypass -File .\build.ps1

# 安卓 APK
.\build-android.ps1
.\build-android.ps1 -Install -Run

# 数据自测
node tools\data-selftest.mjs

# 本地预览（可选，仅开发调试）
python -m http.server 8777 --bind 127.0.0.1
```

---

**交付人备注**：项目已编译验证、界面完整验收、数据结构与 UI 资源均内嵌或可热刷新；替换 exe 后首次启动会自动解压到新目录，无需手动拷贝。
