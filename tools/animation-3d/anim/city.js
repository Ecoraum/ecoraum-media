// Night street with the cut-open apartment block in the middle.
import * as THREE from "three";
import { mat, glow, mesh, rand } from "./engine.js";
import { box } from "./builders.js";
import { buildBuilding } from "./building.js";

export function buildCity() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070a12);
  scene.fog = new THREE.FogExp2(0x070a12, 0.028);
  scene.add(mesh(new THREE.PlaneGeometry(120, 120), mat(0x10141c, { rough: 1 }), { rx: -Math.PI / 2, y: -0.25, cast: false }));
  scene.add(mesh(box(30, 0.05, 3), mat(0x1a1f29), { y: -0.22, z: 3.4, cast: false }));

  // Background blocks with a few lit windows
  for (let i = 0; i < 14; i++) {
    const w = 3 + rand(i) * 4, h = 6 + rand(i + 3) * 14, x = -26 + i * 4 + rand(i + 7) * 2, z = -9 - rand(i + 11) * 10;
    if (Math.abs(x) < 6 && z > -12) continue;
    const b = mesh(box(w, h, 3), mat(0x121722, { rough: 1 }), { x, y: h / 2 - 0.25, z, cast: false });
    scene.add(b);
    for (let k = 0; k < 10; k++) {
      if (rand(i * 31 + k) > 0.45) continue;
      scene.add(mesh(box(0.5, 0.6, 0.02), glow(rand(k + i) > 0.5 ? 0xffc27a : 0xa8c8ff, 0.9), { x: x - w / 2 + 0.6 + rand(i + k * 3) * (w - 1.2), y: 1 + rand(i * 7 + k) * (h - 2), z: z + 1.51, cast: false }));
    }
  }

  const B = buildBuilding({ lights: true, people: true });
  scene.add(B.root);

  const moon = new THREE.DirectionalLight(0x9db6ff, 0.9);
  moon.position.set(6, 14, 10);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 12, bottom: -3, near: 1, far: 40 });
  moon.shadow.bias = -0.0008;
  scene.add(moon);
  scene.add(new THREE.HemisphereLight(0x3a4a70, 0x0a0c10, 0.6));
  const street = new THREE.PointLight(0xffb870, 3, 12, 1.6);
  street.position.set(5.5, 4, 4);
  scene.add(street);
  scene.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), mat(0x2a2d33), { x: 5.5, y: 1.85, z: 4 }));
  scene.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), glow(0xffc27a, 2.5), { x: 5.5, y: 4.0, z: 4, cast: false }));
  return { scene, B };
}
