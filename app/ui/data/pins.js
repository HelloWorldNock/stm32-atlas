// 生成文件，请勿手工编辑：python tools/gen-pins.py
// 数据来源：江协《STM32 入门教程》参考文档 —— STM32F103C8T6引脚定义.xlsx
// kind: power | reset | boot | osc | io | other；periphs 取自复用/重定义功能里的外设名
// altList / remapList 按“/”拆开；port + bit 仅 GPIO 引脚有

export const PINS = [
 {
  "no": 1,
  "name": "VBAT",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VBAT"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 },
 {
  "no": 2,
  "name": "PC13-TAMPER-RTC",
  "type": "I/O",
  "level": "",
  "gpio": "PC13",
  "alt": "TAMPER-RTC",
  "remap": "",
  "altList": [
   "TAMPER-RTC"
  ],
  "remapList": [],
  "port": "C",
  "bit": 13,
  "kind": "io",
  "periphs": [
   "rtc"
  ]
 },
 {
  "no": 3,
  "name": "PC14-OSC32_IN",
  "type": "I/O",
  "level": "",
  "gpio": "PC14",
  "alt": "OSC32_IN",
  "remap": "",
  "altList": [
   "OSC32_IN"
  ],
  "remapList": [],
  "port": "C",
  "bit": 14,
  "kind": "io",
  "periphs": [
   "rcc"
  ]
 },
 {
  "no": 4,
  "name": "PC15-OSC32_OUT",
  "type": "I/O",
  "level": "",
  "gpio": "PC15",
  "alt": "OSC32_OUT",
  "remap": "",
  "altList": [
   "OSC32_OUT"
  ],
  "remapList": [],
  "port": "C",
  "bit": 15,
  "kind": "io",
  "periphs": [
   "rcc"
  ]
 },
 {
  "no": 5,
  "name": "OSC_IN",
  "type": "I",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "OSC_IN"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "osc",
  "periphs": []
 },
 {
  "no": 6,
  "name": "OSC_OUT",
  "type": "O",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "OSC_OUT"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "osc",
  "periphs": []
 },
 {
  "no": 7,
  "name": "NRST",
  "type": "I/O",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "NRST"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "reset",
  "periphs": []
 },
 {
  "no": 8,
  "name": "VSSA",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VSSA"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 },
 {
  "no": 9,
  "name": "VDDA",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VDDA"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 },
 {
  "no": 10,
  "name": "PA0-WKUP",
  "type": "I/O",
  "level": "",
  "gpio": "PA0",
  "alt": "WKUP/USART2_CTS/ADC12_IN0/TIM2_CH1_ETR",
  "remap": "",
  "altList": [
   "WKUP",
   "USART2_CTS",
   "ADC12_IN0",
   "TIM2_CH1_ETR"
  ],
  "remapList": [],
  "port": "A",
  "bit": 0,
  "kind": "io",
  "periphs": [
   "exti",
   "usart",
   "adc",
   "tim"
  ]
 },
 {
  "no": 11,
  "name": "PA1",
  "type": "I/O",
  "level": "",
  "gpio": "PA1",
  "alt": "USART2_RTS/ADC12_IN1/TIM2_CH2",
  "remap": "",
  "altList": [
   "USART2_RTS",
   "ADC12_IN1",
   "TIM2_CH2"
  ],
  "remapList": [],
  "port": "A",
  "bit": 1,
  "kind": "io",
  "periphs": [
   "usart",
   "adc",
   "tim"
  ]
 },
 {
  "no": 12,
  "name": "PA2",
  "type": "I/O",
  "level": "",
  "gpio": "PA2",
  "alt": "USART2_TX/ADC12_IN2/TIM2_CH3",
  "remap": "",
  "altList": [
   "USART2_TX",
   "ADC12_IN2",
   "TIM2_CH3"
  ],
  "remapList": [],
  "port": "A",
  "bit": 2,
  "kind": "io",
  "periphs": [
   "usart",
   "adc",
   "tim"
  ]
 },
 {
  "no": 13,
  "name": "PA3",
  "type": "I/O",
  "level": "",
  "gpio": "PA3",
  "alt": "USART2_RX/ADC12_IN3/TIM2_CH4",
  "remap": "",
  "altList": [
   "USART2_RX",
   "ADC12_IN3",
   "TIM2_CH4"
  ],
  "remapList": [],
  "port": "A",
  "bit": 3,
  "kind": "io",
  "periphs": [
   "usart",
   "adc",
   "tim"
  ]
 },
 {
  "no": 14,
  "name": "PA4",
  "type": "I/O",
  "level": "",
  "gpio": "PA4",
  "alt": "SPI1_NSS/USART2_CK/ADC12_IN4",
  "remap": "",
  "altList": [
   "SPI1_NSS",
   "USART2_CK",
   "ADC12_IN4"
  ],
  "remapList": [],
  "port": "A",
  "bit": 4,
  "kind": "io",
  "periphs": [
   "spi",
   "usart",
   "adc"
  ]
 },
 {
  "no": 15,
  "name": "PA5",
  "type": "I/O",
  "level": "",
  "gpio": "PA5",
  "alt": "SPI1_SCK/ADC12_IN5",
  "remap": "",
  "altList": [
   "SPI1_SCK",
   "ADC12_IN5"
  ],
  "remapList": [],
  "port": "A",
  "bit": 5,
  "kind": "io",
  "periphs": [
   "spi",
   "adc"
  ]
 },
 {
  "no": 16,
  "name": "PA6",
  "type": "I/O",
  "level": "",
  "gpio": "PA6",
  "alt": "SPI1_MISO/ADC12_IN6/TIM3_CH1",
  "remap": "TIM1_BKIN",
  "altList": [
   "SPI1_MISO",
   "ADC12_IN6",
   "TIM3_CH1"
  ],
  "remapList": [
   "TIM1_BKIN"
  ],
  "port": "A",
  "bit": 6,
  "kind": "io",
  "periphs": [
   "spi",
   "adc",
   "tim"
  ]
 },
 {
  "no": 17,
  "name": "PA7",
  "type": "I/O",
  "level": "",
  "gpio": "PA7",
  "alt": "SPI1_MOSI/ADC12_IN7/TIM3_CH2",
  "remap": "TIM1_CH1N",
  "altList": [
   "SPI1_MOSI",
   "ADC12_IN7",
   "TIM3_CH2"
  ],
  "remapList": [
   "TIM1_CH1N"
  ],
  "port": "A",
  "bit": 7,
  "kind": "io",
  "periphs": [
   "spi",
   "adc",
   "tim"
  ]
 },
 {
  "no": 18,
  "name": "PB0",
  "type": "I/O",
  "level": "",
  "gpio": "PB0",
  "alt": "ADC12_IN8/TIM3_CH3",
  "remap": "TIM1_CH2N",
  "altList": [
   "ADC12_IN8",
   "TIM3_CH3"
  ],
  "remapList": [
   "TIM1_CH2N"
  ],
  "port": "B",
  "bit": 0,
  "kind": "io",
  "periphs": [
   "adc",
   "tim"
  ]
 },
 {
  "no": 19,
  "name": "PB1",
  "type": "I/O",
  "level": "",
  "gpio": "PB1",
  "alt": "ADC12_IN9/TIM3_CH4",
  "remap": "TIM1_CH3N",
  "altList": [
   "ADC12_IN9",
   "TIM3_CH4"
  ],
  "remapList": [
   "TIM1_CH3N"
  ],
  "port": "B",
  "bit": 1,
  "kind": "io",
  "periphs": [
   "adc",
   "tim"
  ]
 },
 {
  "no": 20,
  "name": "PB2",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB2",
  "alt": "",
  "remap": "",
  "altList": [
   "BOOT1"
  ],
  "remapList": [],
  "port": "B",
  "bit": 2,
  "kind": "io",
  "periphs": []
 },
 {
  "no": 21,
  "name": "PB10",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB10",
  "alt": "I2C2_SCL/USART3_TX",
  "remap": "TIM2_CH3",
  "altList": [
   "I2C2_SCL",
   "USART3_TX"
  ],
  "remapList": [
   "TIM2_CH3"
  ],
  "port": "B",
  "bit": 10,
  "kind": "io",
  "periphs": [
   "i2c",
   "usart",
   "tim"
  ]
 },
 {
  "no": 22,
  "name": "PB11",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB11",
  "alt": "I2C2_SDA/USART3_RX",
  "remap": "TIM2_CH4",
  "altList": [
   "I2C2_SDA",
   "USART3_RX"
  ],
  "remapList": [
   "TIM2_CH4"
  ],
  "port": "B",
  "bit": 11,
  "kind": "io",
  "periphs": [
   "i2c",
   "usart",
   "tim"
  ]
 },
 {
  "no": 23,
  "name": "VSS_1",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VSS_1"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 },
 {
  "no": 24,
  "name": "VDD_1",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VDD_1"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 },
 {
  "no": 25,
  "name": "PB12",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB12",
  "alt": "SPI2_NSS/I2C2_SMBAI/USART3_CK/TIM1_BKIN",
  "remap": "",
  "altList": [
   "SPI2_NSS",
   "I2C2_SMBAI",
   "USART3_CK",
   "TIM1_BKIN"
  ],
  "remapList": [],
  "port": "B",
  "bit": 12,
  "kind": "io",
  "periphs": [
   "spi",
   "i2c",
   "usart",
   "tim"
  ]
 },
 {
  "no": 26,
  "name": "PB13",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB13",
  "alt": "SPI2_SCK/USART3_CTS/TIM1_CH1N",
  "remap": "",
  "altList": [
   "SPI2_SCK",
   "USART3_CTS",
   "TIM1_CH1N"
  ],
  "remapList": [],
  "port": "B",
  "bit": 13,
  "kind": "io",
  "periphs": [
   "spi",
   "usart",
   "tim"
  ]
 },
 {
  "no": 27,
  "name": "PB14",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB14",
  "alt": "SPI2_MISO/USART3_RTS/TIM1_CH2N",
  "remap": "",
  "altList": [
   "SPI2_MISO",
   "USART3_RTS",
   "TIM1_CH2N"
  ],
  "remapList": [],
  "port": "B",
  "bit": 14,
  "kind": "io",
  "periphs": [
   "spi",
   "usart",
   "tim"
  ]
 },
 {
  "no": 28,
  "name": "PB15",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB15",
  "alt": "SPI2_MOSI/TIM1_CH3N",
  "remap": "",
  "altList": [
   "SPI2_MOSI",
   "TIM1_CH3N"
  ],
  "remapList": [],
  "port": "B",
  "bit": 15,
  "kind": "io",
  "periphs": [
   "spi",
   "tim"
  ]
 },
 {
  "no": 29,
  "name": "PA8",
  "type": "I/O",
  "level": "FT",
  "gpio": "PA8",
  "alt": "USART1_CK/TIM1_CH1/MCO",
  "remap": "",
  "altList": [
   "USART1_CK",
   "TIM1_CH1",
   "MCO"
  ],
  "remapList": [],
  "port": "A",
  "bit": 8,
  "kind": "io",
  "periphs": [
   "usart",
   "tim",
   "rcc"
  ]
 },
 {
  "no": 30,
  "name": "PA9",
  "type": "I/O",
  "level": "FT",
  "gpio": "PA9",
  "alt": "USART1_TX/TIM1_CH2",
  "remap": "",
  "altList": [
   "USART1_TX",
   "TIM1_CH2"
  ],
  "remapList": [],
  "port": "A",
  "bit": 9,
  "kind": "io",
  "periphs": [
   "usart",
   "tim"
  ]
 },
 {
  "no": 31,
  "name": "PA10",
  "type": "I/O",
  "level": "FT",
  "gpio": "PA10",
  "alt": "USART1_RX/TIM1_CH3",
  "remap": "",
  "altList": [
   "USART1_RX",
   "TIM1_CH3"
  ],
  "remapList": [],
  "port": "A",
  "bit": 10,
  "kind": "io",
  "periphs": [
   "usart",
   "tim"
  ]
 },
 {
  "no": 32,
  "name": "PA11",
  "type": "I/O",
  "level": "FT",
  "gpio": "PA11",
  "alt": "USART1_CTS/USBDM/CAN_RX/TIM1_CH4",
  "remap": "",
  "altList": [
   "USART1_CTS",
   "USBDM",
   "CAN_RX",
   "TIM1_CH4"
  ],
  "remapList": [],
  "port": "A",
  "bit": 11,
  "kind": "io",
  "periphs": [
   "usart",
   "tim"
  ]
 },
 {
  "no": 33,
  "name": "PA12",
  "type": "I/O",
  "level": "FT",
  "gpio": "PA12",
  "alt": "USART1_RTS/USBDP/CAN_TX/TIM1_ETR",
  "remap": "",
  "altList": [
   "USART1_RTS",
   "USBDP",
   "CAN_TX",
   "TIM1_ETR"
  ],
  "remapList": [],
  "port": "A",
  "bit": 12,
  "kind": "io",
  "periphs": [
   "usart",
   "tim"
  ]
 },
 {
  "no": 34,
  "name": "PA13",
  "type": "I/O",
  "level": "FT",
  "gpio": "PA13",
  "alt": "",
  "remap": "PA13",
  "altList": [
   "SWDIO",
   "JTMS"
  ],
  "remapList": [
   "PA13"
  ],
  "port": "A",
  "bit": 13,
  "kind": "io",
  "periphs": [
   "gpio"
  ]
 },
 {
  "no": 35,
  "name": "VSS_2",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VSS_2"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 },
 {
  "no": 36,
  "name": "VDD_2",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VDD_2"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 },
 {
  "no": 37,
  "name": "PA14",
  "type": "I/O",
  "level": "FT",
  "gpio": "PA14",
  "alt": "",
  "remap": "PA14",
  "altList": [
   "SWCLK",
   "JTCK"
  ],
  "remapList": [
   "PA14"
  ],
  "port": "A",
  "bit": 14,
  "kind": "io",
  "periphs": [
   "gpio"
  ]
 },
 {
  "no": 38,
  "name": "PA15",
  "type": "I/O",
  "level": "FT",
  "gpio": "PA15",
  "alt": "",
  "remap": "TIM2_CH1_ETR/PA15/SPI1_NSS",
  "altList": [
   "JTDI"
  ],
  "remapList": [
   "TIM2_CH1_ETR",
   "PA15",
   "SPI1_NSS"
  ],
  "port": "A",
  "bit": 15,
  "kind": "io",
  "periphs": [
   "gpio",
   "tim",
   "spi"
  ]
 },
 {
  "no": 39,
  "name": "PB3",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB3",
  "alt": "",
  "remap": "PB3/TRACESWO/TIM2_CH2/SPI1_SCK",
  "altList": [
   "JTDO"
  ],
  "remapList": [
   "PB3",
   "TRACESWO",
   "TIM2_CH2",
   "SPI1_SCK"
  ],
  "port": "B",
  "bit": 3,
  "kind": "io",
  "periphs": [
   "gpio",
   "tim",
   "spi"
  ]
 },
 {
  "no": 40,
  "name": "PB4",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB4",
  "alt": "",
  "remap": "PB4/TIM3_CH1/SPI1_MISO",
  "altList": [
   "NJTRST"
  ],
  "remapList": [
   "PB4",
   "TIM3_CH1",
   "SPI1_MISO"
  ],
  "port": "B",
  "bit": 4,
  "kind": "io",
  "periphs": [
   "gpio",
   "tim",
   "spi"
  ]
 },
 {
  "no": 41,
  "name": "PB5",
  "type": "I/O",
  "level": "",
  "gpio": "PB5",
  "alt": "I2C1_SMBAI",
  "remap": "TIM3_CH2/SPI1_MOSI",
  "altList": [
   "I2C1_SMBAI"
  ],
  "remapList": [
   "TIM3_CH2",
   "SPI1_MOSI"
  ],
  "port": "B",
  "bit": 5,
  "kind": "io",
  "periphs": [
   "i2c",
   "tim",
   "spi"
  ]
 },
 {
  "no": 42,
  "name": "PB6",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB6",
  "alt": "I2C1_SCL/TIM4_CH1",
  "remap": "USART1_TX",
  "altList": [
   "I2C1_SCL",
   "TIM4_CH1"
  ],
  "remapList": [
   "USART1_TX"
  ],
  "port": "B",
  "bit": 6,
  "kind": "io",
  "periphs": [
   "i2c",
   "tim",
   "usart"
  ]
 },
 {
  "no": 43,
  "name": "PB7",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB7",
  "alt": "I2C1_SDA/TIM4_CH2",
  "remap": "USART1_RX",
  "altList": [
   "I2C1_SDA",
   "TIM4_CH2"
  ],
  "remapList": [
   "USART1_RX"
  ],
  "port": "B",
  "bit": 7,
  "kind": "io",
  "periphs": [
   "i2c",
   "tim",
   "usart"
  ]
 },
 {
  "no": 44,
  "name": "BOOT0",
  "type": "I",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "BOOT0"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "boot",
  "periphs": []
 },
 {
  "no": 45,
  "name": "PB8",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB8",
  "alt": "TIM4_CH3",
  "remap": "I2C1_SCL/CAN_RX",
  "altList": [
   "TIM4_CH3"
  ],
  "remapList": [
   "I2C1_SCL",
   "CAN_RX"
  ],
  "port": "B",
  "bit": 8,
  "kind": "io",
  "periphs": [
   "tim",
   "i2c"
  ]
 },
 {
  "no": 46,
  "name": "PB9",
  "type": "I/O",
  "level": "FT",
  "gpio": "PB9",
  "alt": "TIM4_CH4",
  "remap": "I2C1_SDA/CAN_TX",
  "altList": [
   "TIM4_CH4"
  ],
  "remapList": [
   "I2C1_SDA",
   "CAN_TX"
  ],
  "port": "B",
  "bit": 9,
  "kind": "io",
  "periphs": [
   "tim",
   "i2c"
  ]
 },
 {
  "no": 47,
  "name": "VSS_3",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VSS_3"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 },
 {
  "no": 48,
  "name": "VDD_3",
  "type": "S",
  "level": "",
  "gpio": "",
  "alt": "",
  "remap": "",
  "altList": [
   "VDD_3"
  ],
  "remapList": [],
  "port": "",
  "bit": null,
  "kind": "power",
  "periphs": []
 }
];

export const PIN_MAP = Object.fromEntries(PINS.map(p => [p.name, p]));

export const PIN_BY_GPIO = Object.fromEntries(PINS.filter(p => p.gpio).map(p => [p.gpio, p]));

export const PIN_SOURCE = {
  file: "STM32F103C8T6引脚定义.xlsx",
  from: "江协《STM32 入门教程》参考文档",
  rows: PINS.length
};
