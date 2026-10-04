/* Resolve the display language before first paint.
   External (not inline) so the strict Content-Security-Policy needs no 'unsafe-inline'. */
(function () {
  "use strict";
  var lang = "zh";
  try {
    var saved = localStorage.getItem("sap-lang");
    if (saved === "en" || saved === "zh") {
      lang = saved;
    } else {
      var nav = (navigator.language || navigator.userLanguage || "zh").toLowerCase();
      lang = nav.indexOf("zh") === 0 ? "zh" : (nav.indexOf("en") === 0 ? "en" : "zh");
    }
  } catch (e) { /* storage blocked — fall back to zh */ }

  window.__SAP_LANG = lang;
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.documentElement.setAttribute("data-lang", lang);
})();
