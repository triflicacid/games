import { Sounds } from "../../libs/Sound.js";
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
    this.goesNoSpawn = []; // Goes gone without being able to spawn
    this.playerMoved = false; // Has this.current moved at all?
    this.winner = -1; // Player index of winner
    this.pos = {
      slot: new Map(), // Slot positions. Map { index => [x, y] }
      spawn: [], // Positions of spawning areas [x, y, dim][]
      die: [], // Position of die. [x, y, dim][]
      btnRole: [], // Position of button. [x, y, dim]
      btnNext: [], // Position of button. [x, y, dim]
    };
    this.die = [0, 0];
    this.hasRolled = true; // Show "Roll" button?
    this.outlinedSlots = [];
    this.selectedSlot = -1; // Index of selected cell
    this.reset();
  }

  /** Reset game */
  reset() {
    this.players = Array.from({ length: 4 }, (_, i) => Array.from({ length: this.pieces }).fill(-1));
    // const E = 2 * this.pieces + 4;
    // this.players.forEach((pcs, i) => pcs[0] = E * i + 1);
    this.current = 0;
    this.goesNoSpawn = Array.from({ length: this.players.length }).fill(Ludo.waitBeforeSpawn); // Limit - spawn straight away
    this.playerMoved = false;
    this.winner = -1;
    this.hasRolled = false;
    this.outlinedSlots.length = 0;
    this.selectedSlot = -1;
    this.rollDie();
  }

  /** Roll die */
  rollDie() {
    return (this.die = this.die.map(() => Math.floor(Math.random() * 5) + 1));
  }

  /** Get distance `a` to `b` playing as player `playingAs` */
  getDistance(a, b, playingAs = undefined) {
    if (playingAs === undefined) playingAs = this.current;
    // LANDING STRIPS
    if (b >= 1000 && a < 1000) {
      const E = 2 * this.pieces + 4;
      for (let j = 3; j >= 0; j--) {
        const C = 1000 + j * 100;
        if (b >= C) return playingAs === j ? this.getDistance(a, j * E) + 1 + b - C : Infinity;
      }
    }
    return b - (a > b ? a - (this.pieces + 2) * 8 : a);
  }

  /** Get piece at given slot `[playedIDX, pieceIDX]`, else return `[-1, -1]`. */
  getPlayerAt(cell) {
    const pidx = this.players.findIndex(pcs => pcs.some(i => i === cell));
    if (pidx === -1) return [-1, -1];
    const pcidx = this.players[pidx].findIndex(i => i === cell);
    return [pidx, pcidx];
  }

  /**
   * Is the movement between these two cells valid for player `this.current` with die `this.die`?
   * - If no, return `false`
   * - If yes, return object with the following properties
   *    - `src`: `[playerIDX, pieceIDX]` in `a`
   *    - `dst`: `[playerIDX, pieceIDX]` in `b
   *    - `dist` : distance between `a` and `b`
   *    - `dieIdx` : index in `this.die` used. **NOTE** `this.die` is **not** updated
   */
  isValidMove(a, b) {
    const [pidxA, pcidxA] = this.getPlayerAt(a);
    if (pidxA !== this.current) return false;
    const [pidxB, pcidxB] = this.getPlayerAt(b);
    if (pidxB === pidxA) return false; // Cannot take onself
    const dist = this.getDistance(a, b), dieIdx = this.die.findIndex(n => n === dist);
    if (dieIdx === -1) return false;
    return {
      src: [pidxA, pcidxA],
      dst: [pidxB, pcidxB],
      dist,
      dieIdx,
    };
  }

  /** Return advancment from `src` by `n` places. Return `NaN` if impossible */
  advanceFrom(src, n) {
    const E = 2 * this.pieces + 4, lim = this.players.length;
    for (let i = 0; i < lim; i++) {
      const a = (i === 0 ? lim : i) * E;
      if (this.current === i && src <= a && src + n > a) return src + n > a + lim ? NaN : 1000 + i * 100 + n - (a - src) - 1;
    }
    return (src + n) % (lim * E + 1);
  }

  /** Check for winners. Return PLAYED IDX or `-1` */
  checkWinners() {
    for (let i = this.players.length - 1; i >= 0; i--) {
      const W = 1000 + i * 100;
      if (this.players[i].every(p => p >= W)) return i;
    }
    return -1;
  }

  /** Load everything ready to render */
  prepareDisplay(width, height) {
    this.pos.slot.clear();

    let i = 0, x, y;
    // BLUE landing strip
    x = width / 2 + 2 * (2 * SRADIUS + SPAD);
    y = height / 2;
    for (i = 1000 + this.pieces - 1; i >= 1000; i--) {
      this.pos.slot.set(i, [x, y]);
      x += SRADIUS * 2 + SPAD;
    }
    // BLUE landing strip
    x = width / 2 - 2 * (2 * SRADIUS + SPAD);
    for (i = 1200 + this.pieces - 1; i >= 1200; i--) {
      this.pos.slot.set(i, [x, y]);
      x -= SRADIUS * 2 + SPAD;
    }
    // YELLOW landing strip
    x = width / 2;
    y = height / 2 + 2 * (2 * SRADIUS + SPAD);
    for (i = 1100 + this.pieces - 1; i >= 1100; i--) {
      this.pos.slot.set(i, [x, y]);
      y += SRADIUS * 2 + SPAD;
    }
    // RED landing strip
    y = height / 2 - 2 * (2 * SRADIUS + SPAD);
    for (i = 1300 + this.pieces - 1; i >= 1300; i--) {
      this.pos.slot.set(i, [x, y]);
      y -= SRADIUS * 2 + SPAD;
    }

    // MAIN SLOTS
    i = 1;
    x = width / 2 + (this.pieces + 2) * (SRADIUS * 2 + SPAD);
    y = height / 2 + SRADIUS * 2 + SPAD;
    for (; i <= this.pieces + 1; i++) {
      this.pos.slot.set(i, [x, y]);
      x -= SRADIUS * 2 + SPAD;
    }
    for (let j = i; i <= j + this.pieces + 1; i++) {
      this.pos.slot.set(i, [x, y]);
      y += SRADIUS * 2 + SPAD;
    }
    y -= SRADIUS * 2 + SPAD;
    for (let j = i; i <= j + 1; i++) {
      x -= SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      y -= SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      x -= SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j + 1; i++) {
      y -= SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      x += SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      y -= SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j + 1; i++) {
      x += SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      y += SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j + this.pieces; i++) {
      x += SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }
    for (let j = i; i <= j; i++) {
      y += SRADIUS * 2 + SPAD;
      this.pos.slot.set(i, [x, y]);
    }

    // SPAWNING AREAS
    let off = 2 * (2 * SRADIUS + SPAD) - SRADIUS / 2, dim = SRADIUS * 2 * (this.pieces + 1);
    this.pos.spawn[0] = [width / 2 + off, height / 2 + off, dim];
    this.pos.spawn[1] = [width / 2 - off - dim, height / 2 + off, dim];
    this.pos.spawn[2] = [width / 2 - off - dim, height / 2 - off - dim, dim];
    this.pos.spawn[3] = [width / 2 + off, height / 2 - off - dim, dim];

    // BUTTONS
    this.pos.btnRole = [width / 2 - SRADIUS * 2, height / 2 - SRADIUS, SRADIUS * 4, SRADIUS * 2];
    this.pos.btnNext = [width / 2 + off, (height - ((this.pieces + 2) * 2 + 1) * (2 * SRADIUS + SPAD)) / 4 - SRADIUS, SRADIUS * 4, SRADIUS * 2];

    // DIE
    dim = Math.floor((SRADIUS * 3 + 2 * SPAD) / 2);
    this.pos.die[0] = [width / 2 - SRADIUS * 2, height / 2 - dim / 2, dim].map(Math.floor);
    this.pos.die[1] = [width / 2 + SRADIUS * 2 - dim, height / 2 - dim / 2, dim].map(Math.floor);
  }

  display(ctx, width, height) {
    const spawnC = 2 * this.pieces + 4;

    /** Draw slot at (x,y) */
    const drawSlot = (x, y, i) => {
      ctx.fillStyle = "white";
      // LANDING STRIP
      if (i >= 1000) ctx.fillStyle = (this.winner === -1 ? this.colors[Math.round(i / 100) - 10] : this.colors[this.winner]) + "65";
      // SPAWNING SPOT
      else if (i % spawnC === 0) ctx.fillStyle = (this.winner === -1 ? this.colors[(i / spawnC) % 4] : this.colors[this.winner]) + "30";

      ctx.strokeStyle = "black";
      if (this.outlinedSlots.includes(i) || this.selectedSlot === i) ctx.strokeStyle = "red";
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
        ctx.fillStyle = this.winner === -1 ? this.colors[pidx] : this.colors[this.winner];
        ctx.beginPath();
        ctx.arc(x, y, DRADIUS, 0, 2 * Math.PI);
        ctx.fill();
      }

      return i + 1;
    };

    ctx.clearRect(0, 0, width, height);

    // SLOTS
    this.pos.slot.forEach(([x, y], i) => drawSlot(x, y, i));

    // SPAWNING AREAS
    const drawSpawningArea = (i) => {
      const [x, y, dim] = this.pos.spawn[i];
      const color = this.winner === -1 ? this.colors[i] : this.colors[this.winner];
      ctx.strokeStyle = color;
      ctx.strokeRect(x, y, dim, dim);
      ctx.fillStyle = color + "40";
      ctx.fillRect(x, y, dim, dim);
      const count = this.players[i].filter(x => x === -1).length;
      const limx = Math.floor(dim / (3 * SRADIUS));
      let pad = DRADIUS * 2.5, dx = x, dy = y;
      for (let j = 0; j < count; j++) {
        if (j % limx === 0) {
          dx = x + pad;
          dy += pad;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(dx, dy, DRADIUS, 0, 2 * Math.PI);
        ctx.fill();
        dx += pad;
      }
      if (this.winner === -1 && this.goesNoSpawn[i] > 0) {
        ctx.fillStyle = "black";
        ctx.font = "15px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(this.goesNoSpawn[i] + "/" + Ludo.waitBeforeSpawn, x + 5, y + dim - 3);
      }
    };
    for (let i = 0; i < this.players.length; i++) drawSpawningArea(i);

    if (this.winner === -1) {
      if (this.hasRolled) {
        // DIE
        ctx.strokeStyle = ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "14px Arial";
        for (let i = 0; i < this.pos.die.length; i++) {
          const [x, y, dim] = this.pos.die[i];
          ctx.strokeRect(x, y, dim, dim);
          ctx.fillText(this.die[i], x + dim / 2, y + dim / 2);
        }
      } else {
        // BUTTON "ROLL"
        ctx.strokeStyle = "black";
        ctx.fillStyle = "red";
        ctx.beginPath();
        let [x, y, w, h] = this.pos.btnRole;
        ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "white";
        ctx.font = "15px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Roll", x + w / 2, y + h / 2);
      }
    } else {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "black";
      ctx.font = "36px Comic Sans MS";
      ctx.fillText("🏆", width / 2, height / 2);

    }

    // Whose go? / Winner text
    let x = width / 2;
    let y = (height - ((this.pieces + 2) * 2 + 1) * (2 * SRADIUS + SPAD)) / 4;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.font = "22px Comic Sans MS";
    let text = this.winner === -1 ? `${toTitleCase(this.names[this.current])}'s Go` : `${toTitleCase(this.names[this.winner])} Wins!`;
    ctx.fillText(text, x, y);

    // BUTTON "NEXT"
    ctx.strokeStyle = "black";
    ctx.fillStyle = "red";
    ctx.beginPath();
    let w, h;
    ([x, y, w, h] = this.pos.btnNext);
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = "15px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.winner === -1 ? "Next" : "Restart", x + w / 2, y + h / 2);
  }

  /** Handle CLICK. Object { status: number }. Status codes:
   * 
   * - `-1` -> Error. { ... msg: string }
   * - `0` -> Nothing
   * - `1` -> Dice roll
   * - `2` -> Select spot with piece in it. { ... cell: number, pc: number }
   * - `3` -> Moved piece. { ... cell: number, cellFrom: number, cellTo: number, dist: number, piece: number, took?: number }
   * - `4` -> Spawned in new piece. { ... pc: number }
   * - `5` -> Advance persons go
   * - `6` -> Click on "Restart" button
  */
  handleClick(x, y) {
    // Click on "Next" / "Restart"
    let [bx, by, bw, bh] = this.pos.btnNext;
    if (x > bx && x < bx + bw && y > by && y < by + bh) {
      if (this.winner !== -1) {
        this.reset();
        return { status: 6 };
      }
      if (!this.hasRolled) return { status: -1, msg: "Roll die" };
      // Player has rolled but they haven't moved, cannot spawn in a piece
      if (this.hasRolled && !this.playerMoved && new Set(this.die).size > 1 && this.goesNoSpawn[this.current] < Ludo.waitBeforeSpawn) {
        let validMove = this.players[this.current].some(s => s !== -1 && this.die.some(n => this.isValidMove(s, this.advanceFrom(s, n))));
        if (!validMove) this.goesNoSpawn[this.current]++;
      }

      this.current = (this.current + 1) % this.players.length;
      this.hasRolled = false; // Next, roll die
      this.playerMoved = false;
      return { status: 5 };
    }
    if (this.winner !== -1) return { status: 0 }; // There is a winner; allow no more interaction

    // Have we rolled yet?
    if (!this.hasRolled) {
      let [bx, by, bw, bh] = this.pos.btnRole;
      if (x > bx && x < bx + bw && y > by && y < by + bh) {
        this.rollDie();
        this.hasRolled = true;
        return { status: 1 };
      }
    } else {
      // "Next" button?

      // Clicked on spawning area?
      let spawningAreaClicked = null;
      for (let i = 0; i < this.pos.spawn.length; i++) {
        const [ax, ay, adim] = this.pos.spawn[i];
        if (x > ax && x < ax + adim && y > ay && y < ay + adim) {
          spawningAreaClicked = i;
          break;
        }
      }
      if (spawningAreaClicked !== null) {
        if (spawningAreaClicked === this.current) {
          const slot = this.current * (2 * this.pieces + 4) + 1; // Spawn slot
          let [pcidx] = this.getPlayerAt(slot);
          if (pcidx !== -1) return { status: -1, msg: "Spawning slot is full" };
          pcidx = this.players[this.current].findIndex(n => n === -1);
          if (pcidx !== -1) { // If there is a player to spawn...
            let doSpawn = false;
            if (this.goesNoSpawn[this.current] >= Ludo.waitBeforeSpawn) {
              doSpawn = true;
            } else if (this.die[0] !== 0 && new Set(this.die).size === 1) {
              this.die.fill(0); // Zero-out dice
              doSpawn = true;
            }

            if (doSpawn) {
              this.players[this.current][pcidx] = slot;
              this.goesNoSpawn[this.current] = 0;
              return { status: 4, pc: pcidx };
            }
          }
          return { status: 0 };
        } else {
          return { status: -1, msg: "Cannot click on other players spawning area" };
        }
      }

      // Clicked on a slot?
      let slotClickedOn = null;
      for (const [cell, [cx, cy]] of this.pos.slot) {
        if (x > cx - SRADIUS && x < cx + SRADIUS && y > cy - SRADIUS && y < cy + SRADIUS) {
          slotClickedOn = cell;
          break;
        }
      }
      if (slotClickedOn === null) return { status: 0 };
      // A disc in that slot?
      const [pidx, pcidx] = this.getPlayerAt(slotClickedOn);
      if (this.selectedSlot === -1) {
        if (pidx === -1) {
          return { status: -1, msg: "Click on spot with your piece in it" };
        } else {
          // SELECT SLOT
          if (pidx !== this.current) {
            return { status: -1, msg: "Click on spot with your piece in it" };
          } else {
            this.selectedSlot = slotClickedOn;
            return { status: 2, cell: slotClickedOn, pc: pcidx };
          }
        }
      } else if (this.selectedSlot === slotClickedOn) { // Deselect
        this.selectedSlot = -1;
        return { status: 2, cell: slotClickedOn };
      } else {
        const mov = this.isValidMove(this.selectedSlot, slotClickedOn); // Get move info
        if (mov) {
          const obj = { status: 3, cellFrom: this.selectedSlot, cellTo: slotClickedOn, dist: mov.dist, piece: mov.src[1] };

          // Took a piece?
          if (mov.dst[0] !== -1) {
            obj.took = mov.dst[0];
            this.players[mov.dst[0]][mov.dst[1]] = -1; // Move back to spawn
          }

          this.players[mov.src[0]][mov.src[1]] = slotClickedOn;
          this.selectedSlot = -1;
          this.die[mov.dieIdx] = 0; // Zero the dice used
          this.playerMoved = true;
          return obj;
        } else {
          return { status: -1, msg: "Invalid move" };
        }
      }
    }

    return { status: 0 };
  }
}

/** Number of goes to wait before free spawn */
Ludo.waitBeforeSpawn = 3;