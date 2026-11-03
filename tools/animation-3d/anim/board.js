// The system as a dark diorama board: Eigentümer and Handwerker on top, Ecoraum hub in the middle,
// the tenant's building below the owner. Glowing tubes carry packets between them.
import * as THREE from "three";
import { mat, glow, mesh, group, rand, clamp } from "./engine.js";
import { C, rbox, box, cyl, sph, person, house, van, toolbox, tube } from "./builders.js";
import { buildBuilding } from "./building.js";

export const POS = {
  owner: new THREE.Vector3(-1.2, 0, -3.2),
  trade: new THREE.Vector3(1.2, 0, -3.2),
  eco: new THREE.Vector3(0, 0, -0.4),
  tenant: new THREE.Vector3(-1.2, 0, 2.4),
};
const PH = 0.45, H0 = 0.07;

export function buildBoard() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090d);
  scene.fog = new THREE.FogExp2(0x07090d, 0.028);

  scene.add(mesh(new THREE.PlaneGeometry(80, 80), mat(0x0b0e13, { rough: 1 }), { y: -0.62, rx: -Math.PI / 2, cast: false }));
  const platform = mesh(rbox(5.4, 0.5, 8.8, 0.08), mat(0x161b23, { rough: 0.9 }), { y: -0.25, z: -0.4 });
  scene.add(platform);
  // Fine grid on the platform
  for (let i = -5; i <= 5; i++) scene.add(mesh(box(0.008, 0.002, 8.6), mat(0x232a35), { x: i * 0.5, y: 0.001, z: -0.4, cast: false }));
  for (let i = -8; i <= 8; i++) scene.add(mesh(box(5.2, 0.002, 0.008), mat(0x232a35), { y: 0.001, z: -0.4 + i * 0.5, cast: false }));

  const blocks = {};
  const pedestal = (key, color, accentCol) => {
    const g = new THREE.Group();
    g.position.copy(POS[key]);
    const ped = mesh(rbox(1.5, PH, 1.5, 0.06), mat(color, { rough: 0.8 }), { y: PH / 2 });
    g.add(ped);
    const rimM = glow(accentCol, 1.6, { opacity: 0.0 });
    g.add(mesh(box(1.52, 0.03, 1.52), rimM, { y: PH + 0.002, cast: false }));
    const top = new THREE.Group();
    top.position.y = PH;
    g.add(top);
    const light = new THREE.PointLight(accentCol, 0, 4.5, 1.6);
    light.position.set(0, 1.6, 0.6);
    g.add(light);
    scene.add(g);
    blocks[key] = { g, top, rimM, light, rise: 0, accent: accentCol };
    return top;
  };

  // Owner: house + small owner figure with phone
  const ownerTop = pedestal("owner", 0x1d232c, 0xffc46b);
  const h = house(0xe9dcc5, 0x9c3d2e);
  h.scale.setScalar(0.72);
  h.position.set(-0.15, 0, -0.15);
  ownerTop.add(h);
  const owner = person({ shirt: 0x4f7a5a, scale: 0.3, mouth: "smile" });
  owner.position.set(0.45, 0, 0.42);
  owner.rotation.y = -0.4;
  ownerTop.add(owner);
  const ownerPhone = mesh(box(0.05, 0.09, 0.012), glow(0xffffff, 0.6), { x: 0.42, y: 0.42, z: 0.55, cast: false });
  ownerTop.add(ownerPhone);

  // Trades: van, toolbox, three workers
  const tradeTop = pedestal("trade", 0x1d232c, 0x6aa8ff);
  const v = van(0xf1f1f1, 0x2f6db5);
  v.scale.setScalar(0.55);
  v.position.set(-0.15, 0, -0.35);
  v.rotation.y = 0.25;
  tradeTop.add(v);
  const tb = toolbox(); tb.scale.setScalar(0.6); tb.position.set(0.5, 0, -0.45); tradeTop.add(tb);
  const workers = [];
  [[0xf2c230, "helmet", 0xf2c230, -0.45], [0x2f6db5, "cap", 0x2f6db5, 0.0], [0xe9e9e9, "cap", 0xd04a3a, 0.45]].forEach(([shirt, st, capC, x], i) => {
    const w = person({ shirt, pants: 0x2f3a4a, hairStyle: st, capColor: capC, scale: 0.28, mouth: "smile" });
    w.position.set(x, 0, 0.38);
    tradeTop.add(w);
    workers.push(w);
  });
  const pickBeamM = glow(0x6aa8ff, 1.2, { opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const pickBeam = mesh(cyl(0.16, 0.3, 2.2, 20, true), pickBeamM, { x: 0, y: 1.1, z: 0.38, cast: false });
  tradeTop.add(pickBeam);

  // Ecoraum hub: glass tower, AI core, two team members
  const ecoTop = pedestal("eco", 0x16211d, C.accent);
  const glassM = new THREE.MeshStandardMaterial({ color: 0x1a2622, transparent: true, opacity: 0.12, roughness: 0.15, metalness: 0.2, depthWrite: false });
  ecoTop.add(mesh(rbox(1.1, 1.5, 1.1, 0.04), glassM, { y: 0.76, cast: false }));
  const edgeM = glow(C.accent, 1.15);
  for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) ecoTop.add(mesh(box(0.025, 1.5, 0.025), edgeM, { x, y: 0.76, z, cast: false }));
  ecoTop.add(mesh(box(1.12, 0.025, 1.12), edgeM, { y: 1.52, cast: false }));
  const coreM = glow(C.accent, 2.2);
  const core = mesh(new THREE.IcosahedronGeometry(0.15, 0), coreM, { y: 1.08, cast: false });
  ecoTop.add(core);
  const coreRing = mesh(new THREE.TorusGeometry(0.26, 0.01, 6, 40), glow(C.accent, 1.2), { y: 1.08, rx: Math.PI / 2, cast: false });
  ecoTop.add(coreRing);
  const team = [];
  [[-0.24, 0x3d5a80], [0.24, 0x8a5a3b]].forEach(([x, shirt], i) => {
    const desk = mesh(rbox(0.32, 0.03, 0.2, 0.01), mat(0x2a2f36), { x, y: 0.2, z: -0.28 });
    ecoTop.add(desk);
    ecoTop.add(mesh(box(0.2, 0.12, 0.01), glow(C.accent, 0.9), { x, y: 0.3, z: -0.36, cast: false }));
    const p = person({ shirt, seated: true, scale: 0.24, mouth: "smile", hairStyle: i ? "short" : "short" });
    p.position.set(x, 0.0, -0.08);
    p.rotation.y = Math.PI;
    ecoTop.add(p);
    team.push(p);
  });
  const teamLight = new THREE.PointLight(0xfff2d6, 0, 2.2, 1.5);
  teamLight.position.set(0, 0.8, 0.1);
  ecoTop.add(teamLight);

  // Tenant: the building in miniature
  const tenTop = pedestal("tenant", 0x1d232c, C.red);
  const B = buildBuilding({ lights: false, people: false });
  B.root.scale.setScalar(0.17);
  B.root.position.set(0.12, 0.06, 0.0);
  tenTop.add(B.root);

  // Tubes
  const P = (x, z) => new THREE.Vector3(x, H0, z);
  const tubes = {
    t1: tube([P(-1.2, 2.4), P(-0.75, 1.3), P(-0.2, 0.2), P(0, -0.4)]),
    t2: tube([P(0, -0.4), P(-0.35, -1.3), P(-0.95, -2.5), P(-1.2, -3.2)]),
    t3: tube([P(-1.2, -3.2), P(0, -3.25), P(1.2, -3.2)]),
    t4: tube([P(1.2, -3.2), P(1.95, -2.4), P(2.1, 0.6), P(1.6, 2.3), P(0.4, 2.55), P(-1.2, 2.4)]),
  };
  Object.values(tubes).forEach((t) => scene.add(t));
  // Dashed tenancy link
  const dashM = mat(0x5a6577, { emissive: 0x2a3140 });
  for (let i = 0; i < 14; i++) scene.add(mesh(box(0.05, 0.02, 0.18), dashM, { x: -2.15, y: 0.02, z: -3.0 + i * 0.4, cast: false }));

  // Packets with short trails
  const packets = [];
  for (let i = 0; i < 6; i++) {
    const m = glow(0xffffff, 2.2);
    const head = mesh(sph(0.09, 14, 12), m, { cast: false });
    const trail = [];
    for (let k = 0; k < 6; k++) { const tr = mesh(sph(0.06 * (1 - k / 7), 8, 8), glow(0xffffff, 1.6, { opacity: 0.5 * (1 - k / 6) }), { cast: false }); scene.add(tr); trail.push(tr); }
    head.visible = false;
    trail.forEach((tr) => (tr.visible = false));
    scene.add(head);
    packets.push({ head, trail, m });
  }

  // Small van that drives from the trades to the tenant
  const miniVan = van(0xf1f1f1, 0x2f6db5);
  miniVan.scale.setScalar(0.32);
  miniVan.visible = false;
  scene.add(miniVan);

  // Lights
  const key = new THREE.DirectionalLight(0xdfe8ff, 2.3);
  key.position.set(-5, 9, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 7, bottom: -7, near: 1, far: 30 });
  key.shadow.bias = -0.0006;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0x5a6a86, 0x0b0d10, 0.95));
  const rim = new THREE.DirectionalLight(0x7fa0ff, 0.5);
  rim.position.set(5, 3, -8);
  scene.add(rim);

  return { scene, blocks, tubes, packets, miniVan, core, coreRing, coreM, team, teamLight, workers, pickBeam, pickBeamM, B, owner, ownerPhone };
}

// Packet along a tube: k in [0,1]; color hex.
export function setPacket(BD, i, tubeKey, k, color = 0xffffff, scale = 1) {
  const p = BD.packets[i];
  const visible = k > 0 && k < 1;
  p.head.visible = visible;
  p.trail.forEach((t) => (t.visible = visible));
  if (!visible) return null;
  const curve = BD.tubes[tubeKey].userData.curve;
  const pos = curve.getPointAt(clamp(k));
  pos.y += 0.12;
  p.head.position.copy(pos);
  p.head.scale.setScalar(scale);
  p.m.color.setHex(color).multiplyScalar(2.2);
  p.trail.forEach((t, j) => {
    const q = curve.getPointAt(clamp(k - (j + 1) * 0.018));
    q.y += 0.12;
    t.position.copy(q);
    t.material.color.setHex(color).multiplyScalar(1.6);
  });
  return pos;
}

export function setTube(BD, key, color, amount) {
  const m = BD.tubes[key].userData.m;
  m.emissive.setHex(color);
  m.emissiveIntensity = amount * 1.6;
  m.color.setHex(amount > 0.05 ? color : 0x2a3140);
}

export function hidePackets(BD) {
  BD.packets.forEach((p) => { p.head.visible = false; p.trail.forEach((t) => (t.visible = false)); });
}
