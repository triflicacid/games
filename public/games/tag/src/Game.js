const fillTarget = "#ff5555";
const fillCrosshair = "#36454f";
var dp = 1;

function round(n, dp) {
  const k = Math.pow(10, dp);
  return Math.round(n * k) / k;
}

export class Game {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    const mx = this.width / 2, my = this.height / 2;
    this.target = { x: mx, y: my };
    this.targetRadius = 30;
    this.targetStratas = 3;
    this.crosshair = { x: mx, y: my }; // Crosshair
    this.crosshairK = 1.35;
    this.lastFire = 0;
    this.cooldown = 1 * 1000;

    this.scores = [0, 0];
    this.crosshairPlayer = 1; // Index of player who is controlling crosshair
  }

  /** Move the target */
  moveTarget(dx, dy) {
    const dim = this.targetRadius * 2;
    this.target.x += dx;
    if (this.target.x < dim) this.target.x = dim;
    else if (this.target.x > this.width - dim) this.target.x = this.width - dim;
    this.target.y += dy;
    if (this.target.y < dim) this.target.y = dim;
    else if (this.target.y > this.height - dim) this.target.y = this.height - dim;
  }

  /** Move the crosshair */
  moveCrosshair(dx, dy) {
    const dim = this.targetRadius * this.crosshairK * 2;
    this.crosshair.x += dx;
    if (this.crosshair.x < dim) this.crosshair.x = dim;
    else if (this.crosshair.x > this.width - dim) this.crosshair.x = this.width - dim;
    this.crosshair.y += dy;
    if (this.crosshair.y < dim) this.crosshair.y = dim;
    else if (this.crosshair.y > this.height - dim) this.crosshair.y = this.height - dim;
  }

  /** Rotate who is playing as the target */
  rotate() {
    this.crosshairPlayer = (this.crosshairPlayer + 1) % this.scores.length;
  }

  /**
   * Fire a shot using the crosshair. Return status:
   * 
   * - `0` - Cooldown still active
   * - `1` - Miss
   * - `2` - Hit
  */
  fire() {
    const now = performance.now();
    // Check cooldown
    if (now - this.lastFire <= this.cooldown) {
      return 0;
    }

    this.lastFire = now;
    // Hit?
    const hit = this.crosshair.x >= this.target.x - this.targetRadius && this.crosshair.x < this.target.x + this.targetRadius &&
      this.crosshair.y >= this.target.y - this.targetRadius && this.crosshair.y < this.target.y + this.targetRadius;
    if (hit) {
      let strata;
      // Get strata in
      if (this.targetStratas > 1) {
        const dist = Math.hypot(this.target.x - this.crosshair.x, this.target.y - this.crosshair.y);
        let dr = this.targetRadius / this.targetStratas;
        strata = this.targetStratas - Math.floor(dist / dr);
      } else {
        strata = 1;
      }
      this.scores[this.crosshairPlayer] += strata / this.targetStratas;
      this.rotate();
      return 2;
    } else {
      return 1;
    }
  }

  /** Return an OffscreenCanvas of the current state */
  draw() {
    const canvas = new OffscreenCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Target
    ctx.fillStyle = fillTarget;
    ctx.beginPath();
    ctx.arc(Math.round(this.target.x), Math.round(this.target.y), this.targetRadius, 0, 2 * Math.PI);
    ctx.fill();
    // Stratas
    if (this.targetStratas > 1) {
      let dr = this.targetRadius / this.targetStratas;
      ctx.strokeStyle = "#f5f5f5";
      for (let r = this.targetRadius - dr; r > 0; r -= dr) {
        ctx.beginPath();
        ctx.arc(Math.round(this.target.x), Math.round(this.target.y), Math.round(r), 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // Crosshair
    ctx.strokeStyle = fillCrosshair;
    ctx.beginPath();
    // Vertical line
    ctx.moveTo(Math.round(this.crosshair.x), 0);
    ctx.lineTo(Math.round(this.crosshair.x), this.height);
    // Horizontal line
    ctx.moveTo(0, Math.round(this.crosshair.y));
    ctx.lineTo(this.width, Math.round(this.crosshair.y));
    // Circle
    ctx.arc(Math.round(this.crosshair.x), Math.round(this.crosshair.y), Math.floor(this.targetRadius * this.crosshairK), 0, 2 * Math.PI);
    ctx.stroke();

    // Scores
    let isP1 = this.crosshairPlayer === 1, ty = 25;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "5em Arial";
    // P0 score
    ctx.fillStyle = isP1 ? fillTarget : fillCrosshair;
    ctx.fillText(round(this.scores[0], dp).toString(), this.width * 0.25, ty);
    // P1 score
    ctx.fillStyle = isP1 ? fillCrosshair : fillTarget;
    ctx.fillText(round(this.scores[1], dp).toString(), this.width * 0.75, ty);

    return canvas;
  }
}