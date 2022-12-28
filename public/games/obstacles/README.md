# Obstacles

You are a player whose objective is to clear as many obstacles as possible.

The player remains in the same horizontal place, being effected vertically by gravity and able to jump. Obstacles are boxes extending from the floor and ceiling, with a varying-sized gap in the middle. Your aim is to clear this obstacle by jumping through the gap. You will die if you touch the obstacles, hit the floor or hit the ceiling.

Press `Enter` to start.

## Controls
- `p` - pause/resume game
- `Space` - jump
- `Enter` - restart game

More options are present on the right hand side of the screen
- **Sound** - toggle sound on/off
- **FPS** - control FPS the game is displayed at
- **Obstacle Speed** - speed at which obstacles move towards the player. Pixels/frame.
- **Obstacle Spawning** - spawns a new obstacle every `x` frames
- **Obstacle Generation** - smooth (uses perlin noise) or random (pseudo-random)
- **Point per Cell** - allows tweaking of perlin noise behaviour. Generates X-coordinate is `obstacleN / ppc`.
- **Gravity** - gravitational acceleration of player
- **Jump** - initial vertical velocty of player when jumping, in pixels

## TODO

Use Perlin Noise for obstacle generation