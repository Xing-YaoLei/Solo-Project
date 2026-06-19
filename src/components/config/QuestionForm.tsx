import { useState, useEffect } from 'react'
import { Plus, Save, Trash2, X, Search, Tag, CalendarClock, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/useConfigStore'
import type { Question, QuestionType, Evidence, TagOption, CalendarTask, CleaningTask } from '@/types/training'

interface QuestionFormProps {
  editingQuestion?: Question | null
  onCancel?: () => void
}

const QUESTION_TYPES: { value: QuestionType; label: string; icon: typeof Search; color: string }[] = [
  { value: 'evidence', label: '证据识别', icon: Search, color: 'text-indigo-600 bg-indigo-50' },
  { value: 'tag', label: '标签分析', icon: Tag, color: 'text-amber-600 bg-amber-50' },
  { value: 'calendar', label: '日历排序', icon: CalendarClock, color: 'text-blue-600 bg-blue-50' },
  { value: 'task', label: '任务分配', icon: ListTodo, color: 'text-purple-600 bg-purple-50' },
]

export default function QuestionForm({ editingQuestion, onCancel }: QuestionFormProps) {
  const addQuestion = useConfigStore((s) => s.addQuestion)
  const updateQuestion = useConfigStore((s) => s.updateQuestion)
  const deleteQuestion = useConfigStore((s) => s.deleteQuestion)
  const saveConfig = useConfigStore((s) => s.saveConfig)

  const [formData, setFormData] = useState<Omit<Question, 'id'>>({
    levelId: 'level-1',
    type: 'evidence',
    description: '',
    score: 100,
    correctReason: '',
  })

  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [tagOptions, setTagOptions] = useState<TagOption[]>([])
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([])
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([])

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        levelId: editingQuestion.levelId,
        type: editingQuestion.type,
        description: editingQuestion.description,
        score: editingQuestion.score,
        correctReason: editingQuestion.correctReason,
      })
    } else {
      setFormData({
        levelId: 'level-1',
        type: 'evidence',
        description: '',
        score: 100,
        correctReason: '',
      })
      setEvidences([])
      setTagOptions([])
      setCalendarTasks([])
      setCleaningTasks([])
    }
  }, [editingQuestion])

  const handleSubmit = () => {
    if (!formData.description.trim()) return

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, formData)
    } else {
      addQuestion(formData)
    }
    saveConfig()
    onCancel?.()
  }

  const handleDelete = () => {
    if (editingQuestion && window.confirm('确定删除该题目吗？')) {
      deleteQuestion(editingQuestion.id)
      saveConfig()
      onCancel?.()
    }
  }

  const addEvidence = () => {
    setEvidences((prev) => [
      ...prev,
      {
        id: `ev-new-${prev.length}`,
        questionId: editingQuestion?.id || '',
        name: '',
        description: '',
        isCorrect: false,
        position: '',
      },
    ])
  }

  const updateEvidence = (index: number, updates: Partial<Evidence>) => {
    setEvidences((prev) => prev.map((e, i) => (i === index ? { ...e, ...updates } : e)))
  }

  const removeEvidence = (index: number) => {
    setEvidences((prev) => prev.filter((_, i) => i !== index))
  }

  const addTagOption = () => {
    setTagOptions((prev) => [
      ...prev,
      {
        id: `tag-new-${prev.length}`,
        questionId: editingQuestion?.id || '',
        label: '',
        isCorrect: false,
      },
    ])
  }

  const updateTagOption = (index: number, updates: Partial<TagOption>) => {
    setTagOptions((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)))
  }

  const removeTagOption = (index: number) => {
    setTagOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const addCalendarTask = () => {
    const now = new Date().toISOString()
    setCalendarTasks((prev) => [
      ...prev,
      {
        id: `ct-new-${prev.length}`,
        questionId: editingQuestion?.id || '',
        roomId: '',
        checkOut: now,
        nextCheckIn: now,
        priority: 2,
        requiredMinutes: 60,
      },
    ])
  }

  const updateCalendarTask = (index: number, updates: Partial<CalendarTask>) => {
    setCalendarTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)))
  }

  const removeCalendarTask = (index: number) => {
    setCalendarTasks((prev) => prev.filter((_, i) => i !== index))
  }

  const addCleaningTask = () => {
    setCleaningTasks((prev) => [
      ...prev,
      {
        id: `task-new-${prev.length}`,
        questionId: editingQuestion?.id || '',
        roomId: '',
        type: 'daily',
        priority: 2,
        deadline: new Date().toISOString(),
        assignedTo: '',
      },
    ])
  }

  const updateCleaningTask = (index: number, updates: Partial<CleaningTask>) => {
    setCleaningTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)))
  }

  const removeCleaningTask = (index: number) => {
    setCleaningTasks((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex h-full flex-col rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <h3 className="text-base font-semibold text-gray-900">
          {editingQuestion ? '编辑题目' : '新建题目'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">题目类型</label>
          <div className="grid grid-cols-2 gap-2">
            {QUESTION_TYPES.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                onClick={() => setFormData({ ...formData, type: value })}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-3 text-left transition-all',
                  formData.type === value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-900">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">所属关卡</label>
          <select
            value={formData.levelId}
            onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="level-1">新手入门</option>
            <option value="level-2">进阶挑战</option>
            <option value="level-3">精英考核</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">题目描述</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="请输入题目描述"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">分值</label>
          <input
            type="number"
            value={formData.score}
            onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">正确解析</label>
          <textarea
            value={formData.correctReason}
            onChange={(e) => setFormData({ ...formData, correctReason: e.target.value })}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="请输入正确答案的解析说明"
          />
        </div>

        {formData.type === 'evidence' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">证据选项</label>
              <button
                onClick={addEvidence}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                添加证据
              </button>
            </div>
            <div className="space-y-2">
              {evidences.map((ev, index) => (
                <div key={ev.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">证据 {index + 1}</span>
                    <button
                      onClick={() => removeEvidence(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={ev.name}
                    onChange={(e) => updateEvidence(index, { name: e.target.value })}
                    placeholder="证据名称"
                    className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={ev.description}
                    onChange={(e) => updateEvidence(index, { description: e.target.value })}
                    placeholder="证据描述"
                    className="mb-2 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ev.isCorrect}
                      onChange={(e) => updateEvidence(index, { isCorrect: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    是正确证据
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {formData.type === 'tag' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">标签选项</label>
              <button
                onClick={addTagOption}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                添加标签
              </button>
            </div>
            <div className="space-y-2">
              {tagOptions.map((tag, index) => (
                <div key={tag.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                  <input
                    type="text"
                    value={tag.label}
                    onChange={(e) => updateTagOption(index, { label: e.target.value })}
                    placeholder="标签名称"
                    className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <label className="flex items-center gap-1 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={tag.isCorrect}
                      onChange={(e) => updateTagOption(index, { isCorrect: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    正确
                  </label>
                  <button
                    onClick={() => removeTagOption(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {formData.type === 'calendar' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">日历任务</label>
              <button
                onClick={addCalendarTask}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                添加任务
              </button>
            </div>
            <div className="space-y-2">
              {calendarTasks.map((task, index) => (
                <div key={task.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">任务 {index + 1}</span>
                    <button
                      onClick={() => removeCalendarTask(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={task.roomId}
                      onChange={(e) => updateCalendarTask(index, { roomId: e.target.value })}
                      placeholder="房间号"
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={task.priority}
                      onChange={(e) => updateCalendarTask(index, { priority: Number(e.target.value) })}
                      placeholder="优先级(1-3)"
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={task.requiredMinutes}
                      onChange={(e) => updateCalendarTask(index, { requiredMinutes: Number(e.target.value) })}
                      placeholder="所需分钟"
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {formData.type === 'task' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">保洁任务</label>
              <button
                onClick={addCleaningTask}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="h-3.5 w-3.5" />
                添加任务
              </button>
            </div>
            <div className="space-y-2">
              {cleaningTasks.map((task, index) => (
                <div key={task.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">任务 {index + 1}</span>
                    <button
                      onClick={() => removeCleaningTask(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={task.roomId}
                      onChange={(e) => updateCleaningTask(index, { roomId: e.target.value })}
                      placeholder="房间号"
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <select
                      value={task.type}
                      onChange={(e) => updateCleaningTask(index, { type: e.target.value })}
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="daily">日常清洁</option>
                      <option value="deep">深度清洁</option>
                      <option value="turnover">退房清扫</option>
                      <option value="inspection">巡检</option>
                    </select>
                    <input
                      type="number"
                      value={task.priority}
                      onChange={(e) => updateCleaningTask(index, { priority: Number(e.target.value) })}
                      placeholder="优先级(1-3)"
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-gray-100 p-4">
        {editingQuestion && (
          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              取消
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!formData.description.trim()}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:bg-gray-300"
          >
            <Save className="h-4 w-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
