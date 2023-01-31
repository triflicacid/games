import { Cell } from "./Cell.js";
import { Game } from "./Game.js";
import { Popup } from "/libs/Popup.js";
import { Sounds } from "/libs/Sound.js";
import { loadImage, extractImage, extractCoords } from "/libs/util.js";

/** Load assets */
async function loadAssets() {
    // Load sprites
    const spritesheet = await loadImage("assets/sprites.png");
    Cell.img = {
        spritesheet,
        hiddenSquare: extractImage(spritesheet, 0, 39, 16, 16),
        flaggedSquare: extractImage(spritesheet, 16, 39, 16, 16),
        explodedMine: extractImage(spritesheet, 33, 39, 16, 16),
        mine: extractImage(spritesheet, 64, 39, 16, 16),
        // This array will contain numbers 0 (empty) -> 8 (bomb indication)
        squareCount: Array.from({ length: 9 }, (_, i) => extractImage(spritesheet, i * 16, 23, 16, 16)),
        // Other images:
        gameover: await loadImage("assets/gameover.png"),
        settings: await loadImage("assets/settings.png"),
        restart: await loadImage("assets/redo.png"),
    };
    // Load sounds
    await Sounds.create("explosion", "assets/explode.wav");
    await Sounds.create("tada", "assets/tada.mp3");
}

window.addEventListener("load", async function () {
    /** Render game */
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Background
        ctx.fillStyle = "#ededed";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw game
        const gameImg = game.draw();
        const gw = gameLocation.w = Math.min(gameImg.width, canvas.width);
        const gh = gameLocation.h = Math.min(gameImg.height, canvas.height);
        const gx = gameLocation.x = (canvas.width - gw) / 2;
        const gy = gameLocation.y = (canvas.height - gh) / 2;
        ctx.drawImage(gameImg, gx, gy, gw, gh);
        // Game border
        ctx.strokeStyle = "#0000cd";
        ctx.lineWidth = 2;
        ctx.strokeRect(gx, gy, gw, gh);
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 1;
        ctx.strokeRect(gx - 2, gy - 2, gw + 4, gh + 4);
        // Settings button
        const settingsImg = Cell.img.settings;
        let w = btnSettings.w, h = w;
        let x = gx + gw + w / 2;
        let y = gy;
        ctx.drawImage(settingsImg, btnSettings.x = x, btnSettings.y = y, w, h);
        ctx.beginPath();
        ctx.strokeStyle = "#000000";
        let r = btnSettings.r = w / 2 + 4;
        ctx.arc(x + w / 2, y + w / 2, r, 0, 2 * Math.PI);
        ctx.stroke();
        // New Game button
        const restartImg = Cell.img.restart;
        y += h * 1.5;
        w = btnNew.w;
        h = w;
        ctx.drawImage(restartImg, btnNew.x = x, btnNew.y = y, w, h);
        ctx.beginPath();
        ctx.strokeStyle = "#000000";
        r = btnNew.r = w / 2 + 4;
        ctx.arc(x + w / 2, y + w / 2, r, 0, 2 * Math.PI);
        ctx.stroke();
    }

    /** Handle "mousedown" event on the canvas */
    function handleMouseDown(x, y, btn) {
        if (Math.hypot(x - btnSettings.x, y - btnSettings.y) <= 2 * btnSettings.r) {
            // Setting button
            clickSettingsButton();
        } else if (Math.hypot(x - btnNew.x, y - btnNew.y) <= 2 * btnNew.r) {
            // New Game button
            if (game.gameover) {
                game.newGrid();
            } else {
                game.endGame();
            }
        } else if (x >= gameLocation.x && x <= gameLocation.x + gameLocation.w && y >= gameLocation.y && y <= gameLocation.y + gameLocation.h) {
            // Over game
            // Adjust co-ordinates
            x -= gameLocation.x;
            y -= gameLocation.y;
            if (game.gameover) {
                // Restart the game
                game.newGrid();
            } else {
                // Get the cell we are over
                const [i, j] = game.getIndices(x, y), cell = game.grid[j][i];

                if (btn === 2) {
                    // Right-mouse click (flag)
                    cell.hasFlag = !cell.hasFlag;
                } else {
                    // Left-mouse click (reveal)
                    if (!cell.revealed) {
                        if (cell.isMine) { // Uh-oh!
                            cell.revealed = true;
                            cell.mineExploded = true;
                            Sounds.play("explosion");
                            game.endGame();
                        } else { // Floodfill
                            game.floodFill(i, j);
                            // Have we won?
                            if (game.countFlaggedMines() === game.countMines()) {
                                game.endGame();
                                Sounds.play("tada");
                            }
                        }
                    }
                }
            }
        }
    }

    /** Click on the "settings" button */
    function clickSettingsButton() {
        const popup = new Popup("Game Settings");
        popup.insertAdjacentHTML("beforeend", "<p>Alter game settings.<br>Click button below to apply.</p>");

        // Mines
        let p = document.createElement("p");
        popup.insertAdjacentElement("beforeend", p);
        p.insertAdjacentHTML("beforeend", `<span>Mine Percentage:</span>&nbsp;`);
        const spanMinePercent = document.createElement("span");
        p.insertAdjacentElement("beforeend", spanMinePercent);
        p.insertAdjacentHTML("beforeend", "% &nbsp;");
        const inputMinePercent = document.createElement("input");
        inputMinePercent.type = "range";
        inputMinePercent.min = 0;
        inputMinePercent.max = 100;
        inputMinePercent.value = game.minePercentage * 100;
        spanMinePercent.innerText = inputMinePercent.value;
        inputMinePercent.addEventListener("input", () => {
            spanMinePercent.innerText = inputMinePercent.value;
        });
        p.insertAdjacentElement("beforeend", inputMinePercent);

        // Dimensions
        p = document.createElement("p");
        popup.insertAdjacentElement("beforeend", p);
        p.insertAdjacentHTML("beforeend", "<span>Dimensions:</span> &nbsp;");
        const inputRows = document.createElement("input");
        inputRows.classList.add("small");
        inputRows.type = "number";
        inputRows.min = 1;
        inputRows.value = game.rows;
        p.insertAdjacentElement("beforeend", inputRows);
        p.insertAdjacentHTML("beforeend", " by ");
        const inputCols = document.createElement("input");
        inputCols.classList.add("small");
        inputCols.type = "number";
        inputCols.min = 1;
        inputCols.value = game.cols;
        p.insertAdjacentElement("beforeend", inputCols);

        // Apply button
        p.insertAdjacentHTML("beforeend", "<br><br>");
        const btn = document.createElement("button");
        btn.innerText = "Update & Restart";
        btn.addEventListener("click", () => {
            game.minePercentage = inputMinePercent.value / 100;
            game.rows = +inputRows.value;
            game.cols = +inputCols.value;
            game.cw = Math.floor(Math.min(canvas.width / game.rows, (canvas.height - 2 * btnSettings.w) / game.cols));
            game.newGrid();
            popup.hide();
        });
        p.insertAdjacentElement("beforeend", btn);

        popup.show();
    }

    await loadAssets();

    // Create canvas
    const container = document.getElementById("container");
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    container.appendChild(canvas);
    canvas.addEventListener("mousedown", e => {
        handleMouseDown(...extractCoords(e), e.button);
    });
    canvas.addEventListener("contextmenu", e => {
        e.preventDefault();
    });
    const ctx = canvas.getContext("2d");
    
    const game = new Game(10, 10);
    this.window.game = game;
    game.newGrid();
    const gameLocation = { x: 0, y: 0, w: 0, h: 0 }; // Location of where the minesweeper game was rendered
    const btnSettings = { x: 0, y: 0, w: 32, h: 32 }; // Location of Settings button
    const btnNew = { x: 0, y: 0, w: 32, h: 32 }; // Location of New Game button
    
    (function loop() {
        draw();
        requestAnimationFrame(loop);
    })();
});