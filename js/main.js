/* =============================================
   NOTTE ROSSA — main.js
   Entry point ES6 module
   ============================================= */

import { Game } from './game.js';

// Istanza globale (utile per debug da console)
let game = null;

window.addEventListener('DOMContentLoaded', () => {
  try {
    game = new Game();
    window._notteRossa = game; // debug access
  } catch (e) {
    console.error('[Main] Errore inizializzazione gioco:', e);
    document.body.innerHTML = `
      <div style="color:#c0152a;font-family:monospace;padding:40px;background:#080a0e;min-height:100vh">
        <h2>NOTTE ROSSA — Errore di avvio</h2>
        <pre>${e.stack || e.message}</pre>
        <p>Controlla la console per dettagli.</p>
      </div>`;
  }
});

// Cattura errori globali non gestiti
window.addEventListener('unhandledrejection', (e) => {
  console.error('[Main] Promise non gestita:', e.reason);
});

window.addEventListener('error', (e) => {
  console.error('[Main] Errore globale:', e.message, e.filename, e.lineno);
});
