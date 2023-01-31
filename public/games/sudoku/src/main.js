import { Sounds } from "/libs/Sound.js";
import { STATES, Sudoku } from "./Sudoku.mjs";
import { createAnimation } from "/libs/util.js";
import Popup from "/libs/Popup.js";

/** Format a millisecond timestamp */
function formatMS(ms) {
    let hours = Math.floor(ms / HOURS_MS);
    ms -= hours * HOURS_MS;
    let mins = Math.floor(ms / MINS_MS);
    ms -= mins * MINS_MS;
    let secs = Math.floor(ms / SECS_MS);
    ms -= secs * SECS_MS;
    ms = Math.round(ms / 10);
    return hours.toString().padStart(2, "0") + ":" + mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0") + "." + ms.toString().padStart(2, "0");
}

/** Render game */
function render() {
    // Render game board
    board.dim = Math.floor(Math.min(canvas.width, canvas.height) * 0.99);
    const img = game.draw(board.dim, colors, state, debug);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    board.x = (canvas.width - board.dim) / 2;
    board.y = (canvas.height - board.dim) / 2;
    ctx.drawImage(img, board.x, board.y);

    // Are we in note mode?
    let gap = 40;
    ctx.fillStyle = colors.borderColor;
    ctx.font = "17px Arial";
    ctx.textBaseline = "center";
    ctx.textAlign = "center";
    let x = board.x * 0.5;
    let y = board.y + board.dim / 2 - gap;
    ctx.fillText(`Note Mode: ${asNote ? "on" : "off"}`, x, y);
    y += gap;
    if (state === STATES.PAUSED) {
        ctx.fillText("PAUSED", x, y);
    } else {
        ctx.fillText(`Time: ${formatMS(timeEnd - timeStart)}`, x, y);
    }
    y += gap;
    ctx.fillText(`Mistakes: ${mistakes}${isFinite(MAX_MISTAKES) ? '/' + MAX_MISTAKES : ''}`, x, y);

    y += gap;
    btnSettings.x = x - btnSettings.dim * 1.5;
    btnSettings.y = y;
    ctx.drawImage(btnSettings.icon, btnSettings.x, btnSettings.y, btnSettings.dim, btnSettings.dim);
    ctx.strokeStyle = colors.borderColor;
    ctx.strokeRect(btnSettings.x - btnSettings.pad, btnSettings.y - btnSettings.pad, btnSettings.dim + btnSettings.pad * 2, btnSettings.dim + btnSettings.pad * 2);

    btnRedo.x = x + btnRedo.dim * 0.5;
    btnRedo.y = y;
    ctx.drawImage(btnRedo.icon, btnRedo.x, btnRedo.y, btnRedo.dim, btnRedo.dim);
    ctx.strokeStyle = colors.borderColor;
    ctx.strokeRect(btnRedo.x - btnRedo.pad, btnRedo.y - btnRedo.pad, btnRedo.dim + btnRedo.pad * 2, btnRedo.dim + btnRedo.pad * 2);
}

function loop() {
    if (state === STATES.IN_PROGRESS) timeEnd = performance.now();

    render();
}

/** Create a new grid */
function newGrid() {
    game.clearGrid();
    switch (gameGenAlgo) {
        case 0:
            game.populateBruteForce();
            break;
    }
    game.reveal(game.dim ** 4 * (1 - removePercentage));
    game.setOver(0, 0);
}

/** Reset game */
function resetGame() {
    mistakes = 0;
    state = STATES.IN_PROGRESS;
    animate.setFPS(NORMAL_FPS);
    newGrid();
    timeStart = performance.now();
}

/** Win the current game. */
function winGame() {
    state = STATES.WON;
    setTimeout(() => Sounds.play("tada"), 100);
    animate.setFPS(COMPLETE_FPS);
}

/** Make a mistake. */
function makeMistake() {
    Sounds.play("wrong");
    mistakes++;
    if (mistakes >= MAX_MISTAKES) {
        Sounds.play("gameover");
        state = STATES.LOST;
    }
}

function pauseGame() {
    beforePausedState = state;
    state = STATES.PAUSED;
    pausedAt = performance.now();
}

function resumeGame() {
    state = beforePausedState;
    beforePausedState = null;
    timeStart += performance.now() - pausedAt;
    pausedAt = undefined;
}

/** Click on the settings button. */
function clickSettingsBtn() {
    const popup = new Popup("Settings");

    // Change dimensions
    let p = document.createElement("p");
    p.innerText = "Dimensions: ";
    const inputDim = document.createElement("input");
    inputDim.type = "number";
    inputDim.min = "0";
    inputDim.value = game.dim.toString();
    p.appendChild(inputDim);
    popup.insertAdjacentElement("beforeend", p);

    // Game generation algorithm
    p = document.createElement("p");
    p.innerText = "Generation Algorithm: ";
    const selectAlgo = document.createElement("select");
    GAME_GEN.forEach((algo, i) => {
        const option = document.createElement("option");
        option.innerText = algo;
        option.value = i;
        if (i === gameGenAlgo) option.setAttribute("selected", "selected");
        selectAlgo.appendChild(option);
    });
    p.appendChild(selectAlgo);
    popup.insertAdjacentElement("beforeend", p);

    // Max mistakes
    p = document.createElement("p");
    p.innerText = "Max Mistakes: ";
    const inputMistakes = document.createElement("input");
    inputMistakes.type = "number";
    inputMistakes.min = "1";
    inputMistakes.value = MAX_MISTAKES.toString();
    p.appendChild(inputMistakes);
    popup.insertAdjacentElement("beforeend", p);

    // Removal count
    p = document.createElement("p");
    p.innerText = "Cell Removal: ";
    const inputRemove = document.createElement("input");
    inputRemove.type = "number";
    inputRemove.min = "1";
    inputRemove.max = "99";
    inputRemove.value = (removePercentage * 100).toString();
    p.insertAdjacentElement("beforeend", inputRemove);
    p.insertAdjacentText("beforeend", " %");
    popup.insertAdjacentElement("beforeend", p);

    // Colour mode
    p = document.createElement("p");
    p.innerText = "Light mode: ";
    const inputColor = document.createElement("input");
    inputColor.type = "checkbox";
    inputColor.checked = lightMode;
    inputColor.addEventListener("change", () => {
        lightMode = !lightMode;
        loadColorMode();
    });
    p.appendChild(inputColor);
    popup.insertAdjacentElement("beforeend", p);

    // Save & apply
    p = document.createElement("span");
    const btn = document.createElement("button");
    btn.innerText = "Save & Apply";
    btn.addEventListener("click", () => {
        // Generation algorithm
        gameGenAlgo = +selectAlgo.value;

        // Removal percentage
        removePercentage = +inputRemove.value / 100;

        // Dimensions
        let dim = parseInt(inputDim.value);
        if (dim > 1 && dim !== game.dim) {
            game.dim = parseInt(inputDim.value);
            resetGame();
        }

        // Maximum mistakes
        MAX_MISTAKES = parseInt(inputMistakes.value);

        popup.hide();
        resumeGame();
    });
    p.appendChild(btn);
    popup.insertAdjacentElement("beforeend", p);
    popup.setCloseCallback(() => {
        resumeGame();
    })

    // Show popup
    pauseGame();
    popup.show();
}

/** Click "Redo" button */
function clickRedoBtn() {
    if (state !== STATES.PAUSED) {
        if (state === STATES.IN_PROGRESS) {
            state = STATES.LOST;
        } else {
            resetGame();
        }
    }
}

/** Get color object given the mode */
function getColorObject(lightMode) {
    if (lightMode) {
        return {
            backgroundColor: "#F8F8FF",
            pausedBackgroundColor: "#A4A4AA",
            borderColor: "#36454F",
            selectedColor: "#7CB9E8",
            selectedRowColColor: "#B0C4DE",
            textColor: "#010C48",
            textFont: "bold 30px Arial",
            correctTextColor: "#DC153C",
            smallTextColor: "#656565",
            smallTextFont: "15px Arial",
        };
    } else {
        return {
            backgroundColor: "#36454F", // 4782B4
            pausedBackgroundColor: "#999999",
            borderColor: "#D8D8DD",
            selectedColor: "#000280",
            selectedRowColColor: "#0006CD", // "#027AFF",
            textColor: "#D8D8DD",
            textFont: "bold 30px Arial",
            correctTextColor: "#FE5257",
            smallTextColor: "#656565",
            smallTextFont: "15px Arial",
        };
    }
}

/** Load the color mode */
function loadColorMode() {
    colors = getColorObject(lightMode);
    document.styleSheets.backgroundColor = colors.backgroundColor;
}

// Load sound assets
Sounds.create("wrong", "assets/wrong.wav");
Sounds.create("blip", "assets/blip.wav");
Sounds.create("tada", "assets/tada.mp3");
Sounds.create("gameover", "assets/gameover.mp3");

const NUMBERS = Object.freeze(Array.from({ length: 9 }, (_, i) => (i + 1).toString()));
var debug = false;
const NORMAL_FPS = 30, COMPLETE_FPS = 2;
const SECS_MS = 1000, MINS_MS = SECS_MS * 60, HOURS_MS = MINS_MS * 60;
let MAX_MISTAKES = 3;
const GAME_GEN = ["Brute-Force"];
let gameGenAlgo = 0;
let lightMode = !window.matchMedia("(prefers-color-scheme: dark)").matches, colors;
loadColorMode();

// Setup canvas
const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

// Event listeners
window.addEventListener("keydown", (e) => {
    keysPressed.add(e.key);
    if (e.key === "d") debug = !debug;
    else if (e.key === 'p') {
        if (state === STATES.PAUSED) {
            resumeGame();
        } else {
            pauseGame();
        }
    } else if (e.key === 'm') {
        lightMode = !lightMode;
        loadColorMode();
    } else if (e.key === 'r') {
        clickRedoBtn();
    } else if (state === STATES.IN_PROGRESS) {
        if (NUMBERS.includes(e.key)) {
            const [i, j] = game.getOver(), n = +e.key;
            const digit = game.get(i, j);
            if (asNote) {
                if (digit.couldBe(n)) {
                    digit.removePossible(n);
                } else {
                    digit.addPossible(n);
                }
                Sounds.play("blip");
            } else {
                if (digit.value === undefined) {
                    if (digit.actual === n) {
                        Sounds.play("blip");
                        digit.value = n;
                        if (game.isComplete()) {
                            winGame();
                        }
                    } else {
                        makeMistake();
                    }
                } else {
                    makeMistake();
                }
            }
        } else {
            switch (e.key) {
                case "n":
                    asNote = !asNote;
                    break;
                case "ArrowUp":
                    game.moveOver(0, -1);
                    break;
                case "ArrowRight":
                    game.moveOver(1, 0);
                    break;
                case "ArrowDown":
                    game.moveOver(0, 1);
                    break;
                case "ArrowLeft":
                    game.moveOver(-1, 0);
                    break;
            }
        }
    }
});
window.addEventListener("keyup", (e) => {
    keysPressed.delete(e.key);
});
window.addEventListener("click", e => {
    const b = canvas.getBoundingClientRect();
    let mouseX = e.clientX - b.left;
    let mouseY = e.clientY - b.top;

    // Over "settings" button?
    if (mouseX >= btnSettings.x && mouseX <= btnSettings.x + btnSettings.dim && mouseY >= btnSettings.y && mouseY <= btnSettings.y + btnSettings.dim) {
        clickSettingsBtn();
    }

    // Over "redo" button?
    else if (mouseX >= btnRedo.x && mouseX <= btnRedo.x + btnRedo.dim && mouseY >= btnRedo.y && mouseY <= btnRedo.y + btnRedo.dim) {
        clickRedoBtn();
    }
});

// Variables
let state = STATES.IN_PROGRESS, beforePausedState = null;
let pausedAt; // Time paused at
let asNote = true;
let mistakes = 0;
let keysPressed = new Set();
let board = {};
let timeStart, timeEnd;
let removePercentage = 0.25;

let btnSettings = { dim: 32, icon: new Image(), pad: 2 };
btnSettings.icon.src = "assets/settings.png";
let btnRedo = { dim: 32, icon: new Image(), pad: 2 };
btnRedo.icon.src = "assets/redo.png";

// Create game
const game = new Sudoku(3);
window.game = game;

// Animation
const animate = createAnimation();
animate.setFPS(NORMAL_FPS);
animate.start(loop);

resetGame();
game.get(0, 0).value = void 0;