
import { 
  Direction, 
  GhostType, 
  GhostState,
  CellType,
  GHOST_SPEED,
  GHOST_FRIGHTENED_SPEED,
  GHOST_TUNNEL_SPEED,
  GHOST_RANDOM_DIRECTION_CHANGE,
  GHOST_HOUSE_TIME
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
  lastRandomDirectionChange: number;
  readyToLeave: boolean;
  respawnTimer: number | null;

  constructor(type: GhostType, x: number, y: number) {
    this.type = type;
    this.x = Math.floor(x) + 0.5; // Ensure ghost starts centered in cell
    this.y = Math.floor(y) + 0.5;
    this.direction = this.getInitialDirection(type);
    
    // Set all ghosts to CHASE state initially for better movement
    this.state = GhostState.CHASE;
    
    this.speed = GHOST_SPEED;
    this.targetX = 0;
    this.targetY = 0;
    this.homeX = x;
    this.homeY = y;
    this.lastRandomDirectionChange = 0;
    this.readyToLeave = true; // Start ghosts ready to leave
    this.respawnTimer = null;
    
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
  
  getInitialDirection(type: GhostType): Direction {
    // Different initial directions for different ghosts
    switch (type) {
      case GhostType.BLINKY: return Direction.LEFT;
      case GhostType.PINKY: return Direction.DOWN;
      case GhostType.INKY: return Direction.UP;
      case GhostType.CLYDE: return Direction.RIGHT;
      default: return Direction.UP;
    }
  }
  
  // Update ghost state and movement
  update(
    deltaTime: number, 
    grid: number[][], 
    playerPos: Position,
    powerMode: boolean,
    currentTime: number = Date.now()
  ) {
    // Check if ghost is respawning from being eaten
    if (this.state === GhostState.EATEN && this.respawnTimer !== null) {
      if (currentTime >= this.respawnTimer) {
        // Ghost has waited long enough, allow it to leave the house
        this.respawnTimer = null;
        this.state = powerMode ? GhostState.FRIGHTENED : GhostState.CHASE;
        this.readyToLeave = true;
      }
    }
    
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
    
    // Only change direction at grid intersections or when random timer expires for RANDOM state
    const isAtIntersection = 
      Math.abs(this.x - Math.floor(this.x) - 0.5) < 0.1 && 
      Math.abs(this.y - Math.floor(this.y) - 0.5) < 0.1;
    
    const shouldChangeRandomDirection = 
      this.state === GhostState.RANDOM && 
      (currentTime - this.lastRandomDirectionChange) > GHOST_RANDOM_DIRECTION_CHANGE;
      
    // Check if ghost is in the ghost house
    const isInGhostHouse = 
      Math.floor(this.y) >= 13 && Math.floor(this.y) <= 15 &&
      Math.floor(this.x) >= 11 && Math.floor(this.x) <= 16;
    
    // Handle ghost house exit logic
    if (isInGhostHouse && this.readyToLeave) {
      // Debug ghost house movement
      console.log(`Ghost ${this.type} in ghost house at (${this.x}, ${this.y}), ready to leave`);
      
      // First move to (14, 14) which is the center of the ghost house
      if (Math.floor(this.y) > 13 && Math.abs(Math.floor(this.x) - 14) > 0) {
        const centerDirection = this.getDirectionToTarget(
          Math.floor(this.x),
          Math.floor(this.y),
          14,
          14,
          grid,
          true // Can pass through ghost house door
        );
        
        console.log(`Ghost ${this.type} moving to center with direction: ${centerDirection}`);
        this.direction = centerDirection;
      }
      // Then move up to the door at (14, 13)
      else if (Math.floor(this.y) > 13 || (Math.floor(this.y) === 13 && Math.floor(this.x) !== 14)) {
        // Move towards the ghost door at (14, 13)
        const doorDirection = this.getDirectionToTarget(
          Math.floor(this.x),
          Math.floor(this.y),
          14,
          13,
          grid,
          true // Can pass through ghost house door
        );
        
        console.log(`Ghost ${this.type} moving towards door with direction: ${doorDirection}`);
        this.direction = doorDirection;
      } 
      // When at the door position, force move up
      else if (Math.floor(this.y) === 13 && Math.floor(this.x) === 14) {
        // At the door, force move up to exit
        console.log(`Ghost ${this.type} at door, forcing UP direction`);
        this.direction = Direction.UP;
      }
    }
    else if (isAtIntersection || shouldChangeRandomDirection) {
      // If at intersection, snap to grid center for precision
      if (isAtIntersection) {
        this.x = Math.floor(this.x) + 0.5;
        this.y = Math.floor(this.y) + 0.5;
      }
      
      // Eaten ghosts should return to the ghost house
      if (this.state === GhostState.EATEN) {
        if (Math.abs(this.x - this.homeX) < 0.5 && Math.abs(this.y - this.homeY) < 0.5) {
          // Ghost has reached home, start respawn timer
          if (this.respawnTimer === null) {
            this.respawnTimer = currentTime + GHOST_HOUSE_TIME;
          }
          this.x = this.homeX;
          this.y = this.homeY;
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
        if (this.state === GhostState.RANDOM && (isAtIntersection || shouldChangeRandomDirection)) {
          this.direction = this.chooseRandomDirection(grid);
          this.lastRandomDirectionChange = currentTime;
        } else {
          this.direction = this.chooseNextDirection(grid);
        }
      }
    }
    
    // Check if we can move in the current direction
    let nextX = Math.floor(this.x);
    let nextY = Math.floor(this.y);
    
    switch (this.direction) {
      case Direction.UP:
        if (this.y - moveDistance < Math.floor(this.y)) {
          nextY -= 1;
        }
        break;
      case Direction.DOWN:
        if (this.y + moveDistance >= Math.floor(this.y) + 1) {
          nextY += 1;
        }
        break;
      case Direction.LEFT:
        if (this.x - moveDistance < Math.floor(this.x)) {
          nextX -= 1;
        }
        break;
      case Direction.RIGHT:
        if (this.x + moveDistance >= Math.floor(this.x) + 1) {
          nextX += 1;
        }
        break;
    }
    
    // Determine if the ghost can pass through ghost doors
    // Allow passing through ghost doors when:
    // 1. Ghost is eaten and returning home
    // 2. Ghost is ready to leave the ghost house
    // 3. Ghost is currently in the ghost house
    const canPassGhostDoor = this.state === GhostState.EATEN || 
                            this.readyToLeave || 
                            isInGhostHouse;
    
    // Debug movement
    console.log(`Ghost ${this.type} at (${this.x}, ${this.y}), trying to move to (${nextX}, ${nextY}), canPassDoor: ${canPassGhostDoor}`);
    
    // Check if the next cell is valid
    if (this.isValidMove(nextX, nextY, grid, canPassGhostDoor)) {
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
      
      // Special case: If the ghost just moved through the door cell up to position (14, 12)
      // Ensure it doesn't get stuck at the doorway by making sure it continues moving
      if (Math.floor(this.x) === 14 && Math.floor(this.y) === 12 && 
          this.direction === Direction.UP && 
          Math.abs(this.y - 12.5) < 0.2) {
        console.log(`Ghost ${this.type} just passed door, continuing up`);
        this.y = Math.floor(this.y) + 0.4; // Push it a bit more up
      }
      
      // Once ghost moves out of ghost house area, it can't pass ghost doors anymore
      // unless it's in EATEN state
      if (!isInGhostHouse && 
          grid[Math.floor(this.y)] && 
          grid[Math.floor(this.y)][Math.floor(this.x)] !== CellType.GHOST_DOOR) {
        if (this.state !== GhostState.EATEN) {
          this.readyToLeave = false;
        }
      }
    } else if (isAtIntersection) {
      // We hit a wall at an intersection, choose a new direction
      if (this.state === GhostState.RANDOM) {
        this.direction = this.chooseRandomDirection(grid);
      } else {
        this.direction = this.chooseNextDirection(grid);
      }
    }
    
    // Handle warping (teleporting from one side to another)
    if (this.x < 0) {
      this.x = 28; // Assuming grid width is 28
    } else if (this.x >= 28) {
      this.x = 0;
    }
  }
  
  // Choose a random direction from available directions
  chooseRandomDirection(grid: number[][]): Direction {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    
    // Get available directions (excluding the opposite of current direction)
    const oppositeDirection = this.getOppositeDirection(this.direction);
    const availableDirections: Direction[] = [];
    
    if (this.isValidMove(x, y - 1, grid, this.readyToLeave) && this.direction !== Direction.DOWN) {
      availableDirections.push(Direction.UP);
    }
    
    if (this.isValidMove(x, y + 1, grid, this.readyToLeave) && this.direction !== Direction.UP) {
      availableDirections.push(Direction.DOWN);
    }
    
    if (this.isValidMove(x - 1, y, grid, this.readyToLeave) && this.direction !== Direction.RIGHT) {
      availableDirections.push(Direction.LEFT);
    }
    
    if (this.isValidMove(x + 1, y, grid, this.readyToLeave) && this.direction !== Direction.LEFT) {
      availableDirections.push(Direction.RIGHT);
    }
    
    // If no valid directions other than going back, allow reverse direction
    if (availableDirections.length === 0) {
      availableDirections.push(oppositeDirection);
    }
    
    // Return random direction from available options
    return availableDirections[Math.floor(Math.random() * availableDirections.length)];
  }
  
  // Choose the next direction based on available paths and target
  chooseNextDirection(grid: number[][]): Direction {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    
    // Ghosts cannot reverse direction (except when frightened)
    const oppositeDirection = this.getOppositeDirection(this.direction);
    
    // Get available directions
    const availableDirections: Direction[] = [];
    
    if (this.isValidMove(x, y - 1, grid, this.state === GhostState.EATEN || this.readyToLeave)) {
      if (this.direction !== Direction.DOWN) {
        availableDirections.push(Direction.UP);
      }
    }
    
    if (this.isValidMove(x, y + 1, grid, this.state === GhostState.EATEN || this.readyToLeave)) {
      if (this.direction !== Direction.UP) {
        availableDirections.push(Direction.DOWN);
      }
    }
    
    if (this.isValidMove(x - 1, y, grid, this.state === GhostState.EATEN || this.readyToLeave)) {
      if (this.direction !== Direction.RIGHT) {
        availableDirections.push(Direction.LEFT);
      }
    }
    
    if (this.isValidMove(x + 1, y, grid, this.state === GhostState.EATEN || this.readyToLeave)) {
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
      this.state === GhostState.EATEN || this.readyToLeave
    );
  }
  
  // Check if a move is valid
  isValidMove(x: number, y: number, grid: number[][], canPassGhostDoor: boolean): boolean {
    // Check grid bounds
    if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) {
      return false;
    }
    
    const cell = grid[y][x];
    
    // Ghost can pass through ghost door only if returning home or initially leaving
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
    
    // If frightened or random, no specific target (movement is random)
    if (this.state === GhostState.FRIGHTENED || this.state === GhostState.RANDOM) {
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
    
    // If ghost was eaten, reset respawn timer
    if (state === GhostState.EATEN) {
      this.respawnTimer = null;
    }
    
    // Update speed based on state
    switch (state) {
      case GhostState.FRIGHTENED:
        this.speed = GHOST_FRIGHTENED_SPEED;
        break;
      case GhostState.EATEN:
        this.speed = GHOST_SPEED * 1.5;
        break;
      case GhostState.RANDOM:
        this.speed = GHOST_SPEED * 0.8; // Random ghosts move a bit slower
        break;
      default:
        this.speed = GHOST_SPEED;
        break;
    }
  }
}
