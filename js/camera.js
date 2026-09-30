/* =============================================
   NOTTE ROSSA — camera.js
   Camera 2D fluida con dead zone, shake, pan
   ============================================= */

export class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.x = 0;        // Posizione world-space (angolo superiore-sinistro della vista)
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    this.width  = canvasWidth;
    this.height = canvasHeight;

    // Smoothing (0=istantaneo, 1=mai arriva)
    this.smoothX = 0.12;
    this.smoothY = 0.10;

    // Dead zone (percentuale del canvas — la camera non si muove finché il target è dentro)
    this.deadZoneX = 0.15;  // 15% da ogni lato
    this.deadZoneY = 0.20;

    // Shake
    this._shakeIntensity = 0;
    this._shakeDuration  = 0;
    this._shakeTimer     = 0;
    this._shakeOffsetX   = 0;
    this._shakeOffsetY   = 0;

    // Limiti mondo (impostati dalla stanza corrente)
    this.worldMinX = 0;
    this.worldMinY = 0;
    this.worldMaxX = Infinity;
    this.worldMaxY = Infinity;

    // Pan cinematico
    this._panActive    = false;
    this._panTargetX   = 0;
    this._panTargetY   = 0;
    this._panDuration  = 0;
    this._panTimer     = 0;
    this._panFromX     = 0;
    this._panFromY     = 0;
    this._panCallback  = null;

    // Zoom
    this.zoom = 1;
    this.targetZoom = 1;
    this.smoothZoom = 0.08;

    // Blocco temporaneo (non segue il player)
    this.locked = false;
  }

  /** Imposta i limiti del mondo (di solito dalla stanza) */
  setBounds(minX, minY, maxX, maxY) {
    this.worldMinX = minX;
    this.worldMinY = minY;
    this.worldMaxX = maxX;
    this.worldMaxY = maxY;
  }

  /** Aggiorna il target della camera verso il centro del soggetto */
  follow(entityX, entityY, entityW = 32, entityH = 48) {
    if (this.locked || this._panActive) return;
    // Centro del soggetto
    const cx = entityX + entityW / 2;
    const cy = entityY + entityH / 2;

    // Punto desiderato: soggetto al centro del viewport
    const desiredX = cx - this.width  / 2;
    const desiredY = cy - this.height / 2;

    // Dead zone: muovi solo se il soggetto è uscito dalla zona sicura
    const halfDZW = this.width  * this.deadZoneX;
    const halfDZH = this.height * this.deadZoneY;

    const subjectViewX = cx - this.x;  // posizione soggetto nello spazio schermo
    const subjectViewY = cy - this.y;

    const leftEdge  = this.width  / 2 - halfDZW;
    const rightEdge = this.width  / 2 + halfDZW;
    const topEdge   = this.height / 2 - halfDZH;
    const botEdge   = this.height / 2 + halfDZH;

    if (subjectViewX < leftEdge)  this.targetX = cx - leftEdge;
    if (subjectViewX > rightEdge) this.targetX = cx - rightEdge;
    if (subjectViewY < topEdge)   this.targetY = cy - topEdge;
    if (subjectViewY > botEdge)   this.targetY = cy - botEdge;
  }

  /** Aggiorna posizione e shake ogni frame */
  update(dt) {
    if (!this._panActive) {
      // Smooth follow
      this.x += (this.targetX - this.x) * this.smoothX;
      this.y += (this.targetY - this.y) * this.smoothY;
    } else {
      // Pan cinematico
      this._panTimer += dt;
      const t = Math.min(this._panTimer / this._panDuration, 1);
      const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;  // ease in-out quad
      this.x = this._panFromX + (this._panTargetX - this._panFromX) * ease;
      this.y = this._panFromY + (this._panTargetY - this._panFromY) * ease;
      if (t >= 1) {
        this._panActive = false;
        if (this._panCallback) { this._panCallback(); this._panCallback = null; }
      }
    }

    // Clamp ai limiti
    const effW = this.width  / this.zoom;
    const effH = this.height / this.zoom;
    this.x = Math.max(this.worldMinX, Math.min(this.x, this.worldMaxX - effW));
    this.y = Math.max(this.worldMinY, Math.min(this.y, this.worldMaxY - effH));

    // Smooth zoom
    this.zoom += (this.targetZoom - this.zoom) * this.smoothZoom;

    // Shake
    if (this._shakeTimer > 0) {
      this._shakeTimer -= dt;
      const t = this._shakeTimer / this._shakeDuration;
      const mag = this._shakeIntensity * t;
      this._shakeOffsetX = (Math.random() * 2 - 1) * mag;
      this._shakeOffsetY = (Math.random() * 2 - 1) * mag;
    } else {
      this._shakeOffsetX = 0;
      this._shakeOffsetY = 0;
    }
  }

  /** Applica trasformazione al canvas context */
  applyTransform(ctx) {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(
      -(this.x + this._shakeOffsetX),
      -(this.y + this._shakeOffsetY)
    );
  }

  restoreTransform(ctx) {
    ctx.restore();
  }

  /** Converti coordinate schermo → mondo */
  screenToWorld(sx, sy) {
    return {
      x: sx / this.zoom + this.x + this._shakeOffsetX,
      y: sy / this.zoom + this.y + this._shakeOffsetY
    };
  }

  /** Converti coordinate mondo → schermo */
  worldToScreen(wx, wy) {
    return {
      x: (wx - this.x - this._shakeOffsetX) * this.zoom,
      y: (wy - this.y - this._shakeOffsetY) * this.zoom
    };
  }

  /** Screen shake */
  shake(intensity = 8, duration = 0.3) {
    this._shakeIntensity = intensity;
    this._shakeDuration  = duration;
    this._shakeTimer     = duration;
  }

  /** Pan cinematico verso una posizione specifica */
  panTo(worldX, worldY, duration = 1.5, callback = null) {
    this._panFromX    = this.x;
    this._panFromY    = this.y;
    this._panTargetX  = worldX - this.width  / 2;
    this._panTargetY  = worldY - this.height / 2;
    this._panDuration = duration;
    this._panTimer    = 0;
    this._panActive   = true;
    this._panCallback = callback;
    this.locked       = false;  // il pan sovrascrive il lock
  }

  /** Pan brusco (istantaneo) */
  snapTo(worldX, worldY) {
    this.x = this.targetX = worldX - this.width  / 2;
    this.y = this.targetY = worldY - this.height / 2;
    this._panActive = false;
  }

  /** Imposta zoom target */
  setZoom(z) {
    this.targetZoom = z;
  }

  /** Ritorna il rettangolo visibile nel mondo */
  getViewRect() {
    return {
      x: this.x + this._shakeOffsetX,
      y: this.y + this._shakeOffsetY,
      w: this.width  / this.zoom,
      h: this.height / this.zoom
    };
  }

  /** Verifica se un rettangolo mondo è visibile */
  isVisible(wx, wy, ww, wh) {
    const v = this.getViewRect();
    return wx + ww > v.x && wx < v.x + v.w &&
           wy + wh > v.y && wy < v.y + v.h;
  }

  resize(newW, newH) {
    this.width  = newW;
    this.height = newH;
  }
}
