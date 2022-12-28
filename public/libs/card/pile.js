import { Card } from "./card.js";

/**
 * A pile or cards
 */
export class Pile {
  constructor(x, y) {
    /** Array of cards. Display top to bottom. @type Card[] */
    this.cards = [];

    // Margin offset between cards
    this.margin = 0; // On-top of each other

    // Coordinates of top-left corner
    this.x = x;
    this.y = y;

    this._style = NaN; // Last style that was used in applyStyle

    // Dimensions of card members
    this.cw = Card.width;
    this.ch = Card.height;

    /** Can drag cards from etc... */
    this.isInteractive = true;

    /** Max size of pile */
    this.maxSize = Infinity;

    // Is the pile displaying flipped?
    this.isFlipped = false;

    /**
     * Card to display if pile is empty
     * @type {Card | null}
    */
    this.placeholderCard = null;
  }

  /**
   * Get height of pile
   * @type number
   */
  get h() { return this.size === 0 ? this.ch : this.ch + this.margin * (this.size - 1); }

  /**
   * Get width of pile
   * @type number
   */
  get w() { return this.cw; }

  /**
   * Get how many cards there are are this pile
   * @return {Number} Size of pile
   */
  get size() { return this.cards.length; }

  /**
   * Set render position
   * @param {Number} x    X Coordinate to display at. If not provided, use this.cx
   * @param {Number} y    y Coordinate to display at. If not provided, use this.cy
   */
  position(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Apply a style to the cards
   * @param {Number} style    Style to apply; member of PileStyle enum. Default to whatever was used last time
   */
  applyStyle(style = undefined) {
    if (typeof style == 'number') this._style = style;

    for (let i = 0; i < this.cards.length; i++) {
      switch (this._style) {
        case PileStyle.allRevealed:
          this.cards[i].isHidden = false;
          break;
        case PileStyle.allHidden:
          this.cards[i].isHidden = true;
          break;
        case PileStyle.topRevealed:
          this.cards[i].isHidden = i !== this.cards.length - 1;
      }
    }
  }

  update() {
    const deltaY = this.isFlipped ? this.margin * this.cards.length : 0;

    for (let i = 0; i < this.cards.length; i++) {
      if (!this.cards[i].isFree) {
        // Handle drawing
        let offset = (this.cards.length - i) * this.margin;
        if (this.isFlipped) offset = -offset;

        this.cards[i].h = this.ch;
        this.cards[i].w = this.cw;

        this.cards[i].displayAt(this.x, this.y + deltaY + offset);
      }
    }
  }

  display(ctx) {
    if (this.cards.length === 0 || (this.cards.length === 1 && this.cards[0].isFree)) {
      // Outline
      ctx.strokeStyle = "#fafafa";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#ffffff19";
      ctx.beginPath();
      ctx.rect(this.x, this.y, this.cw, this.ch); // 5
      ctx.fill();
      ctx.stroke();

      // Show destination suit/type card
      if (this.placeholderCard) {
        this.placeholderCard.w = this.cw;
        this.placeholderCard.h = this.ch;
        this.placeholderCard.displayAt(this.x, this.y);

        ctx.globalAlpha = 0.5;
        this.placeholderCard.display(ctx);
        ctx.globalAlpha = 1;
      }
    } else {
      // If margin is zero, only need to display top card
      if (this.margin < 0) {
        this.peek().display(ctx);
      } else {
        for (let i = 0; i < this.cards.length; i++) {
          this.cards[i].display(ctx);
        }
      }
    }

    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();
    ctx.strokeStyle = "#c8c8c8";
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }

  toString() {
    return this.cards.map(c => c.toString()).join(', ');
  }

  /**
   * Get top card of pile
   * @return {Card} Top card
   */
  peek() {
    return this.cards.length === 0 ? null : this.cards[this.cards.length - 1];
  }

  /**
   * Add cards to top of pile
   * @param {Card[]} cards   Cards to add
   * @return {Boolean} Added card?
   */
  push(...cards) {
    if (this.size + cards.length > this.maxSize) return false;
    this.cards.push(...cards);
    this.applyStyle(); // Re-apply style
    return true;
  }

  /**
   * Remove card from top of pile
   * @return {Card} Card removed
   */
  pop() {
    const card = this.cards.pop();
    return card;
  }

  /**
   * Pile contains the mouse click? (test top card only)
   * @param {Number} x    X coordinate
   * @param {Number} y    Y coordinate
   * @return {Boolean} Is over pile body?
   */
  contains(x, y) {
    return (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h);
  }

  /**
   * Which card on the pile contains the given coordinates?
   * @param {Number} x    X coordinate
   * @param {Number} y    Y coordinate
   * @return {Card | null} Card
   */
  cardContains(x, y) {
    for (let i = this.cards.length - 1; i > -1; i--) {
      if (this.cards[i].contains(x, y)) return this.cards[i];
    }
    return null;
  }

  /**
   * Set card dimensions by using a scaling multipler
   * @param {Number} mult     Multiplier
   */
  cardDimensions(mult) {
    this.cw *= mult;
    this.ch *= mult;
  }

  *[Symbol.iterator]() {
    for (const card of this.cards) yield card;
  }
}

export const PileStyle = Object.freeze({
  allHidden: 0,
  topRevealed: 1,
  allRevealed: 255,
});