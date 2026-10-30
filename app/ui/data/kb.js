/* Hardware KB content for the knowledge base pages (#/kb).
   Target part: STM32F103C8T6 (LQFP48, Cortex-M3 72MHz, 20K SRAM, 64K Flash, 2.0-3.6V).
   refs[].page matches "## 第 N 页 · 标题" in STM32入门教程.md; estimates are labelled as estimates. */

export const KB_ARTICLES = [
  {
    id: "f103c8t6",
    p: "rcc",
    icon: "chip",
    title: { zh: "STM32F103C8T6 芯片与最小系统", en: "STM32F103C8T6 chip and minimum system" },
    summary: {
      zh: "型号含义、片上外设、启动配置与最小系统电路的完整清单。",
      en: "Part number, on-chip peripherals, boot pins and the minimum-system checklist."
    },
    blocks: [
      {
        kind: "p",
        zh: "这颗芯片是整个教程的目标型号：ARM Cortex-M3 内核、72MHz 主频、20K SRAM、64K Flash、LQFP48 封装、"
          + "供电范围 2.0-3.6V（标准 3.3V）。先明确它有什么、没有什么，后面所有外设配置才不会照抄错型号。",
        en: "The target part of the whole course: Cortex-M3 core, 72MHz, 20K SRAM, 64K Flash, LQFP48, "
          + "2.0-3.6V supply (3.3V nominal). Know exactly what it has and lacks before copying any peripheral setup."
      },
      {
        kind: "list",
        items: [
          {
            zh: "型号拆解：<b>STM32</b> 系列 + <b>F</b> 主流型 + <b>103</b> 增强型 + <b>C</b> 48 脚 + "
              + "<b>8</b> 64K Flash + <b>T</b> LQFP 封装 + <b>6</b> -40~85°C 工业级。",
            en: "<b>STM32</b> family + <b>F</b> mainstream + <b>103</b> enhanced + <b>C</b> 48 pins + "
              + "<b>8</b> 64K flash + <b>T</b> LQFP + <b>6</b> -40 to 85°C."
          },
          {
            zh: "存储与速度：Flash 64K（页大小 1K，中容量），SRAM 20K，Cortex-M3 最高 72MHz，"
              + "单周期乘法器加硬件除法，没有 FPU 和 DSP 指令。",
            en: "Memory and speed: 64K flash (1K pages, medium density), 20K SRAM, Cortex-M3 up to 72MHz, "
              + "single-cycle multiply and hardware divide, no FPU, no DSP instructions."
          },
          {
            zh: "片上外设：NVIC、SysTick、RCC、PWR、BKP、CRC、AFIO、EXTI、GPIOA/B/C（共 35 个引脚）、"
              + "TIM1（高级）+ TIM2/3/4（通用）、ADC1/ADC2、USART1/2/3、SPI1/SPI2、I2C1/I2C2、"
              + "DMA1（7 通道）、IWDG、WWDG、RTC、USB 2.0 全速设备口、1 路 CAN。",
            en: "On-chip: NVIC, SysTick, RCC, PWR, BKP, CRC, AFIO, EXTI, GPIOA/B/C (35 pins), "
              + "TIM1 (advanced) plus TIM2/3/4 (general), ADC1/ADC2, USART1/2/3, SPI1/SPI2, I2C1/I2C2, "
              + "DMA1 (7 channels), IWDG, WWDG, RTC, USB 2.0 full-speed device, one CAN."
          }
        ]
      },
      {
        kind: "formula",
        expr: "SYSCLK = HSE × PLLMUL = 8 MHz × 9 = 72 MHz",
        note: {
          zh: "最小系统板普遍用 8MHz 无源晶振加 PLL 9 倍频。之后 AHB = 72MHz，APB1 最高 36MHz（/2），"
            + "APB2 = 72MHz，ADC 时钟再 /6 得 12MHz。换晶振或改倍频，所有基于主频的时间常数都要重算。",
          en: "Blue-pill class boards use an 8MHz crystal with PLL ×9. AHB stays at 72MHz, APB1 is /2 to 36MHz, "
            + "APB2 is 72MHz, and ADCCLK is /6 to 12MHz. Change the crystal or multiplier and every "
            + "frequency-derived constant must be recomputed."
        }
      },
      {
        kind: "list",
        items: [
          {
            zh: "BOOT0 = 0：从主 Flash（0x0800 0000）启动，正常运行固件，这是唯一需要跳线帽默认接地的状态。",
            en: "BOOT0 = 0: boot from main flash (0x0800 0000) and run your firmware — the normal default."
          },
          {
            zh: "BOOT0 = 1、BOOT1 = 0：从系统存储器启动，运行 ST 内置 BootLoader，可用串口下载程序。",
            en: "BOOT0 = 1, BOOT1 = 0: boot from system memory, run ST's built-in loader for serial download."
          },
          {
            zh: "BOOT0 = 1、BOOT1 = 1：从内置 SRAM 启动，断电即丢，只用于调试。注意 BOOT1 就是 <code>PB2</code>。",
            en: "BOOT0 = 1, BOOT1 = 1: boot from internal SRAM, volatile, debug only. Note BOOT1 is <code>PB2</code>."
          }
        ]
      },
      {
        kind: "list",
        items: [
          {
            zh: "电源：3.3V 经 LDO 稳压后送入 VDD，2.0-3.6V 范围内都能运行；VDDA 单独经磁珠或 10Ω 电阻加 100nF 滤波，"
              + "否则 ADC 读数会随数字噪声跳动。",
            en: "Power: 3.3V from an LDO into VDD, 2.0-3.6V operating range; feed VDDA through a bead or 10Ω "
              + "plus 100nF, or ADC readings will follow digital noise."
          },
          {
            zh: "去耦：每个 VDD 引脚就近放 100nF，整板再加 4.7-10µF 储能电容。去耦电容离引脚越远，效果越接近没有。",
            en: "Decoupling: one 100nF per VDD pin as close as possible, plus 4.7-10µF bulk for the board. "
              + "A cap placed far from the pin is nearly equivalent to none."
          },
          {
            zh: "复位：NRST 接 10kΩ 上拉到 3.3V，再串 100nF 到地；内部已有弱上拉，外部阻容是为了抗干扰和延长复位时间。",
            en: "Reset: 10kΩ from NRST to 3.3V with 100nF to ground. The internal pull-up exists, but the "
              + "external RC adds noise immunity and stretches the reset pulse."
          },
          {
            zh: "晶振：HSE 8MHz 加两颗 10-30pF 负载电容（典型 20pF），走线尽量短；需要走时再加 32.768kHz LSE 给 RTC。",
            en: "Clock: 8MHz HSE with two 10-30pF load caps (20pF typical) and short traces; add a 32.768kHz "
              + "LSE only if the RTC must keep time."
          },
          {
            zh: "BOOT0 用 10kΩ 下拉到地，调试口留出 3.3V/GND/SWDIO/SWCLK 四根线。",
            en: "Pull BOOT0 to ground through 10kΩ and expose 3.3V, GND, SWDIO and SWCLK for debugging."
          }
        ]
      },
      {
        kind: "warn",
        zh: "F103C8T6 属于 48 脚中容量产品，<b>没有 DAC、SDIO、FSMC、I2S</b>，也没有 TIM6/TIM7 和 DMA2。"
          + "网上大量例程来自 100 脚或大容量型号，对着这些外设抄配置只会在编译或运行时失败。",
        en: "The F103C8T6 is a 48-pin medium-density part: <b>no DAC, SDIO, FSMC or I2S</b>, and no TIM6/TIM7 "
          + "or DMA2. Most online examples target 100-pin or high-density parts; copying those setups fails."
      },
      {
        kind: "warn",
        zh: "最小系统不等于随便通电：BOOT0 悬空会因浮空电平随机进 BootLoader，VDDA/VBAT 悬空会让 ADC 结果不可信。"
          + "这两处一定要按电路图接好再开始调代码。",
        en: "A minimum system is not just power: a floating BOOT0 can drop the chip into the bootloader at random, "
          + "and floating VDDA/VBAT makes every ADC result untrustworthy."
      }
    ],
    refs: [
      { page: 7, title: "STM32F103C8T6" },
      { page: 8, title: "片上资源/外设" },
      { page: 9, title: "命名规则" },
      { page: 12, title: "启动配置" },
      { page: 13, title: "最小系统电路" }
    ],
    related: {
      workflows: ["wf.clock-init", "wf.nvic-priority"],
      functions: ["hal.rcc.clockinit", "hal.rcc.getpclk1freq", "hal.rcc.clkenable"]
    }
  },

  {
    id: "pin-map",
    p: "gpio",
    icon: "map",
    title: { zh: "引脚分布与复用映射", en: "Pinout and alternate-function map" },
    summary: {
      zh: "35 个 GPIO 的口线、ADC 通道、定时器与串口映射，以及哪些脚不能当普通 IO。",
      en: "The 35 GPIO pins, ADC channels, timer and UART mappings, and the pins you cannot treat as plain IO."
    },
    blocks: [
      {
        kind: "p",
        zh: "LQFP48 只引出三个端口：PA0-PA15、PB0-PB15 和 PC13-PC15。每个引脚上电默认是浮空输入，"
          + "能做什么取决于 AFIO 的重映射表和引脚的模拟/调试占用情况，先把这张表记住能省掉大部分接线错误。",
        en: "LQFP48 exposes three ports: PA0-PA15, PB0-PB15 and PC13-PC15. Every pin resets to floating input, "
          + "and what it can do depends on the AFIO remap table plus analog and debug reservations."
      },
      {
        kind: "formula",
        expr: "GPIO 总数 = 16 (PA0–PA15) + 16 (PB0–PB15) + 3 (PC13–PC15) = 35",
        note: {
          zh: "其中 PA13/PA14 已被 SWDIO/SWCLK 占用，PA15/PB3/PB4 被 JTAG 占用，实际可自由支配的引脚约 30 个。"
            + "引脚编号和寄存器位号一一对应，第 n 脚就是 IDR/ODR 的第 n 位。",
          en: "PA13/PA14 belong to SWDIO/SWCLK and PA15/PB3/PB4 to JTAG, leaving roughly 30 pins free. "
            + "Pin index equals register bit index: pin n is bit n of IDR/ODR."
        }
      },
      {
        kind: "list",
        items: [
          {
            zh: "ADC 通道：<code>PA0–PA7</code> 就是 <code>ADC1_IN0–IN7</code>，<code>PB0/PB1</code> 是 <code>IN8/IN9</code>，"
              + "ADC1 与 ADC2 共用这 10 个外部通道（另有两个内部通道：温度传感器和内部参考电压）。",
            en: "ADC channels: <code>PA0–PA7</code> are <code>ADC1_IN0–IN7</code> and <code>PB0/PB1</code> are "
              + "<code>IN8/IN9</code>. ADC1 and ADC2 share these 10 external channels, plus temperature and Vrefint."
          },
          {
            zh: "定时器通道：<code>TIM2_CH1–CH4 = PA0–PA3</code>，<code>TIM3_CH1–CH4 = PA6/PA7/PB0/PB1</code>，"
              + "<code>TIM4_CH1–CH4 = PB6–PB9</code>，<code>TIM1_CH1–CH4 = PA8/PA9/PA10/PA11</code>"
              + "（TIM1 另有 PB13/PB14/PB15 三路互补输出）。",
            en: "Timers: <code>TIM2_CH1–CH4 = PA0–PA3</code>, <code>TIM3_CH1–CH4 = PA6/PA7/PB0/PB1</code>, "
              + "<code>TIM4_CH1–CH4 = PB6–PB9</code>, <code>TIM1_CH1–CH4 = PA8/PA9/PA10/PA11</code>, with "
              + "complementary outputs on PB13/PB14/PB15."
          },
          {
            zh: "串口：<code>USART1 = PA9(TX)/PA10(RX)</code>，重映射到 <code>PB6/PB7</code>；"
              + "<code>USART2 = PA2/PA3</code>；<code>USART3 = PB10/PB11</code>。USART1 挂 APB2，"
              + "USART2/3 挂 APB1，所以同一个波特率三者要用的 BRR 值不同。",
            en: "UARTs: <code>USART1 = PA9/PA10</code> (remappable to <code>PB6/PB7</code>), "
              + "<code>USART2 = PA2/PA3</code>, <code>USART3 = PB10/PB11</code>. USART1 is on APB2, "
              + "USART2/3 on APB1, so the same baud rate needs different BRR values."
          },
          {
            zh: "总线：<code>SPI1 = PA5(SCK)/PA6(MISO)/PA7(MOSI)/PA4(NSS)</code>，<code>SPI2 = PB13/PB14/PB15/PB12</code>；"
              + "<code>I2C1 = PB6/PB7</code>，<code>I2C2 = PB10/PB11</code>。",
            en: "Buses: <code>SPI1 = PA5/PA6/PA7/PA4</code>, <code>SPI2 = PB13/PB14/PB15/PB12</code>, "
              + "<code>I2C1 = PB6/PB7</code>, <code>I2C2 = PB10/PB11</code>."
          },
          {
            zh: "冲突要提前排：PA2/PA3 同时是 USART2 和 TIM2_CH3/CH4；PB6/PB7 同时是 I2C1、USART1 重映射和 TIM4_CH1/CH2；"
              + "PA9/PA10 同时是 USART1 和 TIM1_CH2/CH3。一个引脚同一时刻只能选一种复用功能。",
            en: "Plan for conflicts: PA2/PA3 are both USART2 and TIM2_CH3/CH4; PB6/PB7 are I2C1, USART1 remap "
              + "and TIM4_CH1/CH2; PA9/PA10 are USART1 and TIM1_CH2/CH3. One pin carries one function at a time."
          }
        ]
      },
      {
        kind: "list",
        items: [
          {
            zh: "5V 容忍：数据手册引脚表里标 <code>FT</code> 的脚可以接 5V 电平（开漏模式下还能被拉到 5V）。"
              + "PA8-PA15、PB2-PB15 里标了 FT 的多数属于这一类。",
            en: "5V tolerance: pins marked <code>FT</code> in the datasheet pin table accept 5V, and open-drain "
              + "mode can be pulled up to 5V. Most of PA8-PA15 and PB2-PB15 that carry an FT mark qualify."
          },
          {
            zh: "不耐 5V 的脚：<code>PA0–PA7</code>、<code>PB0/PB1</code>（ADC 输入，标 <code>TTa</code>）以及 "
              + "<code>PC13–PC15</code>。给这些脚灌 5V 会通过 ESD 二极管倒灌，轻则 ADC 读数异常，重则永久损坏。",
            en: "Not 5V tolerant: <code>PA0–PA7</code>, <code>PB0/PB1</code> (ADC inputs, marked <code>TTa</code>) "
              + "and <code>PC13–PC15</code>. Driving 5V into them forward-biases the ESD diodes."
          },
          {
            zh: "PA0 还是 WKUP 唤醒脚，PA13/PA14 是 SWDIO/SWCLK，PA15/PB3/PB4 默认是 JTDI/JTDO/NJTRST。"
              + "要把 PA15/PB3/PB4 当 GPIO，必须先开 AFIO 时钟并关闭对应 JTAG 位（只留 SWD），再重映射。",
            en: "PA0 doubles as WKUP, PA13/PA14 are SWDIO/SWCLK, and PA15/PB3/PB4 reset to JTDI/JTDO/NJTRST. "
              + "To use them as GPIO, enable AFIO and disable the JTAG bits (SWD only) before remapping."
          }
        ]
      },
      {
        kind: "warn",
        zh: "把 PA13/PA14 配置成普通 GPIO，或者用代码关掉 SWD，会让调试器彻底连不上；这时只能靠 BOOT0 拉高进 "
          + "BootLoader 重新擦除，或者接复位线强行连接。改调试脚之前先确认手上有恢复手段。",
        en: "Configuring PA13/PA14 as plain GPIO — or disabling SWD in code — locks the debugger out completely. "
          + "Recovery means pulling BOOT0 high and erasing, or wiring the reset line. Verify that first."
      }
    ],
    refs: [
      { page: 11, title: "引脚定义" },
      { page: 18, title: "GPIO简介" },
      { page: 48, title: "AFIO复用IO口" },
      { page: 90, title: "输入通道" }
    ],
    related: {
      workflows: ["wf.gpio-input", "wf.exti-button"],
      functions: ["hal.gpio.init", "hal.gpio.readpin"]
    }
  },

  {
    id: "gpio-modes",
    p: "gpio",
    icon: "pin",
    title: { zh: "GPIO 的 8 种模式与电气参数", en: "GPIO modes and electrical limits" },
    summary: {
      zh: "八种输入输出模式的用途、阈值电压与电流上限，以及推挽输出的等效内阻。",
      en: "The eight modes, threshold voltages, current limits and the push-pull output resistance."
    },
    blocks: [
      {
        kind: "list",
        items: [
          {
            zh: "<b>浮空输入</b>：引脚直接进施密特触发器，悬空时电平不确定；外部已有上下拉时用它。",
            en: "<b>Floating input</b>: straight into the Schmitt trigger; undefined when floating. Use it when the "
              + "board already has an external pull."
          },
          {
            zh: "<b>上拉输入</b>：内部约 40kΩ 接到 VDD，悬空读高电平；<b>下拉输入</b>：约 40kΩ 接到 VSS，悬空读低电平。",
            en: "<b>Pull-up input</b>: internal ≈40kΩ to VDD, reads high when floating; <b>pull-down input</b>: "
              + "≈40kΩ to VSS, reads low."
          },
          {
            zh: "<b>模拟输入</b>：GPIO 数字部分断开，引脚直连 ADC 采样开关；只有这一种模式能拿到未经整形的真实电压。",
            en: "<b>Analog input</b>: the digital path is disconnected and the pin feeds the ADC switch. Only this "
              + "mode gives you the unshaped analog voltage."
          },
          {
            zh: "<b>推挽输出</b>：高电平接 VDD、低电平接 VSS，能主动拉高也能拉低，是驱动 LED 和数字外设的默认选择。",
            en: "<b>Push-pull output</b>: high side to VDD, low side to VSS — actively drives both ways; the default "
              + "for LEDs and digital loads."
          },
          {
            zh: "<b>开漏输出</b>：高电平是高阻态，必须外加上拉电阻才能得到高电平；低电平直接接 VSS。",
            en: "<b>Open-drain output</b>: the high state is high-impedance and needs an external pull-up; the low "
              + "state sinks to VSS."
          },
          {
            zh: "<b>复用推挽输出</b>：输出端由片上外设驱动，程序写 ODR 不起作用，引脚电平完全由 USART/SPI/TIM 决定。",
            en: "<b>Alternate push-pull</b>: the pad is driven by a peripheral, so writing ODR does nothing and "
              + "USART/SPI/TIM own the level."
          },
          {
            zh: "<b>复用开漏输出</b>：外设驱动但只拉低，高电平靠外部上拉；I2C 这类线与总线必须用这一种。",
            en: "<b>Alternate open-drain</b>: the peripheral can only pull low and an external pull-up supplies the "
              + "high level; wired-AND buses such as I2C need this mode."
          }
        ]
      },
      {
        kind: "p",
        zh: "输入模式的选择只看一件事：引脚在没有任何外力时应该读到什么。按键接地的场景用上拉输入，"
          + "按键接 VDD 的场景用下拉输入，外部模块已经有推挽输出或上拉电阻的场景用浮空输入。"
          + "输出模式的选择看是否需要拉高：需要主动输出高电平就用推挽，需要线与或多电压域就用开漏。",
        en: "Pick the input mode by asking what the pin should read with nothing connected: pull-up for a "
          + "button to ground, pull-down for a button to VDD, floating when the external device already drives the "
          + "line. For outputs, push-pull when the pin must source current, open-drain for wired-AND or mixed rails."
      },
      {
        kind: "formula",
        expr: "VIL(max) = 0.3 × VDD，VIH(min) = 0.7 × VDD",
        note: {
          zh: "3.3V 供电时即 0.99V 与 2.31V 的分界，中间约 1.3V 是禁止区。给 3.3V 芯片输入 2.5V 的高电平属于边缘状态，"
            + "能读到什么取决于温度和个体差异，不要这样设计。",
          en: "At 3.3V that gives 0.99V and 2.31V, with roughly 1.3V of forbidden band between them. Driving a "
            + "2.5V high into a 3.3V part sits at the edge and is not a design margin."
        }
      },
      {
        kind: "list",
        items: [
          {
            zh: "单脚电流：绝对最大 ±20mA（沉入/拉出），推荐工作值 ±8mA。数据手册在 8mA 下才保证 VOL ≤ 1.3V、VOH ≥ 2.9V。",
            en: "Per-pin current: ±20mA absolute maximum, ±8mA recommended; the datasheet only guarantees "
              + "VOL ≤ 1.3V and VOH ≥ 2.9V at 8mA."
          },
          {
            zh: "总和：所有 IO 沉入电流与拉出电流各自不超过 150mA，超了会拉低整个芯片的 VDD。",
            en: "Totals: sunk and sourced currents are each limited to 150mA across the whole device, otherwise "
              + "the on-chip VDD sags."
          },
          {
            zh: "内部上拉/下拉阻值 30-50kΩ，典型 40kΩ；引脚输入电容典型 5pF，这就是高频信号要算驱动能力的原因。",
            en: "Internal pull resistors are 30-50kΩ, typically 40kΩ; pin capacitance is typically 5pF, which is "
              + "why fast signals need a drive check."
          }
        ]
      },
      {
        kind: "formula",
        expr: "Ron ≈ VOL / IOL ≈ 1.3 V / 8 mA ≈ 160 Ω（最坏情况）；典型 ≈ 50 Ω",
        note: {
          zh: "这是由 VOL/VOH@8mA 反推的等效内阻估算值，不是手册标称参数。用来估驱动电流与压降够用，"
            + "做精确功耗或高速边沿计算时要以数据手册的 VOL/VOH 曲线为准。",
          en: "An estimate back-derived from VOL/VOH at 8mA, not a datasheet parameter. Good enough for drive and "
            + "drop estimates; use the datasheet curves for exact power or edge-rate work."
        }
      },
      {
        kind: "warn",
        zh: "配成模拟输入的引脚，其数字功能（IDR 读取、EXTI 触发、上下拉）全部失效；反过来，给 ADC 采样的引脚开了内部上拉，"
          + "读数会被抬到接近 VDD，这是“ADC 一直读到满量程”的最常见原因。",
        en: "An analog-input pin loses its digital path entirely (no IDR read, no EXTI, no pull). Conversely, "
          + "enabling the internal pull-up on a pin you sample with the ADC biases the reading toward VDD — the "
          + "classic reason an ADC channel reads full scale."
      }
    ],
    refs: [
      { page: 21, title: "GPIO模式" },
      { page: 22, title: "浮空/上拉/下拉输入" },
      { page: 23, title: "模拟输入" },
      { page: 24, title: "开漏/推挽输出" },
      { page: 25, title: "复用开漏/推挽输出" }
    ],
    related: {
      workflows: ["wf.gpio-output", "wf.gpio-input"],
      functions: ["hal.gpio.init", "hal.gpio.writepin", "hal.gpio.lockpin"]
    }
  },

  {
    id: "led-bjt",
    p: "gpio",
    icon: "zap",
    title: { zh: "LED 与三极管驱动计算", en: "Driving LEDs and BJT switches" },
    summary: {
      zh: "LED 限流电阻、GPIO 直驱预算、NPN 开关管基极电阻与感性负载保护。",
      en: "LED series resistors, GPIO current budgets, NPN base resistors and inductive-load protection."
    },
    blocks: [
      {
        kind: "list",
        items: [
          {
            zh: "正向压降 VF 按颜色粗估：红 ≈1.8V、黄 ≈2.0V、绿 ≈2.1V、蓝/白 ≈3.0V。同色不同批次的离散可以到 ±0.2V，"
              + "设计时按最大 VF 算电流，按最小 VF 核对应力。",
            en: "Forward voltage by colour, roughly: red ≈1.8V, yellow ≈2.0V, green ≈2.1V, blue/white ≈3.0V. "
              + "Batch spread reaches ±0.2V; size the resistor at max VF and check stress at min VF."
          },
          {
            zh: "红绿黄 LED 的额定工作电流一般 5-20mA，指示灯取 2-5mA 已经足够亮；不要再照抄 20mA 的例程。",
            en: "Red, green and yellow LEDs are usually rated 5-20mA; 2-5mA is plenty for an indicator, so do not "
              + "blindly copy 20mA examples."
          }
        ]
      },
      {
        kind: "formula",
        expr: "R = (VDD − VF) / I",
        note: {
          zh: "3.3V 驱动红色 LED、目标 5mA 时 R = (3.3 − 1.8) / 0.005 = 300Ω，取标称值 330Ω 得到约 4.5mA。"
            + "用 5V 驱动时电源电压换成 5。",
          en: "For a red LED on 3.3V at 5mA: R = (3.3 − 1.8) / 0.005 = 300Ω; the nearest standard 330Ω gives "
            + "about 4.5mA. Use 5 instead of 3.3 for a 5V rail."
        }
      },
      {
        kind: "p",
        zh: "GPIO 直驱时的电流预算：单脚推荐不超过 8mA，八路同时点亮也不能突破 150mA 的总和上限。"
          + "蓝色和白色 LED 的 VF 约 3.0V，与 3.3V 只差 0.3V，此时电流几乎完全由 VF 的离散决定："
          + "算出来 60Ω 的电阻，换一颗 VF 低 0.2V 的灯珠电流就翻倍。这类灯要么用 5V 供电，要么用三极管恒流/限流。",
        en: "Direct-drive budget: keep each pin at or below 8mA and the whole device under 150mA. Blue and white "
          + "LEDs drop about 3.0V, leaving only 0.3V across the resistor, so current is dominated by VF spread — "
          + "a 60Ω resistor can double its current with a 0.2V lower VF part. Use 5V or a transistor there."
      },
      {
        kind: "formula",
        expr: "R_B = (Vpin − VBE) × hFE / I_load",
        note: {
          zh: "VBE 取 0.7V。hFE 要用数据手册的最小值而不是典型值，再除以 2-5 的过驱动系数保证饱和："
            + "驱动 100mA 负载、hFE(min) = 100 时，取 5 倍余量得到 IB ≈ 5mA，R_B = (3.3 − 0.7) × 100 / (5 × 0.1) ≈ 5.2kΩ。",
          en: "Use VBE ≈ 0.7V, the minimum hFE rather than the typical, and divide by a 2-5× overdrive factor to "
            + "guarantee saturation. For a 100mA load with hFE(min) = 100 and 5× margin: IB ≈ 5mA, "
            + "R_B = (3.3 − 0.7) × 100 / (5 × 0.1) ≈ 5.2kΩ."
        }
      },
      {
        kind: "list",
        items: [
          {
            zh: "饱和判据：VCE 降到 0.2V 附近（VCE(sat)）才算开关导通，此时三极管上的功耗约 0.2V × IC。"
              + "如果实测 VCE 还有 1V 以上，说明基极电流不够，三极管在放大区发热。",
            en: "Saturation: VCE collapses to about 0.2V (VCE(sat)) and dissipation becomes 0.2V × IC. If you "
              + "measure 1V or more, base current is insufficient and the device is heating in the linear region."
          },
          {
            zh: "共射开关接法：发射极接地，负载接在集电极与 VDD 之间；负载放在发射极侧会变成射极跟随器，"
              + "输出电压被 VBE 拉低且无法饱和。",
            en: "Common-emitter switch: emitter to ground, load between collector and VDD. Putting the load in the "
              + "emitter makes an emitter follower that never saturates and loses a VBE of swing."
          },
          {
            zh: "感性负载（继电器线圈、直流电机、蜂鸣器）必须反并联续流二极管，阴极接 VDD 侧、阳极接集电极，"
              + "否则关断瞬间的反电动势会击穿三极管。小信号场合用 1N4148，较大电流用 1N5819 这类肖特基。",
            en: "Inductive loads (relay coils, motors, buzzers) need a flyback diode across them, cathode to VDD "
              + "and anode to the collector, or the switch-off spike destroys the transistor. 1N4148 for small "
              + "coils, a Schottky like 1N5819 for larger currents."
          },
          {
            zh: "有源蜂鸣器接直流就响，无源蜂鸣器需要 PWM 方波驱动；无源蜂鸣器的线圈同样属于感性负载。",
            en: "An active buzzer sounds on DC; a passive buzzer needs a PWM square wave, and its coil is still an "
              + "inductive load."
          }
        ]
      },
      {
        kind: "warn",
        zh: "LED 必须串限流电阻。把 LED 直接接在 3.3V/5V 与引脚之间，正向电流只受引脚内阻限制，"
          + "会在几十毫秒内同时烧掉 LED 和这一路 GPIO 驱动器。",
        en: "An LED always needs a series resistor. Wiring it straight between a rail and a pin leaves only the "
          + "pin resistance to limit current, which destroys the LED and the GPIO driver in milliseconds."
      }
    ],
    refs: [
      { page: 26, title: "LED和蜂鸣器简介" },
      { page: 27, title: "硬件电路" },
      { page: 73, title: "硬件电路" }
    ],
    related: {
      workflows: ["wf.gpio-output"],
      functions: ["hal.gpio.writepin", "hal.gpio.togglepin"]
    }
  },

  {
    id: "timer-pwm",
    p: "tim",
    icon: "pulse",
    title: { zh: "定时器时基与 PWM 参数计算", en: "Timer time base and PWM maths" },
    summary: {
      zh: "C8T6 的四个定时器、时基频率与占空比公式，以及舵机 20ms 周期的取值。",
      en: "The four timers on the C8T6, the time-base and duty formulas, and servo settings at a 20ms period."
    },
    blocks: [
      {
        kind: "p",
        zh: "F103C8T6 只有四个定时器：TIM1 是高级定时器，TIM2/TIM3/TIM4 是通用定时器，各自带 4 个独立通道。"
          + "没有基本定时器 TIM6/TIM7，也没有 TIM8。高级定时器多出互补输出、死区和刹车输入，"
          + "TIM1 的三个通道还各有互补引脚，适合驱动半桥。",
        en: "The F103C8T6 has four timers: TIM1 is advanced, TIM2/TIM3/TIM4 are general purpose, each with four "
          + "channels. There is no basic TIM6/TIM7 and no TIM8. The advanced timer adds complementary outputs, "
          + "dead time and break input, which suits half-bridge driving."
      },
      {
        kind: "list",
        items: [
          {
            zh: "时基单元由三部分组成：预分频器 PSC 把时钟降速，计数器 CNT 在 0 到 ARR 之间循环，自动重装器 ARR 决定周期。",
            en: "The time base has three parts: the prescaler PSC divides the clock, CNT counts between 0 and ARR, "
              + "and the auto-reload register ARR sets the period."
          },
          {
            zh: "时钟来源：TIM1 挂 APB2（72MHz），TIM2/3/4 挂 APB1。APB1 分频系数不为 1 时，定时器时钟会自动 ×2，"
              + "所以 APB1 = 36MHz 时定时器同样是 72MHz，这一点最容易算错。",
            en: "Clock source: TIM1 on APB2 (72MHz), TIM2/3/4 on APB1. When the APB1 divider is not 1 the timer "
              + "clock is doubled, so APB1 = 36MHz still feeds the timers at 72MHz — the usual source of error."
          },
          {
            zh: "输出比较共 8 种模式（冻结、匹配置有效、匹配置无效、匹配翻转、强制有效、强制无效、PWM1、PWM2），"
              + "调光调速基本只用 PWM 模式 1：向上计数时 CNT < CCR 输出有效电平。",
            en: "Output compare offers eight modes (frozen, force active, force inactive, toggle, forced, PWM1, "
              + "PWM2). Dimming and speed control almost always use PWM mode 1: CNT < CCR means active level."
          }
        ]
      },
      {
        kind: "formula",
        expr: "CK_CNT = CK_PSC / (PSC + 1)",
        note: {
          zh: "CNT 的计数频率。72MHz、PSC = 71 时 CK_CNT = 1MHz，即每 1µs 计一个数，这是最好用的基准刻度。",
          en: "The counting frequency: 72MHz with PSC = 71 gives 1MHz, i.e. one count per microsecond — the "
            + "handiest working scale."
        }
      },
      {
        kind: "formula",
        expr: "Freq = CK_PSC / (PSC + 1) / (ARR + 1)　　Duty = CCR / (ARR + 1)　　Reso = 1 / (ARR + 1)",
        note: {
          zh: "三个参数互相牵制：要频率高就得压小 ARR，占空比分辨率随之变差。1kHz、分辨率 1% 需要 ARR = 99，"
            + "配 PSC = 719 得到 72MHz / 720 / 100 = 1kHz。PWM 模式下 CCR 取 0 输出恒低，取 ARR+1 输出恒高。",
          en: "The three trade off: higher frequency forces a smaller ARR and coarser duty resolution. 1kHz at 1% "
            + "needs ARR = 99 with PSC = 719 (72MHz / 720 / 100). In PWM mode CCR = 0 is permanently low and "
            + "CCR = ARR + 1 is permanently high."
        }
      },
      {
        kind: "formula",
        expr: "ARR = T_period / t_tick − 1，PSC = f_tim / f_tick − 1",
        note: {
          zh: "舵机要 20ms 周期、0.5-2.5ms 脉宽：取 f_tick = 1MHz（PSC = 71）、ARR = 19999，"
            + "则 CCR = 500 对应 0.5ms，CCR = 2500 对应 2.5ms，对应 0° 到 180°（具体角度范围以舵机手册为准）。",
          en: "A servo wants a 20ms period with 0.5-2.5ms pulses: f_tick = 1MHz (PSC = 71) and ARR = 19999 give "
            + "CCR 500 for 0.5ms and CCR 2500 for 2.5ms, roughly 0-180° (check the servo datasheet)."
        }
      },
      {
        kind: "list",
        items: [
          {
            zh: "配置顺序：开定时器时钟 → 填 PSC/ARR/计数方向 → 选 PWM 模式 1 与输出极性 → 配置 <code>CCMRx</code> 的 "
              + "<code>OCxM</code> → 置 <code>CCER</code> 的 <code>CCxE</code> → 启动计数器。",
            en: "Configure in order: enable the timer clock, set PSC/ARR/direction, choose PWM mode 1 and polarity, "
              + "set <code>OCxM</code> in <code>CCMRx</code>, set <code>CCxE</code> in <code>CCER</code>, then start."
          },
          {
            zh: "对应引脚必须配成复用推挽输出，配成普通推挽输出时波形出不来——定时器确实在跑，但信号没接到引脚上。",
            en: "The pin must be alternate push-pull. A plain push-pull pin produces no waveform: the timer runs, "
              + "but the signal never reaches the pad."
          },
          {
            zh: "高级定时器多一步：使能 <code>BDTR.MOE</code> 主输出。漏掉它，所有通道都是静默的。",
            en: "The advanced timer needs one more step: set <code>BDTR.MOE</code>. Without it every channel stays "
              + "silent."
          }
        ]
      },
      {
        kind: "warn",
        zh: "TIM1 配置全部正确却没有波形，九成是没开 <code>BDTR.MOE</code>；通用定时器没有这一位，"
          + "所以从 TIM2 换到 TIM1 时最容易踩。反过来，TIM1 的互补输出也不能同时当普通 GPIO 用。",
        en: "TIM1 producing nothing despite a correct setup is almost always a missing <code>BDTR.MOE</code>. "
          + "General-purpose timers have no such bit, so moving code from TIM2 to TIM1 trips on it. Its "
          + "complementary pins also stop being plain GPIO."
      }
    ],
    refs: [
      { page: 53, title: "定时器类型" },
      { page: 62, title: "RCC时钟树" },
      { page: 64, title: "PWM简介" },
      { page: 69, title: "参数计算" },
      { page: 70, title: "舵机简介" }
    ],
    related: {
      workflows: ["wf.tim-pwm", "wf.tim-irq"],
      functions: ["hal.tim.pwmconfigchannel", "hal.tim.setcompare", "hal.tim.pwmstart"]
    }
  },

  {
    id: "adc-basics",
    p: "adc",
    icon: "activity",
    title: { zh: "ADC 原理、量化与采样时间", en: "ADC principle, quantisation and sampling time" },
    summary: {
      zh: "逐次逼近、12 位量化、转换时间构成与源阻抗要求的采样时间下限。",
      en: "Successive approximation, 12-bit quantisation, conversion time and the sampling time a source needs."
    },
    blocks: [
      {
        kind: "p",
        zh: "STM32 的 ADC 是 12 位逐次逼近型：内部电容阵列从最高位开始逐位试探，先假设一半量程，比较后再修正下一位，"
          + "12 次比较后得到结果。F103C8T6 有 ADC1 和 ADC2，共用 10 个外部输入通道，转换结果范围 0-4095。",
        en: "The STM32 ADC is a 12-bit successive-approximation converter: a capacitor array tests from the MSB "
          + "down, tentatively setting each bit and keeping it if the comparator agrees, so 12 comparisons give the "
          + "result. The F103C8T6 has ADC1 and ADC2 sharing 10 external channels, output range 0-4095."
      },
      {
        kind: "formula",
        expr: "码值 = Vin / Vref × 4096（结果饱和到 4095），LSB = Vref / 4096",
        note: {
          zh: "Vref 就是 VDDA，3.3V 时 LSB = 3.3 / 4096 ≈ 0.806mV，即 1 个码值代表 0.8mV。"
            + "Vin 超过 Vref 时输出停在 4095，不会溢出；Vin 为 0 时输出 0。反推电压：Vin = 码值 × 3.3 / 4096。",
          en: "Vref is VDDA. At 3.3V one LSB is 3.3 / 4096 ≈ 0.806mV. Over-range input clamps at 4095 rather than "
            + "wrapping. Inverse: Vin = code × 3.3 / 4096."
        }
      },
      {
        kind: "formula",
        expr: "TCONV = 采样时间 + 12.5 个 ADC 周期",
        note: {
          zh: "采样时间是可编程的 1.5/7.5/13.5/28.5/41.5/55.5/71.5/239.5 个周期，12.5 是逐次逼近的固定开销。"
            + "ADCCLK 不得超过 14MHz，在 14MHz 下取 1.5 周期采样，TCONV = 14 个周期 = 1µs，正好是教程里的 1µs 指标。",
          en: "Sampling time is programmable (1.5, 7.5, 13.5, 28.5, 41.5, 55.5, 71.5, 239.5 cycles) and 12.5 "
            + "cycles is the fixed approximation cost. ADCCLK must stay at or below 14MHz, where 1.5 cycles of "
            + "sampling gives TCONV = 14 cycles = 1µs."
        }
      },
      {
        kind: "formula",
        expr: "Ts ≥ (RADC + RAIN) × CADC × ln(2^14)",
        note: {
          zh: "采样电容必须在采样窗口内充到 12 位精度，ln(2^14) ≈ 9.7 是所需的 14 个时间常数。按 CADC ≈ 8pF、"
            + "RADC ≈ 1kΩ 估算：源阻抗 10kΩ 时需要 Ts ≥ 11kΩ × 8pF × 9.7 ≈ 0.85µs，即 14MHz 下约 12 个周期，"
            + "应选 13.5 或更大（7.5 不够）。这是估算值，实际以数据手册的允许源阻抗表为准。",
          en: "The sampling capacitor must charge to 12-bit accuracy within the window, and ln(2^14) ≈ 9.7 is the "
            + "needed time-constant count. With CADC ≈ 8pF and RADC ≈ 1kΩ, a 10kΩ source needs "
            + "Ts ≥ 11kΩ × 8pF × 9.7 ≈ 0.85µs, i.e. at least 13 cycles at 14MHz, so pick 13.5 or longer. This is "
            + "an estimate; the datasheet allowed-source-impedance table governs."
        }
      },
      {
        kind: "list",
        items: [
          {
            zh: "数据对齐：右对齐（默认）时结果在低 12 位，取值就是 0-4095；左对齐时结果在高 12 位，"
              + "读高字节即可丢掉 4 位精度换速度。除特殊需求外一律用右对齐。",
            en: "Alignment: right-aligned (default) puts the result in bits 11..0 as 0-4095; left-aligned puts it in "
              + "the high bits so reading the high byte trades 4 bits of precision for speed. Use right alignment "
              + "unless you have a reason."
          },
          {
            zh: "校准：建议每次上电后执行一次自校准，可显著减小内部电容组离散带来的误差；"
              + "启动校准前 ADC 必须处于关电状态至少 2 个 ADC 时钟周期。",
            en: "Calibration: run the built-in self-calibration after every power-up; it largely removes the error "
              + "from capacitor-array spread. The ADC must have been powered down for at least two ADCCLK cycles "
              + "before it starts."
          },
          {
            zh: "精度相关：Vref 没有独立引脚，直接就是 VDDA，所以电源纹波会原样进入结果；"
              + "另外还有失调、增益误差和 INL，未校准的绝对精度通常在 ±2 LSB 量级。",
            en: "Accuracy: Vref is not a separate pin but VDDA, so supply ripple lands directly in the result. "
              + "Offset, gain error and INL also apply; uncalibrated absolute accuracy is typically a couple of LSB."
          },
          {
            zh: "多通道扫描配 DMA 时，ADC 在规则组里按序列依次转换，DMA 把每个结果搬到内存数组；"
              + "只测一路时直接用轮询读 EOC 标志更简单。",
            en: "In multi-channel scan mode the regular group converts in sequence and DMA moves each result into "
              + "an array. For a single channel, polling the EOC flag is simpler."
          }
        ]
      },
      {
        kind: "warn",
        zh: "ADC 引脚配置成模拟输入后，不要再开内部上拉、也不要让它被外部上拉；同理，VDDA 悬空或用 5V 供电，"
          + "所有读数都会系统性偏移或直接满量程。先量 VDDA 是不是 3.3V，再怀疑代码。",
        en: "Once a pin is an analog input, never enable its internal pull-up or let an external one load it. "
          + "Equally, a floating or 5V VDDA skews or saturates every reading. Measure VDDA before blaming code."
      }
    ],
    refs: [
      { page: 86, title: "ADC简介" },
      { page: 87, title: "逐次逼近型ADC" },
      { page: 96, title: "数据对齐" },
      { page: 97, title: "转换时间" },
      { page: 98, title: "校准" }
    ],
    related: {
      workflows: ["wf.adc-poll", "wf.adc-dma"],
      functions: ["hal.adc.calibration", "hal.adc.pollforconversion", "hal.adc.getvalue"]
    }
  },

  {
    id: "usart-frame",
    p: "usart",
    icon: "arrows",
    title: { zh: "串口帧结构与波特率误差", en: "UART framing and baud-rate error" },
    summary: {
      zh: "8N1 的十位帧、位宽与波特率换算，以及两端误差的容忍范围。",
      en: "The ten-bit 8N1 frame, bit width versus baud rate, and how much clock error the link tolerates."
    },
    blocks: [
      {
        kind: "p",
        zh: "异步串口没有时钟线，收发双方靠各自的波特率在约定时刻采样，所以帧格式和时钟精度必须事先一致。"
          + "8N1 是最常见的组合：8 个数据位、无校验、1 个停止位，加上起始位一共 10 位。",
        en: "An asynchronous UART has no clock line: both ends sample at agreed instants derived from their own "
          + "baud rate, so frame format and clock accuracy must match. 8N1 means 8 data bits, no parity, one stop "
          + "bit, plus the start bit — 10 bits per frame."
      },
      {
        kind: "list",
        items: [
          {
            zh: "起始位固定为低电平，接收端检测到下降沿后开始计时；停止位固定为高电平，用来隔开相邻两帧。",
            en: "The start bit is always low: the receiver times from the falling edge. The stop bit is always "
              + "high and separates consecutive frames."
          },
          {
            zh: "数据位低位先行（LSB first）。发 0x55 得到 1-0-1-0-1-0-1-0 的规律方波，示波器上一眼就能对上，适合做自检。",
            en: "Data is sent LSB first. Sending 0x55 yields a 1-0-1-0 pattern that is easy to eyeball on a scope "
              + "— a good self-test."
          },
          {
            zh: "校验位可选无/奇/偶；停止位可配 0.5/1/1.5/2 位。两端设置必须完全一致，否则整帧判错。",
            en: "Parity is optional (none, odd, even) and the stop bit can be 0.5, 1, 1.5 or 2 bits. Both ends "
              + "must agree exactly or every frame is rejected."
          }
        ]
      },
      {
        kind: "formula",
        expr: "T_bit = 1 / baud，9600 时 T_bit ≈ 104.17 µs，一帧 10 位 ≈ 1.04 ms",
        note: {
          zh: "这是纯理论值，接收端在第 8、9、10 个采样时钟处做三取二判决，所以真正的采样点在位中心附近。"
            + "115200 时 T_bit ≈ 8.68µs，一帧 10 位约 86.8µs。",
          en: "Ideal values: at 115200 one bit is ≈8.68µs and a 10-bit frame ≈86.8µs. The receiver takes a "
            + "majority vote of samples 8, 9 and 10, so the effective sample point sits near the bit centre."
        }
      },
      {
        kind: "formula",
        expr: "USARTDIV = fPCLK / (16 × baud)，BRR = 整数部分 << 4 | round(小数部分 × 16)",
        note: {
          zh: "APB2 上 72MHz、115200 波特率：USARTDIV = 72e6 / (16 × 115200) = 39.0625，整数 39、小数 0.0625 × 16 = 1，"
            + "BRR = 0x271，误差为 0。9600 时 USARTDIV = 468.75，BRR = 0x1D4C，同样整除。"
            + "分数分频就是 16 倍过采样带来的 1/16 分辨率。",
          en: "At 72MHz on APB2 and 115200 baud: USARTDIV = 39.0625, so mantissa 39 and fraction 0.0625 × 16 = 1, "
            + "BRR = 0x271 with zero error. At 9600, USARTDIV = 468.75 and BRR = 0x1D4C. The fractional divider is "
            + "the 1/16 resolution that 16× oversampling provides."
        }
      },
      {
        kind: "list",
        items: [
          {
            zh: "误差容忍：收发两端误差叠加后，最后一位停止位的采样点仍要落在位宽中心附近，理论上总误差要小于半个位宽，"
              + "工程上把两端各自的误差控制在 2-3% 以内，长连线和高速率再收紧。",
            en: "Tolerance: after both ends' errors accumulate, the stop-bit sample point must still land near the "
              + "bit centre. Total error must stay inside half a bit in theory; keep each end within 2-3% in "
              + "practice, tighter for long cables and high baud rates."
          },
          {
            zh: "内部 RC 振荡器（HSI）的偏差可达 ±1% 以上，且随温度漂移，所以可靠串口要用 HSE 晶振做时钟源。",
            en: "The internal RC oscillator (HSI) can be off by more than ±1% and drifts with temperature, so a "
              + "reliable link should run from the HSE crystal."
          },
          {
            zh: "用 STM32 与 USB 转串口芯片通信时，通常一侧误差很小、另一侧偏差较大，"
              + "表现为偶发单字节错误而不是彻底不通——这种症状优先怀疑波特率误差，不是代码。",
            en: "When one end (say a USB-UART bridge) is precise and the other is not, the symptom is occasional "
              + "single-byte corruption rather than total failure. Suspect baud error before suspecting code."
          }
        ]
      },
      {
        kind: "warn",
        zh: "最常见的三个接线错误：TX 接 TX 而没有交叉、两端没有共地、把 RS232 的 ±12V 直接接到 3.3V 的 TTL 引脚。"
          + "前两个表现为完全没数据或乱码，第三个会直接烧掉引脚。",
        en: "The three classic wiring faults: TX wired to TX instead of crossed, no common ground, and RS232's "
          + "±12V fed straight into a 3.3V TTL pin. The first two show up as silence or garbage; the third "
          + "destroys the pin."
      }
    ],
    refs: [
      { page: 110, title: "硬件电路" },
      { page: 111, title: "电平标准" },
      { page: 112, title: "串口参数及时序" },
      { page: 113, title: "串口时序" },
      { page: 121, title: "波特率发生器" }
    ],
    related: {
      workflows: ["wf.usart-poll", "wf.usart-irq", "wf.dma-usart"],
      functions: ["hal.usart.init", "hal.usart.transmit", "hal.usart.receive_it"]
    }
  }
];

export const KB_MAP = Object.fromEntries(KB_ARTICLES.map(a => [a.id, a]));
