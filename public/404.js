const copy = {
  zh: {
    skip: "跳到主要内容",
    label: "信号丢失",
    desc: "你访问的坐标不存在，或已被移动到其他星区。",
    home: "返回基地",
    github: "前往 GitHub",
    title: "404 · 信号丢失 | heshengtao",
  },
  en: {
    skip: "Skip to main content",
    label: "SIGNAL LOST",
    desc: "Those coordinates don't exist — or have drifted into another sector.",
    home: "Return to base",
    github: "Go to GitHub",
    title: "404 · Signal lost | heshengtao",
  },
};

let lang = localStorage.getItem("portfolio-language") === "en" ? "en" : "zh";

function apply(next) {
  lang = next;
  localStorage.setItem("portfolio-language", lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.title = copy[lang].title;
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = copy[lang][node.dataset.i18n];
  }
  for (const button of document.querySelectorAll("[data-lang]")) {
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  }
}

for (const button of document.querySelectorAll("[data-lang]")) {
  button.addEventListener("click", () => apply(button.dataset.lang));
}

apply(lang);
