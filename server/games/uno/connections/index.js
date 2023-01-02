import UserSocket from "../../../lib/UserSocket.js";
import { games } from "../Game.js";
import { createGameFile, deleteGameFile, loadGames } from "../game-file.js";
import { getUser } from "../../../database.js";

export class IndexConnection extends UserSocket {
  constructor(socket) {
    super(socket);
    this._setupListeners();
  }

  _setupListeners() {
    // Get list of all owned games
    this.onEvent("my-games", async () => {
      if (this.user) {
        if (games.size === 0) await loadGames(games); // Load games if not loaded
        const myGames = Array.from(games.entries()).filter(([, game]) => game.owner === this.user.ID).map(([id, game]) => ({
          id,
          name: game.name,
          players: game.players.length - game.getPlayerSlots().length,
          max: game.players.length,
        }));
        this.emit("my-games", myGames);
      }
    });

    // Create a game
    this.onEvent("create-game", async (req) => {
      if (this.user) {
        const gid = await createGameFile(this.user.ID, req.name, +req.players);
        this.emit("create-game", gid);
        this.invokeEvent("my-games"); // Update game list
      }
    });

    // Join a game created by us
    this.onEvent("join-my-game", async (gid) => {
      if (this.user) {
        // Get game
        const game = games.get(gid);
        if (game) {
          if (game.owner === this.user.ID) {
            const token = UserSocket.auth.create(this.getDataToCache(gid, 0));
            const url = 'play.html?' + token;
            this.emit("redirect", url);
          } else {
            this.emit("popup", { title: 'Can\'t Join Game', message: 'You are not the game owner.' });
          }
        } else {
          this.emit("popup", { title: 'Can\'t Join Game', message: 'Game does not exist.' });
        }
      }
    });

    // Join a foreign game
    this.onEvent("join-game", async (req) => {
      if (this.user) {
        const game = games.get(req.id);
        if (game) {
          const owner = await getUser(game.owner);
          if (owner.Username === req.owner) { // Security check; owner's username.
            const slots = game.getPlayerSlots();
            if (slots.length === 0) { // Check if the game is full
              this.emit("join-game", { error: true, status: 3, });
            } else {
              const token = UserSocket.auth.create(this.getDataToCache(req.id, slots[0]));
              this.emit("join-game", { error: false, url: 'play.html?' + token, });
            }
          } else {
            this.emit("join-game", { error: true, status: 2, });
          }
        } else {
          this.emit("join-game", { error: true, status: 1, });
        }
      }
    });

    // Request to delete a game
    this.onEvent("delete-game", (gid) => {
      if (this.user) {
        const game = games.get(gid);
        if (game && game.owner === this.user.ID) {
          deleteGameFile(gid);
          games.delete(gid);
          this.invokeEvent("my-games"); // Update game list
        }
      }
    });
  }

  /** @override */
  getDataToCache(gameID, player) {
    return {
      ...super.getDataToCache(),
      gameID,
      player,
    };
  }
}

export default IndexConnection;