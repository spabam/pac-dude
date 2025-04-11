
import { useRef, useEffect, useState } from 'react';
import { GameState } from '../constants/gameConstants';

interface GameLoopProps {
  gameState: GameState;
  update: (deltaTime: number) => void;
  render: () => void;
  fps?: number;
}

export const useGameLoop = ({ 
  gameState, 
  update, 
  render,
  fps = 60
}: GameLoopProps) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const fpsInterval = useRef<number>(1000 / fps);
  const [actualFPS, setActualFPS] = useState<number>(0);
  
  const fpsCounterRef = useRef({
    lastCalcTime: 0,
    frames: 0,
  });

  const gameLoop = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
      fpsCounterRef.current.lastCalcTime = time;
    }
    
    const deltaTime = time - previousTimeRef.current;
    
    // Only update if enough time has passed
    if (deltaTime >= fpsInterval.current) {
      // Calculate actual FPS every second
      fpsCounterRef.current.frames++;
      if (time - fpsCounterRef.current.lastCalcTime >= 1000) {
        setActualFPS(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastCalcTime = time;
      }

      // Adjust for potential frame skips
      previousTimeRef.current = time - (deltaTime % fpsInterval.current);
      
      // Always call update, but let the function handle game state internally
      update(deltaTime / 1000); // Convert ms to seconds
      
      // Always render, even in paused/menu state
      render();
    }
    
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState, update, render]);
  
  return { fps: actualFPS };
};
