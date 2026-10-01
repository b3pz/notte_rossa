# Notte Rossa — controllo completo (v1.7 → v1.8)

Stato: **la storia si completa dall'inizio ai due finali** (test automatico `tools/test_story.py`, con e senza provetta), nessun errore in console.
Sotto: cosa ho **già sistemato**, poi **cosa manca**, in ordine di importanza.

---

## 1. Già sistemato in questo giro

| Area | Problema | Correzione |
|---|---|---|
| Sprite | Le ultime due commit di sprite avevano salvato le tavole **con i nomi scambiati**: Luca correva come un ferroviere infetto, Carmine aveva l'aspetto di Luca con la pistola, la "camminata" del ferroviere e il suo attacco erano **due fondali**, il manifest non corrispondeva alle immagini (figure tagliate a metà). | Ripristinate le strisce coerenti e **recuperate le tavole nuove buone** sotto il nome giusto (strumento `tools/repack_strips.py`, sorgenti in `tools/recover_src/`). |
| Sprite | Animazioni nuove ora nel gioco: Luca fermo (4), pistola mira/sparo/ricarica, **fucile** mira/sparo, **camminata con torcia**, camminata accovacciata (6); corsa del Corridore (6); ferroviere, infermiera, tecnico con camminata/attacco/morte; morte del contaminato (4). | |
| Sprite | Figure spostate quando la larghezza della striscia non tornava col manifest (idle di ferroviere/infermiere/tecnico). | La cella si ricava dall'immagine: ogni animazione può avere la sua larghezza. |
| Sprite | Ferroviere/infermiera/tecnico "scivolavano" con una posa oscillante. | Usano le loro animazioni. |
| Sprite | Carmine ed Elena **fermi su un fotogramma** anche quando parlano. | Gli NPC ora si animano. |
| Sprite | Il menu mostrava tutta la striscia del protagonista (più figure). | Figura singola `assets/ui/menu_figure.png`. |
| Logica/visibilità | Sala server: la porta circolare si vedeva **aperta appena accendi il generatore**, ma si apre solo dopo la trasmissione. | Si apre con `data_sent`. |
| Logica/visibilità | Rifugio: la porta del laboratorio aperta non si vedeva mai (condizione legata a una porta che non può essere "raccolta"). | Gli stati del fondale accettano anche `door:` (porta aperta con la chiave). |
| Suoni | **Il gioco non caricava nessun file audio**: tutto era un "bip", gli ambienti erano muti, i nemici silenziosi. | Pipeline pronta: metti gli `.mp3` in `assets/audio/` con i nomi della lista, lancia `tools/build.py`, funziona (anche da file://). |
| Suoni | Ambiente solo in 11 stanze su 27; passi sempre "cemento". | Ogni stanza ha il suo ambiente e il tipo di pavimento (cemento, bagnato, lamiera, piastrelle); il generatore cambia l'ambiente quando parte. |
| Suoni | Nessun verso dei nemici; il generatore "suonava" come una porta chiusa. | Rantoli, allarme quando ti vedono (urlo diverso per Listener e Corridore), attacco, morte, tonfo del Crawler, volume in base alla distanza; suoni dedicati per serranda, generatore, trasmissione, allarme, motore della barca, fucile, colpo a vuoto, carta, torcia, battito a salute bassa, stacco di capitolo, musica del finale. |
| Testi | La pistola diceva "caricatore da 8", nel gioco è da 10. | Corretto. |

### Secondo giro (tutto quello che si risolve col codice)

| Area | Correzione |
|---|---|
| **Bug grave** | Nelle stanze più larghe dello schermo (atrio, Via Ferrante, corridoio dell'ospedale, degenze, banchina, tunnel…) i proiettili sparivano oltre i 1330 px: lì non si poteva colpire nessuno. Corretto. |
| Munizioni | 9mm sparsi da 170 a 86, cartucce da 54 a 30; i nemici lasciano munizioni quasi solo se sei a corto. A fine partita restano ~60 colpi invece di 118. |
| Salvataggio | Salvataggio automatico dopo la telefonata e all'inizio di ogni capitolo, in uno slot a parte ("AUTOMATICO" nella schermata Carica); "Riprova" e "Continua" ripartono dal più recente. |
| Sala operatoria | Torna una stanza sicura: il Corridore ora aspetta nel corridoio, davanti alla porta chirurgica, e compare quando hai il badge. |
| Fusibile | L'obiettivo ricorda la cassaforte di Luigi (1-4-1-0) mentre sei ancora in città e prima di scendere all'obitorio. |
| Racconto | Capitoli 4 e 5 hanno le loro righe d'apertura; la porta delle degenze si chiama "Scale — Degenze 2° piano". |
| Luci | Il blackout spegne anche atrio e servizi tecnici; il generatore accende anche il tunnel. **I personaggi prendono il colore della luce della stanza** (calcolato da ogni fondale) e diventano rossi a impulsi durante l'allarme; "!" e barre della vita restano leggibili. |
| Stati dei fondali | Ogni oggetto aperto usa solo la sua zona, con i bordi sfumati: la cassetta rossa si apre quando prendi la chiave (prima si apriva con l'armadio), i fondali "aperti" rigenerati da ChatGPT non cambiano più il resto della stanza, sparita la banda nera del rifugio. Pronti 4 nuovi stati (sala operatoria, lab biologico, sala controllo, camera centrale). |
| Interfaccia a sprite | `js/skin.js` + `css/skin.css`: ogni immagine in `assets/ui/` sostituisce da sola il pezzo HTML (pannelli, bottoni, cursori, logo, menu, HUD, dialogo, **ritratti**, inventario, radio, game over, capitoli, finali, **un foglio diverso per ogni tipo di documento**, suggerimenti, frecce, mirino, lucchetto, pulsanti del telefono). Provato con immagini segnaposto. |
| Animazioni future | Il gioco usa da solo, appena ci sono: camminata/corsa con pistola o fucile, fucile da fermo e in ricarica, raccogliere oggetti; effetti `assets/fx/` (vampate, sangue, polvere). |
| Suoni | Il battito e il click della torcia sono collegati. |

---

## 2. Cosa manca — SPRITE (il pacchetto `docs/reference/NotteRossa_reference.zip` ha i prompt per tutto)

Il problema principale ora è la **coerenza di aspetto**: alcuni personaggi cambiano vestiti a seconda dell'animazione (vedi `00_stile/cast_attuale.png` nello zip).

1. **Luca**: le pose fermo-con-pistola, colpito, ferito, morte, torcia da fermo, raccogliere/spingere, accovacciato fermo, nascosto sono ancora del modello vecchio (giacca nera, **senza zaino**). Manca anche la camminata con l'arma in mano (oggi cammina disarmato e la pistola compare solo quando spara).
2. **Carmine**: tre pose con gilet arancione e una faccia, la posa "parla" con gilet giallo e un'altra faccia.
3. **Contaminato, ferroviere, tecnico**: fermo e "colpito" sono figure diverse dalla camminata. (Per contaminato e infermiera ho messo come "fermo" la prima posa della camminata, in attesa delle tavole.)
4. **Corridore**: la corsa è nuova (straccioni scuri, eretto), il resto è il modello vecchio a quattro zampe.
5. **Crawler e Listener**: 1–2 pose per animazione; **il Listener non ha l'animazione di morte**.
6. **Elena "spaventata"** è più piccola delle altre sue pose.
7. **Effetti**: fiammata e sangue sono disegnati dal codice; le tavole `fx_*.png` in `assets/sprites/` non sono usate.
8. **Oggetti presi**: chiave nella cassetta rossa, frigo della sala operatoria, chiavetta nel terminale, leva della serranda, lettera sul tavolo: si vede solo l'icona che sparisce, il fondale non cambia.

## 3. Cosa manca — GUI

Il codice è pronto (secondo giro): mancano solo le immagini, con i nomi file della sezione B del LEGGIMI. Elenco:

- **Menu**: logo, fondale (oggi `provvisori/menu_bg.png`), bottoni.
- **HUD**: barra della vita (oggi una linea verde), batteria, munizioni, obiettivo, nome stanza.
- **Dialoghi**: cornice e **ritratti** di chi parla (oggi solo il nome in maiuscolo; le voci registrate e il "???" al telefono non si distinguono).
- **Inventario**: oggi una griglia di caselle grigie; proposta: zaino aperto.
- **Documenti**: un solo stile di foglio per tutti (ordinanza, diario, cartella clinica, lettera di Elena sembrano uguali).
- **Salvataggio, pausa, game over, cartello di capitolo, finali**: pannelli semplici; i due finali non hanno un'immagine.
- **Comandi touch e tasti**: disegnati con testo.
- La mappa di Porto Salvo resta disegnata dal codice (segue le stanze): non serve un'immagine.

## 4. Cosa manca — SUONI

Il codice è pronto, mancano **i file** (51 nomi nella sezione D del LEGGIMI, con descrizione da usare come prompt). Priorità: `rain_heavy`, `station_ambient`, `hospital_hum`, `metro_drip`, i 4 passi, `shot`, `shotgun_shot`, `door_open`, `enemy_groan`, `enemy_alert`, `listener_shriek`, `phone_ring`. **Senza suoni il Listener (che ti sente) è difficile da capire**: oggi niente ti avvisa che c'è.

## 5. Giocabilità e narrazione (i punti 1–5 sono risolti nel secondo giro)

**Funziona**: catena di obiettivi chiara (l'obiettivo in alto cambia sempre in modo corretto), nessun vicolo cieco, due finali legati a una scelta reale (la provetta), documenti ben scritti e coerenti con date e orari.

Da migliorare:
1. **Troppe munizioni**: nei livelli ci sono 170 colpi da 9mm e 54 cartucce, più quelli lasciati dai nemici (40% delle volte anche se sei pieno). A fine partita il test ha **118 colpi e 40 cartucce**: niente tensione. Proposta: dimezzare i 9mm sparsi, drop solo se sei a corto.
2. **Primo salvataggio tardi**: la prima radio è in sala controllo; se muori prima, ricominci dal treno. Proposta: salvataggio automatico all'inizio di ogni capitolo.
3. **Sala operatoria = stanza sicura con un nemico**: c'è un terminale [SALVA] e un Corridore appostato accanto. Nei survival horror le stanze di salvataggio sono sicure: o si sposta il Corridore nel corridoio, o si toglie il salvataggio da lì.
4. **Fusibile e ritorno lungo**: se entri in ospedale senza aver aperto la cassaforte di Luigi, al generatore devi tornare indietro di 6 stanze (metro → obitorio → ospedale → vicolo → strada → negozio). L'obiettivo lo dice, ma è lungo. Proposta: un indizio più esplicito prima del vicolo, o un secondo fusibile in metro.
5. **Capitoli 4 e 5** partono senza una riga di racconto (gli altri ce l'hanno).
6. **Momento chiave senza immagini**: il morso di Elena e il suo addio sono solo testo + dissolvenza. Una vignetta/illustrazione (o i ritratti) cambierebbe molto.
7. La chiave "Degenze — 2° piano" apre una porta del corridoio al piano terra: piccolo dettaglio (basta "Scale — Degenze 2° piano" sulla porta).

## 6. Senso logico e coerenza (luci, suoni, sprite) — luci e blackout risolti nel secondo giro

- **Luci**: il buio è uniforme in tutta la stanza (più l'alone attorno a Luca). Le luci dipinte nei fondali (lampade, allarmi rossi, monitor) non illuminano i personaggi, che sono tutti con la stessa luce: sembrano "appoggiati sopra". Proposta (lavoro di codice): una **tinta per stanza** sui personaggi (blu/verde acqua, rossa nelle stanze d'allarme) e zone di luce nei punti dove il fondale ha una lampada.
- **Luci dopo il blackout**: si spengono solo sul binario; atrio, servizi e sala controllo restano illuminati come prima della telefonata.
- **Generatore**: il racconto dice "le luci si accendono fino al laboratorio", ma cambia solo la sala generatori (il tunnel resta buio a 0.3). Coerente se il tunnel non è sulla linea; altrimenti va acceso anche lui.
- **Pioggia**: al porto e al molo piove ma l'ambiente sarà quello del mare: il file `harbor_waves.mp3` va fatto con la pioggia dentro.
- **Strumenti**: `tools/slice_sprites.py` riscrive tutto il manifest: se lo rilanci, prima aggiorna la sua CONFIG con le animazioni recuperate (oppure rilancia subito dopo `tools/repack_strips.py` e ricontrolla il manifest).

---

## 7. Ordine di lavoro consigliato per chiudere

1. Sprite di coerenza (sezione A del LEGGIMI): Luca, Carmine, fermo/colpito dei mostri, Listener morte.
2. Suoni prioritari (sezione D): sono una ventina di file e cambiano tutto il gioco.
3. GUI B1–B6 (kit, logo, menu, HUD, dialoghi, ritratti).
4. ~~Bilanciamento munizioni, salvataggio automatico, tinta di luce~~ (fatto).
5. GUI restante, effetti, stati dei fondali, illustrazioni dei finali.
