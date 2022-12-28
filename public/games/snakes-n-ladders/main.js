import { hsl2rgb, loadImage, sleep } from "/libs/util.js";
import { Sounds } from "/libs/Sound.js";

// Cell-related constants
const CDIM = 53 + 1, PAD = 2;
const DELAY = 500;
var width, height, img_dim, cell_dim, pad;
var suspendInput = false;

// Head: Tail
const SNAKES = {
    96: 42,
    94: 71,
    75: 32,
    47: 16,
    28: 10,
    37: 3,
};

// Base: Top
const LADDERS = {
    4: 56,
    12: 50,
    14: 55,
    22: 58,
    41: 79,
    54: 88,
};

const PODIUM_EMOJIS = ["🥇", "🥈", "🥉"];

var boardImage;
var game;

function getCellPosition(n) {
    n -= 1;
    const y = Math.floor(n / 10);
    return [
        y % 2 === 0 ? n % 10 : 9 - n % 10,
        9 - y,
    ].map(n => Math.round(n * cell_dim + (n + 1) * pad));
}


/** Return a new game object with `players` players */
function createGame(players) {
    let game = {
        players: Array.from({ length: players }).fill(1),
        colors: Array.from({ length: players }, (_, i) => hsl2rgb(360 / players * i, 65, 50)),
        current: Math.floor(Math.random() * players),
        moves: 0, // Moves left
        done: [], // Array of players who've completed the game
        gameover: false, // Is the game completed? (assumed true if done.length == players.length)
    };
    nextGo(game);
    return game;
}

/** Advance goes for a game */
function nextGo(game) {
    if (game.done.length === game.players.length) {
        game.current = -1;
        return;
    }

    game.current = (game.current + 1) % game.players.length;
    if (game.done.includes(game.current)) return nextGo(game);
    game.moves = Math.floor(Math.random() * 5) + 1; // Random 1-6
}

/** Handle `keydown` event. Return if re-render. */
async function keydown(event, game, draw) {
    if (game.moves > 0) {
        let cell = game.players[game.current];
        const y = Math.floor((cell - 1) / 10);

        // Advance?
        if ((y % 2 === 0 && event.key === "ArrowRight") || (y % 2 === 1 && event.key === "ArrowLeft")) {
            while (game.moves > 0) {
                cell = ++game.players[game.current];
                if (cell === 100) {
                    game.moves = 0;
                    break;
                } else if (SNAKES[cell] !== undefined) {
                    cell = game.players[game.current] = SNAKES[cell];
                } else if (LADDERS[cell] !== undefined) {
                    game.players[game.current] = LADDERS[cell];
                }
                game.moves--;
                draw();
                await sleep(DELAY);
            }
            if (cell === 100) {
                Sounds.play("tada");
                if (!game.done.includes(game.current)) game.done.push(game.current);
                game.moves = 0;
            }
            if (game.moves === 0) nextGo(game);
            draw();
        }
    }
    return false;
}

function display(ctx, width, height, game) {
    ctx.clearRect(0, 0, width, height);
    const ox = (width - img_dim) / 2, oy = (height - img_dim) / 2;
    ctx.drawImage(boardImage, ox, oy, img_dim, img_dim);
    const gameover = game.gameover || game.done.length === game.players.length;

    // Count how many players in cells
    const cells = {}; // CELL: PLAYER[]
    for (let i = 0; i < game.players.length; ++i) {
        const cell = game.players[i], color = game.colors[i];
        let [x, y] = getCellPosition(cell);
        x += ox;
        y += oy;
        if (!cells[cell]) cells[cell] = [];
        cells[cell].push(i);
    }

    // Draw players
    for (const [cell, players] of Object.entries(cells)) {
        let [cx, cy] = getCellPosition(+cell);
        cx += ox;
        cy += oy;
        if (players.length === 1) {
            const rad = cell_dim / 4;
            cx += cell_dim / 2;
            cy += cell_dim / 2;
            ctx.fillStyle = "rgb(" + game.colors[players[0]].join(", ") + ")";
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            const rad = cell_dim / (players.length * 2.5 + 0.5);
            cx += rad * 1.5;
            cy += cell_dim / 2;
            for (const player of players) {
                ctx.fillStyle = "rgb(" + game.colors[player].join(",") + ")";
                ctx.beginPath();
                ctx.arc(cx, cy, rad, 0, 2 * Math.PI);
                ctx.fill();
                cx += rad * 2.5;
            }
        }
    }

    // Winscreen
    if (gameover) {
        const rgb = game.done.length === 0 ? [128, 128, 128] : game.colors[game.done[0]];
        let size = 80, x = ox + img_dim / 2, y = oy + img_dim / 2 - size * 0.5;
        ctx.fillStyle = "rgba(" + rgb.join(",") + ", 0.75)";
        ctx.fillRect(ox, oy, img_dim, img_dim);
        ctx.textAlign = "center";
        ctx.fillStyle = "rgb(" + rgb.map(n => 255 - n).join(",") + ")";
        ctx.font = size + "px Arial";
        ctx.fillText(PODIUM_EMOJIS[0], x, y);
        if (game.done.length > 0) {
            size *= 0.7;
            ctx.font = size + "px Arial";
            ctx.fillText(`Player ${game.done[0] + 1} Wins!`, x, y + size * 1.3);
        }
    }

    let x = ox, y = oy + cell_dim + pad;
    // Whose go is it?
    if (!gameover) {
        x += img_dim + (width - img_dim) / 6;
        let tx = x;
        ctx.font = "18px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "left";
        let text = "Player ", measure = ctx.measureText(text);
        ctx.fillText(text, tx, y);
        tx += measure.width;
        text = (game.current + 1).toString();
        ctx.fillStyle = "rgb(" + game.colors[game.current].join(",") + ")";
        ctx.font = "bold " + ctx.font;
        measure = ctx.measureText(text);
        ctx.fillText(text, tx, y);
        tx += measure.width;
        ctx.font = ctx.font.substring(5);
        ctx.fillStyle = "black";
        text = "'s Go";
        measure = ctx.measureText(text);
        ctx.fillText(text, tx, y);
        tx += measure.width;

        // Moves left
        tx = ox + img_dim + (width - img_dim) / 4;
        y += cell_dim * 0.75;
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`You have ${game.moves} move${game.moves === 1 ? '' : 's'} left`, tx, y);
    }

    // Leaderboards
    x = ox - (width - img_dim) / 4;
    y = oy + cell_dim + pad;
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText("Podium", x, y);
    y += 35;
    ctx.font = "16px Arial";
    for (let i = 0; i < game.done.length; i++) {
        const player = game.done[i], emoji = PODIUM_EMOJIS[i];
        ctx.fillStyle = "rgb(" + game.colors[player].join(",") + ")";
        ctx.fillText(`- ${emoji ? emoji + " " : ""}Player ${player + 1}`, x - 5, y);
        y += 25;
    }
}

async function main() {
    // Container
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.insertAdjacentHTML("beforeend", "<h1>Snakes 'n' Ladders</h1>");

    // "New Game" button
    let div = document.createElement("div");
    container.appendChild(div);
    const btnNew = document.createElement("button");
    btnNew.innerText = "New Game";
    btnNew.addEventListener("click", function () {
        let input = prompt("Number of Players", 4);
        if (input) {
            game = createGame(+input);
            display(ctx, canvas.width, canvas.height, game);
        }
    });
    div.appendChild(btnNew);
    const btnEnd = document.createElement("button");
    btnEnd.innerText = "End Game";
    btnEnd.addEventListener("click", function () {
        if (game) {
            game.gameover = true;
            display(ctx, canvas.width, canvas.height, game);
        }
    });
    div.appendChild(btnEnd);
    div.insertAdjacentHTML("afterend", "<br><br>");

    // Create canvas
    div = document.createElement("div");
    const canvas = document.createElement("canvas");
    canvas.width = 1250;
    canvas.height = 600;
    div.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    container.appendChild(div);

    // Event listeners
    document.body.addEventListener("keydown", async (event) => {
        await keydown(event, game, () => {
            display(ctx, canvas.width, canvas.height, game);
        });
    });

    // Load board & other assets
    boardImage = await loadImage("assets/board.jpg");
    Sounds.create("tada", "assets/tada.mp3");
    img_dim = canvas.height;
    const scale = img_dim / boardImage.width;
    cell_dim = CDIM * scale;
    pad = PAD * scale;

    document.body.insertAdjacentHTML("beforeend", '<p><small><a href="https://www.flaticon.com/free-icons/ladder" title="ladder icons">Ladder icons created by Freepik - Flaticon</a></small></p>');
}

window.addEventListener("load", main);