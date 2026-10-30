import { fn } from "./util.js";

/* TIM · ADC · DAC */
export const ANALOG = [

  /* ---------------- TIM · SPL ---------------- */
  fn({
    id: "std.tim.timebaseinit", lib: "std", p: "tim", n: "TIM_TimeBaseInit",
    sig: "void TIM_TimeBaseInit(TIM_TypeDef* TIMx, TIM_TimeBaseInitTypeDef* TIM_TimeBaseInitStruct);",
    zh: "配置预分频、自动重装值、计数模式与时钟分频，决定定时周期和 PWM 频率。",
    en: "Set prescaler, auto-reload, counting mode and clock division — this fixes the timing period and PWM frequency.",
    params: [
      ["TIMx", "如 TIM2 / TIM3", "e.g. TIM2 / TIM3"],
      ["TIM_TimeBaseInitStruct", "成员：Prescaler、Period、CounterMode、ClockDivision", "Members: prescaler, period, counter mode, clock division"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_tim.h",
    eq: "hal.tim.baseinit",
    rel: ["std.rcc.apb1clockcmd", "std.tim.cmd", "std.tim.itconfig"],
    tags: ["定时器", "时基", "init", "prescaler", "pwm", "周期"]
  }),
  fn({
    id: "std.tim.ocinit", lib: "std", p: "tim", n: "TIM_OCxInit",
    sig: "void TIM_OC1Init(TIM_TypeDef* TIMx, TIM_OCInitTypeDef* TIM_OCInitStruct);",
    zh: "配置输出比较通道：PWM 模式、有效电平、初始占空比与输出使能。OC1~OC4 分别对应四个通道。",
    en: "Configure an output-compare channel: PWM mode, polarity, initial pulse and output enable. OC1-OC4 map to the channels.",
    params: [
      ["TIMx", "定时器基址", "Timer base"],
      ["TIM_OCInitStruct", "成员：OCMode、OutputState、Pulse、OCPolarity", "Members: mode, output state, pulse, polarity"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_tim.h",
    eq: "hal.tim.pwmconfigchannel",
    rel: ["std.tim.timebaseinit", "std.tim.setcompare", "std.gpio.init"],
    tags: ["pwm", "输出比较", "oc", "占空比", "duty"]
  }),
  fn({
    id: "std.tim.cmd", lib: "std", p: "tim", n: "TIM_Cmd",
    sig: "void TIM_Cmd(TIM_TypeDef* TIMx, FunctionalState NewState);",
    zh: "启动或停止定时器计数器。PWM 输出在使能后才真正出现在引脚上。",
    en: "Start or stop the counter; PWM only appears on the pin after the timer is enabled.",
    params: [
      ["TIMx", "定时器基址", "Timer base"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_tim.h",
    eq: "hal.tim.basestartit",
    rel: ["std.tim.timebaseinit", "std.tim.itconfig"],
    tags: ["启动", "start", "enable", "定时器"]
  }),
  fn({
    id: "std.tim.itconfig", lib: "std", p: "tim", n: "TIM_ITConfig",
    sig: "void TIM_ITConfig(TIM_TypeDef* TIMx, uint16_t TIM_IT, FunctionalState NewState);",
    zh: "使能更新（溢出）等中断源，还要在 NVIC 中使能 TIMx_IRQn。",
    en: "Enable the update (overflow) interrupt source; the TIMx_IRQn must also be enabled in the NVIC.",
    params: [
      ["TIMx", "定时器基址", "Timer base"],
      ["TIM_IT", "如 TIM_IT_Update", "e.g. TIM_IT_Update"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_tim.h",
    rel: ["std.nvic.init", "std.tim.getitstatus", "std.tim.cmd"],
    tags: ["中断", "it", "更新", "update"]
  }),
  fn({
    id: "std.tim.setcompare", lib: "std", p: "tim", n: "TIM_SetCompare1",
    sig: "void TIM_SetCompare1(TIM_TypeDef* TIMx, uint16_t Compare1);",
    zh: "修改通道 1 比较值，即 PWM 占空比；运行中调用可动态调光。",
    en: "Change channel 1 compare value — the PWM duty cycle; safe to call while running.",
    params: [
      ["TIMx", "定时器基址", "Timer base"],
      ["Compare1", "比较值（0 ~ Period）", "Compare value (0 to Period)"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_tim.h",
    eq: "hal.tim.setcompare",
    rel: ["std.tim.ocinit", "std.tim.getcounter"],
    tags: ["pwm", "占空比", "duty", "compare"]
  }),
  fn({
    id: "std.tim.getcounter", lib: "std", p: "tim", n: "TIM_GetCounter",
    sig: "uint16_t TIM_GetCounter(TIM_TypeDef* TIMx);",
    zh: "读取当前计数值，可做微秒级时间戳或测量脉宽。",
    en: "Read the current counter for microsecond timestamps or pulse-width measurement.",
    params: [["TIMx", "定时器基址", "Timer base"]],
    ret: ["当前计数值", "Current counter value"],
    hdr: "stm32f10x_tim.h",
    eq: "hal.tim.getcounter",
    rel: ["std.tim.timebaseinit", "std.tim.getitstatus"],
    tags: ["计数", "counter", "时间戳", "timestamp"]
  }),
  fn({
    id: "std.tim.getitstatus", lib: "std", p: "tim", n: "TIM_GetITStatus",
    sig: "ITStatus TIM_GetITStatus(TIM_TypeDef* TIMx, uint16_t TIM_IT);",
    zh: "判断更新、捕获、比较等中断标志是否置位。",
    en: "Check whether an update, capture or compare interrupt flag is set.",
    params: [
      ["TIMx", "定时器基址", "Timer base"],
      ["TIM_IT", "中断源宏", "Interrupt source macro"]
    ],
    ret: ["SET / RESET", "SET / RESET"],
    hdr: "stm32f10x_tim.h",
    rel: ["std.tim.clearitpending", "std.tim.itconfig"],
    tags: ["中断", "标志", "flag", "isr"]
  }),
  fn({
    id: "std.tim.clearitpending", lib: "std", p: "tim", n: "TIM_ClearITPendingBit",
    sig: "void TIM_ClearITPendingBit(TIM_TypeDef* TIMx, uint16_t TIM_IT);",
    zh: "清除定时器中断标志；漏清会导致 ISR 反复进入。",
    en: "Clear the timer interrupt flag; forgetting it locks the MCU inside the ISR.",
    params: [
      ["TIMx", "定时器基址", "Timer base"],
      ["TIM_IT", "中断源宏", "Interrupt source macro"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_tim.h",
    rel: ["std.tim.getitstatus"],
    tags: ["清除", "标志", "clear", "pending"]
  }),

  /* ---------------- TIM · HAL ---------------- */
  fn({
    id: "hal.tim.baseinit", lib: "hal", p: "tim", n: "HAL_TIM_Base_Init",
    sig: "HAL_StatusTypeDef HAL_TIM_Base_Init(TIM_HandleTypeDef *htim);",
    zh: "按时基结构体初始化定时器并调用 HAL_TIM_Base_MspInit 配置时钟与 NVIC。",
    en: "Initialise the time base and call HAL_TIM_Base_MspInit for clocks and NVIC.",
    params: [["htim", "定时器句柄", "Timer handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_tim.h",
    eq: "std.tim.timebaseinit",
    rel: ["hal.rcc.clkenable", "hal.tim.basestartit", "hal.tim.pwmconfigchannel"],
    tags: ["定时器", "时基", "init", "msp"]
  }),
  fn({
    id: "hal.tim.pwmconfigchannel", lib: "hal", p: "tim", n: "HAL_TIM_PWM_ConfigChannel",
    sig: "HAL_StatusTypeDef HAL_TIM_PWM_ConfigChannel(TIM_HandleTypeDef *htim, TIM_OC_InitTypeDef *sConfig, uint32_t Channel);",
    zh: "配置 PWM 通道的模式、脉宽与极性；需先 HAL_TIM_PWM_Init 或 Base_Init。",
    en: "Configure PWM mode, pulse and polarity for a channel; requires HAL_TIM_PWM_Init or Base_Init first.",
    params: [
      ["htim", "定时器句柄", "Timer handle"],
      ["sConfig", "OCMode、Pulse、OCPolarity", "OCMode, Pulse, OCPolarity"],
      ["Channel", "TIM_CHANNEL_1 ~ _4", "TIM_CHANNEL_1 to _4"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_tim.h",
    eq: "std.tim.ocinit",
    rel: ["hal.tim.pwmstart", "hal.tim.setcompare"],
    tags: ["pwm", "通道", "channel", "占空比"]
  }),
  fn({
    id: "hal.tim.pwmstart", lib: "hal", p: "tim", n: "HAL_TIM_PWM_Start",
    sig: "HAL_StatusTypeDef HAL_TIM_PWM_Start(TIM_HandleTypeDef *htim, uint32_t Channel);",
    zh: "启动指定通道的 PWM 输出，内部同时使能定时器与捕获比较通道。",
    en: "Start PWM on a channel; enables both the timer and the compare channel.",
    params: [
      ["htim", "定时器句柄", "Timer handle"],
      ["Channel", "TIM_CHANNEL_x", "TIM_CHANNEL_x"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_tim.h",
    eq: "std.tim.cmd",
    rel: ["hal.tim.pwmconfigchannel", "hal.tim.setcompare"],
    tags: ["pwm", "启动", "start", "输出"]
  }),
  fn({
    id: "hal.tim.basestartit", lib: "hal", p: "tim", n: "HAL_TIM_Base_Start_IT",
    sig: "HAL_StatusTypeDef HAL_TIM_Base_Start_IT(TIM_HandleTypeDef *htim);",
    zh: "以中断方式启动定时器，周期到达时进入 HAL_TIM_PeriodElapsedCallback。",
    en: "Start the timer in interrupt mode; HAL_TIM_PeriodElapsedCallback fires on each period.",
    params: [["htim", "定时器句柄", "Timer handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_tim.h",
    eq: "std.tim.itconfig",
    rel: ["hal.tim.irqhandler", "hal.tim.periodelapsedcallback", "hal.nvic.enableirq"],
    tags: ["定时中断", "it", "启动", "period"]
  }),
  fn({
    id: "hal.tim.setcompare", lib: "hal", p: "tim", n: "__HAL_TIM_SET_COMPARE",
    macro: true,
    sig: "__HAL_TIM_SET_COMPARE(&htim2, TIM_CHANNEL_1, 500);",
    zh: "运行时修改比较寄存器的宏，等价于 SPL 的 TIM_SetCompare1，用于动态调节占空比。",
    en: "Macro to change the compare register at runtime (SPL equivalent: TIM_SetCompare1).",
    params: [
      ["__HANDLE__", "定时器句柄地址", "Timer handle pointer"],
      ["__CHANNEL__", "通道", "Channel"],
      ["__COMPARE__", "比较值", "Compare value"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_tim.h",
    eq: "std.tim.setcompare",
    rel: ["hal.tim.pwmstart", "hal.tim.pwmconfigchannel"],
    tags: ["pwm", "占空比", "duty", "macro"]
  }),
  fn({
    id: "hal.tim.getcounter", lib: "hal", p: "tim", n: "__HAL_TIM_GET_COUNTER",
    macro: true,
    sig: "__HAL_TIM_GET_COUNTER(&htim2);",
    zh: "读取定时器当前计数值的宏，常用于测量代码耗时或生成随机种子。",
    en: "Macro returning the current counter — handy for timing code or seeding a PRNG.",
    params: [["__HANDLE__", "定时器句柄地址", "Timer handle pointer"]],
    ret: ["计数器当前值", "Current counter value"],
    hdr: "stm32f1xx_hal_tim.h",
    eq: "std.tim.getcounter",
    rel: ["hal.tim.basestartit"],
    tags: ["计数", "counter", "macro"]
  }),
  fn({
    id: "hal.tim.irqhandler", lib: "hal", p: "tim", n: "HAL_TIM_IRQHandler",
    sig: "void HAL_TIM_IRQHandler(TIM_HandleTypeDef *htim);",
    zh: "在 TIMx_IRQHandler 中调用，统一分派更新、捕获与比较事件到各回调。",
    en: "Call from TIMx_IRQHandler; dispatches update, capture and compare events to their callbacks.",
    params: [["htim", "定时器句柄", "Timer handle"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_tim.h",
    rel: ["hal.tim.periodelapsedcallback", "hal.tim.basestartit"],
    tags: ["中断服务", "isr", "irq", "tim"]
  }),
  fn({
    id: "hal.tim.periodelapsedcallback", lib: "hal", p: "tim", n: "HAL_TIM_PeriodElapsedCallback",
    sig: "__weak void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim);",
    zh: "定时器更新回调，用户重写它执行周期任务；避免在里面长时间阻塞。",
    en: "Update callback overridden by the user for periodic work; avoid blocking inside it.",
    params: [["htim", "定时器句柄", "Timer handle"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_tim.h",
    rel: ["hal.tim.basestartit", "hal.tim.irqhandler"],
    tags: ["回调", "callback", "周期", "period", "任务"]
  }),

  /* ---------------- ADC · SPL ---------------- */
  fn({
    id: "std.adc.init", lib: "std", p: "adc", n: "ADC_Init",
    sig: "void ADC_Init(ADC_TypeDef* ADCx, ADC_InitTypeDef* ADC_InitStruct);",
    zh: "配置 ADC 工作模式、扫描、连续转换、外部触发与对齐方式。",
    en: "Configure ADC mode, scan, continuous conversion, external trigger and data alignment.",
    params: [
      ["ADCx", "如 ADC1", "e.g. ADC1"],
      ["ADC_InitStruct", "成员：ADC_Mode、ScanConvMode、ContinuousConvMode、ExternalTrigConv、DataAlign、NbrOfChannel", "Members: mode, scan, continuous, trigger, alignment, channel count"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_adc.h",
    eq: "hal.adc.init",
    rel: ["std.rcc.apb2clockcmd", "std.adc.cmd", "std.gpio.init"],
    tags: ["adc", "初始化", "init", "采样", "scan"]
  }),
  fn({
    id: "std.adc.cmd", lib: "std", p: "adc", n: "ADC_Cmd",
    sig: "void ADC_Cmd(ADC_TypeDef* ADCx, FunctionalState NewState);",
    zh: "给 ADC 上电或断电；上电后需要稳定时间，通常再执行一次校准。",
    en: "Power the ADC on or off; after power-up wait for stabilisation and run a calibration.",
    params: [
      ["ADCx", "ADC 基址", "ADC base"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_adc.h",
    eq: "hal.adc.start",
    rel: ["std.adc.init", "std.adc.calibration"],
    tags: ["使能", "enable", "adc", "上电"]
  }),
  fn({
    id: "std.adc.regularchannelconfig", lib: "std", p: "adc", n: "ADC_RegularChannelConfig",
    sig: "void ADC_RegularChannelConfig(ADC_TypeDef* ADCx, uint8_t ADC_Channel, uint8_t Rank, uint8_t ADC_SampleTime);",
    zh: "把某个通道放入规则组的指定序号，并设置采样时间；高阻信号要加长采样。",
    en: "Place a channel at a rank in the regular group and set sampling time; extend it for high-impedance sources.",
    params: [
      ["ADCx", "ADC 基址", "ADC base"],
      ["ADC_Channel", "如 ADC_Channel_0", "e.g. ADC_Channel_0"],
      ["Rank", "转换顺序 1 ~ n", "Conversion rank 1 to n"],
      ["ADC_SampleTime", "如 ADC_SampleTime_55Cycles5", "e.g. ADC_SampleTime_55Cycles5"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_adc.h",
    rel: ["std.adc.init", "std.dma.init"],
    tags: ["通道", "channel", "采样时间", "sample"]
  }),
  fn({
    id: "std.adc.calibration", lib: "std", p: "adc", n: "ADC_ResetCalibration / ADC_StartCalibration",
    group: true,
    sig: "ADC_ResetCalibration(ADC1); while (ADC_GetResetCalibrationStatus(ADC1)); ADC_StartCalibration(ADC1);",
    zh: "ADC 校准组合调用：先复位校准寄存器，再启动校准并等待完成。上电后必须做一次，否则精度偏差明显。",
    en: "Calibration sequence: reset the calibration registers, start calibration, then wait for completion. Required after power-up.",
    params: [["ADCx", "ADC 基址", "ADC base"]],
    ret: ["无", "None"],
    hdr: "stm32f10x_adc.h",
    eq: "hal.adc.calibration",
    rel: ["std.adc.cmd", "std.adc.getconversionvalue"],
    tags: ["校准", "calibration", "精度", "adc"]
  }),
  fn({
    id: "std.adc.softwarestartconvcmd", lib: "std", p: "adc", n: "ADC_SoftwareStartConvCmd",
    sig: "void ADC_SoftwareStartConvCmd(ADC_TypeDef* ADCx, FunctionalState NewState);",
    zh: "软件触发一次转换（或开启连续转换）。轮询采样时先调用它再等 EOC。",
    en: "Trigger a conversion in software (or enable continuous mode); call it before waiting for EOC in polling mode.",
    params: [
      ["ADCx", "ADC 基址", "ADC base"],
      ["NewState", "ENABLE 触发", "ENABLE to trigger"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_adc.h",
    eq: "hal.adc.start",
    rel: ["std.adc.getconversionvalue", "std.adc.getflagstatus"],
    tags: ["启动", "start", "软件触发", "software"]
  }),
  fn({
    id: "std.adc.getconversionvalue", lib: "std", p: "adc", n: "ADC_GetConversionValue",
    sig: "uint16_t ADC_GetConversionValue(ADC_TypeDef* ADCx);",
    zh: "读取 12 位转换结果，读取会清除 EOC 标志。",
    en: "Read the 12-bit result; reading clears EOC.",
    params: [["ADCx", "ADC 基址", "ADC base"]],
    ret: ["0 ~ 4095", "0 to 4095"],
    hdr: "stm32f10x_adc.h",
    eq: "hal.adc.getvalue",
    rel: ["std.adc.getflagstatus", "std.adc.softwarestartconvcmd"],
    tags: ["读取", "read", "结果", "value", "12bit"]
  }),
  fn({
    id: "std.adc.getflagstatus", lib: "std", p: "adc", n: "ADC_GetFlagStatus",
    sig: "FlagStatus ADC_GetFlagStatus(ADC_TypeDef* ADCx, uint8_t ADC_FLAG);",
    zh: "检查 EOC、规则组转换结束等标志，轮询采样时用 EOC 判断数据就绪。",
    en: "Check EOC and end-of-conversion flags; polling code waits on EOC before reading.",
    params: [
      ["ADCx", "ADC 基址", "ADC base"],
      ["ADC_FLAG", "如 ADC_FLAG_EOC", "e.g. ADC_FLAG_EOC"]
    ],
    ret: ["SET / RESET", "SET / RESET"],
    hdr: "stm32f10x_adc.h",
    rel: ["std.adc.getconversionvalue"],
    tags: ["标志", "flag", "eoc", "轮询"]
  }),
  fn({
    id: "std.adc.dmacmd", lib: "std", p: "adc", n: "ADC_DMACmd",
    sig: "void ADC_DMACmd(ADC_TypeDef* ADCx, FunctionalState NewState);",
    zh: "允许 ADC 在每次转换结束后向 DMA 发出请求，实现多通道自动搬运。",
    en: "Let the ADC request DMA after each conversion, enabling automatic multi-channel transfers.",
    params: [
      ["ADCx", "ADC 基址", "ADC base"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_adc.h",
    eq: "hal.adc.start_dma",
    rel: ["std.dma.init", "std.adc.regularchannelconfig"],
    tags: ["dma", "多通道", "自动", "adc"]
  }),

  /* ---------------- ADC · HAL ---------------- */
  fn({
    id: "hal.adc.init", lib: "hal", p: "adc", n: "HAL_ADC_Init",
    sig: "HAL_StatusTypeDef HAL_ADC_Init(ADC_HandleTypeDef *hadc);",
    zh: "初始化 ADC 分辨率、扫描、连续模式与触发源，并调用 HAL_ADC_MspInit。",
    en: "Initialise resolution, scan/continuous mode and trigger source; calls HAL_ADC_MspInit.",
    params: [["hadc", "ADC 句柄", "ADC handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_adc.h",
    eq: "std.adc.init",
    rel: ["hal.rcc.clkenable", "hal.gpio.init", "hal.adc.configchannel"],
    tags: ["adc", "初始化", "init", "msp"]
  }),
  fn({
    id: "hal.adc.configchannel", lib: "hal", p: "adc", n: "HAL_ADC_ConfigChannel",
    sig: "HAL_StatusTypeDef HAL_ADC_ConfigChannel(ADC_HandleTypeDef *hadc, ADC_ChannelConfTypeDef *sConfig);",
    zh: "设置通道、转换序号与采样时间；每个通道调用一次。",
    en: "Configure channel, rank and sampling time; call once per channel.",
    params: [
      ["hadc", "ADC 句柄", "ADC handle"],
      ["sConfig", "Channel、Rank、SamplingTime", "Channel, Rank, SamplingTime"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_adc.h",
    eq: "std.adc.regularchannelconfig",
    rel: ["hal.adc.start", "hal.adc.calibration"],
    tags: ["通道", "channel", "采样时间", "sample"]
  }),
  fn({
    id: "hal.adc.calibration", lib: "hal", p: "adc", n: "HAL_ADCEx_Calibration_Start",
    sig: "HAL_StatusTypeDef HAL_ADCEx_Calibration_Start(ADC_HandleTypeDef *hadc);",
    zh: "执行 ADC 自校准；多数系列要求在启动转换前调用一次，否则精度与线性度变差。",
    en: "Run the ADC self-calibration; most families require it before the first conversion for accurate results.",
    params: [["hadc", "ADC 句柄", "ADC handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_adc_ex.h",
    eq: "std.adc.calibration",
    rel: ["hal.adc.init", "hal.adc.start"],
    tags: ["校准", "calibration", "精度", "adc"]
  }),
  fn({
    id: "hal.adc.start", lib: "hal", p: "adc", n: "HAL_ADC_Start",
    sig: "HAL_StatusTypeDef HAL_ADC_Start(ADC_HandleTypeDef *hadc);",
    zh: "启动 ADC 转换（单次或连续，取决于配置），随后轮询或等待中断。",
    en: "Start conversions (single or continuous per config), then poll or wait for the interrupt.",
    params: [["hadc", "ADC 句柄", "ADC handle"]],
    ret: ["HAL_OK / HAL_ERROR / HAL_BUSY", "HAL_OK / HAL_ERROR / HAL_BUSY"],
    hdr: "stm32f1xx_hal_adc.h",
    eq: "std.adc.softwarestartconvcmd",
    rel: ["hal.adc.pollforconversion", "hal.adc.getvalue"],
    tags: ["启动", "start", "adc"]
  }),
  fn({
    id: "hal.adc.pollforconversion", lib: "hal", p: "adc", n: "HAL_ADC_PollForConversion",
    sig: "HAL_StatusTypeDef HAL_ADC_PollForConversion(ADC_HandleTypeDef *hadc, uint32_t Timeout);",
    zh: "阻塞等待本次转换完成，超时返回 HAL_TIMEOUT；连续模式下转换为软件触发时常用。",
    en: "Block until the conversion completes; returns HAL_TIMEOUT on expiry.",
    params: [
      ["hadc", "ADC 句柄", "ADC handle"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_TIMEOUT / HAL_ERROR", "HAL_OK / HAL_TIMEOUT / HAL_ERROR"],
    hdr: "stm32f1xx_hal_adc.h",
    eq: "std.adc.getflagstatus",
    rel: ["hal.adc.getvalue", "hal.adc.start"],
    tags: ["轮询", "poll", "转换", "conversion"]
  }),
  fn({
    id: "hal.adc.getvalue", lib: "hal", p: "adc", n: "HAL_ADC_GetValue",
    sig: "uint32_t HAL_ADC_GetValue(ADC_HandleTypeDef *hadc);",
    zh: "读取最近一次转换结果（12 位右对齐时 0~4095）。",
    en: "Return the latest conversion result (0-4095 for 12-bit right-aligned data).",
    params: [["hadc", "ADC 句柄", "ADC handle"]],
    ret: ["转换结果", "Conversion result"],
    hdr: "stm32f1xx_hal_adc.h",
    eq: "std.adc.getconversionvalue",
    rel: ["hal.adc.pollforconversion"],
    tags: ["读取", "value", "结果", "adc"]
  }),
  fn({
    id: "hal.adc.start_dma", lib: "hal", p: "adc", n: "HAL_ADC_Start_DMA",
    sig: "HAL_StatusTypeDef HAL_ADC_Start_DMA(ADC_HandleTypeDef *hadc, uint32_t *pData, uint32_t Length);",
    zh: "启动 ADC 并开启 DMA 搬运，多通道扫描时每个结果自动写入数组。",
    en: "Start the ADC with DMA so each scan result lands in the buffer automatically.",
    params: [
      ["hadc", "ADC 句柄", "ADC handle"],
      ["pData", "结果数组（uint32_t）", "Destination buffer (uint32_t)"],
      ["Length", "转换点数", "Number of conversions"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_adc.h",
    eq: "std.adc.dmacmd",
    rel: ["hal.dma.start", "hal.adc.configchannel"],
    tags: ["dma", "多通道", "scan", "adc"]
  }),
  fn({
    id: "hal.adc.stop", lib: "hal", p: "adc", n: "HAL_ADC_Stop",
    sig: "HAL_StatusTypeDef HAL_ADC_Stop(ADC_HandleTypeDef *hadc);",
    zh: "停止 ADC 转换；DMA 模式下对应 HAL_ADC_Stop_DMA。",
    en: "Stop conversions; in DMA mode use HAL_ADC_Stop_DMA instead.",
    params: [["hadc", "ADC 句柄", "ADC handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_adc.h",
    eq: "std.adc.cmd",
    rel: ["hal.adc.start", "hal.adc.start_dma"],
    tags: ["停止", "stop", "adc"]
  }),

  /* ---------------- DAC · SPL ---------------- */
  fn({
    id: "std.dac.init", lib: "std", p: "dac", n: "DAC_Init",
    sig: "void DAC_Init(uint32_t DAC_Channel, DAC_InitTypeDef* DAC_InitStruct);",
    zh: "配置 DAC 触发源、波形发生与输出缓冲。使能输出缓冲可提高驱动能力。",
    en: "Configure trigger source, waveform generation and output buffer; enabling the buffer improves drive strength.",
    params: [
      ["DAC_Channel", "DAC_Channel_1 / _2", "DAC_Channel_1 / _2"],
      ["DAC_InitStruct", "成员：Trigger、WaveGeneration、OutputBuffer", "Members: trigger, wave generation, output buffer"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_dac.h",
    eq: "hal.dac.init",
    rel: ["std.rcc.apb1clockcmd", "std.dac.cmd", "std.dac.setdata"],
    tags: ["dac", "初始化", "init", "模拟输出"]
  }),
  fn({
    id: "std.dac.cmd", lib: "std", p: "dac", n: "DAC_Cmd",
    sig: "void DAC_Cmd(uint32_t DAC_Channel, FunctionalState NewState);",
    zh: "使能 DAC 通道，之后写入的数据才会出现在引脚上。",
    en: "Enable a DAC channel; only then does written data reach the pin.",
    params: [
      ["DAC_Channel", "DAC_Channel_1 / _2", "DAC_Channel_1 / _2"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_dac.h",
    rel: ["std.dac.init", "std.dac.setdata"],
    tags: ["使能", "enable", "dac"]
  }),
  fn({
    id: "std.dac.setdata", lib: "std", p: "dac", n: "DAC_SetChannel1Data",
    sig: "void DAC_SetChannel1Data(uint32_t DAC_Align, uint16_t Data);",
    zh: "写通道 1 的 12 位输出值，配合 DMA 可生成任意波形。",
    en: "Write the 12-bit value for channel 1; pair with DMA to generate arbitrary waveforms.",
    params: [
      ["DAC_Align", "DAC_Align_12b_R / L", "DAC_Align_12b_R / L"],
      ["Data", "0 ~ 4095", "0 to 4095"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_dac.h",
    eq: "hal.dac.setvalue",
    rel: ["std.dac.cmd", "std.dac.dmacmd"],
    tags: ["输出", "value", "dac", "波形"]
  }),
  fn({
    id: "std.dac.dmacmd", lib: "std", p: "dac", n: "DAC_DMACmd",
    sig: "void DAC_DMACmd(uint32_t DAC_Channel, FunctionalState NewState);",
    zh: "允许 DAC 请求 DMA 搬运波形数据，实现连续信号输出。",
    en: "Enable DAC DMA requests for continuous waveform output.",
    params: [
      ["DAC_Channel", "DAC 通道", "DAC channel"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_dac.h",
    eq: "hal.dac.start_dma",
    rel: ["std.dac.setdata", "std.dma.init"],
    tags: ["dma", "波形", "waveform", "dac"]
  }),

  /* ---------------- DAC · HAL ---------------- */
  fn({
    id: "hal.dac.init", lib: "hal", p: "dac", n: "HAL_DAC_Init",
    sig: "HAL_StatusTypeDef HAL_DAC_Init(DAC_HandleTypeDef *hdac);",
    zh: "初始化 DAC 句柄并调用 MspInit 配置时钟与引脚。",
    en: "Initialise the DAC handle and call MspInit for clocks and pins.",
    params: [["hdac", "DAC 句柄", "DAC handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_dac.h",
    eq: "std.dac.init",
    rel: ["hal.rcc.clkenable", "hal.gpio.init", "hal.dac.start"],
    tags: ["dac", "初始化", "init", "msp"]
  }),
  fn({
    id: "hal.dac.start", lib: "hal", p: "dac", n: "HAL_DAC_Start",
    sig: "HAL_StatusTypeDef HAL_DAC_Start(DAC_HandleTypeDef *hdac, uint32_t Channel);",
    zh: "启动 DAC 通道输出，之后 SetValue 立即生效。",
    en: "Start the DAC channel; subsequent SetValue calls take effect immediately.",
    params: [
      ["hdac", "DAC 句柄", "DAC handle"],
      ["Channel", "DAC_CHANNEL_1 / 2", "DAC_CHANNEL_1 / 2"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_dac.h",
    eq: "std.dac.cmd",
    rel: ["hal.dac.setvalue", "hal.dac.start_dma"],
    tags: ["启动", "start", "dac"]
  }),
  fn({
    id: "hal.dac.setvalue", lib: "hal", p: "dac", n: "HAL_DAC_SetValue",
    sig: "HAL_StatusTypeDef HAL_DAC_SetValue(DAC_HandleTypeDef *hdac, uint32_t Channel, uint32_t Alignment, uint32_t Data);",
    zh: "设置 12 位输出值（右对齐时 0~4095），用于设定电压或波形点。",
    en: "Set the 12-bit output value (0-4095 right-aligned) for a voltage level or waveform point.",
    params: [
      ["hdac", "DAC 句柄", "DAC handle"],
      ["Channel", "DAC 通道", "DAC channel"],
      ["Alignment", "DAC_ALIGN_12B_R 等", "DAC_ALIGN_12B_R etc."],
      ["Data", "输出值", "Output value"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_dac.h",
    eq: "std.dac.setdata",
    rel: ["hal.dac.start", "hal.dac.start_dma"],
    tags: ["输出", "value", "dac", "电压"]
  }),
  fn({
    id: "hal.dac.start_dma", lib: "hal", p: "dac", n: "HAL_DAC_Start_DMA",
    sig: "HAL_StatusTypeDef HAL_DAC_Start_DMA(DAC_HandleTypeDef *hdac, uint32_t Channel, uint32_t *pData, uint32_t Length, uint32_t Alignment);",
    zh: "DMA 驱动 DAC 连续输出波形；配合定时器触发可得到精确频率。",
    en: "Drive the DAC from DMA for continuous waveforms; add a timer trigger for precise frequency.",
    params: [
      ["hdac", "DAC 句柄", "DAC handle"],
      ["Channel", "DAC 通道", "DAC channel"],
      ["pData", "波形数据数组", "Waveform buffer"],
      ["Length", "采样点数", "Number of samples"],
      ["Alignment", "数据对齐方式", "Data alignment"]
    ],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_dac.h",
    eq: "std.dac.dmacmd",
    rel: ["hal.dma.start", "hal.tim.basestartit"],
    tags: ["dma", "波形", "waveform", "dac"]
  })
];
