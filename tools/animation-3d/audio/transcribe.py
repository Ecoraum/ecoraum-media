import json
import sys

from faster_whisper import WhisperModel

import subprocess

import numpy as np

path, out = sys.argv[1], sys.argv[2]
# Decode with ffmpeg ourselves: the installed PyAV no longer accepts faster-whisper's open() arguments.
pcm = subprocess.run(
    ["ffmpeg", "-nostdin", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
    check=True, capture_output=True,
).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768.0
model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=4)
segments, info = model.transcribe(
    audio,
    language="de",
    word_timestamps=True,
    vad_filter=False,
    beam_size=5,
    condition_on_previous_text=False,
)
result = []
for s in segments:
    words = [{"w": w.word, "s": round(w.start, 2), "e": round(w.end, 2), "p": round(w.probability, 2)} for w in (s.words or [])]
    result.append({"s": round(s.start, 2), "e": round(s.end, 2), "text": s.text.strip(), "words": words})
    print(f"[{s.start:7.2f} - {s.end:7.2f}] {s.text.strip()}", flush=True)
with open(out, "w") as f:
    json.dump(result, f, ensure_ascii=False, indent=1)
