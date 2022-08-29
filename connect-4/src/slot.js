export const FILL_NONE = -1;
export const FILL_RED = 0;
export const FILL_YELLOW = 1;

export class Slot {
  constructor(grid, x, y) {
    this.grid = grid; // Parent Grid object
    this.x = x;
    this.y = y;

    this.isHighlighted = false;

    this.filledBy = FILL_NONE;
  }

  get w() { return this.grid.slotWidth; }
  get h() { return this.grid.slotHeight; }

  display(ctx) {
    const pad = this.grid.pad;

    const w = this.w - pad;
    const h = this.h - pad;

    const x = pad + this.x * this.w;
    const y = pad + this.y * this.h;

    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.fillStyle = "#ffffff";
    if (this.isHighlighted) {
      ctx.strokeStyle = "rgb(34, 140, 35)";
      ctx.lineWidth = 5;
    }

    // Main circle
    ctx.beginPath();
    ctx.ellipse(cx, cy, (w - pad / 2) / 2, (h - pad / 2) / 2, 0, 0, 2 * Math.PI);
    if (this.isHighlighted) ctx.stroke();
    ctx.fill();

    // Counter?
    if (this.filledBy == FILL_RED || this.filledBy == FILL_YELLOW) {
      const colour = this.filledBy == FILL_RED ? [205, 20, 40] : [200, 200, 16];
      let k;

      // Outer ring
      k = 1.3;
      ctx.fillStyle = "rgb(" + colour.join(", ") + ")";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, (w - pad * k) / 2, (h - pad * k) / 2, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Inside Body
      k = 2.2;
      ctx.ellipse(cx, cy, (w - pad * k) / 2, (h - pad * k) / 2, 0, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = "#101010";
    ctx.fillText(`(${this.x}, ${this.y})`, cx, cy, w - pad / 2);
  }

  // Are the provided coordinates inside this slot?
  contains(x, y) {
    const pad = this.grid.pad;

    const w = this.w - pad;
    const h = this.h - pad;

    const cx = pad + this.x * this.w;
    const cy = pad + this.y * this.h;

    const d = distance(cx + w / 2, cy + h / 2, x, y);
    return d < w / 2;
  }

  /**
   * Fill this slot with a counter
   * @return {Slot | null} Which slot was filled?
   */
  fill() {
    // If slot below is empty... drop down one
    const below = this.getSlot(0, 1);
    if (below && below.filledBy == FILL_NONE) {
      // Fill slot below instead
      const filled = below.fill();
      return filled;
    } else {
      if (this.filledBy == FILL_NONE) {
        // Fill current slot with whose go it is
        const by = this.grid.isRedsGo ? FILL_RED : FILL_YELLOW;
        this.filledBy = by;
        return this;
      } else {
        return null;
      }
    }
  }

  // Get slot at a certain vector
  getSlot(vx, vy) {
    const px = this.x + vx;
    const py = this.y + vy;

    // Is position out-of-bounds?
    if (px < 0 || px >= this.grid.dimX || py < 0 || py >= this.grid.dimY) {
      return null;
    }

    // Get pos
    return this.grid.data[px][py];
  }

  /**
   * Get neighbors to a slot
   * @param {"cross-horizontal" | "cross-vertical" | "diagonal-topl" | "diagonal-bottoml"} type
   */
  getNeighbors(type) {
    const neighbors = [];

    let coords = [];
    if (type == "cross-horizontal") {
      coords.push([this.x + 1, this.y]);
      coords.push([this.x - 1, this.y]);
    } else if (type == "cross-vertical") {
      coords.push([this.x, this.y - 1]);
      coords.push([this.x, this.y + 1]);
    } else if (type == "diagonal-topl") { // From top left
      coords.push([this.x - 1, this.y - 1]);
      coords.push([this.x + 1, this.y + 1]);
    } else if (type == "diagonal-bottoml") { // From bottom left
      coords.push([this.x - 1, this.y + 1]);
      coords.push([this.x + 1, this.y - 1]);
    }

    for (const coord of coords) {
      // Out of bounds?
      if (coord[0] < 0 || coord[0] >= this.grid.dimX || coord[1] < 0 || coord[1] >= this.grid.dimY) {
        continue;
      } else {
        // Neighbor found :P
        neighbors.push(this.grid.data[coord[0]][coord[1]]);
      }
    }

    return neighbors;
  }
}

const distance = (a1, b1, a2, b2) => Math.sqrt(Math.pow(a2 - a1, 2) + Math.pow(b2 - b1, 2));
