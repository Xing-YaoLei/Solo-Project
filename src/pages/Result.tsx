import { useParams, useNavigate } from "react-router-dom"
import { Star, RotateCcw, BookOpen, BarChart3, Check, X } from "lucide-react"
import { useGameStore } from "@/store/gameStore"
import { useStatsStore } from "@/store/statsStore"
import { levels } from "@/data/levels"

export default function Result() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const loadProgress = useGameStore((s) => s.loadProgress)
  const getLevelResult = useStatsStore((s) => s.getLevelResult)
  const loadResults = useStatsStore((s) => s.loadResults)

  loadProgress()
  loadResults()

  const level = levels.find((l) => l.id === levelId)
  const result = levelId ? getLevelResult(levelId) : undefined

  if (!level || !result) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <p className="text-gray-400">暂无结果数据</p>
      </div>
    )
  }

  const score = result.score
  const starCount = score >= 80 ? 3 : score >= 60 ? 2 : 1
  const minutes = Math.floor(result.timeUsed / 60)
  const seconds = result.timeUsed % 60

  const circumference = 2 * Math.PI * 54
  const progress = circumference - (circumference * score) / 100

  const viewedClues = result.clueConversions.filter((c) => c.wasViewed)
  const correctFromClues = viewedClues.filter((c) => c.ledToCorrectDecision)

  return (
    <div className="min-h-screen bg-charcoal py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif text-3xl text-amber glow-text text-center mb-10">
          训练结算
        </h1>

        <div className="card-dark flex flex-col items-center py-8 mb-6">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="rgba(212,165,116,0.15)"
                strokeWidth="8"
              />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="#D4A574"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-amber">{score}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star
                key={i}
                size={28}
                className={
                  i < starCount
                    ? "text-amber fill-amber"
                    : "text-gray-600"
                }
              />
            ))}
          </div>

          <p className="text-gray-400 text-sm">
            用时 {minutes}分{seconds.toString().padStart(2, "0")}秒
          </p>
        </div>

        <div className="card-dark mb-6">
          <h2 className="font-serif text-lg text-amber mb-4">错因分析</h2>
          <div className="space-y-4">
            {level.decisions.map((decision) => {
              const record = result.decisions.find(
                (d) => d.decisionPointId === decision.id
              )
              if (!record) return null
              const selectedOption = decision.options.find(
                (o) => o.id === record.selectedOptionId
              )
              const correctOption = decision.options.find(
                (o) => o.id === decision.correctOptionId
              )
              return (
                <div key={decision.id} className="border border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-300 mb-3">{decision.question}</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      {record.isCorrect ? (
                        <Check size={16} className="text-jade flex-shrink-0 mt-0.5" />
                      ) : (
                        <X size={16} className="text-rust flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="text-xs text-gray-500">你的选择</span>
                        <p className={`text-sm ${record.isCorrect ? "text-jade" : "text-rust"}`}>
                          {selectedOption?.label} - {selectedOption?.description}
                        </p>
                      </div>
                    </div>
                    {!record.isCorrect && correctOption && (
                      <div className="flex items-start gap-2">
                        <Check size={16} className="text-jade flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs text-gray-500">正确答案</span>
                          <p className="text-sm text-jade">
                            {correctOption.label} - {correctOption.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {!record.isCorrect && (
                    <div className="mt-3 bg-charcoal rounded-lg p-3">
                      <p className="text-xs text-amber/80">{decision.knowledgePoint}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="card-dark mb-8">
          <h2 className="font-serif text-lg text-amber mb-4">线索转化</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-amber">{level.clues.length}</p>
              <p className="text-xs text-gray-400">线索总数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber">{viewedClues.length}</p>
              <p className="text-xs text-gray-400">已查看</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-jade">{correctFromClues.length}</p>
              <p className="text-xs text-gray-400">促成正确决策</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate(`/game/${levelId}`)}
            className="btn-primary flex items-center gap-2"
          >
            <RotateCcw size={16} />
            重玩
          </button>
          <button
            onClick={() => navigate("/training")}
            className="btn-secondary flex items-center gap-2"
          >
            <BookOpen size={16} />
            返回训练
          </button>
          <button
            onClick={() => navigate("/stats")}
            className="btn-secondary flex items-center gap-2"
          >
            <BarChart3 size={16} />
            查看统计
          </button>
        </div>
      </div>
    </div>
  )
}
