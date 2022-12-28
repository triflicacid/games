class Game {
    /**
     * Create a new game
     * @param {number} players Number of players
     * @param {number} max Maximum number of chopsticks on any one hand
     */
    constructor(players, playerNames = undefined, max = 5) {
        this._players = players;
        this._max = max; // Maximum score at a given index
        this._hands = Array.from({ length: players }, () => ([1, 1])); // Array of hands. Set [0] = -1 to indicate that they're out
        this._names = playerNames ? playerNames : Array.from({ length: players }, (_, i) => String.fromCharCode(65 + i));
        this._go = 0; // Who's go is it? (active hand)
        this._dir = 1; // Hand rotation direction, +-1
    }

    /** Get number of players */
    get players() {
        return this._hands.length;
    }

    /** Get current go rotation direction */
    getDirection() {
        return this._dir;
    }

    /** Toggle go rotation direction */
    toggleDirection() {
        return (this._dir = -this._dir);
    }

    /** Get the name from player ID */
    getPlayerName(id) {
        return this._names[id];
    }

    /** Get whose go it is */
    getGo() {
        return this._go;
    }

    /** Return the hand of the current player */
    getCurrentHand() {
        return this._hands[this._go];
    }

    /** Get next person's ID */
    _nextGo(dir = undefined) {
        return (this._go + (dir ?? this._dir)) % this._hands.length;
    }

    /** Get suitable next player's ID. Return -1 if no suitable player found. */
    _nextSuitableGo(dir = undefined) {
        let i = 0, go = this._go;
        while (true) {
            go = (go + (dir ?? this._dir)) % this._hands.length;
            i++;
            if (this._hands[go].filter(x => x !== -1).length > 0) return go;
            if (i === this._hands.length) return -1;
        }
    }

    /** Check if there is a winner - only one player left. Return either the WINNERS IF or -1 */
    getWinner() {
        let left = this._hands.filter(hand => hand.filter(c => c !== -1).length > 0);
        return left.length === 1 ? this._hands.findIndex(hand => hand.filter(c => c !== -1).length > 0) : -1;
    }

    /** Display game. Note, that once setup this need not be caled again. */
    display(container, onupdate) {
        /** Report error */
        const error = msg => onupdate({ type: "error", msg });

        /** Create and return chopstick hand */
        const createHand = (handID, scores, isBig = false) => {
            const divHand = document.createElement("div");
            divHand.classList.add("div-hand");
            const total = scores.filter(c => c > -1).reduce((a, b) => a + b, 0);
            divHand.insertAdjacentHTML("beforeend", `<span><strong>${this._names[handID]}</strong> - ${total}</span><br>`);
            for (let j = 0; j < scores.length; j++) {
                const isDead = scores[j] === -1;
                const div = document.createElement("div");
                if (!isDead) div.dataset.score = scores[j];
                if (isDead) div.classList.add("dead");
                div.addEventListener("click", () => onClickHand(handID, j, div));
                if (!isDead) for (let k = 0; k < scores[j]; k++) {
                    const span = document.createElement("span");
                    span.classList.add("chopstick");
                    if (isBig) span.classList.add("big");
                    div.appendChild(span);
                }
                divHand.appendChild(div);
            }
            return divHand;
        };

        /** Display non-current hands */
        const updateNonCurrent = () => {
            divNonCurrent.innerHTML = "";
            if (this._dir === -1) {
                for (let i = 0; i < this._hands.length; i++) {
                    if (i === this._go) continue;
                    const divHand = createHand(i, this._hands[i]);
                    if (i === next) divHand.classList.add("selected");
                    divNonCurrent.appendChild(divHand);
                }
            } else {
                for (let i = this._hands.length - 1; i >= 0; i--) {
                    if (i === this._go) continue;
                    const divHand = createHand(i, this._hands[i]);
                    if (i === next) divHand.classList.add("selected");
                    divNonCurrent.appendChild(divHand);
                }
            }
        };

        /** Update whose go it is */
        const updateWhoseGo = () => {
            spanWhoseGo.innerText = this._names[this._go].toString();
            spanNextGo.innerText = this._names[next].toString();
        };

        /** Display current hand */
        const updateCurrent = () => {
            divCurrent.innerHTML = "";
            const div = createHand(this._go, this._hands[this._go], true);
            div.classList.add("selected", "big");
            if (winner > -1) div.classList.add("winner");
            divCurrent.appendChild(div);
        };

        /** Handle "Done." button click */
        const clickDoneGo = () => {
            let go = this._nextSuitableGo();
            if (go === -1) {
                error("No suitable player found");
            } else if (go === this._go) {
                onupdate({ type: "winner", go, name: this._names[go] });
                gameover(go);
            } else {
                this._go = go;
                next = this._nextSuitableGo();
                onupdate({ type: "go", go, name: this._names[go] });
    
                // Is this player viable?
                if (this._hands[this._go].filter(c => c !== -1).length === 0) {
                    clickDoneGo();
                    return;
                }
    
                updateNonCurrent();
                updateCurrent();
                updateWhoseGo();
    
                btnNext.disabled = true;
                doneMainGo = false;
                transferCount = 0;
            }
        };

        /** Handle chopstick hand click */
        const onClickHand = (handID, idx, el) => {
            if (winner > -1) return;
            if (this._hands[handID][idx] > this._max) return error("Cannot selected a dead hand");
            if (selected === null) {
                if (handID === this._go) {
                    if (this._hands[handID][idx] === 0) {
                        error("Cannot select empty hand");
                    } else {
                        selected = [handID, idx];
                        selectedEl = el;
                        el.classList.add("selected");
                    }
                } else {
                    error("Must select in your own hand");
                }
            } else {
                if (handID === this._go) {
                    // Transferring chopsticks between hands
                    if (this._hands[selected[0]][selected[1]] === 0) {
                        error("No chopsticks to transfer");
                    } else if (transferCount < 1) {
                        let mov = this._hands[selected[0]][selected[1]] / 2;
                        mov = mov <= 1 ? 1 : Math.floor(mov);
                        let score = this._hands[handID][idx] + mov;
                        if (score > this._max) {
                            error("Cannot transfer chopsticks as the resulting hand would have too many");
                        } else {
                            this._hands[handID][idx] = score;
                            this._hands[selected[0]][selected[1]] -= mov;
                            updateCurrent();
                            transferCount++;
                            onupdate({ type: "transfer", hand: this._go, amount: mov });
                            undisableBtnNext();
                        }
                    } else {
                        error("Cannot transfer chopsticks more than once");
                    }
                } else {
                    if (doneMainGo) {
                        error("Already transferred chopsticks to another player");
                    } else if (handID === next) {
                        if (this._hands[handID][idx] === -1) {
                            error("Cannot transfer chopsticks to dead hand");
                        } else {
                            let mov = this._hands[selected[0]][selected[1]];
                            this._hands[handID][idx] += mov;
                            this._hands[selected[0]][selected[1]] -= mov;
                            onupdate({ type: "transfer", to: handID, from: this._go, amount: mov });
                            if (this._hands[handID][idx] > this._max) {
                                this._hands[handID][idx] = -1; // Mark as dead
                                onupdate({ type: "dead", hand: handID, idx });
                            }
                            updateCurrent();
                            updateNonCurrent();
                            doneMainGo = true;
                            undisableBtnNext();
                        }
                    } else {
                        error("Cannot transfer chopsticks to this player");
                    }
                }

                // De-select
                selectedEl.classList.remove("selected");
                selected = null;
            }
        };

        /** Are the conditions met to un-disable btnNext? */
        const undisableBtnNext = () => {
            if (doneMainGo && (transferCount > 0 || this._hands[this._go].filter(c => c >= 0).reduce((a, b) => a + b) < 2)) btnNext.disabled = false;
        };

        /** Gameover! Supply winning player ID */
        const gameover = wid => {
            winner = wid;
            divWhoseGo.innerHTML = `<span>&#127942; ${this.getPlayerName(wid)} is the Winner! &#127942;</span>`;
            updateCurrent();
        };

        // ACTIVE
        const div = document.createElement("div");
        div.classList.add("div-game");
        container.appendChild(div);

        // Container for non-current games
        const divNonCurrent = document.createElement("div");
        divNonCurrent.classList.add("div-hands", "div-nonCurrent");
        div.appendChild(divNonCurrent);

        // Whose go is it? title
        const divWhoseGo = document.createElement("div");
        divWhoseGo.classList.add("div-whoseGo");
        let span = document.createElement("span");
        divWhoseGo.appendChild(span);
        const spanWhoseGo = document.createElement("span");
        span.appendChild(spanWhoseGo);
        span.insertAdjacentHTML("beforeend", "<span>'s Go</span>");
        divWhoseGo.insertAdjacentHTML("beforeend", "<br>");
        span = document.createElement("span");
        divWhoseGo.appendChild(span);
        span.insertAdjacentHTML("beforeend", "<span>Next: </span>");
        const spanNextGo = document.createElement("span");
        span.appendChild(spanNextGo);
        divWhoseGo.insertAdjacentHTML("beforeend", "<br>");
        const btnNext = document.createElement("button");
        btnNext.innerText = "Done";
        btnNext.addEventListener("click", clickDoneGo);
        btnNext.disabled = true;
        divWhoseGo.appendChild(btnNext);
        div.appendChild(divWhoseGo);

        // Container for the current game
        const divCurrent = document.createElement("div");
        divCurrent.classList.add("div-hands", "div-current");
        div.appendChild(divCurrent);

        let doneMainGo = false; // Has the current user performed he bulk of their go - gioving chopsticks to other players
        let transferCount = 0; // The current user can trasfer chopsticks between their hands; how many times have they done this?
        let selected = null, selectedEl = null; // Selected chopstick hand format: [handID, idx]
        let next = this._nextSuitableGo();
        let winner = -1;

        updateNonCurrent();
        updateCurrent();
        updateWhoseGo();
    }
}