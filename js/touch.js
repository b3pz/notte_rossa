/* =============================================
   NOTTE ROSSA — touch.js
   Comandi touch per smartphone e tablet.
   Ogni pulsante simula il tasto corrispondente, così
   gioco, dialoghi e menu funzionano senza modifiche.
   ============================================= */

const BUTTONS = [
  // [id, testo, codice tasto, gruppo, tieni premuto?]
  ['tc-left',  '◀',      'KeyA',       'move',   true],
  ['tc-right', '▶',      'KeyD',       'move',   true],
  ['tc-run',   'CORRI',  'ShiftLeft',  'act',    true],
  ['tc-crouch','GIÙ',    'KeyC',       'act',    true],
  ['tc-use',   'E',      'KeyE',       'main',   false],
  ['tc-shoot', 'SPARA',  'KeyJ',       'main',   false],
  ['tc-reload','R',      'KeyR',       'small',  false],
  ['tc-torch', 'TORCIA', 'KeyF',       'small',  false],
  ['tc-inv',   'ZAINO',  'Tab',        'top',    false],
  ['tc-map',   'MAPPA',  'KeyM',       'top',    false],
  ['tc-pause', 'II',     'Escape',     'top',    false],
];

function sendKey(type, code) {
  const key = { Tab: 'Tab', Escape: 'Escape', ShiftLeft: 'Shift', Space: ' ' }[code] || code.replace('Key', '').toLowerCase();
  document.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true }));
}

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.enabled = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || /[?&]touch=1/.test(location.search);
    if (!this.enabled) return;
    document.body.classList.add('touch');
    this._build();
    setInterval(() => this._sync(), 150);
  }

  _build() {
    const root = document.createElement('div');
    root.id = 'touch-controls';
    const groups = {};
    for (const g of ['move', 'act', 'main', 'small', 'top']) {
      groups[g] = document.createElement('div');
      groups[g].className = 'tc-group tc-' + g;
      root.appendChild(groups[g]);
    }
    for (const [id, label, code, group, hold] of BUTTONS) {
      const b = document.createElement('button');
      b.id = id;
      b.className = 'tc-btn';
      b.textContent = label;
      const down = (e) => {
        e.preventDefault();
        b.classList.add('on');
        sendKey('keydown', code);
        if (!hold) setTimeout(() => sendKey('keyup', code), 90);
      };
      const up = (e) => {
        e.preventDefault();
        b.classList.remove('on');
        if (hold) sendKey('keyup', code);
      };
      b.addEventListener('touchstart', down, { passive: false });
      b.addEventListener('touchend', up, { passive: false });
      b.addEventListener('touchcancel', up, { passive: false });
      // anche col mouse (utile per provare)
      b.addEventListener('mousedown', down);
      b.addEventListener('mouseup', up);
      b.addEventListener('mouseleave', (e) => { if (b.classList.contains('on')) up(e); });
      groups[group].appendChild(b);
    }
    document.getElementById('game-wrapper').appendChild(root);

    const rot = document.createElement('div');
    rot.id = 'rotate-hint';
    rot.innerHTML = '<div>⟳</div><div>Ruota il telefono in orizzontale</div>';
    document.getElementById('game-wrapper').appendChild(rot);

    // il tocco sul box del dialogo lo fa avanzare (già gestito dal click); niente zoom col doppio tocco
    document.addEventListener('dblclick', e => e.preventDefault());
    this.root = root;
  }

  /** Mostra i comandi solo durante la partita e quando non ci sono menu sopra */
  _sync() {
    const g = this.game;
    const show = g.running && !g._ended;
    this.root.classList.toggle('visible', show);
    const w = g.weapon?.equipped;
    document.getElementById('tc-shoot').classList.toggle('dim', !w);
    document.getElementById('tc-reload').classList.toggle('dim', !w);
    document.getElementById('tc-torch').classList.toggle('dim', !g.inventory?.hasItem('flashlight'));
    const near = g.roomManager?._near;
    document.getElementById('tc-use').classList.toggle('pulse', !!near);
  }
}
