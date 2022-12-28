export class Card {
  /**
   * @param {"spades" | "clubs" | "diamonds" | "hearts"} suit       Suit of card
   * @param {"A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "J" | "Q" | "K"} type         Type of card
   */
  constructor(suit, type) {
    this.suit = suit;
    // if (Card.suits.indexOf(this.suit) === -1) throw new TypeError(`Invalid card suit '${this.suit}'`);

    this.type = type;
    // if (Card.types.indexOf(this.type) === -1) throw new TypeError(`Invalid card type '${this.type}'`);

    this.isHidden = false;
    this.isHighlighted = false;
    this.isFree = false; // Is card free, or locked into place by Pile?

    // If rendered; top-left position of card
    this.x = NaN;
    this.y = NaN;

    // Dimensions of card
    this.w = Card.width;
    this.h = Card.height;
  }

  /**
   * Get full name of card
   * @return {String} string value 
   */
  toString() {
    return this.type + " of " + this.suit;
  }

  /**
   * Get associated image
   * @return {p5.Image | null} Image or NULL
   */
  getImage() {
    if (this.isHidden) {
      return Card.images.hidden;
    } else {
      // Get y index
      let y = Card.suits.indexOf(this.suit);
      if (y === -1) return Deck.images.empty;

      // Get x index
      let x = Card.types.indexOf(this.type);
      if (isNaN(x)) return Deck.images.empty;

      return Card.images[this.suit][x];
    }
  }

  /**
   * Get value of card
   * @return {Number[]} Values of card (Ace can have two values)
   */
  getValue() {
    switch (this.type) {
      case "A":
        return [1, 11];
      case "J":
      case "Q":
      case "K":
        return [10];
      default:
        // Numerical value
        return [+this.type];
    }
  }

  /**
   * Get colour of card
   * @return {"red" | "black"} Colour
   */
  getColour() {
    return (this.suit == "spades" || this.suit == "clubs") ? "black" : "red";
  }

  /**
   * Set render position
   * @param {Number} x    X Coordinate to display at. If not provided, use this.cx
   * @param {Number} y    y Coordinate to display at. If not provided, use this.cy
   */
  displayAt(x, y) {
    if (isNaN(+x) || isNaN(+y)) {
      this.x = NaN;
      this.y = NaN;
    } else {
      this.x = +x;
      this.y = +y;
    }
  }

  /**
   * Display card at given position
   * @return {Boolean} Displayed?
   */
  display(ctx) {
    const img = this.getImage();
    if (img) {
      let filter = ctx.filter;
      if (this.isHighlighted) {
        ctx.filter = "sepia(50%)";
      }
      ctx.drawImage(img, this.x, this.y, this.w, this.h);

      ctx.filter = filter;
      return true;
    } else {
      return false;
    }
  }

  /**
   * "Clicked" on this card?
   * @param  {Number} x   X coordinate
   * @param  {Number} y   Y coordinate
   * @return {Boolean} On/over card?
   */
  contains(x, y) {
    if (!isNaN(this.x) && !isNaN(this.y)) {
      return (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h);
    } else {
      // Not displayable...
      return false;
    }
  }

  /**
   * Flip hiddeness of this card
   */
  flip() {
    this.isHidden = !this.isHidden;
  }
}

/**
 * All possible types of card
 */
Card.types = Object.seal(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]);

/**
 * All possible suits of card
 */
Card.suits = Object.seal(["spades", "hearts", "clubs", "diamonds"]);

/** Width of card */
Card.width = 40;

/** Height of card */
Card.height = 54;

/** Images: arrays are [A, 2, 3, 4, 5, 6, 7, 8, 9, J, Q, K] */
Card.images = {
  spades: [],
  hearts: [],
  clubs: [],
  diamonds: [],
  hidden: undefined,
};
