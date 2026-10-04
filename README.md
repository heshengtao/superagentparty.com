# superagentparty.com

heshengtao 的个人作品集主页 —— 深空全息 HUD 风格，中英双语，零构建依赖的纯静态站点。

线上地址：<https://superagentparty.com>

## 特点

- **零构建**：直接写 HTML / CSS / JS，没有打包步骤。Cloudflare Pages 把仓库当静态目录托管即可。
- **中英双语**：右上角切换，默认跟随浏览器语言，选择记在 `localStorage`。文案集中在 `js/i18n.js` 与 `js/data.js`，不复制页面。
- **WebGL 主视觉**：Three.js 粒子星空 + 线框轨道环，鼠标视差、滚动联动。CDN 不可用或开启「减少动态效果」时，自动回退到纯 CSS 星空。
- **渐进增强**：无 JS 时项目详情页仍能看到核心内容，首页有 `<noscript>` 列表兜底。
- **性能**：截图统一转成 WebP（10MB → 186KB），首屏图片带尺寸属性避免布局抖动，字体与 CDN 都做了 `preconnect`。
- **安全**：`_headers` 里配置了严格 CSP、HSTS 与不可变缓存。

## 目录结构

```
.
├── index.html                    首页：主视觉 / 项目 / 生态 / 关于
├── 404.html                      自定义错误页
├── projects/
│   ├── super-agent-party/index.html
│   ├── comfyui-llm-party/index.html
│   ├── exameow/index.html
│   └── labelall/index.html
├── css/
│   ├── style.css                 主题令牌、背景层、导航、HUD 组件、首页
│   └── project.css               项目详情页
├── js/
│   ├── lang-boot.js              首屏前确定语言（外部脚本，配合严格 CSP）
│   ├── data.js                   ★ 全部项目与生态内容（中英双语）
│   ├── i18n.js                   ★ 界面文案表 + 语言切换
│   ├── starfield.js              Three.js 主视觉
│   ├── app.js                    导航 / 滚动 / 计数 / 首页渲染
│   └── project.js                项目详情页渲染
├── assets/
│   ├── favicon.svg
│   └── img/                      截图（WebP）
├── _headers                      Cloudflare Pages 响应头
├── robots.txt
└── sitemap.xml
```

## 本地预览

无需安装任何依赖，任意静态服务器即可：

```bash
# 方式一：Python
python3 -m http.server 8080

# 方式二：Node
npx serve .
```

然后打开 <http://localhost:8080>。

> 建议用服务器而不是直接双击 `index.html`：项目详情页使用了 `/assets/...` 这样的绝对路径。

## 维护内容

### 新增 / 修改项目

编辑 `js/data.js`：

1. 在 `projects` 数组里加一个对象，照抄现有条目的结构（`slug` 决定详情页 URL）。
2. 在 `projects/<slug>/index.html` 复制一个现有页面的骨架，把 `data-slug` 改成新的 slug，并更新 `<head>` 里的标题、描述与 canonical。
3. 把截图放进 `assets/img/`，建议先用 WebP 压缩。
4. 更新 `sitemap.xml` 里的链接。
5. 首页顶部的星标总数写在 `totals` 与 `index.html` 的 `data-count` 里，记得同步。

### 修改界面文案

编辑 `js/i18n.js` 的 `zh` / `en` 两个对象。HTML 里用 `data-i18n="键名"` 引用；需要保留 HTML 标签的用 `data-i18n-html`；只改属性（如 `aria-label`）的用 `data-i18n-aria` + `data-i18n-attr`。

### 样式调整

全部设计变量集中在 `css/style.css` 顶部 `:root`：配色、字体、圆角、缓动都在那里。改一处，全站生效。

## 部署到 Cloudflare Pages

1. 把本仓库推到 GitHub（`heshengtao/superagentparty.com`）。
2. 打开 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**，选择该仓库。
3. 构建设置：
   - **Framework preset**：`None`
   - **Build command**：留空
   - **Build output directory**：`/`
4. 保存并部署。之后每次 push 到 `main` 会自动重新发布。
5. 在 **Custom domains** 里绑定 `superagentparty.com` 与 `www.superagentparty.com`。

> 缓存提示：`css/` `js/` `assets/` 设置了 `immutable` 长缓存。改完这些文件后，请把 HTML 里引用的 `?v=1` 递增为 `?v=2`，否则访客可能拿到旧文件。

## 技术栈

原生 HTML · CSS · JavaScript（无框架、无依赖） · Three.js r160（CDN 按需加载） · Google Fonts（Space Grotesk / Inter / JetBrains Mono）

## 许可

本站代码以 [MIT](./LICENSE) 许可开源。各项目截图与 Logo 版权归其各自项目所有。
