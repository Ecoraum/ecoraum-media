// Rendering core: WebGL renderer, bloom, a 2D compositor on top, and small math helpers.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export const W = 1080, H = 1920;

// ---------- math ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  in: (t) => t * t * t,
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  sine: (t) => 0.5 - 0.5 * Math.cos(Math.PI * t),
};
export const tw = (t, a, b, e = ease.inOut) => e(seg(t, a, b));
export const pulse = (t, hz = 1) => 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * hz);
// Deterministic pseudo random from an integer seed.
export const rand = (seed) => { const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const mixV = (a, b, t) => a.clone().lerp(b, t);

// ---------- renderer ----------
export const gl = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
gl.setPixelRatio(1);
gl.setSize(W, H);
gl.shadowMap.enabled = true;
gl.shadowMap.type = THREE.PCFSoftShadowMap;
gl.toneMapping = THREE.ACESFilmicToneMapping;
gl.toneMappingExposure = 1.0;
gl.outputColorSpace = THREE.SRGBColorSpace;

const composer = new EffectComposer(gl);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.9, 0.55, 0.82);
composer.addPass(renderPass);
composer.addPass(bloom);
composer.addPass(new OutputPass());

export function render3d(scene, camera, { bloomStrength = 0.9, bloomThreshold = 0.82, exposure = 1.0 } = {}) {
  gl.toneMappingExposure = exposure;
  renderPass.scene = scene;
  renderPass.camera = camera;
  bloom.strength = bloomStrength;
  bloom.threshold = bloomThreshold;
  composer.render();
  return gl.domElement;
}

// ---------- 2D compositor ----------
export const out = document.createElement("canvas");
out.width = W; out.height = H;
export const ctx = out.getContext("2d");
// Extra canvas for split screens / blurred backgrounds.
export const scratch = document.createElement("canvas");
scratch.width = W; scratch.height = H;
export const sctx = scratch.getContext("2d");

const grainTiles = [];
for (let k = 0; k < 6; k++) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand(i * 0.37 + k * 9973) * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTiles.push(c);
}

export function grain(frame, amount = 0.06) {
  const tile = grainTiles[frame % grainTiles.length];
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = "overlay";
  const pat = ctx.createPattern(tile, "repeat");
  ctx.translate(Math.floor(rand(frame) * 256), Math.floor(rand(frame + 7) * 256));
  ctx.fillStyle = pat;
  ctx.fillRect(-256, -256, W + 512, H + 512);
  ctx.restore();
}

export function vignette(strength = 0.55, color = "0,0,0") {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function fill(color, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// Project a world point to compositor pixels.
export function toScreen(p, camera) {
  const v = p.clone().project(camera);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
}

// ---------- materials & meshes ----------
const matCache = new Map();
export function mat(color, o = {}) {
  const key = JSON.stringify([color, o]);
  if (!o.unique && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: o.rough ?? 0.85, metalness: o.metal ?? 0.0, flatShading: o.flat ?? true,
    emissive: o.emissive ?? 0x000000, emissiveIntensity: o.ei ?? 1, transparent: o.opacity !== undefined, opacity: o.opacity ?? 1,
    side: o.side ?? THREE.FrontSide, depthWrite: o.depthWrite ?? true,
  });
  if (!o.unique) matCache.set(key, m);
  return m;
}
export function glow(color, intensity = 2.5, o = {}) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), transparent: o.opacity !== undefined, opacity: o.opacity ?? 1, toneMapped: false, depthWrite: o.depthWrite ?? true, side: o.side ?? THREE.FrontSide });
}
export function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  if (typeof s === "number") m.scale.setScalar(s); else m.scale.set(...s);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}
export function group(...children) {
  const g = new THREE.Group();
  children.forEach((c) => c && g.add(c));
  return g;
}

export function canvasTexture(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { canvas: c, g: c.getContext("2d"), tex };
}

export function camera(fov = 40) {
  return new THREE.PerspectiveCamera(fov, W / H, 0.05, 200);
}
export function aim(cam, pos, target, roll = 0) {
  cam.position.copy(pos);
  cam.up.set(Math.sin(roll), Math.cos(roll), 0);
  cam.lookAt(target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
}
