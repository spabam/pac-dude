// Grid configuration
export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 31;
export const CELL_SIZE = 16;

// Spawn positions (tile centers)
export const PLAYER_START_X = 13.5;
export const PLAYER_START_Y = 23.5;
export const HOUSE_EXIT_X = 13.5;
export const HOUSE_EXIT_Y = 11.5;
export const HOUSE_CENTER_X = 13.5;
export const HOUSE_CENTER_Y = 14.5;

// Speeds, in tiles per second
export const PLAYER_SPEED = 8;
export const GHOST_SPEED = 6;
export const GHOST_FRIGHTENED_SPEED = 3.5;
export const GHOST_EATEN_SPEED = 14;
export const GHOST_TUNNEL_SPEED = 3.5;

// Level configuration
export const CHASE_MODE_START_LEVEL = 4; // ghosts only hunt the player from level 4 on
export const GHOST_RELEASE_DELAY = 2500; // ms between ghosts leaving the house
export const GHOST_RESPAWN_TIME = 3000; // ms an eaten ghost waits in the house

// Scoring
export const DOT_POINTS = 10;
export const POWER_PELLET_POINTS = 50;
export const GHOST_POINTS = 200;
export const GHOST_COMBO_MULTIPLIER = 2;
export const STARTING_LIVES = 3;

// Timers
export const POWER_PELLET_DURATION = 8000; // ms
export const GHOST_FLASH_DURATION = 2000; // ms of flashing before power mode ends

export enum Direction {
  NONE = 0,
  UP = 1,
  DOWN = 2,
  LEFT = 3,
  RIGHT = 4,
}

export enum GameState {
  MENU = 0,
  PLAYING = 1,
  PAUSE = 2,
  GAME_OVER = 3,
  WIN = 4,
}

export enum CellType {
  EMPTY = 0,
  WALL = 1,
  DOT = 2,
  POWER_PELLET = 3,
  GHOST_DOOR = 4,
}

export enum GhostType {
  BLINKY = 0, // red - direct chaser
  PINKY = 1, // pink - ambusher
  INKY = 2, // cyan - unpredictable
  CLYDE = 3, // orange - shy
}

export enum GhostMode {
  HOUSE = 0, // inside the house / heading for the door
  ROAM = 1, // out in the maze
  EATEN = 2, // eyes returning home
}
