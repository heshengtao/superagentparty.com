/* ==========================================================================
   Project detail page — renders one project from the content layer.
   The HTML carries a static summary; this replaces it once scripts run.
   ========================================================================== */
(function () {
  "use strict";

  var SAP = window.SAP || {};
  var U = SAP.util;

  function init(lang) {
    var root = document.getElementById("project-detail");
    if (!root || !U) return;

    var data = window.SAP_DATA;
    if (!data) return;

    var slug = root.getAttribute("data-slug");
    var idx = data.projects.map(function (p) { return p.slug; }).indexOf(slug);
    if (idx < 0) return;

    var project = data.projects[idx];
    var copy = project[lang] || project.zh;
    var t = function (key) { return SAP.i18n.t(key, lang); };

    function slot(name) { return root.querySelector('[data-fill="' + name + '"]'); }
    function setText(name, value) { var el = slot(name); if (el) el.textContent = value; }
    function setHtml(name, value) { var el = slot(name); if (el) el.innerHTML = value; }

    root.style.setProperty("--accent", project.accent);

    /* ---- head ---- */
    setText("kicker", "PROJECT " + project.index);
    setText("name", project.name);
    setText("nameZh", project.nameZh);
    setText("tagline", copy.tagline);
    setText("summary", copy.summary);

    var coverSrc = lang === "zh" && project.coverZh ? project.coverZh : project.cover;
    setHtml("cover",
      '<img src="' + coverSrc + '" alt="' + U.escapeHtml(project.name) + '"' +
      ' width="' + project.coverW + '" height="' + project.coverH + '" decoding="async">'
    );

    /* ---- actions ---- */
    var actions =
      '<a class="btn btn--primary" href="' + project.repo + '" target="_blank" rel="noopener noreferrer">' +
        U.icons.github + U.escapeHtml(t("p.cta.github")) +
      "</a>";
    if (project.demo) {
      actions +=
        '<a class="btn btn--ghost" href="' + project.demo + '" target="_blank" rel="noopener noreferrer">' +
          U.icons.external + U.escapeHtml(t("p.cta.demo")) +
        "</a>";
    }
    setHtml("actions", actions);

    /* ---- meta strip ---- */
    var meta = [
      { k: t("p.meta.stars"), v: U.fmt(project.stars), cy: true },
      { k: t("p.meta.forks"), v: U.fmt(project.forks) },
      { k: t("p.meta.lang"), v: project.lang },
      { k: t("p.meta.license"), v: project.license },
      { k: t("p.meta.updated"), v: project.updated }
    ];
    setHtml("meta", meta.map(function (m) {
      return '<div class="meta"><div class="meta__k">' + U.escapeHtml(m.k) + "</div>" +
        '<div class="meta__v' + (m.cy ? " cy" : "") + '">' + U.escapeHtml(m.v) + "</div></div>";
    }).join(""));

    /* ---- body ---- */
    setHtml("overview", copy.overview.map(function (p) { return "<p>" + U.rich(p) + "</p>"; }).join(""));
    setHtml("highlights", copy.highlights.map(function (h) { return "<li>" + U.rich(h) + "</li>"; }).join(""));

    var gallery = project.shots.map(function (shot) {
      var caption = lang === "zh" ? shot.zh : shot.en;
      return '<figure class="gallery__item">' +
        '<img src="' + shot.src + '" alt="' + U.escapeHtml(project.name + " — " + caption) + '"' +
        ' width="' + shot.w + '" height="' + shot.h + '" loading="lazy" decoding="async">' +
        "</figure>";
    }).join("");
    setHtml("gallery", gallery);
    var galleryHead = root.querySelector('[data-gallery-head]');
    if (galleryHead) galleryHead.style.display = project.shots.length ? "" : "none";

    /* ---- rail ---- */
    var links =
      '<a href="' + project.repo + '" target="_blank" rel="noopener noreferrer">' +
        "<span>" + U.escapeHtml(t("p.rail.repo")) + "</span>" + U.icons.external +
      "</a>";
    if (project.demo) {
      links +=
        '<a href="' + project.demo + '" target="_blank" rel="noopener noreferrer">' +
          "<span>" + U.escapeHtml(t("p.rail.demo")) + "</span>" + U.icons.external +
        "</a>";
    }
    setHtml("links", links);

    setHtml("tags", project.tags.map(function (tag) {
      return '<span class="chip chip--cy">' + U.escapeHtml(tag) + "</span>";
    }).join(""));

    /* ---- prev / next ---- */
    var prev = data.projects[(idx - 1 + data.projects.length) % data.projects.length];
    var next = data.projects[(idx + 1) % data.projects.length];
    setHtml("pnav",
      '<a class="hud hud--ticks" href="/projects/' + prev.slug + '/">' +
        '<span class="k">' + U.escapeHtml(t("p.prev")) + "</span>" +
        '<span class="v">' + U.escapeHtml(prev.name) + "</span>" +
      "</a>" +
      '<a class="hud hud--ticks" href="/projects/' + next.slug + '/">' +
        '<span class="k">' + U.escapeHtml(t("p.next")) + "</span>" +
        '<span class="v">' + U.escapeHtml(next.name) + "</span>" +
      "</a>"
    );

    /* ---- document meta ---- */
    document.title = project.name + " · heshengtao";
    var desc = copy.summary;
    ["description", "og:description"].forEach(function (name) {
      var el = document.querySelector('meta[name="' + name + '"]') ||
               document.querySelector('meta[property="' + name + '"]');
      if (el) el.setAttribute("content", desc);
    });
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", project.name + " · heshengtao");

    if (SAP.observe) SAP.observe(root);
  }

  function boot() {
    init(SAP.i18n ? SAP.i18n.current : "zh");
    document.addEventListener("sap:lang", function (event) { init(event.detail.lang); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
