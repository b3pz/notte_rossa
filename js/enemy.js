/* =============================================
   NOTTE ROSSA — enemy.js
   Nemici: Contaminato (+ varianti ferroviere / infermiere / tecnico),
   Corridore, Crawler, Listener.
   Gioco a corsia unica: distanze solo sull'asse X.
   ============================================= */

import { SpriteLib } from './sprites.js';

export const ENEMY_DEFS = {
  contaminato: {
    name: 'Contaminato', sprite: 'contaminato',
    width: 80, height: 260, maxHp: 110,
    speed: 55, chaseSpeed: 88,
    damage: 18, cooldown: 1.6, windup: 0.4, range: 95,
    vision: 520, stun: 0.35,
  },
  corridore: {
    name: 'Corridore', sprite: 'corridore',
    width: 110, height: 170, maxHp: 55,
    speed: 60, chaseSpeed: 270,
    damage: 12, cooldown: 0.8, windup: 0.2, range: 105,
    vision: 720, stun: 0.25,
  },
  crawler: {
    name: 'Crawler', sprite: 'crawler',
    width: 150, height: 120, maxHp: 65,
    speed: 45, chaseSpeed: 175,
    damage: 20, cooldown: 1.2, windup: 0.25, range: 120,
    vision: 400, stun: 0.3,
  },
  listener: {
    name: 'Listener', sprite: 'listener',
    width: 80, height: 260, maxHp: 90,
    speed: 32, chaseSpeed: 215,
    damage: 32, cooldown: 2.0, windup: 0.45, range: 100,
    vision: 150, hearing: true, stun: 0.6,
  },
  // Varianti del Contaminato (camminata, attacco e morte proprie)
  ferroviere: {
    name: 'Ferroviere', sprite: 'ferroviere',
    width: 80, height: 260, maxHp: 100,
    speed: 45, chaseSpeed: 80,
    damage: 18, cooldown: 1.7, windup: 0.45, range: 95,
    vision: 480, stun: 0.35,
  },
  infermiere: {
    name: 'Infermiere', sprite: 'infermiere',
    width: 80, height: 260, maxHp: 90,
    speed: 50, chaseSpeed: 95,
    damage: 16, cooldown: 1.4, windup: 0.4, range: 95,
    vision: 520, stun: 0.35,
  },
  tecnico: {
    name: 'Tecnico', sprite: 'tecnico',
    width: 80, height: 260, maxHp: 130,
    speed: 40, chaseSpeed: 75,
    damage: 24, cooldown: 1.9, windup: 0.5, range: 100,
    vision: 460, stun: 0.3,
  },
};

export const AI_STATE = {
  IDLE: 'IDLE', PATROL: 'PATROL', CEILING: 'CEILING', DROP: 'DROP',
  CHASE: 'CHASE', ATTACK: 'ATTACK', STUNNED: 'STUNNED', SEARCH: 'SEARCH', DEAD: 'DEAD',
};

export class Enemy {
  constructor(type, x, y, spawnDef = {}) {
    let def = ENEMY_DEFS[type] || ENEMY_DEFS.contaminato;
    this.type   = ENEMY_DEFS[type] ? type : 'contaminato';
    this.key    = spawnDef.id || `${type}_${Math.round(x)}`;
    const sc    = spawnDef.scale ?? 1;
    this.scale  = sc;
    const k     = 0.35 + 0.65 * sc;
    // copia della definizione adattata all'inquadratura
    this.def    = def = { ...def,
      speed: def.speed * k, chaseSpeed: def.chaseSpeed * k,
      range: def.range * sc, vision: def.vision * sc };
    this.width  = Math.round(def.width * sc);
    this.height = Math.round(def.height * sc);
    this.x      = x;
    this.y      = y;
    this.hp     = def.maxHp;
    this.maxHp  = def.maxHp;
    this.alive  = true;
    this.facingRight = spawnDef.facingRight ?? (Math.random() < 0.5);

    this._patrolMin = spawnDef.patrol?.[0] ?? Math.max(60, x - 220);
    this._patrolMax = spawnDef.patrol?.[1] ?? Math.min(1220 - def.width, x + 220);
    this._pause     = 0.5 + Math.random();

    this.state       = spawnDef.ceiling ? AI_STATE.CEILING : (spawnDef.idle ? AI_STATE.IDLE : AI_STATE.PATROL);
    this._timer      = 0;
    this._attackCd   = 0.6;
    this._windup     = 0;
    this._alertTimer = 0;
    this._deadTimer  = 0;
    this._dropY      = 0;

    this.anim      = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;
    this._phase    = Math.random() * 10;
  }

  get centerX() { return this.x + this.width / 2; }

  /** Adatta la dimensione alla profondità (pavimenti inclinati) */
  setScale(s, foot) {
    if (Math.abs(s - this.scale) < 0.002) { if (this.alive && this.state !== AI_STATE.CEILING) this.y = foot - this.height; return; }
    const cx = this.centerX, base = ENEMY_DEFS[this.type];
    this.scale = s;
    this.width = Math.round(base.width * s);
    this.height = Math.round(base.height * s);
    this.x = cx - this.width / 2;
    this.y = foot - this.height;
  }
  get footY()   { return this.y + this.height; }

  /* ── PERCEZIONE ── */
  _dx(player)   { return player.centerX - this.centerX; }

  _canSee(player) {
    if (!player.alive) return false;
    const dx = this._dx(player), dist = Math.abs(dx);
    if (dist < 110 * this.scale) return true;
    let range = this.def.vision;
    if (player.flashlightOn) range *= 1.35;
    if (player.isCrouching)  range *= 0.6;
    if (dist > range) return false;
    return (dx > 0) === this.facingRight;
  }

  _canHear(player) {
    if (!this.def.hearing || !player.alive) return false;
    const dist = Math.abs(this._dx(player));
    const n = player.noiseLevel;
    return (n >= 3 && dist < 1300) || (n === 2 && dist < 900) || (n === 1 && dist < 320);
  }

  _notice(player) {
    return this._canSee(player) || this._canHear(player);
  }

  /* ── UPDATE ── */
  update(dt, player, col) {
    if (this._hitFlash > 0) this._hitFlash -= dt;
    if (this._alertTimer > 0) this._alertTimer -= dt;
    if (!this.alive) {
      this._deadTimer += dt;
      this._animate(dt);
      return;
    }
    if (this._attackCd > 0) this._attackCd -= dt;

    const dx   = this._dx(player);
    const dist = Math.abs(dx);

    switch (this.state) {
      case AI_STATE.CEILING:
        if (player.alive && dist < 230 * this.scale) {
          this.state = AI_STATE.DROP;
          this._dropY = -(150 * this.scale);   // parte dal soffitto
          this._alertTimer = 1;
          this.facingRight = dx > 0;
        }
        break;

      case AI_STATE.DROP:
        this._dropY += 1600 * dt;
        if (this._dropY >= 0) { this._dropY = 0; this._toChase(); }
        break;

      case AI_STATE.IDLE:
        this._timer -= dt;
        if (this._notice(player)) this._toChase();
        break;

      case AI_STATE.PATROL:
        if (this._pause > 0) {
          this._pause -= dt;
        } else {
          const dir = this.facingRight ? 1 : -1;
          this._move(col, dir * this.def.speed * dt);
          if (this.x <= this._patrolMin) { this.facingRight = true;  this._pause = 1 + Math.random() * 1.5; }
          if (this.x >= this._patrolMax) { this.facingRight = false; this._pause = 1 + Math.random() * 1.5; }
        }
        if (this._notice(player)) this._toChase();
        break;

      case AI_STATE.CHASE:
        this.facingRight = dx > 0;
        if (!player.alive) { this.state = AI_STATE.PATROL; break; }
        if (dist <= this.def.range) {
          this.state   = AI_STATE.ATTACK;
          this._windup = this.def.windup;
          break;
        }
        this._move(col, Math.sign(dx) * this.def.chaseSpeed * dt);
        // Il Listener perde la traccia se il giocatore torna silenzioso e lontano
        if (this.def.hearing && !this._notice(player) && dist > 500) {
          this.state = AI_STATE.SEARCH; this._timer = 3;
        }
        break;

      case AI_STATE.ATTACK:
        this.facingRight = dx > 0;
        if (this._windup > 0) {
          this._windup -= dt;
          if (this._windup <= 0) {
            if (dist <= this.def.range + 25 && this._attackCd <= 0) {
              if (player.takeDamage(this.def.damage)) this.onHitPlayer?.();
              this._attackCd = this.def.cooldown;
            }
          }
        } else if (dist > this.def.range + 30) {
          this.state = AI_STATE.CHASE;
        } else if (this._attackCd <= 0) {
          this._windup = this.def.windup;
        }
        break;

      case AI_STATE.STUNNED:
        this._timer -= dt;
        if (this._timer <= 0) this.state = AI_STATE.CHASE;
        break;

      case AI_STATE.SEARCH:
        this._timer -= dt;
        if (this._notice(player)) this._toChase();
        else if (this._timer <= 0) this.state = AI_STATE.PATROL;
        break;
    }

    this._animate(dt);
  }

  _toChase() {
    if (this.state !== AI_STATE.CHASE && this.state !== AI_STATE.ATTACK) this._alertTimer = 1.1;
    this.state = AI_STATE.CHASE;
  }

  _move(col, dx) {
    if (col) {
      const m = col.moveEntity(this, dx, 0);
      this.x = m.x;
    } else {
      this.x += dx;
    }
  }

  takeDamage(amount, knockDir = 0) {
    if (!this.alive) return;
    this.hp -= amount;
    this._hitFlash = 0.09;
    this.x += knockDir * 18 * this.scale;
    if (this.state === AI_STATE.CEILING || this.state === AI_STATE.DROP) this._dropY = 0;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.state = AI_STATE.DEAD;
      this._deadTimer = 0;
      this.animFrame = 0;
      return;
    }
    this.state  = AI_STATE.STUNNED;
    this._timer = this.def.stun;
    this._alertTimer = 0.8;
  }

  getHitbox() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  /* ── ANIMAZIONE ── */
  _pickAnim() {
    const s = this.def.sprite;
    const has = (a) => SpriteLib.has(s, a);
    switch (this.state) {
      case AI_STATE.DEAD:    return has('dead') ? 'dead' : (has('hurt') ? 'hurt' : 'idle');
      case AI_STATE.CEILING: return has('ceiling') ? 'ceiling' : 'idle';
      case AI_STATE.DROP:    return has('leap') ? 'leap' : 'idle';
      case AI_STATE.STUNNED: return has('hurt') ? 'hurt' : 'idle';
      case AI_STATE.ATTACK:  return has('attack') ? 'attack' : 'idle';
      case AI_STATE.CHASE:   return has('run') ? 'run' : (has('walk') ? 'walk' : 'idle');
      case AI_STATE.SEARCH:  return has('listen') ? 'listen' : 'idle';
      case AI_STATE.PATROL:  return this._pause > 0 ? (has('listen') && Math.sin(this._phase) > 0 ? 'listen' : 'idle') : (has('walk') ? 'walk' : 'idle');
      default:               return 'idle';
    }
  }

  _animate(dt) {
    this._phase += dt;
    const next = this._pickAnim();
    if (next !== this.anim) { this.anim = next; this.animFrame = 0; this.animTimer = 0; }
    const def = SpriteLib.animDef(this.def.sprite, this.anim);
    if (!def) return;
    this.animTimer += dt;
    let fps = def.fps;
    if (this.anim === 'walk' || this.anim === 'run') {
      const spd = this.state === AI_STATE.CHASE ? this.def.chaseSpeed : this.def.speed;
      const stride = (this.type === 'crawler' ? 60 : this.type === 'corridore' ? 85 : 45) * this.scale;
      fps = Math.max(2, spd / stride);
    }
    const fd = 1 / fps;
    while (this.animTimer >= fd) {
      this.animTimer -= fd;
      if (this.animFrame < def.frames - 1) this.animFrame++;
      else if (def.loop) this.animFrame = 0;
    }
  }

  /* ── RENDER ── */
  draw(ctx) {
    const s = this.def.sprite;
    const moving = this.state === AI_STATE.CHASE || (this.state === AI_STATE.PATROL && this._pause <= 0);
    const opts = { scale: this.scale };
    let footY = this.footY;

    if (!this.alive) {
      // Dopo qualche secondo il corpo resta, un po' più scuro
      opts.alpha = Math.max(0.55, 1 - this._deadTimer * 0.15);
      if (!SpriteLib.has(s, 'dead')) {
        const t = Math.min(1, this._deadTimer / 0.35);
        opts.rotate = (this.facingRight ? -1 : 1) * t * Math.PI / 2;
        footY -= t * 35 * this.scale;
      }
    } else if (this.state === AI_STATE.CEILING) {
      footY = this.y - 150 * this.scale;  // appeso in alto
    } else if (this.state === AI_STATE.DROP) {
      footY = this.footY + Math.min(0, this._dropY);
    } else if (this.def.singlePose) {
      // Posa unica: barcollamento
      const sp = moving ? (this.state === AI_STATE.CHASE ? 9 : 5) : 1.5;
      opts.skew   = Math.sin(this._phase * sp) * (moving ? 0.06 : 0.02);
      footY      -= moving ? Math.abs(Math.sin(this._phase * sp)) * 6 : 0;
      if (this.state === AI_STATE.ATTACK) opts.rotate = (this.facingRight ? 1 : -1) * (this._windup > 0 ? 0.12 : 0.2);
      if (this.state === AI_STATE.STUNNED) opts.rotate = (this.facingRight ? -1 : 1) * 0.15;
    }

    // ombra sul pavimento (anche se il Crawler è appeso: si stringe mentre cade)
    const sc = this.scale;
    let sw = Math.max(this.width * 1.25, 100 * sc), sa = 0.55;
    if (!this.alive) { sw = Math.max(sw, 230 * sc); sa = 0.45; }
    if (this.state === AI_STATE.CEILING) { sw *= 0.55; sa = 0.22; }
    if (this.state === AI_STATE.DROP) { const t = 1 + Math.min(0, this._dropY) / (150 * sc); sw *= 0.55 + 0.45 * t; sa = 0.22 + 0.33 * t; }
    SpriteLib.drawShadow(ctx, this.centerX, this.footY - 2 * sc, sw, sa);

    if (this._hitFlash > 0) ctx.filter = 'brightness(2.4) saturate(0.4)';
    const ok = SpriteLib.draw(ctx, s, this.anim, this.animFrame, this.centerX, footY, this.facingRight, opts);
    ctx.filter = 'none';
    if (!ok) {
      ctx.fillStyle = this.alive ? '#3a2a24' : 'rgba(60,20,10,0.6)';
      ctx.fillRect(this.x, this.alive ? this.y : this.footY - 30, this.width, this.alive ? this.height : 30);
    }

    // "!" quando ti nota
    if (this.alive && this._alertTimer > 0) {
      const top = (this.state === AI_STATE.CEILING ? this.y - 150 * this.scale : this.y) - 50 * this.scale;
      SpriteLib.drawIcon(ctx, 'alert', this.centerX, top, 40, Math.min(1, this._alertTimer * 2));
    }

    // barra vita dopo il primo colpo
    if (this.alive && this.hp < this.maxHp) {
      const w = 70, pct = this.hp / this.maxHp;
      const bx = this.centerX - w / 2, by = this.y - 16;
      ctx.fillStyle = 'rgba(20,0,0,0.7)'; ctx.fillRect(bx, by, w, 5);
      ctx.fillStyle = '#b02020';          ctx.fillRect(bx, by, w * pct, 5);
    }
  }
}

/* ══════════════════════════════════════════════
   ENEMY MANAGER
   ══════════════════════════════════════════════ */
export class EnemyManager {
  constructor(game) {
    this.game    = game;
    this.enemies = [];
  }

  spawnEnemy(type, x, y, spawnDef = {}) {
    const e = new Enemy(type, x, y, spawnDef);
    e.onHitPlayer = () => {
      this.game.audio?.playSfx('hurt');
      this.game.camera?.shake(8, 0.2);
    };
    this.enemies.push(e);
    return e;
  }

  clearEnemies() { this.enemies = []; }

  update(dt) {
    const player = this.game.player;
    const col    = this.game.collision;
    for (const e of this.enemies) {
      const wasAlive = e.alive, was = e.state;
      e.update(dt, player, col);
      if (wasAlive && !e.alive) { this.onEnemyKilled(e); this._sound(e, 'enemy_death'); continue; }
      this._voice(e, was, dt);
    }
  }

  /** Versi dei nemici: più forti se sono vicini (si sentono anche fuori schermo) */
  _sound(e, id, base = 1) {
    const d = Math.abs(e.centerX - this.game.player.centerX);
    const v = base * Math.max(0, 1 - d / 1400);
    if (v > 0.05) this.game.audio?.playSfx(id, v);
  }

  _voice(e, was, dt) {
    const s = e.state;
    if (s === AI_STATE.DROP && was !== AI_STATE.DROP) this._sound(e, 'crawler_drop');
    else if (s === AI_STATE.CHASE && was !== AI_STATE.CHASE && was !== AI_STATE.ATTACK && was !== AI_STATE.STUNNED) {
      this._sound(e, e.type === 'listener' ? 'listener_shriek' : e.type === 'corridore' ? 'runner_scream' : 'enemy_alert');
    } else if (s === AI_STATE.ATTACK && was !== AI_STATE.ATTACK) this._sound(e, 'enemy_attack', 0.8);
    // rantoli ogni tanto, finché non ti hanno visto
    if (s === AI_STATE.PATROL || s === AI_STATE.IDLE) {
      e._groanCd = (e._groanCd ?? 3 + Math.random() * 6) - dt;
      if (e._groanCd <= 0) { e._groanCd = 6 + Math.random() * 8; this._sound(e, 'enemy_groan', 0.6); }
    }
  }

  /** Chiamato da WeaponSystem quando un nemico muore */
  onEnemyKilled(e) {
    if (e._dropped) return;
    e._dropped = true;
    this.game.roomManager?.markEnemyKilled(e.key);
    this._maybeDrop(e);
    this.game.events?.onEnemyKilled?.(e);
  }

  /** A volte un nemico abbattuto lascia munizioni (più facile se sei a corto) */
  _maybeDrop(e) {
    const g = this.game, inv = g.inventory, rm = g.roomManager, room = rm.current;
    if (!room) return;
    const hasShotgun = inv.hasItem('shotgun');
    const low9 = inv.countItem('ammo_pistol_small') + (g.weapon._mags?.pistol ?? 0) < 12;
    const lowSh = hasShotgun && inv.countItem('ammo_shells') < 6;
    const chance = (low9 || lowSh) ? 0.8 : 0.4;
    if (Math.random() > chance) return;
    const shells = hasShotgun && (lowSh || Math.random() < 0.35);
    this._dropN = (this._dropN || 0) + 1;
    const x = Math.max(40, Math.min(room.width - 120, e.centerX - 40));
    room.hotspots.push({
      id: `drop_${room.id}_${this._dropN}_${Date.now() % 100000}`, x, w: 80,
      label: shells ? 'Cartucce' : 'Munizioni 9mm', icon: shells ? 'ammo_shells' : 'ammo_pistol',
      iconY: room.floorAt(x + 40) - 18 * room.scale, give: [[shells ? 'ammo_shells' : 'ammo_pistol_small', shells ? 4 : 8]],
      dropped: true,
    });
  }

  draw(ctx) {
    // prima i morti, poi i vivi
    for (const e of this.enemies) if (!e.alive) e.draw(ctx);
    for (const e of this.enemies) if (e.alive)  e.draw(ctx);
    if (this.game.debug) {
      ctx.lineWidth = 1;
      for (const e of this.enemies) {
        ctx.strokeStyle = 'rgba(255,50,50,0.6)';
        ctx.strokeRect(e.x, e.y, e.width, e.height);
        ctx.fillStyle = '#fa0'; ctx.font = '12px monospace';
        ctx.fillText(e.state, e.x, e.y - 22);
      }
    }
  }

  countAlive() { return this.enemies.filter(e => e.alive).length; }
}
