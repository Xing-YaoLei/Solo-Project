import React, { useState, useCallback } from 'react';
import type { Level, GameResult } from '@/types/game';
import { MainMenu } from '@/ui/MainMenu';
import { GameScene } from '@/ui/GameScene';
import { ResultScene } from '@/ui/ResultScene';
import { ReviewScene } from '@/ui/ReviewScene';
import { SettingsScene } from '@/ui/SettingsScene';
import { useGameStateStore } from '@/store/useGameStateStore';
import { getNextLevel } from '@/data/levels';

type ViewState = 'menu' | 'game' | 'result' | 'review' | 'settings';

export default function App() {
  const [view, setView] = useState<ViewState>('menu');
  const { currentLevel, lastResult, setCurrentLevel, setSelectedLevelId } = useGameStateStore();

  const handleStartGame = useCallback((level: Level) => {
    setCurrentLevel(level);
    setSelectedLevelId(level.id);
    setView('game');
  }, [setCurrentLevel, setSelectedLevelId]);

  const handleGameEnd = useCallback((result: GameResult) => {
    setView('result');
  }, []);

  const handleReplay = useCallback(() => {
    if (currentLevel) {
      setView('game');
    }
  }, [currentLevel]);

  const handleNextLevel = useCallback(() => {
    if (currentLevel) {
      const next = getNextLevel(currentLevel.id);
      if (next) {
        handleStartGame(next);
      }
    }
  }, [currentLevel, handleStartGame]);

  const handleBackToMenu = useCallback(() => {
    setView('menu');
  }, []);

  const handleOpenReview = useCallback(() => {
    setView('review');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setView('settings');
  }, []);

  const handleExitGame = useCallback(() => {
    setView('menu');
  }, []);

  const renderView = () => {
    switch (view) {
      case 'menu':
        return (
          <MainMenu
            onStartGame={handleStartGame}
            onOpenReview={handleOpenReview}
            onOpenSettings={handleOpenSettings}
          />
        );
      case 'game':
        if (!currentLevel) {
          return (
            <div className="w-full h-full flex items-center justify-center">
              <div className="card text-center">
                <p className="text-gray-600 mb-4">请先选择关卡</p>
                <button onClick={handleBackToMenu} className="btn-primary">
                  返回菜单
                </button>
              </div>
            </div>
          );
        }
        return (
          <GameScene
            key={currentLevel.id + '-' + Date.now()}
            level={currentLevel}
            onGameEnd={handleGameEnd}
            onExit={handleExitGame}
          />
        );
      case 'result':
        if (!lastResult || !currentLevel) {
          return (
            <div className="w-full h-full flex items-center justify-center">
              <div className="card text-center">
                <p className="text-gray-600 mb-4">没有可显示的结果</p>
                <button onClick={handleBackToMenu} className="btn-primary">
                  返回菜单
                </button>
              </div>
            </div>
          );
        }
        return (
          <ResultScene
            result={lastResult}
            level={currentLevel}
            onReplay={handleReplay}
            onNextLevel={handleNextLevel}
            onBackToMenu={handleBackToMenu}
          />
        );
      case 'review':
        return <ReviewScene onBack={handleBackToMenu} />;
      case 'settings':
        return <SettingsScene onBack={handleBackToMenu} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full overflow-hidden">
      {renderView()}
    </div>
  );
}
