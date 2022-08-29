export class Cell {
    constructor(game, col, row, dimensions) {
        this.game = game;
        this.col = col;
        this.row = row;
        this.w = dimensions;

        this.x = this.col * this.w;
        this.y = this.row * this.w;

        this.isMine = false;
        this.mineExploded = false; // Has this mine exploded?
        this.hasFlag = false;
        this.revealed = false;

        this.neighborCount = -1;
    }

    _drawImage(ctx, oc) {
        ctx.drawImage(oc, this.x, this.y, this.w, this.w);
    }

    show(ctx) {
        ctx.strokeStyle = "#818181";
        ctx.fillStyle = "#b6b6b6";
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.w);
        ctx.fill();
        ctx.stroke();

        if (this.revealed) {
            if (this.isMine) {
                if (this.mineExploded) {
                    this._drawImage(ctx, Cell.img.explodedMine);
                } else {
                    this._drawImage(ctx, Cell.img.mine);
                }
            } else {
                this._drawImage(ctx, Cell.img.squareCount[this.neighborCount]);
            }
        } else if (this.hasFlag) {
            // If has a flag and is not revealed
            this._drawImage(ctx, Cell.img.flaggedSquare);
        } else {
            this._drawImage(ctx, Cell.img.hiddenSquare);
        }
    }

    reveal() {
        this.revealed = true;

        if (this.neighborCount === 0 && !this.isMine && !this.hasFlag) {
            // Reveal all neighbors without a mine
            this.floodFill();
        }
    }

    checkNeighbors() {
        if (this.isMine) return;

        let total = 0;
        for (let xoff = -1; xoff <= 1; xoff++) {
            for (let yoff = -1; yoff <= 1; yoff++) {
                let i = this.col + xoff;
                let j = this.row + yoff;

                // Only check position is it is inside the grid
                if (i > -1 && i < this.game.cols && j > -1 && j < this.game.rows) {
                    if (this.game.grid[i][j].isMine) total++;
                }
            }
        }

        this.neighborCount = total;
    }

    floodFill() {
        for (let xoff = -1; xoff <= 1; xoff++) {
            for (let yoff = -1; yoff <= 1; yoff++) {
                let i = this.col + xoff;
                let j = this.row + yoff;

                // If grid is not mine, reveal it
                if (i > -1 && i < this.game.cols && j > -1 && j < this.game.rows) {
                    if (!this.game.grid[i][j].isMine && !this.game.grid[i][j].revealed) this.game.grid[i][j].reveal();
                }
            }
        }
    }
}

Cell.COLOURS = [null,
    [23, 16, 232], // Blue
    [18, 108, 12], // Green
    [205, 40, 50], // Red
    [34, 19, 128], // Purple
    [0, 0, 0], // Black
    [128, 10, 12], // Maroon
    [115, 120, 110], // Gray
    [0, 206, 209], // Turqoise
];