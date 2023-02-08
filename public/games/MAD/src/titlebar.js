import globals from "./globals.js";
import { getFlag, showCountryOnHover } from "./utils.js";

/** Load titlebar */
export function init() {
    const playerOverview = document.createElement("div");
    globals.titlebar.appendChild(playerOverview);
    playerOverview.id = "player-overview";

    // Player One
    let div = document.createElement("div");
    playerOverview.appendChild(div);
    let img = getFlag(globals.me.region);
    showCountryOnHover(img, globals.me.region);
    div.appendChild(img);
    div.insertAdjacentHTML("beforeend", `<span>${globals.me.region}</span>`);

    playerOverview.insertAdjacentHTML("beforeend", "<span>VS</span>");

    // Player Two
    div = document.createElement("div");
    playerOverview.appendChild(div);
    img = getFlag(globals.enemy.region);
    showCountryOnHover(img, globals.enemy.region);
    div.appendChild(img);
    div.insertAdjacentHTML("beforeend", `<span>${globals.enemy.region}</span>`);
}