
import React, { useRef, useEffect, useState } from 'react';
import { 
  GRID_WIDTH, 
  GRID_HEIGHT, 
  CELL_SIZE,
  GameState,
  Direction,
  CellType,
  GhostType,
  GhostState,
  DOT_POINTS,
  POWER_PELLET_POINTS,
  GHOST_POINTS,
  GHOST_COMBO_MULTIPLIER,
  POWER_PELLET_DURATION,
  GHOST_FLASH_DURATION,
  PLAYER_START_X,
  PLAYER_START_Y
} from '../constants/gameConstants';
import { mazeLayout, TOTAL_DOTS } from '../data/mazeLayout';
import { useGameLoop } from '../hooks/useGameLoop';
import { Player } from '../game/Player';
import { Ghost } from '../game/Ghost';
import { useIsMobile } from '../hooks/use-mobile';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [level, setLevel] = useState<number>(1);
  const [dotsEaten, setDotsEaten] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const isMobile = useIsMobile();
  
  // Game objects
  const player = useRef(new Player(PLAYER_START_X, PLAYER_START_Y));
  const ghosts = useRef([
    new Ghost(GhostType.BLINKY, 14, 11),
    new Ghost(GhostType.PINKY, 14, 14),
    new Ghost(GhostType.INKY, 12, 14),
    new Ghost(GhostType.CLYDE, 16, 14)
  ]);
  
  // Game state
  const gameBoard = useRef<number[][]>(JSON.parse(JSON.stringify(mazeLayout)));
  const powerMode = useRef<boolean>(false);
  const powerModeTimer = useRef<number | null>(null);
  const ghostCombo = useRef<number>(1);
  const lastDirection = useRef<Direction>(Direction.NONE);
  const nextDirection = useRef<Direction>(Direction.NONE);
  
  // Initialize game state
  useEffect(() => {
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('pacmanHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);
  
  // Save high score when it changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('pacmanHighScore', score.toString());
    }
  }, [score, highScore]);
  
  // Prevent arrow keys from scrolling the page
  useEffect(() => {
    const preventDefaultForArrowKeys = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', preventDefaultForArrowKeys);
    return () => {
      window.removeEventListener('keydown', preventDefaultForArrowKeys);
    };
  }, []);
  
  // Handle keyboard input - modified to use WASD keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
          nextDirection.current = Direction.UP;
          break;
        case 's':
          nextDirection.current = Direction.DOWN;
          break;
        case 'a':
          nextDirection.current = Direction.LEFT;
          break;
        case 'd':
          nextDirection.current = Direction.RIGHT;
          break;
        case ' ':
          // Space to start game or pause
          if (gameState === GameState.MENU || gameState === GameState.GAME_OVER) {
            resetGame();
          } else if (gameState === GameState.PLAYING) {
            setGameState(GameState.PAUSE);
          } else if (gameState === GameState.PAUSE) {
            setGameState(GameState.PLAYING);
          }
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);
  
  // Handle touch controls
  const handleTouchStart = (direction: Direction) => {
    nextDirection.current = direction;
  };
  
  // Reset the game state
  const resetGame = () => {
    // Reset game objects
    player.current = new Player(PLAYER_START_X, PLAYER_START_Y);
    ghosts.current = [
      new Ghost(GhostType.BLINKY, 14, 11),
      new Ghost(GhostType.PINKY, 14, 14),
      new Ghost(GhostType.INKY, 12, 14),
      new Ghost(GhostType.CLYDE, 16, 14)
    ];
    
    // Reset game state
    gameBoard.current = JSON.parse(JSON.stringify(mazeLayout));
    powerMode.current = false;
    if (powerModeTimer.current !== null) {
      clearTimeout(powerModeTimer.current);
      powerModeTimer.current = null;
    }
    ghostCombo.current = 1;
    lastDirection.current = Direction.NONE;
    nextDirection.current = Direction.NONE;
    
    // Reset UI state
    setScore(0);
    setLives(3);
    setLevel(1);
    setDotsEaten(0);
    setGameState(GameState.PLAYING);
  };
  
  // Reset level
  const resetLevel = () => {
    player.current = new Player(PLAYER_START_X, PLAYER_START_Y);
    ghosts.current = [
      new Ghost(GhostType.BLINKY, 14, 11),
      new Ghost(GhostType.PINKY, 14, 14),
      new Ghost(GhostType.INKY, 12, 14),
      new Ghost(GhostType.CLYDE, 16, 14)
    ];
    
    lastDirection.current = Direction.NONE;
    nextDirection.current = Direction.NONE;
  };
  
  // Activate power mode
  const activatePowerMode = () => {
    powerMode.current = true;
    ghostCombo.current = 1;
    
    // Set all ghosts to frightened
    ghosts.current.forEach(ghost => {
      if (ghost.state !== GhostState.EATEN) {
        ghost.setState(GhostState.FRIGHTENED);
      }
    });
    
    // Clear existing timer if there is one
    if (powerModeTimer.current !== null) {
      clearTimeout(powerModeTimer.current);
    }
    
    // Set timer to end power mode
    powerModeTimer.current = window.setTimeout(() => {
      powerMode.current = false;
      ghosts.current.forEach(ghost => {
        if (ghost.state === GhostState.FRIGHTENED) {
          ghost.setState(GhostState.CHASE);
        }
      });
      powerModeTimer.current = null;
    }, POWER_PELLET_DURATION);
  };
  
  // Check if the player can move in a direction
  const canMove = (x: number, y: number): boolean => {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return false;
    }
    
    const cell = gameBoard.current[y][x];
    return cell !== CellType.WALL && cell !== CellType.GHOST_DOOR;
  };
  
  // Handle player collecting items
  const collectItem = (x: number, y: number) => {
    const cell = gameBoard.current[y][x];
    
    if (cell === CellType.DOT) {
      gameBoard.current[y][x] = CellType.EMPTY;
      setScore(prevScore => prevScore + DOT_POINTS);
      setDotsEaten(prev => prev + 1);
    } else if (cell === CellType.POWER_PELLET) {
      gameBoard.current[y][x] = CellType.EMPTY;
      setScore(prevScore => prevScore + POWER_PELLET_POINTS);
      setDotsEaten(prev => prev + 1);
      activatePowerMode();
    }
    
    // Check win condition
    if (dotsEaten >= TOTAL_DOTS) {
      setLevel(prev => prev + 1);
      setGameState(GameState.WIN);
    }
  };
  
  // Handle collisions with ghosts
  const checkGhostCollisions = () => {
    const playerX = Math.floor(player.current.x);
    const playerY = Math.floor(player.current.y);
    
    ghosts.current.forEach(ghost => {
      const ghostX = Math.floor(ghost.x);
      const ghostY = Math.floor(ghost.y);
      
      // Check collision
      if (playerX === ghostX && playerY === ghostY) {
        if (ghost.state === GhostState.FRIGHTENED) {
          // Player eats ghost
          ghost.setState(GhostState.EATEN);
          
          // Award points with combo multiplier
          const points = GHOST_POINTS * ghostCombo.current;
          setScore(prevScore => prevScore + points);
          
          // Increase combo multiplier
          ghostCombo.current *= GHOST_COMBO_MULTIPLIER;
        } else if (ghost.state !== GhostState.EATEN) {
          // Ghost catches player
          setLives(prevLives => prevLives - 1);
          
          if (lives <= 1) {
            setGameState(GameState.GAME_OVER);
          } else {
            resetLevel();
          }
        }
      }
    });
  };
  
  // Main game update function
  const update = (deltaTime: number) => {
    // Update player
    const playerDidMove = player.current.update(
      deltaTime, 
      lastDirection.current, 
      nextDirection.current,
      (x, y) => canMove(x, y)
    );
    
    if (playerDidMove) {
      // Update last direction if player actually moved
      lastDirection.current = player.current.direction;
      
      // Collect items
      collectItem(Math.floor(player.current.x), Math.floor(player.current.y));
      
      // Handle tunnel wrap-around
      if (player.current.x < 0) {
        player.current.x = GRID_WIDTH - 1;
      } else if (player.current.x >= GRID_WIDTH) {
        player.current.x = 0;
      }
    }
    
    // Update ghosts
    ghosts.current.forEach(ghost => {
      ghost.update(
        deltaTime,
        gameBoard.current,
        { x: player.current.x, y: player.current.y },
        powerMode.current
      );
      
      // Handle tunnel wrap-around for ghosts
      if (ghost.x < 0) {
        ghost.x = GRID_WIDTH - 1;
      } else if (ghost.x >= GRID_WIDTH) {
        ghost.x = 0;
      }
    });
    
    // Check for collisions
    checkGhostCollisions();
  };
  
  // Render game
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cellType = gameBoard.current[y][x];
        const drawX = x * CELL_SIZE;
        const drawY = y * CELL_SIZE;
        
        // Draw walls
        if (cellType === CellType.WALL) {
          ctx.fillStyle = '#2450FF';
          ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
        }
        
        // Draw ghost door
        else if (cellType === CellType.GHOST_DOOR) {
          ctx.fillStyle = '#FFC0CB';
          ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
        }
        
        // Draw dots
        else if (cellType === CellType.DOT) {
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(
            drawX + CELL_SIZE / 2,
            drawY + CELL_SIZE / 2,
            CELL_SIZE / 8,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        
        // Draw power pellets
        else if (cellType === CellType.POWER_PELLET) {
          ctx.fillStyle = '#FFF';
          // Make power pellets pulsate
          const pulseSize = Math.sin(Date.now() / 200) * 0.2 + 0.8;
          ctx.beginPath();
          ctx.arc(
            drawX + CELL_SIZE / 2,
            drawY + CELL_SIZE / 2,
            (CELL_SIZE / 3) * pulseSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
    
    // Draw ghosts
    ghosts.current.forEach(ghost => {
      const drawX = ghost.x * CELL_SIZE;
      const drawY = ghost.y * CELL_SIZE;
      
      // Choose ghost color based on type and state
      let ghostColor = '#FF0000'; // Default red
      
      if (ghost.state === GhostState.FRIGHTENED) {
        // Check if nearing end of frightened state
        const isFlashing = powerModeTimer.current !== null && 
          Date.now() > (POWER_PELLET_DURATION - GHOST_FLASH_DURATION + (powerModeTimer.current || 0));
        
        ghostColor = isFlashing && Math.floor(Date.now() / 200) % 2 === 0 ? '#FFFFFF' : '#0000FF';
      } else if (ghost.state === GhostState.EATEN) {
        ghostColor = '#FFFFFF'; // Eyes only
      } else {
        // Normal ghost colors
        switch (ghost.type) {
          case GhostType.BLINKY:
            ghostColor = '#FF0000'; // Red
            break;
          case GhostType.PINKY:
            ghostColor = '#FFB8FF'; // Pink
            break;
          case GhostType.INKY:
            ghostColor = '#00FFFF'; // Cyan
            break;
          case GhostType.CLYDE:
            ghostColor = '#FFB852'; // Orange
            break;
        }
      }
      
      // Draw ghost body
      ctx.fillStyle = ghostColor;
      ctx.beginPath();
      ctx.arc(
        drawX + CELL_SIZE / 2,
        drawY + CELL_SIZE / 2 - 2,
        CELL_SIZE / 2 - 2,
        Math.PI,
        0,
        false
      );
      
      // Draw wavy bottom of ghost
      const waveAmplitude = 2;
      const waveWidth = CELL_SIZE / 6;
      
      ctx.lineTo(drawX + CELL_SIZE, drawY + CELL_SIZE / 2 + 2);
      
      for (let i = 0; i < 3; i++) {
        const startX = drawX + CELL_SIZE - (i * waveWidth);
        ctx.quadraticCurveTo(
          startX - waveWidth / 2,
          drawY + CELL_SIZE / 2 + waveAmplitude + 2,
          startX - waveWidth,
          drawY + CELL_SIZE / 2 + 2
        );
      }
      
      ctx.lineTo(drawX, drawY + CELL_SIZE / 2 - 2);
      ctx.fill();
      
      // Draw eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(
        drawX + CELL_SIZE / 3,
        drawY + CELL_SIZE / 2 - 2,
        CELL_SIZE / 6,
        0,
        Math.PI * 2
      );
      ctx.arc(
        drawX + (CELL_SIZE * 2) / 3,
        drawY + CELL_SIZE / 2 - 2,
        CELL_SIZE / 6,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Draw pupils (if not eaten)
      if (ghost.state !== GhostState.FRIGHTENED) {
        ctx.fillStyle = '#0000FF';
        
        // Determine pupil position based on ghost direction
        let leftPupilX = drawX + CELL_SIZE / 3;
        let leftPupilY = drawY + CELL_SIZE / 2 - 2;
        let rightPupilX = drawX + (CELL_SIZE * 2) / 3;
        let rightPupilY = drawY + CELL_SIZE / 2 - 2;
        
        // Adjust pupil position based on ghost direction
        switch (ghost.direction) {
          case Direction.UP:
            leftPupilY -= 2;
            rightPupilY -= 2;
            break;
          case Direction.DOWN:
            leftPupilY += 2;
            rightPupilY += 2;
            break;
          case Direction.LEFT:
            leftPupilX -= 2;
            rightPupilX -= 2;
            break;
          case Direction.RIGHT:
            leftPupilX += 2;
            rightPupilX += 2;
            break;
        }
        
        ctx.beginPath();
        ctx.arc(leftPupilX, leftPupilY, CELL_SIZE / 10, 0, Math.PI * 2);
        ctx.arc(rightPupilX, rightPupilY, CELL_SIZE / 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Draw player (Pac-Man)
    const drawX = player.current.x * CELL_SIZE;
    const drawY = player.current.y * CELL_SIZE;
    
    // Determine mouth angle based on direction
    let startAngle = 0.2 * Math.PI;
    let endAngle = 1.8 * Math.PI;
    
    switch (player.current.direction) {
      case Direction.RIGHT:
        startAngle = 0.2 * Math.PI;
        endAngle = 1.8 * Math.PI;
        break;
      case Direction.LEFT:
        startAngle = 1.2 * Math.PI;
        endAngle = 0.8 * Math.PI;
        break;
      case Direction.UP:
        startAngle = 1.7 * Math.PI;
        endAngle = 1.3 * Math.PI;
        break;
      case Direction.DOWN:
        startAngle = 0.7 * Math.PI;
        endAngle = 0.3 * Math.PI;
        break;
    }
    
    // Animate mouth opening and closing
    const mouthSpeed = 0.15;
    const t = Math.abs(Math.sin(Date.now() * mouthSpeed));
    
    // Interpolate mouth angles
    startAngle = startAngle * t;
    endAngle = endAngle + ((2 * Math.PI - endAngle) * (1 - t));
    
    // Draw Pac-Man
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(
      drawX + CELL_SIZE / 2,
      drawY + CELL_SIZE / 2,
      CELL_SIZE / 2 - 1,
      startAngle,
      endAngle
    );
    ctx.lineTo(drawX + CELL_SIZE / 2, drawY + CELL_SIZE / 2);
    ctx.fill();
    
    // Draw game state overlays
    if (gameState === GameState.MENU) {
      drawMenu(ctx, canvas.width, canvas.height);
    } else if (gameState === GameState.GAME_OVER) {
      drawGameOver(ctx, canvas.width, canvas.height);
    } else if (gameState === GameState.PAUSE) {
      drawPause(ctx, canvas.width, canvas.height);
    } else if (gameState === GameState.WIN) {
      drawWin(ctx, canvas.width, canvas.height);
    }
  };
  
  // Draw menu overlay
  const drawMenu = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#FFFF00';
    ctx.font = '40px "Press Start 2P", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('GHOST GOBBLER', width / 2, height / 2 - 80);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "Press Start 2P", cursive';
    
    if (isMobile) {
      ctx.fillText('TAP TO START', width / 2, height / 2);
      ctx.fillText('USE CONTROLS BELOW', width / 2, height / 2 + 40);
    } else {
      ctx.fillText('PRESS SPACE TO START', width / 2, height / 2);
      ctx.fillText('USE ARROW KEYS TO MOVE', width / 2, height / 2 + 40);
    }
    
    ctx.fillText('HIGH SCORE: ' + highScore, width / 2, height / 2 + 100);
  };
  
  // Draw game over overlay
  const drawGameOver = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#FF0000';
    ctx.font = '40px "Press Start 2P", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 50);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "Press Start 2P", cursive';
    ctx.fillText('SCORE: ' + score, width / 2, height / 2);
    ctx.fillText('HIGH SCORE: ' + highScore, width / 2, height / 2 + 40);
    
    if (isMobile) {
      ctx.fillText('TAP TO RESTART', width / 2, height / 2 + 100);
    } else {
      ctx.fillText('PRESS SPACE TO RESTART', width / 2, height / 2 + 100);
    }
  };
  
  // Draw pause overlay
  const drawPause = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#FFFF00';
    ctx.font = '40px "Press Start 2P", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', width / 2, height / 2);
    
    if (isMobile) {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px "Press Start 2P", cursive';
      ctx.fillText('TAP TO RESUME', width / 2, height / 2 + 50);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px "Press Start 2P", cursive';
      ctx.fillText('PRESS SPACE TO RESUME', width / 2, height / 2 + 50);
    }
  };
  
  // Draw win overlay
  const drawWin = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#00FF00';
    ctx.font = '40px "Press Start 2P", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', width / 2, height / 2 - 50);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "Press Start 2P", cursive';
    ctx.fillText('SCORE: ' + score, width / 2, height / 2);
    ctx.fillText('LEVEL: ' + level, width / 2, height / 2 + 40);
    
    if (isMobile) {
      ctx.fillText('TAP TO CONTINUE', width / 2, height / 2 + 100);
    } else {
      ctx.fillText('PRESS SPACE TO CONTINUE', width / 2, height / 2 + 100);
    }
  };
  
  // Handle canvas click
  const handleCanvasClick = () => {
    if (gameState === GameState.MENU || gameState === GameState.GAME_OVER || gameState === GameState.WIN) {
      resetGame();
    } else if (gameState === GameState.PAUSE) {
      setGameState(GameState.PLAYING);
    } else if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSE);
    }
  };
  
  // Use game loop
  const { fps } = useGameLoop({
    gameState,
    update,
    render,
    fps: 60,
  });
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-black p-4 rounded-lg shadow-xl mb-4">
        <div className="flex justify-between text-yellow-400 font-pixel mb-2">
          <div>SCORE: {score}</div>
          <div>HIGH: {highScore}</div>
        </div>
        <div className="flex justify-between text-white font-pixel mb-4">
          <div>LEVEL: {level}</div>
          <div>LIVES: {Array(lives).fill('●').join(' ')}</div>
        </div>
        <div onClick={handleCanvasClick} className="game-container relative cursor-pointer">
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            className="border-4 border-blue-800 rounded-sm"
          />
        </div>
      </div>
      {isMobile && (
        <div className="mt-4 mb-8">
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            <div className="col-start-2">
              <button
                onTouchStart={() => handleTouchStart(Direction.UP)}
                className="w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-3xl"
                aria-label="Move Up"
              >
                W
              </button>
            </div>
            <div className="col-start-1 row-start-2">
              <button
                onTouchStart={() => handleTouchStart(Direction.LEFT)}
                className="w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-3xl"
                aria-label="Move Left"
              >
                A
              </button>
            </div>
            <div className="col-start-2 row-start-2">
              <button
                onClick={() => {
                  if (gameState === GameState.MENU || gameState === GameState.GAME_OVER) {
                    resetGame();
                  } else if (gameState === GameState.PLAYING) {
                    setGameState(GameState.PAUSE);
                  } else if (gameState === GameState.PAUSE) {
                    setGameState(GameState.PLAYING);
                  }
                }}
                className="w-16 h-16 bg-accent rounded-full shadow-lg flex items-center justify-center text-black text-xl font-bold"
                aria-label="Pause/Start"
              >
                {gameState === GameState.PLAYING ? '❚❚' : '▶'}
              </button>
            </div>
            <div className="col-start-3 row-start-2">
              <button
                onTouchStart={() => handleTouchStart(Direction.RIGHT)}
                className="w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-3xl"
                aria-label="Move Right"
              >
                D
              </button>
            </div>
            <div className="col-start-2 row-start-3">
              <button
                onTouchStart={() => handleTouchStart(Direction.DOWN)}
                className="w-16 h-16 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-3xl"
                aria-label="Move Down"
              >
                S
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
