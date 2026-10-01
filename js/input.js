/* =============================================
   NOTTE ROSSA — input.js
   Gestione centralizzata dei controlli
   ============================================= */

export class InputManager {
  constructor() {
    // Stato tasti (true = premuto)
    this.keys = {};
    // Stato precedente (per rilevare "appena premuto")
    this._prev = {};
    // Mouse
    this.mouse = { x: 0, y: 0, left: false, right: false };
    this._mousePrev = { left: false, right: false };

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
  }

  /** Azione attualmente mantenuta */
  isDown(action) {
    const keys = this.bindings[action];
    if (!keys) return false;
    for (const k of keys) {
      if (k === 'Mouse0' && this.mouse.left)  return true;
      if (k === 'Mouse1' && this.mouse.right) return true;
      if (this.keys[k]) return true;
    }
    return false;
  }

  /** Azione appena premuta questo frame */
  justPressed(action) {
    const keys = this.bindings[action];
    if (!keys) return false;
    for (const k of keys) {
      if (k === 'Mouse0') { if ((this.mouse.left && !this._mousePrev.left) || this._tapped.has('Mouse0')) return true; continue; }
      if (k === 'Mouse1') { if (this.mouse.right && !this._mousePrev.right) return true; continue; }
      if ((this.keys[k] && !this._prev[k]) || (this._tapped.has(k) && !this._prev[k])) return true;
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
  get locked() { return !!this._locked; }

  /** Pulisce tutti i tasti (evita ghost key) */
  flush() {
    this._tapped.clear();
    this.keys = {};
    this._prev = {};
    this.mouse.left = false;
    this.mouse.right = false;
  }
}
