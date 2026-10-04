/* ==========================================================================
   Shared runtime: chrome (nav, progress, reveal, counters) + home rendering
   ========================================================================== */
(function () {
  "use strict";

  var SAP = window.SAP = window.SAP || {};

  /* ---------- tiny helpers ------------------------------------------------ */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  /** Escape, then allow **bold** and *italic* from the content layer. */
  function rich(value) {
    return escapeHtml(value)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  var ICONS = {
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.6l2.9 5.87 6.48.94-4.69 4.57 1.11 6.46L12 17.39l-5.8 3.05 1.11-6.46-4.69-4.57 6.48-.94z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H6M11 18l-6-6 6-6"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-8.5 8.5M18 14.5V19a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h4.5"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.93.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.11-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.35 9.35 0 015 0c1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.06 10.06 0 0022 12.25C22 6.58 17.52 2 12 2z"/></svg>'
  };

  SAP.util = { qs: qs, qsa: qsa, escapeHtml: escapeHtml, rich: rich, fmt: fmt, icons: ICONS };

  /* ---------- scroll reveal ---------------------------------------------- */
  var revealObserver = null;
  function observer() {
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    }
    return revealObserver;
  }
  function observe(root) {
    var scope = root || document;
    qsa(".reveal:not(.is-in)", scope).forEach(function (el) { observer().observe(el); });
  }
  SAP.observe = observe;

  /* ---------- number counters -------------------------------------------- */
  function initCounters(root) {
    var els = qsa("[data-count]", root || document);
    if (!els.length) return;

    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var counter = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        counter.unobserve(entry.target);
        var el = entry.target;
        var to = parseInt(el.getAttribute("data-count"), 10) || 0;
        var suffix = el.getAttribute("data-suffix") || "";
        if (reduced) { el.textContent = fmt(to) + suffix; return; }

        var t0 = null;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / 1500, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(to * eased)) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.35 });

    els.forEach(function (el) { counter.observe(el); });
  }

  /* ---------- chrome ------------------------------------------------------ */
  function initChrome() {
    var nav = qs(".nav");
    var progress = qs(".progress");
    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset;
        if (nav) nav.classList.toggle("is-scrolled", y > 12);
        if (progress) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          progress.style.width = (max > 0 ? Math.min((y / max) * 100, 100) : 0) + "%";
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* section spy */
    var links = qsa(".nav__link[data-section]");
    var sections = links.map(function (link) { return document.getElementById(link.getAttribute("data-section")); }).filter(Boolean);
    if (sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("data-section") === entry.target.id);
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach(function (section) { spy.observe(section); });
    }

    /* language switch */
    qsa("[data-lang-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        SAP.i18n.set(btn.getAttribute("data-lang-btn"));
      });
    });

    /* seamless ticker */
    qsa(".ticker__track").forEach(function (track) {
      track.innerHTML += track.innerHTML;
    });

    /* footer year */
    qsa("[data-year]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    if (SAP.starfield) SAP.starfield();
  }

  /* ---------- home: project cards ---------------------------------------- */
  function projectCard(project, lang, position) {
    var copy = project[lang] || project.zh;
    var cover = lang === "zh" && project.coverZh ? project.coverZh : project.cover;
    var flag = SAP.i18n.t("projects.flag", lang);

    return '' +
      '<a class="card hud hud--ticks reveal" href="projects/' + project.slug + '/" style="--d:' + (position * 90) + 'ms">' +
        '<div class="card__cover">' +
          '<span class="card__idx">' + project.index + '</span>' +
          (project.flagship ? '<span class="flag">' + escapeHtml(flag) + '</span>' : '') +
          '<img src="' + cover + '" alt="' + escapeHtml(project.name + " — " + copy.tagline) + '" loading="lazy" decoding="async">' +
        '</div>' +
        '<div class="card__body">' +
          '<h3 class="card__title">' + escapeHtml(project.name) + '<span>' + escapeHtml(project.nameZh) + '</span></h3>' +
          '<p class="card__tagline">' + escapeHtml(copy.tagline) + '</p>' +
          '<p class="card__summary">' + escapeHtml(copy.summary) + '</p>' +
          '<div class="card__foot">' +
            '<span class="stars">' + ICONS.star + fmt(project.stars) + '<small>' + SAP.i18n.t("projects.stars", lang) + '</small></span>' +
            '<span class="card__go">' + SAP.i18n.t("projects.go", lang) + ICONS.arrow + '</span>' +
          '</div>' +
        '</div>' +
      '</a>';
  }

  function renderProjects(lang) {
    var grid = qs("#project-grid");
    if (!grid) return;
    var data = window.SAP_DATA;
    if (!data) return;
    grid.innerHTML = data.projects.map(function (project, i) {
      return projectCard(project, lang, i);
    }).join("");
    observe(grid);
  }

  /* ---------- home: ecosystem -------------------------------------------- */
  function renderEcosystem(lang) {
    var grid = qs("#eco-grid");
    if (!grid) return;
    var data = window.SAP_DATA;
    if (!data) return;

    grid.innerHTML = data.ecosystem.map(function (item) {
      var desc = lang === "zh" ? item.zh : item.en;
      return '' +
        '<a class="eco__item hud" href="https://github.com/' + item.repo + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="eco__top">' +
            '<span class="eco__name">' + escapeHtml(item.name) + '</span>' +
            '<span class="eco__stars">★ ' + fmt(item.stars) + '</span>' +
          '</span>' +
          '<span class="eco__desc">' + escapeHtml(desc) + '</span>' +
        '</a>';
    }).join("");
  }

  /* ---------- boot -------------------------------------------------------- */
  function boot() {
    initChrome();
    initCounters();

    document.addEventListener("sap:lang", function (event) {
      renderProjects(event.detail.lang);
      renderEcosystem(event.detail.lang);
    });

    qsa(".reveal").forEach(function (el) { observer().observe(el); });

    SAP.i18n.apply(SAP.i18n.read());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
