"""Generates the five v3 reels as HTML (timeline synced to part two of the song).

Song in video time: intro 0–7.74 (808 hits ≈0.14 / 2.08 / 4.00 / 5.93), melody alone 7.74–15.44,
drop 15.44–23.14 (beats every 0.481 s), tail 23.14–25.95.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
DUR = 26.0

ICONS = ('<svg viewBox="0 0 34 22"><rect x="0" y="14" width="6" height="8" rx="1.5" fill="currentColor"/><rect x="9" y="10" width="6" height="12" rx="1.5" fill="currentColor"/>'
         '<rect x="18" y="5" width="6" height="17" rx="1.5" fill="currentColor"/><rect x="27" y="0" width="6" height="22" rx="1.5" fill="currentColor"/></svg>'
         '<svg viewBox="0 0 30 22"><path d="M15 21 L10.5 16.2 A6.5 6.5 0 0 1 19.5 16.2 Z M5.6 11.6 A13 13 0 0 1 24.4 11.6 L22 14.2 A9.6 9.6 0 0 0 8 14.2 Z M1 6.9 A19.5 19.5 0 0 1 29 6.9 L26.6 9.5 A16 16 0 0 0 3.4 9.5 Z" fill="currentColor"/></svg>'
         '<svg viewBox="0 0 48 22"><rect x="1" y="1" width="40" height="20" rx="6" fill="none" stroke="currentColor" stroke-width="2" opacity="0.45"/>'
         '<rect x="4" y="4" width="30" height="14" rx="3.5" fill="currentColor"/><rect x="43" y="7" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.45"/></svg>')

RADIATOR_PHOTO = """<svg viewBox="0 0 440 300"><defs><linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9edf1"/><stop offset="1" stop-color="#d6dde4"/></linearGradient>
<linearGradient id="fin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#cfd6dd"/></linearGradient></defs>
<rect width="440" height="300" fill="url(#wl)"/><rect y="250" width="440" height="50" fill="#b9a58c"/><rect y="246" width="440" height="6" fill="#efe9e1"/>
<g transform="translate(70 92)">""" + "".join(f'<rect x="{i*30}" y="0" width="24" height="150" rx="11" fill="url(#fin)" stroke="#b8c2cc" stroke-width="1.5"/>' for i in range(9)) + """
<rect x="-6" y="18" width="282" height="10" rx="5" fill="#d9dfe5"/><rect x="-6" y="124" width="282" height="10" rx="5" fill="#d9dfe5"/>
<rect x="276" y="40" width="24" height="56" rx="10" fill="#f7f8fa" stroke="#aeb8c2" stroke-width="1.5"/><text x="288" y="75" text-anchor="middle" font-family="Inter" font-weight="600" font-size="18" fill="#3b82f6">3</text></g>
<text x="404" y="40" text-anchor="end" font-family="Inter" font-weight="600" font-size="26" fill="#3b82f6">16 °C</text></svg>"""

LEAK_PHOTO = """<svg viewBox="0 0 440 300"><defs><radialGradient id="lamp" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#4b5563"/><stop offset="1" stop-color="#1f2933"/></radialGradient></defs>
<rect width="440" height="300" fill="url(#lamp)"/><rect width="440" height="70" fill="#2d3640"/>
<ellipse cx="230" cy="64" rx="110" ry="26" fill="#6b5a3e" opacity=".55"/><ellipse cx="230" cy="62" rx="60" ry="14" fill="#7d6745" opacity=".6"/>
<path d="M230 72 q8 14 0 22 q-8 -8 0 -22z" fill="#8fc6ff"/><path d="M226 130 q7 12 0 19 q-7 -7 0 -19z" fill="#8fc6ff" opacity=".85"/><path d="M232 182 q6 11 0 17 q-6 -6 0 -17z" fill="#8fc6ff" opacity=".7"/>
<rect y="262" width="440" height="38" fill="#3a3027"/><ellipse cx="232" cy="268" rx="90" ry="10" fill="#5b88b5" opacity=".45"/>
<path d="M196 214 h72 l-8 52 h-56 z" fill="#c7ccd1"/><rect x="192" y="208" width="80" height="10" rx="4" fill="#e3e6e9"/></svg>"""


def device(t_in, bubbles, night=False, clock="21:47", sub="online"):
    return f"""<div class="device{' night' if night else ''}" data-in="{t_in}" data-anim="device">
  <div class="frame"></div><div class="bezel"></div>
  <div class="screen">
    <div class="island"></div>
    <div class="status"><span>{clock}</span><span>{ICONS}</span></div>
    <div class="appbar"><span class="back">‹</span><div class="av"><span class="mark" data-color="{'#000' if night else '#fff'}" data-variant="icon"></span></div><div><b>Ecoraum</b><small>{sub}</small></div></div>
    <div class="chat">{''.join(bubbles)}</div>
    <div class="composer"><div class="field">Nachricht</div><div class="mic"></div></div>
  </div>
</div>"""


def b(side, t, text, time, photo=None):
    sfx = "pop-out" if side == "out" else "pop-in"
    body = photo if photo else text
    cls = f"b {side}" + (" photo" if photo else "")
    return f'<div class="{cls}" data-in="{t}" data-anim="pop" data-sfx="{sfx}">{body}<span class="t">{time}</span></div>'


def typing(t, out):
    return f'<div class="typing" data-in="{t}" data-out="{out}" data-anim="pop"><i></i><i></i><i></i></div>'


def notif(t, top, title, body, out=None, sfx="ding"):
    o = f' data-out="{out}"' if out else ""
    return f"""<div class="notif" style="top:{top}px" data-in="{t}" data-anim="drop" data-sfx="{sfx}"{o}>
  <div class="head"><span class="icon"><span class="mark" data-color="#fff" data-variant="icon"></span></span><span>Ecoraum Team</span><span>jetzt</span></div>
  <div class="ttl">{title}</div><div class="body">{body}</div></div>"""


CHECK_SVG = '<svg viewBox="0 0 30 30"><path d="M7 15.5 l5.5 5.5 L23.5 9.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def big_check(t, top, color="#2fb67c"):
    return f"""<div class="center" style="top:{top}px" data-in="{t}" data-anim="draw" data-dur="0.8" data-sfx="tick">
  <svg viewBox="0 0 200 200" width="260" height="260"><circle cx="100" cy="100" r="88" fill="none" stroke="{color}" stroke-width="12" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 100 100)"/>
  <path d="M60 102 l28 28 l54 -60" fill="none" stroke="{color}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg></div>"""


def logo_end(t, color, tagline, cta, top=640):
    letters = "".join(f'<text class="lt" x="{x}" y="474">{c}</text>' for x, c in zip((44, 122, 201, 280, 359, 438, 516), "ECORAUM"))
    return f"""<div class="center" style="top:{top}px">
  <div class="logo-anim" data-in="{t}" data-anim="logo" data-sfx="logo">
    <svg viewBox="0 0 560 560"><polyline class="house" pathLength="1" points="35,372 35,175 280,48 525,175 525,372" fill="none" stroke="{color}" stroke-width="78" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="1" stroke-dashoffset="1"/>
    <g fill="{color}" stroke="{color}" stroke-width="3" style="font-family:Archivo;font-weight:900;font-size:84px" text-anchor="middle">{letters}</g>
    <rect class="bar" x="2" y="494" width="556" height="62" fill="{color}" style="transform-box:fill-box;transform-origin:left center;transform:scaleX(0)"/></svg>
  </div>
  <div class="title" style="margin-top:70px" data-in="{t + 0.95}" data-anim="fade">{tagline}</div>
  <div data-in="{t + 1.4}" data-anim="fade"><span class="cta">{cta}</span></div>
</div>"""


def page(title, scenes, vo):
    return f"""<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>{title}</title>
<link rel="stylesheet" href="brand.css"><link rel="stylesheet" href="reel3.css"></head>
<body><div id="stage" data-duration="{DUR}">
{scenes}
<div id="vo"></div>
</div>
<script id="vo-src" type="application/json">{json.dumps(vo, ensure_ascii=False)}</script>
<script src="vo-dur.js"></script><script src="brand.js"></script><script src="reel3.js"></script>
</body></html>"""


CTA = "Pilot in Stuttgart · DM „Pilot“"

# ---------------------------------------------------------------- 1 Heizung
heizung = page("Heizung", f"""
<section class="scene bg-black" data-from="0">
  <div class="glow blue" style="left:-60px; top:420px"></div>
  <div class="center" style="top:700px">
    <div class="eyebrow" data-in="-1" data-anim="fade">Sonntag</div>
    <div class="clock" data-in="-1" data-anim="fade" style="margin-top:20px">21:47</div>
    <div class="sub" data-in="2.08" data-anim="fade" style="margin-top:30px; color:#7cb7ff">🌡️ Bad · 16 °C</div>
  </div>
</section>
<section class="scene bg-black" data-from="4.0" data-bg-at="7.74" data-bg-to="f5f5f7">
  {device(4.0, [
      b("out", 5.0, "Hallo! Die Heizung im Bad bleibt kalt 🥶", "21:47"),
      b("out", 5.9, "", "21:47", photo=RADIATOR_PHOTO),
      typing(8.4, 9.05),
      b("in", 9.05, "Oh, ungemütlich! Sind die anderen Heizkörper warm oder alle kalt?", "21:48"),
      b("out", 10.3, "Nur der im Bad. Entlüften hat nicht geholfen.", "21:48"),
      typing(11.0, 11.65),
      b("in", 11.65, "Danke! Kurz zusammengefasst: <b>Heizkörper im Bad bleibt kalt, Entlüften half nicht – Gartenweg 3, Stuttgart.</b> Soll ich das so an unser Team geben?", "21:49"),
      b("out", 13.2, "Ja, gerne!", "21:49"),
      typing(13.7, 14.3),
      b("in", 14.3, "Ist weitergegeben – Ihre Fallnummer ist <b>F-12</b>. Das Team meldet sich bei Ihnen. ✅", "21:49"),
  ])}
</section>
<section class="scene bg-black" data-from="15.44" data-tr="cut">
  <div class="glow" style="left:-80px; top:700px"></div>
  {notif(15.44, 640, "🆕 Neuer Fall F-12 (hoch): Heizkörper im Bad bleibt kalt – Erika Muster", "📍 Gartenweg 3, Stuttgart – Bad\n📷 1 Foto/Datei im Chat", out=19.2)}
  <div class="card" style="top:1040px" data-in="17.37" data-anim="scale" data-out="19.2" data-sfx="tick">
    <div class="k cal-day">Montag</div><div class="big">8:00</div><div class="t1">Heizungsbauer</div><div class="t2">Gartenweg 3 · Bad</div>
    <div style="margin-top:26px"><span class="pill ok">✓ Termin bestätigt</span></div></div>
  <div class="card dark" style="top:700px" data-in="19.3" data-anim="scale" data-out="21.1">
    <div class="k">Fall F-12 · Heizkörper Bad</div>
    <div class="rows">
      <div class="row" data-in="19.78" data-anim="check" data-sfx="tick"><span class="dot">{CHECK_SVG}</span>Gemeldet</div>
      <div class="row" data-in="20.26" data-anim="check" data-sfx="tick"><span class="dot">{CHECK_SVG}</span>Handwerker organisiert</div>
      <div class="row" data-in="20.74" data-anim="check" data-sfx="tick"><span class="dot">{CHECK_SVG}</span>Erledigt</div>
    </div></div>
  {big_check(21.2, 760)}
  <div class="center" style="top:1080px"><div class="title" data-in="21.6" data-anim="fade">Erledigt.</div></div>
</section>
<section class="scene bg-light" data-from="23.14">
  {logo_end(23.3, "#1d1d1f", "Vermieten ohne Stress.", CTA)}
</section>""", [
    {"id": "heiz-1", "start": 0.35, "theme": "dark", "html": "Sonntagabend. Bei deiner Mieterin bleibt die <em>Heizung kalt</em>."},
    {"id": "heiz-2", "start": 4.35, "theme": "dark", "html": "Sie schreibt einfach unserer <em>WhatsApp-Nummer</em>."},
    {"id": "heiz-3", "start": 7.95, "theme": "light", "html": "Unser Assistent fragt nur, was der <em>Handwerker</em> wissen muss."},
    {"id": "heiz-4", "start": 12.15, "theme": "light", "html": "Dann fasst er zusammen und legt einen <em>Fall</em> an."},
    {"id": "heiz-5", "start": 15.75, "theme": "dark", "html": "Wir organisieren den <em>Heizungsbauer</em>."},
    {"id": "heiz-6", "start": 18.45, "theme": "dark", "html": "Und halten dich auf dem <em>Laufenden</em>."},
    {"id": "heiz-7", "start": 23.35, "theme": "light", "html": ""},
])

# ---------------------------------------------------------------- 2 Notfall
drops = "".join(f'<i style="left:{x}px; top:0" data-in="{d}" data-anim="drip" data-speed="{s}" data-range="420"></i>'
                for x, d, s in ((-60, 2.08, 430), (10, 2.4, 470), (70, 2.75, 410), (-20, 3.05, 450)))
notfall = page("Notfall", f"""
<section class="scene bg-night" data-from="0">
  <div class="glow blue" style="left:-80px; top:300px"></div>
  <div class="center" style="top:640px">
    <div class="eyebrow" data-in="-1" data-anim="fade">Nacht auf Samstag</div>
    <div class="clock" data-in="-1" data-anim="fade" style="margin-top:20px">02:14</div>
  </div>
  <div class="drops" style="position:absolute; left:540px; top:1100px">{drops}</div>
</section>
<section class="scene bg-night" data-from="4.0">
  <div class="glow blue" style="left:-80px; top:300px"></div>
  {device(4.0, [
      b("out", 5.0, "Hilfe! Bei mir tropft Wasser durch die Decke im Flur 😰", "02:14"),
      b("out", 5.8, "", "02:14", photo=LEAK_PHOTO),
      typing(8.2, 8.8),
      b("in", 8.8, "Das klingt dringend. Bitte halten Sie Abstand zu Lampen und Steckdosen in der Nähe.", "02:14"),
      b("in", 10.3, "Wenn es gefahrlos geht: Sicherung für den Flur ausschalten und einen Eimer unterstellen.", "02:15"),
      b("in", 12.3, "Ich habe es als <b>Notfall</b> an unser Team gegeben – Fallnummer <b>F-13</b>. Bei akuter Gefahr hat der Notruf 112 immer Vorrang.", "02:15"),
      b("out", 14.2, "Okay, danke!", "02:15"),
  ], night=True, clock="02:14")}
</section>
<section class="scene bg-black" data-from="15.44" data-tr="cut">
  <div class="glow red" style="left:-60px; top:600px"></div>
  {notif(15.44, 640, "🚨 NOTFALL F-13: Wasser tropft durch die Decke – Max Mustermann", "📍 Gartenweg 3, Stuttgart – Flur\n📷 1 Foto/Datei im Chat", out=21.1)}
  <div class="card dark" style="top:1010px" data-in="17.37" data-anim="scale" data-out="21.1">
    <div class="k">Was das Team sofort weiß</div>
    <div class="rows">
      <div class="row" data-in="17.85" data-anim="fade" data-sfx="tick"><span class="e">📍</span>Adresse und Raum</div>
      <div class="row" data-in="18.33" data-anim="fade" data-sfx="tick"><span class="e">📷</span>Foto vom Schaden</div>
      <div class="row" data-in="18.81" data-anim="fade" data-sfx="tick"><span class="e">⚠️</span>Hinweise sind raus</div>
      <div class="row" data-in="19.29" data-anim="fade" data-sfx="tick"><span class="e">👤</span>Wer betroffen ist</div>
    </div></div>
  <div class="center" style="top:800px">
    <div data-in="21.2" data-anim="scale" data-sfx="tick"><span class="pill red" style="font-size:40px; padding:20px 36px">🚨 Notfall F-13</span></div>
    <div class="title" style="margin-top:40px" data-in="21.6" data-anim="fade">Team informiert.</div>
  </div>
</section>
<section class="scene bg-black" data-from="23.14">
  {logo_end(23.3, "#f5f5f7", "Auch nachts erreichbar.", CTA)}
</section>""", [
    {"id": "not-1", "start": 0.35, "theme": "dark", "html": "2 Uhr nachts. Bei deinem Mieter tropft <em class=\"red\">Wasser durch die Decke</em>."},
    {"id": "not-2", "start": 4.5, "theme": "dark", "html": "Er schreibt uns auf <em>WhatsApp</em>."},
    {"id": "not-3", "start": 7.95, "theme": "dark", "html": "Unser Assistent gibt sofort die wichtigsten <em>Sicherheitshinweise</em>."},
    {"id": "not-4", "start": 12.0, "theme": "dark", "html": "Und meldet den Fall als <em class=\"red\">Notfall</em>."},
    {"id": "not-5", "start": 15.75, "theme": "dark", "html": "Unser Team bekommt die Meldung <em>sofort</em>."},
    {"id": "not-6", "start": 18.6, "theme": "dark", "html": "Mit allem, was wir wissen müssen."},
    {"id": "not-7", "start": 23.35, "theme": "dark", "html": ""},
])

# ---------------------------------------------------------------- 3 Frage
waves = "".join(f'<path d="M{150 + 26*i} {60 - 8*i} q{18 + 6*i} {40 + 8*i} 0 {80 + 16*i}" fill="none" stroke="#2fb67c" stroke-width="7" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>' for i in range(3))
frage = page("Frage", f"""
<section class="scene bg-light" data-from="0">
  <div class="center" style="top:780px">
    <svg viewBox="0 0 240 200" width="520" height="430" data-in="-1" data-anim="fade">
      <g fill="none" stroke="#1d1d1f" stroke-width="6" stroke-linecap="round">{''.join(f'<rect x="{12 + i*22}" y="40" width="16" height="120" rx="8"/>' for i in range(6))}
      <line x1="6" y1="58" x2="146" y2="58"/><line x1="6" y1="142" x2="146" y2="142"/></g>
    </svg>
    <svg viewBox="0 0 240 200" width="520" height="430" style="position:absolute; top:0" data-in="2.08" data-anim="draw" data-dur="1.2" data-sfx="pop-in">{waves}</svg>
  </div>
</section>
<section class="scene bg-light" data-from="3.9">
  {device(3.9, [
      b("out", 5.0, "Mein Heizkörper gluckert und wird oben nicht richtig warm. Was kann ich tun?", "18:20"),
      typing(8.3, 8.9),
      b("in", 8.9, "Klingt nach Luft im Heizkörper – das können Sie meist selbst lösen:", "18:20"),
      b("in", 10.0, "1. Thermostat aufdrehen und kurz warten\n2. Oben mit dem Entlüftungsschlüssel das Ventil öffnen – Lappen drunter\n3. Zudrehen, sobald nur noch Wasser kommt", "18:20"),
      b("out", 13.4, "Hat geklappt, danke! 🙌", "18:23"),
  ], clock="18:20")}
</section>
<section class="scene bg-black" data-from="15.44" data-tr="cut">
  <div class="glow" style="left:-80px; top:700px"></div>
  {notif(17.37, 640, "🆕 Neuer Fall F-14 (normal): Heizkörper gluckert weiter – Anna Beispiel", "📍 Lindenstraße 5, Stuttgart – Wohnzimmer", out=19.2)}
  <div class="card" style="top:1040px" data-in="17.85" data-anim="scale" data-out="19.2" data-sfx="tick">
    <div class="k cal-day">Dienstag</div><div class="big">10:00</div><div class="t1">Heizungsbauer</div><div class="t2">Lindenstraße 5 · Wohnzimmer</div></div>
  <div class="center" style="top:700px"><div class="chips">
    <span class="chip" data-in="19.3" data-anim="scale" data-sfx="tick">Antwort in Sekunden</span>
    <span class="chip" data-in="19.78" data-anim="scale" data-sfx="tick">Rund um die Uhr</span>
    <span class="chip" data-in="20.26" data-anim="scale" data-sfx="tick">Deutsch, Englisch &amp; mehr</span>
    <span class="chip" data-in="20.74" data-anim="scale" data-sfx="tick" style="background:#2fb67c">Handwerker, wenn nötig</span>
  </div></div>
</section>
<section class="scene bg-light" data-from="23.14">
  {logo_end(23.3, "#1d1d1f", "Einfach fragen.", CTA)}
</section>""", [
    {"id": "frage-1", "start": 0.35, "theme": "light", "html": "Nicht jedes Problem braucht gleich einen <em>Handwerker</em>."},
    {"id": "frage-2", "start": 3.9, "theme": "light", "html": "Der Heizkörper gluckert? <em>Einfach fragen.</em>"},
    {"id": "frage-3", "start": 7.95, "theme": "light", "html": "Unser Assistent antwortet <em>sofort</em> – Schritt für Schritt."},
    {"id": "frage-4", "start": 11.9, "theme": "light", "html": "Zum Beispiel, wie man einen Heizkörper <em>entlüftet</em>."},
    {"id": "frage-5", "start": 15.75, "theme": "dark", "html": "Und wenn das nicht hilft?"},
    {"id": "frage-6", "start": 17.4, "theme": "dark", "html": "Dann schicken wir den <em>Handwerker</em>."},
    {"id": "frage-7", "start": 23.35, "theme": "light", "html": ""},
])

# ---------------------------------------------------------------- 4 Gründer (music only)
gruender = page("Gruender", f"""
<section class="scene bg-black" data-from="0">
  <div class="glow" style="left:-100px; top:400px"></div>
  <div class="center" style="top:640px">
    <div class="eyebrow" data-in="-1" data-anim="fade">Hi, wir sind Ecoraum</div>
    <div class="display" data-in="-1" data-anim="fade" style="margin-top:34px">Louis &amp;<br>Dominic.</div>
    <div class="sub" data-in="2.08" data-anim="fade" style="margin-top:44px">Zwei Studenten.</div>
    <div class="sub" data-in="4.0" data-anim="fade" style="margin-top:8px; color:#f5f5f7">Eine Idee für Vermieter.</div>
    <div class="eyebrow grad on-dark" data-in="5.93" data-anim="fade" style="margin-top:54px">Stuttgart × Edinburgh</div>
  </div>
</section>
<section class="scene bg-light" data-from="7.74">
  <div class="center" style="top:300px"><div class="title" data-in="7.9" data-anim="fade">Wer wir sind.</div></div>
  <div class="person" style="top:560px" data-in="8.4" data-anim="rise">
    <div class="ava">L</div><div><h3>Louis Mitrovic</h3><div class="where">Stuttgart · vor Ort</div><p>Hat mehrere Immobilien mitrenoviert. Kennt Handwerker und Monteure in der Region.</p></div></div>
  <div class="person" style="top:960px" data-in="10.6" data-anim="rise">
    <div class="ava g">D</div><div><h3>Dominic Herrmann</h3><div class="where">Edinburgh</div><p>Studiert Geografie &amp; Wirtschaft. Baut Abläufe und Technik.</p></div></div>
  <div class="center" style="top:1380px"><div class="sub" data-in="12.9" data-anim="fade" style="color:#1d1d1f; font-weight:600">Einer vor Ort. Einer an den Prozessen.</div></div>
</section>
<section class="scene bg-black" data-from="15.44" data-tr="cut">
  <div class="glow" style="left:-60px; top:500px"></div>
  <div class="center" style="top:760px"><div class="display" data-in="15.44" data-anim="scale" data-out="16.36">Erreichbar.</div></div>
  <div class="center" style="top:760px"><div class="display" data-in="16.40" data-anim="scale" data-out="17.33">Organisiert.</div></div>
  <div class="center" style="top:760px"><div class="display" data-in="17.37" data-anim="scale" data-out="18.29">Dranbleiben.</div></div>
  <div class="center" style="top:660px"><div class="title" data-in="18.33" data-anim="scale" data-out="21.1">Für einen <span class="grad on-dark">Bruchteil</span><br>des Preises.</div></div>
  <div class="center" style="top:700px"><div class="title" data-in="21.2" data-anim="scale">Wir starten<br>in Stuttgart.</div></div>
</section>
<section class="scene bg-light" data-from="23.14">
  {logo_end(23.3, "#1d1d1f", "Folg uns beim Aufbau.", "Vermieter mit 1–5 Wohnungen: DM „Pilot“")}
</section>""", [])

# ---------------------------------------------------------------- 5 Vision (music only)
vision = page("Vision", f"""
<section class="scene bg-black" data-from="0">
  <div class="center" style="top:560px">
    <div class="eyebrow" data-in="-1" data-anim="fade">Hausverwaltung heute</div>
    <div class="display" style="margin-top:50px" data-in="-1" data-anim="fade"><span class="strike" data-in="5.93" data-anim="strike">Warteschleife.<span class="x"></span></span></div>
    <div class="display" style="margin-top:18px" data-in="2.08" data-anim="fade"><span class="strike" data-in="6.17" data-anim="strike">Keine Antwort.<span class="x"></span></span></div>
    <div class="display" style="margin-top:18px" data-in="4.0" data-anim="fade"><span class="strike" data-in="6.41" data-anim="strike" data-sfx="tick">Zu teuer.<span class="x"></span></span></div>
  </div>
</section>
<section class="scene bg-light" data-from="7.74">
  <div class="center" style="top:300px"><div class="title" data-in="7.9" data-anim="fade">Das geht <span class="grad">besser.</span></div></div>
  <div class="card" style="top:560px" data-in="9.0" data-anim="rise"><div class="k">01</div><div class="t1" style="margin-top:10px">Erreichbar per WhatsApp</div><div class="t2">Antwort in Sekunden – auch abends.</div></div>
  <div class="card" style="top:860px" data-in="11.0" data-anim="rise"><div class="k">02</div><div class="t1" style="margin-top:10px">Jeder Fall hat eine Nummer</div><div class="t2">Nichts geht verloren.</div></div>
  <div class="card" style="top:1160px" data-in="13.0" data-anim="rise"><div class="k">03</div><div class="t1" style="margin-top:10px">Technik sortiert. Menschen entscheiden.</div><div class="t2">Termine und Preise legen immer wir fest.</div></div>
</section>
<section class="scene bg-black" data-from="15.44" data-tr="cut">
  <div class="glow" style="left:-60px; top:500px"></div>
  <div class="center" style="top:600px">
    <div class="display grad on-dark" data-in="15.44" data-anim="scale">04</div>
    <div class="display" data-in="15.92" data-anim="scale" style="margin-top:10px">Bezahlbar.</div>
    <div class="sub" data-in="17.37" data-anim="fade" style="margin-top:40px">Ein Bruchteil einer<br>klassischen Hausverwaltung.</div>
    <div class="chips" style="margin-top:70px">
      <span class="chip" data-in="19.3" data-anim="scale" data-sfx="tick">Erreichbar</span>
      <span class="chip" data-in="19.78" data-anim="scale" data-sfx="tick">Transparent</span>
      <span class="chip" data-in="20.26" data-anim="scale" data-sfx="tick" style="background:#2fb67c">Bezahlbar</span>
    </div>
  </div>
</section>
<section class="scene bg-light" data-from="23.14">
  {logo_end(23.3, "#1d1d1f", "Hausverwaltung, neu gedacht.", CTA)}
</section>""", [])

for name, html in (("heizung", heizung), ("notfall", notfall), ("frage", frage), ("gruender", gruender), ("vision", vision)):
    (HERE / f"{name}.html").write_text(html)
print("ok")
