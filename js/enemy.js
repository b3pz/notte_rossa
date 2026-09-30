/* =============================================
   NOTTE ROSSA — enemy.js
   Nemici base: Contaminato, Corridore
   State machine: IDLE → PATROL → CHASE → ATTACK → STUNNED → DEAD
   ============================================= */

import { CollisionManager } from './collision.js';

const ENEMY_DEFS = {
  contaminato: {
    id: 'contaminato', name: 'Contaminato',
    width: 36, height: 60,
    maxHp: 120,
    speed:     60,   // px/s
    chaseSpeed:90,
    attackDamage: 18,
    attackCooldown: 1.8,
    attackRange: 50,
    visionRange: 400,
    visionAngle: 0.7,  // radiani (poco angolo, vede dritto)
    stunnedTime: 0.5,
    patrolDelay: 1.5,  // secondi di pausa ai bordi
    color: '#4a2a1a',
    colorDark: '#2a1005',
  },
  corridore: {
    id: 'corridore', name: 'Corridore',
    width: 28, height: 52,
    maxHp:  50,
    speed:     40,
    chaseSpeed:220,
    attackDamage: 12,
    attackCooldown: 0.8,
    attackRange: 40,
    visionRange: 500,
    visionAngle: 1.0,
    stunnedTime: 0.2,
    patrolDelay: 0.8,
    color: '#3a1a30',
    colorDark: '#1a0a18',
  },
};

export const AI_STATE = {
  IDLE:       'IDLE',
  PATROL:     'PATROL',
  SUSPICIOUS: 'SUSPICIOUS',
  SEARCH:     'SEARCH',
  CHASE:      'CHASE',
  ATTACK:     'ATTACK',
  STUNNED:    'STUNNED',
  DEAD:       'DEAD',
};

export class Enemy {
  constructor(type, x, y, spawnDef = {}) {
    const def = ENEMY_DEFS[type] || ENEMY_DEFS.contaminato;
    this.def    = def;
    this.type   = type;
    this.x      = x;
    this.y      = y;
    this.width  = def.width;
    this.height = def.height;
    this.hp     = def.maxHp;
    this.maxHp  = def.maxHp;
    this.alive  = true;
    this.facingRight = true;

    // IA
    this.state  = AI_STATE.PATROL;
    this._stateTimer  = 0;
    this._patrolMin   = spawnDef.patrol?.[0] ?? x - 200;
    this._patrolMax   = spawnDef.patrol?.[1] ?? x + 200;
    this._patrolDir   = 1;
    this._patrolPause = 0;

    // Combattimento
    this._attackTimer  = 0;
    this._stunnedTimer = 0;
    this._invulnTimer  = 0;
    this.INVULN_TIME   = 0.3;

    // Offset hitbox
    this.hitboxOffX = 4;
    this.hitboxOffY = 4;
    this.hitboxW    = this.width - 8;
    this.hitboxH    = this.height - 4;

    // Animazione placeholder
    this._animTimer = 0;
    this._animFrame = 0;
  }

  update(dt, player, collisionManager) {
    if (!this.alive) return;

    // Invulnerabilità temporanea
    if (this._invulnTimer > 0) this._invulnTimer -= dt;
    if (this._attackTimer  > 0) this._attackTimer -= dt;

    switch (this.state) {
      case AI_STATE.IDLE:     this._updateIdle(dt, player); break;
      case AI_STATE.PATROL:   this._updatePatrol(dt, player, collisionManager); break;
      case AI_STATE.CHASE:    this._updateChase(dt, player, collisionManager); break;
      case AI_STATE.ATTACK:   this._updateAttack(dt, player); break;
      case AI_STATE.STUNNED:  this._updateStunned(dt); break;
      case AI_STATE.SUSPICIOUS:
      case AI_STATE.SEARCH:   this._updateSearch(dt, player); break;
    }

    // Aggiorna animazione
    this._animTimer += dt;
    if (this._animTimer > 0.15) { this._animTimer = 0; this._animFrame = (this._animFrame + 1) % 4; }
  }

  _canSeePlayer(player) {
    const dx = (player.x + player.width/2)  - (this.x + this.width/2);
    const dy = (player.y + player.height/2) - (this.y + this.height/2);
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > this.def.visionRange) return false;
    // Direzione facing
    const facingDX = this.facingRight ? 1 : -1;
    const dot = (dx / dist) * facingDX;
    return dot > Math.cos(this.def.visionAngle);
  }

  _distanceToPlayer(player) {
    const dx = (player.x + player.width/2)  - (this.x + this.width/2);
    const dy = (player.y + player.height/2) - (this.y + this.height/2);
    return Math.sqrt(dx*dx + dy*dy);
  }

  _updateIdle(dt, player) {
    this._stateTimer -= dt;
    if (this._stateTimer <= 0) this.setState(AI_STATE.PATROL);
    if (this._canSeePlayer(player)) this.setState(AI_STATE.CHASE);
  }

  _updatePatrol(dt, player, col) {
    if (this._patrolPause > 0) {
      this._patrolPause -= dt;
      if (this._canSeePlayer(player)) this.setState(AI_STATE.CHASE);
      return;
    }

    const speed = this.def.speed * dt;
    const newX  = this.x + this._patrolDir * speed;
    this.facingRight = this._patrolDir > 0;

    if (col) {
      const moved = col.moveEntity(this, this._patrolDir * speed, 0);
      this.x = moved.x;
      this.y = moved.y;
    } else {
      this.x = newX;
    }

    if (this.x <= this._patrolMin) { this._patrolDir =  1; this._patrolPause = this.def.patrolDelay; }
    if (this.x >= this._patrolMax) { this._patrolDir = -1; this._patrolPause = this.def.patrolDelay; }

    if (this._canSeePlayer(player)) this.setState(AI_STATE.CHASE);
  }

  _updateChase(dt, player, col) {
    const dist = this._distanceToPlayer(player);

    if (dist <= this.def.attackRange) {
      this.setState(AI_STATE.ATTACK);
      return;
    }

    const dx = (player.x + player.width/2) - (this.x + this.width/2);
    this.facingRight = dx > 0;
    const dir = dx > 0 ? 1 : -1;
    const speed = this.def.chaseSpeed * dt;

    if (col) {
      const moved = col.moveEntity(this, dir * speed, 0);
      this.x = moved.x;
      this.y = moved.y;
    } else {
      this.x += dir * speed;
    }

    // Se il giocatore è troppo lontano, torna a pattugliare
    if (dist > this.def.visionRange * 1.5) this.setState(AI_STATE.PATROL);
  }

  _updateAttack(dt, player) {
    const dist = this._distanceToPlayer(player);

    if (this._attackTimer <= 0) {
      player.takeDamage(this.def.attackDamage);
      this._attackTimer = this.def.attackCooldown;
    }

    if (dist > this.def.attackRange * 1.4) {
      this.setState(AI_STATE.CHASE);
    }
  }

  _updateSearch(dt, player) {
    this._stateTimer -= dt;
    if (this._canSeePlayer(player)) { this.setState(AI_STATE.CHASE); return; }
    if (this._stateTimer <= 0) this.setState(AI_STATE.PATROL);
  }

  _updateStunned(dt) {
    this._stunnedTimer -= dt;
    if (this._stunnedTimer <= 0) this.setState(AI_STATE.CHASE);
  }

  setState(newState) {
    this.state = newState;
    switch (newState) {
      case AI_STATE.IDLE:     this._stateTimer = 1.5; break;
      case AI_STATE.SEARCH:   this._stateTimer = 4.0; break;
      case AI_STATE.STUNNED:  this._stunnedTimer = this.def.stunnedTime; break;
    }
  }

  takeDamage(amount) {
    if (!this.alive || this._invulnTimer > 0) return;
    this.hp -= amount;
    this._invulnTimer = this.INVULN_TIME;
    if (this.hp <= 0) {
      this.hp    = 0;
      this.alive = false;
      this.state = AI_STATE.DEAD;
    } else {
      this.setState(AI_STATE.STUNNED);
      if (this.state !== AI_STATE.CHASE) this.setState(AI_STATE.CHASE);
    }
  }

  getHitbox() {
    return { x: this.x + this.hitboxOffX, y: this.y + this.hitboxOffY,
             w: this.hitboxW, h: this.hitboxH };
  }

  /* ── RENDER PLACEHOLDER ── */
  draw(ctx) {
    if (!this.alive) {
      this._drawDead(ctx);
      return;
    }
    const blink = this._invulnTimer > 0 && Math.floor(Date.now() / 70) % 2 === 0;
    if (blink) return;

    const def = this.def;

    // Corpo
    ctx.fillStyle = this.state === AI_STATE.ATTACK ? '#8a1010' : def.color;
    ctx.fillRect(this.x, this.y + 14, this.width, this.height - 14);

    // Testa (più distorta per i contaminati)
    ctx.fillStyle = def.colorDark;
    const tw = this.type === 'contaminato' ? this.width - 4 : this.width - 8;
    ctx.fillRect(this.x + 2, this.y, tw, 18);

    // Occhi — sempre aperti, inquietanti
    const eyeX = this.facingRight ? this.x + tw - 8 : this.x + 4;
    ctx.fillStyle = this.state === AI_STATE.CHASE || this.state === AI_STATE.ATTACK ? '#ff2020' : '#cc4040';
    ctx.fillRect(eyeX, this.y + 5, 5, 6);

    // Barra HP (piccola, sopra)
    if (this.hp < this.maxHp) {
      const hpPct = this.hp / this.maxHp;
      ctx.fillStyle = '#300';
      ctx.fillRect(this.x, this.y - 8, this.width, 4);
      ctx.fillStyle = hpPct > 0.5 ? '#a03030' : '#c04040';
      ctx.fillRect(this.x, this.y - 8, this.width * hpPct, 4);
    }

    // Stato IA (debug)
    // (gestito dal debug panel)
  }

  _drawDead(ctx) {
    ctx.fillStyle = 'rgba(60,20,10,0.7)';
    ctx.fillRect(this.x, this.y + this.height - 16, this.width, 16);
    ctx.fillStyle = 'rgba(80,30,15,0.4)';
    ctx.fillRect(this.x - 4, this.y + this.height - 8, this.width + 8, 8);
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
    this.enemies.push(e);
    return e;
  }

  clearEnemies() {
    this.enemies = [];
  }

  update(dt) {
    const player = this.game.player;
    const col    = this.game.collision;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.update(dt, player, col);
    }
    // Rimuovi i morti dopo un po'
    // (li lasciamo per ora visibili come cadaveri)
  }

  draw(ctx) {
    for (const e of this.enemies) {
      e.draw(ctx);
    }
    // Debug hitbox
    if (this.game.debug) {
      ctx.strokeStyle = 'rgba(255,50,50,0.5)';
      ctx.lineWidth = 1;
      for (const e of this.enemies) {
        const hb = e.getHitbox();
        ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
        if (e.alive) {
          ctx.fillStyle = 'rgba(255,150,0,0.6)';
          ctx.font = '9px monospace';
          ctx.fillText(e.state, e.x, e.y - 12);
        }
      }
    }
  }

  countAlive() { return this.enemies.filter(e => e.alive).length; }
}
