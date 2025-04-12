
// Player starting position
export const PLAYER_START_X = 14; // Start in horizontal center
export const PLAYER_START_Y = 23.5; // Updated position to be in a valid corridor

// Grid configuration
export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 31;
export const CELL_SIZE = 16;

// Game mechanics
export const PLAYER_SPEED = 8; // Increased from 6 to 8 for faster movement
export const GHOST_SPEED = 6; // Increased from 5 to 6 for more consistent movement
export const GHOST_FRIGHTENED_SPEED = 4; // Increased from 3 to 4 for more reliable movement
export const GHOST_TUNNEL_SPEED = 4; // Increased from 3 to 4 for more reliable movement
export const GHOST_RANDOM_DIRECTION_CHANGE = 500; // Reduced from 800 to 500 for more dynamic movement

// Ghost movement thresholds
export const INTERSECTION_THRESHOLD = 0.1; // Reduced for more precise intersection detection
export const POSITION_RESET_THRESHOLD = 500; // Reduced from 1000 ms to reset ghost position quicker if stuck

// Scoring
export const DOT_POINTS = 10;
export const POWER_PELLET_POINTS = 50;
export const GHOST_POINTS = 200;
export const GHOST_COMBO_MULTIPLIER = 2;

// Timers
export const POWER_PELLET_DURATION = 8000; // 8 seconds
export const GHOST_FLASH_DURATION = 2000; // 2 seconds before power mode ends
export const GHOST_HOUSE_TIME = 200; // Reduced further for quicker ghost release

// Enums
export const enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4
}

export const enum GameState {
  MENU = 0,
  PLAYING = 1,
  PAUSE = 2,
  GAME_OVER = 3,
  WIN = 4
}

export const enum CellType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  POWER_PELLET = 3,
  GHOST_DOOR = 4
}

export const enum GhostType {
  BLINKY = 0, // Red - chases player directly
  PINKY = 1,  // Pink - tries to ambush player
  INKY = 2,   // Cyan - unpredictable
  CLYDE = 3   // Orange - random movement
}

export const enum GhostState {
  CHASE = 0,      // Normal chase mode
  SCATTER = 1,    // Return to corners
  FRIGHTENED = 2, // Blue and vulnerable
  EATEN = 3,      // Eyes only, returning to ghost house
  RANDOM = 4      // Move randomly
}
