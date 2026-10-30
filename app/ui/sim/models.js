/* ============================================================
   案例行为模型
   ------------------------------------------------------------
   每个模型复现一个教程工程在硬件上“看得见的效果”：引脚电平、
   流过元件的电流、PWM 占空比、OLED 上显示的内容、串口收发。
   这些行为按教程源码的时序写：延时、周期、比较值都取源码里的
   实际数值，改动这里的常量就等于改动“硬件反应”。

   模型接口：
     const m = createModel(item, getControls)
     m.reset()
     m.step(dt)        // dt 单位秒（虚拟时间）
     m.view()          // 快照，见文件末尾字段说明
     m.pushSerial(t)   // 串口模型（仅 uart 类）
   ============================================================ */

import { PINS, PIN_BY_GPIO } from "../data/pins.js";

export const VDD = 3.3;
export const VF_LED = 1.8;      /* 红色 LED 正向压降，教程用红色 LED */
const R_ON = 25;                /* 引脚导通内阻 */
const V_OL = 0.1;               /* 输出低电平残余压降 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const num = v => Math.round(v * 1000) / 1000;

/** 一条「3V3 → 电阻 → LED → 引脚」支路的电流（低电平点亮） */
export function ledCurrent(rOhm) {
  return Math.max(0, (VDD - VF_LED - V_OL) / (rOhm + R_ON));
}

/** 引脚模式/电平 → 快照里的 pin 记录 */
function pinState(mode, level, v) {
  return { mode, level, v: Math.round(v * 100) / 100 };
}

const HIGH = VDD, LOW = 0;

/* 模型没主动报告的引脚，按电路常识补一个空闲电平：
   按键支路是上拉输入（空闲高），OLED 的软 I²C 两根线空闲也是高。
   这样原理图上每个连了线的引脚都有电压，不会留空白。 */
function idlePins(item) {
  const out = {};
  for (const ch of item.channels || []) {
    if ((ch.chain || []).some(p => p.kind === "btn")) out[ch.pin] = pinState("in_up", "high", HIGH);
  }
  for (const m of item.modules || []) {
    const title = `${m.key || ""} ${m.ref || ""}`;
    if (!/OLED/i.test(title)) continue;
    const pins = m.pins || {};
    for (const name of ["SCL", "SDA"]) {
      if (pins[name]) out[pins[name]] = pinState("af_od", "high", HIGH);
    }
  }
  return out;
}

export function createModel(item, getControls) {
  const controls = () => (getControls ? getControls() : { values: {}, held: {}, counts: {} });
  const base = MODELS[item.model] ? MODELS[item.model](item, controls) : IDLE(item);
  const idle = idlePins(item);
  const view = base.view.bind(base);
  return {
    ...base,
    view() {
      const snap = view() || {};
      snap.pins = { ...idle, ...(snap.pins || {}) };
      return snap;
    }
  };
}

function IDLE(item) {
  return { reset() {}, step() {}, view: () => ({ pins: {}, parts: {}, values: {}, screen: null }) };
}

/* ---------- 通用：输出引脚驱动 LED 的通断 ---------- */
function ledPart(key, rOhm, on) {
  const i = on ? ledCurrent(rOhm) : 0;
  return { [key]: { on, i: num(i), glow: on ? 1 : 0 } };
}

const MODELS = {
  /* 3-1 LED 闪烁：三种写法轮流，每种 500ms 低 + 500ms 高 */
  blink(item, controls) {
    const R = item.opts?.r ?? 330;
    const stepMs = 500;
    let t = 0;
    let phase = 0;
    return {
      reset() { t = 0; phase = 0; },
      step(dt) {
        t += dt;
        phase = Math.floor(t / (stepMs / 1000)) % 6;
      },
      view() {
        const low = phase % 2 === 0;               /* 偶数步 = 低电平 = 点亮 */
        const method = Math.floor(phase / 2) + 1;  /* 1/2/3 = 三种写法 */
        return {
          pins: { PA0: pinState("out_pp", low ? "low" : "high", low ? V_OL : HIGH) },
          parts: ledPart("D1", R, low),
          values: {
            current: num((low ? ledCurrent(R) : 0) * 1000),
            method,
            phase
          },
          screen: null
        };
      }
    };
  },

  /* 3-2 LED 流水灯：GPIO_Write(~(1<<i))，PA0..PA7 逐个拉低 100ms */
  flow(item, controls) {
    const R = item.opts?.r ?? 330;
    const pins = ["PA0", "PA1", "PA2", "PA3", "PA4", "PA5", "PA6", "PA7"];
    let t = 0;
    return {
      reset() { t = 0; },
      step(dt) { t += dt; },
      view() {
        const idx = Math.floor(t / 0.1) % pins.length;
        const p = {};
        const parts = {};
        pins.forEach((pin, i) => {
          const low = i === idx;
          p[pin] = pinState("out_pp", low ? "low" : "high", low ? V_OL : HIGH);
          parts[`D${i + 1}`] = { on: low, i: num(low ? ledCurrent(R) : 0), glow: low ? 1 : 0 };
        });
        return {
          pins: p, parts,
          values: {
            /** 当前点亮的位号（0 起） */
            index: idx,
            word: (0x00ff & ~(1 << idx)),
            current: num(ledCurrent(R) * 1000)
          },
          screen: null
        };
      }
    };
  },

  /* 3-3 蜂鸣器：低电平响，节奏 100/100/100/700ms（源码四种延时） */
  buzzer(item, controls) {
    const pattern = [0.1, 0.1, 0.1, 0.7];
    const cycle = pattern.reduce((a, b) => a + b, 0);
    const onAt = time => {
      let x = time % cycle;
      for (let i = 0; i < pattern.length; i += 1) {
        if (x < pattern[i]) return i % 2 === 0;
        x -= pattern[i];
      }
      return false;
    };
    let t = 0;
    let beeps = 0;
    let prev = false;
    return {
      reset() { t = 0; beeps = 0; prev = false; },
      step(dt) {
        t += dt;
        const on = onAt(t);
        if (on && !prev) beeps += 1;
        prev = on;
      },
      view() {
        const on = onAt(t);
        return {
          pins: { PB12: pinState("out_pp", on ? "low" : "high", on ? V_OL : HIGH) },
          parts: { BZ1: { on, drive: on ? 1 : 0 } },
          values: { on: on ? 1 : 0, beeps, freq: 2400 },
          screen: null
        };
      }
    };
  },

  /* 3-4 按键控制 LED：PB1/PB11 上拉输入，按下为低；LED1/2 各翻一次 */
  keys(item, controls) {
    const R = item.opts?.r ?? 330;
    const counts = { l1: 0, l2: 0 };
    let seen1 = 0, seen2 = 0;
    let on1 = false, on2 = false;
    return {
      reset() { counts.l1 = 0; counts.l2 = 0; seen1 = 0; seen2 = 0; on1 = false; on2 = false; },
      step() {
        const c = controls();
        const n1 = c.counts?.key1 || 0;
        const n2 = c.counts?.key2 || 0;
        if (n1 !== seen1) { on1 = !on1; seen1 = n1; counts.l1 += 1; }
        if (n2 !== seen2) { on2 = !on2; seen2 = n2; counts.l2 += 1; }
      },
      view() {
        const c = controls();
        const k1 = !!c.held?.key1;
        const k2 = !!c.held?.key2;
        const parts = {
          K1: { pressed: k1 },
          K2: { pressed: k2 },
          D1: { on: on1, i: num(on1 ? ledCurrent(R) : 0), glow: on1 ? 1 : 0 },
          D2: { on: on2, i: num(on2 ? ledCurrent(R) : 0), glow: on2 ? 1 : 0 }
        };
        return {
          pins: {
            PB1: pinState("in_up", k1 ? "low" : "high", k1 ? V_OL : HIGH),
            PB11: pinState("in_up", k2 ? "low" : "high", k2 ? V_OL : HIGH),
            PA1: pinState("out_pp", on1 ? "low" : "high", on1 ? V_OL : HIGH),
            PA2: pinState("out_pp", on2 ? "low" : "high", on2 ? V_OL : HIGH)
          },
          parts,
          values: {
            key1: k1 ? 1 : 0,
            key2: k2 ? 1 : 0,
            led1: on1 ? 1 : 0,
            led2: on2 ? 1 : 0,
            current: num((on1 ? ledCurrent(R) : 0) * 1000)
          },
          screen: null
        };
      }
    };
  },

  /* 3-5 光敏控制蜂鸣器：DO 输出 1（暗）→ 响 */
  light(item, controls) {
    const threshold = item.opts?.threshold ?? 30;
    return {
      reset() {},
      step() {},
      view() {
        const light = controls().values?.light ?? 80;
        const dark = light < threshold;
        return {
          pins: {
            PB13: pinState("in_up", dark ? "high" : "low", dark ? HIGH : V_OL),
            PB12: pinState("out_pp", dark ? "low" : "high", dark ? V_OL : HIGH)
          },
          parts: { LS1: { on: !dark }, BZ1: { on: dark, drive: dark ? 1 : 0 } },
          values: { light, dark: dark ? 1 : 0, beep: dark ? 1 : 0 },
          screen: null
        };
      }
    };
  },

  /* 5-2 旋转编码器：每“格”±1，OLED 显示带符号数 */
  encoder(item, controls) {
    let num = 0;
    let seen = { up: 0, down: 0 };
    return {
      reset() { num = 0; seen = { up: 0, down: 0 }; },
      step() {
        const c = controls();
        const up = c.counts?.up || 0;
        const down = c.counts?.down || 0;
        num += (up - seen.up) - (down - seen.down);
        seen = { up, down };
      },
      view() {
        return {
          pins: {
            PB0: pinState("in_up", (num & 1) ? "low" : "high", (num & 1) ? V_OL : HIGH),
            PB1: pinState("in_up", (num & 2) ? "low" : "high", (num & 2) ? V_OL : HIGH)
          },
          parts: { ENC1: { angle: num * 18 } },
          values: { num },
          screen: { lines: [`Num:${String(num).padStart(5, " ")}`] }
        };
      }
    };
  },

  /* 6-1 定时器定时中断：TIM2 每 1 s 进一次中断，Num 自增 */
  timer(item, controls) {
    const period = item.opts?.period ?? 1.0;   /* PSC=7200-1, ARR=10000-1 → 1 s */
    let t = 0;
    let num = 0;
    let ticks = 0;
    return {
      reset() { t = 0; num = 0; ticks = 0; },
      step(dt) {
        t += dt;
        const next = Math.floor(t / period);
        if (next > ticks) { num += next - ticks; ticks = next; }
      },
      view() {
        const phase = (t % period) / period;
        return {
          pins: { PA0: pinState("out_pp", phase < 0.5 ? "low" : "high", phase < 0.5 ? V_OL : HIGH) },
          parts: {},
          values: { num, ticks, period: Math.round(period * 1000), phase: Math.round(phase * 100) / 100 },
          screen: { lines: [`Num:${String(num).padStart(5, " ")}`] }
        };
      }
    };
  },

  /* 6-3 PWM 呼吸灯：CCR 0→100→0，每级 10 ms，ARR=100 */
  breath(item, controls) {
    const R = item.opts?.r ?? 330;
    const arr = 100;
    let t = 0;
    return {
      reset() { t = 0; },
      step(dt) { t += dt; },
      view() {
        /* 上升 1.01 s + 下降 1.01 s 为一个来回 */
        const span = (arr + 1) * 0.01;
        const x = t % (span * 2);
        const ccr = x < span ? Math.floor(x / 0.01) : Math.floor((span * 2 - x) / 0.01);
        /* 低电平点亮：占空比 = 高电平比例，亮度 = 低电平比例 = 1 - 占空比 */
        const bright = (arr - ccr) / (arr + 1);
        const duty = ccr / (arr + 1);
        return {
          pins: { PA0: pinState("af_pp", "pwm", HIGH * duty) },
          parts: {
            D1: { on: bright > 0.02, glow: bright, i: num(ledCurrent(R) * bright) }
          },
          values: {
            ccr,
            arr,
            duty: num(duty * 100),
            brightness: num(bright * 100),
            current: num(ledCurrent(R) * bright * 1000),
            freq: 1000
          },
          screen: {
            lines: [
              `Bright:${String(Math.round(bright * 100)).padStart(3, " ")}%`,
              `CCR :${String(ccr).padStart(5, " ")}`
            ]
          }
        };
      }
    };
  },

  /* 6-4 舵机：PA1 50 Hz，CCR = Angle/180*2000+500，按键 1 每次 +30° */
  servo(item, controls) {
    const arr = 20000;
    const psc = 72;
    const clk = 72e6;
    const freq = clk / psc / arr;
    let angle = 0;
    let seen = 0;
    let t = 0;
    return {
      reset() { angle = 0; seen = 0; t = 0; },
      step(dt) {
        t += dt;
        const n = controls().counts?.key1 || 0;
        if (n !== seen) {
          const steps = n - seen;
          angle = (angle + 30 * steps) % 180;
          if (angle < 0) angle += 180;
          seen = n;
        }
      },
      view() {
        const ccr = Math.round(angle / 180 * 2000 + 500);
        /* 计数器时钟 = 72MHz / 72 = 1MHz，1 个计数就是 1µs，所以 CCR 即脉宽微秒数 */
        const pulseUs = ccr;
        return {
          pins: { PA1: pinState("af_pp", "pwm", HIGH * (ccr / arr)) },
          parts: { M1: { kind: "servo", angle } },
          values: {
            angle: num(angle),
            ccr,
            pulse: num(pulseUs),
            freq: num(freq),
            duty: num(ccr / arr * 100)
          },
          screen: { lines: [`Angle:${String(Math.round(angle)).padStart(3, " ")}`] }
        };
      }
    };
  },

  /* 7-1 AD 单通道：PA0 采样电位器分压，4095 满量程，循环 100 ms */
  adc(item, controls) {
    let t = 0;
    return {
      reset() { t = 0; },
      step(dt) { t += dt; },
      view() {
        const pos = (controls().values?.pot ?? 50) / 100;
        const v = VDD * pos;
        const code = Math.round(v / VDD * 4095);
        /* AD.c 里用的是 PA0 = ADC_Channel_0，采样周期 55.5 */
        return {
          pins: { PA0: pinState("ain", "analog", v) },
          parts: { RV1: { pos, value: v } },
          values: {
            code,
            voltage: num(v),
            volt100: num(v * 100)
          },
          screen: {
            lines: [
              `ADValue:${String(code).padStart(4, " ")}`,
              `Voltage:${(v).toFixed(2)}V`
            ]
          }
        };
      }
    };
  },

  /* 9-2 串口发送+接收：收到的字节原样回传，并在 OLED 上显示十六进制 */
  uart(item, controls) {
    const baud = item.opts?.baud ?? 9600;
    let t = 0;
    let last = 0;
    const log = [];
    const bits = v => `0x${v.toString(16).toUpperCase().padStart(2, "0")}`;
    return {
      reset() { t = 0; last = 0; log.length = 0; },
      step(dt) { t += dt; },
      pushSerial(text) {
        for (const ch of String(text)) {
          const code = ch.charCodeAt(0) & 0xff;
          last = code;
          log.push({ dir: "in", text: ch, code, t: num(t) });
          log.push({ dir: "out", text: ch, code, t: num(t) });
        }
        if (log.length > 120) log.splice(0, log.length - 120);
      },
      view() {
        return {
          pins: {
            PA9: pinState("af_pp", "idle", HIGH),
            PA10: pinState("in_float", "idle", HIGH)
          },
          parts: { U1: { on: log.length > 0 } },
          values: {
            baud,
            rx: last,
            rxHex: bits(last),
            frames: log.filter(l => l.dir === "in").length,
            bitTime: num(1e6 / baud)
          },
          screen: { lines: [`RxData:${bits(last)}`] },
          log: log.slice(-40)
        };
      }
    };
  },

  /* 11-1 软件 SPI 读写 W25Q64：读 ID → 擦扇区 → 写 4 字节 → 读回 */
  spi(item, controls) {
    const MID = 0xef, DID = 0x4017;
    let step = 0;   /* 0 读ID 1 擦除 2 写入 3 读回 */
    let t = 0;
    const written = [0x01, 0x02, 0x03, 0x04];
    const read = [0x01, 0x02, 0x03, 0x04];
    return {
      reset() { step = 0; t = 0; },
      step(dt) {
        t += dt;
        if (step === 0 && t > 0.4) step = 1;
        else if (step === 1 && t > 0.9) step = 2;
        else if (step === 2 && t > 1.4) step = 3;
      },
      view() {
        const hex = arr => arr.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
        const busy = step < 3;
        return {
          pins: {
            PA4: pinState("out_pp", busy ? "low" : "high", busy ? V_OL : HIGH),
            PA5: pinState("af_pp", busy ? "pwm" : "high", HIGH * 0.5),
            PA6: pinState("in_float", "high", HIGH),
            PA7: pinState("out_pp", busy ? "pwm" : "high", HIGH * 0.5)
          },
          parts: { U2: { on: true, lines: [`MID:${MID.toString(16).toUpperCase()}`, `DID:${DID.toString(16).toUpperCase()}`, step >= 2 ? "W:" + hex(written) : "", step >= 3 ? "R:" + hex(read) : ""] } },
          values: {
            mid: "0x" + MID.toString(16).toUpperCase(),
            did: "0x" + DID.toString(16).toUpperCase(),
            step,
            written: hex(written),
            read: hex(read)
          },
          screen: {
            lines: [
              `MID:${MID.toString(16).toUpperCase()}   DID:${DID.toString(16).toUpperCase()}`,
              `W:${hex(written)}`,
              step >= 3 ? `R:${hex(read)}` : "R:-- -- -- --"
            ]
          }
        };
      }
    };
  },

  /* 12-2 实时时钟：上电把 RTC 设成 2026-10-30 12:00:00，之后按秒走，CNT/DIV 同步 */
  rtc(item, controls) {
    const start = Date.UTC(2026, 9, 30, 12, 0, 0) / 1000;   /* 上电时 RTC 被设成 2026-10-30 12:00 */
    let t = 0;
    return {
      reset() { t = 0; },
      step(dt) { t += dt; },
      view() {
        const whole = Math.floor(t);
        const div = Math.round((t - whole) * 32768);
        const d = new Date((start + whole) * 1000);
        const p = (v, n = 2) => String(v).padStart(n, "0");
        return {
          pins: { PC13: pinState("out_od", whole % 2 ? "high" : "low", whole % 2 ? HIGH : V_OL) },
          parts: {},
          values: {
            counter: whole,
            divider: div,
            time: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`,
            date: `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
          },
          screen: {
            lines: [
              `Date:${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`,
              `Time:${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`,
              `CNT :${whole}`,
              `DIV :${div}`
            ]
          }
        };
      }
    };
  },

  /* 15-2 读取芯片 ID：容量寄存器 0x1FFFF7E0 与 96 位唯一 ID */
  uid() {
    const size = 0x0040;             /* C8T6 = 64 KB Flash，读出来是 0x0040＝64 */
    const uid = [0x0037, 0x4142, 0x3235, 0x3834, 0x3230, 0x3231];
    return {
      reset() {},
      step() {},
      view() {
        const hex = (v, n) => v.toString(16).toUpperCase().padStart(n, "0");
        const lines = [0, 1, 2].map(i => hex(uid[i], 8) + " " + hex(uid[i + 3] ?? 0, 8));
        return {
          pins: {},
          parts: {},
          values: {
            flash: size,
            uid: uid.map(u => hex(u, 4)).join(" ")
          },
          screen: {
            lines: [
              `F_SIZE:${hex(size, 4)}`,
              `U_ID:${hex(uid[0], 4)}${hex(uid[1], 4)}`,
              hex(uid[2], 8) + " " + hex(uid[3], 8),
              hex(uid[4], 8) + " " + hex(uid[5], 8)
            ]
          }
        };
      }
    };
  }
};

/* 供 selftest 与案例页校验：模型里出现的引脚必须是真实引脚 */
export function modelPins(item) {
  const m = createModel(item, () => ({ values: {}, held: {}, counts: {} }));
  return Object.keys(m.view().pins || {}).filter(p => PIN_BY_GPIO[p]);
}

export { PINS };
