import { Bat } from "./Bat.js";
import { Ball } from "./Ball.js";

export class Pong {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    const batWidth = 20, batHeight = height * 0.25;
    this.lbat = new Bat(batWidth, height / 2, batWidth, batHeight);
    this.rbat = new Bat(width - batWidth, height / 2, batWidth, batHeight);
    this.ball = new Ball(0, 0, 15);
    this.resetBall();

    this.backgroundColor = "#000000";
    this.foregroundColor = "#ffffff";
    this.textColor = "#ffffff";
  }

  /**
   * Update game. Return status code...
   * 
   * - 0 => Nothing
   * - 1 => Ball bounced off floor/ceiling
   * - 2 => Ball went off of the screen
   * - 3 => Ball bounced off of a bat
  */
  update() {
    this.ball.update();

    // Is the ball off the screen?
    if (this.ball.x - this.ball.r < 0) {
      this.rbat.score++;
      this.resetBall();
      return 2;
    } else if (this.ball.x + this.ball.r > this.width) {
      this.lbat.score++;
      this.resetBall();
      return 2;
    }

    if (this.ball.y - this.ball.r < 0) {
      this.ball.vy *= -1;
      this.ball.y = this.ball.r;
      return 1;
    } else if (this.ball.y + this.ball.r > this.height) {
      this.ball.vy *= -1;
      this.ball.y = this.height - this.ball.r;
      return 1;
    }

    // Ball collide with any of the bats?
    if (this.lbat.collide(this.ball)) {
      const angle = Math.atan(this.ball.vy / this.ball.vx) + Math.PI / 2;
      this.ball.vx = this.ball.speed * Math.sin(angle);
      this.ball.vy = this.ball.speed * Math.cos(angle);
      this.ball.x = this.lbat.x + this.lbat.w / 2 + this.ball.r;
      return 3;
    } else if (this.rbat.collide(this.ball)) {
      const angle = Math.atan(this.ball.vy / this.ball.vx) - Math.PI / 2;
      this.ball.vx = this.ball.speed * Math.sin(angle);
      this.ball.vy = this.ball.speed * Math.cos(angle);
      this.ball.x = this.rbat.x - this.rbat.w / 2 - this.ball.r;
      return 3;
    }
  }

  /**
   * Draw the game. Return an OffscreenCanvas
   */
  draw() {
    const oc = new OffscreenCanvas(this.width, this.height);
    const ctx = oc.getContext("2d");

    // Background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, this.width, this.height);

    // Centre line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = this.foregroundColor;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bats
    ctx.fillStyle = this.foregroundColor;
    this.lbat.draw(ctx);
    this.rbat.draw(ctx);

    // Scores
    ctx.font = "4em Arial";
    ctx.fillStyle = this.textColor;
    ctx.textBaseline = "center";
    ctx.textAlign = "center";
    ctx.fillText(this.lbat.score.toLocaleString("en-GB"), this.width * 0.25, 50);
    ctx.fillText(this.rbat.score.toLocaleString("en-GB"), this.width * 0.75, 50);

    // Ball
    this.ball.draw(ctx);

    return oc;
  }

  /**
   * Move the given bat by a certain delta
   * 
   * @param {number} dy Delta
   * @param {boolean} right Right or left bat?
   */
  moveBat(dy, right) {
    const bat = right ? this.rbat : this.lbat;
    let y = bat.y + dy;
    if (y < bat.h / 2) y = bat.h / 2;
    if (y > this.height - bat.h / 2) y = this.height - bat.h / 2;
    bat.y = y;
  }

  /** Reset ball position */
  resetBall() {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.vx *= -1; // Move towards opposite player
  }
}