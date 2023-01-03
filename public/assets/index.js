import Popup from "../libs/Popup.js";
import { createSocket, genToken, getUserInfo } from "/assets/socket-utils.js";

//#region Socket
const socket = createSocket("index");

socket.on("get-user-info", user => {
  gUser = user;
  populateUserInfo(user);
});

// Response from request to log in.
socket.on("user-login", user => {
  if (user) {
    if (loginPopup) loginPopup.popup.hide();
    gUser = user;
    populateUserInfo(user);
    populateGameList(gGames);
  } else {
    loginPopup.elMsg.innerText = "Invalid username or password.";
  }
});

// Response after request to create an account
socket.on("user-create", res => {
  if (res.error) {
    loginPopup.elMsg.innerText = res.message;
  } else {
    loginPopup.popup.hide();
    gUser = res.user;
    populateUserInfo(res.user);
    populateGameList(gGames);
  }
});
//#endregion

var loginPopup; // Object containing info about the login popup
var gUser = null, gGames;

/** List games from object */
function populateGameList(games) {
  const elGameList = document.getElementById("game-list");
  elGameList.innerHTML = "";

  for (const name in games) {
    const game = games[name], singleplayer = game.singleplayer ?? true;
    const div = document.createElement("div");
    if (!gUser && !singleplayer && !game.external) { // If not signed in and game requires multiplayer
      div.classList.add("disabled");
    }
    div.dataset.singleplayer = singleplayer;
    div.addEventListener("click", async () => {
      if (game.external) { // External link
        window.open(game.external);
      } else if (singleplayer) { // Join singleplayer game
        let url = "games/" + name + "/" + (game.target || "");
        window.open(url);
      } else { // Join multiplayer game -- common dashboard
        if (gUser) {
          let url = "games/join.html?" + (await genToken(name)) + "&game=" + name;
          window.open(url);
        } else {
          new Popup("Unable to Join Game")
            .insertAdjacentText("beforeend", `Cannot join ${game.name} -- you must be logged in to access multiplayer games.`)
            .show();
        }
      }
    });
    const iconPath = 'games/' + name + '/' + (game.icon ? game.icon : 'icon.png');
    div.insertAdjacentHTML("beforeend", `<span class='icon'><img src='${iconPath}' /></span>`);
    div.insertAdjacentHTML("beforeend", `<span class='name'>${game.name}${game.external ? '<img src=\'/assets/external.png\' />' : ''}</span>`);
    let span = document.createElement("span");
    span.classList.add("help");
    div.appendChild(span);
    const help = document.createElement("span");
    help.classList.add("link");
    span.appendChild(help);
    help.addEventListener("click", e => {
      window.open(`help/${name}`);
      e.stopPropagation();
    });
    help.innerHTML = "&#x1F6C8; Help";

    elGameList.appendChild(div);
  }
}

/** Populate user information in the banner */
function populateUserInfo(user) {
  const div = document.getElementById("user-status");
  div.innerHTML = "";
  if (user) {
    const em = document.createElement("em");
    em.innerText = user.Username;
    em.classList.add("link");
    em.addEventListener("click", () => clickUserInfo(user));
    div.appendChild(em);
    div.insertAdjacentHTML("beforeend", "<br>");
    const link = document.createElement("span");
    link.innerText = "Log out";
    link.classList.add("link");
    link.addEventListener("click", clickLogout);
    div.appendChild(link);
  } else {
    // Not logged in.
    div.insertAdjacentHTML("beforeend", `<em>Not logged in.</em><br>`);
    const link = document.createElement("span");
    link.innerText = "Log in";
    link.classList.add("link");
    link.addEventListener("click", clickLogin);
    div.appendChild(link);
  }
}

/** Popup containing user information */
function clickUserInfo(user) {
  const P = new Popup("User Information");

  let p = document.createElement("p");
  P.insertAdjacentElement("beforeend", p);
  p.insertAdjacentHTML("beforeend", "<span>Username:</span> &nbsp;");
  const inputUsername = document.createElement("input");
  inputUsername.type = "text";
  inputUsername.value = user.Username;
  p.appendChild(inputUsername);
  const btnUsername = document.createElement("button");
  btnUsername.classList.add("fancy");
  btnUsername.innerText = "Change";
  btnUsername.addEventListener("click", () => {
    const username = inputUsername.value.trim();
    if (username.length > 0 && username !== user.Username) {
      socket.emit("change-username", username);
      P.hide();
    }
  });
  p.appendChild(btnUsername);

  p = document.createElement("p");
  p.insertAdjacentHTML("beforeend", "<span>Password:</span> &nbsp;");
  P.insertAdjacentElement("beforeend", p);
  const inputPassword = document.createElement("input");
  inputPassword.type = "password";
  p.appendChild(inputPassword);
  const btnPassword = document.createElement("button");
  btnPassword.classList.add("fancy");
  btnPassword.innerText = "Change";
  btnPassword.addEventListener("click", () => {
    const password = inputPassword.value.trim();
    if (password.length > 0) {
      socket.emit("change-password", password);
      P.hide();
    }
  });
  p.appendChild(btnPassword);

  p = document.createElement("p");
  P.insertAdjacentElement("beforeend", p);
  const btnDelete = document.createElement("button");
  btnDelete.classList.add("fancy");
  btnDelete.innerText = "Delete Account";
  btnDelete.addEventListener("click", () => {
    P.hide();
    clickDeleteAccount();
  });
  p.appendChild(btnDelete);

  P.show();
}

/** Create login popup. Populate `loginPopup' */
function createLoginPopup() {
  const popup = new Popup();
  popup.setTitle("Log In");

  // Username
  const inputUsername = document.createElement("input");
  inputUsername.type = "text";
  inputUsername.placeholder = "Username";
  popup.insertAdjacentElement("beforeend", inputUsername);
  popup.insertAdjacentHTML("beforeend", "<br><br>");

  // Password
  const inputPassword = document.createElement("input");
  inputPassword.type = "password";
  inputPassword.placeholder = "Password";
  popup.insertAdjacentElement("beforeend", inputPassword);
  popup.insertAdjacentHTML("beforeend", "<br>");

  const elMsg = document.createElement("p");
  elMsg.classList.add("error");
  popup.insertAdjacentElement("beforeend", elMsg);

  // Log in button
  const login = document.createElement("button");
  login.type = "button";
  login.innerText = "Log In";
  popup.insertAdjacentElement("beforeend", login);
  login.addEventListener("click", () => {
    socket.emit("user-login", {
      username: inputUsername.value.trim(),
      password: inputPassword.value.trim(),
      when: Date.now(),
    });
    inputPassword.value = "";
  });

  // Create account
  popup.insertAdjacentHTML("beforeend", "<br>");
  const create = document.createElement("span");
  create.classList.add("link");
  create.innerHTML = "<small><em>Haven't got an account?<br>Make one!</em></small>";
  popup.insertAdjacentElement("beforeend", create);
  create.addEventListener("click", () => {
    socket.emit("user-create", {
      username: inputUsername.value.trim(),
      password: inputPassword.value.trim(),
      when: Date.now(),
    });
    inputPassword.value = "";
  });

  loginPopup = { popup, inputUsername, inputPassword, elMsg };
}

/** Click 'Log in' link */
function clickLogin() {
  if (!loginPopup) createLoginPopup();
  loginPopup.inputPassword.value = "";
  loginPopup.elMsg.innerText = "";
  loginPopup.popup.show();
  loginPopup.inputUsername.focus();
}

/** Click `Logout' */
function clickLogout() {
  if (gUser) {
    socket.emit("user-logout");
    gUser = null;
    populateUserInfo(null);
    populateGameList(gGames);
  }
}

/** Click `Delete Account' */
function clickDeleteAccount() {
  if (gUser) {
    socket.emit("user-delete", gUser.ID);
    gUser = null;
    populateUserInfo(null);
    populateGameList(gGames);
  }
}

async function main() {
  // Get user info
  gUser = await getUserInfo();
  populateUserInfo(gUser);

  // Get game data
  const request = await fetch("assets/games.json");
  const games = await request.json();
  gGames = Object.fromEntries(Object.entries(games).sort(([, a], [, b]) => a.name.localeCompare(b.name, "en-GB"))); // Sort alphabetically by name
  populateGameList(gGames);
}

window.addEventListener("load", main);