/* ==========================================================================
   i18n — UI strings + switcher. Project copy lives in data.js.
   ========================================================================== */
(function () {
  "use strict";

  var DICT = {
    zh: {
      "nav.projects": "项目",
      "nav.ecosystem": "生态",
      "nav.about": "关于",
      "nav.github": "在 GitHub 上查看 heshengtao",
      "nav.menu": "导航菜单",
      "a11y.skip": "跳到主要内容",

      "hero.eyebrow": "开源 · AI 智能体",
      "hero.alias": "HESHENGTAO / PORTFOLIO",
      "hero.headline": "构建开源 AI 智能体生态",
      "hero.lead": "从可自托管的 AI 伴侣，到 ComfyUI 里的智能体工作流；从 AI 出题工具，到数据集标注。四年间开源 30 个仓库，让每个人都能拥有自己的 AI。",
      "hero.cta.projects": "浏览作品",
      "hero.cta.github": "GitHub 主页",
      "hero.stat.stars": "累计星标",
      "hero.stat.repos": "开源仓库",
      "hero.stat.forks": "累计分支",
      "hero.stat.flagship": "旗舰项目",

      "tel.title": "遥测",
      "tel.status": "运行正常",
      "tel.k.node": "节点",
      "tel.k.stack": "技术栈",
      "tel.k.license": "许可证",
      "tel.k.since": "始于",
      "tel.bars": "语言分布",

      "projects.eyebrow": "精选作品",
      "projects.title": "开源项目",
      "projects.desc": "四个从真实需求出发打造的产品：桌面端、云端、移动端，以及一条 Docker 命令就能跑起来的自托管服务。",
      "projects.go": "查看详情",
      "projects.flag": "旗舰",
      "projects.stars": "星标",

      "eco.eyebrow": "生态",
      "eco.title": "30 个仓库，一个生态",
      "eco.desc": "围绕 Super Agent Party 与 ComfyUI LLM Party，生长出插件、扩展、教程与周边工具。",
      "eco.more": "在 GitHub 查看全部仓库",

      "about.eyebrow": "关于",
      "about.title": "关于我",
      "about.p1": "我是 <strong>heshengtao</strong>，一名热爱开源的工程师。我相信 AI 不该被锁在某个云端账号里 —— 它应该可以被下载、被修改、被自托管，被真正地拥有。",
      "about.p2": "我的项目大多围绕「让个人也能跑起完整的 AI 能力」展开：给模型一个身体和声音，给工作流一张画布，给老师和学生一个不用联网的出题工具。所有代码都以 AGPL 或 Apache 许可开源。",
      "about.stack": "技术栈",
      "about.links": "链接",

      "footer.built": "原生 HTML / CSS / WebGL 手写 · 零构建依赖",
      "footer.rights": "© 2026 heshengtao · MIT License",
      "footer.projects": "项目",
      "footer.github": "GitHub",
      "footer.demos": "演示站",

      "p.back": "返回首页",
      "p.overview": "项目概览",
      "p.highlights": "核心亮点",
      "p.gallery": "界面截图",
      "p.rail.links": "相关链接",
      "p.rail.repo": "源码仓库",
      "p.rail.demo": "在线演示",
      "p.meta.stars": "星标",
      "p.meta.forks": "分支",
      "p.meta.lang": "主要语言",
      "p.meta.license": "许可证",
      "p.meta.updated": "最近更新",
      "p.cta.github": "查看源码",
      "p.cta.demo": "打开演示",
      "p.prev": "上一个项目",
      "p.next": "下一个项目",

      "nf.code": "信号丢失",
      "nf.title": "404",
      "nf.desc": "你访问的坐标不存在，或已被移动到其他星区。",
      "nf.home": "返回基地",
      "nf.github": "前往 GitHub"
    },

    en: {
      "nav.projects": "Projects",
      "nav.ecosystem": "Ecosystem",
      "nav.about": "About",
      "nav.github": "View heshengtao on GitHub",
      "nav.menu": "Navigation menu",
      "a11y.skip": "Skip to main content",

      "hero.eyebrow": "Open source · AI agents",
      "hero.alias": "HESHENGTAO / PORTFOLIO",
      "hero.headline": "Building the open-source AI agent ecosystem",
      "hero.lead": "From a self-hosted AI companion to agent workflows inside ComfyUI, from an AI exam generator to a dataset annotator. Thirty repositories in, and the goal has not changed: everyone should be able to own their own AI.",
      "hero.cta.projects": "See the work",
      "hero.cta.github": "GitHub profile",
      "hero.stat.stars": "Total stars",
      "hero.stat.repos": "Repositories",
      "hero.stat.forks": "Total forks",
      "hero.stat.flagship": "Flagship projects",

      "tel.title": "Telemetry",
      "tel.status": "Operational",
      "tel.k.node": "Node",
      "tel.k.stack": "Stack",
      "tel.k.license": "Licenses",
      "tel.k.since": "Since",
      "tel.bars": "Language mix",

      "projects.eyebrow": "Selected work",
      "projects.title": "Open-source projects",
      "projects.desc": "Four products built from real needs — desktop, cloud and mobile, plus self-hosted services that come up with a single Docker command.",
      "projects.go": "View project",
      "projects.flag": "Flagship",
      "projects.stars": "stars",

      "eco.eyebrow": "Ecosystem",
      "eco.title": "Thirty repositories, one ecosystem",
      "eco.desc": "Around Super Agent Party and ComfyUI LLM Party grows a constellation of plugins, extensions, tutorials and tooling.",
      "eco.more": "See all repositories on GitHub",

      "about.eyebrow": "About",
      "about.title": "About me",
      "about.p1": "I'm <strong>heshengtao</strong>, an engineer who loves open source. I believe AI should not be locked inside someone's cloud account — it should be downloadable, modifiable, self-hostable, and genuinely yours.",
      "about.p2": "Most of my projects circle one idea: letting an individual run the full stack of AI capability. Give a model a body and a voice; give a workflow a canvas; give teachers and students a question generator that needs no internet. Everything is released under AGPL or Apache.",
      "about.stack": "Tech stack",
      "about.links": "Links",

      "footer.built": "Hand-written HTML / CSS / WebGL · zero build dependencies",
      "footer.rights": "© 2026 heshengtao · MIT License",
      "footer.projects": "Projects",
      "footer.github": "GitHub",
      "footer.demos": "Demos",

      "p.back": "Back to home",
      "p.overview": "Overview",
      "p.highlights": "Why it matters",
      "p.gallery": "Screenshots",
      "p.rail.links": "Links",
      "p.rail.repo": "Source repository",
      "p.rail.demo": "Live demo",
      "p.meta.stars": "Stars",
      "p.meta.forks": "Forks",
      "p.meta.lang": "Language",
      "p.meta.license": "License",
      "p.meta.updated": "Last update",
      "p.cta.github": "View source",
      "p.cta.demo": "Open demo",
      "p.prev": "Previous project",
      "p.next": "Next project",

      "nf.code": "SIGNAL LOST",
      "nf.title": "404",
      "nf.desc": "Those coordinates don't exist — or have drifted into another sector.",
      "nf.home": "Return to base",
      "nf.github": "Go to GitHub"
    }
  };

  var SUPPORTED = ["zh", "en"];
  var STORE_KEY = "sap-lang";
  var current = "zh";

  function read() {
    if (window.__SAP_LANG === "zh" || window.__SAP_LANG === "en") return window.__SAP_LANG;
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* storage blocked */ }
    var nav = (navigator.language || navigator.userLanguage || "zh").toLowerCase();
    return nav.indexOf("zh") === 0 ? "zh" : (nav.indexOf("en") === 0 ? "en" : "zh");
  }

  function t(key, lang) {
    var d = DICT[lang || current] || DICT.zh;
    return d[key] != null ? d[key] : (DICT.zh[key] != null ? DICT.zh[key] : key);
  }

  function apply(lang) {
    current = lang;
    var root = document.documentElement;
    root.lang = lang === "zh" ? "zh-CN" : "en";
    root.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n"), lang);
      if (el.getAttribute("data-i18n-attr")) {
        el.setAttribute(el.getAttribute("data-i18n-attr"), v);
      } else {
        el.textContent = v;
      }
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"), lang);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"), lang));
    });

    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-lang-btn") === lang);
      b.setAttribute("aria-pressed", b.getAttribute("data-lang-btn") === lang ? "true" : "false");
    });

    document.dispatchEvent(new CustomEvent("sap:lang", { detail: { lang: lang } }));
  }

  function set(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* ignore */ }
    apply(lang);
  }

  window.SAP = window.SAP || {};
  window.SAP.i18n = {
    dict: DICT,
    t: t,
    apply: apply,
    set: set,
    read: read,
    get current() { return current; }
  };
})();
