import { createSocket, getTokenData, getUserInfo } from "/assets/socket-utils.js";
import Popup from "/libs/Popup.js";

//#region Socket
const socket = createSocket("join");

socket.on("game-info", payload => {
  load(payload.name, payload.data, payload.headers, payload.createNew); // Load main content
  socket.emit("my-games"); // Request list of my games
});

// A game has been created
socket.on("create-game", id => {
  const P = new Popup("Created Game");
  P.insertAdjacentHTML("beforeend", `<p>Game ID: <code>${id}</code></p>`);
  P.show();
});
//#endregion

/** Request to join a foreign game: emits event "join-game" */
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
  span.insertAdjacentHTML("beforeend", "<span>Game Name</span>&nbsp; ");
  const inputGameName = document.createElement("input");
  inputGameName.type = "text";
  inputGameName.placeholder = "Game Name";
  span.appendChild(inputGameName);
  span.insertAdjacentHTML("afterend", "<br>");

  span = document.createElement("span");
  div.appendChild(span);
  span.insertAdjacentHTML("beforeend", "<span><abbr title='For security purposes'>Owner's Username</abbr></span>&nbsp; ");
  const inputOwnerName = document.createElement("input");
  inputOwnerName.type = "text";
  inputOwnerName.placeholder = "Owner's Username";
  span.appendChild(inputOwnerName);
  span.insertAdjacentHTML("afterend", "<br>");

  div.insertAdjacentHTML("beforeend", "<br>");

  span = document.createElement("span");
  div.appendChild(span);
  const btn = document.createElement("button");
  btn.classList.add("fancy");
  btn.innerText = "Join";
  btn.addEventListener("click", () => {
    const gid = inputID.value.trim();
    const gname = inputGameName.value.trim();
    const username = inputOwnerName.value.trim();

    socket.emit("join-game", {
      id: gid,
      name: gname,
      owner: username,
    });
  });
  span.appendChild(btn);

  P.show();
  inputID.focus();
}

/** Populate a <tbody> element with games, with custom table headers provided */
function populateMyGames(games, headers, tbody) {
  const props = Object.keys(headers); // Extract properties
  tbody.innerHTML = "";
  games.forEach((game) => {
    const tr = document.createElement("tr");
    tr.insertAdjacentHTML("beforeend", `<td>${game.name}</td>`);
    tr.insertAdjacentHTML("beforeend", `<td><small><code>${game.id}</code></small></td>`);
    // Dynamic data from `headers`
    for (let prop of props) {
      tr.insertAdjacentHTML("beforeend", `<td>${game[prop]}</td>`);
    }
    // Join game
    let td = document.createElement("td");
    const btnJoin = document.createElement("button");
    btnJoin.classList.add("fancy");
    btnJoin.innerText = 'Join';
    btnJoin.addEventListener("click", () => socket.emit("join-my-game", game.id));
    td.appendChild(btnJoin);
    // Delete game
    const btnDelete = document.createElement("button");
    btnDelete.classList.add("fancy");
    btnDelete.innerHTML = '&#128465;';
    btnDelete.addEventListener("click", () => {
      socket.emit("delete-game", game.id);
    });
    td.appendChild(btnDelete);
    tr.appendChild(td);
    tbody.appendChild(tr);
  });
}

/** Popup to create a game */
function createGame(config) {
  const P = new Popup("Create Game");

  // Game name
  const inputName = document.createElement("input");
  inputName.type = "text";
  inputName.placeholder = "Game Name";
  P.insertAdjacentElement("beforeend", inputName);
  P.insertAdjacentHTML("beforeend", "<br>");

  // Dynamic
  for (let [, obj] of Object.entries(config)) {
    let el;
    if (obj.type === "select") {
      const select = el = document.createElement("select");
      obj.values.forEach(({ value, text }) => select.insertAdjacentHTML("beforeend", `<option value="${value}">${text}</option>`));
      obj.getValue = () => +select.value;
    } else {
      const input = el = document.createElement("input");
      input.type = "text";
      if (obj.placeholder !== undefined) input.placeholder = obj.placeholder;
      if (obj.value !== undefined) input.value = obj.value;
      obj.getValue = () => input.value;
    }
    let p = document.createElement("p");
    if (obj.text !== undefined) p.insertAdjacentHTML("beforeend", `<span>${obj.text}</span> &nbsp;`);
    p.appendChild(el);
    P.insertAdjacentElement("beforeend", p);
  }

  P.insertAdjacentHTML("beforeend", "<br><br>");
  const btn = document.createElement("button");
  btn.classList.add("fancy");
  btn.innerText = "Create";
  btn.addEventListener("click", () => {
    const name = inputName.value.trim();
    if (name.length > 0) {
      // Populate dynamic fields
      const fields = {};
      for (let [key, val] of Object.entries(config)) {
        fields[key] = val.getValue();
      }
      // Send request
      socket.emit("create-game", {
        name,
        fields,
      });
      P.hide();
    }
  });
  P.insertAdjacentElement("beforeend", btn);
  P.show();
  inputName.focus();
}

/** Called with game info */
function load(name, game, headers, createNew) {
  // Load image icon
  const imgIcon = document.getElementById("game-icon");
  const iconPath = '/games/' + name + '/' + (game.icon ? game.icon : 'icon.png');
  imgIcon.src = iconPath;
  const linkIcon = document.querySelector("link[rel~='icon']");
  linkIcon.href = iconPath;

  // Set title
  document.title = "Join Game: " + game.name;
  const h1Title = document.getElementById("game-title");
  h1Title.innerText = game.name;

  const content = document.getElementById("content");

  // Join External Game
  let p = document.createElement("p");
  const btnJoin = document.createElement("button");
  btnJoin.classList.add("fancy");
  btnJoin.innerText = "Join Game";
  btnJoin.addEventListener("click", () => requestJoinGame());
  p.appendChild(btnJoin);
  content.appendChild(p);

  // Listen for updated game list
  socket.on("my-games", games => {
    populateMyGames(games, headers, tbodyGames);
  });

  // My games
  content.insertAdjacentHTML("beforeend", "<h3>My Games</h3>");
  p = document.createElement("p");
  const btnCreate = document.createElement("button");
  btnCreate.classList.add("fancy");
  btnCreate.innerText = "Create Game";
  btnCreate.addEventListener("click", () => createGame(createNew));
  p.appendChild(btnCreate);
  content.appendChild(p);

  const divMyGames = document.createElement("div");
  content.append(divMyGames);
  const tblMyGames = document.createElement("table");
  tblMyGames.classList.add("bordered", "centre");
  divMyGames.appendChild(tblMyGames);
  let thead = tblMyGames.createTHead(), tr = document.createElement("tr");
  thead.appendChild(tr);
  tr.insertAdjacentHTML("beforeend", "<th>Name</th>");
  tr.insertAdjacentHTML("beforeend", "<th>ID</th>");
  // Dynamic headers
  for (let [, header] of Object.entries(headers)) {
    tr.insertAdjacentHTML("beforeend", `<th>${header}</th>`);
  }
  tr.insertAdjacentHTML("beforeend", "<th></th>");
  const tbodyGames = tblMyGames.createTBody();
  populateMyGames([], headers, tbodyGames);
}

async function main() {
  // Load
  const tdata = await getTokenData();
  const user = await getUserInfo();

  const params = new URLSearchParams(location.search);
  if (params.has("kicked")) new Popup("Kicked").insertAdjacentText("beforeend", "You were kicked from the game by the owner.").show();

  // Populate user info
  const divUserStatus = document.getElementById("user-status");
  divUserStatus.innerHTML = "";
  const em = document.createElement("em");
  em.innerText = user.Username;
  divUserStatus.appendChild(em);
}

window.addEventListener("load", main);