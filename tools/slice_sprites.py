#!/usr/bin/env python3
"""
NOTTE ROSSA — slice_sprites.py

Converte le tavole generate (sfondo bianco, disposizione libera, didascalie)
in strisce di animazione pulite:
  - sfondo bianco -> trasparente
  - didascalie e linee di griglia rimosse
  - ogni figura isolata, scalata alla stessa altezza di riferimento,
    appoggiata sul bordo inferiore della cella e centrata sulle gambe
  - tutte le figure rivolte a DESTRA (il gioco specchia per la sinistra)

Output:
  assets/sprites/cut/<personaggio>_<animazione>.png   (striscia orizzontale)
  js/sprite_manifest.js                                (manifest per il gioco)
  tools/slice_debug/<tavola>.png                       (figure numerate, per controllo)

CONFIG qui sotto è l'unica fonte di verità: quale tavola, quale figura,
quale animazione. Per cambiare uno sprite si modifica solo qui e si rilancia.
"""
import json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
SRC    = os.path.join(ASSETS, 'sprites')
OUT    = os.path.join(SRC, 'cut')
DEBUG  = os.path.join(ROOT, 'tools', 'slice_debug')
os.makedirs(OUT, exist_ok=True)
os.makedirs(DEBUG, exist_ok=True)

# Altezza (px) di una figura umana in piedi nelle strisce finali
HUMAN_H = 280

# layout: 'free' = figure sparse (righe rilevate automaticamente)
#         'grid' = griglia cols x rows con eventuali didascalie
# scale:  'auto' = figura più alta della tavola -> HUMAN_H ; numero = fattore fisso
# flip:   True se la tavola è disegnata rivolta a sinistra
CONFIG = {
  'player': {
    'sheets': {
      'player_idle.png':       {'layout': 'free'},
      'player_walk_run.png':   {'layout': 'free'},
      'player_gun.png':        {'layout': 'free'},
      'player_hurt_death.png': {'layout': 'free'},
      'player_flashlight.png': {'layout': 'free'},
      'player_crouch.png':     {'layout': 'free'},
      # tavole nuove (ottobre 2026): camminata 8 pose, corsa 6 pose — stessa scala
      'player_walk8.png':      {'layout': 'boxes', 'boxes': [(0, 0, 231, 724), (231, 0, 517, 724), (517, 0, 821, 724), (821, 0, 1121, 724), (1121, 0, 1379, 724), (1379, 0, 1613, 724), (1613, 0, 1905, 724), (1905, 0, 2172, 724)], 'scale': 0.456},
      'player_run6.png':       {'layout': 'boxes', 'boxes': [(0, 0, 395, 724), (395, 0, 733, 724), (733, 0, 1116, 724), (1116, 0, 1431, 724), (1431, 0, 1727, 724), (1727, 0, 2172, 724)], 'scale': 0.456},
    },
    'anims': {
      'idle':       ('player_idle.png',       [0],        3,  True),
      'walk':       ('player_walk8.png',      [0,1,2,3,4,5,6,7], 10, True),
      'run':        ('player_run6.png',       [0,1,2,3,4,5],     12, True),
      'gun_idle':   ('player_gun.png',        [0],        3,  True),
      'aim':        ('player_gun.png',        [2],        3,  True),
      'shoot':      ('player_gun.png',        [3,4,5],    14, False),
      'reload':     ('player_gun.png',        [6,7,8],    5,  False),
      'hurt':       ('player_hurt_death.png', [1,2],      8,  False),
      'wounded':    ('player_hurt_death.png', [3,4],      4,  True),
      'death':      ('player_hurt_death.png', [5,6,7],    4,  False),
      'flashlight': ('player_flashlight.png', [0],        3,  True),
      'push':       ('player_flashlight.png', [6,7,8],    5,  False),
      'crouch':     ('player_crouch.png',     [1],        3,  True),
      'sneak':      ('player_crouch.png',     [2,3],      5,  True),
      'hide':       ('player_crouch.png',     [7],        3,  True),
    },
  },
  'contaminato': {
    'sheets': {
      'enemy_contaminato_sheet.png': {'layout': 'grid', 'cols': 4, 'rows': 2},
    },
    'anims': {
      'idle':   ('enemy_contaminato_sheet.png', [0,4],   3, True),
      'walk':   ('enemy_contaminato_sheet.png', [1,2,3], 5, True),
      'attack': ('enemy_contaminato_sheet.png', [5],     3, True),
      'hurt':   ('enemy_contaminato_sheet.png', [6],     3, False),
      'dead':   ('enemy_contaminato_sheet.png', [7],     1, False),
    },
  },
  'corridore': {
    'sheets': {
      'enemy_corridore_sheet.png': {'layout': 'grid', 'cols': 4, 'rows': 2, 'flip': True, 'overflow': True, 'mul': 0.88},
    },
    'anims': {
      'idle':   ('enemy_corridore_sheet.png', [0],     6,  True),
      'walk':   ('enemy_corridore_sheet.png', [1,2,3], 12, True),
      'leap':   ('enemy_corridore_sheet.png', [4],     3,  True),
      'attack': ('enemy_corridore_sheet.png', [5],     3,  True),
      'hurt':   ('enemy_corridore_sheet.png', [6],     3,  False),
      'dead':   ('enemy_corridore_sheet.png', [7],     1,  False),
    },
  },
  'crawler': {
    'sheets': {
      'enemy_crawler_sheet.png': {'layout': 'grid', 'cols': 4, 'rows': 2, 'scale': 0.82, 'overflow': True},
    },
    'anims': {
      'idle':    ('enemy_crawler_sheet.png', [0],   3, True),
      'walk':    ('enemy_crawler_sheet.png', [1,2], 6, True),
      'run':     ('enemy_crawler_sheet.png', [3],   3, True),
      'ceiling': ('enemy_crawler_sheet.png', [4],   3, True),
      'leap':    ('enemy_crawler_sheet.png', [5],   3, True),
      'attack':  ('enemy_crawler_sheet.png', [6],   3, True),
      'dead':    ('enemy_crawler_sheet.png', [7],   1, False),
    },
  },
  'listener': {
    'sheets': {
      'enemy_listener_sheet.png': {'layout': 'grid', 'cols': 4, 'rows': 2},
    },
    'anims': {
      'idle':   ('enemy_listener_sheet.png', [0],   3, True),
      'walk':   ('enemy_listener_sheet.png', [1,2], 4, True),
      'listen': ('enemy_listener_sheet.png', [3],   3, True),
      'alert':  ('enemy_listener_sheet.png', [4],   3, True),
      'run':    ('enemy_listener_sheet.png', [5],   3, True),
      'attack': ('enemy_listener_sheet.png', [6],   3, True),
      'hurt':   ('enemy_listener_sheet.png', [7],   3, False),
    },
  },
  # ── Personaggi non giocanti ──
  'carmine': {   # ferroviere vivo (npc_worker.png)
    'sheets': {'npc_worker.png': {'layout': 'free'}},
    'anims': {
      'idle':   ('npc_worker.png', [0], 1, True),
      'talk':   ('npc_worker.png', [1], 1, True),
      'check':  ('npc_worker.png', [2], 1, True),
      'scared': ('npc_worker.png', [3], 1, True),
    },
  },
  'elena': {     # sorella del protagonista (player_states.png)
    'sheets': {'player_states.png': {'layout': 'free', 'mul': 0.95}},
    'anims': {
      'idle':   ('player_states.png', [0], 1, True),
      'talk':   ('player_states.png', [1], 1, True),
      'point':  ('player_states.png', [2], 1, True),
      'scared': ('player_states.png', [3], 1, True),
    },
  },
  # ── Varianti contaminato (tavola nuova, un'unica posa ciascuna) ──
  'ferroviere': {
    'sheets': {'sprites_sheet_master.png': {'layout': 'boxes', 'boxes': [(745, 240, 828, 446)]}},
    'anims': {'idle': ('sprites_sheet_master.png', [0], 1, True)},
  },
  'infermiere': {
    'sheets': {'sprites_sheet_master.png': {'layout': 'boxes', 'boxes': [(837, 240, 918, 446)]}},
    'anims': {'idle': ('sprites_sheet_master.png', [0], 1, True)},
  },
  'tecnico': {
    'sheets': {'sprites_sheet_master.png': {'layout': 'boxes', 'boxes': [(924, 240, 1010, 446)]}},
    'anims': {'idle': ('sprites_sheet_master.png', [0], 1, True)},
  },
}

# ── Icone oggetti: nome -> (tavola, opzioni, indice figura) ──
M = 'sprites_sheet_master.png'
ICONS = {
  'pistol':        ('item_pistol.png',             {'layout': 'free'}, 0),
  'ammo_pistol':   ('item_ammo.png',               {'layout': 'free'}, 0),
  'flashlight':    ('items/flashlight_sheet.png',  {'layout': 'grid', 'cols': 2, 'rows': 2}, 1),
  'medikit':       ('items/medikit.png',           {'layout': 'free'}, 0),
  'bandage':       ('items/medikit.png',           {'layout': 'free'}, 1),
  'painkillers':   ('items/medikit.png',           {'layout': 'free'}, 3),
  'key_station':   ('items/keys.png',              {'layout': 'grid', 'cols': 4, 'rows': 2}, 0),
  'key_deposito':  ('items/keys.png',              {'layout': 'grid', 'cols': 4, 'rows': 2}, 1),
  'key_hospital':  ('items/keys.png',              {'layout': 'grid', 'cols': 4, 'rows': 2}, 2),
  'key_lab':       ('items/keys.png',              {'layout': 'grid', 'cols': 4, 'rows': 2}, 3),
  'badge':         ('items/keys.png',              {'layout': 'grid', 'cols': 4, 'rows': 2}, 4),
  'key_industrial':('items/keys.png',              {'layout': 'grid', 'cols': 4, 'rows': 2}, 5),
  'key_rusty':     ('items/keys.png',              {'layout': 'grid', 'cols': 4, 'rows': 2}, 6),
  'card':          ('items/keys.png',              {'layout': 'grid', 'cols': 4, 'rows': 2}, 7),
  'fuse':          ('items/components.png',        {'layout': 'grid', 'cols': 4, 'rows': 2}, 0),
  'battery':       ('items/components.png',        {'layout': 'grid', 'cols': 4, 'rows': 2}, 1),
  'crank':         ('items/components.png',        {'layout': 'grid', 'cols': 4, 'rows': 2}, 4),
  'valve':         ('items/components.png',        {'layout': 'grid', 'cols': 4, 'rows': 2}, 5),
  'note':          ('items/items_sheet.png',       {'layout': 'grid', 'cols': 4, 'rows': 4}, 9),
  'radio':         ('items/items_sheet.png',       {'layout': 'grid', 'cols': 4, 'rows': 4}, 10),
  'shotgun':       (M, {'layout': 'boxes', 'boxes': [(245, 475, 345, 557)]}, 0),
  'ammo_shells':   (M, {'layout': 'boxes', 'boxes': [(389, 511, 441, 561)]}, 0),
  'crowbar':       (M, {'layout': 'boxes', 'boxes': [(443, 470, 524, 560)]}, 0),
  'recorder':      (M, {'layout': 'boxes', 'boxes': [(526, 473, 602, 559)]}, 0),
  'usb':           (M, {'layout': 'boxes', 'boxes': [(609, 479, 682, 552)]}, 0),
  'vial':          (M, {'layout': 'boxes', 'boxes': [(700, 471, 735, 561)]}, 0),
  'city_map':      (M, {'layout': 'boxes', 'boxes': [(745, 476, 847, 556)]}, 0),
  'alert':         (M, {'layout': 'boxes', 'boxes': [(890, 462, 936, 507)]}, 0),
  'padlock':       (M, {'layout': 'boxes', 'boxes': [(275, 119, 326, 192)]}, 0),
}
ICON_SIZE = 96

# ── Oggetti di scena dalla tavola nuova ──
# 'cut'  = toglie lo sfondo bianco e tiene la figura
# 'raw'  = ritaglio rettangolare (hanno già lo sfondo scuro), diviso in N fotogrammi
SCENE_PROPS = {
  'barricade_closed': ('cut', (9, 114, 70, 204), 1),
  'barricade_broken': ('cut', (74, 114, 133, 204), 1),
  'door_ajar':        ('cut', (135, 111, 198, 207), 1),
  'door_open':        ('cut', (197, 111, 260, 207), 1),
  'lever_off':        ('cut', (522, 143, 571, 181), 1),
  'lever_on':         ('cut', (662, 120, 710, 181), 1),
  'monitor_static':   ('raw', (278, 222, 515, 257), 6),
  'neon':             ('raw', (8, 218, 265, 262), 6),
}

# ── Cadaveri (decorazioni di scena) ──
# ogni corpo viene scalato perché la sua "lunghezza" (max tra larghezza e 1,15×altezza)
# sia BODY_LEN: circa 0,86 di una persona in piedi
BODIES = ('bodies_sheet.png', {'layout': 'free'}, None)
BODY_LEN = 240


# ─────────────────────────────────────────────
def remove_background(rgb):
    """Ritorna maschera figura (bool) togliendo il bianco collegato ai bordi."""
    a = rgb.astype(np.int16)
    mn = a.min(axis=2)
    mx = a.max(axis=2)
    near_white = (mn > 222) & ((mx - mn) < 28)
    lab, n = ndimage.label(near_white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    border.discard(0)
    bg = np.isin(lab, list(border))
    # sacche di bianco chiuse (tra gambe e braccia): anche quelle sono sfondo
    if n:
        sizes = ndimage.sum(near_white, lab, index=np.arange(1, n + 1))
        pockets = np.nonzero(sizes > 30)[0] + 1
        bg |= np.isin(lab, pockets) & (mn > 226)
    fg = ~bg
    # togli linee di griglia sottili e lunghe
    fg = ndimage.binary_opening(fg, structure=np.ones((3, 3)))
    # togli le lettere delle didascalie: blob piccoli e isolati
    lab, n = ndimage.label(fg, structure=np.ones((3, 3)))
    if n:
        sizes = ndimage.sum(fg, lab, index=np.arange(1, n + 1))
        small = np.nonzero(sizes < 450)[0] + 1
        fg[np.isin(lab, small)] = False
    return fg


def is_text_like(h, w):
    return h < 42 and w > 1.6 * h


def find_figures(fg, min_area):
    """Componenti = figure. Unisce pezzi staccati vicini (dita, oggetti)."""
    joined = ndimage.binary_dilation(fg, iterations=6)
    lab, n = ndimage.label(joined)
    objs = ndimage.find_objects(lab)
    figs = []
    for i, sl in enumerate(objs, start=1):
        if sl is None: continue
        region = (lab[sl] == i) & fg[sl]
        area = int(region.sum())
        h = sl[0].stop - sl[0].start
        w = sl[1].stop - sl[1].start
        if area < min_area or is_text_like(h, w):
            continue
        figs.append({'sl': sl, 'label': i, 'area': area, 'lab': lab})
    return figs


def extract(rgb, fg, fig):
    sl, i, lab = fig['sl'], fig['label'], fig['lab']
    mask = (lab[sl] == i) & fg[sl]
    crop = rgb[sl]
    rgba = np.zeros(crop.shape[:2] + (4,), dtype=np.uint8)
    rgba[..., :3] = crop
    # bordo morbido: erodi 1px e sfuma
    core = ndimage.binary_erosion(mask, iterations=1)
    alpha = np.where(core, 255, np.where(mask, 110, 0)).astype(np.uint8)
    rgba[..., 3] = alpha
    return rgba, mask


def slice_sheet(fname, opts):
    path = os.path.join(ASSETS, fname) if '/' in fname else os.path.join(SRC, fname)
    img = Image.open(path).convert('RGB')
    rgb = np.array(img)
    H, W = rgb.shape[:2]
    frames = []   # (rgba, mask, (x0, y0)) in ordine di lettura

    if opts['layout'] == 'boxes':
        for (bx0, by0, bx1, by1) in opts['boxes']:
            sub = rgb[by0:by1, bx0:bx1]
            fg = remove_background(sub)
            figs = find_figures(fg, min_area=200)
            if not figs:
                frames.append(None); continue
            big = max(figs, key=lambda f: f['area'])
            rgba, mask = extract(sub, fg, big)
            frames.append((rgba, mask, (bx0 + big['sl'][1].start, by0 + big['sl'][0].start)))
    elif opts['layout'] == 'grid':
        cols, rows = opts['cols'], opts['rows']
        cw, ch = W / cols, H / rows
        for r in range(rows):
            for c in range(cols):
                cx0, cx1 = int(c * cw), int((c + 1) * cw)
                # cella allargata: le figure possono sconfinare in quella vicina
                x0 = max(0, cx0 - 60) if opts.get('overflow') else cx0 + 5
                x1 = min(W, cx1 + 60) if opts.get('overflow') else cx1 - 5
                y0, y1 = int(r * ch) + 5, int((r + 1) * ch) - 5
                sub = rgb[y0:y1, x0:x1]
                fg = remove_background(sub)
                figs = find_figures(fg, min_area=1500)
                # tieni solo figure il cui centro cade nella cella vera
                figs = [f for f in figs
                        if cx0 <= x0 + (f['sl'][1].start + f['sl'][1].stop) / 2 < cx1]
                if not figs:
                    frames.append(None); continue
                big = max(figs, key=lambda f: f['area'])
                rgba, mask = extract(sub, fg, big)
                frames.append((rgba, mask, (x0 + big['sl'][1].start, y0 + big['sl'][0].start)))
    else:
        fg = remove_background(rgb)
        figs = find_figures(fg, min_area=3000)
        # righe: raggruppa per centro verticale
        figs.sort(key=lambda f: (f['sl'][0].start + f['sl'][0].stop) / 2)
        rows_, cur = [], []
        for f in figs:
            cy = (f['sl'][0].start + f['sl'][0].stop) / 2
            if cur and abs(cy - cur[-1][0]) > H * 0.22:
                rows_.append(cur); cur = []
            cur.append((cy, f))
        if cur: rows_.append(cur)
        for row in rows_:
            for _, f in sorted(row, key=lambda t: t[1]['sl'][1].start):
                rgba, mask = extract(rgb, fg, f)
                frames.append((rgba, mask, (f['sl'][1].start, f['sl'][0].start)))

    # immagine di controllo con numeri
    dbg = img.copy()
    d = ImageDraw.Draw(dbg)
    for k, fr in enumerate(frames):
        if fr is None: continue
        rgba, _, (x, y) = fr
        h, w = rgba.shape[:2]
        d.rectangle([x, y, x + w, y + h], outline=(255, 0, 0), width=2)
        d.rectangle([x, y, x + 26, y + 20], fill=(255, 0, 0))
        d.text((x + 6, y + 4), str(k), fill=(255, 255, 255))
    dbg.save(os.path.join(DEBUG, fname.replace('/', '_')))

    if opts.get('flip'):
        frames = [None if f is None else (f[0][:, ::-1].copy(), f[1][:, ::-1].copy(), f[2]) for f in frames]
    return frames


def anchor_x(mask):
    """Centro orizzontale delle gambe (40% inferiore) = punto d'appoggio."""
    h = mask.shape[0]
    low = mask[int(h * 0.6):]
    ys, xs = np.nonzero(low)
    if len(xs) == 0:
        return mask.shape[1] / 2
    return float(xs.mean())


def main():
    manifest = {}
    for char, cdef in CONFIG.items():
        sheets = {f: slice_sheet(f, o) for f, o in cdef['sheets'].items()}
        # scala per tavola
        scales = {}
        for f, o in cdef['sheets'].items():
            if isinstance(o.get('scale'), (int, float)):
                scales[f] = o['scale']
            else:
                tallest = max(fr[0].shape[0] for fr in sheets[f] if fr is not None)
                scales[f] = HUMAN_H / tallest * o.get('mul', 1.0)
        # scala e prepara ogni frame usato
        prepared = {}
        for anim, (f, idxs, fps, loop) in cdef['anims'].items():
            out = []
            for i in idxs:
                fr = sheets[f][i]
                if fr is None:
                    raise SystemExit(f'{char}.{anim}: frame {i} vuoto in {f}')
                rgba, mask, _ = fr
                s = scales[f]
                im = Image.fromarray(rgba, 'RGBA')
                nw, nh = max(1, round(im.width * s)), max(1, round(im.height * s))
                im = im.resize((nw, nh), Image.LANCZOS)
                ax = anchor_x(mask) * s
                out.append((im, ax))
            prepared[anim] = (out, fps, loop)
        # cella unica per personaggio: abbastanza grande per tutte le pose
        half_w = 0
        cell_h = 0
        for out, _, _ in prepared.values():
            for im, ax in out:
                half_w = max(half_w, ax, im.width - ax)
                cell_h = max(cell_h, im.height)
        cell_w = int(np.ceil(half_w * 2)) + 4
        cell_h = int(cell_h) + 2
        anims_out = {}
        for anim, (out, fps, loop) in prepared.items():
            strip = Image.new('RGBA', (cell_w * len(out), cell_h), (0, 0, 0, 0))
            for k, (im, ax) in enumerate(out):
                x = k * cell_w + int(round(cell_w / 2 - ax))
                y = cell_h - im.height
                strip.alpha_composite(im, (x, y))
            name = f'{char}_{anim}.png'
            strip.save(os.path.join(OUT, name))
            anims_out[anim] = {'file': f'assets/sprites/cut/{name}', 'frames': len(out),
                               'fps': fps, 'loop': loop}
        manifest[char] = {'cellW': cell_w, 'cellH': cell_h, 'humanH': HUMAN_H, 'anims': anims_out}
        print(f'{char:12s} cella {cell_w}x{cell_h}  anims: {", ".join(anims_out)}')

    # ── icone ──
    icon_dir = os.path.join(OUT, 'icons'); os.makedirs(icon_dir, exist_ok=True)
    cache = {}
    icons = {}
    for name, (f, o, idx) in ICONS.items():
        key = (f, json.dumps(o, sort_keys=True))
        if key not in cache:
            cache[key] = slice_sheet(f, o)
        fr = cache[key][idx]
        if fr is None:
            raise SystemExit(f'icona {name}: figura {idx} vuota in {f}')
        im = Image.fromarray(fr[0], 'RGBA')
        k = min((ICON_SIZE - 6) / im.width, (ICON_SIZE - 6) / im.height)
        im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        canvas = Image.new('RGBA', (ICON_SIZE, ICON_SIZE), (0, 0, 0, 0))
        canvas.alpha_composite(im, ((ICON_SIZE - im.width) // 2, (ICON_SIZE - im.height) // 2))
        canvas.save(os.path.join(icon_dir, name + '.png'))
        icons[name] = f'assets/sprites/cut/icons/{name}.png'
    print(f'icone: {len(icons)}')

    # ── cadaveri ──
    prop_dir = os.path.join(OUT, 'props'); os.makedirs(prop_dir, exist_ok=True)
    bf, bo, bs = BODIES
    props = {}
    for k, fr in enumerate(slice_sheet(bf, bo)):
        if fr is None: continue
        im = Image.fromarray(fr[0], 'RGBA')
        k_s = BODY_LEN / max(im.width, im.height * 1.15)
        im = im.resize((round(im.width * k_s), round(im.height * k_s)), Image.LANCZOS)
        im.save(os.path.join(prop_dir, f'body_{k}.png'))
        props[f'body_{k}'] = {'file': f'assets/sprites/cut/props/body_{k}.png', 'w': im.width, 'h': im.height}
    print(f'cadaveri: {len(props)}')

    # ── oggetti di scena (porta sbarrata, leve, monitor, neon) ──
    master = np.array(Image.open(os.path.join(SRC, 'sprites_sheet_master.png')).convert('RGB'))
    for name, (mode, (x0, y0, x1, y1), nf) in SCENE_PROPS.items():
        sub = master[y0:y1, x0:x1]
        if mode == 'cut':
            fg = remove_background(sub)
            figs = find_figures(fg, min_area=150)
            big = max(figs, key=lambda f: f['area'])
            rgba, _ = extract(sub, fg, big)
            im = Image.fromarray(rgba, 'RGBA')
        else:
            im = Image.fromarray(sub, 'RGB').convert('RGBA')
        im.save(os.path.join(prop_dir, f'{name}.png'))
        props[name] = {'file': f'assets/sprites/cut/props/{name}.png', 'w': im.width, 'h': im.height, 'frames': nf}
    # porta chiusa: cornice della porta aperta + battente (dalla socchiusa) steso nel vano
    op = np.array(Image.open(os.path.join(prop_dir, 'door_open.png')).convert('RGBA'))
    aj = np.array(Image.open(os.path.join(prop_dir, 'door_ajar.png')).convert('RGBA'))
    h, w = op.shape[:2]
    lum = op[..., :3].astype(int).sum(axis=2)
    dark = (lum < 75) & (op[..., 3] > 0)
    ys, xs = np.nonzero(dark)
    x0, x1 = int(np.percentile(xs, 2)), int(np.percentile(xs, 98))
    y0, y1 = int(np.percentile(ys, 2)), h - 3
    # il battente della socchiusa: colonne chiare a sinistra del vano scuro
    alum = aj[..., :3].astype(int).sum(axis=2)
    cols = [x for x in range(aj.shape[1]) if (alum[y0:y1, x] > 120).mean() > 0.6]
    px0, px1 = min(cols[3:] or cols), max([c for c in cols if c < aj.shape[1] * 0.6])
    panel = Image.fromarray(aj[y0:y1, px0:px1 + 1]).resize((x1 - x0 + 1, y1 - y0), Image.LANCZOS)
    closed = Image.fromarray(op.copy())
    closed.paste(panel, (x0, y0), panel)
    closed.save(os.path.join(prop_dir, 'door_closed.png'))
    props['door_closed'] = {'file': 'assets/sprites/cut/props/door_closed.png', 'w': w, 'h': h, 'frames': 1}
    print(f'oggetti di scena: {len(SCENE_PROPS) + 1}')

    js = ('/* Generato da tools/slice_sprites.py — NON modificare a mano */\n'
          'export const SPRITES = ' + json.dumps(manifest, indent=2) + ';\n'
          'export const ICONS = ' + json.dumps(icons, indent=2) + ';\n'
          'export const PROPS = ' + json.dumps(props, indent=2) + ';\n')
    with open(os.path.join(ROOT, 'js', 'sprite_manifest.js'), 'w') as fh:
        fh.write(js)
    print('manifest scritto: js/sprite_manifest.js')


if __name__ == '__main__':
    main()
