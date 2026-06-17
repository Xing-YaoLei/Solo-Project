import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { levels } from '../data/levels'
import { elderlyProfiles } from '../data/elderlyProfiles'
import { PlayerAction, GameTask } from '../types/game'

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

export function ReplayScreen() {
  const { 
    selectedReplay, 
    replayActionIndex, 
    setReplayActionIndex,
    exitToMenu,
    replayRecords
  } = useGameStore()

  const [compareMode, setCompareMode] = useState(false)
  const [compareReplayId, setCompareReplayId] = useState<string | null>(null)

  if (!selectedReplay) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 z-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">没有找到回放记录</p>
          <button
            onClick={exitToMenu}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors"
          >
            返回菜单
          </button>
        </div>
      </div>
    )
  }

  const level = levels.find(l => l.id === selectedReplay.levelId) || levels[0]
  const currentLevelReplays = replayRecords.filter(r => r.levelId === level.id && r.id !== selectedReplay.id)
  const compareReplay = compareReplayId ? replayRecords.find(r => r.id === compareReplayId) : null

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

  const getActionDetails = (action: PlayerAction, completedTasks: GameTask[]) => {
    const task = completedTasks.find(t => t.id === action.taskId)
    const taskType = task?.type || 'unknown'
    const elderlyId = task?.elderlyId || 'unknown'
    const points = task?.points || 100
    const option = task?.options.find(o => o.id === action.optionId)
    
    return { taskType, elderlyId, points, option, task }
  }

  const renderActionTimeline = (actions: PlayerAction[], completedTasks: GameTask[], prefix: string = '') => (
    <div className="space-y-2">
      {actions.map((action, index) => {
        const isSelected = replayActionIndex === index
        const details = getActionDetails(action, completedTasks)
        const elderly = elderlyProfiles.find(e => e.id === details.elderlyId)
        const isGameEndTimeout = action.optionId === 'timeout' && 
          action.timestamp >= (level.duration - 0.1)
        
        return (
          <div
            key={`${prefix}-${index}`}
            className={`p-3 rounded-lg cursor-pointer transition-all
              ${isSelected ? 'ring-2 ring-blue-500' : ''}
              ${action.isCorrect ? 'bg-green-900/30 hover:bg-green-900/50' : 
                isGameEndTimeout ? 'bg-yellow-900/30 hover:bg-yellow-900/50' : 
                'bg-red-900/30 hover:bg-red-900/50'}`}
            onClick={() => setReplayActionIndex(isSelected ? -1 : index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {action.isCorrect ? '✅' : isGameEndTimeout ? '⏰' : '❌'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">
                      {elderly?.avatar || '👤'} {elderly?.name || '未知'} · 操作 #{index + 1}
                    </span>
                    {isGameEndTimeout && (
                      <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                        倒计时结束
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400">
                      {formatTime(action.timestamp)} · {action.timeSpent.toFixed(1)}s
                    </span>
                    {details.task && (
                      <span className={getTaskTypeColor(details.taskType)}>
                        [{getTaskTypeName(details.taskType)}]
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${action.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {action.isCorrect ? `+${details.points}` : `-${Math.floor(details.points * 0.5)}`}
                </div>
                {action.combo > 0 && (
                  <div className="text-orange-400 text-xs">{action.combo}连击</div>
                )}
              </div>
            </div>
            
            {isSelected && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                {details.task && (
                  <div className="mb-3 p-2 bg-gray-700/50 rounded">
                    <div className="text-white text-sm font-medium">{details.task.title}</div>
                    <div className="text-gray-400 text-xs mt-1">{details.task.description}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">任务类型:</span>
                    <span className={`ml-1 ${getTaskTypeColor(details.taskType)}`}>
                      {getTaskTypeName(details.taskType)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">选择:</span>
                    <span className="ml-1 text-gray-300">
                      {action.optionId === 'timeout' 
                        ? (isGameEndTimeout ? '倒计时结束未处理' : '超时未处理') 
                        : details.option?.text || '选项 ' + action.optionId.slice(-1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">响应时间:</span>
                    <span className="ml-1 text-white">{action.timeSpent.toFixed(2)}s</span>
                  </div>
                  <div>
                    <span className="text-gray-500">当时连击:</span>
                    <span className="ml-1 text-orange-400">{action.combo}x</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 z-20 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">📹 回放分析</h1>
            <p className="text-gray-400">
              {level.name} · {formatDateTime(selectedReplay.timestamp)}
            </p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {selectedReplay.score.toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">总得分</div>
              </div>
              <div className={`bg-gray-700/50 rounded-xl p-4 text-center`}>
                <div className={`text-3xl font-bold mb-1
                  ${selectedReplay.accuracy >= level.targetAccuracy ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.round(selectedReplay.accuracy * 100)}%
                </div>
                <div className="text-gray-400 text-sm">正确率</div>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-orange-400 mb-1">
                  {selectedReplay.combo}x
                </div>
                <div className="text-gray-400 text-sm">最高连击</div>
              </div>
              <div className="bg-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {selectedReplay.finalStats.totalTasks}
                </div>
                <div className="text-gray-400 text-sm">任务数</div>
              </div>
            </div>
          </div>

          {currentLevelReplays.length > 0 && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">🔄 对比模式</h2>
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors
                    ${compareMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {compareMode ? '关闭对比' : '开启对比'}
                </button>
              </div>

              {compareMode && (
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">选择要对比的记录:</label>
                  <div className="flex flex-wrap gap-2">
                    {currentLevelReplays.map((replay, index) => (
                      <button
                        key={replay.id}
                        onClick={() => setCompareReplayId(replay.id === compareReplayId ? null : replay.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors
                          ${replay.id === compareReplayId 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >
                        第 {index + 1} 次 · {replay.score.toLocaleString()}分
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-blue-400">📌</span>
                当前回放
                <span className="text-sm font-normal text-gray-400">
                  ({selectedReplay.finalStats.correctCount}正确 / {selectedReplay.finalStats.wrongCount}错误)
                </span>
              </h3>
              <div className="max-h-[500px] overflow-y-auto pr-2">
                {renderActionTimeline(selectedReplay.actions, selectedReplay.completedTasks || [], 'current')}
              </div>
            </div>

            {compareMode && compareReplay && (
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-orange-400">📌</span>
                  对比回放
                  <span className="text-sm font-normal text-gray-400">
                    ({compareReplay.finalStats.correctCount}正确 / {compareReplay.finalStats.wrongCount}错误)
                  </span>
                </h3>
                <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="text-white font-bold">{compareReplay.score.toLocaleString()}</div>
                      <div className="text-gray-500">得分</div>
                    </div>
                    <div>
                      <div className={`font-bold ${compareReplay.accuracy >= level.targetAccuracy ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.round(compareReplay.accuracy * 100)}%
                      </div>
                      <div className="text-gray-500">正确率</div>
                    </div>
                    <div>
                      <div className="text-orange-400 font-bold">{compareReplay.combo}x</div>
                      <div className="text-gray-500">连击</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-600 text-center text-xs">
                    <span className="text-gray-500">差异: </span>
                    <span className={selectedReplay.score > compareReplay.score ? 'text-green-400' : 'text-red-400'}>
                      {selectedReplay.score > compareReplay.score ? '+' : ''}{selectedReplay.score - compareReplay.score}分
                    </span>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto pr-2">
                  {renderActionTimeline(compareReplay.actions, compareReplay.completedTasks || [], 'compare')}
                </div>
              </div>
            )}
          </div>

          {compareMode && compareReplay && (
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">📊 详细对比分析</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left py-2 px-3">指标</th>
                      <th className="text-right py-2 px-3 text-blue-400">当前回放</th>
                      <th className="text-right py-2 px-3 text-orange-400">对比回放</th>
                      <th className="text-right py-2 px-3">差异</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-700">
                      <td className="py-2 px-3 text-gray-300">总得分</td>
                      <td className="py-2 px-3 text-right text-white font-bold">{selectedReplay.score.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-white font-bold">{compareReplay.score.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.score > compareReplay.score ? 'text-green-400' : 
                          selectedReplay.score < compareReplay.score ? 'text-red-400' : 'text-gray-400'}`}>
                        {selectedReplay.score > compareReplay.score ? '+' : ''}{selectedReplay.score - compareReplay.score}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700">
                      <td className="py-2 px-3 text-gray-300">正确率</td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.accuracy >= level.targetAccuracy ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.round(selectedReplay.accuracy * 100)}%
                      </td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${compareReplay.accuracy >= level.targetAccuracy ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.round(compareReplay.accuracy * 100)}%
                      </td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.accuracy > compareReplay.accuracy ? 'text-green-400' : 
                          selectedReplay.accuracy < compareReplay.accuracy ? 'text-red-400' : 'text-gray-400'}`}>
                        {selectedReplay.accuracy > compareReplay.accuracy ? '+' : ''}
                        {Math.round((selectedReplay.accuracy - compareReplay.accuracy) * 100)}%
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700">
                      <td className="py-2 px-3 text-gray-300">最高连击</td>
                      <td className="py-2 px-3 text-right text-orange-400 font-bold">{selectedReplay.combo}x</td>
                      <td className="py-2 px-3 text-right text-orange-400 font-bold">{compareReplay.combo}x</td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.combo > compareReplay.combo ? 'text-green-400' : 
                          selectedReplay.combo < compareReplay.combo ? 'text-red-400' : 'text-gray-400'}`}>
                        {selectedReplay.combo > compareReplay.combo ? '+' : ''}{selectedReplay.combo - compareReplay.combo}x
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700">
                      <td className="py-2 px-3 text-gray-300">正确数</td>
                      <td className="py-2 px-3 text-right text-green-400 font-bold">{selectedReplay.finalStats.correctCount}</td>
                      <td className="py-2 px-3 text-right text-green-400 font-bold">{compareReplay.finalStats.correctCount}</td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.finalStats.correctCount > compareReplay.finalStats.correctCount ? 'text-green-400' : 
                          selectedReplay.finalStats.correctCount < compareReplay.finalStats.correctCount ? 'text-red-400' : 'text-gray-400'}`}>
                        {selectedReplay.finalStats.correctCount > compareReplay.finalStats.correctCount ? '+' : ''}
                        {selectedReplay.finalStats.correctCount - compareReplay.finalStats.correctCount}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700">
                      <td className="py-2 px-3 text-gray-300">错误数</td>
                      <td className="py-2 px-3 text-right text-red-400 font-bold">{selectedReplay.finalStats.wrongCount}</td>
                      <td className="py-2 px-3 text-right text-red-400 font-bold">{compareReplay.finalStats.wrongCount}</td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.finalStats.wrongCount < compareReplay.finalStats.wrongCount ? 'text-green-400' : 
                          selectedReplay.finalStats.wrongCount > compareReplay.finalStats.wrongCount ? 'text-red-400' : 'text-gray-400'}`}>
                        {selectedReplay.finalStats.wrongCount - compareReplay.finalStats.wrongCount}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700">
                      <td className="py-2 px-3 text-gray-300">平均响应时间</td>
                      <td className="py-2 px-3 text-right text-blue-400 font-bold">
                        {selectedReplay.finalStats.averageResponseTime.toFixed(2)}s
                      </td>
                      <td className="py-2 px-3 text-right text-blue-400 font-bold">
                        {compareReplay.finalStats.averageResponseTime.toFixed(2)}s
                      </td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.finalStats.averageResponseTime < compareReplay.finalStats.averageResponseTime ? 'text-green-400' : 
                          selectedReplay.finalStats.averageResponseTime > compareReplay.finalStats.averageResponseTime ? 'text-red-400' : 'text-gray-400'}`}>
                        {(selectedReplay.finalStats.averageResponseTime - compareReplay.finalStats.averageResponseTime).toFixed(2)}s
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700">
                      <td className="py-2 px-3 text-gray-300">速度加成</td>
                      <td className="py-2 px-3 text-right text-yellow-400 font-bold">+{selectedReplay.finalStats.speedBonus}</td>
                      <td className="py-2 px-3 text-right text-yellow-400 font-bold">+{compareReplay.finalStats.speedBonus}</td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.finalStats.speedBonus > compareReplay.finalStats.speedBonus ? 'text-green-400' : 
                          selectedReplay.finalStats.speedBonus < compareReplay.finalStats.speedBonus ? 'text-red-400' : 'text-gray-400'}`}>
                        {selectedReplay.finalStats.speedBonus > compareReplay.finalStats.speedBonus ? '+' : ''}
                        {selectedReplay.finalStats.speedBonus - compareReplay.finalStats.speedBonus}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-700">
                      <td className="py-2 px-3 text-gray-300">连击加成</td>
                      <td className="py-2 px-3 text-right text-orange-400 font-bold">+{selectedReplay.finalStats.comboBonus}</td>
                      <td className="py-2 px-3 text-right text-orange-400 font-bold">+{compareReplay.finalStats.comboBonus}</td>
                      <td className={`py-2 px-3 text-right font-bold
                        ${selectedReplay.finalStats.comboBonus > compareReplay.finalStats.comboBonus ? 'text-green-400' : 
                          selectedReplay.finalStats.comboBonus < compareReplay.finalStats.comboBonus ? 'text-red-400' : 'text-gray-400'}`}>
                        {selectedReplay.finalStats.comboBonus > compareReplay.finalStats.comboBonus ? '+' : ''}
                        {selectedReplay.finalStats.comboBonus - compareReplay.finalStats.comboBonus}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
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
