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
export async function genToken() {
  return await new Promise(res => {
    genTokenResolve = res;
    socket.emit("gen-token");
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

/** Setup socket events */
export function setupUserSocket(sock) {
  socket = sock;

  // Basic server message
  sock.on("message", console.log);

  sock.on("unknown-source", source => {
    const div = document.createElement("div");
    div.insertAdjacentHTML("beforeend", `<h1>HTTP 404 - Not Found</h1><p>No exposed connection for source \`\`<code>${source}</code>''</p><a href='/'>Go Home</a>`);
    document.body.innerHTML = "";
    document.body.appendChild(div);
  });

  sock.on("redeem-token", resp => {
    if (resp.ok) {
      if (getTokenDataResolve) {
        getTokenDataResolve(resp.data);
      }
    } else {
      if (getTokenDataReject) {
        // Error message
        const div = document.createElement("div");
        div.insertAdjacentHTML("beforeend", `<h1>HTTP 401 - Unauthorised</h1><p>Invalid authentication token <code>${resp.token}</code></p><a href='/'>Go Home</a>`);
        document.body.innerHTML = "";
        document.body.appendChild(div);
        getTokenDataReject(resp);
      }
    }
    getTokenDataResolve = getTokenDataReject = undefined;
  });
  sock.on("get-user-info", user => {
    if (getUserInfoResolve) {
      getUserInfoResolve(user);
      getUserInfoResolve = undefined;
    }
  });

  sock.on("gen-token", token => {
    if (genTokenResolve) {
      genTokenResolve(token);
      genTokenResolve = undefined;
    }
  });
}
