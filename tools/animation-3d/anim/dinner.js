// The owner's family dinner: warm pendant light, four people, a phone next to the plate.
import * as THREE from "three";
import { mat, glow, mesh, group } from "./engine.js";
import { C, rbox, box, cyl, sph, person, candle, plate, chair, phone, windowPane, plant, frame } from "./builders.js";

export function buildDinner() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080a);
  scene.add(mesh(box(8, 0.1, 7), mat(0x3b2a20, { rough: 0.85 }), { y: -0.05 }));
  scene.add(mesh(box(8, 3.2, 0.12), mat(0x2f4a4c, { rough: 0.95, flat: false }), { y: 1.6, z: -2.4 }));
  scene.add(mesh(box(0.12, 3.2, 7), mat(0x2a4244, { rough: 0.95, flat: false }), { x: -3.4, y: 1.6 }));
  scene.add(mesh(box(8, 0.9, 0.04), mat(0x26393b), { y: 0.45, z: -2.33 }));
  const win = windowPane(1.4, 1.5);
  win.position.set(1.6, 1.65, -2.32);
  scene.add(win);
  const fr = frame(0.9, 0.6, 0xc6943f); fr.position.set(-1.2, 1.85, -2.33); scene.add(fr);
  const pl = plant(); pl.position.set(-2.8, 0, -1.8); pl.scale.setScalar(1.3); scene.add(pl);
  scene.add(mesh(rbox(3.2, 0.02, 2.4, 0.01), mat(0x6b2f2f, { rough: 1 }), { y: 0.01, cast: false }));

  // Table and cloth
  const wood = mat(C.woodDark);
  scene.add(mesh(rbox(2.3, 0.07, 1.25, 0.02), wood, { y: 0.74 }));
  scene.add(mesh(rbox(2.36, 0.02, 1.31, 0.01), mat(0xf1ebe0, { rough: 1, flat: false }), { y: 0.785 }));
  for (const [x, z] of [[-1.0, -0.5], [1.0, -0.5], [-1.0, 0.5], [1.0, 0.5]]) scene.add(mesh(box(0.07, 0.72, 0.07), wood, { x, y: 0.36, z }));

  const people = {};
  const seat = (key, o, x, z, ry, s = 1) => {
    const ch = chair(0x5a3a28);
    ch.position.set(x - Math.sin(ry) * 0.12 * s, 0, z - Math.cos(ry) * 0.12 * s);
    ch.rotation.y = ry;
    ch.scale.setScalar(s === 1 ? 1 : 0.95);
    scene.add(ch);
    const p = person({ seated: true, ...o, scale: s });
    p.position.set(x, s === 1 ? 0.0 : 0.12, z);
    p.rotation.y = ry;
    p.userData.arms.forEach((a) => a.rotation.set(-1.15, 0, a.rotation.z));
    scene.add(p);
    people[key] = p;
  };
  seat("dad", { shirt: 0x4f7a5a, pants: 0x2b2d42, hair: 0x2a2420, mouth: "smile" }, 1.55, 0.0, -Math.PI / 2);
  seat("mom", { shirt: 0xb5573b, pants: 0x2b2d42, hair: 0x5a3420, hairStyle: "long", mouth: "smile" }, -1.55, 0.0, Math.PI / 2);
  seat("kid1", { shirt: 0xd8a63a, hair: 0x6b4a2a, mouth: "smile" }, -0.45, -0.95, 0, 0.72);
  seat("kid2", { shirt: 0x5c7fb8, hair: 0x2a2420, hairStyle: "bun", mouth: "smile" }, 0.45, -0.95, 0, 0.72);

  // Place settings
  const settings = [[0.85, 0.0], [-0.85, 0.0], [-0.45, -0.38], [0.45, -0.38]];
  settings.forEach(([x, z], i) => {
    const p = plate([0xd9a441, 0xb5573b, 0xd9a441, 0x9c6b3a][i]);
    p.position.set(x, 0.8, z);
    scene.add(p);
    scene.add(mesh(cyl(0.045, 0.04, 0.16, 12, true), mat(0xcfe3ea, { opacity: 0.45, flat: false, rough: 0.1, side: THREE.DoubleSide }), { x: x + (x > 0 ? -0.05 : 0.05) + 0.12, y: 0.875, z: z + 0.28, cast: false }));
  });
  scene.add(mesh(cyl(0.22, 0.14, 0.12, 20), mat(0xf4efe6, { flat: false }), { y: 0.86, z: 0.2 }));
  for (let i = 0; i < 9; i++) scene.add(mesh(new THREE.IcosahedronGeometry(0.07, 0), mat(i % 2 ? 0x5c9c46 : 0x7cb860), { x: Math.cos(i) * 0.1, y: 0.93, z: 0.2 + Math.sin(i) * 0.1, ry: i }));
  scene.add(mesh(rbox(0.36, 0.12, 0.18, 0.06), mat(0xc58a4a), { x: -0.3, y: 0.86, z: 0.38 }));
  const candles = [candle(), candle()];
  candles[0].position.set(-0.15, 0.79, -0.1);
  candles[1].position.set(0.1, 0.79, -0.15);
  candles.forEach((c) => scene.add(c));

  // Phone next to dad's plate, screen up
  const ph = phone();
  ph.position.set(0.88, 0.805, 0.42);
  ph.rotation.set(-Math.PI / 2, 0, -0.25);
  ph.scale.setScalar(0.42);
  scene.add(ph);
  const finger = group(
    mesh(new THREE.CapsuleGeometry(0.03, 0.14, 4, 10), mat(C.skin, { flat: false, rough: 0.7 }), { y: 0.07 }),
    mesh(new THREE.CapsuleGeometry(0.07, 0.12, 4, 12), mat(C.skin, { flat: false, rough: 0.7 }), { y: 0.25, z: 0.02 }),
    mesh(new THREE.CapsuleGeometry(0.075, 0.25, 4, 12), mat(0x4f7a5a, { flat: false }), { y: 0.5, z: 0.04 }),
  );
  finger.visible = false;
  finger.scale.setScalar(0.6);
  scene.add(finger);

  // Lights
  const pend = group(mesh(cyl(0.005, 0.005, 1.0, 6), mat(0x111111), { y: 2.75 }), mesh(cyl(0.12, 0.4, 0.3, 24, true), mat(0x1c2a2c, { side: THREE.DoubleSide }), { y: 2.1 }));
  pend.add(mesh(sph(0.09, 12, 10), glow(0xffd29a, 2.4), { y: 2.0, cast: false }));
  scene.add(pend);
  const spot = new THREE.SpotLight(0xffc98f, 7, 8, 0.85, 0.6, 1.4);
  spot.position.set(0, 2.0, 0);
  spot.target.position.set(0, 0.8, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0008;
  scene.add(spot, spot.target);
  const hemi = new THREE.HemisphereLight(0x5a6a80, 0x2a1d14, 0.95);
  scene.add(hemi);
  const candleLight = new THREE.PointLight(0xffa850, 1.0, 3, 1.5);
  candleLight.position.set(0, 1.15, -0.1);
  scene.add(candleLight);
  const phoneLight = new THREE.PointLight(0xffffff, 0, 2.0, 1.6);
  phoneLight.position.set(0.88, 1.0, 0.42);
  scene.add(phoneLight);

  return { scene, people, phone: ph, finger, spot, hemi, candleLight, phoneLight };
}

// Phone screen UI (360x760 canvas).
export function drawPhone(P, state, k = 0, time = 0) {
  const g = P.userData.ui.g, Wc = 360, Hc = 760;
  g.save();
  g.clearRect(0, 0, Wc, Hc);
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  if (state === "call") {
    const grd = g.createLinearGradient(0, 0, 0, Hc);
    grd.addColorStop(0, "#3a0d10"); grd.addColorStop(1, "#120607");
    g.fillStyle = grd; g.fillRect(0, 0, Wc, Hc);
    g.fillStyle = "#fff"; g.textAlign = "center";
    g.font = "600 22px Inter"; g.globalAlpha = 0.7; g.fillText("eingehender Anruf", Wc / 2, 150);
    g.globalAlpha = 1; g.font = "800 40px Inter"; g.fillText("Mieter", Wc / 2, 205);
    g.font = "500 22px Inter"; g.globalAlpha = 0.75; g.fillText("Hauptstr. 12 · 1. OG", Wc / 2, 240);
    for (let i = 0; i < 3; i++) {
      const ph = (time * 1.4 + i / 3) % 1;
      g.globalAlpha = (1 - ph) * 0.6; g.strokeStyle = "#ff5a4f"; g.lineWidth = 4;
      g.beginPath(); g.arc(Wc / 2, 400, 50 + ph * 90, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1; g.fillStyle = "#ff3b30"; g.beginPath(); g.arc(Wc / 2, 400, 52, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "800 44px Inter"; g.fillText("!", Wc / 2, 416);
    g.fillStyle = "#ff3b30"; g.beginPath(); g.arc(90, 640, 40, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#34c759"; g.beginPath(); g.arc(270, 640, 40, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.font = "700 20px Inter"; g.fillText("3 verpasst", Wc / 2, 560);
  } else if (state === "approve") {
    g.fillStyle = "#0e1512"; g.fillRect(0, 0, Wc, Hc);
    g.fillStyle = "#4fc39a"; g.beginPath(); g.arc(46, 70, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.textAlign = "left"; g.font = "800 28px Inter"; g.fillText("ecoraum", 64, 80);
    g.fillStyle = "#1a2420"; rr(20, 130, 320, 440, 26); g.fill();
    g.fillStyle = "#ff6b5f"; g.font = "800 18px Inter"; g.fillText("FREIGABE NÖTIG", 44, 178);
    g.fillStyle = "#fff"; g.font = "800 28px Inter"; g.fillText("Wasserschaden", 44, 222);
    g.font = "500 20px Inter"; g.fillStyle = "#b9c7c1"; g.fillText("Hauptstr. 12 · 1. OG", 44, 254);
    const rows = [["Handwerker", "Installateur Kaya"], ["Termin", "Do · 10:00"], ["Kosten", "ca. 180 €"]];
    rows.forEach(([a, b], i) => {
      g.fillStyle = "#7f938b"; g.font = "600 17px Inter"; g.fillText(a.toUpperCase(), 44, 304 + i * 66);
      g.fillStyle = "#fff"; g.font = "700 24px Inter"; g.fillText(b, 44, 334 + i * 66);
    });
    const pressed = k > 0 && k < 0.35, done = k >= 0.35;
    g.fillStyle = done ? "#2e8a68" : pressed ? "#3aa47e" : "#4fc39a";
    rr(44, 480 + (pressed ? 3 : 0), 272, 64, 32); g.fill();
    g.fillStyle = "#0b1410"; g.textAlign = "center"; g.font = "800 26px Inter";
    g.fillText(done ? "Freigegeben" : "Freigeben", Wc / 2 + (done ? 14 : 0), 521 + (pressed ? 3 : 0));
    if (done) {
      g.strokeStyle = "#0b1410"; g.lineWidth = 5; g.lineCap = "round";
      g.beginPath(); g.moveTo(98, 512); g.lineTo(108, 522); g.lineTo(126, 502); g.stroke();
    }
  } else {
    g.fillStyle = "#050607"; g.fillRect(0, 0, Wc, Hc);
  }
  g.restore();
  P.userData.ui.tex.needsUpdate = true;
}
