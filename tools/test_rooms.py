#!/usr/bin/env python3
"""Fotografa tutte le stanze (con riquadri di debug) e compone dei provini."""
import os, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/rooms'
DEBUG = '--nodebug' not in sys.argv
os.makedirs(OUT, exist_ok=True)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.goto('file://' + os.path.join(ROOT, 'index.html'))
    time.sleep(2)
    pg.click('#btn-nuova')
    time.sleep(3)
    ids = pg.evaluate('Object.keys(window._notteRossa.roomManager.roomData)')
    pg.evaluate(f'''() => {{ const g = window._notteRossa; g.dialogue.close(); g.debug = {str(DEBUG).lower()};
        g.ui.fadeIn(0); g.player.takeDamage = () => false; g.events.setFlag('intro_complete'); g.events.setFlag('has_pistol'); }}''')
    shots = []
    for rid in ids:
        pg.evaluate(f'''() => {{ const g = window._notteRossa; g.dialogue.close();
            g.events._fired = new Set(Object.keys(g.events._defs));
            g.roomManager.loadRoom('{rid}', 560); g.player.facingRight = true; g.input.unlock(); }}''')
        time.sleep(0.9)
        f = f'{OUT}/{rid}.png'
        pg.screenshot(path=f)
        shots.append((rid, f))
    b.close()

# provini 3x3
tw, th = 640, 360
for k in range(0, len(shots), 9):
    sheet = Image.new('RGB', (tw * 3, (th + 20) * 3), 'black')
    d = ImageDraw.Draw(sheet)
    for i, (rid, f) in enumerate(shots[k:k + 9]):
        im = Image.open(f).convert('RGB').resize((tw, th))
        x, y = (i % 3) * tw, (i // 3) * (th + 20)
        sheet.paste(im, (x, y + 20))
        d.text((x + 4, y + 4), rid, fill='white')
    sheet.save(f'{OUT}/_sheet_{k // 9}.png')
print(len(shots), 'stanze;', 'errori:', errors or 'nessuno')
