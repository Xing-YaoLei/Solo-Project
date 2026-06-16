import React from 'react';
import { Play, BarChart3, Settings, RotateCcw, Star } from 'lucide-react';
import { LEVELS, getDifficultyColor, getDifficultyLabel, calculateStars } from '@/data/levels';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useGameStateStore } from '@/store/useGameStateStore';
import { audioUtils } from '@/utils/audio';
import { vibrationUtils } from '@/utils/vibration';
import type { Level } from '@/types/game';

interface MainMenuProps {
  onStartGame: (level: Level) => void;
  onOpenReview: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onOpenReview, onOpenSettings }) => {
  const { getLevelProgress, totalScore, totalPlays } = usePlayerStore();
  const { lastPlayedLevelId, setSelectedLevelId } = useGameStateStore();

  const handleLevelClick = (level: Level) => {
    audioUtils.playClick();
    vibrationUtils.click();
    setSelectedLevelId(level.id);
    onStartGame(level);
  };

  const handleQuickReplay = () => {
    if (lastPlayedLevelId) {
      const level = LEVELS.find(l => l.id === lastPlayedLevelId);
      if (level) {
        handleLevelClick(level);
      }
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            size={16}
            className={i <= count ? 'text-promo-500 fill-promo-500' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pharmacy-700 mb-2">
            🏥 药店陈列大师
          </h1>
          <p className="text-gray-600 text-lg">
            掌握促销陈列技巧，提升门店业绩
          </p>
        </div>

        <div className="flex justify-center gap-6 mb-8">
          <div className="card text-center min-w-[140px]">
            <div className="text-3xl font-bold text-pharmacy-600">{totalScore}</div>
            <div className="text-sm text-gray-500">累计得分</div>
          </div>
          <div className="card text-center min-w-[140px]">
            <div className="text-3xl font-bold text-health-600">{totalPlays}</div>
            <div className="text-sm text-gray-500">游戏次数</div>
          </div>
        </div>

        {lastPlayedLevelId && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleQuickReplay}
              className="btn-secondary flex items-center gap-2"
            >
              <RotateCcw size={20} />
              快速重玩上次关卡
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">选择关卡</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {LEVELS.map((level, index) => {
            const progress = getLevelProgress(level.id);
            const stars = calculateStars(progress.bestScore, level.targetScore);
            const diffColor = getDifficultyColor(level.difficulty);
            
            return (
              <div
                key={level.id}
                onClick={() => handleLevelClick(level)}
                className="card card-hover cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{level.name}</h3>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium text-white bg-${diffColor} mt-1`}
                      style={{
                        backgroundColor: diffColor === 'health-500' ? '#43A047' :
                                        diffColor === 'promo-500' ? '#FFA000' : '#E53935'
                      }}
                    >
                      {getDifficultyLabel(level.difficulty)}
                    </span>
                  </div>
                  <div className="text-right">
                    {renderStars(stars)}
                    {progress.bestScore > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        最高: {progress.bestScore}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{level.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>⏱️ {level.timeLimit}秒</span>
                  <span>🎯 {level.targetScore}分</span>
                  <span>📦 {level.shelfRows}×{level.shelfCols}</span>
                </div>
                {progress.completed && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-health-600">✓ 已通关</span>
                      <span className="text-xs text-gray-500">已玩{progress.playCount}次</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => { audioUtils.playClick(); vibrationUtils.click(); onOpenReview(); }}
            className="btn-secondary flex items-center gap-2"
          >
            <BarChart3 size={20} />
            复盘分析
          </button>
          <button
            onClick={() => { audioUtils.playClick(); vibrationUtils.click(); onOpenSettings(); }}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings size={20} />
            设置
          </button>
        </div>
      </div>
    </div>
  );
};
