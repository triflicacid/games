import BaseGame from "../Game.js";
import { readFile } from "fs";
import { COUNTRIES, RU_CITIES, US_CITIES, EVENT } from "../../../public/games/MAD/src/constants.js";
import { ALLY_INCOME_MUL, ALLY_COST_MUL, BASE_INCOME, START_MONEY, BUILD_SILO_COST, BUILD_SILO_TIME } from "./constants.js";
import { ID as GAME_ID } from "./extern.js";
import { v4 as uuidv4 } from "uuid";

/** == GAME EVENTS ==
 *
 * Stored in <#Game>.data.events of type { id: string; player: number; type: number; created: number; data: object; }[]
 */

const DIRECTORY = "data/MAD/";
export class Game extends BaseGame {
    constructor(dbEntry, gameData = undefined) {
        super(GAME_ID, 2);
        this.locked = false; // Unlock the game **important**
        this.id = dbEntry.ID;
        this.name = dbEntry.Name;
        this.owner = dbEntry.Owner;
        this.data = gameData; // Game data (from file)
        // this.joinCode = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10).toString()).join('');
    }

    /** Reset this.data */
    initNew(player1Region = undefined) {
        this.data = {};

        // Load countries
        /**
         * {
         *  health: number;
         *  overlord?: "RU" | "US";
         *  silos?: { x: number; y: number; health: number; contents: object }[];
         *  defencePosts?: { x: number; y: number; health: number; country: string; contents: object }[];
         * }
         */
        this.data.countries = {}; // { health: number; overlord: "RU" | "US" | undefined }[]
        for (let cc in COUNTRIES) {
            this.data.countries[cc] = { health: 100 };
        }

        // Load cities
        this.data.cities = { RU: {}, US: {}, }; // <city_name>: <city_pop>
        Object.entries(RU_CITIES).forEach(([name, pop]) => this.data.cities.RU[name] = pop);
        Object.entries(US_CITIES).forEach(([name, pop]) => this.data.cities.US[name] = pop);

        const isPlayer1RU = player1Region ? player1Region === "RU" : Math.random() < 0.5;

        // Information for each players
        this.data.player1 = {
            money: START_MONEY,
            income: BASE_INCOME,
            region: isPlayer1RU ? "RU" : "US",
        };
        this.data.player2 = {
            money: START_MONEY,
            income: BASE_INCOME,
            region: isPlayer1RU ? "US" : "RU",
        };

        // Events
        this.data.events = [];
    }

    /** @override */
    getGameData() {
        return this.data;
    }

    attemptJoinOwner() {
        if (this.players.filter(x => x).length === 0) {
            return { error: false, data: { idx: 0 } };
        } else {
            return { error: true, msg: "Owner may only join an empty game." };
        }
    }

    attemptJoinForeign(req) {
        const players = this.players.filter(x => x).length;
        if (players === 0) {
            return { error: true, msg: "Cannot join game without the owner." };
        } else if (players > 2) {
            return { error: true, msg: "Game is full." };
        } else {
            return { error: false, data: { idx: 1 } };
        }
    }

    /** Populate this.data from save file */
    async fetchData() {
        const path = DIRECTORY + this.id + ".json"; // Path to save file
        const data = JSON.parse((await new Promise(res => readFile(path, (_, d) => res(d)))).toString());
        this.data = data;
        this.data.player1.income = this.calculateIncome(this.data.player1.region);
        this.data.player2.income = this.calculateIncome(this.data.player2.region);
        return data;
    }

    /** From a region, return both the player data and their socket, or null */
    getOwner(region) {
        if (region === "US" || region === "RU")
            return {
                data: this.data.player1.region === region ? this.data.player1 : this.data.player2,
                sock: this.data.player1.region === region ? this.players[0] : this.players[1],
            };
        return null;
    }

    /** Calculate income for a given region (RU or US) */
    calculateIncome(region) {
        if (region === "US" || region === "RU") {
            return BASE_INCOME + Object.entries(this.data.countries).filter(([_, c]) => c.overlord === region).map(([code, _]) => COUNTRIES[code]).map(c => c.gdp * ALLY_INCOME_MUL).reduce((a, b) => a + b, 0);
        } else {
            return 0;
        }
    }

    /** Calculate allies' cost */
    calculateAllyCost(overlord, ally) {
        return this.data.countries[ally].overlord ? Infinity : COUNTRIES[ally].gdp * ALLY_COST_MUL;
    }

    /**
     * Attempt to form an ally. Return status code:
     * 
     * - 0 => Successfull
     * - 1 => Other error
     * - 2 => Insufficient funds
     */
    formAlly(overlord, ally) {
        const buyer = this.getOwner(overlord);
        if (buyer) {
            const cost = this.calculateAllyCost(overlord, ally);
            if (ally === this.data.player1.region || ally === this.data.player2.region || this.data.countries[ally].overlord) {
                return 1;
            } else if (buyer.data.money >= cost) {
                buyer.data.money -= cost;
                this.data.countries[ally].overlord = overlord; // Set the overlord
                buyer.data.income = this.calculateIncome(overlord); // Update income -- would've increased
                return 0;
            } else {
                return 2;
            }
        }
    }

    /**
     * Attempt to sever an ally. Return status code:
     * 
     * - 0 => Successfull
     * - 1 => Not an ally
     */
    severAlly(overlord, ally) {
        const severer = this.getOwner(overlord);
        if (severer) {
            if (this.data.countries[ally].overlord === overlord) {
                delete this.data.countries[ally].overlord; // Remove overlord property
                severer.data.income = this.calculateIncome(overlord); // Update new player's income
                return 0;
            } else {
                return 1;
            }
        }
    }

    /** Calculate cost to build a silo in said country */
    calculateSiloCost(overlord, country) {
        if (country === overlord) {
            return BUILD_SILO_COST;
        } else if (this.data.countries[country].overlord === overlord) {
            return BUILD_SILO_COST - COUNTRIES[country].gdp * 20;
        } else {
            return Infinity;
        }
    }

    /**
     * Can we build a silo here?
     * 
     * - 0 => OK
     * - 1 => No build permissions
     * - 2 => Insufficient funds
    */
    canBuildSilo(player, country) {
        const data = player === 0 ? this.data.player1 : this.data.player2;
        if (data.region === country || this.data.countries[country].overlord === data.region) {
            const cost = this.calculateSiloCost(data.region, country);
            if (cost > data.money) {
                return 2;
            } else {
                return 0;
            }
        } else {
            return 1;
        }
    }

    /** Create new game event */
    createEvent(player, type, data = {}) {
        const event = { id: uuidv4(), player, type, created: Date.now(), data };
        this.data.events.push(event);
        return event;
    }

    /** Create event to build a new silo */
    createBuildSiloEvent(player, country, x, y) {
        return this.createEvent(player, EVENT.BUILD_SILO, {
            overlord: (player === 0 ? this.data.player1 : this.data.player2).region,
            country,
            x, y,
            time: BUILD_SILO_TIME,
        });
    }

    /** Carry out an action depending on the given event. Return { done: boolean, ... } */
    execEvent(event) {
        if (event.type === EVENT.DUMMY) {
            return { event, done: true, };
        } else {
            return { event, done: false, error: "Unknown event type", };
        }
    }

    /** Check event list. Remove DONE events. */
    checkEvents() {
        // Evaluate all events, and return all that have been completed
        const done = this.data.events.map(event => this.execEvent(event)).filter(({ done }) => done);
        // Remove done events
        done.forEach(({ id }) => {
            let j = this.data.events.findIndex(e => e.id === id);
            this.data.events.splice(j, 1);
            this.emitAll("remove-event", id);
        });
        // Return done events
        return done;
    }
}

/** Map of all active games, mapping ID to Game object */
Game.all = new Map();