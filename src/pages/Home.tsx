import { Link, useNavigate } from "react-router-dom"
import { ClipboardList, Puzzle, Play } from "lucide-react"
import { useGameStore } from "@/store/gameStore"
import { levels } from "@/data/levels"

export default function Home() {
  const navigate = useNavigate()
  const lastPlayedLevelId = useGameStore((s) => s.gameProgress.lastPlayedLevelId)
  const unlockedLevelIds = useGameStore((s) => s.gameProgress.unlockedLevelIds)

  const lastLevel = lastPlayedLevelId
    ? levels.find((l) => l.id === lastPlayedLevelId)
    : null

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <h1 className="font-serif text-5xl md:text-6xl text-amber glow-text mb-4">
          试驾预约调度
        </h1>
        <p className="font-serif text-2xl text-amber/60 mb-12">
          解谜训练系统
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <Link
            to="/training"
            className="group animate-breathe bg-charcoal-light border-2 border-amber/40 rounded-2xl p-8 
                       hover:border-amber hover:shadow-[0_0_40px_rgba(212,165,116,0.2)] 
                       transition-all duration-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-amber/15 flex items-center justify-center group-hover:bg-amber/25 transition-colors">
                <ClipboardList size={28} className="text-amber" />
              </div>
              <h2 className="font-serif text-2xl text-amber">正式训练</h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              按岗位逐步解锁，系统化培训
            </p>
            <div className="mt-4 text-sm text-amber/50">
              已解锁 {unlockedLevelIds.length}/{levels.length} 关
            </div>
          </Link>

          <Link
            to="/practice"
            className="group animate-breathe bg-charcoal-light border-2 border-amber/40 rounded-2xl p-8 
                       hover:border-amber hover:shadow-[0_0_40px_rgba(212,165,116,0.2)] 
                       transition-all duration-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-amber/15 flex items-center justify-center group-hover:bg-amber/25 transition-colors">
                <Puzzle size={28} className="text-amber" />
              </div>
              <h2 className="font-serif text-2xl text-amber">自由练习</h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              自由选择关卡，随时练手
            </p>
            <div className="mt-4 text-sm text-amber/50">
              全部 {levels.length} 关开放
            </div>
          </Link>
        </div>
      </section>

      {lastLevel && (
        <div className="sticky bottom-0 bg-charcoal-dark/95 backdrop-blur-sm border-t border-amber/20 px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-400">上次关卡</span>
              <p className="text-amber font-serif">{lastLevel.name}</p>
            </div>
            <button
              onClick={() => navigate(`/game/${lastLevel!.id}`)}
              className="btn-primary flex items-center gap-2"
            >
              <Play size={18} />
              继续
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
