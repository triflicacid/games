import { CARDS, createDeck, C_HEIGHT, C_WIDTH, getCard, isWildcard } from "./cards.js";
import { inRect, shuffle } from "../utils.js";

const DECK_SIZE = 7;
const TEXT_SPACE = 10;

export const DISPLAYMODE = Object.freeze({
  GAME: 1, // Normal game view
  PICK_COLOR: 2, // Pick a color
  MESSAGE: 3, // Plain background (perfect for displaying messages ;))
});

export const COLORS = Object.freeze({
  red: "#ED1C24",
  yellow: "#FFDE16",
  green: "#50AA44",
  blue: "#0072BC",
});

export class Game {
  constructor(playerNames = []) {
    this.players = playerNames; // Array of player names/IDs
    this.hands = []; // Array of player decks - contains our deck, and deck length for everyone else
    this.ptr = 0; // Player pointer - whose go is it?
    this.next = 1; // Pointer to next go
    this.winner = null;
    this.deck = []; // Main deck
    this.discard = []; // Discard pile

    this.playingAs = undefined; // Who we are playing as
    this._handPos = []; // Position of each card in this.playingAs's hand
    this._deckPos = [];
    this._discardPos = [];
    this.displayMode = DISPLAYMODE.GAME;
    this.wildAccept = undefined; // Which color shall a wild card accept?
    this.pickupCount = -1; // Cards to pick up. -1 means none.
  }

  /** Populate from GameData object sent from server */
  init(data) {
    this.winner = data.winner;
    this.deck = data.deck;
    this.discard = data.discard;
    this.ptr = data.current;
    this.next = data.next;
    this.hands = data.hands;
    this.players = data.players;
    this.wildAccept = data.wildAccept;
    this.playingAs = data.playingAs;
    this.pickupCount = data.pickupCount;
  }

  /** Display current game state to a canvas */
  display(ctx, width, height, logText = undefined) {
    ctxInit(ctx);
    if (this.displayMode === DISPLAYMODE.GAME) {
      // Display hand
      const hand = this.hands[this.playingAs];
      this._handPos = [];
      let y = 50,
        spacing = Math.min((width - Game.C_WIDTH * hand.length) / hand.length, 6),
        x = Math.round((width - (Game.C_WIDTH + spacing + 1.5) * hand.length) * 0.5);
      ctx.textAlign = 'start';
      ctx.fillText(this.players[this.playingAs] + " - " + (hand.length === 1 ? "UNO" : hand.length + " cards"), x, y - TEXT_SPACE);
      ctx.textAlign = 'center';
      for (let i = 0; i < hand.length; ++i) {
        const card = getCard(Game.spritesheet, hand[i]);
        ctx.drawImage(card, x, y, Game.C_WIDTH, Game.C_HEIGHT);
        ctx.strokeRect(x, y, Game.C_WIDTH, Game.C_HEIGHT);
        this._handPos.push([x, y]);
        x = Math.round(x + Game.C_WIDTH + spacing);
      }
      // Display deck
      y += C_HEIGHT * 0.75;
      x = width / 4 - Game.C_WIDTH / 2;
      ctx.fillText("Deck", x + Game.C_WIDTH / 2, y - TEXT_SPACE);
      if (this.deck.length > 0) {
        let card = getCard(Game.spritesheet, CARDS.UNO);
        ctx.drawImage(card, x, y, Game.C_WIDTH, Game.C_HEIGHT);
      }
      ctx.strokeRect(x, y, Game.C_WIDTH, Game.C_HEIGHT);
      this._deckPos = [x, y];
      // Display discard
      x = 3 * width / 4 - Game.C_WIDTH / 2;
      // ctx.fillText("Discard", x + Game.C_WIDTH / 2, y - TEXT_SPACE);
      if (this.discard.length > 0) {
        let card = getCard(Game.spritesheet, this.discard[this.discard.length - 1]);
        ctx.drawImage(card, x, y, Game.C_WIDTH, Game.C_HEIGHT);
      }
      ctx.strokeRect(x, y, Game.C_WIDTH, Game.C_HEIGHT);
      this._discardPos = [x, y];
      // Wildcard??
      if (this.wildAccept && isWildcard(this.discard[this.discard.length - 1])) {
        let d = 14;
        ctx.fillText(`Accept`, x + Game.C_WIDTH / 2 - d * 0.5, y + Game.C_HEIGHT + 2 * TEXT_SPACE);
        let fill = ctx.fillStyle;
        ctx.fillStyle = COLORS[this.wildAccept];
        ctx.fillRect(x + Game.C_WIDTH / 2 + d * 1.5, y + Game.C_HEIGHT + TEXT_SPACE - d * 0.2, d, d);
        ctx.fillStyle = fill;
      }
      // Whose go is it?
      let font = ctx.font;
      ctx.font = "bold 18px Arial";
      ctx.fillText(this.players[this.ptr] + "'s Go", width / 2, y + Game.C_HEIGHT * 1.5 - TEXT_SPACE);
      ctx.font = font;
      // Log Text / Next Go
      ctx.font = "14px Arial";
      ctx.fillStyle = Game.DARKMODE ? "lime" : "forestgreen";
      let text = logText;
      if (text === undefined) {
        if (this.pickupCount !== -1) {
          text = "Pick up " + this.pickupCount + " card" + (this.pickupCount === 1 ? '' : 's');
        } else {
          text = "Next: " + this.players[this.next];
        }
      }
      ctx.fillText(text, width / 2, y + Game.C_HEIGHT * 1.5 + 2 * TEXT_SPACE);
      ctxInit(ctx);
      // Other players
      y += C_HEIGHT;
      spacing = (width - Game.C_WIDTH * (this.players.length - 1)) / (this.players.length - 1);
      x = spacing < 0 ? 0 : spacing * 0.5;
      for (let i = 0; i < this.players.length; i++) {
        if (i === this.playingAs) continue;
        ctx.fillText(this.players[i], x + Game.C_WIDTH / 2, y - TEXT_SPACE);
        const ccount = typeof this.hands[i] === "number" ? this.hands[i] : this.hands[i].length; // Get length of hand
        if (ccount > 0) {
          // let card = getCard(Game.spritesheet, this.hands[i][this.hands[i].length - 1]);
          let card = getCard(Game.spritesheet, CARDS.UNO);
          ctx.drawImage(card, x, y, Game.C_WIDTH, Game.C_HEIGHT);
        }
        ctx.strokeRect(x, y, Game.C_WIDTH, Game.C_HEIGHT);
        ctx.fillText(ccount === 1 ? "UNO" : ccount + " cards", x + Game.C_WIDTH / 2, y + Game.C_HEIGHT + 2 * TEXT_SPACE);
        x = Math.round(x + spacing + Game.C_WIDTH);
      }
    } else if (this.displayMode === DISPLAYMODE.PICK_COLOR) {
      ctx.font = "bold 18px Arial";
      // Color: RED
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(0, 0, width * 0.5, height * 0.5);
      ctx.fillStyle = "white";
      ctx.fillText("Red", width * 0.25, height * 0.25);
      // Color: YELLOW
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(width * 0.5, 0, width * 0.5, height * 0.5);
      ctx.fillStyle = "black";
      ctx.fillText("Yellow", width * 0.75, height * 0.25);
      // Color: GREEN
      ctx.fillStyle = COLORS.green;
      ctx.fillRect(0, height * 0.5, width * 0.5, height * 0.5);
      ctx.fillStyle = "white";
      ctx.fillText("Green", width * 0.25, height * 0.75);
      // Color: BLUE
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(width * 0.5, height * 0.5, width * 0.5, height * 0.5);
      ctx.fillStyle = "white";
      ctx.fillText("Blue", width * 0.75, height * 0.75);
      // Lines
      ctx.beginPath();
      ctx.moveTo(width * 0.5, 0);
      ctx.lineTo(width * 0.5, height);
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.stroke();
      // Log Text
      if (logText !== undefined) {
        ctx.fillStyle = "black";
        ctx.textBaseline = "middle";
        ctx.fillText(logText, width * 0.5, height * 0.5);
      }
    } else if (this.displayMode === DISPLAYMODE.MESSAGE) {
      // Log Text
      if (logText !== undefined) {
        ctx.font = "bold 18px Arial";
        ctx.fillStyle = Game.DARKMODE ? "white" : "black";
        ctx.textBaseline = "middle";
        ctx.fillText(logText, width * 0.5, height * 0.5);
      }
    }
  }

  /** Get thing over given coordinates : { card, src, data } | null
   * where src indicates card source e.g. "deck", "hand",
   * data is attached data e.g. stack index.
   * Also returns if over buttons etc... */
  getCardOver(x, y, width, height) {
    if (this.displayMode === DISPLAYMODE.GAME) {
      // Hand
      for (let i = this._handPos.length - 1; i >= 0; --i) {
        if (inRect(x, y, ...this._handPos[i], Game.C_WIDTH, Game.C_HEIGHT)) {
          const hand = this.hands[this.playingAs];
          return { card: hand[i], src: "hand", data: i };
        }
      }
      // Deck
      if (this.deck.length > 0 && inRect(x, y, ...this._deckPos, Game.C_WIDTH, Game.C_HEIGHT)) {
        return { card: this.deck[this.deck.length - 1], src: "deck", data: this.deck.length - 1 };
      }
      // Discard
      if (this.discard.length > 0 && inRect(x, y, ...this._deckPos, Game.C_WIDTH, Game.C_HEIGHT)) {
        return { card: this.discard[this.discard.length - 1], src: "discard", data: this.discard.length - 1 };
      }
    } else if (this.displayMode === DISPLAYMODE.PICK_COLOR) {
      let X = x < width * 0.5, Y = y < height * 0.5;
      let col = X ? (Y ? "red" : "green") : (Y ? "yellow" : "blue");
      return { col: true, data: col };
    }
    return null;
  }
}

// Should externally set Game.spritesheet

Game.C_WIDTH = C_WIDTH / 2;
Game.C_HEIGHT = C_HEIGHT / 2;
Game.DARKMODE = true;

function ctxInit(ctx) {
  // Setup correct canvas styles
  ctx.font = '15px Arial';
  ctx.textAlign = 'center';
  ctx.lineWidth = 1;
  ctx.strokeStyle = ctx.fillStyle = Game.DARKMODE ? "white" : "black";
}