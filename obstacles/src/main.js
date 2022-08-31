import { Sounds } from "../../libs/Sound.js";
import { createAnimation } from "../../libs/util.js";
import { Font } from "../../libs/font.js";
import { Player } from "./player.js";
import { Obstacle } from "./obstacle.js";
import { perlinNoise } from "../../libs/perlinNoise.js";

var canvas, ctx, animate;
const font = new Font();
var noise = perlinNoise();

var obstacles = [];
var obstacleN = 0;
var player;
var gameCycles = 0;
var isPaused = false;
var useNoise = true, PPC = 5;

function loop() {
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isPaused || !player.isAlive) {
        // ----- PAUSED or DEAD

        // Display static obstacles
        for (const obstacle of obstacles) {
            obstacle.state = Obstacle.State.DIM;
            obstacle.display(ctx);
        }

        // Text
        font.size = 30;
        ctx.font = font.toString();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const txt = isPaused ?
            "Press [p] to resume" :
            "Game Over\nScore: " + player.score;
        ctx.fillStyle = "green";
        ctx.fillText(txt, canvas.width / 2, canvas.height / 2);
    } else {
        // ----- PLAYING and ALIVE
        gameCycles++;

        // Add obstacle
        if (gameCycles % Obstacle.spawnEvery == 0) {
            obstacles.push(createObstacle());
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            // Is obstacle off-screen?
            if (obstacles[i].offscreen()) {
                obstacles.splice(i, 1);
                continue;
            }

            // Collision detection - player hit an obstacle?
            if (obstacles[i].hits(player)) {
                player.die();
                break;
            }

            // Player past pillar?
            if (obstacles[i].state == Obstacle.State.NORMAL && obstacles[i].past(player)) {
                player.incScore();
                obstacles[i].state = Obstacle.State.PAST;
            }

            // Update & stuff
            obstacles[i].update();
            obstacles[i].display(ctx);
        }

        // Player updates
        player.update();
        player.display(ctx);

        // [score]
        ctx.fillStyle = "#ff00ff";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        font.size = 20;
        ctx.font = font.toString();
        ctx.fillText('Score: ' + player.score, 20, 20);
    }
}

/** Event: "keydown" */
function onKeyDown(event) {
    if (event.key == 'p') {
        isPaused = !isPaused;
    }

    if (!isPaused) {
        if (event.key === ' ' && player.isAlive) {
            player.jump();
        } else if (event.key === "Enter" && !player.isAlive) {
            newGame();
        }
    }
}

/** Create a new obstacle */
function createObstacle() {
    const g_min = Player.RADIUS * 8, g_max = canvas.height / 3;
    const gap = Math.floor(Math.random() * (g_max - g_min)) + g_min;
    const cy_min = 50, cy_max = canvas.height - 50;
    const cy = useNoise ?
        (noise(obstacleN / PPC, Math.sin(obstacleN) * 10) + 1) / 2 * (cy_max - cy_min) + cy_min :
        Math.floor(Math.random() * (cy_max - cy_min)) + cy_min;
    const w_min = 10, w_max = 20;
    const w = Math.floor(Math.random() * (w_max - w_min)) + w_min;

    obstacleN++;
    return new Obstacle(gap, canvas.width + 10, cy, w, canvas.height);
}

/** Restart game */
function newGame() {
    obstacles.length = 0;
    gameCycles = 0;
    obstacles.push(createObstacle());
    player.ready();
}

function main() {
    Sounds.create('splat', './assets/splat.mp3');
    Sounds.create('blip', './assets/blip.mp3');

    // Load canvas
    const container = document.getElementById("canvas-container");
    canvas = document.createElement("canvas");
    canvas.width = window.innerWidth - 150;
    canvas.height = window.innerHeight - 50;
    container.appendChild(canvas);
    canvas.style.border = '1px solid black';
    ctx = canvas.getContext("2d");

    // Initialise player
    player = new Player((canvas.width / Player.RADIUS) * 3, canvas.height / 3, canvas.height);

    // Create animaton loop
    animate = createAnimation();
    animate.setFPS(45);
    animate.start(loop);

    // Add events to HTML
    const inpSound = document.getElementById("inp-sound");
    inpSound.checked = true;
    inpSound.addEventListener("click", () => inpSound.checked ? Sounds.enable() : Sounds.disable());

    const inpFrameRate = document.getElementById("inp-frameRate");
    inpFrameRate.value = animate.getFPS();
    inpFrameRate.addEventListener("change", ev => animate.setFPS(+inpFrameRate.value));

    const inpRadius = document.getElementById('player-radius');
    inpRadius.value = Player.RADIUS;
    inpRadius.addEventListener('change', () => Player.RADIUS = +inpRadius.value);

    const inpObsSpeed = document.getElementById('obs-speed');
    inpObsSpeed.value = Obstacle.defaultSpeed;
    inpObsSpeed.addEventListener('change', () => Obstacle.defaultSpeed = +inpObsSpeed.value);

    const inpPPC = document.getElementById("ppc");
    inpPPC = PPC;
    inpPPC.addEventListener("change", () => PPC = +inpPPC.value);

    const inpObsSpawning = document.getElementById('obs-spawn');
    inpObsSpawning.value = Obstacle.spawnEvery;
    inpObsSpawning.addEventListener('change', () => Obstacle.spawnEvery = +inpObsSpeed.value);

    document.getElementById("obs-noise").addEventListener("click", () => useNoise = true);
    document.getElementById("obs-rand").addEventListener("click", () => useNoise = false);

    const inpGravity = document.getElementById('player-gravity');
    inpGravity.value = player.gravity;
    inpGravity.addEventListener('change', () => player.gravity = +inpGravity.value);

    const inpLift = document.getElementById('player-lift');
    inpLift.value = player.lift;
    inpLift.addEventListener('change', () => player.lift = +inpLift.value);

    document.body.addEventListener("keydown", onKeyDown);
}

window.addEventListener("load", main);