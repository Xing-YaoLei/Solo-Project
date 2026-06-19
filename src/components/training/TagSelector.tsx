import { useMemo, useState } from 'react'
import { Tag, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTrainingStore } from '@/stores/useTrainingStore'
import type { TagOption, Question } from '@/types/training'

interface TagSelectorProps {
  question: Question
  reviewText: string
  tagOptions: TagOption[]
  keywords?: string[]
}

export default function TagSelector({ question, reviewText, tagOptions, keywords = [] }: TagSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const submitAnswer = useTrainingStore((s) => s.submitAnswer)

  const highlightedText = useMemo(() => {
    if (!keywords.length) return reviewText
    let result = reviewText
    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, 'g')
      result = result.replace(
        regex,
        '<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">$1</mark>'
      )
    })
    return result
  }, [reviewText, keywords])

  const handleToggle = (tagId: string) => {
    if (submitted) return
    setSelectedIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleSubmit = () => {
    const correctIds = tagOptions.filter((t) => t.isCorrect).map((t) => t.id)
    const correct =
      selectedIds.length === correctIds.length &&
      selectedIds.every((id) => correctIds.includes(id))
    setIsCorrect(correct)
    setSubmitted(true)
    submitAnswer(question.id, { selectedIds, isCorrect: correct })
  }

  const handleReset = () => {
    setSelectedIds([])
    setSubmitted(false)
    setIsCorrect(false)
  }

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3">
        <div className="mb-2 flex items-center gap-2">
          <Tag className="h-5 w-5 text-amber-600" />
          <h3 className="text-base font-semibold text-gray-900">点评标签分析</h3>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
            {question.score}分
          </span>
        </div>
        <p className="text-sm text-gray-600">{question.description}</p>
      </div>

      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <p className="mb-1 text-xs font-medium text-gray-500">住客点评</p>
        <p
          className="text-sm leading-relaxed text-gray-800"
          dangerouslySetInnerHTML={{ __html: highlightedText }}
        />
      </div>

      <div className="flex-1">
        <p className="mb-2 text-xs font-medium text-gray-500">选择所有适用的标签（多选）</p>
        <div className="flex flex-wrap gap-2">
          {tagOptions.map((tag) => {
            const isSelected = selectedIds.includes(tag.id)
            const showCorrect = submitted && tag.isCorrect
            const showWrong = submitted && isSelected && !tag.isCorrect

            return (
              <button
                key={tag.id}
                onClick={() => handleToggle(tag.id)}
                disabled={submitted}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-all',
                  isSelected && !submitted && 'border-amber-500 bg-amber-50 text-amber-700',
                  !isSelected && !submitted && 'border-gray-300 bg-white text-gray-700 hover:border-amber-300',
                  showCorrect && 'border-green-500 bg-green-50 text-green-700',
                  showWrong && 'border-red-500 bg-red-50 text-red-700 line-through',
                  submitted && !isSelected && !tag.isCorrect && 'border-gray-200 bg-gray-50 text-gray-400'
                )}
              >
                <span className="flex items-center gap-1">
                  {showCorrect && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {tag.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {submitted && (
        <div
          className={cn(
            'mb-4 rounded-lg p-3 text-sm',
            isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}
        >
          {isCorrect ? '回答正确！' : '回答有误，请参考正确选项。'}
        </div>
      )}

      <div className="flex gap-2">
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
              disabled={selectedIds.length === 0}
              className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:bg-gray-300"
            >
              提交判断
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
