import { COUNTRIES } from "../../../public/games/MAD/src/constants.js";
import UserSocket from "../../lib/UserSocket.js";
import { Game } from "./Game.js";
import { ID as GAME_ID } from "./extern.js";

export class Connection extends UserSocket {
    constructor(socket) {
        super(socket);
        this.idx = -1; // Index of Socket in game.players
        this.game = undefined; // The current Game object

        // ?DEBUG
        if (true) {
            setTimeout(async () => {
                this.idx = 0;
                this.game = Game.all.get("e89aa0e8-4d20-46eb-8dfe-11894654334b");
                if (!this.game.data) {
                    await this.game.fetchData();
                }
                this.game.players[this.idx] = this.id;
                this._setupGameEvents();
                this.emit("game-data", this.getGameData());
            }, 200);
            socket.on("exec", (code) => {
                eval(code);
            });
        }
    }

    /** Get 'me' in the game */
    get me() {
        return this.idx === 0 ? this.game.data.player1 : this.game.data.player2;
    }

    async _onRedeemedToken(token, data) {
        await super._onRedeemedToken(token, data);
        this.game = Game.all.get(data.gameID);
        // Have we loaded the game data?
        if (!this.game.data) {
            await this.game.fetchData();
        }
        this.idx = data.idx;
        this.game.players[this.idx] = this.id;
        this._setupGameEvents();
        this.emit("game-data", this.getGameData());
    }

    leave(playerIndex, kicked = false) {
        if (this.game && this.game.players[playerIndex]) {
            const socket = UserSocket.all.get(this.game.players[playerIndex]);
            this.game.leave(playerIndex);
            const token = UserSocket.auth.create({ UID: socket.user.ID, game: GAME_ID });
            socket.emit("redirect", "../join.html?" + token + (kicked ? '&kicked' : ''));
            // If we are the owner, kick everyone else
            if (socket.user.ID === this.game.owner) {
                this.game.players.forEach((id, i) => i !== playerIndex && this.leave(i, true));
            }
            socket.disconnect();
        }
    }

    _setupGameEvents() {
        // Request to leave the game
        this.sock.on("leave", () => {
            this.leave(this.idx);
        });
        //#region Allies
        // Calculate cost to acquire an ally
        this.sock.on("calc-ally-cost", (ally) => {
            if (ally in COUNTRIES) {
                this.sock.emit("calc-ally-cost", { code: ally, amount: this.game.calculateAllyCost(this.me.region, ally) });
            }
        });
        // Form an ally
        this.sock.on("form-ally", (ally) => {
            const res = this.game.formAlly(this.me.region, ally);
            if (res === 0) { // Yay!
                // Update money count/incomeW
                this.sock.emit("update-money", this.me.money);
                this.sock.emit("update-income", this.me.income);
                // Notify all clients of the new bond
                this.game.emitAll("update-country-overlord", { code: ally, overlord: this.me.region });
                this.emit("form-ally", ally);
            } else if (res === 2) { // Not enough money
                const cost = this.game.calculateAllyCost(this.me.region, ally), money = this.me.money;
                this.sock.emit("popup", {
                    title: "Ally Request Denied",
                    message: `Insufficient funds: needed $${cost.toLocaleString("en-GB")}, only got $${money.toLocaleString("en-GB")}.`,
                });
            } else { // Idk man
                this.sock.emit("popup", {
                    title: "Ally Request Denied",
                    message: `This nation is not considering requests at this time.`,
                });
            }
        });
        // Sever an ally
        this.sock.on("sever-ally", (ally) => {
            const res = this.game.severAlly(this.me.region, ally);
            if (res === 0) {
                // Update income
                this.sock.emit("update-income", this.me.income);
                // Notify all clients of the new bond
                this.game.emitAll("update-country-overlord", { code: ally, overlord: undefined });
                this.sock.emit("sever-ally", ally);
            } else {
                this.sock.emit("popup", {
                    title: "Cannot Sever Ally",
                    message: `Unable to sever ally.`,
                });
            }
        });
        //#endregion
        //#region Silos
        // Calculate cost to build a silo
        this.sock.on("calc-silo-cost", (country) => {
            if (country in COUNTRIES) {
                this.sock.emit("calc-silo-cost", { country, amount: this.game.calculateSiloCost(this.me.region, country) });
            }
        });
        this.sock.on("build-silo", ({ code, x, y }) => {
            if (code in COUNTRIES) {
                const cost = this.game.calculateSiloCost(this.me.region, code);
                const res = this.game.canBuildSilo(this.idx, code);
                if (res === 0) {
                    const event = this.game.createBuildSiloEvent(this.idx, code, x, y);
                    this.me.money -= cost;
                    this.emit("create-event", event);
                    this.emit("update-money", this.me.money);
                    this.game.emitAll("build-silo", { country: code, x, y });
                } else if (res === 1) { // No authorisation
                    this.sock.emit("popup", {
                        title: "Cannot Build Silo",
                        message: `You have no building permissions in ${COUNTRIES[code].name}`,
                    });
                } else if (res === 2) { // Insufficient funds
                    this.sock.emit("popup", {
                        title: "Cannot Build Silo",
                        message: `Insufficient funds: you need $${cost.toLocaleString("en-GB")}, you have $${this.me.money.toLocaleString("en-GB")}.`,
                    });
                }
            }
        });
        //#endregion
    }

    disconnect() {
        if (this.game) this.game.players[this.idx] = null;
        super.disconnect();
    }

    /** Return object to send on "game-data" */
    getGameData() {
        // Send initial data
        const preparePlayer = (obj) => {
            return {
                region: obj.region,
            };
        };
        const player1 = this.idx === 0 ? this.game.data.player1 : preparePlayer(this.game.data.player1);
        const player2 = this.idx === 1 ? this.game.data.player2 : preparePlayer(this.game.data.player2);
        return {
            id: this.game.id,
            name: this.game.name,
            username: this.user.Username,
            countries: this.game.data.countries,
            isP1: this.idx === 0,
            player1,
            player2,
            events: this.game.data.events.filter(({ player }) => player === this.idx),
        };
    }
}

export default Connection;