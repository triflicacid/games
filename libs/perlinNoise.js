/** Create a random unit vector */
function vecRandomUnit() {
    const theta = Math.random() * 2 * Math.PI;
    return {
        x: Math.cos(theta),
        y: Math.sin(theta),
    };
}

/** Linear interpolation */
function lint(x, a, b) {
    return a + smoothstep(x) * (b - a);
}

function smoothstep(x) {
    return 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
}

/** Return function (x, y) which returns a value on the noise grid at [x, y] betwen -1 and 1
 * 
 * Note that this function will return 0 for every integer co-ordinate
*/
export function perlinNoise() {
    const grid = {}, memory = {};

    /** Dot product and grid distance, in one */
    function dotProductGrid(x, y, vx, vy) {
        let gVect, dVect = { x: x - vx, y: y - vy };
        if (grid[vx + "," + vy]) {
            gVect = grid[vx + "," + vy];
        } else {
            gVect = vecRandomUnit();
            grid[vx + "," + vy] = gVect;
        }
        return dVect.x * gVect.x + dVect.y * gVect.y;
    }

    /** Get noise value at (x, y) co-ordinates */
    function get(x, y) {
        // Cached?
        if (memory[x + "," + y]) return memory[x + "," + y];

        // Get integer cell co-ordinates
        const xf = Math.floor(x), yf = Math.floor(y);

        // Interpolate
        const tl = dotProductGrid(x, y, xf,   yf);
        const tr = dotProductGrid(x, y, xf+1, yf);
        const bl = dotProductGrid(x, y, xf,   yf+1);
        const br = dotProductGrid(x, y, xf+1, yf+1);
        const xt = lint(x-xf, tl, tr);
        const xb = lint(x-xf, bl, br);
        const v = lint(y-yf, xt, xb);
        // console.log(xf, yf, tl, tr, bl, br, xt, xb, v)

        // Save & return
        return memory[x + "," + y] = v;
    }

    return get;
}