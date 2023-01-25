import UserSocket from "../lib/UserSocket.js";
import { getInfo } from "../games.js";
import extern from "../games/extern.js";
import { getUser } from "../database.js";

export class Connection extends UserSocket {
  constructor(sock) {
    super(sock);
    this.game = null; // Which game are we connecting to?
    this._setup();
  }

  /** Get external module for game */
  get extern() {
    return extern[this.game];
  }

  /** @override @async */
  async _onRedeemedToken(token, data) {
    await super._onRedeemedToken(token, data);
    this.game = data.game;
    // Check that game exists
    if (this.game in extern) {
      if (!Connection.allowMultiplayer && getInfo()[this.game].singleplayer === false) {
        this.emitMultiplayerDisabledError();
      } else {
        this.invokeEvent("game-info"); // Game information
      }
    } else {
      this.emitGameError();
    }
  }

  /** Send client an error message stating that  this.game cannot be found */
  emitGameError() {
    this.emit("html-error", {
      title: "HTTP 404 - Not Found",
      message: `Cannot find game \`${this.game}'`,
    });
  }

  /** Send client an error message stating that multiplayer games are disabled */
  emitMultiplayerDisabledError() {
    this.emit("html-error", {
      title: "HTTP 403 - Forbidden",
      message: `Multiplayer games have been restricted -- access denied to \`${this.game}'`,
    });
  }

  /** Setup events */
  _setup() {
    this.onEvent("game-info", async () => {
      if (this.user && this.game && this.extern) {
        const all = getInfo();
        // Get all of my games
        this.emit("game-info", {
          name: this.game,
          data: all[this.game],
          createNew: this.extern.CREATE_NEW_FIELDS,
          headers: this.extern.GAME_HEADERS,
        });
      }
    });

    // Request list of owned games
    this.onEvent("my-games", () => {
      if (this.user && this.game && this.extern)
        this.emit("my-games", this.extern.getMyGames(this.user.ID));
    });

    // Join a foreign game
    this.onEvent("join-game", async (req) => {
      if (this.user && this.game && this.extern) {
        const title = `Unable to Join Game`;
        const game = this.extern.getGame(req.id); // Get game with ID
        if (game) {
          if (game.locked) {
            this.emit("popup", { title, message: `Game is locked.` });
          } else {
            // Security tests
            if (req.name === game.name) { // Is the game name correct?
              const owner = await getUser(game.owner);
              if (req.owner === owner.Username) { // Is the game owner correct?
                const obj = game.attemptJoinForeign(req);
                if (obj.error) {
                  this.emit("popup", { title, message: obj.msg });
                } else {
                  // Join the game!
                  const cache = { ...this.getDataToCache(game.id), ...obj.data };
                  const token = UserSocket.auth.create(cache);
                  this.emit("redirect", this.game + "/?" + token);
                }
              } else {
                this.emit("popup", { title, message: `Owner's name is incorrect.` });
              }
            } else {
              this.emit("popup", { title, message: `Game name is incorrect.` });
            }
          }
        } else {
          this.emit("popup", { title, message: `No game with given ID.` });
        }
      }
    });

    // Join a game created by us
    this.onEvent("join-my-game", async (gid) => {
      if (this.user && this.game && this.extern) {
        // Get game
        const title = `Unable to Join Game`;
        const game = this.extern.getGame(gid); // Get game with ID
        if (game) {
          if (game.owner === this.user.ID) {
            const obj = game.attemptJoinOwner();
            if (obj.error) {
              this.emit("popup", { title, message: obj.msg });
            } else {
              // Join the game!
              const cache = { ...this.getDataToCache(gid), ...obj.data };
              const token = UserSocket.auth.create(cache);
              this.emit("redirect", this.game + "/?" + token);
            }
          } else {
            this.emit("popup", { title, message: 'You are not the game owner.' });
          }
        } else {
          this.emit("popup", { title, message: 'Game does not exist.' });
        }
      }
    });

    // Create a game
    this.onEvent("create-game", async ({ name, fields }) => {
      if (this.user && this.game && this.extern) {
        const gid = await this.extern.createGame(this.user.ID, name, fields);
        this.emit("create-game", gid);
        this.invokeEvent("my-games"); // Update game list
      }
    });

    // Request to delete a game
    this.onEvent("delete-game", (gid) => {
      if (this.user && this.game && this.extern) {
        const ok = this.extern.deleteGame(gid);
        if (ok) {
          this.invokeEvent("my-games"); // Update game list
        }
      }
    });
  }

  /** @override */
  disconnect() {
    this.game = null;
    super.disconnect();
  }

  /** @override Provide game ID */
  getDataToCache(gameID) {
    return {
      ...super.getDataToCache(),
      gameID,
    };
  }
}

/** Alloy joining of multiplayer games? */
Connection.allowMultiplayer = true;

export default Connection;