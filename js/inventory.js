/* =============================================
   NOTTE ROSSA — inventory.js
   InventoryManager: 8 slot, raccolta, uso, documenti
   ============================================= */

import { ITEMS, DOCUMENTS } from './items.js';

export class InventoryManager {
  constructor(game) {
    this.game     = game;
    this.maxSlots = 8;
    this._slots   = new Array(8).fill(null);   // slot[i] = { ...itemDef, qty } | null
    this._docs    = [];   // documenti trovati
  }

  /* ── SLOT ── */
  getSlots()        { return this._slots; }
  hasItem(itemId)   { return this._slots.some(s => s?.id === itemId); }
  countItem(itemId) { return this._slots.filter(s => s?.id === itemId).reduce((a, s) => a + (s?.qty||1), 0); }

  findFirstEmpty() {
    return this._slots.findIndex(s => s === null);
  }

  /** Aggiunge un item; ritorna true se riuscito */
  addItem(itemId) {
    const def = ITEMS[itemId];
    if (!def) { console.warn('[Inv] Item non trovato:', itemId); return false; }

    // Se stackable cerca uno slot esistente
    if (def.stackable) {
      const existing = this._slots.findIndex(s => s?.id === itemId && s.qty < (def.maxStack || 99));
      if (existing !== -1) {
        this._slots[existing].qty = Math.min(
          this._slots[existing].qty + (def.ammoCount || 1),
          def.maxStack || 99
        );
        return true;
      }
    }

    const idx = this.findFirstEmpty();
    if (idx === -1) {
      this.game.ui?.showNotification('Inventario pieno.');
      return false;
    }
    this._slots[idx] = { ...def, qty: def.ammoCount || 1 };
    return true;
  }

  /** Usa un item in slot[index] */
  useItem(index) {
    const item = this._slots[index];
    if (!item) return false;

    const player = this.game.player;
    const weapon = this.game.weapon;

    switch (item.type) {
      case 'heal':
        player?.heal(item.healAmount || 30);
        this.game.ui?.showNotification(`+${item.healAmount} HP`);
        this.game.audio?.playSfx('pickup');
        this._consume(index, 1);
        return true;

      case 'ammo':
        if (weapon) {
          const loaded = weapon.loadAmmo(item.ammoType, item.qty || 1);
          if (loaded > 0) {
            this._consume(index, loaded);
            return true;
          }
        }
        return false;

      case 'battery':
        player?.chargeBattery(item.chargeAmount || 50);
        this.game.ui?.showNotification('Torcia ricaricata');
        this._consume(index, 1);
        return true;

      default:
        this.game.ui?.showNotification('Non puoi usarlo ora.');
        return false;
    }
  }

  /** Equipaggia item (torcia, arma) */
  equipItem(index) {
    const item = this._slots[index];
    if (!item) return;

    if (item.type === 'tool' && item.id === 'flashlight') {
      this.game.player.flashlightOn = !this.game.player.flashlightOn;
      this.game.ui?.showNotification(this.game.player.flashlightOn ? 'Torcia accesa' : 'Torcia spenta');
    }
    if (item.type === 'weapon') {
      this.game.weapon?.equip(item.weaponId || item.id);
      this.game.ui?.showNotification(`${item.name} equipaggiata`);
    }
  }

  /** Lascia cadere un item */
  dropItem(index) {
    const item = this._slots[index];
    if (!item) return;
    this._slots[index] = null;
    this.game.ui?.showNotification(`${item.name} lasciata`);
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
    if (!doc) return;
    this._docs.push({ ...doc });
  }

  getDocument(docId) {
    return this._docs.find(d => d.id === docId) || DOCUMENTS[docId];
  }

  getDocuments() { return this._docs; }

  /* ── SERIALIZZAZIONE ── */
  serialize() {
    return {
      slots: this._slots.map(s => s ? { id: s.id, qty: s.qty } : null),
      docs:  this._docs.map(d => d.id),
    };
  }

  deserialize(data) {
    if (data.slots) {
      this._slots = data.slots.map(s => {
        if (!s) return null;
        const def = ITEMS[s.id];
        return def ? { ...def, qty: s.qty } : null;
      });
    }
    if (data.docs) {
      this._docs = data.docs.map(id => DOCUMENTS[id]).filter(Boolean);
    }
  }
}
