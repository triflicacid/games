export class Ball {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.r = r;
  }

  /** Get speed of the ball */
  get speed() {
    return Math.hypot(this.vx, this.vy);
  }

  /**
   * Update position of ball given the velocity vector <vx,vy>.
   */
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  /**
   * Draw ball onto a rendering context
   * 
   * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    ctx.fill();
  }
}