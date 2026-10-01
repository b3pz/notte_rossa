/* =============================================
   NOTTE ROSSA — dialogue.js
   Sistema dialogo cinematografico
   ============================================= */

import { Skin } from './skin.js';

export class DialogueManager {
  constructor(game) {
    this.game     = game;
    this.active   = false;
    this._queue   = [];    // coda di { speaker, text }
    this._typing  = false;
    this._charIdx = 0;
    this._typingSpeed = 30;  // ms per carattere
    this._typingTimer = null;
    this._currentText = '';
    this._fullText    = '';
    this._onComplete  = null;

    this._box     = document.getElementById('dialogue-box');
    this._speaker = document.getElementById('dialogue-speaker');
    this._text    = document.getElementById('dialogue-text');
    this._cont    = document.getElementById('dialogue-continue');
    this._portrait = document.getElementById('dialogue-portrait');

    // Avanzamento con SPACE o click
    this._box?.addEventListener('click',    () => this.advance());
    document.addEventListener('keydown',    (e) => {
      if (this.active && ['Space', 'Enter', 'KeyE'].includes(e.code)) {
        e.preventDefault();
        if (e.repeat) return;
        this.game.input.consume(e.code);
        this.advance();
      }
    });
  }

  /** Mostra un dialogo (o lo accoda) */
  show(speaker, text, onComplete = null, portrait = null) {
    if (this.active) {
      this._queue.push({ speaker, text, onComplete, portrait });
      return;
    }
    this._display(speaker, text, onComplete, portrait);
  }

  /** Mostra una sequenza di dialoghi */
  showSequence(lines, onComplete) {
    const all = [...lines];
    const next = (idx) => {
      if (idx >= all.length) { if (onComplete) onComplete(); return; }
      const { speaker = '', text } = all[idx];
      this.show(speaker, text, () => next(idx + 1));
    };
    next(0);
  }

  _display(speaker, text, onComplete, portrait = null) {
    this.active      = true;
    this._fullText   = text;
    this._charIdx    = 0;
    this._currentText= '';
    this._onComplete = onComplete;
    this._typing     = true;

    this._speaker.textContent = speaker || '';
    // ritratto di chi parla (assets/ui/portrait_*.png), se c'è
    const pic = Skin.portraitFor(speaker, portrait);
    this._box?.classList.toggle('has-portrait', !!pic);
    if (pic && this._portrait) this._portrait.src = pic;
    this._text.textContent    = '';
    this._cont.style.opacity  = '0';

    if (this._box) this._box.classList.remove('hidden');
    document.body.classList.add('nr-dialog');


    this._typeChar();
  }

  _typeChar() {
    if (!this._typing) return;
    if (this._charIdx >= this._fullText.length) {
      // Testo completo
      this._typing = false;
      this._cont.style.opacity = '1';
      // Sblocca input solo dopo che il giocatore avanza
      return;
    }
    this._currentText += this._fullText[this._charIdx++];
    this._text.textContent = this._currentText;
    this._typingTimer = setTimeout(() => this._typeChar(), this._typingSpeed);
  }

  /** Avanza (skip typing o chiudi box) */
  advance() {
    if (!this.active) return;

    if (this._typing) {
      // Skip: mostra tutto il testo
      clearTimeout(this._typingTimer);
      this._typing = false;
      this._text.textContent   = this._fullText;
      this._currentText        = this._fullText;
      this._cont.style.opacity = '1';
      return;
    }

    // Chiudi o prosegui con la coda
    const onC = this._onComplete;
    this.active      = false;
    this._onComplete = null;

    if (this._queue.length > 0) {
      const next = this._queue.shift();
      this._display(next.speaker, next.text, next.onComplete, next.portrait);
    } else {
      if (this._box) this._box.classList.add('hidden');
      document.body.classList.remove('nr-dialog');
    }

    if (onC) onC();
  }

  /** Chiude immediatamente il dialogo */
  close() {
    clearTimeout(this._typingTimer);
    // chi aspettava la fine di questi dialoghi deve comunque proseguire
    const pending = [this._onComplete, ...this._queue.map(q => q.onComplete)].filter(Boolean);
    this._queue   = [];
    this._onComplete = null;
    this.active   = false;
    this._typing  = false;
    if (this._box) this._box.classList.add('hidden');
    document.body.classList.remove('nr-dialog');
    for (const fn of pending) { try { fn(); } catch (e) { console.error(e); } }
  }

  isActive() { return this.active; }
}
