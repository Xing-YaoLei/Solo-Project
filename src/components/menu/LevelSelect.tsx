import { useNavigate } from 'react-router-dom'
import { X, Lock, Star, Car, Clock } from 'lucide-react'
import { levels } from '@/data/levels'
import { useProgressStore } from '@/stores/useProgressStore'

interface LevelSelectProps {
  onClose: () => void
}

export default function LevelSelect({ onClose }: LevelSelectProps) {
  const navigate = useNavigate()
  const unlockedLevel = useProgressStore((s) => s.unlockedLevel)

  const handleLevelClick = (levelId: number) => {
    if (levelId > unlockedLevel) return
    navigate(`/game/${levelId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-3xl bg-[#1a1a2e] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#f5f0e8]/60 transition-colors hover:bg-white/10 hover:text-[#f5f0e8]"
        >
          <X size={20} />
        </button>

        <h2 className="mb-6 text-center text-2xl font-bold text-[#f5f0e8]">关卡选择</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {levels.map((level) => {
            const locked = level.id > unlockedLevel
            return (
              <button
                key={level.id}
                onClick={() => handleLevelClick(level.id)}
                disabled={locked}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                  locked
                    ? 'cursor-not-allowed border-[#2a2a4a] bg-[#2a2a4a]/50 text-[#f5f0e8]/30'
                    : 'cursor-pointer border-[#ff6b35]/40 bg-[#1a1a2e] text-[#f5f0e8] hover:border-[#ff6b35] hover:bg-[#ff6b35]/10 active:scale-95'
                }`}
              >
                {locked ? (
                  <Lock size={20} className="text-[#f5f0e8]/30" />
                ) : (
                  <span className="text-sm font-bold text-[#ff6b35]">第{level.id}关</span>
                )}

                <span className="text-sm font-semibold">{level.name}</span>

                <div className="flex gap-0.5">
                  {Array.from({ length: Math.round(level.difficulty) }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={locked ? 'text-[#f5f0e8]/20' : 'fill-[#ff6b35] text-[#ff6b35]'}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1 text-xs text-[#f5f0e8]/50">
                  <Car size={12} />
                  <span>{level.carCount}辆</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#f5f0e8]/50">
                  <Clock size={12} />
                  <span>{level.timeLimit}s</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
