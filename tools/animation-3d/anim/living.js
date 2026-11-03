// The tenant's living room at night: couch, TV glow, floor lamp, and a ceiling that leaks.
import * as THREE from "three";
import { mat, glow, mesh, group, rand, clamp, canvasTexture } from "./engine.js";
import { C, rbox, box, cyl, sph, person, couch, floorLamp, plant, frame, windowPane, tv, bucket, fuseBox, ladder, waterDrop } from "./builders.js";

export function buildLiving() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080b);
  const CEIL = 2.8;

  // Shell
  const wallM = mat(0xc4b8a4, { flat: false, rough: 0.95 });
  const wallSide = mat(0xbfae93, { flat: false, rough: 0.95 });
  scene.add(mesh(box(6.4, 0.12, 4.8), mat(0x6b4a35, { rough: 0.8 }), { y: -0.06 }));
  for (let i = 0; i < 12; i++) scene.add(mesh(box(0.012, 0.005, 4.8), mat(0x553a2a), { x: -3 + i * 0.52, y: 0.003, cast: false }));
  scene.add(mesh(box(6.4, CEIL, 0.12), wallM, { y: CEIL / 2, z: -2.26 }));
  scene.add(mesh(box(0.12, CEIL, 4.8), wallSide, { x: -3.2, y: CEIL / 2 }));
  scene.add(mesh(box(0.12, CEIL, 4.8), wallSide, { x: 3.2, y: CEIL / 2 }));
  const ceilM = mat(0xe4dccd, { flat: false, rough: 1 });
  scene.add(mesh(box(6.4, 0.14, 4.8), ceilM, { y: CEIL + 0.07 }));
  scene.add(mesh(box(6.4, 0.1, 0.06), mat(0xf2ede4), { y: 0.05, z: -2.18 }));

  // Rug, couch, man
  scene.add(mesh(rbox(3.0, 0.02, 1.9, 0.01), mat(0x8c3b3b, { rough: 1 }), { y: 0.01, z: -0.35, cast: false }));
  scene.add(mesh(rbox(2.4, 0.015, 1.4, 0.01), mat(0xa65049, { rough: 1 }), { y: 0.022, z: -0.35, cast: false }));
  const sofa = couch(C.mustard);
  sofa.position.set(0, 0, -1.6);
  scene.add(sofa);
  const man = person({ seated: true, shirt: 0x3d5a80, pants: 0x2b2d42, hair: 0x3a2a20, hairStyle: "short" });
  man.position.set(0.25, 0.0, -1.55);
  scene.add(man);
  // Phone in hand (right arm rests forward)
  man.userData.arms[1].rotation.set(-0.9, 0, 0.1);

  // Lamp, TV, decor
  const lamp = floorLamp();
  lamp.position.set(-1.75, 0, -1.75);
  scene.add(lamp);
  const telly = tv();
  telly.position.set(0.25, 0, 2.05);
  telly.rotation.y = Math.PI;
  scene.add(telly);
  const win = windowPane(1.3, 1.45);
  win.position.set(2.0, 1.55, -2.19);
  scene.add(win);
  const f1 = frame(0.62, 0.46, C.terracotta); f1.position.set(-0.45, 1.85, -2.19); scene.add(f1);
  const f2 = frame(0.4, 0.56, C.teal); f2.position.set(0.35, 1.9, -2.19); scene.add(f2);
  const pl = plant(); pl.position.set(2.65, 0, -1.65); scene.add(pl);
  const side = group(mesh(cyl(0.26, 0.26, 0.04, 20), mat(C.woodDark), { y: 0.55 }), mesh(cyl(0.03, 0.03, 0.55, 8), mat(0x222222), { y: 0.27 }), mesh(cyl(0.05, 0.045, 0.1, 12), mat(0xe9e2d2, { flat: false }), { y: 0.62, x: 0.08 }));
  side.position.set(1.62, 0, -1.65);
  scene.add(side);

  // Pendant lamp near the leak and a wall socket below it (danger props)
  const pendant = group(
    mesh(cyl(0.006, 0.006, 0.6, 6), mat(0x111111), { y: -0.3 }),
    mesh(cyl(0.08, 0.26, 0.22, 20, true), mat(0x1f2328, { side: THREE.DoubleSide }), { y: -0.7 }),
  );
  const bulbM = glow(0xffd28a, 2.2);
  const bulb = mesh(sph(0.07, 12, 10), bulbM, { y: -0.78, cast: false });
  pendant.add(bulb);
  pendant.position.set(1.05, CEIL, -1.25);
  scene.add(pendant);
  const socket = group(mesh(rbox(0.16, 0.16, 0.03, 0.02), mat(0xf6f4ef)), mesh(cyl(0.05, 0.05, 0.02, 16), mat(0xe2ded6), { z: 0.02, rx: Math.PI / 2 }));
  socket.position.set(1.25, 0.35, -2.19);
  scene.add(socket);

  // Fuse box on the left wall (hallway side)
  const fuse = fuseBox();
  fuse.position.set(-3.12, 1.45, 1.1);
  fuse.rotation.y = Math.PI / 2;
  scene.add(fuse);

  // Bucket (slides in later), ladder (handyman scene)
  const pail = bucket();
  pail.position.set(0.25, 0, -0.6);
  pail.visible = false;
  scene.add(pail);
  const lad = ladder();
  lad.position.set(0.9, 0, -0.9);
  lad.visible = false;
  scene.add(lad);
  const worker = person({ shirt: 0x2f6db5, pants: 0x264a7a, hairStyle: "cap", capColor: 0x2f6db5, mouth: "smile" });
  worker.visible = false;
  scene.add(worker);
  const wrench = mesh(box(0.05, 0.3, 0.03), mat(0xb8bcc2, { metal: 0.6, rough: 0.4 }), { y: -0.6 });
  worker.userData.arms[1].add(wrench);
  const manStand = person({ shirt: 0x3d5a80, pants: 0x2b2d42, hair: 0x3a2a20, hairStyle: "short" });
  manStand.visible = false;
  scene.add(manStand);
  const sparks = [];
  for (let i = 0; i < 18; i++) { const sp = mesh(sph(0.016, 6, 6), glow(0xffd76a, 3.0), { cast: false }); sp.visible = false; scene.add(sp); sparks.push(sp); }
  const sparkLight = new THREE.PointLight(0xffd76a, 0, 3, 1.5);
  scene.add(sparkLight);

  // Ceiling leak: stain layers, drops, splash particles
  const stainX = 0.25, stainZ = -1.42;
  // Damp patch: soft irregular blotch with tide lines, drawn once into a texture.
  const st = canvasTexture(512, 512);
  {
    const g = st.g;
    g.clearRect(0, 0, 512, 512);
    const blob = (r, wob, seed) => {
      g.beginPath();
      for (let k = 0; k <= 64; k++) {
        const a2 = (k / 64) * Math.PI * 2;
        const rr = r * (1 + wob * (0.5 * Math.sin(a2 * 3 + seed) + 0.3 * Math.sin(a2 * 5 + seed * 2) + 0.2 * Math.sin(a2 * 9 + seed * 3)));
        const x = 256 + Math.cos(a2) * rr, y = 256 + Math.sin(a2) * rr;
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
    };
    g.filter = "blur(10px)";
    blob(200, 0.18, 1); g.fillStyle = "rgba(120,98,70,0.55)"; g.fill();
    g.filter = "blur(6px)";
    blob(150, 0.22, 2); g.fillStyle = "rgba(96,76,52,0.6)"; g.fill();
    g.filter = "none";
    for (const [r, sd] of [[205, 1], [165, 2], [118, 4]]) { blob(r, 0.2, sd); g.strokeStyle = "rgba(80,60,40,0.55)"; g.lineWidth = 3; g.stroke(); }
    g.filter = "blur(4px)";
    blob(70, 0.25, 5); g.fillStyle = "rgba(70,58,46,0.75)"; g.fill();
    g.filter = "none";
    st.tex.needsUpdate = true;
  }
  const stainM = new THREE.MeshStandardMaterial({ map: st.tex, transparent: true, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const stain = mesh(new THREE.PlaneGeometry(2, 2), stainM, { x: stainX, y: CEIL - 0.004, z: stainZ, rx: Math.PI / 2, cast: false });
  const stainLayers = [stain];
  scene.add(stain);

  const drops = [];
  for (let i = 0; i < 6; i++) {
    const d = waterDrop();
    d.visible = false;
    scene.add(d);
    drops.push(d);
  }
  const splash = [];
  for (let i = 0; i < 14; i++) {
    const p = mesh(sph(0.018, 6, 6), glow(C.water, 1.8), { cast: false });
    p.visible = false;
    scene.add(p);
    splash.push(p);
  }

  // Lights
  const hemi = new THREE.HemisphereLight(0x3a4a6a, 0x1a1410, 0.55);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0x8fb0ff, 0.5);
  moon.position.set(4, 4, -6);
  scene.add(moon);
  const fill = new THREE.PointLight(0xd9c2a6, 0.7, 9, 1.2);
  fill.position.set(0.5, 2.2, 0.8);
  scene.add(fill);
  const hall = new THREE.PointLight(0xdfe8ff, 1.4, 4.5, 1.5);
  hall.position.set(-2.3, 2.3, 1.2);
  scene.add(hall);
  const torch = new THREE.SpotLight(0xfff4e0, 0, 7, 0.42, 0.55, 1.2);
  scene.add(torch, torch.target);
  const alarm = new THREE.PointLight(C.red, 0, 6, 1.4);
  alarm.position.set(stainX, CEIL - 0.4, stainZ + 0.4);
  scene.add(alarm);

  return {
    scene, CEIL, man, manStand, sparks, sparkLight, lamp, telly, pendant, bulb, bulbM, socket, fuse, pail, lad, worker, stain, stainLayers, drops, splash,
    hemi, moon, fill, alarm, hall, torch, stainPos: new THREE.Vector3(stainX, CEIL, stainZ),
    setStain(r) { const k = Math.max(1e-3, r); stain.scale.set(k, k, 1); },
    // Power: 1 = lights on, 0 = fuse out.
    setPower(p) {
      lamp.userData.light.intensity = 4.0 * p;
      telly.userData.light.intensity = 2.5 * p;
      telly.userData.scr.color.setHex(0x6f9cff).multiplyScalar(1.4 * p + 0.02);
      bulbM.color.setHex(0xffd28a).multiplyScalar(2.2 * p + 0.05);
      fill.intensity = 0.7 * p;
    },
  };
}

// Falling drop: returns position at time tau after release (slowed gravity).
export function dropAt(L, tau, from, to, dur) {
  const k = clamp(tau / dur);
  return new THREE.Vector3(from.x, from.y - (from.y - to.y) * k * k, from.z);
}

export function setSplash(L, origin, tau) {
  L.splash.forEach((p, i) => {
    if (tau < 0 || tau > 0.6) { p.visible = false; return; }
    p.visible = true;
    const a = rand(i + 3) * Math.PI * 2, sp = 0.7 + rand(i + 11) * 0.9, up = 1.0 + rand(i + 21) * 1.2;
    p.position.set(origin.x + Math.cos(a) * sp * tau, origin.y + up * tau - 4.5 * tau * tau, origin.z + Math.sin(a) * sp * tau);
    p.scale.setScalar(1 - tau / 0.6);
  });
}
