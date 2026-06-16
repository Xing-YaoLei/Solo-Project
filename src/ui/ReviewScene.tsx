import React, { useMemo } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, Clock, Target, Flame, Medal } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { LEVELS } from '@/data/levels';
import { getPromotionRuleById } from '@/data/promotions';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ScoreCalculator } from '@/game/ScoreCalculator';
import { audioUtils } from '@/utils/audio';
import { vibrationUtils } from '@/utils/vibration';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ReviewSceneProps {
  onBack: () => void;
}

export const ReviewScene: React.FC<ReviewSceneProps> = ({ onBack }) => {
  const { gameHistory, getLevelProgress, totalScore, totalPlays } = usePlayerStore();
  const { animationEnabled } = useSettingsStore();

  const levelStats = useMemo(() => {
    return LEVELS.map(level => {
      const progress = getLevelProgress(level.id);
      const levelGames = gameHistory.filter(g => g.levelId === level.id);
      const latestGame = levelGames[0] || null;
      const avgPromotionAchievement = levelGames.length > 0
        ? levelGames.reduce((acc, game) => {
            const total = Object.values(game.promotionAchievement).reduce((a, b) => a + b, 0);
            return acc + (total / Object.keys(game.promotionAchievement).length);
          }, 0) / levelGames.length
        : 0;
      return {
        level,
        progress,
        latestGame,
        gamesPlayed: levelGames.length,
        avgPromotionAchievement,
        bestScore: progress.bestScore,
        targetScore: level.targetScore,
      };
    });
  }, [gameHistory, getLevelProgress]);

  const chartData = useMemo(() => {
    const completedLevels = levelStats.filter(s => s.gamesPlayed > 0);
    return {
      labels: completedLevels.map(s => s.level.name),
      datasets: [
        {
          label: '促销达成率 (%)',
          data: completedLevels.map(s => s.avgPromotionAchievement),
          backgroundColor: 'rgba(30, 136, 229, 0.7)',
          borderColor: 'rgba(30, 136, 229, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
        {
          label: '目标达成率 (%)',
          data: completedLevels.map(s => Math.min(100, (s.bestScore / s.targetScore) * 100)),
          backgroundColor: 'rgba(67, 160, 71, 0.7)',
          borderColor: 'rgba(67, 160, 71, 1)',
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }, [levelStats]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animationEnabled ? 1000 : 0,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '各关卡促销达成率对比',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 120,
        title: {
          display: true,
          text: '百分比 (%)',
        },
      },
    },
  };

  const recentGames = useMemo(() => {
    return [...gameHistory]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [gameHistory]);

  const overallStats = useMemo(() => {
    if (gameHistory.length === 0) return null;
    const totalCorrect = gameHistory.reduce((acc, g) => acc + g.correctCount, 0);
    const totalTotal = gameHistory.reduce((acc, g) => acc + g.totalCount, 0);
    const avgAccuracy = totalTotal > 0 ? (totalCorrect / totalTotal) * 100 : 0;
    const avgTime = gameHistory.reduce((acc, g) => acc + g.timeTaken, 0) / gameHistory.length;
    const maxCombo = Math.max(...gameHistory.map(g => g.maxCombo));
    const winRate = (gameHistory.filter(g => g.isWin).length / gameHistory.length) * 100;
    return {
      avgAccuracy,
      avgTime,
      maxCombo,
      winRate,
      totalGames: gameHistory.length,
    };
  }, [gameHistory]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => { audioUtils.playClick(); vibrationUtils.click(); onBack(); }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="font-medium">返回菜单</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={32} className="text-pharmacy-600" />
            复盘分析
          </h1>
        </div>

        {gameHistory.length === 0 ? (
          <div className="card text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">暂无游戏记录</h2>
            <p className="text-gray-500 mb-6">完成几局游戏后再来查看数据分析吧</p>
            <button onClick={onBack} className="btn-primary">
              开始游戏
            </button>
          </div>
        ) : (
          <>
            {overallStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="text-blue-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-pharmacy-600">{overallStats.avgAccuracy.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">平均准确率</div>
                </div>
                <div className="card text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
                    <Clock className="text-health-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-health-600">{ScoreCalculator.formatTime(overallStats.avgTime)}</div>
                  <div className="text-xs text-gray-500">平均用时</div>
                </div>
                <div className="card text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-orange-100 flex items-center justify-center">
                    <Flame className="text-promo-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-promo-600">{overallStats.maxCombo}</div>
                  <div className="text-xs text-gray-500">最高连击</div>
                </div>
                <div className="card text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
                    <Medal className="text-purple-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">{overallStats.winRate.toFixed(0)}%</div>
                  <div className="text-xs text-gray-500">通关率</div>
                </div>
              </div>
            )}

            <div className="card mb-6 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="card animate-fade-in" style={{ animationDelay: '600ms' }}>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-health-500" />
                  各关卡详情
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {levelStats.filter(s => s.gamesPlayed > 0).map((stat, index) => (
                    <div
                      key={stat.level.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{stat.level.name}</span>
                        <span className="text-sm font-bold text-pharmacy-600">
                          {stat.bestScore} / {stat.targetScore}
                        </span>
                      </div>
                      <div className="progress-bar h-2 mb-2">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${Math.min(100, (stat.bestScore / stat.targetScore) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>已玩 {stat.gamesPlayed} 次</span>
                        <span>促销达成 {stat.avgPromotionAchievement.toFixed(0)}%</span>
                      </div>
                      {stat.latestGame && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                          <div className="flex justify-between">
                            <span>最近: {new Date(stat.latestGame.timestamp).toLocaleDateString()}</span>
                            <span>错误 {stat.latestGame.errors} 次</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card animate-fade-in" style={{ animationDelay: '700ms' }}>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-pharmacy-500" />
                  最近记录
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentGames.map((game, index) => {
                    const level = LEVELS.find(l => l.id === game.levelId);
                    return (
                      <div
                        key={game.timestamp + index}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-800">
                            {level?.name || `关卡 ${game.levelId}`}
                          </span>
                          <span className={`font-bold ${game.isWin ? 'text-health-600' : 'text-alert-600'}`}>
                            {game.isWin ? '✓ 通关' : '✗ 失败'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-pharmacy-600 font-bold">{game.totalScore} 分</span>
                          <span className="text-gray-500">
                            {ScoreCalculator.formatTime(game.timeTaken)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            速度 +{game.speedScore}
                          </span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            准确 +{game.accuracyScore}
                          </span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                            连击 +{game.comboScore}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(game.timestamp).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {Object.keys(recentGames[0]?.promotionAchievement || {}).length > 0 && (
              <div className="card animate-fade-in" style={{ animationDelay: '800ms' }}>
                <h2 className="text-xl font-bold text-gray-800 mb-4">促销规则达成详情</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(recentGames[0].promotionAchievement).map(([ruleId, achievement]) => {
                    const rule = getPromotionRuleById(ruleId);
                    if (!rule) return null;
                    return (
                      <div key={ruleId} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{rule.icon}</span>
                          <span className="font-medium text-gray-800">{rule.name}</span>
                        </div>
                        <div className="progress-bar h-2 mb-2">
                          <div
                            className={`h-full rounded-full ${achievement >= 100 ? 'bg-health-500' : 'bg-pharmacy-500'}`}
                            style={{ width: `${achievement}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-600">{rule.description}</div>
                        <div className="text-right text-sm font-bold text-gray-800 mt-1">
                          {achievement.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
