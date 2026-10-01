/* =============================================
   NOTTE ROSSA — rooms_data.js
   SOLO DATI: stanze, porte, oggetti, nemici.
   Quando cambia uno sfondo si aggiornano le posizioni qui
   (l'editor F2 nel gioco genera questo formato).

   Coordinate: x in pixel dello sfondo scalato a 720 di altezza.
   layoutW = larghezza della stanza su cui sono state misurate le x (default 1280):
   se l'immagine è più larga, le posizioni vengono riproporzionate in automatico.
   floorY = linea dei piedi, scale = altezza persona (1 = 280px).
   La larghezza della stanza è presa dall'immagine (stanze lunghe = scorrimento).

   doors:    { id, x, w, top?, label, target, keyId, keepKey, lockedText,
               requires:[cond], failText }   (senza target = solo da esaminare)
             All'arrivo il giocatore compare davanti alla porta che riporta indietro.
   hotspots: { id, x, w, label, markY, icon, iconY, give, doc, text,
               requires, failText, setFlag, event, once, showIf, hideIf }
   npcs:     { id, char, x, anim, facingRight, label, event, showIf, hideIf }
   props:    { name, x, flip }
   overlays: { type:'monitor'|'neon'|'lever'|'barricade', ... }
   enemies:  { id, type, x, patrol, ceiling, idle, facingRight, showIf, hideIf }
   cond:     { flag } | { notFlag } | { item }
   ============================================= */

const BG  = 'assets/backgrounds/';
const BGP = 'assets/backgrounds/provvisori/';
const NEVER = [{ flag: 'never' }];

export const ROOMS = {

  /* ═══════════ CAPITOLO 1 — STAZIONE CENTRALE ═══════════ */

  train_wagon: {
    name: 'Treno 847 — Vagone 4', bg: BG + 'train_wagon.png', scale: 1.35, floorY: 682,
    light: 0.5, map: [0, 0], ambient: 'train_idle', spawnX: 380,
    hotspots: [
      { id: 'window_wagon', x: 40, w: 200, label: 'Finestrino', markY: 300,
        text: 'Pioggia. Il binario 1 di Porto Salvo è deserto.\nNessun capotreno, nessun annuncio.' },
      { id: 'seat_protagonist', x: 290, w: 170, label: 'Il tuo posto', markY: 470,
        text: 'La tua borsa è ancora qui. Il telefono non ha campo da Porto Salvo Vecchia.' },
      { id: 'document_ticket', x: 470, w: 110, label: 'Biglietto a terra', icon: 'note', iconY: 650, doc: 'doc_ticket' },
    ],
    doors: [
      { id: 'wagon_inner', x: 590, w: 80, top: 300, label: 'Vagone 3',
        lockedText: 'La porta verso il vagone 3 è bloccata.\nDall\'altra parte qualcosa sta grattando.', requires: NEVER },
      { id: 'wagon_to_platform', x: 1010, w: 200, top: 120, label: 'Scendi — Binario 1', target: 'station_platform' },
    ],
  },

  station_platform: {
    name: 'Binario 1', bg: BG + 'station_platform.png', scale: 1.10, floorY: 670,
    light: 0.55, darkFlag: 'lights_out', darkLight: 0.28, map: [1, 0], ambient: 'station_ambient',
    props: [{ name: 'body_0', x: 520 }],
    hotspots: [
      { id: 'body_conductor', x: 430, w: 180, label: 'Il capotreno', markY: 600,
        text: 'Il capotreno. Ha la gola aperta.\nIl fischietto è ancora stretto nella mano.' },
      { id: 'platform_sign', x: 760, w: 120, label: 'Tabellone', markY: 250,
        text: '22:47 — CIRCOLAZIONE SOSPESA\nPer informazioni rivolgersi al personale.' },
      { id: 'public_phone', x: 1100, w: 160, label: 'Cabina telefonica', markY: 330, event: 'phone_answer',
        showIf: { flag: 'phone_ringing' } },
    ],
    doors: [
      { id: 'platform_to_wagon', x: 40, w: 220, top: 260, label: 'Treno 847', target: 'train_wagon' },
      { id: 'platform_to_hall', x: 600, w: 130, top: 300, label: 'Verso l\'atrio', target: 'station_hall',
        requires: [{ notFlag: 'phone_ringing' }], failText: 'Il telefono continua a squillare. Sembra che stia chiamando te.' },
      { id: 'platform_to_storage', x: 960, w: 110, top: 200, label: 'Servizi tecnici', target: 'station_storage',
        requires: [{ notFlag: 'phone_ringing' }], failText: 'Il telefono continua a squillare. Sembra che stia chiamando te.' },
    ],
    enemies: [
      { id: 'platform_ferroviere', type: 'ferroviere', x: 120, facingRight: true, showIf: { flag: 'intro_complete' } },
    ],
  },

  station_hall: {
    name: 'Atrio', bg: BG + 'station_hall.png', scale: 1.05, floorY: 666,
    light: 0.55, map: [2, 0], ambient: 'station_ambient',
    hotspots: [
      { id: 'ticket_booth', x: 170, w: 200, label: 'Biglietteria', markY: 400, give: ['flashlight', 'battery'],
        text: 'La biglietteria è chiusa. Il cassetto dei soldi è aperto e pieno.\nSotto il bancone, una torcia d\'emergenza.', event: 'got_flashlight' },
      { id: 'notice_board', x: 400, w: 80, label: 'Avviso sul pilastro', icon: 'note', iconY: 420, doc: 'doc_ordinanza' },
      { id: 'ticket_machines', x: 540, w: 160, label: 'Biglietterie automatiche', markY: 380,
        text: 'Lo schermo lampeggia: "SERVIZIO SOSPESO — ZONA ROSSA".' },
    ],
    doors: [
      { id: 'hall_to_platform', x: 0, w: 130, top: 300, label: 'Binari', target: 'station_platform' },
      { id: 'hall_to_control', x: 740, w: 180, top: 230, label: 'Sala controllo', target: 'station_control',
        keyId: 'key_station', lockedText: 'In cima alla scala mobile c\'è una porta blindata.\n"SALA CONTROLLO — solo personale". Serve la chiave.' },
      { id: 'hall_to_exit', x: 1030, w: 180, top: 250, label: 'Uscita', target: 'station_exit',
        requires: [{ flag: 'shutter_open' }], failText: 'Oltre i vetri, la serranda dell\'uscita è abbassata.\nSi comanda dalla sala controllo.' },
    ],
    enemies: [
      { id: 'hall_contaminato', type: 'contaminato', x: 950, patrol: [800, 1150], showIf: { flag: 'has_pistol' } },
    ],
  },

  station_storage: {
    name: 'Servizi tecnici', bg: BG + 'station_storage.png', scale: 1.15, floorY: 670,
    light: 0.38, map: [1, 1], ambient: 'room_hum',
    props: [{ name: 'body_6', x: 690, flip: true }],
    hotspots: [
      { id: 'document_note_storage', x: 330, w: 80, label: 'Foglio sul quadro', icon: 'note', iconY: 330, doc: 'doc_storage_note' },
      { id: 'shelf_pistol', x: 420, w: 110, label: 'Armadio B3', icon: 'pistol', iconY: 420,
        give: ['pistol', ['ammo_pistol_small', 16]], event: 'got_pistol' },
      { id: 'crate_key', x: 540, w: 80, label: 'Cassetta rossa', icon: 'key_station', iconY: 640, give: ['key_station'] },
      { id: 'guard_body', x: 630, w: 140, label: 'La guardia', markY: 600,
        give: ['bandage'], text: 'Una guardia giurata. Nella tasca: delle bende.' },
      { id: 'cart_storage', x: 880, w: 130, label: 'Carrello delle pulizie', markY: 430,
        text: 'Sul pavimento, impronte scalze che vanno verso il buio.' },
    ],
    doors: [
      { id: 'storage_to_platform', x: 110, w: 190, top: 90, label: 'Binario 1', target: 'station_platform' },
      { id: 'storage_dark', x: 580, w: 60, top: 300, label: 'Corridoio buio',
        lockedText: 'Il corridoio finisce contro un muro di casse.', requires: NEVER },
    ],
  },

  station_control: {
    name: 'Sala controllo', bg: BG + 'station_control.png', scale: 1.25, floorY: 682,
    light: 0.7, map: [3, 0], ambient: 'electronics_hum', safe: true,
    npcs: [
      { id: 'carmine', char: 'carmine', x: 330, anim: 'scared', facingRight: true, label: 'Carmine, il ferroviere', event: 'talk_carmine' },
    ],
    overlays: [
      { type: 'monitor', x: 1063, y: 350, w: 44, h: 36 },
      { type: 'monitor', x: 384, y: 393, w: 50, h: 40 },
      { type: 'lever', x: 1160, y: 460, h: 70, flag: 'shutter_open' },
    ],
    hotspots: [
      { id: 'emergency_radio', x: 120, w: 110, label: 'Radio d\'emergenza [SALVA]', markY: 370, event: 'open_save' },
      { id: 'control_monitor', x: 990, w: 130, label: 'Monitor', markY: 330,
        text: 'La mappa della rete ferroviaria.\nTutte le linee attorno a Porto Salvo sono rosse.' },
      { id: 'doc_turni', x: 580, w: 110, label: 'Registro di movimento', icon: 'note', iconY: 395, doc: 'doc_turni' },
      { id: 'shutter_lever', x: 1140, w: 130, label: 'Leva della serranda', markY: 440, event: 'open_shutter',
        requires: [{ flag: 'carmine_talked' }], failText: 'Un pannello con decine di leve. Meglio chiedere al ferroviere.' },
    ],
    doors: [
      { id: 'control_to_hall', x: 0, w: 100, top: 280, label: 'Scala — Atrio', target: 'station_hall' },
    ],
  },

  station_exit: {
    name: 'Uscita della stazione', bg: BG + 'station_exit.png', scale: 1.15, floorY: 672,
    light: 0.55, map: [4, 0], ambient: 'rain_heavy',
    props: [{ name: 'body_1', x: 1000 }],
    hotspots: [
      { id: 'exit_map', x: 160, w: 110, label: 'Piantina a terra', icon: 'city_map', iconY: 640, give: ['city_map'],
        text: 'Qualcuno ha cerchiato in rosso l\'Ospedale San Rocco, a tre isolati da qui.' },
      { id: 'police_body', x: 920, w: 170, label: 'Il poliziotto', markY: 600,
        give: [['ammo_pistol_small', 8]], text: 'Un agente della Polfer. Ha sparato tutti i colpi tranne quelli rimasti in tasca.' },
    ],
    doors: [
      { id: 'exit_to_hall', x: 0, w: 110, top: 220, label: 'Atrio', target: 'station_hall' },
      { id: 'exit_to_city', x: 600, w: 190, top: 210, label: 'Via Ferrante', target: 'city_street' },
    ],
    enemies: [
      { id: 'exit_corridore', type: 'corridore', x: 1100, idle: true, facingRight: false },
    ],
  },

  /* ═══════════ CAPITOLO 2 — PORTO SALVO ═══════════ */

  city_street: {
    name: 'Via Ferrante', bg: BG + 'city_street.png', scale: 0.80, floorY: 652,
    light: 0.5, map: [0, 2], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_3', x: 760, flip: true }],
    hotspots: [
      { id: 'car_glovebox', x: 420, w: 150, label: 'Auto con la portiera aperta', markY: 490,
        give: ['battery'], text: 'Nel cassetto del cruscotto: batterie e un rosario.' },
    ],
    doors: [
      { id: 'street_to_station', x: 0, w: 110, top: 300, label: 'Stazione', target: 'station_exit' },
      { id: 'street_to_apartment', x: 140, w: 100, top: 330, label: 'Palazzo Conti', target: 'apartment' },
      { id: 'street_to_alley', x: 580, w: 120, top: 330, label: 'Vicolo — San Rocco', target: 'city_alley' },
      { id: 'street_to_shop', x: 900, w: 110, top: 300, label: 'Alimentari da Luigi', target: 'alimentari' },
    ],
    enemies: [
      { id: 'street_c1', type: 'contaminato', x: 380, patrol: [280, 520] },
      { id: 'street_c2', type: 'ferroviere', x: 1050, patrol: [1000, 1200] },
    ],
  },

  alimentari: {
    name: 'Alimentari da Luigi', bg: BG + 'alimentari.png', scale: 1.00, floorY: 666,
    light: 0.55, map: [1, 2],
    props: [{ name: 'body_3', x: 690 }],
    hotspots: [
      { id: 'shop_meds', x: 280, w: 170, label: 'Scaffale farmacia', markY: 420, give: ['painkillers'] },
      { id: 'shop_note', x: 610, w: 120, label: 'Luigi', icon: 'note', iconY: 610, doc: 'doc_luigi',
        text: 'È Luigi. Ha ancora il grembiule. Nella mano, un biglietto.' },
      { id: 'shop_crowbar', x: 760, w: 90, label: 'Dietro il bancone', icon: 'crowbar', iconY: 500, give: ['crowbar'] },
      { id: 'shop_safe', x: 860, w: 110, label: 'Cassaforte sotto la cassa', icon: 'padlock', iconY: 470,
        requires: [{ flag: 'knows_safe_code' }], failText: 'Una cassaforte a combinazione. Quattro cifre.\nNon la conosci.',
        give: ['fuse', 'medikit_small', ['ammo_pistol_small', 8]], text: '1 - 4 - 1 - 0.\nLa cassaforte si apre con uno scatto.' },
      { id: 'shop_batteries', x: 1060, w: 180, label: 'Frigoriferi', markY: 400, give: ['battery'],
        text: 'I frigo sono spenti. Tra le bottiglie qualcuno ha nascosto delle batterie.' },
    ],
    doors: [
      { id: 'shop_to_street', x: 0, w: 130, top: 120, label: 'Via Ferrante', target: 'city_street' },
      { id: 'shop_back', x: 600, w: 80, top: 260, label: 'Retro', lockedText: 'La porta del retro è inchiodata dall\'interno.', requires: NEVER },
    ],
    enemies: [
      { id: 'shop_crawler', type: 'crawler', x: 820, ceiling: true },
    ],
  },

  apartment: {
    name: 'Palazzo Conti — Int. 4', bg: BG + 'apartment.png', scale: 0.90, floorY: 664,
    light: 0.5, map: [2, 2],
    overlays: [{ type: 'monitor', x: 455, y: 352, w: 66, h: 46 }],
    hotspots: [
      { id: 'apt_diary', x: 300, w: 140, label: 'Diario sul divano', icon: 'note', iconY: 470, doc: 'doc_diario_giulia',
        setFlag: { knows_safe_code: true } },
      { id: 'apt_tv', x: 450, w: 90, label: 'Televisore', markY: 340,
        text: 'Solo statico. Poi, per un secondo, una scritta:\n"RESTATE IN CASA. NON APRITE A NESSUNO."' },
      { id: 'apt_key', x: 680, w: 110, label: 'Bancone della cucina', icon: 'key_hospital', iconY: 345, give: ['key_hospital', 'bandage'] },
      { id: 'apt_radio', x: 830, w: 150, label: 'Radio sul tavolo', icon: 'radio', iconY: 440,
        text: [['RADIO', '"...Protezione Civile. La zona rossa comprende tutto il comune di Porto Salvo..."'],
               ['RADIO', '"...all\'alba è prevista un\'operazione di bonifica. Chi è in grado di raggiungere il mare..."'],
               ['', 'Poi solo fruscio.']] },
    ],
    doors: [
      { id: 'apt_to_street', x: 1110, w: 130, top: 190, label: 'Scale — Via Ferrante', target: 'city_street' },
    ],
    enemies: [
      { id: 'apt_listener', type: 'listener', x: 220, idle: true, facingRight: true },
    ],
  },

  city_alley: {
    name: 'Vicolo dei Pescatori', bg: BG + 'city_alley.png', scale: 0.95, floorY: 664,
    light: 0.42, map: [3, 2], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_4', x: 330 }],
    overlays: [{ type: 'barricade', door: 'alley_to_hospital' }],
    hotspots: [
      { id: 'alley_woman', x: 240, w: 170, label: 'Una donna', markY: 600,
        text: 'Una donna in cappotto. La borsa è ancora a tracolla. Dentro, solo le chiavi di casa.' },
      { id: 'alley_dumpster', x: 700, w: 160, label: 'Cassonetto', markY: 470, give: [['ammo_pistol_small', 8]],
        text: 'Qualcuno ha buttato una scatola di munizioni ancora piena. O l\'ha nascosta.' },
    ],
    doors: [
      { id: 'alley_to_street', x: 480, w: 140, top: 330, label: 'Via Ferrante', target: 'city_street' },
      { id: 'alley_to_hospital', x: 1000, w: 160, top: 250, label: 'San Rocco — Ingresso di servizio', target: 'hospital_corridor',
        keyId: 'crowbar', keepKey: true, lockedText: 'La porta di servizio dell\'ospedale è sbarrata con assi inchiodate.\nServe qualcosa per fare leva.' },
    ],
    enemies: [
      { id: 'alley_crawler', type: 'crawler', x: 600, ceiling: true },
      { id: 'alley_c', type: 'contaminato', x: 880, patrol: [760, 960] },
    ],
  },

  /* ═══════════ CAPITOLO 3 — OSPEDALE SAN ROCCO ═══════════ */

  hospital_corridor: {
    name: 'San Rocco — Corridoio', bg: BG + 'hospital_corridor.png', scale: 1.10, floorY: 672,
    light: 0.5, map: [0, 3], ambient: 'hospital_hum',
    props: [{ name: 'body_2', x: 820 }],
    hotspots: [
      { id: 'hosp_cart', x: 370, w: 90, label: 'Carrello medicazioni', icon: 'note', iconY: 420,
        give: ['bandage'], doc: 'doc_cartella' },
    ],
    doors: [
      { id: 'corr_to_alley', x: 90, w: 120, top: 110, label: 'Vicolo', target: 'city_alley' },
      { id: 'corr_to_ward', x: 290, w: 70, top: 220, label: 'Degenze', target: 'hospital_ward',
        keyId: 'key_hospital', lockedText: 'Porta del reparto degenze. Chiusa a chiave.' },
      { id: 'corr_to_morgue', x: 590, w: 100, top: 300, label: 'Scale — Obitorio', target: 'hospital_morgue',
        requires: [{ item: 'shotgun' }], failText: 'Le scale scendono verso l\'obitorio. Da laggiù arrivano dei versi, tanti.\nCon una pistola sola non scendi.' },
      { id: 'corr_to_surgery', x: 1110, w: 130, top: 120, label: 'Sala operatoria', target: 'hospital_surgery',
        keyId: 'badge', lockedText: 'Porta chirurgica con lettore di badge. La spia è rossa.' },
    ],
    enemies: [
      { id: 'corr_inf1', type: 'infermiere', x: 480, patrol: [430, 700] },
      { id: 'corr_inf2', type: 'infermiere', x: 960, patrol: [880, 1060] },
    ],
  },

  hospital_ward: {
    name: 'Degenze — 2° piano', bg: BG + 'hospital_ward.png', scale: 1.10, floorY: 672,
    light: 0.45, map: [1, 3],
    props: [{ name: 'body_2', x: 990, flip: true }],
    hotspots: [
      { id: 'ward_locker', x: 140, w: 120, label: 'Mobiletto della vigilanza', icon: 'shotgun', iconY: 430,
        give: ['shotgun', ['ammo_shells', 8]], text: 'Il fucile della vigilanza. Qualcuno l\'ha lasciato qui con le cartucce.' },
      { id: 'ward_notes', x: 380, w: 160, label: 'Cartellina sul letto', icon: 'note', iconY: 470, doc: 'doc_ricerca_elena' },
      { id: 'ward_bed', x: 720, w: 140, label: 'Letto', markY: 470,
        text: 'Le cinghie del letto sono state strappate. Non tagliate: strappate.' },
      { id: 'ward_badge', x: 920, w: 140, label: 'L\'infermiera', icon: 'badge', iconY: 620, give: ['badge'],
        text: 'Sul camice c\'è scritto GIULIA. Il badge è ancora appeso al taschino.' },
    ],
    doors: [
      { id: 'ward_to_corr', x: 0, w: 110, top: 160, label: 'Corridoio', target: 'hospital_corridor' },
    ],
    enemies: [
      { id: 'ward_listener', type: 'listener', x: 620, idle: true, facingRight: true },
      { id: 'ward_inf', type: 'infermiere', x: 1120, patrol: [1080, 1200] },
    ],
  },

  hospital_surgery: {
    name: 'Sala operatoria', bg: BG + 'hospital_surgery.png', scale: 1.00, floorY: 668,
    light: 0.6, map: [2, 3], safe: true,
    hotspots: [
      { id: 'surg_terminal', x: 140, w: 110, label: 'Terminale [SALVA]', markY: 330, event: 'open_save' },
      { id: 'surg_table', x: 470, w: 280, label: 'Tavolo operatorio', markY: 440,
        text: 'Strumenti sparsi. Un bisturi piegato a metà.' },
      { id: 'surg_protocol', x: 860, w: 110, label: 'Carrello monitor', icon: 'note', iconY: 410, doc: 'doc_formula' },
      { id: 'surg_fridge', x: 1080, w: 170, label: 'Armadio frigo', icon: 'vial', iconY: 400, give: ['vial'],
        text: 'Ripiano 2. Una sola provetta, etichetta "R-0".\nÈ fredda. La avvolgi in una garza.' },
    ],
    doors: [
      { id: 'surg_to_corr', x: 250, w: 70, top: 260, label: 'Corridoio', target: 'hospital_corridor' },
    ],
    enemies: [
      { id: 'surg_corridore', type: 'corridore', x: 980, idle: true, facingRight: false },
    ],
  },

  hospital_morgue: {
    name: 'Obitorio', bg: BG + 'hospital_morgue.png', scale: 1.05, floorY: 670,
    light: 0.35, map: [3, 3],
    props: [{ name: 'body_7', x: 260 }],
    hotspots: [
      { id: 'morgue_report', x: 520, w: 240, label: 'Tavolo autoptico', icon: 'note', iconY: 420,
        doc: 'doc_autopsia', give: [['ammo_shells', 4]] },
      { id: 'morgue_drawer', x: 860, w: 180, label: 'Celle frigorifere', markY: 420,
        text: 'Una cella è aperta. Vuota. Il lenzuolo è sul pavimento.' },
    ],
    doors: [
      { id: 'morgue_to_corr', x: 330, w: 70, top: 250, label: 'Scale — Corridoio', target: 'hospital_corridor' },
      { id: 'morgue_to_metro', x: 1140, w: 130, top: 160, label: 'Passaggio di servizio', target: 'metro_ingresso' },
    ],
    enemies: [
      { id: 'morgue_cr1', type: 'crawler', x: 640, ceiling: true },
      { id: 'morgue_cr2', type: 'crawler', x: 900, patrol: [800, 1050] },
    ],
  },

  /* ═══════════ CAPITOLO 4 — SOTTERRANEI ═══════════ */

  metro_ingresso: {
    name: 'Metro — Ingresso', bg: BG + 'metro_ingresso.png', scale: 0.85, floorY: 668,
    light: 0.45, map: [0, 4],
    hotspots: [
      { id: 'metro_turnstiles', x: 220, w: 200, label: 'Tornelli', markY: 470,
        text: 'I tornelli sono bloccati in posizione aperta. Qualcuno è passato di corsa, in tanti.' },
      { id: 'metro_notice', x: 540, w: 160, label: 'Avviso', icon: 'note', iconY: 420, doc: 'doc_avviso_metro' },
    ],
    doors: [
      { id: 'mi_to_morgue', x: 90, w: 110, top: 230, label: 'Passaggio — Obitorio', target: 'hospital_morgue' },
      { id: 'mi_to_banchina', x: 820, w: 330, top: 160, label: 'Scala mobile — Banchina B', target: 'metro_banchina' },
    ],
    enemies: [
      { id: 'mi_listener', type: 'listener', x: 650, patrol: [560, 780] },
    ],
  },

  metro_banchina: {
    name: 'Metro — Banchina B', bg: BG + 'metro_banchina.png', scale: 0.90, floorY: 668,
    light: 0.42, map: [1, 4],
    props: [{ name: 'body_5', x: 860 }],
    hotspots: [
      { id: 'mb_train', x: 180, w: 250, label: 'Carrozze abbandonate', markY: 380,
        give: ['medikit_small'], text: 'Tra i sedili una borsa da infermiera. Dentro, un kit medico.' },
      { id: 'mb_phone', x: 560, w: 100, label: 'Colonnina SOS [SALVA]', markY: 380, event: 'open_save' },
      { id: 'mb_log', x: 780, w: 160, label: 'Il capotreno', icon: 'note', iconY: 610, doc: 'doc_registro_metro' },
    ],
    doors: [
      { id: 'mb_to_mi', x: 0, w: 120, top: 260, label: 'Ingresso', target: 'metro_ingresso' },
      { id: 'mb_to_tunnel', x: 1020, w: 220, top: 200, label: 'Tunnel Linea 3', target: 'metro_tunnel' },
    ],
    enemies: [
      { id: 'mb_tec', type: 'tecnico', x: 420, patrol: [300, 700] },
      { id: 'mb_run', type: 'corridore', x: 960, idle: true, facingRight: false },
    ],
  },

  metro_tunnel: {
    name: 'Tunnel Linea 3', bg: BG + 'metro_tunnel.png', scale: 0.85, floorY: 668,
    light: 0.22, map: [2, 4],
    props: [{ name: 'body_6', x: 360 }],
    hotspots: [
      { id: 'tunnel_notebook', x: 290, w: 160, label: 'Il soldato', icon: 'note', iconY: 620,
        doc: 'doc_taccuino', give: [['ammo_pistol_small', 8]] },
    ],
    doors: [
      { id: 'tunnel_to_mb', x: 0, w: 140, top: 300, label: 'Banchina B', target: 'metro_banchina' },
      { id: 'tunnel_to_gen', x: 690, w: 110, top: 260, label: 'Avanti nel buio — Sala tecnica', target: 'sala_generatori' },
    ],
    enemies: [
      { id: 'tun_cr1', type: 'crawler', x: 560, ceiling: true },
      { id: 'tun_cr2', type: 'crawler', x: 1000, patrol: [900, 1150] },
    ],
  },

  sala_generatori: {
    name: 'Sala generatori', bg: BG + 'sala_generatori.png', scale: 0.90, floorY: 668,
    light: 0.45, poweredFlag: 'power_on', poweredLight: 0.75, map: [3, 4],
    overlays: [{ type: 'lever', x: 1020, y: 390, h: 60, flag: 'power_on' }],
    hotspots: [
      { id: 'generator', x: 120, w: 340, label: 'Generatore di emergenza', markY: 380, event: 'start_generator',
        requires: [{ item: 'fuse' }], failText: 'Il vano del fusibile principale è vuoto.\nSenza un fusibile da 30A non parte.',
        hideIf: { flag: 'power_on' } },
      { id: 'gen_manual', x: 480, w: 90, label: 'Manuale a terra', icon: 'note', iconY: 600, doc: 'doc_manuale' },
      { id: 'gen_panel', x: 820, w: 180, label: 'Quadri elettrici', markY: 360,
        text: 'LINEA 3 — LABORATORIO — RIFUGIO. Tutto spento.', hideIf: { flag: 'power_on' } },
    ],
    doors: [
      { id: 'gen_to_tunnel', x: 0, w: 100, top: 260, label: 'Tunnel', target: 'metro_tunnel' },
      { id: 'gen_to_maint', x: 680, w: 100, top: 260, label: 'Officina', target: 'stanza_manutenzione' },
    ],
    enemies: [
      { id: 'gen_tec', type: 'tecnico', x: 900, patrol: [820, 1150] },
      { id: 'gen_run', type: 'corridore', x: 1150, facingRight: false, showIf: { flag: 'power_on' } },
    ],
  },

  stanza_manutenzione: {
    name: 'Officina', bg: BG + 'stanza_manutenzione.png', scale: 1.20, floorY: 682,
    light: 0.5, map: [4, 4],
    hotspots: [
      { id: 'maint_bench', x: 520, w: 360, label: 'Banco da lavoro', icon: 'note', iconY: 440,
        doc: 'doc_officina', give: [['ammo_shells', 4]] },
      { id: 'maint_locker', x: 940, w: 160, label: 'Armadietto 7', icon: 'card', iconY: 420, give: ['card'] },
    ],
    doors: [
      { id: 'maint_to_gen', x: 0, w: 120, top: 240, label: 'Sala generatori', target: 'sala_generatori' },
      { id: 'maint_to_safe', x: 230, w: 230, top: 120, label: 'Porta blindata — Rifugio', target: 'safe_room',
        requires: [{ flag: 'power_on' }], failText: 'Porta blindata a comando elettrico. Senza corrente non si apre.' },
    ],
    enemies: [
      { id: 'maint_listener', type: 'listener', x: 760, idle: true, facingRight: false },
    ],
  },

  safe_room: {
    name: 'Il rifugio di Elena', bg: BGP + 'safe_room.png', scale: 2.10, floorY: 710,
    light: 0.8, map: [5, 4], safe: true,
    overlays: [{ type: 'neon', x: 690, y: 30, w: 160 }],
    hotspots: [
      { id: 'safe_shelf', x: 190, w: 280, label: 'Scaffale', markY: 470,
        give: ['medikit_small', ['ammo_shells', 4], ['ammo_pistol_small', 8]] },
      { id: 'safe_recorder', x: 560, w: 160, label: 'Registratore sulla scrivania', icon: 'recorder', iconY: 372, event: 'elena_tape_2' },
      { id: 'safe_radio', x: 760, w: 200, label: 'Radio di Elena [SALVA]', markY: 330, event: 'open_save' },
    ],
    doors: [
      { id: 'safe_to_maint', x: 0, w: 120, top: 150, label: 'Officina', target: 'stanza_manutenzione' },
      { id: 'safe_to_lab', x: 1000, w: 160, top: 80, label: 'Laboratorio', target: 'lab_ingresso',
        keyId: 'card', lockedText: 'Dietro l\'armadio c\'è la porta del laboratorio. Lettore di tessere: "LIVELLO 3".' },
    ],
  },

  /* ═══════════ CAPITOLO 5 — LABORATORIO ROSSO ═══════════ */

  lab_ingresso: {
    name: 'Laboratorio — Ingresso', bg: BGP + 'lab_ingresso.png', scale: 1.20, floorY: 676,
    light: 0.55, map: [0, 5],
    hotspots: [
      { id: 'lab_papers', x: 180, w: 160, label: 'Fogli a terra', markY: 600,
        text: 'Moduli di evacuazione. Tutti firmati "Dir. Amati". Nessuno compilato.' },
    ],
    doors: [
      { id: 'li_to_safe', x: 0, w: 120, top: 150, label: 'Rifugio', target: 'safe_room' },
      { id: 'li_to_corr', x: 400, w: 380, top: 120, label: 'Porta a doppia anta', target: 'lab_corridoio' },
    ],
    enemies: [
      { id: 'li_tec', type: 'tecnico', x: 950, patrol: [880, 1150] },
    ],
  },

  lab_corridoio: {
    name: 'Laboratorio — Corridoio', bg: BGP + 'lab_corridoio.png', scale: 1.05, floorY: 670,
    light: 0.55, map: [1, 5],
    hotspots: [
      { id: 'lc_log', x: 200, w: 160, label: 'Registro accessi', icon: 'note', iconY: 470, doc: 'doc_accessi' },
      { id: 'lc_bench', x: 900, w: 200, label: 'Bancone', markY: 420, give: ['painkillers'] },
    ],
    doors: [
      { id: 'lc_to_li', x: 0, w: 110, top: 160, label: 'Ingresso', target: 'lab_ingresso' },
      { id: 'lc_to_bio', x: 580, w: 110, top: 230, label: 'Laboratorio biologico', target: 'lab_biologico' },
      { id: 'lc_to_server', x: 1170, w: 110, top: 160, label: 'Sala server', target: 'sala_server' },
    ],
    enemies: [
      { id: 'lc_inf', type: 'infermiere', x: 420, patrol: [360, 540] },
      { id: 'lc_run', type: 'corridore', x: 1000, idle: true, facingRight: false },
    ],
  },

  lab_biologico: {
    name: 'Laboratorio biologico', bg: BGP + 'lab_biologico.png', scale: 1.00, floorY: 666,
    light: 0.45, map: [2, 5],
    hotspots: [
      { id: 'bio_tanks', x: 120, w: 260, label: 'Vasche di coltura', markY: 330,
        text: 'Dentro il liquido verdastro galleggia qualcosa che una volta era una mano.' },
      { id: 'bio_usb', x: 430, w: 110, label: 'Terminale di ricerca', icon: 'usb', iconY: 470, give: ['usb'],
        text: 'Nella porta del terminale è infilata una chiavetta. "R-0 / dati completi — E.F."' },
    ],
    doors: [
      { id: 'bio_to_corr', x: 570, w: 140, top: 230, label: 'Corridoio', target: 'lab_corridoio' },
    ],
    enemies: [
      { id: 'bio_cr', type: 'crawler', x: 860, ceiling: true },
      { id: 'bio_c', type: 'contaminato', x: 1050, patrol: [950, 1180] },
    ],
  },

  sala_server: {
    name: 'Sala server', bg: BGP + 'sala_server.png', scale: 1.10, floorY: 672,
    light: 0.5, map: [3, 5],
    hotspots: [
      { id: 'server_doc', x: 180, w: 120, label: 'Stampa sul pavimento', icon: 'note', iconY: 630, doc: 'doc_classificato' },
      { id: 'server_upload', x: 830, w: 140, label: 'Terminale di trasmissione', markY: 420, event: 'upload_data',
        requires: [{ item: 'usb' }], failText: 'Il terminale chiede un supporto con i dati da trasmettere.',
        hideIf: { flag: 'data_sent' } },
    ],
    doors: [
      { id: 'server_to_lc', x: 0, w: 130, top: 120, label: 'Corridoio', target: 'lab_corridoio' },
      { id: 'server_to_core', x: 520, w: 240, top: 200, label: 'Camera centrale', target: 'camera_centrale',
        requires: [{ flag: 'data_sent' }], failText: 'Porta stagna. Sul display: "APERTURA SOLO DA TERMINALE".' },
    ],
    enemies: [
      { id: 'server_listener', type: 'listener', x: 1000, patrol: [900, 1180] },
    ],
  },

  camera_centrale: {
    name: 'Camera centrale', bg: BGP + 'camera_centrale.png', scale: 1.00, floorY: 664,
    light: 0.6, map: [4, 5],
    npcs: [
      { id: 'elena', char: 'elena', x: 880, anim: 'idle', facingRight: false, label: 'Elena', event: 'talk_elena', hideIf: { flag: 'elena_gone' } },
    ],
    hotspots: [
      { id: 'core_letter', x: 840, w: 120, label: 'Una lettera e una chiave', icon: 'note', iconY: 620, doc: 'doc_lettera_elena',
        give: ['key_rusty'], showIf: { flag: 'elena_gone' } },
    ],
    doors: [
      { id: 'core_to_server', x: 0, w: 130, top: 200, label: 'Sala server', target: 'sala_server',
        requires: [{ notFlag: 'core_alarm' }], failText: 'La porta stagna si è sigillata alle tue spalle.' },
      { id: 'core_to_port', x: 1150, w: 130, top: 200, label: 'Galleria verso il porto', target: 'porto',
        requires: [{ flag: 'elena_talked' }], failText: 'Un portellone chiuso. Elena ha il comando.' },
    ],
    enemies: [
      { id: 'core_run1', type: 'corridore', x: 140, facingRight: true, showIf: { flag: 'core_alarm' } },
      { id: 'core_run2', type: 'contaminato', x: 260, facingRight: true, showIf: { flag: 'core_alarm' } },
    ],
  },

  /* ═══════════ CAPITOLO 6 — IL PORTO ═══════════ */

  porto: {
    name: 'Porto commerciale', bg: BGP + 'porto.png', scale: 0.70, floorY: 652,
    light: 0.5, map: [0, 6], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_5', x: 520 }],
    hotspots: [
      { id: 'port_container', x: 300, w: 200, label: 'Container aperto', markY: 480,
        give: [['ammo_shells', 4], 'medikit_small'] },
    ],
    doors: [
      { id: 'port_to_core', x: 0, w: 120, top: 380, label: 'Galleria', target: 'camera_centrale',
        requires: NEVER, failText: 'La galleria è crollata dietro di te.' },
      { id: 'port_to_pier', x: 1160, w: 120, top: 380, label: 'Molo 4', target: 'molo_finale' },
    ],
    enemies: [
      { id: 'port_c1', type: 'tecnico', x: 700, patrol: [600, 900] },
      { id: 'port_run', type: 'corridore', x: 1080, facingRight: false },
      { id: 'port_c2', type: 'contaminato', x: 950, patrol: [850, 1100] },
    ],
  },

  molo_finale: {
    name: 'Molo 4', bg: BGP + 'molo_finale.png', scale: 0.75, floorY: 656,
    light: 0.5, map: [1, 6], ambient: 'rain_heavy', rain: true,
    hotspots: [
      { id: 'the_boat', x: 360, w: 160, label: 'Bitta — il gozzo di papà', markY: 450, event: 'ending',
        requires: [{ item: 'key_rusty' }], failText: 'Alla bitta è legato il gozzo di papà, con una catena e un lucchetto.' },
    ],
    doors: [
      { id: 'pier_to_port', x: 1160, w: 120, top: 380, label: 'Porto', target: 'porto' },
    ],
    enemies: [
      { id: 'pier_l', type: 'listener', x: 760, idle: true, facingRight: false },
    ],
  },
};
