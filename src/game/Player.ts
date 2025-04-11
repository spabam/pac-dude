
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
      // More forgiving tolerance for checking if centered on an axis (increased from 0.25 to 0.3)
      return Math.abs(value - Math.floor(value) - 0.5) < 0.3;
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

    // Handle all corner turns
    this.handleAllCornerTurns(nextDirection, canMoveFn, isCentered);
    
    // Move player based on current direction - increased movement fidelity
    switch (this.direction) {
      case Direction.UP:
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y - moveDistance))) {
          this.y -= moveDistance;
          
          // Ensure player stays centered on the x-axis while moving vertically
          if (isCentered('x')) {
            this.x = Math.floor(this.x) + 0.5;
          }
          
          moved = true;
        } else {
          // Align with grid when stopped at a wall
          this.y = Math.ceil(this.y);
          this.direction = Direction.NONE;
        }
        break;
      case Direction.DOWN:
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y + moveDistance))) {
          this.y += moveDistance;
          
          // Ensure player stays centered on the x-axis while moving vertically
          if (isCentered('x')) {
            this.x = Math.floor(this.x) + 0.5;
          }
          
          moved = true;
        } else {
          // Align with grid when stopped at a wall
          this.y = Math.floor(this.y);
          this.direction = Direction.NONE;
        }
        break;
      case Direction.LEFT:
        if (canMoveFn(Math.floor(this.x - moveDistance), Math.floor(this.y))) {
          this.x -= moveDistance;
          
          // Ensure player stays centered on the y-axis while moving horizontally
          if (isCentered('y')) {
            this.y = Math.floor(this.y) + 0.5;
          }
          
          moved = true;
        } else {
          // Align with grid when stopped at a wall
          this.x = Math.ceil(this.x);
          this.direction = Direction.NONE;
        }
        break;
      case Direction.RIGHT:
        if (canMoveFn(Math.floor(this.x + moveDistance), Math.floor(this.y))) {
          this.x += moveDistance;
          
          // Ensure player stays centered on the y-axis while moving horizontally
          if (isCentered('y')) {
            this.y = Math.floor(this.y) + 0.5;
          }
          
          moved = true;
        } else {
          // Align with grid when stopped at a wall
          this.x = Math.floor(this.x);
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

  // Handle all possible corner turning cases
  private handleAllCornerTurns(
    nextDirection: Direction, 
    canMoveFn: (x: number, y: number) => boolean, 
    isCentered: (axis: 'x' | 'y') => boolean
  ): void {
    // Check for current direction and wall ahead
    const checkForWallAhead = (dir: Direction): boolean => {
      const cellX = Math.floor(this.x);
      const cellY = Math.floor(this.y);
      
      switch (dir) {
        case Direction.UP:
          return !canMoveFn(cellX, cellY - 1);
        case Direction.DOWN:
          return !canMoveFn(cellX, cellY + 1);
        case Direction.LEFT:
          return !canMoveFn(cellX - 1, cellY);
        case Direction.RIGHT:
          return !canMoveFn(cellX + 1, cellY);
        default:
          return false;
      }
    };
    
    // Check if we can turn in the requested direction
    const canTurn = (dir: Direction): boolean => {
      const cellX = Math.floor(this.x);
      const cellY = Math.floor(this.y);
      
      switch (dir) {
        case Direction.UP:
          return canMoveFn(cellX, cellY - 1);
        case Direction.DOWN:
          return canMoveFn(cellX, cellY + 1);
        case Direction.LEFT:
          return canMoveFn(cellX - 1, cellY);
        case Direction.RIGHT:
          return canMoveFn(cellX + 1, cellY);
        default:
          return false;
      }
    };
    
    // Handle horizontal to vertical turns
    if ((this.direction === Direction.RIGHT || this.direction === Direction.LEFT) && 
        (nextDirection === Direction.UP || nextDirection === Direction.DOWN)) {
      // If we're about to hit a wall and we want to turn
      if (checkForWallAhead(this.direction) && canTurn(nextDirection) && isCentered('x')) {
        this.x = Math.floor(this.x) + 0.5;
        this.direction = nextDirection;
      }
      // Normal case - we're aligned on the x-axis and want to turn
      else if (canTurn(nextDirection) && isCentered('x')) {
        this.x = Math.floor(this.x) + 0.5;
        this.direction = nextDirection;
      }
    }
    
    // Handle vertical to horizontal turns
    if ((this.direction === Direction.UP || this.direction === Direction.DOWN) && 
        (nextDirection === Direction.LEFT || nextDirection === Direction.RIGHT)) {
      // If we're about to hit a wall and we want to turn
      if (checkForWallAhead(this.direction) && canTurn(nextDirection) && isCentered('y')) {
        this.y = Math.floor(this.y) + 0.5;
        this.direction = nextDirection;
      }
      // Normal case - we're aligned on the y-axis and want to turn
      else if (canTurn(nextDirection) && isCentered('y')) {
        this.y = Math.floor(this.y) + 0.5;
        this.direction = nextDirection;
      }
    }
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
