import { Sounds } from "../../libs/Sound.js";
import { Font } from "../../libs/Font.js";
import { loadImage, extractImage, extractCoords } from "../../libs/util.js";
import { Cell } from "./cell.js";

var container, canvas, ctx;
var font = new Font();

var w = 50;

var gameInProgress = false;
var gameover = false;

var game = {
  cols: 0,
  rows: 0,
  totalMines: 60,
  grid: undefined,
};
window.game = game;

var spritesheet;

var gameOverTimeout;

var inputCellWidth;
var inputMineCount;

var elTimer;
var timeStart = 0, timeEnd = -1;

async function main() {
  // Create canvas
  container = document.getElementById("container");
  canvas = document.createElement("canvas");
  container.appendChild(canvas);
  canvas.width = window.innerHeight - 5;
  canvas.height = canvas.width;
  canvas.style.borderRight = "1px solid black";
  ctx = canvas.getContext("2d");

  game.rows = Math.floor(canvas.height / w);
  game.cols = Math.floor(canvas.width / w);

  // HTML inputs
  inputCellWidth = document.getElementById('cell-width');
  inputMineCount = document.getElementById('mine-count');
  elTimer = document.getElementById('timer');
  elTimer.innerText = "-";

  // Load assets
  spritesheet = await loadImage("./assets/sprites.png");
  Sounds.create("explosion", "./assets/explode.wav");
  Sounds.create("tada", "./assets/tada.mp3");
  Cell.img = {
    spritesheet
  };

  Cell.img.hiddenSquare = extractImage(spritesheet, 0, 39, 16, 16);
  Cell.img.flaggedSquare = extractImage(spritesheet, 16, 39, 16, 16);
  Cell.img.explodedMine = extractImage(spritesheet, 33, 39, 16, 16);
  Cell.img.mine = extractImage(spritesheet, 64, 39, 16, 16);

  // This array will contain numbers 0 (empty) -> 8 (bomb indication)
  Cell.img.squareCount = [];
  for (let i = 0; i <= 8; i++) {
    const x = i * 16;
    Cell.img.squareCount.push(extractImage(spritesheet, x, 23, 16, 16));
  }

  setCellWidth(w);
  setMineCount(game.totalMines);

  // Event listeners
  container.addEventListener("mousedown", onMouseDown);
  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-end").addEventListener("click", () => gameover = true);
  inputCellWidth.addEventListener("change", () => setCellWidth(+inputCellWidth.value));
  inputMineCount.addEventListener("change", () => setMineCount(+inputMineCount.value));

  // Event loop
  (function loop() {
    draw();
    requestAnimationFrame(loop);
  })();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameInProgress) {
    font.size = 30;
    ctx.font = font.toString();
    ctx.fillStyle = "rgb(255, 127, 0)";
    ctx.fillText("Click 'start' to begin a game...", canvas.width / 3, canvas.height / 2);
    elTimer.innerText = "-";
  } else {
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#ffffff";

    let onlyMines = true;
    for (let i = 0; i < game.cols; i++) {
      for (let j = 0; j < game.rows; j++) {
        game.grid[i][j].show(ctx);

        if (!game.grid[i][j].revealed && !game.grid[i][j].isMine) onlyMines = false;
      }
    }

    if (!gameover && onlyMines) {
      gameOver();
      Sounds.play("tada");
      ctx.fillStyle = "#969696aa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      font.size = 32;
      ctx.font = font.toString();
      ctx.fillStyle = "#00ff00";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText('Swept!', canvas.width / 2, canvas.height / 2);

      say('Field successfully swept! I have been defeated, next time I will get you!!');
    } else if (gameover) {
      ctx.fillStyle = "#969696aa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      font.size = 32;
      ctx.font = font.toString();
      ctx.fillStyle = "#ff0000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      say('Hit a mine! Game over, Game over, Game over, Game over.');
      elTimer.innerText = '-';
    } else {
      timeEnd = Date.now();
    }
    elTimer.innerText = Math.round((timeEnd - timeStart) / 1000).toLocaleString("en-GB");
  }
}

function onMouseDown(ev) {
  if (gameInProgress) {
    const [mouseX, mouseY] = extractCoords(ev);
    let col = Math.floor(mouseX / w);
    let row = Math.floor(mouseY / w);

    if (game.grid == null || game.grid[col] == null || game.grid[col][row] == null) return;

    let cell = game.grid[col][row];

    if (ev.button === 0) {
      // Reveal spot
      if (cell.hasFlag) {
        say('Cannot reveal a flagged cell');
        return;
      }
      if (cell.isMine) {
        cell.mineExploded = true;
        Sounds.play("explosion");
        gameOver();
      } else if (!cell.revealed) {
        cell.reveal();
      }
    } else if (ev.button === 2) {
      if (cell.revealed) {
        say('Cannot flag a revealed cell');
        return;
      }
      // Toggle flag
      cell.hasFlag = !cell.hasFlag;
    }
  }
}

function setCellWidth(value) {
  value = +value;
  if (isNaN(value)) return;
  if (value < 10) value = 10;
  if (value > canvas.width / 2) value = canvas.width / 2;

  w = value;
  game.cols = Math.floor(canvas.width / w);
  game.rows = Math.floor(canvas.height / w);

  inputCellWidth.value = value;
  inputCellWidth.setAttribute('max', canvas.width / 2);
}

function setMineCount(value) {
  value = +value;
  if (isNaN(value)) return;
  if (value < 0) value = 0;
  if (value > game.cols * game.cols) value = game.cols * game.cols;

  game.totalMines = value;
  inputMineCount.value = game.totalMines;
}

// Start a game
function startGame() {
  if (gameOverTimeout != undefined) clearTimeout(gameOverTimeout);
  prepGrid();
  gameInProgress = true;
  gameover = false;
  timeStart = Date.now();
  timeEnd = timeStart;
}

// Prepare game grid
function prepGrid() {
  // Check that cell width is O.K.
  if (w < 10) w = 10;
  if (w > canvas.width / 2) w = canvas.width / 2;

  // Check that total mines is O.K. and there aren't too many for the map
  if (game.totalMines < 0) game.totalMines = 0;
  if (game.totalMines > game.cols * game.cols) game.totalMines = game.cols * (game.cols / 2);

  say('I am coming to destroy you.  There is no escape!');

  game.grid = new Array(game.cols);

  for (let i = 0; i < game.cols; i++) {
    game.grid[i] = new Array(game.rows);
    for (let j = 0; j < game.rows; j++) {
      game.grid[i][j] = new Cell(game, i, j, w);
    }
  }

  // Pick mine spots
  for (let n = 0; n < game.totalMines; n++) {
    let i = Math.floor(Math.random() * game.cols);
    let j = Math.floor(Math.random() * game.rows);

    if (game.grid[i][j].isMine) {
      // If already a mine, decrement n and try again
      n--;
    } else {
      game.grid[i][j].isMine = true;
    }
  }

  // Load neighbors
  for (let i = 0; i < game.cols; i++) {
    for (let j = 0; j < game.rows; j++) {
      game.grid[i][j].checkNeighbors();
    }
  }

  return true;
}

// Game has ended
function gameOver() {
  gameover = true;
  for (let i = 0; i < game.cols; i++) {
    for (let j = 0; j < game.rows; j++) {
      game.grid[i][j].revealed = true;
    }
  }
}

function say(speech) {
  return;
  let msg = new SpeechSynthesisUtterance();
  msg.lang = 'de-DE';
  msg.text = speech;
  window.speechSynthesis.speak(msg);
}

window.addEventListener("load", main);