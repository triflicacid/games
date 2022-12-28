# Ludo

Game of Ludo. The aim of the gane is to move all of your pieces into your `landing strip`.

When it is your go, click on the `Roll` button to roll the die.

Spawn a piece in by clicking on your spawning area. A piece will spawn if you have a double-number on your die, or you have gone three goes with no pieces on the board.

You may move one of your pieces by a digit shown on a die. You can only move a piece by the exact digit shown. Move your piece into the same position as an enemy piece to take it. You cannot take your own piece.

Move your pieces around the board and advance onto your landing stip (colored in a lighter shade of your team color). Get all of your pieces onto this strip to win.

## How To Play

The basic premise of the game is described above; this subsection will focus more on the implementation.

Players will take turns clockwise around the board. Each go will take the following steps:

- Roll the die by pressing `Roll`.
- Spawn in a new piece by clicking on your colored area -- this may be done if
  1. A double number is rolled.
  2. The fraction in the bottom-left simplifies to one.

  The new piece will spawn in the slot immediatly above the right-hand corner of your colored area, unless that slot is occupied.
- Move your pieces as per the numbers presented on the die. One piece may be moved by a given number by clicking on the disc to be moved, and then clicking on the slot `x` number of slots away. Several things may happen,
  - If the slot is occupied by your color, the move is **invalid**.
  - If the slot is occupied by another color, that piece is **taken** and you move to that slot.
  - If the slot is empty, you move to that slot.
- Click `Next` to procees to the next player's go.

The aim of the game is to get all your pieces onto your colored strip. The first player with all their pieces on their colored strip wins.
## Attribution

Ludo favicon created by Freepik - Flaticon - https://www.flaticon.com/free-icons/ludo