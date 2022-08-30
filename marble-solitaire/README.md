# Marble Solitaire

A grid is g, with every cell populatd with a marble except the central cell. The aim of the game is to reduce the board to only have once marble in the cenral cell.

A marble is removed when it is hopped over. Consider the below scenario: "_ X X". By moving the last marble into the first space, the middle marble is eaten, meaning the resulting scenario is "X _ _". This action may be done both horizotnally and vertically.

## Controls

Click on a cell with a marble in to select it. You may click on the same cell again to de-select it.

Then, click on an empty cell. If this move is valid, the marble will move here and devour the cell hopped over. If it isn't valid, the cell will be de-selected.

## Buttons

- **New Game** - creates a new game
- **New Custom Game** - creates a new game, but allows custom width/height to be entered (*NB* these are the width/height of the northern stub on the plus shape)
- **Get Moves** - prints out list of possible moves to the message section. Clicking the **perform** button next to one of these will perform the move.
- **Random Move** - execute a possible move if there is one.
- **Export** - returns the text representation of the current game.
- **Import** - prompt the user for a game string (generated from **Export**). If the string is valid, will generate and display the represented game.