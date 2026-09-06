import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CELL_SIZE,
  Direction,
  GRID_HEIGHT,
  GRID_WIDTH,
  GameState,
} from '../constants/gameConstants';
import { GameEngine, GameStats } from '../game/GameEngine';
import { renderGame } from '../game/render';
import { useGameLoop } from '../hooks/useGameLoop';
import { useIsMobile } from '../hooks/use-mobile';

const KEY_DIRECTIONS: Record<string, Direction> = {
  arrowup: Direction.UP,
  w: Direction.UP,
  arrowdown: Direction.DOWN,
  s: Direction.DOWN,
  arrowleft: Direction.LEFT,
  a: Direction.LEFT,
  arrowright: Direction.RIGHT,
  d: Direction.RIGHT,
};

const TouchButton: React.FC<{ label: string; area: string; onPress: () => void }> = ({
  label,
  area,
  onPress,
}) => (
  <button
    className={`${area} h-16 w-16 rounded-full bg-primary text-2xl font-pixel text-primary-foreground shadow-lg active:scale-95`}
    aria-label={label}
    onTouchStart={onPress}
    onClick={onPress}
  >
    {label[0]}
  </button>
);

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<GameStats | null>(null);

  const engine = useMemo(() => new GameEngine(setStats), []);

  useGameLoop(
    useCallback(
      deltaTime => {
        engine.update(deltaTime);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) renderGame(ctx, engine, isMobile);
      },
      [engine, isMobile]
    )
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key in KEY_DIRECTIONS) {
        event.preventDefault();
        engine.queueDirection(KEY_DIRECTIONS[key]);
      } else if (key === ' ') {
        event.preventDefault();
        engine.confirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);

  if (!stats) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 rounded-lg bg-black p-4 shadow-xl">
        <div className="mb-2 flex justify-between font-pixel text-xs text-yellow-400">
          <span>SCORE {stats.score}</span>
          <span>HIGH {stats.highScore}</span>
        </div>
        <div className="mb-3 flex justify-between font-pixel text-xs text-white">
          <span>LEVEL {stats.level}</span>
          <span aria-label={`${stats.lives} lives left`}>{'●'.repeat(Math.max(stats.lives, 0))}</span>
        </div>
        <canvas
          ref={canvasRef}
          width={GRID_WIDTH * CELL_SIZE}
          height={GRID_HEIGHT * CELL_SIZE}
          onClick={() => engine.confirm()}
          className="game-container cursor-pointer rounded-sm border-4 border-blue-800"
        />
      </div>

      {isMobile && (
        <div className="mb-8 grid grid-cols-3 grid-rows-3 gap-3">
          <TouchButton label="Up" area="col-start-2 row-start-1" onPress={() => engine.queueDirection(Direction.UP)} />
          <TouchButton label="Left" area="col-start-1 row-start-2" onPress={() => engine.queueDirection(Direction.LEFT)} />
          <button
            className="col-start-2 row-start-2 h-16 w-16 rounded-full bg-accent font-pixel text-accent-foreground shadow-lg active:scale-95"
            aria-label="Start or pause"
            onClick={() => engine.confirm()}
          >
            {stats.state === GameState.PLAYING ? '❚❚' : '▶'}
          </button>
          <TouchButton label="Right" area="col-start-3 row-start-2" onPress={() => engine.queueDirection(Direction.RIGHT)} />
          <TouchButton label="Down" area="col-start-2 row-start-3" onPress={() => engine.queueDirection(Direction.DOWN)} />
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
