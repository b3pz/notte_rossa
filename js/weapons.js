/* =============================================
   NOTTE ROSSA — weapons.js
   Pistola 9mm e fucile a pompa. Colpi in corsia unica.
   ============================================= */

const WEAPON_DEFS = {
  pistol: {
    id: 'pistol', name: 'Pistola 9mm',
    magSize: 10, damage: 36, pellets: 1, spread: 0,
    cooldown: 0.32, reloadTime: 1.5,
    ammoItem: 'ammo_pistol_small',
    bulletSpeed: 1500, bulletRange: 1100, knock: 1,
    shake: 5,
  },
  shotgun: {
    id: 'shotgun', name: 'Fucile a pompa',
    magSize: 4, damage: 30, pellets: 4, spread: 14,
    cooldown: 0.85, reloadTime: 2.4,
    ammoItem: 'ammo_shells',
    bulletSpeed: 1300, bulletRange: 480, knock: 3,
    shake: 12,
  },
};

export class WeaponSystem {
  constructor(game) {
    this.game     = game;
    this.equipped = null;
    this.bullets  = [];
    this.particles = [];
    this._flash   = 0;
    this._mags    = {};   // colpi nel caricatore per arma, conservati quando si cambia arma
  }

  equip(weaponId) {
    const def = WEAPON_DEFS[weaponId];
    if (!def) return;
    if (this.equipped?.id === weaponId) return;
    if (this.equipped) this._mags[this.equipped.id] = this.equipped.ammoInMag;
    this.equipped = new WeaponInstance(def, this._mags[weaponId] ?? def.magSize);
  }

  unequip() {
    if (this.equipped) this._mags[this.equipped.id] = this.equipped.ammoInMag;
    this.equipped = null;
  }

  /** Munizioni di riserva = quantità nell'inventario */
  get ammoReserve() {
    const w = this.equipped;
    if (!w) return 0;
    return this.game.inventory?.countItem(w.def.ammoItem) || 0;
  }
  get ammoInMag() { return this.equipped?.ammoInMag || 0; }

  _blood(x, y, dir, sc) {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x, y,
        vx: dir * (80 + Math.random() * 260) * sc + (Math.random() - 0.5) * 120,
        vy: (-200 + Math.random() * 220) * sc,
        life: 0.5 + Math.random() * 0.4, r: (1.5 + Math.random() * 3) * sc,
      });
    }
  }

  update(dt) {
    if (this._flash > 0) this._flash -= dt;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt; q.vy += 900 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.life <= 0) this.particles.splice(i, 1);
    }
    const w = this.equipped;
    if (w) {
      if (w.cooldownTimer > 0) w.cooldownTimer -= dt;
      if (w.isReloading) {
        w.reloadTimer -= dt;
        if (w.reloadTimer <= 0) this._finishReload();
      }
    }

    const em = this.game.enemyManager;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const step = b.vx * dt;
      b.x += step;
      b.travel += Math.abs(step);
      if (b.travel > b.range || b.x < -50 || b.x > 1330) { this.bullets.splice(i, 1); continue; }

      // Colpisce il primo nemico vivo attraversato (tutta l'altezza: corsia unica)
      let hit = null;
      for (const e of em?.enemies || []) {
        if (!e.alive) continue;
        if (b.x >= e.x && b.x <= e.x + e.width) {
          if (!hit || Math.abs(e.centerX - b.x0) < Math.abs(hit.centerX - b.x0)) hit = e;
        }
      }
      if (hit) {
        // il fucile perde forza con la distanza
        const falloff = b.pellet ? Math.max(0.35, 1 - b.travel / b.range) : 1;
        hit.takeDamage(Math.round(b.damage * falloff), Math.sign(b.vx) * b.knock);
        this._blood(b.x, Math.max(hit.y + hit.height * 0.15, Math.min(hit.y + hit.height * 0.6, b.y)), Math.sign(b.vx), hit.scale || 1);
        if (!hit.alive) em.onEnemyKilled(hit);
        this.bullets.splice(i, 1);
      }
    }
  }

  shoot(fromX, fromY, dir) {
    const w = this.equipped;
    if (!w) return false;
    if (w.isReloading || w.cooldownTimer > 0) return false;
    if (w.ammoInMag <= 0) {
      this.game.audio?.playSfx('dry_fire');
      if (this.ammoReserve > 0) this.reload();
      else this.game.ui?.showNotification('Caricatore vuoto.');
      w.cooldownTimer = 0.4;
      return false;
    }
    w.ammoInMag--;
    w.cooldownTimer = w.def.cooldown;

    for (let p = 0; p < w.def.pellets; p++) {
      this.bullets.push({
        x: fromX, x0: fromX,
        y: fromY + (p - (w.def.pellets - 1) / 2) * w.def.spread,
        vx: dir * w.def.bulletSpeed,
        damage: w.def.damage, range: w.def.bulletRange,
        knock: w.def.knock, travel: 0, pellet: w.def.pellets > 1,
      });
    }
    this._flash = 0.06;
    this._flashX = fromX; this._flashY = fromY; this._flashDir = dir;
    this.game.audio?.playSfx(w.def.id === 'shotgun' ? 'shotgun_shot' : 'shot');
    this.game.camera?.shake(w.def.shake, 0.12);
    return true;
  }

  reload() {
    const w = this.equipped;
    if (!w || w.isReloading || w.ammoInMag >= w.def.magSize) return;
    if (this.ammoReserve <= 0) {
      this.game.ui?.showNotification('Nessuna munizione.');
      return;
    }
    w.isReloading = true;
    w.reloadTimer = w.def.reloadTime;
    this.game.audio?.playSfx(w.def.id === 'shotgun' ? 'shotgun_pump' : 'reload');
  }

  _finishReload() {
    const w = this.equipped;
    w.isReloading = false;
    const need = w.def.magSize - w.ammoInMag;
    const take = this.game.inventory?.takeItem(w.def.ammoItem, need) || 0;
    w.ammoInMag += take;
  }

  /** compatibilità con l'inventario (le munizioni restano nell'inventario) */
  loadAmmo() { return 0; }

  draw(ctx) {
    for (const q of this.particles) {
      ctx.fillStyle = `rgba(120,8,12,${Math.min(1, q.life * 2)})`;
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    }
    // Proiettili: scia sottile
    for (const b of this.bullets) {
      const g = ctx.createLinearGradient(b.x - Math.sign(b.vx) * 40, 0, b.x, 0);
      g.addColorStop(0, 'rgba(255,220,140,0)');
      g.addColorStop(1, 'rgba(255,230,160,0.9)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x - Math.sign(b.vx) * 40, b.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // Vampata
    if (this._flash > 0) {
      const r = 38;
      const gr = ctx.createRadialGradient(this._flashX, this._flashY, 0, this._flashX, this._flashY, r);
      gr.addColorStop(0, 'rgba(255,240,190,0.95)');
      gr.addColorStop(0.4, 'rgba(255,170,60,0.6)');
      gr.addColorStop(1, 'rgba(255,120,20,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(this._flashX, this._flashY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

class WeaponInstance {
  constructor(def, mag) {
    this.def = def;
    this.id  = def.id;
    this.ammoInMag     = mag;
    this.cooldownTimer = 0;
    this.isReloading   = false;
    this.reloadTimer   = 0;
  }
}
