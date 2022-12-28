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
  initialise(canvas, callbacks = {}, handlers = {}) {
    const map = new Map(); // [eventName: string]: eventCallback: (event: Event) => void
    let cardsDragging = []; // Which cards are being dragged? (displayed like pile)
    let cardsDraggingSrc = null; // Source Pile of `cardDragging`
    let cardOver = null;
    let isMouseDown = false, mouseX = 0, mouseY = 0;
    let isSuspended = false;
    const cardPileMargin = 25; // Margin for card piles

    const onMouseDown = (event) => {
      if (isSuspended) return;
      isMouseDown = true;
      // Try to drag a card...
      outerLoop: {
        for (const deck of this.decks) {
          for (const pile of deck.piles) {
            if (pile.isInteractive && pile.size > 0) {
              const _cardOver = pile.cardContains(mouseX, mouseY);
              if (_cardOver && (!handlers.onDragStart || handlers.onDragStart(_cardOver, pile, event, obj))) {
                cardsDraggingSrc = pile;
                obj.cardsDraggingSrc = pile;
                cardOver = _cardOver;
                obj.cardOver = _cardOver;
                const startI = pile.cards.indexOf(cardOver);
                for (let i = startI; i < pile.cards.length; i++) cardsDragging.push(pile.cards[i]);
                if (handlers.onDrag) handlers.onDrag(cardsDragging, pile, event, obj);
                break outerLoop;
              }
            }
          }
        }
      }
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
                  let ok = false;
                  // Try inserting into pile
                  if (!handlers.onDragEnd || handlers.onDragEnd(cardsDragging, cardsDraggingSrc, pile, event, obj)) {
                    // Push cards
                    pile.cards.push(...cardsDragging);

                    for (const card of cardsDragging) {
                      const i = cardsDraggingSrc.cards.indexOf(card);
                      if (i !== -1) cardsDraggingSrc.cards.splice(i, 1);
                    }
                    obj.update = true;
                    ok = true;
                  }
                  if (handlers.onDrop) handlers.onDrop(ok, cardsDragging, cardsDraggingSrc, pile, event, obj);
                  break outerLoop;
                }
              } else {
                // Register a click on pile
                if (handlers.onClick) handlers.onClick(pile.cardContains(mouseX, mouseY), pile, event, obj);
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
      ([mouseX, mouseY] = extractCoords(event));

      // Unhighlight card if highlighted
      if (cardOver) cardOver.isHighlighted = false;

      outerLoop: {
        // Loop through each deck...
        for (const deck of this.decks) {
          // Each pile...
          for (const pile of deck.piles) {
            // If over
            if (pile.size > 0) {
              const _cardOver = pile.cardContains(mouseX, mouseY);
              if (_cardOver && (handlers.onHover ? handlers.onHover(_cardOver, pile, event, obj) : _cardOver === pile.peek())) {
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
      update: true,

      /** Return which card the user is current over */
      cardOver,

      /** Is execution suspended? */
      isSuspended: () => isSuspended,

      /** Suspend/unsuspend execution */
      suspend: (b = true) => isSuspended = !!b,

      /** Return array of cards (displayed like pile) that the user is dragging */
      cardsDragging,
      cardsDraggingSrc,

      /** Clear cardsDragging etc... */
      reset: () => {
        cardsDragging.length = 0;
        cardsDraggingSrc = undefined;
        this.cardsDraggingSrc = undefined;
        cardOver = undefined;
        this.cardOver = undefined;
      },

      /** Get current mouse position */
      getCursorPos: () => ([mouseX, mouseY]),

      /** Remove deployed event listeners from `element` */
      removeEventListeners: () => void map.forEach((cb, name) => canvas.removeEventListener(name, cb)),
    };

    return obj;
  }

  /**
   * Display cards
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} initObj Returned object from this.initialise. Optional. Update deck positions if `eventObject.update === true` or is undefined.
   */
  display(ctx, initObj = undefined) {
    ctx.fillStyle = "#043e06";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.decks.forEach(deck => {
      if (initObj === undefined || initObj.update) deck.update();
      deck.display(ctx);
    });
    if (initObj) initObj.update = false;

    if (initObj) {
      // Always draw card dragging on top
      const cardsDragging = initObj.cardsDragging;
      for (let i = 0; i < cardsDragging.length; i++) {
        cardsDragging[i].display(ctx);
      }
    }
  }
}