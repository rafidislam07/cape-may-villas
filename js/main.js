/* Entry point: render content, then charts and the map. Each step is guarded so one
   failing library (e.g. offline CDN) does not blank the rest of the page. */
(function () {
  function safe(name, fn) { try { fn(); } catch (e) { console.error("[buybox] " + name + " failed:", e); } }
  safe("theme", initTheme);
  safe("header", renderHeader);
  safe("declarations", renderDeclarations);
  safe("market", renderMarket);
  safe("regulation", renderRegulation);
  safe("map-interp", () => paras("map-interpretation", SITE.map.interpretation));
  safe("demo-interp", () => paras("demographics-interpretation", SITE.demographics.interpretation));
  safe("size-interp", () => paras("size-interpretation", SITE.size.interpretation));
  safe("justification", renderJustification);
  safe("underwriting", renderUnderwriting);
  safe("lightbox", initLightbox);
  safe("charts", () => window.drawCharts());
  safe("tabs", renderDeepDiveTabs);
  safe("map", () => window.initMap());
})();
