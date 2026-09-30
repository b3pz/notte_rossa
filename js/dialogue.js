/* =============================================
   NOTTE ROSSA — dialogue.js
   Sistema dialogo cinematografico
   ============================================= */

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
  show(speaker, text, onComplete = null) {
    if (this.active) {
      this._queue.push({ speaker, text, onComplete });
      return;
    }
    this._display(speaker, text, onComplete);
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

  _display(speaker, text, onComplete) {
    this.active      = true;
    this._fullText   = text;
    this._charIdx    = 0;
    this._currentText= '';
    this._onComplete = onComplete;
    this._typing     = true;

    this._speaker.textContent = speaker || '';
    this._text.textContent    = '';
    this._cont.style.opacity  = '0';

    if (this._box) this._box.classList.remove('hidden');

    // Blocca input durante il dialogo
    this.game.input.lock();

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
      this._display(next.speaker, next.text, next.onComplete);
    } else {
      if (this._box) this._box.classList.add('hidden');
      if (!this.game.events?.isRunning() && !this.game.ui?.hasOpenOverlay()) this.game.input.unlock();
    }

    if (onC) onC();
  }

  /** Chiude immediatamente il dialogo */
  close() {
    clearTimeout(this._typingTimer);
    this._queue   = [];
    this.active   = false;
    this._typing  = false;
    if (this._box) this._box.classList.add('hidden');
    this.game.input.unlock();
  }

  isActive() { return this.active; }
}
