/* =============================================
   NOTTE ROSSA — rooms.js
   Ogni stanza è UNA schermata 1280×720 con il suo sfondo.

   hotspots: { id, x, w, label, markY, icon, iconY,
               give:[id | [id,qty]], doc, text, requires:[cond], failText,
               consume, setFlag:{}, event, once, showIf, hideIf }
   doors:    { id, x, w | edge:'left'|'right', label, target, targetX,
               keyId, lockedText, requires:[cond], failText }
   npcs:     { id, char, x, anim, facingRight, label, event, showIf, hideIf }
   props:    { name, x, flip }
   enemies:  { id, type, x, patrol, ceiling, idle, facingRight, showIf, hideIf }
   cond:     { flag } | { notFlag } | { item }
   ============================================= */

import { SpriteLib } from './sprites.js';
import { SCENE } from './scene_manifest.js';

export const ROOM_W = 1280;
export const ROOM_H = 720;
const FLOOR = 662;
const L = 60;            // arrivo sul lato sinistro
const R = 1150;          // arrivo sul lato destro
const BG  = 'assets/backgrounds/';
const BGP = 'assets/backgrounds/provvisori/';

export const ROOMS = {

  /* ═══════════ CAPITOLO 1 — STAZIONE CENTRALE ═══════════ */

  train_wagon: {
    name: 'Treno 847 — Vagone 4', chapter: 'Stazione', bg: BG + 'train_wagon.png',
    light: 0.5, map: [0, 0], ambient: 'train_idle',
    hotspots: [
      { id: 'window_wagon', x: 40, w: 200, label: 'Guarda dal finestrino', markY: 330,
        text: 'Pioggia. Il binario 1 di Porto Salvo è deserto.\nNessun capotreno, nessun annuncio.' },
      { id: 'seat_protagonist', x: 300, w: 220, label: 'Il tuo posto', markY: 520,
        text: 'La tua borsa è ancora qui. Il telefono non ha campo da Porto Salvo Vecchia.' },
      { id: 'document_ticket', x: 600, w: 110, label: 'Biglietto a terra', icon: 'note', iconY: 640,
        doc: 'doc_ticket' },
    ],
    doors: [
      { id: 'wagon_left', edge: 'left', label: 'Vagone 3', lockedText: 'La porta verso il vagone 3 è bloccata.\nDall\'altra parte qualcosa sta grattando.', requires: [{ flag: 'never' }] },
      { id: 'wagon_to_platform', edge: 'right', label: 'Scendi dal treno', target: 'station_platform', targetX: L },
    ],
    spawnX: 380,
  },

  station_platform: {
    name: 'Binario 1', chapter: 'Stazione', bg: BG + 'station_platform.png',
    light: 0.55, darkFlag: 'lights_out', darkLight: 0.28, map: [1, 0], ambient: 'station_ambient',
    props: [{ name: 'body_0', x: 520 }],
    hotspots: [
      { id: 'body_conductor', x: 430, w: 180, label: 'Il capotreno', markY: 610,
        text: 'Il capotreno. Ha la gola aperta.\nIl fischietto è ancora stretto nella mano.' },
      { id: 'platform_sign', x: 700, w: 160, label: 'Tabellone', markY: 260,
        text: '22:47 — CIRCOLAZIONE SOSPESA\nPer informazioni rivolgersi al personale.' },
      { id: 'public_phone', x: 1030, w: 140, label: 'Telefono pubblico', markY: 470, event: 'phone_answer',
        showIf: { flag: 'phone_ringing' } },
    ],
    doors: [
      { id: 'platform_to_wagon', edge: 'left', label: 'Treno 847', target: 'train_wagon', targetX: R },
      { id: 'platform_to_hall', edge: 'right', label: 'Atrio', target: 'station_hall', targetX: L,
        requires: [{ notFlag: 'phone_ringing' }], failText: 'Il telefono continua a squillare. Sembra che stia chiamando te.' },
    ],
    enemies: [
      { id: 'platform_ferroviere', type: 'ferroviere', x: 90, facingRight: true, showIf: { flag: 'intro_complete' } },
    ],
    spawnX: L,
  },

  station_hall: {
    name: 'Atrio', chapter: 'Stazione', bg: BG + 'station_hall.png',
    light: 0.55, map: [2, 0], ambient: 'station_ambient',
    hotspots: [
      { id: 'ticket_booth', x: 320, w: 130, label: 'Biglietteria', markY: 480,
        text: 'La biglietteria è chiusa. Il cassetto dei soldi è aperto e pieno.\nChi scappa non pensa ai soldi.' },
      { id: 'notice_board', x: 470, w: 120, label: 'Avviso affisso', icon: 'note', iconY: 470, doc: 'doc_ordinanza' },
      { id: 'locker_flashlight', x: 600, w: 110, label: 'Armadietto del personale', markY: 520,
        give: ['flashlight', 'battery'], event: 'got_flashlight' },
    ],
    doors: [
      { id: 'hall_to_platform', edge: 'left', label: 'Binario 1', target: 'station_platform', targetX: R },
      { id: 'hall_to_storage', x: 175, w: 130, label: 'Porta DEPOSITO', target: 'station_storage', targetX: L + 40 },
      { id: 'hall_to_control', x: 730, w: 130, label: 'Scala mobile — Sala controllo', target: 'station_control', targetX: L,
        keyId: 'key_station', lockedText: 'In cima alla scala mobile c\'è una porta blindata.\n"SALA CONTROLLO — solo personale". Serve la chiave.' },
      { id: 'hall_to_exit', edge: 'right', label: 'Uscita', target: 'station_exit', targetX: L,
        requires: [{ flag: 'shutter_open' }], failText: 'La serranda dell\'uscita è abbassata.\nSi comanda dalla sala controllo.' },
    ],
    enemies: [
      { id: 'hall_contaminato', type: 'contaminato', x: 950, patrol: [800, 1150], showIf: { flag: 'has_pistol' } },
    ],
    spawnX: L,
  },

  station_storage: {
    name: 'Deposito', chapter: 'Stazione', bg: BG + 'station_storage.png',
    light: 0.38, map: [2, 1], ambient: 'room_hum',
    props: [{ name: 'body_6', x: 900, flip: true }],
    hotspots: [
      { id: 'document_note_storage', x: 180, w: 100, label: 'Foglio sulla porta', icon: 'note', iconY: 430, doc: 'doc_storage_note' },
      { id: 'shelf_pistol', x: 330, w: 140, label: 'Armadio B3', icon: 'pistol', iconY: 520,
        give: ['pistol', ['ammo_pistol_small', 16]], event: 'got_pistol' },
      { id: 'crate_key', x: 560, w: 120, label: 'Cassetta rossa', icon: 'key_station', iconY: 600,
        give: ['key_station'] },
      { id: 'guard_body', x: 820, w: 170, label: 'La guardia', markY: 610,
        give: ['bandage'], text: 'Una guardia giurata. Nella tasca: delle bende.' },
      { id: 'cart_storage', x: 1080, w: 120, label: 'Carrello delle pulizie', markY: 560,
        text: 'Il carrello è rovesciato. Sul pavimento, impronte scalze che vanno verso il buio.' },
    ],
    doors: [
      { id: 'storage_to_hall', edge: 'left', label: 'Atrio', target: 'station_hall', targetX: 200 },
      { id: 'storage_dark', edge: 'right', label: 'Corridoio buio', lockedText: 'Il corridoio finisce contro un muro di casse.', requires: [{ flag: 'never' }] },
    ],
    spawnX: L + 40,
  },

  station_control: {
    name: 'Sala Controllo', chapter: 'Stazione', bg: BG + 'station_control.png',
    light: 0.7, map: [3, 0], ambient: 'electronics_hum', safe: true,
    npcs: [
      { id: 'carmine', char: 'carmine', x: 360, anim: 'scared', facingRight: true, label: 'Il ferroviere', event: 'talk_carmine' },
    ],
    hotspots: [
      { id: 'doc_turni', x: 90, w: 140, label: 'Registro di movimento', icon: 'note', iconY: 560, doc: 'doc_turni' },
      { id: 'emergency_radio', x: 560, w: 120, label: 'Radio d\'emergenza [SALVA]', icon: 'radio', iconY: 520, event: 'open_save' },
      { id: 'control_monitor', x: 720, w: 150, label: 'Monitor', markY: 470,
        text: 'La mappa della rete ferroviaria.\nTutte le linee attorno a Porto Salvo sono rosse.' },
      { id: 'shutter_lever', x: 1030, w: 150, label: 'Comando serranda', markY: 470, event: 'open_shutter',
        requires: [{ flag: 'carmine_talked' }], failText: 'Un pannello con decine di leve. Meglio chiedere al ferroviere.' },
    ],
    doors: [
      { id: 'control_to_hall', edge: 'left', label: 'Atrio', target: 'station_hall', targetX: 760 },
    ],
    spawnX: L,
  },

  station_exit: {
    name: 'Uscita della stazione', chapter: 'Stazione', bg: BG + 'station_exit.png',
    light: 0.55, map: [4, 0], ambient: 'rain_heavy',
    props: [{ name: 'body_1', x: 980 }],
    hotspots: [
      { id: 'exit_map', x: 240, w: 110, label: 'Piantina a terra', icon: 'city_map', iconY: 630, give: ['city_map'],
        text: 'Qualcuno ha cerchiato in rosso l\'Ospedale San Rocco, a tre isolati da qui.' },
      { id: 'police_body', x: 900, w: 170, label: 'Il poliziotto', markY: 610,
        give: [['ammo_pistol_small', 8]], text: 'Un agente della Polfer. Ha sparato tutti i colpi tranne quelli rimasti in tasca.' },
    ],
    doors: [
      { id: 'exit_to_hall', edge: 'left', label: 'Atrio', target: 'station_hall', targetX: R },
      { id: 'exit_to_city', x: 520, w: 240, label: 'Porte a vetri — Porto Salvo', target: 'city_street', targetX: L },
    ],
    enemies: [
      { id: 'exit_corridore', type: 'corridore', x: 1050, idle: true, facingRight: false },
    ],
    spawnX: L,
  },

  /* ═══════════ CAPITOLO 2 — PORTO SALVO ═══════════ */

  city_street: {
    name: 'Via Ferrante', chapter: 'Città', bg: BG + 'city_street.png',
    light: 0.5, map: [0, 1], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_3', x: 760, flip: true }],
    hotspots: [
      { id: 'car_glovebox', x: 360, w: 200, label: 'Auto con la portiera aperta', markY: 560,
        give: ['battery'], text: 'Nel cassetto del cruscotto: batterie e un rosario.' },
    ],
    doors: [
      { id: 'street_to_station', edge: 'left', label: 'Stazione', target: 'station_exit', targetX: 560 },
      { id: 'street_to_apartment', x: 150, w: 130, label: 'Portone — Palazzo Conti', target: 'apartment', targetX: L },
      { id: 'street_to_alley', x: 590, w: 120, label: 'Vicolo verso il San Rocco', target: 'city_alley', targetX: L },
      { id: 'street_to_shop', x: 1040, w: 140, label: 'Alimentari da Luigi', target: 'alimentari', targetX: L },
    ],
    enemies: [
      { id: 'street_c1', type: 'contaminato', x: 420, patrol: [300, 700] },
      { id: 'street_c2', type: 'ferroviere', x: 900, patrol: [800, 1150] },
    ],
    spawnX: L,
  },

  alimentari: {
    name: 'Alimentari da Luigi', chapter: 'Città', bg: BG + 'alimentari.png',
    light: 0.55, map: [1, 1],
    props: [{ name: 'body_3', x: 720 }],
    hotspots: [
      { id: 'shop_meds', x: 300, w: 160, label: 'Scaffale farmacia', markY: 470, give: ['painkillers'] },
      { id: 'shop_note', x: 640, w: 150, label: 'Luigi', icon: 'note', iconY: 600, doc: 'doc_luigi',
        text: 'È Luigi. Ha ancora il grembiule. Nella mano, un biglietto.' },
      { id: 'shop_crowbar', x: 540, w: 90, label: 'Dietro il bancone', icon: 'crowbar', iconY: 610, give: ['crowbar'] },
      { id: 'shop_batteries', x: 880, w: 120, label: 'Frigorifero', markY: 450, give: ['battery'],
        text: 'Il frigo è spento. Tra le bottiglie qualcuno ha nascosto delle batterie.' },
      { id: 'shop_safe', x: 1080, w: 150, label: 'Cassaforte', icon: 'padlock', iconY: 540,
        requires: [{ flag: 'knows_safe_code' }], failText: 'Una cassaforte a combinazione. Quattro cifre.\nNon la conosci.',
        give: ['fuse', 'medikit_small', ['ammo_pistol_small', 8]], text: '1 - 4 - 1 - 0.\nLa cassaforte si apre con uno scatto.' },
    ],
    doors: [
      { id: 'shop_to_street', edge: 'left', label: 'Via Ferrante', target: 'city_street', targetX: 1080 },
    ],
    enemies: [
      { id: 'shop_crawler', type: 'crawler', x: 820, ceiling: true },
    ],
    spawnX: L,
  },

  apartment: {
    name: 'Palazzo Conti — Int. 4', chapter: 'Città', bg: BG + 'apartment.png',
    light: 0.5, map: [2, 1],
    hotspots: [
      { id: 'apt_tv', x: 420, w: 140, label: 'Televisore', markY: 400,
        text: 'Solo statico. Poi, per un secondo, una scritta:\n"RESTATE IN CASA. NON APRITE A NESSUNO."' },
      { id: 'apt_diary', x: 600, w: 110, label: 'Diario sul divano', icon: 'note', iconY: 560, doc: 'doc_diario_giulia',
        setFlag: { knows_safe_code: true } },
      { id: 'apt_radio', x: 800, w: 160, label: 'Radio', icon: 'radio', iconY: 520,
        text: [['RADIO', '"...Protezione Civile. La zona rossa comprende tutto il comune di Porto Salvo..."'],
               ['RADIO', '"...all\'alba è prevista un\'operazione di bonifica. Chi è in grado di raggiungere il mare..."'],
               ['', 'Poi solo fruscio.']] },
      { id: 'apt_key', x: 1000, w: 120, label: 'Mensola della cucina', icon: 'key_hospital', iconY: 450, give: ['key_hospital', 'bandage'] },
    ],
    doors: [
      { id: 'apt_to_street', edge: 'left', label: 'Via Ferrante', target: 'city_street', targetX: 180 },
      { id: 'apt_exit', x: 1150, w: 100, label: 'Uscita di sicurezza', lockedText: 'L\'uscita di sicurezza dà su un cortile murato. Non porta da nessuna parte.', requires: [{ flag: 'never' }] },
    ],
    enemies: [
      { id: 'apt_listener', type: 'listener', x: 780, idle: true, facingRight: false },
    ],
    spawnX: L,
  },

  city_alley: {
    name: 'Vicolo dei Pescatori', chapter: 'Città', bg: BG + 'city_alley.png',
    light: 0.42, map: [3, 1], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_4', x: 330 }],
    hotspots: [
      { id: 'alley_woman', x: 240, w: 180, label: 'Una donna', markY: 610,
        text: 'Una donna in cappotto. La borsa è ancora a tracolla. Dentro, solo le chiavi di casa.' },
      { id: 'alley_dumpster', x: 1020, w: 160, label: 'Cassonetto', markY: 560, give: [['ammo_pistol_small', 8]],
        text: 'Qualcuno ha buttato una scatola di munizioni ancora piena. O l\'ha nascosta.' },
    ],
    doors: [
      { id: 'alley_to_street', edge: 'left', label: 'Via Ferrante', target: 'city_street', targetX: 640 },
      { id: 'alley_to_hospital', x: 580, w: 140, label: 'Ingresso di servizio — San Rocco', target: 'hospital_corridor', targetX: L,
        keyId: 'crowbar', keepKey: true, lockedText: 'La porta di servizio dell\'ospedale è sbarrata con assi inchiodate.\nServe qualcosa per fare leva.' },
    ],
    enemies: [
      { id: 'alley_crawler', type: 'crawler', x: 820, ceiling: true },
      { id: 'alley_c', type: 'contaminato', x: 1050, patrol: [900, 1180] },
    ],
    spawnX: L,
  },

  /* ═══════════ CAPITOLO 3 — OSPEDALE SAN ROCCO ═══════════ */

  hospital_corridor: {
    name: 'San Rocco — Corridoio', chapter: 'Ospedale', bg: BG + 'hospital_corridor.png',
    light: 0.5, map: [0, 2], ambient: 'hospital_hum',
    props: [{ name: 'body_2', x: 820 }],
    hotspots: [
      { id: 'hosp_cart', x: 330, w: 140, label: 'Carrello medicazioni', icon: 'note', iconY: 560,
        give: ['bandage'], doc: 'doc_cartella' },
    ],
    doors: [
      { id: 'corr_to_alley', edge: 'left', label: 'Vicolo', target: 'city_alley', targetX: 640 },
      { id: 'corr_to_ward', x: 240, w: 120, label: 'Degenze', target: 'hospital_ward', targetX: L,
        keyId: 'key_hospital', lockedText: 'Porta del reparto degenze. Chiusa a chiave.' },
      { id: 'corr_to_morgue', x: 590, w: 120, label: 'Scale — Obitorio (-1)', target: 'hospital_morgue', targetX: L,
        requires: [{ item: 'shotgun' }], failText: 'Le scale scendono verso l\'obitorio. Da laggiù arrivano dei versi, tanti.\nCon una pistola sola non scendi.' },
      { id: 'corr_to_surgery', x: 1080, w: 140, label: 'Sala operatoria', target: 'hospital_surgery', targetX: L,
        keyId: 'badge', lockedText: 'Porta chirurgica con lettore di badge. La spia è rossa.' },
    ],
    enemies: [
      { id: 'corr_inf1', type: 'infermiere', x: 480, patrol: [400, 700] },
      { id: 'corr_inf2', type: 'infermiere', x: 960, patrol: [880, 1150] },
    ],
    spawnX: L,
  },

  hospital_ward: {
    name: 'Degenze — 2° piano', chapter: 'Ospedale', bg: BG + 'hospital_ward.png',
    light: 0.45, map: [1, 2],
    props: [{ name: 'body_2', x: 1010, flip: true }],
    hotspots: [
      { id: 'ward_locker', x: 250, w: 140, label: 'Armadietto della vigilanza', icon: 'shotgun', iconY: 520,
        give: ['shotgun', ['ammo_shells', 8]], text: 'Il fucile della vigilanza. Qualcuno l\'ha lasciato qui con le cartucce.' },
      { id: 'ward_bed', x: 740, w: 220, label: 'Letto', markY: 560,
        text: 'Le cinghie del letto sono state strappate. Non tagliate: strappate.' },
      { id: 'ward_notes', x: 330, w: 130, label: 'Cartellina', icon: 'note', iconY: 560, doc: 'doc_ricerca_elena' },
      { id: 'ward_badge', x: 950, w: 140, label: 'L\'infermiera', icon: 'badge', iconY: 620, give: ['badge'],
        text: 'Sul camice c\'è scritto GIULIA. Il badge è ancora appeso al taschino.' },
    ],
    doors: [
      { id: 'ward_to_corr', edge: 'left', label: 'Corridoio', target: 'hospital_corridor', targetX: 265 },
    ],
    enemies: [
      { id: 'ward_listener', type: 'listener', x: 620, idle: true, facingRight: true },
      { id: 'ward_inf', type: 'infermiere', x: 1120, patrol: [1000, 1180] },
    ],
    spawnX: L,
  },

  hospital_surgery: {
    name: 'Sala operatoria', chapter: 'Ospedale', bg: BG + 'hospital_surgery.png',
    light: 0.6, map: [2, 2], safe: true,
    hotspots: [
      { id: 'surg_table', x: 380, w: 340, label: 'Tavolo operatorio', markY: 520,
        text: 'Strumenti sparsi. Un bisturi piegato a metà.' },
      { id: 'surg_protocol', x: 140, w: 130, label: 'Protocollo', icon: 'note', iconY: 520, doc: 'doc_formula' },
      { id: 'surg_fridge', x: 780, w: 120, label: 'Frigo campioni', icon: 'vial', iconY: 470, give: ['vial'],
        text: 'Ripiano 2. Una sola provetta, etichetta "R-0".\nÈ fredda. La avvolgi in una garza.' },
      { id: 'surg_terminal', x: 960, w: 130, label: 'Terminale [SALVA]', markY: 450, event: 'open_save' },
    ],
    doors: [
      { id: 'surg_to_corr', edge: 'left', label: 'Corridoio', target: 'hospital_corridor', targetX: 1120 },
    ],
    enemies: [
      { id: 'surg_corridore', type: 'corridore', x: 1100, idle: true, facingRight: false },
    ],
    spawnX: L,
  },

  hospital_morgue: {
    name: 'Obitorio', chapter: 'Ospedale', bg: BG + 'hospital_morgue.png',
    light: 0.35, map: [3, 2],
    props: [{ name: 'body_7', x: 620 }],
    hotspots: [
      { id: 'morgue_drawer', x: 120, w: 200, label: 'Cella frigorifera 3', markY: 460,
        text: 'La cella è aperta. Vuota. Il lenzuolo è sul pavimento.' },
      { id: 'morgue_report', x: 520, w: 200, label: 'Tavolo autoptico', icon: 'note', iconY: 540,
        doc: 'doc_autopsia', give: [['ammo_shells', 4]] },
    ],
    doors: [
      { id: 'morgue_to_corr', edge: 'left', label: 'Corridoio', target: 'hospital_corridor', targetX: 640 },
      { id: 'morgue_to_metro', x: 1100, w: 140, label: 'Passaggio di servizio — Metro', target: 'metro_ingresso', targetX: L },
    ],
    enemies: [
      { id: 'morgue_cr1', type: 'crawler', x: 420, ceiling: true },
      { id: 'morgue_cr2', type: 'crawler', x: 900, patrol: [760, 1050] },
    ],
    spawnX: L,
  },

  /* ═══════════ CAPITOLO 4 — SOTTERRANEI ═══════════ */

  metro_ingresso: {
    name: 'Metro — Ingresso', chapter: 'Sotterranei', bg: BG + 'metro_ingresso.png',
    light: 0.45, map: [0, 3],
    hotspots: [
      { id: 'metro_turnstiles', x: 200, w: 260, label: 'Tornelli', markY: 520,
        text: 'I tornelli sono bloccati in posizione aperta. Qualcuno è passato di corsa, in tanti.' },
      { id: 'metro_notice', x: 520, w: 100, label: 'Avviso', icon: 'note', iconY: 480, doc: 'doc_avviso_metro' },
    ],
    doors: [
      { id: 'mi_to_morgue', edge: 'left', label: 'Obitorio', target: 'hospital_morgue', targetX: 1110 },
      { id: 'mi_to_banchina', x: 820, w: 300, label: 'Scala mobile — Banchina B', target: 'metro_banchina', targetX: L },
    ],
    enemies: [
      { id: 'mi_listener', type: 'listener', x: 700, patrol: [600, 1100] },
    ],
    spawnX: L,
  },

  metro_banchina: {
    name: 'Metro — Banchina B', chapter: 'Sotterranei', bg: BG + 'metro_banchina.png',
    light: 0.42, map: [1, 3],
    props: [{ name: 'body_5', x: 860 }],
    hotspots: [
      { id: 'mb_train', x: 120, w: 280, label: 'Carrozze abbandonate', markY: 420,
        give: ['medikit_small'], text: 'Tra i sedili una borsa da infermiera. Dentro, un kit medico.' },
      { id: 'mb_phone', x: 560, w: 120, label: 'Colonnina SOS [SALVA]', markY: 470, event: 'open_save' },
      { id: 'mb_log', x: 780, w: 180, label: 'Il capotreno', icon: 'note', iconY: 610, doc: 'doc_registro_metro' },
    ],
    doors: [
      { id: 'mb_to_mi', edge: 'left', label: 'Ingresso metro', target: 'metro_ingresso', targetX: 900 },
      { id: 'mb_to_tunnel', edge: 'right', label: 'Tunnel Linea 3', target: 'metro_tunnel', targetX: L },
    ],
    enemies: [
      { id: 'mb_tec', type: 'tecnico', x: 420, patrol: [300, 700] },
      { id: 'mb_run', type: 'corridore', x: 1120, idle: true, facingRight: false },
    ],
    spawnX: L,
  },

  metro_tunnel: {
    name: 'Tunnel Linea 3', chapter: 'Sotterranei', bg: BG + 'metro_tunnel.png',
    light: 0.22, map: [2, 3],
    props: [{ name: 'body_6', x: 470 }],
    hotspots: [
      { id: 'tunnel_notebook', x: 380, w: 190, label: 'Il soldato', icon: 'note', iconY: 620,
        doc: 'doc_taccuino', give: [['ammo_pistol_small', 8]] },
    ],
    doors: [
      { id: 'tunnel_to_mb', edge: 'left', label: 'Banchina B', target: 'metro_banchina', targetX: R },
      { id: 'tunnel_to_gen', edge: 'right', label: 'Sala tecnica', target: 'sala_generatori', targetX: L },
    ],
    enemies: [
      { id: 'tun_cr1', type: 'crawler', x: 700, ceiling: true },
      { id: 'tun_cr2', type: 'crawler', x: 1050, patrol: [900, 1150] },
    ],
    spawnX: L,
  },

  sala_generatori: {
    name: 'Sala generatori', chapter: 'Sotterranei', bg: BG + 'sala_generatori.png',
    light: 0.45, poweredFlag: 'power_on', poweredLight: 0.75, map: [3, 3],
    hotspots: [
      { id: 'gen_manual', x: 160, w: 120, label: 'Manuale', icon: 'note', iconY: 600, doc: 'doc_manuale' },
      { id: 'generator', x: 380, w: 280, label: 'Generatore di emergenza', markY: 500, event: 'start_generator',
        requires: [{ item: 'fuse' }], failText: 'Il vano del fusibile principale è vuoto.\nSenza un fusibile da 30A non parte.',
        hideIf: { flag: 'power_on' } },
      { id: 'gen_panel', x: 1000, w: 180, label: 'Quadri elettrici', markY: 480,
        text: 'LINEA 3 — LABORATORIO — RIFUGIO. Tutto spento.', hideIf: { flag: 'power_on' } },
    ],
    doors: [
      { id: 'gen_to_tunnel', edge: 'left', label: 'Tunnel', target: 'metro_tunnel', targetX: R },
      { id: 'gen_to_maint', edge: 'right', label: 'Officina', target: 'stanza_manutenzione', targetX: L },
    ],
    enemies: [
      { id: 'gen_tec', type: 'tecnico', x: 780, patrol: [700, 1000] },
      { id: 'gen_run', type: 'corridore', x: 1150, facingRight: false, showIf: { flag: 'power_on' } },
    ],
    spawnX: L,
  },

  stanza_manutenzione: {
    name: 'Officina', chapter: 'Sotterranei', bg: BG + 'stanza_manutenzione.png',
    light: 0.5, map: [4, 3],
    hotspots: [
      { id: 'maint_bench', x: 440, w: 260, label: 'Banco da lavoro', icon: 'note', iconY: 560,
        doc: 'doc_officina', give: [['ammo_shells', 4]] },
      { id: 'maint_locker', x: 960, w: 140, label: 'Armadietto 7', icon: 'card', iconY: 480, give: ['card'] },
    ],
    doors: [
      { id: 'maint_to_gen', edge: 'left', label: 'Sala generatori', target: 'sala_generatori', targetX: R },
      { id: 'maint_to_safe', x: 150, w: 160, label: 'Porta blindata — Rifugio', target: 'safe_room', targetX: L,
        requires: [{ flag: 'power_on' }], failText: 'Porta blindata a comando elettrico. Senza corrente non si apre.' },
    ],
    enemies: [
      { id: 'maint_listener', type: 'listener', x: 760, idle: true, facingRight: false },
    ],
    spawnX: L,
  },

  safe_room: {
    name: 'Il rifugio di Elena', chapter: 'Sotterranei', bg: BGP + 'safe_room.png',
    light: 0.8, map: [5, 3], safe: true,
    hotspots: [
      { id: 'safe_shelf', x: 190, w: 280, label: 'Scaffale', markY: 470,
        give: ['medikit_small', ['ammo_shells', 4], ['ammo_pistol_small', 8]] },
      { id: 'safe_recorder', x: 560, w: 160, label: 'Registratore sulla scrivania', icon: 'recorder', iconY: 372, event: 'elena_tape_2' },
      { id: 'safe_radio', x: 760, w: 200, label: 'Radio di Elena [SALVA]', markY: 330, event: 'open_save' },
    ],
    doors: [
      { id: 'safe_to_maint', edge: 'left', label: 'Officina', target: 'stanza_manutenzione', targetX: 230 },
      { id: 'safe_to_lab', edge: 'right', label: 'Laboratorio', target: 'lab_ingresso', targetX: L,
        keyId: 'card', lockedText: 'Porta del laboratorio. Lettore di tessere. "LIVELLO 3".' },
    ],
    spawnX: L,
  },

  /* ═══════════ CAPITOLO 5 — LABORATORIO ROSSO ═══════════ */

  lab_ingresso: {
    name: 'Laboratorio — Ingresso', chapter: 'Laboratorio', bg: BGP + 'lab_ingresso.png',
    light: 0.55, map: [0, 4],
    hotspots: [
      { id: 'lab_papers', x: 180, w: 160, label: 'Fogli a terra', markY: 620,
        text: 'Moduli di evacuazione. Tutti firmati "Dir. Amati". Nessuno compilato.' },
    ],
    doors: [
      { id: 'li_to_safe', edge: 'left', label: 'Rifugio', target: 'safe_room', targetX: R },
      { id: 'li_to_corr', x: 380, w: 300, label: 'Porta a doppia anta', target: 'lab_corridoio', targetX: L },
    ],
    enemies: [
      { id: 'li_tec', type: 'tecnico', x: 950, patrol: [800, 1150] },
    ],
    spawnX: L,
  },

  lab_corridoio: {
    name: 'Laboratorio — Corridoio', chapter: 'Laboratorio', bg: BGP + 'lab_corridoio.png',
    light: 0.55, map: [1, 4],
    hotspots: [
      { id: 'lc_log', x: 200, w: 160, label: 'Registro accessi', icon: 'note', iconY: 560, doc: 'doc_accessi' },
      { id: 'lc_bench', x: 900, w: 200, label: 'Bancone', markY: 520, give: ['painkillers'] },
    ],
    doors: [
      { id: 'lc_to_li', edge: 'left', label: 'Ingresso', target: 'lab_ingresso', targetX: 520 },
      { id: 'lc_to_bio', x: 560, w: 140, label: 'Laboratorio biologico', target: 'lab_biologico', targetX: L },
      { id: 'lc_to_server', edge: 'right', label: 'Sala server', target: 'sala_server', targetX: L },
    ],
    enemies: [
      { id: 'lc_inf', type: 'infermiere', x: 420, patrol: [360, 540] },
      { id: 'lc_run', type: 'corridore', x: 1080, idle: true, facingRight: false },
    ],
    spawnX: L,
  },

  lab_biologico: {
    name: 'Laboratorio biologico', chapter: 'Laboratorio', bg: BGP + 'lab_biologico.png',
    light: 0.45, map: [2, 4],
    hotspots: [
      { id: 'bio_tanks', x: 160, w: 220, label: 'Vasche di coltura', markY: 440,
        text: 'Dentro il liquido verdastro galleggia qualcosa che una volta era una mano.' },
      { id: 'bio_usb', x: 600, w: 140, label: 'Terminale di ricerca', icon: 'usb', iconY: 560, give: ['usb'],
        text: 'Nella porta del terminale è infilata una chiavetta. "R-0 / dati completi — E.F."' },
    ],
    doors: [
      { id: 'bio_to_corr', edge: 'left', label: 'Corridoio', target: 'lab_corridoio', targetX: 600 },
    ],
    enemies: [
      { id: 'bio_cr', type: 'crawler', x: 480, ceiling: true },
      { id: 'bio_c', type: 'contaminato', x: 1050, patrol: [900, 1180] },
    ],
    spawnX: L,
  },

  sala_server: {
    name: 'Sala server', chapter: 'Laboratorio', bg: BGP + 'sala_server.png',
    light: 0.5, map: [3, 4],
    hotspots: [
      { id: 'server_doc', x: 160, w: 140, label: 'Stampa sul pavimento', icon: 'note', iconY: 620, doc: 'doc_classificato' },
      { id: 'server_upload', x: 820, w: 180, label: 'Terminale di trasmissione', markY: 470, event: 'upload_data',
        requires: [{ item: 'usb' }], failText: 'Il terminale chiede un supporto con i dati da trasmettere.',
        hideIf: { flag: 'data_sent' } },
    ],
    doors: [
      { id: 'server_to_lc', edge: 'left', label: 'Corridoio', target: 'lab_corridoio', targetX: R },
      { id: 'server_to_core', x: 520, w: 240, label: 'Camera centrale', target: 'camera_centrale', targetX: L,
        requires: [{ flag: 'data_sent' }], failText: 'Porta stagna. Sul display: "APERTURA SOLO DA TERMINALE".' },
    ],
    enemies: [
      { id: 'server_listener', type: 'listener', x: 1000, patrol: [880, 1180] },
    ],
    spawnX: L,
  },

  camera_centrale: {
    name: 'Camera centrale', chapter: 'Laboratorio', bg: BGP + 'camera_centrale.png',
    light: 0.6, map: [4, 4],
    npcs: [
      { id: 'elena', char: 'elena', x: 880, anim: 'idle', facingRight: false, label: 'Elena', event: 'talk_elena', hideIf: { flag: 'elena_gone' } },
    ],
    hotspots: [
      { id: 'core_letter', x: 860, w: 120, label: 'Una lettera', icon: 'note', iconY: 610, doc: 'doc_lettera_elena',
        give: ['key_rusty'], showIf: { flag: 'elena_gone' } },
    ],
    doors: [
      { id: 'core_to_server', edge: 'left', label: 'Sala server', target: 'sala_server', targetX: 600,
        requires: [{ notFlag: 'core_alarm' }], failText: 'La porta stagna si è sigillata alle tue spalle.' },
      { id: 'core_to_port', edge: 'right', label: 'Galleria verso il porto', target: 'porto', targetX: L,
        requires: [{ flag: 'elena_talked' }], failText: 'Un portellone chiuso. Elena ha il comando.' },
    ],
    enemies: [
      { id: 'core_run1', type: 'corridore', x: 80, facingRight: true, showIf: { flag: 'core_alarm' } },
      { id: 'core_run2', type: 'contaminato', x: 200, facingRight: true, showIf: { flag: 'core_alarm' } },
    ],
    spawnX: L,
  },

  /* ═══════════ CAPITOLO 6 — IL PORTO ═══════════ */

  porto: {
    name: 'Porto commerciale', chapter: 'Porto', bg: BGP + 'porto.png',
    light: 0.5, map: [0, 5], ambient: 'rain_heavy', rain: true,
    props: [{ name: 'body_5', x: 520 }],
    hotspots: [
      { id: 'port_container', x: 300, w: 200, label: 'Container aperto', markY: 520,
        give: [['ammo_shells', 4], 'medikit_small'] },
    ],
    doors: [
      { id: 'port_to_core', edge: 'left', label: 'Galleria', lockedText: 'La galleria è crollata dietro di te.', requires: [{ flag: 'never' }] },
      { id: 'port_to_pier', edge: 'right', label: 'Molo 4', target: 'molo_finale', targetX: L },
    ],
    enemies: [
      { id: 'port_c1', type: 'tecnico', x: 700, patrol: [600, 900] },
      { id: 'port_run', type: 'corridore', x: 1120, facingRight: false },
      { id: 'port_c2', type: 'contaminato', x: 950, patrol: [850, 1150] },
    ],
    spawnX: L,
  },

  molo_finale: {
    name: 'Molo 4', chapter: 'Porto', bg: BGP + 'molo_finale.png',
    light: 0.5, map: [1, 5], ambient: 'rain_heavy', rain: true,
    hotspots: [
      { id: 'the_boat', x: 1000, w: 220, label: 'Il gozzo di papà', markY: 560, event: 'ending',
        requires: [{ item: 'key_rusty' }], failText: 'La barca è legata con una catena e un lucchetto.' },
    ],
    doors: [
      { id: 'pier_to_port', edge: 'left', label: 'Porto', target: 'porto', targetX: R },
    ],
    enemies: [
      { id: 'pier_l', type: 'listener', x: 640, idle: true, facingRight: false },
    ],
    spawnX: L,
  },
};

/* Scala dei personaggi e linea dei piedi per ogni inquadratura.
   Misurate confrontando porte, sedili, banconi, auto e container dei disegni
   con l'altezza di una persona (1,0 = 280 px). */
const FRAMING = {
  train_wagon:        [1.35, 682],
  station_platform:   [1.10, 670],
  station_hall:       [1.05, 666],
  station_storage:    [1.15, 670],
  station_control:    [1.25, 682],
  station_exit:       [1.15, 672],
  city_street:        [0.80, 652],
  alimentari:         [1.00, 666],
  apartment:          [0.90, 664],
  city_alley:         [0.95, 664],
  hospital_corridor:  [1.10, 672],
  hospital_ward:      [1.10, 672],
  hospital_surgery:   [1.00, 668],
  hospital_morgue:    [1.05, 670],
  metro_ingresso:     [0.85, 668],
  metro_banchina:     [0.90, 668],
  metro_tunnel:       [0.85, 668],
  sala_generatori:    [0.90, 668],
  stanza_manutenzione:[1.20, 682],
  safe_room:          [2.10, 710],   // inquadratura ravvicinata: sedia e scrivania in primo piano
  lab_ingresso:       [1.20, 676],
  lab_corridoio:      [1.05, 670],
  lab_biologico:      [1.00, 666],
  sala_server:        [1.10, 672],
  camera_centrale:    [1.00, 664],
  porto:              [0.70, 652],
  molo_finale:        [0.75, 656],
};


/* Aspetto delle porte.
   'wood' | 'metal' | 'glass' | 'security' = porta disegnata (sprite)
   'painted'  = il passaggio è già nello sfondo: solo segnalino
   'passage'  = uscita laterale (strada, banchina, tunnel): cartello a freccia
   Le uscite "edge" senza voce qui sono 'passage'; le altre 'painted'. */
const DOOR_LOOK = {
  wagon_left: 'metal',        wagon_to_platform: 'painted',
  platform_to_wagon: 'passage', platform_to_hall: 'passage',
  hall_to_platform: 'passage', hall_to_storage: 'metal', hall_to_control: 'painted', hall_to_exit: 'passage',
  storage_to_hall: 'metal',   storage_dark: 'passage',
  control_to_hall: 'security',
  exit_to_hall: 'glass',      exit_to_city: 'painted',
  street_to_station: 'passage', street_to_apartment: 'wood', street_to_alley: 'painted', street_to_shop: 'glass',
  shop_to_street: 'glass',
  apt_to_street: 'wood',      apt_exit: 'metal',
  alley_to_street: 'passage', alley_to_hospital: 'metal',
  corr_to_alley: 'metal',     corr_to_ward: 'wood', corr_to_morgue: 'painted', corr_to_surgery: 'security',
  ward_to_corr: 'wood',
  surg_to_corr: 'glass',
  morgue_to_corr: 'metal',    morgue_to_metro: 'metal',
  mi_to_morgue: 'metal',      mi_to_banchina: 'painted',
  mb_to_mi: 'passage',        mb_to_tunnel: 'passage',
  tunnel_to_mb: 'passage',    tunnel_to_gen: 'metal',
  gen_to_tunnel: 'metal',     gen_to_maint: 'metal',
  maint_to_gen: 'passage',    maint_to_safe: 'security',
  safe_to_maint: 'passage',   safe_to_lab: 'passage',
  li_to_safe: 'security',     li_to_corr: 'painted',
  lc_to_li: 'glass',          lc_to_bio: 'painted', lc_to_server: 'glass',
  bio_to_corr: 'glass',
  server_to_lc: 'glass',      server_to_core: 'painted',
  core_to_server: 'security', core_to_port: 'security',
  port_to_core: 'passage',    port_to_pier: 'passage',
  pier_to_port: 'passage',
};

/* Oggetti di scena disegnati sopra lo sfondo (dalle tavole in assets).
   { name, x (centro), lift (px sopra i piedi, a scala 1), flip, openWhen: id hotspot → usa <name>_open } */
const SCENERY = {
  station_platform: [{ name: 'payphone', x: 1100, lift: 120 }],
  station_hall:     [{ name: 'locker', x: 655, openWhen: 'locker_flashlight' }],
  station_storage:  [{ name: 'locker_fallen', x: 1000 }],
  station_control:  [{ name: 'radio_set', x: 620, lift: 95 }],
  apartment:        [{ name: 'radio_set', x: 880, lift: 85 }],
  hospital_ward:    [{ name: 'locker', x: 290, openWhen: 'ward_locker' }, { name: 'locker', x: 355 }],
  metro_banchina:   [{ name: 'payphone', x: 620, lift: 110 }],
  sala_generatori:  [{ name: 'electric_box', x: 1020, lift: 70 }],
  stanza_manutenzione: [{ name: 'locker', x: 990, openWhen: 'maint_locker' }, { name: 'locker_bent', x: 1055 }],
  safe_room:        [],
};

/* Scala di disegno delle porte: nelle inquadrature ravvicinate non devono uscire dallo schermo */
export function doorScale(room) { return Math.min(room.scale, 1.2) * 0.9; }

// Completa i campi di default
for (const [id, r] of Object.entries(ROOMS)) {
  const fr = FRAMING[id] || [1, FLOOR];
  r.scale = r.scale ?? fr[0];
  r.floorY = r.floorY ?? fr[1];
  r.id = id;
  r.width = ROOM_W;
  r.height = ROOM_H;
  r.lightLevel = r.light ?? 0.5;
  r.mapPos = r.map ? { col: r.map[0], row: r.map[1] } : null;
  r.hotspots = r.hotspots || [];
  r.doors = r.doors || [];
  r.npcs = r.npcs || [];
  r.props = r.props || [];
  r.enemies = r.enemies || [];
  r.scenery = SCENERY[id] || [];
  const ds = doorScale(r);
  for (const d of r.doors) {
    d.look = DOOR_LOOK[d.id] || (d.edge ? 'passage' : 'painted');
    const spr = SCENE['door_' + d.look];
    if (d.edge) {
      // le uscite laterali diventano porte vere e proprie: ci si va sopra e si preme E
      const sw = spr ? Math.round(spr.w * ds) : 110;
      d.w = 110;
      d.x = d.edge === 'left' ? 16 : ROOM_W - 16 - d.w;
      d.cx = d.edge === 'left' ? 16 + sw / 2 : ROOM_W - 16 - sw / 2;
    } else {
      d.cx = d.x + d.w / 2;
    }
  }
}

/* ══════════════════════════════════════════════
   ROOM MANAGER
   ══════════════════════════════════════════════ */
export class RoomManager {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.roomData = ROOMS;
    this._bg = {};
    this.roomStates = {};
    for (const id of Object.keys(ROOMS)) this.roomStates[id] = this._freshState();
  }

  _freshState() {
    return { visited: false, pickedUp: {}, doorOpen: {}, enemiesKilled: {} };
  }

  state(id = this.current?.id) {
    if (!this.roomStates[id]) this.roomStates[id] = this._freshState();
    return this.roomStates[id];
  }

  /** Condizione { flag } | { notFlag } | { item } */
  check(cond) {
    if (!cond) return true;
    const ev = this.game.events, inv = this.game.inventory;
    if (Array.isArray(cond)) return cond.every(c => this.check(c));
    if (cond.flag)    return !!ev.getFlag(cond.flag);
    if (cond.notFlag) return !ev.getFlag(cond.notFlag);
    if (cond.item)    return inv.hasItem(cond.item);
    return true;
  }

  visible(o) {
    if (o.showIf && !this.check(o.showIf)) return false;
    if (o.hideIf &&  this.check(o.hideIf)) return false;
    return true;
  }

  _bgImage(src) {
    if (!src) return null;
    if (!this._bg[src]) { const im = new Image(); im.src = src; this._bg[src] = im; }
    return this._bg[src];
  }

  preload() {
    for (const r of Object.values(ROOMS)) this._bgImage(r.bg);
  }

  loadRoom(roomId, spawnX) {
    const def = ROOMS[roomId];
    if (!def) { console.error('Stanza non trovata:', roomId); return; }
    this.current = def;
    const st = this.state(roomId);
    st.visited = true;

    // luce (può cambiare con i flag)
    def.lightLevel = def.light ?? 0.5;
    if (def.darkFlag && this.game.events.getFlag(def.darkFlag)) def.lightLevel = def.darkLight;
    if (def.poweredFlag && this.game.events.getFlag(def.poweredFlag)) def.lightLevel = def.poweredLight;

    const cam = this.game.camera;
    cam.setBounds(0, 0, ROOM_W, ROOM_H);

    const p = this.game.player;
    p.setScale(def.scale);
    p.x = Math.max(24, Math.min(ROOM_W - 24 - p.width, spawnX ?? def.spawnX ?? L));
    p.y = def.floorY - p.height;
    if (spawnX !== undefined) p.facingRight = spawnX < ROOM_W / 2;

    cam.snapTo(ROOM_W / 2, ROOM_H / 2);

    if (def.ambient) this.game.audio.playAmbient(def.ambient);

    this.respawnEnemies();
    this.game.events.onRoomEnter(roomId);
  }

  /** (Ri)crea i nemici della stanza, esclusi quelli uccisi e quelli non ancora "attivi" */
  respawnEnemies() {
    const def = this.current, st = this.state();
    const em = this.game.enemyManager;
    em.clearEnemies();
    for (const s of def.enemies) {
      if (st.enemiesKilled[s.id]) continue;
      if (!this.visible(s)) continue;
      const tmp = em.spawnEnemy(s.type, s.x, 0, { ...s, scale: def.scale });
      tmp.y = def.floorY - tmp.height;
    }
  }

  markEnemyKilled(key) { this.state().enemiesKilled[key] = true; }
  markPickedUp(id)     { this.state().pickedUp[id] = true; }
  isPicked(id)         { return !!this.state().pickedUp[id]; }
  markDoorOpen(id)     { this.state().doorOpen[id] = true; }
  isDoorOpen(id)       { return !!this.state().doorOpen[id]; }

  /* ── Oggetti interattivi vicini al giocatore ── */
  /** Ritorna { kind:'hotspot'|'door'|'npc', obj } più vicino, o null */
  nearest(player) {
    const room = this.current;
    if (!room) return null;
    const px = player.centerX;
    let best = null, bestD = Infinity;
    const consider = (kind, obj, x0, x1) => {
      if (px < x0 - 30 || px > x1 + 30) return;
      const d = Math.abs(px - (x0 + x1) / 2);
      if (d < bestD) { bestD = d; best = { kind, obj }; }
    };
    for (const h of room.hotspots) {
      if (this.isPicked(h.id) || !this.visible(h)) continue;
      consider('hotspot', h, h.x, h.x + h.w);
    }
    for (const d of room.doors) {
      if (!this.visible(d)) continue;
      consider('door', d, d.x, d.x + d.w);
    }
    for (const n of room.npcs) {
      if (!this.visible(n)) continue;
      consider('npc', n, n.x - 70 * room.scale, n.x + 70 * room.scale);
    }
    return best;
  }

  edgeDoor(side) {
    return this.current?.doors.find(d => d.edge === side && this.visible(d)) || null;
  }

  /** La porta si può attraversare adesso? (condizioni e chiave) */
  doorPassable(d) {
    if (!d.target) return false;
    if (d.requires && !this.check(d.requires)) return false;
    if (d.keyId && !this.isDoorOpen(d.id) && !this.game.inventory.hasItem(d.keyId)) return false;
    return true;
  }

  /** Tipo di segnalino per un oggetto interattivo */
  markerKind(kind, o) {
    if (kind === 'door') return 'door';
    if (kind === 'npc') return 'use';
    if (o.event === 'open_save') return 'save';
    if (o.doc) return 'document';
    if (o.give?.length) return 'take';
    if (o.event || o.requires) return 'use';
    return 'examine';
  }

  /* ── RENDER ── */
  drawBackground(ctx) {
    const room = this.current;
    if (!room) return;
    const im = this._bgImage(room.bg);
    if (im && im.complete && im.naturalWidth > 0) {
      ctx.drawImage(im, 0, 0, ROOM_W, ROOM_H);
    } else {
      ctx.fillStyle = '#07080b';
      ctx.fillRect(0, 0, ROOM_W, ROOM_H);
    }
    const sc = room.scale, fy = room.floorY;
    // oggetti di scena (armadietti, telefoni, quadri elettrici…)
    for (const o of room.scenery) {
      const open = o.openWhen && this.isPicked(o.openWhen) && SpriteLib.hasScene(o.name + '_open');
      const name = open ? o.name + '_open' : o.name;
      const s = Math.min(sc, 1.3) * 0.88;
      const foot = fy - 34 * sc - (o.lift || 0) * s;
      if (!o.lift) SpriteLib.shadow(ctx, o.x, foot + 3, (SpriteLib.sceneSize(name)?.w || 80) * s * 0.6, 0.5);
      SpriteLib.drawScene(ctx, name, o.x, foot, s, o.flip);
    }
    // cadaveri
    for (const pr of room.props) {
      SpriteLib.shadow(ctx, pr.x, fy + 10 * sc, 120 * sc, 0.5);
      SpriteLib.drawProp(ctx, pr.name, pr.x, fy + 18 * sc, pr.flip, 1, sc);
    }
    // personaggi non giocanti
    for (const n of room.npcs) {
      if (!this.visible(n)) continue;
      const anim = this.game.events.getFlag(`npc_${n.id}_anim`) || n.anim || 'idle';
      SpriteLib.shadow(ctx, n.x, fy, 62 * sc);
      SpriteLib.draw(ctx, n.char, anim, 0, n.x, fy, n.facingRight, { scale: sc });
    }
  }

  /** Porte disegnate e cartelli delle uscite */
  drawDoors(ctx) {
    const room = this.current;
    if (!room) return;
    const ds = doorScale(room), fy = room.floorY;
    const opening = this.game._openingDoor;
    for (const d of room.doors) {
      if (!this.visible(d)) continue;
      const cx = d.cx;
      if (SpriteLib.hasScene('door_' + d.look)) {
        const open = opening === d.id;
        const name = 'door_' + d.look + (open ? '_open' : '');
        const foot = fy - 12 * room.scale;
        // la porta aperta ha l'anta di lato: la allineo al telaio della chiusa
        const closedW = SpriteLib.sceneSize('door_' + d.look).w * ds;
        SpriteLib.shadow(ctx, cx, foot + 4, closedW * 0.55, 0.45);
        const openW = SpriteLib.sceneSize(name).w * ds;
        const ox = open ? (openW - closedW) / 2 * (d.edge === 'right' ? -1 : 1) : 0;
        SpriteLib.drawScene(ctx, name, cx + ox, foot, ds, open && d.edge === 'right');
      }
    }
  }

  /** Segnalini sopra porte, oggetti e persone. Disegnati sopra il buio. */
  drawMarkers(ctx, near) {
    const room = this.current;
    if (!room) return;
    const t = Date.now() / 1000;
    const sc = room.scale, fy = room.floorY, ds = doorScale(room);
    const badge = (kind, cx, cy, isNear, locked, label) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 3 + cx * 0.02);
      const r = isNear ? 24 : 17;
      ctx.save();
      ctx.globalAlpha = isNear ? 1 : 0.55 + pulse * 0.3;
      ctx.fillStyle = locked ? 'rgba(70,10,10,0.8)' : 'rgba(10,10,12,0.72)';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = isNear ? 2.5 : 1.5;
      ctx.strokeStyle = locked ? 'rgba(230,80,70,0.95)' : (isNear ? 'rgba(255,225,160,1)' : 'rgba(230,220,200,0.7)');
      ctx.stroke();
      SpriteLib.drawUi(ctx, kind, cx, cy, r * 1.35, 1);
      if (locked) SpriteLib.drawIcon(ctx, 'padlock', cx + r * 0.8, cy + r * 0.7, r * 1.1, 1);
      if (isNear && label) {
        ctx.font = '600 15px "Courier New", monospace';
        ctx.textAlign = 'center';
        const text = label;
        const w = ctx.measureText(text).width + 34;
        const ly = cy - r - 20;
        ctx.fillStyle = 'rgba(8,8,10,0.82)';
        ctx.fillRect(cx - w / 2, ly - 13, w, 24);
        ctx.fillStyle = '#c0392b';
        ctx.fillText('E', cx - w / 2 + 12, ly + 5);
        ctx.fillStyle = '#eee4d0';
        ctx.fillText(text, cx + 8, ly + 5);
      }
      ctx.restore();
    };

    // porte
    for (const d of room.doors) {
      if (!this.visible(d)) continue;
      const isNear = near?.obj === d;
      const locked = !this.doorPassable(d);
      const cx = d.cx;
      const spr = SpriteLib.sceneSize('door_' + d.look);
      if (d.look === 'passage') {
        // freccia sul pavimento verso l'uscita
        const dir = d.edge === 'right' ? 1 : (d.edge === 'left' ? -1 : 0);
        const ay = fy - 30 * sc;
        const ax = cx;
        ctx.save();
        ctx.globalAlpha = isNear ? 0.95 : 0.45 + 0.25 * Math.sin(t * 3);
        ctx.fillStyle = locked ? 'rgb(200,70,60)' : 'rgb(240,225,190)';
        for (let k = 0; k < 3; k++) {
          const x = cx + dir * (k * 18 - 18) + (dir === 0 ? (k - 1) * 18 : 0);
          ctx.beginPath();
          ctx.moveTo(x + dir * 9, ay);
          ctx.lineTo(x - dir * 5, ay - 11);
          ctx.lineTo(x - dir * 5, ay + 11);
          ctx.fill();
        }
        ctx.restore();
      }
      const top = spr ? fy - 12 * sc - spr.h * ds - 26 : (d.markY ?? fy - 330 * Math.min(sc, 1.2) * 0.9);
      badge('door', cx, Math.max(40, top), isNear, locked, d.label);
    }

    // oggetti e punti da esaminare
    for (const h of room.hotspots) {
      if (this.isPicked(h.id) || !this.visible(h)) continue;
      const isNear = near?.obj === h;
      const cx = h.x + h.w / 2;
      const locked = h.requires && !this.check(h.requires);
      if (h.icon) {
        // oggetto a terra: icona dell'oggetto con alone, sempre visibile
        const y = h.iconY ?? fy - 40;
        const g = ctx.createRadialGradient(cx, y, 0, cx, y, 50);
        g.addColorStop(0, `rgba(255,235,190,${0.22 + Math.sin(t * 3 + cx) * 0.1 + (isNear ? 0.15 : 0)})`);
        g.addColorStop(1, 'rgba(255,235,190,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - 50, y - 50, 100, 100);
        SpriteLib.drawIcon(ctx, h.icon, cx, y, isNear ? 56 : 46, 1);
        if (isNear) badge(this.markerKind('hotspot', h), cx, y - 58, true, locked, h.label);
      } else {
        const y = Math.max(40, h.markY ?? fy - 160);
        badge(this.markerKind('hotspot', h), cx, y, isNear, locked, h.label);
      }
      if (this.game.debug) {
        ctx.strokeStyle = 'rgba(255,200,0,0.6)';
        ctx.strokeRect(h.x, 300, h.w, fy - 300);
      }
    }

    // persone con cui parlare
    for (const n of room.npcs) {
      if (!this.visible(n)) continue;
      const isNear = near?.obj === n;
      badge('use', n.x, fy - 300 * sc, isNear, false, n.label);
    }

    if (this.game.debug) {
      for (const d of room.doors) {
        ctx.strokeStyle = 'rgba(80,200,120,0.7)';
        ctx.strokeRect(d.x, 280, d.w, fy - 280);
      }
    }
  }

  drawForeground() {}

  /* ── SALVATAGGIO ── */
  serialize() {
    return { currentRoom: this.current?.id, roomStates: this.roomStates };
  }

  deserialize(data) {
    if (data?.roomStates) {
      for (const [id, st] of Object.entries(data.roomStates)) {
        this.roomStates[id] = { ...this._freshState(), ...st };
      }
    }
  }
}
