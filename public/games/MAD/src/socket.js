import SocketManager from "/libs/SocketManager.js";
import { createSocket } from "../../../assets/socket-utils.js";
import globals from "./globals.js";
import * as events from "./events.js";
import * as map from "./map.js";
import * as titlebar from "./titlebar.js";
import * as sidebar from "./sidebar.js";

var socket;
/** Create the socket */
export function create() {
    if (socket) return socket;
    socket = new SocketManager(createSocket("MAD"));
    attachEvents(socket);
    return socket;
}

/** Socket: attach events */
function attachEvents() {
    // Get initial game data
    socket.onEvent("game-data", async (data) => {
        globals.data = data;
        init();
    });

    //#region Events
    socket.onEvent("create-event", event => {
        globals.data.events.set(event.id, event);
        sidebar.refreshView();
    });
    //#endregion
    //#region Update Personal Data
    socket.onEvent("update-money", (amount) => {
        globals.me.money = +amount;
        sidebar.refreshView();
    });
    socket.onEvent("update-income", (amount) => {
        globals.me.income = +amount;
        sidebar.refreshView();
    });
    //#endregion

    //#region Update Country Info
    socket.onEvent("update-country-health", ({ code, health }) => {
        globals.data.countries[code].health = +health;
        sidebar.refreshView();
    });
    //#endregion

    //#region Allies
    socket.onEvent("update-country-overlord", ({ code, overlord }) => {
        const country = globals.data.countries[code];
        if (overlord) {
            country.overlord = overlord;
            country.el.dataset.overlord = overlord;
        } else {
            delete country.overlord;
            delete country.el.overlord;
        }
        sidebar.refreshView();
    });
    // Calculate the cost to form an allyship
    socket.onEvent("calc-ally-cost", ({ code, amount }) => {
        globals.data.countries[code].cost = +amount;
        sidebar.refreshView();
    });
    // Successfully formed an ally
    socket.onEvent("form-ally", (ally) => {
        // Current sidebar view should be a country card
        const country = globals.data.countries[ally];
        country.overlord = globals.me.region;
        country.el.dataset.overlord = globals.me.region;
        // Update sidebar
        sidebar.popViewStack();
        sidebar.pushViewStack(sidebar.createCountryView(ally));
    });
    // Successfully severed an ally
    socket.onEvent("sever-ally", (ally) => {
        const country = globals.data.countries[ally];
        delete country.overlord;
        delete country.el.dataset.overlord;
        // Update sidebar
        sidebar.popViewStack();
        sidebar.pushViewStack(sidebar.createCountryView(ally));
    });
    //#endregion
    //#region Silos
    // Calculate the cost to build a new silo
    socket.onEvent("calc-silo-cost", ({ country, amount }) => {
        globals.data.countries[country].siloCost = +amount;
        sidebar.refreshView();
    });
    // Add silo to a country
    socket.onEvent("build-silo", ({ country, x, y }) => {
        const cdata = globals.data.countries[country];
        if (!cdata.silos) cdata.silos = [];
        cdata.silos.push({ country, x, y, contents: [] });
        sidebar.refreshView();
    });
    //#endregion
}

/** Initialise application */
function init() {
    document.title += " | " + globals.data.name;
    globals.me = globals.data.isP1 ? globals.data.player1 : globals.data.player2;
    globals.enemy = globals.data.isP1 ? globals.data.player2 : globals.data.player1;

    events.init();
    map.init();
    titlebar.init();
    sidebar.init();
}