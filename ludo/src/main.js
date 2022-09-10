import { Sounds } from "../../libs/Sound.js";
import { extractCoords } from "../../libs/util.js";
import { Ludo } from "./Ludo.js";

function setupEventListeners(ludo, canvas, draw) {
    const map = new Map();

    function onClick(event) {
        let [x, y] = extractCoords(event);
        x = Math.round(x);
        y = Math.round(y);
        const res = ludo.handleClick(x, y);
        console.log(res);
        if (res.status === -1) {
            console.log("ERROR:", res.msg);
            Sounds.play("error");
        }
        if (res.status > 0) draw();
        if (res.status === 1) Sounds.play("dice-throw"); // Rolled dice
        if (res.status === 3) {
            if (res.took !== undefined) Sounds.play("clang"); // Took enemy piece
            else if (res.cellTo >= 1000) { // Entered a landing strip
                const winner = ludo.checkWinners();
                if (winner !== -1) {
                    ludo.winner = winner;
                    Sounds.play("cheer");
                    draw();
                } else {
                    Sounds.play("yay");
                }
            }
            else Sounds.play("move"); // Move
        }
        if (res.status === 4) Sounds.play("choir");
        if (res.status === 5 || res.status === 6) Sounds.play("blip");
    }
    map.set("click", onClick);

    map.forEach((val, key) => canvas.addEventListener(key, val));

    return function () {
        map.forEach((val, key) => canvas.removeEventListener(key, val));
    };
}

async function main() {
    // Load sounds
    Sounds.create("blip", "assets/blip.wav");
    Sounds.create("choir", "assets/choir.wav");
    Sounds.create("cheer", "assets/cheer.wav");
    Sounds.create("clang", "assets/clang.wav");
    Sounds.create("dice-throw", "assets/dice-throw.wav");
    Sounds.create("error", "assets/error.wav");
    Sounds.create("move", "assets/move.mp3");
    Sounds.create("yay", "assets/yay.wav");
    // Sounds.disable();

    document.body.insertAdjacentHTML("beforeend", "<h1>Ludo</h1>");
    let p = document.createElement("p");
    const btnNew = document.createElement("button");
    btnNew.innerText = "New Game";
    btnNew.addEventListener('click', () => {
        removeEventListeners();
        ludo = new Ludo(+prompt("Enter number of pieces", 4));
        window.ludo = ludo;
        ludo.prepareDisplay(canvas.width, canvas.height);
        ludo.display(ctx, canvas.width, canvas.height);
        removeEventListeners = setupEventListeners(ludo, canvas, () => {
            ludo.display(ctx, canvas.width, canvas.height);
        });
    });
    p.appendChild(btnNew);
    document.body.appendChild(p);

    // Initiate canvas
    const container = document.createElement("div");
    container.classList.add("centre");
    document.body.appendChild(container);
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.8;
    canvas.style.border = "1px solid black";
    canvas.focus();
    const ctx = canvas.getContext("2d");

    // Create LUDO game
    let ludo = new Ludo();
    window.ludo = ludo;
    window.Sounds = Sounds;
    ludo.prepareDisplay(canvas.width, canvas.height);
    ludo.display(ctx, canvas.width, canvas.height);

    // Setup events
    let removeEventListeners = setupEventListeners(ludo, canvas, () => {
        ludo.display(ctx, canvas.width, canvas.height);
    });
}

window.addEventListener("load", main);