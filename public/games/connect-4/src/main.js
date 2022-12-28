import { Sounds } from "/libs/Sound.js";
import { extractCoords } from "/libs/util.js";
import { Grid } from "./grid.js";

var canvas, ctx;

var grid;

const html_whosGo = document.getElementById('whos-go');
const html_newGame = document.getElementById('new-game');

function main() {
  Sounds.create('insertCounter', './assets/drop.mp3');
  Sounds.create('insertCounters', './assets/drop-multiple.mp3');
  Sounds.create('tada', './assets/tada.mp3');

  html_newGame.addEventListener('click', () => {
    grid.reset();
    Sounds.play('insertCounters');
  });

  // TODO: make these variable?
  const d = 120, w = 7, h = 6;

  canvas = document.createElement('canvas');
  canvas.width = d * w;
  canvas.height = d * h;
  let container = document.getElementById("canvas-container");
  container.appendChild(canvas);
  ctx = canvas.getContext("2d");

  container.addEventListener("mousedown", onMouseDown);
  container.addEventListener("mousemove", ev => {
    let [x, y] = extractCoords(ev);
    Grid.mouseX = x;
    Grid.mouseY = y;
  });
  document.getElementById("sound-enable").addEventListener("click", Sounds.enable);
  document.getElementById("sound-disable").addEventListener("click", Sounds.disable);

  grid = new Grid(canvas.width, canvas.height, w, h, 15);

  (function loop() {
    draw();
    requestAnimationFrame(loop);
  })();
}

function draw() {
  ctx.fillStyle = "rgb(50, 55, 250)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  grid.display(ctx);
  html_whosGo.innerText = grid.isRedsGo ? "Red" : "Yellow";
}

// Place a counter
function onMouseDown() {
  const slot = grid.insertCounter(Grid.mouseX, Grid.mouseY);

  if (slot) {
    // Check win...
    const win = grid.checkWin();

    if (win) {
      grid.gameover();
    }
  }
}

window.addEventListener("load", main);