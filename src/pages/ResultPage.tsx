import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProgressStore } from '@/stores/useProgressStore'
import { levels } from '@/data/levels'
import { useSound } from '@/hooks/useSound'
import StarRating from '@/components/result/StarRating'
import TurnoverIndicator from '@/components/result/TurnoverIndicator'

export default function ResultPage() {
  const { levelId: levelIdParam } = useParams<{ levelId: string }>()
  const levelId = Number(levelIdParam)
  const navigate = useNavigate()
  const getResult = useProgressStore((s) => s.getResult)
  const unlockedLevel = useProgressStore((s) => s.unlockedLevel)
  const { playComplete } = useSound()

  const playCompleteRef = useRef(playComplete)
  playCompleteRef.current = playComplete
  const celebratedRef = useRef(false)

  const result = getResult(levelId)
  const level = levels.find((l) => l.id === levelId)

  useEffect(() => {
    if (!result) {
      navigate('/')
    }
  }, [result, navigate])

  useEffect(() => {
    if (result && !celebratedRef.current) {
      celebratedRef.current = true
      playCompleteRef.current()
    }
  }, [result])

  if (!result || !level) return null

  const nextLevelId = levelId + 1

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#f5f0e8] flex flex-col items-center p-6 animate-celebrate">
      <h1 className="text-2xl font-bold mb-2">{level.name}</h1>
      <p className="text-[#f5f0e880] mb-6">关卡完成</p>

      <div className="mb-6">
        <StarRating stars={result.stars} />
      </div>

      <div className="w-full max-w-xs bg-[#2a2a4a] rounded-2xl p-6 mb-6 border border-[#3a3a5a]">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xs text-[#f5f0e880] mb-1">得分</div>
            <div className="text-2xl font-bold text-[#ff6b35]">{result.score}</div>
          </div>
          <div>
            <div className="text-xs text-[#f5f0e880] mb-1">错误数</div>
            <div className="text-2xl font-bold text-[#ef4444]">{result.errorCount}</div>
          </div>
          <div>
            <div className="text-xs text-[#f5f0e880] mb-1">最高连击</div>
            <div className="text-2xl font-bold text-[#22c55e]">{result.maxConsecutive}</div>
          </div>
          <div>
            <div className="text-xs text-[#f5f0e880] mb-1">用时</div>
            <div className="text-2xl font-bold">{result.timeUsed}s</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <TurnoverIndicator days={result.inventoryTurnoverDays} />
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={() => navigate(`/game/${levelId}`)}
          className="w-full py-3 bg-[#ff6b35] text-white rounded-xl font-bold active:scale-95 transition-transform"
        >
          再来一次
        </button>

        {levels.find((l) => l.id === nextLevelId) && nextLevelId <= unlockedLevel + 1 && (
          <button
            onClick={() => navigate(`/game/${nextLevelId}`)}
            className="w-full py-3 bg-[#22c55e] text-white rounded-xl font-bold active:scale-95 transition-transform"
          >
            下一关
          </button>
        )}

        <button
          onClick={() => navigate('/review')}
          className="w-full py-3 bg-[#3a3a5a] text-[#f5f0e8] rounded-xl font-bold active:scale-95 transition-transform"
        >
          复盘对比
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-[#3a3a5a] text-[#f5f0e8] rounded-xl font-bold active:scale-95 transition-transform"
        >
          返回主菜单
        </button>
      </div>
    </div>
  )
}
