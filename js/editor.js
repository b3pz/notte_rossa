/* =============================================
   NOTTE ROSSA — editor.js
   Editor di posizionamento (F2) per adattare porte, oggetti,
   nemici e personaggi a uno sfondo nuovo.

   Mouse:  trascina un riquadro        = sposta in orizzontale
           MAIUSC + trascina           = cambia larghezza
           CTRL + trascina             = sposta in verticale (cartello porta / icona / segno)
   Tasti:  A / D (o frecce)            = scorri la stanza
           [  ]                        = scala dei personaggi −/+
           PagSu / PagGiù              = linea del pavimento su/giù
           F2                          = chiudi
   Pulsante COPIA: copia i dati della stanza nel formato di js/rooms_data.js
   ============================================= */

export class LayoutEditor {
  constructor(game) {
    this.game = game;
    this.on = false;
    this.sel = null;
    this._drag = null;
    this._panel = null;
    const canvas = game.canvas;
    canvas.addEventListener('mousedown', e => this._down(e));
    window.addEventListener('mousemove', e => this._move(e));
    window.addEventListener('mouseup', () => { this._drag = null; });
    window.addEventListener('keydown', e => {
      if (e.code === 'F2' && game.running) { e.preventDefault(); this.toggle(); return; }
      if (!this.on) return;
      const r = game.roomManager.current;
      if (e.code === 'BracketLeft')  { r.scale = Math.max(0.3, +(r.scale - 0.05).toFixed(2)); this._rescale(); }
      if (e.code === 'BracketRight') { r.scale = +(r.scale + 0.05).toFixed(2); this._rescale(); }
      if (e.code === 'PageUp')   { e.preventDefault(); r.floorY -= 4; this._rescale(); }
      if (e.code === 'PageDown') { e.preventDefault(); r.floorY += 4; this._rescale(); }
      this._renderPanel();
    });
  }

  toggle() {
    this.on = !this.on;
    this.game.debug = this.on;
    if (!this._panel) this._buildPanel();
    this._panel.style.display = this.on ? 'block' : 'none';
    this._renderPanel();
  }

  _rescale() {
    const g = this.game, r = g.roomManager.current;
    g.player.setScale(r.scale);
    g.player.y = r.floorY - g.player.height;
    g.roomManager.respawnEnemies();
  }

  /** Scorre la stanza con A/D mentre l'editor è aperto */
  update(dt) {
    if (!this.on) return;
    const g = this.game, k = g.input.keys, cam = g.camera;
    const v = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
    if (v) {
      const r = g.roomManager.current;
      g.player.x = Math.max(0, Math.min(r.width - g.player.width, g.player.x + v * 900 * dt));
    }
    cam.follow(g.player.x, g.player.y, g.player.width, g.player.height);
    cam.update(dt);
  }

  _world(e) {
    const rect = this.game.canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * 1280 / rect.width;
    const sy = (e.clientY - rect.top) * 720 / rect.height;
    return { x: sx + this.game.camera.x, y: sy + this.game.camera.y };
  }

  /** Tutti gli oggetti modificabili con il loro riquadro */
  _items() {
    const r = this.game.roomManager.current, out = [];
    const H = 360 * r.scale;
    for (const d of r.doors) out.push({ kind: 'door', o: d, x: d.x, w: d.w, y: d.top ?? r.floorY - 330 * r.scale, h: r.floorY - (d.top ?? r.floorY - 330 * r.scale) });
    for (const h of r.hotspots) out.push({ kind: 'hotspot', o: h, x: h.x, w: h.w, y: r.floorY - H, h: H });
    for (const e of r.enemies) out.push({ kind: 'enemy', o: e, x: e.x, w: 80 * r.scale, y: r.floorY - 260 * r.scale, h: 260 * r.scale });
    for (const n of r.npcs) out.push({ kind: 'npc', o: n, x: n.x - 40 * r.scale, w: 80 * r.scale, y: r.floorY - 270 * r.scale, h: 270 * r.scale });
    for (const p of r.props) out.push({ kind: 'prop', o: p, x: p.x - 60 * r.scale, w: 120 * r.scale, y: r.floorY - 60 * r.scale, h: 60 * r.scale });
    return out;
  }

  _down(e) {
    if (!this.on) return;
    const p = this._world(e);
    // il più piccolo che contiene il punto
    const hit = this._items().filter(i => p.x >= i.x && p.x <= i.x + i.w && p.y >= i.y && p.y <= i.y + i.h)
      .sort((a, b) => a.w - b.w)[0];
    this.sel = hit || null;
    if (hit) this._drag = { start: p, x: hit.o.x, w: hit.o.w, top: hit.o.top, iconY: hit.o.iconY, markY: hit.o.markY, shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey };
    this._renderPanel();
  }

  _move(e) {
    if (!this.on || !this._drag || !this.sel) return;
    const p = this._world(e), d = this._drag, o = this.sel.o, r = this.game.roomManager.current;
    const dx = Math.round(p.x - d.start.x), dy = Math.round(p.y - d.start.y);
    if (d.ctrl) {
      if (this.sel.kind === 'door') o.top = Math.round((d.top ?? r.floorY - 330 * r.scale) + dy);
      else if (o.icon) o.iconY = Math.round((d.iconY ?? r.floorY - 30) + dy);
      else if (this.sel.kind === 'hotspot') o.markY = Math.round((d.markY ?? r.floorY - 160) + dy);
    } else if (d.shift && o.w !== undefined) {
      o.w = Math.max(20, d.w + dx);
    } else {
      o.x = d.x + dx;
    }
    if (this.sel.kind === 'enemy') this.game.roomManager.respawnEnemies();
    this._renderPanel();
  }

  draw(ctx) {
    if (!this.on) return;
    const r = this.game.roomManager.current;
    ctx.save();
    ctx.font = '11px monospace';
    const col = { door: '#5d8', hotspot: '#fc0', enemy: '#f55', npc: '#6af', prop: '#c8c' };
    for (const i of this._items()) {
      ctx.strokeStyle = col[i.kind];
      ctx.lineWidth = this.sel?.o === i.o ? 3 : 1;
      ctx.strokeRect(i.x, i.y, i.w, i.h);
      ctx.fillStyle = col[i.kind];
      ctx.fillText(i.o.id || i.o.name || i.o.type, i.x + 3, i.y + 12);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(0, r.floorY); ctx.lineTo(r.width, r.floorY); ctx.stroke();
    ctx.restore();
  }

  _buildPanel() {
    const el = document.createElement('div');
    el.id = 'layout-editor';
    el.style.cssText = 'position:absolute;right:12px;top:60px;z-index:200;width:330px;padding:12px;background:rgba(5,6,9,.92);border:1px solid #c0152a;font:12px "Courier New",monospace;color:#ddd;display:none';
    el.innerHTML = `<div style="color:#c0152a;letter-spacing:.2em;margin-bottom:6px">EDITOR STANZA (F2)</div>
      <div id="le-info"></div>
      <div id="le-sel" style="margin:8px 0;color:#fc0"></div>
      <button id="le-copy" class="item-action-btn">COPIA DATI STANZA</button>
      <div style="margin-top:8px;color:#888;line-height:1.5">trascina = sposta · MAIUSC = larghezza · CTRL = altezza<br>A/D scorri · [ ] scala · PagSu/PagGiù pavimento</div>
      <textarea id="le-out" style="width:100%;height:120px;margin-top:8px;background:#000;color:#9c9;font:10px monospace;display:none"></textarea>`;
    document.getElementById('game-wrapper').appendChild(el);
    el.querySelector('#le-copy').addEventListener('click', () => this._copy());
    this._panel = el;
  }

  _renderPanel() {
    if (!this._panel || !this.on) return;
    const r = this.game.roomManager.current;
    this._panel.querySelector('#le-info').innerHTML =
      `<b>${r.id}</b><br>sfondo: ${r.bg.split('/').pop()}<br>larghezza: ${r.width}px · scala: ${r.scale} · pavimento: ${r.floorY}`;
    const s = this.sel;
    this._panel.querySelector('#le-sel').textContent = s
      ? `${s.kind} "${s.o.id || s.o.name}"  x:${s.o.x}${s.o.w !== undefined ? ' w:' + s.o.w : ''}${s.o.top !== undefined ? ' top:' + s.o.top : ''}${s.o.iconY !== undefined ? ' iconY:' + s.o.iconY : ''}${s.o.markY !== undefined ? ' markY:' + s.o.markY : ''}`
      : 'clicca un riquadro per selezionarlo';
  }

  _copy() {
    const r = this.game.roomManager.current;
    const pick = (o, keys) => Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]]));
    const data = {
      room: r.id, layoutW: r.width, scale: r.scale, floorY: r.floorY,
      doors: r.doors.map(d => pick(d, ['id', 'x', 'w', 'top'])),
      hotspots: r.hotspots.map(h => pick(h, ['id', 'x', 'w', 'iconY', 'markY'])),
      enemies: r.enemies.map(e => pick(e, ['id', 'x'])),
      npcs: r.npcs.map(n => pick(n, ['id', 'x'])),
      props: r.props.map(p => pick(p, ['name', 'x'])),
    };
    const txt = JSON.stringify(data, null, 1);
    const out = this._panel.querySelector('#le-out');
    out.style.display = 'block';
    out.value = txt;
    out.select();
    try { navigator.clipboard?.writeText(txt)?.catch(() => {}); } catch (e) {}
    console.log('[Editor]', txt);
    this.game.ui.showNotification('Dati della stanza copiati');
  }
}
