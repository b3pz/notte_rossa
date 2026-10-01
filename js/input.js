/* =============================================
   NOTTE ROSSA — input.js
   Gestione centralizzata dei controlli
   ============================================= */

// Costanti per calibrazione controller
let PADCAL = {};
const HAT_SEEN = {};
try { PADCAL = JSON.parse(localStorage.getItem('notte_rossa-padcal') || '{}'); } catch (e) { PADCAL = {}; }
function savePadCal() { try { localStorage.setItem('notte_rossa-padcal', JSON.stringify(PADCAL)); } catch (e) {} }

// Nomi pulsanti PlayStation e Xbox
const PAD_NAMES_PS = ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'SELECT', 'START', 'L3', 'R3', '↑', '↓', '←', '→', 'PS'];
const PAD_NAMES_XB = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'VIEW', 'MENU', 'L3', 'R3', '↑', '↓', '←', '→', 'XBOX'];

// Mappatura azioni → pulsanti pad
const PADMAP = {
  moveLeft:   [14],          // D-pad left
  moveRight:  [15],          // D-pad right
  interact:   [0, 2],        // A o X (✕ o □)
  flashlight: [6],           // LT (L2)
  action:     [0],           // A (✕)
  aim:        [4],           // LB (L1)
  shoot:      [5],           // RB (R1)
  reload:     [1],           // B (○)
  inventory:  [9],           // MENU/START
  map:        [8],           // VIEW/SELECT
  pause:      [9],           // MENU/START
  crouch:     [2],           // X (□)
  debug:      [],            // Non supportato su pad
};

// Preset controller noti
const PAD_PRESETS = [
  { test: /054c.*0cda/i, name: 'PLAYSTATION CLASSIC', cal: [{ b: 2 }, { b: 1 }, { b: 3 }, { b: 0 }, { b: 6 }, { b: 7 }, { b: 4 }, { b: 5 }, { b: 8 }, { b: 9 }, null, null, { a: 1, v: -1 }, { a: 1, v: 1 }, { a: 0, v: -1 }, { a: 0, v: 1 }, null] },
];

// Utility per hat switch (d-pad analogico generico)
function hatDir(v) {
  if (v === undefined || Math.abs(v) > 1.05) return null;
  const dirs = [[-1, 'u'], [-0.714, 'ur'], [-0.428, 'r'], [-0.142, 'dr'], [0.142, 'd'], [0.428, 'dl'], [0.714, 'l'], [1, 'ul']];
  let best = null, bd = 0.15;
  for (const [x, n] of dirs) if (Math.abs(v - x) < bd) { bd = Math.abs(v - x); best = n; }
  return best;
}

// Verifica se un sorgente pad è premuta
function srcOn(p, s) {
  if (!s) return false;
  if (s.b !== undefined) return !!(p.buttons[s.b] && p.buttons[s.b].pressed);
  if (s.a !== undefined) { const v = p.axes[s.a]; if (v === undefined) return false; return s.h ? (hatDir(v) || '').includes(s.h) : Math.abs(v - s.v) < 0.25; }
  return false;
}

// Rileva stile controller (PS o Xbox)
function detectPadStyle() {
  const ps = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  for (const p of ps) {
    const id = (p.id || '').toLowerCase();
    if (/xbox|045e|xinput|microsoft/.test(id)) return 'xbox';
    if (/playstation|dualsense|dualshock|054c|wireless controller|sony/.test(id)) return 'ps';
  }
  return 'ps';
}

// Preset controller
function padPreset(p) {
  return p.mapping === 'standard' ? null : PAD_PRESETS.find((q) => q.test.test(p.id || '')) || null;
}

// Ottiene stato pulsanti con calibrazione
function padButtons(p) {
  const pre = padPreset(p);
  const cal = PADCAL[p.id] || (pre && pre.cal);
  const out = [];
  if (cal) {
    for (let i = 0; i < 17; i++) out[i] = srcOn(p, cal[i]);
    return out;
  }
  for (let i = 0; i < 17; i++) out[i] = !!(p.buttons[i] && p.buttons[i].pressed);
  if (p.mapping !== 'standard') {
    const seen = HAT_SEEN[p.index] || (HAT_SEEN[p.index] = {});
    p.axes.forEach((v, a) => { if (Math.abs(v) > 1.05) seen[a] = true; });
    for (let a = 9; a >= 2; a--) {
      const d = seen[a] && hatDir(p.axes[a]);
      if (d) {
        if (d.includes('u')) out[12] = true;
        if (d.includes('d')) out[13] = true;
        if (d.includes('l')) out[14] = true;
        if (d.includes('r')) out[15] = true;
        break;
      }
    }
  }
  return out;
}

export class InputManager {
  constructor() {
    // Stato tasti (true = premuto)
    this.keys = {};
    // Comandi "virtuali" impostati dal touch o dal cammino automatico
    this.virtual = {};
    // Stato precedente (per rilevare "appena premuto")
    this._prev = {};
    // Mouse
    this.mouse = { x: 0, y: 0, left: false, right: false };
    this._mousePrev = { left: false, right: false };

    // Stato pad precedente (per edge detection)
    this._padPrev = {};

    // Mappa controlli: azione → lista tasti
    this.bindings = {
      moveLeft:    ['KeyA', 'ArrowLeft'],
      moveRight:   ['KeyD', 'ArrowRight'],
      run:         ['ShiftLeft', 'ShiftRight'],
      interact:    ['KeyE', 'Enter'],
      flashlight:  ['KeyF'],
      action:      ['Space'],
      aim:         ['ControlLeft', 'ControlRight', 'Mouse1'],
      shoot:       ['Mouse0', 'Space', 'KeyJ'],
      reload:      ['KeyR'],
      inventory:   ['Tab'],
      map:         ['KeyM'],
      pause:       ['Escape'],
      crouch:      ['KeyC'],
      debug:       ['F1'],
    };

    this._bindEvents();
  }

  /** Enumera controller connessi */
  getConnectedPads() {
    const out = [];
    const ps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of ps) if (p && p.connected) out.push(p);
    return out;
  }

  _bindEvents() {
    this._tapped = new Set();   // tasti premuti dall'ultimo frame (anche se già rilasciati)
    window.addEventListener('keydown', e => {
      if (!e.repeat) this._tapped.add(e.code);
      this.keys[e.code] = true;
      e.preventDefault && ['Tab','Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code) && e.preventDefault();
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
    window.addEventListener('mousedown', e => {
      if (e.button === 0) { this.mouse.left = true; this._tapped.add('Mouse0'); }
      if (e.button === 2) this.mouse.right = true;
    });
    window.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouse.left  = false;
      if (e.button === 2) this.mouse.right = false;
    });
    window.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('contextmenu', e => e.preventDefault());
  }

  /** Aggiorna lo stato precedente — chiamare una volta per frame DOPO aver letto */
  update() {
    this._tapped.clear();
    this._prev = { ...this.keys };
    this._mousePrev = { ...this.mouse };
    // Salva stato pad per edge detection
    for (const p of this.getConnectedPads()) {
      this._padPrev[p.index] = padButtons(p);
    }
  }

  /** Azione attualmente mantenuta */
  isDown(action) {
    if (this.virtual[action]) return true;
    const keys = this.bindings[action];
    if (!keys) return false;

    // Controlla tastiera
    for (const k of keys) {
      if (k === 'Mouse0' && this.mouse.left)  return true;
      if (k === 'Mouse1' && this.mouse.right) return true;
      if (this.keys[k]) return true;
    }

    // Controlla gamepad
    const padBtns = PADMAP[action];
    if (padBtns && padBtns.length > 0) {
      for (const p of this.getConnectedPads()) {
        const b = padButtons(p);
        if (padBtns.some((idx) => b[idx])) return true;
      }
    }

    // Controlla assi analogici per movimento
    if (action === 'moveLeft' || action === 'moveRight') {
      for (const p of this.getConnectedPads()) {
        if (action === 'moveLeft' && p.axes[0] < -0.35) return true;
        if (action === 'moveRight' && p.axes[0] > 0.35) return true;
      }
    }
    if (action === 'run') {
      for (const p of this.getConnectedPads()) {
        const b = padButtons(p);
        if (b[10] || b[11]) return true;  // L3 o R3 (analogici pressati)
      }
    }

    return false;
  }

  /** Azione appena premuta questo frame */
  justPressed(action) {
    const keys = this.bindings[action];
    if (!keys) return false;

    // Controlla tastiera
    for (const k of keys) {
      if (k === 'Mouse0') { if ((this.mouse.left && !this._mousePrev.left) || this._tapped.has('Mouse0')) return true; continue; }
      if (k === 'Mouse1') { if (this.mouse.right && !this._mousePrev.right) return true; continue; }
      if ((this.keys[k] && !this._prev[k]) || (this._tapped.has(k) && !this._prev[k])) return true;
    }

    // Controlla gamepad
    const padBtns = PADMAP[action];
    if (padBtns && padBtns.length > 0) {
      for (const p of this.getConnectedPads()) {
        const b = padButtons(p);
        const prev = this._padPrev[p.index] || [];
        if (padBtns.some((idx) => b[idx] && !prev[idx])) return true;
      }
    }

    return false;
  }

  /** Tasto raw appena premuto */
  keyJustPressed(code) {
    return this.keys[code] && !this._prev[code];
  }

  /** Imposta binding custom */
  rebind(action, keyCodes) {
    this.bindings[action] = keyCodes;
  }

  /** Segna un tasto come già usato (non conta come "appena premuto") */
  consume(code) { this._prev[code] = true; this._tapped.delete(code); }

  /** Blocca temporaneamente l'input (es. durante cutscene) */
  lock()   { this._locked = true; }
  unlock() { this._locked = false; }
  /** Bloccato se qualcuno l'ha bloccato esplicitamente O se lo stato del gioco lo richiede
      (menu aperto, dialogo, scena, cambio stanza...). Calcolato ogni volta: non può "restare incastrato". */
  get locked() { return !!this._locked || !!(this.lockCheck && this.lockCheck()); }

  /** Pulisce tutti i tasti (evita ghost key) */
  flush() {
    this._tapped.clear();
    this.virtual = {};
    this.keys = {};
    this._prev = {};
    this.mouse.left = false;
    this.mouse.right = false;
  }
}
