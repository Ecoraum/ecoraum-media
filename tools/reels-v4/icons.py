"""Monoline icon set (24×24, 1.8 stroke, round caps) – replaces emojis for a cleaner look."""

PATHS = {
    "chat": '<path d="M4.5 18.5 5.6 15A7.5 7.5 0 1 1 9 18.4z"/>',
    "drop": '<path d="M12 3.2s5.8 6.3 5.8 10.6a5.8 5.8 0 0 1-11.6 0C6.2 9.5 12 3.2 12 3.2z"/>',
    "pin": '<path d="M12 21s-6.2-5.4-6.2-10.6a6.2 6.2 0 0 1 12.4 0C18.2 15.6 12 21 12 21z"/><circle cx="12" cy="10.4" r="2.3"/>',
    "camera": '<rect x="3.2" y="6.6" width="17.6" height="12.6" rx="3"/><path d="M8.6 6.6 10 4.4h4l1.4 2.2"/><circle cx="12" cy="12.9" r="3.3"/>',
    "shield": '<path d="M12 3.4 19 6v5.6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="m9 12.2 2.1 2.1 4-4.2"/>',
    "user": '<circle cx="12" cy="8.4" r="3.6"/><path d="M5.2 20c.8-3.6 3.6-5.6 6.8-5.6s6 2 6.8 5.6"/>',
    "check": '<path d="m5 12.6 4.3 4.3L19 7.4"/>',
    "clock": '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2"/>',
    "wrench": '<path d="M14.6 4.2a4.6 4.6 0 0 0 4.9 6.6L11 19.3a2.4 2.4 0 0 1-3.4-3.4L16.1 7.4z"/><path d="M14.6 4.2 12.8 7l1.2 3 3 1.2 2.8-1.8"/>',
    "calendar": '<rect x="3.6" y="5" width="16.8" height="15" rx="3"/><path d="M3.6 9.6h16.8M8 3.2v3.6M16 3.2v3.6"/>',
    "bolt": '<path d="M13.2 3 5.6 13.4h6l-1 7.6 7.8-10.6h-6z"/>',
    "thermo": '<path d="M10 14.6V5.4a2 2 0 0 1 4 0v9.2a3.8 3.8 0 1 1-4 0z"/><path d="M12 10v6.4"/>',
    "bell": '<path d="M6.4 16.6V11a5.6 5.6 0 0 1 11.2 0v5.6l1.6 1.8H4.8z"/><path d="M10 20.4a2.1 2.1 0 0 0 4 0"/>',
    "house": '<path d="M3.6 11.2 12 4l8.4 7.2"/><path d="M6 9.4V20h12V9.4"/>',
    "spark": '<path d="M12 3.6v4M12 16.4v4M3.6 12h4M16.4 12h4M6.1 6.1l2.8 2.8M15.1 15.1l2.8 2.8M6.1 17.9l2.8-2.8M15.1 8.9l2.8-2.8"/>',
    "globe": '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.4 2.4 3.6 5.3 3.6 8.6S14.4 18.2 12 20.6c-2.4-2.4-3.6-5.3-3.6-8.6S9.6 5.8 12 3.4z"/>',
    "mic": '<rect x="9" y="3.4" width="6" height="11" rx="3"/><path d="M5.8 11.4a6.2 6.2 0 0 0 12.4 0M12 17.6v3"/>',
}


def icon(name, color="currentColor", width=1.8):
    return (f'<svg viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{width}" '
            f'stroke-linecap="round" stroke-linejoin="round">{PATHS[name]}</svg>')
