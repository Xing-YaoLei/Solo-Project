import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Level, GameResult } from '@/types/game';
import { SCENE_KEYS } from '@/types/game';
import { createGameConfig, GAME_CONFIG } from '@/game/GameConfig';
import { MainGameScene } from '@/scenes/MainGameScene';

interface GameSceneProps {
  level: Level;
  onGameEnd: (result: GameResult) => void;
  onExit: () => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ level, onGameEnd, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneLaunchedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !level) {
      console.error('GameScene: Missing container or level data');
      return;
    }

    sceneLaunchedRef.current = false;

    const config = createGameConfig(
      containerRef.current,
      GAME_CONFIG.DEFAULT_WIDTH,
      GAME_CONFIG.DEFAULT_HEIGHT
    );

    config.scene = [];

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const launchScene = () => {
      if (sceneLaunchedRef.current || !gameRef.current) return;
      sceneLaunchedRef.current = true;

      const sceneManager = gameRef.current.scene;

      if (!sceneManager.getScene(SCENE_KEYS.Game)) {
        sceneManager.add(SCENE_KEYS.Game, MainGameScene);
      }

      sceneManager.start(SCENE_KEYS.Game, {
        level,
        onGameEnd,
        onExit,
      });
    };

    if (game.isBooted) {
      launchScene();
    } else {
      game.events.once('ready', launchScene);
    }

    const handleBootError = (error: unknown) => {
      console.error('Phaser Game boot error:', error);
      onExit();
    };

    game.events.on('error', handleBootError);

    return () => {
      sceneLaunchedRef.current = false;
      game.events.off('error', handleBootError);
      game.events.off('ready', launchScene);
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true);
        } catch (e) {
          console.error('Error destroying Phaser game:', e);
        }
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
