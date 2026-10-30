import { fn } from "./util.js";

/* DMA · IWDG · RTC · FLASH */
export const MEMORY = [

  /* ---------------- DMA · SPL ---------------- */
  fn({
    id: "std.dma.init", lib: "std", p: "dma", n: "DMA_Init",
    sig: "void DMA_Init(DMA_Channel_TypeDef* DMAy_Channelx, DMA_InitTypeDef* DMA_InitStruct);",
    zh: "配置外设/内存地址、传输方向、数据宽度、地址自增与优先级。通道与请求源必须匹配。",
    en: "Configure addresses, direction, data width, increment and priority; the channel must match the peripheral request.",
    params: [
      ["DMAy_Channelx", "如 DMA1_Channel4", "e.g. DMA1_Channel4"],
      ["DMA_InitStruct", "成员：PeripheralBaseAddr、MemoryBaseAddr、DIR、BufferSize、PeriphInc、MemInc、Mode、Priority", "Members: addresses, direction, size, increments, mode, priority"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_dma.h",
    eq: "hal.dma.link",
    rel: ["std.rcc.ahbclockcmd", "std.dma.cmd", "std.usart.init"],
    tags: ["dma", "初始化", "init", "通道", "channel"]
  }),
  fn({
    id: "std.dma.cmd", lib: "std", p: "dma", n: "DMA_Cmd",
    sig: "void DMA_Cmd(DMA_Channel_TypeDef* DMAy_Channelx, FunctionalState NewState);",
    zh: "使能 DMA 通道，使能瞬间即开始搬运（软件触发模式下）。",
    en: "Enable the DMA channel; in software-trigger mode transfers start immediately.",
    params: [
      ["DMAy_Channelx", "DMA 通道", "DMA channel"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_dma.h",
    eq: "hal.dma.start",
    rel: ["std.dma.init", "std.dma.getflagstatus"],
    tags: ["使能", "enable", "dma"]
  }),
  fn({
    id: "std.dma.itconfig", lib: "std", p: "dma", n: "DMA_ITConfig",
    sig: "void DMA_ITConfig(DMA_Channel_TypeDef* DMAy_Channelx, uint32_t DMA_IT, FunctionalState NewState);",
    zh: "使能传输完成、半传输或错误中断，还需在 NVIC 中打开 DMA 通道 IRQ。",
    en: "Enable transfer-complete, half-transfer or error interrupts; also enable the DMA IRQ in the NVIC.",
    params: [
      ["DMAy_Channelx", "DMA 通道", "DMA channel"],
      ["DMA_IT", "如 DMA_IT_TC", "e.g. DMA_IT_TC"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_dma.h",
    rel: ["std.nvic.init", "std.dma.clearflag"],
    tags: ["中断", "it", "tc", "dma"]
  }),
  fn({
    id: "std.dma.getflagstatus", lib: "std", p: "dma", n: "DMA_GetFlagStatus",
    sig: "FlagStatus DMA_GetFlagStatus(uint32_t DMAy_FLAG);",
    zh: "查询传输完成、半传输与错误标志，例如 DMA1_FLAG_TC4。",
    en: "Check transfer-complete, half-transfer and error flags, e.g. DMA1_FLAG_TC4.",
    params: [["DMAy_FLAG", "如 DMA1_FLAG_TC4", "e.g. DMA1_FLAG_TC4"]],
    ret: ["SET / RESET", "SET / RESET"],
    hdr: "stm32f10x_dma.h",
    rel: ["std.dma.clearflag", "std.dma.itconfig"],
    tags: ["标志", "flag", "tc", "dma"]
  }),
  fn({
    id: "std.dma.clearflag", lib: "std", p: "dma", n: "DMA_ClearFlag",
    sig: "void DMA_ClearFlag(uint32_t DMAy_FLAG);",
    zh: "清除 DMA 标志；在中断中处理完数据后必须清除，否则会持续触发。",
    en: "Clear DMA flags after handling the data, otherwise the interrupt keeps firing.",
    params: [["DMAy_FLAG", "标志宏", "Flag macro"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_dma.h",
    rel: ["std.dma.getflagstatus"],
    tags: ["清除", "flag", "clear", "dma"]
  }),

  /* ---------------- DMA · HAL ---------------- */
  fn({
    id: "hal.dma.start", lib: "hal", p: "dma", n: "HAL_DMA_Start",
    sig: "HAL_StatusTypeDef HAL_DMA_Start(DMA_HandleTypeDef *hdma, uint32_t SrcAddress, uint32_t DstAddress, uint32_t DataLength);",
    zh: "以轮询方式启动 DMA 搬运；完成后需自行查询状态。多数场景改用外设的 DMA 接口。",
    en: "Start a DMA transfer in polling mode; most applications instead use a peripheral's DMA API.",
    params: [
      ["hdma", "DMA 句柄", "DMA handle"],
      ["SrcAddress", "源地址", "Source address"],
      ["DstAddress", "目的地址", "Destination address"],
      ["DataLength", "传输个数", "Number of items"]
    ],
    ret: ["HAL_OK / HAL_ERROR / HAL_BUSY", "HAL_OK / HAL_ERROR / HAL_BUSY"],
    hdr: "stm32f1xx_hal_dma.h",
    eq: "std.dma.cmd",
    rel: ["hal.dma.start_it", "hal.dma.link"],
    tags: ["dma", "启动", "start", "轮询"]
  }),
  fn({
    id: "hal.dma.start_it", lib: "hal", p: "dma", n: "HAL_DMA_Start_IT",
    sig: "HAL_StatusTypeDef HAL_DMA_Start_IT(DMA_HandleTypeDef *hdma, uint32_t SrcAddress, uint32_t DstAddress, uint32_t DataLength);",
    zh: "中断方式启动 DMA，完成后回调 XferCpltCallback；HAL 外设的 DMA 接口内部会调用它。",
    en: "Start DMA in interrupt mode; XferCpltCallback fires when done — peripheral DMA APIs call this internally.",
    params: [
      ["hdma", "DMA 句柄", "DMA handle"],
      ["SrcAddress", "源地址", "Source address"],
      ["DstAddress", "目的地址", "Destination address"],
      ["DataLength", "传输个数", "Number of items"]
    ],
    ret: ["HAL_OK / HAL_ERROR / HAL_BUSY", "HAL_OK / HAL_ERROR / HAL_BUSY"],
    hdr: "stm32f1xx_hal_dma.h",
    eq: "std.dma.itconfig",
    rel: ["hal.dma.irqhandler", "hal.dma.abort"],
    tags: ["dma", "中断", "it", "完成回调"]
  }),
  fn({
    id: "hal.dma.link", lib: "hal", p: "dma", n: "__HAL_LINKDMA",
    macro: true,
    sig: "__HAL_LINKDMA(&huart1, hdmatx, hdma_usart1_tx);",
    zh: "把 DMA 句柄绑定到外设句柄的字段上；MspInit 中调用后，HAL 外设才能自动触发 DMA。",
    en: "Bind a DMA handle to a peripheral handle field; after MspInit links it, HAL peripheral DMA calls work.",
    params: [
      ["__HANDLE__", "外设句柄地址", "Peripheral handle pointer"],
      ["__PPP_DMA_FIELD__", "如 hdmatx / hdmarx", "e.g. hdmatx / hdmarx"],
      ["__DMA_HANDLE__", "DMA 句柄", "DMA handle"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_dma.h",
    eq: "std.dma.init",
    rel: ["hal.usart.transmit_it", "hal.adc.start_dma"],
    tags: ["绑定", "link", "dma", "msp", "macro"]
  }),
  fn({
    id: "hal.dma.irqhandler", lib: "hal", p: "dma", n: "HAL_DMA_IRQHandler",
    sig: "void HAL_DMA_IRQHandler(DMA_HandleTypeDef *hdma);",
    zh: "在 DMAx_ChannelY_IRQHandler 中调用，处理完成/半传输/错误并分发回调。",
    en: "Call from DMAx_ChannelY_IRQHandler; handles complete/half/error events and dispatches callbacks.",
    params: [["hdma", "DMA 句柄", "DMA handle"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_dma.h",
    rel: ["hal.dma.start_it", "hal.dma.abort"],
    tags: ["中断服务", "isr", "dma"]
  }),
  fn({
    id: "hal.dma.abort", lib: "hal", p: "dma", n: "HAL_DMA_Abort",
    sig: "HAL_StatusTypeDef HAL_DMA_Abort(DMA_HandleTypeDef *hdma);",
    zh: "中止正在进行的 DMA 传输，重新配置缓冲区或进入停机前使用。",
    en: "Abort an ongoing transfer before reconfiguring buffers or entering a low-power state.",
    params: [["hdma", "DMA 句柄", "DMA handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_dma.h",
    eq: "std.dma.cmd",
    rel: ["hal.dma.start", "hal.dma.irqhandler"],
    tags: ["中止", "abort", "dma"]
  }),

  /* ---------------- IWDG ---------------- */
  fn({
    id: "std.iwdg.writeaccess", lib: "std", p: "iwdg", n: "IWDG_WriteAccessCmd",
    sig: "void IWDG_WriteAccessCmd(uint16_t IWDG_WriteAccess);",
    zh: "打开 IWDG 寄存器写保护（IWDG_WriteAccess_Enable），否则后续配置无效。",
    en: "Unlock the IWDG registers (IWDG_WriteAccess_Enable); without it the following writes are ignored.",
    params: [["IWDG_WriteAccess", "IWDG_WriteAccess_Enable / Disable", "IWDG_WriteAccess_Enable / Disable"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_iwdg.h",
    rel: ["std.iwdg.setprescaler", "std.iwdg.enable"],
    tags: ["看门狗", "iwdg", "解锁", "unlock"]
  }),
  fn({
    id: "std.iwdg.setprescaler", lib: "std", p: "iwdg", n: "IWDG_SetPrescaler",
    sig: "void IWDG_SetPrescaler(uint8_t IWDG_Prescaler);",
    zh: "设置 LSI 分频（4~256），与重装值共同决定溢出时间。",
    en: "Set the LSI divider (4-256); together with the reload value it defines the timeout.",
    params: [["IWDG_Prescaler", "IWDG_Prescaler_4 ~ _256", "IWDG_Prescaler_4 to _256"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_iwdg.h",
    rel: ["std.iwdg.setreload", "std.iwdg.reload"],
    tags: ["分频", "prescaler", "iwdg", "超时"]
  }),
  fn({
    id: "std.iwdg.setreload", lib: "std", p: "iwdg", n: "IWDG_SetReload",
    sig: "void IWDG_SetReload(uint16_t Reload);",
    zh: "设置重装值（12 位），溢出时间 ≈ (4 × 2^prescaler × Reload) / 40 kHz。",
    en: "Set the 12-bit reload value; timeout ≈ (4 × 2^prescaler × Reload) / 40 kHz.",
    params: [["Reload", "0 ~ 4095", "0 to 4095"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_iwdg.h",
    rel: ["std.iwdg.setprescaler", "std.iwdg.enable"],
    tags: ["重装", "reload", "iwdg", "超时"]
  }),
  fn({
    id: "std.iwdg.reload", lib: "std", p: "iwdg", n: "IWDG_ReloadCounter",
    sig: "void IWDG_ReloadCounter(void);",
    zh: "喂狗：重装计数器。必须在溢出前调用，但不要在中断里盲目喂狗。",
    en: "Feed the watchdog by reloading the counter; call before timeout, but never blindly from an ISR.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f10x_iwdg.h",
    eq: "hal.iwdg.refresh",
    rel: ["std.iwdg.enable", "hal.iwdg.refresh"],
    tags: ["喂狗", "feed", "refresh", "iwdg"]
  }),
  fn({
    id: "std.iwdg.enable", lib: "std", p: "iwdg", n: "IWDG_Enable",
    sig: "void IWDG_Enable(void);",
    zh: "启动独立看门狗。一旦启动无法关闭，只能复位，调试时要留意。",
    en: "Start the IWDG. It cannot be stopped once enabled — only a reset clears it, so mind debugging.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f10x_iwdg.h",
    eq: "hal.iwdg.init",
    rel: ["std.iwdg.setreload", "std.iwdg.reload"],
    tags: ["启动", "enable", "看门狗", "watchdog"]
  }),
  fn({
    id: "hal.iwdg.init", lib: "hal", p: "iwdg", n: "HAL_IWDG_Init",
    sig: "HAL_StatusTypeDef HAL_IWDG_Init(IWDG_HandleTypeDef *hiwdg);",
    zh: "按 Prescaler 与 Reload 配置并启动 IWDG；CubeMX 生成的 MX_IWDG_Init 即调用它。",
    en: "Configure and start the IWDG from Prescaler and Reload; CubeMX's MX_IWDG_Init calls it.",
    params: [["hiwdg", "IWDG 句柄", "IWDG handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_iwdg.h",
    eq: "std.iwdg.enable",
    rel: ["hal.iwdg.refresh", "hal.rcc.clkenable"],
    tags: ["看门狗", "初始化", "init", "iwdg"]
  }),
  fn({
    id: "hal.iwdg.refresh", lib: "hal", p: "iwdg", n: "HAL_IWDG_Refresh",
    sig: "HAL_StatusTypeDef HAL_IWDG_Refresh(IWDG_HandleTypeDef *hiwdg);",
    zh: "喂狗，把计数器重装；建议放在主循环确认所有任务都健康之后。",
    en: "Feed the watchdog; place it after the main loop confirms all tasks are healthy.",
    params: [["hiwdg", "IWDG 句柄", "IWDG handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_iwdg.h",
    eq: "std.iwdg.reload",
    rel: ["hal.iwdg.init"],
    tags: ["喂狗", "refresh", "feed", "iwdg"]
  }),
  fn({
    id: "hal.iwdg.getstate", lib: "hal", p: "iwdg", n: "HAL_IWDG_GetState",
    sig: "HAL_IWDG_StateTypeDef HAL_IWDG_GetState(IWDG_HandleTypeDef *hiwdg);",
    zh: "返回 IWDG 句柄状态，调试启动流程时确认看门狗是否已运行。",
    en: "Return the IWDG handle state; confirms whether the watchdog is running while debugging.",
    params: [["hiwdg", "IWDG 句柄", "IWDG handle"]],
    ret: ["HAL_IWDG_StateTypeDef", "HAL_IWDG_StateTypeDef"],
    hdr: "stm32f1xx_hal_iwdg.h",
    rel: ["hal.iwdg.init", "hal.iwdg.refresh"],
    tags: ["状态", "state", "调试", "iwdg"]
  }),

  /* ---------------- RTC · SPL ---------------- */
  fn({
    id: "std.rtc.waitforsynchro", lib: "std", p: "rtc", n: "RTC_WaitForSynchro",
    sig: "void RTC_WaitForSynchro(void);",
    zh: "等待 RTC 寄存器与 APB1 同步，访问计数器或配置前必须调用。",
    en: "Wait until the RTC registers are synchronised with APB1; required before accessing counters.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f10x_rtc.h",
    rel: ["std.rtc.waitforlasttask", "std.rtc.getcounter"],
    tags: ["同步", "sync", "rtc"]
  }),
  fn({
    id: "std.rtc.waitforlasttask", lib: "std", p: "rtc", n: "RTC_WaitForLastTask",
    sig: "void RTC_WaitForLastTask(void);",
    zh: "等待上一次写操作完成；写 RTC 寄存器后必须调用，否则后续写入被丢弃。",
    en: "Wait for the previous write to complete; mandatory after writing RTC registers.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f10x_rtc.h",
    rel: ["std.rtc.setcounter", "std.rtc.setalarm"],
    tags: ["等待", "wait", "rtc", "写保护"]
  }),
  fn({
    id: "std.rtc.setcounter", lib: "std", p: "rtc", n: "RTC_SetCounter",
    sig: "void RTC_SetCounter(uint32_t CounterValue);",
    zh: "设置 RTC 秒计数器（Unix 时间戳），写后要等待写完成。",
    en: "Set the RTC second counter (Unix timestamp); wait for the write to finish afterwards.",
    params: [["CounterValue", "秒计数", "Seconds counter"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_rtc.h",
    eq: "hal.rtc.settime",
    rel: ["std.rtc.getcounter", "std.rtc.waitforlasttask"],
    tags: ["时间", "时间戳", "set", "rtc"]
  }),
  fn({
    id: "std.rtc.getcounter", lib: "std", p: "rtc", n: "RTC_GetCounter",
    sig: "uint32_t RTC_GetCounter(void);",
    zh: "读取当前秒计数器，转换为年月日需要自己实现（或使用库的 time 转换）。",
    en: "Read the current second counter; date conversion must be done in software.",
    params: [],
    ret: ["秒计数", "Seconds counter"],
    hdr: "stm32f10x_rtc.h",
    eq: "hal.rtc.gettime",
    rel: ["std.rtc.setcounter", "std.rtc.getdivider"],
    tags: ["时间", "读取", "get", "rtc"]
  }),
  fn({
    id: "std.rtc.getdivider", lib: "std", p: "rtc", n: "RTC_GetDivider",
    sig: "uint32_t RTC_GetDivider(void);",
    zh: "读取预分频余数，可获得亚秒精度，用于高精度时间戳。",
    en: "Read the prescaler remainder for sub-second precision in timestamps.",
    params: [],
    ret: ["分频余数", "Divider remainder"],
    hdr: "stm32f10x_rtc.h",
    rel: ["std.rtc.getcounter"],
    tags: ["亚秒", "subsecond", "rtc"]
  }),
  fn({
    id: "std.rtc.setalarm", lib: "std", p: "rtc", n: "RTC_SetAlarm",
    sig: "void RTC_SetAlarm(uint32_t AlarmValue);",
    zh: "设置闹钟秒值，计数值相等时触发闹钟中断（需配合 RTC_ITConfig 与 EXTI17）。",
    en: "Set the alarm second value; an alarm interrupt fires on match (pair with RTC_ITConfig and EXTI17).",
    params: [["AlarmValue", "闹钟秒值", "Alarm second value"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_rtc.h",
    eq: "hal.rtc.setalarm",
    rel: ["std.rtc.itconfig", "std.nvic.init"],
    tags: ["闹钟", "alarm", "rtc", "唤醒"]
  }),
  fn({
    id: "std.rtc.itconfig", lib: "std", p: "rtc", n: "RTC_ITConfig",
    sig: "void RTC_ITConfig(uint16_t RTC_IT, FunctionalState NewState);",
    zh: "使能秒中断或闹钟中断；F1 上闹钟走 EXTI17，需要在 NVIC 中使能 RTCAlarm_IRQn。",
    en: "Enable second or alarm interrupts; on F1 the alarm uses EXTI17 and RTCAlarm_IRQn.",
    params: [
      ["RTC_IT", "RTC_IT_SEC / RTC_IT_ALR", "RTC_IT_SEC / RTC_IT_ALR"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_rtc.h",
    rel: ["std.rtc.setalarm", "std.exti.init"],
    tags: ["中断", "秒中断", "alarm", "rtc"]
  }),

  /* ---------------- RTC · HAL ---------------- */
  fn({
    id: "hal.rtc.init", lib: "hal", p: "rtc", n: "HAL_RTC_Init",
    sig: "HAL_StatusTypeDef HAL_RTC_Init(RTC_HandleTypeDef *hrtc);",
    zh: "初始化 RTC 时钟源、异步/同步分频与小时制式；首次配置还会设置日期。",
    en: "Initialise clock source, async/sync prescalers and hour format; the first init also sets the date.",
    params: [["hrtc", "RTC 句柄", "RTC handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_rtc.h",
    eq: "std.rtc.itconfig",
    rel: ["hal.rcc.clkenable", "hal.rtc.settime", "hal.rtc.setdate"],
    tags: ["rtc", "初始化", "init", "lse"]
  }),
  fn({
    id: "hal.rtc.settime", lib: "hal", p: "rtc", n: "HAL_RTC_SetTime",
    sig: "HAL_StatusTypeDef HAL_RTC_SetTime(RTC_HandleTypeDef *hrtc, RTC_TimeTypeDef *sTime, uint32_t Format);",
    zh: "设置时、分、秒（可选 12/24 小时制）。写入前需先解锁备份域。",
    en: "Set hours, minutes and seconds (12/24-hour format); the backup domain must be unlocked first.",
    params: [
      ["hrtc", "RTC 句柄", "RTC handle"],
      ["sTime", "时间结构体", "Time struct"],
      ["Format", "RTC_FORMAT_BIN / BCD", "RTC_FORMAT_BIN / BCD"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_rtc.h",
    eq: "std.rtc.setcounter",
    rel: ["hal.rtc.gettime", "hal.rtc.setdate"],
    tags: ["时间", "设置", "settime", "rtc"]
  }),
  fn({
    id: "hal.rtc.gettime", lib: "hal", p: "rtc", n: "HAL_RTC_GetTime",
    sig: "HAL_StatusTypeDef HAL_RTC_GetTime(RTC_HandleTypeDef *hrtc, RTC_TimeTypeDef *sTime, uint32_t Format);",
    zh: "读取当前时间，同时把亚秒值写入 sTime->SubSeconds。",
    en: "Read the current time; the sub-second value is returned in sTime->SubSeconds.",
    params: [
      ["hrtc", "RTC 句柄", "RTC handle"],
      ["sTime", "输出时间结构体", "Output time struct"],
      ["Format", "RTC_FORMAT_BIN / BCD", "RTC_FORMAT_BIN / BCD"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_rtc.h",
    eq: "std.rtc.getcounter",
    rel: ["hal.rtc.getdate", "hal.rtc.settime"],
    tags: ["时间", "读取", "gettime", "rtc"]
  }),
  fn({
    id: "hal.rtc.setdate", lib: "hal", p: "rtc", n: "HAL_RTC_SetDate",
    sig: "HAL_StatusTypeDef HAL_RTC_SetDate(RTC_HandleTypeDef *hrtc, RTC_DateTypeDef *sDate, uint32_t Format);",
    zh: "设置年、月、日与星期，年份按 0~99 存放（需自行加 2000）。",
    en: "Set year, month, date and weekday; the year is stored as 0-99 (add 2000 in software).",
    params: [
      ["hrtc", "RTC 句柄", "RTC handle"],
      ["sDate", "日期结构体", "Date struct"],
      ["Format", "RTC_FORMAT_BIN / BCD", "RTC_FORMAT_BIN / BCD"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_rtc.h",
    eq: "std.rtc.setcounter",
    rel: ["hal.rtc.getdate", "hal.rtc.settime"],
    tags: ["日期", "date", "rtc"]
  }),
  fn({
    id: "hal.rtc.getdate", lib: "hal", p: "rtc", n: "HAL_RTC_GetDate",
    sig: "HAL_StatusTypeDef HAL_RTC_GetDate(RTC_HandleTypeDef *hrtc, RTC_DateTypeDef *sDate, uint32_t Format);",
    zh: "读取日期。读取时间后必须再读一次日期，才能解锁影子寄存器。",
    en: "Read the date; after reading the time you must read the date to unlock the shadow registers.",
    params: [
      ["hrtc", "RTC 句柄", "RTC handle"],
      ["sDate", "输出日期结构体", "Output date struct"],
      ["Format", "RTC_FORMAT_BIN / BCD", "RTC_FORMAT_BIN / BCD"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_rtc.h",
    rel: ["hal.rtc.gettime", "hal.rtc.setdate"],
    tags: ["日期", "读取", "getdate", "rtc"]
  }),
  fn({
    id: "hal.rtc.setalarm", lib: "hal", p: "rtc", n: "HAL_RTC_SetAlarm_IT",
    sig: "HAL_StatusTypeDef HAL_RTC_SetAlarm_IT(RTC_HandleTypeDef *hrtc, RTC_AlarmTypeDef *sAlarm, uint32_t Format);",
    zh: "设置闹钟并使能中断，触发后进入 HAL_RTC_AlarmAEventCallback。",
    en: "Set an alarm and enable its interrupt; HAL_RTC_AlarmAEventCallback fires on match.",
    params: [
      ["hrtc", "RTC 句柄", "RTC handle"],
      ["sAlarm", "闹钟参数（时间+掩码）", "Alarm parameters (time + masks)"],
      ["Format", "RTC_FORMAT_BIN / BCD", "RTC_FORMAT_BIN / BCD"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_rtc.h",
    eq: "std.rtc.setalarm",
    rel: ["hal.rtc.alarmcallback", "hal.nvic.enableirq"],
    tags: ["闹钟", "alarm", "中断", "唤醒"]
  }),
  fn({
    id: "hal.rtc.alarmcallback", lib: "hal", p: "rtc", n: "HAL_RTC_AlarmAEventCallback",
    sig: "__weak void HAL_RTC_AlarmAEventCallback(RTC_HandleTypeDef *hrtc);",
    zh: "闹钟 A 回调，重写它处理定时唤醒或日终任务，注意不要在里面对 RTC 长时间写入。",
    en: "Alarm A callback; override it for scheduled wake-ups. Avoid long RTC writes inside.",
    params: [["hrtc", "RTC 句柄", "RTC handle"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_rtc.h",
    rel: ["hal.rtc.setalarm", "hal.rtc.irqhandler"],
    tags: ["回调", "callback", "闹钟", "alarm"]
  }),
  fn({
    id: "hal.rtc.irqhandler", lib: "hal", p: "rtc", n: "HAL_RTC_AlarmIRQHandler",
    sig: "void HAL_RTC_AlarmIRQHandler(RTC_HandleTypeDef *hrtc);",
    zh: "在 RTC_Alarm_IRQHandler 中调用，清除标志并分发闹钟回调。",
    en: "Call from RTC_Alarm_IRQHandler; clears flags and dispatches alarm callbacks.",
    params: [["hrtc", "RTC 句柄", "RTC handle"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_rtc.h",
    rel: ["hal.rtc.setalarm", "hal.rtc.alarmcallback"],
    tags: ["中断服务", "isr", "rtc", "alarm"]
  }),

  /* ---------------- FLASH ---------------- */
  fn({
    id: "std.flash.unlock", lib: "std", p: "flash", n: "FLASH_Unlock",
    sig: "void FLASH_Unlock(void);",
    zh: "解锁 Flash 控制寄存器，擦写前必须调用，否则操作被忽略。",
    en: "Unlock the flash control registers; erase/program operations are ignored without it.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f10x_flash.h",
    eq: "hal.flash.unlock",
    rel: ["std.flash.erasepage", "std.flash.programword", "std.flash.lock"],
    tags: ["解锁", "unlock", "flash"]
  }),
  fn({
    id: "std.flash.erasepage", lib: "std", p: "flash", n: "FLASH_ErasePage",
    sig: "FLASH_Status FLASH_ErasePage(uint32_t Page_Address);",
    zh: "擦除所在页（F1 通常 1KB/2KB），擦除后整页变为 0xFF，耗时可到数十毫秒。",
    en: "Erase the page containing the address (typically 1-2 KB on F1); costs tens of milliseconds.",
    params: [["Page_Address", "页内任意地址", "Any address inside the page"]],
    ret: ["FLASH_BUSY / FLASH_ERROR_PG / FLASH_COMPLETE", "FLASH_BUSY / FLASH_ERROR_PG / FLASH_COMPLETE"],
    hdr: "stm32f10x_flash.h",
    eq: "hal.flash.erase",
    rel: ["std.flash.unlock", "std.flash.programword"],
    tags: ["擦除", "erase", "flash", "页"]
  }),
  fn({
    id: "std.flash.programword", lib: "std", p: "flash", n: "FLASH_ProgramWord",
    sig: "FLASH_Status FLASH_ProgramWord(uint32_t Address, uint32_t Data);",
    zh: "写入一个 32 位字，目标地址必须已擦除；写入前确认地址对齐。",
    en: "Program one 32-bit word; the target must be erased and properly aligned.",
    params: [
      ["Address", "目标地址（4 字节对齐）", "Target address (4-byte aligned)"],
      ["Data", "待写入数据", "Data to program"]
    ],
    ret: ["FLASH_COMPLETE / FLASH_ERROR_PG", "FLASH_COMPLETE / FLASH_ERROR_PG"],
    hdr: "stm32f10x_flash.h",
    eq: "hal.flash.program",
    rel: ["std.flash.erasepage", "std.flash.lock"],
    tags: ["写入", "program", "flash", "参数"]
  }),
  fn({
    id: "std.flash.lock", lib: "std", p: "flash", n: "FLASH_Lock",
    sig: "void FLASH_Lock(void);",
    zh: "重新锁定 Flash，防止误写；操作完成后应立即调用。",
    en: "Re-lock flash after programming to prevent accidental writes.",
    params: [],
    ret: ["无", "None"],
    hdr: "stm32f10x_flash.h",
    eq: "hal.flash.lock",
    rel: ["std.flash.unlock", "std.flash.programword"],
    tags: ["锁定", "lock", "flash", "安全"]
  }),
  fn({
    id: "hal.flash.unlock", lib: "hal", p: "flash", n: "HAL_FLASH_Unlock",
    sig: "HAL_StatusTypeDef HAL_FLASH_Unlock(void);",
    zh: "解锁 Flash 编程接口，擦写前调用；双 Bank 器件需同时解锁相关寄存器。",
    en: "Unlock the flash programming interface before erase/program; dual-bank parts may need extra unlocks.",
    params: [],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_flash.h",
    eq: "std.flash.unlock",
    rel: ["hal.flash.erase", "hal.flash.program", "hal.flash.lock"],
    tags: ["解锁", "unlock", "flash"]
  }),
  fn({
    id: "hal.flash.erase", lib: "hal", p: "flash", n: "HAL_FLASHEx_Erase",
    sig: "HAL_StatusTypeDef HAL_FLASHEx_Erase(FLASH_EraseInitTypeDef *pEraseInit, uint32_t *PageError);",
    zh: "按页或扇区擦除，参数含类型、起始地址与数量；失败时 PageError 返回出错页。",
    en: "Erase by page/sector using type, start address and count; PageError reports the failing page.",
    params: [
      ["pEraseInit", "擦除参数结构体", "Erase configuration"],
      ["PageError", "出错页编号输出", "Output: failing page"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_flash_ex.h",
    eq: "std.flash.erasepage",
    rel: ["hal.flash.unlock", "hal.flash.program"],
    tags: ["擦除", "erase", "flash", "扇区"]
  }),
  fn({
    id: "hal.flash.program", lib: "hal", p: "flash", n: "HAL_FLASH_Program",
    sig: "HAL_StatusTypeDef HAL_FLASH_Program(uint32_t TypeProgram, uint32_t Address, uint64_t Data);",
    zh: "按字、半字或双字写入 Flash，TypeProgram 必须与芯片支持宽度一致。",
    en: "Program a word, half-word or double-word; TypeProgram must match the device's supported width.",
    params: [
      ["TypeProgram", "FLASH_TYPEPROGRAM_WORD 等", "FLASH_TYPEPROGRAM_WORD etc."],
      ["Address", "目标地址", "Target address"],
      ["Data", "写入数据", "Data to program"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_flash.h",
    eq: "std.flash.programword",
    rel: ["hal.flash.erase", "hal.flash.lock"],
    tags: ["写入", "program", "flash", "参数"]
  }),
  fn({
    id: "hal.flash.lock", lib: "hal", p: "flash", n: "HAL_FLASH_Lock",
    sig: "HAL_StatusTypeDef HAL_FLASH_Lock(void);",
    zh: "重新锁定 Flash 接口，写完立即调用可显著降低误擦写风险。",
    en: "Re-lock the flash interface immediately after programming to reduce accidental writes.",
    params: [],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_flash.h",
    eq: "std.flash.lock",
    rel: ["hal.flash.unlock", "hal.flash.program"],
    tags: ["锁定", "lock", "flash"]
  })
];
