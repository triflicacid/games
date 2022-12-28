import { shapes, rotate } from "./shape.js";

export const State = Object.freeze({
  Playing: 0,
  Paused: 1,
  Gameover: 2,
});

/** Insert shape `shape` of square dimensions `dim` into grid `grid` with width `gwidth` at (x,y) position `pos` using the digit `num` */
function gridShapeDraw(grid, gwidth, shape, dim, pos, num) {
  for (let x = pos[0], y = pos[1], i = 0; i < shape.length; i++) {
    if (i !== 0 && i % dim === 0) {
      x = pos[0];
      y++;
    }
    const j = y * gwidth + x;
    // If shape present in this.shape[i], insert into this.grid[j]
    if (shape[i] && j >= 0 && j < grid.length) grid[j] = num;
    x++;
  }
}

/** Does shape `shape` of square dimensions `dim` fit into grid `grid` with width `gwidth` at (x,y) position `pos`, where `shape` is using the digit `num`? */
function gridShapeFit(grid, gwidth, shape, dim, pos, num) {
  let gheight = grid.length / gwidth, x = pos[0], y = pos[1], sy;
  for (let i = 0; i < shape.length; i++, x++) {
    if (i !== 0 && i % dim === 0) {
      x = pos[0];
      y++;
      sy = undefined;
    }
    if (shape[i]) {
      // Check if position is out-of-bounds
      if (x < 0 || x >= gwidth || y < 0 || y >= gheight) return false;
      const j = y * gwidth + x;
      // Cannot move shape here if...
      // - Something is already in grid[j] (other then the shape itself); or
      // - A single shape row crossed multiple grid rows (`sy`)
      if ((grid[j] !== -1 && grid[j] !== num) || (sy !== undefined && parseInt((y * gwidth + x) / gwidth) !== sy)) {
        return false;
      }
      // Update which shape-row we are in
      sy = parseInt((y * gwidth + x) / gwidth);
    }
  }
  return true;
}

/** Remove shape `shape` from square dimension `dim` grid `grid` with width `gwidth` from position (x,y) `pos` using the digit `num` */
function gridShapeRemove(grid, gwidth, shape, dim, pos, num) {
  for (let x = pos[0], y = pos[1], i = 0; i < shape.length; i++) {
    if (i !== 0 && i % dim === 0) {
      x = pos[0];
      y++;
    }
    let j = y * gwidth + x;
    // If index in this.grid, clear it (set to -1)
    if (shape[i] && grid[j] === num) {
      grid[j] = -1;
    }
    x++;
  }
}

export class Tetris {
  constructor() {
    /** 2-D grid top-to-bottom. Each index contains ID of the shape it makes up, or -1 if empty */
    this.grid = [];
    this.level = 0;
    this.score = 0;
    this.state = State.Playing;
    this.shapes = []; // { idx: number, shape?: number[], locked?: boolean }[]. Store all shapes, index acts as key. Topmost shape is the one the user controls
    this.shape = -1; // Index of current shape
    this.spos = [0, 0]; // Co-ordinate position of top-right corner of shape
    this.hold = -1; // Index in this.shapes[] of current shape that is being held
    this.queue = []; // Queue for next pieces
    this.reset();
  }

  /** Set-up new game */
  reset() {
    this.grid = Array.from({ length: Tetris.width * Tetris.height }).fill(-1);
    this.level = 0;
    this.score = 0;
    this.state = State.Playing;
    this.shapes.length = 0;
    this.shape = -1;
    this.spos = [0, 0];
    this.queue.length = 0;
    this.hold = -1;
    this.fillQueue();
  }

  /** Fill this.queue of next shapes */
  fillQueue() {
    while (this.queue.length < Tetris.queueLength) this.queue.unshift(Math.floor(Math.random() * shapes.length));
  }

  /** Is there a shape that the user is able to control? */
  hasMovableShape() {
    return this.shape > -1 && this.shapes[this.shape] && this.shapes[this.shape].locked !== true;
  }

  /** Spawn in a new shape, with index `idx` or random. Position is `[x, y]` */
  spawnShape(index = undefined, position = undefined) {
    let idxFromQueue = false; // Using index from this.queue?
    if (index === undefined) {
      if (this.queue.length > 0) {
        index = this.queue[this.queue.length - 1];
        idxFromQueue = true;
      } else {
        index = Math.floor(Math.random() * shapes.length);
      }
    }

    const shape = shapes[index];
    if (!shape) return false;
    this.shapes.push({
      idx: index,
      shape: shape.shape,
      locked: false,
    });
    const sidx = this.shapes.length - 1;

    // If position is provided, try this potision
    if (position) {
      if (this._gridShapeFit(position, sidx)) {
        this.shape = sidx;
        this.spos = position;
        this._gridInsertShape();
        if (idxFromQueue) {
          this.queue.pop();
          this.fillQueue();
        }
        return true;
      } else {
        this.shapes.pop();
        return false;
      }
    } else {
      // Try spawning along the top row: 0, 1, -1, 2, -2, ...
      const x = Math.floor(Tetris.width / 2) - shape.spawnPos % shape.dim - Math.floor(shape.dim / 2);
      const y = -Math.floor(shape.spawnPos / shape.dim);
      position = [x, y];
      const lim = Math.max(x, Tetris.width - x);
      let fit = false;
      for (let o = 0, n = true; o < lim; n = !n) {
        position[0] = x + (n ? -1 : 1) * o;
        fit = this._gridShapeFit(position, sidx);
        if (fit) break;
        if (n) o++;
      }
      if (fit) {
        this.spos = position;
        this.shape = sidx;
        this._gridInsertShape();
        if (idxFromQueue) {
          this.queue.pop();
          this.fillQueue();
        }
        return true;
      } else {
        this.shapes.pop();
        return false;
      }
    }
  }

  /** Remove this.shape from grid. `position` is co-ordinate of top-left corner, defaulted to this.spos */
  _gridRemoveShape(position = undefined, sidx = undefined) {
    if (sidx === undefined) sidx = this.shape;
    if (!this.shapes[sidx]) return;
    const pos = position ?? this.spos, shape = this.shapes[sidx], dim = shapes[shape.idx].dim;
    return gridShapeRemove(this.grid, Tetris.width, shape.shape, dim, pos, sidx);
  }

  /** Draw shape to this.grid. `position` is co-ordinate of top-left corner, defaults to this.spos. Return is the shape was spawned */
  _gridInsertShape(position = undefined, sidx = undefined) {
    if (sidx === undefined) sidx = this.shape;
    if (!this.shapes[sidx]) return;
    const pos = position ?? this.spos, shape = this.shapes[sidx], dim = shapes[shape.idx].dim;
    return gridShapeDraw(this.grid, Tetris.width, shape.shape, dim, pos, sidx);
  }

  /** Check if can insert `shape` into `position` (co-ordinate of top-left corner, defaults to this.spos)  */
  _gridShapeFit(position = undefined, sidx = undefined) {
    if (sidx === undefined) sidx = this.shape;
    if (!this.shapes[sidx]) return false;
    const pos = position ?? this.spos, shape = this.shapes[sidx], dim = shapes[shape.idx].dim;
    return gridShapeFit(this.grid, Tetris.width, shape.shape, dim, pos, sidx);
  }

  /** Clear any complete rows. Return number of rows cleared. Increment this.score as appropriate. */
  gridClearRows() {
    let count = 0;
    for (let y = 0, j = 0; y < Tetris.height; y++) {
      const j = y * Tetris.width;
      const row = this.grid.slice(j, j + Tetris.width); // Extract row
      const cells = row.filter(v => v !== -1).length; // Count non-empty cells
      if (cells === Tetris.width) { // Row is full!
        count++;
        this.grid.splice(j, Tetris.width); // Remove row
        this.grid.unshift(...Array.from({ length: Tetris.width }).fill(-1)); // Add empty row to top
      }
    }

    if (count > 0) {
      const values = this.isEmpty() ? [800, 1200, 1800, 2000] : [100, 300, 500, 800];
      const points = values[count - 1] * (this.level + 1);
      this.score += points;
    }

    return count;
  }

  /** Is this grid empty? */
  isEmpty() {
    return this.grid.filter(v => v !== -1).length === 0;
  }

  /** Is the row with given y-coordinate complete? */
  isRowComplete(row) {
    const i = row * Tetris.width;
    return this.grid.slice(i, i + Tetris.width).filter(v => v === -1).length === 0;
  }

  /** Move shape to new position. Return if moved OK */
  moveShape(mx = 0, my = 1) {
    if (this.shapes.length === 0 || this.shapes[this.shapes.length - 1].shape === undefined) return false;
    let pos = [this.spos[0] + mx, this.spos[1] + my];
    let ok = this._gridShapeFit(pos); // Can the shape move here?

    if (ok) {
      this._gridRemoveShape(); // Remove shape from grid
      this.spos = pos;
      this._gridInsertShape();
    }

    return ok;
  }

  /** Rotate shape */
  rotateShape(clockwise = false) {
    const shape = this.shapes[this.shape];
    if (!shape) return false;
    let oldShape = shape.shape;
    let newShape = rotate(shape.shape, shapes[shape.idx].dim, clockwise);
    shape.shape = newShape;
    let ok = this._gridShapeFit();
    if (ok) {
      shape.shape = oldShape;
      this._gridRemoveShape();
      shape.shape = newShape;
      this._gridInsertShape();
    } else {
      shape.shape = oldShape;
    }
    return ok;
  }

  /** Lock current shape */
  lockShape() {
    this.shapes[this.shapes.length - 1].locked = true;
  }

  /** Remove current shape (topmost shape in this.shapes) */
  removeShape() {
    if (this.shapes.length !== 0) {
      this.grid = this.grid.map(v => v === this.shape ? -1 : v);
      this.shapes.pop();
      this.shape = this.shapes.length - 1;
    }
  }

  /** Attempt to hold the current shape. Return success. */
  holdShape() {
    if (this.hold === -1) {
      if (this.shape === -1) return false;
      this.hold = this.shape;
      this.shape = -1;
      this._gridRemoveShape(undefined, this.hold); // Remove active shape
      return true;
    } else {
      this._gridRemoveShape(); // Remove current shape
      const fits = this._gridShapeFit(undefined, this.hold); // Check if we can insert `hold` here
      if (fits) {
        ([this.shape, this.hold] = [this.hold, this.shape]); // Swap hold and active
      }
      this._gridInsertShape(); // Insert shape again
      return fits;
    }
  }

  /** Draw */
  display(ctx, width, height) {
    // Background
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Get grid and cell dimensions
    let w = width * 0.5, h = height * 0.95, cdim = Math.floor(Math.min(w / Tetris.width, h / Tetris.height));
    // Adjust width, height to match cell dimensions
    w = cdim * Tetris.width;
    h = cdim * Tetris.height;

    // Grid outline
    ctx.strokeStyle = "#00CC99";
    let ox = Math.floor(width / 2 - w / 2), oy = Math.floor(height / 2 - h / 2);
    ctx.strokeRect(ox, oy, w, h);

    // Display queue
    let x = width / 2 + w / 2 + (width - w) / 6, y = oy, size = 17, pad = 20;
    ctx.font = size + "px Arial";
    ctx.fillStyle = "#ffff00";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Next", x + 5, y);
    y += size + pad;
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const ox = x, oy = y, idx = this.queue[i], shape = shapes[idx].shape, color = shapes[idx].color, sdim = shapes[idx].dim;
      const w = sdim * cdim;
      // Box outline
      ctx.strokeStyle = "#00CC99";
      ctx.strokeRect(x, y, w, w);
      y += w + pad;
      // Draw grid
      ctx.strokeStyle = "#313131";
      for (let x = ox, y = oy, i = 0; i < shape.length; i++, x += cdim) {
        if (i !== 0 && i % sdim === 0) {
          y += cdim;
          x = ox;
        }
        ctx.strokeRect(x, y, cdim, cdim);
        if (shape[i]) {
          ctx.fillStyle = color;
          ctx.fillRect(x + Tetris.pad, y + Tetris.pad, cdim - Tetris.pad * 2, cdim - 2 * Tetris.pad);
        }
      }
    }

    // Display "hold"
    y = oy;
    {
      const sdim = this.hold > -1 ? shapes[this.shapes[this.hold].idx].dim : 3, hdim = sdim * cdim;

      x = width / 2 - w / 2 - Math.max((width - w) / 6, hdim + pad);
      ctx.font = size + "px Arial";
      ctx.fillStyle = "#ffff00";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const text = this.hold > -1 ? ("Hold: " + shapes[this.shapes[this.hold].idx].type + "-Block") : "Hold";
      ctx.fillText(text, x, y);
      y += size + pad;

      const ox = x, oy = y;
      // Box outline
      ctx.strokeStyle = "#00CC99";
      ctx.strokeRect(x, y, hdim, hdim);
      // Grid
      if (this.hold !== -1) {
        const shape = this.shapes[this.hold].shape, color = shapes[this.shapes[this.hold].idx].color;
        y += hdim + pad;
        // Draw grid
        ctx.strokeStyle = "#313131";
        for (let x = ox, y = oy, i = 0; i < shape.length; i++, x += cdim) {
          if (i !== 0 && i % sdim === 0) {
            y += cdim;
            x = ox;
          }
          ctx.strokeRect(x, y, cdim, cdim);
          if (shape[i]) {
            ctx.fillStyle = color;
            ctx.fillRect(x + Tetris.pad, y + Tetris.pad, cdim - Tetris.pad * 2, cdim - 2 * Tetris.pad);
          }
        }
      }
    }

    // State-dependant graphics
    if (this.state === State.Playing) {
      // Draw cell outlines
      ctx.strokeStyle = "#313131";
      for (let x = ox, y = oy, i = 0; i < this.grid.length; i++, x += cdim) {
        // Move down a row?
        if (i !== 0 && i % Tetris.width === 0) {
          y += cdim;
          x = ox;
        }
        // Draw cell outline
        ctx.strokeRect(x, y, cdim, cdim);
        // Fill cell is filled with shape.
        if (this.grid[i] >= 0) {
          ctx.fillStyle = shapes[this.shapes[this.grid[i]].idx].color;
          ctx.fillRect(x + Tetris.pad, y + Tetris.pad, cdim - Tetris.pad * 2, cdim - 2 * Tetris.pad);
        }
      }

      // Score
      ctx.font = "17px Arial";
      ctx.fillStyle = "#ffff00";
      let txt = "Score: " + this.score.toString().padStart(4, "0");
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(txt, width / 2 - w / 2 - (width - w) / 4, oy);
    }
    else if (this.state === State.Paused) {
      let x = width * 0.5, y = height * 0.3, size = 24;
      ctx.font = size + "px Arial";
      ctx.fillStyle = "#ffff00";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("PAUSED", x, y);

      size = Math.round(size * 0.6);
      // SCORE text
      y += 45;
      ctx.font = size + "px Arial";
      ctx.fillStyle = "#ffff00";
      let txt = "Score: " + this.score.toString().padStart(4, "0");
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(txt, x, y);

      // Resume instructions
      y += 25;
      ctx.font = size + "px Arial";
      if (Tetris.resumeButton) ctx.fillText(`Press ${Tetris.resumeButton} to resume`, x, y);
    }
    else if (this.state === State.Gameover) {
      // GAMEOVER image text
      let x = width * 0.5 - Tetris.gameoverImage.width * 0.5, y = height * 0.3 - Tetris.gameoverImage.height * 0.5;
      ctx.drawImage(Tetris.gameoverImage, x, y);
      y += Tetris.gameoverImage.height;
      x += Tetris.gameoverImage.width * 0.5;
      // SCORE text
      y += 30;
      ctx.font = "19px Arial";
      ctx.fillStyle = "#ffff00";
      let txt = "Score: " + this.score.toString().padStart(4, "0");
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(txt, x, y);
      // LEVEL text
      y += 30;
      txt = "Level " + this.level.toString();
      ctx.fillText(txt, x, y);
      // Resume instructions
      y += 30;
      ctx.font = size + "px Arial";
      if (Tetris.restartButton) ctx.fillText(`Press ${Tetris.restartButton} to restart`, x, y);
    }
  }
}

Tetris.width = 10;
Tetris.height = 20;
Tetris.pad = 2;
Tetris.queueLength = 3;
Tetris.gameoverImage = undefined; // OffscreenCanvas
Tetris.resumeButton = "p";
Tetris.restartButton = "r";