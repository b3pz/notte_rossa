# Notte Rossa — cosa generare con ChatGPT (in ordine di importanza)

## Regole per tutti gli sprite (personaggi e mostri)

1. **Allega sempre come riferimento** la tavola della camminata del protagonista (`assets/sprites/player_walk8.png`), così stile e proporzioni restano gli stessi.
2. Ogni tavola ha **una sola animazione**, senza scritte e senza numeri. Meglio con **sfondo trasparente** (PNG), altrimenti bianco pieno: il gioco li gestisce tutti e due. Se aprendo l'immagine vedi una scacchiera grigia e bianca **disegnata** al posto della trasparenza, chiedi di rifarla con sfondo bianco.
3. Il personaggio è **di profilo e guarda a DESTRA**: il gioco lo specchia da solo quando va a sinistra.
4. **Lascia spazio vuoto tra una figura e l'altra.** Nella camminata alcuni scarponi si toccavano e ho dovuto tagliarli.
5. Usa il formato orizzontale 1536×1024, con le figure su **2 righe da 4** (o 2 righe da 3 per le animazioni da 6 pose).
6. In una tavola tutte le figure hanno la stessa scala, con i piedi sulla stessa linea.

Parte finale da aggiungere a ogni prompt di sprite:

```
Same character and same art style as the attached reference sheet. Full body, strict side view facing right, painterly semi-realistic 2D game sprite, consistent scale, feet on the same baseline, transparent background (PNG with alpha; if not possible, pure flat white), generous empty space between figures so they never touch, no text, no numbers, no shadows on the ground, 1536x1024, two rows of evenly spaced poses.
```

---

## 1. Due fondali che mancano (priorità massima)

Il **primo livello è brutto** perché il vagone è ancora il vecchio fondale in prospettiva. Per ora ho tolto la porta di legno fuori posto, ma serve il fondale nuovo.

### train_wagon.png
```
Interior of an old Italian regional train carriage seen exactly from the side, row of worn blue seats along the back wall, rain-streaked windows above the seats, flickering neon tubes on the ceiling, abandoned bags and newspapers on the seats, the side sliding doors are CLOSED, on the far left end a closed connecting door to the next carriage with a small dark window, on the far right end the open rear door of the train with the wet platform and a station wall visible through it. 2D side-scrolling survival horror game background, strict orthographic side view, camera parallel to the back wall, no vanishing point, flat floor strip along the bottom, painterly semi-realistic style, night, cold blue and teal light with sickly red accents, no people, no text, wide 1536x1024 or wider
```

### lab_biologico.png
```
Biological laboratory seen exactly from the side: tall glass culture tanks with murky green liquid and something floating inside along the back wall, a research computer terminal with a USB stick plugged in, lab benches with broken glassware, pipes on the ceiling, red rotating alarm light, on the left a door with a round porthole leading back to the corridor. 2D side-scrolling survival horror game background, strict orthographic side view, camera parallel to the back wall, no vanishing point, flat floor strip along the bottom, painterly semi-realistic style, night, cold teal light with sickly red accents, no people, no text, wide 1536x1024
```

---

## 2. Armadietti e oggetti che si aprono (modifica dei fondali)

Non serve uno sprite separato. Si chiede a ChatGPT la **stessa immagine con l'oggetto aperto**. Quando interagisci, il gioco sostituisce solo quel pezzo di fondale con una breve dissolvenza (il meccanismo è già pronto).

Come si fa: **carica il fondale originale** che avevi generato e scrivi il prompt qui sotto, cambiando solo la parte tra parentesi quadre.

```
Edit this image: [the grey locker marked B3 is now open, its left door swung open toward the viewer, the inside is dark and empty with a bare metal shelf]. Keep EVERYTHING else exactly identical: same framing, same size, same lighting, same position of every object. Do not add people or text.
```

Elenco (nome del file da mandarmi → cosa scrivere tra parentesi quadre):

| File | Stanza | Cosa cambia |
|---|---|---|
| `station_storage_open.png` | Servizi tecnici | the locker B3 open and empty **AND** the red first-aid cabinet on the wall open and empty |
| `hospital_ward_open.png` | Degenze | the tall grey locker on the left open, empty inside |
| `stanza_manutenzione_open.png` | Officina | the locker number 7 open, empty inside |
| `alimentari_open.png` | Alimentari | the small safe under the counter open, empty inside |
| `station_hall_open.png` | Atrio | the ticket booth window broken open, empty counter |
| `sala_server_open.png` | Sala server | the round vault door in the middle open, a dark red-lit passage behind it |
| `sala_generatori_on.png` | Sala generatori | the generator running: small green lights on, warm lamp light on the walls, lever down |
| `safe_room_open.png` | Rifugio | the right door with the card reader open, green light on the reader |

---

## 3. Mostri (adesso scivolano: hanno 1–3 pose)

Il ferroviere, l'infermiere e il tecnico hanno **una sola posa** e scivolano sul pavimento. È la cosa che si nota di più dopo il vagone.

Per ognuno servono 3 tavole: **camminata (6 pose)**, **attacco (4 pose)** e **morte (4 pose)**. Allega la loro immagine attuale (dalla tavola `sprites_sheet_master.png`) insieme alla camminata del protagonista.

```
Infected railway worker zombie (yellow high-visibility vest, dark work clothes, grey rotting skin), slow shambling walk cycle, 6 poses. [+ parte finale]
Infected railway worker zombie, attack animation: lunges forward with arms reaching and biting, 4 poses. [+ parte finale]
Infected railway worker zombie, death animation: hit, staggers back, falls to knees, lies on the ground, 4 poses. [+ parte finale]
```
Stessi tre prompt cambiando la descrizione:
- **infermiere**: `infected nurse zombie, torn light blue scrubs, pale skin, barefoot`
- **tecnico**: `infected maintenance technician zombie, grey overalls, tool belt, bald`
- **contaminato** (quello base): `infected man zombie in torn civilian clothes` — camminata 8 pose
- **corridore**: `fast infected runner zombie, thin, sprinting on all fours and upright` — corsa 6 pose

---

## 4. Protagonista (stesso stile della camminata nuova)

| Tavola | Pose | Prompt (+ parte finale) |
|---|---|---|
| fermo | 4 | `the same young man standing still, idle breathing animation, subtle shoulder movement` |
| pistola | 8 | `the same young man with a pistol: 2 poses aiming, 3 poses shooting with recoil and muzzle flash, 3 poses reloading` |
| fucile | 6 | `the same young man with a pump shotgun: 2 aiming, 2 shooting with recoil, 2 pumping` |
| torcia | 6 | `the same young man walking while holding a flashlight forward, beam not drawn` |
| accovacciato | 6 | `the same young man crouching and sneaking slowly, 6 poses` |
| colpito e morte | 6 | `the same young man: 2 poses hit and flinching, 4 poses collapsing and lying dead` |
| raccogliere / aprire | 4 | `the same young man bending down to pick something up, then reaching forward to open a locker` |

---

## 5. Personaggi della storia

- **Carmine** (ferroviere spaventato, gilet arancione): fermo, parla, indica, si spaventa. 4 pose.
- **Elena** (sorella, giacca chiara): ferma, parla, indica, cammina (6 pose).

---

Mandami le immagini anche alla rinfusa: riconosco io a cosa servono, le taglio e le inserisco.
