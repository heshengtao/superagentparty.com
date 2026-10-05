import * as THREE from "three";
import { projects } from "./projects.js";
import { makePlanet } from "./planet.js";

const layouts = {
  "super-agent-party": {
    at: [0, 0, 0],
    radius: 3.05,
    seed: 5,
    ground: 0x75a57d,
    rock: 0xc1c8a9,
  },
  "comfyui-llm-party": {
    at: [8.4, 1.0, -2.1],
    radius: 2.35,
    seed: 19,
    ground: 0x75a69d,
    rock: 0xb7c7b5,
  },
  exameow: {
    at: [-7.1, -2.3, -3.3],
    radius: 1.65,
    seed: 24,
    ground: 0xc1b18f,
    rock: 0xdfd0ae,
  },
  labelall: {
    at: [5.25, -5.2, -4.0],
    radius: 1.55,
    seed: 31,
    ground: 0x8ba9a0,
    rock: 0xc2d0bf,
  },
  "sap-live2d": { at: [-4.45, 2.0, -2.0], radius: 0.64, seed: 41 },
  "sap-story-adventure": { at: [-4.0, -2.1, -1.5], radius: 0.58, seed: 42 },
  "sap-web-preview": { at: [2.4, 4.5, -2.6], radius: 0.55, seed: 43 },
  "desktop-for-sap": { at: [4.2, -1.9, -2.3], radius: 0.6, seed: 44 },
  "sap-aigalgame": { at: [0.8, -4.3, -2.3], radius: 0.52, seed: 45 },
  "sap-example": { at: [-5.3, 4.6, -3.2], radius: 0.51, seed: 46 },
  "sap-aieditor": { at: [3.9, 2.65, -4.0], radius: 0.52, seed: 47 },
  "sap-remote": { at: [-3.15, -4.0, -3.1], radius: 0.52, seed: 48 },
  "let-llm-party": { at: [8.0, 4.8, -3.3], radius: 0.62, seed: 51 },
  "comfyui-llm-mafia": { at: [12.35, 1.45, -3.5], radius: 0.58, seed: 52 },
  "comfyui-llm-schools": { at: [9.6, -2.5, -3.6], radius: 0.59, seed: 53 },
};

const mobileQuery = window.matchMedia("(max-width: 700px)");

function makeOrbit(center, radius, color) {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const angle = (i / 128) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        center[0] + Math.cos(angle) * radius,
        center[1] + Math.sin(angle) * radius * 0.82,
        center[2] - 1.2,
      ),
    );
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 }),
  );
}

export function createWorld(canvas, { onSelect, onFrame }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1.25 : 1.8),
  );
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x83bdb9);
  scene.fog = new THREE.Fog(0x83bdb9, 32, 58);
  scene.add(new THREE.HemisphereLight(0xfaf6df, 0x6f8e86, 2.05));
  const sun = new THREE.DirectionalLight(0xfff3d5, 2.0);
  sun.position.set(-7, 13, 15);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x92c7c2, 0.65);
  fill.position.set(10, -4, -8);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const target = new THREE.Vector3(
    mobileQuery.matches ? 0 : 1.1,
    mobileQuery.matches ? (window.innerHeight < 700 ? 4 : 2.1) : 0,
    0,
  );
  const desiredTarget = target.clone();
  const planets = new Map();
  const planetMeshes = [];
  for (const project of projects) {
    const layout = layouts[project.id];
    const palette = {
      ground:
        layout.ground ||
        (project.parent === "comfyui-llm-party" ? 0x9cb5a5 : 0xb3bd98),
      rock: layout.rock || 0xcdcdb5,
    };
    const planet = makePlanet(project, layout.radius, layout.seed, palette);
    planet.position.set(...layout.at);
    scene.add(planet);
    planets.set(project.id, planet);
    planet.traverse((object) => {
      if (object.isMesh) planetMeshes.push(object);
    });
  }
  const orbitSap = makeOrbit([0, 0, 0], 4.9, 0xe7f0db);
  const orbitComfy = makeOrbit([8.4, 1, -2.1], 4.15, 0xe7f0db);
  scene.add(orbitSap, orbitComfy);
  const dustMaterial = new THREE.MeshBasicMaterial({ color: 0xe2ecdc });
  const dustGeometry = new THREE.IcosahedronGeometry(0.04, 0);
  for (let i = 0; i < 64; i++) {
    const sparkle = new THREE.Mesh(dustGeometry, dustMaterial);
    sparkle.position.set(
      Math.sin(i * 17.11) * 18,
      Math.cos(i * 13.61) * 10,
      -7 - (i % 7),
    );
    sparkle.scale.setScalar(0.4 + (i % 4) * 0.4);
    scene.add(sparkle);
  }

  let selectedId = null;
  let motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let yaw = 0;
  let pitch = 0.18;
  let desiredDistance = mobileQuery.matches ? 20.5 : 23.5;
  let distance = desiredDistance;
  let pointerDown = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const clock = new THREE.Clock();

  function fit() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, mobileQuery.matches ? 1.25 : 1.8),
    );
    renderer.setSize(width, height, false);
  }

  function select(id) {
    selectedId = id && planets.has(id) ? id : null;
    const planet = planets.get(selectedId);
    const radius = selectedId ? layouts[selectedId].radius : 0;
    desiredDistance = selectedId
      ? Math.max(
          5,
          radius * (mobileQuery.matches ? 8 : 3.65) +
            (mobileQuery.matches ? 5 : 2.6),
        )
      : mobileQuery.matches
        ? 20.5
        : 23.5;
    desiredTarget.copy(
      planet?.position ||
        new THREE.Vector3(mobileQuery.matches ? 0 : 1.1, 0, 0),
    );
    if (mobileQuery.matches)
      desiredTarget.y += selectedId
        ? -desiredDistance * 0.23
        : window.innerHeight < 700
          ? 4
          : 2.1;
    orbitSap.material.opacity =
      !selectedId || selectedId === "super-agent-party" ? 0.25 : 0.08;
    orbitComfy.material.opacity =
      !selectedId || selectedId === "comfyui-llm-party" ? 0.25 : 0.08;
  }

  function setMotion(value) {
    motion = value;
  }

  function onPointerDown(event) {
    pointerDown = {
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    if (!pointerDown) return;
    const dx = event.clientX - pointerDown.lastX;
    const dy = event.clientY - pointerDown.lastY;
    pointerDown.lastX = event.clientX;
    pointerDown.lastY = event.clientY;
    if (
      Math.abs(event.clientX - pointerDown.x) +
        Math.abs(event.clientY - pointerDown.y) >
      5
    )
      pointerDown.moved = true;
    if (pointerDown.moved) {
      yaw -= dx * 0.0045;
      pitch = THREE.MathUtils.clamp(pitch + dy * 0.004, -0.65, 0.8);
    }
  }

  function onPointerUp(event) {
    if (!pointerDown) return;
    const wasClick = !pointerDown.moved;
    pointerDown = null;
    if (!wasClick) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(planetMeshes, false);
    for (const hit of hits) {
      let node = hit.object;
      while (node && !node.userData.projectId) node = node.parent;
      if (node?.userData.projectId) {
        onSelect(node.userData.projectId);
        return;
      }
    }
  }

  function onWheel(event) {
    event.preventDefault();
    desiredDistance = THREE.MathUtils.clamp(
      desiredDistance + event.deltaY * 0.013,
      4.5,
      35,
    );
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", () => {
    pointerDown = null;
  });
  canvas.addEventListener("wheel", onWheel, { passive: false });
  const resizeObserver = new ResizeObserver(fit);
  resizeObserver.observe(canvas);
  mobileQuery.addEventListener("change", () => select(selectedId));
  fit();

  function projectPosition(id) {
    const planet = planets.get(id);
    if (!planet) return null;
    const position = planet.position.clone().project(camera);
    const layout = layouts[id];
    const fromCamera = Math.max(1, camera.position.distanceTo(planet.position));
    const screenRadius =
      (layout.radius * canvas.clientHeight) /
      (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * fromCamera);
    return {
      x: ((position.x + 1) * canvas.clientWidth) / 2,
      y: ((1 - position.y) * canvas.clientHeight) / 2,
      radius: screenRadius,
      visible:
        position.z < 1 &&
        position.x > -0.94 &&
        position.x < 0.94 &&
        position.y > -0.86 &&
        position.y < 0.86,
    };
  }

  function animate() {
    const delta = Math.min(clock.getDelta(), 0.05);
    const easing = Math.min(1, delta * 3.2);
    target.lerp(desiredTarget, easing);
    distance = THREE.MathUtils.lerp(distance, desiredDistance, easing);
    if (motion && !document.hidden) {
      for (const [id, planet] of planets)
        planet.userData.globe.rotation.y +=
          delta * (id === selectedId ? 0.11 : 0.045);
    }
    const cos = Math.cos(pitch);
    camera.position.set(
      target.x + Math.sin(yaw) * cos * distance,
      target.y + Math.sin(pitch) * distance,
      target.z + Math.cos(yaw) * cos * distance,
    );
    camera.lookAt(target);
    if (!document.hidden) renderer.render(scene, camera);
    onFrame?.(projectPosition);
    requestAnimationFrame(animate);
  }
  animate();

  return { select, setMotion, projectPosition };
}
