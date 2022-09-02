import { Sounds } from "../../libs/Sound.js";
import { CardTable } from "../../libs/card/cardTable.js";
import { Deck } from "../../libs/card/deck.js";
import { Card } from "../../libs/card/card.js";
import { PileStyle } from "../../libs/card/pile.js";
import { loadImages } from "../../libs/card/loadImages.js";
import { createAnimation } from "../../libs/util.js";

const CARD_LIB_PATH = "../../libs/card/";
const FPS = 15;

// VARIABLES
const boardWidth = 1200;
const boardHeight = 750;

const pileSpacing = 150;
const pileSizeMult = 2.5;

var canvas, ctx, initObj;

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
var acePiles = {};
var acePilesDone = {}; // Same as acePiles, but values are boolean

Card.suits.forEach(suit => {
  acePiles[suit] = undefined;
  acePilesDone[suit] = false;
});

/**
 * Disregard card suit when inserting into main piles?
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
  cardTable.decks.push(deck);
  deck.shuffle();

  // Set up ace piles
  let x = boardWidth - pileSpacing * 4;
  let y = cardPileMargin;
  for (const suit in acePiles) {
    const pile = deck.createPile(x, y);
    pile.cardDimensions(pileSizeMult);
    pile.placeholderCard = new Card(suit, 'A');
    pile.isInteractive = false;
    acePiles[suit] = pile;
    acePilesDone[suit] = false;

    x += pileSpacing;
  }

  // Main pile
  mainPile = deck.createPile(cardPileMargin, y);
  mainPile.cardDimensions(pileSizeMult);
  mainPile.isInteractive = false;

  // Set up active piles
  x = boardWidth - pileSpacing * 6;
  y += pileSpacing * 1.25;
  for (let i = 0; i < 6; i++, x += pileSpacing) {
    const pile = deck.createPile(x, y);
    pile.cardDimensions(pileSizeMult);
    pile.maxSize = i + 2;
    pile.margin = cardPileMargin;
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
  drawPile.applyStyle(PileStyle.topRevealed);

  // Put all remaining cards into mainPile
  for (let i = deck.cards.length - 1; i > -1; i--) {
    mainPile.push(deck.cards[i]);
  }
  deck.cards.length = 0;
  mainPile.applyStyle(PileStyle.allHidden);

  afterSetup();
}

/**
 * Clicked on activePiles member
 * @param {Card} card     Card clicked on
 * @param {Pile} pile     Pile clicked on 
 */
function clickOnActivePile(card, pile) {
  if (card == pile.peek()) {
    card.isHidden = !card.isHidden;
    playCardSlide();
  }
}

/**
 * Click on mainPile
 */
function clickMainPile() {
  if (mainPile.size > 0) {
    const card = mainPile.peek();

    // Draw card into drawPile
    if (drawPile.push(card)) {
      mainPile.pop();
      initObj.update = true;
      playCardTakeOutPack();
    }
  } else {
    // Reset mainPile from drawPile
    mainPile.cards = [...drawPile.cards];
    mainPile.cards.reverse();
    mainPile.applyStyle(PileStyle.allHidden);

    drawPile.cards.length = 0;
    initObj.update = true;

    Sounds.play('cardFan');
  }
}

/**
 * Are all the Ace piles completed?
 */
function checkWin() {
  let won = Object.values(acePilesDone).filter(b => b).length === Card.suits.length;

  if (won) {
    hasWon = true;
    Sounds.play('tada');

    for (const deck of cardTable.decks) {
      for (const pile of deck.piles) {
        pile.isInteractive = false;
        for (const card of pile.cards) {
          card.isHidden = false;
        }
      }
    }
    initObj.update = true;
  }
}

/**
 * Hover over an active pile
 * @param {Card} card       Card hovering over
 * @param {Pile} pile       Pile hovering over 
 */
function hoverOverActivePile(card, pile) {
  if (pile.size === 0) {
    return false;
  } else if (card === pile.peek()) {
    return true;
  } else if (!card.isHidden) {
    return true;
  } else {
    return false;
  }
}

function createHandlers() {
  return {
    onDragStart: (card, pile) => {
      if (hasWon) return false;

      // Active pile?
      if (activePiles.includes(pile)) return !card.isHidden;

      // Is topmost card of pile?
      return card && card === pile.peek();
    },

    onDragEnd: (cards, pileSrc, pileDst) => {
      if (hasWon) return false;

      // Cannot place cards on these piles
      if (pileDst === mainPile || pileDst === drawPile) {
        Sounds.play("error");
        return false;
      }

      // Active pile?
      if (activePiles.includes(pileDst)) {
        let card = cards[0], okSuit = false, okType = false;

        // Consider suit
        if (disregardSuit || pileDst.size === 0) {
          okSuit = true;
        } else {
          // Get last card's suit
          const lastSuit = pileDst.peek().suit;
          if ((lastSuit == "spades" || lastSuit == "clubs") && (card.suit == "hearts" || card.suit == "diamonds")) okSuit = true;
          if ((lastSuit == "hearts" || lastSuit == "diamonds") && (card.suit == "spades" || card.suit == "clubs")) okSuit = true;
        }

        // Consider type
        if (pileDst.size === 0) {
          okType = true;
        } else {
          const lastType = pileDst.peek().type;
          okType = Card.types.indexOf(card.type) === Card.types.indexOf(lastType) - 1;
        }

        return okSuit && okType;
      }

      // Ace pile?
      for (let suit in acePiles) {
        if (acePiles[suit] === pileDst) {
          // Which card type is required
          let type;
          if (pileDst.size === 0) {
            // Only accept aces
            type = 'A';
          } else {
            // Value above last card?
            const last = pileDst.peek().type, lastIndex = Card.types.indexOf(last);
            type = Card.types[lastIndex + 1];
          }

          if (cards[0].suit === suit && cards[0].type === type) {
            return true;
          } else {
            Sounds.play("error");
            return false;
          }
        }
      }

      return true;
    },

    onDrop: (ok, cards, pileSrc, pileDst) => {
      if (hasWon) return;
      if (!ok) return void Sounds.play("error");
      playCardPlace();

      // Ace pile?
      for (let suit in acePiles)
        if (acePiles[suit] === pileDst) {
          // Check if pile is complete
          const top = pileDst.peek();
          if (top.type === 'K') {
            acePilesDone[suit] = true;
            Sounds.play("rainbow");
            pileDst.isInteractive = false; // Disable pile
            checkWin();
          } else {
            // Unhide every card
            for (const card of pileDst.cards) card.isHidden = false;
          }
        }
    },

    onClick: (card, pile) => {
      if (hasWon) return;
      if (pile === mainPile) return void clickMainPile();
      if (activePiles.includes(pile)) return void clickOnActivePile(card, pile);
    },

    onHover: (card, pile) => {
      if (hasWon) return;
      if (activePiles.includes(pile)) return hoverOverActivePile(card, pile);
      return false;
    },
  };
}

//#region Sounds
/** Play a "card slide" sound */
function playCardSlide() {
  const n = Math.floor(Math.random() * 8) + 1;
  Sounds.play(`cardSlide${n}`);
  return n;
}

/** Play a "card place" sound */
function playCardPlace() {
  const n = Math.floor(Math.random() * 4) + 1;
  Sounds.play(`cardPlace${n}`);
  return n;
}

/** Play a "card take out pack" sound */
function playCardTakeOutPack() {
  const n = Math.random() <= 0.5 ? 1 : 2;
  Sounds.play(`cardTakeOutPack${n}`);
  return n;
}
//#endregion

async function main() {
  // Load Sounds
  for (let i = 1; i <= 8; i++) Sounds.create(`cardSlide${i}`, `${CARD_LIB_PATH}sounds/cardSlide${i}.wav`);
  for (let i = 1; i <= 4; i++) Sounds.create(`cardPlace${i}`, `${CARD_LIB_PATH}sounds/cardPlace${i}.wav`);
  for (let i = 1; i <= 2; i++) Sounds.create(`cardTakeOutPack${i}`, `${CARD_LIB_PATH}sounds/cardTakeOutPack${i}.wav`);
  Sounds.create(`cardFan`, `${CARD_LIB_PATH}sounds/cardFan1.wav`);
  Sounds.create(`error`, `./assets/error.mp3`);
  Sounds.create(`rainbow`, `./assets/rainbow.mp3`);
  Sounds.create(`tada`, `./assets/tada.mp3`);

  // Load images
  await loadImages(`${CARD_LIB_PATH}spritesheet.png`);

  // HTML Elements
  const checkboxSuitMatch = document.getElementById("suit-match");
  checkboxSuitMatch.checked = true;
  checkboxSuitMatch.addEventListener("change", () => disregardSuit = !checkboxSuitMatch.checked);

  const btnNewGame = document.getElementById("new-game");
  btnNewGame.addEventListener('click', () => {
    cardTable.decks.length = 0;
    setup(cardTable);
    initObj.update = true;
  });

  // Canvas
  canvas = document.createElement("canvas");
  canvas.width = boardWidth;
  canvas.height = boardHeight;
  document.getElementById("canvas-container").appendChild(canvas);
  ctx = canvas.getContext("2d");

  // Prepare CardTable
  cardTable = new CardTable();
  window.cardTable = cardTable;
  initObj = cardTable.initialise(canvas, {}, createHandlers());
  setup(cardTable);

  // Animation loop
  const animate = createAnimation();
  animate.setFPS(FPS);
  animate.start(display);
}

function display() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  cardTable.display(ctx, initObj);

  if (!hasWon) {
    // Make sure top card of drawPile is showing
    const top = drawPile.peek();
    if (top && top.isHidden) {
      top.isHidden = false;
    }
  }
}

// Called at end of setup()
function afterSetup() {
  console.log("Setup Game");
}

//#region TESTING FUNCTIONS
/** Test winning */
function testWin() {
  Card.suits.forEach(suit => {
    acePiles[suit].cards = Card.types.slice(0, -1).map(type => (new Card(suit, type)));
    mainPile.cards.push(new Card(suit, "K"));
  });
  mainPile.applyStyle();
}

function testFlipDeck() {
  mainPile.cards.length = 1;
  mainPile.applyStyle();
}
//#endregion

window.addEventListener("load", main);