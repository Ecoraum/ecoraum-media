// Drives the animation page in headless Chromium and pipes frames into ffmpeg.
// Usage:
//   node render.js still OUT_DIR t1 t2 ...            -> PNG stills at those times (seconds)
//   node render.js video OUT.mp4 FROM TO [FPS]         -> silent MJPEG->H.264 segment for [FROM, TO)
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = __dirname;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".otf": "font/otf", ".png": "image/png", ".json": "application/json" };

function serve() {
  const fontDir = "/usr/share/fonts/opentype/inter";
  const server = http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split("?")[0]);
    let file = url.startsWith("/fonts/") ? path.join(fontDir, path.basename(url)) : path.join(ROOT, url === "/" ? "index.html" : url);
    if (!file.startsWith(ROOT) && !file.startsWith(fontDir)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function open(server) {
  const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-vsync"],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.error("[page]", m.text()); });
  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  return { browser, page };
}

async function main() {
  const [mode, out, ...rest] = process.argv.slice(2);
  const server = await serve();
  const { browser, page } = await open(server);
  try {
    if (mode === "still") {
      fs.mkdirSync(out, { recursive: true });
      for (const t of rest.map(Number)) {
        const t0 = Date.now();
        const data = await page.evaluate((tt) => window.renderAt(tt, "image/png"), t);
        fs.writeFileSync(path.join(out, `t_${t.toFixed(2)}.png`), Buffer.from(data.split(",")[1], "base64"));
        console.log(`still ${t}s in ${Date.now() - t0} ms`);
      }
    } else if (mode === "video") {
      const from = Number(rest[0]), to = Number(rest[1]), fps = Number(rest[2] || 30);
      const ff = spawn("ffmpeg", ["-nostdin", "-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "-",
        "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(fps), out], { stdio: ["pipe", "inherit", "inherit"] });
      const first = Math.round(from * fps), last = Math.round(to * fps);
      const started = Date.now();
      for (let f = first; f < last; f++) {
        const data = await page.evaluate((tt) => window.renderAt(tt, "image/jpeg"), f / fps);
        const buf = Buffer.from(data.split(",")[1], "base64");
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
        if ((f - first) % 60 === 0) {
          const done = f - first + 1, rate = (Date.now() - started) / done;
          console.log(`${out}: frame ${done}/${last - first} (${rate.toFixed(0)} ms/frame)`);
        }
      }
      ff.stdin.end();
      await new Promise((r) => ff.on("close", r));
      console.log(`${out}: done in ${((Date.now() - started) / 1000).toFixed(0)} s`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
