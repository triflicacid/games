import { saveGame } from "../games.js";
import UserSocket from "../lib/UserSocket.js";

export const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default class Game {
  /**
   * @param {string} gameName Type of game e.g. "uno"
   * @param {number} playerCount Maximum number of players
   */
  constructor(gameName, playerCount) {
    this.gameName = gameName; // Game name
    this.id = undefined; // Game ID (filename)
    this.name = undefined; // Game name
    this.owner = undefined; // ID of the owner
    this.players = Array.from({ length: playerCount }).fill(null); // Array of socket IDs
    this.locked = true; // Is the game locked? (if so, foreigners can't join)
  }

  /**
   * Called when foreign player is attempting to join
   * 
   * - If cannot join, return `{ error: true, msg: string }`.
   * - If able to join, return `{ error: false, data: object }` where `data` is cached in the token.
   */
  attemptJoinForeign(req) {
    return { error: true, msg: 'Not implemented' };
  }

  /** Called when the owner is attempting to join. Return value same as attemptJoinForeign */
  attemptJoinOwner() {
    return { error: true, msg: 'Not implemented' };
  }

  /** Emit message to a particular player */
  emit(player, event, eventData = undefined) {
    const socket = UserSocket.all.get(this.players[player]);
    if (socket) socket.emit(event, eventData);
  }

  /** Emit a message to every player, excluding some players if given. */
  emitAll(event, eventData = undefined, exclude = []) {
    this.players.forEach((sid, i) => {
      if (!exclude.includes(i) && sid !== null) {
        this.emit(i, event, eventData);
      }
    });
  }

  /** Get name of a given player */
  getPlayerName(player) {
    return this.players[player] === null ? alpha[player] : UserSocket.all.get(this.players[player]).user.Username;
  }

  /** Initialise new game. Requires override. */
  initNew() {

  }

  /** Initialise game from saved GameData */
  initFromSaved(gameData) {
    this.id = gameData.id;
    this.name = gameData.name;
    this.owner = gameData.owner;
  }

  /** Player joins at given slot */
  join(playerIndex, socketId) {
    const socket = UserSocket.all.get(socketId);
    // Tell everyone that we've joined.
    this.emitAll("set-player", { slot: playerIndex, value: socket.user.Username });
    // Insert oneself
    this.players[playerIndex] = socketId;
  }

  /** Player leaves */
  leave(playerIndex) {
    const sid = this.players[playerIndex];
    if (sid) {
      this.players[playerIndex] = null;
    }
  }

  /** Return game-specific data */
  getGameData() {
    return {};
  }

  /** Return object to save */
  toObject() {
    return {
      id: this.id,
      owner: this.owner,
      name: this.name,
      ...this.getGameData(),
    };
  }

  /** Save game to file */
  async save() {
    await saveGame(this.gameName, this.id, JSON.stringify(this.toObject()));
  }
}