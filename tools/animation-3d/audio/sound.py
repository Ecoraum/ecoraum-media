"""Procedural music bed + sound effects for the Ecoraum explainer, mixed with the voice track.
Usage: python sound.py VOICE.wav OUT.wav"""
import subprocess
import sys

import numpy as np

SR = 48000
T = 95.0
N = int(T * SR)
rng = np.random.default_rng(7)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(d, a=0.005, r=0.2, shape=4.0):
    t = tt(d)
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-shape * t / max(r, 1e-4))
    return e


def bandnoise(d, lo, hi, seed=0):
    n = int(d * SR)
    x = np.random.default_rng(seed).standard_normal(n)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n)
    return y / (np.abs(y).max() + 1e-9)


def lowpass(x, cutoff):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def put(buf, t0, sig, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    j = min(len(buf), i + len(sig))
    s = sig[: j - i] * gain
    buf[i:j, 0] += s * np.sqrt(0.5 * (1 - pan))
    buf[i:j, 1] += s * np.sqrt(0.5 * (1 + pan))


def sine(f, d, ph=0):
    return np.sin(2 * np.pi * f * tt(d) + ph)


def sweep(f0, f1, d):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def add(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[: len(x)] += x
    return out


# ---------- effects ----------
def drip():
    return sweep(1700, 650, 0.09) * env(0.09, 0.001, 0.07, 3) * 0.9


def plink():
    return add(sweep(2200, 900, 0.12) * env(0.12, 0.001, 0.1, 4), 0.3 * sine(3300, 0.12) * env(0.12, 0.001, 0.03, 5)) * 0.7


def whoosh(d=0.6, lo=300, hi=4000, seed=1):
    n = bandnoise(d, lo, hi, seed)
    t = tt(d)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return n * e * 0.6


def thud(f=55, d=0.6):
    return add(sweep(f * 2.2, f, d) * env(d, 0.002, d, 5), bandnoise(d, 80, 900, 5) * env(d, 0.001, 0.05, 6) * 0.4) * 0.9


def click(d=0.03, lo=1500, hi=8000, seed=9):
    return bandnoise(d, lo, hi, seed) * env(d, 0.0005, 0.01, 6)


def chime(notes, d=1.2, gap=0.09):
    out = np.zeros(int((d + gap * len(notes)) * SR))
    for k, f in enumerate(notes):
        s = (sine(f, d) + 0.35 * sine(2 * f, d) + 0.12 * sine(3 * f, d)) * env(d, 0.003, d, 4)
        i = int(k * gap * SR)
        out[i:i + len(s)] += s
    return out * 0.35


def beep(f, d=0.12):
    return (np.sign(sine(f, d)) * 0.25 + sine(f, d) * 0.6) * env(d, 0.002, d, 1.2) * 0.5


def buzz(d=0.45):
    t = tt(d)
    s = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.4 + np.sin(2 * np.pi * 300 * t) * 0.3
    return lowpass(s, 900) * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.02) * 0.6


def sparks(d=1.3, seed=4):
    out = np.zeros(int(d * SR))
    r = np.random.default_rng(seed)
    for _ in range(int(d * 28)):
        i = r.integers(0, len(out) - 2000)
        c = bandnoise(0.025, 2500, 12000, int(r.integers(0, 999))) * env(0.025, 0.0003, 0.012, 6) * r.uniform(0.3, 1)
        out[i:i + len(c)] += c
    out += bandnoise(d, 60, 140, seed) * 0.15 * (0.5 + 0.5 * np.sin(2 * np.pi * 50 * tt(d)))
    return out * 0.7


def breaker():
    return add(click(0.06, 300, 4000, 2) * 2.0, thud(90, 0.25) * 0.6)


def powerdown(d=0.9):
    return sweep(220, 40, d) * env(d, 0.005, d, 2) * 0.35


def bell():
    return chime([659.3], 1.1) * 1.6, chime([523.3], 1.4) * 1.6


def stamp_hit():
    return add(thud(70, 0.45) * 1.1, click(0.05, 400, 3000, 11) * 1.4)


def pop(up=True):
    return sweep(500 if up else 900, 900 if up else 500, 0.08) * env(0.08, 0.002, 0.06, 3) * 0.45


def tick():
    return sine(2400, 0.03) * env(0.03, 0.0005, 0.02, 5) * 0.35


def ratchet(d=2.4, rate=11):
    out = np.zeros(int(d * SR))
    for k in range(int(d * rate)):
        c = click(0.02, 1200, 6000, k) * (0.6 if k % 2 else 0.9)
        i = int(k / rate * SR)
        out[i:i + len(c)] += c
    return out * 0.6


def engine(d=1.3):
    t = tt(d)
    s = np.sin(2 * np.pi * (45 + 15 * t / d) * t) * 0.5 + bandnoise(d, 40, 300, 21) * 0.4
    return s * np.sin(np.pi * t / d) * 0.6


def rewind(d=0.5):
    t = tt(d)
    s = bandnoise(d, 800, 6000, 31) * (0.5 + 0.5 * np.sin(2 * np.pi * (8 + 30 * t / d) * t))
    return add(s * np.sin(np.pi * t / d) * 0.55, sweep(1800, 300, d) * np.sin(np.pi * t / d) * 0.25)


def riser(d=2.2):
    t = tt(d)
    return add(bandnoise(d, 300, 7000, 41) * (t / d) ** 2 * 0.4, sweep(120, 480, d) * (t / d) ** 1.5 * 0.25)


def ambience(d, lo, hi, seed, gain):
    return bandnoise(d, lo, hi, seed) * gain


# ---------- music ----------
def note(name):
    names = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    pitch, octv = name[:-1], int(name[-1])
    return 440 * 2 ** ((names[pitch] + 12 * (octv - 4)) / 12)


def pad(freqs, d, bright=1.0):
    t = tt(d)
    s = np.zeros(len(t))
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            ff = f * 2 ** (det / 12)
            for h, amp in ((1, 1.0), (2, 0.35 * bright), (3, 0.14 * bright), (4, 0.06 * bright)):
                s += amp * np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6.28)) * (1 + 0.003 * np.sin(2 * np.pi * 0.3 * t))
    fade = np.minimum(1, t / 0.9) * np.minimum(1, (d - t) / 0.9)
    return s * fade / (len(freqs) * 3)


def pluck(f, d=0.6):
    return (sine(f, d) + 0.4 * sine(2 * f, d) + 0.15 * sine(3 * f, d)) * env(d, 0.002, d, 6) * 0.3


def build_music():
    m = np.zeros((N, 2))
    # 0-10.2: dark drone, rain-like air
    put(m, 0.0, pad([note("A1"), note("E2"), note("A2")], 10.6, 0.5), 0.55)
    # 10.2-59: minor progression, 4 s per chord
    prog = [["A2", "C3", "E3", "A3"], ["F2", "A2", "C3", "F3"], ["C3", "E3", "G3", "C4"], ["G2", "B2", "D3", "G3"]]
    t0 = 10.2
    k = 0
    while t0 < 59.0:
        put(m, t0 - 0.5, pad([note(n) for n in prog[k % 4]], 4.9, 0.8), 0.42)
        t0 += 4.0
        k += 1
    # soft clock pulse under the explanation
    for i in range(int((59.0 - 10.6) * 2)):
        put(m, 10.6 + i * 0.5, tick(), 0.25, pan=0.3 if i % 2 else -0.3)
    # 59-70.1: urgency: low heartbeat + dissonant pad
    put(m, 58.8, pad([note("A1"), note("A#2"), note("E3")], 11.6, 0.9), 0.48)
    for i in range(int((70.1 - 59.2) / 0.75)):
        tb = 59.2 + i * 0.75
        put(m, tb, thud(48, 0.35), 0.5)
        put(m, tb + 0.18, thud(44, 0.3), 0.32)
    # 70.1-72.4: riser into the approval
    put(m, 70.2, pad([note("D3"), note("G3"), note("C4")], 2.4, 0.6), 0.4)
    put(m, 70.2, riser(2.2), 0.6)
    # 72.4-95: resolution in C major with plucked arpeggios
    maj = [["C3", "E3", "G3", "C4"], ["G2", "B2", "D3", "G3"], ["A2", "C3", "E3", "A3"], ["F2", "A2", "C3", "F3"]]
    t0, k = 72.4, 0
    while t0 < 95:
        put(m, t0 - 0.3, pad([note(n) for n in maj[k % 4]], 4.6, 1.0), 0.45)
        arp = [note(n) * 2 for n in maj[k % 4]]
        for j in range(16):
            if t0 + j * 0.25 < 94.5:
                put(m, t0 + j * 0.25, pluck(arp[[0, 2, 1, 3][j % 4]]), 0.5 if j % 4 == 0 else 0.32, pan=-0.25 if j % 2 else 0.25)
        t0 += 4.0
        k += 1
    return lowpass(m[:, 0], 6000), lowpass(m[:, 1], 6000)


def build_sfx():
    s = np.zeros((N, 2))
    # Hook: TV room tone, drip, splash
    put(s, 0.0, ambience(2.2, 200, 1800, 1, 0.05) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * tt(2.2))))
    put(s, 0.9, drip(), 0.5)
    put(s, 1.5, plink(), 1.0)
    put(s, 1.5, bandnoise(0.3, 1500, 9000, 3) * env(0.3, 0.002, 0.2, 5), 0.35)
    for x in (2.35, 2.62, 2.9):
        put(s, x, plink(), 0.45, pan=0.2)
    put(s, 2.1, thud(40, 1.4), 0.6)
    # Building: rain, thunder
    put(s, 2.9, whoosh(0.5, 200, 3000, 2), 0.6)
    put(s, 3.0, ambience(2.4, 1500, 9000, 4, 0.12))
    put(s, 3.2, lowpass(bandnoise(2.0, 30, 400, 6), 300) * env(2.0, 0.2, 2.0, 2), 1.4)
    # Old days: buzzing, ringing, notifications
    for i in range(6):
        put(s, 5.35 + i * 0.42, buzz(0.28), 0.55)
    for i in range(4):
        put(s, 5.45 + i * 0.6, beep(880, 0.15), 0.35, pan=0.1)
        put(s, 5.62 + i * 0.6, beep(660, 0.15), 0.35, pan=0.1)
    for x in (5.85, 6.45, 7.0):
        put(s, x, chime([1046.5, 1318.5], 0.4, 0.06), 0.8)
    # Rewind glitch
    put(s, 7.95, rewind(0.55), 1.0)
    # Approval tap and success
    put(s, 8.3, whoosh(0.4, 400, 5000, 7), 0.4)
    put(s, 9.0, click(0.03, 2000, 9000, 3), 1.2)
    put(s, 9.12, chime([1046.5, 1568.0, 2093.0], 0.9, 0.07), 1.0)
    # Board: blocks land
    for x in (10.6, 10.75, 10.9, 11.05):
        put(s, x, thud(60, 0.5), 0.7)
    for i in range(int((23.6 - 11.4) / 0.72)):
        put(s, 11.4 + i * 0.72, beep(392, 0.1), 0.12)
    for x in (14.42, 15.24, 16.34):
        put(s, x, whoosh(0.9, 600, 6000, int(x)), 0.45, pan=-0.2)
        put(s, x + 1.0, pop(), 0.8)
    put(s, 18.2, whoosh(0.45, 1200, 9000, 12), 0.6, pan=0.2)
    put(s, 18.68, chime([1318.5, 1760.0], 0.5, 0.05), 0.7)
    put(s, 19.75, sweep(80, 320, 1.0) * env(1.0, 0.3, 1.0, 1.5), 0.35)
    put(s, 21.47, click(0.04, 600, 4000, 5), 0.9)
    put(s, 21.55, chime([784.0, 1046.5], 0.6, 0.08), 0.5)
    # Safety
    for i in range(3):
        put(s, 24.18 + i * 0.18, beep(1200, 0.1), 0.35)
    put(s, 27.05, sparks(1.4, 4), 0.9, pan=0.2)
    put(s, 27.69, sparks(0.8, 8), 0.8, pan=-0.2)
    put(s, 28.95, breaker(), 1.0)
    put(s, 29.08, powerdown(0.9), 1.0)
    put(s, 29.7, ambience(3.3, 1500, 9000, 14, 0.06))
    put(s, 32.12, add(thud(110, 0.25), click(0.04, 300, 2500, 8) * 0.8), 0.8)
    for x in (32.45, 33.0):
        put(s, x, add(plink() * 0.6, sine(500, 0.12) * env(0.12, 0.001, 0.1, 4) * 0.4), 0.6)
    put(s, 33.0, ambience(3.4, 1500, 9000, 15, 0.09))
    put(s, 33.0, ambience(2.8, 2000, 8000, 16, 0.06) * env(2.8, 0.1, 2.8, 0.2))
    a, b = bell()
    put(s, 34.05, a, 1.0)
    put(s, 34.42, b, 1.0)
    put(s, 35.3, sweep(900, 1400, 0.4) * env(0.4, 0.01, 0.4, 1.5) * 0.25, 0.8)
    # Chat
    put(s, 36.4, whoosh(0.5, 300, 4000, 17), 0.5)
    for x, up in ((37.3, False), (38.5, True), (39.0, True), (40.25, False), (41.45, True), (42.35, False), (55.88, True)):
        put(s, x, pop(up), 1.0, pan=0.25 if up else -0.25)
    put(s, 43.0, beep(220, 0.18), 0.5)
    put(s, 43.0, whoosh(0.4, 1500, 8000, 18), 0.3)
    for x in (44.2, 45.18, 50.28, 51.52, 52.1, 53.78):
        put(s, x, tick(), 1.6)
    put(s, 48.3, chime([1568.0, 2093.0], 0.6, 0.05), 0.4)
    put(s, 56.9, whoosh(0.5, 300, 5000, 19), 0.6)
    put(s, 58.18, stamp_hit(), 1.0)
    # Ecoraum takes over
    put(s, 59.0, whoosh(0.55, 200, 3000, 20), 0.7)
    put(s, 59.55, thud(45, 0.9), 1.0)
    put(s, 62.46, tick(), 1.5)
    put(s, 62.96, sweep(300, 600, 0.3) * env(0.3, 0.01, 0.3, 2) * 0.3, 0.8)
    put(s, 64.33, add(thud(40, 1.2) * 1.2, bandnoise(0.8, 200, 3000, 22) * env(0.8, 0.002, 0.8, 4) * 0.5), 1.0)
    for i in range(3):
        put(s, 64.4 + i * 0.33, beep(740, 0.14), 0.3)
    put(s, 65.75, sweep(400, 1600, 0.8) * env(0.8, 0.05, 0.8, 1.0) * 0.25, 0.8)
    put(s, 66.55, chime([1174.7, 1568.0], 0.5, 0.06), 0.7)
    put(s, 67.6, whoosh(0.85, 600, 6000, 23), 0.4, pan=-0.2)
    put(s, 68.45, pop(), 0.8)
    put(s, 68.9, whoosh(0.8, 600, 6000, 24), 0.4, pan=0.2)
    put(s, 69.7, chime([1318.5, 1760.0], 0.4, 0.05), 0.6)
    # Approval
    put(s, 70.25, whoosh(0.9, 500, 5000, 25), 0.45)
    put(s, 71.15, chime([880.0, 1174.7], 0.6, 0.12), 0.6)
    put(s, 71.4, ambience(2.4, 300, 2500, 26, 0.035))
    for x in (71.6, 72.1, 73.2):
        put(s, x, add(click(0.02, 3000, 9000, int(x * 10)) * 0.5, sine(3500, 0.05) * env(0.05, 0.001, 0.04, 4) * 0.2), 0.6)
    put(s, 72.4, click(0.03, 2000, 9000, 4), 1.2)
    put(s, 72.52, chime([1046.5, 1318.5, 1568.0, 2093.0], 1.4, 0.08), 1.2)
    put(s, 73.95, whoosh(0.6, 800, 8000, 27), 0.5)
    put(s, 74.55, chime([1568.0], 0.4), 0.6)
    put(s, 74.6, engine(1.3), 0.9)
    # Repair and closure
    put(s, 76.0, ratchet(2.5), 0.8)
    put(s, 76.74, pop(False), 1.0, pan=-0.25)
    put(s, 78.56, pop(True), 1.0, pan=0.25)
    put(s, 79.6, whoosh(0.5, 300, 5000, 28), 0.5)
    put(s, 80.97, stamp_hit(), 1.0)
    put(s, 81.05, chime([1046.5, 1318.5, 1568.0], 0.9, 0.07), 0.8)
    put(s, 82.0, whoosh(0.4, 300, 4000, 29), 0.4)
    put(s, 87.9, chime([1568.0, 2093.0, 2637.0], 1.6, 0.06), 0.6)
    put(s, 90.6, chime([2093.0, 2637.0], 0.8, 0.05), 0.4)
    return s


def main():
    voice_path, out = sys.argv[1], sys.argv[2]
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", voice_path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    v = np.frombuffer(raw, np.float32)[:N]
    v = np.pad(v, (0, N - len(v)))
    v = v / (np.sqrt(np.mean(v[v != 0] ** 2)) + 1e-9) * 0.12
    # Ducking envelope from the voice
    def movavg(x, w):
        c = np.cumsum(np.concatenate([[0.0], x]))
        y = (c[w:] - c[:-w]) / w
        pad = (len(x) - len(y))
        return np.concatenate([np.full(pad // 2, y[0]), y, np.full(pad - pad // 2, y[-1])])
    e = np.sqrt(movavg(v.astype(np.float64) ** 2, int(0.05 * SR)))
    e = movavg(e, int(0.25 * SR))
    duck = 1 - 0.5 * np.clip(e / 0.05, 0, 1)
    ml, mr = build_music()
    music = np.stack([ml, mr], 1)
    music = music / (np.abs(music).max() + 1e-9) * 0.28
    sfx = build_sfx()
    sfx = sfx / (np.abs(sfx).max() + 1e-9) * 0.35
    sduck = 1 - 0.35 * np.clip(e / 0.05, 0, 1)
    mix = music * duck[:, None] + sfx * sduck[:, None] + np.stack([v, v], 1)
    fade = np.ones(N)
    fade[-int(2.0 * SR):] = np.linspace(1, 0, int(2.0 * SR))
    mix *= fade[:, None]
    tmp = out + ".raw.wav"
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", tmp], input=mix.astype(np.float32).tobytes(), check=True)
    probe = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-nostats", "-i", tmp, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], check=True, capture_output=True, text=True).stderr
    import json
    m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", tmp, "-af", ln, "-ar", str(SR), out], check=True)
    print("ok", out)


if __name__ == "__main__":
    main()
