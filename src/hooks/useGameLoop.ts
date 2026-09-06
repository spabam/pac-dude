import { useEffect, useRef } from 'react';

/** Runs a fixed-ish timestep loop on requestAnimationFrame until unmounted. */
export const useGameLoop = (frame: (deltaTime: number) => void) => {
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useEffect(() => {
    let animationId = 0;
    let previous = performance.now();

    const loop = (time: number) => {
      const deltaTime = Math.min((time - previous) / 1000, 0.05); // clamp long tab stalls
      previous = time;
      frameRef.current(deltaTime);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, []);
};
