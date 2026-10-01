/* =============================================
   NOTTE ROSSA — touch.js
   Comandi per smartphone, quasi senza pulsanti:
   - trascina il pollice nella metà sinistra  → muoviti
     (poco = passo silenzioso, medio = cammina, tanto = corri)
   - tocca una porta, un oggetto, una persona → ci vai e interagisci
   - tocca un nemico                          → spari
   - pulsante contestuale in basso a destra   → E / spara, solo quando serve
   - in alto: zaino e pausa; tocca la TORCIA nell'HUD per accenderla
   ============================================= */

const DEAD = 12, SNEAK = 38, RUN = 95;   // soglie di trascinamento (px schermo)

function sendKey(code) {
  const key = { Tab: 'Tab', Escape: 'Escape' }[code] || code.replace('Key', '').toLowerCase();
  document.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true }));
  setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', { code, key, bubbles: true })), 60);
}

const ICON_BAG = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 7V5a4 4 0 0 1 8 0v2"/><rect x="4" y="7" width="16" height="14" rx="3"/><path d="M9 13h6"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
const ICON_HAND = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.6-2.2L3.6 15.4a1.6 1.6 0 0 1 2.4-2.1L8 15"/></svg>';
const ICON_AIM = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/></svg>';

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.enabled = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /[?&]touch=1/.test(location.search);
    if (!this.enabled) return;
    document.body.classList.add('touch');
    this._stick = null;     // { id, x0, y0 }
    this._taps = {};        // touch in corso che potrebbero essere tocchi
    this._build();
    this._bind();
    setInterval(() => this._sync(), 120);
  }

  _build() {
    const wrap = document.getElementById('game-wrapper');
    const top = document.createElement('div');
    top.id = 'tc-top';
    top.innerHTML = `<button id="tc-bag" aria-label="Zaino">${ICON_BAG}</button><button id="tc-pause" aria-label="Pausa">${ICON_PAUSE}</button>`;
    wrap.appendChild(top);

    const act = document.createElement('button');
    act.id = 'tc-action';
    wrap.appendChild(act);

    const ring = document.createElement('div');
    ring.id = 'tc-ring';
    ring.innerHTML = '<div id="tc-knob"></div>';
    wrap.appendChild(ring);

    const hint = document.createElement('div');
    hint.id = 'tc-hint';
    hint.innerHTML = 'Trascina a sinistra per muoverti · Tocca porte e oggetti per usarli · Tocca un nemico per sparare';
    wrap.appendChild(hint);

    const rot = document.createElement('div');
    rot.id = 'rotate-hint';
    rot.innerHTML = '<div>⟳</div><div>Ruota il telefono in orizzontale</div>';
    wrap.appendChild(rot);

    const tap = (el, fn) => {
      el.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive: false });
      el.addEventListener('click', e => { e.stopPropagation(); fn(); });
    };
    tap(top.querySelector('#tc-bag'), () => sendKey('Tab'));
    tap(top.querySelector('#tc-pause'), () => sendKey('Escape'));
    tap(act, () => this._action());
    const torch = document.getElementById('hud-flashlight');
    if (torch) tap(torch, () => sendKey('KeyF'));

    this.$top = top; this.$act = act; this.$ring = ring; this.$knob = ring.firstChild; this.$hint = hint;
  }

  /** In gioco, senza menu sopra e senza editor */
  _playing() {
    const g = this.game;
    return g.running && !g._ended && !g.paused && !g.editor?.on;
  }

  _bind() {
    const canvas = this.game.canvas;
    const opts = { passive: false };
    // i tocchi sul canvas (e su ciò che gli sta sopra senza essere un pulsante)
    document.getElementById('game-wrapper').addEventListener('touchstart', e => this._start(e), opts);
    window.addEventListener('touchmove', e => this._moveT(e), opts);
    window.addEventListener('touchend', e => this._end(e), opts);
    window.addEventListener('touchcancel', e => this._end(e), opts);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  _isUi(target) {
    return !!target.closest('button, input, .inventory-panel, .pause-panel, .save-panel, .map-panel, .document-panel, .gameover-panel, .ending-panel, #layout-editor, .screen');
  }

  _start(e) {
    if (!this._playing()) return;
    const g = this.game;
    for (const t of e.changedTouches) {
      if (this._isUi(t.target)) continue;
      e.preventDefault();
      // dialogo aperto: un tocco ovunque lo fa avanzare
      if (g.dialogue.isActive()) { g.dialogue.advance(); continue; }
      const top = g.ui._stack[g.ui._stack.length - 1];
      if (top && top.id === 'document-screen') { g.ui.closeTopOverlay(); continue; }
      if (g.ui.hasOpenOverlay()) continue;
      this._taps[t.identifier] = { x0: t.clientX, y0: t.clientY, t0: performance.now(), left: t.clientX < window.innerWidth * 0.5 };
    }
  }

  _moveT(e) {
    const g = this.game;
    for (const t of e.changedTouches) {
      const tp = this._taps[t.identifier];
      if (!tp) continue;
      e.preventDefault();
      const dx = t.clientX - tp.x0, dy = t.clientY - tp.y0;
      if (!this._stick && tp.left && Math.hypot(dx, dy) > DEAD) {
        this._stick = { id: t.identifier, x0: tp.x0, y0: tp.y0 };
        tp.stick = true;
        g.autoWalk = null;
        this.$ring.style.left = tp.x0 + 'px';
        this.$ring.style.top = tp.y0 + 'px';
        this.$ring.classList.add('on');
        this.$hint.classList.add('gone');
      }
      if (this._stick?.id === t.identifier) this._applyStick(dx);
    }
  }

  _applyStick(dx) {
    const v = this.game.input.virtual, a = Math.abs(dx);
    const k = Math.max(-1, Math.min(1, dx / RUN));
    this.$knob.style.transform = `translate(${k * 42}px, 0)`;
    v.moveLeft = dx < -DEAD;
    v.moveRight = dx > DEAD;
    v.crouch = a > DEAD && a < SNEAK;
    v.run = a >= RUN;
  }

  _end(e) {
    const g = this.game;
    for (const t of e.changedTouches) {
      const tp = this._taps[t.identifier];
      delete this._taps[t.identifier];
      if (this._stick?.id === t.identifier) {
        this._stick = null;
        g.input.virtual.moveLeft = g.input.virtual.moveRight = g.input.virtual.run = g.input.virtual.crouch = false;
        this.$ring.classList.remove('on');
        this.$knob.style.transform = '';
        continue;
      }
      if (!tp || tp.stick) continue;
      const moved = Math.hypot(t.clientX - tp.x0, t.clientY - tp.y0);
      if (moved < 18 && performance.now() - tp.t0 < 400) this._tapWorld(t.clientX, t.clientY);
    }
  }

  /** Tocco nella scena: nemico → spara; porta/oggetto/persona → vai e usa */
  _tapWorld(cx, cy) {
    const g = this.game;
    if (!this._playing() || g.input.locked) return;
    const r = g.canvas.getBoundingClientRect();
    const wx = (cx - r.left) * 1280 / r.width + g.camera.x;
    const wy = (cy - r.top) * 720 / r.height + g.camera.y;
    const hit = g.pickAt(wx, wy);
    this.$hint.classList.add('gone');
    if (!hit) return;
    if (hit.kind === 'enemy') {
      if (g.weapon.equipped) g.shootAt(hit.obj);
      else g.ui.showNotification(g.inventory.hasItem('pistol') ? 'Impugna un\'arma dallo zaino' : 'Sei disarmato: scappa!');
      return;
    }
    g.walkTo(hit);
  }

  _action() {
    const g = this.game;
    if (!this._playing() || g.input.locked) return;
    if (g.weapon.equipped && g._target) { g.shootAt(g._target); return; }
    const n = g.roomManager._near;
    if (n) g._interact(n.kind, n.obj);
  }

  _sync() {
    const g = this.game, playing = this._playing();
    document.body.classList.toggle('tc-playing', playing);
    document.body.classList.toggle('tc-dialog', !!g.dialogue?.isActive());
    if (!playing) return;
    const near = g.roomManager?._near;
    const aim = g.weapon?.equipped && g._target;
    const html = aim ? ICON_AIM : near ? ICON_HAND : '';
    if (this.$act.dataset.k !== html) { this.$act.innerHTML = html; this.$act.dataset.k = html; }
    this.$act.className = aim ? 'aim show' : near ? 'use show' : '';
  }
}
