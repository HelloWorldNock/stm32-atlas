export const WF_SERIAL = [
  {
    id: "wf.usart-poll",
    p: "usart",
    level: 1,
    libs: ["std", "hal"],
    title: {
      zh: "USART1 轮询收发与 printf 重定向",
      en: "USART1 polling I/O with printf retargeting"
    },
    goal: {
      zh: "把 USART1 配成 115200 8N1，用等待标志的阻塞方式收发单字节，并把 printf 的输出接到串口，作为后续所有调试的通道。",
      en: "Bring USART1 up at 115200 8N1, exchange single bytes by polling the status flags, and route printf to the port so later work has a debug channel."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "打开 USART1 与 GPIOA 时钟", en: "Enable the USART1 and GPIOA clocks" },
        desc: {
          zh: "USART1 与 GPIOA 都挂在 APB2 上。SPL 一次传两个外设宏，HAL 每个外设一个 __HAL_RCC_*_CLK_ENABLE。",
          en: "USART1 and GPIOA both live on APB2. SPL takes both macros in one call; HAL needs one __HAL_RCC_*_CLK_ENABLE per peripheral."
        },
        fn: ["std.rcc.apb2clockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);",
          hal: "__HAL_RCC_GPIOA_CLK_ENABLE();\n__HAL_RCC_USART1_CLK_ENABLE();"
        }
      },
      {
        kind: "step",
        title: { zh: "配置 PA9/PA10 复用功能", en: "Set PA9/PA10 to alternate function" },
        desc: {
          zh: "TX 必须是复用推挽，RX 用浮空输入或上拉输入。配成普通输出后串口仍能初始化，但引脚上没有波形。",
          en: "TX must be alternate-function push-pull; RX is floating or pull-up input. A plain output still initialises but never drives a waveform."
        },
        fn: ["std.gpio.init", "hal.gpio.init"],
        code: {
          std: "gpio.GPIO_Pin = GPIO_Pin_9;\ngpio.GPIO_Mode = GPIO_Mode_AF_PP;\ngpio.GPIO_Speed = GPIO_Speed_50MHz;\nGPIO_Init(GPIOA, &gpio);",
          hal: "gpio.Pin = GPIO_PIN_9 | GPIO_PIN_10;\ngpio.Mode = GPIO_MODE_AF_PP;\ngpio.Pull = GPIO_NOPULL;\nHAL_GPIO_Init(GPIOA, &gpio);"
        }
      },
      {
        kind: "step",
        title: { zh: "填 115200 8N1 参数", en: "Fill in the 115200 8N1 settings" },
        desc: {
          zh: "波特率由当前 PCLK2 换算，8 位字长、1 位停止、无校验是调试口最常用的组合，两端必须完全一致。",
          en: "The divider is derived from the current PCLK2. 8 data bits, 1 stop bit, no parity is the usual debug setup; both ends must match exactly."
        },
        fn: ["std.usart.init", "hal.usart.init"],
        code: {
          std: "uart.USART_BaudRate = 115200;\nuart.USART_WordLength = USART_WordLength_8b;\nuart.USART_Parity = USART_Parity_No;\nuart.USART_Mode = USART_Mode_Rx | USART_Mode_Tx;",
          hal: "huart1.Init.BaudRate = 115200;\nhuart1.Init.WordLength = UART_WORDLENGTH_8B;\nhuart1.Init.Parity = UART_PARITY_NONE;\nhuart1.Init.Mode = UART_MODE_TX_RX;"
        }
      },
      {
        kind: "step",
        title: { zh: "初始化并使能串口", en: "Initialise and enable the UART" },
        desc: {
          zh: "SPL 必须再调用 USART_Cmd(ENABLE)，否则收发寄存器不工作；HAL_UART_Init 内部已经使能。",
          en: "SPL needs a separate USART_Cmd(ENABLE) or nothing moves; HAL_UART_Init enables the peripheral itself."
        },
        fn: ["std.usart.init", "std.usart.cmd", "hal.usart.init"],
        code: {
          std: "USART_Init(USART1, &uart);\nUSART_Cmd(USART1, ENABLE);",
          hal: "HAL_UART_Init(&huart1);   /* 内含使能 / enables the UART */"
        }
      },
      {
        kind: "check",
        title: { zh: "按标志收发一个字节", en: "Move one byte by watching the flags" },
        desc: {
          zh: "发送前等 TXE 再写 DR；接收看 RXNE，读 DR 会清掉它。用超时接收时注意 HAL_TIMEOUT 表示一个字节都没收到。",
          en: "Wait for TXE before writing DR; poll RXNE to receive, since reading DR clears it. With HAL, HAL_TIMEOUT means nothing arrived."
        },
        fn: ["std.usart.getflagstatus", "std.usart.senddata", "std.usart.receivedata", "hal.usart.transmit", "hal.usart.receive"],
        code: {
          std: "while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET) { }\nUSART_SendData(USART1, c);\nwhile (USART_GetFlagStatus(USART1, USART_FLAG_RXNE) == RESET) { }\nc = (uint8_t)USART_ReceiveData(USART1);",
          hal: "HAL_UART_Transmit(&huart1, &c, 1, 100);\nHAL_UART_Receive(&huart1, &c, 1, 100);"
        }
      },
      {
        kind: "end",
        title: { zh: "重定向 printf 并在主循环回显", en: "Retarget printf and echo in the main loop" },
        desc: {
          zh: "fputc 里逐字节等 TXE 发送，printf 就落在串口上。回显放进 while(1)，一次只处理一个字节，别在中断里调用 printf。",
          en: "Send one byte at a time from fputc and printf lands on the wire. Echo inside while(1), one byte per pass; never call printf from an ISR."
        },
        fn: ["std.usart.senddata", "std.usart.getflagstatus", "hal.usart.transmit", "hal.usart.getstate"],
        code: {
          std: "int fputc(int ch, FILE *f) {\n    USART_SendData(USART1, (uint8_t)ch);\n    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET) { }\n    return ch; }",
          hal: "int fputc(int ch, FILE *f) {\n    uint8_t c = (uint8_t)ch;\n    HAL_UART_Transmit(&huart1, &c, 1, 100);\n    return ch; }"
        }
      }
    ],
    code: {
      std: `#include "stm32f10x.h"
#include <stdio.h>

int fputc(int ch, FILE *f)
{
    USART_SendData(USART1, (uint8_t)ch);
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET) { }
    return ch;
}

int main(void)
{
    GPIO_InitTypeDef gpio; USART_InitTypeDef uart;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);
    gpio.GPIO_Pin = GPIO_Pin_9; gpio.GPIO_Mode = GPIO_Mode_AF_PP; gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &gpio);
    gpio.GPIO_Pin = GPIO_Pin_10; gpio.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &gpio);

    uart.USART_BaudRate = 115200; uart.USART_WordLength = USART_WordLength_8b;
    uart.USART_StopBits = USART_StopBits_1; uart.USART_Parity = USART_Parity_No;
    uart.USART_Mode = USART_Mode_Rx | USART_Mode_Tx; uart.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_Init(USART1, &uart);
    USART_Cmd(USART1, ENABLE);

    printf("usart1 ready\\r\\n");
    while (1) {
        if (USART_GetFlagStatus(USART1, USART_FLAG_RXNE) != RESET) {
            uint8_t c = (uint8_t)USART_ReceiveData(USART1);
            USART_SendData(USART1, c);
            while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET) { }
        }
    }
}`,
      hal: `#include "stm32f1xx_hal.h"
#include <stdio.h>

UART_HandleTypeDef huart1;

int fputc(int ch, FILE *f)
{
    uint8_t c = (uint8_t)ch;
    HAL_UART_Transmit(&huart1, &c, 1, 100);
    return ch;
}

int main(void)
{
    GPIO_InitTypeDef gpio = {0};
    uint8_t c;
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE(); __HAL_RCC_USART1_CLK_ENABLE();
    gpio.Pin = GPIO_PIN_9 | GPIO_PIN_10; gpio.Mode = GPIO_MODE_AF_PP;
    gpio.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(GPIOA, &gpio);

    huart1.Instance = USART1;
    huart1.Init.BaudRate = 115200; huart1.Init.WordLength = UART_WORDLENGTH_8B;
    huart1.Init.StopBits = UART_STOPBITS_1; huart1.Init.Parity = UART_PARITY_NONE;
    huart1.Init.Mode = UART_MODE_TX_RX; huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart1.Init.OverSampling = UART_OVERSAMPLING_16;
    HAL_UART_Init(&huart1);

    printf("usart1 ready\\r\\n");
    while (1) {
        if (HAL_UART_Receive(&huart1, &c, 1, 1000) == HAL_OK)
            HAL_UART_Transmit(&huart1, &c, 1, 100);
    }
}`
    },
    pitfalls: [
      {
        zh: "TX 引脚配成普通推挽输出时串口能初始化，但发不出数据；必须是 AF_PP。",
        en: "A plain push-pull TX pin still initialises but sends nothing; it must be AF_PP."
      },
      {
        zh: "SPL 忘记 USART_Cmd，或 HAL 改完 huart.Init 后没重新 HAL_UART_Init，表现都是完全静默。",
        en: "Forgetting USART_Cmd in SPL, or editing huart.Init without re-running HAL_UART_Init, both look like complete silence."
      },
      {
        zh: "printf 重定向依赖 MicroLIB/newlib；在中断里调用会阻塞整个中断系统。",
        en: "printf retargeting depends on MicroLIB or newlib; calling it inside an ISR blocks the whole interrupt system."
      }
    ],
    related: ["wf.usart-irq", "wf.dma-usart"],
    tags: ["串口", "usart", "uart", "printf", "轮询", "polling", "115200"]
  },

  {
    id: "wf.usart-irq",
    p: "usart",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "USART1 中断接收与回调重新武装",
      en: "USART1 interrupt receive with callback re-arming"
    },
    goal: {
      zh: "打开 RXNE 中断，在 ISR 里取走字节放进缓冲区，主循环再处理数据。关键是 HAL 回调里必须重新调用 HAL_UART_Receive_IT，否则只收得到第一个字节。",
      en: "Enable RXNE, take the byte in the ISR, and process it in the main loop. The catch: HAL only receives once unless the callback re-arms HAL_UART_Receive_IT."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "打开串口与引脚时钟", en: "Enable the UART and pin clocks" },
        desc: {
          zh: "和轮询版一样先开 GPIOA 与 USART1。中断方式对时钟没有额外要求，但 NVIC 必须在配置完成后才使能。",
          en: "Same start as polling: GPIOA and USART1 clocks. Interrupts add no clock requirement, but enable the NVIC IRQ last."
        },
        fn: ["std.rcc.apb2clockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);",
          hal: "__HAL_RCC_GPIOA_CLK_ENABLE();\n__HAL_RCC_USART1_CLK_ENABLE();"
        }
      },
      {
        kind: "step",
        title: { zh: "配置 PA9 复用推挽、PA10 输入", en: "Configure PA9 as AF push-pull, PA10 as input" },
        desc: {
          zh: "只收不发时也建议保留 TX 配置，方便在 ISR 里直接回显；RX 上拉可以避免悬空引脚收到噪声起始位。",
          en: "Keep TX configured even for receive-only work so the ISR can echo; a pull-up on RX keeps a floating line from faking start bits."
        },
        fn: ["std.gpio.init", "hal.gpio.init"],
        code: {
          std: "gpio.GPIO_Pin = GPIO_Pin_9 | GPIO_Pin_10;\ngpio.GPIO_Mode = GPIO_Mode_AF_PP;\nGPIO_Init(GPIOA, &gpio);",
          hal: "gpio.Pin = GPIO_PIN_9 | GPIO_PIN_10;\ngpio.Mode = GPIO_MODE_AF_PP;\ngpio.Pull = GPIO_PULLUP;\nHAL_GPIO_Init(GPIOA, &gpio);"
        }
      },
      {
        kind: "step",
        title: { zh: "初始化串口并打开 RXNE 中断", en: "Initialise the UART and enable RXNE" },
        desc: {
          zh: "SPL 用 USART_ITConfig(USART_IT_RXNE)；HAL 不需要手动开中断，HAL_UART_Receive_IT 会设置 RXNEIE。",
          en: "SPL calls USART_ITConfig(USART_IT_RXNE); HAL sets RXNEIE for you inside HAL_UART_Receive_IT."
        },
        fn: ["std.usart.init", "std.usart.cmd", "std.usart.itconfig", "hal.usart.init", "hal.usart.receive_it"],
        code: {
          std: "USART_Init(USART1, &uart);\nUSART_ITConfig(USART1, USART_IT_RXNE, ENABLE);\nUSART_Cmd(USART1, ENABLE);",
          hal: "HAL_UART_Init(&huart1);\nHAL_UART_Receive_IT(&huart1, &rx_byte, 1);"
        }
      },
      {
        kind: "step",
        title: { zh: "在 NVIC 打开 USART1_IRQn", en: "Enable USART1_IRQn in the NVIC" },
        desc: {
          zh: "只开外设中断不配 NVIC 不会进 ISR。优先级分组选一次即可，抢占优先级决定能否打断其它中断。",
          en: "A peripheral interrupt without NVIC setup never reaches the ISR. Set the priority grouping once; preemption decides what it can interrupt."
        },
        fn: ["std.nvic.prioritygroup", "std.nvic.init", "hal.nvic.setprioritygrouping", "hal.nvic.setpriority", "hal.nvic.enableirq"],
        code: {
          std: "NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);\nnvic.NVIC_IRQChannel = USART1_IRQn; nvic.NVIC_IRQChannelPreemptionPriority = 1;\nnvic.NVIC_IRQChannelCmd = ENABLE;\nNVIC_Init(&nvic);",
          hal: "HAL_NVIC_SetPriority(USART1_IRQn, 1, 0);\nHAL_NVIC_EnableIRQ(USART1_IRQn);"
        }
      },
      {
        kind: "isr",
        title: { zh: "在 ISR 里取走字节", en: "Take the byte inside the ISR" },
        desc: {
          zh: "SPL 用 USART_GetITStatus 判断 RXNE 再读 DR；HAL 只把入口转给 HAL_UART_IRQHandler，具体处理在回调里。ISR 里不要做解析和打印。",
          en: "SPL tests RXNE with USART_GetITStatus then reads DR; HAL just forwards to HAL_UART_IRQHandler and does the work in the callback. No parsing or printing in the ISR."
        },
        fn: ["std.usart.getitstatus", "std.usart.receivedata", "hal.usart.irqhandler"],
        code: {
          std: "if (USART_GetITStatus(USART1, USART_IT_RXNE) != RESET) {\n    rx_byte = (uint8_t)USART_ReceiveData(USART1);\n    rx_flag = 1;\n}",
          hal: "void USART1_IRQHandler(void) {\n    HAL_UART_IRQHandler(&huart1);\n}"
        }
      },
      {
        kind: "check",
        title: { zh: "确认标志已清并重新武装", en: "Verify the flag cleared and re-arm" },
        desc: {
          zh: "读 DR 已经清掉 RXNE，不用再调 ClearITPendingBit。HAL 收满一帧后状态回到 READY，必须在回调里再调一次 Receive_IT 才能继续收。",
          en: "Reading DR clears RXNE, so no extra ClearITPendingBit is needed. After a full HAL frame the state returns to READY — call Receive_IT again or reception stops."
        },
        fn: ["std.usart.clearitpending", "hal.usart.rxcpltcallback", "hal.usart.receive_it", "hal.usart.getstate"],
        code: {
          std: "/* RXNE 由读 DR 清除；ORE 溢出需先读 SR 再读 DR */\nc = (uint8_t)USART_ReceiveData(USART1);",
          hal: "void HAL_UART_RxCpltCallback(UART_HandleTypeDef *h) {\n    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);   /* 重新武装 */\n}"
        }
      },
      {
        kind: "end",
        title: { zh: "在主循环消费缓冲区", en: "Consume the buffer in the main loop" },
        desc: {
          zh: "ISR 只置标志或塞进环形缓冲，主循环再解析命令、回包。变量加 volatile，多字节数据要防并发读写。",
          en: "The ISR only sets a flag or pushes into a ring buffer; the loop parses commands and replies. Mark shared variables volatile and guard multi-byte data."
        },
        fn: ["std.usart.senddata", "hal.usart.transmit", "hal.usart.getstate"],
        code: {
          std: "while (1) {\n    if (rx_flag) { rx_flag = 0; USART_SendData(USART1, rx_byte); }\n}",
          hal: "while (1) {\n    if (rx_flag) { rx_flag = 0; HAL_UART_Transmit(&huart1, &rx_byte, 1, 100); }\n}"
        }
      }
    ],
    code: {
      std: `#include "stm32f10x.h"
static volatile uint8_t rx_byte, rx_flag;

void USART1_IRQHandler(void)
{
    if (USART_GetITStatus(USART1, USART_IT_RXNE) == RESET) return;
    rx_byte = (uint8_t)USART_ReceiveData(USART1);   /* 读 DR 清 RXNE */
    rx_flag = 1;
}

int main(void)
{
    GPIO_InitTypeDef gpio; USART_InitTypeDef uart; NVIC_InitTypeDef nvic;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);
    gpio.GPIO_Pin = GPIO_Pin_9 | GPIO_Pin_10; gpio.GPIO_Mode = GPIO_Mode_AF_PP; gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &gpio);
    gpio.GPIO_Pin = GPIO_Pin_10; gpio.GPIO_Mode = GPIO_Mode_IPU;
    GPIO_Init(GPIOA, &gpio);

    uart.USART_BaudRate = 115200; uart.USART_WordLength = USART_WordLength_8b;
    uart.USART_StopBits = USART_StopBits_1; uart.USART_Parity = USART_Parity_No;
    uart.USART_Mode = USART_Mode_Rx | USART_Mode_Tx; uart.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_Init(USART1, &uart);
    USART_ITConfig(USART1, USART_IT_RXNE, ENABLE);
    USART_Cmd(USART1, ENABLE);

    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    nvic.NVIC_IRQChannel = USART1_IRQn; nvic.NVIC_IRQChannelPreemptionPriority = 1;
    nvic.NVIC_IRQChannelSubPriority = 0; nvic.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&nvic);

    while (1) {
        if (rx_flag) { rx_flag = 0; USART_SendData(USART1, rx_byte); }
    }
}`,
      hal: `#include "stm32f1xx_hal.h"
UART_HandleTypeDef huart1;
static uint8_t rx_byte;
static volatile uint8_t rx_flag;

void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance != USART1) return;
    rx_flag = 1;
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);   /* 重新武装 / re-arm */
}

void USART1_IRQHandler(void) { HAL_UART_IRQHandler(&huart1); }
int main(void)
{
    GPIO_InitTypeDef gpio = {0};
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE(); __HAL_RCC_USART1_CLK_ENABLE();
    gpio.Pin = GPIO_PIN_9 | GPIO_PIN_10; gpio.Mode = GPIO_MODE_AF_PP;
    gpio.Pull = GPIO_PULLUP; gpio.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(GPIOA, &gpio);
    huart1.Instance = USART1;
    huart1.Init.BaudRate = 115200; huart1.Init.WordLength = UART_WORDLENGTH_8B;
    huart1.Init.StopBits = UART_STOPBITS_1; huart1.Init.Parity = UART_PARITY_NONE;
    huart1.Init.Mode = UART_MODE_TX_RX; huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart1.Init.OverSampling = UART_OVERSAMPLING_16;
    HAL_UART_Init(&huart1);
    HAL_NVIC_SetPriority(USART1_IRQn, 1, 0);
    HAL_NVIC_EnableIRQ(USART1_IRQn);
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);

    while (1) {
        if (rx_flag) { rx_flag = 0; HAL_UART_Transmit(&huart1, &rx_byte, 1, 100); }
    }
}`
    },
    pitfalls: [
      {
        zh: "HAL 回调里忘记 HAL_UART_Receive_IT，串口只收到第一帧就再也不进中断。",
        en: "Skip HAL_UART_Receive_IT in the callback and only the first frame ever arrives."
      },
      {
        zh: "RXNE 由读 DR 自动清除，再手动 ClearITPendingBit 是多余的；但 ORE 溢出必须读 SR 再读 DR。",
        en: "RXNE clears on reading DR, so an extra ClearITPendingBit is redundant; an ORE overflow does need read SR then read DR."
      },
      {
        zh: "在 ISR 里调用 HAL_UART_Transmit（阻塞）会把高优先级中断一起拖住。",
        en: "Calling blocking HAL_UART_Transmit inside the ISR stalls every higher-priority interrupt too."
      }
    ],
    related: ["wf.usart-poll", "wf.dma-usart", "wf.tim-irq"],
    tags: ["串口中断", "usart", "rxne", "中断接收", "isr", "回调", "callback", "重新武装"]
  },

  {
    id: "wf.dma-usart",
    p: "dma",
    level: 3,
    libs: ["std", "hal"],
    title: {
      zh: "UART TX + DMA：DMA1_Channel4 搬数据",
      en: "UART TX over DMA with DMA1_Channel4"
    },
    goal: {
      zh: "把一段常量缓冲交给 DMA1_Channel4 从内存搬到 USART1->DR，CPU 只负责启动和收尾。USART1_TX 固定映射到通道 4，选错通道发不出任何数据。",
      en: "Hand a buffer to DMA1_Channel4 so it feeds USART1->DR while the CPU only starts and reaps the transfer. USART1_TX is hard-wired to channel 4; a wrong channel sends nothing."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "开 USART1、GPIOA 与 DMA1 时钟", en: "Enable USART1, GPIOA and DMA1 clocks" },
        desc: {
          zh: "USART1/GPIOA 在 APB2，DMA1 在 AHB。少开 AHB 时钟时 DMA 寄存器写入全部无效，程序看起来正常但一个字节都不发。",
          en: "USART1 and GPIOA sit on APB2, DMA1 on AHB. Without the AHB clock every DMA register write is ignored and nothing is transmitted."
        },
        fn: ["std.rcc.apb2clockcmd", "std.rcc.ahbclockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);\nRCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);",
          hal: "__HAL_RCC_GPIOA_CLK_ENABLE();\n__HAL_RCC_USART1_CLK_ENABLE();\n__HAL_RCC_DMA1_CLK_ENABLE();"
        }
      },
      {
        kind: "step",
        title: { zh: "只配 TX 引脚", en: "Configure the TX pin only" },
        desc: {
          zh: "单向发送只需 PA9 复用推挽。若还要收数据，必须另配 RX 引脚并加 DMA 接收通道，否则 USART 会置 ORE。",
          en: "One-way transmit needs just PA9 as AF push-pull. If you also receive, wire RX and a second DMA channel or the UART raises ORE."
        },
        fn: ["std.gpio.init", "hal.gpio.init"],
        code: {
          std: "gpio.GPIO_Pin = GPIO_Pin_9;\ngpio.GPIO_Mode = GPIO_Mode_AF_PP;\ngpio.GPIO_Speed = GPIO_Speed_50MHz;\nGPIO_Init(GPIOA, &gpio);",
          hal: "gpio.Pin = GPIO_PIN_9;\ngpio.Mode = GPIO_MODE_AF_PP;\ngpio.Speed = GPIO_SPEED_FREQ_HIGH;\nHAL_GPIO_Init(GPIOA, &gpio);"
        }
      },
      {
        kind: "step",
        title: { zh: "初始化串口并打开 DMAT 位", en: "Initialise the UART and set DMAT" },
        desc: {
          zh: "SPL 要额外调用 USART_DMACmd(USART1, USART_DMAReq_Tx, ENABLE) 才会把 TXE 请求接到 DMA；HAL 在 HAL_UART_Transmit_DMA 内部处理。",
          en: "SPL needs USART_DMACmd(USART1, USART_DMAReq_Tx, ENABLE) to route the TXE request to DMA; HAL does it inside HAL_UART_Transmit_DMA."
        },
        fn: ["std.usart.init", "std.usart.cmd", "hal.usart.init"],
        code: {
          std: "USART_Init(USART1, &uart);\nUSART_Cmd(USART1, ENABLE);\nUSART_DMACmd(USART1, USART_DMAReq_Tx, ENABLE);",
          hal: "HAL_UART_Init(&huart1);   /* DMAT 由发送 API 打开 */"
        }
      },
      {
        kind: "step",
        title: { zh: "配置 DMA1_Channel4 并绑定句柄", en: "Configure DMA1_Channel4 and link the handle" },
        desc: {
          zh: "方向是内存→外设，外设地址不自增、内存自增，8 位对齐，普通模式。HAL 还要用 __HAL_LINKDMA 把 hdma 挂到 huart1.hdmatx 上。",
          en: "Memory-to-peripheral, no peripheral increment, memory increment, byte alignment, normal mode. HAL additionally binds hdma to huart1.hdmatx with __HAL_LINKDMA."
        },
        fn: ["std.dma.init", "std.dma.cmd", "hal.dma.link", "hal.dma.start_it"],
        code: {
          std: "dma.DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR;\ndma.DMA_MemoryBaseAddr = (uint32_t)msg;\ndma.DMA_DIR = DMA_DIR_PeripheralDST;\ndma.DMA_BufferSize = sizeof(msg) - 1;",
          hal: "hdma_usart1_tx.Instance = DMA1_Channel4;\nhdma_usart1_tx.Init.Direction = DMA_MEMORY_TO_PERIPH;\n__HAL_LINKDMA(&huart1, hdmatx, hdma_usart1_tx);"
        }
      },
      {
        kind: "check",
        title: { zh: "等 TC 标志或句柄回到 READY", en: "Wait for TC or a READY handle" },
        desc: {
          zh: "SPL 查 DMA1_FLAG_TC4 后必须 DMA_ClearFlag；HAL 的 gState 变回 READY 才表示可以装下一段，否则 HAL_UART_Transmit_DMA 直接返回 HAL_BUSY。",
          en: "SPL polls DMA1_FLAG_TC4 and must clear it; in HAL, gState returning to READY means the next buffer is safe, otherwise HAL_UART_Transmit_DMA returns HAL_BUSY."
        },
        fn: ["std.dma.getflagstatus", "std.dma.clearflag", "hal.usart.getstate"],
        code: {
          std: "if (DMA_GetFlagStatus(DMA1_FLAG_TC4) != RESET) {\n    DMA_ClearFlag(DMA1_FLAG_TC4);\n}",
          hal: "if (huart1.gState == HAL_UART_STATE_READY) { /* 可装下一段 */ }"
        }
      },
      {
        kind: "isr",
        title: { zh: "DMA 中断里只交给 HAL 处理", en: "Let HAL handle the DMA interrupt" },
        desc: {
          zh: "HAL 的发送完成回调由 DMA 中断驱动，DMA1_Channel4_IRQHandler 里调 HAL_DMA_IRQHandler 即可。SPL 若开 TC 中断，记得在 ISR 里清标志再重装。",
          en: "HAL completion runs from the DMA interrupt: just call HAL_DMA_IRQHandler inside DMA1_Channel4_IRQHandler. In SPL, clear the flag before reloading inside the ISR."
        },
        fn: ["hal.dma.irqhandler", "std.dma.itconfig", "std.nvic.init", "std.dma.clearflag"],
        code: {
          std: "void DMA1_Channel4_IRQHandler(void) {\n    if (DMA_GetITStatus(DMA1_IT_TC4) != RESET) { DMA_ClearITPendingBit(DMA1_IT_TC4); }\n}",
          hal: "void DMA1_Channel4_IRQHandler(void) {\n    HAL_DMA_IRQHandler(&hdma_usart1_tx);\n}"
        }
      },
      {
        kind: "end",
        title: { zh: "在主循环里重装长度再启动", en: "Reload the length and restart in the loop" },
        desc: {
          zh: "普通模式下 CNDTR 会减到 0，重发前必须先关通道、写回长度再使能。缓冲区必须一直有效，DMA 不复制数据。",
          en: "In normal mode CNDTR counts down to zero, so disable the channel, rewrite the length, then re-enable. The buffer must stay alive; DMA never copies it."
        },
        fn: ["std.dma.cmd", "hal.usart.getstate"],
        code: {
          std: "DMA_Cmd(DMA1_Channel4, DISABLE);\nDMA1_Channel4->CNDTR = sizeof(msg) - 1;\nDMA_Cmd(DMA1_Channel4, ENABLE);",
          hal: "while (huart1.gState != HAL_UART_STATE_READY) { }\nHAL_UART_Transmit_DMA(&huart1, msg, sizeof(msg) - 1);"
        }
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

static const char msg[] = "hello dma\\r\\n";
int main(void)
{
    GPIO_InitTypeDef gpio; USART_InitTypeDef uart; DMA_InitTypeDef dma;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_USART1, ENABLE);
    RCC_AHBPeriphClockCmd(RCC_AHBPeriph_DMA1, ENABLE);
    gpio.GPIO_Pin = GPIO_Pin_9; gpio.GPIO_Mode = GPIO_Mode_AF_PP; gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &gpio);

    uart.USART_BaudRate = 115200; uart.USART_WordLength = USART_WordLength_8b;
    uart.USART_StopBits = USART_StopBits_1; uart.USART_Parity = USART_Parity_No;
    uart.USART_Mode = USART_Mode_Tx; uart.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_Init(USART1, &uart); USART_Cmd(USART1, ENABLE); USART_DMACmd(USART1, USART_DMAReq_Tx, ENABLE);

    dma.DMA_PeripheralBaseAddr = (uint32_t)&USART1->DR;
    dma.DMA_MemoryBaseAddr = (uint32_t)msg;
    dma.DMA_DIR = DMA_DIR_PeripheralDST;
    dma.DMA_BufferSize = sizeof(msg) - 1;
    dma.DMA_PeripheralInc = DMA_PeripheralInc_Disable; dma.DMA_MemoryInc = DMA_MemoryInc_Enable;
    dma.DMA_PeripheralDataSize = DMA_PeripheralDataSize_Byte; dma.DMA_MemoryDataSize = DMA_MemoryDataSize_Byte;
    dma.DMA_Mode = DMA_Mode_Normal; dma.DMA_Priority = DMA_Priority_Medium; dma.DMA_M2M = DMA_M2M_Disable;
    DMA_Init(DMA1_Channel4, &dma);
    DMA_Cmd(DMA1_Channel4, ENABLE);

    while (1) {
        if (DMA_GetFlagStatus(DMA1_FLAG_TC4) != RESET) {
            DMA_ClearFlag(DMA1_FLAG_TC4);
            DMA_Cmd(DMA1_Channel4, DISABLE);
            DMA1_Channel4->CNDTR = sizeof(msg) - 1;
            DMA_Cmd(DMA1_Channel4, ENABLE);
        }
    }
}`,
      hal: `#include "stm32f1xx_hal.h"

UART_HandleTypeDef huart1;
DMA_HandleTypeDef hdma_usart1_tx;
static uint8_t msg[] = "hello dma\\r\\n";
void DMA1_Channel4_IRQHandler(void) { HAL_DMA_IRQHandler(&hdma_usart1_tx); }
int main(void)
{
    GPIO_InitTypeDef gpio = {0};
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE(); __HAL_RCC_USART1_CLK_ENABLE(); __HAL_RCC_DMA1_CLK_ENABLE();
    gpio.Pin = GPIO_PIN_9; gpio.Mode = GPIO_MODE_AF_PP; gpio.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(GPIOA, &gpio);
    hdma_usart1_tx.Instance = DMA1_Channel4;
    hdma_usart1_tx.Init.Direction = DMA_MEMORY_TO_PERIPH;
    hdma_usart1_tx.Init.PeriphInc = DMA_PINC_DISABLE; hdma_usart1_tx.Init.MemInc = DMA_MINC_ENABLE;
    hdma_usart1_tx.Init.PeriphDataAlignment = DMA_PDATAALIGN_BYTE;
    hdma_usart1_tx.Init.MemDataAlignment = DMA_MDATAALIGN_BYTE;
    hdma_usart1_tx.Init.Mode = DMA_NORMAL; hdma_usart1_tx.Init.Priority = DMA_PRIORITY_HIGH;
    HAL_DMA_Init(&hdma_usart1_tx);
    __HAL_LINKDMA(&huart1, hdmatx, hdma_usart1_tx);
    HAL_NVIC_SetPriority(DMA1_Channel4_IRQn, 1, 0); HAL_NVIC_EnableIRQ(DMA1_Channel4_IRQn);
    huart1.Instance = USART1;
    huart1.Init.BaudRate = 115200; huart1.Init.WordLength = UART_WORDLENGTH_8B;
    huart1.Init.StopBits = UART_STOPBITS_1; huart1.Init.Parity = UART_PARITY_NONE;
    huart1.Init.Mode = UART_MODE_TX; huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart1.Init.OverSampling = UART_OVERSAMPLING_16;
    HAL_UART_Init(&huart1); HAL_UART_Transmit_DMA(&huart1, msg, sizeof(msg) - 1);
    while (1) {
        if (huart1.gState == HAL_UART_STATE_READY) {
            HAL_Delay(1000);
            HAL_UART_Transmit_DMA(&huart1, msg, sizeof(msg) - 1);
        }
    }
}`
    },
    pitfalls: [
      {
        zh: "USART1_TX 只能走 DMA1_Channel4，USART1_RX 是通道 5；通道选错时寄存器照写，引脚就是不动。",
        en: "USART1_TX is fixed to DMA1_Channel4 and RX to channel 5; with the wrong channel the registers still program but the pin stays idle."
      },
      {
        zh: "普通模式下 CNDTR 归零不会自动重装，重发前要关通道、写回长度再使能。",
        en: "In normal mode CNDTR does not reload at zero — disable the channel, rewrite the length, then re-enable."
      },
      {
        zh: "发送缓冲区用局部数组、函数返回后 DMA 仍在读，会出现尾部乱码。",
        en: "A local TX buffer goes out of scope while DMA still reads it, producing truncated garbage."
      }
    ],
    related: ["wf.usart-poll", "wf.usart-irq"],
    tags: ["dma", "串口dma", "uart dma", "DMA1_Channel4", "__HAL_LINKDMA", "传输完成", "tc"]
  },

  {
    id: "wf.spi-flash",
    p: "spi",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "SPI 读写 W25Q64：读 ID、页写与读回校验",
      en: "SPI W25Q64: read ID, page program, verify"
    },
    goal: {
      zh: "用 SPI1 模式 0 驱动 W25Q64：先读 JEDEC ID 确认接线，再页写 4 字节并读回比较。软件片选、命令与 24 位地址的顺序是全部要点。",
      en: "Drive a W25Q64 over SPI1 in mode 0: read the JEDEC ID to prove the wiring, then program four bytes and read them back. Software chip-select and the command/24-bit address order are the whole game."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "打开 GPIOA 与 SPI1 时钟", en: "Enable GPIOA and SPI1 clocks" },
        desc: {
          zh: "SPI1 在 APB2。片选 PA4 是普通 GPIO，不需要 SPI 时钟，但一定要在 SPI 使能前先拉高。",
          en: "SPI1 is on APB2. Chip-select PA4 is plain GPIO and needs no SPI clock, but must be driven high before the SPI peripheral is enabled."
        },
        fn: ["std.rcc.apb2clockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_SPI1, ENABLE);",
          hal: "__HAL_RCC_GPIOA_CLK_ENABLE();\n__HAL_RCC_SPI1_CLK_ENABLE();"
        }
      },
      {
        kind: "step",
        title: { zh: "SCK/MISO/MOSI 复用，CS 普通输出", en: "SCK/MISO/MOSI as AF, CS as output" },
        desc: {
          zh: "PA5/PA6/PA7 配 AF_PP，PA4 配推挽输出并由软件控制。MISO 若配成推挽输出会和从机对顶。",
          en: "PA5/PA6/PA7 as AF_PP, PA4 as push-pull output driven by software. A push-pull MISO fights the slave's driver."
        },
        fn: ["std.gpio.init", "hal.gpio.init"],
        code: {
          std: "gpio.GPIO_Pin = GPIO_Pin_4;\ngpio.GPIO_Mode = GPIO_Mode_Out_PP;\ngpio.GPIO_Speed = GPIO_Speed_50MHz;\nGPIO_Init(GPIOA, &gpio);",
          hal: "gpio.Pin = GPIO_PIN_4;\ngpio.Mode = GPIO_MODE_OUTPUT_PP;\ngpio.Pull = GPIO_NOPULL;\nHAL_GPIO_Init(GPIOA, &gpio);"
        }
      },
      {
        kind: "step",
        title: { zh: "SPI1 主机模式 0，9 MHz 以下", en: "SPI1 master, mode 0, under 9 MHz" },
        desc: {
          zh: "W25Q64 支持模式 0/3，这里用 CPOL=0、CPHA=1Edge；APB2 72 MHz 下 8 分频得 9 MHz，仍在器件 104 MHz 能力内但留足余量。",
          en: "W25Q64 accepts modes 0 and 3; use CPOL=0 with CPHA=1Edge. Divide 72 MHz APB2 by 8 for 9 MHz — well inside the part's 104 MHz limit."
        },
        fn: ["std.spi.init", "std.spi.cmd", "hal.spi.init"],
        code: {
          std: "spi.SPI_Mode = SPI_Mode_Master;\nspi.SPI_DataSize = SPI_DataSize_8b;\nspi.SPI_CPOL = SPI_CPOL_Low;\nspi.SPI_CPHA = SPI_CPHA_1Edge;",
          hal: "hspi1.Init.Mode = SPI_MODE_MASTER;\nhspi1.Init.CLKPolarity = SPI_POLARITY_LOW;\nhspi1.Init.CLKPhase = SPI_PHASE_1EDGE;\nhspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_8;"
        }
      },
      {
        kind: "check",
        title: { zh: "读 JEDEC ID 0x9F 验证链路", en: "Read JEDEC ID 0x9F to prove the link" },
        desc: {
          zh: "拉低 CS，发 0x9F，再发 3 个哑字节换回 EF 40 17（W25Q64）。读不到就查 CS、模式与供电，别急着写数据。",
          en: "Pull CS low, send 0x9F, then clock three dummy bytes to get EF 40 17 for a W25Q64. If it is wrong, check CS, mode and power before writing anything."
        },
        fn: ["std.spi.i2s_senddata", "std.spi.i2s_receivedata", "std.spi.getflagstatus", "hal.spi.transmitreceive"],
        code: {
          std: "CS_LOW(); xfer(0x9F);\nid[0] = xfer(0xFF); id[1] = xfer(0xFF); id[2] = xfer(0xFF);\nCS_HIGH();",
          hal: "uint8_t cmd = 0x9F;\ncs(0); HAL_SPI_Transmit(&hspi1, &cmd, 1, 100);\nHAL_SPI_Receive(&hspi1, id, 3, 100);\ncs(1);"
        }
      },
      {
        kind: "step",
        title: { zh: "写使能、页写、等 BUSY 清零", en: "Write-enable, page program, wait for BUSY" },
        desc: {
          zh: "每次写前都要发 0x06；0x02 后跟 24 位地址和数据，页内不能跨 256 字节边界。写完轮询状态寄存器 0x05 的 bit0，等它归零再读。",
          en: "Send 0x06 before every program; 0x02 takes a 24-bit address plus data and must not cross a 256-byte page. Poll bit0 of status 0x05 until clear before reading back."
        },
        fn: ["std.spi.i2s_senddata", "std.spi.getflagstatus", "hal.spi.transmit", "hal.spi.getstate"],
        code: {
          std: "CS_LOW(); xfer(0x06); CS_HIGH();\nCS_LOW(); xfer(0x02); xfer(0); xfer(0); xfer(0);\nxfer(wr[0]); xfer(wr[1]); xfer(wr[2]); xfer(wr[3]);\nCS_HIGH(); wait_busy();",
          hal: "cmd = 0x06; cs(0); HAL_SPI_Transmit(&hspi1, &cmd, 1, 100); cs(1);\ncmd = 0x02; cs(0); HAL_SPI_Transmit(&hspi1, &cmd, 1, 100);\ncmd = 0x00; HAL_SPI_Transmit(&hspi1, &cmd, 3, 100);\nHAL_SPI_Transmit(&hspi1, wr, 4, 100); cs(1); HAL_Delay(5);"
        }
      },
      {
        kind: "check",
        title: { zh: "读回并逐字节比较", en: "Read back and compare byte by byte" },
        desc: {
          zh: "0x03 加 24 位地址后连续读，读多少字节就发多少个 0xFF 哑字节。比较失败先确认目标扇区已擦除——Flash 只能把 1 写成 0。",
          en: "0x03 plus a 24-bit address then clock out data, one 0xFF dummy per byte. On mismatch confirm the sector was erased — flash can only turn 1s into 0s."
        },
        fn: ["std.spi.i2s_receivedata", "std.spi.i2s_senddata", "hal.spi.receive", "hal.spi.getstate"],
        code: {
          std: "CS_LOW(); xfer(0x03); xfer(0); xfer(0); xfer(0);\nrd[0] = xfer(0xFF); rd[1] = xfer(0xFF); rd[2] = xfer(0xFF); rd[3] = xfer(0xFF);\nCS_HIGH();",
          hal: "cmd = 0x03; cs(0); HAL_SPI_Transmit(&hspi1, &cmd, 1, 100);\ncmd = 0x00; HAL_SPI_Transmit(&hspi1, &cmd, 3, 100);   /* 哑地址 */\nHAL_SPI_Receive(&hspi1, rd, 4, 100); cs(1);"
        }
      },
      {
        kind: "end",
        title: { zh: "封装成命令函数，守住 CS 边界", en: "Wrap commands and keep CS scoped" },
        desc: {
          zh: "把 xfer、wait_busy、read/write 封装起来，一个命令一次 CS 拉低到拉高，中途不要插入其它 SPI 设备操作。",
          en: "Wrap xfer, wait_busy and the read/write helpers; one command spans exactly one CS-low to CS-high, with no other SPI device touched in between."
        },
        fn: ["std.spi.getflagstatus", "hal.spi.transmitreceive", "hal.spi.getstate"],
        code: {
          std: "static uint8_t xfer(uint8_t b) {\n    while (!SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE)) { }\n    SPI_I2S_SendData(SPI1, b);\n    while (!SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE)) { } return (uint8_t)SPI_I2S_ReceiveData(SPI1); }",
          hal: "uint8_t tx[2] = {0x06, 0x00}, rx[2];\ncs(0); HAL_SPI_TransmitReceive(&hspi1, tx, rx, 2, 100); cs(1);"
        }
      }
    ],
    code: {
      std: `#include "stm32f10x.h"
#define CS_LOW()  GPIO_ResetBits(GPIOA, GPIO_Pin_4)
#define CS_HIGH() GPIO_SetBits(GPIOA, GPIO_Pin_4)
static uint8_t xfer(uint8_t b)
{
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_TXE) == RESET) { }
    SPI_I2S_SendData(SPI1, b);
    while (SPI_I2S_GetFlagStatus(SPI1, SPI_I2S_FLAG_RXNE) == RESET) { }
    return (uint8_t)SPI_I2S_ReceiveData(SPI1);
}
static void wait_busy(void) { CS_LOW(); xfer(0x05); while (xfer(0xFF) & 0x01) { } CS_HIGH(); }
int main(void)
{
    GPIO_InitTypeDef gpio; SPI_InitTypeDef spi;
    uint8_t id[3], rd[4]; const uint8_t wr[4] = {0x11, 0x22, 0x33, 0x44};
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_SPI1, ENABLE);
    gpio.GPIO_Pin = GPIO_Pin_4; gpio.GPIO_Mode = GPIO_Mode_Out_PP; gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &gpio); CS_HIGH();
    gpio.GPIO_Pin = GPIO_Pin_5 | GPIO_Pin_6 | GPIO_Pin_7; gpio.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_Init(GPIOA, &gpio);
    spi.SPI_Direction = SPI_Direction_2Lines_FullDuplex; spi.SPI_Mode = SPI_Mode_Master;
    spi.SPI_DataSize = SPI_DataSize_8b; spi.SPI_CPOL = SPI_CPOL_Low; spi.SPI_CPHA = SPI_CPHA_1Edge;
    spi.SPI_NSS = SPI_NSS_Soft; spi.SPI_BaudRatePrescaler = SPI_BaudRatePrescaler_8;
    spi.SPI_FirstBit = SPI_FirstBit_MSB; spi.SPI_CRCPolynomial = 7;
    SPI_Init(SPI1, &spi); SPI_Cmd(SPI1, ENABLE);
    CS_LOW(); xfer(0x9F); id[0] = xfer(0xFF); id[1] = xfer(0xFF); id[2] = xfer(0xFF); CS_HIGH();
    CS_LOW(); xfer(0x06); CS_HIGH();                       /* 写使能 */
    CS_LOW(); xfer(0x02); xfer(0); xfer(0); xfer(0);       /* 页写 @0x000000 */
    xfer(wr[0]); xfer(wr[1]); xfer(wr[2]); xfer(wr[3]);
    CS_HIGH(); wait_busy();
    CS_LOW(); xfer(0x03); xfer(0); xfer(0); xfer(0);       /* 读数据 */
    rd[0] = xfer(0xFF); rd[1] = xfer(0xFF); rd[2] = xfer(0xFF); rd[3] = xfer(0xFF);
    CS_HIGH();
    while (1) { }   /* id = EF 40 17，rd 应与 wr 相同 */
}`,
      hal: `#include "stm32f1xx_hal.h"

SPI_HandleTypeDef hspi1;
static uint8_t wr[4] = {0x11, 0x22, 0x33, 0x44}, rd[4];
static void cs(uint8_t sel) { HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, sel ? GPIO_PIN_SET : GPIO_PIN_RESET); }

int main(void)
{
    GPIO_InitTypeDef gpio = {0};
    uint8_t cmd, id[3];
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE(); __HAL_RCC_SPI1_CLK_ENABLE();
    gpio.Pin = GPIO_PIN_4; gpio.Mode = GPIO_MODE_OUTPUT_PP; gpio.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(GPIOA, &gpio); cs(1);
    gpio.Pin = GPIO_PIN_5 | GPIO_PIN_6 | GPIO_PIN_7; gpio.Mode = GPIO_MODE_AF_PP;
    HAL_GPIO_Init(GPIOA, &gpio);
    hspi1.Instance = SPI1;
    hspi1.Init.Mode = SPI_MODE_MASTER; hspi1.Init.Direction = SPI_DIRECTION_2LINES;
    hspi1.Init.DataSize = SPI_DATASIZE_8BIT; hspi1.Init.CLKPolarity = SPI_POLARITY_LOW;
    hspi1.Init.CLKPhase = SPI_PHASE_1EDGE; hspi1.Init.NSS = SPI_NSS_SOFT;
    hspi1.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_8; hspi1.Init.FirstBit = SPI_FIRSTBIT_MSB;
    hspi1.Init.TIMode = SPI_TIMODE_DISABLE; hspi1.Init.CRCCalculation = SPI_CRCCALCULATION_DISABLE;
    hspi1.Init.CRCPolynomial = 7;
    HAL_SPI_Init(&hspi1);
    cmd = 0x9F; cs(0); HAL_SPI_Transmit(&hspi1, &cmd, 1, 100);
    HAL_SPI_Receive(&hspi1, id, 3, 100); cs(1);
    cmd = 0x06; cs(0); HAL_SPI_Transmit(&hspi1, &cmd, 1, 100); cs(1);
    cmd = 0x02; cs(0); HAL_SPI_Transmit(&hspi1, &cmd, 1, 100);
    cmd = 0x00; HAL_SPI_Transmit(&hspi1, &cmd, 3, 100);    /* 24 位地址 0 */
    HAL_SPI_Transmit(&hspi1, wr, 4, 100); cs(1); HAL_Delay(5);
    cmd = 0x03; cs(0); HAL_SPI_Transmit(&hspi1, &cmd, 1, 100);
    HAL_SPI_Transmit(&hspi1, &cmd, 3, 100);                /* 哑地址字节 */
    HAL_SPI_Receive(&hspi1, rd, 4, 100); cs(1);
    while (1) { }   /* id = EF 40 17，rd 应与 wr 相同 */
}`
    },
    pitfalls: [
      {
        zh: "写完立刻读回必须等 BUSY 位清零，否则读到的是旧数据或不完整页。",
        en: "Reading straight after a program returns stale or partial data until the BUSY bit clears."
      },
      {
        zh: "目标扇区没擦除时，页写只能把 1 变 0，读回值会是新旧数据按位与的结果。",
        en: "Without an erase, programming only clears bits — the read-back is the old value ANDed with the new one."
      },
      {
        zh: "CS 在命令之间没有拉高，W25Q64 会把后续字节当作同一命令的参数。",
        en: "If CS never goes high between commands, the flash treats following bytes as arguments of the first command."
      }
    ],
    related: ["wf.i2c-eeprom", "wf.usart-poll"],
    tags: ["spi", "w25q64", "flash", "读id", "jedec", "页写", "page program", "校验"]
  },

  {
    id: "wf.i2c-eeprom",
    p: "i2c",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "I2C 读写 AT24C02：字节写与随机读",
      en: "I2C AT24C02: byte write and random read"
    },
    goal: {
      zh: "在 I2C1 上以 100 kHz 访问 AT24C02（器件地址 0xA0），写入一个字节后等 5 ms 写周期，再用重复起始读回比较。",
      en: "Talk to an AT24C02 at 0xA0 over I2C1 at 100 kHz: write one byte, wait out the 5 ms write cycle, then read it back with a repeated start."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "打开 GPIOB 与 I2C1 时钟", en: "Enable GPIOB and I2C1 clocks" },
        desc: {
          zh: "I2C1 挂在 APB1，GPIOB 在 APB2。两个时钟都要开，I2C 分频基于 PCLK1 计算。",
          en: "I2C1 is on APB1 and GPIOB on APB2. Both clocks are required; the I2C divider is computed from PCLK1."
        },
        fn: ["std.rcc.apb2clockcmd", "std.rcc.apb1clockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);\nRCC_APB1PeriphClockCmd(RCC_APB1Periph_I2C1, ENABLE);",
          hal: "__HAL_RCC_GPIOB_CLK_ENABLE();\n__HAL_RCC_I2C1_CLK_ENABLE();"
        }
      },
      {
        kind: "step",
        title: { zh: "PB6/PB7 配复用开漏", en: "PB6/PB7 as alternate-function open-drain" },
        desc: {
          zh: "SCL/SDA 必须是 AF_OD，并在板上挂 4.7k 上拉。配成推挽会在从机拉低时形成短路。",
          en: "SCL and SDA must be AF_OD with 4.7k pull-ups on the board. Push-pull fights the slave when it pulls low."
        },
        fn: ["std.gpio.init", "hal.gpio.init"],
        code: {
          std: "gpio.GPIO_Pin = GPIO_Pin_6 | GPIO_Pin_7;\ngpio.GPIO_Mode = GPIO_Mode_AF_OD;\ngpio.GPIO_Speed = GPIO_Speed_50MHz;\nGPIO_Init(GPIOB, &gpio);",
          hal: "gpio.Pin = GPIO_PIN_6 | GPIO_PIN_7;\ngpio.Mode = GPIO_MODE_AF_OD;\ngpio.Pull = GPIO_PULLUP;\nHAL_GPIO_Init(GPIOB, &gpio);"
        }
      },
      {
        kind: "step",
        title: { zh: "I2C 100 kHz、7 位地址、使能应答", en: "100 kHz, 7-bit addressing, ACK on" },
        desc: {
          zh: "AT24C02 支持 400 kHz，但先用 100 kHz 排线更稳。自有地址填 0，主机模式只看 ClockSpeed 与 Ack。SPL 最后还要 I2C_Cmd(ENABLE)。",
          en: "The AT24C02 handles 400 kHz, but 100 kHz is safer while wiring is unproven. Own address is 0 in master mode; only ClockSpeed and ACK matter. SPL also needs I2C_Cmd(ENABLE)."
        },
        fn: ["std.i2c.init", "std.i2c.cmd", "hal.i2c.init"],
        code: {
          std: "I2C_StructInit(&i2c);\ni2c.I2C_ClockSpeed = 100000;\ni2c.I2C_Ack = I2C_Ack_Enable;\nI2C_Init(I2C1, &i2c);",
          hal: "hi2c1.Init.ClockSpeed = 100000;\nhi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;\nhi2c1.Init.DutyCycle = I2C_DUTYCYCLE_2;"
        }
      },
      {
        kind: "check",
        title: { zh: "探测 0xA0 是否应答", en: "Probe whether 0xA0 acknowledges" },
        desc: {
          zh: "HAL 用 HAL_I2C_IsDeviceReady(&hi2c1, 0xA0, 3, 100) 探测；SPL 先确认 BUSY 为 0 再发起始位。无应答优先查上拉和地址。",
          en: "HAL probes with HAL_I2C_IsDeviceReady(&hi2c1, 0xA0, 3, 100); SPL first confirms BUSY is clear. No ACK usually means missing pull-ups or a wrong address."
        },
        fn: ["std.i2c.getflagstatus", "hal.i2c.isdeviceready"],
        code: {
          std: "while (I2C_GetFlagStatus(I2C1, I2C_FLAG_BUSY) == SET) { }",
          hal: "if (HAL_I2C_IsDeviceReady(&hi2c1, 0xA0, 3, 100) != HAL_OK) { /* 无应答 */ }"
        }
      },
      {
        kind: "step",
        title: { zh: "字节写：START、地址、字地址、数据", en: "Byte write: START, address, word address, data" },
        desc: {
          zh: "顺序是 START → 0xA0（写）→ 字地址 → 数据 → STOP，每一步都等对应事件。STOP 后必须留 5 ms 给器件内部写周期。",
          en: "START, then 0xA0 (write), the word address, the data byte, STOP — waiting on each event. After STOP the part needs about 5 ms internally."
        },
        fn: ["std.i2c.generatestart", "std.i2c.send7bitaddress", "std.i2c.senddata", "std.i2c.checkevent", "hal.i2c.mem_write"],
        code: {
          std: "I2C_GenerateSTART(I2C1, ENABLE);\nI2C_Send7bitAddress(I2C1, 0xA0, I2C_Direction_Transmitter);\nI2C_SendData(I2C1, mem);\nI2C_SendData(I2C1, val);",
          hal: "HAL_I2C_Mem_Write(&hi2c1, 0xA0, 0x10, I2C_MEMADD_SIZE_8BIT, &val, 1, 100);\nHAL_Delay(5);"
        }
      },
      {
        kind: "step",
        title: { zh: "随机读：重复起始 + 读地址 + NACK + STOP", en: "Random read: repeated start, read address, NACK, STOP" },
        desc: {
          zh: "先写一次字地址（假写），再发重复起始和 0xA1。只读一个字节时，读 DR 之前就要 ACK=0 并准备好 STOP。",
          en: "Do a dummy write of the word address, then a repeated start and 0xA1. For a single byte, clear ACK and arm STOP before reading DR."
        },
        fn: ["std.i2c.generatestart", "std.i2c.send7bitaddress", "std.i2c.receivedata", "std.i2c.checkevent", "hal.i2c.mem_read"],
        code: {
          std: "I2C_GenerateSTART(I2C1, ENABLE);\nI2C_Send7bitAddress(I2C1, 0xA0, I2C_Direction_Receiver);\nI2C_AcknowledgeConfig(I2C1, DISABLE);\nI2C_GenerateSTOP(I2C1, ENABLE);",
          hal: "HAL_I2C_Mem_Read(&hi2c1, 0xA0, 0x10, I2C_MEMADD_SIZE_8BIT, &back, 1, 100);"
        }
      },
      {
        kind: "end",
        title: { zh: "比较读回值并恢复 ACK", en: "Compare the read-back and restore ACK" },
        desc: {
          zh: "读回值应与写入一致。连续读之前别忘了 I2C_AcknowledgeConfig(ENABLE)；跨页写要在 8 字节边界处分段。",
          en: "The read-back must equal what was written. Re-enable ACK before any further read; split bursts at the 8-byte page boundary."
        },
        fn: ["std.i2c.getflagstatus", "hal.i2c.mem_read", "hal.i2c.mem_write"],
        code: {
          std: "I2C_AcknowledgeConfig(I2C1, ENABLE);\nif (back != 0x5A) { /* 写入失败或未等够 tWR */ }",
          hal: "if (back != val) { /* 写周期未结束或器件未应答 */ }"
        }
      }
    ],
    code: {
      std: `#include "stm32f10x.h"
#define EE_ADDR 0xA0   /* 7 位地址 0x50 左移一位 */

static void wait_event(uint32_t ev) { while (!I2C_CheckEvent(I2C1, ev)) { } }
static void addr_phase(uint8_t dir, uint32_t ev)
{
    I2C_GenerateSTART(I2C1, ENABLE); wait_event(I2C_EVENT_MASTER_MODE_SELECT);
    I2C_Send7bitAddress(I2C1, EE_ADDR, dir); wait_event(ev);
}
static uint8_t ee_read(uint8_t mem)
{
    addr_phase(I2C_Direction_Transmitter, I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED);
    I2C_SendData(I2C1, mem); wait_event(I2C_EVENT_MASTER_BYTE_TRANSMITTED);
    addr_phase(I2C_Direction_Receiver, I2C_EVENT_MASTER_RECEIVER_MODE_SELECTED);
    I2C_AcknowledgeConfig(I2C1, DISABLE); I2C_GenerateSTOP(I2C1, ENABLE);
    while (I2C_GetFlagStatus(I2C1, I2C_FLAG_RXNE) == RESET) { }
    return I2C_ReceiveData(I2C1);
}

int main(void)
{
    GPIO_InitTypeDef gpio; I2C_InitTypeDef i2c;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOB, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_I2C1, ENABLE);
    gpio.GPIO_Pin = GPIO_Pin_6 | GPIO_Pin_7; gpio.GPIO_Mode = GPIO_Mode_AF_OD; gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOB, &gpio);
    I2C_StructInit(&i2c); i2c.I2C_ClockSpeed = 100000; I2C_Init(I2C1, &i2c); I2C_Cmd(I2C1, ENABLE);
    addr_phase(I2C_Direction_Transmitter, I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED);
    I2C_SendData(I2C1, 0x10); wait_event(I2C_EVENT_MASTER_BYTE_TRANSMITTED);
    I2C_SendData(I2C1, 0x5A); wait_event(I2C_EVENT_MASTER_BYTE_TRANSMITTED);
    I2C_GenerateSTOP(I2C1, ENABLE);
    for (volatile uint32_t i = 0; i < 360000; i++) { }   /* tWR 约 5 ms */
    uint8_t back = ee_read(0x10);
    while (1) { (void)back; }
}`,
      hal: `#include "stm32f1xx_hal.h"

I2C_HandleTypeDef hi2c1;

int main(void)
{
    GPIO_InitTypeDef gpio = {0};
    uint8_t val = 0x5A, back = 0;

    HAL_Init();
    __HAL_RCC_GPIOB_CLK_ENABLE(); __HAL_RCC_I2C1_CLK_ENABLE();
    gpio.Pin = GPIO_PIN_6 | GPIO_PIN_7; gpio.Mode = GPIO_MODE_AF_OD;
    gpio.Pull = GPIO_PULLUP; gpio.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(GPIOB, &gpio);

    hi2c1.Instance = I2C1;
    hi2c1.Init.ClockSpeed = 100000;
    hi2c1.Init.DutyCycle = I2C_DUTYCYCLE_2;
    hi2c1.Init.OwnAddress1 = 0;
    hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
    hi2c1.Init.DualAddressMode = I2C_DUALADDRESS_DISABLE;
    hi2c1.Init.GeneralCallMode = I2C_GENERALCALL_DISABLE;
    hi2c1.Init.NoStretchMode = I2C_NOSTRETCH_DISABLE;
    HAL_I2C_Init(&hi2c1);

    HAL_I2C_Mem_Write(&hi2c1, 0xA0, 0x10, I2C_MEMADD_SIZE_8BIT, &val, 1, 100);
    HAL_Delay(5);
    HAL_I2C_Mem_Read(&hi2c1, 0xA0, 0x10, I2C_MEMADD_SIZE_8BIT, &back, 1, 100);

    while (1) { }   /* back 应为 0x5A */
}`
    },
    pitfalls: [
      {
        zh: "0xA0 是 0x50 左移一位的写地址；HAL 的 DevAddress 要求左移后的值，SPL 的 Send7bitAddress 也按 0xA0 使用。",
        en: "0xA0 is 0x50 shifted left for writing; HAL wants the shifted value, and SPL examples pass 0xA0 to Send7bitAddress too."
      },
      {
        zh: "STOP 后不等 5 ms 就发下一次起始，器件在做内部写周期，会整体 NACK。",
        en: "Starting the next transfer immediately after STOP hits the internal write cycle and gets NACKed."
      },
      {
        zh: "单字节读取后没有重新 I2C_AcknowledgeConfig(ENABLE)，后续多字节读会在第一个字节就 NACK。",
        en: "After a single-byte read, leaving ACK disabled makes the next multi-byte read NACK after the first byte."
      }
    ],
    related: ["wf.spi-flash", "wf.usart-poll"],
    tags: ["i2c", "eeprom", "at24c02", "字节写", "随机读", "0xA0", "重复起始"]
  },

  {
    id: "wf.tim-pwm",
    p: "tim",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "TIM3 CH1 PWM 呼吸灯：72 MHz 出 1 kHz",
      en: "TIM3 CH1 PWM breathing LED: 1 kHz from 72 MHz"
    },
    goal: {
      zh: "把 TIM3 配成 1 kHz、分辨率 1000 级的 PWM，从 PA6 输出，主循环里慢慢改比较值做呼吸效果。",
      en: "Set TIM3 up for 1 kHz PWM with 1000 steps of resolution on PA6, then sweep the compare value in the main loop for a breathing LED."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "打开 TIM3 与 GPIOA 时钟", en: "Enable TIM3 and GPIOA clocks" },
        desc: {
          zh: "TIM3 在 APB1，GPIOA 在 APB2。APB1 分频不为 1 时定时器时钟是 PCLK1 的两倍，72 MHz 系统下 TIM3 仍是 72 MHz。",
          en: "TIM3 is on APB1 and GPIOA on APB2. When the APB1 divider is not 1 the timer clock doubles PCLK1, so TIM3 still runs at 72 MHz on a 72 MHz system."
        },
        fn: ["std.rcc.apb2clockcmd", "std.rcc.apb1clockcmd", "hal.rcc.clkenable", "hal.rcc.getpclk1freq"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);\nRCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);",
          hal: "__HAL_RCC_GPIOA_CLK_ENABLE();\n__HAL_RCC_TIM3_CLK_ENABLE();"
        }
      },
      {
        kind: "step",
        title: { zh: "PA6 配成复用推挽", en: "Configure PA6 as AF push-pull" },
        desc: {
          zh: "TIM3_CH1 默认映射到 PA6，必须配 AF_PP 才能把定时器输出送到引脚；普通输出只会读到 0。",
          en: "TIM3_CH1 defaults to PA6 and must be AF_PP for the timer output to reach the pin; a plain output just sits at 0."
        },
        fn: ["std.gpio.init", "hal.gpio.init"],
        code: {
          std: "gpio.GPIO_Pin = GPIO_Pin_6;\ngpio.GPIO_Mode = GPIO_Mode_AF_PP;\ngpio.GPIO_Speed = GPIO_Speed_50MHz;\nGPIO_Init(GPIOA, &gpio);",
          hal: "gpio.Pin = GPIO_PIN_6;\ngpio.Mode = GPIO_MODE_AF_PP;\ngpio.Speed = GPIO_SPEED_FREQ_HIGH;\nHAL_GPIO_Init(GPIOA, &gpio);"
        }
      },
      {
        kind: "step",
        title: { zh: "时基：71 分频、周期 999", en: "Time base: prescaler 71, period 999" },
        desc: {
          zh: "72 MHz / (71+1) = 1 MHz 计数时钟，再数 1000 个得到 1 kHz。周期值同时就是最大占空比，改占空比时不要超过它。",
          en: "72 MHz / (71+1) gives a 1 MHz count clock; 1000 ticks make 1 kHz. The period is also the full-scale duty value — never compare above it."
        },
        fn: ["std.tim.timebaseinit", "hal.tim.baseinit"],
        code: {
          std: "tb.TIM_Prescaler = 71;\ntb.TIM_Period = 999;\ntb.TIM_CounterMode = TIM_CounterMode_Up;\nTIM_TimeBaseInit(TIM3, &tb);",
          hal: "htim3.Init.Prescaler = 71;\nhtim3.Init.Period = 999;\nhtim3.Init.CounterMode = TIM_COUNTERMODE_UP;\nHAL_TIM_Base_Init(&htim3);"
        }
      },
      {
        kind: "step",
        title: { zh: "OC1 选 PWM1 模式并给初始占空比", en: "Set OC1 to PWM mode 1 with an initial duty" },
        desc: {
          zh: "PWM1 下计数值小于 Pulse 时输出有效电平。TIM_OC1Init 必须显式使能 OutputState，否则引脚保持无效电平。",
          en: "In PWM mode 1 the output is active while the counter is below Pulse. TIM_OC1Init needs OutputState enabled or the pin stays inactive."
        },
        fn: ["std.tim.ocinit", "hal.tim.pwmconfigchannel"],
        code: {
          std: "oc.TIM_OCMode = TIM_OCMode_PWM1;\noc.TIM_OutputState = TIM_OutputState_Enable;\noc.TIM_Pulse = 0;\noc.TIM_OCPolarity = TIM_OCPolarity_High;",
          hal: "oc.OCMode = TIM_OCMODE_PWM1;\noc.Pulse = 0;\noc.OCPolarity = TIM_OCPOLARITY_HIGH;\nHAL_TIM_PWM_ConfigChannel(&htim3, &oc, TIM_CHANNEL_1);"
        }
      },
      {
        kind: "step",
        title: { zh: "启动计数器与通道输出", en: "Start the counter and channel output" },
        desc: {
          zh: "SPL 先 TIM_OC1Init 再 TIM_Cmd；HAL 用 HAL_TIM_PWM_Start，它会同时使能计数器和捕获比较通道。",
          en: "SPL configures OC1 then calls TIM_Cmd; HAL_TIM_PWM_Start enables both the counter and the compare channel."
        },
        fn: ["std.tim.cmd", "hal.tim.pwmstart"],
        code: {
          std: "TIM_OC1Init(TIM3, &oc);\nTIM_Cmd(TIM3, ENABLE);",
          hal: "HAL_TIM_PWM_Start(&htim3, TIM_CHANNEL_1);"
        }
      },
      {
        kind: "end",
        title: { zh: "主循环里扫占空比做呼吸", en: "Sweep the duty in the main loop" },
        desc: {
          zh: "比较值 0~999 对应 0~100%。每步之间给几毫秒，扫完一个来回约 2 秒；不要用延时函数把整个循环卡死到无法响应其它任务。",
          en: "Compare values 0-999 map to 0-100%. A few milliseconds per step gives a roughly 2 s sweep; avoid a blocking delay that starves other work."
        },
        fn: ["std.tim.setcompare", "hal.tim.setcompare", "hal.tim.getcounter"],
        code: {
          std: "if (duty == 0) step = 10;\nif (duty >= 990) step = -10;\nduty += step; TIM_SetCompare1(TIM3, duty);",
          hal: "__HAL_TIM_SET_COMPARE(&htim3, TIM_CHANNEL_1, duty);\nHAL_Delay(5);"
        }
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

int main(void)
{
    GPIO_InitTypeDef gpio; TIM_TimeBaseInitTypeDef tb; TIM_OCInitTypeDef oc;
    uint16_t duty = 0; int8_t step = 10;

    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM3, ENABLE);
    gpio.GPIO_Pin = GPIO_Pin_6; gpio.GPIO_Mode = GPIO_Mode_AF_PP; gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &gpio);

    tb.TIM_Prescaler = 71;              /* 72 MHz / 72 = 1 MHz */
    tb.TIM_Period = 999;                /* 1 MHz / 1000 = 1 kHz */
    tb.TIM_CounterMode = TIM_CounterMode_Up;
    tb.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInit(TIM3, &tb);

    TIM_OCStructInit(&oc);
    oc.TIM_OCMode = TIM_OCMode_PWM1;
    oc.TIM_OutputState = TIM_OutputState_Enable;
    oc.TIM_Pulse = 0;
    oc.TIM_OCPolarity = TIM_OCPolarity_High;
    TIM_OC1Init(TIM3, &oc);
    TIM_Cmd(TIM3, ENABLE);

    while (1) {
        if (duty == 0) step = 10;
        if (duty >= 990) step = -10;
        duty += step;
        TIM_SetCompare1(TIM3, duty);
        for (volatile uint32_t i = 0; i < 7200; i++) { }   /* 约 1 ms */
    }
}`,
      hal: `#include "stm32f1xx_hal.h"

TIM_HandleTypeDef htim3;
int main(void)
{
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE(); __HAL_RCC_TIM3_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = GPIO_PIN_6; gpio.Mode = GPIO_MODE_AF_PP; gpio.Speed = GPIO_SPEED_FREQ_HIGH;
    HAL_GPIO_Init(GPIOA, &gpio);

    htim3.Instance = TIM3;
    htim3.Init.Prescaler = 71;            /* 1 MHz count clock */
    htim3.Init.Period = 999;              /* 1 kHz PWM */
    htim3.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim3.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    htim3.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
    HAL_TIM_Base_Init(&htim3);

    TIM_OC_InitTypeDef oc = {0};
    oc.OCMode = TIM_OCMODE_PWM1;
    oc.Pulse = 0;
    oc.OCPolarity = TIM_OCPOLARITY_HIGH;
    HAL_TIM_PWM_ConfigChannel(&htim3, &oc, TIM_CHANNEL_1);
    HAL_TIM_PWM_Start(&htim3, TIM_CHANNEL_1);

    uint16_t duty = 0; int8_t step = 10;
    while (1) {
        if (duty == 0) step = 10;
        else if (duty >= 990) step = -10;
        duty += step;
        __HAL_TIM_SET_COMPARE(&htim3, TIM_CHANNEL_1, duty);
        HAL_Delay(5);
    }
}`
    },
    pitfalls: [
      {
        zh: "把 TIM3 当 APB1 的 36 MHz 来算分频，实际定时器时钟是 72 MHz，输出会整整慢一倍。",
        en: "Computing from a 36 MHz APB1 clock is wrong: the timer clock is 72 MHz, so the output ends up half the intended frequency."
      },
      {
        zh: "高级定时器 TIM1/TIM8 还必须调用 TIM_CtrlPWMOutputs(TIMx, ENABLE)，TIM3 不需要。",
        en: "Advanced timers TIM1/TIM8 additionally need TIM_CtrlPWMOutputs(TIMx, ENABLE); TIM3 does not."
      },
      {
        zh: "比较值超过 Period 时占空比恒为 100%，看起来像“调不动”，先检查上限。",
        en: "A compare value above Period pins the output at 100%, which looks like a dead control — check the ceiling first."
      }
    ],
    related: ["wf.tim-irq", "wf.gpio-output"],
    tags: ["pwm", "tim3", "呼吸灯", "breathing", "占空比", "duty", "1khz"]
  },

  {
    id: "wf.tim-irq",
    p: "tim",
    level: 2,
    libs: ["std", "hal"],
    title: {
      zh: "TIM2 定时中断：1 ms 节拍计秒闪灯",
      en: "TIM2 1 ms tick: count seconds and blink an LED"
    },
    goal: {
      zh: "让 TIM2 每 1 ms 进一次更新中断，在中断里累加毫秒计数，主循环用它每 500 ms 翻转一次 LED，取代空转延时。",
      en: "Have TIM2 raise an update interrupt every 1 ms, accumulate milliseconds in the ISR, and let the main loop blink an LED every 500 ms instead of busy-waiting."
    },
    steps: [
      {
        kind: "start",
        title: { zh: "打开 TIM2 与 GPIOA 时钟", en: "Enable TIM2 and GPIOA clocks" },
        desc: {
          zh: "TIM2 在 APB1，LED 用的 GPIOA 在 APB2。先开时钟再写配置，否则时基寄存器写入无效。",
          en: "TIM2 is on APB1 and the LED port GPIOA on APB2. Clock first, otherwise the time-base writes are ignored."
        },
        fn: ["std.rcc.apb2clockcmd", "std.rcc.apb1clockcmd", "hal.rcc.clkenable"],
        code: {
          std: "RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);\nRCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);",
          hal: "__HAL_RCC_GPIOA_CLK_ENABLE();\n__HAL_RCC_TIM2_CLK_ENABLE();"
        }
      },
      {
        kind: "step",
        title: { zh: "时基：1 MHz 计数、1000 个溢出", en: "Time base: 1 MHz count, 1000 per overflow" },
        desc: {
          zh: "预分频 71 得到 1 MHz，周期 999 即每 1000 个计数溢出一次，正好 1 ms。计数模式向上，时钟分频保持 DIV1。",
          en: "Prescaler 71 yields 1 MHz; period 999 overflows every 1000 ticks — exactly 1 ms. Count up and keep clock division at DIV1."
        },
        fn: ["std.tim.timebaseinit", "hal.tim.baseinit"],
        code: {
          std: "tb.TIM_Prescaler = 71;\ntb.TIM_Period = 999;\ntb.TIM_CounterMode = TIM_CounterMode_Up;\nTIM_TimeBaseInit(TIM2, &tb);",
          hal: "htim2.Init.Prescaler = 71;\nhtim2.Init.Period = 999;\nhtim2.Init.CounterMode = TIM_COUNTERMODE_UP;\nHAL_TIM_Base_Init(&htim2);"
        }
      },
      {
        kind: "step",
        title: { zh: "使能更新中断并启动计数", en: "Enable the update interrupt and start counting" },
        desc: {
          zh: "SPL 是 TIM_ITConfig + TIM_Cmd 两步；HAL 用 HAL_TIM_Base_Start_IT 一次完成，它同时打开 UIE 与计数器。",
          en: "SPL needs TIM_ITConfig plus TIM_Cmd; HAL_TIM_Base_Start_IT does both, setting UIE and starting the counter."
        },
        fn: ["std.tim.itconfig", "std.tim.cmd", "hal.tim.basestartit"],
        code: {
          std: "TIM_ITConfig(TIM2, TIM_IT_Update, ENABLE);\nTIM_Cmd(TIM2, ENABLE);",
          hal: "HAL_TIM_Base_Start_IT(&htim2);"
        }
      },
      {
        kind: "step",
        title: { zh: "NVIC 打开 TIM2_IRQn", en: "Enable TIM2_IRQn in the NVIC" },
        desc: {
          zh: "优先级不要设得比采样或通信中断还高，1 ms 一次的节拍属于后台任务。分组只需在系统启动时配置一次。",
          en: "Keep its priority below sampling or comms interrupts — a 1 ms tick is background work. Priority grouping is set once at startup."
        },
        fn: ["std.nvic.prioritygroup", "std.nvic.init", "hal.nvic.setpriority", "hal.nvic.enableirq"],
        code: {
          std: "NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);\nnvic.NVIC_IRQChannel = TIM2_IRQn; nvic.NVIC_IRQChannelPreemptionPriority = 2;\nnvic.NVIC_IRQChannelCmd = ENABLE;\nNVIC_Init(&nvic);",
          hal: "HAL_NVIC_SetPriority(TIM2_IRQn, 2, 0);\nHAL_NVIC_EnableIRQ(TIM2_IRQn);"
        }
      },
      {
        kind: "isr",
        title: { zh: "在 ISR 里清更新标志并累加", en: "Clear the update flag and accumulate in the ISR" },
        desc: {
          zh: "SPL 必须用 TIM_GetITStatus 判断后 TIM_ClearITPendingBit，漏清会一直重进中断。HAL 只在入口调用 HAL_TIM_IRQHandler。",
          en: "SPL must test with TIM_GetITStatus then clear with TIM_ClearITPendingBit or the ISR re-enters forever. HAL only forwards to HAL_TIM_IRQHandler."
        },
        fn: ["std.tim.getitstatus", "std.tim.clearitpending", "hal.tim.irqhandler"],
        code: {
          std: "if (TIM_GetITStatus(TIM2, TIM_IT_Update) != RESET) {\n    TIM_ClearITPendingBit(TIM2, TIM_IT_Update);\n    g_ms++;\n}",
          hal: "void TIM2_IRQHandler(void) {\n    HAL_TIM_IRQHandler(&htim2);\n}"
        }
      },
      {
        kind: "check",
        title: { zh: "在回调里只做计数", en: "Do nothing but count in the callback" },
        desc: {
          zh: "HAL 的 HAL_TIM_PeriodElapsedCallback 里先判断 htim->Instance，再累加毫秒。回调运行在中断上下文，任何阻塞都会拖慢整个节拍。",
          en: "Check htim->Instance first in HAL_TIM_PeriodElapsedCallback, then increment milliseconds. The callback runs in interrupt context, so blocking breaks the tick."
        },
        fn: ["hal.tim.periodelapsedcallback", "std.tim.getcounter"],
        code: {
          std: "uint32_t us = TIM_GetCounter(TIM2);   /* 0~999 µs 余量 */\nuint32_t sec = g_ms / 1000;",
          hal: "void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *h) {\n    if (h->Instance == TIM2) g_ms++;\n}"
        }
      },
      {
        kind: "end",
        title: { zh: "主循环用毫秒差调度闪灯", en: "Schedule the blink from the millisecond delta" },
        desc: {
          zh: "用 g_ms - last >= 500 的差值判断，计数器溢回也正确。g_ms 要加 volatile，读多字节变量时最好用 __disable_irq 短暂保护。",
          en: "Compare g_ms - last >= 500 so the counter wrapping stays correct. Mark g_ms volatile, and briefly mask interrupts when reading multi-byte state."
        },
        fn: ["std.gpio.writebit", "hal.gpio.togglepin", "std.tim.getcounter"],
        code: {
          std: "if ((uint32_t)(g_ms - last) >= 500) {\n    last = g_ms;\n    GPIOA->ODR ^= GPIO_Pin_5;\n}",
          hal: "if ((uint32_t)(g_ms - last) >= 500) {\n    last = g_ms;\n    HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);\n}"
        }
      }
    ],
    code: {
      std: `#include "stm32f10x.h"

static volatile uint32_t g_ms;

void TIM2_IRQHandler(void)
{
    if (TIM_GetITStatus(TIM2, TIM_IT_Update) == RESET) return;
    TIM_ClearITPendingBit(TIM2, TIM_IT_Update); g_ms++;
}

int main(void)
{
    GPIO_InitTypeDef gpio; TIM_TimeBaseInitTypeDef tb; NVIC_InitTypeDef nvic;
    uint32_t last = 0;
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_TIM2, ENABLE);
    gpio.GPIO_Pin = GPIO_Pin_5; gpio.GPIO_Mode = GPIO_Mode_Out_PP; gpio.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &gpio);
    tb.TIM_Prescaler = 71; tb.TIM_Period = 999;        /* 1 MHz, 1 ms */
    tb.TIM_CounterMode = TIM_CounterMode_Up; tb.TIM_ClockDivision = TIM_CKD_DIV1;
    TIM_TimeBaseInit(TIM2, &tb);
    TIM_ITConfig(TIM2, TIM_IT_Update, ENABLE);
    NVIC_PriorityGroupConfig(NVIC_PriorityGroup_2);
    nvic.NVIC_IRQChannel = TIM2_IRQn; nvic.NVIC_IRQChannelPreemptionPriority = 2;
    nvic.NVIC_IRQChannelCmd = ENABLE;
    NVIC_Init(&nvic);
    TIM_Cmd(TIM2, ENABLE);
    while (1) {
        if ((uint32_t)(g_ms - last) >= 500) {
            last = g_ms;
            GPIOA->ODR ^= GPIO_Pin_5;
        }
    }
}`,
      hal: `#include "stm32f1xx_hal.h"

TIM_HandleTypeDef htim2;
static volatile uint32_t g_ms;
void TIM2_IRQHandler(void) { HAL_TIM_IRQHandler(&htim2); }
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim) { if (htim->Instance == TIM2) g_ms++; }

int main(void)
{
    HAL_Init();
    __HAL_RCC_GPIOA_CLK_ENABLE(); __HAL_RCC_TIM2_CLK_ENABLE();
    GPIO_InitTypeDef gpio = {0};
    gpio.Pin = GPIO_PIN_5; gpio.Mode = GPIO_MODE_OUTPUT_PP; gpio.Speed = GPIO_SPEED_FREQ_LOW;
    HAL_GPIO_Init(GPIOA, &gpio);
    htim2.Instance = TIM2;
    htim2.Init.Prescaler = 71; htim2.Init.Period = 999;        /* 1 MHz, 1 ms */
    htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    htim2.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
    HAL_TIM_Base_Init(&htim2);
    HAL_NVIC_SetPriority(TIM2_IRQn, 2, 0); HAL_NVIC_EnableIRQ(TIM2_IRQn);
    HAL_TIM_Base_Start_IT(&htim2);

    uint32_t last = 0;
    while (1) {
        if ((uint32_t)(g_ms - last) >= 500) {
            last = g_ms;
            HAL_GPIO_TogglePin(GPIOA, GPIO_PIN_5);
        }
    }
}`
    },
    pitfalls: [
      {
        zh: "漏掉 TIM_ClearITPendingBit 会让程序永远停在 ISR 里，主循环一次都不执行。",
        en: "Without TIM_ClearITPendingBit the MCU stays in the ISR forever and the main loop never runs."
      },
      {
        zh: "g_ms 不加 volatile，编译器会把主循环里的判断优化成只读一次。",
        en: "Without volatile the compiler hoists the g_ms read out of the loop and the comparison never changes."
      },
      {
        zh: "在回调里调用 HAL_Delay 或 printf 会阻塞节拍，1 ms 周期立刻被拉长。",
        en: "HAL_Delay or printf inside the callback blocks the tick and stretches the 1 ms period immediately."
      }
    ],
    related: ["wf.tim-pwm", "wf.usart-irq", "wf.gpio-output"],
    tags: ["定时器中断", "tim2", "1ms", "tick", "节拍", "闪灯", "volatile"]
  }
];
