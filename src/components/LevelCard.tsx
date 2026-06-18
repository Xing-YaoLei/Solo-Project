import { Lock, Check, Trophy, Star } from "lucide-react"

interface LevelCardProps {
  levelId: string
  name: string
  difficulty: "beginner" | "advanced" | "noshow"
  position: "sales" | "scheduler" | "service"
  bestScore: number | null
  isCompleted: boolean
  isLocked: boolean
  onClick: () => void
}

const difficultyConfig = {
  beginner: { label: "入门", color: "bg-jade/20 text-jade border-jade/30" },
  advanced: { label: "进阶", color: "bg-amber/20 text-amber border-amber/30" },
  noshow: { label: "爽约挑战", color: "bg-rust/20 text-rust border-rust/30" },
}

const positionConfig = {
  sales: "销售",
  scheduler: "调度",
  service: "客服",
}

export default function LevelCard({
  name,
  difficulty,
  position,
  bestScore,
  isCompleted,
  isLocked,
  onClick,
}: LevelCardProps) {
  const diff = difficultyConfig[difficulty]

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={`relative w-full text-left bg-charcoal-light rounded-xl overflow-hidden 
        border border-amber/20 transition-all duration-300 group
        ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:border-amber/50 hover:scale-[1.02]"}
        ${isCompleted ? "border-jade/30" : ""}`}
    >
      <div className={`h-[3px] ${isCompleted ? "bg-jade" : "bg-amber"}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-serif text-lg text-gray-100 group-hover:text-amber transition-colors">
            {name}
          </h3>
          {isLocked && <Lock size={18} className="text-gray-500 flex-shrink-0" />}
          {isCompleted && !isLocked && <Check size={18} className="text-jade flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${diff.color}`}>
            {diff.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full border border-gray-600 text-gray-400">
            {positionConfig[position]}
          </span>
        </div>
        {bestScore !== null && !isLocked && (
          <div className="flex items-center gap-1 text-sm">
            <Trophy size={14} className="text-amber" />
            <span className="text-amber">{bestScore}分</span>
            {bestScore >= 80 && <Star size={14} className="text-amber fill-amber" />}
          </div>
        )}
      </div>
    </button>
  )
}
