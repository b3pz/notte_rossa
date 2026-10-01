#!/usr/bin/env python3
"""
NOTTE ROSSA — make_prompt_kit.py
Crea docs/reference/NotteRossa_prompt_kit.zip: una cartella per ogni immagine
da generare, con dentro PROMPT.txt (da trascinare o incollare in chat) e le
immagini di riferimento (rif_*.png / .jpg) da trascinare insieme.

Uso:  python3 tools/make_prompt_kit.py
"""
import io, os, zipfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUT = os.path.join(ROOT, 'assets', 'sprites', 'cut')
BG = os.path.join(ROOT, 'assets', 'backgrounds', 'v2')
GUI = os.path.join(ROOT, 'docs', 'reference', 'gui')
OUT = os.path.join(ROOT, 'docs', 'reference', 'NotteRossa_prompt_kit.zip')

# ───────────────────────── testi comuni ─────────────────────────
SPRITE_TAIL = (
    "Same character and same art style as the attached reference images (image 1 = art style master, "
    "image 2 = this character). Full body, strict side view facing RIGHT, painterly semi-realistic 2D game sprite, "
    "consistent scale, all feet on the same baseline, transparent background (PNG with alpha; if not possible, "
    "pure flat white). Generous empty space between figures so they never touch (feet, weapons and flashes included). "
    "No text, no numbers, no grid lines, no frames, no shadows on the ground. 1536x1024, one single row of poses "
    "(two rows only if there are more than 4 poses; poses lying on the ground always in their own row)."
)
GUI_TAIL = (
    "Game UI asset for a 2D survival horror game set in a rainy Italian coastal town at night. Worn dark metal, "
    "scratched enamel, rust, old paper and red emergency-light accents (#c0152a), cold teal/blue ambient tones matching "
    "the attached backgrounds. Every element isolated with plenty of empty space around it, front view, flat (no perspective), "
    "transparent background, crisp edges, no text unless explicitly requested."
)
NINE = "Frames and panels: decorated corners and borders, perfectly uniform plain centre (it will be stretched)."

CHAR = {
    'luca': "young Italian man around 28, messy dark hair, light stubble, dark charcoal hooded jacket, brown canvas backpack, faded blue jeans, brown leather boots",
    'elena': "Italian woman around 35, brown hair in a low ponytail, light grey-cream jacket, teal-blue trousers, white sneakers, tired feverish face",
    'carmine': "Italian railway worker around 55, short greying dark hair, yellow high-visibility vest over a dark navy work jacket, navy work trousers with reflective stripes, black boots",
    'contaminato': "infected emaciated man, torn brown ragged shirt, grey stained trousers, grey rotting skin, red eyes",
    'ferroviere': "infected railway worker zombie, yellow high-visibility vest, dark uniform, grey rotting skin",
    'infermiere': "infected nurse zombie, dark hair, torn light-blue scrubs, pale skin, barefoot",
    'tecnico': "infected bald maintenance technician zombie, grey overalls, leather tool belt",
    'corridore': "fast infected runner, very thin, long dark greasy hair, dark ragged clothes",
    'crawler': "pale hairless infected creature with elongated limbs that moves on all fours and can cling to ceilings",
    'listener': "blind infected man in a long dark green coat, pale skin, mouth open, head tilted as if listening",
}
# riferimento del personaggio (strisce già nel gioco)
CHAR_REF = {
    'luca': ['player_idle.png', 'player_sneak.png', 'player_aim.png', 'player_shotgun_aim.png'],
    'elena': ['elena_walk.png', 'elena_idle.png', 'elena_point.png'],
    'carmine': ['carmine_talk.png'],
    'contaminato': ['contaminato_walk.png'],
    'ferroviere': ['ferroviere_walk.png', 'ferroviere_attack.png'],
    'infermiere': ['infermiere_walk.png', 'infermiere_attack.png'],
    'tecnico': ['tecnico_walk.png', 'tecnico_attack.png'],
    'corridore': ['corridore_run.png'],
    'crawler': ['crawler_idle.png', 'crawler_walk.png', 'crawler_ceiling.png'],
    'listener': ['listener_idle.png', 'listener_walk.png', 'listener_run.png'],
}

# ───────────────────────── lavori ─────────────────────────
# (cartella, tipo, dati)
SPRITES = [
    # A1 — Luca
    ('luca', 'luca_gun_idle', 2, "standing still holding a pistol lowered along his leg, subtle breathing"),
    ('luca', 'luca_walk_pistol', 6, "walking cautiously holding a pistol in both hands pointed slightly down, walk cycle"),
    ('luca', 'luca_shotgun_walk', 6, "walking holding a pump shotgun at the ready, walk cycle"),
    ('luca', 'luca_hurt', 2, "hit by an attack, flinching backwards, one hand raised"),
    ('luca', 'luca_wounded', 4, "standing wounded, hunched, holding his side, heavy breathing idle"),
    ('luca', 'luca_death', 4, "collapsing: staggers, falls to his knees, falls forward, lies dead face down"),
    ('luca', 'luca_torch_idle', 2, "standing still holding a flashlight pointed forward at chest height, the light beam is NOT drawn"),
    ('luca', 'luca_interact', 4, "bending down to pick something up from the floor (2 poses), then reaching forward to open a locker door (2 poses)"),
    ('luca', 'luca_crouch_idle', 2, "crouching still, low and silent, looking forward"),
    # A2 — Carmine
    ('carmine', 'carmine_idle', 4, "standing near a radio desk, nervous idle, shifting his weight"),
    ('carmine', 'carmine_check', 4, "looking at a clipboard and fiddling with a radio handset"),
    ('carmine', 'carmine_scared', 4, "scared, backing away with hands up, then crouching and covering his head"),
    # A3 — fermo e colpito dei mostri
    ('contaminato', 'contaminato_idle', 2, "standing still, swaying slightly, head down"),
    ('contaminato', 'contaminato_hurt', 2, "hit by a bullet, jerking backwards"),
    ('ferroviere', 'ferroviere_idle', 2, "standing still, swaying slightly, head down"),
    ('ferroviere', 'ferroviere_hurt', 2, "hit by a bullet, jerking backwards"),
    ('infermiere', 'infermiere_idle', 2, "standing still, swaying slightly, head down"),
    ('infermiere', 'infermiere_hurt', 2, "hit by a bullet, jerking backwards"),
    ('tecnico', 'tecnico_idle', 2, "standing still, swaying slightly, head down"),
    ('tecnico', 'tecnico_hurt', 2, "hit by a bullet, jerking backwards"),
    # A4 — Corridore
    ('corridore', 'corridore_idle', 2, "crouched low, twitching, ready to sprint"),
    ('corridore', 'corridore_walk', 6, "prowling slowly on two legs, hunched, walk cycle"),
    ('corridore', 'corridore_leap', 3, "leaping forward through the air, arms reaching"),
    ('corridore', 'corridore_attack', 4, "slashing and biting, frenzied"),
    ('corridore', 'corridore_hurt', 2, "hit, recoiling"),
    ('corridore', 'corridore_dead', 4, "falls and lies dead"),
    # A5 — Crawler
    ('crawler', 'crawler_walk', 6, "crawling slowly on all fours, walk cycle"),
    ('crawler', 'crawler_run', 6, "scuttling fast on all fours, run cycle"),
    ('crawler', 'crawler_ceiling', 2, "hanging upside down from the ceiling, limbs spread (the figure is upside down)"),
    ('crawler', 'crawler_leap', 3, "dropping from above and landing"),
    ('crawler', 'crawler_attack', 4, "lunging and clawing"),
    ('crawler', 'crawler_dead', 4, "collapses and curls up dead"),
    # A6 — Listener
    ('listener', 'listener_walk', 6, "slow blind walk, head tilted listening, walk cycle"),
    ('listener', 'listener_listen', 2, "standing still, head cocked toward a sound, one hand near the ear"),
    ('listener', 'listener_alert', 2, "snapping the head up, mouth open in a shriek"),
    ('listener', 'listener_run', 6, "sprinting toward a sound, arms forward, run cycle"),
    ('listener', 'listener_attack', 4, "grabbing and biting"),
    ('listener', 'listener_hurt', 2, "hit, recoiling"),
    ('listener', 'listener_dead', 4, "falls and lies dead"),
    # A7 — Elena
    ('elena', 'elena_idle', 4, "standing, exhausted and feverish, one arm across her body"),
    ('elena', 'elena_talk', 4, "talking softly with small hand gestures"),
    ('elena', 'elena_scared', 2, "stepping back with one hand raised: don't come closer"),
    ('elena', 'elena_point', 2, "pointing toward a table to her right"),
]

GUI_BGS = ['station_hall.png', 'hospital_corridor.png', 'lab_corridoio.png']

GUIS = [
    # (nome, prompt, screenshot attuale o None, sfondi?)
    ('ui_kit', NINE + " Make an asset sheet with these separate elements: one large empty panel frame made of dark scratched metal with rivets and a thin red enamel line; three versions of the same wide rectangular button (normal, highlighted with a red glow, disabled grey); a small square close button with an X; a long horizontal slider track and a round slider knob; a square checkbox empty and the same checkbox ticked; a small wide notification plate.", 'gui_09_pausa.png'),
    ('logo', "Title logo lettering \"NOTTE ROSSA\": the word NOTTE in off-white condensed stencil letters, the word ROSSA below it in glowing blood-red neon letters with rain drops, slightly worn. Wide format 1600x600. The text must read exactly NOTTE ROSSA, nothing else.", 'gui_01_menu.png'),
    ('menu_bg', "Key art for the main menu, 1920x1080: a young man with a brown backpack seen from behind standing on an empty wet railway platform at night, a stopped Italian regional train with its door open, red emergency light, heavy rain, Italian coastal station. Leave a large empty dark area on the LEFT third for the menu. Painterly semi-realistic, no text. (Ignore the 'transparent background' rule: this is a full illustration.)", 'gui_01_menu.png'),
    ('hud', NINE + " Make an asset sheet with these separate HUD elements: a small handheld heart-monitor frame (for a health bar); three separate seamless horizontal ECG line strips on transparent background, one green, one amber, one red (they must tile horizontally); a flashlight battery gauge frame with a small battery icon on the left and empty space on the right; a dark metal plate for an ammo counter; a strip of torn off-white paper held by grey tape (a note); a small enamel sign plate for a room name.", 'gui_04_hud_stanza.png'),
    ('dialog', NINE + " Make an asset sheet with: a wide dialogue box frame of dark translucent glass with a worn metal border and a thin red line (empty centre); a separate small name tag plate that sits on its top-left corner.", 'gui_03_dialogo.png'),
    ('inventario', "Make an asset sheet with these separate elements: 1) an inventory background seen from above: the inside of an open brown canvas backpack, dark lining, large empty central area, worn straps on the edges (wide, about 3:2); 2) an empty square item slot of dark worn fabric with a stitched border; 3) the same slot with a red stitched border (selected); 4) a wide dark leather label with stitched edges for an item description.", 'gui_05_inventario.png'),
    ('radio', "An old military-style emergency radio on a metal desk, front view, amber glowing dial, small red LED, worn knobs, 900x600, isolated on transparent background.", 'gui_08_salva_radio.png'),
    ('gameover', "Game over screen, 1920x1080 full illustration: a dark wet floor seen from above, a dropped flashlight still switched on, blood drops, the red lettering \"SEI MORTO\" in the upper middle, empty dark bottom area for buttons. The text must read exactly SEI MORTO. (Full illustration, no transparent background.)", None),
    ('chapter', "A wide horizontal strip of dark film with red light leaks and scratches, empty dark centre for a title text, 1920x300, edges fading to transparent.", None),
    ('ending_alba', "Ending illustration 1920x1080: a small wooden Italian fishing boat (gozzo) leaving a harbour at dawn, the coastal town behind it burning with a red glow, the sky slowly getting lighter, hopeful but sad, painterly semi-realistic, no text. (Full illustration.)", None),
    ('ending_notte', "Ending illustration 1920x1080: a small wooden Italian fishing boat (gozzo) leaving a harbour at night, the coastal town behind it burning red, very dark, hopeless mood, painterly semi-realistic, no text. (Full illustration.)", None),
    ('icone_scena', "Make an asset sheet with these separate game UI icons: an off-white worn keyboard keycap with the letter E; a round touch target (a soft white ring with a dot); a red circular crosshair reticle; three arrows painted on a floor in worn off-white road paint (pointing left, pointing right, pointing forward/up); a small rusty padlock; a small dark enamel plate for a tooltip (wide, empty).", 'gui_04_hud_stanza.png'),
    ('touch', "Make an asset sheet with four separate round touch-screen buttons of dark translucent glass with a thin red ring, each with a white icon: a crosshair, an open hand, a backpack, a pause symbol.", None),
]

PAPERS = [
    ('paper_typed', "an official typed Italian municipal document with an empty area for a faded stamp at the bottom"),
    ('paper_notebook', "a lined notebook page with a few coffee stains"),
    ('paper_clinical', "a hospital clinical record form with empty boxes and lines"),
    ('paper_letter', "a soft cream letter paper, slightly creased, folded marks"),
    ('paper_ticket', "a small Italian regional train ticket, landscape format, worn"),
    ('paper_printout', "a dot-matrix computer printout with perforated tractor-feed edges"),
]

PORTRAITS = [
    ('portrait_luca', 'luca', "neutral, determined, rain on his face"),
    ('portrait_luca_scared', 'luca', "scared, wide eyes, holding a phone to his ear"),
    ('portrait_elena', 'elena', "neutral, exhausted, feverish"),
    ('portrait_elena_sad', 'elena', "crying silently, saying goodbye"),
    ('portrait_carmine', 'carmine', "talking, worried"),
    ('portrait_carmine_scared', 'carmine', "terrified, sweating"),
]
OBJ_PORTRAITS = [
    ('portrait_tape', "an old portable cassette recorder on a dark table, red record light on"),
    ('portrait_phone', "the handset of an old Italian public payphone hanging from its cord, dim red light"),
    ('portrait_radio', "an old emergency radio with a glowing amber dial"),
]

FX = [
    ('fx_muzzle_pistol', 3, "pistol muzzle flash seen from the side, pointing right"),
    ('fx_muzzle_shotgun', 3, "large shotgun muzzle blast seen from the side, pointing right"),
    ('fx_blood_hit', 4, "dark red blood spray from a bullet impact, side view, spraying right"),
    ('fx_dust_drop', 4, "dust cloud on the floor when a creature lands"),
]

EDITS = [
    ('hospital_surgery_open', 'hospital_surgery.png', "the tall refrigerator door is open, the shelf inside is empty"),
    ('lab_biologico_open', 'lab_biologico.png', "the USB stick in the research terminal is gone and the screen shows a red NO DATA message"),
    ('station_control_open', 'station_control.png', "the big lever on the right panel is pulled down and a green light is on above it"),
    ('camera_centrale_after', 'camera_centrale.png', "on the table there is a folded letter and an old rusty key, and the red alarm light is stronger"),
]

SOUNDS = [
    ('train_idle', 'loop', "inside a stopped regional train at night, electric hum, rain drumming on the roof, distant metal creaks"),
    ('station_ambient', 'loop', "empty railway station at night, rain on the platform canopy, buzzing neon lights, a distant dog"),
    ('room_hum', 'loop', "small technical room, low electrical hum, slow water dripping"),
    ('electronics_hum', 'loop', "control room, old CRT monitors whine, relays clicking softly, ventilation"),
    ('rain_heavy', 'loop', "heavy rain on a stone street, gutters overflowing, distant thunder"),
    ('rain_indoor', 'loop', "heavy rain heard from inside an old apartment, window rattling, a clock ticking"),
    ('hospital_hum', 'loop', "empty hospital corridor at night, fluorescent buzz, distant monitor beeps, ventilation"),
    ('morgue_cold', 'loop', "morgue, refrigeration compressors, metallic ticks, very cold and still"),
    ('metro_drip', 'loop', "dark abandoned metro station, water dripping, distant echoes, wind from the tunnels"),
    ('tunnel_wind', 'loop', "long underground railway tunnel, deep wind, distant metal groans"),
    ('generator_loop', 'loop', "large diesel emergency generator running steadily in a concrete room"),
    ('lab_hum', 'loop', "sealed laboratory, air filtration, bubbling tanks, faint alarm far away"),
    ('harbor_waves', 'loop', "harbour at night in heavy rain, waves against the piers, boats knocking, ropes creaking"),
    ('step_concrete', 'one', "a single footstep of a leather boot on concrete"),
    ('step_wet', 'one', "a single footstep of a boot in a shallow puddle"),
    ('step_metal', 'one', "a single footstep of a boot on a metal floor plate"),
    ('step_tile', 'one', "a single footstep of a boot on hospital tiles"),
    ('step_run', 'one', "a single fast running footstep on concrete"),
    ('shot', 'one', "a single 9mm pistol shot indoors, short reverb"),
    ('shotgun_shot', 'one', "a single pump shotgun blast indoors"),
    ('reload', 'one', "pistol magazine out and in, slide racked"),
    ('shotgun_pump', 'one', "pump shotgun being racked"),
    ('dry_fire', 'one', "empty pistol trigger click"),
    ('door_open', 'one', "an old door opening with a creak"),
    ('door_metal', 'one', "a heavy steel door unlocking and opening, hiss of a sealed hatch"),
    ('door_locked', 'one', "a locked door handle rattling, not opening"),
    ('shutter_open', 'one', "a metal roller shutter rising, rattling"),
    ('locker_open', 'one', "a metal locker door opening"),
    ('safe_open', 'one', "a combination safe clicking and swinging open"),
    ('phone_ring', 'one', "one ring of an old Italian public payphone"),
    ('generator_start', 'one', "a large diesel generator cranking and roaring to life"),
    ('data_upload', 'one', "old computer terminal beeping while transmitting data"),
    ('alarm', 'one', "laboratory containment alarm, two seconds"),
    ('boat_engine', 'one', "an old small fishing boat engine coughing then starting"),
    ('pickup', 'one', "picking up a small object, soft rustle"),
    ('paper', 'one', "unfolding a sheet of paper"),
    ('ui_click', 'one', "soft UI click, analog"),
    ('ui_confirm', 'one', "soft UI confirm, low synth tone"),
    ('chapter_sting', 'one', "dark cinematic low hit with a reverse swell, horror"),
    ('flashlight_click', 'one', "flashlight switch click"),
    ('heartbeat', 'one', "a single heavy heartbeat, low"),
    ('hurt', 'one', "a young man groaning in pain, short"),
    ('enemy_groan', 'one', "a zombie groaning low, wet and raspy"),
    ('enemy_alert', 'one', "a zombie snarling when it spots prey"),
    ('enemy_attack', 'one', "a zombie lunging and biting"),
    ('enemy_death', 'one', "a body collapsing on the floor with a last rasp"),
    ('listener_shriek', 'one', "a high piercing shriek of a blind creature"),
    ('runner_scream', 'one', "a fast infected screaming as it sprints"),
    ('crawler_drop', 'one', "a creature dropping from the ceiling and landing heavily"),
    ('music_menu', 'loop', "slow dark piano theme over a low drone, melancholic horror, 90 seconds"),
    ('music_ending', 'one', "sad hopeful piano and strings ending theme, 90 seconds"),
]


# ───────────────────────── immagini di riferimento ─────────────────────────
def png(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return b.getvalue()


def jpg(im, q=85):
    b = io.BytesIO(); im.convert('RGB').save(b, 'JPEG', quality=q, optimize=True); return b.getvalue()


def fit(im, maxw=1600, maxh=1600):
    k = min(1, maxw / im.width, maxh / im.height)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS) if k < 1 else im


def stack(files):
    ims = [Image.open(os.path.join(CUT, f)).convert('RGBA') for f in files]
    ims = [fit(i, 1600, 400) for i in ims]
    w = max(i.width for i in ims); h = sum(i.height + 16 for i in ims)
    out = Image.new('RGBA', (w, h), (255, 255, 255, 255)); y = 0   # fondo bianco: ChatGPT lo legge meglio
    for i in ims:
        out.alpha_composite(i, (0, y)); y += i.height + 16
    return out


def bg_small(name):
    return fit(Image.open(os.path.join(BG, name)).convert('RGB'), 1600, 720)


def main():
    def on_white(im):
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im.convert('RGBA')); return bg
    style = jpg(on_white(fit(Image.open(os.path.join(ROOT, 'assets', 'sprites', 'player_walk8.png')), 1600)), 88)
    char_refs = {k: jpg(stack(v), 88) for k, v in CHAR_REF.items()}
    gui_bgs = [jpg(bg_small(b)) for b in GUI_BGS]
    index = []

    with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
        def job(folder, prompt, refs, save_as, note=''):
            z.writestr(f'{folder}/PROMPT.txt', prompt.strip() + '\n')
            for name, data in refs:
                z.writestr(f'{folder}/{name}', data)
            index.append(f'{folder:44s} -> salva come: {save_as}{("   (" + note + ")") if note else ""}')

        n = 0
        # A. sprite
        for ch, name, poses, action in SPRITES:
            n += 1
            prompt = (f"{CHAR[ch][0].upper() + CHAR[ch][1:]}, {action}. {poses} poses, side view facing right, "
                      f"animation sheet with ONE animation only.\n\n{SPRITE_TAIL}")
            job(f'A{n:02d}_{name}', prompt,
                [('rif_1_stile.jpg', style), (f'rif_2_{ch}.jpg', char_refs[ch])], f'{name}.png')

        # B. ritratti
        n = 0
        for name, ch, mood in PORTRAITS:
            n += 1
            prompt = (f"Character portrait bust of the character in the attached reference (image 2): {CHAR[ch]}. "
                      f"Expression: {mood}. 3/4 view, head and shoulders, painterly semi-realistic, same art style as image 1, "
                      f"dark blurred vignette background, square 1024x1024, no text.")
            job(f'B{n:02d}_{name}', prompt, [('rif_1_stile.jpg', style), (f'rif_2_{ch}.jpg', char_refs[ch])], f'{name}.png')
        for name, obj in OBJ_PORTRAITS:
            n += 1
            prompt = (f"Square portrait icon for a dialogue box: {obj}. Painterly semi-realistic, dark blurred vignette "
                      f"background, matching the cold teal and red lighting of the attached background, 1024x1024, no text.")
            job(f'B{n:02d}_{name}', prompt, [('rif_ambiente.jpg', gui_bgs[0])], f'{name}.png')

        # C. GUI
        n = 0
        for name, desc, shot in GUIS:
            n += 1
            refs = [(f'rif_ambiente_{i + 1}.jpg', d) for i, d in enumerate(gui_bgs[:2])]
            if shot and os.path.exists(os.path.join(GUI, shot)):
                refs.append(('rif_come_e_oggi.jpg', jpg(Image.open(os.path.join(GUI, shot)))))
            job(f'C{n:02d}_{name}', f"{desc}\n\n{GUI_TAIL}", refs,
                f'{name}.png', 'tavola: la taglio io' if desc.startswith(NINE) or 'asset sheet' in desc else '')
        for name, desc in PAPERS:
            n += 1
            prompt = (f"A single blank sheet: {desc}. Front view, fills the whole image, portrait 900x1200 "
                      f"(the ticket can be landscape), no readable text at all (text will be added by the game), "
                      f"slight wear and a few water drops, realistic paper texture, margins free of marks for at least 60 px.")
            job(f'C{n:02d}_{name}', prompt, [('rif_ambiente.jpg', gui_bgs[0])], f'{name}.png')

        # D. effetti
        n = 0
        for name, frames, desc in FX:
            n += 1
            prompt = (f"Game visual effect animation: {desc}. {frames} frames in ONE horizontal row, every frame a square "
                      f"of the same size, the effect centred in each square, transparent background, painterly semi-realistic, "
                      f"no text. {frames * 512}x512.")
            job(f'D{n:02d}_{name}', prompt, [('rif_1_stile.jpg', style)], f'{name}.png')

        # E. modifiche ai fondali
        n = 0
        for name, src, change in EDITS:
            n += 1
            prompt = (f"Edit the attached image: {change}. Keep EVERYTHING else exactly identical: same framing, same size, "
                      f"same lighting, same position of every object. Do not add people or text.")
            full = Image.open(os.path.join(BG, src)).convert('RGB')
            job(f'E{n:02d}_{name}', prompt, [('IMMAGINE_DA_MODIFICARE.png', png(full))], f'{name}.png')

        # F. suoni (un txt per suono)
        for name, kind, desc in SOUNDS:
            extra = "Seamless loop, 30-60 seconds, no music." if kind == 'loop' else "Single sound effect, short, clean, no music."
            z.writestr(f'F_suoni/{name}.txt', f"{desc}. {extra}\n")
        index.append(f'{"F_suoni/<nome>.txt":44s} -> salva come: <nome>.mp3   (un file per suono)')

        z.writestr('00_LEGGIMI.txt', LEGGIMI + '\n'.join(index) + '\n')
    print(f'{OUT} — {os.path.getsize(OUT) // 1024} KB, {len(index)} voci')


LEGGIMI = """NOTTE ROSSA — KIT PER I PROMPT
================================

COME SI USA (per ogni cartella)
1. Apri la cartella (vanno in ordine: A01, A02, ...).
2. Trascina in chat TUTTI i file della cartella: PROMPT.txt + le immagini rif_*.
   (oppure apri PROMPT.txt, copia il testo e incollalo, poi trascina le immagini)
3. Invia. Se il risultato non va: "redo, same prompt" oppure correggi a parole.
4. Salva l'immagine con il nome indicato sotto ("salva come") e mandamela.
   Anche tutte insieme, in uno zip: le taglio e le inserisco io.

COSA CONTROLLARE PRIMA DI TENERE UN'IMMAGINE
- Sprite: figure che NON si toccano, tutte girate a DESTRA, stessi vestiti del riferimento,
  niente scacchiera grigia disegnata (se c'è, chiedi "pure flat white background").
- Pose a terra (morte) in una riga a parte.
- Scritte (logo, SEI MORTO, tasto E): controlla che siano giuste lettera per lettera.

ORDINE CONSIGLIATO
A = sprite (coerenza dei personaggi) — i più importanti
B = ritratti per i dialoghi
C = interfaccia e fogli dei documenti
D = effetti (vampate, sangue, polvere)
E = modifiche dei fondali (oggetti aperti)
F = suoni: ogni .txt è il prompt per un generatore di effetti sonori
    (es. ElevenLabs Sound Effects); salva in .mp3 con lo stesso nome.

ELENCO
------
"""


if __name__ == '__main__':
    main()
