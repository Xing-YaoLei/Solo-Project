import { useEffect, useRef } from 'react';
import { createGame } from '@/game/Game';

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameContainerRef.current && !gameRef.current) {
      gameRef.current = createGame('game-container');
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#1A1A2E">
      <div
      id="game-container"
      ref={gameContainerRef}
      className="w-full h-full"
    />
    </div>
  );
}
