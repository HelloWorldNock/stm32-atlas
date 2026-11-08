# STM32 库字典 · Library Atlas

一个离线的 Windows 桌面速查工具：把 **STM32 标准外设库（SPL）** 与 **HAL** 的函数、对应关系、相关调用和典型任务流程放在同一张知识网里，并附带江协《STM32 入门教程》案例集与面向 **STM32F103C8T6** 的硬件知识库。界面中英双语，支持明暗主题（默认亮色，窗口标题栏同为亮色），最终以单文件 exe 交付；同一套界面另打成离线安卓手机版 APK。

## 已有内容

| 项目 | 数量 |
| --- | --- |
| 函数条目 | 164（SPL 85 / HAL 79） |
| 外设分类 | 14（GPIO、RCC、NVIC、EXTI、USART、SPI、I2C、TIM、ADC、DAC、DMA、IWDG、RTC、FLASH） |
| 任务流程 | 18，共 114 个步骤 |
| SPL ↔ HAL 对照 | 77 组 |
| 江协教程案例 | 14（按教程顺序，每条含可交互模拟电路、实时读数、教程原版 SPL 源码、原理与自检判据） |
| 引脚定义 | 48（LQFP48 全部引脚：类型、5V 容忍、默认复用 / 重定义、涉及外设、被哪些案例使用） |
| 硬件知识文章 | 7，逐条标注教程页码 |

每个函数包含：函数名、所属库与外设、原型、中英文说明、参数、返回值、头文件、对应函数、相关函数、出现的流程和检索标签。每个流程包含：目标、流程图、分步说明（含 SPL / HAL 代码片段）、完整代码、易错点、涉及函数与关联流程。

## 直接运行

从 [Releases](https://github.com/HelloWorldNock/stm32-atlas/releases/latest) 下载 `STM32Atlas.exe` 后双击运行（也可以在本地用 `build.ps1` 自己产出 `dist\STM32Atlas.exe`）。这是自包含的单文件程序，不需要安装 .NET。

- 系统：Windows 10/11 x64。
- 依赖：Microsoft Edge WebView2 Runtime。Windows 10/11 通常已预装；若启动时提示缺失，按窗口中的链接安装后重试。
- 首次启动会把内嵌界面解压到 `%LOCALAPPDATA%\Stm32Atlas\ui\<版本>-<时间戳>`。替换 exe 后会自动使用新目录，不会读到旧缓存。
- 全程离线，不发起网络请求。

## 安卓手机版

同一套 `app/ui` 源码也打成了安卓应用：纯 Java 壳 + 系统 WebView，没有 Kotlin、androidx 或任何第三方运行时，APK 不申请权限、不联网。装机包是 `dist\STM32Atlas.apk`，也可以直接：

```powershell
adb install -r dist\STM32Atlas.apk
```

- 系统要求 Android 7.0（API 24）及以上，arm64-v8a / x86_64 通用（不含原生库，跟设备架构无关）。
- 布局在窄屏上重排：侧栏变成抽屉，顶栏搜索框占满一行；流程图单指平移、双指缩放。
- 返回键按「先逐级后退页面 → 关闭抽屉 → 退出」的顺序处理。
- 与桌面版的差异：没有迷你查询窗、划词即查和「打开文件」（这些依赖 WPF 宿主）。
- 在模拟器里调试：

```powershell
# MuMu 模拟器（12 及以上）
& "$env:ProgramFiles\Netease\MuMuPlayer-12.0\shell\MuMuManager.exe" control -v 0 launch
adb.exe connect 127.0.0.1:16384
.\build-android.ps1 -Install -Run      # 脚本会自动 adb connect
```

## 使用方式

- **按外设查**：左侧外设列表，或“函数字典”里的外设标签。
- **按任务查**：“任务流程”按入门 / 进阶 / 综合筛选；每个流程都能看流程图、分步代码和完整工程片段。
- **按关键字查**：顶栏搜索支持函数名、外设、中文描述、标签和中英混合，例如 `PWM 占空比`、`HAL_UART`、`串口 中断`；知识文章和案例也在结果里。
- **迁移代码**：函数详情右侧的“对应函数”可直接跳到另一套库；库对照页可按外设逐行比较。
- **看案例**：左侧“经典案例”是江协《STM32 入门教程》的 14 个案例，按教程目录编号排序。每条都给出 **可交互的电路图**（引脚电压、导线通断、LED 发光、按键按下、舵机角度都会跟着变）、**实时读数**、**按得动的控件**（按键、滑杆、串口监视器）、**教程原版 SPL 源码**（分文件标签页），以及原理三条、动手改一条和跳转到相关函数与知识点的入口。
- **查引脚**：左侧“引脚图”是 STM32F103C8T6 的 LQFP48 图，点任意引脚看它的类型、是否 5V 容忍、默认复用与重定义功能、涉及的外设、被哪些案例用到；被案例占用的引脚会标绿点。也可以从案例里的引脚名直接跳到对应引脚。
- **查硬件知识**：左侧“硬件知识”是 7 篇短文——芯片资源、引脚复用、GPIO 模式与电气参数、LED 与三极管、定时器与 PWM、ADC、串口帧；每条结论都标了教程页码。
- **收藏与最近浏览**：函数和流程都能收藏，数据保存在本机；首页会显示最近看过的条目。
- **主题与语言**：右上角按钮切换明暗主题和中英文；选择会记住，下次启动沿用。
- **迷你查询窗**：点标题栏右侧的迷你按钮，或按热键展开（程序先试 `Ctrl+Alt+M`，被占用则依次退到 `Ctrl+Shift+M` / `Ctrl+Alt+K`，实际组合键见按钮提示），弹出透明小窗；在里面打字检索函数 / 流程 / 知识点 / 案例，`Enter` 打开完整条目。
- **划词即查**：在任意程序里拖选一段文字（≤80 字），迷你窗自动弹出并给出匹配条目——不需要先打开主窗口。

### 案例页怎么读

一条案例页从上到下是：面包屑 + 难度 / 外设 / 涉及知识点 → 教程目录名 → **电路与接线**（左）与**实时读数**（右）→ 控件条 → **教程原版源码**（分文件标签页）→ 原理三条 + 动手改一条 + 相关条目。

电路图里，左边是 STM32F103C8T6 的引脚，每一行是一个引脚引出的支路：从引脚出发串电阻 / LED / 按键 / 蜂鸣器，末端接 3V3 或 GND；OLED、W25Q64、舵机、编码器这类多引脚器件画成右侧方块，引脚各自对齐自己的行。引脚名右边的电压是这一瞬间的实测值，高电平的导线会变绿，LED 点亮时带光晕，按键按住时会闭合，电位器抽头会跟着滑杆移动。

读数、控件与电路是同一个模型的三种视图——拖滑杆、按按键、提交串口数据，电路、读数、OLED 屏和串口监视器会一起变。读数用的都是能算得清的式子：LED 电流按 `(3.3 − VF − 0.1) / (R + Ron)`，舵机按 `CCR = Angle / 180 × 2000 + 500`，ADC 按 `Code / 4095 × 3.3`，PWM 亮度按 `CCR / (ARR + 1)`。

### 引脚图怎么用

点芯片上的引脚（或下面的“按端口浏览”）看详情：类型（电源 / 输入 / 输出 / 双向）、是否 5V 容忍、端口位、默认复用功能与重定义功能、涉及的外设（可直接跳到函数字典的对应筛选）、以及用到这个引脚的案例。被案例占用的引脚外侧有绿点，方便看“这套教程把哪些脚用掉了、还剩哪些”。

## 快捷键与流程图操作

| 操作 | 说明 |
| --- | --- |
| `Ctrl + K` 或 `/` | 聚焦搜索框 |
| `↑` / `↓` | 在搜索结果间移动，`Enter` 打开 |
| `Esc` | 清空并退出搜索；迷你窗中则收起窗口 |
| `Ctrl+Alt+M`（退让后可能是 `Ctrl+Shift+M`） | 呼出 / 收起迷你查询窗（实际组合键见按钮提示） |
| 拖拽标题栏 | 整条标题栏（含空白处）都可以拖动窗口 |
| 滚轮 | 在流程图中上下平移 |
| `Ctrl` + 滚轮 | 缩放流程图 |
| 拖拽 | 平移流程图 |
| 适应窗口按钮 | 缩放到能看到整张流程图 |

### 迷你查询窗怎么用

小窗只有 432×145 起，搜索框 + 结果列表，不占任务栏、置顶显示，主窗口会自动收起；关掉小窗后主窗口自动回来。窗口会自动避开屏幕边缘（含多屏与 125%/150% 缩放）：贴着屏幕右下角呼出时它会翻到光标另一侧，结果变多、窗口长高时也会重新收进工作区。

| 元素 | 作用 |
| --- | --- |
| 搜索框 | 边打边查（150 ms 防抖），结果按“函数 → 流程 → 知识 → 案例”排序 |
| 结果列表 | `↑` / `↓` 移动、`Enter` 打开；也可以直接点 |
| 滑杆按钮 | 展开设置：「窗口置顶」开关与「不透明度」40–100%；两项都会记到 `%LOCALAPPDATA%\Stm32Atlas\mini.json`，下次启动照旧 |
| 眼睛按钮 | 开 / 关划词监听；开着时在别的程序里拖选文字就会取词（内部发一次 `Ctrl+C` 读剪贴板） |
| `Esc` / × | 收起小窗，划词监听状态保持不变 |

窗口位置跟着鼠标走：默认出现在光标右下 16×20 像素处，靠近屏幕右 / 下边缘时自动翻到另一侧。小窗外观跟随主窗口主题（亮色白卡、深色深蓝卡）。

## 从源码构建

要求：.NET 6 SDK（或更高版本的 SDK，目标框架保持 `net6.0-windows`）。

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

产物为 `dist\STM32Atlas.exe`（win-x64、自包含、单文件）；APK 用 `build-android.ps1` 单独产出，与 exe 并存于 `dist`。脚本会先清空 `dist` 里的 exe，再执行：

```powershell
dotnet publish app\Stm32Atlas.csproj -c Release -r win-x64 --self-contained true -o dist `
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true `
  -p:EnableCompressionInSingleFile=true -p:DebugType=none
```

开发时直接运行 Debug 版本即可，程序会优先使用 exe 同级的 `ui` 目录，不必每次重新打包：

```powershell
dotnet run --project app -c Debug
```

### 界面资源如何进入 exe

`app\Stm32Atlas.csproj` 把 `app\ui\**\*` 以 `LogicalName=ui/...` 内嵌。发布版启动时由 `UiAssets.ResolveFolder()` 解压到本机目录，再由 WebView2 的虚拟主机 `https://stm32.local/` 加载。Debug 版直接读磁盘上的 `ui`，修改 HTML/CSS/JS 后刷新即可。

### 安卓版构建

要求：JDK 17（脚本先读 `JAVA_HOME`，没有则回退 `C:\jdk17`）+ Android SDK（`ANDROID_HOME`，没有则回退 `D:\AndroidSdk`，需装 `platforms;android-35` 与 `build-tools;35.0.0`）。

```powershell
.\build-android.ps1                    # 构建，产物 dist\STM32Atlas.apk
.\build-android.ps1 -Install           # 顺带 adb install -r
.\build-android.ps1 -Run               # 顺带启动（无设备时自动 adb connect 127.0.0.1:16384）
.\build-android.ps1 -Clean -Run        # 清中间产物后重建并启动
.\build-android.ps1 -DebugBuild -Run   # debuggable 构建，可 chrome://inspect 调 WebView
```

脚本把 `app\ui` 拷进 APK 的 `assets`，再用 `aapt2` → `javac` → `d8` → `zipalign` → `apksigner` 串起来，中间产物落在 `%TEMP%\stm32-atlas-android`。几个坑记一下：`-DebugBuild` 不能简写成 `-Debug`（与 PowerShell 通用参数冲突）；脚本是 UTF-8 with BOM，改动后别丢 BOM；native 工具对中文路径和 `aapt2 -A` 的末尾反斜杠敏感，脚本里已处理；签名用首次自动生成的 `android\keystore\atlas.jks`（不入库），换机器重建后覆盖安装要先 `adb uninstall com.stm32atlas.app`。

## 目录结构

```text
.
├─ build.ps1                  # 单文件发布脚本（产物 dist\STM32Atlas.exe，不入库）
├─ build-android.ps1          # 安卓 APK 构建脚本（产物 dist\STM32Atlas.apk）
├─ android\                   # 安卓壳源码：AndroidManifest、MainActivity.java、res、keystore
├─ tools\
│  ├─ data-selftest.mjs       # 数据自测（node，零依赖）
│  ├─ gen-pins.py             # 从引脚定义 xlsx 生成 data\pins.js
│  ├─ gen-case-src.py         # 从教程工程抽取源码，生成 data\case-src.js
│  └─ gen-android-icon.py     # 生成安卓启动器图标
└─ app\
   ├─ MainWindow.xaml(.cs)    # 无边框圆角窗口、WebView2 宿主、热键、划词监听、消息桥
   ├─ MiniWindow.xaml(.cs)    # 迷你查询窗：搜索框 + 结果列表，纯 WPF（不另开 WebView2）
   ├─ app.manifest            # DPI 感知（per-monitor v2），避免高分屏下界面被位图放大发虚
   ├─ UiAssets.cs             # 内嵌 UI 的解压与版本目录
   ├─ Stm32Atlas.csproj
   └─ ui\
      ├─ index.html
      ├─ styles.css           # 设计令牌、组件、明暗主题、响应式
      ├─ compat.css           # 老 WebView（Chromium ≤110）的 color-mix 兜底 + 触屏微调
      ├─ app.js               # 路由、渲染、流程图、案例模拟、引脚图tree app.js
      ├─ i18n.js              # 界面中英文案
      ├─ icons.js             # 内联 SVG 图标
      ├─ fonts\               # 本地 IBM Plex Sans / JetBrains Mono
      ├─ sim\
      │  ├─ sch.js            # 电路图渲染（行布局：一引脚一行，串元件，接 VCC/GND，跨行模块方块）
      │  ├─ models.js         # 14 个案例的行为模型（step 推进时间，view 给出引脚/元件/读数/OLED/串口）
      │  └─ pinout.js         # LQFP48 引脚图 SVG
      └─ data\
         ├─ peripherals.js    # 14 个外设的元数据与强调色
         ├─ util.js           # fn() 数据归一化
         ├─ fn-core.js        # GPIO / RCC / NVIC / EXTI
         ├─ fn-serial.js      # USART / SPI / I2C
         ├─ fn-timer.js       # TIM / ADC / DAC
         ├─ fn-memory.js      # DMA / IWDG / RTC / FLASH
         ├─ wf-gpio.js        # 流程模板 + GPIO 流程
         ├─ wf-serial.js      # 通信 / 定时类流程
         ├─ wf-system.js      # 系统 / 模拟类流程
         ├─ kb.js             # 7 篇硬件知识文章
         ├─ pins.js           # 48 个引脚（由 gen-pins.py 生成，勿手改）
         ├─ cases.js          # 14 个江协案例：电路、控件、读数、模型、讲解、判据
         ├─ case-src.js       # 案例源码（由 gen-case-src.py 从教程工程抽取，勿手改）
         └─ index.js          # 聚合、对照表、反查索引、搜索、统计、完整性审计
```

## 扩展数据

函数用 `fn({...})` 声明，核心字段：

```js
fn({
  id: "std.gpio.init",        // 全局唯一，建议 lib.periph.action
  lib: "std",                 // "std" | "hal"
  p: "gpio",                  // 外设 id，需存在于 peripherals.js
  n: "GPIO_Init",             // 函数名
  sig: "void GPIO_Init(...);",
  zh: "中文说明", en: "English description",
  params: [["GPIOx", "中文", "English"]],
  ret: ["无", "None"],
  hdr: "stm32f10x_gpio.h",
  eq: "hal.gpio.init",        // 对应函数，可省略
  rel: ["std.rcc.apb2clockcmd"],
  tags: ["初始化", "init", "pin"]
})
```

流程的核心字段为 `id / p / level / libs / title{zh,en} / goal{zh,en} / steps[] / code{std,hal} / pitfalls[] / related[] / tags[]`。步骤里用 `fn: ["std.gpio.init", "hal.gpio.init"]` 关联函数，界面会自动生成函数反查和流程图节点。

知识文章用 `KB_ARTICLES` 声明：`id / p / icon / title{zh,en} / summary{zh,en} / blocks[] / refs[] / related{ workflows, functions }`，`blocks` 支持 `p`、`list`、`formula`、`warn` 四种。

江协案例用 `CASES` 声明，核心字段：

```js
{
  id: "servo", folder: "6-4 PWM驱动舵机",   // folder 是教程源码目录名
  p: "tim", icon: "arrows", level: 4,
  title: T("PWM 驱动舵机", "Servo via PWM"),
  goal: T("…", "…"),
  files: ["User/main.c", "Hardware/PWM.c", "Hardware/Servo.c"],  // 源码标签页，由 case-src.js 提供正文
  channels: [{ key: "K1", pin: "PB1", to: "gnd", chain: [btn("K1", "K1")] }],
  modules: [{ key: "M1", ref: "M1 · SG90 舵机", pins: { SIG: "PA1" }, lines: T(["橙=信号 PA1"], ["orange: SIG PA1"]) }],
  controls: [{ key: "key1", kind: "button", label: T("按 K1（+30°）", "Press K1 (+30°)") }],
  readouts: [{ key: "angle", fmt: "deg", unit: "°", label: T("角度", "Angle") }],
  model: "servo", opts: {},
  explain: [T("…", "…"), T("…", "…"), T("…", "…")],
  check: T("…", "…"),
  related: { kb: ["timer-pwm"], workflows: ["wf.tim-pwm"], functions: ["std.tim.ocinit"] }
}
```

- `channels[].chain` 里的元件由 `res/led/btn/buzzer/npn/pot/cap/servo` 这些助手函数生成；支路 `kind: "divider"` 表示电位器分压（竖接 3V3 与 GND，抽头接回引脚）。`modules` 里的 `pins` 必须是真实 GPIO 名，否则引脚图不会把它们算作“被案例占用”。
- `model` 必须是 `sim/models.js` 里已实现的键（`blink / flow / buzzer / keys / light / encoder / timer / breath / servo / adc / uart / spi / rtc / uid`）；`readouts[].key` 必须出现在模型 `view().values` 里，`fmt` 取 `n / v / ma / pct / deg / hex / raw / bool / dark`。
- `related.functions` 必须写**函数 id**（如 `std.tim.ocinit`），不是外设名；`related.kb` 与 `related.workflows` 必须是已存在的 id。
- 引脚表与案例源码是**生成物**：`pins.js` 由 `tools\gen-pins.py` 从 `STM32F103C8T6引脚定义.xlsx` 生成，`case-src.js` 由 `tools\gen-case-src.py` 从教程工程目录抽取（先试 UTF-8 再回退 GBK，单文件超长会截断）。改引脚定义或换教程工程后重跑这两个脚本，不要手改生成物。


新增条目前后，浏览器控制台会运行 `data/index.js` 里的完整性检查；如果 `eq`、`rel`、流程步骤、知识文章或案例的 `related` 引用了不存在的 id，会打印告警。改完数据后跑一次数据自测：

```powershell
node tools\data-selftest.mjs
```

它逐条校验函数与流程的引用完整性、7 篇知识文章的结构与页码、14 个案例的电路 / 控件 / 读数 / 模型与源码、48 个引脚的自洽性，并渲染一遍电路图确认没有 `undefined` / `NaN`，当前基线是 **3816 项断言**。

## 内容约定与边界

- SPL 示例以 **STM32F1 标准外设库**（`stm32f10x_*.h`）为准；HAL 覆盖 **F1 / F4**。详情页会提示 F4 替换规则：`stm32f10x_` → `stm32f4xx_`、`f1xx` → `f4xx`。
- 目标芯片是 **STM32F103C8T6**（LQFP48、72MHz、3.3V）；文中出现的电气参数取数据手册 / RM0008 的典型值，并标注「典型值」（推挽 Ron ≈ 50Ω、上拉 40kΩ、VIL/VIH ≈ 0.3/0.7 VDD、VCEsat 0.2V、VBE 0.7V）。
- F103C8T6 没有 DAC、SDIO、FSMC、I2S；库字典里的通用条目按型号差异在知识库里做了标注。
- 知识文章的页码对应仓库根的 `STM32入门教程.md`（207 页），不是外部链接。
- 案例的 SPL 代码是从教程工程里**原文抽取**的（`User\`、`Hardware\` 下的 .c/.h），只做了截断保护，没有改写；页面上的讲解以 `explain` 为准，两者措辞不完全一致。
- 案例的“模拟”是教学级：`sim/models.js` 用几行显式公式推进时间，读数、OLED、串口都是按教程程序的逻辑手写的，**不是 SPICE 电路仿真**，也不做时序级的总线仿真（I²C / SPI / 串口按“传了几帧、内容是什么”表示）。
- 电路图是**接线示意**，按引脚分行布局，不追求走线美观，也不代表真实 PCB；交叉点是示意，不代表电气连接。
- 引脚图的类型 / 复用 / 重定义功能来自 `STM32F103C8T6引脚定义.xlsx`；`PA13/PA14/PA15/PB3/PB4` 这类调试引脚在表里只写了 `JTMS/SWDIO` 等功能名，本工具把它们归到 GPIO 并保留功能名，所以“涉及外设”里可能只显示 GPIO。
- HAL 工程通常还需要 `HAL_Init()`、`SystemClock_Config()` 和中断优先级配置，示例里不重复展开。
- 宏（如 `__HAL_RCC_GPIOA_CLK_ENABLE`）与函数一样作为条目收录，界面上会用“宏”标记。
- 具体寄存器位、返回值范围以 ST 官方固件库头文件为准；本工具是速查与迁移辅助，不替代数据手册。
- 迷你窗与划词取词只在 Windows 桌面版（exe）里可用；网页预览版没有宿主，相关代码自动空转。
- 迷你窗的不透明度是整窗一起变的（含文字），调到很低时以“能看清”为准；置顶关掉后它会被主窗口或其他窗口盖住，此时按热键仍是开 / 关切换。
- 划词取词靠一次 `Ctrl+C` 读剪贴板：目标程序必须允许复制（只读控件、自绘控件、图片里的文字取不到），取到的文字会覆盖剪贴板内容。
- 全局热键可能被输入法或别的软件占用，程序会按 `Ctrl+Alt+M` → `Ctrl+Shift+M` → `Ctrl+Alt+K` 顺序退让，实际生效的组合键显示在迷你按钮提示和窗口底部。
- 安卓版与桌面版共用 `app/ui` 一份界面源码，改动后两边各自重新构建。它跑在系统 WebView 里，老引擎（Chromium ≤110）不支持 `color-mix()`，`app/ui/compat.css` 会在检测到缺支持时接管配色；新增依赖 `color-mix()` 的样式时记得补一条兜底，否则那条声明在旧手机上会被整条丢弃。
- APK 不申请任何权限、不联网。页面由 `MainActivity` 的 `shouldInterceptRequest` 从 `assets\ui` 以 `https://atlas.local` 这个虚拟 origin 返回——不能用 `file://`，那样 `type="module"` 的脚本会被 CORS 拦掉。
