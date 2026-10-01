/* =============================================
   NOTTE ROSSA — game.js
   Loop, render, porte, interazioni, pausa, finale
   ============================================= */

import { Player }           from './player.js';
import { Camera }           from './camera.js';
import { InputManager }     from './input.js';
import { RoomManager } from './rooms.js';
import { CollisionManager } from './collision.js';
import { AudioManager }     from './audio.js';
import { EventManager }     from './events.js';
import { DialogueManager }  from './dialogue.js';
import { UIManager }        from './ui.js';
import { InventoryManager } from './inventory.js';
import { WeaponSystem }     from './weapons.js';
import { EnemyManager }     from './enemy.js';
import { SaveManager }      from './save.js';
import { ITEMS, DOCUMENTS } from './items.js';
import { SpriteLib }        from './sprites.js';
import { LayoutEditor }     from './editor.js';
import { TouchControls }    from './touch.js';

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
    this._playTime = 0;
    this._lastTime = 0;
    this._fpsAvg   = 60;
    this._rain     = [];
    this._edgeMsgCd = 0;

    this._darkCanvas = document.createElement('canvas');
    this._darkCanvas.width = CANVAS_W;
    this._darkCanvas.height = CANVAS_H;
    this._darkCtx = this._darkCanvas.getContext('2d');

    SpriteLib.preload();

    // Sistemi creati una volta sola (legano eventi DOM)
    this.input    = new InputManager();
    this.audio    = new AudioManager();
    this.camera   = new Camera(CANVAS_W, CANVAS_H);
    this.save     = new SaveManager(this);
    this._resetState();
    this.dialogue = new DialogueManager(this);
    this.ui       = new UIManager(this);
    this.editor   = new LayoutEditor(this);
    this.touch    = new TouchControls(this);
    this.roomManager.preload();

    if (this.save.hasSaveData()) document.getElementById('btn-continua')?.removeAttribute('disabled');

    this._bindMenuEvents();
    this._handleResize();
    window.addEventListener('resize', () => this._handleResize());
    this._rafId = requestAnimationFrame(t => this._loop(t));
  }

  /** Stato di partita: ricreato a ogni nuova partita / caricamento */
  _resetState() {
    this.player       = new Player(100, 400);
    this.roomManager  = new RoomManager(this);
    this.collision    = new CollisionManager(this.roomManager);
    this.inventory    = new InventoryManager(this);
    this.weapon       = new WeaponSystem(this);
    this.enemyManager = new EnemyManager(this);
    this.events       = new EventManager(this);
    this._playTime    = 0;
    this._transitioning = false;
    this._lightFadeActive = false;
    this.paused = false;
    this._ended = false;
    this.input?.flush();
    this.input?.unlock();
    this.dialogue?.close();
  }

  itemName(id) { return ITEMS[id]?.name || id; }

  /* ══════════ MENU ══════════ */
  _bindMenuEvents() {
    const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
    on('btn-nuova',    () => { this.audio.resume(); this._startNewGame(); });
    on('btn-continua', () => { this.audio.resume(); this._continueGame(); });
    on('btn-carica',   () => { this._showScreen('load-screen'); this._renderLoadSlots(); });
    on('btn-opzioni',  () => { this._showScreen('options-screen'); });
    on('btn-crediti',  () => this._showScreen('credits-screen'));
    on('btn-load-back', () => this._showScreen('main-menu'));
    on('btn-opts-back', () => this._showScreen('main-menu'));
    on('btn-cred-back', () => this._showScreen('main-menu'));
    this._bindOptionEvents();
  }

  _showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }

  _renderLoadSlots() {
    const box = document.getElementById('load-slots');
    if (!box) return;
    box.innerHTML = '';
    for (const s of this.save.getSlotsInfo()) {
      const el = document.createElement('div');
      el.className = 'save-slot' + (s.empty ? ' empty' : '');
      el.innerHTML = `<span class="slot-name">SLOT ${s.slot + 1} — ${s.empty ? 'Vuoto' : s.room}</span>
        ${s.empty ? '' : `<span class="slot-info">${s.date} — ${this._formatTime(s.time)}</span>`}`;
      if (!s.empty) el.addEventListener('click', () => { this.audio.resume(); this._loadSlot(s.slot); });
      box.appendChild(el);
    }
  }

  _bindOptionEvents() {
    ['music', 'sfx', 'amb'].forEach(cat => {
      const slider = document.getElementById(`opt-${cat}`);
      const label  = document.getElementById(`opt-${cat}-val`);
      if (!slider) return;
      slider.addEventListener('input', () => {
        if (label) label.textContent = slider.value;
        this.audio.setVolume(cat === 'amb' ? 'ambient' : cat, parseInt(slider.value) / 100);
      });
    });
    document.getElementById('opt-debug')?.addEventListener('change', e => {
      this.debug = e.target.checked;
      this.ui.toggleDebug(this.debug);
    });
  }

  _formatTime(sec) {
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /* ══════════ AVVIO ══════════ */
  _startNewGame() {
    this._resetState();
    this.ui.resetOverlays();
    this.ui.fadeOut(0);
    this._launchGame('train_wagon');
    this.input.lock();
    setTimeout(() => this.ui.fadeIn(2200, () => this.events.trigger('tutorial_wagon')), 900);
  }

  _continueGame() {
    const slot = this.save.latestSlot();
    if (slot === null) { this._startNewGame(); return; }
    this._loadSlot(slot);
  }

  _loadSlot(slot) {
    this._resetState();
    this.ui.resetOverlays();
    this._launchGame(null);
    if (!this.save.loadGame(slot)) this._startNewGame();
  }

  _launchGame(startRoom) {
    this._showScreen('');
    document.getElementById('main-menu-bg')?.classList.add('hidden');
    this.canvas.style.display = 'block';
    this.ui.showHUD();
    this.ui.toggleDebug(this.debug);
    if (startRoom) this.roomManager.loadRoom(startRoom);
    this._initRain();
    this.running = true;
    this._lastTime = performance.now();
  }

  /* ══════════ LOOP ══════════ */
  _loop(ts) {
    this._rafId = requestAnimationFrame(t => this._loop(t));
    const dt = Math.min((ts - this._lastTime) / 1000, 0.05);
    this._lastTime = ts;
    if (!this.running) return;
    this._fpsAvg = this._fpsAvg * 0.95 + (1 / Math.max(dt, 0.001)) * 0.05;

    if (this.editor.on) {
      this.editor.update(dt);
      this._render();
      this.input.update();
      return;
    }
    if (this.paused || this.ui.hasOpenOverlay()) {
      this._render();
      this.input.update();
      return;
    }
    this._playTime += dt;
    this._update(dt);
    this._render();
    this.input.update();
  }

  _update(dt) {
    const p = this.player, input = this.input;
    if (this._edgeMsgCd > 0) this._edgeMsgCd -= dt;

    // stato che il giocatore deve conoscere
    p.hasFlashlight = this.inventory.hasItem('flashlight');
    p.armed     = !!this.weapon.equipped;
    p.reloading = !!this.weapon.equipped?.isReloading;

    this._updateAutoWalk();
    p.update(dt, input, this.collision);
    this.camera.follow(p.x, p.y, p.width, p.height);
    this.camera.update(dt);

    // Armi
    this._target = (p.alive && p.armed) ? this._findTarget() : null;
    if (p.alive && p.armed && !input.locked) {
      if (input.justPressed('shoot')) this.shootAt(this._findTarget(true));
      if (input.justPressed('reload')) this.weapon.reload();
    } else if (p.alive && !p.armed && !input.locked && input.justPressed('shoot') && this.inventory.hasItem('pistol')) {
      this.ui.showNotification('Impugna un\'arma dall\'inventario [TAB]');
    }
    this.weapon.update(dt);
    this.enemyManager.update(dt);
    this._updateRain(dt);

    if (!p.alive) {
      if (!this._deathShown) {
        this._deathShown = true;
        this.input.lock();
        this.ui.hideInteractPrompt();
        this.ui.showGameOver();
      }
      this.ui.updateHUD();
      return;
    }

    this.roomManager._near = input.locked ? null : this.roomManager.nearest(p);
    if (!input.locked) {
      this._handleInteraction();
      if (input.justPressed('inventory')) this.ui.openInventory();
      else if (input.justPressed('map'))  this.ui.openMap();
    }
    this.ui.setObjective(this._objective());
    if (input.justPressed('debug')) { this.debug = !this.debug; this.ui.toggleDebug(this.debug); }

    this._updateSteps(dt);
    this._updateLightFade(dt);
    this.ui.updateHUD();
    this.ui.updateDebug(Math.round(this._fpsAvg), p, this.roomManager.current?.id,
      this.enemyManager.countAlive(), this.events.flags);
  }

  /* ══════════ INTERAZIONI ══════════ */
  _handleInteraction() {
    const near = this.roomManager._near;
    if (!near || !this.player.isInteract) return;
    this._interact(near.kind, near.obj);
  }

  _interact(kind, obj) {
    if (kind === 'door')      this._tryDoor(obj);
    else if (kind === 'npc')  this.events.trigger(obj.event);
    else                      this._useHotspot(obj);
  }

  /** Spara (girandosi verso il bersaglio, se c'è) */
  shootAt(target) {
    const p = this.player;
    if (!p.alive || !this.weapon.equipped) return;
    if (target) p.facingRight = target.centerX > p.centerX;
    if (this.weapon.shoot(p.handX, p.handY, p.facingRight ? 1 : -1)) {
      p.shotTimer = 0.22;
      p.aimTimer  = 0.6;
    }
  }

  /** Cosa c'è nel punto (mondo) toccato: nemico, persona, porta, oggetto */
  pickAt(wx, wy) {
    const rm = this.roomManager, r = rm.current;
    if (!r) return null;
    const pad = 24;
    for (const e of this.enemyManager.enemies) {
      if (!e.alive) continue;
      const top = e.state === 'CEILING' ? e.y - 160 * e.scale : e.y;
      if (wx > e.x - pad && wx < e.x + e.width + pad && wy > top - pad && wy < e.y + e.height + pad) return { kind: 'enemy', obj: e };
    }
    for (const n of r.npcs) {
      if (!rm.visible(n)) continue;
      if (Math.abs(wx - n.x) < 70 * r.scale && wy > r.floorY - 300 * r.scale && wy < r.floorY + 20) return { kind: 'npc', obj: n };
    }
    for (const h of r.hotspots) {
      if (rm.isPicked(h.id) || !rm.visible(h)) continue;
      const y0 = Math.min(h.icon ? (h.iconY ?? r.floorY) - 60 : (h.markY ?? r.floorY - 160) - 50, r.floorY - 200 * r.scale);
      if (wx > h.x - 10 && wx < h.x + h.w + 10 && wy > y0 && wy < r.floorY + 30) return { kind: 'hotspot', obj: h };
    }
    for (const d of r.doors) {
      if (!rm.visible(d)) continue;
      const top = (d.top ?? r.floorY - 330 * r.scale) - 30;
      if (wx > d.x - 10 && wx < d.x + d.w + 10 && wy > top && wy < r.floorY + 30) return { kind: 'door', obj: d };
    }
    return null;
  }

  /** Cammina fino a una cosa toccata e la usa all'arrivo */
  walkTo(hit) { this.autoWalk = hit; }

  _updateAutoWalk() {
    const a = this.autoWalk, v = this.input.virtual, p = this.player;
    if (!a) return;
    if (this.input.locked || !p.alive) { this.autoWalk = null; v.moveLeft = v.moveRight = false; return; }
    const o = a.obj, sc = this.roomManager.current.scale;
    const x0 = a.kind === 'npc' ? o.x - 60 * sc : o.x, x1 = a.kind === 'npc' ? o.x + 60 * sc : o.x + o.w;
    const target = Math.max(x0 + 10, Math.min(x1 - 10, p.centerX));
    const dx = target - p.centerX;
    if (Math.abs(dx) <= 6) {
      v.moveLeft = v.moveRight = false;
      this.autoWalk = null;
      if (a.kind === 'npc') p.facingRight = o.x > p.centerX;
      this._interact(a.kind, o);
      return;
    }
    v.moveLeft = dx < 0;
    v.moveRight = dx > 0;
  }

  _useHotspot(h) {
    const rm = this.roomManager;
    if (h.requires && !rm.check(h.requires)) {
      this.dialogue.show('', h.failText || 'Non succede niente.');
      this.audio.playSfx('door_locked');
      return;
    }
    // oggetti
    const gained = [];
    for (const g of (h.give || [])) {
      const [id, qty] = Array.isArray(g) ? g : [g, undefined];
      if (!this.inventory.addItem(id, qty)) return;   // inventario pieno
      gained.push(ITEMS[id]?.name || id);
    }
    if (h.setFlag) for (const [k, v] of Object.entries(h.setFlag)) this.events.setFlag(k, v);
    const once = h.once ?? !!(h.give?.length || h.doc);
    if (once) rm.markPickedUp(h.id);
    if (gained.length) {
      this.audio.playSfx('pickup');
      this.ui.showNotification('Raccolto: ' + gained.join(', '));
    }
    // testo, poi documento, poi evento
    const lines = !h.text ? [] : (Array.isArray(h.text) ? h.text : [['', h.text]]);
    const afterText = () => {
      if (h.doc) {
        this.inventory.addDocument(h.doc);
        this.ui.showDocument(h.doc);
      }
      if (h.event) this.events.trigger(h.event);
    };
    if (lines.length) this.dialogue.showSequence(lines.map(([speaker, text]) => ({ speaker, text })), afterText);
    else afterText();
  }

  /** Controlla chiavi/condizioni e attraversa la porta */
  _tryDoor(d) {
    const rm = this.roomManager;
    if (d.requires && !rm.check(d.requires)) {
      this.dialogue.show('', d.failText || d.lockedText || 'Non si passa.');
      this.audio.playSfx('door_locked');
      return false;
    }
    if (d.keyId && !rm.isDoorOpen(d.id)) {
      if (!this.inventory.hasItem(d.keyId)) {
        this.dialogue.show('', d.lockedText || 'È chiusa.');
        this.audio.playSfx('door_locked');
        return false;
      }
      if (!d.keepKey && d.keyId !== 'crowbar') this.inventory.removeItem(d.keyId);
      rm.markDoorOpen(d.id);
      this.audio.playSfx('door_open');
      this.ui.showNotification(`Usato: ${this.itemName(d.keyId)}`);
    }
    if (!d.target) {
      if (d.lockedText) this.dialogue.show('', d.lockedText);
      return false;
    }
    this._transitionToRoom(d.target);
    return true;
  }

  /** Nemico più vicino a portata di tiro; con anyDir=false solo davanti */
  _findTarget(anyDir = false) {
    const p = this.player, w = this.weapon.equipped;
    if (!w) return null;
    const range = w.def.bulletRange;
    let best = null, bd = Infinity;
    for (const e of this.enemyManager.enemies) {
      if (!e.alive) continue;
      const dx = e.centerX - p.centerX, d = Math.abs(dx);
      if (d > range) continue;
      if (!anyDir && (dx > 0) !== p.facingRight) continue;
      // se c'è un nemico davanti, ha la precedenza su quelli alle spalle
      const pen = (dx > 0) === p.facingRight ? 0 : 400;
      if (d + pen < bd) { bd = d + pen; best = e; }
    }
    return best;
  }

  /** Testo dell'obiettivo corrente */
  _objective() {
    const f = (k) => !!this.events.getFlag(k);
    const has = (i) => this.inventory.hasItem(i);
    const visited = (r) => !!this.roomManager.roomStates[r]?.visited;
    if (!f('intro_complete')) return f('phone_ringing') ? 'Rispondi al telefono in fondo al binario' : 'Scendi dal treno';
    if (!f('has_pistol')) return 'Cerca un\'arma: porta "Servizi tecnici" sul binario';
    if (!f('carmine_talked')) return has('key_station') || this.roomManager.isDoorOpen('hall_to_control')
      ? 'Sali in sala controllo: scala mobile dell\'atrio'
      : 'Trova la chiave della sala controllo (Servizi tecnici)';
    if (!f('shutter_open')) return 'Alza la serranda: leva in fondo alla sala controllo';
    if (!visited('city_street')) return 'Esci dalla stazione';
    if (!this.roomManager.isDoorOpen('alley_to_hospital')) return has('crowbar')
      ? 'Forza la porta sbarrata del San Rocco nel vicolo'
      : 'L\'ospedale è oltre il vicolo, ma la porta è sbarrata: cerca qualcosa per fare leva';
    if (!visited('hospital_morgue')) {
      if (!has('shotgun')) return has('key_hospital') || this.roomManager.isDoorOpen('corr_to_ward')
        ? 'Esplora le Degenze del San Rocco' : 'Trova la chiave del reparto Degenze (Palazzo Conti)';
      if (!has('vial')) return 'Il campione R-0 è in sala operatoria (serve un badge) — oppure scendi all\'obitorio';
      return 'Scendi all\'obitorio';
    }
    if (!f('power_on')) {
      if (has('fuse')) return 'Avvia il generatore nella sala oltre il tunnel';
      return f('knows_safe_code') ? 'Ti serve un fusibile: è nella cassaforte di Luigi (Via Ferrante)'
        : 'Ti serve un fusibile da 30A. Forse in città qualcuno ne aveva uno';
    }
    if (!has('card') && !this.roomManager.isDoorOpen('safe_to_lab')) return 'Trova la tessera del laboratorio in officina';
    if (!visited('lab_ingresso')) return 'Entra nel laboratorio dal rifugio di Elena';
    if (!f('data_sent')) return has('usb') ? 'Trasmetti i dati dalla sala server' : 'Trova i dati di Elena nel laboratorio biologico';
    if (!f('elena_talked')) return 'Raggiungi la camera centrale';
    if (!has('key_rusty')) return 'Prendi la chiave sul tavolo';
    return 'Raggiungi il molo 4 e scappa';
  }


  _transitionToRoom(roomId) {
    const fromRoom = this.roomManager.current?.id;
    if (this._transitioning) return;
    this._transitioning = true;
    this.input.lock();
    this.ui.hideInteractPrompt();
    this.audio.playSfx('door_open');
    this.ui.fadeOut(350, () => {
      this.weapon.bullets = [];
      this._lightFadeActive = false;
      this.roomManager.loadRoom(roomId, undefined, fromRoom);
      this._initRain();
      this.ui.fadeIn(350, () => {
        this._transitioning = false;
        if (!this.events.isRunning() && !this.dialogue.isActive()) this.input.unlock();
      });
    });
  }

  _updateSteps(dt) {
    const p = this.player;
    if (p.vx === 0) { this._stepTimer = 0; return; }
    const interval = p.isRunning ? 0.3 : (p.isCrouching ? 0.7 : 0.48);
    this._stepTimer = (this._stepTimer || 0) + dt;
    if (this._stepTimer >= interval) {
      this._stepTimer = 0;
      if (!p.isCrouching) this.audio.playStep('concrete', p.isRunning);
    }
  }

  /* ══════════ LUCI ══════════ */
  startLightFade(duration = 5) {
    this._lightFadeActive = true;
    this._lightFadeDuration = duration;
    this._lightFadeTimer = 0;
    const room = this.roomManager.current;
    this._lightFrom = room?.lightLevel ?? 0.5;
    this._lightTo   = room?.darkLight ?? 0.25;
  }

  _updateLightFade(dt) {
    if (!this._lightFadeActive) return;
    const room = this.roomManager.current;
    if (!room) return;
    this._lightFadeTimer += dt;
    const t = Math.min(1, this._lightFadeTimer / this._lightFadeDuration);
    // spegnimento a scatti, come neon che saltano
    const flick = t < 1 && Math.random() < 0.15 ? 0.15 : 0;
    room.lightLevel = this._lightFrom + (this._lightTo - this._lightFrom) * t + flick;
    if (t >= 1) { this._lightFadeActive = false; room.lightLevel = this._lightTo; }
  }

  showCinematicTitle(duration) { this.ui.showCinematicTitle(duration); }

  /* ══════════ RENDER ══════════ */
  _render() {
    const ctx = this.ctx, room = this.roomManager.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    if (!room) return;

    // mondo
    this.camera.applyTransform(ctx);
    this.roomManager.drawBackground(ctx);
    this.enemyManager.draw(ctx);
    this.player.draw(ctx);
    this.weapon.draw(ctx);
    this.camera.restoreTransform(ctx);

    // atmosfera (spazio schermo)
    if (room.rain) this._drawRain(ctx);
    this._drawDarkness(ctx, room);
    this._drawVignette(ctx);

    // indicatori sopra il buio: devono sempre leggersi
    this.camera.applyTransform(ctx);
    this.roomManager.drawInteractions(ctx);
    this.roomManager.drawDoors(ctx);
    this._drawReticle(ctx);
    this.roomManager.drawPrompt(ctx);
    if (this.editor.on) this.editor.draw(ctx);
    else if (this.debug) this._drawDebug(ctx, room);
    this.camera.restoreTransform(ctx);
  }

  /** Mirino sul nemico che verrà colpito */
  _drawReticle(ctx) {
    const t = this._target;
    if (!t || !t.alive) return;
    const cx = t.centerX, cy = t.y + t.height * 0.4;
    const r = 18 + Math.sin(Date.now() / 120) * 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(230,40,50,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.beginPath(); ctx.moveTo(cx + dx * (r - 6), cy + dy * (r - 6)); ctx.lineTo(cx + dx * (r + 7), cy + dy * (r + 7)); ctx.stroke();
    }
    ctx.restore();
  }

  _drawDebug(ctx, room) {
    const p = this.player;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(80,160,255,0.8)';
    ctx.strokeRect(p.x, p.y, p.width, p.height);
    ctx.font = '11px monospace';
    for (const h of room.hotspots) {
      ctx.strokeStyle = 'rgba(255,200,0,0.7)'; ctx.strokeRect(h.x, room.floorY - 360 * room.scale, h.w, 360 * room.scale);
      ctx.fillStyle = '#fc0'; ctx.fillText(h.id, h.x + 3, room.floorY - 6);
    }
    for (const d of room.doors) {
      const top = d.top ?? room.floorY - 330 * room.scale;
      ctx.strokeStyle = 'rgba(80,220,120,0.8)'; ctx.strokeRect(d.x, top, d.w, room.floorY - top);
      ctx.fillStyle = '#5d8'; ctx.fillText(d.id, d.x + 3, top + 14);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.moveTo(0, room.floorY); ctx.lineTo(room.width, room.floorY); ctx.stroke();
    ctx.restore();
  }

  /** Buio della stanza con "buco" di luce attorno al giocatore e cono della torcia */
  _drawDarkness(ctx, room) {
    const dark = Math.max(0, Math.min(0.95, (1 - (room.lightLevel ?? 0.5)) * 0.9));
    if (dark <= 0.01) return;
    const oc = this._darkCtx, p = this.player, cam = this.camera;
    const sx = (p.centerX - cam.x) * cam.zoom;
    const sy = (p.y + p.height * 0.45 - cam.y) * cam.zoom;

    oc.globalCompositeOperation = 'source-over';
    oc.clearRect(0, 0, CANVAS_W, CANVAS_H);
    oc.fillStyle = `rgba(0,0,0,${dark})`;
    oc.fillRect(0, 0, CANVAS_W, CANVAS_H);
    oc.globalCompositeOperation = 'destination-out';

    // alone attorno al corpo: il giocatore resta sempre leggibile
    const r0 = 190 * p.scale;
    const g0 = oc.createRadialGradient(sx, sy, 0, sx, sy, r0);
    g0.addColorStop(0, 'rgba(0,0,0,0.75)');
    g0.addColorStop(1, 'rgba(0,0,0,0)');
    oc.fillStyle = g0;
    oc.beginPath(); oc.arc(sx, sy, r0, 0, Math.PI * 2); oc.fill();

    if (p.flashlightOn) {
      const hx = (p.handX - cam.x) * cam.zoom, hy = (p.handY - cam.y) * cam.zoom;
      const ang = p.facingRight ? 0 : Math.PI, spread = 0.42, len = 560 + 200 * p.scale;
      const flick = p.battery < 15 && Math.random() < 0.08 ? 0.4 : 1;
      const g = oc.createRadialGradient(hx, hy, 0, hx, hy, len);
      g.addColorStop(0, `rgba(0,0,0,${1 * flick})`);
      g.addColorStop(0.55, `rgba(0,0,0,${0.8 * flick})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      oc.fillStyle = g;
      oc.beginPath();
      oc.moveTo(hx, hy);
      oc.arc(hx, hy, len, ang - spread, ang + spread);
      oc.closePath();
      oc.fill();
    }
    oc.globalCompositeOperation = 'source-over';
    ctx.drawImage(this._darkCanvas, 0, 0);

    // tinta calda della torcia
    if (p.flashlightOn) {
      const hx = (p.handX - cam.x) * cam.zoom, hy = (p.handY - cam.y) * cam.zoom;
      const ang = p.facingRight ? 0 : Math.PI;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 600);
      g.addColorStop(0, 'rgba(255,225,160,0.16)');
      g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.arc(hx, hy, 600, ang - 0.4, ang + 0.4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  _drawVignette(ctx) {
    const danger = this.player.healthState === 'DANGER';
    const vg = ctx.createRadialGradient(CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.35, CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, danger ? `rgba(90,0,0,${0.55 + Math.sin(Date.now() * 0.004) * 0.12})` : 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  /* ══════════ PIOGGIA ══════════ */
  _initRain() {
    this._rain = [];
    for (let i = 0; i < 160; i++) {
      this._rain.push({ x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H, v: 700 + Math.random() * 400 });
    }
  }

  _updateRain(dt) {
    if (!this.roomManager.current?.rain) return;
    for (const r of this._rain) {
      r.y += r.v * dt; r.x -= r.v * 0.12 * dt;
      if (r.y > CANVAS_H) { r.y = -20; r.x = Math.random() * (CANVAS_W + 100); }
    }
  }

  _drawRain(ctx) {
    ctx.strokeStyle = 'rgba(170,185,210,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const r of this._rain) { ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - 3, r.y + 18); }
    ctx.stroke();
  }

  /* ══════════ RESIZE ══════════ */
  _handleResize() {
    const wrapper = document.getElementById('game-wrapper');
    const scale = Math.min(wrapper.clientWidth / CANVAS_W, wrapper.clientHeight / CANVAS_H);
    this.canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
    this.canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
  }

  /* ══════════ PAUSA / MENU / FINALE ══════════ */
  togglePause() {
    if (!this.running || this._ended) return;
    this.paused = !this.paused;
    if (this.paused) this.ui.openPause(); else this.ui.closePause();
  }

  returnToMenu() {
    this.running = false;
    this.paused  = false;
    this.dialogue.close();
    this.ui.resetOverlays();
    this.ui.hideHUD();
    this.audio.stopAmbient(0.5);
    this.canvas.style.display = 'none';
    document.getElementById('main-menu-bg')?.classList.remove('hidden');
    this._showScreen('main-menu');
    if (this.save.hasSaveData()) document.getElementById('btn-continua')?.removeAttribute('disabled');
  }

  restartFromDeath() {
    this.ui.hideGameOver();
    this._deathShown = false;
    const slot = this.save.latestSlot();
    if (slot !== null) this._loadSlot(slot); else this._startNewGame();
  }

  showEnding() {
    this._ended = true;
    this.input.lock();
    const good = !!this.events.getFlag('data_sent') && this.inventory.hasItem('vial');
    const docs = this.inventory.getDocuments().length;
    const total = Object.keys(DOCUMENTS).length;
    this.ui.fadeOut(1500, () => {
      this.running = false;
      this.audio.stopAmbient(1);
      this.ui.showEnding({
        title: good ? 'FINALE — ALBA' : 'FINALE — NOTTE',
        text: good
          ? `Il gozzo esce dal porto mentre il cielo comincia a schiarire.\nAlle tue spalle Porto Salvo brucia di una luce rossa: la procedura ALBA è cominciata.\n\nNella tasca, avvolta nella garza, la provetta R-0 è ancora fredda.\n\nTre settimane dopo, a Ginevra, dai dati trasmessi dal laboratorio e dal campione che hai portato fuori nasce il primo anticorpo.\nIl protocollo porta un nome solo: FERRI.`
          : `Il gozzo esce dal porto mentre il cielo comincia a schiarire.\nAlle tue spalle Porto Salvo brucia di una luce rossa: la procedura ALBA è cominciata.\n\nI dati di Elena sono arrivati fuori. Ma senza il campione originale, la sintesi non parte.\n\nIn primavera, un'altra città si accende di rosso.\nPoi un'altra.`,
        stats: `Tempo: ${this._formatTime(this._playTime)}   ·   Documenti: ${docs}/${total}`,
      });
    });
  }
}
