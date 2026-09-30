#!/usr/bin/env python3
"""
NOTTE ROSSA — slice_scene.py

Ritaglia gli oggetti di scena (porte, armadietti, quadro elettrico, radio,
telefono) e le icone d'interazione dell'interfaccia.

Nota: alcune tavole hanno un nome di file che non corrisponde al contenuto
(sono state caricate così): fx_fog.png = porte, fx_rain.png = armadietti,
fx_muzzle.png = quadro elettrico, fx_sparks.png = radio, fx_smoke_puff.png = telefono.

Output:
  assets/sprites/cut/scene/<nome>.png
  assets/sprites/cut/ui/<nome>.png
  js/scene_manifest.js
"""
import json, os
import numpy as np
from PIL import Image
from slice_sprites import ROOT, ASSETS, slice_sheet

OUT_SCENE = os.path.join(ASSETS, 'sprites', 'cut', 'scene')
OUT_UI    = os.path.join(ASSETS, 'sprites', 'cut', 'ui')
os.makedirs(OUT_SCENE, exist_ok=True)
os.makedirs(OUT_UI, exist_ok=True)

# nome -> (tavola, riquadro x0,y0,x1,y1, altezza finale in px a scala 1)
# Una persona in piedi è alta 280 px.
DOORS = 'fx_fog.png'
SCENE = {
  'door_wood':          (DOORS, (50, 35, 182, 268),   330),
  'door_wood_open':     (DOORS, (360, 35, 488, 268),  330),
  'door_metal':         (DOORS, (552, 35, 692, 270),  330),
  'door_metal_open':    (DOORS, (758, 30, 990, 270),  330),
  'door_glass':         (DOORS, (50, 305, 182, 538),  330),
  'door_glass_open':    (DOORS, (358, 300, 498, 538), 330),
  'door_security':      (DOORS, (552, 300, 686, 538), 340),
  'door_security_open': (DOORS, (732, 292, 992, 542), 340),
  'locker':             ('fx_rain.png', (45, 25, 182, 540),   300),
  'locker_open':        ('fx_rain.png', (230, 15, 470, 540),  300),
  'locker_bent':        ('fx_rain.png', (550, 25, 692, 540),  300),
  'locker_fallen':      ('fx_rain.png', (705, 290, 1010, 510), 110),
  'electric_box':       ('fx_muzzle.png', (298, 8, 762, 532), 175),
  'radio_set':          ('fx_sparks.png', (20, 0, 485, 268),   80),
  'payphone':           ('fx_smoke_puff.png', (30, 10, 240, 268), 120),
}

# icone d'interazione (nero su chiaro -> bianco su trasparente)
UI_SHEET = os.path.join(ASSETS, 'ui', 'icons.png')
UI = {
  'use':       (55, 60, 222, 200),
  'take':      (305, 50, 470, 205),
  'door':      (550, 50, 720, 200),
  'examine':   (800, 55, 972, 205),
  'save':      (60, 312, 212, 472),
  'inventory': (310, 312, 470, 472),
  'map':       (555, 312, 715, 472),
  'document':  (810, 312, 962, 472),
}
UI_SIZE = 96


def main():
    manifest = {'scene': {}, 'ui': {}}
    for name, (sheet, box, height) in SCENE.items():
        fr = slice_sheet(sheet, {'layout': 'boxes', 'boxes': [box]})[0]
        if fr is None:
            raise SystemExit(f'{name}: niente trovato in {sheet} {box}')
        im = Image.fromarray(fr[0], 'RGBA')
        k = height / im.height
        im = im.resize((max(1, round(im.width * k)), height), Image.LANCZOS)
        im.save(os.path.join(OUT_SCENE, name + '.png'))
        manifest['scene'][name] = {'file': f'assets/sprites/cut/scene/{name}.png', 'w': im.width, 'h': im.height}
        print(f'{name:20s} {im.width}x{im.height}')

    src = np.array(Image.open(UI_SHEET).convert('L')).astype(np.float32)
    for name, (x0, y0, x1, y1) in UI.items():
        g = src[y0:y1, x0:x1]
        a = np.clip((200 - g) / 150, 0, 1) * 255
        ys, xs = np.nonzero(a > 20)
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        rgba = np.zeros(a.shape + (4,), np.uint8)
        rgba[..., :3] = 255
        rgba[..., 3] = a.astype(np.uint8)
        im = Image.fromarray(rgba, 'RGBA')
        k = (UI_SIZE - 8) / max(im.width, im.height)
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
        c = Image.new('RGBA', (UI_SIZE, UI_SIZE), (0, 0, 0, 0))
        c.alpha_composite(im, ((UI_SIZE - im.width) // 2, (UI_SIZE - im.height) // 2))
        c.save(os.path.join(OUT_UI, name + '.png'))
        manifest['ui'][name] = f'assets/sprites/cut/ui/{name}.png'

    js = ('/* Generato da tools/slice_scene.py — NON modificare a mano */\n'
          'export const SCENE = ' + json.dumps(manifest['scene'], indent=2) + ';\n'
          'export const UI_ICONS = ' + json.dumps(manifest['ui'], indent=2) + ';\n')
    with open(os.path.join(ROOT, 'js', 'scene_manifest.js'), 'w') as fh:
        fh.write(js)
    print('manifest scritto: js/scene_manifest.js')


if __name__ == '__main__':
    main()
