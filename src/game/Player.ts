import { Direction, PLAYER_SPEED } from '../constants/gameConstants';
import { Actor } from './Actor';
import { Board, DELTA, isWalkable } from './maze';

export class Player extends Actor {
  /** Direction the player asked for; applied as soon as it becomes legal. */
  pendingDirection: Direction = Direction.NONE;

  constructor(x: number, y: number) {
    super(x, y, PLAYER_SPEED);
  }

  update(deltaTime: number, board: Board) {
    this.travel(this.speed * deltaTime, () => {
      const canGo = (dir: Direction) =>
        dir !== Direction.NONE &&
        isWalkable(board, this.tileX + DELTA[dir].x, this.tileY + DELTA[dir].y);

      if (canGo(this.pendingDirection)) {
        const next = this.pendingDirection;
        this.pendingDirection = Direction.NONE;
        return next;
      }
      return canGo(this.direction) ? this.direction : Direction.NONE;
    });
  }
}
