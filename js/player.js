/* =============================================
   NOTTE ROSSA — player.js
   Protagonista (Luca): movimento, animazioni, salute, torcia
   ============================================= */

import { SpriteLib } from './sprites.js';

export const HEALTH_STATE = { FINE: 'FINE', CAUTION: 'CAUTION', DANGER: 'DANGER' };

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.scale  = 1;
    this.width  = 70;    // hitbox (a scala 1)
    this.height = 260;

    // Movimento
    this.vx = 0;
    this.vy = 0;
    this.baseSpeed   = 190;
    this.baseRun     = 330;
    this.baseSneak   = 95;
    this.speed       = 190;
    this.runSpeed    = 330;
    this.sneakSpeed  = 95;
    this.isRunning   = false;
    this.facingRight = true;

    // Salute
    this.maxHp   = 100;
    this.hp      = 100;
    this.alive   = true;
    this.invulnerable      = false;
    this.invulnerableTimer = 0;
    this.INVULN_TIME = 0.9;
    this._hurtTimer  = 0;

    // Torcia
    this.flashlightOn      = false;
    this.batteryMax        = 100;
    this.battery           = 100;
    this.batteryDrainRate  = 0.9;
    this.batteryHasCharge  = true;

    // Stato azione (alcuni impostati dal Game ogni frame)
    this.isAiming    = false;
    this.isInteract  = false;
    this.isCrouching = false;
    this.armed       = false;   // arma equipaggiata
    this.reloading   = false;
    this.shotTimer   = 0;       // >0 subito dopo uno sparo
    this.aimTimer    = 0;       // >0 = resta in posa di mira dopo aver sparato

    // Animazione
    this.anim      = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;

    this.onGround = true;
    this.interactRange = 40;

    // Hitbox = rettangolo pieno (nessun offset)
    this.hitboxOffX = 0;
    this.hitboxOffY = 0;
    this.hitboxW    = this.width;
    this.hitboxH    = this.height;
  }

  /** Adatta dimensioni e velocità all'inquadratura della stanza */
  setScale(s = 1) {
    this.scale  = s;
    this.width  = Math.round(70 * s);
    this.height = Math.round(260 * s);
    this.hitboxW = this.width;
    this.hitboxH = this.height;
    const k = 0.35 + 0.65 * s;   // in campo largo ci si muove un po' più piano sullo schermo
    this.speed      = this.baseSpeed * k;
    this.runSpeed   = this.baseRun * k;
    this.sneakSpeed = this.baseSneak * k;
    this.interactRange = 40 * s;
  }

  /* ── AGGIORNAMENTO ── */
  update(dt, input, collisionManager) {
    if (this.invulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) this.invulnerable = false;
    }
    if (this._hurtTimer > 0) this._hurtTimer -= dt;
    if (this.shotTimer  > 0) this.shotTimer  -= dt;
    if (this.interactTimer > 0) this.interactTimer -= dt;
    if (this.aimTimer   > 0) this.aimTimer   -= dt;

    if (!this.alive) {
      this.vx = 0;
      this._updateAnim(dt);
      return;
    }

    if (!input.locked) {
      this.isCrouching = input.isDown('crouch');
      this.isAiming    = this.armed && input.isDown('aim');
      this._handleMovement(input);
      this._handleFlashlight(dt, input);
      this.isInteract  = input.justPressed('interact');
    } else {
      this.vx = 0;
      this.isInteract = false;
      this.isAiming = false;
    }
    this._drainBattery(dt);

    if (collisionManager) {
      const moved = collisionManager.moveEntity(this, this.vx * dt, 0);
      this.x = moved.x;
      this.y = moved.y;
    } else {
      this.x += this.vx * dt;
    }

    this._updateAnim(dt);
  }

  _handleMovement(input) {
    this.isRunning = input.isDown('run') && !this.isCrouching && !this.isAiming;
    let spd = this.isCrouching ? this.sneakSpeed : (this.isRunning ? this.runSpeed : this.speed);
    spd *= this._speedMultiplier();

    this.vx = 0;
    const left  = input.isDown('moveLeft');
    const right = input.isDown('moveRight');
    if (left)  this.facingRight = false;
    if (right) this.facingRight = true;
    // Mirando si gira ma non si cammina
    if (this.isAiming) return;
    if (left)  this.vx = -spd;
    if (right) this.vx =  spd;
  }

  _handleFlashlight(dt, input) {
    if (input.justPressed('flashlight')) {
      if (!this.hasFlashlight) return;
      if (this.batteryHasCharge || this.flashlightOn) {
        this.flashlightOn = !this.flashlightOn;
      }
    }
  }

  _drainBattery(dt) {
    if (this.flashlightOn && this.battery > 0) {
      this.battery -= this.batteryDrainRate * dt;
      if (this.battery <= 0) {
        this.battery = 0;
        this.flashlightOn     = false;
        this.batteryHasCharge = false;
      }
    }
  }

  _speedMultiplier() {
    if (this.healthState === HEALTH_STATE.CAUTION) return 0.88;
    if (this.healthState === HEALTH_STATE.DANGER)  return 0.7;
    return 1;
  }

  /** Il Listener ti sente se corri o spari; accovacciato sei silenzioso */
  get noiseLevel() {
    if (!this.alive) return 0;
    if (this.shotTimer > 0) return 3;
    if (this.isRunning && this.vx !== 0) return 2;
    if (this.isCrouching) return 0;
    if (this.vx !== 0) return 1;
    return 0;
  }

  /* ── ANIMAZIONE ── */
  _pickAnim() {
    // le animazioni "facoltative" si usano appena esiste la loro striscia nel manifest
    const has = (a) => SpriteLib.has('player', a);
    const or = (a, b) => has(a) ? a : b;
    if (!this.alive) return 'death';
    if (this._hurtTimer > 0) return 'hurt';
    const sg = this.weaponId === 'shotgun';
    if (this.armed && this.reloading) return sg ? or('shotgun_reload', 'shotgun_aim') : 'reload';
    if (this.armed && this.shotTimer > 0) return sg ? 'shotgun_shoot' : 'shoot';
    if (this.isAiming || (this.armed && this.aimTimer > 0 && this.vx === 0)) return sg ? 'shotgun_aim' : 'aim';
    if (this.vx !== 0) {
      if (this.isCrouching) return 'sneak';
      if (this.isRunning)   return this.armed ? or(sg ? 'run_shotgun' : 'run_gun', 'run') : 'run';
      if (this.armed)       return or(sg ? 'walk_shotgun' : 'walk_gun', this.flashlightOn ? 'flashlight_walk' : 'walk');
      return this.flashlightOn ? 'flashlight_walk' : 'walk';
    }
    if (this.interactTimer > 0 && has('interact')) return 'interact';
    if (this.isCrouching) return 'crouch';
    if (this.armed) return sg ? or('shotgun_idle', 'gun_idle') : 'gun_idle';
    if (this.flashlightOn) return 'flashlight';
    if (this.healthState === HEALTH_STATE.DANGER) return 'wounded';
    return 'idle';
  }

  _updateAnim(dt) {
    const next = this._pickAnim();
    if (next !== this.anim) {
      this.anim = next;
      this.animFrame = 0;
      this.animTimer = 0;
    }
    const def = SpriteLib.animDef('player', this.anim);
    if (!def) return;
    this.animTimer += dt;
    // passi sincronizzati con la velocità reale (niente piedi che pattinano)
    const stride = { walk: 30, walk_gun: 34, walk_shotgun: 34, flashlight_walk: 40, run: 72, run_gun: 72, run_shotgun: 72, sneak: 42 }[this.anim];
    const fps = stride ? Math.max(2.5, Math.abs(this.vx) / (stride * this.scale)) : def.fps;
    const fd = 1 / fps;
    while (this.animTimer >= fd) {
      this.animTimer -= fd;
      if (this.animFrame < def.frames - 1) this.animFrame++;
      else if (def.loop) this.animFrame = 0;
    }
  }

  /* ── SALUTE ── */
  get healthState() {
    const pct = this.hp / this.maxHp;
    if (pct > 0.5) return HEALTH_STATE.FINE;
    if (pct > 0.2) return HEALTH_STATE.CAUTION;
    return HEALTH_STATE.DANGER;
  }

  takeDamage(amount) {
    if (!this.alive || this.invulnerable) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.flashlightOn = false;
    } else {
      this.invulnerable      = true;
      this.invulnerableTimer = this.INVULN_TIME;
      this._hurtTimer        = 0.35;
    }
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  chargeBattery(amount = 100) {
    this.battery = Math.min(this.batteryMax, this.battery + amount);
    this.batteryHasCharge = this.battery > 0;
  }

  /* ── GEOMETRIA ── */
  get centerX() { return this.x + this.width / 2; }
  get footY()   { return this.y + this.height; }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  getInteractPoint() {
    return {
      x: this.centerX + (this.facingRight ? this.interactRange : -this.interactRange),
      y: this.y + this.height / 2,
    };
  }

  /** Punto da cui partono luce e proiettili (la mano) */
  get handX() { return this.centerX + (this.facingRight ? 70 : -70) * this.scale; }
  get handY() { return this.y + this.height * 0.38; }

  /* ── RENDER ── */
  draw(ctx) {
    const blink = this.alive && this.invulnerable && Math.floor(Date.now() / 90) % 2 === 0;
    // ombra: più larga quando è a terra o accovacciato
    const sw = (this.alive ? (this.isCrouching ? 130 : 105) : 250) * this.scale;
    SpriteLib.drawShadow(ctx, this.centerX, this.footY - 2 * this.scale, sw, 0.6);
    const ok = SpriteLib.draw(ctx, 'player', this.anim, this.animFrame,
      this.centerX, this.footY, this.facingRight, { alpha: blink ? 0.45 : 1, scale: this.scale });
    if (!ok) this._drawPlaceholder(ctx);
  }

  _drawPlaceholder(ctx) {
    ctx.fillStyle = '#6a7a8a';
    ctx.fillRect(this.x, this.y + 40, this.width, this.height - 40);
    ctx.fillStyle = '#c8a888';
    ctx.fillRect(this.x + 15, this.y, this.width - 30, 40);
  }

  /* ── SERIALIZZAZIONE ── */
  serialize() {
    return {
      x: this.x, y: this.y,
      hp: this.hp,
      facingRight: this.facingRight,
      battery: this.battery,
      flashlightOn: this.flashlightOn,
    };
  }

  deserialize(data) {
    this.x            = data.x;
    this.hp           = data.hp;
    this.facingRight  = data.facingRight;
    this.battery      = data.battery ?? 100;
    this.flashlightOn = data.flashlightOn ?? false;
    this.alive        = this.hp > 0;
    this.batteryHasCharge = this.battery > 0;
  }
}
