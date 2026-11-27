/* Chart.js charts: demographics (stacked), inventory by bedroom, revenue by bedroom
   (P25-P75 floating bar + median), and the per-box band ladder. Colors come from CSS
   tokens so light/dark both work; charts redraw on theme change. */
(function () {
  const charts = {};
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function base() {
    Chart.defaults.font.family = '"Inter", system-ui, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = css("--muted");
    Chart.defaults.borderColor = css("--border");
  }
  function kill(id) { if (charts[id]) { charts[id].destroy(); delete charts[id]; } }
  function grid() { return { color: css("--border"), drawTicks: false }; }
  function card(parent, id, title, sub, tableHtml) {
    const el = document.createElement("div");
    el.className = "chart-card";
    el.innerHTML = `<h4>${title}</h4><div class="chart-sub">${sub}</div><div class="chart-box"><canvas id="${id}"></canvas></div>${tableHtml ? `<details class="table-view"><summary>Table view</summary>${tableHtml}</details>` : ""}`;
    parent.appendChild(el);
  }
  const k = v => "$" + Math.round(v / 1000) + "K";
  function wrap(text, n) {
    const out = []; let line = "";
    text.split(" ").forEach(w => { if ((line + " " + w).trim().length > n && line) { out.push(line); line = w; } else { line = (line + " " + w).trim(); } });
    if (line) out.push(line);
    return out;
  }

  function demographics() {
    const d = SITE.demographics;
    const wrap = document.getElementById("demo-charts");
    if (!wrap.children.length) {
      card(wrap, "chart-demo", "Who reviews, by bedroom count", d.sub,
        table([{ key: "br", label: "Bedrooms" }, { key: "n", label: "Listings", r: 1 }, { key: "kids", label: "With kids", r: 1, fmt: v => v + "%" }, { key: "group", label: "Group trip", r: 1, fmt: v => v + "%" }, { key: "pet", label: "With a pet", r: 1, fmt: v => v + "%" }, { key: "other", label: "Other", r: 1, fmt: v => v + "%" }], d.rows));
      if (d.compare) card(wrap, "chart-demo2", d.compare.title, d.compare.sub,
        table([{ key: "label", label: "Segment" }, { key: "n", label: "Listings", r: 1 }, { key: "kids", label: "With kids", r: 1, fmt: v => v + "%" }, { key: "group", label: "Group trip", r: 1, fmt: v => v + "%" }, { key: "pet", label: "With a pet", r: 1, fmt: v => v + "%" }], d.compare.rows));
    }
    const series = [["kids", "With kids", "--series-1"], ["group", "Group trip", "--series-2"], ["pet", "With a pet", "--series-3"], ["other", "Other", "--series-other"]];
    kill("chart-demo");
    charts["chart-demo"] = new Chart(document.getElementById("chart-demo"), {
      type: "bar",
      data: { labels: d.rows.map(r => r.br + (r.br === "6+" ? "" : "BR") + ` (n=${r.n})`),
        datasets: series.map(([key, label, c]) => ({ label, data: d.rows.map(r => r[key]), backgroundColor: css(c), borderColor: css("--surface"), borderWidth: { top: 2 }, borderRadius: 0, maxBarThickness: 46 })) },
      options: { maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: css("--text") } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.raw}%` } } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, max: 100, grid: grid(), ticks: { callback: v => v + "%" } } } }
    });
    if (d.compare) {
      kill("chart-demo2");
      const s2 = series.slice(0, 3);
      charts["chart-demo2"] = new Chart(document.getElementById("chart-demo2"), {
        type: "bar",
        data: { labels: d.compare.rows.map(r => r.label), datasets: s2.map(([key, label, c]) => ({ label, data: d.compare.rows.map(r => r[key]), backgroundColor: css(c), borderRadius: 4, maxBarThickness: 22, borderColor: css("--surface"), borderWidth: 2 })) },
        options: { maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: css("--text") } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.raw}% of reviews` } } },
          scales: { x: { grid: { display: false } }, y: { grid: grid(), ticks: { callback: v => v + "%" } } } }
      });
    }
  }

  function size() {
    const s = SITE.size;
    const wrap = document.getElementById("size-charts");
    if (!wrap.children.length) {
      const t = table([{ key: "br", label: "Bedrooms" }, { key: "n", label: "Listings", r: 1 }, { key: "p25", label: "P25", r: 1, fmt: k }, { key: "median", label: "Median", r: 1, fmt: k }, { key: "p75", label: "P75", r: 1, fmt: k }, { key: "n80", label: "At/above floor", r: 1 }], s.rows);
      card(wrap, "chart-size-n", "Inventory by bedroom count", s.subCount, t);
      card(wrap, "chart-size-rev", "Revenue Potential by bedroom count", s.subRev, null);
    }
    const labels = s.rows.map(r => r.br + (String(r.br).includes("+") ? "" : "BR"));
    kill("chart-size-n");
    charts["chart-size-n"] = new Chart(document.getElementById("chart-size-n"), {
      type: "bar",
      data: { labels, datasets: [
        { label: "Below floor", data: s.rows.map(r => r.n - r.n80), backgroundColor: css("--series-other"), borderColor: css("--surface"), borderWidth: { top: 2 }, maxBarThickness: 46 },
        { label: `At/above $${s.floorK}K floor`, data: s.rows.map(r => r.n80), backgroundColor: css("--primary"), borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: false, maxBarThickness: 46 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: css("--text") } } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: grid(), title: { display: true, text: "Listings" } } } }
    });
    kill("chart-size-rev");
    charts["chart-size-rev"] = new Chart(document.getElementById("chart-size-rev"), {
      type: "bar",
      data: { labels, datasets: [
        { type: "line", label: "Median", data: s.rows.map(r => r.median), showLine: false, pointRadius: 6, pointHoverRadius: 8, pointBackgroundColor: css("--heading"), pointBorderColor: css("--surface"), pointBorderWidth: 2 },
        { label: "Middle half (P25-P75)", data: s.rows.map(r => [r.p25, r.p75]), backgroundColor: css("--series-1"), borderRadius: 4, borderSkipped: false, maxBarThickness: 38 },
        { type: "line", label: `$${s.floorK}K floor`, data: s.rows.map(() => s.floorK * 1000), borderColor: css("--accent"), borderDash: [6, 4], borderWidth: 2, pointRadius: 0 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: css("--text") } },
          tooltip: { callbacks: { label: c => Array.isArray(c.raw) ? `P25-P75: ${k(c.raw[0])}-${k(c.raw[1])}` : `${c.dataset.label}: ${k(c.raw)}` } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: grid(), ticks: { callback: v => k(v) } } } }
    });
  }

  window.drawBandChart = function (box) {
    const c = document.getElementById("band-chart");
    if (!c || !box.bands) return;
    kill("band-chart");
    const rows = box.bands.rows;
    charts["band-chart"] = new Chart(c, {
      type: "bar",
      data: { labels: rows.map(r => wrap(r.config.replace(/<[^>]+>/g, ""), 34)), datasets: [
        { label: "Low → High range", data: rows.map(r => [r.low, r.high]), backgroundColor: css("--series-1") + "55", borderColor: css("--series-1"), borderWidth: 1.5, borderRadius: 4, borderSkipped: false, maxBarThickness: 26 },
        { type: "line", label: "Mid (underwrite-to)", data: rows.map(r => r.mid), showLine: false, pointStyle: "rectRot", pointRadius: 8, pointHoverRadius: 10, pointBackgroundColor: css("--heading"), pointBorderColor: css("--surface"), pointBorderWidth: 2 }] },
      options: { indexAxis: "y", maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 12, color: css("--text") } },
          tooltip: { callbacks: { label: ctx => { const r = rows[ctx.dataIndex]; return `Low $${r.low}K · Mid $${r.mid}K · High $${r.high}K`; } } } },
        scales: { x: { min: box.bands.min || 60, grid: grid(), ticks: { callback: v => "$" + v + "K" } }, y: { grid: { display: false }, ticks: { color: css("--text"), autoSkip: false } } } }
    });
  };

  window.drawCharts = function () { base(); demographics(); size(); };
  window.redrawCharts = function () {
    base(); demographics(); size();
    const sel = document.querySelector('#deep-dive-tabs .tab[aria-selected="true"]');
    if (sel) window.drawBandChart(SITE.boxes.find(b => b.id === sel.dataset.tab));
    if (window.refreshMapColors) window.refreshMapColors();
  };
})();
