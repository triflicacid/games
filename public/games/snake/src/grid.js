import { Snake } from "./snake.js";
import { hsl2rgb } from "/libs/util.js";

export class Grid {
    constructor(width, height, cellDimensions) {
        this.width = width;
        this.height = height;

        this.cellDimensions = cellDimensions;
        this.size = Math.min(this.width, this.height);
        this.dimensions = Math.floor(this.size / this.cellDimensions);

        this.snake = null;
        this.food = null;
    }

    render(ctx) {
        ctx.strokeStyle = "#97979764";
        ctx.lineWidth = 1;

        for (let i = 0; i < this.dimensions; i++) {
            const p = i * this.cellDimensions;

            ctx.beginPath();
            ctx.moveTo(p, 0);
            ctx.lineTo(p, this.height);
            ctx.moveTo(0, p);
            ctx.lineTo(this.width, p);
            ctx.stroke();
        }

        if (this.food) {
            ctx.fillStyle = "#ff0000";
            const d = (this.cellDimensions / 3);
            ctx.beginPath();
            ctx.arc(this.food.x * this.cellDimensions + this.cellDimensions / 2, this.food.y * this.cellDimensions + this.cellDimensions / 2, d, 0, 2 * Math.PI);
            ctx.fill();
        }

        if (this.snake) {
            this.snake.render(ctx);
        }
    }

    createSnake() {
        this.snake = new Snake(this);
        this.snake.new();
    }

    placeFood() {
        this.food = null;
        let pos = {
            x: NaN,
            y: NaN
        };

        do {
            pos.x = Math.floor(Math.random() * this.dimensions);
            pos.y = Math.floor(Math.random() * this.dimensions);
        } while (this.snake && this.snake.onSegment(pos.x, pos.y));

        this.food = pos;
    }

    snakeOnFood() {
        if (this.snake.alive && this.food) {
            return (this.food.x == this.snake.head.x && this.food.y == this.snake.head.y);
        } else {
            return false;
        }
    }
}