/** Rotate a shape array of length `dim*dim` using the given matrix */
export function rotate(shape, dim, clockwise = true) {
  const mat = clockwise ? [[0, 1], [-1, 0]] : [[0, -1], [1, 0]];
  const rot = [];
  // Start co-ordinates at (0, dim)
  for (let x = 1, y = dim, i = 0; i < shape.length; i++) {
    // Change row? New coords: (0, y-1)
    if (i !== 0 && x % (dim + 1) === 0) {
      y--;
      x = 1;
    }
    // Rotate co-ordinates by matrix
    let nx = mat[0][0] * x + mat[0][1] * y;
    let ny = mat[1][0] * x + mat[1][1] * y;
    // Translate co-ordinates back into the grid
    if (clockwise) {
      // ny = dim - (ny + 1 + dim);
      ny = -ny - 1;
      nx -= 1;
    } else {
      ny = dim - ny;
      nx += dim;
    }
    // Set value
    rot[ny * dim + nx] = shape[i];
    // Increment x
    x++;
  }
  return rot;
}

/** Shape positions */
export const shapes = [
  {
    type: "I",
    color: "#CB140B", // Color of shape cell
    dim: 4, // Dimensions of shape - sqrt(shape.length)
    shape: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    spawnPos: 4, // Index in this.shape of top-left corner when spawn in
  },
  {
    type: "T",
    color: "#04CDDD",
    dim: 3,
    shape: [0, 0, 0, 1, 1, 1, 0, 1, 0],
    spawnPos: 3,
  },
  {
    type: "L",
    color: "#D87200",
    dim: 3,
    shape: [0, 0, 0, 1, 1, 1, 1, 0, 0],
    spawnPos: 3,
  },
  {
    type: "J",
    color: "#1E2DB2",
    dim: 3,
    shape: [0, 0, 0, 1, 1, 1, 0, 0, 1],
    spawnPos: 3,
  },
  {
    type: "S",
    color: "#D419D4",
    dim: 3,
    shape: [0, 1, 1, 1, 1, 0, 0, 0, 0],
    spawnPos: 0,
  },
  {
    type: "Z",
    color: "#4DDB16",
    dim: 3,
    shape: [1, 1, 0, 0, 1, 1, 0, 0, 0],
    spawnPos: 0,
  },
  {
    type: "O",
    color: "#D4C501",
    dim: 2,
    shape: [1, 1, 1, 1],
    spawnPos: 0,
  },
];