import { createSocket, getTokenData, getUserInfo } from "/assets/socket-utils.js";
import { DISPLAYMODE, Game } from "./Game.js";
import { loadSpritesheet, CARDS } from "./cards.js";
import { Sounds } from "/libs/Sound.js";
import Popup from "/libs/Popup.js";

//#region Socket
const socket = createSocket("uno");
socket.on("game-data", async (data) => {
  await load(canvasTarget, data);

  if (data.isOwner) {
    // Owner may kick people
    const btnKick = document.createElement("button");
    btnKick.classList.add("fancy");
    btnKick.innerText = "Kick Player";
    btnKick.addEventListener('click', clickKickPlayer);
    document.body.appendChild(btnKick);

    document.body.insertAdjacentHTML("beforeend", `&nbsp; | &nbsp; Game Locked: `);
    checkboxLocked = document.createElement("input");
    checkboxLocked.type = "checkbox";
    checkboxLocked.checked = !!data.locked;
    checkboxLocked.addEventListener("change", () => socket.emit("lock", checkboxLocked.checked));
    document.body.appendChild(checkboxLocked);
  }
});

socket.on("locked", bool => {
  checkboxLocked.checked = !!bool;
})
//#endregion

var canvasTarget, countTarget, gameIdTarget, game, checkboxLocked;

async function load(htmlTarget, data) {
  // == SOUNDS ==
  await Sounds.create("blip", "assets/sound/blip.mp3");
  await Sounds.create("error", "assets/sound/error.mp3");
  await Sounds.create("rainbow", "assets/sound/rainbow.mp3");
  await Sounds.create("tada", "assets/sound/tada.mp3");
  Game.spritesheet = await loadSpritesheet();

  // SETUP
  const canvas = document.createElement("canvas");
  canvas.style.border = "1px solid black";
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.8;
  htmlTarget.appendChild(canvas);
  let ctx = canvas.getContext("2d");

  game = new Game();
  game.init(data);
  let defaultMessageStack = [];
  gameIdTarget.innerHTML = data.name + " &mdash; " + data.id;
  document.title += ": " + data.name;

  //#region Load Socket Events
  // Update client count
  socket.on("client-count", count => {
    updateConnectedCount(count);
  });

  // Change a player's name
  socket.on("set-player", data => {
    game.players[data.slot] = data.value;
    render();
  });

  // Game error!
  socket.on("game-error", msg => {
    Sounds.play("error");
    console.log("GAME ERROR:", msg);
    render(msg);
    setTimeout(() => render(), 2000);
  });

  // Choose color
  socket.on("choose-color", () => {
    game.displayMode = DISPLAYMODE.PICK_COLOR;
    Sounds.play("blip");
    render();
  });
  // We chose a color for wildcard
  socket.on("chosen-color", color => {
    game.wildAccept = color;
    Sounds.play("blip");
    game.displayMode = DISPLAYMODE.GAME;
    render();
  });

  // Manipulate the message stack
  socket.on("push-msg", value => defaultMessageStack.push(value));
  socket.on("pop-msg", () => defaultMessageStack.pop());
  socket.on("set-msg", ({ index, value }) => (defaultMessageStack[index] = value));

  // Set player's hand
  socket.on("set-hand", ({ index, value }) => (game.hands[index] = value));

  // Set property of game
  socket.on("update", payload => {
    if (payload.props) {
      for (let prop in payload.props) {
        game[prop] = payload.props[prop];
      }
    }
    if (payload.render) render(payload.logText);
  });

  // Someone is on uno!!
  socket.on("alert-uno", index => {
    let mode = game.displayMode;
    game.displayMode = DISPLAYMODE.MESSAGE;
    defaultMessageStack.push(`${game.players[index]} IS ON UNO!!!`);
    let i = defaultMessageStack.length - 1;
    Sounds.play("rainbow");
    setTimeout(() => {
      defaultMessageStack.splice(i, 1);
      game.displayMode = mode;
      render();
    }, 2600);
    render();
  });

  // Someone has won!
  socket.on("alert-win", index => {
    game.winner = index;
    game.displayMode = DISPLAYMODE.MESSAGE;
    defaultMessageStack = [`${game.players[index]} Wins!`];
    Sounds.play("tada");
    render();
  });
  //#endregion

  function render(logText = undefined) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (Game.DARKMODE) {
      ctx.fillStyle = "#222222";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    game.display(ctx, canvas.width, canvas.height, logText || defaultMessageStack[defaultMessageStack.length - 1]);
  }

  const bb = canvas.getBoundingClientRect();
  canvas.addEventListener("mousemove", event => {
    // const x = event.clientX - bb.left, y = event.clientY - bb.top;
    // const over = game.getCardOver(x, y, canvas.width, canvas.height);
  });

  canvas.addEventListener("mousedown", event => {
    const x = event.clientX - bb.left, y = event.clientY - bb.top;
    const over = game.getCardOver(x, y, canvas.width, canvas.height);
    if (over) {
      socket.emit("handle-event", over);
    }
  });

  // // Act on discard pile card.
  // game.ptr = -1;
  // placeCardCollateral(game.discard[game.discard.length - 1], true);

  socket.emit("status-update"); // Request a status update
}

/** Update number of connected clients */
function updateConnectedCount(count) {
  countTarget.innerText = "Clients Connected: " + count;
}

/** Click on `Kick Player' button */
function clickKickPlayer() {
  if (game) {
    const P = new Popup("Kick Player");
    P.insertAdjacentHTML("beforeend", "<p>Select player to kick:</p>");
    let select = document.createElement("select");
    game.players.forEach((player, i) => {
      if (player) select.insertAdjacentHTML("beforeend", `<option value='${i}'>${player}</option>`);
    });
    P.insertAdjacentElement("beforeend", select);
    P.insertAdjacentHTML("beforeend", "<br><br>");

    const btnKick = document.createElement("button");
    btnKick.classList.add("fancy");
    btnKick.innerText = "Kick Selected";
    btnKick.addEventListener("click", () => {
      socket.emit("kick", +select.value);
    });
    P.insertAdjacentElement("beforeend", btnKick);

    const btnKickAll = document.createElement("button");
    btnKickAll.classList.add("fancy");
    btnKickAll.innerText = "Kick All";
    btnKickAll.addEventListener("click", () => {
      socket.emit("kick-all");
    });

    P.insertAdjacentElement("beforeend", btnKickAll);
    P.show();
  } else {
    console.warn("Game not loaded.");
  }
}

async function main() {
  let p = document.createElement("p");
  gameIdTarget = document.createElement("span");
  gameIdTarget.setAttribute("id", "game-id");
  p.appendChild(gameIdTarget);
  p.insertAdjacentText("beforeend", " | ");
  countTarget = document.createElement("span");
  p.appendChild(countTarget);
  document.body.appendChild(p);

  canvasTarget = document.createElement("div");
  document.body.appendChild(canvasTarget);
  canvasTarget.classList.add("game-wrapper");

  const btnLeave = document.createElement("button");
  btnLeave.classList.add("fancy");
  btnLeave.innerText = "Leave";
  btnLeave.addEventListener('click', () => socket.emit("leave-game"));
  document.body.appendChild(btnLeave);

  const tokenData = await getTokenData();
  const user = await getUserInfo();
}

window.addEventListener("load", main);