import { useGameStore } from '../store/gameStore'
import { levels } from '../data/levels'
import { elderlyProfiles } from '../data/elderlyProfiles'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function ReviewScreen() {
  const { 
    stats, 
    currentLevel, 
    completedTasks, 
    actions,
    replayRecords,
    restartGame, 
    exitToMenu,
    goToReplay
  } = useGameStore()

  const level = currentLevel || levels[0]
  const currentLevelReplays = replayRecords.filter(r => r.levelId === level.id)
  const otherLevelReplays = replayRecords.filter(r => r.levelId !== level.id)

  const getStars = (score: number) => {
    if (score >= level.starThresholds[2]) return 3
    if (score >= level.starThresholds[1]) return 2
    if (score >= level.starThresholds[0]) return 1
    return 0
  }

  const stars = getStars(stats.score)
  const passed = stats.accuracy >= level.targetAccuracy

  const getTaskTypeName = (type: string) => {
    const names: Record<string, string> = {
      medication_reminder: '用药提醒',
      activity_checkin: '活动签到',
      risk_event: '风险事件',
      profile_review: '档案查看'
    }
    return names[type] || type
  }

  const getTaskTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      medication_reminder: 'text-blue-400',
      activity_checkin: 'text-green-400',
      risk_event: 'text-red-400',
      profile_review: 'text-purple-400'
    }
    return colors[type] || 'text-gray-400'
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 z-20 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {passed ? '🎉 护理达标！' : '💪 继续加油'}
            </h1>
            <p className="text-gray-400">{level.name} - 游戏结束</p>
          </div>

          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <span 
                key={i} 
                className={`text-6xl ${i <= stars ? 'text-yellow-400' : 'text-gray-700'}
                  ${stats.score > 0 ? 'animate-bounce' : ''}`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                ⭐
              </span>
            ))}
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              🏆 本局数据
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-white mb-1">
                  {stats.score.toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">总得分</div>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <div className={`text-4xl font-bold mb-1
                  ${stats.accuracy >= level.targetAccuracy ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.round(stats.accuracy * 100)}%
                </div>
                <div className="text-gray-400 text-sm">
                  正确率 (目标 {level.targetAccuracy * 100}%)
                </div>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-orange-400 mb-1">
                  {stats.maxCombo}x
                </div>
                <div className="text-gray-400 text-sm">最高连击</div>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-1">
                  {stats.averageResponseTime.toFixed(1)}s
                </div>
                <div className="text-gray-400 text-sm">平均响应</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">
                  {stats.correctCount}
                </div>
                <div className="text-gray-400 text-sm">正确</div>
              </div>
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400 mb-1">
                  {stats.wrongCount}
                </div>
                <div className="text-gray-400 text-sm">错误/超时</div>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.totalTasks}
                </div>
                <div className="text-gray-400 text-sm">总任务数</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">📊 得分构成</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">基础得分</span>
                  <span className="text-white font-bold">
                    {(stats.score - stats.speedBonus - stats.comboBonus + stats.penalty).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-yellow-400">⚡ 速度加成</span>
                  <span className="text-yellow-400 font-bold">+{stats.speedBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-400">🔥 连击加成</span>
                  <span className="text-orange-400 font-bold">+{stats.comboBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400">❌ 错误扣分</span>
                  <span className="text-red-400 font-bold">-{stats.penalty.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                  <span className="text-white font-bold">最终得分</span>
                  <span className="text-white font-bold text-2xl">{stats.score.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {actions.length > 0 && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">📋 操作记录</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {actions.map((action, index) => {
                  const task = completedTasks.find(t => t.id === action.taskId)
                  const elderly = task ? elderlyProfiles.find(e => e.id === task.elderlyId) : null
                  const isGameEndTimeout = action.optionId === 'timeout' && 
                    currentLevel && action.timestamp >= (currentLevel.duration - 0.1)
                  return (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg
                        ${action.isCorrect ? 'bg-green-900/30' : isGameEndTimeout ? 'bg-yellow-900/30' : 'bg-red-900/30'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {action.isCorrect ? '✅' : isGameEndTimeout ? '⏰' : '❌'}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{elderly?.avatar} {elderly?.name}</span>
                            {task && (
                              <span className={`text-sm ${getTaskTypeColor(task.type)}`}>
                                [{getTaskTypeName(task.type)}]
                              </span>
                            )}
                            {isGameEndTimeout && (
                              <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                                倒计时结束
                              </span>
                            )}
                          </div>
                          <div className="text-gray-400 text-xs">
                            时间: {formatTime(action.timestamp)} | 用时: {action.timeSpent.toFixed(1)}s
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${action.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {action.isCorrect ? `+${task?.points || 0}` : `-${Math.floor((task?.points || 0) * 0.5)}`}
                        </div>
                        {action.combo > 0 && (
                          <div className="text-orange-400 text-xs">{action.combo}连击</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {currentLevelReplays.length > 0 && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">
                📹 本关历史记录（最多保留3次）
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentLevelReplays.map((replay, index) => (
                  <div 
                    key={replay.id}
                    className="bg-gray-700/50 rounded-xl p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => goToReplay(replay.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-gray-400 text-sm">第 {index + 1} 次</span>
                      <span className="text-gray-500 text-xs">{formatDateTime(replay.timestamp)}</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {replay.score.toLocaleString()}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={replay.accuracy >= level.targetAccuracy ? 'text-green-400' : 'text-red-400'}>
                        {Math.round(replay.accuracy * 100)}%
                      </span>
                      <span className="text-orange-400">{replay.combo}x连击</span>
                    </div>
                    <button className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                      👁️ 查看详情
                    </button>
                  </div>
                ))}
              </div>
              
              {currentLevelReplays.length >= 2 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-bold text-white mb-4">📊 历次对比</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400">
                          <th className="text-left py-2 px-3">次数</th>
                          <th className="text-right py-2 px-3">得分</th>
                          <th className="text-right py-2 px-3">正确率</th>
                          <th className="text-right py-2 px-3">最高连击</th>
                          <th className="text-right py-2 px-3">任务数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLevelReplays.map((replay, index) => (
                          <tr key={replay.id} className="border-t border-gray-700">
                            <td className="py-2 px-3 text-white">第 {index + 1} 次</td>
                            <td className="py-2 px-3 text-right text-white font-bold">
                              {replay.score.toLocaleString()}
                            </td>
                            <td className={`py-2 px-3 text-right font-bold
                              ${replay.accuracy >= level.targetAccuracy ? 'text-green-400' : 'text-red-400'}`}>
                              {Math.round(replay.accuracy * 100)}%
                            </td>
                            <td className="py-2 px-3 text-right text-orange-400 font-bold">
                              {replay.combo}x
                            </td>
                            <td className="py-2 px-3 text-right text-gray-300">
                              {replay.finalStats.totalTasks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {otherLevelReplays.length > 0 && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">
                📈 全关卡达标对比
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left py-2 px-3">关卡</th>
                      <th className="text-center py-2 px-3">难度</th>
                      <th className="text-right py-2 px-3">最高分</th>
                      <th className="text-right py-2 px-3">最佳正确率</th>
                      <th className="text-right py-2 px-3">目标</th>
                      <th className="text-center py-2 px-3">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((lvl) => {
                      const lvlReplays = replayRecords.filter(r => r.levelId === lvl.id)
                      const bestScore = lvlReplays.length > 0 
                        ? Math.max(...lvlReplays.map(r => r.score)) 
                        : 0
                      const bestAccuracy = lvlReplays.length > 0
                        ? Math.max(...lvlReplays.map(r => r.accuracy))
                        : 0
                      const isPassed = bestAccuracy >= lvl.targetAccuracy
                      
                      return (
                        <tr key={lvl.id} className="border-t border-gray-700">
                          <td className="py-2 px-3 text-white font-medium">{lvl.name}</td>
                          <td className="py-2 px-3 text-center">
                            {Array.from({ length: lvl.difficulty }).map((_, i) => (
                              <span key={i} className="text-red-400">💀</span>
                            ))}
                          </td>
                          <td className="py-2 px-3 text-right text-yellow-400 font-bold">
                            {bestScore > 0 ? bestScore.toLocaleString() : '-'}
                          </td>
                          <td className={`py-2 px-3 text-right font-bold
                            ${isPassed ? 'text-green-400' : bestScore > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                            {bestScore > 0 ? `${Math.round(bestAccuracy * 100)}%` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right text-gray-400">
                            {lvl.targetAccuracy * 100}%
                          </td>
                          <td className="py-2 px-3 text-center">
                            {!lvl.unlocked ? '🔒' : isPassed ? '✅ 达标' : bestScore > 0 ? '⚠️ 未达标' : '➖ 未玩'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={restartGame}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-colors"
            >
              🔄 再来一局
            </button>
            <button
              onClick={exitToMenu}
              className="px-8 py-4 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-bold text-lg transition-colors"
            >
              🏠 返回菜单
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
