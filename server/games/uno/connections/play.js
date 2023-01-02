import UserSocket from "../../../lib/UserSocket.js";
import { games, alpha } from "../Game.js";
import { loadGames } from "../game-file.js";

export class PlayConnection extends UserSocket {
  constructor(socket) {
    super(socket);
    this.gameID = null; // No game yet
    this.player = -1;
    this._setupListeners();
  }

  _setupListeners() {
    // Request to leave the game
    this.onEvent("leave-game", () => {
      if (this.user) {
        const token = UserSocket.auth.create(super.getDataToCache());
        this.emit("redirect", "index.html?" + token);
        this.disconnect();
      }
    });

    // Client has been initialised -- request an statusupdate
    this.onEvent("status-update", () => {
      const game = this.getGame();
      if (game) {
        game.emitAll("client-count", game.players.filter(x => x !== null).length);
        game.emitAll("update", { render: true, });
      }
    });

    // Client has clicked on a card!
    this.onEvent("handle-event", data => {
      const game = this.getGame();
      if (game) {
        game.handleClientEvent(this.player, data);
      }
    });

    // Kick player
    this.onEvent("kick", pid => {
      const game = this.getGame();
      if (game && this.user.ID === game.owner) {
        const sock = UserSocket.all.get(game.players[pid]);
        if (sock) {
          const token = UserSocket.auth.create({ UID: sock.user.ID });
          game.players[pid] = null;
          this.emit("popup", { title: 'Kicked Player', message: `Successfully kicked ${sock.user.Username}` });
          sock.emit("redirect", "index.html?" + token + "&kicked");
          sock.disconnect();
        } else {
          this.emit("popup", { title: 'Unable to Kick Player', message: `Cannot kick ${alpha[pid]} as they are not a connected player` });
        }
      }
    });

    this.onEvent("kick-all", () => {
      const game = this.getGame();
      if (game && this.user.ID === game.owner) {
        game.players.forEach((sid, pi) => {
          const sock = UserSocket.all.get(sid);
          if (sock) {
            const token = UserSocket.auth.create({ UID: sock.user.ID });
            game.players[pi] = null;
            sock.emit("redirect", "index.html?" + token + "&kicked");
            sock.disconnect();
          }
        });
      }
    });
  }

  disconnect() {
    // Remove from game
    if (this.gameID !== null) {
      const game = this.getGame();
      // Update players - reset to default name: A, B, ...
      game.emitAll("set-player", { slot: this.player, value: alpha[this.player] });
      // Clear game data from this
      game.players[this.player] = null;
      game.emitAll("client-count", game.players.filter(x => x !== null).length);
      this.gameID = null;
      this.player = -1;
    }
    super.disconnect();
  }

  /** Get game */
  getGame() {
    return games.get(this.gameID);
  }

  async _onRedeemedToken(token, data) {
    await super._onRedeemedToken(token, data);
    this.gameID = data.gameID;
    this.player = data.player;
    if (games.size === 0) await loadGames(games); // Should already be populated, but doesn't hurt to check
    const game = this.getGame();
    // Tell everyone that we've joined.
    game.players.forEach(sid => {
      if (sid) {
        const socket = UserSocket.all.get(sid);
        socket.emit("set-player", { slot: this.player, value: this.user.Username });
      }
    });
    game.players[this.player] = this.id;
    // Send out game data
    this.emit("game-data", {
      uuid: this.id,
      id: game.id,
      isOwner: game.owner === this.user.ID,
      deck: game.deck,
      discard: game.discard,
      current: game.ptr,
      next: game.whoseGo(game.dir),
      hands: game.hands.map((h, i) => i === this.player ? h : h.length),
      players: game.players.map((sid, i) => sid === null ? alpha[i] : UserSocket.all.get(sid).user.Username),
      playingAs: this.player,
      msgs: game.msgs,
      wildAccept: game.wildAccept,
      winner: game.winner,
      pickupCount: game.event.type === "pickup" && game.event.player === this.player ? game.event.amount : -1,
    });
  }
}

export default PlayConnection;