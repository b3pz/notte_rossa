/* =============================================
   NOTTE ROSSA — citymap.js
   Mappa di Porto Salvo disegnata come una piantina di carta.
   Luoghi rivelati man mano, "sei qui", X sull'obiettivo,
   appunti a penna di Elena quando hai trovato la piantina.
   ============================================= */

export const PLACES = [
  { id: 'stazione',  name: 'Stazione Centrale', x: 215, y: 175, w: 190, h: 95,
    rooms: ['train_wagon', 'station_platform', 'station_hall', 'station_storage', 'station_control', 'station_exit'] },
  { id: 'palazzo',   name: 'Palazzo Conti',     x: 380, y: 290, w: 110, h: 60, labelAbove: true, rooms: ['apartment'] },
  { id: 'ferrante',  name: 'Via Ferrante',      x: 680, y: 362, w: 0, h: 0, street: true, rooms: ['city_street'] },
  { id: 'alimentari',name: 'Alimentari Luigi',  x: 640, y: 290, w: 100, h: 60, labelAbove: true, rooms: ['alimentari'] },
  { id: 'vicolo',    name: 'Vicolo dei Pescatori', x: 690, y: 445, w: 0, h: 0, street: true, rooms: ['city_alley'] },
  { id: 'ospedale',  name: 'Ospedale San Rocco', x: 820, y: 470, w: 170, h: 105,
    rooms: ['hospital_corridor', 'hospital_ward', 'hospital_surgery', 'hospital_morgue'] },
  { id: 'metro',     name: 'Metro — Linea 3',   x: 960, y: 345, w: 0, h: 0, under: true,
    rooms: ['metro_ingresso', 'metro_banchina', 'metro_tunnel'] },
  { id: 'tecnica',   name: 'Sala tecnica',      x: 1075, y: 255, w: 120, h: 62, under: true,
    rooms: ['sala_generatori', 'stanza_manutenzione', 'safe_room'] },
  { id: 'lab',       name: 'Laboratorio',       x: 1085, y: 140, w: 150, h: 78, under: true,
    rooms: ['lab_ingresso', 'lab_corridoio', 'lab_biologico', 'sala_server', 'camera_centrale'] },
  { id: 'porto',     name: 'Porto commerciale', x: 1010, y: 610, w: 170, h: 60, rooms: ['porto', 'molo_finale'] },
];

export function placeOfRoom(roomId) {
  return PLACES.find(p => p.rooms.includes(roomId)) || null;
}

/** Luogo dell'obiettivo, ricavato dalle parole del testo */
export function placeOfObjective(text = '') {
  const t = text.toLowerCase();
  const rules = [
    ['porto', ['molo', 'scappa']],
    ['lab', ['laboratorio', 'dati', 'server', 'camera centrale', 'chiave sul tavolo']],
    ['tecnica', ['generatore', 'officina', 'tessera', 'rifugio']],
    ['alimentari', ['luigi', 'cassaforte', 'fusibile']],
    ['palazzo', ['palazzo conti']],
    ['ospedale', ['degenze', 'operatoria', 'obitorio', 'r-0', 'san rocco', 'badge']],
    ['vicolo', ['vicolo', 'sbarrata', 'fare leva']],
    ['stazione', ['treno', 'telefono', 'servizi tecnici', 'sala controllo', 'serranda', 'arma', 'esci dalla stazione']],
  ];
  for (const [id, words] of rules) if (words.some(w => t.includes(w))) return PLACES.find(p => p.id === id);
  return null;
}

// carta: un po' di rumore generato una volta sola
let _paper = null;
function paper(W, H) {
  if (_paper && _paper.width === W) return _paper;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, '#d9c9a3'); g.addColorStop(1, '#a8916a');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8;
  }
  x.putImageData(img, 0, 0);
  // pieghe della carta
  x.strokeStyle = 'rgba(80,60,30,0.18)'; x.lineWidth = 2;
  for (const fx of [W / 3, 2 * W / 3]) { x.beginPath(); x.moveTo(fx, 0); x.lineTo(fx, H); x.stroke(); }
  x.beginPath(); x.moveTo(0, H / 2); x.lineTo(W, H / 2); x.stroke();
  // macchie
  for (let i = 0; i < 9; i++) {
    const sx = Math.random() * W, sy = Math.random() * H, r = 20 + Math.random() * 60;
    const m = x.createRadialGradient(sx, sy, 0, sx, sy, r);
    m.addColorStop(0, 'rgba(110,80,40,0.16)'); m.addColorStop(1, 'rgba(110,80,40,0)');
    x.fillStyle = m; x.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  _paper = c;
  return c;
}

const INK = '#2b2318', INK_SOFT = 'rgba(43,35,24,0.45)', RED = '#a3121f';

export function drawCityMap(ctx, W, H, { rooms, states, currentRoom, objective, hasMap, t }) {
  ctx.save();
  ctx.drawImage(paper(W, H), 0, 0);
  const seen = (p) => p.rooms.some(r => states[r]?.visited);
  const here = placeOfRoom(currentRoom);

  // ── mare ──
  ctx.fillStyle = 'rgba(70,100,115,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 560);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 560 + Math.sin(x * 0.02) * 10 + (x > 850 ? 40 : 0));
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(43,35,24,0.25)'; ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 560 + k * 26 + Math.sin(x * 0.02 + k) * 8 + (x > 850 ? 40 : 0));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(43,35,24,0.6)';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('Mar Tirreno', 120, 660);

  // ── collina (sopra il laboratorio) ──
  ctx.strokeStyle = 'rgba(43,35,24,0.3)'; ctx.lineWidth = 1.5;
  for (let k = 0; k < 5; k++) {
    ctx.beginPath(); ctx.ellipse(1100, 190, 190 - k * 32, 120 - k * 20, -0.1, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(43,35,24,0.55)'; ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('Collina di Sant\'Elmo', 975, 45);

  // ── ferrovia ──
  ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 80); ctx.bezierCurveTo(80, 110, 140, 150, 215, 175); ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let s = 0; s <= 1; s += 0.06) {
    const x = (1 - s) ** 3 * 0 + 3 * (1 - s) ** 2 * s * 80 + 3 * (1 - s) * s * s * 140 + s ** 3 * 215;
    const y = (1 - s) ** 3 * 80 + 3 * (1 - s) ** 2 * s * 110 + 3 * (1 - s) * s * s * 150 + s ** 3 * 175;
    ctx.beginPath(); ctx.moveTo(x - 6, y + 9); ctx.lineTo(x + 6, y - 9); ctx.stroke();
  }

  // ── strade ──
  const road = (pts, w) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = w + 3; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
    ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = w; ctx.stroke();
  };
  road([[300, 215], [330, 340], [800, 360], [1010, 380]], 16);          // Via Ferrante
  road([[620, 352], [690, 440], [745, 470]], 9);                        // vicolo
  road([[430, 345], [430, 520], [700, 560]], 10);                       // lungomare
  road([[1010, 380], [960, 560], [1010, 610]], 10);                     // discesa al porto
  road([[560, 120], [560, 350]], 9);
  road([[160, 330], [330, 340]], 9);
  // isolati generici
  ctx.fillStyle = 'rgba(43,35,24,0.12)'; ctx.strokeStyle = INK_SOFT; ctx.lineWidth = 1;
  for (const [x, y, w, h] of [[340, 120, 90, 70], [450, 110, 90, 90], [600, 150, 120, 80], [740, 170, 90, 120], [180, 380, 120, 70],
                               [470, 400, 110, 80], [600, 470, 70, 60], [860, 240, 80, 80], [250, 470, 110, 60], [700, 230, 30, 40]]) {
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  }

  // ── metro (sottoterra, tratteggiata) ──
  ctx.setLineDash([12, 9]); ctx.strokeStyle = 'rgba(163,18,31,0.75)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(870, 470); ctx.bezierCurveTo(900, 380, 940, 350, 1000, 330); ctx.lineTo(1075, 265); ctx.lineTo(1090, 160); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(163,18,31,0.8)'; ctx.font = 'bold 15px "Courier New", monospace';
  ctx.fillText('M  LINEA 3', 905, 415);

  // ── luoghi ──
  for (const p of PLACES) {
    const known = seen(p);
    ctx.globalAlpha = known ? 1 : 0.38;
    if (!p.street) {
      ctx.fillStyle = p.under ? 'rgba(163,18,31,0.10)' : 'rgba(43,35,24,0.28)';
      ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      if (p.under) ctx.setLineDash([7, 5]);
      ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      ctx.strokeRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
      ctx.setLineDash([]);
      if (p.id === 'ospedale') { // croce
        ctx.fillStyle = RED; ctx.fillRect(p.x - 6, p.y - 22, 12, 34); ctx.fillRect(p.x - 17, p.y - 11, 34, 12);
      }
      if (p.id === 'stazione') {
        ctx.font = 'bold 22px "Courier New", monospace'; ctx.fillStyle = INK; ctx.textAlign = 'center';
        ctx.fillText('FS', p.x, p.y + 8); ctx.textAlign = 'left';
      }
      if (p.id === 'porto') { // moli
        ctx.strokeStyle = INK; ctx.lineWidth = 6;
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(p.x - 60 + k * 42, p.y + 30); ctx.lineTo(p.x - 60 + k * 42, p.y + 85); ctx.stroke(); }
        ctx.fillStyle = INK; ctx.font = 'bold 13px "Courier New", monospace';
        ctx.fillText('4', p.x - 60 + 3 * 42 + 6, p.y + 82);
      }
    }
    // nome
    ctx.font = (p.street ? 'italic bold 21px Georgia, serif' : 'bold 22px Georgia, serif');
    ctx.fillStyle = INK; ctx.textAlign = 'center';
    const ly = p.street ? p.y - 16 : p.labelAbove ? p.y - p.h / 2 - 12 : p.y + p.h / 2 + 26;
    const label = known ? p.name : '?';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(217,201,163,0.85)'; ctx.strokeText(label, p.x, ly);
    ctx.fillText(label, p.x, ly);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // ── appunti di Elena (dopo aver trovato la piantina) ──
  if (hasMap) {
    const o = PLACES.find(p => p.id === 'ospedale');
    ctx.strokeStyle = 'rgba(163,18,31,0.85)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(o.x, o.y, o.w * 0.75, o.h * 0.85, -0.08, 0.2, Math.PI * 2.05); ctx.stroke();
    ctx.fillStyle = 'rgba(163,18,31,0.9)'; ctx.font = 'italic 22px "Brush Script MT", "Segoe Script", cursive';
    ctx.fillText('qui ho lavorato', o.x - 40, o.y - o.h / 2 - 34);
    const l = PLACES.find(p => p.id === 'lab');
    ctx.fillText('il laboratorio è SOTTO', l.x - 210, l.y + 75);
    const pt = PLACES.find(p => p.id === 'porto');
    ctx.fillText('la barca di papà: molo 4', pt.x - 250, pt.y + 75);
  }

  // ── obiettivo: X a penna rossa ──
  const goal = placeOfObjective(objective);
  if (goal) {
    const gx = goal.x + (goal.street ? 0 : goal.w / 2 - 6), gy = goal.y - (goal.street ? 0 : goal.h / 2 - 6);
    ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(gx - 16, gy - 16); ctx.lineTo(gx + 16, gy + 16); ctx.moveTo(gx + 16, gy - 16); ctx.lineTo(gx - 16, gy + 16); ctx.stroke();
  }

  // ── sei qui ──
  if (here) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(163,18,31,${0.25 + pulse * 0.25})`;
    ctx.beginPath(); ctx.arc(here.x, here.y, 26 + pulse * 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(here.x, here.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f2e6c9'; ctx.lineWidth = 3; ctx.stroke();
  }

  // ── rosa dei venti e titolo ──
  ctx.save(); ctx.translate(W - 70, H - 80);
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(9, 0); ctx.lineTo(0, 42); ctx.lineTo(-9, 0); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(9, 0); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill();
  ctx.font = 'bold 18px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('N', 0, -50);
  ctx.restore();
  ctx.fillStyle = INK; ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText('PORTO SALVO', 26, 46);
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText('pianta della città', 28, 70);
  // bordo
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.lineWidth = 1; ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.restore();
}
