/* ============================================================
   模块资料 · 阅读笔记
   ------------------------------------------------------------
   这些条目是从 `模块资料\` 里的原始文档读出来、重新整理的：参数与接口来自
   各模块 PDF 手册 / 原理图；接线与电平极性的说法以使用说明与原理图为准；
   数值都标注了额定量程，未在资料里出现的参数不写。
   字段：
     takeaway  一句话结论（卡片和详情页顶部）
     specs     参数表 [名称, 取值]
     pins      接口 / 引脚 [名称, 说明]
     steps     使用要点（有序）
     cautions  容易踩的坑
     sources   出处 [{ file, hint }]
   多语言文本一律 { zh, en }；纯 ASCII 的取值可以直接用字符串。
   ============================================================ */

const T = (zh, en) => ({ zh, en });

export const MATERIAL_NOTES = {
  /* ---------------------------------------------------------- 1 核心板 */
  core: {
    takeaway: T(
      "STM32F103C8T6 最小系统板：micro USB 供电、两排 2.54 排针引出全部 IO，板载电源与 PC13 指示灯、复位键、BOOT 跳线和 4 针 SWD。",
      "STM32F103C8T6 minimal board: micro-USB power, two 2.54 mm headers for every IO, power and PC13 LEDs, reset button, BOOT jumpers and a 4-pin SWD header."
    ),
    specs: [
      [T("主控", "MCU"), T("STM32F103C8T6，LQFP48，Cortex-M3 72 MHz", "STM32F103C8T6, LQFP48, Cortex-M3 at 72 MHz")],
      [T("存储", "Memory"), T("64 KB Flash / 20 KB SRAM", "64 KB flash / 20 KB SRAM")],
      [T("供电", "Supply"), T("USB 5 V 输入，板载 3.3 V；IO 供电 2.0–3.6 V", "5 V from USB, 3.3 V on board; IO rails 2.0–3.6 V")],
      [T("指示", "Indicators"), T("电源灯 D1 + PC13 灯 D2，各串 510 Ω", "Power LED D1 + PC13 LED D2, each with a 510 Ω resistor")],
      [T("复位", "Reset"), T("SW1 按键 + 10 kΩ 上拉 + 105 电容", "SW1 button, 10 kΩ pull-up, 1 µF cap")],
      [T("启动", "Boot"), T("BOOT0 / BOOT1 各一组跳线，100 kΩ 下拉", "BOOT0 / BOOT1 jumper pairs with 100 kΩ pull-downs")],
      [T("接口", "Interfaces"), T("micro USB、4 针 SWD、两组 20 针排针", "micro-USB, 4-pin SWD, two 20-pin headers")],
    ],
    pins: [
      [T("P2 · SWD", "P2 · SWD"), T("3V3 / SWDIO / SWCLK / GND，接 ST-LINK 下载调试", "3V3 / SWDIO / SWCLK / GND for ST-LINK")],
      [T("P3 · P4", "P3 · P4"), T("2×20 排针，按丝印引出 PA0–PA15、PB0–PB15、3V3、5V、GND、VBAT", "2×20 headers exposing PA0–PA15, PB0–PB15, 3V3, 5V, GND, VBAT per silkscreen")],
      [T("P1 · BOOT", "P1 · BOOT"), T("3×2 跳线帽选择 BOOT0 / BOOT1 电平", "3×2 jumper block for BOOT0 / BOOT1 levels")],
      [T("USB", "USB"), T("micro USB 只作供电与 USB 功能，串口要走 CH340 或板外 USB-TTL", "micro-USB is power/USB only; serial needs a CH340 or external USB-TTL")],
    ],
    steps: [
      T("插 USB 上电，电源灯亮；不亮先量 3V3 与 GND 是否短路。", "Plug in USB; if the power LED stays dark, check 3V3 against GND first."),
      T("用 4 根杜邦线把 SWD 接到 ST-LINK（3V3、SWDIO、SWCLK、GND 一一对应）。", "Wire SWD to the ST-LINK (3V3, SWDIO, SWCLK, GND)."),
      T("正常运行时 BOOT0 跳线置 0；需要串口 ISP 才置 1 后复位。", "Keep BOOT0 at 0 for normal run; set it to 1 and reset only for ISP."),
      T("先跑 PC13 闪灯例程确认时钟与下载链路，再上外设。", "Run the PC13 blink example first to confirm clock and download path."),
    ],
    cautions: [
      T("数字 IO 多数可容忍 5 V，但 ADC 输入（PA0–PA7 等）不得超过 3.3 V。", "Most digital IO is 5 V tolerant, but ADC inputs (PA0–PA7…) must stay within 3.3 V."),
      T("BOOT1 与 PB2 是同一个引脚，跳线接错会让 PB2 失效。", "BOOT1 shares PB2; a wrong jumper makes PB2 unusable."),
      T("板子由 USB 5 V 供电时，别再往 5V 排针反灌电源。", "Do not back-feed the 5V header while USB powers the board."),
    ],
    sources: [
      { file: "STM32F103C8T6核心板原理图.pdf", hint: T("复位、BOOT、LED、SWD 与两组排针的连线", "Reset, BOOT, LEDs, SWD and header wiring") },
      { file: "STM32F103x8B_DS_CH_V10.pdf", hint: T("存储器容量、供电范围、外设数量（中文第 10 版）", "Memory, supply range and peripheral counts (CN rev. 10)") },
      { file: "核心板测试程序(PC13闪烁)/readme.txt", hint: T("厂家闪灯例程说明", "Vendor blink example notes") },
    ],
  },

  /* ---------------------------------------------------------- 2 ST-LINK */
  stlink: {
    takeaway: T(
      "ST-LINK V2 下载器：装好 ST-Link 驱动后，用 4 线 SWD 连板子，可在 ST-LINK Utility / MDK 里烧 hex、在 STVP 里烧 STM8。",
      "ST-LINK V2 probe: install the ST-Link driver, wire 4-line SWD, then flash hex from ST-LINK Utility or MDK, and STM8 parts from STVP."
    ),
    specs: [
      [T("接口", "Host"), "USB 2.0 全速"],
      [T("目标接口", "Target"), T("SWD / SWIM（STM8）", "SWD / SWIM (STM8)")],
      [T("供电", "Power"), T("目标板需自行供电，下载器只提供参考电平", "Target board must be powered; the probe only senses levels")],
      [T("配套软件", "Software"), T("ST-Link 驱动、STM32 ST-LINK Utility、STVP、MDK", "ST-Link driver, STM32 ST-LINK Utility, STVP, MDK")],
    ],
    pins: [
      [T("SWDIO", "SWDIO"), T("数据线，接目标板 SWDIO（PA13）", "Data, to target SWDIO (PA13)")],
      [T("SWCLK", "SWCLK"), T("时钟线，接目标板 SWCLK（PA14）", "Clock, to target SWCLK (PA14)")],
      [T("GND", "GND"), T("必须与目标板共地", "Must be common ground with the target")],
      [T("3V3", "3V3"), T("参考电平，不要当电源给整板供电", "Reference level only — not a board supply")],
    ],
    steps: [
      T("先装驱动再插下载器，设备管理器里应出现 STM32 STLink。", "Install the driver before plugging in; Device Manager should list STM32 STLink."),
      T("SWD 四线接好、目标板上电，再打开 ST-LINK Utility 点 Connect。", "Wire SWD, power the target, then hit Connect in ST-LINK Utility."),
      T("打开 hex → Target → Program & Verify，完成后按需复位。", "Open the hex, Target → Program & Verify, then reset."),
      T("固件升级在 Utility 的 Firmware upgrade 里做，过程中不要拔线。", "Use Firmware upgrade in the utility; never unplug while it runs."),
    ],
    cautions: [
      T("VCC 与 GND 接反是最常见的“连不上”，先用万用表确认线序。", "Swapped VCC/GND is the usual “cannot connect”; buzz the wiring first."),
      T("目标板没供电时能识别芯片但读不出 Flash。", "Without target power you may see the chip but cannot read flash."),
      T("固件升级中途断电有变砖风险，按手册用官方工具修复。", "Interrupting a firmware upgrade can brick the probe; recover with the official tool."),
    ],
    sources: [
      { file: "ST-LINK+V2使用说明.pdf", hint: T("驱动安装、固件升级、Utility 烧写、STVP 下载、MDK 调试", "Driver install, firmware upgrade, utility flashing, STVP and MDK debugging") },
    ],
  },

  /* ---------------------------------------------------------- 3 蜂鸣器 */
  buzzer: {
    takeaway: T(
      "有源蜂鸣器模块用 S8550 三极管（PNP）做开关：控制端给低电平导通发声，高电平停止；有源模块不需要外部 PWM 频率。",
      "The active buzzer module switches a PNP S8550: a low level on the control pin turns it on, high turns it off. Being active, it needs no drive frequency."
    ),
    specs: [
      [T("工作电压", "Supply"), "3.3–5 V"],
      [T("驱动", "Driver"), T("S8550 PNP 三极管，基极串 1 kΩ", "S8550 PNP transistor, 1 kΩ base resistor")],
      [T("类型", "Type"), T("有源（内部自带振荡源）", "Active (self-oscillating)")],
      [T("接口", "Pins"), T("3 针：VCC / 信号 / GND", "3 pins: VCC / signal / GND")],
    ],
    pins: [
      [T("1 · VCC", "1 · VCC"), T("电源正 3.3–5 V", "Supply 3.3–5 V")],
      [T("2 · 信号", "2 · SIG"), T("经 1 kΩ 接 S8550 基极，低电平响", "Via 1 kΩ to the S8550 base; low = sound")],
      [T("3 · GND", "3 · GND"), T("电源地", "Ground")],
    ],
    steps: [
      T("VCC/GND 接好，先不接信号，确认不上电时蜂鸣器不响。", "Wire VCC/GND first and confirm it stays silent."),
      T("信号脚接 GPIO，配置为推挽输出，初始输出高电平。", "Connect the signal pin to a push-pull GPIO, idling high."),
      T("输出低电平即响，拉高即停；需要“嘀”声就翻转两次电平。", "Drive it low to sound and high to stop; toggle twice for a beep."),
    ],
    cautions: [
      T("有源蜂鸣器给方波不会变调，只有通断两种状态。", "An active buzzer ignores frequency — it is on or off."),
      T("负载由三极管承担，仍建议避免长时间连续鸣叫。", "The transistor carries the load, but avoid leaving it on for long periods."),
      T("若上电就一直响，多半是信号脚悬空或接到了 3.3 V。", "If it sounds immediately, the signal pin is floating or tied to 3.3 V."),
    ],
    sources: [
      { file: "有源蜂鸣器模块原理图.png", hint: T("S8550 开关电路与 P1 三针定义", "S8550 switch circuit and the 3-pin header") },
      { file: "有源蜂鸣器模块实物图.png", hint: T("模块与排针方向", "Module and header orientation") },
    ],
  },

  /* ---------------------------------------------------------- 4 光敏 */
  ldr: {
    takeaway: T(
      "LM393 比较器输出开关量：光线低于阈值时 DO 为高，超过阈值时 DO 变低；3 线制只有 DO，4 线制多一路 AO 模拟量。",
      "An LM393 comparator gives a digital output: DO is high while it is darker than the threshold and drops low when brighter. The 3-wire version has DO only; the 4-wire version adds AO."
    ),
    specs: [
      [T("工作电压", "Supply"), "3.3–5 V"],
      [T("比较器", "Comparator"), T("LM393（宽电压）", "LM393 (wide supply)")],
      [T("输出", "Output"), T("DO 数字开关量，驱动能力 > 15 mA", "DO digital, > 15 mA drive")],
      [T("调节", "Adjust"), T("蓝色电位器调亮度阈值", "Blue trim-pot sets the light threshold")],
      [T("尺寸", "Size"), T("PCB 32 × 14 mm（3 线制）", "PCB 32 × 14 mm (3-wire)")],
      [T("版本", "Versions"), T("3 线制：VCC/GND/DO；4 线制加 AO、原理图与尺寸图", "3-wire: VCC/GND/DO; 4-wire adds AO and ships schematic + dimension drawing")],
    ],
    pins: [
      [T("VCC", "VCC"), T("3.3–5 V", "3.3–5 V")],
      [T("GND", "GND"), T("电源地", "Ground")],
      [T("DO", "DO"), T("TTL 开关量：暗→高，亮→低（按说明书）", "TTL: dark → high, bright → low (per manual)")],
      [T("AO（4 线制）", "AO (4-wire)"), T("光敏电阻分压的模拟电压，接 ADC", "Analog divider voltage, goes to an ADC")],
    ],
    steps: [
      T("接 VCC/GND，电源指示灯亮；手遮住光敏电阻看开关指示灯是否翻转。", "Power it and check that covering the sensor flips the indicator LED."),
      T("在目标光照下旋电位器到临界点，再回调一点留出余量。", "Trim to the threshold at the real light level, then back off slightly."),
      T("DO 接 GPIO 输入（上拉或浮空），按高低电平判断明暗。", "Feed DO into a GPIO input and read the level."),
      T("4 线制可把 AO 接 ADC，得到连续的光照趋势。", "On the 4-wire version, AO can go to an ADC for a continuous trend."),
    ],
    cautions: [
      T("DO 是开关量，读不到照度数值；要数值只能用 AO。", "DO is a switch, not a lux value; only AO is analog."),
      T("阈值受环境光影响，换场地要重新标定。", "The threshold drifts with ambient light — recalibrate after moving it."),
      T("阳光或红外光源会干扰判断，必要时加遮光罩。", "Sunlight and IR sources disturb it; add a shroud if needed."),
    ],
    sources: [
      { file: "光敏电阻传感器模块使用说明书3线制.pdf", hint: T("产品特色、阈值极性、接线定义", "Features, threshold polarity, wiring") },
      { file: "光敏电阻4线-原理图.jpg", hint: T("4 线制的 AO/DO 分压与比较器电路", "4-wire AO/DO divider and comparator") },
      { file: "光敏电阻模块使用说明.png", hint: T("模块实物与电位器位置", "Module photo and trim-pot position") },
    ],
  },

  /* ---------------------------------------------------------- 5 热敏 */
  ntc: {
    takeaway: T(
      "YL-38 热敏电阻模块：LM393 比较出 DO，另有 AO 模拟输出；温度超过设定阈值时 DO 由高变低，阈值用电位器调。",
      "YL-38 thermistor module: LM393 gives DO plus an AO analog output. DO falls from high to low once the temperature passes the trim-pot threshold."
    ),
    specs: [
      [T("型号", "Model"), "YL-38"],
      [T("工作电压", "Supply"), "3.3–5 V"],
      [T("比较器", "Comparator"), T("LM393，双路比较", "LM393 dual comparator")],
      [T("输出", "Outputs"), T("DO 数字量 + AO 模拟量（4 线制）", "DO digital + AO analog (4-wire)")],
      [T("调节", "Adjust"), T("蓝色电位器调温度阈值", "Blue trim-pot sets the temperature threshold")],
      [T("尺寸", "Size"), T("PCB 30 × 16 mm", "PCB 30 × 16 mm")],
    ],
    pins: [
      [T("VCC", "VCC"), T("3.3–5 V", "3.3–5 V")],
      [T("GND", "GND"), T("电源地", "Ground")],
      [T("DO", "DO"), T("低于阈值高、超过阈值低", "High below threshold, low above it")],
      [T("AO", "AO"), T("热敏电阻分压，接 ADC 得连续值", "Thermistor divider, feed an ADC")],
    ],
    steps: [
      T("接 VCC/GND，电源灯亮；手捏热敏电阻让它升温，看开关指示灯是否亮。", "Power it, pinch the thermistor to warm it, and watch the indicator."),
      T("在常温下调电位器到刚好不亮，再升温确认会翻转到亮。", "Trim at room temperature until it just turns off, then warm it to confirm it turns on."),
      T("DO 接 GPIO 做阈值报警，AO 接 ADC 做温度趋势或查表换算。", "Use DO for an alarm and AO with an ADC for trend or table lookup."),
      T("厂家 51 例程按 9600 波特从串口发 01，可对照验证接线。", "The vendor 8051 demo sends 01 at 9600 baud; use it to sanity-check wiring."),
    ],
    cautions: [
      T("NTC 阻值随温度升高而下降，换算方向与 PTC 相反。", "NTC resistance drops as it warms — the opposite of a PTC."),
      T("DO 只是“过没过阈值”，温度数值要靠 AO 标定。", "DO only tells you past/not-past; the actual temperature needs AO calibration."),
      T("热敏电阻响应慢，测体温这类场景要等读数稳定。", "Thermistors respond slowly; wait for the reading to settle."),
    ],
    sources: [
      { file: "热敏电阻传感器使用说明.pdf", hint: T("模块描述、4 线接口、51 测试接线与现象", "Description, 4-wire interface, 8051 test wiring and behaviour") },
      { file: "热敏电阻传感器原理图.pdf", hint: T("LM393 分压与比较电路、RC 滤波", "LM393 divider/comparator with RC filtering") },
      { file: "热敏电阻模块使用说明.png", hint: T("实物与电位器位置", "Photo and trim-pot position") },
    ],
  },

  /* ---------------------------------------------------------- 6 反射式红外 */
  "ir-reflect": {
    takeaway: T(
      "TCRT5000 寻迹模块：红外反射检测 1–25 mm，反射够强时 DO 变低、指示灯亮；无反射时 DO 为高。",
      "TCRT5000 line sensor: IR reflection within 1–25 mm pulls DO low and lights the indicator; without reflection DO stays high."
    ),
    specs: [
      [T("传感器", "Sensor"), "TCRT5000"],
      [T("检测距离", "Range"), T("1–25 mm", "1–25 mm")],
      [T("工作电压", "Supply"), "3.3–5 V"],
      [T("比较器", "Comparator"), T("LM393，输出 > 15 mA", "LM393, > 15 mA drive")],
      [T("输出", "Outputs"), T("DO 开关量 + AO 模拟量", "DO digital + AO analog")],
      [T("尺寸", "Size"), T("PCB 32 × 14 mm", "PCB 32 × 14 mm")],
    ],
    pins: [
      [T("VCC", "VCC"), T("3.3–5 V", "3.3–5 V")],
      [T("GND", "GND"), T("电源地", "Ground")],
      [T("DO", "DO"), T("有反射→低，无反射→高", "Reflection → low, none → high")],
      [T("AO", "AO"), T("接收管电流的模拟量，接 ADC 判灰度", "Analog of the receiver, ADC for grey level")],
    ],
    steps: [
      T("接 VCC/GND，把模块离白纸 5–10 mm，指示灯应亮、DO 为低。", "Power it, hold it 5–10 mm over white paper: the LED lights and DO goes low."),
      T("换到黑线/黑色表面，指示灯灭、DO 变高，说明黑白可分辨。", "Over black the LED goes out and DO returns high — black/white is resolvable."),
      T("用多圈电位器把黑白切换点调到场景中间位置。", "Trim the multi-turn pot so the black/white transition sits mid-scene."),
      T("循迹时 DO 接 GPIO，按左右传感器的高低组合决定转向。", "For line following, read both DO pins and steer from the pair."),
    ],
    cautions: [
      T("超过 25 mm 反射不足会一直判“无反射”，不要悬太高。", "Beyond ~25 mm there is not enough reflection; do not mount it high."),
      T("强环境光会抬高接收管电流，户外使用要加遮光。", "Strong ambient light raises receiver current; shade it outdoors."),
      T("电平极性与对射式模块相反，互换前先确认型号。", "Its polarity is the opposite of the slotted module — check the part first."),
    ],
    sources: [
      { file: "寻迹传感器模块使用说明书.pdf", hint: T("TCRT5000 工作原理、接线与发货清单", "TCRT5000 operation, wiring and packing list") },
      { file: "寻迹传感器模块电路图.pdf", hint: T("VCC/GND/DO/AO 四线定义", "VCC/GND/DO/AO pinout") },
      { file: "反射式光电传感器__TCRT5000.pdf", hint: T("器件本身的电气与光学参数", "Device electrical and optical ratings") },
    ],
  },

  /* ---------------------------------------------------------- 7 对射式红外 */
  "ir-slot": {
    takeaway: T(
      "槽型光耦测速模块：槽内无遮挡 OUT 为低，被遮挡 OUT 变高——电平极性与反射式相反，适合码盘计数与限位。",
      "Slotted opto speed module: OUT is low with a clear slot and goes high when blocked — the opposite of the reflective module. Good for encoder discs and end stops."
    ),
    specs: [
      [T("传感器", "Sensor"), T("ITR9606 槽型光耦", "ITR9606 slotted optocoupler")],
      [T("槽宽", "Slot"), T("宽槽版 10 mm / 窄槽版", "Wide slot 10 mm / narrow slot version")],
      [T("工作电压", "Supply"), "3.3–5 V"],
      [T("比较器", "Comparator"), T("LM393，输出 > 15 mA", "LM393, > 15 mA drive")],
      [T("输出", "Output"), T("OUT 数字开关量（无遮挡低、遮挡高）", "OUT digital (clear low, blocked high)")],
      [T("尺寸", "Size"), T("PCB 23 × 20 mm", "PCB 23 × 20 mm")],
    ],
    pins: [
      [T("VCC", "VCC"), T("3.3–5 V", "3.3–5 V")],
      [T("GND", "GND"), T("电源地", "Ground")],
      [T("OUT", "OUT"), T("TTL 开关量，接 IO 或外部中断", "TTL, to a GPIO or EXTI")],
    ],
    steps: [
      T("接 VCC/GND，电源灯亮；用纸片插进槽里，指示灯应该亮。", "Power it; slide paper into the slot and the indicator lights."),
      T("OUT 接 GPIO 输入，先用轮询确认遮挡时读到高电平。", "Wire OUT to a GPIO and confirm a high level when blocked."),
      T("测转速时把 OUT 接外部中断或定时器编码器模式计数。", "For RPM, count on EXTI or a timer encoder input."),
      T("按“每转 N 个脉冲”换算：转速 = 脉冲数 / N / 采样时间。", "Convert with RPM = pulses / N / sample time."),
    ],
    cautions: [
      T("无遮挡输出低、遮挡输出高，写逻辑时别照抄反射式。", "Clear = low, blocked = high; do not copy reflective-module logic."),
      T("码盘与槽宽要匹配，太厚或偏心会卡住或漏计数。", "Match the disc thickness to the slot; thick or wobbly discs miss counts."),
      T("高速旋转时轮询会丢脉冲，优先用中断或硬件计数。", "Polling misses pulses at speed — use interrupts or hardware counting."),
    ],
    sources: [
      { file: "测速传感器模块使用说明书（宽槽版）.pdf", hint: T("槽宽、输出极性、接线与用途", "Slot width, polarity, wiring, use cases") },
      { file: "测速传感器模块电路图（宽槽版）.pdf", hint: T("三线定义与比较器电路", "3-wire pinout and comparator circuit") },
      { file: "ITR9606.pdf", hint: T("光电开关的电流与响应参数", "Opto switch current and response specs") },
    ],
  },

  /* ---------------------------------------------------------- 8 OLED */
  oled: {
    takeaway: T(
      "0.96 寸 OLED 用 SSD1306 驱动，128×64 点阵；4 针模块走 I²C（地址 0x78），7 针模块可选 SPI 或 I²C，供电 3–5.5 V。",
      "The 0.96″ OLED uses an SSD1306 at 128×64. The 4-pin module is I²C (address 0x78); the 7-pin module does SPI or I²C. Supply 3–5.5 V."
    ),
    specs: [
      [T("驱动 IC", "Driver"), "SSD1306"],
      [T("分辨率", "Resolution"), T("128 × 64，8 页 × 128 字节", "128 × 64, 8 pages × 128 bytes")],
      [T("接口", "Interface"), T("6800/8080 并口、3 线/4 线 SPI、I²C（BS0–BS2 选择）", "6800/8080 parallel, 3/4-wire SPI, I²C (selected by BS0–BS2)")],
      [T("I²C 地址", "I²C address"), T("0x78；D/C# 接 VCC 时为 0x7A", "0x78; 0x7A when D/C# is tied to VCC")],
      [T("供电", "Supply"), T("3–5.5 V，模块内 662K 稳压到 3.3 V", "3–5.5 V, on-board 662K regulator to 3.3 V")],
      [T("显示", "Colour"), T("黄蓝 / 白 / 蓝三种，黄蓝为固定分区", "Yellow-blue / white / blue; the yellow-blue part is fixed")],
    ],
    pins: [
      [T("4 针 I²C", "4-pin I²C"), T("GND / VCC / SCL / SDA", "GND / VCC / SCL / SDA")],
      [T("7 针模块", "7-pin module"), T("GND / VCC / D0 / D1 / RES / DC / CS", "GND / VCC / D0 / D1 / RES / DC / CS")],
      [T("D0 · D1", "D0 · D1"), T("SPI 时为 SCK/SDA，I²C 时为 SCL/SDA", "SPI: SCK/SDA; I²C: SCL/SDA")],
      [T("RES", "RES"), T("低电平复位；I²C 模式需接高（可接 VCC）", "Active-low reset; tie high (VCC) in I²C mode")],
    ],
    steps: [
      T("上电后先发 0xAE 关显示，再按手册的初始化序列配置时钟、复用率、寻址模式与电荷泵（0x8D, 0x14）。", "Send 0xAE first, then walk the datasheet init sequence for clock, multiplex, addressing and charge pump (0x8D, 0x14)."),
      T("用 0x20 选页寻址或水平寻址，再写 GDDRAM 数据。", "Pick page or horizontal addressing via 0x20, then write GDDRAM."),
      T("对比度用 0x81 调；整屏反色用 0xA6/0xA7。", "Contrast is 0x81; whole-panel inversion is 0xA6/0xA7."),
      T("7 针模块改 I²C 需要把 R3 挪到 R1、RES 接高（详见使用手册 3.1）。", "Converting the 7-pin module to I²C means moving R3 to R1 and tying RES high (manual 3.1)."),
      T("字符反白也可以在写字节时交换 SDIN 的置位/清零，见《关于反白显示说明》。", "Character inversion can also swap the SDIN set/clear in the byte writer, per the inversion note."),
    ],
    cautions: [
      T("1.3 寸屏用 SSD1106（每页 132 字节），移植 0.96 寸代码要把列地址偏移 2。", "1.3″ panels use SSD1106 (132-byte pages); offset the column address by 2 when porting."),
      T("I²C 上拉电阻已焊在模块上，不要再并一组。", "Pull-ups are already fitted on the module; do not add another set."),
      T("RES 悬空会随机点不亮，4 针模块已内部处理，7 针要自己确保高电平。", "A floating RES makes it intermittently blank; the 4-pin module handles it, the 7-pin one does not."),
    ],
    sources: [
      { file: "中景园电子0.96寸OLED使用文档新手必看V2.0.pdf", hint: T("模块接口定义、7 针改 I²C 的电阻改法、SSD1306/SSD1106 差异", "Module pinout, 7-pin I²C rework, SSD1306 vs SSD1106") },
      { file: "0.96寸OLED规格书.pdf", hint: T("电气参数、上电时序、命令表", "Electrical ratings, power-up sequence, command table") },
      { file: "中景园电子0.96OLED显示屏IIC接口原理图.pdf.pdf", hint: T("I²C 地址 0x78/0x7A、复位电路与 662K 稳压", "I²C addresses, reset circuit and 662K regulator") },
      { file: "关于反白显示说明.pdf", hint: T("逐点反白（交换 SDIN 电平）的做法", "Per-pixel inversion by swapping SDIN levels") },
    ],
  },

  /* ---------------------------------------------------------- 9 TB6612 */
  tb6612: {
    takeaway: T(
      "TB6612FNG 双路 H 桥：VM 供电机、VCC 供逻辑，AIN/BIN 定方向、PWMA/PWMB 调速，STBY 必须拉高才工作。",
      "TB6612FNG dual H-bridge: VM powers the motors, VCC the logic; AIN/BIN set direction, PWMA/PWMB set speed, and STBY must be high."
    ),
    specs: [
      [T("电机电源 VM", "Motor supply VM"), T("4.5–10 V（模块标注），芯片上限 15 V", "4.5–10 V on the module; 15 V chip maximum")],
      [T("逻辑电源 VCC", "Logic supply VCC"), "2.7–5.5 V"],
      [T("输出电流", "Output current"), T("1.2 A 连续 / 3.2 A 峰值（单通道）", "1.2 A continuous / 3.2 A peak per channel")],
      [T("导通电阻", "RON"), T("0.5 Ω（上下桥合计，典型值）", "0.5 Ω combined, typical")],
      [T("保护", "Protection"), T("过热关断 + 低压检测", "Thermal shutdown + low-voltage detect")],
      [T("封装", "Package"), "SSOP24"],
    ],
    pins: [
      [T("PWMA · PWMB", "PWMA · PWMB"), T("两路 PWM 输入，占空比即转速", "Per-channel PWM, duty = speed")],
      [T("AIN1 · AIN2 / BIN1 · BIN2", "AIN1 · AIN2 / BIN1 · BIN2"), T("方向输入，同高制动、同低停止", "Direction inputs; both high = brake, both low = stop")],
      [T("STBY", "STBY"), T("高电平工作、低电平待机（内部 200 kΩ 下拉）", "High = run, low = standby (200 kΩ pull-down)")],
      [T("AO1 · AO2 / BO1 · BO2", "AO1 · AO2 / BO1 · BO2"), T("接直流电机两端", "To the motor terminals")],
      [T("VM · VCC · GND", "VM · VCC · GND"), T("电机电源、逻辑电源、地（两路地都要接）", "Motor supply, logic supply, ground (both GND pins)")],
    ],
    steps: [
      T("VM 接电机电源、VCC 接 3.3/5 V，两个 GND 都接到电源地。", "Wire VM to the motor supply, VCC to 3.3/5 V, and both GND pins to ground."),
      T("STBY 先给高电平，否则芯片一直是待机。", "Drive STBY high, otherwise the chip stays in standby."),
      T("AIN1=H、AIN2=L 正转；L/H 反转；HH 制动；LL 停止。", "AIN1=H/AIN2=L forward, L/H reverse, HH brake, LL stop."),
      T("PWMA 给 0–100% 占空比调速，起步先用低占空比。", "Ramp PWMA duty from low rather than starting at 100 %."),
    ],
    cautions: [
      T("VM 超过 10 V 或接反会直接损坏模块。", "VM above 10 V or reversed will destroy the module."),
      T("电机启动电流远大于额定，电源要留余量并加大电容。", "Inrush far exceeds the rating; size the supply and bulk caps accordingly."),
      T("PWM 频率太低会听到啸叫、太高则开关损耗上升，需折中。", "Too low a PWM frequency whines; too high raises switching loss."),
    ],
    sources: [
      { file: "TB6612FNG.pdf", hint: T("额定值、引脚功能、真值表与电气特性", "Ratings, pin functions, truth table, electrical characteristics") },
      { file: "电机驱动模块使用说明.png", hint: T("模块排针定义、接线示例与模式真值表", "Header pinout, wiring example and mode table") },
    ],
  },

  /* ---------------------------------------------------------- 10 SG90 */
  sg90: {
    takeaway: T(
      "SG90 是 180° 位置舵机：给 20 ms 周期、0.5–2.5 ms 高电平的 PWM，脉宽线性对应 0–180°，三线为棕/红/黄。",
      "The SG90 is a 180° positional servo: a 20 ms PWM period with a 0.5–2.5 ms high time maps linearly to 0–180°. Leads are brown/red/yellow."
    ),
    specs: [
      [T("重量", "Weight"), "9 g"],
      [T("扭矩", "Torque"), T("1.6 kg·cm（堵转）", "1.6 kg·cm (stall)")],
      [T("速度", "Speed"), T("0.12–0.13 s / 60°", "0.12–0.13 s per 60°")],
      [T("角度", "Travel"), T("180°（左右各 90°）", "180° (±90°)")],
      [T("死区", "Dead band"), "5 µs"],
      [T("电压", "Supply"), T("3–7.2 V，常用 5 V", "3–7.2 V, 5 V typical")],
      [T("齿轮", "Gears"), T("塑料齿", "Plastic")],
      [T("线序", "Wiring"), T("棕 GND / 红 +5 V / 黄（橙）PWM", "Brown GND / red +5 V / yellow (orange) PWM")],
    ],
    pins: [
      [T("棕线", "Brown"), T("GND，必须与 MCU 共地", "GND, common with the MCU")],
      [T("红线", "Red"), T("+5 V，独立供电更稳", "＋5 V, preferably its own supply")],
      [T("黄/橙线", "Yellow/orange"), T("PWM 信号，3.3 V 电平可识别", "PWM input, 3.3 V logic works")],
    ],
    steps: [
      T("定时器配 50 Hz（20 ms 周期），预分频让计数精度到 1 µs 级。", "Configure a 50 Hz timer (20 ms) with 1 µs-class resolution."),
      T("脉宽 0.5 ms → 0°，1.5 ms → 90°，2.5 ms → 180°，按线性换算 CCR。", "0.5 ms → 0°, 1.5 ms → 90°, 2.5 ms → 180°; compute CCR linearly."),
      T("上电先回中位（1.5 ms），再按需要渐变，避免瞬间大角度。", "Boot to centre (1.5 ms), then slew to the target."),
      T("多个舵机共用一个 5 V 电源时，注意总电流与共地。", "With several servos on one 5 V rail, watch total current and common ground."),
    ],
    cautions: [
      T("别用 MCU 的 3.3 V 或下载器给舵机供电，启动电流会把电压拉塌。", "Never power a servo from the MCU 3.3 V rail or a programmer; inrush browns it out."),
      T("脉宽超出 0.5–2.5 ms 会顶到机械限位，长期会扫齿。", "Pulse widths outside 0.5–2.5 ms drive it into the end stops and strip gears."),
      T("改角度太快舵机跟不上，会抖动或发出嗡嗡声。", "Stepping the angle too fast makes it buzz and jitter."),
    ],
    sources: [
      { file: "舵机使用说明.png", hint: T("SG90 参数表、线序与 0.5–2.5 ms 角度对应", "SG90 spec table, wiring and pulse-to-angle mapping") },
      { file: "舵机的相关原理与控制原理.doc", hint: T("20 ms 时基、0.5–2.5 ms 脉宽与角度关系", "20 ms base period and pulse-width/angle relation") },
      { file: "利用单片机PWM信号进行舵机控制.doc", hint: T("用定时器中断产生 PWM 的实现思路", "Generating servo PWM from timer interrupts") },
    ],
  },

  /* ---------------------------------------------------------- 11 编码器 */
  encoder: {
    takeaway: T(
      "EC11 增量编码器：A/B 两相正交输出，顺时针 A 超前 B 90°，每转 15 或 20 个脉冲，另带按压开关。",
      "EC11 incremental encoder: quadrature A/B outputs, A leads B by 90° clockwise, 15 or 20 pulses per turn, plus a push switch."
    ),
    specs: [
      [T("型号", "Model"), "EC11"],
      [T("额定电压", "Rated voltage"), "DC 5 V"],
      [T("A/B 相电流", "A/B current"), T("0.5 mA（最大 5 mA）", "0.5 mA (5 mA max)")],
      [T("公共端电流", "Common current"), T("1 mA（最大 10 mA）", "1 mA (10 mA max)")],
      [T("分辨率", "Resolution"), T("15 或 20 脉冲 / 360°（型号而定）", "15 or 20 pulses per 360° depending on the part")],
      [T("温度", "Temperature"), T("-30 ~ +80 °C", "-30 to +80 °C")],
      [T("尺寸", "Size"), T("模块 24 × 27 mm", "Module 24 × 27 mm")],
    ],
    pins: [
      [T("VCC · GND", "VCC · GND"), T("2 针供电，3.3 / 5 V", "2-pin supply, 3.3 / 5 V")],
      [T("A · B", "A · B"), T("两相正交输出，接两个 GPIO 或外部中断", "Quadrature outputs, to two GPIOs or EXTI")],
      [T("C", "C"), T("公共端（手册标注 C(GND)），与 GND 同电位", "Common, marked C(GND)")],
      [T("SW", "SW"), T("轴按压开关，按下导通", "Shaft push switch, closes when pressed")],
    ],
    steps: [
      T("VCC/GND 接好，A/B 接两个带中断的 GPIO。", "Power it and wire A/B to two interrupt-capable GPIOs."),
      T("在 A 的下降沿读 B：B 为低是顺时针，为高是逆时针（以实物为准）。", "On an A falling edge read B: low = CW, high = CCW (verify on the bench)."),
      T("每次有效跳变计数，除以每转脉冲数得到圈数。", "Count valid edges and divide by pulses-per-turn for revolutions."),
      T("按键单独接一路输入，注意上拉与消抖。", "Wire the switch to its own input with a pull-up and debounce."),
    ],
    cautions: [
      T("机械触点会抖动，必须软件消抖或加 RC。", "Mechanical contacts bounce; debounce in software or with an RC."),
      T("轮询读 A/B 在快速旋转时会丢步，慢速旋钮才适合轮询。", "Polling loses steps when spun fast; it only suits slow knobs."),
      T("A/B 接反只会让方向相反，不会损坏，但要在代码里统一。", "Swapping A/B only inverts direction; keep the convention consistent."),
    ],
    sources: [
      { file: "旋转编码器模块使用说明.png", hint: T("EC11 参数、A/B 相位关系、5 针接口与尺寸", "EC11 specs, A/B phase relation, 5-pin interface, dimensions") },
    ],
  },

  /* ---------------------------------------------------------- 12 CH340 */
  ch340: {
    takeaway: T(
      "CH340G USB 转 TTL：6 针排针，跳线选 3V3/5V 电平；TXD 接 MCU 的 RX、RXD 接 TX，必须共地。",
      "CH340G USB-to-TTL: 6-pin header with a 3V3/5V level jumper; TXD to MCU RX, RXD to MCU TX, common ground."
    ),
    specs: [
      [T("芯片", "Chip"), "CH340G"],
      [T("晶振", "Crystal"), "12 MHz"],
      [T("供电", "Supply"), T("USB 5 V，模块可选 3.3 V/5 V TTL 电平", "5 V from USB; 3.3 V or 5 V TTL level selectable")],
      [T("指示", "LEDs"), T("PWR / TXD / RXD 三只", "PWR / TXD / RXD")],
      [T("跳线", "Jumper"), T("1-2 短接 = 5 V TTL，2-3 短接 = 3V3 TTL", "1-2 = 5 V TTL, 2-3 = 3V3 TTL")],
      [T("尺寸", "Size"), T("PCB 33 × 16 mm", "PCB 33 × 16 mm")],
      [T("驱动", "Driver"), T("CH341SER（WCH 官网）", "CH341SER from WCH")],
    ],
    pins: [
      [T("TXD", "TXD"), T("串口发送，接 MCU 的 RX", "TX, goes to MCU RX")],
      [T("RXD", "RXD"), T("串口接收，接 MCU 的 TX", "RX, goes to MCU TX")],
      [T("VCC · 3V3", "VCC · 3V3"), T("目标板供电参考，一般不用于给整板供电", "Reference rails; not meant to power a whole board")],
      [T("GND", "GND"), T("必须与目标板共地", "Common ground with the target")],
    ],
    steps: [
      T("先装 CH341SER 驱动，再插 USB，设备管理器里应出现 USB-SERIAL CH340 (COMx)。", "Install CH341SER first; Device Manager should show USB-SERIAL CH340 (COMx)."),
      T("按目标系统电压选跳线：3.3 V 系统接 2-3，5 V 系统接 1-2。", "Set the jumper to the target level: 2-3 for 3.3 V, 1-2 for 5 V."),
      T("TXD↔RX、RXD↔TX 交叉连接，再接 GND。", "Cross TXD/RXD and add GND."),
      T("不确定模块好坏时，把 TXD 与 RXD 短接，串口工具发什么应回什么。", "To self-test, short TXD to RXD and check the echo."),
    ],
    cautions: [
      T("TXD/RXD 是同名直连的常见错误，通不了先交换这两根。", "Wiring TXD-to-TXD is the classic mistake — swap the pair when nothing works."),
      T("电平跳线选错会往 3.3 V 系统灌 5 V。", "A wrong jumper pushes 5 V into a 3.3 V system."),
      T("模块没有 DTR/RTS，给 STM32 下载要手动进 BOOT0 并复位。", "No DTR/RTS here: enter BOOT0 and reset by hand to flash an STM32."),
    ],
    sources: [
      { file: "CH340G模块说明 V4.0.doc", hint: T("跳线含义、3V3/5V 选择、自测方法", "Jumper meaning, level choice, self-test") },
      { file: "CH340G模块原理图.pdf", hint: T("12 MHz 晶振、电平选择与 LED 电路", "12 MHz crystal, level selection, LED circuit") },
      { file: "驱动介绍.txt", hint: T("驱动安装说明", "Driver installation note") },
    ],
  },

  /* ---------------------------------------------------------- 13 MPU6050 */
  mpu6050: {
    takeaway: T(
      "MPU6050 六轴：I²C 地址 0x68（AD0=1 为 0x69），上电默认 SLEEP，先写 PWR_MGMT_1 唤醒，再从 0x3B 连读 14 字节。",
      "MPU6050 six-axis: I²C address 0x68 (0x69 with AD0=1). It boots in SLEEP, so clear PWR_MGMT_1 first, then burst-read 14 bytes from 0x3B."
    ),
    specs: [
      [T("传感器", "Sensors"), T("三轴陀螺 + 三轴加速度 + 温度", "3-axis gyro + 3-axis accelerometer + temperature")],
      [T("陀螺量程", "Gyro range"), T("±250 / 500 / 1000 / 2000 °/s（FS_SEL）", "±250 / 500 / 1000 / 2000 °/s (FS_SEL)")],
      [T("加速度量程", "Accel range"), T("±2 / 4 / 8 / 16 g（AFS_SEL）", "±2 / 4 / 8 / 16 g (AFS_SEL)")],
      [T("接口", "Interface"), T("I²C 最高 400 kHz（模块带 4.7 kΩ 上拉）", "I²C up to 400 kHz (4.7 kΩ pull-ups on the module)")],
      [T("供电", "Supply"), T("VDD 2.375–3.46 V；模块带 5 V→3.3 V LDO", "VDD 2.375–3.46 V; module has a 5 V→3.3 V LDO")],
      [T("FIFO", "FIFO"), T("1024 字节", "1024 bytes")],
      [T("地址", "Address"), T("AD0=0 → 0x68，AD0=1 → 0x69", "AD0=0 → 0x68, AD0=1 → 0x69")],
    ],
    pins: [
      [T("VCC · GND", "VCC · GND"), T("模块 5 V 输入（经 LDO）与地", "5 V in through the LDO, plus ground")],
      [T("SCL · SDA", "SCL · SDA"), T("I²C 总线，接 MCU 的 I²C 或软件模拟", "I²C bus, hardware or bit-banged")],
      [T("AD0", "AD0"), T("地址选择脚，接地 = 0x68", "Address select; low = 0x68")],
      [T("INT", "INT"), T("中断输出，可配数据就绪/运动检测", "Interrupt output for data-ready/motion")],
      [T("XDA · XCL", "XDA · XCL"), T("辅助 I²C，可挂磁力计等从机", "Auxiliary I²C for a magnetometer, etc.")],
    ],
    steps: [
      T("读 WHO_AM_I(0x75) 确认通信，正常返回 0x68 附近的值。", "Read WHO_AM_I (0x75) to confirm the bus."),
      T("写 PWR_MGMT_1(0x6B)=0x00 唤醒并选内部时钟。", "Write PWR_MGMT_1 (0x6B)=0x00 to wake it and select the internal clock."),
      T("用 SMPLRT_DIV(0x19)、CONFIG(0x1A) 设采样率与 DLPF，用 0x1B/0x1C 设量程。", "Set SMPLRT_DIV (0x19), CONFIG (0x1A), and the ranges in 0x1B/0x1C."),
      T("从 0x3B 起连读 14 字节：AX/AY/AZ、TEMP、GX/GY/GZ，各 16 位大端。", "Burst-read 14 bytes from 0x3B: AX/AY/AZ, TEMP, GX/GY/GZ, big-endian 16-bit."),
      T("按量程换算：加速度 = raw / 32768 × 量程，陀螺 = raw / 32768 × 量程。", "Scale by range: value = raw / 32768 × full-scale."),
    ],
    cautions: [
      T("不唤醒就读数据，全是 0 或不变的值。", "Without clearing SLEEP the data reads as zeros."),
      T("量程改小精度高但容易饱和，振动场景先给大量程。", "Narrow ranges are finer but saturate; start wide on vibrating rigs."),
      T("模块 LDO 只适合小电流，别拿 5 V 脚当电源输出。", "The on-board LDO is small; do not use the 5 V pin as a supply."),
    ],
    sources: [
      { file: "RM-MPU-6000A.pdf", hint: T("寄存器映射：0x19/0x1A/0x1B/0x1C/0x6B/0x75", "Register map: 0x19/0x1A/0x1B/0x1C/0x6B/0x75") },
      { file: "PS-MPU-6000A.pdf", hint: T("量程、I²C 地址、电气参数", "Ranges, I²C address, electrical specs") },
      { file: "MPU6050-V1-SCH.jpg", hint: T("模块 8 针分组、5 V→3.3 V LDO 与上拉", "8-pin grouping, 5 V→3.3 V LDO and pull-ups") },
    ],
  },

  /* ---------------------------------------------------------- 14 W25QXX */
  w25qxx: {
    takeaway: T(
      "W25Q 系列 SPI NOR：最小擦除单位 4 KB 扇区、写入单位 256 B 页；写前先写使能，写完等 BUSY 清零。",
      "W25Q SPI NOR: erase in 4 KB sectors, program in 256-byte pages. Enable writes first and poll BUSY after each operation."
    ),
    specs: [
      [T("容量", "Density"), T("W25Q16/32/40/64/80/128/256（2–32 MB）", "W25Q16/32/40/64/80/128/256 (2–32 MB)")],
      [T("供电", "Supply"), T("2.7–3.6 V", "2.7–3.6 V")],
      [T("接口", "Interface"), T("SPI 模式 0/3，标准读 0x03、快速读 0x0B", "SPI mode 0/3; read 0x03, fast read 0x0B")],
      [T("组织", "Organisation"), T("页 256 B、扇区 4 KB、块 64 KB", "256 B page, 4 KB sector, 64 KB block")],
      [T("擦写寿命", "Endurance"), T("10 万次擦写（典型值）", "100 k erase/program cycles, typical")],
      [T("数据保持", "Retention"), T("20 年（典型值）", "20 years, typical")],
    ],
    pins: [
      [T("/CS", "/CS"), T("片选，低有效；每条命令前后都要拉高", "Chip select, active low; raise it between commands")],
      [T("CLK", "CLK"), T("SPI 时钟", "SPI clock")],
      [T("DI (IO0)", "DI (IO0)"), T("主机输出", "MOSI")],
      [T("DO (IO1)", "DO (IO1)"), T("从机输出", "MISO")],
      [T("/WP (IO2)", "/WP (IO2)"), T("写保护，不用时上拉", "Write protect; pull high if unused")],
      [T("/HOLD (IO3)", "/HOLD (IO3)"), T("保持，不用时上拉", "Hold; pull high if unused")],
      [T("VCC · GND", "VCC · GND"), T("3.3 V 供电与地", "3.3 V and ground")],
    ],
    steps: [
      T("先读 JEDEC ID（0x9F）确认容量与型号，再谈地址。", "Read JEDEC ID (0x9F) to confirm density before using addresses."),
      T("任何写/擦之前发写使能 0x06，并读状态寄存器 0x05 看 WEL 是否置位。", "Issue WREN (0x06) before writes/erases and check WEL in status (0x05)."),
      T("擦除：扇区 0x20 / 32 KB 块 0x52 / 64 KB 块 0xD8 / 全片 0xC7。", "Erase: sector 0x20, 32 KB block 0x52, 64 KB block 0xD8, chip 0xC7."),
      T("页编程 0x02 一次最多 256 字节且不能跨页，跨页会回卷覆盖页首。", "Page program (0x02) writes ≤ 256 bytes within one page; crossing wraps to the page start."),
      T("每次操作后轮询 BUSY（状态寄存器 bit0），清零后再发下一条。", "Poll BUSY (status bit 0) after each operation before the next command."),
    ],
    cautions: [
      T("NOR 只能把 1 写成 0，改写前必须先擦除。", "NOR can only clear bits; erase before rewriting."),
      T("擦除期间除读状态寄存器外不接受其它命令。", "During erase only the status register is readable."),
      T("/WP 与 /HOLD 悬空会导致随机写保护或总线挂死。", "Floating /WP or /HOLD causes random write protection or a stuck bus."),
    ],
    sources: [
      { file: "W25Q64BV.PDF", hint: T("命令集、页/扇区/块结构、状态寄存器", "Command set, page/sector/block layout, status register") },
      { file: "参考资料/", hint: T("W25Q16/32/40/64/80/128/256 各容量手册，地址范围不同", "Datasheets per density; address ranges differ") },
      { file: "原理图/W25Qxx.pdf", hint: T("模块转接板的 SPI 引脚与去耦", "Breakout SPI wiring and decoupling") },
    ],
  }
};

export function materialNote(id) {
  return MATERIAL_NOTES[id] || null;
}
