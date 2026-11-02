// Reel engine v4 – deterministic frames via window.render(t).
// Principles: one focus per frame, enter = decelerate (quint out), exit = accelerate (cubic in), consistent 0.45 s.
// Scenes: .scene[data-from] (hard cut + short push). Elements: [data-in] data-anim=up|scale|pop|drop|draw|logo|fade|type
// data-out = exit time. .chat stacks bubbles from the bottom and glides older ones up.
(function () {
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const quint = (x) => 1 - Math.pow(1 - x, 5);
  const cubicIn = (x) => x * x * x;
  const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const ENTER = 0.45, EXIT = 0.24, PUSH = 0.38;

  const stage = document.getElementById("stage");
  const DURATION = +stage.dataset.duration;
  window.DURATION = DURATION;
  const scenes = [...document.querySelectorAll(".scene")];
  scenes.forEach((s, i) => { s.style.zIndex = i + 1; s._inner = s.querySelector(".cam") || null; });
  const items = [...document.querySelectorAll("[data-in]")];

  // chat stacks: heights depend on the web font, so measure again once fonts have loaded
  const stacks = [...document.querySelectorAll(".chat")].map((chat) => {
    const kids = [...chat.children].filter((k) => k.dataset.in !== undefined);
    return { chat, kids, hs: [], gap: +chat.dataset.gap || 22, height: 0 };
  });
  let measuredWithFonts = false;
  function measure() {
    for (const st of stacks) {
      st.kids.forEach((k) => { k.style.visibility = "hidden"; k.style.display = "block"; k.style.transform = "none"; });
      st.hs = st.kids.map((k) => k.offsetHeight);
      st.kids.forEach((k) => { k.style.visibility = ""; });
      st.height = st.chat.offsetHeight;
    }
    measuredWithFonts = document.fonts.status === "loaded";
  }
  measure();
  const inStack = new Set(stacks.flatMap((s) => s.kids));

  const events = [];
  for (const el of document.querySelectorAll("[data-sfx]")) events.push({ t: +el.dataset.in + (+el.dataset.sfxAt || 0), type: el.dataset.sfx });
  events.sort((a, b) => a.t - b.t);
  window.EVENTS = events;

  function presence(el, t) {           // 0..1 how much an item occupies space (enter and exit both eased)
    const tin = +el.dataset.in, out = el.dataset.out ? +el.dataset.out : Infinity;
    return quint(clamp((t - tin) / ENTER)) * (1 - quint(clamp((t - out) / ENTER)));
  }

  window.render = function (t) {
    if (!measuredWithFonts && document.fonts.status === "loaded") measure();
    scenes.forEach((s, i) => {
      const from = +s.dataset.from;
      const next = scenes[i + 1];
      const to = next ? +next.dataset.from : DURATION + 1;
      const vis = t >= from && t < to;
      s.style.visibility = vis ? "visible" : "hidden";
      if (!vis) return;
      const p = i === 0 ? 1 : quint(clamp((t - from) / PUSH));
      s.style.transform = p >= 1 ? "none" : `translateY(${(1 - p) * 46}px)`;
      s.style.opacity = i === 0 ? 1 : 0.35 + 0.65 * p;
      const fadeOut = s.dataset.fadeOut ? clamp((t - +s.dataset.fadeOut) / 0.6) : 0;
      if (fadeOut > 0) s.style.opacity = String((1 - inOut(fadeOut)));
      if (s._inner) {
        const span = Math.max(1, to - from);
        s._inner.style.transform = `scale(${1 + 0.025 * clamp((t - from) / span)})`;
      }
    });

    for (const el of items) {
      if (inStack.has(el)) continue;
      const tin = +el.dataset.in, out = el.dataset.out ? +el.dataset.out : Infinity;
      const anim = el.dataset.anim || "up";
      const k = t - tin;
      if (t >= out) {
        const ex = el.dataset.exit !== undefined ? +el.dataset.exit : EXIT;
        const q = ex <= 0 ? 1 : cubicIn(clamp((t - out) / ex));
        el.style.opacity = 1 - q;
        el.style.transform = `translateY(${-28 * q}px)`;
        continue;
      }
      const p = tin < 0 ? 1 : quint(clamp(k / (+el.dataset.dur || ENTER)));
      if (anim === "up") {
        el.style.opacity = p; el.style.transform = `translateY(${(1 - p) * 42}px)`;
      } else if (anim === "fade") {
        el.style.opacity = p; el.style.transform = "none";
      } else if (anim === "scale") {
        const b = tin < 0 ? 1 : back(clamp(k / 0.5));
        el.style.opacity = clamp(k / 0.18) || (tin < 0 ? 1 : 0); el.style.transform = `scale(${0.9 + 0.1 * b})`;
      } else if (anim === "drop") {
        const b = back(clamp(k / 0.55));
        el.style.opacity = clamp(k / 0.15); el.style.transform = `translateY(${(1 - b) * -70}px) scale(${0.97 + 0.03 * b})`;
      } else if (anim === "draw") {
        el.style.opacity = k < 0 ? 0 : 1;
        el.querySelectorAll("[pathLength]").forEach((path) => { path.style.strokeDashoffset = String(1 - inOut(clamp(k / (+el.dataset.dur || 0.8)))); });
      } else if (anim === "type") {
        const full = el.dataset.text || (el.dataset.text = el.textContent);
        const n = Math.round(full.length * clamp(k / (+el.dataset.dur || 0.6)));
        el.textContent = k < 0 ? "" : full.slice(0, n);
        el.style.opacity = k < 0 ? 0 : 1;
      } else if (anim === "strike") {
        el.style.opacity = 1; el.style.transform = "none";
        const x = el.querySelector(".x"); if (x) x.style.transform = `scaleX(${inOut(clamp(k / 0.35))})`;
      } else if (anim === "logo") {
        el.style.opacity = k < 0 ? 0 : 1;
        el.querySelector(".house").style.strokeDashoffset = String(1 - inOut(clamp(k / 0.9)));
        el.querySelectorAll(".lt").forEach((lt, n) => {
          const q = quint(clamp((k - 0.45 - n * 0.05) / 0.4));
          lt.style.opacity = q; lt.style.transform = `translateY(${(1 - q) * 24}px)`;
        });
        el.querySelector(".bar").style.transform = `scaleX(${quint(clamp((k - 0.8) / 0.55))})`;
      }
    }

    // chat stacks: each item sits above all newer items that are present
    for (const st of stacks) {
      st.kids.forEach((el, i) => {
        const pres = presence(el, t);
        const tin = +el.dataset.in;
        if (t < tin || pres <= 0.001 && t > tin + 0.1) { el.style.display = "none"; return; }
        el.style.display = "block";
        let y = 0;
        for (let j = i + 1; j < st.kids.length; j++) y += (st.hs[j] + st.gap) * presence(st.kids[j], t);
        const k = t - tin;
        const s = 0.88 + 0.12 * back(clamp(k / 0.42));
        const topEdge = y + st.hs[i];
        const fadeTop = clamp((st.height - topEdge + 60) / 120);
        const gone = el.dataset.out && t >= +el.dataset.out;
        el.style.opacity = gone ? "0" : String(Math.min(clamp(k / 0.14), fadeTop));
        el.style.transform = `translateY(${-y}px) scale(${s})`;
      });
    }

    document.querySelectorAll(".typing i").forEach((d, i) => {
      const v = Math.max(0, Math.sin(t * 10 - i * 0.9));
      d.style.transform = `translateY(${-8 * v}px)`; d.style.opacity = 0.45 + 0.55 * v;
    });
  };
  window.render(0);
})();
