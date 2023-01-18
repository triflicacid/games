import { Cell } from "./Cell.js";
import { Font } from "/libs/Font.js";

export class Game {
    constructor(rows, cols) {
        this.rows = rows;  // Number of rows
        this.cols = cols;  // Number of columns
        this.cw = 40;  // Width (px) of each cell
        this.minePercentage = 0.2;
        this.grid = [];  // number[y][x] of cells
        this.newGrid();
        this.gameover = false;
        this._flagged = -1; // Cached value, for gameover scrceen
    }

    /** Get number of cells in grid */
    get size() {
        return this.rows * this.cols;
    }

    /** Get number of mine left in the grid */
    countMines() {
        return this.grid.reduce((a, b) => a + b.reduce((a, b) => a + (b.isMine ? 1 : 0), 0), 0);
    }

    /** Get number of flagged mines */
    countFlaggedMines() {
        return this.grid.reduce((a, b) => a + b.reduce((a, b) => a + (b.isMine && b.hasFlag ? 1 : 0), 0), 0);
    }

    /** Get maximum number of mines */
    getMaxMines() {
        return Math.floor(this.size * this.minePercentage);
    }

    /** Generate a new grid */
    newGrid() {
        this.gameover = false;
        this._flagged = -1;
        // Generate grid
        this.grid = Array.from({ length: this.cols }, () => Array.from({ length: this.rows }, () => new Cell()));

        // Place mines
        for (let n = this.getMaxMines(); n > 0; ) {
            const x = Math.floor(Math.random() * this.rows);
            const y = Math.floor(Math.random() * this.cols);
            const cell = this.grid[y][x];
            if (!cell.isMine) {
                cell.isMine = true;
                n--;
            }
        }

        // Cache: calculate neighbors of each square
        for (let y = 0; y < this.cols; y++) {
            for (let x = 0; x < this.rows; x++) {
                let total = 0;  // Total number of mines surrounding current position
                for (let dy = -1; dy <= 1; dy++) {
                    if (this.grid[y + dy]) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dy === 0 && dx === 0) continue; // Skip self
                            const cell = this.grid[y + dy][x + dx];
                            if (cell && cell.isMine) total++;
                        }
                    }
                }
                this.grid[y][x].neighborCount = total;
            }
        }
    }

    /** End the current game -- "gameover" mode */
    endGame() {
        this.gameover = true;
        this._flagged = this.countFlaggedMines(); // Cache value
        // Reveal all cells
        this.grid.forEach(xs => xs.forEach(x => x.revealed = true));
    }

    /** Draw game. Return OffscreenCanvas. */
    draw() {
        const w = this.cw,
            oc = new OffscreenCanvas(w * this.rows, w * this.cols),
            ctx = oc.getContext("2d");
        for (let j = 0; j < this.cols; j++) {
            for (let i = 0; i < this.rows; i++) {
                const y = j * w, x = i * w;
                const cell = this.grid[j][i];

                // Cell outline
                ctx.strokeStyle = "#818181";
                ctx.fillStyle = "#b6b6b6";
                ctx.beginPath();
                ctx.rect(x, y, w, w);
                ctx.fill();
                ctx.stroke();

                // Draw sprite
                const img = cell.getImage();
                ctx.drawImage(img, x, y, w, w);
            }
        }
        // Gameover overlay
        if (this.gameover) {
            // Opaque overlay
            ctx.fillStyle = "#808080d6";
            ctx.fillRect(0, 0, oc.width, oc.height);
            // "Game Over" text
            let x = (oc.width - Cell.img.gameover.width) / 2;
            let y = (oc.height - Cell.img.gameover.height) / 3;
            ctx.drawImage(Cell.img.gameover, x, y);
            // "Mines" text
            ctx.fillStyle = "#ffff00";
            let oldFont = ctx.font;
            const font = new Font().set("size", 17).set("family", "Arial");
            ctx.font = font.toString();
            const max = this.getMaxMines();
            let text = `Flagged ${this._flagged}/${max} mine${this._flagged === 1 ? '' : 's'}`;
            let metric = ctx.measureText(text);
            x = (oc.width - metric.width) / 2;
            y += (Cell.img.gameover.height + (metric.actualBoundingBoxAscent + metric.actualBoundingBoxDescent)) * 1.5;
            ctx.fillText(text, x, y);
            // "Click anywhere to start" text
            font.size *= 0.7;
            ctx.font = font.toString();
            text = `Click anywhere to restart`;
            metric = ctx.measureText(text);
            x = (oc.width - metric.width) / 2;
            y += (metric.actualBoundingBoxAscent + metric.actualBoundingBoxDescent) * 2.5;
            ctx.fillText(text, x, y);
            ctx.font = oldFont;
        }
        return oc;
    }

    /** Return (i,j) indices from (x,y) coordinates */
    getIndices(x, y) {
        return [
            Math.floor(x / this.cw),
            Math.floor(y / this.cw),
        ];
    }

    /** Floodfill empty cells from the given position */
    floodFill(i, j, count = 0) {
        if (!this.grid[j] || !this.grid[j][i]) return count;
        const cell = this.grid[j][i];
        if (cell.revealed || cell.hasFlag || cell.isMine) return count;
        cell.revealed = true;
        count++;
        if (cell.neighborCount > 0) return count;
        for (let [di, dj] of [[-1, 0], [1, 0], [0, -1], [0, 1]])
            count = this.floodFill(i + di, j + dj, count);
        return count;
    }
}