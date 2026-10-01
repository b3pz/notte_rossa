/* =============================================
   NOTTE ROSSA — collision.js
   Collisioni AABB semplici
   ============================================= */

export class CollisionManager {
  constructor(roomManager) {
    this.roomManager = roomManager;
  }

  /** Muove un'entità di (dx, dy) risolvendo collisioni con muri/pavimento della stanza */
  moveEntity(entity, dx, dy) {
    const room = this.roomManager.current;
    if (!room) {
      return { x: entity.x + dx, y: entity.y + dy };
    }

    let nx = entity.x + dx;
    let ny = entity.y + dy;

    // ── PAVIMENTO ──
    const floor = (room.floorAt ? room.floorAt(nx + entity.width / 2) : room.floorY) - entity.height;
    // niente salti nel gioco: i piedi stanno sempre sul pavimento (anche se è inclinato)
    ny = floor;
    entity.onGround = true;

    // ── SOFFITTO ──
    const ceil = (room.ceilY || 0);
    if (ny < ceil) ny = ceil;

    // ── LIMITI ORIZZONTALI STANZA ──
    if (nx < 20) nx = 20;
    if (nx + entity.width > room.width - 20) nx = room.width - 20 - entity.width;

    // ── MURI / OSTACOLI ──
    const walls = room.walls || [];
    const hitbox = {
      x: nx + (entity.hitboxOffX || 0),
      y: ny + (entity.hitboxOffY || 0),
      w: entity.hitboxW || entity.width,
      h: entity.hitboxH || entity.height,
    };

    for (const wall of walls) {
      // Salta pareti bordo stanza (già gestite sopra)
      if (wall.w >= room.width - 50) continue;
      if (!this._overlaps(hitbox, wall)) continue;

      // Calcola penetrazione
      const overlapL = (hitbox.x + hitbox.w) - wall.x;
      const overlapR = (wall.x + wall.w)    - hitbox.x;
      const overlapT = (hitbox.y + hitbox.h) - wall.y;
      const overlapB = (wall.y + wall.h)    - hitbox.y;

      const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);

      if (minOverlap === overlapT && dy >= 0) {
        // Cade sul muro dall'alto → trattalo come pavimento
        ny = wall.y - entity.height + (entity.hitboxOffY || 0);
        entity.onGround = true;
      } else if (minOverlap === overlapB && dy < 0) {
        ny = wall.y + wall.h - (entity.hitboxOffY || 0);
      } else if (minOverlap === overlapL && dx > 0) {
        nx = wall.x - (entity.hitboxW || entity.width) - (entity.hitboxOffX || 0);
      } else if (minOverlap === overlapR && dx < 0) {
        nx = wall.x + wall.w - (entity.hitboxOffX || 0);
      }

      // Ricalcola hitbox dopo correzione
      hitbox.x = nx + (entity.hitboxOffX || 0);
      hitbox.y = ny + (entity.hitboxOffY || 0);
    }

    return { x: nx, y: ny };
  }

  /** Test overlap AABB */
  _overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  /** Overlap tra due rettangoli generici */
  static rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx &&
           ay < by + bh && ay + ah > by;
  }

  /** Distanza tra due punti */
  static distance(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /** Proiettile colpisce nemico */
  bulletHitsEnemy(bullet, enemy) {
    return CollisionManager.rectsOverlap(
      bullet.x - bullet.radius, bullet.y - bullet.radius,
      bullet.radius * 2, bullet.radius * 2,
      enemy.x + 4, enemy.y + 4, enemy.width - 8, enemy.height - 8
    );
  }

  /** Player nell'area di attacco di un nemico */
  playerInAttackRange(enemy, player, range) {
    return CollisionManager.rectsOverlap(
      enemy.x - range, enemy.y,
      enemy.width + range * 2, enemy.height,
      player.x, player.y, player.width, player.height
    );
  }

  /** Trigger area (per eventi) */
  isInTrigger(entityRect, trigger) {
    return this._overlaps(entityRect, trigger);
  }
}
