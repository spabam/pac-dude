
import { Direction, PLAYER_SPEED, GRID_WIDTH } from '../constants/gameConstants';

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

    // Check if player is near a cell center (for turning)
    const isCentered = (axis: 'x' | 'y'): boolean => {
      const value = axis === 'x' ? this.x : this.y;
      // Even more forgiving tolerance for checking if centered on an axis
      return Math.abs(value - Math.floor(value) - 0.5) < 0.2;
    };

    // Check if at or near grid alignment point (cell center)
    const isNearCellCenter = isCentered('x') && isCentered('y');
    
    // Try to change direction based on player position
    if (isNearCellCenter) {
      // Snap precisely to cell center for accuracy
      this.x = Math.floor(this.x) + 0.5;
      this.y = Math.floor(this.y) + 0.5;
      
      // Try to apply nextDirection at cell centers
      if (nextDirection !== Direction.NONE && this.canChangeDirection(nextDirection, canMoveFn)) {
        this.direction = nextDirection;
      } 
      // If can't move in current direction, stop
      else if (this.direction !== Direction.NONE && !this.canMoveInCurrentDirection(canMoveFn)) {
        this.direction = Direction.NONE;
      }
    } 
    // Handle turning at corridor intersections
    else {
      // Allow turning when aligned with the grid on the appropriate axis
      if (nextDirection !== Direction.NONE && nextDirection !== this.direction) {
        // For horizontal turns (left/right), player should be centered on y-axis
        if ((nextDirection === Direction.LEFT || nextDirection === Direction.RIGHT) && isCentered('y')) {
          if (this.canChangeDirection(nextDirection, canMoveFn)) {
            // Snap to y-axis grid line when turning left/right
            this.y = Math.floor(this.y) + 0.5;
            this.direction = nextDirection;
          }
        }
        // For vertical turns (up/down), player should be centered on x-axis
        else if ((nextDirection === Direction.UP || nextDirection === Direction.DOWN) && isCentered('x')) {
          if (this.canChangeDirection(nextDirection, canMoveFn)) {
            // Snap to x-axis grid line when turning up/down
            this.x = Math.floor(this.x) + 0.5;
            this.direction = nextDirection;
          }
        }
      }
    }

    // If we're not moving yet, try to start moving in next direction
    if (this.direction === Direction.NONE && nextDirection !== Direction.NONE) {
      if (this.canChangeDirection(nextDirection, canMoveFn)) {
        // Snap to grid before starting movement for better alignment
        this.x = Math.floor(this.x) + 0.5;
        this.y = Math.floor(this.y) + 0.5;
        this.direction = nextDirection;
      }
    }

    // Special case for right-down corner turns - proactively check if we can turn down when going right
    // and we see a wall ahead but a passage downwards
    if (this.direction === Direction.RIGHT && nextDirection === Direction.DOWN) {
      // Check if we're approaching a wall to the right
      const rightBlocked = !canMoveFn(Math.floor(this.x + 1), Math.floor(this.y));
      const downOpen = canMoveFn(Math.floor(this.x), Math.floor(this.y + 1));
      
      if (rightBlocked && downOpen && isCentered('x')) {
        // Snap to grid and change direction to down
        this.x = Math.floor(this.x) + 0.5;
        this.direction = Direction.DOWN;
      }
    }
    
    // Special case for down-right corner turns
    if (this.direction === Direction.DOWN && nextDirection === Direction.RIGHT) {
      // Check if we're approaching a wall below
      const downBlocked = !canMoveFn(Math.floor(this.x), Math.floor(this.y + 1));
      const rightOpen = canMoveFn(Math.floor(this.x + 1), Math.floor(this.y));
      
      if (downBlocked && rightOpen && isCentered('y')) {
        // Snap to grid and change direction to right
        this.y = Math.floor(this.y) + 0.5;
        this.direction = Direction.RIGHT;
      }
    }

    // Move player based on current direction
    switch (this.direction) {
      case Direction.UP:
        // Check if we can move up using a more accurate position check
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y - moveDistance))) {
          this.y -= moveDistance;
          
          // Ensure we stay perfectly centered on the x-axis while moving vertically
          this.x = Math.floor(this.x) + 0.5;
          
          moved = true;
        } else {
          // Ensure alignment with grid when stopped
          this.y = Math.ceil(this.y) - 0.5;
          this.direction = Direction.NONE;
        }
        break;
      case Direction.DOWN:
        // Check if we can move down using a more accurate position check
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y + moveDistance))) {
          this.y += moveDistance;
          
          // Ensure we stay perfectly centered on the x-axis while moving vertically
          this.x = Math.floor(this.x) + 0.5;
          
          moved = true;
        } else {
          // Ensure alignment with grid when stopped
          this.y = Math.floor(this.y) + 0.5;
          this.direction = Direction.NONE;
        }
        break;
      case Direction.LEFT:
        // Check if we can move left using a more accurate position check
        if (canMoveFn(Math.floor(this.x - moveDistance), Math.floor(this.y))) {
          this.x -= moveDistance;
          
          // Ensure we stay perfectly centered on the y-axis while moving horizontally
          this.y = Math.floor(this.y) + 0.5;
          
          moved = true;
        } else {
          // Ensure alignment with grid when stopped
          this.x = Math.ceil(this.x) - 0.5;
          this.direction = Direction.NONE;
        }
        break;
      case Direction.RIGHT:
        // Check if we can move right using a more accurate position check
        if (canMoveFn(Math.floor(this.x + moveDistance), Math.floor(this.y))) {
          this.x += moveDistance;
          
          // Ensure we stay perfectly centered on the y-axis while moving horizontally
          this.y = Math.floor(this.y) + 0.5;
          
          moved = true;
        } else {
          // Ensure alignment with grid when stopped
          this.x = Math.floor(this.x) + 0.5;
          this.direction = Direction.NONE;
        }
        break;
    }

    // Handle tunnel wrap-around
    if (this.x < 0) {
      this.x = GRID_WIDTH - 0.5;
    } else if (this.x >= GRID_WIDTH) {
      this.x = 0.5;
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
