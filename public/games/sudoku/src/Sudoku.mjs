import Digit from "./Digit.mjs";

export class Sudoku {
    #grid;
    #dim; // Dimensions in terms of number of boxes
    #over; // [i, j] of box to highlight

    constructor(dim) {
        if (dim < 2) throw new Error(`Invalid dimenion: ${dim}`);
        this.#dim = dim;
        // this.#grid = [[1, 2, 3, 9, 8, 7, 1, 3, 2], [4, 5, 6, 6, 5, 4, 4, 6, 5], [7, 8, 9, 3, 2, 1, 7, 9, 8]];
        this.newGrid();
        this.#over = [0, 0];
    }

    /** Get grid dimensions */
    get dim() {
        return this.#dim;
    }

    /** Set dimensions (note, resets the board) */
    set dim(dim) {
        if (dim !== this.#dim) {
            if (dim < 2) throw new Error(`Invalid dimenion: ${dim}`);
            this.#dim = dim;
            this.newGrid();
            this.#over = [0, 0];
        }
    }

    /** Get number at (i, j) position */
    get(i, j) {
        const dsq = this.#dim ** 2;
        if (i < 0 || j < 0 || i >= dsq || j >= dsq) throw new Error(`Position <${i},${j}> out of bounds for grid of dimenions ${this.#dim}`);
        return this.#grid[j][i];
    }

    /** Set this.over */
    setOver(i, j) {
        this.#over = [i, j];
    }

    /** Get (i, j) we are over */
    getOver() {
        return this.#over.slice();
    }

    /** Move this.over */
    moveOver(di, dj, constrain = true) {
        if (constrain) {
            const dsq = this.#dim ** 2;
            let i = this.#over[0] + di, j = this.#over[1] + dj;
            if (i >= 0 && i < dsq) this.#over[0] = i;
            if (j >= 0 && j < dsq) this.#over[1] = j;
        } else {
            this.#over[0] += di;
            this.#over[1] += dj;
        }
    }

    /** Generate new grid */
    newGrid() {
        const d = this.#dim, dsq = d ** 2;
        this.#grid = Array.from({ length: dsq }, () =>
            Array.from({ length: dsq }, () => new Digit(undefined, undefined))
        );
    }

    /** Clear grid -- set all to undefined */
    clearGrid(actual = false) {
        const d = this.#dim, dsq = d ** 2, prop = actual ? "actual" : "value";
        for (let j = 0; j < dsq; j++) {
            for (let i = 0; i < dsq; i++) {
                this.#grid[j][i][prop] = undefined;
            }
        }
    }

    /** Populate the grid brute-force */
    populateBruteForce() {
        const d = this.#dim, dsq = d ** 2;
        let done = false;
        while (!done) {
            done = true;
            let i = 0, j = 0;
            while (i < dsq && j < dsq) {
                const cell = this.get(i, j);
                const ns = this.getPossible(i, j, true); // Get possible options
                if (ns.length === 0) {
                    // Impossible; re-do
                    // console.error(`Impossible scenario at <${i},${j}> : no possible numbers (${ns})`);
                    done = false;
                    this.clearGrid(true);
                    break;
                }
                const n = ns[Math.floor(Math.random() * ns.length)];
                cell.actual = n;
                // Increment position
                i++;
                if (i >= dsq) { // Go to next row
                    i = 0;
                    j++;
                }
            }
        }
    }

    /** Reveal `n` digits */
    reveal(n) {
        const d = this.#dim, dsq = d ** 2, dqd = dsq ** 2;
        if (n >= dqd) n = dqd;
        while (n > 0) {
            const j = Math.floor(Math.random() * dsq);
            const i = Math.floor(Math.random() * dsq);
            const cell = this.get(i, j);
            if (cell.value === undefined) {
                cell.value = cell.actual;
                n--;
            }
        }
    }

    /** Set digit of cell (i,j) to `n` */
    addDigit(i, j, n, setActual = false) {
        const dsq = this.#dim ** 2;
        if (i < 0 || j < 0 || i >= dsq || j >= dsq) throw new Error(`Position <${i},${j}> out of bounds for grid of dimenions ${this.#dim}`);
        const digit = this.get(i, j);
        if (setActual) digit.actual = n;
        else digit.value = n;
        digit.clearPossible();
        // Remove possibility from row, col
        for (let k = 0; k < dsq; k++) {
            if (k === i) continue;
            const digit = this.get(k, j);
            digit.removePossible(n);
            if (digit.possibilities === 1) {
                this.addDigit(k, j, n, setActual);
            }
        }
        for (let k = 0; k < dsq; k++) {
            if (k === j) continue;
            const digit = this.get(i, k);
            digit.removePossible(n);
            if (digit.possibilities === 1) {
                this.addDigit(i, k, n, setActual);
            }
        }
    }

    /** Check if the jth row is complete */
    checkRow(j, checkActual = false) {
        const prop = checkActual ? "actual" : "value";
        const d = this.#dim, dsq = d ** 2;
        if (j < 0 || j >= dsq) throw new Error(`Position <i,${j}> out of bounds for grid of dimenions ${d}`);
        const map = new Map(Array.from({ length: dsq }, (_, i) => ([i + 1, false])));
        for (let i = 0; i < dsq; i++) {
            const digit = this.get(i, j);
            if (digit[prop] === undefined) return false;
            if (map.get(digit[prop])) return false;
            map.set(digit[prop], true);
        }
        return Array.from(map.values()).filter(e => e).length === dsq;
    }

    /** Check if the jth row has a duplicate value */
    #dupInRow(j, checkActual = false) {
        const prop = checkActual ? "actual" : "value";
        const d = this.#dim, dsq = d ** 2;
        if (j < 0 || j >= dsq) throw new Error(`Position <i,${j}> out of bounds for grid of dimenions ${d}`);
        const values = new Set();
        for (let i = 0; i < dsq; i++) {
            const digit = this.get(i, j);
            if (digit[prop] === undefined) continue;
            if (values.has(digit[prop])) return true;
            values.add(digit[prop]);
        }
        return false;
    }

    /** Check if the ith column is complete */
    checkCol(i, checkActual = false) {
        const prop = checkActual ? "actual" : "value";
        const d = this.#dim, dsq = d ** 2;
        if (i < 0 || i >= dsq) throw new Error(`Position <${i},j> out of bounds for grid of dimenions ${d}`);
        const map = new Map(Array.from({ length: dsq }, (_, j) => ([j + 1, false])));
        for (let j = 0; j < dsq; j++) {
            const digit = this.get(i, j);
            if (digit[prop] === undefined) return false;
            if (map.get(digit[prop])) return false;
            map.set(digit[prop], true);
        }
        return Array.from(map.values()).filter(e => e).length === dsq;
    }

    /** Check if the ith col has a duplicate value */
    #dupInCol(i, checkActual = false) {
        const prop = checkActual ? "actual" : "value";
        const d = this.#dim, dsq = d ** 2;
        if (i < 0 || i >= dsq) throw new Error(`Position <${i},j> out of bounds for grid of dimenions ${d}`);
        const values = new Set();
        for (let j = 0; j < dsq; j++) {
            const digit = this.get(i, j);
            if (digit[prop] === undefined) continue;
            if (values.has(digit[prop])) return true;
            values.add(digit[prop]);
        }
        return false;
    }

    /** Return the box that (i,j) is in */
    getBox(i, j) {
        i = Math.floor(i / 3) * 3;
        j = Math.floor(j / 3) * 3;
        const d = this.#dim, dsq = d ** 2;
        if (i < 0 || j < 0 || i >= dsq || j >= dsq) throw new Error(`Position <${i},${j}> out of bounds for grid of dimenions ${d}`);
        return Array.from({ length: d }, (_, dj) => Array.from({ length: d }, (_, di) => this.get(i + di, j + dj)));
    }

    /** Check if the (i,j) box */
    checkBox(i, j, checkActual = false) {
        const box = this.getBox(i, j);
        const prop = checkActual ? "actual" : "value";
        const map = new Map(Array.from({ length: this.#dim ** 2 }, (_, n) => ([n + 1, false])));
        for (const row of box) {
            for (const d of row) {
                if (d[prop] === undefined) return false;
                if (map.get(d[prop])) return false;
                map.set(d[prop], true);
            }
        }
        return Array.from(map.values()).filter(e => e).length === map.size;
    }

    /** Check if the (i,j) box has a duplicate */
    #dupInBox(i, j, checkActual = false) {
        const box = this.getBox(i, j);
        const prop = checkActual ? "actual" : "value";
        const values = new Set();
        for (const row of box) {
            for (const d of row) {
                if (d[prop] === undefined) continue;
                if (values.has(d[prop])) return true;
                values.add(d[prop]);
            }
        }
        return false;
    }

    /** Return array of all boxes */
    getBoxes() {
        const d = this.#dim, dsq = d ** 2, boxes = [];
        for (let j = 0; j < dsq; j++) {
            // Boxes full? Make x more empty ones
            if (j % d === 0) {
                for (let k = 0; k < d; k++) boxes.push([]);
            }

            // Add new row to each box
            for (let k = 0; k < d; k++) boxes[boxes.length - k - 1].push([]);

            for (let i = 0; i < dsq; i++) {
                const boxIdx = Math.floor(i / d);
                const box = boxes[boxes.length - d + boxIdx];
                box[box.length - 1].push(this.get(i, j));
            }
        }
        return boxes;
    }

    /** Return array os all possible choices for (i, j) */
    getPossible(i, j, checkActual = false) {
        const prop = checkActual ? "actual" : "prop";
        const d = this.#dim, dsq = d ** 2;
        if (i < 0 || j < 0 || i >= dsq || j >= dsq) throw new Error(`Position <${i},${j}> out of bounds for grid of dimenions ${d}`);
        let digit = this.get(i, j);
        if (digit[prop] !== undefined) return []; // Already got a value
        const possible = new Set(Array.from({ length: dsq }, (_, i) => i + 1));
        // Columns
        for (let i = 0; i < dsq; i++) {
            digit = this.get(i, j);
            if (digit[prop] !== undefined) possible.delete(digit[prop]);
        }
        // Rows
        for (let j = 0; j < dsq; j++) {
            digit = this.get(i, j);
            if (digit[prop] !== undefined) possible.delete(digit[prop]);
        }
        // Box
        let bi = Math.floor(i / d) * d, bj = Math.floor(j / d) * d;
        for (let dj = 0; dj < d; dj++) {
            for (let di = 0; di < d; di++) {
                digit = this.get(bi + di, bj + dj);
                if (digit[prop] !== undefined) possible.delete(digit[prop]);
            }
        }
        return Array.from(possible);
    }

    /** Check if the Sukoku is valid or not */
    isValid(checkActual = false) {
        const d = this.#dim, dsq = d ** 2;
        // Check columns
        for (let i = 0; i < dsq; i++) if (!this.checkCol(i, checkActual)) return false;
        // Check rows
        for (let j = 0; j < dsq; j++) if (!this.checkRow(j, checkActual)) return false;
        // Check boxes
        for (let j = 0; j < d; j++) {
            for (let i = 0; i < d; i++) {
                if (!this.checkBox(i * d, j * d, checkActual)) return false;
            }
        }

        return true;
    }

    /** Check if every cell has a valud */
    isComplete(checkActual = false) {
        const prop = checkActual ? "actual" : "value";
        const d = this.#dim, dsq = d ** 2;
        for (let j = 0; j < dsq; j++) {
            for (let i = 0; i < dsq; i++) {
                const d = this.get(i, j);
                if (d[prop] === undefined) return false;
            }
        }
        return true;
    }

    /**
     * Draw game - return an OffscreenCanvas
    */
    draw(dim, colors, state, debug = false) {
        const canvas = new OffscreenCanvas(dim, dim);
        const ctx = canvas.getContext("2d");
        const d = this.#dim, dsq = d ** 2, bl = Math.floor(dim / dsq), [oi, oj] = this.#over;
        // Draw squares and digits
        ctx.lineWidth = 1;
        for (let j = 0, y = 0; j < dsq; j++, y += bl) {
            for (let i = 0, x = 0; i < dsq; i++, x += bl) {
                const digit = this.get(i, j);
                let hu;
                // Draw square
                if (state === STATES.WON) {
                    hu = Math.floor(Math.random() * 360);
                    ctx.fillStyle = `hsl(${hu},50%,50%)`;
                } else if (state === STATES.PAUSED) {
                    ctx.fillStyle = colors.pausedBackgroundColor;
                } else {
                    if (i === oi && j === oj) ctx.fillStyle = colors.selectedColor;
                    else if (i === oi || j === oj) ctx.fillStyle = colors.selectedRowColColor;
                    else ctx.fillStyle = colors.backgroundColor;
                }
                ctx.strokeStyle = colors.borderColor;
                ctx.beginPath();
                ctx.rect(x, y, bl, bl);
                ctx.fill();
                ctx.stroke();
                // Draw digit
                ctx.textBaseline = "middle";
                ctx.textAlign = "center";
                ctx.font = colors.textFont;
                if (digit.value !== undefined) {
                    ctx.fillStyle = state === STATES.WON ? `hsl(${(hu + 180) % 360},100%,50%)` : colors.textColor;
                    ctx.fillText(digit.value.toString(), x + bl / 2, y + bl / 2);
                } else if (state === STATES.LOST) {
                    ctx.fillStyle = colors.correctTextColor;
                    ctx.fillText(digit.actual.toString(), x + bl / 2, y + bl / 2);
                }
                // Draw actual digit
                if (debug) {
                    ctx.textBaseline = "bottom";
                    ctx.textAlign = "right";
                    ctx.fillStyle = colors.correctTextColor;
                    ctx.font = "14px Arial";
                    ctx.fillText((digit.actual ?? '?').toString(), x + bl - 4, y + bl);
                }
                // Draw possibilities
                if (digit.possibilities > 0) {
                    ctx.fillStyle = colors.smallTextColor;
                    ctx.textBaseline = "top";
                    ctx.textAlign = "left";
                    ctx.font = colors.smallTextFont;
                    const info = ctx.measureText("8"), tw = Math.ceil(info.width);
                    const p = digit.getPossible(),
                        gapx = tw * 0.5, gapy = tw * 1.5, lim = Math.floor(bl / (tw + gapx));
                    let px = x + gapx, py = y + gapx;
                    for (let k = 0; k < p.length; k++, px += tw + gapx) {
                        if (k > 0 && k % lim === 0) {
                            px = x + gapx;
                            py += gapy;
                        }
                        ctx.fillText(p[k].toString(), px, py);
                    }
                }
            }
        }
        // Draw thick lines
        if (state !== STATES.WON) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = colors.borderColor;
            for (let j = 0, y = 0; j < dsq; j++, y += bl) {
                for (let i = 0, x = 0; i < dsq; i++, x += bl) {
                    if (i > 0 && i % d === 0) {
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, dim);
                        ctx.stroke();
                    }
                    if (j > 0 && j % d === 0) {
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(dim, y);
                        ctx.stroke();
                    }
                }
            }
        }
        return canvas;
    }
}

/** Sukoku states */
export const STATES = Object.freeze({
    IN_PROGRESS: 0,
    PAUSED: 1,
    WON: 2,
    LOST: 3,
});