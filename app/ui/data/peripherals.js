export const PERIPHERALS = [
  {
    id: "gpio", short: "GPIO", icon: "pin", accent: "#22C55E",
    zh: "通用输入输出", en: "General-purpose I/O",
    descZh: "引脚方向、上下拉、速度与复用配置，是全部外设的起点。",
    descEn: "Pin direction, pull, speed and alternate function setup — the starting point of every peripheral."
  },
  {
    id: "rcc", short: "RCC", icon: "clock", accent: "#38BDF8",
    zh: "复位与时钟", en: "Reset & clock control",
    descZh: "使能外设时钟、配置 HSE/PLL 与总线分频，决定系统主频。",
    descEn: "Enable peripheral clocks, configure HSE/PLL and bus dividers that set the core frequency."
  },
  {
    id: "nvic", short: "NVIC", icon: "layers", accent: "#A78BFA",
    zh: "中断控制器", en: "Nested vector interrupt controller",
    descZh: "中断优先级分组、抢占与子优先级、使能指定 IRQ 通道。",
    descEn: "Priority grouping, preemption and sub-priority, enabling individual IRQ channels."
  },
  {
    id: "exti", short: "EXTI", icon: "zap", accent: "#FB7185",
    zh: "外部中断", en: "External interrupt",
    descZh: "把引脚电平变化映射为中断线，用于按键、编码器与唤醒。",
    descEn: "Map pin edges to interrupt lines for buttons, encoders and wake-up events."
  },
  {
    id: "usart", short: "USART", icon: "arrows", accent: "#F59E0B",
    zh: "串口通信", en: "Serial communication",
    descZh: "异步串口收发、中断与 DMA 传输，调试输出与模块通信的主力。",
    descEn: "Asynchronous serial TX/RX with polling, interrupt or DMA — the workhorse for debug and modules."
  },
  {
    id: "tim", short: "TIM", icon: "pulse", accent: "#F472B6",
    zh: "定时器", en: "Timers",
    descZh: "时基、PWM、输入捕获与编码器接口，用于计时、调光与测频。",
    descEn: "Time base, PWM, input capture and encoder modes for delays, dimming and frequency measurement."
  },
  {
    id: "adc", short: "ADC", icon: "activity", accent: "#2DD4BF",
    zh: "模数转换", en: "Analog to digital converter",
    descZh: "采样电压、轮询或 DMA 多通道扫描，注意参考电压与采样时间。",
    descEn: "Sample voltages in polling or DMA scan mode; watch reference voltage and sampling time."
  },
  {
    id: "dac", short: "DAC", icon: "wave", accent: "#C084FC",
    zh: "数模转换", en: "Digital to analog converter",
    descZh: "输出模拟电压或波形，可配合 DMA 与定时器生成任意信号。",
    descEn: "Output analog voltages or waveforms, optionally driven by DMA and a timer."
  },
  {
    id: "spi", short: "SPI", icon: "chip", accent: "#60A5FA",
    zh: "SPI 总线", en: "SPI bus",
    descZh: "全双工高速同步总线，用于 Flash、屏幕与传感器，注意 CPOL/CPHA。",
    descEn: "Full-duplex high-speed synchronous bus for flash, displays and sensors; mind CPOL/CPHA."
  },
  {
    id: "i2c", short: "I2C", icon: "share", accent: "#FCD34D",
    zh: "I2C 总线", en: "I2C bus",
    descZh: "两线制总线，读写寄存器型传感器与 EEPROM，注意上拉与时钟延展。",
    descEn: "Two-wire bus for register-based sensors and EEPROM; mind pull-ups and clock stretching."
  },
  {
    id: "dma", short: "DMA", icon: "shuffle", accent: "#34D399",
    zh: "直接存储器访问", en: "Direct memory access",
    descZh: "外设与内存之间搬运数据，解放 CPU，适合串口、ADC 与 SPI 大数据量。",
    descEn: "Move data between peripherals and memory without the CPU — ideal for UART, ADC and SPI bursts."
  },
  {
    id: "iwdg", short: "IWDG", icon: "shield", accent: "#F87171",
    zh: "独立看门狗", en: "Independent watchdog",
    descZh: "由独立 LSI 驱动的复位定时器，主循环卡死时强制重启系统。",
    descEn: "LSI-driven reset timer that reboots the MCU when the main loop stalls."
  },
  {
    id: "rtc", short: "RTC", icon: "calendar", accent: "#93C5FD",
    zh: "实时时钟", en: "Real-time clock",
    descZh: "掉电走时的日历与闹钟，配合备份域与 LSE 晶振使用。",
    descEn: "Battery-backed calendar and alarms running from the backup domain and LSE crystal."
  },
  {
    id: "flash", short: "FLASH", icon: "drive", accent: "#FBBF24",
    zh: "片内 Flash", en: "On-chip flash",
    descZh: "擦写内部 Flash 保存参数与升级固件，注意页大小与等待周期。",
    descEn: "Erase and program internal flash to store parameters or firmware; mind page size and latency."
  }
];

export const PERIPH_MAP = Object.fromEntries(PERIPHERALS.map(p => [p.id, p]));
