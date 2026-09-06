import {
  CellType,
  DOT_POINTS,
  Direction,
  GHOST_COMBO_MULTIPLIER,
  GHOST_POINTS,
  GHOST_RELEASE_DELAY,
  GameState,
  GhostMode,
  GhostType,
  HOUSE_CENTER_X,
  HOUSE_CENTER_Y,
  HOUSE_EXIT_X,
  HOUSE_EXIT_Y,
  PLAYER_START_X,
  PLAYER_START_Y,
  POWER_PELLET_DURATION,
  POWER_PELLET_POINTS,
  STARTING_LIVES,
} from '../constants/gameConstants';
import { Ghost } from './Ghost';
import { Player } from './Player';
import { Board, cloneBoard, countDots } from './maze';

export interface GameStats {
  score: number;
  lives: number;
  level: number;
  highScore: number;
  state: GameState;
}

const HIGH_SCORE_KEY = 'pacmanHighScore';

export class GameEngine {
  board: Board = cloneBoard();
  player = new Player(PLAYER_START_X, PLAYER_START_Y);
  ghosts: Ghost[] = GameEngine.createGhosts();
  powerUntil = 0;

  private dotsRemaining = countDots(this.board);
  private combo = 1;
  private stats: GameStats = {
    score: 0,
    lives: STARTING_LIVES,
    level: 1,
    highScore: Number(localStorage.getItem(HIGH_SCORE_KEY) ?? 0),
    state: GameState.MENU,
  };

  constructor(private onStatsChange: (stats: GameStats) => void) {
    this.publish();
  }

  private static createGhosts(): Ghost[] {
    return [
      new Ghost(GhostType.BLINKY, HOUSE_EXIT_X, HOUSE_EXIT_Y, 0, true),
      new Ghost(GhostType.PINKY, HOUSE_CENTER_X, HOUSE_CENTER_Y, 0),
      new Ghost(GhostType.INKY, HOUSE_CENTER_X - 2, HOUSE_CENTER_Y, GHOST_RELEASE_DELAY),
      new Ghost(GhostType.CLYDE, HOUSE_CENTER_X + 2, HOUSE_CENTER_Y, GHOST_RELEASE_DELAY * 2),
    ];
  }

  getStats(): GameStats {
    return this.stats;
  }

  get powerMode(): boolean {
    return Date.now() < this.powerUntil;
  }

  private publish() {
    this.stats = { ...this.stats };
    this.onStatsChange(this.stats);
  }

  private addScore(points: number) {
    this.stats.score += points;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem(HIGH_SCORE_KEY, String(this.stats.highScore));
    }
    this.publish();
  }

  /** Space bar / tap: start, pause, resume, restart or advance a level. */
  confirm() {
    switch (this.stats.state) {
      case GameState.PLAYING:
        this.stats.state = GameState.PAUSE;
        break;
      case GameState.PAUSE:
        this.stats.state = GameState.PLAYING;
        break;
      case GameState.WIN:
        this.stats.level += 1;
        this.board = cloneBoard();
        this.dotsRemaining = countDots(this.board);
        this.placeActors();
        this.stats.state = GameState.PLAYING;
        break;
      default:
        this.startNewGame();
        return;
    }
    this.publish();
  }

  startNewGame() {
    this.board = cloneBoard();
    this.dotsRemaining = countDots(this.board);
    this.stats = { ...this.stats, score: 0, lives: STARTING_LIVES, level: 1, state: GameState.PLAYING };
    this.placeActors();
    this.publish();
  }

  queueDirection(direction: Direction) {
    this.player.pendingDirection = direction;
  }

  private placeActors() {
    this.player.reset(PLAYER_START_X, PLAYER_START_Y);
    this.player.pendingDirection = Direction.NONE;
    this.powerUntil = 0;
    this.combo = 1;
    this.ghosts.forEach((ghost, index) =>
      ghost.respawn(index * GHOST_RELEASE_DELAY, ghost.type === GhostType.BLINKY)
    );
  }

  update(deltaTime: number, now = Date.now()) {
    if (this.stats.state !== GameState.PLAYING) return;

    this.player.update(deltaTime, this.board);
    this.eatItemUnderPlayer();

    const frightened = this.powerMode;
    for (const ghost of this.ghosts) {
      if (ghost.mode !== GhostMode.EATEN) ghost.frightened = frightened;
      ghost.update(deltaTime, this.board, this.player, this.stats.level, now);
    }

    this.checkGhostCollisions(now);
  }

  private eatItemUnderPlayer() {
    const { tileX: x, tileY: y } = this.player;
    const cell = this.board[y]?.[x];
    if (cell !== CellType.DOT && cell !== CellType.POWER_PELLET) return;

    this.board[y][x] = CellType.EMPTY;
    this.dotsRemaining -= 1;

    if (cell === CellType.POWER_PELLET) {
      this.powerUntil = Date.now() + POWER_PELLET_DURATION;
      this.combo = 1;
      this.ghosts.forEach(ghost => {
        if (ghost.mode !== GhostMode.EATEN) ghost.frightened = true;
      });
    }

    this.addScore(cell === CellType.POWER_PELLET ? POWER_PELLET_POINTS : DOT_POINTS);

    if (this.dotsRemaining <= 0) {
      this.stats.state = GameState.WIN;
      this.publish();
    }
  }

  private checkGhostCollisions(now: number) {
    for (const ghost of this.ghosts) {
      if (ghost.mode === GhostMode.EATEN) continue;
      const distance = Math.hypot(this.player.x - ghost.x, this.player.y - ghost.y);
      if (distance > 0.7) continue;

      if (ghost.frightened) {
        ghost.getEaten(now);
        this.addScore(GHOST_POINTS * this.combo);
        this.combo *= GHOST_COMBO_MULTIPLIER;
      } else {
        this.loseLife();
        return;
      }
    }
  }

  private loseLife() {
    this.stats.lives -= 1;
    if (this.stats.lives <= 0) {
      this.stats.state = GameState.GAME_OVER;
    } else {
      this.placeActors();
    }
    this.publish();
  }
}
