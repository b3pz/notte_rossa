/* =============================================
   NOTTE ROSSA — touch.js
   Comandi a schermo per telefono e tablet.
   I pulsanti "premono" i tasti della tastiera, così tutto il
   resto del gioco (dialoghi, inventario, pausa) funziona uguale.
   ============================================= */

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.enabled = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 ||
      window.matchMedia?.('(pointer: coarse)').matches;
    this.$root = document.getElementById('touch-controls');
    if (!this.enabled || !this.$root) return;
    document.body.classList.add('touch');
    this._run = false;
    this._crouch = false;

    // tenere premuto
    this._hold('tc-left',  'ArrowLeft');
    this._hold('tc-right', 'ArrowRight');
    this._hold('tc-shoot', 'TouchShoot');
    this._hold('tc-aim',   'TouchAim');
    // pressione singola (evento vero: lo sentono anche dialoghi e menu)
    this._tap('tc-use',    'KeyE');
    this._tap('tc-reload', 'KeyR');
    this._tap('tc-light',  'KeyF');
    this._tap('tc-inv',    'Tab');
    this._tap('tc-map',    'KeyM');
    this._tap('tc-pause',  'Escape');
    // interruttori
    this._toggle('tc-run',    'ShiftLeft', v => { this._run = v; });
    this._toggle('tc-crouch', 'KeyC',      v => { this._crouch = v; });

    const inp = game.input;
    inp.bindings.shoot.push('TouchShoot');
    inp.bindings.aim.push('TouchAim');
  }

  _btn(id) { return document.getElementById(id); }

  _hold(id, code) {
    const el = this._btn(id); if (!el) return;
    // input.keys viene ricreato da flush(): va letto ogni volta
    const down = e => { e.preventDefault(); this.game.input.keys[code] = true;  el.classList.add('on'); };
    const up   = e => { e.preventDefault(); this.game.input.keys[code] = false; el.classList.remove('on'); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
  }

  _tap(id, code) {
    const el = this._btn(id); if (!el) return;
    el.addEventListener('touchstart', e => {
      e.preventDefault();
      el.classList.add('on');
      document.dispatchEvent(new KeyboardEvent('keydown', { code, key: code, bubbles: true }));
      setTimeout(() => {
        document.dispatchEvent(new KeyboardEvent('keyup', { code, key: code, bubbles: true }));
        el.classList.remove('on');
      }, 90);
    }, { passive: false });
  }

  _toggle(id, code, cb) {
    const el = this._btn(id); if (!el) return;
    el.addEventListener('touchstart', e => {
      e.preventDefault();
      const v = !el.classList.contains('on');
      el.classList.toggle('on', v);
      this.game.input.keys[code] = v;
      cb(v);
    }, { passive: false });
  }

  show() { if (this.enabled) this.$root?.classList.remove('hidden'); }
  hide() { this.$root?.classList.add('hidden'); }

  /** Chiamato ogni frame: mostra solo i pulsanti che servono */
  update() {
    if (!this.enabled) return;
    const g = this.game;
    this.$root.classList.toggle('armed', !!g.weapon?.equipped);
    this.$root.classList.toggle('overlay', g.ui.hasOpenOverlay() || g.paused);
    // l'input.flush() delle transizioni cancella i tasti: ripristina gli interruttori
    if (this._run) g.input.keys.ShiftLeft = true;
    if (this._crouch) g.input.keys.KeyC = true;
  }

  /** Su telefono: schermo intero e orizzontale all'avvio della partita */
  enterFullscreen() {
    if (!this.enabled) return;
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    try {
      const p = req?.call(el);
      p?.then?.(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
    } catch (_) { /* non supportato: pazienza */ }
  }
}
