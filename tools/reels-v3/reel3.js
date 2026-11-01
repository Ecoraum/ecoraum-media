// Reel engine v3: deterministic frames via window.render(t).
// Scenes: .scene[data-from][data-to][data-tr=blur|cut][data-bg-at][data-bg-to]
// Elements: [data-in] with data-anim (fade|rise|pop|device|drop|scale|draw|check|strike|logo), data-out, data-dur, data-sfx
// Voice lines: <script id="vo-src" type="application/json">[{id,start,theme,html}]</script> + window.VO_DUR from vo-dur.js
(function () {
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const E = {
    out3: (x) => 1 - Math.pow(1 - x, 3),
    expo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    back: (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  const stage = document.getElementById("stage");
  const DURATION = +stage.dataset.duration;
  window.DURATION = DURATION;

  // voice lines
  const voSrc = JSON.parse(document.getElementById("vo-src")?.textContent || "[]");
  const durs = window.VO_DUR || {};
  const voBox = document.getElementById("vo");
  const lines = voSrc.map((l, i) => {
    const dur = durs[l.id] ?? 2.5;
    const next = voSrc[i + 1];
    const end = Math.min(l.start + dur + (l.hold ?? 0.45), next ? next.start - 0.34 : DURATION);
    const el = document.createElement("div");
    el.className = `line ${l.theme || "light"}`;
    el.innerHTML = `<span class="txt">${l.html || ""}</span>`;
    if (!l.html) el.style.display = "none";
    voBox?.appendChild(el);
    return { ...l, dur, end, el };
  });
  window.VO = lines.map(({ id, start, dur }) => ({ id, start, dur }));

  const scenes = [...document.querySelectorAll(".scene")];
  scenes.forEach((s, i) => {
    s.style.zIndex = i + 1;
    if (s.dataset.bgTo) {
      const c = getComputedStyle(s).backgroundColor.match(/\d+/g).map(Number);
      const d = s.dataset.bgTo.match(/\w\w/g).map((h) => parseInt(h, 16));
      s._bg = [c, d];
    }
  });
  const items = [...document.querySelectorAll("[data-in]")];
  const glows = [...document.querySelectorAll(".glow")];
  const dots = [...document.querySelectorAll(".typing i")];
  const devices = [...document.querySelectorAll(".device")];

  const events = [];
  for (const el of document.querySelectorAll("[data-sfx]")) events.push({ t: +el.dataset.in + (+el.dataset.sfxAt || 0), type: el.dataset.sfx });
  events.sort((a, b) => a.t - b.t);
  window.EVENTS = events;

  function blurIn(el, p, dist) {
    el.style.opacity = p;
    el.style.filter = p >= 1 ? "none" : `blur(${(1 - p) * 14}px)`;
    el.style.transform = `translateY(${(1 - p) * dist}px)`;
  }

  window.render = function (t) {
    scenes.forEach((s, i) => {
      const from = +s.dataset.from;
      const next = scenes[i + 1];
      const to = next ? +next.dataset.from : DURATION + 1;
      const nextBlur = next && (next.dataset.tr || "blur") === "blur";
      const visible = t >= from && t < to + (nextBlur ? 0.55 : 0);
      s.style.visibility = visible ? "visible" : "hidden";
      if (!visible) return;
      const tr = i === 0 ? "none" : s.dataset.tr || "blur";
      if (tr === "blur") {
        const p = E.out3(clamp((t - from) / 0.55));
        s.style.opacity = p;
        s.style.filter = p >= 1 ? "none" : `blur(${(1 - p) * 22}px)`;
        s.style.transform = `scale(${1 + (1 - p) * 0.035})`;
      } else if (tr === "cut") {
        const p = E.expo(clamp((t - from) / 0.4));
        s.style.opacity = 1; s.style.filter = "none";
        s.style.transform = `scale(${1 + (1 - p) * 0.06})`;
      } else { s.style.opacity = 1; s.style.filter = "none"; s.style.transform = "none"; }
      if (s._bg) {
        const p = E.inOut(clamp((t - +s.dataset.bgAt) / 0.9));
        const [c, d] = s._bg;
        s.style.backgroundColor = `rgb(${c.map((v, k) => Math.round(v + (d[k] - v) * p)).join(",")})`;
      }
    });

    for (const l of lines) {
      const pin = E.out3(clamp((t - l.start + 0.05) / 0.4));
      const pout = clamp((t - l.end) / 0.3);
      const on = t >= l.start - 0.05 && pout < 1;
      l.el.style.opacity = on ? pin * (1 - pout) : 0;
      l.el.style.filter = !on ? "none" : `blur(${(1 - pin) * 10 + pout * 10}px)`;
      l.el.style.transform = `translateY(${(1 - pin) * 22 - pout * 14}px)`;
    }

    for (const el of items) {
      const tin = +el.dataset.in;
      const out = el.dataset.out ? +el.dataset.out : Infinity;
      const anim = el.dataset.anim || "fade";
      const dur = +el.dataset.dur || 0;
      const k = t - tin;
      if (t >= out) {
        const q = clamp((t - out) / 0.3);
        if (anim === "pop") { el.style.display = q >= 1 ? "none" : ""; }
        el.style.opacity = 1 - q;
        el.style.filter = `blur(${q * 10}px)`;
        continue;
      }
      if (anim === "fade" || anim === "rise") {
        blurIn(el, tin < 0 ? 1 : E.out3(clamp(k / (dur || 0.65))), anim === "rise" ? 90 : 34);
      } else if (anim === "pop") {
        el.style.display = k < 0 ? "none" : "";
        const p = E.back(clamp(k / 0.42));
        el.style.opacity = clamp(k / 0.12);
        el.style.transform = `translateY(${(1 - clamp(k / 0.3)) * 26}px) scale(${0.86 + 0.14 * p})`;
      } else if (anim === "device") {
        const p = tin < 0 ? 1 : E.expo(clamp(k / (dur || 1.25)));
        const float = Math.sin(t * 1.15) * 6 * clamp(k / 1.5);
        el.style.opacity = clamp(k / 0.25);
        el.style.transform = `perspective(2600px) translateY(${(1 - p) * 620 + float}px) rotateX(${(1 - p) * 18}deg) scale(${0.94 + 0.06 * p})`;
      } else if (anim === "drop") {
        const p = E.back(clamp(k / 0.7));
        el.style.opacity = clamp(k / 0.18);
        el.style.filter = k > 0.3 ? "none" : `blur(${(1 - clamp(k / 0.3)) * 10}px)`;
        el.style.transform = `translateY(${(1 - p) * -240}px)`;
      } else if (anim === "scale") {
        const p = tin < 0 ? 1 : E.expo(clamp(k / (dur || 0.55)));
        el.style.opacity = clamp(k / 0.2);
        el.style.filter = p >= 0.999 ? "none" : `blur(${(1 - p) * 12}px)`;
        el.style.transform = `scale(${0.86 + 0.14 * p})`;
      } else if (anim === "draw") {
        const p = E.inOut(clamp(k / (dur || 0.9)));
        el.style.opacity = k < 0 ? 0 : 1;
        el.querySelectorAll("[pathLength]").forEach((path) => { path.style.strokeDashoffset = String(1 - p); });
      } else if (anim === "check") {
        el.classList.toggle("on", k >= 0);
        const dot = el.querySelector(".dot");
        if (dot) dot.style.transform = `scale(${k < 0 ? 1 : 0.8 + 0.2 * E.back(clamp(k / 0.35))})`;
      } else if (anim === "drip") {
        const range = +el.dataset.range || 500, speed = +el.dataset.speed || 420;
        const y = k < 0 ? 0 : (k * speed) % range;
        el.style.opacity = k < 0 ? 0 : clamp(Math.min(y / 40, (range - y) / 120)) * clamp(k / 0.3);
        el.style.transform = `translateY(${y}px)`;
      } else if (anim === "strike") {
        const x = el.querySelector(".x");
        if (x) x.style.transform = `scaleX(${E.inOut(clamp(k / 0.4))})`;
      } else if (anim === "logo") {
        const house = el.querySelector(".house");
        house.style.strokeDashoffset = String(1 - E.inOut(clamp(k / 1.0)));
        el.querySelectorAll(".lt").forEach((lt, n) => {
          const p = E.out3(clamp((k - 0.5 - n * 0.055) / 0.4));
          lt.style.opacity = p;
          lt.style.transform = `translateY(${(1 - p) * 26}px)`;
        });
        el.querySelector(".bar").style.transform = `scaleX(${E.expo(clamp((k - 0.9) / 0.6))})`;
        el.style.opacity = k < 0 ? 0 : 1;
      }
    }

    glows.forEach((g, i) => {
      const a = t * 0.3 + i * 2.3;
      g.style.transform = `translate(${Math.sin(a) * 80}px, ${Math.cos(a * 0.8) * 110}px)`;
    });
    dots.forEach((d, i) => {
      const v = Math.max(0, Math.sin(t * 10 - i * 0.9));
      d.style.transform = `translateY(${-9 * v}px)`;
      d.style.opacity = 0.45 + 0.55 * v;
    });
  };
  window.render(0);
})();
