export class Target {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 30;
        this.speed = Math.random();
    }

    move() {
        this.y += this.speed;
    }

    show(ctx) {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}