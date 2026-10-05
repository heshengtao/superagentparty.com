import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projects, getProject, getChildren } from "../src/projects.js";

test("every named repository has a unique navigable record", () => {
  assert.equal(projects.length, 15);
  assert.equal(new Set(projects.map((project) => project.id)).size, 15);
  for (const project of projects) {
    assert.match(project.source, /^https:\/\/github\.com\/heshengtao\//);
    assert.ok(project.name);
    assert.ok(project.summary.zh);
    assert.ok(project.summary.en);
    assert.equal(getProject(project.id), project);
  }
});

test("ecosystem repositories orbit only known flagship projects", () => {
  const children = projects.filter((project) => project.parent);
  assert.equal(children.length, 11);
  for (const child of children) {
    assert.ok(
      ["super-agent-party", "comfyui-llm-party"].includes(child.parent),
    );
    assert.ok(getChildren(child.parent).includes(child));
  }
  assert.equal(getProject("topics-after-party"), undefined);
});

test("each main world has detail content and direct navigation", () => {
  for (const id of [
    "super-agent-party",
    "comfyui-llm-party",
    "exameow",
    "labelall",
  ]) {
    const project = getProject(id);
    assert.equal(project.kind, "main");
    assert.ok(project.stars >= 0);
    assert.match(project.license, /^(AGPL-3\.0|Apache-2\.0)$/);
    assert.ok(project.description.zh.length > project.summary.zh.length);
    assert.ok(project.description.en.length > project.summary.en.length);
  }
  assert.equal(getProject("missing"), undefined);
  assert.deepEqual(getChildren("missing"), []);
});

test("satellite markers do not use the red accent dot", () => {
  const styles = readFileSync(
    new URL("../src/styles.css", import.meta.url),
    "utf8",
  );
  const satelliteRule =
    styles.match(/\.planet-label\.is-satellite::before\s*\{([^}]*)\}/)?.[1] ||
    "";
  assert.match(satelliteRule, /display:\s*none/);
});
