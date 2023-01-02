import { createDeck, canPlayCard, isWildcard, getColorOffset, isPickup4, C_TYPES } from "../../../public/games/uno/src/play/cards.js";
import { shuffle } from "../../../public/games/uno/src/utils.js";
import UserSocket from "../../lib/UserSocket.js";
import { saveGameFile } from "./game-file.js";

const DECK_SIZE = 7;
export const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const DISPLAYMODE = Object.freeze({
  GAME: 1, // Normal game view
  PICK_COLOR: 2, // Pick a color
  MESSAGE: 3, // Plain background (perfect for displaying messages ;))
});

export class Game {
  constructor(playerCount) {
    // Fields for game save
    this.id = undefined; // Game ID (filename)
    this.name = undefined; // Game name
    this.owner = undefined; // ID of the owner
    this.winner = null; // Player index of winner

    this.players = Array.from({ length: playerCount }).fill(null); // Array of socket IDs
    this.hands = []; // Array of player decks
    this.ptr = 0; // Player poingter - whose go is it?
    this.dir = 1; // Game direction
    this.deck = []; // Main deck
    this.discard = []; // Discard pile
    this.hasPickedUp = false; // Has the current player picked up? (if cant go)

    this.wildAccept = undefined; // Which color shall a wild card accept?
    this.event = event_void();
  }

  /** Emit message to a particular player */
  emit(player, event, eventData = undefined) {
    const socket = UserSocket.all.get(this.players[player]);
    if (socket) socket.emit(event, eventData);
  }

  /** Emit a message to every player, skipping listed players. */
  emitAll(event, eventData = undefined, skip = []) {
    this.players.forEach((sid, i) => {
      if (!skip.includes(i) && sid !== null) {
        this.emit(i, event, eventData);
      }
    });
  }

  /** Emit - update the hand of a particular player */
  emitUpdateHand(player) {
    this.emit(player, "set-hand", { index: player, value: this.hands[player] });
    this.emitAll("set-hand", { index: player, value: this.hands[player].length }, [player]);
  }

  /**
   * Attempt to initialise the game from saved game data, or new game. Returns indicator code.
   * 0 - OK
   * 1 - No players
   * 2 - Too many players
  */
  init(gameData = undefined) {
    if (gameData) {
      this.id = gameData.id;
      this.name = gameData.name;
      this.owner = gameData.owner; // ID of the owner
      this.winner = gameData.winner;

      this.deck = gameData.deck;
      this.discard = gameData.discard;
      this.ptr = gameData.current;
      this.dir = gameData.dir;
      this.hands = gameData.players;
      this.wildAccept = gameData.wildAccept;
      this.event = gameData.event;
    } else {
      if (this.players.length === 0) return 1;
      const deck = createDeck();
      // Too few cards?
      if (deck.length - this.players.length * DECK_SIZE - 1 <= 0) return 2;
      // Shuffle deck
      shuffle(deck);
      // Reset game data
      this.reset();
      // Deal to players
      this.deck = deck;
      for (let i = 0; i < this.players.length; i++) {
        for (let j = 0; j < DECK_SIZE; j++) {
          let k = Math.floor(Math.random() * this.deck.length); // Get random card index
          this.hands[i].push(this.deck[k]); // Add to players hand
          this.deck.splice(k, 1); // Remove card from deck
        }
      }
      // Add topmost card to discard
      this.discard.push(this.deck.pop());
    }

    return 0;
  }

  /** Reset game data */
  reset() {
    this.ptr = 0;
    this.dir = 1;
    this.deck.length = 0;
    this.discard.length = 0;
    this.hands = Array.from({ length: this.players.length }, () => ([]));
    this.wildAccept = undefined;
    this.event = event_void();
  }

  /** Return array of available player slots */
  getPlayerSlots() {
    return this.players.map((_, i) => i).filter(i => this.players[i] === null);
  }

  /** Get name of a given player */
  getPlayerName(player) {
    return this.players[player] === null ? alpha[player] : UserSocket.all.get(this.players[player]).user.Username;
  }

  /** Get whose go it currently is (+ an offset) */
  whoseGo(offset = 0) {
    return offset === 0 ? this.ptr : (this.players.length + this.ptr + offset) % this.players.length;
  }

  /** Advance to next players go (curr + advance). Return next player's index. */
  nextGo(advance = 1) {
    this.ptr = (this.players.length + this.ptr + advance) % this.players.length;
    this.hasPickedUp = false;
    return this.players[this.ptr];
  }

  /** Add card to given players hand. Return this. */
  addCard(handIndex, card) {
    this.hands[handIndex].push(card);
    return this;
  }

  /** Remove card from players hand at given index. Return card removed. */
  removeCard(handIndex, cardIndex) {
    let card = this.hands[handIndex][cardIndex];
    this.hands[handIndex].splice(cardIndex, 1);
    return card;
  }

  /** Merge discard into deck */
  _mergeDiscardIntoDeck() {
    this.deck = [...this.deck, ...this.discard.splice(0, this.discard.length - 1)];
    shuffle(this.deck);
  }

  /** Remove card from the deck */
  popDeck() {
    if (this.deck.length === 0) this._mergeDiscardIntoDeck();
    let card = this.deck.pop();
    if (this.deck.length === 0) this._mergeDiscardIntoDeck();
    return card;
  }

  /** Handle event - player has clicked on a card */
  handleClientEvent(player, over) {
    if (this.winner !== null) return;
    if (this.whoseGo() === player) {
      // Pick a color?
      if (over.col === true) {
        // State: player just picked the color that their wildcard accepts. Move on to the next player.
        this.wildAccept = over.data;
        // Remove "Pick..." message
        this.nextGo(this.dir);

        // Update current player -- they have chosen
        this.emit(player, "chosen-color", over.data);
        this.emitAll("update", {
          props: {
            wildAccept: this.wildAccept,
            ptr: this.ptr,
            next: this.whoseGo(this.dir),
          },
          render: true,
        });
      } else {
        if (over.src === 'deck') {
          // Add to hand
          let card = this.popDeck();
          this.addCard(player, card);
          if (this.event.type === "pickup") { // Handle picking up a card
            this.event.amount--;
            if (this.event.amount === 0) { // Yay! Picked up all cards!
              // Remove event -- completed!
              this.event = event_void();
              this.emit(player, "update", { props: { pickupCount: -1 } });
              this.nextGo(this.dir);
            } else {
              // Update pickup count
              this.emit(player, "update", { props: { pickupCount: this.event.amount } });
            }
          } else {
            // If can play card, don't advance.
            if (!canPlayCard(card, this.discard[this.discard.length - 1], this.wildAccept)) {
              this.nextGo(this.dir);
            }
          }
          // Update the deck, hand, and render
          this.emitUpdateHand(player);
          this.emitAll("update", {
            props: {
              deck: this.deck,
              ptr: this.ptr,
              next: this.whoseGo(this.dir),
            },
            render: true,
          });
        } else if (over.src === 'hand') {
          if (this.event.type === null) {
            // Can we play the given card?
            const can = canPlayCard(over.card, this.discard[this.discard.length - 1], this.wildAccept);
            const curGo = this.whoseGo();
            const curHand = this.hands[curGo];
            if (can) {
              this.removeCard(player, over.data);
              this.discard.push(over.card);
              // Actions.
              this.playCardAction(player, over.card);
              // Check their hand
              if (curHand.length === 1) { // UNO?
                this.emitAll("alert-uno", curGo);
              } else if (curHand.length === 0) { // Winner?
                this.winner = curGo;
                this.emitAll("alert-win", this.winner);
              }
              // Update current player's hand
              this.emitUpdateHand(player);
              // Update discard pile and render
              this.emitAll("update", {
                props: {
                  discard: this.discard,
                  ptr: this.ptr,
                  next: this.whoseGo(this.dir),
                },
                render: true,
              });
            } else {
              this.emit(player, "game-error", "Cannot play card");
            }
          } else {
            this.emit(player, "game-error", "Cannot pick up card");
          }
        }
      }

      // Save game
      this.save();
    } else {
      this.emit(player, "game-error", "It is not your go!");
    }
  }

  /** Side-effects of playering the given card */
  playCardAction(player, card) {
    let randomDecisions = false;
    const cOff = getColorOffset(card); // Color offset of card
    if (C_TYPES[cOff] === "PICKUP2" || isPickup4(card)) { // Action: pickup
      const count = C_TYPES[cOff] === "PICKUP2" ? 2 : 4;
      this.event = event_pickup(this.whoseGo(this.dir), count);
      this.nextGo(this.dir);
      this.emit(this.ptr, "update", { props: { pickupCount: count } });
    } else if (C_TYPES[cOff] === "REVERSE") { // Reverse direction
      this.dir *= -1; // Reverse direction :D
      this.nextGo(this.dir);
    } else if (C_TYPES[cOff] === "SKIP") { // Miss a go
      this.nextGo(this.dir * 2);
    } else if (isWildcard(card)) { // Ask player to pick a color
      if (randomDecisions) {
        this.wildAccept = ["red", "green", "blue", "yellow"][Math.floor(Math.random() * 4)];
        this.nextGo(this.dir);
      } else {
        this.emit(player, "choose-color");
      }
    } else {
      this.nextGo(this.dir);
    }
  }

  /** Get game data */
  getGameData() {
    return {
      winner: this.winner,
      deck: this.deck,
      discard: this.discard,
      current: this.ptr,
      dir: this.dir,
      players: this.hands,
      wildAccept: this.wildAccept,
      event: this.event,
    };
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

  /** Save game */
  save() {
    saveGameFile(this.id, this.toObject());
  }
}

// Event generators
const event_void = () => ({ type: null });
const event_pickup = (player, amount) => ({ type: "pickup", player, amount });

export const games = new Map(); // game.id => Game