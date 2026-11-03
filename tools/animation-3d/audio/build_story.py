"""Place the chosen takes at absolute times and time every word.
Usage: python build_story.py story_audio.json OUTDIR"""
import json, os, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
sys.path.insert(0, os.path.dirname(__file__))
from build import read_pcm, align, SR, PRE

cfg = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
src = {k: read_pcm(v, SR) for k, v in cfg["sources"].items()}
model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=4)
total = int(cfg["total"] * SR)
track = np.zeros(total, np.float32)
fade = int(0.025 * SR); ramp = np.linspace(0, 1, fade, dtype=np.float32)
words, pieces = [], []
for p in cfg["pieces"]:
    clip = src[p["src"]][int(p["s"] * SR): int(p["e"] * SR)].copy()
    clip[:fade] *= ramp; clip[-fade:] *= ramp[::-1]
    i0 = int(p["at"] * SR)
    track[i0:i0 + len(clip)] += clip
    dur = len(clip) / SR
    segs, _ = model.transcribe(clip[::3], language="de", word_timestamps=True, condition_on_previous_text=False, initial_prompt=p["text"])
    rec = [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]
    for w in align(p["text"], rec, dur):
        words.append({"id": p["id"], "w": w["w"], "s": round(p["at"] + w["s"], 3), "e": round(p["at"] + min(w["e"], dur), 3)})
    pieces.append({"id": p["id"], "speaker": p["src"], "s": p["at"], "e": round(p["at"] + dur, 3)})
raw = os.path.join(out, "voice_raw.wav")
subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", raw], input=track.tobytes(), check=True)
subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-i", raw, "-af", PRE, os.path.join(out, "voice.wav")], check=True)
json.dump({"pieces": pieces, "words": words}, open(os.path.join(out, "story_timeline.json"), "w"), ensure_ascii=False, indent=1)
print("ok")
