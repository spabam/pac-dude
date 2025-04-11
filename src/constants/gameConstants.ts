
// Game grid dimensions
export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 31;
export const CELL_SIZE = 20;

// Game states
export enum GameState {
  MENU = "menu",
  PLAYING = "playing",
  GAME_OVER = "game_over",
  WIN = "win",
  PAUSE = "pause"
}

// Character types
export enum CellType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  POWER_PELLET = 3,
  GHOST_DOOR = 4,
}

// Directions
export enum Direction {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  NONE = "none",
}

// Ghost types
export enum GhostType {
  BLINKY = "blinky", // Red ghost - direct chase
  PINKY = "pinky",   // Pink ghost - ambush
  INKY = "inky",     // Cyan ghost - unpredictable
  CLYDE = "clyde",   // Orange ghost - random
}

// Ghost states
export enum GhostState {
  CHASE = "chase",
  SCATTER = "scatter",
  FRIGHTENED = "frightened",
  EATEN = "eaten",
  RANDOM = "random",  // Add new state for random movement
}

// Game scores
export const DOT_POINTS = 10;
export const POWER_PELLET_POINTS = 50;
export const GHOST_POINTS = 200;
export const GHOST_COMBO_MULTIPLIER = 2; // Each subsequent ghost is worth 2x more

// Timers
export const POWER_PELLET_DURATION = 8000; // 8 seconds
export const GHOST_FLASH_DURATION = 3000; // Ghosts flash 3 seconds before returning to normal
export const GHOST_SCATTER_DURATION = 7000; // 7 seconds
export const GHOST_CHASE_DURATION = 20000; // 20 seconds

// Starting positions
export const PLAYER_START_X = 14;
export const PLAYER_START_Y = 22.5; // MOVED UP to ensure Pac-Dude starts in a corridor
export const GHOST_HOME_X = 14;
export const GHOST_HOME_Y = 14;

// Speeds (cells per second)
export const PLAYER_SPEED = 8;
export const GHOST_SPEED = 5.5;  // Reduced from 7.5 to be slower than player
export const GHOST_FRIGHTENED_SPEED = 3;  // Reduced from 4
export const GHOST_TUNNEL_SPEED = 2.5;    // Reduced from 4
export const GHOST_RANDOM_DIRECTION_CHANGE = 1500; // Time in ms between random direction changes
