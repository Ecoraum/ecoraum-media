// node render-reel3.cjs <page.html> <outBase> video | stills t1,t2,...
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
(async () => {
  const [page, outBase, mode, list] = process.argv.slice(2);
  const fps = 30;
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const errors = [];
  tab.on("pageerror", (e) => errors.push(String(e)));
  await tab.goto("file://" + path.resolve(page));
  await tab.evaluate(() => document.fonts.ready);
  if (errors.length) { console.error("PAGE ERRORS:", errors); process.exit(1); }
  const meta = await tab.evaluate(() => ({ duration: window.DURATION, events: window.EVENTS, vo: window.VO }));
  if (mode === "stills") {
    for (const t of list.split(",").map(Number)) {
      await tab.evaluate((x) => window.render(x), t);
      await tab.screenshot({ path: `${outBase}-${t.toFixed(2)}.png` });
    }
    await browser.close();
    return;
  }
  fs.writeFileSync(`${outBase}.meta.json`, JSON.stringify(meta, null, 1));
  const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${outBase}.video.mp4`],
    { stdio: ["pipe", "inherit", "inherit"] });
  const frames = Math.round(meta.duration * fps);
  for (let f = 0; f < frames; f++) {
    await tab.evaluate((x) => window.render(x), f / fps);
    const buf = await tab.screenshot({ type: "png" });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await browser.close();
  console.log(`${outBase}: ${frames} frames, ${meta.events.length} cues, ${(meta.vo || []).length} voice lines`);
})();
