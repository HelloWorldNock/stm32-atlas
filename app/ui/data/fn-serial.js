import { fn } from "./util.js";

/* USART · SPI · I2C */
export const SERIAL = [

  /* ---------------- USART · SPL ---------------- */
  fn({
    id: "std.usart.init", lib: "std", p: "usart", n: "USART_Init",
    sig: "void USART_Init(USART_TypeDef* USARTx, USART_InitTypeDef* USART_InitStruct);",
    zh: "配置波特率、字长、停止位、校验与流控。波特率会按当前 PCLK 自动换算。",
    en: "Set baud rate, word length, stop bits, parity and flow control; the divider is derived from the current PCLK.",
    params: [
      ["USARTx", "如 USART1 / USART2", "e.g. USART1 / USART2"],
      ["USART_InitStruct", "成员：BaudRate、WordLength、StopBits、Parity、Mode、HardwareFlowControl", "Members: baud, word length, stop bits, parity, mode, flow control"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_usart.h",
    eq: "hal.usart.init",
    rel: ["std.rcc.apb2clockcmd", "std.usart.cmd", "std.gpio.init"],
    tags: ["串口", "初始化", "uart", "init", "波特率", "baud"]
  }),
  fn({
    id: "std.usart.cmd", lib: "std", p: "usart", n: "USART_Cmd",
    sig: "void USART_Cmd(USART_TypeDef* USARTx, FunctionalState NewState);",
    zh: "使能或关闭串口。配置完成后必须 ENABLE，否则收发都不会工作。",
    en: "Enable or disable the UART. You must pass ENABLE after configuration or nothing is transmitted.",
    params: [
      ["USARTx", "串口基址", "UART base"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_usart.h",
    eq: "hal.usart.init",
    rel: ["std.usart.init", "std.usart.senddata"],
    tags: ["使能", "enable", "串口"]
  }),
  fn({
    id: "std.usart.senddata", lib: "std", p: "usart", n: "USART_SendData",
    sig: "void USART_SendData(USART_TypeDef* USARTx, uint16_t Data);",
    zh: "向数据寄存器写入一个字节。发送前要等 TXE，发送完成判断用 TC 标志。",
    en: "Write one byte to the data register; wait for TXE before writing, and for TC when the frame is fully out.",
    params: [
      ["USARTx", "串口基址", "UART base"],
      ["Data", "待发送字节（低 8/9 位有效）", "Byte to send (low 8/9 bits)"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_usart.h",
    eq: "hal.usart.transmit",
    rel: ["std.usart.getflagstatus", "std.usart.receivedata"],
    tags: ["发送", "tx", "send", "串口"]
  }),
  fn({
    id: "std.usart.receivedata", lib: "std", p: "usart", n: "USART_ReceiveData",
    sig: "uint16_t USART_ReceiveData(USART_TypeDef* USARTx);",
    zh: "从数据寄存器取回接收到的字节，读取动作会清除 RXNE 标志。",
    en: "Read the received byte from the data register; reading clears RXNE.",
    params: [["USARTx", "串口基址", "UART base"]],
    ret: ["接收到的字节", "Received byte"],
    hdr: "stm32f10x_usart.h",
    eq: "hal.usart.receive",
    rel: ["std.usart.getflagstatus", "std.usart.itconfig"],
    tags: ["接收", "rx", "receive", "串口"]
  }),
  fn({
    id: "std.usart.getflagstatus", lib: "std", p: "usart", n: "USART_GetFlagStatus",
    sig: "FlagStatus USART_GetFlagStatus(USART_TypeDef* USARTx, uint16_t USART_FLAG);",
    zh: "查询 TXE、TC、RXNE、ORE 等标志，轮询收发与错误判断都靠它。",
    en: "Poll TXE, TC, RXNE, ORE and other flags — the basis of polling I/O and error handling.",
    params: [
      ["USARTx", "串口基址", "UART base"],
      ["USART_FLAG", "如 USART_FLAG_TXE / RXNE / TC", "e.g. USART_FLAG_TXE / RXNE / TC"]
    ],
    ret: ["SET / RESET", "SET / RESET"],
    hdr: "stm32f10x_usart.h",
    rel: ["std.usart.senddata", "std.usart.receivedata"],
    tags: ["标志", "flag", "轮询", "poll", "txe", "rxne"]
  }),
  fn({
    id: "std.usart.itconfig", lib: "std", p: "usart", n: "USART_ITConfig",
    sig: "void USART_ITConfig(USART_TypeDef* USARTx, uint16_t USART_IT, FunctionalState NewState);",
    zh: "开启 RXNE/TXE/IDLE 等中断源；还需在 NVIC 中使能对应 IRQ 才会进 ISR。",
    en: "Enable RXNE/TXE/IDLE interrupt sources; the matching NVIC IRQ must also be enabled.",
    params: [
      ["USARTx", "串口基址", "UART base"],
      ["USART_IT", "如 USART_IT_RXNE", "e.g. USART_IT_RXNE"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_usart.h",
    eq: "hal.usart.receive_it",
    rel: ["std.nvic.init", "std.usart.getitstatus"],
    tags: ["中断", "it", "rxne", "使能"]
  }),
  fn({
    id: "std.usart.getitstatus", lib: "std", p: "usart", n: "USART_GetITStatus",
    sig: "ITStatus USART_GetITStatus(USART_TypeDef* USARTx, uint16_t USART_IT);",
    zh: "在 ISR 中判断具体是哪个串口事件，可同时检查 RXNE、IDLE、ORE。",
    en: "Identify which UART event fired inside the ISR; can test RXNE, IDLE and ORE together.",
    params: [
      ["USARTx", "串口基址", "UART base"],
      ["USART_IT", "中断源宏", "Interrupt source macro"]
    ],
    ret: ["SET / RESET", "SET / RESET"],
    hdr: "stm32f10x_usart.h",
    rel: ["std.usart.itconfig", "std.usart.clearitpending"],
    tags: ["中断", "状态", "isr", "flag"]
  }),
  fn({
    id: "std.usart.clearitpending", lib: "std", p: "usart", n: "USART_ClearITPendingBit",
    sig: "void USART_ClearITPendingBit(USART_TypeDef* USARTx, uint16_t USART_IT);",
    zh: "清除指定中断挂起位。RXNE 读取数据即清，TC 需先读 SR 再写 DR。",
    en: "Clear an interrupt pending bit. RXNE clears on read; TC requires reading SR then writing DR.",
    params: [
      ["USARTx", "串口基址", "UART base"],
      ["USART_IT", "中断源宏", "Interrupt source macro"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_usart.h",
    rel: ["std.usart.getitstatus"],
    tags: ["清除", "标志", "clear", "pending"]
  }),

  /* ---------------- USART · HAL ---------------- */
  fn({
    id: "hal.usart.init", lib: "hal", p: "usart", n: "HAL_UART_Init",
    sig: "HAL_StatusTypeDef HAL_UART_Init(UART_HandleTypeDef *huart);",
    zh: "按 huart->Init 中的参数初始化串口，并回调 HAL_UART_MspInit 配置时钟与引脚。",
    en: "Initialise the UART from huart->Init and call HAL_UART_MspInit for clocks and pins.",
    params: [["huart", "串口句柄，含实例与参数", "UART handle with instance and settings"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_uart.h",
    eq: "std.usart.init",
    rel: ["hal.rcc.clkenable", "hal.gpio.init", "hal.usart.transmit"],
    tags: ["串口", "初始化", "uart", "init", "msp"]
  }),
  fn({
    id: "hal.usart.transmit", lib: "hal", p: "usart", n: "HAL_UART_Transmit",
    sig: "HAL_StatusTypeDef HAL_UART_Transmit(UART_HandleTypeDef *huart, uint8_t *pData, uint16_t Size, uint32_t Timeout);",
    zh: "阻塞发送一段数据，超时返回 HAL_TIMEOUT。适合调试输出与短报文。",
    en: "Blocking transmit of a buffer; returns HAL_TIMEOUT on expiry. Fine for debug output and short frames.",
    params: [
      ["huart", "串口句柄", "UART handle"],
      ["pData", "数据缓冲区", "Data buffer"],
      ["Size", "字节数", "Number of bytes"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_TIMEOUT / HAL_ERROR", "HAL_OK / HAL_TIMEOUT / HAL_ERROR"],
    hdr: "stm32f1xx_hal_uart.h",
    eq: "std.usart.senddata",
    rel: ["hal.usart.transmit_it", "hal.usart.getstate"],
    tags: ["发送", "tx", "阻塞", "blocking", "printf"]
  }),
  fn({
    id: "hal.usart.receive", lib: "hal", p: "usart", n: "HAL_UART_Receive",
    sig: "HAL_StatusTypeDef HAL_UART_Receive(UART_HandleTypeDef *huart, uint8_t *pData, uint16_t Size, uint32_t Timeout);",
    zh: "阻塞接收指定长度数据，超时未收满返回 HAL_TIMEOUT，缓冲区内容不完整。",
    en: "Blocking receive of a fixed length; returns HAL_TIMEOUT with a partially filled buffer if short.",
    params: [
      ["huart", "串口句柄", "UART handle"],
      ["pData", "接收缓冲区", "Buffer"],
      ["Size", "期望字节数", "Expected bytes"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_TIMEOUT / HAL_ERROR", "HAL_OK / HAL_TIMEOUT / HAL_ERROR"],
    hdr: "stm32f1xx_hal_uart.h",
    eq: "std.usart.receivedata",
    rel: ["hal.usart.receive_it", "hal.usart.transmit"],
    tags: ["接收", "rx", "阻塞", "blocking"]
  }),
  fn({
    id: "hal.usart.transmit_it", lib: "hal", p: "usart", n: "HAL_UART_Transmit_IT",
    sig: "HAL_StatusTypeDef HAL_UART_Transmit_IT(UART_HandleTypeDef *huart, uint8_t *pData, uint16_t Size);",
    zh: "中断方式发送，立即返回；完成后回调 HAL_UART_TxCpltCallback。缓冲区必须存活到发送结束。",
    en: "Interrupt-driven transmit that returns immediately; HAL_UART_TxCpltCallback fires when done. Keep the buffer alive.",
    params: [
      ["huart", "串口句柄", "UART handle"],
      ["pData", "数据缓冲区（保持有效）", "Buffer (must stay valid)"],
      ["Size", "字节数", "Number of bytes"]
    ],
    ret: ["HAL_OK / HAL_BUSY / HAL_ERROR", "HAL_OK / HAL_BUSY / HAL_ERROR"],
    hdr: "stm32f1xx_hal_uart.h",
    eq: "std.usart.itconfig",
    rel: ["hal.usart.irqhandler", "hal.usart.getstate"],
    tags: ["中断", "发送", "it", "非阻塞", "tx"]
  }),
  fn({
    id: "hal.usart.receive_it", lib: "hal", p: "usart", n: "HAL_UART_Receive_IT",
    sig: "HAL_StatusTypeDef HAL_UART_Receive_IT(UART_HandleTypeDef *huart, uint8_t *pData, uint16_t Size);",
    zh: "中断接收固定长度，收满后回调 HAL_UART_RxCpltCallback；要在回调里重新调用才能连续接收。",
    en: "Interrupt receive of a fixed length; HAL_UART_RxCpltCallback fires when full — re-arm inside the callback.",
    params: [
      ["huart", "串口句柄", "UART handle"],
      ["pData", "接收缓冲区", "Buffer"],
      ["Size", "期望字节数", "Expected bytes"]
    ],
    ret: ["HAL_OK / HAL_BUSY / HAL_ERROR", "HAL_OK / HAL_BUSY / HAL_ERROR"],
    hdr: "stm32f1xx_hal_uart.h",
    eq: "std.usart.itconfig",
    rel: ["hal.usart.rxcpltcallback", "hal.usart.irqhandler", "hal.nvic.enableirq"],
    tags: ["中断", "接收", "it", "rx", "不定长"]
  }),
  fn({
    id: "hal.usart.irqhandler", lib: "hal", p: "usart", n: "HAL_UART_IRQHandler",
    sig: "void HAL_UART_IRQHandler(UART_HandleTypeDef *huart);",
    zh: "在 USARTx_IRQHandler 中调用，处理收发与错误标志并触发相应回调。",
    en: "Call from USARTx_IRQHandler; it processes RX/TX and error flags and invokes the callbacks.",
    params: [["huart", "串口句柄", "UART handle"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_uart.h",
    rel: ["hal.usart.rxcpltcallback", "hal.usart.receive_it"],
    tags: ["中断服务", "isr", "irq", "uart"]
  }),
  fn({
    id: "hal.usart.rxcpltcallback", lib: "hal", p: "usart", n: "HAL_UART_RxCpltCallback",
    sig: "__weak void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart);",
    zh: "接收完成弱回调，在其中处理数据并重新挂起 HAL_UART_Receive_IT。",
    en: "Weak receive-complete callback; process the data here and re-arm HAL_UART_Receive_IT.",
    params: [["huart", "串口句柄", "UART handle"]],
    ret: ["无", "None"],
    hdr: "stm32f1xx_hal_uart.h",
    rel: ["hal.usart.receive_it", "hal.usart.irqhandler"],
    tags: ["回调", "callback", "接收", "rx"]
  }),
  fn({
    id: "hal.usart.getstate", lib: "hal", p: "usart", n: "HAL_UART_GetState",
    sig: "HAL_UART_StateTypeDef HAL_UART_GetState(UART_HandleTypeDef *huart);",
    zh: "查询句柄当前状态（READY/BUSY/TIMEOUT 等），调试 HAL_BUSY 冲突时先看它。",
    en: "Query the handle state (READY/BUSY/TIMEOUT…); check it first when debugging HAL_BUSY.",
    params: [["huart", "串口句柄", "UART handle"]],
    ret: ["HAL_UART_StateTypeDef", "HAL_UART_StateTypeDef"],
    hdr: "stm32f1xx_hal_uart.h",
    rel: ["hal.usart.transmit", "hal.usart.receive_it"],
    tags: ["状态", "state", "busy", "调试"]
  }),

  /* ---------------- SPI · SPL ---------------- */
  fn({
    id: "std.spi.init", lib: "std", p: "spi", n: "SPI_Init",
    sig: "void SPI_Init(SPI_TypeDef* SPIx, SPI_InitTypeDef* SPI_InitStruct);",
    zh: "配置主机/从机、数据宽度、CPOL/CPHA、波特率分频与位序。模式必须与从机数据手册一致。",
    en: "Configure master/slave, data size, CPOL/CPHA, prescaler and bit order; match the slave datasheet exactly.",
    params: [
      ["SPIx", "如 SPI1 / SPI2", "e.g. SPI1 / SPI2"],
      ["SPI_InitStruct", "成员：Mode、Direction、DataSize、CPOL、CPHA、NSS、BaudRatePrescaler、FirstBit", "Members: mode, direction, data size, CPOL, CPHA, NSS, prescaler, first bit"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_spi.h",
    eq: "hal.spi.init",
    rel: ["std.rcc.apb2clockcmd", "std.gpio.init", "std.spi.cmd"],
    tags: ["spi", "初始化", "init", "cpol", "cpha", "模式"]
  }),
  fn({
    id: "std.spi.cmd", lib: "std", p: "spi", n: "SPI_Cmd",
    sig: "void SPI_Cmd(SPI_TypeDef* SPIx, FunctionalState NewState);",
    zh: "使能 SPI 外设。主机模式下使能后即可开始产生时钟。",
    en: "Enable the SPI peripheral; in master mode it starts generating clocks once enabled.",
    params: [
      ["SPIx", "SPI 基址", "SPI base"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_spi.h",
    eq: "hal.spi.init",
    rel: ["std.spi.init", "std.spi.i2s_senddata"],
    tags: ["使能", "enable", "spi"]
  }),
  fn({
    id: "std.spi.i2s_senddata", lib: "std", p: "spi", n: "SPI_I2S_SendData",
    sig: "void SPI_I2S_SendData(SPI_TypeDef* SPIx, uint16_t Data);",
    zh: "向 DR 写入待发送数据。写入前需确认 TXE，读回数据用 SPI_I2S_ReceiveData。",
    en: "Write a frame to DR; wait for TXE first. Read the received frame with SPI_I2S_ReceiveData.",
    params: [
      ["SPIx", "SPI 基址", "SPI base"],
      ["Data", "待发送数据（8/16 位）", "Frame to send (8/16-bit)"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_spi.h",
    eq: "hal.spi.transmit",
    rel: ["std.spi.i2s_receivedata", "std.spi.getflagstatus"],
    tags: ["发送", "tx", "spi", "send"]
  }),
  fn({
    id: "std.spi.i2s_receivedata", lib: "std", p: "spi", n: "SPI_I2S_ReceiveData",
    sig: "uint16_t SPI_I2S_ReceiveData(SPI_TypeDef* SPIx);",
    zh: "读回接收寄存器中的数据，读取会清除 RXNE。全双工通信中每次发送都会收到一帧。",
    en: "Read the receive register, clearing RXNE. In full duplex every transmitted frame returns one.",
    params: [["SPIx", "SPI 基址", "SPI base"]],
    ret: ["接收到的数据", "Received data"],
    hdr: "stm32f10x_spi.h",
    eq: "hal.spi.receive",
    rel: ["std.spi.i2s_senddata", "std.spi.getflagstatus"],
    tags: ["接收", "rx", "spi", "receive"]
  }),
  fn({
    id: "std.spi.getflagstatus", lib: "std", p: "spi", n: "SPI_I2S_GetFlagStatus",
    sig: "FlagStatus SPI_I2S_GetFlagStatus(SPI_TypeDef* SPIx, uint16_t SPI_I2S_FLAG);",
    zh: "查询 TXE、RXNE、BSY 标志。操作片选前后用 BSY 判断总线是否真正空闲。",
    en: "Poll TXE, RXNE and BSY; use BSY before releasing chip-select to ensure the bus is idle.",
    params: [
      ["SPIx", "SPI 基址", "SPI base"],
      ["SPI_I2S_FLAG", "如 SPI_I2S_FLAG_TXE / RXNE / BSY", "e.g. SPI_I2S_FLAG_TXE / RXNE / BSY"]
    ],
    ret: ["SET / RESET", "SET / RESET"],
    hdr: "stm32f10x_spi.h",
    rel: ["std.spi.i2s_senddata", "std.spi.i2s_receivedata"],
    tags: ["标志", "flag", "txe", "rxne", "bsy"]
  }),

  /* ---------------- SPI · HAL ---------------- */
  fn({
    id: "hal.spi.init", lib: "hal", p: "spi", n: "HAL_SPI_Init",
    sig: "HAL_StatusTypeDef HAL_SPI_Init(SPI_HandleTypeDef *hspi);",
    zh: "初始化 SPI 外设并调用 HAL_SPI_MspInit；片选引脚仍需用户自行控制。",
    en: "Initialise SPI and invoke HAL_SPI_MspInit; chip-select pins remain under user control.",
    params: [["hspi", "SPI 句柄", "SPI handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_spi.h",
    eq: "std.spi.init",
    rel: ["hal.rcc.clkenable", "hal.gpio.init", "hal.spi.transmit"],
    tags: ["spi", "初始化", "init", "msp"]
  }),
  fn({
    id: "hal.spi.transmit", lib: "hal", p: "spi", n: "HAL_SPI_Transmit",
    sig: "HAL_StatusTypeDef HAL_SPI_Transmit(SPI_HandleTypeDef *hspi, uint8_t *pData, uint16_t Size, uint32_t Timeout);",
    zh: "阻塞发送数据，主机模式下拉低片选后调用；只关心发送时可丢弃接收内容。",
    en: "Blocking transmit; call after pulling chip-select low in master mode. Received frames are discarded.",
    params: [
      ["hspi", "SPI 句柄", "SPI handle"],
      ["pData", "发送缓冲区", "TX buffer"],
      ["Size", "字节数", "Byte count"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_TIMEOUT / HAL_ERROR", "HAL_OK / HAL_TIMEOUT / HAL_ERROR"],
    hdr: "stm32f1xx_hal_spi.h",
    eq: "std.spi.i2s_senddata",
    rel: ["hal.spi.transmitreceive", "hal.spi.getstate"],
    tags: ["发送", "tx", "spi", "阻塞"]
  }),
  fn({
    id: "hal.spi.receive", lib: "hal", p: "spi", n: "HAL_SPI_Receive",
    sig: "HAL_StatusTypeDef HAL_SPI_Receive(SPI_HandleTypeDef *hspi, uint8_t *pData, uint16_t Size, uint32_t Timeout);",
    zh: "阻塞接收数据（内部自动发送哑字节维持时钟）。",
    en: "Blocking receive; dummy bytes are transmitted internally to keep the clock running.",
    params: [
      ["hspi", "SPI 句柄", "SPI handle"],
      ["pData", "接收缓冲区", "RX buffer"],
      ["Size", "字节数", "Byte count"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_TIMEOUT / HAL_ERROR", "HAL_OK / HAL_TIMEOUT / HAL_ERROR"],
    hdr: "stm32f1xx_hal_spi.h",
    eq: "std.spi.i2s_receivedata",
    rel: ["hal.spi.transmitreceive", "hal.spi.transmit"],
    tags: ["接收", "rx", "spi", "阻塞"]
  }),
  fn({
    id: "hal.spi.transmitreceive", lib: "hal", p: "spi", n: "HAL_SPI_TransmitReceive",
    sig: "HAL_StatusTypeDef HAL_SPI_TransmitReceive(SPI_HandleTypeDef *hspi, uint8_t *pTxData, uint8_t *pRxData, uint16_t Size, uint32_t Timeout);",
    zh: "全双工同时收发，用于 Flash 读命令后立即接收数据的典型时序。",
    en: "Full-duplex exchange — the typical pattern for flash commands followed by a data read.",
    params: [
      ["hspi", "SPI 句柄", "SPI handle"],
      ["pTxData", "发送缓冲区", "TX buffer"],
      ["pRxData", "接收缓冲区", "RX buffer"],
      ["Size", "字节数", "Byte count"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_TIMEOUT / HAL_ERROR", "HAL_OK / HAL_TIMEOUT / HAL_ERROR"],
    hdr: "stm32f1xx_hal_spi.h",
    eq: "std.spi.getflagstatus",
    rel: ["hal.spi.transmit", "hal.spi.receive"],
    tags: ["全双工", "duplex", "spi", "收发"]
  }),
  fn({
    id: "hal.spi.transmit_it", lib: "hal", p: "spi", n: "HAL_SPI_Transmit_IT",
    sig: "HAL_StatusTypeDef HAL_SPI_Transmit_IT(SPI_HandleTypeDef *hspi, uint8_t *pData, uint16_t Size);",
    zh: "中断方式发送，关闭中断前不要释放缓冲区，完成后回调 TxCpltCallback。",
    en: "Interrupt-driven transmit; keep the buffer alive until TxCpltCallback fires.",
    params: [
      ["hspi", "SPI 句柄", "SPI handle"],
      ["pData", "发送缓冲区", "TX buffer"],
      ["Size", "字节数", "Byte count"]
    ],
    ret: ["HAL_OK / HAL_BUSY / HAL_ERROR", "HAL_OK / HAL_BUSY / HAL_ERROR"],
    hdr: "stm32f1xx_hal_spi.h",
    eq: "std.spi.getflagstatus",
    rel: ["hal.spi.transmit", "hal.dma.start"],
    tags: ["中断", "发送", "it", "spi"]
  }),
  fn({
    id: "hal.spi.getstate", lib: "hal", p: "spi", n: "HAL_SPI_GetState",
    sig: "HAL_SPI_StateTypeDef HAL_SPI_GetState(SPI_HandleTypeDef *hspi);",
    zh: "读取 SPI 句柄状态，排查 HAL_BUSY 或上一次传输未结束时很有用。",
    en: "Read the SPI handle state; useful when diagnosing HAL_BUSY or an unfinished transfer.",
    params: [["hspi", "SPI 句柄", "SPI handle"]],
    ret: ["HAL_SPI_StateTypeDef", "HAL_SPI_StateTypeDef"],
    hdr: "stm32f1xx_hal_spi.h",
    rel: ["hal.spi.transmit", "hal.spi.transmit_it"],
    tags: ["状态", "state", "busy", "spi"]
  }),

  /* ---------------- I2C · SPL ---------------- */
  fn({
    id: "std.i2c.init", lib: "std", p: "i2c", n: "I2C_Init",
    sig: "void I2C_Init(I2C_TypeDef* I2Cx, I2C_InitTypeDef* I2C_InitStruct);",
    zh: "配置 I2C 时钟频率、自身地址、应答与 7/10 位模式。速度不得超过从机上限。",
    en: "Configure bus speed, own address, ACK and 7/10-bit mode; never exceed the slave's maximum speed.",
    params: [
      ["I2Cx", "如 I2C1 / I2C2", "e.g. I2C1 / I2C2"],
      ["I2C_InitStruct", "成员：ClockSpeed、Mode、OwnAddress1、Ack、AcknowledgedAddress", "Members: clock speed, mode, own address, ACK, addressing mode"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_i2c.h",
    eq: "hal.i2c.init",
    rel: ["std.rcc.apb1clockcmd", "std.i2c.cmd", "std.gpio.init"],
    tags: ["i2c", "初始化", "init", "速率"]
  }),
  fn({
    id: "std.i2c.cmd", lib: "std", p: "i2c", n: "I2C_Cmd",
    sig: "void I2C_Cmd(I2C_TypeDef* I2Cx, FunctionalState NewState);",
    zh: "使能 I2C 外设，必须在发起起始条件之前调用。",
    en: "Enable the I2C peripheral; required before generating a start condition.",
    params: [
      ["I2Cx", "I2C 基址", "I2C base"],
      ["NewState", "ENABLE / DISABLE", "ENABLE / DISABLE"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_i2c.h",
    eq: "hal.i2c.init",
    rel: ["std.i2c.init", "std.i2c.generatestart"],
    tags: ["使能", "enable", "i2c"]
  }),
  fn({
    id: "std.i2c.generatestart", lib: "std", p: "i2c", n: "I2C_GenerateSTART",
    sig: "void I2C_GenerateSTART(I2C_TypeDef* I2Cx, FunctionalState NewState);",
    zh: "产生（或重复产生）起始条件；随后用 I2C_CheckEvent 等待 SB 事件。",
    en: "Generate a (repeated) start condition, then wait for the SB event with I2C_CheckEvent.",
    params: [
      ["I2Cx", "I2C 基址", "I2C base"],
      ["NewState", "ENABLE 触发", "ENABLE to trigger"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_i2c.h",
    rel: ["std.i2c.checkevent", "std.i2c.send7bitaddress"],
    tags: ["起始", "start", "i2c", "时序"]
  }),
  fn({
    id: "std.i2c.send7bitaddress", lib: "std", p: "i2c", n: "I2C_Send7bitAddress",
    sig: "void I2C_Send7bitAddress(I2C_TypeDef* I2Cx, uint8_t Address, uint8_t I2C_Direction);",
    zh: "发送 7 位从机地址加读写方向位，之后等待 ADDR 事件。",
    en: "Send the 7-bit slave address plus the R/W bit, then wait for the ADDR event.",
    params: [
      ["I2Cx", "I2C 基址", "I2C base"],
      ["Address", "从机 7 位地址（未左移）", "7-bit slave address (unshifted)"],
      ["I2C_Direction", "I2C_Direction_Transmitter / Receiver", "I2C_Direction_Transmitter / Receiver"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_i2c.h",
    rel: ["std.i2c.checkevent", "std.i2c.senddata"],
    tags: ["地址", "address", "i2c", "读写"]
  }),
  fn({
    id: "std.i2c.senddata", lib: "std", p: "i2c", n: "I2C_SendData",
    sig: "void I2C_SendData(I2C_TypeDef* I2Cx, uint8_t Data);",
    zh: "写一个字节到数据寄存器，等待 TXE 后可继续写下一个。",
    en: "Write one byte to DR; wait for TXE before the next byte.",
    params: [
      ["I2Cx", "I2C 基址", "I2C base"],
      ["Data", "待发送字节", "Byte to send"]
    ],
    ret: ["无", "None"],
    hdr: "stm32f10x_i2c.h",
    eq: "hal.i2c.mem_write",
    rel: ["std.i2c.getflagstatus", "std.i2c.receivedata"],
    tags: ["发送", "tx", "i2c", "写"]
  }),
  fn({
    id: "std.i2c.receivedata", lib: "std", p: "i2c", n: "I2C_ReceiveData",
    sig: "uint8_t I2C_ReceiveData(I2C_TypeDef* I2Cx);",
    zh: "读取接收寄存器；读最后一个字节前要先置 ACK=0 并准备 STOP。",
    en: "Read the received byte; before the last byte set ACK=0 and prepare STOP.",
    params: [["I2Cx", "I2C 基址", "I2C base"]],
    ret: ["接收到的字节", "Received byte"],
    hdr: "stm32f10x_i2c.h",
    eq: "hal.i2c.mem_read",
    rel: ["std.i2c.getflagstatus", "std.i2c.checkevent"],
    tags: ["接收", "rx", "i2c", "读"]
  }),
  fn({
    id: "std.i2c.checkevent", lib: "std", p: "i2c", n: "I2C_CheckEvent",
    sig: "ErrorStatus I2C_CheckEvent(I2C_TypeDef* I2Cx, uint32_t I2C_EVENT);",
    zh: "等待并校验标准事件（SB、ADDR、TXE、RXNE、BTF），SPL 的 I2C 通信全靠它推进时序。",
    en: "Wait for and verify standard events (SB, ADDR, TXE, RXNE, BTF); SPL I2C sequences are driven by these checks.",
    params: [
      ["I2Cx", "I2C 基址", "I2C base"],
      ["I2C_EVENT", "如 I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED", "e.g. I2C_EVENT_MASTER_TRANSMITTER_MODE_SELECTED"]
    ],
    ret: ["SUCCESS / ERROR", "SUCCESS / ERROR"],
    hdr: "stm32f10x_i2c.h",
    rel: ["std.i2c.generatestart", "std.i2c.getflagstatus"],
    tags: ["事件", "event", "i2c", "时序", "超时"]
  }),
  fn({
    id: "std.i2c.getflagstatus", lib: "std", p: "i2c", n: "I2C_GetFlagStatus",
    sig: "FlagStatus I2C_GetFlagStatus(I2C_TypeDef* I2Cx, uint32_t I2C_FLAG);",
    zh: "查询 BUSY、TXE、RXNE、AF、ARLO 等标志，错误恢复与超时判断使用。",
    en: "Poll BUSY, TXE, RXNE, AF or ARLO; use it for timeout and error recovery.",
    params: [
      ["I2Cx", "I2C 基址", "I2C base"],
      ["I2C_FLAG", "如 I2C_FLAG_BUSY / AF", "e.g. I2C_FLAG_BUSY / AF"]
    ],
    ret: ["SET / RESET", "SET / RESET"],
    hdr: "stm32f10x_i2c.h",
    rel: ["std.i2c.checkevent", "std.i2c.receivedata"],
    tags: ["标志", "flag", "busy", "错误", "error"]
  }),

  /* ---------------- I2C · HAL ---------------- */
  fn({
    id: "hal.i2c.init", lib: "hal", p: "i2c", n: "HAL_I2C_Init",
    sig: "HAL_StatusTypeDef HAL_I2C_Init(I2C_HandleTypeDef *hi2c);",
    zh: "初始化 I2C 速率、地址模式与模拟/数字滤波，MspInit 中配置引脚与时钟。",
    en: "Initialise speed, addressing and filters; MspInit sets pins and clocks.",
    params: [["hi2c", "I2C 句柄", "I2C handle"]],
    ret: ["HAL_OK / HAL_ERROR", "HAL_OK / HAL_ERROR"],
    hdr: "stm32f1xx_hal_i2c.h",
    eq: "std.i2c.init",
    rel: ["hal.rcc.clkenable", "hal.gpio.init", "hal.i2c.isdeviceready"],
    tags: ["i2c", "初始化", "init", "msp"]
  }),
  fn({
    id: "hal.i2c.mem_write", lib: "hal", p: "i2c", n: "HAL_I2C_Mem_Write",
    sig: "HAL_StatusTypeDef HAL_I2C_Mem_Write(I2C_HandleTypeDef *hi2c, uint16_t DevAddress, uint16_t MemAddress, uint16_t MemAddSize, uint8_t *pData, uint16_t Size, uint32_t Timeout);",
    zh: "向从机寄存器地址写数据，EEPROM 与传感器配置最常用；地址要左移一位。",
    en: "Write to a register address — the standard call for EEPROM and sensor setup; pass the address shifted left by one.",
    params: [
      ["hi2c", "I2C 句柄", "I2C handle"],
      ["DevAddress", "从机地址 << 1", "Slave address << 1"],
      ["MemAddress", "寄存器/存储地址", "Register / memory address"],
      ["MemAddSize", "I2C_MEMADD_SIZE_8BIT / 16BIT", "I2C_MEMADD_SIZE_8BIT / 16BIT"],
      ["pData", "数据缓冲区", "Data buffer"],
      ["Size", "字节数", "Byte count"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_ERROR / HAL_TIMEOUT", "HAL_OK / HAL_ERROR / HAL_TIMEOUT"],
    hdr: "stm32f1xx_hal_i2c.h",
    eq: "std.i2c.senddata",
    rel: ["hal.i2c.mem_read", "hal.i2c.isdeviceready"],
    tags: ["写寄存器", "memwrite", "i2c", "eeprom", "传感器"]
  }),
  fn({
    id: "hal.i2c.mem_read", lib: "hal", p: "i2c", n: "HAL_I2C_Mem_Read",
    sig: "HAL_StatusTypeDef HAL_I2C_Mem_Read(I2C_HandleTypeDef *hi2c, uint16_t DevAddress, uint16_t MemAddress, uint16_t MemAddSize, uint8_t *pData, uint16_t Size, uint32_t Timeout);",
    zh: "从从机寄存器读取指定长度数据，内部自动完成写地址、重复起始与读取。",
    en: "Read from a register address; the driver handles the address phase, repeated start and read.",
    params: [
      ["hi2c", "I2C 句柄", "I2C handle"],
      ["DevAddress", "从机地址 << 1", "Slave address << 1"],
      ["MemAddress", "寄存器/存储地址", "Register / memory address"],
      ["MemAddSize", "8 位或 16 位地址长度", "8-bit or 16-bit address size"],
      ["pData", "接收缓冲区", "RX buffer"],
      ["Size", "字节数", "Byte count"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_ERROR / HAL_TIMEOUT", "HAL_OK / HAL_ERROR / HAL_TIMEOUT"],
    hdr: "stm32f1xx_hal_i2c.h",
    eq: "std.i2c.receivedata",
    rel: ["hal.i2c.mem_write", "hal.i2c.isdeviceready"],
    tags: ["读寄存器", "memread", "i2c", "eeprom", "传感器"]
  }),
  fn({
    id: "hal.i2c.master_transmit", lib: "hal", p: "i2c", n: "HAL_I2C_Master_Transmit",
    sig: "HAL_StatusTypeDef HAL_I2C_Master_Transmit(I2C_HandleTypeDef *hi2c, uint16_t DevAddress, uint8_t *pData, uint16_t Size, uint32_t Timeout);",
    zh: "主机向从机发送一段原始数据，不经过寄存器地址阶段。",
    en: "Master transmit of a raw buffer without a register-address phase.",
    params: [
      ["hi2c", "I2C 句柄", "I2C handle"],
      ["DevAddress", "从机地址 << 1", "Slave address << 1"],
      ["pData", "发送缓冲区", "TX buffer"],
      ["Size", "字节数", "Byte count"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_ERROR / HAL_TIMEOUT", "HAL_OK / HAL_ERROR / HAL_TIMEOUT"],
    hdr: "stm32f1xx_hal_i2c.h",
    eq: "std.i2c.senddata",
    rel: ["hal.i2c.master_receive", "hal.i2c.mem_write"],
    tags: ["发送", "tx", "i2c", "master"]
  }),
  fn({
    id: "hal.i2c.master_receive", lib: "hal", p: "i2c", n: "HAL_I2C_Master_Receive",
    sig: "HAL_StatusTypeDef HAL_I2C_Master_Receive(I2C_HandleTypeDef *hi2c, uint16_t DevAddress, uint8_t *pData, uint16_t Size, uint32_t Timeout);",
    zh: "主机从从机读取原始数据，通常接在写地址命令之后（部分器件需要）。",
    en: "Master receive of raw data, often issued after a command write on some devices.",
    params: [
      ["hi2c", "I2C 句柄", "I2C handle"],
      ["DevAddress", "从机地址 << 1", "Slave address << 1"],
      ["pData", "接收缓冲区", "RX buffer"],
      ["Size", "字节数", "Byte count"],
      ["Timeout", "超时毫秒数", "Timeout in ms"]
    ],
    ret: ["HAL_OK / HAL_ERROR / HAL_TIMEOUT", "HAL_OK / HAL_ERROR / HAL_TIMEOUT"],
    hdr: "stm32f1xx_hal_i2c.h",
    eq: "std.i2c.receivedata",
    rel: ["hal.i2c.master_transmit", "hal.i2c.mem_read"],
    tags: ["接收", "rx", "i2c", "master"]
  }),
  fn({
    id: "hal.i2c.isdeviceready", lib: "hal", p: "i2c", n: "HAL_I2C_IsDeviceReady",
    sig: "HAL_StatusTypeDef HAL_I2C_IsDeviceReady(I2C_HandleTypeDef *hi2c, uint16_t DevAddress, uint32_t Trials, uint32_t Timeout);",
    zh: "探测从机是否应答，初始化自检与总线故障定位的第一步。",
    en: "Probe whether a slave acknowledges; the first check when bringing up a bus or debugging wiring.",
    params: [
      ["hi2c", "I2C 句柄", "I2C handle"],
      ["DevAddress", "从机地址 << 1", "Slave address << 1"],
      ["Trials", "尝试次数", "Number of trials"],
      ["Timeout", "每次超时毫秒数", "Timeout per trial in ms"]
    ],
    ret: ["HAL_OK / HAL_ERROR / HAL_BUSY", "HAL_OK / HAL_ERROR / HAL_BUSY"],
    hdr: "stm32f1xx_hal_i2c.h",
    eq: "std.i2c.getflagstatus",
    rel: ["hal.i2c.init", "hal.i2c.mem_read"],
    tags: ["探测", "probe", "i2c", "地址", "自检"]
  })
];
