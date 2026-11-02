"""Ecoraum reels v4 – series "Mieter-Nachrichten" + founders + vision, short cut (18.2 s).

Music (short cut of part two): melody alone 0–7.70 (bars at 0 / 1.925 / 3.85 / 5.775),
drop 7.70–15.40 (beat every 0.481 s), tail 15.40–18.2. Text = script for the founders' voice later.
"""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from icons import icon  # noqa: E402

HERE = pathlib.Path(__file__).parent
DUR = 18.2


def lock(date, time, who, body, hook_text, hook_in=1.925):
    return f"""
  <div class="col gap-s" style="top:300px"><div class="lock-date" data-in="-1" data-anim="fade">{date}</div><div class="lock-time" data-in="-1" data-anim="fade">{time}</div></div>
  <div class="notif" style="top:760px" data-in="0.05" data-anim="drop" data-sfx="ding"><div class="app">{icon('chat', '#fff', 2)}</div>
    <div class="txt"><div class="top"><span>{who}</span><span>jetzt</span></div><div class="body">{body}</div></div></div>
  <div class="col" style="top:1150px"><div class="t-l" data-in="{hook_in}">{hook_text}</div></div>"""


def chat(top, height, items):
    return f'<div class="chat" style="top:{top}px; height:{height}px" data-gap="24">{"".join(items)}</div>'


def m(side, t, text, who=None, sfx=True):
    w = f'<span class="who">{who}</span>' if who else ""
    s = f' data-sfx="pop-{side}"' if sfx else ""
    return f'<div class="msg {side}" data-in="{t}"{s}>{w}{text}</div>'


def typing(t, out):
    return f'<div class="typing" data-in="{t}" data-out="{out}"><i></i><i></i><i></i></div>'


def row(t, ic, text, cls="acc"):
    return f'<div class="row" data-in="{t}" data-sfx="tick"><span class="ico {cls}">{icon(ic)}</span>{text}</div>'


def logo_end(t, color, tagline, cta, fade_at=17.55):
    letters = "".join(f'<text class="lt" x="{x}" y="474">{c}</text>' for x, c in zip((44, 122, 201, 280, 359, 438, 516), "ECORAUM"))
    return f"""
  <div class="col gap-l" style="top:560px">
    <div class="logo-anim" data-in="{t}" data-anim="logo" data-sfx="logo">
      <svg viewBox="0 0 560 560"><polyline class="house" pathLength="1" points="35,372 35,175 280,48 525,175 525,372" fill="none" stroke="{color}" stroke-width="78" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="1" stroke-dashoffset="1"/>
      <g fill="{color}" stroke="{color}" stroke-width="3" style="font-family:Archivo;font-weight:900;font-size:84px" text-anchor="middle">{letters}</g>
      <rect class="bar" x="2" y="494" width="556" height="62" fill="{color}" style="transform-box:fill-box;transform-origin:left center;transform:scaleX(0)"/></svg></div>
    <div class="t-m" data-in="{t + 0.85}">{tagline}</div>
    <div data-in="{t + 1.25}"><span class="cta">{cta}</span></div>
  </div>"""


def scene(frm, body, theme="", fade_out=None):
    fo = f' data-fade-out="{fade_out}"' if fade_out else ""
    return f'<section class="scene {theme}" data-from="{frm}"{fo}><div class="cam" style="position:absolute;inset:0">{body}</div></section>'


def page(title, scenes):
    return f"""<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>{title}</title><link rel="stylesheet" href="reel4.css"></head>
<body><div id="stage" data-duration="{DUR}">
{''.join(scenes)}
</div><script src="reel4.js"></script></body></html>"""


CTA = "Pilot in Stuttgart · DM „Pilot“"
TAG = "Vermieten ohne Stress."

# ---------------------------------------------------------------- Notfall (dark)
notfall = page("Notfall", [
    scene(0, lock("Samstag, 7. November", "2:14", "Max · Mieter", "Hilfe, bei mir tropft Wasser durch die Decke!", "Was jetzt?"), "dark"),
    scene(3.85, f"""
  <div class="col" style="top:290px"><div class="t-m" data-in="3.9">Mit Ecoraum schreibt<br>er <span class="acc">uns</span>.</div></div>
  {chat(560, 900, [
      m("out", 4.15, "Hilfe, bei mir tropft Wasser durch die Decke!"),
      typing(4.6, 5.1),
      m("in", 5.1, "Das klingt dringend. Bitte Abstand zu Lampen und Steckdosen halten.", "Ecoraum"),
      m("in", 6.3, "Wenn es gefahrlos geht: Sicherung aus, Eimer unterstellen.", "Ecoraum"),
  ])}""", "dark"),
    scene(7.70, f"""
  <div class="col gap-m" style="top:640px">
    <div data-in="7.70" data-anim="scale"><span class="pill red">{icon('drop', 'currentColor', 2.2)} Notfall · F-13</span></div>
    <div class="t-xl" data-in="8.18">Team<br>alarmiert.</div></div>""", "dark"),
    scene(9.63, f"""
  <div class="col gap-l" style="top:380px">
    <div class="t-l" data-in="9.68">Das Team weiß sofort:</div>
    <div class="rows">{row(10.11, 'pin', 'Adresse &amp; Raum')}{row(10.59, 'camera', 'Foto vom Schaden')}{row(11.07, 'shield', 'Hinweise gesendet')}{row(11.55, 'user', 'Wer betroffen ist')}</div>
  </div>""", "dark"),
    scene(13.48, """
  <div class="col gap-m" style="top:700px"><div class="t-l mute" data-in="13.52">Und du?</div><div class="t-xxl" data-in="14.43" data-sfx="tick">Schläfst<br>weiter.</div></div>""", "dark"),
    scene(15.40, logo_end(15.5, "#f5f5f7", TAG, CTA), "dark", fade_out=17.55),
])

# ---------------------------------------------------------------- Heizung (light)
heizung = page("Heizung", [
    scene(0, lock("Sonntag, 8. November", "21:47", "Lena · Mieterin", "Hallo, die Heizung im Bad bleibt kalt.", "Wer kümmert sich?")),
    scene(3.85, f"""
  <div class="col" style="top:290px"><div class="t-m" data-in="3.9">Mit Ecoraum schreibt<br>sie <span class="acc">uns</span>.</div></div>
  {chat(560, 900, [
      m("out", 4.05, "Die Heizung im Bad bleibt kalt."),
      typing(4.45, 4.95),
      m("in", 4.95, "Oh, ungemütlich! Nur der im Bad oder alle?", "Ecoraum"),
      m("out", 5.85, "Nur der im Bad."),
      m("in", 6.45, "Danke! Darf ich das an unser Team geben?", "Ecoraum"),
      m("out", 7.15, "Ja, gerne!"),
  ])}"""),
    scene(7.70, f"""
  <div class="col gap-m" style="top:640px">
    <div data-in="7.70" data-anim="scale"><span class="pill acc">{icon('check', 'currentColor', 2.4)} Fall F-12</span></div>
    <div class="t-xl" data-in="8.18">Übergeben.</div></div>"""),
    scene(9.63, f"""
  <div class="col gap-m" style="top:600px">
    <div class="card" data-in="9.68" data-anim="scale" data-sfx="tick"><div class="k">Montag</div><div class="v">8:00</div><div class="h">Heizungsbauer</div><div class="s">Gartenweg 3 · Bad</div></div>
    <div data-in="11.07" data-anim="scale" data-sfx="tick"><span class="pill acc">{icon('check', 'currentColor', 2.4)} Termin bestätigt</span></div>
  </div>"""),
    scene(13.48, """
  <div class="col gap-m" style="top:700px"><div class="t-l mute" data-in="13.52">Und du?</div><div class="t-xxl" data-in="14.43" data-sfx="tick">Kein<br>Anruf.</div></div>"""),
    scene(15.40, logo_end(15.5, "#0b0b0c", TAG, CTA), fade_out=17.55),
])

# ---------------------------------------------------------------- Frage (light)
frage = page("Frage", [
    scene(0, f"""
  <div class="col" style="top:330px"><div class="t-l" data-in="-1">Diese Frage musst<br>du nie wieder<br><span class="acc">beantworten:</span></div></div>
  {chat(820, 520, [m("out", 0.55, "Mein Heizkörper gluckert. Was kann ich tun?")])}"""),
    scene(3.85, f"""
  <div class="col" style="top:290px"><div class="t-m" data-in="3.9">Unser Assistent<br><span class="acc">antwortet sofort</span>.</div></div>
  {chat(560, 900, [
      m("out", 3.86, "Mein Heizkörper gluckert. Was kann ich tun?", sfx=False),
      typing(4.3, 4.8),
      m("in", 4.8, "Klingt nach Luft im Heizkörper. So geht's:", "Ecoraum"),
      m("in", 5.75, "1. Thermostat aufdrehen\n2. Ventil oben mit dem Schlüssel öffnen\n3. Zudrehen, sobald Wasser kommt", "Ecoraum"),
      m("out", 6.95, "Klappt, danke!"),
  ])}"""),
    scene(7.70, """
  <div class="col" style="top:700px"><div class="t-xl" data-in="7.70" data-anim="scale">Antwort in<br><span class="acc">Sekunden.</span></div></div>"""),
    scene(9.63, f"""
  <div class="col gap-l" style="top:640px">
    <div class="rows">{row(9.68, 'clock', 'Rund um die Uhr')}{row(10.16, 'globe', 'Auch auf Englisch')}{row(10.64, 'chat', 'Text, Foto, Sprachnachricht')}{row(11.12, 'wrench', 'Handwerker, wenn nötig')}</div>
  </div>"""),
    scene(13.48, """
  <div class="col gap-m" style="top:700px"><div class="t-l mute" data-in="13.52">Und du?</div><div class="t-xxl" data-in="14.43" data-sfx="tick">Hast<br>Feierabend.</div></div>"""),
    scene(15.40, logo_end(15.5, "#0b0b0c", "Einfach fragen.", CTA), fade_out=17.55),
])

# ---------------------------------------------------------------- Gründer (light)
gruender = page("Gruender", [
    scene(0, """
  <div class="col gap-m" style="top:520px">
    <div class="t-xl" data-in="-1">Zwei Studenten</div>
    <div class="t-l mute" data-in="0.96">bauen die<br>Hausverwaltung neu.</div>
    <div class="label" data-in="1.925">Stuttgart × Edinburgh</div></div>"""),
    scene(3.85, """
  <div class="col gap-l" style="top:600px">
    <div class="founder" data-in="3.95"><div class="ava">L</div><div><div class="n">Louis</div><div class="d">Stuttgart. Renoviert Wohnungen,<br>kennt die Handwerker.</div></div></div>
    <div class="founder" data-in="5.2"><div class="ava acc">D</div><div><div class="n">Dominic</div><div class="d">Edinburgh. Geografie &amp; Wirtschaft,<br>baut die Technik.</div></div></div>
    <div class="t-s" data-in="6.5" style="color:var(--fg)">Einer vor Ort. Einer an den Prozessen.</div></div>"""),
    scene(7.70, """
  <div class="col" style="top:760px"><div class="t-xxl" data-in="7.70" data-anim="scale" data-exit="0.1" data-out="8.62">Erreichbar.</div></div>
  <div class="col" style="top:760px"><div class="t-xxl" data-in="8.66" data-anim="scale" data-exit="0.1" data-out="9.58">Organisiert.</div></div>
  <div class="col" style="top:760px"><div class="t-xxl acc" data-in="9.63" data-anim="scale" data-exit="0.1" data-out="10.55">Bezahlbar.</div></div>
  <div class="col" style="top:700px"><div class="t-l" data-in="10.59" data-anim="scale">Per WhatsApp.<br><span class="mute">Für Vermieter.</span></div></div>"""),
    scene(11.55, """
  <div class="col gap-m" style="top:700px"><div class="t-l" data-in="11.6">Wir starten in<br>Stuttgart.</div><div class="t-s" data-in="12.4">Die ersten 10 Vermieter gestalten mit.</div></div>"""),
    scene(13.48, """
  <div class="col" style="top:760px"><div class="t-xl" data-in="13.52">Folg uns beim<br><span class="acc">Aufbau.</span></div></div>"""),
    scene(15.40, logo_end(15.5, "#0b0b0c", TAG, CTA), fade_out=17.55),
])

# ---------------------------------------------------------------- Vision (dark)
vision = page("Vision", [
    scene(0, """
  <div class="col gap-m" style="top:470px">
    <div class="label" data-in="-1">Hausverwaltung heute</div>
    <div class="t-xl" data-in="-1"><span class="strike" data-in="2.89" data-anim="strike" data-sfx="tick">Warteschleife.<span class="x"></span></span></div>
    <div class="t-xl" data-in="0.96"><span class="strike" data-in="3.13" data-anim="strike">Keine Antwort.<span class="x"></span></span></div>
    <div class="t-xl" data-in="1.925"><span class="strike" data-in="3.37" data-anim="strike">Zu teuer.<span class="x"></span></span></div></div>""", "dark"),
    scene(3.85, """
  <div class="col gap-m" style="top:700px"><div class="t-xl" data-in="3.9">Das geht<br><span class="acc">besser.</span></div><div class="t-s" data-in="5.78">4 Dinge, die wir anders machen.</div></div>""", "dark"),
    scene(7.70, """
  <div class="col gap-m" style="top:700px" data-in="7.70" data-anim="scale" data-exit="0.1" data-out="9.58"><div class="num">01</div><div class="t-l">Erreichbar per<br>WhatsApp.</div></div>
  <div class="col gap-m" style="top:700px" data-in="9.63" data-anim="scale" data-exit="0.1" data-out="11.51"><div class="num">02</div><div class="t-l">Jeder Fall hat<br>eine Nummer.</div></div>
  <div class="col gap-m" style="top:640px" data-in="11.55" data-anim="scale" data-exit="0.1" data-out="13.44"><div class="num">03</div><div class="t-l">Technik sortiert.<br><span class="mute">Menschen entscheiden.</span></div></div>
  <div class="col gap-m" style="top:700px" data-in="13.48" data-anim="scale" data-exit="0.1" data-out="15.36"><div class="num">04</div><div class="t-l">Ein Bruchteil<br>der Kosten.</div></div>""", "dark"),
    scene(15.40, logo_end(15.5, "#f5f5f7", "Hausverwaltung, neu gedacht.", CTA), "dark", fade_out=17.55),
])

for name, html in (("notfall", notfall), ("heizung", heizung), ("frage", frage), ("gruender", gruender), ("vision", vision)):
    (HERE / f"{name}.html").write_text(html)
print("ok")
