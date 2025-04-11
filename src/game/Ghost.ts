
import { 
  Direction, 
  GhostType, 
  GhostState,
  CellType,
  GHOST_SPEED,
  GHOST_FRIGHTENED_SPEED,
  GHOST_TUNNEL_SPEED
} from '../constants/gameConstants';

interface Position {
  x: number;
  y: number;
}

export class Ghost {
  type: GhostType;
  x: number;
  y: number;
  direction: Direction;
  state: GhostState;
  speed: number;
  targetX: number;
  targetY: number;
  scatterTargetX: number;
  scatterTargetY: number;
  homeX: number;
  homeY: number;

  constructor(type: GhostType, x: number, y: number) {
    this.type = type;
    this.x = Math.floor(x) + 0.5; // Ensure ghost starts centered in cell
    this.y = Math.floor(y) + 0.5;
    this.direction = Direction.UP;
    this.state = GhostState.CHASE; // Start in chase mode to immediately pursue player
    this.speed = GHOST_SPEED;
    this.targetX = 0;
    this.targetY = 0;
    this.homeX = x;
    this.homeY = y;
    
    // Set scatter targets based on ghost type (corners of the map)
    switch (type) {
      case GhostType.BLINKY:
        this.scatterTargetX = 27;
        this.scatterTargetY = 0;
        break;
      case GhostType.PINKY:
        this.scatterTargetX = 0;
        this.scatterTargetY = 0;
        break;
      case GhostType.INKY:
        this.scatterTargetX = 27;
        this.scatterTargetY = 30;
        break;
      case GhostType.CLYDE:
        this.scatterTargetX = 0;
        this.scatterTargetY = 30;
        break;
    }
  }
  
  // Update ghost state and movement
  update(
    deltaTime: number, 
    grid: number[][], 
    playerPos: Position,
    powerMode: boolean
  ) {
    // Update ghost target based on state and type
    this.updateTarget(playerPos);
    
    // Calculate how far to move based on speed and time
    let moveSpeed = this.speed;
    
    // Adjust speed based on state
    if (this.state === GhostState.FRIGHTENED) {
      moveSpeed = GHOST_FRIGHTENED_SPEED;
    } else if (this.state === GhostState.EATEN) {
      moveSpeed = GHOST_SPEED * 1.5; // Eaten ghosts move faster to get home
    }
    
    // Check if ghost is in tunnel (outer edges of the map)
    if ((this.y === 14) && (this.x < 5 || this.x > 22)) {
      moveSpeed = GHOST_TUNNEL_SPEED;
    }
    
    const moveDistance = moveSpeed * deltaTime;
    
    // Only change direction at grid intersections
    const isAtIntersection = 
      Math.abs(this.x - Math.floor(this.x) - 0.5) < 0.1 && 
      Math.abs(this.y - Math.floor(this.y) - 0.5) < 0.1;
    
    if (isAtIntersection) {
      // Snap to grid center for precision
      this.x = Math.floor(this.x) + 0.5;
      this.y = Math.floor(this.y) + 0.5;
      
      // Eaten ghosts should return to the ghost house
      if (this.state === GhostState.EATEN) {
        if (Math.abs(this.x - this.homeX) < 0.5 && Math.abs(this.y - this.homeY) < 0.5) {
          // Ghost has reached home, restore normal state
          this.setState(powerMode ? GhostState.FRIGHTENED : GhostState.CHASE);
        } else {
          // Move towards home
          this.direction = this.getDirectionToTarget(
            Math.floor(this.x), 
            Math.floor(this.y), 
            this.homeX, 
            this.homeY, 
            grid,
            true // Can pass through ghost house door
          );
        }
      } else {
        // Normal movement based on current state
        this.direction = this.chooseNextDirection(grid);
      }
    }
    
    // Move ghost based on current direction
    switch (this.direction) {
      case Direction.UP:
        this.y -= moveDistance;
        break;
      case Direction.DOWN:
        this.y += moveDistance;
        break;
      case Direction.LEFT:
        this.x -= moveDistance;
        break;
      case Direction.RIGHT:
        this.x += moveDistance;
        break;
    }
  }
  
  // Choose the next direction based on available paths and target
  chooseNextDirection(grid: number[][]): Direction {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    
    // Ghosts cannot reverse direction (except when frightened)
    const oppositeDirection = this.getOppositeDirection(this.direction);
    
    // Get available directions
    const availableDirections: Direction[] = [];
    
    if (this.isValidMove(x, y - 1, grid, this.state === GhostState.EATEN)) {
      if (this.direction !== Direction.DOWN) {
        availableDirections.push(Direction.UP);
      }
    }
    
    if (this.isValidMove(x, y + 1, grid, this.state === GhostState.EATEN)) {
      if (this.direction !== Direction.UP) {
        availableDirections.push(Direction.DOWN);
      }
    }
    
    if (this.isValidMove(x - 1, y, grid, this.state === GhostState.EATEN)) {
      if (this.direction !== Direction.RIGHT) {
        availableDirections.push(Direction.LEFT);
      }
    }
    
    if (this.isValidMove(x + 1, y, grid, this.state === GhostState.EATEN)) {
      if (this.direction !== Direction.LEFT) {
        availableDirections.push(Direction.RIGHT);
      }
    }
    
    // If no valid directions, allow reverse as a last resort
    if (availableDirections.length === 0) {
      return oppositeDirection;
    }
    
    // If ghost is frightened, choose a random direction
    if (this.state === GhostState.FRIGHTENED) {
      return availableDirections[Math.floor(Math.random() * availableDirections.length)];
    }
    
    // Otherwise, choose direction that gets closest to target
    return this.getDirectionToTarget(
      x, 
      y, 
      this.targetX, 
      this.targetY, 
      grid,
      this.state === GhostState.EATEN
    );
  }
  
  // Check if a move is valid
  isValidMove(x: number, y: number, grid: number[][], canPassGhostDoor: boolean): boolean {
    // Check grid bounds
    if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) {
      return false;
    }
    
    const cell = grid[y][x];
    
    // Ghost can pass through ghost door only if returning home
    if (cell === CellType.GHOST_DOOR && !canPassGhostDoor) {
      return false;
    }
    
    // Cannot pass through walls
    return cell !== CellType.WALL;
  }
  
  // Get opposite direction
  getOppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case Direction.UP:
        return Direction.DOWN;
      case Direction.DOWN:
        return Direction.UP;
      case Direction.LEFT:
        return Direction.RIGHT;
      case Direction.RIGHT:
        return Direction.LEFT;
      default:
        return Direction.NONE;
    }
  }
  
  // Calculate best direction to reach target
  getDirectionToTarget(
    x: number, 
    y: number, 
    targetX: number, 
    targetY: number, 
    grid: number[][],
    canPassGhostDoor: boolean
  ): Direction {
    const directions: Direction[] = [
      Direction.UP,
      Direction.DOWN,
      Direction.LEFT,
      Direction.RIGHT
    ];
    
    // Filter out invalid moves and the opposite of current direction
    const validDirections = directions.filter(dir => {
      if (dir === this.getOppositeDirection(this.direction)) {
        return false;
      }
      
      switch (dir) {
        case Direction.UP:
          return this.isValidMove(x, y - 1, grid, canPassGhostDoor);
        case Direction.DOWN:
          return this.isValidMove(x, y + 1, grid, canPassGhostDoor);
        case Direction.LEFT:
          return this.isValidMove(x - 1, y, grid, canPassGhostDoor);
        case Direction.RIGHT:
          return this.isValidMove(x + 1, y, grid, canPassGhostDoor);
        default:
          return false;
      }
    });
    
    if (validDirections.length === 0) {
      // If no valid directions, reverse direction
      return this.getOppositeDirection(this.direction);
    }
    
    // Calculate distances for each valid direction
    const distances = validDirections.map(dir => {
      let nextX = x;
      let nextY = y;
      
      switch (dir) {
        case Direction.UP:
          nextY--;
          break;
        case Direction.DOWN:
          nextY++;
          break;
        case Direction.LEFT:
          nextX--;
          break;
        case Direction.RIGHT:
          nextX++;
          break;
      }
      
      // Calculate Euclidean distance
      const dx = nextX - targetX;
      const dy = nextY - targetY;
      return {
        direction: dir,
        distance: Math.sqrt(dx * dx + dy * dy)
      };
    });
    
    // Sort by distance (ascending)
    distances.sort((a, b) => a.distance - b.distance);
    
    // Return direction with shortest distance
    return distances[0].direction;
  }
  
  // Update target based on ghost type and state
  updateTarget(playerPos: Position) {
    // If eaten, target is the ghost house
    if (this.state === GhostState.EATEN) {
      this.targetX = this.homeX;
      this.targetY = this.homeY;
      return;
    }
    
    // If scatter mode, target is the designated corner
    if (this.state === GhostState.SCATTER) {
      this.targetX = this.scatterTargetX;
      this.targetY = this.scatterTargetY;
      return;
    }
    
    // If frightened, no specific target (movement is random)
    if (this.state === GhostState.FRIGHTENED) {
      return;
    }
    
    // Otherwise, chase mode target depends on ghost type
    switch (this.type) {
      case GhostType.BLINKY:
        // Blinky directly targets the player
        this.targetX = playerPos.x;
        this.targetY = playerPos.y;
        break;
        
      case GhostType.PINKY:
        // Pinky targets 4 tiles ahead of the player's direction
        let offsetX = playerPos.x;
        let offsetY = playerPos.y;
        
        // Calculate offset based on player direction
        // In the original game, there was a bug where UP direction would also
        // apply an offset to the left, we're recreating that bug here
        switch (this.direction) {
          case Direction.UP:
            offsetX -= 4; // The -4 here is the famous Pac-Man bug
            offsetY -= 4;
            break;
          case Direction.DOWN:
            offsetY += 4;
            break;
          case Direction.LEFT:
            offsetX -= 4;
            break;
          case Direction.RIGHT:
            offsetX += 4;
            break;
        }
        
        this.targetX = offsetX;
        this.targetY = offsetY;
        break;
        
      case GhostType.INKY:
        // Inky has a complex targeting mechanism
        // First, get the position 2 tiles ahead of the player
        let intermediateX = playerPos.x;
        let intermediateY = playerPos.y;
        
        switch (this.direction) {
          case Direction.UP:
            intermediateX -= 2; // Recreating the bug
            intermediateY -= 2;
            break;
          case Direction.DOWN:
            intermediateY += 2;
            break;
          case Direction.LEFT:
            intermediateX -= 2;
            break;
          case Direction.RIGHT:
            intermediateX += 2;
            break;
        }
        
        // Now, calculate the vector from Blinky to this position and double it
        // Assume Blinky is always at its starting position for simplicity
        const blinkyX = 14;
        const blinkyY = 11;
        
        this.targetX = intermediateX + (intermediateX - blinkyX);
        this.targetY = intermediateY + (intermediateY - blinkyY);
        break;
        
      case GhostType.CLYDE:
        // Clyde targets the player directly if far away, 
        // but targets his scatter corner if close
        const dx = this.x - playerPos.x;
        const dy = this.y - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 8) {
          // If far from player, chase directly
          this.targetX = playerPos.x;
          this.targetY = playerPos.y;
        } else {
          // If close to player, go to scatter target
          this.targetX = this.scatterTargetX;
          this.targetY = this.scatterTargetY;
        }
        break;
    }
  }
  
  // Set ghost state
  setState(state: GhostState) {
    this.state = state;
    
    // Update speed based on state
    switch (state) {
      case GhostState.FRIGHTENED:
        this.speed = GHOST_FRIGHTENED_SPEED;
        break;
      case GhostState.EATEN:
        this.speed = GHOST_SPEED * 1.5;
        break;
      default:
        this.speed = GHOST_SPEED;
        break;
    }
  }
}
