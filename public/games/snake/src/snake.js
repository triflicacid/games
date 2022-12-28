import { hsl2rgb } from "/libs/util.js";
import { Sounds } from "/libs/Sound.js";

export class Snake {
    constructor(grid) {
        this.grid = grid;
        this.segments = [];
        this.moving = NaN;
        this.score = NaN;
        this.alive = false;
        this.colour = [255, 0, 128];
    }

    get head() {
        return this.segments[0];
    }
    get tail() {
        return this.segments[this.segments.length - 1];
    }

    new() {
        // Add head
        this.segments.length = 0;
        this.segments.push({
            x: Math.floor(Math.random() * this.grid.dimensions),
            y: Math.floor(Math.random() * this.grid.dimensions),
        });

        this.moving = move.NONE; // random(Object.values(move));

        this.score = 0;
        this.alive = true;
    }

    __addSegment(x, y) {
        this.segments.push({
            x,
            y,
        });
    }

    grow() {
        if (this.alive) {
            // If small, grow according to head movement
            if (this.segments.length === 1) {
                const tail = this.tail;
                switch (this.moving) {
                    case move.UP:
                        this.__addSegment(tail.x, tail.y + 1);
                        break;
                    case move.DOWN:
                        this.__addSegment(tail.x, tail.y - 1);
                        break;
                    case move.LEFT:
                        this.__addSegment(tail.x + 1, tail.y);
                        break;
                    case move.RIGHT:
                        this.__addSegment(tail.x - 1, tail.y);
                        break;
                    default:
                        throw new TypeError('Invalid moving value: ' + this.moving);
                }
            } else {
                // Calculate tail movement vector
                const last = this.segments[this.segments.length - 1];
                const secondLast = this.segments[this.segments.length - 2];

                const vector = {
                    x: secondLast.x - last.x,
                    y: secondLast.y - last.y,
                };
                this.__addSegment(last.x - vector.x, last.y - vector.y);
            }

            Sounds.play('grow');

            this.score++;
            if (this.score != 0 && this.score % 5 == 0) {
                Sounds.play('levelUp');
            }
        }
    }

    move() {
        if (this.alive) {
            const vector = {
                x: 0,
                y: 0,
            };

            switch (this.moving) {
                case move.NONE:
                    return;
                case move.LEFT:
                    vector.x = -1;
                    break;
                case move.RIGHT:
                    vector.x = +1;
                    break;
                case move.UP:
                    vector.y = -1;
                    break;
                case move.DOWN:
                    vector.y = +1;
                    break;
            }

            if (this.__moveValid(vector)) {
                const newHead = {
                    x: this.head.x + vector.x,
                    y: this.head.y + vector.y,
                };
                this.segments.unshift(newHead);
                this.segments.pop();
            } else {
                this.die();
            }
        }
    }

    /**
     * Is the given vector provoding us with a valid move?
     * @return {Boolean}
     */
    __moveValid(vector) {
        if (this.alive) {
            const newHead = {
                x: this.head.x + vector.x,
                y: this.head.y + vector.y,
            };

            // If hit wall
            if (newHead.y < 0 || newHead.y >= this.grid.dimensions || newHead.x < 0 || newHead.x >= this.grid.dimensions) return false;

            // If segment in this position...
            for (const segment of this.segments) {
                if (segment.x == newHead.x && segment.y == newHead.y) return false;
            }

            return true;
        } else {
            return false;
        }
    }

    render(ctx) {
        if (this.segments.length > 0) {
            const d = this.grid.cellDimensions; // Dimensions of body
            const pad = 1; // Padding around body
            const roundness = 15; // Roundness of body

            let segment; // Current body segment
            let colour; // Current colour of segment

            let isRainbow = this.alive && this.score > 30;
            let deltaHue;

            if (!this.alive) {
                colour = [255, 0, 0];
            } else if (isRainbow) {
                deltaHue = 300 / this.segments.length;
                colour = [0, 100, 50];
            } else {
                colour = [...this.colour];
            }

            // Head
            ctx.fillStyle = "rgb(" + (isRainbow ? hsl2rgb(...colour) : colour).join(", ") + ")";
            segment = this.head;
            ctx.fillRect(segment.x * d + pad, segment.y * d + pad, d - pad * 2, d - pad * 2, roundness);

            if (this.segments.length > 1) {
                // Draw segments
                if (!isRainbow) colour.push(175); // Alpha value
                for (let i = 1; i < this.segments.length; i++) {
                    if (isRainbow) {
                        colour[0] += deltaHue;
                        let rgb = hsl2rgb(...colour);
                        ctx.fillStyle = "rgb(" + rgb.join(", ") + ")";
                    } else {
                        ctx.fillStyle = "rgb(" + colour.join(", ") + ")";
                    }
                    segment = this.segments[i];
                    ctx.fillRect(segment.x * d + pad, segment.y * d + pad, d - pad * 2, d - pad * 2, roundness);
                }
            }
        }
    }

    onSegment(x, y) {
        for (const segment of this.segments) {
            if (segment.x == x && segment.y == y) return true;
        }
        return false;
    }

    die() {
        this.alive = false;
        this.grid.food = null;
        Sounds.play('die');
        Sounds.say("Game Over. Score: " + this.score);
    }
}

export const move = Object.seal({
    NONE: -1,
    UP: 0,
    DOWN: 1,
    LEFT: 2,
    RIGHT: 3,
});