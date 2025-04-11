import { Direction, PLAYER_SPEED } from '../constants/gameConstants';

export class Player {
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  targetX: number | null;
  targetY: number | null;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.direction = Direction.NONE;
    this.speed = PLAYER_SPEED;
    this.targetX = null;
    this.targetY = null;
  }

  // Check if a direction is valid based on the current position
  canChangeDirection(dir: Direction, canMoveFn: (x: number, y: number) => boolean): boolean {
    const nextX = Math.floor(this.x);
    const nextY = Math.floor(this.y);

    // Calculate position after potential direction change
    switch (dir) {
      case Direction.UP:
        return canMoveFn(nextX, nextY - 1);
      case Direction.DOWN:
        return canMoveFn(nextX, nextY + 1);
      case Direction.LEFT:
        return canMoveFn(nextX - 1, nextY);
      case Direction.RIGHT:
        return canMoveFn(nextX + 1, nextY);
      case Direction.NONE:
        return true;
      default:
        return false;
    }
  }

  // Update player position based on direction and speed
  update(
    deltaTime: number, 
    currentDirection: Direction, 
    nextDirection: Direction,
    canMoveFn: (x: number, y: number) => boolean
  ): boolean {
    // Calculate how far to move based on speed and time
    const moveDistance = this.speed * deltaTime;
    let moved = false;

    // Always try to change to the next direction first
    if (nextDirection !== Direction.NONE) {
      console.log("Trying to change to direction:", nextDirection);
      // Just set the direction immediately if this is the first movement
      if (this.direction === Direction.NONE) {
        this.direction = nextDirection;
        console.log("First movement, setting direction to:", nextDirection);
      } 
      // Otherwise check if we can change to the new direction
      else if (this.canChangeDirection(nextDirection, canMoveFn)) {
        this.direction = nextDirection;
        console.log("Successfully changed direction to:", nextDirection);
      }
    }

    // If player is in a cell center position, they can change direction more easily
    const isAtCellCenter = 
      Math.abs(this.x - Math.floor(this.x) - 0.5) < 0.1 && 
      Math.abs(this.y - Math.floor(this.y) - 0.5) < 0.1;

    // Try again at cell centers for more responsive controls
    if (isAtCellCenter && nextDirection !== Direction.NONE) {
      if (this.canChangeDirection(nextDirection, canMoveFn)) {
        this.direction = nextDirection;
      }
    }

    // If player can't move in current direction, try using the last known direction
    if (!this.canMoveInCurrentDirection(canMoveFn) && currentDirection !== Direction.NONE) {
      if (this.canChangeDirection(currentDirection, canMoveFn)) {
        this.direction = currentDirection;
      }
    }

    // Move player based on current direction
    switch (this.direction) {
      case Direction.UP:
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y - 0.1))) {
          this.y -= moveDistance;
          moved = true;
        } else {
          // Align to grid if hitting a wall
          this.y = Math.floor(this.y) + 0.5;
        }
        break;
      case Direction.DOWN:
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y + 1))) {
          this.y += moveDistance;
          moved = true;
        } else {
          // Align to grid if hitting a wall
          this.y = Math.floor(this.y) + 0.5;
        }
        break;
      case Direction.LEFT:
        if (canMoveFn(Math.floor(this.x - 0.1), Math.floor(this.y))) {
          this.x -= moveDistance;
          moved = true;
        } else {
          // Align to grid if hitting a wall
          this.x = Math.floor(this.x) + 0.5;
        }
        break;
      case Direction.RIGHT:
        if (canMoveFn(Math.floor(this.x + 1), Math.floor(this.y))) {
          this.x += moveDistance;
          moved = true;
        } else {
          // Align to grid if hitting a wall
          this.x = Math.floor(this.x) + 0.5;
        }
        break;
    }

    return moved;
  }

  // Check if player can move in their current direction
  canMoveInCurrentDirection(canMoveFn: (x: number, y: number) => boolean): boolean {
    const currentX = Math.floor(this.x);
    const currentY = Math.floor(this.y);

    switch (this.direction) {
      case Direction.UP:
        return canMoveFn(currentX, currentY - 1);
      case Direction.DOWN:
        return canMoveFn(currentX, currentY + 1);
      case Direction.LEFT:
        return canMoveFn(currentX - 1, currentY);
      case Direction.RIGHT:
        return canMoveFn(currentX + 1, currentY);
      case Direction.NONE:
        return true;
      default:
        return false;
    }
  }
}
