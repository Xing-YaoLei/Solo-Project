import { useGameStore } from '../../store/gameStore';
import { MATERIALS, getConfigByDifficulty } from '../../config/gameConfig';
import { generateReviewData, formatTime } from '../../utils/gameUtils';

interface ReviewPageProps {
  onBackToMenu: () => void;
  onPlayAgain: () => void;
}

export function ReviewPage({ onBackToMenu, onPlayAgain }: ReviewPageProps) {
  const state = useGameStore();
  const difficulty = useGameStore(state => state.difficulty);
  const currentDay = useGameStore(state => state.currentDay);

  const reviewData = generateReviewData(state, currentDay);
  const config = getConfigByDifficulty(difficulty);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'from-yellow-400 to-orange-500';
      case 'A': return 'from-green-400 to-emerald-500';
      case 'B': return 'from-blue-400 to-cyan-500';
      case 'C': return 'from-yellow-400 to-amber-500';
      case 'D': return 'from-red-400 to-rose-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getDifficultyText = () => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">🎯 复盘分析</h1>
          <p className="text-blue-300 text-xl">深入分析您的调度决策，提升材料管理能力</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
            <div className={`text-7xl font-bold bg-gradient-to-r ${getGradeColor(reviewData.grade)} bg-clip-text text-transparent mb-2`}>
              {reviewData.grade}
            </div>
            <div className="text-gray-400">综合评级</div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
            <div className="text-5xl font-bold text-white mb-2">
              {reviewData.score}
              <span className="text-2xl text-gray-400">/{reviewData.totalScore}</span>
            </div>
            <div className="text-gray-400">最终得分</div>
            <div className="mt-2">
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getGradeColor(reviewData.grade)}`}
                  style={{ width: `${reviewData.efficiency}%` }}
                />
              </div>
              <div className="text-blue-300 text-sm mt-1">效率 {reviewData.efficiency}%</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {formatTime(reviewData.statistics.completionTime || 0)}
            </div>
            <div className="text-gray-400">完成时间</div>
            <div className="mt-2 text-blue-300">
              难度: {getDifficultyText()} | 工期: {currentDay}天
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">📦 周转天数分析</h2>
            <div className="space-y-4">
              {Object.entries(reviewData.statistics.turnoverDays).map(([type, days]) => {
                const material = MATERIALS[type as keyof typeof MATERIALS];
                const avg = reviewData.statistics.averageTurnoverDays;
                const isGood = days < avg * 0.8;
                const isBad = days > avg * 1.2;

                return (
                  <div key={type} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{material.icon}</span>
                        <span className="text-white font-medium">{material.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${
                          isGood ? 'text-green-400' : isBad ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {days} 天
                        </span>
                        {isGood && <span className="text-green-400 text-xs">✓ 良好</span>}
                        {isBad && <span className="text-red-400 text-xs">⚠ 待改进</span>}
                      </div>
                    </div>
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isGood ? 'bg-green-500' : isBad ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(100, (days / 15) * 100)}%` }}
                      />
                      <div
                        className="absolute top-0 h-full w-0.5 bg-white/50"
                        style={{ left: `${(avg / 15) * 100}%` }}
                      />
                    </div>
                    <div className="text-gray-400 text-xs mt-1 text-right">
                      平均: {avg} 天
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-blue-300">平均周转天数</span>
                <span className="text-white font-bold text-xl">
                  {reviewData.statistics.averageTurnoverDays} 天
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">📊 统计数据</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">🚚</div>
                <div className="text-white font-bold text-2xl">{state.deliveries.length}</div>
                <div className="text-gray-400 text-sm">总配送批次</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">✅</div>
                <div className="text-green-400 font-bold text-2xl">{reviewData.statistics.perfectDeliveries}</div>
                <div className="text-gray-400 text-sm">完美配送</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">⚠️</div>
                <div className="text-red-400 font-bold text-2xl">{reviewData.statistics.totalShortages}</div>
                <div className="text-gray-400 text-sm">短缺次数</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">📈</div>
                <div className="text-blue-400 font-bold text-2xl">{state.events.length}</div>
                <div className="text-gray-400 text-sm">突发事件</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">🎯</div>
                <div className="text-yellow-400 font-bold text-2xl">{reviewData.statistics.decisionsMade}</div>
                <div className="text-gray-400 text-sm">决策次数</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl mb-1">📦</div>
                <div className="text-orange-400 font-bold text-2xl">{reviewData.statistics.totalOverstock}</div>
                <div className="text-gray-400 text-sm">积压次数</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🏆 成就解锁</h2>
            <div className="space-y-3">
              {reviewData.achievements.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <div className="text-4xl mb-2">🏆</div>
                  <p>暂无成就</p>
                  <p className="text-sm">继续努力解锁更多成就吧！</p>
                </div>
              ) : (
                reviewData.achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`rounded-xl p-4 flex items-center gap-4 ${
                      achievement.unlocked
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50'
                        : 'bg-white/5 opacity-50'
                    }`}
                  >
                    <div className="text-4xl">
                      {achievement.unlocked ? '🏆' : '🔒'}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-bold">{achievement.name}</div>
                      <div className="text-gray-400 text-sm">{achievement.description}</div>
                    </div>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="text-yellow-400 text-xs">
                        已解锁
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">🕹️ 玩家卡点分析</h2>
            {reviewData.stuckPoints.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">🎉</div>
                <p>太棒了！</p>
                <p className="text-sm">本次游戏没有明显的决策卡点</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-blue-300 text-sm mb-3">
                  共记录 {reviewData.stuckPoints.length} 处决策卡点
                </div>
                {reviewData.stuckPoints.slice(0, 5).map((point, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">第 {point.day} 天</span>
                      <span className="text-yellow-400 text-sm">
                        耗时 {formatTime(point.duration)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{point.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">💡 改进建议</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {reviewData.statistics.totalShortages > 0 && (
              <div className="bg-red-500/10 rounded-xl p-4">
                <div className="text-3xl mb-2">⚠️</div>
                <h3 className="text-white font-bold mb-2">短缺问题</h3>
                <p className="text-gray-400 text-sm">
                  共发生 {reviewData.statistics.totalShortages} 次短缺。建议增加安全库存，
                  或提前 {config.gameDays > 14 ? '3-5' : '2-3'} 天安排配送。
                </p>
              </div>
            )}
            {reviewData.statistics.totalOverstock > 0 && (
              <div className="bg-orange-500/10 rounded-xl p-4">
                <div className="text-3xl mb-2">📦</div>
                <h3 className="text-white font-bold mb-2">库存积压</h3>
                <p className="text-gray-400 text-sm">
                  有 {reviewData.statistics.totalOverstock} 次库存超过上限。
                  建议小批量多次配送，提高周转率。
                </p>
              </div>
            )}
            {reviewData.statistics.averageTurnoverDays > 7 && (
              <div className="bg-yellow-500/10 rounded-xl p-4">
                <div className="text-3xl mb-2">🔄</div>
                <h3 className="text-white font-bold mb-2">周转效率</h3>
                <p className="text-gray-400 text-sm">
                  平均周转天数 {reviewData.statistics.averageTurnoverDays} 天，
                  建议优化配送节奏，将周转天数控制在 5-7 天。
                </p>
              </div>
            )}
            {reviewData.stuckPoints.length > 2 && (
              <div className="bg-blue-500/10 rounded-xl p-4">
                <div className="text-3xl mb-2">⏱️</div>
                <h3 className="text-white font-bold mb-2">决策效率</h3>
                <p className="text-gray-400 text-sm">
                  多次出现决策卡顿。建议使用需求预测道具，
                  提前规划未来几天的配送计划。
                </p>
              </div>
            )}
            {state.events.filter(e => !e.resolved).length > 0 && (
              <div className="bg-purple-500/10 rounded-xl p-4">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="text-white font-bold mb-2">事件处理</h3>
                <p className="text-gray-400 text-sm">
                  有未处理的突发事件。建议每天检查事件面板，
                  及时处理可以避免扣分。
                </p>
              </div>
            )}
            <div className="bg-green-500/10 rounded-xl p-4">
              <div className="text-3xl mb-2">📚</div>
              <h3 className="text-white font-bold mb-2">持续学习</h3>
              <p className="text-gray-400 text-sm">
                多玩训练模式的关卡，系统学习材料调度知识。
                尝试不同的库存策略，找到最适合的节奏。
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={onBackToMenu}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl text-lg transition-colors"
          >
            🏠 返回菜单
          </button>
          <button
            onClick={onPlayAgain}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl text-lg transition-all transform hover:scale-105"
          >
            🔄 再来一局
          </button>
        </div>
      </div>
    </div>
  );
}
