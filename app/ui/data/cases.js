/* ============================================================
   江协科技《STM32 入门教程》经典案例（按教程工程重做）
   ------------------------------------------------------------
   每条案例对应一个真实工程目录（folder），源码快照在 case-src.js，
   电路图由 channels / modules 描述，行为由 models.js 按源码时序复现。

   字段说明：
     folder    教程工程目录名（对应 case-src.js 里的键前缀）
     files     源码面板里要展示的文件（相对工程目录）
     channels  电路支路：{ key, pin, to, chain:[元件] }
               kind:"divider" 表示电位器分压：竖接 3V3 与 GND，抽头接回 pin
     modules   多引脚器件：{ key, ref, pins:{引脚名:MCU引脚}, lines }
     controls  可操作的输入：range / button
     readouts  读数面板：{ key, zh, en, unit, fmt }
     model     行为模型名（models.js）
     opts      模型参数（电阻、周期、波特率…）
   ============================================================ */

const T = (zh, en) => ({ zh, en });

/* 常用元件快捷构造 */
const res = (ref, value, key) => ({ kind: "res", ref, value, key: key || ref });
const led = (ref, key, dir) => ({ kind: "led", ref, key: key || ref, dir });
const btn = (ref, key) => ({ kind: "btn", ref, key: key || ref });
const pot = (ref, key) => ({ kind: "pot", ref, key: key || ref, value: "10 kΩ" });

/* OLED 0.96" 模块：I2C，PB8=SCL / PB9=SDA（教程所有带显示的工程都是这两脚） */
const OLED = () => ({
  key: "OLED1",
  ref: 'OLED1 · 0.96"',
  pins: { SCL: "PB8", SDA: "PB9" },
  lines: T(["I²C 软件模拟", "SSD1306 128×64"], ["soft I²C", "SSD1306 128×64"])
});

export const CASES = [
  /* ---------------------------------------------------------------- 3-1 */
  {
    id: "led-blink",
    folder: "3-1 LED闪烁",
    files: ["User/main.c"],
    p: "gpio",
    icon: "spark",
    level: 1,
    title: T("LED 闪烁", "Blinking LED"),
    goal: T(
      "课程第一个工程：把 PA0 配成推挽输出，用三种写法轮流翻转，每次延时 500ms。",
      "The very first project: PA0 as push-pull output, toggled three different ways, 500 ms apart."
    ),
    channels: [
      {
        key: "led",
        pin: "PA0",
        to: "vcc",
        chain: [res("R1", "330 Ω"), led("D1", "D1", "rev")]
      }
    ],
    modules: [],
    controls: [],
    readouts: [
      { key: "current", zh: "LED 电流", en: "LED current", unit: "mA", fmt: "ma" },
      { key: "method", zh: "当前写法", en: "Method", unit: "", fmt: "n" },
      { key: "phase", zh: "时序步", en: "Step", unit: "/6", fmt: "n" }
    ],
    model: "blink",
    opts: { r: 330 },
    explain: [
      T(
        "LED 阳极接 3V3、阴极经 330Ω 回 PA0，所以低电平点亮（灌电流）：I = (3.3 − 1.8 − 0.1) / 330 ≈ 4.2mA。",
        "The LED anode sits on 3V3 and the cathode returns to PA0 through 330Ω, so a low level lights it: I ≈ 4.2 mA."
      ),
      T(
        "三种写法效果完全一样，只是风格不同：GPIO_ResetBits/SetBits、GPIO_WriteBit(Bit_RESET/Bit_SET)、GPIO_WriteBit((BitAction)0/1)。",
        "All three styles drive the same register: ResetBits/SetBits, WriteBit with Bit_RESET/Bit_SET, or a cast to BitAction."
      ),
      T(
        "延时靠 Delay_ms 忙等，主循环一轮 3 秒；如果改用定时器中断，CPU 就不必耗在空转上。",
        "Delay_ms busy-waits, so one pass takes 3 s. A timer interrupt would free the CPU from spinning."
      )
    ],
    check: T(
      "把 330Ω 换成 33Ω：I ≈ 42mA，已经超过单个引脚 20mA 的绝对上限，引脚会发烫甚至损坏。",
      "Swap 330Ω for 33Ω: 42 mA, beyond the pin's 20 mA absolute maximum."
    ),
    related: {
      kb: ["gpio-modes", "led-bjt", "pin-map"],
      functions: ["std.rcc.apb2clockcmd", "std.gpio.init", "std.gpio.setbits", "std.gpio.resetbits", "std.gpio.writebit", "hal.gpio.writepin"],
      workflows: ["wf.gpio-output"]
    }
  },

  /* ---------------------------------------------------------------- 3-2 */
  {
    id: "led-flow",
    folder: "3-2 LED流水灯",
    files: ["User/main.c"],
    p: "gpio",
    icon: "grid",
    level: 1,
    title: T("LED 流水灯", "Running lights"),
    goal: T(
      "PA0–PA7 各接一只 LED，用 GPIO_Write 一次写整个端口，让亮的那一位逐格移动，每格 100ms。",
      "Eight LEDs on PA0–PA7; one GPIO_Write sets the whole port so the lit bit walks along every 100 ms."
    ),
    channels: [
      { key: "D1", pin: "PA0", to: "vcc", chain: [res("R1", "330 Ω"), led("D1", "D1", "rev")] },
      { key: "D2", pin: "PA1", to: "vcc", chain: [res("R2", "330 Ω"), led("D2", "D2", "rev")] },
      { key: "D3", pin: "PA2", to: "vcc", chain: [res("R3", "330 Ω"), led("D3", "D3", "rev")] },
      { key: "D4", pin: "PA3", to: "vcc", chain: [res("R4", "330 Ω"), led("D4", "D4", "rev")] },
      { key: "D5", pin: "PA4", to: "vcc", chain: [res("R5", "330 Ω"), led("D5", "D5", "rev")] },
      { key: "D6", pin: "PA5", to: "vcc", chain: [res("R6", "330 Ω"), led("D6", "D6", "rev")] },
      { key: "D7", pin: "PA6", to: "vcc", chain: [res("R7", "330 Ω"), led("D7", "D7", "rev")] },
      { key: "D8", pin: "PA7", to: "vcc", chain: [res("R8", "330 Ω"), led("D8", "D8", "rev")] }
    ],
    modules: [],
    controls: [],
    readouts: [
      { key: "index", zh: "当前点亮", en: "Lit bit", unit: "", fmt: "n" },
      { key: "word", zh: "ODR 低 8 位", en: "ODR bits", unit: "", fmt: "hex" },
      { key: "current", zh: "单只 LED", en: "Per LED", unit: "mA", fmt: "ma" }
    ],
    model: "flow",
    opts: { r: 330 },
    explain: [
      T(
        "GPIO_Write 一次写整个 ODR，掩码是取反的：~0x0001 表示只有第 0 位为低，其余全高。",
        "GPIO_Write loads the whole ODR at once; the mask is inverted, so ~0x0001 drives only bit 0 low."
      ),
      T(
        "代码只翻转低 8 位，高 8 位（PA8–PA15）会被 ~ 运算一并拉高；如果这些脚上接了别的外设，要改用按位写。",
        "ORing the inversion also lifts PA8–PA15 high; use bit writes if anything else is wired there."
      ),
      T(
        "8 只 LED 同时只有一只在导通，所以端口总电流仅 4mA 左右；如果全部点亮就是 8 × 4.2 = 34mA，超过了芯片总灌电流预算。",
        "Only one LED conducts at a time (~4 mA). All eight would total 34 mA, past the chip-wide sink budget."
      )
    ],
    check: T(
      "想同时点亮 4 只时，要算总电流：4 × 4.2 = 17mA，仍在上限内；一旦 8 只全亮就要加驱动管。",
      "Four at once is 17 mA, still safe; eight needs a driver transistor."
    ),
    related: {
      kb: ["gpio-modes", "pin-map", "f103c8t6"],
      functions: ["std.gpio.init", "hal.gpio.writepin"],
      workflows: ["wf.gpio-output"]
    }
  },

  /* ---------------------------------------------------------------- 3-3 */
  {
    id: "buzzer",
    folder: "3-3 蜂鸣器",
    files: ["User/main.c"],
    p: "gpio",
    icon: "wave",
    level: 1,
    title: T("蜂鸣器", "Buzzer"),
    goal: T(
      "PB12 驱动板载蜂鸣器模块，低电平响。节奏 100ms、100ms、100ms、700ms 一段，循环。",
      "PB12 drives the on-board buzzer module, active low. The rhythm is 100/100/100/700 ms, repeated."
    ),
    channels: [],
    modules: [
      {
        key: "BZ1",
        ref: "BZ1 · 有源蜂鸣器模块",
        pins: { IN: "PB12" },
        lines: T(["S8550 PNP 驱动", "低电平导通", "约 30 mA @3.3V"], ["S8550 PNP driver", "active low", "~30 mA @3.3V"])
      }
    ],
    controls: [],
    readouts: [
      { key: "on", zh: "鸣叫", en: "Sounding", unit: "", fmt: "bool" },
      { key: "beeps", zh: "已响", en: "Beeps", unit: "次", fmt: "n" },
      { key: "freq", zh: "本体频率", en: "Tone", unit: "Hz", fmt: "n" }
    ],
    model: "buzzer",
    opts: {},
    explain: [
      T(
        "板载模块用 S8550 三极管驱动，PB12 只需要提供基极电流（微安级），蜂鸣器的 30mA 由三极管扛。",
        "The module's S8550 transistor carries the 30 mA; PB12 only supplies base current, a few hundred microamps."
      ),
      T(
        "因为 PNP 低电平导通，所以源码里 ResetBits（低）表示「响」，SetBits（高）表示「停」——和 LED 是同一套极性。",
        "A PNP conducts on a low base, so ResetBits means sound and SetBits means silence, the same polarity as the LEDs."
      ),
      T(
        "这是有源蜂鸣器：给电就响，响的音调由模块自身振荡决定，代码只控制开关；无源蜂鸣器才需要 PWM 给频率。",
        "This is an active buzzer: it oscillates on its own, so the code only switches it. A passive one would need PWM."
      )
    ],
    check: T(
      "把节奏改成 1ms 通断：有源蜂鸣器根本反应不过来，只会听到一段模糊的“嗒”声——调音调要换无源蜂鸣器 + PWM。",
      "Switch every 1 ms and an active buzzer cannot follow; you would just hear a click. Tone control needs a passive part plus PWM."
    ),
    related: {
      kb: ["gpio-modes", "led-bjt"],
      functions: ["std.gpio.init", "std.gpio.setbits", "std.gpio.resetbits"],
      workflows: ["wf.gpio-output"]
    }
  },

  /* ---------------------------------------------------------------- 3-4 */
  {
    id: "key-led",
    folder: "3-4 按键控制LED",
    files: ["User/main.c", "Hardware/Key.c", "Hardware/Key.h", "Hardware/LED.c", "Hardware/LED.h"],
    p: "gpio",
    icon: "pin",
    level: 2,
    title: T("按键控制 LED", "Keys toggle LEDs"),
    goal: T(
      "PB1 / PB11 上拉输入接按键，按下为低；两只 LED 各受一个按键控制，按一次翻转一次。",
      "PB1 and PB11 are pulled-up inputs; each press of a key toggles its own LED."
    ),
    channels: [
      { key: "K1", pin: "PB1", to: "gnd", chain: [btn("K1", "K1")] },
      { key: "K2", pin: "PB11", to: "gnd", chain: [btn("K2", "K2")] },
      { key: "D1", pin: "PA1", to: "vcc", chain: [res("R1", "330 Ω"), led("D1", "D1", "rev")] },
      { key: "D2", pin: "PA2", to: "vcc", chain: [res("R2", "330 Ω"), led("D2", "D2", "rev")] }
    ],
    modules: [],
    controls: [
      { key: "key1", kind: "button", zh: "按 K1（PB1）", en: "Press K1 (PB1)" },
      { key: "key2", kind: "button", zh: "按 K2（PB11）", en: "Press K2 (PB11)" }
    ],
    readouts: [
      { key: "key1", zh: "PB1 电平", en: "PB1", unit: "", fmt: "bool" },
      { key: "key2", zh: "PB11 电平", en: "PB11", unit: "", fmt: "bool" },
      { key: "led1", zh: "LED1", en: "LED1", unit: "", fmt: "bool" },
      { key: "led2", zh: "LED2", en: "LED2", unit: "", fmt: "bool" }
    ],
    model: "keys",
    opts: { r: 330 },
    explain: [
      T(
        "上拉输入（GPIO_Mode_IPU）把引脚内部接到 3.3V：按键没按时读 1，按下接地读 0，所以判断条件写 == 0。",
        "IPU ties the pin to 3.3 V internally: 1 when released, 0 when pressed, so the test is == 0."
      ),
      T(
        "Key_GetNum() 里 Delay_ms(20) 是软件消抖，while (读 == 0) 是等松手——两者合起来保证「按一次只算一次」。",
        "Key_GetNum() debounces with Delay_ms(20) and waits while the pin stays low, so one press counts once."
      ),
      T(
        "等待松手是阻塞的：按住不放时主循环停在这里，其他事情都做不了。工程上常改成状态机或 EXTI 中断。",
        "Waiting for release blocks the main loop; a state machine or an EXTI interrupt avoids that."
      )
    ],
    check: T(
      "去掉 20ms 消抖：机械触点抖动会一次按下产生好几个边沿，LED 看起来“闪一下又回去”。",
      "Remove the 20 ms debounce and contact bounce turns one press into several toggles."
    ),
    related: {
      kb: ["gpio-modes", "pin-map"],
      functions: ["std.gpio.init", "std.gpio.readinputbit", "hal.gpio.readpin", "hal.gpio.togglepin"],
      workflows: ["wf.gpio-input", "wf.exti-button"]
    }
  },

  /* ---------------------------------------------------------------- 3-5 */
  {
    id: "light-buzzer",
    folder: "3-5 光敏传感器控制蜂鸣器",
    files: ["User/main.c", "Hardware/LightSensor.c", "Hardware/Buzzer.c", "Hardware/Buzzer.h"],
    p: "gpio",
    icon: "zap",
    level: 2,
    title: T("光敏传感器控制蜂鸣器", "Light sensor drives the buzzer"),
    goal: T(
      "光敏模块的 DO 输出接 PB13（上拉输入），遮挡光线时 DO 变高，蜂鸣器跟着响。",
      "The light module's DO goes to PB13 (pull-up input); covering the sensor raises DO and the buzzer sounds."
    ),
    channels: [],
    modules: [
      {
        key: "LS1",
        ref: "LS1 · 光敏传感器模块",
        pins: { DO: "PB13" },
        lines: T(["比较器 + 电位器阈值", "暗 → DO 输出高"], ["comparator + pot threshold", "dark → DO high"])
      },
      {
        key: "BZ1",
        ref: "BZ1 · 蜂鸣器模块",
        pins: { IN: "PB12" },
        lines: T(["低电平导通"], ["active low"])
      }
    ],
    controls: [
      { key: "light", kind: "range", min: 0, max: 100, step: 1, def: 80, unit: "%", zh: "环境光照", en: "Ambient light" }
    ],
    readouts: [
      { key: "light", zh: "光照", en: "Light", unit: "%", fmt: "n" },
      { key: "dark", zh: "判定", en: "Verdict", unit: "", fmt: "dark" },
      { key: "beep", zh: "蜂鸣器", en: "Buzzer", unit: "", fmt: "bool" }
    ],
    model: "light",
    opts: { threshold: 30 },
    explain: [
      T(
        "模块把模拟量变成了数字量：内部比较器拿光敏电阻分压和电位器阈值比，结果直接给 DO，所以 MCU 只读高低电平。",
        "The module digitises the analogue side: an internal comparator thresholds the divider and drives DO, so the MCU only reads a level."
      ),
      T(
        "上拉输入的意义：模块 DO 是开漏输出，没遮光时它悬空，靠 PB13 内部上拉才能读到稳定的高电平。",
        "IPU matters here: DO is open-drain, so the internal pull-up defines the level when the module does not drive it."
      ),
      T(
        "阈值是模块上那颗电位器调出来的，不是代码里的常量；换阈值要拧电位器，代码只能改“极性判断”。",
        "The threshold comes from the module's trim pot, not from code; only the polarity test lives in software."
      )
    ],
    check: T(
      "把 LightSensor_Get() == 1 改成 == 0：逻辑反过来，变成“亮的时候响”，这是最容易犯的极性错误。",
      "Flipping == 1 to == 0 inverts the behaviour to “sounds in the light” — the classic polarity bug."
    ),
    related: {
      kb: ["gpio-modes", "adc-basics"],
      functions: ["std.gpio.init", "std.gpio.readinputbit", "std.gpio.setbits", "std.gpio.resetbits"],
      workflows: ["wf.gpio-input"]
    }
  },

  /* ---------------------------------------------------------------- 5-2 */
  {
    id: "encoder",
    folder: "5-2 旋转编码器计次",
    files: ["User/main.c", "Hardware/Encoder.c", "Hardware/Encoder.h", "Hardware/OLED.c"],
    p: "exti",
    icon: "shuffle",
    level: 3,
    title: T("旋转编码器计次", "Rotary encoder counter"),
    goal: T(
      "编码器 A/B 相接 PB0 / PB1，转一格计数加一或减一，结果显示在 OLED 上（带符号 5 位）。",
      "Encoder A/B on PB0/PB1; each detent adds or subtracts one and the OLED shows a signed 5-digit count."
    ),
    channels: [],
    modules: [
      {
        key: "ENC1",
        ref: "ENC1 · 旋转编码器",
        pins: { A: "PB0", B: "PB1" },
        lines: T(["正交输出 + 按键", "每格 20 个边沿"], ["quadrature + push button", "20 edges per detent"])
      },
      OLED()
    ],
    controls: [
      { key: "up", kind: "button", zh: "向右转一格", en: "One detent right" },
      { key: "down", kind: "button", zh: "向左转一格", en: "One detent left" }
    ],
    readouts: [
      { key: "num", zh: "计数值", en: "Count", unit: "", fmt: "n" }
    ],
    model: "encoder",
    opts: {},
    explain: [
      T(
        "Encoder.c 用 EXTI 双边沿中断：A、B 两相各自上下沿都触发，一格里总共 4 个事件，正交解码靠比较两相电平判定方向。",
        "Encoder.c hooks EXTI on both edges of both phases: four events per detent, direction decided by comparing the two levels."
      ),
      T(
        "Encoder_Get() 返回「上次调用以来的增量」并把计数清零，所以主循环里用 Num += Encoder_Get() 累加。",
        "Encoder_Get() returns the delta since the previous call and clears it, hence Num += Encoder_Get()."
      ),
      T(
        "机械编码器有抖动，一次转动可能多算；教程用四倍频提高分辨率，实际工程里还要加滤波或按格判定。",
        "Mechanical encoders bounce; four-fold decoding raises resolution but still wants filtering in production."
      )
    ],
    check: T(
      "只接 A 相也能计数，但分不清方向——方向信息藏在两相的先后顺序里。",
      "One phase alone counts but cannot tell direction; direction lives in the phase order."
    ),
    related: {
      kb: ["gpio-modes", "pin-map"],
      functions: ["std.exti.lineconfig", "std.exti.init", "std.gpio.init", "hal.exti.callback"],
      workflows: ["wf.exti-button"]
    }
  },

  /* ---------------------------------------------------------------- 6-1 */
  {
    id: "timer-int",
    folder: "6-1 定时器定时中断",
    files: ["User/main.c", "User/stm32f10x_it.c", "Hardware/OLED.c"],
    p: "tim",
    icon: "clock",
    level: 3,
    title: T("定时器定时中断", "Timer interrupt"),
    goal: T(
      "TIM2 每 1 秒产生一次更新中断（PSC=7200−1，ARR=10000−1），中断里 Num 自增，主循环只负责显示。",
      "TIM2 fires an update interrupt every 1 s (PSC=7200−1, ARR=10000−1); the ISR increments Num, the main loop only displays it."
    ),
    channels: [],
    modules: [OLED()],
    controls: [],
    readouts: [
      { key: "num", zh: "Num", en: "Num", unit: "", fmt: "n" },
      { key: "ticks", zh: "中断次数", en: "IRQs", unit: "次", fmt: "n" },
      { key: "period", zh: "中断周期", en: "Period", unit: "ms", fmt: "n" }
    ],
    model: "timer",
    opts: { period: 1.0 },
    explain: [
      T(
        "72MHz / 7200 = 10kHz 计数时钟，再数 10000 个就是 1 秒：分频和周期共同决定中断间隔。",
        "72 MHz / 7200 = 10 kHz; counting 10 000 of those gives 1 s. Prescaler and period together set the interval."
      ),
      T(
        "中断函数里必须 TIM_ClearITPendingBit 清标志，否则中断会立刻再进一次，主程序卡死在中断里。",
        "The ISR must clear the pending bit; otherwise it re-enters immediately and the main loop starves."
      ),
      T(
        "这个工程没有外部接线——TIM2 全部在芯片内部走，OLED 只是把 Num 显示出来。",
        "Nothing is wired externally here: TIM2 lives inside the chip and the OLED just prints Num."
      )
    ],
    check: T(
      "把 ARR 写成 10000-1 但 PSC 忘了改：时钟变成 72MHz 直连，中断频率差 7200 倍。",
      "Change ARR but forget PSC and the interrupt runs 7200× too fast."
    ),
    related: {
      kb: ["timer-pwm", "f103c8t6"],
      functions: ["std.tim.timebaseinit", "std.tim.itconfig", "std.tim.getitstatus", "std.tim.clearitpending", "std.nvic.init", "hal.tim.basestartit", "hal.tim.periodelapsedcallback"],
      workflows: ["wf.tim-irq"]
    }
  },

  /* ---------------------------------------------------------------- 6-3 */
  {
    id: "pwm-breath",
    folder: "6-3 PWM驱动LED呼吸灯",
    files: ["User/main.c", "Hardware/PWM.c", "Hardware/PWM.h", "Hardware/OLED.c"],
    p: "tim",
    icon: "activity",
    level: 4,
    title: T("PWM 驱动 LED 呼吸灯", "PWM breathing LED"),
    goal: T(
      "TIM2 通道 1 输出 1kHz PWM（PSC=720−1，ARR=100−1）到 PA0，CCR 从 0 数到 100 再数回来，LED 由亮渐暗再渐亮。",
      "TIM2 CH1 puts 1 kHz PWM on PA0 (PSC=720−1, ARR=100−1); CCR sweeps 0→100→0 so the LED breathes."
    ),
    channels: [
      {
        key: "led",
        pin: "PA0",
        to: "vcc",
        chain: [res("R1", "330 Ω"), led("D1", "D1", "rev")]
      }
    ],
    modules: [OLED()],
    controls: [],
    readouts: [
      { key: "ccr", zh: "CCR", en: "CCR", unit: "/100", fmt: "n" },
      { key: "duty", zh: "占空比", en: "Duty", unit: "%", fmt: "pct" },
      { key: "brightness", zh: "LED 亮度", en: "Brightness", unit: "%", fmt: "pct" },
      { key: "current", zh: "平均电流", en: "Avg current", unit: "mA", fmt: "ma" }
    ],
    model: "breath",
    opts: { r: 330 },
    explain: [
      T(
        "PWM 模式 1 + 高极性：CNT < CCR 时输出高电平。LED 接在 3V3 与 PA0 之间，所以占空比越小反而越亮。",
        "PWM mode 1 with high polarity drives the pin high while CNT < CCR. The LED sits between 3V3 and PA0, so a smaller duty is brighter."
      ),
      T(
        "人眼看到的是平均亮度：占空比 50%、电流 4mA 的方波，看起来约等于 2mA 的直流，闪烁因为 1kHz 远高于视觉融合频率。",
        "The eye integrates the square wave: a 50% duty 4 mA pulse reads as about 2 mA of DC because 1 kHz is well above flicker fusion."
      ),
      T(
        "CCR 每 10ms 变一格，一个来回约 2 秒；如果把 ARR 改成 1000，同样的呼吸效果需要更细的步进。",
        "CCR steps every 10 ms for a ≈2 s round trip; a 1000-count ARR would need finer steps for the same effect."
      )
    ],
    check: T(
      "把 ARR 从 100−1 改成 10−1 而 PSC 不动：PWM 频率升到 10kHz，但亮度只剩 10 级调节，呼吸会变得一段一段。",
      "ARR 10−1 with the same PSC raises the frequency to 10 kHz but leaves only 10 brightness steps, visible as banding."
    ),
    related: {
      kb: ["timer-pwm", "led-bjt"],
      functions: ["std.tim.timebaseinit", "std.tim.ocinit", "std.tim.cmd", "std.tim.setcompare", "hal.tim.pwmconfigchannel", "hal.tim.pwmstart"],
      workflows: ["wf.tim-pwm"]
    }
  },

  /* ---------------------------------------------------------------- 6-4 */
  {
    id: "servo",
    folder: "6-4 PWM驱动舵机",
    files: [
      "User/main.c",
      "Hardware/PWM.c",
      "Hardware/PWM.h",
      "Hardware/Servo.c",
      "Hardware/Servo.h",
      "Hardware/Key.c",
      "Hardware/Key.h",
      "Hardware/OLED.c"
    ],
    p: "tim",
    icon: "arrows",
    level: 4,
    title: T("PWM 驱动舵机", "Servo via PWM"),
    goal: T(
      "TIM2 通道 2 在 PA1 上输出 50Hz PWM（PSC=72−1，ARR=20000−1），脉宽 0.5–2.5ms 对应 0–180°，按键 1 每次加 30°。",
      "TIM2 CH2 emits 50 Hz on PA1 (PSC=72−1, ARR=20000−1); 0.5–2.5 ms pulses map to 0–180°, and key 1 adds 30° per press."
    ),
    channels: [
      { key: "K1", pin: "PB1", to: "gnd", chain: [btn("K1", "K1")] }
    ],
    modules: [
      {
        key: "M1",
        ref: "M1 · SG90 舵机",
        pins: { SIG: "PA1" },
        lines: T(["橙=信号 PA1", "红=5V 电源", "棕=GND"], ["orange: SIG PA1", "red: 5 V", "brown: GND"])
      },
      OLED()
    ],
    controls: [
      { key: "key1", kind: "button", zh: "按 K1（+30°）", en: "Press K1 (+30°)" }
    ],
    readouts: [
      { key: "angle", zh: "角度", en: "Angle", unit: "°", fmt: "deg" },
      { key: "ccr", zh: "CCR", en: "CCR", unit: "", fmt: "n" },
      { key: "pulse", zh: "脉宽", en: "Pulse", unit: "µs", fmt: "n" },
      { key: "freq", zh: "频率", en: "Frequency", unit: "Hz", fmt: "n" }
    ],
    model: "servo",
    opts: {},
    explain: [
      T(
        "舵机认的是脉宽不是占空比：0.5ms→0°、1.5ms→90°、2.5ms→180°，所以 20ms 周期里高电平宽度才是信息。",
        "A servo reads pulse width, not duty: 0.5 ms → 0°, 1.5 ms → 90°, 2.5 ms → 180°, inside a 20 ms frame."
      ),
      T(
        "Servo_SetAngle 里的 Angle / 180 * 2000 + 500 就是把角度线性映射到 CCR：1MHz 计数时钟下 1 个计数 = 1µs。",
        "Angle / 180 * 2000 + 500 linearly maps degrees to CCR; with a 1 MHz counter one count is one microsecond."
      ),
      T(
        "舵机是感性负载，启动瞬间电流可达几百 mA，一定要独立 5V 供电并与 MCU 共地，不能从板子的 3.3V 取电。",
        "Servos draw hundreds of milliamps at start-up: give them a separate 5 V rail sharing ground with the MCU."
      )
    ],
    check: T(
      "把 ARR 改成 1000−1 而不改 PSC：脉宽分辨率从 1µs 掉到 72µs，角度会明显“跳格”。",
      "Drop ARR to 1000−1 with the same PSC and the 1 µs resolution becomes 72 µs, so angles visibly quantise."
    ),
    related: {
      kb: ["timer-pwm", "pin-map"],
      functions: ["std.tim.timebaseinit", "std.tim.ocinit", "std.tim.setcompare", "std.gpio.init", "std.gpio.readinputbit", "hal.tim.setcompare"],
      workflows: ["wf.tim-pwm"]
    }
  },

  /* ---------------------------------------------------------------- 7-1 */
  {
    id: "adc-pot",
    folder: "7-1 AD单通道",
    files: ["User/main.c", "Hardware/AD.c", "Hardware/AD.h", "Hardware/OLED.c"],
    p: "adc",
    icon: "pulse",
    level: 3,
    title: T("AD 单通道采样", "Single-channel ADC"),
    goal: T(
      "电位器分压送 PA0（ADC1 通道 0，55.5 周期采样），把 0–4095 的码值换算成 0–3.3V 显示在 OLED 上。",
      "A pot divider feeds PA0 (ADC1 channel 0, 55.5 cycles); the code maps 0–4095 to 0–3.3 V and shows both on the OLED."
    ),
    channels: [
      { key: "pot", pin: "PA0", kind: "divider", to: "gnd", chain: [pot("RV1", "RV1")] }
    ],
    modules: [OLED()],
    controls: [
      { key: "pot", kind: "range", min: 0, max: 100, step: 1, def: 50, unit: "%", zh: "电位器位置", en: "Wiper" }
    ],
    readouts: [
      { key: "code", zh: "AD 码值", en: "Code", unit: "/4095", fmt: "n" },
      { key: "voltage", zh: "电压", en: "Voltage", unit: "V", fmt: "v" }
    ],
    model: "adc",
    opts: {},
    explain: [
      T(
        "12 位 ADC 把 0–3.3V 切成 4096 份，1 份 ≈ 0.806mV；代码里除以 4095（而不是 4096）是教程的取法。",
        "A 12-bit ADC slices 0–3.3 V into 4096 parts, about 0.806 mV each; the code divides by 4095, as the tutorial does."
      ),
      T(
        "模拟输入必须配成 GPIO_Mode_AIN：此时引脚的数字部分断开，否则输入缓冲会给分压器带来额外负载。",
        "The pin must be GPIO_Mode_AIN: that disconnects the digital input buffer, which would otherwise load the divider."
      ),
      T(
        "55.5 周期是最慢的采样时间，适合高阻抗源；电位器 10kΩ 属于高阻，用最快的 1.5 周期会让采样电容充不满。",
        "55.5 cycles is the slowest sampling time and suits high-impedance sources; 1.5 cycles would not charge the sample cap through 10 kΩ."
      )
    ],
    check: T(
      "把电位器换成 1MΩ：采样时间不够，读数会明显偏低而且随温度漂——要么加长采样周期，要么加运放缓冲。",
      "With a 1 MΩ pot the sample window is too short and readings sag; lengthen the sampling time or buffer with an op-amp."
    ),
    related: {
      kb: ["adc-basics", "pin-map"],
      functions: ["std.adc.init", "std.adc.regularchannelconfig", "std.adc.cmd", "std.adc.softwarestartconvcmd", "std.adc.getconversionvalue", "hal.adc.configchannel", "hal.adc.start", "hal.adc.getvalue"],
      workflows: ["wf.adc-poll"]
    }
  },

  /* ---------------------------------------------------------------- 9-2 */
  {
    id: "uart-echo",
    folder: "9-2 串口发送+接收",
    files: ["User/main.c", "Hardware/Serial.c", "Hardware/Serial.h", "User/stm32f10x_it.c", "Hardware/OLED.c"],
    p: "usart",
    icon: "share",
    level: 3,
    title: T("串口发送 + 接收", "UART echo"),
    goal: T(
      "USART1 在 PA9/PA10 上收数据：中断里把收到的字节存下来并置标志，主循环取出后原样回传，OLED 显示十六进制。",
      "USART1 on PA9/PA10: the ISR stores each byte and raises a flag; the main loop echoes it and shows the hex value."
    ),
    channels: [],
    modules: [
      {
        key: "U3",
        ref: "U3 · USB-TTL 串口模块",
        pins: { TXD: "PA10", RXD: "PA9" },
        lines: T(["交叉连接：TX→PA10", "RXD→PA9，共地"], ["crossed: TX→PA10", "RXD→PA9, shared GND"])
      },
      OLED()
    ],
    controls: [
      { key: "serial", kind: "serial", zh: "往串口发送", en: "Send over serial", placeholder: T("输入字符后回车", "type and press Enter") }
    ],
    readouts: [
      { key: "baud", zh: "波特率", en: "Baud", unit: "", fmt: "n" },
      { key: "frames", zh: "已收字节", en: "Bytes received", unit: "", fmt: "n" },
      { key: "rxHex", zh: "最近一字节", en: "Last byte", unit: "", fmt: "raw" },
      { key: "bitTime", zh: "每比特", en: "Bit time", unit: "µs", fmt: "n" }
    ],
    model: "uart",
    opts: { baud: 9600 },
    explain: [
      T(
        "串口是异步的：没有时钟线，两端靠事先约好的波特率各自计时，所以 Serial_Init 里的 9600 必须和串口助手一致。",
        "UART has no clock line: both ends time the bits from the agreed baud rate, so 9600 in init must match the terminal."
      ),
      T(
        "接收用中断而不是查询：RXNE 一置位就进 USART1_IRQHandler，读走 DR 会自动清标志，再置 RxFlag 通知主循环。",
        "Reception is interrupt-driven: RXNE enters the ISR, reading DR clears it, and RxFlag tells the main loop."
      ),
      T(
        "接线要交叉：模块 TX 接 PA10(RX)，模块 RX 接 PA9(TX)，同名字对同名会两边都在发、谁都收不到。",
        "Wiring is crossed: module TX to PA10 (RX), module RX to PA9 (TX). Straight-through leaves both ends transmitting."
      )
    ],
    check: T(
      "波特率差 2%（比如 9600 对 9412）时，第 8 个数据位开始就错，接收到的字节会周期性变成乱码——这就是波特率误差容限的由来。",
      "A 2% baud mismatch corrupts bits from the eighth onward, producing periodic garbage — the reason for the tolerance spec."
    ),
    related: {
      kb: ["usart-frame", "pin-map"],
      functions: ["std.usart.init", "std.usart.cmd", "std.usart.itconfig", "std.usart.senddata", "std.usart.receivedata", "std.usart.getflagstatus", "hal.usart.transmit", "hal.usart.receive_it", "hal.usart.rxcpltcallback"],
      workflows: ["wf.usart-poll", "wf.usart-irq"]
    }
  },

  /* ---------------------------------------------------------------- 11-1 */
  {
    id: "spi-flash",
    folder: "11-1 软件SPI读写W25Q64",
    files: [
      "User/main.c",
      "Hardware/MySPI.c",
      "Hardware/MySPI.h",
      "Hardware/W25Q64.c",
      "Hardware/W25Q64.h",
      "Hardware/OLED.c"
    ],
    p: "spi",
    icon: "drive",
    level: 5,
    title: T("软件 SPI 读写 W25Q64", "Soft-SPI with W25Q64"),
    goal: T(
      "用 GPIO 手动打时序模拟 SPI（PA4=CS、PA5=SCK、PA6=MISO、PA7=MOSI），读出 MID/DID，再擦扇区、写 4 字节、读回校验。",
      "Bit-bang SPI on PA4=CS, PA5=SCK, PA6=MISO, PA7=MOSI; read MID/DID, erase a sector, program four bytes and read them back."
    ),
    channels: [],
    modules: [
      {
        key: "U2",
        ref: "U2 · W25Q64",
        pins: { CS: "PA4", CLK: "PA5", DO: "PA6", DI: "PA7" },
        lines: T(["8MB SPI Flash", "MID=EF DID=4017"], ["8 MB SPI flash", "MID=EF DID=4017"])
      },
      OLED()
    ],
    controls: [],
    readouts: [
      { key: "mid", zh: "MID", en: "MID", unit: "", fmt: "raw" },
      { key: "did", zh: "DID", en: "DID", unit: "", fmt: "raw" },
      { key: "written", zh: "写入", en: "Written", unit: "", fmt: "raw" },
      { key: "read", zh: "读回", en: "Read back", unit: "", fmt: "raw" }
    ],
    model: "spi",
    opts: {},
    explain: [
      T(
        "软件 SPI 就是手动摆引脚：SCK 拉低→放 MOSI→拉高→读 MISO，一个时钟交换一位，MSB 先出。",
        "Soft SPI is manual pin wiggling: SCK low, drive MOSI, SCK high, sample MISO — one bit per clock, MSB first."
      ),
      T(
        "W25Q64 写之前必须先擦除：Flash 只能把 1 写成 0，擦除是把整个扇区（4KB）恢复成 0xFF。",
        "Erase before you program: flash can only turn 1s into 0s, and erasing restores a whole 4 KB sector to 0xFF."
      ),
      T(
        "CS 必须在指令前后完整包住时序，并且每次操作后等 BUSY 位清零；连发两条指令而不等，第二条会被丢掉。",
        "CS must bracket the whole transaction and BUSY must clear between commands, or the second command is dropped."
      )
    ],
    check: T(
      "读到 MID=0xFF、DID=0xFFFF 通常不是芯片坏，而是 MISO 没接或 CS 没拉低——先量这四根线。",
      "MID 0xFF and DID 0xFFFF usually mean MISO is floating or CS never asserted, not a dead chip."
    ),
    related: {
      kb: ["pin-map", "f103c8t6", "gpio-modes"],
      functions: ["std.gpio.init", "std.gpio.writebit", "std.gpio.readinputbit", "std.spi.init", "hal.spi.transmitreceive"],
      workflows: ["wf.spi-flash"]
    }
  },

  /* ---------------------------------------------------------------- 12-2 */
  {
    id: "rtc-clock",
    folder: "12-2 实时时钟",
    files: ["User/main.c", "Hardware/OLED.c"],
    p: "rtc",
    icon: "calendar",
    level: 4,
    title: T("实时时钟", "Real-time clock"),
    goal: T(
      "RTC 由 32.768kHz 晶振分频出 1Hz，主循环读出日期时间、秒计数器和余数寄存器，全部显示在 OLED 上。",
      "The RTC divides a 32.768 kHz crystal down to 1 Hz; the loop prints date, time, the 32-bit counter and the divider."
    ),
    channels: [],
    modules: [OLED()],
    controls: [],
    readouts: [
      { key: "time", zh: "时间", en: "Time", unit: "", fmt: "raw" },
      { key: "date", zh: "日期", en: "Date", unit: "", fmt: "raw" },
      { key: "counter", zh: "CNT", en: "CNT", unit: "s", fmt: "n" },
      { key: "divider", zh: "DIV", en: "DIV", unit: "/32768", fmt: "n" }
    ],
    model: "rtc",
    opts: {},
    explain: [
      T(
        "RTC 属于备份域：VDD 掉电后靠 VBAT 上的纽扣电池继续走，所以它才叫「实时」时钟。",
        "The RTC sits in the backup domain and keeps running on VBAT after VDD drops — that is what makes it real-time."
      ),
      T(
        "32.768kHz = 2^15，用 15 级二分频正好得到 1Hz；改成 32kHz 晶振会每天慢约 40 秒。",
        "32.768 kHz is 2^15, so fifteen divide-by-two stages give exactly 1 Hz; a 32 kHz crystal would lose about 40 s a day."
      ),
      T(
        "CNT 是秒计数器，DIV 是当前秒内的余数（0–32767）；两者一起才能算出精确到 1/32768 秒的时间。",
        "CNT counts seconds and DIV is the remainder inside the current second (0–32767); together they resolve time to 1/32768 s."
      )
    ],
    check: T(
      "第一次上电必须在初始化里写一次初值（教程用编译时间 __DATE__/__TIME__），否则 RTC 从 2000-01-01 开始走。",
      "It must be seeded once at init (the tutorial uses __DATE__/__TIME__), otherwise it starts from 2000-01-01."
    ),
    related: {
      kb: ["f103c8t6", "timer-pwm"],
      functions: ["std.rtc.waitforsynchro", "std.rtc.setcounter", "std.rtc.getcounter", "std.rtc.getdivider", "std.rcc.apb1clockcmd", "hal.rtc.settime", "hal.rtc.gettime"],
      workflows: ["wf.rtc"]
    }
  },

  /* ---------------------------------------------------------------- 15-2 */
  {
    id: "chip-id",
    folder: "15-2 读取芯片ID",
    files: ["User/main.c", "Hardware/OLED.c"],
    p: "flash",
    icon: "chip",
    level: 2,
    title: T("读取芯片 ID", "Read the chip ID"),
    goal: T(
      "直接用指针访问 0x1FFFF7E0 与 0x1FFFF7E8：前者是 Flash 容量（单位 KB），后者是 96 位唯一 ID。",
      "Pointer reads at 0x1FFFF7E0 and 0x1FFFF7E8: the first is the flash size in KB, the second a 96-bit unique ID."
    ),
    channels: [],
    modules: [OLED()],
    controls: [],
    readouts: [
      { key: "flash", zh: "Flash 容量", en: "Flash size", unit: "KB", fmt: "n" },
      { key: "uid", zh: "唯一 ID", en: "Unique ID", unit: "", fmt: "raw" }
    ],
    model: "uid",
    opts: {},
    explain: [
      T(
        "这两个地址是芯片出厂固化的系统存储区，只读：0x1FFFF7E0 低 16 位是 KB 数，0x1FFFF7E8 起 12 字节是 UID。",
        "Both live in factory-programmed system memory and are read-only: a 16-bit KB count at 0x1FFFF7E0, twelve UID bytes at 0x1FFFF7E8."
      ),
      T(
        "读出来是 0x0040 就说明这是 64KB 的 C8T6（不是标称的 128KB），它是判断「买到什么片子」的可靠办法。",
        "A reading of 0x0040 identifies a 64 KB C8T6 rather than the advertised 128 KB — a reliable way to tell what you actually bought."
      ),
      T(
        "UID 可以做设备序列号或简单授权：每颗芯片不同且不可改，比读 Flash 里的常量可靠得多。",
        "The UID serves as a device serial or licence key: unique and immutable, far better than a constant in flash."
      )
    ],
    check: T(
      "用 __IO uint16_t* 而不是 uint16_t* 读：__IO 只是告诉编译器「每次都要真的读」，不加也通常能读到，但优化后可能被当成常量折叠。",
      "__IO marks the access as volatile so the compiler really reads it; without it, optimisation may fold the value into a constant."
    ),
    related: {
      kb: ["f103c8t6", "pin-map"],
      functions: ["std.flash.unlock", "std.flash.erasepage", "std.flash.programword"],
      workflows: ["wf.flash-param"]
    }
  }
];

export const CASE_MAP = new Map(CASES.map(c => [c.id, c]));

/* 按外设分组，供索引页筛选 */
export const CASE_BY_PERIPH = CASES.reduce((acc, c) => {
  (acc[c.p] = acc[c.p] || []).push(c);
  return acc;
}, {});
