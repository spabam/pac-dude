
import { Direction, PLAYER_SPEED, GRID_WIDTH } from '../constants/gameConstants';

export class Player {
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  targetX: number | null;
  targetY: number | null;

  constructor(x: number, y: number) {
    // Ensure player starts perfectly centered in a cell
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

    // More forgiving tolerance for checking if centered on an axis
    // Increased from 0.4 to 0.45 to make turning easier
    const isCentered = (axis: 'x' | 'y'): boolean => {
      const value = axis === 'x' ? this.x : this.y;
      return Math.abs(value - Math.floor(value) - 0.5) < 0.45;
    };

    // Always try to apply the next direction first if possible
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

    // If at a cell center, check and adjust direction
    if (isCentered('x') && isCentered('y')) {
      // Snap precisely to cell center for accuracy
      this.x = Math.floor(this.x) + 0.5;
      this.y = Math.floor(this.y) + 0.5;
      
      // Try to apply nextDirection at cell centers
      if (nextDirection !== Direction.NONE && this.canChangeDirection(nextDirection, canMoveFn)) {
        this.direction = nextDirection;
      } 
      // If we can't move in current direction, stop
      else if (this.direction !== Direction.NONE && !this.canMoveInCurrentDirection(canMoveFn)) {
        this.direction = Direction.NONE;
      }
    }
    
    // Handle wall corner cases (special turning cases near walls)
    this.handleWallCornerTurns(nextDirection, canMoveFn);
    
    // If we're not already moving, try to start moving in next direction
    if (this.direction === Direction.NONE && nextDirection !== Direction.NONE) {
      if (this.canChangeDirection(nextDirection, canMoveFn)) {
        // Force snap to grid center before starting movement
        this.x = Math.floor(this.x) + 0.5;
        this.y = Math.floor(this.y) + 0.5;
        this.direction = nextDirection;
      }
    }
    
    // Move player based on current direction with improved centering
    switch (this.direction) {
      case Direction.UP:
        if (canMoveFn(Math.floor(this.x), Math.floor(this.y - moveDistance))) {
          this.y -= moveDistance;
          
          // Stronger center snapping on X axis while moving vertically
          if (Math.abs(this.x - Math.floor(this.x) - 0.5) < 0.1) {
            this.x = Math.floor(this.x) + 0.5; // Perfect centering
          }
          // Aggressive gradual centering - pull toward center while moving
          else if (this.x > Math.floor(this.x) + 0.5) {
            this.x = Math.max(this.x - 0.1, Math.floor(this.x) + 0.5);
          } else if (this.x < Math.floor(this.x) + 0.5) {
            this.x = Math.min(this.x + 0.1, Math.floor(this.x) + 0.5);
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
          
          // Stronger center snapping on X axis while moving vertically
          if (Math.abs(this.x - Math.floor(this.x) - 0.5) < 0.1) {
            this.x = Math.floor(this.x) + 0.5; // Perfect centering
          }
          // Aggressive gradual centering - pull toward center while moving
          else if (this.x > Math.floor(this.x) + 0.5) {
            this.x = Math.max(this.x - 0.1, Math.floor(this.x) + 0.5);
          } else if (this.x < Math.floor(this.x) + 0.5) {
            this.x = Math.min(this.x + 0.1, Math.floor(this.x) + 0.5);
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
          
          // Stronger center snapping on Y axis while moving horizontally
          if (Math.abs(this.y - Math.floor(this.y) - 0.5) < 0.1) {
            this.y = Math.floor(this.y) + 0.5; // Perfect centering
          }
          // Aggressive gradual centering - pull toward center while moving
          else if (this.y > Math.floor(this.y) + 0.5) {
            this.y = Math.max(this.y - 0.1, Math.floor(this.y) + 0.5);
          } else if (this.y < Math.floor(this.y) + 0.5) {
            this.y = Math.min(this.y + 0.1, Math.floor(this.y) + 0.5);
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
          
          // Stronger center snapping on Y axis while moving horizontally
          if (Math.abs(this.y - Math.floor(this.y) - 0.5) < 0.1) {
            this.y = Math.floor(this.y) + 0.5; // Perfect centering
          }
          // Aggressive gradual centering - pull toward center while moving
          else if (this.y > Math.floor(this.y) + 0.5) {
            this.y = Math.max(this.y - 0.1, Math.floor(this.y) + 0.5);
          } else if (this.y < Math.floor(this.y) + 0.5) {
            this.y = Math.min(this.y + 0.1, Math.floor(this.y) + 0.5);
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

  // Enhanced wall corner turn handling for better responsiveness
  private handleWallCornerTurns(
    nextDirection: Direction, 
    canMoveFn: (x: number, y: number) => boolean
  ): void {
    if (nextDirection === Direction.NONE) return;
    
    const cellX = Math.floor(this.x);
    const cellY = Math.floor(this.y);
    
    // Special case: at a wall corner and want to turn
    const hasWallAhead = (): boolean => {
      switch (this.direction) {
        case Direction.UP: return !canMoveFn(cellX, cellY - 1);
        case Direction.DOWN: return !canMoveFn(cellX, cellY + 1);
        case Direction.LEFT: return !canMoveFn(cellX - 1, cellY);
        case Direction.RIGHT: return !canMoveFn(cellX + 1, cellY);
        default: return false;
      }
    };
    
    const canTurn = (dir: Direction): boolean => {
      switch (dir) {
        case Direction.UP: return canMoveFn(cellX, cellY - 1);
        case Direction.DOWN: return canMoveFn(cellX, cellY + 1);
        case Direction.LEFT: return canMoveFn(cellX - 1, cellY);
        case Direction.RIGHT: return canMoveFn(cellX + 1, cellY);
        default: return false;
      }
    };
    
    // More aggressive wall corner detection
    if ((hasWallAhead() || this.direction === Direction.NONE) && nextDirection !== this.direction) {
      if (canTurn(nextDirection)) {
        // When turning from horizontal to vertical movement
        if ((this.direction === Direction.LEFT || this.direction === Direction.RIGHT) && 
            (nextDirection === Direction.UP || nextDirection === Direction.DOWN)) {
          // Snap to center of cell x-axis
          this.x = Math.floor(this.x) + 0.5;
          this.direction = nextDirection;
        }
        // When turning from vertical to horizontal movement
        else if ((this.direction === Direction.UP || this.direction === Direction.DOWN) && 
                (nextDirection === Direction.LEFT || nextDirection === Direction.RIGHT)) {
          // Snap to center of cell y-axis
          this.y = Math.floor(this.y) + 0.5;
          this.direction = nextDirection;
        }
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
