/* =============================================
   NOTTE ROSSA — rooms.js
   RoomManager: carica le stanze di rooms_data.js,
   gestisce stato (oggetti presi, porte aperte, nemici uccisi)
   e disegna sfondo, porte, oggetti e indicatori.
   ============================================= */

import { ROOMS } from './rooms_data.js';
import { SpriteLib } from './sprites.js';

export const VIEW_W = 1280;
export const VIEW_H = 720;

// Campi di default
for (const [id, r] of Object.entries(ROOMS)) {
  r.id = id;
  r.scale = r.scale ?? 1;
  r.floorY = r.floorY ?? 662;
  r.height = VIEW_H;
  r.width = r.width ?? VIEW_W;          // aggiornata dall'immagine al caricamento
  r.layoutW = r.layoutW ?? VIEW_W;      // larghezza su cui sono state misurate le posizioni
  r.light = r.light ?? 0.5;
  r.lightLevel = r.light;
  r.mapPos = r.map ? { col: r.map[0], row: r.map[1] } : null;
  for (const k of ['hotspots', 'doors', 'npcs', 'props', 'enemies', 'overlays']) r[k] = r[k] || [];
}

export { ROOMS };

export class RoomManager {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.roomData = ROOMS;
    this._bg = {};
    this.roomStates = {};
    for (const id of Object.keys(ROOMS)) this.roomStates[id] = this._freshState();
  }

  _freshState() { return { visited: false, pickedUp: {}, doorOpen: {}, enemiesKilled: {} }; }

  state(id = this.current?.id) {
    if (!this.roomStates[id]) this.roomStates[id] = this._freshState();
    return this.roomStates[id];
  }

  /** Condizione { flag } | { notFlag } | { item } (o lista) */
  check(cond) {
    if (!cond) return true;
    if (Array.isArray(cond)) return cond.every(c => this.check(c));
    const ev = this.game.events, inv = this.game.inventory;
    if (cond.flag)    return !!ev.getFlag(cond.flag);
    if (cond.notFlag) return !ev.getFlag(cond.notFlag);
    if (cond.item)    return inv.hasItem(cond.item);
    return true;
  }

  visible(o) {
    if (o.showIf && !this.check(o.showIf)) return false;
    if (o.hideIf &&  this.check(o.hideIf)) return false;
    return true;
  }

  _bgImage(src) {
    if (!src) return null;
    if (!this._bg[src]) {
      const im = new Image();
      im.onload = () => this._fitWidth(src, im);
      im.src = src;
      this._bg[src] = im;
    }
    return this._bg[src];
  }

  /**
   * Larghezza della stanza = larghezza dell'immagine scalata a 720 di altezza
   * (nessuna deformazione). Se le posizioni erano state misurate su un'altra
   * larghezza (layoutW), vengono riproporzionate una volta sola.
   */
  _fitWidth(src, im) {
    for (const r of Object.values(ROOMS)) {
      if (r.bg !== src || r.fixedWidth) continue;
      r.width = Math.max(VIEW_W, Math.round(im.naturalWidth * VIEW_H / im.naturalHeight));
      if (r.layoutW !== r.width) this._rescaleLayout(r, r.width / r.layoutW);
    }
    for (const r of Object.values(ROOMS)) if (r.bg === src) this._pullFromEdges(r);
    if (this.current?.bg === src) {
      this.game.camera.setBounds(0, 0, this.current.width, VIEW_H);
      this.respawnEnemies();
    }
  }

  /** Niente da usare schiacciato contro i bordi: almeno 150 px dentro la stanza */
  _pullFromEdges(r) {
    if (r._edgesFixed) return;
    r._edgesFixed = true;
    const m = 150;
    for (const h of r.hotspots) {
      if (h.x < m) h.x = m;
      if (h.x + h.w > r.width - m) h.x = Math.max(m, r.width - m - h.w);
    }
    for (const n of r.npcs) n.x = Math.max(m, Math.min(r.width - m, n.x));
  }

  _rescaleLayout(r, k) {
    const sx = (o, keys) => { for (const key of keys) if (typeof o[key] === 'number') o[key] = Math.round(o[key] * k); };
    for (const d of r.doors)    sx(d, ['x', 'w']);
    for (const h of r.hotspots) sx(h, ['x', 'w']);
    for (const n of r.npcs)     sx(n, ['x']);
    for (const p of r.props)    sx(p, ['x']);
    for (const o of r.overlays) sx(o, ['x', 'w']);
    for (const e of r.enemies) { sx(e, ['x']); if (e.patrol) e.patrol = e.patrol.map(v => Math.round(v * k)); }
    if (typeof r.spawnX === 'number') r.spawnX = Math.round(r.spawnX * k);
    r.layoutW = r.width;
  }

  preload() { for (const r of Object.values(ROOMS)) this._bgImage(r.bg); }

  /** Porta di questa stanza che porta a roomId */
  doorTo(room, roomId) { return room.doors.find(d => d.target === roomId) || null; }

  /**
   * Carica una stanza. Se si arriva da un'altra stanza, il giocatore compare
   * davanti alla porta che riporta indietro (coerenza spaziale).
   */
  loadRoom(roomId, spawnX, fromRoom) {
    const def = ROOMS[roomId];
    if (!def) { console.error('Stanza non trovata:', roomId); return; }
    this.current = def;
    const st = this.state(roomId);
    st.visited = true;

    const im = this._bgImage(def.bg);
    if (im?.complete && im.naturalWidth) this._fitWidth(def.bg, im);

    def.lightLevel = def.light;
    if (def.darkFlag && this.game.events.getFlag(def.darkFlag)) def.lightLevel = def.darkLight;
    if (def.poweredFlag && this.game.events.getFlag(def.poweredFlag)) def.lightLevel = def.poweredLight;

    const p = this.game.player;
    p.setScale(def.scale);
    let x = spawnX;
    let back = fromRoom ? this.doorTo(def, fromRoom) : null;
    if (back) x = this.doorRect(back, def).cx - p.width / 2;
    if (x === undefined || x === null) x = def.spawnX ?? 80;
    p.x = Math.max(10, Math.min(def.width - 10 - p.width, x));
    p.y = def.floorY - p.height;
    if (back) p.facingRight = this.doorRect(back, def).cx < def.width / 2;
    else if (spawnX !== undefined) p.facingRight = spawnX < def.width / 2;

    const cam = this.game.camera;
    cam.setBounds(0, 0, def.width, VIEW_H);
    cam.snapTo(p.centerX, VIEW_H / 2);

    if (def.ambient) this.game.audio.playAmbient(def.ambient);
    this.respawnEnemies();
    this.game.events.onRoomEnter(roomId);
  }

  respawnEnemies() {
    const def = this.current, st = this.state();
    const em = this.game.enemyManager;
    em.clearEnemies();
    for (const s of def.enemies) {
      if (st.enemiesKilled[s.id] || !this.visible(s)) continue;
      const e = em.spawnEnemy(s.type, s.x, 0, { ...s, scale: def.scale });
      e.y = def.floorY - e.height;
    }
  }

  markEnemyKilled(key) { this.state().enemiesKilled[key] = true; }
  markPickedUp(id)     { this.state().pickedUp[id] = true; }
  isPicked(id)         { return !!this.state().pickedUp[id]; }
  markDoorOpen(id)     { this.state().doorOpen[id] = true; }
  isDoorOpen(id)       { return !!this.state().doorOpen[id]; }

  /** Una porta è "chiusa" se manca la chiave o una condizione */
  doorLocked(d) {
    if (d.requires && !this.check(d.requires)) return true;
    if (d.keyId && !this.isDoorOpen(d.id)) return true;
    return false;
  }

  /* ── Cosa c'è a portata del giocatore ── */
  nearest(player) {
    const room = this.current;
    if (!room) return null;
    const px = player.centerX, reach = 30 * room.scale;
    let best = null, bestD = Infinity;
    const consider = (kind, obj, x0, x1) => {
      if (px < x0 - reach || px > x1 + reach) return;
      const d = Math.abs(px - (x0 + x1) / 2);
      if (d < bestD) { bestD = d; best = { kind, obj }; }
    };
    for (const h of room.hotspots) if (!this.isPicked(h.id) && this.visible(h)) consider('hotspot', h, h.x, h.x + h.w);
    for (const d of room.doors) if (this.visible(d)) { const r = this.doorRect(d, room); consider('door', d, r.x, r.x + r.w); }
    for (const n of room.npcs) if (this.visible(n)) consider('npc', n, n.x - 70 * room.scale, n.x + 70 * room.scale);
    return best;
  }

  /* ══════════ DISEGNO ══════════ */
  drawBackground(ctx) {
    const room = this.current;
    if (!room) return;
    const im = this._bgImage(room.bg);
    if (im && im.complete && im.naturalWidth > 0) ctx.drawImage(im, 0, 0, room.width, VIEW_H);
    else { ctx.fillStyle = '#07080b'; ctx.fillRect(0, 0, room.width, VIEW_H); }

    this._drawOverlays(ctx, room);
    this._drawDoorSprites(ctx, room);
    for (const pr of room.props) SpriteLib.drawProp(ctx, pr.name, pr.x, room.floorY + 18 * room.scale, pr.flip, 1, room.scale);
    for (const n of room.npcs) {
      if (!this.visible(n)) continue;
      const anim = this.game.events.getFlag(`npc_${n.id}_anim`) || n.anim || 'idle';
      SpriteLib.drawShadow(ctx, n.x, room.floorY - 2 * room.scale, 105 * room.scale, 0.6);
      SpriteLib.draw(ctx, n.char, anim, 0, n.x, room.floorY, n.facingRight, { scale: room.scale });
    }
  }

  /** Rettangolo della porta disegnata (piedi sul pavimento, centrata sull'uscita) */
  doorRect(d, room = this.current) {
    if (d.noSprite && d.top !== undefined) {
      return { x: d.x, y: d.top, w: d.w, h: room.floorY - d.top, cx: d.x + d.w / 2 };
    }
    const h = Math.round(310 * room.scale), w = Math.round(h * 0.62);
    const m = w / 2 + 70;   // porte un po' dentro la stanza, non schiacciate sul bordo
    const cx = Math.max(m, Math.min(room.width - m, d.x + d.w / 2));
    return { x: cx - w / 2, y: room.floorY - h + 4 * room.scale, w, h, cx };
  }

  /** Porte vere disegnate nella scena: chiusa / socchiusa / aperta quando sei vicino */
  _drawDoorSprites(ctx, room) {
    const barricaded = new Set(room.overlays.filter(o => o.type === 'barricade').map(o => o.door));
    for (const d of room.doors) {
      if (!this.visible(d) || barricaded.has(d.id) || d.noSprite) continue;
      const r = this.doorRect(d, room);
      const locked = this.doorLocked(d);
      const name = locked ? 'door_closed' : (this._near?.obj === d ? 'door_open' : 'door_ajar');
      SpriteLib.drawShadow(ctx, r.cx, room.floorY, r.w * 1.2, 0.45);
      ctx.save();
      ctx.filter = 'brightness(0.78) contrast(1.05)';
      SpriteLib.drawPropBox(ctx, name, r.x, r.y, r.w, r.h, 1);
      ctx.restore();
    }
  }

  /** Oggetti di scena dalla tavola: monitor con statico, neon, leve, porta sbarrata */
  _drawOverlays(ctx, room) {
    const t = Date.now() / 1000;
    for (const o of room.overlays) {
      if (o.type === 'monitor') {
        const f = 2 + (Math.floor(t * 12) % 3);           // fotogrammi di statico
        SpriteLib.drawPropFrame(ctx, 'monitor_static', f, o.x, o.y, o.w, o.h, 0.85);
      } else if (o.type === 'neon') {
        // sfarfallio irregolare tra i fotogrammi spenti e accesi
        const r = Math.sin(t * 13.7) + Math.sin(t * 7.3) * 0.7 + Math.sin(t * 2.1);
        const f = r > 1.2 ? 4 : r > 0.2 ? 3 : r > -0.6 ? 2 : 0;
        const w = o.w, h = w * 0.9;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        SpriteLib.drawPropFrame(ctx, 'neon', f, o.x - w / 2, o.y, w, h, 1);
        ctx.restore();
      } else if (o.type === 'lever') {
        const on = this.check({ flag: o.flag });
        SpriteLib.drawPropFit(ctx, on ? 'lever_on' : 'lever_off', o.x, o.y, o.h);
      } else if (o.type === 'barricade') {
        const d = room.doors.find(d => d.id === o.door);
        if (!d) continue;
        const r = this.doorRect(d, room);
        const open = this.isDoorOpen(d.id);
        SpriteLib.drawShadow(ctx, r.cx, room.floorY, r.w * 1.2, 0.45);
        SpriteLib.drawPropBox(ctx, open ? 'barricade_broken' : 'barricade_closed', r.x, r.y, r.w, r.h, 1);
      }
    }
  }

  /** Direzione di un'uscita: a sinistra, a destra o "dentro" (porta / passaggio in fondo) */
  doorDir(d, room = this.current) {
    if (d.dir) return d.dir;
    const cx = d.x + d.w / 2;
    if (cx < 170) return 'left';
    if (cx > room.width - 170) return 'right';
    return 'up';
  }

  /** Frecce animate sul pavimento che indicano le uscite */
  drawDoors(ctx) {
    const room = this.current;
    if (!room) return;
    const t = Date.now() / 1000, sc = room.scale, near = this._near;
    for (const d of room.doors) {
      if (!this.visible(d)) continue;
      const locked = this.doorLocked(d);
      const isNear = near?.obj === d;
      // passaggi che non portano da nessuna parte: niente freccia, solo un segno da esaminare
      if (d.requires?.some?.(c => c.flag === 'never')) {
        const dr = this.doorRect(d, room), mx = dr.cx, my = dr.y + dr.h * 0.45;
        const a = 0.4 + Math.max(0, Math.sin(t * 2.4 + mx * 0.01)) * 0.4;
        ctx.strokeStyle = `rgba(255,245,220,${a})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mx, my, isNear ? 9 : 6, 0, Math.PI * 2); ctx.stroke();
        continue;
      }
      const dir = this.doorDir(d, room);
      const cx = this.doorRect(d, room).cx;
      const fy = room.floorY - 14 * sc;
      const col = locked ? [215, 60, 70] : [245, 236, 220];
      const base = isNear ? 0.95 : 0.55;
      const size = Math.max(14, 22 * Math.min(1.4, sc)) * (this.game.uiScale || 1) * 0.8;
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, 4.5 * Math.min(1.3, sc));
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6;
      for (let i = 0; i < 3; i++) {
        // le frecce "scorrono" verso la direzione dell'uscita
        const ph = ((t * 1.2 + i / 3) % 1);
        const a = base * Math.sin(ph * Math.PI);
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
        ctx.beginPath();
        if (dir === 'left' || dir === 'right') {
          const s = dir === 'left' ? -1 : 1;
          const x = cx + s * (ph - 0.5) * size * 3;
          ctx.moveTo(x - s * size * 0.5, fy - size * 0.55);
          ctx.lineTo(x + s * size * 0.3, fy);
          ctx.lineTo(x - s * size * 0.5, fy + size * 0.55 * 0.5);
        } else {
          // freccia "in avanti", schiacciata come se fosse dipinta sul pavimento
          const y = fy + 8 * sc - ph * size * 1.6;
          ctx.moveTo(cx - size * 0.9, y + size * 0.35);
          ctx.lineTo(cx, y - size * 0.15);
          ctx.lineTo(cx + size * 0.9, y + size * 0.35);
        }
        ctx.stroke();
      }
      ctx.restore();
      if (locked) {
        const ix = dir === 'up' ? cx + size * 1.5 : cx;
        const iy = dir === 'up' ? fy - size * 0.6 : fy - size * 1.6;
        SpriteLib.drawIcon(ctx, 'padlock', ix, iy, Math.max(18, 22 * Math.min(1.3, sc)), isNear ? 1 : 0.75);
      }
    }
  }

  /** Oggetti e punti da esaminare */
  drawInteractions(ctx) {
    const room = this.current;
    if (!room) return;
    const t = Date.now() / 1000, sc = room.scale;
    const near = this._near;
    for (const h of room.hotspots) {
      if (this.isPicked(h.id) || !this.visible(h)) continue;
      const cx = h.x + h.w / 2;
      const isNear = near?.obj === h;
      if (h.icon) {
        const y = h.iconY ?? room.floorY - 30 * sc;
        const size = Math.max(40, 56 * sc) * (isNear ? 1.12 : 1) * Math.sqrt(this.game.uiScale || 1);
        const g = ctx.createRadialGradient(cx, y, 0, cx, y, size);
        g.addColorStop(0, `rgba(255,230,170,${(isNear ? 0.35 : 0.18) + Math.sin(t * 3 + cx) * 0.06})`);
        g.addColorStop(1, 'rgba(255,230,170,0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - size, y - size, size * 2, size * 2);
        SpriteLib.drawIcon(ctx, h.icon, cx, y, size, 1);
        // scintilla che passa sull'oggetto
        const k = (t * 0.6 + cx * 0.001) % 1;
        if (k < 0.25) {
          ctx.fillStyle = `rgba(255,255,255,${0.8 * Math.sin(k / 0.25 * Math.PI)})`;
          const sx = cx - size / 2 + k / 0.25 * size, sy = y - size * 0.35;
          ctx.beginPath();
          ctx.moveTo(sx, sy - 7); ctx.lineTo(sx + 2, sy - 2); ctx.lineTo(sx + 7, sy); ctx.lineTo(sx + 2, sy + 2);
          ctx.lineTo(sx, sy + 7); ctx.lineTo(sx - 2, sy + 2); ctx.lineTo(sx - 7, sy); ctx.lineTo(sx - 2, sy - 2);
          ctx.fill();
        }
      } else {
        // punto da esaminare: anello che pulsa
        const y = h.markY ?? room.floorY - 160 * sc;
        const a = 0.45 + Math.max(0, Math.sin(t * 2.4 + cx * 0.01)) * 0.45;
        const r = (isNear ? 9 : 6) + Math.sin(t * 2.4) * 1.5;
        ctx.strokeStyle = `rgba(255,245,220,${a})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(255,245,220,${a})`;
        ctx.beginPath(); ctx.arc(cx, y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  /** Bolla [E] sopra la cosa più vicina (disegnata sopra a tutto) */
  drawPrompt(ctx) {
    const room = this.current, n = this._near;
    if (!room || !n || this.game.input.locked) return;
    const o = n.obj;
    let cx, y;
    if (n.kind === 'door')      { const r = this.doorRect(o, room); cx = r.cx; y = r.y - 22; }
    else if (n.kind === 'npc')  { cx = o.x; y = room.floorY - 300 * room.scale; }
    else { cx = o.x + o.w / 2; y = (o.icon ? (o.iconY ?? room.floorY) - 50 * Math.max(0.8, room.scale) : (o.markY ?? room.floorY - 160) - 26); }
    const verb = n.kind === 'door' ? (o.requires?.some?.(c => c.flag === 'never') ? 'Esamina' : this.doorLocked(o) ? 'Chiuso' : { left: '◄ Vai', right: 'Vai ►', up: '▲ Entra' }[this.doorDir(o, room)])
              : n.kind === 'npc' ? 'Parla'
              : (o.give?.length ? 'Raccogli' : o.doc ? 'Leggi' : 'Esamina');
    const label = `${verb}: ${n.kind === 'door' ? o.label : o.label}`;
    ctx.save();
    const k = this.game.uiScale || 1;
    ctx.font = `600 ${Math.round(14 * k)}px "Courier New", monospace`;
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(label).width;
    const w = tw + 52 * k, h = 28 * k;
    const x = Math.max(this.game.camera.x + 6, Math.min(this.game.camera.x + VIEW_W - w - 6, cx - w / 2));
    y = Math.max(h / 2 + 8, y);
    ctx.fillStyle = 'rgba(8,8,10,0.88)';
    ctx.fillRect(x, y - h / 2, w, h);
    ctx.strokeStyle = 'rgba(192,21,42,0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y - h / 2 + 0.5, w - 1, h - 1);
    ctx.fillStyle = '#c0152a';
    ctx.fillRect(x + 6 * k, y - 9 * k, 22 * k, 18 * k);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(document.body.classList.contains('touch') ? '●' : 'E', x + 17 * k, y + 1);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#efe6d8';
    ctx.fillText(label, x + 38 * k, y + 1);
    ctx.restore();
  }

  drawForeground() {}

  serialize() { return { currentRoom: this.current?.id, roomStates: this.roomStates }; }

  deserialize(data) {
    if (data?.roomStates) {
      for (const [id, st] of Object.entries(data.roomStates)) this.roomStates[id] = { ...this._freshState(), ...st };
    }
  }
}
