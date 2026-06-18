import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { levels } from '@/data/levels'
import { useProgressStore } from '@/stores/useProgressStore'
import { useSound } from '@/hooks/useSound'
import { Play, Settings, BarChart3, Lock, Trophy, Car } from 'lucide-react'
import GameCanvas from '@/components/pixi/GameCanvas'

export default function HomePage() {
  const [showLevelSelect, setShowLevelSelect] = useState(false)
  const navigate = useNavigate()
  const unlockedLevel = useProgressStore((s) => s.unlockedLevel)
  const allResults = useProgressStore((s) => s.getAllResults)
  const { playClick } = useSound()

  const results = allResults()
  const hasResults = Object.keys(results).length > 0
  const bestScore = hasResults ? Math.max(...Object.values(results).map((r) => r.score)) : 0
  const totalStars = hasResults
    ? Object.values(results).reduce((sum, r) => sum + r.stars, 0)
    : 0

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#f5f0e8] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <GameCanvas />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-slideUp">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-3 rounded-2xl bg-[#ff6b3520]">
            <Car size={32} className="text-[#ff6b35]" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-[#ff6b35] tracking-tight">
            车源上架模拟
          </h1>
          <p className="text-[#f5f0e880] text-lg">二手车整备检验经营模拟</p>
        </div>

        {hasResults && (
          <div className="w-full flex gap-3 mb-8">
            <div className="flex-1 bg-[#2a2a4a]/80 backdrop-blur-sm rounded-2xl p-4 border border-[#3a3a5a] text-center">
              <Trophy size={20} className="mx-auto mb-1 text-[#eab308]" />
              <div className="text-2xl font-bold text-[#ff6b35]">{bestScore}</div>
              <div className="text-xs text-[#f5f0e860]">最佳得分</div>
            </div>
            <div className="flex-1 bg-[#2a2a4a]/80 backdrop-blur-sm rounded-2xl p-4 border border-[#3a3a5a] text-center">
              <div className="text-lg mb-1">{'⭐'.repeat(Math.min(3, Math.ceil(totalStars / 3)))}</div>
              <div className="text-2xl font-bold text-[#f5f0e8]">{totalStars}</div>
              <div className="text-xs text-[#f5f0e860]">累计星数</div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              playClick()
              setShowLevelSelect(true)
            }}
            className="flex items-center justify-center gap-2 bg-[#ff6b35] text-white py-4 px-6 rounded-2xl text-lg font-bold active:scale-[0.97] transition-all shadow-xl shadow-[#ff6b35]/30 hover:shadow-[#ff6b35]/50"
          >
            <Play size={22} fill="white" />
            开始游戏
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => {
                playClick()
                navigate('/review')
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a4a]/80 backdrop-blur-sm text-[#f5f0e8] py-3 px-4 rounded-2xl font-bold border border-[#3a3a5a] active:scale-[0.97] transition-all hover:bg-[#3a3a5a]/80"
            >
              <BarChart3 size={18} />
              复盘对比
            </button>

            <button
              onClick={() => {
                playClick()
                navigate('/settings')
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a4a]/80 backdrop-blur-sm text-[#f5f0e8] py-3 px-4 rounded-2xl font-bold border border-[#3a3a5a] active:scale-[0.97] transition-all hover:bg-[#3a3a5a]/80"
            >
              <Settings size={18} />
              设置
            </button>
          </div>
        </div>
      </div>

      {showLevelSelect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="bg-[#1a1a2e] rounded-3xl p-6 w-full max-w-sm border border-[#3a3a5a] shadow-2xl max-h-[80vh] flex flex-col">
            <h2 className="text-2xl font-bold text-center mb-4">选择关卡</h2>
            <div className="flex flex-col gap-2 overflow-auto pr-1">
              {levels.map((level) => {
                const isLocked = level.id > unlockedLevel
                const levelResult = results[level.id]
                const stars = levelResult?.stars ?? 0
                return (
                  <button
                    key={level.id}
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) {
                        playClick()
                        navigate(`/game/${level.id}`)
                      }
                    }}
                    className={`flex items-center justify-between py-4 px-5 rounded-2xl transition-all ${
                      isLocked
                        ? 'bg-[#2a2a4a] text-[#f5f0e840] cursor-not-allowed'
                        : 'bg-[#2a2a4a] text-[#f5f0e8] active:scale-[0.98] hover:bg-[#3a3a5a] hover:border-[#ff6b3540] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        isLocked ? 'bg-[#3a3a5a]' : 'bg-[#ff6b3520] text-[#ff6b35]'
                      }`}>
                        {level.id}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-base">{level.name}</div>
                        <div className="text-xs text-[#f5f0e860]">
                          {level.carCount}辆车 · {level.timeLimit}秒
                        </div>
                        {!isLocked && stars > 0 && (
                          <div className="text-sm mt-0.5">
                            {'⭐'.repeat(stars)}
                            {'☆'.repeat(3 - stars)}
                          </div>
                        )}
                      </div>
                    </div>
                    {isLocked && <Lock size={20} className="text-[#f5f0e840]" />}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => {
                playClick()
                setShowLevelSelect(false)
              }}
              className="mt-4 w-full py-3 bg-[#3a3a5a] text-[#f5f0e8] rounded-2xl font-bold active:scale-[0.97] transition-transform"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
