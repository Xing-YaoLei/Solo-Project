import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { GameTask } from '../types/game'
import { elderlyProfiles } from '../data/elderlyProfiles'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function TaskCard({ 
  task, 
  gameTime,
  onSelectOption 
}: { 
  task: GameTask
  gameTime: number
  onSelectOption: (taskId: string, optionId: string) => void
}) {
  const settings = useGameStore(state => state.settings)
  const elapsed = gameTime - task.timestamp
  const remaining = Math.max(0, task.timeLimit - elapsed)
  const urgency = remaining / task.timeLimit

  const typeColors: Record<string, string> = {
    medication_reminder: 'from-blue-500 to-blue-700',
    activity_checkin: 'from-green-500 to-green-700',
    risk_event: 'from-red-500 to-red-700',
    profile_review: 'from-purple-500 to-purple-700'
  }

  const typeIcons: Record<string, string> = {
    medication_reminder: '💊',
    activity_checkin: '📋',
    risk_event: '⚠️',
    profile_review: '📁'
  }

  const elderly = elderlyProfiles.find(e => e.id === task.elderlyId)

  const urgencyColor = urgency > 0.5 ? 'bg-green-500' : 
                       urgency > 0.25 ? 'bg-yellow-500' : 'bg-red-500'

  const cardAnimation = settings.animationEnabled 
    ? 'transform transition-all duration-200 hover:scale-105' 
    : ''

  return (
    <div 
      className={`bg-gray-800/95 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm ${cardAnimation}`}
      style={{ minWidth: '280px', maxWidth: '320px' }}
    >
      <div className={`bg-gradient-to-r ${typeColors[task.type]} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeIcons[task.type]}</span>
          <span className="text-white font-bold text-sm">{task.title}</span>
        </div>
        <div className="text-white text-sm font-mono">
          {formatTime(remaining)}
        </div>
      </div>

      <div className="h-1 bg-gray-700">
        <div 
          className={`h-full ${urgencyColor} transition-all duration-300`}
          style={{ width: `${urgency * 100}%` }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{elderly?.avatar}</span>
          <span className="text-gray-200 font-medium">{elderly?.name}</span>
          <span className="text-xs text-gray-400">{elderly?.room}</span>
        </div>

        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{task.description}</p>

        <div className="space-y-2">
          {task.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectOption(task.id, option.id)}
              className={`w-full p-3 rounded-lg text-left text-sm transition-all duration-200
                ${settings.animationEnabled 
                  ? 'hover:bg-gray-700 active:scale-98' 
                  : 'hover:bg-gray-700'}
                bg-gray-700/50 border border-gray-600 text-gray-200`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">{option.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{option.text}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>基础分数: {task.points}</span>
          <span>速度加成: +{Math.floor(task.points * 0.5)}</span>
        </div>
      </div>
    </div>
  )
}

export function GameHUD() {
  const { 
    timeRemaining, 
    score, 
    combo, 
    maxCombo,
    activeTasks, 
    currentLevel,
    updateTime,
    selectTaskOption,
    pauseGame,
    actions,
    completedTasks
  } = useGameStore()

  const gameTime = (currentLevel?.duration || 0) - timeRemaining
  const totalTasks = actions.length + activeTasks.length
  const correctCount = actions.filter(a => a.isCorrect).length
  const accuracy = totalTasks > 0 
    ? Math.round(correctCount / totalTasks * 100) 
    : 0

  useEffect(() => {
    let lastTime = performance.now()
    let animationId: number

    const tick = () => {
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now
      updateTime(delta)
      animationId = requestAnimationFrame(tick)
    }

    animationId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationId)
  }, [updateTime])

  const isLowTime = timeRemaining < 30
  const isVeryLowTime = timeRemaining < 10

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-gray-400 text-xs">关卡</div>
              <div className="text-white font-bold">{currentLevel?.name}</div>
            </div>
            
            <div className="text-center">
              <div className="text-gray-400 text-xs">剩余时间</div>
              <div className={`font-mono text-2xl font-bold
                ${isVeryLowTime ? 'text-red-500 animate-pulse' : 
                  isLowTime ? 'text-yellow-500' : 'text-white'}`}>
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-gray-400 text-xs">得分</div>
              <div className="text-white font-bold text-2xl">{score.toLocaleString()}</div>
            </div>

            <div className="text-center">
              <div className="text-gray-400 text-xs">连击</div>
              <div className={`font-bold text-xl
                ${combo >= 10 ? 'text-yellow-400' : 
                  combo >= 5 ? 'text-green-400' : 'text-white'}`}>
                {combo}x
              </div>
              <div className="text-gray-500 text-xs">最高: {maxCombo}x</div>
            </div>

            <div className="text-center">
              <div className="text-gray-400 text-xs">正确率</div>
              <div className="text-white font-bold">{accuracy}%</div>
            </div>

            <button
              onClick={pauseGame}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              暂停
            </button>
          </div>
        </div>
      </div>

      {combo >= 3 && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className={`text-4xl font-bold text-yellow-400 drop-shadow-lg
            ${activeTasks.length > 0 ? 'animate-bounce' : ''}`}>
            🔥 {combo}连击！
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
        <div className="flex gap-4 overflow-x-auto pb-2 justify-center">
          {activeTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              gameTime={gameTime}
              onSelectOption={selectTaskOption}
            />
          ))}
        </div>
        
        {activeTasks.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            等待下一个任务...
          </div>
        )}
      </div>
    </div>
  )
}
