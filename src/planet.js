import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const ink = 0x45545a;
const material = (name, color, options = {}) =>
  new THREE.MeshToonMaterial({ name, color, ...options });

const paints = {
  road: material("road", 0x81908a, { side: THREE.DoubleSide }),
  plaza: material("plaza", 0xd2c4a2, { side: THREE.DoubleSide }),
  water: material("water", 0x6baeb1, { side: THREE.DoubleSide }),
  cloud: material("cloud", 0xf6f4e6),
  building: material("building", 0xf0eee0),
  warm: material("building-warm", 0xd4c8aa),
  coral: material("building-coral", 0xc9876f),
  blue: material("building-blue", 0x9ab9b8),
  roof: material("roof", 0x566c70),
  roofWarm: material("roof-warm", 0xb97359),
  window: material("window", 0x53777d),
  windowLight: material("window-light", 0xa7d0cb),
  tree: material("tree", 0x4d8665),
  treeLight: material("tree-light", 0x80a47a),
  treeShadow: material("tree-shadow", 0x416c58),
  bark: material("tree-bark", 0x766f61),
  trunk: material("trunk", 0x797667),
  stone: material("stone", 0xc9c9b0),
  ink: material("ink", ink),
  accent: material("accent", 0xe1b46e),
  tower: material("tower", 0x617b7b),
};

const box = new THREE.BoxGeometry(1, 1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 6);
const octagon = new THREE.CylinderGeometry(1, 1, 1, 8);
const cone = new THREE.ConeGeometry(1, 1, 6);
const treeTrunk = new THREE.CylinderGeometry(0.65, 1, 1, 5);
const boulder = new THREE.IcosahedronGeometry(1, 0);
const disk = new THREE.CircleGeometry(1, 16);
disk.rotateX(-Math.PI / 2);
const up = new THREE.Vector3(0, 1, 0);
const identity = new THREE.Matrix4();
const referenceRadius = 1.6;

function surfaceScale(radius) {
  return radius / referenceRadius;
}

function scaleMatrix(scale) {
  return new THREE.Matrix4().makeScale(scale, scale, scale);
}

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function elevation(normal, radius) {
  const { x, y, z } = normal;
  const ripple =
    Math.sin(x * 7.7 + z * 2.8) * 0.115 +
    Math.cos(z * 8.4 - y * 3.3) * 0.085 +
    Math.sin(y * 11 + x * 3.2) * 0.05;
  return radius + ripple * Math.min(1, radius / 2.1);
}

function surfacePoint(normal, radius, offset = 0) {
  return normal.clone().multiplyScalar(elevation(normal, radius) + offset);
}

function tangentMatrix(normal, radius, yaw = 0, offset = 0) {
  const orientation = new THREE.Quaternion().setFromUnitVectors(up, normal);
  orientation.multiply(new THREE.Quaternion().setFromAxisAngle(up, yaw));
  return new THREE.Matrix4().compose(
    surfacePoint(normal, radius, offset),
    orientation,
    new THREE.Vector3(1, 1, 1),
  );
}

function fragment(
  buckets,
  geometry,
  paint,
  parent = identity,
  position,
  scale,
) {
  const transform = new THREE.Matrix4().makeScale(...scale);
  transform.premultiply(new THREE.Matrix4().makeTranslation(...position));
  transform.premultiply(parent);
  const copy = geometry.clone();
  const part = copy.index ? copy.toNonIndexed() : copy;
  if (part !== copy) copy.dispose();
  part.applyMatrix4(transform);
  if (!buckets.has(paint)) buckets.set(paint, []);
  buckets.get(paint).push(part);
}

function addMesh(buckets, geometry, paint) {
  if (!buckets.has(paint)) buckets.set(paint, []);
  const part = geometry.index ? geometry.toNonIndexed() : geometry;
  if (part !== geometry) geometry.dispose();
  buckets.get(paint).push(part);
}

function direction(index, count, seed) {
  const wrapped = ((index % count) + count) % count;
  const y = 1 - ((wrapped + 0.5) * 2) / count;
  const angle = wrapped * Math.PI * (3 - Math.sqrt(5)) + seed;
  const ring = Math.sqrt(1 - y * y);
  return new THREE.Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
}

function makeTerrain(radius, palette, globe) {
  const geometry = new THREE.IcosahedronGeometry(radius, 4);
  const positions = geometry.getAttribute("position");
  const colors = [];
  const ground = new THREE.Color(palette.ground);
  const rock = new THREE.Color(palette.rock);
  const low = ground.clone().multiplyScalar(0.78);
  const pale = ground.clone().lerp(rock, 0.35);
  for (let i = 0; i < positions.count; i++) {
    const normal = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i),
    ).normalize();
    const height = elevation(normal, radius);
    positions.setXYZ(
      i,
      normal.x * height,
      normal.y * height,
      normal.z * height,
    );
    const color =
      height < radius - 0.075 ? low : height > radius + 0.105 ? pale : ground;
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(
    geometry,
    material("terrain", 0xffffff, { vertexColors: true }),
  );
  terrain.name = "terrain";
  terrain.receiveShadow = true;
  globe.add(terrain);
  const outline = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({ color: ink, side: THREE.BackSide }),
  );
  outline.scale.setScalar(1.014);
  outline.name = "terrain-outline";
  globe.add(outline);
}

function makeRoad(buckets, radius, offset, phase, meridian = false) {
  const detail = surfaceScale(radius);
  const positions = [];
  const indices = [];
  const steps = 92;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const latitude = offset + Math.sin(angle * 2 + phase) * 0.12;
    const normal = meridian
      ? new THREE.Vector3(
          Math.cos(phase) * Math.cos(angle),
          Math.sin(angle),
          Math.sin(phase) * Math.cos(angle),
        )
      : new THREE.Vector3(
          Math.cos(angle),
          latitude,
          Math.sin(angle),
        ).normalize();
    const tangent = meridian
      ? new THREE.Vector3(
          -Math.cos(phase) * Math.sin(angle),
          Math.cos(angle),
          -Math.sin(phase) * Math.sin(angle),
        )
      : new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const across = new THREE.Vector3()
      .crossVectors(normal, tangent)
      .normalize();
    for (const side of [-1, 1]) {
      const edge = normal
        .clone()
        .addScaledVector(across, side * (meridian ? 0.055 : 0.075) * detail)
        .normalize();
      const point = surfacePoint(edge, radius, 0.025 * detail);
      positions.push(point.x, point.y, point.z);
    }
    if (i < steps) {
      const j = i * 2;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  addMesh(buckets, geometry, paints.road);
}

function makeBuilding(buckets, globe, normal, radius, random, index) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(
    normal,
    radius,
    random() * Math.PI * 2,
    0.016 * detail,
  );
  const size = radius / 2.7;
  base.multiply(scaleMatrix(size));
  const type = index % 4;
  const width = [0.57, 0.83, 1.08, 0.62][type] + random() * 0.12;
  const depth = [0.54, 0.61, 0.78, 0.62][type] + random() * 0.08;
  const height = [1.23, 0.87, 0.58, 1.02][type] + random() * 0.23;
  const paint = [paints.building, paints.warm, paints.blue, paints.coral][
    index % 4
  ];
  const roofPaint = index % 3 === 0 ? paints.roofWarm : paints.roof;
  const body = new THREE.Mesh(type === 3 ? octagon : box, paint);
  body.name = "building-body";
  body.geometry = body.geometry.clone();
  body.geometry.applyMatrix4(
    base
      .clone()
      .multiply(
        new THREE.Matrix4()
          .makeTranslation(0, height / 2, 0)
          .multiply(new THREE.Matrix4().makeScale(width, height, depth)),
      ),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  globe.add(body);
  fragment(
    buckets,
    box,
    roofPaint,
    base,
    [0, height + 0.035, 0],
    [width + 0.1, 0.07, depth + 0.1],
  );
  const floors = type === 2 ? 2 : type === 0 ? 5 : 3;
  for (let floor = 0; floor < floors; floor++) {
    const y = ((floor + 1) * height) / (floors + 1);
    for (const x of [-width * 0.28, 0, width * 0.28]) {
      fragment(
        buckets,
        box,
        index % 3 === 0 ? paints.windowLight : paints.window,
        base,
        [x, y, depth / 2 + 0.012],
        [
          type === 0 ? 0.095 : 0.13,
          Math.min(0.15, height / (floors + 2)),
          0.018,
        ],
      );
    }
    if (type === 1 || type === 2) {
      fragment(
        buckets,
        box,
        roofPaint,
        base,
        [0, y - 0.11, depth / 2 + 0.12],
        [width * 0.84, 0.035, 0.2],
      );
    }
  }
  if (type === 0) {
    fragment(
      buckets,
      box,
      paints.window,
      base,
      [0, height + 0.24, 0],
      [width * 0.62, 0.43, depth * 0.62],
    );
    fragment(
      buckets,
      box,
      paints.accent,
      base,
      [0, height + 0.54, 0],
      [0.055, 0.22, 0.055],
    );
  }
  if (type === 2) {
    fragment(
      buckets,
      box,
      paints.warm,
      base,
      [width * 0.38, height * 0.55, -depth * 0.2],
      [width * 0.55, height * 1.1, depth * 0.54],
    );
    fragment(
      buckets,
      box,
      paints.windowLight,
      base,
      [0, height + 0.16, -depth * 0.1],
      [width * 0.64, 0.23, depth * 0.58],
    );
  }
  if (type === 3) {
    for (const y of [height * 0.28, height * 0.57, height * 0.84]) {
      fragment(
        buckets,
        octagon,
        paints.windowLight,
        base,
        [0, y, 0],
        [width + 0.045, 0.08, depth + 0.045],
      );
    }
    fragment(
      buckets,
      cylinder,
      paints.accent,
      base,
      [0, height + 0.29, 0],
      [0.035, 0.5, 0.035],
    );
  }
}

function makeTree(buckets, normal, radius, random) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(normal, radius, random() * 6.28, 0.015 * detail);
  const size = detail;
  base.multiply(scaleMatrix(size));
  const height = 0.72 + random() * 0.25;
  const variety = random();
  fragment(
    buckets,
    treeTrunk,
    paints.bark,
    base,
    [0, height * 0.38, 0],
    [0.048, height * 0.8, 0.048],
  );
  if (variety < 0.72) {
    // Overlapping, wide skirts give the pines a stepped low-poly silhouette.
    for (const [y, width, tierHeight, paint] of [
      [0.51, 0.29, 0.48, paints.treeShadow],
      [0.74, 0.23, 0.43, paints.tree],
      [0.96, 0.16, 0.42, paints.treeLight],
    ]) {
      fragment(
        buckets,
        cone,
        paint,
        base,
        [0, height * y, 0],
        [width * height, height * tierHeight, width * height],
      );
    }
  } else {
    // Asymmetric faceted clumps echo the reference's rounded broadleaf trees.
    for (const [x, y, z, width, paint] of [
      [-0.13, 0.78, 0.02, 0.24, paints.tree],
      [0.13, 0.85, -0.02, 0.26, paints.treeLight],
      [-0.01, 1.0, 0.04, 0.25, paints.treeLight],
    ]) {
      fragment(
        buckets,
        boulder,
        paint,
        base,
        [x * height, y * height, z * height],
        [width * height, width * height * 0.9, width * height],
      );
    }
  }
}

function makeForest(buckets, normal, radius, random, count) {
  const detail = surfaceScale(radius);
  const east = new THREE.Vector3()
    .crossVectors(
      Math.abs(normal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up,
      normal,
    )
    .normalize();
  const north = new THREE.Vector3().crossVectors(normal, east).normalize();
  for (let i = 0; i < count; i++) {
    const angle = i * 2.4 + random() * 0.3;
    const spread = i === 0 ? 0 : (0.32 + random() * 0.13) * detail;
    const treeNormal = normal
      .clone()
      .addScaledVector(east, (Math.cos(angle) * spread) / radius)
      .addScaledVector(north, (Math.sin(angle) * spread) / radius)
      .normalize();
    makeTree(buckets, treeNormal, radius, random);
  }
}

function makeTower(buckets, normal, radius, index) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(normal, radius, index * 1.7, 0.025 * detail);
  base.multiply(scaleMatrix(detail));
  fragment(
    buckets,
    octagon,
    paints.plaza,
    base,
    [0, 0.055, 0],
    [0.42, 0.11, 0.42],
  );
  fragment(
    buckets,
    octagon,
    paints.tower,
    base,
    [0, 0.6, 0],
    [0.21, 1.15, 0.21],
  );
  fragment(
    buckets,
    octagon,
    paints.roofWarm,
    base,
    [0, 1.21, 0],
    [0.29, 0.1, 0.29],
  );
  fragment(
    buckets,
    cylinder,
    paints.ink,
    base,
    [0, 1.51, 0],
    [0.025, 0.52, 0.025],
  );
  fragment(
    buckets,
    cone,
    paints.accent,
    base,
    [0, 1.84, 0],
    [0.13, 0.24, 0.13],
  );
}

function makeBeam(buckets, base, start, end, width) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const length = a.distanceTo(b);
  const transform = base
    .clone()
    .multiply(
      new THREE.Matrix4().makeTranslation(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        (a.z + b.z) / 2,
      ),
    )
    .multiply(
      new THREE.Matrix4().makeRotationFromQuaternion(
        new THREE.Quaternion().setFromUnitVectors(
          up,
          b.clone().sub(a).normalize(),
        ),
      ),
    )
    .multiply(new THREE.Matrix4().makeScale(width, length, width));
  const part = cylinder.clone().toNonIndexed();
  part.applyMatrix4(transform);
  if (!buckets.has(paints.tower)) buckets.set(paints.tower, []);
  buckets.get(paints.tower).push(part);
}

function makeTransmissionTower(buckets, normal, radius, yaw) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(normal, radius, yaw, 0.02 * detail);
  base.multiply(scaleMatrix(detail));
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      makeBeam(
        buckets,
        base,
        [x * 0.25, 0, z * 0.25],
        [x * 0.08, 1.4, z * 0.08],
        0.038,
      );
    }
    makeBeam(buckets, base, [x * 0.2, 0.28, 0], [-x * 0.14, 0.76, 0], 0.023);
    makeBeam(buckets, base, [x * 0.14, 0.76, 0], [-x * 0.1, 1.16, 0], 0.023);
  }
  for (const y of [0.52, 0.98, 1.34]) {
    fragment(
      buckets,
      box,
      paints.tower,
      base,
      [0, y, 0],
      [0.65 - y * 0.2, 0.04, 0.045],
    );
  }
  fragment(
    buckets,
    cylinder,
    paints.accent,
    base,
    [0, 1.53, 0],
    [0.045, 0.3, 0.045],
  );
}

function makeUtilityPole(buckets, normal, radius, yaw) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(normal, radius, yaw, 0.015 * detail);
  base.multiply(scaleMatrix(detail));
  fragment(
    buckets,
    cylinder,
    paints.trunk,
    base,
    [0, 0.38, 0],
    [0.032, 0.76, 0.032],
  );
  fragment(buckets, box, paints.ink, base, [0, 0.69, 0], [0.38, 0.035, 0.035]);
  for (const x of [-0.14, 0.14]) {
    fragment(
      buckets,
      cylinder,
      paints.building,
      base,
      [x, 0.75, 0],
      [0.027, 0.09, 0.027],
    );
  }
}

function makeSurfaceCloud(buckets, normal, radius, random) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(
    normal,
    radius,
    random() * 6.28,
    (0.46 + random() * 0.08) * detail,
  );
  base.multiply(scaleMatrix(detail));
  const cloudScale = 0.72 + random() * 0.62;
  const forms = [
    [
      [-0.42, 0, 0],
      [-0.14, 0.04, 0.03],
      [0.18, 0.01, -0.03],
      [0.42, 0, 0],
    ],
    [
      [-0.24, 0, 0],
      [0, 0.02, 0.18],
      [0.24, 0, 0],
      [0, 0.09, -0.12],
    ],
    [
      [-0.2, 0, 0],
      [0, 0.12, 0.03],
      [0.2, 0, 0],
      [0, 0.03, -0.2],
      [0, 0.04, 0.2],
    ],
  ];
  const form = forms[Math.floor(random() * forms.length)];
  for (let i = 0; i < form.length; i++) {
    const [x, y, z] = form[i];
    fragment(
      buckets,
      boulder,
      paints.cloud,
      base,
      [
        x * cloudScale,
        0.06 + y * cloudScale + random() * 0.025,
        z * cloudScale,
      ],
      [
        (0.23 + random() * 0.14) * cloudScale,
        (0.14 + random() * 0.09) * cloudScale,
        (0.2 + random() * 0.1) * cloudScale,
      ],
    );
  }
}

function flush(buckets, globe) {
  for (const [paint, parts] of buckets) {
    const geometry = mergeGeometries(parts, false);
    for (const part of parts) part.dispose();
    if (!geometry) throw new Error(`Could not merge ${paint.name} geometry`);
    const mesh = new THREE.Mesh(geometry, paint);
    mesh.castShadow = paint !== paints.road && paint !== paints.water;
    mesh.receiveShadow = true;
    globe.add(mesh);
  }
}

export function makePlanet(project, radius, seed, palette) {
  const random = seeded(seed);
  const root = new THREE.Group();
  root.userData.projectId = project.id;
  const globe = new THREE.Group();
  root.add(globe);
  makeTerrain(radius, palette, globe);
  const buckets = new Map();
  const main = project.kind === "main";
  const detail = surfaceScale(radius);
  if (main) {
    for (const [offset, phase] of [
      [-0.43, 0.8],
      [0.13, 2.1],
      [0.62, 4.2],
    ]) {
      makeRoad(buckets, radius, offset, phase);
    }
    makeRoad(buckets, radius, 0, 0.7, true);
    for (let i = 0; i < 2; i++) {
      const normal = direction(i * 11 + 5, 24, seed + 0.4);
      const base = tangentMatrix(normal, radius, i, 0.027 * detail);
      base.multiply(scaleMatrix(detail));
      fragment(
        buckets,
        disk,
        paints.plaza,
        base,
        [0, 0, 0],
        [0.5 + i * 0.1, 1, 0.44],
      );
      makeTower(buckets, normal, radius, i);
    }
    for (let i = 0; i < 2; i++) {
      const normal = direction(i * 13 + 6, 26, seed + 1.2);
      const base = tangentMatrix(normal, radius, i * 2.1, 0.031 * detail);
      base.multiply(scaleMatrix(detail));
      fragment(
        buckets,
        disk,
        paints.water,
        base,
        [0, 0, 0],
        [0.6 + i * 0.08, 1, 0.38 + i * 0.04],
      );
    }
    for (let i = 0; i < 20; i++) {
      const normal =
        i === 0
          ? new THREE.Vector3(-0.25, 0.1, 0.96).normalize()
          : i === 1
            ? new THREE.Vector3(0.41, 0.25, 0.88).normalize()
            : direction(i, 20, seed);
      makeBuilding(buckets, globe, normal, radius, random, i);
    }
    for (let i = 0; i < 2; i++) {
      makeTransmissionTower(
        buckets,
        direction(i * 13 + 8, 29, seed + 0.9),
        radius,
        i * 1.2,
      );
    }
    for (let i = 0; i < 16; i++) {
      const normal = direction(i, 16, seed + 1.7);
      const base = tangentMatrix(
        normal,
        radius,
        random() * 6.28,
        -0.03 * detail,
      );
      base.multiply(scaleMatrix(detail));
      fragment(
        buckets,
        boulder,
        paints.stone,
        base,
        [0, 0.06, 0],
        [0.25 + random() * 0.15, 0.12 + random() * 0.08, 0.24],
      );
    }
    for (let i = 0; i < 11; i++) {
      makeForest(
        buckets,
        direction(i, 11, seed + 0.3),
        radius,
        random,
        4 + (i % 3),
      );
    }
    for (const [x, y, z] of [
      [-0.65, 0.3, 0.7],
      [0.55, -0.42, 0.72],
      [-0.22, -0.55, 0.8],
    ]) {
      makeForest(
        buckets,
        new THREE.Vector3(x, y, z).normalize(),
        radius,
        random,
        5,
      );
    }
    for (let i = 0; i < 12; i++) {
      makeUtilityPole(
        buckets,
        direction(i, 12, seed + 1),
        radius,
        random() * Math.PI,
      );
    }
    const cloudCount = Math.max(4, Math.round(radius * 3));
    for (let i = 0; i < cloudCount; i++) {
      makeSurfaceCloud(
        buckets,
        direction(i, cloudCount, seed + 0.6),
        radius,
        random,
      );
    }
  } else {
    for (let i = 0; i < (radius < 1 ? 4 : 7); i++) {
      makeForest(
        buckets,
        direction(i, radius < 1 ? 4 : 7, seed),
        radius,
        random,
        radius < 1 ? 3 : 4,
      );
    }
  }
  flush(buckets, globe);
  root.userData.globe = globe;
  return root;
}
