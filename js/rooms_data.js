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
const BGV2 = 'assets/backgrounds/v2/';   // nuovi sfondi laterali
const NEVER = [{ flag: 'never' }];

export const ROOMS = {

  /* ═══════════ CAPITOLO 1 — STAZIONE CENTRALE ═══════════ */

  train_wagon: {
    name: 'Treno 847 — Vagone 4', bg: BG + 'train_wagon.png', keepEdges: true, scale: 1.35, floorY: 682,
    light: 0.5, map: [0, 0], ambient: 'train_idle', spawnX: 380,
    hotspots: [
      { id: 'window_wagon', x: 40, w: 200, label: 'Finestrino', markY: 300,
        text: 'Pioggia. Il binario 1 di Porto Salvo è deserto.\nNessun capotreno, nessun annuncio.' },
      { id: 'seat_protagonist', x: 290, w: 170, label: 'Il tuo posto', markY: 470,
        text: 'La tua borsa è ancora qui. Il telefono non ha campo da Porto Salvo Vecchia.' },
      { id: 'document_ticket', x: 470, w: 110, label: 'Biglietto a terra', icon: 'note', iconY: 650, doc: 'doc_ticket' },
      { id: 'wagon_side_door', x: 1330, w: 300, label: 'Porta laterale', markY: 330,
        text: 'Questa porta dà sul lato dei binari: sotto c\'è solo la massicciata.\nSi scende dalla porta di coda, in fondo al vagone.' },
    ],
    doors: [
      { id: 'wagon_to_platform', x: 805, w: 80, top: 260, bottom: 470, label: 'Porta di coda — Binario 1', target: 'station_platform', noSprite: true },
    ],
  },

  station_platform: {
    // NUOVO SFONDO (v2) con un po' di prospettiva: il marciapiede scende verso destra
    name: 'Binario 1', bg: BGV2 + 'station_platform.png', layoutW: 1319, keepEdges: true,
    scale: 0.74, floorY: 540,
    floorLine: [[300, 500], [1319, 592]],          // linea dei piedi (segue il marciapiede)
    scaleLine: [[300, 0.70], [1319, 0.84]],        // più vicino alla telecamera = più grande
    light: 0.72, darkFlag: 'lights_out', darkLight: 0.45, map: [1, 0], ambient: 'station_ambient',
    props: [{ name: 'body_0', x: 890 }],
    hotspots: [
      { id: 'body_conductor', x: 820, w: 150, label: 'Il capotreno', markY: 520,
        text: 'Il capotreno. Ha la gola aperta.\nIl fischietto è ancora stretto nella mano.' },
      { id: 'platform_sign', x: 418, w: 107, label: 'Orario arrivi e partenze', markY: 300,
        text: '22:47 — CIRCOLAZIONE SOSPESA\nPer informazioni rivolgersi al personale.' },
      { id: 'public_phone', x: 1150, w: 135, label: 'Telefono pubblico', markY: 365, event: 'phone_answer',
        showIf: { flag: 'phone_ringing' } },
    ],
    doors: [
      { id: 'platform_to_wagon', x: 172, w: 90, top: 300, bottom: 445, label: 'Treno 847', target: 'train_wagon', noSprite: true },
      { id: 'platform_to_hall', x: 645, w: 155, top: 240, bottom: 495, label: 'Atrio', target: 'station_hall', noSprite: true,
        requires: [{ notFlag: 'phone_ringing' }], failText: 'Il telefono continua a squillare. Sembra che stia chiamando te.' },
      { id: 'platform_to_storage', x: 968, w: 127, top: 260, bottom: 525, label: 'Servizi tecnici', target: 'station_storage', noSprite: true,
        requires: [{ notFlag: 'phone_ringing' }], failText: 'Il telefono continua a squillare. Sembra che stia chiamando te.' },
    ],
    enemies: [
      { id: 'platform_ferroviere', type: 'ferroviere', x: 250, facingRight: true, showIf: { flag: 'intro_complete' } },
    ],
  },

  station_hall: {
    // NUOVO SFONDO LATERALE (v2)
    name: 'Atrio', bg: BGV2 + 'station_hall.png', layoutW: 2782, keepEdges: true,
    scale: 0.92, floorY: 640,
    light: 0.72, map: [2, 0], ambient: 'station_ambient',
    hotspots: [
      { id: 'ticket_booth', x: 660, w: 320, label: 'Biglietteria', markY: 360, give: ['flashlight', 'battery'],
        text: 'La biglietteria è chiusa. Dalla fessura della serranda si vede il cassetto dei soldi, aperto e pieno.\nSotto il bancone, una torcia d\'emergenza.', event: 'got_flashlight' },
      { id: 'notice_board', x: 1040, w: 95, label: 'Avvisi sul pilastro', icon: 'note', iconY: 400, doc: 'doc_ordinanza' },
      { id: 'ticket_machines', x: 1225, w: 330, label: 'Biglietterie automatiche', markY: 420,
        text: 'Lo schermo lampeggia: "SERVIZIO SOSPESO — ZONA ROSSA".' },
    ],
    doors: [
      { id: 'hall_to_platform', x: 160, w: 370, top: 240, bottom: 600, label: 'Binari', target: 'station_platform', noSprite: true },
      { id: 'hall_to_control', x: 1560, w: 200, top: 300, bottom: 600, label: 'Scala mobile — Sala controllo', target: 'station_control', noSprite: true,
        keyId: 'key_station', lockedText: 'In cima alla scala mobile c\'è una porta blindata con la luce rossa.\n"SALA CONTROLLO — solo personale". Serve la chiave.' },
      { id: 'hall_to_exit', x: 2240, w: 510, top: 270, bottom: 560, label: 'Uscita', target: 'station_exit', noSprite: true,
        requires: [{ flag: 'shutter_open' }], failText: 'Dietro i vetri dell\'uscita le serrande sono abbassate.\nSi comandano dalla sala controllo.' },
    ],
    enemies: [
      { id: 'hall_contaminato', type: 'contaminato', x: 2000, patrol: [1850, 2200], showIf: { flag: 'has_pistol' } },
    ],
  },

  station_storage: {
    name: 'Servizi tecnici', bg: BGV2 + 'station_storage.png', layoutW: 1289, keepEdges: true, scale: 1.05, floorY: 600,
    light: 0.5, map: [1, 1], ambient: 'room_hum',
    props: [{ name: 'body_1', x: 350 }],
    hotspots: [
      { id: 'guard_body', x: 285, w: 130, label: 'La guardia', markY: 560,
        give: ['bandage', ['ammo_pistol_small', 10]], text: 'Una guardia giurata. Nella tasca: delle bende e un caricatore.' },
      { id: 'document_note_storage', x: 425, w: 90, label: 'Foglio sul quadro', icon: 'note', iconY: 300, doc: 'doc_storage_note' },
      { id: 'shelf_pistol', x: 545, w: 145, label: 'Armadio B3', icon: 'pistol', iconY: 400,
        give: ['pistol', ['ammo_pistol_small', 32]], event: 'got_pistol' },
      { id: 'cart_storage', x: 695, w: 70, label: 'Carrello delle pulizie', markY: 470,
        text: 'Sul pavimento, impronte scalze che vanno verso il buio.' },
      { id: 'crate_key', x: 770, w: 105, label: 'Cassetta rossa', icon: 'key_station', iconY: 290, give: ['key_station'] },
    ],
    doors: [
      { id: 'storage_to_platform', x: 85, w: 175, top: 200, bottom: 545, label: 'Binario 1', target: 'station_platform', noSprite: true },
      { id: 'storage_dark', x: 940, w: 220, top: 190, bottom: 560, label: 'Corridoio buio', noSprite: true,
        lockedText: 'Il corridoio finisce contro un muro di casse.', requires: NEVER },
    ],
  },

  station_control: {
    name: 'Sala controllo', bg: BGV2 + 'station_control.png', layoutW: 1472, keepEdges: true, scale: 1.42, floorY: 665,
    light: 0.72, map: [3, 0], ambient: 'electronics_hum', safe: true,
    npcs: [
      { id: 'carmine', char: 'carmine', x: 800, anim: 'scared', facingRight: false, label: 'Carmine, il ferroviere', event: 'talk_carmine' },
    ],
    hotspots: [
      { id: 'emergency_radio', x: 290, w: 170, label: 'Radio d\'emergenza [SALVA]', markY: 360, event: 'open_save' },
      { id: 'doc_turni', x: 530, w: 90, label: 'Registro di movimento', icon: 'note', iconY: 440, doc: 'doc_turni' },
      { id: 'control_monitor', x: 965, w: 230, label: 'Mappa della rete', markY: 230,
        text: 'La mappa della rete ferroviaria.\nTutte le linee attorno a Porto Salvo sono rosse.' },
      { id: 'shutter_lever', x: 1220, w: 220, label: 'Leva della serranda', markY: 380, event: 'open_shutter',
        requires: [{ flag: 'carmine_talked' }], failText: 'Un pannello con decine di leve. Meglio chiedere al ferroviere.' },
    ],
    doors: [
      { id: 'control_to_hall', x: 95, w: 140, top: 150, bottom: 665, label: 'Scala — Atrio', target: 'station_hall', noSprite: true },
    ],
  },

  station_exit: {
    name: 'Uscita della stazione', bg: BGV2 + 'station_exit.png', layoutW: 1360, keepEdges: true, scale: 1.12, floorY: 668,
    light: 0.6, map: [4, 0], ambient: 'rain_heavy',
    props: [{ name: 'body_1', x: 1170 }],
    hotspots: [
      { id: 'exit_map', x: 290, w: 190, label: 'Piantina a terra', icon: 'city_map', iconY: 655, give: ['city_map'],
        text: 'Qualcuno ha cerchiato in rosso l\'Ospedale San Rocco, a tre isolati da qui.' },
      { id: 'exit_phone', x: 370, w: 80, label: 'Telefono a gettoni', markY: 330,
        text: 'Il telefono a gettoni. Alzi la cornetta: nessun segnale.\nSolo un respiro, lontano. Riattacchi.' },
      { id: 'police_body', x: 1090, w: 170, label: 'Il poliziotto', markY: 610,
        give: [['ammo_pistol_small', 16]], text: 'Un agente della Polfer. Ha sparato tutti i colpi tranne quelli rimasti in tasca.' },
    ],
    doors: [
      { id: 'exit_to_hall', x: 95, w: 180, top: 235, bottom: 620, label: 'Atrio', target: 'station_hall', noSprite: true },
      { id: 'exit_to_city', x: 550, w: 510, top: 180, bottom: 615, label: 'Via Ferrante', target: 'city_street', noSprite: true },
    ],
    enemies: [
      { id: 'exit_corridore', type: 'corridore', x: 1270, idle: true, facingRight: false },
    ],
  },

  /* ═══════════ CAPITOLO 2 — PORTO SALVO ═══════════ */

  city_street: {
    name: 'Via Ferrante', bg: BGV2 + 'city_street.png', layoutW: 2587, keepEdges: true, scale: 0.85, floorY: 625,
    light: 0.55, map: [0, 2], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_3', x: 1060, flip: true }],
    hotspots: [
      { id: 'car_glovebox', x: 1700, w: 110, label: 'Cinquecento con la portiera aperta', markY: 520,
        give: ['battery', ['ammo_pistol_small', 12]], text: 'Nel cassetto del cruscotto: batterie, un rosario e una scatola di proiettili.' },
    ],
    doors: [
      { id: 'street_to_station', x: 190, w: 120, top: 300, bottom: 555, label: 'Stazione', target: 'station_exit', noSprite: true },
      { id: 'street_to_apartment', x: 640, w: 115, top: 280, bottom: 555, label: 'Palazzo Conti', target: 'apartment', noSprite: true },
      { id: 'street_to_alley', x: 1420, w: 190, top: 270, bottom: 560, label: 'Vicolo — San Rocco', target: 'city_alley', noSprite: true },
      { id: 'street_to_shop', x: 1810, w: 115, top: 355, bottom: 545, label: 'Alimentari da Luigi', target: 'alimentari', noSprite: true },
    ],
    enemies: [
      { id: 'street_c1', type: 'contaminato', x: 950, patrol: [850, 1250] },
      { id: 'street_c2', type: 'ferroviere', x: 2250, patrol: [2100, 2450] },
    ],
  },

  alimentari: {
    name: 'Alimentari da Luigi', bg: BGV2 + 'alimentari.png', layoutW: 1289, keepEdges: true, scale: 1.05, floorY: 640,
    light: 0.6, map: [1, 2],
    props: [{ name: 'body_3', x: 420 }],
    hotspots: [
      { id: 'shop_crowbar', x: 215, w: 110, label: 'Dietro il bancone', icon: 'crowbar', iconY: 480, give: ['crowbar'] },
      { id: 'shop_note', x: 345, w: 150, label: 'Luigi', icon: 'note', iconY: 615, doc: 'doc_luigi',
        text: 'È Luigi. Ha ancora il grembiule. Nella mano, un biglietto.' },
      { id: 'shop_meds', x: 500, w: 100, label: 'Scaffale farmacia', markY: 260, give: ['painkillers'] },
      { id: 'shop_safe', x: 605, w: 85, label: 'Cassaforte sotto la cassa', icon: 'padlock', iconY: 525,
        requires: [{ flag: 'knows_safe_code' }], failText: 'Una cassaforte a combinazione. Quattro cifre.\nNon la conosci.',
        give: ['fuse', 'medikit_small', ['ammo_pistol_small', 16]], text: '1 - 4 - 1 - 0.\nLa cassaforte si apre con uno scatto.' },
      { id: 'shop_batteries', x: 885, w: 260, label: 'Frigoriferi', markY: 380, give: ['battery'],
        text: 'I frigo sono spenti. Tra le bottiglie qualcuno ha nascosto delle batterie.' },
    ],
    doors: [
      { id: 'shop_to_street', x: 20, w: 170, top: 100, bottom: 630, label: 'Via Ferrante', target: 'city_street', noSprite: true },
      { id: 'shop_back', x: 700, w: 115, top: 190, bottom: 555, label: 'Retro', noSprite: true,
        lockedText: 'La porta del retro è inchiodata dall\'interno.', requires: NEVER },
    ],
    enemies: [
      { id: 'shop_crawler', type: 'crawler', x: 950, ceiling: true },
    ],
  },

  apartment: {
    name: 'Palazzo Conti — Int. 4', bg: BGV2 + 'apartment.png', layoutW: 1418, keepEdges: true, scale: 1.32, floorY: 682,
    light: 0.55, map: [2, 2],
    overlays: [{ type: 'monitor', x: 404, y: 474, w: 92, h: 74 }],
    hotspots: [
      { id: 'apt_diary', x: 40, w: 260, label: 'Diario sul divano', icon: 'note', iconY: 520, doc: 'doc_diario_giulia',
        setFlag: { knows_safe_code: true } },
      { id: 'apt_tv', x: 395, w: 155, label: 'Televisore', markY: 450,
        text: 'Solo statico. Poi, per un secondo, una scritta:\n"RESTATE IN CASA. NON APRITE A NESSUNO."' },
      { id: 'apt_key', x: 575, w: 230, label: 'Bancone della cucina', icon: 'key_hospital', iconY: 435, give: ['key_hospital', 'bandage'] },
      { id: 'apt_radio', x: 940, w: 120, label: 'Radio sul tavolo', markY: 440,
        text: [['RADIO', '"...Protezione Civile. La zona rossa comprende tutto il comune di Porto Salvo..."'],
               ['RADIO', '"...all\'alba è prevista un\'operazione di bonifica. Chi è in grado di raggiungere il mare..."'],
               ['', 'Poi solo fruscio.']] },
    ],
    doors: [
      { id: 'apt_to_street', x: 1160, w: 210, top: 170, bottom: 672, label: 'Scale — Via Ferrante', target: 'city_street', noSprite: true },
    ],
    enemies: [
      { id: 'apt_listener', type: 'listener', x: 260, idle: true, facingRight: true },
    ],
  },

  city_alley: {
    name: 'Vicolo dei Pescatori', bg: BGV2 + 'city_alley.png', layoutW: 1388, keepEdges: true, scale: 1.1, floorY: 645,
    light: 0.5, map: [3, 2], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_4', x: 560 }],
    hotspots: [
      { id: 'alley_woman', x: 470, w: 180, label: 'Una donna', markY: 610,
        text: 'Una donna in cappotto. La borsa è ancora a tracolla. Dentro, solo le chiavi di casa.' },
      { id: 'alley_dumpster', x: 780, w: 170, label: 'Cassonetto', markY: 440, give: [['ammo_pistol_small', 16]],
        text: 'Qualcuno ha buttato una scatola di munizioni ancora piena. O l\'ha nascosta.' },
    ],
    doors: [
      { id: 'alley_to_street', x: 110, w: 250, top: 150, bottom: 590, label: 'Via Ferrante', target: 'city_street', noSprite: true },
      { id: 'alley_to_hospital', x: 1075, w: 210, top: 225, bottom: 600, label: 'San Rocco — Ingresso di servizio', target: 'hospital_corridor', noSprite: true,
        keyId: 'crowbar', keepKey: true, lockedText: 'La porta di servizio dell\'ospedale è sbarrata con assi inchiodate.\nServe qualcosa per fare leva.' },
    ],
    enemies: [
      { id: 'alley_crawler', type: 'crawler', x: 680, ceiling: true },
      { id: 'alley_c', type: 'contaminato', x: 900, patrol: [760, 1000] },
    ],
  },

  /* ═══════════ CAPITOLO 3 — OSPEDALE SAN ROCCO ═══════════ */

  hospital_corridor: {
    name: 'San Rocco — Corridoio', bg: BGV2 + 'hospital_corridor.png', layoutW: 2711, keepEdges: true, scale: 1.08, floorY: 655,
    light: 0.55, map: [0, 3], ambient: 'hospital_hum',
    props: [{ name: 'body_2', x: 2170 }],
    hotspots: [
      { id: 'hosp_cart', x: 1040, w: 240, label: 'Carrello medicazioni', icon: 'note', iconY: 455,
        give: ['bandage', ['ammo_pistol_small', 12]], doc: 'doc_cartella' },
    ],
    doors: [
      { id: 'corr_to_alley', x: 385, w: 165, top: 230, bottom: 600, label: 'Vicolo', target: 'city_alley', noSprite: true },
      { id: 'corr_to_ward', x: 770, w: 190, top: 240, bottom: 610, label: 'Degenze', target: 'hospital_ward', noSprite: true,
        keyId: 'key_hospital', lockedText: 'Porta del reparto degenze. Chiusa a chiave.' },
      { id: 'corr_to_morgue', x: 1545, w: 200, top: 270, bottom: 555, label: 'Scale — Obitorio', target: 'hospital_morgue', noSprite: true,
        requires: [{ item: 'shotgun' }], failText: 'Le scale scendono verso l\'obitorio. Da laggiù arrivano dei versi, tanti.\nCon una pistola sola non scendi.' },
      { id: 'corr_to_surgery', x: 2350, w: 290, top: 210, bottom: 650, label: 'Sala operatoria', target: 'hospital_surgery', noSprite: true,
        keyId: 'badge', lockedText: 'Porta chirurgica con lettore di badge. Senza badge non si apre.' },
    ],
    enemies: [
      { id: 'corr_inf1', type: 'infermiere', x: 1250, patrol: [1050, 1450] },
      { id: 'corr_inf2', type: 'infermiere', x: 2050, patrol: [1900, 2250] },
    ],
  },

  hospital_ward: {
    name: 'Degenze — 2° piano', bg: BGV2 + 'hospital_ward.png', layoutW: 2701, keepEdges: true, scale: 1.32, floorY: 685,
    light: 0.5, map: [1, 3],
    props: [{ name: 'body_2', x: 2060, flip: true }],
    hotspots: [
      { id: 'ward_locker', x: 420, w: 180, label: 'Mobiletto della vigilanza', icon: 'shotgun', iconY: 420,
        give: ['shotgun', ['ammo_shells', 16]], text: 'Il fucile della vigilanza. Qualcuno l\'ha lasciato qui con le cartucce.' },
      { id: 'ward_notes', x: 680, w: 210, label: 'Cartellina sul letto', icon: 'note', iconY: 500, doc: 'doc_ricerca_elena' },
      { id: 'ward_bed', x: 1180, w: 240, label: 'Letto', markY: 470,
        text: 'Le cinghie del letto sono state strappate. Non tagliate: strappate.' },
      { id: 'ward_badge', x: 1960, w: 200, label: 'L\'infermiera', icon: 'badge', iconY: 640, give: ['badge'],
        text: 'Sul camice c\'è scritto GIULIA. Il badge è ancora appeso al taschino.' },
    ],
    doors: [
      { id: 'ward_to_corr', x: 110, w: 160, top: 170, bottom: 685, label: 'Corridoio', target: 'hospital_corridor', noSprite: true },
    ],
    enemies: [
      { id: 'ward_listener', type: 'listener', x: 1550, idle: true, facingRight: false },
      { id: 'ward_inf', type: 'infermiere', x: 2400, patrol: [2250, 2600] },
    ],
  },

  hospital_surgery: {
    name: 'Sala operatoria', bg: BGV2 + 'hospital_surgery.png', layoutW: 1451, keepEdges: true, scale: 1.22, floorY: 670,
    light: 0.62, map: [2, 3], safe: true,
    hotspots: [
      { id: 'surg_terminal', x: 270, w: 190, label: 'Terminale [SALVA]', markY: 380, event: 'open_save' },
      { id: 'surg_table', x: 580, w: 420, label: 'Tavolo operatorio', markY: 450,
        text: 'Strumenti sparsi. Un bisturi piegato a metà.' },
      { id: 'surg_protocol', x: 1010, w: 160, label: 'Carrello monitor', icon: 'note', iconY: 420, doc: 'doc_formula' },
      { id: 'surg_fridge', x: 1245, w: 160, label: 'Armadio frigo', icon: 'vial', iconY: 400, give: ['vial'],
        text: 'Ripiano 2. Una sola provetta, etichetta "R-0".\nÈ fredda. La avvolgi in una garza.' },
    ],
    doors: [
      { id: 'surg_to_corr', x: 60, w: 180, top: 150, bottom: 680, label: 'Corridoio', target: 'hospital_corridor', noSprite: true },
    ],
    enemies: [
      { id: 'surg_corridore', type: 'corridore', x: 1150, idle: true, facingRight: false },
    ],
  },

  hospital_morgue: {
    name: 'Obitorio', bg: BGV2 + 'hospital_morgue.png', layoutW: 1360, keepEdges: true, scale: 1.15, floorY: 655,
    light: 0.45, map: [3, 3],
    hotspots: [
      { id: 'morgue_report', x: 260, w: 350, label: 'Tavolo autoptico', icon: 'note', iconY: 430,
        doc: 'doc_autopsia', give: [['ammo_shells', 8]] },
      { id: 'morgue_drawer', x: 745, w: 190, label: 'Celle frigorifere', markY: 420,
        text: 'Una cella è aperta. Vuota. Il lenzuolo è sul pavimento.' },
    ],
    doors: [
      { id: 'morgue_to_corr', x: 55, w: 140, top: 205, bottom: 645, label: 'Scale — Corridoio', target: 'hospital_corridor', noSprite: true },
      { id: 'morgue_to_metro', x: 1135, w: 170, top: 205, bottom: 640, label: 'Passaggio di servizio', target: 'metro_ingresso', noSprite: true },
    ],
    enemies: [
      { id: 'morgue_cr1', type: 'crawler', x: 650, ceiling: true },
      { id: 'morgue_cr2', type: 'crawler', x: 880, patrol: [700, 1050] },
    ],
  },

  /* ═══════════ CAPITOLO 4 — SOTTERRANEI ═══════════ */

  metro_ingresso: {
    name: 'Metro — Ingresso', bg: BGV2 + 'metro_ingresso.png', layoutW: 1592, keepEdges: true, scale: 1.1, floorY: 660,
    light: 0.55, map: [0, 4],
    hotspots: [
      { id: 'metro_notice', x: 305, w: 155, label: 'Avviso', icon: 'note', iconY: 360, doc: 'doc_avviso_metro' },
      { id: 'metro_turnstiles', x: 470, w: 270, label: 'Tornelli', markY: 450,
        text: 'I tornelli sono bloccati in posizione aperta. Qualcuno è passato di corsa, in tanti.' },
      { id: 'metro_tickets', x: 750, w: 225, label: 'Biglietterie', markY: 360,
        text: 'Lo schermo lampeggia ancora:\n"SERVIZIO SOSPESO — ORDINANZA PREFETTIZIA".' },
    ],
    doors: [
      { id: 'mi_to_morgue', x: 60, w: 195, top: 220, bottom: 640, label: 'Uscita riservata — Ospedale', target: 'hospital_morgue', noSprite: true },
      { id: 'mi_to_banchina', x: 1110, w: 330, top: 120, bottom: 600, label: 'Scala mobile — Banchina B', target: 'metro_banchina', noSprite: true },
    ],
    enemies: [
      { id: 'mi_listener', type: 'listener', x: 820, patrol: [650, 1000] },
    ],
  },

  metro_banchina: {
    name: 'Metro — Banchina B', bg: BGV2 + 'metro_banchina.png', layoutW: 3047, keepEdges: true, scale: 0.98, floorY: 665,
    light: 0.5, map: [1, 4],
    props: [{ name: 'body_5', x: 1900 }],
    hotspots: [
      { id: 'mb_train', x: 1380, w: 140, label: 'Carrozze abbandonate', markY: 470,
        give: ['medikit_small', ['ammo_pistol_small', 12]], text: 'Tra i sedili una borsa da infermiera e la fondina di un vigilante.' },
      { id: 'mb_log', x: 1820, w: 170, label: 'Il capotreno', icon: 'note', iconY: 640, doc: 'doc_registro_metro' },
      { id: 'mb_phone', x: 2330, w: 90, label: 'Colonnina SOS [SALVA]', markY: 420, event: 'open_save' },
    ],
    doors: [
      { id: 'mb_to_mi', x: 250, w: 400, top: 150, bottom: 640, label: 'Scala mobile — Ingresso', target: 'metro_ingresso', noSprite: true },
      { id: 'mb_to_tunnel', x: 2600, w: 400, top: 230, bottom: 690, label: 'Tunnel Linea 3', target: 'metro_tunnel', noSprite: true },
    ],
    enemies: [
      { id: 'mb_tec', type: 'tecnico', x: 1100, patrol: [900, 1600] },
      { id: 'mb_run', type: 'corridore', x: 2650, idle: true, facingRight: false },
    ],
  },

  metro_tunnel: {
    name: 'Tunnel Linea 3', bg: BGV2 + 'metro_tunnel.png', layoutW: 2617, keepEdges: true, scale: 0.92, floorY: 600,
    light: 0.3, map: [2, 4],
    props: [{ name: 'body_0', x: 720 }],
    hotspots: [
      { id: 'tunnel_notebook', x: 630, w: 180, label: 'Il soldato', icon: 'note', iconY: 575,
        doc: 'doc_taccuino', give: [['ammo_pistol_small', 16]] },
    ],
    doors: [
      { id: 'tunnel_to_mb', x: 0, w: 150, top: 160, bottom: 600, label: 'Banchina B', target: 'metro_banchina', noSprite: true },
      { id: 'tunnel_to_gen', x: 2350, w: 180, top: 290, bottom: 590, label: 'Porta di servizio — Sala tecnica', target: 'sala_generatori', noSprite: true },
    ],
    enemies: [
      { id: 'tun_cr1', type: 'crawler', x: 1100, ceiling: true },
      { id: 'tun_cr2', type: 'crawler', x: 1750, patrol: [1500, 2000] },
    ],
  },

  sala_generatori: {
    name: 'Sala generatori', bg: BGV2 + 'sala_generatori.png', layoutW: 2732, keepEdges: true, scale: 0.85, floorY: 650,
    light: 0.45, poweredFlag: 'power_on', poweredLight: 0.75, map: [3, 4],
    hotspots: [
      { id: 'generator', x: 520, w: 680, label: 'Generatore di emergenza', markY: 330, event: 'start_generator',
        requires: [{ item: 'fuse' }], failText: 'Il vano del fusibile principale è vuoto.\nSenza un fusibile da 30A non parte.',
        hideIf: { flag: 'power_on' } },
      { id: 'gen_panel', x: 1300, w: 430, label: 'Quadri elettrici', markY: 430,
        text: 'LINEA 3 — LABORATORIO — RIFUGIO. Tutto spento.', hideIf: { flag: 'power_on' } },
      { id: 'gen_manual', x: 1860, w: 140, label: 'Manuale a terra', icon: 'note', iconY: 615, doc: 'doc_manuale' },
    ],
    doors: [
      { id: 'gen_to_tunnel', x: 40, w: 270, top: 280, bottom: 690, label: 'Tunnel', target: 'metro_tunnel', noSprite: true },
      { id: 'gen_to_maint', x: 2140, w: 150, top: 380, bottom: 610, label: 'Officina', target: 'stanza_manutenzione', noSprite: true },
    ],
    enemies: [
      { id: 'gen_tec', type: 'tecnico', x: 1500, patrol: [1300, 1800] },
      { id: 'gen_run', type: 'corridore', x: 2450, facingRight: false, showIf: { flag: 'power_on' } },
    ],
  },

  stanza_manutenzione: {
    name: 'Officina', bg: BGV2 + 'stanza_manutenzione.png', layoutW: 1672, keepEdges: true, scale: 1.26, floorY: 670,
    light: 0.55, map: [4, 4],
    hotspots: [
      { id: 'maint_bench', x: 700, w: 510, label: 'Banco da lavoro', icon: 'note', iconY: 440,
        doc: 'doc_officina', give: [['ammo_shells', 8]] },
      { id: 'maint_locker', x: 1345, w: 110, label: 'Armadietto 7', icon: 'card', iconY: 400, give: ['card'] },
    ],
    doors: [
      { id: 'maint_to_gen', x: 55, w: 145, top: 115, bottom: 680, label: 'Sala generatori', target: 'sala_generatori', noSprite: true },
      { id: 'maint_to_safe', x: 320, w: 300, top: 130, bottom: 600, label: 'Porta blindata — Rifugio', target: 'safe_room', noSprite: true,
        requires: [{ flag: 'power_on' }], failText: 'Porta blindata a comando elettrico. Senza corrente non si apre.' },
    ],
    enemies: [
      { id: 'maint_listener', type: 'listener', x: 1100, idle: true, facingRight: false },
    ],
  },

  safe_room: {
    name: 'Il rifugio di Elena', bg: BGV2 + 'safe_room.png', layoutW: 1303, keepEdges: true, scale: 1.3, floorY: 680,
    light: 0.85, map: [5, 4], safe: true,
    hotspots: [
      { id: 'safe_shelf', x: 265, w: 270, label: 'Scaffale', markY: 400,
        give: ['medikit_small', ['ammo_shells', 8], ['ammo_pistol_small', 16]] },
      { id: 'safe_radio', x: 640, w: 120, label: 'Radio di Elena [SALVA]', markY: 400, event: 'open_save' },
      { id: 'safe_recorder', x: 780, w: 130, label: 'Registratore sulla scrivania', icon: 'recorder', iconY: 370, event: 'elena_tape_2' },
    ],
    doors: [
      { id: 'safe_to_maint', x: 45, w: 160, top: 110, bottom: 690, label: 'Officina', target: 'stanza_manutenzione', noSprite: true },
      { id: 'safe_to_lab', x: 1170, w: 120, top: 185, bottom: 680, label: 'Laboratorio', target: 'lab_ingresso', noSprite: true,
        keyId: 'card', lockedText: 'La porta del laboratorio. Lettore di tessere: "LIVELLO 3".' },
    ],
  },

  /* ═══════════ CAPITOLO 5 — LABORATORIO ROSSO ═══════════ */

  lab_ingresso: {
    name: 'Laboratorio — Ingresso', bg: BGV2 + 'lab_ingresso.png', layoutW: 1559, keepEdges: true, scale: 1.15, floorY: 640,
    light: 0.6, map: [0, 5],
    hotspots: [
      { id: 'lab_papers', x: 1150, w: 260, label: 'Fogli a terra', markY: 600,
        text: 'Moduli di evacuazione. Tutti firmati "Dir. Amati". Nessuno compilato.' },
    ],
    doors: [
      { id: 'li_to_safe', x: 110, w: 205, top: 200, bottom: 595, label: 'Rifugio', target: 'safe_room', noSprite: true },
      { id: 'li_to_corr', x: 665, w: 375, top: 210, bottom: 595, label: 'Progetto Rosso — Porta a doppia anta', target: 'lab_corridoio', noSprite: true },
    ],
    enemies: [
      { id: 'li_tec', type: 'tecnico', x: 1350, patrol: [1200, 1500] },
    ],
  },

  lab_corridoio: {
    name: 'Laboratorio — Corridoio', bg: BGV2 + 'lab_corridoio.png', layoutW: 2587, keepEdges: true, scale: 1.15, floorY: 640,
    light: 0.6, map: [1, 5],
    hotspots: [
      { id: 'lc_log', x: 335, w: 60, label: 'Registro accessi', icon: 'note', iconY: 390, doc: 'doc_accessi' },
      { id: 'lc_bench', x: 1390, w: 370, label: 'Bancone', markY: 400, give: ['painkillers', ['ammo_shells', 6], ['ammo_pistol_small', 12]] },
    ],
    doors: [
      { id: 'lc_to_li', x: 110, w: 215, top: 200, bottom: 595, label: 'Ingresso', target: 'lab_ingresso', noSprite: true },
      { id: 'lc_to_bio', x: 1115, w: 215, top: 200, bottom: 595, label: 'Laboratorio biologico', target: 'lab_biologico', noSprite: true },
      { id: 'lc_to_server', x: 2345, w: 215, top: 195, bottom: 595, label: 'Sala server', target: 'sala_server', noSprite: true },
    ],
    enemies: [
      { id: 'lc_inf', type: 'infermiere', x: 700, patrol: [500, 950] },
      { id: 'lc_run', type: 'corridore', x: 2100, idle: true, facingRight: false },
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
      { id: 'bio_to_corr', x: 560, w: 160, top: 230, bottom: 470, label: 'Corridoio', target: 'lab_corridoio', noSprite: true },
    ],
    enemies: [
      { id: 'bio_cr', type: 'crawler', x: 860, ceiling: true },
      { id: 'bio_c', type: 'contaminato', x: 1050, patrol: [950, 1180] },
    ],
  },

  sala_server: {
    name: 'Sala server', bg: BGV2 + 'sala_server.png', layoutW: 1341, keepEdges: true, scale: 1.05, floorY: 640,
    light: 0.55, map: [3, 5],
    overlays: [{ type: 'monitor', x: 920, y: 316, w: 105, h: 74 }],
    hotspots: [
      { id: 'server_doc', x: 370, w: 140, label: 'Stampa sul pavimento', icon: 'note', iconY: 625, doc: 'doc_classificato' },
      { id: 'server_upload', x: 895, w: 160, label: 'Terminale di trasmissione', markY: 300, event: 'upload_data',
        requires: [{ item: 'usb' }], failText: 'Il terminale chiede un supporto con i dati da trasmettere.',
        hideIf: { flag: 'data_sent' } },
    ],
    doors: [
      { id: 'server_to_lc', x: 55, w: 135, top: 190, bottom: 660, label: 'Corridoio', target: 'lab_corridoio', noSprite: true },
      { id: 'server_to_core', x: 610, w: 225, top: 255, bottom: 580, label: 'Camera centrale', target: 'camera_centrale', noSprite: true,
        requires: [{ flag: 'data_sent' }], failText: 'Porta stagna. Sul display: "APERTURA SOLO DA TERMINALE".' },
    ],
    enemies: [
      { id: 'server_listener', type: 'listener', x: 1150, patrol: [1000, 1300] },
    ],
  },

  camera_centrale: {
    name: 'Camera centrale', bg: BGV2 + 'camera_centrale.png', layoutW: 1418, keepEdges: true, scale: 0.98, floorY: 650,
    light: 0.62, map: [4, 5],
    npcs: [
      { id: 'elena', char: 'elena', x: 930, anim: 'idle', facingRight: false, label: 'Elena', event: 'talk_elena', hideIf: { flag: 'elena_gone' } },
    ],
    hotspots: [
      { id: 'core_tank', x: 610, w: 200, label: 'La vasca', markY: 330,
        text: 'Un cilindro pieno di liquido rosso. Dentro, qualcosa si muove ancora.' },
      { id: 'core_letter', x: 870, w: 120, label: 'Una lettera e una chiave', icon: 'note', iconY: 630, doc: 'doc_lettera_elena',
        give: ['key_rusty'], showIf: { flag: 'elena_gone' } },
    ],
    doors: [
      { id: 'core_to_server', x: 85, w: 125, top: 300, bottom: 620, label: 'Sala server', target: 'sala_server', noSprite: true,
        requires: [{ notFlag: 'core_alarm' }], failText: 'La porta stagna si è sigillata alle tue spalle.' },
      { id: 'core_to_port', x: 1175, w: 175, top: 285, bottom: 610, label: 'Galleria verso il porto', target: 'porto', noSprite: true,
        requires: [{ flag: 'elena_talked' }], failText: 'Il portellone è aperto, ma oltre c\'è una griglia chiusa. Elena ha il comando.' },
    ],
    enemies: [
      { id: 'core_run1', type: 'corridore', x: 260, facingRight: true, showIf: { flag: 'core_alarm' } },
      { id: 'core_run2', type: 'contaminato', x: 380, facingRight: true, showIf: { flag: 'core_alarm' } },
    ],
  },

  /* ═══════════ CAPITOLO 6 — IL PORTO ═══════════ */

  porto: {
    name: 'Porto commerciale', bg: BGV2 + 'porto.png', layoutW: 2261, keepEdges: true, scale: 0.78, floorY: 630,
    light: 0.55, map: [0, 6], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_5', x: 1200 }],
    hotspots: [
      { id: 'port_container', x: 840, w: 160, label: 'Container aperto', markY: 330,
        give: [['ammo_shells', 8], 'medikit_small'] },
    ],
    doors: [
      { id: 'port_to_core', x: 100, w: 280, top: 280, bottom: 600, label: 'Galleria', target: 'camera_centrale', noSprite: true,
        requires: NEVER, failText: 'La galleria è crollata dietro di te.' },
      { id: 'port_to_pier', x: 2080, w: 160, top: 380, bottom: 630, label: 'Molo 4', target: 'molo_finale', noSprite: true },
    ],
    enemies: [
      { id: 'port_c1', type: 'tecnico', x: 650, patrol: [500, 900] },
      { id: 'port_c2', type: 'contaminato', x: 1350, patrol: [1150, 1550] },
      { id: 'port_run', type: 'corridore', x: 1800, facingRight: false },
    ],
  },

  molo_finale: {
    name: 'Molo 4', bg: BGV2 + 'molo_finale.png', layoutW: 1289, keepEdges: true, scale: 1.05, floorY: 650,
    light: 0.55, map: [1, 6], ambient: 'rain_heavy', rain: true,
    hotspots: [
      { id: 'the_boat', x: 90, w: 520, label: 'Bitta — il gozzo di papà', markY: 430, event: 'ending',
        requires: [{ item: 'key_rusty' }], failText: 'Alla bitta è legato il gozzo di papà, con una catena e un lucchetto.' },
    ],
    doors: [
      { id: 'pier_to_port', x: 1180, w: 109, top: 300, bottom: 640, label: 'Porto', target: 'porto', noSprite: true },
    ],
    enemies: [
      { id: 'pier_l', type: 'listener', x: 900, idle: true, facingRight: false },
    ],
  },
};
