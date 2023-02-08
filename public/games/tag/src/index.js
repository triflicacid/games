import { Sounds } from "/libs/Sound.js";
import { Game } from "./Game.js";
import Popup from "/libs/Popup.js";

/** Open the settings popup */
function openSettingsPopup() {
  const popup = new Popup("Settings");

  // TARGET MOVEMENT SPEED
  let p = document.createElement("p");
  popup.insertAdjacentElement("beforeend", p);
  popup.insertAdjacentText("beforeend", "Target Movement: ");
  const inputMovTarget = document.createElement("input");
  inputMovTarget.type = "number";
  inputMovTarget.min = "0";
  inputMovTarget.value = targetDelta.toString();
  inputMovTarget.addEventListener("change", () => {
    const d = +inputMovTarget.value.trim();
    if (isFinite(d) && !isNaN(d)) targetDelta = d;
    inputMovTarget.value = targetDelta.toString();
  })
  popup.insertAdjacentElement("beforeend", inputMovTarget);
  popup.insertAdjacentText("beforeend", " px");

  // CROSSHAIR MOVEMENT SPEED
  p = document.createElement("p");
  popup.insertAdjacentElement("beforeend", p);
  popup.insertAdjacentText("beforeend", "Crosshair Movement: ");
  const inputMovCrosshair = document.createElement("input");
  inputMovCrosshair.type = "number";
  inputMovCrosshair.min = "0";
  inputMovCrosshair.value = crosshairDelta.toString();
  inputMovCrosshair.addEventListener("change", () => {
    const d = +inputMovCrosshair.value.trim();
    if (isFinite(d) && !isNaN(d)) crosshairDelta = d;
    inputMovCrosshair.value = crosshairDelta.toString();
  })
  popup.insertAdjacentElement("beforeend", inputMovCrosshair);
  popup.insertAdjacentText("beforeend", " px");

  // FIRE COOLDOWN
  p = document.createElement("p");
  popup.insertAdjacentElement("beforeend", p);
  popup.insertAdjacentText("beforeend", "Fire Cooldown: ");
  const inputCooldown = document.createElement("input");
  inputCooldown.type = "number";
  inputCooldown.min = "0";
  inputCooldown.value = (game.cooldown / 1000).toString();
  inputCooldown.addEventListener("change", () => {
    const d = +inputCooldown.value.trim();
    if (isFinite(d) && !isNaN(d)) game.cooldown = d * 1000;
    inputCooldown.value = (game.cooldown / 1000).toString();
  })
  popup.insertAdjacentElement("beforeend", inputCooldown);
  popup.insertAdjacentText("beforeend", " s");

  // TARGET RADIUS
  p = document.createElement("p");
  popup.insertAdjacentElement("beforeend", p);
  popup.insertAdjacentText("beforeend", "Target Radius: ");
  const inputRadius = document.createElement("input");
  inputRadius.type = "number";
  inputRadius.min = "5";
  inputRadius.value = game.targetRadius.toString();
  inputRadius.addEventListener("change", () => {
    const r = +inputRadius.value.trim();
    if (isFinite(r) && !isNaN(r) && r > 5) game.targetRadius = r;
    inputRadius.value = game.targetRadius.toString();
  })
  popup.insertAdjacentElement("beforeend", inputRadius);
  popup.insertAdjacentText("beforeend", " px");

  // TARGET STRATA
  p = document.createElement("p");
  popup.insertAdjacentElement("beforeend", p);
  popup.insertAdjacentText("beforeend", "Target Strata: ");
  const inputStrata = document.createElement("input");
  inputStrata.type = "number";
  inputStrata.min = "1";
  inputStrata.value = game.targetStratas.toString();
  inputStrata.addEventListener("change", () => {
    const s = +inputStrata.value.trim();
    if (isFinite(s) && !isNaN(s) && s > 0) game.targetStratas = s;
    inputStrata.value = game.targetStratas.toString();
  })
  popup.insertAdjacentElement("beforeend", inputStrata);

  popup.show();
}

/** Render the game */
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = game.draw();
  ctx.drawImage(img, 0, 0);
}

/** Game loop - game logic & rendering */
function loop() {
  // Move target
  let isP1 = game.crosshairPlayer === 1;
  if (keysPressed.has(isP1 ? "w" : "ArrowUp")) game.moveTarget(0, -targetDelta);
  if (keysPressed.has(isP1 ? "a" : "ArrowLeft")) game.moveTarget(-targetDelta, 0);
  if (keysPressed.has(isP1 ? "s" : "ArrowDown")) game.moveTarget(0, targetDelta);
  if (keysPressed.has(isP1 ? "d" : "ArrowRight")) game.moveTarget(targetDelta, 0);
  // Move crosshair
  if (keysPressed.has(isP1 ? "ArrowUp" : "w")) game.moveCrosshair(0, -crosshairDelta);
  if (keysPressed.has(isP1 ? "ArrowLeft" : "a")) game.moveCrosshair(-crosshairDelta, 0);
  if (keysPressed.has(isP1 ? "ArrowDown" : "s")) game.moveCrosshair(0, crosshairDelta);
  if (keysPressed.has(isP1 ? "ArrowRight" : "d")) game.moveCrosshair(crosshairDelta, 0);

  render();
  requestAnimationFrame(loop);
}

//#region Event Listeners
const keysPressed = new Set();
window.addEventListener("keydown", e => {
  if (e.key === " ") {  // Fire!
    let state = game.fire();
    if (state > 0) {
      Sounds.play("gunshot");
      if (state === 2) {
        setTimeout(() => Sounds.play("ding"), 100);
      }
    }
    console.log("Fire!");
  } else if (e.key === "c") {  // Setting popup
    openSettingsPopup();
  } else if (e.key === 'r') {  // Rotate players
    game.rotate();
  } else {
    keysPressed.add(e.key);
  }
});
window.addEventListener("keyup", e => {
  keysPressed.delete(e.key);
})
//#endregion

//#region Load Assets
window.Sounds = Sounds;
Sounds.create("ding", "assets/ding.mp3");
Sounds.create("gunshot", "assets/gunshot.wav");
//#endregion

const wrapper = document.createElement("div");
wrapper.classList.add("wrapper");
document.body.appendChild(wrapper);
const canvas = document.createElement("canvas");
canvas.width = window.innerWidth * 0.99;
canvas.height = window.innerHeight * 0.99;
wrapper.appendChild(canvas);
const ctx = canvas.getContext("2d");

var targetDelta = 2;
var crosshairDelta = 1.5;

const game = new Game(canvas.width, canvas.height);
console.log(game);

loop();