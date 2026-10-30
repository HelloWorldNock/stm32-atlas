import {
  FUNCTIONS, FUNCTION_MAP, WORKFLOWS, WORKFLOW_MAP, PERIPHERALS, PERIPH_MAP,
  PERIPH_COUNTS, EQUIVALENCES, FN_WORKFLOWS, STATS, searchAll,
  KB_ARTICLES, KB_MAP, CASES, CASE_MAP, PINS, PIN_MAP, PIN_BY_GPIO
} from "./data/index.js";
import { caseSources } from "./data/case-src.js";
import { circuitSvg } from "./sim/sch.js";
import { createModel, VDD } from "./sim/models.js";
import { chipSvg, usedPins, pinGeometry } from "./sim/pinout.js";
import { makeT } from "./i18n.js";
import { icon } from "./icons.js";

/* ============================================================
   state & helpers
   ============================================================ */
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem("atlas." + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("atlas." + key, JSON.stringify(value)); } catch { }
  }
};

const bootQuery = new URLSearchParams(location.search);
const bootLang = bootQuery.get("lang");
const bootTheme = bootQuery.get("theme");

const state = {
  lang: bootLang === "zh" || bootLang === "en" ? bootLang : store.get("lang", "zh"),
  theme: bootTheme === "dark" || bootTheme === "light" ? bootTheme : store.get("theme", "light"),
  favs: new Set(store.get("favs", [])),
  recent: store.get("recent", []),
  wfTab: "flow",
  codeLib: "std",
  lastSearch: null,
  flowWf: null
};

let t = makeT(state.lang);

/* 桌面壳（WebView2）里把主题同步给原生标题栏；浏览器里是空操作 */
function postHost(message) {
  try { window.chrome && window.chrome.webview && window.chrome.webview.postMessage(message); } catch { }
}

const $ = (sel, root = document) => root.querySelector(sel);
const view = $("#view");
const mainView = $("#mainView");
const searchInput = $("#search");
const searchClear = $("#searchClear");
const searchKbd = $("#searchKbd");

const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

const tx = obj => obj ? (obj[state.lang] || obj.zh || obj.en || "") : "";
const alt = obj => obj ? (obj[state.lang === "zh" ? "en" : "zh"] || "") : "";

const go = hash => {
  if (location.hash === hash) render();
  else location.hash = hash;
};

const pchip = p => {
  const meta = PERIPH_MAP[p];
  if (!meta) return "";
  return `<span class="pchip" style="--c:${meta.accent}"><span class="pchip__dot"></span>${esc(meta.short)}</span>`;
};

const libBadge = lib => `<span class="badge badge--${lib}">${lib === "std" ? t("common.std") : "HAL"}</span>`;
const levelName = n => t("level." + n);
const fnHref = id => `#/fn/${encodeURIComponent(id)}`;
const wfHref = id => `#/wf/${encodeURIComponent(id)}`;
const favKey = (type, id) => `${type}:${id}`;
const isFav = key => state.favs.has(key);

const starBtn = (type, id, extra = "") => {
  const key = favKey(type, id);
  const on = isFav(key);
  return `<button class="icon-action ${on ? "is-on" : ""} ${extra}" type="button"
    data-fav="${esc(key)}" aria-pressed="${on}" title="${on ? t("common.unfavorite") : t("common.favorite")}"
    aria-label="${on ? t("common.unfavorite") : t("common.favorite")}">${icon("star")}</button>`;
};

const copyBtn = (code, label = "") => {
  const payload = esc(encodeURIComponent(code));
  return `<button class="icon-action copy-btn" type="button" data-copy="${payload}"
    title="${t("common.copy")}" aria-label="${t("common.copy")}">${icon("copy")}${label ? `<span>${esc(label)}</span>` : ""}</button>`;
};

function toast(message) {
  const el = $("#toast");
  el.innerHTML = `${icon("check")}<span>${esc(message)}</span>`;
  el.classList.add("is-on");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => el.classList.remove("is-on"), 1900);
}

/* syntax highlight (C) */
const KEYWORDS = /^(?:void|int|char|float|double|static|const|volatile|if|else|while|for|switch|case|break|continue|return|typedef|struct|enum|sizeof|do|default|goto|extern|inline|register|unsigned|signed|long|short)$/;
const CODE_RE = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(^[ \t]*#[^\n]*)|(\b(?:0x[0-9A-Fa-f]+|\d+(?:\.\d+)?[uUlLfF]*)\b)|(\b(?:GPIO_InitTypeDef|GPIO_TypeDef|USART_TypeDef|USART_InitTypeDef|TIM_TypeDef|TIM_TimeBaseInitTypeDef|TIM_OCInitTypeDef|ADC_TypeDef|ADC_InitTypeDef|DMA_Channel_TypeDef|DMA_InitTypeDef|I2C_TypeDef|I2C_InitTypeDef|SPI_TypeDef|SPI_InitTypeDef|RTC_TimeTypeDef|RTC_DateTypeDef|RTC_AlarmTypeDef|FLASH_EraseInitTypeDef|UART_HandleTypeDef|GPIO_PinState|HAL_StatusTypeDef|ErrorStatus|ITStatus|FlagStatus|FunctionalState|BitAction|IRQn_Type)\b)|(\b[A-Z_][A-Z0-9_]{2,}\b)|(\b[A-Za-z_]\w*(?=\s*\())|(\b(?:void|int|char|float|double|static|const|volatile|if|else|while|for|switch|case|break|continue|return|typedef|struct|enum|sizeof|do|default|goto|extern|inline|unsigned|signed|long|short)\b)/gm;

function highlight(code) {
  let out = "";
  let last = 0;
  for (const match of code.matchAll(CODE_RE)) {
    out += esc(code.slice(last, match.index));
    const cls = match[1] ? "tok-com"
      : match[2] ? "tok-str"
        : match[3] ? "tok-pre"
          : match[4] ? "tok-num"
            : match[5] ? "tok-type"
              : match[6] ? "tok-const"
                : match[7] ? "tok-fn" : "tok-key";
    out += `<span class="${cls}">${esc(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  out += esc(code.slice(last));
  return out;
}

function codeBlock(code, { name = "", lang = "C", actions = "" } = {}) {
  return `<div class="code-block">
    <div class="code-block__bar">
      <span class="code-block__lang">${esc(lang)}</span>
      ${name ? `<span class="code-block__name">${esc(name)}</span>` : ""}
      ${actions}
    </div>
    <pre><code>${highlight(code)}</code></pre>
  </div>`;
}

/* ============================================================
   sidebar & topbar
   ============================================================ */
const NAV = [
  ["overview", "home", "nav.overview", "#/home"],
  ["functions", "book", "nav.functions", "#/functions"],
  ["workflows", "flow", "nav.workflows", "#/workflows"],
  ["cases", "flame", "nav.cases", "#/cases"],
  ["chip", "chip", "nav.chip", "#/chip"],
  ["kb", "layers", "nav.kb", "#/kb"],
  ["map", "map", "nav.map", "#/map"],
  ["favorites", "star", "nav.favorites", "#/favorites"]
];

const NAV_COUNT = {
  functions: STATS.functions,
  workflows: STATS.workflows,
  cases: CASES.length,
  chip: PINS.length,
  kb: KB_ARTICLES.length,
  favorites: 0
};

function renderSidebar(route) {
  const active = route.name;
  const periphActive = route.peripheral || (route.name === "map" ? route.query.get("p") : null);

  const navHTML = NAV.map(([key, ico, label, href]) => `
    <a class="nav-item ${active === key ? "is-active" : ""}" href="${href}" title="${t(label)}">
      ${icon(ico)}<span>${t(label)}</span>
      ${NAV_COUNT[key] !== undefined && (key === "functions" || key === "workflows" || key === "kb" || key === "cases" || key === "chip")
      ? `<span class="nav-item__count">${NAV_COUNT[key]}</span>` : ""}
      ${key === "favorites" ? `<span class="nav-item__count">${state.favs.size}</span>` : ""}
    </a>`).join("");

  const periphHTML = PERIPH_COUNTS.map(p => `
    <a class="periph-item ${periphActive === p.id ? "is-active" : ""}" href="#/functions?p=${p.id}" style="--pcolor:${p.accent}"
       title="${esc(p.short + " · " + (state.lang === "zh" ? p.zh : p.en))}">
      <span class="periph-dot"></span>
      <span class="periph-item__code">${esc(p.short)}</span>
      <span class="periph-item__name">${esc(state.lang === "zh" ? p.zh : p.en)}</span>
      <span class="periph-item__count">${p.total}</span>
    </a>`).join("");

  $("#sidebar").innerHTML = `
    <div class="sidebar__scroll">
      <div class="brand">
        <div class="brand__mark">${icon("chip")}</div>
        <div class="brand__text">
          <span class="brand__name">${t("app.title")}</span>
          <span class="brand__sub">Library Atlas</span>
        </div>
      </div>
      <nav class="nav" aria-label="${t("nav.explore")}">
        <div class="nav__label">${t("nav.explore")}</div>
        ${navHTML}
      </nav>
      <nav class="nav" aria-label="${t("nav.peripherals")}">
        <div class="nav__label">${t("nav.peripherals")}</div>
        <div class="periph-nav">${periphHTML}</div>
      </nav>
    </div>
    <div class="sidebar__foot">
      <div class="ref-card">
        <div class="ref-card__title">${icon("info")}${t("sidebar.reference")}</div>
        <div class="ref-card__note">${t("sidebar.referenceNote")}</div>
        <div class="ref-card__meta">${t("sidebar.data", { f: `<span>${STATS.functions}</span>`, w: `<span>${STATS.workflows}</span>` })}</div>
      </div>
    </div>`;
}

function renderTopbar(route) {
  const langSeg = $("#langSeg");
  langSeg.querySelectorAll("button").forEach(btn => {
    const on = btn.dataset.lang === state.lang;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on);
  });
  $("#themeIcon").innerHTML = icon(state.theme === "dark" ? "moon" : "sun");
  $("#themeBtn").setAttribute("aria-label", t("top.theme"));
  searchInput.placeholder = t("top.searchPlaceholder");
  searchInput.setAttribute("aria-label", t("top.searchPlaceholder"));

  const crumb = $("#crumb");
  if (!route.crumb) crumb.innerHTML = "";
  else crumb.innerHTML = `${icon(route.crumbIcon || "compass")}<span>${t(route.crumb)}</span>${route.crumbNow ? `<span class="crumb__sep">/</span><span class="crumb__now">${esc(route.crumbNow)}</span>` : ""}`;
}

/* ============================================================
   routing
   ============================================================ */
function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, queryString] = raw.split("?");
  const parts = path.split("/").filter(Boolean);
  const query = new URLSearchParams(queryString || "");
  return { parts, query, raw };
}

function routeInfo() {
  const { parts, query } = parseRoute();
  const head = parts[0] || "home";
  const base = { query, parts, name: head, peripheral: null };

  if (head === "home" || head === "") return { ...base, name: "overview", crumb: "nav.overview" };
  if (head === "functions") {
    const p = query.get("p") || "all";
    return { ...base, name: "functions", peripheral: p !== "all" ? p : null, crumb: "nav.functions", crumbNow: p !== "all" ? PERIPH_MAP[p]?.short : "" };
  }
  if (head === "fn") {
    const fn = FUNCTION_MAP[decodeURIComponent(parts[1] || "")];
    return { ...base, name: "functions", fn, peripheral: fn?.p || null, crumb: "nav.functions", crumbNow: fn?.name || "" };
  }
  if (head === "workflows") return { ...base, name: "workflows", crumb: "nav.workflows" };
  if (head === "wf") {
    const wf = WORKFLOW_MAP[decodeURIComponent(parts[1] || "")];
    return { ...base, name: "workflows", wf, peripheral: wf?.p || null, crumb: "nav.workflows", crumbNow: wf ? tx(wf.title) : "" };
  }
  if (head === "map") return { ...base, name: "map", crumb: "nav.map" };
  if (head === "kb") {
    const art = parts[1] ? KB_MAP[decodeURIComponent(parts[1])] : null;
    return {
      ...base, name: "kb", kb: art || null, peripheral: art?.p || null,
      crumb: "nav.kb", crumbNow: art ? tx(art.title) : ""
    };
  }
  if (head === "cases") {
    const item = parts[1] ? CASE_MAP.get(decodeURIComponent(parts[1])) : null;
    return { ...base, name: "cases", caseItem: item || null, crumb: "nav.cases", crumbNow: item ? tx(item.title) : "" };
  }
  if (head === "chip") {
    const key = parts[1] ? decodeURIComponent(parts[1]) : null;
    const pin = key ? (PIN_BY_GPIO[key] || PINS.find(p => p.name === key) || null) : null;
    return { ...base, name: "chip", chipKey: pin ? (pin.gpio || pin.name) : null, pin, crumb: "nav.chip", crumbNow: pin ? `${pin.no} · ${pin.name}` : "" };
  }
  if (head === "favorites") return { ...base, name: "favorites", crumb: "nav.favorites" };
  if (head === "search") return { ...base, name: "search", crumb: "top.search" };
  return { ...base, name: "overview", crumb: "nav.overview" };
}

let lastPath = "";

function render() {
  const route = routeInfo();
  const { parts, query } = route;
  let html = "";

  caseStop();

  if (route.name === "overview") html = viewHome();
  else if (route.name === "functions" && parts[0] === "fn") html = route.fn ? viewFunction(route.fn) : viewNotFound();
  else if (route.name === "functions") html = viewFunctions(query);
  else if (route.name === "workflows" && parts[0] === "wf") html = route.wf ? viewWorkflow(route.wf) : viewNotFound();
  else if (route.name === "workflows") html = viewWorkflows(query);
  else if (route.name === "cases" && route.caseItem) html = viewCaseDetail(route.caseItem);
  else if (route.name === "cases") html = viewCases();
  else if (route.name === "chip") html = viewChip(route);
  else if (route.name === "kb" && route.kb) html = viewKbArticle(route.kb);
  else if (route.name === "kb") html = viewKb();
  else if (route.name === "map") html = viewMap(query);
  else if (route.name === "favorites") html = viewFavorites();
  else if (route.name === "search") html = viewSearch(query.get("q") || "");
  else html = viewHome();

  view.innerHTML = html;
  renderSidebar(route);
  renderTopbar(route);

  if (route.name === "search") {
    if (searchInput.value.trim() !== (query.get("q") || "")) searchInput.value = query.get("q") || "";
    searchInput.dataset.mode = "search";
  } else {
    searchInput.dataset.mode = "filter";
  }
  syncSearchUi();

  const pathKey = location.hash;
  if (!(route.name === "search" && lastPath.startsWith("#/search"))) {
    mainView.scrollTop = 0;
  }
  lastPath = pathKey;

  if (route.name === "workflows" && route.wf) {
    state.flowWf = route.wf;
    if (state.wfTab === "flow") {
      layoutFlow(route.wf);
      bindFlowInteractions();
      document.fonts?.ready.then(() => {
        if (state.flowWf === route.wf && state.wfTab === "flow") layoutFlow(route.wf);
      });
    }
  } else {
    state.flowWf = null;
  }

  if (route.name === "cases" && route.caseItem) {
    bindCaseUi();
    caseStart(route.caseItem);
  }

  if (route.wf) recordRecent("wf", route.wf.id);
  if (route.fn) recordRecent("fn", route.fn.id);
}

function viewNotFound() {
  return `<div class="empty">${icon("alert")}<h3>${t("common.notFound")}</h3><p>${t("fn.emptyHint")}</p>
    <a class="btn btn--sm" href="#/home">${t("nav.overview")}</a></div>`;
}

/* ============================================================
   home
   ============================================================ */
function heroTitle() {
  const title = t("home.title");
  const sep = state.lang === "zh" ? "，" : " into ";
  const at = title.indexOf(sep);
  if (at < 0) return esc(title);
  return esc(title.slice(0, at)) + esc(sep) + `<em>${esc(title.slice(at + sep.length))}</em>`;
}

function viewHome() {
  const featuredIds = ["wf.gpio-output", "wf.usart-irq", "wf.tim-pwm", "wf.adc-dma", "wf.i2c-eeprom", "wf.iwdg"];
  const featured = featuredIds.map(id => WORKFLOW_MAP[id]).filter(Boolean);

  return `
  <section class="hero">
    <div class="hero__eyebrow">${t("home.eyebrow")}</div>
    <h1>${heroTitle()}</h1>
    <p class="hero__lead">${t("home.lead")}</p>
    <div class="hero__cta">
      <a class="btn btn--primary" href="#/functions">${icon("book")}${t("home.ctaFunctions")}</a>
      <a class="btn" href="#/workflows">${icon("flow")}${t("home.ctaWorkflows")}</a>
    </div>
    <div class="hero__stats">
      ${statBlock(STATS.functions, t("home.statsFunctions"))}
      ${statBlock(STATS.workflows, t("home.statsWorkflows"))}
      ${statBlock(STATS.peripherals, t("home.statsPeripherals"))}
      ${statBlock(STATS.equivalences, t("home.statsPairs"))}
    </div>
  </section>

  <div class="sec-head"><h2>${t("home.quickTitle")}</h2><span class="sec-head__meta">${t("home.quickLead")}</span></div>
  <div class="quick-grid">
    ${quickCard("book", "home.quick1Title", "home.quick1Desc", "#/functions")}
    ${quickCard("flow", "home.quick2Title", "home.quick2Desc", "#/workflows")}
    ${quickCard("map", "home.quick3Title", "home.quick3Desc", "#/map")}
  </div>

  <div class="sec-head">
    <h2>${t("home.popularFlows")}</h2>
    <span class="sec-head__meta">${t("home.popularFlowsLead")}</span>
    <a class="sec-head__link" href="#/workflows">${t("common.viewAll")}${icon("chevronRight")}</a>
  </div>
  <div class="flow-grid">${featured.map(wfCard).join("")}</div>


  <div class="sec-head">
    <h2>${t("home.periphTitle")}</h2>
    <span class="sec-head__meta">${t("home.periphLead")}</span>
  </div>
  <div class="periph-grid">${PERIPH_COUNTS.map(p => `
    <a class="periph-card" href="#/functions?p=${p.id}" style="--pcolor:${p.accent}">
      <span class="periph-card__ico">${icon(p.icon)}</span>
      <span class="periph-card__text">
        <span class="periph-card__name"><span class="periph-card__code">${esc(p.short)}</span><span class="periph-card__zh">${esc(tx(p))}</span></span>
        <span class="periph-card__meta">${p.std} SPL · ${p.hal} HAL · ${p.workflows} ${t("common.workflows")}</span>
      </span>
    </a>`).join("")}</div>

  ${state.recent.length ? `
  <div class="sec-head"><h2>${t("home.recent")}</h2></div>
  <div class="recent-list">${state.recent.slice(0, 6).map(item => {
    const isFn = item.type === "fn";
    const obj = isFn ? FUNCTION_MAP[item.id] : WORKFLOW_MAP[item.id];
    if (!obj) return "";
    return `<a class="recent-item" href="${isFn ? fnHref(obj.id) : wfHref(obj.id)}">
      ${icon(isFn ? "code" : "flow")}
      <span class="recent-item__kind">${isFn ? "FN" : "FLOW"}</span>
      <span class="recent-item__name">${esc(isFn ? obj.name : tx(obj.title))}</span>
      <span class="recent-item__time">${isFn ? (obj.lib === "std" ? "SPL" : "HAL") : pcode(obj.p)}</span>
    </a>`;
  }).join("")}</div>` : `
  <div class="sec-head"><h2>${t("home.recent")}</h2></div>
  <div class="recent-list"><div class="recent-item" style="cursor:default">${icon("compass")}<span>${t("home.recentEmpty")}</span></div></div>`}
  `;
}

function statBlock(value, label) {
  return `<div class="hero__stat"><b>${value}</b><span>${esc(label)}</span></div>`;
}

function quickCard(ico, titleKey, descKey, href) {
  return `<a class="quick-card" href="${href}">
    <span class="quick-card__top">
      <span class="quick-card__ico">${icon(ico)}</span>
      <span class="quick-card__arrow">${icon("arrowRight")}</span>
    </span>
    <h3>${t(titleKey)}</h3>
    <p>${t(descKey)}</p>
  </a>`;
}

const pcode = id => PERIPH_MAP[id]?.short || "";

function wfCard(wf) {
  const callCount = new Set(wf.steps.flatMap(s => s.fn || [])).size;
  return `<a class="flow-card" href="${wfHref(wf.id)}">
    <span class="flow-card__top">
      ${pchip(wf.p)}
      <span class="badge">${levelName(wf.level)}</span>
      <span class="flow-card__level">${wf.steps.length} ${t("common.steps")}</span>
    </span>
    <h3>${esc(tx(wf.title))}</h3>
    <p>${esc(tx(wf.goal))}</p>
    <span class="flow-card__foot">
      <span>${callCount} ${t("common.functions")}</span>
      <span>SPL · HAL</span>
      ${icon("arrowRight")}
    </span>
  </a>`;
}

/* ============================================================
   functions list
   ============================================================ */
function libFilterRow(current) {
  return `<div class="seg seg--mono" role="group" aria-label="${t("fn.filterLib")}">
    ${[["all", t("common.all")], ["std", t("common.std")], ["hal", "HAL"]].map(([value, label]) =>
    `<button type="button" data-lib="${value}" class="${current === value ? "active" : ""}">${label}</button>`).join("")}
  </div>`;
}

function viewFunctions(query) {
  const lib = query.get("lib") || "all";
  const p = query.get("p") || "all";
  const filtered = FUNCTIONS.filter(f => (lib === "all" || f.lib === lib) && (p === "all" || f.p === p));

  const groups = PERIPHERALS
    .filter(meta => p === "all" || meta.id === p)
    .map(meta => ({
      meta,
      items: filtered
        .filter(f => f.p === meta.id)
        .sort((a, b) => (a.lib === b.lib ? a.name.localeCompare(b.name) : a.lib === "std" ? -1 : 1))
    }))
    .filter(group => group.items.length);

  const chipList = [["all", t("common.all"), FUNCTIONS.length], ...PERIPH_COUNTS.map(meta => [meta.id, meta.short, meta.total])];

  return `
  <div class="page-head">
    <div class="eyebrow">${t("nav.functions")}</div>
    <h1>${t("fn.title")}</h1>
    <p class="lead">${t("fn.lead")}</p>
  </div>

  <div class="toolbar">
    <div class="toolbar__row">
      ${libFilterRow(lib)}
      <span class="search-count">${t("fn.count", { n: filtered.length })}</span>
    </div>
    <div class="chip-row" role="group" aria-label="${t("fn.filterPeriph")}">
      ${chipList.map(([id, label, count]) => `
        <button type="button" class="chip ${p === id ? "is-active" : ""}"
          data-p="${id}" style="--c:${id === "all" ? "var(--accent)" : PERIPH_MAP[id].accent}">
          ${esc(label)}<span class="chip__n">${count}</span>
        </button>`).join("")}
    </div>
  </div>

  ${filtered.length ? groups.map(group => `
    <section class="fn-group">
      <div class="fn-group__head">
        ${pchip(group.meta.id)}
        <span>${esc(tx(group.meta))}</span>
        <span class="fn-group__line"></span>
        <span class="fn-group__count">${group.items.length}</span>
      </div>
      <div class="fn-list">${group.items.map(fnRow).join("")}</div>
    </section>`).join("") : `
    <div class="empty">${icon("search")}<h3>${t("fn.empty")}</h3><p>${t("fn.emptyHint")}</p></div>`}
  `;
}

function fnRow(f) {
  return `<a class="fn-row" href="${fnHref(f.id)}">
    <span class="fn-row__main">
      <span class="fn-row__title">
        <span class="fn-row__name">${esc(f.name)}</span>
        ${libBadge(f.lib)}
        ${f.eq ? `<span class="fn-row__eq" title="${t("fn.equiv")}">${icon("link")}</span>` : ""}
      </span>
      <span class="fn-row__brief">${esc(tx({ zh: f.zh, en: f.en }))}</span>
    </span>
    <span class="fn-row__meta">${pchip(f.p)}${icon("chevronRight")}</span>
  </a>`;
}

/* ============================================================
   function detail
   ============================================================ */
function viewFunction(f) {
  const eq = f.eq ? FUNCTION_MAP[f.eq] : null;
  const related = (f.rel || []).map(id => FUNCTION_MAP[id]).filter(Boolean);
  const used = FN_WORKFLOWS.get(f.id) || [];
  const other = alt({ zh: f.zh, en: f.en });
  const kind = f.macro ? t("common.macro") : f.group ? t("common.group") : t("common.function");

  return `
  <a class="backlink" href="#/functions?p=${encodeURIComponent(f.p)}">${icon("arrowLeft")}${t("common.back")} · ${PERIPH_MAP[f.p]?.short || ""}</a>

  <div class="detail-head">
    <div class="detail-head__main">
      <div class="detail-head__tags">
        ${libBadge(f.lib)}
        ${pchip(f.p)}
        ${f.macro ? `<span class="badge badge--macro">${t("common.macro")}</span>` : ""}
        ${f.group ? `<span class="badge badge--macro">${t("common.group")}</span>` : ""}
      </div>
      <h1>${esc(f.name)}</h1>
      <div class="detail-head__alt">${esc(tx(PERIPH_MAP[f.p] || {}))}${f.eq ? ` · ${t("fn.equiv")}: ${esc(FUNCTION_MAP[f.eq]?.name || "")}` : ""}</div>
    </div>
    <div class="detail-head__actions">
      ${starBtn("fn", f.id)}
    </div>
  </div>

  <div style="margin-top:18px">
    ${codeBlock(f.sig, { name: f.header, actions: copyBtn(f.sig) })}
  </div>

  <div class="detail-grid">
    <div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      <section>
        <div class="sec-title">${t("fn.what")}</div>
        <div class="card brief">
          <p class="brief__zh">${esc(tx({ zh: f.zh, en: f.en }))}</p>
          <div class="brief__alt">
            <div class="brief__alt-label">${t("fn.translation")}</div>
            ${esc(other)}
          </div>
        </div>
      </section>

      ${(f.params && f.params.length) ? `
      <section>
        <div class="sec-title">${t("fn.params")} · ${f.params.length}</div>
        <div class="param-table">
          ${f.params.map(param => `
            <div class="param-row">
              <div class="param-name">${esc(param[0])}</div>
              <div class="param-desc">${esc(param[state.lang === "zh" ? 1 : 2] || "")}
                <small>${esc(param[state.lang === "zh" ? 2 : 1] || "")}</small>
              </div>
            </div>`).join("")}
        </div>
      </section>` : ""}

      ${related.length ? `
      <section>
        <div class="sec-title">${t("fn.related")}</div>
        <div class="pill-list">
          ${related.map(r => `<a class="fnchip ${r.lib === "std" ? "fnchip--std" : ""}" href="${fnHref(r.id)}"><span class="fnchip__dot"></span>${esc(r.name)}</a>`).join("")}
        </div>
      </section>` : ""}

      <section>
        <div class="sec-title">${t("fn.usedIn")} · ${used.length}</div>
        ${used.length ? `<div class="used-list">${used.map(({ wf, step }) => `
          <a class="used-item" href="${wfHref(wf.id)}">
            <span class="used-item__step">${t("wf.step", { n: step })}</span>
            <span style="min-width:0">
              <span class="used-item__title">${esc(tx(wf.title))}</span>
              <span class="used-item__sub">${wf.steps.length} ${t("common.steps")} · ${pcode(wf.p)}</span>
            </span>
            ${icon("chevronRight")}
          </a>`).join("")}</div>` : `<div class="card eq-empty">${t("fn.usedInNone")}</div>`}
      </section>
    </div>

    <aside class="detail-aside">
      <div class="card meta-card">
        <div class="meta-card__row"><span class="meta-card__key">${t("fn.header")}</span><span class="meta-card__val">${esc(f.header)}</span></div>
        <div class="meta-card__row"><span class="meta-card__key">${t("fn.returns")}</span><span class="meta-card__val">${esc(f.ret?.[state.lang === "zh" ? 0 : 1] || "—")}</span></div>
        <div class="meta-card__row"><span class="meta-card__key">${t("fn.type")}</span><span class="meta-card__val">${esc(kind)}</span></div>
        <div class="meta-card__row"><span class="meta-card__key">${t("common.peripheral")}</span><span class="meta-card__val">${esc(pcode(f.p))}</span></div>
      </div>
      <div style="font-size:10.5px;color:var(--faint);line-height:1.6;padding:0 2px">${t("fn.headerNote")}</div>

      <div>
        <div class="sec-title">${t("fn.equiv")}</div>
        ${eq ? `<div class="card eq-card">
          <a class="eq-side" href="${fnHref(f.id)}">
            <span class="eq-side__label">${f.lib === "std" ? t("common.std") : "HAL"}</span>
            <span class="eq-side__name">${esc(f.name)}</span>
          </a>
          <span class="eq-arrow">${icon("arrows")}</span>
          <a class="eq-side" href="${fnHref(eq.id)}">
            <span class="eq-side__label">${eq.lib === "std" ? t("common.std") : "HAL"}</span>
            <span class="eq-side__name">${esc(eq.name)}</span>
          </a>
        </div>` : `<div class="card eq-empty">${t("fn.equivNone")}</div>`}
      </div>

      ${(f.tags && f.tags.length) ? `<div>
        <div class="sec-title">${t("fn.tags")}</div>
        <div class="pill-list">${f.tags.slice(0, 6).map(tag => `<span class="badge">${esc(tag)}</span>`).join("")}</div>
      </div>` : ""}
    </aside>
  </div>`;
}

/* ============================================================
   workflows list
   ============================================================ */
function viewWorkflows(query) {
  const level = query.get("level") || "all";
  const p = query.get("p") || "all";
  const list = WORKFLOWS
    .filter(w => (level === "all" || String(w.level) === level) && (p === "all" || w.p === p))
    .sort((a, b) => a.level - b.level);

  return `
  <div class="page-head">
    <div class="eyebrow">${t("nav.workflows")}</div>
    <h1>${t("wf.title")}</h1>
    <p class="lead">${t("wf.lead")}</p>
  </div>

  <div class="toolbar">
    <div class="toolbar__row">
      <span class="search-count">${t("wf.count", { n: list.length })}</span>
      <div class="seg seg--mono" role="group" aria-label="${t("wf.level")}">
        ${[["all", t("common.all")], ["1", levelName(1)], ["2", levelName(2)], ["3", levelName(3)]].map(([value, label]) =>
    `<button type="button" data-level="${value}" class="${level === value ? "active" : ""}">${esc(label)}</button>`).join("")}
      </div>
    </div>
    <div class="chip-row" role="group" aria-label="${t("fn.filterPeriph")}">
      ${[["all", t("common.all"), WORKFLOWS.length], ...PERIPH_COUNTS.filter(x => x.workflows).map(x => [x.id, x.short, x.workflows])].map(([id, label, count]) => `
        <button type="button" class="chip ${p === id ? "is-active" : ""}" data-p="${id}"
          style="--c:${id === "all" ? "var(--accent)" : PERIPH_MAP[id].accent}">
          ${esc(label)}<span class="chip__n">${count}</span>
        </button>`).join("")}
    </div>
  </div>

  ${list.length ? `<div class="flow-grid">${list.map(wfCard).join("")}</div>` : `<div class="empty">${icon("flow")}<h3>${t("fn.empty")}</h3><p>${t("fn.emptyHint")}</p></div>`}
  `;
}

/* ============================================================
   workflow detail
   ============================================================ */
const STEP_KIND = { start: "wf.start", end: "wf.end", isr: "wf.isr", check: "wf.check", step: "wf.stepKind" };

function viewWorkflow(wf) {
  const callIds = [...new Set(wf.steps.flatMap(s => s.fn || []))];
  const calls = callIds.map(id => FUNCTION_MAP[id]).filter(Boolean);

  return `
  <a class="backlink" href="#/workflows">${icon("arrowLeft")}${t("common.back")} · ${t("nav.workflows")}</a>

  <div class="detail-head">
    <div class="detail-head__main">
      <div class="detail-head__tags">
        ${pchip(wf.p)}
        <span class="badge">${levelName(wf.level)}</span>
        <span class="badge badge--count">${wf.steps.length} ${t("common.steps")}</span>
        <span class="badge badge--count">${calls.length} ${t("common.functions")}</span>
      </div>
      <h1 class="title-sans">${esc(tx(wf.title))}</h1>
      <div class="wf-head__alt">${esc(alt(wf.title))}</div>
      <p class="wf-head__goal">${esc(tx(wf.goal))}</p>
    </div>
    <div class="detail-head__actions">
      ${starBtn("wf", wf.id)}
    </div>
  </div>

  <div class="tabs" role="tablist">
    ${[["flow", "wf.flow", wf.steps.length], ["steps", "wf.stepsTab", wf.steps.length], ["code", "wf.codeTab", null], ["notes", "wf.notesTab", (wf.pitfalls || []).length]]
      .map(([key, label, count]) => `<button type="button" role="tab" class="tab ${state.wfTab === key ? "is-active" : ""}"
        aria-selected="${state.wfTab === key}" data-tab="${key}">${t(label)}${count ? `<span class="tab__n">${count}</span>` : ""}</button>`).join("")}
  </div>

  ${state.wfTab === "flow" ? workflowFlow(wf) : ""}
  ${state.wfTab === "steps" ? workflowSteps(wf) : ""}
  ${state.wfTab === "code" ? workflowCode(wf) : ""}
  ${state.wfTab === "notes" ? workflowNotes(wf, calls) : ""}
  `;
}

function workflowFlow(wf) {
  const nodeWidth = 430;
  const nodes = wf.steps.map((step, index) => {
    const kind = step.kind || "step";
    return `<div class="flow-node flow-node--${kind}" data-step="${index}">
      <div class="flow-node__top">
        <span class="flow-node__n">${index + 1}</span>
        <span class="flow-node__title">${esc(tx(step.title))}</span>
        <span class="flow-node__kind">${esc(t(STEP_KIND[kind] || "wf.stepKind"))}</span>
      </div>
      <div class="flow-node__desc">${esc(tx(step.desc))}</div>
      ${(step.fn || []).length ? `<div class="flow-node__fns">${step.fn.map(id => {
        const f = FUNCTION_MAP[id];
        if (!f) return "";
        return `<a class="fnchip ${f.lib === "std" ? "fnchip--std" : ""}" href="${fnHref(id)}" title="${esc(f.name)}"><span class="fnchip__dot"></span>${esc(f.name)}</a>`;
      }).join("")}</div>` : ""}
    </div>`;
  }).join("");

  return `<div class="flow-wrap">
    <div class="flow-toolbar">
      <span class="flow-toolbar__hint">${icon("info")} ${t("wf.flowHint")}</span>
      <div class="flow-toolbar__zoom">
        <button class="icon-action" type="button" data-zoom="out" title="${t("wf.zoomOut")}" aria-label="${t("wf.zoomOut")}">${icon("zoomOut")}</button>
        <span class="flow-zoom-value" id="flowZoom">100%</span>
        <button class="icon-action" type="button" data-zoom="in" title="${t("wf.zoomIn")}" aria-label="${t("wf.zoomIn")}">${icon("zoomIn")}</button>
        <button class="icon-action" type="button" data-zoom="fit" title="${t("wf.fit")}" aria-label="${t("wf.fit")}">${icon("fit")}</button>
      </div>
    </div>
    <div class="flow-viewport" id="flowViewport" data-width="${nodeWidth}">
      <div class="flow-canvas" id="flowCanvas">
        <svg class="flow-links" id="flowLinks" aria-hidden="true"></svg>
        ${nodes}
      </div>
      <div class="flow-scroll" id="flowScroll" aria-hidden="true"><span id="flowThumb"></span></div>
    </div>
  </div>`;
}

function workflowSteps(wf) {
  return `<div class="toolbar" style="position:static;margin:0 0 14px;background:none">
    <div class="toolbar__row">
      <div class="seg seg--mono" role="group" aria-label="${t("common.std")} / HAL">
        <button type="button" data-codelib="std" class="${state.codeLib === "std" ? "active" : ""}">${t("common.std")}</button>
        <button type="button" data-codelib="hal" class="${state.codeLib === "hal" ? "active" : ""}">HAL</button>
      </div>
      <span class="search-count">${t("wf.snippet")}</span>
    </div>
  </div>
  <div class="step-list">
    ${wf.steps.map((step, index) => {
      const kind = step.kind || "step";
      return `<div class="step-item">
        <div class="step-rail"><span class="step-rail__n">${index + 1}</span><span class="step-rail__line"></span></div>
        <div class="step-body">
          <h3>${esc(tx(step.title))}
            ${kind !== "step" ? `<span class="step-kind step-kind--${kind}">${esc(t(STEP_KIND[kind] || "wf.stepKind"))}</span>` : ""}
          </h3>
          <p>${esc(tx(step.desc))}</p>
          ${(step.fn || []).length ? `<div class="pill-list">${step.fn.map(id => {
        const f = FUNCTION_MAP[id];
        if (!f) return "";
        return `<a class="fnchip ${f.lib === "std" ? "fnchip--std" : ""}" href="${fnHref(id)}"><span class="fnchip__dot"></span>${esc(f.name)}</a>`;
      }).join("")}</div>` : ""}
          ${step.code ? `<div class="step-code">${codeBlock(step.code[state.codeLib] || step.code.std || step.code.hal || "", { name: state.codeLib === "std" ? "SPL" : "HAL" })}</div>` : ""}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function workflowCode(wf) {
  const code = wf.code?.[state.codeLib] || "";
  return `<div class="toolbar" style="position:static;margin:0 0 12px;background:none">
    <div class="toolbar__row">
      <div class="seg seg--mono" role="group" aria-label="${t("common.std")} / HAL">
        <button type="button" data-codelib="std" class="${state.codeLib === "std" ? "active" : ""}">${t("common.std")}</button>
        <button type="button" data-codelib="hal" class="${state.codeLib === "hal" ? "active" : ""}">HAL</button>
      </div>
      <span class="search-count">${state.codeLib === "std" ? t("common.stdFull") : t("common.halFull")}</span>
      <button class="btn btn--sm" type="button" data-copy="${esc(encodeURIComponent(code))}" style="margin-left:auto">${icon("copy")}${t("wf.copyAll")}</button>
    </div>
  </div>
  ${codeBlock(code, { name: tx(wf.title), actions: copyBtn(code) })}`;
}

function workflowNotes(wf, calls) {
  const related = (wf.related || []).map(id => WORKFLOW_MAP[id]).filter(Boolean);
  return `
  <div style="display:flex;flex-direction:column;gap:26px">
    <section>
      <div class="sec-title">${t("wf.pitfalls")}</div>
      ${(wf.pitfalls || []).length ? `<div class="pitfall-list">${wf.pitfalls.map(item => `
        <div class="pitfall">${icon("alert")}<p>${esc(tx(item))}<small>${esc(alt(item))}</small></p></div>`).join("")}</div>`
      : `<div class="card eq-empty">${t("wf.notesEmpty")}</div>`}
    </section>

    <section>
      <div class="sec-title">${t("wf.funcUsed")} · ${calls.length}</div>
      <div class="pill-list">${calls.map(f => `<a class="fnchip ${f.lib === "std" ? "fnchip--std" : ""}" href="${fnHref(f.id)}"><span class="fnchip__dot"></span>${esc(f.name)}</a>`).join("")}</div>
    </section>

    ${related.length ? `<section>
      <div class="sec-title">${t("wf.related")}</div>
      <div class="flow-grid">${related.map(wfCard).join("")}</div>
    </section>` : ""}
  </div>`;
}

/* ============================================================
   flow chart layout / pan / zoom
   ============================================================ */
const flowState = { scale: 1, tx: 0, ty: 0, cw: 0, ch: 0, vw: 0, vh: 0, ready: false };

function layoutFlow(wf) {
  const viewport = $("#flowViewport");
  const canvas = $("#flowCanvas");
  const svg = $("#flowLinks");
  if (!viewport || !canvas || !svg) return;

  const nodes = [...canvas.querySelectorAll(".flow-node")];
  if (!nodes.length) return;

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const nodeW = Math.min(Number(viewport.dataset.width) || 430, Math.max(280, vw - 96));
  const cw = Math.max(vw, nodeW + 72);
  let y = 26;
  const gap = 56;
  const positions = [];

  nodes.forEach(node => { node.style.width = nodeW + "px"; });

  nodes.forEach((node, index) => {
    const h = node.offsetHeight;
    const x = Math.round((cw - nodeW) / 2);
    node.style.left = x + "px";
    node.style.top = y + "px";
    positions.push({ x, y, h });
    y += h + gap;
  });

  const ch = Math.max(vh, y - gap + 28);
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  svg.setAttribute("viewBox", `0 0 ${cw} ${ch}`);
  svg.setAttribute("width", cw);
  svg.setAttribute("height", ch);

  let paths = "";
  for (let i = 0; i < positions.length - 1; i++) {
    const a = positions[i];
    const b = positions[i + 1];
    const x1 = a.x + nodeW / 2;
    const x2 = b.x + nodeW / 2;
    const y1 = a.y + a.h;
    const y2 = b.y;
    const kind = wf.steps[i + 1]?.kind || "step";
    const cls = kind === "isr" ? "flow-link--isr" : "";
    paths += `<path class="${cls}" d="M${x1} ${y1} V${y2 - 9}"/>`;
    paths += `<path class="arrow-head" d="M${x2 - 4.5} ${y2 - 10} L${x2 + 4.5} ${y2 - 10} L${x2} ${y2 - 1} Z"/>`;
  }
  svg.innerHTML = paths;

  flowState.cw = cw;
  flowState.ch = ch;
  flowState.vw = vw;
  flowState.vh = vh;
  flowState.ready = true;
  resetFlowView();
}

function applyFlow() {
  const canvas = $("#flowCanvas");
  if (!canvas) return;
  canvas.style.transform = `translate(${flowState.tx}px, ${flowState.ty}px) scale(${flowState.scale})`;
  const label = $("#flowZoom");
  if (label) label.textContent = Math.round(flowState.scale * 100) + "%";
  const bar = $("#flowScroll");
  const thumb = $("#flowThumb");
  if (bar && thumb) {
    const sh = flowState.ch * flowState.scale;
    const visible = sh > flowState.vh + 2;
    bar.classList.toggle("is-on", visible);
    if (visible) {
      const ratio = Math.max(0.12, flowState.vh / sh);
      thumb.style.height = Math.round(ratio * 100) + "%";
      const top = (-flowState.ty / sh) * 100;
      thumb.style.top = Math.min(100 - ratio * 100, Math.max(0, top)) + "%";
    }
  }
}

function clampFlow() {
  if (!flowState.ready) return;
  const sw = flowState.cw * flowState.scale;
  const sh = flowState.ch * flowState.scale;
  const pad = 24;
  if (sw <= flowState.vw) flowState.tx = Math.round((flowState.vw - sw) / 2);
  else flowState.tx = Math.min(pad, Math.max(flowState.vw - sw - pad, flowState.tx));
  if (sh <= flowState.vh) flowState.ty = Math.round((flowState.vh - sh) / 2);
  else flowState.ty = Math.min(pad, Math.max(flowState.vh - sh - pad, flowState.ty));
}

/* open a flow at a readable width-fit zoom, top aligned */
function resetFlowView() {
  if (!flowState.ready) return;
  const scale = Math.min(1, Math.max(0.55, (flowState.vw - 48) / flowState.cw));
  flowState.scale = scale;
  flowState.tx = Math.round((flowState.vw - flowState.cw * scale) / 2);
  flowState.ty = 16;
  clampFlow();
  applyFlow();
}

function fitFlow() {
  if (!flowState.ready) return;
  const { cw, ch, vw, vh } = flowState;
  const scale = Math.min(1.05, (vw - 36) / cw, (vh - 36) / ch);
  flowState.scale = Math.max(0.3, scale);
  flowState.tx = Math.round((vw - cw * flowState.scale) / 2);
  flowState.ty = Math.round((vh - ch * flowState.scale) / 2);
  applyFlow();
}

function zoomFlow(factor, originX, originY) {
  const viewport = $("#flowViewport");
  if (!viewport || !flowState.ready) return;
  const rect = viewport.getBoundingClientRect();
  const px = originX ?? rect.width / 2;
  const py = originY ?? rect.height / 2;
  const next = Math.min(1.7, Math.max(0.3, flowState.scale * factor));
  flowState.tx = px - (px - flowState.tx) * (next / flowState.scale);
  flowState.ty = py - (py - flowState.ty) * (next / flowState.scale);
  flowState.scale = next;
  clampFlow();
  applyFlow();
}

function bindFlowInteractions() {
  const viewport = $("#flowViewport");
  if (!viewport) return;

  viewport.addEventListener("wheel", event => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const rect = viewport.getBoundingClientRect();
      const factor = Math.exp(-event.deltaY * 0.0018);
      zoomFlow(factor, event.clientX - rect.left, event.clientY - rect.top);
      return;
    }
    const dx = event.shiftKey ? -event.deltaY : -event.deltaX;
    const dy = event.shiftKey ? 0 : -event.deltaY;
    flowState.tx += dx;
    flowState.ty += dy;
    clampFlow();
    applyFlow();
  }, { passive: false });

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let baseX = 0;
  let baseY = 0;

  viewport.addEventListener("pointerdown", event => {
    if (event.target.closest("a, button")) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    baseX = flowState.tx;
    baseY = flowState.ty;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", event => {
    if (!dragging) return;
    flowState.tx = baseX + (event.clientX - startX);
    flowState.ty = baseY + (event.clientY - startY);
    applyFlow();
  });

  const end = () => {
    if (dragging) {
      clampFlow();
      applyFlow();
    }
    dragging = false;
    viewport.classList.remove("is-dragging");
  };
  viewport.addEventListener("pointerup", end);
  viewport.addEventListener("pointercancel", end);
  viewport.addEventListener("pointerleave", event => { if (dragging) end(); });
}

/* ============================================================
   map
   ============================================================ */
function viewMap(query) {
  const p = query.get("p") || "all";
  const rows = EQUIVALENCES.filter(row => p === "all" || row.periph === p);
  const groups = PERIPHERALS
    .filter(meta => p === "all" || meta.id === p)
    .map(meta => ({ meta, rows: rows.filter(row => row.periph === meta.id) }))
    .filter(group => group.rows.length);

  return `
  <div class="page-head">
    <div class="eyebrow">${t("nav.map")}</div>
    <h1>${t("map.title")}</h1>
    <p class="lead">${t("map.lead")}</p>
  </div>

  <div class="toolbar">
    <div class="chip-row" role="group" aria-label="${t("map.filter")}">
      ${[["all", t("common.all"), EQUIVALENCES.length], ...PERIPH_COUNTS.filter(x => x.std && x.hal).map(x => [x.id, x.short, EQUIVALENCES.filter(r => r.periph === x.id).length])].map(([id, label, count]) => `
        <button type="button" class="chip ${p === id ? "is-active" : ""}" data-p="${id}"
          style="--c:${id === "all" ? "var(--accent)" : PERIPH_MAP[id].accent}">
          ${esc(label)}<span class="chip__n">${count}</span>
        </button>`).join("")}
    </div>
    <div class="search-hints" style="margin:0">${icon("info")} ${t("map.hint")}</div>
  </div>

  ${groups.map(group => `
    <section class="map-group">
      <div class="map-head">
        ${pchip(group.meta.id)}
        <span class="map-head__title">${esc(tx(group.meta))}</span>
        <span class="map-head__line"></span>
        <span class="map-head__title">${group.rows.length}</span>
      </div>
      <div class="map-table">
        <div class="map-row map-row--head">
          <span>${t("map.std")}</span><span></span><span>HAL</span>
        </div>
        ${group.rows.map(row => `
          <div class="map-row">
            <a class="map-cell" href="${fnHref(row.std.id)}">
              <span class="map-cell__name">${esc(row.std.name)}</span>
              <span class="map-cell__brief">${esc(tx({ zh: row.std.zh, en: row.std.en }))}</span>
            </a>
            <span class="eq-arrow">${icon("arrowRight")}</span>
            <a class="map-cell" href="${fnHref(row.hal.id)}">
              <span class="map-cell__name">${esc(row.hal.name)}</span>
              <span class="map-cell__brief">${esc(tx({ zh: row.hal.zh, en: row.hal.en }))}</span>
            </a>
          </div>`).join("")}
      </div>
    </section>`).join("") || `<div class="empty">${icon("map")}<h3>${t("map.empty")}</h3></div>`}
  `;
}

/* ============================================================
   favorites
   ============================================================ */
function viewFavorites() {
  const keys = [...state.favs];
  const fns = keys.filter(k => k.startsWith("fn:")).map(k => FUNCTION_MAP[k.slice(3)]).filter(Boolean);
  const wfs = keys.filter(k => k.startsWith("wf:")).map(k => WORKFLOW_MAP[k.slice(3)]).filter(Boolean);

  return `
  <div class="page-head">
    <div class="eyebrow">${t("nav.favorites")}</div>
    <h1>${t("fav.title")}</h1>
    <p class="lead">${t("fav.lead")}</p>
  </div>
  ${(fns.length || wfs.length) ? `
    ${fns.length ? `<div class="sec-head"><h2>${t("search.functions")}</h2><span class="sec-head__meta">${fns.length}</span></div>
      <div class="fn-list">${fns.map(fnRow).join("")}</div>` : ""}
    ${wfs.length ? `<div class="sec-head"><h2>${t("search.workflows")}</h2><span class="sec-head__meta">${wfs.length}</span></div>
      <div class="flow-grid">${wfs.map(wfCard).join("")}</div>` : ""}
  ` : `<div class="empty">${icon("star")}<h3>${t("fav.empty")}</h3><p>${t("fav.emptyHint")}</p>
      <a class="btn btn--sm" href="#/functions">${t("nav.functions")}</a></div>`}
  `;
}

/* ============================================================
   江协教程经典案例（#/cases）
   ============================================================ */

const bil = (zh, en) => (state.lang === "en" ? en : zh);

const caseTags = item => {
  const tags = [`<span class="tag">${icon(item.icon)}${bil("难度", "Lv")} ${item.level}</span>`];
  (item.related?.kb || []).forEach(id => {
    const art = KB_MAP[id];
    if (art) tags.push(`<span class="tag">${icon("layers")}${esc(tx(art.title))}</span>`);
  });
  return tags.join("");
};

function viewCases() {
  const cards = CASES.map(c => `
    <a class="case-card" href="#/cases/${c.id}">
      <div class="case-card__head">
        ${icon(c.icon)}<span class="case-card__lv">${bil("难度", "Lv")} ${c.level}</span>
      </div>
      <div class="case-card__title">${esc(tx(c.title))}</div>
      <div class="case-card__goal">${esc(tx(c.goal))}</div>
      <div class="case-card__foot">
        <span class="case-card__tag">${pcode(c.p) || bil("案例", "case")}</span>
        ${icon("chevronRight")}
      </div>
    </a>`).join("");

  return `<div class="page-head">
    <div class="eyebrow">${t("cases.eyebrow")}</div>
    <h1>${t("cases.title")}</h1>
    <p class="lead">${t("cases.goal")}</p>
  </div>
  <div class="case-grid">${cards}</div>`;
}

/* ============================================================
   江协教程案例（#/cases）：电路 + 模拟运行 + 源码
   ============================================================ */

/* 一个案例的模拟会话：模型推进 + 局部重绘（不整页重渲染） */
const caseSim = {
  item: null, model: null, raf: 0, last: 0, acc: 0, paintAt: 0,
  running: true, mounted: false, values: {}, counts: {}, held: {},
  src: 0, notice: ""
};

const CASE_PAINT_MS = 90;

/** 把模块说明按当前语言展开成数组（renderer 只吃数组） */
function caseLayout(item) {
  return {
    ...item,
    modules: (item.modules || []).map(m => ({
      ...m,
      lines: m.lines ? (m.lines[state.lang] || m.lines.zh || []) : []
    }))
  };
}

function fmtVal(value, fmt, unit) {
  if (value === undefined || value === null || value === "") return "—";
  switch (fmt) {
    case "bool": return value ? bil("是", "yes") : bil("否", "no");
    case "dark": return value ? bil("暗 → 响", "dark → beep") : bil("亮 → 静音", "lit → quiet");
    case "v": return `${Number(value).toFixed(2)} ${unit || "V"}`;
    case "ma": return `${Number(value).toFixed(2)} mA`;
    case "pct": return `${Math.round(value)}%`;
    case "deg": return `${Math.round(value)}°`;
    case "hex": return `0x${(Number(value) >>> 0).toString(16).toUpperCase().padStart(4, "0")}`;
    case "raw": return String(value);
    default: return unit ? `${value} ${unit}` : String(value);
  }
}

/* ---------- 局部片段 ---------- */

function caseControlsHTML(item) {
  const controls = item.controls || [];
  if (!controls.length) return `<p class="case-none">${bil("这个案例按原程序自动运行，没有可调参数。", "This program runs by itself — nothing to tweak.")}</p>`;
  return controls.map(c => {
    if (c.kind === "range") {
      const value = caseSim.values[c.key] ?? c.def ?? 0;
      return `<label class="case-ctrl">
        <span class="case-ctrl__label">${esc(bil(c.zh, c.en))}</span>
        <input type="range" data-case-range="${c.key}" data-unit="${esc(c.unit || "")}" min="${c.min ?? 0}" max="${c.max ?? 100}"
          step="${c.step ?? 1}" value="${value}" aria-label="${esc(bil(c.zh, c.en))}">
        <span class="case-ctrl__value" data-case-out="${c.key}">${value}${esc(c.unit || "")}</span>
      </label>`;
    }
    if (c.kind === "button") {
      return `<button class="case-ctrl__btn" type="button" data-case-btn="${c.key}">
        ${icon("pin")}<span>${esc(bil(c.zh, c.en))}</span>
        <em data-case-count="${c.key}">${caseSim.counts[c.key] || 0}</em></button>`;
    }
    if (c.kind === "serial") {
      return `<form class="case-serial" data-case-form>
        <input type="text" data-case-input autocomplete="off" spellcheck="false"
          placeholder="${esc(bil(c.placeholder?.zh || "输入后回车", c.placeholder?.en || "type and press Enter"))}"
          aria-label="${esc(bil(c.zh, c.en))}">
        <button type="submit" class="btn btn--sm">${icon("arrowRight")}<span>${bil("发送", "Send")}</span></button>
      </form>`;
    }
    return "";
  }).join("");
}

function caseReadoutsHTML(item, live) {
  return (item.readouts || []).map(r => {
    const raw = live?.values?.[r.key];
    const active = raw === true || (typeof raw === "number" && raw > 0);
    return `<div class="case-ro ${active ? "is-on" : ""}">
      <span class="case-ro__k">${esc(bil(r.zh, r.en))}</span>
      <span class="case-ro__v">${esc(fmtVal(raw, r.fmt, r.unit))}</span>
    </div>`;
  }).join("");
}

function caseScreenHTML(item, live) {
  const hasScreen = (item.modules || []).some(m => /OLED/i.test(m.key + " " + (m.ref || "")));
  if (!hasScreen) return "";
  const scr = live?.screen;
  const lines = ((Array.isArray(scr) ? scr : scr?.lines) || []).slice(0, 4);
  const rows = [0, 1, 2, 3].map(i => `<div class="oled__row">${esc(lines[i] || "")}</div>`).join("");
  return `<div class="oled">
    <div class="oled__screen">${rows}</div>
    <div class="oled__note">OLED1 · 128×64 · ${bil("软件 I²C", "soft I²C")}</div>
  </div>`;
}

function caseLogHTML(item, live) {
  const hasSerial = (item.controls || []).some(c => c.kind === "serial") ||
    (item.modules || []).some(m => /U3|USB|串口/i.test(m.key + " " + (m.ref || "")));
  if (!hasSerial) return "";
  const log = (live?.log || []).slice(-9);
  return `<div class="case-log" aria-live="polite">${log.length
    ? log.map(l => `<div class="case-log__row case-log__row--${l.dir === "out" ? "out" : "in"}">
        <span class="case-log__mark">${l.dir === "out" ? "→" : "←"}</span>
        <span>${esc(l.text)}</span>
        ${l.code !== undefined ? `<em>${esc(String(l.code))}</em>` : ""}</div>`).join("")
    : `<div class="case-log__row is-idle">${bil("监视器已就绪，发送一个字符试试", "Monitor ready — send a character")}</div>`}</div>`;
}

function caseSourceHTML(item) {
  const sources = caseSources(item.folder, item.files || []);
  if (!sources.length) return `<p class="case-none">${bil("没有收录源码。", "No source captured.")}</p>`;
  const pick = Math.min(caseSim.src, sources.length - 1);
  const file = sources[pick];
  const tabs = sources.map((s, i) => `<button class="src-tab ${i === pick ? "is-active" : ""}"
    type="button" data-src="${i}">${esc(s.path)}</button>`).join("");
  return `<div class="src-tabs" role="tablist">${tabs}</div>
    <div id="caseCode">${codeBlock(file.text, { name: file.path, lang: "C" })}</div>`;
}

function viewCaseDetail(item) {
  if (!item) return viewNotFound();

  const explain = (item.explain || []).map(e => `<p>${esc(tx(e))}</p>`).join("");
  const calls = (item.related?.functions || []).map(id => FUNCTION_MAP[id]).filter(Boolean);
  const flows = (item.related?.workflows || []).map(id => WORKFLOW_MAP[id]).filter(Boolean);
  const kbBits = (item.related?.kb || []).map(id => KB_MAP[id]).filter(Boolean);
  const local = caseLayout(item);

  return `<a class="backlink" href="#/cases">${icon("arrowLeft")}${bil("全部案例", "All cases")}</a>
  <div class="detail-head">
    <div class="detail-head__main">
      <div class="detail-head__tags">${pchip(item.p)}${caseTags(item)}</div>
      <h1>${esc(tx(item.title))}</h1>
      <div class="wf-head__alt">${esc(alt(item.title))}</div>
      <p class="wf-head__goal">${esc(tx(item.goal))}</p>
      <div class="case-dir">${icon("drive")}<span>${esc(item.folder)}</span></div>
    </div>
    <div class="detail-head__actions"></div>
  </div>

  <div class="case-stage" id="caseStage">
    <div class="case-live">
      <section class="doc-panel case-panel--circuit">
        <header class="doc-panel__head">
          ${icon("chip")}<span class="doc-panel__title">${bil("电路与接线", "Circuit")}</span>
          <span class="case-panel__hint">${bil("点击引脚可查定义", "click a pin for its definition")}</span>
        </header>
        <div class="case-circuit" id="caseCircuit">${circuitSvg(local, null)}</div>
        <div class="case-ctrlbar" id="caseCtrls">${caseControlsHTML(item)}</div>
      </section>
      <section class="doc-panel">
        <header class="doc-panel__head">
          ${icon("activity")}<span class="doc-panel__title">${bil("实时读数", "Live readouts")}</span>
          <button class="case-run" type="button" data-case-run="toggle" id="caseRunBtn">${icon("pause")}<span>${bil("暂停", "Pause")}</span></button>
        </header>
        <div class="case-readouts" id="caseReadouts"></div>
        <div id="caseScreen"></div>
        <div id="caseLog"></div>
      </section>
    </div>
  </div>

  <div class="doc-grid">
    <div class="doc-col">
      <section class="doc-panel">
        <header class="doc-panel__head">${icon("code")}<span class="doc-panel__title">${bil("教程原版源码", "Tutorial source")}</span></header>
        <div class="doc-panel__body" id="caseSource">${caseSourceHTML(item)}</div>
      </section>
    </div>
    <div class="doc-col">
      <section class="doc-panel">
        <header class="doc-panel__head">${icon("info")}<span class="doc-panel__title">${bil("为什么要这样", "Why it works")}</span></header>
        <div class="doc-notes">${explain}</div>
      </section>
      <section class="doc-panel">
        <header class="doc-panel__head">${icon("target")}<span class="doc-panel__title">${bil("动手改一下", "Try this")}</span></header>
        <div class="doc-panel__body"><p class="case-check">${esc(tx(item.check))}</p></div>
      </section>
      <section class="doc-panel">
        <header class="doc-panel__head">${icon("link")}<span class="doc-panel__title">${bil("相关条目", "Related")}</span></header>
        <div class="doc-panel__body">
          ${kbBits.length ? `<div class="kb-side__title">${t("nav.kb")}</div>
            ${kbBits.map(a => `<a class="kb-side__link" href="#/kb/${a.id}">${icon("layers")}<span>${esc(tx(a.title))}</span></a>`).join("")}` : ""}
          ${calls.length ? `<div class="kb-side__title">${t("kb.relatedFns")}</div>
            ${calls.map(f => `<a class="kb-side__link" href="${fnHref(f.id)}">${icon("code")}<span>${esc(f.name)}</span></a>`).join("")}` : ""}
          ${flows.length ? `<div class="kb-side__title">${t("kb.relatedFlows")}</div>
            ${flows.map(w => `<a class="kb-side__link" href="${wfHref(w.id)}">${icon("flow")}<span>${esc(tx(w.title))}</span></a>`).join("")}` : ""}
        </div>
      </section>
    </div>
  </div>`;
}

/* ---------- 模拟运行 ---------- */

function caseStart(item) {
  caseSim.item = item;
  caseSim.model = createModel(item, () => caseSim);
  caseSim.values = {};
  caseSim.counts = {};
  caseSim.held = {};
  caseSim.src = 0;
  caseSim.running = true;
  caseSim.last = 0;
  caseSim.paintAt = 0;
  caseSim.mounted = true;

  for (const c of item.controls || []) {
    if (c.kind === "range") caseSim.values[c.key] = c.def ?? c.min ?? 0;
    if (c.kind === "button") caseSim.counts[c.key] = 0;
  }

  casePaint();

  const loop = ts => {
    if (!caseSim.mounted) return;
    if (!caseSim.last) caseSim.last = ts;
    const dt = Math.min((ts - caseSim.last) / 1000, 0.12);
    caseSim.last = ts;
    if (caseSim.running) caseSim.model.step(dt);
    if (ts - caseSim.paintAt > CASE_PAINT_MS) {
      caseSim.paintAt = ts;
      casePaint();
    }
    caseSim.raf = requestAnimationFrame(loop);
  };
  caseSim.raf = requestAnimationFrame(loop);
}

function caseStop() {
  if (caseSim.raf) cancelAnimationFrame(caseSim.raf);
  caseSim.raf = 0;
  caseSim.mounted = false;
  caseSim.item = null;
  caseSim.model = null;
}

function casePaint(live) {
  if (!caseSim.mounted || !caseSim.item) return;
  const view = live || caseSim.model.view();
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set("caseCircuit", circuitSvg(caseLayout(caseSim.item), view));
  set("caseReadouts", caseReadoutsHTML(caseSim.item, view));
  set("caseScreen", caseScreenHTML(caseSim.item, view));
  set("caseLog", caseLogHTML(caseSim.item, view));
  const btn = document.querySelector("#caseRunBtn");
  if (btn) btn.innerHTML = `${icon(caseSim.running ? "pause" : "play")}<span>${caseSim.running ? bil("暂停", "Pause") : bil("继续", "Resume")}</span>`;
}

function caseInput(event) {
  const key = event.target.dataset.caseRange;
  if (!key) return;
  caseSim.values[key] = Number(event.target.value);
  const out = document.querySelector(`[data-case-out="${key}"]`);
  if (out) out.textContent = `${caseSim.values[key]}${event.target.dataset.unit || ""}`;
  casePaint();
}

function casePress(key, down) {
  if (!caseSim.model || !key) return;
  caseSim.held[key] = down;
  if (down) caseSim.counts[key] = (caseSim.counts[key] || 0) + 1;
  const counter = document.querySelector(`[data-case-count="${key}"]`);
  if (counter) counter.textContent = caseSim.counts[key] || 0;
  casePaint();
}

function bindCaseUi() {
  const stage = document.getElementById("caseStage");
  if (!stage) return;

  stage.addEventListener("input", caseInput);

  stage.addEventListener("pointerdown", event => {
    const btn = event.target.closest("[data-case-btn]");
    if (!btn) return;
    event.preventDefault();
    casePress(btn.dataset.caseBtn, true);
    btn.classList.add("is-down");
  });

  const release = event => {
    stage.querySelectorAll("[data-case-btn].is-down").forEach(btn => {
      btn.classList.remove("is-down");
      casePress(btn.dataset.caseBtn, false);
    });
    void event;
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("pointerleave", release);

  stage.addEventListener("submit", event => {
    const form = event.target.closest("[data-case-form]");
    if (!form) return;
    event.preventDefault();
    const input = form.querySelector("[data-case-input]");
    const text = (input?.value || "").trim();
    if (!text || !caseSim.model) return;
    if (typeof caseSim.model.pushSerial === "function") caseSim.model.pushSerial(text + "\n");
    if (input) input.value = "";
    casePaint();
  });

  stage.addEventListener("click", event => {
    const run = event.target.closest("[data-case-run]");
    if (run) {
      caseSim.running = !caseSim.running;
      if (caseSim.running) caseSim.last = 0;
      casePaint();
      return;
    }
    const pin = event.target.closest("[data-pin]");
    if (pin && pin.dataset.pin) {
      go(`#/chip/${encodeURIComponent(pin.dataset.pin)}`);
    }
  });

  /* 源码标签页 */
  const srcBox = document.getElementById("caseSource");
  if (srcBox) {
    srcBox.addEventListener("click", event => {
      const tab = event.target.closest("[data-src]");
      if (!tab) return;
      caseSim.src = Number(tab.dataset.src) || 0;
      srcBox.innerHTML = caseSourceHTML(caseSim.item);
    });
  }
}

/* ============================================================
   引脚图（#/chip）
   ============================================================ */

const KIND_TEXT = {
  power: { zh: "电源/地", en: "Power" },
  io: { zh: "GPIO", en: "GPIO" },
  osc: { zh: "晶振", en: "Oscillator" },
  reset: { zh: "复位", en: "Reset" },
  boot: { zh: "启动配置", en: "Boot" },
  other: { zh: "其它", en: "Other" }
};

const TYPE_TEXT = {
  S: { zh: "电源", en: "Power" },
  I: { zh: "输入", en: "Input" },
  O: { zh: "输出", en: "Output" },
  "I/O": { zh: "双向", en: "I/O" }
};

function chipDetail(pin) {
  if (!pin) {
    return `<div class="chip-empty">${icon("pin")}<h3>${bil("选一个引脚", "Pick a pin")}</h3>
      <p>${bil("点芯片上的引脚，或者从下面的列表里选，看它的复用功能、默认电平与用到的案例。", "Click a pin on the chip, or use the list below, to see its alternate functions and the cases that use it.")}</p></div>`;
  }

  const periphs = (pin.periphs || []).map(id => PERIPH_MAP[id]).filter(Boolean);
  const users = CASES.filter(c => usedPins([c]).has(pin.gpio));
  const alts = (pin.altList || []).filter(x => x && x !== pin.gpio);
  const remaps = (pin.remapList || []).filter(x => x && x !== pin.gpio);

  const row = (label, valueHtml) => `<div class="chip-row"><span class="chip-row__k">${esc(label)}</span><span class="chip-row__v">${valueHtml}</span></div>`;

  const sub = pin.gpio && pin.name !== pin.gpio ? pin.name : "";
  return `<div class="chip-detail__head">
      <span class="chip-detail__no">${pin.no}</span>
      <div>
        <div class="chip-detail__name">${esc(pin.name)}</div>
        <div class="chip-detail__sub">${esc(sub || (pin.gpio ? `LQFP48 · ${bil("引脚", "pin")} ${pin.no}` : bil("非 GPIO 引脚", "non-GPIO pin")))}</div>
      </div>
    </div>
    <div class="chip-detail__rows">
      ${row(bil("类型", "Type"), `${esc(tx(TYPE_TEXT[pin.type] || { zh: pin.type, en: pin.type }))} · ${esc(tx(KIND_TEXT[pin.kind] || KIND_TEXT.other))}`)}
      ${pin.level ? row(bil("电平", "I/O level"), `${esc(pin.level)} ${bil("（5V 容忍）", "(5 V tolerant)")}`) : ""}
      ${pin.gpio ? row(bil("端口位", "Port bit"), `${esc(pin.port)}${pin.bit}`) : ""}
      ${alts.length ? row(bil("默认复用", "Default AF"), alts.map(a => `<code>${esc(a)}</code>`).join(" ")) : ""}
      ${remaps.length ? row(bil("重定义", "Remap"), remaps.map(a => `<code>${esc(a)}</code>`).join(" ")) : ""}
      ${periphs.length ? row(bil("涉及外设", "Peripherals"), periphs.map(p => `<a class="chip-periph" href="#/functions?p=${p.id}" style="--pcolor:${p.accent}">${esc(p.short)}</a>`).join("")) : ""}
    </div>
    ${users.length ? `<div class="chip-used">
        <div class="kb-side__title">${bil("用这个引脚的案例", "Cases using it")}</div>
        ${users.map(c => `<a class="kb-side__link" href="#/cases/${c.id}">${icon(c.icon || "flame")}<span>${esc(tx(c.title))}</span></a>`).join("")}
      </div>` : `<p class="chip-free">${bil("没有案例用到这个引脚。", "No case uses this pin.")}</p>`}`;
}

function viewChip(route) {
  const sel = route.chipKey || null;
  const pin = route.pin || null;
  const used = usedPins(CASES);

  const groups = [
    ["A", PINS.filter(p => p.gpio && p.port === "A")],
    ["B", PINS.filter(p => p.gpio && p.port === "B")],
    ["C", PINS.filter(p => p.gpio && p.port === "C")],
    ["power", PINS.filter(p => !p.gpio)]
  ];

  const jump = groups.map(([name, list]) => `
    <div class="chip-jump__group">
      <div class="chip-jump__label">${name === "power" ? bil("电源与系统", "Power & system") : `PORT${name}`}</div>
      <div class="chip-jump__pins">${list.map(p => {
        const key = p.gpio || p.name;
        const count = p.gpio ? CASES.filter(c => usedPins([c]).has(p.gpio)).length : 0;
        return `<a class="chip-jump__pin ${sel === key ? "is-active" : ""} ${count ? "is-used" : ""}"
          href="#/chip/${encodeURIComponent(key)}" title="${esc(p.no + " · " + p.name)}">
          <span>${esc(p.gpio || p.name.replace(/_\d+$/, ""))}</span>
          ${count ? `<em>${count}</em>` : ""}</a>`;
      }).join("")}</div>
    </div>`).join("");

  return `<div class="page-head">
    <div class="eyebrow">${t("chip.eyebrow")}</div>
    <h1>${t("chip.title")}</h1>
    <p class="lead">${t("chip.goal")}</p>
  </div>

  <div class="chip-layout">
    <section class="doc-panel chip-panel">
      <header class="doc-panel__head">
        ${icon("chip")}<span class="doc-panel__title">${bil("LQFP48 引脚图", "LQFP48 pinout")}</span>
        <span class="case-panel__hint">${bil("48 个引脚 · 点一下看定义", "48 pins · click to inspect")}</span>
      </header>
      <div class="chip-wrap">${chipSvg(sel, { used })}</div>
      <div class="chip-legend">
        <span class="chip-legend__item chip-legend__item--io">${bil("GPIO", "GPIO")}</span>
        <span class="chip-legend__item chip-legend__item--power">${bil("电源/地", "Power")}</span>
        <span class="chip-legend__item chip-legend__item--reset">${bil("复位/启动", "Reset/boot")}</span>
        <span class="chip-legend__item chip-legend__item--osc">${bil("晶振", "Oscillator")}</span>
        <span class="chip-legend__item chip-legend__item--used">${bil("有案例用到", "used by a case")}</span>
      </div>
    </section>

    <section class="doc-panel chip-side">
      <header class="doc-panel__head">${icon("info")}<span class="doc-panel__title">${bil("引脚详情", "Pin detail")}</span></header>
      <div class="chip-detail">${chipDetail(pin)}</div>
    </section>
  </div>

  <div class="doc-panel chip-jump">
    <header class="doc-panel__head">${icon("grid")}<span class="doc-panel__title">${bil("按端口浏览", "Browse by port")}</span></header>
    <div class="chip-jump__body">${jump}</div>
  </div>`;
}

/* ============================================================
   硬件知识库（#/kb）
   ============================================================ */

function kbCard(a) {
  const meta = PERIPH_MAP[a.p] || { accent: "var(--accent)" };
  return `<a class="kb-card" href="#/kb/${a.id}" style="--kc:${meta.accent}">
    <span class="kb-card__top">
      <span class="kb-card__ico">${icon(a.icon || "info")}</span>
      <span class="kb-card__tag">${esc(meta.short || "")}</span>
    </span>
    <h3>${esc(tx(a.title))}</h3>
    <p>${esc(tx(a.summary))}</p>
    <span class="kb-card__meta">${icon("book")}${(a.refs || []).length} ${t("kb.refs")}</span>
  </a>`;
}

/* 知识库正文只放开 <b> <em> <code> <br> 这几个行内标签 */
const RICH_RE = /&lt;(\/?)(b|em|code|br)(\s*\/?)&gt;/gi;
const rich = value => esc(value).replace(RICH_RE, (m, slash, tag, self) => `<${slash}${tag}${self}>`);

function kbBlock(b, lang) {
  const text = obj => (lang === "en" ? obj?.en : obj?.zh) || obj?.zh || "";
  if (b.kind === "list") {
    return `<div class="kb-block"><ul class="kb-list">${(b.items || [])
      .map(it => `<li>${rich(text(it))}</li>`).join("")}</ul></div>`;
  }
  if (b.kind === "formula") {
    const note = b.note ? `<span>${esc(text(b.note))}</span>` : "";
    return `<div class="kb-block"><div class="kb-formula">${esc(b.expr || "")}${note}</div></div>`;
  }
  if (b.kind === "warn") {
    return `<div class="kb-block"><div class="kb-warn">${rich(text(b))}</div></div>`;
  }
  return `<p>${rich(text(b))}</p>`;
}

/* 连续段落合并进同一张卡片，避免一段一卡 */
function kbBlocks(blocks, lang) {
  const out = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    out.push(`<div class="kb-block">${run.join("")}</div>`);
    run = [];
  };
  for (const b of blocks || []) {
    if (b.kind === "p") run.push(kbBlock(b, lang));
    else { flush(); out.push(kbBlock(b, lang)); }
  }
  flush();
  return out.join("");
}

function viewKb() {
  return `
  <div class="kb-hero">
    <div class="doc-head__eyebrow">${icon("layers")}${t("nav.kb")}</div>
    <h1 class="doc-head__title">${t("kb.title")}</h1>
    <p class="doc-head__goal">${t("kb.lead")}</p>
    <div class="doc-head__meta">
      <span class="badge badge--count">${KB_ARTICLES.length} ${t("kb.count")}</span>
      <span class="badge badge--count">${esc(t("kb.chip"))}</span>
    </div>
  </div>
  ${KB_ARTICLES.length
      ? `<div class="kb-grid">${KB_ARTICLES.map(kbCard).join("")}</div>`
      : `<div class="empty">${icon("info")}<h3>${t("kb.empty")}</h3></div>`}
  <div class="search-hints" style="margin-top:18px">${icon("info")} ${t("kb.sourceNote")}</div>`;
}

function viewKbArticle(a) {
  const lang = state.lang;
  const flows = (a.related?.workflows || []).map(id => WORKFLOW_MAP[id]).filter(Boolean);
  const calls = (a.related?.functions || []).map(id => FUNCTION_MAP[id]).filter(Boolean);
  const side = [
    `<div class="kb-side__card">
      <div class="kb-side__title">${t("kb.refs")}</div>
      ${(a.refs || []).map(r => `<div class="kb-side__link">${icon("book")}<span>${esc(t("kb.ref", { n: r.page, title: r.title }))}</span></div>`).join("")}
      <div style="font-size:10.5px;color:var(--faint);line-height:1.6;margin-top:8px">${esc(t("kb.sourceNote"))}</div>
    </div>`,
    flows.length ? `<div class="kb-side__card">
      <div class="kb-side__title">${t("kb.relatedFlows")}</div>
      ${flows.map(w => `<a class="kb-side__link" href="${wfHref(w.id)}">${icon("flow")}<span>${esc(tx(w.title))}</span></a>`).join("")}
    </div>` : "",
    calls.length ? `<div class="kb-side__card">
      <div class="kb-side__title">${t("kb.relatedFns")}</div>
      ${calls.map(f => `<a class="kb-side__link" href="${fnHref(f.id)}">${icon("code")}<span>${esc(f.name)}</span></a>`).join("")}
    </div>` : ""
  ].filter(Boolean).join("");

  return `
  <a class="backlink" href="#/kb">${icon("arrowLeft")}${t("kb.back")}</a>
  <div class="detail-head">
    <div class="detail-head__main">
      <div class="detail-head__tags">
        ${pchip(a.p)}
        <span class="badge badge--count">${(a.refs || []).length} ${t("kb.refs")}</span>
      </div>
      <h1 class="title-sans">${esc(tx(a.title))}</h1>
      <div class="wf-head__alt">${esc(alt(a.title))}</div>
      <p class="wf-head__goal">${esc(tx(a.summary))}</p>
    </div>
    <div class="detail-head__actions"></div>
  </div>

  <div class="kb-article">
    <div class="kb-body">
      ${kbBlocks(a.blocks, lang)}
    </div>
    <aside class="kb-side">${side}</aside>
  </div>`;
}

/* ============================================================
   search
   ============================================================ */
function hilite(text, tokens) {
  let out = esc(text);
  for (const token of tokens) {
    if (!token) continue;
    const safe = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "gi"), m => `<mark>${m}</mark>`);
  }
  return out;
}

function viewSearch(rawQuery) {
  const query = rawQuery.trim();
  const result = searchAll(query);
  state.lastSearch = result;

  if (!query) {
    return `<div class="page-head">
      <div class="eyebrow">${t("top.search")}</div>
      <h1>${t("search.title")}</h1>
      <p class="lead">${t("search.emptyHint")}</p>
    </div>
    ${suggestions()}`;
  }

  const total = result.functions.length + result.workflows.length + result.peripherals.length
    + (result.kb?.length || 0);
  if (!total) {
    return `<div class="page-head">
      <div class="eyebrow">${t("top.search")}</div>
      <h1>${esc(t("search.empty", { q: query }))}</h1>
      <p class="lead">${t("search.emptyHint")}</p>
    </div>
    ${suggestions()}`;
  }

  return `
  <div class="page-head">
    <div class="eyebrow">${t("top.search")}</div>
    <h1>${esc(t("search.for", { q: query }))}</h1>
    <div class="search-summary"><span class="search-count">${total} ${t("common.function")} / ${t("common.workflow")}</span></div>
  </div>

  ${result.peripherals.length ? `<div class="sec-head"><h2>${t("search.peripherals")}</h2><span class="sec-head__meta">${result.peripherals.length}</span></div>
    <div class="pill-list">${result.peripherals.map(p => `<a class="fnchip" href="#/functions?p=${p.id}" style="--c:${p.accent}"><span class="fnchip__dot" style="background:${p.accent}"></span>${esc(p.short)} · ${esc(tx(p))}</a>`).join("")}</div>` : ""}

  ${(result.kb || []).length ? `<div class="sec-head"><h2>${t("search.kb")}</h2><span class="sec-head__meta">${result.kb.length}</span></div>
    <div class="kb-grid">${result.kb.map(a => kbCard(a)).join("")}</div>` : ""}

  ${result.functions.length ? `<div class="sec-head"><h2>${t("search.functions")}</h2><span class="sec-head__meta">${result.functions.length}</span></div>
    <div class="fn-list" id="searchHits">${result.functions.map(f => `
      <a class="fn-row hit" href="${fnHref(f.id)}">
        <span class="fn-row__main">
          <span class="fn-row__title"><span class="fn-row__name">${hilite(f.name, result.tokens)}</span>${libBadge(f.lib)}</span>
          <span class="fn-row__brief">${hilite(tx({ zh: f.zh, en: f.en }), result.tokens)}</span>
        </span>
        <span class="fn-row__meta">${pchip(f.p)}${icon("chevronRight")}</span>
      </a>`).join("")}</div>` : ""}

  ${result.workflows.length ? `<div class="sec-head"><h2>${t("search.workflows")}</h2><span class="sec-head__meta">${result.workflows.length}</span></div>
    <div class="flow-grid">${result.workflows.map(wfCard).join("")}</div>` : ""}

  <div class="search-hints">
    <span><kbd>↑</kbd><kbd>↓</kbd>${t("search.hintNav")}</span>
    <span><kbd>Enter</kbd>${t("search.hintOpen")}</span>
    <span><kbd>Esc</kbd>${t("search.hintClose")}</span>
  </div>`;
}

function suggestions() {
  const items = ["PWM", "串口 中断", "DMA", "ADC", "I2C", "看门狗", "HAL_UART", "EXTI"];
  return `<div class="sec-title">${t("search.suggestions")}</div>
    <div class="suggest-row">${items.map(item => `<button class="chip" type="button" data-suggest="${esc(item)}">${esc(item)}</button>`).join("")}</div>`;
}

/* ============================================================
   recent
   ============================================================ */
function recordRecent(type, id) {
  if (!id) return;
  state.recent = state.recent.filter(item => !(item.type === type && item.id === id));
  state.recent.unshift({ type, id });
  state.recent = state.recent.slice(0, 8);
  store.set("recent", state.recent);
}

/* ============================================================
   interactions
   ============================================================ */
function syncSearchUi() {
  const q = searchInput.value;
  searchClear.hidden = !q;
  searchKbd.style.display = q ? "none" : "";
}

function updateFavButtons(key, on) {
  document.querySelectorAll(`[data-fav="${key}"]`).forEach(btn => {
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on);
    btn.setAttribute("aria-label", on ? t("common.unfavorite") : t("common.favorite"));
    btn.title = on ? t("common.unfavorite") : t("common.favorite");
  });
  const favCount = document.querySelector('.nav-item[href="#/favorites"] .nav-item__count');
  if (favCount) favCount.textContent = state.favs.size;
}

document.addEventListener("click", event => {
  const fav = event.target.closest("[data-fav]");
  if (fav) {
    const key = fav.dataset.fav;
    const on = !state.favs.has(key);
    if (on) state.favs.add(key); else state.favs.delete(key);
    store.set("favs", [...state.favs]);
    updateFavButtons(key, on);
    toast(on ? t("toast.favAdded") : t("toast.favRemoved"));
    if (routeInfo().name === "favorites") render();
    return;
  }

  const copy = event.target.closest("[data-copy]");
  if (copy) {
    const text = decodeURIComponent(copy.dataset.copy || "");
    const done = () => {
      copy.classList.add("is-done");
      toast(t("common.copied"));
      setTimeout(() => copy.classList.remove("is-done"), 1400);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(() => toast(t("common.copyFail")));
    else {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      done();
    }
    return;
  }

  const lib = event.target.closest("[data-lib]");
  if (lib) {
    const p = new URLSearchParams(location.hash.split("?")[1] || "").get("p") || "all";
    go(`#/functions?lib=${lib.dataset.lib}&p=${p}`);
    return;
  }

  const p = event.target.closest("[data-p]");
  if (p) {
    if (routeInfo().name === "map") go(`#/map?p=${p.dataset.p}`);
    else if (routeInfo().name === "workflows") {
      const level = new URLSearchParams(location.hash.split("?")[1] || "").get("level") || "all";
      go(`#/workflows?level=${level}&p=${p.dataset.p}`);
    } else {
      const lib = new URLSearchParams(location.hash.split("?")[1] || "").get("lib") || "all";
      go(`#/functions?lib=${lib}&p=${p.dataset.p}`);
    }
    return;
  }

  const chipPin = event.target.closest("[data-chip-pin]");
  if (chipPin && routeInfo().name === "chip") {
    const key = chipPin.dataset.chipPin;
    if (key) go(`#/chip/${encodeURIComponent(key)}`);
    return;
  }

  const level = event.target.closest("[data-level]");
  if (level) {
    const pp = new URLSearchParams(location.hash.split("?")[1] || "").get("p") || "all";
    go(`#/workflows?level=${level.dataset.level}&p=${pp}`);
    return;
  }

  const tab = event.target.closest("[data-tab]");
  if (tab) {
    state.wfTab = tab.dataset.tab;
    render();
    return;
  }

  const codelib = event.target.closest("[data-codelib]");
  if (codelib) {
    state.codeLib = codelib.dataset.codelib;
    render();
    return;
  }

  const zoom = event.target.closest("[data-zoom]");
  if (zoom) {
    if (zoom.dataset.zoom === "fit") fitFlow();
    else zoomFlow(zoom.dataset.zoom === "in" ? 1.18 : 1 / 1.18);
    return;
  }

  const suggest = event.target.closest("[data-suggest]");
  if (suggest) {
    searchInput.value = suggest.dataset.suggest;
    go(`#/search?q=${encodeURIComponent(suggest.dataset.suggest)}`);
    searchInput.focus();
    return;
  }

  if (event.target.closest("#menuBtn")) {
    const sidebar = $("#sidebar");
    const open = sidebar.classList.toggle("is-open");
    $("#scrim").hidden = !open;
    $("#menuBtn").setAttribute("aria-expanded", open);
    return;
  }

  if (event.target.id === "scrim") {
    $("#sidebar").classList.remove("is-open");
    $("#scrim").hidden = true;
    $("#menuBtn").setAttribute("aria-expanded", "false");
    return;
  }
});


/* search behaviour */
let searchTimer = null;
let searchHits = [];
let searchIndex = -1;

function runSearch(value) {
  const q = value.trim();
  if (!q) {
    if (routeInfo().name === "search") go("#/home");
    return;
  }
  const target = `#/search?q=${encodeURIComponent(q)}`;
  if (location.hash !== target) history.replaceState(null, "", target);
  render();
}

searchInput.addEventListener("input", () => {
  syncSearchUi();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => runSearch(searchInput.value), 130);
});

searchInput.addEventListener("focus", () => {
  if (searchInput.value.trim() && routeInfo().name !== "search") {
    runSearch(searchInput.value);
  }
});

searchInput.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    searchInput.value = "";
    syncSearchUi();
    if (routeInfo().name === "search") go("#/home");
    searchInput.blur();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const hit = searchHits[searchIndex] || searchHits[0];
    if (hit) location.hash = hit.getAttribute("href");
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    if (!searchHits.length) return;
    event.preventDefault();
    searchIndex = Math.max(0, Math.min(searchHits.length - 1, searchIndex + (event.key === "ArrowDown" ? 1 : -1)));
    searchHits.forEach((el, i) => el.classList.toggle("is-active", i === searchIndex));
    searchHits[searchIndex].scrollIntoView({ block: "nearest" });
  }
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  syncSearchUi();
  if (routeInfo().name === "search") go("#/home");
  searchInput.focus();
});

document.addEventListener("keydown", event => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
    searchInput.select();
    return;
  }
  if (event.key === "/" && !typing) {
    event.preventDefault();
    searchInput.focus();
    return;
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.blur();
  }

  /* 芯片引脚图：键盘回车/空格等同点击 */
  if ((event.key === "Enter" || event.key === " ") && !typing) {
    const focusPin = document.activeElement?.closest?.("[data-chip-pin]");
    if (focusPin && routeInfo().name === "chip") {
      event.preventDefault();
      go(`#/chip/${encodeURIComponent(focusPin.dataset.chipPin)}`);
    }
  }
});

/* refresh search hit list after each render */
const originalRender = render;
render = function patchedRender() {
  originalRender();
  searchHits = [...document.querySelectorAll("#searchHits .hit")];
  searchIndex = -1;
};

window.addEventListener("hashchange", () => {
  if (routeInfo().name !== "search") {
    if (searchInput.value) {
      searchInput.value = "";
      syncSearchUi();
    }
  }
  render();
});

window.addEventListener("resize", () => {
  if (state.flowWf && state.wfTab === "flow" && $("#flowViewport")) {
    clearTimeout(window._flowResize);
    window._flowResize = setTimeout(() => layoutFlow(state.flowWf), 160);
  }
});

/* ------------------------------------------------------------------
   mini 模式（桌面壳）：宿主把查询转进来，这里回精简结果
   ------------------------------------------------------------------ */
const hostBridge = window.chrome && window.chrome.webview;

function miniText(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (lang === "en" ? (value.en || value.zh) : (value.zh || value.en)) || "";
}

function miniCut(text, n = 64) {
  const v = String(text || "").replace(/\s+/g, " ").trim();
  return v.length > n ? v.slice(0, n - 1) + "…" : v;
}

function miniResults(query, lang) {
  const items = [];
  const q = String(query || "").trim();
  if (!q) return items;

  const res = searchAll(q, { limit: 8 });
  for (const f of res.functions.slice(0, 5)) {
    items.push({
      kind: "function",
      title: (f.n || f.name || f.id) + "()",
      sub: miniCut(miniText({ zh: f.zh, en: f.en }, lang)),
      href: "#/fn/" + encodeURIComponent(f.id)
    });
  }
  for (const w of res.workflows.slice(0, 3)) {
    items.push({
      kind: "workflow",
      title: miniCut(miniText(w.title, lang), 40),
      sub: miniCut(miniText(w.goal, lang)),
      href: "#/wf/" + encodeURIComponent(w.id)
    });
  }
  for (const a of res.kb.slice(0, 3)) {
    items.push({
      kind: "kb",
      title: miniCut(miniText(a.title, lang), 40),
      sub: miniCut(miniText(a.summary, lang)),
      href: "#/kb/" + encodeURIComponent(a.id)
    });
  }
  if (items.length < 8) {
    const needle = q.toLowerCase();
    for (const c of CASES) {
      const title = miniText(c.title, lang);
      if (!title || !title.toLowerCase().includes(needle)) continue;
      items.push({
        kind: "case",
        title: miniCut(title, 40),
        sub: miniCut(miniText(c.goal, lang)),
        href: "#/cases/" + encodeURIComponent(c.id)
      });
      if (items.length >= 8) break;
    }
  }
  return items.slice(0, 8);
}

if (hostBridge) {
  hostBridge.addEventListener("message", event => {
    const msg = event.data;
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "mini-query") {
      let items = [];
      try { items = miniResults(msg.q, msg.lang === "en" ? "en" : "zh"); } catch { items = []; }
      postHost({ type: "mini-result", id: msg.id, items });
    } else if (msg.type === "mini-open" && msg.href) {
      location.hash = msg.href;
    }
  });

  /* 应用内划词：选中就交给宿主弹迷你窗 */
  let lastSelection = "";
  document.addEventListener("mouseup", () => {
    setTimeout(() => {
      let text = "";
      try { text = (window.getSelection()?.toString() || "").trim(); } catch { }
      if (!text || text === lastSelection) return;
      if (text.length < 2 || text.length > 80) return;
      lastSelection = text;
      postHost({ type: "selection", text });
    }, 30);
  });
}

/* theme & language */
$("#themeBtn").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  store.set("theme", state.theme);
  postHost({ type: "theme", value: state.theme, lang: state.lang });
  renderTopbar(routeInfo());
});

$("#langSeg").addEventListener("click", event => {
  const btn = event.target.closest("[data-lang]");
  if (!btn) return;
  state.lang = btn.dataset.lang;
  t = makeT(state.lang);
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
  store.set("lang", state.lang);
  postHost({ type: "theme", value: state.theme, lang: state.lang });
  render();
  if (state.flowWf && state.wfTab === "flow") layoutFlow(state.flowWf);
});

/* init */
document.documentElement.dataset.theme = state.theme;
document.documentElement.dataset.host = window.chrome && window.chrome.webview ? "desktop" : "web";
document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
$("#themeIcon").innerHTML = icon(state.theme === "dark" ? "moon" : "sun");
postHost({ type: "theme", value: state.theme, lang: state.lang });

const bootRoute = routeInfo();
if (bootRoute.name === "search") searchInput.value = bootRoute.query.get("q") || "";

render();
bindFlowInteractions();
