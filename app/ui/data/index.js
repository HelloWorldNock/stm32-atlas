import { PERIPHERALS, PERIPH_MAP } from "./peripherals.js";
import { CORE } from "./fn-core.js";
import { SERIAL } from "./fn-serial.js";
import { ANALOG } from "./fn-timer.js";
import { MEMORY } from "./fn-memory.js";
import { WF_GPIO } from "./wf-gpio.js";
import { WF_SERIAL } from "./wf-serial.js";
import { WF_SYSTEM } from "./wf-system.js";
import { KB_ARTICLES } from "./kb.js";
import { CASES, CASE_MAP } from "./cases.js";
import { PINS, PIN_MAP, PIN_BY_GPIO } from "./pins.js";
import { MATERIAL_MODULES, MATERIAL_MAP } from "./materials.js";
import { MATERIAL_NOTES } from "./material-notes.js";

export { PERIPHERALS, PERIPH_MAP };
export { KB_ARTICLES, CASES, CASE_MAP };
export { PINS, PIN_MAP, PIN_BY_GPIO };
export { MATERIAL_MODULES, MATERIAL_MAP };

export const KB_MAP = Object.fromEntries(KB_ARTICLES.map(a => [a.id, a]));

export const FUNCTIONS = [...CORE, ...SERIAL, ...ANALOG, ...MEMORY];
export const WORKFLOWS = [...WF_GPIO, ...WF_SERIAL, ...WF_SYSTEM];

export const FUNCTION_MAP = Object.fromEntries(FUNCTIONS.map(f => [f.id, f]));
export const WORKFLOW_MAP = Object.fromEntries(WORKFLOWS.map(w => [w.id, w]));

/* ---- equivalences: one row per std/HAL pair ---- */
export const EQUIVALENCES = (() => {
  const seen = new Set();
  const rows = [];
  for (const f of FUNCTIONS) {
    if (!f.eq || !FUNCTION_MAP[f.eq]) continue;
    const key = [f.id, f.eq].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const a = f.lib === "std" ? f : FUNCTION_MAP[f.eq];
    const b = f.lib === "hal" ? f : FUNCTION_MAP[f.eq];
    if (!a || !b) continue;
    rows.push({ periph: a.p, std: a, hal: b });
  }
  return rows;
})();

/* ---- function -> workflows backlinks ---- */
export const FN_WORKFLOWS = (() => {
  const map = new Map();
  for (const wf of WORKFLOWS) {
    wf.steps.forEach((step, index) => {
      for (const id of step.fn || []) {
        if (!map.has(id)) map.set(id, []);
        const list = map.get(id);
        if (!list.some(x => x.wf.id === wf.id)) list.push({ wf, step: index + 1 });
      }
    });
  }
  return map;
})();

export const PERIPH_COUNTS = PERIPHERALS.map(p => {
  const fns = FUNCTIONS.filter(f => f.p === p.id);
  const workflows = WORKFLOWS.filter(w => w.p === p.id);
  return {
    ...p,
    total: fns.length,
    std: fns.filter(f => f.lib === "std").length,
    hal: fns.filter(f => f.lib === "hal").length,
    workflows: workflows.length
  };
});

export const STATS = {
  functions: FUNCTIONS.length,
  std: FUNCTIONS.filter(f => f.lib === "std").length,
  hal: FUNCTIONS.filter(f => f.lib === "hal").length,
  workflows: WORKFLOWS.length,
  peripherals: PERIPHERALS.length,
  equivalences: EQUIVALENCES.length,
  steps: WORKFLOWS.reduce((n, w) => n + w.steps.length, 0),
  materials: MATERIAL_MODULES.length,
  materialFiles: MATERIAL_MODULES.reduce((n, m) => n + m.files, 0)
};

/* ---- search ---- */
const norm = s => (s || "").toLowerCase().normalize("NFKC");

const fnFields = f => [
  [f.name, 8],
  [f.id, 5],
  [(f.tags || []).join(" "), 6],
  [f.zh, 4],
  [f.en, 3],
  [PERIPH_MAP[f.p]?.zh || "", 2],
  [PERIPH_MAP[f.p]?.en || "", 2],
  [PERIPH_MAP[f.p]?.short || "", 3],
  [(f.params || []).map(p => p.join(" ")).join(" "), 1]
];

const wfFields = w => [
  [w.title.zh, 8],
  [w.title.en, 7],
  [w.id, 4],
  [(w.tags || []).join(" "), 3],
  [w.goal.zh, 2],
  [w.goal.en, 1],
  [w.steps.map(s => s.title.zh + " " + s.title.en).join(" "), 1]
];

const kbText = a => {
  const parts = [];
  for (const b of a.blocks || []) {
    if (b.zh) parts.push(b.zh, b.en || "");
    if (b.expr) parts.push(b.expr, b.note?.zh || "");
    for (const item of b.items || []) parts.push(item.zh, item.en || "");
  }
  return parts.join(" ");
};

const kbFields = a => [
  [a.title.zh, 8],
  [a.title.en, 7],
  [a.id, 4],
  [a.summary?.zh || "", 3],
  [a.summary?.en || "", 2],
  [PERIPH_MAP[a.p]?.zh || "", 2],
  [kbText(a), 1]
];

/* 资料按“模块名 → 顶层文件名 → 标签”给权重，文件名权重最高：查 “TCRT5000” 直接命中 */
const matFileNames = m => m.resources.map(r => r.name).join(" ");

/* 阅读笔记里的参数/引脚/要点也参与检索，这样 “0x78”“STBY” 这类词能直接搜到模块 */
const matNoteText = m => {
  const n = MATERIAL_NOTES[m.id];
  if (!n) return "";
  const flat = v => (typeof v === "string" ? v : [v?.zh, v?.en].filter(Boolean).join(" "));
  const parts = [flat(n.takeaway)];
  for (const [k, v] of [...(n.specs || []), ...(n.pins || [])]) parts.push(flat(k), flat(v));
  for (const s of [...(n.steps || []), ...(n.cautions || [])]) parts.push(flat(s));
  return parts.join(" ");
};

const matFields = m => [
  [m.code, 7],
  [m.dir, 7],
  [m.name.zh, 8],
  [m.name.en, 7],
  [(m.tags || []).join(" "), 6],
  [matFileNames(m), 5],
  [matNoteText(m), 4],
  [m.summary.zh, 2],
  [m.summary.en, 1]
];

function score(fields, tokens) {
  let total = 0;
  for (const token of tokens) {
    let tokenScore = 0;
    for (const [text, weight] of fields) {
      const hay = norm(text);
      if (!hay) continue;
      if (hay === token) tokenScore = Math.max(tokenScore, weight * 3);
      else if (hay.startsWith(token)) tokenScore = Math.max(tokenScore, weight * 1.8);
      else if (hay.includes(token)) tokenScore = Math.max(tokenScore, weight * 0.7);
    }
    if (tokenScore === 0) return 0;
    total += tokenScore;
  }
  return total;
}

export function searchAll(query, { limit = 30 } = {}) {
  const q = norm(query).trim();
  if (!q) return { functions: [], workflows: [], peripherals: [], kb: [], materials: [], tokens: [] };
  const tokens = q.split(/\s+/).filter(Boolean);
  const functions = FUNCTIONS
    .map(f => ({ item: f, s: score(fnFields(f), tokens) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
    .map(x => x.item);
  const workflows = WORKFLOWS
    .map(w => ({ item: w, s: score(wfFields(w), tokens) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 12)
    .map(x => x.item);
  const kb = KB_ARTICLES
    .map(a => ({ item: a, s: score(kbFields(a), tokens) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map(x => x.item);
  const peripherals = PERIPH_COUNTS
    .filter(p => {
      const hay = norm([p.short, p.zh, p.en, p.descZh, p.descEn].join(" "));
      return tokens.every(t => hay.includes(t));
    })
    .slice(0, 6);
  const materials = MATERIAL_MODULES
    .map(m => ({ item: m, s: score(matFields(m), tokens) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
    .map(x => x.item);
  return { functions, workflows, peripherals, kb, materials, tokens };
}

/* ---- integrity check (dev aid, harmless in production) ---- */
(() => {
  const missing = [];
  for (const f of FUNCTIONS) {
    if (f.eq && !FUNCTION_MAP[f.eq]) missing.push(`${f.id} -> eq ${f.eq}`);
    for (const r of f.rel || []) if (!FUNCTION_MAP[r]) missing.push(`${f.id} -> rel ${r}`);
  }
  for (const w of WORKFLOWS) {
    for (const s of w.steps) {
      for (const id of s.fn || []) if (!FUNCTION_MAP[id]) missing.push(`${w.id} -> fn ${id}`);
    }
  }
  for (const a of KB_ARTICLES) {
    if (!PERIPH_MAP[a.p]) missing.push(`${a.id} -> peripheral ${a.p}`);
    for (const id of a.related?.workflows || []) if (!WORKFLOW_MAP[id]) missing.push(`${a.id} -> wf ${id}`);
    for (const id of a.related?.functions || []) if (!FUNCTION_MAP[id]) missing.push(`${a.id} -> fn ${id}`);
  }
  for (const m of MATERIAL_MODULES) {
    if (m.p && !PERIPH_MAP[m.p]) missing.push(`material ${m.id} -> peripheral ${m.p}`);
    for (const id of m.cases || []) if (!CASE_MAP.has(id)) missing.push(`material ${m.id} -> case ${id}`);
    for (const id of m.workflows || []) if (!WORKFLOW_MAP[id]) missing.push(`material ${m.id} -> wf ${id}`);
    for (const id of m.kb || []) if (!KB_MAP[id]) missing.push(`material ${m.id} -> kb ${id}`);
  }
  if (missing.length) console.warn("[data] unresolved ids:\n" + missing.join("\n"));
})();
