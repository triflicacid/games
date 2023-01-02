import { io } from "https://cdn.socket.io/4.3.0/socket.io.esm.min.js";
import Popup from "/libs/Popup.js";
import { setupUserSocket, getTokenData, getUserInfo } from "/assets/user.js";

//#region Socket
const socket = io(undefined, {
  query: {
    src: 'uno/index',
  },
});
socket.on("redirect", url => (window.location.href = url));
socket.on("popup", ({ title, message }) => {
  new Popup(title).insertAdjacentHTML("beforeend", `<p>${message}</p>`).show();
});
setupUserSocket(socket);
//#endregion

var currentRequestPopup = null;

/** Request to join a foreign game */
function requestJoinGame() {
  const P = new Popup("Join Game");

  let div = document.createElement("div");
  P.insertAdjacentElement("beforeend", div);

  // Game ID
  let span = document.createElement("span");
  div.appendChild(span);
  span.insertAdjacentHTML("beforeend", "<span>Game ID</span>&nbsp; ");
  const inputID = document.createElement("input");
  inputID.type = "text";
  inputID.placeholder = "Game ID";
  span.appendChild(inputID);
  span.insertAdjacentHTML("afterend", "<br>");

  span = document.createElement("span");
  div.appendChild(span);
  span.insertAdjacentHTML("beforeend", "<span><abbr title='For security purposes'>Owner's Username</abbr></span>&nbsp; ");
  const inputName = document.createElement("input");
  inputName.type = "text";
  inputName.placeholder = "Owner's Username";
  span.appendChild(inputName);
  span.insertAdjacentHTML("afterend", "<br>");

  div.insertAdjacentHTML("beforeend", "<br>");
  const spanError = document.createElement("span");
  spanError.classList.add("error");
  div.appendChild(spanError);
  div.insertAdjacentHTML("beforeend", "<br><br>");

  span = document.createElement("span");
  div.appendChild(span);
  const btn = document.createElement("button");
  btn.classList.add("fancy");
  btn.innerText = "Join";
  const btnOnClick = () => {
    const gid = inputID.value.trim();
    if (gid.length === 0) {
      inputID.classList.add("error");
      return;
    } else {
      inputID.classList.remove("error");
    }

    const username = inputName.value.trim();
    if (username.length === 0) {
      inputName.classList.add("error");
      return;
    } else {
      inputName.classList.remove("error");
    }

    spanError.innerText = "";
    inputID.classList.remove("error");
    inputName.classList.remove("error");

    socket.emit("join-game", {
      id: gid,
      owner: username,
    });
  };
  btn.addEventListener("click", () => currentRequestPopup.btnOnClick());
  span.appendChild(btn);

  currentRequestPopup = {
    popup: P,
    inputID,
    inputName,
    spanError,
    btnOnClick,
  };

  P.show();
}

function responseJoinGame(data) {
  if (data.error) {
    if (data.status === 1) {
      currentRequestPopup.spanError.innerText = "Invalid game ID";
      currentRequestPopup.inputID.classList.add("error");
    } else if (data.status === 2) {
      currentRequestPopup.spanError.innerText = "Owner's Username is incorrect";
      currentRequestPopup.inputName.classList.add("error");
    } else if (data.status === 3) {
      currentRequestPopup.spanError.innerText = "Game is Full";
    } else {
      currentRequestPopup.spanError.innerText = "An unknown error has occured";
    }
  } else {
    window.location.href = data.url;
  }
}

/** Join a game owned by me */
function requestJoinMyGame(id) {
  socket.emit("join-my-game", id);
}

/** Delete a game */
function deleteGame(id) {
  socket.emit("delete-game", id);
}

function populateMyGames(table, gameArray) {
  let tbody = table.querySelector("tbody");
  tbody.innerHTML = "";
  gameArray.forEach((game) => {
    const tr = document.createElement("tr");
    tr.insertAdjacentHTML("beforeend", `<td>${game.name}</td>`);
    tr.insertAdjacentHTML("beforeend", `<td><small><code>${game.id}</code></small></td>`);
    tr.insertAdjacentHTML("beforeend", `<td><code>${game.players}/${game.max}</code></td>`);
    // Join game
    let td = document.createElement("td");
    const btnJoin = document.createElement("button");
    btnJoin.classList.add("fancy");
    btnJoin.innerText = 'Join';
    btnJoin.addEventListener("click", () => requestJoinMyGame(game.id));
    td.appendChild(btnJoin);
    // Delete game
    const btnDelete = document.createElement("button");
    btnDelete.classList.add("fancy");
    btnDelete.innerHTML = '&#128465;';
    btnDelete.addEventListener("click", () => deleteGame(game.id));
    td.appendChild(btnDelete);
    tr.appendChild(td);
    tbody.append(tr);
  });
}

function createGame() {
  const P = new Popup("Create Game");
  const inputName = document.createElement("input");
  inputName.type = "text";
  inputName.placeholder = "Game Name";
  P.insertAdjacentElement("beforeend", inputName);
  P.insertAdjacentHTML("beforeend", "<p>Select number of players</p>");
  const select = document.createElement("select");
  for (let n = 2; n <= 6; n++) select.insertAdjacentHTML("beforeend", `<option value='${n}'>${n}</option>`);
  select.value = 4;
  P.insertAdjacentElement("beforeend", select);
  P.insertAdjacentHTML("beforeend", "<br><br>");
  const btn = document.createElement("button");
  btn.classList.add("fancy");
  btn.innerText = "Create";
  btn.addEventListener("click", () => {
    const name = inputName.value.trim();
    if (name.length > 0) {
      socket.emit("create-game", {
        name,
        players: +select.value,
      });
      P.hide();
    }
  });
  P.insertAdjacentElement("beforeend", btn);
  P.show();
}

function createdGame(gameID) {
  const P = new Popup("Created Game");
  P.insertAdjacentHTML("beforeend", `<p>Game ID: <code>${gameID}</code></p>`);
  P.show();
}

async function main() {
  await getTokenData();
  const user = await getUserInfo();

  // Messages?
  const params = new URLSearchParams(location.search);
  if (params.has("kicked")) new Popup("Kicked").insertAdjacentText("beforeend", `You were kicked by the owner`).show();

  // Setup socket events
  socket.on("my-games", list => {
    populateMyGames(tblMyGames, list);
  });
  socket.on("create-game", id => {
    createdGame(id);
  });
  socket.on("join-game", data => {
    responseJoinGame(data);
  });
  socket.emit("my-games"); // Request for list of all owned games.

  let div = document.createElement("div");
  div.classList.add("centre");
  document.body.appendChild(div);
  div.insertAdjacentHTML("beforeend", `<h1>UNO!</h1><img src='assets/favicon.ico' /><br><p><span>Please browse below for public games, or host your own</span><br><em>Signed in as ${user.Username}</em></p>`);

  // JOIN GAME
  let p = document.createElement("p");
  const btnJoin = document.createElement("button");
  btnJoin.classList.add("fancy");
  btnJoin.innerText = "Join Game";
  btnJoin.addEventListener("click", () => requestJoinGame());
  p.appendChild(btnJoin);
  div.appendChild(p);

  // MY GAMES
  div.insertAdjacentHTML("beforeend", "<h3>My Games</h3>");
  p = document.createElement("p");
  const btnCreate = document.createElement("button");
  btnCreate.classList.add("fancy");
  btnCreate.innerText = "Create Game";
  btnCreate.addEventListener("click", () => createGame());
  p.appendChild(btnCreate);
  div.appendChild(p);

  const divMyGames = document.createElement("div");
  div.append(divMyGames);
  const tblMyGames = document.createElement("table");
  tblMyGames.classList.add("bordered", "centre");
  divMyGames.appendChild(tblMyGames);
  tblMyGames.insertAdjacentHTML("beforeend", `<thead><tr><th>Name</th><th>ID</th></th><th>Players</th><th></th></tr></thead><tbody/>`);
  populateMyGames(tblMyGames, []);
}

window.addEventListener("load", main);