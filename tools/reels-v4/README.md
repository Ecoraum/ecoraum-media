# Reels v4 – cleaner look, viral hooks, eure eigene Stimme

Serie „Mieter-Nachrichten“ (Notfall, Heizung, Frage) plus Gründer und Vision, je 18,2 s auf Teil 2 von Louis' Song:
Melodie allein 0–7,7 s (Hook + Geschichte), Drop 7,7–15,4 s (Auflösung im Beat), Ende 15,4–18,2 s (Logo, Loop).
Der Song selbst liegt nicht im Repo (öffentlich).

| Datei | Zweck |
| --- | --- |
| `build_v4.py` | erzeugt die fünf Timelines (HTML) |
| `reel4.js` / `reel4.css` / `icons.py` | Engine, cleanes Design (eine Fläche, ein Akzent, Linien-Icons, Inter Display), Chat-Blasen gleiten nach oben |
| `finalize4.sh` | Song + UI-Sounds mischen, −14 LUFS, mit Video zusammenführen |
| `voice-script.json` / `sprechskript.html` | Sprechtexte je Video und Song-Abschnitt (A–E), mit geschätzter Dauer |
| `voice_auto.py` | erkennt, zu welchem Video ein Sprachmemo gehört (lokales Whisper), und ruft `voice_in.py` auf |
| `voice_in.py` | schneidet das Memo in Sätze, gleicht sie per Spracherkennung mit dem Skript ab (Versprecher/Neuversuche werden übersprungen), säubert den Klang und legt die Sätze auf den Song |
| `finalize4v.sh` | Video mit Stimme fertigstellen (Musik-Mitten werden beim Sprechen um ~20 dB abgesenkt) |

Benötigt: Node + Playwright, ffmpeg, Python mit numpy, `sherpa-onnx` und das Whisper-Base-Modell
(GitHub-Release `k2-fsa/sherpa-onnx`, Tag `asr-models`, `sherpa-onnx-whisper-base.tar.bz2`, entpackt nach `asr/m/`).
