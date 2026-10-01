/* =============================================
   NOTTE ROSSA — sprites.js
   Libreria di disegno per le strisce generate da
   tools/slice_sprites.py (vedi js/sprite_manifest.js).
   Ogni cella ha i piedi della figura sul bordo inferiore,
   centrati orizzontalmente. Tutte le figure guardano a destra.
   ============================================= */

import { SPRITES, ICONS, PROPS } from './sprite_manifest.js';

const _cache = {};

function _img(src) {
  if (!src) return null;
  let im = _cache[src];
  if (!im) {
    im = new Image();
    im.src = src;
    _cache[src] = im;
  }
  return im;
}

function _ready(im) {
  return im && im.complete && im.naturalWidth > 0;
}

export const SpriteLib = {
  /** Precarica tutto (chiamato all'avvio) */
  preload() {
    for (const ch of Object.values(SPRITES)) {
      for (const a of Object.values(ch.anims)) _img(a.file);
    }
    for (const f of Object.values(ICONS)) _img(f);
    for (const p of Object.values(PROPS)) _img(p.file);
  },

  has(char, anim) {
    return !!SPRITES[char]?.anims?.[anim];
  },

  animDef(char, anim) {
    return SPRITES[char]?.anims?.[anim] || null;
  },

  /** Numero di frame di un'animazione */
  frames(char, anim) {
    return SPRITES[char]?.anims?.[anim]?.frames || 1;
  },

  /**
   * Disegna un frame con i piedi in (footX, footY).
   * opts: { alpha, scale, rotate (rad, attorno ai piedi), skew }
   * Ritorna false se l'immagine non è ancora pronta.
   */
  draw(ctx, char, anim, frame, footX, footY, facingRight = true, opts = {}) {
    const ch  = SPRITES[char];
    const def = ch?.anims?.[anim];
    if (!def) return false;
    const im = _img(def.file);
    if (!_ready(im)) return false;

    // cella = larghezza della striscia / numero di pose (ogni animazione può avere la sua)
    const cw = im.naturalWidth / def.frames, chh = im.naturalHeight;
    const f  = ((frame % def.frames) + def.frames) % def.frames;
    const s  = opts.scale ?? 1;

    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
    ctx.translate(footX, footY);
    if (opts.rotate) ctx.rotate(opts.rotate);
    if (opts.skew)   ctx.transform(1, 0, opts.skew, 1, 0, 0);
    ctx.scale(facingRight ? s : -s, s);
    ctx.drawImage(im, f * cw, 0, cw, chh, -cw / 2, -chh, cw, chh);
    ctx.restore();
    return true;
  },

  /**
   * Ombra di contatto morbida sotto i piedi.
   * w = larghezza dell'ombra, alpha = intensità (0-1)
   */
  drawShadow(ctx, x, footY, w, alpha = 0.55) {
    if (w <= 0 || alpha <= 0) return;
    const h = w * 0.16;
    ctx.save();
    ctx.translate(x, footY);
    ctx.scale(1, h / w);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
    g.addColorStop(0,    `rgba(0,0,0,${alpha})`);
    g.addColorStop(0.45, `rgba(0,0,0,${alpha * 0.6})`);
    g.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  icon(name) {
    return ICONS[name] || null;
  },

  /** Disegna un oggetto di scena (es. cadavere) appoggiato su footY */
  drawProp(ctx, name, x, footY, flip = false, alpha = 1, scale = 1) {
    const p = PROPS[name];
    if (!p) return;
    const im = _img(p.file);
    if (!_ready(im)) return;
    this.drawShadow(ctx, x, footY - 6 * scale, p.w * scale * 1.05, 0.5 * alpha);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, footY);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.drawImage(im, -p.w / 2, -p.h, p.w, p.h);
    ctx.restore();
  },

  /** Fotogramma f di un oggetto di scena a più fotogrammi, dentro il riquadro x,y,w,h */
  drawPropFrame(ctx, name, f, x, y, w, h, alpha = 1) {
    const p = PROPS[name];
    const im = p && _img(p.file);
    if (!_ready(im)) return;
    const n = p.frames || 1, fw = p.w / n;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(im, (f % n) * fw, 0, fw, p.h, x, y, w, h);
    ctx.restore();
  },

  /** Oggetto di scena alto h, con il centro-alto in (cx, y) */
  drawPropFit(ctx, name, cx, y, h, alpha = 1) {
    const p = PROPS[name];
    const im = p && _img(p.file);
    if (!_ready(im)) return;
    const w = p.w * h / p.h;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(im, cx - w / 2, y, w, h);
    ctx.restore();
  },

  /** Oggetto di scena stirato nel riquadro (es. assi su una porta) */
  drawPropBox(ctx, name, x, y, w, h, alpha = 1) {
    const p = PROPS[name];
    const im = p && _img(p.file);
    if (!_ready(im)) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(im, x, y, w, h);
    ctx.restore();
  },

  /** Disegna un'icona centrata (es. oggetto a terra) */
  drawIcon(ctx, name, cx, cy, size = 48, alpha = 1) {
    const src = ICONS[name];
    const im  = _img(src);
    if (!_ready(im)) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(im, cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
  },
};
