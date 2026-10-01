#!/usr/bin/env python3
"""
NOTTE ROSSA — repack_strips.py

Recupera le figure da una striscia già tagliata (anche se le celle sono
sbagliate, con sfondo bianco o con pezzi della riga sopra) e le rimette
in celle uguali 321x282, piedi sul bordo inferiore, centrate sulle gambe.

  python3 tools/repack_strips.py scan  <file.png>            -> anteprima numerata in tools/slice_debug/
  (le assegnazioni vere sono in RECOVER, sotto: si lancia senza argomenti)
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = os.path.join(ROOT, 'assets', 'sprites', 'cut')
DEBUG = os.path.join(ROOT, 'tools', 'slice_debug')
CELL_W, CELL_H = 321, 282


def load_rgba(path):
    im = np.array(Image.open(path).convert('RGBA')).astype(np.int16)
    # sfondo bianco pieno -> trasparente (solo se l'immagine non ha già trasparenza)
    if (im[..., 3] < 10).mean() < 0.05:
        white = (im[..., 0] > 235) & (im[..., 1] > 235) & (im[..., 2] > 235)
        lab, _ = ndimage.label(white)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        bg = np.isin(lab, list(border))
        im[bg, 3] = 0
    return im.astype(np.uint8)


def figures(im, min_h=0.30):
    """Ritorna i ritagli (x0, x1, y0, y1) delle figure, da sinistra a destra.
    Scarta i frammenti tagliati dalla riga sopra (attaccati al bordo alto e bassi)."""
    H = im.shape[0]
    mask = im[..., 3] > 40
    lab, n = ndimage.label(mask)
    keep = np.zeros_like(mask)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        h = sl[0].stop - sl[0].start
        if sl[0].start <= 2 and h < H * 0.45:      # piedi della riga sopra
            continue
        if (lab[sl] == i).sum() < 60:              # polvere
            continue
        keep |= lab == i
    cols = keep.any(axis=0)
    runs, x = [], 0
    W = len(cols)
    while x < W:
        if cols[x]:
            s = x
            while x < W and cols[x]: x += 1
            runs.append([s, x])
        else:
            x += 1
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < 6: merged[-1][1] = r[1]
        else: merged.append(r)
    out = []
    for x0, x1 in merged:
        rows = keep[:, x0:x1].any(axis=1)
        ys = np.where(rows)[0]
        y0, y1 = ys[0], ys[-1] + 1
        if (y1 - y0) < H * min_h and (x1 - x0) < 60:
            continue
        out.append((x0, x1, y0, y1))
    return out, keep


def figures_by_components(im):
    """Figure che si sovrappongono in orizzontale ma non si toccano (es. canne dei fucili):
    ogni pezzo grande è una figura, i pezzi piccoli (vampate, schegge) vanno alla figura più vicina."""
    _, keep = figures(im)
    lab, n = ndimage.label(keep)
    sizes = ndimage.sum(keep, lab, range(1, n + 1))
    big = [i + 1 for i, sz in enumerate(sizes) if sz >= 0.08 * sizes.max()]
    objs = ndimage.find_objects(lab)
    cx = {i: (objs[i - 1][1].start + objs[i - 1][1].stop) / 2 for i in range(1, n + 1)}
    owner = {}
    for i in range(1, n + 1):
        owner[i] = i if i in big else min(big, key=lambda b: abs(cx[b] - cx[i]))
    out = []
    for b in sorted(big, key=lambda b: cx[b]):
        mask = np.isin(lab, [i for i, o in owner.items() if o == b])
        ys, xs = np.where(mask)
        out.append(((xs.min(), xs.max() + 1, ys.min(), ys.max() + 1), mask))
    return out


def leg_center(alpha):
    h = alpha.shape[0]
    low = alpha[int(h * 0.8):] > 40
    xs = np.where(low.any(axis=0))[0]
    return (xs[0] + xs[-1]) / 2 if len(xs) else alpha.shape[1] / 2


def pack(src, picks, dst, target_h=None, flip=False, bottom=4, components=False):
    """picks: indici delle figure; (i, k, n) = figura i tagliata in n parti uguali, prendi la k-esima.
    target_h: altezza della figura più alta della striscia (le altre in proporzione)."""
    im = load_rgba(src)
    figs, keep = figures(im)
    comps = figures_by_components(im) if components else None
    cells = []
    for p in picks:
        if comps is not None:
            (x0, x1, y0, y1), mask = comps[p]
            crop = im[y0:y1, x0:x1].copy()
            crop[~mask[y0:y1, x0:x1], 3] = 0
            c = Image.fromarray(crop)
            cells.append(c.transpose(Image.FLIP_LEFT_RIGHT) if flip else c)
            continue
        i, k, n = p if isinstance(p, tuple) else (p, 0, 1)
        x0, x1, y0, y1 = figs[i]
        if n > 1:
            # taglio nella colonna più vuota vicino alla divisione in parti uguali
            # (figure che si toccano con armi o piedi)
            w = (x1 - x0) / n
            col = keep[:, x0:x1].sum(axis=0)
            def cut(j):
                if j <= 0: return 0
                if j >= n: return x1 - x0
                c = round(j * w); r = round(w * 0.25)
                a, b = max(1, c - r), min(len(col) - 1, c + r)
                return a + int(np.argmin(col[a:b]))
            x0, x1 = x0 + cut(k), x0 + cut(k + 1)
            rows = keep[:, x0:x1].any(axis=1)
            ys = np.where(rows)[0]
            y0, y1 = ys[0], ys[-1] + 1
        crop = im[y0:y1, x0:x1].copy()
        crop[~keep[y0:y1, x0:x1], 3] = 0
        c = Image.fromarray(crop)
        if flip: c = c.transpose(Image.FLIP_LEFT_RIGHT)
        cells.append(c)
    k = 1.0
    if target_h:
        k = target_h / max(c.height for c in cells)
    cells = [c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS) if k != 1 else c for c in cells]
    cw = max(CELL_W, max(c.width for c in cells) + 8)
    cw += cw % 2
    out = Image.new('RGBA', (cw * len(cells), CELL_H), (0, 0, 0, 0))
    for n, c in enumerate(cells):
        lc = leg_center(np.array(c)[..., 3])
        x = round(n * cw + cw / 2 - lc)
        x = max(n * cw, min(x, (n + 1) * cw - c.width))
        out.alpha_composite(c, (x, CELL_H - bottom - c.height))
    out.save(dst)
    return len(cells), cw


def scan(path):
    im = load_rgba(path)
    figs, _ = figures(im)
    pv = Image.new('RGBA', (im.shape[1], im.shape[0]), (80, 80, 80, 255))
    pv.alpha_composite(Image.fromarray(im))
    d = ImageDraw.Draw(pv)
    for i, (x0, x1, y0, y1) in enumerate(figs):
        d.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(255, 255, 0, 255))
        d.text((x0 + 3, y0 + 3), str(i), fill=(255, 60, 60, 255))
    os.makedirs(DEBUG, exist_ok=True)
    pv.save(os.path.join(DEBUG, 'scan_' + os.path.basename(path)))
    return figs


# infermiere_dead.png resta quella originale (5 pose, camice azzurro).
# Tavole recuperate (ottobre 2026): le strisce nuove erano finite sotto il nome
# sbagliato. Sorgenti in tools/recover_src/ (copie delle strisce sbagliate),
# destinazione = nome giusto.  (sorgente, figure, destinazione, altezza figura[, separa per pezzi connessi])
RECOVER = [
    ('pistol_sheet.png',   [0, 1],                           'player_aim.png',          272),
    ('pistol_sheet.png',   [(2, 0, 3), (2, 1, 3), (2, 2, 3)], 'player_shoot.png',        272),
    ('pistol_sheet.png',   [3, 4, 5, 6],                     'player_reload.png',       272),
    ('player_idle4.png',   [0, 1, 2, 3],                     'player_idle.png',         274),
    ('player_sneak6.png',  [0, 1, 2, 3, 4, 5],               'player_sneak.png',        230),
    ('player_torch6.png',  [0, 1, 2, 3, 4, 5],               'player_flashlight_walk.png', 270),
    ('shotgun_sheet.png',  [0, 1],                           'player_shotgun_aim.png',  270),
    ('shotgun_sheet.png',  [2, 3, 4, 5],                     'player_shotgun_shoot.png', 270),
    ('contaminato_dead4.png', [0, 1, 2, 3],                  'contaminato_dead.png',    256),
    ('corridore_run6.png', [0, 1, 2, (3, 0, 2), (3, 1, 2), 4], 'corridore_run.png',     205),
    ('ferroviere_walk6.png', [0, 1, 2, 3, 4, 5],             'ferroviere_walk.png',     264),
    ('ferroviere_attack4.png', [0, 1, 2, 3],                 'ferroviere_attack.png',   264),
    ('ferroviere_dead.png', [0, (1, 0, 2), (1, 1, 2), 2],    'ferroviere_dead.png',     264),
    ('infermiere_walk6.png', [0, 1, 2, 3, 4, 5],             'infermiere_walk.png',     264),
    ('infermiere_attack4.png', [0, 1, 2, 3],                 'infermiere_attack.png',   264),
    ('infermiere_walk6.png', [0],                            'infermiere_idle.png',     264),
    ('contaminato_walk8.png', [0],                           'contaminato_idle.png',    256),
    ('tecnico_walk6.png',  [0, 1, 2, 3, 4, 5],               'tecnico_walk.png',        264),
    ('tecnico_attack4.png', [0, 1, 2, 3],                    'tecnico_attack.png',      264),
    ('tecnico_dead4.png',  [0, 1, 2, 3],                     'tecnico_dead.png',        264),
    # tavole nuove dal kit dei prompt
    ('luca_gun_idle.png',     [0, 1],                         'player_gun_idle.png',     272),
    ('luca_walk_pistol.png',  [0, 1, 2, 3, 4, 5],             'player_walk_gun.png',     268),
    ('luca_hurt.png',         [0, 1],                         'player_hurt.png',         250),
    ('luca_shotgun_walk.png', [0, 1, 2, 3, 4, 5],             'player_walk_shotgun.png', 266, True),
    ('luca_wounded.png',      [0, 1, 2, 3],                   'player_wounded.png',      255),
]
SRC_DIR = os.path.join(ROOT, 'tools', 'recover_src')

if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == 'scan':
        for p in sys.argv[2:]:
            print(os.path.basename(p), [(f[1] - f[0], f[3] - f[2]) for f in scan(p)])
    else:
        for src, picks, dst, h, *opt in RECOVER:
            n, cw = pack(os.path.join(SRC_DIR, src), picks, os.path.join(CUT, dst), target_h=h, components=bool(opt and opt[0]))
            print(f'{dst:30s} {n} pose, cella {cw}x{CELL_H}')
