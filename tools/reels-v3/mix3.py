"""Mix one v3 reel: the song (part two), the narrator, subtle UI sounds.

Usage: python3 -I mix3.py meta.json song_bed.wav vo_dir out.wav [silent_id,silent_id]
While the narrator speaks, the music is ducked per band: mids (where the violins and the voice
overlap) by about 20 dB, bass by 6 dB, highs by 9 dB. Lines listed as silent are shown as text only.
"""
import json
import os
import sys
import wave

import numpy as np

SR = 44100
meta_path, bed_path, vo_dir, out_path = sys.argv[1:5]
silent = set(sys.argv[5].split(",")) if len(sys.argv) > 5 and sys.argv[5] else set()
meta = json.load(open(meta_path))
dur = meta["duration"]
n = int(dur * SR)
rng = np.random.default_rng(5)


def read(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR, path
        x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels())


def place(buf, sig, t, gain=1.0):
    i = int(round(t * SR))
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain


# music bed
bed = read(bed_path)
music = np.zeros((n, 2))
music[: min(n, len(bed))] = bed[:n]

# narrator
vo = np.zeros(n)
for line in meta.get("vo", []):
    if line["id"] in silent:
        continue
    p = os.path.join(vo_dir, f"{line['id']}.wav")
    if os.path.exists(p):
        place(vo, read(p)[:, 0], line["start"])

# ducking: envelope follower on the voice, fast attack, slow release
env = np.zeros(n)
a_att, a_rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.38 * SR))
acc = 0.0
absvo = np.abs(vo)
for i in range(n):
    v = absvo[i]
    acc = a_att * acc + (1 - a_att) * v if v > acc else a_rel * acc + (1 - a_rel) * v
    env[i] = acc
act = np.clip(env / 0.05, 0, 1)

# split the music into bass / mids / highs (linear-phase FFT masks with soft crossovers)
F = np.fft.rfft(music, axis=0)
f = np.fft.rfftfreq(n, 1 / SR)[:, None]
def xfade(fc, w):  # 0 below fc-w, 1 above fc+w
    return 0.5 - 0.5 * np.cos(np.pi * np.clip((f - (fc - w)) / (2 * w), 0, 1))
up_low, up_high = xfade(260, 60), xfade(5000, 800)
bands = [np.fft.irfft(F * m, n, axis=0) for m in (1 - up_low, up_low - up_high, up_high)]
gains = [1 - 0.50 * act, 1 - 0.90 * act, 1 - 0.65 * act]
music = sum(b * g[:, None] for b, g in zip(bands, gains))
duck = np.ones(n)


# subtle UI sounds
def pop(f0, f1):
    m = int(0.12 * SR); t = np.arange(m) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.018)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * (1 - np.exp(-t / 0.0012)) * np.exp(-t / 0.035)


def tick():
    m = int(0.07 * SR); t = np.arange(m) / SR
    return (np.sin(2 * np.pi * 1760 * t) + 0.4 * np.sin(2 * np.pi * 3520 * t)) * np.exp(-t / 0.01)


def ding():
    m = int(1.2 * SR); t = np.arange(m) / SR; out = np.zeros(m)
    for f, d, lvl in ((1318.5, 0.0, 0.55), (1975.5, 0.09, 0.42)):
        i = int(d * SR); tt = t[: m - i]
        out[i:] += np.sin(2 * np.pi * f * tt) * (1 - np.exp(-tt / 0.002)) * np.exp(-tt / 0.35) * lvl
    return out


def shimmer():
    m = int(2.6 * SR); t = np.arange(m) / SR; y = np.zeros(m)
    for k, f in enumerate((1046.5, 1568.0, 2093.0, 2637.0)):
        y += np.sin(2 * np.pi * f * t + k) * (1 + 0.3 * np.sin(2 * np.pi * (5 + k) * t))
    return y * (1 - np.exp(-t / 0.15)) * np.exp(-t / 1.0) * 0.1


cues = {"pop-out": lambda: pop(1150, 820) * 0.16, "pop-in": lambda: pop(820, 560) * 0.14,
        "tick": lambda: tick() * 0.12, "ding": lambda: ding() * 0.3, "logo": lambda: shimmer() * 1.6}
sfx = np.zeros(n)
for ev in meta.get("events", []):
    if ev["type"] in cues:
        place(sfx, cues[ev["type"]](), ev["t"])

mix = music * (0.62 * duck)[:, None] + (0.92 * vo + 0.8 * sfx)[:, None]
mix /= np.abs(mix).max() / 0.89
with wave.open(out_path, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
speech = act > 0.5
print(f"{out_path}: {dur:.2f}s, voice lines {len(meta.get('vo', []))}, speech {speech.mean() * 100:.0f}% of the time")
