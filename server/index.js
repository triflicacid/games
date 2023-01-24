import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import router from './router.js';
import { db, getUser } from "./database.js";
import getConnection from './connections/get.js';
import JoinConnection from "./connections/join.js";
import gameExterns from "./games/extern.js";
import { terminate } from "./utils.js";

/** New socket connection -- forward to connection object */
async function onConnection(sock) {
  const src = sock.handshake.query.src; // Get source
  console.log(`New connection from \`${src}' -- ${sock.id}`);
  let conn = await getConnection(sock, src); // Get customised connection handler
  if (conn) {
    // ! DEBUG
    const user = await getUser(1);
    conn.user = user;
    conn.invokeEvent("get-user-info");
  } else { // Could not locate connection object
    sock.emit("message", "ERROR: Unknown source: " + src);
    sock.emit("unknown-source", src);
    sock.disconnect();
  }
}

/** Start app on port <port>. Initialise multiplayer games? */
export async function start(port, initMultiplayer = true) {
  // Open database
  await db.open();
  console.log(`[database]: Opened connection: ${db.path}`);
  
  // Initialise each game
  JoinConnection.allowMultiplayer = initMultiplayer;
  if (initMultiplayer) {
    console.log("Initialising games");
    for (const [game, extern] of Object.entries(gameExterns)) {
      console.log(` - ${game}...`);
      await extern.init();
    }
  } else {
    console.log("[!] Skipping game initialisation");
  }

  // Setup express application and middleware
  const app = express();
  app.use('/', router);
  app.use(express.static("public/"));

  // Start server listening on pre-defined port
  const server = app.listen(port, () => {
    console.log(`Listening on port :${port}`);
  });

  // Mount Socket.IO onto the server
  const io = new SocketIOServer(server);
  io.on("connection", onConnection);

  // Handle exits - ensure graceful shutdown
  const exitHandler = terminate(server, {
    coredump: false,
    timeout: 500,
    log: true,
    fn: async () => {
      // Close each game
      if (initMultiplayer) {
        console.log("Closing games");
        for (const [game, extern] of Object.entries(gameExterns)) {
          console.log(` - ${game}...`);
          await extern.close();
        }
      }
      
      await db.close(); // Close database handle
      console.log(`[database]: Closed connection: ${db.path}`);
    }
  });

  // Exit handler triggers
  process.on('uncaughtException', exitHandler(1, 'Unexpected Error'));
  process.on('unhandledRejection', exitHandler(1, 'Unhandled Promise'));
  process.on('SIGTERM', exitHandler(0, 'SIGTERM'));
  process.on('SIGINT', exitHandler(0, 'SIGINT'));
}

export default start;