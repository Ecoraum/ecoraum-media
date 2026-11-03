# 3D-Animation „Wasserschaden“ (November 2026)

Quellcode des animierten Erklärvideos `2026-11-animation/wasserschaden/reel.mp4`.
Stil: dunkle Low-Poly-Dioramen, runde Figuren, Spielbrett mit Mieter, Ecoraum, Eigentümer und Handwerker.

## Aufbau
- `anim/` – Three.js-Szenen, im Headless-Chromium Bild für Bild gerendert
  - `engine.js` Renderer, Bloom, 2D-Overlay, Körnung · `builders.js` Figuren und Möbel
  - `living.js` Wohnzimmer · `building.js`/`city.js` Mietshaus im Querschnitt · `dinner.js` Abendessen · `board.js` Spielbrett
  - `ui.js` Chat-Handy, Fallakte, Dringlichkeitsanzeige, Stempel · `scene.js` Zeitplan aller Einstellungen (Zeiten = Sekunden im Video)
  - `render.js` startet Chromium und schreibt Standbilder oder Videoabschnitte
- `audio/` – Tonspur
  - `transcribe.py` Abschrift mit Wortzeiten (faster-whisper, Modell large-v3-turbo)
  - `story_audio.json` welche Takes zu welcher Sekunde laufen · `build_story.py` setzt sie zusammen
  - `sound.py` Musik und Geräusche per Code, Ducking unter der Stimme, Lautheit −14 LUFS

## Benutzung
```bash
cd anim && npm install
node render.js still stills 1.5 10.5 59.8          # Standbilder prüfen
node render.js video seg_0.mp4 0 32 30              # Abschnitte rendern (parallel möglich)
python audio/build_story.py audio/story_audio.json story   # Stimmen anordnen
python audio/sound.py story/voice.wav story/mix.wav         # Musik + Geräusche
```
Danach Abschnitte mit ffmpeg aneinanderhängen und `mix.wav` als Ton anlegen.
Die Rohaufnahmen von Dom und Louis liegen bewusst nicht hier (öffentliches Repository).
