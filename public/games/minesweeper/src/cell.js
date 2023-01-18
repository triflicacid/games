export class Cell {
    constructor() {
        this.isMine = false;
        this.mineExploded = false;
        this.hasFlag = false;
        this.revealed = false;
        this.neighborCount = -1;
    }

    /** Get appropriate sprite image */
    getImage() {
        if (this.revealed) {
            if (this.isMine) {
                return this.mineExploded ? Cell.img.explodedMine : Cell.img.mine;
            } else {
                return Cell.img.squareCount[this.neighborCount];
            }
        } else {
            return this.hasFlag ? Cell.img.flaggedSquare : Cell.img.hiddenSquare ; 
        }
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