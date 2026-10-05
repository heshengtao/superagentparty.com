# Planet Portfolio Implementation Plan

> **For agentic workers:** Implement inline in this session. Preserve the user's existing dirty worktree and do not commit unrelated changes.

**Goal:** Build a responsive, bilingual personal portfolio that presents each known repository as an interactive low-poly planet and related repositories as satellites.

**Architecture:** A static Vite site uses Three.js for the full-bleed world and semantic HTML for navigation, project details, and fallback. Project data lives separately from scene geometry. The scene exposes selection and motion controls to the UI layer.

**Tech Stack:** Vite, Three.js, vanilla JavaScript, CSS, Node built-in test runner, browser screenshot verification.

## Global Constraints

- Preserve README, LICENSE and unrelated worktree changes.
- Use verified repository information from README; display only the 16 named repositories.
- Use original low-poly geometry; do not copy the reference game's assets.
- Provide keyboard, touch, reduced-motion and WebGL fallback paths.
- Keep the 3D scene full-bleed and visually dominant on desktop and mobile.

---

### Task 1: Data and relationships

**Files:** `package.json`, `src/projects.js`, `tests/projects.test.js`

- [ ] Add tests that count 16 known projects, verify unique IDs, valid parent links, and main-project metadata needed by the UI.
- [ ] Run tests and confirm expected failure before implementing.
- [ ] Implement project data and relation helpers with Chinese and English copy.
- [ ] Run tests and confirm pass.

### Task 2: Planet scene

**Files:** `src/world.js`, `src/planet.js`, `src/styles.css`

- [ ] Build low-poly spherical terrain, clustered buildings, trees, rocks, rings, and project-specific landmarks with original geometry.
- [ ] Place four main projects and twelve smaller worlds, with ecological satellites visibly grouped by parent.
- [ ] Add camera framing, pointer picking, drag orbit and zoom, selected-project focus, and motion control.
- [ ] Validate actual canvas pixels in desktop and mobile browser screenshots.

### Task 3: Portfolio UI

**Files:** `index.html`, `src/main.js`, `src/styles.css`, `public/favicon.svg`

- [ ] Add semantic navigation, bilingual copy, repository directory, about view, project details and source/demo actions.
- [ ] Connect UI controls to world selection and full-view navigation; support Escape and keyboard focus.
- [ ] Provide meaningful project links when WebGL fails.
- [ ] Verify desktop/mobile layout, interactive controls, no overlap, and reduced-motion behavior.

### Task 4: Final verification

**Files:** `README.md` only if implementation information needs correction; site metadata files as needed.

- [ ] Run unit tests and production build.
- [ ] Run site locally and inspect desktop/mobile screenshots, canvas pixels and browser console.
- [ ] Correct observed defects, rerun checks, and leave the development server running for review.
