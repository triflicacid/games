import { createAnimation, loadImage } from "../../libs/util.js";
import { Sounds } from "../../libs/Sound.js";
import { State, Tetris } from "./Tetris.js";

var canvas, ctx, tetris;
var debug = true, oldState = State.Playing;
var softDropRows = 0; // Number of rows a piece is continuously soft-dropped
var animation;

/** Clear completed rows in tetris */
function clearLines() {
  let rows = tetris.gridClearRows();
  if (rows > 0) {
    draw();
    Sounds.play("clear-line");
  }
  return rows;
}

/** Hard-drop the current block in tetris */
function hardDrop() {
  let rows = 0;
  while (tetris.moveShape(0, 1)) rows++;
  if (rows > 0) {
    tetris.score += (tetris.level + 1) * rows * 2;
    Sounds.play("fall");
    draw();
  }
  return rows;
}

function draw() {
  tetris.display(ctx, canvas.width, canvas.height);

  if (debug) {
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.font = "12px Arial";
    ctx.fillStyle = "#FFFF00";
    ctx.fillText("[DEBUG ON]", 5, canvas.height - 5);
  }
}

function loop() {
  if (tetris.hasMovableShape()) {
    // Attempt to move shape down
    let ok = tetris.moveShape(0, 1);
    if (ok) {
      softDropRows++;
      draw();
    } else {
      // Cannot move down; freeze shape
      tetris.lockShape();
      // Add points accordint to soft-drop
      tetris.score += (tetris.level + 1) * softDropRows;
      softDropRows = 0;
    }
  } else {
    let ok = tetris.spawnShape();
    if (!ok) {
      gameover();
    }
    draw();
  }
}

function gameover() {
  tetris.state = State.Gameover;
  animation.stop();
  Sounds.play("gameover");
}

function restart() {
  tetris.reset();
  animation.start();
}

function keydown(event) {
  let ok = true; // If not okay, play error sound

  if (event.key === "p") { // Pause/resume
    let newState = tetris.state === State.Paused ? oldState : State.Paused;
    oldState = tetris.state;
    tetris.state = newState;
    Sounds.play("pause");
    if (oldState === State.Paused) {
      animation.start();
    } else {
      animation.stop();
    }
    draw();
  } else if (event.key === 'd') { // Toggle debug
    debug = !debug;
    draw();
  } else if (tetris.state === State.Playing) { // If playing...
    if (event.key === 'a') { // Roate anticlockwise
      ok = tetris.rotateShape(false);
      draw();
    } else if (event.key === 'b') { // Rotate clockwise
      ok = tetris.rotateShape(true);
      draw();
    } else if (event.key === "c") { // Hold shape
      ok = tetris.holdShape();
      if (ok) draw();
    } else if (event.key === "ArrowLeft") { // Move left
      ok = tetris.moveShape(-1, 0);
      if (ok) draw();
    } else if (event.key === "ArrowRight") { // Move right
      ok = tetris.moveShape(1, 0);
      if (ok) draw();
    } else if (event.key === " ") { // Drop block
      hardDrop();
    } else if (event.key === "p") { // Pause/resume
      let newState = tetris.state === State.Paused ? oldState : State.Paused;
      oldState = tetris.state;
      tetris.state = newState;
      draw();
    }

    // DEBUG KEYS
    else if (debug) {
      if (event.key === "ArrowUp") { // Move up
        ok = tetris.moveShape(0, -1);
        if (ok) draw();
      } else if (event.key === "ArrowDown") { // Move down
        ok = tetris.moveShape(0, 1);
        if (ok) draw();
      } else if (event.shiftKey && event.key === 'D') { // Forced draw
        draw();
      } else if (event.shiftKey && event.key === 'F') { // Freeze shape
        tetris.freezeShape();
      } else if (event.shiftKey && event.key === 'P') { // Stop loop
        if (animation.isActive()) {
          animation.stop();
          draw();
        } else {
          animation.start();
        }
        Sounds.play("pause");
      } else if (event.shiftKey && event.key === 'R') { // Restart
        tetris.reset();
        draw();
      } else if (event.key === 'Delete') { // Delete shape
        tetris.removeShape();
        draw();
      } else if (event.shiftKey && event.key === 'C') { // Clear lines
        clearLines();
      } else if (event.shiftKey && event.key === 'Q') { // Reset queue
        tetris.queue.length = 0;
        tetris.fillQueue();
        draw();
      } else if (event.shiftKey && event.key === 'G') { // Game over
        gameover();
        draw();
      } else if (event.shiftKey && event.key === 'S') { // Spawn in shape
        ok = tetris.spawnShape();
        draw();
      } else if (!isNaN(+event.key)) { // Spawn in specified shape
        ok = tetris.spawnShape(+event.key);
        draw();
      }
    }
  } else if (tetris.state === State.Gameover) { // If gameover...
    if (event.key === 'r') { // Restart game
      restart();
    }
  }

  if (!ok) Sounds.play("error");
}

async function main() {
  // Setup sounds
  Sounds.create("error", "assets/error.mp3");
  Sounds.create("fall", "assets/fall.mp3");
  Sounds.create("clear-line", "assets/clear-line.mp3");
  Sounds.create("gameover", "assets/gameover.mp3");
  Sounds.create("pause", "assets/pause.mp3");
  Sounds.create("music", "assets/music.mp3");
  // Sounds.disable();

  // Load images
  Tetris.gameoverImage = await loadImage("assets/gameover.png");

  // Create and setup canvas
  const container = document.createElement("div");
  container.classList.add("container");
  document.body.appendChild(container);

  canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  container.appendChild(canvas);
  ctx = canvas.getContext("2d");

  // Event listeners
  document.body.addEventListener("keydown", keydown);

  tetris = new Tetris();
  window.tetris = tetris;

  animation = createAnimation();
  animation.setFPS(4);
  animation.setFunction(loop);
  animation.start();
  draw();
}

window.Sounds = Sounds;

window.addEventListener("load", main);