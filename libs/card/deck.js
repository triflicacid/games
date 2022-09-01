import { shuffleArray } from "../util.js";
import { Card } from "./card.js";
import { Pile } from "./pile.js";

/** Holds all 52 cards in a deck */
export class Deck {
  constructor() {
    /**
     * Array of all cards in deck
     * @type Card[]
     */
    this.cards = [];

    /**
     * Array of all piles
     * @type Pile[]
     */
    this.piles = [];

    this.reset();
  }

  /**
   * Assemble all card
   */
  reset() {
    this.cards.length = 0;

    for (const suit of Card.suits) {
      for (const type of Card.types) {
        const card = new Card(suit, type);
        this.cards.push(card);
      }
    }
  }

  /** Issue update to every pile */
  update() {
    this.piles.forEach(pile => pile.update());
  }

  /**
   * Display everything possible
   * - Cards if displayable
   */
  display(ctx) {
    this.piles.forEach(pile => pile.display(ctx));
  }

  /**
   * Add card to deck
   * @param {Card} card   Card to add
   * @return {Boolean} Added card?
   */
  addCard(card) {
    if (this.cards.indexOf(card) === -1) {
      this.cards.push(card);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Remove card from deck
   * @param {Card} card   Card to remove
   * @return {Boolean} Removed card?
   */
  removeCard(card) {
    const i = this.cards.indexOf(card);
    if (i === -1) {
      return false;
    } else {
      this.cards.splice(i, 1);
      return true;
    }
  }

  /**
   * Shuffle cards
   */
  shuffle() {
    const cards = shuffleArray(this.cards);
    this.cards = cards;
  }

  /**
   * Get random card from deck
   * @return {Card} Random card
   */
  getRandom() {
    const i = Math.floor(Math.random() * this.cards.length);
    return this.cards[i];
  }

  /**
   * Create a pile of cards
   * @param {Number} x    X Coordinate to display pile at
   * @param {Number} y    y Coordinate to display pile at
   * @return {Pile} The newly created pile of cards
   */
  createPile(x, y) {
    const pile = new Pile(x, y);
    this.piles.push(pile);
    return pile;
  }

  /**
   * Delete a pile
   * @param {Pile} pile   Pile to remove
   * @return {Boolean} Deleted pile?
   */
  deletePile(pile) {
    const i = this.piles.indexOf(pile);
    if (i !== -1) {
      this.piles.splice(i, 1);
      this.cards.push(...pile.cards); // Add cards from pile back to deck
    } else {
      return false;
    }
  }

  /** Initiate images, providing path to spritesheet: e.g. "for/bar/baz/spritesheet.png" */
  static async loadImages(url) {
    // Load spritesheet
    const spritesheet = await loadImage(url);
    Deck.images.spritesheet = spritesheet;

    const w = Card.width, h = Card.height;

    // Extract card images from spritesheet
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 13; x++) {
        const img = extractImage(spritesheet, x * w, y * h, w, h);
        Deck.images.cards[y][x] = img;
      }
    }

    // Back of a card
    // const i = Math.floor(Math.random() * 9);
    const i = 0;
    Deck.images.hidden = extractImage(spritesheet, i * w, 4 * h, w, h);

    // Empty card
    Deck.images.empty = extractImage(spritesheet, 12 * w, 5 * h, w, h);
  }
}