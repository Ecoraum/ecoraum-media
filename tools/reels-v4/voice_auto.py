"""Find out which reel a voice memo belongs to, then run voice_in.py for it.
Usage: python3 -I voice_auto.py <memo> <script.json> <out_dir>
Transcribes the whole memo once with the local Whisper model and picks the script with the best text match."""
import difflib, glob, json, os, re, subprocess, sys
import numpy as np
import sherpa_onnx

HERE = os.path.dirname(os.path.abspath(__file__))
memo, script_path, out_dir = sys.argv[1:4]
scripts = json.load(open(script_path))
os.makedirs(out_dir, exist_ok=True)
tmp = os.path.join(out_dir, "auto.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", memo, "-ac", "1", "-ar", "16000", tmp], check=True)
import wave
with wave.open(tmp) as w:
    x = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float32) / 32768
d = glob.glob(os.path.join(HERE, "asr", "m", "*"))[0]
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=glob.glob(d + "/*encoder.int8.onnx")[0], decoder=glob.glob(d + "/*decoder.int8.onnx")[0],
                                                 tokens=glob.glob(d + "/*tokens.txt")[0], language="de", task="transcribe", num_threads=4)
heard = []
for a in range(0, len(x), 16000 * 25):          # Whisper works on ≤30 s windows
    s = rec.create_stream(); s.accept_waveform(16000, x[a:a + 16000 * 25]); rec.decode_stream(s); heard.append(s.result.text)
heard = " ".join(heard)
def norm(t):
    t = t.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return " ".join(re.sub(r"[^a-z0-9 ]+", " ", t).split())
scores = {vid: difflib.SequenceMatcher(None, norm(heard), norm(" ".join(l["say"] for l in ls))).ratio() for vid, ls in scripts.items()}
best = max(scores, key=scores.get)
print("match per video:", ", ".join(f"{k} {v:.2f}" for k, v in sorted(scores.items(), key=lambda kv: -kv[1])))
if scores[best] < 0.45:
    print("UNSURE: this memo does not match any script"); sys.exit(3)
sys.exit(subprocess.run([sys.executable, "-I", os.path.join(HERE, "voice_in.py"), memo, script_path, best, out_dir]).returncode)
