# Sudoku

Basic Sudoku generator. Every row, columns and box should not contain a duplicate number, The aim of the game is to complete the board in as little time as possible.

Use the arrow keys to control which cell is selected, and use the numeric keys to populate the number. Toggle `note` mode to determine whether number will be noted or inserted into the cell.

## Controls
- `d` : toggle debug mode;
- `m` : toggle colour preference;
- `n` : toggle `insert as note` mode;
- `p` : pause/resume game;
- `r` : end the current game, or create new game;
- `ArrowUp` : move selection up;
- `ArrowRight` : move selection right;
- `ArrowDown` : move selection down;
- `ArrowLeft` : move selection left;
- `0-9` : add/remove digit from current cell.
  - If `asNote` is `on`, add/remove from notes.
  - Else, add to cell. It will be reported whether this is possible.

## Todo
- Add buttons to enter numbers -- current solution only works for `1-9`. What about when numbers greater than 10 are used?
- More efficient/elegant generation algorithm
- Sudoku solver