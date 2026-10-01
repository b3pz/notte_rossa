#!/usr/bin/env python3
"""
NOTTE ROSSA — make_reference.py
Crea docs/reference/NotteRossa_reference.zip: riferimenti di stile, personaggi,
fondali, icone e screenshot della GUI da allegare ai prompt (vedi docs/reference/LEGGIMI.md).

Uso:  python3 tools/make_reference.py [cartella_screenshot_gui]
"""
import glob, io, json, os, sys, zipfile
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = os.path.join(ROOT, 'assets', 'sprites', 'cut')
OUT = os.path.join(ROOT, 'docs', 'reference', 'NotteRossa_reference.zip')
GUI = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'reference', 'gui')

# riferimento "ufficiale" di ogni personaggio: strisce già nel gioco
CHARS = {
    'luca_camminata':       ['player_walk.png'],
    'luca_accovacciato':    ['player_sneak.png'],
    'luca_pistola':         ['player_aim.png', 'player_shoot.png', 'player_reload.png'],
    'luca_fucile':          ['player_shotgun_aim.png', 'player_shotgun_shoot.png'],
    'luca_torcia':          ['player_flashlight_walk.png'],
    'luca_fermo':           ['player_idle.png'],
    'elena':                ['elena_walk.png', 'elena_idle.png', 'elena_point.png'],
    'carmine_parla':        ['carmine_talk.png'],
    'contaminato':          ['contaminato_walk.png', 'contaminato_dead.png'],
    'ferroviere':           ['ferroviere_walk.png', 'ferroviere_attack.png'],
    'infermiere':           ['infermiere_walk.png', 'infermiere_attack.png'],
    'tecnico':              ['tecnico_walk.png', 'tecnico_attack.png'],
    'corridore_corsa':      ['corridore_run.png'],
    'crawler':              ['crawler_idle.png', 'crawler_walk.png', 'crawler_ceiling.png', 'crawler_leap.png'],
    'listener':             ['listener_idle.png', 'listener_walk.png', 'listener_listen.png', 'listener_run.png'],
}


def png_bytes(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return b.getvalue()


def jpg_bytes(im, q=86):
    b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=q, optimize=True); return b.getvalue()


def stack(files, bg=(255, 255, 255, 0)):
    ims = [Image.open(os.path.join(CUT, f)).convert('RGBA') for f in files]
    w = max(i.width for i in ims); h = sum(i.height + 20 for i in ims)
    out = Image.new('RGBA', (w, h), bg); y = 0
    for i in ims:
        out.alpha_composite(i, (0, y)); y += i.height + 20
    if out.width > 3000:
        out = out.resize((3000, round(out.height * 3000 / out.width)), Image.LANCZOS)
    return out


def cast_lineup():
    src = open(os.path.join(ROOT, 'js', 'sprite_manifest.js'), encoding='utf-8').read()
    S = json.loads(src.split('export const SPRITES =')[1].split('export const ICONS')[0].strip().rstrip(';'))
    rows = []
    for ch, d in S.items():
        items = []
        for a, ad in d['anims'].items():
            im = Image.open(os.path.join(ROOT, ad['file'])).convert('RGBA')
            cw = im.width // ad['frames']; f = min(1, ad['frames'] - 1)
            items.append((a, im.crop((f * cw, 0, (f + 1) * cw, im.height))))
        rows.append((ch, items))
    W = max(sum(max(240, c.width) for _, c in it) for _, it in rows) + 20
    out = Image.new('RGB', (W, 300 * len(rows)), (60, 62, 68)); d = ImageDraw.Draw(out)
    for r, (ch, items) in enumerate(rows):
        x, base = 10, r * 300 + 290
        d.line([(0, base), (W, base)], fill=(0, 160, 0))
        for a, c in items:
            w = max(240, c.width); cx = x + w // 2
            out.paste(c, (cx - c.width // 2, base - c.height), c)
            d.text((x + 4, r * 300 + 4), f'{ch}: {a}', fill=(255, 230, 0)); x += w
    return out


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        z.write(os.path.join(ROOT, 'docs', 'reference', 'LEGGIMI.md'), 'LEGGIMI.md')
        z.write(os.path.join(ROOT, 'assets', 'sprites', 'player_walk8.png'), '00_stile/stile_master_luca_camminata.png')
        z.writestr('00_stile/cast_attuale.png', jpg_bytes(cast_lineup(), 90))
        for name, files in CHARS.items():
            z.writestr(f'01_personaggi/{name}.png', png_bytes(stack(files)))
        for f in sorted(glob.glob(os.path.join(GUI, '*.png'))):
            z.writestr(f'02_gui_attuale/{os.path.basename(f)[:-4]}.jpg', jpg_bytes(Image.open(f)))
        bgs = sorted(f for f in glob.glob(os.path.join(ROOT, 'assets', 'backgrounds', 'v2', '*.png')) if '_originale' not in f)
        for f in bgs + [os.path.join(ROOT, 'assets', 'backgrounds', 'provvisori', 'menu_bg.png')]:
            im = Image.open(f); k = 720 / im.height
            im = im.resize((round(im.width * k), 720), Image.LANCZOS)
            z.writestr(f'03_fondali/{os.path.basename(f)[:-4]}.jpg', jpg_bytes(im, 82))
        icons = sorted(glob.glob(os.path.join(CUT, 'icons', '*.png')))
        sheet = Image.new('RGBA', (8 * 120, ((len(icons) + 7) // 8) * 130), (40, 40, 44, 255)); d = ImageDraw.Draw(sheet)
        for i, f in enumerate(icons):
            z.write(f, f'04_icone/{os.path.basename(f)}')
            im = Image.open(f).convert('RGBA'); x, y = (i % 8) * 120 + 12, (i // 8) * 130 + 4
            sheet.alpha_composite(im, (x, y)); d.text((x, y + 100), os.path.basename(f)[:-4], fill=(220, 220, 220))
        z.writestr('04_icone/_provino_icone.png', png_bytes(sheet))
    print(f'{OUT} — {os.path.getsize(OUT) // 1024} KB')


if __name__ == '__main__':
    main()
