import {
  CELL_SIZE,
  CellType,
  Direction,
  GHOST_FLASH_DURATION,
  GRID_HEIGHT,
  GRID_WIDTH,
  GameState,
  GhostMode,
  GhostType,
} from '../constants/gameConstants';
import { GameEngine } from './GameEngine';
import { Ghost } from './Ghost';

const GHOST_COLORS: Record<GhostType, string> = {
  [GhostType.BLINKY]: '#FF0000',
  [GhostType.PINKY]: '#FFB8FF',
  [GhostType.INKY]: '#00FFFF',
  [GhostType.CLYDE]: '#FFB852',
};

const PUPIL_OFFSET: Record<Direction, { x: number; y: number }> = {
  [Direction.NONE]: { x: 0, y: 0 },
  [Direction.UP]: { x: 0, y: -2 },
  [Direction.DOWN]: { x: 0, y: 2 },
  [Direction.LEFT]: { x: -2, y: 0 },
  [Direction.RIGHT]: { x: 2, y: 0 },
};

const MOUTH_ANGLES: Record<Direction, number> = {
  [Direction.NONE]: 0,
  [Direction.RIGHT]: 0,
  [Direction.DOWN]: Math.PI / 2,
  [Direction.LEFT]: Math.PI,
  [Direction.UP]: -Math.PI / 2,
};

const drawMaze = (ctx: CanvasRenderingContext2D, board: number[][], time: number) => {
  const pulse = Math.sin(time / 200) * 0.2 + 0.8;

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const cx = x * CELL_SIZE + CELL_SIZE / 2;
      const cy = y * CELL_SIZE + CELL_SIZE / 2;

      switch (board[y][x]) {
        case CellType.WALL:
          ctx.fillStyle = '#2450FF';
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          break;
        case CellType.GHOST_DOOR:
          ctx.fillStyle = '#FFC0CB';
          ctx.fillRect(x * CELL_SIZE, cy - 2, CELL_SIZE, 4);
          break;
        case CellType.DOT:
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(cx, cy, CELL_SIZE / 8, 0, Math.PI * 2);
          ctx.fill();
          break;
        case CellType.POWER_PELLET:
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(cx, cy, (CELL_SIZE / 3) * pulse, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }
  }
};

const drawGhost = (ctx: CanvasRenderingContext2D, ghost: Ghost, flashing: boolean, time: number) => {
  const cx = ghost.x * CELL_SIZE;
  const cy = ghost.y * CELL_SIZE;
  const radius = CELL_SIZE * 0.45;
  const eaten = ghost.mode === GhostMode.EATEN;

  if (!eaten) {
    ctx.fillStyle = ghost.frightened
      ? flashing && Math.floor(time / 200) % 2 === 0
        ? '#FFFFFF'
        : '#2121DE'
      : GHOST_COLORS[ghost.type];

    ctx.beginPath();
    ctx.arc(cx, cy - radius * 0.15, radius, Math.PI, 0);
    ctx.lineTo(cx + radius, cy + radius * 0.8);
    for (let i = 0; i < 3; i++) {
      const startX = cx + radius - (i * radius * 2) / 3;
      ctx.quadraticCurveTo(
        startX - radius / 3,
        cy + radius * 0.8 + 3,
        startX - (radius * 2) / 3,
        cy + radius * 0.8
      );
    }
    ctx.closePath();
    ctx.fill();
  }

  if (ghost.frightened && !eaten) {
    // Scared face instead of eyes.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - radius * 0.5, cy - radius * 0.3, 3, 3);
    ctx.fillRect(cx + radius * 0.2, cy - radius * 0.3, 3, 3);
    return;
  }

  const offset = PUPIL_OFFSET[ghost.direction];
  for (const side of [-1, 1]) {
    const ex = cx + side * radius * 0.4;
    const ey = cy - radius * 0.2;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex, ey, radius * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2121DE';
    ctx.beginPath();
    ctx.arc(ex + offset.x, ey + offset.y, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawPlayer = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: Direction,
  time: number
) => {
  const radius = CELL_SIZE * 0.55;
  const mouth = (Math.sin(time / 60) * 0.5 + 0.5) * 0.32 * Math.PI + 0.03 * Math.PI;
  const facing = MOUTH_ANGLES[direction];

  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
  ctx.arc(x * CELL_SIZE, y * CELL_SIZE, radius, facing + mouth, facing - mouth);
  ctx.closePath();
  ctx.fill();
};

const drawOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  titleColor: string,
  lines: string[]
) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.fillStyle = titleColor;
  ctx.font = '28px "Press Start 2P", cursive';
  ctx.fillText(title, width / 2, height / 2 - 60);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px "Press Start 2P", cursive';
  lines.forEach((line, index) => ctx.fillText(line, width / 2, height / 2 + index * 28));
};

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  isMobile: boolean
) => {
  const time = Date.now();
  const { width, height } = ctx.canvas;
  const stats = engine.getStats();

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  drawMaze(ctx, engine.board, time);

  const flashing = engine.powerUntil - time < GHOST_FLASH_DURATION;
  engine.ghosts.forEach(ghost => drawGhost(ctx, ghost, flashing, time));
  drawPlayer(ctx, engine.player.x, engine.player.y, engine.player.direction, time);

  const action = isMobile ? 'TAP' : 'PRESS SPACE';
  switch (stats.state) {
    case GameState.MENU:
      drawOverlay(ctx, width, height, 'PAC-DUDE', '#FFFF00', [
        `${action} TO START`,
        isMobile ? 'USE THE CONTROLS BELOW' : 'ARROW KEYS OR WASD TO MOVE',
        `HIGH SCORE: ${stats.highScore}`,
      ]);
      break;
    case GameState.PAUSE:
      drawOverlay(ctx, width, height, 'PAUSED', '#FFFF00', [`${action} TO RESUME`]);
      break;
    case GameState.GAME_OVER:
      drawOverlay(ctx, width, height, 'GAME OVER', '#FF3B3B', [
        `SCORE: ${stats.score}`,
        `HIGH SCORE: ${stats.highScore}`,
        `${action} TO RESTART`,
      ]);
      break;
    case GameState.WIN:
      drawOverlay(ctx, width, height, 'LEVEL CLEAR', '#3BFF7A', [
        `SCORE: ${stats.score}`,
        `LEVEL: ${stats.level}`,
        `${action} FOR NEXT LEVEL`,
      ]);
      break;
  }
};
