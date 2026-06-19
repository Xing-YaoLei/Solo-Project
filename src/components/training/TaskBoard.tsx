import { useState } from 'react'
import { ListTodo, Clock, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrainingStore } from '@/stores/useTrainingStore'
import type { CleaningTask, Question } from '@/types/training'

interface TaskBoardProps {
  question: Question
  tasks: CleaningTask[]
  cleaners: { id: string; name: string; level: number }[]
}

export default function TaskBoard({ question, tasks, cleaners }: TaskBoardProps) {
  const [taskList, setTaskList] = useState<CleaningTask[]>([...tasks])
  const [submitted, setSubmitted] = useState(false)
  const submitAnswer = useTrainingStore((s) => s.submitAnswer)

  const handleAssign = (taskId: string, cleanerId: string) => {
    if (submitted) return
    setTaskList((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, assignedTo: cleanerId } : task))
    )
  }

  const handleSubmit = () => {
    const allAssigned = taskList.every((task) => task.assignedTo)
    if (!allAssigned) return

    const assignments = taskList.map((task) => {
      const cleaner = cleaners.find((c) => c.id === task.assignedTo)
      const expectedLevel = task.priority
      return cleaner && cleaner.level >= expectedLevel
    })
    const isCorrect = assignments.every(Boolean)

    setSubmitted(true)
    submitAnswer(question.id, {
      assignments: taskList.map((t) => ({ taskId: t.id, cleanerId: t.assignedTo })),
      isCorrect,
    })
  }

  const handleReset = () => {
    setTaskList(tasks.map((t) => ({ ...t, assignedTo: '' })))
    setSubmitted(false)
  }

  const formatDeadline = (date: Date) => {
    return new Date(date).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTaskTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      daily: '日常清洁',
      deep: '深度清洁',
      turnover: '退房清扫',
      inspection: '巡检',
    }
    return map[type] || type
  }

  const getPriorityLabel = (priority: number) => {
    const map = { 1: '高', 2: '中', 3: '低' }
    return map[priority as keyof typeof map] || '中'
  }

  const getPriorityStyle = (priority: number) => {
    const map = {
      1: 'border-l-red-500 bg-red-50',
      2: 'border-l-yellow-500 bg-yellow-50',
      3: 'border-l-green-500 bg-green-50',
    }
    return map[priority as keyof typeof map] || 'border-l-gray-500 bg-gray-50'
  }

  const getPriorityBadgeStyle = (priority: number) => {
    const map = {
      1: 'bg-red-100 text-red-700',
      2: 'bg-yellow-100 text-yellow-700',
      3: 'bg-green-100 text-green-700',
    }
    return map[priority as keyof typeof map] || 'bg-gray-100 text-gray-700'
  }

  const allAssigned = taskList.every((task) => task.assignedTo)

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-purple-600" />
          <h3 className="text-base font-semibold text-gray-900">任务分配看板</h3>
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-600">
            {question.score}分
          </span>
        </div>
        <p className="text-sm text-gray-600">{question.description}</p>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
        <User className="h-3.5 w-3.5" />
        <span>可用保洁员：</span>
        {cleaners.map((c) => (
          <span key={c.id} className="rounded bg-gray-100 px-2 py-0.5">
            {c.name} (等级{c.level})
          </span>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {taskList.map((task) => {
          const assignedCleaner = cleaners.find((c) => c.id === task.assignedTo)
          const isCorrectAssignment = submitted && assignedCleaner && assignedCleaner.level >= task.priority
          const isWrongAssignment = submitted && assignedCleaner && assignedCleaner.level < task.priority

          return (
            <div
              key={task.id}
              className={cn(
                'rounded-lg border-l-4 border border-gray-200 p-3 transition-all',
                getPriorityStyle(task.priority),
                isCorrectAssignment && 'ring-2 ring-green-400',
                isWrongAssignment && 'ring-2 ring-red-400'
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">房间 {task.roomId}</span>
                    <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', getPriorityBadgeStyle(task.priority))}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    <span className="rounded bg-white px-1.5 py-0.5 text-xs text-gray-600">
                      {getTaskTypeLabel(task.type)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>截止: {formatDeadline(task.deadline)}</span>
                  </div>
                </div>
                {submitted && isCorrectAssignment && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {submitted && isWrongAssignment && <AlertCircle className="h-5 w-5 text-red-500" />}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">分配:</span>
                <select
                  value={task.assignedTo}
                  onChange={(e) => handleAssign(task.id, e.target.value)}
                  disabled={submitted}
                  className={cn(
                    'flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500',
                    isCorrectAssignment && 'border-green-400 bg-green-50',
                    isWrongAssignment && 'border-red-400 bg-red-50'
                  )}
                >
                  <option value="">请选择保洁员</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name} (等级{cleaner.level})
                    </option>
                  ))}
                </select>
              </div>

              {submitted && isWrongAssignment && (
                <p className="mt-2 text-xs text-red-600">
                  此任务优先级较高，建议分配给等级更高的保洁员
                </p>
              )}
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
              重置
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allAssigned}
              className="flex-1 rounded-lg bg-purple-600 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:bg-gray-300"
            >
              确认分配
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
