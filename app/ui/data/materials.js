/* 由 tools/gen-materials.py 生成，请勿手改。
   资料本体不进包：这里只有目录元数据，桌面壳按 path 打开真实文件。*/

export const MATERIAL_MODULES = [
{
 "id": "core",
 "no": 1,
 "dir": "1-STM32F103C8T6核心板",
 "code": "CORE",
 "icon": "chip",
 "p": "gpio",
 "name": {
  "zh": "STM32F103C8T6 核心板",
  "en": "STM32F103C8T6 core board"
 },
 "summary": {
  "zh": "最小系统板的完整资料：原理图、板卡尺寸图、F103x8B 数据手册，PC13 闪烁与 RTC 两套测试工程，外加 40 多个网络收集的参考例程（CAN、FATFS、FreeRTOS、USB、uCOS 等）。",
  "en": "Everything for the minimal system board: schematic, board dimensions, the F103x8B datasheet, blink and RTC test projects, plus 40+ reference examples (CAN, FATFS, FreeRTOS, USB, uCOS…)."
 },
 "tags": [
  "核心板",
  "最小系统",
  "原理图",
  "PCB",
  "数据手册",
  "测试工程",
  "参考例程"
 ],
 "cases": [
  "led-blink",
  "rtc-clock",
  "chip-id"
 ],
 "workflows": [
  "wf.clock-init",
  "wf.gpio-output",
  "wf.rtc"
 ],
 "kb": [
  "f103c8t6",
  "pin-map"
 ],
 "files": 9259,
 "size": 357167037,
 "kinds": {
  "pdf": 11,
  "doc": 80,
  "prog": 8929,
  "other": 105,
  "img": 57,
  "tool": 73,
  "pcb": 4
 },
 "resources": [
  {
   "name": "STM32F103C8T6核心板原理图.pdf",
   "path": "1-STM32F103C8T6核心板/STM32F103C8T6核心板原理图.pdf",
   "size": 82080,
   "kind": "pdf"
  },
  {
   "name": "STM32F103C8T6核心板尺寸.pdf",
   "path": "1-STM32F103C8T6核心板/STM32F103C8T6核心板尺寸.pdf",
   "size": 15535,
   "kind": "pdf"
  },
  {
   "name": "STM32F103x8B_DS_CH_V10.pdf",
   "path": "1-STM32F103C8T6核心板/STM32F103x8B_DS_CH_V10.pdf",
   "size": 1908899,
   "kind": "pdf"
  },
  {
   "name": "PCB工程文件",
   "path": "1-STM32F103C8T6核心板/PCB工程文件",
   "dir": true,
   "files": 4,
   "size": 419328,
   "kinds": {
    "pcb": 4
   },
   "children": [
    {
     "name": "STM32F103C8T6.SCHLIB",
     "path": "1-STM32F103C8T6核心板/PCB工程文件/STM32F103C8T6.SCHLIB",
     "size": 37376,
     "kind": "pcb"
    },
    {
     "name": "STM32F103C8T6核心板.PcbDoc",
     "path": "1-STM32F103C8T6核心板/PCB工程文件/STM32F103C8T6核心板.PcbDoc",
     "size": 150016,
     "kind": "pcb"
    },
    {
     "name": "STM32F103C8T6核心板.PcbLib",
     "path": "1-STM32F103C8T6核心板/PCB工程文件/STM32F103C8T6核心板.PcbLib",
     "size": 76800,
     "kind": "pcb"
    },
    {
     "name": "STM32F103C8T6核心板尺寸.PcbDoc",
     "path": "1-STM32F103C8T6核心板/PCB工程文件/STM32F103C8T6核心板尺寸.PcbDoc",
     "size": 155136,
     "kind": "pcb"
    }
   ]
  },
  {
   "name": "核心板测试程序(PC13闪烁)",
   "path": "1-STM32F103C8T6核心板/核心板测试程序(PC13闪烁)",
   "dir": true,
   "files": 95,
   "size": 2323142,
   "kinds": {
    "doc": 1,
    "prog": 90,
    "other": 4
   },
   "children": [
    {
     "name": "readme.txt",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(PC13闪烁)/readme.txt",
     "size": 340,
     "kind": "doc"
    },
    {
     "name": "Libraries",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(PC13闪烁)/Libraries",
     "dir": true,
     "files": 82,
     "size": 2144164,
     "kinds": {
      "prog": 82
     }
    },
    {
     "name": "MDK-ARM",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(PC13闪烁)/MDK-ARM",
     "dir": true,
     "files": 6,
     "size": 132121,
     "kinds": {
      "prog": 2,
      "other": 4
     }
    },
    {
     "name": "USER",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(PC13闪烁)/USER",
     "dir": true,
     "files": 6,
     "size": 46517,
     "kinds": {
      "prog": 6
     }
    }
   ]
  },
  {
   "name": "核心板测试程序(RTC)",
   "path": "1-STM32F103C8T6核心板/核心板测试程序(RTC)",
   "dir": true,
   "files": 107,
   "size": 2450075,
   "kinds": {
    "prog": 96,
    "other": 9,
    "doc": 2
   },
   "children": [
    {
     "name": "BSP",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(RTC)/BSP",
     "dir": true,
     "files": 6,
     "size": 22585,
     "kinds": {
      "prog": 6
     }
    },
    {
     "name": "config",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(RTC)/config",
     "dir": true,
     "files": 4,
     "size": 5485,
     "kinds": {
      "other": 4
     }
    },
    {
     "name": "doc",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(RTC)/doc",
     "dir": true,
     "files": 1,
     "size": 245,
     "kinds": {
      "doc": 1
     }
    },
    {
     "name": "Libraries",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(RTC)/Libraries",
     "dir": true,
     "files": 91,
     "size": 2386514,
     "kinds": {
      "other": 5,
      "prog": 85,
      "doc": 1
     }
    },
    {
     "name": "Project",
     "path": "1-STM32F103C8T6核心板/核心板测试程序(RTC)/Project",
     "dir": true,
     "files": 5,
     "size": 35246,
     "kinds": {
      "prog": 5
     }
    }
   ]
  },
  {
   "name": "网络收集参考例程",
   "path": "1-STM32F103C8T6核心板/网络收集参考例程",
   "dir": true,
   "files": 9050,
   "size": 349967978,
   "kinds": {
    "doc": 77,
    "prog": 8743,
    "other": 92,
    "img": 57,
    "tool": 73,
    "pdf": 8
   },
   "children": [
    {
     "name": "ADC+USART",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/ADC+USART",
     "dir": true,
     "files": 290,
     "size": 7165655,
     "kinds": {
      "doc": 3,
      "prog": 282,
      "other": 5
     }
    },
    {
     "name": "CAN",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/CAN",
     "dir": true,
     "files": 189,
     "size": 4746137,
     "kinds": {
      "doc": 2,
      "prog": 184,
      "other": 3
     }
    },
    {
     "name": "EXTI+USART",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/EXTI+USART",
     "dir": true,
     "files": 92,
     "size": 2320264,
     "kinds": {
      "doc": 1,
      "prog": 90,
      "other": 1
     }
    },
    {
     "name": "FATFS V0.08A-SD Card",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/FATFS V0.08A-SD Card",
     "dir": true,
     "files": 119,
     "size": 4713508,
     "kinds": {
      "doc": 3,
      "prog": 104,
      "other": 3,
      "img": 9
     }
    },
    {
     "name": "Flash",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/Flash",
     "dir": true,
     "files": 93,
     "size": 2451341,
     "kinds": {
      "doc": 1,
      "prog": 90,
      "other": 2
     }
    },
    {
     "name": "FreeRTOSV6.1.0",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/FreeRTOSV6.1.0",
     "dir": true,
     "files": 361,
     "size": 6938709,
     "kinds": {
      "doc": 5,
      "prog": 340,
      "tool": 1,
      "other": 15
     }
    },
    {
     "name": "GLCD (HY35A)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/GLCD (HY35A)",
     "dir": true,
     "files": 100,
     "size": 3626848,
     "kinds": {
      "doc": 1,
      "prog": 98,
      "other": 1
     }
    },
    {
     "name": "GLCD (show chinese for HY35A)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/GLCD (show chinese for HY35A)",
     "dir": true,
     "files": 101,
     "size": 4305452,
     "kinds": {
      "doc": 1,
      "prog": 98,
      "other": 2
     }
    },
    {
     "name": "GPIO",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/GPIO",
     "dir": true,
     "files": 92,
     "size": 2304354,
     "kinds": {
      "doc": 1,
      "prog": 90,
      "other": 1
     }
    },
    {
     "name": "I2C+USART",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/I2C+USART",
     "dir": true,
     "files": 190,
     "size": 4796229,
     "kinds": {
      "doc": 2,
      "prog": 184,
      "other": 4
     }
    },
    {
     "name": "ID",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/ID",
     "dir": true,
     "files": 92,
     "size": 2314570,
     "kinds": {
      "doc": 1,
      "prog": 90,
      "other": 1
     }
    },
    {
     "name": "IWDG",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/IWDG",
     "dir": true,
     "files": 96,
     "size": 2330246,
     "kinds": {
      "doc": 1,
      "prog": 94,
      "other": 1
     }
    },
    {
     "name": "Mass_Storage (SL811)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/Mass_Storage (SL811)",
     "dir": true,
     "files": 122,
     "size": 4681100,
     "kinds": {
      "doc": 3,
      "prog": 107,
      "other": 3,
      "img": 9
     }
    },
    {
     "name": "Mouse (SL811 HY35A)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/Mouse (SL811 HY35A)",
     "dir": true,
     "files": 107,
     "size": 3739615,
     "kinds": {
      "doc": 1,
      "prog": 105,
      "other": 1
     }
    },
    {
     "name": "MP3 Player",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/MP3 Player",
     "dir": true,
     "files": 251,
     "size": 11107672,
     "kinds": {
      "doc": 3,
      "pdf": 1,
      "tool": 2,
      "prog": 233,
      "other": 3,
      "img": 9
     }
    },
    {
     "name": "NAND",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/NAND",
     "dir": true,
     "files": 94,
     "size": 2347519,
     "kinds": {
      "doc": 1,
      "prog": 92,
      "other": 1
     }
    },
    {
     "name": "NOR",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/NOR",
     "dir": true,
     "files": 94,
     "size": 2341489,
     "kinds": {
      "doc": 1,
      "prog": 92,
      "other": 1
     }
    },
    {
     "name": "Oscillograph (HY35A)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/Oscillograph (HY35A)",
     "dir": true,
     "files": 1068,
     "size": 53612818,
     "kinds": {
      "doc": 5,
      "pdf": 1,
      "tool": 16,
      "prog": 1039,
      "img": 5,
      "other": 2
     }
    },
    {
     "name": "PWR",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/PWR",
     "dir": true,
     "files": 92,
     "size": 2316129,
     "kinds": {
      "doc": 1,
      "prog": 90,
      "other": 1
     }
    },
    {
     "name": "RS485",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/RS485",
     "dir": true,
     "files": 92,
     "size": 2380120,
     "kinds": {
      "doc": 1,
      "prog": 90,
      "other": 1
     }
    },
    {
     "name": "RTC+USART",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/RTC+USART",
     "dir": true,
     "files": 94,
     "size": 2339234,
     "kinds": {
      "doc": 1,
      "prog": 92,
      "other": 1
     }
    },
    {
     "name": "SPI Flash(SST25VF016B HY35A)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/SPI Flash(SST25VF016B HY35A)",
     "dir": true,
     "files": 111,
     "size": 5373440,
     "kinds": {
      "tool": 1,
      "img": 1,
      "doc": 1,
      "prog": 104,
      "other": 4
     }
    },
    {
     "name": "SRAM",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/SRAM",
     "dir": true,
     "files": 94,
     "size": 2326887,
     "kinds": {
      "doc": 1,
      "prog": 92,
      "other": 1
     }
    },
    {
     "name": "STM32 USB Bootloader",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/STM32 USB Bootloader",
     "dir": true,
     "files": 1192,
     "size": 56527105,
     "kinds": {
      "doc": 6,
      "pdf": 2,
      "prog": 1160,
      "tool": 16,
      "img": 5,
      "other": 3
     }
    },
    {
     "name": "SysTick",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/SysTick",
     "dir": true,
     "files": 96,
     "size": 2322097,
     "kinds": {
      "doc": 1,
      "prog": 94,
      "other": 1
     }
    },
    {
     "name": "TIM",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/TIM",
     "dir": true,
     "files": 92,
     "size": 2309558,
     "kinds": {
      "doc": 1,
      "prog": 90,
      "other": 1
     }
    },
    {
     "name": "TouchPanel",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/TouchPanel",
     "dir": true,
     "files": 106,
     "size": 3678731,
     "kinds": {
      "doc": 1,
      "prog": 104,
      "other": 1
     }
    },
    {
     "name": "uCOSII2.91",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/uCOSII2.91",
     "dir": true,
     "files": 134,
     "size": 4509619,
     "kinds": {
      "doc": 1,
      "pdf": 1,
      "tool": 2,
      "prog": 129,
      "other": 1
     }
    },
    {
     "name": "uCOSII2.91+lwip-1.3.2 (DM9000A)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/uCOSII2.91+lwip-1.3.2 (DM9000A)",
     "dir": true,
     "files": 302,
     "size": 8016547,
     "kinds": {
      "doc": 6,
      "pdf": 1,
      "tool": 2,
      "prog": 284,
      "other": 9
     }
    },
    {
     "name": "uCOSII2.91+UCGUI3.90A(Support USB Mouse for HY35A)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/uCOSII2.91+UCGUI3.90A(Support USB Mouse for HY35A)",
     "dir": true,
     "files": 1069,
     "size": 54266863,
     "kinds": {
      "doc": 5,
      "pdf": 1,
      "tool": 16,
      "prog": 1039,
      "img": 5,
      "other": 3
     }
    },
    {
     "name": "USART",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/USART",
     "dir": true,
     "files": 92,
     "size": 2308975,
     "kinds": {
      "doc": 1,
      "prog": 90,
      "other": 1
     }
    },
    {
     "name": "USB-JoyStickMouse",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/USB-JoyStickMouse",
     "dir": true,
     "files": 128,
     "size": 2662940,
     "kinds": {
      "doc": 1,
      "prog": 126,
      "other": 1
     }
    },
    {
     "name": "USB-Mass_Storage-MCU Flash",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/USB-Mass_Storage-MCU Flash",
     "dir": true,
     "files": 139,
     "size": 2724825,
     "kinds": {
      "doc": 1,
      "prog": 137,
      "other": 1
     }
    },
    {
     "name": "USB-Mass_Storage-SD Card",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/USB-Mass_Storage-SD Card",
     "dir": true,
     "files": 141,
     "size": 2854685,
     "kinds": {
      "doc": 1,
      "prog": 139,
      "other": 1
     }
    },
    {
     "name": "USB-Mass_Storage-SPI Flash(SST25VF016B)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/USB-Mass_Storage-SPI Flash(SST25VF016B)",
     "dir": true,
     "files": 144,
     "size": 2828395,
     "kinds": {
      "doc": 1,
      "prog": 141,
      "other": 2
     }
    },
    {
     "name": "Voltmeter (HY35A)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/Voltmeter (HY35A)",
     "dir": true,
     "files": 1064,
     "size": 53546372,
     "kinds": {
      "doc": 5,
      "pdf": 1,
      "tool": 16,
      "prog": 1035,
      "img": 5,
      "other": 2
     }
    },
    {
     "name": "VS1003",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/VS1003",
     "dir": true,
     "files": 98,
     "size": 3671822,
     "kinds": {
      "tool": 1,
      "doc": 1,
      "other": 2,
      "prog": 94
     }
    },
    {
     "name": "VS1003(record)",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/VS1003(record)",
     "dir": true,
     "files": 122,
     "size": 4753992,
     "kinds": {
      "doc": 3,
      "prog": 107,
      "other": 3,
      "img": 9
     }
    },
    {
     "name": "WWDG",
     "path": "1-STM32F103C8T6核心板/网络收集参考例程/WWDG",
     "dir": true,
     "files": 97,
     "size": 2406116,
     "kinds": {
      "doc": 1,
      "prog": 94,
      "other": 2
     }
    }
   ]
  }
 ]
},
{
 "id": "stlink",
 "no": 2,
 "dir": "2-STLINK下载器",
 "code": "STLINK",
 "icon": "drive",
 "p": null,
 "name": {
  "zh": "ST-LINK V2 下载器",
  "en": "ST-LINK V2 programmer"
 },
 "summary": {
  "zh": "ST-LINK V2 的使用说明，含接线、驱动安装与下载配置。",
  "en": "ST-LINK V2 manual covering wiring, driver install and download settings."
 },
 "tags": [
  "下载器",
  "ST-LINK",
  "SWD",
  "调试"
 ],
 "cases": [],
 "workflows": [],
 "kb": [],
 "files": 1,
 "size": 1616444,
 "kinds": {
  "pdf": 1
 },
 "resources": [
  {
   "name": "ST-LINK+V2使用说明.pdf",
   "path": "2-STLINK下载器/ST-LINK+V2使用说明.pdf",
   "size": 1616444,
   "kind": "pdf"
  }
 ]
},
{
 "id": "buzzer",
 "no": 3,
 "dir": "3-有源蜂鸣器",
 "code": "BUZZER",
 "icon": "pulse",
 "p": "gpio",
 "name": {
  "zh": "有源蜂鸣器模块",
  "en": "Active buzzer module"
 },
 "summary": {
  "zh": "有源蜂鸣器模块的原理图与实物图。有源模块自带振荡源，控制端给电平就发声，对应案例里的蜂鸣器演示。",
  "en": "Schematic and photo of the active buzzer module. An active module carries its own oscillator, so a logic level on the control pin makes it sound — see the buzzer case."
 },
 "tags": [
  "蜂鸣器",
  "有源",
  "发声",
  "开关量"
 ],
 "cases": [
  "buzzer"
 ],
 "workflows": [
  "wf.gpio-output"
 ],
 "kb": [],
 "files": 2,
 "size": 198839,
 "kinds": {
  "img": 2
 },
 "resources": [
  {
   "name": "有源蜂鸣器模块原理图.png",
   "path": "3-有源蜂鸣器/有源蜂鸣器模块原理图.png",
   "size": 15886,
   "kind": "img"
  },
  {
   "name": "有源蜂鸣器模块实物图.png",
   "path": "3-有源蜂鸣器/有源蜂鸣器模块实物图.png",
   "size": 182953,
   "kind": "img"
  }
 ]
},
{
 "id": "ldr",
 "no": 4,
 "dir": "4-光敏电阻传感器",
 "code": "LDR",
 "icon": "spark",
 "p": "adc",
 "name": {
  "zh": "光敏电阻传感器模块",
  "en": "Photoresistor sensor module"
 },
 "summary": {
  "zh": "光敏电阻模块的 3 线制与 4 线制两种版本：使用说明图、原理图、尺寸图、参考例程与 51 测试程序。",
  "en": "Photoresistor module in both 3-wire and 4-wire versions: usage notes, schematic, dimensions, sample code and an 8051 test project."
 },
 "tags": [
  "光敏电阻",
  "光照",
  "模拟量",
  "3线制",
  "4线制",
  "51例程"
 ],
 "cases": [
  "light-buzzer"
 ],
 "workflows": [
  "wf.adc-poll"
 ],
 "kb": [
  "adc-basics"
 ],
 "files": 69,
 "size": 1387760,
 "kinds": {
  "img": 4,
  "doc": 1,
  "other": 52,
  "prog": 10,
  "pdf": 2
 },
 "resources": [
  {
   "name": "光敏电阻型号.jpg",
   "path": "4-光敏电阻传感器/光敏电阻型号.jpg",
   "size": 38991,
   "kind": "img"
  },
  {
   "name": "光敏电阻模块使用说明.png",
   "path": "4-光敏电阻传感器/光敏电阻模块使用说明.png",
   "size": 208005,
   "kind": "img"
  },
  {
   "name": "光敏电阻传感器模块3线制",
   "path": "4-光敏电阻传感器/光敏电阻传感器模块3线制",
   "dir": true,
   "files": 32,
   "size": 648934,
   "kinds": {
    "pdf": 2,
    "other": 25,
    "prog": 5
   },
   "children": [
    {
     "name": "光敏电阻传感器模块3线制",
     "path": "4-光敏电阻传感器/光敏电阻传感器模块3线制/光敏电阻传感器模块3线制",
     "dir": true,
     "files": 32,
     "size": 648934,
     "kinds": {
      "pdf": 2,
      "other": 25,
      "prog": 5
     }
    }
   ]
  },
  {
   "name": "光敏电阻传感器模块4线制",
   "path": "4-光敏电阻传感器/光敏电阻传感器模块4线制",
   "dir": true,
   "files": 35,
   "size": 491830,
   "kinds": {
    "img": 2,
    "doc": 1,
    "other": 27,
    "prog": 5
   },
   "children": [
    {
     "name": "光敏电阻4线-原理图.jpg",
     "path": "4-光敏电阻传感器/光敏电阻传感器模块4线制/光敏电阻4线-原理图.jpg",
     "size": 42169,
     "kind": "img"
    },
    {
     "name": "光敏电阻4线-尺寸图.jpg",
     "path": "4-光敏电阻传感器/光敏电阻传感器模块4线制/光敏电阻4线-尺寸图.jpg",
     "size": 71494,
     "kind": "img"
    },
    {
     "name": "参考例程.txt",
     "path": "4-光敏电阻传感器/光敏电阻传感器模块4线制/参考例程.txt",
     "size": 1940,
     "kind": "doc"
    },
    {
     "name": "传感器51测试程序",
     "path": "4-光敏电阻传感器/光敏电阻传感器模块4线制/传感器51测试程序",
     "dir": true,
     "files": 32,
     "size": 376227,
     "kinds": {
      "other": 27,
      "prog": 5
     }
    }
   ]
  }
 ]
},
{
 "id": "ntc",
 "no": 5,
 "dir": "5-热敏电阻传感器",
 "code": "NTC",
 "icon": "pulse",
 "p": "adc",
 "name": {
  "zh": "热敏电阻传感器模块",
  "en": "Thermistor sensor module"
 },
 "summary": {
  "zh": "热敏电阻模块的使用说明、原理图与测试程序，测试程序里还带了串口调试软件。",
  "en": "Thermistor module: usage notes, schematic and test projects, with a serial terminal bundled in."
 },
 "tags": [
  "热敏电阻",
  "温度",
  "模拟量",
  "NTC",
  "51例程"
 ],
 "cases": [],
 "workflows": [
  "wf.adc-poll"
 ],
 "kb": [
  "adc-basics"
 ],
 "files": 35,
 "size": 1148364,
 "kinds": {
  "pdf": 2,
  "img": 1,
  "other": 26,
  "prog": 5,
  "tool": 1
 },
 "resources": [
  {
   "name": "热敏电阻传感器使用说明.pdf",
   "path": "5-热敏电阻传感器/热敏电阻传感器使用说明.pdf",
   "size": 139415,
   "kind": "pdf"
  },
  {
   "name": "热敏电阻传感器原理图.pdf",
   "path": "5-热敏电阻传感器/热敏电阻传感器原理图.pdf",
   "size": 156616,
   "kind": "pdf"
  },
  {
   "name": "热敏电阻模块使用说明.png",
   "path": "5-热敏电阻传感器/热敏电阻模块使用说明.png",
   "size": 300257,
   "kind": "img"
  },
  {
   "name": "热敏电阻传感器测试程序",
   "path": "5-热敏电阻传感器/热敏电阻传感器测试程序",
   "dir": true,
   "files": 32,
   "size": 552076,
   "kinds": {
    "other": 26,
    "prog": 5,
    "tool": 1
   },
   "children": [
    {
     "name": "串口调试软件",
     "path": "5-热敏电阻传感器/热敏电阻传感器测试程序/串口调试软件",
     "dir": true,
     "files": 1,
     "size": 198144,
     "kinds": {
      "tool": 1
     }
    },
    {
     "name": "传感器51测试程序",
     "path": "5-热敏电阻传感器/热敏电阻传感器测试程序/传感器51测试程序",
     "dir": true,
     "files": 31,
     "size": 353932,
     "kinds": {
      "other": 26,
      "prog": 5
     }
    }
   ]
  }
 ]
},
{
 "id": "ir-reflect",
 "no": 6,
 "dir": "6-反射式红外传感器",
 "code": "TCRT5000",
 "icon": "target",
 "p": "gpio",
 "name": {
  "zh": "反射式红外传感器模块",
  "en": "Reflective IR sensor module"
 },
 "summary": {
  "zh": "TCRT5000 反射式（寻迹）传感器：器件手册、模块说明书、电路图与 51 测试程序。",
  "en": "TCRT5000 reflective (line-tracking) sensor: device datasheet, module manual, circuit diagram and an 8051 test project."
 },
 "tags": [
  "红外",
  "反射式",
  "寻迹",
  "TCRT5000",
  "开关量"
 ],
 "cases": [],
 "workflows": [
  "wf.gpio-input"
 ],
 "kb": [],
 "files": 34,
 "size": 1439409,
 "kinds": {
  "pdf": 3,
  "img": 1,
  "other": 25,
  "prog": 5
 },
 "resources": [
  {
   "name": "反射式光电传感器__TCRT5000.pdf",
   "path": "6-反射式红外传感器/反射式光电传感器__TCRT5000.pdf",
   "size": 447084,
   "kind": "pdf"
  },
  {
   "name": "寻迹传感器模块使用说明书.pdf",
   "path": "6-反射式红外传感器/寻迹传感器模块使用说明书.pdf",
   "size": 310734,
   "kind": "pdf"
  },
  {
   "name": "寻迹传感器模块电路图.pdf",
   "path": "6-反射式红外传感器/寻迹传感器模块电路图.pdf",
   "size": 25389,
   "kind": "pdf"
  },
  {
   "name": "寻迹传感器模块使用说明.png",
   "path": "6-反射式红外传感器/寻迹传感器模块使用说明.png",
   "size": 314122,
   "kind": "img"
  },
  {
   "name": "传感器51测试程序",
   "path": "6-反射式红外传感器/传感器51测试程序",
   "dir": true,
   "files": 30,
   "size": 342080,
   "kinds": {
    "other": 25,
    "prog": 5
   },
   "children": [
    {
     "name": "1.c",
     "path": "6-反射式红外传感器/传感器51测试程序/1.c",
     "size": 1612,
     "kind": "prog"
    },
    {
     "name": "1.uvopt",
     "path": "6-反射式红外传感器/传感器51测试程序/1.uvopt",
     "size": 57100,
     "kind": "prog"
    },
    {
     "name": "1.uvproj",
     "path": "6-反射式红外传感器/传感器51测试程序/1.uvproj",
     "size": 13417,
     "kind": "prog"
    },
    {
     "name": "51测试程序.hex",
     "path": "6-反射式红外传感器/传感器51测试程序/51测试程序.hex",
     "size": 351,
     "kind": "prog"
    },
    {
     "name": "SoundPlay.h",
     "path": "6-反射式红外传感器/传感器51测试程序/SoundPlay.h",
     "size": 5344,
     "kind": "prog"
    },
    {
     "name": "1",
     "path": "6-反射式红外传感器/传感器51测试程序/1",
     "size": 3853,
     "kind": "other"
    },
    {
     "name": "1.lnp",
     "path": "6-反射式红外传感器/传感器51测试程序/1.lnp",
     "size": 35,
     "kind": "other"
    },
    {
     "name": "1.LST",
     "path": "6-反射式红外传感器/传感器51测试程序/1.LST",
     "size": 4320,
     "kind": "other"
    },
    {
     "name": "1.M51",
     "path": "6-反射式红外传感器/传感器51测试程序/1.M51",
     "size": 6991,
     "kind": "other"
    },
    {
     "name": "1.OBJ",
     "path": "6-反射式红外传感器/传感器51测试程序/1.OBJ",
     "size": 3038,
     "kind": "other"
    },
    {
     "name": "1.opt.bak",
     "path": "6-反射式红外传感器/传感器51测试程序/1.opt.bak",
     "size": 1366,
     "kind": "other"
    },
    {
     "name": "1.plg",
     "path": "6-反射式红外传感器/传感器51测试程序/1.plg",
     "size": 1308,
     "kind": "other"
    },
    {
     "name": "1.Uv2.bak",
     "path": "6-反射式红外传感器/传感器51测试程序/1.Uv2.bak",
     "size": 2168,
     "kind": "other"
    },
    {
     "name": "11",
     "path": "6-反射式红外传感器/传感器51测试程序/11",
     "size": 3556,
     "kind": "other"
    },
    {
     "name": "11.lnp",
     "path": "6-反射式红外传感器/传感器51测试程序/11.lnp",
     "size": 36,
     "kind": "other"
    },
    {
     "name": "11.M51",
     "path": "6-反射式红外传感器/传感器51测试程序/11.M51",
     "size": 6221,
     "kind": "other"
    },
    {
     "name": "11.plg",
     "path": "6-反射式红外传感器/传感器51测试程序/11.plg",
     "size": 165,
     "kind": "other"
    },
    {
     "name": "1_Opt.Bak",
     "path": "6-反射式红外传感器/传感器51测试程序/1_Opt.Bak",
     "size": 1370,
     "kind": "other"
    },
    {
     "name": "1_Uv2.Bak",
     "path": "6-反射式红外传感器/传感器51测试程序/1_Uv2.Bak",
     "size": 2192,
     "kind": "other"
    },
    {
     "name": "1_uvopt.bak",
     "path": "6-反射式红外传感器/传感器51测试程序/1_uvopt.bak",
     "size": 57096,
     "kind": "other"
    },
    {
     "name": "51测试程序",
     "path": "6-反射式红外传感器/传感器51测试程序/51测试程序",
     "size": 3422,
     "kind": "other"
    },
    {
     "name": "51测试程序.lnp",
     "path": "6-反射式红外传感器/传感器51测试程序/51测试程序.lnp",
     "size": 44,
     "kind": "other"
    },
    {
     "name": "51测试程序.M51",
     "path": "6-反射式红外传感器/传感器51测试程序/51测试程序.M51",
     "size": 6014,
     "kind": "other"
    },
    {
     "name": "51测试程序.plg",
     "path": "6-反射式红外传感器/传感器51测试程序/51测试程序.plg",
     "size": 212,
     "kind": "other"
    },
    {
     "name": "Last Loaded PlayMusic.DBK",
     "path": "6-反射式红外传感器/传感器51测试程序/Last Loaded PlayMusic.DBK",
     "size": 136216,
     "kind": "other"
    },
    {
     "name": "PlayMusic.PWI",
     "path": "6-反射式红外传感器/传感器51测试程序/PlayMusic.PWI",
     "size": 768,
     "kind": "other"
    },
    {
     "name": "STARTUP.A51",
     "path": "6-反射式红外传感器/传感器51测试程序/STARTUP.A51",
     "size": 6376,
     "kind": "other"
    },
    {
     "name": "STARTUP.LST",
     "path": "6-反射式红外传感器/传感器51测试程序/STARTUP.LST",
     "size": 14060,
     "kind": "other"
    },
    {
     "name": "STARTUP.OBJ",
     "path": "6-反射式红外传感器/传感器51测试程序/STARTUP.OBJ",
     "size": 749,
     "kind": "other"
    },
    {
     "name": "XuanWeiProgPlatformConfig.XML",
     "path": "6-反射式红外传感器/传感器51测试程序/XuanWeiProgPlatformConfig.XML",
     "size": 2680,
     "kind": "other"
    }
   ]
  }
 ]
},
{
 "id": "ir-slot",
 "no": 7,
 "dir": "7-对射式红外传感器",
 "code": "ITR9606",
 "icon": "arrows",
 "p": "gpio",
 "name": {
  "zh": "对射式红外传感器模块",
  "en": "Slotted IR (interrupter) module"
 },
 "summary": {
  "zh": "对射式红外测速模块，宽槽与窄槽两种版本各含说明书、电路图和 51 测试程序，另附 ITR9606 手册。",
  "en": "Slotted IR speed module in wide-slot and narrow-slot versions, each with manual, circuit diagram and 8051 test project, plus the ITR9606 datasheet."
 },
 "tags": [
  "红外",
  "对射式",
  "测速",
  "ITR9606",
  "宽槽",
  "窄槽"
 ],
 "cases": [],
 "workflows": [
  "wf.gpio-input",
  "wf.exti-button"
 ],
 "kb": [],
 "files": 66,
 "size": 1842444,
 "kinds": {
  "pdf": 5,
  "img": 1,
  "other": 50,
  "prog": 10
 },
 "resources": [
  {
   "name": "ITR9606.pdf",
   "path": "7-对射式红外传感器/ITR9606.pdf",
   "size": 328408,
   "kind": "pdf"
  },
  {
   "name": "测速传感器模块使用说明.png",
   "path": "7-对射式红外传感器/测速传感器模块使用说明.png",
   "size": 416219,
   "kind": "img"
  },
  {
   "name": "测速传感器模块（宽槽版）",
   "path": "7-对射式红外传感器/测速传感器模块（宽槽版）",
   "dir": true,
   "files": 32,
   "size": 552843,
   "kinds": {
    "pdf": 2,
    "other": 25,
    "prog": 5
   },
   "children": [
    {
     "name": "测速传感器模块使用说明书（宽槽版）.pdf",
     "path": "7-对射式红外传感器/测速传感器模块（宽槽版）/测速传感器模块使用说明书（宽槽版）.pdf",
     "size": 183630,
     "kind": "pdf"
    },
    {
     "name": "测速传感器模块电路图（宽槽版）.pdf",
     "path": "7-对射式红外传感器/测速传感器模块（宽槽版）/测速传感器模块电路图（宽槽版）.pdf",
     "size": 27133,
     "kind": "pdf"
    },
    {
     "name": "传感器51测试程序",
     "path": "7-对射式红外传感器/测速传感器模块（宽槽版）/传感器51测试程序",
     "dir": true,
     "files": 30,
     "size": 342080,
     "kinds": {
      "other": 25,
      "prog": 5
     }
    }
   ]
  },
  {
   "name": "测速传感器模块（窄槽版）",
   "path": "7-对射式红外传感器/测速传感器模块（窄槽版）",
   "dir": true,
   "files": 32,
   "size": 544974,
   "kinds": {
    "pdf": 2,
    "other": 25,
    "prog": 5
   },
   "children": [
    {
     "name": "测速传感器模块使用说明书（窄槽版）.pdf",
     "path": "7-对射式红外传感器/测速传感器模块（窄槽版）/测速传感器模块使用说明书（窄槽版）.pdf",
     "size": 176252,
     "kind": "pdf"
    },
    {
     "name": "测速传感器模块电路图（窄槽版）.pdf",
     "path": "7-对射式红外传感器/测速传感器模块（窄槽版）/测速传感器模块电路图（窄槽版）.pdf",
     "size": 26642,
     "kind": "pdf"
    },
    {
     "name": "传感器51测试程序",
     "path": "7-对射式红外传感器/测速传感器模块（窄槽版）/传感器51测试程序",
     "dir": true,
     "files": 30,
     "size": 342080,
     "kinds": {
      "other": 25,
      "prog": 5
     }
    }
   ]
  }
 ]
},
{
 "id": "oled",
 "no": 8,
 "dir": "8-OLED显示屏",
 "code": "OLED",
 "icon": "grid",
 "p": "i2c",
 "name": {
  "zh": "0.96 寸 OLED 显示屏",
  "en": "0.96″ OLED display"
 },
 "summary": {
  "zh": "0.96 寸 OLED 全套资料：规格书与驱动芯片手册、4/6/7 针结构图与 I²C、SPI 接口原理图、C51 / STM32 / Arduino 等 19 个测试工程、反白显示资料和取字模工具。",
  "en": "Full 0.96″ OLED kit: specs and driver-IC datasheet, 4/6/7-pin layouts and I²C/SPI schematics, 19 test projects (C51, STM32, Arduino…), inverse-display notes and a font-extraction tool."
 },
 "tags": [
  "OLED",
  "显示屏",
  "I2C",
  "SPI",
  "取字模",
  "例程"
 ],
 "cases": [],
 "workflows": [],
 "kb": [],
 "files": 549,
 "size": 72182672,
 "kinds": {
  "pdf": 13,
  "other": 217,
  "doc": 17,
  "tool": 3,
  "pack": 19,
  "prog": 280
 },
 "resources": [
  {
   "name": "中景园电子0.96寸OLED使用文档新手必看V2.0.pdf",
   "path": "8-OLED显示屏/中景园电子0.96寸OLED使用文档新手必看V2.0.pdf",
   "size": 1692372,
   "kind": "pdf"
  },
  {
   "name": "OLED反白显示技术资料",
   "path": "8-OLED显示屏/OLED反白显示技术资料",
   "dir": true,
   "files": 157,
   "size": 10158128,
   "kinds": {
    "pdf": 1,
    "tool": 1,
    "doc": 1,
    "other": 74,
    "prog": 80
   },
   "children": [
    {
     "name": "关于反白显示说明.pdf",
     "path": "8-OLED显示屏/OLED反白显示技术资料/关于反白显示说明.pdf",
     "size": 99018,
     "kind": "pdf"
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_SPI_例程_反白显示",
     "path": "8-OLED显示屏/OLED反白显示技术资料/中景园电子0.96OLED显示屏_C51系列_SPI_例程_反白显示",
     "dir": true,
     "files": 24,
     "size": 495893,
     "kinds": {
      "prog": 8,
      "other": 16
     }
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM32ZET系列_SPI_例程_反白显示",
     "path": "8-OLED显示屏/OLED反白显示技术资料/中景园电子0.96OLED显示屏_STM32ZET系列_SPI_例程_反白显示",
     "dir": true,
     "files": 132,
     "size": 9563217,
     "kinds": {
      "tool": 1,
      "doc": 1,
      "other": 58,
      "prog": 72
     }
    }
   ]
  },
  {
   "name": "中景园电子0.96OLED显示屏原理图",
   "path": "8-OLED显示屏/中景园电子0.96OLED显示屏原理图",
   "dir": true,
   "files": 6,
   "size": 434616,
   "kinds": {
    "pdf": 6
   },
   "children": [
    {
     "name": "0.96寸4针B版本结构图.pdf",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏原理图/0.96寸4针B版本结构图.pdf",
     "size": 72835,
     "kind": "pdf"
    },
    {
     "name": "0.96寸6针结构图.pdf",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏原理图/0.96寸6针结构图.pdf",
     "size": 74608,
     "kind": "pdf"
    },
    {
     "name": "0.96寸7针结构图.pdf",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏原理图/0.96寸7针结构图.pdf",
     "size": 81458,
     "kind": "pdf"
    },
    {
     "name": "中景园电子0.96OLED显示屏6PIN SPI接口原理图.pdf",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏原理图/中景园电子0.96OLED显示屏6PIN SPI接口原理图.pdf",
     "size": 66305,
     "kind": "pdf"
    },
    {
     "name": "中景园电子0.96OLED显示屏7PIN SPI接口原理图.pdf",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏原理图/中景园电子0.96OLED显示屏7PIN SPI接口原理图.pdf",
     "size": 65964,
     "kind": "pdf"
    },
    {
     "name": "中景园电子0.96OLED显示屏IIC接口原理图.pdf.pdf",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏原理图/中景园电子0.96OLED显示屏IIC接口原理图.pdf.pdf",
     "size": 73446,
     "kind": "pdf"
    }
   ]
  },
  {
   "name": "中景园电子0.96OLED显示屏数据手册",
   "path": "8-OLED显示屏/中景园电子0.96OLED显示屏数据手册",
   "dir": true,
   "files": 2,
   "size": 2428837,
   "kinds": {
    "pdf": 2
   },
   "children": [
    {
     "name": "0.96寸OLED规格书.pdf",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏数据手册/0.96寸OLED规格书.pdf",
     "size": 1008477,
     "kind": "pdf"
    },
    {
     "name": "中景园电子0.96OLED显示屏_驱动芯片手册.pdf",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏数据手册/中景园电子0.96OLED显示屏_驱动芯片手册.pdf",
     "size": 1420360,
     "kind": "pdf"
    }
   ]
  },
  {
   "name": "中景园电子0.96OLED显示屏测试程序",
   "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序",
   "dir": true,
   "files": 371,
   "size": 51983659,
   "kinds": {
    "pack": 19,
    "doc": 13,
    "tool": 1,
    "other": 138,
    "prog": 200
   },
   "children": [
    {
     "name": "说明.docx",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/说明.docx",
     "size": 11726,
     "kind": "doc"
    },
    {
     "name": "0.96寸OLED_STM8S003F3_SPI程序.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/0.96寸OLED_STM8S003F3_SPI程序.rar",
     "size": 4740205,
     "kind": "pack"
    },
    {
     "name": "arduino_SPI_例程.rar.zip",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/arduino_SPI_例程.rar.zip",
     "size": 30733,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_arduino_IIC_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_arduino_IIC_例程.rar",
     "size": 869322,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_IIC_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_IIC_例程.rar",
     "size": 42451,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_IIC_例程推荐使用.zip",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_IIC_例程推荐使用.zip",
     "size": 89466,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_IIC应答_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_IIC应答_例程.rar",
     "size": 89457,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_IIC无应答_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_IIC无应答_例程.rar",
     "size": 42820,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_SPI_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_SPI_例程.rar",
     "size": 131865,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_MSP430系列_SPI_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_MSP430系列_SPI_例程.rar",
     "size": 43691,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_PIC系列_SPI_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_PIC系列_SPI_例程.rar",
     "size": 42373,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM32_F103C8系列_SPI_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM32_F103C8系列_SPI_例程.rar",
     "size": 1598910,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM32_F103RCT6系列_SPI_例程.zip",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM32_F103RCT6系列_SPI_例程.zip",
     "size": 2155259,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM32F103C8_IIC_V1.0.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM32F103C8_IIC_V1.0.rar",
     "size": 1621449,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM32F103RC_IIC_V1.0.zip",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM32F103RC_IIC_V1.0.zip",
     "size": 2216577,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM32F103ZET6_IIC_V1.0.zip",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM32F103ZET6_IIC_V1.0.zip",
     "size": 2165151,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM32ZET系列_SPI_例程.zip",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM32ZET系列_SPI_例程.zip",
     "size": 4288017,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM8S103K3T6_SPI_例程.zip",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM8S103K3T6_SPI_例程.zip",
     "size": 5015940,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM8系列_IIC_例程.zip",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM8系列_IIC_例程.zip",
     "size": 5563440,
     "kind": "pack"
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM8系列_SPI_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM8系列_SPI_例程.rar",
     "size": 4846364,
     "kind": "pack"
    },
    {
     "name": "arduino_SPI_例程.rar",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/arduino_SPI_例程.rar",
     "dir": true,
     "files": 15,
     "size": 97183,
     "kinds": {
      "other": 7,
      "doc": 5,
      "prog": 3
     }
    },
    {
     "name": "中景园电子0.96OLED显示屏_arduino_IIC_例程",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_arduino_IIC_例程",
     "dir": true,
     "files": 123,
     "size": 5346811,
     "kinds": {
      "doc": 3,
      "other": 18,
      "prog": 102
     }
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_IIC_例程",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_IIC_例程",
     "dir": true,
     "files": 20,
     "size": 254231,
     "kinds": {
      "other": 13,
      "prog": 7
     }
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_IIC_例程推荐使用",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_IIC_例程推荐使用",
     "dir": true,
     "files": 24,
     "size": 516259,
     "kinds": {
      "prog": 8,
      "other": 16
     }
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_IIC应答_例程",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_IIC应答_例程",
     "dir": true,
     "files": 19,
     "size": 362678,
     "kinds": {
      "doc": 2,
      "other": 13,
      "prog": 4
     }
    },
    {
     "name": "中景园电子0.96OLED显示屏_C51系列_IIC无应答_例程",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_C51系列_IIC无应答_例程",
     "dir": true,
     "files": 17,
     "size": 305899,
     "kinds": {
      "doc": 1,
      "other": 12,
      "prog": 4
     }
    },
    {
     "name": "中景园电子0.96OLED显示屏_STM32_F103C8系列_SPI_例程",
     "path": "8-OLED显示屏/中景园电子0.96OLED显示屏测试程序/中景园电子0.96OLED显示屏_STM32_F103C8系列_SPI_例程",
     "dir": true,
     "files": 133,
     "size": 9495382,
     "kinds": {
      "tool": 1,
      "doc": 1,
      "other": 59,
      "prog": 72
     }
    }
   ]
  },
  {
   "name": "取字模软件",
   "path": "8-OLED显示屏/取字模软件",
   "dir": true,
   "files": 12,
   "size": 5485060,
   "kinds": {
    "pdf": 3,
    "other": 5,
    "doc": 3,
    "tool": 1
   },
   "children": [
    {
     "name": "ASCII码表.pdf",
     "path": "8-OLED显示屏/取字模软件/ASCII码表.pdf",
     "size": 44497,
     "kind": "pdf"
    },
    {
     "name": "GB2312标准汉字库IC使用手册.pdf",
     "path": "8-OLED显示屏/取字模软件/GB2312标准汉字库IC使用手册.pdf",
     "size": 1840515,
     "kind": "pdf"
    },
    {
     "name": "GB2312简体中文编码表.pdf",
     "path": "8-OLED显示屏/取字模软件/GB2312简体中文编码表.pdf",
     "size": 1262150,
     "kind": "pdf"
    },
    {
     "name": "中景园电子OLE显示屏专用取模工具_PCtoLCD2002",
     "path": "8-OLED显示屏/取字模软件/中景园电子OLE显示屏专用取模工具_PCtoLCD2002",
     "dir": true,
     "files": 9,
     "size": 2337898,
     "kinds": {
      "other": 5,
      "doc": 3,
      "tool": 1
     }
    }
   ]
  }
 ]
},
{
 "id": "tb6612",
 "no": 9,
 "dir": "9-TB6612电机驱动",
 "code": "TB6612",
 "icon": "zap",
 "p": "tim",
 "name": {
  "zh": "TB6612 电机驱动模块",
  "en": "TB6612 motor driver module"
 },
 "summary": {
  "zh": "TB6612FNG 双路电机驱动：数据手册与模块使用说明，配合 PWM 与方向引脚控制两路直流电机。",
  "en": "TB6612FNG dual motor driver: datasheet and module notes; two DC motors driven by PWM plus direction pins."
 },
 "tags": [
  "电机驱动",
  "TB6612",
  "PWM",
  "正反转",
  "双路"
 ],
 "cases": [],
 "workflows": [
  "wf.tim-pwm"
 ],
 "kb": [],
 "files": 2,
 "size": 1841441,
 "kinds": {
  "pdf": 1,
  "img": 1
 },
 "resources": [
  {
   "name": "TB6612FNG.pdf",
   "path": "9-TB6612电机驱动/TB6612FNG.pdf",
   "size": 443088,
   "kind": "pdf"
  },
  {
   "name": "电机驱动模块使用说明.png",
   "path": "9-TB6612电机驱动/电机驱动模块使用说明.png",
   "size": 1398353,
   "kind": "img"
  }
 ]
},
{
 "id": "sg90",
 "no": 10,
 "dir": "10-SG90舵机",
 "code": "SG90",
 "icon": "gauge",
 "p": "tim",
 "name": {
  "zh": "SG90 9G 舵机",
  "en": "SG90 9G servo"
 },
 "summary": {
  "zh": "SG90 9G 舵机资料：模块使用说明，以及两篇讲舵机原理与 PWM 控制的文档。",
  "en": "SG90 9G servo: module notes plus two documents on servo principles and PWM control."
 },
 "tags": [
  "舵机",
  "SG90",
  "PWM",
  "角度控制"
 ],
 "cases": [
  "servo"
 ],
 "workflows": [
  "wf.tim-pwm"
 ],
 "kb": [
  "timer-pwm"
 ],
 "files": 3,
 "size": 1065309,
 "kinds": {
  "img": 1,
  "doc": 2
 },
 "resources": [
  {
   "name": "舵机使用说明.png",
   "path": "10-SG90舵机/舵机使用说明.png",
   "size": 691037,
   "kind": "img"
  },
  {
   "name": "SG90 9G舵机",
   "path": "10-SG90舵机/SG90 9G舵机",
   "dir": true,
   "files": 2,
   "size": 374272,
   "kinds": {
    "doc": 2
   },
   "children": [
    {
     "name": "利用单片机PWM信号进行舵机控制.doc",
     "path": "10-SG90舵机/SG90 9G舵机/利用单片机PWM信号进行舵机控制.doc",
     "size": 142336,
     "kind": "doc"
    },
    {
     "name": "舵机的相关原理与控制原理.doc",
     "path": "10-SG90舵机/SG90 9G舵机/舵机的相关原理与控制原理.doc",
     "size": 231936,
     "kind": "doc"
    }
   ]
  }
 ]
},
{
 "id": "encoder",
 "no": 11,
 "dir": "11-旋转编码器",
 "code": "ENC",
 "icon": "shuffle",
 "p": "gpio",
 "name": {
  "zh": "旋转编码器模块",
  "en": "Rotary encoder module"
 },
 "summary": {
  "zh": "旋转编码器模块的使用说明图。",
  "en": "A single usage diagram for the rotary encoder module."
 },
 "tags": [
  "旋转编码器",
  "正交编码",
  "A/B相",
  "人机输入"
 ],
 "cases": [
  "encoder"
 ],
 "workflows": [
  "wf.gpio-input",
  "wf.exti-button"
 ],
 "kb": [],
 "files": 1,
 "size": 1507874,
 "kinds": {
  "img": 1
 },
 "resources": [
  {
   "name": "旋转编码器模块使用说明.png",
   "path": "11-旋转编码器/旋转编码器模块使用说明.png",
   "size": 1507874,
   "kind": "img"
  }
 ]
},
{
 "id": "ch340",
 "no": 12,
 "dir": "12-CH340 USB转串口",
 "code": "CH340",
 "icon": "terminal",
 "p": "usart",
 "name": {
  "zh": "CH340 USB 转串口模块",
  "en": "CH340 USB-to-serial module"
 },
 "summary": {
  "zh": "CH340G USB 转串口模块：原理图、V4.0 说明文档与 CH341SER 驱动安装包。",
  "en": "CH340G USB-to-serial module: schematic, V4.0 notes and the CH341SER driver package."
 },
 "tags": [
  "USB转串口",
  "CH340",
  "CH341SER",
  "驱动",
  "串口"
 ],
 "cases": [
  "uart-echo"
 ],
 "workflows": [
  "wf.usart-poll",
  "wf.usart-irq"
 ],
 "kb": [
  "usart-frame"
 ],
 "files": 4,
 "size": 298701,
 "kinds": {
  "tool": 1,
  "doc": 2,
  "pdf": 1
 },
 "resources": [
  {
   "name": "CH340G模块原理图",
   "path": "12-CH340 USB转串口/CH340G模块原理图",
   "dir": true,
   "files": 1,
   "size": 35722,
   "kinds": {
    "pdf": 1
   },
   "children": [
    {
     "name": "CH340G模块原理图.pdf",
     "path": "12-CH340 USB转串口/CH340G模块原理图/CH340G模块原理图.pdf",
     "size": 35722,
     "kind": "pdf"
    }
   ]
  },
  {
   "name": "CH340G模块简易说明",
   "path": "12-CH340 USB转串口/CH340G模块简易说明",
   "dir": true,
   "files": 1,
   "size": 29696,
   "kinds": {
    "doc": 1
   },
   "children": [
    {
     "name": "CH340G模块说明 V4.0.doc",
     "path": "12-CH340 USB转串口/CH340G模块简易说明/CH340G模块说明 V4.0.doc",
     "size": 29696,
     "kind": "doc"
    }
   ]
  },
  {
   "name": "CH340G模块驱动",
   "path": "12-CH340 USB转串口/CH340G模块驱动",
   "dir": true,
   "files": 2,
   "size": 233283,
   "kinds": {
    "tool": 1,
    "doc": 1
   },
   "children": [
    {
     "name": "驱动介绍.txt",
     "path": "12-CH340 USB转串口/CH340G模块驱动/驱动介绍.txt",
     "size": 265,
     "kind": "doc"
    },
    {
     "name": "CH341SER.EXE",
     "path": "12-CH340 USB转串口/CH340G模块驱动/CH341SER.EXE",
     "size": 233018,
     "kind": "tool"
    }
   ]
  }
 ]
},
{
 "id": "mpu6050",
 "no": 13,
 "dir": "13-MPU6050 陀螺仪加速度计",
 "code": "MPU6050",
 "icon": "activity",
 "p": "i2c",
 "name": {
  "zh": "MPU6050 陀螺仪加速度计",
  "en": "MPU6050 gyro & accelerometer"
 },
 "summary": {
  "zh": "MPU6050 六轴模块：MPU-6000/6050 产品规格书与寄存器手册、模块原理图与实物图，51 与 Arduino 测试程序。",
  "en": "MPU6050 six-axis module: MPU-6000/6050 product spec and register map, schematic and photo, 8051 and Arduino test projects."
 },
 "tags": [
  "MPU6050",
  "陀螺仪",
  "加速度计",
  "I2C",
  "姿态"
 ],
 "cases": [],
 "workflows": [],
 "kb": [],
 "files": 11,
 "size": 3743659,
 "kinds": {
  "img": 2,
  "pdf": 2,
  "other": 3,
  "prog": 4
 },
 "resources": [
  {
   "name": "PS-MPU-6000A.pdf",
   "path": "13-MPU6050 陀螺仪加速度计/PS-MPU-6000A.pdf",
   "size": 2379366,
   "kind": "pdf"
  },
  {
   "name": "RM-MPU-6000A.pdf",
   "path": "13-MPU6050 陀螺仪加速度计/RM-MPU-6000A.pdf",
   "size": 869339,
   "kind": "pdf"
  },
  {
   "name": "MPU6050-V1-SCH.jpg",
   "path": "13-MPU6050 陀螺仪加速度计/MPU6050-V1-SCH.jpg",
   "size": 186803,
   "kind": "img"
  },
  {
   "name": "MPU6050-V1.jpg",
   "path": "13-MPU6050 陀螺仪加速度计/MPU6050-V1.jpg",
   "size": 58985,
   "kind": "img"
  },
  {
   "name": "测试程序",
   "path": "13-MPU6050 陀螺仪加速度计/测试程序",
   "dir": true,
   "files": 7,
   "size": 249166,
   "kinds": {
    "other": 3,
    "prog": 4
   },
   "children": [
    {
     "name": "51-coed",
     "path": "13-MPU6050 陀螺仪加速度计/测试程序/51-coed",
     "dir": true,
     "files": 2,
     "size": 21889,
     "kinds": {
      "prog": 2
     }
    },
    {
     "name": "Arduino",
     "path": "13-MPU6050 陀螺仪加速度计/测试程序/Arduino",
     "dir": true,
     "files": 5,
     "size": 227277,
     "kinds": {
      "other": 3,
      "prog": 2
     }
    }
   ]
  }
 ]
},
{
 "id": "w25qxx",
 "no": 14,
 "dir": "14-W25QXX Flash闪存",
 "code": "W25QXX",
 "icon": "drive",
 "p": "spi",
 "name": {
  "zh": "W25QXX SPI Flash",
  "en": "W25QXX SPI flash"
 },
 "summary": {
  "zh": "W25Q 系列 SPI Flash：原理图与尺寸图，W25Q16 到 W25Q256 各容量的数据手册，以及示例 hex 与测试工程压缩包。",
  "en": "W25Q SPI flash family: schematic and package drawing, datasheets from W25Q16 to W25Q256, sample hex files and test project archives."
 },
 "tags": [
  "Flash",
  "W25Q",
  "SPI",
  "存储",
  "数据手册"
 ],
 "cases": [
  "spi-flash"
 ],
 "workflows": [
  "wf.spi-flash",
  "wf.flash-param"
 ],
 "kb": [],
 "files": 13,
 "size": 16733738,
 "kinds": {
  "prog": 2,
  "pack": 2,
  "pdf": 8,
  "img": 1
 },
 "resources": [
  {
   "name": "原理图",
   "path": "14-W25QXX Flash闪存/原理图",
   "dir": true,
   "files": 2,
   "size": 114160,
   "kinds": {
    "pdf": 1,
    "img": 1
   },
   "children": [
    {
     "name": "W25Qxx.pdf",
     "path": "14-W25QXX Flash闪存/原理图/W25Qxx.pdf",
     "size": 37529,
     "kind": "pdf"
    },
    {
     "name": "W25QXX尺寸图.JPG",
     "path": "14-W25QXX Flash闪存/原理图/W25QXX尺寸图.JPG",
     "size": 76631,
     "kind": "img"
    }
   ]
  },
  {
   "name": "参考资料",
   "path": "14-W25QXX Flash闪存/参考资料",
   "dir": true,
   "files": 7,
   "size": 12055766,
   "kinds": {
    "pdf": 7
   },
   "children": [
    {
     "name": "W25Q128BV.PDF",
     "path": "14-W25QXX Flash闪存/参考资料/W25Q128BV.PDF",
     "size": 894968,
     "kind": "pdf"
    },
    {
     "name": "W25Q16BV.PDF",
     "path": "14-W25QXX Flash闪存/参考资料/W25Q16BV.PDF",
     "size": 2123438,
     "kind": "pdf"
    },
    {
     "name": "W25Q256FV.PDF",
     "path": "14-W25QXX Flash闪存/参考资料/W25Q256FV.PDF",
     "size": 2876094,
     "kind": "pdf"
    },
    {
     "name": "W25Q32BV.PDF",
     "path": "14-W25QXX Flash闪存/参考资料/W25Q32BV.PDF",
     "size": 1136023,
     "kind": "pdf"
    },
    {
     "name": "W25Q40BV.PDF",
     "path": "14-W25QXX Flash闪存/参考资料/W25Q40BV.PDF",
     "size": 2294277,
     "kind": "pdf"
    },
    {
     "name": "W25Q64BV.PDF",
     "path": "14-W25QXX Flash闪存/参考资料/W25Q64BV.PDF",
     "size": 1630825,
     "kind": "pdf"
    },
    {
     "name": "W25Q80BV.PDF",
     "path": "14-W25QXX Flash闪存/参考资料/W25Q80BV.PDF",
     "size": 1100141,
     "kind": "pdf"
    }
   ]
  },
  {
   "name": "测试程序",
   "path": "14-W25QXX Flash闪存/测试程序",
   "dir": true,
   "files": 4,
   "size": 4563812,
   "kinds": {
    "prog": 2,
    "pack": 2
   },
   "children": [
    {
     "name": "STM32-DEMO.hex",
     "path": "14-W25QXX Flash闪存/测试程序/STM32-DEMO.hex",
     "size": 23877,
     "kind": "prog"
    },
    {
     "name": "STM32-W25Q.hex",
     "path": "14-W25QXX Flash闪存/测试程序/STM32-W25Q.hex",
     "size": 24703,
     "kind": "prog"
    },
    {
     "name": "STM32—W25QXX_DataFlash_Board-Demo.7z",
     "path": "14-W25QXX Flash闪存/测试程序/STM32—W25QXX_DataFlash_Board-Demo.7z",
     "size": 2769167,
     "kind": "pack"
    },
    {
     "name": "W25QXX测试程序.zip",
     "path": "14-W25QXX Flash闪存/测试程序/W25QXX测试程序.zip",
     "size": 1746065,
     "kind": "pack"
    }
   ]
  }
 ]
}
];

export const MATERIAL_MAP = Object.fromEntries(MATERIAL_MODULES.map(m => [m.id, m]));

export const MATERIAL_STATS = {
 "modules": 14,
 "files": 10049,
 "size": 462173691
};
