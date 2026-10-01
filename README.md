# Notte Rossa

Survival horror 2D a scorrimento laterale. Si gioca aprendo `index.html` nel browser (anche direttamente dal computer, senza server).

## Struttura

| Cartella / file | Contenuto |
|---|---|
| `index.html` | il gioco pronto (generato: **non modificarlo a mano**) |
| `index.src.html` | la pagina sorgente; `tools/build.py` ci inserisce il codice |
| `js/` | codice del gioco (un file per sistema: `game`, `player`, `enemy`, `rooms`, `events`, `ui`, `audio`, `skin`…) |
| `js/rooms_data.js` | **solo dati**: stanze, porte, oggetti, nemici |
| `js/events.js` | storia: dialoghi e sequenze |
| `js/items.js` | oggetti e documenti |
| `js/sprite_manifest.js` | elenco delle animazioni (file, numero di pose, velocità) |
| `css/` | stile dell'interfaccia; `skin.css` usa le immagini di `assets/ui/` quando ci sono |
| `assets/backgrounds/v2/` | fondali delle stanze (e versioni `_open` degli oggetti aperti) |
| `assets/sprites/cut/` | strisce delle animazioni usate dal gioco |
| `assets/ui/`, `assets/fx/`, `assets/audio/`, `assets/fonts/` | interfaccia a sprite, effetti, suoni, font: **facoltativi**, si usano appena ci sono |
| `tools/` | script (vedi sotto) |
| `tools/recover_src/` | tavole originali da cui sono tagliate le animazioni |
| `docs/` | controllo del gioco, prompt per fondali e immagini |

## Comandi

```bash
python3 tools/build.py            # ricostruisce index.html (da fare dopo ogni modifica a js/ o a index.src.html)
python3 tools/repack_strips.py    # ritaglia le animazioni dalle tavole in tools/recover_src (elenco RECOVER)
python3 tools/test_story.py       # gioca tutta la storia in automatico fino al finale (serve Playwright)
python3 tools/test_rooms.py       # fotografa tutte le stanze
python3 tools/make_prompt_kit.py  # crea docs/reference/NotteRossa_prompt_kit.zip (prompt + riferimenti)
python3 tools/make_reference.py   # crea docs/reference/NotteRossa_reference.zip
```

Per i test: `pip install playwright pillow numpy scipy`; se Playwright non trova il suo Chromium, indica un browser con `PW_CHROMIUM=/percorso/chrome`.

## Aggiungere immagini e suoni

- **Animazioni**: metti la tavola in `tools/recover_src/`, aggiungi una riga a `RECOVER` in `tools/repack_strips.py` (quali figure, nome del file, altezza), lancia lo script, aggiorna `js/sprite_manifest.js`, poi `tools/build.py`.
- **Interfaccia** (`assets/ui/<nome>.png`), **effetti** (`assets/fx/`), **suoni** (`assets/audio/<nome>.mp3`): basta il nome giusto e `tools/build.py`. I nomi sono in `docs/reference/LEGGIMI.md`, `js/skin.js` e `js/audio.js`.
- `tools/slice_sprites.py` è lo strumento delle prime tavole: **riscrive tutto il manifest**, non lanciarlo senza aggiornare prima la sua configurazione.
