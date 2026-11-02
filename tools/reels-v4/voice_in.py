"""Turn a founder's voice memo into voice lines that sit on a v4 reel.

Usage: python3 -I voice_in.py <memo> <script.json> <video_id> <out_dir>
  memo        any format ffmpeg reads (m4a from iPhone Voice Memos, ogg/opus, mp3, wav)
  script.json lines per video: {video_id: [{sec, at, ca, say, ...}]} (sec = song section A–E, at = planned start,
              ca = expected length in seconds)

How it works: decode → gentle clean-up → split into speech chunks at pauses → transcribe each chunk with a local
Whisper model → align chunks to the script by text (a line may span up to three chunks; extra chunks such as
slips, retakes and coughs are skipped; with two good takes the later one wins) → polish each line → place lines
one after another inside their song section (speed up ≤ 12 % only if a section overflows).
Writes <out_dir>/<video>-<n>.wav and <out_dir>/<video>.vo.json. Exit 2 = could not map, 3 = not sure (wrong video?).
"""
import difflib
import glob
import json
import os
import re
import subprocess
import sys
import wave

import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
memo, script_path, vid, out_dir = sys.argv[1:5]
lines = json.load(open(script_path))[vid]
os.makedirs(out_dir, exist_ok=True)
raw = os.path.join(out_dir, f"{vid}.memo.wav")

# 1) decode + gentle clean-up (high-pass, mild FFT denoise so the voice stays natural)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", memo, "-ac", "1", "-ar", str(SR),
                "-af", "highpass=f=75,afftdn=nr=10:nf=-45:tn=1", raw], check=True)
with wave.open(raw) as w:
    x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32768

# 2) speech chunks on 20 ms frames
HOP = int(0.02 * SR)
n = len(x) // HOP
db = 20 * np.log10(np.sqrt((x[: n * HOP].reshape(n, HOP) ** 2).mean(1)) + 1e-9)
thr = max(np.percentile(db, 10) + 10, np.percentile(db, 98) - 32)
chunks, start = [], None
for i, v in enumerate(db > thr):
    if v and start is None:
        start = i
    if not v and start is not None:
        chunks.append([start, i]); start = None
if start is not None:
    chunks.append([start, n])
merged = []
for c in chunks:
    if merged and (c[0] - merged[-1][1]) * 0.02 < 0.25:
        merged[-1][1] = c[1]
    else:
        merged.append(c)
chunks = [c for c in merged if (c[1] - c[0]) * 0.02 >= 0.15]
if not chunks:
    print(f"MISMATCH {vid}: no speech found in the memo"); sys.exit(2)


def norm(t):
    t = t.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    words = {"1": "eins", "2": "zwei", "3": "drei", "4": "vier", "5": "fuenf", "6": "sechs", "7": "sieben", "8": "acht",
             "9": "neun", "10": "zehn", "11": "elf", "12": "zwoelf"}
    t = re.sub(r"\b(\d{1,2})[.:]00\b", lambda m: words.get(m.group(1), m.group(1)), t)
    t = re.sub(r"\b(\d{1,2})\b", lambda m: words.get(m.group(1), m.group(1)), t)
    return re.sub(r"[^a-z0-9 ]+", " ", t).split()


def sim(a, b):
    a, b = " ".join(norm(a)), " ".join(norm(b))
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio() if a and b else 0.0


# 3) transcribe chunks (local Whisper base via sherpa-onnx); without the model fall back to lengths only
texts = None
model_dir = (glob.glob(os.path.join(HERE, "asr", "m", "*")) or [None])[0]
try:
    import sherpa_onnx  # noqa: E402
    enc = glob.glob(os.path.join(model_dir, "*encoder.int8.onnx"))[0]
    dec = glob.glob(os.path.join(model_dir, "*decoder.int8.onnx"))[0]
    tok = glob.glob(os.path.join(model_dir, "*tokens.txt"))[0]
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=enc, decoder=dec, tokens=tok, language="de", task="transcribe", num_threads=4)
    texts = []
    for c in chunks:
        seg = x[max(0, c[0] * HOP - int(0.05 * SR)): c[1] * HOP + int(0.05 * SR)].astype(np.float32)
        s = rec.create_stream(); s.accept_waveform(SR, seg); rec.decode_stream(s)
        texts.append(s.result.text.strip())
except Exception as e:  # noqa: BLE001
    print(f"(no speech recognition available: {e}; matching by length only)")

# 4) align chunks to lines. dp over (chunks used, lines matched); a line takes 1–3 consecutive chunks, chunks can be skipped.
M, N = len(chunks), len(lines)


def dur(i, j):
    return (chunks[j][1] - chunks[i][0]) * 0.02


long_pause_after = [i < M - 1 and (chunks[i + 1][0] - chunks[i][1]) * 0.02 >= 2.4 for i in range(M)]


def restarts(i):
    """True when chunk i is a slip: its words come again right at the start of the next chunk."""
    if texts is None or i >= M - 1:
        return False
    a, b = norm(texts[i]), norm(texts[i + 1])
    if not a or not b:
        return False
    head = b[: len(a) + 1]
    return difflib.SequenceMatcher(None, a, head, autojunk=False).ratio() >= 0.6


slip = [restarts(i) for i in range(M)]


def line_cost(i, j, k):
    # long pauses inside one line are unnatural; slips glued into a line sound like stuttering
    inner = sum(max(0.0, (chunks[q][0] - chunks[q - 1][1]) * 0.02 - 0.45) for q in range(i + 1, j + 1))
    glued_slip = any(slip[q] for q in range(i, j))
    if texts is not None:
        s = sim(" ".join(texts[i:j + 1]), lines[k]["say"])
        return 1.0 - s + 0.25 * inner + (0.6 if glued_slip else 0.0), s
    r = dur(i, j) / lines[k].get("ca", 1.5)
    return float(np.log(max(r, 0.05)) ** 2), None


INF = float("inf")
best = [[(INF, None)] * (N + 1) for _ in range(M + 1)]
best[0][0] = (0.0, None)
for i in range(M + 1):
    for k in range(N + 1):
        c, _ = best[i][k]
        if c == INF or i == M:
            continue
        skip = 0.05 if slip[i] else 0.12 if long_pause_after[i] else 0.55   # slips and chunks before a long pause are cheap to drop
        if c + skip < best[i + 1][k][0]:
            best[i + 1][k] = (c + skip, (i, k, "skip"))
        if k < N:
            for j in range(i, min(M, i + 3)):
                lc, _ = line_cost(i, j, k)
                v = c + lc - 0.002 * j                      # tiny bias: with two equal takes, the later one wins
                if v < best[j + 1][k + 1][0]:
                    best[j + 1][k + 1] = (v, (i, k, j))
if best[M][N][0] == INF:
    print(f"MISMATCH {vid}: memo has {M} chunks but the script has {N} lines"); sys.exit(2)
spans, i, k = {}, M, N
while (i, k) != (0, 0):
    prev = best[i][k][1]
    if prev[2] == "skip":
        i = prev[0]
        continue
    pi, pk, pj = prev
    spans[pk] = (pi, pj)
    i, k = pi, pk
takes, scores = [], []
for k in range(N):
    a, b = spans[k]
    takes.append([chunks[a][0], chunks[b][1]])
    _, s = line_cost(a, b, k)
    scores.append(s)
    heard = (" | heard: " + " ".join(texts[a:b + 1])) if texts else ""
    print(f"  line {k + 1}: {dur(a, b):4.1f}s{'' if s is None else f'  match {s:.2f}'}  {lines[k]['say']}{heard}")
if texts is not None:
    weak = [k + 1 for k, s in enumerate(scores) if s < 0.45]
    if len(weak) >= max(2, N // 3) or np.mean(scores) < 0.5:
        print(f"UNSURE {vid}: lines {weak} don't sound like the script (avg match {np.mean(scores):.2f}). Wrong video or skipped lines?")
        sys.exit(3)
    if weak:
        print(f"  check: line(s) {weak} matched only weakly")

# 5) polish each line, then place lines one after another inside their song section
CHAIN = ("highpass=f=80,equalizer=f=190:t=q:w=1.0:g=1.0,equalizer=f=320:t=q:w=1.2:g=-2,"
         "equalizer=f=3400:t=q:w=1.0:g=2.5,deesser=i=0.4,acompressor=threshold=-24dB:ratio=3.5:attack=4:release=90:makeup=6,"
         "alimiter=limit=0.89:level=false")
SECTIONS = {"A": 3.85, "B": 7.7, "C": 13.48, "D": 15.4, "E": 18.2}   # section end times in the 18.2 s cut
cuts = []
for s in takes:
    a = max(0, s[0] * HOP - int(0.05 * SR)); b = min(len(x), s[1] * HOP + int(0.08 * SR))
    seg = x[a:b]
    seg = seg * np.clip(np.arange(len(seg)) / (0.01 * SR), 0, 1) * np.clip((len(seg) - np.arange(len(seg))) / (0.03 * SR), 0, 1)
    cuts.append(seg)


def render(k, seg, tempo):
    tmp = os.path.join(out_dir, f"{vid}-{k}.cut.wav")
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(seg, -1, 1) * 32767).astype("<i2").tobytes())
    dst = os.path.join(out_dir, f"{vid}-{k}.wav")
    af = CHAIN + (f",atempo={tempo:.3f}" if tempo > 1.0 else "")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", af, "-ar", str(SR), "-ac", "1", dst], check=True)
    os.remove(tmp)
    with wave.open(dst) as w:
        return w.getnframes() / SR


tempo = [1.0] * N
durs = [render(k, seg, 1.0) for k, seg in enumerate(cuts, start=1)]


def place(durs):
    starts, end = [], 0.0
    for ln, d in zip(lines, durs):
        # planned start if the script has one (fixed music timeline), otherwise voice-led: natural 0.3 s breath
        st = max(ln["at"], end + 0.15) if "at" in ln else (end + 0.3 if starts else 0.3)
        starts.append(st); end = st + d
    return starts


for sec, sec_end in SECTIONS.items():
    idx = [i for i, ln in enumerate(lines) if ln.get("sec") == sec]
    if not idx:
        continue
    starts = place(durs)
    over = starts[idx[-1]] + durs[idx[-1]] - (sec_end + 0.2)
    if over > 0:
        spoken = sum(durs[i] for i in idx)
        t = min(1.12, spoken / max(0.1, spoken - over))
        for i in idx:
            tempo[i] = t
            durs[i] = render(i + 1, cuts[i], t)
starts = place(durs)
vo = []
for i, ln in enumerate(lines):
    sec_end = SECTIONS.get(ln.get("sec"), 18.2)
    vo.append({"id": f"{vid}-{i + 1}", "start": round(starts[i], 3), "dur": round(durs[i], 3), "say": ln["say"],
               "late": round(starts[i] - ln.get("at", starts[i]), 2),
               "spill": round(max(0.0, starts[i] + durs[i] - sec_end), 2) if "sec" in ln else 0.0,
               "tempo": round(tempo[i], 3)})
json.dump(vo, open(os.path.join(out_dir, f"{vid}.vo.json"), "w"), ensure_ascii=False, indent=1)
spill = [f"{v['id']} +{v['spill']}s" for v in vo if v["spill"] > 0.25]
print(f"OK {vid}: {N} lines" + (f"; runs past its section: {', '.join(spill)}" if spill else "; everything fits the music"))
