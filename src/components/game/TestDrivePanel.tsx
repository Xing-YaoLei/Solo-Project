import { useRef } from 'react'
import { useGameStore } from '@/stores/useGameStore'
import { useSound } from '@/hooks/useSound'
import { useVibration } from '@/hooks/useVibration'
import { cn } from '@/lib/utils'
import TaskCard from './TaskCard'

export default function TestDrivePanel() {
  const tasks = useGameStore((s) => s.testDriveTasks)
  const resolveTestDrive = useGameStore((s) => s.resolveTestDrive)
  const { playCorrect, playWrong } = useSound()
  const { correctVibrate, wrongVibrate } = useVibration()
  const answersRef = useRef<Map<string, boolean>>(new Map())

  const handleAnswer = (taskId: string, playerAnswer: boolean, hasError: boolean) => {
    answersRef.current.set(taskId, playerAnswer)
    const isCorrect = playerAnswer === hasError
    resolveTestDrive(taskId, playerAnswer)
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
          ? playerAnswer === task.hasError
          : null

        return (
          <TaskCard key={task.id} resolved={task.resolved} correct={isCorrect}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#ff6b35]">{task.carModel}</span>
                  <span className="text-xs text-[#f5f0e8]/50">·</span>
                  <span className="text-sm font-medium text-[#f5f0e8]">{task.field}</span>
                </div>
                <div className="rounded bg-[#1a1a2e] px-3 py-2 text-sm text-[#f5f0e8] font-mono">
                  {task.displayValue}
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
                    onClick={() => handleAnswer(task.id, false, task.hasError)}
                    className="rounded bg-[#22c55e]/20 px-3 py-1.5 text-xs font-medium text-[#22c55e] transition-colors hover:bg-[#22c55e]/30 active:bg-[#22c55e]/40"
                  >
                    数据正常
                  </button>
                  <button
                    onClick={() => handleAnswer(task.id, true, task.hasError)}
                    className="rounded bg-[#ef4444]/20 px-3 py-1.5 text-xs font-medium text-[#ef4444] transition-colors hover:bg-[#ef4444]/30 active:bg-[#ef4444]/40"
                  >
                    数据异常
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
