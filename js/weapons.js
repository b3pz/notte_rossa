/* =============================================
   NOTTE ROSSA — weapons.js
   Sistema armi: pistola, cooldown, rinculo, proiettili
   ============================================= */

const WEAPON_DEFS = {
  pistol: {
    id: 'pistol', name: 'Pistola 9mm',
    magSize:     6,
    damage:      35,
    cooldown:    0.3,    // secondi tra un colpo e l'altro
    reloadTime:  1.8,    // secondi per ricaricare
    ammoType:    'pistol',
    bulletSpeed: 900,    // px/s
    bulletRange: 700,    // px prima di scomparire
    recoilX:     8,      // px di rinculo visivo
    recoilY:    -3,
  },
  // Altre armi future...
};

export class WeaponSystem {
  constructor(game) {
    this.game     = game;
    this.equipped = null;   // WeaponInstance attiva
    this.bullets  = [];     // proiettili attivi
  }

  /** Equipaggia un'arma */
  equip(weaponId) {
    const def = WEAPON_DEFS[weaponId];
    if (!def) return;
    // Se già equipaggiata, non resettare le munizioni
    if (this.equipped?.id === weaponId) return;
    const reserve = this.game.inventory?.countItem('ammo_pistol_small') || 0;
    this.equipped = new WeaponInstance(def, reserve);
    console.log(`[Weapon] Equipaggiata: ${def.name}`);
  }

  /** Aggiorna cooldown, ricarica, proiettili */
  update(dt) {
    if (this.equipped) this.equipped.update(dt);

    // Proiettili
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.distanceTraveled += Math.abs(b.vx * dt) + Math.abs(b.vy * dt);

      // Fuori range
      if (b.distanceTraveled > b.range) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Hit nemici
      const em = this.game.enemyManager;
      if (em) {
        const col = this.game.collision;
        for (const enemy of em.enemies) {
          if (!enemy.alive) continue;
          if (col.bulletHitsEnemy(b, enemy)) {
            enemy.takeDamage(b.damage);
            this.bullets.splice(i, 1);
            this.game.camera?.shake(4, 0.1);
            break;
          }
        }
      }
    }
  }

  /** Spara */
  shoot(fromX, fromY, dirX, dirY) {
    const w = this.equipped;
    if (!w || !w.canShoot()) return false;
    if (!w.shoot()) return false;

    const len    = Math.sqrt(dirX*dirX + dirY*dirY) || 1;
    const nx     = dirX / len;
    const ny     = dirY / len;

    this.bullets.push({
      x: fromX, y: fromY,
      vx: nx * w.def.bulletSpeed,
      vy: ny * w.def.bulletSpeed,
      damage: w.def.damage,
      range:  w.def.bulletRange,
      distanceTraveled: 0,
      radius: 4,
    });

    this.game.audio?.playSfx('shot');
    this.game.camera?.shake(6, 0.15);
    return true;
  }

  /** Ricarica */
  reload() {
    const w   = this.equipped;
    if (!w || w.isReloading || w.ammoInMag === w.def.magSize) return;
    const inv = this.game.inventory;
    const available = inv?.countItem('ammo_pistol_small') || 0;
    if (available === 0) {
      this.game.ui?.showNotification('Nessuna munizione.');
      return;
    }
    w.startReload(available);
    this.game.audio?.playSfx('reload');
  }

  /** Carica munizioni dall'inventario */
  loadAmmo(ammoType, qty) {
    if (!this.equipped || this.equipped.def.ammoType !== ammoType) return 0;
    return this.equipped.addReserve(qty);
  }

  /** Disegna proiettili */
  draw(ctx) {
    ctx.fillStyle = '#f0d060';
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      // Scia
      ctx.fillStyle = 'rgba(240,180,40,0.3)';
      ctx.beginPath();
      ctx.arc(b.x - b.vx * 0.016, b.y - b.vy * 0.016, b.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f0d060';
    }
  }

  get ammoInMag()  { return this.equipped?.ammoInMag  || 0; }
  get ammoReserve(){ return this.equipped?.ammoReserve || 0; }
}

class WeaponInstance {
  constructor(def, reserve = 0) {
    this.def         = def;
    this.id          = def.id;
    this.ammoInMag   = def.magSize;
    this.ammoReserve = reserve;
    this.cooldownTimer  = 0;
    this.isReloading    = false;
    this.reloadTimer    = 0;
  }

  update(dt) {
    if (this.cooldownTimer  > 0) this.cooldownTimer  -= dt;
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) this._finishReload();
    }
  }

  canShoot() {
    return !this.isReloading && this.cooldownTimer <= 0 && this.ammoInMag > 0;
  }

  shoot() {
    if (!this.canShoot()) return false;
    this.ammoInMag--;
    this.cooldownTimer = this.def.cooldown;
    return true;
  }

  startReload(available) {
    this.isReloading = true;
    this.reloadTimer = this.def.reloadTime;
    this._reloadAvail = available;
  }

  _finishReload() {
    const needed  = this.def.magSize - this.ammoInMag;
    const take    = Math.min(needed, this._reloadAvail, this.ammoReserve);
    this.ammoInMag  += take;
    this.ammoReserve = Math.max(0, this.ammoReserve - take);
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  addReserve(qty) {
    const before = this.ammoReserve;
    this.ammoReserve += qty;
    return this.ammoReserve - before;
  }
}
