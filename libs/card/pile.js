import { Card } from "./card.js";

/**
 * A pile or cards
 */
export class Pile {
    constructor(x, y) {
        /** @type Card[] */
        this.cards = [];

        // Margin offset between cards
        this.margin = 0; // On-top of each other

        // Coordinates of top-left corner
        this.x = x;
        this.y = y;

        this._style = NaN; // Last style that was used in applyStyle

        // Dimensions od card members
        this.cw = Card.width;
        this.ch = Card.height;

        this.lock = {
            /** Is insertion locked full stop? */
            locked: false,

            /**
             * Which suit are we locked to?
             * @type {(suit: string) => boolean}
             * @default () => true
             */
            suit: () => true,

            /**
             * Which type are we locked to?
             * @type {(type: string) => boolean}
             * @default () => true
             */
            type: () => true,
        };

        /** Can drag cards from etc... */
        this.isInteractive = true;

        // Max size of pile
        this.maxSize = NaN;

        // Is the pile displaying flipped?
        this.isFlipped = false;

        /**
         * What to do when clicked on
         * @type {(card: Card, pile: Pile) => void}
         */
        this.onclick = undefined;

        /**
         * Start dragging cards
         * - Return; start dragging?
         * @type {(card: Card, pile: Pile, event: MouseEvent, eventObject: object) => boolean}
         */
        this.onDragStart = undefined;

        /**
         * When card is dropped over pile (before attempting to insert)
         * - If return false, cancel drop
         * @type {(card: Card) => boolean}
         */
        this.onDragEnd = undefined;

        /**
         * When card is dropped over pile (after card was attempted to be inserted)
         * - Card will be push'd to pile if !this.locked.lock
         * - (1) Parameter: was card nserted into pile?
         * @type {(dropSuccess: boolean, card: Card, cardSrc: Pile, cardDest: Pile) => void}
         */
        this.onDrop = undefined;

        /**
         * When card is started being dragged from pile
         * - If function returns false, will cancel card drag
         * @type {(card: Card) => boolean | undefined}
         */
        this.ondrag = undefined;

        /**
         * Mouse if hovering over pile
         * - Return value - should the card register as hovering?
         * @type {(cardOver: Card, pile: Pile) => boolean}
         */
        this.onHover = undefined;

        /** A flag which may be used for external purposes */
        this.hasFlag = false;

        /**
         * Card to display if pile is empty
         * @type {Card | null}
        */
        this.placeholderCard = null;

        /** Event object rendering to, if applicable */
        this.eventObject = undefined;
    }

    /**
     * Get height of pile
     * @type number
     */
    get h() { return this.size() === 0 ? this.ch : this.ch + this.margin * (this.size() - 1); }

    /**
     * Get width of pile
     * @type number
     */
    get w() { return this.cw; }

    /**
     * Return how many cards there are
     * @return {Number} Size of pile
     */
    size() { return this.cards.length; }

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

                // p.push();
                // p.tint(255, 50);
                this.placeholderCard.display(ctx);
                // p.pop();
            }
        } else {
            // If margin is zero, only need to display top card
            if (this.margin < 0) {
                this.peek().display();
            } else {
                for (let i = 0; i < this.cards.length; i++) {
                    this.cards[i].display();
                }
            }
        }

        // p.stroke(255);
        // p.circle(this.x, this.y, 5);
        // p.noFill();
        // p.stroke(200);
        // p.rect(this.x, this.y, this.w, this.h);
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
        if (!isNaN(this.maxSize) && this.size() + cards.length > this.maxSize) return false;
        if (this.lock.locked) return false;

        // Make sure fit lock
        for (const card of cards) {
            if (typeof this.lock.suit === "function" && this.lock.suit(card.suit) !== true) return false; // throw new Error(`Cannot push card '${card.toString()}': suit mismatch: '${card.suit}' != '${this.lock.suit}'`);
            if (typeof this.lock.type === "function" && this.lock.type(card.type) !== true) return false; // throw new Error(`Cannot push card '${card.toString()}': type mismatch: '${card.type}' != '${this.lock.type}'`);
        }

        this.cards.push(...cards);
        this.applyStyle();
        if (this.eventObject) this.eventObject.update = true;
        return true;
    }

    /**
     * Remove card from top of pile
     * @return {Card} Card removed
     */
    pop() {
        const card = this.cards.pop();
        eventObject.update = true;
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

    /**
     * Lock insertion of cards
     * @param {Boolean} locked          Can this pile be inserted into?
     * @param {(suit: string) => boolean} suit      Locked suit. null -> no lock
     * @param {(type: string) => boolean} type      Locked type. null -> no lock
     * @default suit=null, type=null
     */
    setLock(locked, suit = null, type = null) {
        this.lock.locked = locked == true;
        this.lock.suit = suit;
        this.lock.type = type;
    }

    /**
     * Click on pile; execute this.onclick
     * @param {Card} card       Card clicked on
     */
    click(card) {
        if (typeof this.onclick === 'function') this.onclick(card, this);
    }

    /**
     * Hover over pile
     * - Default - only return true if card is topmost (peek) card
     * @param {Card} cardOver       Card hovering over
     * @return {Boolean} Register card as hovered over?
     */
    hover(cardOver) {
        if (typeof this.onHover === 'function') {
            return this.onHover(cardOver, this);
        } else {
            return cardOver && cardOver == this.peek();
        }
    }

    /**
     * Start dragging card
     * @param {Card} card     Which card is being dragged
     * @param {Event} event
     * @param {object} eventObject object from CardTable.addEventListeners
     */
    dragStart(card, event, eventObject) {
        if (typeof this.onDragStart === 'function') {
            return this.onDragStart(card, this, event, eventObject);
        } else {
            return card && card == this.peek();
        }
    }

    /**
     * Drop card on pile; execute this.onDragEnd
     * @param {MouseEvent} event
     * @param {object} eventObject object returned from this.addEventListeners()
     */
    dragEnd(event, eventObject) {
        if (typeof this.onDragEnd === 'function') return this.onDragEnd(this.eventObject.cardsDragging);
    }

    /**
     * Dropped card on pile; execute this.onDrop
     * @param {Boolean} success     Was drop successful?
     * @param {Pile} dest           New pile
     */
    drop(success, dest) {
        if (typeof this.onDrop === 'function') return this.onDrop(success == true, this.eventObject.getCardsDragging(), this.eventObject.getCardDraggingSrc(), dest);
    }

    /**
     * Start dragging card from pile; execute this.ondrag
     * @param {MouseEvent} event
     * @param {object} eventObject object returned from this.addEventListeners()
     */
    drag(event, eventObject) {
        if (typeof this.ondrag === 'function') return this.ondrag(this.eventObject.getCardsDragging());
    }

    *[Symbol.iterator]() {
        for (const card of this.cards) yield card;
    }
}

export const PileStyle = {
    topRevealed: 1,
    allRevealed: 255,
    allHidden: 0,
};