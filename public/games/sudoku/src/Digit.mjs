export class Digit {
    value;
    #possible; // Array of "possible" values -- note, may be incorrect
    actual; // Actual value

    constructor(value, actual, maxPossible = undefined) {
        this.value = value;
        this.actual = actual;
        this.#possible = maxPossible == undefined ? [] : Array.from({ length: maxPossible }, (_, i) => i + 1);
    }


    /** Get number of possible digits this could be */
    get possibilities() {
        return this.#possible.length;
    }

    /** Get list of possibilities */
    getPossible() {
        return this.#possible.slice();
    }

    /** CLear possibility list */
    clearPossible() {
        this.#possible.length = 0;
    }

    /** Could this digit possibly be this number? */
    couldBe(n) {
        return this.#possible.includes(n);
    }

    /** Add a new possibility */
    addPossible(n) {
        if (this.#possible.includes(n)) return false;
        for (let i = 0; i < this.#possible.length; i++) {
            if (this.#possible[i] > n) {
                this.#possible.splice(i, 0, n);
                return true;
            }
        }
        this.#possible.push(n);
        return true;
    }

    /** Remove a possibility */
    removePossible(n) {
        const i = this.#possible.indexOf(n);
        if (i !== -1) this.#possible.splice(i, 1);
    }

    toString() {
        return this.value === undefined ? "?" : this.value.toString();
    }
}

export default Digit;