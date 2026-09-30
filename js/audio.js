/* =============================================
   NOTTE ROSSA — audio.js
   AudioManager: musica, ambiente, effetti, passi
   Usa Web Audio API con fallback HTML5
   ============================================= */

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

  /** Carica un file audio (ritorna Promise) */
  async load(id, url) {
    if (this._sounds[id]) return;
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      this._sounds[id] = await this._ctx.decodeAudioData(buf);
    } catch (e) {
      // Silenzioso: il file non esiste ancora, crea buffer sintetico
      this._sounds[id] = this._makeSynthBuffer(id);
    }
  }

  /** Crea buffer sintetico placeholder (silenzio o tono) */
  _makeSynthBuffer(id) {
    if (!this._ctx) return null;
    const sampleRate = this._ctx.sampleRate;
    const duration   = 1;
    const buf = this._ctx.createBuffer(1, sampleRate * duration, sampleRate);
    // Silenzio
    return buf;
  }

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
    const t = this._ctx.currentTime;
    m.gain.gain.linearRampToValueAtTime(0, t + fadeOut);
    m.src.stop(t + fadeOut + 0.05);
    delete this._playing['music'];
  }

  /** Suono ambientale in loop */
  playAmbient(id, fadeIn = 2.0) {
    this.resume();
    this.stopAmbient(1.0);
    if (!this._ctx) return;
    const buf = this._sounds[id];
    if (!buf) return;
    const src  = this._ctx.createBufferSource();
    const gain = this._ctx.createGain();
    src.buffer = buf;
    src.loop   = true;
    gain.gain.setValueAtTime(0, this._ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, this._ctx.currentTime + fadeIn);
    src.connect(gain);
    gain.connect(this._buses['ambient'] || this._master);
    src.start();
    this._playing['ambient'] = { src, gain };
  }

  stopAmbient(fadeOut = 1.0) {
    const a = this._playing['ambient'];
    if (!a || !this._ctx) return;
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
  }

  getVolume(category) { return this._volumes[category] ?? 1; }

  setMute(muted) {
    this._muted = muted;
    if (this._master) this._master.gain.value = muted ? 0 : 1;
  }

  /** Passi del giocatore */
  playStep(surface = 'normal', isRunning = false) {
    this.playSfx(isRunning ? 'step_run' : 'step_normal', 0.6);
  }
}
