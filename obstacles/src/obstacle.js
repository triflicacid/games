export class Obstacle {
    constructor(gap, cx, cy, w, maxHeight) {
        this.maxHeight = maxHeight;
        this.gap = gap;
        this.cx = cx;
        this.cy = cy;
        this.w = w;

        this.speed = Obstacle.defaultSpeed;
        this.state = Obstacle.State.NORMAL;
    }

    display(ctx) {
        if (this.state == Obstacle.State.PAST) {
            ctx.fillStyle = "#00ff64";
        } else if (this.state == Obstacle.State.DIM) {
            ctx.fillStyle = "#64646464";
        } else {
            ctx.fillStyle = "#969696";
        }

        const x = this.cx - this.w / 2;
        const y1 = 0;
        const h1 = this.cy - this.gap / 2;
        ctx.fillRect(x, y1, this.w, h1);

        const y2 = this.cy + this.gap / 2;
        const h2 = this.maxHeight - this.gap / 2 - this.cy;
        ctx.fillRect(x, y2, this.w, h2);

        if (this.state === Obstacle.State.NORMAL) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#14c8647d";
            const lx = x + this.w / 2;
            ctx.beginPath();
            ctx.moveTo(lx, y1 + h1);
            ctx.lineTo(lx, y2);
            ctx.stroke();
        }
    }

    update() {
        this.cx -= this.speed;
    }

    offscreen() {
        return this.cx < -this.w;
    }

    hits(player) {
        let x = this.cx - this.w / 2;
        let y = 0;
        let h = this.cy - this.gap / 2;
        // rect(x, y, this.w, h);
        if (player.x > x && player.x < x + this.w && player.y > y && player.y < y + h) return true;

        y = this.cy + this.gap / 2;
        h = this.maxHeight - this.gap / 2 - this.cy;
        // rect(x, y, this.w, h);
        if (player.x > x && player.x < x + this.w && player.y > y && player.y < y + h) return true;

        return false;
    }

    past(player) {
        return player.x > this.cx + this.w / 2;
    }
}

Obstacle.defaultSpeed = 8;
Obstacle.spawnEvery = 40;

Obstacle.State = Object.freeze({
    NORMAL: 0,
    PAST: 1,
    DIM: 2,
});