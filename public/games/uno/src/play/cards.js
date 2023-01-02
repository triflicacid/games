// .data
export const C_WIDTH = 164, C_HEIGHT = 255;
const C_COLORS = ["YELLOW", "RED", "BLUE", "GREEN"];
export const C_TYPES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "PICKUP2", "SKIP", "REVERSE"];
export const CARDS = {
  UNO: 0,
  WILD: 1,
  PICKUP4: 6,
  EMPTY: 11,
  BLANK: 64,
};
for (let i = 0; i < 4; i++) CARDS[C_COLORS[i] + "_WILD"] = CARDS.WILD + 1 + i;
for (let i = 0; i < 4; i++) CARDS[C_COLORS[i] + "_PICKUP4"] = CARDS.PICKUP4 + 1 + i;
for (let i = 0; i < 4; i++) for (let j = 0; j < C_TYPES.length; j++) CARDS[C_COLORS[i] + "_" + C_TYPES[j]] = 12 + i * C_TYPES.length + j;

/** Return OffscreenCanvas containing the spritesheet */
export function loadSpritesheet() {
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const oc = new OffscreenCanvas(image.width, image.height);
      const ctx = oc.getContext('2d');
      ctx.drawImage(image, 0, 0);
      resolve(oc);
    };
    image.src = "assets/spritesheet.png";
  });
}

/** Return OffscreenCanvas containing card from index */
export function getCard(spritesheet, index) {
  const y = Math.floor(index / 12) * (C_HEIGHT + 4);
  const x = (index % 12) * (C_WIDTH + 4);
  const oc = new OffscreenCanvas(C_WIDTH, C_HEIGHT), ctx = oc.getContext('2d');
  ctx.putImageData(spritesheet.getContext("2d").getImageData(x, y, C_WIDTH, C_HEIGHT), 0, 0);
  return oc;
}

/** Create new deck of cards */
export function createDeck() {
  const deck = [];
  // 4 * WILD, 4 * PICKUP4
  for (let i = 0; i < 4; i++) deck.push(CARDS.WILD, CARDS.PICKUP4);
  // Each color
  for (let col of C_COLORS) {
    // 1 * 0
    deck.push(CARDS[col + "_0"]);
    // 2 * 1-9
    for (let i = 0; i < 2; ++i) for (let j = 1; j <= 9; j++) deck.push(CARDS[col + "_" + j]);
    for (let name of ["PICKUP2", "SKIP", "REVERSE"]) for (let i = 0; i < 2; i++) deck.push(CARDS[col + "_" + name]);
  }
  return deck;
}

/** Get a cards color */
export function getCardColor(card) {
  if (card === CARDS.UNO || card === CARDS.EMPTY || card === CARDS.BLANK) return "none";
  if (card === CARDS.WILD || card === CARDS.PICKUP4) return "black";
  if (card > CARDS.WILD && card <= CARDS.WILD + C_COLORS.length) return C_COLORS[card - CARDS.WILD - 1].toLowerCase();
  if (card > CARDS.PICKUP4 && card <= CARDS.PICKUP4 + C_COLORS.length) return C_COLORS[card - CARDS.PICKUP4 - 1].toLowerCase();
  let type = C_COLORS[Math.floor((card - 12) / C_TYPES.length)];
  return type ? type.toLowerCase() : undefined;
}

/** Return numeric offset into deck (C_TYPES) */
export function getColorOffset(card) {
  return card - 12 - C_TYPES.length * Math.floor((card - 12) / C_TYPES.length);
}

/** Can play <card 1> onto <card 2> ? */
export function canPlayCard(card1, card2, wildAccept = undefined) {
  let col1 = getCardColor(card1), col2 = getCardColor(card2);
  // Invalid card
  if (!col1 || col1 === "none" || !col2 || col2 === "none") return false;
  // card1=black or card2=pickup4
  if (col1 === "black" || isPickup4(card2)) return true;
  // card1=$pickup4Accept and card2=wild
  if (col1 === wildAccept && isWildcard(card2)) return true;
  // colors are equal
  if (col1 === col2) return true;
  // same type
  let t1 = getColorOffset(card1), t2 = getColorOffset(card2);
  if (t1 === t2) return true;
  return false;
}

/** Is given card a wildcard? */
export const isWildcard = card => card >= CARDS.WILD && card <= CARDS.WILD + C_COLORS.length;

/** Is given card a pickup-4? */
export const isPickup4 = card => card >= CARDS.PICKUP4 && card <= CARDS.PICKUP4 + C_COLORS.length;