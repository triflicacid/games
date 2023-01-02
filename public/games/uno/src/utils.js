/** Shuffle a given deck (mutates in place) */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function inRect(x, y, rx, ry, rw, rh) {
  return (x > rx && x < rx + rw && y > ry && y < ry + rh);
}