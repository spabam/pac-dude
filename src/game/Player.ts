
import { Direction, PLAYER_SPEED } from '../constants/gameConstants';

export class Player {
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  targetX: number | null;
  targetY: number | null;

  constructor(x: number, y: number) {
    // Ensure player starts precisely centered in a cell
    this.x = Math.floor(x) + 0.5;
    this.y = Math.floor(y) + 0.5;
    this.direction = Direction.NONE;
    this.speed = PLAYER_SPEED;
    this.targetX = null;
    this.targetY = null;
  }

  // Check if a direction is valid based on the current position
  canChangeDirection(dir: Direction, canMoveFn: (x: number, y: number) => boolean): boolean {
    const cellX = Math.floor(this.x);
    const cellY = Math.floor(this.y);

    // Calculate position after potential direction change
    switch (dir) {
      case Direction.UP:
        return canMoveFn(cellX, cellY - 1);
      case Direction.DOWN:
        return canMoveFn(cellX, cellY + 1);
      case Direction.LEFT:
        return canMoveFn(cellX - 1, cellY);
      case Direction.RIGHT:
        return canMoveFn(cellX + 1, cellY);
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

    // Check if at grid alignment point (cell center)
    const isAtCellCenter = 
      Math.abs(this.x - Math.floor(this.x) - 0.5) < 0.05 && 
      Math.abs(this.y - Math.floor(this.y) - 0.5) < 0.05;

    // At cell centers, we can change direction more reliably
    if (isAtCellCenter) {
      // Snap precisely to cell center for accuracy
      this.x = Math.floor(this.x) + 0.5;
      this.y = Math.floor(this.y) + 0.5;
      
      // Try to apply nextDirection at cell centers
      if (nextDirection !== Direction.NONE && this.canChangeDirection(nextDirection, canMoveFn)) {
        this.direction = nextDirection;
      } 
      // If we can't use nextDirection, try currentDirection as fallback
      else if (currentDirection !== Direction.NONE && 
               currentDirection !== this.direction && 
               this.canChangeDirection(currentDirection, canMoveFn)) {
        this.direction = currentDirection;
      }
    } else {
      // Between cell centers, only try changing direction if we're at the first movement
      // or we're very close to a cell center
      if (this.direction === Direction.NONE) {
        if (nextDirection !== Direction.NONE && this.canChangeDirection(nextDirection, canMoveFn)) {
          this.direction = nextDirection;
        }
      }
    }

    // Move player based on current direction
    switch (this.direction) {
      case Direction.UP:
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y - 0.1))) {
          this.y -= moveDistance;
          
          // Ensure we stay centered on the x-axis while moving vertically
          this.x = Math.floor(this.x) + 0.5;
          
          moved = true;
        } else {
          // Align to grid if hitting a wall
          this.y = Math.floor(this.y) + 0.5;
        }
        break;
      case Direction.DOWN:
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y + 1))) {
          this.y += moveDistance;
          
          // Ensure we stay centered on the x-axis while moving vertically
          this.x = Math.floor(this.x) + 0.5;
          
          moved = true;
        } else {
          // Align to grid if hitting a wall
          this.y = Math.floor(this.y) + 0.5;
        }
        break;
      case Direction.LEFT:
        if (canMoveFn(Math.floor(this.x - 0.1), Math.floor(this.y))) {
          this.x -= moveDistance;
          
          // Ensure we stay centered on the y-axis while moving horizontally
          this.y = Math.floor(this.y) + 0.5;
          
          moved = true;
        } else {
          // Align to grid if hitting a wall
          this.x = Math.floor(this.x) + 0.5;
        }
        break;
      case Direction.RIGHT:
        if (canMoveFn(Math.floor(this.x + 1), Math.floor(this.y))) {
          this.x += moveDistance;
          
          // Ensure we stay centered on the y-axis while moving horizontally
          this.y = Math.floor(this.y) + 0.5;
          
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
    const cellX = Math.floor(this.x);
    const cellY = Math.floor(this.y);

    switch (this.direction) {
      case Direction.UP:
        return canMoveFn(cellX, cellY - 1);
      case Direction.DOWN:
        return canMoveFn(cellX, cellY + 1);
      case Direction.LEFT:
        return canMoveFn(cellX - 1, cellY);
      case Direction.RIGHT:
        return canMoveFn(cellX + 1, cellY);
      case Direction.NONE:
        return true;
      default:
        return false;
    }
  }
}
