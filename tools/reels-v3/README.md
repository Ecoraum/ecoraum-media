# Reels v3 – Werkzeuge

So entstehen die Reels in `2026-11-v3/`. Nichts hier enthält Schlüssel oder Kundendaten.
Der Song (Louis' eigener Track) liegt bewusst **nicht** im Repo, weil das Repo öffentlich ist.

| Datei | Zweck |
| --- | --- |
| `song_bed.py` | schneidet Teil 2 des Songs (23,00–48,95 s: Intro, Melodie allein, Drop) und bereitet ihn auf |
| `voice-lines.json` | Sprechertexte (`say` = für die Stimme, `show` = Text im Bild) |
| `tts2.py` | Sprecher mit Piper, Stimme „Thorsten“ (CC0), Sätze einzeln + Atempausen |
| `build_v3.py` | erzeugt die fünf HTML-Timelines (Takt: Drop bei 15,44 s, Beat alle 0,481 s) |
| `reel3.js` / `reel3.css` | Animations-Engine und Apple-artiges Design (Inter + Archivo) |
| `render-reel3.cjs` | rendert jede Timeline Bild für Bild (Playwright → ffmpeg) |
| `mix3.py` | mischt Song, Stimme (Musik-Mitten −20 dB beim Sprechen) und UI-Sounds |
| `finalize3.sh` | Lautheit −14 LUFS, Bild und Ton zusammenführen |

Benötigt: Node mit Playwright, ffmpeg, Python mit numpy und `piper-tts`.
Die Stimme gibt es als GitHub-Release: `k2-fsa/sherpa-onnx` → `tts-models/vits-piper-de_DE-thorsten-high.tar.bz2`.
Schriften: npm-Pakete `@fontsource/inter@5` und `@fontsource-variable/archivo@5` nach `node_modules/`.

Offen (Stand 01.11.2026): Stimme natürlicher machen – eigene Aufnahme von Louis oder eine bessere Sprachausgabe.
