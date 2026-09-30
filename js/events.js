/* =============================================
   NOTTE ROSSA — events.js
   Flag e sequenze scriptate. Le azioni di una sequenza
   vengono eseguite IN ORDINE: un dialogo aspetta che il
   giocatore lo chiuda, 'wait' aspetta i secondi indicati.
   ============================================= */

const LUCA = 'LUCA', ELENA = 'ELENA', CARMINE = 'CARMINE', TAPE = 'ELENA (registrazione)';
const say = (speaker, text) => ({ type: 'dialogue', speaker, text });
const narr = (text) => ({ type: 'dialogue', speaker: '', text });

export class EventManager {
  constructor(game) {
    this.game  = game;
    this.flags = {};
    this._defs = {};
    this._fired = new Set();
    this._registerAll();
  }

  _registerAll() {
    const R = (id, def) => { this._defs[id] = def; };

    /* ── CAPITOLO 1 ── */
    R('tutorial_wagon', { once: true, actions: [
      narr('Il treno si è fermato.'),
      narr('[A] [D] o frecce per muoverti — [SHIFT] per correre — [C] per muoverti accovacciato, in silenzio.'),
      narr('[E] per interagire con ciò che brilla — [TAB] inventario — [M] mappa — [ESC] pausa.'),
      { type: 'set_flag', flag: 'intro_started' },
    ]});

    R('platform_ring', { trigger: 'room_enter', room: 'station_platform', once: true, delay: 2.0, actions: [
      { type: 'set_flag', flag: 'phone_ringing' },
      { type: 'ring' },
      narr('In fondo al binario, un telefono pubblico sta squillando.'),
    ]});

    R('phone_answer', { once: true, actions: [
      { type: 'set_flag', flag: 'phone_ringing', value: false },
      { type: 'sfx', id: 'ui_confirm' },
      say('???', '...Luca?'),
      say(LUCA, 'Elena! Elena, sono in stazione. Il treno si è fermato, non c\'è nessuno. Dove sei?'),
      say('???', 'Non uscire dalla stazione. Mi senti? Non uscire.'),
      say('???', 'Vai su, in sala controllo. C\'è Carmine, il ferroviere. Ha una cosa per te...'),
      say('???', 'Ho sbagliato tutto, Luca. Perdonami.'),
      narr('La linea cade.'),
      { type: 'lights_fade', duration: 5 },
      { type: 'wait', sec: 5.5 },
      { type: 'set_flag', flag: 'lights_out' },
      { type: 'title', duration: 4 },
      { type: 'wait', sec: 4.5 },
      { type: 'set_flag', flag: 'intro_complete' },
      { type: 'respawn' },
      narr('Dal treno è sceso qualcuno. Barcolla. Non è un passeggero.'),
      narr('Sei disarmato. L\'atrio è a destra.'),
    ]});

    R('got_flashlight', { once: true, actions: [
      narr('[F] accende e spegne la torcia. Si vede meglio... e si viene visti meglio.'),
    ]});

    R('got_pistol', { once: true, actions: [
      { type: 'set_flag', flag: 'has_pistol' },
      { type: 'equip', weapon: 'pistol' },
      narr('Tieni premuto [CTRL] o il tasto destro per mirare, poi [SPAZIO] o clic sinistro per sparare. [R] ricarica.'),
      { type: 'sfx', id: 'door_open' },
      narr('In fondo al corridoio, qualcosa ha sentito.'),
      { type: 'spawn', enemy: 'contaminato', x: 1150, facingRight: false, id: 'storage_ambush' },
    ]});

    R('talk_carmine', { actions: [
      { type: 'branch', if: { notFlag: 'carmine_talked' }, then: [
        { type: 'npc_anim', id: 'carmine', anim: 'talk' },
        say(CARMINE, 'Fermo! Fermo... ah. Sei tu. Hai la stessa faccia della dottoressa.'),
        say(LUCA, 'Elena. Mia sorella. Dov\'è?'),
        say(CARMINE, 'È passata di qua due ore fa, prima che chiudessero tutto. Andava al San Rocco, l\'ospedale.'),
        say(CARMINE, 'Diceva che doveva «far uscire i dati». Mi ha lasciato questo. Ha detto: se viene, daglielo.'),
        { type: 'give', item: 'recorder' },
        say(CARMINE, 'La serranda dell\'uscita la comando da qui: la leva in fondo alla sala. Io resto con la radio.'),
        say(CARMINE, 'Le radio d\'emergenza come questa funzionano ancora: usale per salvare. E muoviti piano, ragazzo. Alcuni di loro... ascoltano.'),
        { type: 'set_flag', flag: 'carmine_talked' },
        { type: 'npc_anim', id: 'carmine', anim: 'idle' },
        { type: 'run', event: 'play_recorder' },
      ], else: [
        { type: 'branch', if: { notFlag: 'shutter_open' },
          then: [say(CARMINE, 'La leva della serranda è in fondo alla sala. Tira quella.')],
          else: [say(CARMINE, 'Vai al San Rocco. E che Dio ti accompagni.')] },
      ]},
    ]});

    R('play_recorder', { actions: [
      { type: 'sfx', id: 'ui_click' },
      say(TAPE, 'Luca. Se stai ascoltando vuol dire che sei venuto lo stesso. Testardo come papà.'),
      say(TAPE, 'Quello che sta succedendo è colpa nostra. Del mio laboratorio. Lo chiamavano Progetto ROSSO.'),
      say(TAPE, 'Due cose devono uscire da Porto Salvo: il campione originale, R-0, e i dati della ricerca.'),
      say(TAPE, 'Il campione è al San Rocco, in sala operatoria. Io provo a trasmettere i dati dal laboratorio.'),
      say(TAPE, 'Se non ce la faccio... la barca di papà è al molo 4. Ti voglio bene.'),
    ]});

    R('open_shutter', { once: true, actions: [
      { type: 'sfx', id: 'door_open' },
      { type: 'shake', power: 6, time: 0.6 },
      narr('Un tonfo metallico dal piano di sotto. La serranda dell\'uscita si alza.'),
      { type: 'set_flag', flag: 'shutter_open' },
    ]});

    R('open_save', { actions: [{ type: 'sfx', id: 'ui_confirm' }, { type: 'open_save' }] });

    /* ── CAPITOLO 2 ── */
    R('enter_city', { trigger: 'room_enter', room: 'city_street', once: true, delay: 0.6, actions: [
      { type: 'chapter', text: 'CAPITOLO 2 — PORTO SALVO' },
      narr('Porto Salvo. La città dove siete cresciuti. Non c\'è una finestra accesa.'),
      narr('Il vicolo in fondo alla strada porta al retro dell\'Ospedale San Rocco.'),
    ]});

    R('enter_apartment', { trigger: 'room_enter', room: 'apartment', once: true, delay: 0.6, actions: [
      narr('Qualcosa respira in fondo alla stanza. Non si gira. Sta ascoltando.'),
      narr('Tieni premuto [C] per muoverti accovacciato: in silenzio. Correre e sparare fanno rumore.'),
    ]});

    /* ── CAPITOLO 3 ── */
    R('enter_hospital', { trigger: 'room_enter', room: 'hospital_corridor', once: true, delay: 0.6, actions: [
      { type: 'chapter', text: 'CAPITOLO 3 — OSPEDALE SAN ROCCO' },
      narr('Il San Rocco. L\'ospedale dove lavorava Elena.'),
    ]});

    /* ── CAPITOLO 4 ── */
    R('enter_metro', { trigger: 'room_enter', room: 'metro_ingresso', once: true, delay: 0.6, actions: [
      { type: 'chapter', text: 'CAPITOLO 4 — SOTTERRANEI' },
    ]});

    R('start_generator', { once: true, actions: [
      { type: 'take', item: 'fuse' },
      narr('Inserisci il fusibile e abbassi la leva di avvio.'),
      { type: 'sfx', id: 'door_locked' },
      { type: 'shake', power: 10, time: 1.2 },
      { type: 'wait', sec: 1.2 },
      { type: 'set_flag', flag: 'power_on' },
      { type: 'set_light', value: 0.75 },
      narr('Il generatore si avvia con un ruggito. Le luci si accendono, una dopo l\'altra, fino al laboratorio.'),
      { type: 'respawn' },
      narr('Il rumore ha svegliato qualcosa.'),
    ]});

    R('elena_tape_2', { once: true, actions: [
      { type: 'mark_picked', id: 'safe_recorder' },
      { type: 'sfx', id: 'ui_click' },
      say(TAPE, 'Rifugio, ore 01:40. Se il generatore è acceso, sei arrivato fin qui.'),
      say(TAPE, 'I dati sono su una chiavetta, nel terminale del laboratorio biologico.'),
      say(TAPE, 'Portala in sala server e trasmetti tutto fuori. Solo dopo la trasmissione si apre la camera centrale.'),
      say(TAPE, 'È lì che vado. Non seguirmi, Luca. Per favore.'),
    ]});

    /* ── CAPITOLO 5 ── */
    R('enter_lab', { trigger: 'room_enter', room: 'lab_ingresso', once: true, delay: 0.6, actions: [
      { type: 'chapter', text: 'CAPITOLO 5 — PROGETTO ROSSO' },
    ]});

    R('upload_data', { once: true, actions: [
      { type: 'take', item: 'usb' },
      narr('Inserisci la chiavetta. Sul monitor: TRASMISSIONE IN CORSO...'),
      { type: 'wait', sec: 1.0 },
      narr('12%... 57%... 100%.\nDESTINATARI: ISS Roma — OMS Ginevra — Istituto Pasteur. INVIO COMPLETATO.'),
      { type: 'set_flag', flag: 'data_sent' },
      { type: 'sfx', id: 'door_open' },
      narr('La porta stagna della camera centrale si sblocca.'),
    ]});

    R('talk_elena', { once: true, actions: [
      { type: 'npc_anim', id: 'elena', anim: 'talk' },
      say(ELENA, 'Luca... lo sapevo che saresti venuto. Non avvicinarti troppo.'),
      say(LUCA, 'Elena, andiamo via. Adesso.'),
      { type: 'npc_anim', id: 'elena', anim: 'scared' },
      say(ELENA, 'Mi hanno morsa quattro ore fa. Sento la febbre che sale. Tra poco non sarò più io.'),
      { type: 'npc_anim', id: 'elena', anim: 'talk' },
      say(ELENA, 'Ho visto la trasmissione partire. I dati sono fuori. Adesso qualcuno può fare una cura.'),
      { type: 'branch', if: { item: 'vial' },
        then: [say(ELENA, 'E hai il campione... Hai fatto tutto tu. Con R-0 e i dati, la cura è possibile davvero.')],
        else: [say(ELENA, 'Ma il campione R-0 è rimasto al San Rocco. Senza, fuori ci metteranno anni.')] },
      say(ELENA, 'All\'alba parte la procedura ALBA: bruceranno tutto. Io tengo aperta la galleria verso il porto.'),
      { type: 'npc_anim', id: 'elena', anim: 'point' },
      say(ELENA, 'La chiave della barca è sul tavolo. Vai, Luca. Non voltarti.'),
      { type: 'fade_out', ms: 900 },
      { type: 'set_flag', flag: 'elena_gone' },
      { type: 'set_flag', flag: 'elena_talked' },
      { type: 'set_flag', flag: 'core_alarm' },
      { type: 'respawn' },
      { type: 'fade_in', ms: 900 },
      { type: 'shake', power: 5, time: 0.8 },
      narr('Un allarme. Le porte stagne si sigillano. Dalla sala server sta arrivando qualcosa.'),
      narr('Dove c\'era Elena, sul tavolo: una lettera e una chiave.'),
    ]});

    /* ── CAPITOLO 6 ── */
    R('enter_port', { trigger: 'room_enter', room: 'porto', once: true, delay: 0.6, actions: [
      { type: 'chapter', text: 'CAPITOLO 6 — IL MOLO' },
      narr('La galleria crolla alle tue spalle. Piove sul porto. Il molo 4 è sulla destra.'),
    ]});

    R('ending', { once: true, actions: [
      narr('Sciogli la catena. Il motore del gozzo tossisce, poi parte.'),
      { type: 'ending' },
    ]});
  }

  /* ── API ── */
  register(id, def) { this._defs[id] = def; }

  onRoomEnter(roomId) {
    for (const [id, def] of Object.entries(this._defs)) {
      if (def.trigger !== 'room_enter' || def.room !== roomId) continue;
      if (def.once && this._fired.has(id)) continue;
      if (def.if && !this.game.roomManager.check(def.if)) continue;
      const go = () => { if (this.game.roomManager.current?.id === roomId) this.trigger(id); };
      if (def.delay) setTimeout(go, def.delay * 1000); else go();
    }
  }

  onInteract(id) { return this.trigger(id); }

  /** Avvia una sequenza. Ritorna una Promise. */
  trigger(id) {
    const def = this._defs[id];
    if (!def) { console.warn('[Events] evento sconosciuto:', id); return Promise.resolve(false); }
    if (def.once && this._fired.has(id)) return Promise.resolve(false);
    if (def.once) this._fired.add(id);
    return this._run(def.actions || []).then(() => true);
  }

  isRunning() { return this._running > 0; }

  async _run(actions) {
    this._running = (this._running || 0) + 1;
    this.game.input.lock();
    try {
      for (const a of actions) await this._exec(a);
    } catch (e) {
      console.error('[Events] errore nella sequenza', e);
    } finally {
      this._running--;
      if (this._running <= 0 && !this.game.dialogue.isActive() && !this.game.ui.hasOpenOverlay()) {
        this.game.input.unlock();
      }
    }
  }

  _wait(sec) { return new Promise(r => setTimeout(r, sec * 1000)); }

  async _exec(a) {
    const g = this.game;
    switch (a.type) {
      case 'dialogue':
        await new Promise(res => g.dialogue.show(a.speaker, a.text, res));
        g.input.lock();   // la sequenza non è finita
        break;
      case 'wait':        await this._wait(a.sec); break;
      case 'set_flag':    this.setFlag(a.flag, a.value ?? true); break;
      case 'sfx':         g.audio.playSfx(a.id); break;
      case 'ring': {
        const tick = () => {
          if (!this.getFlag('phone_ringing')) return;
          g.audio.playSfx('phone_ring');
          setTimeout(tick, 2200);
        };
        tick();
        break;
      }
      case 'lights_fade': g.startLightFade(a.duration); break;
      case 'set_light':   if (g.roomManager.current) g.roomManager.current.lightLevel = a.value; break;
      case 'title':       g.showCinematicTitle(a.duration); break;
      case 'chapter':     g.ui.showChapter(a.text); await this._wait(2.6); break;
      case 'respawn':     g.roomManager.respawnEnemies(); break;
      case 'spawn': {
        const e = g.enemyManager.spawnEnemy(a.enemy, a.x, 0, { id: a.id, facingRight: a.facingRight, scale: g.roomManager.current.scale });
        e.y = g.roomManager.current.floorY - e.height;
        break;
      }
      case 'give':
        if (g.inventory.addItem(a.item, a.qty)) {
          g.ui.showNotification(`Ottenuto: ${g.itemName(a.item)}`);
          g.audio.playSfx('pickup');
        }
        break;
      case 'take':        g.inventory.takeItem(a.item, a.qty ?? 1); break;
      case 'equip':       g.weapon.equip(a.weapon); break;
      case 'npc_anim':    this.setFlag(`npc_${a.id}_anim`, a.anim); break;
      case 'mark_picked': g.roomManager.markPickedUp(a.id); break;
      case 'shake':       g.camera.shake(a.power, a.time); break;
      case 'fade_out':    await new Promise(r => g.ui.fadeOut(a.ms, r)); break;
      case 'fade_in':     await new Promise(r => g.ui.fadeIn(a.ms, r)); break;
      case 'open_save':   g.ui.openSaveScreen(); break;
      case 'run':         await this.trigger(a.event); break;
      case 'branch': {
        const ok = g.roomManager.check(a.if);
        for (const b of (ok ? a.then : a.else) || []) await this._exec(b);
        break;
      }
      case 'ending':      g.showEnding(); break;
      default: console.warn('[Events] azione sconosciuta', a.type);
    }
  }

  /* ── FLAG ── */
  setFlag(name, value = true) { this.flags[name] = value; }
  getFlag(name)               { return this.flags[name]; }

  serialize()    { return { flags: { ...this.flags }, fired: [...this._fired] }; }
  deserialize(d) {
    this.flags = d?.flags || {};
    this._fired = new Set(d?.fired || []);
    // al caricamento non si riparte con il telefono che squilla
    if (this.flags.phone_ringing) this._fired.delete('platform_ring');
    this.flags.phone_ringing = false;
    if (!this.flags.intro_complete) this._fired.delete('phone_answer');
  }
}
