/* ============================================================
   电路图渲染（行网格布局）
   ------------------------------------------------------------
   每个案例用“行”描述电路：一行 = 一个 MCU 引脚引出的一条支路，
   支路上按顺序串元件，末端接 VCC 或 GND。多引脚模块（OLED /
   W25Q64 / 舵机）画成跨多行的方块，引脚对齐各自的行。
   这样同一个渲染器能把 14 个案例画成统一的风格，不需要为每个
   案例手写坐标。
   ============================================================ */

export const LAYOUT = {
  W: 720,
  top: 30,
  rowH: 62,
  mcuX: 20,
  mcuW: 132,
  stub: 46,
  partW: 62,
  partGap: 20,
  railW: 46,
  boxX: 452,
  boxPad: 16
};

const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

const n = v => Math.round(v * 10) / 10;

/* ---------- 元件符号 ---------- */

/* 电阻：锯齿线，label 在下方，value 在上方 */
function drawRes(cx, cy, part) {
  const x0 = cx - 26, x1 = cx + 26, w = 8, teeth = 6;
  const step = (x1 - x0) / (teeth + 1);
  let d = `M ${x0} ${cy}`;
  for (let i = 0; i < teeth; i += 1) {
    const x = x0 + step * (i + 0.5);
    d += ` L ${x} ${cy + (i % 2 ? -w : w)}`;
  }
  d += ` L ${x1} ${cy}`;
  return {
    body: `<path class="sch-res" d="${d}" />`,
    labels: [
      part.value ? `<text class="sch-val" x="${cx}" y="${cy - 15}" text-anchor="middle">${esc(part.value)}</text>` : "",
      part.ref ? `<text class="sch-ref" x="${cx}" y="${cy + 22}" text-anchor="middle">${esc(part.ref)}</text>` : ""
    ].join("")
  };
}

/* 发光二极管：三角 + 竖线 + 两道光；默认正极在左（a），dir:"rev" 时镜像 */
function drawLed(cx, cy, part, live) {
  const on = part.on;
  const glow = part.glow ?? (on ? 1 : 0);
  const size = 13;
  const body = `
    <g class="sch-led ${on ? "is-on" : ""}" style="--glow:${n(glow)}"${part.dir === "rev" ? ` transform="translate(${cx * 2} 0) scale(-1 1)"` : ""}>
      <path class="sch-led__tri" d="M ${cx - size} ${cy - size} L ${cx - size} ${cy + size} L ${cx + size} ${cy} Z" />
      <line class="sch-led__bar" x1="${cx + size}" y1="${cy - size}" x2="${cx + size}" y2="${cy + size}" />
      <path class="sch-led__ray" d="M ${cx + 2} ${cy - 18} L ${cx + 12} ${cy - 26} M ${cx + 10} ${cy - 12} L ${cx + 20} ${cy - 20}" />
      ${on ? `<circle class="sch-led__halo" cx="${cx + 2}" cy="${cy}" r="${n(13 + 7 * glow)}" style="opacity:${n(0.08 + 0.22 * glow)}" />` : ""}
    </g>`;
  return {
    body,
    labels: [
      part.value ? `<text class="sch-val" x="${cx}" y="${cy - 15}">${esc(part.value)}</text>` : "",
      part.ref ? `<text class="sch-ref" x="${cx}" y="${cy + 28}" text-anchor="middle">${esc(part.ref)}</text>` : ""
    ].join("")
  };
}

/* 按键：两个端子 + 可动横杆 */
function drawBtn(cx, cy, part) {
  const pressed = !!part.pressed;
  const bar = pressed ? cy - 3 : cy - 9;
  return {
    body: `
      <g class="sch-btn ${pressed ? "is-down" : ""}">
        <line class="sch-btn__contact" x1="${cx - 20}" y1="${cy}" x2="${cx - 10}" y2="${cy}" />
        <line class="sch-btn__contact" x1="${cx + 10}" y1="${cy}" x2="${cx + 20}" y2="${cy}" />
        <circle class="sch-dot" cx="${cx - 10}" cy="${cy}" r="2.4" />
        <circle class="sch-dot" cx="${cx + 10}" cy="${cy}" r="2.4" />
        <line class="sch-btn__bar" x1="${cx - 14}" y1="${bar}" x2="${cx + 14}" y2="${bar}" />
        <line class="sch-btn__stem" x1="${cx}" y1="${bar}" x2="${cx}" y2="${bar - 10}" />
      </g>`,
    labels: part.ref ? `<text class="sch-ref" x="${cx}" y="${cy + 26}" text-anchor="middle">${esc(part.ref)}</text>` : ""
  };
}

/* 蜂鸣器：碗形 + 声波弧（响的时候闪） */
function drawBuzzer(cx, cy, part) {
  const on = !!part.on;
  const arcs = [9, 15, 21].map((r, i) => `<path class="sch-buz__arc" d="M ${cx + 8} ${cy - r * 0.6} A ${r} ${r} 0 0 1 ${cx + 8} ${cy + r * 0.6}" style="--d:${i * 0.18}s" />`).join("");
  return {
    body: `
      <g class="sch-buz ${on ? "is-on" : ""}">
        <path class="sch-buz__body" d="M ${cx - 16} ${cy - 16} L ${cx - 16} ${cy + 16} L ${cx + 6} ${cy + 10} L ${cx + 6} ${cy - 10} Z" />
        ${on ? arcs : ""}
      </g>`,
    labels: [
      part.value ? `<text class="sch-val" x="${cx}" y="${cy - 24}">${esc(part.value)}</text>` : "",
      part.ref ? `<text class="sch-ref" x="${cx}" y="${cy + 30}" text-anchor="middle">${esc(part.ref)}</text>` : ""
    ].join("")
  };
}

/* 电位器：电阻 + 抽头箭头 */
function drawPot(cx, cy, part) {
  const pos = part.pos ?? 0.5;
  const ax = cx - 22 + 44 * pos;
  return {
    body: `
      <g class="sch-pot">
        <path class="sch-res" d="M ${cx - 22} ${cy} L ${cx - 16} ${cy - 8} L ${cx - 8} ${cy + 8} L ${cx} ${cy - 8} L ${cx + 8} ${cy + 8} L ${cx + 16} ${cy - 8} L ${cx + 22} ${cy}" />
        <line class="sch-pot__wiper" x1="${ax}" y1="${cy - 26}" x2="${ax}" y2="${cy - 8}" />
        <path class="sch-pot__tip" d="M ${ax - 4} ${cy - 12} L ${ax + 4} ${cy - 12} L ${ax} ${cy - 5} Z" />
      </g>`,
    labels: [
      part.value ? `<text class="sch-val" x="${cx}" y="${cy - 32}">${esc(part.value)}</text>` : "",
      part.ref ? `<text class="sch-ref" x="${cx}" y="${cy + 24}" text-anchor="middle">${esc(part.ref)}</text>` : ""
    ].join("")
  };
}

/* 舵机 / 电机：方块 + 输出轴 */
function drawActuator(cx, cy, part) {
  const angle = part.angle ?? 0;
  const spin = part.spin ?? 0;
  const isServo = part.kind === "servo";
  const rot = isServo ? angle - 90 : spin;
  return {
    body: `
      <g class="sch-act">
        <rect class="sch-act__body" x="${cx - 26}" y="${cy - 16}" width="52" height="32" rx="5" />
        <line class="sch-act__shaft" x1="${cx}" y1="${cy}" x2="${cx + Math.cos(rot * Math.PI / 180) * 20}" y2="${cy + Math.sin(rot * Math.PI / 180) * 20}" />
        ${isServo ? `<text class="sch-act__val" x="${cx}" y="${cy + 30}" text-anchor="middle">${Math.round(angle)}°</text>` : ""}
      </g>`,
    labels: part.ref ? `<text class="sch-ref" x="${cx}" y="${cy - 24}" text-anchor="middle">${esc(part.ref)}</text>` : ""
  };
}

/* 三极管：圆圈 + 基极竖条 + 集电极/发射极 */
function drawNpn(cx, cy, part) {
  const on = !!part.on;
  return {
    body: `
      <g class="sch-npn ${on ? "is-on" : ""}">
        <circle class="sch-npn__ring" cx="${cx}" cy="${cy}" r="18" />
        <line class="sch-npn__base" x1="${cx - 8}" y1="${cy - 11}" x2="${cx - 8}" y2="${cy + 11}" />
        <line class="sch-npn__lead" x1="${cx - 8}" y1="${cy}" x2="${cx - 22}" y2="${cy}" />
        <line class="sch-npn__lead" x1="${cx - 8}" y1="${cy - 6}" x2="${cx + 10}" y2="${cy - 18}" />
        <line class="sch-npn__lead" x1="${cx - 8}" y1="${cy + 6}" x2="${cx + 10}" y2="${cy + 18}" />
        <path class="sch-npn__arrow" d="M ${cx + 3} ${cy + 12} L ${cx + 10} ${cy + 18} L ${cx + 1} ${cy + 19} Z" />
      </g>`,
    labels: part.ref ? `<text class="sch-ref" x="${cx + 26}" y="${cy - 20}">${esc(part.ref)}</text>` : ""
  };
}

/* 电容 */
function drawCap(cx, cy, part) {
  return {
    body: `<g class="sch-cap"><line class="sch-lead" x1="${cx - 20}" y1="${cy}" x2="${cx - 4}" y2="${cy}" />
      <line class="sch-cap__plate" x1="${cx - 4}" y1="${cy - 12}" x2="${cx - 4}" y2="${cy + 12}" />
      <line class="sch-cap__plate" x1="${cx + 4}" y1="${cy - 12}" x2="${cx + 4}" y2="${cy + 12}" />
      <line class="sch-lead" x1="${cx + 4}" y1="${cy}" x2="${cx + 20}" y2="${cy}" /></g>`,
    labels: part.ref ? `<text class="sch-ref" x="${cx}" y="${cy + 26}" text-anchor="middle">${esc(part.ref)}</text>` : ""
  };
}

/* 通用方块模块（OLED / W25Q64 / 电源模块…）：引脚在左侧，与行对齐 */
function drawModuleBox(box, pins, part) {
  const rawLines = part.lines;
  const lineArr = Array.isArray(rawLines) ? rawLines : (rawLines ? (rawLines.zh || rawLines.en || []) : []);
  const textTop = Math.max(box.y + 26, box.y + (box.h - lineArr.length * 16) / 2 + 12);
  const lines = lineArr.map((line, i) =>
    `<text class="sch-box__line" x="${box.x + 14}" y="${textTop + i * 16}">${esc(line)}</text>`).join("");
  const pinRows = pins.map(p =>
    `<text class="sch-box__pin" x="${box.x - 12}" y="${p.y - 6}" text-anchor="end">${esc(p.label)}</text>`).join("");
  return `
    <g class="sch-box ${part.on ? "is-on" : ""}">
      <rect class="sch-box__rect" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="9" />
      <text class="sch-box__title" x="${box.x + 14}" y="${box.y - 9}">${esc(part.ref || "")}</text>
      ${pinRows}${lines}
    </g>`;
}

/* 模块方块需要的行文本数（用于算高度） */
function moduleLineCount(m) {
  const raw = m.lines;
  const arr = Array.isArray(raw) ? raw : (raw ? (raw.zh || raw.en || []) : []);
  return arr.length;
}

/* ---------- 主渲染 ---------- */

const RAILS = {
  gnd: { label: "GND", cls: "is-gnd" },
  vcc: { label: "3V3", cls: "is-vcc" },
  vbus: { label: "5V", cls: "is-vcc" }
};

function railGlyph(x, y, kind) {
  const rail = RAILS[kind] || RAILS.gnd;
  if (rail.cls === "is-gnd") {
    return `<g class="sch-rail is-gnd">
      <line class="sch-lead" x1="${x - 18}" y1="${y}" x2="${x}" y2="${y}" />
      <line class="sch-gnd__b1" x1="${x}" y1="${y}" x2="${x}" y2="${y + 6}" />
      <line class="sch-gnd__b1" x1="${x - 11}" y1="${y + 6}" x2="${x + 11}" y2="${y + 6}" />
      <line class="sch-gnd__b2" x1="${x - 7}" y1="${y + 11}" x2="${x + 7}" y2="${y + 11}" />
      <line class="sch-gnd__b3" x1="${x - 3}" y1="${y + 16}" x2="${x + 3}" y2="${y + 16}" />
      <text class="sch-rail__label" x="${x}" y="${y + 29}" text-anchor="middle">GND</text></g>`;
  }
  return `<g class="sch-rail is-vcc">
    <line class="sch-lead" x1="${x - 18}" y1="${y}" x2="${x}" y2="${y}" />
    <line class="sch-vcc__bar" x1="${x - 10}" y1="${y - 6}" x2="${x + 10}" y2="${y - 6}" />
    <line class="sch-vcc__bar" x1="${x}" y1="${y}" x2="${x}" y2="${y - 6}" />
    <text class="sch-rail__label" x="${x}" y="${y - 12}" text-anchor="middle">${rail.label}</text></g>`;
}

/* 竖直方向的电源 / 地符号（分压支路用） */
function vccGlyphUp(x, y) {
  return `<g class="sch-rail is-vcc">
    <line class="sch-lead" x1="${x}" y1="${y}" x2="${x}" y2="${y - 8}" />
    <line class="sch-vcc__bar" x1="${x - 10}" y1="${y - 8}" x2="${x + 10}" y2="${y - 8}" />
    <text class="sch-rail__label" x="${x}" y="${y - 14}" text-anchor="middle">3V3</text></g>`;
}

function gndGlyphDown(x, y) {
  return `<g class="sch-rail is-gnd">
    <line class="sch-lead" x1="${x}" y1="${y}" x2="${x}" y2="${y + 4}" />
    <line class="sch-gnd__b1" x1="${x - 11}" y1="${y + 4}" x2="${x + 11}" y2="${y + 4}" />
    <line class="sch-gnd__b2" x1="${x - 7}" y1="${y + 9}" x2="${x + 7}" y2="${y + 9}" />
    <line class="sch-gnd__b3" x1="${x - 3}" y1="${y + 14}" x2="${x + 3}" y2="${y + 14}" />
    <text class="sch-rail__label" x="${x}" y="${y + 27}" text-anchor="middle">GND</text></g>`;
}

/* 分压支路：电位器竖接在 3V3 与 GND 之间，抽头接回引脚 */
function drawDivider(startX, x, y, ch, live) {
  const part = ch.chain[0];
  const live2 = { ...part, ...(live?.parts?.[part.key] || {}) };
  const pos = Math.min(1, Math.max(0, live2.pos ?? 0.5));
  const half = 26;
  const topY = y - 46;
  const botY = y + 46;
  const wiperY = y - half + 2 * half * pos;
  const teeth = 6;
  const step = (2 * half) / (teeth + 1);
  let zig = `M ${x} ${y - half}`;
  for (let i = 0; i < teeth; i += 1) {
    const yy = y - half + step * (i + 0.5);
    zig += ` L ${x + (i % 2 ? -8 : 8)} ${yy}`;
  }
  zig += ` L ${x} ${y + half}`;
  const body = `
    <line class="sch-lead" x1="${startX}" y1="${y}" x2="${x - 40}" y2="${y}" />
    <line class="sch-lead" x1="${x - 40}" y1="${y}" x2="${x - 40}" y2="${wiperY}" />
    <line class="sch-lead" x1="${x - 40}" y1="${wiperY}" x2="${x - 16}" y2="${wiperY}" />
    <line class="sch-lead" x1="${x}" y1="${topY}" x2="${x}" y2="${y - half}" />
    <line class="sch-lead" x1="${x}" y1="${y + half}" x2="${x}" y2="${botY}" />
    <path class="sch-res" d="${zig}" />
    <line class="sch-pot__wiper" x1="${x - 14}" y1="${wiperY}" x2="${x - 4}" y2="${wiperY}" />
    <path class="sch-pot__tip" d="M ${x - 9} ${wiperY - 4} L ${x - 2} ${wiperY} L ${x - 9} ${wiperY + 4} Z" />
    <circle class="sch-dot" cx="${x}" cy="${wiperY}" r="2.2" />
    ${vccGlyphUp(x, topY)}
    ${gndGlyphDown(x, botY)}
    <text class="sch-ref" x="${x + 16}" y="${y - 2}">${esc(part.ref || "")}</text>
    <text class="sch-val" x="${x + 16}" y="${y + 14}">${esc(part.value || "")}</text>`;
  return body;
}

/* 每个元件符号的「视觉半宽」——导线只画到符号边缘，避免穿过图形 */
const HALF_WIDTH = {
  res: 26, led: 13, btn: 20, buzzer: 16, pot: 22, npn: 18, cap: 20, servo: 26, motor: 26
};

/* 串联支路：返回 {body, endX} */
function drawChain(chain, startX, y, live, firstCls = "") {
  let x = startX;
  let body = "";
  chain.forEach((part, i) => {
    const w = part.w || LAYOUT.partW;
    const cx = x + w / 2;
    const hw = HALF_WIDTH[part.kind] ?? 24;
    body += `<line class="sch-lead ${i === 0 ? firstCls : ""}" x1="${x}" y1="${y}" x2="${cx - hw}" y2="${y}" />`;
    const live2 = { ...part, ...(live?.parts?.[part.key] || {}) };
    let draw;
    if (part.kind === "res") draw = drawRes(cx, y, live2);
    else if (part.kind === "led") draw = drawLed(cx, y, live2, live);
    else if (part.kind === "btn") draw = drawBtn(cx, y, live2);
    else if (part.kind === "buzzer") draw = drawBuzzer(cx, y, live2);
    else if (part.kind === "pot") draw = drawPot(cx, y, live2);
    else if (part.kind === "npn") draw = drawNpn(cx, y, live2);
    else if (part.kind === "cap") draw = drawCap(cx, y, live2);
    else if (part.kind === "servo" || part.kind === "motor") draw = drawActuator(cx, y, live2);
    else draw = { body: "", labels: "" };
    body += draw.body + draw.labels;
    body += `<line class="sch-lead ${i === 0 ? firstCls : ""}" x1="${cx + hw}" y1="${y}" x2="${x + w + (i === chain.length - 1 ? 0 : LAYOUT.partGap)}" y2="${y}" />`;
    x += w + LAYOUT.partGap;
  });
  return { body, endX: x - LAYOUT.partGap };
}

/**
 * 渲染一个案例的电路图。
 * item.channels: [{ pin, to, chain:[...], ref? }]
 * item.modules:  [{ key, ref, kind, pins:{sig:"PA1"}, lines:[] , boxRows:["PA9","PA10"] }]
 * live: 模型快照 { pins:{PA0:{v,logic,busy}}, parts:{key:{...}} }
 */
export function circuitSvg(item, live) {
  live = live || {};
  const channels = item.channels || [];
  const modules = item.modules || [];
  const rowKeys = [...channels.map(c => c.pin), ...modules.flatMap(m => Object.values(m.pins || {}))];
  const rows = [...new Set(rowKeys)];
  const L = LAYOUT;
  const dividerPins = new Set(channels.filter(c => c.kind === "divider").map(c => c.pin));
  const rowHeight = pin => L.rowH + (dividerPins.has(pin) ? 74 : 0);
  const rowTops = [];
  let acc = L.top;
  rows.forEach(pin => { rowTops.push(acc); acc += rowHeight(pin); });
  const yOf = pin => {
    const i = rows.indexOf(pin);
    return rowTops[i] + rowHeight(pin) / 2;
  };
  const startX = L.mcuX + L.mcuW + L.stub;

  /* 先排模块方块：高度按「行跨度」和「文本行数」取大者，再自上而下防重叠 */
  const chainEnd = ch => (ch.chain && ch.chain.length
    ? startX + ch.chain.reduce((acc, p) => acc + (p.w || L.partW) + L.partGap, 0) - L.partGap
    : 0);
  const maxChainEnd = Math.max(0, ...channels.map(chainEnd));
  const boxX = Math.min(Math.max(maxChainEnd + 96, 306), L.W - 244);
  const boxes = [];
  modules.forEach(m => {
    const pins = Object.entries(m.pins || {}).filter(([, pin]) => rows.includes(pin));
    if (!pins.length) return;
    const ys = pins.map(([, pin]) => yOf(pin));
    const spanTop = Math.min(...ys) - 26;
    const spanH = Math.max(...ys) + 26 - spanTop;
    const needH = 22 + moduleLineCount(m) * 16 + 10;
    boxes.push({
      m, pins,
      top: spanTop,
      h: Math.max(spanH, needH),
      x: boxX,
      w: L.W - boxX - L.boxPad
    });
  });
  boxes.sort((a, b) => a.top - b.top);
  boxes.forEach((bx, i) => {
    const prev = boxes[i - 1];
    if (prev && bx.top < prev.top + prev.h + 26) bx.top = prev.top + prev.h + 26;
  });

  const boxBottom = boxes.length ? Math.max(...boxes.map(b => b.top + b.h)) : 0;
  const H = Math.max(acc + 14, boxBottom + 22);

  let body = `<rect class="sch-sheet" x="0" y="0" width="${L.W}" height="${H}" rx="10" />`;

  /* MCU 方块 */
  const mcuTop = L.top - 8;
  const mcuH = acc - L.top + 18;
  body += `<g class="sch-mcu">
    <rect class="sch-mcu__rect" x="${L.mcuX}" y="${mcuTop}" width="${L.mcuW}" height="${mcuH}" rx="10" />
    <text class="sch-mcu__title" x="${L.mcuX + L.mcuW / 2}" y="${mcuTop + 18}" text-anchor="middle">STM32F103C8T6</text>
  </g>`;

  /* 每行：引脚名（框内右侧）+ 电压（框内左侧）+ 引出线 */
  rows.forEach(pin => {
    const y = yOf(pin);
    const p = live.pins?.[pin] || {};
    const cls = p.level ? `is-${p.level}` : "";
    body += `<text class="sch-pin__name ${cls}" x="${L.mcuX + L.mcuW - 10}" y="${y + 4}" text-anchor="end" data-pin="${esc(pin)}">${esc(pin)}</text>`;
    const volts = p.v !== undefined ? p.v : (p.level === "high" ? 3.3 : p.level === "low" ? 0 : undefined);
    if (volts !== undefined) {
      body += `<text class="sch-pin__v" x="${L.mcuX + 10}" y="${y + 3.6}">${volts.toFixed(2)}V</text>`;
    }
    body += `<line class="sch-stub ${cls}" x1="${L.mcuX + L.mcuW}" y1="${y}" x2="${startX}" y2="${y}" />`;
  });

  /* 元件支路 */
  channels.forEach(ch => {
    const y = yOf(ch.pin);
    const liveRow = live.channels?.[ch.key || ch.pin];
    const pinCls = live.pins?.[ch.pin]?.level === "high" ? "is-flow" : "";
    if (ch.kind === "divider" && ch.chain && ch.chain.length) {
      body += drawDivider(startX, startX + 96, y, ch, live);
    } else if (ch.chain && ch.chain.length) {
      const { body: chainBody, endX } = drawChain(ch.chain, startX, y, live, pinCls);
      body += chainBody;
      const railX = Math.min(endX + 46, boxX - 26);
      body += `<line class="sch-lead ${liveRow?.flow ? "is-flow" : ""}" x1="${endX}" y1="${y}" x2="${railX - 18}" y2="${y}" />`;
      body += railGlyph(railX, y, ch.to || "gnd");
      if (liveRow?.note) {
        body += `<text class="sch-note" x="${(endX + railX) / 2}" y="${y - 16}" text-anchor="middle">${esc(liveRow.note)}</text>`;
      }
    } else {
      body += `<line class="sch-lead" x1="${startX}" y1="${y}" x2="${boxX - 44}" y2="${y}" />`;
      body += railGlyph(boxX - 26, y, ch.to || "gnd");
    }
  });

  /* 模块方块：引脚与行对齐，方块自身高度按内容撑开 */
  boxes.forEach(bx => {
    bx.pins.forEach(([, pin]) => {
      const y = yOf(pin);
      const high = live.pins?.[pin]?.level === "high";
      body += `<line class="sch-lead ${high ? "is-flow" : ""}" x1="${startX}" y1="${y}" x2="${bx.x - 8}" y2="${y}" />`;
      body += `<circle class="sch-dot" cx="${bx.x - 6}" cy="${y}" r="2.6" />`;
    });
    body += drawModuleBox({ x: bx.x, y: bx.top, w: bx.w, h: bx.h },
      bx.pins.map(([label, pin]) => ({ label, y: yOf(pin) })),
      { ...bx.m, ...(live.parts?.[bx.m.key] || {}) });
  });

  return `<svg class="sch-svg" viewBox="0 0 ${L.W} ${H}" role="img" aria-label="${esc(item.title?.zh || "")} 电路图">${body}</svg>`;
}

export const SCH_LAYOUT = LAYOUT;
