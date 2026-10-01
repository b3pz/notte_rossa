/* =============================================
   NOTTE ROSSA — inventory.js
   InventoryManager: 12 slot, raccolta, uso, documenti
   ============================================= */

import { ITEMS, DOCUMENTS } from './items.js';

export const INV_SLOTS = 20;

export class InventoryManager {
  constructor(game) {
    this.game     = game;
    this.maxSlots = INV_SLOTS;
    this._slots   = new Array(INV_SLOTS).fill(null);
    this._docs    = [];
  }

  getSlots()        { return this._slots; }
  hasItem(itemId)   { return this._slots.some(s => s?.id === itemId); }
  countItem(itemId) { return this._slots.reduce((a, s) => a + (s?.id === itemId ? (s.qty || 1) : 0), 0); }
  findFirstEmpty()  { return this._slots.findIndex(s => s === null); }

  /** Aggiunge un oggetto. Ritorna true se riuscito. */
  addItem(itemId, amount) {
    const def = ITEMS[itemId];
    if (!def) { console.warn('[Inv] Oggetto sconosciuto:', itemId); return false; }
    let qty = amount ?? (def.ammoCount || 1);

    if (def.stackable) {
      for (const s of this._slots) {
        if (qty <= 0) break;
        if (s?.id === itemId && s.qty < (def.maxStack || 99)) {
          const add = Math.min(qty, (def.maxStack || 99) - s.qty);
          s.qty += add; qty -= add;
        }
      }
      if (qty <= 0) return true;
    } else if (this.hasItem(itemId)) {
      return true;   // oggetti unici: non duplicare
    }

    const idx = this.findFirstEmpty();
    if (idx === -1) {
      this.game.ui?.showNotification('Inventario pieno.');
      return false;
    }
    this._slots[idx] = { ...def, qty };
    return true;
  }

  /** Rimuove fino a n unità; ritorna quante ne ha tolte */
  takeItem(itemId, n = 1) {
    let taken = 0;
    for (let i = 0; i < this._slots.length && taken < n; i++) {
      const s = this._slots[i];
      if (s?.id !== itemId) continue;
      const t = Math.min(n - taken, s.qty || 1);
      s.qty = (s.qty || 1) - t;
      taken += t;
      if (s.qty <= 0) this._slots[i] = null;
    }
    return taken;
  }

  removeItem(itemId) { return this.takeItem(itemId, 9999) > 0; }

  useItem(index) {
    const item = this._slots[index];
    if (!item) return false;
    const g = this.game, player = g.player;

    switch (item.type) {
      case 'heal':
        if (player.hp >= player.maxHp) { g.ui?.showNotification('Sei già in forze.'); return false; }
        player.heal(item.healAmount || 30);
        g.ui?.showNotification(`${item.name}: +${item.healAmount}`);
        g.audio?.playSfx('pickup');
        this._consume(index, 1);
        return true;
      case 'battery':
        if (!this.hasItem('flashlight')) { g.ui?.showNotification('Non hai una torcia.'); return false; }
        player.chargeBattery(item.chargeAmount || 50);
        g.ui?.showNotification('Torcia ricaricata');
        this._consume(index, 1);
        return true;
      default:
        if (item.id === 'recorder')  { g.ui.closeTopOverlay(); g.events.trigger('play_recorder'); return true; }
        if (item.id === 'city_map')  { g.ui.closeTopOverlay(); g.ui.openMap(); return true; }
        g.ui?.showNotification('Non puoi usarlo qui.');
        return false;
    }
  }

  equipItem(index) {
    const item = this._slots[index];
    if (!item) return;
    const g = this.game;
    if (item.id === 'flashlight') {
      if (!g.player.batteryHasCharge && !g.player.flashlightOn) { g.ui?.showNotification('Batteria scarica.'); return; }
      g.player.flashlightOn = !g.player.flashlightOn;
      g.ui?.showNotification(g.player.flashlightOn ? 'Torcia accesa' : 'Torcia spenta');
    }
    if (item.type === 'weapon') {
      if (g.weapon.equipped?.id === item.weaponId) {
        g.weapon.unequip();
        g.ui?.showNotification(`${item.name} riposta`);
      } else {
        g.weapon.equip(item.weaponId);
        g.ui?.showNotification(`${item.name} in mano — [SPAZIO] o clic per sparare`);
      }
    }
  }

  dropItem(index) {
    const item = this._slots[index];
    if (!item) return;
    if (item.type === 'key' || item.type === 'weapon') {
      this.game.ui?.showNotification('Meglio tenerlo.');
      return;
    }
    this._slots[index] = null;
    this.game.ui?.showNotification(`${item.name} lasciato`);
  }

  _consume(index, qty = 1) {
    const item = this._slots[index];
    if (!item) return;
    item.qty -= qty;
    if (item.qty <= 0) this._slots[index] = null;
  }

  /* ── DOCUMENTI ── */
  addDocument(docId) {
    if (this._docs.find(d => d.id === docId)) return;
    const doc = DOCUMENTS[docId];
    if (doc) this._docs.push({ ...doc });
  }
  getDocument(docId) { return this._docs.find(d => d.id === docId) || DOCUMENTS[docId]; }
  getDocuments()     { return this._docs; }

  /* ── SERIALIZZAZIONE ── */
  serialize() {
    return {
      slots: this._slots.map(s => s ? { id: s.id, qty: s.qty } : null),
      docs:  this._docs.map(d => d.id),
    };
  }

  deserialize(data) {
    if (data.slots) {
      const arr = new Array(INV_SLOTS).fill(null);
      data.slots.forEach((s, i) => {
        if (!s || i >= INV_SLOTS) return;
        const def = ITEMS[s.id];
        if (def) arr[i] = { ...def, qty: s.qty };
      });
      this._slots = arr;
    }
    if (data.docs) this._docs = data.docs.map(id => DOCUMENTS[id]).filter(Boolean);
  }
}
