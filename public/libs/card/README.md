# Card Library

Library for playing cards

## Classes

- `Card` - represents a single playing cards with a suit and type
- `Pile` - represents a pile/stack of playing cards. A collection of cards.
- `Deck` - represents an entire deck of playing cards. A collection of cards and piles.
- `CardTable` - basic class for rendering multiple decks to a canvas context, with the option of adding interactive events


## `CardTable.initialise`

Signature: `(canvas: HTMLCanvasElement, callbacks: object, handlers: object): object`

Initliases events for a canvas. Returns a collection of functions.

- `callbacks` is used for custom callbacks on events: `onMouseDown`, `onMouseUp`, `onMouseMove`, `onMouseDrag`. All signatures are `(event: Event, obj: object, cardTable: CardTable)`
- `handlers` is used for handling events happening to cards within the canvas. Any function may be omitted.
  - `onPileClick` is triggered when a pile is clicked on. `(card: Card, pile: Pile, ) => void`

  - `onDragStart` is triggered when a card is beginning to be dragged from a pile. Return `boolean` to indicate whether to continue dragging or not. `(card: Card, pile: Pile, event: Event, object: object) => boolean`
    - `card` - card being dragged
    - `pile` - origin pile of `card`

  - `onDrag` is triggered when cards are being dragged. This is called if `onDragStart` returns truthy. `(cards: Card[], pile: Pile, event: Event, object: object) => void`
    - `cards` - cards being dragged. Displayed like Pile.
    - `pile` - origin pile of `card`

  - `onDragEnd` is triggered when cards dropped onto a pile. Return `boolean` to indicate if the cards may be dropped here. `(cards: Card[], pileSrc: Pile, pileDst: Pile, event: Event, object: object) => boolean`
    - `cards` - cards which have been dropped. Displayed like Pile.
    - `pileSrc` - origin pile of cards
    - `pileDst` - destination pile of cards

  - `onDrop` is triggered when cards have been dropped after being dragged and added to a pile. This is called if `onDragEnd` is truthy. `(success: boolean, cards: Card[], pileSrc: Pile, pileDst: Pile, event: Event, object: object) => void`
    - `success` - were the `cards` added to `pileDst`?
    - `cards` - cards which have been dropped. Displayed like Pile.
    - `pileSrc` - origin pile of cards
    - `pileDst` - destination pile of cards

  - `onClick` is triggered when a card is clicked on. `(card: Card, pile: Pile, event: Event, object: object) => void`
    - `card` - card clicked on
    - `pile` - origin pile of card

  - `onHover` is trigger when a card is hovered over. Return `boolean` to indicate whether this should be recognised as a hover event. If not defined, it will default to `true` if the card hovered over is the topmost card of `pile`. `(card: Card, pile: Pile, event: Event, object: object) => boolean`
    - `card` - card clicked on
    - `pile` - origin pile of card