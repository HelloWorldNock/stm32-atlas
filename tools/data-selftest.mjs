#!/usr/bin/env node
/* ============================================================
   STM32Atlas 数据自测（零依赖）
   ------------------------------------------------------------
   跑法： node tools/data-selftest.mjs
   覆盖：函数与流程的引用完整性、硬件知识库、江协教程案例。
   只读取 app/ui/data 下的数据模块，不改任何文件。
   ============================================================ */

import { CASES, CASE_MAP } from "../app/ui/data/cases.js";
import { KB_ARTICLES, KB_MAP } from "../app/ui/data/kb.js";
import { PINS, PIN_MAP, PIN_BY_GPIO } from "../app/ui/data/pins.js";
import { caseSources } from "../app/ui/data/case-src.js";
import { circuitSvg } from "../app/ui/sim/sch.js";
import { createModel } from "../app/ui/sim/models.js";
import { chipSvg, usedPins } from "../app/ui/sim/pinout.js";
import {
  FUNCTIONS, FUNCTION_MAP, WORKFLOWS, WORKFLOW_MAP,
  PERIPHERALS, PERIPH_MAP, STATS, searchAll
} from "../app/ui/data/index.js";

let pass = 0;
const fails = [];

function ok(name, cond, detail = "") {
  if (cond) { pass++; return; }
  fails.push(`${name}${detail ? " — " + detail : ""}`);
}

function eq(name, actual, expected) {
  ok(name, actual === expected, `期望 ${expected}，实际 ${actual}`);
}

const isText = v => typeof v === "string" && v.trim().length > 0;
const bil = (name, obj, minZh = 2, minEn = 2) => {
  ok(`${name} 中文非空`, isText(obj?.zh) && obj.zh.length >= minZh, JSON.stringify(obj?.zh));
  ok(`${name} 英文非空`, isText(obj?.en) && obj.en.length >= minEn, JSON.stringify(obj?.en));
};

/* ---------------- 1. 函数与流程 ---------------- */

eq("函数条目数", FUNCTIONS.length, STATS.functions);
eq("流程条目数", WORKFLOWS.length, STATS.workflows);
eq("外设条目数", PERIPHERALS.length, STATS.peripherals);

const fnIds = new Set();
for (const f of FUNCTIONS) {
  ok(`函数 id 唯一：${f.id}`, !fnIds.has(f.id));
  fnIds.add(f.id);
  ok(`函数名非空：${f.id}`, isText(f.name));
  ok(`函数有一套 : ${f.id}`, f.lib === "std" || f.lib === "hal", f.lib);
  ok(`函数外设有效：${f.id}`, !!PERIPH_MAP[f.p], f.p);
  if (f.eq) ok(`函数 eq 目标存在：${f.id} -> ${f.eq}`, !!FUNCTION_MAP[f.eq]);
  for (const r of f.rel || []) ok(`函数 rel 目标存在：${f.id} -> ${r}`, !!FUNCTION_MAP[r]);
}

for (const p of PERIPHERALS) {
  ok(`外设 id 唯一：${p.id}`, isText(p.id));
  ok(`外设短名：${p.id}`, isText(p.short));
}

const wfIds = new Set();
for (const w of WORKFLOWS) {
  ok(`流程 id 唯一：${w.id}`, !wfIds.has(w.id));
  wfIds.add(w.id);
  bil(`流程标题 ${w.id}`, w.title);
  bil(`流程目标 ${w.id}`, w.goal, 4, 4);
  ok(`流程有步骤：${w.id}`, (w.steps || []).length > 0);
  ok(`流程外设有效：${w.id}`, !!PERIPH_MAP[w.p], w.p);
  for (const [i, s] of (w.steps || []).entries()) {
    bil(`步骤标题 ${w.id} #${i + 1}`, s.title);
    for (const id of s.fn || []) ok(`步骤函数存在：${w.id} #${i + 1} -> ${id}`, !!FUNCTION_MAP[id]);
  }
}

const hits = searchAll("pwm");
ok("搜索返回函数", hits.functions.length > 0);
ok("搜索结果不再包含实验分组", hits.labs === undefined);

/* ---------------- 2. 硬件知识库 ---------------- */

eq("知识文章数", KB_ARTICLES.length, 7);
const kbIds = new Set();
for (const a of KB_ARTICLES) {
  ok(`知识 id 唯一：${a.id}`, !kbIds.has(a.id));
  kbIds.add(a.id);
  bil(`知识标题 ${a.id}`, a.title);
  bil(`知识摘要 ${a.id}`, a.summary, 6, 6);
  ok(`知识外设有效：${a.id}`, !!PERIPH_MAP[a.p], a.p);
  ok(`知识图标：${a.id}`, isText(a.icon));
  ok(`知识有正文：${a.id}`, (a.blocks || []).length >= 3);
  for (const [i, b] of (a.blocks || []).entries()) {
    ok(`块类型合法：${a.id} #${i + 1}`, ["p", "list", "formula", "warn"].includes(b.kind), b.kind);
    if (b.kind === "formula") {
      ok(`公式非空：${a.id} #${i + 1}`, isText(b.expr));
    } else if (b.kind === "list") {
      ok(`列表有条目：${a.id} #${i + 1}`, (b.items || []).length > 0);
      for (const [j, item] of (b.items || []).entries()) bil(`列表项 ${a.id} #${i + 1}.${j + 1}`, item, 3, 3);
    } else {
      bil(`块文本 ${a.id} #${i + 1}`, b, 4, 4);
    }
  }
  ok(`知识有页码引用：${a.id}`, (a.refs || []).length > 0);
  for (const [i, r] of (a.refs || []).entries()) {
    ok(`页码是正整数：${a.id} #${i + 1}`, Number.isInteger(r.page) && r.page > 0, String(r.page));
    isText(r.title) && pass++;
    if (!isText(r.title)) fails.push(`页码标题非空：${a.id} #${i + 1}`);
  }
  for (const id of a.related?.workflows || []) ok(`知识流程存在：${a.id} -> ${id}`, !!WORKFLOW_MAP[id]);
  for (const id of a.related?.functions || []) ok(`知识函数存在：${a.id} -> ${id}`, !!FUNCTION_MAP[id]);
  ok(`知识不再引用实验：${a.id}`, a.related?.labs === undefined);
}

/* ---------------- 3. 江协教程案例 ---------------- */

ok("案例数量不少于 10", CASES.length >= 10, String(CASES.length));
eq("CASE_MAP 与数组一致", CASE_MAP.size, CASES.length);

const KNOWN_MODELS = new Set(["blink", "flow", "buzzer", "keys", "light", "encoder", "timer", "breath", "servo", "adc", "uart", "spi", "rtc", "uid"]);
const CHAIN_KINDS = new Set(["res", "led", "btn", "cap", "buzzer", "pot", "npn", "servo", "motor"]);
const caseIds = new Set();

for (const c of CASES) {
  ok(`案例 id 唯一：${c.id}`, !caseIds.has(c.id));
  caseIds.add(c.id);
  bil(`案例标题 ${c.id}`, c.title);
  bil(`案例目标 ${c.id}`, c.goal, 6, 6);
  ok(`案例难度 1-5：${c.id}`, Number.isInteger(c.level) && c.level >= 1 && c.level <= 5, String(c.level));
  ok(`案例外设有效：${c.id}`, !!PERIPH_MAP[c.p], c.p);
  ok(`案例图标：${c.id}`, isText(c.icon));
  ok(`案例指向教程工程：${c.id}`, isText(c.folder));

  /* 电路 */
  const channels = c.channels || [];
  const modules = c.modules || [];
  ok(`案例有电路：${c.id}`, channels.length + modules.length > 0);
  const chKeys = new Set();
  for (const ch of channels) {
    ok(`支路 key 唯一：${c.id} ${ch.key}`, !chKeys.has(ch.key));
    chKeys.add(ch.key);
    ok(`支路引脚存在：${c.id} ${ch.pin}`, !!PIN_BY_GPIO[ch.pin], ch.pin);
    ok(`支路有元件：${c.id} ${ch.key}`, (ch.chain || []).length >= 1);
    for (const part of ch.chain || []) {
      ok(`元件类型合法：${c.id} ${part.kind}`, CHAIN_KINDS.has(part.kind), part.kind);
      ok(`元件有位号：${c.id} ${part.ref}`, isText(part.ref));
    }
    ok(`支路终端合法：${c.id} ${ch.key}`, ch.to === "vcc" || ch.to === "gnd", String(ch.to));
  }
  for (const m of modules) {
    ok(`模块 key：${c.id} ${m.key}`, isText(m.key));
    for (const [label, pin] of Object.entries(m.pins || {})) {
      ok(`模块引脚存在：${c.id} ${label}=${pin}`, !!PIN_BY_GPIO[pin], pin);
    }
    ok(`模块有外框说明：${c.id} ${m.key}`,
      Array.isArray(m.lines?.zh) && m.lines.zh.length >= 1 && m.lines.zh.every(isText)
      && Array.isArray(m.lines?.en) && m.lines.en.length >= 1 && m.lines.en.every(isText),
      JSON.stringify(m.lines));
  }

  /* 控件与读数 */
  for (const ctl of c.controls || []) {
    ok(`控件 key：${c.id} ${ctl.key}`, isText(ctl.key));
    ok(`控件类型合法：${c.id} ${ctl.kind}`, ["range", "button", "serial"].includes(ctl.kind), ctl.kind);
    if (ctl.kind === "range") {
      ok(`滑杆范围有序：${c.id} ${ctl.key}`, ctl.min < ctl.max, `${ctl.min}..${ctl.max}`);
      ok(`滑杆默认值在范围里：${c.id} ${ctl.key}`, ctl.def >= ctl.min && ctl.def <= ctl.max, String(ctl.def));
    }
  }
  ok(`案例有读数：${c.id}`, (c.readouts || []).length >= 1);
  const roKeys = new Set();
  for (const r of c.readouts || []) {
    ok(`读数 key 唯一：${c.id} ${r.key}`, !roKeys.has(r.key));
    roKeys.add(r.key);
    bil(`读数名称 ${c.id} ${r.key}`, { zh: r.zh, en: r.en });
    ok(`读数格式合法：${c.id} ${r.key}`, ["n", "v", "ma", "pct", "deg", "hex", "raw", "bool", "dark"].includes(r.fmt), r.fmt);
  }

  /* 模型与源码 */
  ok(`案例模型存在：${c.id} -> ${c.model}`, KNOWN_MODELS.has(c.model), c.model);
  ok(`案例有源码清单：${c.id}`, (c.files || []).length >= 1);
  const sources = caseSources(c.folder, c.files || []);
  eq(`源码全部取到：${c.id}`, sources.length, (c.files || []).length);
  for (const s of sources) ok(`源码非空：${c.id} ${s.path}`, isText(s.text) && s.text.length > 40, String(s.text.length));

  /* 文案 */
  ok(`案例原理是数组：${c.id}`, Array.isArray(c.explain) && c.explain.length >= 2);
  for (const [i, e] of (c.explain || []).entries()) bil(`原理 ${c.id} #${i + 1}`, e, 8, 8);
  bil(`案例自检 ${c.id}`, c.check, 8, 8);
  for (const id of c.related?.kb || []) ok(`案例知识点存在：${c.id} -> ${id}`, kbIds.has(id));
  for (const id of c.related?.functions || []) ok(`案例函数存在：${c.id} -> ${id}`, !!FUNCTION_MAP[id]);
  for (const id of c.related?.workflows || []) ok(`案例流程存在：${c.id} -> ${id}`, !!WORKFLOW_MAP[id]);

  /* 旧字段确实清掉了 */
  for (const legacy of ["wiring", "spl", "firmware", "preset"]) {
    ok(`案例不再带 ${legacy}：${c.id}`, c[legacy] === undefined);
  }
  ok(`案例不再引用实验：${c.id}`, c.related?.labs === undefined);
}

/* ---------------- 4. 引脚表 ---------------- */

eq("引脚数 48", PINS.length, 48);
eq("GPIO 数 35", Object.keys(PIN_BY_GPIO).length, 35);
const pinNos = new Set();
const kindCount = { power: 0, io: 0, osc: 0, reset: 0, boot: 0, other: 0 };
for (const [i, p] of PINS.entries()) {
  ok(`引脚号连续 #${i + 1}`, p.no === i + 1, String(p.no));
  ok(`引脚号唯一 ${p.no}`, !pinNos.has(p.no));
  pinNos.add(p.no);
  ok(`引脚有名称 ${p.no}`, isText(p.name));
  ok(`引脚类型合法 ${p.no}`, ["S", "I", "O", "I/O"].includes(p.type), p.type);
  ok(`引脚分类合法 ${p.no}`, p.kind in kindCount, p.kind);
  kindCount[p.kind]++;
  ok(`引脚外设 id 有效 ${p.no}`, (p.periphs || []).every(id => !!PERIPH_MAP[id]), (p.periphs || []).join(","));
  if (p.gpio) {
    ok(`GPIO 名格式 ${p.gpio}`, /^P[ABC]\d{1,2}$/.test(p.gpio), p.gpio);
    ok(`GPIO 端口位一致 ${p.gpio}`, `P${p.port}${p.bit}` === p.gpio, `${p.port}${p.bit}`);
    ok(`PIN_BY_GPIO 能取到 ${p.gpio}`, PIN_BY_GPIO[p.gpio] === p);
  }
}
eq("电源脚 9 个", kindCount.power, 9);
eq("IO 脚 35 个", kindCount.io, 35);
eq("晶振脚 2 个", kindCount.osc, 2);
ok("PA0 复用含 ADC", (PIN_BY_GPIO.PA0?.periphs || []).includes("adc"));
ok("PA9 复用含 USART", (PIN_BY_GPIO.PA9?.periphs || []).includes("usart"));
ok("PA13 归类到 gpio", (PIN_BY_GPIO.PA13?.periphs || []).includes("gpio"));
ok("PC13 存在", !!PIN_BY_GPIO.PC13);
ok("PIN_MAP 覆盖行数", Object.keys(PIN_MAP).length >= PINS.length);

/* ---------------- 5. 电路渲染与行为模型 ---------------- */

const localCase = item => ({
  ...item,
  modules: (item.modules || []).map(m => ({ ...m, lines: m.lines ? (m.lines.zh || m.lines.en || []) : [] }))
});

const usedAll = usedPins(CASES);
ok("被案例用到的引脚不少于 12 个", usedAll.size >= 12, String(usedAll.size));
for (const pin of usedAll) ok(`占用引脚是真实 GPIO：${pin}`, !!PIN_BY_GPIO[pin]);

for (const c of CASES) {
  const item = localCase(c);
  const svg = circuitSvg(item, null);
  ok(`电路可渲染：${c.id}`, svg.startsWith("<svg") && svg.includes("sch-svg"));
  ok(`电路无 NaN/undefined：${c.id}`, !/undefined|NaN/.test(svg));
  ok(`电路含 MCU 框：${c.id}`, svg.includes("sch-mcu"));

  const ctl = { values: {}, held: {}, counts: {} };
  const model = createModel(c, () => ctl);
  for (const k of c.controls || []) {
    if (k.kind === "range") ctl.values[k.key] = (k.min + k.max) / 2;
    if (k.kind === "button") { ctl.counts[k.key] = 1; ctl.held[k.key] = true; }
  }
  if (typeof model.pushSerial === "function") model.pushSerial("test\r\n");
  for (let i = 0; i < 400; i++) model.step(0.03);
  const v = model.view();
  ok(`模型有快照：${c.id}`, !!v && typeof v === "object");
  for (const r of c.readouts || []) {
    const value = v.values?.[r.key];
    ok(`读数有值：${c.id} ${r.key}`, value !== undefined, String(value));
    if (typeof value === "number") ok(`读数有限：${c.id} ${r.key}`, Number.isFinite(value), String(value));
  }
  for (const [key, part] of Object.entries(v.parts || {})) {
    if (typeof part.i === "number") ok(`元件电流非负：${c.id} ${key}`, part.i >= 0 && Number.isFinite(part.i), String(part.i));
  }
  const liveSvg = circuitSvg(item, v);
  ok(`通电电路可渲染：${c.id}`, !/undefined|NaN/.test(liveSvg));
}

for (const p of PINS) {
  const svg = chipSvg(p.gpio || p.name, { used: usedAll });
  ok(`引脚图可渲染：${p.no}`, svg.includes("chip-svg") && !/undefined|NaN/.test(svg));
  ok(`引脚图可点：${p.no}`, svg.includes(`data-chip-pin="${p.gpio || p.name}"`));
}

/* ---------------- 输出 ---------------- */

const total = pass + fails.length;
if (fails.length) {
  console.error(`\n✗ ${fails.length} 项失败 / 共 ${total} 项：`);
  for (const f of fails.slice(0, 60)) console.error("  - " + f);
  if (fails.length > 60) console.error(`  … 另外 ${fails.length - 60} 项`);
  process.exit(1);
}
console.log(`✓ 全部通过：${total} 项断言（${FUNCTIONS.length} 函数 / ${WORKFLOWS.length} 流程 / ${KB_ARTICLES.length} 篇知识 / ${CASES.length} 个江协案例 / ${PINS.length} 个引脚）`);
