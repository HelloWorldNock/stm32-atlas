export const WF_SYSTEM = [
  {
    id: "wf.clock-init",
    p: "rcc",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "系统时钟初始化：HSE + PLL 跑到 72 MHz",
      en: "System clock setup: HSE plus PLL up to 72 MHz"
    },
    goal: {
      zh: "把 8 MHz 外部晶振经 PLL 9 倍频成 72 MHz，配好 Flash 等待周期与 APB 分频，并在晶振不起振时安全退回 HSI。",
      en: "Turn an 8 MHz crystal into 72 MHz through the x9 PLL, set flash latency and APB dividers, and fall back to HSI when the crystal never starts."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "打开 HSE 并指定 PLL 输入", en: "Enable HSE and pick the PLL source" },
        desc: {
          zh: "主频要从外部晶振倍频，第一步先把 HSE 打开。SPL 用 RCC_HSEConfig，HAL 把 HSEState 与 PLLSource 一起交给 HAL_RCC_OscConfig。",
          en: "Start the crystal first: RCC_HSEConfig in SPL, or set HSEState and PLLSource inside the struct passed to HAL_RCC_OscConfig."
        },
        fn: ["std.rcc.waitforhse", "hal.rcc.oscinit"],
        code: {
          std: "RCC_HSEConfig(RCC_HSE_ON);\nif (RCC_WaitForHSEStartUp() != SUCCESS) { /* 见下一步回退 */ }",
          hal: "osc.OscillatorType = RCC_OSCILLATORTYPE_HSE;\nosc.HSEState = RCC_HSE_ON;\nosc.PLL.PLLState = RCC_PLL_ON;\nosc.PLL.PLLSource = RCC_PLLSOURCE_HSE;"
        }
      },
      {
        kind: "check",
        title: { zh: "确认 HSE 起振，失败退回 HSI", en: "Confirm HSE start-up, else stay on HSI" },
        desc: {
          zh: "RCC_WaitForHSEStartUp 自带超时，返回 ERROR 就不要再开 PLL，留在复位默认的 HSI 上并把 Flash 等待周期降到 0。HAL 对应检查 HAL_RCC_OscConfig 的返回值。",
          en: "RCC_WaitForHSEStartUp has its own timeout. On ERROR skip the PLL, stay on the reset-default HSI and drop flash latency to 0. In HAL, check the HAL_RCC_OscConfig return value instead."
        },
        fn: ["std.rcc.waitforhse", "std.rcc.sysclkconfig", "hal.rcc.oscinit"],
        code: {
          std: "if (RCC_WaitForHSEStartUp() == ERROR) {\n    RCC_SYSCLKConfig(RCC_SYSCLKSource_HSI);\n    return 0;\n}",
          hal: "if (HAL_RCC_OscConfig(&osc) != HAL_OK) {\n    src = RCC_SYSCLKSOURCE_HSI;   /* HSI 仍在运行 */\n    latency = FLASH_LATENCY_0;\n}"
        }
      },
      {
        title: { zh: "配置 PLL 9 倍频", en: "Set the PLL multiplier to 9" },
        desc: {
          zh: "8 MHz × 9 = 72 MHz。F1 的 PLL 输入必须先二分频才能超过 8 MHz 的 HSE，这里晶振正好 8 MHz，所以选 HSE_Div1。开 PLL 后要等 PLLRDY 置位再切系统时钟。",
          en: "8 MHz x 9 = 72 MHz. The SPL argument is HSE_Div1 because the crystal is exactly 8 MHz; after enabling the PLL, wait for PLLRDY before switching the system clock."
        },
        fn: ["std.rcc.pllconfig", "hal.rcc.oscinit"],
        code: {
          std: "RCC_PLLConfig(RCC_PLLSource_HSE_Div1, RCC_PLLMul_9);\nRCC_PLLCmd(ENABLE);\nwhile (RCC_GetFlagStatus(RCC_FLAG_PLLRDY) == RESET) { }",
          hal: "osc.PLL.PLLState = RCC_PLL_ON;\nosc.PLL.PLLMUL = RCC_PLL_MUL9;\nHAL_RCC_OscConfig(&osc);"
        }
      },
      {
        title: { zh: "写 Flash 等待周期与总线分频", en: "Set flash latency and bus dividers" },
        desc: {
          zh: "顺序不能反：先设 2 个等待周期再提速，否则 72 MHz 下取指会出错。APB1 上限 36 MHz，所以 PCLK1 二分频；APB2 保持 72 MHz。HAL 把等待周期作为 HAL_RCC_ClockConfig 的第二个参数。",
          en: "Order matters: program two wait states before raising the frequency. APB1 is limited to 36 MHz, so PCLK1 gets divided by two; APB2 stays at 72 MHz. HAL passes the latency as the second argument."
        },
        fn: ["hal.rcc.clockinit"],
        code: {
          std: "FLASH_SetLatency(FLASH_Latency_2);\nRCC_HCLKConfig(RCC_SYSCLK_Div1);\nRCC_PCLK1Config(RCC_HCLK_Div2);\nRCC_PCLK2Config(RCC_HCLK_Div1);",
          hal: "clk.AHBCLKDivider = RCC_SYSCLK_DIV1;\nclk.APB1CLKDivider = RCC_HCLK_DIV2;\nclk.APB2CLKDivider = RCC_HCLK_DIV1;\nHAL_RCC_ClockConfig(&clk, FLASH_LATENCY_2);"
        }
      },
      {
        kind: "check",
        title: { zh: "切换到 PLL 并确认生效", en: "Switch to PLL and verify" },
        desc: {
          zh: "RCC_SYSCLKConfig 只是写请求，真正生效要看 SWS 字段变成 0x08（PLL）。HAL_RCC_ClockConfig 内部会等 SWS，返回 HAL_OK 才表示切成功。",
          en: "RCC_SYSCLKConfig only writes the request; check SWS until it reads 0x08 (PLL). HAL_RCC_ClockConfig waits internally and returns HAL_OK only when the switch succeeded."
        },
        fn: ["std.rcc.sysclkconfig", "hal.rcc.clockinit"],
        code: {
          std: "RCC_SYSCLKConfig(RCC_SYSCLKSource_PLLCLK);\nwhile (RCC_GetSYSCLKSource() != 0x08) { }",
          hal: "clk.SYSCLKSource = RCC_SYSCLKSOURCE_PLLCLK;\nif (HAL_RCC_ClockConfig(&clk, latency) != HAL_OK) { Error_Handler(); }"
        }
      },
      {
        kind: "end",
        title: { zh: "回读实际频率再算外设参数", en: "Read back the real frequency" },
        desc: {
          zh: "配置完成后用 RCC_GetClocksFreq 或 HAL_RCC_GetHCLKFreq 回读，串口波特率、定时器周期都应以实测值为准——退回 HSI 时这些参数全部要按 8 MHz 重算。",
          en: "Read the tree back with RCC_GetClocksFreq or HAL_RCC_GetHCLKFreq. Baud rates and timer periods must be derived from the actual value — after an HSI fallback everything is based on 8 MHz."
        },
        fn: ["std.rcc.getclocksfreq", "hal.rcc.gethclkfreq", "hal.rcc.getpclk1freq"]
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

/* 72 MHz: HSE 8 MHz x9, AHB 72 MHz, APB1 36 MHz, APB2 72 MHz, 2 wait states */
static uint8_t clock_72mhz(void)
{
    RCC_DeInit();                       /* 回到 HSI，方便重复初始化 */
    RCC_HSEConfig(RCC_HSE_ON);

    if (RCC_WaitForHSEStartUp() != SUCCESS) {
        RCC_SYSCLKConfig(RCC_SYSCLKSource_HSI);   /* 晶振异常，留在 8 MHz */
        return 0;
    }

    FLASH_PrefetchBufferCmd(FLASH_PrefetchBuffer_Enable);
    FLASH_SetLatency(FLASH_Latency_2);

    RCC_HCLKConfig(RCC_SYSCLK_Div1);
    RCC_PCLK1Config(RCC_HCLK_Div2);
    RCC_PCLK2Config(RCC_HCLK_Div1);

    RCC_PLLConfig(RCC_PLLSource_HSE_Div1, RCC_PLLMul_9);
    RCC_PLLCmd(ENABLE);
    while (RCC_GetFlagStatus(RCC_FLAG_PLLRDY) == RESET) { }

    RCC_SYSCLKConfig(RCC_SYSCLKSource_PLLCLK);
    while (RCC_GetSYSCLKSource() != 0x08) { }   /* SWS = PLL */
    return 1;
}

int main(void)
{
    RCC_ClocksTypeDef clk;

    uint8_t on_pll = clock_72mhz();

    RCC_GetClocksFreq(&clk);            /* SYSCLK 72M / PCLK1 36M / PCLK2 72M */
    (void)on_pll;
    (void)clk;
    while (1) { }
}`,
      hal: `#include "stm32f1xx_hal.h"

static void Error_Handler(void) { __disable_irq(); while (1) { } }

/* 与 CubeMX 生成的 SystemClock_Config 结构相同，多了一段 HSE 失败回退 */
static void SystemClock_Config(void)
{
    RCC_OscInitTypeDef osc = {0};
    RCC_ClkInitTypeDef clk = {0};
    uint32_t src = RCC_SYSCLKSOURCE_PLLCLK;
    uint32_t latency = FLASH_LATENCY_2;
    osc.OscillatorType = RCC_OSCILLATORTYPE_HSE;
    osc.HSEState = RCC_HSE_ON;
    osc.HSEPredivValue = RCC_HSE_PREDIV_DIV1;
    osc.PLL.PLLState = RCC_PLL_ON;
    osc.PLL.PLLSource = RCC_PLLSOURCE_HSE;
    osc.PLL.PLLMUL = RCC_PLL_MUL9;

    if (HAL_RCC_OscConfig(&osc) != HAL_OK) {
        /* HSE 没起振：HSI 一直在跑，直接把系统时钟留在 HSI */
        src = RCC_SYSCLKSOURCE_HSI;
        latency = FLASH_LATENCY_0;
    }

    clk.ClockType = RCC_CLOCKTYPE_HCLK | RCC_CLOCKTYPE_SYSCLK |
                    RCC_CLOCKTYPE_PCLK1 | RCC_CLOCKTYPE_PCLK2;
    clk.SYSCLKSource = src;
    clk.AHBCLKDivider = RCC_SYSCLK_DIV1;
    clk.APB1CLKDivider = (src == RCC_SYSCLKSOURCE_HSI) ? RCC_HCLK_DIV1 : RCC_HCLK_DIV2;
    clk.APB2CLKDivider = RCC_HCLK_DIV1;

    if (HAL_RCC_ClockConfig(&clk, latency) != HAL_OK) { Error_Handler(); }
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();
    while (1) { }
}`
    },
    pitfalls: [
      {
        zh: "先提速再设等待周期会在 72 MHz 下取指失败，表现为进 HardFault 或直接跑飞。",
        en: "Raising the frequency before programming wait states breaks instruction fetch at 72 MHz — typical HardFault or a silent hang."
      },
      {
        zh: "HSE 未起振就打开 PLL 并切换，系统会停在等待 PLLRDY 的死循环里。",
        en: "Enabling the PLL and switching to it with a dead crystal leaves the CPU spinning on PLLRDY forever."
      },
      {
        zh: "APB1 超过 36 MHz 会让定时器、串口甚至 RTC 全部异常，但代码不报错。",
        en: "Pushing APB1 past 36 MHz breaks timers, UART and even RTC without any compile-time warning."
      }
    ],
    related: ["wf.gpio-output", "wf.adc-poll", "wf.rtc"],
    tags: ["时钟", "clock", "hse", "pll", "72mhz", "systemclock", "晶振"]
  },

  {
    id: "wf.exti-button",
    p: "exti",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "EXTI0 按键中断：AFIO 映射与 NVIC",
      en: "EXTI0 button interrupt: AFIO mapping and NVIC"
    },
    goal: {
      zh: "让 PA0 的下降沿直接触发中断，在 ISR 里清标志并置事件位，主循环再做实际动作。",
      en: "Let a falling edge on PA0 raise an interrupt, clear the flag and set an event bit inside the ISR, and do the real work in the main loop."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "使能 GPIO 与 AFIO 时钟", en: "Enable the GPIO and AFIO clocks" },
        desc: {
          zh: "EXTI 的端口映射写在 AFIO 的 EXTICR 里，F1 上不开 AFIO 时钟就写不进去。SPL 里 GPIOA 和 AFIO 共用 APB2；HAL 的 HAL_GPIO_Init 在配置中断模式时会自己打开 AFIO。",
          en: "The pin-to-line mapping lives in AFIO_EXTICR, so its clock must be on. SPL enables GPIOA and AFIO on APB2; HAL_GPIO_Init turns AFIO on by itself for interrupt modes."
        },
        fn: ["std.rcc.apb2clockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_AFIO, ENABLE);",
          hal: "__HAL_RCC_GPIOA_CLK_ENABLE();   /* AFIO 由 HAL_GPIO_Init 打开 */"
        }
      },
      {
        title: { zh: "把 PA0 配成上拉输入", en: "Configure PA0 as a pull-up input" },
        desc: {
          zh: "按键接地时用上拉输入，松开读到高、按下读到低，下降沿就是按下动作。同一个引脚号只能映射到一条 EXTI 线。",
          en: "With the button wired to ground use a pull-up: released reads high, pressed reads low, so the falling edge is the press. Only one port per EXTI line number."
        },
        fn: ["std.gpio.init", "hal.gpio.init"],
        code: {
          std: "gpio.GPIO_Pin  = GPIO_Pin_0;\ngpio.GPIO_Mode = GPIO_Mode_IPU;\nGPIO_Init(GPIOA, &gpio);",
          hal: "gpio.Pin  = GPIO_PIN_0;\ngpio.Pull = GPIO_PULLUP;\nHAL_GPIO_Init(GPIOA, &gpio);"
        }
      },
      {
        title: { zh: "把 PA0 映射到 EXTI0", en: "Map PA0 onto EXTI0" },
        desc: {
          zh: "SPL 调用 GPIO_EXTILineConfig 写 AFIO->EXTICR[0]；HAL 没有单独的行映射函数，把 Mode 设成 GPIO_MODE_IT_FALLING 后由 HAL_GPIO_Init 一并完成映射、触发沿与 IMR。",
          en: "SPL writes AFIO->EXTICR[0] through GPIO_EXTILineConfig. HAL has no separate mapping call: setting Mode to GPIO_MODE_IT_FALLING makes HAL_GPIO_Init program EXTICR, the edge and IMR together."
        },
        fn: ["std.exti.lineconfig", "hal.gpio.init"],
        code: {
          std: "GPIO_EXTILineConfig(GPIO_PortSourceGPIOA, GPIO_PinSource0);",
          hal: "gpio.Mode = GPIO_MODE_IT_FALLING;   /* 内部写 EXTICR + FTSR */\ngpio.Pull = GPIO_PULLUP;"
        }
      },
      {
        title: { zh: "选择下降沿并允许中断", en: "Select the falling edge and enable the line" },
        desc: {
          zh: "EXTI_Mode_Interrupt 才会产生中断请求，EXTI_Mode_Event 只置事件标志不触发中断。SPL 的这四个字段一个都不能漏。",
          en: "EXTI_Mode_Interrupt actually raises an IRQ; event mode only sets the event line. All four SPL fields matter — a zeroed struct silently disables the line."
        },
        fn: ["std.exti.init", "hal.exti.irqhandler"],
        code: {
          std: "exti.EXTI_Line    = EXTI_Line0;\nexti.EXTI_Mode    = EXTI_Mode_Interrupt;\nexti.EXTI_Trigger = EXTI_Trigger_Falling;\nexti.EXTI_LineCmd = ENABLE;",
          hal: "/* HAL 在 HAL_GPIO_Init 内已设置 IMR / FTSR，无需额外调用 */\nHAL_GPIO_Init(GPIOA, &gpio);"
        }
      },
      {
        title: { zh: "在 NVIC 中使能 EXTI0_IRQn", en: "Enable EXTI0_IRQn in the NVIC" },
        desc: {
          zh: "EXTI 线 0~4 各有独立向量，线 5~9 和 10~15 共享向量。优先级分组全工程只配一次，NVIC 里还要给这条通道填抢占与子优先级，只调 NVIC_EnableIRQ 则用默认值。",
          en: "EXTI lines 0-4 have their own vectors, lines 5-9 and 10-15 share one. Priority grouping is configured once per project; the NVIC struct also carries the preemption and sub-priority for this channel."
        },
        fn: ["std.nvic.prioritygroup", "std.nvic.init", "hal.nvic.setpriority", "hal.nvic.enableirq"],
        code: {
          std: "nvic.NVIC_IRQChannel = EXTI0_IRQn;\nnvic.NVIC_IRQChannelPreemptionPriority = 2;\nnvic.NVIC_IRQChannelCmd = ENABLE;\nNVIC_Init(&nvic);",
          hal: "HAL_NVIC_SetPriority(EXTI0_IRQn, 2, 0);\nHAL_NVIC_EnableIRQ(EXTI0_IRQn);"
        }
      },
      {
        kind: "isr",
        title: { zh: "在中断服务函数里清挂起位", en: "Clear the pending bit inside the ISR" },
        desc: {
          zh: "SPL 必须先判断再清标志，清完才退出；HAL 把这两步封在 HAL_GPIO_EXTI_IRQHandler 里，用户只重写回调。回调里只置位，不做延时或打印。",
          en: "SPL must test then clear the pending bit before returning. HAL wraps both in HAL_GPIO_EXTI_IRQHandler and dispatches to the user callback, which should only set a flag."
        },
        fn: ["std.exti.getitstatus", "std.exti.clearitpending", "hal.exti.irqhandler", "hal.exti.callback"],
        code: {
          std: "if (EXTI_GetITStatus(EXTI_Line0) != RESET) {\n    EXTI_ClearITPendingBit(EXTI_Line0);\n    key_flag = 1;\n}",
          hal: "void EXTI0_IRQHandler(void) { HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_0); }\nvoid HAL_GPIO_EXTI_Callback(uint16_t pin) { if (pin == GPIO_PIN_0) key_flag = 1; }"
        }
      },
      {
        kind: "end",
        title: { zh: "主循环消费事件标志", en: "Consume the flag in the main loop" },
        desc: {
          zh: "标志变量加 volatile，主循环里取出后立刻清零再处理。机械按键仍有抖动，需要时在软件里补 10~20 ms 判定，不要在 ISR 里延时。",
          en: "Mark the flag volatile, clear it immediately after reading, then act. Mechanical bounce still needs a 10-20 ms software check — never delay inside the ISR."
        },
        fn: ["std.gpio.writebit", "hal.gpio.togglepin"]
      }
    ],
    code: {
      std: `#include "stm32f10x.h"
static volatile uint8_t key_flag = 0;

void EXTI0_IRQHandler(void)
{
    if (EXTI_GetITStatus(EXTI_Line0) != RESET) {
        key_flag = 1;
        EXTI_ClearITPendingBit(EXTI_Line0);
    }
}

int main(void)
{
    GPIO_InitTypeDef gpio;
    EXTI_InitTypeDef exti;
    NVIC_InitTypeDef nvic;

    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_AFIO, ENABLE);
    gpio.GPIO_Pin  = GPIO_Pin_0;
    gpio.GPIO_Mode = GPIO_Mode_IPU;
    GPIO_Init(GPIOA, &gpio);

    GPIO_EXTILineConfig(GPIO_PortSourceGPIOA, GPIO_PinSource0);
    exti.EXTI_Line    = EXTI_Line0;
    exti.EXTI_Mode    = EXTI_Mode_Interrupt;
    exti.EXTI_Trigger = EXTI_Trigger_Falling;
    exti.EXTI_LineCmd = ENABLE;
    EXTI_Init(&exti);

    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    nvic.NVIC_IRQChannel = EXTI0_IRQn;
    nvic.NVIC_IRQChannelPreemptionPriority = 2;
    nvic.NVIC_IRQChannelSubPriority = 0;
    nvic.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&nvic);

    while (1) {
        if (key_flag) { key_flag = 0; GPIO_ResetBits(GPIOA, GPIO_Pin_5); }
    }
}`,
      hal: `#include "stm32f1xx_hal.h"

static volatile uint8_t key_flag = 0;

void EXTI0_IRQHandler(void) { HAL_GPIO_EXTI_IRQHandler(GPIO_PIN_0); }

void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    if (GPIO_Pin == GPIO_PIN_0) { key_flag = 1; }
}

int main(void)
{
    GPIO_InitTypeDef gpio = {0};

    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE();

    gpio.Pin  = GPIO_PIN_0;
    gpio.Mode = GPIO_MODE_IT_FALLING;
    gpio.Pull = GPIO_PULLUP;
    HAL_GPIO_Init(GPIOA, &gpio);

    HAL_NVIC_SetPriority(EXTI0_IRQn, 2, 0);
    HAL_NVIC_EnableIRQ(EXTI0_IRQn);

    while (1) {
        if (key_flag) { key_flag = 0; HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5); }
    }
}`
    },
    pitfalls: [
      {
        zh: "漏掉 AFIO 时钟时 GPIO_EXTILineConfig 写入无效，PA0 永远触发不了中断。",
        en: "Without the AFIO clock, GPIO_EXTILineConfig writes nowhere and PA0 never raises an interrupt."
      },
      {
        zh: "ISR 里不清 EXTI 挂起位，中断退出后会立刻再次进入，表现为主循环完全不跑。",
        en: "Leaving the EXTI pending bit set makes the ISR re-enter immediately, so the main loop appears dead."
      },
      {
        zh: "把耗时打印或 HAL_Delay 放进回调，会拖慢所有同级及更低优先级中断。",
        en: "Blocking prints or HAL_Delay inside the callback stall every interrupt at equal or lower priority."
      }
    ],
    related: ["wf.gpio-input", "wf.gpio-output", "wf.rtc"],
    tags: ["按键", "button", "exti", "外部中断", "afio", "nvic", "中断"]
  },

  {
    id: "wf.adc-poll",
    p: "adc",
    level: 1,
    libs: ["std", "hal"],
    title: {
      zh: "ADC1 单通道轮询采样 PA1",
      en: "ADC1 single-channel polling on PA1"
    },
    goal: {
      zh: "把 PA1 配成模拟输入，校准后软件触发一次转换，读出 12 位原始值并换算成毫伏。",
      en: "Configure PA1 as an analog input, calibrate, trigger one conversion in software, read the 12-bit result and convert it to millivolts."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "开时钟并把引脚设为模拟输入", en: "Enable clocks and set the pin to analog" },
        desc: {
          zh: "ADC1 在 APB2 上，ADC 时钟由 PCLK2 分频得到，F1 规定不能超过 14 MHz，72 MHz 下用 /6 得 12 MHz。PA1 必须是 GPIO_Mode_AIN / GPIO_MODE_ANALOG，否则输入阻抗影响采样。",
          en: "ADC1 sits on APB2 and its clock is PCLK2 divided down; F1 caps it at 14 MHz, so use /6 to get 12 MHz from 72 MHz. PA1 must be analog mode or the input impedance skews the sample."
        },
        fn: ["std.rcc.apb2clockcmd", "hal.rcc.clkenable", "std.gpio.init", "hal.gpio.init"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_ADC1, ENABLE);\nRCC_ADCCLKConfig(RCC_PCLK2_Div6);\ngpio.GPIO_Mode = GPIO_Mode_AIN;",
          hal: "__HAL_RCC_GPIOA_CLK_ENABLE();\n__HAL_RCC_ADC1_CLK_ENABLE();\ngpio.Mode = GPIO_MODE_ANALOG;"
        }
      },
      {
        title: { zh: "设置单次、单通道转换模式", en: "Set single-conversion, single-channel mode" },
        desc: {
          zh: "轮询采样用独立模式、不扫描、不连续、软件触发。SPL 里 ContinuousConvMode 必须显式 DISABLE，否则一次启动会一直转换；HAL 用 ADC_SOFTWARE_START 表示不使用外部触发。",
          en: "Polling uses independent mode, no scan, no continuous conversion and software trigger. Set ContinuousConvMode to DISABLE explicitly in SPL; HAL uses ADC_SOFTWARE_START for no external trigger."
        },
        fn: ["std.adc.init", "hal.adc.init"],
        code: {
          std: "adc.ADC_Mode = ADC_Mode_Independent;\nadc.ADC_ScanConvMode = DISABLE;\nadc.ADC_ContinuousConvMode = DISABLE;\nADC_Init(ADC1, &adc);",
          hal: "hadc1.Init.ScanConvMode = ADC_SCAN_DISABLE;\nhadc1.Init.ContinuousConvMode = DISABLE;\nhadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;\nHAL_ADC_Init(&hadc1);"
        }
      },
      {
        title: { zh: "指定规则通道与采样时间", en: "Pick the regular channel and sampling time" },
        desc: {
          zh: "PA1 对应 ADC_Channel_1，rank 1 是序列里的第一个。信号源阻抗越高，采样时间要越长：55.5 周期在 12 MHz 下约 4.6 µs，适合一般分压与传感器输出。",
          en: "PA1 is ADC_Channel_1 and rank 1 is the first entry of the sequence. Higher source impedance needs longer sampling: 55.5 cycles is about 4.6 us at 12 MHz."
        },
        fn: ["std.adc.regularchannelconfig", "hal.adc.configchannel"],
        code: {
          std: "ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 1, ADC_SampleTime_55Cycles5);",
          hal: "ch.Channel = ADC_CHANNEL_1;\nch.Rank = ADC_REGULAR_RANK_1;\nch.SamplingTime = ADC_SAMPLETIME_55CYCLES_5;"
        }
      },
      {
        kind: "check",
        title: { zh: "使能 ADC 并完成校准", en: "Enable the ADC and calibrate" },
        desc: {
          zh: "F1 的 ADC 必须先 ADC_Cmd / HAL_ADC_Init 上电，才能写校准寄存器。校准要先把校准寄存器复位再启动，两次都要等状态位结束，否则前几个采样值会偏几百 LSB。",
          en: "The F1 ADC must be powered up before calibration registers accept writes. Reset then start the calibration and wait for each status bit, otherwise the first samples are off by hundreds of LSB."
        },
        fn: ["std.adc.cmd", "std.adc.calibration", "hal.adc.calibration"],
        code: {
          std: "ADC_Cmd(ADC1, ENABLE);\nADC_ResetCalibration(ADC1); while (ADC_GetResetCalibrationStatus(ADC1));\nADC_StartCalibration(ADC1); while (ADC_GetCalibrationStatus(ADC1));",
          hal: "HAL_ADCEx_Calibration_Start(&hadc1);   /* F1 阻塞到校准结束 */"
        }
      },
      {
        title: { zh: "软件启动一次转换", en: "Start one conversion in software" },
        desc: {
          zh: "SPL 用 ADC_SoftwareStartConvCmd 置 SWSTART；HAL 用 HAL_ADC_Start，轮询模式下它只是使能 ADC 并置位启动位。",
          en: "SPL sets SWSTART with ADC_SoftwareStartConvCmd; HAL_ADC_Start enables the ADC and sets the start bit for polling mode."
        },
        fn: ["std.adc.softwarestartconvcmd", "hal.adc.start"],
        code: {
          std: "ADC_SoftwareStartConvCmd(ADC1, ENABLE);",
          hal: "HAL_ADC_Start(&hadc1);"
        }
      },
      {
        kind: "check",
        title: { zh: "等 EOC 再读数据寄存器", en: "Wait for EOC, then read the data register" },
        desc: {
          zh: "EOC 置位表示转换完成，读 DR 会自动清 EOC。HAL 用 HAL_ADC_PollForConversion 带超时，超时返回 HAL_TIMEOUT 而不是死等；读完记得 HAL_ADC_Stop。",
          en: "EOC means the conversion finished and reading DR clears it. HAL_ADC_PollForConversion takes a timeout and returns HAL_TIMEOUT instead of spinning; call HAL_ADC_Stop afterwards."
        },
        fn: ["std.adc.getflagstatus", "std.adc.getconversionvalue", "hal.adc.pollforconversion", "hal.adc.getvalue"],
        code: {
          std: "while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET) { }\nraw = ADC_GetConversionValue(ADC1);",
          hal: "if (HAL_ADC_PollForConversion(&hadc1, 10) == HAL_OK) {\n    raw = (uint16_t)HAL_ADC_GetValue(&hadc1);\n}\nHAL_ADC_Stop(&hadc1);"
        }
      },
      {
        kind: "end",
        title: { zh: "按参考电压换算成毫伏", en: "Convert to millivolts against VREF" },
        desc: {
          zh: "12 位满量程是 4095，不是 4096；VREF 用实测的 VDDA（通常 3.3 V）。用整数运算先乘后除避免丢精度，需要更准就外接基准或做两点校准。",
          en: "Full scale is 4095, not 4096, and VREF is the measured VDDA (usually 3.3 V). Multiply before dividing to keep integer precision; for accuracy use an external reference or two-point calibration."
        },
        fn: ["std.adc.getconversionvalue", "hal.adc.getvalue"]
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

static void adc1_pa1_init(void)
{
    GPIO_InitTypeDef gpio;
    ADC_InitTypeDef adc = {0};

    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_ADC1, ENABLE);
    RCC_ADCCLKConfig(RCC_PCLK2_Div6);              /* 72 MHz / 6 = 12 MHz */
    gpio.GPIO_Pin  = GPIO_Pin_1;
    gpio.GPIO_Mode = GPIO_Mode_AIN;
    GPIO_Init(GPIOA, &gpio);

    adc.ADC_Mode               = ADC_Mode_Independent;
    adc.ADC_ScanConvMode       = DISABLE;
    adc.ADC_ContinuousConvMode = DISABLE;
    adc.ADC_ExternalTrigConv   = ADC_ExternalTrigConv_None;
    adc.ADC_NbrOfChannel       = 1;
    ADC_Init(ADC1, &adc);
    ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 1, ADC_SampleTime_55Cycles5);
    ADC_Cmd(ADC1, ENABLE);
    ADC_ResetCalibration(ADC1);
    while (ADC_GetResetCalibrationStatus(ADC1));
    ADC_StartCalibration(ADC1);
    while (ADC_GetCalibrationStatus(ADC1));
}
static uint16_t adc1_read(void)
{
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);
    while (ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC) == RESET) { }
    return ADC_GetConversionValue(ADC1);          /* 读 DR 清 EOC */
}
int main(void)
{
    adc1_pa1_init();
    while (1) {
        volatile uint32_t mv = (uint32_t)adc1_read() * 3300u / 4095u;
        (void)mv;
    }
}`,
      hal: `#include "stm32f1xx_hal.h"
static ADC_HandleTypeDef hadc1;

static void adc1_pa1_init(void)
{
    GPIO_InitTypeDef gpio = {0};
    ADC_ChannelConfTypeDef ch = {0};
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_ADC1_CLK_ENABLE();
    gpio.Pin  = GPIO_PIN_1;
    gpio.Mode = GPIO_MODE_ANALOG;
    HAL_GPIO_Init(GPIOA, &gpio);
    hadc1.Instance = ADC1;
    hadc1.Init.ScanConvMode = ADC_SCAN_DISABLE;
    hadc1.Init.ContinuousConvMode = DISABLE;
    hadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;
    hadc1.Init.NbrOfConversion = 1;
    if (HAL_ADC_Init(&hadc1) != HAL_OK) { while (1) { } }
    ch.Channel = ADC_CHANNEL_1;
    ch.Rank = ADC_REGULAR_RANK_1;
    ch.SamplingTime = ADC_SAMPLETIME_55CYCLES_5;
    HAL_ADC_ConfigChannel(&hadc1, &ch);
    HAL_ADCEx_Calibration_Start(&hadc1);
}
int main(void)
{
    uint16_t raw = 0;
    HAL_Init();
    adc1_pa1_init();
    while (1) {
        HAL_ADC_Start(&hadc1);
        if (HAL_ADC_PollForConversion(&hadc1, 10) == HAL_OK) {
            raw = (uint16_t)HAL_ADC_GetValue(&hadc1);
        }
        HAL_ADC_Stop(&hadc1);
        volatile uint32_t mv = (uint32_t)raw * 3300u / 4095u;
        (void)mv;
    }
}`
    },
    pitfalls: [
      {
        zh: "跳过校准时读数会整体偏移，且随温度漂移，很难靠软件补偿。",
        en: "Skipping calibration offsets every reading and drifts with temperature — hard to compensate in software."
      },
      {
        zh: "ADC 时钟超过 14 MHz 时采样值明显偏低且不稳定，先检查 RCC_ADCCLKConfig / ADC 预分频。",
        en: "Above 14 MHz ADC clock the results sag and jitter; check RCC_ADCCLKConfig or the ADC prescaler first."
      },
      {
        zh: "引脚残留推挽输出配置会让采样值贴近 0 或满量程，PA1 必须真正设成模拟输入。",
        en: "A pin left as push-pull output pins the reading near 0 or full scale; PA1 must really be analog."
      }
    ],
    related: ["wf.adc-dma", "wf.clock-init", "wf.dac-wave"],
    tags: ["adc", "采样", "轮询", "polling", "电压", "voltage", "校准", "calibration"]
  },

  {
    id: "wf.adc-dma",
    p: "adc",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "ADC1 + DMA1_Channel1 多通道扫描采样",
      en: "ADC1 scan with DMA1_Channel1"
    },
    goal: {
      zh: "让 ADC1 连续扫描 PA1、PA2 两个通道，由 DMA 循环写入数组，CPU 不参与搬运，随时读缓冲即可拿到最新值。",
      en: "Let ADC1 scan PA1 and PA2 continuously while DMA copies results into an array in a loop, so the CPU never touches the data path."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "开 ADC、GPIO 与 DMA 三路时钟", en: "Enable ADC, GPIO and DMA clocks" },
        desc: {
          zh: "DMA1 挂在 AHB 上，用 RCC_AHBPeriphClockCmd；ADC1 与 GPIOA 在 APB2。只开 ADC 时钟忘了 DMA，现象是数据永远停在第一次的值。",
          en: "DMA1 is on AHB (RCC_AHBPeriphClockCmd); ADC1 and GPIOA are on APB2. Forgetting the DMA clock leaves the buffer frozen at the first sample."
        },
        fn: ["std.rcc.apb2clockcmd", "std.rcc.ahbclockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_ADC1, ENABLE);\nRCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);",
          hal: "__HAL_RCC_ADC1_CLK_ENABLE();\n__HAL_RCC_DMA1_CLK_ENABLE();"
        }
      },
      {
        title: { zh: "两个引脚都设为模拟输入", en: "Make both pins analog inputs" },
        desc: {
          zh: "PA1、PA2 分别对应 ADC_Channel_1 与 ADC_Channel_2。扫描模式下不要只配一个引脚，否则第二个通道读到的是悬空电压。",
          en: "PA1 and PA2 map to ADC_Channel_1 and ADC_Channel_2. Configure both in scan mode, otherwise the second slot samples a floating pin."
        },
        fn: ["std.gpio.init", "hal.gpio.init"],
        code: {
          std: "gpio.GPIO_Pin  = GPIO_Pin_1 | GPIO_Pin_2;\ngpio.GPIO_Mode = GPIO_Mode_AIN;\nGPIO_Init(GPIOA, &gpio);",
          hal: "gpio.Pin  = GPIO_PIN_1 | GPIO_PIN_2;\ngpio.Mode = GPIO_MODE_ANALOG;\nHAL_GPIO_Init(GPIOA, &gpio);"
        }
      },
      {
        title: { zh: "打开扫描与连续转换", en: "Turn on scan and continuous mode" },
        desc: {
          zh: "扫描模式让 ADC 依次转换 rank 1..n，连续模式让一轮结束后自动重来，这正是 DMA 循环模式的搭档。NbrOfChannel 要与实际配置的 rank 数一致。",
          en: "Scan mode converts rank 1..n in order and continuous mode restarts the sequence automatically — the natural partner of circular DMA. NbrOfChannel must match the number of ranks."
        },
        fn: ["std.adc.init", "hal.adc.init"],
        code: {
          std: "adc.ADC_ScanConvMode       = ENABLE;\nadc.ADC_ContinuousConvMode = ENABLE;\nadc.ADC_NbrOfChannel       = 2;\nADC_Init(ADC1, &adc);",
          hal: "hadc1.Init.ScanConvMode = ADC_SCAN_ENABLE;\nhadc1.Init.ContinuousConvMode = ENABLE;\nhadc1.Init.NbrOfConversion = 2;\nHAL_ADC_Init(&hadc1);"
        }
      },
      {
        title: { zh: "配置两个规则通道与采样时间", en: "Set the two regular ranks and sampling times" },
        desc: {
          zh: "rank 的先后决定数据在缓冲区里的顺序：rank 1 写到 adc_buf[0]。两路信号的源阻抗不同时，可以给每路单独设采样时间。",
          en: "Rank order fixes the order in memory: rank 1 lands in adc_buf[0]. Give each rank its own sampling time when the source impedances differ."
        },
        fn: ["std.adc.regularchannelconfig", "hal.adc.configchannel"],
        code: {
          std: "ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 1, ADC_SampleTime_55Cycles5);\nADC_RegularChannelConfig(ADC1, ADC_Channel_2, 2, ADC_SampleTime_55Cycles5);",
          hal: "ch.Channel = ADC_CHANNEL_1; ch.Rank = ADC_REGULAR_RANK_1;\nHAL_ADC_ConfigChannel(&hadc1, &ch);\nch.Channel = ADC_CHANNEL_2; ch.Rank = ADC_REGULAR_RANK_2;\nHAL_ADC_ConfigChannel(&hadc1, &ch);"
        }
      },
      {
        title: { zh: "配 DMA1_Channel1 为循环搬运", en: "Set DMA1_Channel1 to circular mode" },
        desc: {
          zh: "ADC1 的固定 DMA 请求就是 DMA1_Channel1。外设地址是 ADC->DR 且不自增，内存地址自增，宽度都是半字，缓冲长度等于通道数。HAL 用 __HAL_LINKDMA 把句柄挂到 ADC 上。",
          en: "ADC1's DMA request is hard-wired to DMA1_Channel1. Peripheral address is ADC->DR without increment, memory increments, both half-word, buffer size equals the channel count. HAL links the handles with __HAL_LINKDMA."
        },
        fn: ["std.dma.init", "std.dma.cmd", "hal.dma.link", "hal.adc.start_dma"],
        code: {
          std: "dma.DMA_PeripheralBaseAddr = (uint32_t)&ADC1->DR;\ndma.DMA_MemoryBaseAddr     = (uint32_t)adc_buf;\ndma.DMA_BufferSize         = 2;\ndma.DMA_Mode               = DMA_Mode_Circular;",
          hal: "hdma_adc1.Init.Mode = DMA_CIRCULAR;\nHAL_DMA_Init(&hdma_adc1);\n__HAL_LINKDMA(&hadc1, DMA_Handle, hdma_adc1);\nHAL_ADC_Start_DMA(&hadc1, (uint32_t *)adc_buf, 2);"
        }
      },
      {
        kind: "check",
        title: { zh: "先校准，再启动 ADC 与 DMA", en: "Calibrate first, then start ADC and DMA" },
        desc: {
          zh: "校准必须在 ADON 置位之后、DMA 请求打开之前完成。SPL 顺序是 ADC_Cmd → 校准 → ADC_DMACmd → 软件启动；HAL 的 HAL_ADC_Start_DMA 已包含使能 DMA 与启动转换。",
          en: "Calibration must happen after ADON and before DMA requests are enabled. SPL order: ADC_Cmd, calibrate, ADC_DMACmd, software start. HAL_ADC_Start_DMA already enables DMA and starts conversion."
        },
        fn: ["std.adc.cmd", "std.adc.calibration", "hal.adc.calibration", "std.adc.dmacmd"],
        code: {
          std: "ADC_Cmd(ADC1, ENABLE);\nADC_ResetCalibration(ADC1); while (ADC_GetResetCalibrationStatus(ADC1));\nADC_StartCalibration(ADC1); while (ADC_GetCalibrationStatus(ADC1));\nADC_DMACmd(ADC1, ENABLE); ADC_SoftwareStartConvCmd(ADC1, ENABLE);",
          hal: "HAL_ADCEx_Calibration_Start(&hadc1);\nHAL_ADC_Start_DMA(&hadc1, (uint32_t *)adc_buf, 2);"
        }
      },
      {
        kind: "end",
        title: { zh: "主循环读缓冲，别在 ISR 里算", en: "Read the buffer in the main loop" },
        desc: {
          zh: "循环模式下缓冲一直被覆盖，读两个值时可能出现一个新一个旧；要严格同步就用传输完成中断或双缓冲，在回调里整块拷贝再处理。",
          en: "In circular mode the buffer is constantly overwritten, so a pair of reads can mix old and new samples. For strict consistency use the transfer-complete interrupt or double buffering and copy the whole block in the callback."
        },
        fn: ["std.dma.getflagstatus", "std.dma.clearflag", "hal.dma.irqhandler"]
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

static volatile uint16_t adc_buf[2];              /* [0]=PA1  [1]=PA2 */
int main(void)
{
    GPIO_InitTypeDef gpio;
    ADC_InitTypeDef adc;
    DMA_InitTypeDef dma = {0};
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_ADC1, ENABLE);
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);
    RCC_ADCCLKConfig(RCC_PCLK2_Div6);
    gpio.GPIO_Pin  = GPIO_Pin_1 | GPIO_Pin_2;
    gpio.GPIO_Mode = GPIO_Mode_AIN;
    GPIO_Init(GPIOA, &gpio);
    adc.ADC_Mode               = ADC_Mode_Independent;
    adc.ADC_ScanConvMode       = ENABLE;
    adc.ADC_ContinuousConvMode = ENABLE;
    adc.ADC_ExternalTrigConv   = ADC_ExternalTrigConv_None;
    adc.ADC_NbrOfChannel       = 2;
    ADC_Init(ADC1, &adc);
    ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 1, ADC_SampleTime_55Cycles5);
    ADC_RegularChannelConfig(ADC1, ADC_Channel_2, 2, ADC_SampleTime_55Cycles5);
    dma.DMA_PeripheralBaseAddr = (uint32_t)&ADC1->DR;
    dma.DMA_MemoryBaseAddr     = (uint32_t)adc_buf;
    dma.DMA_DIR                = DMA_DIR_PeripheralSRC;
    dma.DMA_BufferSize         = 2;
    dma.DMA_PeripheralInc      = DMA_PeripheralInc_Disable;
    dma.DMA_MemoryInc          = DMA_MemoryInc_Enable;
    dma.DMA_PeripheralDataSize = DMA_PeripheralDataSize_HalfWord;
    dma.DMA_MemoryDataSize     = DMA_MemoryDataSize_HalfWord;
    dma.DMA_Mode               = DMA_Mode_Circular;
    DMA_Init(DMA1_Channel1, &dma);
    DMA_Cmd(DMA1_Channel1, ENABLE);
    ADC_Cmd(ADC1, ENABLE);
    ADC_ResetCalibration(ADC1); while (ADC_GetResetCalibrationStatus(ADC1));
    ADC_StartCalibration(ADC1); while (ADC_GetCalibrationStatus(ADC1));
    ADC_DMACmd(ADC1, ENABLE);
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);
    while (1) { }
}`,
      hal: `#include "stm32f1xx_hal.h"
static ADC_HandleTypeDef hadc1;
static DMA_HandleTypeDef hdma_adc1;
static uint16_t adc_buf[2];                        /* [0]=PA1  [1]=PA2 */
static void Error_Handler(void) { __disable_irq(); while (1) { } }
int main(void)
{
    GPIO_InitTypeDef gpio = {0};
    ADC_ChannelConfTypeDef ch = {0};
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_ADC1_CLK_ENABLE();
    __HAL_RCC_DMA1_CLK_ENABLE();
    gpio.Pin  = GPIO_PIN_1 | GPIO_PIN_2;
    gpio.Mode = GPIO_MODE_ANALOG;
    HAL_GPIO_Init(GPIOA, &gpio);
    hadc1.Instance = ADC1;
    hadc1.Init.ScanConvMode = ADC_SCAN_ENABLE;
    hadc1.Init.ContinuousConvMode = ENABLE;
    hadc1.Init.ExternalTrigConv = ADC_SOFTWARE_START;
    hadc1.Init.NbrOfConversion = 2;
    if (HAL_ADC_Init(&hadc1) != HAL_OK) { Error_Handler(); }
    ch.Channel = ADC_CHANNEL_1; ch.Rank = ADC_REGULAR_RANK_1;
    ch.SamplingTime = ADC_SAMPLETIME_55CYCLES_5;
    HAL_ADC_ConfigChannel(&hadc1, &ch);
    ch.Channel = ADC_CHANNEL_2; ch.Rank = ADC_REGULAR_RANK_2;
    HAL_ADC_ConfigChannel(&hadc1, &ch);
    hdma_adc1.Instance = DMA1_Channel1;
    hdma_adc1.Init.Direction = DMA_PERIPH_TO_MEMORY;
    hdma_adc1.Init.PeriphInc = DMA_PINC_DISABLE;
    hdma_adc1.Init.MemInc = DMA_MINC_ENABLE;
    hdma_adc1.Init.PeriphDataAlignment = DMA_PDATAALIGN_HALFWORD;
    hdma_adc1.Init.MemDataAlignment = DMA_MDATAALIGN_HALFWORD;
    hdma_adc1.Init.Mode = DMA_CIRCULAR;
    HAL_DMA_Init(&hdma_adc1);
    __HAL_LINKDMA(&hadc1, DMA_Handle, hdma_adc1);
    HAL_ADCEx_Calibration_Start(&hadc1);
    HAL_ADC_Start_DMA(&hadc1, (uint32_t *)adc_buf, 2);
    while (1) { }
}`
    },
    pitfalls: [
      {
        zh: "缓冲区用局部变量且函数已返回，DMA 会写到已释放的栈上，数据随机乱跳。",
        en: "A buffer on the stack that goes out of scope leaves DMA writing into reused memory, so the values look random."
      },
      {
        zh: "DMA 配成 Normal 模式时只搬一轮就停，读到的永远是第一次的结果。",
        en: "DMA in normal mode transfers one round and stops, so the buffer never changes again."
      },
      {
        zh: "ADC 时钟超 14 MHz 或采样时间过短，多通道扫描的串扰会明显变大。",
        en: "ADC clock above 14 MHz or too short a sampling time makes crosstalk between scanned channels obvious."
      }
    ],
    related: ["wf.adc-poll", "wf.dac-wave", "wf.flash-param"],
    tags: ["adc", "dma", "扫描", "scan", "多通道", "circular", "循环"]
  },

  {
    id: "wf.dac-wave",
    p: "dac",
    level: 3,
    libs: ["std", "hal"],
    title: {
      zh: "DAC1 + TIM2 + DMA 输出正弦波",
      en: "DAC1 with TIM2 and DMA: sine output"
    },
    goal: {
      zh: "用 TIM2 的更新事件做触发源，DMA 循环把 32 点正弦表送进 DAC1，PA4 上得到约 977 Hz 的正弦波；改成软件写寄存器即可输出直流电压。",
      en: "Trigger DAC1 from TIM2 update events and let DMA stream a 32-point sine table to PA4 for a ~977 Hz sine. Writing the register manually instead gives a DC level."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "开 DAC、TIM2、DMA1 时钟并配 PA4", en: "Enable DAC/TIM2/DMA1 clocks and set PA4" },
        desc: {
          zh: "DAC 与 TIM2 在 APB1，DMA1 在 AHB。PA4 是 DAC1_OUT1 的固定引脚，必须设成模拟模式，否则输出缓冲被推挽级拉偏。",
          en: "DAC and TIM2 are on APB1, DMA1 on AHB. PA4 is the fixed DAC1_OUT1 pin and must be analog, otherwise the push-pull stage fights the output buffer."
        },
        fn: ["std.rcc.apb1clockcmd", "std.rcc.ahbclockcmd", "std.rcc.apb2clockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB1PeriphClockCmd(RCC_APB1Periph_DAC | RCC_APB1Periph_TIM2, ENABLE);\nRCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);\ngpio.GPIO_Mode = GPIO_Mode_AIN;",
          hal: "__HAL_RCC_DAC_CLK_ENABLE();\n__HAL_RCC_TIM2_CLK_ENABLE();\n__HAL_RCC_DMA1_CLK_ENABLE();\ngpio.Mode = GPIO_MODE_ANALOG;"
        }
      },
      {
        title: { zh: "选 T2_TRGO 触发并打开输出缓冲", en: "Select T2_TRGO and enable the output buffer" },
        desc: {
          zh: "触发源决定 DAC 什么时候取下一个值，这里用 TIM2 的 TRGO；不开触发就会一直输出同一个寄存器值。波形发生器设为 None，我们要自己送表。输出缓冲能增加驱动能力，但只能摆到 0.2 V~VDDA-0.2 V。",
          en: "The trigger decides when the DAC latches the next value; TIM2 TRGO here. Without a trigger it keeps outputting one register value. Wave generation stays None because we supply the table; the output buffer improves drive but limits swing to roughly 0.2 V..VDDA-0.2 V."
        },
        fn: ["std.dac.init", "hal.dac.init"],
        code: {
          std: "dac.DAC_Trigger = DAC_Trigger_T2_TRGO;\ndac.DAC_WaveGeneration = DAC_WaveGeneration_None;\ndac.DAC_OutputBuffer = DAC_OutputBuffer_Enable;\nDAC_Init(DAC_Channel_1, &dac);",
          hal: "ch.DAC_Trigger = DAC_TRIGGER_T2_TRGO;\nch.DAC_OutputBuffer = DAC_OUTPUTBUFFER_ENABLE;\nHAL_DAC_ConfigChannel(&hdac, &ch, DAC_CHANNEL_1);"
        }
      },
      {
        title: { zh: "用 DMA1_Channel3 循环送表", en: "Stream the table with DMA1_Channel3" },
        desc: {
          zh: "DAC1_CH1 的 DMA 请求固定走 DMA1_Channel3，方向是内存到外设，外设地址是 DHR12R1 且不自增，数据宽度半字，循环模式。表里每个值都是 0~4095 的 12 位右对齐码。",
          en: "DAC1_CH1 maps to DMA1_Channel3, memory-to-peripheral, peripheral address DHR12R1 without increment, half-word data, circular mode. Every table entry is a 12-bit right-aligned code from 0 to 4095."
        },
        fn: ["std.dma.init", "std.dma.cmd", "hal.dma.link", "std.dac.dmacmd"],
        code: {
          std: "dma.DMA_PeripheralBaseAddr = (uint32_t)&DAC->DHR12R1;\ndma.DMA_MemoryBaseAddr     = (uint32_t)sine;\ndma.DMA_DIR                = DMA_DIR_PeripheralDST;\ndma.DMA_Mode               = DMA_Mode_Circular;",
          hal: "hdma_dac1.Instance = DMA1_Channel3;\nhdma_dac1.Init.Direction = DMA_MEMORY_TO_PERIPH;\nhdma_dac1.Init.Mode = DMA_CIRCULAR;\n__HAL_LINKDMA(&hdac, DMA_Handle1, hdma_dac1);"
        }
      },
      {
        title: { zh: "把 TIM2 更新事件设为 TRGO", en: "Route the TIM2 update event to TRGO" },
        desc: {
          zh: "采样率 = 72 MHz / ((PSC+1) × (ARR+1))，正弦频率再除以点数。PSC=0、ARR=71 得 1 MHz 触发，32 点表输出 976.6 Hz。TIM2 在 APB1 上，但因为 APB1 有二分频，定时器时钟自动倍频回 72 MHz。",
          en: "Sample rate is 72 MHz / ((PSC+1) x (ARR+1)); the sine frequency divides that by the point count. PSC=0, ARR=71 gives 1 MHz and a 976.6 Hz tone from 32 points. TIM2 sits on APB1 but its clock doubles back to 72 MHz because APB1 is divided."
        },
        fn: ["std.tim.timebaseinit", "std.tim.cmd", "hal.tim.baseinit"],
        code: {
          std: "tb.TIM_Prescaler = 0;\ntb.TIM_Period = 71;\nTIM_TimeBaseInit(TIM2, &tb);\nTIM_SelectOutputTrigger(TIM2, TIM_TRGO_Update);",
          hal: "htim2.Init.Prescaler = 0;\nhtim2.Init.Period = 71;\nHAL_TIM_Base_Init(&htim2);\nmaster.MasterOutputTrigger = TIM_TRGO_UPDATE;"
        }
      },
      {
        kind: "check",
        title: { zh: "启动顺序：DAC → DMA → 定时器", en: "Start order: DAC, DMA, then timer" },
        desc: {
          zh: "先开 DAC 通道和 DMA 请求，最后才 TIM_Cmd，否则定时器已经在触发而 DMA 还没准备好。HAL 里 HAL_DAC_Start_DMA 会把两者一起打开。要直流输出时关掉触发，直接写 0~4095 的码值。",
          en: "Enable the DAC channel and DMA requests first, start the timer last — otherwise triggers arrive before DMA is ready. HAL_DAC_Start_DMA arms both. For DC output disable the trigger and write a code from 0 to 4095."
        },
        fn: ["std.dac.setdata", "hal.dac.setvalue", "hal.dac.start"],
        code: {
          std: "DAC_Cmd(DAC_Channel_1, ENABLE);\nDAC_DMACmd(DAC_Channel_1, ENABLE);\nDMA_Cmd(DMA1_Channel3, ENABLE);\nTIM_Cmd(TIM2, ENABLE);",
          hal: "HAL_DAC_Start(&hdac, DAC_CHANNEL_1);\nHAL_DAC_SetValue(&hdac, DAC_CHANNEL_1, DAC_ALIGN_12B_R, 2048);\nHAL_TIM_Base_Start(&htim2);"
        }
      },
      {
        kind: "end",
        title: { zh: "量波形并算实际频率", en: "Measure the wave and check the maths" },
        desc: {
          zh: "PA4 上应看到偏置 1.65 V、峰峰值约 3.3 V 的正弦。频率不对先查 ARR 和点数，波形有台阶就加点数，输出幅度不足则检查是否开了缓冲以及负载是否过重。",
          en: "PA4 should show a sine centred at 1.65 V with roughly 3.3 V peak-to-peak. Wrong frequency means ARR or point count is off; visible steps mean too few points; low amplitude means check the buffer setting and the load."
        },
        fn: ["std.dac.cmd", "hal.dac.start_dma"]
      }
    ],
    code: {
      std: `#include "stm32f10x.h"
#define SINE_POINTS 32
static const uint16_t sine[SINE_POINTS] = {
    2048, 2447, 2831, 3185, 3495, 3748, 3932, 4038,
    4062, 4038, 3932, 3748, 3495, 3185, 2831, 2447,
    2048, 1649, 1265, 911, 601, 348, 164, 58,
    34, 58, 164, 348, 601, 911, 1265, 1649
};
int main(void)
{
    GPIO_InitTypeDef gpio;
    DAC_InitTypeDef dac = {0};
    DMA_InitTypeDef dma = {0};
    TIM_TimeBaseInitTypeDef tb = {0};
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_DAC | RCC_APB1Periph_TIM2, ENABLE);
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);
    gpio.GPIO_Pin  = GPIO_Pin_4;
    gpio.GPIO_Mode = GPIO_Mode_AIN; GPIO_Init(GPIOA, &gpio);
    dac.DAC_Trigger      = DAC_Trigger_T2_TRGO;
    dac.DAC_OutputBuffer = DAC_OutputBuffer_Enable;   /* 关缓冲时摆不到地 */
    DAC_Init(DAC_Channel_1, &dac);
    DAC_Cmd(DAC_Channel_1, ENABLE);
    dma.DMA_PeripheralBaseAddr = (uint32_t)&DAC->DHR12R1;
    dma.DMA_MemoryBaseAddr     = (uint32_t)sine;
    dma.DMA_DIR                = DMA_DIR_PeripheralDST;
    dma.DMA_BufferSize         = SINE_POINTS;
    dma.DMA_MemoryInc          = DMA_MemoryInc_Enable;
    dma.DMA_PeripheralDataSize = dma.DMA_MemoryDataSize = DMA_MemoryDataSize_HalfWord;
    dma.DMA_Mode               = DMA_Mode_Circular;
    DMA_Init(DMA1_Channel3, &dma);        /* DAC1_CH1 固定用 DMA1_Channel3 */
    DMA_Cmd(DMA1_Channel3, ENABLE);
    DAC_DMACmd(DAC_Channel_1, ENABLE);
    tb.TIM_Prescaler = 0; tb.TIM_CounterMode = TIM_CounterMode_Up;
    tb.TIM_Period    = 71;                /* 72 MHz / 72 = 1 MHz 触发 */
    TIM_TimeBaseInit(TIM2, &tb);
    TIM_SelectOutputTrigger(TIM2, TIM_TRGO_Update);
    TIM_Cmd(TIM2, ENABLE);
    while (1) { }
}`,
      hal: `#include "stm32f1xx_hal.h"
static DAC_HandleTypeDef hdac;
static DMA_HandleTypeDef hdma_dac1;
static TIM_HandleTypeDef htim2;
static const uint16_t sine[32] = {
    2048, 2447, 2831, 3185, 3495, 3748, 3932, 4038,
    4062, 4038, 3932, 3748, 3495, 3185, 2831, 2447,
    2048, 1649, 1265, 911, 601, 348, 164, 58,
    34, 58, 164, 348, 601, 911, 1265, 1649
};
int main(void)
{
    GPIO_InitTypeDef gpio = {0};
    DAC_ChannelConfTypeDef ch = {0};
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE(); __HAL_RCC_DAC_CLK_ENABLE();
    __HAL_RCC_TIM2_CLK_ENABLE();  __HAL_RCC_DMA1_CLK_ENABLE();
    gpio.Pin = GPIO_PIN_4; gpio.Mode = GPIO_MODE_ANALOG;
    HAL_GPIO_Init(GPIOA, &gpio);
    hdac.Instance = DAC; HAL_DAC_Init(&hdac);
    ch.DAC_Trigger = DAC_TRIGGER_T2_TRGO;
    ch.DAC_OutputBuffer = DAC_OUTPUTBUFFER_ENABLE;
    HAL_DAC_ConfigChannel(&hdac, &ch, DAC_CHANNEL_1);
    hdma_dac1.Instance = DMA1_Channel3;
    hdma_dac1.Init.Direction = DMA_MEMORY_TO_PERIPH;
    hdma_dac1.Init.MemInc = DMA_MINC_ENABLE;
    hdma_dac1.Init.PeriphDataAlignment = DMA_PDATAALIGN_HALFWORD;
    hdma_dac1.Init.MemDataAlignment = DMA_MDATAALIGN_HALFWORD;
    hdma_dac1.Init.Mode = DMA_CIRCULAR;
    HAL_DMA_Init(&hdma_dac1);
    __HAL_LINKDMA(&hdac, DMA_Handle1, hdma_dac1);
    htim2.Instance = TIM2;
    htim2.Init.Prescaler = 0; htim2.Init.Period = 71;
    htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
    HAL_TIM_Base_Init(&htim2);
    TIM2->CR2 |= TIM_CR2_MMS_1;          /* TRGO = update 事件 */
    HAL_DAC_Start_DMA(&hdac, DAC_CHANNEL_1, (uint32_t *)sine, 32, DAC_ALIGN_12B_R);
    HAL_TIM_Base_Start(&htim2);
    while (1) { }
}`
    },
    pitfalls: [
      {
        zh: "PA4 留在默认的浮空输入时 DAC 仍能输出，但外接负载会把电压拉偏，先确认引脚是模拟模式。",
        en: "The DAC still outputs with PA4 left floating, but any load skews it — make sure the pin is analog."
      },
      {
        zh: "先启动定时器再开 DMA，前几个触发会丢，波形起始点抖动。",
        en: "Starting the timer before DMA drops the first triggers and jitters the waveform start."
      },
      {
        zh: "输出缓冲关闭时驱动能力很弱（约 15 kΩ 负载就明显跌落），且不能摆到地。",
        en: "With the output buffer off the drive is weak (it sags even at ~15 kOhm) and cannot swing to ground."
      }
    ],
    related: ["wf.adc-dma", "wf.adc-poll", "wf.tim-pwm"],
    tags: ["dac", "正弦波", "sine", "波形", "waveform", "dma", "tim2", "触发"]
  },

  {
    id: "wf.iwdg",
    p: "iwdg",
    level: 1,
    libs: ["std", "hal"],
    title: {
      zh: "独立看门狗 IWDG：1 秒超时保护",
      en: "Independent watchdog: a 1-second timeout"
    },
    goal: {
      zh: "用 LSI 40 kHz 分频出 1 s 超时窗口，启动后只能靠主循环按时喂狗，程序跑飞时自动复位。",
      en: "Derive a 1-second window from the 40 kHz LSI so only periodic refreshes in the main loop keep the MCU alive; a runaway program resets itself."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "解除 IWDG 寄存器写保护", en: "Unlock the IWDG registers" },
        desc: {
          zh: "PR 与 RLR 默认被写保护，必须先写 0x5555 到 KR。HAL 没有等价调用，HAL_IWDG_Init 内部完成这一步。",
          en: "PR and RLR are write-protected; write 0x5555 to KR first. HAL has no equivalent call — HAL_IWDG_Init does it internally."
        },
        fn: ["std.iwdg.writeaccess", "hal.iwdg.init"],
        code: {
          std: "IWDG_WriteAccessCmd(IWDG_WriteAccess_Enable);",
          hal: "hiwdg.Instance = IWDG;   /* 解锁在 HAL_IWDG_Init 内完成 */"
        }
      },
      {
        title: { zh: "设 64 分频与重装值 625", en: "Set prescaler 64 and reload 625" },
        desc: {
          zh: "LSI 标称 40 kHz，40 kHz / 64 = 625 Hz，再数 625 个就是 1 s。重装值上限 4095，需要更长超时只能加大分频。LSI 实际在 30~60 kHz 之间，1 s 只是标称值。",
          en: "LSI is nominally 40 kHz: 40 kHz / 64 = 625 Hz, so 625 counts make 1 s. Reload tops out at 4095, so longer windows need a bigger prescaler. Real LSI varies from 30 to 60 kHz, so 1 s is nominal."
        },
        fn: ["std.iwdg.setprescaler", "std.iwdg.setreload", "hal.iwdg.init"],
        code: {
          std: "IWDG_SetPrescaler(IWDG_Prescaler_64);\nIWDG_SetReload(625);",
          hal: "hiwdg.Init.Prescaler = IWDG_PRESCALER_64;\nhiwdg.Init.Reload = 625;\nHAL_IWDG_Init(&hiwdg);"
        }
      },
      {
        title: { zh: "重装载并启动看门狗", en: "Reload and start the watchdog" },
        desc: {
          zh: "写入 0xCCCC 到 KR 后 IWDG 立即开始计数且无法关闭，只有复位才能停。启动前先把计数器清一次，否则第一次超时时间不准。",
          en: "Writing 0xCCCC to KR starts the counter and it cannot be stopped except by reset. Reload once before enabling so the first window is not shortened."
        },
        fn: ["std.iwdg.reload", "std.iwdg.enable", "hal.iwdg.init"],
        code: {
          std: "IWDG_ReloadCounter();\nIWDG_Enable();",
          hal: "/* HAL_IWDG_Init 已写入 0xCCCC 并重装载 */"
        }
      },
      {
        kind: "check",
        title: { zh: "在主循环按时喂狗", en: "Refresh inside the main loop" },
        desc: {
          zh: "喂狗点要放在所有关键任务之后，间隔必须远小于 1 s。不要在定时器中断里喂——主循环卡死时中断还在跑，看门狗就完全失效了。",
          en: "Place the refresh after all critical work, well inside 1 s. Never refresh from a timer interrupt: the ISR keeps running while the main loop is stuck, which defeats the watchdog."
        },
        fn: ["std.iwdg.reload", "hal.iwdg.refresh", "hal.iwdg.getstate"],
        code: {
          std: "IWDG_ReloadCounter();",
          hal: "HAL_IWDG_Refresh(&hiwdg);"
        }
      },
      {
        kind: "end",
        title: { zh: "验证复位原因与调试冻结", en: "Check the reset cause and debug freeze" },
        desc: {
          zh: "复位后读 RCC_GetFlagStatus(RCC_FLAG_IWDGRST) 可确认是否被看门狗复位。单步调试时内核一停看门狗照样计数，需要 DBGMCU 的 DBG_IWDG_STOP 冻结它，否则会反复重启。",
          en: "After reset, RCC_GetFlagStatus(RCC_FLAG_IWDGRST) tells you the watchdog caused it. While halted in a debugger the counter keeps running; set DBGMCU's DBG_IWDG_STOP to freeze it or the board reboots mid-session."
        },
        fn: ["std.iwdg.setreload", "hal.iwdg.getstate"]
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

static void iwdg_init_1s(void)
{
    /* LSI 40 kHz / 64 = 625 Hz, 625 个计数 = 1.0 s */
    IWDG_WriteAccessCmd(IWDG_WriteAccess_Enable);
    IWDG_SetPrescaler(IWDG_Prescaler_64);
    IWDG_SetReload(625);
    IWDG_ReloadCounter();
    IWDG_Enable();                  /* 此后无法关闭，只能复位 */
}

int main(void)
{
    iwdg_init_1s();

    while (1) {
        /* 业务代码：单次循环耗时必须远小于 1 s */
        IWDG_ReloadCounter();
    }
}`,
      hal: `#include "stm32f1xx_hal.h"

static IWDG_HandleTypeDef hiwdg;

static void iwdg_init_1s(void)
{
    hiwdg.Instance = IWDG;
    hiwdg.Init.Prescaler = IWDG_PRESCALER_64;
    hiwdg.Init.Reload = 625;              /* 40 kHz / 64 * 625 = 1.0 s */

    if (HAL_IWDG_Init(&hiwdg) != HAL_OK) {
        while (1) { }                     /* 看门狗没起来，不要继续跑 */
    }
}

int main(void)
{
    HAL_Init();
    iwdg_init_1s();

    while (1) {
        /* 业务代码 */
        HAL_IWDG_Refresh(&hiwdg);
    }
}`
    },
    pitfalls: [
      {
        zh: "在 SysTick 或定时器中断里喂狗，主循环死锁后中断仍会喂，看门狗形同虚设。",
        en: "Refreshing from SysTick or a timer ISR keeps the dog fed after the main loop hangs — the watchdog becomes useless."
      },
      {
        zh: "调试时单步会触发复位；先置 DBGMCU 的 DBG_IWDG_STOP，或临时把重装值调大。",
        en: "Single-stepping resets the chip; set DBG_IWDG_STOP in DBGMCU or temporarily raise the reload value."
      },
      {
        zh: "LSI 偏差可达 ±50%，按 40 kHz 算出的 1 s 在真实板子上可能是 0.7 s 或 1.5 s。",
        en: "LSI can be off by tens of percent, so a nominal 1 s may be 0.7 s or 1.5 s on a real board."
      }
    ],
    related: ["wf.clock-init", "wf.rtc", "wf.flash-param"],
    tags: ["看门狗", "iwdg", "watchdog", "复位", "reset", "lsi"]
  },

  {
    id: "wf.rtc",
    p: "rtc",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "RTC 日历与秒中断（LSE 32.768 kHz）",
      en: "RTC calendar and second interrupt from a 32.768 kHz LSE"
    },
    goal: {
      zh: "用 LSE 驱动 RTC，分频出 1 Hz 走时，开启秒中断，并在 HAL 下遵守“先读时间、再读日期”的读取顺序。",
      en: "Clock the RTC from LSE, divide it to 1 Hz, enable the second interrupt, and in HAL always read the date right after the time."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "开 PWR/BKP 时钟并解锁备份域", en: "Enable PWR/BKP clocks and unlock the backup domain" },
        desc: {
          zh: "RTC 寄存器在备份域里，默认写保护。F1 上要先开 PWR 与 BKP 时钟，再置 DBP 位；HAL 对应 __HAL_RCC_PWR_CLK_ENABLE 与 HAL_PWR_EnableBkUpAccess。",
          en: "RTC registers live in the backup domain and are write-protected. On F1 enable the PWR and BKP clocks, then set DBP; HAL wraps this in __HAL_RCC_PWR_CLK_ENABLE and HAL_PWR_EnableBkUpAccess."
        },
        fn: ["std.rcc.apb1clockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR | RCC_APB1Periph_BKP, ENABLE);\nPWR_BackupAccessCmd(ENABLE);",
          hal: "__HAL_RCC_PWR_CLK_ENABLE();\n__HAL_RCC_BKP_CLK_ENABLE();\nHAL_PWR_EnableBkUpAccess();"
        }
      },
      {
        title: { zh: "启动 LSE 并等待起振", en: "Start LSE and wait for it" },
        desc: {
          zh: "32.768 kHz 晶振起振比 HSE 慢得多，典型 1~2 s，必须轮询 LSERDY 而不是固定延时。HAL 用 RCC_OSCILLATORTYPE_LSE 交给 HAL_RCC_OscConfig，它自带超时。",
          en: "A 32.768 kHz crystal takes 1-2 s to start, far slower than HSE — poll LSERDY instead of using a fixed delay. HAL passes RCC_OSCILLATORTYPE_LSE to HAL_RCC_OscConfig, which has its own timeout."
        },
        fn: ["hal.rcc.oscinit"],
        code: {
          std: "RCC_LSEConfig(RCC_LSE_ON);\nwhile (RCC_GetFlagStatus(RCC_FLAG_LSERDY) == RESET) { }",
          hal: "osc.OscillatorType = RCC_OSCILLATORTYPE_LSE;\nosc.LSEState = RCC_LSE_ON;\nHAL_RCC_OscConfig(&osc);"
        }
      },
      {
        kind: "check",
        title: { zh: "选 LSE 作 RTC 时钟并等同步", en: "Select LSE and wait for synchronisation" },
        desc: {
          zh: "选完时钟源后必须 RCC_RTCCLKCmd(ENABLE) 才真正供给 RTC，再调用 RTC_WaitForSynchro 等 APB1 与 RTC 同步。漏掉同步时读到的计数器是旧值。HAL 用 __HAL_RCC_RTC_CONFIG + __HAL_RCC_RTC_ENABLE。",
          en: "After picking the source, RCC_RTCCLKCmd(ENABLE) actually feeds the RTC, then RTC_WaitForSynchro aligns it with APB1. Skip the sync and you read a stale counter. HAL uses __HAL_RCC_RTC_CONFIG plus __HAL_RCC_RTC_ENABLE."
        },
        fn: ["std.rtc.waitforsynchro", "hal.rcc.clkenable"],
        code: {
          std: "RCC_RTCCLKConfig(RCC_RTCCLKSource_LSE);\nRCC_RTCCLKCmd(ENABLE);\nRTC_WaitForSynchro();",
          hal: "__HAL_RCC_RTC_CONFIG(RCC_RTCCLKSOURCE_LSE);\n__HAL_RCC_RTC_ENABLE();"
        }
      },
      {
        title: { zh: "分频到 1 Hz 并写入基准时间", en: "Divide to 1 Hz and load a base time" },
        desc: {
          zh: "F1 的 RTC 本质是 32 位秒计数器，预分频写 32767 才得到 1 Hz（计数器从 0 数到 32767）。写 RTC 寄存器后必须 RTC_WaitForLastTask，否则下一次写入会被丢弃。HAL 用 RTC_AUTO_1_SECOND 表示同样的分频。",
          en: "The F1 RTC is a 32-bit seconds counter; program 32767 for 1 Hz because it counts 0..32767. After every RTC write call RTC_WaitForLastTask or the next write is lost. HAL expresses the same divider as RTC_AUTO_1_SECOND."
        },
        fn: ["std.rtc.setcounter", "std.rtc.waitforlasttask", "hal.rtc.init", "hal.rtc.settime", "hal.rtc.setdate"],
        code: {
          std: "RTC_SetPrescaler(32767);\nRTC_WaitForLastTask();\nRTC_SetCounter(1700000000u);   /* 基准秒计数 */\nRTC_WaitForLastTask();",
          hal: "hrtc.Init.AsynchPrediv = RTC_AUTO_1_SECOND;\nHAL_RTC_Init(&hrtc);\nHAL_RTC_SetTime(&hrtc, &t, RTC_FORMAT_BIN);\nHAL_RTC_SetDate(&hrtc, &d, RTC_FORMAT_BIN);"
        }
      },
      {
        kind: "isr",
        title: { zh: "打开秒中断并在 ISR 清标志", en: "Enable the second interrupt and clear it in the ISR" },
        desc: {
          zh: "秒中断走 RTC_IRQn，不经过 EXTI（只有闹钟用 EXTI17）。SPL 用 RTC_ITConfig + RTC_ClearITPendingBit；F1 的 HAL 没有提供秒中断 API，需要直接置位 RTC->CRL 的 SECIE，清标志后同样要等一次写完成。",
          en: "The second interrupt uses RTC_IRQn, not EXTI (only the alarm goes through EXTI17). SPL has RTC_ITConfig and RTC_ClearITPendingBit; F1 HAL exposes no second-interrupt API, so set SECIE in RTC->CRL directly and wait for the write to finish after clearing."
        },
        fn: ["std.rtc.itconfig", "std.rtc.getcounter", "std.nvic.enableirq", "hal.nvic.enableirq"],
        code: {
          std: "RTC_ITConfig(RTC_IT_SEC, ENABLE);\nNVIC_EnableIRQ(RTC_IRQn);\n/* ISR: RTC_ClearITPendingBit(RTC_IT_SEC); RTC_WaitForLastTask(); */",
          hal: "RTC->CRL |= RTC_CRL_SECIE;   /* HAL 未封装秒中断 */\nNVIC_EnableIRQ(RTC_IRQn);"
        }
      },
      {
        kind: "check",
        title: { zh: "HAL 读时间后必须读日期", en: "In HAL, read the date right after the time" },
        desc: {
          zh: "HAL_RTC_GetTime 会锁住影子寄存器，只有紧接着调用 HAL_RTC_GetDate 才解锁；漏掉这一步，时间会一直停在第一次读到的值。SPL 直接返回秒计数，没有这个约束，但要自己做年月日换算。",
          en: "HAL_RTC_GetTime locks the shadow registers; only a following HAL_RTC_GetDate unlocks them. Skip it and the time freezes at the first read. SPL returns a plain counter without this rule, but you must convert to Y/M/D yourself."
        },
        fn: ["hal.rtc.gettime", "hal.rtc.getdate", "std.rtc.getcounter"],
        code: {
          std: "uint32_t sec = RTC_GetCounter();   /* SPL 只有秒计数 */",
          hal: "HAL_RTC_GetTime(&hrtc, &t, RTC_FORMAT_BIN);\nHAL_RTC_GetDate(&hrtc, &d, RTC_FORMAT_BIN);   /* 缺一不可 */"
        }
      },
      {
        kind: "end",
        title: { zh: "验证掉电走时与年份处理", en: "Verify backup operation and the year offset" },
        desc: {
          zh: "断电后 VBAT 供电即可继续走时，重新上电不要重复初始化分频与计数器。HAL 的 sDate.Year 只存 0~99，显示时要加 2000；SPL 得到的秒计数可用标准库的 gmtime/localtime 转成日历。",
          en: "With VBAT present the clock keeps running through power loss, so skip the divider and counter init on the next boot. HAL stores the year as 0-99, so add 2000 for display; with SPL feed the counter into gmtime/localtime."
        },
        fn: ["std.rtc.getdivider", "std.rtc.getcounter", "hal.rtc.getdate"]
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

static volatile uint32_t rtc_seconds;

void RTC_IRQHandler(void)
{
    if (RTC_GetITStatus(RTC_IT_SEC) != RESET) {
        RTC_ClearITPendingBit(RTC_IT_SEC);
        RTC_WaitForLastTask();
        rtc_seconds = RTC_GetCounter();
    }
}

int main(void)
{
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_PWR | RCC_APB1Periph_BKP, ENABLE);
    PWR_BackupAccessCmd(ENABLE);

    RCC_LSEConfig(RCC_LSE_ON);
    while (RCC_GetFlagStatus(RCC_FLAG_LSERDY) == RESET) { }   /* 起振约 2 s */

    RCC_RTCCLKConfig(RCC_RTCCLKSource_LSE);
    RCC_RTCCLKCmd(ENABLE);
    RTC_WaitForSynchro();

    RTC_SetPrescaler(32767);          /* 32768 / 32768 = 1 Hz */
    RTC_WaitForLastTask();
    RTC_SetCounter(1700000000u);      /* 基准时间，可改成上位机下发的值 */
    RTC_WaitForLastTask();

    RTC_ITConfig(RTC_IT_SEC, ENABLE);
    NVIC_EnableIRQ(RTC_IRQn);

    while (1) {
        uint32_t now = rtc_seconds;        /* 秒中断里更新，交给 gmtime 换算 */
        (void)now;
    }
}`,
      hal: `#include "stm32f1xx_hal.h"
RTC_HandleTypeDef hrtc;
static volatile uint8_t sec_flag;
void RTC_IRQHandler(void)
{
    if (RTC->CRL & RTC_CRL_SECF) {          /* F1 HAL 未封装秒中断 */
        RTC->CRL &= ~RTC_CRL_SECF;
        sec_flag = 1;
    }
}
void HAL_RTC_MspInit(RTC_HandleTypeDef *h)
{
    RCC_OscInitTypeDef osc = {0};    __HAL_RCC_PWR_CLK_ENABLE();
    __HAL_RCC_BKP_CLK_ENABLE();
    HAL_PWR_EnableBkUpAccess();
    osc.OscillatorType = RCC_OSCILLATORTYPE_LSE;
    osc.LSEState = RCC_LSE_ON;
    if (HAL_RCC_OscConfig(&osc) != HAL_OK) { while (1) { } }
    __HAL_RCC_RTC_CONFIG(RCC_RTCCLKSOURCE_LSE); __HAL_RCC_RTC_ENABLE();
}
int main(void)
{
    RTC_TimeTypeDef t = {0};
    RTC_DateTypeDef d = {0};
    HAL_Init();
    hrtc.Instance = RTC; hrtc.Init.AsynchPrediv = RTC_AUTO_1_SECOND;
    if (HAL_RTC_Init(&hrtc) != HAL_OK) { while (1) { } }

    t.Hours = 12; t.Minutes = 0; t.Seconds = 0;
    HAL_RTC_SetTime(&hrtc, &t, RTC_FORMAT_BIN);
    d.WeekDay = RTC_WEEKDAY_MONDAY; d.Month = RTC_MONTH_JANUARY;
    d.Date = 1; d.Year = 26;                 /* 2026 */
    HAL_RTC_SetDate(&hrtc, &d, RTC_FORMAT_BIN);
    RTC->CRL |= RTC_CRL_SECIE; NVIC_EnableIRQ(RTC_IRQn);

    while (1) {
        HAL_RTC_GetTime(&hrtc, &t, RTC_FORMAT_BIN);
        HAL_RTC_GetDate(&hrtc, &d, RTC_FORMAT_BIN);   /* 必须紧跟其后 */
    }
}`
    },
    pitfalls: [
      {
        zh: "HAL 里只调 HAL_RTC_GetTime 不读日期，影子寄存器一直锁着，时间会冻住不动。",
        en: "Calling only HAL_RTC_GetTime keeps the shadow registers locked, so the time appears frozen."
      },
      {
        zh: "没解锁备份域就写 RTC，写入全部被忽略且不报错；漏掉 BKP 时钟同理。",
        en: "Writing RTC without unlocking the backup domain is silently ignored, and so is skipping the BKP clock."
      },
      {
        zh: "每次上电都重新设置分频和计数器，会把手表已经走的时间清零，应判断备份域是否已配置。",
        en: "Re-initialising divider and counter on every boot wipes the running time; check whether the backup domain is already configured."
      }
    ],
    related: ["wf.clock-init", "wf.exti-button", "wf.iwdg"],
    tags: ["rtc", "实时时钟", "日历", "calendar", "lse", "秒中断", "备份域"]
  },

  {
    id: "wf.flash-param",
    p: "flash",
    level: 3,
    libs: ["std", "hal"],
    title: {
      zh: "片内 Flash 保存掉电参数",
      en: "Store power-off parameters in on-chip flash"
    },
    goal: {
      zh: "把结构体参数写进 Flash 最后一页：解锁、清标志、擦页、按字写入、回读校验、上锁，并带上 magic 与 CRC 判断数据是否有效。",
      en: "Save a parameter struct into the last flash page: unlock, clear flags, erase, program word by word, verify, lock — with a magic word and CRC so stale data is detectable."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "选一页不装代码的 Flash", en: "Pick a page that holds no code" },
        desc: {
          zh: "参数区必须避开程序，通常取最后一页：中容量 F103C8 是 64 KB，页大小 1 KB，最后一页起始地址 0x0800FC00；大容量器件页大小是 2 KB，地址要按实际型号重算。",
          en: "Keep parameters away from code, typically the last page. A 64 KB F103C8 has 1 KB pages, so the last page starts at 0x0800FC00; high-density parts use 2 KB pages, so recompute for your device."
        },
        fn: ["std.flash.erasepage", "hal.flash.erase"],
        code: {
          std: "#define PARAM_ADDR 0x0800FC00u    /* 64 KB 器件的最后一页，1 KB */",
          hal: "#define PARAM_ADDR 0x0800FC00u    /* 按芯片页大小核对 */"
        }
      },
      {
        title: { zh: "解锁并清掉旧错误标志", en: "Unlock and clear stale error flags" },
        desc: {
          zh: "解锁只影响控制寄存器，不改保护级别。写之前清 EOP/PGERR/WRPRTERR，否则上一次的失败标志会干扰本次返回值判断。",
          en: "Unlocking only touches the control register, not the write protection. Clear EOP/PGERR/WRPRTERR first so an old failure does not confuse this run's status checks."
        },
        fn: ["std.flash.unlock", "hal.flash.unlock"],
        code: {
          std: "FLASH_Unlock();\nFLASH_ClearFlag(FLASH_FLAG_EOP | FLASH_FLAG_PGERR | FLASH_FLAG_WRPRTERR);",
          hal: "HAL_FLASH_Unlock();\n__HAL_FLASH_CLEAR_FLAG(FLASH_FLAG_EOP | FLASH_FLAG_PGERR | FLASH_FLAG_WRPRTERR);"
        }
      },
      {
        title: { zh: "整页擦除，等它真正完成", en: "Erase the whole page and wait" },
        desc: {
          zh: "擦除以页为单位，传入页内任意地址即可。擦除期间 CPU 取指会被暂停，一次约 20~40 ms，别在通信超时窗口里做。HAL 用 FLASH_EraseInitTypeDef 指定页地址与数量，失败时 PageError 给出出错页。",
          en: "Erase works per page; pass any address inside it. The CPU stalls for roughly 20-40 ms because flash fetches pause, so avoid doing it inside a tight communication timeout. HAL uses FLASH_EraseInitTypeDef with address and page count, and PageError reports failures."
        },
        fn: ["std.flash.erasepage", "hal.flash.erase"],
        code: {
          std: "FLASH_Status st = FLASH_ErasePage(PARAM_ADDR);\nif (st != FLASH_COMPLETE) { FLASH_Lock(); return 0; }",
          hal: "er.TypeErase = FLASH_TYPEERASE_PAGES;\ner.PageAddress = PARAM_ADDR; er.NbPages = 1;\nHAL_FLASHEx_Erase(&er, &page_err);"
        }
      },
      {
        title: { zh: "按 32 位字顺序写入", en: "Program 32-bit words in order" },
        desc: {
          zh: "F1 只支持半字与字编程，地址必须 4 字节对齐，且目标区域必须是 0xFF——没擦就写会置 PGERR。HAL_FLASH_Program 的数据参数是 64 位，传 uint32_t 会自动提升。",
          en: "F1 supports half-word and word programming only; addresses must be 4-byte aligned and the target must read 0xFF. Programming without erasing sets PGERR. HAL_FLASH_Program takes a 64-bit data argument, so a uint32_t promotes automatically."
        },
        fn: ["std.flash.programword", "hal.flash.program"],
        code: {
          std: "for (i = 0; i < sizeof(param_t) / 4u; i++)\n    FLASH_ProgramWord(PARAM_ADDR + i * 4u, src[i]);",
          hal: "for (i = 0; i < sizeof(param_t) / 4u; i++)\n    HAL_FLASH_Program(FLASH_TYPEPROGRAM_WORD, PARAM_ADDR + i * 4u, src[i]);"
        }
      },
      {
        kind: "check",
        title: { zh: "回读校验并核对 magic 与 CRC", en: "Read back and check magic plus CRC" },
        desc: {
          zh: "编程返回值只说明时序成功，必须 memcmp 回读确认。业务上再加一个 magic 和 CRC：全 0xFF 的空页、写到一半掉电的页都能靠它识别出来，不要直接信任读到的值。",
          en: "A successful return only means the timing worked — memcmp the page. Add a magic word and CRC too: a blank 0xFF page and a half-written page are both caught that way. Never trust the raw contents."
        },
        fn: ["std.flash.programword", "hal.flash.program"]
      },
      {
        title: { zh: "无论成败都要重新上锁", en: "Lock again on every path" },
        desc: {
          zh: "每次退出前调用 FLASH_Lock / HAL_FLASH_Lock，包括失败分支。上锁后误写指针也改不动 Flash，这是最后一道保护。",
          en: "Call FLASH_Lock or HAL_FLASH_Lock on every exit path, failures included. With the lock set, a stray pointer cannot corrupt flash — the last line of defence."
        },
        fn: ["std.flash.lock", "hal.flash.lock"],
        code: {
          std: "FLASH_Lock();",
          hal: "HAL_FLASH_Lock();"
        }
      },
      {
        kind: "end",
        title: { zh: "控制写入次数与掉电风险", en: "Limit write cycles and power-loss risk" },
        desc: {
          zh: "F1 的 Flash 擦写寿命约 1 万次，参数变化频繁时用两页轮流写或先比对新旧值再决定是否擦写。擦除中掉电会丢失整页数据，重要参数请保留默认值或做双备份。",
          en: "F1 flash endures about 10k erase cycles. For frequently changing data alternate between two pages, or compare before erasing. A power loss during erase loses the whole page, so keep defaults or a second copy."
        },
        fn: ["std.flash.erasepage", "hal.flash.erase"]
      }
    ],
    code: {
      std: `#include "stm32f10x.h"
#include <string.h>

#define PARAM_ADDR 0x0800FC00u          /* 64 KB 器件最后一页，1 KB */
#define PARAM_MAGIC 0x50415241u
typedef struct { uint32_t magic, boot_cnt, crc; } param_t;
static param_t ram;

static uint8_t param_save(const param_t *p)
{
    const uint32_t *src = (const uint32_t *)p;
    uint32_t i;
    FLASH_Unlock();
    FLASH_ClearFlag(FLASH_FLAG_EOP | FLASH_FLAG_PGERR | FLASH_FLAG_WRPRTERR);
    if (FLASH_ErasePage(PARAM_ADDR) != FLASH_COMPLETE) {
        FLASH_Lock();
        return 0;
    }
    for (i = 0; i < sizeof(param_t) / 4u; i++) {
        if (FLASH_ProgramWord(PARAM_ADDR + i * 4u, src[i]) != FLASH_COMPLETE) {
            FLASH_Lock();
            return 0;
        }
    }
    FLASH_Lock();
    return memcmp((const void *)PARAM_ADDR, p, sizeof(param_t)) == 0;
}

int main(void)
{
    const param_t *stored = (const param_t *)PARAM_ADDR;
    ram.magic = PARAM_MAGIC;
    ram.boot_cnt = (stored->magic == PARAM_MAGIC) ? stored->boot_cnt + 1u : 1u;
    ram.crc = ram.magic ^ ram.boot_cnt;
    (void)param_save(&ram);
    while (1) { }
}`,
      hal: `#include "stm32f1xx_hal.h"
#include <string.h>
#define PARAM_ADDR 0x0800FC00u          /* 64 KB 器件最后一页，1 KB */
#define PARAM_MAGIC 0x50415241u
typedef struct { uint32_t magic, boot_cnt, crc; } param_t;

static uint8_t param_save(const param_t *p)
{
    FLASH_EraseInitTypeDef er = {0};
    const uint32_t *src = (const uint32_t *)p;
    uint32_t page_err = 0, i;
    HAL_FLASH_Unlock();
    __HAL_FLASH_CLEAR_FLAG(FLASH_FLAG_EOP | FLASH_FLAG_PGERR | FLASH_FLAG_WRPRTERR);
    er.TypeErase = FLASH_TYPEERASE_PAGES; er.PageAddress = PARAM_ADDR;
    er.NbPages = 1;
    if (HAL_FLASHEx_Erase(&er, &page_err) != HAL_OK) {
        HAL_FLASH_Lock();
        return 0;
    }
    for (i = 0; i < sizeof(param_t) / 4u; i++) {
        if (HAL_FLASH_Program(FLASH_TYPEPROGRAM_WORD, PARAM_ADDR + i * 4u, src[i]) != HAL_OK) {
            HAL_FLASH_Lock();
            return 0;
        }
    }
    HAL_FLASH_Lock();
    return memcmp((const void *)PARAM_ADDR, p, sizeof(param_t)) == 0;
}

int main(void)
{
    const param_t *stored = (const param_t *)PARAM_ADDR;
    param_t ram;
    HAL_Init();
    ram.magic = PARAM_MAGIC;
    ram.boot_cnt = (stored->magic == PARAM_MAGIC) ? stored->boot_cnt + 1u : 1u;
    ram.crc = ram.magic ^ ram.boot_cnt;
    (void)param_save(&ram);
    while (1) { }
}`
    },
    pitfalls: [
      {
        zh: "参数页和代码页重叠时，擦除会把程序一起抹掉，链接脚本里要把这一页排除在外。",
        en: "If the parameter page overlaps code, erasing it wipes the program — exclude that page in the linker script."
      },
      {
        zh: "写完不校验就认为成功；电压跌落或未擦除时数据可能只是部分写入。",
        en: "Assuming success without verification hides partial writes caused by low voltage or an unerased page."
      },
      {
        zh: "在 IWDG 超时窗口内做擦除要留足余量，擦一页 20~40 ms，期间无法喂狗。",
        en: "Keep headroom for the IWDG window: one page erase stalls 20-40 ms and you cannot refresh during it."
      }
    ],
    related: ["wf.iwdg", "wf.clock-init", "wf.adc-dma"],
    tags: ["flash", "参数", "parameter", "掉电保存", "保存", "擦除", "erase", "掉电"]
  },
  {
    id: "wf.nvic-priority",
    p: "nvic",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "NVIC 中断优先级：分组、抢占与使能",
      en: "NVIC priorities: grouping, preemption and enabling"
    },
    goal: {
      zh: "以 USART1 接收中断为例，把“分组只配一次 → 设抢占/子优先级 → 使能通道 → ISR 处理 → 关闭或重配”的顺序固定下来。",
      en: "Using the USART1 receive interrupt as the example, lock down the order: configure grouping once, set preemption/sub-priority, enable the channel, handle the ISR, then disable or reconfigure."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "先选优先级分组，而且只选一次", en: "Pick the priority grouping once" },
        desc: {
          zh: "分组决定抢占位与子优先级位各占几位，改变分组会让所有已配置的优先级被重新解释。标准库在 main 初始化阶段调用一次 NVIC_PriorityGroupConfig；HAL 由 HAL_Init 默认设为 GROUP_4，需要别的分组时必须在配置任何中断前显式修改。",
          en: "The grouping splits the priority byte into preemption and sub-priority bits; changing it later reinterprets every configured priority. SPL calls NVIC_PriorityGroupConfig once during init. HAL_Init defaults to GROUP_4, so call HAL_NVIC_SetPriorityGrouping before configuring any interrupt if you need a different split."
        },
        fn: ["std.nvic.prioritygroup", "hal.nvic.setprioritygrouping"],
        code: {
          std: "/* 2 位抢占 + 2 位子优先级：抢占 0~3，子优先级 0~3 */\nNVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);",
          hal: "/* HAL_Init() 默认 GROUP_4；这一行要在所有中断配置之前 */\nHAL_NVIC_SetPriorityGrouping(NVIC_PRIORITYGROUP_2);"
        }
      },
      {
        title: { zh: "填写通道、抢占优先级与子优先级", en: "Fill in the channel, preemption and sub-priority" },
        desc: {
          zh: "数字越小优先级越高。抢占优先级不同时可以直接嵌套打断；抢占相同才比较子优先级，子优先级不能互相打断。标准库把四个字段填进 NVIC_InitTypeDef，HAL 用 HAL_NVIC_SetPriority 一次设置两个数值。",
          en: "Lower numbers mean higher priority. Different preemption levels can nest and preempt each other; equal preemption falls back to sub-priority, which cannot preempt. SPL fills four fields of NVIC_InitTypeDef; HAL sets both numbers with HAL_NVIC_SetPriority."
        },
        fn: ["std.nvic.init", "hal.nvic.setpriority"],
        code: {
          std: "NVIC_InitTypeDef nvic;\nnvic.NVIC_IRQChannel = USART1_IRQn;\nnvic.NVIC_IRQChannelPreemptionPriority = 1;\nnvic.NVIC_IRQChannelSubPriority = 1;\nnvic.NVIC_IRQChannelCmd = ENABLE;\nNVIC_Init(&nvic);",
          hal: "HAL_NVIC_SetPriority(USART1_IRQn, 1, 1);\nHAL_NVIC_EnableIRQ(USART1_IRQn);"
        }
      },
      {
        title: { zh: "使能通道，确认外设侧也开了中断", en: "Enable the channel and the peripheral-side interrupt" },
        desc: {
          zh: "NVIC 使能只是打开 CPU 侧的入口；USART 的 RXNEIE、EXTI 的 IMR 等外设使能位仍然要单独打开。只调 NVIC_EnableIRQ 而不设优先级时，该通道会按优先级 0（最高）运行。",
          en: "Enabling the NVIC channel only opens the CPU-side gate; the peripheral enable bit (USART RXNEIE, EXTI IMR, and so on) must still be set. Calling NVIC_EnableIRQ without a priority leaves the channel at priority 0, the highest."
        },
        fn: ["std.nvic.enableirq", "hal.nvic.enableirq", "std.usart.itconfig", "hal.usart.receive_it"],
        code: {
          std: "NVIC_EnableIRQ(USART1_IRQn);          /* NVIC 侧 */\nUSART_ITConfig(USART1, USART_IT_RXNE, ENABLE);  /* 外设侧 */",
          hal: "HAL_NVIC_EnableIRQ(USART1_IRQn);\nHAL_UART_Receive_IT(&huart1, &rx_byte, 1);"
        }
      },
      {
        kind: "isr",
        title: { zh: "ISR 里判标志、清标志、置事件位", en: "Test, clear and signal inside the ISR" },
        desc: {
          zh: "先判断具体中断源再处理，处理完清对应挂起位；漏清会立刻再次进入中断。标准库自己写判断与清除；HAL 把入口交给 HAL_UART_IRQHandler，再回调 HAL_UART_RxCpltCallback。ISR 中不要调用 HAL_Delay 或 printf。",
          en: "Test the exact interrupt source, handle it, then clear the matching pending bit — a missed clear re-enters immediately. SPL does the test and clear by hand; HAL routes through HAL_UART_IRQHandler to HAL_UART_RxCpltCallback. Never call HAL_Delay or printf inside an ISR."
        },
        fn: ["std.usart.getitstatus", "std.usart.receivedata", "std.usart.clearitpending", "hal.usart.irqhandler", "hal.usart.rxcpltcallback"],
        code: {
          std: "void USART1_IRQHandler(void)\n{\n    if (USART_GetITStatus(USART1, USART_IT_RXNE) != RESET) {\n        rx_byte = (uint8_t)USART_ReceiveData(USART1);\n        USART_ClearITPendingBit(USART1, USART_IT_RXNE);\n        rx_flag = 1;\n    }\n}",
          hal: "void USART1_IRQHandler(void)\n{\n    HAL_UART_IRQHandler(&huart1);\n}\n\nvoid HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)\n{\n    if (huart->Instance == USART1) { rx_flag = 1; }\n}"
        }
      },
      {
        kind: "end",
        title: { zh: "重配或低功耗前先关通道", en: "Disable the channel before reconfiguring or sleeping" },
        desc: {
          zh: "外设重新初始化、切换波特率或进入 STOP 前，先关 NVIC 通道并清掉挂起位，避免半配置状态触发中断。主循环只消费标志位，真正的解析、打印和状态机都放在主循环里。",
          en: "Before re-initialising a peripheral, changing baud rate or entering STOP, disable the NVIC channel and clear pending bits so a half-configured peripheral cannot fire. The main loop consumes flags; parsing, printing and state machines stay out of the ISR."
        },
        fn: ["std.nvic.disableirq", "hal.nvic.disableirq"],
        code: {
          std: "NVIC_DisableIRQ(USART1_IRQn);\nNVIC_ClearPendingIRQ(USART1_IRQn);\n/* 现在可以安全地重新配置 USART1 */",
          hal: "HAL_NVIC_DisableIRQ(USART1_IRQn);\n__HAL_UART_DISABLE_IT(&huart1, UART_IT_RXNE);\n/* 现在可以安全地重新初始化 huart1 */"
        }
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

volatile uint8_t rx_byte;
volatile uint8_t rx_flag;

static void usart1_irq_setup(void)
{
    NVIC_InitTypeDef nvic;

    /* 全工程只配置一次：2 位抢占 + 2 位子优先级 */
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);

    nvic.NVIC_IRQChannel = USART1_IRQn;
    nvic.NVIC_IRQChannelPreemptionPriority = 1;
    nvic.NVIC_IRQChannelSubPriority = 1;
    nvic.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&nvic);

    USART_ITConfig(USART1, USART_IT_RXNE, ENABLE);
}

void USART1_IRQHandler(void)
{
    if (USART_GetITStatus(USART1, USART_IT_RXNE) != RESET) {
        rx_byte = (uint8_t)USART_ReceiveData(USART1);
        USART_ClearITPendingBit(USART1, USART_IT_RXNE);
        rx_flag = 1;
    }
}

int main(void)
{
    /* RCC / GPIO / USART1 初始化略 */
    usart1_irq_setup();

    while (1) {
        if (rx_flag) {
            rx_flag = 0;
            /* 在这里解析 rx_byte，不要放进 ISR */
        }
    }
}`,
      hal: `#include "stm32f1xx_hal.h"

UART_HandleTypeDef huart1;
volatile uint8_t rx_byte;
volatile uint8_t rx_flag;

static void usart1_irq_setup(void)
{
    /* HAL_Init() 默认 GROUP_4，这里显式改为 GROUP_2 */
    HAL_NVIC_SetPriorityGrouping(NVIC_PRIORITYGROUP_2);
    HAL_NVIC_SetPriority(USART1_IRQn, 1, 1);
    HAL_NVIC_EnableIRQ(USART1_IRQn);
}

void USART1_IRQHandler(void)
{
    HAL_UART_IRQHandler(&huart1);
}

void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1) { rx_flag = 1; }
}

int main(void)
{
    HAL_Init();
    SystemClock_Config();          /* CubeMX 生成 / generated by CubeMX */
    MX_USART1_UART_Init();         /* CubeMX 生成 / generated by CubeMX */

    usart1_irq_setup();
    HAL_UART_Receive_IT(&huart1, (uint8_t *)&rx_byte, 1);

    while (1) {
        if (rx_flag) {
            rx_flag = 0;
            /* 在这里解析 rx_byte，不要放进 ISR */
        }
    }
}`
    },
    pitfalls: [
      {
        zh: "HAL_Init 默认使用 NVIC_PRIORITYGROUP_4。如果项目要 2 位抢占，必须在任何 HAL_NVIC_SetPriority 之前改分组；中途改分组会把已有优先级全部重新解释。",
        en: "HAL_Init defaults to NVIC_PRIORITYGROUP_4. To use two preemption bits, change the grouping before any HAL_NVIC_SetPriority call; changing it later silently reinterprets every existing priority."
      },
      {
        zh: "抢占优先级决定能否嵌套，数字越小越高；子优先级只在抢占相同时比较，不能互相打断。把两个数值的概念混用，会出现“高优先级反被低优先级卡住”的错觉。",
        en: "Preemption decides nesting and lower numbers win; sub-priority only breaks ties and cannot preempt. Mixing the two concepts leads to the illusion that a high-priority interrupt is blocked by a lower one."
      },
      {
        zh: "只调用 NVIC_EnableIRQ 而不设置优先级，通道会按 0（最高）运行；只设置 NVIC 的外设中断位而不清挂起标志，ISR 会反复进入。",
        en: "Calling NVIC_EnableIRQ without setting a priority leaves the channel at 0 (highest). Enabling the peripheral interrupt without clearing its pending flag makes the ISR re-enter immediately."
      },
      {
        zh: "在 ISR 里使用 HAL_Delay、printf 或阻塞式 HAL_UART_Transmit，会拖长中断并可能死锁；只在 ISR 里置标志，耗时处理交给主循环。",
        en: "HAL_Delay, printf or blocking HAL_UART_Transmit inside an ISR stretches the interrupt and can deadlock. Set a flag in the ISR and do the slow work in the main loop."
      }
    ],
    related: ["wf.usart-irq", "wf.exti-button", "wf.gpio-input"],
    tags: ["nvic", "中断", "优先级", "priority", "interrupt", "IRQ", "抢占", "分组", "USART1"]
  }
];
