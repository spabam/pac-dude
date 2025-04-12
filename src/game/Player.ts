import { Direction, PLAYER_SPEED } from '../constants/gameConstants';

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

    // Debug log to verify initial position
    console.log(`Player initialized at: (${this.x}, ${this.y})`);
  }

  update(deltaTime: number, currentDirection: Direction, nextDirection: Direction, canMoveFunction: (x: number, y: number) => boolean): boolean {
    // Log position before update for debugging
    console.log(`Pre-update position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)})`);
    
    let moved = false;
    
    // First, try to change direction if requested
    if (nextDirection !== Direction.NONE && nextDirection !== this.direction) {
      // Calculate grid positions for collision checks
      const currentGridX = Math.floor(this.x);
      const currentGridY = Math.floor(this.y);
      
      // Check if we're close enough to center to change direction
      const closeToHorizontalCenter = Math.abs(this.y - (currentGridY + 0.5)) < 0.1;
      const closeToVerticalCenter = Math.abs(this.x - (currentGridX + 0.5)) < 0.1;
      
      let canChangeDirection = false;
      
      if ((nextDirection === Direction.UP || nextDirection === Direction.DOWN) && closeToVerticalCenter) {
        // For vertical movement, we need to be horizontally centered
        canChangeDirection = true;
      } else if ((nextDirection === Direction.LEFT || nextDirection === Direction.RIGHT) && closeToHorizontalCenter) {
        // For horizontal movement, we need to be vertically centered
        canChangeDirection = true;
      }
      
      if (canChangeDirection) {
        // Check the target position based on the requested direction
        let nextX = currentGridX;
        let nextY = currentGridY;
        
        switch (nextDirection) {
          case Direction.UP:
            nextY -= 1;
            break;
          case Direction.DOWN:
            nextY += 1;
            break;
          case Direction.LEFT:
            nextX -= 1;
            break;
          case Direction.RIGHT:
            nextX += 1;
            break;
        }
        
        // If we can move in the requested direction, change direction
        if (canMoveFunction(nextX, nextY)) {
          this.direction = nextDirection;
          
          // Align to grid for smoother turning
          if (nextDirection === Direction.UP || nextDirection === Direction.DOWN) {
            this.x = currentGridX + 0.5;
          } else if (nextDirection === Direction.LEFT || nextDirection === Direction.RIGHT) {
            this.y = currentGridY + 0.5;
          }
          
          // Change from using enum as a string to directly logging the direction change
          console.log(`Direction changed to: ${this.getDirectionName(nextDirection)}`);
        }
      }
    }
    
    // Check if we can move in the current direction
    if (this.direction !== Direction.NONE) {
      const currentGridX = Math.floor(this.x);
      const currentGridY = Math.floor(this.y);
      
      let nextX = currentGridX;
      let nextY = currentGridY;
      
      // Calculate the next grid cell based on direction
      switch (this.direction) {
        case Direction.UP:
          if (this.y - this.speed * deltaTime < currentGridY) {
            nextY -= 1;
          }
          break;
        case Direction.DOWN:
          if (this.y + this.speed * deltaTime >= currentGridY + 1) {
            nextY += 1;
          }
          break;
        case Direction.LEFT:
          if (this.x - this.speed * deltaTime < currentGridX) {
            nextX -= 1;
          }
          break;
        case Direction.RIGHT:
          if (this.x + this.speed * deltaTime >= currentGridX + 1) {
            nextX += 1;
          }
          break;
      }
      
      // Only move if the next cell is valid
      if (canMoveFunction(nextX, nextY)) {
        const prevX = this.x;
        const prevY = this.y;
        
        // Move based on current direction
        switch (this.direction) {
          case Direction.UP:
            this.y -= this.speed * deltaTime;
            break;
          case Direction.DOWN:
            this.y += this.speed * deltaTime;
            break;
          case Direction.LEFT:
            this.x -= this.speed * deltaTime;
            break;
          case Direction.RIGHT:
            this.x += this.speed * deltaTime;
            break;
        }
        
        // Check if we've moved
        moved = prevX !== this.x || prevY !== this.y;
      } else {
        // We hit a wall, stop by perfectly aligning to the grid
        switch (this.direction) {
          case Direction.UP:
            this.y = currentGridY + 0.5;
            break;
          case Direction.DOWN:
            this.y = currentGridY + 0.5;
            break;
          case Direction.LEFT:
            this.x = currentGridX + 0.5;
            break;
          case Direction.RIGHT:
            this.x = currentGridX + 0.5;
            break;
        }
        this.direction = Direction.NONE;
      }
    }
    
    // Try to center the player in the corridor when moving
    this.centerInCorridor();
    
    // Handle warping (teleportation from one side to another)
    this.handleWarping();
    
    // Log final position and movement status using helper method instead of enum as string
    console.log(`Position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)}), Direction: ${this.getDirectionName(this.direction)}, Moved: ${moved}`);
    
    return moved;
  }
  
  centerInCorridor() {
    // If moving horizontally, align to the center of the lane vertically
    if (this.direction === Direction.LEFT || this.direction === Direction.RIGHT) {
      const targetY = Math.floor(this.y) + 0.5;
      // Apply a small correction to align with the center of the corridor
      if (Math.abs(this.y - targetY) < 0.1) {
        this.y = targetY;
      } else if (this.y < targetY) {
        this.y += 0.01; // Gently nudge up
      } else if (this.y > targetY) {
        this.y -= 0.01; // Gently nudge down
      }
    }
    
    // If moving vertically, align to the center of the lane horizontally
    if (this.direction === Direction.UP || this.direction === Direction.DOWN) {
      const targetX = Math.floor(this.x) + 0.5;
      // Apply a small correction to align with the center of the corridor
      if (Math.abs(this.x - targetX) < 0.1) {
        this.x = targetX;
      } else if (this.x < targetX) {
        this.x += 0.01; // Gently nudge right
      } else if (this.x > targetX) {
        this.x -= 0.01; // Gently nudge left
      }
    }
  }
  
  handleWarping() {
    // Wrap around the screen (teleport from one side to another)
    if (this.x < 0) {
      this.x = 28; // Assuming grid width is 28
    } else if (this.x >= 28) {
      this.x = 0;
    }
  }
  
  // Helper method to get direction name as a string
  private getDirectionName(dir: Direction): string {
    switch (dir) {
      case Direction.NONE:
        return "NONE";
      case Direction.UP:
        return "UP";
      case Direction.DOWN:
        return "DOWN";
      case Direction.LEFT:
        return "LEFT";
      case Direction.RIGHT:
        return "RIGHT";
      default:
        return "UNKNOWN";
    }
  }
}
