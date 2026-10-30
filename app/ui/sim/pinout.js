/* ============================================================
   STM32F103C8T6 引脚图（LQFP48）
   ------------------------------------------------------------
   按真实封装画：左侧 1–12、底部 13–24、右侧 25–36、顶部 37–48，
   逆时针编号。每个引脚都是一个可点击的 <g data-chip-pin>，
   点进去看该引脚的复用功能与外设关联。
   ============================================================ */

import { PINS, PIN_BY_GPIO } from "../data/pins.js";

const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

export const VIEW = 560;
const BODY = { x: 130, y: 130, w: 300, h: 300 };
const STUB = 68;        /* 引脚线长度：够放引脚号 + 引脚名 */
const PITCH = BODY.w / 12;

/** 引脚号 → 画布坐标与朝向 */
export function pinGeometry(no) {
  const half = PITCH / 2;
  const n = no - 1;
  if (no <= 12) {                       /* 左侧，自上而下 */
    return { x: BODY.x, y: BODY.y + half + n * PITCH, dir: "left", angle: 0, no };
  }
  if (no <= 24) {                       /* 底部，自左而右 */
    return { x: BODY.x + half + (no - 13) * PITCH, y: BODY.y + BODY.h, dir: "bottom", angle: 90, no };
  }
  if (no <= 36) {                       /* 右侧，自下而上 */
    return { x: BODY.x + BODY.w, y: BODY.y + BODY.h - half - (no - 25) * PITCH, dir: "right", angle: 0, no };
  }
  return { x: BODY.x + BODY.w - half - (no - 37) * PITCH, y: BODY.y, dir: "top", angle: 90, no };
}

const shortName = pin => {
  if (pin.gpio) return pin.gpio;
  if (pin.kind === "power") return pin.name.replace(/_\d+$/, "");
  return pin.name.replace(/-.*$/, "").replace(/_\d+$/, "");
};

const stubLine = g => {
  switch (g.dir) {
    case "left": return { x1: g.x - STUB, y1: g.y, x2: g.x, y2: g.y };
    case "right": return { x1: g.x, y1: g.y, x2: g.x + STUB, y2: g.y };
    case "bottom": return { x1: g.x, y1: g.y, x2: g.x, y2: g.y + STUB };
    default: return { x1: g.x, y1: g.y, x2: g.x, y2: g.y - STUB };
  }
};

/* 引脚号贴着封装边缘，引脚名再往外一段，两者都在封装外面：
   封装内部只留芯片型号，避免 12 脚/边、25 px 间距下互相压字。 */
const NEAR = 12;
const FAR = 34;

const labelPoint = g => {
  switch (g.dir) {
    case "left": return { x: g.x - NEAR, y: g.y + 3.2, anchor: "end", rotate: 0 };
    case "right": return { x: g.x + NEAR, y: g.y + 3.2, anchor: "start", rotate: 0 };
    case "bottom": return { x: g.x + 3.2, y: g.y + NEAR, anchor: "start", rotate: 90 };
    default: return { x: g.x + 3.2, y: g.y - NEAR, anchor: "end", rotate: 90 };
  }
};

const innerPoint = g => {
  switch (g.dir) {
    case "left": return { x: g.x - FAR, y: g.y + 3.4, rotate: 0, anchor: "end" };
    case "right": return { x: g.x + FAR, y: g.y + 3.4, rotate: 0, anchor: "start" };
    case "bottom": return { x: g.x + 3.4, y: g.y + FAR, rotate: 90, anchor: "start" };
    default: return { x: g.x + 3.4, y: g.y - FAR, rotate: 90, anchor: "end" };
  }
};

/**
 * @param {string|null} selected 选中的 GPIO 名（如 "PA0"）或引脚名
 * @param {object} opts { used:Set<string> } 被案例占用的引脚，画实心点
 */
export function chipSvg(selected, opts = {}) {
  const used = opts.used || new Set();
  const sel = selected || null;

  const pins = PINS.map(pin => {
    const g = pinGeometry(pin.no);
    const s = stubLine(g);
    const lp = labelPoint(g);
    const ip = innerPoint(g);
    const key = pin.gpio || pin.name;
    const isSel = sel && (sel === pin.gpio || sel === pin.name || sel === String(pin.no));
    const isUsed = pin.gpio ? used.has(pin.gpio) : false;
    const label = shortName(pin);
    const dotX = s.x2 + Math.sign(s.x2 - s.x1) * 4;
    const dotY = s.y2 + Math.sign(s.y2 - s.y1) * 4;
    return `<g class="chip-pin chip-pin--${pin.kind}${isSel ? " is-selected" : ""}${isUsed ? " is-used" : ""}"
        data-chip-pin="${esc(key)}" tabindex="0" role="button"
        aria-label="${esc(pin.no + " " + pin.name)}">
      <title>${esc(pin.no + " · " + pin.name)}</title>
      <line class="chip-pin__stub" x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" />
      <text class="chip-pin__no" x="${lp.x}" y="${lp.y}" text-anchor="${lp.anchor}"
        ${lp.rotate ? `transform="rotate(${lp.rotate} ${lp.x} ${lp.y})"` : ""}>${pin.no}</text>
      <text class="chip-pin__name" x="${ip.x}" y="${ip.y}" text-anchor="${ip.anchor}"
        ${ip.rotate ? `transform="rotate(${ip.rotate} ${ip.x} ${ip.y})"` : ""}>${esc(label)}</text>
      ${isUsed ? `<circle class="chip-pin__dot" cx="${dotX}" cy="${dotY}" r="3.2" />` : ""}
    </g>`;
  }).join("");

  return `<svg class="chip-svg" viewBox="0 0 ${VIEW} ${VIEW}" role="img" aria-label="STM32F103C8T6 LQFP48 引脚图">
    <rect class="chip-body" x="${BODY.x}" y="${BODY.y}" width="${BODY.w}" height="${BODY.h}" rx="10" />
    <circle class="chip-dot" cx="${BODY.x + 18}" cy="${BODY.y + 18}" r="4" />
    <text class="chip-title" x="${BODY.x + BODY.w / 2}" y="${BODY.y + BODY.h / 2 - 6}" text-anchor="middle">STM32F103C8T6</text>
    <text class="chip-sub" x="${BODY.x + BODY.w / 2}" y="${BODY.y + BODY.h / 2 + 14}" text-anchor="middle">LQFP48 · 7×7 mm</text>
    ${pins}
  </svg>`;
}

/** 案例占用的引脚集合（用于在引脚图上打点） */
export function usedPins(cases) {
  const set = new Set();
  for (const c of cases || []) {
    (c.channels || []).forEach(ch => { if (ch.pin) set.add(ch.pin); });
    (c.modules || []).forEach(m => Object.values(m.pins || {}).forEach(p => set.add(p)));
  }
  for (const p of [...set]) if (!PIN_BY_GPIO[p]) set.delete(p);
  return set;
}

export { PIN_BY_GPIO };
