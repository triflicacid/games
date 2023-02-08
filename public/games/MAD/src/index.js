import { getTokenData, getUserInfo } from "../../../assets/socket-utils.js";
import globals from "./globals.js";
import * as socket from "./socket.js";

window.addEventListener("load", async function () {
    // Setup globals
    globals.socket = socket.create();
    globals.titlebar = document.getElementById("header");
    globals.map = document.getElementById("map");
    globals.sidebar = document.getElementById("sidebar");

    // Initiate authorisation
    // const tokenData = await getTokenData();
    // const user = await getUserInfo();
});