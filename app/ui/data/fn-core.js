import { fn } from "./util.js";

/* GPIO · RCC · NVIC · EXTI */
export const CORE = [

  /* ---------------- GPIO · Standard Peripheral Library ---------------- */
  fn({
    id: "std.gpio.init", lib: "std", p: "gpio", n: "GPIO_Init",
    sig: "void GPIO_Init(GPIO_TypeDef* GPIOx, GPIO_InitTypeDef* GPIO_InitStruct);",
    zh: "按结构体统一配置一个或多个引脚的模式、速度与上下拉。所有 GPIO 操作前必须先调用。",
    en: "Configure one or more pins (mode, speed, pull) from a struct. Always call this before using a pin.",
    params: [
      ["GPIOx", "端口基址，如 GPIOA / GPIOB", "Port base, e.g. GPIOA / GPIOB"],
      ["GPIO_InitStruct", "成员：GPIO_Pin、GPIO_Mode、GPIO_Speed", "Members: GPIO_Pin, GPIO_Mode, GPIO_Speed"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_gpio.h",
    eq: "hal.gpio.init",
    rel: ["std.rcc.apb2clockcmd", "std.gpio.setbits", "std.gpio.readinputbit"],
    tags: ["初始化", "引脚", "init", "pin", "输出", "输入", "上拉", "下拉"]
  }),
  fn({
    id: "std.gpio.setbits", lib: "std", p: "gpio", n: "GPIO_SetBits",
    sig: "void GPIO_SetBits(GPIO_TypeDef* GPIOx, uint16_t GPIO_Pin);",
    zh: "将指定引脚置高电平。可用按位或一次置位多个引脚。",
    en: "Drive the selected pin(s) high; combine pins with bitwise OR.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "引脚掩码，如 GPIO_Pin_5 | GPIO_Pin_6", "Pin mask, e.g. GPIO_Pin_5 | GPIO_Pin_6"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_gpio.h",
    eq: "hal.gpio.writepin",
    rel: ["std.gpio.resetbits", "std.gpio.writebit"],
    tags: ["输出", "置高", "set", "high", "led"]
  }),
  fn({
    id: "std.gpio.resetbits", lib: "std", p: "gpio", n: "GPIO_ResetBits",
    sig: "void GPIO_ResetBits(GPIO_TypeDef* GPIOx, uint16_t GPIO_Pin);",
    zh: "将指定引脚拉低。与 GPIO_SetBits 成对使用，避免读改写整端口。",
    en: "Drive the selected pin(s) low; pair with GPIO_SetBits instead of rewriting the whole port.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "引脚掩码", "Pin mask"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_gpio.h",
    eq: "hal.gpio.writepin",
    rel: ["std.gpio.setbits", "std.gpio.writebit"],
    tags: ["输出", "拉低", "reset", "low", "led"]
  }),
  fn({
    id: "std.gpio.writebit", lib: "std", p: "gpio", n: "GPIO_WriteBit",
    sig: "void GPIO_WriteBit(GPIO_TypeDef* GPIOx, uint16_t GPIO_Pin, BitAction BitVal);",
    zh: "按 Bit_SET / Bit_RESET 写单个引脚，适合需要变量控制电平的场合。",
    en: "Write one pin using Bit_SET / Bit_RESET, convenient when the level is stored in a variable.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "单个引脚掩码", "Single pin mask"],
      ["BitVal", "Bit_SET 或 Bit_RESET", "Bit_SET or Bit_RESET"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_gpio.h",
    eq: "hal.gpio.writepin",
    rel: ["std.gpio.setbits", "std.gpio.resetbits"],
    tags: ["输出", "写引脚", "write", "bit"]
  }),
  fn({
    id: "std.gpio.readinputbit", lib: "std", p: "gpio", n: "GPIO_ReadInputDataBit",
    sig: "uint8_t GPIO_ReadInputDataBit(GPIO_TypeDef* GPIOx, uint16_t GPIO_Pin);",
    zh: "读取引脚的实际输入电平，返回 0 或 1。输入模式下判断按键状态用它。",
    en: "Read the actual input level of a pin, returning 0 or 1. Use it for buttons in input mode.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "单个引脚掩码", "Single pin mask"]
    ],
    ret: ["0 或 1", "0 or 1"],
    hdr: "stm32f10x_gpio.h",
    eq: "hal.gpio.readpin",
    rel: ["std.gpio.readoutputbit", "std.gpio.init"],
    tags: ["输入", "读取", "read", "按键", "button"]
  }),
  fn({
    id: "std.gpio.readoutputbit", lib: "std", p: "gpio", n: "GPIO_ReadOutputDataBit",
    sig: "uint8_t GPIO_ReadOutputDataBit(GPIO_TypeDef* GPIOx, uint16_t GPIO_Pin);",
    zh: "读取输出寄存器中锁存的值，而不是引脚真实电平。用于软件跟踪输出状态。",
    en: "Read the latched output register value rather than the real pin level; useful to track output state.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "单个引脚掩码", "Single pin mask"]
    ],
    ret: ["0 或 1", "0 or 1"],
    hdr: "stm32f10x_gpio.h",
    eq: "hal.gpio.readpin",
    rel: ["std.gpio.readinputbit", "std.gpio.setbits"],
    tags: ["输出", "读取", "read", "odr"]
  }),
  fn({
    id: "std.gpio.deinit", lib: "std", p: "gpio", n: "GPIO_DeInit",
    sig: "void GPIO_DeInit(GPIO_TypeDef* GPIOx);",
    zh: "把整个 GPIO 端口恢复为复位默认状态，常用于复用前清理或低功耗切换。",
    en: "Reset an entire GPIO port to its power-on default; useful before remapping or for low power.",
    params: [["GPIOx", "端口基址", "Port base"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_gpio.h",
    eq: "hal.gpio.deinit",
    rel: ["std.gpio.init", "std.rcc.apb2clockcmd"],
    tags: ["复位", "deinit", "低功耗"]
  }),

  /* ---------------- GPIO · HAL ---------------- */
  fn({
    id: "hal.gpio.init", lib: "hal", p: "gpio", n: "HAL_GPIO_Init",
    sig: "void HAL_GPIO_Init(GPIO_TypeDef *GPIOx, GPIO_InitTypeDef *GPIO_Init);",
    zh: "按 Pin / Mode / Pull / Speed / Alternate 配置引脚，是 HAL 中所有引脚操作的入口。",
    en: "Configure pins from Pin / Mode / Pull / Speed / Alternate — the entry point for every HAL pin setup.",
    params: [
      ["GPIOx", "端口基址，如 GPIOA", "Port base, e.g. GPIOA"],
      ["GPIO_Init", "成员：Pin、Mode、Pull、Speed、Alternate", "Members: Pin, Mode, Pull, Speed, Alternate"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_gpio.h",
    eq: "std.gpio.init",
    rel: ["hal.rcc.clkenable", "hal.gpio.writepin", "hal.nvic.setpriority"],
    tags: ["初始化", "引脚", "init", "pin", "复用", "alternate"]
  }),
  fn({
    id: "hal.gpio.writepin", lib: "hal", p: "gpio", n: "HAL_GPIO_WritePin",
    sig: "void HAL_GPIO_WritePin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin, GPIO_PinState PinState);",
    zh: "将引脚写为 GPIO_PIN_SET 或 GPIO_PIN_RESET，可同时作用于多个引脚。",
    en: "Write GPIO_PIN_SET or GPIO_PIN_RESET; multiple pins may be OR-ed in the mask.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "引脚掩码", "Pin mask"],
      ["PinState", "GPIO_PIN_SET / GPIO_PIN_RESET", "GPIO_PIN_SET / GPIO_PIN_RESET"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_gpio.h",
    eq: "std.gpio.setbits",
    rel: ["hal.gpio.togglepin", "hal.gpio.readpin"],
    tags: ["输出", "写引脚", "write", "led"]
  }),
  fn({
    id: "hal.gpio.readpin", lib: "hal", p: "gpio", n: "HAL_GPIO_ReadPin",
    sig: "GPIO_PinState HAL_GPIO_ReadPin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin);",
    zh: "读取引脚电平，返回 GPIO_PIN_SET 或 GPIO_PIN_RESET。",
    en: "Read a pin and return GPIO_PIN_SET or GPIO_PIN_RESET.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "单个引脚掩码", "Single pin mask"]
    ],
    ret: ["GPIO_PinState 枚举", "GPIO_PinState enum"],
    hdr: "stm32f1xx_hal_gpio.h",
    eq: "std.gpio.readinputbit",
    rel: ["hal.gpio.writepin", "hal.exti.callback"],
    tags: ["输入", "读取", "read", "按键", "button"]
  }),
  fn({
    id: "hal.gpio.togglepin", lib: "hal", p: "gpio", n: "HAL_GPIO_TogglePin",
    sig: "void HAL_GPIO_TogglePin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin);",
    zh: "翻转引脚电平，闪烁 LED 或产生软件方波时最省事。",
    en: "Toggle the pin level — the simplest way to blink an LED or generate a software square wave.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "引脚掩码", "Pin mask"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_gpio.h",
    eq: "std.gpio.writebit",
    rel: ["hal.gpio.writepin", "hal.tim.periodelapsedcallback"],
    tags: ["翻转", "toggle", "闪烁", "blink"]
  }),
  fn({
    id: "hal.gpio.deinit", lib: "hal", p: "gpio", n: "HAL_GPIO_DeInit",
    sig: "void HAL_GPIO_DeInit(GPIO_TypeDef *GPIOx, uint32_t GPIO_Pin);",
    zh: "把指定引脚恢复为复位状态，释放复用功能或进入低功耗前调用。",
    en: "Restore the selected pins to reset state; call before low-power entry or when releasing alternate functions.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "引脚掩码", "Pin mask"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_gpio.h",
    eq: "std.gpio.deinit",
    rel: ["hal.gpio.init", "hal.rcc.clkenable"],
    tags: ["复位", "deinit", "低功耗"]
  }),
  fn({
    id: "hal.gpio.lockpin", lib: "hal", p: "gpio", n: "HAL_GPIO_LockPin",
    sig: "HAL_StatusTypeDef HAL_GPIO_LockPin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin);",
    zh: "锁定引脚配置直到下次复位，防止跑飞的程序意外改写关键引脚。",
    en: "Lock the pin configuration until reset so runaway code cannot change safety-critical pins.",
    params: [
      ["GPIOx", "端口基址", "Port base"],
      ["GPIO_Pin", "引脚掩码", "Pin mask"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_gpio.h",
    rel: ["hal.gpio.init"],
    tags: ["锁定", "lock", "安全"]
  }),

  /* ---------------- RCC · SPL ---------------- */
  fn({
    id: "std.rcc.apb2clockcmd", lib: "std", p: "rcc", n: "RCC_APB2PeriphClockCmd",
    sig: "void RCC_APB2PeriphClockCmd(uint32_t RCC_APB2Periph, FunctionalState NewState);",
    zh: "使能 APB2 外设时钟，GPIOA~G、USART1、SPI1、ADC1 都在总线上。忘记调用会让寄存器写入无效。",
    en: "Enable APB2 peripheral clocks (GPIOA-G, USART1, SPI1, ADC1). Without it register writes are ignored.",
    params: [
      ["RCC_APB2Periph", "外设宏，可用按位或组合", "Peripheral macro; combinable with bitwise OR"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_rcc.h",
    eq: "hal.rcc.clkenable",
    rel: ["std.gpio.init", "std.rcc.apb1clockcmd"],
    tags: ["时钟", "使能", "clock", "enable", "gpio"]
  }),
  fn({
    id: "std.rcc.apb1clockcmd", lib: "std", p: "rcc", n: "RCC_APB1PeriphClockCmd",
    sig: "void RCC_APB1PeriphClockCmd(uint32_t RCC_APB1Periph, FunctionalState NewState);",
    zh: "使能 APB1 外设时钟，涵盖 USART2/3、TIM2~7、I2C、SPI2、DAC 等。",
    en: "Enable APB1 peripheral clocks: USART2/3, TIM2-7, I2C, SPI2, DAC and more.",
    params: [
      ["RCC_APB1Periph", "外设宏，可组合", "Peripheral macro, combinable"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_rcc.h",
    eq: "hal.rcc.clkenable",
    rel: ["std.rcc.apb2clockcmd", "std.tim.timebaseinit"],
    tags: ["时钟", "使能", "clock", "enable", "tim", "i2c"]
  }),
  fn({
    id: "std.rcc.ahbclockcmd", lib: "std", p: "rcc", n: "RCC_AHBPeriphClockCmd",
    sig: "void RCC_AHBPeriphClockCmd(uint32_t RCC_AHBPeriph, FunctionalState NewState);",
    zh: "使能 AHB 总线外设时钟（F1 的 DMA、SRAM、CRC；F4 对应 RCC_AHB1PeriphClockCmd）。",
    en: "Enable AHB peripheral clocks (DMA/SRAM/CRC on F1; on F4 this is RCC_AHB1PeriphClockCmd).",
    params: [
      ["RCC_AHBPeriph", "外设宏，如 RCC_AHBPeriph_DMA1", "Peripheral macro, e.g. RCC_AHBPeriph_DMA1"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_rcc.h",
    eq: "hal.rcc.clkenable",
    rel: ["std.dma.init", "std.rcc.apb2clockcmd"],
    tags: ["时钟", "ahb", "dma", "clock", "enable"]
  }),
  fn({
    id: "std.rcc.pllconfig", lib: "std", p: "rcc", n: "RCC_PLLConfig",
    sig: "void RCC_PLLConfig(uint32_t RCC_PLLSource, uint32_t RCC_PLLMul);",
    zh: "设置 PLL 输入源与倍频系数，是 72 MHz 主频配置的核心一步。",
    en: "Select the PLL source and multiplier — the core step of the 72 MHz clock setup.",
    params: [
      ["RCC_PLLSource", "RCC_PLLSource_HSE / _HSI_Div2", "RCC_PLLSource_HSE / _HSI_Div2"],
      ["RCC_PLLMul", "倍频，如 RCC_PLLMul_9", "Multiplier, e.g. RCC_PLLMul_9"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_rcc.h",
    eq: "hal.rcc.oscinit",
    rel: ["std.rcc.waitforhse", "std.rcc.sysclkconfig"],
    tags: ["pll", "时钟", "clock", "72mhz"]
  }),
  fn({
    id: "std.rcc.sysclkconfig", lib: "std", p: "rcc", n: "RCC_SYSCLKConfig",
    sig: "void RCC_SYSCLKConfig(uint32_t RCC_SYSCLKSource);",
    zh: "切换系统时钟源到 PLL、HSE 或 HSI，切换前必须保证目标时钟已稳定。",
    en: "Switch the system clock source to PLL, HSE or HSI; the target clock must already be stable.",
    params: [["RCC_SYSCLKSource", "如 RCC_SYSCLKSource_PLLCLK", "e.g. RCC_SYSCLKSource_PLLCLK"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_rcc.h",
    eq: "hal.rcc.clockinit",
    rel: ["std.rcc.pllconfig", "std.rcc.getclocksfreq"],
    tags: ["系统时钟", "sysclk", "clock"]
  }),
  fn({
    id: "std.rcc.waitforhse", lib: "std", p: "rcc", n: "RCC_WaitForHSEStartUp",
    sig: "ErrorStatus RCC_WaitForHSEStartUp(void);",
    zh: "等待外部晶振起振并带超时，返回 SUCCESS 或 ERROR，用来决定是否回退到 HSI。",
    en: "Wait for the external crystal with a timeout; returns SUCCESS or ERROR so you can fall back to HSI.",
    params: [],
    ret: ["SUCCESS / ERROR", "SUCCESS / ERROR"],
    hdr: "stm32f10x_rcc.h",
    rel: ["std.rcc.pllconfig", "std.rcc.sysclkconfig"],
    tags: ["hse", "晶振", "crystal", "启动", "startup"]
  }),
  fn({
    id: "std.rcc.getclocksfreq", lib: "std", p: "rcc", n: "RCC_GetClocksFreq",
    sig: "void RCC_GetClocksFreq(RCC_ClocksTypeDef* RCC_Clocks);",
    zh: "读出 SYSCLK、HCLK 与各总线频率，串口波特率计算和调试时常用。",
    en: "Read back SYSCLK, HCLK and bus frequencies; handy for baud-rate math and debugging.",
    params: [["RCC_Clocks", "输出结构体指针", "Pointer to the output struct"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_rcc.h",
    eq: "hal.rcc.gethclkfreq",
    rel: ["std.rcc.sysclkconfig", "std.usart.init"],
    tags: ["频率", "clock", "freq", "调试"]
  }),
  fn({
    id: "std.rcc.deinit", lib: "std", p: "rcc", n: "RCC_DeInit",
    sig: "void RCC_DeInit(void);",
    zh: "把 RCC 寄存器恢复为复位值（HSI 运行），常用于重新初始化时钟树。",
    en: "Reset the RCC registers to default (running from HSI); used before re-initialising the clock tree.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f10x_rcc.h",
    eq: "hal.rcc.deinit",
    rel: ["std.rcc.sysclkconfig", "std.rcc.pllconfig"],
    tags: ["复位", "deinit", "clock"]
  }),

  /* ---------------- RCC · HAL ---------------- */
  fn({
    id: "hal.rcc.clkenable", lib: "hal", p: "rcc", n: "__HAL_RCC_<PERIPH>_CLK_ENABLE",
    macro: true,
    sig: "__HAL_RCC_GPIOA_CLK_ENABLE();   /* 其他外设同名替换，如 USART1 / TIM2 / DMA1 */",
    zh: "HAL 时钟使能宏，按外设名生成，例如 __HAL_RCC_USART1_CLK_ENABLE()。封装在 MspInit 中调用最规范。",
    en: "HAL clock-enable macro generated per peripheral, e.g. __HAL_RCC_USART1_CLK_ENABLE(); best called inside MspInit.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_rcc_ex.h",
    eq: "std.rcc.apb2clockcmd",
    rel: ["hal.gpio.init", "hal.usart.init", "hal.dma.start"],
    tags: ["时钟", "使能", "clock", "enable", "macro", "msp"]
  }),
  fn({
    id: "hal.rcc.oscinit", lib: "hal", p: "rcc", n: "HAL_RCC_OscConfig",
    sig: "HAL_StatusTypeDef HAL_RCC_OscConfig(RCC_OscInitTypeDef *RCC_OscInitStruct);",
    zh: "配置 HSE/HSI、PLL 与时钟源参数；CubeMX 生成的 SystemClock_Config 第一步就是它。",
    en: "Configure HSE/HSI, PLL and oscillator parameters; the first call inside CubeMX's SystemClock_Config.",
    params: [["RCC_OscInitStruct", "振荡器与 PLL 参数结构体", "Oscillator and PLL settings"]],
    ret: ["HAL_OK / HAL_ERROR / HAL_TIMEOUT", "HAL_OK / HAL_ERROR / HAL_TIMEOUT"],
    hdr: "stm32f1xx_hal_rcc.h",
    eq: "std.rcc.pllconfig",
    rel: ["hal.rcc.clockinit", "hal.rcc.getpclk1freq"],
    tags: ["pll", "hse", "时钟", "clock", "systemclock"]
  }),
  fn({
    id: "hal.rcc.clockinit", lib: "hal", p: "rcc", n: "HAL_RCC_ClockConfig",
    sig: "HAL_StatusTypeDef HAL_RCC_ClockConfig(RCC_ClkInitTypeDef *RCC_ClkInitStruct, uint32_t FLatency);",
    zh: "设置 AHB/APB 分频、系统时钟源与 Flash 等待周期；FLatency 必须与主频匹配。",
    en: "Set AHB/APB dividers, the system clock source and flash latency; latency must match the target frequency.",
    params: [
      ["RCC_ClkInitStruct", "时钟源与分频配置", "Clock source and dividers"],
      ["FLatency", "FLASH_LATENCY_0/1/2", "FLASH_LATENCY_0/1/2"]
    ],
    ret: ["HAL_OK / HAL_ERROR / HAL_TIMEOUT", "HAL_OK / HAL_ERROR / HAL_TIMEOUT"],
    hdr: "stm32f1xx_hal_rcc.h",
    eq: "std.rcc.sysclkconfig",
    rel: ["hal.rcc.oscinit", "hal.rcc.gethclkfreq"],
    tags: ["系统时钟", "sysclk", "分频", "latency"]
  }),
  fn({
    id: "hal.rcc.gethclkfreq", lib: "hal", p: "rcc", n: "HAL_RCC_GetHCLKFreq",
    sig: "uint32_t HAL_RCC_GetHCLKFreq(void);",
    zh: "返回 AHB 总线频率（即内核主频），配置 SysTick 或算波特率时使用。",
    en: "Return the AHB bus frequency (core clock); use it for SysTick or baud-rate math.",
    params: [],
    ret: ["HCLK 频率（Hz）", "HCLK in Hz"],
    hdr: "stm32f1xx_hal_rcc.h",
    eq: "std.rcc.getclocksfreq",
    rel: ["hal.rcc.getpclk1freq", "hal.rcc.clockinit"],
    tags: ["频率", "clock", "hz", "sysclk"]
  }),
  fn({
    id: "hal.rcc.getpclk1freq", lib: "hal", p: "rcc", n: "HAL_RCC_GetPCLK1Freq",
    sig: "uint32_t HAL_RCC_GetPCLK1Freq(void);",
    zh: "返回 APB1 频率，挂在其上的定时器时钟可能再倍频，计算 PWM 周期时要以它为准。",
    en: "Return the APB1 clock; timers on that bus may be doubled, so use it for PWM period math.",
    params: [],
    ret: ["PCLK1 频率（Hz）", "PCLK1 in Hz"],
    hdr: "stm32f1xx_hal_rcc.h",
    eq: "std.rcc.getclocksfreq",
    rel: ["hal.tim.baseinit", "hal.rcc.gethclkfreq"],
    tags: ["频率", "apb1", "clock", "timer"]
  }),
  fn({
    id: "hal.rcc.deinit", lib: "hal", p: "rcc", n: "HAL_RCC_DeInit",
    sig: "void HAL_RCC_DeInit(void);",
    zh: "把时钟配置恢复为复位状态，通常只在启动文件或极端恢复流程中使用。",
    en: "Restore the clock tree to reset defaults; rarely needed outside boot or recovery code.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_rcc.h",
    eq: "std.rcc.deinit",
    rel: ["hal.rcc.oscinit", "hal.rcc.clockinit"],
    tags: ["复位", "deinit", "clock"]
  }),

  /* ---------------- NVIC · SPL ---------------- */
  fn({
    id: "std.nvic.prioritygroup", lib: "std", p: "nvic", n: "NVIC_PriorityGroupConfig",
    sig: "void NVIC_PriorityGroupConfig(uint32_t NVIC_PriorityGroup);",
    zh: "设置抢占/子优先级位数分配，全工程只应调用一次且与所有中断的数值保持一致。",
    en: "Assign bits between preemption and sub-priority; call once per project and keep it consistent.",
    params: [["NVIC_PriorityGroup", "NVIC_PriorityGroup_0 ~ _4", "NVIC_PriorityGroup_0 ~ _4"]],
    ret: ["无", "None"],
    hdr: "misc.h",
    eq: "hal.nvic.setprioritygrouping",
    rel: ["std.nvic.init", "std.nvic.enableirq"],
    tags: ["优先级", "priority", "中断", "nvic"]
  }),
  fn({
    id: "std.nvic.init", lib: "std", p: "nvic", n: "NVIC_Init",
    sig: "void NVIC_Init(NVIC_InitTypeDef* NVIC_InitStruct);",
    zh: "为某个 IRQ 通道使能中断并设置抢占/子优先级。",
    en: "Enable an IRQ channel and set its preemption and sub-priority.",
    params: [
      ["NVIC_InitStruct", "成员：IRQn、抢占优先级、子优先级、EnableCmd", "Members: IRQn, preemption, sub-priority, enable"]
    ],
    ret: ["无", "None"],
    hdr: "misc.h",
    eq: "hal.nvic.setpriority",
    rel: ["std.nvic.prioritygroup", "std.exti.init", "std.usart.itconfig"],
    tags: ["中断", "使能", "irq", "priority"]
  }),
  fn({
    id: "std.nvic.enableirq", lib: "std", p: "nvic", n: "NVIC_EnableIRQ",
    sig: "void NVIC_EnableIRQ(IRQn_Type IRQn);",
    zh: "按 IRQn 枚举直接使能中断，比填结构体更简洁；优先级需另外设置。",
    en: "Enable an interrupt directly by IRQn; priorities still need to be set separately.",
    params: [["IRQn", "IRQ 枚举，如 USART1_IRQn", "IRQ enum, e.g. USART1_IRQn"]],
    ret: ["无", "None"],
    hdr: "core_cm3.h",
    eq: "hal.nvic.enableirq",
    rel: ["std.nvic.init", "std.nvic.disableirq"],
    tags: ["使能", "中断", "enable", "irq"]
  }),
  fn({
    id: "std.nvic.disableirq", lib: "std", p: "nvic", n: "NVIC_DisableIRQ",
    sig: "void NVIC_DisableIRQ(IRQn_Type IRQn);",
    zh: "关闭指定中断通道，临界区或重新配置外设前使用。",
    en: "Disable an interrupt channel, typically before reconfiguring a peripheral or inside critical sections.",
    params: [["IRQn", "IRQ 枚举", "IRQ enum"]],
    ret: ["无", "None"],
    hdr: "core_cm3.h",
    eq: "hal.nvic.disableirq",
    rel: ["std.nvic.enableirq"],
    tags: ["关闭", "中断", "disable", "irq"]
  }),

  /* ---------------- NVIC · HAL ---------------- */
  fn({
    id: "hal.nvic.setprioritygrouping", lib: "hal", p: "nvic", n: "HAL_NVIC_SetPriorityGrouping",
    sig: "void HAL_NVIC_SetPriorityGrouping(uint32_t PriorityGrouping);",
    zh: "设置优先级分组，参数为 0~7；必须与首层 HAL_Init 中的分组保持一致。",
    en: "Set the priority grouping (0-7); keep it consistent with the grouping chosen in HAL_Init.",
    params: [["PriorityGrouping", "0 ~ 7，对应 NVIC_PRIORITYGROUP_x", "0-7, NVIC_PRIORITYGROUP_x"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_cortex.h",
    eq: "std.nvic.prioritygroup",
    rel: ["hal.nvic.setpriority"],
    tags: ["优先级", "分组", "priority", "group"]
  }),
  fn({
    id: "hal.nvic.setpriority", lib: "hal", p: "nvic", n: "HAL_NVIC_SetPriority",
    sig: "void HAL_NVIC_SetPriority(IRQn_Type IRQn, uint32_t PreemptPriority, uint32_t SubPriority);",
    zh: "设置某个中断的抢占与子优先级；数字越小优先级越高。",
    en: "Set preemption and sub-priority for an IRQ; lower numbers mean higher priority.",
    params: [
      ["IRQn", "IRQ 枚举", "IRQ enum"],
      ["PreemptPriority", "抢占优先级", "Preemption priority"],
      ["SubPriority", "子优先级", "Sub-priority"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_cortex.h",
    eq: "std.nvic.init",
    rel: ["hal.nvic.enableirq", "hal.nvic.setprioritygrouping", "hal.nvic.enableirq"],
    tags: ["优先级", "priority", "中断"]
  }),
  fn({
    id: "hal.nvic.enableirq", lib: "hal", p: "nvic", n: "HAL_NVIC_EnableIRQ",
    sig: "void HAL_NVIC_EnableIRQ(IRQn_Type IRQn);",
    zh: "使能指定中断通道，HAL 中通常在 MspInit 里与时钟、引脚一起配置。",
    en: "Enable an IRQ channel; in HAL this usually happens in MspInit together with clocks and pins.",
    params: [["IRQn", "IRQ 枚举", "IRQ enum"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_cortex.h",
    eq: "std.nvic.enableirq",
    rel: ["hal.nvic.setpriority", "hal.usart.irqhandler"],
    tags: ["使能", "中断", "enable", "irq"]
  }),
  fn({
    id: "hal.nvic.disableirq", lib: "hal", p: "nvic", n: "HAL_NVIC_DisableIRQ",
    sig: "void HAL_NVIC_DisableIRQ(IRQn_Type IRQn);",
    zh: "关闭指定中断；停止外设或进入低功耗前调用，避免误唤醒。",
    en: "Disable an IRQ; call before stopping a peripheral or entering low power to avoid spurious wake-ups.",
    params: [["IRQn", "IRQ 枚举", "IRQ enum"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_cortex.h",
    eq: "std.nvic.disableirq",
    rel: ["hal.nvic.enableirq"],
    tags: ["关闭", "中断", "disable", "irq"]
  }),

  /* ---------------- EXTI · SPL ---------------- */
  fn({
    id: "std.exti.lineconfig", lib: "std", p: "exti", n: "GPIO_EXTILineConfig",
    sig: "void GPIO_EXTILineConfig(uint8_t GPIO_PortSource, uint8_t GPIO_PinSource);",
    zh: "把某个端口引脚映射到 EXTI 线（如 GPIOA + Pin0 → EXTI0）。F4 上对应 SYSCFG_EXTILineConfig。",
    en: "Map a port pin onto an EXTI line (GPIOA + Pin0 → EXTI0). On F4 use SYSCFG_EXTILineConfig.",
    params: [
      ["GPIO_PortSource", "如 GPIO_PortSourceGPIOA", "e.g. GPIO_PortSourceGPIOA"],
      ["GPIO_PinSource", "如 GPIO_PinSource0", "e.g. GPIO_PinSource0"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_gpio.h",
    rel: ["std.exti.init", "std.rcc.apb2clockcmd"],
    tags: ["映射", "exti", "映射线", "afio"]
  }),
  fn({
    id: "std.exti.init", lib: "std", p: "exti", n: "EXTI_Init",
    sig: "void EXTI_Init(EXTI_InitTypeDef* EXTI_InitStruct);",
    zh: "配置 EXTI 线的触发边沿与中断/事件模式，并使能该线。",
    en: "Configure the trigger edge and interrupt/event mode of an EXTI line, then enable it.",
    params: [
      ["EXTI_InitStruct", "成员：EXTI_Line、EXTI_Mode、EXTI_Trigger、EXTI_LineCmd", "Members: line, mode, trigger, line command"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_exti.h",
    eq: "hal.exti.irqhandler",
    rel: ["std.exti.lineconfig", "std.nvic.init", "std.exti.getitstatus"],
    tags: ["外部中断", "exti", "初始化", "init", "边沿"]
  }),
  fn({
    id: "std.exti.getitstatus", lib: "std", p: "exti", n: "EXTI_GetITStatus",
    sig: "ITStatus EXTI_GetITStatus(uint32_t EXTI_Line);",
    zh: "判断某条 EXTI 线是否产生了中断，共享向量时用来区分来源。",
    en: "Check whether an EXTI line raised an interrupt; useful when several lines share one vector.",
    params: [["EXTI_Line", "如 EXTI_Line0", "e.g. EXTI_Line0"]],
    ret: ["SET / RESET（ITStatus）", "SET / RESET (ITStatus)"],
    hdr: "stm32f10x_exti.h",
    rel: ["std.exti.clearitpending", "std.exti.init"],
    tags: ["状态", "标志", "flag", "exti"]
  }),
  fn({
    id: "std.exti.clearitpending", lib: "std", p: "exti", n: "EXTI_ClearITPendingBit",
    sig: "void EXTI_ClearITPendingBit(uint32_t EXTI_Line);",
    zh: "清除 EXTI 挂起位，漏掉会让中断退出后立即再次进入，形成死循环。",
    en: "Clear the EXTI pending bit; skipping it makes the ISR re-enter forever.",
    params: [["EXTI_Line", "如 EXTI_Line0", "e.g. EXTI_Line0"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_exti.h",
    rel: ["std.exti.getitstatus"],
    tags: ["清除", "标志", "clear", "pending"]
  }),

  /* ---------------- EXTI · HAL ---------------- */
  fn({
    id: "hal.exti.irqhandler", lib: "hal", p: "exti", n: "HAL_GPIO_EXTI_IRQHandler",
    sig: "void HAL_GPIO_EXTI_IRQHandler(uint16_t GPIO_Pin);",
    zh: "在 EXTIx_IRQHandler 中调用，内部清标志并回调 HAL_GPIO_EXTI_Callback。",
    en: "Call from EXTIx_IRQHandler; it clears the flag and dispatches HAL_GPIO_EXTI_Callback.",
    params: [["GPIO_Pin", "触发引脚掩码，如 GPIO_PIN_0", "Triggered pin mask, e.g. GPIO_PIN_0"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_gpio.h",
    eq: "std.exti.getitstatus",
    rel: ["hal.exti.callback", "hal.nvic.enableirq"],
    tags: ["中断服务", "isr", "irq", "exti"]
  }),
  fn({
    id: "hal.exti.callback", lib: "hal", p: "exti", n: "HAL_GPIO_EXTI_Callback",
    sig: "__weak void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin);",
    zh: "弱函数回调，在用户文件重写它处理按键；不要在这里做耗时操作。",
    en: "Weak callback overridden by the user to handle the button; keep it short — no blocking work.",
    params: [["GPIO_Pin", "触发引脚掩码", "Triggered pin mask"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_gpio.h",
    rel: ["hal.exti.irqhandler", "hal.gpio.readpin"],
    tags: ["回调", "callback", "按键", "button"]
  }),
  fn({
    id: "hal.exti.clearit", lib: "hal", p: "exti", n: "__HAL_GPIO_EXTI_CLEAR_IT",
    macro: true,
    sig: "__HAL_GPIO_EXTI_CLEAR_IT(GPIO_PIN_0);",
    zh: "手动清除 EXTI 挂起标志的宏，自定义中断处理或补清标志时使用。",
    en: "Macro that clears an EXTI pending flag for custom ISR paths.",
    params: [["__EXTI_LINE__", "引脚掩码", "Pin mask"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_gpio.h",
    eq: "std.exti.clearitpending",
    rel: ["hal.exti.irqhandler"],
    tags: ["清除", "标志", "clear", "macro"]
  })
];
