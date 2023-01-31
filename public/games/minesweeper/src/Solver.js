/**!
 * !IMPORTANT! This is not complete
 */


export class Solver {
    constructor(game) {
        this.game = game;
        this.field = game.grid;
        this.calcs = this.field.map((r, j) => r.map((c, i) => ({
            scanned: false,  // Has this cell been scanned?
            state: 0,    // -1 -> mine; 0 -> unknown; 1 -> clear
            maybe: [],       // Array of co-ordinates of surrounding cells which may be mines
        })));
        for (let j = 0; j < this.game.cols; j++) {
            for (let i = 0; i < this.game.rows; i++) {
                const calc = this.cals[j][i];
                for (let dj = -1; dj <= 1; dj++) {
                    for (let di = -1; di <= 1; di++) {
                        if (di === 0 && dj === 0) continue;
                        if (this.field[j + dj] && this.field[j + dj][i + di]) calc.covers.push([j + dj, i + di]);
                    }
                }
            }
        }
        this.steps = 0;
        this.state = Solver.state.ready;
    }

    /** Check if two (i, j) positions cover eachother */
    checkCover(i1, j1, i2, j2) {
        return Math.abs(i2 - i1) <= 1 && Math.abs(j2 - j1) <= 1;
    }

    /** Return (i, j) of cell with least likelihood (least maybes) */
    getBest() {
        let mini = 0, minj = 0, min = this.calcs[minj][mini].maybe.length;
        for (let j = 0; j < this.game.cols; j++) {
            for (let i = 0; i < this.game.rows; i++) {
                if (this.calcs[j][i].maybe.length < min) {
                    min = this.calcs[minj = j][mini = i].maybe.length;
                }
            }
        }
        return [mini, minj];
    }

    iterate() {
        if (this.state === Solver.state.ready || this.state === Solver.state.inProgress) {
            // Get position to reveal...
            let j, i;
            if (this.state === Solver.state.ready) {
                this.state = Solver.state.inProgress;
                // Start; pick one at random
                j = Math.floor(Math.random() * this.game.cols);
                i = Math.floor(Math.random() * this.game.rows);
            } else {
                [i, j] = this.getBest();
            }
            // Get cell selected
            const cell = this.field[j][i];
            cell.revealed = true;
            this.steps++;
            // If it's a mine... :(
            if (cell.isMine) {
                cell.mineExploded = true;
                this.state = Solver.state.exploded;
            } else {
                const calc = this.calcs[j][i];
                calc.state = 1;
                this.game.floodFill(i, j);
                // Add covers
                for (let j = 0; j < this.game.cols; j++) {
                    for (let i = 0; i < this.game.rows; i++) {
                        const calc = this.calcs[j][i], cell = this.field[j][i];
                        if (cell.revealed && !calc.scanned) {
                            calc.scanned = true;
                            if (cell.neighborCount > 0) {
                                for (let dj = -1; dj <= 1; dj++) {
                                    for (let di = -1; di <= 1; di++) {
                                        if (di === 0 && dj === 0) continue;
                                        if (this.calcs[j + dj] && this.calcs[j + dj][i + di]) {
                                            const dCalc = this.calcs[j + dj][i + di];
                                            // Remove possibility of cell we just revealed of being a mine
                                            const idx = dCalc.maybe.findIndex(([mi, mj]) => mi === i && mj === j);
                                            dCalc.maybe.splice(idx, 1);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                // Eliminate join covers
                const stack = [];
                for (let j = 0; j < this.game.cols; j++) {
                    for (let i = 0; i < this.game.rows; i++) {

                    }
                }
            }
        }
    }

    checkCell(i, j, stack = undefined) {
        const calc = this.calcs[j][i], cell = this.field[j][i];
        // If we are a mine...
        if (cell.revealed && cell.neighborCount === calc.maybe.length) {
            calc.maybe.forEach(([mi, mj]) => {
                const mcalc = this.calcs[mj][mi];
                mcalc.state = -1;
                stack.push([mi, mj]); // Check this next
            });
        }
    }
}

Solver.state = Object.freeze({
    ready: 0,
    inProgress: 1,
    completed: 2,
    exploded: 4,
});