import {
  createIcons,
  Orbit,
  UserRound,
  GitFork,
  ArrowUpRight,
  Compass,
  X,
  Maximize2,
  Pause,
  Play,
  ExternalLink,
} from "lucide";
import { projects, getProject, getChildren } from "./projects.js";
import { createWorld } from "./world.js";
import "./styles.css";

const iconSet = {
  Orbit,
  UserRound,
  Github: GitFork,
  ArrowUpRight,
  Compass,
  X,
  Maximize2,
  Pause,
  Play,
  ExternalLink,
};
const copy = {
  zh: {
    directory: "星球目录",
    about: "关于",
    kicker: "HESHENGTAO 的开源宇宙",
    heroFirst: "把想法",
    heroSecond: "变成星球。",
    heroCopy:
      "从能听会说的 AI 伙伴，到可自由组合的智能体工作流。每个开源项目，都是一片持续生长的小小世界。",
    repos: "开源仓库",
    stars: "累计星标",
    explore: "探索星球",
    coordinate: "个人作品集 / 持续生长中",
    overview: "全景",
    visibleCount: "15 颗已发现星球",
    source: "查看源码",
    demo: "在线体验",
    mapKicker: "FIELD GUIDE / 01",
    directoryTitle: "星球目录",
    directoryIntro:
      "探索已命名的 15 个开源仓库。围绕主星的小星球，是它们不断生长的生态。",
    allRepos: "在 GitHub 查看全部仓库",
    aboutKicker: "THE MAKER / 02",
    aboutTitle: "关于 heshengtao",
    aboutLead: "一个普通的社畜，希望能做做开源项目帮到大家！",
    aboutBody: "",
    fallbackTitle: "星图暂时无法显示",
    fallbackCopy: "你仍然可以从星球目录访问所有项目。",
    mainGroup: "主要项目",
    companionGroup: "围绕 Super Agent Party",
    workflowGroup: "围绕 ComfyUI LLM Party",
    satelliteCount: (count) => `${count} 颗生态卫星`,
    parent: "所属星系",
    children: "生态卫星",
    starsLabel: "星标",
    languageLabel: "语言",
    licenseLabel: "许可证",
    pause: "暂停运动",
    play: "恢复运动",
    closeDetail: "关闭项目详情",
  },
  en: {
    directory: "Field guide",
    about: "About",
    kicker: "THE OPEN-SOURCE UNIVERSE OF HESHENGTAO",
    heroFirst: "Ideas grow",
    heroSecond: "into worlds.",
    heroCopy:
      "From an AI companion with a voice and a body to freely connected agent workflows. Every open-source project is a small world still growing.",
    repos: "repositories",
    stars: "total stars",
    explore: "Explore worlds",
    coordinate: "PERSONAL PORTFOLIO / STILL GROWING",
    overview: "Overview",
    visibleCount: "15 discovered worlds",
    source: "View source",
    demo: "Live demo",
    mapKicker: "FIELD GUIDE / 01",
    directoryTitle: "Field guide",
    directoryIntro:
      "Explore 15 named open-source repositories. The smaller worlds orbiting a flagship are part of its growing ecosystem.",
    allRepos: "See all repositories on GitHub",
    aboutKicker: "THE MAKER / 02",
    aboutTitle: "About heshengtao",
    aboutLead:
      "Just an everyday worker hoping to build open-source projects that help everyone!",
    aboutBody: "",
    fallbackTitle: "The star map is unavailable",
    fallbackCopy: "You can still visit every project through the field guide.",
    mainGroup: "FLAGSHIP WORLDS",
    companionGroup: "AROUND SUPER AGENT PARTY",
    workflowGroup: "AROUND COMFYUI LLM PARTY",
    satelliteCount: (count) => `${count} ecosystem satellites`,
    parent: "PARENT SYSTEM",
    children: "SATELLITES",
    starsLabel: "STARS",
    languageLabel: "LANGUAGE",
    licenseLabel: "LICENSE",
    pause: "Pause motion",
    play: "Resume motion",
    closeDetail: "Close project details",
  },
};

const elements = {
  canvas: document.querySelector("#world"),
  hero: document.querySelector("#hero"),
  labels: document.querySelector("#planet-labels"),
  detail: document.querySelector("#detail-panel"),
  directory: document.querySelector("#directory-dialog"),
  about: document.querySelector("#about-dialog"),
  fallback: document.querySelector("#webgl-fallback"),
  list: document.querySelector("#directory-list"),
  motion: document.querySelector("#motion-button"),
};
let lang = localStorage.getItem("portfolio-language") === "en" ? "en" : "zh";
let selectedId = null;
let detailReturnFocus = null;
let directoryReturnFocus = null;
let world = null;
let motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function syncIcons() {
  createIcons({ icons: iconSet, attrs: { "stroke-width": 2 } });
}
function text(key) {
  return copy[lang][key];
}
function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function renderLabels(projectPosition) {
  if (selectedId || elements.fallback.hidden === false) {
    elements.labels.hidden = true;
    return;
  }
  elements.labels.hidden = false;
  for (const button of elements.labels.children) {
    const position = projectPosition(button.dataset.project);
    button.hidden =
      !position?.visible ||
      (window.innerWidth < 700 &&
        button.dataset.project !== "super-agent-party");
    if (button.hidden) continue;
    button.style.left = `${position.x}px`;
    button.style.top = `${position.y + position.radius + 8}px`;
  }
}

function buildLabels() {
  for (const project of projects) {
    const button = element(
      "button",
      `planet-label ${project.kind === "main" ? "" : "is-satellite"}`,
    );
    button.type = "button";
    button.dataset.project = project.id;
    button.setAttribute("aria-label", project.name);
    const label = element("span");
    label.append(
      element("strong", "", project.name),
      element("small", "", project.category[lang]),
    );
    button.append(label);
    button.addEventListener("click", (event) =>
      selectProject(project.id, true, event.detail === 0),
    );
    elements.labels.append(button);
  }
}

function updateDetail() {
  if (!selectedId) return;
  const project = getProject(selectedId);
  const index = projects.indexOf(project) + 1;
  document.querySelector("#detail-index").textContent =
    `${String(index).padStart(2, "0")} / ${projects.length}`;
  document.querySelector("#detail-category").textContent =
    project.category[lang];
  document.querySelector("#detail-title").textContent = project.name;
  document.querySelector("#detail-summary").textContent = project.summary[lang];
  document.querySelector("#detail-description").textContent =
    project.description?.[lang] || project.summary[lang];
  document
    .querySelector("#detail-tags")
    .replaceChildren(...project.tags.map((tag) => element("span", "", tag)));
  const metrics = document.querySelector("#detail-metrics");
  metrics.replaceChildren();
  const stars = element("span");
  stars.append(
    element("small", "", text("starsLabel")),
    element("strong", "", project.stars.toLocaleString()),
  );
  metrics.append(stars);
  if (project.language) {
    const language = element("span");
    language.append(
      element("small", "", text("languageLabel")),
      element("strong", "", project.language),
    );
    metrics.append(language);
  }
  if (project.license) {
    const license = element("span");
    license.append(
      element("small", "", text("licenseLabel")),
      element("strong", "", project.license),
    );
    metrics.append(license);
  }
  const family = document.querySelector("#detail-family");
  family.replaceChildren();
  const relatives = project.parent
    ? [getProject(project.parent)]
    : getChildren(project.id);
  if (relatives.length) {
    family.append(
      element("div", "", project.parent ? text("parent") : text("children")),
    );
    for (const relative of relatives) {
      const button = element("button", "", relative.name);
      button.type = "button";
      button.addEventListener("click", () => selectProject(relative.id));
      family.append(button, document.createTextNode("  "));
    }
  }
  const source = document.querySelector("#detail-source");
  source.href = project.source;
  const demo = document.querySelector("#detail-demo");
  demo.hidden = !project.demo;
  if (project.demo) demo.href = project.demo;
}

function updateDirectory() {
  elements.list.replaceChildren();
  const groups = [
    [text("mainGroup"), projects.filter((p) => p.kind === "main")],
    [text("companionGroup"), getChildren("super-agent-party")],
    [text("workflowGroup"), getChildren("comfyui-llm-party")],
  ];
  for (const [name, list] of groups) {
    const group = element("section", "directory-group");
    group.append(element("h3", "directory-group-title", name));
    for (const project of list) {
      const button = element(
        "button",
        `directory-item ${project.parent ? "directory-child" : ""}`,
      );
      button.type = "button";
      const swatch = element("span", "planet-swatch");
      swatch.style.background =
        project.id === "exameow"
          ? "#c1b18f"
          : project.id === "labelall"
            ? "#8ba9a0"
            : project.parent === "comfyui-llm-party" ||
                project.id === "comfyui-llm-party"
              ? "#8aaba1"
              : "#9fae86";
      const label = element("span", "item-copy");
      label.append(
        element("strong", "", project.name),
        element("small", "", project.summary[lang]),
      );
      button.append(swatch, label);
      button.addEventListener("click", () => {
        elements.directory.close();
        selectProject(project.id, true, true, directoryReturnFocus);
      });
      group.append(button);
    }
    elements.list.append(group);
  }
}

function setLanguage(next) {
  lang = next;
  localStorage.setItem("portfolio-language", lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.title =
    lang === "zh"
      ? "heshengtao · 开源星球作品集"
      : "heshengtao · Open-source worlds";
  for (const node of document.querySelectorAll("[data-i18n]"))
    node.textContent = text(node.dataset.i18n);
  for (const button of document.querySelectorAll("[data-lang]"))
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  document.querySelector("#directory-button").title = text("directory");
  document.querySelector("#about-button").title = text("about");
  for (const button of elements.labels.children)
    button.querySelector("small").textContent = getProject(
      button.dataset.project,
    ).category[lang];
  document
    .querySelector("#close-detail")
    .setAttribute("aria-label", text("closeDetail"));
  updateDirectory();
  updateDetail();
  updateMotionButton();
}

function selectProject(
  id,
  updateHash = true,
  focusDetail = false,
  returnFocus = document.activeElement,
) {
  if (!getProject(id)) return;
  if (!selectedId) detailReturnFocus = returnFocus;
  selectedId = id;
  world?.select(id);
  elements.hero.classList.add("is-hidden");
  elements.detail.hidden = false;
  updateDetail();
  if (focusDetail) document.querySelector("#detail-title").focus();
  if (updateHash) history.replaceState(null, "", `#${id}`);
}

function overview(updateHash = true, restoreFocus = false) {
  const returnFocus = detailReturnFocus;
  selectedId = null;
  detailReturnFocus = null;
  world?.select(null);
  elements.hero.classList.remove("is-hidden");
  elements.detail.hidden = true;
  if (updateHash)
    history.replaceState(null, "", location.pathname + location.search);
  if (restoreFocus && returnFocus?.isConnected) returnFocus.focus();
}

function updateMotionButton() {
  elements.motion.setAttribute("aria-pressed", String(motion));
  elements.motion.title = motion ? text("pause") : text("play");
  elements.motion.setAttribute("aria-label", elements.motion.title);
  elements.motion.innerHTML = `<i data-lucide="${motion ? "pause" : "play"}"></i>`;
  syncIcons();
}

function openDirectory() {
  directoryReturnFocus = document.activeElement;
  elements.directory.showModal();
}
function openAbout() {
  elements.about.showModal();
}

buildLabels();
setLanguage(lang);
document
  .querySelector("#brand-button")
  .addEventListener("click", () => overview());
document
  .querySelector("#overview-button")
  .addEventListener("click", () => overview());
document
  .querySelector("#close-detail")
  .addEventListener("click", () => overview(true, true));
document
  .querySelector("#directory-button")
  .addEventListener("click", openDirectory);
document
  .querySelector("#explore-button")
  .addEventListener("click", openDirectory);
document
  .querySelector("#fallback-directory")
  .addEventListener("click", openDirectory);
document.querySelector("#about-button").addEventListener("click", openAbout);
for (const dialog of [elements.directory, elements.about]) {
  dialog
    .querySelector("[data-close-dialog]")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}
for (const button of document.querySelectorAll("[data-lang]"))
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
elements.motion.addEventListener("click", () => {
  motion = !motion;
  world?.setMotion(motion);
  updateMotionButton();
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !elements.directory.open &&
    !elements.about.open &&
    selectedId
  )
    overview(true, true);
});
window.addEventListener("hashchange", () => {
  const id = location.hash.slice(1);
  if (getProject(id)) selectProject(id, false);
  else overview(false);
});

try {
  world = createWorld(elements.canvas, {
    onSelect: selectProject,
    onFrame: renderLabels,
  });
  world.setMotion(motion);
  const initial = location.hash.slice(1);
  if (getProject(initial)) selectProject(initial, false);
} catch (error) {
  console.error("3D scene unavailable:", error);
  elements.canvas.hidden = true;
  elements.labels.hidden = true;
  elements.hero.hidden = true;
  elements.fallback.hidden = false;
}
syncIcons();
