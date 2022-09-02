export class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 8;
        this.speed = 4;
        this.del = false;
    }

    show(ctx) {
        ctx.fillStyle = "#5a32fa";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
    }

    move() {
        this.y -= this.speed;
    }

    hits(target) {
        if (this.del) return false;
        const d = Math.sqrt((this.x - target.x) ** 2 + (this.y - target.y) ** 2);
        return d < this.r + target.r;
    }
}