/* =============================================
   NOTTE ROSSA — player.js
   Protagonista: movimento, animazioni, salute, torcia
   ============================================= */

export const HEALTH_STATE = { FINE: 'FINE', CAUTION: 'CAUTION', DANGER: 'DANGER' };

export class Player {
  constructor(x, y) {
    // Posizione
    this.x = x;
    this.y = y;
    this.width  = 28;
    this.height = 56;

    // Movimento
    this.vx = 0;
    this.vy = 0;
    this.speed       = 160;  // px/s camminata
    this.runSpeed    = 280;  // px/s corsa
    this.isRunning   = false;
    this.facingRight = true;

    // Salute
    this.maxHp   = 100;
    this.hp      = 100;
    this.alive   = true;
    this.invulnerable      = false;
    this.invulnerableTimer = 0;
    this.INVULN_TIME = 0.8;  // secondi di invulnerabilità dopo un colpo

    // Torcia
    this.flashlightOn      = false;
    this.batteryMax        = 100;
    this.battery           = 100;
    this.batteryDrainRate  = 1.5;  // % al secondo (configurabile)
    this.batteryHasCharge  = true; // false = torcia scarica, non si accende

    // Stato azione
    this.isAiming    = false;
    this.isInteract  = false;  // flag singolo frame
    this.isCrouching = false;

    // Animazione (sistema sprite sheet)
    // Ogni animazione: { frames, fps, loop, offsetX, offsetY, frameW, frameH }
    this.animations = {
      idle:      { frames: 4,  fps: 4,  loop: true  },
      walk:      { frames: 6,  fps: 8,  loop: true  },
      run:       { frames: 6,  fps: 12, loop: true  },
      aim:       { frames: 2,  fps: 4,  loop: true  },
      shoot:     { frames: 3,  fps: 18, loop: false },
      reload:    { frames: 6,  fps: 8,  loop: false },
      hurt:      { frames: 2,  fps: 10, loop: false },
      death:     { frames: 6,  fps: 6,  loop: false },
      interact:  { frames: 3,  fps: 8,  loop: false },
      pickup:    { frames: 3,  fps: 8,  loop: false },
      crouch:    { frames: 2,  fps: 6,  loop: true  },
      flashlight:{ frames: 2,  fps: 4,  loop: true  },
    };

    this.currentAnim  = 'idle';
    this.animFrame    = 0;
    this.animTimer    = 0;
    this._animLocked  = false; // true durante animazioni non-loop

    // Sprite (null = usa placeholder)
    this.sprite = null;
    this.spriteW = 48;
    this.spriteH = 64;

    // Collisioni
    // Hitbox leggermente più piccola dello sprite
    this.hitboxOffX = 6;
    this.hitboxOffY = 8;
    this.hitboxW    = this.width;
    this.hitboxH    = this.height;

    // Suolo (per gravità futura / animazioni)
    this.onGround = true;

    // Riferimento alla posizione di interazione (davanti al player)
    this.interactRange = 60;
  }

  /* ── AGGIORNAMENTO ── */
  update(dt, input, collisionManager) {
    if (!this.alive) {
      this._updateAnim(dt);
      return;
    }

    // Invulnerabilità
    if (this.invulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) this.invulnerable = false;
    }

    // Input bloccato (cutscene)
    if (!input.locked) {
      this._handleMovement(dt, input);
      this._handleFlashlight(dt, input);
      this.isInteract = input.justPressed('interact');
      this.isAiming   = input.isDown('aim');
      this.isCrouching= input.isDown('crouch');
    } else {
      this.vx = 0;
      this.isInteract = false;
    }

    // Applica movimento con collisioni
    if (collisionManager) {
      const moved = collisionManager.moveEntity(this, this.vx * dt, this.vy * dt);
      this.x = moved.x;
      this.y = moved.y;
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    // Aggiorna animazione
    this._chooseAnim();
    this._updateAnim(dt);
  }

  _handleMovement(dt, input) {
    this.isRunning = input.isDown('run');
    const spd = this.isRunning
      ? this.runSpeed * this._speedMultiplier()
      : this.speed   * this._speedMultiplier();

    this.vx = 0;
    if (input.isDown('moveLeft'))  { this.vx = -spd; this.facingRight = false; }
    if (input.isDown('moveRight')) { this.vx =  spd; this.facingRight = true;  }
  }

  _handleFlashlight(dt, input) {
    if (input.justPressed('flashlight')) {
      if (this.batteryHasCharge || this.flashlightOn) {
        this.flashlightOn = !this.flashlightOn;
      }
    }
    if (this.flashlightOn && this.battery > 0) {
      this.battery -= this.batteryDrainRate * dt;
      if (this.battery <= 0) {
        this.battery = 0;
        this.flashlightOn   = false;
        this.batteryHasCharge = false;
      }
    }
  }

  /** Moltiplicatore velocità in base alla salute */
  _speedMultiplier() {
    const state = this.healthState;
    if (state === HEALTH_STATE.CAUTION) return 0.85;
    if (state === HEALTH_STATE.DANGER)  return 0.65;
    return 1;
  }

  _chooseAnim() {
    if (this._animLocked) return;

    let anim = 'idle';
    if (!this.onGround)                      anim = 'idle'; // futuro: jump
    else if (this.vx !== 0 && this.isRunning) anim = 'run';
    else if (this.vx !== 0)                   anim = 'walk';
    else if (this.isAiming)                   anim = 'aim';
    else if (this.isCrouching)                anim = 'crouch';
    else if (this.flashlightOn)               anim = 'flashlight';

    if (anim !== this.currentAnim) this._setAnim(anim);
  }

  _setAnim(name, onComplete = null) {
    if (!this.animations[name]) return;
    this.currentAnim  = name;
    this.animFrame    = 0;
    this.animTimer    = 0;
    this._animOnComplete = onComplete;
    const def = this.animations[name];
    this._animLocked = !def.loop;
  }

  _updateAnim(dt) {
    const def = this.animations[this.currentAnim];
    if (!def) return;
    this.animTimer += dt;
    const frameDur = 1 / def.fps;
    if (this.animTimer >= frameDur) {
      this.animTimer -= frameDur;
      this.animFrame++;
      if (this.animFrame >= def.frames) {
        if (def.loop) {
          this.animFrame = 0;
        } else {
          this.animFrame = def.frames - 1;
          this._animLocked = false;
          if (this._animOnComplete) { this._animOnComplete(); this._animOnComplete = null; }
        }
      }
    }
  }

  /** Gioca un'animazione una volta (non-loop) e poi torna all'idle */
  playOnce(name, onComplete) {
    this._setAnim(name, () => {
      this._animLocked = false;
      this._setAnim('idle');
      if (onComplete) onComplete();
    });
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
      this._setAnim('death');
    } else {
      this.invulnerable      = true;
      this.invulnerableTimer = this.INVULN_TIME;
      this.playOnce('hurt');
    }
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (!this.alive && this.hp > 0) this.alive = true;
  }

  /** Ricarica batteria torcia */
  chargeBattery(amount = 100) {
    this.battery = Math.min(this.batteryMax, this.battery + amount);
    this.batteryHasCharge = this.battery > 0;
  }

  /* ── HITBOX ── */
  getHitbox() {
    return {
      x: this.x + this.hitboxOffX,
      y: this.y + this.hitboxOffY,
      w: this.hitboxW,
      h: this.hitboxH,
    };
  }

  /** Punto davanti al player per trigger interazioni */
  getInteractPoint() {
    return {
      x: this.x + (this.facingRight ? this.width + this.interactRange : -this.interactRange),
      y: this.y + this.height / 2,
    };
  }

  /* ── RENDER PLACEHOLDER ── */
  draw(ctx) {
    if (this.sprite) {
      // Quando avremo sprite reali
      this._drawSprite(ctx);
    } else {
      this._drawPlaceholder(ctx);
    }

    // Cono torcia
    if (this.flashlightOn) {
      this._drawFlashlight(ctx);
    }
  }

  _drawPlaceholder(ctx) {
    const blink = this.invulnerable && Math.floor(Date.now() / 80) % 2 === 0;
    if (blink) return;

    // Corpo
    ctx.fillStyle = this.alive ? '#a0b8d0' : '#606060';
    ctx.fillRect(this.x, this.y + 14, this.width, this.height - 14);

    // Testa
    ctx.fillStyle = this.alive ? '#c8a888' : '#808080';
    ctx.fillRect(this.x + 4, this.y, this.width - 8, 18);

    // Occhi
    const eyeX = this.facingRight ? this.x + this.width - 12 : this.x + 6;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(eyeX, this.y + 5, 5, 4);

    // Indicatore facing
    ctx.fillStyle = 'rgba(255,255,100,0.5)';
    if (this.facingRight) {
      ctx.fillRect(this.x + this.width, this.y + this.height/2 - 2, 6, 4);
    } else {
      ctx.fillRect(this.x - 6, this.y + this.height/2 - 2, 6, 4);
    }

    // Stato salute — bordo colorato
    const stateColor = { FINE:'#3ad66a', CAUTION:'#e8a030', DANGER:'#c0152a' }[this.healthState];
    ctx.strokeStyle = stateColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.lineWidth = 1;
  }

  _drawFlashlight(ctx) {
    const cx = this.facingRight ? this.x + this.width : this.x;
    const cy = this.y + this.height * 0.35;
    const angle = this.facingRight ? 0 : Math.PI;
    const spread = Math.PI / 5;  // ~36°
    const length = 320;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, length);
    gradient.addColorStop(0,   'rgba(255, 240, 180, 0.35)');
    gradient.addColorStop(0.3, 'rgba(255, 220, 140, 0.15)');
    gradient.addColorStop(1,   'rgba(255, 200, 100, 0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, length, angle - spread, angle + spread);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  _drawSprite(ctx) {
    // Implementazione futura con sprite sheet reali
    // Per ora fallback al placeholder
    this._drawPlaceholder(ctx);
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
    this.x           = data.x;
    this.y           = data.y;
    this.hp          = data.hp;
    this.facingRight = data.facingRight;
    this.battery     = data.battery ?? 100;
    this.flashlightOn= data.flashlightOn ?? false;
    this.alive       = this.hp > 0;
    this.batteryHasCharge = this.battery > 0;
  }
}
