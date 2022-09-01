import { extractImage, loadImage } from "../util.js";
import { Card } from "./card.js";

/** Initiate images, providing path to spritesheet: e.g. "for/bar/baz/spritesheet.png".
 * 
 * Populates:
 * - `Card.width`
 * - `Card.height`
 * - `Card.images`
 */
export async function loadImages(url) {
    // Load spritesheet
    const spritesheet = await loadImage(url);

    const w = Card.width, h = Card.height;

    // Extract card images from spritesheet
    for (let y = 0; y < 4; y++) {
        const suit = Card.suits[y];
        for (let x = 0; x < 13; x++) {
            const img = extractImage(spritesheet, x * w, y * h, w, h);
            Card.images[suit][x] = img;
        }
    }

    // Back of a card
    // const i = Math.floor(Math.random() * 9);
    const i = 0;
    Card.images.hidden = extractImage(spritesheet, i * w, 4 * h, w, h);

    // Empty card
    Card.images.empty = extractImage(spritesheet, 12 * w, 5 * h, w, h);
}