import UserSocket from "../../lib/UserSocket.js";
import { Game } from "./Game.js";
import { alpha } from "../Game.js";
import { ID as GAME_ID } from "./extern.js";

export class Connection extends UserSocket {
  constructor(socket) {
    super(socket);
    this.gameID = null; // No game yet
    this.player = -1;
    this._setupListeners();
  }

  async _onRedeemedToken(token, data) {
    await super._onRedeemedToken(token, data);
    this.gameID = data.gameID;
    this.player = data.player;
    const game = this.getGame();
    if (game) {
      game.join(this.player, this.id);
      // Send out game data
      this.emit("game-data", {
        id: game.id,
        name: game.name,
        locked: game.locked,
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
    } else {
      this.gameID = null;
      this.disconnect();
    }
  }

  /** Socket leaves game & page */
  leave(playerIndex, kicked = false) {
    const game = this.getGame();
    if (game && game.players[playerIndex]) {
      const socket = UserSocket.all.get(game.players[playerIndex]);
      game.leave(playerIndex);
      const token = UserSocket.auth.create({ UID: socket.user.ID, game: GAME_ID });
      socket.emit("redirect", "../join.html?" + token + (kicked ? '&kicked' : ''));
      // If we are the owner, kick everyone else
      if (socket.user.ID === game.owner) {
        game.players.forEach((id, i) => i !== playerIndex && this.leave(i, true));
      }
      socket.disconnect();
    }
  }

  _setupListeners() {
    // Request to leave the game
    this.onEvent("leave-game", () => {
      this.leave(this.player);
    });

    this.onEvent("lock", bool => {
      const game = this.getGame();
      if (game) {
        game.locked = !!bool;
        this.emit("locked", game.locked);
      }
    })

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
      const game = this.getGame(), title = "Unable to Kick Player";
      if (game && this.user.ID === game.owner) {
        if (pid === this.player) {
          this.emit("popup", { title, message: `Cannot kick oneself.` });
        } else {
          const sock = UserSocket.all.get(game.players[pid]);
          if (sock) {
            this.leave(pid, true);
          } else {
            this.emit("popup", { title, message: `Cannot kick ${alpha[pid]} as they are not a connected player.` });
          }
        }
      }
    });

    // Kick every player
    this.onEvent("kick-all", () => {
      const game = this.getGame();
      if (game && this.user.ID === game.owner) {
        game.players.forEach((sid, pi) => {
          if (sid === this.id) return;
          this.leave(pi, true);
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
    return Game.all.get(this.gameID);
  }
}

export default Connection;