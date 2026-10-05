# 星球树木风格改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将所有星球上的树替换为参考图方向的分层、错位、柔和低多边形树，同时保持球面贴合、批量合并和现有交互不变。

**Architecture:** 在 `src/planet.js` 内扩展现有材质与几何复用，重写 `makeTree` 的局部几何生成：用收窄短树干和多个低细分冠层组合成一棵树，继续通过 `fragment` 放入共享材质桶并由 `flush` 合并。`makeForest` 保持调用接口与随机种子流程，只根据半径把大星球和小卫星的冠层数量缩放。

**Tech Stack:** Three.js 0.180、原生 ES modules、Node.js `node:test`、Vite。

## Global Constraints

- 改动集中在 `src/planet.js` 与 `tests/planet.test.js`，不改变项目数据、镜头、交互或页面文案。
- 继续使用现有 `fragment`、材质桶和 `flush`，主星 drawable 数量保持低于现有测试阈值 60。
- 树木尺寸通过 `radius` 缩放；相同 `seed` 必须生成稳定结果。
- 不增加贴图、后处理、粒子树叶、风动画或树木交互。
- 必须运行 `npm test`、`npm run build`，并用浏览器截图检查视觉结果。

---

### Task 1: 为分层树形建立可观察的几何契约

**Files:**

- Modify: `tests/planet.test.js`
- Modify: `src/planet.js:20-27` only if a named material is needed by the assertions

**Interfaces:**

- Consumes: `makePlanet(project, radius, seed, palette)` and the existing material names.
- Produces: tests that assert a generated world contains a restrained trunk and multiple canopy layers without relying on private helpers.

- [ ] **Step 1: Write the failing test**

在 `tests/planet.test.js` 增加测试，遍历一颗主星并收集材质名与树相关 mesh 的包围盒高度：

```js
test("trees use layered canopies with restrained trunks", () => {
  const world = makePlanet(getProject("super-agent-party"), 3.05, 5, {
    ground: 0x9fae86,
    rock: 0xd2ccb2,
  });
  const names = new Set();
  const canopyMeshes = [];
  world.traverse((object) => {
    if (!object.isMesh) return;
    names.add(object.material.name);
    if (["tree", "tree-light", "tree-shadow"].includes(object.material.name)) {
      canopyMeshes.push(object);
    }
  });
  assert.ok(names.has("trunk"), "trees have no trunk material");
  assert.ok(names.has("tree"), "trees have no main canopy material");
  assert.ok(names.has("tree-light"), "trees have no highlight canopy material");
  assert.ok(names.has("tree-shadow"), "trees have no shadow canopy material");
  assert.ok(canopyMeshes.length >= 3, "tree canopies were not batched");
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/planet.test.js`
Expected: FAIL because the current material table has no `tree-shadow` material and the current tree only creates one canopy material.

- [ ] **Step 3: Keep the test focused**

Do not assert exact mesh counts or vertex counts; the implementation must remain free to merge geometry and change the number of layers while preserving the visible material contract.

- [ ] **Step 4: Run the focused test after implementation in Task 2**

Run: `node --test tests/planet.test.js`
Expected: PASS, with existing terrain, building, satellite, and finite-coordinate tests still passing.

---

### Task 2: Implement the reference-style tree generator

**Files:**

- Modify: `src/planet.js:20-27` to add `treeShadow` and keep a low-saturation bark material.
- Modify: `src/planet.js:320-342` replacing `makeTree` with restrained trunk and layered canopy geometry.

**Interfaces:**

- Consumes: `fragment(buckets, geometry, paint, parent, position, scale)`, `tangentMatrix`, `cylinder`, `cone`, `boulder`, `paints`, `radius`, and seeded `random`.
- Produces: `makeTree(buckets, normal, radius, random)` with the same signature and no new exported API.

- [ ] **Step 1: Add named materials**

Extend `paints` with a dark canopy layer:

```js
treeShadow: material("tree-shadow", 0x3e6f59),
```

Keep `tree` as the middle green and `treeLight` as the sunlit green. Do not create per-tree materials; all three must remain shared instances for batching.

- [ ] **Step 2: Replace the single cone with layered canopy fragments**

Keep `tangentMatrix(normal, radius, random() * 6.28, 0.015)` and radius-based `size`, then use a shorter trunk and 3–5 canopy fragments. Use `boulder` for rounded faceted masses, with deterministic offsets derived from `random()`:

```js
const height = 0.72 + random() * 0.25;
fragment(
  buckets,
  treeTrunk,
  paints.bark,
  base,
  [0, height * 0.38, 0],
  [0.048, height * 0.8, 0.048],
);
const layers = radius < 0.9 ? 3 : 4 + (random() > 0.5 ? 1 : 0);
for (let layer = 0; layer < layers; layer++) {
  const y = height * 0.66 + layer * 0.16;
  const spread = 0.11 + layer * 0.018;
  const x = (random() - 0.5) * spread;
  const z = (random() - 0.5) * spread;
  const width = 0.18 - layer * 0.012 + random() * 0.025;
  const depth = 0.16 - layer * 0.009 + random() * 0.02;
  const paint =
    layer === 0
      ? paints.treeShadow
      : layer === layers - 1
        ? paints.treeLight
        : paints.tree;
  fragment(
    buckets,
    boulder,
    paint,
    base,
    [x, y, z],
    [width, 0.13 + random() * 0.035, depth],
  );
}
```

The exact local values may be tuned during screenshot review, but keep the layer count and shared materials intact. The canopy must overlap slightly so it reads as one tree rather than separate rocks, with no exposed side branches.

- [ ] **Step 4: Run unit tests**

Run: `npm test`
Expected: PASS. If the drawable-count test exceeds 60, reduce canopy fragments through material batching or lower the layer count; do not remove the layered silhouette requirement.

- [ ] **Step 5: Run the production build**

Run: `npm run build`
Expected: Vite completes without errors and writes the production bundle.

---

### Task 3: Validate visual output and regression behavior

**Files:**

- Modify: `tests/planet.test.js` only if a focused assertion needs adjustment after the implementation is verified.
- No other source files should change.

**Interfaces:**

- Consumes: built app and existing `scripts/browser-smoke.mjs`.
- Produces: verified desktop and mobile rendering with no browser console errors.

- [ ] **Step 1: Run the browser smoke check**

Start the app with `npm run dev -- --host 0.0.0.0`, then run `npm run test:browser`.
Expected: the page loads, the WebGL scene renders, and the smoke script reports no uncaught page errors.

- [ ] **Step 2: Inspect a desktop screenshot**

Use the existing browser tooling to capture the main scene at a desktop viewport. Confirm that tree crowns read as layered and rounded, the dark lower layer is visible, no wood geometry protrudes from the crowns, and buildings remain clickable.

- [ ] **Step 3: Inspect a mobile screenshot**

Capture a viewport at or below 700px width. Confirm that satellite trees remain compact, no crown overlaps the UI controls, and the existing mobile camera framing still keeps the main planet visible.

- [ ] **Step 4: Run the full verification set**

Run:

```bash
npm test
npm run build
npm run test:browser
```

Expected: all commands exit successfully. Report any visual limitation (for example, reference-image differences caused by the unavailable remote image) instead of changing unrelated scene elements.

- [ ] **Step 5: Commit if repository permissions allow**

```bash
git add src/planet.js tests/planet.test.js docs/superpowers/plans/2026-10-05-tree-style.md
git commit -m "feat: restyle planet trees"
```

If `.git/index` is read-only in the managed workspace, leave the working tree changes in place and report that commit creation was blocked by the environment.
