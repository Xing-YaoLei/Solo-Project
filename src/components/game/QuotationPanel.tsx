import { useGameStore } from '@/stores/useGameStore'
import { useSound } from '@/hooks/useSound'
import { useVibration } from '@/hooks/useVibration'
import { cn } from '@/lib/utils'
import TaskCard from './TaskCard'

function formatPrice(price: number) {
  return `¥${price.toLocaleString()}`
}

export default function QuotationPanel() {
  const tasks = useGameStore((s) => s.quotationTasks)
  const resolveQuotation = useGameStore((s) => s.resolveQuotation)
  const { playCorrect, playWrong } = useSound()
  const { correctVibrate, wrongVibrate } = useVibration()

  const handleSelect = (taskId: string, selectedIndex: number, correctIndex: number) => {
    const isCorrect = selectedIndex === correctIndex
    resolveQuotation(taskId, selectedIndex)
    if (isCorrect) {
      playCorrect()
      correctVibrate()
    } else {
      playWrong()
      wrongVibrate()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => {
        const isCorrect = task.resolved && task.selectedIndex !== null
          ? task.selectedIndex === task.correctIndex
          : null

        return (
          <TaskCard key={task.id} resolved={task.resolved} correct={isCorrect}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-[#ff6b35]">{task.carModel}</span>
              <span className="text-xs text-[#f5f0e8]/50">·</span>
              <span className="text-xs text-[#f5f0e8]/70">市场参考价 {formatPrice(task.marketPrice)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {task.options.map((price, idx) => {
                const isSelected = task.resolved && task.selectedIndex === idx
                const isCorrectOption = task.resolved && idx === task.correctIndex

                return (
                  <button
                    key={idx}
                    disabled={task.resolved}
                    onClick={() => handleSelect(task.id, idx, task.correctIndex)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      !task.resolved && 'bg-[#1a1a2e] text-[#f5f0e8] hover:bg-[#3a3a5a] active:bg-[#4a4a6a]',
                      task.resolved && !isSelected && !isCorrectOption && 'bg-[#1a1a2e] text-[#f5f0e8]/40',
                      isSelected && isCorrectOption && 'bg-[#22c55e]/20 text-[#22c55e] ring-1 ring-[#22c55e]/50',
                      isSelected && !isCorrectOption && 'bg-[#ef4444]/20 text-[#ef4444] ring-1 ring-[#ef4444]/50',
                      !isSelected && isCorrectOption && 'bg-[#22c55e]/10 text-[#22c55e]/70 ring-1 ring-[#22c55e]/30'
                    )}
                  >
                    {formatPrice(price)}
                  </button>
                )
              })}
            </div>
          </TaskCard>
        )
      })}
    </div>
  )
}
