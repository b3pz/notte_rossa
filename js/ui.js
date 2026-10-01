/* =============================================
   NOTTE ROSSA — ui.js
   HUD, overlay (inventario, mappa, documenti, pausa,
   radio, game over, finale), notifiche, capitoli
   ============================================= */

import { HEALTH_STATE } from './player.js';
import { SpriteLib } from './sprites.js';
import { INV_SLOTS } from './inventory.js';

const $ = (id) => document.getElementById(id);

export class UIManager {
  constructor(game) {
    this.game = game;
    this.$hud          = $('hud');
    this.$room         = $('hud-room');
    this.$ammoBox      = $('hud-ammo');
    this.$ammoIcon     = $('hud-ammo-icon');
    this.$ammoMag      = $('hud-ammo-mag');
    this.$ammoTotal    = $('hud-ammo-total');
    this.$healthFill   = $('hud-health-fill');
    this.$healthStatus = $('hud-health-status');
    this.$flashBox     = $('hud-flashlight');
    this.$battFill     = $('hud-battery-fill');
    this.$battPct      = $('hud-battery-pct');
    this.$interPrompt  = $('interact-prompt');
    this.$interLabel   = $('interact-label');

    this.$inventory = $('inventory-screen');
    this.$mapScreen = $('map-screen');
    this.$docScreen = $('document-screen');
    this.$docsList  = $('docs-list-screen');
    this.$pause     = $('pause-screen');
    this.$gameOver  = $('gameover-screen');
    this.$save      = $('save-screen');
    this.$notif     = $('notification');
    this.$notifText = $('notification-text');
    this.$fade      = $('fade-overlay');
    this.$cinTitle  = $('cinematic-title');
    this.$chapter   = $('chapter-card');
    this.$ending    = $('ending-screen');
    this.$debug     = $('debug-panel');

    this._notifTimer = null;
    this._stack = [];
    this._bindButtons();
  }

  _bindButtons() {
    const g = this.game;
    const on = (id, fn) => $(id)?.addEventListener('click', fn);

    on('btn-resume',     () => g.togglePause());
    on('btn-pause-inv',  () => { g.togglePause(); this.openInventory(); });
    on('btn-pause-map',  () => { g.togglePause(); this.openMap(); });
    on('btn-pause-docs', () => { g.togglePause(); this.openDocsList(); });
    on('btn-pause-menu', () => g.returnToMenu());

    on('btn-go-load', () => g.restartFromDeath());
    on('btn-go-menu', () => { this.hideGameOver(); g.returnToMenu(); });

    for (let i = 0; i < 3; i++) {
      on(`btn-save-slot${i}`, () => {
        if (g.save.saveGame(i)) this.showNotification(`Partita salvata nello slot ${i + 1}`);
        this.closeSaveScreen();
      });
    }
    on('btn-save-close', () => this.closeSaveScreen());
    on('btn-ending-menu', () => { this.$ending.classList.add('hidden'); g.returnToMenu(); });

    document.addEventListener('keydown', e => {
      if (!g.running) return;
      if (e.code === 'Escape') {
        if (this._stack.length > 0) this.closeTopOverlay();
        else if (!g.dialogue.isActive()) g.togglePause();
        return;
      }
      const top = this._stack[this._stack.length - 1];
      if (e.code === 'Tab' && top === this.$inventory) { e.preventDefault(); g.input.consume('Tab'); this.closeTopOverlay(); }
      if (e.code === 'KeyM' && top === this.$mapScreen) { g.input.consume('KeyM'); this.closeTopOverlay(); }
      if (['KeyE', 'Space', 'Enter'].includes(e.code) && top === this.$docScreen) { e.preventDefault(); g.input.consume(e.code); this.closeTopOverlay(); }
    });
  }

  /* ── HUD ── */
  showHUD() { this.$hud?.classList.remove('hidden'); }
  hideHUD() { this.$hud?.classList.add('hidden'); this.hideInteractPrompt(); }

  updateHUD() {
    const g = this.game, p = g.player;
    if (!p) return;
    const pct = p.hp / p.maxHp * 100;
    this.$healthFill.style.width = pct + '%';
    this.$healthFill.className = p.healthState === HEALTH_STATE.CAUTION ? 'caution' : p.healthState === HEALTH_STATE.DANGER ? 'danger' : '';
    this.$healthStatus.textContent = { FINE: 'BENE', CAUTION: 'FERITO', DANGER: 'GRAVE' }[p.healthState];

    if (g.inventory.hasItem('flashlight')) {
      this.$flashBox.classList.remove('hidden');
      this.$battFill.style.width = p.battery + '%';
      this.$battFill.className = p.battery < 20 ? 'low' : '';
      this.$battPct.textContent = Math.round(p.battery) + '%';
    } else {
      this.$flashBox.classList.add('hidden');
    }

    const w = g.weapon.equipped;
    if (w) {
      this.$ammoBox.classList.remove('hidden');
      const icon = SpriteLib.icon(w.def.ammoItem === 'ammo_shells' ? 'ammo_shells' : 'ammo_pistol');
      if (this.$ammoIcon.getAttribute('src') !== icon) this.$ammoIcon.setAttribute('src', icon);
      this.$ammoMag.textContent = w.isReloading ? '··' : w.ammoInMag;
      this.$ammoTotal.textContent = g.weapon.ammoReserve;
    } else {
      this.$ammoBox.classList.add('hidden');
    }
    const name = g.roomManager.current?.name || '';
    if (this.$room.textContent !== name) this.$room.textContent = name;
  }

  setObjective(text) {
    if (!this.$objective) this.$objective = $('hud-objective-text');
    if (this.$objective && this._objText !== text) {
      this._objText = text;
      this.$objective.textContent = text;
      const box = $('hud-objective');
      box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
    }
  }

  showInteractPrompt(label) {
    this.$interPrompt.classList.remove('hidden');
    this.$interLabel.textContent = label || 'Esamina';
  }
  hideInteractPrompt() { this.$interPrompt?.classList.add('hidden'); }

  showNotification(text, duration = 2600) {
    this.$notifText.textContent = text;
    this.$notif.classList.remove('hidden');
    this.$notif.classList.add('show');
    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => {
      this.$notif.classList.remove('show');
      setTimeout(() => this.$notif.classList.add('hidden'), 400);
    }, duration);
  }

  showChapter(text) {
    $('chapter-text').textContent = text;
    this.$chapter.classList.remove('hidden');
    requestAnimationFrame(() => this.$chapter.classList.add('show'));
    setTimeout(() => {
      this.$chapter.classList.remove('show');
      setTimeout(() => this.$chapter.classList.add('hidden'), 900);
    }, 2200);
  }

  /* ── DOCUMENTI ── */
  showDocument(docId) {
    const doc = this.game.inventory.getDocument(docId);
    if (!doc) return;
    $('doc-title').textContent = doc.title || '—';
    $('doc-date').textContent  = doc.date || '';
    $('doc-body').textContent  = doc.text || '';
    this._open(this.$docScreen);
  }

  openDocsList() {
    const box = $('docs-list');
    box.innerHTML = '';
    const docs = this.game.inventory.getDocuments();
    if (!docs.length) box.innerHTML = '<div class="docs-empty">Nessun documento trovato.</div>';
    for (const d of docs) {
      const row = document.createElement('div');
      row.className = 'doc-row';
      row.innerHTML = `<span>${d.title}</span><span class="d">${d.date || ''}</span>`;
      row.addEventListener('click', () => this.showDocument(d.id));
      box.appendChild(row);
    }
    this._open(this.$docsList);
  }

  /* ── INVENTARIO ── */
  openInventory() {
    this._renderInventory();
    $('item-detail-name').textContent = '';
    $('item-detail-desc').textContent = 'Seleziona un oggetto.';
    $('item-detail-actions').innerHTML = '';
    this._open(this.$inventory);
  }

  _renderInventory() {
    const inv = this.game.inventory, grid = $('inventory-grid');
    grid.innerHTML = '';
    const slots = inv.getSlots();
    for (let i = 0; i < INV_SLOTS; i++) {
      const item = slots[i];
      const el = document.createElement('div');
      el.className = 'inv-slot' + (item ? '' : ' empty');
      if (item) {
        const src = SpriteLib.icon(item.icon);
        const equipped = item.type === 'weapon' && this.game.weapon.equipped?.id === item.weaponId;
        el.innerHTML = `
          <div class="slot-icon">${src ? `<img src="${src}" alt="">` : '▪'}</div>
          <div class="slot-name">${item.name}${equipped ? ' ●' : ''}</div>
          ${item.qty > 1 ? `<div class="slot-qty">${item.qty}</div>` : ''}`;
        el.addEventListener('click', () => this._selectItem(i, item));
      }
      grid.appendChild(el);
    }
    // aggiungi scorciatoia ai documenti
    const docsBtn = document.createElement('button');
    docsBtn.className = 'item-action-btn';
    docsBtn.style.gridColumn = '1 / -1';
    docsBtn.textContent = `DOCUMENTI (${inv.getDocuments().length})`;
    docsBtn.addEventListener('click', () => this.openDocsList());
    grid.appendChild(docsBtn);
  }

  _selectItem(index, item) {
    document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('selected'));
    document.querySelectorAll('.inv-slot')[index]?.classList.add('selected');
    $('item-detail-name').textContent = item.name;
    $('item-detail-desc').textContent = item.description || '';
    const actions = $('item-detail-actions');
    actions.innerHTML = '';
    const add = (label, fn) => {
      const b = document.createElement('button');
      b.className = 'item-action-btn';
      b.textContent = label;
      b.addEventListener('click', fn);
      actions.appendChild(b);
    };
    const inv = this.game.inventory;
    const refresh = () => { this._renderInventory(); const it = inv.getSlots()[index]; if (it) this._selectItem(index, it); else $('item-detail-actions').innerHTML = ''; };
    if (item.usable) add('USA', () => { inv.useItem(index); if (this._stack.includes(this.$inventory)) refresh(); });
    if (item.equippable) {
      const eq = item.type === 'weapon' && this.game.weapon.equipped?.id === item.weaponId;
      add(item.id === 'flashlight' ? (this.game.player.flashlightOn ? 'SPEGNI' : 'ACCENDI') : (eq ? 'RIPONI' : 'IMPUGNA'),
        () => { inv.equipItem(index); refresh(); });
    }
    if (item.type !== 'key' && item.type !== 'weapon') add('LASCIA', () => { inv.dropItem(index); refresh(); });
  }

  /* ── MAPPA ── */
  openMap() {
    this._open(this.$mapScreen);
    this._renderMap();
  }

  _renderMap() {
    const canvas = $('map-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rm = this.game.roomManager;
    const rows = ['Stazione', '', 'Città', 'Ospedale', 'Sotterranei', 'Laboratorio', 'Porto'];
    const nodeW = 118, nodeH = 42, gapX = 12, gapY = 22, left = 130, top = 20;

    ctx.font = '11px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    rows.forEach((r, i) => {
      ctx.fillStyle = '#6a6058';
      ctx.fillText(r.toUpperCase(), 12, top + i * (nodeH + gapY) + nodeH / 2);
    });
    for (const [id, room] of Object.entries(rm.roomData)) {
      const mp = room.mapPos;
      if (!mp) continue;
      const st = rm.roomStates[id];
      const x = left + mp.col * (nodeW + gapX), y = top + mp.row * (nodeH + gapY);
      const here = rm.current?.id === id;
      ctx.fillStyle = st?.visited ? (room.safe ? '#16261c' : '#1c2230') : '#0c0e12';
      ctx.fillRect(x, y, nodeW, nodeH);
      ctx.strokeStyle = here ? '#c0152a' : (st?.visited ? '#4a5870' : '#22252c');
      ctx.lineWidth = here ? 2 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, nodeW - 1, nodeH - 1);
      ctx.fillStyle = st?.visited ? '#b8b0a4' : '#34383f';
      const label = st?.visited ? room.name : '???';
      this._wrapText(ctx, label, x + 6, y + nodeH / 2, nodeW - 12);
    }
    ctx.fillStyle = '#6a6058';
    ctx.fillText('verde = zona sicura (radio)    rosso = sei qui', left, canvas.height - 14);
  }

  _wrapText(ctx, text, x, cy, maxW) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    lines.push(cur);
    const lh = 12, y0 = cy - (lines.length - 1) * lh / 2;
    lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, x, y0 + i * lh));
  }

  /* ── PAUSA / RADIO / GAME OVER / FINALE ── */
  openPause()  { this._open(this.$pause); }
  closePause() { this._close(this.$pause); }

  openSaveScreen()  { this._open(this.$save); }
  closeSaveScreen() { this._close(this.$save); }

  showGameOver() { setTimeout(() => this.$gameOver.classList.remove('hidden'), 1600); }
  hideGameOver() { this.$gameOver.classList.add('hidden'); }

  showEnding({ title, text, stats }) {
    this.hideHUD();
    $('ending-title').textContent = title;
    $('ending-text').textContent  = text;
    $('ending-stats').textContent = stats;
    this.$ending.classList.remove('hidden');
    this.fadeIn(10);
  }

  fadeOut(ms = 600, cb) {
    this.$fade.style.transition = `opacity ${ms}ms ease`;
    this.$fade.classList.add('fade-in');
    if (cb) setTimeout(cb, ms);
  }
  fadeIn(ms = 600, cb) {
    this.$fade.style.transition = `opacity ${ms}ms ease`;
    this.$fade.classList.remove('fade-in');
    if (cb) setTimeout(cb, ms);
  }

  showCinematicTitle(duration = 4) {
    this.$cinTitle.classList.remove('hidden');
    requestAnimationFrame(() => this.$cinTitle.classList.add('visible'));
    setTimeout(() => {
      this.$cinTitle.classList.remove('visible');
      setTimeout(() => this.$cinTitle.classList.add('hidden'), 1000);
    }, duration * 1000);
  }

  /* ── DEBUG ── */
  updateDebug(fps, player, roomId, enemyCount, flags) {
    if (!this.game.debug) return;
    $('dbg-fps').textContent   = `FPS: ${fps}`;
    $('dbg-pos').textContent   = `X:${Math.round(player.x)} Y:${Math.round(player.y)}`;
    $('dbg-room').textContent  = `Stanza: ${roomId || '—'}`;
    $('dbg-state').textContent = `Nemici vivi: ${enemyCount}`;
    $('dbg-flags').textContent = `Flag: ${Object.entries(flags || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || '—'}`;
  }
  toggleDebug(on) { this.$debug?.classList.toggle('hidden', !on); }

  /* ── PILA OVERLAY ── */
  _open(el) {
    if (!el) return;
    el.classList.remove('hidden');
    this._stack = this._stack.filter(e => e !== el);
    this._stack.push(el);
    this.game.input.lock();
    this.hideInteractPrompt();
  }

  _close(el) {
    if (!el) return;
    el.classList.add('hidden');
    this._stack = this._stack.filter(e => e !== el);
    if (el === this.$pause) this.game.paused = false;
    if (this._stack.length === 0 && !this.game.dialogue.isActive() && !this.game.events.isRunning()) {
      this.game.input.unlock();
    }
  }

  closeTopOverlay() {
    const top = this._stack[this._stack.length - 1];
    if (top) this._close(top);
  }

  hasOpenOverlay() { return this._stack.length > 0; }

  resetOverlays() {
    for (const el of [this.$inventory, this.$mapScreen, this.$docScreen, this.$docsList, this.$pause, this.$save, this.$gameOver, this.$ending]) {
      el?.classList.add('hidden');
    }
    this._stack = [];
  }
}
