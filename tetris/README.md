# Tetris

The classical game of tetris. Stack random blocks as they fall from the sky, completing rows to eliminate them and gain points. The more rows eliminated at once, the more points you get.

## Controls
- `a` - Rotate current Tetrimino anticlockwise
- `b` - Rotate current Tetrimino clockwise
- `c` - Hold current shape. If a shape is already being held, swap them.
- `Right Arrow` - Move current Tetrimino right one cell
- `Left Arrow` - Move current Tetrimino left one cell
- `Space` - Hard drop current Tetrimino (Tetrimino moves down as much as possible until it freezes; gains extra points)
- `p` - Pause/resume the current game
- `r` - Restart game (on Game Over screen)

### Debug
These controls have been implemented for debug purposes

- `Shift` + `c` - Check for completed rows
- `d` - Toggle debug mode
- `Shift` + `f` - Freeze (give up control) current Tetrimino
- `Shift` + `d` - Forced screen render
- `Shift` + `g` - Game Over
- `Shift` + `p` - Pause game without pause screen
- `Shift` + `q` - Reset next queue
- `Shift` + `r` - Restart current game
- `Shift` + `s` - Spawn-in new random shape
- `0-9` - Spawn-in shape with numeric index
- `Delete` - Remove current Tetrimino
- `Up Arrow` - Move current Tetrimino up one cell
- `Down Arrow` - Move current Tetrimino down one cell

## TODO
- Implement levels. Speed up drop speed?
- Incorporate tetris soundtrack
- Enable/disable sound