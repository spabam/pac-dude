import { CellType, Direction, GRID_HEIGHT, GRID_WIDTH } from '../constants/gameConstants';
import { mazeLayout } from '../data/mazeLayout';

export type Board = number[][];

export const cloneBoard = (): Board => mazeLayout.map(row => [...row]);

export const countDots = (board: Board): number =>
  board.reduce(
    (total, row) =>
      total + row.filter(cell => cell === CellType.DOT || cell === CellType.POWER_PELLET).length,
    0
  );

export const wrapX = (x: number): number => ((x % GRID_WIDTH) + GRID_WIDTH) % GRID_WIDTH;

/** Can this tile be entered? Ghost doors are only passable by ghosts. */
export const isWalkable = (board: Board, x: number, y: number, allowDoor = false): boolean => {
  if (y < 0 || y >= GRID_HEIGHT) return false;
  const cell = board[y][wrapX(x)];
  if (cell === CellType.GHOST_DOOR) return allowDoor;
  return cell !== CellType.WALL;
};

export const DIRECTIONS: Direction[] = [
  Direction.UP,
  Direction.DOWN,
  Direction.LEFT,
  Direction.RIGHT,
];

export const DELTA: Record<Direction, { x: number; y: number }> = {
  [Direction.NONE]: { x: 0, y: 0 },
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
};

export const opposite = (dir: Direction): Direction => {
  switch (dir) {
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
};

/** Breadth-first search: first step of the shortest path from one tile to another. */
export const stepTowards = (
  board: Board,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  allowDoor: boolean
): Direction => {
  const key = (x: number, y: number) => y * GRID_WIDTH + x;
  const start = key(wrapX(Math.floor(fromX)), Math.floor(fromY));
  const goal = key(wrapX(Math.floor(toX)), Math.floor(toY));
  const firstStep = new Map<number, Direction>([[start, Direction.NONE]]);
  const queue: Array<{ x: number; y: number }> = [{ x: wrapX(fromX), y: fromY }];

  while (queue.length) {
    const current = queue.shift()!;
    const currentKey = key(current.x, current.y);
    if (currentKey === goal) return firstStep.get(currentKey) ?? Direction.NONE;

    for (const dir of DIRECTIONS) {
      const nx = wrapX(current.x + DELTA[dir].x);
      const ny = current.y + DELTA[dir].y;
      if (!isWalkable(board, nx, ny, allowDoor)) continue;
      const nextKey = key(nx, ny);
      if (firstStep.has(nextKey)) continue;
      firstStep.set(nextKey, currentKey === start ? dir : firstStep.get(currentKey)!);
      queue.push({ x: nx, y: ny });
    }
  }

  return Direction.NONE;
};
