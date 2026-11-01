"""Cut part two of the song (beat intro, melody alone, drop, tail) and prepare it as a music bed.
Usage: python3 -I song_bed.py song.wav out.wav"""
import sys, wave, numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).astype(np.float64) / 32768
a, b = int(23.00 * sr), int(48.95 * sr)
y = x[a:b].copy()
n = len(y)
F = np.fft.rfft(y, axis=0); f = np.fft.rfftfreq(n, 1 / sr)[:, None]
# 1) clean rumble below ~28 Hz
F *= np.clip((f - 22) / 10, 0, 1)
y = np.fft.irfft(F, n, axis=0)
# 2) phone-speaker bass: saturate the 808 band and keep only the new harmonics above 140 Hz
low = np.fft.irfft(F * ((f > 35) & (f < 110)), n, axis=0)
harm = np.tanh(4.0 * low / (np.abs(low).max() + 1e-9))
H = np.fft.rfft(harm, axis=0) * np.clip((f - 140) / 60, 0, 1) * np.clip((900 - f) / 300, 0, 1)
harm = np.fft.irfft(H, n, axis=0)
y = y + 0.10 * harm / (np.abs(harm).max() + 1e-9) * np.abs(y).max()
# 3) fades
t = np.arange(n)[:, None] / sr
y *= np.clip(t / 0.008, 0, 1) * np.clip((n / sr - t) / 0.7, 0, 1)
y /= np.abs(y).max() / 0.95
out = wave.open(sys.argv[2], 'wb'); out.setnchannels(2); out.setsampwidth(2); out.setframerate(sr)
out.writeframes((y * 32767).astype('<i2').tobytes()); out.close()
print(sys.argv[2], f"{n / sr:.2f}s")
