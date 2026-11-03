"""Assemble the voice track from the chosen takes and time every caption word.

Usage: python build.py cuts.json OUTDIR
Writes OUTDIR/voice.wav (clean, not yet loudness-normalised), OUTDIR/voice.m4a (-16 LUFS)
and OUTDIR/timeline.json (pieces and words on the final timeline).
"""
import difflib
import json
import os
import re
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

SR = 48000
PRE = "highpass=f=80,afftdn=nf=-55,acompressor=threshold=-24dB:ratio=2.5:attack=10:release=150"


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", *args], check=True)


def read_pcm(path, rate):
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(rate), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, np.float32)


def norm(token):
    return re.sub(r"[^a-z0-9äöüß]", "", token.lower())


def align(text, recognised, duration):
    """Give every word of the written text a start/end from the recognised words."""
    words = text.split()
    a = [norm(w) for w in words]
    b = [norm(w["w"]) for w in recognised]
    times = [None] * len(words)
    for block in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_matching_blocks():
        for k in range(block.size):
            r = recognised[block.b + k]
            times[block.a + k] = [r["s"], r["e"]]
    # Fill gaps by spreading the unmatched words between their matched neighbours.
    i = 0
    while i < len(words):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(words) and times[j] is None:
            j += 1
        lo = times[i - 1][1] if i > 0 else 0.0
        hi = times[j][0] if j < len(words) else duration
        step = max(hi - lo, 0.05 * (j - i)) / (j - i)
        for k in range(i, j):
            times[k] = [lo + step * (k - i), lo + step * (k - i + 1)]
        i = j
    return [{"w": w, "s": t[0], "e": t[1]} for w, t in zip(words, times)]


def main():
    cuts = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    sources = {k: read_pcm(v, SR) for k, v in cuts["sources"].items()}
    model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=4)

    fade = int(0.025 * SR)
    ramp = np.linspace(0, 1, fade, dtype=np.float32)
    chunks, pieces, words, t = [], [], [], 0.0
    for p in cuts["pieces"]:
        gap = np.zeros(int(round(p["gap"] * SR)), np.float32)
        clip = sources[p["src"]][int(p["s"] * SR): int(p["e"] * SR)].copy()
        clip[:fade] *= ramp
        clip[-fade:] *= ramp[::-1]
        chunks += [gap, clip]
        t += len(gap) / SR
        dur = len(clip) / SR

        audio16 = clip[::3]  # 48 kHz -> 16 kHz for the recogniser
        segs, _ = model.transcribe(audio16, language="de", word_timestamps=True,
                                   condition_on_previous_text=False, initial_prompt=p["text"])
        rec = [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]
        heard = " ".join(r["w"] for r in rec)
        print(f"{p['src']:5} {p['s']:7.2f}-{p['e']:7.2f} | {heard}", flush=True)
        for w in align(p["text"], rec, dur):
            words.append({"w": w["w"], "s": round(t + max(w["s"], 0.0), 3), "e": round(t + min(w["e"], dur), 3),
                          "speaker": p["src"], "step": p["step"]})
        pieces.append({"speaker": p["src"], "step": p["step"], "s": round(t, 3), "e": round(t + dur, 3)})
        t += dur

    raw = os.path.join(out, "voice_raw.wav")
    voice = np.concatenate(chunks)
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    raw], input=voice.tobytes(), check=True)
    clean = os.path.join(out, "voice.wav")
    ffmpeg("-i", raw, "-af", PRE, clean)

    probe = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-nostats", "-i", clean, "-af",
                            "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                           check=True, capture_output=True, text=True).stderr
    m = json.loads(probe[probe.rindex("{"): probe.rindex("}") + 1])
    ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    ffmpeg("-i", clean, "-af", ln, "-ar", str(SR), "-c:a", "pcm_s16le", os.path.join(out, "voice_norm.wav"))
    ffmpeg("-i", os.path.join(out, "voice_norm.wav"), "-c:a", "aac", "-b:a", "192k", os.path.join(out, "voice.m4a"))

    json.dump({"duration": round(t, 3), "pieces": pieces, "words": words},
              open(os.path.join(out, "timeline.json"), "w"), ensure_ascii=False, indent=1)
    print(f"total {t:.2f}s", flush=True)


if __name__ == "__main__":
    main()
