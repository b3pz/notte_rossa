/* =============================================
   NOTTE ROSSA — skin.js
   Interfaccia "a sprite": ogni pezzo usa l'immagine
   assets/ui/<nome>.png se esiste, altrimenti resta
   lo stile HTML/CSS di oggi. Per ogni immagine trovata
   il <body> riceve la classe "ui-<nome>" (vedi css/skin.css)
   e il codice può disegnarla (Skin.img).
   ============================================= */

export const UI_FILES = [
  // kit di base (pannelli e bottoni sono 9-slice: bordi entro 64 px)
  'panel', 'button', 'button_hover', 'button_disabled', 'close',
  'slider_track', 'slider_knob', 'check_off', 'check_on',
  // menu
  'logo', 'menu_bg',
  // HUD
  'hud_health', 'hud_ecg_fine', 'hud_ecg_caution', 'hud_ecg_danger',
  'hud_battery', 'hud_ammo', 'hud_objective', 'hud_room', 'notification',
  // dialoghi e ritratti
  'dialog', 'dialog_name',
  'portrait_luca', 'portrait_luca_scared', 'portrait_elena', 'portrait_elena_sad',
  'portrait_carmine', 'portrait_carmine_scared', 'portrait_tape', 'portrait_phone', 'portrait_radio',
  // schermate
  'inv_bg', 'inv_slot', 'inv_slot_sel', 'inv_detail',
  'radio', 'gameover', 'chapter', 'ending_alba', 'ending_notte',
  // documenti
  'paper_typed', 'paper_notebook', 'paper_clinical', 'paper_letter', 'paper_ticket', 'paper_printout',
  // nella scena (canvas)
  'prompt', 'key_e', 'key_touch', 'reticle', 'arrow_left', 'arrow_right', 'arrow_up', 'padlock',
  // telefono
  'touch_shoot', 'touch_bag', 'touch_pause', 'touch_use',
];

// effetti a fotogrammi: assets/fx/<nome>.png, striscia orizzontale di fotogrammi quadrati
export const FX_FILES = ['fx_muzzle_pistol', 'fx_muzzle_shotgun', 'fx_blood_hit', 'fx_dust_drop'];

// chi parla -> ritratto (si può forzare con "portrait" nel dialogo)
export const PORTRAITS = {
  'LUCA': 'luca', 'ELENA': 'elena', 'CARMINE': 'carmine',
  'ELENA (registrazione)': 'tape', '???': 'phone', 'RADIO': 'radio',
};

const _skinImg = {}, _skinOk = new Set();

export const Skin = {
  /** Carica le immagini presenti (tools/build.py scrive l'elenco dei file che esistono) */
  init() {
    const present = /*__UI_FILES__*/null;
    const load = (key, src) => {
      if (present && !present.includes(src)) return;
      const im = new Image();
      im.onload = () => { _skinOk.add(key); document.body.classList.add('ui-' + key); };
      im.src = src;
      _skinImg[key] = im;
    };
    for (const n of UI_FILES) load(n, `assets/ui/${n}.png`);
    for (const n of FX_FILES) load(n, `assets/fx/${n}.png`);
    // font dei documenti (facoltativi): assets/fonts/typewriter.(woff2|ttf), handwriting.(woff2|ttf)
    if (typeof FontFace === 'undefined') return;
    for (const [family, base] of [['NR Typewriter', 'typewriter'], ['NR Hand', 'handwriting']]) {
      for (const ext of ['woff2', 'ttf']) {
        const src = `assets/fonts/${base}.${ext}`;
        if (!present || !present.includes(src)) continue;
        new FontFace(family, `url(${src})`).load().then(f => { document.fonts.add(f); document.body.classList.add(base === 'handwriting' ? 'font-hand' : 'font-typewriter'); }).catch(() => {});
        break;
      }
    }
  },

  has(name) { return _skinOk.has(name); },
  img(name) { return _skinOk.has(name) ? _skinImg[name] : null; },

  portraitFor(speaker, forced) {
    for (const k of [forced, PORTRAITS[speaker]]) if (k && _skinOk.has('portrait_' + k)) return `assets/ui/portrait_${k}.png`;
    return null;
  },

  /** Disegna il fotogramma "t" (0..1) di un effetto, centrato in (x, y), alto h. Ritorna false se manca. */
  drawFx(ctx, name, t, x, y, h, flip = false, alpha = 1) {
    const im = this.img(name);
    if (!im) return false;
    const n = Math.max(1, Math.round(im.naturalWidth / im.naturalHeight));
    const fw = im.naturalWidth / n, f = Math.min(n - 1, Math.floor(t * n));
    const w = h * fw / im.naturalHeight;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(im, f * fw, 0, fw, im.naturalHeight, -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  },
};
