# Notte Rossa — pacchetto reference per i prompt (sprite, GUI, suoni)

Questo zip serve a generare con ChatGPT (o altro) **tutto quello che manca** perché il gioco sia coerente.
Ogni voce dice: **nome del file da mandarmi**, **cosa allegare** come riferimento (cartelle di questo zip) e **il prompt**.

Cartelle:

| Cartella | Contenuto | Quando allegarla |
|---|---|---|
| `00_stile/` | `stile_master_luca_camminata.png` (la tavola da cui parte tutto lo stile) e `cast_attuale.png` (tutti i personaggi come sono oggi nel gioco, stessa scala) | **Sempre**, per ogni sprite |
| `01_personaggi/` | un riferimento per personaggio (il suo aspetto "ufficiale") | Quando generi quel personaggio |
| `02_gui_attuale/` | screenshot dell'interfaccia di oggi (HTML) | Per la GUI: mostra cosa va sostituito e dove sta sullo schermo |
| `03_fondali/` | tutti i fondali delle stanze (ridotti) | Per GUI e oggetti: palette e luce devono essere quelle |
| `04_icone/` | le icone oggetto attuali + provino | Per nuove icone nello stesso stile |

---

## Regole fisse (valgono per tutto)

**Sprite di personaggi e mostri**
1. Allega `00_stile/stile_master_luca_camminata.png` + il riferimento del personaggio in `01_personaggi/`.
2. **Una sola animazione per tavola**, niente scritte, niente numeri, niente griglie disegnate.
3. Di profilo, **guarda a DESTRA** (il gioco lo specchia).
4. **Spazio vuoto largo tra le figure**: non devono toccarsi (né piedi, né armi, né fiammate).
5. Tutte le figure **stessa scala, piedi sulla stessa linea**. Formato 1536×1024, figure su 2 righe (o 1 riga se sono poche).
6. Sfondo **trasparente**; se non è possibile, **bianco pieno** (non la scacchiera disegnata).
7. Le figure distese a terra (morte) vanno **in una riga a parte**, non sotto a una figura in piedi: altrimenti nel taglio i piedi della riga sopra finiscono nella cella sotto (è quello che ha rotto le ultime tavole).

Coda da aggiungere a ogni prompt di sprite:

```
Same character and same art style as the attached reference sheets. Full body, strict side view facing right, painterly semi-realistic 2D game sprite, consistent scale, feet on the same baseline, transparent background (PNG with alpha; if not possible, pure flat white), generous empty space between figures so they never touch, no text, no numbers, no grid lines, no shadows on the ground, 1536x1024.
```

**Elementi di interfaccia (GUI)**
- Allega 2–3 fondali da `03_fondali/` e lo screenshot corrispondente da `02_gui_attuale/`.
- Ogni pezzo **separato** sulla tavola, con spazio intorno, sfondo trasparente.
- Cornici e pannelli: **centro vuoto/uniforme** e bordi decorati, così li posso stirare (9-slice) senza deformarli.

Coda da aggiungere a ogni prompt di GUI:

```
Game UI asset sheet for a 2D survival horror game set in a rainy Italian coastal town at night. Worn dark metal, scratched enamel, rust, old paper and red emergency-light accents (#c0152a), cold teal/blue ambient tones matching the attached backgrounds. Each element isolated with empty space around it, front view, flat (no perspective), transparent background, no text unless specified, crisp edges, 1536x1024.
```

---

## Personaggi: aspetto ufficiale (da ripetere nei prompt)

| Chi | Descrizione da usare |
|---|---|
| **Luca** (protagonista) | `young Italian man around 28, messy dark hair, light stubble, dark charcoal hooded jacket, brown canvas backpack, faded blue jeans, brown leather boots` |
| **Elena** (sorella) | `Italian woman around 35, brown hair in a low ponytail, light grey-cream jacket, teal-blue trousers, white sneakers, tired face` |
| **Carmine** (ferroviere) | `Italian railway worker around 55, short greying dark hair, yellow high-visibility vest over a dark navy work jacket, navy work trousers with reflective stripes, black boots` (è quello della tavola "parla": le altre sue pose oggi hanno un gilet arancione e un'altra faccia — vanno rifatte) |
| **Contaminato** | `infected emaciated man, torn brown ragged shirt, grey stained trousers, grey rotting skin, red eyes` |
| **Ferroviere infetto** | `infected railway worker zombie, yellow high-visibility vest, dark uniform, grey rotting skin` |
| **Infermiera infetta** | `infected nurse zombie, dark hair, torn light-blue scrubs, pale skin, barefoot` |
| **Tecnico infetto** | `infected bald maintenance technician zombie, grey overalls, leather tool belt` |
| **Corridore** | `fast infected runner, very thin, long dark greasy hair, dark ragged clothes, sprinting hunched forward` |
| **Crawler** | `pale hairless infected creature with elongated limbs, moves on all fours, can cling to ceilings` |
| **Listener** | `blind infected man in a long dark green coat, head tilted to listen, pale skin, mouth open` |

---

## A. SPRITE — prima di tutto la coerenza (oggi alcuni personaggi cambiano aspetto)

Priorità dall'alto in basso. **Nome file → pose → prompt** (+ coda sprite).

### A1. Luca — le pose ancora in stile vecchio (giacca nera senza zaino)
Allega: `01_personaggi/luca_*.png` (camminata, accovacciato, pistola).

| File | Pose | Prompt |
|---|---|---|
| `luca_gun_idle.png` | 2 | `Luca standing still holding a pistol lowered along his leg, subtle breathing, 2 poses` |
| `luca_walk_pistol.png` | 6 | `Luca walking cautiously holding a pistol in both hands pointed slightly down, walk cycle, 6 poses` |
| `luca_hurt.png` | 2 | `Luca hit by an attack, flinching backwards, hand raised, 2 poses` |
| `luca_wounded.png` | 4 | `Luca standing wounded, hunched, holding his side, heavy breathing idle, 4 poses` |
| `luca_death.png` | 4 | `Luca collapsing: staggers, falls to his knees, falls forward, lies dead face down. 4 poses in ONE row, generous space` |
| `luca_torch_idle.png` | 2 | `Luca standing still holding a flashlight pointed forward at chest height, beam not drawn, 2 poses` |
| `luca_interact.png` | 4 | `Luca bending down to pick something up from the floor (2 poses), then reaching forward to open a locker door (2 poses)` |
| `luca_crouch_idle.png` | 2 | `Luca crouching still, low and silent, looking forward, 2 poses` |
| `luca_hide.png` | 2 | `Luca crouched pressed against a wall, covering his mouth, hiding, 2 poses` |
| `luca_shotgun_walk.png` | 6 | `Luca walking holding a pump shotgun at the ready, 6 poses` |

### A2. Carmine — una sola faccia
Allega: `01_personaggi/carmine_parla.png` (questo è quello giusto).

| File | Pose | Prompt |
|---|---|---|
| `carmine_idle.png` | 4 | `Carmine standing near a radio desk, nervous idle, shifting weight, 4 poses` |
| `carmine_check.png` | 4 | `Carmine looking at a clipboard / fiddling with a radio handset, 4 poses` |
| `carmine_scared.png` | 4 | `Carmine scared, backing away with hands up, then crouching and covering his head, 4 poses` |

### A3. Mostri — mancano fermo e colpito (oggi usano un'altra figura)
Allega il riferimento del mostro in `01_personaggi/`.

| File | Pose | Prompt (descrizione dalla tabella + ) |
|---|---|---|
| `contaminato_idle.png` | 2 | `… standing still, swaying slightly, head down, 2 poses` |
| `contaminato_hurt.png` | 2 | `… hit by a bullet, jerking backwards, 2 poses` |
| `ferroviere_idle.png` / `ferroviere_hurt.png` | 2 + 2 | come sopra |
| `infermiere_idle.png` / `infermiere_hurt.png` | 2 + 2 | come sopra |
| `tecnico_idle.png` / `tecnico_hurt.png` | 2 + 2 | come sopra |

### A4. Corridore — tutto nello stile della nuova corsa
Allega `01_personaggi/corridore_corsa.png` (la corsa nuova è già nel gioco: il resto va adeguato).

| File | Pose | Prompt |
|---|---|---|
| `corridore_idle.png` | 2 | `crouched low, twitching, ready to sprint, 2 poses` |
| `corridore_walk.png` | 6 | `prowling slowly on two legs, hunched, 6 poses` |
| `corridore_leap.png` | 3 | `leaping forward through the air, arms reaching, 3 poses` |
| `corridore_attack.png` | 4 | `slashing and biting, frenzied, 4 poses` |
| `corridore_hurt.png` | 2 | `hit, recoiling, 2 poses` |
| `corridore_dead.png` | 4 | `falls and lies dead, 4 poses in ONE row` |

### A5. Crawler — oggi 1–2 pose per animazione
Allega `01_personaggi/crawler.png`.

| File | Pose | Prompt |
|---|---|---|
| `crawler_walk.png` | 6 | `crawling slowly on all fours, 6 poses` |
| `crawler_run.png` | 6 | `scuttling fast on all fours, 6 poses` |
| `crawler_ceiling.png` | 2 | `hanging upside down from the ceiling, limbs spread, 2 poses (the figure is upside down)` |
| `crawler_leap.png` | 3 | `dropping from above and landing, 3 poses` |
| `crawler_attack.png` | 4 | `lunging and clawing, 4 poses` |
| `crawler_dead.png` | 4 | `collapses and curls up dead, 4 poses in ONE row` |

### A6. Listener — manca anche la morte
Allega `01_personaggi/listener.png`.

| File | Pose | Prompt |
|---|---|---|
| `listener_walk.png` | 6 | `slow blind walk, head tilted listening, 6 poses` |
| `listener_listen.png` | 2 | `standing still, head cocked toward a sound, hand near ear, 2 poses` |
| `listener_alert.png` | 2 | `snapping its head up, mouth open in a shriek, 2 poses` |
| `listener_run.png` | 6 | `sprinting toward a sound, arms forward, 6 poses` |
| `listener_attack.png` | 4 | `grabbing and biting, 4 poses` |
| `listener_hurt.png` | 2 | `hit, recoiling, 2 poses` |
| `listener_dead.png` | 4 | `falls and lies dead, 4 poses in ONE row` |

### A7. Elena
Allega `01_personaggi/elena.png`.

| File | Pose | Prompt |
|---|---|---|
| `elena_idle.png` | 4 | `Elena standing, exhausted, feverish, one arm across her body, 4 poses` |
| `elena_talk.png` | 4 | `Elena talking softly with small hand gestures, 4 poses` |
| `elena_scared.png` | 2 | `Elena stepping back, hand raised: "don't come closer", 2 poses` |
| `elena_point.png` | 2 | `Elena pointing toward a table to her right, 2 poses` |

---|---|---|
| `fx_muzzle_pistol.png` | 3 | `pistol muzzle flash seen from the side, pointing right, 3 frames, transparent` |
| `fx_muzzle_shotgun.png` | 3 | `large shotgun muzzle blast seen from the side, pointing right, 3 frames` |
| `fx_blood_hit.png` | 4 | `dark red blood spray from a bullet impact, side view, 4 frames` |
| `fx_impact_sparks.png` | 4 | `bullet hitting a metal wall, small sparks and dust, 4 frames` |
| `fx_dust_drop.png` | 4 | `dust cloud on the floor when a creature lands, 4 frames` |

---

## B. GUI — sostituire l'HTML con sprite

**Il codice è già pronto**: ogni file qui sotto, appena esiste in `assets/ui/` (gli effetti in `assets/fx/`), prende il posto della parte HTML corrispondente. Quelli che mancano restano come oggi. Puoi generarli in tavole (te li taglio io) o già singoli con questi nomi.

Regole: PNG con **trasparenza**; i pezzi "9-slice" (pannello, bottone, dialogo, notifica) hanno **angoli e bordi decorati entro 64 px** (bottone: entro 24 px) e **centro uniforme**, perché il centro viene stirato. Dimensioni consigliate tra parentesi.

### B1. Kit di base (prompt: `UI kit: …` sotto)
| File | Cosa | Misura |
|---|---|---|
| `panel.png` | pannello vuoto 9-slice (inventario, pausa, salva, opzioni, carica, crediti, finale) | 512×512 |
| `button.png` · `button_hover.png` · `button_disabled.png` | bottone normale / evidenziato / disattivato, 9-slice | 384×96 |
| `close.png` | bottone chiudi ✕ | 96×96 |
| `slider_track.png` · `slider_knob.png` | binario del volume · manopola | 512×28 · 64×64 |
| `check_off.png` · `check_on.png` | casella vuota · spuntata | 64×64 |
| `notification.png` | targhetta per gli avvisi ("Raccolto: …"), 9-slice | 384×96 |

`UI kit: one large empty panel frame made of dark scratched metal with rivets and a thin red enamel line, empty uniform dark centre; three versions of the same rectangular button (normal, highlighted with red glow, disabled grey); a small square close button with an X; a horizontal slider track and a round knob; a checkbox empty and checked; a small notification plate.`

### B2. Menu e titolo
| File | Cosa | Prompt |
|---|---|---|
| `logo.png` | scritta NOTTE ROSSA (sostituisce il titolo nel menu e quello cinematografico) 1600×600 | `Title logo lettering "NOTTE ROSSA": "NOTTE" in off-white condensed stencil letters, "ROSSA" below in glowing blood-red neon letters with rain drops, slightly worn, transparent background. Text must read exactly NOTTE ROSSA.` |
| `menu_bg.png` | fondale del menu 1920×1080 (sostituisce quello provvisorio; la figura di Luca sovrapposta sparisce) | `Key art: a young man with a backpack seen from behind on an empty wet railway platform at night, a stopped regional train with its door open, red emergency light, rain, Italian coastal station, large empty dark area on the left for the menu, painterly semi-realistic, no text.` |

### B3. HUD
| File | Cosa | Misura |
|---|---|---|
| `hud_health.png` | cornice tipo monitor cardiaco per la vita | 460×148 |
| `hud_ecg_fine.png` · `hud_ecg_caution.png` · `hud_ecg_danger.png` | traccia ECG verde / ambra / rossa su fondo trasparente, **ripetibile in orizzontale** (scorre) | 388×60 |
| `hud_battery.png` | cornice batteria torcia (spazio vuoto a destra per la barra) | 400×80 |
| `hud_ammo.png` | targhetta per le munizioni | 320×100 |
| `hud_objective.png` | striscia di carta strappata con nastro (testo scuro sopra) | 700×160 |
| `hud_room.png` | targhetta smaltata per il nome della stanza | 500×70 |

`HUD pieces: a small handheld heart-monitor frame; three separate seamless horizontal ECG line strips (green, amber, red) on transparent background; a flashlight battery gauge frame with a small battery icon on the left; a dark metal plate for an ammo counter; a strip of torn paper held by grey tape; a small enamel sign plate.`

### B4. Dialoghi e ritratti
| File | Cosa |
|---|---|
| `dialog.png` | riquadro del dialogo 9-slice (1024×320) |
| `dialog_name.png` | targhetta del nome di chi parla (400×80) |
| `portrait_luca.png` · `portrait_luca_scared.png` | Luca normale · spaventato (al telefono) |
| `portrait_elena.png` · `portrait_elena_sad.png` | Elena · in lacrime (morso, addio) |
| `portrait_carmine.png` · `portrait_carmine_scared.png` | Carmine · terrorizzato (primo incontro) |
| `portrait_tape.png` | registratore a cassette (voce registrata di Elena) |
| `portrait_phone.png` | cornetta del telefono pubblico ("???") |
| `portrait_radio.png` | radio (annunci della Protezione Civile) |

Ritratti 512×512, busto 3/4, sfondo scuro sfumato: `Character portrait bust, 3/4 view, painterly semi-realistic, dark vignette background, square: …` + descrizione del personaggio. Se manca la versione "scared/sad" si usa quella normale.

### B5. Inventario, radio, schermate
| File | Cosa | Prompt |
|---|---|---|
| `inv_bg.png` | sfondo dell'inventario 1280×860: zaino aperto visto dall'alto | `The inside of an open brown canvas backpack seen from above, dark lining, empty central area, worn straps on the edges.` |
| `inv_slot.png` · `inv_slot_sel.png` | casella vuota · selezionata (192×192) | `An empty square item slot of dark worn fabric with a stitched border; the same slot with a red stitched border.` |
| `inv_detail.png` | targhetta per la descrizione dell'oggetto (1100×200) | `A wide dark leather label with stitched edges.` |
| `radio.png` | radio d'emergenza della schermata Salva (900×600) | `An old military emergency radio on a metal desk, front view, amber glowing dial, small red LED.` |
| `gameover.png` | schermata di morte 1920×1080, **con la scritta** | `Dark wet floor, a dropped flashlight still on, blood drops, red lettering "SEI MORTO", empty bottom area for buttons.` |
| `chapter.png` | fascia dietro il titolo del capitolo (1920×300) | `A strip of dark film with red light leaks, empty centre for text.` |
| `ending_alba.png` · `ending_notte.png` | finali 1920×1080 | `A small wooden fishing boat leaving a harbour at dawn, the town burning red behind` · `the same boat at night, the town burning, darker, hopeless` |

### B6. Documenti — sì, un foglio per tipo (sostituiscono il riquadro nero)
Il testo lo scrive il gioco sopra il foglio, quindi **fogli senza testo leggibile**, 900×1200, margini vuoti di almeno 60 px.

| File | Documenti che lo usano |
|---|---|
| `paper_ticket.png` | biglietto del treno |
| `paper_typed.png` | ordinanza del sindaco, registro di movimento, avviso della metro |
| `paper_notebook.png` | promemoria di Carmine, diario di Giulia, appunti di Elena, registro del capotreno, taccuino del soldato |
| `paper_clinical.png` | cartella clinica, protocollo campioni, referto autoptico |
| `paper_letter.png` | biglietto di Luigi, nota dell'officina, lettera di Elena |
| `paper_printout.png` | manuale del generatore, registro accessi, direttiva riservata |

`Blank paper sheet, front view, no readable text, slight wear and water drops: [an official typed municipal document with a faded stamp area | a lined notebook page with coffee stains | a hospital clinical record form with empty boxes | a soft cream letter paper, slightly creased | a small Italian regional train ticket, landscape | a dot-matrix computer printout with perforated edges].`

**Font (facoltativi)**: metti in `assets/fonts/` `typewriter.woff2` (es. *Special Elite*) e `handwriting.woff2` (es. *Caveat*), gratuiti su Google Fonts: il testo dei documenti diventa a macchina o a mano a seconda del foglio.

### B7. Nella scena e sul telefono
| File | Cosa |
|---|---|
| `prompt.png` | targhetta del suggerimento "Raccogli: …" sopra gli oggetti (400×80) |
| `key_e.png` · `key_touch.png` | tasto E · dito/cerchio per il telefono (96×96) |
| `reticle.png` | mirino rosso sul nemico (192×192) |
| `arrow_left.png` · `arrow_right.png` · `arrow_up.png` | frecce dipinte sul pavimento per le uscite (240×160) |
| `padlock.png` | lucchetto delle porte chiuse (96×96) |
| `touch_shoot.png` · `touch_use.png` · `touch_bag.png` · `touch_pause.png` | pulsanti rotondi del telefono (256×256) |

`Game UI icons: an off-white keyboard keycap with the letter E; a round touch target; a red circular crosshair reticle; three arrows painted on a floor in worn off-white road paint (left, right, forward); a small rusty padlock; four round touch-screen buttons of dark glass with a thin red ring and icons: crosshair, hand, backpack, pause.`

### B8. Effetti (cartella `assets/fx/`)
Striscia orizzontale di **fotogrammi quadrati** (es. 4 fotogrammi = 1024×256).

| File | Cosa |
|---|---|
| `fx_muzzle_pistol.png` (3) · `fx_muzzle_shotgun.png` (3) | vampata vista di lato, verso destra |
| `fx_blood_hit.png` (4) | spruzzo di sangue scuro dal colpo |
| `fx_dust_drop.png` (4) | polvere a terra quando il Crawler atterra |

La mappa di Porto Salvo è disegnata dal codice e segue le stanze: **non serve** un'immagine.

---

## C. OGGETTI DI SCENA (stati "aperto" dei fondali)

Già nel gioco: biglietteria, armadio B3 **e** cassetta rossa (si aprono ognuno quando prendi il suo oggetto), mobiletto delle degenze, armadietto 7, cassaforte, porta della sala server, porta del laboratorio, generatore acceso.
Il codice usa solo la zona dell'oggetto, con i bordi sfumati: non importa se ChatGPT cambia un po' il resto dell'immagine.

Pronti nel codice, mancano le immagini (carica il fondale da `03_fondali/` e chiedi la modifica):

| File (in `assets/backgrounds/v2/`) | Quando appare | Prompt |
|---|---|---|
| `hospital_surgery_open.png` | prendi la provetta | `Edit this image: the tall refrigerator door is open, the shelf inside empty. Keep everything else identical.` |
| `lab_biologico_open.png` | prendi la chiavetta | `Edit this image: the USB stick in the terminal is gone, the screen shows a red "NO DATA". Keep everything else identical.` |
| `station_control_open.png` | alzi la serranda | `Edit this image: the big lever on the right panel is pulled down, a green light above it. Keep everything else identical.` |
| `camera_centrale_after.png` | Elena se n'è andata | `Edit this image: on the table a folded letter and an old rusty key; the red alarm light stronger. Keep everything else identical.` |

---

## D. SUONI (oggi il gioco non ha nessun file audio: solo "bip")

Il codice è pronto: metti i file in `assets/audio/` con **esattamente questi nomi**, formato **.mp3**. Quelli che mancano restano il bip (o silenzio per gli ambienti). Puoi generarli con ElevenLabs Sound Effects, Freesound (CC0) o simili.

| File | Descrizione / prompt |
|---|---|
| **Ambienti (loop 30–60 s, senza stacchi)** | |
| `train_idle.mp3` | inside a stopped train at night, electric hum, rain on the roof, distant creaks |
| `station_ambient.mp3` | empty railway station at night, rain on canopy, buzzing neon, distant dog |
| `room_hum.mp3` | small technical room, low electrical hum, dripping water |
| `electronics_hum.mp3` | control room, CRT monitors whine, relays clicking softly |
| `rain_heavy.mp3` | heavy rain on a stone street, gutters overflowing, distant thunder |
| `rain_indoor.mp3` | rain heard from inside an apartment, window rattling, clock ticking |
| `hospital_hum.mp3` | empty hospital corridor, fluorescent buzz, distant monitor beeps, ventilation |
| `morgue_cold.mp3` | morgue, refrigeration compressors, metallic ticks, very cold |
| `metro_drip.mp3` | dark metro station, water dripping, distant echoes, wind from tunnels |
| `tunnel_wind.mp3` | long underground tunnel, deep wind, distant metal groans |
| `generator_loop.mp3` | large diesel emergency generator running steadily |
| `lab_hum.mp3` | sealed laboratory, air filtration, bubbling tanks, faint alarm far away |
| `harbor_waves.mp3` | harbour at night in the rain, waves on piers, boats knocking, ropes creaking |
| **Effetti** | |
| `step_concrete.mp3` `step_wet.mp3` `step_metal.mp3` `step_tile.mp3` | un singolo passo con scarpone su cemento / pozzanghera / lamiera / piastrelle |
| `step_run.mp3` | passo di corsa |
| `shot.mp3` · `shotgun_shot.mp3` · `reload.mp3` · `shotgun_pump.mp3` · `dry_fire.mp3` | pistola 9mm in interno, fucile a pompa, cambio caricatore, pompa, grilletto a vuoto |
| `door_open.mp3` · `door_metal.mp3` · `door_locked.mp3` | porta normale, porta blindata/stagna, maniglia che non cede |
| `shutter_open.mp3` · `locker_open.mp3` · `safe_open.mp3` | serranda metallica che sale, armadietto, cassaforte a combinazione |
| `phone_ring.mp3` | squillo di telefono pubblico anni '90 (uno squillo) |
| `generator_start.mp3` · `data_upload.mp3` · `alarm.mp3` · `boat_engine.mp3` | avvio generatore, bip di trasmissione dati, allarme di contenimento, motore di gozzo che parte |
| `pickup.mp3` · `paper.mp3` · `ui_click.mp3` · `ui_confirm.mp3` · `chapter_sting.mp3` · `flashlight_click.mp3` · `heartbeat.mp3` | raccolta oggetto, foglio di carta, click interfaccia, conferma, colpo cupo di inizio capitolo, click torcia, battito (salute bassa) |
| `hurt.mp3` | Luca colpito (gemito breve) |
| **Nemici** | |
| `enemy_groan.mp3` · `enemy_alert.mp3` · `enemy_attack.mp3` · `enemy_death.mp3` | rantolo, ringhio quando ti vede, morso/attacco, caduta e ultimo rantolo |
| `listener_shriek.mp3` · `runner_scream.mp3` · `crawler_drop.mp3` | urlo acuto del Listener, urlo del Corridore, tonfo del Crawler che cade dal soffitto |
| **Musica** | |
| `music_menu.mp3` · `music_ending.mp3` | tema del menu (pianoforte e drone, lento) · tema finale |

---

## Come mandarmi le immagini
Anche alla rinfusa, ma col **nome del file** di questa lista: le taglio con `tools/repack_strips.py` / `tools/slice_sprites.py` e le inserisco.
