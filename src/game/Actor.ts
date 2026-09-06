import { Direction, GRID_WIDTH } from '../constants/gameConstants';
import { DELTA } from './maze';

const EPSILON = 1e-6;

/**
 * Grid actor that always travels along lane centres and can only change
 * direction on a tile centre. That single rule keeps Pac-Dude and the ghosts
 * out of walls and stops them ever getting wedged.
 */
export abstract class Actor {
  x: number;
  y: number;
  direction: Direction = Direction.NONE;

  constructor(x: number, y: number, public speed: number) {
    this.x = x;
    this.y = y;
  }

  get tileX(): number {
    return Math.floor(this.x);
  }

  get tileY(): number {
    return Math.floor(this.y);
  }

  reset(x: number, y: number, direction: Direction = Direction.NONE) {
    this.x = x;
    this.y = y;
    this.direction = direction;
  }

  /** Move `speed * deltaTime` tiles, asking `decide` for a heading at every tile centre. */
  protected travel(distance: number, decide: () => Direction) {
    let remaining = distance;

    while (remaining > EPSILON) {
      if (this.isAtCentre()) {
        this.snapToCentre();
        this.direction = decide();
      }
      if (this.direction === Direction.NONE) return;

      const step = Math.min(remaining, this.distanceToNextCentre());
      this.x += DELTA[this.direction].x * step;
      this.y += DELTA[this.direction].y * step;
      remaining -= step;
      this.wrapAround();
    }
  }

  isAtCentre(): boolean {
    return (
      Math.abs(this.x - (Math.floor(this.x) + 0.5)) < EPSILON &&
      Math.abs(this.y - (Math.floor(this.y) + 0.5)) < EPSILON
    );
  }

  private snapToCentre() {
    this.x = Math.floor(this.x) + 0.5;
    this.y = Math.floor(this.y) + 0.5;
  }

  private distanceToNextCentre(): number {
    const { x: dx, y: dy } = DELTA[this.direction];
    if (dx > 0) return Math.floor(this.x + 0.5) + 0.5 - this.x;
    if (dx < 0) return this.x - (Math.ceil(this.x - 0.5) - 0.5);
    if (dy > 0) return Math.floor(this.y + 0.5) + 0.5 - this.y;
    return this.y - (Math.ceil(this.y - 0.5) - 0.5);
  }

  private wrapAround() {
    if (this.x < -0.5) this.x += GRID_WIDTH;
    else if (this.x > GRID_WIDTH - 0.5) this.x -= GRID_WIDTH;
  }
}
