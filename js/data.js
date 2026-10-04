/* ==========================================================================
   Content layer — every project and ecosystem repo, in both languages.
   Edit here, the whole site follows.
   ========================================================================== */
window.SAP_DATA = {
  totals: { stars: 5243, forks: 524, repos: 30, flagship: 2 },

  projects: [
    {
      slug: "super-agent-party",
      index: "01",
      name: "Super Agent Party",
      nameZh: "超级智能体派对",
      flagship: true,
      accent: "#22d3ee",
      stars: 2712,
      forks: 293,
      lang: "JavaScript",
      license: "AGPL-3.0",
      created: "2025-03-08",
      updated: "2026-08-23",
      repo: "https://github.com/heshengtao/super-agent-party",
      demo: "https://www.agentparty.top",
      tags: ["AI Companion", "MCP", "Live2D / VRM", "ComfyUI", "IM Bots", "Smart Home"],
      cover: "/assets/img/sap-cover-en.webp",
      coverZh: "/assets/img/sap-cover-zh.webp",
      coverW: 1774,
      coverH: 887,
      shots: [
        { src: "/assets/img/sap-vts.webp", w: 1920, h: 1027, zh: "虚拟形象驱动", en: "Avatar driving" },
        { src: "/assets/img/sap-task.webp", w: 1920, h: 1026, zh: "任务与工具调用", en: "Tasks & tool calling" },
        { src: "/assets/img/sap-vision.webp", w: 1920, h: 1094, zh: "视觉理解", en: "Vision understanding" }
      ],
      zh: {
        tagline: "全能 AI 伴侣 · 自托管的 Neuro-sama + OpenClaw",
        summary: "给它一副嗓子、一双眼睛和一个身体，它就能陪你聊天、开直播、打游戏、管智能家居。",
        overview: [
          "**超级智能体派对（Super Agent Party）** 把大模型、语音合成、语音识别、视觉理解、Live2D / VRM 虚拟形象与 MCP 工具调用，整合进一个开箱即用的桌面应用。你不需要写一行代码，填好 API Key，就能得到一个能听、会说、看得见、动得起来的 AI 伙伴。",
          "它原生支持 **ComfyUI 工作流**，可以直接当前端调度图像、视频与音频生成；同时内置 Discord、QQ、飞书等 IM 机器人接入，并支持 Home Assistant 智能家居控制、OBS 直播推流以及 VR 环境下的全身动作驱动。"
        ],
        highlights: [
          "**MCP 工具协议**：让角色真正「动手」，可调用任意 MCP Server 扩展能力。",
          "**全模态链路**：TTS / ASR / VLM 串成一条流水线，兼容 GPT-SoVITS、ChatTTS、Whisper。",
          "**双引擎虚拟形象**：Live2D 与 VRM 并存，支持口型同步与表情驱动。",
          "**IM 全面接入**：Discord / QQ / 飞书 / 微信，随时随地把角色「派」上线。",
          "**插件生态**：官方与社区插件覆盖直播、游戏、互动故事、AI Galgame。"
        ]
      },
      en: {
        tagline: "The all-in-one, self-hosted AI companion",
        summary: "Give an LLM a voice, a pair of eyes and a body — then let it chat, stream, play games and run your smart home.",
        overview: [
          "**Super Agent Party** bundles large language models, text-to-speech, speech recognition, vision, Live2D / VRM avatars and MCP tool-calling into one turnkey desktop app. No code required — drop in an API key and you get an AI companion that can listen, speak, see and move.",
          "It speaks **ComfyUI workflows** natively as a front-end for image, video and audio generation, and ships IM bot integrations for Discord, QQ and Feishu alongside Home Assistant control, OBS streaming and full-body VR motion driving."
        ],
        highlights: [
          "**MCP tool protocol** — the character actually *acts*, calling into any MCP server.",
          "**Full multimodal chain** — TTS / ASR / VLM wired together, with GPT-SoVITS, ChatTTS and Whisper support.",
          "**Dual-avatar engines** — Live2D and VRM, with lip-sync and expression driving.",
          "**Everywhere IM** — Discord / QQ / Feishu / WeChat, so your agent is always on call.",
          "**Plugin ecosystem** — livestreaming, gaming, interactive stories and AI galgames, official and community built."
        ]
      }
    },

    {
      slug: "comfyui-llm-party",
      index: "02",
      name: "ComfyUI LLM Party",
      nameZh: "ComfyUI LLM 派对",
      flagship: true,
      accent: "#8b5cf6",
      stars: 2370,
      forks: 205,
      lang: "Python",
      license: "AGPL-3.0",
      created: "2024-04-13",
      updated: "2026-07-29",
      repo: "https://github.com/heshengtao/comfyui_LLM_party",
      demo: null,
      tags: ["ComfyUI", "LLM Agent", "MCP", "GraphRAG", "TTS / OCR", "Ollama"],
      cover: "/assets/img/clp-cover.webp",
      coverZh: null,
      coverW: 1920,
      coverH: 765,
      shots: [
        { src: "/assets/img/clp-vrmbot.webp", w: 1600, h: 900, zh: "VRM 机器人节点", en: "VRM bot node" }
      ],
      zh: {
        tagline: "ComfyUI 里的 LLM Agent 工作流框架",
        summary: "把大模型、智能体、语音、OCR 与图像生成全部串进节点图，用拖拽搭出一个完整 AI 应用。",
        overview: [
          "**ComfyUI LLM Party** 是我最早的高星开源项目，把 LLM 智能体能力带进了 ComfyUI 的节点式工作流。它内置 MCP Server、Omost、GPT-SoVITS、ChatTTS、GOT-OCR2.0 以及 FLUX 提示词节点，让你在同一张画布里完成从对话、推理到生图、配音、识别的全流程。",
          "项目兼容一切 OpenAI 接口风格的大模型服务 —— o1、Gemini、Grok、Qwen、GLM、DeepSeek、Kimi、豆包，也支持 Ollama、llama.cpp 等本地 GGUF 模型；同时接入 Janus-Pro 等 VLM 与 GraphRAG 知识图谱检索，并通过飞书 / Discord 机器人把工作流接到聊天窗口里。"
        ],
        highlights: [
          "**节点即应用**：拖拽组合出 Agent、RAG 与多模态流水线，无需写代码。",
          "**全模型适配**：OpenAI / Gemini / Qwen / DeepSeek / Ollama / GGUF 通吃。",
          "**内置 MCP Server**，可作为工具被外部智能体调用。",
          "**语音与视觉**：GPT-SoVITS、ChatTTS、GOT-OCR2.0、VLM 开箱即用。",
          "**接入聊天软件**：飞书与 Discord 机器人，让工作流随时待命。"
        ]
      },
      en: {
        tagline: "An LLM agent framework that lives inside ComfyUI",
        summary: "Wire LLMs, agents, speech, OCR and image generation into one node graph — and build a whole AI app by dragging boxes.",
        overview: [
          "**ComfyUI LLM Party** is my first high-star open-source project: it brings LLM agent capabilities into ComfyUI's node-based workflow. Built-in nodes include an MCP server, Omost, GPT-SoVITS, ChatTTS, GOT-OCR2.0 and FLUX prompt nodes, so a single canvas covers conversation, reasoning, image generation, dubbing and recognition.",
          "It works with every OpenAI-compatible model service — o1, Gemini, Grok, Qwen, GLM, DeepSeek, Kimi, Doubao — plus local GGUF models through Ollama and llama.cpp. VLM support (Janus-Pro and friends), GraphRAG retrieval and Feishu / Discord bots let the graph reach into your chat apps."
        ],
        highlights: [
          "**The graph is the app** — drag-and-drop agents, RAG and multimodal pipelines.",
          "**Every model** — OpenAI / Gemini / Qwen / DeepSeek / Ollama / GGUF.",
          "**Built-in MCP server**, so other agents can call your workflow as a tool.",
          "**Speech and vision** — GPT-SoVITS, ChatTTS, GOT-OCR2.0 and VLMs out of the box.",
          "**Chat integrations** — Feishu and Discord bots keep the workflow on call."
        ]
      }
    },

    {
      slug: "exameow",
      index: "03",
      name: "Exameow",
      nameZh: "Exameow 智能出题",
      flagship: false,
      accent: "#f472b6",
      stars: 55,
      forks: 21,
      lang: "TypeScript · Rust",
      license: "Apache-2.0",
      created: "2026-07-24",
      updated: "2026-09-27",
      repo: "https://github.com/heshengtao/exameow",
      demo: "https://exam.superagentparty.com/",
      tags: ["Tauri", "Vue 3", "Rust", "Cloudflare Workers", "Offline-first", "Education"],
      cover: "/assets/img/exameow-cover.webp",
      coverZh: null,
      coverW: 1376,
      coverH: 768,
      shots: [
        { src: "/assets/img/exameow-shot.webp", w: 1800, h: 1350, zh: "出题与练习界面", en: "Generation & practice UI" }
      ],
      zh: {
        tagline: "上传资料，几秒生成一整套试卷",
        summary: "隐私优先的 AI 出题工具：上传课件与教材，自动生成五类题型，并附带练习模式与错题本。",
        overview: [
          "**Exameow（ExamBot）** 是一款端侧优先的 AI 出题工具。上传 PDF、Word、PPT、Excel、EPUB 等任意格式的学习资料，它就能调用任意 OpenAI 兼容接口生成结构化试题，并一键导出为 Excel 或 CSV。",
          "同一个前端可以跑在**三种后端**之上：Tauri 桌面与移动端（完全离线）、Cloudflare Workers（免费在线版）以及 Docker 自托管版。项目还内置了在线考试中继，Docker 版完全自包含，不依赖任何第三方服务。"
        ],
        highlights: [
          "**10+ 种文档格式解析**：PDF / DOCX / XLSX / PPTX / EPUB / ODT / HTML / CSV。",
          "**五种题型**：单选、多选、判断、填空、简答。",
          "**练习模式与错题本**：自动追踪错题与连续答对次数，智能复习。",
          "**三端同构**：桌面 / 移动 / 云端 / Docker 共用一套 Vue 前端。",
          "**长文自动分块**：保留标题与表格结构，每批最多 15 题按比例分配。"
        ]
      },
      en: {
        tagline: "Upload your notes, get a full exam in seconds",
        summary: "A privacy-first AI question generator: feed it courseware, get five question types plus a practice mode and mistake tracker.",
        overview: [
          "**Exameow (ExamBot)** is a local-first AI exam generator. Upload study material in any format — PDF, Word, PowerPoint, Excel, EPUB — and it calls any OpenAI-compatible API to produce structured questions, exportable to Excel or CSV in one click.",
          "The same front end runs on **three interchangeable backends**: Tauri for desktop and mobile (fully offline), Cloudflare Workers for a free hosted edition, and a self-hosted Docker build. It even ships with an online-exam relay, so the Docker edition is completely self-contained."
        ],
        highlights: [
          "**10+ document formats** — PDF / DOCX / XLSX / PPTX / EPUB / ODT / HTML / CSV.",
          "**Five question types** — single choice, multiple choice, true/false, fill-in-the-blank, short answer.",
          "**Practice mode and mistake book** — tracks wrong answers and consecutive correct streaks.",
          "**One front end, four targets** — desktop, mobile, cloud and Docker.",
          "**Structure-aware chunking** — headings and tables preserved; up to 15 questions per batch, proportionally split."
        ]
      }
    },

    {
      slug: "labelall",
      index: "04",
      name: "LabelAll",
      nameZh: "LabelAll 数据标注",
      flagship: false,
      accent: "#34d399",
      stars: 1,
      forks: 0,
      lang: "TypeScript",
      license: "Apache-2.0",
      created: "2026-10-03",
      updated: "2026-10-04",
      repo: "https://github.com/heshengtao/labelall",
      demo: "https://labelall.superagentparty.com",
      tags: ["Dataset", "COCO", "YOLO", "VOC", "Annotation", "Docker"],
      cover: "/assets/img/labelall-showcase.webp",
      coverZh: null,
      coverW: 1920,
      coverH: 1120,
      shots: [
        { src: "/assets/img/labelall-showcase-more.webp", w: 1920, h: 560, zh: "标注工具栏与图层", en: "Annotation toolbar & layers" }
      ],
      zh: {
        tagline: "打开文件夹，就能标注数据集",
        summary: "免转换、免建工程的图像数据集工具，直接读取 COCO、YOLO、Pascal VOC 与 ImageFolder。",
        overview: [
          "**LabelAll** 是一款免费开源的图像数据集查看与标注工具。它没有格式转换步骤，也不需要新建工程文件 —— 选一个文件夹，它就直接读取里面已有的数据。",
          "支持 **COCO、YOLO、Pascal VOC 和 ImageFolder / ImageNet** 四种主流格式，可以浏览、编辑、绘制边界框与多图层标注，并原样导出。同时提供 Web 版与跨平台桌面端，也可以一条 Docker 命令部署到自己的服务器。"
        ],
        highlights: [
          "**直接读文件夹**：没有格式转换，没有工程文件。",
          "**四种主流格式**：COCO / YOLO / Pascal VOC / ImageFolder。",
          "**类别与多图层**：类别管理、图层控制，导出保持原格式。",
          "**多端可用**：Web、桌面端同源，Docker 一键部署。"
        ]
      },
      en: {
        tagline: "Open a folder, start annotating",
        summary: "No conversion, no project files — a dataset tool that reads COCO, YOLO, Pascal VOC and ImageFolder as they are.",
        overview: [
          "**LabelAll** is a free, open-source tool for opening, browsing, annotating and exporting common image datasets. There is no format-conversion step and no project file to set up — pick a folder and it reads what is already there.",
          "It supports **COCO, YOLO, Pascal VOC and ImageFolder / ImageNet**, lets you browse, edit and draw bounding boxes across multiple layers, and exports back in the original format. Ships as both a web app and a cross-platform desktop build, with a one-command Docker deployment."
        ],
        highlights: [
          "**Reads folders directly** — no conversion, no project file.",
          "**Four mainstream formats** — COCO / YOLO / Pascal VOC / ImageFolder.",
          "**Classes and layers** — manage classes, control layers, export unchanged.",
          "**Runs anywhere** — web and desktop from one codebase, plus Docker."
        ]
      }
    }
  ],

  ecosystem: [
    { name: "Let-LLM-party", stars: 41, repo: "heshengtao/Let-LLM-party",
      zh: "30 天学会 ComfyUI LLM Party", en: "Learn ComfyUI LLM Party in 30 days" },
    { name: "comfyui_LLM_mafia", stars: 9, repo: "heshengtao/comfyui_LLM_mafia",
      zh: "ComfyUI LLM Party 黑夜版", en: "ComfyUI LLM Party, Dark Night Edition" },
    { name: "sap-live2d", stars: 8, repo: "heshengtao/sap-live2d",
      zh: "Super Agent Party 的 Live2D 扩展", en: "Live2D extension for Super Agent Party" },
    { name: "comfyui_LLM_schools", stars: 7, repo: "heshengtao/comfyui_LLM_schools",
      zh: "用于微调 LLM 的 ComfyUI 节点库", en: "ComfyUI nodes for fine-tuning LLMs" },
    { name: "topics-after-party", stars: 4, repo: "heshengtao/topics-after-party",
      zh: "实时话题 API，为聊天提供灵感", en: "A topic API that serves real-time conversation starters" },
    { name: "sap-story-adventure", stars: 4, repo: "heshengtao/sap-story-adventure",
      zh: "AI 互动故事冒险插件", en: "Interactive AI story-adventure plugin" },
    { name: "sap-web-preview", stars: 4, repo: "heshengtao/sap-web-preview",
      zh: "网页预览插件", en: "In-app web preview plugin" },
    { name: "desktop-for-sap", stars: 3, repo: "heshengtao/desktop-for-sap",
      zh: "把 Docker 版转成桌面版", en: "Turns the Docker build into a desktop app" },
    { name: "sap-aigalgame", stars: 3, repo: "heshengtao/sap-aigalgame",
      zh: "AI Galgame 扩展", en: "AI galgame extension" },
    { name: "sap-example", stars: 3, repo: "heshengtao/sap-example",
      zh: "官方插件示例", en: "Official plugin example" },
    { name: "sap-aieditor", stars: 2, repo: "heshengtao/sap-aieditor",
      zh: "AI 编辑器插件", en: "AI editor plugin" },
    { name: "sap-remote", stars: 2, repo: "heshengtao/sap-remote",
      zh: "一键把服务暴露到公网", en: "One-click public exposure for remote use" }
  ]
};
