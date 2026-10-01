/* =============================================
   NOTTE ROSSA — save.js
   SaveManager: localStorage, 3 slot
   ============================================= */

const SAVE_KEY_PREFIX = 'notterossa_save_';
const NUM_SLOTS       = 3;
const AUTO_SLOT       = 3;     // salvataggio automatico (inizio di ogni capitolo)

export class SaveManager {
  constructor(game) {
    this.game      = game;
    this.numSlots  = NUM_SLOTS;
    this._lastSlot = 0;
  }

  /** Salva la partita nello slot indicato */
  /** Salvataggio automatico (slot a parte, non sovrascrive quelli del giocatore) */
  autoSave() { return this.saveGame(AUTO_SLOT); }

  saveGame(slot = 0) {
    if (slot < 0 || slot > AUTO_SLOT) return false;
    const data = this._buildSaveData(slot);
    try {
      localStorage.setItem(SAVE_KEY_PREFIX + slot, JSON.stringify(data));
      this._lastSlot = slot;
      console.log(`[Save] Slot ${slot} salvato.`);
      return true;
    } catch (e) {
      console.error('[Save] Errore salvataggio:', e);
      this.game.ui?.showNotification('Errore nel salvataggio.');
      return false;
    }
  }

  /** Carica partita dallo slot */
  loadGame(slot = 0) {
    const raw = localStorage.getItem(SAVE_KEY_PREFIX + slot);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      this._applySaveData(data);
      this._lastSlot = slot;
      console.log(`[Save] Slot ${slot} caricato.`);
      return true;
    } catch (e) {
      console.error('[Save] Errore caricamento:', e);
      return false;
    }
  }

  /** Carica l'ultimo slot salvato */
  loadLast() {
    // Cerca lo slot più recente
    let latest = null, latestSlot = 0;
    for (let i = 0; i <= AUTO_SLOT; i++) {
      const raw = localStorage.getItem(SAVE_KEY_PREFIX + i);
      if (!raw) continue;
      const d = JSON.parse(raw);
      if (!latest || d.timestamp > latest.timestamp) { latest = d; latestSlot = i; }
    }
    if (!latest) return false;
    return this.loadGame(latestSlot);
  }

  /** Slot con il salvataggio più recente, o null */
  latestSlot() {
    let best = null, bestT = -1;
    for (let i = 0; i <= AUTO_SLOT; i++) {
      const raw = localStorage.getItem(SAVE_KEY_PREFIX + i);
      if (!raw) continue;
      try { const d = JSON.parse(raw); if (d.timestamp > bestT) { bestT = d.timestamp; best = i; } } catch (e) {}
    }
    return best;
  }

  /** Restituisce info sugli slot (per la UI "Carica") */
  getSlotsInfo() {
    return Array.from({ length: AUTO_SLOT + 1 }, (_, i) => {
      const raw = localStorage.getItem(SAVE_KEY_PREFIX + i);
      if (!raw) return { slot: i, empty: true, auto: i === AUTO_SLOT };
      const d = JSON.parse(raw);
      return {
        slot: i, empty: false, auto: i === AUTO_SLOT,
        room: d.roomName || '—',
        time: d.playTime || 0,
        date: new Date(d.timestamp).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }),
      };
    });
  }

  hasSaveData() {
    for (let i = 0; i <= AUTO_SLOT; i++) {
      if (localStorage.getItem(SAVE_KEY_PREFIX + i)) return true;
    }
    return false;
  }

  deleteSave(slot) {
    localStorage.removeItem(SAVE_KEY_PREFIX + slot);
  }

  /* ── BUILD ── */
  _buildSaveData(slot) {
    const g   = this.game;
    const now = Date.now();
    return {
      slot,
      timestamp: now,
      playTime:  g._playTime || 0,
      roomId:    g.roomManager.current?.id,
      roomName:  g.roomManager.current?.name || '—',
      player:    g.player.serialize(),
      inventory: g.inventory.serialize(),
      rooms:     g.roomManager.serialize(),
      events:    g.events.serialize(),
      weapon: {
        equippedId: g.weapon?.equipped?.id || null,
        ammoInMag:  g.weapon?.equipped?.ammoInMag  || 0,
        ammoReserve:g.weapon?.equipped?.ammoReserve || 0,
      },
    };
  }

  /* ── APPLY ── */
  _applySaveData(data) {
    const g = this.game;

    // Ferma il gioco durante il caricamento
    const wasRunning = g.running;
    g.running = false;

    // Ripristina sistemi
    g.inventory.deserialize(data.inventory);
    g.events.deserialize(data.events);
    g.roomManager.deserialize(data.rooms);

    // Carica stanza
    const roomId = data.roomId || 'train_wagon';
    g.roomManager.loadRoom(roomId, data.player.x);

    // Ripristina player (DOPO loadRoom per avere la stanza giusta)
    g.player.deserialize(data.player);

    // Ripristina arma
    if (data.weapon?.equippedId) {
      g.weapon.equip(data.weapon.equippedId);
      if (g.weapon.equipped) {
        g.weapon.equipped.ammoInMag   = data.weapon.ammoInMag   || 0;
        g.weapon.equipped.ammoReserve = data.weapon.ammoReserve || 0;
      }
    }

    g._playTime = data.playTime || 0;
    g.running   = wasRunning;

    // Torna al gioco
    g.ui.fadeIn(600, () => {
      g.ui.showHUD();
    });
  }
}
