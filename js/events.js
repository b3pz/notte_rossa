/* =============================================
   NOTTE ROSSA — events.js
   EventManager: flag, eventi scriptati, trigger
   ============================================= */

export class EventManager {
  constructor(game) {
    this.game  = game;
    this.flags = {};   // { flagId: value }
    this._registeredEvents = {};   // { eventId: EventDef }
    this._firedEvents      = new Set(); // eventi già scattati

    this._registerAllEvents();
  }

  /* ── REGISTRAZIONE EVENTI ── */
  _registerAllEvents() {
    // ───────────────────────────────────────
    // EVENTO: telefono che squilla in banchina
    // ───────────────────────────────────────
    this.register('phone_start_ringing', {
      trigger: 'room_enter',
      room: 'station_platform',
      once: true,
      conditions: () => !this.getFlag('station_phone_answered'),
      delay: 3.5,   // secondi dopo l'entrata nella stanza
      actions: [
        { type: 'set_flag',  flag: 'phone_ringing', value: true },
        { type: 'sfx',       id: 'phone_ring' },
        { type: 'dialogue',  speaker: '', text: '...', delay: 0 },
        // Il telefono continua a squillare finché non viene risposto
        { type: 'repeat_sfx', id: 'phone_ring', interval: 4, count: 8, flag_stop: 'station_phone_answered' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: risposta al telefono
    // ───────────────────────────────────────
    this.register('phone_ring_event', {
      trigger: 'interact',
      once: true,
      conditions: () => this.getFlag('phone_ringing'),
      actions: [
        { type: 'set_flag',     flag: 'phone_ringing',       value: false },
        { type: 'set_flag',     flag: 'station_phone_answered', value: true },
        { type: 'sfx',          id: 'phone_pickup' },
        { type: 'lock_input',   duration: 6 },
        { type: 'dialogue',     speaker: '???',
          text: '...',
          delay: 1.0 },
        { type: 'dialogue',     speaker: '???',
          text: '"Non uscire dalla stazione."',
          delay: 3.0 },
        { type: 'dialogue',     speaker: '???',
          text: '...',
          delay: 5.0 },
        { type: 'sfx',          id: 'phone_hangup', delay: 5.2 },
        { type: 'unlock_input', delay: 6.0 },
        { type: 'trigger_event', eventId: 'lights_go_out', delay: 1.5 },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: luci che si spengono
    // ───────────────────────────────────────
    this.register('lights_go_out', {
      trigger: 'manual',
      once: true,
      actions: [
        { type: 'set_flag',    flag: 'lights_going_out', value: true },
        { type: 'lights_fade', room: 'station_platform', duration: 8, delay: 0 },
        { type: 'trigger_event', eventId: 'show_title', delay: 9 },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: titolo NOTTE ROSSA
    // ───────────────────────────────────────
    this.register('show_title', {
      trigger: 'manual',
      once: true,
      actions: [
        { type: 'show_cinematic_title', duration: 4 },
        { type: 'set_flag', flag: 'intro_complete', value: true },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: primo tutorial vagone
    // ───────────────────────────────────────
    this.register('tutorial_wagon', {
      trigger: 'room_enter',
      room: 'train_wagon',
      once: true,
      delay: 2,
      conditions: () => !this.getFlag('intro_complete'),
      actions: [
        { type: 'lock_input', duration: 2 },
        { type: 'dialogue', speaker: '', text: 'Il treno si è fermato.', delay: 0 },
        { type: 'dialogue', speaker: '', text: '[A/D] per muoverti  —  [SHIFT] per correre', delay: 2.5 },
        { type: 'dialogue', speaker: '', text: '[E] per interagire  —  [F] torcia  —  [TAB] inventario', delay: 5.5 },
        { type: 'unlock_input', delay: 3 },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: raccoglie torcia → la accende
    // ───────────────────────────────────────
    this.register('pickup_flashlight', {
      trigger: 'interact',
      once: true,
      actions: [
        { type: 'give_item', itemId: 'flashlight' },
        { type: 'notification', text: 'Torcia raccolta' },
        { type: 'sfx', id: 'pickup' },
        { type: 'mark_picked', interactionId: 'locker_flashlight' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: raccoglie pistola
    // ───────────────────────────────────────
    this.register('pickup_pistol', {
      trigger: 'interact',
      once: true,
      actions: [
        { type: 'give_item', itemId: 'pistol' },
        { type: 'notification', text: 'Pistola raccolta' },
        { type: 'sfx', id: 'pickup' },
        { type: 'mark_picked', interactionId: 'shelf_pistol' },
        { type: 'set_flag', flag: 'has_pistol', value: true },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: raccoglie munizioni
    // ───────────────────────────────────────
    this.register('pickup_ammo', {
      trigger: 'interact',
      once: true,
      actions: [
        { type: 'give_item', itemId: 'ammo_pistol_small' },
        { type: 'notification', text: 'Munizioni recuperate' },
        { type: 'sfx', id: 'pickup' },
        { type: 'mark_picked', interactionId: 'shelf_ammo' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: chiave sala controllo
    // ───────────────────────────────────────
    this.register('pickup_key_control', {
      trigger: 'interact',
      once: true,
      actions: [
        { type: 'give_item', itemId: 'key_control' },
        { type: 'notification', text: 'Chiave sala controllo' },
        { type: 'sfx', id: 'pickup' },
        { type: 'mark_picked', interactionId: 'crate_key' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: documento biglietto
    // ───────────────────────────────────────
    this.register('pickup_doc_01', {
      trigger: 'interact',
      once: true,
      actions: [
        { type: 'give_doc', docId: 'doc_ticket' },
        { type: 'sfx', id: 'pickup' },
        { type: 'mark_picked', interactionId: 'document_ticket' },
        { type: 'show_doc', docId: 'doc_ticket' },
      ],
    });

    this.register('pickup_doc_02', {
      trigger: 'interact',
      once: true,
      actions: [
        { type: 'give_doc', docId: 'doc_storage_note' },
        { type: 'sfx', id: 'pickup' },
        { type: 'mark_picked', interactionId: 'document_note_storage' },
        { type: 'show_doc', docId: 'doc_storage_note' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: esaminare sedile vagone
    // ───────────────────────────────────────
    this.register('examine_seat', {
      trigger: 'interact',
      once: false,
      actions: [
        { type: 'dialogue', speaker: '', text: 'Il sedile è ancora caldo.\nQualcuno era qui fino a poco fa.' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: leggi tabellone stazione
    // ───────────────────────────────────────
    this.register('read_platform_sign', {
      trigger: 'interact',
      once: false,
      actions: [
        { type: 'dialogue', speaker: '', text: '22:47 — SERVIZIO SOSPESO\n\nPer informazioni contattare il personale.' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: biglietteria
    // ───────────────────────────────────────
    this.register('examine_ticket_booth', {
      trigger: 'interact',
      once: false,
      actions: [
        { type: 'dialogue', speaker: '', text: 'La biglietteria è chiusa.\nIl registratore di cassa è spalancato.' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: monitor sala controllo
    // ───────────────────────────────────────
    this.register('examine_monitor', {
      trigger: 'interact',
      once: false,
      actions: [
        { type: 'dialogue', speaker: '', text: 'Lo schermo mostra una mappa della rete ferroviaria.\nTutte le linee sono rosse.' },
      ],
    });

    // ───────────────────────────────────────
    // EVENTO: radio di emergenza (salva)
    // ───────────────────────────────────────
    this.register('open_save_menu', {
      trigger: 'interact',
      once: false,
      actions: [
        { type: 'sfx', id: 'ui_confirm' },
        { type: 'open_save_screen' },
      ],
    });
  }

  /** Registra un evento */
  register(id, def) {
    this._registeredEvents[id] = def;
  }

  /** Chiamato quando il giocatore entra in una stanza */
  onRoomEnter(roomId) {
    for (const [id, def] of Object.entries(this._registeredEvents)) {
      if (def.trigger === 'room_enter' && def.room === roomId) {
        if (def.once && this._firedEvents.has(id)) continue;
        if (def.conditions && !def.conditions()) continue;
        const delay = def.delay || 0;
        if (delay > 0) {
          setTimeout(() => this._fireEvent(id, def), delay * 1000);
        } else {
          this._fireEvent(id, def);
        }
      }
    }
  }

  /** Chiamato da un'interazione */
  onInteract(interactionId) {
    const def = this._registeredEvents[interactionId];
    if (!def) return false;
    if (def.once && this._firedEvents.has(interactionId)) return false;
    if (def.conditions && !def.conditions()) return false;
    this._fireEvent(interactionId, def);
    return true;
  }

  /** Attiva evento manualmente */
  trigger(eventId) {
    const def = this._registeredEvents[eventId];
    if (!def) return;
    if (def.once && this._firedEvents.has(eventId)) return;
    this._fireEvent(eventId, def);
  }

  /** Esegue le azioni di un evento */
  _fireEvent(id, def) {
    if (def.once) this._firedEvents.add(id);

    const g = this.game;
    let timeOffset = 0;

    for (const action of (def.actions || [])) {
      const actionDelay = (action.delay ?? timeOffset) * 1000;

      setTimeout(() => {
        this._executeAction(action);
      }, actionDelay);

      // Se non ha delay esplicito, somma durata media
      if (action.delay === undefined) timeOffset += 0.1;
    }
  }

  _executeAction(action) {
    const g = this.game;
    switch (action.type) {

      case 'set_flag':
        this.setFlag(action.flag, action.value);
        break;

      case 'sfx':
        g.audio.playSfx(action.id);
        break;

      case 'repeat_sfx':
        // Ripeti SFX a intervalli finché flag_stop è vero
        let count = 0;
        const maxC = action.count || 10;
        const tick = () => {
          if (this.getFlag(action.flag_stop) || count >= maxC) return;
          g.audio.playSfx(action.id);
          count++;
          setTimeout(tick, action.interval * 1000);
        };
        setTimeout(tick, action.interval * 1000);
        break;

      case 'dialogue':
        if (action.delay !== undefined) {
          setTimeout(() => g.dialogue.show(action.speaker, action.text), 0);
        } else {
          g.dialogue.show(action.speaker, action.text);
        }
        break;

      case 'notification':
        g.ui.showNotification(action.text);
        break;

      case 'lock_input':
        g.input.lock();
        if (action.duration) setTimeout(() => g.input.unlock(), action.duration * 1000);
        break;

      case 'unlock_input':
        g.input.unlock();
        break;

      case 'give_item':
        g.inventory.addItem(action.itemId);
        break;

      case 'give_doc':
        g.inventory.addDocument(action.docId);
        break;

      case 'show_doc':
        g.ui.showDocument(action.docId);
        break;

      case 'mark_picked':
        g.roomManager.markPickedUp(action.interactionId);
        break;

      case 'lights_fade':
        g.startLightFade(action.duration);
        break;

      case 'show_cinematic_title':
        g.showCinematicTitle(action.duration);
        break;

      case 'trigger_event':
        if (action.delay !== undefined) {
          setTimeout(() => this.trigger(action.eventId), 0);
        } else {
          this.trigger(action.eventId);
        }
        break;

      case 'open_save_screen':
        g.ui.openSaveScreen();
        break;
    }
  }

  /* ── FLAG ── */
  setFlag(name, value)   { this.flags[name] = value; }
  getFlag(name)          { return this.flags[name]; }
  toggleFlag(name)       { this.flags[name] = !this.flags[name]; }

  /* ── SERIALIZZAZIONE ── */
  serialize()     { return { flags: { ...this.flags }, fired: [...this._firedEvents] }; }
  deserialize(d)  {
    this.flags = d.flags || {};
    this._firedEvents = new Set(d.fired || []);
  }
}
