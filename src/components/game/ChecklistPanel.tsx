import { useRef } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { useSound } from '@/hooks/useSound'
import { useVibration } from '@/hooks/useVibration'
import { cn } from '@/lib/utils'
import TaskCard from './TaskCard'

export default function ChecklistPanel() {
  const tasks = useGameStore((s) => s.checklistTasks)
  const resolveChecklist = useGameStore((s) => s.resolveChecklist)
  const { playCorrect, playWrong } = useSound()
  const { correctVibrate, wrongVibrate } = useVibration()
  const answersRef = useRef<Map<string, boolean>>(new Map())

  const handleAnswer = (taskId: string, playerAnswer: boolean, actualOk: boolean) => {
    answersRef.current.set(taskId, playerAnswer)
    const isCorrect = playerAnswer === actualOk
    resolveChecklist(taskId, playerAnswer)
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
        const playerAnswer = answersRef.current.get(task.id)
        const isCorrect = task.resolved && playerAnswer !== undefined
          ? playerAnswer === task.actualOk
          : null

        return (
          <TaskCard key={task.id} resolved={task.resolved} correct={isCorrect}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#ff6b35]">{task.carModel}</span>
                  <span className="text-xs text-[#f5f0e8]/50">·</span>
                  <span className="text-sm font-medium text-[#f5f0e8]">{task.item}</span>
                </div>
                <p className="text-xs text-[#f5f0e8]/70 mb-2">{task.detail}</p>
                <div className={cn(
                  'inline-block rounded px-2 py-0.5 text-xs font-medium',
                  task.displayOk
                    ? 'bg-[#22c55e]/20 text-[#22c55e]'
                    : 'bg-[#ef4444]/20 text-[#ef4444]'
                )}>
                  {task.displayOk ? '显示合格' : '显示不合格'}
                </div>
              </div>

              {task.resolved ? (
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  isCorrect
                    ? 'bg-[#22c55e]/20 text-[#22c55e]'
                    : 'bg-[#ef4444]/20 text-[#ef4444]'
                )}>
                  {isCorrect ? '✓' : '✗'}
                </div>
              ) : (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleAnswer(task.id, true, task.actualOk)}
                    className="rounded bg-[#22c55e]/20 px-3 py-1.5 text-xs font-medium text-[#22c55e] transition-colors hover:bg-[#22c55e]/30 active:bg-[#22c55e]/40"
                  >
                    合格
                  </button>
                  <button
                    onClick={() => handleAnswer(task.id, false, task.actualOk)}
                    className="rounded bg-[#ef4444]/20 px-3 py-1.5 text-xs font-medium text-[#ef4444] transition-colors hover:bg-[#ef4444]/30 active:bg-[#ef4444]/40"
                  >
                    不合格
                  </button>
                </div>
              )}
            </div>
          </TaskCard>
        )
      })}
    </div>
  )
}
