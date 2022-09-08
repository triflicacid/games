import { extractCoords } from "../../libs/util.js";
import { Ludo } from "./Ludo.js";

function setupEventListeners(ludo, canvas) {
    const map = new Map();

    function onClick(event) {
        let [x, y] = extractCoords(event);
        x = Math.round(x);
        y = Math.round(y);
        ludo.handleClick(x, y);
    }
    map.set("click", onClick);

    map.forEach((val, key) => canvas.addEventListener(key, val));
    
    return function () {
        map.forEach((val, key) => canvas.removeEventListener(key, val));
    };
}

async function main() {
    document.body.insertAdjacentHTML("beforeend", "<h1>Ludo</h1>");

    const container = document.createElement("div");
    document.body.appendChild(container);
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    canvas.width = 1200;
    canvas.height = 700;
    canvas.style.border = "1px solid black";
    canvas.focus();
    const ctx = canvas.getContext("2d");

    const ludo = new Ludo();
    window.ludo = ludo;
    ludo.players[0][0] = 4;
    ludo.outlinedSlots.push(5);
    ludo.display(ctx, canvas.width, canvas.height);
    setupEventListeners(ludo, canvas);
}

window.addEventListener("load", main);