/* =============================================
   NOTTE ROSSA — rooms.js
   Definizione stanze e RoomManager
   ============================================= */

/* ── DEFINIZIONE STANZE ──────────────────────
   Ogni stanza ha:
   - id, name
   - width, height (px, spazio mondo)
   - background (colore / url immagine)
   - foreground (url immagine sovrapposta)
   - floorY, ceilY (bordi collisione verticali)
   - walls: array di { x, y, w, h } — muri/ostacoli
   - platforms: array di { x, y, w, h }
   - doors: array di { id, x, y, w, h, target, targetX, targetY, locked, keyId, label }
   - interactions: array di oggetti interattivi
   - enemies: array di spawn iniziali nemici
   - ambientSound: id audio ambiente
   - lightLevel: 0=buio, 1=piena luce
   - mapPos: { col, row } per la mini-mappa
   - visited, completed (stato runtime)
   ─────────────────────────────────────────── */

export const ROOMS = {

  /* ═══════════════════════════════
     VAGONE DEL TRENO (intro)
     ═══════════════════════════════ */
  train_wagon: {
    id:   'train_wagon',
    name: 'Vagone 4',
    width:  1200,
    height:  540,
    bgColor: '#0a0c10',
    floorY:  430,
    ceilY:    60,
    ambientSound: 'train_idle',
    lightLevel: 0.15,
    mapPos: { col: 0, row: 0 },
    walls: [
      { x: 0,    y: 60,  w: 20,  h: 370 },   // parete sinistra
      { x: 1180, y: 60,  w: 20,  h: 370 },   // parete destra (porta vagone)
      // Sedili come ostacoli semplici
      { x: 80,   y: 300, w: 90,  h: 130 },
      { x: 220,  y: 300, w: 90,  h: 130 },
      { x: 480,  y: 300, w: 90,  h: 130 },
      { x: 620,  y: 300, w: 90,  h: 130 },
      { x: 880,  y: 300, w: 90,  h: 130 },
      { x: 1020, y: 300, w: 90,  h: 130 },
    ],
    doors: [
      {
        id: 'door_wagon_to_platform',
        x: 1155, y: 200, w: 25, h: 230,
        target: 'station_platform',
        targetX: 100,
        targetY: 0,   // calcolato dal RoomManager
        locked: false,
        label: null,
        openable: true,
      }
    ],
    interactions: [
      {
        id: 'seat_protagonist',
        x: 350, y: 270, w: 80, h: 160,
        type: 'examine',
        label: 'Esamina sedile',
        onInteract: 'examine_seat',
      },
    ],
    enemies: [],
    spawnX: 360,
    spawnY: 360,
    bgDecorations: [
      // Lampada lampeggiante
      { type: 'flicker_light', x: 400, y: 80, radius: 180, intensity: 0.4 },
      { type: 'flicker_light', x: 900, y: 80, radius: 180, intensity: 0.2 },
    ],
  },

  /* ═══════════════════════════════
     BANCHINA STAZIONE
     ═══════════════════════════════ */
  station_platform: {
    id:   'station_platform',
    name: 'Banchina 1',
    width:  3200,
    height:  540,
    bgColor: '#080c12',
    floorY:  460,
    ceilY:    0,
    ambientSound: 'station_ambient',
    lightLevel: 0.2,
    mapPos: { col: 1, row: 0 },
    walls: [
      { x: 0,    y: 0,   w: 20,  h: 540 },   // fine sinistra (treno)
      { x: 3180, y: 0,   w: 20,  h: 540 },   // fine destra
      // Colonne della stazione
      { x: 400,  y: 60,  w: 30,  h: 400 },
      { x: 800,  y: 60,  w: 30,  h: 400 },
      { x: 1200, y: 60,  w: 30,  h: 400 },
      { x: 1600, y: 60,  w: 30,  h: 400 },
      { x: 2000, y: 60,  w: 30,  h: 400 },
      { x: 2400, y: 60,  w: 30,  h: 400 },
      { x: 2800, y: 60,  w: 30,  h: 400 },
      // Panchine
      { x: 600,  y: 380, w: 120, h: 80  },
      { x: 1400, y: 380, w: 120, h: 80  },
      { x: 2200, y: 380, w: 120, h: 80  },
      // Cabina telefono
      { x: 2600, y: 280, w: 60,  h: 180 },
      // Distributore
      { x: 900,  y: 330, w: 50,  h: 130 },
      // Muro fondo (sopra) — tettoie
      { x: 0,    y: 0,   w: 3200, h: 60 },
    ],
    doors: [
      {
        id: 'door_platform_to_hall',
        x: 3050, y: 200, w: 40, h: 260,
        target: 'station_hall',
        targetX: 60,
        targetY: 0,
        locked: false,
        label: null,
        openable: true,
        transitText: null,
      },
      {
        id: 'door_platform_to_wagon',
        x: 0, y: 200, w: 30, h: 230,
        target: 'train_wagon',
        targetX: 1120,
        targetY: 0,
        locked: false,
        label: null,
        openable: true,
      }
    ],
    interactions: [
      {
        id: 'public_phone',
        x: 2605, y: 300, w: 55, h: 160,
        type: 'phone',
        label: 'Rispondi al telefono',
        onInteract: 'phone_ring_event',
        requiresEvent: 'phone_ringing',
      },
      {
        id: 'platform_sign',
        x: 1550, y: 100, w: 200, h: 80,
        type: 'examine',
        label: 'Leggi tabellone',
        onInteract: 'read_platform_sign',
      },
      {
        id: 'document_ticket',
        x: 680, y: 395, w: 40, h: 20,
        type: 'pickup_doc',
        label: 'Raccogli biglietto',
        onInteract: 'pickup_doc_01',
        docId: 'doc_ticket',
      },
    ],
    enemies: [],
    spawnX: 120,
    spawnY: 380,
    bgDecorations: [
      { type: 'flicker_light', x: 400,  y: 50, radius: 200, intensity: 0.35 },
      { type: 'flicker_light', x: 800,  y: 50, radius: 200, intensity: 0.3  },
      { type: 'flicker_light', x: 1200, y: 50, radius: 200, intensity: 0.0  }, // spenta
      { type: 'flicker_light', x: 1600, y: 50, radius: 200, intensity: 0.25 },
      { type: 'flicker_light', x: 2000, y: 50, radius: 200, intensity: 0.15 },
      { type: 'flicker_light', x: 2400, y: 50, radius: 200, intensity: 0.3  },
      { type: 'flicker_light', x: 2800, y: 50, radius: 200, intensity: 0.2  },
      { type: 'rain_window',   x: 0,    y: 0 },
    ],
  },

  /* ═══════════════════════════════
     ATRIO STAZIONE
     ═══════════════════════════════ */
  station_hall: {
    id:   'station_hall',
    name: 'Atrio',
    width:  2400,
    height:  540,
    bgColor: '#090b0f',
    floorY:  460,
    ceilY:    0,
    ambientSound: 'station_hall_ambient',
    lightLevel: 0.15,
    mapPos: { col: 2, row: 0 },
    walls: [
      { x: 0,    y: 0,   w: 20,  h: 540 },
      { x: 2380, y: 0,   w: 20,  h: 540 },
      { x: 0,    y: 0,   w: 2400, h: 60 },
      // Bancone biglietteria
      { x: 600,  y: 300, w: 220, h: 160 },
      // Colonne
      { x: 400,  y: 60,  w: 30,  h: 400 },
      { x: 1200, y: 60,  w: 30,  h: 400 },
      { x: 2000, y: 60,  w: 30,  h: 400 },
      // Armadio
      { x: 1600, y: 300, w: 80,  h: 160 },
    ],
    doors: [
      {
        id: 'door_hall_to_platform',
        x: 0, y: 200, w: 30, h: 260,
        target: 'station_platform',
        targetX: 3100,
        targetY: 0,
        locked: false,
        label: null,
        openable: true,
      },
      {
        id: 'door_hall_to_control',
        x: 2000, y: 200, w: 40, h: 260,
        target: 'station_control',
        targetX: 60,
        targetY: 0,
        locked: true,
        keyId: 'key_control',
        label: 'Chiave controllo richiesta.',
        openable: true,
      },
      {
        id: 'door_hall_to_storage',
        x: 1600, y: 200, w: 40, h: 260,
        target: 'station_storage',
        targetX: 60,
        targetY: 0,
        locked: false,
        label: null,
        openable: true,
      },
    ],
    interactions: [
      {
        id: 'ticket_booth',
        x: 600, y: 280, w: 220, h: 30,
        type: 'examine',
        label: 'Esamina biglietteria',
        onInteract: 'examine_ticket_booth',
      },
      {
        id: 'locker_flashlight',
        x: 1600, y: 310, w: 80, h: 150,
        type: 'pickup',
        label: 'Apri armadio',
        onInteract: 'pickup_flashlight',
        itemId: 'flashlight',
        oneShot: true,
      },
    ],
    enemies: [
      { type: 'contaminato', x: 1800, y: 380, patrol: [1700, 2200] }
    ],
    spawnX: 80,
    spawnY: 380,
    bgDecorations: [
      { type: 'flicker_light', x: 400,  y: 50, radius: 220, intensity: 0.2  },
      { type: 'flicker_light', x: 1200, y: 50, radius: 220, intensity: 0.1  },
      { type: 'flicker_light', x: 2000, y: 50, radius: 220, intensity: 0.25 },
    ],
  },

  /* ═══════════════════════════════
     DEPOSITO STAZIONE
     ═══════════════════════════════ */
  station_storage: {
    id:   'station_storage',
    name: 'Deposito',
    width:  800,
    height:  400,
    bgColor: '#060808',
    floorY:  340,
    ceilY:    0,
    ambientSound: 'indoor_quiet',
    lightLevel: 0.05,
    mapPos: { col: 3, row: 0 },
    walls: [
      { x: 0,   y: 0, w: 20,  h: 400 },
      { x: 780, y: 0, w: 20,  h: 400 },
      { x: 0,   y: 0, w: 800, h: 40  },
      // Scaffali
      { x: 100, y: 160, w: 200, h: 40 },
      { x: 100, y: 240, w: 200, h: 40 },
      { x: 450, y: 160, w: 200, h: 40 },
    ],
    doors: [
      {
        id: 'door_storage_to_hall',
        x: 0, y: 160, w: 20, h: 180,
        target: 'station_hall',
        targetX: 1560,
        targetY: 0,
        locked: false,
        openable: true,
      }
    ],
    interactions: [
      {
        id: 'shelf_pistol',
        x: 100, y: 110, w: 200, h: 50,
        type: 'pickup',
        label: 'Prendi pistola',
        onInteract: 'pickup_pistol',
        itemId: 'pistol',
        oneShot: true,
      },
      {
        id: 'shelf_ammo',
        x: 450, y: 110, w: 200, h: 50,
        type: 'pickup',
        label: 'Prendi munizioni',
        onInteract: 'pickup_ammo',
        itemId: 'ammo_pistol_small',
        oneShot: true,
      },
      {
        id: 'crate_key',
        x: 560, y: 220, w: 80, h: 80,
        type: 'pickup',
        label: 'Apri cassa',
        onInteract: 'pickup_key_control',
        itemId: 'key_control',
        oneShot: true,
      },
      {
        id: 'document_note_storage',
        x: 300, y: 150, w: 50, h: 30,
        type: 'pickup_doc',
        label: 'Raccogli nota',
        onInteract: 'pickup_doc_02',
        docId: 'doc_storage_note',
      }
    ],
    enemies: [],
    spawnX: 80,
    spawnY: 280,
    isSafeRoom: false,
    bgDecorations: [],
  },

  /* ═══════════════════════════════
     SALA CONTROLLO (SAFE ROOM + SAVE)
     ═══════════════════════════════ */
  station_control: {
    id:   'station_control',
    name: 'Sala Controllo',
    width:  1200,
    height:  400,
    bgColor: '#07090c',
    floorY:  340,
    ceilY:    0,
    ambientSound: 'safe_room_hum',
    lightLevel: 0.4,
    mapPos: { col: 3, row: 1 },
    walls: [
      { x: 0,    y: 0, w: 20,   h: 400 },
      { x: 1180, y: 0, w: 20,   h: 400 },
      { x: 0,    y: 0, w: 1200, h: 40  },
      // Console
      { x: 200,  y: 220, w: 400, h: 120 },
      { x: 700,  y: 220, w: 300, h: 120 },
    ],
    doors: [
      {
        id: 'door_control_to_hall',
        x: 0, y: 140, w: 20, h: 200,
        target: 'station_hall',
        targetX: 2020,
        targetY: 0,
        locked: false,
        openable: true,
      },
      {
        id: 'door_control_to_city',
        x: 1160, y: 140, w: 20, h: 200,
        target: null,   // fine demo
        targetX: 0,
        targetY: 0,
        locked: true,
        label: 'La porta conduce verso la città.\n[Demo — Fine Versione 0.1]',
        openable: false,
      }
    ],
    interactions: [
      {
        id: 'emergency_radio',
        x: 200, y: 160, w: 120, h: 60,
        type: 'save_point',
        label: 'Usa radio di emergenza',
        onInteract: 'open_save_menu',
      },
      {
        id: 'control_monitor',
        x: 500, y: 180, w: 100, h: 60,
        type: 'examine',
        label: 'Esamina monitor',
        onInteract: 'examine_monitor',
      }
    ],
    enemies: [],
    isSafeRoom: true,
    spawnX: 80,
    spawnY: 280,
    bgDecorations: [
      { type: 'steady_light', x: 300, y: 40, radius: 300, intensity: 0.4 },
      { type: 'steady_light', x: 900, y: 40, radius: 300, intensity: 0.3 },
    ],
  },
};

/* ══════════════════════════════════════════════════
   ROOM MANAGER
   ══════════════════════════════════════════════════ */
export class RoomManager {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.roomData = ROOMS;

    // Stato runtime per stanza (visitata, oggetti raccolti, porte)
    this.roomStates = {};
    for (const id of Object.keys(ROOMS)) {
      this.roomStates[id] = {
        visited:   false,
        completed: false,
        pickedUp:  {},    // { interactionId: true }
        doorOpen:  {},    // { doorId: true }
        enemiesKilled: {},
      };
    }
  }

  /** Carica una stanza, spawna nemici, imposta camera bounds */
  loadRoom(roomId, spawnX, spawnY) {
    const def = this.roomData[roomId];
    if (!def) { console.error('Stanza non trovata:', roomId); return; }

    this.current = def;
    const state = this.roomStates[roomId];
    state.visited = true;

    // Camera bounds
    const cam = this.game.camera;
    cam.setBounds(0, 0, def.width, def.height);

    // Spawn player
    const player = this.game.player;
    if (spawnX !== undefined) {
      player.x = spawnX;
      player.y = spawnY !== undefined ? spawnY : def.floorY - player.height;
    } else {
      player.x = def.spawnX;
      player.y = def.floorY - player.height;
    }
    player.y = def.floorY - player.height;

    // Snap camera
    cam.snapTo(player.x + player.width / 2, player.y + player.height / 2);

    // Audio ambiente
    if (def.ambientSound) {
      this.game.audio.playAmbient(def.ambientSound);
    }

    // Spawn nemici (filtra quelli già uccisi)
    const em = this.game.enemyManager;
    if (em) {
      em.clearEnemies();
      for (const spawnDef of (def.enemies || [])) {
        if (!state.enemiesKilled[spawnDef.type + '_' + spawnDef.x]) {
          em.spawnEnemy(spawnDef.type, spawnDef.x, def.floorY - 60, spawnDef);
        }
      }
    }

    // Attiva eventi della stanza
    this.game.events.onRoomEnter(roomId);

    console.log(`[Room] Caricata: ${def.name} (${roomId})`);
  }

  /** Aggiorna logica stanza (luci, decorazioni) */
  update(dt) {
    if (!this.current) return;
    // Luci dinamiche gestite nel renderer
  }

  /** Disegna sfondo + elementi ambiente */
  drawBackground(ctx) {
    const room = this.current;
    if (!room) return;

    // Sfondo
    ctx.fillStyle = room.bgColor || '#080a0e';
    ctx.fillRect(0, 0, room.width, room.height);

    // Soffitto / bordo superiore
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, room.width, room.ceilY || 0);

    // Pavimento
    this._drawFloor(ctx, room);

    // Decorazioni sfondo (luci, pioggia, ecc.)
    this._drawDecorations(ctx, room);

    // Muri / pareti (se non hanno sprite)
    this._drawWalls(ctx, room);
  }

  _drawFloor(ctx, room) {
    // Pavimento semplice placeholder
    const fy = room.floorY;
    const gradient = ctx.createLinearGradient(0, fy, 0, fy + 80);
    gradient.addColorStop(0, '#1a1c1e');
    gradient.addColorStop(1, '#0c0d0f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, fy, room.width, room.height - fy);

    // Linea bordo pavimento
    ctx.strokeStyle = 'rgba(60,65,70,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, fy);
    ctx.lineTo(room.width, fy);
    ctx.stroke();
  }

  _drawDecorations(ctx, room) {
    for (const deco of (room.bgDecorations || [])) {
      if (deco.type === 'flicker_light' && deco.intensity > 0) {
        this._drawFlickerLight(ctx, deco);
      } else if (deco.type === 'steady_light') {
        this._drawSteadyLight(ctx, deco);
      } else if (deco.type === 'rain_window') {
        // la pioggia è gestita esternamente (CSS overlay)
      }
    }
  }

  _drawFlickerLight(ctx, deco) {
    // Flicker casuale
    const flicker = 0.85 + Math.sin(Date.now() * 0.008 + deco.x) * 0.08
                        + (Math.random() < 0.05 ? (Math.random() - 0.5) * 0.3 : 0);
    const intensity = deco.intensity * Math.max(0, flicker);

    const g = ctx.createRadialGradient(deco.x, deco.y, 0, deco.x, deco.y, deco.radius);
    g.addColorStop(0,   `rgba(220,200,140,${intensity * 0.5})`);
    g.addColorStop(0.3, `rgba(180,160,100,${intensity * 0.2})`);
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(deco.x - deco.radius, deco.y - 10, deco.radius * 2, deco.radius * 1.5);

    // Punto luce (lampadina)
    ctx.fillStyle = `rgba(255,240,180,${intensity * 0.8})`;
    ctx.beginPath();
    ctx.arc(deco.x, deco.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSteadyLight(ctx, deco) {
    const g = ctx.createRadialGradient(deco.x, deco.y, 0, deco.x, deco.y, deco.radius);
    g.addColorStop(0,   `rgba(180,200,220,${deco.intensity * 0.4})`);
    g.addColorStop(0.4, `rgba(140,160,180,${deco.intensity * 0.15})`);
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(deco.x - deco.radius, deco.y - 10, deco.radius * 2, deco.radius * 2);

    ctx.fillStyle = `rgba(200,230,255,${deco.intensity * 0.6})`;
    ctx.beginPath();
    ctx.arc(deco.x, deco.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawWalls(ctx, room) {
    // Muri opachi placeholder (in debug li mostriamo sempre)
    if (this.game.debug) {
      ctx.strokeStyle = 'rgba(80,120,200,0.4)';
      ctx.lineWidth = 1;
      for (const w of (room.walls || [])) {
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      }
    }
    // Pareti laterali placeholder
    ctx.fillStyle = '#0e1014';
    const endR = { x: room.width - 20, y: 0, w: 20, h: room.height };
    ctx.fillRect(0, 0, 20, room.height);
    ctx.fillRect(endR.x, endR.y, endR.w, endR.h);
  }

  /** Disegna porte */
  drawDoors(ctx) {
    const room = this.current;
    if (!room) return;
    const state = this.roomStates[room.id];

    for (const door of (room.doors || [])) {
      const isOpen = state.doorOpen[door.id];
      ctx.fillStyle = isOpen ? 'rgba(40,80,40,0.6)' : (door.locked ? 'rgba(80,30,30,0.6)' : 'rgba(60,60,80,0.6)');
      ctx.fillRect(door.x, door.y, door.w, door.h);

      // Maniglia
      const hx = door.x + (door.w > 0 ? door.w - 8 : 4);
      const hy = door.y + door.h / 2;
      ctx.fillStyle = 'rgba(200,180,100,0.7)';
      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fill();

      if (this.game.debug) {
        ctx.strokeStyle = door.locked ? '#c04040' : '#40c080';
        ctx.lineWidth = 1;
        ctx.strokeRect(door.x, door.y, door.w, door.h);
      }
    }
  }

  /** Disegna trigger/interaction zones */
  drawInteractions(ctx) {
    if (!this.game.debug) return;
    const room = this.current;
    if (!room) return;
    const state = this.roomStates[room.id];

    ctx.strokeStyle = 'rgba(255,200,0,0.4)';
    ctx.lineWidth = 1;
    for (const inter of (room.interactions || [])) {
      if (state.pickedUp[inter.id]) continue;
      ctx.strokeRect(inter.x, inter.y, inter.w, inter.h);
      ctx.fillStyle = 'rgba(255,200,0,0.15)';
      ctx.fillRect(inter.x, inter.y, inter.w, inter.h);
    }
  }

  /** Disegna primo piano (foreground) */
  drawForeground(ctx) {
    const room = this.current;
    if (!room) return;

    // Placeholder: colonne in primo piano
    ctx.fillStyle = '#0a0c10';
    for (const w of (room.walls || [])) {
      // Solo le colonne (quelle strette e alte)
      if (w.w < 50 && w.h > 200) {
        const grad = ctx.createLinearGradient(w.x, 0, w.x + w.w, 0);
        grad.addColorStop(0,   '#0c0e12');
        grad.addColorStop(0.5, '#141618');
        grad.addColorStop(1,   '#0c0e12');
        ctx.fillStyle = grad;
        ctx.fillRect(w.x, w.y, w.w, w.h);
      }
    }
  }

  /** Ottieni interazione sotto il cursore/interactPoint */
  getInteractionAt(ix, iy) {
    const room = this.current;
    if (!room) return null;
    const state = this.roomStates[room.id];

    for (const inter of (room.interactions || [])) {
      if (state.pickedUp[inter.id]) continue;
      if (inter.requiresEvent && !this.game.events.getFlag(inter.requiresEvent)) continue;
      if (ix > inter.x && ix < inter.x + inter.w &&
          iy > inter.y && iy < inter.y + inter.h) {
        return inter;
      }
    }
    return null;
  }

  /** Ottieni porta toccata dal player */
  getDoorAt(rect) {
    const room = this.current;
    if (!room) return null;

    for (const door of (room.doors || [])) {
      if (this._rectsOverlap(rect, door)) return door;
    }
    return null;
  }

  /** Segna interazione come usata */
  markPickedUp(interactionId) {
    if (!this.current) return;
    this.roomStates[this.current.id].pickedUp[interactionId] = true;
  }

  markDoorOpen(doorId) {
    if (!this.current) return;
    this.roomStates[this.current.id].doorOpen[doorId] = true;
  }

  _rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /** Stato serializzabile per il salvataggio */
  serialize() {
    return {
      currentRoom: this.current?.id,
      roomStates:  this.roomStates,
    };
  }

  deserialize(data) {
    if (data.roomStates) this.roomStates = data.roomStates;
  }
}
