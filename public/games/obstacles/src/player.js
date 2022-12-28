import { Sounds } from "/libs/Sound.js";

export class Player {
    constructor(x, y, maxHeight) {
        this.maxHeight = maxHeight;
        this.colour = [255, 128, 0];
        this.isAlive = false;
        this.isMoving = false;

        this.x = x;
        this.y = y;
        this.ox = x;
        this.oy = y;
        this.velocity = 0;
        this.lift = 10;
        this.drag = 1;
        this.gravity = 0.7;
        this.score = 0;
    }

    ready() {
        this.isAlive = true;
        this.isMoving = true;
        this.score = 0;
        this.x = this.ox;
        this.y = this.oy;
    }

    jump() {
        this.velocity -= this.lift;
    }

    update() {
        if (this.isMoving && this.isAlive) {
            this.velocity += this.gravity;
            this.velocity *= this.drag;
            this.y += this.velocity;

            if (this.y > this.maxHeight) {
                this.y = this.maxHeight;
                this.die();
            } else if (this.y < 0) {
                this.y = 0;
                this.die();
            }
        }
    }

    display(ctx) {
        if (this.isAlive) {
            ctx.fillStyle = "rgb(" + this.colour.join(", ") + ")";
        } else {
            ctx.fillStyle = "#ff1919";
        }
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, Player.RADIUS, Player.RADIUS, 0, 0, 2 * Math.PI);
        ctx.fill();
    }

    incScore() {
        Sounds.play("blip");
        this.score++;
    }

    die() {
        Sounds.play('splat');
        this.velocity = 0;
        this.isAlive = false;
        this.isMoving = false;
    }
}

Player.RADIUS = 12;