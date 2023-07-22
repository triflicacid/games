import { Sounds } from "/libs/Sound.js";
import { CardTable } from "/libs/card/cardTable.js";
import { Deck } from "/libs/card/deck.js";
import { Card } from "/libs/card/card.js";
import { PileStyle } from "/libs/card/pile.js";
import { loadImages } from "/libs/card/loadImages.js";
import { createAnimation } from "/libs/util.js";

const CARD_LIB_PATH = "/libs/card/";
const FPS = 10;

// VARIABLES
const boardWidth = 1200;
const boardHeight = 750;

const pileSizeMult = 2;
const cardPileMargin = 25;

const getCardScore = Card.getScoringFn(1);
const targetScore = 13;
const pyramidHeight = 7;
const cardPairMap = Object.freeze({
    "A": "Q",
    "2": "J",
    "3": "10",
    "4": "9",
    "5": "8",
    "6": "7",
    "7": "6",
    "8": "5",
    "9": "4",
    "10": "3",
    "J": "2",
    "Q": "A",
});

var canvas, ctx, initObj;

var cardTable;
var deck;
var stockPile, wastePile, idealPile, foundationPile;
const idealCardFilter = "opacity(50%)";
var selectedCard = null, selectedPile = null;
var pyramid = []; // Card pyramid, top-down
var hasWon = false;
var showPairing = false; // Show ghost of value needed to create a pair
var hideCards = false; // Hide pyramid cards (except from neighbors)

function setup(cardTable) {
    hasWon = false;
    deck = new Deck();
    cardTable.decks.push(deck);
    deck.shuffle();

    // Setup pyramid
    pyramid.length = 0;
    let x = boardWidth / 2, y = cardPileMargin, d = Card.width * pileSizeMult + cardPileMargin;
    for (let h = 1; h <= pyramidHeight; h++, y += Card.height * pileSizeMult * 0.6) {
        const ry = Math.round(y);
        const cards = [], piles = [];
        pyramid[h - 1] = { count: h, y: ry, cards, piles };

        for (let i = 0, x2 = x - d * (h / 2); i < h; i++, x2 += d) {
            const pile = deck.createPile(Math.round(x2), ry);
            pile.cardDimensions(pileSizeMult);
            pile.maxSize = 1;
    
            const card = deck.getRandom();
            pile.push(card);
            deck.removeCard(card);
            cards.push(card);
            piles.push(pile);
        }
    }

    // Stock pile
    y = boardHeight - Card.height * pileSizeMult * 1.5;
    stockPile = deck.createPile(cardPileMargin, y);
    stockPile.cardDimensions(pileSizeMult);
    stockPile.applyStyle(PileStyle.allHidden);
    
    while (deck.countFreeCards()) {
        const card = deck.getRandom();
        deck.removeCard(card);
        stockPile.push(card);
    }

    // Waste pile
    wastePile = deck.createPile(cardPileMargin + Card.width * pileSizeMult * 2, y);
    wastePile.cardDimensions(pileSizeMult);
    wastePile.applyStyle(PileStyle.topRevealed);

    // Ideal pile - show ideal pair
    idealPile = deck.createPile(boardWidth * 0.5 - Card.width * pileSizeMult * 0.5, y);
    idealPile.cardDimensions(pileSizeMult);
    idealPile.showBorder = false;
    if (!showPairing) idealPile.applyStyle(PileStyle.invisible);

    // Foundation pile
    foundationPile = deck.createPile(boardWidth - Card.width * pileSizeMult - cardPileMargin, y);
    foundationPile.cardDimensions(pileSizeMult);
    wastePile.applyStyle(PileStyle.allRevealed);
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
            return false;
        },

        onDragEnd: (cards, pileSrc, pileDst) => {
            if (hasWon) return false;
            return false;
        },

        onDrop: (ok, cards, pileSrc, pileDst) => {
            if (hasWon) return;
            if (!ok) return void Sounds.play("error");
            playCardPlace();
        },

        onClick: (card, pile) => {
            if (hasWon) return;
            if (pile === stockPile) {
                clickStockPile();
            } else if (pile === foundationPile) {
                return;
            } else if (pile === idealPile) {
                if (selectedCard) { // Magically pair the card
                    transferCardToFoundation(selectedPile, selectedCard);
                    deselectCard();
                    updateIdealPairing();
                }
            } else {
                // Is pile empty?
                if (pile.size === 0) {
                    if (pile === wastePile) {
                        clickStockPile();
                    }
                    return;
                }
                
                // Deselect card if selected
                if (selectedCard === card) {
                    deselectCard();
                    return;
                }

                // Check if in pyramid and if card is uncovered
                const pLoc = getPyramidLocation(card);
                if (!pLoc || (pLoc && isPyramidLocationFree(...pLoc))) {
                    selectCard(card, pile);
                }
            }
        },

        onHover: (card, pile) => {
            if (hasWon) return;
            if (pile === stockPile) return hoverOverActivePile(card, pile);
            return false;
        }
    };
}

/** Action: click the stock pile */
function clickStockPile() {
    if (stockPile.size) {
        const card = stockPile.pop();
        wastePile.push(card);
        playCardSlide();

        // Select the card immediatley
        deselectCard();
        selectCard(card, wastePile);

        // If the wastePile is empty, draw another card
        if (wastePile.size === 0) return void clickStockPile();
    } else {
        // Empty - refill stock, de-selecting the card if necessary
        if (selectedCard && wastePile.includes(selectedCard)) {
            selectedCard.isGlowing = false;
            selectedCard = selectedPile = null;
            selectedPyramidLevel = NaN;
        }

        while (wastePile.size) stockPile.push(wastePile.pop());
        playCardTakeOutPack();
    }
    initObj.update = true;
}

/** Return row and columns of a card in the pyramid [row,col] or null */
function getPyramidLocation(card) {
    for (let i = 0; i < pyramid.length; i++) {
        if (pyramid[i].count > 0) {
            let j = pyramid[i].cards.indexOf(card);
            if (j !== -1) {
                return [i, j];
            }
        }
    }
    return null;
}

/** Get the cards at the given location in the pyramid */
function getPyramidCard(i, j) {
    return pyramid[i]?.cards[j] ?? null;
}

/** Check if the given pyramid location is uncovered */
function isPyramidLocationFree(i, j) {
    if (i === pyramid.length - 1) return true; // Bottom row
    if (i < 0 || i >= pyramid.length || j < 0 || j >= pyramid[i].length) return false; // Out of bounds
    return getPyramidCard(i + 1, j) === null && getPyramidCard(i + 1, j + 1) === null;
}

/** Valid card pair? (card scores sum to the target) */
function isValidPair(card1, card2) {
    return getCardScore(card1) + getCardScore(card2) === targetScore;
}

/** Select the given card */
function selectCard(card, pile) {
    if (hasWon) return;

    if (selectedCard) {
        // Two cards have been selected. Check if they are a valid pair.
        if (isValidPair(selectedCard, card)) {
            transferCardToFoundation(selectedPile, selectedCard);
            deselectCard();
            transferCardToFoundation(pile, card);
        } else {
            deselectCard();
            selectCard(card, pile);
        }
    } else if (getCardScore(card) === targetScore) { // Card already meets the score?
        transferCardToFoundation(pile, card);
    } else {
        // Select the given card
        selectedCard = card;
        card.isGlowing = true;
        selectedPile = pile;
    }

    // Show ideal pairing?
    updateIdealPairing();
}

/** Update idealPile */
function updateIdealPairing() {
    if (showPairing) {
        idealPile.pop();
        if (selectedCard) {
            const typeIndex = Card.types.indexOf(cardPairMap[selectedCard.type]);
            const card = new Card(selectedCard.suit, Card.types[typeIndex]);
            card.customFilter = idealCardFilter;
            idealPile.push(card);
            initObj.update = true;
        }
    }
}

/** De-select the current card */
function deselectCard() {
    if (selectedCard) {
        selectedCard.isGlowing = false;
        selectedCard = selectedPile = null;
        updateIdealPairing();
    }
}

/** Remove card from the pyramid and transfer to the foundation pile */
function transferCardToFoundation(pile, card) {
    if (pile === wastePile) {

    } else {
        const [r, c] = getPyramidLocation(card);

        // Remove card from pyramid structure
        pyramid[r].cards[c] = null;
        pyramid[r].piles[c] = null;
        if (--pyramid[r].count === 0) { // Decrease count, play sound if row has been cleared
            if (r === 0) { // Have we reached the top of the pyramid?
                Sounds.play("tada");
                hasWon = true;
            } else {
                Sounds.play("rainbow");
            }
        }

        updateGlobalCardVisibility();
    
        // Pile only has one card, so remove the pile
        deck.deletePile(pile);
    }

    // Add to foundation pile
    foundationPile.push(card);

    // Remove from source pile
    pile.pop();

    playCardPlace();

    initObj.update = true;
}

/** Update "hideCards" */
function updateGlobalCardVisibility() {
    if (hideCards) {
        for (let i = 0; i < pyramid.length; i++) {
            for (let j = 0; j < pyramid[i].piles.length; j++) {
                pyramid[i].piles[j]?.applyStyle(PileStyle.allHidden);
            }
        }

        for (let i = 0; i < pyramid.length; i++) {
            for (let j = 0; j < pyramid[i].piles.length; j++) {
                if (pyramid[i].cards[j] && isPyramidLocationFree(i, j)) {
                    pyramid[i].piles[j]?.applyStyle(PileStyle.allRevealed);
                    pyramid[i - 1]?.piles[j]?.applyStyle(PileStyle.allRevealed);
                    pyramid[i - 1]?.piles[j - 1]?.applyStyle(PileStyle.allRevealed);
                }
            }
        }
    } else {
        for (let i = 0; i < pyramid.length; i++) {
            for (let j = 0; j < pyramid[i].piles.length; j++) {
                if (pyramid[i].piles[j]) {
                    pyramid[i].piles[j].applyStyle(PileStyle.allRevealed);
                }
            }
        }
    }
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

    // Setup "new game" button
    const btnNewGame = document.getElementById("new-game");
    btnNewGame.addEventListener('click', () => {
        cardTable.decks.length = 0;
        setup(cardTable);
        initObj.update = true;
    });

    // Setup "show pairing" checkbox
    const chkShowPairing = document.getElementById("show-pairing");
    chkShowPairing.checked = showPairing;
    chkShowPairing.addEventListener("change", () => {
        showPairing = chkShowPairing.checked;
        idealPile.applyStyle(showPairing ? PileStyle.allRevealed : PileStyle.invisible);
        updateIdealPairing();
        initObj.update = true;
    });

    // Setup "hide cards" checkbox
    const chkHidecards = document.getElementById("hide-cards");
    chkHidecards.checked = hideCards;
    chkHidecards.addEventListener("change", () => {
        hideCards = chkHidecards.checked;
        updateGlobalCardVisibility();
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
    initObj = cardTable.initialise(canvas, {}, createHandlers());
    setup(cardTable);

    // Animation loop
    const animate = createAnimation();
    animate.setFPS(FPS);
    animate.start(display);

    return 0;
}

function display() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cardTable.display(ctx, initObj);
}

window.addEventListener("load", main);
