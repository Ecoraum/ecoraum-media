// 2D overlay drawing: titles, labels, chat phone, cards, icons.
import { W, H, ctx, clamp, ease, seg, tw, lerp } from "./engine.js";

export function font(size, weight = 700, family = "Inter") {
  return `${weight} ${size}px ${family === "InterDisplay" ? "InterDisplay" : "Inter"}`;
}

export function text(str, x, y, o = {}) {
  if ((o.alpha ?? 1) <= 0) return 0;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.font = font(o.size ?? 40, o.weight ?? 700, o.family);
  ctx.letterSpacing = `${o.spacing ?? 0}px`;
  ctx.textAlign = o.align ?? "center";
  ctx.textBaseline = o.baseline ?? "alphabetic";
  if (o.shadow !== false) {
    ctx.shadowColor = o.shadowColor ?? "rgba(0,0,0,0.55)";
    ctx.shadowBlur = o.shadowBlur ?? 18;
  }
  ctx.fillStyle = o.color ?? "#ffffff";
  ctx.fillText(str, x, y);
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}

export function measure(str, size, weight = 700, family = "Inter", spacing = 0) {
  ctx.save();
  ctx.font = font(size, weight, family);
  ctx.letterSpacing = `${spacing}px`;
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}

export function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Big cinematic title: words rise in one after another.
export function title(lines, cx, cy, lt, o = {}) {
  const size = o.size ?? 92, lh = size * 1.08, inT = o.in ?? 0, outT = o.out ?? 99;
  const fadeOut = 1 - tw(lt, outT, outT + 0.3);
  lines.forEach((line, li) => {
    const parts = Array.isArray(line) ? line : [[line, o.color ?? "#ffffff"]];
    const full = parts.map((p) => p[0]).join("");
    const total = measure(full, size, o.weight ?? 900, o.family ?? "InterDisplay", o.spacing ?? -1);
    let x = cx - total / 2;
    parts.forEach(([str, col], pi) => {
      const k = ease.out(seg(lt, inT + (li * 0.12 + pi * 0.06), inT + li * 0.12 + pi * 0.06 + 0.35));
      const w = measure(str, size, o.weight ?? 900, o.family ?? "InterDisplay", o.spacing ?? -1);
      text(str, x, cy + li * lh + (1 - k) * 30, { size, weight: o.weight ?? 900, family: o.family ?? "InterDisplay", color: col, align: "left", alpha: k * fadeOut, spacing: o.spacing ?? -1, shadowBlur: 30 });
      x += w;
    });
  });
}

// Small Fern-style label with a leader line.
export function tag(label, sub, x, y, a, o = {}) {
  if (a <= 0) return;
  const dir = o.dir ?? 0; // vertical offset of the label from the anchor point
  const ly = y + dir;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = o.line ?? "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ly + (dir > 0 ? -34 : 14)); ctx.stroke();
  ctx.fillStyle = o.dot ?? "#ffffff";
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  text(label, x, ly + (dir > 0 ? 0 : -6), { size: o.size ?? 30, weight: 800, spacing: 5, alpha: a, color: o.color ?? "#ffffff" });
  if (sub) text(sub, x, ly + (dir > 0 ? 34 : 26), { size: 24, weight: 500, alpha: a * 0.75, color: o.subColor ?? "#cfd6df" });
}

// ---------- icons ----------
export function iconCheck(x, y, s, color = "#4fc39a", lw = 0.14) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = s * lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x - s * 0.32, y); ctx.lineTo(x - s * 0.08, y + s * 0.24); ctx.lineTo(x + s * 0.36, y - s * 0.26); ctx.stroke();
  ctx.restore();
}
export function iconPin(x, y, s, color) {
  ctx.save(); ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y - s * 0.12, s * 0.3, Math.PI, 0); ctx.lineTo(x, y + s * 0.42); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y - s * 0.12, s * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
export function iconHome(x, y, s, color) {
  ctx.save(); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x - s * 0.4, y); ctx.lineTo(x, y - s * 0.38); ctx.lineTo(x + s * 0.4, y); ctx.lineTo(x + s * 0.3, y); ctx.lineTo(x + s * 0.3, y + s * 0.36); ctx.lineTo(x - s * 0.3, y + s * 0.36); ctx.lineTo(x - s * 0.3, y); ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function iconWarn(x, y, s, color = "#ff3b30") {
  ctx.save(); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.45); ctx.lineTo(x + s * 0.5, y + s * 0.4); ctx.lineTo(x - s * 0.5, y + s * 0.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#111"; ctx.fillRect(x - s * 0.04, y - s * 0.16, s * 0.08, s * 0.3); ctx.fillRect(x - s * 0.04, y + s * 0.2, s * 0.08, s * 0.08);
  ctx.restore();
}
export function iconCamera(x, y, s, color) {
  ctx.save(); ctx.fillStyle = color;
  rrect(x - s * 0.45, y - s * 0.28, s * 0.9, s * 0.6, s * 0.1); ctx.fill();
  ctx.fillRect(x - s * 0.18, y - s * 0.38, s * 0.36, s * 0.14);
  ctx.fillStyle = "#1c2a24"; ctx.beginPath(); ctx.arc(x, y + s * 0.02, s * 0.17, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
export function iconMic(x, y, s, color) {
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = s * 0.08;
  rrect(x - s * 0.14, y - s * 0.42, s * 0.28, s * 0.5, s * 0.14); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - s * 0.05, s * 0.24, 0, Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.2); ctx.lineTo(x, y + s * 0.36); ctx.stroke();
  ctx.restore();
}
export function iconText(x, y, s, color) {
  ctx.save(); ctx.fillStyle = color;
  rrect(x - s * 0.45, y - s * 0.32, s * 0.9, s * 0.56, s * 0.14); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s * 0.2, y + s * 0.2); ctx.lineTo(x - s * 0.3, y + s * 0.42); ctx.lineTo(x, y + s * 0.22); ctx.fill();
  ctx.fillStyle = "#1c2a24";
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x - s * 0.2 + i * s * 0.2, y - s * 0.04, s * 0.05, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// ---------- chat phone ----------
const BUB_FONT = 30, PAD = 22, LINE = 38;
function wrapLines(str, maxW, size = BUB_FONT, weight = 500) {
  ctx.save(); ctx.font = font(size, weight); ctx.letterSpacing = "0px";
  const words = str.split(" "), lines = [];
  let cur = "";
  for (const w of words) {
    const tryS = cur ? cur + " " + w : w;
    if (ctx.measureText(tryS).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryS;
  }
  if (cur) lines.push(cur);
  ctx.restore();
  return lines;
}

// Message kinds: text, photo, voice, ghost (struck out), chips, summary, typing
export function messageHeight(m, inner) {
  if (m.kind === "photo") return 250;
  if (m.kind === "voice") return 86;
  if (m.kind === "typing") return 70;
  if (m.kind === "chips") return 64 * m.items.length + 8;
  if (m.kind === "summary") return 460;
  return wrapLines(m.text, inner * 0.72 - PAD * 2).length * LINE + PAD * 2 - 6;
}

export function phoneFrame(x, y, w, h, o = {}) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#0b0c0f"; rrect(x, y, w, h, 74); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "#30343b"; ctx.lineWidth = 4; rrect(x, y, w, h, 74); ctx.stroke();
  const sx = x + 18, sy = y + 18, sw = w - 36, sh = h - 36;
  rrect(sx, sy, sw, sh, 58); ctx.clip();
  const bg = ctx.createLinearGradient(0, sy, 0, sy + sh);
  bg.addColorStop(0, "#101a17"); bg.addColorStop(1, "#0b1210");
  ctx.fillStyle = bg; ctx.fillRect(sx, sy, sw, sh);
  // header
  ctx.fillStyle = "#151f1c"; ctx.fillRect(sx, sy, sw, 150);
  ctx.fillStyle = "#4fc39a"; ctx.beginPath(); ctx.arc(sx + 70, sy + 92, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#0b1410"; ctx.font = font(30, 900); ctx.textAlign = "center"; ctx.fillText("e", sx + 70, sy + 102);
  ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = font(32, 800); ctx.fillText("Ecoraum", sx + 118, sy + 88);
  ctx.fillStyle = "#7fd3b2"; ctx.font = font(22, 500); ctx.fillText(o.status ?? "online", sx + 118, sy + 120);
  ctx.fillStyle = "#000"; rrect(x + w / 2 - 70, y + 34, 140, 34, 17); ctx.fill();
  return { sx, sy, sw, sh, body: { x: sx + 26, y: sy + 172, w: sw - 52, h: sh - 200 } };
}

export function drawMessage(m, x, y, inner, a, lt) {
  const pop = ease.back(clamp(a));
  const side = m.side === "out" ? 1 : 0;
  ctx.save();
  ctx.globalAlpha = clamp(a * 1.4) * (m.alpha ?? 1);
  if (m.kind === "chips") {
    m.items.forEach((it, i) => {
      const k = ease.out(clamp((lt - (m.t0 + i * (m.gap ?? 0.9))) / 0.35));
      if (k <= 0) return;
      const cy = y + i * 64, cw = inner * 0.86, cx = x + (inner - cw) / 2 + (1 - k) * 40;
      ctx.globalAlpha = k;
      ctx.fillStyle = "rgba(79,195,154,0.14)"; ctx.strokeStyle = "rgba(79,195,154,0.7)"; ctx.lineWidth = 2;
      rrect(cx, cy, cw, 52, 26); ctx.fill(); ctx.stroke();
      (it.icon === "pin" ? iconPin : iconHome)(cx + 34, cy + 26, 34, "#4fc39a");
      ctx.fillStyle = "#e9f5ef"; ctx.font = font(24, 700); ctx.textAlign = "left"; ctx.fillText(it.text, cx + 64, cy + 35);
      ctx.fillStyle = "#4fc39a"; ctx.font = font(20, 700); ctx.textAlign = "right"; ctx.fillText("bekannt", cx + cw - 58, cy + 34);
      iconCheck(cx + cw - 30, cy + 26, 26, "#4fc39a");
    });
    ctx.restore();
    return;
  }
  const maxW = inner * 0.72;
  let bw, bh, lines = [];
  if (m.kind === "photo") { bw = 300; bh = 236; }
  else if (m.kind === "voice") { bw = 360; bh = 76; }
  else if (m.kind === "typing") { bw = 120; bh = 60; }
  else if (m.kind === "summary") { bw = inner * 0.9; bh = 446; }
  else { lines = wrapLines(m.text, maxW - PAD * 2); bw = Math.max(...lines.map((l) => measure(l, BUB_FONT, 500))) + PAD * 2; bh = lines.length * LINE + PAD * 2 - 6; }
  const bx = side ? x + inner - bw : x;
  ctx.translate(bx + (side ? bw : 0), y + bh);
  ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
  ctx.translate(-(bx + (side ? bw : 0)), -(y + bh));
  ctx.fillStyle = side ? "#1d6b52" : (m.kind === "ghost" ? "#2a2f35" : "#222a2f");
  rrect(bx, y, bw, bh, 26); ctx.fill();
  ctx.fillStyle = "#f1f5f3"; ctx.textAlign = "left";
  if (m.kind === "photo") {
    const g = ctx.createRadialGradient(bx + 150, y + 110, 10, bx + 150, y + 110, 140);
    g.addColorStop(0, "#5a4a38"); g.addColorStop(0.45, "#9c8a6c"); g.addColorStop(1, "#d9d0c0");
    ctx.save(); rrect(bx + 8, y + 8, bw - 16, bh - 16, 20); ctx.clip();
    ctx.fillStyle = g; ctx.fillRect(bx + 8, y + 8, bw - 16, bh - 16);
    ctx.fillStyle = "#6fd0ff"; for (const [dx, dy] of [[150, 120], [176, 150], [128, 170]]) { ctx.beginPath(); ctx.ellipse(bx + dx, y + dy, 8, 11, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  } else if (m.kind === "voice") {
    ctx.fillStyle = "#e9f5ef"; ctx.beginPath(); ctx.moveTo(bx + 30, y + 22); ctx.lineTo(bx + 54, y + 38); ctx.lineTo(bx + 30, y + 54); ctx.fill();
    for (let i = 0; i < 22; i++) { const hgt = 8 + 26 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)); ctx.fillRect(bx + 76 + i * 12, y + 38 - hgt / 2, 6, hgt); }
    ctx.font = font(20, 600); ctx.fillText("0:07", bx + bw - 70, y + 64);
  } else if (m.kind === "typing") {
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(lt * 5 + i)); ctx.beginPath(); ctx.arc(bx + 34 + i * 26, y + 30, 8, 0, Math.PI * 2); ctx.fill(); }
  } else if (m.kind === "summary") {
    drawSummary(bx, y, bw, bh, lt, m);
  } else {
    ctx.font = font(BUB_FONT, 500);
    lines.forEach((l, i) => ctx.fillText(l, bx + PAD, y + PAD + 28 + i * LINE));
    if (m.kind === "ghost") {
      const k = ease.out(clamp((lt - m.strike) / 0.3));
      ctx.strokeStyle = "#ff5a4f"; ctx.lineWidth = 5;
      lines.forEach((l, i) => { const lw = measure(l, BUB_FONT, 500); ctx.beginPath(); ctx.moveTo(bx + PAD - 6, y + PAD + 18 + i * LINE); ctx.lineTo(bx + PAD - 6 + (lw + 12) * k, y + PAD + 18 + i * LINE); ctx.stroke(); });
    }
  }
  ctx.restore();
}

function drawSummary(x, y, w, h, lt, m) {
  ctx.fillStyle = "#4fc39a"; ctx.font = font(22, 800); ctx.letterSpacing = "3px";
  ctx.fillText("ZUSAMMENFASSUNG", x + 28, y + 50); ctx.letterSpacing = "0px";
  const rows = [["Was", "Wasser tropft durch die Decke"], ["Wo", "Wohnzimmer, über dem Sofa"], ["Seit wann", "ca. 21:45 Uhr"], ["Fotos", ""]];
  rows.forEach(([k, v], i) => {
    const a = ease.out(clamp((lt - m.rows[i]) / 0.3));
    if (a <= 0) return;
    const ry = y + 92 + i * 78;
    ctx.globalAlpha = a;
    ctx.fillStyle = "#86a399"; ctx.font = font(20, 700); ctx.fillText(k.toUpperCase(), x + 28 + (1 - a) * 20, ry);
    ctx.fillStyle = "#fff"; ctx.font = font(27, 600);
    if (k === "Fotos") {
      for (let p = 0; p < 2; p++) {
        const px = x + 28 + p * 112, py = ry + 10;
        const g = ctx.createRadialGradient(px + 48, py + 34, 4, px + 48, py + 34, 60);
        g.addColorStop(0, "#5a4a38"); g.addColorStop(1, "#d9d0c0");
        ctx.fillStyle = g; rrect(px, py, 96, 70, 12); ctx.fill();
      }
    } else ctx.fillText(v, x + 28 + (1 - a) * 20, ry + 34);
  });
  ctx.globalAlpha = 1;
  const ba = ease.out(clamp((lt - m.button) / 0.3));
  if (ba > 0) {
    ctx.globalAlpha = ba;
    ctx.fillStyle = "#4fc39a"; rrect(x + 28, y + h - 76, w - 56, 54, 27); ctx.fill();
    ctx.fillStyle = "#0b1410"; ctx.textAlign = "center"; ctx.font = font(24, 800); ctx.fillText("An das Team weitergeben?", x + w / 2, y + h - 41);
    ctx.textAlign = "left";
  }
}

// Lays out messages bottom-anchored inside the body; returns nothing.
export function chat(body, msgs, lt) {
  const visible = msgs.filter((m) => lt >= m.t0);
  let total = 0;
  const hs = visible.map((m) => messageHeight(m, body.w));
  hs.forEach((h) => (total += h + 22));
  // Smooth scroll: animate towards the target offset
  const overflow = Math.max(0, total - body.h);
  ctx.save();
  ctx.beginPath(); ctx.rect(body.x - 20, body.y - 10, body.w + 40, body.h + 20); ctx.clip();
  let y = body.y - overflow;
  visible.forEach((m, i) => {
    const a = clamp((lt - m.t0) / 0.28) * (m.until ? 1 - clamp((lt - m.until) / 0.3) : 1);
    if (a > 0) drawMessage(m, body.x, y, body.w, a, lt);
    y += hs[i] + 22;
  });
  ctx.restore();
}

// ---------- cards, stamps, gauges ----------
export function stamp(str, x, y, lt, o = {}) {
  const k = clamp(lt / 0.18);
  if (k <= 0) return;
  const s = lerp(1.8, 1, ease.out(k));
  ctx.save();
  ctx.translate(x, y); ctx.rotate(o.rot ?? -0.12); ctx.scale(s, s);
  ctx.globalAlpha = clamp(k * 1.5) * (o.alpha ?? 1);
  const col = o.color ?? "#ff3b30";
  ctx.font = font(o.size ?? 64, 900, "InterDisplay"); ctx.letterSpacing = "6px";
  const w = ctx.measureText(str).width + 60, h = (o.size ?? 64) * 1.45;
  ctx.strokeStyle = col; ctx.lineWidth = 9; rrect(-w / 2, -h / 2, w, h, 16); ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(str, 0, 4);
  ctx.restore();
}

export function gauge(x, y, r, value, a, t) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(10,12,16,0.78)"; rrect(x - r - 40, y - r - 70, 2 * r + 80, r + 150, 28); ctx.fill();
  const segs = [["#4fc39a", 0, 0.4], ["#ffb03a", 0.4, 0.7], ["#ff3b30", 0.7, 1]];
  ctx.lineWidth = 26; ctx.lineCap = "butt";
  segs.forEach(([c, a0, a1]) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x, y, r, Math.PI + a0 * Math.PI, Math.PI + a1 * Math.PI); ctx.stroke(); });
  const ang = Math.PI + value * Math.PI;
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 8; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * (r - 8), y + Math.sin(ang) * (r - 8)); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  text("DRINGLICHKEIT", x, y - r - 30, { size: 24, weight: 800, spacing: 4, alpha: a * 0.8 });
  const label = value > 0.72 ? "AKUT" : value > 0.4 ? "HOCH" : "NORMAL";
  const col = value > 0.72 ? "#ff3b30" : value > 0.4 ? "#ffb03a" : "#4fc39a";
  const blink = value > 0.72 ? 0.6 + 0.4 * Math.abs(Math.sin(t * 8)) : 1;
  text(label, x, y + 62, { size: 46, weight: 900, family: "InterDisplay", spacing: 6, color: col, alpha: a * blink });
}

export function badge(str, x, y, a, o = {}) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = font(o.size ?? 26, 800);
  const w = ctx.measureText(str).width + (o.icon ? 74 : 40), h = (o.size ?? 26) * 1.9;
  ctx.fillStyle = o.bg ?? "rgba(12,14,18,0.86)"; ctx.strokeStyle = o.border ?? "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
  rrect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
  if (o.icon) o.icon(x - w / 2 + 34, y, h * 0.62, o.iconColor ?? "#fff");
  ctx.fillStyle = o.color ?? "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(str, x + (o.icon ? 16 : 0), y + 2);
  ctx.restore();
}

export function notification(title, body, x, y, w, a, o = {}) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(245,245,247,0.94)"; rrect(x, y, w, 118, 30); ctx.fill();
  ctx.fillStyle = o.color ?? "#ff3b30"; rrect(x + 22, y + 24, 70, 70, 18); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = font(40, 900); ctx.textAlign = "center"; ctx.fillText(o.glyph ?? "!", x + 57, y + 74);
  ctx.textAlign = "left"; ctx.fillStyle = "#111"; ctx.font = font(26, 800); ctx.fillText(title, x + 112, y + 52);
  ctx.fillStyle = "#333"; ctx.font = font(24, 500); ctx.fillText(body, x + 112, y + 88);
  ctx.fillStyle = "#888"; ctx.font = font(20, 600); ctx.textAlign = "right"; ctx.fillText(o.time ?? "jetzt", x + w - 26, y + 48);
  ctx.restore();
}

export function logo(cx, cy, size, a = 1) {
  if (a <= 0) return;
  const w = measure("ecoraum", size, 700, "InterDisplay", -1);
  const x0 = cx - (w + size * 0.42) / 2;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "#4fc39a";
  ctx.shadowColor = "rgba(79,195,154,0.7)"; ctx.shadowBlur = size * 0.4;
  ctx.beginPath(); ctx.arc(x0 + size * 0.16, cy - size * 0.3, size * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  text("ecoraum", x0 + size * 0.42, cy, { size, weight: 700, family: "InterDisplay", align: "left", alpha: a, spacing: -1 });
}
