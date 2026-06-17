import { useGameStore } from '../store/gameStore'

export function MenuScreen() {
  const { levels, startGame, setGameState, replayRecords } = useGameStore()

  const getStars = (levelId: string) => {
    const levelReplays = replayRecords.filter(r => r.levelId === levelId)
    if (levelReplays.length === 0) return 0
    const level = levels.find(l => l.id === levelId)
    if (!level) return 0
    const bestScore = Math.max(...levelReplays.map(r => r.score))
    if (bestScore >= level.starThresholds[2]) return 3
    if (bestScore >= level.starThresholds[1]) return 2
    if (bestScore >= level.starThresholds[0]) return 1
    return 0
  }

  const getBestScore = (levelId: string) => {
    const levelReplays = replayRecords.filter(r => r.levelId === levelId)
    if (levelReplays.length === 0) return null
    return Math.max(...levelReplays.map(r => r.score))
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 z-20 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              🏥 养老护理用药提醒
            </h1>
            <p className="text-xl text-gray-300">
              调度解谜游戏 - 在倒计时中处理活动签到、风险事件和老人档案
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {levels.map((level) => {
              const stars = getStars(level.id)
              const bestScore = getBestScore(level.id)
              
              return (
                <div
                  key={level.id}
                  className={`relative bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border-2 transition-all duration-300
                    ${level.unlocked 
                      ? 'border-blue-500 hover:border-blue-400 cursor-pointer hover:scale-105' 
                      : 'border-gray-700 opacity-60 cursor-not-allowed'}`}
                  onClick={() => level.unlocked && startGame(level.id)}
                >
                  {!level.unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      <span className="text-4xl">🔒</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-white">
                      {level.name}
                    </div>
                    <div className="flex">
                      {[1, 2, 3].map((i) => (
                        <span 
                          key={i} 
                          className={`text-xl ${i <= stars ? 'text-yellow-400' : 'text-gray-600'}`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`text-sm ${i < level.difficulty ? 'text-red-400' : 'text-gray-600'}`}
                        >
                          💀
                        </span>
                      ))}
                    </div>
                    <span className="text-gray-400 text-sm">
                      难度 {level.difficulty}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-4">
                    {level.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                    <div>时长: {Math.floor(level.duration / 60)}分钟</div>
                    <div>老人: {level.elderlyCount}位</div>
                    <div>目标正确率: {level.targetAccuracy * 100}%</div>
                    <div>最多同时: {level.maxConcurrentTasks}个任务</div>
                  </div>

                  {bestScore !== null && (
                    <div className="pt-4 border-t border-gray-700">
                      <div className="text-sm text-gray-400">
                        最高分: <span className="text-yellow-400 font-bold">{bestScore.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-1">
                    <div className="text-xs text-gray-500">星级分数线:</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">⭐ {level.starThresholds[0].toLocaleString()}</span>
                      <span className="text-gray-500">⭐⭐ {level.starThresholds[1].toLocaleString()}</span>
                      <span className="text-gray-500">⭐⭐⭐ {level.starThresholds[2].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setGameState('settings')}
              className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors"
            >
              ⚙️ 设置
            </button>
          </div>

          <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">📖 游戏说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-blue-400">💊</span>
                  <div>
                    <span className="font-medium text-blue-400">用药提醒</span>
                    <p className="text-sm text-gray-400">及时提醒老人服药，核对药品信息</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400">📋</span>
                  <div>
                    <span className="font-medium text-green-400">活动签到</span>
                    <p className="text-sm text-gray-400">确认老人参加活动，给予适当协助</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-red-400">⚠️</span>
                  <div>
                    <span className="font-medium text-red-400">风险事件</span>
                    <p className="text-sm text-gray-400">紧急事件需要快速正确处理</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400">📁</span>
                  <div>
                    <span className="font-medium text-purple-400">档案查看</span>
                    <p className="text-sm text-gray-400">了解老人健康状况和注意事项</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-bold text-white mb-3">🏆 得分规则</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• <span className="text-green-400">正确处理</span> 获得基础分数</li>
                <li>• <span className="text-yellow-400">快速处理</span> 获得速度加成（最高50%）</li>
                <li>• <span className="text-orange-400">连续正确</span> 获得连击加成（每次+10%，最高100%）</li>
                <li>• <span className="text-red-400">错误或超时</span> 扣除50%基础分数，连击归零</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
