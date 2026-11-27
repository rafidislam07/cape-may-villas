/* Leaflet map of every listing in the export, colored by market-wide revenue tier.
   Esri tiles (keyless; OSM tiles refuse file:// pages). Filters: tier, bedrooms,
   verified position, yard, box comps only. */
(function () {
  let map, layer, markers = [];
  function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  const TIERS = [["high", "--tier-high"], ["mid", "--tier-mid"], ["low", "--tier-low"]];
  function color(p) { return css(TIERS.find(t => t[0] === p.tier)[1]); }

  function popup(p) {
    const box = p.boxes && p.boxes.length ? `<br><b>Comp in:</b> ${p.boxes.map(esc).join(", ")}` : "";
    const sup = p.supplement ? `<br><span class="muted">Not in market stats: ${esc(p.supplement)}</span>` : "";
    const ex = p.excluded ? `<br><span style="color:#b5482e"><b>Excluded:</b> ${esc(p.excluded)}</span>` : "";
    return `<b>${esc(p.title)}</b><br>${p.br}BR/${p.ba}BA · sleeps ${p.sl}<br><b>${kfmt(p.rev)}</b> Revenue Potential · ADR $${Math.round(p.adr)} · ${Math.round(p.occ * 100)}% occ.` +
      (p.pos ? `<br>Position (from photos): ${esc(p.pos)}` : "") + (p.yard ? `<br>Yard: ${esc(p.yard)}` : "") + box + ex + sup +
      `<br><a href="${esc(p.url)}" target="_blank" rel="noopener">Open on Airbnb</a>`;
  }

  function buildLegend() {
    const m = SITE.map;
    const n = t => m.points.filter(p => p.tier === t).length;
    document.getElementById("map-legend").innerHTML = `<h4>Revenue tier (market-wide)</h4>
      <div class="legend-row"><span class="legend-dot" style="background:${css("--tier-high")}"></span>Top 10% · ${m.cuts.high} · n=${n("high")}</div>
      <div class="legend-row"><span class="legend-dot" style="background:${css("--tier-mid")}"></span>Next 15% · ${m.cuts.mid} · n=${n("mid")}</div>
      <div class="legend-row"><span class="legend-dot" style="background:${css("--tier-low")}"></span>Bottom 75% · ${m.cuts.low} · n=${n("low")}</div>
      <div class="legend-row small muted">Larger ring = toured comp (position/yard verified from photos)</div>
      ${m.points.some(p => p.excluded) ? `<div class="legend-row"><span class="legend-dot legend-dot--x">✕</span>Excluded (linked listing / not a house)</div>` : ""}`;
  }

  function buildFilters() {
    const m = SITE.map;
    const brs = [...new Set(m.points.map(p => p.brKey))].sort();
    const opts = (arr) => arr.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    document.getElementById("map-filters").innerHTML = `<h4>Filters</h4>
      <div class="filter-group">${TIERS.map(([t]) => `<label><input type="checkbox" name="tier" value="${t}" checked> ${{ high: "Top 10%", mid: "Next 15%", low: "Bottom 75%" }[t]}</label>`).join("")}</div>
      <div class="filter-group"><select id="f-br"><option value="">All bedroom counts</option>${opts(brs)}</select></div>
      <div class="filter-group"><select id="f-pos"><option value="">Any position</option>${opts(m.posOptions)}</select></div>
      <div class="filter-group"><select id="f-yard"><option value="">Any yard</option>${opts(m.yardOptions)}</select></div>
      <div class="filter-group"><select id="f-box"><option value="">All listings</option>${opts(SITE.boxes.map(b => b.label))}</select></div>
      <div class="filter-count" id="f-count"></div>`;
    document.getElementById("map-filters").addEventListener("change", apply);
  }

  function apply() {
    const tiers = [...document.querySelectorAll('input[name="tier"]:checked')].map(i => i.value);
    const br = document.getElementById("f-br").value, pos = document.getElementById("f-pos").value,
      yard = document.getElementById("f-yard").value, box = document.getElementById("f-box").value;
    let shown = 0;
    markers.forEach(({ p, mk }) => {
      const ok = tiers.includes(p.tier) && (!br || p.brKey === br) && (!pos || p.pos === pos) && (!yard || p.yard === yard) && (!box || (p.boxes || []).includes(box));
      if (ok) { if (!layer.hasLayer(mk)) layer.addLayer(mk); shown++; } else if (layer.hasLayer(mk)) layer.removeLayer(mk);
    });
    document.getElementById("f-count").textContent = `${shown} of ${markers.length} listings shown`;
  }

  window.refreshMapColors = function () {
    markers.forEach(({ p, mk }) => { if (mk.setStyle) mk.setStyle({ fillColor: color(p), color: p.toured ? css("--heading") : "#ffffff" }); });
    buildLegend();
  };

  window.initMap = function () {
    const m = SITE.map;
    map = L.map("leaflet-map", { scrollWheelZoom: false }).setView(m.center, m.zoom);
    const gray = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", { maxZoom: 16, attribution: "Tiles &copy; Esri" });
    const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imagery &copy; Esri, Maxar" });
    const topo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Tiles &copy; Esri" });
    topo.addTo(map);
    L.control.layers({ "Streets": topo, "Light gray": gray, "Satellite": sat }, null, { position: "topright" }).addTo(map);
    layer = L.layerGroup().addTo(map);
    const order = { low: 0, mid: 1, high: 2 };
    [...m.points].sort((a, b) => order[a.tier] - order[b.tier]).forEach(p => {
      let mk;
      if (p.excluded) {
        mk = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "", html: `<div style="color:#b5482e;font-weight:800;font-size:15px;line-height:15px;text-shadow:0 0 2px #fff">✕</div>`, iconSize: [15, 15], iconAnchor: [7, 7] }) });
      } else {
        mk = L.circleMarker([p.lat, p.lon], { radius: p.toured ? 7 : 5, weight: p.toured ? 2 : 1, color: p.toured ? css("--heading") : "#ffffff", fillColor: color(p), fillOpacity: 0.9 });
      }
      mk.bindPopup(popup(p));
      markers.push({ p, mk });
      layer.addLayer(mk);
    });
    const live = m.points.filter(p => !p.excluded).map(p => [p.lat, p.lon]);
    if (live.length) map.fitBounds(live, { padding: [24, 24] });
    buildLegend(); buildFilters(); apply();
    document.getElementById("map-sub").innerHTML = m.sub;
  };
})();
