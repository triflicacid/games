import { Sounds } from "../../libs/Sound.js";
import { CardTable } from "../../libs/card/cardTable.js";
import { Deck } from "../../libs/card/deck.js";
import { Card } from "../../libs/card/card.js";
import { PileStyle } from "../../libs/card/pile.js";
import { loadImages } from "../../libs/card/loadImages.js";

const CARD_LIB_PATH = "../../libs/card/";

// VARIABLES
const boardWidth = 1200;
const boardHeight = 750;

const pileSpacing = 150;
const pileSizeMult = 2.5;

var canvas, ctx, eventObject;

/** @type CardTable */
var cardTable;

/**
 * Main card manager
 * @type Deck
 */
var deck;

/**
 * Main card pile
 * @type Pile
 */
var mainPile;

/**
 * Draw pile - visible cards once drawn from mainPile
 * @type Pile
 */
var drawPile;

/**
 * Active piles - running right (2) to left (7)
 * @type Pile[]
 */
var activePiles = [];

/**
 * Ace piles
 * @type {{[suit: string]: Pile}}
 */
var acePiles = {
  "spades": undefined,
  "hearts": undefined,
  "diamonds": undefined,
  "clubs": undefined,
};

/**
 * Disregard card suit when inserting i to main piles?
 */
var disregardSuit = false;

/**
 * Has the game been won?
 */
var hasWon = false;

/**
 * Margin for card piles
 */
var cardPileMargin = 25;

/** Setup card table */
function setup(cardTable) {
  // Initialise deck
  deck = new Deck();
  deck.shuffle();
  cardTable.decks.push(deck);

  // Set up ace piles
  let x = boardWidth - pileSpacing * 4;
  let y = cardPileMargin;
  for (const suit in acePiles) {
    const pile = deck.createPile(x, y);
    pile.cardDimensions(pileSizeMult);
    pile.setLock(false, (s) => acePileSuitLock(s, suit), (t) => acePileTypeLock(pile, t));
    pile.placeholderCard = new Card(suit, 'A');
    pile.isInteractive = false;
    pile.onDrop = () => acePileCardDrop(pile);
    acePiles[suit] = pile;

    x += pileSpacing;
  }

  // Main pile
  mainPile = deck.createPile(cardPileMargin, y);
  mainPile.cardDimensions(pileSizeMult);
  mainPile.isInteractive = false;
  mainPile.onDragEnd = () => false;
  mainPile.onclick = clickMainPile;

  // Set up active piles
  x = boardWidth - pileSpacing * 6;
  y += pileSpacing * 1.25;
  for (let i = 0; i < 6; i++, x += pileSpacing) {
    const pile = deck.createPile(x, y);
    pile.cardDimensions(pileSizeMult);
    pile.maxSize = i + 2;
    pile.margin = cardPileMargin;
    pile.onclick = clickOnActivePile;
    pile.onDragStart = card => dragStartActivePile(card, pile);
    pile.onHover = card => hoverOverActivePile(card, pile);
    pile.onDrop = cardDroppedIntoPile;
    activePiles[i] = pile;

    let added;
    do {
      const card = deck.getRandom();
      added = pile.push(card);
      if (added) {
        deck.removeCard(card);
      }
    } while (added);

    pile.maxSize = NaN;
    pile.isFlipped = true;

    // Hide all cards except bottom
    for (let i = 0; i < pile.cards.length - 1; i++) pile.cards[i].isHidden = true;
  }

  // Draw Pile
  drawPile = deck.createPile(cardPileMargin, y);
  drawPile.cardDimensions(pileSizeMult);
  drawPile.onDragEnd = () => false;
  drawPile.onDrop = cardDroppedIntoPile;
  drawPile.applyStyle(PileStyle.topRevealed);

  // Put all remaining cards into mainPile
  for (let i = deck.cards.length - 1; i > -1; i--) {
    const card = deck.cards[i];
    mainPile.push(card);
    deck.cards.splice(i, 1);
  }
  mainPile.applyStyle(PileStyle.allHidden);

  // Add locks to activePiles
  for (const pile of activePiles) {
    pile.setLock(false, (s) => activePileSuitLock(pile, s), (t) => activePileTypeLock(pile, t));
  }

  customSetup();
}

/**
 * Clicked on activePiles member
 * @param {Card} card     Card clicked on
 * @param {Pile} pile     Pile clicked on 
 */
function clickOnActivePile(card, pile) {
  // console.log("Click: ", card)
  if (card == pile.peek()) {
    card.isHidden = !card.isHidden;
    playCardSlide();
  }
}

/**
 * Click on mainPile
 */
function clickMainPile() {
  if (mainPile.size() > 0) {
    const card = mainPile.peek();

    // Draw card into drawPile
    if (drawPile.push(card)) {
      mainPile.pop();
      playCardTakeOutPack();
    }
  } else {
    // Reset mainPile from drawPile
    mainPile.cards = [...drawPile.cards];
    mainPile.cards.reverse();
    mainPile.applyStyle(PileStyle.allHidden);

    drawPile.cards.length = 0;
    cardTable.doUpdate = true;

    Sounds.play('cardFan');
  }
}

/**
 * Are all acePiles flagged?
 */
function checkWin() {
  let won = true;

  for (const suit in acePiles) {
    if (acePiles.hasOwnProperty(suit)) {
      if (acePiles[suit].hasFlag !== true) {
        won = false;
        break;
      }
    }
  }

  if (won) {
    hasWon = true;
    Sounds.play('tada');

    for (const deck of cardTable.decks) {
      for (const pile of deck.piles) {
        pile.isInteractive = false;
        pile.onclick = undefined;
        for (const card of pile.cards) {
          card.isHidden = false;
        }
      }
    }
    cardTable.doUpdate = true;
  }
}

/**
 * Lock for ace pile suit
 * @param {String} s        Card suit 
 * @param {String} suit     Required suit
 * @return {Boolean} Insert?
 */
function acePileSuitLock(s, suit) {
  const bool = s == suit;
  if (!bool) Sounds.play("error");
  return bool;
}

/**
 * Lock for ace pile type
 * @param {Pile} pile       Pile being inserted into
 * @param {String} type     Type of card being inserted
 * @return {Boolean} Insert?
 */
function acePileTypeLock(pile, type) {
  let insert = false;

  if (pile.size() === 0) {
    // Only accept aces
    insert = type == 'A';
  } else {
    // Value above last card?
    const last = pile.peek().type;
    const lastIndex = Card.types.indexOf(last);

    const req = Card.types[lastIndex + 1];

    insert = type === req;
  }

  if (insert) {
    playCardPlace();

    if (type == 'K') {
      // Completed Ace Pile
      pile.hasFlag = true;
      pile.setLock(true);
      Sounds.play("rainbow");

      pile.isInteractive = false;
    }
  } else {
    Sounds.play("error");
  }
  return insert;
}

/**
 * When card dropped on Ace pile
 * @param {Pile} pile       Pile dropped on to
 */
function acePileCardDrop(pile) {
  for (const card of pile.cards) {
    card.isHidden = false;
  }
}

/**
 * Only allow alternating colours
 * @param {Pile} pile     Pile dropping into
 * @param {String} suit   Card suit
 * @return {Boolean} Insert?
 */
function activePileSuitLock(pile, suit) {
  let insert = false;

  if (disregardSuit || pile.size() === 0) {
    insert = true;
  } else {
    // get last card's suit
    const lastSuit = pile.peek().suit;
    if ((lastSuit == "spades" || lastSuit == "clubs") && (suit == "hearts" || suit == "diamonds")) insert = true;
    if ((lastSuit == "hearts" || lastSuit == "diamonds") && (suit == "spades" || suit == "clubs")) insert = true;
  }

  return insert;
}

/**
 * Card inserted into pile
 * @param {Boolean} success     Card inserted OK?
 */
function cardDroppedIntoPile(success) {
  if (success) {
    playCardPlace();
  } else {
    Sounds.play("error");
  }
}

/**
 * Only allow decrementing card types
 * @param {Pile} pile     Pile dropping into
 * @param {String} suit   Card suit
 * @return {Boolean} Insert?
 */
function activePileTypeLock(pile, type) {
  let insert = false;

  if (pile.size() === 0) {
    insert = true;
  } else {
    const lastType = pile.peek().type;
    const lastTypeVal = Card.types.indexOf(lastType);
    insert = Card.types.indexOf(type) === lastTypeVal - 1;
  }

  return insert;
}

/**
 * Hover over an active pile
 * @param {Card} card       Card hovering over
 * @param {Pile} pile       Pile hovering over 
 */
function hoverOverActivePile(card, pile) {
  if (pile.size() === 0) {
    return false;
  } else if (card == pile.peek()) {
    return true;
  } else if (!card.isHidden) {
    return true;
  } else {
    return false;
  }
}

function dragStartActivePile(card, pile) {
  if (card.isHidden) return false;
  return true;
}

async function main() {
  // ===== Sounds Effects =====
  for (let i = 1; i <= 8; i++) Sounds.create(`cardSlide${i}`, `${CARD_LIB_PATH}sounds/cardSlide${i}.wav`);
  for (let i = 1; i <= 4; i++) Sounds.create(`cardPlace${i}`, `${CARD_LIB_PATH}sounds/cardPlace${i}.wav`);
  for (let i = 1; i <= 2; i++) Sounds.create(`cardTakeOutPack${i}`, `${CARD_LIB_PATH}sounds/cardTakeOutPack${i}.wav`);
  Sounds.create(`cardFan`, `${CARD_LIB_PATH}sounds/cardFan1.wav`);
  Sounds.create(`error`, `./assets/error.mp3`);
  Sounds.create(`rainbow`, `./assets/rainbow.mp3`);
  Sounds.create(`tada`, `./assets/tada.mp3`);

  await loadImages(`${CARD_LIB_PATH}spritesheet.png`);

  canvas = document.createElement("canvas");
  canvas.width = boardWidth;
  canvas.height = boardHeight;
  document.getElementById("canvas-container").appendChild(canvas);
  ctx = canvas.getContext("2d");

  cardTable = new CardTable();
  setup(cardTable);
  eventObject = cardTable.addEventListeners(canvas);
  display();
}

function display() {
  cardTable.display(ctx, eventObject);

  if (!hasWon) {
    // Make sure top card of drawPile is showing
    const top = drawPile.peek();
    if (top && top.isHidden) {
      top.isHidden = false;
    }

    checkWin();
  }
}

function customSetup() {
  return 0;
}

window.addEventListener("load", main);