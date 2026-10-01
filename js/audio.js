/* =============================================
   NOTTE ROSSA — audio.js
   AudioManager: musica, ambiente, effetti, passi
   Usa Web Audio API con fallback HTML5

   I file vanno in assets/audio/<id>.mp3 (elenco in SOUND_IDS).
   Se un file manca il gioco usa un suono sintetico di riserva
   (effetti) o il silenzio (ambienti e musica): si possono
   aggiungere un po' alla volta.
   ============================================= */

export const SOUND_IDS = [
  // interfaccia
  'ui_click', 'ui_confirm', 'pickup', 'paper', 'chapter_sting',
  // giocatore
  'step_concrete', 'step_wet', 'step_metal', 'step_tile', 'step_run', 'hurt', 'heartbeat',
  'flashlight_click',
  // armi
  'shot', 'shotgun_shot', 'reload', 'shotgun_pump', 'dry_fire',
  // porte e oggetti
  'door_open', 'door_locked', 'door_metal', 'shutter_open', 'locker_open', 'safe_open',
  'phone_ring', 'generator_start', 'data_upload', 'boat_engine', 'alarm',
  // nemici
  'enemy_groan', 'enemy_alert', 'enemy_attack', 'enemy_death', 'crawler_drop', 'listener_shriek', 'runner_scream',
  // ambienti (in loop)
  'train_idle', 'station_ambient', 'room_hum', 'electronics_hum', 'rain_heavy', 'rain_indoor',
  'hospital_hum', 'morgue_cold', 'metro_drip', 'tunnel_wind', 'generator_loop', 'lab_hum', 'harbor_waves',
  // musica
  'music_menu', 'music_ending',
];

export class AudioManager {
  constructor() {
    this._ctx     = null;
    this._master  = null;
    this._buses   = {};
    this._sounds  = {};       // cache AudioBuffer
    this._playing = {};       // sorgenti attive per categoria
    this._volumes = {
      music:   0.70,
      ambient: 0.60,
      sfx:     0.80,
      steps:   0.55,
      ui:      0.80,
    };
    this._muted   = false;
    this._init();
  }

  _init() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this._ctx = new Ctx();

      // Nodo master
      this._master = this._ctx.createGain();
      this._master.gain.value = 1;
      this._master.connect(this._ctx.destination);

      // Bus per categoria
      for (const cat of ['music','ambient','sfx','steps','enemies','ui']) {
        const bus = this._ctx.createGain();
        bus.gain.value = this._volumes[cat] ?? 0.7;
        bus.connect(this._master);
        this._buses[cat] = bus;
      }
    } catch (e) {
      console.warn('[Audio] Web Audio API non disponibile:', e);
    }
  }

  /** Resume context (necessario su Chrome al primo click) */
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  /** Carica tutti i suoni presenti in assets/audio/ (quelli mancanti restano di riserva).
      tools/build.py scrive qui l'elenco dei file che esistono davvero: così non si
      chiedono file mancanti (e la console resta pulita). */
  preloadAll(base = 'assets/audio/') {
    const present = /*__AUDIO_FILES__*/null;
    for (const id of SOUND_IDS) if (!present || present.includes(id)) this.load(id, `${base}${id}.mp3`);
  }

  /** Carica un file audio (ritorna Promise). Da file:// fetch non funziona: si usa un elemento <audio>. */
  async load(id, url) {
    if (this._sounds[id]) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      const buf = await res.arrayBuffer();
      this._sounds[id] = await this._ctx.decodeAudioData(buf);
    } catch (e) {
      await new Promise(done => {
        const el = new Audio();
        el.preload = 'auto';
        el.addEventListener('canplaythrough', () => { this._sounds[id] = { el }; done(); }, { once: true });
        el.addEventListener('error', () => done(), { once: true });
        el.src = url;
      });
    }
  }

  /** Volume effettivo di una categoria (per i suoni riprodotti con <audio>) */
  _elVol(cat, v = 1) { return this._muted ? 0 : Math.max(0, Math.min(1, (this._volumes[cat] ?? 0.7) * v)); }

  /** Genera tono sintetico (usato per placeholder sfx) */
  _makeTone(freq = 440, duration = 0.1, type = 'sine') {
    if (!this._ctx) return;
    const osc  = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this._buses['sfx'] || this._master);
    osc.start();
    osc.stop(this._ctx.currentTime + duration);
  }

  /** Riproduce un effetto sonoro */
  playSfx(id, volume = 1) {
    this.resume();
    if (!this._ctx) return;
    const buf = this._sounds[id];
    if (!buf) { this._playPlaceholderSfx(id); return; }
    if (buf.el) {
      const el = buf.el.cloneNode();
      el.volume = this._elVol('sfx', volume);
      el.play().catch(() => {});
      return;
    }
    const src  = this._ctx.createBufferSource();
    const gain = this._ctx.createGain();
    src.buffer = buf;
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(this._buses['sfx'] || this._master);
    src.start();
  }

  _playPlaceholderSfx(id) {
    const map = {
      'shot':        () => this._makeTone(120,  0.08, 'sawtooth'),
      'pickup':      () => this._makeTone(880,  0.12, 'sine'),
      'door_open':   () => this._makeTone(300,  0.2,  'triangle'),
      'door_locked': () => this._makeTone(180,  0.15, 'square'),
      'hurt':        () => this._makeTone(100,  0.2,  'sawtooth'),
      'reload':      () => this._makeTone(500,  0.1,  'triangle'),
      'phone_ring':  () => { this._makeTone(700, 0.3, 'sine'); },
      'shotgun_shot': () => this._makeTone(80, 0.14, 'sawtooth'),
      'door_metal':  () => this._makeTone(220, 0.25, 'triangle'),
      'shutter_open': () => this._makeTone(150, 0.5, 'square'),
      'generator_start': () => this._makeTone(60, 1.0, 'sawtooth'),
      'enemy_alert': () => this._makeTone(140, 0.25, 'sawtooth'),
      'enemy_death': () => this._makeTone(90, 0.3, 'sawtooth'),
      'enemy_groan': () => {}, 'enemy_attack': () => {}, 'paper': () => {}, 'heartbeat': () => {}, 'flashlight_click': () => this._makeTone(1200, 0.02, 'square'),
      'chapter_sting': () => this._makeTone(55, 1.2, 'sine'),
      'step_normal': () => this._makeTone(80,   0.05, 'triangle'),
      'step_run':    () => this._makeTone(100,  0.04, 'triangle'),
      'ui_click':    () => this._makeTone(600,  0.05, 'sine'),
      'ui_confirm':  () => this._makeTone(800,  0.1,  'sine'),
    };
    const fn = map[id];
    if (fn) fn(); else this._makeTone(440, 0.05);
  }

  /** Riproduce musica in loop */
  playMusic(id, fadeIn = 1.0) {
    this.resume();
    this.stopMusic(0.5);
    if (!this._ctx) return;
    const buf = this._sounds[id];
    if (!buf) return;
    if (buf.el) { this._playing['music'] = this._loopEl(buf.el, 'music', id); return; }
    const src  = this._ctx.createBufferSource();
    const gain = this._ctx.createGain();
    src.buffer = buf;
    src.loop   = true;
    gain.gain.setValueAtTime(0, this._ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, this._ctx.currentTime + fadeIn);
    src.connect(gain);
    gain.connect(this._buses['music'] || this._master);
    src.start();
    this._playing['music'] = { src, gain };
  }

  stopMusic(fadeOut = 0.5) {
    const m = this._playing['music'];
    if (!m) return;
    if (m.el) { m.el.pause(); delete this._playing['music']; return; }
    const t = this._ctx.currentTime;
    m.gain.gain.linearRampToValueAtTime(0, t + fadeOut);
    m.src.stop(t + fadeOut + 0.05);
    delete this._playing['music'];
  }

  /** Suono ambientale in loop */
  playAmbient(id, fadeIn = 2.0) {
    this.resume();
    if (this._playing['ambient']?.id === id) return;     // stesso ambiente: continua senza stacchi
    this.stopAmbient(1.0);
    if (!this._ctx) return;
    const buf = this._sounds[id];
    if (!buf) return;
    if (buf.el) { this._playing['ambient'] = this._loopEl(buf.el, 'ambient', id); return; }
    const src  = this._ctx.createBufferSource();
    const gain = this._ctx.createGain();
    src.buffer = buf;
    src.loop   = true;
    gain.gain.setValueAtTime(0, this._ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, this._ctx.currentTime + fadeIn);
    src.connect(gain);
    gain.connect(this._buses['ambient'] || this._master);
    src.start();
    this._playing['ambient'] = { src, gain, id };
  }

  _loopEl(proto, cat, id) {
    const el = proto.cloneNode();
    el.loop = true;
    el.volume = this._elVol(cat);
    el.play().catch(() => {});
    return { el, id, cat };
  }

  stopAmbient(fadeOut = 1.0) {
    const a = this._playing['ambient'];
    if (!a || !this._ctx) return;
    if (a.el) { a.el.pause(); delete this._playing['ambient']; return; }
    const t = this._ctx.currentTime;
    a.gain.gain.linearRampToValueAtTime(0, t + fadeOut);
    a.src.stop(t + fadeOut + 0.05);
    delete this._playing['ambient'];
  }

  /** Volume per categoria */
  setVolume(category, value) {
    this._volumes[category] = value;
    const bus = this._buses[category];
    if (bus) bus.gain.value = value;
    for (const p of Object.values(this._playing)) if (p.el && p.cat === category) p.el.volume = this._elVol(category);
  }

  getVolume(category) { return this._volumes[category] ?? 1; }

  setMute(muted) {
    this._muted = muted;
    if (this._master) this._master.gain.value = muted ? 0 : 1;
  }

  /** Passi del giocatore */
  playStep(surface = 'concrete', isRunning = false) {
    const id = `step_${surface}`;
    if (this._sounds[id]) this.playSfx(id, isRunning ? 0.8 : 0.5);
    else this.playSfx(isRunning ? 'step_run' : 'step_normal', 0.6);
  }
}
