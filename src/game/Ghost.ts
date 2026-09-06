import {
  CHASE_MODE_START_LEVEL,
  Direction,
  GHOST_EATEN_SPEED,
  GHOST_FRIGHTENED_SPEED,
  GHOST_SPEED,
  GHOST_TUNNEL_SPEED,
  GHOST_RESPAWN_TIME,
  GhostMode,
  GhostType,
  HOUSE_CENTER_X,
  HOUSE_CENTER_Y,
  HOUSE_EXIT_X,
  HOUSE_EXIT_Y,
} from '../constants/gameConstants';
import { Actor } from './Actor';
import { Board, DELTA, DIRECTIONS, isWalkable, opposite, stepTowards } from './maze';

interface Point {
  x: number;
  y: number;
}

const SCATTER_TARGETS: Record<GhostType, Point> = {
  [GhostType.BLINKY]: { x: 26, y: 1 },
  [GhostType.PINKY]: { x: 1, y: 1 },
  [GhostType.INKY]: { x: 26, y: 29 },
  [GhostType.CLYDE]: { x: 1, y: 29 },
};

export class Ghost extends Actor {
  mode: GhostMode;
  frightened = false;
  /** Timestamp (ms) from which the ghost may leave the house. */
  releaseAt: number;

  constructor(
    public type: GhostType,
    private spawnX: number,
    private spawnY: number,
    releaseDelay: number,
    startOutside = false
  ) {
    super(spawnX, spawnY, GHOST_SPEED);
    this.mode = startOutside ? GhostMode.ROAM : GhostMode.HOUSE;
    this.releaseAt = Date.now() + releaseDelay;
    this.direction = Direction.LEFT;
  }

  respawn(releaseDelay: number, startOutside = false) {
    this.reset(this.spawnX, this.spawnY, Direction.LEFT);
    this.mode = startOutside ? GhostMode.ROAM : GhostMode.HOUSE;
    this.frightened = false;
    this.releaseAt = Date.now() + releaseDelay;
  }

  getEaten(now: number) {
    this.mode = GhostMode.EATEN;
    this.frightened = false;
    this.releaseAt = now + GHOST_RESPAWN_TIME;
  }

  private currentSpeed(): number {
    if (this.mode === GhostMode.EATEN) return GHOST_EATEN_SPEED;
    if (this.frightened) return GHOST_FRIGHTENED_SPEED;
    const inTunnel = this.tileY === 14 && (this.x < 5 || this.x > 22);
    return inTunnel ? GHOST_TUNNEL_SPEED : GHOST_SPEED;
  }

  update(deltaTime: number, board: Board, player: Point, level: number, now: number) {
    // Eyes that made it home wait out their respawn timer.
    if (
      this.mode === GhostMode.EATEN &&
      Math.abs(this.x - HOUSE_CENTER_X) < 0.5 &&
      Math.abs(this.y - HOUSE_CENTER_Y) < 0.5
    ) {
      this.reset(HOUSE_CENTER_X, HOUSE_CENTER_Y, Direction.UP);
      this.mode = GhostMode.HOUSE;
    }

    if (this.mode === GhostMode.HOUSE && now < this.releaseAt) return;

    this.travel(this.currentSpeed() * deltaTime, () => {
      if (this.mode === GhostMode.HOUSE) return this.stepOutOfHouse();
      if (this.mode === GhostMode.EATEN) {
        return stepTowards(board, this.tileX, this.tileY, HOUSE_CENTER_X, HOUSE_CENTER_Y, true);
      }
      return this.chooseDirection(board, player, level);
    });
  }

  /** Slide to the door column, then rise through the door into the maze. */
  private stepOutOfHouse(): Direction {
    if (this.y <= HOUSE_EXIT_Y) {
      this.mode = GhostMode.ROAM;
      return Direction.LEFT;
    }
    if (Math.abs(this.x - HOUSE_EXIT_X) > 0.1) {
      return this.x < HOUSE_EXIT_X ? Direction.RIGHT : Direction.LEFT;
    }
    return Direction.UP;
  }

  private chooseDirection(board: Board, player: Point, level: number): Direction {
    const options = DIRECTIONS.filter(
      dir =>
        dir !== opposite(this.direction) &&
        isWalkable(board, this.tileX + DELTA[dir].x, this.tileY + DELTA[dir].y)
    );

    // Dead end: the only way out is back the way we came.
    if (options.length === 0) return opposite(this.direction);

    // Early levels and power mode: wander instead of hunting.
    if (this.frightened || level < CHASE_MODE_START_LEVEL) {
      return options[Math.floor(Math.random() * options.length)];
    }

    const target = this.chaseTarget(player);
    return options.reduce((best, dir) => (this.cost(dir, target) < this.cost(best, target) ? dir : best));
  }

  private cost(dir: Direction, target: Point): number {
    const nx = this.tileX + DELTA[dir].x;
    const ny = this.tileY + DELTA[dir].y;
    return (nx - target.x) ** 2 + (ny - target.y) ** 2;
  }

  private chaseTarget(player: Point): Point {
    const scatter = SCATTER_TARGETS[this.type];
    switch (this.type) {
      case GhostType.BLINKY:
        return player;
      case GhostType.PINKY: {
        // Aim four tiles ahead of the player.
        const ahead = DELTA[this.direction];
        return { x: player.x + ahead.x * 4, y: player.y + ahead.y * 4 };
      }
      case GhostType.INKY:
        // Mirror the player around the ghost's own position.
        return { x: player.x * 2 - this.x, y: player.y * 2 - this.y };
      case GhostType.CLYDE: {
        const distance = Math.hypot(player.x - this.x, player.y - this.y);
        return distance > 8 ? player : scatter;
      }
      default:
        return scatter;
    }
  }
}
