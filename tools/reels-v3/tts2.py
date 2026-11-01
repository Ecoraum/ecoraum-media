"""Calm narrator lines with Piper (Thorsten, CC0).

Usage: python3 -I tts2.py lines.json outdir model.onnx
lines.json: [{id, say, show}]  ->  outdir/<id>.raw.wav (22.05 kHz) and durations.json
Each sentence is synthesized on its own and joined with a short breath pause,
which gives a calmer cadence than stretching the whole line.
"""
import io
import json
import re
import sys
import wave

import numpy as np
from piper import PiperVoice, SynthesisConfig

lines = json.load(open(sys.argv[1]))
outdir = sys.argv[2]
model = sys.argv[3]
voice = PiperVoice.load(model, config_path=model + ".json")
SR = 22050
cfg = SynthesisConfig(length_scale=1.38, noise_scale=0.6, noise_w_scale=0.75)


def synth(text):
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=cfg)
    buf.seek(0)
    with wave.open(buf) as r:
        x = np.frombuffer(r.readframes(r.getnframes()), "<i2").astype(np.float64) / 32768
    # trim leading/trailing silence (keeps 30 ms)
    env = np.abs(x) > 0.01
    if env.any():
        a, b = np.argmax(env), len(x) - np.argmax(env[::-1])
        x = x[max(0, a - int(0.03 * SR)): min(len(x), b + int(0.03 * SR))]
    return x


out = {}
for item in lines:
    parts = [p.strip() for p in re.split(r"(?<=[.?!])\s+", item["say"]) if p.strip()]
    chunks = []
    for i, p in enumerate(parts):
        if i:
            chunks.append(np.zeros(int(0.32 * SR)))
        chunks.append(synth(p))
    x = np.concatenate(chunks)
    x = x / (np.abs(x).max() + 1e-9) * 0.89
    with wave.open(f"{outdir}/{item['id']}.raw.wav", "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    out[item["id"]] = {"dur": len(x) / SR, "show": item["show"]}
    print(f"{item['id']:8s} {len(x)/SR:5.2f}s  {len(item['show'])/(len(x)/SR):4.1f} Zeichen/s  {item['show']}")
json.dump(out, open(f"{outdir}/durations.json", "w"), ensure_ascii=False, indent=1)
