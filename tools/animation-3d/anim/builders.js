// Low-poly props and round-headed characters.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mat, glow, mesh, group, canvasTexture } from "./engine.js";

export const C = {
  skin: 0xe9b48f, skin2: 0xc98e6a, skin3: 0x8d5a3b,
  ink: 0x15161a, white: 0xf3efe7,
  water: 0x6fd0ff, red: 0xff3b30, accent: 0x4fc39a, amber: 0xffb03a,
  wood: 0x7a5236, woodDark: 0x4e3424, wall: 0xcdbfa6, wallBlue: 0x5d7a86,
  mustard: 0xc6943f, terracotta: 0xb5573b, teal: 0x3f6e6a, navy: 0x2b3a55,
};

export const rbox = (w, h, d, r = 0.04, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt, rb, h, n = 20, open = false) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open);
export const sph = (r, ws = 18, hs = 14) => new THREE.SphereGeometry(r, ws, hs);
export const cap = (r, len, n = 12) => new THREE.CapsuleGeometry(r, len, 4, n);

// ---------- characters ----------
export function person(o = {}) {
  const skin = mat(o.skin ?? C.skin, { flat: false, rough: 0.7 });
  const shirt = mat(o.shirt ?? 0x3d5a80, { flat: false });
  const pants = mat(o.pants ?? 0x2b2d42, { flat: false });
  const hairM = mat(o.hair ?? 0x2a2420, { flat: false, rough: 0.9 });
  const shoe = mat(o.shoes ?? 0x1a1a1e);
  const seated = !!o.seated;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const hipY = seated ? 0.5 : 0.82;
  const torsoY = hipY + 0.42;
  const torso = mesh(cap(0.27, 0.42, 14), shirt, { y: torsoY });
  body.add(torso);

  if (seated) {
    for (const sx of [-0.13, 0.13]) {
      body.add(mesh(cap(0.105, 0.36, 10), pants, { x: sx, y: hipY, z: 0.22, rx: Math.PI / 2 }));
      body.add(mesh(cap(0.095, 0.3, 10), pants, { x: sx, y: 0.27, z: 0.45 }));
      body.add(mesh(rbox(0.15, 0.08, 0.26, 0.035), shoe, { x: sx, y: 0.04, z: 0.53 }));
    }
  } else {
    for (const sx of [-0.13, 0.13]) {
      body.add(mesh(cap(0.105, 0.58, 10), pants, { x: sx, y: 0.45 }));
      body.add(mesh(rbox(0.15, 0.08, 0.26, 0.035), shoe, { x: sx, y: 0.04, z: 0.05 }));
    }
  }

  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.31, torsoY + 0.3, 0);
    const upper = mesh(cap(0.078, 0.38, 10), shirt, { y: -0.24 });
    const hand = mesh(sph(0.075, 10, 8), skin, { y: -0.48 });
    pivot.add(upper, hand);
    pivot.rotation.z = side * 0.12;
    if (seated) pivot.rotation.x = -0.55;
    body.add(pivot);
    arms.push(pivot);
  }

  const neck = new THREE.Group();
  neck.position.set(0, torsoY + 0.38, 0);
  body.add(neck);
  const head = new THREE.Group();
  neck.add(head);
  const hr = 0.3;
  head.add(mesh(sph(hr, 24, 18), skin, { y: hr }));
  const eyes = new THREE.Group();
  const eyeM = mat(C.ink, { flat: false, rough: 0.4 });
  for (const ex of [-0.105, 0.105]) eyes.add(mesh(sph(0.04, 10, 8), eyeM, { x: ex, y: hr + 0.04, z: hr * 0.9, cast: false }));
  head.add(eyes);
  const brows = new THREE.Group();
  const browM = mat(o.hair ?? 0x2a2420, { flat: false });
  for (const ex of [-0.11, 0.11]) brows.add(mesh(cap(0.014, 0.07, 6), browM, { x: ex, y: hr + 0.135, z: hr * 0.86, rz: Math.PI / 2 + (ex < 0 ? -0.15 : 0.15), cast: false }));
  head.add(brows);
  const mouths = {
    line: mesh(cap(0.012, 0.06, 6), eyeM, { y: hr - 0.085, z: hr * 0.94, rz: Math.PI / 2, cast: false }),
    smile: mesh(new THREE.TorusGeometry(0.06, 0.014, 6, 14, Math.PI), eyeM, { y: hr - 0.06, z: hr * 0.93, rz: Math.PI, cast: false }),
    o: mesh(sph(0.035, 10, 8), eyeM, { y: hr - 0.09, z: hr * 0.94, s: [1, 1.25, 0.6], cast: false }),
  };
  Object.values(mouths).forEach((m) => { m.visible = false; head.add(m); });
  const setFace = (f) => { Object.entries(mouths).forEach(([k, m]) => (m.visible = k === f)); };
  setFace(o.mouth ?? "line");
  const style = o.hairStyle ?? "short";
  if (style !== "bald") {
    const capGeo = new THREE.SphereGeometry(hr * 1.06, 24, 12, 0, Math.PI * 2, 0, Math.PI * (style === "long" ? 0.5 : 0.42));
    head.add(mesh(capGeo, hairM, { y: hr, rx: -0.28 }));
    if (style === "long") head.add(mesh(rbox(0.56, 0.42, 0.18, 0.08), hairM, { y: hr - 0.12, z: -0.2 }));
    if (style === "bun") head.add(mesh(sph(0.12, 12, 10), hairM, { y: hr + 0.3, z: -0.14 }));
  }
  if (style === "cap" || style === "helmet") {
    const col = o.capColor ?? 0x2f6db5;
    const hat = mat(col, { flat: false });
    head.add(mesh(new THREE.SphereGeometry(hr * 1.08, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), hat, { y: hr + 0.02 }));
    head.add(mesh(style === "cap" ? rbox(0.36, 0.03, 0.22, 0.01) : cyl(0.42, 0.42, 0.03, 20), hat, { y: hr + 0.1, z: style === "cap" ? 0.3 : 0 }));
  }
  root.userData = { body, torso, head, neck, eyes, brows, arms, hipY, setFace };
  if (o.scale) root.scale.setScalar(o.scale);
  return root;
}

// ---------- living room props ----------
export function couch(color = C.mustard) {
  const m = mat(color, { flat: false, rough: 0.95 });
  const d = mat(new THREE.Color(color).multiplyScalar(0.8).getHex(), { flat: false, rough: 0.95 });
  return group(
    mesh(rbox(2.3, 0.34, 0.95, 0.08), d, { y: 0.17 }),
    mesh(rbox(1.08, 0.17, 0.86, 0.07), m, { x: -0.56, y: 0.42, z: 0.04 }),
    mesh(rbox(1.08, 0.17, 0.86, 0.07), m, { x: 0.56, y: 0.42, z: 0.04 }),
    mesh(rbox(2.3, 0.72, 0.26, 0.1), d, { y: 0.66, z: -0.4 }),
    mesh(rbox(0.26, 0.58, 0.95, 0.1), d, { x: -1.2, y: 0.29 }),
    mesh(rbox(0.26, 0.58, 0.95, 0.1), d, { x: 1.2, y: 0.29 }),
    mesh(rbox(0.45, 0.4, 0.14, 0.07), mat(C.teal, { flat: false }), { x: -0.8, y: 0.7, z: -0.2, rz: 0.12 }),
  );
}

export function floorLamp(lightColor = 0xffb46b) {
  const metal = mat(0x2a2a2e, { rough: 0.5, metal: 0.6 });
  const shade = mat(0xf1dcb5, { emissive: 0xffb46b, ei: 0.55, flat: false, side: THREE.DoubleSide });
  const g = group(
    mesh(cyl(0.2, 0.22, 0.04), metal, { y: 0.02 }),
    mesh(cyl(0.02, 0.02, 1.55, 8), metal, { y: 0.8 }),
    mesh(cyl(0.18, 0.3, 0.36, 24, true), shade, { y: 1.65 }),
  );
  const light = new THREE.PointLight(lightColor, 4.0, 7, 1.6);
  light.position.set(0, 1.55, 0);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.004;
  g.add(light);
  g.userData.light = light;
  return g;
}

export function plant() {
  const leaf = mat(0x3e7d4f);
  const leaf2 = mat(0x2f6a43);
  const g = group(mesh(cyl(0.2, 0.15, 0.36, 16), mat(0xc96f4a), { y: 0.18 }));
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, r = 0.12 + (i % 3) * 0.06;
    g.add(mesh(new THREE.IcosahedronGeometry(0.17 + (i % 2) * 0.05, 0), i % 2 ? leaf : leaf2, { x: Math.cos(a) * r, y: 0.5 + (i % 4) * 0.14, z: Math.sin(a) * r, ry: a, rx: i }));
  }
  return g;
}

export function frame(w, h, art) {
  const g = group(mesh(box(w, h, 0.04), mat(C.woodDark), { cast: false }));
  g.add(mesh(box(w * 0.82, h * 0.82, 0.02), mat(art), { z: 0.02, cast: false }));
  return g;
}

export function windowPane(w, h, glowColor = 0x1b2b4a) {
  const tex = canvasTexture(256, 256);
  const g2 = tex.g;
  const grad = g2.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#0d1730");
  grad.addColorStop(1, "#24375c");
  g2.fillStyle = grad;
  g2.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9; i++) {
    const bx = i * 30 - 4, bh = 60 + ((i * 37) % 90);
    g2.fillStyle = "#0a1020";
    g2.fillRect(bx, 256 - bh, 26, bh);
    for (let k = 0; k < 8; k++) {
      if ((i * 7 + k * 3) % 4 === 0) { g2.fillStyle = "#ffcf7a"; g2.fillRect(bx + 5 + (k % 2) * 10, 256 - bh + 10 + Math.floor(k / 2) * 14, 5, 6); }
    }
  }
  g2.fillStyle = "#f4f1e6";
  g2.beginPath(); g2.arc(200, 50, 14, 0, Math.PI * 2); g2.fill();
  tex.tex.needsUpdate = true;
  const glass = new THREE.MeshBasicMaterial({ map: tex.tex, toneMapped: true });
  const fm = mat(0xe8e2d6);
  return group(
    mesh(new THREE.PlaneGeometry(w, h), glass, { cast: false }),
    mesh(box(w + 0.12, 0.08, 0.1), fm, { y: h / 2 }), mesh(box(w + 0.12, 0.08, 0.14), fm, { y: -h / 2 }),
    mesh(box(0.08, h, 0.1), fm, { x: -w / 2 }), mesh(box(0.08, h, 0.1), fm, { x: w / 2 }),
    mesh(box(0.05, h, 0.06), fm, { x: 0 }), mesh(box(w, 0.05, 0.06), fm, { y: 0 }),
  );
}

export function tv() {
  const scr = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x6f9cff).multiplyScalar(1.4), toneMapped: false });
  const g = group(
    mesh(rbox(1.5, 0.45, 0.42, 0.03), mat(C.woodDark), { y: 0.225 }),
    mesh(box(1.3, 0.76, 0.05), mat(0x111114, { rough: 0.4 }), { y: 0.95 }),
  );
  const screen = mesh(new THREE.PlaneGeometry(1.22, 0.68), scr, { y: 0.95, z: 0.03, cast: false });
  g.add(screen);
  const light = new THREE.PointLight(0x7aa7ff, 2.5, 6, 1.5);
  light.position.set(0, 0.95, 0.5);
  g.add(light);
  g.userData = { screen, light, scr };
  return g;
}

export function bucket() {
  const m = mat(0x2f78c4, { flat: false, rough: 0.6, side: THREE.DoubleSide });
  return group(
    mesh(cyl(0.2, 0.15, 0.32, 20, true), m, { y: 0.16 }),
    mesh(cyl(0.15, 0.15, 0.01, 20), m, { y: 0.005 }),
    mesh(new THREE.TorusGeometry(0.19, 0.012, 6, 20, Math.PI), mat(0xbbbbbb, { metal: 0.6, rough: 0.4 }), { y: 0.32, rx: 0 }),
  );
}

export function fuseBox() {
  const g = group(mesh(rbox(0.9, 1.1, 0.16, 0.03), mat(0x5d636b)), mesh(box(0.8, 1.0, 0.02), mat(0x3a3f46), { z: 0.08 }));
  const switches = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const sw = new THREE.Group();
    sw.position.set(-0.3 + c * 0.12, 0.3 - r * 0.3, 0.1);
    sw.add(mesh(box(0.09, 0.2, 0.06), mat(0xf6f4ef)));
    const lever = mesh(rbox(0.05, 0.08, 0.05, 0.015), mat(r === 1 && c === 2 ? C.red : 0x2b2b2b), { y: 0.04, z: 0.04 });
    sw.add(lever);
    sw.userData.lever = lever;
    g.add(sw);
    switches.push(sw);
  }
  g.userData.target = switches[8];
  return g;
}

export function ladder() {
  const m = mat(0xb8bcc2, { metal: 0.5, rough: 0.45 });
  const g = group(mesh(box(0.05, 2.0, 0.05), m, { x: -0.22, y: 1.0 }), mesh(box(0.05, 2.0, 0.05), m, { x: 0.22, y: 1.0 }));
  for (let i = 0; i < 6; i++) g.add(mesh(box(0.44, 0.04, 0.08), m, { y: 0.25 + i * 0.32 }));
  return g;
}

export function waterDrop() {
  return mesh(sph(0.04, 14, 12), glow(C.water, 1.25), { s: [1, 1.35, 1], cast: false });
}

// ---------- dining props ----------
export function phone() {
  const ui = canvasTexture(360, 760);
  const body = mesh(rbox(0.36, 0.76, 0.04, 0.05, 3), mat(0x16171b, { rough: 0.35, metal: 0.4 }));
  const screen = mesh(new THREE.PlaneGeometry(0.33, 0.7), new THREE.MeshBasicMaterial({ map: ui.tex, toneMapped: false }), { z: 0.021, cast: false });
  const g = group(body, screen);
  g.userData = { ui, screen };
  return g;
}

export function candle() {
  const g = group(mesh(cyl(0.035, 0.035, 0.24, 12), mat(0xf5efe0, { flat: false }), { y: 0.12 }));
  g.add(mesh(sph(0.025, 8, 8), glow(0xffb85c, 3), { y: 0.27, s: [1, 1.8, 1], cast: false }));
  return g;
}

export function plate(food = 0xd9a441) {
  const g = group(mesh(cyl(0.2, 0.17, 0.03, 24), mat(0xf7f5f0, { flat: false, rough: 0.4 }), { y: 0.015 }));
  g.add(mesh(sph(0.08, 10, 8), mat(food), { y: 0.05, s: [1.2, 0.5, 1] }));
  g.add(mesh(sph(0.05, 8, 6), mat(0x5c9c46), { x: 0.07, y: 0.05, z: 0.04, s: [1, 0.6, 1] }));
  return g;
}

export function chair(color = C.woodDark) {
  const m = mat(color);
  const g = group(mesh(rbox(0.5, 0.06, 0.5, 0.02), m, { y: 0.47 }), mesh(rbox(0.5, 0.6, 0.06, 0.02), m, { y: 0.8, z: -0.22 }));
  for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) g.add(mesh(box(0.05, 0.46, 0.05), m, { x, y: 0.23, z }));
  return g;
}

// ---------- board props ----------
export function house(wallColor = 0xe8dcc6, roofColor = 0x9c3d2e) {
  const wall = mat(wallColor), roof = mat(roofColor);
  const roofGeo = new THREE.CylinderGeometry(0.72, 0.72, 1.3, 3, 1);
  const g = group(mesh(box(1.2, 0.8, 1.0), wall, { y: 0.4 }), mesh(roofGeo, roof, { y: 1.02, rz: Math.PI / 2, ry: Math.PI / 2, s: [1, 1, 0.62] }));
  const win = glow(0xffc46b, 1.6);
  for (const x of [-0.32, 0.32]) g.add(mesh(box(0.22, 0.22, 0.02), win, { x, y: 0.48, z: 0.51, cast: false }));
  g.add(mesh(box(0.22, 0.4, 0.02), mat(C.woodDark), { y: 0.2, z: 0.51 }));
  g.add(mesh(box(0.16, 0.4, 0.16), mat(0x6b5a4c), { x: 0.3, y: 1.25, z: -0.15 }));
  return g;
}

export function van(color = 0xf2f2f2, stripe = 0x2f6db5) {
  const body = mat(color, { flat: false, rough: 0.5 });
  const dark = mat(0x1b1c20);
  const glass = mat(0x22344a, { rough: 0.2, metal: 0.3 });
  const g = group(
    mesh(rbox(1.0, 0.7, 0.62, 0.08), body, { x: -0.12, y: 0.5 }),
    mesh(rbox(0.42, 0.5, 0.62, 0.1), body, { x: 0.55, y: 0.4 }),
    mesh(box(0.02, 0.24, 0.5), glass, { x: 0.77, y: 0.52 }),
    mesh(box(1.0, 0.08, 0.63), mat(stripe), { x: -0.12, y: 0.42 }),
  );
  for (const x of [-0.4, 0.5]) for (const z of [-0.3, 0.3]) g.add(mesh(cyl(0.13, 0.13, 0.1, 16), dark, { x, y: 0.15, z, rx: Math.PI / 2 }));
  return g;
}

export function toolbox() {
  return group(
    mesh(rbox(0.5, 0.26, 0.24, 0.03), mat(0xd23a2e), { y: 0.13 }),
    mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12, Math.PI), mat(0x222222), { y: 0.26 }),
  );
}

export function tube(points, radius = 0.045) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.05);
  const m = new THREE.MeshStandardMaterial({ color: 0x2a3140, emissive: 0x000000, roughness: 0.6, flatShading: false });
  const t = mesh(new THREE.TubeGeometry(curve, 120, radius, 10, false), m, { cast: false });
  t.userData = { curve, m };
  return t;
}
