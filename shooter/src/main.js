import { createAnimation } from "../../libs/util.js";
import { Ship } from "./ship.js";
import { Target } from "./target.js";

let ship;
let targets = [];

let score = 0;
let isKeyPressed = false, keyPressed;

let canvas, ctx;

function draw() {
    // If gameover, stop draw loop and show gameover screen
    if (ship.ammo < 0 || targets.length === 0) {
        ctx.fillStyle = "#c8c8c896";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = "center";
        ctx.font = "30px Arial";
        ctx.fillStyle = "red";
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = "yellow";
        ctx.font = "16px Arial";
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);

        return;
    }

    // 'Clear' background (set to RGB 50,50,50 [dark grey])
    ctx.fillStyle = "#323232";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Control for moving
    if (isKeyPressed) {
        if (keyPressed === "ArrowRight") {
            ship.move(1);
        } else if (keyPressed === "ArrowLeft") {
            ship.move(-1);
        }
    }

    ship.show(ctx);
    let hit = ship.updateBullets(targets);
    score += hit;

    // Show bullets
    ship.showBullets(ctx);

    // Spawn new targets
    for (let k = 0; k < hit; ++k) {
        let chance = Math.random();
        if (chance <= 0.05) {
            // 5% chance of nothing
        } else if (chance <= 0.7) {
            // 65% chance
            spawn(1);
        } else if (chance <= 0.9) {
            // 15% chance
            spawn(2);
        } else {
            // 5% chance
            spawn(3);
        }
    }

    // Loop through targets and move them
    for (let i = 0; i < targets.length; i++) {
        targets[i].move();

        // If target off bottom of screen...
        if (targets[i].y >= canvas.height + targets[i].r) {
            targets.splice(i, 1);
            i--;
            ship.ammo -= Ship.ammoLost;
        } else {
            targets[i].show(ctx);
        }
    }

    // Ammo & Score text
    ctx.fillStyle = "white";
    let d = 15;
    ctx.font = d + "px Arial";
    ctx.fillText("Score: " + score.toLocaleString("en-GB"), 2, d * 1.5);
    ctx.fillText("Ammo: " + ship.ammo.toLocaleString("en-GB"), 2, d * 3);
}

// Spawn 'count' number of targets
function spawn(count) {
    let min = 10, max = canvas.width - 10;
    for (let i = 0; i < count; i++) {
        const target = new Target(Math.floor(Math.random() * (max - min)) + min, 10);
        targets.push(target);
    }
}

function main() {
    const container = document.getElementById('container');
    canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    canvas.tabIndex = 0;
    canvas.focus();
    ctx = canvas.getContext("2d");
    container.appendChild(canvas);

    ship = new Ship(canvas.width / 2, canvas.height - 20, canvas.width);

    const min = 10, max = canvas.width - 10;
    for (let i = 0; i < 1; i++) {
        const target = new Target(Math.floor(Math.random() * (max - min)) + min, 70);
        targets.push(target);
    }

    canvas.addEventListener("keydown", event => {
        isKeyPressed = true;
        keyPressed = event.key;
        if (keyPressed === " ") {
            ship.shoot();
        }
    });
    canvas.addEventListener("keyup", event => {
        isKeyPressed = false;
        keyPressed = undefined;
    });

    const animate = createAnimation();
    animate.setFPS(40);
    animate.start(draw);
}

window.addEventListener("load", main);