import { Pong } from "./Pong.js";
import { Sounds } from "/libs/Sound.js";

function main() {
  // Load sounds
  Sounds.create("hit", "assets/hit.wav");
  Sounds.create("miss", "assets/miss.wav");

  // Create canvas
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Create and initiate game
  const game = new Pong(canvas.width, canvas.height);
  let paused = false;
  game.ball.vx = 3;
  game.ball.vy = 1;

  const MOVE_DELTA = 2; // Pixels to move per frame if key is pressed
  const keysPressed = new Set(); // Set of all keys currently pressed
  document.body.addEventListener("keydown", (e) => {
    keysPressed.add(e.key);
    if (e.key === " ") {
      if (paused) {
        paused = false;
        loop();
      } else {
        paused = true;
      }
    }
  });
  document.body.addEventListener("keyup", (e) => {
    keysPressed.delete(e.key);
  });

  // Render loop
  function loop() {
    if (paused) {
      ctx.fillStyle = "#ededed99";
      let w = 10, h = 40;
      ctx.fillRect(canvas.width / 2 - w * 1.5, 10, w, h);
      ctx.fillRect(canvas.width / 2 + w * 0.5, 10, w, h);
    } else {
      // Respond to keys pressed
      if (keysPressed.has("w")) game.moveBat(-MOVE_DELTA, false);
      if (keysPressed.has("s")) game.moveBat(MOVE_DELTA, false);
      if (keysPressed.has("ArrowUp")) game.moveBat(-MOVE_DELTA, true);
      if (keysPressed.has("ArrowDown")) game.moveBat(MOVE_DELTA, true);

      // Update the game
      const code = game.update();
      switch (code) {
        case 1:
        case 3:
          Sounds.play("hit");
          break;
        case 2:
          Sounds.play("miss");
          break;
      }

      // Draw the game
      let oc = game.draw();
      ctx.drawImage(oc, 0, 0);

      requestAnimationFrame(loop);
    }
  }

  loop();
  paused = true;
}

window.addEventListener("load", main);