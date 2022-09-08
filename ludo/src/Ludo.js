import { toTitleCase } from "../../libs/util.js";

/**
 * === POSITIONS ===
 * -1       : respective PLAYER's home base
 * 0 - 1000 : ordinary slots working clockwise from east
 * 1000+i   : landing strip slots for PLAYER 1 working from the east
 * 1100+i   : landing strip slots for PLAYER 2 working from the south
 * 1200+i   : landing strip slots for PLAYER 3 working from the west
 * 1300+i   : landing strip slots for PLAYER 4 working from the north
 */

/** Slot radius */
const SRADIUS = 16;
/** Disc radius */
const DRADIUS = 12;
/** Slot margin */
const SPAD = 6;

export class Ludo {
  constructor(pieces = 4) {
    this.pieces = pieces;
    this.colors = ["#0000ff", "#ffff00", "#00ff00", "#ff0000"];
    this.names = ["blue", "yellow", "green", "red"];
    this.players = []; // number[][]. Each index relates to a player, contains array of pieces with their positional index. -1: in home base. 1000+i: in ith landing strip
    this.current = 0;
    this.posMap = undefined; // Map { index => [x, y] }
    this.outlinedSlots = [];
    this.reset();
  }

  reset() {
    this.players = Array.from({ length: 4 }, (_, i) => Array.from({ length: this.pieces }).fill(-1));
    this.current = 0;
    this.posMap = new Map();
  }

  display(ctx, width, height) {
    const spawnC = 2 * this.pieces + 4;

    /** Draw slot at (x,y) */
    const drawSlot = (x, y, i) => {
      this.posMap.set(i, [x, y]);
      ctx.fillStyle = "white";
      // LANDING STRIP
      if (i >= 1000) ctx.fillStyle = this.colors[Math.round(i / 100) - 10] + "65";
      // SPAWNING SPOT
      else if (i % spawnC === 0) ctx.fillStyle = this.colors[(i / spawnC) % 4] + "30";

      ctx.strokeStyle = "black";
      if (this.outlinedSlots.includes(i)) ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.arc(x, y, SRADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.font = "11px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(i, x, y);
      
      const pidx = this.players.findIndex(pcs => pcs.some(j => j === i));
      if (pidx !== -1) {
        ctx.fillStyle = this.colors[pidx];
        ctx.beginPath();
        ctx.arc(x, y, DRADIUS, 0, 2 * Math.PI);
        ctx.fill();
      }

      return i + 1;
    };

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "purple";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 20px Comic Sans MS";
    ctx.fillText("LUDO", width / 2, height / 2);

    let i = 0, x, y;
    // BLUE landing strip
    x = width / 2 + 2 * (2 * SRADIUS + SPAD);
    y = height / 2;
    for (i = 1000 + this.pieces - 1; i >= 1000; i--) {
      drawSlot(x, y, i);
      x += SRADIUS * 2 + SPAD;
    }
    // BLUE landing strip
    x = width / 2 - 2 * (2 * SRADIUS + SPAD);
    for (i = 1200 + this.pieces - 1; i >= 1200; i--) {
      drawSlot(x, y, i);
      x -= SRADIUS * 2 + SPAD;
    }
    // YELLOW landing strip
    x = width / 2;
    y = height / 2 + 2 * (2 * SRADIUS + SPAD);
    for (i = 1100 + this.pieces - 1; i >= 1100; i--) {
      drawSlot(x, y, i);
      y += SRADIUS * 2 + SPAD;
    }
    // RED landing strip
    y = height / 2 - 2 * (2 * SRADIUS + SPAD);
    for (i = 1300 + this.pieces - 1; i >= 1300; i--) {
      drawSlot(x, y, i);
      y -= SRADIUS * 2 + SPAD;
    }

    // MAIN SLOTS
    i = 1;
    x = width / 2 + (this.pieces + 2) * (SRADIUS * 2 + SPAD);
    y = height / 2 + SRADIUS * 2 + SPAD;
    for (; i <= this.pieces + 1; i++) {
      drawSlot(x, y, i);
      x -= SRADIUS * 2 + SPAD;
    }
    for (let j = i; i <= j + this.pieces + 1; i++) {
      drawSlot(x, y, i);
      y += SRADIUS * 2 + SPAD;
    }
    y -= SRADIUS * 2 + SPAD;
    for (let j = i; i <= j + 1; i++) {
      x -= SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      y -= SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      x -= SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j + 1; i++) {
      y -= SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      x += SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      y -= SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j + 1; i++) {
      x += SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      y += SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      x += SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }
    for (let j = i; i <= j; i++) {
      y += SRADIUS * 2 + SPAD;
      drawSlot(x, y, i);
    }

    // SPAWNING AREAS
    const drawSpawningArea = (x, y, i) => {
      ctx.strokeStyle = this.colors[i];
      ctx.strokeRect(x, y, dim, dim);
      ctx.fillStyle = this.colors[i] + "40";
      ctx.fillRect(x, y, dim, dim);
      const count = this.players[i].filter(x => x === -1).length;
      const limx = Math.floor(dim / (3 * SRADIUS));
      let pad = DRADIUS * 2.5, dx = x, dy = y;
      for (let j = 0; j < count; j++) {
        if (j % limx === 0) {
          dx = x + pad;
          dy += pad;
        }
        ctx.fillStyle = this.colors[i];
        ctx.beginPath();
        ctx.arc(dx, dy, DRADIUS, 0, 2 * Math.PI);
        ctx.fill();
        dx += pad;
      }
    };
    let off = 2 * (2 * SRADIUS + SPAD) - SRADIUS / 2, dim = SRADIUS * 2 * (this.pieces + 1);
    drawSpawningArea(width / 2 + off, height / 2 + off, 0);
    drawSpawningArea(width / 2 - off - dim, height / 2 + off, 1);
    drawSpawningArea(width / 2 - off - dim, height / 2 - off - dim, 2);
    drawSpawningArea(width / 2 + off, height / 2 - off - dim, 3);

    // Whose go?
    x = width / 2;
    y = (height / 2 - (this.pieces + 3) * (2 * SRADIUS + SPAD)) / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.font = "22px Comic Sans MS";
    ctx.fillText(`${toTitleCase(this.names[this.current])}'s Go`, x, y);
  }

  /** Handle CLICK. Return if need re-render. */
  handleClick(x, y) {
    // Clicked on a slot?
    let slotClickedOn = null;
    for (const [cell, [cx, cy]] of this.posMap) {
      if (x > cx - SRADIUS && x < cx + SRADIUS && y > cy - SRADIUS && y < cy + SRADIUS) {
        slotClickedOn = cell;
        break;
      }
    }
    if (slotClickedOn === null) return false;
    // A disc in that slot?
    const pidx = this.players.findIndex(pcs => pcs.some(i => i === slotClickedOn));
    if (pidx !== -1) {
      const pcidx = this.players[pidx].findIndex(i => i === slotClickedOn);
      console.log(`Click on ${this.names[pidx]}'s ${pcidx + 1} piece in cell ${slotClickedOn}`)
    }
  }
}