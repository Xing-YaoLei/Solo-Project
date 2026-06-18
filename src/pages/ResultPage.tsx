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
  const speedPercent = Math.max(
    0,
    Math.round(((level.timeLimit - result.timeUsed) / level.timeLimit) * 100)
  )
  const speedColor = speedPercent >= 60 ? '#22c55e' : speedPercent >= 30 ? '#eab308' : '#ef4444'

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-[#f5f0e8] flex flex-col items-center p-6 animate-celebrate">
      <h1 className="text-2xl font-bold mb-2">{level.name}</h1>
      <p className="text-[#f5f0e880] mb-6">关卡完成</p>

      <div className="mb-6">
        <StarRating stars={result.stars} />
      </div>

      <div className="w-full max-w-xs bg-[#2a2a4a] rounded-2xl p-5 mb-4 border border-[#3a3a5a]">
        <div className="text-center">
          <div className="text-xs text-[#f5f0e880] mb-1">最终得分</div>
          <div className="text-4xl font-bold text-[#ff6b35] tabular-nums">{result.score}</div>
        </div>
      </div>

      <div className="w-full max-w-xs bg-[#2a2a4a] rounded-2xl p-5 mb-6 border border-[#3a3a5a] space-y-4">
        <div className="text-xs text-[#f5f0e880] font-bold uppercase tracking-wider text-center">
          评分三大维度
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">⏱ 速度</span>
              <span className="text-xs text-[#f5f0e860]">
                用时 {result.timeUsed}s / {level.timeLimit}s
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color: speedColor }}>
              {speedPercent}%
            </span>
          </div>
          <div className="h-2 bg-[#3a3a5a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${speedPercent}%`, backgroundColor: speedColor }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm">✖ 错误次数</span>
            <span className="text-sm font-bold tabular-nums text-[#ef4444]">
              {result.errorCount}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: Math.max(result.errorCount, 0) }).map((_, i) => (
              <span
                key={i}
                className="inline-block w-5 h-5 bg-[#ef444420] rounded-full border border-[#ef444440] text-[#ef4444] text-xs flex items-center justify-center"
              >
                ✖
              </span>
            ))}
            {result.errorCount === 0 && (
              <span className="text-xs text-[#22c55e] font-bold">完美无错！</span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm">🔥 最高连击</span>
            <span className="text-sm font-bold tabular-nums text-[#22c55e]">
              x{result.maxConsecutive}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(result.maxConsecutive, 15) }).map((_, i) => (
              <span
                key={i}
                className="inline-block w-3 h-5 rounded-sm"
                style={{
                  backgroundColor:
                    i < 3 ? '#22c55e' : i < 6 ? '#84cc16' : i < 10 ? '#eab308' : '#ff6b35',
                  opacity: 0.4 + (i / result.maxConsecutive) * 0.6,
                }}
              />
            ))}
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
