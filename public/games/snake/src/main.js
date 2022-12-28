import { Sounds } from "/libs/Sound.js";
import { createAnimation } from "/libs/util.js";
import { Grid } from "./grid.js";
import { move } from "./snake.js";

var canvas, ctx;
var animate;

/** @type Grid */
var grid;

var gameText;

var isPaused = false;

function main() {
    Sounds.create("grow", "./assets/glug.ogg");
    Sounds.create("die", "./assets/die.mp3");
    Sounds.create("levelUp", "./assets/rainbow.mp3");

    const d = Math.min(window.innerWidth, window.innerHeight) - 25;
    canvas = document.createElement("canvas");
    canvas.width = canvas.height = d;
    canvas.style.border = "1px solid black";
    let container = document.getElementById("canvas-container");
    container.appendChild(canvas);
    ctx = canvas.getContext("2d");
    document.body.addEventListener("keydown", onKeyDown);

    grid = new Grid(d, d, +prompt("Cell dimensions (px):", 50));
    grid.createSnake();
    newGame();

    gameText = document.getElementById('game-text');

    animate = createAnimation();
    animate.setFPS(7);
    animate.start(loop);
}

function loop() {
    if (isPaused) {
        gameText.innerText = "Press [P] to resume...";
    } else {
        if (grid.snake.alive) {
            if (!isPaused) grid.snake.move();

            // On food tile?
            if (grid.snakeOnFood()) {
                grid.snake.grow();
                grid.placeFood();
            }

            if (grid.snake.moving == move.NONE) {
                gameText.innerText = "Press [ARROW] keys to move";
            } else {
                gameText.innerText = "Score: " + grid.snake.score;
            }
        } else {
            gameText.innerText = "Press [SPACE] to respawn";
        }

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        grid.render(ctx);
    }
}

function onKeyDown(ev) {
    if (ev.key === 'p') {
        isPaused = !isPaused;
        Sounds.say("Game " + (isPaused ? "Paused" : "Resumed"));
    }

    // Only allow is NOT paused
    if (!isPaused) {
        let dir = NaN;

        switch (ev.key) {
            case "ArrowUp":
                dir = move.UP;
                break;
            case "ArrowDown":
                dir = move.DOWN;
                break;
            case "ArrowLeft":
                dir = move.LEFT;
                break;
            case "ArrowRight":
                dir = move.RIGHT;
                break;
            case " ":
                // [SPACE] - reset game
                newGame();
                break;
            case 'g':
                // Cheat - grow snake
                grid.snake.grow();
                break;
        }

        if (grid.snake.alive) {
            if (!isNaN(dir)) {
                grid.snake.moving = dir;
            }
        }
    }
}

function newGame() {
    grid.snake.new();
    grid.placeFood();
}

window.addEventListener("load", main);