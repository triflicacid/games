import { Sounds } from "../../libs/Sound.js";
import { Slot, FILL_NONE, FILL_RED, FILL_YELLOW } from "./slot.js";

export class Grid {
  constructor(width, height, dimX, dimY, pad = 0) {
    this.width = width;
    this.height = height;
    this.pad = pad; // Padding for slots

    // Board dimensions
    this.dimX = parseInt(dimX);
    this.dimY = parseInt(dimY);

    // Width/height of each slot
    this.slotWidth = this.width / this.dimX;
    this.slotHeight = this.height / this.dimY;

    // Holder for Slots
    this.data = [];

    // Is it REDs go? (or yellows)
    this.isRedsGo = undefined;

    this.isGameOver = false;

    this.reset();
  }

  // Reset this.data
  reset() {
    this.data.length = 0;
    for (let i = 0; i < this.dimX; i++) {
      this.data[i] = [];
      for (let j = 0; j < this.dimY; j++) {
        this.data[i][j] = new Slot(this, i, j);
      }
    }

    this.isRedsGo = Math.random() <= 0.5;
    this.isGameOver = false;
  }

  display(ctx) {
    // Highlight current slot
    if (!this.isGameOver) {
      for (let i = 0; i < this.data.length; i++) {
        for (let j = 0; j < this.data[i].length; j++) {
          this.data[i][j].isHighlighted = false;
        }
      }

      const over = this.slotOver(Grid.mouseX, Grid.mouseY);
      if (over && over.filledBy == FILL_NONE) {
        over.isHighlighted = true;
      }
    }

    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data[i].length; j++) {
        this.data[i][j].display(ctx);
      }
    }
  }

  // Which slot are we on atm?
  slotOver(x, y) {
    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data[i].length; j++) {
        const over = this.data[i][j].contains(x, y);
        if (over) {
          return this.data[i][j];
        }
      }
    }
    return null;
  }

  /**
   * Attempt to insert counter at coordinates (x, y)
   * @param  {Number} x   X Coordinate
   * @param  {Number} y   Y Coordinate
   * @return {Slot | null} Which slot was filled?
   */
  insertCounter(x, y) {
    if (this.isGameOver) return null;

    // Is this on a slot?
    const slot = this.slotOver(x, y);

    if (slot) {
      const filled = slot.fill();

      if (filled) {
        // Toggle go
        this.isRedsGo = !this.isRedsGo;

        Sounds.play('insertCounter');
      }

      return filled;
    } else {
      return null;
    }
  }

  /**
   * Check if any winning
   * @return {false | Slot[]} Sequence of slots that make up winning sequence
   */

  checkWin() {
    const types = ["cross-horizontal", "cross-vertical", "diagonal-topl", "diagonal-bottoml"];

    for (let i = 0, seq; i < this.data.length; i++) {
      for (let j = 0; j < this.data[i].length; j++) {
        if (this.data[i][j].filledBy == FILL_NONE) {
          continue;
        } else {
          for (const type of types) {
            seq = this.__checkWin(this.data[i][j], type);
            if (seq.length >= 4) {
              console.log(seq, "type", type, "from", this.data[i][j]);
              return seq;
            }
          }
        }
      }
    }
    return false;
  }

  /**
   * Internally called by checkWin()
   * @param {Slot} currSlot     Current slot we are scanning 
   * @param {"cross" | "diagonal"} type     Type of sequence we're looking for         
   * @param {Slot[]} sequence             Sequence of slots
   * @param {Slot[]} visited              Array of all Slots that we have visited
   * @return {Slot[]} Sequence
   * @internal @recursive
   */
  __checkWin(currSlot, type, sequence = [], visited = []) {
    // Update arguments
    const newSequence = [...sequence, currSlot];
    const newVisited = [...visited, currSlot];

    // End of line?
    if (currSlot.filledBy == FILL_NONE || newSequence[0].filledBy !== currSlot.filledBy) {
      return sequence;
    }

    // Get neighbors
    const neighbors = currSlot.getNeighbors(type);

    // Scan each neighbor
    let seq;
    for (const neighbor of neighbors) {
      // If not already in sequence...
      if (newVisited.indexOf(neighbor) === -1) {
        seq = this.__checkWin(neighbor, type, newSequence, newVisited);
        if (seq && seq.length >= 4) return seq;
      }
    }

    return newSequence;
  }

  // Declare a winner
  gameover() {
    if (!this.isGameOver) {
      this.isGameOver = true;
      Sounds.play("tada");
      const winner = this.isRedsGo ? "Yellow" : "Red"; // Opposite colour
      // console.log(winner + " Won!");

      // Make all counters winner's colour
      const fillColour = this.isRedsGo ? FILL_YELLOW : FILL_RED;
      for (let i = 0; i < this.data.length; i++) {
        for (let j = 0; j < this.data[i].length; j++) {
          this.data[i][j].isHighlighted = false;
          // if (this.data[i][j].filledBy !== FILL_NONE && this.data[i][j].filledBy !== fillColour) {
          //   this.data[i][j].filledBy = fillColour;
          // }
        }
      }

      // Highlight winning sequence
      const sequence = this.checkWin();
      if (sequence) {
        sequence.forEach(slot => slot.isHighlighted = true);
      }
    }
  }
}
