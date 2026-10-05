import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const ink = 0x36484d;
const material = (name, color, options = {}) =>
  new THREE.MeshToonMaterial({ name, color, ...options });

const paints = {
  // Road & infrastructure
  road: material("road", 0x475558, { side: THREE.DoubleSide }),
  yellowLine: material("yellow-line", 0xf5b233, { side: THREE.DoubleSide }),
  roadStripe: material("road-stripe", 0xf7f8f2, { side: THREE.DoubleSide }),
  plaza: material("plaza", 0xd8cca8, { side: THREE.DoubleSide }),
  water: material("water", 0x3ea6a2, { side: THREE.DoubleSide }),

  // Atmosphere
  cloud: material("cloud", 0xfbfbf5),

  // Architecture & buildings
  building: material("building", 0xf4f1e4),
  warm: material("building-warm", 0xdcd1b8),
  coral: material("building-coral", 0xd9755b),
  blue: material("building-blue", 0x93bebc),
  roof: material("roof", 0x4a5d62),
  roofWarm: material("roof-warm", 0xbf674b),
  window: material("window", 0x3a595f),
  windowLight: material("window-light", 0xaee2db),

  // Industrial elements (inspired by reference image center)
  industrialOrange: material("industrial-orange", 0xd26842),

  // Nature
  tree: material("tree", 0x4d8665),
  treeLight: material("tree-light", 0x7aa474),
  treeShadow: material("tree-shadow", 0x396550),
  bark: material("tree-bark", 0x766d5e),
  trunk: material("trunk", 0x787364),
  stone: material("stone", 0xc8c3ab),

  // Structural details & infrastructure
  tower: material("tower", 0x5a7578),
  accent: material("accent", 0xe5b550),
  ink: material("ink", ink),
};

const box = new THREE.BoxGeometry(1, 1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
const octagon = new THREE.CylinderGeometry(1, 1, 1, 8);
const cone = new THREE.ConeGeometry(1, 1, 8);
const treeTrunk = new THREE.CylinderGeometry(0.65, 1, 1, 5);
const boulder = new THREE.IcosahedronGeometry(1, 1);
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

// Lake Center for natural crater basin
const lakeCenterSAP = new THREE.Vector3(-0.62, -0.22, 0.48).normalize();
const lakeAngularRadius = 0.36;

/**
 * Procedural low-poly terrain elevation function.
 * Creates sharp mountain ridges, carved lake basins, and stepped plateaus.
 */
function elevation(normal, radius) {
  const { x, y, z } = normal;
  const detail = Math.min(1.4, Math.max(0.25, radius / 2.2));

  // Continents and plateau foundations
  const c1 =
    Math.sin(x * 2.3 + 1.2) * Math.cos(y * 2.1) +
    Math.sin(z * 2.5 + 0.8) * Math.cos(x * 1.9);

  // Sharp mountain ridges and peaks
  const ridge1 = 1.0 - Math.abs(Math.sin(x * 4.6 + z * 3.2) * Math.cos(y * 4.1));
  const ridge2 = 1.0 - Math.abs(Math.cos(z * 6.5 - x * 2.8) * Math.sin(y * 5.4));

  // Carved natural lake basin depression
  const lakeDist = normal.distanceTo(lakeCenterSAP);
  let lakeDepression = 0;
  let lakeBasinFactor = 0;
  if (lakeDist < lakeAngularRadius) {
    lakeBasinFactor = 1.0 - (lakeDist / lakeAngularRadius);
    const lakeFactor = Math.cos((lakeDist / lakeAngularRadius) * (Math.PI / 2));
    lakeDepression = -0.18 * lakeFactor;
  }

  // Road corridor terrain smoothing: prevents sharp mountain facets and spikes from piercing through roads!
  const angle = Math.atan2(z, x);
  const roadLat = -0.22 + Math.sin(angle * 2 + 1.2) * 0.12;
  const roadDist = Math.abs(y - roadLat);
  const roadFactor = Math.max(0, 1.0 - roadDist / 0.18);

  // Suppress sharp ridges inside the lake basin and along the road corridor
  const suppression = Math.max(lakeBasinFactor * 0.95, roadFactor * 0.88);
  const mountain = Math.pow(ridge1 * 0.65 + ridge2 * 0.35, 2.2) * 0.34 * (1.0 - suppression);

  // Valleys and plains
  const v = Math.sin(x * 3.1 - z * 3.8 + 1.0) * Math.cos(y * 2.8 + 0.4);
  const valley = v < -0.25 ? (v + 0.25) * 0.22 : 0;

  const rawHeight = c1 * 0.11 + mountain + valley + lakeDepression;
  return radius + rawHeight * detail;
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
  part.applyMatrix4(transform);
  if (!buckets.has(paint)) buckets.set(paint, []);
  buckets.get(paint).push(part);
}

function addMesh(buckets, geometry, paint) {
  if (!buckets.has(paint)) buckets.set(paint, []);
  const part = geometry.index ? geometry.toNonIndexed() : geometry;
  buckets.get(paint).push(part);
}

function makeBeam(buckets, base, start, end, width, paint = paints.tower) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const length = a.distanceTo(b);
  if (length < 0.001) return;
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
  const part = cylinder.clone();
  const nonIndexed = part.index ? part.toNonIndexed() : part;
  nonIndexed.applyMatrix4(transform);
  if (!buckets.has(paint)) buckets.set(paint, []);
  buckets.get(paint).push(nonIndexed);
}

function direction(index, count, seed) {
  const wrapped = ((index % count) + count) % count;
  const y = 1 - ((wrapped + 0.5) * 2) / count;
  const angle = wrapped * Math.PI * (3 - Math.sqrt(5)) + seed;
  const ring = Math.sqrt(1 - y * y);
  return new THREE.Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring);
}

/**
 * Creates high-detail low-poly terrain.
 * Detail 24 on flagship worlds gives 12,500 crisp facets for rich topography!
 */
function makeTerrain(radius, palette, globe) {
  const detailLevel = radius >= 2.8 ? 24 : radius >= 2.0 ? 18 : radius >= 1.2 ? 12 : 8;
  const baseGeom = new THREE.IcosahedronGeometry(radius, detailLevel);
  const geometry = baseGeom.index ? baseGeom.toNonIndexed() : baseGeom;

  const positions = geometry.getAttribute("position");
  const colors = [];
  const ground = new THREE.Color(palette.ground);
  const rock = new THREE.Color(palette.rock);
  const peak = rock.clone().lerp(new THREE.Color(0xf2efe4), 0.55);
  const lowValley = ground.clone().multiplyScalar(0.72);
  const cliff = rock.clone().multiplyScalar(0.92);
  const beach = new THREE.Color(0xdad1b2);
  const detail = surfaceScale(radius);
  const hWater = radius - 0.015 * detail;

  for (let i = 0; i < positions.count; i++) {
    const normal = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i),
    ).normalize();
    const height = elevation(normal, radius);
    positions.setXYZ(i, normal.x * height, normal.y * height, normal.z * height);
  }
  geometry.computeVertexNormals();

  const normals = geometry.getAttribute("normal");
  for (let i = 0; i < positions.count; i += 3) {
    const vNormal = new THREE.Vector3(
      normals.getX(i),
      normals.getY(i),
      normals.getZ(i),
    );
    const pos = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i),
    );
    const radial = pos.clone().normalize();
    const height = pos.length();
    const slope = vNormal.dot(radial);

    const distToLake = radial.distanceTo(lakeCenterSAP);
    let color;

    if (distToLake < lakeAngularRadius + 0.06 && height < hWater + 0.08 * detail) {
      if (height < hWater) {
        // Deep lakebed silt under water
        color = lowValley;
      } else {
        // Sandy beach right along the natural waterline
        color = beach;
      }
    } else if (slope < 0.7) {
      color = cliff;
    } else if (height > radius + 0.22) {
      color = peak;
    } else if (height < radius - 0.06) {
      color = lowValley;
    } else {
      color = ground;
    }

    for (let j = 0; j < 3; j++) {
      colors.push(color.r, color.g, color.b);
    }
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
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
  outline.scale.setScalar(1.012);
  outline.name = "terrain-outline";
  globe.add(outline);
}

/**
 * Creates a curved, spherical water lake mesh that hugs the planet's spherical curvature.
 * Replaces the flat 2D ellipse with a realistic spherical water basin!
 */
function makeSphericalLake(buckets, center, radius, lakeRadius) {
  const detail = surfaceScale(radius);
  const hWater = radius - 0.015 * detail;

  const east = new THREE.Vector3()
    .crossVectors(Math.abs(center.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up, center)
    .normalize();
  const north = new THREE.Vector3().crossVectors(center, east).normalize();

  const positions = [];
  const indices = [];

  // Center vertex
  const cPt = center.clone().multiplyScalar(hWater);
  positions.push(cPt.x, cPt.y, cPt.z);

  const rings = 6;
  const sectors = 24;

  for (let r = 1; r <= rings; r++) {
    const frac = r / rings;
    for (let s = 0; s < sectors; s++) {
      const angle = (s / sectors) * Math.PI * 2;
      const offset = east
        .clone()
        .multiplyScalar(Math.cos(angle) * lakeRadius * frac)
        .add(north.clone().multiplyScalar(Math.sin(angle) * lakeRadius * frac));
      const pt = center
        .clone()
        .addScaledVector(offset, 1 / radius)
        .normalize()
        .multiplyScalar(hWater);
      positions.push(pt.x, pt.y, pt.z);
    }
  }

  // Triangles connecting center to ring 1
  for (let s = 0; s < sectors; s++) {
    const next = (s + 1) % sectors;
    indices.push(0, 1 + s, 1 + next);
  }

  // Triangles connecting ring r to ring r + 1
  for (let r = 1; r < rings; r++) {
    const rowStart = 1 + (r - 1) * sectors;
    const nextRowStart = 1 + r * sectors;
    for (let s = 0; s < sectors; s++) {
      const next = (s + 1) % sectors;
      const a = rowStart + s;
      const b = rowStart + next;
      const c = nextRowStart + s;
      const d = nextRowStart + next;
      indices.push(a, c, b, b, c, d);
    }
  }

  const lakeGeom = new THREE.BufferGeometry();
  lakeGeom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  lakeGeom.setIndex(indices);
  lakeGeom.computeVertexNormals();
  addMesh(buckets, lakeGeom, paints.water);
}

/**
 * Creates slender, ground-adhering road that follows the terrain with zero clipping.
 * Width is refined to 0.026 * detail, in realistic harmony with village buildings.
 */
function makeRoad(buckets, radius, offset, phase, meridian = false) {
  const detail = surfaceScale(radius);
  const roadPositions = [];
  const roadIndices = [];
  const yellowPositions = [];
  const yellowIndices = [];
  const steps = 240;
  const centerlinePoints = [];
  const roadWidth = (meridian ? 0.024 : 0.026) * detail;

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const latitude = offset + Math.sin(angle * 2 + phase) * 0.12;
    const normal = meridian
      ? new THREE.Vector3(
          Math.cos(phase) * Math.cos(angle),
          Math.sin(angle),
          Math.sin(phase) * Math.cos(angle),
        ).normalize()
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

    centerlinePoints.push({
      normal: normal.clone(),
      tangent: tangent.clone().normalize(),
      across: across.clone(),
      step: i,
    });

    for (const side of [-1, 1]) {
      const edge = normal
        .clone()
        .addScaledVector(across, side * roadWidth)
        .normalize();
      const point = surfacePoint(edge, radius, 0.016 * detail);
      roadPositions.push(point.x, point.y, point.z);
    }

    // Delicate road centerline
    const cWidth = 0.0016 * detail;
    for (const side of [-1, 1]) {
      const edge = normal.clone().addScaledVector(across, side * cWidth).normalize();
      const p = surfacePoint(edge, radius, 0.0185 * detail);
      yellowPositions.push(p.x, p.y, p.z);
    }

    if (i < steps) {
      const j = i * 2;
      roadIndices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
      yellowIndices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }

  const roadGeom = new THREE.BufferGeometry();
  roadGeom.setAttribute("position", new THREE.Float32BufferAttribute(roadPositions, 3));
  roadGeom.setIndex(roadIndices);
  roadGeom.computeVertexNormals();
  addMesh(buckets, roadGeom, paints.road);

  const yellowGeom = new THREE.BufferGeometry();
  yellowGeom.setAttribute("position", new THREE.Float32BufferAttribute(yellowPositions, 3));
  yellowGeom.setIndex(yellowIndices);
  yellowGeom.computeVertexNormals();
  addMesh(buckets, yellowGeom, paints.yellowLine);

  return centerlinePoints;
}

/**
 * Creates zebra pedestrian crosswalk and traffic light signal at an intersection.
 */
function makeZebraCrossing(buckets, center, radius) {
  const { normal, tangent, across } = center;
  const detail = surfaceScale(radius);
  const stripeCount = 5;
  const stripeWidth = 0.006 * detail;
  const stripeLength = 0.02 * detail;
  const totalSpan = 0.048 * detail;

  for (let k = 0; k < stripeCount; k++) {
    const offsetAcross = -totalSpan / 2 + (k + 0.5) * (totalSpan / stripeCount);
    const stripeNormal = normal
      .clone()
      .addScaledVector(across, offsetAcross / radius)
      .normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);
    const base = tangentMatrix(stripeNormal, radius, yaw, 0.02 * detail);
    base.multiply(scaleMatrix(detail));
    fragment(
      buckets,
      box,
      paints.roadStripe,
      base,
      [0, 0, 0],
      [stripeWidth, 0.005, stripeLength],
    );
  }

  const curbNormal = normal
    .clone()
    .addScaledVector(across, (totalSpan / 2 + 0.028 * detail) / radius)
    .normalize();
  const poleYaw = Math.atan2(across.x, across.z);
  const poleBase = tangentMatrix(curbNormal, radius, poleYaw, 0.016 * detail);
  poleBase.multiply(scaleMatrix(detail));

  fragment(buckets, cylinder, paints.ink, poleBase, [0, 0.22, 0], [0.014, 0.44, 0.014]);
  fragment(buckets, box, paints.ink, poleBase, [-0.06, 0.42, 0], [0.14, 0.014, 0.014]);
  fragment(buckets, box, paints.ink, poleBase, [-0.11, 0.38, 0], [0.028, 0.09, 0.028]);
  fragment(buckets, cylinder, paints.roofWarm, poleBase, [-0.11, 0.41, 0.016], [0.009, 0.005, 0.009]);
  fragment(buckets, cylinder, paints.accent, poleBase, [-0.11, 0.38, 0.016], [0.009, 0.005, 0.009]);
  fragment(buckets, cylinder, paints.treeLight, poleBase, [-0.11, 0.35, 0.016], [0.009, 0.005, 0.009]);
}

/**
 * Creates low-poly vehicles (sedan, van, taxi, mini-truck) on road lanes.
 */
function makeVehicle(buckets, center, radius, type, lane = 1) {
  const { normal, tangent, across } = center;
  const detail = surfaceScale(radius);
  const laneOffset = lane * 0.038 * detail;
  const carNormal = normal
    .clone()
    .addScaledVector(across, laneOffset / radius)
    .normalize();
  const forward = lane === 1 ? tangent : tangent.clone().negate();
  const yaw = Math.atan2(forward.x, forward.z);
  const base = tangentMatrix(carNormal, radius, yaw, 0.028 * detail);
  base.multiply(scaleMatrix(detail));

  const carPaints = [
    paints.coral,
    paints.blue,
    paints.roof,
    paints.accent,
    paints.building,
  ];
  const paint = carPaints[type % carPaints.length];

  if (type % 4 === 0) {
    fragment(buckets, box, paint, base, [0, 0.035, 0], [0.082, 0.036, 0.15]);
    fragment(buckets, box, paints.window, base, [0, 0.066, -0.01], [0.072, 0.032, 0.085]);
    for (const x of [-0.044, 0.044]) {
      for (const z of [-0.045, 0.045]) {
        fragment(buckets, cylinder, paints.ink, base, [x, 0.018, z], [0.018, 0.01, 0.018]);
      }
    }
    for (const x of [-0.026, 0.026]) {
      fragment(buckets, box, paints.windowLight, base, [x, 0.036, 0.076], [0.014, 0.01, 0.005]);
      fragment(buckets, box, paints.roofWarm, base, [x, 0.036, -0.076], [0.014, 0.01, 0.005]);
    }
  } else if (type % 4 === 1) {
    fragment(buckets, box, paint, base, [0, 0.04, 0], [0.088, 0.046, 0.18]);
    fragment(buckets, box, paints.building, base, [0, 0.078, 0], [0.084, 0.036, 0.175]);
    fragment(buckets, box, paints.window, base, [0, 0.076, 0.01], [0.087, 0.026, 0.14]);
    for (const x of [-0.046, 0.046]) {
      for (const z of [-0.055, 0.055]) {
        fragment(buckets, cylinder, paints.ink, base, [x, 0.02, z], [0.02, 0.01, 0.02]);
      }
    }
  } else if (type % 4 === 2) {
    fragment(buckets, box, paints.accent, base, [0, 0.035, 0], [0.082, 0.036, 0.15]);
    fragment(buckets, box, paints.window, base, [0, 0.066, -0.01], [0.072, 0.032, 0.085]);
    fragment(buckets, box, paints.building, base, [0, 0.088, -0.01], [0.028, 0.014, 0.022]);
    for (const x of [-0.044, 0.044]) {
      for (const z of [-0.045, 0.045]) {
        fragment(buckets, cylinder, paints.ink, base, [x, 0.018, z], [0.018, 0.01, 0.018]);
      }
    }
  } else {
    fragment(buckets, box, paint, base, [0, 0.045, 0.03], [0.086, 0.05, 0.085]);
    fragment(buckets, box, paints.window, base, [0, 0.075, 0.03], [0.078, 0.03, 0.06]);
    fragment(buckets, box, paints.building, base, [0, 0.058, -0.052], [0.088, 0.072, 0.1]);
    for (const x of [-0.046, 0.046]) {
      for (const z of [-0.065, 0.045]) {
        fragment(buckets, cylinder, paints.ink, base, [x, 0.02, z], [0.02, 0.01, 0.02]);
      }
    }
  }
}

/**
 * Creates low-poly pedestrians with colorful clothes and poses.
 */
function makePedestrian(buckets, normal, radius, random, index) {
  const detail = surfaceScale(radius);
  const yaw = random() * Math.PI * 2;
  const base = tangentMatrix(normal, radius, yaw, 0.018 * detail);
  base.multiply(scaleMatrix(detail));

  const clothPaints = [paints.blue, paints.coral, paints.tree, paints.accent];
  const cloth = clothPaints[index % clothPaints.length];

  fragment(buckets, box, paints.ink, base, [-0.011, 0.032, 0], [0.012, 0.064, 0.012]);
  fragment(buckets, box, paints.ink, base, [0.011, 0.032, 0], [0.012, 0.064, 0.012]);
  fragment(buckets, box, cloth, base, [0, 0.088, 0], [0.034, 0.05, 0.024]);
  fragment(buckets, boulder, paints.warm, base, [0, 0.13, 0], [0.022, 0.024, 0.022]);

  if (index % 3 === 0) {
    fragment(buckets, box, paints.roof, base, [0, 0.09, -0.018], [0.025, 0.032, 0.016]);
  } else if (index % 3 === 1) {
    fragment(buckets, cylinder, paints.roofWarm, base, [0, 0.146, 0], [0.028, 0.01, 0.028]);
  }
}

/**
 * Creates roadside utility poles with transformers, insulators, and clean catenary wires.
 * Wires are strung sequentially pole-to-pole along the road without chaotic clutter!
 */
function makeUtilityPolesAndWires(buckets, radius, polePositions) {
  const detail = surfaceScale(radius);
  const poleAttachmentPoints = [];

  for (let i = 0; i < polePositions.length; i++) {
    const { normal, yaw } = polePositions[i];
    const base = tangentMatrix(normal, radius, yaw, 0.015 * detail);
    base.multiply(scaleMatrix(detail));

    // Wooden / concrete utility pole
    fragment(buckets, cylinder, paints.trunk, base, [0, 0.28, 0], [0.022, 0.56, 0.022]);
    // Horizontal crossarm
    fragment(buckets, box, paints.ink, base, [0, 0.46, 0], [0.18, 0.018, 0.018]);
    // Transformer barrel on select poles
    if (i % 3 === 0) {
      fragment(buckets, cylinder, paints.tower, base, [0.035, 0.36, 0], [0.026, 0.07, 0.026]);
    }
    // Ceramic insulators on crossarm
    for (const x of [-0.07, 0.07]) {
      fragment(buckets, cylinder, paints.building, base, [x, 0.485, 0], [0.012, 0.03, 0.012]);
    }

    // Attachment points at insulators in world coordinates (base already scaled by detail)
    const pLeft = new THREE.Vector3(-0.07, 0.49, 0).applyMatrix4(base);
    const pRight = new THREE.Vector3(0.07, 0.49, 0).applyMatrix4(base);

    poleAttachmentPoints.push({ pLeft, pRight });
  }

  // String two neat parallel power lines strictly between consecutive poles along the roadside!
  for (let i = 0; i < poleAttachmentPoints.length - 1; i++) {
    const p1 = poleAttachmentPoints[i];
    const p2 = poleAttachmentPoints[i + 1];
    const dist = p1.pLeft.distanceTo(p2.pLeft);

    if (dist < 2.0 * detail) {
      makeSaggingWire(buckets, p1.pLeft, p2.pLeft, radius, 0.016 * detail);
      makeSaggingWire(buckets, p1.pRight, p2.pRight, radius, 0.016 * detail);
    }
  }
}

function makeSaggingWire(buckets, ptA, ptB, radius, sagAmount) {
  const segments = 6;
  const wireRadius = 0.0035 * surfaceScale(radius);
  let prevPt = ptA.clone();

  for (let s = 1; s <= segments; s++) {
    const t = s / segments;
    const currPt = new THREE.Vector3().lerpVectors(ptA, ptB, t);
    const sag = Math.sin(t * Math.PI) * sagAmount;
    const centerDir = currPt.clone().normalize();
    currPt.sub(centerDir.multiplyScalar(sag));

    const mid = new THREE.Vector3().addVectors(prevPt, currPt).multiplyScalar(0.5);
    const length = prevPt.distanceTo(currPt);
    const dir = new THREE.Vector3().subVectors(currPt, prevPt).normalize();

    const transform = new THREE.Matrix4()
      .makeTranslation(mid.x, mid.y, mid.z)
      .multiply(
        new THREE.Matrix4().makeRotationFromQuaternion(
          new THREE.Quaternion().setFromUnitVectors(up, dir),
        ),
      )
      .multiply(new THREE.Matrix4().makeScale(wireRadius, length, wireRadius));

    const segGeom = cylinder.clone();
    const nonIndexed = segGeom.index ? segGeom.toNonIndexed() : segGeom;
    nonIndexed.applyMatrix4(transform);
    addMesh(buckets, nonIndexed, paints.ink);

    prevPt = currPt;
  }
}

/**
 * Creates diverse modern architecture across the planet.
 * Includes a sunken stone foundation plinth extending -0.22 below ground
 * to eliminate ANY floating gaps or awkward contact with slopes!
 */
function makeBuilding(buckets, globe, normal, radius, random, index) {
  const detail = surfaceScale(radius);
  const yaw = random() * Math.PI * 2;
  const base = tangentMatrix(normal, radius, yaw, 0.016 * detail);
  const size = radius / 3.4;
  base.multiply(scaleMatrix(size));

  let bodyGeometry;
  let bodyPaint = paints.building;
  let bodyWidth = 0.75 + random() * 0.15;
  let bodyHeight = 0.95 + random() * 0.25;
  let bodyDepth = 0.7 + random() * 0.15;

  if (index === 0) {
    // 1. Landmark Skyscraper / Financial Tower
    bodyWidth = 0.92;
    bodyHeight = 1.55;
    bodyDepth = 0.82;
    bodyPaint = paints.building;
    bodyGeometry = box;
  } else if (index === 1) {
    // 2. Modern Supermarket / Department Store
    bodyWidth = 1.15;
    bodyHeight = 0.62;
    bodyDepth = 0.88;
    bodyPaint = paints.building;
    bodyGeometry = box;
  } else if (index === 2) {
    // 3. Corner Bakery & Convenience Store
    bodyWidth = 0.78;
    bodyHeight = 0.68;
    bodyDepth = 0.72;
    bodyPaint = paints.warm;
    bodyGeometry = box;
  } else if (index === 3) {
    // 4. Civic Fountain Plaza & Pavilion
    bodyWidth = 0.95;
    bodyHeight = 0.28;
    bodyDepth = 0.95;
    bodyPaint = paints.plaza;
    bodyGeometry = octagon;
  } else if (index === 4) {
    // 5. Open-Air Ecological Parking Lot
    bodyWidth = 1.1;
    bodyHeight = 0.16;
    bodyDepth = 0.9;
    bodyPaint = paints.stone;
    bodyGeometry = box;
  } else if (index === 5) {
    // 6. Children's Playground & Carnival
    bodyWidth = 0.96;
    bodyHeight = 0.22;
    bodyDepth = 0.86;
    bodyPaint = paints.treeLight;
    bodyGeometry = box;
  } else if (index === 6) {
    // 7. Drive-In Burger Diner / American Cafe
    bodyWidth = 0.82;
    bodyHeight = 0.62;
    bodyDepth = 0.75;
    bodyPaint = paints.coral;
    bodyGeometry = box;
  } else if (index === 7) {
    // 8. Bookstore & Rooftop Coffee House
    bodyWidth = 0.75;
    bodyHeight = 0.82;
    bodyDepth = 0.72;
    bodyPaint = paints.warm;
    bodyGeometry = box;
  } else if (index === 8) {
    // 9. Modern Geometric Art Museum
    bodyWidth = 0.95;
    bodyHeight = 0.75;
    bodyDepth = 0.82;
    bodyPaint = paints.building;
    bodyGeometry = box;
  } else if (index === 9) {
    // 10. Metro / Light Rail Station Hub
    bodyWidth = 1.18;
    bodyHeight = 0.58;
    bodyDepth = 0.72;
    bodyPaint = paints.blue;
    bodyGeometry = box;
  } else if (index === 10) {
    // 11. Community Health Clinic & Pharmacy
    bodyWidth = 0.85;
    bodyHeight = 0.78;
    bodyDepth = 0.75;
    bodyPaint = paints.building;
    bodyGeometry = box;
  } else if (index === 11) {
    // 12. Fire Station & Training Watchtower
    bodyWidth = 0.88;
    bodyHeight = 0.82;
    bodyDepth = 0.78;
    bodyPaint = paints.coral;
    bodyGeometry = box;
  } else if (index === 12) {
    // 13. Cozy Gabled Family Villa
    bodyWidth = 0.76;
    bodyHeight = 0.72;
    bodyDepth = 0.68;
    bodyPaint = paints.warm;
    bodyGeometry = box;
  } else if (index === 13) {
    // 14. Cascading Green Terrace Eco-Apartments
    bodyWidth = 1.05;
    bodyHeight = 0.95;
    bodyDepth = 0.82;
    bodyPaint = paints.building;
    bodyGeometry = box;
  } else if (index === 14) {
    // 15. Tech Startup Incubator / Co-working Hub
    bodyWidth = 0.88;
    bodyHeight = 0.88;
    bodyDepth = 0.76;
    bodyPaint = paints.blue;
    bodyGeometry = box;
  } else if (index === 15) {
    // 16. Gas & EV Charging Station
    bodyWidth = 1.12;
    bodyHeight = 0.22;
    bodyDepth = 0.82;
    bodyPaint = paints.stone;
    bodyGeometry = box;
  } else if (index === 16) {
    // 17. Japanese Zen Tea House
    bodyWidth = 0.78;
    bodyHeight = 0.65;
    bodyDepth = 0.72;
    bodyPaint = paints.warm;
    bodyGeometry = box;
  } else if (index === 17) {
    // 18. Post Office & Delivery Hub
    bodyWidth = 0.82;
    bodyHeight = 0.72;
    bodyDepth = 0.72;
    bodyPaint = paints.building;
    bodyGeometry = box;
  } else if (index === 18) {
    // 19. Botanical Greenhouse Conservatory
    bodyWidth = 0.88;
    bodyHeight = 0.62;
    bodyDepth = 0.78;
    bodyPaint = paints.blue;
    bodyGeometry = octagon;
  } else {
    // 20. Stargazing Astronomical Observatory
    bodyWidth = 0.85;
    bodyHeight = 0.85;
    bodyDepth = 0.85;
    bodyPaint = paints.building;
    bodyGeometry = cylinder;
  }

  // Anchor Plinth Foundation: Extends downwards deep into terrain to eliminate any floating gap on slopes!
  fragment(
    buckets,
    box,
    paints.stone,
    base,
    [0, -0.15, 0],
    [bodyWidth * 1.12, 0.34, bodyDepth * 1.12],
  );

  const body = new THREE.Mesh(bodyGeometry, bodyPaint);
  body.name = "building-body";
  body.geometry = body.geometry.clone();
  body.geometry.applyMatrix4(
    base
      .clone()
      .multiply(
        new THREE.Matrix4()
          .makeTranslation(0, bodyHeight / 2, 0)
          .multiply(new THREE.Matrix4().makeScale(bodyWidth, bodyHeight, bodyDepth)),
      ),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  globe.add(body);

  if (index === 0) {
    // 1. Skyscraper: Tiers, observation deck, antenna spire
    fragment(buckets, box, paints.windowLight, base, [0, bodyHeight * 0.55, 0], [bodyWidth * 0.82, bodyHeight * 0.5, bodyDepth * 0.82]);
    fragment(buckets, box, paints.building, base, [0, bodyHeight * 0.82, 0], [bodyWidth * 0.65, bodyHeight * 0.32, bodyDepth * 0.65]);
    fragment(buckets, box, paints.windowLight, base, [0, bodyHeight + 0.08, 0], [bodyWidth * 0.68, 0.16, bodyDepth * 0.68]);
    fragment(buckets, cylinder, paints.tower, base, [0, bodyHeight + 0.32, 0], [0.035, 0.42, 0.035]);
    fragment(buckets, cone, paints.accent, base, [0, bodyHeight + 0.56, 0], [0.065, 0.16, 0.065]);
    for (let f = 1; f <= 5; f++) {
      const y = (f * bodyHeight) / 6.5;
      fragment(buckets, box, paints.window, base, [0, y, bodyDepth / 2 + 0.01], [bodyWidth * 0.8, 0.14, 0.02]);
    }
  } else if (index === 1) {
    // 2. Supermarket: Storefront awning, glass entrance, roof HVAC units
    fragment(buckets, box, paints.windowLight, base, [0, bodyHeight * 0.4, bodyDepth / 2 + 0.02], [bodyWidth * 0.78, bodyHeight * 0.5, 0.04]);
    fragment(buckets, box, paints.accent, base, [0, bodyHeight * 0.75, bodyDepth / 2 + 0.08], [bodyWidth * 0.85, 0.1, 0.16]); // yellow awning
    fragment(buckets, box, paints.roof, base, [0, bodyHeight + 0.02, 0], [bodyWidth + 0.06, 0.05, bodyDepth + 0.06]);
    fragment(buckets, cylinder, paints.tower, base, [-0.25, bodyHeight + 0.12, 0.15], [0.12, 0.15, 0.12]); // HVAC 1
    fragment(buckets, box, paints.tower, base, [0.25, bodyHeight + 0.12, -0.15], [0.22, 0.14, 0.22]); // HVAC 2
  } else if (index === 2) {
    // 3. Bakery & Convenience Store: Striped awning, outdoor bench, vending machine
    fragment(buckets, box, paints.roofWarm, base, [0, bodyHeight + 0.03, 0], [bodyWidth + 0.06, 0.06, bodyDepth + 0.06]);
    fragment(buckets, box, paints.coral, base, [0, bodyHeight * 0.65, bodyDepth / 2 + 0.09], [bodyWidth * 0.75, 0.08, 0.18]); // striped canopy
    fragment(buckets, box, paints.windowLight, base, [-0.12, bodyHeight * 0.38, bodyDepth / 2 + 0.01], [0.38, 0.35, 0.02]);
    fragment(buckets, box, paints.blue, base, [bodyWidth / 2 + 0.06, 0.22, 0], [0.12, 0.42, 0.18]); // vending machine
    fragment(buckets, box, paints.trunk, base, [-0.15, 0.08, bodyDepth / 2 + 0.22], [0.28, 0.06, 0.1]); // bench
  } else if (index === 3) {
    // 4. Civic Fountain Plaza: Stepped basin, water pool, jet spouts, flowerbed
    fragment(buckets, octagon, paints.water, base, [0, bodyHeight + 0.02, 0], [bodyWidth * 0.75, 0.04, bodyDepth * 0.75]);
    fragment(buckets, cylinder, paints.stone, base, [0, bodyHeight + 0.12, 0], [0.26, 0.2, 0.26]);
    fragment(buckets, cylinder, paints.water, base, [0, bodyHeight + 0.24, 0], [0.34, 0.04, 0.34]);
    fragment(buckets, cone, paints.water, base, [0, bodyHeight + 0.4, 0], [0.08, 0.28, 0.08]); // water spout
    for (const a of [0, 1.57, 3.14, 4.71]) {
      const fx = Math.cos(a) * bodyWidth * 0.42;
      const fz = Math.sin(a) * bodyDepth * 0.42;
      fragment(buckets, boulder, paints.treeLight, base, [fx, bodyHeight + 0.05, fz], [0.1, 0.08, 0.1]);
    }
  } else if (index === 4) {
    // 5. Ecological Parking Lot: Marked parking bays, parked cars, streetlamp
    fragment(buckets, box, paints.plaza, base, [0, bodyHeight + 0.01, 0], [bodyWidth * 0.94, 0.02, bodyDepth * 0.94]);
    // White parking stall lines
    for (const x of [-0.3, 0, 0.3]) {
      fragment(buckets, box, paints.building, base, [x, bodyHeight + 0.02, 0], [0.02, 0.01, bodyDepth * 0.7]);
    }
    // Parked Car 1 (Coral red sedan)
    fragment(buckets, box, paints.coral, base, [-0.15, bodyHeight + 0.07, 0], [0.18, 0.08, 0.36]);
    fragment(buckets, box, paints.window, base, [-0.15, bodyHeight + 0.14, -0.02], [0.15, 0.06, 0.2]);
    // Parked Car 2 (Blue hatchback)
    fragment(buckets, box, paints.blue, base, [0.15, bodyHeight + 0.07, 0.04], [0.18, 0.09, 0.34]);
    fragment(buckets, box, paints.window, base, [0.15, bodyHeight + 0.14, 0.02], [0.15, 0.06, 0.18]);
    // Parking light post
    fragment(buckets, cylinder, paints.ink, base, [-0.42, bodyHeight + 0.25, -0.35], [0.015, 0.5, 0.015]);
    fragment(buckets, box, paints.accent, base, [-0.42, bodyHeight + 0.5, -0.3], [0.04, 0.03, 0.08]);
  } else if (index === 5) {
    // 6. Children's Playground: Slide, swing set, sandbox with umbrella
    // Sandbox with colorful umbrella
    fragment(buckets, cylinder, paints.plaza, base, [-0.25, bodyHeight + 0.04, -0.18], [0.35, 0.06, 0.35]);
    fragment(buckets, cylinder, paints.ink, base, [-0.25, bodyHeight + 0.25, -0.18], [0.015, 0.45, 0.015]);
    fragment(buckets, cone, paints.coral, base, [-0.25, bodyHeight + 0.46, -0.18], [0.28, 0.12, 0.28]); // umbrella
    // Slide tower
    fragment(buckets, box, paints.warm, base, [0.24, bodyHeight + 0.22, 0.15], [0.16, 0.42, 0.16]);
    fragment(buckets, cone, paints.blue, base, [0.24, bodyHeight + 0.5, 0.15], [0.2, 0.15, 0.2]);
    makeBeam(buckets, base, [0.24, bodyHeight + 0.3, 0.15], [0.24, bodyHeight + 0.05, -0.18], 0.06, paints.coral); // slide chute
    // Swing set
    makeBeam(buckets, base, [-0.15, bodyHeight + 0.02, 0.28], [-0.15, bodyHeight + 0.32, 0.28], 0.025, paints.blue);
    makeBeam(buckets, base, [0.08, bodyHeight + 0.02, 0.28], [0.08, bodyHeight + 0.32, 0.28], 0.025, paints.blue);
    makeBeam(buckets, base, [-0.15, bodyHeight + 0.32, 0.28], [0.08, bodyHeight + 0.32, 0.28], 0.025, paints.blue);
  } else if (index === 6) {
    // 7. Drive-In Burger Diner: Curved roof, illuminated sign, picnic parasol
    fragment(buckets, cylinder, paints.roofWarm, base, [0, bodyHeight + 0.05, 0], [bodyWidth * 0.65, 0.08, bodyDepth * 0.65]);
    fragment(buckets, cylinder, paints.accent, base, [0, bodyHeight + 0.22, 0], [0.22, 0.12, 0.22]); // burger sign
    fragment(buckets, box, paints.coral, base, [0, bodyHeight + 0.22, 0], [0.24, 0.04, 0.24]); // burger patty
    fragment(buckets, box, paints.windowLight, base, [0, bodyHeight * 0.45, bodyDepth / 2 + 0.01], [bodyWidth * 0.75, 0.25, 0.02]);
    // Outdoor picnic table & parasol
    fragment(buckets, cylinder, paints.trunk, base, [bodyWidth / 2 + 0.18, 0.12, 0], [0.18, 0.04, 0.18]);
    fragment(buckets, cylinder, paints.ink, base, [bodyWidth / 2 + 0.18, 0.24, 0], [0.015, 0.24, 0.015]);
    fragment(buckets, cone, paints.coral, base, [bodyWidth / 2 + 0.18, 0.4, 0], [0.22, 0.1, 0.22]);
  } else if (index === 7) {
    // 8. Bookstore & Cafe: Dark green awning, rooftop patio, display window
    fragment(buckets, box, paints.tree, base, [0, bodyHeight * 0.62, bodyDepth / 2 + 0.09], [bodyWidth * 0.8, 0.08, 0.16]); // green canopy
    fragment(buckets, box, paints.windowLight, base, [0, bodyHeight * 0.32, bodyDepth / 2 + 0.01], [bodyWidth * 0.7, 0.32, 0.02]);
    fragment(buckets, box, paints.roof, base, [0, bodyHeight + 0.02, 0], [bodyWidth + 0.06, 0.04, bodyDepth + 0.06]);
    // Rooftop patio with coffee tables
    fragment(buckets, cylinder, paints.trunk, base, [-0.15, bodyHeight + 0.1, 0], [0.14, 0.03, 0.14]);
    fragment(buckets, cylinder, paints.trunk, base, [0.15, bodyHeight + 0.1, 0.1], [0.14, 0.03, 0.14]);
    fragment(buckets, box, paints.treeLight, base, [0.22, bodyHeight + 0.1, -0.2], [0.12, 0.14, 0.12]); // planter
  } else if (index === 8) {
    // 9. Modern Geometric Art Museum: Cantilevered offset cubic volumes & skylights
    fragment(buckets, box, paints.warm, base, [0.12, bodyHeight * 0.85, 0.1], [bodyWidth * 0.75, bodyHeight * 0.48, bodyDepth * 0.75]);
    fragment(buckets, box, paints.window, base, [0.12, bodyHeight * 1.1, 0.1], [0.35, 0.03, 0.35]); // skylight
    fragment(buckets, box, paints.windowLight, base, [-0.15, bodyHeight * 0.45, bodyDepth / 2 + 0.01], [0.42, 0.3, 0.02]);
    // Abstract modern sculpture on lawn
    fragment(buckets, cylinder, paints.tower, base, [-bodyWidth / 2 - 0.12, 0.14, 0], [0.08, 0.28, 0.08]);
    fragment(buckets, octagon, paints.coral, base, [-bodyWidth / 2 - 0.12, 0.32, 0], [0.14, 0.14, 0.14]);
  } else if (index === 9) {
    // 10. Metro Station Hub: Arched glass canopy, clock tower, tracks
    fragment(buckets, cylinder, paints.windowLight, base, [0, bodyHeight + 0.06, 0], [bodyWidth * 0.52, 0.12, bodyDepth * 0.95]);
    fragment(buckets, box, paints.roof, base, [0, bodyHeight + 0.02, 0], [bodyWidth + 0.06, 0.04, bodyDepth + 0.06]);
    // Clock tower
    fragment(buckets, box, paints.stone, base, [bodyWidth * 0.38, bodyHeight + 0.32, 0], [0.2, 0.65, 0.2]);
    fragment(buckets, cone, paints.roofWarm, base, [bodyWidth * 0.38, bodyHeight + 0.72, 0], [0.24, 0.18, 0.24]);
    fragment(buckets, cylinder, paints.windowLight, base, [bodyWidth * 0.38, bodyHeight + 0.52, 0.1], [0.06, 0.02, 0.06]); // clock face
  } else if (index === 10) {
    // 11. Health Clinic & Pharmacy: White facade with red cross emblem
    fragment(buckets, box, paints.roof, base, [0, bodyHeight + 0.03, 0], [bodyWidth + 0.06, 0.06, bodyDepth + 0.06]);
    // Red Cross emblem on facade
    fragment(buckets, box, paints.coral, base, [0, bodyHeight * 0.65, bodyDepth / 2 + 0.02], [0.06, 0.18, 0.02]);
    fragment(buckets, box, paints.coral, base, [0, bodyHeight * 0.65, bodyDepth / 2 + 0.02], [0.18, 0.06, 0.02]);
    fragment(buckets, box, paints.windowLight, base, [0, bodyHeight * 0.32, bodyDepth / 2 + 0.01], [bodyWidth * 0.65, 0.28, 0.02]);
    fragment(buckets, box, paints.accent, base, [bodyWidth * 0.38, 0.25, 0], [0.04, 0.5, 0.04]); // pharmacy beacon
  } else if (index === 11) {
    // 12. Fire Station: Dual red bay garage doors and brick training watchtower
    fragment(buckets, box, paints.roof, base, [0, bodyHeight + 0.03, 0], [bodyWidth + 0.06, 0.06, bodyDepth + 0.06]);
    // Dual garage doors
    fragment(buckets, box, paints.ink, base, [-0.18, bodyHeight * 0.32, bodyDepth / 2 + 0.01], [0.28, 0.38, 0.02]);
    fragment(buckets, box, paints.ink, base, [0.18, bodyHeight * 0.32, bodyDepth / 2 + 0.01], [0.28, 0.38, 0.02]);
    // Training watchtower
    fragment(buckets, box, paints.warm, base, [bodyWidth * 0.36, bodyHeight + 0.35, -bodyDepth * 0.25], [0.24, 0.7, 0.24]);
    fragment(buckets, box, paints.roofWarm, base, [bodyWidth * 0.36, bodyHeight + 0.72, -bodyDepth * 0.25], [0.28, 0.06, 0.28]);
    fragment(buckets, cylinder, paints.coral, base, [bodyWidth * 0.36, bodyHeight + 0.8, -bodyDepth * 0.25], [0.04, 0.08, 0.04]); // alarm siren
  } else if (index === 12) {
    // 13. Cozy Gabled Family Villa: Sloped terracotta roof, chimney with smoke puff
    fragment(buckets, cone, paints.roofWarm, base, [0, bodyHeight + 0.24, 0], [bodyWidth * 0.82, 0.48, bodyDepth * 0.82]);
    fragment(buckets, box, paints.stone, base, [bodyWidth * 0.28, bodyHeight + 0.38, -bodyDepth * 0.2], [0.09, 0.36, 0.09]); // chimney
    fragment(buckets, boulder, paints.cloud, base, [bodyWidth * 0.28, bodyHeight + 0.62, -bodyDepth * 0.2], [0.08, 0.06, 0.08]); // smoke puff
    fragment(buckets, box, paints.windowLight, base, [0, bodyHeight * 0.45, bodyDepth / 2 + 0.01], [bodyWidth * 0.5, 0.22, 0.02]);
  } else if (index === 13) {
    // 14. Cascading Green Terrace Eco-Apartments: Balcony planters and solar panels
    fragment(buckets, box, paints.roof, base, [0, bodyHeight + 0.03, 0], [bodyWidth + 0.08, 0.06, bodyDepth + 0.08]);
    fragment(buckets, box, paints.warm, base, [0.15, bodyHeight * 0.75, 0], [bodyWidth * 0.7, bodyHeight * 0.5, bodyDepth * 0.85]);
    for (let floor = 0; floor < 3; floor++) {
      const y = (floor + 1) * 0.24;
      fragment(buckets, box, paints.roof, base, [-0.15, y, bodyDepth / 2 + 0.09], [bodyWidth * 0.58, 0.03, 0.16]);
      fragment(buckets, box, paints.treeLight, base, [-0.15, y + 0.03, bodyDepth / 2 + 0.11], [bodyWidth * 0.52, 0.04, 0.08]); // flower box
    }
    fragment(buckets, box, paints.blue, base, [0.15, bodyHeight + 0.08, 0], [0.32, 0.02, 0.42]); // solar panel
  } else if (index === 14) {
    // 15. Tech Startup Incubator: Steel beams, full glass curtain, rooftop lounge
    for (const y of [bodyHeight * 0.32, bodyHeight * 0.68]) {
      fragment(buckets, box, paints.windowLight, base, [0, y, bodyDepth / 2 + 0.01], [bodyWidth * 0.85, 0.24, 0.02]);
    }
    fragment(buckets, box, paints.roof, base, [0, bodyHeight + 0.03, 0], [bodyWidth + 0.06, 0.06, bodyDepth + 0.06]);
    // Rooftop pergola lounge
    for (const x of [-0.2, 0.2]) {
      makeBeam(buckets, base, [x, bodyHeight + 0.06, -0.2], [x, bodyHeight + 0.25, -0.2], 0.02, paints.industrialOrange);
      makeBeam(buckets, base, [x, bodyHeight + 0.06, 0.2], [x, bodyHeight + 0.25, 0.2], 0.02, paints.industrialOrange);
    }
    fragment(buckets, box, paints.industrialOrange, base, [0, bodyHeight + 0.26, 0], [0.46, 0.02, 0.46]);
  } else if (index === 15) {
    // 16. Gas & EV Charging Station: Canopy, fuel pump island, charging pillars
    fragment(buckets, box, paints.building, base, [0, 0.45, 0], [bodyWidth * 0.4, 0.45, bodyDepth * 0.45]); // station mart
    // Wide illuminated service canopy
    fragment(buckets, box, paints.blue, base, [0, 0.72, 0.1], [bodyWidth * 0.95, 0.06, bodyDepth * 0.7]);
    for (const x of [-0.35, 0.35]) {
      makeBeam(buckets, base, [x, 0, 0.1], [x, 0.7, 0.1], 0.035, paints.stone);
    }
    // Fuel pumps / EV chargers
    fragment(buckets, box, paints.coral, base, [-0.18, 0.16, 0.1], [0.1, 0.24, 0.14]);
    fragment(buckets, box, paints.accent, base, [0.18, 0.16, 0.1], [0.1, 0.24, 0.14]);
  } else if (index === 16) {
    // 17. Japanese Zen Tea House: Flared hip roof, timber post-and-beam, stone lantern
    fragment(buckets, cone, paints.roof, base, [0, bodyHeight + 0.18, 0], [bodyWidth * 0.92, 0.32, bodyDepth * 0.92]);
    fragment(buckets, box, paints.windowLight, base, [0, bodyHeight * 0.45, bodyDepth / 2 + 0.01], [bodyWidth * 0.68, 0.28, 0.02]); // shoji screen
    // Stone lantern (toro)
    fragment(buckets, cylinder, paints.stone, base, [bodyWidth * 0.48, 0.1, 0.15], [0.08, 0.2, 0.08]);
    fragment(buckets, cone, paints.stone, base, [bodyWidth * 0.48, 0.24, 0.15], [0.14, 0.08, 0.14]);
  } else if (index === 17) {
    // 18. Post Office: Yellow postal emblem, parcel locker, flagpole
    fragment(buckets, box, paints.roofWarm, base, [0, bodyHeight + 0.03, 0], [bodyWidth + 0.06, 0.06, bodyDepth + 0.06]);
    fragment(buckets, box, paints.accent, base, [0, bodyHeight * 0.7, bodyDepth / 2 + 0.02], [0.32, 0.1, 0.04]); // yellow postal sign
    fragment(buckets, box, paints.windowLight, base, [-0.15, bodyHeight * 0.36, bodyDepth / 2 + 0.01], [0.35, 0.28, 0.02]);
    fragment(buckets, box, paints.tree, base, [bodyWidth * 0.35, 0.18, 0], [0.14, 0.34, 0.22]); // parcel lockers
    fragment(buckets, cylinder, paints.ink, base, [-bodyWidth * 0.4, 0.4, 0.25], [0.012, 0.8, 0.012]); // flagpole
    fragment(buckets, box, paints.coral, base, [-bodyWidth * 0.35, 0.74, 0.25], [0.12, 0.08, 0.02]); // flag
  } else if (index === 18) {
    // 19. Botanical Greenhouse Conservatory: Arched glass dome and interior plants
    fragment(buckets, cylinder, paints.windowLight, base, [0, bodyHeight + 0.18, 0], [bodyWidth * 0.78, 0.32, bodyDepth * 0.78]);
    fragment(buckets, cone, paints.windowLight, base, [0, bodyHeight + 0.42, 0], [bodyWidth * 0.65, 0.22, bodyDepth * 0.65]);
    fragment(buckets, boulder, paints.treeLight, base, [0, bodyHeight + 0.12, 0], [0.28, 0.2, 0.28]); // lush interior flora
    for (const a of [0, 1.57, 3.14, 4.71]) {
      const fx = Math.cos(a) * bodyWidth * 0.42;
      const fz = Math.sin(a) * bodyDepth * 0.42;
      fragment(buckets, box, paints.tree, base, [fx, 0.06, fz], [0.14, 0.1, 0.14]); // flowerbed
    }
  } else {
    // 20. Stargazing Astronomical Observatory: Cylindrical base with dome & telescope
    fragment(buckets, cylinder, paints.roof, base, [0, bodyHeight + 0.02, 0], [bodyWidth * 0.52, 0.04, bodyDepth * 0.52]);
    fragment(buckets, boulder, paints.building, base, [0, bodyHeight + 0.22, 0], [bodyWidth * 0.45, 0.38, bodyDepth * 0.45]); // white dome
    fragment(buckets, cylinder, paints.ink, base, [0.08, bodyHeight + 0.32, 0.08], [0.045, 0.32, 0.045]); // telescope tube
    fragment(buckets, cylinder, paints.accent, base, [0.12, bodyHeight + 0.45, 0.12], [0.05, 0.06, 0.05]); // telescope lens
  }
}

/**
 * Creates low-poly trees (pine and broadleaf).
 */
function makeTree(buckets, normal, radius, random) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(normal, radius, random() * 6.28, 0.015 * detail);
  base.multiply(scaleMatrix(detail));
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

function makeForest(buckets, normal, radius, random, count, occupiedNormals) {
  const detail = surfaceScale(radius);
  const east = new THREE.Vector3()
    .crossVectors(Math.abs(normal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up, normal)
    .normalize();
  const north = new THREE.Vector3().crossVectors(normal, east).normalize();

  for (let i = 0; i < count; i++) {
    const angle = i * 2.4 + random() * 0.3;
    const spread = i === 0 ? 0 : (0.28 + random() * 0.12) * detail;
    const treeNormal = normal
      .clone()
      .addScaledVector(east, (Math.cos(angle) * spread) / radius)
      .addScaledVector(north, (Math.sin(angle) * spread) / radius)
      .normalize();

    // Check collision against occupied features (buildings, roads, lake, ferris wheel)
    let collides = false;
    if (occupiedNormals) {
      for (const occ of occupiedNormals) {
        if (treeNormal.distanceTo(occ.normal) < occ.radius) {
          collides = true;
          break;
        }
      }
    }

    if (!collides) {
      makeTree(buckets, treeNormal, radius, random);
    }
  }
}

function makeTower(buckets, normal, radius, index) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(normal, radius, index * 1.7, 0.025 * detail);
  base.multiply(scaleMatrix(detail));
  fragment(buckets, octagon, paints.plaza, base, [0, 0.055, 0], [0.42, 0.11, 0.42]);
  fragment(buckets, octagon, paints.tower, base, [0, 0.6, 0], [0.21, 1.15, 0.21]);
  fragment(buckets, octagon, paints.roofWarm, base, [0, 1.21, 0], [0.29, 0.1, 0.29]);
  fragment(buckets, cylinder, paints.ink, base, [0, 1.51, 0], [0.025, 0.52, 0.025]);
  fragment(buckets, cone, paints.accent, base, [0, 1.84, 0], [0.13, 0.24, 0.13]);
}

function makeTransmissionTower(buckets, normal, radius, yaw) {
  const detail = surfaceScale(radius);
  const base = tangentMatrix(normal, radius, yaw, 0.02 * detail);
  base.multiply(scaleMatrix(detail));
  for (const x of [-1, 1]) {
    for (const z of [-1, 1]) {
      makeBeam(buckets, base, [x * 0.22, 0, z * 0.22], [x * 0.07, 1.35, z * 0.07], 0.035, paints.tower);
    }
    makeBeam(buckets, base, [x * 0.18, 0.28, 0], [-x * 0.13, 0.72, 0], 0.022, paints.tower);
    makeBeam(buckets, base, [x * 0.13, 0.72, 0], [-x * 0.09, 1.12, 0], 0.022, paints.tower);
  }
  for (const y of [0.52, 0.95, 1.3]) {
    fragment(buckets, box, paints.tower, base, [0, y, 0], [0.6 - y * 0.18, 0.038, 0.04]);
  }
  fragment(buckets, cylinder, paints.accent, base, [0, 1.5, 0], [0.04, 0.28, 0.04]);
}

/**
 * Creates rich clouds (billowing cumulus, wispy cirrus, pillowy altocumulus).
 * Pure white stylized low-poly clouds without any floating stone debris!
 */
function makeAtmosphereClouds(buckets, radius, seed, random, count) {
  const detail = surfaceScale(radius);

  for (let i = 0; i < count; i++) {
    const normal = direction(i, count, seed + 0.6);
    // Cloud altitude elevated safely above building rooftops!
    const altitude = (0.78 + (i % 3) * 0.24 + random() * 0.12) * detail;
    const base = tangentMatrix(normal, radius, random() * 6.28, altitude);
    base.multiply(scaleMatrix(detail));
    const cloudScale = 0.75 + random() * 0.55;

    if (i % 3 === 0) {
      // Billowing layered cumulus cloud (flat base, multi-puff dome)
      const puffs = [
        [-0.32, 0, 0, 0.28],
        [0, 0.04, 0, 0.38],
        [0.32, 0, 0, 0.26],
        [-0.12, 0.16, 0.05, 0.32],
        [0.14, 0.15, -0.05, 0.3],
      ];
      for (const [x, y, z, r] of puffs) {
        fragment(
          buckets,
          boulder,
          paints.cloud,
          base,
          [x * cloudScale, y * cloudScale, z * cloudScale],
          [r * cloudScale, r * cloudScale * 0.85, r * cloudScale],
        );
      }
    } else if (i % 3 === 1) {
      // Sweeping wispy cirrus streamer
      for (let s = -2; s <= 2; s++) {
        const x = s * 0.22 * cloudScale;
        const y = Math.sin(s * 0.7) * 0.06 * cloudScale;
        const width = (0.24 - Math.abs(s) * 0.04) * cloudScale;
        fragment(
          buckets,
          boulder,
          paints.cloud,
          base,
          [x, y, 0],
          [width * 1.3, width * 0.6, width * 0.9],
        );
      }
    } else {
      // Pillowy altocumulus cloud puffs
      const puffs = [
        [-0.2, 0, 0, 0.24],
        [0.2, 0, 0, 0.22],
        [0, 0.1, 0, 0.3],
        [0, -0.04, 0.08, 0.2],
      ];
      for (const [x, y, z, r] of puffs) {
        fragment(
          buckets,
          boulder,
          paints.cloud,
          base,
          [x * cloudScale, y * cloudScale, z * cloudScale],
          [r * cloudScale, r * cloudScale * 0.8, r * cloudScale],
        );
      }
    }
  }
}

/**
 * Creates animated Ferris Wheel on main flagship planet.
 */
function makeFerrisWheel(buckets, globe, normal, radius) {
  const detail = surfaceScale(radius);
  const yaw = 0.45;
  const baseMat = tangentMatrix(normal, radius, yaw, 0.02 * detail);
  baseMat.multiply(scaleMatrix(detail));

  const towerHeight = 1.1;
  const wheelRadius = 0.75;

  // Base deck
  fragment(buckets, box, paints.plaza, baseMat, [0, 0.04, 0], [1.1, 0.08, 0.9]);
  fragment(buckets, box, paints.warm, baseMat, [0, 0.1, 0.35], [0.7, 0.08, 0.25]);

  // A-Frame support legs
  for (const z of [-0.18, 0.18]) {
    makeBeam(buckets, baseMat, [-0.35, 0.06, z], [0, towerHeight, z], 0.038, paints.tower);
    makeBeam(buckets, baseMat, [0.35, 0.06, z], [0, towerHeight, z], 0.038, paints.tower);
    makeBeam(buckets, baseMat, [-0.18, 0.5, z], [0.18, 0.5, z], 0.024, paints.tower);
  }
  makeBeam(buckets, baseMat, [0, towerHeight, -0.2], [0, towerHeight, 0.2], 0.045, paints.tower);

  // Rotating Wheel: Structurally and geometrically attached to the A-frame hub!
  const wheelRoot = new THREE.Group();
  wheelRoot.matrixAutoUpdate = false;
  wheelRoot.matrix.copy(baseMat);

  const wheelRotor = new THREE.Group();
  wheelRotor.position.set(0, towerHeight, 0);
  wheelRoot.add(wheelRotor);

  const spokeCount = 8;
  const rimSteps = 16;
  const wheelParts = [];

  for (const z of [-0.08, 0.08]) {
    for (let i = 0; i < rimSteps; i++) {
      const a1 = (i / rimSteps) * Math.PI * 2;
      const a2 = ((i + 1) / rimSteps) * Math.PI * 2;
      const p1 = new THREE.Vector3(Math.cos(a1) * wheelRadius, Math.sin(a1) * wheelRadius, z);
      const p2 = new THREE.Vector3(Math.cos(a2) * wheelRadius, Math.sin(a2) * wheelRadius, z);
      const length = p1.distanceTo(p2);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      const dir = p2.clone().sub(p1).normalize();
      const geom = cylinder.clone();
      const nonIdx = geom.index ? geom.toNonIndexed() : geom;
      nonIdx.applyMatrix4(
        new THREE.Matrix4()
          .makeTranslation(mid.x, mid.y, mid.z)
          .multiply(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir)))
          .multiply(new THREE.Matrix4().makeScale(0.016, length, 0.016)),
      );
      wheelParts.push(nonIdx);
    }
    for (let k = 0; k < spokeCount; k++) {
      const a = (k / spokeCount) * Math.PI * 2;
      const rimPt = new THREE.Vector3(Math.cos(a) * wheelRadius, Math.sin(a) * wheelRadius, z);
      const geom = cylinder.clone();
      const nonIdx = geom.index ? geom.toNonIndexed() : geom;
      nonIdx.applyMatrix4(
        new THREE.Matrix4()
          .makeTranslation(rimPt.x * 0.5, rimPt.y * 0.5, z)
          .multiply(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(up, rimPt.clone().normalize())))
          .multiply(new THREE.Matrix4().makeScale(0.014, rimPt.length(), 0.014)),
      );
      wheelParts.push(nonIdx);
    }
  }

  const mergedWheel = mergeGeometries(wheelParts, false);
  if (mergedWheel) {
    const wheelMesh = new THREE.Mesh(mergedWheel, paints.tower);
    wheelMesh.castShadow = true;
    wheelRotor.add(wheelMesh);
  }

  // 8 Cabins attached to wheel
  const cabins = [];
  const cabinPaints = [paints.coral, paints.blue, paints.accent, paints.warm];

  for (let k = 0; k < spokeCount; k++) {
    const a = (k / spokeCount) * Math.PI * 2;
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(Math.cos(a) * wheelRadius, Math.sin(a) * wheelRadius, 0);

    const cParts = [];
    const b1 = box.clone();
    const nb1 = b1.index ? b1.toNonIndexed() : b1;
    nb1.applyMatrix4(
      new THREE.Matrix4()
        .makeTranslation(0, -0.065, 0)
        .multiply(new THREE.Matrix4().makeScale(0.1, 0.08, 0.08)),
    );
    cParts.push(nb1);

    const mergedCabin = mergeGeometries(cParts, false);
    if (mergedCabin) {
      const cabinMesh = new THREE.Mesh(mergedCabin, cabinPaints[k % cabinPaints.length]);
      cabinGroup.add(cabinMesh);
    }
    wheelRotor.add(cabinGroup);
    cabins.push(cabinGroup);
  }

  globe.add(wheelRoot);

  return {
    update(delta) {
      wheelRotor.rotation.z += delta * 0.22;
      for (const cabin of cabins) {
        cabin.rotation.z = -wheelRotor.rotation.z;
      }
    },
  };
}

/**
 * Creates Hot Air Balloon hovering peacefully in the open sky over the lake.
 * Strictly perpendicular to the planet surface, gently bobbing along the surface normal!
 */
function makeHotAirBalloon(globe, radius, seed) {
  const detail = surfaceScale(radius);

  // Dedicated anchor group oriented strictly perpendicular to the planet surface!
  const anchorNormal = lakeCenterSAP.clone().add(new THREE.Vector3(0.08, 0.42, 0.05)).normalize();
  const baseAltitude = radius + 1.25 * detail;

  const balloonAnchor = new THREE.Group();
  balloonAnchor.name = "hot-air-balloon-anchor";
  balloonAnchor.position.copy(anchorNormal).multiplyScalar(baseAltitude);
  balloonAnchor.quaternion.setFromUnitVectors(up, anchorNormal);
  globe.add(balloonAnchor);

  // Balloon model sits inside anchor, pointing strictly vertically away from the planet!
  const balloon = new THREE.Group();
  balloon.name = "hot-air-balloon";
  balloonAnchor.add(balloon);

  // 1. Teardrop striped balloon envelope
  const sphere = new THREE.SphereGeometry(0.36 * detail, 14, 10);
  const nonIdx = sphere.index ? sphere.toNonIndexed() : sphere;
  const pos = nonIdx.getAttribute("position");
  const colors = [];
  const color1 = new THREE.Color(0xd9755b); // coral red
  const color2 = new THREE.Color(0xf4f1e4); // cream white
  const color3 = new THREE.Color(0x48a19d); // turquoise teal

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (y < 0) {
      const taper = (y + 0.36 * detail) / (0.36 * detail);
      pos.setX(i, x * (0.35 + 0.65 * taper));
      pos.setZ(i, z * (0.35 + 0.65 * taper));
    }
  }
  nonIdx.computeVertexNormals();

  for (let i = 0; i < pos.count; i += 3) {
    const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const angle = Math.atan2(z, x) + Math.PI;
    const stripe = Math.floor((angle / (Math.PI * 2)) * 12);
    const c = stripe % 3 === 0 ? color1 : stripe % 3 === 1 ? color2 : color3;
    for (let j = 0; j < 3; j++) {
      colors.push(c.r, c.g, c.b);
    }
  }
  nonIdx.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const envelopeMesh = new THREE.Mesh(
    nonIdx,
    material("balloon-envelope", 0xffffff, { vertexColors: true }),
  );
  envelopeMesh.castShadow = true;
  balloon.add(envelopeMesh);

  // 2. Wicker basket
  const bGeom = box.clone();
  const nbGeom = bGeom.index ? bGeom.toNonIndexed() : bGeom;
  nbGeom.applyMatrix4(
    new THREE.Matrix4()
      .makeTranslation(0, -0.42 * detail, 0)
      .multiply(new THREE.Matrix4().makeScale(0.16 * detail, 0.12 * detail, 0.16 * detail)),
  );
  const basketMesh = new THREE.Mesh(nbGeom, paints.trunk);
  balloon.add(basketMesh);

  // 3. Cables connecting envelope to basket
  const cableGeom = new THREE.BufferGeometry();
  const cablePos = [];
  for (const [x, z] of [[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]]) {
    cablePos.push(x * 1.3 * detail, -0.2 * detail, z * 1.3 * detail);
    cablePos.push(x * detail, -0.37 * detail, z * detail);
  }
  cableGeom.setAttribute("position", new THREE.Float32BufferAttribute(cablePos, 3));
  const cableMesh = new THREE.LineSegments(
    cableGeom,
    new THREE.LineBasicMaterial({ color: ink }),
  );
  balloon.add(cableMesh);

  let time = seed * 1.5;
  return {
    update(delta) {
      time += delta;
      // Strictly vertical floating bob along the surface normal (strictly perpendicular to planet)
      balloon.position.y = Math.sin(time * 0.9) * 0.08 * detail;
      balloon.rotation.y += delta * 0.05;
      balloon.rotation.z = 0;
      balloon.rotation.x = 0;
    },
  };
}

function flush(buckets, globe) {
  for (const [paint, parts] of buckets) {
    for (const part of parts) {
      if (part.getAttribute("uv")) part.deleteAttribute("uv");
      if (!part.getAttribute("normal")) part.computeVertexNormals();
    }
    const geometry = mergeGeometries(parts, false);
    for (const part of parts) part.dispose();
    if (!geometry) throw new Error(`Could not merge ${paint.name} geometry`);
    const mesh = new THREE.Mesh(geometry, paint);
    mesh.castShadow = paint !== paints.road && paint !== paints.water && paint !== paints.yellowLine && paint !== paints.roadStripe;
    mesh.receiveShadow = true;
    globe.add(mesh);
  }
}

/**
 * Main entry point for generating a planet world.
 * Scales detail according to planet radius (large planets rich, small satellites sparse).
 * Implements strict spatial zoning so buildings, trees, roads, and landmarks NEVER clip!
 */
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
  const animators = [];

  // Occupied zones to prevent ANY inter-object clipping
  const occupiedZones = [];

  if (main) {
    // 1. Natural Curved Spherical Lake Basin
    const lakeRadiusWorld = radius * 0.38;
    makeSphericalLake(buckets, lakeCenterSAP, radius, lakeRadiusWorld);
    occupiedZones.push({ normal: lakeCenterSAP, radius: lakeAngularRadius + 0.1 });

    // 2. Slender Road System: Main lakeside village road
    // Road follows the gentle plains by the lake where all houses reside
    const villageRoad = makeRoad(buckets, radius, -0.22, 1.2);

    // Dense road clearance zones to ensure ZERO trees or poles clip into the road
    for (let s = 0; s < villageRoad.length; s += 2) {
      occupiedZones.push({ normal: villageRoad[s].normal, radius: 0.048 * detail });
    }

    // Pedestrian crosswalk with traffic light at main town center
    makeZebraCrossing(buckets, villageRoad[Math.floor(villageRoad.length * 0.28)], radius);

    // 3. Plazas with stone foundations in open terrain
    for (let i = 0; i < 2; i++) {
      const normal = direction(i * 11 + 5, 24, seed + 0.4);
      const base = tangentMatrix(normal, radius, i, 0.027 * detail);
      base.multiply(scaleMatrix(detail));
      fragment(buckets, cylinder, paints.stone, base, [0, -0.06, 0], [0.68 + i * 0.15, 0.16, 0.58]);
      fragment(buckets, disk, paints.plaza, base, [0, 0.02, 0], [0.65 + i * 0.15, 1, 0.55]);
      makeTower(buckets, normal, radius, i);
      occupiedZones.push({ normal, radius: 0.28 * detail });
    }

    // 4. Interactive Landmark: Ferris Wheel on open scenic plateau
    if (radius >= 2.8) {
      const ferrisNormal = new THREE.Vector3(0.55, 0.42, 0.7).normalize();
      const ferris = makeFerrisWheel(buckets, globe, ferrisNormal, radius);
      if (ferris) animators.push(ferris);
      occupiedZones.push({ normal: ferrisNormal, radius: 0.42 * detail });
    }

    // 5. Buildings: 20 buildings along the slender road by the plains and lake
    // Connected by the road, with zero clipping and deep stone plinths
    const buildingCount = 20;
    const placedBuildings = [];

    for (let i = 0; i < buildingCount; i++) {
      let bNormal = null;

      if (i === 0) {
        // Grand Landmark Skyscraper at open plateau overlooking village entrance
        bNormal = new THREE.Vector3(-0.28, 0.22, 0.92).normalize();
      } else {
        // Buildings 1..19 built neatly along the village road
        // Evenly distributed along the length of villageRoad
        const road = villageRoad;
        const targetStep = Math.floor((((i - 1) * (road.length / 19)) + 8) % road.length);
        const roadNode = road[targetStep];
        const sideSign = i % 2 === 0 ? 1 : -1;
        // Offset from road centerline (safely outside 0.026 road width)
        const offset = sideSign * (0.048 + (i % 3) * 0.008) * detail;
        let candidate = roadNode.normal
          .clone()
          .addScaledVector(roadNode.across, offset)
          .normalize();

        // If too close to lake, flip to other side of the road
        if (candidate.distanceTo(lakeCenterSAP) < lakeAngularRadius + 0.08) {
          candidate = roadNode.normal
            .clone()
            .addScaledVector(roadNode.across, -offset * 1.2)
            .normalize();
        }

        // Check if candidate clashes with lake or other buildings
        if (candidate.distanceTo(lakeCenterSAP) >= lakeAngularRadius + 0.08) {
          let collides = false;
          for (const prev of placedBuildings) {
            if (candidate.distanceTo(prev) < 0.17 * detail) {
              collides = true;
              break;
            }
          }
          if (!collides) {
            bNormal = candidate;
          }
        }

        // Fallback: search adjacent road steps
        if (!bNormal) {
          for (let stepOffset = -5; stepOffset <= 5; stepOffset++) {
            const step = (targetStep + stepOffset * 3 + road.length) % road.length;
            const node = road[step];
            for (const s of [1, -1]) {
              const test = node.normal
                .clone()
                .addScaledVector(node.across, s * 0.052 * detail)
                .normalize();
              if (test.distanceTo(lakeCenterSAP) < lakeAngularRadius + 0.08) continue;
              let ok = true;
              for (const prev of placedBuildings) {
                if (test.distanceTo(prev) < 0.17 * detail) { ok = false; break; }
              }
              if (ok) {
                bNormal = test;
                break;
              }
            }
            if (bNormal) break;
          }
        }
      }

      if (!bNormal) bNormal = direction(i * 13 + 7, buildingCount * 2, seed + 1.8);

      makeBuilding(buckets, globe, bNormal, radius, random, i);
      placedBuildings.push(bNormal);
      occupiedZones.push({ normal: bNormal, radius: 0.18 * detail });
    }

    // 6. Pedestrians strolling on village sidewalks, plazas, and crossings
    const pedestrianCount = radius >= 2.8 ? 14 : radius >= 2.0 ? 8 : 4;
    for (let p = 0; p < pedestrianCount; p++) {
      const step = Math.floor((p * (villageRoad.length / pedestrianCount) + 5) % villageRoad.length);
      const roadNode = villageRoad[step];
      const side = p % 2 === 0 ? 1 : -1;
      const walkNormal = roadNode.normal
        .clone()
        .addScaledVector(roadNode.across, side * 0.034 * detail)
        .normalize();
      makePedestrian(buckets, walkNormal, radius, random, p);
    }

    // 7. Roadside Utility Poles & Clean Overhead Wires
    // Placed along villageRoad shoulder; connected sequentially pole-to-pole
    const poleCount = radius >= 2.8 ? 11 : 7;
    const polePositions = [];
    for (let i = 0; i < poleCount; i++) {
      const step = Math.floor((i * (villageRoad.length / poleCount) + 2) % villageRoad.length);
      const roadNode = villageRoad[step];
      const poleNormal = roadNode.normal
        .clone()
        .addScaledVector(roadNode.across, 0.036 * detail)
        .normalize();
      const yaw = Math.atan2(roadNode.tangent.z, roadNode.tangent.x) + Math.PI / 2;
      polePositions.push({ normal: poleNormal, yaw });
      occupiedZones.push({ normal: poleNormal, radius: 0.04 * detail });
    }
    makeUtilityPolesAndWires(buckets, radius, polePositions);

    // 8. Transmission Towers on distant mountain ridges
    for (let i = 0; i < 2; i++) {
      const tNormal = direction(i * 13 + 8, 29, seed + 0.9);
      makeTransmissionTower(buckets, tNormal, radius, i * 1.2);
      occupiedZones.push({ normal: tNormal, radius: 0.2 * detail });
    }

    // 9. Lush Mountain Forests (Mountains are full of trees, vastly outnumbering houses!)
    // Detect mountain high ground (elevation above base) and populate with dense clusters
    const mountainClusters = 22;
    for (let i = 0; i < mountainClusters; i++) {
      const normal = direction(i * 7 + 3, mountainClusters, seed + 0.5);
      const h = elevation(normal, radius);
      // Ensure forest is on mountain slopes or highlands away from lake
      if (h > radius - 0.02 * detail && normal.distanceTo(lakeCenterSAP) > lakeAngularRadius + 0.08) {
        makeForest(
          buckets,
          normal,
          radius,
          random,
          9 + (i % 5), // 9 to 13 trees per cluster
          occupiedZones,
        );
      }
    }
    // Additional mountain ridge forests
    for (const [x, y, z] of [
      [-0.65, 0.45, 0.6],
      [0.6, -0.45, 0.65],
      [-0.2, -0.65, 0.72],
      [0.35, 0.72, 0.58],
      [-0.45, 0.7, -0.55],
    ]) {
      makeForest(
        buckets,
        new THREE.Vector3(x, y, z).normalize(),
        radius,
        random,
        10,
        occupiedZones,
      );
    }

    // 10. Diverse Atmospheric Clouds (Pure stylized white clouds, no rock debris)
    const cloudCount = Math.max(5, Math.round(radius * 3.5));
    makeAtmosphereClouds(buckets, radius, seed, random, cloudCount);

    // 11. Peaceful Hot Air Balloon hovering over lake
    if (radius >= 2.0) {
      const balloon = makeHotAirBalloon(globe, radius, seed);
      if (balloon) animators.push(balloon);
    }
  } else {
    // Small satellite worlds: gentle asteroid nature without buildings
    for (let i = 0; i < (radius < 1 ? 4 : 7); i++) {
      makeForest(
        buckets,
        direction(i, radius < 1 ? 4 : 7, seed),
        radius,
        random,
        radius < 1 ? 3 : 4,
        null,
      );
    }
    const satelliteClouds = radius < 0.8 ? 2 : 3;
    makeAtmosphereClouds(buckets, radius, seed, random, satelliteClouds);
  }

  flush(buckets, globe);
  root.userData.globe = globe;

  if (animators.length > 0) {
    root.userData.update = (delta) => {
      for (const a of animators) a.update?.(delta);
    };
  }

  return root;
}
