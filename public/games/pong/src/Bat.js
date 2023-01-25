export class Bat {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.score = 0;
  }

  /**
   * Draw bat onto a rendering context
   * 
   * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
  }

  /**
   * Does the given ball intersect with this bat?
   */
  collide(ball) {
    return ball.x + ball.r / 2 >= this.x - this.w / 2
      && ball.x - ball.r / 2 <= this.x + this.w / 2
      && ball.y + ball.r / 2 >= this.y - this.h / 2
      && ball.y - ball.r / 2 <= this.y + this.h / 2;
  }
}