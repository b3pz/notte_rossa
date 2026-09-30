/* =============================================
   NOTTE ROSSA — game.js
   Game: loop principale, render, sequenza intro,
   gestione porte, interazioni, pausa, game over
   ============================================= */

import { Player }          from './player.js';
import { Camera }          from './camera.js';
import { InputManager }    from './input.js';
import { RoomManager }     from './rooms.js';
import { CollisionManager }from './collision.js';
import { AudioManager }    from './audio.js';
import { EventManager }    from './events.js';
import { DialogueManager } from './dialogue.js';
import { UIManager }       from './ui.js';
import { InventoryManager }from './inventory.js';
import { WeaponSystem }    from './weapons.js';
import { EnemyManager }    from './enemy.js';
import { SaveManager }     from './save.js';

const CANVAS_W = 1280;
const CANVAS_H =  720;

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');

    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;

    this.running = false;
    this.paused  = false;
    this.debug   = false;
    this._playTime  = 0;
    this._lastTime  = 0;
    this._fpsAvg    = 60;

    // Particelle pioggia
    this._rainParticles = [];
    this._lightFadeTimer    = 0;
    this._lightFadeDuration = 0;
    this._lightFadeActive   = false;
    this._lightFadeIndex    = 0;

    // Passi audio
    this._stepTimer = 0;

    this._initSystems();
    this._bindMenuEvents();
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize());
  }

  _initSystems() {
    // Ordine di inizializzazione importante
    this.input        = new InputManager();
    this.audio        = new AudioManager();
    this.player       = new Player(200, 300);
    this.camera       = new Camera(CANVAS_W, CANVAS_H);
    this.roomManager  = new RoomManager(this);
    this.collision    = new CollisionManager(this.roomManager);
    this.inventory    = new InventoryManager(this);
    this.weapon       = new WeaponSystem(this);
    this.enemyManager = new EnemyManager(this);
    this.events       = new EventManager(this);
    this.dialogue     = new DialogueManager(this);
    this.ui           = new UIManager(this);
    this.save         = new SaveManager(this);

    // Abilita "CONTINUA" se ci sono save
    if (this.save.hasSaveData()) {
      document.getElementById('btn-continua')?.removeAttribute('disabled');
    }
  }

  /* ══════════════════════════════════
     MENU & NAVIGAZIONE
     ══════════════════════════════════ */
  _bindMenuEvents() {
    document.getElementById('btn-nuova')?.addEventListener('click', () => {
      this.audio.resume();
      this._startNewGame();
    });

    document.getElementById('btn-continua')?.addEventListener('click', () => {
      this.audio.resume();
      this._continueGame();
    });

    document.getElementById('btn-carica')?.addEventListener('click', () => {
      this._showScreen('load-screen');
      this._renderLoadSlots();
    });

    document.getElementById('btn-opzioni')?.addEventListener('click', () => {
      this._showScreen('options-screen');
      this._bindOptionEvents();
    });

    document.getElementById('btn-crediti')?.addEventListener('click', () => {
      this._showScreen('credits-screen');
    });

    document.getElementById('btn-load-back')?.addEventListener('click', () => this._showScreen('main-menu'));
    document.getElementById('btn-opts-back')?.addEventListener('click', () => this._showScreen('main-menu'));
    document.getElementById('btn-cred-back')?.addEventListener('click', () => this._showScreen('main-menu'));
  }

  _showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.toggle('active', s.id === id);
    });
  }

  _renderLoadSlots() {
    const container = document.getElementById('load-slots');
    if (!container) return;
    container.innerHTML = '';
    const slots = this.save.getSlotsInfo();
    for (const s of slots) {
      const el = document.createElement('div');
      el.className = 'save-slot' + (s.empty ? ' empty' : '');
      el.innerHTML = `
        <span class="slot-name">SLOT ${s.slot + 1} — ${s.empty ? 'Vuoto' : s.room}</span>
        ${s.empty ? '' : `<span class="slot-info">${s.date} — ${this._formatTime(s.time)}</span>`}
      `;
      if (!s.empty) {
        el.addEventListener('click', () => {
          this.audio.resume();
          this._loadSlot(s.slot);
        });
      }
      container.appendChild(el);
    }
  }

  _bindOptionEvents() {
    ['music','sfx','amb'].forEach(cat => {
      const slider = document.getElementById(`opt-${cat}`);
      const label  = document.getElementById(`opt-${cat}-val`);
      if (!slider) return;
      slider.addEventListener('input', () => {
        label.textContent = slider.value;
        const audiocat = cat === 'amb' ? 'ambient' : cat;
        this.audio.setVolume(audiocat, parseInt(slider.value) / 100);
      });
    });

    document.getElementById('opt-debug')?.addEventListener('change', (e) => {
      this.debug = e.target.checked;
      this.ui.toggleDebug(this.debug);
    });
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  /* ══════════════════════════════════
     AVVIO PARTITA
     ══════════════════════════════════ */
  _startNewGame() {
    // Reset
    this.player       = new Player(200, 300);
    this.inventory    = new InventoryManager(this);
    this.weapon       = new WeaponSystem(this);
    this.enemyManager = new EnemyManager(this);
    this.events       = new EventManager(this);
    this._playTime    = 0;

    // Reinizializza componenti che dipendono dal game
    this.roomManager  = new RoomManager(this);
    this.collision    = new CollisionManager(this.roomManager);
    this.dialogue     = new DialogueManager(this);
    this.ui           = new UIManager(this);

    this._launchGame('train_wagon');
    this._startIntroSequence();
  }

  _continueGame() {
    if (!this.save.loadLast()) {
      this._startNewGame();
    }
  }

  _loadSlot(slot) {
    this.player       = new Player(200, 300);
    this.inventory    = new InventoryManager(this);
    this.weapon       = new WeaponSystem(this);
    this.enemyManager = new EnemyManager(this);
    this.events       = new EventManager(this);
    this.roomManager  = new RoomManager(this);
    this.collision    = new CollisionManager(this.roomManager);
    this.dialogue     = new DialogueManager(this);
    this.ui           = new UIManager(this);

    this._launchGame(null);  // stanza caricata da save
    this.save.loadGame(slot);
    this._showScreen(''); // chiudi schermate menu
  }

  _launchGame(startRoom) {
    // Mostra canvas, nascondi menu
    this._showScreen('');
    this.canvas.style.display = 'block';
    this.ui.showHUD();
    this.ui.toggleDebug(this.debug);

    if (startRoom) {
      this.roomManager.loadRoom(startRoom);
    }

    this.running = true;
    this._lastTime = performance.now();

    // Genera pioggia
    this._initRain(120);

    if (!this._rafId) {
      this._rafId = requestAnimationFrame((t) => this._loop(t));
    }
  }

  /* ══════════════════════════════════
     SEQUENZA INTRO CINEMATICA
     ══════════════════════════════════ */
  _startIntroSequence() {
    const ui = this.ui;
    const input = this.input;

    input.lock();
    ui.fadeOut(0, () => {   // parte già nero
      setTimeout(() => {
        // Fade-in sul vagone
        ui.fadeIn(2000, () => {
          // Tutorial after 2s
          this.events.trigger('tutorial_wagon');
        });
      }, 1500);
    });
  }

  /* ══════════════════════════════════
     GAME LOOP
     ══════════════════════════════════ */
  _loop(timestamp) {
    this._rafId = requestAnimationFrame((t) => this._loop(t));

    const dt = Math.min((timestamp - this._lastTime) / 1000, 0.05); // max 50ms
    this._lastTime = timestamp;

    if (!this.running) return;

    // FPS smooth
    this._fpsAvg = this._fpsAvg * 0.95 + (1 / dt) * 0.05;

    if (this.paused || this.ui.hasOpenOverlay()) {
      this._render(0);
      return;
    }

    this._playTime += dt;
    this._update(dt);
    this._render(dt);
    this.input.update();  // aggiorna stato precedente DOPO il frame
  }

  _update(dt) {
    const player = this.player;

    // Player
    player.update(dt, this.input, this.collision);

    // Camera
    this.camera.follow(player.x, player.y, player.width, player.height);
    this.camera.update(dt);

    // Arma: spara
    if (this.weapon.equipped && !this.dialogue.isActive()) {
      if (this.input.isDown('aim')) {
        if (this.input.isDown('shoot') || this.input.justPressed('shoot')) {
          const dir = player.facingRight ? 1 : -1;
          this.weapon.shoot(
            player.x + (player.facingRight ? player.width : 0),
            player.y + player.height * 0.35,
            dir, 0
          );
        }
      }
      if (this.input.justPressed('reload')) this.weapon.reload();
    }
    this.weapon.update(dt);

    // Nemici
    this.enemyManager.update(dt);

    // Game over?
    if (!player.alive) {
      this.ui.showGameOver();
      this.running = false;
      return;
    }

    // Interazione
    this._handleInteraction();

    // Porte
    this._handleDoors();

    // Inventario / Mappa toggle
    if (this.input.justPressed('inventory') && !this.ui.hasOpenOverlay()) {
      this.ui.openInventory();
    }
    if (this.input.justPressed('map') && !this.ui.hasOpenOverlay()) {
      this.ui.openMap();
    }
    if (this.input.justPressed('pause') && !this.ui.hasOpenOverlay()) {
      this.togglePause();
    }
    if (this.input.justPressed('debug')) {
      this.debug = !this.debug;
      this.ui.toggleDebug(this.debug);
    }

    // Passi audio
    this._updateSteps(dt);

    // Luce fade
    this._updateLightFade(dt);

    // HUD
    this.ui.updateHUD();
    this.ui.updateDebug(
      Math.round(this._fpsAvg), player,
      this.roomManager.current?.id,
      this.enemyManager.countAlive(),
      this.events.flags
    );
  }

  _handleInteraction() {
    const player   = this.player;
    const ip       = player.getInteractPoint();
    const inter    = this.roomManager.getInteractionAt(ip.x, ip.y);

    if (inter) {
      this.ui.showInteractPrompt(inter.label);
      if (player.isInteract) {
        this.events.onInteract(inter.onInteract || inter.id);
      }
    } else {
      this.ui.hideInteractPrompt();
    }
  }

  _handleDoors() {
    const player = this.player;
    const pRect  = {
      x: player.x + 4, y: player.y + player.height / 2,
      w: player.width - 8, h: player.height / 2,
    };
    const door = this.roomManager.getDoorAt(pRect);

    if (!door) return;

    // Portale verso la città (fine demo)
    if (!door.target) {
      if (player.isInteract && door.label) {
        this.dialogue.show('', door.label);
      }
      return;
    }

    // Porta bloccata
    if (door.locked) {
      if (player.isInteract) {
        // Controlla chiave nell'inventario
        if (door.keyId && this.inventory.hasItem(door.keyId)) {
          this.inventory.dropItem(this.inventory._slots.findIndex(s => s?.id === door.keyId));
          this.roomManager.markDoorOpen(door.id);
          door.locked = false;
          this.audio.playSfx('door_open');
          this.ui.showNotification(`${door.keyId.replace(/_/g,' ')} utilizzata.`);
        } else {
          const msg = door.label || 'La porta è bloccata.';
          this.dialogue.show('', msg);
          this.audio.playSfx('door_locked');
        }
      }
      return;
    }

    // Entra nella stanza (soglia: il giocatore si avvicina abbastanza)
    const doorCenterX = door.x + door.w / 2;
    const playerCX    = player.x + player.width / 2;
    if (Math.abs(playerCX - doorCenterX) < 30) {
      this._transitionToRoom(door.target, door.targetX, door.targetY, door.transitText);
    }
  }

  _transitionToRoom(roomId, targetX, targetY, text) {
    if (this._transitioning) return;
    this._transitioning = true;
    this.input.lock();

    this.ui.fadeOut(400, () => {
      this.roomManager.loadRoom(roomId, targetX, targetY);
      this.enemyManager.clearEnemies();
      // Rispawna nemici della nuova stanza (già fatto in loadRoom)
      this.ui.fadeIn(400, () => {
        this._transitioning = false;
        this.input.unlock();
      });
    });
  }

  _updateSteps(dt) {
    const player = this.player;
    if (player.vx === 0) { this._stepTimer = 0; return; }
    const interval = player.isRunning ? 0.28 : 0.45;
    this._stepTimer += dt;
    if (this._stepTimer >= interval) {
      this._stepTimer = 0;
      this.audio.playStep('concrete', player.isRunning);
    }
  }

  /* ══════════════════════════════════
     EFFETTO LUCE (sequenza banchina)
     ══════════════════════════════════ */
  startLightFade(duration = 8) {
    this._lightFadeActive   = true;
    this._lightFadeDuration = duration;
    this._lightFadeTimer    = 0;
    this._lightFadeIndex    = 0;
    this._origLightLevel    = this.roomManager.current?.lightLevel ?? 0.2;
  }

  _updateLightFade(dt) {
    if (!this._lightFadeActive) return;
    this._lightFadeTimer += dt;

    const room = this.roomManager.current;
    if (!room) return;

    const t = this._lightFadeTimer / this._lightFadeDuration;

    // Spegni luci decorative una per una
    if (room.bgDecorations) {
      const lightsCount = room.bgDecorations.filter(d => d.type === 'flicker_light').length;
      const nextIndex   = Math.floor(t * lightsCount);
      const lights      = room.bgDecorations.filter(d => d.type === 'flicker_light');
      for (let i = 0; i < Math.min(nextIndex, lightsCount); i++) {
        if (lights[i]) lights[i].intensity = Math.max(0, lights[i].intensity - dt * 0.8);
      }
    }

    // Abbassa lightLevel generale
    room.lightLevel = Math.max(0.02, this._origLightLevel * (1 - t * 0.95));

    if (t >= 1) {
      this._lightFadeActive = false;
      room.lightLevel = 0.02;
    }
  }

  /* ══════════════════════════════════
     TITOLO CINEMATICO
     ══════════════════════════════════ */
  showCinematicTitle(duration) {
    this.ui.showCinematicTitle(duration);
  }

  /* ══════════════════════════════════
     RENDER
     ══════════════════════════════════ */
  _render(dt) {
    const ctx    = this.ctx;
    const canvas = this.canvas;
    const cam    = this.camera;
    const room   = this.roomManager.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background globale
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!room) return;

    // Applica trasformazione camera
    cam.applyTransform(ctx);

    // 1. Background + luci + muri
    this.roomManager.drawBackground(ctx);

    // 2. Porte
    this.roomManager.drawDoors(ctx);

    // 3. Trigger zone (debug)
    this.roomManager.drawInteractions(ctx);

    // 4. Nemici
    this.enemyManager.draw(ctx);

    // 5. Proiettili
    this.weapon.draw(ctx);

    // 6. Player
    this.player.draw(ctx);

    // 7. Primo piano
    this.roomManager.drawForeground(ctx);

    // 8. Overlay oscurità ambientale
    this._drawDarkness(ctx, room);

    // 9. Pioggia (in spazio mondo — banchina esterno)
    if (room.id === 'station_platform') {
      this._drawRainWorld(ctx, room);
    }

    cam.restoreTransform(ctx);

    // 10. Pioggia overlay schermo (per tutte le stanze con finestre)
    this._drawRainScreen(ctx);

    // 11. Vignetta
    this._drawVignette(ctx);
  }

  _drawDarkness(ctx, room) {
    const lightLevel = room.lightLevel ?? 0.3;
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - lightLevel)})`;
    ctx.fillRect(0, 0, room.width, room.height);
  }

  _drawRainWorld(ctx, room) {
    ctx.strokeStyle = 'rgba(140,150,180,0.15)';
    ctx.lineWidth   = 1;
    for (const p of this._rainParticles) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.05, p.y + p.vy * 0.05);
      ctx.stroke();
    }
  }

  _drawRainScreen(ctx) {
    // Pioggia in coordinate schermo (sopra tutto)
    ctx.strokeStyle = 'rgba(120,130,170,0.08)';
    ctx.lineWidth   = 1;
    for (const p of this._rainParticles) {
      const sx = ((p.x - this.camera.x) * this.camera.zoom + CANVAS_W / 2) % CANVAS_W;
      const sy = ((p.y - this.camera.y) * this.camera.zoom) % CANVAS_H;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 2, sy + 10);
      ctx.stroke();
    }
  }

  _drawVignette(ctx) {
    const player = this.player;
    const danger = player.healthState === 'DANGER';

    const vg = ctx.createRadialGradient(
      CANVAS_W/2, CANVAS_H/2, CANVAS_H * 0.25,
      CANVAS_W/2, CANVAS_H/2, CANVAS_H * 0.75
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, danger
      ? `rgba(60,0,0,${0.5 + Math.sin(Date.now()*0.003)*0.1})`
      : 'rgba(0,0,0,0.55)'
    );
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  /* ══════════════════════════════════
     PIOGGIA PARTICELLE
     ══════════════════════════════════ */
  _initRain(count = 120) {
    this._rainParticles = [];
    const room = this.roomManager.current;
    const W = room?.width || 3000;
    for (let i = 0; i < count; i++) {
      this._rainParticles.push(this._newRainParticle(W));
    }
    // Aggiorna pioggia ogni frame tramite RAF separato leggero
    this._updateRainLoop();
  }

  _newRainParticle(W = 3000) {
    return {
      x:  Math.random() * W,
      y:  Math.random() * 600,
      vx: -30 + Math.random() * -20,
      vy:  300 + Math.random() * 200,
    };
  }

  _updateRainLoop() {
    if (!this.running) return;
    const dt    = 0.016;
    const room  = this.roomManager.current;
    const W     = room?.width || 3000;
    const floorY= room?.floorY || 460;
    for (const p of this._rainParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > floorY || p.x < 0) {
        p.x  = Math.random() * W;
        p.y  = -20;
        p.vx = -30 + Math.random() * -20;
        p.vy =  300 + Math.random() * 200;
      }
    }
    requestAnimationFrame(() => this._updateRainLoop());
  }

  /* ══════════════════════════════════
     RESIZE
     ══════════════════════════════════ */
  _handleResize() {
    const canvas  = this.canvas;
    const wrapper = document.getElementById('game-wrapper');
    const ww      = wrapper.clientWidth;
    const wh      = wrapper.clientHeight;
    const scale   = Math.min(ww / CANVAS_W, wh / CANVAS_H);
    canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
    canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
  }

  /* ══════════════════════════════════
     PAUSA / MENU / GAME OVER
     ══════════════════════════════════ */
  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.ui.openPause();
    } else {
      this.ui.closePause();
    }
  }

  returnToMenu() {
    this.running = false;
    this.paused  = false;
    this.canvas.style.display = 'none';
    document.getElementById('pause-screen')?.classList.add('hidden');
    document.getElementById('gameover-screen')?.classList.add('hidden');
    document.getElementById('hud')?.classList.add('hidden');
    this._showScreen('main-menu');
    // Aggiorna stato "CONTINUA"
    if (this.save.hasSaveData()) {
      document.getElementById('btn-continua')?.removeAttribute('disabled');
    }
  }
}
