import { Bullet } from "./bullet.js";
import { Target } from "./target.js";

export class Ship {
    constructor(xPos, yPos, xMax) {
        this.x = xPos;
        this.y = yPos;
        this.w = 20;
        this.h = 60;
        this.xMax = xMax;

        this.ammo = 3;
        this.bullets = [];
    }

    show(ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.y);
    }

    move(dir) {
        this.x += dir * 2;
        if (this.x < 0) this.x = 0;
        if (this.x > this.xMax) this.x = this.xMax;
    }

    shoot() {
        if (this.ammo < 1) return false;
        const bullet = new Bullet(this.x, this.y - this.w);
        this.bullets.push(bullet);
        this.ammo--;
        return true;
    }

    /** Update positions of bullets and hit targets. Returned number of targets hit. */
    updateBullets(targets) {
        let hit = 0;

        // Move bullets and check for collisions etc...
        for (let i = 0; i < this.bullets.length; i++) {
            const bullet = this.bullets[i];
            bullet.move();

            // If bullet off screen, remove it
            if (bullet.y < 0) {
                this.bullets.splice(i, 1);
                i--;
                continue;
            }

            // Has hit any targets ?
            for (let j = targets.length - 1; j >= 0; j--) {
                if (bullet.hits(targets[j])) {
                    this.ammo += Ship.ammoGained;
                    targets.splice(j, 1);
                    hit++;
                    this.bullets.splice(i, 1);
                    i--;
                    break;
                }
            }
        }
        return hit;
    }

    showBullets(ctx) {
        this.bullets.forEach(B => B.show(ctx));
    }
}

Ship.ammoGained = 2;
Ship.ammoLost = 3;