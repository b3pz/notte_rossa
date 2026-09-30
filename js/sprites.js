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

    const cw = ch.cellW, chh = ch.cellH;
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

  icon(name) {
    return ICONS[name] || null;
  },

  /** Disegna un oggetto di scena (es. cadavere) appoggiato su footY */
  drawProp(ctx, name, x, footY, flip = false, alpha = 1, scale = 1) {
    const p = PROPS[name];
    if (!p) return;
    const im = _img(p.file);
    if (!_ready(im)) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, footY);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.drawImage(im, -p.w / 2, -p.h, p.w, p.h);
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
