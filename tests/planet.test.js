import test from "node:test";
import assert from "node:assert/strict";
import { getProject } from "../src/projects.js";
import { makePlanet } from "../src/planet.js";

test("dense main worlds are batched and terrain is uneven", () => {
  const worlds = [
    makePlanet(getProject("super-agent-party"), 3.05, 5, {
      ground: 0x9fae86,
      rock: 0xd2ccb2,
    }),
    makePlanet(getProject("comfyui-llm-party"), 2.35, 19, {
      ground: 0x8aaba1,
      rock: 0xbbc6b5,
    }),
  ];
  for (const world of worlds) {
    const drawables = [];
    world.traverse((object) => {
      if (object.isMesh || object.isLineSegments) drawables.push(object);
    });
    assert.ok(drawables.length < 60, "main world has too many draw calls");
    const terrain = world.getObjectByName("terrain");
    assert.ok(terrain, "main world has no terrain surface");
    const position = terrain.geometry.getAttribute("position");
    const radii = [];
    for (let i = 0; i < position.count; i++) {
      radii.push(
        Math.hypot(position.getX(i), position.getY(i), position.getZ(i)),
      );
    }
    assert.ok(Math.max(...radii) - Math.min(...radii) > 0.18);
    const features = new Set(drawables.map((object) => object.material.name));
    for (const name of ["road", "plaza", "water", "cloud", "building"]) {
      assert.ok(features.has(name), `missing ${name} geometry`);
    }
  }
});

test("main worlds contain twenty substantial buildings and distinct towers", () => {
  const world = makePlanet(getProject("super-agent-party"), 3.05, 5, {
    ground: 0x9fae86,
    rock: 0xd2ccb2,
  });
  const buildings = [];
  const towerMaterials = [];
  world.traverse((object) => {
    if (object.name === "building-body") buildings.push(object);
    if (object.isMesh && object.material.name === "tower") {
      towerMaterials.push(object);
    }
  });
  assert.equal(buildings.length, 20);
  assert.ok(towerMaterials.length > 0, "no separate tower structures");
});

test("small satellites use slender forests without buildings", () => {
  const world = makePlanet(getProject("sap-live2d"), 0.64, 41, {
    ground: 0xb3bd98,
    rock: 0xcdcdb5,
  });
  const materials = [];
  world.traverse((object) => {
    if (object.isMesh) materials.push(object.material.name);
  });
  assert.ok(materials.includes("tree"));
  assert.ok(!materials.some((name) => name.startsWith("building")));
});

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
  assert.ok(names.has("tree-bark"), "trees have no bark material");
  assert.ok(names.has("tree"), "trees have no main canopy material");
  assert.ok(names.has("tree-light"), "trees have no highlight canopy material");
  assert.ok(names.has("tree-shadow"), "trees have no shadow canopy material");
  assert.ok(canopyMeshes.length >= 3, "tree canopies were not batched");
});

test("larger main worlds receive denser cloud cover", () => {
  const worlds = [
    makePlanet(getProject("super-agent-party"), 3.05, 5, {
      ground: 0x9fae86,
      rock: 0xd2ccb2,
    }),
    makePlanet(getProject("comfyui-llm-party"), 2.35, 19, {
      ground: 0x8aaba1,
      rock: 0xbbc6b5,
    }),
  ];
  const cloudVertexCounts = worlds.map((world) => {
    let count = 0;
    world.traverse((object) => {
      if (object.isMesh && object.material.name === "cloud") {
        count = object.geometry.getAttribute("position").count;
      }
    });
    return count;
  });
  assert.ok(cloudVertexCounts[0] > cloudVertexCounts[1]);
});

test("all placed geometry has finite coordinates", () => {
  const world = makePlanet(getProject("comfyui-llm-party"), 2.35, 19, {
    ground: 0x8aaba1,
    rock: 0xbbc6b5,
  });
  world.traverse((object) => {
    if (!object.isMesh) return;
    const positions = object.geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      assert.ok(
        Number.isFinite(positions.getX(i)) &&
          Number.isFinite(positions.getY(i)) &&
          Number.isFinite(positions.getZ(i)),
        `${object.material.name}: non-finite vertex ${i}`,
      );
    }
  });
});
