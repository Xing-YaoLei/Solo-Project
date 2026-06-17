import { useGameStore } from '../store/gameStore'

export function PauseScreen() {
  const { resumeGame, restartGame, exitToMenu } = useGameStore()

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">⏸️ 游戏暂停</h2>
        <p className="text-gray-400 mb-8">休息一下，随时可以继续</p>

        <div className="space-y-4">
          <button
            onClick={resumeGame}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-colors"
          >
            ▶️ 继续游戏
          </button>
          
          <button
            onClick={restartGame}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-colors"
          >
            🔄 重新开始
          </button>
          
          <button
            onClick={exitToMenu}
            className="w-full py-4 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-bold text-lg transition-colors"
          >
            🏠 返回菜单
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          提示：按 ESC 键可以快速暂停/继续游戏
        </p>
      </div>
    </div>
  )
}
