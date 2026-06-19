import { useState } from 'react'
import { CalendarClock, GripVertical, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrainingStore } from '@/stores/useTrainingStore'
import type { CalendarTask, Question } from '@/types/training'

interface CalendarSorterProps {
  question: Question
  tasks: CalendarTask[]
}

interface ConflictInfo {
  hasConflict: boolean
  overlappingTasks: string[]
}

const checkConflicts = (sorted: CalendarTask[]): ConflictInfo => {
  const overlapping: string[] = []

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[i].priority > sorted[j].priority) {
        overlapping.push(sorted[j].roomId)
      }
    }
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const gapMinutes = Math.abs(
      new Date(sorted[i + 1].checkOut).getTime() - new Date(sorted[i].checkOut).getTime()
    ) / 60000
    if (gapMinutes < sorted[i].requiredMinutes) {
      if (!overlapping.includes(sorted[i + 1].roomId)) {
        overlapping.push(sorted[i + 1].roomId)
      }
    }
  }

  return {
    hasConflict: overlapping.length > 0,
    overlappingTasks: overlapping,
  }
}

export default function CalendarSorter({ question, tasks }: CalendarSorterProps) {
  const [sortedTasks, setSortedTasks] = useState<CalendarTask[]>([...tasks])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const submitAnswer = useTrainingStore((s) => s.submitAnswer)

  const conflict = checkConflicts(sortedTasks)

  const handleDragStart = (index: number) => {
    if (submitted) return
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index || submitted) return

    const newSorted = [...sortedTasks]
    const [dragged] = newSorted.splice(draggedIndex, 1)
    newSorted.splice(index, 0, dragged)
    setSortedTasks(newSorted)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSubmit = () => {
    const correctOrder = [...tasks].sort((a, b) => a.priority - b.priority)
    const isCorrect = sortedTasks.every((task, idx) => task.id === correctOrder[idx].id) && !conflict.hasConflict
    setSubmitted(true)
    submitAnswer(question.id, { sortedIds: sortedTasks.map((t) => t.id), isCorrect })
  }

  const handleReset = () => {
    setSortedTasks([...tasks])
    setSubmitted(false)
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPriorityLabel = (priority: number) => {
    const map = { 1: '紧急', 2: '一般', 3: '低' }
    return map[priority as keyof typeof map] || '一般'
  }

  const getPriorityColor = (priority: number) => {
    const map = { 1: 'bg-red-100 text-red-700', 2: 'bg-yellow-100 text-yellow-700', 3: 'bg-green-100 text-green-700' }
    return map[priority as keyof typeof map] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">日历排序</h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
            {question.score}分
          </span>
        </div>
        <p className="text-sm text-gray-600">{question.description}</p>
      </div>

      {conflict.hasConflict && !submitted && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>检测到冲突：房间 {conflict.overlappingTasks.join('、')} 可能存在时间或优先级问题</span>
        </div>
      )}

      <div className="flex-1 space-y-2 overflow-y-auto">
        {sortedTasks.map((task, index) => {
          const isDragging = draggedIndex === index
          const hasConflict = conflict.overlappingTasks.includes(task.roomId)

          return (
            <div
              key={task.id}
              draggable={!submitted}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-all',
                isDragging && 'opacity-50 scale-95',
                hasConflict && !submitted && 'border-amber-400 bg-amber-50',
                !hasConflict && submitted && 'border-green-400 bg-green-50',
                !hasConflict && !submitted && 'border-gray-200 bg-white',
                !submitted && 'cursor-move hover:border-blue-300'
              )}
            >
              {!submitted && <GripVertical className="h-5 w-5 flex-shrink-0 text-gray-400" />}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">房间 {task.roomId}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', getPriorityColor(task.priority))}>
                    {getPriorityLabel(task.priority)}
                  </span>
                </div>
                <div className="mt-1 flex gap-4 text-xs text-gray-500">
                  <span>退房: {formatTime(task.checkOut)}</span>
                  <span>入住: {formatTime(task.nextCheckIn)}</span>
                  <span>需时: {task.requiredMinutes}分钟</span>
                </div>
              </div>
              {submitted && !hasConflict && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />}
              {hasConflict && submitted && <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex gap-2">
        {!submitted ? (
          <>
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              重置顺序
            </button>
            <button
              onClick={handleSubmit}
              disabled={conflict.hasConflict}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-300"
            >
              确认排序
            </button>
          </>
        ) : (
          <div className="w-full rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-600">
            已提交，点击「下一题」继续
          </div>
        )}
      </div>
    </div>
  )
}
