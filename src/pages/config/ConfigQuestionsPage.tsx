import { useState } from 'react'
import { Plus, Edit2, Search, Tag, CalendarClock, ListTodo } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import QuestionForm from '@/components/config/QuestionForm'
import { useConfigStore } from '@/stores/useConfigStore'
import { mockQuestions } from '@/utils/mockData'
import { cn } from '@/lib/utils'
import type { Question, QuestionType } from '@/types/training'
import type { Question as MockQuestion } from '@/utils/mockData'

const TYPE_LABELS: Record<QuestionType, { label: string; icon: typeof Search; color: string }> = {
  evidence: { label: '证据识别', icon: Search, color: 'bg-indigo-100 text-indigo-600' },
  tag: { label: '标签分析', icon: Tag, color: 'bg-amber-100 text-amber-600' },
  calendar: { label: '日历排序', icon: CalendarClock, color: 'bg-blue-100 text-blue-600' },
  task: { label: '任务分配', icon: ListTodo, color: 'bg-purple-100 text-purple-600' },
}

const LEVEL_NAMES: Record<string, string> = {
  'level-1': '新手入门',
  'level-2': '进阶挑战',
  'level-3': '精英考核',
}

export default function ConfigQuestionsPage() {
  const storeQuestions = useConfigStore((s) => s.questions)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<QuestionType | 'all'>('all')

  const displayQuestions: Question[] = storeQuestions.length > 0
    ? storeQuestions
    : mockQuestions.map((q) => ({
        id: q.id,
        levelId: q.levelId,
        type: q.type,
        description: q.description,
        score: q.score,
        correctReason: q.correctReason,
      }))

  const filteredQuestions = displayQuestions.filter((q) => {
    const matchesSearch = q.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || q.type === filterType
    return matchesSearch && matchesType
  })

  const handleAdd = () => {
    setEditingQuestion(null)
    setShowForm(true)
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingQuestion(null)
  }

  if (showForm) {
    return (
      <div className="h-[calc(100vh-10rem)]">
        <QuestionForm editingQuestion={editingQuestion} onCancel={handleCancel} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">题目管理</h2>
            <p className="text-sm text-neutral-500">共 {filteredQuestions.length} 道题目</p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            新建题目
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索题目描述..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                filterType === 'all' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
              )}
            >
              全部
            </button>
            {(Object.keys(TYPE_LABELS) as QuestionType[]).map((type) => {
              const { label } = TYPE_LABELS[type]
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                    filterType === type ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  题目类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  题目描述
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  所属关卡
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  分值
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {filteredQuestions.map((question) => {
                const typeConfig = TYPE_LABELS[question.type]
                const TypeIcon = typeConfig.icon
                return (
                  <tr key={question.id} className="transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium', typeConfig.color)}>
                        <TypeIcon className="h-3.5 w-3.5" />
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-md truncate text-sm text-neutral-800">{question.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-600">{LEVEL_NAMES[question.levelId] ?? question.levelId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-neutral-800">{question.score}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(question)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                        编辑
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
