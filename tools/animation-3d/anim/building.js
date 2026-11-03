// Apartment block cut open like a dollhouse: tenant flat in the middle, leaking bathroom above.
import * as THREE from "three";
import { mat, glow, mesh, group, rand } from "./engine.js";
import { C, rbox, box, cyl, sph, person } from "./builders.js";

const UW = 3.5, UD = 3.2, FH = 2.85, SLAB = 0.24;

function furniture(kind, m) {
  if (kind === "sofa") return group(mesh(rbox(1.5, 0.35, 0.7, 0.06), m, { y: 0.18 }), mesh(rbox(1.5, 0.5, 0.18, 0.06), m, { y: 0.45, z: -0.28 }));
  if (kind === "bed") return group(mesh(rbox(1.5, 0.35, 2.0, 0.05), mat(0xe8e4dc), { y: 0.2 }), mesh(rbox(1.5, 0.6, 0.1, 0.03), m, { y: 0.4, z: -0.98 }), mesh(rbox(1.3, 0.06, 1.2, 0.03), m, { y: 0.4, z: 0.3 }));
  if (kind === "table") return group(mesh(rbox(1.1, 0.05, 0.7, 0.02), mat(C.woodDark), { y: 0.74 }), mesh(box(0.06, 0.72, 0.06), mat(C.woodDark), { x: -0.45, y: 0.36 }), mesh(box(0.06, 0.72, 0.06), mat(C.woodDark), { x: 0.45, y: 0.36 }));
  if (kind === "shelf") return group(mesh(box(0.9, 1.6, 0.3), mat(0x5b4636), { y: 0.8 }), ...[0, 1, 2].map((i) => mesh(box(0.6, 0.25, 0.22), mat([0xb5573b, 0x3f6e6a, 0xc6943f][i]), { x: -0.1 + i * 0.08, y: 0.35 + i * 0.5, z: 0.04 })));
  if (kind === "lamp") return group(mesh(cyl(0.02, 0.02, 1.3, 6), mat(0x222222), { y: 0.65 }), mesh(cyl(0.12, 0.2, 0.25, 12, true), glow(0xffc27a, 1.3, { side: THREE.DoubleSide }), { y: 1.35 }));
  return new THREE.Group();
}

export function buildBuilding({ lights = true, people = true } = {}) {
  const root = new THREE.Group();
  const concrete = mat(0xd8d4cc, { rough: 1 });
  const section = mat(0xefebe3, { rough: 1 });
  const units = [];
  const palettes = [
    [0x6f8f8a, 0x8a6a4f, 0xffc27a], [0x9a8770, 0x6b4f3a, 0xffd08a],
    [0x7f7a9a, 0x5a4a3c, 0xffbf80], [0x8aa08a, 0x6e5640, 0xa8c8ff],
    [0xb7a68e, 0x7a5a42, 0xffc98a], [0x6c7c92, 0x5a4636, 0xffb870],
  ];
  for (let f = 0; f < 3; f++) {
    const y0 = f * FH;
    root.add(mesh(box(UW * 2 + 0.3, SLAB, UD + 0.2), section, { y: y0 - SLAB / 2 }));
    for (let u = 0; u < 2; u++) {
      const x0 = u === 0 ? -UW : 0, cx = x0 + UW / 2;
      const [wallC, floorC, lightC] = palettes[f * 2 + u];
      const unit = new THREE.Group();
      unit.position.set(cx, y0, 0);
      unit.add(mesh(box(UW, FH - SLAB, 0.15), mat(wallC, { rough: 0.95 }), { y: (FH - SLAB) / 2, z: -UD / 2 }));
      unit.add(mesh(box(UW - 0.02, 0.02, UD), mat(floorC, { rough: 0.9 }), { y: 0.01 }));
      if (lights) {
        const l = new THREE.PointLight(lightC, 1.6, 6, 1.6);
        l.position.set(0, FH - 0.7, 0.3);
        unit.add(l);
        unit.userData.light = l;
      }
      root.add(unit);
      units.push(unit);
    }
    root.add(mesh(box(0.16, FH - SLAB, UD), section, { x: 0, y: y0 + (FH - SLAB) / 2 }));
    root.add(mesh(box(0.3, FH, UD + 0.2), section, { x: -UW - 0.15, y: y0 + FH / 2 - SLAB / 2 }));
    root.add(mesh(box(0.3, FH, UD + 0.2), section, { x: UW + 0.15, y: y0 + FH / 2 - SLAB / 2 }));
  }
  root.add(mesh(box(UW * 2 + 0.5, 0.3, UD + 0.4), concrete, { y: 3 * FH - SLAB / 2 + 0.03 }));
  root.add(mesh(box(UW * 2 + 0.5, 0.4, 0.2), concrete, { y: 3 * FH + 0.3, z: -UD / 2 }));

  // Furnish: [floor][unit] -> list of props
  const plan = [
    [["sofa", -0.6, -1.1], ["table", 1.0, 0.3], ["lamp", 1.4, -1.2]],
    [["bed", 0.6, -0.4], ["shelf", -1.2, -1.35]],
    [], // tenant flat: furnished separately
    [["table", 0.2, 0.1], ["shelf", 1.2, -1.35], ["lamp", -1.3, -1.1]],
    [], // bathroom above tenant: separate
    [["sofa", 0.3, -1.1], ["lamp", -1.3, -1.2], ["table", 0.4, 0.6]],
  ];
  plan.forEach((list, i) => list.forEach(([k, x, z]) => { const p = furniture(k, mat(palettes[i][1])); p.position.set(x, 0, z); units[i].add(p); }));

  // Tenant flat (floor 1, left): couch, man, TV glow
  const tenant = units[2];
  const sofaM = mat(C.mustard, { flat: false });
  const tSofa = furniture("sofa", sofaM);
  tSofa.position.set(-0.2, 0, -1.05);
  tenant.add(tSofa);
  tenant.add(mesh(box(0.9, 0.5, 0.06), glow(0x6f9cff, 1.3), { x: -0.2, y: 0.7, z: 1.4, cast: false }));
  let man = null;
  if (people) {
    man = person({ seated: true, shirt: 0x3d5a80, hair: 0x3a2a20, scale: 0.62 });
    man.position.set(-0.2, 0.0, -1.0);
    tenant.add(man);
  }
  const redRim = new THREE.PointLight(C.red, 0, 5, 1.5);
  redRim.position.set(0, 1.4, 1.0);
  tenant.add(redRim);
  // Red outline of the tenant flat
  const outlineM = glow(C.red, 2.2, { opacity: 0 });
  const ol = new THREE.Group();
  const T = 0.05;
  ol.add(mesh(box(UW, T, T), outlineM, { y: 0.02, z: UD / 2, cast: false }), mesh(box(UW, T, T), outlineM, { y: FH - SLAB, z: UD / 2, cast: false }),
    mesh(box(T, FH - SLAB, T), outlineM, { x: -UW / 2, y: (FH - SLAB) / 2, z: UD / 2, cast: false }), mesh(box(T, FH - SLAB, T), outlineM, { x: UW / 2, y: (FH - SLAB) / 2, z: UD / 2, cast: false }));
  tenant.add(ol);

  // Bathroom above (floor 2, left): tub, sink, pipe, spray, puddle
  const bath = units[4];
  bath.add(mesh(box(UW - 0.02, 0.03, UD), mat(0xdfe6ea, { rough: 0.5 }), { y: 0.02 }));
  for (let i = 0; i < 6; i++) bath.add(mesh(box(UW, 0.01, 0.01), mat(0xb9c4ca), { y: 0.3 + i * 0.35, z: -UD / 2 + 0.08, cast: false }));
  bath.add(mesh(rbox(1.7, 0.55, 0.8, 0.12), mat(0xf4f6f7, { flat: false, rough: 0.3 }), { x: -0.7, y: 0.28, z: -1.1 }));
  bath.add(mesh(rbox(0.5, 0.15, 0.35, 0.05), mat(0xf4f6f7, { flat: false }), { x: 1.1, y: 0.85, z: -1.35 }));
  bath.add(mesh(cyl(0.05, 0.05, 0.85, 8), mat(0xf4f6f7), { x: 1.1, y: 0.42, z: -1.4 }));
  const pipeM = mat(0xb87333, { metal: 0.7, rough: 0.35, flat: false });
  bath.add(mesh(cyl(0.045, 0.045, UW - 0.2, 10), pipeM, { y: 0.18, z: -1.5, rz: Math.PI / 2 }));
  bath.add(mesh(cyl(0.07, 0.07, 0.12, 10), pipeM, { x: -0.9, y: 0.18, z: -1.5, rz: Math.PI / 2 }));
  const valve = mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12), mat(C.red), { x: -1.35, y: 0.18, z: -1.38 });
  bath.add(valve);
  const spray = [];
  for (let i = 0; i < 26; i++) { const p = mesh(sph(0.035, 6, 6), glow(C.water, 1.5), { cast: false }); bath.add(p); spray.push(p); }
  const puddleM = glow(0x3aa0e0, 1.1, { opacity: 0.0, depthWrite: false });
  const puddle = mesh(new THREE.CircleGeometry(1, 32), puddleM, { x: -0.4, y: 0.045, z: -0.6, rx: -Math.PI / 2, cast: false });
  bath.add(puddle);
  // Wet patch on the tenant's ceiling (underside of the slab)
  const seepM = glow(0x2b6f9a, 1.0, { opacity: 0.0, depthWrite: false });
  const seep = mesh(new THREE.CircleGeometry(0.8, 28), seepM, { x: 0.2, y: FH - SLAB - 0.005, z: -0.6, rx: Math.PI / 2, cast: false });
  tenant.add(seep);
  const drips = [];
  for (let i = 0; i < 5; i++) { const d = mesh(sph(0.04, 8, 8), glow(C.water, 1.6), { s: [1, 1.4, 1], cast: false }); tenant.add(d); drips.push(d); }
  let neighbor = null;
  if (people) {
    neighbor = person({ shirt: 0x8e5a9e, pants: 0x2e2b3a, hairStyle: "bun", hair: 0x6b3b22, scale: 0.62 });
    neighbor.position.set(0.6, 0, 0.6);
    bath.add(neighbor);
  }

  // Stairwell on the left with doors to each flat
  const stair = new THREE.Group();
  stair.position.set(-UW - 1.1, 0, 0);
  stair.add(mesh(box(1.6, 3 * FH, 0.2), mat(0x3a3f48), { y: 1.5 * FH - 0.2, z: -UD / 2 }));
  for (let f = 0; f < 3; f++) {
    stair.add(mesh(box(1.6, SLAB, 1.4), section, { y: f * FH - SLAB / 2, z: 0.6 }));
    for (let k = 0; k < 9; k++) stair.add(mesh(box(1.4, 0.16, 0.26), concrete, { y: f * FH + 0.16 * k + 0.08, z: -0.9 + k * 0.0, x: -0.0 }));
    stair.add(mesh(box(0.06, 2.0, 0.9), mat(C.woodDark), { x: 0.8, y: f * FH + 1.0, z: 0.6 }));
    stair.add(mesh(sph(0.04, 8, 8), glow(0xfff1c9, 1.5), { x: 0.75, y: f * FH + 1.3, z: 1.15, cast: false }));
  }
  const stairLight = lights ? new THREE.PointLight(0xfff0d0, 0.8, 5, 1.6) : null;
  if (stairLight) { stairLight.position.set(0, 2 * FH + 2.0, 0.5); stair.add(stairLight); }
  root.add(stair);
  let visitor = null;
  if (people) {
    visitor = person({ shirt: 0x3d5a80, hair: 0x3a2a20, scale: 0.62 });
    visitor.position.set(-UW - 1.1, 2 * FH, 0.7);
    visitor.rotation.y = Math.PI / 2;
    root.add(visitor);
  }

  return {
    root, units, tenant, bath, man, neighbor, visitor, redRim, outlineM, valve, spray, puddle, puddleM, seep, seepM, drips, FH, UW, UD,
    doorPos: new THREE.Vector3(-UW - 0.3, 2 * FH + 1.3, 0.6),
    tenantCenter: new THREE.Vector3(-UW / 2, FH + 1.2, 0),
    bathCenter: new THREE.Vector3(-UW / 2, 2 * FH + 1.0, 0),
  };
}

export function animateLeak(B, t, { leak = 1, alarm = 0, sprayOn = 1 } = {}) {
  B.puddleM.opacity = 0.85 * leak;
  const pr = 0.3 + 0.9 * leak;
  B.puddle.scale.set(pr, pr, 1);
  B.seepM.opacity = 0.7 * leak;
  B.seep.scale.setScalar(0.4 + 0.7 * leak);
  B.spray.forEach((p, i) => {
    const ph = ((t * 1.3 + rand(i) ) % 1);
    p.visible = sprayOn > 0.02 && leak > 0.02;
    const a = -0.6 + rand(i + 5) * 1.2;
    p.position.set(-0.9 + Math.sin(a) * ph * 0.9, 0.18 + ph * 1.1 - ph * ph * 1.4, -1.45 + ph * 0.7 * Math.cos(a));
    p.scale.setScalar((1 - ph) * sprayOn);
  });
  B.drips.forEach((d, i) => {
    const ph = (t * 0.9 + i / B.drips.length) % 1;
    d.visible = leak > 0.1;
    d.position.set(0.2 + (rand(i) - 0.5) * 0.6, (B.FH - SLAB - 0.05) * (1 - ph * ph), -0.6 + (rand(i + 9) - 0.5) * 0.4);
  });
  B.redRim.intensity = alarm * (1.8 + 1.6 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4)));
  B.outlineM.opacity = alarm * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.4)));
}
