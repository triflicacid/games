import { io } from "https://cdn.socket.io/4.3.0/socket.io.esm.min.js";
import Popup from "/libs/Popup.js";

var token, tokenData = null, socket, getTokenDataResolve, getTokenDataReject, genTokenResolve, getUserInfoResolve;

/** Get the token given to us in the URL */
export function getToken() {
  if (token) return token;
  const params = new URLSearchParams(location.search);
  const pairs = Array.from(params.entries());
  token = pairs.length === 0 ? "" : pairs[0][0];
  return token;
}

/** Generate a token */
export async function genToken(payload = undefined) {
  return await new Promise(res => {
    genTokenResolve = res;
    socket.emit("gen-token", payload);
  });
}

/** Cache in the token, and get the saved data. */
export async function getTokenData() {
  if (tokenData) return tokenData;
  if (!socket) throw new Error("No socket available.");
  if (!token) getToken();
  return (tokenData = await new Promise((res, rej) => {
    getTokenDataResolve = res;
    getTokenDataReject = rej;
    socket.emit("redeem-token", token);
  }));
}

/** Get user info */
export async function getUserInfo() {
  return await new Promise(res => {
    getUserInfoResolve = res;
    socket.emit("get-user-info");
  });
}

function htmlErrorTemplate(title, message) {
  const div = document.createElement("div");
  const h1 = document.createElement("h1");
  h1.insertAdjacentText("beforeend", title);
  div.appendChild(h1);
  const p = document.createElement("p");
  p.insertAdjacentHTML("beforeend", message);
  div.appendChild(p);
  return div;
}

/** Create socket, or return established socket */
export function createSocket(src) {
  if (socket) return socket;
  socket = io(undefined, {
    query: {
      src,
    },
  });

  //#region Initialised Listeners
  // Basic server message
  socket.on("message", console.log);

  // Popup
  socket.on("popup", ({ title, message }) => new Popup(title).insertAdjacentHTML("beforeend", "<p>" + message + "</p>").show());

  // Redirect
  socket.on("redirect", url => (window.location.href = url));

  socket.on("unknown-source", source => {
    document.body.innerHTML = "";
    document.body.appendChild(htmlErrorTemplate("HTTP 404 - Not Found", `No exposed connection for source \`\`<code>${source}</code>''`));
  });

  socket.on("redeem-token", resp => {
    if (resp.ok) {
      if (getTokenDataResolve) {
        getTokenDataResolve(resp.data);
      }
    } else {
      if (getTokenDataReject) {
        // Error message
        document.body.innerHTML = "";
        document.body.appendChild(htmlErrorTemplate("HTTP 401 - Unauthorised", `Invalid authentication token <code>${resp.token}</code>`));
        getTokenDataReject(resp);
      }
    }
    getTokenDataResolve = getTokenDataReject = undefined;
  });
  socket.on("get-user-info", user => {
    if (getUserInfoResolve) {
      getUserInfoResolve(user);
      getUserInfoResolve = undefined;
    }
  });

  socket.on("gen-token", token => {
    if (genTokenResolve) {
      genTokenResolve(token);
      genTokenResolve = undefined;
    }
  });

  socket.on("html-error", ({ title, message }) => {
    document.body.innerHTML = "";
    document.body.appendChild(htmlErrorTemplate(title, message));
  });
  //#endregion

  return socket;
}
