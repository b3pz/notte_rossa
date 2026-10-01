/* =============================================
   NOTTE ROSSA — weapons.js
   Pistola 9mm e fucile a pompa. Colpi istantanei con mira assistita.
   ============================================= */

const WEAPON_DEFS = {
  pistol: {
    id: 'pistol', name: 'Pistola 9mm',
    magSize: 8, damage: 34, pellets: 1, spread: 0,
    cooldown: 0.32, reloadTime: 1.5,
    ammoItem: 'ammo_pistol_small',
    bulletSpeed: 1500, bulletRange: 1100, knock: 1.6,
    shake: 5,
  },
  shotgun: {
    id: 'shotgun', name: 'Fucile a pompa',
    magSize: 4, damage: 26, pellets: 4, spread: 14,
    cooldown: 0.85, reloadTime: 2.4,
    ammoItem: 'ammo_shells',
    bulletSpeed: 1300, bulletRange: 520, knock: 4,
    shake: 12,
  },
};

export class WeaponSystem {
  constructor(game) {
    this.game     = game;
    this.equipped = null;
    this.bullets  = [];
    this._flash   = 0;
    this._mags    = {};
    this.particles = [];   // colpi nel caricatore per arma, conservati quando si cambia arma
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

  update(dt) {
    if (this._flash > 0) this._flash -= dt;
    const w = this.equipped;
    if (w) {
      if (w.cooldownTimer > 0) w.cooldownTimer -= dt;
      if (w.isReloading) {
        w.reloadTimer -= dt;
        if (w.reloadTimer <= 0) this._finishReload();
      }
    }
    // scie dei colpi (solo effetto visivo: il danno è istantaneo)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].life -= dt;
      if (this.bullets[i].life <= 0) this.bullets.splice(i, 1);
    }
    // schizzi di sangue
    const floor = this.game.roomManager?.current?.floorY ?? 700;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt;
      if (q.y < floor) { q.vy += 1400 * dt; q.x += q.vx * dt; q.y += q.vy * dt; }
      else { q.y = floor; q.vx = 0; q.vy = 0; }
      if (q.life <= 0) this.particles.splice(i, 1);
    }
  }

  /**
   * Nemico più vicino davanti al giocatore (direzione dir) entro range.
   * Conta anche chi è già addosso (sovrapposto al giocatore).
   */
  findTarget(player, dir, range) {
    const em = this.game.enemyManager;
    const px = player.centerX;
    let best = null, bestD = Infinity;
    for (const e of em?.enemies || []) {
      if (!e.alive) continue;
      const near = dir > 0 ? e.x + e.width - px : px - e.x;   // bordo più lontano davanti
      const far  = dir > 0 ? e.x - px : px - (e.x + e.width); // bordo più vicino
      if (near < -10 || far > range) continue;
      const d = Math.max(0, far);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  shoot(player) {
    const w = this.equipped;
    if (!w) return false;
    if (w.isReloading || w.cooldownTimer > 0) return false;
    if (w.ammoInMag <= 0) {
      this.game.audio?.playSfx('door_locked');
      if (this.ammoReserve > 0) this.reload();
      else this.game.ui?.showNotification('Caricatore vuoto.');
      w.cooldownTimer = 0.4;
      return false;
    }
    w.ammoInMag--;
    w.cooldownTimer = w.def.cooldown;

    const dir = player.facingRight ? 1 : -1;
    const fromX = player.handX, fromY = player.handY;
    const target = this.findTarget(player, dir, w.def.bulletRange);
    let endX = fromX + dir * w.def.bulletRange;
    if (target) {
      const dist = Math.max(0, Math.abs(target.centerX - player.centerX) - target.width / 2);
      // il fucile perde forza con la distanza
      const falloff = w.def.pellets > 1 ? Math.max(0.35, 1 - dist / w.def.bulletRange) : 1;
      const crit = Math.random() < 0.18;
      const dmg = Math.round(w.def.damage * w.def.pellets * falloff * (crit ? 2 : 1));
      const hx = target.centerX - dir * target.width * 0.2;
      const hy = target.y + target.height * (crit ? 0.18 : 0.4);
      target.takeDamage(dmg, dir * w.def.knock);
      if (!target.alive) this.game.enemyManager.onEnemyKilled(target);
      this._blood(hx, hy, dir, crit ? 22 : 12);
      if (crit) this.game.ui?.showNotification('Colpo alla testa!', 900);
      endX = hx;
    }
    for (let p = 0; p < w.def.pellets; p++) {
      const off = (p - (w.def.pellets - 1) / 2) * w.def.spread;
      this.bullets.push({ x0: fromX, y0: fromY, x1: endX, y1: fromY + off * (target ? 0.4 : 1) + (target ? (target.y + target.height * 0.4 - fromY) : 0), life: 0.07 });
    }
    this._flash = 0.06;
    this._flashX = fromX; this._flashY = fromY; this._flashDir = dir;
    this.game.audio?.playSfx('shot');
    this.game.camera?.shake(w.def.shake, 0.12);
    return true;
  }

  _blood(x, y, dir, n) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: dir * (60 + Math.random() * 260) + (Math.random() - 0.5) * 120,
        vy: -120 - Math.random() * 320,
        r: 1.5 + Math.random() * 2.5,
        life: 1.2 + Math.random() * 1.5,
      });
    }
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
    this.game.audio?.playSfx('reload');
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
    // sangue
    ctx.fillStyle = 'rgba(110,8,8,0.9)';
    for (const q of this.particles) {
      ctx.globalAlpha = Math.min(1, q.life);
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // scie
    for (const b of this.bullets) {
      const g = ctx.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
      g.addColorStop(0, 'rgba(255,220,140,0)');
      g.addColorStop(1, `rgba(255,235,170,${Math.min(1, b.life * 14)})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke();
    }
    // vampata
    if (this._flash > 0) {
      const r = 42;
      const gr = ctx.createRadialGradient(this._flashX, this._flashY, 0, this._flashX, this._flashY, r);
      gr.addColorStop(0, 'rgba(255,240,190,0.95)');
      gr.addColorStop(0.4, 'rgba(255,170,60,0.6)');
      gr.addColorStop(1, 'rgba(255,120,20,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(this._flashX, this._flashY, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  /** Mirino sul nemico agganciato (disegnato sopra il buio) */
  drawAim(ctx) {
    const p = this.game.player, w = this.equipped;
    if (!w || !p.alive || !(p.isAiming || p.aimHold > 0)) return;
    const dir = p.facingRight ? 1 : -1;
    const t = this.findTarget(p, dir, w.def.bulletRange);
    ctx.save();
    if (t) {
      const cx = t.centerX, cy = t.y + t.height * 0.4;
      const r = 20 + Math.sin(Date.now() / 90) * 2;
      ctx.strokeStyle = 'rgba(230,50,40,0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r - 8, cy); ctx.lineTo(cx - r + 6, cy);
      ctx.moveTo(cx + r - 6, cy); ctx.lineTo(cx + r + 8, cy);
      ctx.moveTo(cx, cy - r - 8); ctx.lineTo(cx, cy - r + 6);
      ctx.moveTo(cx, cy + r - 6); ctx.lineTo(cx, cy + r + 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(230,50,40,0.25)';
      ctx.beginPath(); ctx.moveTo(p.handX, p.handY); ctx.lineTo(cx, cy); ctx.stroke();
    } else {
      const g = ctx.createLinearGradient(p.handX, 0, p.handX + dir * 300, 0);
      g.addColorStop(0, 'rgba(230,50,40,0.3)');
      g.addColorStop(1, 'rgba(230,50,40,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.handX, p.handY); ctx.lineTo(p.handX + dir * 300, p.handY); ctx.stroke();
    }
    ctx.restore();
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
