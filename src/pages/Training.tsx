import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useGameStore } from "@/store/gameStore"
import { useStatsStore } from "@/store/statsStore"
import { levels } from "@/data/levels"
import LevelCard from "@/components/LevelCard"

type DifficultyFilter = "all" | "beginner" | "advanced" | "noshow"
type PositionFilter = "all" | "sales" | "scheduler" | "service"

export default function Training() {
  const navigate = useNavigate()
  const unlockedLevelIds = useGameStore((s) => s.gameProgress.unlockedLevelIds)
  const results = useGameStore((s) => s.results)
  const loadProgress = useGameStore((s) => s.loadProgress)
  const getLevelResult = useStatsStore((s) => s.getLevelResult)
  const loadResults = useStatsStore((s) => s.loadResults)

  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>("all")
  const [posFilter, setPosFilter] = useState<PositionFilter>("all")

  useEffect(() => {
    loadProgress()
    loadResults()
  }, [loadProgress, loadResults])

  const completedLevelIds = results.map((r) => r.levelId)

  const filteredLevels = levels.filter((l) => {
    if (diffFilter !== "all" && l.difficulty !== diffFilter) return false
    if (posFilter !== "all" && l.position !== posFilter) return false
    return true
  })

  const difficultyOptions: { value: DifficultyFilter; label: string }[] = [
    { value: "all", label: "全部" },
    { value: "beginner", label: "入门" },
    { value: "advanced", label: "进阶" },
    { value: "noshow", label: "爽约挑战" },
  ]

  const positionOptions: { value: PositionFilter; label: string }[] = [
    { value: "all", label: "全部" },
    { value: "sales", label: "销售" },
    { value: "scheduler", label: "调度" },
    { value: "service", label: "客服" },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-serif text-3xl text-amber glow-text mb-8">正式训练</h1>

      <div className="flex flex-wrap gap-6 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-1">难度</span>
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDiffFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                diffFilter === opt.value
                  ? "bg-amber/20 text-amber border border-amber/40"
                  : "bg-charcoal-light text-gray-400 border border-gray-700 hover:text-amber hover:border-amber/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 mr-1">岗位</span>
          {positionOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPosFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                posFilter === opt.value
                  ? "bg-amber/20 text-amber border border-amber/40"
                  : "bg-charcoal-light text-gray-400 border border-gray-700 hover:text-amber hover:border-amber/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLevels.map((level) => {
          const isLocked = !unlockedLevelIds.includes(level.id)
          const isCompleted = completedLevelIds.includes(level.id)
          const bestResult = getLevelResult(level.id)
          const bestScore = bestResult ? bestResult.score : null

          return (
            <LevelCard
              key={level.id}
              levelId={level.id}
              name={level.name}
              difficulty={level.difficulty}
              position={level.position}
              bestScore={bestScore}
              isCompleted={isCompleted}
              isLocked={isLocked}
              onClick={() => {
                if (!isLocked) navigate(`/game/${level.id}`)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
