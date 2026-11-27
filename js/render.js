/* Renders every non-chart, non-map section from the SITE object in data.js.
   Content strings authored in the market content file may contain simple inline HTML;
   listing data pulled from the export (titles, hosts) is always escaped. */

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function money(v, opts) {
  if (v == null || v === "") return "—";
  if (opts && opts.k) return "$" + Math.round(v / 1000) + "K";
  return "$" + Math.round(v).toLocaleString("en-US");
}
function kfmt(v) { return v == null ? "—" : "$" + (Math.round(v / 100) / 10).toFixed(v >= 100000 ? 0 : 1).replace(/\.0$/, "") + "K"; }
function pct(v, d) { return v == null ? "—" : (v * 100).toFixed(d == null ? 0 : d) + "%"; }
function $(id) { return document.getElementById(id); }
function listHtml(items, cls) {
  if (!items || !items.length) return "";
  return `<ul class="${cls || ""}">${items.map(i => `<li>${i}</li>`).join("")}</ul>`;
}
function specList(rows) {
  return `<dl class="spec-list">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
}
function badge(text, kind) { return `<span class="badge badge--${kind || "neutral"}">${text}</span>`; }
function tierBadge(t) {
  const map = { high: ["High tier", "high"], mid: ["Mid tier", "mid"], low: ["Low tier", "low"], avoid: ["Avoid", "danger"], ceiling: ["Ceiling (not underwritten)", "pending"] };
  const m = map[t] || [t, "neutral"];
  return badge(m[0], m[1]);
}
function img(src, alt, cls, caption) {
  if (!src) return `<div class="${cls || ""}" style="aspect-ratio:4/3;display:grid;place-items:center;background:var(--surface-2);color:var(--muted);font-size:.85rem">No photo</div>`;
  return `<img class="${cls || ""}" src="${esc(src)}" alt="${esc(alt || "")}" loading="lazy" decoding="async" data-caption="${esc(caption || alt || "")}" data-lightbox>`;
}
function table(columns, rows, opts) {
  opts = opts || {};
  const head = columns.map(c => `<th class="${c.r ? "r" : ""}">${c.label}</th>`).join("");
  const body = rows.map(r => `<tr class="${r._cls || ""}">${columns.map(c => `<td class="${c.r ? "r" : ""}">${c.fmt ? c.fmt(r[c.key], r) : (r[c.key] == null ? "—" : r[c.key])}</td>`).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table>${opts.caption ? `<caption class="small muted" style="text-align:left;padding:8px 10px">${opts.caption}</caption>` : ""}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
function airbnbLink(c) { return c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title || c.id)}</a>` : esc(c.title || c.id); }
function compMeta(c) {
  const parts = [];
  if (c.br) parts.push(`${c.br}BR/${c.ba}BA`);
  if (c.sl) parts.push(`sleeps ${c.sl}`);
  if (c.pos) parts.push(esc(c.pos));
  if (c.yard) parts.push(esc(c.yard));
  return parts.join(" · ");
}

/* ---------- Header / hero ---------- */
function renderHeader() {
  const m = SITE.meta;
  document.title = m.title;
  $("site-title").innerHTML = `${esc(m.market)} <span>Buy Boxes</span>`;
  $("hero-h1").innerHTML = m.h1;
  $("hero-lede").innerHTML = m.lede;
  $("hero-kpis").innerHTML = SITE.kpis.map(k => `<div class="kpi"><div class="kpi__label">${k.label}</div><div class="kpi__value">${k.value}</div>${k.note ? `<div class="kpi__note">${k.note}</div>` : ""}</div>`).join("");
  $("footer-body").innerHTML = `<p><b>${m.disclaimer}</b></p><p>${m.footer || ""}</p><p>Built ${esc(m.updated)} · Revenue figures are AirDNA-style "Revenue Potential" from the market export, used as given.</p>`;
}

function renderDeclarations() {
  $("buybox-declarations").innerHTML = SITE.boxes.map((b, i) => `
    <article class="decl ${i === 0 ? "decl--rank1" : ""}">
      ${b.hero ? img(b.hero.src, b.hero.caption, "decl__img", b.hero.caption) : ""}
      <div class="decl__body">
        <div class="decl__label">${esc(b.label)} ${b.rankLabel ? "· " + b.rankLabel : ""}</div>
        <h3 class="decl__name">${b.name}</h3>
        <p class="decl__tag">${b.tagline}</p>
        <dl class="decl__specs">${b.glance.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
        <a class="decl__cta" href="#deep-dive" data-open-tab="${b.id}">Open the ${esc(b.label)} deep dive &rarr;</a>
      </div>
    </article>`).join("");
}

/* ---------- Market / regulation ---------- */
function renderMarket() {
  const mk = SITE.market;
  let html = `<div class="prose">${mk.paragraphs.map(p => `<p>${p}</p>`).join("")}</div>`;
  if (mk.evidence) {
    const e = mk.evidence;
    html += `<h3 style="margin-top:26px">${e.title}</h3>${e.note ? `<p class="muted small prose">${e.note}</p>` : ""}`;
    html += `<div class="table-wrap"><table><thead><tr>${e.columns.map((c, i) => `<th class="${i >= e.numFrom ? "r" : ""}">${c}</th>`).join("")}</tr></thead><tbody>${e.rows.map(r => `<tr class="${r._strong ? "row-strong" : ""}">${r.cells.map((c, i) => `<td class="${i >= e.numFrom ? "r" : ""}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    if (e.takeaways) html += `<div class="callout"><h4>How to read it</h4>${listHtml(e.takeaways)}</div>`;
  }
  $("market-body").innerHTML = html;
}

function renderRegulation() {
  const r = SITE.regulation;
  $("regulation-note").innerHTML = `
    <div class="regulation__status">${badge("STR legality: " + r.status, r.tone || "pending")}</div>
    <div class="regulation__body"><p style="margin:0">${r.summary}</p>${listHtml(r.gates)}</div>`;
}

/* ---------- Interpretation blocks ---------- */
function paras(id, arr) { $(id).innerHTML = (arr || []).map(p => `<p>${p}</p>`).join(""); }

/* ---------- Justification ---------- */
function renderJustification() {
  const j = SITE.justification;
  $("justification-h2").textContent = j.title;
  let html = j.intro ? `<p class="prose">${j.intro}</p>` : "";
  html += `<ol class="justification-list">${j.items.map(i => `<li><h4>${i.title}</h4><p style="margin:0">${i.text}</p></li>`).join("")}</ol>`;
  if (j.rejected && j.rejected.length) {
    html += `<h3 style="margin-top:28px">Segments considered and rejected</h3><div class="reject-grid">${j.rejected.map(r => `<div class="reject"><h4>${badge("Rejected", "danger")} ${r.title}</h4><p class="small" style="margin:0">${r.text}</p></div>`).join("")}</div>`;
  }
  if (j.callouts && j.callouts.length) {
    html += `<h3 style="margin-top:28px">Call-outs (too thin or too special for their own box)</h3><div class="reject-grid">${j.callouts.map(r => `<div class="reject"><h4>${badge("Call-out", "pending")} ${r.title}</h4><p class="small" style="margin:0">${r.text}</p></div>`).join("")}</div>`;
  }
  $("justification-body").innerHTML = html;
}

/* ---------- Deep dive ---------- */
function renderDeepDiveTabs() {
  const tabs = $("deep-dive-tabs");
  tabs.innerHTML = SITE.boxes.map((b, i) => `<button class="tab" role="tab" id="tab-${b.id}" aria-selected="${i === 0}" data-tab="${b.id}">${esc(b.label)}<small>${b.shortName || ""}</small></button>`).join("");
  tabs.addEventListener("click", e => {
    const t = e.target.closest("[data-tab]");
    if (t) selectTab(t.dataset.tab);
  });
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-open-tab]");
    if (a) selectTab(a.dataset.openTab);
  });
  selectTab(SITE.boxes[0].id);
}
function selectTab(id) {
  document.querySelectorAll("#deep-dive-tabs .tab").forEach(t => t.setAttribute("aria-selected", t.dataset.tab === id));
  const box = SITE.boxes.find(b => b.id === id);
  $("deep-dive-content").innerHTML = renderBox(box);
  if (window.drawBandChart) window.drawBandChart(box);
}

function block(title, inner, sub) {
  if (!inner) return "";
  return `<section class="dd-block"><h3>${title}</h3>${sub ? `<p class="muted small prose">${sub}</p>` : ""}${inner}</section>`;
}

function renderBox(b) {
  let h = `<div class="tab-panel" role="tabpanel" aria-labelledby="tab-${b.id}">`;
  // Overview
  h += `<div class="dd-hero"><div>${b.hero ? img(b.hero.src, b.hero.caption, "dd-hero__img", b.hero.caption) : ""}${b.hero && b.hero.caption ? `<p class="small muted" style="margin-top:6px">${b.hero.caption}</p>` : ""}</div>
    <div><p class="section-kicker">${esc(b.label)}${b.rankLabel ? " · " + b.rankLabel : ""}</p><h3 style="font-size:1.45rem">${b.name}</h3>
    <p><b>Thesis.</b> ${b.thesis}</p><p><b>Why it works.</b> ${b.why}</p>${specList(b.glance)}</div></div>`;

  // Acquisition vs product
  const a = b.acquisition, p = b.product;
  h += block("What to buy vs. what to build", `<div class="two-col">
    <div class="box-col"><h4>${badge("A", "neutral")} Acquisition requirements</h4><p class="small muted">Must be true at purchase: hard or impossible to change later.</p>
      ${listHtml(a.must, "checklist")}
      ${a.prefer && a.prefer.length ? `<h5 style="margin-top:12px">Preferred</h5>${listHtml(a.prefer, "checklist checklist--add")}` : ""}
      ${a.avoid && a.avoid.length ? `<h5 style="margin-top:12px">Reject the property if</h5>${listHtml(a.avoid, "checklist checklist--x")}` : ""}</div>
    <div class="box-col"><h4>${badge("B", "neutral")} Finished STR product</h4><p class="small muted">What the house must become after setup.</p>
      ${listHtml(p.build, "checklist checklist--add")}
      ${p.spec && p.spec.length ? `<div style="margin-top:12px">${specList(p.spec)}</div>` : ""}</div></div>`);

  // Must-haves
  if (b.mustHaves && b.mustHaves.length) {
    h += block("Must-have amenities and what execution looks like", b.mustHaves.map(m => `
      <div class="musthave"><div class="musthave__head"><h4>${m.name}</h4>${badge(m.evidence, "ok")}${m.acq ? badge(m.acq, "neutral") : ""}</div>
      <p class="prose" style="margin:0">${m.why}</p>
      ${m.tiers && m.tiers.length ? `<div class="tier-grid">${m.tiers.map(t => `
        <div class="tier-card ${t.tier === "avoid" ? "tier-card--avoid" : ""}">${img(t.src, t.caption, "", t.caption)}
          <div class="tier-card__body">${tierBadge(t.tier)} ${t.comp ? `<b class="num">${kfmt(t.comp.rev)}</b>` : ""}
          ${t.comp ? `<div class="tier-card__meta">${airbnbLink(t.comp)}<br>${compMeta(t.comp)}</div>` : ""}
          <div>${t.text}</div></div></div>`).join("")}</div>` : ""}</div>`).join(""),
      "High / mid / low examples come from this box's own comp set. Low is the minimum acceptable version of the strategy; anything below it is shown as an avoid case, not a floor.");
  }

  // Nice-to-haves
  if (b.niceToHaves && b.niceToHaves.length) {
    h += block("Nice-to-haves, stack-ranked", `<div class="rank-list">${b.niceToHaves.map((n, i) => `
      <div class="rank-item"><div class="rank-item__n">${i + 1}</div>
        <div><b>${n.name}</b> ${n.evidence ? badge(n.evidence, "neutral") : ""}<div class="small" style="margin-top:3px">${n.why}</div>${n.cost ? `<div class="small muted" style="margin-top:3px">Cost: ${n.cost}</div>` : ""}</div>
        <div class="rank-item__stats"><b>${n.stat || ""}</b>${n.statLabel || ""}</div></div>`).join("")}</div>`, b.niceRankNote);
  }

  // Prevalence
  if (b.prevalence && b.prevalence.rows.length) {
    const pv = b.prevalence;
    const pc = v => v == null ? "—" : `<span class="cell-bar"><span class="bar" style="width:${Math.round(v * 100)}%"></span><span class="val">${Math.round(v * 100)}%</span></span>`;
    h += block("Top-performer prevalence screen", table([
      { key: "amenity", label: "Feature" },
      { key: "top10", label: `Top 10`, r: 1, fmt: pc },
      { key: "top20", label: `Top 20`, r: 1, fmt: pc },
      { key: "topq", label: `Top quartile (${pv.nq})`, r: 1, fmt: pc },
      { key: "all", label: `All (${pv.n})`, r: 1, fmt: pc },
      { key: "signal", label: "Read" },
    ], pv.rows), `${pv.population}. Top 10 = ${pv.top10Range}; top 20 = ${pv.top20Range}; top quartile = ${pv.topqRange}. ${pv.note || ""}`);
  }

  // Revenue
  if (b.bands) {
    const bd = b.bands;
    h += block("Revenue projections", `
      <div class="chart-card"><h4>Underwriting bands by finished configuration</h4><div class="chart-sub">Low = must beat (minimum acceptable execution) · Mid = underwrite-to · High = strong but credible. Revenue Potential, $K/yr.</div>
      <div class="chart-box" style="height:${Math.max(180, bd.rows.length * 72 + 60)}px"><canvas id="band-chart"></canvas></div>
      <details class="table-view"><summary>Table view</summary>${table([
        { key: "config", label: "Finished configuration" }, { key: "low", label: "Low", r: 1, fmt: v => kfmt(v * 1000) }, { key: "mid", label: "Mid", r: 1, fmt: v => kfmt(v * 1000) }, { key: "high", label: "High", r: 1, fmt: v => kfmt(v * 1000) }, { key: "note", label: "Evidence" }], bd.rows)}</details></div>
      ${bd.notes ? `<div class="callout">${listHtml(bd.notes)}</div>` : ""}`);
  }

  if (b.revenueComps && b.revenueComps.length) {
    h += block("Revenue comps", table([
      { key: "tier", label: "Role", fmt: v => tierBadge(v) },
      { key: "title", label: "Listing", fmt: (v, r) => airbnbLink(r) + `<div class="small muted">${compMeta(r)}</div>` },
      { key: "rev", label: "Revenue", r: 1, fmt: v => `<b>${kfmt(v)}</b>` },
      { key: "adr", label: "ADR", r: 1, fmt: v => money(v) },
      { key: "occ", label: "Occ.", r: 1, fmt: v => pct(v) },
      { key: "why", label: "Why it is in the set" },
    ], b.revenueComps), "Real listings at their own Revenue Potential. Revenue comps speak only to expected performance; the look of the product is in the design comps below.");
  }

  if (b.designComps && b.designComps.length) {
    h += block("Design comps", `<div class="comp-grid">${b.designComps.map(c => `
      <div class="comp-card">${img(c.src, c.title, "", c.caption || c.title)}<div class="comp-card__body">
        <div class="comp-card__title">${airbnbLink(c)}</div><div class="small muted">${compMeta(c)}${c.rev ? ` · <b>${kfmt(c.rev)}</b>` : ""}</div><div class="small">${c.why}</div></div></div>`).join("")}</div>`,
      "What to copy in look, layout and amenity placement. Not all are revenue comps for this box.");
  }

  if (b.counterexamples && b.counterexamples.length) {
    h += block("Counterexamples: what to avoid", `<div class="comp-grid">${b.counterexamples.map(c => `
      <div class="comp-card tier-card--avoid">${c.src ? img(c.src, c.title, "", c.title) : ""}<div class="comp-card__body">
        <div>${badge(c.kind || "Avoid", "danger")}</div>
        <div class="comp-card__title">${airbnbLink(c)}</div><div class="small muted">${compMeta(c)}</div>
        <div class="comp-card__rev">${kfmt(c.rev)}</div><div class="small">${c.why}</div></div></div>`).join("")}</div>`,
      "Never used as a floor. They show what happens when the position, yard package or operation misses.");
  }

  // Geography
  if (b.geography) h += block("Geography and ideal locations", specList(b.geography));

  // Picks
  if (b.picks && b.picks.length) {
    h += block("Acquisition candidates (underwritten)", `<div class="pick-grid">${b.picks.map(renderPick).join("")}</div>`, b.picksNote);
  }
  if (b.watch && b.watch.rows.length) {
    h += block(b.watch.title || "Watch list", table(b.watch.columns, b.watch.rows), b.watch.note);
  }

  if (b.risks && b.risks.length) h += block("Risks, gates and deal-breakers", listHtml(b.risks, "checklist checklist--x"));
  if (b.notes && b.notes.length) h += block("Analyst notes", `<div class="prose">${listHtml(b.notes)}</div>`);
  h += `</div>`;
  return h;
}

function renderPick(p) {
  const coc = p.coc ? p.coc.map(v => v == null ? "—" : v.toFixed(1) + "%") : ["—", "—", "—"];
  return `<article class="pick">${p.src ? img(p.src, p.title, "", p.title + (p.photoNote ? " · " + p.photoNote : "")) : ""}
    <div class="pick__body"><div class="pick__label">${p.label}</div><h4 class="pick__title">${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${p.title}</a>` : p.title}</h4>
    <div class="small muted">${p.subtitle}</div>
    <div class="pick__coc"><div><b>${coc[0]}</b><span>CoC Low</span></div><div><b>${coc[1]}</b><span>CoC Mid</span></div><div><b>${coc[2]}</b><span>CoC High</span></div></div>
    ${p.cocNote ? `<div class="small muted">${p.cocNote}</div>` : ""}
    <dl>
      <dt>Ask</dt><dd>${money(p.ask)}</dd>
      <dt>Plan</dt><dd>${p.plan}</dd>
      <dt>Bands L/M/H</dt><dd>${p.bands}</dd>
      ${p.setup ? `<dt>Setup</dt><dd>${money(p.setup)}</dd>` : ""}
      ${p.cash ? `<dt>Cash in</dt><dd>${money(p.cash)}${p.ask ? ` <span class="muted">(${Math.round(p.cash / p.ask * 100)}% of price)</span>` : ""}</dd>` : ""}
      ${p.be ? `<dt>Break-even</dt><dd>${money(p.be)} revenue</dd>` : ""}
      ${p.stress ? `<dt>Stress</dt><dd>${p.stress}</dd>` : ""}
    </dl>
    ${p.status ? `<div>${badge(p.status, p.statusTone || "pending")}</div>` : ""}
    ${listHtml(p.notes)}</div></article>`;
}

/* ---------- Underwriting ---------- */
function renderUnderwriting() {
  const u = SITE.underwriting;
  let html = `<div class="two-col"><div class="box-col"><h4>Financing &amp; setup</h4>${specList(u.financing)}</div><div class="box-col"><h4>Operating costs</h4>${specList(u.opex)}</div></div>`;
  if (u.method) html += `<div class="callout"><h4>Method</h4>${listHtml(u.method)}</div>`;
  if (u.caveats) html += `<div class="callout callout--danger"><h4>Known limits of the data</h4>${listHtml(u.caveats)}</div>`;
  if (u.sources) html += `<p class="small muted">Sources in the repo: ${u.sources.map(s => `<code>${esc(s)}</code>`).join(", ")}</p>`;
  $("underwriting-body").innerHTML = html;
}

/* ---------- Lightbox ---------- */
function initLightbox() {
  const lb = $("lightbox");
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-lightbox]");
    if (t) {
      $("lightbox-image").src = t.currentSrc || t.src;
      $("lightbox-image").alt = t.alt;
      $("lightbox-caption").textContent = t.dataset.caption || "";
      lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    } else if (e.target === lb || e.target.closest(".lightbox__close")) {
      lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
    }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); } });
}

function initTheme() {
  const btn = $("theme-toggle");
  let saved = null;
  try { saved = localStorage.getItem("bb-theme"); } catch (e) {}
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  btn.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("bb-theme", next); } catch (e) {}
    if (window.redrawCharts) window.redrawCharts();
  });
}
