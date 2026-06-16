import React, { useEffect } from 'react';
import { Home, RotateCcw, ArrowRight, Star, Zap, Target, Flame, Clock, X } from 'lucide-react';
import type { GameResult, Level } from '@/types/game';
import { calculateStars, getNextLevel } from '@/data/levels';
import { ScoreCalculator } from '@/game/ScoreCalculator';
import { getPromotionRuleById } from '@/data/promotions';
import { useSettingsStore } from '@/store/useSettingsStore';
import { audioUtils } from '@/utils/audio';
import { vibrationUtils } from '@/utils/vibration';

interface ResultSceneProps {
  result: GameResult;
  level: Level;
  onReplay: () => void;
  onNextLevel: () => void;
  onBackToMenu: () => void;
}

export const ResultScene: React.FC<ResultSceneProps> = ({
  result,
  level,
  onReplay,
  onNextLevel,
  onBackToMenu,
}) => {
  const { animationEnabled } = useSettingsStore();
  const nextLevel = getNextLevel(level.id);
  const stars = calculateStars(result.totalScore, level.targetScore);
  const grade = ScoreCalculator.getGrade(result.totalScore, level.targetScore);
  const avgTime = result.timeTaken > 0 && result.correctCount > 0
    ? (result.timeTaken / result.correctCount).toFixed(1)
    : '0';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        audioUtils.playClick();
        vibrationUtils.click();
        onReplay();
      }
      if (e.key === 'Escape') {
        audioUtils.playClick();
        vibrationUtils.click();
        onBackToMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReplay, onBackToMenu]);

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-3 justify-center mb-4">
        {[1, 2, 3].map((i) => (
          <Star
            key={i}
            size={48}
            className={`transition-all duration-500 ${
              i <= count
                ? 'text-promo-500 fill-promo-500 scale-110'
                : 'text-gray-300'
            }`}
            style={{
              animationDelay: `${i * 200}ms`,
              animation: animationEnabled && i <= count ? 'scorePop 0.5s ease-out' : 'none',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-3xl mx-auto">
        <div className="card animate-fade-in">
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold ${grade.color} mb-2 animate-score-pop`}>
              {grade.grade}
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${result.isWin ? 'text-health-600' : 'text-alert-600'}`}>
              {result.isWin ? '🎉 恭喜过关！' : '💪 继续加油！'}
            </h1>
            <p className="text-gray-600 text-lg">{level.name}</p>
          </div>

          {renderStars(stars)}

          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-pharmacy-600 mb-2 animate-score-pop">
              {result.totalScore}
            </div>
            <div className="text-gray-500">
              总分 (目标: {level.targetScore})
            </div>
            <div className="progress-bar mt-4 max-w-md mx-auto">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${Math.min(100, (result.totalScore / level.targetScore) * 100)}%`,
                }}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">详细数据</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="data-card text-center animate-slide-in-left" style={{ animationDelay: '100ms' }}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="text-blue-500" size={24} />
              </div>
              <div className="text-3xl font-bold text-pharmacy-600">{result.speedScore}</div>
              <div className="text-sm text-gray-600 font-medium">速度得分</div>
              <div className="text-xs text-gray-500 mt-1">
                平均 {avgTime}秒/件
              </div>
            </div>

            <div className="data-card text-center animate-slide-in-left" style={{ animationDelay: '200ms' }}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                <X className="text-alert-500" size={24} />
              </div>
              <div className="text-3xl font-bold text-alert-600">{result.errors}</div>
              <div className="text-sm text-gray-600 font-medium">错误次数</div>
              <div className="text-xs text-gray-500 mt-1">
                准确率 {result.totalCount > 0 ? ((result.correctCount / result.totalCount) * 100).toFixed(0) : 0}%
              </div>
            </div>

            <div className="data-card text-center animate-slide-in-left" style={{ animationDelay: '300ms' }}>
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
                <Flame className="text-promo-500" size={24} />
              </div>
              <div className="text-3xl font-bold text-promo-600">{result.maxCombo}</div>
              <div className="text-sm text-gray-600 font-medium">最高连击</div>
              <div className="text-xs text-gray-500 mt-1">
                连击加分 {result.comboScore}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="data-card animate-slide-in-left" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Target size={18} />
                <span className="text-sm font-medium">准确度得分</span>
              </div>
              <div className="text-2xl font-bold text-health-600">
                +{result.accuracyScore}
              </div>
            </div>
            <div className="data-card animate-slide-in-left" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Clock size={18} />
                <span className="text-sm font-medium">用时</span>
              </div>
              <div className="text-2xl font-bold text-gray-700">
                {ScoreCalculator.formatTime(result.timeTaken)}
              </div>
            </div>
          </div>

          {Object.keys(result.promotionAchievement).length > 0 && (
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <h3 className="text-lg font-bold text-gray-800 mb-4">促销规则达成</h3>
              <div className="space-y-3">
                {Object.entries(result.promotionAchievement).map(([ruleId, achievement], index) => {
                  const rule = getPromotionRuleById(ruleId);
                  if (!rule) return null;
                  return (
                    <div key={ruleId} className="flex items-center gap-4">
                      <span className="text-2xl">{rule.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{rule.name}</span>
                          <span className={`text-sm font-bold ${achievement >= 100 ? 'text-health-600' : 'text-gray-600'}`}>
                            {achievement.toFixed(0)}%
                          </span>
                        </div>
                        <div className="progress-bar h-2">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${achievement}%`,
                              backgroundColor: achievement >= 100 ? '#43A047' : '#1E88E5',
                              transitionDelay: `${index * 100}ms`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => { audioUtils.playClick(); vibrationUtils.click(); onBackToMenu(); }}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Home size={20} />
              返回菜单
            </button>
            <button
              onClick={() => { audioUtils.playClick(); vibrationUtils.click(); onReplay(); }}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              再来一次 (R)
            </button>
            {nextLevel && result.isWin && (
              <button
                onClick={() => { audioUtils.playClick(); vibrationUtils.click(); onNextLevel(); }}
                className="btn-success flex items-center justify-center gap-2"
              >
                下一关
                <ArrowRight size={20} />
              </button>
            )}
          </div>

          <div className="text-center mt-6 text-sm text-gray-500">
            按 R 键快速重玩 | 按 Esc 返回菜单
          </div>
        </div>
      </div>
    </div>
  );
};
