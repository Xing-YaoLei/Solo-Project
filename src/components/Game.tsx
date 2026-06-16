import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { PHASER_CONFIG } from '../game/config';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { MainMenuScene } from '../scenes/MainMenuScene';
import { LevelSelectScene } from '../scenes/LevelSelectScene';
import { GameScene } from '../scenes/GameScene';
import { ResultScene } from '../scenes/ResultScene';

declare global {
  interface Window {
    __PHASER_GAME__?: Phaser.Game;
  }
}

export default function Game() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      ...PHASER_CONFIG,
      parent: gameContainerRef.current,
      scene: [
        BootScene,
        PreloadScene,
        MainMenuScene,
        LevelSelectScene,
        GameScene,
        ResultScene,
      ],
    };

    gameRef.current = new Phaser.Game(config);
    
    window.__PHASER_GAME__ = gameRef.current;

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
        delete window.__PHASER_GAME__;
      }
    };
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden">
      <div ref={gameContainerRef} id="game-container" className="w-full h-full" />
    </div>
  );
}
