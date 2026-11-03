import * as THREE from "three";
import { W, H, ctx, out, scratch, sctx, render3d, grain, vignette, fill, camera, aim, toScreen, v3, mixV, tw, seg, ease, lerp, clamp, pulse, rand } from "./engine.js";
import { buildLiving, setSplash } from "./living.js";
import { buildCity } from "./city.js";
import { animateLeak } from "./building.js";
import { buildDinner, drawPhone } from "./dinner.js";
import { buildBoard, setPacket, setTube, hidePackets, POS } from "./board.js";
import { text, title, tag, measure, rrect, phoneFrame, chat, stamp, gauge, badge, notification, logo, iconCheck, iconWarn, iconText, iconCamera, iconMic, iconPin, iconHome } from "./ui.js";

const FPS = 30;
const L = buildLiving();
const CITY = buildCity();
const B = CITY.B;
const D = buildDinner();
const BD = buildBoard();
const cam = camera(42);

const draw = (scene, o = {}) => ctx.drawImage(render3d(scene, cam, o), 0, 0);
const look = (pos, tgt, fov = 42, roll = 0) => { cam.fov = fov; aim(cam, pos, tgt, roll); };

// ======================= state resets =======================
function resetLiving(t) {
  L.setPower(1);
  L.man.visible = true;
  L.manStand.visible = false;
  L.manStand.userData.arms.forEach((a) => a.rotation.set(0, 0, a.rotation.z));
  L.manStand.userData.setFace("line");
  L.pail.visible = false;
  L.lad.visible = false;
  L.worker.visible = false;
  L.drops.forEach((d) => (d.visible = false));
  L.splash.forEach((p) => (p.visible = false));
  L.sparks.forEach((p) => (p.visible = false));
  L.sparkLight.intensity = 0;
  L.alarm.intensity = 0;
  L.torch.intensity = 0;
  L.moon.intensity = 0.5;
  L.hemi.intensity = 0.55;
  L.setStain(0.35);
  const u = L.man.userData;
  u.head.rotation.set(0, 0, 0);
  u.eyes.position.y = 0;
  u.brows.position.y = 0;
  u.body.position.y = 0;
  u.setFace("line");
  L.telly.userData.light.intensity = 2.2 + 0.8 * Math.sin(t * 13) * Math.sin(t * 7.3);
  L.fuse.userData.target.userData.lever.position.y = 0.04;
}
// Periodic drips from the stain to a landing height.
function drips(t, from, landY, n = 3, period = 1.1, offs = [[0, 0], [0.1, 0.06], [-0.08, 0.1]]) {
  for (let i = 0; i < n; i++) {
    const d = L.drops[2 + i];
    const ph = ((t + i * period / n) % period) / period;
    const fall = clamp((ph - 0.55) / 0.45);
    d.visible = true;
    const [ox, oz] = offs[i % offs.length];
    if (fall <= 0) {
      const g = ph / 0.55;
      d.position.set(from.x + ox, from.y - 0.04 - 0.03 * g, from.z + oz);
      d.scale.set(0.5 + 0.5 * g, 0.5 + 0.9 * g, 0.5 + 0.5 * g);
    } else {
      d.position.set(from.x + ox, from.y - 0.08 - (from.y - 0.08 - landY) * fall * fall, from.z + oz);
      d.scale.set(0.9, 1.6, 0.9);
    }
  }
}

function resetDinner(t) {
  const P = D.people;
  Object.values(P).forEach((p) => { p.visible = true; p.userData.head.rotation.set(0, 0, 0); p.userData.setFace("smile"); p.userData.brows.position.y = 0; p.userData.body.position.y = 0; });
  D.phone.position.set(0.88, 0.805, 0.42);
  D.phone.rotation.set(-Math.PI / 2, 0, -0.25);
  D.finger.visible = false;
  D.phoneLight.intensity = 0;
  D.candleLight.intensity = 0.9 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3);
  drawPhone(D.phone, "off");
}

function resetBoard(t) {
  hidePackets(BD);
  Object.values(BD.blocks).forEach((b) => { b.g.position.y = 0; b.rimM.opacity = 0; b.rimM.color.setHex(b.accent).multiplyScalar(1.6); b.light.intensity = 0; b.light.color.setHex(b.accent); });
  ["t1", "t2", "t3", "t4"].forEach((k) => setTube(BD, k, 0x2a3140, 0));
  BD.core.rotation.set(t * 0.6, t * 0.9, 0);
  BD.coreRing.rotation.set(Math.PI / 2 + 0.3 * Math.sin(t), 0, t);
  BD.coreM.color.setHex(0x4fc39a).multiplyScalar(2.0);
  BD.teamLight.intensity = 0;
  BD.team.forEach((p) => p.userData.arms.forEach((a) => a.rotation.set(-1.0, 0, a.rotation.z)));
  BD.workers.forEach((w) => (w.position.y = 0));
  BD.pickBeamM.opacity = 0;
  BD.miniVan.visible = false;
  animateLeak(BD.B, t, { leak: 0, alarm: 0 });
}
function tenantAlarm(t, a) {
  const b = BD.blocks.tenant;
  b.rimM.opacity = a * (0.5 + 0.5 * pulse(t, 1.4));
  b.light.intensity = a * (2.5 + 2.5 * pulse(t, 1.4));
  animateLeak(BD.B, t, { leak: 0, alarm: a });
}
function boardOverview(t, lt) {
  const ang = 0.12 * Math.sin(t * 0.15);
  look(v3(-0.45 + Math.sin(ang) * 8.4, 8.3, Math.cos(ang) * 7.9 - 0.4), v3(-0.22, 0.1, -0.45), 41);
}
function boardLabels(a, o = {}) {
  const items = [
    ["owner", "EIGENTÜMER", "das bist du", -1],
    ["trade", "HANDWERKER", "geprüfte Betriebe", -1],
    ["eco", "ECORAUM", "KI + Team", -1],
    ["tenant", "MIETER", "Hauptstr. 12", -1],
  ];
  items.forEach(([k, l, sub]) => {
    const top = POS[k].clone(); top.y = k === "eco" ? 2.25 : k === "tenant" ? 2.35 : 1.75;
    const s = toScreen(top, cam);
    tag(l, sub, s.x, s.y, a * (o[k] ?? 1), { dir: -46, color: k === "eco" ? "#7fe0bd" : "#ffffff" });
  });
}
function packetBadge(pos, a, draw) {
  if (!pos || a <= 0) return;
  const s = toScreen(pos, cam);
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(10,12,16,0.85)"; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(s.x, s.y - 70, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = a; draw(s.x, s.y - 70); ctx.restore();
}

// ======================= overlays =======================
function rain(t, a = 0.35) {
  ctx.save();
  ctx.globalAlpha = a; ctx.strokeStyle = "#9fb4d8"; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 140; i++) {
    const x = (rand(i) * 1.3 * W + t * 260 * (0.8 + rand(i + 1) * 0.4)) % (W * 1.2) - 60;
    const y = (rand(i + 50) * H + t * 1700 * (0.8 + rand(i + 2) * 0.5)) % (H + 200) - 100;
    ctx.moveTo(x, y); ctx.lineTo(x - 10, y - 46);
  }
  ctx.stroke();
  ctx.restore();
}
function rings(x, y, lt, color = "255,255,255", n = 3, max = 160) {
  for (let i = 0; i < n; i++) {
    const ph = lt * 1.2 - i * 0.25;
    if (ph < 0 || ph > 1) continue;
    ctx.save(); ctx.globalAlpha = (1 - ph) * 0.9; ctx.strokeStyle = `rgb(${color})`; ctx.lineWidth = 6 * (1 - ph) + 1;
    ctx.beginPath(); ctx.arc(x, y, 20 + ph * max, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}
function burst(x, y, lt, color = "#4fc39a") {
  if (lt < 0 || lt > 0.8) return;
  const k = ease.out(lt / 0.8);
  ctx.save();
  ctx.globalAlpha = 1 - k; ctx.strokeStyle = color; ctx.lineWidth = 8 * (1 - k) + 2;
  ctx.beginPath(); ctx.arc(x, y, 30 + 140 * k, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * (40 + 170 * k), y + Math.sin(a) * (40 + 170 * k), 7 * (1 - k) + 1, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function checklist(t, items, y = 250) {
  const x0 = 140, w = 800;
  ctx.save(); ctx.fillStyle = "rgba(8,10,14,0.72)"; rrect(x0, y - 50, w, 100, 50); ctx.fill(); ctx.restore();
  items.forEach(([label, doneAt], i) => {
    const cx = x0 + 70 + i * 262, done = t >= doneAt;
    const k = ease.back(clamp((t - doneAt) / 0.3));
    ctx.save();
    ctx.strokeStyle = done ? "#4fc39a" : "rgba(255,255,255,0.5)"; ctx.lineWidth = 4;
    ctx.fillStyle = done ? "rgba(79,195,154,0.25)" : "transparent";
    ctx.beginPath(); ctx.arc(cx, y, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (done) { ctx.save(); ctx.translate(cx, y); ctx.scale(k, k); iconCheck(0, 0, 34, "#4fc39a"); ctx.restore(); }
    text(label, cx + 38, y + 10, { size: 28, weight: 700, align: "left", alpha: done ? 1 : 0.65, color: done ? "#d9f5ea" : "#fff" });
  });
}
function bubbleFloat(str, side, x, y, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.font = "500 34px Inter";
  const w = ctx.measureText(str).width + 52, h = 78;
  const bx = side === "out" ? x - w : x;
  const s = 0.7 + 0.3 * ease.back(clamp(a));
  ctx.translate(bx + (side === "out" ? w : 0), y + h); ctx.scale(s, s); ctx.translate(-(bx + (side === "out" ? w : 0)), -(y + h));
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 30;
  ctx.fillStyle = side === "out" ? "#1d6b52" : "#222a2f";
  rrect(bx, y, w, h, 32); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.fillText(str, bx + 26, y + 51);
  ctx.restore();
}
function glitch(frame, amount) {
  if (amount <= 0) return;
  sctx.drawImage(out, 0, 0);
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  const n = 22;
  for (let i = 0; i < n; i++) {
    const y = Math.floor(rand(frame * 13 + i) * H), h = 20 + Math.floor(rand(frame * 7 + i) * 120);
    const dx = (rand(frame * 3 + i) - 0.5) * 220 * amount;
    ctx.drawImage(scratch, 0, y, W, h, dx, y, W, h);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5 * amount;
  ctx.filter = "hue-rotate(160deg)";
  ctx.drawImage(scratch, 18 * amount, 0);
  ctx.restore();
  ctx.globalAlpha = 1;
  for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,255,255,${0.12 * amount})`; ctx.fillRect(0, rand(frame + i * 9) * H, W, 3); }
}
function caseCard(cx, cy, s, a, o = {}) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.scale(s, s); ctx.rotate(o.rot ?? -0.03);
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 50;
  ctx.fillStyle = "#e9dfc9"; rrect(-300, -230, 230, 70, 18); ctx.fill();
  ctx.fillStyle = "#f3ecdc"; rrect(-300, -190, 600, 400, 26); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#6b5a44"; ctx.font = "800 26px Inter"; ctx.textAlign = "left"; ctx.letterSpacing = "4px";
  ctx.fillText("FALL", -270, -200); ctx.letterSpacing = "0px";
  ctx.fillStyle = "#1a1a1a"; ctx.font = "900 76px InterDisplay"; ctx.fillText("F-17", -260, -86);
  ctx.font = "700 30px Inter"; ctx.fillText("Wasserschaden", -260, -30);
  ctx.fillStyle = "#5c5c5c"; ctx.font = "500 26px Inter";
  ctx.fillText("Hauptstr. 12 · 1. OG links", -260, 14);
  ctx.fillText("Wohnzimmer, über dem Sofa · seit 21:45", -260, 54);
  ctx.fillText("2 Fotos · Strom aus · Eimer steht", -260, 94);
  ctx.fillStyle = o.urgent === false ? "#2e8a68" : "#ff3b30"; rrect(-260, 128, 190, 46, 23); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "800 22px Inter"; ctx.textAlign = "center"; ctx.fillText(o.urgent === false ? "ERLEDIGT" : "DRINGEND", -165, 159);
  ctx.restore();
}

// ======================= shots =======================
function sHookWide(lt, t) {
  resetLiving(t);
  const CEIL = L.CEIL, u = L.man.userData;
  L.setStain(lerp(0.3, 0.42, tw(lt, 0, 2.2, ease.out)));
  const d0 = L.drops[0], release = 0.95, hit = 1.5, hitY = 1.9;
  d0.visible = lt < hit + 0.02;
  if (lt < release) {
    const g = ease.out(seg(lt, 0, release));
    d0.position.set(L.stainPos.x, CEIL - 0.04 - 0.04 * g, L.stainPos.z);
    d0.scale.set(0.5 + 0.5 * g, 0.5 + 1.0 * g, 0.5 + 0.5 * g);
  } else {
    const k = seg(lt, release, hit);
    d0.position.set(L.stainPos.x, CEIL - 0.09 - (CEIL - 0.09 - hitY) * k * k, L.stainPos.z);
    d0.scale.set(0.85, 1.5 + 0.6 * k, 0.85);
  }
  setSplash(L, v3(L.stainPos.x, hitY, L.stainPos.z), lt - hit);
  const fl = Math.sin(clamp((lt - hit) / 0.22) * Math.PI);
  const up = tw(lt, 1.72, 2.1, ease.out);
  u.head.rotation.set(0.16 * fl - 0.5 * up, 0.1 * Math.sin(t * 0.8) * (1 - up), 0);
  u.body.position.y = -0.03 * fl;
  u.setFace(lt > hit + 0.05 ? "o" : "line");
  u.brows.position.y = lt > hit + 0.05 ? 0.05 : 0;
  u.eyes.position.y = 0.04 * up;
  const push = tw(lt, 0, 2.15, ease.sine);
  look(mixV(v3(1.55, 1.42, 3.4), v3(1.15, 1.5, 2.55), push), mixV(v3(0.15, 1.5, -1.5), v3(0.2, 1.62, -1.5), push), 44, 0.012 * Math.sin(t));
  draw(L.scene, { bloomStrength: 0.7, exposure: 1.0 });
  const a = tw(lt, 0.05, 0.4);
  text("SONNTAG", W / 2, 1585, { size: 28, weight: 700, spacing: 12, alpha: 0.75 * a });
  text(`22${Math.floor(t * 2) % 2 ? ":" : " "}04`, W / 2, 1655, { size: 70, weight: 900, family: "InterDisplay", spacing: 4, alpha: a });
}

function sHookUp(lt, t) {
  resetLiving(t);
  const u = L.man.userData;
  L.setStain(lerp(0.45, 0.6, tw(lt, 0, 0.9)));
  u.head.rotation.set(-0.62, 0, 0);
  u.setFace("o"); u.brows.position.y = 0.06; u.eyes.position.y = 0.05;
  drips(t, L.stainPos, 1.9, 3, 0.8, [[0.14, 0.12], [-0.12, 0.05], [0.04, -0.12]]);
  L.alarm.intensity = 0.5 + 0.5 * pulse(t, 1.6);
  look(mixV(v3(0.95, 0.95, 1.0), v3(0.85, 1.0, 0.75), lt / 0.9), v3(0.25, 2.05, -1.5), 50, 0.03);
  draw(L.scene, { bloomStrength: 0.65 });
  fill("#ff1e1e", 0.04 * pulse(t, 1.6));
}

function sBuilding(lt, t) {
  CITY.B.man.visible = true;
  CITY.B.valve.rotation.z = 0;
  CITY.B.neighbor.userData.arms.forEach((a) => a.rotation.set(0, 0, a.rotation.z));
  CITY.B.neighbor.userData.setFace("line");
  CITY.B.man.userData.head.rotation.set(-0.5, 0, 0);
  CITY.B.man.userData.setFace("o");
  CITY.B.visitor.visible = false;
  CITY.B.neighbor.position.set(0.6, 0, 0.6);
  CITY.B.neighbor.rotation.y = -0.3;
  animateLeak(B, t, { leak: lerp(0.6, 1, tw(lt, 0, 2.2)), alarm: tw(lt, 0.2, 0.8), sprayOn: 1 });
  const k = tw(lt, 0, 2.3, ease.sine);
  look(mixV(v3(4.8, 5.2, 16.5), v3(3.4, 4.7, 13.2), k), v3(-1.0, 4.1, 0), 40);
  draw(CITY.scene, { bloomStrength: 0.8, exposure: 1.05 });
  rain(t, 0.22);
  const s1 = toScreen(B.tenantCenter.clone().add(v3(0.9, 0.6, 1.6)), cam);
  const s2 = toScreen(B.bathCenter.clone().add(v3(0.9, 0.7, 1.6)), cam);
  tag("ROHRBRUCH", "2. OG · Nachbar", s2.x, s2.y, tw(lt, 0.5, 0.8), { dir: -50, color: "#9fdcff" });
  tag("DEIN MIETER", "1. OG links", s1.x, s1.y + 40, tw(lt, 0.25, 0.55), { dir: 120, color: "#ff8a80", dot: "#ff3b30" });
}

function sDinnerOld(lt, t, frame) {
  resetDinner(t);
  const P = D.people;
  drawPhone(D.phone, "call", 0, t);
  const buzz = Math.sin(t * 90) * 0.012 * (Math.sin(t * 6) > -0.2 ? 1 : 0);
  D.phone.position.x = 0.88 + buzz;
  D.phone.rotation.z = -0.25 + buzz * 4;
  D.phoneLight.color.setHex(0xff5a4f);
  D.phoneLight.intensity = 0.4 + 0.4 * pulse(t, 2);
  P.dad.userData.setFace("o"); P.dad.userData.brows.position.y = 0.04;
  P.dad.userData.head.rotation.set(0.45, 0.35, 0);
  P.mom.userData.setFace("line"); P.mom.userData.head.rotation.set(0.1, -0.25, 0);
  P.kid1.userData.setFace("o"); P.kid1.userData.head.rotation.set(0.1, 0.6, 0);
  P.kid2.userData.setFace("line"); P.kid2.userData.head.rotation.set(0.15, 0.3, 0);
  const k = tw(lt, 0, 2.6, ease.sine);
  const shake = 0.02 * Math.sin(t * 40) * pulse(t, 2);
  look(mixV(v3(4.3, 3.4, 4.1), v3(3.7, 3.0, 3.4), k).add(v3(shake, 0, 0)), v3(0.25, 0.95, 0.0), 40);
  ctx.save();
  ctx.filter = "sepia(0.55) saturate(0.55) contrast(1.1) brightness(0.92)";
  draw(D.scene, { bloomStrength: 0.45, bloomThreshold: 0.9 });
  ctx.restore();
  const ps = toScreen(v3(0.88, 0.86, 0.42), cam);
  rings(ps.x, ps.y, (t * 1.2) % 1, "255,90,79", 3, 120);
  notification("Mieter", "Hilfe!! Wasser kommt durch die Decke", 70, 330, 940, tw(lt, 0.55, 0.75, ease.out), { time: "22:04" });
  notification("Mieter", "Bitte sofort zurückrufen!!", 70, 470, 940, tw(lt, 1.15, 1.35, ease.out), { time: "22:05" });
  notification("3 verpasste Anrufe", "Mieter · Hauptstr. 12", 70, 610, 940, tw(lt, 1.7, 1.9, ease.out), { time: "22:06", glyph: "3" });
  stamp("FRÜHER", W / 2, 1600, lt - 0.15, { color: "#e8d9b0", size: 70, rot: -0.06 });
}

function sDinnerNew(lt, t, frame, opt = {}) {
  resetDinner(t);
  const tap = opt.tap ?? 0.75;
  D.people.dad.visible = false;
  D.people.kid1.visible = false;
  D.people.kid2.visible = false;
  D.phone.rotation.set(-Math.PI / 2, 0, 0);
  const prog = lt < tap ? 0 : lt < tap + 0.12 ? 0.2 : 1;
  drawPhone(D.phone, "approve", prog, t);
  D.phoneLight.color.setHex(prog >= 1 ? 0x4fc39a : 0xffffff);
  D.phoneLight.intensity = 0.0;
  const btn = v3(0.88, 0.815, 0.42 + 0.051);
  const fin = D.finger;
  fin.visible = lt > tap - 0.55 && lt < tap + 0.7;
  const approach = ease.inOut(seg(lt, tap - 0.55, tap)), leave = ease.inOut(seg(lt, tap + 0.15, tap + 0.7));
  const far = v3(1.02, 1.05, 0.95);
  fin.position.copy(mixV(mixV(far, btn, approach), far, leave));
  fin.rotation.set(0.75, 0, 0.15);
  const z = tw(lt, 0, 1.9, ease.sine);
  cam.up.set(0, 0, -1);
  cam.fov = 38;
  cam.position.copy(mixV(v3(0.9, 1.62, 0.78), v3(0.89, 1.48, 0.7), z));
  cam.lookAt(v3(0.885, 0.8, 0.4));
  cam.updateProjectionMatrix();
  draw(D.scene, { bloomStrength: 0.45, bloomThreshold: 0.9, exposure: 0.95 });
  const bs = toScreen(btn, cam);
  burst(bs.x, bs.y, lt - tap - 0.1);
  if (opt.titleAt !== undefined) title([[["Ein Tipp.", "#ffffff"]], [["Das war's.", "#4fc39a"]]], W / 2, 330, lt, { in: opt.titleAt, size: 96 });
  if (opt.label) text(opt.label, W / 2, 205, { size: 30, weight: 800, spacing: 8, alpha: tw(lt, 0.1, 0.4) * 0.85 });
}

function sBoardIntro(lt, t) {
  resetBoard(t);
  const order = [["owner", 0.05], ["trade", 0.2], ["eco", 0.35], ["tenant", 0.5]];
  order.forEach(([k, s0]) => { BD.blocks[k].g.position.y = lerp(-1.4, 0, ease.back(seg(lt, s0, s0 + 0.5))); });
  const alarmA = tw(lt, 1.2, 1.6);
  tenantAlarm(t, alarmA);
  setTube(BD, "t1", 0xff3b30, 0.25 * alarmA);
  // Messages: text, photo, voice
  const sends = [[14.42, 0xffffff, iconText], [15.24, 0xffffff, iconCamera], [16.34, 0xffffff, iconMic]];
  sends.forEach(([t0, col, icon], i) => {
    const k = seg(t, t0, t0 + 1.0);
    const pos = setPacket(BD, i, "t1", ease.inOut(k), 0xff6b5f, 1);
    packetBadge(pos, 0, () => {});
    if (k > 0 && k < 1) setTube(BD, "t1", 0xff3b30, 0.8);
  });
  // Instant reply (green, fast, back to the tenant)
  const rk = seg(t, 18.23, 18.68);
  setPacket(BD, 3, "t1", 1 - ease.inOut(rk), 0x4fc39a, 1.2);
  if (rk > 0 && rk < 1) setTube(BD, "t1", 0x4fc39a, 1);
  const arrive = Math.max(...sends.map(([t0]) => 1 - clamp(Math.abs(t - (t0 + 1.0)) / 0.25)));
  BD.coreM.color.setHex(0x4fc39a).multiplyScalar(2.0 + 2.5 * arrive);
  BD.blocks.eco.light.intensity = 0.5 + 2.5 * arrive;
  BD.blocks.eco.rimM.opacity = 0.12 + 0.4 * arrive;
  // Camera: descend, then push into Ecoraum during "KI-Assistenten"
  const desc = tw(lt, 0, 1.2, ease.out);
  const push = tw(t, 19.5, 20.6, ease.inOut);
  const base = v3(-0.45, lerp(12.5, 8.3, desc), lerp(11, 7.5, desc));
  const close = v3(2.3, 4.7, 4.8);
  look(mixV(base, close, push), mixV(v3(-0.22, 0.1, -0.45), v3(0, 0.8, -0.6), push), lerp(41, 38, push));
  // Team reveal
  const tm = tw(t, 21.47, 21.9);
  BD.teamLight.intensity = 3.2 * tm;
  BD.team.forEach((p, i) => { const wave = t > 21.8 ? Math.sin((t - 21.8) * 9 + i) : 0; p.userData.arms[1].rotation.set(-1.0 - 1.6 * tm, 0, 0.3 * wave); p.userData.head.rotation.y = 0.3 * tm * (i ? -1 : 1); });
  BD.core.rotation.y = t * (0.9 + 3 * tw(t, 19.75, 20.5));
  draw(BD.scene, { bloomStrength: 0.85, bloomThreshold: 0.86 });
  // Overlays
  const la = tw(lt, 0.7, 1.1) * (1 - push);
  boardLabels(la);
  sends.forEach(([t0, , icon], i) => {
    const k = seg(t, t0, t0 + 1.0);
    if (k > 0 && k < 1) packetBadge(BD.curvePoint ? null : BD.packets[i].head.position, 1, (x, y) => icon(x, y, 40, "#ffffff"));
  });
  if (rk > 0 && rk < 1) packetBadge(BD.packets[3].head.position, 1, (x, y) => iconCheck(x, y, 40));
  const ts = toScreen(POS.tenant.clone().add(v3(0, 2.5, 0)), cam);
  badge("Antwort in Sekunden", ts.x + 30, ts.y - 150, tw(t, 18.7, 19.0) * (1 - tw(t, 19.6, 19.9)), { icon: iconCheck, iconColor: "#4fc39a", border: "rgba(79,195,154,0.6)" });
  const ai = toScreen(v3(POS.eco.x, 1.55, POS.eco.z), cam);
  tag("KI-ASSISTENT", "antwortet sofort, rund um die Uhr", ai.x, ai.y - 40, tw(t, 20.1, 20.5), { dir: -150, color: "#7fe0bd" });
  const tmS = toScreen(v3(POS.eco.x, 0.85, POS.eco.z - 0.3), cam);
  tag("UNSER TEAM", "prüft, entscheidet, organisiert", tmS.x, tmS.y + 60, tw(t, 21.9, 22.3), { dir: 190 });
}

function sSafetyWide(lt, t) {
  resetLiving(t);
  const u = L.man.userData;
  L.setStain(0.62);
  u.head.rotation.set(-0.45, 0, 0); u.setFace("o"); u.brows.position.y = 0.04;
  drips(t, L.stainPos, 1.95, 3, 0.9);
  L.alarm.intensity = 1.6 + 1.2 * pulse(t, 1.4);
  look(mixV(v3(2.6, 1.8, 3.6), v3(2.2, 1.75, 3.0), tw(lt, 0, 2)), v3(0.1, 1.45, -1.3), 44);
  draw(L.scene, { bloomStrength: 0.7 });
  fill("#ff1e1e", 0.06 * pulse(t, 1.4));
  const a = tw(t, 24.18, 24.5);
  ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, 1380); ctx.scale(0.8 + 0.2 * ease.back(a), 0.8 + 0.2 * ease.back(a)); iconWarn(0, 0, 150); ctx.restore();
  title([[["SICHERHEIT", "#ffffff"]], [["ZUERST.", "#ff5a4f"]]], W / 2, 1560, t - 24.18, { size: 104 });
}

function sDanger(lt, t) {
  resetLiving(t);
  L.setStain(0.75);
  L.man.visible = false;
  // Drops falling onto the pendant shade, sparks at lamp and socket
  for (let i = 0; i < 2; i++) {
    const d = L.drops[2 + i];
    const ph = ((t + i * 0.45) % 0.9) / 0.9;
    d.visible = true;
    d.position.set(1.0 + i * 0.08, L.CEIL - 0.06 - (L.CEIL - 2.12) * ph * ph, -1.25 + i * 0.05);
    d.scale.set(0.9, 1.5, 0.9);
  }
  const sparkAt = (origin, t0, base) => {
    const lt2 = t - t0;
    for (let i = 0; i < 9; i++) {
      const p = L.sparks[base + i];
      const ph = ((lt2 * 1.6 + rand(i + base) * 0.6) % 0.6) / 0.6;
      p.visible = lt2 > 0;
      const a = rand(i * 3 + base) * Math.PI * 2;
      p.position.set(origin.x + Math.cos(a) * 0.35 * ph, origin.y + 0.25 * ph - 0.6 * ph * ph, origin.z + Math.sin(a) * 0.35 * ph + 0.05);
      p.scale.setScalar(1.2 * (1 - ph));
    }
  };
  sparkAt(v3(1.05, 2.0, -1.25), 27.05, 0);
  sparkAt(v3(1.25, 0.35, -2.15), 27.69, 9);
  const fl = (t > 27.05 ? 1 : 0) * (0.5 + 0.5 * Math.sin(t * 47) * Math.sin(t * 23));
  L.sparkLight.position.set(1.15, 1.2, -1.6);
  L.sparkLight.intensity = 3 * fl;
  L.bulbM.color.setHex(0xffd28a).multiplyScalar(t > 27.05 ? 0.3 + 2.2 * (Math.sin(t * 31) > 0 ? 1 : 0.1) : 2.2);
  L.alarm.intensity = 1.2 + 1.0 * pulse(t, 1.4);
  const k = tw(lt, 0, 2.8, ease.sine);
  look(mixV(v3(2.75, 1.25, 1.1), v3(2.45, 1.3, 0.75), k), v3(1.12, 1.15, -1.7), 50);
  draw(L.scene, { bloomStrength: 0.95, bloomThreshold: 0.75 });
  const lampS = toScreen(v3(1.05, 2.0, -1.25), cam), sockS = toScreen(v3(1.25, 0.35, -2.15), cam);
  tag("LAMPE", "Wasser + Strom", lampS.x, lampS.y, tw(t, 27.05, 27.3), { dir: -110, color: "#ffd76a", dot: "#ffd76a" });
  tag("STECKDOSE", "Kurzschluss-Gefahr", sockS.x, sockS.y, tw(t, 27.69, 27.95), { dir: 150, color: "#ffd76a", dot: "#ffd76a" });
}

function sFuse(lt, t) {
  resetLiving(t);
  const flip = tw(t, 28.85, 29.05, ease.out);
  const lever = L.fuse.userData.target.userData.lever;
  lever.position.y = lerp(0.04, -0.045, flip);
  const off = t > 29.08;
  L.setPower(off ? 0 : 1);
  L.alarm.intensity = off ? 0 : 1.0;
  look(mixV(v3(-0.45, 1.62, 1.75), v3(-0.75, 1.58, 1.55), tw(lt, 0, 1.2)), v3(-3.1, 1.42, 1.1), 34);
  draw(L.scene, { bloomStrength: 0.7, exposure: off ? 0.75 : 1.0 });
  if (off) fill("#000", 0.25);
  const ls = toScreen(v3(-3.0, 1.45, 1.1 + 0.06), cam);
  tag("SICHERUNG", off ? "aus" : "", ls.x, ls.y, tw(t, 28.6, 28.85), { dir: -260, color: "#ff8a80", dot: "#ff3b30" });
  checklist(t, [["Strom aus", 29.1], ["Eimer", 32.25], ["Nachbar", 35.75]]);
  burst(W / 2, H / 2, t - 29.08, "#ffffff");
}

function sBucket(lt, t) {
  resetLiving(t);
  L.setPower(0);
  L.setStain(0.8);
  L.man.visible = false;
  L.manStand.visible = true;
  L.manStand.position.set(-0.75, 0, -0.75);
  L.manStand.rotation.y = 0.85;
  L.manStand.userData.arms[0].rotation.set(-0.9 * tw(t, 31.4, 31.75), 0, -0.12);
  L.manStand.userData.arms[1].rotation.set(-1.35, 0, 0.1);
  L.moon.intensity = 1.1;
  L.hemi.intensity = 0.8;
  L.torch.intensity = 6;
  L.torch.position.set(-0.45, 1.25, -0.5);
  L.torch.target.position.set(0.25, 0.6, -1.45);
  L.pail.visible = true;
  const slide = tw(t, 31.6, 32.15, ease.out);
  L.pail.position.set(lerp(0.95, 0.25, slide), lerp(0.0, 0.5, slide) + 0.12 * Math.sin(slide * Math.PI), lerp(-0.85, -1.42, slide));
  const landY = slide >= 1 ? 0.62 : 0.5;
  drips(t, L.stainPos, landY, 3, 0.85, [[0, 0], [0.06, 0.04], [-0.05, -0.03]]);
  look(mixV(v3(1.85, 1.35, 1.55), v3(1.6, 1.3, 1.2), tw(lt, 0, 3.3)), v3(0.35, 0.95, -1.35), 46);
  draw(L.scene, { bloomStrength: 0.8, exposure: 0.95 });
  checklist(t, [["Strom aus", 29.1], ["Eimer", 32.25], ["Nachbar", 35.75]]);
}

function sNeighbor(lt, t) {
  const Bn = CITY.B;
  Bn.man.visible = false;
  Bn.visitor.visible = true;
  Bn.visitor.position.set(-Bn.UW - 1.0, 2 * Bn.FH, 0.75);
  Bn.visitor.rotation.y = Math.PI / 2;
  Bn.visitor.userData.arms[1].rotation.set(t > 33.95 && t < 34.4 ? -1.4 : -0.1, 0, 0.1);
  const nb = Bn.neighbor;
  const turn = tw(t, 34.2, 34.45), walk = tw(t, 34.45, 35.25, ease.inOut);
  nb.position.set(lerp(0.6, -0.45, walk), 0, lerp(0.6, -0.85, walk));
  nb.rotation.y = lerp(-0.3, -2.4, turn) + lerp(0, -0.6, walk);
  nb.userData.body.position.y = 0.03 * Math.abs(Math.sin(walk * Math.PI * 4));
  nb.userData.setFace(t > 35.2 ? "o" : "line");
  const fix = tw(t, 35.3, 35.8);
  Bn.valve.rotation.z = fix * Math.PI * 1.5;
  nb.userData.arms.forEach((a) => a.rotation.set(-1.2 * tw(t, 35.15, 35.35), 0, a.rotation.z));
  animateLeak(Bn, t, { leak: 1, alarm: 0.6, sprayOn: 1 - fix });
  const k = tw(lt, 0, 3.4, ease.sine);
  look(mixV(v3(-2.0, 7.2, 11.6), v3(-2.4, 7.1, 10.4), k), v3(-3.1, 6.55, 0), 42);
  draw(CITY.scene, { bloomStrength: 0.85 });
  rain(t, 0.16);
  const ds = toScreen(Bn.doorPos, cam);
  if (t > 34.0) rings(ds.x, ds.y, t - 34.0, "255,214,120", 3, 110);
  if (t > 34.0 && t < 34.9) text("DING  DONG", ds.x + 30, ds.y - 130, { size: 30, weight: 900, spacing: 6, color: "#ffd678", alpha: tw(t, 34.0, 34.15) * (1 - tw(t, 34.7, 34.9)) });
  const ls = toScreen(v3(-Bn.UW / 2 - 1.35, 2 * Bn.FH + 0.25, -1.4), cam);
  tag("LECK GEFUNDEN", "Ventil zu", ls.x, ls.y, tw(t, 35.75, 36.0), { dir: -190, color: "#7fe0bd", dot: "#4fc39a" });
  checklist(t, [["Strom aus", 29.1], ["Eimer", 32.25], ["Nachbar", 35.75]]);
}

let chatBg = null;
function chatBackground(t) {
  if (!chatBg) {
    resetLiving(0);
    L.setPower(0.35);
    L.setStain(0.8);
    look(v3(2.2, 1.75, 3.0), v3(0.1, 1.45, -1.3), 44);
    const c3 = render3d(L.scene, cam, { bloomStrength: 0.6 });
    chatBg = document.createElement("canvas");
    chatBg.width = W; chatBg.height = H;
    const g = chatBg.getContext("2d");
    g.filter = "blur(18px) brightness(0.45) saturate(0.8)";
    g.drawImage(c3, -40, -40, W + 80, H + 80);
  }
  const z = 1 + 0.04 * Math.sin(t * 0.2);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.drawImage(chatBg, -W / 2, -H / 2); ctx.restore();
}

const CHAT = [
  { side: "in", kind: "text", text: "Danke! Wo genau tropft es?", t0: 37.3 },
  { side: "out", kind: "text", text: "Im Wohnzimmer, direkt über dem Sofa.", t0: 38.5 },
  { side: "out", kind: "photo", t0: 39.0 },
  { side: "in", kind: "text", text: "Seit wann ungefähr?", t0: 40.25 },
  { side: "out", kind: "text", text: "Seit ca. 21:45.", t0: 41.45 },
  { side: "in", kind: "ghost", text: "Wie lautet Ihre Adresse?", t0: 42.35, strike: 43.0, until: 43.65 },
  { side: "in", kind: "chips", t0: 44.2, gap: 0.98, items: [{ icon: "pin", text: "Hauptstr. 12" }, { icon: "home", text: "1. OG links" }] },
  { side: "in", kind: "typing", t0: 47.55, until: 48.25 },
  { side: "in", kind: "summary", t0: 48.3, rows: [50.28, 51.52, 52.1, 53.78], button: 54.3 },
  { side: "out", kind: "text", text: "Passt, bitte weitergeben!", t0: 55.88 },
];

function sChat(lt, t) {
  chatBackground(t);
  const rise = ease.out(seg(t, 36.4, 36.95));
  const leave = ease.in(seg(t, 56.75, 57.35));
  const px = 165, pw = 750, ph = 1400;
  const py = 335 + (1 - rise) * 900 + leave * 1500;
  ctx.save();
  const f = phoneFrame(px, py, pw, ph, { status: t > 47.5 && t < 48.3 ? "schreibt …" : "online" });
  chat(f.body, CHAT.filter((m) => !(m.kind === "typing" && t > m.until)), t);
  ctx.restore();
  ctx.restore();
  // Header chips above the phone
  badge("1 Frage pro Nachricht", W / 2, 270, tw(t, 41.26, 41.55) * (1 - tw(t, 46.6, 46.9)), { border: "rgba(79,195,154,0.7)", color: "#d9f5ea" });
  if (t > 43.0 && t < 43.7) badge("nichts doppelt", W / 2, 270 + 84, tw(t, 43.0, 43.15) * (1 - tw(t, 43.5, 43.7)), { bg: "rgba(255,59,48,0.9)", border: "rgba(255,255,255,0.0)" });
  // Case card: summary becomes a case
  const ck = ease.out(seg(t, 56.9, 57.4));
  caseCard(W / 2, lerp(1300, 900, ck), lerp(0.6, 1.05, ck), ck);
  if (t > 58.18) stamp("FALL ERSTELLT", W / 2 + 40, 1240, t - 58.18, { color: "#4fc39a", size: 54, rot: -0.1 });
}

function sBoardCase(lt, t) {
  resetBoard(t);
  tenantAlarm(t, 1);
  setTube(BD, "t1", 0xff3b30, 0.35);
  // Case drops into Ecoraum
  const drop = seg(t, 59.0, 59.55);
  const p = BD.packets[0];
  if (drop > 0 && drop < 1) {
    p.head.visible = true;
    p.head.position.set(POS.eco.x, lerp(5.5, 1.7, ease.in(drop)), POS.eco.z);
    p.m.color.setHex(0xff5a4f).multiplyScalar(2.2);
    p.head.scale.setScalar(1.6);
  }
  const hit = 1 - clamp(Math.abs(t - 59.55) / 0.3);
  const urgent = tw(t, 62.96, 63.4) * 0.6 + tw(t, 64.33, 64.6) * 0.4;
  BD.blocks.eco.light.color.setHex(urgent > 0.55 ? 0xff3b30 : 0x4fc39a);
  BD.blocks.eco.light.intensity = 2 + 4 * hit + (urgent > 0.55 ? 3 * pulse(t, 2.2) : 0);
  BD.blocks.eco.rimM.opacity = 0.15 + 0.5 * hit;
  BD.coreM.color.setHex(urgent > 0.55 ? 0xff5a4f : 0x4fc39a).multiplyScalar(2.2 + 2 * hit);
  BD.teamLight.intensity = 3.0;
  BD.team.forEach((pp, i) => { pp.userData.head.rotation.set(0.2, (i ? -0.4 : 0.4), 0); pp.userData.arms[1].rotation.set(-1.4, 0, 0); });
  // Trades selection
  const scan = seg(t, 65.75, 66.55);
  BD.pickBeamM.opacity = t > 65.6 ? 0.35 * (1 - tw(t, 69.6, 70.0)) : 0;
  BD.pickBeam.position.x = t < 66.55 ? -0.45 + 0.9 * Math.sin(scan * Math.PI * 1.25) * (scan < 0.8 ? 1 : 1) : 0;
  if (t > 66.55) BD.pickBeam.position.x = 0;
  BD.workers[1].position.y = 0.08 * Math.max(0, Math.sin(clamp((t - 66.6) / 0.35) * Math.PI));
  if (t > 66.55) { BD.blocks.trade.rimM.opacity = 0.8; BD.blocks.trade.light.intensity = 3; }
  // Appointment ping-pong with the tenant
  const a1 = seg(t, 67.6, 68.45), a2 = seg(t, 68.9, 69.7);
  const q1 = setPacket(BD, 1, "t1", 1 - ease.inOut(a1), 0xffffff, 1.1);
  const q2 = setPacket(BD, 2, "t1", ease.inOut(a2), 0x4fc39a, 1.1);
  if (a1 > 0 && a1 < 1) setTube(BD, "t1", 0xffffff, 0.7);
  if (a2 > 0 && a2 < 1) setTube(BD, "t1", 0x4fc39a, 0.9);
  // Camera path: overview -> Ecoraum close -> trades -> overview
  const over = () => { const a = 0.12 * Math.sin(t * 0.15); return [v3(-0.45 + Math.sin(a) * 8.4, 8.3, Math.cos(a) * 7.9 - 0.4), v3(-0.22, 0.1, -0.45)]; };
  const ecoC = [v3(2.4, 3.9, 3.6), v3(0, 0.9, -0.5)];
  const trC = [v3(2.9, 3.1, -0.4), v3(1.15, 0.6, -3.2)];
  const [o0, o1] = over();
  let pos, tgt;
  const k1 = tw(t, 59.4, 60.6), k2 = tw(t, 65.2, 65.9), k3 = tw(t, 67.2, 68.0);
  pos = mixV(mixV(mixV(o0, ecoC[0], k1), trC[0], k2), o0, k3);
  tgt = mixV(mixV(mixV(o1, ecoC[1], k1), trC[1], k2), o1, k3);
  look(pos, tgt, 40);
  draw(BD.scene, { bloomStrength: 0.85, bloomThreshold: 0.86 });
  if (urgent > 0.55) fill("#ff1e1e", 0.07 * pulse(t, 2.2));
  boardLabels(k3 * (1 - tw(t, 69.8, 70.1)) + (1 - k1) * (t < 60 ? 1 : 0));
  // Overlays
  const es = toScreen(v3(POS.eco.x, 1.8, POS.eco.z), cam);
  burst(es.x, es.y, t - 59.55, "#ff5a4f");
  badge("F-17 · Wasserschaden", W / 2, 300, tw(t, 59.6, 59.9) * (1 - tw(t, 62.2, 62.5)), { bg: "rgba(255,59,48,0.92)", border: "rgba(0,0,0,0)" });
  const gv = t < 62.96 ? 0.15 : t < 64.33 ? lerp(0.15, 0.58, ease.out(seg(t, 62.96, 63.4))) : lerp(0.58, 0.93, ease.elastic(seg(t, 64.33, 65.0)));
  gauge(W / 2, 470, 150, gv, tw(t, 62.46, 62.75) * (1 - tw(t, 65.2, 65.5)), t);
  const ws = toScreen(v3(POS.trade.x, 1.2, POS.trade.z + 0.38), cam);
  tag("INSTALLATEUR", "frei: Do · 10:00", ws.x, ws.y, tw(t, 66.7, 67.0) * (1 - tw(t, 67.4, 67.7)), { dir: 260, color: "#9cc4ff", dot: "#6aa8ff" });
  if (q1) packetBadge(q1, 1, (x, y) => { text("Do", x, y - 2, { size: 22, weight: 900, shadow: false }); text("10:00", x, y + 22, { size: 18, weight: 700, shadow: false }); });
  if (q2) packetBadge(q2, 1, (x, y) => iconCheck(x, y, 40));
}

function sBoardApprove(lt, t, phase) {
  resetBoard(t);
  tenantAlarm(t, 1);
  BD.blocks.trade.rimM.opacity = 0.5;
  if (phase === 1) {
    const k = seg(t, 70.25, 71.15);
    const q = setPacket(BD, 0, "t2", ease.inOut(k), 0xffc46b, 1.3);
    if (k > 0 && k < 1) setTube(BD, "t2", 0xffc46b, 1);
    const hit = 1 - clamp(Math.abs(t - 71.15) / 0.25);
    BD.blocks.owner.rimM.opacity = 0.4 + 0.6 * hit;
    BD.blocks.owner.light.intensity = 2 + 4 * hit;
    const kk = tw(t, 70.1, 71.2);
    look(mixV(v3(-0.6, 7.2, 6.2), v3(-1.9, 3.5, 0.3), kk), mixV(v3(-0.4, 0.2, -1.6), v3(-1.15, 0.7, -3.2), kk), 40);
    draw(BD.scene, { bloomStrength: 0.85, bloomThreshold: 0.86 });
    if (q) packetBadge(q, 1, (x, y) => text("?", x, y + 14, { size: 42, weight: 900, color: "#ffc46b", shadow: false }));
    text("NUR NOCH EINS:", W / 2, 260, { size: 32, weight: 800, spacing: 8, alpha: tw(t, 70.3, 70.6) });
    title([[["Deine Freigabe.", "#ffc46b"]]], W / 2, 360, t - 70.45, { size: 86 });
  } else {
    BD.blocks.owner.rimM.opacity = 0.9;
    BD.blocks.owner.rimM.color.setHex(0x4fc39a).multiplyScalar(1.6);
    const k = seg(t, 73.95, 74.55);
    const q = setPacket(BD, 0, "t3", ease.inOut(k), 0x4fc39a, 1.3);
    if (t > 73.95) setTube(BD, "t3", 0x4fc39a, 1);
    const hit = 1 - clamp(Math.abs(t - 74.55) / 0.25);
    BD.blocks.trade.rimM.opacity = 0.5 + 0.5 * hit;
    BD.blocks.trade.light.intensity = 2 + 4 * hit;
    // Van drives to the tenant
    const vk = ease.inOut(seg(t, 74.6, 75.75));
    if (vk > 0) {
      BD.miniVan.visible = true;
      const curve = BD.tubes.t4.userData.curve;
      const p = curve.getPointAt(clamp(0.08 + 0.84 * vk));
      const tan = curve.getTangentAt(clamp(0.08 + 0.84 * vk));
      BD.miniVan.position.set(p.x, 0.02, p.z);
      BD.miniVan.rotation.y = Math.atan2(-tan.z, tan.x);
      setTube(BD, "t4", 0x6aa8ff, 0.8);
    }
    boardOverview(t, lt);
    draw(BD.scene, { bloomStrength: 0.85, bloomThreshold: 0.86 });
    boardLabels(0.85);
    if (q) packetBadge(q, 1, (x, y) => iconCheck(x, y, 40));
    badge("Freigegeben", W / 2, 300, tw(t, 73.9, 74.2) * (1 - tw(t, 75.4, 75.7)), { icon: iconCheck, iconColor: "#0b1410", bg: "rgba(79,195,154,0.95)", color: "#0b1410", border: "rgba(0,0,0,0)" });
  }
}

function sRepair(lt, t) {
  resetLiving(t);
  L.setPower(1);
  L.man.visible = false;
  L.manStand.visible = true;
  L.manStand.position.set(-0.85, 0, -0.45); L.manStand.rotation.y = 0.75;
  L.manStand.userData.setFace(t > 78.6 ? "smile" : "line");
  L.pail.visible = true; L.pail.position.set(0.25, 0.5, -1.42);
  L.lad.visible = true; L.lad.position.set(0.55, 0, -0.95);
  const wk = L.worker;
  wk.visible = true;
  wk.position.set(0.55, 0.42, -1.05);
  wk.rotation.y = Math.PI;
  const work = Math.sin(t * 7) * 0.25;
  wk.userData.arms[0].rotation.set(-2.7, 0, -0.2);
  wk.userData.arms[1].rotation.set(-2.6 + work, 0, 0.25);
  wk.userData.head.rotation.set(-0.5, 0, 0);
  const dry = tw(t, 76.6, 78.6);
  L.setStain(lerp(0.8, 0.001, dry));
  if (dry < 0.6) drips(t, L.stainPos, 0.62, 2, 1.1);
  look(mixV(v3(3.1, 1.65, 3.5), v3(2.75, 1.62, 3.0), tw(lt, 0, 3.6)), v3(0.35, 1.7, -1.2), 46);
  draw(L.scene, { bloomStrength: 0.65 });
  bubbleFloat("Hat alles geklappt?", "in", 90, 1460, tw(t, 76.74, 77.0));
  bubbleFloat("Ja, alles trocken!", "out", W - 90, 1570, tw(t, 78.56, 78.8));
}

function sClosed(lt, t) {
  resetBoard(t);
  ["t1", "t2", "t3", "t4"].forEach((k) => setTube(BD, k, 0x4fc39a, 0.7));
  const calm = tw(t, 80.4, 81.0);
  const b = BD.blocks.tenant;
  b.rimM.color.setHex(calm > 0.5 ? 0x4fc39a : 0xff3b30).multiplyScalar(1.6);
  b.rimM.opacity = calm > 0.5 ? 0.9 : 0.6 * pulse(t, 1.4);
  b.light.color.setHex(calm > 0.5 ? 0x4fc39a : 0xff3b30);
  b.light.intensity = 3;
  animateLeak(BD.B, t, { leak: 0, alarm: calm > 0.5 ? 0 : 1 });
  Object.entries(BD.blocks).forEach(([k, bb]) => { if (k !== "tenant") { bb.rimM.color.setHex(0x4fc39a).multiplyScalar(1.6); bb.rimM.opacity = 0.6; } });
  boardOverview(t, lt);
  draw(BD.scene, { bloomStrength: 0.85, bloomThreshold: 0.86 });
  fill("#000", 0.35 * tw(t, 79.9, 80.3));
  const ck = ease.out(seg(t, 79.6, 80.1));
  caseCard(W / 2, 930, lerp(0.7, 1.0, ck), ck, { urgent: t < 80.97 ? true : false });
  if (t > 80.97) stamp("ERLEDIGT", W / 2 + 60, 1200, t - 80.97, { color: "#4fc39a", size: 80, rot: -0.12 });
}

function sSplit(lt, t) {
  // Top: tenant relaxed
  resetLiving(t);
  L.setStain(0.001);
  L.man.userData.setFace("smile");
  L.man.userData.head.rotation.set(0.05, 0.1 * Math.sin(t * 0.7), 0);
  look(v3(1.25, 1.45, 2.6), v3(0.2, 1.35, -1.5), 44);
  sctx.drawImage(render3d(L.scene, cam, { bloomStrength: 0.6 }), 0, 0);
  ctx.drawImage(scratch, 0, 470, W, 960, 0, 0, W, 960);
  // Bottom: family dinner, phone face down
  resetDinner(t);
  D.phone.rotation.set(Math.PI / 2, 0, -0.25);
  Object.values(D.people).forEach((p, i) => { p.userData.setFace("smile"); p.userData.head.rotation.set(0.05 * Math.sin(t * 3 + i), 0.15 * Math.sin(t * 0.8 + i), 0); p.userData.body.position.y = 0.01 * Math.abs(Math.sin(t * 6 + i)); });
  look(v3(3.9, 3.2, 3.7), v3(0.15, 0.95, 0.0), 40);
  sctx.drawImage(render3d(D.scene, cam, { bloomStrength: 0.45, bloomThreshold: 0.9 }), 0, 0);
  ctx.drawImage(scratch, 0, 480, W, 960, 0, 960, W, 960);
  ctx.fillStyle = "#4fc39a"; ctx.fillRect(0, 957, W, 6);
  const a = tw(t, 82.94, 83.3), b2 = tw(t, 84.2, 84.6);
  ctx.save(); ctx.fillStyle = "rgba(8,10,14,0.7)"; rrect(W / 2 - 300, 860, 600, 88, 44); ctx.globalAlpha = a; ctx.fill(); ctx.restore();
  text("Mieter versorgt.", W / 2, 920, { size: 48, weight: 900, family: "InterDisplay", alpha: a });
  ctx.save(); ctx.fillStyle = "rgba(8,10,14,0.7)"; rrect(W / 2 - 300, 972, 600, 88, 44); ctx.globalAlpha = b2; ctx.fill(); ctx.restore();
  text("Abend gerettet.", W / 2, 1032, { size: 48, weight: 900, family: "InterDisplay", color: "#4fc39a", alpha: b2 });
}

function sEnd(lt, t) {
  resetBoard(t);
  ["t1", "t2", "t3", "t4"].forEach((k) => setTube(BD, k, 0x4fc39a, 0.9));
  Object.values(BD.blocks).forEach((bb) => { bb.rimM.color.setHex(0x4fc39a).multiplyScalar(1.6); bb.rimM.opacity = 0.7; bb.light.color.setHex(0x4fc39a); bb.light.intensity = 1.5; });
  const a = 0.25 * t;
  look(v3(Math.sin(a) * 10.5, lerp(9.5, 11, tw(lt, 0, 7)), Math.cos(a) * 10 - 0.4), v3(0, 0, -0.5), 40);
  draw(BD.scene, { bloomStrength: 1.0, bloomThreshold: 0.75 });
  fill("#06080b", 0.82 * tw(t, 88.5, 89.3));
  logo(W / 2, 700, 130, tw(t, 87.9, 88.4));
  text("Dein Mieter schreibt uns.", W / 2, 820, { size: 40, weight: 600, alpha: tw(t, 89.2, 89.6) * 0.85 });
  text("Wir kümmern uns um den Rest.", W / 2, 874, { size: 40, weight: 600, alpha: tw(t, 89.4, 89.8) * 0.85 });
  text("19,99 € im Monat", W / 2, 1060, { size: 58, weight: 800, alpha: tw(t, 90.1, 90.5) });
  const g = tw(t, 90.6, 91.0);
  ctx.save(); ctx.globalAlpha = g; ctx.fillStyle = "rgba(79,195,154,0.14)"; ctx.strokeStyle = "rgba(79,195,154,0.8)"; ctx.lineWidth = 3; rrect(W / 2 - 360, 1110, 720, 120, 60); ctx.fill(); ctx.stroke(); ctx.restore();
  text("Im Pilot gerade gratis", W / 2, 1192, { size: 62, weight: 900, family: "InterDisplay", color: "#4fc39a", alpha: g });
  text("nur für kurze Zeit", W / 2, 1285, { size: 34, weight: 600, alpha: tw(t, 91.1, 91.4) * 0.75 });
  text("ecoraum.de", W / 2, 1460, { size: 54, weight: 800, alpha: tw(t, 91.6, 92.0) });
}

const shots = [
  { a: 0.0, b: 2.15, fn: sHookWide },
  { a: 2.15, b: 3.0, fn: sHookUp },
  { a: 3.0, b: 5.3, fn: sBuilding },
  { a: 5.3, b: 8.25, fn: sDinnerOld },
  { a: 8.25, b: 10.2, fn: (lt, t, f) => sDinnerNew(lt, t, f, { tap: 0.75, titleAt: 1.0, label: "MIT ECORAUM" }) },
  { a: 10.2, b: 23.6, fn: sBoardIntro },
  { a: 23.6, b: 25.6, fn: sSafetyWide },
  { a: 25.6, b: 28.45, fn: sDanger },
  { a: 28.45, b: 29.7, fn: sFuse },
  { a: 29.7, b: 33.0, fn: sBucket },
  { a: 33.0, b: 36.4, fn: sNeighbor },
  { a: 36.4, b: 59.0, fn: sChat },
  { a: 59.0, b: 70.1, fn: sBoardCase },
  { a: 70.1, b: 71.4, fn: (lt, t) => sBoardApprove(lt, t, 1) },
  { a: 71.4, b: 73.8, fn: (lt, t, f) => sDinnerNew(lt, t, f, { tap: 1.0, label: "BEIM ABENDESSEN" }) },
  { a: 73.8, b: 75.8, fn: (lt, t) => sBoardApprove(lt, t, 2) },
  { a: 75.8, b: 79.4, fn: sRepair },
  { a: 79.4, b: 82.0, fn: sClosed },
  { a: 82.0, b: 87.6, fn: sSplit },
  { a: 87.6, b: 95.01, fn: sEnd },
];

window.renderAt = (t, type = "image/jpeg") => {
  const frame = Math.round(t * FPS);
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const shot = shots.find((s) => t >= s.a && t < s.b) ?? shots[shots.length - 1];
  cam.up.set(0, 1, 0);
  shot.fn(t - shot.a, t, frame);
  ctx.restore();
  // Glitch between "früher" and "mit Ecoraum"
  const gl = 1 - clamp(Math.abs(t - 8.22) / 0.2);
  if (gl > 0) { glitch(frame, gl); text("◀◀", W / 2, H / 2 + 40, { size: 140, weight: 900, alpha: gl, color: "#ffffff" }); }
  // Short dip to black at the start
  fill("#000", 1 - tw(t, 0, 0.25));
  vignette(0.5);
  grain(frame, 0.07);
  return out.toDataURL(type, 0.92);
};

await Promise.all(["400", "500", "600", "700", "800", "900"].map((w) => document.fonts.load(`${w} 40px Inter`)));
await document.fonts.load("700 40px InterDisplay");
await document.fonts.load("900 40px InterDisplay");
window.__ready = true;
