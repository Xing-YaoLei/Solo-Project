import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Level, GameResult } from '@/types/game';
import { SCENE_KEYS } from '@/types/game';
import { createGameConfig, GAME_CONFIG } from '@/game/GameConfig';

interface GameSceneProps {
  level: Level;
  onGameEnd: (result: GameResult) => void;
  onExit: () => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ level, onGameEnd, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initPhaser = async () => {
      const { MainGameScene } = await import('@/scenes/MainGameScene');

      const config = createGameConfig(
        containerRef.current!,
        GAME_CONFIG.DEFAULT_WIDTH,
        GAME_CONFIG.DEFAULT_HEIGHT
      );

      config.scene = [MainGameScene];

      const game = new Phaser.Game(config);
      gameRef.current = game;

      game.scene.start(SCENE_KEYS.Game, {
        level,
        onGameEnd,
        onExit,
      });
    };

    initPhaser();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [level, onGameEnd, onExit]);

  return (
    <div className="w-full h-screen bg-pharmacy-50 overflow-hidden">
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};
