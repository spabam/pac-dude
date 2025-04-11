
import { Direction, PLAYER_SPEED } from '../constants/gameConstants';

export class Player {
  x: number;
  y: number;
  direction: Direction;
  speed: number;
  targetX: number | null;
  targetY: number | null;

  constructor(x: number, y: number) {
    // Ensure player starts perfectly centered in a cell, slightly lower
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
      const testX = Math.floor(this.x);
      const testY = Math.floor(this.y);
      
      // Check the target position based on the requested direction
      let nextX = testX;
      let nextY = testY;
      
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
          this.x = Math.floor(this.x) + 0.5;
        } else if (nextDirection === Direction.LEFT || nextDirection === Direction.RIGHT) {
          this.y = Math.floor(this.y) + 0.5;
        }
      }
    }
    
    // Check if we can move in the current direction
    if (this.direction !== Direction.NONE) {
      let nextX = Math.floor(this.x);
      let nextY = Math.floor(this.y);
      
      switch (this.direction) {
        case Direction.UP:
          if (this.y - this.speed * deltaTime < Math.floor(this.y)) {
            nextY -= 1;
          }
          break;
        case Direction.DOWN:
          if (this.y + this.speed * deltaTime >= Math.floor(this.y) + 1) {
            nextY += 1;
          }
          break;
        case Direction.LEFT:
          if (this.x - this.speed * deltaTime < Math.floor(this.x)) {
            nextX -= 1;
          }
          break;
        case Direction.RIGHT:
          if (this.x + this.speed * deltaTime >= Math.floor(this.x) + 1) {
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
        // We hit a wall, stop moving in this direction
        this.direction = Direction.NONE;
      }
    }
    
    // Try to center the player in the corridor when moving
    this.centerInCorridor();
    
    // Handle warping (teleportation from one side to another)
    this.handleWarping();
    
    // Log final position and movement status
    console.log(`Position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)}), Direction: ${Direction[this.direction]}, Moved: ${moved}`);
    
    return moved;
  }
  
  centerInCorridor() {
    // If moving horizontally, align to the center of the lane vertically
    if (this.direction === Direction.LEFT || this.direction === Direction.RIGHT) {
      const targetY = Math.floor(this.y) + 0.5;
      // Apply a small correction to align with the center of the corridor
      if (Math.abs(this.y - targetY) < 0.1) {
        this.y = targetY;
      }
    }
    
    // If moving vertically, align to the center of the lane horizontally
    if (this.direction === Direction.UP || this.direction === Direction.DOWN) {
      const targetX = Math.floor(this.x) + 0.5;
      // Apply a small correction to align with the center of the corridor
      if (Math.abs(this.x - targetX) < 0.1) {
        this.x = targetX;
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
}
