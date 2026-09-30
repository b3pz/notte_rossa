#!/usr/bin/env python3
"""Prova automatica: apre index.html da file://, gioca l'inizio, fotografa."""
import os, sys, time
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/shots'
os.makedirs(OUT, exist_ok=True)

errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('console', lambda m: errors.append(f'[{m.type}] {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errors.append(f'[pageerror] {e}'))
    pg.goto('file://' + os.path.join(ROOT, 'index.html'))
    time.sleep(3.5)
    pg.screenshot(path=f'{OUT}/00_menu.png')

    pg.click('#btn-nuova')
    time.sleep(5.5)
    pg.screenshot(path=f'{OUT}/01_wagon_tutorial.png')
    for _ in range(4):
        pg.keyboard.press('Space'); time.sleep(0.6)
    # cammina a destra fino al binario
    pg.keyboard.down('KeyD'); time.sleep(4.5); pg.keyboard.up('KeyD')
    time.sleep(1.5)
    pg.screenshot(path=f'{OUT}/02_platform.png')
    time.sleep(2.5)
    pg.keyboard.press('Space'); time.sleep(0.5)
    # vai al telefono
    pg.keyboard.down('KeyD'); time.sleep(4.2); pg.keyboard.up('KeyD')
    pg.screenshot(path=f'{OUT}/03_phone.png')
    pg.keyboard.press('KeyE'); time.sleep(0.8)
    for _ in range(8):
        pg.keyboard.press('Space'); time.sleep(0.7)
    time.sleep(6)
    pg.screenshot(path=f'{OUT}/04_title.png')
    time.sleep(5)
    for _ in range(3):
        pg.keyboard.press('Space'); time.sleep(0.7)
    pg.screenshot(path=f'{OUT}/05_after_intro.png')
    state = pg.evaluate('''() => { const g = window._notteRossa; return {
        room: g.roomManager.current.id, x: Math.round(g.player.x), locked: g.input.locked,
        enemies: g.enemyManager.enemies.map(e => e.type + ':' + e.state + '@' + Math.round(e.x)),
        flags: Object.keys(g.events.flags).filter(k => g.events.flags[k]) } }''')
    print(state)
    b.close()

print('\n'.join(errors) or 'nessun errore in console')
