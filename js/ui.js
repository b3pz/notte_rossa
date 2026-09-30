/* =============================================
   NOTTE ROSSA — ui.js
   UIManager: HUD, schermate overlay, menu pause,
   game over, notifiche, documento
   ============================================= */

import { HEALTH_STATE } from './player.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // HUD refs
    this.$hud          = document.getElementById('hud');
    this.$ammoBox      = document.getElementById('hud-ammo');
    this.$ammoMag      = document.getElementById('hud-ammo-mag');
    this.$ammoTotal    = document.getElementById('hud-ammo-total');
    this.$healthFill   = document.getElementById('hud-health-fill');
    this.$healthStatus = document.getElementById('hud-health-status');
    this.$flashBox     = document.getElementById('hud-flashlight');
    this.$battFill     = document.getElementById('hud-battery-fill');
    this.$battPct      = document.getElementById('hud-battery-pct');
    this.$interPrompt  = document.getElementById('interact-prompt');
    this.$interLabel   = document.getElementById('interact-label');

    // Schermate overlay
    this.$inventory  = document.getElementById('inventory-screen');
    this.$mapScreen  = document.getElementById('map-screen');
    this.$docScreen  = document.getElementById('document-screen');
    this.$pause      = document.getElementById('pause-screen');
    this.$gameOver   = document.getElementById('gameover-screen');
    this.$save       = document.getElementById('save-screen');
    this.$notification= document.getElementById('notification');
    this.$notifText  = document.getElementById('notification-text');
    this.$fadeOvl    = document.getElementById('fade-overlay');
    this.$cinTitle   = document.getElementById('cinematic-title');
    this.$debug      = document.getElementById('debug-panel');

    this._notifTimer = null;
    this._overlayStack = [];   // stack di overlay aperti

    this._bindButtons();
  }

  _bindButtons() {
    const g = this.game;

    // Pausa
    document.getElementById('btn-resume')?.addEventListener('click', () => g.togglePause());
    document.getElementById('btn-pause-inv')?.addEventListener('click', () => { g.togglePause(); this.openInventory(); });
    document.getElementById('btn-pause-map')?.addEventListener('click', () => { g.togglePause(); this.openMap(); });
    document.getElementById('btn-pause-docs')?.addEventListener('click', () => { g.togglePause(); });
    document.getElementById('btn-pause-menu')?.addEventListener('click', () => g.returnToMenu());
    document.getElementById('btn-pause-opts')?.addEventListener('click', () => {});

    // Game Over
    document.getElementById('btn-go-load')?.addEventListener('click', () => { this.hideGameOver(); g.save.loadLast(); });
    document.getElementById('btn-go-menu')?.addEventListener('click', () => g.returnToMenu());

    // Radio / Save
    document.getElementById('btn-save-game')?.addEventListener('click', () => { g.save.saveGame(0); this.showNotification('Partita salvata'); });
    document.getElementById('btn-save-close')?.addEventListener('click', () => this.closeSaveScreen());
    document.getElementById('btn-save-docs')?.addEventListener('click', () => {});
    document.getElementById('btn-save-map')?.addEventListener('click', () => { this.closeSaveScreen(); this.openMap(); });

    // ESC globale
    document.addEventListener('keydown', e => {
      if (e.code === 'Escape') {
        if (this._overlayStack.length > 0) {
          this.closeTopOverlay();
        } else if (g.running) {
          g.togglePause();
        }
      }
    });
  }

  /* ── HUD ── */
  showHUD()  { this.$hud?.classList.remove('hidden'); }
  hideHUD()  { this.$hud?.classList.add('hidden'); }

  updateHUD() {
    const player = this.game.player;
    if (!player) return;

    // Salute
    const pct = player.hp / player.maxHp * 100;
    if (this.$healthFill) {
      this.$healthFill.style.width = pct + '%';
      this.$healthFill.className = '';
      if (player.healthState === HEALTH_STATE.CAUTION) this.$healthFill.classList.add('caution');
      if (player.healthState === HEALTH_STATE.DANGER)  this.$healthFill.classList.add('danger');
    }
    if (this.$healthStatus) this.$healthStatus.textContent = player.healthState;

    // Torcia
    const hasTorch = this.game.inventory?.hasItem('flashlight');
    if (hasTorch) {
      this.$flashBox?.classList.remove('hidden');
      const batt = player.battery;
      if (this.$battFill) {
        this.$battFill.style.width = batt + '%';
        this.$battFill.className = batt < 20 ? 'low' : '';
      }
      if (this.$battPct) this.$battPct.textContent = Math.round(batt) + '%';
    } else {
      this.$flashBox?.classList.add('hidden');
    }

    // Munizioni
    const weapon = this.game.weapon;
    if (weapon && weapon.equipped) {
      this.$ammoBox?.classList.remove('hidden');
      if (this.$ammoMag)   this.$ammoMag.textContent   = weapon.ammoInMag;
      if (this.$ammoTotal) this.$ammoTotal.textContent  = weapon.ammoReserve;
    } else {
      this.$ammoBox?.classList.add('hidden');
    }
  }

  /* ── PROMPT INTERAZIONE ── */
  showInteractPrompt(label) {
    this.$interPrompt?.classList.remove('hidden');
    if (this.$interLabel) this.$interLabel.textContent = label || 'Esamina';
  }
  hideInteractPrompt() {
    this.$interPrompt?.classList.add('hidden');
  }

  /* ── NOTIFICA ── */
  showNotification(text, duration = 2500) {
    if (!this.$notification) return;
    if (this.$notifText) this.$notifText.textContent = text;
    this.$notification.classList.remove('hidden');
    this.$notification.classList.add('show');
    clearTimeout(this._notifTimer);
    this._notifTimer = setTimeout(() => {
      this.$notification.classList.remove('show');
      setTimeout(() => this.$notification.classList.add('hidden'), 400);
    }, duration);
  }

  /* ── DOCUMENTO ── */
  showDocument(docId) {
    const doc = this.game.inventory?.getDocument(docId);
    if (!doc) return;
    document.getElementById('doc-title').textContent = doc.title || '—';
    document.getElementById('doc-date').textContent  = doc.date  || '';
    document.getElementById('doc-body').textContent  = doc.text  || '';
    this._openOverlay(this.$docScreen);
    this.game.input.lock();
  }

  /* ── INVENTARIO ── */
  openInventory() {
    this._renderInventory();
    this._openOverlay(this.$inventory);
    this.game.input.lock();
  }

  _renderInventory() {
    const inv  = this.game.inventory;
    const grid = document.getElementById('inventory-grid');
    if (!grid || !inv) return;
    grid.innerHTML = '';

    const slots = inv.getSlots();
    for (let i = 0; i < 8; i++) {
      const item = slots[i];
      const el   = document.createElement('div');
      el.className = 'inv-slot' + (item ? '' : ' empty');
      if (item) {
        el.innerHTML = `
          <div class="slot-icon">${item.icon || '📦'}</div>
          <div class="slot-name">${item.name}</div>
          ${item.qty > 1 ? `<div class="slot-qty">${item.qty}</div>` : ''}
        `;
        el.addEventListener('click', () => this._selectItem(i, item));
      }
      grid.appendChild(el);
    }
  }

  _selectItem(index, item) {
    // Deselect
    document.querySelectorAll('.inv-slot').forEach(s => s.classList.remove('selected'));
    document.querySelectorAll('.inv-slot')[index]?.classList.add('selected');

    document.getElementById('item-detail-name').textContent = item.name;
    document.getElementById('item-detail-desc').textContent = item.description || '';

    const actions = document.getElementById('item-detail-actions');
    actions.innerHTML = '';
    const addBtn = (label, fn) => {
      const btn = document.createElement('button');
      btn.className = 'item-action-btn';
      btn.textContent = label;
      btn.addEventListener('click', fn);
      actions.appendChild(btn);
    };

    if (item.usable)   addBtn('USA',      () => { this.game.inventory.useItem(index); this._renderInventory(); });
    if (item.equippable) addBtn('EQUIPAGGIA', () => { this.game.inventory.equipItem(index); this._renderInventory(); });
    addBtn('ESAMINA',  () => this.showNotification(item.description || item.name));
    addBtn('LASCIA',   () => { this.game.inventory.dropItem(index); this._renderInventory(); });
  }

  /* ── MAPPA ── */
  openMap() {
    this._openOverlay(this.$mapScreen);
    this.game.input.lock();
    this._renderMap();
  }

  _renderMap() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = { visited: '#2a3040', completed: '#1a2820', unvisited: '#111318' };
    const border = { visited: '#4a5870', completed: '#3a6050', unvisited: '#2a2a30' };

    const roomDefs = this.game.roomManager?.roomData || {};
    const states   = this.game.roomManager?.roomStates || {};

    const nodeW = 120, nodeH = 40, padX = 20, padY = 20;

    for (const [id, room] of Object.entries(roomDefs)) {
      const mp = room.mapPos;
      if (!mp) continue;
      const state = states[id];
      const x = padX + mp.col * (nodeW + 20);
      const y = padY + mp.row * (nodeH + 20);

      ctx.fillStyle   = state?.visited ? colors.visited : colors.unvisited;
      ctx.strokeStyle = state?.visited ? border.visited : border.unvisited;
      ctx.lineWidth   = 1;
      ctx.fillRect(x, y, nodeW, nodeH);
      ctx.strokeRect(x, y, nodeW, nodeH);

      if (state?.visited) {
        ctx.fillStyle = '#8090a0';
        ctx.font = '10px Courier New';
        ctx.fillText(room.name, x + 6, y + 24);
      } else {
        ctx.fillStyle = '#303540';
        ctx.font = '10px Courier New';
        ctx.fillText('???', x + 6, y + 24);
      }

      // Player qui?
      if (this.game.roomManager?.current?.id === id) {
        ctx.strokeStyle = '#c0152a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, nodeW + 2, nodeH + 2);
        ctx.lineWidth = 1;
      }
    }
  }

  /* ── PAUSA ── */
  openPause() {
    this._openOverlay(this.$pause);
  }

  closePause() {
    this._closeOverlay(this.$pause);
  }

  /* ── GAME OVER ── */
  showGameOver() {
    setTimeout(() => {
      this.$gameOver?.classList.remove('hidden');
    }, 1500);
  }

  hideGameOver() {
    this.$gameOver?.classList.add('hidden');
  }

  /* ── SAVE SCREEN ── */
  openSaveScreen() {
    this._openOverlay(this.$save);
    this.game.input.lock();
  }

  closeSaveScreen() {
    this._closeOverlay(this.$save);
  }

  /* ── FADE ── */
  fadeOut(duration = 600, callback) {
    const el = this.$fadeOvl;
    if (!el) { if (callback) callback(); return; }
    el.style.transition = `opacity ${duration}ms ease`;
    el.classList.add('fade-in');
    if (callback) setTimeout(callback, duration);
  }

  fadeIn(duration = 600, callback) {
    const el = this.$fadeOvl;
    if (!el) { if (callback) callback(); return; }
    el.style.transition = `opacity ${duration}ms ease`;
    el.classList.remove('fade-in');
    if (callback) setTimeout(callback, duration);
  }

  /* ── TITOLO CINEMATICO ── */
  showCinematicTitle(duration = 4) {
    this.$cinTitle?.classList.remove('hidden');
    this.$cinTitle?.classList.add('visible');
    setTimeout(() => {
      this.$cinTitle?.classList.remove('visible');
      setTimeout(() => this.$cinTitle?.classList.add('hidden'), 1000);
    }, duration * 1000);
  }

  /* ── DEBUG ── */
  updateDebug(fps, player, roomId, enemyCount, flags) {
    if (!this.game.debug) return;
    document.getElementById('dbg-fps').textContent   = `FPS: ${fps}`;
    document.getElementById('dbg-pos').textContent   = player ? `X:${Math.round(player.x)} Y:${Math.round(player.y)}` : '';
    document.getElementById('dbg-room').textContent  = `Stanza: ${roomId || '—'}`;
    document.getElementById('dbg-state').textContent = `Nemici: ${enemyCount}`;
    const flagStr = Object.entries(flags||{}).filter(([,v])=>v).map(([k])=>k).join(', ');
    document.getElementById('dbg-flags').textContent = `Flag: ${flagStr || '—'}`;
  }

  toggleDebug(on) {
    this.$debug?.classList.toggle('hidden', !on);
  }

  /* ── OVERLAY STACK ── */
  _openOverlay(el) {
    if (!el) return;
    el.classList.remove('hidden');
    this._overlayStack.push(el);
  }

  _closeOverlay(el) {
    if (!el) return;
    el.classList.add('hidden');
    this._overlayStack = this._overlayStack.filter(e => e !== el);
    if (this._overlayStack.length === 0) {
      this.game.input.unlock();
    }
  }

  closeTopOverlay() {
    if (this._overlayStack.length === 0) return;
    const top = this._overlayStack[this._overlayStack.length - 1];
    this._closeOverlay(top);
  }

  hasOpenOverlay() {
    return this._overlayStack.length > 0;
  }
}
