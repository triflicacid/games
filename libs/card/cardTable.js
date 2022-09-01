import { Deck } from "./deck.js";
import { extractCoords } from "../util.js";

export class CardTable {
  constructor() {
    /** Issue an update on all decks */
    this.doUpdate = false;

    /**
     * Decks to be rendered
     * @type Deck[]
     */
    this.decks = [];

    // this.__p5Init();
  }

  /**
   * Add events to the given element.
   * @param {HTMLCanvasElement} canvas Canvas element that this will be drawn to. Must be able to recieve keydown events (set property `tabindex`)
   * @param {object} callbacks Functions which will be called on events being recieved: `onMouseDown`, `onMouseUp`, `onMouseMove`, `onMouseDrag`. Signature: (event, returned object, CardTable)
   * @return {object} return object of functions. Notable properties include:
   *  - `removeEventListeners: () => void`, which will remove all event listeners from `canvas`.
   *  - `update: boolean`, will be set to `true` if a display update is needed.
  */
  addEventListeners(canvas, callbacks = {}) {
    const map = new Map(); // [eventName: string]: eventCallback: (event: Event) => void
    let cardsDragging = []; // Which cards are being dragged? (displayed like pile)
    let cardsDraggingSrc = null; // Source Pile of `cardDragging`
    let cardOver = null;
    let isMouseDown = false, mouseX = 0, mouseY = 0;
    let isSuspended = false;

    const onMouseDown = (event) => {
      if (isSuspended) return;
      ([mouseX, mouseY] = extractCoords(event));
      isMouseDown = true;
      // Try to drag a card...
      outerLoop: {
        for (const deck of this.decks) {
          for (const pile of deck.piles) {
            if (pile.isInteractive && pile.size() > 0) {
              const _cardOver = pile.cardContains(mouseX, mouseY);
              if (_cardOver && pile.dragStart(_cardOver, event, eventObject)) {
                cardsDraggingSrc = pile;
                obj.cardsDraggingSrc = pile;
                cardOver = _cardOver;
                obj.cardOver = _cardOver;
                const startI = pile.cards.indexOf(cardOver);
                for (let i = startI; i < pile.cards.length; i++) cardsDragging.push(pile.cards[i]);
                pile.drag(event, obj);
                break outerLoop;
              }
            }
          }
        }
      };
      if (callbacks.onMouseDown) callbacks.onMouseDown(event, obj, this);
    };
    map.set("mousedown", onMouseDown);

    const onMouseUp = (event) => {
      if (isSuspended) return;
      isMouseDown = false;
      // Click on a pile?
      outerLoop: {
        for (const deck of this.decks) {
          for (const pile of deck.piles) {
            const contains = pile.contains(mouseX, mouseY);
            if (contains) {
              if (cardsDragging.length !== 0 && cardsDraggingSrc) {
                if (pile !== cardsDraggingSrc && cardsDragging[0] !== pile.peek()) {
                  // Try inserting into pile
                  if (pile.dragEnd(event, obj) !== false && pile.push(cardsDragging[0])) {
                    // Push rest of cards
                    pile.cards.push(...cardsDragging.slice(1));

                    for (const card of cardsDragging) {
                      const i = cardsDraggingSrc.cards.indexOf(card);
                      if (i !== -1) cardsDraggingSrc.cards.splice(i, 1);
                    }
                    pile.drop(true, pile);
                  } else {
                    pile.drop(false, undefined);
                  }
                  break outerLoop;
                }
              } else {
                // Register a click on pile
                pile.click(pile.cardContains(mouseX, mouseY));
              }
            }
          }
        }
      }

      if (cardsDragging.length !== 0) {
        cardsDragging.forEach(c => {
          c.isFree = false;
          c.isHighlighted = false;
        });

        cardsDragging.length = 0;
        obj.update = true;
      }
      if (cardsDraggingSrc) {
        cardsDraggingSrc = null;
        obj.cardsDraggingSrc = null;
      }

      if (callbacks.onMouseUp) callbacks.onMouseUp(event, obj, this);
    };
    map.set("mouseup", onMouseUp);

    const onMouseMove = (event) => {
      if (isSuspended) return;

      // Unhighlight card if highlighted
      if (cardOver) cardOver.isHighlighted = false;

      outerLoop: {
        // Loop through each deck...
        for (const deck of this.decks) {
          // Each pile...
          for (const pile of deck.piles) {
            // If over
            if (pile.size() > 0) {
              const _cardOver = pile.cardContains(mouseX, mouseY);
              if (_cardOver && pile.hover(_cardOver)) {
                cardOver = _cardOver;
                cardOver.isHighlighted = true;
                break outerLoop;
              }
            }
          }
        }
      }

      if (callbacks.onMouseMove) callbacks.onMouseMove(event, obj, this);

      // Dragging?
      if (isMouseDown) onMouseDrag(event);
    };
    map.set("mousemove", onMouseMove);

    // Called from onMouseMove
    const onMouseDrag = (event) => {
      if (isSuspended) return;
      if (cardsDragging.length !== 0) {
        let x = mouseX, y = mouseY;
        for (let i = 0; i < cardsDragging.length; i++) {
          cardsDragging[i].displayAt(x, y);
          cardsDragging[i].isHighlighted = true;
          y += cardPileMargin;
        }
      }
      if (callbacks.onMouseDrag) callbacks.onMouseDrag(event, obj, this);
    };

    // Add events
    map.forEach((cb, name) => canvas.addEventListener(name, cb));

    /** Call to remove all events */
    const obj = {
      /** Is a display update required? */
      update: false,

      /** Return which card the user is current over */
      cardOver,

      /** Is execution suspended? */
      isSuspended: () => isSuspended,

      /** Suspend/unsuspend execution */
      suspend: (b = true) => isSuspended = !!b,

      /** Return array of cards (displayed like pile) that the user is dragging */
      cardsDragging,
      cardsDraggingSrc,

      /** Remove deployed event listeners from `element` */
      removeEventListeners: () => void map.forEach((cb, name) => canvas.removeEventListener(name, cb)),
    };

    return obj;
  }

  /**
   * Display cards
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} eventObject Returned object from this.addEventListeners
   */
  display(ctx, eventObject) {
    ctx.fillStyle = "#043e06";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.decks.forEach(deck => {
      if (eventObject.update) deck.update();
      deck.display(ctx);
      if (activePiles.indexOf(deck) !== -1) console.log(deck);
    });
    eventObject.update = false;

    // Always draw card dragging on top
    const cardsDragging = eventObject.cardsDragging;
    if (cardsDragging.length !== 0) {
      for (let i = 0; i < cardsDragging.length; i++) {
        cardsDragging[i].display(ctx);
      }
    }
  }

  /**
   * Try to execute a function in this.functions
   * @param {String} fname  Function name
   * @return {undefined | any} Undefined if function not exist, else return value of function
   */
  async __fexec(fname) {
    const f = this.functions[fname];
    return typeof f === 'function' ? await f(this) : void 0;
  }

  __p5Init() {
    const s = p => {
      p.preload = () => {
        Deck.loadImages(async () => {
          await this.__fexec('preload');
          this.loadedImages = true;
        });
      };

      p.setup = () => {
        const canvas = p.createCanvas(this.cwidth, this.cheight);
        if (typeof this.cparent == 'string') canvas.parent(this.cparent);

        p.frameRate(16);

        this.__fexec('setup');

        this.doUpdate = true;
      };
    };
    this.p5 = new p5(s);
  }
}