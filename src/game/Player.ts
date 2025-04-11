
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
